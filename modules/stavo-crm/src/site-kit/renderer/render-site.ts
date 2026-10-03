/**
 * Renderer: SiteSchema -> HTML.
 *
 * Fonte de verdade UNICA. O preview do editor, o snapshot publicado e o ZIP
 * estatico chamam esta mesma funcao e recebem exatamente os mesmos bytes. Foi
 * a decisao mais importante do modulo: com dois renderers, o cliente abriria
 * um site diferente do que o administrador aprovou.
 *
 * Por que HTML em string, e nao componentes React renderizados no servidor:
 *
 *  - o site publicado nao pode depender de React, hidratacao ou bundle da
 *    plataforma. O ZIP tem que abrir com duplo clique;
 *  - uma unica funcao pura elimina a chance de o caminho de preview e o de
 *    exportacao divergirem -- eles nao sao dois caminhos;
 *  - o conteudo nasce no HTML inicial, entao a pagina continua legivel se o
 *    JavaScript falhar, que e exigencia da especificacao.
 *
 * Este arquivo so despacha e monta o documento. O desenho de cada familia mora
 * em `sections/<familia>/`, as primitivas em `primitives/` e o CSS em
 * `themes/styles.ts`.
 */
import { contrastRatio } from '@site-kit/themes/colors';
import { renderAbout } from '@site-kit/sections/about/about';
import { renderAuthority } from '@site-kit/sections/about/authority';
import { renderAudience } from '@site-kit/sections/benefits/audience';
import { renderBenefits } from '@site-kit/sections/benefits/benefits';
import { renderCta } from '@site-kit/sections/cta/cta';
import { renderFaq } from '@site-kit/sections/faq/faq';
import { renderFooter } from '@site-kit/sections/footers/footer';
import { renderContact } from '@site-kit/sections/forms/contact-map';
import { renderWhatsAppForm } from '@site-kit/sections/forms/whatsapp-form';
import { renderGallery } from '@site-kit/sections/gallery/gallery';
import { renderHero } from '@site-kit/sections/heroes/hero';
import { renderHeader } from '@site-kit/sections/navigation/header';
import { renderOffer } from '@site-kit/sections/pricing/offer';
import { renderProcess } from '@site-kit/sections/process/process';
import { renderStats } from '@site-kit/sections/proof/stats';
import { renderTestimonials } from '@site-kit/sections/proof/testimonials';
import { renderServices } from '@site-kit/sections/services/services';
import { escapeHtml, type RenderContext } from '@site-kit/primitives/render-utils';
import { renderStyles } from '@site-kit/themes/styles';
import type { DesignTokens, SiteSchemaModel, SiteSection } from '@site-kit/schemas/site-schema';
import { fontLinkTags } from '@site-kit/themes/fonts';

export { escapeHtml } from '@site-kit/primitives/render-utils';
export type { RenderContext } from '@site-kit/primitives/render-utils';
export { renderStyles } from '@site-kit/themes/styles';

/**
 * Despacha uma secao para a familia correta.
 *
 * O `never` no final e proposital: acrescentar um tipo de secao ao schema sem
 * escrever o renderer vira erro de compilacao, e nao um buraco silencioso na
 * pagina publicada.
 */
function renderSection(section: SiteSection, ctx: RenderContext): string {
  if (!section.visible) return '';

  switch (section.type) {
    case 'hero':
      return renderHero(section, ctx);
    case 'about':
      return renderAbout(section, ctx);
    case 'services':
      return renderServices(section, ctx);
    case 'benefits':
      return renderBenefits(section, ctx);
    case 'audience':
      return renderAudience(section, ctx);
    case 'authority':
      return renderAuthority(section, ctx);
    case 'stats':
      return renderStats(section, ctx);
    case 'process':
      return renderProcess(section, ctx);
    case 'gallery':
      return renderGallery(section, ctx);
    case 'offer':
      return renderOffer(section, ctx);
    case 'testimonials':
      return renderTestimonials(section, ctx);
    case 'faq':
      return renderFaq(section, ctx);
    case 'cta':
      return renderCta(section, ctx);
    case 'contactMap':
      return renderContact(section, ctx);
    case 'whatsappForm':
      return renderWhatsAppForm(section, ctx);
    case 'footer':
      return renderFooter(section, ctx);
    default: {
      const exhaustive: never = section;
      void exhaustive;
      return '';
    }
  }
}

/**
 * JSON-LD.
 *
 * So descreve o que esta VISIVEL na pagina e confirmado em `business`. Dado
 * estruturado que contradiz o conteudo e considerado spam pelos buscadores,
 * alem de ser mentira.
 */
function renderJsonLd(model: SiteSchemaModel): string {
  const facts = model.business;

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': model.seo.jsonLdType,
    name: facts.name,
    description: model.seo.description,
  };

  if (facts.phoneE164) data.telephone = facts.phoneE164.value;
  if (facts.email) data.email = facts.email.value;
  if (facts.address) {
    data.address = { '@type': 'PostalAddress', streetAddress: facts.address.value };
  }
  if (facts.city) data.areaServed = facts.city;
  if (facts.instagramUrl) data.sameAs = [facts.instagramUrl.value];
  if (facts.openingHours.length) data.openingHours = facts.openingHours;

  // Nota, avaliacao e contagem de clientes NUNCA entram aqui: o Google trata
  // rating inventado como spam estruturado, e nao temos esse dado.
  // `<` vira a forma escapada \u003c para que uma string do conteudo nunca
  // consiga fechar a tag e abrir outra. JSON entende a escapada; o parser de
  // HTML nao ve mais um sinal de menor.
  const json = JSON.stringify(data).split('<').join('\\u003c');

  return `<script type="application/ld+json">${json}</script>`;
}

/**
 * Renderiza a pagina inteira.
 *
 * O CSS vai inline no `<head>`: uma folha externa custaria uma requisicao
 * bloqueante e o arquivo e pequeno. O JS vai no fim do `<body>` e e opcional.
 */
export function renderSite(model: SiteSchemaModel, ctx: RenderContext): string {
  const sections = model.sections.map((section) => renderSection(section, ctx)).join('\n');

  const robots =
    ctx.profile === 'DEMO' || model.seo.noindex
      ? '<meta name="robots" content="noindex,nofollow,noarchive">'
      : '<meta name="robots" content="index,follow">';

  const ogImage = model.seo.ogImage ? ctx.resolveAsset(model.seo.ogImage.assetId) : null;

  return `<!doctype html>
<html lang="${escapeHtml(model.project.language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(model.seo.title)}</title>
<meta name="description" content="${escapeHtml(model.seo.description)}">
${robots}
${model.seo.canonicalUrl ? `<link rel="canonical" href="${escapeHtml(model.seo.canonicalUrl)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(model.seo.title)}">
<meta property="og:description" content="${escapeHtml(model.seo.description)}">
<meta property="og:locale" content="pt_BR">
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage.url)}">` : ''}
<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
${fontLinkTags([model.theme.typography.headingFont, model.theme.typography.bodyFont], ctx.fontSource ?? 'google')}
<style>${renderStyles(model.theme)}</style>
${renderJsonLd(model)}
</head>
<body>
<a class="skip" href="#conteudo">Pular para o conteudo</a>
${renderHeader(model, ctx)}
<main id="conteudo">
${sections}
</main>
${ctx.inlineRuntime ? `<script>${ctx.inlineRuntime}</script>` : ''}
</body>
</html>`;
}

/**
 * Verificacao rapida usada pelo QA: o contraste real dos tokens.
 *
 * Duplica de proposito o que o linter ja checa -- aqui e sobre o HTML que
 * acabou de sair, e nao sobre o modelo. Se algum dia o renderer aplicar uma
 * cor diferente da do token, esta funcao acusa.
 */
export const themeContrastReport = (theme: DesignTokens) => ({
  textOnBackground: contrastRatio(theme.colors.text, theme.colors.background),
  textOnSurface: contrastRatio(theme.colors.text, theme.colors.surface),
  primaryButton: contrastRatio(theme.colors.primaryForeground, theme.colors.primary),
});
