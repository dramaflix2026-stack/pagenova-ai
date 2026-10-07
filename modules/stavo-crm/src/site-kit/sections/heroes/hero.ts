/**
 * Familia hero: a primeira tela.
 *
 * Oito variantes com COMPOSICAO diferente, nao com cor ou alinhamento
 * diferente. O criterio adotado: duas variantes so contam como distintas se
 * mudam a hierarquia visual, a ordem de leitura ou o papel da imagem. Trocar
 * `text-align` nao cria uma variante -- cria uma opcao de token.
 *
 * O H1 mora aqui e so aqui. Nenhuma outra familia emite `<h1>`.
 */
import {
  escapeHtml,
  renderActions,
  renderImage,
  sectionAttrs,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type HeroSection = Extract<SiteSection, { type: 'hero' }>;

/** Blocos de texto reaproveitados entre as variantes. */
function textBlock(section: HeroSection, options: { level?: 'h1' } = {}): string {
  void options;
  return (
    `${section.eyebrow ? `<p class="eyebrow">${escapeHtml(section.eyebrow)}</p>` : ''}` +
    `<h1>${escapeHtml(section.headline)}</h1>` +
    `${section.subheadline ? `<p class="lead">${escapeHtml(section.subheadline)}</p>` : ''}`
  );
}

const actions = (section: HeroSection): string =>
  renderActions([section.primaryCta, section.secondaryCta]);

const highlightsList = (section: HeroSection, klass = 'highlights'): string =>
  section.highlights.length
    ? `<ul class="${klass}">${section.highlights
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('')}</ul>`
    : '';

export function renderHero(section: HeroSection, ctx: RenderContext): string {
  const renderedImage = renderImage(section.image, ctx, { loading: 'eager' });
  const image =
    renderedImage ||
    '<div class="pn-image-slot pn-image-slot--hero" aria-label="Espaco reservado para foto do negocio">' +
      '<span class="pn-image-slot__icon" aria-hidden="true">+</span>' +
      '<span>Foto principal</span>' +
    '</div>';
  const body = textBlock(section);

  switch (section.variant) {
    /**
     * Duas colunas, texto a esquerda e imagem alta a direita.
     * O classico editorial: leitura em Z, imagem sustentando o peso da direita.
     */
    case 'editorial-split':
      return wrap(
        section,
        'hero--split',
        `<div class="hero-split"><div>${body}${actions(section)}${highlightsList(section)}</div>` +
          `<div class="hero-media">${image}</div></div>`,
      );

    /**
     * Sem imagem. A headline vira a propria imagem, em escala grande e centro
     * da tela. Serve a negocios sem foto boa -- que sao a maioria na prospeccao.
     */
    case 'centered-statement':
      return wrap(
        section,
        'hero--centered',
        `<div class="hero-centered">${body}${actions(section)}${highlightsList(section)}</div>`,
      );

    /**
     * Imagem sangrando na largura toda com texto sobreposto.
     * Exige imagem com area de respiro; sem imagem, cai para o centralizado.
     */
    case 'overlay-full':
      if (!renderedImage) return renderHero({ ...section, variant: 'editorial-split' }, ctx);
      return wrap(
        section,
        'hero--overlay',
        `<div class="hero-overlay-media">${image}<div class="hero-overlay-scrim"></div></div>` +
          `<div class="container hero-overlay-body">${body}${actions(section)}</div>`,
        { bare: true },
      );

    /**
     * Imagem a esquerda, texto em um cartao elevado que invade a imagem.
     * Ordem de leitura invertida em relacao ao editorial, com profundidade.
     */
    case 'split-reverse-card':
      return wrap(
        section,
        'hero--reverse',
        `<div class="hero-split hero-split--reverse"><div class="hero-media">${image}</div>` +
          `<div class="hero-card">${body}${actions(section)}</div></div>`,
      );

    /**
     * Texto centralizado em cima, imagem larga embaixo.
     * A imagem funciona como prova, nao como fundo: o visitante le primeiro.
     */
    case 'stacked-image-below':
      return wrap(
        section,
        'hero--stacked',
        `<div class="hero-centered">${body}${actions(section)}</div>` +
          `${renderedImage ? `<div class="hero-wide-media">${renderedImage}</div>` : ''}`,
      );

    /**
     * Coluna estreita alinhada a esquerda, com regua acima do titulo.
     * Silencioso e sobrio: consultorios, advocacia, arquitetura.
     */
    case 'minimal-rule':
      return wrap(
        section,
        'hero--minimal',
        `<div class="hero-minimal"><span class="rule" aria-hidden="true"></span>` +
          `${body}${actions(section)}</div>`,
      );

    /**
     * Texto de um lado e os destaques como bloco proeminente do outro.
     * Usa a lista como contrapeso visual quando nao ha imagem disponivel.
     */
    case 'duo-highlight':
      return wrap(
        section,
        'hero--duo',
        `<div class="hero-split"><div>${body}${actions(section)}</div>` +
          `<aside class="hero-highlight-box">${highlightsList(section, 'highlight-stack')}</aside></div>`,
      );

    /**
     * Faixa curta e horizontal: titulo e CTA quase na mesma linha.
     * Feita para landing page de campanha, onde a dobra precisa caber inteira.
     */
    case 'banner-compact':
      return wrap(
        section,
        'hero--banner',
        `<div class="hero-banner"><div>${body}</div>${actions(section)}</div>`,
      );

    default:
      return renderHero({ ...section, variant: 'editorial-split' }, ctx);
  }
}

function wrap(
  section: HeroSection,
  variantClass: string,
  inner: string,
  options: { bare?: boolean } = {},
): string {
  const content = options.bare ? inner : `<div class="container hero__inner">${inner}</div>`;
  return `<section${sectionAttrs(section, `hero ${variantClass}`)} data-hero>${content}</section>`;
}
