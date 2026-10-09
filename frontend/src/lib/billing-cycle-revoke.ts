import { createHmac } from "node:crypto";

/** Only call after verifying the payment provider's signed refund event. */
export async function revokeBillingOrder(orderId: string, reason: "refunded" | "chargeback"): Promise<void> {
  if (!/^[a-zA-Z0-9_:-]{1,128}$/.test(orderId)) throw new Error("Invalid payment order");
  const secret = process.env.PAGENOVA_BILLING_SYNC_SECRET;
  const origin = process.env.PAGENOVA_CRM_API_URL;
  if (!secret || secret.length < 32 || !origin) throw new Error("Billing revocation is not configured");
  const target = new URL("/api/internal/pagenova/revoke-subscription-order", origin);
  if (target.username || target.password || target.search || target.hash ||
      (process.env.NODE_ENV === "production" && target.protocol !== "https:")) {
    throw new Error("Invalid billing revocation destination");
  }
  const timestamp = String(Date.now());
  const signature = createHmac("sha256", secret)
    .update(["revoke", orderId, reason, timestamp].join("\n")).digest("hex");
  const response = await fetch(target, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-pagenova-billing-timestamp": timestamp,
      "x-pagenova-billing-signature": signature,
    },
    body: JSON.stringify({ orderId, reason }),
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Billing revocation failed: HTTP ${response.status}`);
}
