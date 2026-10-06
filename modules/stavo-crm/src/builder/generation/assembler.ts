/**
 * Assembler: SitePlan (autorado pela IA) + BusinessFacts (confirmados) -> SiteSchema.
 *
 * Esta funcao e o ponto onde a promessa central do modulo se cumpre: a IA
 * decide direcao criativa, copy e composicao; TODO fato que aparece na pagina
 * -- telefone, endereco, depoimento, credencial, numero -- vem exclusivamente
 * de `business`, nunca do texto que a IA escreveu.
 *
 * Encadeamento de responsabilidade:
 *   provider (IA)   -> SitePlanOutput, validado por `sitePlanSchema`
 *   assembler (isto) -> SiteSchemaModel, validado por `siteSchema`
 *   linter            -> decide se pode publicar
 *
 * O assembler NUNCA inventa um fato que falta: quando a secao pede um dado
 * ausente (telefone para o formulario de WhatsApp, endereco para o mapa), a
 * secao e OMITIDA e um aviso e registrado. Ausencia visivel de secao e sempre
 * preferivel a presenca de dado inventado.
 */
import { randomBytes } from 'node:crypto';

import type { SiteType } from '@site-kit/types/site-ai';
import type { BusinessFacts } from '@site-kit/schemas/site-schema';
import {
  SITE_RENDERER_VERSION,
  SITE_SCHEMA_VERSION,
  siteSchema,
  type ActionLink,
  type SiteSchemaModel,
  type SiteSection,
} from '@site-kit/schemas/site-schema';
import { adjustForContrast, meetsAA, themeContrastPairs } from '@site-kit/themes/colors';
import {
  sanitizeAnchor,
  sanitizeLine,
  sanitizeText,
  sanitizeUrl,
  uniqueAnchors,
} from '@site-kit/utils/sanitize';
import { checkCompatibility, variantsFor } from '@site-kit/registry/variants';
import type { PlanSection, SitePlanOutput } from '@builder/generation/plan-schema';
import type { SectionImageBinding } from '@builder/generation/spec-to-plan';

export interface AssembleInput {
  plan: SitePlanOutput;
  business: BusinessFacts;
  siteType: SiteType;
  creativeSeed: string;
  promptVersion: string;
  /**
   * Imagens REAIS ligadas a cada secao, no mesmo indice de `plan.sections`.
   * Vem do provedor de assets (uploads), nunca de texto escrito pela IA.
   */
  imageBindings?: SectionImageBinding[];
}

export interface AssembleResult {
  model: SiteSchemaModel;
  /** Secoes que o plano pediu mas foram descartadas por falta de fato. */
  droppedSections: Array<{ type: string; reason: string }>;
  /** Ajustes automaticos de cor para atingir contraste AA. */
  contrastAdjustments: string[];
  /** Avisos da propria IA sobre dado ausente, repassados ao editor. */
  aiWarnings: string[];
}

/** Whatsapp/telefone confirmados, na ordem de preferencia. */
function confirmedWhatsapp(business: BusinessFacts): string | null {
  return business.whatsappE164?.value ?? business.phoneE164?.value ?? null;
}

/**
 * Resolve um link de acao autorado pela IA contra os fatos confirmados.
 *
 * `required=true` garante um valor de volta (a fila de fallback termina em uma
 * ancora, que sempre existe). `required=false` devolve `null` quando nao ha
 * fato que sustente o link -- e o chamador omite o campo opcional.
 */
function resolveActionLink(
  link: ActionLink | undefined,
  business: BusinessFacts,
  fallbackAnchor: string,
  required: boolean,
): ActionLink | undefined {
  const label = link?.label ? sanitizeLine(link.label, 40) : 'Falar agora';
  const whatsapp = confirmedWhatsapp(business);

  const whatsappLink = (): ActionLink | null =>
    whatsapp
      ? {
          kind: 'whatsapp',
          label,
          target: whatsapp,
          prefilledMessage: link?.prefilledMessage
            ? sanitizeText(link.prefilledMessage, 600)
            : undefined,
        }
      : null;

  const kind = link?.kind ?? 'whatsapp';

  let resolved: ActionLink | null = null;

  if (kind === 'whatsapp') {
    resolved = whatsappLink();
  } else if (kind === 'tel') {
    resolved = business.phoneE164
      ? { kind: 'tel', label, target: business.phoneE164.value }
      : null;
  } else if (kind === 'mailto') {
    resolved = business.email ? { kind: 'mailto', label, target: business.email.value } : null;
  } else if (kind === 'external' || kind === 'maps') {
    // Nao aceita a URL que a IA escreveu: so um link de rede/site JA CONFIRMADO
    // pode ser usado, e ele passa pelo saneador de URL de qualquer forma.
    const candidate = business.instagramUrl?.value ?? business.websiteUrl?.value ?? null;
    const checked = candidate ? sanitizeUrl(candidate) : null;
    resolved = checked?.ok ? { kind, label, target: checked.url } : null;
  } else if (kind === 'anchor') {
    // O alvo que a IA propos nao existe de fato: a unica ancora garantida e a
    // que o proprio assembler decide.
    resolved = { kind: 'anchor', label, target: fallbackAnchor };
  }

  if (resolved) return resolved;
  if (!required) return undefined;

  // Cadeia de reserva para um CTA obrigatorio: whatsapp -> telefone -> ancora.
  return whatsappLink() ?? { kind: 'anchor', label, target: fallbackAnchor };
}

/** Ids estaveis e legiveis: `hero-1`, `services-2`. Unicos por construcao. */
const sectionId = (type: string, ordinal: number): string => `${type}-${ordinal}`;

/**
 * Escolhe uma variante valida para a secao.
 *
 * Se a IA escolheu algo que nao existe, que e de outro tipo, ou incompativel
 * com a quantidade de itens, cai para a primeira variante ESTAVEL daquele
 * tipo -- nunca para o fallback interno do renderer, que existe apenas como
 * ultima rede de seguranca.
 */
function resolveVariant(
  type: PlanSection['type'],
  requested: string,
  itemCount: number,
  hasImage: boolean,
): string {
  const check = checkCompatibility({
    variantId: requested,
    type,
    itemCount,
    hasImage,
    motionPreset: 'fade-in',
  });
  if (check.ok) return requested;

  const fallback = variantsFor(type)[0];
  return fallback?.id ?? requested;
}

const STANDARD_SECTION_ORDER: ReadonlyArray<PlanSection['type']> = [
  'hero',
  'about',
  'services',
  'benefits',
  'gallery',
  'process',
  'testimonials',
  'contactMap',
  'cta',
  'footer',
];

/**
 * PageNova V1 usa uma espinha dorsal unica em todos os nichos.
 * A IA escreve/adapta o conteudo, mas nao decide mais a arquitetura.
 * Isso evita paginas dominadas por WhatsApp e mantem previsibilidade mobile.
 */
function standardizeInitialSections(sections: PlanSection[]): PlanSection[] {
  const firstByType = new Map<PlanSection['type'], PlanSection>();
  for (const section of sections) {
    if (!STANDARD_SECTION_ORDER.includes(section.type)) continue;
    if (!firstByType.has(section.type)) firstByType.set(section.type, section);
  }
  return STANDARD_SECTION_ORDER
    .map((type) => firstByType.get(type))
    .filter((section): section is PlanSection => Boolean(section));
}

export function assemblePlan(input: AssembleInput): AssembleResult {
  const { plan, business, siteType, creativeSeed, promptVersion } = input;
  const droppedSections: Array<{ type: string; reason: string }> = [];
  const aiWarnings = plan.missingDataWarnings.map((warning) => sanitizeLine(warning, 300));

  // Passo 1: monta as secoes que TEM os fatos necessarios; descarta as que nao
  // tem. A ordem do plano e preservada -- e a composicao que a IA decidiu.
  const built: SiteSection[] = [];
  const counters = new Map<string, number>();

  const standardizedSections = standardizeInitialSections(plan.sections);

  for (const [index, planSection] of standardizedSections.entries()) {
    const ordinal = (counters.get(planSection.type) ?? 0) + 1;
    counters.set(planSection.type, ordinal);
    const id = sectionId(planSection.type, ordinal);
    const anchor = sanitizeAnchor(
      ('headline' in planSection && planSection.headline) || planSection.type,
      planSection.type,
    );

    const binding = input.imageBindings?.[index] ?? {};
    const section = buildSection(planSection, id, anchor, business, droppedSections, binding);
    if (section) built.push(section);
  }

  if (built.length === 0) {
    throw new Error('Nenhuma secao do plano pode ser montada com os fatos confirmados.');
  }

  // Passo 2: ancoras unicas de verdade, na ordem final.
  const anchors = uniqueAnchors(built.map((section) => section.anchor ?? section.id));
  built.forEach((section, index) => {
    section.anchor = anchors[index];
  });

  // Passo 3: agora que as ancoras finais existem, resolve os links que
  // apontavam para "algum lugar da pagina" -- inclusive os que ja tinham sido
  // montados no passo 1 com um alvo provisorio.
  const fallbackAnchor = pickFallbackAnchor(built);
  reresolveAnchors(built, fallbackAnchor);

  // Passo 4: menu montado pelas secoes REAIS, nunca pela proposta da IA.
  const navigation = buildNavigation(built, plan, business);

  // Passo 5: contraste. Ajusta preservando a intencao antes do linter rodar.
  const { theme, adjustments } = ensureContrast(plan.theme);

  const objectivePrimaryCta = resolveActionLink(
    {
      kind: 'whatsapp',
      label: plan.objective.primaryCtaLabel,
      target: '',
      prefilledMessage: plan.objective.primaryCtaMessage,
    },
    business,
    fallbackAnchor,
    true,
  )!;

  const model: SiteSchemaModel = {
    schemaVersion: SITE_SCHEMA_VERSION,
    rendererVersion: SITE_RENDERER_VERSION,
    project: { siteType, language: 'pt-BR', creativeSeed, promptVersion },
    business,
    objective: {
      goal: plan.objective.goal,
      customGoal: plan.objective.customGoal ? sanitizeLine(plan.objective.customGoal, 200) : undefined,
      primaryCta: objectivePrimaryCta,
    },
    creativeDirection: plan.creativeDirection,
    theme,
    navigation,
    sections: built,
    motion: plan.motion,
    seo: {
      title: sanitizeLine(plan.seo.title, 60),
      description: sanitizeLine(plan.seo.description, 160),
      canonicalUrl: null,
      ogImage: null,
      noindex: true,
      jsonLdType: plan.seo.jsonLdType,
    },
    geo: {
      entityName: business.name,
      entitySummary: sanitizeText(plan.geo.entitySummary, 400),
      servicesSummary: plan.geo.servicesSummary.map((item) => sanitizeLine(item, 200)),
      locationSummary: [business.city, business.state].filter(Boolean).join(' - ') || undefined,
    },
    integrations: {
      whatsappE164: confirmedWhatsapp(business),
      mapsPlaceId: extractPlaceId(business.googleMapsUrl?.value),
      analytics: 'NONE',
    },
  };

  // Ultima palavra: o schema completo precisa validar. Se o assembler tem um
  // bug, isto falha aqui -- nunca em produção com um site fora do padrao.
  const parsed = siteSchema.parse(model);

  return { model: parsed, droppedSections, contrastAdjustments: adjustments, aiWarnings };
}

// ---------------------------------------------------------------------------
// Construcao por tipo de secao
// ---------------------------------------------------------------------------

function buildSection(
  plan: PlanSection,
  id: string,
  anchor: string,
  business: BusinessFacts,
  dropped: Array<{ type: string; reason: string }>,
  binding: SectionImageBinding = {},
): SiteSection | null {
  const base = {
    id,
    anchor,
    visible: plan.visible,
    motionPreset: plan.motionPreset,
    style: plan.style,
  };

  switch (plan.type) {
    case 'hero': {
      const variant = resolveVariant('hero', plan.variant, 0, Boolean(binding.image));
      return {
        ...base,
        type: 'hero',
        variant,
        eyebrow: plan.eyebrow ? sanitizeLine(plan.eyebrow, 60) : undefined,
        headline: sanitizeLine(plan.headline, 120),
        subheadline: plan.subheadline ? sanitizeLine(plan.subheadline, 220) : undefined,
        // Alvo provisorio: reresolveAnchors substitui pelo real no passo 3.
        primaryCta: resolveActionLink(plan.primaryCta, business, anchor, true)!,
        secondaryCta: resolveActionLink(plan.secondaryCta, business, anchor, false),
        highlights: business.stats.slice(0, 2).map((stat) => `${stat.value.value} ${stat.value.label}`),
        // Chave presente mesmo vazia: e o que faz o slot de imagem aparecer no
        // editor (etapa A10). Uma chave OMITIDA nao apareceria em
        // `Object.keys`, e o editor nunca saberia que a secao aceita foto.
        image: binding.image,
      };
    }

    case 'about':
      return {
        ...base,
        type: 'about',
        variant: resolveVariant('about', plan.variant, 0, Boolean(binding.image)),
        headline: sanitizeLine(plan.headline, 120),
        body: plan.body.map((block) => sanitizeText(block, 600)),
        cta: resolveActionLink(plan.cta, business, anchor, false),
        image: binding.image,
      };

    case 'services':
    case 'benefits':
    case 'audience': {
      const items = plan.items.map((item, itemIndex) => ({
        title: sanitizeLine(item.title, 80),
        body: item.body ? sanitizeText(item.body, 300) : undefined,
        icon: item.icon,
        image: binding.itemImages?.[itemIndex],
      }));
      const variant = resolveVariant(plan.type, plan.variant, items.length, items.some((item) => item.image));

      if (plan.type === 'services') {
        return {
          ...base,
          type: 'services',
          variant,
          headline: sanitizeLine(plan.headline, 120),
          subheadline: plan.subheadline ? sanitizeLine(plan.subheadline, 220) : undefined,
          items,
          cta: resolveActionLink(plan.cta, business, anchor, false),
        };
      }
      if (plan.type === 'benefits') {
        return { ...base, type: 'benefits', variant, headline: sanitizeLine(plan.headline, 120), items };
      }
      return {
        ...base,
        type: 'audience',
        variant,
        headline: sanitizeLine(plan.headline, 120),
        subheadline: plan.subheadline ? sanitizeLine(plan.subheadline, 220) : undefined,
        items,
      };
    }

    case 'authority': {
      // Credenciais SO as confirmadas. Nome SEMPRE o do negocio confirmado --
      // a IA nunca decide quem e a pessoa por tras do site.
      const credentials = business.credentials
        .filter((c) => c.source !== 'AI_INFERRED')
        .map((c) => c.value)
        .slice(0, 8);

      return {
        ...base,
        type: 'authority',
        variant: resolveVariant('authority', plan.variant, credentials.length, Boolean(binding.image)),
        headline: sanitizeLine(plan.headline, 120),
        body: plan.body ? sanitizeText(plan.body, 600) : undefined,
        personName: business.name,
        personRole: plan.personRole ? sanitizeLine(plan.personRole, 80) : undefined,
        credentials,
        image: binding.image,
      };
    }

    case 'stats': {
      const confirmed = business.stats.filter((s) => s.source !== 'AI_INFERRED');
      if (confirmed.length < 2) {
        dropped.push({ type: 'stats', reason: 'Menos de dois numeros confirmados pelo negocio.' });
        return null;
      }
      const items = confirmed.slice(0, 6).map((s) => s.value);
      return {
        ...base,
        type: 'stats',
        variant: resolveVariant('stats', plan.variant, items.length, false),
        headline: plan.headline ? sanitizeLine(plan.headline, 120) : undefined,
        items,
      };
    }

    case 'process': {
      const steps = plan.steps.map((item, itemIndex) => ({
        title: sanitizeLine(item.title, 80),
        body: item.body ? sanitizeText(item.body, 300) : undefined,
        icon: item.icon,
        image: binding.itemImages?.[itemIndex],
      }));
      return {
        ...base,
        type: 'process',
        variant: resolveVariant('process', plan.variant, steps.length, steps.some((step) => step.image)),
        headline: sanitizeLine(plan.headline, 120),
        subheadline: plan.subheadline ? sanitizeLine(plan.subheadline, 220) : undefined,
        steps,
        cta: resolveActionLink(plan.cta, business, anchor, false),
      };
    }

    case 'gallery': {
      // Galeria so com imagens REAIS do provedor de assets. Sem pelo menos
      // duas, a secao e descartada -- nunca montada com imagem inventada.
      const images = (binding.gallery ?? []).slice(0, 12);
      if (images.length < 2) {
        dropped.push({ type: 'gallery', reason: 'Menos de duas imagens reais disponiveis para a galeria.' });
        return null;
      }
      return {
        ...base,
        type: 'gallery',
        variant: resolveVariant('gallery', plan.variant, images.length, true),
        headline: plan.headline ? sanitizeLine(plan.headline, 120) : undefined,
        images,
      };
    }

    case 'offer':
      return {
        ...base,
        type: 'offer',
        variant: resolveVariant('offer', plan.variant, 0, false),
        headline: sanitizeLine(plan.headline, 120),
        body: plan.body ? sanitizeText(plan.body, 600) : undefined,
        bullets: plan.bullets.map((item) => sanitizeLine(item, 300)),
        cta: resolveActionLink(plan.cta, business, anchor, true)!,
      };

    case 'testimonials': {
      const confirmed = business.testimonials.filter((t) => t.source !== 'AI_INFERRED');
      if (confirmed.length === 0) {
        dropped.push({ type: 'testimonials', reason: 'Nenhum depoimento confirmado pelo negocio.' });
        return null;
      }
      const items = confirmed.slice(0, 12).map((t) => t.value);
      return {
        ...base,
        type: 'testimonials',
        variant: resolveVariant('testimonials', plan.variant, items.length, false),
        headline: sanitizeLine(plan.headline, 120),
        items,
      };
    }

    case 'faq':
      return {
        ...base,
        type: 'faq',
        variant: resolveVariant('faq', plan.variant, plan.items.length, false),
        headline: sanitizeLine(plan.headline, 120),
        items: plan.items.map((item) => ({
          question: sanitizeLine(item.question, 160),
          answer: sanitizeText(item.answer, 800),
        })),
      };

    case 'cta':
      return {
        ...base,
        type: 'cta',
        variant: resolveVariant('cta', plan.variant, 0, false),
        headline: sanitizeLine(plan.headline, 120),
        body: plan.body ? sanitizeText(plan.body, 600) : undefined,
        primaryCta: resolveActionLink(plan.primaryCta, business, anchor, true)!,
        secondaryCta: resolveActionLink(plan.secondaryCta, business, anchor, false),
      };

    case 'contactMap': {
      const contacts: ActionLink[] = [];
      const whatsapp = confirmedWhatsapp(business);
      if (whatsapp) contacts.push({ kind: 'whatsapp', label: 'Falar no WhatsApp', target: whatsapp });
      if (business.phoneE164) contacts.push({ kind: 'tel', label: 'Ligar', target: business.phoneE164.value });
      if (business.email) contacts.push({ kind: 'mailto', label: 'E-mail', target: business.email.value });
      if (business.instagramUrl) {
        const checked = sanitizeUrl(business.instagramUrl.value);
        if (checked.ok) contacts.push({ kind: 'external', label: 'Instagram', target: checked.url });
      }

      const mapsUrl = business.googleMapsUrl?.value;
      const address = business.address?.value;

      if (!address && !mapsUrl && contacts.length === 0 && business.openingHours.length === 0) {
        dropped.push({ type: 'contactMap', reason: 'Nenhum dado de contato confirmado.' });
        return null;
      }

      return {
        ...base,
        type: 'contactMap',
        variant: resolveVariant('contactMap', plan.variant, contacts.length, false),
        headline: sanitizeLine(plan.headline, 120),
        address,
        mapsUrl,
        showEmbeddedMap: false,
        contacts: contacts.slice(0, 6),
        openingHours: business.openingHours,
      };
    }

    case 'whatsappForm': {
      const whatsapp = confirmedWhatsapp(business);
      if (!whatsapp) {
        dropped.push({ type: 'whatsappForm', reason: 'Nenhum WhatsApp confirmado pelo negocio.' });
        return null;
      }
      return {
        ...base,
        type: 'whatsappForm',
        variant: resolveVariant('whatsappForm', plan.variant, plan.fields.length, false),
        headline: sanitizeLine(plan.headline, 120),
        body: plan.body ? sanitizeText(plan.body, 600) : undefined,
        fields: plan.fields.map((field) => ({
          name: field.name,
          label: sanitizeLine(field.label, 30),
          type: field.type,
          required: field.required,
          options: field.options.map((o) => sanitizeLine(o, 60)),
        })),
        submitLabel: sanitizeLine(plan.submitLabel, 40),
        whatsappE164: whatsapp,
      };
    }

    case 'footer': {
      const links: ActionLink[] = [];
      const socialLinks: ActionLink[] = [];
      if (business.instagramUrl) {
        const checked = sanitizeUrl(business.instagramUrl.value);
        if (checked.ok) socialLinks.push({ kind: 'external', label: 'Instagram', target: checked.url });
      }
      const legalNote = business.credentials.find((c) => c.source !== 'AI_INFERRED')?.value;

      return {
        ...base,
        type: 'footer',
        variant: resolveVariant('footer', plan.variant, links.length + socialLinks.length, false),
        businessName: business.name,
        tagline: plan.tagline ? sanitizeLine(plan.tagline, 220) : undefined,
        links,
        socialLinks,
        legalNote,
        showAgencyCredit: false,
      };
    }

    default: {
      const exhaustive: never = plan;
      void exhaustive;
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// Ancoras, menu e contraste
// ---------------------------------------------------------------------------

/** Melhor destino para um CTA de "ancora generica": contato, depois o ultimo. */
function pickFallbackAnchor(sections: SiteSection[]): string {
  const contact = sections.find((s) => s.type === 'contactMap' || s.type === 'whatsappForm');
  return contact?.anchor ?? sections[sections.length - 1]!.anchor ?? sections[0]!.anchor!;
}

/**
 * Corrige, em segunda passada, os links de ancora que apontavam para um
 * destino provisorio criado antes de as ancoras finais existirem.
 */
function reresolveAnchors(sections: SiteSection[], fallbackAnchor: string): void {
  const validAnchors = new Set(sections.map((s) => s.anchor).filter(Boolean) as string[]);

  const fix = (link: ActionLink | undefined): ActionLink | undefined => {
    if (!link || link.kind !== 'anchor') return link;
    if (validAnchors.has(link.target)) return link;
    return { ...link, target: fallbackAnchor };
  };

  for (const section of sections) {
    const record = section as unknown as Record<string, unknown>;
    for (const key of ['primaryCta', 'secondaryCta', 'cta']) {
      if (record[key]) record[key] = fix(record[key] as ActionLink);
    }
  }
}

function buildNavigation(sections: SiteSection[], plan: SitePlanOutput, business: BusinessFacts) {
  const EXCLUDED = new Set(['hero', 'footer', 'cta', 'whatsappForm']);

  const items = sections
    .filter((section) => !EXCLUDED.has(section.type) && section.anchor)
    .slice(0, 5)
    .map((section) => ({
      label: sanitizeLine(('headline' in section && section.headline) || section.type, 30),
      anchor: section.anchor!,
    }));

  const whatsapp = confirmedWhatsapp(business);

  return {
    // Cabecalho padrao PageNova: marca textual (ou logo quando houver),
    // menu responsivo/hamburguer e CTA discreto.
    showMenu: true,
    headerVariant: 'inline-right' as const,
    items,
    logo: null,
    wordmark: plan.navigation.wordmark ? sanitizeLine(plan.navigation.wordmark, 60) : business.name,
    headerCta: whatsapp
      ? {
          kind: 'whatsapp' as const,
          label: plan.navigation.headerCtaLabel
            ? sanitizeLine(plan.navigation.headerCtaLabel, 40)
            : 'Falar agora',
          target: whatsapp,
        }
      : null,
    stickyHeader: plan.navigation.stickyHeader,
  };
}

/**
 * Ajusta as cores propostas pela IA ate baterem o contraste AA.
 *
 * Preserva a intencao (o matiz) e so muda a luminosidade -- e o que
 * `adjustForContrast` faz. Quando nem preto nem branco resolvem (cores muito
 * proximas uma da outra), a cor original e mantida e o linter, mais tarde,
 * bloqueia a publicacao para uma correcao manual consciente.
 */
function ensureContrast(theme: SiteSchemaModel['theme']): {
  theme: SiteSchemaModel['theme'];
  adjustments: string[];
} {
  const colors = { ...theme.colors };
  const adjustments: string[] = [];

  /**
   * Duas rodadas, recalculando os pares a cada passo.
   *
   * Uma rodada so nao basta: "texto sobre o fundo" e "texto sobre os
   * cartoes" compartilham o MESMO campo (`text`). Corrigir o primeiro par e
   * so entao reler os pares -- em vez de usar o snapshot antigo -- e o que
   * garante que o segundo par avalie o texto ja ajustado, convergindo para um
   * valor que atende os dois ao mesmo tempo em vez de o ultimo desfazer o
   * ajuste do primeiro.
   */
  for (let round = 0; round < 2; round += 1) {
    for (const pair of themeContrastPairs(colors)) {
      if (meetsAA(pair.fg, pair.bg, pair.large)) continue;

      const adjusted = adjustForContrast(pair.fg, pair.bg, pair.large ? 3 : 4.5);
      if (adjusted && adjusted !== colors[pair.fgKey]) {
        colors[pair.fgKey] = adjusted;
        const message = `${pair.label}: cor ajustada para atingir contraste minimo.`;
        if (!adjustments.includes(message)) adjustments.push(message);
      }
    }
  }

  return { theme: { ...theme, colors }, adjustments };
}

/** Extrai o Place ID de uma Maps URL oficial, sem fazer nenhuma requisicao. */
function extractPlaceId(mapsUrl: string | undefined): string | null {
  if (!mapsUrl) return null;
  const match = /(?:place_id:|placeid=)([\w-]+)/.exec(mapsUrl);
  return match?.[1] ?? null;
}

/** Semente criativa nova, para quando o provider precisa de uma. */
export const newCreativeSeed = (): string => randomBytes(8).toString('hex');
