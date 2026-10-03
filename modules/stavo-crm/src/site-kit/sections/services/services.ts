/**
 * Familias de lista: servicos, beneficios, publico, processo, numeros, galeria.
 *
 * Todas partem de uma colecao de itens, e e justamente por isso que a
 * diferenca entre variantes precisa ser estrutural: cartao, linha, acordeao,
 * tabela e passo numerado nao sao a mesma coisa com CSS diferente -- mudam o
 * que o visitante consegue comparar de relance.
 */
import {
  escapeHtml,
  paragraphs,
  renderActions,
  renderIcon,
  renderImage,
  sectionHeading,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type ServicesSection = Extract<SiteSection, { type: 'services' }>;

interface Item {
  title: string;
  body?: string;
  icon?: string;
  image?: { assetId: string; alt: string; focalX: number; focalY: number };
}

// ---------------------------------------------------------------------------
// Servicos (6 variantes)
import { shell } from '@site-kit/primitives/section-shell';

// ---------------------------------------------------------------------------

export function renderServices(section: ServicesSection, ctx: RenderContext): string {
  const heading = sectionHeading({
    headline: section.headline,
    subheadline: section.subheadline,
    centered: section.variant === 'cards-3col' || section.variant === 'tiles-alternating',
  });
  const cta = section.cta ? renderActions([section.cta]) : '';
  const items = section.items as Item[];

  switch (section.variant) {
    /** Grade de cartoes: comparacao rapida entre servicos equivalentes. */
    case 'cards-3col':
      return shell(
        section,
        'services services--cards',
        `${heading}<div class="grid grid-3" data-animate-stagger>${items
          .map(
            (item) =>
              `<article class="card">${renderIcon(item.icon)}` +
              `<h3>${escapeHtml(item.title)}</h3>` +
              `${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}</article>`,
          )
          .join('')}</div>${cta}`,
      );

    /** Lista vertical larga: poucos servicos, cada um com espaco para explicar. */
    case 'list-detailed':
      return shell(
        section,
        'services services--list',
        `${heading}<div class="detail-list" data-animate-stagger>${items
          .map(
            (item) =>
              `<article class="detail-row"><div class="detail-row__mark">${renderIcon(item.icon) || '<span class="dot"></span>'}</div>` +
              `<div><h3>${escapeHtml(item.title)}</h3>` +
              `${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}</div></article>`,
          )
          .join('')}</div>${cta}`,
      );

    /** Blocos alternando lado da imagem: para servicos que precisam de foto. */
    case 'tiles-alternating':
      return shell(
        section,
        'services services--alternating',
        `${heading}${items
          .map(
            (item, index) =>
              `<div class="alt-row${index % 2 ? ' alt-row--flip' : ''}">` +
              `<div class="alt-row__media">${renderImage(item.image, ctx)}</div>` +
              `<div class="alt-row__text"><h3>${escapeHtml(item.title)}</h3>` +
              `${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}</div></div>`,
          )
          .join('')}${cta}`,
      );

    /**
     * Acordeao: muitos servicos sem transformar a pagina em rolagem infinita.
     * `<details>` nativo, entao abre e fecha sem JavaScript.
     */
    case 'accordion-compact':
      return shell(
        section,
        'services services--accordion',
        `${heading}<div class="faq">${items
          .map(
            (item) =>
              `<details class="faq-item"><summary>${escapeHtml(item.title)}</summary>` +
              `<div class="answer">${item.body ? paragraphs(item.body) : ''}</div></details>`,
          )
          .join('')}</div>${cta}`,
      );

    /** Numerado em duas colunas: sugere um portfolio ordenado, nao um menu. */
    case 'numbered-columns':
      return shell(
        section,
        'services services--numbered',
        `${heading}<ol class="numbered-grid" data-animate-stagger>${items
          .map(
            (item) =>
              `<li><h3>${escapeHtml(item.title)}</h3>` +
              `${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}</li>`,
          )
          .join('')}</ol>${cta}`,
      );

    /** Faixa horizontal rolavel: bom no celular quando ha muitos itens curtos. */
    case 'scroll-rail':
      return shell(
        section,
        'services services--rail',
        `${heading}<div class="rail" role="list">${items
          .map(
            (item) =>
              `<article class="rail__item" role="listitem">${renderIcon(item.icon)}` +
              `<h3>${escapeHtml(item.title)}</h3>` +
              `${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}</article>`,
          )
          .join('')}</div>${cta}`,
      );

    default:
      return renderServices({ ...section, variant: 'cards-3col' }, ctx);
  }
}

// ---------------------------------------------------------------------------
// Beneficios (5 variantes)
