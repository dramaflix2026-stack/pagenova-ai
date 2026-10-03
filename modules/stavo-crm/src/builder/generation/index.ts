/**
 * Fabrica do provider de IA.
 *
 * Ponto UNICO de decisao entre real e mock. O worker (etapa A7) e o service
 * chamam `createSiteIntelligenceProvider()` e nunca importam
 * `AnthropicSiteIntelligenceProvider` ou `MockSiteIntelligenceProvider`
 * diretamente -- assim trocar de modo nunca exige tocar em quem usa.
 */
import { siteAiMode } from '@server/config/env';
import { AnthropicSiteIntelligenceProvider } from '@builder/generation/anthropic-provider';
import { MockSiteIntelligenceProvider } from '@builder/generation/mock-provider';
import { ProviderError, type SiteIntelligenceProvider } from '@builder/generation/provider';

export function createSiteIntelligenceProvider(): SiteIntelligenceProvider {
  const mode = siteAiMode();

  if (mode === 'mock') return new MockSiteIntelligenceProvider();
  if (mode === 'real') return new AnthropicSiteIntelligenceProvider();

  // 'bloqueado': o chamador deveria ter checado antes de chegar aqui (ver
  // `service.ts#requestGeneration`). Isto e uma rede de seguranca, nao o
  // caminho normal.
  throw new ProviderError(
    'AUTH',
    'Nenhum provider de IA disponivel: falta ANTHROPIC_API_KEY ou SITE_AI_MOCK_MODE.',
    false,
  );
}

export * from '@builder/generation/provider';
export * from '@builder/generation/plan-schema';
export { assemblePlan, newCreativeSeed, type AssembleInput, type AssembleResult } from '@builder/generation/assembler';
export { SITE_PLAN_PROMPT_VERSION } from '@builder/generation/prompts/site-plan-v1';
export { PRICING_VERSION } from '@builder/generation/pricing';
