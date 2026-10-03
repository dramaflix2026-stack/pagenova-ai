/**
 * Contagem e limite interno de consumo da API do Google.
 *
 * Objetivo: proteger o orcamento ANTES da chamada sair do servidor.
 * O bloqueio interno e independente das quotas do Google Cloud -- um alerta
 * de orcamento no console avisa, mas nao interrompe consumo.
 *
 * A reserva e atomica: duas requisicoes simultaneas nunca ultrapassam o limite,
 * porque o UPDATE condicional decide no proprio banco.
 */
import { and, eq, sql } from 'drizzle-orm';

import type { GoogleSkuType } from '../../../shared/constants';
import { GOOGLE_SKU_TYPES } from '../../../shared/constants';
import { getEnv } from '../../config/env';
import type { Database } from '../../db/client';
import { googleApiUsage } from '../../db/schema';
import { toReferencePeriod } from '../../domain/time';
import { tooManyRequests } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { getPreferences } from '../settings/service';

/** mysql2 devolve [ResultSetHeader, fields]; normaliza a contagem de linhas. */
function extractAffectedRows(result: unknown): number {
  if (Array.isArray(result)) {
    const header = result[0] as { affectedRows?: number } | undefined;
    return Number(header?.affectedRows ?? 0);
  }
  return Number((result as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
}

export interface UsageLimits {
  textSearch: number;
  details: number;
  warningPercent: number;
}

/** Preferencia do usuario tem prioridade sobre o valor do ambiente. */
export async function resolveLimits(db: Database): Promise<UsageLimits> {
  const env = getEnv();
  const preferences = await getPreferences(db);

  return {
    textSearch: preferences.googleTextSearchLimit ?? env.GOOGLE_TEXT_SEARCH_MONTHLY_HARD_LIMIT,
    details: preferences.googleDetailsLimit ?? env.GOOGLE_DETAILS_MONTHLY_HARD_LIMIT,
    warningPercent: preferences.googleWarningPercent ?? env.GOOGLE_USAGE_WARNING_PERCENT,
  };
}

const limitFor = (limits: UsageLimits, sku: GoogleSkuType): number =>
  sku === 'TEXT_SEARCH' ? limits.textSearch : limits.details;

/**
 * Reserva uma unidade de consumo.
 * Lanca 429 quando o limite mensal interno ja foi atingido.
 * Cada pagina realmente solicitada consome uma unidade.
 */
export async function reserveUsage(
  db: Database,
  sku: GoogleSkuType,
  now: Date = new Date(),
): Promise<{ used: number; limit: number; warning: boolean }> {
  const limits = await resolveLimits(db);
  const limit = limitFor(limits, sku);
  const billingMonth = toReferencePeriod(now);

  // Garante a linha do mes sem falhar quando ja existe.
  await db
    .insert(googleApiUsage)
    .values({
      id: newId(),
      billingMonth,
      skuType: sku,
      requestCount: 0,
      warningState: 'NONE',
      updatedAt: now,
    })
    .onDuplicateKeyUpdate({ set: { updatedAt: now } });

  if (limit <= 0) {
    throw tooManyRequests(
      'O limite interno de uso da API do Google esta zerado. Ajuste em Configuracoes para pesquisar.',
      'GOOGLE_QUOTA_DISABLED',
    );
  }

  // Incremento condicional: o proprio banco decide quem passa.
  const result = await db.execute(sql`
    update ${googleApiUsage}
       set ${googleApiUsage.requestCount} = ${googleApiUsage.requestCount} + 1,
           ${googleApiUsage.updatedAt} = ${now}
     where ${googleApiUsage.billingMonth} = ${billingMonth}
       and ${googleApiUsage.skuType} = ${sku}
       and ${googleApiUsage.requestCount} < ${limit}
  `);

  const affected = extractAffectedRows(result);

  if (affected === 0) {
    throw tooManyRequests(
      `Limite interno de ${limit} chamadas por mes atingido para esta operacao. ` +
        'Esse bloqueio protege o orcamento da conta do Google. ' +
        'Voce pode ajustar o limite em Configuracoes ou aguardar o proximo mes. ' +
        'O restante do CRM continua funcionando normalmente.',
      'GOOGLE_QUOTA_EXCEEDED',
    );
  }

  const [row] = await db
    .select()
    .from(googleApiUsage)
    .where(and(eq(googleApiUsage.billingMonth, billingMonth), eq(googleApiUsage.skuType, sku)))
    .limit(1);

  const used = row?.requestCount ?? 0;
  const warning = used >= Math.floor((limit * limits.warningPercent) / 100);

  const nextState = used >= limit ? 'BLOCKED' : warning ? 'WARNED' : 'NONE';
  if (row && row.warningState !== nextState) {
    await db
      .update(googleApiUsage)
      .set({ warningState: nextState, updatedAt: now })
      .where(eq(googleApiUsage.id, row.id));
  }

  return { used, limit, warning };
}

export interface SkuUsage {
  sku: GoogleSkuType;
  billingMonth: string;
  used: number;
  limit: number;
  remaining: number;
  warningPercent: number;
  /** true quando o consumo passou do percentual de aviso. */
  warning: boolean;
  blocked: boolean;
}

export async function getUsageSummary(
  db: Database,
  now: Date = new Date(),
): Promise<SkuUsage[]> {
  const limits = await resolveLimits(db);
  const billingMonth = toReferencePeriod(now);

  const rows = await db
    .select()
    .from(googleApiUsage)
    .where(eq(googleApiUsage.billingMonth, billingMonth));
  const byType = new Map(rows.map((row) => [row.skuType, row]));

  return GOOGLE_SKU_TYPES.map((sku) => {
    const used = byType.get(sku)?.requestCount ?? 0;
    const limit = limitFor(limits, sku);
    return {
      sku,
      billingMonth,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      warningPercent: limits.warningPercent,
      warning: limit > 0 && used >= Math.floor((limit * limits.warningPercent) / 100),
      blocked: limit > 0 && used >= limit,
    };
  });
}

/**
 * Devolve a unidade reservada quando a chamada nao chegou a ser enviada
 * (por exemplo, cancelamento do cliente antes do envio).
 */
export async function releaseUsage(
  db: Database,
  sku: GoogleSkuType,
  now: Date = new Date(),
): Promise<void> {
  const billingMonth = toReferencePeriod(now);
  await db.execute(sql`
    update ${googleApiUsage}
       set ${googleApiUsage.requestCount} = greatest(${googleApiUsage.requestCount} - 1, 0),
           ${googleApiUsage.updatedAt} = ${now}
     where ${googleApiUsage.billingMonth} = ${billingMonth}
       and ${googleApiUsage.skuType} = ${sku}
  `);
}
