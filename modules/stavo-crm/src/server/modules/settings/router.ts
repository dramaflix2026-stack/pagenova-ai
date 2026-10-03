/**
 * Rotas de configuracao: etapas, origens, servicos, motivos de perda e
 * preferencias. Todas exigem sessao.
 */
import { Router } from 'express';

import { STAGE_MEANINGS } from '../../../shared/constants';
import {
  appSettingsSchema,
  createLossReasonSchema,
  createServiceSchema,
  createSourceSchema,
  createStageSchema,
  deleteStageSchema,
  reorderStagesSchema,
  updateLossReasonSchema,
  updateServiceSchema,
  updateSourceSchema,
  updateStageSchema,
} from '../../../shared/schemas';
import { getEnv } from '../../config/env';
import { getDb } from '../../db/client';
import { asyncHandler, parseBody } from '../../lib/http';
import { requireCapabilityToWrite, csrfProtection, requireAuth } from '../../middleware';
import { getUsageSummary } from '../google/usage';
import {
  createLossReason,
  createService,
  createSource,
  createStage,
  deleteService,
  deleteSource,
  deleteStage,
  getPreferences,
  listLossReasons,
  listServices,
  listSources,
  listStages,
  missingPrincipalStages,
  reorderStages,
  serviceUsage,
  updateLossReason,
  updatePreferences,
  updateService,
  updateSource,
  updateStage,
} from './service';

export const settingsRouter: Router = Router();

settingsRouter.use(requireAuth);
settingsRouter.use(
  ['/settings', '/stages', '/services', '/sources', '/loss-reasons'],
  requireCapabilityToWrite('SETTINGS_MANAGE'),
);

// --- Etapas ---------------------------------------------------------------

settingsRouter.get(
  '/stages',
  asyncHandler(async (_req, res) => {
    const db = getDb();
    const stages = await listStages(db);
    res.json({
      stages: stages.map((stage) => ({
        ...stage,
        // Explicacao em linguagem simples para o "O que esta etapa representa?".
        meaning: STAGE_MEANINGS[stage.semanticKey as keyof typeof STAGE_MEANINGS] ?? null,
      })),
      missingPrincipal: await missingPrincipalStages(db),
    });
  }),
);

settingsRouter.post(
  '/stages',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(createStageSchema, req);
    res.status(201).json({ stage: await createStage(getDb(), input) });
  }),
);

settingsRouter.patch(
  '/stages/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(updateStageSchema, req);
    res.json({ stage: await updateStage(getDb(), req.params.id!, input) });
  }),
);

settingsRouter.post(
  '/stages/reorder',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(reorderStagesSchema, req);
    res.json({ stages: await reorderStages(getDb(), input.orderedIds) });
  }),
);

settingsRouter.delete(
  '/stages/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(deleteStageSchema, req);
    const result = await deleteStage(
      getDb(),
      req.params.id!,
      input.destinationStageId,
      req.session!.user.id,
    );
    res.json({
      ...result,
      message: result.hardDeleted
        ? 'Etapa removida.'
        : 'Etapa removida do quadro. O historico anterior foi preservado.',
    });
  }),
);

// --- Origens --------------------------------------------------------------

settingsRouter.get(
  '/sources',
  asyncHandler(async (_req, res) => {
    res.json({ sources: await listSources(getDb()) });
  }),
);

settingsRouter.post(
  '/sources',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(createSourceSchema, req);
    res.status(201).json({ source: await createSource(getDb(), input.name) });
  }),
);

settingsRouter.patch(
  '/sources/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(updateSourceSchema, req);
    res.json({ source: await updateSource(getDb(), req.params.id!, input) });
  }),
);

settingsRouter.delete(
  '/sources/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    await deleteSource(getDb(), req.params.id!);
    res.json({ ok: true });
  }),
);

// --- Servicos -------------------------------------------------------------

settingsRouter.get(
  '/services',
  asyncHandler(async (_req, res) => {
    res.json({ services: await listServices(getDb()) });
  }),
);

settingsRouter.get(
  '/services/:id/usage',
  asyncHandler(async (req, res) => {
    res.json({ usage: await serviceUsage(getDb(), req.params.id!) });
  }),
);

settingsRouter.post(
  '/services',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(createServiceSchema, req);
    res.status(201).json({ service: await createService(getDb(), input) });
  }),
);

settingsRouter.patch(
  '/services/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(updateServiceSchema, req);
    res.json({ service: await updateService(getDb(), req.params.id!, input) });
  }),
);

settingsRouter.delete(
  '/services/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const result = await deleteService(getDb(), req.params.id!);
    res.json({
      ...result,
      message: result.deactivated
        ? 'Servico desativado. O historico de vendas foi preservado.'
        : 'Servico excluido.',
    });
  }),
);

// --- Motivos de perda -----------------------------------------------------

settingsRouter.get(
  '/loss-reasons',
  asyncHandler(async (_req, res) => {
    res.json({ lossReasons: await listLossReasons(getDb()) });
  }),
);

settingsRouter.post(
  '/loss-reasons',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(createLossReasonSchema, req);
    res.status(201).json({ lossReason: await createLossReason(getDb(), input.name) });
  }),
);

settingsRouter.patch(
  '/loss-reasons/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(updateLossReasonSchema, req);
    res.json({ lossReason: await updateLossReason(getDb(), req.params.id!, input) });
  }),
);

// --- Preferencias ---------------------------------------------------------

settingsRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const db = getDb();
    const env = getEnv();
    const preferences = await getPreferences(db);

    res.json({
      preferences,
      system: {
        timezone: env.APP_TIMEZONE,
        nodeEnv: env.NODE_ENV,
        // A chave nunca e exibida, nem parcialmente: apenas se esta configurada.
        googleConfigured: Boolean(env.GOOGLE_MAPS_API_KEY?.trim()),
        googleLanguage: env.GOOGLE_PLACES_LANGUAGE,
        googleRegion: env.GOOGLE_PLACES_REGION,
        maxImportFileMb: env.MAX_IMPORT_FILE_MB,
        maxImportRows: env.MAX_IMPORT_ROWS,
        cronConfigured: Boolean(env.CRON_SECRET?.trim()),
        bootstrapSecretPresent: Boolean(env.ADMIN_INITIAL_PASSWORD?.trim()),
      },
      googleUsage: await getUsageSummary(db),
    });
  }),
);

settingsRouter.patch(
  '/settings',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(appSettingsSchema, req);
    const preferences = await updatePreferences(getDb(), input, req.session!.user.id);
    res.json({ preferences });
  }),
);
