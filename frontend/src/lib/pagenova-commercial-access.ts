/**
 * PageNova modular commerce - pure authorization policy.
 *
 * This module does not read/write the database or grant access by itself.
 * Only pass records obtained from a trusted server-side Supabase client.
 * Existing legacy entitlements must continue through the current access path
 * until a separately tested migration is explicitly enabled.
 */
export const PAGENOVA_MODULES = ["crm", "studio", "apps"] as const;
export type PageNovaModule = (typeof PAGENOVA_MODULES)[number];
export type SubscriptionState =
  | "pending" | "active" | "past_due" | "canceled"
  | "refunded" | "chargeback" | "expired";
export type GrantState = "pending" | "active" | "revoked" | "expired";

export type CommercialSubscription = {
  id: string;
  owner_id: string | null;
  customer_email: string;
  state: SubscriptionState;
  starts_at: string | null;
  current_period_ends_at: string | null;
  canceled_at: string | null;
};

export type ModuleGrant = {
  subscription_id: string | null;
  owner_id: string | null;
  customer_email: string;
  module_code: PageNovaModule;
  state: GrantState;
  valid_from: string | null;
  valid_until: string | null;
};

export function normalizeCustomerEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidInstant(value: string | null, now: number, bound: "start" | "end"): boolean {
  if (value === null) return true;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return false;
  return bound === "start" ? parsed <= now : now < parsed;
}

/**
 * Fail closed: only active subscriptions and grants confer access.
 * A past_due subscription is intentionally NOT active. A canceled
 * subscription is also not active, even if a billing period remains.
 * Business rules may be changed later after Kiwify lifecycle validation.
 */
export function resolveCommercialModules(args: {
  ownerId: string;
  email: string;
  subscriptions: readonly CommercialSubscription[];
  grants: readonly ModuleGrant[];
  now?: Date;
}): PageNovaModule[] {
  const { ownerId, subscriptions, grants } = args;
  const email = normalizeCustomerEmail(args.email);
  const now = (args.now ?? new Date()).getTime();
  if (!ownerId || !email || !Number.isFinite(now)) return [];

  const activeSubscriptions = new Map(
    subscriptions
      .filter((s) =>
        s.state === "active" &&
        s.owner_id === ownerId &&
        normalizeCustomerEmail(s.customer_email) === email &&
        isValidInstant(s.starts_at, now, "start") &&
        isValidInstant(s.current_period_ends_at, now, "end")
      )
      .map((s) => [s.id, s])
  );

  const allowed = new Set<PageNovaModule>();
  for (const grant of grants) {
    if (
      grant.state !== "active" ||
      grant.owner_id !== ownerId ||
      normalizeCustomerEmail(grant.customer_email) !== email ||
      !PAGENOVA_MODULES.includes(grant.module_code) ||
      !isValidInstant(grant.valid_from, now, "start") ||
      !isValidInstant(grant.valid_until, now, "end") ||
      !grant.subscription_id ||
      !activeSubscriptions.has(grant.subscription_id)
    ) continue;
    allowed.add(grant.module_code);
  }
  return PAGENOVA_MODULES.filter((moduleCode) => allowed.has(moduleCode));
}

/** Only trusted, verified Kiwify events may be mapped into these actions. */
export type CommercialPaymentAction =
  | { kind: "activate"; providerEventId: string; providerSubscriptionId: string }
  | { kind: "suspend"; providerEventId: string; providerSubscriptionId: string }
  | { kind: "revoke"; providerEventId: string; providerSubscriptionId: string };

export function isUniqueProviderEvent(
  provider: string,
  eventId: string,
  alreadyRecorded: ReadonlySet<string>
): boolean {
  if (!provider.trim() || !eventId.trim()) return false;
  return !alreadyRecorded.has(provider.trim() + ":" + eventId.trim());
}
