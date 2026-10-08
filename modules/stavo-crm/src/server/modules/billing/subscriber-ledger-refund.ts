import { getPool } from '../../db/client';

export async function refundSiteGeneration(subscriberId: string, generationId: string, cycleStart: Date): Promise<boolean> {
  if (!/^[a-zA-Z0-9_:-]{1,128}$/.test(subscriberId) ||
      !/^[a-zA-Z0-9_:-]{1,128}$/.test(generationId) ||
      !Number.isFinite(cycleStart.getTime())) throw new Error('Invalid debit identity');
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      'SELECT request_count FROM pagenova_subscriber_usage WHERE subscriber_id=? AND cycle_start=? AND meter=? FOR UPDATE',
      [subscriberId, cycleStart, 'generatedSites'],
    );
    const [deleted] = await conn.execute(
      'DELETE FROM pagenova_generation_debits WHERE subscriber_id=? AND generation_id=? AND cycle_start=?',
      [subscriberId, generationId, cycleStart],
    );
    if (Number((deleted as { affectedRows: number }).affectedRows) !== 1) {
      await conn.commit();
      return false;
    }
    await conn.execute(
      'UPDATE pagenova_subscriber_usage SET request_count=request_count-1,updated_at=? WHERE subscriber_id=? AND cycle_start=? AND meter=? AND request_count>0',
      [new Date(), subscriberId, cycleStart, 'generatedSites'],
    );
    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
