/**
 * Casca padrao de uma secao: <section> + container central.
 *
 * Vivia duplicada em tres arquivos de secao (content, lists, chrome). Com a
 * divisao por familia, seriam treze copias -- e treze lugares para divergir.
 */
import { sectionAttrs } from './render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

export const shell = (section: SiteSection, variantClass: string, inner: string): string =>
  `<section${sectionAttrs(section, variantClass)}><div class="container">${inner}</div></section>`;

/** Item de lista renderizavel (servicos, beneficios, publico, processo). */
export interface SectionItem {
  title: string;
  body?: string;
  icon?: string;
  image?: { assetId: string; alt: string; focalX: number; focalY: number };
}
