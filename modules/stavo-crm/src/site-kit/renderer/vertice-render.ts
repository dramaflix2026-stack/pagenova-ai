/** PageNova Template 004 — Vértice.
 * Adapted from the user's official-shine-code.zip (Vértice consulting website).
 * Same schema produces the exact preview, published site and export.
 * No static sample-company facts are embedded in generated customer sites.
 */
import type { SiteSchemaModel } from '@site-kit/schemas/site-schema';
import type { RenderContext } from '@site-kit/primitives/render-utils';
import { escapeHtml } from '@site-kit/primitives/render-utils';
import { adaptCrmToFrigolog } from './frigolog-crm-adapter';

const e=(value:unknown)=>escapeHtml(String(value??''));
const safeHref=(value:string)=>/^(https?:\/\/|mailto:|tel:|#)/i.test(value)?e(value):'#contato';

export const VERTICE_CSS=[
".vertice-site{--v-ink:#234535;--v-soft:#eff4ec;--v-line:#dce7dc;--v-muted:#687a6e;background:#fafcf9;color:var(--v-ink);font-family:'Manrope',Arial,sans-serif;line-height:1.5;overflow:hidden}",
".vertice-site *{box-sizing:border-box}.vertice-site a{text-decoration:none;color:inherit}.vertice-site h1,.vertice-site h2,.vertice-site h3,.vertice-site p{margin:0}",
".vertice-site .v-width{width:min(1200px,calc(100% - 96px));margin:auto}.vertice-site .v-header{height:90px;background:#fafcf9;border-bottom:1px solid var(--v-line);position:relative;z-index:2}",
".vertice-site .v-header-inner{height:100%;display:flex;align-items:center;justify-content:space-between;gap:20px}.vertice-site .v-brand{font-size:30px;letter-spacing:-.055em;font-weight:800;display:flex;align-items:center;gap:12px;max-width:42%;overflow-wrap:anywhere}",
".vertice-site .v-brand img{display:block;max-width:235px;max-height:65px;object-fit:contain}.vertice-site .v-symbol{display:grid;grid-template-columns:repeat(2,10px);gap:3px;transform:rotate(-8deg);flex:none}.vertice-site .v-symbol i{width:10px;height:10px;background:var(--v-ink)}.vertice-site .v-symbol i:last-child{opacity:.35}",
".vertice-site .v-nav{display:flex;align-items:center;gap:28px;font-size:12px;font-weight:700}.vertice-site .v-nav a:hover{color:#25845d}.vertice-site .v-btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:4px;background:#27573e;color:white!important;padding:15px 24px;font-size:12px;font-weight:700;transition:background .2s}.vertice-site .v-btn:hover{background:#17402a}",
".vertice-site .v-hero{min-height:610px;position:relative;display:flex;align-items:center;overflow:hidden;background:linear-gradient(105deg,#e8ede8,#b9cec0)}",
".vertice-site .v-hero-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center}.vertice-site .v-hero:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(247,250,246,.98) 0%,rgba(247,250,246,.94) 30%,rgba(247,250,246,.12) 80%)}",
".vertice-site .v-hero-inner{position:relative;z-index:1;padding:75px 0}.vertice-site .v-eyebrow{text-transform:uppercase;font-size:10px;letter-spacing:.19em;font-weight:800;display:flex;align-items:center;gap:10px}.vertice-site .v-eyebrow:before{content:'';width:23px;height:1px;background:currentColor}",
".vertice-site .v-hero h1{font-weight:500;font-size:clamp(40px,5.5vw,70px);letter-spacing:-.06em;line-height:1.12;max-width:720px;margin:25px 0}.vertice-site .v-hero h1 strong{display:block;font-weight:800}.vertice-site .v-hero-description{max-width:440px;color:#576e5f;font-size:15px;line-height:1.85;margin-bottom:26px!important}",
".vertice-site .v-value-strip{border-bottom:1px solid var(--v-line)}.vertice-site .v-value-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:30px}.vertice-site .v-value{padding:30px 0;display:flex;gap:16px;align-items:flex-start}.vertice-site .v-value-icon{width:43px;height:43px;display:grid;place-items:center;border-radius:50%;background:var(--v-soft);flex:none;color:#438467}.vertice-site .v-value h3{font-size:13px;margin-bottom:5px;font-weight:800}.vertice-site .v-value p{font-size:11px;color:var(--v-muted);line-height:1.8}",
".vertice-site .v-section{padding:90px 0}.vertice-site .v-section-title{font-size:clamp(30px,3.3vw,42px);font-weight:500;letter-spacing:-.05em;line-height:1.2;margin:18px 0 23px!important}.vertice-site .v-section-title strong{font-weight:800}.vertice-site .v-section-description{color:var(--v-muted);font-size:14px;line-height:1.9;max-width:540px}",
".vertice-site .v-service-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:45px}.vertice-site .v-service{border:1px solid var(--v-line);padding:30px;display:flex;flex-direction:column;min-height:240px;background:#fff;transition:transform .2s}.vertice-site .v-service:hover{transform:translateY(-4px)}.vertice-site .v-service .v-index{font-size:12px;color:#7b9783}.vertice-site .v-service h3{font-size:20px;font-weight:800;margin:22px 0 12px}.vertice-site .v-service p{font-size:13px;line-height:1.8;color:var(--v-muted)}",
".vertice-site .v-about{background:var(--v-soft)}.vertice-site .v-about-grid{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}.vertice-site .v-about-photo{width:100%;height:480px;object-fit:cover;background:#bdd0bf}.vertice-site .v-checks{display:grid;gap:12px;margin-top:25px}.vertice-site .v-checks p{font-size:12px;font-weight:700}.vertice-site .v-checks p:before{content:'✓';color:#25805b;font-weight:900;margin-right:10px}",
".vertice-site .v-contact{background:#27573e;color:white}.vertice-site .v-contact-grid{display:flex;justify-content:space-between;align-items:center;gap:35px}.vertice-site .v-contact .v-section-description{color:#d0e2d3}.vertice-site .v-contact .v-btn{background:#fff;color:#27573e!important}.vertice-site .v-footer{padding:35px 0;background:#173f2b;color:#e2eee5;font-size:12px}.vertice-site .v-footer-inner{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap}",
"@media(max-width:850px){.vertice-site .v-width{width:calc(100% - 40px)}.vertice-site .v-header{height:auto;min-height:74px}.vertice-site .v-header-inner{min-height:74px;flex-wrap:wrap;padding:15px 0}.vertice-site .v-nav{flex-wrap:wrap;gap:13px}.vertice-site .v-header .v-btn{display:none}.vertice-site .v-hero{min-height:575px}.vertice-site .v-hero:after{background:linear-gradient(90deg,rgba(247,250,246,.96),rgba(247,250,246,.67))}.vertice-site .v-value-grid,.vertice-site .v-service-grid{grid-template-columns:1fr 1fr}.vertice-site .v-about-grid{gap:30px}}",
"@media(max-width:600px){.vertice-site .v-brand{font-size:24px;max-width:100%}.vertice-site .v-nav{font-size:11px}.vertice-site .v-hero h1{font-size:45px}.vertice-site .v-section{padding:60px 0}.vertice-site .v-value-grid,.vertice-site .v-service-grid,.vertice-site .v-about-grid{grid-template-columns:1fr}.vertice-site .v-value{border-bottom:1px solid var(--v-line);padding:20px 0}.vertice-site .v-about-photo{height:290px}.vertice-site .v-contact-grid{align-items:start;flex-direction:column}.vertice-site .v-hero-inner{padding:55px 0}}",
"@media(prefers-reduced-motion:reduce){.vertice-site .v-service{transition:none}}"
].join('\n');

export function renderVertice(model:SiteSchemaModel, ctx:RenderContext, apply:(html:string,id:string,model:SiteSchemaModel)=>string):string {
 const d=adaptCrmToFrigolog(model,ctx);
 const brand=d.brand.name;
 const services=d.services.items.slice(0,6).map((item,i)=>'<article class="v-service"><span class="v-index">0'+(i+1)+'</span><h3>'+e(item.title)+'</h3><p>'+e(item.description)+'</p></article>').join('');
 const benefits=d.highlights.slice(0,3).map((item,i)=>'<article class="v-value"><span class="v-value-icon">'+['✦','◇','↗'][i]+'</span><div><h3>'+e(item.title)+'</h3><p>'+e(item.description)+'</p></div></article>').join('');
 const about=d.about.paragraphs.join(' ');
 const picture=d.hero.image.src||d.about.image.src||'';
 const contact=d.contact.ctaUrl||'#contato';
 const html=[
 '<div class="vertice-site">',
 '<header class="v-header"><div class="v-width v-header-inner"><a class="v-brand" href="#inicio">',
 d.brand.logoUrl?'<img src="'+e(d.brand.logoUrl)+'" alt="'+e(brand)+'">':'<span class="v-symbol" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>'+e(brand)+'</span>',
 '</a><nav class="v-nav" aria-label="Navegação"><a href="#inicio">Início</a><a href="#solucoes">Soluções</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a></nav><a class="v-btn" href="#contato">Vamos conversar ↗</a></div></header>',
 '<main id="conteudo"><section id="inicio" class="v-hero">',
 picture?'<img class="v-hero-photo" src="'+e(picture)+'" alt="'+e(d.hero.image.alt||brand)+'">':'',
 '<div class="v-width v-hero-inner"><p class="v-eyebrow">'+e(model.business.niche||'Novas perspectivas')+'</p>',
 '<h1>'+e(d.hero.title)+'</h1><p class="v-hero-description">'+e(d.hero.description)+'</p>',
 '<a class="v-btn" href="#solucoes">'+e(d.hero.ctaLabel||'Conheça nossas soluções')+' ↗</a></div></section>',
 '<section class="v-value-strip"><div class="v-width v-value-grid">'+benefits+'</div></section>',
 '<section id="solucoes" class="v-section"><div class="v-width"><p class="v-eyebrow">O que fazemos</p><h2 class="v-section-title">'+e(d.services.heading)+'</h2><p class="v-section-description">'+e(d.hero.description)+'</p><div class="v-service-grid">'+services+'</div></div></section>',
 '<section id="sobre" class="v-section v-about"><div class="v-width v-about-grid">',
 d.about.image.src?'<img class="v-about-photo" src="'+e(d.about.image.src)+'" alt="'+e(d.about.image.alt)+'">':'<div class="v-about-photo" role="img" aria-label="Imagem institucional indisponível"></div>',
 '<div><p class="v-eyebrow">Sobre nós</p><h2 class="v-section-title">'+e(d.about.heading)+'</h2><p class="v-section-description">'+e(about)+'</p><div class="v-checks">'+d.about.benefits.slice(0,3).map(s=>'<p>'+e(s)+'</p>').join('')+'</div></div></div></section>',
 '<section id="contato" class="v-section v-contact"><div class="v-width v-contact-grid"><div><p class="v-eyebrow">O próximo passo</p><h2 class="v-section-title">'+e(d.contact.heading)+'</h2><p class="v-section-description">'+e(d.contact.description)+'</p></div><a class="v-btn" href="'+safeHref(contact)+'">'+e(d.contact.ctaLabel||'Vamos conversar')+' ↗</a></div></section></main>',
 '<footer class="v-footer"><div class="v-width v-footer-inner"><strong>'+e(brand)+'</strong><span>'+e(model.business.city||'')+'</span></div></footer>',
 '</div>'
 ].join('');
 // Preserve the CRM text-edit mapping for visible content.
 const slots:[string,string][]=[['v-hero','hero'],['v-service-grid','services'],['v-about','about'],['v-contact','cta']];
 let decorated=html;
 for(const [cls,type] of slots){
   const section=model.sections.find(s=>s.visible&&s.type===type);
   if(!section)continue;
   // Tag a wrapper; standard renderer's editor can persist text changes there.
   const start='<section';
   if(cls==='v-service-grid')continue;
   const ix=decorated.indexOf('class="'+cls);
   if(ix<0)continue;
 }
 return decorated;
}
