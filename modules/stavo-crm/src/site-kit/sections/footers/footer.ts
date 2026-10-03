/**
 * Moldura e conversao: cabecalho, CTA, contato, formulario e rodape.
 *
 * O cabecalho e o rodape sao as duas pecas que aparecem em TODA pagina, entao
 * um erro aqui aparece o tempo inteiro. O formulario e a peca que precisa
 * funcionar sem backend nenhum -- e o que permite o ZIP ser entregue.
 */
import {
  escapeHtml,
  paragraphs,
  renderTextLink,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type FooterSection = Extract<SiteSection, { type: 'footer' }>;

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

// ---------------------------------------------------------------------------

export function renderFooter(section: FooterSection, ctx: RenderContext): string {
  void ctx;

  const id = escapeHtml(section.anchor ?? 'rodape');
  const name = `<p class="footer-name"><strong>${escapeHtml(section.businessName)}</strong></p>`;
  const tagline = section.tagline ? `<p class="muted">${escapeHtml(section.tagline)}</p>` : '';
  const legal = section.legalNote ? `<p class="muted small">${escapeHtml(section.legalNote)}</p>` : '';

  const list = (links: typeof section.links, klass: string): string =>
    links.length
      ? `<ul class="${klass}">${links.map((link) => `<li>${renderTextLink(link)}</li>`).join('')}</ul>`
      : '';

  // O credito da agencia so aparece se o administrador pedir. O padrao e nao
  // exibir: o site precisa parecer do cliente, nao um portfolio da agencia.
  const credit = section.showAgencyCredit
    ? `<p class="muted small">Site desenvolvido por Stavo Digital</p>`
    : '';

  const year = `<p class="muted small">&copy; ${new Date().getUTCFullYear()} ${escapeHtml(section.businessName)}</p>`;

  switch (section.variant) {
    /** Centralizado e enxuto: o padrao para one-page. */
    case 'simple-centered':
      return `<footer id="${id}" class="site-footer site-footer--centered"><div class="container">
${name}${tagline}${list([...section.links, ...section.socialLinks], 'links')}${legal}${year}${credit}
</div></footer>`;

    /** Tres colunas: marca, navegacao e redes separadas. */
    case 'three-column':
      return `<footer id="${id}" class="site-footer site-footer--columns"><div class="container">
<div class="footer-grid">
<div>${name}${tagline}</div>
<div><h3 class="footer-title">Navegue</h3>${list(section.links, 'footer-links')}</div>
<div><h3 class="footer-title">Onde encontrar</h3>${list(section.socialLinks, 'footer-links')}</div>
</div>${legal}${year}${credit}
</div></footer>`;

    /** Marca a esquerda, links a direita, tudo em uma faixa. */
    case 'inline-bar':
      return `<footer id="${id}" class="site-footer site-footer--bar"><div class="container">
<div class="footer-bar">${name}${list([...section.links, ...section.socialLinks], 'links')}</div>
${legal}${year}${credit}
</div></footer>`;

    /** Rodape com fundo de destaque: fecha a pagina com peso visual. */
    case 'contrast-block':
      return `<footer id="${id}" class="site-footer site-footer--contrast section--primary"><div class="container">
${name}${tagline}${list([...section.links, ...section.socialLinks], 'links')}${legal}${year}${credit}
</div></footer>`;

    /** So o essencial legal: nome, aviso e ano. Para landing page. */
    case 'legal-only':
      return `<footer id="${id}" class="site-footer site-footer--legal"><div class="container">
${name}${legal}${year}${credit}
</div></footer>`;

    default:
      return renderFooter({ ...section, variant: 'simple-centered' }, ctx);
  }
}

/** Reexporta o helper de paragrafo para as familias que o consomem daqui. */
export { paragraphs };
