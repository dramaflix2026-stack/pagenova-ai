/**
 * SitePlan: o que a IA tem permissao de autorar.
 *
 * Este e o arquivo mais importante da orquestracao de IA. Ele define um
 * subconjunto do SiteSchema completo, removendo de proposito todo campo que
 * poderia virar um fato inventado:
 *
 *  - nenhuma secao aceita `image`/`images`: asset e escolhido no pipeline de
 *    assets (etapa A10), nunca pela IA;
 *  - `testimonials.items`, `stats.items` e `authority.credentials` NAO
 *    existem aqui -- o assembler os preenche a partir de `business`
 *    confirmado. Se a IA pudesse escrever um depoimento, a plataforma estaria
 *    a uma alucinacao de distancia de publicar uma fala que ninguem disse;
 *  - `offer.price`/`priceNote` NAO existem aqui: preco nunca e inventado;
 *  - `contactMap` e `whatsappForm` perdem endereco, mapa, telefone e contatos:
 *    o assembler monta tudo isso a partir dos fatos confirmados;
 *  - `footer.businessName`, `legalNote` e `showAgencyCredit` sao fixados pelo
 *    assembler, nunca pela IA.
 *
 * O que sobra e precisamente o que E seguro deixar a IA decidir: direcao
 * criativa, tokens de design dentro das faixas do schema, escolha de variante,
 * copy livre de fato sensivel, e a ordem/composicao das secoes.
 *
 * O SERVIDOR valida a saida com este schema (`sitePlanSchema.parse`) antes de
 * qualquer outra coisa acontecer. Uma resposta que nao bate aqui nunca chega
 * ao assembler.
 */
import { z } from 'zod';

import {
  actionLinkSchema,
  aboutSectionSchema,
  benefitsSectionSchema,
  contactMapSectionSchema,
  creativeDirectionSchema,
  ctaSectionSchema,
  designTokensSchema,
  faqSectionSchema,
  footerSectionSchema,
  gallerySectionSchema,
  audienceSectionSchema,
  authoritySectionSchema,
  heroSectionSchema,
  motionConfigSchema,
  navigationConfigSchema,
  offerSectionSchema,
  processSectionSchema,
  servicesSectionSchema,
  statsSectionSchema,
  testimonialsSectionSchema,
  whatsappFormSectionSchema,
} from '@site-kit/schemas/site-schema';

/**
 * Remove os campos de asset e de fato sensivel de um schema de secao.
 *
 * `.omit()` do Zod: cada seção passa apenas as chaves que quer tirar. `id` sai
 * de todas -- quem atribui o id estavel e o assembler, nunca a IA.
 */
const planHero = heroSectionSchema.omit({ id: true, image: true, highlights: true });
const planAbout = aboutSectionSchema.omit({ id: true, image: true });
const planServices = servicesSectionSchema.omit({ id: true }).extend({
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(80),
        body: z.string().trim().max(300).optional(),
        icon: z.string().trim().max(40).optional(),
      }),
    )
    .min(1)
    .max(12),
});
const planBenefits = benefitsSectionSchema.omit({ id: true }).extend({
  items: planServices.shape.items,
});
const planAudience = audienceSectionSchema.omit({ id: true }).extend({
  items: planServices.shape.items,
});
// personName sai: o assembler sempre usa o nome do negocio confirmado.
const planAuthority = authoritySectionSchema.omit({
  id: true,
  image: true,
  credentials: true,
  personName: true,
});
const planStats = statsSectionSchema.omit({ id: true, items: true });
const planProcess = processSectionSchema.omit({ id: true }).extend({
  steps: planServices.shape.items,
});
const planGallery = gallerySectionSchema.omit({ id: true, images: true });
const planOffer = offerSectionSchema.omit({ id: true, price: true, priceNote: true });
const planTestimonials = testimonialsSectionSchema.omit({ id: true, items: true });
const planFaq = faqSectionSchema.omit({ id: true });
const planCta = ctaSectionSchema.omit({ id: true });
const planContact = contactMapSectionSchema.omit({
  id: true,
  address: true,
  mapsUrl: true,
  showEmbeddedMap: true,
  contacts: true,
  openingHours: true,
});
const planWhatsappForm = whatsappFormSectionSchema.omit({ id: true, whatsappE164: true });
const planFooter = footerSectionSchema.omit({
  id: true,
  businessName: true,
  links: true,
  socialLinks: true,
  legalNote: true,
  showAgencyCredit: true,
});

export const planSectionSchema = z.discriminatedUnion('type', [
  planHero,
  planAbout,
  planServices,
  planBenefits,
  planAudience,
  planAuthority,
  planStats,
  planProcess,
  planGallery,
  planOffer,
  planTestimonials,
  planFaq,
  planCta,
  planContact,
  planWhatsappForm,
  planFooter,
]);
export type PlanSection = z.infer<typeof planSectionSchema>;

/**
 * Saida completa esperada de `generateSitePlan`.
 *
 * `businessSummary` e o entendimento da IA sobre o negocio -- serve para o
 * editor mostrar "foi assim que a IA leu seu briefing", nunca para substituir
 * `business` confirmado.
 */
export const sitePlanSchema = z.object({
  businessSummary: z.string().trim().min(10).max(600),
  creativeDirection: creativeDirectionSchema,
  theme: designTokensSchema,
  /**
   * `items` NAO existe aqui de proposito.
   *
   * O menu e montado pelo assembler a partir das secoes REALMENTE presentes na
   * pagina, na ordem em que elas aparecem. Deixar a IA propor ancoras
   * abriria a porta para um item de menu que nao leva a lugar nenhum -- o
   * mesmo erro que o linter bloqueia como `STRUCTURE_MENU_DEAD_LINK`.
   */
  navigation: navigationConfigSchema.omit({ logo: true, headerCta: true, items: true }).extend({
    /** Rotulo do CTA do cabecalho; o link e sempre WhatsApp, montado pelo assembler. */
    headerCtaLabel: z.string().trim().max(40).optional(),
  }),
  objective: z.object({
    goal: z.enum([
      'WHATSAPP_CONVERSATIONS',
      'QUOTE_REQUESTS',
      'APPOINTMENTS',
      'AUTHORITY',
      'OFFER_INTEREST',
      'CUSTOM',
    ]),
    customGoal: z.string().trim().max(200).optional(),
    /** Texto do CTA principal; o link/numero e sempre montado pelo assembler. */
    primaryCtaLabel: z.string().trim().min(1).max(40),
    primaryCtaMessage: z.string().trim().max(600).optional(),
  }),
  motion: motionConfigSchema,
  sections: z.array(planSectionSchema).min(2).max(24),
  seo: z.object({
    title: z.string().trim().min(15).max(60),
    description: z.string().trim().min(50).max(160),
    jsonLdType: z.enum(['LocalBusiness', 'ProfessionalService', 'Person', 'Organization']),
  }),
  geo: z.object({
    entitySummary: z.string().trim().min(20).max(400),
    servicesSummary: z.array(z.string().trim().max(200)).max(12).default([]),
  }),
  /** Avisos que a IA quer levantar sobre dados ausentes -- nunca preenchidos por ela. */
  missingDataWarnings: z.array(z.string().trim().max(300)).max(10).default([]),
});
export type SitePlanOutput = z.infer<typeof sitePlanSchema>;

/** Type helper para checar em runtime se um link ainda nao tem o alvo resolvido. */
export const PLACEHOLDER_TARGET = '__RESOLVE_FROM_BUSINESS__';

export type { z };
export { actionLinkSchema };
