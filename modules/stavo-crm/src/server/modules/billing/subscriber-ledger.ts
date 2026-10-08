import { getPool } from '../../db/client';
import { newId } from '../../lib/ids';
import { PAGENOVA_MONTHLY_QUOTAS, billingCycleContains } from './pagenova-quotas';

export type SiteOrigin = 'crm' | 'builder';

export interface SubscriberDebit {
  subscriberId: string;
  cycleStart: Date;
  cycleEnd: Date;
  generationId: string;
  source: SiteOrigin;
}

export async function reserveSubscriberSite(input: SubscriberDebit): Promise<{ accepted: boolean; duplicate: boolean; used: number; remaining: number }> {
  const now = new Date();
  if (!billingCycleContains(now, input.cycleStart, input.cycleEnd)) throw new Error('Inactive subscription cycle');
  if (input.source !== 'crm' && input.source !== 'builder') throw new Error('Invalid generation source');
  if (!/^[a-zA-Z0-9_:-]{1,128}$/.test(input.subscriberId) || !/^[a-zA-Z0-9_:-]{1,128}$/.test(input.generationId)) throw new Error('Invalid subscriber or generation ID');
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      'INSERT INTO pagenova_subscriber_usage (id,subscriber_id,cycle_start,cycle_end,meter,request_count,updated_at) VALUES (?,?,?,?,?,0,?) ON DUPLICATE KEY UPDATE id=id',
      [newId(), input.subscriberId, input.cycleStart, input.cycleEnd, 'generatedSites', now],
    );
    const [rows] = await connection.execute(
      'SELECT request_count FROM pagenova_subscriber_usage WHERE subscriber_id=? AND cycle_start=? AND meter=? FOR UPDATE',
      [input.subscriberId, input.cycleStart, 'generatedSites'],
    );
    const used = Number((rows as Array<{request_count:number}>)[0]?.request_count ?? 0);
    const [previous] = await connection.execute(
      'SELECT id FROM pagenova_generation_debits WHERE subscriber_id=? AND generation_id=? LIMIT 1',
      [input.subscriberId, input.generationId],
    );
    if ((previous as unknown[]).length) {
      // A duplicate request is idempotent only within the SAME billing cycle.
      const [priorCycle] = await connection.execute(
        'SELECT cycle_start FROM pagenova_generation_debits WHERE subscriber_id=? AND generation_id=? LIMIT 1',
        [input.subscriberId, input.generationId],
      );
      const priorStart = (priorCycle as Array<{cycle_start:Date}>)[0]?.cycle_start;
      if (!priorStart || new Date(priorStart).getTime() !== input.cycleStart.getTime()) {
        throw new Error('Generation ID belongs to a different billing cycle');
      }
      await connection.commit();
      return { accepted: true, duplicate: true, used, remaining: Math.max(0, PAGENOVA_MONTHLY_QUOTAS.generatedSites - used) };
    }
    if (used >= PAGENOVA_MONTHLY_QUOTAS.generatedSites) {
      await connection.rollback();
      return { accepted: false, duplicate: false, used, remaining: 0 };
    }
    await connection.execute(
      'INSERT INTO pagenova_generation_debits (id,subscriber_id,generation_id,cycle_start,source,created_at) VALUES (?,?,?,?,?,?)',
      [newId(), input.subscriberId, input.generationId, input.cycleStart, input.source, now],
    );
    await connection.execute(
      'UPDATE pagenova_subscriber_usage SET request_count=request_count+1,updated_at=? WHERE subscriber_id=? AND cycle_start=? AND meter=?',
      [now, input.subscriberId, input.cycleStart, 'generatedSites'],
    );
    await connection.commit();
    return { accepted: true, duplicate: false, used: used + 1, remaining: PAGENOVA_MONTHLY_QUOTAS.generatedSites - used - 1 };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function subscriberSiteBalance(subscriberId: string, cycleStart: Date): Promise<{ used: number; limit: number; remaining: number }> {
  if (!/^[a-zA-Z0-9_:-]{1,128}$/.test(subscriberId) || !Number.isFinite(cycleStart.getTime())) throw new Error('Invalid subscriber or cycle');
  const [rows] = await getPool().execute(
    'SELECT request_count FROM pagenova_subscriber_usage WHERE subscriber_id=? AND cycle_start=? AND meter=? LIMIT 1',
    [subscriberId, cycleStart, 'generatedSites'],
  );
  const used = Number((rows as Array<{request_count:number}>)[0]?.request_count ?? 0);
  const limit = PAGENOVA_MONTHLY_QUOTAS.generatedSites;
  return { used, limit, remaining: Math.max(0, limit - used) };
}
