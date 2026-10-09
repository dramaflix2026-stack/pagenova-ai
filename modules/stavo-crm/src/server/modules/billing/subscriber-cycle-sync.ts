import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { getPool } from '../../db/client';
import { newId } from '../../lib/ids';

export const subscriberCycleSyncRouter = Router();

/** Server-to-server only. The caller must derive subscriberId from Supabase auth. */
subscriberCycleSyncRouter.post('/internal/pagenova/subscription-cycle', async (req, res) => {
  const secret = process.env.PAGENOVA_BILLING_SYNC_SECRET;
  if (!secret || secret.length < 32) {
    res.status(503).json({ error: 'Billing sync not configured' });
    return;
  }
  const { subscriberId, subscriptionId, orderId, cycleStart, cycleEnd } = req.body ?? {};
  if (![subscriberId, subscriptionId, orderId].every((v) => typeof v === 'string' && /^[a-zA-Z0-9_:-]{1,128}$/.test(v))) {
    res.status(400).json({ error: 'Invalid billing identifiers' });
    return;
  }
  if (typeof cycleStart !== 'string' || typeof cycleEnd !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[.]\d{1,3})?Z$/.test(cycleStart) ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[.]\d{1,3})?Z$/.test(cycleEnd)) {
    res.status(400).json({ error: 'Invalid billing interval' });
    return;
  }
  const start = new Date(cycleStart);
  const end = new Date(cycleEnd);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) ||
      end.getTime() <= start.getTime() || end.getTime() - start.getTime() > 35 * 86400000) {
    res.status(400).json({ error: 'Invalid cycle duration' });
    return;
  }
  const timestamp = req.get('x-pagenova-billing-timestamp') ?? '';
  const signature = req.get('x-pagenova-billing-signature') ?? '';
  const sent = Number(timestamp);
  if (!/^\d{13}$/.test(timestamp) || !Number.isSafeInteger(sent) || Math.abs(Date.now() - sent) > 60000) {
    res.status(401).json({ error: 'Expired billing signature' });
    return;
  }
  const canonical = [subscriberId, subscriptionId, orderId, cycleStart, cycleEnd, timestamp].join('\n');
  const expected = createHmac('sha256', secret).update(canonical).digest('hex');
  const left = Buffer.from(expected, 'utf8');
  const right = Buffer.from(signature, 'utf8');
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    res.status(401).json({ error: 'Invalid billing signature' });
    return;
  }
  const conn = await getPool().getConnection();
  const lockNames = [
    'pn:billing:' + createHash('sha256').update('subscriber:' + subscriberId).digest('hex').slice(0, 48),
    'pn:billing:' + createHash('sha256').update('subscription:' + subscriptionId).digest('hex').slice(0, 48),
  ].sort();
  const acquired: string[] = [];
  let transactionStarted = false;
  try {
    // Row locks cannot serialize concurrent first inserts when no row exists.
    // MySQL advisory locks serialize subscriber and subscription ownership checks.
    for (const name of lockNames) {
      const [result] = await conn.execute('SELECT GET_LOCK(?, 5) AS acquired', [name]);
      if (Number((result as Array<{ acquired: number | null }>)[0]?.acquired) !== 1) {
        res.status(503).json({ error: 'Billing synchronization busy; retry later' });
        return;
      }
      acquired.push(name);
    }
    await conn.beginTransaction();
    transactionStarted = true;
    // A provider subscription must never grant credits to different users.
    const [owners] = await conn.execute(
      'SELECT subscriber_id FROM pagenova_subscription_cycles WHERE provider=? AND provider_reference=? AND subscriber_id<>? LIMIT 1 FOR UPDATE',
      ['kiwify', subscriptionId, subscriberId],
    );
    if ((owners as Array<{ subscriber_id: string }>).length) {
      await conn.rollback();
      transactionStarted = false;
      res.status(409).json({ error: 'Subscription already belongs to another subscriber' });
      return;
    }
    const [existing] = await conn.execute(
      'SELECT provider_reference, cycle_end, status FROM pagenova_subscription_cycles WHERE subscriber_id=? AND cycle_start=? FOR UPDATE',
      [subscriberId, start],
    );
    const rows = existing as Array<{ provider_reference: string; cycle_end: Date; status: string }>;
    if (rows.length && (rows[0]!.status !== 'ACTIVE' || rows[0]!.provider_reference !== subscriptionId ||
        new Date(rows[0]!.cycle_end).getTime() !== end.getTime())) {
      await conn.rollback();
      transactionStarted = false;
      res.status(409).json({ error: 'Conflicting subscription cycle' });
      return;
    }
    if (!rows.length) {
      // A subscription must not create a new cycle after a recorded revocation.
      const [revocations] = await conn.execute(
        'SELECT id FROM pagenova_subscription_cycles WHERE provider=? AND provider_reference=? AND status<>? LIMIT 1 FOR UPDATE',
        ['kiwify', subscriptionId, 'ACTIVE'],
      );
      if ((revocations as Array<{ id: string }>).length) {
        await conn.rollback();
        transactionStarted = false;
        res.status(409).json({ error: 'Subscription has revoked cycles; manual reconciliation required' });
        return;
      }
      const [overlap] = await conn.execute(
        'SELECT id FROM pagenova_subscription_cycles WHERE subscriber_id=? AND cycle_start < ? AND cycle_end > ? LIMIT 1 FOR UPDATE',
        [subscriberId, end, start],
      );
      if ((overlap as Array<{ id: string }>).length) {
        await conn.rollback();
        transactionStarted = false;
        res.status(409).json({ error: 'Overlapping subscription cycle' });
        return;
      }
      await conn.execute(
        'INSERT INTO pagenova_subscription_cycles (id,subscriber_id,cycle_start,cycle_end,status,provider,provider_reference,updated_at) VALUES (?,?,?,?,?,?,?,?)',
        [newId(), subscriberId, start, end, 'ACTIVE', 'kiwify', subscriptionId, new Date()],
      );
    }
    await conn.commit();
    transactionStarted = false;
    res.json({ ok: true, duplicate: rows.length > 0 });
  } catch (error) {
    if (transactionStarted) await conn.rollback();
    throw error;
  } finally {
    for (const name of acquired.reverse()) {
      try { await conn.execute('SELECT RELEASE_LOCK(?)', [name]); }
      catch (error) { console.error('[BILLING] Failed to release advisory lock', error); }
    }
    conn.release();
  }
});
