/**
 * Regras de dominio dos Sites com IA.
 *
 * Compartilhado entre servidor e navegador de proposito: as maquinas de
 * estado, o saneamento do slug e os limites precisam ser IDENTICOS nos dois
 * lados. A tela usa isto para explicar o erro antes do envio; o servidor
 * continua sendo a autoridade e revalida tudo.
 *
 * Nada aqui conhece banco, IA ou HTTP -- e funcao pura, testavel sozinha.
 */

// ---------------------------------------------------------------------------
// Tipo de site
// ---------------------------------------------------------------------------

/** Primeira versao entrega apenas estes dois. Multipagina esta fora de escopo. */
export const SITE_TYPES = ['ONE_PAGE', 'LANDING'] as const;
export type SiteType = (typeof SITE_TYPES)[number];

export const SITE_TYPE_LABELS: Record<SiteType, string> = {
  ONE_PAGE: 'Institucional one-page',
  LANDING: 'Landing page',
};

// ---------------------------------------------------------------------------
// Estado do projeto
// ---------------------------------------------------------------------------

export const SITE_PROJECT_STATUSES = [
  'BRIEFING',
  'QUEUED',
  'GENERATING',
  'READY',
  'PUBLISHED',
  'FAILED',
  'ARCHIVED',
] as const;
export type SiteProjectStatus = (typeof SITE_PROJECT_STATUSES)[number];

export const SITE_PROJECT_STATUS_LABELS: Record<SiteProjectStatus, string> = {
  BRIEFING: 'Briefing',
  QUEUED: 'Na fila',
  GENERATING: 'Gerando',
  READY: 'Pronto para revisar',
  PUBLISHED: 'Publicado',
  FAILED: 'Falhou',
  ARCHIVED: 'Arquivado',
};

/**
 * Transicoes permitidas do projeto.
 *
 * READY <-> PUBLISHED e ida e volta de proposito: despublicar devolve o
 * projeto ao estado editavel sem apagar as publicacoes anteriores, e editar um
 * site publicado nao o tira do ar -- o publico so muda em "Atualizar
 * publicacao".
 *
 * ARCHIVED nao tem saida por transicao: desarquivar e uma acao explicita que
 * restaura o status anterior, nao um passo da maquina.
 */
const ALLOWED_PROJECT_TRANSITIONS: Record<SiteProjectStatus, readonly SiteProjectStatus[]> = {
  BRIEFING: ['QUEUED', 'ARCHIVED'],
  QUEUED: ['GENERATING', 'FAILED', 'BRIEFING', 'ARCHIVED'],
  GENERATING: ['READY', 'FAILED', 'ARCHIVED'],
  READY: ['QUEUED', 'PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['READY', 'QUEUED', 'PUBLISHED', 'ARCHIVED'],
  FAILED: ['QUEUED', 'BRIEFING', 'ARCHIVED'],
  ARCHIVED: [],
};

export function canTransitionProject(from: SiteProjectStatus, to: SiteProjectStatus): boolean {
  return ALLOWED_PROJECT_TRANSITIONS[from].includes(to);
}

/** Um projeto ocupa a fila enquanto nao termina. Impede segunda geracao paga. */
export const isProjectBusy = (status: SiteProjectStatus): boolean =>
  status === 'QUEUED' || status === 'GENERATING';

/** Ja existe conteudo renderizavel? Define o que o card do CRM oferece. */
export const hasRenderableSite = (status: SiteProjectStatus): boolean =>
  status === 'READY' || status === 'PUBLISHED';

/**
 * Acao principal oferecida no card do lead, conforme a tabela da secao 6.1.
 *
 * Fica aqui, e nao no componente, porque o rotulo precisa ser o mesmo no card
 * compacto, no drawer e na listagem do modulo.
 */
export type SiteCardAction = 'CREATE' | 'PROGRESS' | 'EDIT' | 'OPEN' | 'RETRY';

export const SITE_CARD_ACTION_LABELS: Record<SiteCardAction, string> = {
  CREATE: 'Criar site',
  PROGRESS: 'Ver andamento',
  EDIT: 'Editar site',
  OPEN: 'Abrir site',
  RETRY: 'Retomar geracao',
};

export function cardActionFor(status: SiteProjectStatus | null | undefined): SiteCardAction {
  if (!status || status === 'ARCHIVED') return 'CREATE';
  if (status === 'BRIEFING') return 'EDIT';
  if (isProjectBusy(status)) return 'PROGRESS';
  if (status === 'PUBLISHED') return 'OPEN';
  if (status === 'FAILED') return 'RETRY';
  return 'EDIT';
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export const SITE_JOB_TYPES = [
  'INITIAL_GENERATION',
  'SECTION_PATCH',
  'COPY_PATCH',
  'IMAGE_GENERATION',
  'VISUAL_REVIEW',
  'EXPORT',
  'PUBLICATION_BUILD',
] as const;
export type SiteJobType = (typeof SITE_JOB_TYPES)[number];

export const SITE_JOB_STATUSES = [
  'PENDING',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
] as const;
export type SiteJobStatus = (typeof SITE_JOB_STATUSES)[number];

const ALLOWED_JOB_TRANSITIONS: Record<SiteJobStatus, readonly SiteJobStatus[]> = {
  PENDING: ['RUNNING', 'CANCELED', 'FAILED'],
  // Volta a PENDING quando o lease expira e o worker recupera o job.
  RUNNING: ['SUCCEEDED', 'FAILED', 'CANCELED', 'PENDING'],
  SUCCEEDED: [],
  FAILED: ['PENDING'],
  CANCELED: [],
};

export function canTransitionJob(from: SiteJobStatus, to: SiteJobStatus): boolean {
  return ALLOWED_JOB_TRANSITIONS[from].includes(to);
}

export const isTerminalJob = (status: SiteJobStatus): boolean =>
  status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELED';

/**
 * Etapas reais da geracao inicial (secao 22.2).
 *
 * Um evento so e emitido quando a etapa REALMENTE comeca ou termina. Nao
 * existe timer fingindo progresso: se o sistema nao sabe, a barra nao anda.
 */
export const SITE_JOB_STAGES = [
  'VALIDATING_BRIEFING',
  'PLANNING',
  'GENERATING_CONTENT',
  'VALIDATING_SCHEMA',
  'PREPARING_ASSETS',
  'RENDERING',
  'APPLYING_MOTION',
  'QUALITY_CHECK',
  'SAVING_VERSION',
  'COMPLETED',
] as const;
export type SiteJobStage = (typeof SITE_JOB_STAGES)[number];

export const SITE_JOB_STAGE_LABELS: Record<SiteJobStage, string> = {
  VALIDATING_BRIEFING: 'Organizando as informacoes do negocio',
  PLANNING: 'Definindo estrategia e direcao criativa',
  GENERATING_CONTENT: 'Criando estrutura e textos',
  VALIDATING_SCHEMA: 'Validando o projeto',
  PREPARING_ASSETS: 'Preparando imagens e identidade',
  RENDERING: 'Montando as secoes',
  APPLYING_MOTION: 'Configurando interacoes',
  QUALITY_CHECK: 'Conferindo responsividade, SEO e qualidade',
  SAVING_VERSION: 'Salvando a primeira versao',
  COMPLETED: 'Site pronto para revisao',
};

/**
 * Progresso derivado da etapa concluida, nunca inventado pelo frontend.
 *
 * A escala e a posicao da etapa na lista, e nao uma estimativa de tempo: as
 * etapas tem duracoes muito diferentes e prometer minutos seria mentira.
 */
export function stageProgress(stage: SiteJobStage): number {
  const index = SITE_JOB_STAGES.indexOf(stage);
  return Math.round(((index + 1) / SITE_JOB_STAGES.length) * 100);
}

// ---------------------------------------------------------------------------
// Publicacao
// ---------------------------------------------------------------------------

export const SITE_PUBLICATION_STATUSES = [
  'BUILDING',
  'ACTIVE',
  'SUPERSEDED',
  'FAILED',
  'UNPUBLISHED',
] as const;
export type SitePublicationStatus = (typeof SITE_PUBLICATION_STATUSES)[number];

const ALLOWED_PUBLICATION_TRANSITIONS: Record<
  SitePublicationStatus,
  readonly SitePublicationStatus[]
> = {
  BUILDING: ['ACTIVE', 'FAILED'],
  // Volta de SUPERSEDED para ACTIVE e o rollback.
  ACTIVE: ['SUPERSEDED', 'UNPUBLISHED'],
  SUPERSEDED: ['ACTIVE'],
  FAILED: [],
  UNPUBLISHED: ['ACTIVE'],
};

export function canTransitionPublication(
  from: SitePublicationStatus,
  to: SitePublicationStatus,
): boolean {
  return ALLOWED_PUBLICATION_TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------------------
// Slug publico
// ---------------------------------------------------------------------------

/**
 * Palavras proibidas no slug (secao 2.3).
 *
 * O prospect nao pode descobrir pela URL que recebeu uma amostra. O link tem
 * que parecer o site dele.
 */
export const FORBIDDEN_SLUG_WORDS = [
  'demo',
  'demos',
  'demonstracao',
  'demonstracoes',
  'preview',
  'previa',
  'teste',
  'test',
  'exemplo',
  'sample',
  'mock',
  'rascunho',
  'draft',
] as const;

/** Caminhos que a aplicacao ja usa e que um slug nunca pode capturar. */
export const RESERVED_SLUGS = [
  'api',
  'p',
  'assets',
  'static',
  'robots',
  'sitemap',
  'favicon',
  'entrar',
  'termos',
  'privacidade',
  'admin',
  'null',
  'undefined',
] as const;

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 60;

export type SlugError =
  | 'EMPTY'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'FORBIDDEN_WORD'
  | 'RESERVED'
  | 'INVALID_CHARS';

export type SlugResult = { ok: true; slug: string } | { ok: false; code: SlugError; reason: string };

/**
 * Normaliza um texto livre em slug.
 *
 * Remove acentos por decomposicao unicode em vez de tabela manual: "acai" e
 * "cafe" precisam virar `acai` e `cafe`, e uma tabela sempre esquece uma letra.
 */
export function slugify(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/**
 * Valida um slug ja normalizado.
 *
 * A checagem de palavra proibida olha os SEGMENTOS entre hifens, nao a string
 * inteira: `contest` contem `test` e e um nome legitimo; `clinica-teste` nao e.
 */
export function validateSlug(raw: string): SlugResult {
  const slug = slugify(raw ?? '');

  if (!slug) {
    return { ok: false, code: 'EMPTY', reason: 'Informe um endereco para o site.' };
  }
  // Reservado e checado ANTES do tamanho de proposito: `p` e `api` sao curtos
  // demais para o minimo, e recusa-los por "tamanho" esconderia o motivo real
  // de quem tentou usar um caminho da propria plataforma.
  if ((RESERVED_SLUGS as readonly string[]).includes(slug)) {
    return {
      ok: false,
      code: 'RESERVED',
      reason: 'Este endereco e usado pela propria plataforma. Escolha outro.',
    };
  }
  if (slug.length < SLUG_MIN_LENGTH) {
    return {
      ok: false,
      code: 'TOO_SHORT',
      reason: `O endereco precisa de no minimo ${SLUG_MIN_LENGTH} caracteres.`,
    };
  }
  if (slug.length > SLUG_MAX_LENGTH) {
    return {
      ok: false,
      code: 'TOO_LONG',
      reason: `O endereco pode ter no maximo ${SLUG_MAX_LENGTH} caracteres.`,
    };
  }

  const segments = slug.split('-');
  const forbidden = segments.find((segment) =>
    (FORBIDDEN_SLUG_WORDS as readonly string[]).includes(segment),
  );
  if (forbidden) {
    return {
      ok: false,
      code: 'FORBIDDEN_WORD',
      reason:
        `O endereco nao pode conter "${forbidden}". O link e enviado ao cliente e ` +
        'nao deve parecer uma amostra.',
    };
  }

  return { ok: true, slug };
}

/**
 * Candidatos de slug em ordem de preferencia, para resolver colisao.
 *
 * Nome, depois nome + cidade, depois um sufixo neutro curto. O sufixo NUNCA e
 * o id do banco: expor id sequencial ou ULID no link entrega a plataforma.
 */
export function slugCandidates(businessName: string, city?: string | null): string[] {
  const base = slugify(businessName);
  if (!base) return [];

  const candidates = [base];
  const citySlug = city ? slugify(city) : '';
  if (citySlug && !base.endsWith(citySlug)) {
    candidates.push(`${base}-${citySlug}`);
  }
  return candidates.filter((candidate) => validateSlug(candidate).ok);
}

// ---------------------------------------------------------------------------
// Custo e limites
// ---------------------------------------------------------------------------

/** Perfis de imagem da secao 13.6. Prospeccao usa ECONOMY por padrao. */
export const SITE_IMAGE_MODES = ['ECONOMY', 'PROFESSIONAL', 'PREMIUM'] as const;
export type SiteImageMode = (typeof SITE_IMAGE_MODES)[number];

export const SITE_IMAGE_MODE_LABELS: Record<SiteImageMode, string> = {
  ECONOMY: 'Economico',
  PROFESSIONAL: 'Profissional',
  PREMIUM: 'Premium',
};

export const DEFAULT_IMAGE_MODE: SiteImageMode = 'ECONOMY';

/**
 * Tetos de seguranca do backend.
 *
 * Estes numeros NAO sao a configuracao do usuario -- sao o limite que a
 * configuracao nunca pode ultrapassar. Um valor errado em `app_settings` nao
 * pode virar uma conta de mil dolares.
 */
export const SITE_AI_HARD_LIMITS = {
  maxGenerationAttempts: 3,
  maxRepairAttempts: 1,
  maxImagesPerProject: 8,
  maxSectionsPerSite: 24,
  maxItemsPerSection: 12,
  maxProjectBudgetUsd: 25,
  maxMonthlyBudgetUsd: 500,
  maxJobConcurrency: 4,
} as const;

/** Nivel de movimento escolhido no briefing (secao 7.2). */
export const MOTION_LEVELS = ['NONE', 'SUBTLE', 'BALANCED'] as const;
export type MotionLevel = (typeof MOTION_LEVELS)[number];

export const MOTION_LEVEL_LABELS: Record<MotionLevel, string> = {
  NONE: 'Sem animacao',
  SUBTLE: 'Sutil',
  BALANCED: 'Premium equilibrado',
};

/** O padrao recomendado pela especificacao, nao "imersivo". */
export const DEFAULT_MOTION_LEVEL: MotionLevel = 'BALANCED';
