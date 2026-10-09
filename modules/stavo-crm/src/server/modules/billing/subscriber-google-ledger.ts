import { getPool } from '../../db/client';
import { newId } from '../../lib/ids';
import { billingCycleContains, PAGENOVA_MONTHLY_QUOTAS } from './pagenova-quotas';

export interface GoogleCycleQuota {
  subscriberId: string;
  cycleStart: Date;
  cycleEnd: Date;
}

export async function changeSubscriberGooglePage(input: GoogleCycleQuota, delta: 1 | -1): Promise<{ used: number; remaining: number }> {
  if (!billingCycleContains(new Date(), input.cycleStart, input.cycleEnd)) throw new Error('Inactive subscription cycle');
  if (!/^[a-zA-Z0-9_:-]{1,128}$/.test(input.subscriberId)) throw new Error('Invalid subscriber');
  const conn = await getPool().getConnection();
  const now = new Date();
  try {
    await conn.beginTransaction();
    await conn.execute(
      'INSERT INTO pagenova_subscriber_usage (id,subscriber_id,cycle_start,cycle_end,meter,request_count,updated_at) VALUES (?,?,?,?,?,0,?) ON DUPLICATE KEY UPDATE id=id',
      [newId(), input.subscriberId, input.cycleStart, input.cycleEnd, 'googleSearchPages', now],
    );
    const [rows] = await conn.execute(
      'SELECT request_count FROM pagenova_subscriber_usage WHERE subscriber_id=? AND cycle_start=? AND meter=? FOR UPDATE',
      [input.subscriberId, input.cycleStart, 'googleSearchPages'],
    );
    const used = Number((rows as Array<{ request_count: number }>)[0]?.request_count ?? 0);
    if (delta === 1 && used >= PAGENOVA_MONTHLY_QUOTAS.googleSearchPages) {
      throw new Error('Limite de 150 paginas Google atingido neste ciclo.');
    }
    if (delta === -1 && used === 0) throw new Error('Google quota cannot be negative');
    await conn.execute(
      'UPDATE pagenova_subscriber_usage SET request_count=request_count+?,updated_at=? WHERE subscriber_id=? AND cycle_start=? AND meter=?',
      [delta, now, input.subscriberId, input.cycleStart, 'googleSearchPages'],
    );
    await conn.commit();
    const next = used + delta;
    return { used: next, remaining: PAGENOVA_MONTHLY_QUOTAS.googleSearchPages - next };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
