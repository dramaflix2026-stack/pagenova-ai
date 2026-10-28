/** Pure, side-effect-free Kiwify event planner for Frente 3.
 * Does not call Supabase, grant credits, create users or touch legacy plans.
 * Call only AFTER the webhook HMAC has been verified against the correct secret.
 */
import {resolveNewKiwifyProduct, type ProductIdConfiguration} from "./kiwify-product-mapping";

export type NewSubscriptionAction = "activate" | "revoke" | "defer" | "ignore";
export type NewSubscriptionDecision = Readonly<{
  action: NewSubscriptionAction;
  reason: string;
  orderId?: string;
  email?: string;
  productId?: string;
  moduleCode?: string;
  modules?: readonly string[];
  revocationStatus?: "refunded" | "chargeback";
}>;

type EventInput = {
  order_id?: unknown;
  order_status?: unknown;
  webhook_event_type?: unknown;
  Product?: {product_id?: unknown};
  Customer?: {email?: unknown};
};

export function planNewKiwifyEvent(
  payload: EventInput,
  config: ProductIdConfiguration,
): NewSubscriptionDecision {
  const mapped = resolveNewKiwifyProduct(payload.Product?.product_id, config);
  if (!mapped) return {action:"ignore",reason:"unmapped_product"};
  const event = typeof payload.webhook_event_type === "string"
    ? payload.webhook_event_type.trim().toLowerCase() : "";
  const orderId = typeof payload.order_id === "string" ? payload.order_id.trim() : "";
  const email = typeof payload.Customer?.email === "string"
    ? payload.Customer.email.trim().toLowerCase() : "";
  if (!orderId || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return {action:"ignore",reason:"missing_identity"};
  const base = {orderId,email,productId:String(payload.Product?.product_id),moduleCode:mapped.code,modules:mapped.modules};
  if (event === "order_approved" || event === "subscription_renewed") {
    if (payload.order_status !== "paid")
      return {...base,action:"ignore",reason:"not_paid"};
    return {...base,action:"activate",reason:"verified_paid_event"};
  }
  if (event === "order_refunded" || event === "chargeback")
    return {...base,action:"revoke",reason:"payment_reversed",revocationStatus:event==="chargeback"?"chargeback":"refunded"};
  if (event === "subscription_canceled" || event === "subscription_late")
    return {...base,action:"defer",reason:"paid_through_reconciliation_required"};
  return {...base,action:"ignore",reason:"unsupported_event"};
}
