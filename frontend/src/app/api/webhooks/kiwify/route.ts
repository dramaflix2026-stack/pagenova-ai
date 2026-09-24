import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "PageNova AI",
    webhook: "kiwify",
  });
}

export async function POST(request: NextRequest) {
  const configuredToken = process.env.KIWIFY_WEBHOOK_TOKEN;

  if (!configuredToken) {
    console.error("[KIWIFY] KIWIFY_WEBHOOK_TOKEN is not configured.");
    return NextResponse.json(
      { ok: false, error: "server_not_configured" },
      { status: 500 }
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

  /*
   * Fase de integração:
   * ainda não altera entitlements.
   * Primeiro capturamos o formato real enviado pela Kiwify.
   *
   * Não registramos o payload completo para evitar expor
   * dados pessoais do comprador nos logs.
   */
  const body =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  const customer =
    body.Customer && typeof body.Customer === "object"
      ? (body.Customer as Record<string, unknown>)
      : {};

  const product =
    body.Product && typeof body.Product === "object"
      ? (body.Product as Record<string, unknown>)
      : {};

  console.log("[KIWIFY] Webhook received", {
    keys: Object.keys(body),
    customerKeys: Object.keys(customer),
    productKeys: Object.keys(product),
    event:
      body.webhook_event_type ??
      body.event ??
      body.event_type ??
      body.type ??
      null,
    orderStatus:
      typeof body.order_status === "string"
        ? body.order_status
        : null,
    hasOrderId:
      typeof body.order_id === "string" &&
      body.order_id.length > 0,
  });

  return NextResponse.json({
    ok: true,
    received: true,
  });
}
