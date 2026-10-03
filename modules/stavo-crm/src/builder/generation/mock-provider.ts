/**
 * Provider mock: determinístico, sem custo, sem rede.
 *
 * Existe para tres publicos: desenvolvimento sem chave, testes automatizados
 * (nenhum teste pode chamar a API real -- secao 27.1) e a demonstracao do
 * fluxo completo antes de a chave da Anthropic existir.
 *
 * "Deterministico" e a palavra que importa: a MESMA entrada produz SEMPRE a
 * MESMA saida. Isso permite testar o pipeline inteiro (plano -> assembler ->
 * linter -> render) sem qualquer flutuacao, e permite reproduzir um bug.
 *
 * A variedade entre negocios diferentes vem de um hash simples do nome e do
 * `creativeSeed` -- nao de `Math.random()`, que quebraria a reprodutibilidade.
 */
import { registryForPrompt } from '@site-kit/registry/variants';
import type { BusinessFacts } from '@site-kit/schemas/site-schema';
import { presetsForLevel } from '@site-kit/interactions/motion';
import { aliasCandidates, resolveAlias } from '@builder/generation/image-candidates';
import { estimateCostUsd, PRICING_VERSION } from '@builder/generation/pricing';
import { PLACEHOLDER_TARGET } from '@builder/generation/plan-schema';
import type {
  CopyPatchResult,
  GenerateSitePlanInput,
  OutreachInput,
  OutreachResult,
  PatchSectionInput,
  ReviseCopyInput,
  SectionPatchResult,
  SiteIntelligenceProvider,
  SitePlanResult,
  UsageInfo,
} from '@builder/generation/provider';
import type { PlanSection, SitePlanOutput } from '@builder/generation/plan-schema';

void registryForPrompt; // mantem o import usado como referencia de contrato

const MOCK_MODEL = 'mock-planner-v1';

/** Hash simples e estavel: mesma string, sempre o mesmo numero. */
function hashOf(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Escolhe um item de forma deterministica a partir de um numero qualquer.
 *
 * O modulo duplo protege contra seed negativo: `hashOf` devolve um inteiro
 * sem sinal, mas um deslocamento de bits (`seed >> N`) pode reinterpretar o
 * sinal e produzir um numero negativo -- `items[-3]` e `undefined`, nao um
 * erro, e o bug so aparece quando o hash calha de cair nesse intervalo.
 */
const pick = <T>(items: readonly T[], seed: number): T =>
  items[((seed % items.length) + items.length) % items.length]!;

/** Paletas testadas para contraste, para o mock nunca cair no ajuste do assembler. */
const PALETTES = [
  { primary: '#9c4221', accent: '#3f4f3a', background: '#fbf8f4', surface: '#ffffff', text: '#2b2320', muted: '#6b5f57', border: '#e6ddd3', mode: 'LIGHT' as const },
  { primary: '#1d4ed8', accent: '#c2410c', background: '#f7f8fb', surface: '#ffffff', text: '#111827', muted: '#4b5563', border: '#e2e5ec', mode: 'LIGHT' as const },
  { primary: '#0f766e', accent: '#b45309', background: '#f4f8f7', surface: '#ffffff', text: '#0f2e2a', muted: '#4a615c', border: '#d9e6e2', mode: 'LIGHT' as const },
  { primary: '#7c8cf8', accent: '#f2a65a', background: '#12141c', surface: '#1b1e29', text: '#eceef5', muted: '#a2a8bd', border: '#2b3040', mode: 'DARK' as const },
];

const HEADING_FONTS = ['Fraunces', 'Sora', 'Playfair Display', 'Space Grotesk'];
const BODY_FONTS = ['Inter', 'Work Sans', 'Manrope', 'Lora'];
const HEADER_VARIANTS = ['inline-right', 'centered-split', 'minimal-cta', 'stacked-bar', 'transparent-overlay'] as const;

/** Constroi um SitePlanOutput plausivel e VALIDO a partir do briefing. */
function buildMockPlan(input: GenerateSitePlanInput): SitePlanOutput {
  const seed = hashOf(input.business.name + input.creativeSeed);
  const palette = pick(PALETTES, seed);
  const business = input.business;

  const goalCtaLabel: Record<string, string> = {
    WHATSAPP_CONVERSATIONS: 'Chamar no WhatsApp',
    QUOTE_REQUESTS: 'Pedir um orcamento',
    APPOINTMENTS: 'Agendar uma avaliacao',
    AUTHORITY: 'Falar com a equipe',
    OFFER_INTEREST: 'Quero saber mais',
    CUSTOM: 'Entrar em contato',
  };
  const primaryCtaLabel = goalCtaLabel[input.objective.goal] ?? 'Entrar em contato';

  const sections: PlanSection[] = [];
  const forbidden = new Set(input.forbiddenSections ?? []);
  const wants = (type: string): boolean => !forbidden.has(type);

  if (wants('hero')) {
    sections.push({
      variant: 'editorial-split',
      visible: true,
      motionPreset: 'text-lines-reveal',
      eyebrow: business.niche ? `${business.niche}${business.city ? ` em ${business.city}` : ''}` : undefined,
      type: 'hero',
      headline: `${business.name}: atendimento pensado para quem procura ${business.niche ?? 'o melhor'}`,
      subheadline: business.audience
        ? `Feito para ${lowerFirst(business.audience)}`
        : business.description,
      primaryCta: { kind: 'whatsapp', label: primaryCtaLabel, target: PLACEHOLDER_TARGET },
    });
  }

  if (wants('services') && business.services.length > 0) {
    sections.push({
      variant: 'cards-3col',
      visible: true,
      motionPreset: 'stagger-cards',
      type: 'services',
      headline: 'Como podemos ajudar',
      items: business.services.slice(0, 9).map((service) => ({
        title: service.name,
        body: service.description,
      })),
    });
  } else if (wants('benefits') && business.differentials.length > 0) {
    sections.push({
      variant: 'icon-grid',
      visible: true,
      motionPreset: 'stagger-cards',
      type: 'benefits',
      headline: 'O que diferencia o atendimento',
      items: business.differentials.slice(0, 6).map((item) => ({ title: item })),
    });
  }

  if (wants('process')) {
    sections.push({
      variant: 'numbered-steps',
      visible: true,
      motionPreset: 'fade-up-soft',
      type: 'process',
      headline: 'Como funciona',
      steps: [
        { title: 'Primeiro contato', body: 'Voce conta o que procura e tiramos as duvidas iniciais.' },
        { title: 'Atendimento', body: 'Conduzimos o atendimento com atencao ao seu caso.' },
        { title: 'Acompanhamento', body: 'Seguimos disponiveis para o que vier depois.' },
      ],
    });
  }

  if (wants('authority') && business.credentials.length > 0) {
    sections.push({
      variant: 'portrait-side',
      visible: true,
      motionPreset: 'fade-up-soft',
      type: 'authority',
      headline: 'Quem atende',
      body: business.description,
      personRole: business.niche,
    });
  }

  if (wants('testimonials') && business.testimonials.length > 0) {
    sections.push({
      variant: 'quote-pair',
      visible: true,
      motionPreset: 'fade-in',
      type: 'testimonials',
      headline: 'O que dizem',
    });
  }

  if (wants('faq')) {
    sections.push({
      variant: 'accordion-single',
      visible: true,
      motionPreset: 'fade-up-soft',
      type: 'faq',
      headline: 'Perguntas frequentes',
      items: [
        {
          question: 'Como faco para comecar?',
          answer: 'Basta chamar no WhatsApp e explicar o que voce procura.',
        },
        {
          question: business.city ? `Voces atendem em ${business.city}?` : 'Onde voces atendem?',
          answer: business.serviceArea ?? 'Consulte a area atendida diretamente pelo WhatsApp.',
        },
      ],
    });
  }

  if (wants('contactMap')) {
    sections.push({
      variant: 'address-card',
      visible: true,
      motionPreset: 'fade-in',
      type: 'contactMap',
      headline: 'Onde nos encontrar',
    });
  }

  if (wants('cta')) {
    sections.push({
      variant: 'centered-band',
      visible: true,
      motionPreset: 'cta-gradient-flow',
      type: 'cta',
      headline: 'Vamos conversar?',
      body: 'Conte o que voce procura e veja se faz sentido comecar agora.',
      primaryCta: { kind: 'whatsapp', label: primaryCtaLabel, target: PLACEHOLDER_TARGET },
    });
  }

  sections.push({
    variant: 'simple-centered',
    visible: true,
    motionPreset: 'none',
    type: 'footer',
    tagline: business.niche,
  });

  const allowedForLevel = presetsForLevel(input.style.motionLevel);
  const allowedMotion = new Set(allowedForLevel);
  // O fallback e o PRIMEIRO preset permitido no nivel, nunca um valor fixo:
  // em nivel NONE o unico permitido e 'none', e 'fade-in' quebraria de novo.
  const fallbackPreset = allowedForLevel[0]!;
  for (const section of sections) {
    if (!allowedMotion.has(section.motionPreset)) section.motionPreset = fallbackPreset;
  }

  return {
    businessSummary: `${business.name} atua em ${business.niche ?? 'seu segmento'}${business.city ? ` em ${business.city}` : ''}, atendendo ${business.audience ?? 'o publico descrito no briefing'}.`,
    creativeDirection: {
      positioning: `${business.name} como referencia confiavel em ${business.niche ?? 'seu segmento'} para quem busca ${input.objective.goal.toLowerCase()}.`,
      audienceSummary: business.audience ?? 'Publico geral interessado no servico.',
      objections: ['Ja tentei algo parecido antes', 'Nao sei se e para o meu caso', 'Prefiro entender antes de decidir'],
      toneOfVoice: pick(['Direto e confiante', 'Acolhedor e proximo', 'Tecnico e preciso'], seed),
      visualConcept: `Composicao ${palette.mode === 'DARK' ? 'escura e contemporanea' : 'clara e editorial'}, com respiro generoso.`,
      paletteRationale: 'Cor principal e destaque escolhidos para contraste alto e identidade propria, evitando o clichê do nicho.',
      typographyRationale: 'Uma serifa ou display no titulo para autoridade, sans neutra no corpo para leitura no celular.',
      compositionRationale: 'Alternancia entre blocos de texto e listas curtas para manter o ritmo de leitura.',
      narrative: 'Comeca pelo problema do visitante, mostra como o atendimento funciona e termina com um convite direto.',
    },
    theme: {
      mode: palette.mode,
      colors: {
        background: palette.background,
        surface: palette.surface,
        text: palette.text,
        muted: palette.muted,
        primary: input.style.primaryColor ?? palette.primary,
        primaryForeground: palette.mode === 'DARK' ? palette.background : '#ffffff',
        accent: input.style.accentColor ?? palette.accent,
        accentForeground: palette.mode === 'DARK' ? palette.background : '#ffffff',
        border: palette.border,
      },
      typography: {
        headingFont: pick(HEADING_FONTS, seed),
        bodyFont: pick(BODY_FONTS, seed >>> 2),
        headingMinRem: 1.75,
        headingMaxRem: 3.4,
        bodyRem: 1.0625,
        headingWeight: 600,
        lineHeightTight: 1.12,
        lineHeightBody: 1.6,
      },
      spacing: { sectionPaddingRem: input.style.density === 'AIRY' ? 6 : input.style.density === 'COMPACT' ? 3.5 : 4.75, containerMaxWidthPx: 1180, gapRem: 1.75 },
      radii: { sm: 6, md: 12, lg: 20, pill: 999 },
      elevation: 'SOFT',
      borderWidth: 1,
      iconStyle: 'LINE',
      imageTreatment: 'ROUNDED',
      buttonStyle: pick(['SOLID', 'GRADIENT'], seed),
      density: input.style.density,
    },
    navigation: {
      showMenu: true,
      headerVariant: pick(HEADER_VARIANTS, seed),
      wordmark: business.name,
      stickyHeader: true,
      headerCtaLabel: primaryCtaLabel,
    },
    objective: {
      goal: input.objective.goal as SitePlanOutput['objective']['goal'],
      customGoal: input.objective.customGoal,
      primaryCtaLabel,
      primaryCtaMessage: `Ola! Vim pelo site e gostaria de ${primaryCtaLabel.toLowerCase()}.`,
    },
    motion: { level: input.style.motionLevel, respectReducedMotion: true, useSmoothScroll: false },
    sections,
    seo: {
      // O padEnd garante o minimo de 15 caracteres exigido pelo schema mesmo
      // quando o negocio tem um nome curto e nenhum nicho informado.
      title: `${business.name}${business.niche ? ` | ${business.niche}` : ' | Site oficial'}`
        .slice(0, 60)
        .padEnd(15, '.'),
      description: (business.description ?? `${business.name}: atendimento em ${business.niche ?? 'seu segmento'}.`)
        .slice(0, 160)
        .padEnd(50, '.'),
      jsonLdType: business.niche?.toLowerCase().includes('advoca') ? 'ProfessionalService' : 'LocalBusiness',
    },
    geo: {
      entitySummary: `${business.name} atua em ${business.niche ?? 'seu segmento'}${business.city ? `, em ${business.city}` : ''}.`,
      servicesSummary: business.services.slice(0, 6).map((s) => s.name),
    },
    missingDataWarnings:
      business.testimonials.length === 0
        ? ['Nenhum depoimento confirmado ainda: a secao de depoimentos nao foi incluida.']
        : [],
  };
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Uso simulado, proporcional ao tamanho da entrada, sem nenhuma chamada de rede. */
function mockUsage(inputChars: number, outputChars: number, startedAt: number): UsageInfo {
  const inputTokens = Math.round(inputChars / 4);
  const outputTokens = Math.round(outputChars / 4);

  return {
    model: MOCK_MODEL,
    inputTokens,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    outputTokens,
    latencyMs: Date.now() - startedAt,
    costEstimatedUsd: estimateCostUsd(MOCK_MODEL, { inputTokens, outputTokens }),
    pricingVersion: PRICING_VERSION,
  };
}

export class MockSiteIntelligenceProvider implements SiteIntelligenceProvider {
  readonly name = 'mock' as const;

  async generateSitePlan(input: GenerateSitePlanInput): Promise<SitePlanResult> {
    const startedAt = Date.now();
    const plan = buildMockPlan(input);

    // Exercita o caminho de imagens reais sem custo: a primeira imagem enviada
    // vai para o hero, como a IA faria.
    const candidates = aliasCandidates(input.imageCandidates ?? []);
    const heroImage = candidates.length > 0 ? resolveAlias(candidates[0]!.alias, candidates) : null;
    const imageBindings = plan.sections.map((section) =>
      section.type === 'hero' && heroImage ? { image: heroImage } : {},
    );

    return {
      plan,
      imageBindings,
      adjustments: [],
      promptVersion: '1.0.0',
      usage: mockUsage(JSON.stringify(input).length, JSON.stringify(plan).length, startedAt),
    };
  }

  /**
   * Transformacao real e deterministica, nao um eco.
   *
   * O objetivo do mock nao e simular inteligencia -- e provar que o CAMINHO
   * (validar, aplicar, versionar, permitir desfazer) funciona de ponta a
   * ponta sem gastar credito. Reconhece algumas instrucoes comuns por
   * palavra-chave; qualquer outra instrucao encurta o texto, que e a mudanca
   * mais previsivel de descrever e de verificar em teste.
   */
  async patchSection(input: PatchSectionInput): Promise<SectionPatchResult> {
    const startedAt = Date.now();
    const section = JSON.parse(JSON.stringify(input.currentSection)) as Record<string, unknown>;
    const instruction = input.instruction.toLowerCase();

    const shrink = (text: string): string => {
      const firstSentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
      return firstSentence.length < text.length ? firstSentence : text.slice(0, Math.ceil(text.length * 0.6));
    };

    for (const field of ['headline', 'subheadline', 'body'] as const) {
      const value = section[field];
      if (typeof value !== 'string' || !value) continue;

      if (/curt|reduz|direto|objetiv/.test(instruction)) {
        section[field] = shrink(value);
      } else if (/sofisticad|elegante|premium/.test(instruction) && field === 'headline') {
        section[field] = value.endsWith('.') ? value : `${value}.`;
      }
    }

    return {
      section,
      usage: mockUsage(JSON.stringify(input).length, JSON.stringify(section).length, startedAt),
    };
  }

  async reviseCopy(input: ReviseCopyInput): Promise<CopyPatchResult> {
    const startedAt = Date.now();
    const text = input.text.slice(0, input.maxLength);
    return { text, usage: mockUsage(input.text.length + input.instruction.length, text.length, startedAt) };
  }

  async generateOutreachMessage(input: OutreachInput): Promise<OutreachResult> {
    const startedAt = Date.now();
    const message =
      `Ola! Preparei uma proposta visual para a ${input.businessName}${input.niche ? ` (${input.niche})` : ''}. ` +
      `Da uma olhada quando puder: ${input.siteUrl} -- o que voce achou?`;

    return { message, usage: mockUsage(200, message.length, startedAt) };
  }
}

/** Fatos de exemplo, usados apenas quando o chamador nao informa nenhum. */
export const emptyBusinessFacts = (name: string): BusinessFacts => ({
  name,
  services: [],
  differentials: [],
  credentials: [],
  stats: [],
  testimonials: [],
  openingHours: [],
  phoneE164: null,
  whatsappE164: null,
  email: null,
  address: null,
  instagramUrl: null,
  websiteUrl: null,
  googleMapsUrl: null,
});
