/**
 * Job de manutencao (recorrencias + limpeza de sessoes).
 *
 * Duas formas de disparo, ambas idempotentes:
 *  - automatica, ao abrir o dashboard/financeiro (garante que o sistema se
 *    recupere mesmo sem cron);
 *  - opcional, por cron da hospedagem chamando este endpoint com CRON_SECRET.
 *
 * Se CRON_SECRET nao estiver definido, o endpoint permanece desabilitado.
 */
import { Router } from 'express';

import { getEnv } from '../../config/env';
import { getDb } from '../../db/client';
import { forbidden, notFound } from '../../lib/errors';
import { asyncHandler } from '../../lib/http';
import { logger } from '../../lib/logger';
import { safeCompare } from '../auth/sessions';
import { runMaintenance } from './maintenance';

export const jobsRouter: Router = Router();

jobsRouter.post(
  '/jobs/recurrences',
  asyncHandler(async (req, res) => {
    const env = getEnv();
    const secret = env.CRON_SECRET?.trim();

    // Sem segredo configurado a rota simplesmente nao existe.
    if (!secret) throw notFound('Rota de API nao encontrada.');

    const provided = req.get('x-cron-secret') ?? '';
    if (!provided || !safeCompare(secret, provided)) {
      logger.warn({ requestId: req.requestId }, 'Tentativa de execucao de job com segredo invalido.');
      throw forbidden('Segredo do cron invalido.');
    }

    const result = await runMaintenance(getDb());
    res.json({ ok: true, ...result });
  }),
);
