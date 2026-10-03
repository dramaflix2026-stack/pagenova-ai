/**
 * Observabilidade das chamadas a IA.
 *
 * Responde, para cada chamada: qual modelo, com que esforco, por que parou,
 * quanto entrou/saiu/veio do cache, quanto custou e o que voltou. Sem isso
 * nao da para saber se um site saiu ruim porque a resposta foi cortada, se
 * o cache nunca bateu, ou se o reparo dobrou o custo.
 *
 * O QUE NUNCA ENTRA AQUI: chave de API, cabecalhos, o briefing, texto livre
 * do administrador, telefone, e o conteudo gerado. Apenas metadados e
 * contagens. O teste `site-ai-anthropic-provider.test.ts` trava isso.
 */
import { logger } from '@server/lib/logger';
import { estimateCostUsd, PRICING_VERSION } from '@builder/generation/pricing';

export interface CallDiagnostics {
  operation: string;
  model: string;
  providerRequestId: string;
  effort: string | null;
  promptVersion: string | null;
  schemaVersion: string | null;
  /** Numero da tentativa dentro da mesma operacao, comecando em 1. */
  attempt: number;
  stopReason: string | null;
  /** Tipos dos blocos devolvidos, na ordem: "thinking,text". */
  contentBlocks: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  /** Tamanho do conteudo util (texto ou JSON), em bytes. Nunca o conteudo. */
  outputBytes: number;
  latencyMs: number;
  costEstimatedUsd: number;
  pricingVersion: string;
}

/**
 * Forma minima de uma resposta da Messages API.
 *
 * Estrutural de proposito: serve tanto para `Message` quanto para
 * `BetaMessage` (usada com fallback em recusa), que tem mais tipos de bloco.
 */
export interface MessageLike {
  id: string;
  model: string;
  stop_reason: string | null;
  content: ReadonlyArray<{ type: string; text?: string; input?: unknown }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number | null;
    cache_read_input_tokens?: number | null;
  };
}

/** Tamanho do texto util da resposta, em bytes UTF-8. */
export function usefulOutputBytes(message: Pick<MessageLike, 'content'>): number {
  let total = 0;
  for (const block of message.content) {
    if (block.type === 'text') total += Buffer.byteLength(block.text ?? '', 'utf8');
    else if (block.type === 'tool_use') total += Buffer.byteLength(JSON.stringify(block.input ?? null), 'utf8');
  }
  return total;
}

export function diagnoseMessage(
  message: MessageLike,
  context: {
    operation: string;
    latencyMs: number;
    attempt?: number;
    effort?: string | null;
    promptVersion?: string | null;
    schemaVersion?: string | null;
  },
): CallDiagnostics {
  const usage = message.usage;
  const cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;

  return {
    operation: context.operation,
    model: message.model,
    providerRequestId: message.id,
    effort: context.effort ?? null,
    promptVersion: context.promptVersion ?? null,
    schemaVersion: context.schemaVersion ?? null,
    attempt: context.attempt ?? 1,
    stopReason: message.stop_reason ?? null,
    contentBlocks: message.content.map((block) => block.type).join(','),
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheCreationTokens,
    cacheReadTokens,
    outputBytes: usefulOutputBytes(message),
    latencyMs: context.latencyMs,
    costEstimatedUsd: estimateCostUsd(message.model, {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheCreationTokens,
      cacheReadTokens,
    }),
    pricingVersion: PRICING_VERSION,
  };
}

/** Uma linha de log por chamada, com os mesmos campos gravados no banco. */
export function logCall(diagnostics: CallDiagnostics, extra: { validationIssues?: number } = {}): void {
  logger.info({ siteAi: { ...diagnostics, ...extra } }, 'Chamada a IA de sites concluida.');
}
