/**
 * Rotas dos Sites com IA.
 *
 *  GET    /api/site-ai/diagnostics        estado do modulo e da configuracao
 *  GET    /api/site-projects              listagem com filtros e paginacao
 *  POST   /api/site-projects              criar (com lead ou avulso)
 *  GET    /api/site-projects/:id          detalhe
 *  PATCH  /api/site-projects/:id          editar dados basicos
 *  POST   /api/site-projects/:id/archive  arquivar
 *  POST   /api/site-projects/:id/generate enfileirar a geracao
 *  GET    /api/site-jobs/:jobId           estado do job
 *  GET    /api/site-jobs/:jobId/events    trilha de etapas reais
 *  POST   /api/site-jobs/:jobId/cancel    pedir cancelamento
 *
 * Todas exigem sessao E a capacidade SITE_AI_MANAGE: gerar um site gasta
 * credito pago, entao nao basta estar logado.
 *
 * A rota publica do site publicado NAO fica aqui -- ela nao passa por /api nem
 * por autenticacao, e sera registrada em `app.ts` na etapa A12.
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';

import {
  createSiteProjectSchema,
  generateSiteSchema,
  siteProjectListSchema,
  updateSiteProjectSchema,
} from '../../../shared/schemas';
import { validateSlug } from '@site-kit/types/site-ai';
import { getEnv, isSiteAiEnabled } from '../../config/env';
import { badRequest, conflict, notFound, serviceUnavailable } from '../../lib/errors';
import { asyncHandler, parseBody, parseQuery } from '../../lib/http';
import { csrfProtection, requireAuth, requireCapability } from '../../middleware';
import { ProviderError, usageRecord } from '@builder/generation/provider';
import * as repo from './repository';
import {
  archiveProject,
  assertBudgetAvailable,
  createProject,
  getProjectOrThrow,
  moduleDiagnostics,
  requestGeneration,
  transitionProject,
  validateAndLintConfig,
} from './service';

export const siteAiRouter: Router = Router();

/**
 * Executa uma chamada paga e, se ela falhar DEPOIS de cobrada, grava o gasto.
 *
 * Sem isto, uma edicao de secao que voltava em JSON invalido era cobrada pela
 * Anthropic e sumia: nem o uso nem o custo do projeto registravam nada.
 */
async function withFailedUsage<T>(
  projectId: string,
  provider: string,
  operation: string,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ProviderError && error.usage) {
      await repo.recordUsage(
        usageRecord({ projectId, jobId: null, provider, operation, usage: error.usage, status: 'FAILED', errorCode: error.code }),
      );
      await repo.addProjectCost(projectId, String(error.usage.costEstimatedUsd));
    }
    throw error;
  }
}

/**
 * Guarda da feature flag.
 *
 * Desligado, o modulo responde 503 com o motivo em vez de 404: quem chamou
 * precisa saber que a rota existe e esta desativada, e nao ficar procurando um
 * erro de digitacao no endereco.
 */
const requireModuleEnabled = asyncHandler(async (_req, _res, next) => {
  if (!isSiteAiEnabled()) {
    throw serviceUnavailable(
      'O modulo Sites com IA esta desativado. Ligue SITE_AI_ENABLED no servidor para usa-lo.',
      'SITE_AI_DISABLED',
    );
  }
  next();
});

const guards = [requireAuth, requireCapability('SITE_AI_MANAGE'), requireModuleEnabled] as const;

/**
 * Limite das operacoes que custam dinheiro.
 *
 * Separado do limite geral da API de proposito: listar projetos e barato,
 * enfileirar uma geracao nao e.
 */
const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Muitos pedidos de geracao em uma hora. Aguarde antes de tentar de novo.',
    },
  },
});

// ---------------------------------------------------------------------------
// Diagnostico
// ---------------------------------------------------------------------------

/**
 * Estado da configuracao.
 *
 * Nao passa por `requireModuleEnabled`: e justamente esta rota que explica
 * por que o modulo esta desligado.
 */
siteAiRouter.get(
  '/site-ai/diagnostics',
  requireAuth,
  requireCapability('SITE_AI_MANAGE'),
  asyncHandler(async (_req, res) => {
    res.json({ diagnostics: await moduleDiagnostics() });
  }),
);

// ---------------------------------------------------------------------------
// Projetos
// ---------------------------------------------------------------------------

siteAiRouter.get(
  '/site-projects',
  ...guards,
  asyncHandler(async (req, res) => {
    const filters = parseQuery(siteProjectListSchema, req);
    const { rows, total } = await repo.listProjects({ ...filters, workspaceId: req.session!.workspaceId });

    res.json({
      projects: rows.map(toPublicProject),
      total,
      limit: filters.limit,
      offset: filters.offset,
    });
  }),
);

siteAiRouter.post(
  '/site-projects',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(createSiteProjectSchema, req);
    const session = req.session!;

    const project = await createProject(
      session.workspaceId,
      {
        leadId: input.leadId ?? null,
        internalName: input.internalName,
        businessName: input.businessName,
        siteType: input.siteType,
        desiredSlug: input.desiredSlug ?? null,
        briefing: input.briefing,
      },
      { userId: session.user.id, canSeeEveryProject: true },
    );

    res.status(201).json({ project: toPublicProject(project) });
  }),
);

siteAiRouter.get(
  '/site-projects/:id',
  ...guards,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const [versions, jobs] = await Promise.all([
      repo.listVersions(project.id, 20),
      repo.listJobsByProject(project.id, 10),
    ]);

    res.json({
      project: toPublicProject(project),
      versions: versions.map((version) => ({
        id: version.id,
        versionNumber: version.versionNumber,
        origin: version.origin,
        summary: version.summary,
        createdAt: version.createdAt,
      })),
      jobs: jobs.map(toPublicJob),
    });
  }),
);

siteAiRouter.patch(
  '/site-projects/:id',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(updateSiteProjectSchema, req);
    const project = await getProjectOrThrow(req.params.id!);

    let desiredSlug = project.desiredSlug;
    if (input.desiredSlug !== undefined) {
      if (input.desiredSlug === null || input.desiredSlug === '') {
        desiredSlug = null;
      } else {
        const result = validateSlug(input.desiredSlug);
        if (!result.ok) {
          throw badRequest(result.reason, { fieldErrors: { desiredSlug: [result.reason] } });
        }
        desiredSlug = result.slug;
      }
    }

    const saved = await repo.updateProject(project.id, input.expectedLockVersion, {
      ...(input.internalName !== undefined ? { internalName: input.internalName } : {}),
      ...(input.businessName !== undefined ? { businessName: input.businessName } : {}),
      ...(input.siteType !== undefined ? { siteType: input.siteType } : {}),
      desiredSlug,
    });

    if (!saved) {
      // 409 com o estado atual: o usuario perde o clique, nunca o texto.
      const current = await getProjectOrThrow(project.id);
      throw conflict(
        'Alguem alterou este projeto enquanto voce editava. Confira a versao atual antes de salvar.',
        { code: 'SITE_PROJECT_CONFLICT', details: { project: toPublicProject(current) } },
      );
    }

    res.json({ project: toPublicProject(await getProjectOrThrow(project.id)) });
  }),
);

siteAiRouter.post(
  '/site-projects/:id/archive',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    await archiveProject(project);
    res.json({ project: toPublicProject(await getProjectOrThrow(project.id)) });
  }),
);

siteAiRouter.post(
  '/site-projects/:id/generate',
  ...guards,
  generationLimiter,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(generateSiteSchema, req);
    const project = await getProjectOrThrow(req.params.id!);
    const session = req.session!;

    const { jobId, created } = await requestGeneration(
      project,
      { userId: session.user.id, canSeeEveryProject: true },
      input.idempotencyKey,
    );

    // 202: o trabalho foi aceito, nao concluido. O cliente acompanha por job.
    res.status(created ? 202 : 200).json({ jobId, created });
  }),
);

// ---------------------------------------------------------------------------
// Editor: rascunho, versoes e edicao por IA
// ---------------------------------------------------------------------------

/**
 * Rascunho atual (o que o editor mostra e edita).
 *
 * Separado do detalhe do projeto de proposito: `draftConfig` e o objeto mais
 * pesado do projeto, e a listagem/detalhe basico nao precisam dele.
 */
siteAiRouter.get(
  '/site-projects/:id/config',
  ...guards,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    res.json({ config: project.draftConfig ?? null, lockVersion: project.lockVersion });
  }),
);

/**
 * Salva o rascunho inteiro.
 *
 * O cliente monta o SiteSchema completo (secoes reordenadas, textos
 * editados, tema) e este endpoint valida de novo no servidor -- o
 * formulario impede boa parte dos erros, mas nunca e a autoridade final.
 *
 * So BLOQUEIA em erro estrutural do schema. Aviso do linter fica registrado
 * na resposta para o editor mostrar, mas nao impede salvar: o rascunho pode
 * ficar temporariamente imperfeito enquanto o administrador trabalha nele.
 * Quem bloqueia de verdade e a publicacao (etapa A12).
 */
siteAiRouter.patch(
  '/site-projects/:id/config',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const body = req.body as { config?: unknown; expectedLockVersion?: number };

    if (typeof body.expectedLockVersion !== 'number') {
      throw badRequest('Informe expectedLockVersion.', {
        fieldErrors: { expectedLockVersion: ['Campo obrigatorio.'] },
      });
    }

    const { model, report } = validateAndLintConfig(body.config);

    const saved = await repo.updateProject(project.id, body.expectedLockVersion, { draftConfig: model });
    if (!saved) {
      const current = await getProjectOrThrow(project.id);
      throw conflict(
        'Alguem salvou uma alteracao neste site enquanto voce editava. Recarregue para ver a versao atual.',
        {
          code: 'SITE_PROJECT_CONFLICT',
          details: { project: toPublicProject(current), config: current.draftConfig },
        },
      );
    }

    const updated = await getProjectOrThrow(project.id);
    res.json({ project: toPublicProject(updated), lint: { errors: report.errors, warnings: report.warnings } });
  }),
);

siteAiRouter.get(
  '/site-projects/:id/versions',
  ...guards,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const versions = await repo.listVersions(project.id, 50);
    res.json({
      versions: versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        origin: v.origin,
        summary: v.summary,
        createdAt: v.createdAt,
      })),
    });
  }),
);

/** Versao manual, fora do ritmo do autosave (secao 15.9). */
siteAiRouter.post(
  '/site-projects/:id/versions',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    if (!project.draftConfig) {
      throw conflict('Este projeto ainda nao tem um rascunho para versionar.', {
        code: 'SITE_PROJECT_NO_DRAFT',
      });
    }

    const summary = typeof req.body?.summary === 'string' ? req.body.summary.slice(0, 300) : null;
    const { versionNumber } = await repo.insertVersion({
      projectId: project.id,
      config: project.draftConfig,
      schemaVersion: project.schemaVersion,
      rendererVersion: project.rendererVersion,
      promptVersion: project.promptVersion,
      origin: 'MANUAL',
      summary,
      createdBy: req.session!.user.id,
    });

    await repo.updateProject(project.id, project.lockVersion, { currentVersionNumber: versionNumber });
    res.status(201).json({ versionNumber });
  }),
);

/** Restaura uma versao anterior PARA O RASCUNHO. Nao apaga nada do historico. */
siteAiRouter.post(
  '/site-projects/:id/versions/:versionId/restore',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const version = await repo.findVersion(project.id, req.params.versionId!);
    if (!version) throw notFound('Versao nao encontrada.', 'SITE_VERSION_NOT_FOUND');

    const saved = await repo.updateProject(project.id, project.lockVersion, { draftConfig: version.config });
    if (!saved) {
      throw conflict('O projeto mudou enquanto voce restaurava. Recarregue e tente de novo.', {
        code: 'SITE_PROJECT_CONFLICT',
      });
    }

    res.json({ project: toPublicProject(await getProjectOrThrow(project.id)) });
  }),
);

/**
 * Edicao de UMA secao por IA (secao 8.5: economica, escopo unico).
 *
 * Nunca reenvia nem regenera o site inteiro -- so a secao apontada, a
 * direcao criativa compacta e a instrucao. Aplica o resultado como uma NOVA
 * versao (origin AI_PATCH), entao "desfazer" e restaurar a versao anterior.
 */
siteAiRouter.post(
  '/site-projects/:id/sections/:sectionId/ai-edit',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const instruction = typeof req.body?.instruction === 'string' ? req.body.instruction.trim() : '';
    if (!instruction) {
      throw badRequest('Descreva o que deve mudar nesta secao.', {
        fieldErrors: { instruction: ['Campo obrigatorio.'] },
      });
    }
    if (!project.draftConfig) {
      throw conflict('Este projeto ainda nao tem um rascunho para editar.', { code: 'SITE_PROJECT_NO_DRAFT' });
    }

    const { model: currentModel } = validateAndLintConfig(project.draftConfig);
    const sectionIndex = currentModel.sections.findIndex((s) => s.id === req.params.sectionId);
    if (sectionIndex === -1) throw notFound('Secao nao encontrada neste projeto.', 'SITE_SECTION_NOT_FOUND');

    const currentSection = currentModel.sections[sectionIndex]!;
    const { createSiteIntelligenceProvider } = await import('@builder/generation');
    const { variantsFor } = await import('@site-kit/registry/variants');

    // Toda chamada paga confere o orcamento antes, nao so a geracao inicial.
    await assertBudgetAvailable(project);

    const provider = createSiteIntelligenceProvider();
    const { section: patchedRaw, usage } = await withFailedUsage(project.id, provider.name, 'PATCH_SECTION', () =>
      provider.patchSection({
        business: currentModel.business,
        creativeDirection: currentModel.creativeDirection,
        currentSection,
        allowedVariants: variantsFor(currentSection.type).map((v) => v.id),
        instruction,
      }),
    );

    // A IA devolve JSON livre; o schema da secao continua sendo a autoridade.
    const { siteSectionSchema } = await import('@site-kit/schemas/site-schema');
    const parsedSection = siteSectionSchema.safeParse(patchedRaw);
    if (!parsedSection.success || parsedSection.data.type !== currentSection.type) {
      throw badRequest('A IA nao devolveu uma secao valida para este tipo. Nada foi alterado.', {
        code: 'SITE_AI_PATCH_INVALID',
      });
    }

    const nextSections = [...currentModel.sections];
    nextSections[sectionIndex] = { ...parsedSection.data, id: currentSection.id, anchor: currentSection.anchor };
    const nextModel = { ...currentModel, sections: nextSections };

    await repo.recordUsage(
      usageRecord({ projectId: project.id, jobId: null, provider: provider.name, operation: 'PATCH_SECTION', usage, status: 'SUCCESS' }),
    );
    await repo.addProjectCost(project.id, String(usage.costEstimatedUsd));

    const saved = await repo.updateProject(project.id, project.lockVersion, { draftConfig: nextModel });
    if (!saved) {
      throw conflict('O projeto mudou enquanto a IA editava. A alteracao nao foi aplicada; tente de novo.', {
        code: 'SITE_PROJECT_CONFLICT',
      });
    }

    res.json({ project: toPublicProject(await getProjectOrThrow(project.id)), section: nextSections[sectionIndex] });
  }),
);

// ---------------------------------------------------------------------------
// Assets (secao 13 da especificacao)
// ---------------------------------------------------------------------------

const assetUpload = multer({
  // So memoria: o arquivo passa por validacao de bytes e processamento antes
  // de qualquer coisa tocar disco -- nunca gravamos o que o usuario mandou.
  storage: multer.memoryStorage(),
  limits: { fileSize: getEnv().MAX_SITE_ASSET_UPLOAD_MB * 1024 * 1024, files: 1 },
});

siteAiRouter.get(
  '/site-projects/:id/assets',
  ...guards,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const assets = await repo.listAssets(project.id);
    res.json({ assets: assets.map(toPublicAsset) });
  }),
);

/**
 * Upload de imagem.
 *
 * O MIME e decidido pelos bytes do arquivo, nunca pela extensao ou pelo
 * `Content-Type` enviado pelo navegador (secao 13.2/25.4). O arquivo
 * ORIGINAL nunca e gravado: so a versao otimizada (EXIF removido, WebP,
 * redimensionada) chega ao disco.
 */
siteAiRouter.post(
  '/site-projects/:id/assets',
  ...guards,
  csrfProtection,
  assetUpload.single('file'),
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    if (!req.file) {
      throw badRequest('Envie um arquivo no campo "file".', { fieldErrors: { file: ['Obrigatorio.'] } });
    }

    const { processUploadedImage } = await import('@builder/publishing/image-processing');
    const result = await processUploadedImage(req.file.buffer);
    if (!result.ok) {
      throw badRequest(result.reason, { code: 'SITE_ASSET_INVALID' });
    }

    const { createLocalStorage } = await import('@builder/publishing/storage');
    const { siteAssetsDirAbsolute } = await import('../../config/env');
    const storage = createLocalStorage(siteAssetsDirAbsolute());

    const { newId } = await import('../../lib/ids');
    const storageKey = `${project.id}/${newId()}.webp`;
    await storage.write(storageKey, result.image.optimized.buffer);

    const assetId = await repo.insertAsset({
      projectId: project.id,
      source: 'UPLOAD',
      storageKey,
      originalFilename: sanitizeFilename(req.file.originalname),
      mimeType: 'image/webp',
      width: result.image.optimized.width,
      height: result.image.optimized.height,
      sizeBytes: result.image.optimized.sizeBytes,
      checksum: result.image.checksum,
      altText: typeof req.body?.altText === 'string' ? req.body.altText.slice(0, 300) : null,
      rightsStatus: 'OWNED',
      createdBy: req.session!.user.id,
    });

    const asset = await repo.findAsset(project.id, assetId);
    res.status(201).json({ asset: asset ? toPublicAsset(asset) : null });
  }),
);

/** Bytes do asset. Autenticado: o rascunho nao publicado nao e publico. */
siteAiRouter.get(
  '/site-projects/:id/assets/:assetId/file',
  ...guards,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const asset = await repo.findAsset(project.id, req.params.assetId!);
    if (!asset) throw notFound('Arquivo nao encontrado.', 'SITE_ASSET_NOT_FOUND');

    const { createLocalStorage } = await import('@builder/publishing/storage');
    const { siteAssetsDirAbsolute } = await import('../../config/env');
    const storage = createLocalStorage(siteAssetsDirAbsolute());

    const buffer = await storage.read(asset.storageKey).catch(() => null);
    if (!buffer) throw notFound('Arquivo nao encontrado no armazenamento.', 'SITE_ASSET_MISSING_FILE');

    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.type(asset.mimeType).send(buffer);
  }),
);

siteAiRouter.patch(
  '/site-projects/:id/assets/:assetId',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const asset = await repo.findAsset(project.id, req.params.assetId!);
    if (!asset) throw notFound('Arquivo nao encontrado.', 'SITE_ASSET_NOT_FOUND');

    const body = req.body as { altText?: string; focalX?: number; focalY?: number };
    const patch: Parameters<typeof repo.updateAsset>[2] = {};
    if (typeof body.altText === 'string') patch.altText = body.altText.slice(0, 300);
    if (typeof body.focalX === 'number') patch.focalX = String(Math.min(1, Math.max(0, body.focalX)));
    if (typeof body.focalY === 'number') patch.focalY = String(Math.min(1, Math.max(0, body.focalY)));

    await repo.updateAsset(project.id, asset.id, patch);
    const updated = await repo.findAsset(project.id, asset.id);
    res.json({ asset: updated ? toPublicAsset(updated) : null });
  }),
);

siteAiRouter.delete(
  '/site-projects/:id/assets/:assetId',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const removed = await repo.softDeleteAsset(project.id, req.params.assetId!);
    if (!removed) throw notFound('Arquivo nao encontrado.', 'SITE_ASSET_NOT_FOUND');
    res.status(204).end();
  }),
);

// ---------------------------------------------------------------------------
// Publicacao (secao 16 da especificacao)
// ---------------------------------------------------------------------------

siteAiRouter.get(
  '/site-projects/:id/publications',
  ...guards,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const publications = await repo.listPublications(project.id);
    res.json({ publications: publications.map(toPublicPublication) });
  }),
);

siteAiRouter.post(
  '/site-projects/:id/publish',
  ...guards,
  generationLimiter,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const body = req.body as { acknowledgedWarnings?: boolean; desiredSlug?: string };

    const { publishProject } = await import('@builder/publishing/publisher');
    const result = await publishProject(project, req.session!.user.id, {
      acknowledgedWarnings: Boolean(body.acknowledgedWarnings),
      desiredSlug: body.desiredSlug,
    });

    res.json({ publication: toPublicPublication(result.publication), url: result.url });
  }),
);

siteAiRouter.post(
  '/site-projects/:id/unpublish',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const { unpublishProject } = await import('@builder/publishing/publisher');
    await unpublishProject(project);
    res.json({ project: toPublicProject(await getProjectOrThrow(project.id)) });
  }),
);

siteAiRouter.post(
  '/site-projects/:id/publications/:publicationId/rollback',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const { rollbackPublication } = await import('@builder/publishing/publisher');
    await rollbackPublication(project, req.params.publicationId!);
    res.json({ project: toPublicProject(await getProjectOrThrow(project.id)) });
  }),
);

// ---------------------------------------------------------------------------
// WhatsApp / abordagem (secao 18)
// ---------------------------------------------------------------------------

siteAiRouter.get(
  '/site-projects/:id/outreach',
  ...guards,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const messages = await repo.listOutreachMessages(project.id);
    res.json({ messages: messages.map(toPublicOutreach) });
  }),
);

/**
 * Gera a mensagem (secao 18.2).
 *
 * Usa o modelo RAPIDO e um contexto compacto -- nome, nicho, URL -- nunca o
 * SiteSchema inteiro. Exige uma publicacao ativa: nao faz sentido convidar o
 * prospect para um link que ainda nao existe.
 */
siteAiRouter.post(
  '/site-projects/:id/outreach/generate',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    if (!project.activePublicationId) {
      throw conflict('Publique o site antes de gerar a mensagem: ela precisa de um link real.', {
        code: 'SITE_PROJECT_NOT_PUBLISHED',
      });
    }

    const publication = await repo.findPublication(project.activePublicationId);
    if (!publication) throw notFound('Publicacao nao encontrada.', 'SITE_PUBLICATION_NOT_FOUND');

    const { model } = validateAndLintConfig(project.draftConfig);
    const { createSiteIntelligenceProvider } = await import('@builder/generation');
    const provider = createSiteIntelligenceProvider();

    await assertBudgetAvailable(project);

    const siteUrl = `${publication.baseUrlSnapshot ?? ''}/p/${publication.slug}`;
    const { message, usage } = await withFailedUsage(project.id, provider.name, 'OUTREACH', () =>
      provider.generateOutreachMessage({
        businessName: model.business.name,
        niche: model.business.niche,
        siteUrl,
      }),
    );

    await repo.recordUsage(
      usageRecord({ projectId: project.id, jobId: null, provider: provider.name, operation: 'OUTREACH', usage, status: 'SUCCESS' }),
    );
    await repo.addProjectCost(project.id, String(usage.costEstimatedUsd));

    const phone = model.business.whatsappE164?.value ?? model.business.phoneE164?.value ?? null;
    const messageId = await repo.insertOutreachMessage({
      projectId: project.id,
      publicationId: publication.id,
      leadId: project.leadId,
      phoneSnapshot: phone,
      messageText: message,
      generatedByModel: usage.model,
      createdBy: req.session!.user.id,
    });

    const created = await repo.findOutreachMessage(project.id, messageId);
    res.status(201).json({ message: created ? toPublicOutreach(created) : null });
  }),
);

siteAiRouter.patch(
  '/site-projects/:id/outreach/:messageId',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const text = typeof req.body?.messageText === 'string' ? req.body.messageText.trim() : '';
    if (!text) throw badRequest('A mensagem nao pode ficar vazia.', { fieldErrors: { messageText: ['Obrigatorio.'] } });

    const updated = await repo.updateOutreachMessage(project.id, req.params.messageId!, {
      messageText: text.slice(0, 2000),
      editedByUser: true,
    });
    if (!updated) throw notFound('Mensagem nao encontrada.', 'SITE_OUTREACH_NOT_FOUND');

    const message = await repo.findOutreachMessage(project.id, req.params.messageId!);
    res.json({ message: message ? toPublicOutreach(message) : null });
  }),
);

/** Marca que o `wa.me` foi aberto. Isto NAO significa que a mensagem foi enviada. */
siteAiRouter.post(
  '/site-projects/:id/outreach/:messageId/opened',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    await repo.markOutreachOpened(project.id, req.params.messageId!);
    const message = await repo.findOutreachMessage(project.id, req.params.messageId!);
    if (!message) throw notFound('Mensagem nao encontrada.', 'SITE_OUTREACH_NOT_FOUND');
    res.json({ message: toPublicOutreach(message) });
  }),
);

/**
 * Confirmacao MANUAL de envio (secao 18.3/18.4).
 *
 * So esta chamada registra o contato de verdade -- abrir o link nunca basta.
 * Quando o projeto pertence a um lead, cria uma atividade de tentativa de
 * WhatsApp no MESMO mecanismo que o resto do CRM ja usa, em vez de inventar
 * um segundo historico de contato.
 */
siteAiRouter.post(
  '/site-projects/:id/outreach/:messageId/confirm-sent',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    const marked = await repo.markOutreachConfirmedSent(project.id, req.params.messageId!);
    if (!marked) {
      // Idempotente: ja confirmado antes nao e erro, so nao duplica a atividade.
      const existing = await repo.findOutreachMessage(project.id, req.params.messageId!);
      if (!existing) throw notFound('Mensagem nao encontrada.', 'SITE_OUTREACH_NOT_FOUND');
      res.json({ message: toPublicOutreach(existing) });
      return;
    }

    if (project.leadId) {
      const { recordActivity } = await import('../leads/service');
      const { getDb } = await import('../../db/client');
      await recordActivity(
        getDb(),
        project.leadId,
        { activityType: 'WHATSAPP_ATTEMPT', body: 'Mensagem do site com IA enviada pelo WhatsApp.' },
        req.session!.user.id,
      ).catch(() => undefined); // o lead pode ter sido excluido depois; a confirmacao nao pode falhar por isso.
    }

    const message = await repo.findOutreachMessage(project.id, req.params.messageId!);
    res.json({ message: message ? toPublicOutreach(message) : null });
  }),
);

// ---------------------------------------------------------------------------
// Exportacao ZIP (secao 17)
// ---------------------------------------------------------------------------

/**
 * Uma unica requisicao sincrona que devolve os bytes do ZIP (ver o
 * comentario de topo de `exporter.ts` sobre a adaptacao do fluxo em duas
 * etapas da especificacao).
 */
siteAiRouter.post(
  '/site-projects/:id/exports',
  ...guards,
  generationLimiter,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const project = await getProjectOrThrow(req.params.id!);
    if (!project.draftConfig) {
      throw conflict('Este projeto ainda nao tem um rascunho para exportar.', { code: 'SITE_PROJECT_NO_DRAFT' });
    }

    const body = req.body as { allowIndexing?: boolean; canonicalUrl?: string; businessNameOverride?: string };
    const { exportProjectZip } = await import('@builder/publishing/exporter');
    const result = await exportProjectZip(project.id, project.draftConfig, {
      allowIndexing: Boolean(body.allowIndexing),
      canonicalUrl: body.canonicalUrl,
      businessNameOverride: body.businessNameOverride,
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('X-Site-Export-Warnings', String(result.warnings.length));
    res.send(result.buffer);
  }),
);

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

siteAiRouter.get(
  '/site-jobs/:jobId',
  ...guards,
  asyncHandler(async (req, res) => {
    const job = await repo.findJob(req.params.jobId!);
    if (!job) throw notFound('Geracao nao encontrada.', 'SITE_JOB_NOT_FOUND');
    res.json({ job: toPublicJob(job) });
  }),
);

siteAiRouter.get(
  '/site-jobs/:jobId/events',
  ...guards,
  asyncHandler(async (req, res) => {
    const job = await repo.findJob(req.params.jobId!);
    if (!job) throw notFound('Geracao nao encontrada.', 'SITE_JOB_NOT_FOUND');

    const after = Number(req.query.after ?? 0);
    const events = await repo.listEvents(job.id, Number.isFinite(after) ? Math.max(0, after) : 0);

    res.json({
      job: toPublicJob(job),
      events: events.map((event) => ({
        sequence: event.sequence,
        eventType: event.eventType,
        stage: event.stage,
        message: event.message,
        createdAt: event.createdAt,
      })),
    });
  }),
);

/**
 * SSE: canal preferido de progresso.
 *
 * O estado de verdade e sempre o banco (secao 22.3) -- este endpoint apenas
 * fica reconsultando `repo.listEvents` e empurrando o que for novo. Sem
 * pub/sub proprio: a premissa do worker ja e processo unico, entao pooling no
 * mesmo banco que o worker escreve e suficiente e nao adiciona infraestrutura.
 *
 * Reconecta com `Last-Event-ID` (ou `?after=`) e continua exatamente de onde
 * parou. Quando o job chega a um estado terminal, o stream fecha sozinho --
 * o cliente nao fica com uma conexao pendurada para sempre.
 */
siteAiRouter.get(
  '/site-jobs/:jobId/stream',
  ...guards,
  asyncHandler(async (req, res) => {
    const job = await repo.findJob(req.params.jobId!);
    if (!job) throw notFound('Geracao nao encontrada.', 'SITE_JOB_NOT_FOUND');

    const headerLastEventId = Number(req.get('last-event-id'));
    const queryAfter = Number(req.query.after);
    let lastSequence = Number.isFinite(headerLastEventId)
      ? headerLastEventId
      : Number.isFinite(queryAfter)
        ? queryAfter
        : 0;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const send = (event: string, data: unknown, id?: number): void => {
      if (id !== undefined) res.write(`id: ${id}\n`);
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    let closed = false;
    req.on('close', () => {
      closed = true;
    });

    const SITE_JOB_TERMINAL = new Set(['SUCCEEDED', 'FAILED', 'CANCELED']);

    while (!closed) {
      const current = await repo.findJob(job.id);
      if (!current) {
        send('error', { message: 'Geracao nao encontrada.' });
        break;
      }

      const events = await repo.listEvents(current.id, lastSequence);
      for (const event of events) {
        send(
          'stage',
          { stage: event.stage, eventType: event.eventType, message: event.message },
          event.sequence,
        );
        lastSequence = event.sequence;
      }

      send('job', toPublicJob(current));

      if (SITE_JOB_TERMINAL.has(current.status)) break;

      // Heartbeat + espera: mantem a conexao viva atras de proxy reverso e
      // da tempo do worker produzir o proximo evento antes de consultar de novo.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!closed) res.write(': keep-alive\n\n');
    }

    if (!closed) res.end();
  }),
);

siteAiRouter.post(
  '/site-jobs/:jobId/cancel',
  ...guards,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const job = await repo.findJob(req.params.jobId!);
    if (!job) throw notFound('Geracao nao encontrada.', 'SITE_JOB_NOT_FOUND');

    // O cancelamento e um PEDIDO: o worker para no proximo ponto seguro, para
    // nao deixar o projeto pela metade.
    const requested = await repo.requestCancel(job.id);
    if (!requested) {
      throw conflict('Esta geracao ja terminou ou ja tinha cancelamento pedido.', {
        code: 'SITE_JOB_NOT_CANCELABLE',
      });
    }

    res.json({ job: toPublicJob((await repo.findJob(job.id))!) });
  }),
);

siteAiRouter.post(
  '/site-jobs/:jobId/retry',
  ...guards,
  generationLimiter,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const job = await repo.findJob(req.params.jobId!);
    if (!job) throw notFound('Geracao nao encontrada.', 'SITE_JOB_NOT_FOUND');

    if (job.status !== 'FAILED') {
      throw conflict('So e possivel retomar uma geracao que falhou.', { code: 'SITE_JOB_NOT_RETRYABLE' });
    }
    if (job.attempt >= job.maxAttempts) {
      throw conflict('Este job esgotou as tentativas. Crie uma nova geracao.', {
        code: 'SITE_JOB_MAX_ATTEMPTS',
      });
    }

    const project = await getProjectOrThrow(job.projectId);
    await assertBudgetAvailable(project);

    // Devolve o job a fila em vez de criar outro: reaproveita o mesmo
    // registro de tentativas e o mesmo historico de eventos.
    const moved = await repo.updateJobStatus(job.id, 'FAILED', 'PENDING', {
      errorCode: null,
      errorMessage: null,
      errorRetryable: null,
    });
    if (!moved) {
      throw conflict('O job mudou de estado enquanto voce tentava retomar.', {
        code: 'SITE_JOB_STATE_CHANGED',
      });
    }

    await transitionProject(project, 'QUEUED');
    await repo.appendEvent(job.id, 'STAGE_STARTED', 'Geracao retomada pelo administrador.', 'VALIDATING_BRIEFING');

    res.json({ job: toPublicJob((await repo.findJob(job.id))!) });
  }),
);

// ---------------------------------------------------------------------------

/**
 * Recorte enviado ao navegador.
 *
 * `draftConfig` e omitido de proposito nas listagens: e o objeto mais pesado
 * do projeto e a lista nao o usa. O editor busca o detalhe quando precisa.
 * Custo, semente e fingerprint tambem nao saem daqui sem necessidade.
 */
function toPublicProject(project: {
  id: string;
  leadId: string | null;
  internalName: string;
  businessName: string;
  siteType: string;
  status: string;
  desiredSlug: string | null;
  currentVersionNumber: number;
  activePublicationId: string | null;
  lockVersion: number;
  costAccumulatedUsd: string;
  lastFailureCode: string | null;
  lastFailureMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}) {
  return {
    id: project.id,
    leadId: project.leadId,
    internalName: project.internalName,
    businessName: project.businessName,
    siteType: project.siteType,
    status: project.status,
    desiredSlug: project.desiredSlug,
    currentVersionNumber: project.currentVersionNumber,
    activePublicationId: project.activePublicationId,
    lockVersion: project.lockVersion,
    costAccumulatedUsd: project.costAccumulatedUsd,
    lastFailureCode: project.lastFailureCode,
    lastFailureMessage: project.lastFailureMessage,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    archivedAt: project.archivedAt,
  };
}

/** Nunca expoe `leaseOwner` nem `inputHash`: sao detalhes internos da fila. */
function toPublicJob(job: {
  id: string;
  projectId: string;
  type: string;
  status: string;
  stage: string | null;
  progress: number;
  attempt: number;
  maxAttempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  errorRetryable: boolean | null;
  cancelRequestedAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: job.id,
    projectId: job.projectId,
    type: job.type,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    attempt: job.attempt,
    maxAttempts: job.maxAttempts,
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
    errorRetryable: job.errorRetryable,
    cancelRequestedAt: job.cancelRequestedAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    createdAt: job.createdAt,
  };
}

/**
 * Recorte publico de um asset.
 *
 * `storageKey` nunca sai daqui: e um detalhe de implementacao do storage. O
 * cliente busca o arquivo pela rota `/assets/:assetId/file`, autenticada,
 * nunca pelo caminho em disco.
 */
function toPublicAsset(asset: {
  id: string;
  projectId: string;
  source: string;
  originalFilename: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  altText: string | null;
  focalX: string | null;
  focalY: string | null;
  rightsStatus: string;
  createdAt: Date;
}) {
  return {
    id: asset.id,
    projectId: asset.projectId,
    source: asset.source,
    originalFilename: asset.originalFilename,
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    sizeBytes: asset.sizeBytes,
    altText: asset.altText,
    focalX: Number(asset.focalX ?? 0.5),
    focalY: Number(asset.focalY ?? 0.5),
    rightsStatus: asset.rightsStatus,
    createdAt: asset.createdAt,
    url: `/api/site-projects/${asset.projectId}/assets/${asset.id}/file`,
  };
}

/** Nome de exibicao apenas: nunca vira caminho de arquivo (secao 25.4). */
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\]/g, '_').slice(0, 180);
}

/** Recorte publico de uma publicacao. Nunca inclui `artifactKey` (caminho interno). */
function toPublicPublication(publication: {
  id: string;
  projectId: string;
  publicationNumber: number;
  slug: string;
  status: string;
  noindex: boolean;
  smokeTestPassedAt: Date | null;
  failureCode: string | null;
  failureMessage: string | null;
  publishedAt: Date | null;
  supersededAt: Date | null;
  unpublishedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: publication.id,
    projectId: publication.projectId,
    publicationNumber: publication.publicationNumber,
    slug: publication.slug,
    status: publication.status,
    noindex: publication.noindex,
    smokeTestPassedAt: publication.smokeTestPassedAt,
    failureCode: publication.failureCode,
    failureMessage: publication.failureMessage,
    publishedAt: publication.publishedAt,
    supersededAt: publication.supersededAt,
    unpublishedAt: publication.unpublishedAt,
    createdAt: publication.createdAt,
  };
}

/** Recorte publico de uma mensagem de abordagem. `phoneSnapshot` e o numero, nunca um token. */
function toPublicOutreach(message: {
  id: string;
  projectId: string;
  publicationId: string | null;
  leadId: string | null;
  phoneSnapshot: string | null;
  messageText: string;
  editedByUser: boolean;
  openedAt: Date | null;
  confirmedSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: message.id,
    projectId: message.projectId,
    publicationId: message.publicationId,
    leadId: message.leadId,
    phoneSnapshot: message.phoneSnapshot,
    messageText: message.messageText,
    editedByUser: message.editedByUser,
    openedAt: message.openedAt,
    confirmedSentAt: message.confirmedSentAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}
