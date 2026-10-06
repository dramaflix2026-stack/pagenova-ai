/**
 * Metas de prospeccao (leads prospectados, primeiros contatos) e de vendas
 * (quantidade de vendas, receita realizada).
 *
 * Uma meta e da empresa inteira (userId nulo) ou de uma pessoa. A meta
 * individual e medida apenas nos leads daquela pessoa -- a mesma regra de
 * dono que o painel ja usa.
 *
 * O progresso vem sempre dos eventos do periodo correspondente, calculado no
 * fuso America/Sao_Paulo. Meta diaria usa o dia civil de Sao Paulo, nao UTC.
 */
import { and, asc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';

import type { GoalMetricType, GoalPeriodType } from '../../../shared/constants';
import type { CreateGoalInput, PeriodPreset } from '../../../shared/schemas';
import type { Database } from '../../db/client';
import { goals, users, type Goal } from '../../db/schema';
import { normalizeMoney, toCents } from '../../domain/money';
import { resolvePeriod, toLocalDateString, type ResolvedPeriod } from '../../domain/time';
import { notFound, unprocessable } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { countLeadsProspected, getPeriodMetrics, type PeriodMetrics } from '../dashboard/metrics';

export interface GoalWithOwner extends Goal {
  /** Nome de quem tem a meta; nulo para meta da empresa. */
  userName: string | null;
}

export interface GoalProgress {
  goal: GoalWithOwner;
  /** Valor atual: contagem para metas de quantidade, decimal para receita. */
  current: string;
  target: string;
  /** 0..1; pode passar de 1 quando a meta e superada. */
  ratio: number;
  remaining: string;
  achieved: boolean;
  periodLabel: string;
  fromDate: string;
  toDate: string;
}

/**
 * Quais metas quem pede pode ver.
 *   ALL      -> gestor: todas (empresa e individuais);
 *   COMPANY  -> so as da empresa (painel do gestor);
 *   { userId } -> so as da pessoa (vendedor vendo as proprias).
 */
export type GoalScope = 'ALL' | 'COMPANY' | { userId: string };

const PERIOD_PRESET: Record<GoalPeriodType, 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH'> = {
  DAILY: 'TODAY',
  WEEKLY: 'THIS_WEEK',
  MONTHLY: 'THIS_MONTH',
};

const PERIOD_LABEL: Record<GoalPeriodType, string> = {
  DAILY: 'hoje',
  WEEKLY: 'esta semana',
  MONTHLY: 'este mes',
};

function scopeCondition(scope: GoalScope) {
  if (scope === 'ALL') return undefined;
  if (scope === 'COMPANY') return isNull(goals.userId);
  return eq(goals.userId, scope.userId);
}

export async function listGoals(db: Database, workspaceId: string, options: { onlyActive?: boolean; scope?: GoalScope } = {},
): Promise<GoalWithOwner[]> {
  const today = toLocalDateString(new Date());
  const conditions = [];
  if (options.onlyActive) {
    conditions.push(eq(goals.active, true));
    conditions.push(lte(goals.startsOn, today));
    conditions.push(or(isNull(goals.endsOn), gte(goals.endsOn, today))!);
  }
  const scope = scopeCondition(options.scope ?? 'ALL');
  if (scope) conditions.push(scope);

  const rows = await db
    .select({
      goal: goals,
      userName: sql<string | null>`coalesce(nullif(trim(${users.name}), ''), ${users.email})`,
    })
    .from(goals)
    .leftJoin(users, eq(users.id, goals.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(users.name), goals.periodType, goals.metricType);

  return rows.map((row) => ({ ...row.goal, userName: row.goal.userId ? row.userName : null }));
}

export async function createGoal(db: Database, workspaceId: string, input: CreateGoalInput): Promise<Goal> {
  if (input.userId) {
    const [pessoa] = await db
      .select({ id: users.id, active: users.active })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    if (!pessoa) throw notFound('Colaborador nao encontrado.');
    if (!pessoa.active) {
      throw unprocessable('Este colaborador esta desativado. Reative-o antes de definir metas.');
    }
  }

  const now = new Date();
  const id = newId();

  await db.insert(goals).values({
    workspaceId,
    id,
    userId: input.userId ?? null,
    metricType: input.metricType,
    periodType: input.periodType,
    targetValue: normalizeMoney(input.targetValue),
    startsOn: input.startsOn,
    endsOn: input.endsOn ?? null,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.select().from(goals).where(and(eq(goals.workspaceId, workspaceId), eq(goals.id, id))).limit(1);
  return row!;
}

export async function updateGoal(db: Database, workspaceId: string, goalId: string,
  input: { targetValue?: string; endsOn?: string | null; active?: boolean },
): Promise<Goal> {
  const [goal] = await db.select().from(goals).where(and(eq(goals.workspaceId, workspaceId), eq(goals.id, goalId))).limit(1);
  if (!goal) throw notFound('Meta nao encontrada.');

  await db
    .update(goals)
    .set({
      ...(input.targetValue !== undefined
        ? { targetValue: normalizeMoney(input.targetValue) }
        : {}),
      ...(input.endsOn !== undefined ? { endsOn: input.endsOn } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(goals.workspaceId, workspaceId), eq(goals.id, goalId)));

  const [row] = await db.select().from(goals).where(and(eq(goals.workspaceId, workspaceId), eq(goals.id, goalId))).limit(1);
  return row!;
}

export async function deleteGoal(db: Database, workspaceId: string, goalId: string): Promise<void> {
  await db.delete(goals).where(and(eq(goals.workspaceId, workspaceId), eq(goals.id, goalId)));
}

/** Numeros de um periodo usados pelas metas, ja recortados por pessoa. */
interface GoalMetrics extends PeriodMetrics {
  leadsProspected: number;
}

async function loadGoalMetrics(
  db: Database,
  workspaceId: string,
  period: ResolvedPeriod,
  ownerUserId: string | null,
): Promise<GoalMetrics> {
  // Metas usam o periodo inteiro, sem recorte por origem/servico/cidade.
  const filters = {
    workspaceId,
    ownerUserId,
  };

  const [metrics, leadsProspected] = await Promise.all([
    getPeriodMetrics(db, period, filters),
    countLeadsProspected(db, period, filters),
  ]);

  return { ...metrics, leadsProspected };
}
/** Progresso das metas vigentes dentro do escopo pedido. */
export async function getGoalProgress(db: Database, workspaceId: string, scope: GoalScope = 'ALL',
  now: Date = new Date(),
): Promise<GoalProgress[]> {
  const active = await listGoals(db, workspaceId, { onlyActive: true, scope });
  const results: GoalProgress[] = [];

  // Cada combinacao periodo+pessoa e calculada uma vez e reaproveitada.
  const metricsCache = new Map<string, GoalMetrics>();

  for (const goal of active) {
    const preset = PERIOD_PRESET[goal.periodType as GoalPeriodType];
    const period = resolvePeriod({ preset }, now);

    const cacheKey = `${preset}:${goal.userId ?? 'empresa'}`;
    let metrics = metricsCache.get(cacheKey);
    if (!metrics) {
      metrics = await loadGoalMetrics(db, workspaceId, period, goal.userId);
      metricsCache.set(cacheKey, metrics);
    }

    results.push(buildProgress(goal, metrics, period));
  }

  return results;
}

function buildProgress(
  goal: GoalWithOwner,
  metrics: GoalMetrics,
  period: ResolvedPeriod,
): GoalProgress {
  const current = currentValueFor(goal.metricType as GoalMetricType, metrics);
  const targetCents = toCents(goal.targetValue);
  const currentCents = toCents(current);

  return {
    goal,
    current,
    target: goal.targetValue,
    ratio: targetCents === 0 ? 0 : currentCents / targetCents,
    remaining: normalizeMoney(Math.max(0, (targetCents - currentCents) / 100)),
    achieved: targetCents > 0 && currentCents >= targetCents,
    periodLabel: PERIOD_LABEL[goal.periodType as GoalPeriodType],
    fromDate: period.fromDate,
    toDate: period.toDate,
  };
}

function currentValueFor(metricType: GoalMetricType, metrics: GoalMetrics): string {
  switch (metricType) {
    case 'LEADS_PROSPECTED':
      return normalizeMoney(metrics.leadsProspected);
    case 'FIRST_CONTACTS':
      return normalizeMoney(metrics.firstContacts);
    case 'SALES_COUNT':
      return normalizeMoney(metrics.salesConfirmed);
    case 'REALIZED_REVENUE':
      return metrics.realizedRevenue;
    default:
      return '0.00';
  }
}

export interface SellerPerformance {
  userId: string;
  name: string;
  active: boolean;
  leadsProspected: number;
  firstContacts: number;
  responses: number;
  negotiationsStarted: number;
  salesConfirmed: number;
  realizedRevenue: string;
  conversionRate: number | null;
  /** Metas vigentes da pessoa, com progresso. */
  goals: GoalProgress[];
}

/**
 * Desempenho de cada vendedor no periodo escolhido, lado a lado com as metas
 * individuais. E a tela em que o dono da conta acompanha a equipe.
 */
export async function getSellerPerformance(db: Database, workspaceId: string, preset: PeriodPreset,
  now: Date = new Date(),
): Promise<{ fromDate: string; toDate: string; sellers: SellerPerformance[] }> {
  const period = resolvePeriod({ preset }, now);

  const sellers = await db
    .select({ id: users.id, name: users.name, email: users.email, active: users.active })
    .from(users)
    .where(eq(users.role, 'EMPLOYEE'))
    .orderBy(asc(users.name), asc(users.email));

  const allGoals = await getGoalProgress(db, workspaceId, 'ALL', now);

  const result: SellerPerformance[] = [];
  for (const seller of sellers) {
    const metrics = await loadGoalMetrics(db, workspaceId, period, seller.id);
    const goalsOfSeller = allGoals.filter((entry) => entry.goal.userId === seller.id);

    // Desativado sem meta e sem movimento so polui a tabela.
    if (!seller.active && goalsOfSeller.length === 0 && metrics.leadsProspected === 0) continue;

    result.push({
      userId: seller.id,
      name: seller.name.trim() || seller.email,
      active: seller.active,
      leadsProspected: metrics.leadsProspected,
      firstContacts: metrics.firstContacts,
      responses: metrics.responses,
      negotiationsStarted: metrics.negotiationsStarted,
      salesConfirmed: metrics.salesConfirmed,
      realizedRevenue: metrics.realizedRevenue,
      conversionRate: metrics.conversionRate,
      goals: goalsOfSeller,
    });
  }

  return { fromDate: period.fromDate, toDate: period.toDate, sellers: result };
}
