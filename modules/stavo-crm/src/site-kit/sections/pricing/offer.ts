/**
 * Familias de conteudo e prova: sobre, autoridade, depoimentos, FAQ, oferta.
 *
 * Duas destas familias carregam o maior risco factual do modulo. Autoridade
 * exibe credencial; depoimento exibe fala de terceiro. O renderer nao valida
 * nada disso -- quem bloqueia e o linter, antes de a publicacao acontecer.
 * Aqui a responsabilidade e desenhar sem inventar campo que o schema nao tem.
 */
import {
  escapeHtml,
  paragraphs,
  renderActions,
  renderIcon,
  renderTextLink,
  sectionAttrs,
  sectionHeading,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type OfferSection = Extract<SiteSection, { type: 'offer' }>;

// ---------------------------------------------------------------------------
// Sobre (5 variantes)
import { shell } from '@site-kit/primitives/section-shell';

// ---------------------------------------------------------------------------

export function renderOffer(section: OfferSection, ctx: RenderContext): string {
  const body = section.body ? paragraphs(section.body) : '';

  // Preco so aparece quando existe no schema, e o linter avisa quando existe.
  // Nunca ha "de/por", contador ou selo de escassez: urgencia falsa esta
  // proibida na especificacao e destrÃ³i a confianca que o site deveria criar.
  const price = section.price
    ? `<p class="price">${escapeHtml(section.price)}</p>` +
      `${section.priceNote ? `<p class="muted price-note">${escapeHtml(section.priceNote)}</p>` : ''}`
    : '';

  const bullets = section.bullets.length
    ? `<ul class="checklist checklist--tight">${section.bullets
        .map((item) => `<li>${renderIcon('check')}<div><span>${escapeHtml(item)}</span></div></li>`)
        .join('')}</ul>`
    : '';

  const cta = renderActions([section.cta]);
  const heading = sectionHeading({ headline: section.headline, centered: true });

  switch (section.variant) {
    /** Cartao unico centralizado: a oferta e o unico foco da secao. */
    case 'single-card':
      return shell(
        section,
        'offer offer--single',
        `<div class="card offer-card">${sectionHeading({ headline: section.headline })}` +
          `${body}${price}${bullets}${cta}</div>`,
      );

    /** Texto a esquerda, cartao de preco a direita: comparacao lado a lado. */
    case 'split-price':
      return shell(
        section,
        'offer offer--split',
        `<div class="hero-split"><div>${sectionHeading({ headline: section.headline })}${body}${bullets}</div>` +
          `<div class="card offer-card offer-card--price">${price}${cta}</div></div>`,
      );

    /** Faixa horizontal de destaque: chamada de oferta em landing page. */
    case 'highlight-band':
      return `<section${sectionAttrs(section, 'offer offer--band section--accent-soft')}>` +
        `<div class="container">${heading}${body}${price}${bullets}${cta}</div></section>`;

    /** Lista de inclusos com o preco abaixo: para servico com escopo definido. */
    case 'inclusions-list':
      return shell(
        section,
        'offer offer--inclusions',
        `${heading}<div class="prose prose--centered">${body}</div>` +
          `<div class="card">${bullets}${price}${cta}</div>`,
      );

    default:
      return renderOffer({ ...section, variant: 'single-card' }, ctx);
  }
}

/** Reexportado para o rodape montar links sem reimportar utilitarios. */
export { renderTextLink };
