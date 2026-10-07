/**
 * Worker da fila de Sites com IA.
 *
 * Roda DENTRO do processo Express existente -- sem Redis, sem processo
 * separado, porque a hospedagem nao suporta isso (secao 22.1). A fila em si
 * mora no MySQL (`repository.ts`); este arquivo e quem consome.
 *
 * Garantias que o design precisa sustentar:
 *
 *  - um job sobrevive a um restart do processo: o estado mora no banco, o
 *    lease expira e `recoverExpiredLeases` devolve o job a fila;
 *  - eventos so sao emitidos quando a etapa REALMENTE comeca ou termina --
 *    nunca um timer fingindo progresso (secao 22.2);
 *  - cancelamento e cooperativo: o worker checa `cancelRequestedAt` entre
 *    etapas e para no proximo ponto seguro, nunca no meio de uma escrita;
 *  - uma chamada paga a IA nunca acontece sem o orcamento ter sido checado
 *    de novo, mesmo que ja tenha sido checado ao enfileirar -- o tempo entre
 *    enfileirar e executar pode ser longo o bastante para outro job consumir
 *    o orcamento primeiro.
 */
import { randomUUID } from 'node:crypto';

import type { SiteJobStage } from '@site-kit/types/site-ai';
import { getEnv, isSiteAiEnabled } from '@server/config/env';
import type { SiteGenerationJob, SiteProject } from '@server/db/schema';
import { logger } from '@server/lib/logger';
import { createSiteIntelligenceProvider } from '@builder/generation';
import { assemblePlan, newCreativeSeed, ProviderError } from '@builder/generation';
import { usageRecord, type GenerateSitePlanInput } from '@builder/generation/provider';
import { UploadAssetProvider } from '@builder/generation/upload-asset-provider';
import { ensureGooglePlaceAssets } from '@builder/generation/google-place-asset-provider';
import * as repo from '@server/modules/site-ai/repository';
import { assertBudgetAvailable, transitionProject } from '@server/modules/site-ai/service';

/** Duracao do lease: cobre uma chamada + um reparo, com folga. */
const LEASE_SECONDS = 300;
/** Renovacao a meio caminho do lease, para nunca deixar ele vencer sozinho. */
const HEARTBEAT_MS = (LEASE_SECONDS * 1000) / 2;
const POLL_INTERVAL_MS = 2000;

export interface WorkerHandle {
  stop: () => Promise<void>;
}

/** Erro interno: sinaliza que o job foi cancelado no meio da execucao. */
class JobCanceledError extends Error {
  constructor() {
    super('Geracao cancelada pelo usuario.');
    this.name = 'JobCanceledError';
  }
}

/**
 * Inicia o worker.
 *
 * `pollIntervalMs`/`leaseSeconds` sao injetaveis para os testes rodarem em
 * milissegundos reais, sem depender de fake timers globais que afetariam o
 * resto da suite.
 */
export function startSiteAiWorker(
  options: { pollIntervalMs?: number; leaseSeconds?: number } = {},
): WorkerHandle {
  const leaseOwner = `${process.pid}-${randomUUID()}`;
  const leaseSeconds = options.leaseSeconds ?? LEASE_SECONDS;
  const pollIntervalMs = options.pollIntervalMs ?? POLL_INTERVAL_MS;

  const inFlight = new Set<string>();
  let stopped = false;

  const tick = async (): Promise<void> => {
    if (stopped || !isSiteAiEnabled()) return;

    try {
      // Roda em TODO ciclo, nao so no primeiro: um job pode travar (rede,
      // provider, o que for) com o MESMO processo ainda de pe -- restringir
      // isto a "so no boot" deixava esse job preso ate alguem reiniciar o
      // servidor na mao, o que o lease com heartbeat existe exatamente para
      // evitar (achado real: um job com lease vencido as 03:23 nunca voltou
      // porque essa checagem so tinha rodado as 03:18). A query e uma
      // UPDATE idempotente e barata; rodar a cada 2s nao tem custo real.
      const recoveredCount = await repo.recoverExpiredLeases();
      if (recoveredCount > 0) {
        logger.info({ recoveredCount }, 'Jobs de sites com IA recuperados apos lease vencido.');
      }

      const env = getEnv();
      const maxConcurrency = Math.min(env.SITE_AI_JOB_CONCURRENCY, 4);
      const freeSlots = maxConcurrency - inFlight.size;
      if (freeSlots <= 0) return;

      const candidates = await repo.findClaimableJobs(freeSlots);

      for (const candidate of candidates) {
        if (inFlight.size >= maxConcurrency) break;
        if (inFlight.has(candidate.id)) continue;

        const claimed = await repo.claimJob(candidate.id, leaseOwner, leaseSeconds);
        if (!claimed) continue; // outro worker (ou este, em outra rodada) levou primeiro.

        inFlight.add(candidate.id);
        void runJob(candidate, leaseOwner, leaseSeconds)
          .catch((error) => logger.error({ err: error, jobId: candidate.id }, 'Job de site com IA falhou de forma inesperada.'))
          .finally(() => inFlight.delete(candidate.id));
      }
    } catch (error) {
      logger.error({ err: error }, 'Erro no ciclo do worker de sites com IA.');
    }
  };

  const interval = setInterval(() => void tick(), pollIntervalMs);
  interval.unref?.(); // nao impede o processo de encerrar sozinho em testes.
  void tick();

  return {
    async stop() {
      stopped = true;
      clearInterval(interval);
      // Espera o trabalho em andamento terminar; nao interrompe no meio de
      // uma escrita no banco.
      while (inFlight.size > 0) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Execucao de um job
// ---------------------------------------------------------------------------

async function runJob(job: SiteGenerationJob, leaseOwner: string, leaseSeconds: number): Promise<void> {
  const heartbeat = setInterval(() => {
    void repo.renewLease(job.id, leaseOwner, leaseSeconds).catch((error) => {
      logger.warn({ err: error, jobId: job.id }, 'Falha ao renovar lease do job.');
    });
  }, HEARTBEAT_MS);
  heartbeat.unref?.();

  try {
    if (job.type === 'INITIAL_GENERATION') {
      await runInitialGeneration(job);
    } else {
      // Tipos futuros (SECTION_PATCH, EXPORT, ...) chegam nas etapas A9/A13.
      await repo.updateJobStatus(job.id, 'RUNNING', 'FAILED', {
        errorCode: 'JOB_TYPE_NOT_IMPLEMENTED',
        errorMessage: `Tipo de job "${job.type}" ainda nao tem worker.`,
        errorRetryable: false,
        finishedAt: new Date(),
      });
    }
  } finally {
    clearInterval(heartbeat);
  }
}

/** Lanca se o job foi cancelado; o worker para no proximo ponto seguro. */
async function assertNotCanceled(jobId: string): Promise<void> {
  const current = await repo.findJob(jobId);
  if (current?.cancelRequestedAt) throw new JobCanceledError();
}

async function emitStage(jobId: string, stage: SiteJobStage, message: string): Promise<void> {
  await repo.appendEvent(jobId, 'STAGE_STARTED', message, stage);
}

async function runInitialGeneration(job: SiteGenerationJob): Promise<void> {
  const project = await repo.findProject(job.projectId);

  if (!project) {
    await repo.updateJobStatus(job.id, 'RUNNING', 'FAILED', {
      errorCode: 'PROJECT_NOT_FOUND',
      errorMessage: 'O projeto deste job nao existe mais.',
      errorRetryable: false,
      finishedAt: new Date(),
    });
    return;
  }

  try {
    await transitionProject(project, 'GENERATING');

    await emitStage(job.id, 'VALIDATING_BRIEFING', 'Organizando as informacoes do negocio.');
    await assertNotCanceled(job.id);

    // Traz fotos REAIS do Google Places quando o lead possui placeId.
    // Falha de foto nunca bloqueia a geracao do site.
    const googleAssetCount = await ensureGooglePlaceAssets(project).catch(() => 0);
    const imageCandidates = await new UploadAssetProvider().listCandidates(project.id);
    const input = { ...briefingToProviderInput(project), imageCandidates };

    // Checagem final de orcamento: o tempo entre enfileirar e comecar a
    // executar pode ter sido longo o bastante para outro job gastar a cota.
    await assertBudgetAvailable(project);

    await emitStage(job.id, 'PLANNING', 'Definindo estrategia e direcao criativa.');
    await assertNotCanceled(job.id);

    const provider = createSiteIntelligenceProvider();
    const { plan, usage, imageBindings, adjustments, promptVersion } = await provider.generateSitePlan(input);

    // Rede de seguranca visual: quando ha pelo menos duas fotos reais, o hero
    // e uma secao editorial interna recebem imagens mesmo se o modelo escolher none.
    if (imageCandidates.length >= 2) {
      const toRef = (candidate: (typeof imageCandidates)[number]) => ({
        assetId: candidate.assetId,
        alt: candidate.description.slice(0, 200),
        focalX: candidate.focalX,
        focalY: candidate.focalY,
      });
      const heroIndex = plan.sections.findIndex((section) => section.type === 'hero');
      const secondaryIndex = plan.sections.findIndex(
        (section) => section.type === 'about' || section.type === 'authority',
      );
      const heroCandidate =
        imageCandidates.find((item) => !item.width || !item.height || item.width / item.height >= 1.1) ??
        imageCandidates[0]!;
      const secondaryCandidate =
        imageCandidates.find((item) => item.assetId !== heroCandidate.assetId) ?? imageCandidates[1]!;
      if (heroIndex >= 0) {
        imageBindings[heroIndex] = { ...(imageBindings[heroIndex] ?? {}), image: toRef(heroCandidate) };
      }
      if (secondaryIndex >= 0) {
        imageBindings[secondaryIndex] = {
          ...(imageBindings[secondaryIndex] ?? {}),
          image: toRef(secondaryCandidate),
        };
      }
    }

    await repo.recordUsage(
      usageRecord({
        projectId: project.id,
        jobId: job.id,
        provider: provider.name,
        operation: 'GENERATE_PLAN',
        usage,
        status: 'SUCCESS',
      }),
    );
    await repo.addProjectCost(project.id, String(usage.costEstimatedUsd));

    await emitStage(job.id, 'GENERATING_CONTENT', 'Estrutura e textos criados pela IA.');
    await assertNotCanceled(job.id);

    await emitStage(job.id, 'VALIDATING_SCHEMA', 'Validando o projeto.');
    const seed = project.creativeSeed || newCreativeSeed();
    const { model, droppedSections, aiWarnings } = assemblePlan({
      plan,
      // Mesmo objeto usado na chamada a IA: um so lugar decide o que e fato
      // confirmado, entao o plano e o SiteSchema final nunca podem discordar
      // sobre o que existe de verdade.
      business: input.business,
      siteType: project.siteType as GenerateSitePlanInput['siteType'],
      creativeSeed: seed,
      promptVersion: promptVersion ?? '1.0.0',
      imageBindings,
    });

    const warnings = [
      ...(adjustments ?? []),
      ...droppedSections.map((d) => `Secao "${d.type}" omitida: ${d.reason}`),
      ...aiWarnings,
    ];
    if (warnings.length > 0) {
      await repo.appendEvent(job.id, 'WARNING', truncateFailureMessage(warnings.join(' ')), 'VALIDATING_SCHEMA');
    }
    await assertNotCanceled(job.id);

    const usedImages = new Set(
      (imageBindings ?? []).flatMap((binding) => [
        ...(binding.image ? [binding.image.assetId] : []),
        ...(binding.gallery ?? []).map((ref) => ref.assetId),
        ...(binding.itemImages ?? []).filter(Boolean).map((ref) => ref!.assetId),
      ]),
    ).size;
    await emitStage(
      job.id,
      'PREPARING_ASSETS',
      imageCandidates.length === 0
        ? 'Nenhuma imagem real disponivel: o layout foi preparado para funcionar sem foto.'
        : `${usedImages} de ${imageCandidates.length} imagem(ns) real(is) usada(s) no site${googleAssetCount > 0 ? ', incluindo fotos do Google Places' : ''}.`,
    );
    await assertNotCanceled(job.id);

    await emitStage(job.id, 'RENDERING', 'Montando as secoes.');
    // Smoke-test do renderer: se o modelo montado nao renderiza, e melhor
    // falhar aqui, com diagnostico, do que salvar uma versao quebrada.
    const { renderSite } = await import('@site-kit/renderer/render-site');
    renderSite(model, { profile: 'DEMO', resolveAsset: () => null });
    await assertNotCanceled(job.id);

    await emitStage(job.id, 'APPLYING_MOTION', 'Interacoes configuradas.');

    await emitStage(job.id, 'QUALITY_CHECK', 'Conferindo responsividade, SEO e qualidade.');
    const { lintSite } = await import('@site-kit/utils/linter');
    const report = lintSite(model);
    if (report.warnings.length > 0) {
      await repo.appendEvent(
        job.id,
        'WARNING',
        `${report.warnings.length} aviso(s) de qualidade -- revise no editor antes de publicar.`,
        'QUALITY_CHECK',
      );
    }

    await emitStage(job.id, 'SAVING_VERSION', 'Salvando a primeira versao.');
    const { versionNumber } = await repo.insertVersion({
      projectId: project.id,
      config: model,
      schemaVersion: model.schemaVersion,
      rendererVersion: model.rendererVersion,
      promptVersion: model.project.promptVersion,
      origin: 'GENERATION',
      summary: 'Geracao inicial.',
      createdBy: job.createdBy,
    });

    const saved = await repo.updateProjectStatus(project.id, 'GENERATING', 'READY', {
      currentVersionNumber: versionNumber,
      // O rascunho editavel nasce identico a versao recem-gerada. O editor
      // (etapa A9) muda o rascunho; a versao ja salva nunca e tocada.
      draftConfig: model,
    });
    if (!saved) {
      // O projeto mudou de estado por fora (por exemplo, foi arquivado
      // durante a geracao). A versao ja foi salva -- nao se perde o trabalho.
      logger.warn({ projectId: project.id }, 'Projeto mudou de estado antes de a geracao terminar.');
    }

    await repo.appendEvent(job.id, 'COMPLETED', 'Site pronto para revisao.', 'COMPLETED');
    await repo.updateJobStatus(job.id, 'RUNNING', 'SUCCEEDED', {
      finishedAt: new Date(),
      resultRef: versionNumber ? String(versionNumber) : null,
    });
  } catch (error) {
    await handleJobFailure(job, project, error);
  }
}

/** Cabe em `error_message`/`last_failure_message` (varchar(500) nas duas tabelas). */
const FAILURE_MESSAGE_MAX_LENGTH = 500;

function truncateFailureMessage(text: string): string {
  if (text.length <= FAILURE_MESSAGE_MAX_LENGTH) return text;
  const ellipsis = '…';
  return text.slice(0, FAILURE_MESSAGE_MAX_LENGTH - ellipsis.length) + ellipsis;
}

/**
 * Marca a falha. Isto PRECISA sempre terminar com o job em FAILED (ou
 * CANCELED) -- nunca preso em RUNNING.
 *
 * Achado real: uma mensagem de erro longa (o texto de uma
 * `DrizzleQueryError`, por exemplo, inclui a query inteira) estourava a
 * coluna `error_message`, o proprio UPDATE de falha lancava, e o job ficava
 * preso em RUNNING para sempre -- sem erro visivel, so silencio. Por isso
 * tudo aqui e truncado E o bloco inteiro tem uma rede de seguranca: se algo
 * MESMO ASSIM falhar, o catch externo ainda grava um FAILED generico.
 */
async function handleJobFailure(job: SiteGenerationJob, project: SiteProject, error: unknown): Promise<void> {
  try {
    if (error instanceof JobCanceledError) {
      await repo.updateJobStatus(job.id, 'RUNNING', 'CANCELED', { finishedAt: new Date() });
      await repo.updateProjectStatus(project.id, 'GENERATING', 'FAILED', {
        lastFailureCode: 'CANCELED_BY_USER',
        lastFailureMessage: 'A geracao foi cancelada.',
      });
      return;
    }

    const code = error instanceof ProviderError ? error.code : 'UNKNOWN';
    const retryable = error instanceof ProviderError ? error.retryable : true;
    const rawMessage =
      error instanceof ProviderError || error instanceof Error
        ? error.message
        : 'Falha desconhecida durante a geracao.';
    const message = truncateFailureMessage(rawMessage);

    logger.error({ err: error, jobId: job.id, projectId: project.id }, 'Geracao de site falhou.');

    if (error instanceof ProviderError && error.usage) {
      await repo.recordUsage(
        usageRecord({
          projectId: project.id,
          jobId: job.id,
          provider: 'anthropic',
          operation: 'GENERATE_PLAN',
          usage: error.usage,
          status: 'FAILED',
          errorCode: error.code,
        }),
      );
      // O gasto da falha tambem conta no limite do projeto: sem isto, uma
      // sequencia de geracoes cortadas nunca esbarrava no orcamento.
      await repo.addProjectCost(project.id, String(error.usage.costEstimatedUsd));
    }

    await repo.updateJobStatus(job.id, 'RUNNING', 'FAILED', {
      errorCode: code,
      errorMessage: message,
      errorRetryable: retryable,
      finishedAt: new Date(),
    });
    await repo.updateProjectStatus(project.id, 'GENERATING', 'FAILED', {
      lastFailureCode: code,
      lastFailureMessage: message,
    });
  } catch (secondaryError) {
    logger.error(
      { err: secondaryError, originalError: error, jobId: job.id, projectId: project.id },
      'Falha ao REGISTRAR a falha da geracao. Marcando FAILED com mensagem generica para o job nao ficar preso.',
    );
    await repo
      .updateJobStatus(job.id, 'RUNNING', 'FAILED', {
        errorCode: 'UNKNOWN',
        errorMessage: 'A geracao falhou e o motivo exato nao pode ser registrado. Veja os logs do servidor.',
        errorRetryable: true,
        finishedAt: new Date(),
      })
      .catch((finalError) => {
        // Se ISTO tambem falhar, so o lease vencendo recupera -- mas o
        // worker de cada ciclo tenta essa recuperacao agora, entao o job
        // nunca fica preso alem de um ciclo de lease.
        logger.error({ err: finalError, jobId: job.id }, 'Nao foi possivel marcar o job como FAILED de jeito nenhum.');
      });
  }
}

/**
 * Traduz o briefing salvo no projeto para a entrada do provider.
 *
 * `draftConfig` e o JSON livre gravado na criacao (etapa A8 define o formato
 * definitivo do wizard); aqui aceitamos um formato minimo e com defaults
 * seguros, para o worker funcionar mesmo com um briefing incompleto.
 */
/**
 * Um valor digitado no assistente e sempre `USER_CONFIRMED`.
 *
 * O administrador esta preenchendo um campo especifico da tela sabendo o que
 * esta escrevendo -- e exatamente a definicao de fato confirmado que o
 * assembler exige para deixar o dado aparecer na pagina.
 */
function confirmedNow<T>(value: T | undefined): { value: T; source: 'USER_CONFIRMED'; confirmedAt: string } | null {
  if (value === undefined || value === '') return null;
  return { value, source: 'USER_CONFIRMED', confirmedAt: new Date().toISOString() };
}

/**
 * Converte a Etapa 1 do assistente (forma simples de formulario) em
 * `BusinessFacts` (forma com proveniencia que o assembler exige).
 *
 * Esta e a UNICA funcao que faz essa transformacao -- se o formato do
 * formulario mudar, so este ponto precisa saber.
 */
function briefingBusinessToFacts(
  business: Partial<{
    name: string;
    niche: string;
    city: string;
    state: string;
    serviceArea: string;
    audience: string;
    description: string;
    services: Array<{ name: string; description?: string }>;
    differentials: string[];
    phoneE164: string;
    whatsappE164: string;
    email: string;
    address: string;
    instagramUrl: string;
    websiteUrl: string;
    googleMapsUrl: string;
  }>,
  fallbackName: string,
): GenerateSitePlanInput['business'] {
  return {
    name: business.name || fallbackName,
    niche: business.niche,
    city: business.city,
    state: business.state,
    serviceArea: business.serviceArea,
    audience: business.audience,
    description: business.description,
    services: business.services ?? [],
    differentials: business.differentials ?? [],
    credentials: [],
    stats: [],
    testimonials: [],
    openingHours: [],
    phoneE164: confirmedNow(business.phoneE164),
    whatsappE164: confirmedNow(business.whatsappE164),
    email: confirmedNow(business.email),
    address: confirmedNow(business.address),
    instagramUrl: confirmedNow(business.instagramUrl),
    websiteUrl: confirmedNow(business.websiteUrl),
    googleMapsUrl: confirmedNow(business.googleMapsUrl),
  };
}

export function briefingToProviderInput(project: SiteProject): GenerateSitePlanInput {
  const draft = (project.draftConfig ?? {}) as Record<string, unknown>;
  const business = briefingBusinessToFacts(
    (draft.business ?? {}) as Record<string, unknown>,
    project.businessName,
  );
  const objective = (draft.objective as GenerateSitePlanInput['objective']) ?? { goal: 'WHATSAPP_CONVERSATIONS' };
  const style = (draft.style as GenerateSitePlanInput['style']) ?? {
    theme: 'AI_DECIDES',
    keywords: [],
    density: 'BALANCED',
    motionLevel: 'BALANCED',
  };

  return {
    business,
    siteType: project.siteType as GenerateSitePlanInput['siteType'],
    objective,
    style,
    freeformInstructions: typeof draft.freeformInstructions === 'string' ? draft.freeformInstructions : undefined,
    requiredSections: Array.isArray(draft.requiredSections) ? (draft.requiredSections as string[]) : undefined,
    forbiddenSections: Array.isArray(draft.forbiddenSections) ? (draft.forbiddenSections as string[]) : undefined,
    creativeSeed: project.creativeSeed,
  };
}
