import { createHmac, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { getPool } from '../../db/client';

export const subscriberCycleRevokeRouter = Router();

/** Revocation is scoped to one Kiwify payment, not the entire subscription. */
subscriberCycleRevokeRouter.post('/internal/pagenova/revoke-subscription-order', async (req, res) => {
  const secret = process.env.PAGENOVA_BILLING_SYNC_SECRET;
  if (!secret || secret.length < 32) {
    res.status(503).json({ error: 'Billing sync not configured' });
    return;
  }
  const { orderId, reason } = req.body ?? {};
  if (typeof orderId !== 'string' || !/^[a-zA-Z0-9_:-]{1,128}$/.test(orderId) ||
      (reason !== 'refunded' && reason !== 'chargeback')) {
    res.status(400).json({ error: 'Invalid revocation request' });
    return;
  }
  const timestamp = req.get('x-pagenova-billing-timestamp') ?? '';
  const signature = req.get('x-pagenova-billing-signature') ?? '';
  const sent = Number(timestamp);
  if (!/^\d{13}$/.test(timestamp) || !Number.isSafeInteger(sent) || Math.abs(Date.now() - sent) > 60000) {
    res.status(401).json({ error: 'Expired billing signature' });
    return;
  }
  const expected = createHmac('sha256', secret).update(['revoke', orderId, reason, timestamp].join('\n')).digest('hex');
  const left = Buffer.from(expected, 'utf8');
  const right = Buffer.from(signature, 'utf8');
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    res.status(401).json({ error: 'Invalid billing signature' });
    return;
  }
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      'SELECT id,status FROM pagenova_subscription_cycles WHERE provider=? AND provider_order_id=? FOR UPDATE',
      ['kiwify', orderId],
    );
    const cycle = (rows as Array<{ id: string; status: string }>)[0];
    if (cycle?.status === 'ACTIVE') {
      await conn.execute(
        'UPDATE pagenova_subscription_cycles SET status=?, updated_at=? WHERE id=? AND status=?',
        ['REVOKED', new Date(), cycle.id, 'ACTIVE'],
      );
    }
    await conn.commit();
    // An unknown payment cannot be treated as a completed revocation.
    // The provider webhook must retry or an operator must reconcile it.
    if (!cycle) {
      res.status(409).json({ error: 'Payment cycle not found; reconciliation required' });
      return;
    }
    res.json({ ok: true, found: true, revoked: cycle.status === 'ACTIVE' });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
});
