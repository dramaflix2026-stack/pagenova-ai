/**
 * Kiwify -> PageNova commercial catalog resolver.
 * This is intentionally a pure, fail-closed mapping layer. It does NOT
 * activate entitlements and must be invoked only AFTER signature verification.
 * Product names, prices, and client-supplied plan codes are never identifiers.
 */
export type CommercialCheckoutMapping = {
  id: string;
  plan_code: string;
  provider: string;
  provider_product_id: string | null;
  provider_offer_id: string | null;
  billing_period: "monthly" | "quarterly" | "semiannual" | "annual" | "one_time";
  state: "draft" | "active" | "retired";
};

export type VerifiedKiwifyPurchase = {
  productId: string | null;
  offerId: string | null;
};

export type CheckoutResolution =
  | { status: "matched"; mapping: CommercialCheckoutMapping }
  | { status: "unmapped" | "ambiguous" | "invalid" };

export function resolveKiwifyCheckout(
  purchase: VerifiedKiwifyPurchase,
  mappings: readonly CommercialCheckoutMapping[]
): CheckoutResolution {
  const productId = purchase.productId?.trim() || null;
  const offerId = purchase.offerId?.trim() || null;
  if (!productId && !offerId) return { status: "invalid" };

  const candidates = mappings.filter((mapping) => {
    if (mapping.provider !== "kiwify" || mapping.state !== "active") return false;
    const mappedProduct = mapping.provider_product_id?.trim() || null;
    const mappedOffer = mapping.provider_offer_id?.trim() || null;
    if (!mappedProduct && !mappedOffer) return false;
    // When both identifiers are configured, BOTH must match.
    if (mappedProduct && mappedProduct !== productId) return false;
    if (mappedOffer && mappedOffer !== offerId) return false;
    return true;
  });

  if (candidates.length === 0) return { status: "unmapped" };
  // Multiple matching offers must never accidentally grant a random plan.
  if (candidates.length > 1) return { status: "ambiguous" };
  return { status: "matched", mapping: candidates[0] };
}

/** Kiwify events are not sufficient to determine paid-through dates. */
export function resolveKiwifyCommercialEvent(
  event: string,
  orderStatus: string | null
): "activate" | "revoke" | "defer" | "ignore" {
  const normalized = event.trim().toLowerCase();
  if (normalized === "order_approved" || normalized === "subscription_renewed") {
    return orderStatus?.trim().toLowerCase() === "paid" ? "activate" : "ignore";
  }
  if (normalized === "order_refunded" || normalized === "chargeback") return "revoke";
  if (normalized === "subscription_canceled" || normalized === "subscription_late") {
    return "defer"; // requires verified period-end reconciliation
  }
  return "ignore";
}
