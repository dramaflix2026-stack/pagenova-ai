/**
 * Tabela de precos de referencia.
 *
 * NAO e verdade permanente. A secao 23.1 da especificacao e explicita: "nao
 * hardcode tabela de precos eterna". Os valores abaixo sao a melhor
 * estimativa no momento da implementacao e SERVEM PARA ESTIMAR, nunca para
 * cobrar -- o valor real vem do uso retornado pelo provider quando ele
 * fornece, e o campo `pricingVersion` marca de qual tabela saiu a conta, para
 * auditar depois se o preco mudou.
 *
 * Verificar antes de confiar em producao:
 * https://platform.claude.com/docs/en/about-claude/pricing
 */

/**
 * v2: a v1 cobrava Opus a $15/$75 (preco do Opus 4.1) e Haiku a $0,80/$4
 * (Haiku 3.5). Opus 4.5 em diante custa $5/$25 e Haiku 4.5 custa $1/$5 --
 * com a v1, um site gerado em Opus aparecia ~3x mais caro do que era, e o
 * orcamento mensal bloqueava a geracao antes da hora.
 */
export const PRICING_VERSION = '2026-09-anthropic-v2';

interface ModelRate {
  /** Dolares por milhao de tokens. */
  inputPerMTok: number;
  outputPerMTok: number;
  /** Escrita de cache com TTL de 5 minutos: 1,25x o input. */
  cacheWritePerMTok: number;
  /** Leitura de cache: 0,1x o input (0,025x no Fable 5.1). */
  cacheReadPerMTok: number;
}

const rate = (input: number, output: number, cacheRead = input * 0.1): ModelRate => ({
  inputPerMTok: input,
  outputPerMTok: output,
  cacheWritePerMTok: input * 1.25,
  cacheReadPerMTok: cacheRead,
});

/**
 * Taxas casadas por PREFIXO do nome, da mais especifica para a mais geral.
 *
 * A ordem importa: `claude-opus-4-1` precisa vir antes de `claude-opus-4`,
 * senao o Opus 4.1 herdaria o preco errado. Casar por prefixo sobrevive a um
 * sufixo de data no nome do modelo sem exigir atualizacao do codigo.
 */
const RATES: Array<{ prefix: string; rate: ModelRate }> = [
  { prefix: 'claude-fable-5-1', rate: rate(10, 50, 0.25) },
  { prefix: 'claude-fable-5', rate: rate(10, 50) },
  { prefix: 'claude-opus-5', rate: rate(5, 25) },
  { prefix: 'claude-opus-4-8', rate: rate(5, 25) },
  { prefix: 'claude-opus-4-7', rate: rate(5, 25) },
  { prefix: 'claude-opus-4-6', rate: rate(5, 25) },
  { prefix: 'claude-opus-4-5', rate: rate(5, 25) },
  // Opus 4.1 e Opus 4: geracao anterior, ainda no preco antigo.
  { prefix: 'claude-opus-4', rate: rate(15, 75) },
  { prefix: 'claude-sonnet-5', rate: rate(2, 10) },
  { prefix: 'claude-sonnet-4', rate: rate(3, 15) },
  { prefix: 'claude-haiku-4-5', rate: rate(1, 5) },
];

/**
 * Modelo desconhecido: a taxa mais CARA conhecida.
 *
 * Esta conta alimenta o orcamento. Subestimar um modelo novo deixaria gastar
 * alem do limite sem aviso; superestimar so bloqueia um pouco antes.
 */
const FALLBACK_RATE: ModelRate = rate(15, 75);

function rateFor(model: string): ModelRate {
  const match = RATES.find((entry) => model.startsWith(entry.prefix));
  return match?.rate ?? FALLBACK_RATE;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
}

/** Estimativa em USD. Sempre marcada como estimativa nos registros de uso. */
export function estimateCostUsd(model: string, usage: TokenUsage): number {
  const modelRate = rateFor(model);

  const input = (usage.inputTokens / 1_000_000) * modelRate.inputPerMTok;
  const output = (usage.outputTokens / 1_000_000) * modelRate.outputPerMTok;
  const cacheWrite = ((usage.cacheCreationTokens ?? 0) / 1_000_000) * modelRate.cacheWritePerMTok;
  const cacheRead = ((usage.cacheReadTokens ?? 0) / 1_000_000) * modelRate.cacheReadPerMTok;

  return Number((input + output + cacheWrite + cacheRead).toFixed(6));
}

/**
 * Pior caso de uma chamada, ANTES de envia-la.
 *
 * Supoe que toda a entrada e cobrada sem cache e que a saida vai ate
 * `max_tokens`. E o numero que o orcamento precisa comparar: checar so o que
 * ja foi gasto deixaria uma unica chamada estourar o limite.
 */
export function worstCaseCostUsd(model: string, inputTokens: number, maxOutputTokens: number): number {
  return estimateCostUsd(model, { inputTokens, outputTokens: maxOutputTokens });
}

/**
 * Preco de imagem (OpenAI), tambem apenas referencia.
 *
 * https://developers.openai.com/api/docs/models
 */
export const IMAGE_PRICE_USD: Record<'economy' | 'standard', number> = {
  economy: 0.02,
  standard: 0.07,
};
