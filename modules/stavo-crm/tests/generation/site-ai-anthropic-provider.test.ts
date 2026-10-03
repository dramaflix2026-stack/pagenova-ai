/**
 * Provider da Anthropic com um cliente simulado: sem rede e sem custo.
 *
 * Cobre as falhas encontradas no diagnostico da geracao de sites:
 *  - resposta cortada por max_tokens virava "schema invalido" e disparava um
 *    reparo que reenviava tudo e pagava de novo;
 *  - recusa nao era tratada;
 *  - o uso de falhas perdia tokens de cache e o id da requisicao;
 *  - a edicao de secao quebrava com JSON dentro de cerca markdown e, ao
 *    quebrar, o custo da chamada sumia.
 *
 * E cobre o gerador v2 (SiteSpec): formato da requisicao (cache, structured
 * outputs, thinking, fallback), teto de custo por chamada e o caminho das
 * imagens reais.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as EnvModule from '@server/config/env';

/** Ambiente mutavel: cada teste escolhe o gerador e os limites. */
const env: Record<string, unknown> = {};

vi.mock('@server/config/env', async (importOriginal) => {
  const original = await importOriginal<typeof EnvModule>();
  Object.assign(env, original.loadEnv(process.env), {
    ANTHROPIC_API_KEY: 'chave-de-teste-nunca-enviada',
    ANTHROPIC_SITE_MODEL: 'claude-opus-5',
    ANTHROPIC_FAST_MODEL: 'claude-haiku-4-5',
    ANTHROPIC_SITE_EFFORT: 'medium',
    ANTHROPIC_MAX_OUTPUT_TOKENS: 32000,
    SITE_AI_MAX_REPAIR_ATTEMPTS: 1,
    SITE_AI_GENERATOR: 'spec-v2',
    SITE_AI_MAX_COST_PER_CALL_USD: 1.5,
  });
  return { ...original, getEnv: () => env };
});

const { AnthropicSiteIntelligenceProvider, parseJsonText } = await import(
  '@builder/generation/anthropic-provider'
);
const { MockSiteIntelligenceProvider, emptyBusinessFacts } = await import(
  '@builder/generation/mock-provider'
);
const { ProviderError, usageRecord } = await import('@builder/generation/provider');
const { diagnoseMessage } = await import('@builder/generation/observability');
const { siteSpecSchema } = await import('@builder/generation/site-spec');
const { specFixture } = await import('@tests/fixtures/site-spec');

type Content = Anthropic.Message['content'];

function message(content: Content, overrides: Partial<Anthropic.Message> = {}): Anthropic.Message {
  return {
    id: `msg_${Math.random().toString(36).slice(2)}`,
    type: 'message',
    role: 'assistant',
    model: 'claude-opus-5',
    content,
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 1000,
      output_tokens: 2000,
      cache_creation_input_tokens: 300,
      cache_read_input_tokens: 700,
    },
    ...overrides,
  } as Anthropic.Message;
}

const jsonMessage = (value: unknown, overrides: Partial<Anthropic.Message> = {}) =>
  message([{ type: 'text', text: JSON.stringify(value), citations: null }] as Content, overrides);

/** Cliente falso nos dois endpoints (o v2 usa o beta por causa do fallback). */
function fakeClient(responses: Anthropic.Message[]) {
  const sent: Record<string, unknown>[] = [];
  const stream = (params: Record<string, unknown>) => {
    sent.push(params);
    const next = responses.shift();
    return { finalMessage: async () => next ?? Promise.reject(new Error('sem resposta simulada')) };
  };
  return { client: { messages: { stream }, beta: { messages: { stream } } }, sent };
}

function providerWith(responses: Anthropic.Message[]) {
  const provider = new AnthropicSiteIntelligenceProvider();
  const { client, sent } = fakeClient(responses);
  (provider as unknown as { client: unknown }).client = client;
  return { provider, sent };
}

const input = {
  business: emptyBusinessFacts('Clinica Aurora'),
  siteType: 'ONE_PAGE' as const,
  objective: { goal: 'APPOINTMENTS' },
  style: { theme: 'AI_DECIDES' as const, keywords: [], density: 'BALANCED' as const, motionLevel: 'BALANCED' as const },
  creativeSeed: 'seed-teste',
};

let validPlan: unknown;
beforeEach(async () => {
  env.SITE_AI_GENERATOR = 'spec-v2';
  env.ANTHROPIC_SITE_MODEL = 'claude-opus-5';
  env.SITE_AI_MAX_COST_PER_CALL_USD = 1.5;
  env.ANTHROPIC_MAX_OUTPUT_TOKENS = 32000;
  validPlan = (await new MockSiteIntelligenceProvider().generateSitePlan(input)).plan;
});

const toolUse = (planInput: unknown): Content => [
  { type: 'tool_use', id: 'toolu_1', name: 'emit_site_plan', input: planInput, caller: { type: 'direct' } },
] as Content;

const usingPlanV1 = () => {
  env.SITE_AI_GENERATOR = 'plan-v1';
};

describe('geracao v1: termino da resposta', () => {
  beforeEach(usingPlanV1);

  it('resposta cortada por max_tokens falha na hora, sem reparo pago', async () => {
    const { provider, sent } = providerWith([
      message(toolUse({ incompleto: true }), { stop_reason: 'max_tokens' }),
      message(toolUse(validPlan)),
    ]);

    const erro = (await provider.generateSitePlan(input).catch((error: unknown) => error)) as InstanceType<
      typeof ProviderError
    >;

    expect(erro).toBeInstanceOf(ProviderError);
    expect(erro.code).toBe('TRUNCATED');
    // Antes: a segunda chamada (reparo) acontecia e era cobrada.
    expect(sent).toHaveLength(1);
    expect(erro.usage?.outputTokens).toBe(2000);
    expect(erro.usage?.stopReason).toBe('max_tokens');
  });

  it('recusa vira erro claro, com o custo preservado', async () => {
    const { provider } = providerWith([message([], { stop_reason: 'refusal' })]);
    const erro = (await provider.generateSitePlan(input).catch((error: unknown) => error)) as InstanceType<
      typeof ProviderError
    >;
    expect(erro.code).toBe('REFUSED');
    expect(erro.usage?.inputTokens).toBe(1000);
  });
});

describe('geracao v1: uso e diagnostico', () => {
  beforeEach(usingPlanV1);

  it('saida valida de primeira: 1 tentativa, 0 problemas, cache contabilizado', async () => {
    const { provider } = providerWith([message(toolUse(validPlan))]);
    const { usage } = await provider.generateSitePlan(input);

    expect(usage.attempts).toBe(1);
    expect(usage.validationIssues).toBe(0);
    expect(usage.stopReason).toBe('end_turn');
    expect(usage.contentBlocks).toBe('tool_use');
    expect(usage.cacheCreationTokens).toBe(300);
    expect(usage.cacheReadTokens).toBe(700);
    expect(usage.outputBytes).toBeGreaterThan(0);
  });

  it('reparo soma o custo das duas chamadas, nunca sobrescreve', async () => {
    const { provider, sent } = providerWith([message(toolUse({ invalido: true })), message(toolUse(validPlan))]);
    const { usage } = await provider.generateSitePlan(input);

    expect(sent).toHaveLength(2);
    expect(usage.attempts).toBe(2);
    expect(usage.inputTokens).toBe(2000);
    expect(usage.outputTokens).toBe(4000);
  });

  it('o registro de uso de uma falha guarda cache, id da requisicao e codigo do erro', async () => {
    const { provider } = providerWith([message(toolUse({}), { stop_reason: 'max_tokens', id: 'msg_cortada' })]);
    const erro = (await provider.generateSitePlan(input).catch((error: unknown) => error)) as InstanceType<
      typeof ProviderError
    >;

    const linha = usageRecord({
      projectId: 'p',
      jobId: 'j',
      provider: 'anthropic',
      operation: 'GENERATE_PLAN',
      usage: erro.usage!,
      status: 'FAILED',
      errorCode: erro.code,
    });

    expect(linha.providerRequestId).toBe('msg_cortada');
    expect(linha.cacheReadTokens).toBe(700);
    expect(linha.cacheCreationTokens).toBe(300);
    expect(linha.errorCode).toBe('TRUNCATED');
    expect(linha.stopReason).toBe('max_tokens');
  });
});

describe('geracao v2: formato da requisicao', () => {
  it('pede SiteSpec com structured outputs, cache, thinking, effort e fallback', async () => {
    const { provider, sent } = providerWith([jsonMessage(specFixture())]);
    await provider.generateSitePlan(input);

    expect(sent).toHaveLength(1);
    const params = sent[0]!;
    expect(params.model).toBe('claude-opus-5');
    // Bloco estatico marcado para cache.
    const system = params.system as Array<{ cache_control?: unknown; text: string }>;
    expect(system[0]!.cache_control).toEqual({ type: 'ephemeral' });
    // Nada que mude por projeto pode estar no bloco cacheado.
    expect(system[0]!.text).not.toContain('Clinica Aurora');
    expect(system[0]!.text).not.toContain('seed-teste');
    expect(params.thinking).toEqual({ type: 'adaptive' });
    const outputConfig = params.output_config as { effort: string; format: { type: string } };
    expect(outputConfig.effort).toBe('medium');
    expect(outputConfig.format.type).toBe('json_schema');
    expect(params.fallbacks).toBe('default');
    expect(params.betas).toContain('server-side-fallback-2026-07-01');
    // A ferramenta forcada do v1 nao e mais usada.
    expect(params.tools).toBeUndefined();
  });

  it('o briefing, a semente e as imagens vao na mensagem, fora do bloco cacheado', async () => {
    const { provider, sent } = providerWith([jsonMessage(specFixture())]);
    await provider.generateSitePlan({
      ...input,
      imageCandidates: [
        { assetId: 'a'.repeat(26), width: 1600, height: 900, description: 'fachada', focalX: 0.5, focalY: 0.5, source: 'UPLOAD' },
      ],
    });

    const messages = sent[0]!.messages as Array<{ content: string }>;
    expect(messages[0]!.content).toContain('Clinica Aurora');
    expect(messages[0]!.content).toContain('seed-teste');
    expect(messages[0]!.content).toContain('img-1');
    // O id interno do asset nunca vai para o prompt.
    expect(messages[0]!.content).not.toContain('a'.repeat(26));
  });

  it('cai para o gerador antigo quando o modelo nao suporta structured outputs', async () => {
    env.ANTHROPIC_SITE_MODEL = 'claude-sonnet-4-5';
    const { provider, sent } = providerWith([message(toolUse(validPlan))]);
    await provider.generateSitePlan(input);
    expect(sent[0]!.tools).toBeDefined();
  });
});

describe('geracao v2: limites e imagens', () => {
  it('recusa antes de enviar quando a chamada poderia passar do teto de custo', async () => {
    env.SITE_AI_MAX_COST_PER_CALL_USD = 0.1;
    const { provider, sent } = providerWith([jsonMessage(specFixture())]);

    const erro = (await provider.generateSitePlan(input).catch((error: unknown) => error)) as InstanceType<
      typeof ProviderError
    >;

    expect(erro.code).toBe('COST_LIMIT');
    // Nenhuma chamada paga aconteceu.
    expect(sent).toHaveLength(0);
  });

  it('liga a imagem escolhida pelo apelido ao asset real', async () => {
    const assetId = 'b'.repeat(26);
    const spec = specFixture();
    spec.sections[0]!.image = 'img-1';
    const { provider } = providerWith([jsonMessage(spec)]);

    const { imageBindings } = await provider.generateSitePlan({
      ...input,
      imageCandidates: [
        { assetId, width: 1600, height: 900, description: 'fachada da clinica', focalX: 0.4, focalY: 0.6, source: 'UPLOAD' },
      ],
    });

    expect(imageBindings?.[0]?.image).toEqual({ assetId, alt: 'fachada da clinica', focalX: 0.4, focalY: 0.6 });
  });

  it('apelido inventado vira "sem imagem" e gera aviso, nunca um link quebrado', async () => {
    const spec = specFixture();
    spec.sections[0]!.image = 'img-9';
    const { provider } = providerWith([jsonMessage(spec)]);

    const { imageBindings, adjustments } = await provider.generateSitePlan(input);

    expect(imageBindings?.[0]?.image).toBeUndefined();
    expect(adjustments?.join(' ')).toContain('img-9');
  });

  it('SiteSpec fora dos limites tenta um reparo e depois falha com contagem', async () => {
    const invalido = specFixture();
    invalido.seo.title = 'x'.repeat(200); // acima do limite de 60
    const { provider, sent } = providerWith([jsonMessage(invalido), jsonMessage(invalido)]);

    const erro = (await provider.generateSitePlan(input).catch((error: unknown) => error)) as InstanceType<
      typeof ProviderError
    >;

    expect(sent).toHaveLength(2);
    expect(erro.code).toBe('SCHEMA_INVALID');
    expect(erro.usage?.validationIssues).toBeGreaterThan(0);
  });

  it('a fixture usada nos testes e um SiteSpec valido', () => {
    expect(siteSpecSchema.safeParse(specFixture()).success).toBe(true);
  });
});

describe('observabilidade nao vaza conteudo', () => {
  it('o diagnostico guarda so metadados, nunca o texto gerado', () => {
    const segredo = 'Telefone 11 99999-0000 e briefing confidencial';
    const diagnostico = diagnoseMessage(message([{ type: 'text', text: segredo, citations: null }] as Content), {
      operation: 'PATCH_SECTION',
      latencyMs: 10,
    });

    const serializado = JSON.stringify(diagnostico);
    expect(serializado).not.toContain('99999');
    expect(serializado).not.toContain('confidencial');
    expect(serializado).not.toContain('chave-de-teste');
    expect(diagnostico.outputBytes).toBe(Buffer.byteLength(segredo, 'utf8'));
    expect(diagnostico.contentBlocks).toBe('text');
  });
});

describe('chamadas pequenas', () => {
  it('edicao de secao aceita JSON dentro de cerca markdown', () => {
    expect(parseJsonText('```json\n{"type":"faq"}\n```')).toEqual({ type: 'faq' });
    expect(parseJsonText('{"type":"faq"}')).toEqual({ type: 'faq' });
  });

  it('le todos os blocos de texto, nao so o primeiro', async () => {
    const { provider } = providerWith([
      message(
        [
          { type: 'text', text: '{"type":', citations: null },
          { type: 'text', text: '"faq"}', citations: null },
        ] as Content,
        { model: 'claude-haiku-4-5' },
      ),
    ]);
    const { section } = await provider.patchSection({
      business: emptyBusinessFacts('X'),
      creativeDirection: {},
      currentSection: { type: 'faq' },
      allowedVariants: ['accordion'],
      instruction: 'mais curto',
    });
    expect(section).toEqual({ type: 'faq' });
  });

  it('edicao com JSON invalido falha levando o custo, para ser registrado', async () => {
    const { provider } = providerWith([
      message([{ type: 'text', text: 'nao e json', citations: null }] as Content, { model: 'claude-haiku-4-5' }),
    ]);
    const erro = (await provider
      .patchSection({
        business: emptyBusinessFacts('X'),
        creativeDirection: {},
        currentSection: { type: 'faq' },
        allowedVariants: [],
        instruction: 'x',
      })
      .catch((error: unknown) => error)) as InstanceType<typeof ProviderError>;

    expect(erro.code).toBe('INVALID_JSON');
    expect(erro.usage?.costEstimatedUsd).toBeGreaterThan(0);
  });
});
