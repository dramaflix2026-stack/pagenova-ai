/**
 * SiteSchema: o contrato do site gerado.
 *
 * Esta e a fonte de verdade do projeto. O editor altera ISTO, nunca codigo; o
 * renderer le ISTO; a publicacao congela ISTO; o ZIP sai DISTO. Um unico
 * formato para as quatro coisas e o que impede o preview e o site final de
 * divergirem.
 *
 * Duas regras estruturais valem para o arquivo inteiro:
 *
 *  1. A IA escolhe entre opcoes EXISTENTES -- tipos de secao, variantes, ids de
 *     preset, tokens dentro de faixas. Ela nunca devolve HTML, CSS, JavaScript
 *     ou um nome de componente inventado. O que nao esta no enum nao entra.
 *  2. Fato e decisao criativa moram em campos separados. `business` guarda o
 *     que foi confirmado; `creativeDirection` guarda o que a IA decidiu. Assim
 *     nenhuma frase bonita vira um dado do lead por acidente.
 */
import { z } from 'zod';

import { MOTION_LEVELS, SITE_TYPES } from '@site-kit/types/site-ai';
import { MOTION_PRESETS } from '@site-kit/interactions/motion';

export const SITE_SCHEMA_VERSION = '1.0.0';
export const SITE_RENDERER_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Limites de texto
// ---------------------------------------------------------------------------

/**
 * Tetos por tipo de texto.
 *
 * Nao sao burocracia: um `eyebrow` de 200 caracteres quebra a composicao da
 * hero, e uma headline de 400 vira um paragrafo mal formatado. O limite
 * protege o layout de um conteudo que o componente nao aguenta.
 */
export const TEXT_LIMITS = {
  eyebrow: 60,
  headline: 120,
  subheadline: 220,
  paragraph: 600,
  cardTitle: 80,
  cardBody: 300,
  ctaLabel: 40,
  navLabel: 30,
  question: 160,
  answer: 800,
  quote: 400,
  personName: 80,
  personRole: 80,
  statValue: 16,
  statLabel: 60,
  metaTitle: 60,
  metaDescription: 160,
  altText: 200,
} as const;

const line = (max: number) => z.string().trim().min(1).max(max);
const optionalLine = (max: number) => z.string().trim().max(max).optional();

// ---------------------------------------------------------------------------
// Referencias e links
// ---------------------------------------------------------------------------

/**
 * Referencia a um asset pelo id interno.
 *
 * Nunca um caminho de arquivo: aceitar caminho vindo do usuario ou do modelo
 * abriria path traversal e permitiria apontar para um arquivo de outro
 * projeto. A resolucao para URL acontece no renderer.
 */
export const assetRefSchema = z.object({
  assetId: z.string().length(26),
  alt: z.string().trim().max(TEXT_LIMITS.altText),
  /** Ponto de interesse, 0..1. Decide o recorte em telas estreitas. */
  focalX: z.number().min(0).max(1).default(0.5),
  focalY: z.number().min(0).max(1).default(0.5),
});
export type AssetRef = z.infer<typeof assetRefSchema>;

/**
 * Link de acao.
 *
 * `kind` existe para o renderer saber o que fazer sem adivinhar pelo formato:
 * `whatsapp` e montado a partir do telefone, `anchor` vira rolagem interna e
 * `external` ganha `rel="noopener noreferrer"`.
 */
export const actionLinkSchema = z.object({
  kind: z.enum(['whatsapp', 'tel', 'mailto', 'anchor', 'external', 'maps']),
  label: line(TEXT_LIMITS.ctaLabel),
  /** Ancora sem `#`, telefone em E.164 ou URL absoluta, conforme o `kind`. */
  target: z.string().trim().min(1).max(2048),
  /** Mensagem pre-preenchida do WhatsApp. Ignorada nos demais tipos. */
  prefilledMessage: z.string().trim().max(600).optional(),
});
export type ActionLink = z.infer<typeof actionLinkSchema>;

// ---------------------------------------------------------------------------
// Fatos do negocio
// ---------------------------------------------------------------------------

/**
 * De onde veio cada informacao.
 *
 * Isto governa o que pode ser AFIRMADO no site. `UNVERIFIED` nunca vira
 * afirmacao definitiva -- na melhor das hipoteses vira um aviso no editor.
 */
export const PROVENANCE = ['USER_CONFIRMED', 'CRM', 'GOOGLE', 'AI_INFERRED', 'UNVERIFIED'] as const;
export type Provenance = (typeof PROVENANCE)[number];

const factSchema = <T extends z.ZodTypeAny>(value: T) =>
  z.object({
    value,
    source: z.enum(PROVENANCE),
    confirmedAt: z.string().datetime().nullable().default(null),
  });

export const businessFactsSchema = z.object({
  name: line(160),
  /** Descricao factual, sem adjetivo de venda. A copy vem depois. */
  description: optionalLine(TEXT_LIMITS.paragraph),
  niche: optionalLine(120),
  city: optionalLine(120),
  state: optionalLine(80),
  serviceArea: optionalLine(200),
  services: z
    .array(
      z.object({
        name: line(TEXT_LIMITS.cardTitle),
        description: optionalLine(TEXT_LIMITS.cardBody),
      }),
    )
    .max(20)
    .default([]),
  differentials: z.array(line(TEXT_LIMITS.cardBody)).max(10).default([]),
  audience: optionalLine(TEXT_LIMITS.paragraph),
  phoneE164: factSchema(z.string().trim().max(24)).nullable().default(null),
  whatsappE164: factSchema(z.string().trim().max(24)).nullable().default(null),
  email: factSchema(z.string().trim().email().max(254)).nullable().default(null),
  address: factSchema(z.string().trim().max(255)).nullable().default(null),
  instagramUrl: factSchema(z.string().trim().url().max(2048)).nullable().default(null),
  websiteUrl: factSchema(z.string().trim().url().max(2048)).nullable().default(null),
  googleMapsUrl: factSchema(z.string().trim().url().max(2048)).nullable().default(null),
  /**
   * Credenciais e numeros so existem aqui se alguem os forneceu.
   *
   * Um CRN, "15 anos de experiencia" ou "500 clientes atendidos" inventado
   * pela IA e o erro mais caro que este modulo poderia cometer: expoe o
   * cliente e a agencia. Se nao esta nesta lista, nao vai para a pagina.
   */
  credentials: z.array(factSchema(line(160))).max(10).default([]),
  stats: z
    .array(
      factSchema(
        z.object({
          value: line(TEXT_LIMITS.statValue),
          label: line(TEXT_LIMITS.statLabel),
        }),
      ),
    )
    .max(6)
    .default([]),
  testimonials: z
    .array(
      factSchema(
        z.object({
          quote: line(TEXT_LIMITS.quote),
          author: line(TEXT_LIMITS.personName),
          role: optionalLine(TEXT_LIMITS.personRole),
        }),
      ),
    )
    .max(12)
    .default([]),
  openingHours: z.array(line(80)).max(7).default([]),
});
export type BusinessFacts = z.infer<typeof businessFactsSchema>;

// ---------------------------------------------------------------------------
// Direcao criativa
// ---------------------------------------------------------------------------

export const creativeDirectionSchema = z.object({
  positioning: line(400),
  audienceSummary: line(400),
  /** Objecoes que os FATOS permitem enfrentar. Nao e lista de medos genericos. */
  objections: z.array(line(200)).max(6).default([]),
  toneOfVoice: line(200),
  visualConcept: line(400),
  paletteRationale: line(300),
  typographyRationale: line(300),
  compositionRationale: line(300),
  photographyTreatment: optionalLine(300),
  narrative: line(600),
});
export type CreativeDirection = z.infer<typeof creativeDirectionSchema>;

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

/** Cor em hex de 6 digitos. Sem `rgb()`, sem nome CSS, sem gradiente aqui. */
const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor no formato #RRGGBB.');

/**
 * Tokens visuais do projeto.
 *
 * Fechado de proposito: nao existe campo de CSS livre. O que a IA pode mudar
 * sao estes valores, dentro destas faixas. Foi assim que o modulo consegue
 * variedade real sem executar codigo gerado.
 */
export const designTokensSchema = z.object({
  mode: z.enum(['LIGHT', 'DARK']),
  colors: z.object({
    background: hexColor,
    surface: hexColor,
    text: hexColor,
    muted: hexColor,
    primary: hexColor,
    /** Texto sobre `primary`. Par obrigatorio: o linter checa o contraste. */
    primaryForeground: hexColor,
    accent: hexColor,
    accentForeground: hexColor,
    border: hexColor,
  }),
  typography: z.object({
    /** Familias saem de uma allowlist licenciada e embutivel no ZIP. */
    headingFont: z.string().trim().min(1).max(60),
    bodyFont: z.string().trim().min(1).max(60),
    /** Escala fluida: o renderer monta o clamp() a partir destes extremos. */
    headingMinRem: z.number().min(1).max(4),
    headingMaxRem: z.number().min(1.5).max(8),
    bodyRem: z.number().min(0.875).max(1.375),
    headingWeight: z.number().int().min(300).max(900),
    lineHeightTight: z.number().min(0.9).max(1.4),
    lineHeightBody: z.number().min(1.3).max(2),
  }),
  spacing: z.object({
    sectionPaddingRem: z.number().min(2).max(12),
    containerMaxWidthPx: z.number().int().min(960).max(1600),
    gapRem: z.number().min(0.5).max(4),
  }),
  radii: z.object({
    sm: z.number().min(0).max(24),
    md: z.number().min(0).max(48),
    lg: z.number().min(0).max(64),
    pill: z.number().min(0).max(999),
  }),
  elevation: z.enum(['NONE', 'SOFT', 'MEDIUM']),
  borderWidth: z.number().min(0).max(4),
  iconStyle: z.enum(['LINE', 'SOLID', 'DUOTONE']),
  imageTreatment: z.enum(['NATURAL', 'SOFT_SHADOW', 'FRAMED', 'DUOTONE', 'ROUNDED']),
  buttonStyle: z.enum(['SOLID', 'GRADIENT', 'OUTLINE', 'SOFT']),
  density: z.enum(['AIRY', 'BALANCED', 'COMPACT']),
});
export type DesignTokens = z.infer<typeof designTokensSchema>;

// ---------------------------------------------------------------------------
// Movimento
// ---------------------------------------------------------------------------

/**
 * Presets de animacao.
 *
 * A lista e as especificacoes de cada preset moram em `site-motion.ts`, junto
 * do registry que o runtime consome. Reexportados aqui para o schema poder
 * valida-los sem que existam duas listas para divergir.
 */
export { MOTION_PRESETS, type MotionPresetId } from '@site-kit/interactions/motion';

export const motionConfigSchema = z.object({
  level: z.enum(MOTION_LEVELS),
  /** Respeitar `prefers-reduced-motion` nao e opcional. Fica travado em true. */
  respectReducedMotion: z.literal(true).default(true),
  useSmoothScroll: z.boolean().default(false),
});
export type MotionConfig = z.infer<typeof motionConfigSchema>;

// ---------------------------------------------------------------------------
// Secoes
// ---------------------------------------------------------------------------

export const SECTION_TYPES = [
  'hero',
  'about',
  'services',
  'benefits',
  'audience',
  'authority',
  'stats',
  'process',
  'gallery',
  'offer',
  'testimonials',
  'faq',
  'cta',
  'contactMap',
  'whatsappForm',
  'footer',
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

/** Campos comuns a toda secao. `variant` e validado contra o registry. */
const baseSectionFields = {
  id: z.string().min(1).max(40),
  variant: z.string().trim().min(1).max(60),
  visible: z.boolean().default(true),
  anchor: z.string().trim().max(40).optional(),
  motionPreset: z.enum(MOTION_PRESETS).default('fade-up-soft'),
  /** Overrides tipados e limitados. Nao existe `style` livre. */
  style: z
    .object({
      background: z.enum(['DEFAULT', 'SURFACE', 'PRIMARY', 'ACCENT_SOFT']).optional(),
      paddingScale: z.number().min(0.5).max(2).optional(),
    })
    .optional(),
};

const listItem = z.object({
  title: line(TEXT_LIMITS.cardTitle),
  body: optionalLine(TEXT_LIMITS.cardBody),
  /** Icone da allowlist do renderer; um nome desconhecido vira nenhum icone. */
  icon: z.string().trim().max(40).optional(),
  image: assetRefSchema.optional(),
});

export const heroSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('hero'),
  eyebrow: optionalLine(TEXT_LIMITS.eyebrow),
  headline: line(TEXT_LIMITS.headline),
  subheadline: optionalLine(TEXT_LIMITS.subheadline),
  primaryCta: actionLinkSchema,
  secondaryCta: actionLinkSchema.optional(),
  image: assetRefSchema.optional(),
  /** So aparece se `business.stats` tiver fatos confirmados. */
  highlights: z.array(line(TEXT_LIMITS.statLabel)).max(4).default([]),
});

export const aboutSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('about'),
  /** Titulo contextual, nao "Sobre nos". O linter de copy reclama do generico. */
  headline: line(TEXT_LIMITS.headline),
  body: z.array(line(TEXT_LIMITS.paragraph)).min(1).max(4),
  image: assetRefSchema.optional(),
  cta: actionLinkSchema.optional(),
});

export const servicesSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('services'),
  headline: line(TEXT_LIMITS.headline),
  subheadline: optionalLine(TEXT_LIMITS.subheadline),
  items: z.array(listItem).min(1).max(12),
  cta: actionLinkSchema.optional(),
});

export const benefitsSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('benefits'),
  headline: line(TEXT_LIMITS.headline),
  items: z.array(listItem).min(2).max(8),
});

export const audienceSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('audience'),
  headline: line(TEXT_LIMITS.headline),
  subheadline: optionalLine(TEXT_LIMITS.subheadline),
  items: z.array(listItem).min(2).max(8),
});

export const authoritySectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('authority'),
  headline: line(TEXT_LIMITS.headline),
  body: optionalLine(TEXT_LIMITS.paragraph),
  personName: optionalLine(TEXT_LIMITS.personName),
  personRole: optionalLine(TEXT_LIMITS.personRole),
  image: assetRefSchema.optional(),
  /** Espelha `business.credentials`; o linter recusa o que nao esta la. */
  credentials: z.array(line(160)).max(8).default([]),
});

export const statsSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('stats'),
  headline: optionalLine(TEXT_LIMITS.headline),
  items: z
    .array(z.object({ value: line(TEXT_LIMITS.statValue), label: line(TEXT_LIMITS.statLabel) }))
    .min(2)
    .max(6),
});

export const processSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('process'),
  headline: line(TEXT_LIMITS.headline),
  subheadline: optionalLine(TEXT_LIMITS.subheadline),
  steps: z.array(listItem).min(2).max(8),
  cta: actionLinkSchema.optional(),
});

export const gallerySectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('gallery'),
  headline: optionalLine(TEXT_LIMITS.headline),
  images: z.array(assetRefSchema).min(2).max(12),
});

export const offerSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('offer'),
  headline: line(TEXT_LIMITS.headline),
  body: optionalLine(TEXT_LIMITS.paragraph),
  /**
   * Preco e opcional e so existe se foi FORNECIDO.
   *
   * Inventar valor, desconto ou prazo cria uma obrigacao comercial para o
   * cliente que nem sabe que o site existe.
   */
  price: optionalLine(40),
  priceNote: optionalLine(TEXT_LIMITS.cardBody),
  bullets: z.array(line(TEXT_LIMITS.cardBody)).max(8).default([]),
  cta: actionLinkSchema,
});

export const testimonialsSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('testimonials'),
  headline: line(TEXT_LIMITS.headline),
  items: z
    .array(
      z.object({
        quote: line(TEXT_LIMITS.quote),
        author: line(TEXT_LIMITS.personName),
        role: optionalLine(TEXT_LIMITS.personRole),
        image: assetRefSchema.optional(),
      }),
    )
    .min(1)
    .max(12),
});

export const faqSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('faq'),
  headline: line(TEXT_LIMITS.headline),
  items: z
    .array(z.object({ question: line(TEXT_LIMITS.question), answer: line(TEXT_LIMITS.answer) }))
    .min(2)
    .max(12),
});

export const ctaSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('cta'),
  headline: line(TEXT_LIMITS.headline),
  body: optionalLine(TEXT_LIMITS.paragraph),
  primaryCta: actionLinkSchema,
  secondaryCta: actionLinkSchema.optional(),
});

export const contactMapSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('contactMap'),
  headline: line(TEXT_LIMITS.headline),
  address: optionalLine(255),
  /** Link oficial do Maps. O iframe exige chave e fica desligado por padrao. */
  mapsUrl: z.string().trim().url().max(2048).optional(),
  showEmbeddedMap: z.boolean().default(false),
  contacts: z.array(actionLinkSchema).max(6).default([]),
  openingHours: z.array(line(80)).max(7).default([]),
});

export const whatsappFormSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('whatsappForm'),
  headline: line(TEXT_LIMITS.headline),
  body: optionalLine(TEXT_LIMITS.paragraph),
  /**
   * O formulario NAO envia nada e nao guarda lead: ele monta a mensagem e abre
   * o WhatsApp. E por isso que o ZIP funciona sem backend.
   */
  fields: z
    .array(
      z.object({
        name: z.string().trim().regex(/^[a-z][a-z0-9_]{0,29}$/),
        label: line(TEXT_LIMITS.navLabel),
        type: z.enum(['text', 'tel', 'email', 'textarea', 'select']),
        required: z.boolean().default(false),
        options: z.array(line(60)).max(12).default([]),
      }),
    )
    .min(1)
    .max(8),
  submitLabel: line(TEXT_LIMITS.ctaLabel),
  whatsappE164: z.string().trim().max(24),
});

export const footerSectionSchema = z.object({
  ...baseSectionFields,
  type: z.literal('footer'),
  businessName: line(160),
  tagline: optionalLine(TEXT_LIMITS.subheadline),
  links: z.array(actionLinkSchema).max(10).default([]),
  socialLinks: z.array(actionLinkSchema).max(6).default([]),
  legalNote: optionalLine(300),
  /** Credito da agencia. Padrao desligado: o site deve parecer do cliente. */
  showAgencyCredit: z.boolean().default(false),
});

/**
 * Uniao discriminada das secoes.
 *
 * Discriminada por `type` de proposito: sem isso o Zod tentaria cada variante
 * e devolveria um erro ilegivel, e o TypeScript nao estreitaria o tipo dentro
 * do renderer.
 */
export const siteSectionSchema = z.discriminatedUnion('type', [
  heroSectionSchema,
  aboutSectionSchema,
  servicesSectionSchema,
  benefitsSectionSchema,
  audienceSectionSchema,
  authoritySectionSchema,
  statsSectionSchema,
  processSectionSchema,
  gallerySectionSchema,
  offerSectionSchema,
  testimonialsSectionSchema,
  faqSectionSchema,
  ctaSectionSchema,
  contactMapSectionSchema,
  whatsappFormSectionSchema,
  footerSectionSchema,
]);
export type SiteSection = z.infer<typeof siteSectionSchema>;

// ---------------------------------------------------------------------------
// SEO e navegacao
// ---------------------------------------------------------------------------

export const seoConfigSchema = z.object({
  title: line(TEXT_LIMITS.metaTitle),
  description: line(TEXT_LIMITS.metaDescription),
  /**
   * Canonical so existe quando o dominio final e conhecido.
   *
   * Canonical apontando para a origem de demonstracao diria ao buscador que
   * AQUELE e o endereco oficial do negocio.
   */
  canonicalUrl: z.string().trim().url().max(2048).nullable().default(null),
  ogImage: assetRefSchema.nullable().default(null),
  /** Perfil de demonstracao usa noindex; o ZIP de producao decide separado. */
  noindex: z.boolean().default(true),
  jsonLdType: z.enum(['LocalBusiness', 'ProfessionalService', 'Person', 'Organization']),
});

/**
 * Variantes de cabecalho.
 *
 * Ficam na configuracao de navegacao, e nao em `sections`, porque o cabecalho
 * nao e uma secao da pagina: ele nao entra na ordem de leitura, nao recebe
 * ancora e nao pode ser reordenado nem ocultado como as demais.
 */
export const HEADER_VARIANTS = [
  'inline-right',
  'centered-split',
  'minimal-cta',
  'stacked-bar',
  'transparent-overlay',
] as const;
export type HeaderVariant = (typeof HEADER_VARIANTS)[number];

export const navigationConfigSchema = z.object({
  showMenu: z.boolean().default(true),
  headerVariant: z.enum(HEADER_VARIANTS).default('inline-right'),
  items: z
    .array(z.object({ label: line(TEXT_LIMITS.navLabel), anchor: z.string().trim().max(40) }))
    .max(8)
    .default([]),
  logo: assetRefSchema.nullable().default(null),
  /** Sem logo, o nome vira a marca. Nunca deixa o cabecalho vazio. */
  wordmark: optionalLine(60),
  headerCta: actionLinkSchema.nullable().default(null),
  stickyHeader: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// SiteSchema
// ---------------------------------------------------------------------------

export const visualTextEditSchema = z.object({
  key: z.string().trim().min(1).max(96),
  fontSizePx: z.number().int().min(10).max(120).optional(),
  fontFamily: z.enum(['Inter', 'Poppins', 'Montserrat', 'Georgia']).optional(),
  color: hexColor.optional(),
  fontWeight: z.enum(['400', '500', '600', '700', '800', '900']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
});

export const siteSchema = z.object({
  schemaVersion: z.string().max(16),
  rendererVersion: z.string().max(16),
  project: z.object({
    siteType: z.enum(SITE_TYPES),
    language: z.literal('pt-BR').default('pt-BR'),
    creativeSeed: z.string().max(32),
    promptVersion: z.string().max(16),
  }),
  business: businessFactsSchema,
  objective: z.object({
    goal: z.enum([
      'WHATSAPP_CONVERSATIONS',
      'QUOTE_REQUESTS',
      'APPOINTMENTS',
      'AUTHORITY',
      'OFFER_INTEREST',
      'CUSTOM',
    ]),
    customGoal: optionalLine(200),
    primaryCta: actionLinkSchema,
  }),
  creativeDirection: creativeDirectionSchema,
  theme: designTokensSchema,
  navigation: navigationConfigSchema,
  /** Ordem do array e a ordem da pagina. Reordenar no editor mexe aqui. */
  sections: z.array(siteSectionSchema).min(2).max(24),
  motion: motionConfigSchema,
  seo: seoConfigSchema,
  /**
   * GEO: fundamentos verificaveis para respostas generativas.
   *
   * Nao existe meta tag magica. O que ajuda e entidade clara, resposta direta
   * e dado estruturado coerente com o texto VISIVEL -- nunca conteudo oculto.
   */
  geo: z.object({
    entityName: line(160),
    entitySummary: line(400),
    servicesSummary: z.array(line(200)).max(12).default([]),
    locationSummary: optionalLine(200),
  }),
  /** Ajustes visuais feitos diretamente no preview. Chaves apontam para
   * elementos editaveis deterministicos gerados pelo renderer. */
  visualTextEdits: z.array(visualTextEditSchema).max(300).default([]),
  integrations: z.object({
    whatsappE164: z.string().trim().max(24).nullable().default(null),
    mapsPlaceId: z.string().trim().max(255).nullable().default(null),
    /** Nenhum tracker por padrao. Cookie exige decisao consciente. */
    analytics: z.literal('NONE').default('NONE'),
  }),
});
export type SiteSchemaModel = z.infer<typeof siteSchema>;

/**
 * Migracao entre versoes de schema.
 *
 * Existe desde a versao 1 de proposito: sem um ponto de entrada explicito, a
 * primeira mudanca de formato viraria uma mutacao silenciosa de projetos
 * antigos, e um site publicado deixaria de renderizar sem aviso.
 */
export function migrateSiteSchema(raw: unknown): { model: SiteSchemaModel; migrated: boolean } {
  const version =
    typeof raw === 'object' && raw !== null && 'schemaVersion' in raw
      ? String((raw as { schemaVersion?: unknown }).schemaVersion)
      : '';

  if (version !== SITE_SCHEMA_VERSION) {
    throw new Error(
      `Versao de schema desconhecida: "${version || 'ausente'}". ` +
        `Esta aplicacao entende a versao ${SITE_SCHEMA_VERSION}.`,
    );
  }

  return { model: siteSchema.parse(raw), migrated: false };
}
