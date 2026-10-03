/**
 * Moldura e conversao: cabecalho, CTA, contato, formulario e rodape.
 *
 * O cabecalho e o rodape sao as duas pecas que aparecem em TODA pagina, entao
 * um erro aqui aparece o tempo inteiro. O formulario e a peca que precisa
 * funcionar sem backend nenhum -- e o que permite o ZIP ser entregue.
 */
import {
  escapeHtml,
  renderButton,
  renderIcon,
  renderImage,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSchemaModel } from '@site-kit/schemas/site-schema';

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

export function renderHeader(model: SiteSchemaModel, ctx: RenderContext): string {
  const { navigation } = model;
  if (!navigation.showMenu) return '';

  const brand = navigation.logo
    ? renderImage(navigation.logo, ctx, { className: 'brand-logo', loading: 'eager' })
    : escapeHtml(navigation.wordmark || model.business.name);

  const links = navigation.items
    .map((item) => `<a href="#${escapeHtml(item.anchor)}">${escapeHtml(item.label)}</a>`)
    .join('');

  const cta = navigation.headerCta ? renderButton(navigation.headerCta, 'primary') : '';
  const toggle =
    `<button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false"` +
    ` aria-controls="menu-principal" aria-label="Abrir menu">&#9776;</button>`;

  const variant = navigation.headerVariant ?? 'inline-right';
  const sticky = navigation.stickyHeader ? ' site-header--sticky' : '';

  switch (variant) {
    /** Marca a esquerda, links e CTA a direita. O padrao reconhecivel. */
    case 'inline-right':
      return `<header class="site-header${sticky} site-header--inline"><div class="container">
<a class="brand" href="#inicio">${brand}</a>${toggle}
<nav class="nav" id="menu-principal" aria-label="Navegacao principal">${links}${cta}</nav>
</div></header>`;

    /** Marca centralizada com links dos dois lados: simetria editorial. */
    case 'centered-split':
      return `<header class="site-header${sticky} site-header--centered"><div class="container">
${toggle}
<nav class="nav nav--split" id="menu-principal" aria-label="Navegacao principal">${links}</nav>
<a class="brand brand--center" href="#inicio">${brand}</a>
<div class="header-tail">${cta}</div>
</div></header>`;

    /** Barra minima: so a marca e um CTA. Landing page sem navegacao. */
    case 'minimal-cta':
      return `<header class="site-header${sticky} site-header--minimal"><div class="container">
<a class="brand" href="#inicio">${brand}</a>
<nav class="nav nav--bare" id="menu-principal" aria-label="Navegacao principal">${cta}</nav>
</div></header>`;

    /** Duas faixas: contato acima, navegacao abaixo. Comercio local. */
    case 'stacked-bar': {
      const phone = model.business.phoneE164?.value;
      return `<header class="site-header${sticky} site-header--stacked">
${phone ? `<div class="topbar"><div class="container"><a href="tel:${escapeHtml(phone.replace(/[^\d+]/g, ''))}">${renderIcon('phone')}${escapeHtml(phone)}</a></div></div>` : ''}
<div class="container">
<a class="brand" href="#inicio">${brand}</a>${toggle}
<nav class="nav" id="menu-principal" aria-label="Navegacao principal">${links}${cta}</nav>
</div></header>`;
    }

    /** Cabecalho transparente que ganha fundo ao rolar. Combina com hero cheio. */
    case 'transparent-overlay':
      return `<header class="site-header${sticky} site-header--overlay" data-header-condense><div class="container">
<a class="brand" href="#inicio">${brand}</a>${toggle}
<nav class="nav" id="menu-principal" aria-label="Navegacao principal">${links}${cta}</nav>
</div></header>`;

    default:
      return renderHeader(
        { ...model, navigation: { ...navigation, headerVariant: 'inline-right' } },
        ctx,
      );
  }
}

// ---------------------------------------------------------------------------
// CTA (5 variantes)
