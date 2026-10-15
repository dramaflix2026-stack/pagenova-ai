/** Niche-specific SiteSchema HTML: restaurante and imobiliaria.
 * Reuses confirmed CRM business data; does not invent menu prices or actual real-estate inventory.
 */
import type { SiteSchemaModel } from '@site-kit/schemas/site-schema';
import type { RenderContext } from '@site-kit/primitives/render-utils';
import { escapeHtml } from '@site-kit/primitives/render-utils';
import { adaptCrmToFrigolog } from './frigolog-crm-adapter';

const e=(v:unknown):string=>escapeHtml(String(v??''));
const href=(v:string):string=>/^(https?:\/\/|mailto:|tel:|#)/i.test(v)?e(v):'#contato';
function photo(url:string,alt:string,cssClass:string){
 return url?'<img class="'+cssClass+'" src="'+e(url)+'" alt="'+e(alt)+'" loading="lazy" decoding="async">':'<div class="'+cssClass+' no-photo" role="img" aria-label="Imagem ainda não disponível"></div>';
}
export const NICHE_CSS=[
".pn-niche{font-family:'Manrope',Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.6;overflow:hidden}.pn-niche *{box-sizing:border-box}.pn-niche a{color:inherit;text-decoration:none}.pn-niche h1,.pn-niche h2,.pn-niche h3,.pn-niche p{margin:0}",
".pn-niche .n-wrap{max-width:1180px;margin:auto;padding-inline:28px}.pn-niche .n-head{display:flex;justify-content:space-between;align-items:center;gap:22px;min-height:88px}.pn-niche .n-brand{font-size:clamp(22px,3vw,32px);font-weight:800;letter-spacing:-.055em}.pn-niche .n-brand img{max-height:68px;max-width:235px;object-fit:contain}.pn-niche nav{display:flex;gap:22px;font-size:12px;font-weight:700;flex-wrap:wrap}.pn-niche nav a:hover{color:var(--accent)}",
".pn-niche .n-btn{display:inline-flex;justify-content:center;align-items:center;gap:9px;padding:14px 22px;background:var(--accent);color:var(--btntext);border:0;border-radius:9px;font-size:13px;font-weight:800;cursor:pointer}.pn-niche .n-btn:hover{filter:brightness(1.08)}.pn-niche .n-kicker{color:var(--accent);font-size:11px;text-transform:uppercase;letter-spacing:.17em;font-weight:800}",
".pn-niche .n-hero{min-height:570px;position:relative;display:flex;align-items:center;overflow:hidden;background:var(--hero)}.pn-niche .n-hero-photo{position:absolute;width:100%;height:100%;inset:0;object-fit:cover;opacity:.36}.pn-niche .n-hero:after{content:'';inset:0;position:absolute;background:linear-gradient(90deg,var(--hero) 8%,transparent 95%);pointer-events:none}.pn-niche .n-hero-inner{position:relative;z-index:1;padding-block:100px}.pn-niche .n-hero h1{font-family:'Manrope',Arial,sans-serif;font-size:clamp(42px,5.6vw,74px);font-weight:800;line-height:1.1;max-width:740px;letter-spacing:-.055em;margin:17px 0 19px}.pn-niche .n-hero p{max-width:540px;opacity:.82;font-size:16px;line-height:1.8;margin-bottom:28px}",
".pn-niche .n-section{padding:85px 0}.pn-niche .n-section h2{font-size:clamp(29px,4vw,45px);letter-spacing:-.05em;line-height:1.18;margin-top:13px}.pn-niche .n-lead{max-width:640px;color:var(--muted);font-size:14px;line-height:1.85;margin-top:17px!important}.pn-niche .n-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:19px;margin-top:35px}.pn-niche .n-card{padding:28px;background:var(--card);border:1px solid var(--border);border-radius:15px}.pn-niche .n-card h3{font-size:20px;letter-spacing:-.035em;margin:12px 0}.pn-niche .n-card p{font-size:13px;color:var(--muted);line-height:1.8}.pn-niche .n-count{font-size:12px;color:var(--accent);font-weight:800}",
".pn-niche .n-split{display:grid;grid-template-columns:1fr 1fr;gap:65px;align-items:center}.pn-niche .n-photo{width:100%;height:440px;object-fit:cover;border-radius:16px;background:var(--card)}.pn-niche .n-soft{background:var(--soft)}.pn-niche .n-contact{background:var(--contact);color:var(--contacttext)}.pn-niche .n-contact .n-lead{color:inherit;opacity:.8}.pn-niche .n-contact .n-btn{margin-top:25px}.pn-niche .n-footer{padding:35px 0;font-size:12px;background:var(--footer);color:var(--footertext)}.pn-niche .n-footer .n-wrap{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}",
".pn-restaurant{--ink:#f6efe2;--bg:#171b18;--hero:#14211c;--accent:#d5ab76;--btntext:#12251b;--card:#222d27;--border:#3d4c41;--muted:#bfcabe;--soft:#1c2a22;--contact:#ceb18b;--contacttext:#193026;--footer:#0d1610;--footertext:#e6dcc6}.pn-restaurant .n-card{border-radius:3px}.pn-restaurant .n-section h2{font-family:Georgia,serif;font-weight:400;font-size:clamp(37px,4vw,55px)}.pn-restaurant .n-hero h1{font-family:Georgia,serif;font-weight:400}.pn-restaurant .n-menu-list{display:grid;grid-template-columns:1fr 1fr;gap:14px 38px;margin-top:37px}.pn-restaurant .n-menu-row{padding:21px 0;border-bottom:1px solid var(--border)}.pn-restaurant .n-menu-row h3{font-size:19px;font-weight:700;margin:0 0 6px}.pn-restaurant .n-menu-row p{font-size:13px;color:var(--muted)}",
".pn-estate{--ink:#172b25;--bg:#f9f9f5;--hero:#173a30;--accent:#b68d53;--btntext:#15291e;--card:#fff;--border:#dfe7e2;--muted:#677972;--soft:#edf2ee;--contact:#153a30;--contacttext:#f1f7f1;--footer:#102b23;--footertext:#e3eee9}.pn-estate .n-hero{color:#fff}.pn-estate .n-hero h1{font-weight:500}.pn-estate .n-hero p{color:#e1e9e2}.pn-estate .n-property-intro{border:1px solid var(--border);background:var(--card);border-radius:20px;padding:27px;margin-top:30px}.pn-estate .n-property-tools{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.pn-estate .n-property-tools label{display:block;color:var(--muted);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.09em}.pn-estate .n-property-tools select{margin-top:9px;width:100%;border:1px solid var(--border);border-radius:9px;padding:13px;background:#fff;color:var(--ink)}.pn-estate .n-property-note{margin-top:15px!important;color:var(--muted);font-size:12px}.pn-estate .n-listing-empty{border:1px dashed #aabeb1;border-radius:16px;padding:37px;text-align:center;margin-top:25px;background:#fff}.pn-estate .n-listing-empty h3{font-size:23px;margin-bottom:9px}.pn-estate .n-listing-empty p{color:var(--muted);font-size:13px;max-width:480px;margin:0 auto 18px}",
"@media(max-width:850px){.pn-niche .n-head{flex-wrap:wrap;padding:16px 0}.pn-niche .n-hero-inner{padding-block:70px}.pn-niche .n-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pn-niche .n-split{gap:25px}.pn-niche .n-wrap{padding-inline:20px}}",
"@media(max-width:620px){.pn-niche .n-head nav{gap:12px}.pn-niche .n-hero{min-height:510px}.pn-niche .n-hero h1{font-size:43px}.pn-niche .n-section{padding:58px 0}.pn-niche .n-grid,.pn-niche .n-split,.pn-restaurant .n-menu-list,.pn-estate .n-property-tools{grid-template-columns:1fr}.pn-niche .n-photo{height:310px}.pn-niche .n-contact .n-btn{width:100%}}"
].join('\n');

export function renderNicheSite(model:SiteSchemaModel,ctx:RenderContext,kind:'restaurant'|'estate',apply:(html:string,id:string,model:SiteSchemaModel)=>string):string {
 const d=adaptCrmToFrigolog(model,ctx);
 const restaurant=kind==='restaurant';
 const brand=e(d.brand.name);
 const niche=restaurant?'Restaurante':'Imobiliária';
 const serviceHeading=restaurant?'Nosso cardápio':'Como podemos ajudar';
 const serviceList=d.services.items.slice(0,8);
 const cards=serviceList.map((item,i)=>'<article class="n-card"><span class="n-count">0'+(i+1)+'</span><h3>'+e(item.title)+'</h3><p>'+e(item.description)+'</p></article>').join('');
 const menu=serviceList.map(item=>'<div class="n-menu-row"><h3>'+e(item.title)+'</h3><p>'+e(item.description)+'</p></div>').join('');
 const address=model.business.address?.value||[model.business.city,model.business.state].filter(Boolean).join(', ');
 const contact=d.contact.ctaUrl||'#contato';
 const nav=restaurant?'<a href="#cardapio">Cardápio</a><a href="#sobre">Nossa história</a><a href="#contato">Reservas e contato</a>':'<a href="#imoveis">Imóveis</a><a href="#servicos">Serviços</a><a href="#contato">Contato</a>';
 const logo=d.brand.logoUrl?'<img src="'+e(d.brand.logoUrl)+'" alt="'+brand+'">':brand;
 const restContent=restaurant?[
 '<section id="cardapio" class="n-section" data-n-slot="services"><div class="n-wrap"><p class="n-kicker">Sabores e experiências</p><h2>'+e(d.services.heading||serviceHeading)+'</h2>',
 '<p class="n-lead">Conheça as especialidades apresentadas pelo estabelecimento. Consulte valores e disponibilidade diretamente com a equipe.</p><div class="n-menu-list">'+menu+'</div></div></section>',
 '<section id="sobre" class="n-section n-soft" data-n-slot="about"><div class="n-wrap n-split">',
 photo(d.about.image.src,d.about.image.alt,'n-photo'),
 '<div><p class="n-kicker">Nossa casa</p><h2>'+e(d.about.heading)+'</h2><p class="n-lead">'+e(d.about.paragraphs.join(' '))+'</p></div></div></section>'
 ].join(''):[
 '<section id="imoveis" class="n-section" data-n-slot="gallery"><div class="n-wrap"><p class="n-kicker">Encontre seu espaço</p><h2>Encontre o imóvel ideal</h2><p class="n-lead">Fale com a equipe para consultar os imóveis disponíveis e receber atendimento personalizado.</p>',
 '<div class="n-property-intro"><div class="n-property-tools"><label>Tipo de imóvel<select aria-label="Tipo de imóvel"><option>Todos os tipos</option><option>Casa</option><option>Apartamento</option><option>Comercial</option></select></label><label>Objetivo<select aria-label="Objetivo"><option>Comprar ou alugar</option><option>Comprar</option><option>Alugar</option></select></label><label>Localização<select aria-label="Localização"><option>Consultar regiões</option></select></label></div><p class="n-property-note">A vitrine é informativa. Para consultar imóveis e valores reais, fale com a equipe.</p></div>',
 '<div class="n-listing-empty"><h3>Seu próximo imóvel começa aqui.</h3><p>Confira opções disponíveis diretamente com a imobiliária. Não exibimos anúncios ou preços fictícios.</p><a class="n-btn" href="#contato">Consultar imóveis ↗</a></div></div></section>',
 '<section id="servicos" class="n-section n-soft" data-n-slot="services"><div class="n-wrap"><p class="n-kicker">Atendimento especializado</p><h2>'+e(d.services.heading||serviceHeading)+'</h2><div class="n-grid">'+cards+'</div></div></section>',
 '<section id="sobre" class="n-section" data-n-slot="about"><div class="n-wrap n-split">',
 photo(d.about.image.src,d.about.image.alt,'n-photo'),
 '<div><p class="n-kicker">Sobre nós</p><h2>'+e(d.about.heading)+'</h2><p class="n-lead">'+e(d.about.paragraphs.join(' '))+'</p></div></div></section>'
 ].join('');
 const html = [
 '<div class="pn-niche '+(restaurant?'pn-restaurant':'pn-estate')+'">',
 '<header><div class="n-wrap n-head"><a href="#inicio" class="n-brand">'+logo+'</a><nav aria-label="Navegação principal">'+nav+'</nav></div></header>',
 '<main><section id="inicio" class="n-hero" data-n-slot="hero">',
 d.hero.image.src?'<img class="n-hero-photo" src="'+e(d.hero.image.src)+'" alt="'+e(d.hero.image.alt)+'">':'',
 '<div class="n-wrap n-hero-inner"><p class="n-kicker">'+niche+(address?' · '+e(address):'')+'</p><h1>'+e(d.hero.title)+'</h1><p>'+e(d.hero.description)+'</p><a class="n-btn" href="#'+(restaurant?'cardapio':'imoveis')+'">'+e(d.hero.ctaLabel||'Conheça mais')+' ↗</a></div></section>',
 restContent,
 '<section id="contato" class="n-section n-contact" data-n-slot="cta"><div class="n-wrap"><p class="n-kicker">Fale com a equipe</p><h2>'+e(d.contact.heading)+'</h2><p class="n-lead">'+e(d.contact.description)+'</p>',
 address?'<p class="n-lead">'+e(address)+'</p>':'',
 '<a class="n-btn" href="'+href(contact)+'">'+e(d.contact.ctaLabel||'Entrar em contato')+' ↗</a></div></section></main>',
 '<footer class="n-footer"><div class="n-wrap"><strong>'+brand+'</strong><span>'+e(address)+'</span></div></footer>',
 '</div>'
 ].join('');
 // Bind section-level text edits consistently with preview, published HTML and export.
 const slots:Record<string,string>={hero:'hero',services:'services',about:'about',gallery:'gallery',cta:'cta'};
 return html.replace(/(<section\b[^>]*\bdata-n-slot="([^"]+)"[^>]*>)([\s\S]*?)(<\/section>)/g,
  (match:string,open:string,slot:string,inner:string,close:string)=>{
   const section=model.sections.find(x=>x.visible&&x.type===slots[slot]);
   return section?open+apply(inner,section.id,model)+close:match;
  });
}
