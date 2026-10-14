/**
 * Template 003: Atelier Norte.
 * Adapted from the uploaded Lovable TanStack source:
 * Layout.tsx, index.tsx, sobre.tsx, servicos.tsx, contato.tsx, styles.css.
 * Its original cream/terracotta palette, Instrument Serif / Work Sans typography,
 * 4 pages and editorial composition are retained. All brand facts are supplied
 * by the same validated CRM SiteSchema as the other PageNova templates.
 */
import type { SiteSchemaModel, SiteSection } from '@site-kit/schemas/site-schema';
import type { RenderContext } from '@site-kit/primitives/render-utils';
import { escapeHtml } from '@site-kit/primitives/render-utils';
import { adaptCrmToFrigolog } from './frigolog-crm-adapter';

const esc=(value:unknown):string=>escapeHtml(String(value??''));
function emphasize(value:string):string {
  const words=value.trim().split(/\s+/).filter(Boolean);
  if(words.length<2)return '<em>'+esc(value)+'</em>';
  const cut=words.length>7?words.length-2:words.length-1;
  return esc(words.slice(0,cut).join(' '))+' <em>'+esc(words.slice(cut).join(' '))+'</em>';
}
function photo(url:string,alt:string,shape:string):string {
  return url?'<img loading="lazy" decoding="async" class="at-photo '+shape+'" src="'+esc(url)+'" alt="'+esc(alt)+'">'
    :'<div class="at-photo at-empty '+shape+'" role="img" aria-label="Imagem indisponível"></div>';
}
const typeBySlot:Record<string,SiteSection['type']>={
  'at-home-hero':'hero','at-home-services':'services','at-home-about':'about',
  'at-about-story':'about','at-services':'services','at-contact':'cta'
};
function bindEdits(html:string,model:SiteSchemaModel,
  apply:(html:string,id:string,model:SiteSchemaModel)=>string):string {
  return html.replace(/(<section\b[^>]*\bdata-at-slot="([^"]+)"[^>]*>)([\s\S]*?)(<\/section>)/g,
    (match:string,head:string,slot:string,body:string,tail:string)=>{
      const type=typeBySlot[slot];
      const section=model.sections.find(s=>s.visible&&s.type===type);
      return section?head+apply(body,section.id,model)+tail:match;
    });
}
export function renderAtelierNorte(model:SiteSchemaModel,ctx:RenderContext,
  apply:(html:string,id:string,model:SiteSchemaModel)=>string):string {
  const d=adaptCrmToFrigolog(model,ctx);
  const brand=d.brand.name;
  const nameWords=brand.split(/\s+/);
  const brandLabel=nameWords.length>1?esc(nameWords.slice(0,-1).join(' '))+' <em>'+esc(nameWords.at(-1))+'</em>':esc(brand);
  const place=[model.business.city,model.business.state].filter(Boolean).join(', ');
  const email=model.business.email?.value||'';
  const telephone=model.business.phoneE164?.value||model.business.whatsappE164?.value||'';
  const address=model.business.address?.value||place;
  const whatsApp=model.business.whatsappE164?.value||'';
  const url=d.contact.ctaUrl==='#contato'?'#contato':d.contact.ctaUrl;
  const nav=[['inicio','Início'],['sobre','Sobre'],['servicos','Serviços'],['contato','Contato']]
    .map(([id,label])=>'<a data-at-link="'+id+'" href="#'+id+'">'+label+'</a>').join('');
  const pillars=d.services.items.slice(0,3).map((item,i)=>
    '<article class="at-pillar"><span class="at-number">0'+(i+1)+'</span><h3>'+esc(item.title)+'</h3><p>'+esc(item.description)+'</p></article>'
  ).join('');
  const highlights=d.highlights.slice(0,3).map(item=>
    '<div><strong>'+esc(item.title)+'</strong><small>'+esc(item.description)+'</small></div>'
  ).join('');
  const steps=(d.coverage.steps?.length?d.coverage.steps:d.highlights.slice(0,3))
    .slice(0,4).map((item,i)=>'<li><span>0'+(i+1)+'</span><p>'+esc(item.title)+(item.description?' — '+esc(item.description):'')+'</p></li>').join('');
  const values=d.about.benefits.slice(0,4).map((value,i)=>
    '<article class="at-value"><span class="at-number">0'+(i+1)+'</span><p>'+esc(value)+'</p></article>'
  ).join('');
  const services=d.services.items.map((item,i)=>
    '<article class="at-service"><span class="at-number">0'+(i+1)+'</span><h2>'+esc(item.title)+'</h2><div><p>'+esc(item.description)+'</p><div class="at-tags"><span>'+esc(model.business.niche||'Atendimento')+'</span></div></div></article>'
  ).join('');
  const contactDetails=[
    email?'<div><dt>E-mail</dt><dd><a href="mailto:'+esc(email)+'">'+esc(email)+'</a></dd></div>':'',
    telephone?'<div><dt>Telefone</dt><dd>'+esc(telephone)+'</dd></div>':'',
    address?'<div><dt>Localização</dt><dd>'+esc(address)+'</dd></div>':'',
  ].join('');
  const lead=esc(email||telephone||address||'Entre em contato');
  const html=[
   '<div class="atelier-site">',
   '<header class="at-header"><div class="at-container at-header-inner">',
   '<a href="#inicio" class="at-logo">'+(d.brand.logoUrl?'<img class="at-logo-image" src="'+esc(d.brand.logoUrl)+'" alt="'+esc(brand)+'">':brandLabel)+'</a>',
   '<nav aria-label="Navegação principal">'+nav+'</nav></div></header>',
   '<main id="conteudo">',
   '<div data-at-view="inicio" class="at-view">',
   '<section class="at-container at-home-hero" data-at-slot="at-home-hero">',
   '<p class="at-eyebrow">'+esc(model.business.niche||'Serviços')+(place?' · '+esc(place):'')+'</p>',
   '<h1>'+emphasize(d.hero.title)+'</h1>',
   '<div class="at-home-intro"><p>'+esc(d.hero.description)+'</p><a href="'+esc(url)+'" class="at-btn">'+esc(d.hero.ctaLabel)+'</a></div>',
   '</section>',
   '<div class="at-container at-photo-block">'+photo(d.hero.image.src,d.hero.image.alt,'at-wide')+'</div>',
   '<section class="at-container at-pillars" data-at-slot="at-home-services">'+pillars+'</section>',
   '<section class="at-container at-feature" data-at-slot="at-home-about">',
   photo(d.about.image.src||d.coverage.image.src,d.about.image.alt,'at-portrait'),
   '<div><blockquote>“'+emphasize(d.about.heading)+'”</blockquote>',
   '<p class="at-muted at-feature-description">'+esc(d.about.paragraphs[0])+'</p>',
   '<div class="at-highlights">'+highlights+'</div><a class="at-btn-ghost" href="#sobre">Nossa história →</a></div></section>',
   '</div>',
   '<div class="at-view" data-at-view="sobre" hidden>',
   '<section class="at-container at-inner-hero"><p class="at-eyebrow">Sobre nós</p><h1>'+emphasize(d.about.heading)+'</h1></section>',
   '<section class="at-container at-story" data-at-slot="at-about-story">',
   photo(d.about.image.src||d.coverage.image.src,d.about.image.alt,'at-portrait'),
   '<div><h2>Nossa trajetória</h2><p class="at-muted">'+esc(d.about.paragraphs.join(' '))+'</p><ol class="at-timeline">'+steps+'</ol></div></section>',
   '<section class="at-container at-values"><h2>O que nos guia</h2><div>'+values+'</div></section>',
   '</div>',
   '<div class="at-view" data-at-view="servicos" hidden>',
   '<section class="at-container at-inner-hero"><p class="at-eyebrow">Serviços</p><h1>'+emphasize(d.services.heading)+'</h1></section>',
   '<section class="at-container at-service-list" data-at-slot="at-services">'+services+'</section>',
   '<div class="at-container at-invite"><h2>Tem um projeto em mente?</h2><a href="#contato" class="at-btn">Vamos conversar</a></div>',
   '</div>',
   '<div class="at-view" data-at-view="contato" hidden>',
   '<section class="at-container at-contact" data-at-slot="at-contact">',
   '<div><p class="at-eyebrow">Contato</p><h1>'+emphasize(d.contact.heading)+'</h1>',
   '<p class="at-muted">'+esc(d.contact.description)+'</p><dl>'+contactDetails+'</dl></div>',
   '<form class="at-form" data-at-form data-email="'+esc(email)+'" data-whatsapp="'+esc(whatsApp)+'">',
   '<label>Nome<input name="nome" placeholder="Nome" required autocomplete="name"></label>',
   '<label>E-mail<input name="email" type="email" placeholder="E-mail" required autocomplete="email"></label>',
   '<label>Empresa<input name="empresa" placeholder="Empresa"></label>',
   '<label>Mensagem<textarea name="mensagem" rows="6" placeholder="Conte sobre seu projeto" required></textarea></label>',
   '<button class="at-btn" type="submit">Preparar mensagem</button>',
   '<small>O envio será confirmado no seu e-mail ou WhatsApp.</small>',
   '</form></section></div></main>',
   '<footer class="at-footer"><div class="at-container"><p>Vamos construir algo <em>juntos?</em></p>',
   '<a href="#contato">Iniciar uma conversa →</a><div class="at-footer-bottom"><span>© '+new Date().getFullYear()+' '+esc(brand)+'</span><span>'+lead+'</span></div>',
   '</div></footer></div>'
  ].join('');
  return bindEdits(html,model,apply);
}
export const ATELIER_NORTE_CSS=[
'.atelier-site{--at-bg:oklch(.965 .012 80);--at-ink:oklch(.22 .015 50);--at-accent:oklch(.56 .14 40);--at-soft:oklch(.92 .02 75);--at-border:oklch(.22 .015 50 / 15%);font:16px/1.5 "Work Sans",sans-serif;color:var(--at-ink);background:var(--at-bg);min-height:100vh;overflow-x:clip}',
'.atelier-site *{box-sizing:border-box}.atelier-site a{text-decoration:none;color:inherit}.atelier-site h1,.atelier-site h2,.atelier-site h3,.atelier-site blockquote,.atelier-site .at-logo,.atelier-site .at-footer p,.atelier-site .at-value p,.atelier-site .at-highlights strong,.atelier-site dd{font-family:"Instrument Serif",Georgia,serif;font-weight:400;letter-spacing:-.01em}.atelier-site h1,.atelier-site h2,.atelier-site h3,.atelier-site p,.atelier-site blockquote{margin:0}.atelier-site em{font-weight:400;color:var(--at-accent)}',
'.atelier-site .at-logo-image{display:block;max-height:66px;max-width:min(240px,100%);width:auto;height:auto;object-fit:contain}.atelier-site .at-container{width:min(100% - 48px,1152px);margin-inline:auto}.atelier-site .at-header{border-bottom:1px solid var(--at-border)}.atelier-site .at-header-inner{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-block:20px}.atelier-site .at-logo{font-size:27px;overflow-wrap:anywhere}.atelier-site nav{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:20px;font-size:14px}.atelier-site nav a{color:oklch(.48 .02 55)}.atelier-site nav a:hover,.atelier-site nav a[aria-current="page"]{color:var(--at-ink);text-decoration:underline;text-decoration-color:var(--at-accent);text-underline-offset:8px}',
'.atelier-site .at-eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.25em;color:oklch(.48 .02 55)}.atelier-site .at-home-hero{padding-top:96px}.atelier-site .at-home-hero h1{font-size:clamp(60px,8vw,112px);line-height:.95;margin-top:24px;overflow-wrap:anywhere}.atelier-site .at-home-intro{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-top:40px}.atelier-site .at-home-intro p{max-width:450px;font-size:18px;color:oklch(.48 .02 55)}.atelier-site .at-btn,.atelier-site .at-btn-ghost{display:inline-flex;justify-content:center;align-items:center;gap:8px;padding:14px 28px;font-size:15px;font-weight:600;background:var(--at-accent);color:oklch(.98 .01 80);border-radius:999px;border:0;cursor:pointer;white-space:normal;text-align:center;transition:filter .2s,transform .2s}.atelier-site .at-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}.atelier-site .at-btn-ghost{background:transparent;color:var(--at-ink);border:1px solid var(--at-border)}',
'.atelier-site .at-photo-block{margin-top:64px}.atelier-site .at-photo{width:100%;display:block;object-fit:cover;border-radius:4px;background:var(--at-soft)}.atelier-site .at-wide{aspect-ratio:16/9}.atelier-site .at-portrait{aspect-ratio:4/5}.atelier-site .at-empty{background:linear-gradient(140deg,var(--at-soft),#d6c9b8)}.atelier-site .at-pillars{margin-top:96px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-block:1px solid var(--at-border)}.atelier-site .at-pillar{padding:40px 32px}.atelier-site .at-pillar:first-child{padding-left:0}.atelier-site .at-number{color:var(--at-accent);font-size:14px}.atelier-site .at-pillar h3{font-size:34px;margin-top:12px}.atelier-site .at-pillar p{margin-top:12px;color:oklch(.48 .02 55)}',
'.atelier-site .at-feature{margin-top:96px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:center;gap:48px}.atelier-site blockquote{font-size:clamp(36px,4vw,52px);line-height:1.12}.atelier-site .at-muted{color:oklch(.48 .02 55)}.atelier-site .at-feature-description{font-size:14px;line-height:1.8;margin-top:24px}.atelier-site .at-highlights{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;border-top:1px solid var(--at-border);padding-top:32px;margin-top:48px}.atelier-site .at-highlights strong{display:block;font-size:28px;overflow-wrap:anywhere}.atelier-site .at-highlights small{display:block;font-size:12px;color:oklch(.48 .02 55);margin-top:6px}.atelier-site .at-feature .at-btn-ghost{margin-top:40px}',
'.atelier-site .at-inner-hero{padding-top:64px}.atelier-site .at-inner-hero h1,.atelier-site .at-contact h1{font-size:clamp(60px,7vw,96px);line-height:.95;max-width:960px;margin-top:24px;overflow-wrap:anywhere}.atelier-site .at-story{margin-top:80px;display:grid;grid-template-columns:1fr 1.2fr;gap:48px}.atelier-site .at-story h2,.atelier-site .at-values h2{font-size:44px}.atelier-site .at-story .at-muted{margin-top:18px;line-height:1.8}.atelier-site .at-timeline{list-style:none;margin:32px 0 0;padding:0}.atelier-site .at-timeline li{display:grid;grid-template-columns:80px 1fr;gap:16px;border-top:1px solid var(--at-border);padding:24px 0}.atelier-site .at-timeline span{font:28px "Instrument Serif",serif;color:var(--at-accent)}.atelier-site .at-timeline p{color:oklch(.48 .02 55)}.atelier-site .at-values{margin-top:96px}.atelier-site .at-values>div{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:32px}.atelier-site .at-value{border:1px solid var(--at-border);border-radius:4px;background:oklch(.985 .008 80);padding:24px}.atelier-site .at-value p{font-size:26px;line-height:1.15;margin-top:24px}',
'.atelier-site .at-service-list{margin-top:80px;border-bottom:1px solid var(--at-border)}.atelier-site .at-service{display:grid;grid-template-columns:80px 1fr 1fr;gap:24px;padding:40px 0;border-top:1px solid var(--at-border)}.atelier-site .at-service h2{font-size:clamp(34px,4vw,52px);line-height:1.15}.atelier-site .at-service p{color:oklch(.48 .02 55)}.atelier-site .at-service .at-number{font:32px "Instrument Serif",serif}.atelier-site .at-tags{margin-top:16px;display:flex;gap:8px;flex-wrap:wrap}.atelier-site .at-tags span{border-radius:999px;border:1px solid var(--at-border);padding:4px 12px;font-size:12px}.atelier-site .at-invite{margin-top:64px;padding:64px 40px;text-align:center;background:var(--at-soft);border-radius:4px}.atelier-site .at-invite h2{font-size:44px}.atelier-site .at-invite .at-btn{margin-top:24px}',
'.atelier-site .at-contact{padding-top:64px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:64px}.atelier-site .at-contact .at-muted{margin-top:24px;max-width:390px}.atelier-site .at-contact dl{margin-top:48px;display:grid;gap:24px}.atelier-site .at-contact dt{font-size:14px;color:oklch(.48 .02 55)}.atelier-site .at-contact dd{font-size:28px;margin:0;overflow-wrap:anywhere}.atelier-site .at-form{display:grid;gap:20px;align-self:end}.atelier-site .at-form label{display:grid;gap:6px;font-size:12px;color:oklch(.48 .02 55)}.atelier-site .at-form input,.atelier-site .at-form textarea{width:100%;border:1px solid var(--at-border);border-radius:2px;background:var(--at-soft);padding:12px 16px;font:16px "Work Sans",sans-serif;color:var(--at-ink)}.atelier-site .at-form input:focus,.atelier-site .at-form textarea:focus{outline:1px solid var(--at-accent)}.atelier-site .at-form small{font-size:12px;color:oklch(.48 .02 55)}.atelier-site .at-form .at-btn{width:100%}',
'.atelier-site .at-footer{margin-top:112px;background:var(--at-ink);color:var(--at-bg)}.atelier-site .at-footer>.at-container{padding:64px 0}.atelier-site .at-footer p{font-size:clamp(38px,5vw,65px);line-height:1.1}.atelier-site .at-footer>a,.atelier-site .at-footer .at-container>a{display:inline-block;border-bottom:1px solid var(--at-accent);padding-bottom:4px;margin-top:24px;font-size:14px}.atelier-site .at-footer-bottom{border-top:1px solid oklch(.965 .012 80 / 20%);margin-top:64px;padding-top:24px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;opacity:.7;font-size:12px}.atelier-site [hidden]{display:none!important}',
'@media(max-width:767px){.atelier-site .at-container{width:min(100% - 40px,1152px)}.atelier-site .at-header-inner{flex-wrap:wrap}.atelier-site .at-logo{font-size:22px}.atelier-site nav{gap:12px;font-size:12px}.atelier-site .at-home-hero{padding-top:64px}.atelier-site .at-home-hero h1,.atelier-site .at-inner-hero h1,.atelier-site .at-contact h1{font-size:clamp(50px,11vw,68px)}.atelier-site .at-home-intro{flex-direction:column;align-items:flex-start;gap:24px}.atelier-site .at-photo-block{margin-top:48px}.atelier-site .at-pillars{grid-template-columns:1fr;margin-top:72px}.atelier-site .at-pillar{padding:24px 0;border-bottom:1px solid var(--at-border)}.atelier-site .at-pillar:last-child{border-bottom:0}.atelier-site .at-feature,.atelier-site .at-story,.atelier-site .at-contact{grid-template-columns:1fr;gap:32px;margin-top:72px}.atelier-site blockquote{font-size:38px}.atelier-site .at-highlights{gap:12px}.atelier-site .at-inner-hero{padding-top:48px}.atelier-site .at-values{margin-top:72px}.atelier-site .at-values>div{grid-template-columns:repeat(2,minmax(0,1fr))}.atelier-site .at-service-list{margin-top:56px}.atelier-site .at-service{grid-template-columns:48px 1fr;gap:16px}.atelier-site .at-service>div{grid-column:2}.atelier-site .at-invite{padding:42px 20px}.atelier-site .at-invite h2{font-size:36px}.atelier-site .at-contact{padding-top:48px}.atelier-site .at-footer{margin-top:80px}}',
'@media(prefers-reduced-motion:reduce){.atelier-site *{transition:none!important}}'
].join('');
export const ATELIER_NORTE_RUNTIME=[
'(function(){',
'var root=document.querySelector(".atelier-site");if(!root)return;',
'var views=Array.from(root.querySelectorAll("[data-at-view]"));',
'var links=Array.from(root.querySelectorAll("[data-at-link]"));',
'function show(){var page=location.hash.slice(1);if(!["inicio","sobre","servicos","contato"].includes(page))page="inicio";',
'views.forEach(function(v){v.hidden=v.getAttribute("data-at-view")!==page});',
'links.forEach(function(a){if(a.getAttribute("data-at-link")===page)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});',
'window.scrollTo(0,0);}',
'window.addEventListener("hashchange",show);show();',
'var form=root.querySelector("[data-at-form]");if(!form)return;',
'form.addEventListener("submit",function(ev){ev.preventDefault();var d=new FormData(form);',
'var body=["Nome: "+d.get("nome"),"Email: "+d.get("email"),"Empresa: "+d.get("empresa"),String(d.get("mensagem")||"")].join("\\n");',
'var email=form.getAttribute("data-email")||"";var phone=(form.getAttribute("data-whatsapp")||"").replace(/\\D/g,"");',
'if(email)location.href="mailto:"+encodeURIComponent(email)+"?subject=Contato pelo site&body="+encodeURIComponent(body);',
'else if(phone)window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(body),"_blank","noopener");',
'else window.alert("Entre em contato pelos canais informados na página.");',
'});})();'
].join('');
