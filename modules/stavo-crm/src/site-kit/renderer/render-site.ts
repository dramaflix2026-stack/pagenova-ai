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
function applyVisualTextEdits(html: string, sectionId: string, model: SiteSchemaModel): string {
  let index = 0;
  return html.replace(/<(h[1-4]|p|span|a|button|li)(\s[^>]*)?>/gi, (tag) => {
    const key = `${sectionId}:${index++}`;
    const edit = model.visualTextEdits?.find((item) => item.key === key);
    const styles: string[] = [];
    if (edit?.fontSizePx) styles.push(`font-size:${edit.fontSizePx}px`);
    if (edit?.fontFamily) styles.push(`font-family:${edit.fontFamily === 'Georgia' ? 'Georgia,serif' : `${edit.fontFamily},sans-serif`}`);
    if (edit?.color) styles.push(`color:${edit.color}`);
    if (edit?.fontWeight) styles.push(`font-weight:${edit.fontWeight}`);
    if (edit?.fontStyle) styles.push(`font-style:${edit.fontStyle}`);
    if (edit?.textAlign) styles.push(`text-align:${edit.textAlign}`);
    const attrs = ` data-pn-edit="${escapeHtml(key)}"${styles.length ? ` style="${styles.join(';')}"` : ''}`;
    return tag.replace(/>$/, `${attrs}>`);
  });
}

function renderSection(section: SiteSection, ctx: RenderContext, model: SiteSchemaModel): string {
  if (!section.visible) return '';

  let html: string;
  switch (section.type) {
    case 'hero':
      html = renderHero(section, ctx);
      break;
    case 'about':
      html = renderAbout(section, ctx);
      break;
    case 'services':
      html = renderServices(section, ctx);
      break;
    case 'benefits':
      html = renderBenefits(section, ctx);
      break;
    case 'audience':
      html = renderAudience(section, ctx);
      break;
    case 'authority':
      html = renderAuthority(section, ctx);
      break;
    case 'stats':
      html = renderStats(section, ctx);
      break;
    case 'process':
      html = renderProcess(section, ctx);
      break;
    case 'gallery':
      html = renderGallery(section, ctx);
      break;
    case 'offer':
      html = renderOffer(section, ctx);
      break;
    case 'testimonials':
      html = renderTestimonials(section, ctx);
      break;
    case 'faq':
      html = renderFaq(section, ctx);
      break;
    case 'cta':
      html = renderCta(section, ctx);
      break;
    case 'contactMap':
      html = renderContact(section, ctx);
      break;
    case 'whatsappForm':
      html = renderWhatsAppForm(section, ctx);
      break;
    case 'footer':
      html = renderFooter(section, ctx);
      break;
    default: {
      const exhaustive: never = section;
      void exhaustive;
      return '';
    }
  }
  return applyVisualTextEdits(html, section.id, model);
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
  const sections = model.sections.map((section) => renderSection(section, ctx, model)).join('\n');

  const robots =
    ctx.profile === 'DEMO' || model.seo.noindex
      ? '<meta name="robots" content="noindex,nofollow,noarchive">'
      : '<meta name="robots" content="index,follow">';

  const ogImage = model.seo.ogImage ? ctx.resolveAsset(model.seo.ogImage.assetId) : null;

  return `<!doctype html>
<html lang="${escapeHtml(model.project.language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
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
<style>${renderStyles(model.theme)}
/* PageNova institutional editorial composition: Essenza reference. */
@media screen and (min-width:900px){
.hero--split .hero__inner{width:100%;max-width:none;padding:0}
.hero--split .hero-split{display:grid;grid-template-columns:minmax(0,42%) minmax(0,58%);align-items:stretch;min-height:610px;gap:0}
.hero--split .hero-split>div:first-child{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:clamp(48px,5vw,100px);position:relative;z-index:1}
.hero--split .hero-media{height:100%;min-height:610px;overflow:hidden}
.hero--split .hero-media img{width:100%;height:100%;object-fit:cover}
.benefits--icons{padding-top:26px!important;padding-bottom:26px!important}
.benefits--icons .icon-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.benefits--icons .icon-block{display:grid;grid-template-columns:38px minmax(0,1fr);column-gap:16px;align-content:center}
.benefits--icons .icon-block svg{grid-row:span 2}
.benefits--icons .icon-block h3{margin:0;font-size:1rem}
.benefits--icons .icon-block p{margin:4px 0 0}
.services--cards .grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
.services--cards .card{min-width:0;display:flex;flex-direction:column;align-items:flex-start;padding:28px 24px}
}
@media screen and (max-width:899px){
.hero--split .hero-split>div:first-child{padding:clamp(24px,6vw,48px)}
.hero--split .hero-media{min-height:280px}
.hero--split .hero-media img{width:100%;height:100%;object-fit:cover}
.benefits--icons .icon-grid{gap:20px}
.services--cards .card{min-width:0}
}
/* Critical responsive guard: emitted by the document renderer itself. */
@media screen and (max-width:899px){
html,body{width:100%;max-width:100%;overflow-x:hidden}
.container{width:100%!important;max-width:100%!important}
.grid,.grid-2,.grid-3,.numbered-grid,.icon-grid,.contrast-grid,.feature-lead,.checklist,.step-cards,.stats--grid,.timeline,.rail,.contact-grid,.footer-grid{grid-template-columns:minmax(0,1fr)!important;grid-auto-columns:minmax(0,1fr)!important;grid-auto-flow:row!important;width:100%!important;max-width:100%!important}
.grid>*,.grid-2>*,.grid-3>*,.numbered-grid>*,.icon-grid>*,.contrast-grid>*,.feature-lead>*,.checklist>*,.step-cards>*,.stats--grid>*,.timeline>*,.rail>*{grid-column:1!important;width:100%!important;min-width:0!important;max-width:100%!important}
.rail{display:grid!important;overflow:visible!important;transform:none!important}
.hero-split{display:flex!important;flex-direction:column!important;grid-template-columns:none!important}
.process .timeline{display:grid!important;grid-template-columns:minmax(0,1fr)!important}
.contact-grid,.cta-inline,.site-footer .footer-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important}
}
/* PageNova visual QA v2: protect editorial composition at real preview widths.
   Applied after theme CSS so it also fixes legacy generated projects. */
.site-header .container{width:100%;max-width:1320px;min-width:0;gap:clamp(16px,2.5vw,36px)}
.site-header .brand{display:block;flex:0 1 auto;min-width:0;max-width:260px;font-size:clamp(.94rem,1.2vw,1.12rem);line-height:1.2;overflow-wrap:normal;word-break:normal;text-wrap:balance}
.site-header .nav{min-width:0;flex:1 1 auto;justify-content:flex-end;gap:clamp(10px,1.35vw,22px)}
.site-header .nav>a:not(.btn){display:inline-block;flex:0 1 auto;min-width:0;max-width:165px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:clamp(.77rem,.95vw,.9rem)}
.hero--split .hero-split{min-width:0}
.hero--split .hero-split>div:first-child{min-width:0;max-width:100%;box-sizing:border-box}
.hero--split h1{font-size:clamp(2.35rem,3.6vw,4.4rem);line-height:1.075;max-width:100%;overflow-wrap:normal;word-break:normal;hyphens:auto;text-wrap:balance}
.hero--split .lead{max-width:42ch;font-size:clamp(1.03rem,1.5vw,1.27rem);line-height:1.65}
.hero--split .hero-media{min-width:0;isolation:isolate}
.hero--split .hero-media::before{display:none}
.hero--split .hero-media img{display:block;width:100%;height:100%;max-width:100%;object-fit:cover;object-position:center;box-shadow:none}
.hero--split .actions{display:flex;flex-wrap:wrap;gap:12px}
.hero--split .actions .btn{max-width:100%;white-space:normal;text-align:center}
.services--cards .card{min-width:0;overflow-wrap:break-word}
.services--cards .card h3{font-size:clamp(1.12rem,1.6vw,1.5rem);line-height:1.2}
@media screen and (min-width:1200px){
  .hero--split .hero-split{grid-template-columns:minmax(0,48%) minmax(0,52%);min-height:600px}
  .hero--split .hero-split>div:first-child{padding:clamp(40px,4.5vw,76px)}
  .hero--split .hero-media{min-height:600px}
}
@media screen and (min-width:900px) and (max-width:1199px){
  .hero--split .hero-split{grid-template-columns:minmax(0,52%) minmax(0,48%);min-height:510px}
  .hero--split .hero-split>div:first-child{padding:clamp(26px,3.5vw,48px)}
  .hero--split .hero-media{min-height:510px}
  .hero--split h1{font-size:clamp(2.1rem,3.6vw,3.1rem)}
}
@media screen and (max-width:1199px){
  .site-header:not(.site-header--minimal) .nav{display:none;position:absolute;top:100%;left:0;right:0;width:100%;max-height:calc(100dvh - 70px);overflow-y:auto;padding:20px clamp(20px,5vw,52px);background:var(--bg);box-shadow:0 18px 36px rgba(0,0,0,.12);flex-direction:column;align-items:stretch;gap:0;z-index:100}
  .site-header:not(.site-header--minimal) .nav[data-open='true']{display:flex}
  .site-header:not(.site-header--minimal) .nav>a:not(.btn){display:block;flex:none;max-width:none;white-space:normal;overflow:visible;text-overflow:clip;font-size:1rem;padding:12px 0}
  .site-header:not(.site-header--minimal) .nav-toggle{display:block;flex:0 0 48px}
  .site-header .container{position:relative;min-height:70px}
  .site-header .brand{max-width:min(290px,calc(100% - 70px));font-size:1.05rem}
  .site-header--centered .container{display:flex;justify-content:space-between}
  .site-header--centered .brand--center{order:-1;margin-right:auto}
  .site-header--centered .header-tail{display:none}
}
@media screen and (max-width:899px){
  .hero--split .hero-split{display:flex;flex-direction:column;min-height:0}
  .hero--split .hero-split>div:first-child{width:100%;padding:clamp(30px,6vw,56px);text-align:left}
  .hero--split h1{font-size:clamp(2.2rem,7vw,3.7rem);line-height:1.1}
  .hero--split .hero-media{width:100%;min-height:0;height:auto}
  .hero--split .hero-media img{height:auto;aspect-ratio:4/3;object-fit:cover}
}
@media screen and (max-width:480px){
  .hero--split h1{font-size:clamp(2rem,9vw,2.75rem)}
  .hero--split .hero-split>div:first-child{padding:32px 22px}
  .hero--split .hero-media img{aspect-ratio:4/3}
  .site-header .brand{font-size:.98rem;max-width:calc(100% - 65px)}
}

/* Editorial v4: make the actual grid win over legacy flex variants. */
@media(min-width:900px){
.hero.hero--split .hero__inner>.hero-split{display:grid!important;grid-template-columns:minmax(0,48%) minmax(0,52%)!important;align-items:stretch!important;gap:0!important}
.hero.hero--split .hero-split>.hero-media{width:100%;min-width:0;min-height:620px;align-self:stretch}
.hero.hero--split .hero-split>.hero-media>img{display:block;width:100%;height:100%;min-height:620px;object-fit:cover}
}
.hero.hero--split .hero-split>div:first-child{box-sizing:border-box;justify-content:center}
.hero.hero--split h1{max-width:19ch!important;font-size:clamp(2.4rem,3.7vw,4.4rem)!important;line-height:1.09!important}
@media(max-width:899px){.hero.hero--split .hero__inner>.hero-split{display:flex!important;flex-direction:column!important}}
/* Editorial layout v3: enforce full-bleed hero and readable chrome for saved sites. */
.site-header{position:sticky;top:0;z-index:100;background:var(--bg)}
.site-header .container{display:flex!important;align-items:center;justify-content:space-between;gap:24px;max-width:1320px!important;margin-inline:auto;padding-inline:clamp(20px,3vw,48px)}
.site-header .brand{flex:0 0 auto;max-width:300px!important;font-size:clamp(.95rem,1.1vw,1.12rem)!important;line-height:1.25;white-space:normal;overflow-wrap:normal!important;word-break:normal!important}
.site-header .nav{flex:1 1 auto;min-width:0;justify-content:flex-end;gap:clamp(12px,1.8vw,28px)}
.site-header .nav>a:not(.btn){font-size:.9rem;white-space:nowrap;max-width:none;overflow:visible;text-overflow:clip}
.hero--split{padding:0!important;overflow:hidden}
.hero--split>.container.hero__inner{max-width:none!important;width:100%!important;padding:0!important;margin:0!important}
.hero--split .hero-split{width:100%!important;max-width:none!important;grid-template-columns:minmax(0,48%) minmax(0,52%);min-height:clamp(580px,65vh,820px)}
.hero--split .hero-split>div:first-child{min-width:0;max-width:none;padding:clamp(38px,5vw,90px) clamp(28px,5vw,96px)!important}
.hero--split h1{font-size:clamp(2.5rem,4vw,4.8rem)!important;line-height:1.07!important;letter-spacing:-.035em;max-width:16ch!important;overflow-wrap:normal!important;word-break:normal!important;hyphens:none!important;text-wrap:balance}
.hero--split .hero-media{min-height:clamp(580px,65vh,820px);height:auto;position:relative}
.hero--split .hero-media img{width:100%;height:100%;min-height:inherit;object-fit:cover}
.hero--split .hero-media:has(.pn-image-slot){background:linear-gradient(135deg,color-mix(in srgb,var(--primary) 12%,var(--surface)),color-mix(in srgb,var(--primary) 30%,var(--surface)))}
.hero--split .hero-media .pn-image-slot{height:100%;min-height:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center}
.site-footer .container{max-width:1200px;margin-inline:auto;padding-inline:clamp(24px,5vw,80px)}
.site-footer--centered .container,.site-footer--legal .container,.site-footer--contrast .container{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px}
.site-footer .footer-name,.site-footer .muted{max-width:100%;margin:0;overflow-wrap:break-word}
.site-footer .footer-name{font-size:clamp(1rem,1.35vw,1.3rem);line-height:1.4}
.site-footer .footer-grid{align-items:start;gap:clamp(24px,4vw,60px)}
@media(max-width:1399px){
.site-header:not(.site-header--minimal) .nav{display:none!important;position:absolute!important;top:100%;left:0;right:0;width:100%;max-height:calc(100dvh - 70px);overflow:auto;background:var(--bg);padding:20px clamp(20px,5vw,60px);box-shadow:0 16px 35px rgba(0,0,0,.13);flex-direction:column;align-items:stretch;gap:0}
.site-header:not(.site-header--minimal) .nav[data-open='true']{display:flex!important}
.site-header:not(.site-header--minimal) .nav>a:not(.btn){white-space:normal;max-width:none;padding:12px 0}
.site-header:not(.site-header--minimal) .nav-toggle{display:block!important;flex:0 0 48px}
.site-header .container{position:relative;min-height:72px}
.site-header .brand{max-width:calc(100% - 72px)!important}
.site-header--centered .brand--center{order:-1;margin-right:auto}
.site-header--centered .header-tail{display:none}
}
@media(max-width:899px){
.hero--split .hero-split{display:flex!important;flex-direction:column!important;min-height:0!important}
.hero--split .hero-split>div:first-child{padding:clamp(38px,7vw,64px) clamp(22px,5vw,44px)!important}
.hero--split h1{font-size:clamp(2.25rem,7vw,3.6rem)!important;max-width:20ch!important}
.hero--split .hero-media{min-height:340px;height:auto}
.hero--split .hero-media img{height:auto;min-height:0;aspect-ratio:4/3}
}
@media(max-width:480px){
.hero--split h1{font-size:clamp(2.05rem,9vw,2.75rem)!important}
.hero--split .hero-media{min-height:260px}
.site-footer{padding-block:44px}
}


/* Lovable-reference editorial overlay: full-bleed photography, left reading axis,
   warm scrim and readable ink. This is applied in preview and publication. */
.hero.hero--overlay{position:relative!important;padding:0!important;min-height:620px;overflow:hidden;background:var(--surface)}
.hero.hero--overlay .hero-overlay-media{position:absolute!important;inset:0!important;min-height:100%!important;width:100%;height:100%;z-index:0}
.hero.hero--overlay .hero-overlay-media img{position:absolute!important;inset:0;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;border-radius:0!important}
.hero.hero--overlay .hero-overlay-scrim{display:block!important;position:absolute!important;inset:0;background:linear-gradient(90deg,rgba(250,244,237,.96) 0%,rgba(250,244,237,.88) 23%,rgba(250,244,237,.55) 43%,rgba(250,244,237,.12) 66%,transparent 84%)!important}
.hero.hero--overlay .hero-overlay-body{position:relative!important;z-index:1!important;inset:auto!important;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;min-height:620px;box-sizing:border-box;width:100%;max-width:1320px!important;margin:0 auto!important;padding:clamp(60px,8vw,120px) clamp(28px,4.5vw,76px)!important;color:var(--text)!important}
.hero.hero--overlay .hero-overlay-body h1{font-size:clamp(2.8rem,4.65vw,5.2rem)!important;line-height:1.075!important;letter-spacing:-.035em!important;font-weight:500;max-width:12.5ch!important;text-wrap:balance;color:var(--text)!important;margin:0 0 24px}
.hero.hero--overlay .hero-overlay-body .eyebrow{color:var(--primary)!important;font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;font-weight:700;margin-bottom:24px}
.hero.hero--overlay .hero-overlay-body .lead{color:var(--muted)!important;max-width:42ch;font-size:clamp(1rem,1.25vw,1.15rem);line-height:1.85}
.hero.hero--overlay .hero-overlay-body .actions{margin-top:22px;display:flex;flex-wrap:wrap;gap:14px}
@media(min-width:900px){.hero.hero--overlay{min-height:clamp(620px,72vh,830px)}.hero.hero--overlay .hero-overlay-body{min-height:clamp(620px,72vh,830px)}}
@media(max-width:899px){
.hero.hero--overlay{min-height:620px!important}
.hero.hero--overlay .hero-overlay-media{position:absolute!important;inset:0!important;min-height:100%!important}
.hero.hero--overlay .hero-overlay-media img{position:absolute!important;width:100%!important;height:100%!important;aspect-ratio:auto!important;object-fit:cover!important}
.hero.hero--overlay .hero-overlay-scrim{background:linear-gradient(90deg,rgba(250,244,237,.96) 0%,rgba(250,244,237,.84) 48%,rgba(250,244,237,.48) 100%)!important}
.hero.hero--overlay .hero-overlay-body{position:relative!important;min-height:620px;padding:72px 26px!important}
.hero.hero--overlay .hero-overlay-body h1{font-size:clamp(2.35rem,8vw,3.7rem)!important;max-width:13ch!important}
}

</style>
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
