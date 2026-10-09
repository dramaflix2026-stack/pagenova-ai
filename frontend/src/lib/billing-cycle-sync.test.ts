import { afterEach, describe, expect, it, vi } from "vitest";
import { syncVerifiedBillingCycle } from "./billing-cycle-sync";

const originalSecret = process.env.PAGENOVA_BILLING_SYNC_SECRET;
const originalUrl = process.env.PAGENOVA_CRM_API_URL;
const input = {
  subscriberId: "user-123",
  subscriptionId: "sub-123",
  orderId: "order-123",
  cycleStart: "2026-10-01T00:00:00Z",
  cycleEnd: "2026-11-01T00:00:00Z",
};

afterEach(() => {
  if (originalSecret === undefined) delete process.env.PAGENOVA_BILLING_SYNC_SECRET;
  else process.env.PAGENOVA_BILLING_SYNC_SECRET = originalSecret;
  if (originalUrl === undefined) delete process.env.PAGENOVA_CRM_API_URL;
  else process.env.PAGENOVA_CRM_API_URL = originalUrl;
  vi.unstubAllGlobals();
});

describe("billing cycle sync transport", () => {
  it("rejects missing configuration without calling the CRM", async () => {
    delete process.env.PAGENOVA_BILLING_SYNC_SECRET;
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(syncVerifiedBillingCycle(input)).rejects.toThrow("not configured");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("signs the exact payload with a timestamp", async () => {
    process.env.PAGENOVA_BILLING_SYNC_SECRET = "a".repeat(40);
    process.env.PAGENOVA_CRM_API_URL = "https://crm.example.test";
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetcher);
    await syncVerifiedBillingCycle(input);
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, options] = fetcher.mock.calls[0];
    expect(String(url)).toBe("https://crm.example.test/api/internal/pagenova/subscription-cycle");
    expect(JSON.parse(options.body)).toEqual(input);
    expect(options.headers["x-pagenova-billing-signature"]).toMatch(/^[a-f0-9]{64}$/);
    expect(options.headers["x-pagenova-billing-timestamp"]).toMatch(/^[0-9]{13}$/);
  });

  it("rejects invalid cycles without network calls", async () => {
    process.env.PAGENOVA_BILLING_SYNC_SECRET = "a".repeat(40);
    process.env.PAGENOVA_CRM_API_URL = "https://crm.example.test";
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(syncVerifiedBillingCycle({
      ...input, cycleEnd: input.cycleStart,
    })).rejects.toThrow("Invalid verified billing cycle interval");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects untrusted subscriber IDs", async () => {
    await expect(syncVerifiedBillingCycle({
      ...input, subscriberId: "other user",
    })).rejects.toThrow("Invalid billing cycle identity");
  });

  it("never follows redirects with signed billing headers", async () => {
    process.env.PAGENOVA_BILLING_SYNC_SECRET = "a".repeat(40);
    process.env.PAGENOVA_CRM_API_URL = "https://crm.example.test";
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 302 });
    vi.stubGlobal("fetch", fetcher);
    await expect(syncVerifiedBillingCycle(input)).rejects.toThrow("HTTP 302");
    expect(fetcher.mock.calls[0][1].redirect).toBe("manual");
  });

  it("propagates CRM rejection", async () => {
    process.env.PAGENOVA_BILLING_SYNC_SECRET = "a".repeat(40);
    process.env.PAGENOVA_CRM_API_URL = "https://crm.example.test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409 }));
    await expect(syncVerifiedBillingCycle(input)).rejects.toThrow("HTTP 409");
  });
});
