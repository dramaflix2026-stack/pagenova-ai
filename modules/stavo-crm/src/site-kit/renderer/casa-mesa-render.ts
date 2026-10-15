/** Casa da Mesa restaurant family — adapted from supplied site-restaurante.zip.
 * The original fictional brand, dishes and prices are not used for real clients.
 * Same HTML is consumed by preview, publication and export.
 */
import type { SiteSchemaModel } from '@site-kit/schemas/site-schema';
import type { RenderContext } from '@site-kit/primitives/render-utils';
import { escapeHtml } from '@site-kit/primitives/render-utils';
import { adaptCrmToFrigolog } from './frigolog-crm-adapter';
const e=(v:unknown)=>escapeHtml(String(v??''));
const href=(v:string)=>/^(https?:\/\/|tel:|mailto:|#)/i.test(v)?e(v):'#contato';
export const CASA_CSS=[
".casa-mesa{font-family:'DM Sans',sans-serif;color:#293e30;background:#fcfcf8;line-height:1.6;overflow:hidden}.casa-mesa *{box-sizing:border-box}.casa-mesa a{color:inherit;text-decoration:none}.casa-mesa h1,.casa-mesa h2,.casa-mesa h3,.casa-mesa p{margin:0}",
".casa-mesa .cm-wrap{max-width:1280px;padding-inline:48px;margin-inline:auto}.casa-mesa .cm-header{height:88px;display:flex;align-items:center;justify-content:space-between;gap:24px}.casa-mesa .cm-brand{font:400 29px 'DM Serif Display',Georgia,serif;letter-spacing:-.025em}.casa-mesa .cm-brand img{max-height:65px;max-width:220px;object-fit:contain}.casa-mesa .cm-brand em{font-style:normal;color:#22563a}.casa-mesa nav{display:flex;align-items:center;gap:30px;font-size:13px}.casa-mesa nav a:hover{color:#226c48}.casa-mesa .cm-nav-cta{border:1px solid #22563a;padding:12px 19px;border-radius:5px;font-weight:600}",
".casa-mesa .cm-hero{min-height:540px;position:relative;display:flex;align-items:center;background:linear-gradient(110deg,#1d3425,#697764);color:white}.casa-mesa .cm-hero-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 55%}.casa-mesa .cm-hero:after{position:absolute;content:'';inset:0;background:linear-gradient(90deg,rgba(17,29,21,.87),rgba(17,29,21,.10))}.casa-mesa .cm-hero-content{position:relative;z-index:1;width:100%;padding-block:90px}.casa-mesa .cm-eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.18em;font-weight:700}.casa-mesa .cm-eyebrow:before{content:'—';margin-right:12px}",
".casa-mesa .cm-hero h1{font:400 clamp(43px,6vw,77px)/1.07 'DM Serif Display',Georgia,serif;margin:22px 0;max-width:730px;letter-spacing:-.035em}.casa-mesa .cm-hero p{max-width:420px;font-size:15px;line-height:1.8;margin-bottom:25px;color:#f3f2e9}.casa-mesa .cm-btn{display:inline-flex;align-items:center;justify-content:center;gap:12px;border:0;border-radius:5px;background:#fdfdf9;color:#293e30;padding:13px 23px;font-weight:700;font-size:13px}.casa-mesa .cm-btn:hover{filter:brightness(.94)}",
".casa-mesa .cm-values{display:flex;justify-content:center;flex-wrap:wrap;gap:clamp(20px,5vw,90px);border-bottom:1px solid #e4e8e0;padding:25px;font-size:12px}.casa-mesa .cm-values b{color:#245b3c;margin-right:10px}.casa-mesa .cm-menu{padding-block:70px}.casa-mesa .cm-section-heading{text-align:center}.casa-mesa .cm-section-heading .cm-eyebrow{color:#22563a}.casa-mesa .cm-menu h2,.casa-mesa .cm-about h2{font:400 clamp(33px,4vw,44px) 'DM Serif Display',Georgia,serif;margin:13px 0}.casa-mesa .cm-section-heading p{color:#798077;font-size:14px}",
".casa-mesa .cm-tabs{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin:32px auto}.casa-mesa .cm-tabs button{padding:10px 18px;border-radius:5px;border:0;cursor:pointer;background:transparent;font-size:13px;font-weight:600;color:#293e30}.casa-mesa .cm-tabs button[aria-selected=true]{background:#28563a;color:white}.casa-mesa .cm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:60px}.casa-mesa .cm-dish{padding:24px 0;border-top:1px solid #e2e7de}.casa-mesa .cm-dish[hidden]{display:none}.casa-mesa .cm-dish h3{font:400 23px 'DM Serif Display',Georgia,serif}.casa-mesa .cm-dish p{margin-top:9px;color:#798077;font-size:13px;line-height:1.8}.casa-mesa .cm-note{text-align:center;color:#798077;font-size:11px;margin-top:25px!important}",
".casa-mesa .cm-about{background:#f1f3ec;padding:65px 24px;text-align:center}.casa-mesa .cm-about p{font-size:14px;line-height:1.9;max-width:680px;margin:auto;color:#6f7b70}.casa-mesa .cm-contact{text-align:center;padding:70px 24px}.casa-mesa .cm-contact h2{font:400 38px 'DM Serif Display',serif;margin:12px 0}.casa-mesa .cm-contact p{font-size:14px;max-width:620px;margin:0 auto 22px;color:#6f7b70}.casa-mesa .cm-contact .cm-btn{background:#28563a;color:white}.casa-mesa .cm-footer{padding-block:34px;display:flex;align-items:center;justify-content:space-between;gap:20px;font-size:12px}.casa-mesa .cm-footer p{color:#798077}",
"@media(max-width:700px){.casa-mesa .cm-wrap{padding-inline:22px}.casa-mesa .cm-header{height:75px}.casa-mesa .cm-brand{font-size:23px}.casa-mesa nav{gap:13px;font-size:11px}.casa-mesa .cm-nav-cta{display:none}.casa-mesa .cm-hero{min-height:490px}.casa-mesa .cm-hero:after{background:rgba(17,29,21,.67)}.casa-mesa .cm-hero-content{padding-block:55px}.casa-mesa .cm-hero h1{font-size:47px}.casa-mesa .cm-values{font-size:10px;gap:14px}.casa-mesa .cm-values span:last-child{display:none}.casa-mesa .cm-menu{padding-block:50px}.casa-mesa .cm-tabs{gap:4px}.casa-mesa .cm-tabs button{font-size:12px;padding:10px 12px}.casa-mesa .cm-grid{grid-template-columns:1fr}.casa-mesa .cm-footer{flex-direction:column;text-align:center}}",
"@media(prefers-reduced-motion:reduce){.casa-mesa *{transition:none!important;scroll-behavior:auto!important}}"
].join('\n');
export const CASA_JS="(()=>{const root=document.querySelector('.casa-mesa');if(!root)return;const tabs=[...root.querySelectorAll('[data-category]')];tabs.forEach(tab=>tab.addEventListener('click',()=>{const key=tab.getAttribute('data-category');tabs.forEach(t=>t.setAttribute('aria-selected',String(t===tab)));root.querySelectorAll('[data-dish]').forEach(d=>{d.hidden=d.getAttribute('data-dish')!==key;});}));})();";
export function renderCasaMesa(model:SiteSchemaModel,ctx:RenderContext,apply:(html:string,id:string,model:SiteSchemaModel)=>string):string{
 const d=adaptCrmToFrigolog(model,ctx);
 const buckets=new Map<string,typeof d.services.items>();
 for(const item of d.services.items.slice(0,24)){
   const kind=/sobremesa|doce|bolo|pudim|sorvete/i.test(item.title)?'Sobremesas':/bebida|café|suco|drinks|refrigerante/i.test(item.title)?'Bebidas':/entrada|petisco|salada|aperitivo/i.test(item.title)?'Entradas':'Principais';
   const items=buckets.get(kind)||[];items.push(item);buckets.set(kind,items);
 }
 const groups=[...buckets.entries()],initial=groups[0]?.[0]||'Principais';
 const tabs=groups.map(([title])=>'<button type="button" role="tab" data-category="'+e(title)+'" aria-selected="'+String(title===initial)+'">'+e(title)+'</button>').join('');
 const entries=groups.flatMap(([title,items])=>items.map(item=>'<article class="cm-dish" data-dish="'+e(title)+'"'+(title===initial?'':' hidden')+'><h3>'+e(item.title)+'</h3><p>'+e(item.description)+'</p></article>')).join('');
 const title=e(d.brand.name),source=d.hero.image.src,link=href(d.contact.ctaUrl||'#contato');
 let html=[
 '<div class="casa-mesa"><header class="cm-header cm-wrap"><a href="#inicio" class="cm-brand">'+(d.brand.logoUrl?'<img src="'+e(d.brand.logoUrl)+'" alt="'+title+'">':title+'<em>.</em>')+'</a><nav aria-label="Navegação"><a href="#cardapio">Cardápio</a><a href="#sobre">Nossa casa</a><a class="cm-nav-cta" href="#contato">Fale conosco ↗</a></nav></header>',
 '<main id="conteudo"><section class="cm-hero" id="inicio" data-cm-slot="hero">'+(source?'<img class="cm-hero-photo" src="'+e(source)+'" alt="'+e(d.hero.image.alt)+'">':'')+'<div class="cm-wrap cm-hero-content"><div class="cm-eyebrow">Restaurante & bons encontros</div><h1>'+e(d.hero.title)+'</h1><p>'+e(d.hero.description)+'</p><a class="cm-btn" href="#cardapio">Explore o cardápio ↓</a></div></section>',
 '<div class="cm-values"><span><b>✦</b> Ingredientes especiais</span><span><b>♡</b> Bons encontros</span><span><b>♧</b> Sabores que acolhem</span></div>',
 '<section class="cm-menu cm-wrap" id="cardapio" data-cm-slot="services"><div class="cm-section-heading"><div class="cm-eyebrow">Da nossa cozinha para sua mesa</div><h2>'+e(d.services.heading)+'</h2><p>Conheça nossas especialidades e consulte preços e disponibilidade.</p></div>',
 groups.length?'<div class="cm-tabs" role="tablist">'+tabs+'</div><div class="cm-grid">'+entries+'</div>':'<p class="cm-note">O cardápio estará disponível em breve. Consulte o estabelecimento.</p>',
 '<p class="cm-note">Preços e disponibilidade são informados pelo restaurante. Nenhum valor fictício é exibido.</p></section>',
 '<section class="cm-about" id="sobre" data-cm-slot="about"><h2>'+e(d.about.heading)+'</h2><p>'+e(d.about.paragraphs.join(' '))+'</p></section>',
 '<section class="cm-contact" id="contato" data-cm-slot="cta"><div class="cm-eyebrow">Reservas e contato</div><h2>'+e(d.contact.heading)+'</h2><p>'+e(d.contact.description)+'</p><a class="cm-btn" href="'+link+'">'+e(d.contact.ctaLabel||'Entrar em contato')+' ↗</a></section></main>',
 '<footer class="cm-footer cm-wrap"><strong class="cm-brand">'+title+'</strong><p>'+e(model.business.city||'')+'</p><a href="#inicio">Voltar ao início ↑</a></footer></div>'
 ].join('');
 const types:Record<string,string>={hero:'hero',services:'services',about:'about',cta:'cta'};
 return html.replace(/(<section\b[^>]*data-cm-slot="([^"]+)"[^>]*>)([\s\S]*?)(<\/section>)/g,
 (_match:string,open:string,key:string,body:string,end:string)=>{
   const section=model.sections.find(x=>x.visible&&x.type===types[key]);
   return open+(section?apply(body,section.id,model):body)+end;
 });
}
