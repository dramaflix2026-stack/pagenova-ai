/**
 * Rotas de metas.
 *  GET    /api/goals              metas visiveis para quem pede, com progresso
 *  GET    /api/goals/performance  desempenho de cada vendedor (so gestor)
 *  POST   /api/goals              cria meta da empresa ou de um vendedor
 *  PATCH  /api/goals/:id
 *  DELETE /api/goals/:id
 *
 * Quem define metas (GOALS_MANAGE) ve todas. Os demais -- o vendedor --
 * veem apenas as proprias: a meta da empresa mostraria o faturamento inteiro.
 */
import { Router } from 'express';
import { z } from 'zod';

import { can, type UserRole } from '../../../shared/roles';
import { createGoalSchema, updateGoalSchema } from '../../../shared/schemas';
import { getDb } from '../../db/client';
import { asyncHandler, parseBody, parseQuery } from '../../lib/http';
import {
  requireCapability,
  requireCapabilityToWrite,
  csrfProtection,
  requireAuth,
} from '../../middleware';
import {
  createGoal,
  deleteGoal,
  getGoalProgress,
  getSellerPerformance,
  listGoals,
  updateGoal,
  type GoalScope,
} from './service';

export const goalsRouter: Router = Router();

goalsRouter.use(requireAuth);
goalsRouter.use('/goals', requireCapabilityToWrite('GOALS_MANAGE'));

/** O escopo vem da sessao, nunca da URL. */
const escopoDe = (req: { session?: { user: { id: string; role: string } } }): GoalScope =>
  can(req.session!.user.role as UserRole, 'GOALS_MANAGE')
    ? 'ALL'
    : { userId: req.session!.user.id };

goalsRouter.get(
  '/goals',
  asyncHandler(async (req, res) => {
    const db = getDb();
    const scope = escopoDe(req);
    res.json({
      goals: await listGoals(db, { scope }),
      progress: await getGoalProgress(db, scope),
    });
  }),
);

const performanceQuerySchema = z.object({
  preset: z.enum(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR']).default(
    'THIS_MONTH',
  ),
});

goalsRouter.get(
  '/goals/performance',
  requireCapability('GOALS_MANAGE'),
  asyncHandler(async (req, res) => {
    const { preset } = parseQuery(performanceQuerySchema, req);
    res.json(await getSellerPerformance(getDb(), preset));
  }),
);

goalsRouter.post(
  '/goals',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(createGoalSchema, req);
    res.status(201).json({ goal: await createGoal(getDb(), input) });
  }),
);

goalsRouter.patch(
  '/goals/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(updateGoalSchema, req);
    res.json({ goal: await updateGoal(getDb(), req.params.id!, input) });
  }),
);

goalsRouter.delete(
  '/goals/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    await deleteGoal(getDb(), req.params.id!);
    res.json({ ok: true });
  }),
);
