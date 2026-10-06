/**
 * Dashboard: metricas do periodo, funil atual, atencao, metas e tendencias.
 *
 * Todo calculo acontece no servidor. O navegador apenas formata.
 * Abrir o dashboard tambem dispara a manutencao idempotente, garantindo que
 * as recorrencias sejam geradas mesmo sem cron configurado.
 */
import { Router } from 'express';

import {
  can,
  leadVisibilityOwnerFilter,
  metricsOwnerFilter,
  type UserRole,
} from '../../../shared/roles';
import { dashboardFiltersSchema } from '../../../shared/schemas';
import { getDb } from '../../db/client';
import { resolvePeriod } from '../../domain/time';
import { asyncHandler, parseQuery } from '../../lib/http';
import { requireAuth } from '../../middleware';
import { getGoalProgress } from '../goals/service';
import { getUsageSummary } from '../google/usage';
import { scheduleMaintenance } from '../jobs/maintenance';
import { getPreferences } from '../settings/service';
import {
  getAttentionItems,
  getAverageStageTime,
  getBreakdowns,
  getDailySeries,
  getFinancialSnapshot,
  getFunnel,
  getPeriodMetrics,
} from './metrics';

export const dashboardRouter: Router = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const db = getDb();

    // O recorte por cargo NAO vem da querystring: vem da sessao. Aceitar isso
    // do navegador deixaria qualquer um ver o faturamento dos outros mudando
    // a URL.
    const filters = {
      ...parseQuery(dashboardFiltersSchema, req),
      workspaceId: req.session!.workspaceId,
      ownerUserId: metricsOwnerFilter(req.session!.user.role as UserRole, req.session!.user.id),
    };

    // Nao bloqueia a resposta: o job roda em segundo plano.
    scheduleMaintenance(db);

    const period = resolvePeriod({
      preset: filters.preset,
      from: filters.from,
      to: filters.to,
    });
    const preferences = await getPreferences(db, req.session!.workspaceId);

    const [metrics, funnel, financial, attention, goals, series, usage] = await Promise.all([
      getPeriodMetrics(db, period, filters),
      getFunnel(db, filters),
      getFinancialSnapshot(db, req.session!.workspaceId, filters.ownerUserId),
      getAttentionItems(db, {
        stalledNegotiationDays: preferences.stalledNegotiationDays,
        stalledSelectedDays: preferences.stalledSelectedDays,
        onlyOwnerUserId: leadVisibilityOwnerFilter(
          req.session!.user.role as UserRole,
          req.session!.user.id,
        ),
      }),
      // Gestor ve as metas da empresa; o vendedor ve as proprias.
      getGoalProgress(
        db,
        req.session!.workspaceId,
        can(req.session!.user.role as UserRole, 'GOALS_MANAGE')
          ? 'COMPANY'
          : { userId: req.session!.user.id },
      ),
      getDailySeries(db, period, filters),
      getUsageSummary(db, req.session!.workspaceId),
    ]);

    // Quota perto do limite tambem e um item de atencao.
    const quotaItems = usage
      .filter((entry) => entry.warning)
      .map((entry) => ({
        kind: 'GOOGLE_QUOTA' as const,
        title: `Consumo da API do Google em ${entry.used} de ${entry.limit}`,
        description: entry.blocked
          ? 'O limite interno foi atingido. Ajuste em Configuracoes ou aguarde o proximo mes.'
          : `Ja passou de ${entry.warningPercent}% do limite interno deste mes.`,
        leadId: null,
        amount: null,
        dueDate: null,
        priority: entry.blocked ? 2 : 5,
      }));

    res.json({
      period: {
        preset: period.preset,
        fromDate: period.fromDate,
        toDate: period.toDate,
      },
      metrics,
      funnel,
      financial,
      attention: [...attention, ...quotaItems].sort((a, b) => a.priority - b.priority),
      goals,
      series,
      googleUsage: usage,
    });
  }),
);

dashboardRouter.get(
  '/dashboard/breakdowns',
  asyncHandler(async (req, res) => {
    const filters = parseQuery(dashboardFiltersSchema, req);
    const db = getDb();
    const period = resolvePeriod({
      preset: filters.preset,
      from: filters.from,
      to: filters.to,
    });

    res.json({
      breakdowns: await getBreakdowns(db, period),
      stageTimes: await getAverageStageTime(db),
    });
  }),
);
