import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { kiwifyRecurringEvidence, verifiedPaidBillingPeriod } from "@/lib/kiwify-subscription";
import { resolveBillingSubscriberId } from "@/lib/billing-subscriber-identity";
import { syncVerifiedBillingCycle } from "@/lib/billing-cycle-sync";
import { revokeBillingOrder } from "@/lib/billing-cycle-revoke";

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
  subscription_id?: string;
  Subscription?: {
    id?: string;
    start_date?: string;
    next_payment?: string;
    status?: string;
    plan?: { frequency?: string };
    customer_access?: { has_access?: boolean; active_period?: boolean; access_until?: string };
    charges?: { completed?: Array<{ order_id?: string; status?: string }> };
  };

  Product?: {
    product_id?: string;
    product_name?: string;
  };

  Customer?: {
    email?: string;
  };
};

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
  if (event === "order_approved") {
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

  const webhookToken =
    process.env.KIWIFY_WEBHOOK_TOKEN;

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

  const signature =
    request.nextUrl.searchParams.get("signature");

  const provided = Buffer.from(signature ?? "", "utf8");
  const expected = Buffer.from(webhookToken, "utf8");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    console.warn("[KIWIFY] Webhook authentication rejected.", {
      reason: signature ? "invalid_signature" : "missing_signature",
    });
    return NextResponse.json(
      {
        ok: false,
        error: "signature_missing",
      },
      {
        status: 401,
      }
    );
  }


  let payload: KiwifyPayload;

  try {
    payload =
      (await request.json()) as KiwifyPayload;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_json",
      },
      {
        status: 400,
      }
    );
  }

  const event =
    typeof payload.webhook_event_type === "string"
      ? payload.webhook_event_type
          .trim()
          .toLowerCase()
      : "";

  const status = getStatus(event);

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
    event === "order_approved" &&
    payload.order_status !== "paid"
  ) {
    console.log(
      "[KIWIFY] Approved event ignored because order is not paid."
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

  // Never infer a subscription renewal date from order approval alone.
  // A verified billing interval must be provided by the payment provider
  // before the CRM may activate cycle-based usage quotas.
  const recurringEvidence = kiwifyRecurringEvidence(payload);
  const billingCycleStatus = recurringEvidence ? "paid_charge_verified_cycle_pending" : "awaiting_provider_verified_period";

  const purchaseData = {
    order_ref:
      payload.order_ref ?? null,

    order_status:
      payload.order_status ?? null,

    event,
    billing_cycle_status: billingCycleStatus,
    recurring_evidence: recurringEvidence,

    product_id:
      payload.Product?.product_id ?? null,

    product_name:
      payload.Product?.product_name ?? null,
  };

  if (status === "active") {
    // A delayed/replayed approval must never restore a revoked order.
    const { data: priorOrder, error: priorError } = await admin
      .from("entitlements")
      .select("status")
      .eq("provider", "kiwify")
      .eq("provider_order_id", orderId)
      .maybeSingle();
    if (priorError) {
      return NextResponse.json({ ok: false, error: "entitlement_lookup_failed" }, { status: 500 });
    }
    if (priorOrder?.status === "refunded" || priorOrder?.status === "chargeback") {
      return NextResponse.json({ ok: true, processed: false, reason: "order_already_revoked" });
    }
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
          provider_order_id: orderId,
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
        orderId
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
          provider_order_id: orderId,
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

  // Refunds and chargebacks must also revoke the CRM quota cycle.
  // Return a retryable error if the second store cannot be synchronized.
  if (status === "refunded" || status === "chargeback") {
    try {
      await revokeBillingOrder(orderId, status);
    } catch (error) {
      console.error("[KIWIFY] CRM cycle revocation pending.", {
        reason: error instanceof Error ? error.message : "unknown",
      });
      return NextResponse.json(
        { ok: false, error: "billing_cycle_revocation_failed" },
        { status: 503 },
      );
    }
  }

  // Activate quotas only with explicit provider-verified cycle boundaries and
  // an unambiguous Supabase Auth subscriber ID. Never guess from next_payment.
  if (status === "active" && recurringEvidence) {
    const paidPeriod = verifiedPaidBillingPeriod(payload);
    if (paidPeriod) {
      try {
        const subscriberId = await resolveBillingSubscriberId(
          email,
          (args) => admin.auth.admin.listUsers(args),
        );
        if (!subscriberId) {
          console.warn("[KIWIFY] Paid cycle sync deferred: buyer has no Auth account.");
        } else {
          await syncVerifiedBillingCycle({
            subscriberId,
            subscriptionId: recurringEvidence.subscriptionId,
            orderId,
            ...paidPeriod,
          });
        }
      } catch (error) {
        console.error("[KIWIFY] Paid cycle sync deferred.", {
          reason: error instanceof Error ? error.message : "unknown",
        });
        return NextResponse.json(
          { ok: false, error: "billing_cycle_sync_failed" },
          { status: 503 },
        );
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
              "https://www.pagenovaai.com.br/auth/callback?next=/reset-password",
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
