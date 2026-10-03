/**
 * SiteSpec v2: o contrato entre a IA e a plataforma no modo demonstracao.
 *
 * Substitui o SitePlan v1 como FORMATO DE SAIDA DA IA. O renderer continua o
 * mesmo: `spec-to-plan.ts` converte o SiteSpec no plano que o assembler ja
 * valida e desenha. Assim a mudanca de contrato nao mexe no que ja funciona.
 *
 * Por que um schema novo, e nao o antigo com structured outputs:
 *
 *  - o v1 era uma uniao de 16 formatos de secao (~7,5 mil tokens de schema);
 *    structured outputs compila o schema numa gramatica, e unioes grandes com
 *    muitos campos opcionais sao exatamente o que estoura esse limite;
 *  - aqui toda secao tem o MESMO formato, e todo campo e obrigatorio: texto
 *    ausente e "" e lista ausente e []. Nenhum `anyOf`, nenhum opcional;
 *  - variantes, fontes, icones e presets sao ENUMS do catalogo real. O modelo
 *    nao consegue escolher algo que o renderer nao sabe desenhar;
 *  - nao existe NENHUM campo de URL. Imagem e um apelido ("img-2") da lista de
 *    imagens reais enviada na mensagem; o servidor resolve o apelido para o
 *    asset, e apelido desconhecido vira "sem imagem".
 *
 * Limites de tamanho (maxLength, maxItems...) nao sao aceitos por structured
 * outputs. Eles continuam no Zod e sao cobrados DEPOIS, do nosso lado --
 * `toStructuredOutputSchema` remove do JSON Schema o que a API recusaria.
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { ICON_ALLOWLIST } from '@site-kit/primitives/render-utils';
import { VARIANT_REGISTRY } from '@site-kit/registry/variants';
import { HEADER_VARIANTS, MOTION_PRESETS, SECTION_TYPES, TEXT_LIMITS } from '@site-kit/schemas/site-schema';

export const SITE_SPEC_VERSION = 'site-spec-v2';

/**
 * Fontes que a plataforma HOSPEDA e embute no site.
 *
 * Antes, o modelo escrevia qualquer nome de familia e o site nunca carregava a
 * fonte: todo site caia em Georgia + fonte do sistema, e a escolha tipografica
 * nao tinha efeito visual nenhum. Todas aqui sao licenca OFL.
 */
export const SITE_FONTS = [
  'Inter',
  'Manrope',
  'Sora',
  'Space Grotesk',
  'DM Sans',
  'Work Sans',
  'Fraunces',
  'Playfair Display',
  'Lora',
  'DM Serif Display',
] as const;
export type SiteFont = (typeof SITE_FONTS)[number];

const STABLE_VARIANT_IDS = VARIANT_REGISTRY.filter((variant) => variant.status === 'STABLE').map(
  (variant) => variant.id,
) as [string, ...string[]];

const ICONS = ['none', ...ICON_ALLOWLIST] as [string, ...string[]];

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const text = (max: number) => z.string().trim().max(max);
/** Apelido de imagem da lista enviada, ou "none". Nunca uma URL. */
const imageAlias = z.string().trim().max(12).regex(/^(none|img-\d{1,2})$/);

const ctaSchema = z.object({
  /** Destino. O numero/endereco real e montado pelo servidor a partir dos fatos. */
  intent: z.enum(['whatsapp', 'phone', 'email', 'scroll_to_contact', 'none']),
  label: text(TEXT_LIMITS.ctaLabel),
  whatsappMessage: text(300),
});

const itemSchema = z.object({
  title: text(TEXT_LIMITS.cardTitle),
  body: text(TEXT_LIMITS.cardBody),
  icon: z.enum(ICONS),
  image: imageAlias,
});

export const specSectionSchema = z.object({
  type: z.enum(SECTION_TYPES),
  /** Precisa pertencer a `type`; conferido na conversao. */
  variant: z.enum(STABLE_VARIANT_IDS),
  motionPreset: z.enum(MOTION_PRESETS),
  background: z.enum(['DEFAULT', 'SURFACE', 'PRIMARY', 'ACCENT_SOFT']),
  eyebrow: text(TEXT_LIMITS.eyebrow),
  headline: text(TEXT_LIMITS.headline),
  subheadline: text(TEXT_LIMITS.subheadline),
  paragraphs: z.array(text(TEXT_LIMITS.paragraph)).max(4),
  items: z.array(itemSchema).max(12),
  faq: z
    .array(z.object({ question: text(TEXT_LIMITS.question), answer: text(TEXT_LIMITS.answer) }))
    .max(12),
  bullets: z.array(text(TEXT_LIMITS.cardBody)).max(8),
  /** Imagem principal da secao (hero, sobre, autoridade). */
  image: imageAlias,
  /** Imagens da galeria, em ordem. */
  gallery: z.array(imageAlias).max(12),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema,
  /** So para whatsappForm: rotulo do botao. */
  submitLabel: text(TEXT_LIMITS.ctaLabel),
  /** So para footer. */
  tagline: text(TEXT_LIMITS.subheadline),
});
export type SpecSection = z.infer<typeof specSectionSchema>;

export const siteSpecSchema = z.object({
  concept: z.object({
    /** Nome curto do conceito visual, ex.: "Atelie de luz baixa". */
    name: text(80),
    idea: text(400),
    audience: text(400),
    toneOfVoice: text(200),
    narrative: text(600),
  }),
  visualDirection: z.object({
    mood: z.array(text(30)).max(5),
    mode: z.enum(['LIGHT', 'DARK']),
    shape: z.enum(['SHARP', 'SOFT', 'ROUND']),
    density: z.enum(['AIRY', 'BALANCED', 'COMPACT']),
    elevation: z.enum(['NONE', 'SOFT', 'MEDIUM']),
    borderWidth: z.enum(['0', '1', '2']),
    buttonStyle: z.enum(['SOLID', 'GRADIENT', 'OUTLINE', 'SOFT']),
    iconStyle: z.enum(['LINE', 'SOLID', 'DUOTONE']),
    imageTreatment: z.enum(['NATURAL', 'SOFT_SHADOW', 'FRAMED', 'DUOTONE', 'ROUNDED']),
    headerVariant: z.enum(HEADER_VARIANTS),
    compositionRationale: text(300),
    photographyTreatment: text(300),
  }),
  palette: z.object({
    background: hex,
    surface: hex,
    text: hex,
    muted: hex,
    primary: hex,
    primaryForeground: hex,
    accent: hex,
    accentForeground: hex,
    border: hex,
    rationale: text(300),
  }),
  typography: z.object({
    headingFont: z.enum(SITE_FONTS),
    bodyFont: z.enum(SITE_FONTS),
    scale: z.enum(['QUIET', 'BALANCED', 'DRAMATIC']),
    headingWeight: z.enum(['400', '500', '600', '700', '800']),
    rationale: text(300),
  }),
  /** Ordem do array = ordem da pagina. Variante escolhida por secao. */
  sections: z.array(specSectionSchema).min(2).max(14),
  motionPlan: z.object({
    smoothScroll: z.boolean(),
    rationale: text(200),
  }),
  seo: z.object({
    title: text(TEXT_LIMITS.metaTitle),
    description: text(TEXT_LIMITS.metaDescription),
    jsonLdType: z.enum(['LocalBusiness', 'ProfessionalService', 'Person', 'Organization']),
  }),
  cta: z.object({
    primaryLabel: text(TEXT_LIMITS.ctaLabel),
    whatsappMessage: text(300),
    headerLabel: text(TEXT_LIMITS.ctaLabel),
  }),
  businessSummary: text(600),
  entitySummary: text(400),
  servicesSummary: z.array(text(200)).max(12),
  missingData: z.array(text(300)).max(10),
});
export type SiteSpec = z.infer<typeof siteSpecSchema>;

/** Palavras-chave que structured outputs nao aceita e que o Zod valida depois. */
const UNSUPPORTED_KEYWORDS = new Set([
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minItems',
  'maxItems',
  'uniqueItems',
  'pattern',
  'default',
  '$schema',
]);

/**
 * JSON Schema aceito por structured outputs.
 *
 * - remove as restricoes nao suportadas (o Zod as cobra depois);
 * - `additionalProperties: false` em todo objeto (obrigatorio);
 * - todo campo em `required` (nenhum opcional, por desenho).
 */
export function toStructuredOutputSchema(schema: z.ZodTypeAny = siteSpecSchema): Record<string, unknown> {
  const raw = zodToJsonSchema(schema, { target: 'jsonSchema7', $refStrategy: 'none' });

  const clean = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(clean);
    if (!node || typeof node !== 'object') return node;

    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (UNSUPPORTED_KEYWORDS.has(key)) continue;
      out[key] = key === 'properties' ? cleanProperties(value) : clean(value);
    }
    if (out.type === 'object' && out.properties) {
      out.additionalProperties = false;
      out.required = Object.keys(out.properties as Record<string, unknown>);
    }
    return out;
  };

  const cleanProperties = (properties: unknown): unknown =>
    Object.fromEntries(
      Object.entries(properties as Record<string, unknown>).map(([name, value]) => [name, clean(value)]),
    );

  return clean(raw) as Record<string, unknown>;
}
