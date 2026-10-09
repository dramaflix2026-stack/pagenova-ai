import { describe, expect, it, vi } from "vitest";
import { resolveBillingSubscriberId } from "./billing-subscriber-identity";

const response = (users: Array<{ id: string; email: string }>) => async () => ({
  data: { users }, error: null,
});

describe("billing subscriber identity", () => {
  it("resolves normalized email to Supabase Auth ID", async () => {
    expect(await resolveBillingSubscriberId(" TEST@EXAMPLE.COM ", response([
      { id: "user-1", email: "test@example.com" },
    ]))).toBe("user-1");
  });
  it("does not invent IDs for missing users", async () => {
    expect(await resolveBillingSubscriberId("missing@example.com", response([]))).toBeNull();
  });
  it("rejects invalid email before querying", async () => {
    const lookup = vi.fn(response([]));
    expect(await resolveBillingSubscriberId("invalid", lookup)).toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });
  it("rejects ambiguous email ownership", async () => {
    await expect(resolveBillingSubscriberId("test@example.com", response([
      { id: "user-1", email: "test@example.com" },
      { id: "user-2", email: "TEST@example.com" },
    ]))).rejects.toThrow("Ambiguous");
  });
  it("fails closed on Supabase lookup errors", async () => {
    await expect(resolveBillingSubscriberId("test@example.com", async () => ({
      data: { users: [] }, error: { message: "unavailable" },
    }))).rejects.toThrow("lookup failed");
  });
});
