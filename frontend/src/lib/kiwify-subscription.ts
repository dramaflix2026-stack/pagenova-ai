/** Parse only provider-confirmed recurring charge evidence; never infer a paid cycle. */
export interface KiwifyRecurringPayload {
  order_id?: string;
  order_status?: string;
  webhook_event_type?: string;
  subscription_id?: string;
  Subscription?: {
    id?: string;
    start_date?: string;
    next_payment?: string;
    status?: string;
    plan?: { frequency?: string };
    customer_access?: { has_access?: boolean; active_period?: boolean; access_until?: string };
    charges?: { completed?: Array<{ order_id?: string; status?: string; created_at?: string }> };
  };
}
export interface RecurringChargeEvidence {
  subscriptionId: string;
  orderId: string;
  subscriptionStart: string;
  nextPayment: string;
  chargeCreatedAt: string | null;
}
export function kiwifyRecurringEvidence(payload: KiwifyRecurringPayload): RecurringChargeEvidence | null {
  const subscription = payload.Subscription;
  const orderId = payload.order_id;
  if (!subscription || !orderId || payload.order_status !== 'paid') return null;
  if (payload.webhook_event_type !== 'order_approved') return null;
  if (!subscription.id || payload.subscription_id !== subscription.id) return null;
  if (subscription.status !== 'active' || subscription.plan?.frequency !== 'monthly') return null;
  if (subscription.customer_access?.has_access !== true) return null;
  const charge = subscription.charges?.completed?.find(
    (item) => item.order_id === orderId && item.status === 'paid',
  );
  if (!charge) return null;
  const start = subscription.start_date;
  const next = subscription.next_payment;
  if (!start || !next || !Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(next))) return null;
  if (Date.parse(next) <= Date.parse(start)) return null;
  // A future charge schedule is not a paid-cycle boundary. Do not activate quotas here.
  if (charge.created_at && !Number.isFinite(Date.parse(charge.created_at))) return null;
  return {
    subscriptionId: subscription.id,
    orderId,
    subscriptionStart: start,
    nextPayment: next,
    chargeCreatedAt: charge.created_at ?? null,
  };
}
