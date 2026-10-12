/**
 * PageNova universal master: one visual layout for every business niche.
 *
 * Renders the same SiteSchema used by the CRM editor, autosave, publishing
 * and ZIP export. No generated HTML/CSS from the AI is executed.
 * Existing projects continue using the standard renderer until opted in.
 */
import type { ActionLink, SiteSchemaModel, SiteSection } from '@site-kit/schemas/site-schema';
import { escapeHtml as esc, hrefFor, isExternal, renderImage, type RenderContext } from '@site-kit/primitives/render-utils';

const action = (link?: ActionLink, variant = ''): string => {
  if (!link) return '';
  return '<a class="pn-master-button ' + variant + '" href="' + esc(hrefFor(link)) + '"' +
    (isExternal(link) ? ' target="_blank" rel="noopener noreferrer"' : '') +
    '>' + esc(link.label) + '<span aria-hidden="true"> ↗</span></a>';
};
const idFor = (section: SiteSection): string => esc(section.anchor || section.id);
const text = (value?: string): string => value ? esc(value) : '';
const sectionTitle = (value: string, eyebrow?: string): string =>
  '<div class="pn-master-heading">' +
  (eyebrow ? '<p class="pn-master-eyebrow">' + esc(eyebrow) + '</p>' : '') +
  '<h2>' + esc(value) + '</h2></div>';

export const UNIVERSAL_MASTER_STYLES = [
  '.pn-universal{--pn-primary:#17665a;--pn-bg:#f7f8f5;--pn-ink:#17363a;--pn-surface:#fff;--pn-muted:#627475;--pn-border:#e1e7e3;color:var(--pn-ink);background:var(--pn-bg);font-family:Poppins,Inter,Arial,sans-serif;font-size:15px;line-height:1.65;overflow-x:clip}',
  '.pn-universal *{box-sizing:border-box}.pn-universal a{text-decoration:none}.pn-universal img{display:block;max-width:100%}.pn-universal h1,.pn-universal h2,.pn-universal h3{color:var(--pn-ink);font-family:Poppins,Inter,Arial,sans-serif;letter-spacing:-.045em;line-height:1.15;margin:0}.pn-universal p{margin:0}',
  '.pn-universal .pn-container{width:min(1160px,calc(100% - 48px));margin-inline:auto}',
  '.pn-universal .pn-master-header{position:sticky;top:0;z-index:35;border-bottom:1px solid var(--pn-border);background:rgba(255,255,255,.97);backdrop-filter:blur(14px)}',
  '.pn-universal .pn-master-nav-row{min-height:84px;display:flex;justify-content:space-between;gap:28px;align-items:center}',
  '.pn-universal .pn-master-brand{display:inline-flex;align-items:center;gap:12px;min-width:0;color:var(--pn-ink);font-weight:800;font-size:19px;line-height:1.2;letter-spacing:-.045em;overflow-wrap:anywhere}',
  '.pn-universal .pn-master-brand-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--pn-primary);color:#fff;font-size:25px;flex:none}',
  '.pn-universal .pn-master-nav{display:flex;gap:24px;align-items:center}.pn-universal .pn-master-nav a{font-size:12px;font-weight:600;color:var(--pn-muted)}.pn-universal .pn-master-nav a:hover{color:var(--pn-primary)}',
  '.pn-universal .pn-master-menu{display:none}.pn-universal .pn-master-menu summary{cursor:pointer;border:1px solid var(--pn-border);border-radius:10px;padding:8px 13px;list-style:none;font-size:21px}.pn-universal .pn-master-menu summary::-webkit-details-marker{display:none}',
  '.pn-universal .pn-master-menu-links{position:absolute;top:100%;left:0;right:0;background:#fff;border-bottom:1px solid var(--pn-border);display:grid;padding:16px 24px;box-shadow:0 16px 30px #0001}.pn-universal .pn-master-menu-links a{padding:11px 0;color:var(--pn-ink)}',
  '.pn-universal .pn-master-button{display:inline-flex;align-items:center;justify-content:center;gap:14px;background:var(--pn-primary);border:1px solid var(--pn-primary);border-radius:8px;padding:13px 22px;font-size:13px;line-height:1.3;font-weight:700;color:#fff!important;max-width:100%;text-align:center;transition:transform .18s,filter .18s;box-shadow:0 7px 18px #00000012}.pn-universal .pn-master-button:hover{transform:translateY(-2px);filter:brightness(1.08)}.pn-universal .pn-master-button--light{background:#fff;border-color:#fff;color:var(--pn-ink)!important}',
  '.pn-universal .pn-master-hero{position:relative;isolation:isolate;display:flex;align-items:center;min-height:620px;overflow:hidden;background:linear-gradient(110deg,#ecf3ef 0%,#e4eeea 70%,#dcebe7 100%)}',
  '.pn-universal .pn-master-hero-media{position:absolute;inset:0;z-index:-1}.pn-universal .pn-master-hero-media img{width:100%;height:100%;object-fit:cover;object-position:center}.pn-universal .pn-master-hero-media:has(img):after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(248,250,247,.98) 0%,rgba(248,250,247,.9) 37%,rgba(248,250,247,.26) 85%)}',
  '.pn-universal .pn-master-hero-copy{max-width:620px;padding:100px 0}.pn-universal .pn-master-eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:11px;font-weight:800;color:var(--pn-primary);margin-bottom:16px!important}.pn-universal .pn-master-hero h1{font-size:clamp(38px,5.5vw,70px);line-height:1.12;font-weight:800;overflow-wrap:break-word}.pn-universal .pn-master-hero .pn-lead{font-size:16px;line-height:1.85;max-width:510px;color:var(--pn-muted);margin:24px 0 30px}',
  '.pn-universal .pn-master-actions{display:flex;gap:12px;flex-wrap:wrap}.pn-universal .pn-master-kpis{background:#e9f1ee;border-bottom:1px solid var(--pn-border)}.pn-universal .pn-master-kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:22px 0}.pn-universal .pn-master-kpi{padding:16px 21px;border-right:1px solid #d0ddd8;min-width:0}.pn-universal .pn-master-kpi:last-child{border:0}.pn-universal .pn-master-kpi strong{display:block;font-size:14px;line-height:1.4;color:var(--pn-ink)}.pn-universal .pn-master-kpi p{font-size:12px;line-height:1.65;color:var(--pn-muted);margin-top:6px}',
  '.pn-universal .pn-master-section{padding:92px 0}.pn-universal .pn-master-heading{text-align:center;max-width:730px;margin:0 auto 43px}.pn-universal .pn-master-heading h2{font-size:clamp(30px,3.4vw,45px);font-weight:750}.pn-universal .pn-master-heading p:not(.pn-master-eyebrow){margin-top:14px;color:var(--pn-muted)}',
  '.pn-universal .pn-master-services{background:#fff}.pn-universal .pn-master-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.pn-universal .pn-master-card{border:1px solid var(--pn-border);border-radius:10px;padding:29px 24px;background:var(--pn-surface);min-height:240px;transition:transform .2s,box-shadow .2s}.pn-universal .pn-master-card:hover{transform:translateY(-4px);box-shadow:0 16px 32px #0000000c}.pn-universal .pn-master-card .pn-master-number{display:grid;place-items:center;border-radius:12px;background:#edf4f0;color:var(--pn-primary);font-weight:800;font-size:17px;width:48px;height:48px;margin-bottom:24px}.pn-universal .pn-master-card h3{font-size:17px;line-height:1.4;letter-spacing:-.025em}.pn-universal .pn-master-card p{color:var(--pn-muted);font-size:13px;margin-top:10px}',
  '.pn-universal .pn-master-about{background:#eef3ef}.pn-universal .pn-master-about-grid{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}.pn-universal .pn-master-about-photo{min-height:390px;border-radius:11px;overflow:hidden;background:linear-gradient(145deg,#d6e9e3,#bcd8cb)}.pn-universal .pn-master-about-photo img{height:100%;width:100%;min-height:390px;object-fit:cover}.pn-universal .pn-master-about-copy h2{font-size:clamp(30px,3.3vw,44px)}.pn-universal .pn-master-about-copy p:not(.pn-master-eyebrow){color:var(--pn-muted);font-size:14px;line-height:1.9;margin-top:19px}.pn-universal .pn-master-about-copy .pn-master-button{margin-top:28px}',
  '.pn-universal .pn-master-steps{background:#fff}.pn-universal .pn-master-step-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.pn-universal .pn-master-step{padding:26px 20px;border-top:3px solid var(--pn-primary);background:#f5f8f6;border-radius:4px}.pn-universal .pn-master-step strong{display:block;color:var(--pn-primary);font-size:12px;letter-spacing:.15em}.pn-universal .pn-master-step h3{font-size:17px;margin-top:17px}.pn-universal .pn-master-step p{font-size:13px;color:var(--pn-muted);margin-top:10px}',
  '.pn-universal .pn-master-faq{background:#f4f7f4}.pn-universal .pn-master-faq-wrap{max-width:850px;margin:auto}.pn-universal .pn-master-faq details{border:1px solid var(--pn-border);background:#fff;margin:10px 0;border-radius:10px;padding:17px 23px}.pn-universal .pn-master-faq summary{font-weight:650;cursor:pointer}.pn-universal .pn-master-faq details p{margin-top:14px;color:var(--pn-muted)}',
  '.pn-universal .pn-master-contact{background:var(--pn-primary);text-align:center;padding:75px 0}.pn-universal .pn-master-contact h2{color:#fff;font-size:clamp(30px,4vw,46px);max-width:700px;margin:auto}.pn-universal .pn-master-contact p{color:#f1f7f3;margin:19px auto 26px;max-width:660px}.pn-universal .pn-master-contact .pn-master-eyebrow{color:#e4f6ee}.pn-universal .pn-master-contact .pn-master-actions{justify-content:center}',
  '.pn-universal .pn-master-footer{padding:31px 0;background:#fff;border-top:1px solid var(--pn-border)}.pn-universal .pn-master-footer .pn-container{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}.pn-universal .pn-master-footer p{font-size:12px;color:var(--pn-muted)}',
  '.pn-universal .pn-master-generic{background:#fff}.pn-universal .pn-master-generic .section{max-width:1160px;margin:0 auto}',
  '@media(min-width:901px){.pn-universal .pn-master-hero-media:has(img) img{object-position:center right}}',
  '@media(max-width:900px){.pn-universal .pn-master-nav,.pn-universal .pn-master-header>.pn-container>.pn-master-button{display:none}.pn-universal .pn-master-menu{display:block}.pn-universal .pn-master-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pn-universal .pn-master-kpi:nth-child(2){border-right:0}.pn-universal .pn-master-grid,.pn-universal .pn-master-step-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pn-universal .pn-master-about-grid{gap:28px}}',
  '@media(max-width:600px){.pn-universal .pn-container{width:calc(100% - 36px)}.pn-universal .pn-master-nav-row{min-height:72px}.pn-universal .pn-master-brand{font-size:17px;max-width:calc(100% - 70px)}.pn-universal .pn-master-hero{min-height:520px}.pn-universal .pn-master-hero-copy{padding:65px 0}.pn-universal .pn-master-hero h1{font-size:clamp(34px,9vw,47px)}.pn-universal .pn-master-hero .pn-lead{font-size:14px}.pn-universal .pn-master-hero-media:has(img):after{background:linear-gradient(90deg,rgba(248,250,247,.96) 0%,rgba(248,250,247,.86) 62%,rgba(248,250,247,.56) 100%)}.pn-universal .pn-master-kpi-grid{display:flex;overflow-x:auto;scroll-snap-type:x proximity;padding:9px 0}.pn-universal .pn-master-kpi{flex:0 0 210px;scroll-snap-align:start}.pn-universal .pn-master-kpi:nth-child(2){border-right:1px solid #d0ddd8}.pn-universal .pn-master-section{padding:60px 0}.pn-universal .pn-master-grid,.pn-universal .pn-master-step-grid{grid-template-columns:1fr}.pn-universal .pn-master-card{min-height:0}.pn-universal .pn-master-about-grid{grid-template-columns:1fr}.pn-universal .pn-master-about-photo,.pn-universal .pn-master-about-photo img{min-height:250px;max-height:360px}.pn-universal .pn-master-about-copy h2{font-size:32px}.pn-universal .pn-master-contact{padding:60px 0}}',
  '@media(prefers-reduced-motion:reduce){.pn-universal *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}'
].join('\n');

export function renderUniversalMaster(
  model: SiteSchemaModel,
  ctx: RenderContext,
  renderStandardSection: (section: SiteSection) => string,
  applyEdits: (html: string, sectionId: string, model: SiteSchemaModel) => string,
): string {
  const visible = model.sections.filter((item) => item.visible);
  const anchors = new Set(visible.map((item) => item.anchor).filter(Boolean));
  const nav = model.navigation.items.filter((item) => anchors.has(item.anchor)).slice(0, 5);
  const brand = esc(model.business.name);
  const headerCta = model.navigation.headerCta ?? model.objective.primaryCta;
  const menuItems = nav.map((item) => '<a href="#' + esc(item.anchor) + '">' + esc(item.label) + '</a>').join('');

  const header = '<header class="pn-master-header"><div class="pn-container pn-master-nav-row">' +
    '<a class="pn-master-brand" href="#conteudo"><span class="pn-master-brand-icon" aria-hidden="true">✳</span><span>' + brand + '</span></a>' +
    '<nav class="pn-master-nav" aria-label="Menu principal">' + menuItems + '</nav>' +
    action(headerCta) + '<details class="pn-master-menu"><summary aria-label="Abrir menu">☰</summary>' +
    '<nav class="pn-master-menu-links" aria-label="Menu para celular">' + menuItems + action(headerCta) + '</nav></details></div></header>';

  const render = (section: SiteSection): string => {
    const id = idFor(section);
    let html = '';
    switch (section.type) {
      case 'hero':
        html = '<section class="pn-master-hero" id="' + id + '">' +
          '<div class="pn-master-hero-media">' + renderImage(section.image, ctx, { className: 'pn-hero-photo', loading: 'eager' }) + '</div>' +
          '<div class="pn-container"><div class="pn-master-hero-copy">' +
          (section.eyebrow ? '<p class="pn-master-eyebrow">' + text(section.eyebrow) + '</p>' : '') +
          '<h1>' + text(section.headline) + '</h1>' +
          (section.subheadline ? '<p class="pn-lead">' + text(section.subheadline) + '</p>' : '') +
          '<div class="pn-master-actions">' + action(section.primaryCta) + action(section.secondaryCta, 'pn-master-button--light') +
          '</div></div></div></section>';
        break;
      case 'benefits':
        html = '<section class="pn-master-kpis" id="' + id + '" aria-label="' + text(section.headline) + '"><div class="pn-container pn-master-kpi-grid">' +
          section.items.map((item) => '<div class="pn-master-kpi"><strong>' + text(item.title) + '</strong>' +
            (item.body ? '<p>' + text(item.body) + '</p>' : '') + '</div>').join('') + '</div></section>';
        break;
      case 'services':
        html = '<section class="pn-master-services pn-master-section" id="' + id + '"><div class="pn-container">' +
          sectionTitle(section.headline, 'O que fazemos') +
          (section.subheadline ? '<p class="pn-master-subtitle">' + text(section.subheadline) + '</p>' : '') +
          '<div class="pn-master-grid">' + section.items.map((item, i) => '<article class="pn-master-card"><span class="pn-master-number" aria-hidden="true">' +
            String(i + 1).padStart(2, '0') + '</span><h3>' + text(item.title) + '</h3>' +
            (item.body ? '<p>' + text(item.body) + '</p>' : '') + '</article>').join('') + '</div>' +
          (section.cta ? '<div class="pn-master-actions" style="justify-content:center;margin-top:32px">' + action(section.cta) + '</div>' : '') + '</div></section>';
        break;
      case 'about':
        html = '<section class="pn-master-about pn-master-section" id="' + id + '"><div class="pn-container pn-master-about-grid">' +
          '<div class="pn-master-about-photo">' + renderImage(section.image, ctx, { className: 'pn-about-photo' }) + '</div>' +
          '<div class="pn-master-about-copy"><p class="pn-master-eyebrow">Quem somos</p><h2>' + text(section.headline) + '</h2>' +
          section.body.map((p) => '<p>' + text(p) + '</p>').join('') + action(section.cta) + '</div></div></section>';
        break;
      case 'process':
        html = '<section class="pn-master-steps pn-master-section" id="' + id + '"><div class="pn-container">' +
          sectionTitle(section.headline, 'Como trabalhamos') +
          (section.subheadline ? '<p class="pn-master-subtitle">' + text(section.subheadline) + '</p>' : '') +
          '<div class="pn-master-step-grid">' + section.steps.map((step, i) => '<article class="pn-master-step">' +
            '<strong>' + String(i + 1).padStart(2, '0') + '</strong><h3>' + text(step.title) + '</h3>' +
            (step.body ? '<p>' + text(step.body) + '</p>' : '') + '</article>').join('') +
          '</div></div></section>';
        break;
      case 'faq':
        html = '<section class="pn-master-faq pn-master-section" id="' + id + '"><div class="pn-container pn-master-faq-wrap">' +
          sectionTitle(section.headline) + section.items.map((item) => '<details><summary>' +
            text(item.question) + '</summary><p>' + text(item.answer) + '</p></details>').join('') + '</div></section>';
        break;
      case 'cta':
        html = '<section class="pn-master-contact" id="' + id + '"><div class="pn-container">' +
          '<p class="pn-master-eyebrow">Vamos conversar?</p><h2>' + text(section.headline) + '</h2>' +
          (section.body ? '<p>' + text(section.body) + '</p>' : '') +
          '<div class="pn-master-actions">' + action(section.primaryCta, 'pn-master-button--light') +
          action(section.secondaryCta, 'pn-master-button--light') + '</div></div></section>';
        break;
      case 'footer':
        html = '<footer class="pn-master-footer"><section id="' + id + '"><div class="pn-container">' +
          '<strong>' + text(section.businessName) + '</strong><p>' +
          (section.tagline ? text(section.tagline) : 'Todos os direitos reservados.') +
          '</p></div></section></footer>';
        break;
      default:
        html = '<div class="pn-master-generic">' + renderStandardSection(section) + '</div>';
    }
    // Same edit keys as the standard renderer: inline typography edits are
    // persisted in SiteSchema and survive publishing and ZIP export.
    return section.type === 'footer' || !['hero', 'benefits', 'services', 'about', 'process', 'faq', 'cta'].includes(section.type)
      ? html : applyEdits(html, section.id, model);
  };
  const sectionHtml = visible.map(render).join('\n');
  return '<div class="pn-universal" style="--pn-primary:' + esc(model.theme.colors.primary) + '">' +
    header + '<main id="conteudo">' + sectionHtml + '</main></div>';
}
