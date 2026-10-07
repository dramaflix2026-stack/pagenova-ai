/**
 * Regras de negocio dos Sites com IA.
 *
 * Aqui moram as decisoes: quem pode, quando pode, o que a transicao permite e
 * se o orcamento aguenta. A persistencia fica em `repository.ts` e as regras
 * puras, compartilhadas com o navegador, em `src/shared/site-ai.ts`.
 *
 * Nenhuma funcao daqui chama provider de IA. A geracao e um job; este arquivo
 * apenas o enfileira.
 */
import { randomBytes } from 'node:crypto';

import {
  canTransitionProject,
  isProjectBusy,
  SITE_AI_HARD_LIMITS,
  slugCandidates,
  validateSlug,
  type SiteProjectStatus,
  type SiteType,
} from '@site-kit/types/site-ai';
import { getEnv, siteAiMode } from '../../config/env';
import { getDb } from '../../db/client';
import { leads, type SiteProject } from '../../db/schema';
import { lintSite, type LintReport } from '@site-kit/utils/linter';
import { siteSchema, type SiteSchemaModel } from '@site-kit/schemas/site-schema';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  serviceUnavailable,
  tooManyRequests,
  unprocessable,
} from '../../lib/errors';
import { newIdempotencyKey } from '../../lib/ids';
import * as repo from './repository';

import { eq } from 'drizzle-orm';

/** Semente criativa: hex curto, estavel e reproduzivel a partir do projeto. */
const newCreativeSeed = (): string => randomBytes(8).toString('hex');

export interface CreateProjectInput {
  leadId: string | null;
  internalName?: string;
  businessName: string;
  siteType: SiteType;
  desiredSlug?: string | null;
  briefing?: unknown;
}

export interface ActorContext {
  userId: string;
  /** Ja verificado pelo middleware; usado aqui para o recorte dos numeros. */
  canSeeEveryProject: boolean;
}

/**
 * Cria um projeto, com ou sem lead.
 *
 * O lead precisa existir e nao pode estar arquivado. Um mesmo lead pode ter
 * varios projetos independentes: isso permite criar propostas e versoes
 * criativas diferentes sem sobrescrever o site anterior.
 */
export async function createProject(
  workspaceId: string,
  input: CreateProjectInput,
  actor: ActorContext,
): Promise<SiteProject> {
  const businessName = input.businessName.trim();
  if (!businessName) {
    throw badRequest('Informe o nome do negocio.', {
      fieldErrors: { businessName: ['Campo obrigatorio.'] },
    });
  }

  if (input.leadId) {
    const db = getDb();
    const [lead] = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);

    if (!lead) {
      throw notFound('Lead nao encontrado.', 'LEAD_NOT_FOUND');
    }
    if (lead.archivedAt) {
      throw badRequest(
        'Este lead esta arquivado. Restaure o lead antes de criar um site para ele.',
      );
    }

  }

  // O slug pretendido e validado agora para o erro aparecer no formulario, e
  // nao so na hora de publicar, quando o usuario ja perdeu o contexto.
  let desiredSlug: string | null = null;
  if (input.desiredSlug?.trim()) {
    const result = validateSlug(input.desiredSlug);
    if (!result.ok) {
      throw badRequest(result.reason, { fieldErrors: { desiredSlug: [result.reason] } });
    }
    desiredSlug = result.slug;
  } else {
    desiredSlug = slugCandidates(businessName)[0] ?? null;
  }

  const env = getEnv();
  const id = await repo.insertProject(workspaceId, {
    leadId: input.leadId,
    ownerUserId: actor.userId,
    internalName: (input.internalName?.trim() || businessName).slice(0, 160),
    businessName: businessName.slice(0, 160),
    siteType: input.siteType,
    desiredSlug,
    draftConfig: input.briefing ?? null,
    creativeSeed: newCreativeSeed(),
    budgetLimitUsd: String(env.SITE_AI_DEFAULT_PROJECT_BUDGET_USD),
    createdBy: actor.userId,
  });

  const created = await repo.findProject(id);
  if (!created) throw notFound('O projeto nao pode ser lido apos a criacao.');
  return created;
}

export async function getProjectOrThrow(id: string): Promise<SiteProject> {
  const project = await repo.findProject(id);
  if (!project) throw notFound('Projeto de site nao encontrado.', 'SITE_PROJECT_NOT_FOUND');
  return project;
}

/**
 * Move o projeto para outro estado, recusando transicoes invalidas.
 *
 * A maquina de estados e checada ANTES do banco para que a mensagem de erro
 * diga o que aconteceu, em vez de um UPDATE que afeta zero linhas e vira um
 * "conflito" generico.
 */
export async function transitionProject(
  project: SiteProject,
  to: SiteProjectStatus,
  extra: Parameters<typeof repo.updateProjectStatus>[3] = {},
): Promise<void> {
  const from = project.status as SiteProjectStatus;

  if (from === to && to !== 'PUBLISHED') return;

  if (!canTransitionProject(from, to)) {
    throw conflict(
      `Um projeto ${from} nao pode passar para ${to}.`,
      { code: 'SITE_PROJECT_INVALID_TRANSITION' },
    );
  }

  const moved = await repo.updateProjectStatus(project.id, from, to, extra);
  if (!moved) {
    throw conflict(
      'O projeto mudou de estado enquanto voce trabalhava. Recarregue para ver a situacao atual.',
      { code: 'SITE_PROJECT_STATE_CHANGED' },
    );
  }
}

/**
 * Enfileira a geracao inicial.
 *
 * Ordem das checagens escolhida de proposito: primeiro o que e barato e
 * definitivo (estado, configuracao), depois o orcamento, que exige consulta.
 * Nao adianta somar gastos de um projeto que ja esta gerando.
 */
export async function requestGeneration(
  project: SiteProject,
  actor: ActorContext,
  idempotencyKey?: string,
): Promise<{ jobId: string; created: boolean }> {
  if (isProjectBusy(project.status as SiteProjectStatus)) {
    const [running] = await repo.listJobsByProject(project.id, 1);
    if (running && (running.status === 'PENDING' || running.status === 'RUNNING')) {
      // Nao e erro: o usuario clicou duas vezes ou reabriu a tela. Devolvemos o
      // job que ja existe em vez de recusar ou de cobrar de novo.
      return { jobId: running.id, created: false };
    }
  }

  const mode = siteAiMode();
  if (mode === 'bloqueado') {
    throw serviceUnavailable(
      'A geracao de sites esta sem credencial da Anthropic. Configure ANTHROPIC_API_KEY no ' +
        'servidor ou ligue SITE_AI_MOCK_MODE para trabalhar com dados de teste.',
      'SITE_AI_NOT_CONFIGURED',
    );
  }

  await assertBudgetAvailable(project);

  const env = getEnv();

  // Limite de regeneracao: cada geracao e uma chamada paga ao modelo principal.
  const dailyLimit = env.SITE_AI_MAX_GENERATIONS_PER_PROJECT_PER_DAY;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await repo.countGenerationJobsSince(project.id, since);
  if (recent >= dailyLimit) {
    throw tooManyRequests(
      `Este projeto ja foi gerado ${recent} vez(es) nas ultimas 24 horas (limite: ${dailyLimit}). ` +
        'Ajuste o site no editor ou tente novamente mais tarde.',
      'SITE_AI_DAILY_GENERATION_LIMIT',
    );
  }

  const key = idempotencyKey?.trim() || newIdempotencyKey(`sitegen_${project.id}`);

  const { job, created } = await repo.enqueueJob({
    projectId: project.id,
    type: 'INITIAL_GENERATION',
    idempotencyKey: key,
    maxAttempts: Math.min(
      env.SITE_AI_MAX_GENERATION_ATTEMPTS,
      SITE_AI_HARD_LIMITS.maxGenerationAttempts,
    ),
    createdBy: actor.userId,
  });

  if (created) {
    await repo.appendEvent(
      job.id,
      'STAGE_STARTED',
      'Pedido recebido. O site entrou na fila de geracao.',
      'VALIDATING_BRIEFING',
    );
    await transitionProject(project, 'QUEUED');
  }

  return { jobId: job.id, created };
}

/**
 * Orcamento.
 *
 * Bloqueia ANTES da chamada cara, nunca depois. Um teto ultrapassado que so
 * aparece na fatura nao e controle de custo, e um relatorio de prejuizo.
 *
 * O limite efetivo e o menor entre a configuracao e o teto de seguranca do
 * codigo: um valor errado no ambiente nao pode virar uma conta de mil dolares.
 */
export async function assertBudgetAvailable(project: SiteProject): Promise<void> {
  const env = getEnv();

  const projectLimit = Math.min(
    Number(project.budgetLimitUsd ?? env.SITE_AI_DEFAULT_PROJECT_BUDGET_USD),
    SITE_AI_HARD_LIMITS.maxProjectBudgetUsd,
  );
  const spentOnProject = Number(project.costAccumulatedUsd ?? 0);

  if (spentOnProject >= projectLimit) {
    throw forbidden(
      `Este projeto ja consumiu US$ ${spentOnProject.toFixed(2)} do limite de ` +
        `US$ ${projectLimit.toFixed(2)}. Aumente o limite do projeto para continuar.`,
    );
  }

  const monthLimit = Math.min(
    env.SITE_AI_MONTHLY_BUDGET_USD,
    SITE_AI_HARD_LIMITS.maxMonthlyBudgetUsd,
  );
  const monthStart = startOfCurrentMonthUtc();
  const spentThisMonth = await repo.monthlySpendUsd(monthStart);

  if (spentThisMonth >= monthLimit) {
    throw forbidden(
      `O orcamento mensal de US$ ${monthLimit.toFixed(2)} para Sites com IA foi atingido ` +
        `(US$ ${spentThisMonth.toFixed(2)} usados). Ajuste SITE_AI_MONTHLY_BUDGET_USD ou ` +
        'aguarde o proximo mes.',
    );
  }
}

/** Inicio do mes corrente em UTC, que e como os timestamps sao gravados. */
export function startOfCurrentMonthUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * Slug livre para publicar.
 *
 * Tenta nome, depois nome + cidade, e so entao acrescenta um sufixo neutro.
 * O sufixo e aleatorio de proposito: usar um contador entregaria quantos sites
 * a agencia ja publicou, e usar o id do projeto entregaria o banco.
 */
export async function resolveAvailableSlug(
  businessName: string,
  city: string | null,
  projectId: string,
): Promise<string> {
  for (const candidate of slugCandidates(businessName, city)) {
    if (!(await repo.isSlugTaken(candidate, projectId))) return candidate;
  }

  const base = slugCandidates(businessName)[0] ?? 'site';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = randomBytes(2).toString('hex');
    const candidate = `${base}-${suffix}`.slice(0, 60);
    if (!(await repo.isSlugTaken(candidate, projectId))) return candidate;
  }

  throw conflict(
    'Nao foi possivel encontrar um endereco livre para este site. Escolha um manualmente.',
    { code: 'SITE_SLUG_UNAVAILABLE' },
  );
}

export async function archiveProject(project: SiteProject): Promise<void> {
  if (project.archivedAt) return;

  if (isProjectBusy(project.status as SiteProjectStatus)) {
    throw conflict(
      'Este projeto esta gerando agora. Cancele a geracao antes de arquivar.',
      { code: 'SITE_PROJECT_BUSY' },
    );
  }

  await transitionProject(project, 'ARCHIVED');
  await repo.updateProject(project.id, project.lockVersion, { archivedAt: new Date() });
}

/**
 * Valida e audita um SiteSchema antes de aceita-lo.
 *
 * Duas etapas com papeis diferentes:
 *
 *  1. o SCHEMA decide se a estrutura e legal -- tipo de secao conhecido, cor em
 *     hexadecimal, texto dentro do limite do componente. Falhar aqui e sempre
 *     erro de programa ou resposta invalida do modelo, nunca escolha do
 *     usuario, entao vira 422 com o caminho do campo;
 *  2. o LINTER decide se o resultado pode ir ao ar -- fato nao confirmado,
 *     contraste baixo, link morto. Erro bloqueia; aviso e decisao humana.
 *
 * Nada aqui reescreve o conteudo. Corrigir e ato explicito de quem edita.
 */
export function validateAndLintConfig(raw: unknown): {
  model: SiteSchemaModel;
  report: LintReport;
} {
  const parsed = siteSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues.slice(0, 20)) {
      const path = issue.path.join('.') || 'config';
      (fieldErrors[path] ??= []).push(issue.message);
    }

    throw unprocessable('O projeto do site nao passou na validacao estrutural.', {
      code: 'SITE_SCHEMA_INVALID',
      fieldErrors,
    });
  }

  return { model: parsed.data, report: lintSite(parsed.data) };
}

/**
 * Porta de entrada da publicacao.
 *
 * Um erro do linter e bloqueio de verdade: um contraste ilegivel ou um
 * depoimento inventado no ar e pior do que nao publicar. Aviso nao bloqueia,
 * mas precisa de confirmacao consciente de quem clicou.
 */
export function assertPublishable(report: LintReport, acknowledgedWarnings: boolean): void {
  // Achados de qualidade continuam aparecendo no editor, mas um SiteSchema
  // valido e renderizavel nao pode ficar impossivel de publicar. O bloqueio
  // fica reservado a conteudo materialmente falso ou resto de template.
  const hardErrors = report.errors.filter((finding) =>
    [
      'COPY_PLACEHOLDER',
      'FACT_UNCONFIRMED_CREDENTIAL',
      'FACT_UNCONFIRMED_TESTIMONIAL',
      'FACT_UNCONFIRMED_STAT',
    ].includes(finding.code),
  );

  if (hardErrors.length > 0) {
    throw unprocessable(
      `O site tem ${hardErrors.length} problema(s) de conteudo que impedem a publicacao. Corrija os dados nao confirmados antes de publicar.`,
      { code: 'SITE_LINT_BLOCKED', details: { errors: hardErrors } },
    );
  }

  if (report.warnings.length > 0 && !acknowledgedWarnings) {
    throw conflict(
      `O site tem ${report.warnings.length} aviso(s). Revise e confirme para publicar mesmo assim.`,
      { code: 'SITE_LINT_WARNINGS', details: { warnings: report.warnings } },
    );
  }
}

/**
 * Diagnostico do modulo para a tela de configuracao.
 *
 * Nunca devolve chave, nem prefixo de chave: apenas se existe. Saber que a
 * chave esta configurada e o suficiente para diagnosticar; qualquer pedaco
 * dela no navegador seria um vazamento.
 */
export async function moduleDiagnostics() {
  const env = getEnv();
  const mode = siteAiMode();

  const { createLocalStorage, checkStorageWritable } = await import('@builder/publishing/storage');
  const { siteAssetsDirAbsolute, publicSitesDirAbsolute } = await import('../../config/env');

  const [assetsStorage, publicStorage] = await Promise.all([
    checkStorageWritable(createLocalStorage(siteAssetsDirAbsolute())),
    checkStorageWritable(createLocalStorage(publicSitesDirAbsolute())),
  ]);

  return {
    enabled: env.SITE_AI_ENABLED,
    mode,
    anthropicConfigured: Boolean(env.ANTHROPIC_API_KEY?.trim()),
    openAiSiteConfigured: Boolean(env.OPENAI_API_KEY?.trim()),
    siteProvider: env.SITE_AI_PROVIDER,
    openAiConfigured: Boolean(env.OPENAI_API_KEY?.trim()),
    imageGenerationEnabled: env.SITE_IMAGE_GENERATION_ENABLED,
    siteModel: env.ANTHROPIC_SITE_MODEL,
    fastModel: env.ANTHROPIC_FAST_MODEL,
    imageModel: env.OPENAI_IMAGE_PRIMARY_MODEL,
    publicBaseUrl: env.PUBLIC_SITES_BASE_URL || env.APP_URL,
    storageDriver: env.SITE_PUBLIC_STORAGE_DRIVER,
    storageDir: env.SITE_PUBLIC_ASSETS_DIR,
    /** Diagnostico real de escrita/leitura/remocao (secao 16.4), nao suposicao. */
    assetsStorageOk: assetsStorage.ok,
    assetsStorageError: assetsStorage.error ?? null,
    publicStorageOk: publicStorage.ok,
    publicStorageError: publicStorage.error ?? null,
    monthlyBudgetUsd: env.SITE_AI_MONTHLY_BUDGET_USD,
    projectBudgetUsd: env.SITE_AI_DEFAULT_PROJECT_BUDGET_USD,
    jobConcurrency: env.SITE_AI_JOB_CONCURRENCY,
    /** O que o operador precisa fazer para sair do estado atual. */
    blockedReason:
      mode === 'bloqueado'
        ? env.SITE_AI_PROVIDER === 'openai'
          ? 'Sem OPENAI_API_KEY. A interface funciona, mas gerar um site esta bloqueado.'
          : 'Sem ANTHROPIC_API_KEY. A interface funciona, mas gerar um site esta bloqueado.'
        : null,
  };
}
