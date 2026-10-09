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
  const validId = (value: string) => /^[a-zA-Z0-9_:-]{1,128}$/.test(value);
  if (![input.subscriberId, input.subscriptionId, input.orderId].every(validId)) {
    throw new Error("Invalid billing cycle identity");
  }
  const isoUtc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[.]\d{1,3})?Z$/;
  if (!isoUtc.test(input.cycleStart) || !isoUtc.test(input.cycleEnd)) {
    throw new Error("Invalid verified billing cycle timestamp format");
  }
  const start = Date.parse(input.cycleStart);
  const end = Date.parse(input.cycleEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 35 * 86400000) {
    throw new Error("Invalid verified billing cycle interval");
  }
  const secret = process.env.PAGENOVA_BILLING_SYNC_SECRET;
  const origin = process.env.PAGENOVA_CRM_API_URL;
  if (!secret || secret.length < 32 || !origin) {
    throw new Error("Billing cycle sync is not configured");
  }
  const target = new URL("/api/internal/pagenova/subscription-cycle", origin);
  if (target.username || target.password || target.search || target.hash) {
    throw new Error("Invalid billing sync destination");
  }
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
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Billing cycle sync failed: HTTP ${response.status}`);
  }
}
