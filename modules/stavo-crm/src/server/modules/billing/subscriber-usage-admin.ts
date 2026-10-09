import { createHmac, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { getPool } from '../../db/client';

export const subscriberUsageAdminRouter = Router();

/** Internal report; never exposed to subscribers. Requires a separate admin secret. */
subscriberUsageAdminRouter.get('/internal/pagenova/admin/subscriber-usage', async (req, res) => {
  const secret = process.env.PAGENOVA_ADMIN_REPORT_SECRET;
  if (!secret || secret.length < 32) {
    res.status(503).json({ error: 'Admin reporting not configured' });
    return;
  }
  const timestamp = req.get('x-pagenova-admin-timestamp') ?? '';
  const signature = req.get('x-pagenova-admin-signature') ?? '';
  const sent = Number(timestamp);
  if (!/^\d{13}$/.test(timestamp) || !Number.isSafeInteger(sent) || Math.abs(Date.now() - sent) > 60000) {
    res.status(401).json({ error: 'Expired admin signature' });
    return;
  }
  const expected = createHmac('sha256', secret).update(['subscriber-usage', timestamp].join('\n')).digest('hex');
  const left = Buffer.from(expected, 'utf8');
  const right = Buffer.from(signature, 'utf8');
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    res.status(401).json({ error: 'Invalid admin signature' });
    return;
  }
  const [rows] = await getPool().execute(
    `SELECT c.subscriber_id AS subscriberId, c.provider_reference AS subscriptionId,
            c.cycle_start AS cycleStart, c.cycle_end AS cycleEnd, c.status AS status,
            COALESCE(MAX(CASE WHEN u.meter='generatedSites' THEN u.request_count END),0) AS sitesUsed,
            COALESCE(MAX(CASE WHEN u.meter='googleSearchPages' THEN u.request_count END),0) AS googlePagesUsed
       FROM pagenova_subscription_cycles c
       LEFT JOIN pagenova_subscriber_usage u
         ON u.subscriber_id=c.subscriber_id AND u.cycle_start=c.cycle_start
      WHERE c.cycle_end > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY)
      GROUP BY c.id, c.subscriber_id, c.provider_reference, c.cycle_start, c.cycle_end, c.status
      ORDER BY c.cycle_start DESC
      LIMIT 500`,
  );
  const entries = (rows as Array<Record<string, unknown>>).map((row) => {
    const sitesUsed = Number(row.sitesUsed);
    const googlePagesUsed = Number(row.googlePagesUsed);
    return { ...row, sitesUsed, googlePagesUsed, sitesRemaining: Math.max(0, 40 - sitesUsed), googlePagesRemaining: Math.max(0, 150 - googlePagesUsed) };
  });
  res.set('Cache-Control', 'no-store');
  res.json({ entries, truncated: entries.length === 500 });
});
