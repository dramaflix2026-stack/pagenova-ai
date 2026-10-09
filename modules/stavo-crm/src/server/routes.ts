/**
 * Agregador das rotas de API sob /api.
 * A ordem importa: rotas publicas primeiro, o resto exige sessao.
 */
import { Router } from 'express';

import { authRouter } from './modules/auth/router';
import { subscriberCycleSyncRouter } from './modules/billing/subscriber-cycle-sync';
import { subscriberCycleRevokeRouter } from './modules/billing/subscriber-cycle-revoke';
import { subscriberUsageAdminRouter } from './modules/billing/subscriber-usage-admin';
import { dashboardRouter } from './modules/dashboard/router';
import { duplicatesRouter } from './modules/duplicates/router';
import { exportsRouter } from './modules/exports/router';
import { garimpooRouter } from './modules/garimpoo/router';
import { goalsRouter } from './modules/goals/router';
import { googleRouter } from './modules/google/router';
import { healthRouter } from './modules/health/router';
import { importsRouter } from './modules/imports/router';
import { jobsRouter } from './modules/jobs/router';
import { leadsRouter } from './modules/leads/router';
import { locationsRouter } from './modules/locations/router';
import { meetingsRouter } from './modules/meetings/router';
import { financeRouter } from './modules/finance/router';
import { settingsRouter } from './modules/settings/router';
import { siteAiRouter } from './modules/site-ai/router';
import { teamRouter } from './modules/team/router';

export const apiRouter: Router = Router();

// Publicas
apiRouter.use(healthRouter);
apiRouter.use(jobsRouter);
apiRouter.use(subscriberCycleSyncRouter);
apiRouter.use(subscriberCycleRevokeRouter);
apiRouter.use(subscriberUsageAdminRouter);

// Autenticacao (login publico, demais exigem sessao internamente)
apiRouter.use(authRouter);

/**
 * Area privada.
 *
 * Cada router aplica `requireAuth` no proprio escopo. Como consequencia
 * deliberada da ordem, uma rota /api inexistente responde:
 *   - 401 para quem NAO esta autenticado (nao revela quais rotas existem);
 *   - 404 (ROUTE_NOT_FOUND) para a sessao valida.
 */
apiRouter.use(settingsRouter);
apiRouter.use(teamRouter);
apiRouter.use(leadsRouter);
apiRouter.use(duplicatesRouter);
apiRouter.use(importsRouter);
apiRouter.use(googleRouter);
apiRouter.use(locationsRouter);
apiRouter.use(meetingsRouter);
apiRouter.use(financeRouter);
apiRouter.use(goalsRouter);
apiRouter.use(dashboardRouter);
apiRouter.use(exportsRouter);
// Sites com IA: cada rota checa a feature flag e a capacidade SITE_AI_MANAGE.
apiRouter.use(siteAiRouter);
// Garimpoo: acesso proprio (cookie e tabela separados do CRM). O router checa
// a feature flag e responde 404 quando o modulo esta desligado.
apiRouter.use(garimpooRouter);
