import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { pagenovaWorkspaceUsage } from '../../db/schema';
import { toReferencePeriod } from '../../domain/time';
import { tooManyRequests } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { PAGENOVA_MONTHLY_QUOTAS, type PageNovaMeter } from './pagenova-quotas';

function affectedRows(result: unknown): number {
  if (Array.isArray(result)) return Number((result[0] as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
  return Number((result as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
}

export function workspaceQuotasEnabled(): boolean {
  return process.env.PAGENOVA_WORKSPACE_QUOTAS_ENABLED === 'true';
}

export async function reserveWorkspaceQuota(
  db: Database,
  workspaceId: string,
  meter: PageNovaMeter,
  now: Date = new Date(),
): Promise<{ used: number; limit: number; remaining: number }> {
  if (!workspaceId) throw new Error('Workspace identity is required for quota reservation.');
  if (meter !== 'googleSearchPages' && meter !== 'generatedSites') throw new Error('Unknown quota meter.');
  const billingMonth = toReferencePeriod(now);
  const limit = PAGENOVA_MONTHLY_QUOTAS[meter];
  await db.insert(pagenovaWorkspaceUsage).values({
    id: newId(), workspaceId, billingMonth, meter, requestCount: 0, updatedAt: now,
  }).onDuplicateKeyUpdate({ set: { updatedAt: now } });
  const result = await db.execute(sql`
    update ${pagenovaWorkspaceUsage}
       set ${pagenovaWorkspaceUsage.requestCount} = ${pagenovaWorkspaceUsage.requestCount} + 1,
           ${pagenovaWorkspaceUsage.updatedAt} = ${now}
     where ${pagenovaWorkspaceUsage.workspaceId} = ${workspaceId}
       and ${pagenovaWorkspaceUsage.billingMonth} = ${billingMonth}
       and ${pagenovaWorkspaceUsage.meter} = ${meter}
       and ${pagenovaWorkspaceUsage.requestCount} < ${limit}
  `);
  if (affectedRows(result) !== 1) {
    throw tooManyRequests('Limite mensal do seu plano PageNova atingido.', 'PAGENOVA_CUSTOMER_QUOTA_EXCEEDED');
  }
  const [row] = await db.select({ requestCount: pagenovaWorkspaceUsage.requestCount })
    .from(pagenovaWorkspaceUsage).where(and(
      eq(pagenovaWorkspaceUsage.workspaceId, workspaceId),
      eq(pagenovaWorkspaceUsage.billingMonth, billingMonth),
      eq(pagenovaWorkspaceUsage.meter, meter),
    )).limit(1);
  const used = row?.requestCount ?? limit;
  return { used, limit, remaining: Math.max(0, limit - used) };
}

export async function getWorkspaceQuotaSummary(db: Database, workspaceId: string, now = new Date()) {
  const billingMonth = toReferencePeriod(now);
  const rows = await db.select().from(pagenovaWorkspaceUsage).where(and(
    eq(pagenovaWorkspaceUsage.workspaceId, workspaceId),
    eq(pagenovaWorkspaceUsage.billingMonth, billingMonth),
  ));
  return (Object.keys(PAGENOVA_MONTHLY_QUOTAS) as PageNovaMeter[]).map((meter) => {
    const used = rows.find((row) => row.meter === meter)?.requestCount ?? 0;
    const limit = PAGENOVA_MONTHLY_QUOTAS[meter];
    return { meter, billingMonth, used, limit, remaining: Math.max(0, limit - used) };
  });
}

/** Refund only a reservation that was never used for a provider request. */
export async function releaseWorkspaceQuota(
  db: Database,
  workspaceId: string,
  meter: PageNovaMeter,
  now: Date = new Date(),
): Promise<void> {
  if (!workspaceId) throw new Error('Workspace identity is required for quota release.');
  const billingMonth = toReferencePeriod(now);
  await db.execute(sql`
    update ${pagenovaWorkspaceUsage}
       set ${pagenovaWorkspaceUsage.requestCount} = greatest(${pagenovaWorkspaceUsage.requestCount} - 1, 0),
           ${pagenovaWorkspaceUsage.updatedAt} = ${now}
     where ${pagenovaWorkspaceUsage.workspaceId} = ${workspaceId}
       and ${pagenovaWorkspaceUsage.billingMonth} = ${billingMonth}
       and ${pagenovaWorkspaceUsage.meter} = ${meter}
       and ${pagenovaWorkspaceUsage.requestCount} > 0
  `);
}
