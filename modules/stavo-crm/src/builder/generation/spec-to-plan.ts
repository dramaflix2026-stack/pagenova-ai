/**
 * SiteSpec (saida da IA) -> SitePlan (entrada do assembler) + imagens reais.
 *
 * Structured outputs garante a FORMA do SiteSpec. O que ele nao garante --
 * variante de outro tipo, preset fora do nivel, itens fora da faixa, hero no
 * meio da pagina -- e corrigido aqui, de forma deterministica e sem chamada
 * paga. Cada correcao vira um aviso para o editor e conta como "problema de
 * validacao" na observabilidade: se o numero subir, o prompt precisa de ajuste.
 */
import type { AssetRef } from '@site-kit/schemas/site-schema';
import { presetsForLevel, type MotionPresetId } from '@site-kit/interactions/motion';
import { findVariant, variantsFor } from '@site-kit/registry/variants';
import type { PlanSection, SitePlanOutput } from '@builder/generation/plan-schema';
import { PLACEHOLDER_TARGET } from '@builder/generation/plan-schema';
import { resolveAlias, type AliasedCandidate } from '@builder/generation/image-candidates';
import type { GenerateSitePlanInput } from '@builder/generation/provider';
import type { SiteSpec, SpecSection } from '@builder/generation/site-spec';

/** Imagens reais ligadas a uma secao do plano (mesmo indice de `plan.sections`). */
export interface SectionImageBinding {
  image?: AssetRef;
  gallery?: AssetRef[];
  itemImages?: Array<AssetRef | undefined>;
}

export interface SpecConversion {
  plan: SitePlanOutput;
  imageBindings: SectionImageBinding[];
  /** O que precisou ser corrigido na saida da IA. */
  adjustments: string[];
}

/** Faixas de itens aceitas pelo SiteSchema, independentes da variante. */
const ITEM_RANGE: Partial<Record<SpecSection['type'], [number, number]>> = {
  services: [1, 12],
  benefits: [2, 8],
  audience: [2, 8],
  process: [2, 8],
};

const SCALE = {
  QUIET: { min: 1.8, max: 3.2, tight: 1.2 },
  BALANCED: { min: 2.1, max: 4.2, tight: 1.12 },
  DRAMATIC: { min: 2.4, max: 5.6, tight: 1.02 },
} as const;

const SPACING = {
  AIRY: { sectionPaddingRem: 7, containerMaxWidthPx: 1200, gapRem: 2, bodyRem: 1.0625 },
  BALANCED: { sectionPaddingRem: 5.5, containerMaxWidthPx: 1180, gapRem: 1.5, bodyRem: 1 },
  COMPACT: { sectionPaddingRem: 4, containerMaxWidthPx: 1140, gapRem: 1.1, bodyRem: 1 },
} as const;

const RADII = {
  SHARP: { sm: 0, md: 2, lg: 4, pill: 4 },
  SOFT: { sm: 6, md: 12, lg: 20, pill: 999 },
  ROUND: { sm: 12, md: 24, lg: 36, pill: 999 },
} as const;

const orFallback = (value: string, fallback: string): string => (value.trim() ? value.trim() : fallback);
const optional = (value: string): string | undefined => (value.trim() ? value.trim() : undefined);

/** Garante um texto dentro de [min, max], completando com o complemento. */
function withinLength(value: string, min: number, max: number, complement: string): string {
  let result = value.trim();
  if (result.length < min) result = `${result} ${complement}`.trim();
  if (result.length < min) result = result.padEnd(min, '.');
  return result.slice(0, max);
}

/** Link de acao com alvo provisorio; o assembler troca pelo fato confirmado. */
interface PlanAction {
  kind: 'whatsapp' | 'tel' | 'mailto' | 'anchor';
  label: string;
  target: string;
  prefilledMessage?: string;
}

function toAction(cta: SpecSection['primaryCta'], fallbackLabel: string, required: boolean): PlanAction | undefined {
  const kinds = { whatsapp: 'whatsapp', phone: 'tel', email: 'mailto', scroll_to_contact: 'anchor' } as const;
  if (cta.intent === 'none' && !required) return undefined;
  const kind = cta.intent === 'none' ? 'whatsapp' : kinds[cta.intent];
  return {
    kind,
    label: orFallback(cta.label, fallbackLabel).slice(0, 40),
    target: PLACEHOLDER_TARGET,
    ...(cta.whatsappMessage.trim() ? { prefilledMessage: cta.whatsappMessage.trim() } : {}),
  };
}

export function convertSpecToPlan(
  spec: SiteSpec,
  input: GenerateSitePlanInput,
  candidates: AliasedCandidate[],
): SpecConversion {
  const adjustments: string[] = [];
  const allowedMotion = new Set<MotionPresetId>(presetsForLevel(input.style.motionLevel));
  const fallbackMotion: MotionPresetId = input.style.motionLevel === 'NONE' ? 'none' : 'fade-up-soft';
  const forbidden = new Set(input.forbiddenSections ?? []);
  const primaryLabel = orFallback(spec.cta.primaryLabel, 'Falar agora');

  // 1. Ordem: um hero no inicio, um footer no fim, no maximo 2 de cada tipo.
  const counts = new Map<string, number>();
  let ordered = spec.sections.filter((section) => {
    if (forbidden.has(section.type)) {
      adjustments.push(`Secao "${section.type}" removida: estava entre as proibidas.`);
      return false;
    }
    const limit = section.type === 'hero' || section.type === 'footer' ? 1 : 2;
    const count = (counts.get(section.type) ?? 0) + 1;
    counts.set(section.type, count);
    if (count > limit) {
      adjustments.push(`Secao "${section.type}" repetida demais; a copia extra foi removida.`);
      return false;
    }
    return true;
  });
  const hero = ordered.find((section) => section.type === 'hero');
  const footer = ordered.find((section) => section.type === 'footer');
  const middle = ordered.filter((section) => section.type !== 'hero' && section.type !== 'footer');
  if (hero && ordered[0] !== hero) adjustments.push('O hero foi movido para o inicio da pagina.');
  if (footer && ordered[ordered.length - 1] !== footer) adjustments.push('O rodape foi movido para o fim da pagina.');
  ordered = [...(hero ? [hero] : []), ...middle, ...(footer ? [footer] : [])];

  const sections: PlanSection[] = [];
  const imageBindings: SectionImageBinding[] = [];

  for (const section of ordered) {
    // 2. Variante precisa ser do tipo; senao, a primeira estavel do tipo.
    let variant = section.variant;
    if (findVariant(variant)?.type !== section.type) {
      const fallback = variantsFor(section.type)[0]?.id ?? variant;
      adjustments.push(`Variante "${variant}" nao existe para "${section.type}"; usada "${fallback}".`);
      variant = fallback;
    }

    // 3. Movimento dentro do nivel escolhido no briefing.
    let motionPreset = section.motionPreset;
    if (!allowedMotion.has(motionPreset)) {
      adjustments.push(`Movimento "${motionPreset}" nao permitido no nivel ${input.style.motionLevel}; usado "${fallbackMotion}".`);
      motionPreset = fallbackMotion;
    }

    const base = {
      variant,
      visible: true,
      motionPreset,
      style: { background: section.background },
    };
    const headline = orFallback(section.headline, input.business.name).slice(0, 120);
    const subheadline = optional(section.subheadline);
    const paragraphs = section.paragraphs.map((p) => p.trim()).filter(Boolean);

    // 4. Itens dentro da faixa do SiteSchema.
    let items = section.items.filter((item) => item.title.trim());
    const range = ITEM_RANGE[section.type];
    if (range) {
      if (items.length > range[1]) {
        adjustments.push(`"${section.type}" tinha ${items.length} itens; mantidos ${range[1]}.`);
        items = items.slice(0, range[1]);
      }
      if (items.length < range[0]) {
        adjustments.push(`Secao "${section.type}" removida: precisa de pelo menos ${range[0]} itens.`);
        continue;
      }
    }
    const planItems = items.map((item) => ({
      title: item.title.trim().slice(0, 80),
      body: optional(item.body),
      icon: item.icon === 'none' ? undefined : item.icon,
    }));

    const binding: SectionImageBinding = {};
    const image = resolveAlias(section.image, candidates);
    if (section.image !== 'none' && !image) {
      adjustments.push(`Imagem "${section.image}" nao existe na lista enviada; ignorada.`);
    }
    if (image && ['hero', 'about', 'authority'].includes(section.type)) binding.image = image;
    if (range) {
      const itemImages = items.map((item) => resolveAlias(item.image, candidates) ?? undefined);
      if (itemImages.some(Boolean)) binding.itemImages = itemImages;
    }

    let planSection: PlanSection | null = null;

    switch (section.type) {
      case 'hero':
        planSection = {
          ...base,
          type: 'hero',
          eyebrow: optional(section.eyebrow),
          headline,
          subheadline,
          primaryCta: toAction(section.primaryCta, primaryLabel, true)!,
          secondaryCta: toAction(section.secondaryCta, 'Saber mais', false),
        };
        break;
      case 'about':
        planSection = {
          ...base,
          type: 'about',
          headline,
          body: (paragraphs.length ? paragraphs : [orFallback(section.subheadline, input.business.description ?? input.business.name)]).slice(0, 4),
          cta: toAction(section.primaryCta, primaryLabel, false),
        };
        break;
      case 'services':
        planSection = { ...base, type: 'services', headline, subheadline, items: planItems, cta: toAction(section.primaryCta, primaryLabel, false) };
        break;
      case 'benefits':
        planSection = { ...base, type: 'benefits', headline, items: planItems };
        break;
      case 'audience':
        planSection = { ...base, type: 'audience', headline, subheadline, items: planItems };
        break;
      case 'process':
        planSection = { ...base, type: 'process', headline, subheadline, steps: planItems, cta: toAction(section.primaryCta, primaryLabel, false) };
        break;
      case 'authority':
        planSection = { ...base, type: 'authority', headline, body: paragraphs[0] };
        break;
      case 'stats':
        planSection = { ...base, type: 'stats', headline: optional(section.headline) };
        break;
      case 'gallery': {
        const gallery = section.gallery
          .map((alias) => resolveAlias(alias, candidates))
          .filter((ref): ref is AssetRef => Boolean(ref));
        if (gallery.length < 2) {
          adjustments.push('Galeria removida: precisa de pelo menos 2 imagens reais.');
          break;
        }
        binding.gallery = gallery;
        planSection = { ...base, type: 'gallery', headline: optional(section.headline) };
        break;
      }
      case 'offer':
        planSection = {
          ...base,
          type: 'offer',
          headline,
          body: paragraphs[0],
          bullets: section.bullets.map((b) => b.trim()).filter(Boolean).slice(0, 8),
          cta: toAction(section.primaryCta, primaryLabel, true)!,
        };
        break;
      case 'testimonials':
        planSection = { ...base, type: 'testimonials', headline };
        break;
      case 'faq': {
        const faq = section.faq.filter((entry) => entry.question.trim() && entry.answer.trim()).slice(0, 12);
        if (faq.length < 2) {
          adjustments.push('FAQ removido: precisa de pelo menos 2 perguntas.');
          break;
        }
        planSection = { ...base, type: 'faq', headline, items: faq.map((entry) => ({ question: entry.question.trim(), answer: entry.answer.trim() })) };
        break;
      }
      case 'cta':
        planSection = {
          ...base,
          type: 'cta',
          headline,
          body: paragraphs[0],
          primaryCta: toAction(section.primaryCta, primaryLabel, true)!,
          secondaryCta: toAction(section.secondaryCta, 'Saber mais', false),
        };
        break;
      case 'contactMap':
        planSection = { ...base, type: 'contactMap', headline };
        break;
      case 'whatsappForm':
        planSection = {
          ...base,
          type: 'whatsappForm',
          headline,
          body: paragraphs[0],
          // Campos fixos e seguros: o formulario so monta a mensagem do WhatsApp.
          fields: [
            { name: 'nome', label: 'Seu nome', type: 'text', required: true, options: [] },
            { name: 'mensagem', label: 'Como podemos ajudar?', type: 'textarea', required: false, options: [] },
          ],
          submitLabel: orFallback(section.submitLabel, 'Enviar pelo WhatsApp').slice(0, 40),
        };
        break;
      case 'footer':
        planSection = { ...base, type: 'footer', tagline: optional(section.tagline) };
        break;
    }

    if (planSection) {
      sections.push(planSection);
      imageBindings.push(binding);
    }
  }

  const summary = orFallback(spec.businessSummary, `${input.business.name}${input.business.niche ? `, ${input.business.niche}` : ''}.`);
  const place = [input.business.niche, input.business.city].filter(Boolean).join(' em ');

  const plan: SitePlanOutput = {
    businessSummary: withinLength(summary, 10, 600, input.business.name),
    creativeDirection: {
      positioning: orFallback(spec.concept.idea, summary).slice(0, 400),
      audienceSummary: orFallback(spec.concept.audience, input.business.audience ?? 'Publico do negocio.').slice(0, 400),
      objections: [],
      toneOfVoice: orFallback(spec.concept.toneOfVoice, 'Direto e acolhedor.').slice(0, 200),
      visualConcept: orFallback(
        [spec.concept.name, spec.visualDirection.mood.join(', ')].filter(Boolean).join(' -- '),
        'Conceito visual do negocio.',
      ).slice(0, 400),
      paletteRationale: orFallback(spec.palette.rationale, 'Paleta escolhida para o publico.').slice(0, 300),
      typographyRationale: orFallback(spec.typography.rationale, 'Tipografia escolhida para o tom.').slice(0, 300),
      compositionRationale: orFallback(spec.visualDirection.compositionRationale, 'Composicao em ritmo alternado.').slice(0, 300),
      photographyTreatment: optional(spec.visualDirection.photographyTreatment)?.slice(0, 300),
      narrative: orFallback(spec.concept.narrative, summary).slice(0, 600),
    },
    theme: {
      mode: spec.visualDirection.mode,
      colors: {
        background: spec.palette.background,
        surface: spec.palette.surface,
        text: spec.palette.text,
        muted: spec.palette.muted,
        primary: spec.palette.primary,
        primaryForeground: spec.palette.primaryForeground,
        accent: spec.palette.accent,
        accentForeground: spec.palette.accentForeground,
        border: spec.palette.border,
      },
      typography: {
        headingFont: spec.typography.headingFont,
        bodyFont: spec.typography.bodyFont,
        headingMinRem: SCALE[spec.typography.scale].min,
        headingMaxRem: SCALE[spec.typography.scale].max,
        bodyRem: SPACING[spec.visualDirection.density].bodyRem,
        headingWeight: Number(spec.typography.headingWeight),
        lineHeightTight: SCALE[spec.typography.scale].tight,
        lineHeightBody: 1.6,
      },
      spacing: {
        sectionPaddingRem: SPACING[spec.visualDirection.density].sectionPaddingRem,
        containerMaxWidthPx: SPACING[spec.visualDirection.density].containerMaxWidthPx,
        gapRem: SPACING[spec.visualDirection.density].gapRem,
      },
      radii: { ...RADII[spec.visualDirection.shape] },
      elevation: spec.visualDirection.elevation,
      borderWidth: Number(spec.visualDirection.borderWidth),
      iconStyle: spec.visualDirection.iconStyle,
      imageTreatment: spec.visualDirection.imageTreatment,
      buttonStyle: spec.visualDirection.buttonStyle,
      density: spec.visualDirection.density,
    },
    navigation: {
      showMenu: true,
      headerVariant: spec.visualDirection.headerVariant,
      stickyHeader: true,
      headerCtaLabel: optional(spec.cta.headerLabel)?.slice(0, 40),
    },
    objective: {
      goal: input.objective.goal as SitePlanOutput['objective']['goal'],
      customGoal: input.objective.customGoal,
      primaryCtaLabel: primaryLabel.slice(0, 40),
      primaryCtaMessage: optional(spec.cta.whatsappMessage),
    },
    motion: {
      level: input.style.motionLevel,
      respectReducedMotion: true,
      useSmoothScroll: input.style.motionLevel === 'NONE' ? false : spec.motionPlan.smoothScroll,
    },
    sections,
    seo: {
      title: withinLength(spec.seo.title, 15, 60, place || input.business.name),
      description: withinLength(spec.seo.description, 50, 160, summary),
      jsonLdType: spec.seo.jsonLdType,
    },
    geo: {
      entitySummary: withinLength(orFallback(spec.entitySummary, summary), 20, 400, input.business.name),
      servicesSummary: spec.servicesSummary.map((item) => item.trim()).filter(Boolean).slice(0, 12),
    },
    missingDataWarnings: spec.missingData.map((item) => item.trim()).filter(Boolean).slice(0, 10),
  };

  return { plan, imageBindings, adjustments };
}
