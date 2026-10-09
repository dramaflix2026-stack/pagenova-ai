import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { revokeBillingOrder } from "./billing-cycle-revoke";

describe("billing revocation transport", () => {
  beforeEach(() => {
    vi.stubEnv("PAGENOVA_BILLING_SYNC_SECRET", "s".repeat(40));
    vi.stubEnv("PAGENOVA_CRM_API_URL", "https://crm.example.test");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  it("signs one payment and never follows redirects", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", request);
    await revokeBillingOrder("order-123", "refunded");
    const [target, options] = request.mock.calls[0];
    expect(String(target)).toContain("/revoke-subscription-order");
    expect(options.redirect).toBe("manual");
    expect(JSON.parse(options.body)).toEqual({ orderId: "order-123", reason: "refunded" });
    expect(options.headers["x-pagenova-billing-signature"]).toMatch(/^[a-f0-9]{64}$/);
  });
  it("rejects invalid order identifiers", async () => {
    await expect(revokeBillingOrder("bad/order", "chargeback")).rejects.toThrow("Invalid payment order");
  });
  it("surfaces failed CRM requests", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(revokeBillingOrder("order-123", "chargeback")).rejects.toThrow("HTTP 503");
  });
});
