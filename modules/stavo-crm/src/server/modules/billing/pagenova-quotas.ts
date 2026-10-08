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

/**
 * Both full-generation entry points debit the SAME subscriber meter.
 * AI revisions and manual edits never debit this meter.
 * The caller must still enforce atomic reservation and idempotency.
 */
export type PageNovaGenerationAction =
  | 'crmFullGeneration'
  | 'builderNewFullSite'
  | 'aiRevision'
  | 'manualEdit';

export function generationMeterForAction(action: PageNovaGenerationAction): PageNovaMeter | null {
  switch (action) {
    case 'crmFullGeneration':
    case 'builderNewFullSite':
      return 'generatedSites';
    case 'aiRevision':
    case 'manualEdit':
      return null;
  }
}

/**
 * Canonical billing-cycle identity shared by all generation entry points.
 * Never infer a subscriber's renewal from the current calendar month.
 */
export interface PageNovaBillingCycle {
  subscriberId: string;
  startsAt: Date;
  endsAt: Date;
}

export function billingCycleKey(cycle: PageNovaBillingCycle, now: Date): string {
  const subscriberId = cycle.subscriberId.trim();
  if (!subscriberId || subscriberId.length > 128 || !/^[a-zA-Z0-9_:-]+$/.test(subscriberId)) {
    throw new Error('Invalid subscriber identifier.');
  }
  if (!billingCycleContains(now, cycle.startsAt, cycle.endsAt)) {
    throw new RangeError('Subscription billing cycle is not active.');
  }
  return subscriberId + ':' + cycle.startsAt.toISOString() + ':' + cycle.endsAt.toISOString();
}

/**
 * Stable debit identity: retries and duplicate clicks for the same generation
 * must reference the same key, regardless of which interface originated it.
 */
export function siteGenerationDebitKey(cycle: PageNovaBillingCycle, now: Date, generationId: string): string {
  const id = generationId.trim();
  if (!id || id.length > 128 || !/^[a-zA-Z0-9_:-]+$/.test(id)) {
    throw new Error('Invalid generation identifier.');
  }
  return billingCycleKey(cycle, now) + ':generatedSites:' + id;
}
