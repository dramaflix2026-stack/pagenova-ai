import { and, eq, gt, lte, desc } from 'drizzle-orm';
import { getDb } from '../../db/client';
import { pagenovaSubscriptionCycles } from '../../db/schema';
import { billingCycleContains } from './pagenova-quotas';

export async function verifiedSubscriberCycle(subscriberId: string, now: Date = new Date()) {
  if (!/^[a-zA-Z0-9_:-]{1,128}$/.test(subscriberId)) throw new Error('Invalid subscriber identity');
  const [cycle] = await getDb().select()
    .from(pagenovaSubscriptionCycles)
    .where(and(
      eq(pagenovaSubscriptionCycles.subscriberId, subscriberId),
      eq(pagenovaSubscriptionCycles.status, 'ACTIVE'),
      lte(pagenovaSubscriptionCycles.cycleStart, now),
      gt(pagenovaSubscriptionCycles.cycleEnd, now),
    ))
    .orderBy(desc(pagenovaSubscriptionCycles.cycleStart))
    .limit(1);
  if (!cycle || !billingCycleContains(now, cycle.cycleStart, cycle.cycleEnd)) return null;
  return { subscriberId, cycleStart: cycle.cycleStart, cycleEnd: cycle.cycleEnd };
}
