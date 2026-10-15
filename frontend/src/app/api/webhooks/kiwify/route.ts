import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EntitlementStatus =
  | "active"
  | "refunded"
  | "chargeback";

type KiwifyPayload = {
  order_id?: string;
  order_ref?: string;
  order_status?: string;
  approved_date?: string | null;
  webhook_event_type?: string;

  Product?: {
    product_id?: string;
    product_name?: string;
  };

  Customer?: {
    email?: string;
  };
};

/**
 * The webhook endpoint is shared by PageNova plans, and a valid Kiwify HMAC
 * authenticates the sender—not the product purchased. Kiwify's "test" action
 * sends fictional, paid "Example product" events with valid HMAC signatures.
 * Do not grant subscriptions or credits for arbitrary signed Kiwify products.
 */
function isSupportedPageNovaProduct(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const product = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  const root = /^page\s*nova\s*ai\s*-\s*/;
  if (!root.test(product)) return false;
  const plan = product.replace(root, "").trim();
  return (
    /^(?:assinatura\s*)?r?\$?\s*147(?:[,.]00)?$/.test(plan) ||
    /^pre\s*-?\s*venda$/.test(plan) ||
    /^(?:assinatura\s*)?trimestral\s*r?\$?\s*397(?:[,.]00)?$/.test(plan) ||
    /^(?:assinatura\s*)?semestral\s*r?\$?\s*747(?:[,.]00)?$/.test(plan) ||
    /^(?:assinatura\s*)?anual\s*r?\$?\s*1297(?:[,.]00)?$/.test(plan) ||
    /^acesso a plataforma$/.test(plan)
  );
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return normalized || null;
}

function getStatus(
  event: string
): EntitlementStatus | null {
  // Renewals are paid subscription orders just like initial approvals.
  // Both routes must activate the same entitlement/credit cycle by order_id.
  if (event === "order_approved" || event === "subscription_renewed") {
    return "active";
  }

  if (event === "order_refunded") {
    return "refunded";
  }

  if (event === "chargeback") {
    return "chargeback";
  }

  return null;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "pagenova-kiwify-webhook",
  });
}

export async function POST(request: NextRequest) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseSecret =
    process.env.SUPABASE_SECRET_KEY;

  // A Kiwify can issue a distinct signature token for each webhook.
  // Existing monthly installations continue using the legacy global token
  // until their per-plan secret is configured in Vercel.
  const webhookToken = process.env.KIWIFY_WEBHOOK_TOKEN;

  if (
    !supabaseUrl ||
    !supabaseSecret ||
    !webhookToken
  ) {
    console.error(
      "[KIWIFY] Server configuration missing."
    );

    return NextResponse.json(
      {
        ok: false,
        error: "server_configuration_missing",
      },
      {
        status: 500,
      }
    );
  }

  // Kiwify's product-sales webhooks add a signature query parameter with
  // HMAC-SHA1(JSON.stringify(payload), webhook token). The configured URL
  // itself normally does not include the signature. Older integrations used
  // an exact static token; keep that legacy format during migration.
  const signature = request.nextUrl.searchParams.get("signature") ?? "";
  let rawBody: string;
  let payload: KiwifyPayload;
  try {
    const length = Number(request.headers.get("content-length") || "0");
    if (length > 1_048_576) {
      return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
    }
    rawBody = await request.text();
    if (rawBody.length > 1_048_576) {
      return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
    }
    payload = JSON.parse(rawBody) as KiwifyPayload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Invalid payload shape");
    }
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const safeEquals = (left: string, right: string) => {
    const a = Buffer.from(left, "utf8");
    const b = Buffer.from(right, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  };
  // Prefer the dedicated secret for the exact commercial product. A global
  // secret remains a backward-compatible fallback only for products not yet
  // migrated, preventing a monthly token from authenticating annual events.
  const purchasedPlan = String(payload.Product?.product_name ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[–—]/g, "-").trim();
  let planSecret: string | undefined;
  if (/\b(trimestral|397(?:[,.]00)?)\b/.test(purchasedPlan)) {
    planSecret = process.env.KIWIFY_WEBHOOK_TOKEN_QUARTERLY;
  } else if (/\b(semestral|747(?:[,.]00)?)\b/.test(purchasedPlan)) {
    planSecret = process.env.KIWIFY_WEBHOOK_TOKEN_SEMIANNUAL;
  } else if (/\b(anual|1297(?:[,.]00)?)\b/.test(purchasedPlan)) {
    planSecret = process.env.KIWIFY_WEBHOOK_TOKEN_ANNUAL;
  } else if (/pre\s*-?\s*venda/.test(purchasedPlan)) {
    planSecret = process.env.KIWIFY_WEBHOOK_TOKEN_PRESALE;
  } else if (/assinatura|147/.test(purchasedPlan)) {
    planSecret = process.env.KIWIFY_WEBHOOK_TOKEN_MONTHLY;
  }
  const signingToken = planSecret?.trim() || webhookToken;
  const signatureIsHex = /^[0-9a-f]{40}$/i.test(signature);
  const signedJson = JSON.stringify(payload);
  const expectedCanonical = createHmac("sha1", signingToken)
    .update(signedJson, "utf8").digest("hex");
  const expectedRaw = createHmac("sha1", signingToken)
    .update(rawBody, "utf8").digest("hex");
  const validSignature =
    (signatureIsHex && (
      safeEquals(signature.toLowerCase(), expectedCanonical) ||
      safeEquals(signature.toLowerCase(), expectedRaw)
    )) ||
    // Legacy fixed-token URLs remain authenticated during migration.
    safeEquals(signature, signingToken);

  if (!validSignature) {
    console.warn("[KIWIFY] Authentication failed", {
      reason: signature ? "invalid" : "missing",
      format: signatureIsHex ? "hmac" : "other",
    });
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const event =
    typeof payload.webhook_event_type === "string"
      ? payload.webhook_event_type
          .trim()
          .toLowerCase()
      : "";

  const status = getStatus(event);

  // Reject demo sales even when Kiwify signs them correctly. Return 200 so
  // the test sender does not retry an intentionally ignored event.
  if (!isSupportedPageNovaProduct(payload.Product?.product_name)) {
    console.warn("[KIWIFY] Signed event ignored: product is not a PageNova plan.", {
      event: event || "unknown",
    });
    return NextResponse.json({
      ok: true,
      processed: false,
      reason: "unsupported_product",
    });
  }

  if (!status) {
    console.log(
      "[KIWIFY] Event ignored.",
      {
        event:
          event || "unknown",
      }
    );

    return NextResponse.json({
      ok: true,
      processed: false,
    });
  }

  if (
    status === "active" &&
    payload.order_status !== "paid"
  ) {
    console.log(
      "[KIWIFY] Activation ignored because order is not marked paid."
    );

    return NextResponse.json({
      ok: true,
      processed: false,
    });
  }

  const orderId =
    typeof payload.order_id === "string"
      ? payload.order_id.trim()
      : "";

  const email =
    normalizeEmail(payload.Customer?.email);

  if (!orderId || !email) {
    return NextResponse.json(
      {
        ok: false,
        error: "required_fields_missing",
      },
      {
        status: 400,
      }
    );
  }

  const admin = createClient(
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

  const now =
    new Date().toISOString();

  // An approved pre-sale order may have been reconciled manually before
  // its webhook was configured. Kiwify's short order_ref is the only ID
  // available on the sales receipt; keep that alias for entitlement and
  // credit-cycle idempotency when the later webhook supplies the full order_id.
  const orderRef = typeof payload.order_ref === "string"
    ? payload.order_ref.trim()
    : "";
  let effectiveOrderId = orderId;
  let manuallyReconciled = false;
  if (orderRef && orderRef !== orderId) {
    const { data: alias, error: aliasError } = await admin
      .from("entitlements")
      .select("provider_order_id,status,email,purchase_data")
      .eq("provider", "kiwify")
      .eq("provider_order_id", orderRef)
      .maybeSingle();
    if (aliasError) {
      console.error("[KIWIFY] Order reference reconciliation lookup failed", {
        code: aliasError.code,
      });
      return NextResponse.json({ ok: false, error: "order_ref_lookup_failed" }, { status: 500 });
    }
    if (alias) {
      const raw = alias.purchase_data as Record<string,unknown> | null;
      const previousCanonical = typeof raw?.canonical_order_id === "string"
        ? raw.canonical_order_id : "";
      // Never join different buyers or orders, even for a valid webhook.
      if (alias.email.trim().toLowerCase() !== email ||
          (previousCanonical && previousCanonical !== orderId)) {
        return NextResponse.json({ ok: false, error: "order_ref_conflict" }, { status: 409 });
      }
      if (raw?.source === "owner_verified_manual_reconciliation") {
        effectiveOrderId = orderRef;
        manuallyReconciled = true;
        if (status === "active" && (alias.status === "refunded" || alias.status === "chargeback")) {
          return NextResponse.json({ ok: true, processed: false, reason: "order_already_revoked" });
        }
      }
    }
  }

  // Prevent older approval/renewal deliveries from resurrecting an already
  // refunded or charged-back order. This must work even if credits are disabled.
  if (status === "active") {
    const { data: existingOrder, error: existingOrderError } = await admin
      .from("entitlements")
      .select("status,email")
      .eq("provider", "kiwify")
      .eq("provider_order_id", effectiveOrderId)
      .maybeSingle();
    if (existingOrderError) {
      console.error("[KIWIFY] Prior order lookup failed.", { code: existingOrderError.code });
      return NextResponse.json({ ok: false, error: "order_lookup_failed" }, { status: 500 });
    }
    if (existingOrder && existingOrder.email.trim().toLowerCase() !== email) {
      return NextResponse.json({ ok: false, error: "order_email_conflict" }, { status: 409 });
    }
    if (existingOrder && ["refunded","chargeback","revoked"].includes(existingOrder.status)) {
      return NextResponse.json({ ok: true, processed: false, reason: "order_already_revoked" });
    }
  }

  const purchaseData = {
    order_ref:
      payload.order_ref ?? null,
    ...(manuallyReconciled ? {
      source: "owner_verified_manual_reconciliation",
      canonical_order_id: orderId,
    } : {}),

    order_status:
      payload.order_status ?? null,

    event,
    subscription_event: event === "subscription_renewed" ? "renewed" : null,

    product_id:
      payload.Product?.product_id ?? null,

    product_name:
      payload.Product?.product_name ?? null,
  };

  if (status === "active") {
    const purchasedAt =
      payload.approved_date || now;

    const {
      error,
    } = await admin
      .from("entitlements")
      .upsert(
        {
          email,
          product: "pagenova-ai",
          status: "active",
          provider: "kiwify",
          provider_order_id: effectiveOrderId,
          provider_customer_id: null,
          purchase_data: purchaseData,
          purchased_at: purchasedAt,
          revoked_at: null,
          updated_at: now,
        },
        {
          onConflict:
            "provider,provider_order_id",
        }
      );

    if (error) {
      console.error(
        "[KIWIFY] Entitlement persistence failed.",
        {
          code: error.code,
        }
      );

      return NextResponse.json(
        {
          ok: false,
          error: "persistence_failed",
        },
        {
          status: 500,
        }
      );
    }
  } else {
    const {
      data: existing,
      error: lookupError,
    } = await admin
      .from("entitlements")
      .select(
        "id,purchased_at"
      )
      .eq(
        "provider",
        "kiwify"
      )
      .eq(
        "provider_order_id",
        effectiveOrderId
      )
      .maybeSingle();

    if (lookupError) {
      console.error(
        "[KIWIFY] Entitlement lookup failed.",
        {
          code: lookupError.code,
        }
      );

      return NextResponse.json(
        {
          ok: false,
          error: "lookup_failed",
        },
        {
          status: 500,
        }
      );
    }

    if (existing) {
      const {
        error: updateError,
      } = await admin
        .from("entitlements")
        .update({
          email,
          status,
          purchase_data: purchaseData,
          revoked_at: now,
          updated_at: now,
        })
        .eq(
          "id",
          existing.id
        );

      if (updateError) {
        console.error(
          "[KIWIFY] Entitlement revocation failed.",
          {
            code: updateError.code,
          }
        );

        return NextResponse.json(
          {
            ok: false,
            error: "revocation_failed",
          },
          {
            status: 500,
          }
        );
      }
    } else {
      const {
        error: insertError,
      } = await admin
        .from("entitlements")
        .insert({
          email,
          product: "pagenova-ai",
          status,
          provider: "kiwify",
          provider_order_id: effectiveOrderId,
          provider_customer_id: null,
          purchase_data: purchaseData,
          purchased_at: null,
          revoked_at: now,
          updated_at: now,
        });

      if (insertError) {
        console.error(
          "[KIWIFY] Revoked entitlement persistence failed.",
          {
            code: insertError.code,
          }
        );

        return NextResponse.json(
          {
            ok: false,
            error: "persistence_failed",
          },
          {
            status: 500,
          }
        );
      }
    }
  }

  // Subscription credits are tied to the actual paid Kiwify order. Repeated
  // deliveries never refill a cycle; refund/chargeback revoke that order only.
  // Enable only after the PageNova Supabase migration and usage backfill.
  if (process.env.PAGENOVA_CREDITS_ENFORCE === "1") {
    if (status === "active") {
      const approvedAt=payload.approved_date ? new Date(payload.approved_date) : new Date();
      const safeDate=Number.isNaN(approvedAt.getTime()) ? now : approvedAt.toISOString();
      const {data:cycle,error:creditsError}=await admin.rpc("pagenova_credits_activate",{
        p_email:email,p_order_id:effectiveOrderId,p_started_at:safeDate,
      });
      if(creditsError){
        console.error("[KIWIFY] Credit-cycle activation failed",{code:creditsError.code});
        return NextResponse.json({ok:false,error:"credit_cycle_failed"},{status:500});
      }
      const state=(cycle as {status?:string}|null)?.status;
      if(state==="refunded"||state==="chargeback"){
        // A delayed approval cannot resurrect a purchase already reversed.
        const {error:rollbackError}=await admin.from("entitlements").update({
          status:state,revoked_at:now,updated_at:now,
        }).eq("provider","kiwify").eq("provider_order_id",effectiveOrderId);
        if(rollbackError){
          console.error("[KIWIFY] Failed to restore revoked entitlement",{code:rollbackError.code});
          return NextResponse.json({ok:false,error:"revocation_persistence_failed"},{status:500});
        }
        return NextResponse.json({ok:true,processed:false,reason:"order_already_revoked"});
      }
    } else {
      const {error:creditsError}=await admin.rpc("pagenova_credits_revoke",{
        p_order_id:effectiveOrderId,p_status:status,p_email:email,
      });
      if(creditsError){
        console.error("[KIWIFY] Credit-cycle revocation failed",{code:creditsError.code});
        return NextResponse.json({ok:false,error:"credit_cycle_failed"},{status:500});
      }
    }
  }

  if (status === "active") {
    let authUserExists = false;
    let buyerLookupFailed = false;
    let page = 1;

    while (!authUserExists && page <= 10) {
      const {
        data: usersData,
        error: usersError,
      } = await admin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

      if (usersError) {
        console.error(
          "[KIWIFY] Buyer account lookup failed.",
          {
            code: usersError.code,
          }
        );

        buyerLookupFailed = true;
        break;
      }

      authUserExists = usersData.users.some(
        (user) =>
          user.email?.trim().toLowerCase() === email
      );

      if (
        authUserExists ||
        usersData.users.length < 1000
      ) {
        break;
      }

      page += 1;
    }

    if (buyerLookupFailed) {
      return NextResponse.json(
        {
          ok: false,
          processed: false,
          error: "buyer_account_lookup_failed",
        },
        {
          status: 500,
        }
      );
    }

    if (!authUserExists) {
      const {
        error: inviteError,
      } =
        await admin.auth.admin.inviteUserByEmail(
          email,
          {
            redirectTo:
              "https://pagenovaai.com.br/auth/callback?next=/reset-password",
            data: {
              source: "kiwify",
              product: "pagenova-ai",
            },
          }
        );

      if (inviteError) {
        const message =
          inviteError.message.toLowerCase();

        const alreadyExists =
          message.includes("already") ||
          message.includes("registered") ||
          message.includes("exists");

        if (!alreadyExists) {
          console.error(
            "[KIWIFY] Buyer invitation failed.",
            {
              code: inviteError.code,
            }
          );

          return NextResponse.json(
            {
              ok: false,
              processed: false,
              error: "buyer_invitation_failed",
            },
            {
              status: 500,
            }
          );
        } else {
          console.log(
            "[KIWIFY] Buyer account already exists."
          );
        }
      } else {
        console.log(
          "[KIWIFY] Buyer invitation sent."
        );
      }
    } else {
      console.log(
        "[KIWIFY] Buyer account already exists."
      );
    }
  }

  console.log(
    "[KIWIFY] Entitlement updated.",
    {
      event,
      status,
      hasOrderId: true,
      hasEmail: true,
    }
  );

  return NextResponse.json({
    ok: true,
    processed: true,
    status,
  });
}
