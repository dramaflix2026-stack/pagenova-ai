import { describe, expect, it } from 'vitest';
import { PAGENOVA_MONTHLY_QUOTAS, billingCycleContains, isMeteredPageNovaOperation, quotaDecision, generationMeterForAction } from '../../src/server/modules/billing/pagenova-quotas';

describe('PageNova monthly subscription policy', () => {
  it('uses 150 Google result pages and 40 generated sites', () => {
    expect(PAGENOVA_MONTHLY_QUOTAS).toEqual({ googleSearchPages: 150, generatedSites: 40 });
  });
  it('permits the final unit and blocks the next', () => {
    expect(quotaDecision('googleSearchPages', 149).allowed).toBe(true);
    expect(quotaDecision('googleSearchPages', 150).allowed).toBe(false);
    expect(quotaDecision('generatedSites', 39).allowed).toBe(true);
    expect(quotaDecision('generatedSites', 40).allowed).toBe(false);
  });
  it('rejects invalid counters', () => {
    expect(() => quotaDecision('googleSearchPages', -1)).toThrow();
    expect(() => quotaDecision('generatedSites', 1.5)).toThrow();
    expect(() => quotaDecision('generatedSites', 0, 0)).toThrow();
  });
  it('shares a single 40-site quota between CRM and new AI builder', () => {
    const actions = ['crmFullGeneration', 'builderNewFullSite'] as const;
    let used = 38;
    for (const action of actions) {
      expect(generationMeterForAction(action)).toBe('generatedSites');
      expect(quotaDecision('generatedSites', used).allowed).toBe(true);
      used += 1;
    }
    expect(used).toBe(40);
    expect(quotaDecision('generatedSites', used).allowed).toBe(false);
    expect(generationMeterForAction('aiRevision')).toBeNull();
    expect(generationMeterForAction('manualEdit')).toBeNull();
  });
  it('does not meter revisions', () => {
    expect(isMeteredPageNovaOperation('aiRevision')).toBe(false);
    expect(isMeteredPageNovaOperation('localEdit')).toBe(false);
  });
  it('uses start-inclusive end-exclusive billing cycles', () => {
    const start = new Date('2026-10-08T12:00:00Z');
    const end = new Date('2026-11-08T12:00:00Z');
    expect(billingCycleContains(start, start, end)).toBe(true);
    expect(billingCycleContains(end, start, end)).toBe(false);
  });
});
