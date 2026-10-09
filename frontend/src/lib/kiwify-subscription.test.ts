import { describe, expect, it } from "vitest";
import { kiwifyRecurringEvidence } from "./kiwify-subscription";

const paid = {
  order_id: "order-1",
  order_status: "paid",
  webhook_event_type: "order_approved",
  subscription_id: "sub-1",
  Subscription: {
    id: "sub-1",
    start_date: "2026-10-01T00:00:00Z",
    next_payment: "2026-11-01T00:00:00Z",
    status: "active",
    plan: { frequency: "monthly" },
    customer_access: { has_access: true },
    charges: { completed: [{ order_id: "order-1", status: "paid" }] },
  },
};

describe("Kiwify recurring evidence", () => {
  it("recognizes matching completed paid charge", () => {
    expect(kiwifyRecurringEvidence(paid)?.subscriptionId).toBe("sub-1");
  });
  it("rejects an unpaid charge", () => {
    expect(kiwifyRecurringEvidence({ ...paid, order_status: "waiting_payment" })).toBeNull();
  });
  it("rejects mismatched subscription", () => {
    expect(kiwifyRecurringEvidence({ ...paid, subscription_id: "another" })).toBeNull();
  });
  it("rejects missing charge", () => {
    expect(kiwifyRecurringEvidence({ ...paid, Subscription: { ...paid.Subscription, charges: { completed: [] } } })).toBeNull();
  });
  it("rejects revoked access", () => {
    expect(kiwifyRecurringEvidence({ ...paid, Subscription: { ...paid.Subscription, customer_access: { has_access: false } } })).toBeNull();
  });
  it("rejects nonmonthly plan", () => {
    expect(kiwifyRecurringEvidence({ ...paid, Subscription: { ...paid.Subscription, plan: { frequency: "weekly" } } })).toBeNull();
  });
  it("rejects invalid dates", () => {
    expect(kiwifyRecurringEvidence({ ...paid, Subscription: { ...paid.Subscription, next_payment: "invalid" } })).toBeNull();
  });
});
