/**
 * Ponte entre as CATEGORIAS do catalogo novo e os TIPOS DE SECAO que o schema
 * atual usa.
 *
 * As duas listas nao sao iguais de proposito: o schema tem 16 tipos, porque
 * separa o que precisa de campos diferentes (`testimonials` e `stats` guardam
 * dados distintos); o catalogo tem 13 categorias, porque agrupa o que o
 * visitante percebe como a mesma parte da pagina (os dois sao "prova").
 *
 * Enquanto o fluxo de geracao continua falando em `SectionType`, e este mapa
 * que permite consultar o catalogo por categoria sem mudar nada do que ja
 * funciona.
 */
import type { SectionType } from '@site-kit/schemas/site-schema';
import type { ComponentCategory } from './component';

/** Categoria de cada tipo de secao existente. */
export const CATEGORY_BY_SECTION_TYPE: Record<SectionType, ComponentCategory> = {
  hero: 'hero',
  about: 'about',
  authority: 'about',
  services: 'services',
  benefits: 'benefits',
  audience: 'benefits',
  testimonials: 'proof',
  stats: 'proof',
  gallery: 'gallery',
  process: 'process',
  offer: 'pricing',
  faq: 'faq',
  contactMap: 'form',
  whatsappForm: 'form',
  cta: 'cta',
  footer: 'footer',
};

export const categoryOf = (sectionType: SectionType): ComponentCategory =>
  CATEGORY_BY_SECTION_TYPE[sectionType];

/**
 * Tipos de secao de uma categoria.
 *
 * `navigation` devolve lista vazia: o cabecalho existe no renderer e tem
 * variantes proprias (`HEADER_VARIANTS`), mas nao e uma secao da pagina --
 * nao entra na ordem de leitura nem recebe ancora.
 */
export function sectionTypesOf(category: ComponentCategory): SectionType[] {
  return (Object.keys(CATEGORY_BY_SECTION_TYPE) as SectionType[]).filter(
    (type) => CATEGORY_BY_SECTION_TYPE[type] === category,
  );
}
