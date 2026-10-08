/** PageNova subscription quotas. Pure policy: no production enforcement until server-side accounting is connected. */
export const PAGENOVA_MONTHLY_QUOTAS = Object.freeze({
  googleSearchPages: 150,
  generatedSites: 40,
} as const);

export type PageNovaMeter = keyof typeof PAGENOVA_MONTHLY_QUOTAS;

/** Billing cycle boundaries must come from the subscription, not the calendar month. */
export function billingCycleContains(now: Date, cycleStart: Date, cycleEnd: Date): boolean {
  const time = now.getTime();
  return Number.isFinite(time) &&
    Number.isFinite(cycleStart.getTime()) &&
    Number.isFinite(cycleEnd.getTime()) &&
    cycleStart.getTime() < cycleEnd.getTime() &&
    time >= cycleStart.getTime() && time < cycleEnd.getTime();
}

export function quotaDecision(meter: PageNovaMeter, used: number, requested = 1) {
  const limit = PAGENOVA_MONTHLY_QUOTAS[meter];
  if (!Number.isSafeInteger(used) || used < 0 || !Number.isSafeInteger(requested) || requested < 1) {
    throw new RangeError("Invalid quota counter or request amount.");
  }
  return {
    allowed: requested <= Math.max(0, limit - used),
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

/** Local edits and AI revisions are not deducted from either quota. */
export function isMeteredPageNovaOperation(operation: string): operation is PageNovaMeter {
  return operation === "googleSearchPages" || operation === "generatedSites";
}
