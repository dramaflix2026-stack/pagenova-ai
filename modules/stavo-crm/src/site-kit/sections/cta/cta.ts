/**
 * Moldura e conversao: cabecalho, CTA, contato, formulario e rodape.
 *
 * O cabecalho e o rodape sao as duas pecas que aparecem em TODA pagina, entao
 * um erro aqui aparece o tempo inteiro. O formulario e a peca que precisa
 * funcionar sem backend nenhum -- e o que permite o ZIP ser entregue.
 */
import {
  escapeHtml,
  renderActions,
  renderButton,
  sectionAttrs,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type CtaSection = Extract<SiteSection, { type: 'cta' }>;

// ---------------------------------------------------------------------------
// Cabecalho (5 variantes)
// ---------------------------------------------------------------------------

/**
 * Cabecalho do site.
 *
 * Invariantes que valem para as cinco variantes, independentemente do desenho:
 *  - o botao do menu controla o mesmo `#menu-principal` e informa `aria-expanded`;
 *  - o alvo de toque tem 48px;
 *  - sem JavaScript o menu continua sendo uma lista de ancoras utilizavel.
 */
import { shell } from '@site-kit/primitives/section-shell';

// ---------------------------------------------------------------------------

export function renderCta(section: CtaSection, ctx: RenderContext): string {
  const actions = renderActions([section.primaryCta, section.secondaryCta]);
  const body = section.body ? `<p class="lead">${escapeHtml(section.body)}</p>` : '';

  switch (section.variant) {
    /** Faixa centralizada com fundo de destaque: o fechamento classico. */
    case 'centered-band':
      return `<section${sectionAttrs(section, 'cta cta--band section--primary')}>` +
        `<div class="container hero-centered">` +
        `<h2>${escapeHtml(section.headline)}</h2>${body}${actions}</div></section>`;

    /** Titulo a esquerda e botao a direita, na mesma linha. Compacto. */
    case 'inline-split':
      return shell(
        section,
        'cta cta--inline',
        `<div class="cta-inline"><div><h2>${escapeHtml(section.headline)}</h2>${body}</div>${actions}</div>`,
      );

    /** Cartao elevado sobre a pagina: separa o convite do conteudo. */
    case 'raised-card':
      return shell(
        section,
        'cta cta--card',
        `<div class="card cta-card"><h2>${escapeHtml(section.headline)}</h2>${body}${actions}</div>`,
      );

    /** Discreto, so uma linha e um link: para nao saturar a pagina de CTAs. */
    case 'quiet-line':
      return shell(
        section,
        'cta cta--quiet',
        `<div class="cta-quiet"><h2>${escapeHtml(section.headline)}</h2>${body}${actions}</div>`,
      );

    /**
     * Barra fixa no rodape da janela no celular.
     *
     * `position:fixed` so no celular e com espaco reservado no corpo, para a
     * barra nunca cobrir o ultimo paragrafo da pagina.
     */
    case 'sticky-mobile-bar':
      return shell(
        section,
        'cta cta--sticky',
        `<div class="hero-centered"><h2>${escapeHtml(section.headline)}</h2>${body}${actions}</div>` +
          `<div class="sticky-bar" data-sticky-cta>${renderButton(section.primaryCta, 'primary')}</div>`,
      );

    default:
      return renderCta({ ...section, variant: 'centered-band' }, ctx);
  }
}

// ---------------------------------------------------------------------------
// Contato e mapa (4 variantes)
