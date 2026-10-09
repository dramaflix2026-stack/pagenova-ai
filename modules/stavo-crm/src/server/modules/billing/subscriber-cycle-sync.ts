import { createHmac, timingSafeEqual } from 'node:crypto';
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
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\\.\d{1,3})?Z$/.test(cycleStart) ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\\.\d{1,3})?Z$/.test(cycleEnd)) {
    res.status(400).json({ error: 'Invalid billing interval' });
    return;
  }
  const start = new Date(cycleStart);
  const end = new Date(cycleEnd);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) ||
      start.toISOString() !== new Date(start.getTime()).toISOString() ||
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
  try {
    await conn.beginTransaction();
    const [existing] = await conn.execute(
      'SELECT provider_reference, cycle_end FROM pagenova_subscription_cycles WHERE subscriber_id=? AND cycle_start=? FOR UPDATE',
      [subscriberId, start],
    );
    const rows = existing as Array<{ provider_reference: string; cycle_end: Date }>;
    if (rows.length && (rows[0]!.provider_reference !== subscriptionId ||
        new Date(rows[0]!.cycle_end).getTime() !== end.getTime())) {
      await conn.rollback();
      res.status(409).json({ error: 'Conflicting subscription cycle' });
      return;
    }
    if (!rows.length) {
      await conn.execute(
        'INSERT INTO pagenova_subscription_cycles (id,subscriber_id,cycle_start,cycle_end,status,provider,provider_reference,updated_at) VALUES (?,?,?,?,?,?,?,?)',
        [newId(), subscriberId, start, end, 'ACTIVE', 'kiwify', subscriptionId, new Date()],
      );
    }
    await conn.commit();
    res.json({ ok: true, duplicate: rows.length > 0 });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
});
