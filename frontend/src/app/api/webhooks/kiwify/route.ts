import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function normalizeEmail(value: unknown): string | null {
  const email = asString(value)?.toLowerCase() ?? null;

  if (!email || !email.includes("@")) {
    return null;
  }

  return email;
}

function mapStatus(event: string | null): {
  status: "active" | "refunded" | "chargeback";
  revoked: boolean;
} | null {
  if (event === "order_approved") {
    return { status: "active", revoked: false };
  }

  if (
    event === "order_refunded" ||
    event === "refund" ||
    event === "refunded"
  ) {
    return { status: "refunded", revoked: true };
  }

  if (
    event === "chargeback" ||
    event === "order_chargeback" ||
    event === "order_chargedback"
  ) {
    return { status: "chargeback", revoked: true };
  }

  return null;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "PageNova AI",
    webhook: "kiwify",
  });
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  const webhookToken = process.env.KIWIFY_WEBHOOK_TOKEN;

  if (!supabaseUrl || !supabaseSecret || !webhookToken) {
    console.error("[KIWIFY] Server configuration incomplete.");

    return NextResponse.json(
      { ok: false, error: "server_not_configured" },
      { status: 500 }
    );
  }

  const signature = request.nextUrl.searchParams.get("signature");

  if (!signature) {
    console.warn("[KIWIFY] Request rejected: missing signature.");

    return NextResponse.json(
      { ok: false, error: "missing_signature" },
      { status: 401 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }

  const body = asObject(payload);
  const customer = asObject(body.Customer);
  const product = asObject(body.Product);

  const event =
    asString(body.webhook_event_type) ??
    asString(body.event) ??
    asString(body.event_type) ??
    asString(body.type);

  const mapped = mapStatus(event);

  if (!mapped) {
    console.log("[KIWIFY] Event ignored.", {
      event,
    });

    return NextResponse.json({
      ok: true,
      ignored: true,
    });
  }

  const orderId = asString(body.order_id);
  const orderRef = asString(body.order_ref);
  const orderStatus = asString(body.order_status);
  const email = normalizeEmail(customer.email);
  const productId = asString(product.product_id);
  const productName = asString(product.product_name);

  if (!orderId || !email) {
    console.warn("[KIWIFY] Request rejected: required fields missing.", {
      event,
      hasOrderId: Boolean(orderId),
      hasEmail: Boolean(email),
    });

    return NextResponse.json(
      { ok: false, error: "missing_required_fields" },
      { status: 400 }
    );
  }

  if (
    event === "order_approved" &&
    orderStatus !== "paid"
  ) {
    console.warn("[KIWIFY] Approved event without paid status.", {
      event,
      orderStatus,
    });

    return NextResponse.json(
      { ok: false, error: "invalid_order_status" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseSecret,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  const now = new Date().toISOString();

  const entitlement = {
    email,
    product: "pagenova-ai",
    status: mapped.status,
    provider: "kiwify",
    provider_order_id: orderId,
    provider_customer_id: null,
    purchase_data: {
      order_ref: orderRef,
      order_status: orderStatus,
      event,
      product_id: productId,
      product_name: productName,
    },
    purchased_at:
      mapped.status === "active"
        ? asString(body.approved_date) ?? now
        : null,
    revoked_at:
      mapped.revoked
        ? now
        : null,
    updated_at: now,
  };

  const { error } = await supabase
    .from("entitlements")
    .upsert(entitlement, {
      onConflict: "provider,provider_order_id",
    });

  if (error) {
    console.error("[KIWIFY] Entitlement persistence failed.", {
      code: error.code,
    });

    return NextResponse.json(
      { ok: false, error: "persistence_failed" },
      { status: 500 }
    );
  }

  console.log("[KIWIFY] Entitlement updated.", {
    event,
    status: mapped.status,
    hasOrderId: true,
    hasEmail: true,
  });

  return NextResponse.json({
    ok: true,
    processed: true,
    status: mapped.status,
  });
}
