/**
 * Contrato dos providers de IA.
 *
 * Duas implementacoes: `AnthropicProvider` (real, etapa 8.1 da especificacao)
 * e `MockProvider` (deterministico, sem custo, para desenvolvimento e testes).
 * O restante do sistema depende SOMENTE desta interface -- trocar de provider,
 * ou rodar em mock, nunca exige mudar o servico ou o worker.
 */
import type { BusinessFacts } from '@site-kit/schemas/site-schema';
import type { SiteImageCandidate } from '@builder/generation/image-candidates';
import type { SitePlanOutput } from '@builder/generation/plan-schema';
import type { SectionImageBinding } from '@builder/generation/spec-to-plan';

/** Uso normalizado, independente do formato de cada provider. */
export interface UsageInfo {
  model: string;
  providerRequestId?: string;
  inputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  outputTokens: number;
  latencyMs: number;
  /** Estimativa calculada a partir de `pricing.ts`. Nunca a fatura real. */
  costEstimatedUsd: number;
  pricingVersion: string;
  /** Diagnostico da ULTIMA chamada da operacao; ver `observability.ts`. */
  stopReason?: string | null;
  effort?: string | null;
  promptVersion?: string | null;
  schemaVersion?: string | null;
  /** Chamadas feitas (1 = sem reparo). */
  attempts?: number;
  contentBlocks?: string;
  outputBytes?: number;
  validationIssues?: number;
}

/**
 * Linha completa de uso a partir de um `UsageInfo`.
 *
 * Um so lugar monta o registro: antes cada chamador copiava campo a campo e
 * esquecia alguns -- o registro de falha perdia os tokens de cache e o id da
 * requisicao, e a edicao de secao nao gravava cache nenhum.
 */
export function usageRecord(input: {
  projectId: string | null;
  jobId: string | null;
  provider: string;
  operation: string;
  usage: UsageInfo;
  status: 'SUCCESS' | 'FAILED';
  errorCode?: string | null;
}) {
  const { usage } = input;
  return {
    projectId: input.projectId,
    jobId: input.jobId,
    provider: input.provider,
    operation: input.operation,
    model: usage.model,
    providerRequestId: usage.providerRequestId ?? null,
    inputTokens: usage.inputTokens,
    cacheCreationTokens: usage.cacheCreationTokens,
    cacheReadTokens: usage.cacheReadTokens,
    outputTokens: usage.outputTokens,
    costEstimatedUsd: String(usage.costEstimatedUsd),
    pricingVersion: usage.pricingVersion,
    status: input.status,
    latencyMs: usage.latencyMs,
    errorCode: input.errorCode ?? null,
    ...usageDiagnosticsRow(usage),
  };
}

/** Campos de diagnostico de `UsageInfo`, prontos para `repo.recordUsage`. */
export function usageDiagnosticsRow(usage: UsageInfo) {
  return {
    stopReason: usage.stopReason ?? null,
    effort: usage.effort ?? null,
    promptVersion: usage.promptVersion ?? null,
    schemaVersion: usage.schemaVersion ?? null,
    attempts: usage.attempts ?? null,
    contentBlocks: usage.contentBlocks ?? null,
    outputBytes: usage.outputBytes ?? null,
    validationIssues: usage.validationIssues ?? null,
  };
}

export type ProviderErrorCode =
  | 'INVALID_JSON'
  | 'SCHEMA_INVALID'
  /** Resposta cortada por max_tokens (ou janela de contexto): nada a reparar. */
  | 'TRUNCATED'
  /** O modelo recusou a solicitacao (stop_reason = refusal). */
  | 'REFUSED'
  /** A chamada custaria mais que o limite configurado para uma unica chamada. */
  | 'COST_LIMIT'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'AUTH'
  | 'QUOTA'
  | 'MODEL_UNAVAILABLE'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  /** Um retry tem chance de funcionar? Rate limit sim; erro de auth nao. */
  readonly retryable: boolean;
  readonly usage?: UsageInfo;

  constructor(code: ProviderErrorCode, message: string, retryable: boolean, usage?: UsageInfo) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.retryable = retryable;
    this.usage = usage;
  }
}

export interface GenerateSitePlanInput {
  business: BusinessFacts;
  siteType: 'ONE_PAGE' | 'LANDING';
  objective: {
    goal: string;
    customGoal?: string;
  };
  style: {
    theme: 'LIGHT' | 'DARK' | 'MIXED' | 'AI_DECIDES';
    keywords: string[];
    primaryColor?: string;
    accentColor?: string;
    density: 'AIRY' | 'BALANCED' | 'COMPACT';
    motionLevel: 'NONE' | 'SUBTLE' | 'BALANCED';
  };
  /**
   * Texto livre do administrador.
   *
   * DADO NAO CONFIAVEL. O prompt precisa delimita-lo e instruir o modelo a
   * ignorar qualquer instrucao contida aqui -- ver secao 25.2 da
   * especificacao e `prompts/site-plan-v1.ts`.
   */
  freeformInstructions?: string;
  requiredSections?: string[];
  forbiddenSections?: string[];
  creativeSeed: string;
  /**
   * Imagens REAIS que a IA pode escolher (uploads do projeto). O provider da
   * apelidos a elas; o modelo nunca ve id interno nem URL.
   */
  imageCandidates?: SiteImageCandidate[];
}

export interface SitePlanResult {
  plan: SitePlanOutput;
  usage: UsageInfo;
  /** Imagens reais ligadas a cada secao, no indice de `plan.sections`. */
  imageBindings?: SectionImageBinding[];
  /** Correcoes deterministicas aplicadas a saida da IA (viram aviso no editor). */
  adjustments?: string[];
  /** Versao do prompt que gerou este plano, gravada no projeto. */
  promptVersion?: string;
}

export interface PatchSectionInput {
  business: BusinessFacts;
  creativeDirection: unknown;
  currentSection: unknown;
  allowedVariants: string[];
  instruction: string;
}

export interface SectionPatchResult {
  section: unknown;
  usage: UsageInfo;
}

export interface ReviseCopyInput {
  text: string;
  instruction: string;
  maxLength: number;
}

export interface CopyPatchResult {
  text: string;
  usage: UsageInfo;
}

export interface OutreachInput {
  businessName: string;
  niche?: string;
  siteUrl: string;
}

export interface OutreachResult {
  message: string;
  usage: UsageInfo;
}

export interface VisualReviewInput {
  screenshotBase64: string;
  currentIssues: string[];
}

export interface VisualReviewResult {
  suggestions: string[];
  usage: UsageInfo;
}

/**
 * Interface que a especificacao pede na secao 8.2.
 *
 * `reviewScreenshot` e opcional de proposito: e uma acao manual e cara (secao
 * 8.7), nao parte do fluxo obrigatorio.
 */
export interface SiteIntelligenceProvider {
  readonly name: 'anthropic' | 'openai' | 'mock';
  generateSitePlan(input: GenerateSitePlanInput): Promise<SitePlanResult>;
  patchSection(input: PatchSectionInput): Promise<SectionPatchResult>;
  reviseCopy(input: ReviseCopyInput): Promise<CopyPatchResult>;
  generateOutreachMessage(input: OutreachInput): Promise<OutreachResult>;
  reviewScreenshot?(input: VisualReviewInput): Promise<VisualReviewResult>;
}
