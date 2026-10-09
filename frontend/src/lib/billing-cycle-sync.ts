import { createHmac } from "node:crypto";

export interface VerifiedCycleSync {
  subscriberId: string;
  subscriptionId: string;
  orderId: string;
  cycleStart: string;
  cycleEnd: string;
}

/**
 * Internal-only transport. The caller must resolve subscriberId from a
 * uniquely matched Supabase Auth user, never from the payment payload.
 * Never invoke without independently verified paid period boundaries.
 */
export async function syncVerifiedBillingCycle(input: VerifiedCycleSync): Promise<void> {
  const secret = process.env.PAGENOVA_BILLING_SYNC_SECRET;
  const origin = process.env.PAGENOVA_CRM_API_URL;
  if (!secret || secret.length < 32 || !origin) {
    throw new Error("Billing cycle sync is not configured");
  }
  const target = new URL("/api/internal/pagenova/subscription-cycle", origin);
  if (target.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error("Billing sync requires HTTPS in production");
  }
  const timestamp = String(Date.now());
  const canonical = [
    input.subscriberId,
    input.subscriptionId,
    input.orderId,
    input.cycleStart,
    input.cycleEnd,
    timestamp,
  ].join("\n");
  const signature = createHmac("sha256", secret).update(canonical).digest("hex");
  const response = await fetch(target, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-pagenova-billing-timestamp": timestamp,
      "x-pagenova-billing-signature": signature,
    },
    body: JSON.stringify(input),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Billing cycle sync failed: HTTP ${response.status}`);
  }
}
