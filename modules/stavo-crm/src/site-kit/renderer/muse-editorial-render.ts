/**
 * PageNova Template 2 — Muse Editorial.
 *
 * Adapted from the user's template-muse-62.zip (FORMA/TanStack sample).
 * Preserves the large typographic opening, photo-led hero, asymmetric portfolio,
 * studio band, editorial process and red contact finale, without bundling a
 * second SPA/router into generated sites. All copy/images come from SiteSchema.
 *
 * This renderer is shared by preview, editor, published HTML and ZIP export.
 */
import type { SiteSchemaModel, SiteSection } from '@site-kit/schemas/site-schema';
import type { RenderContext } from '@site-kit/primitives/render-utils';
import { escapeHtml } from '@site-kit/primitives/render-utils';
import { adaptCrmToFrigolog } from './frigolog-crm-adapter';

const esc=(value:string|undefined|null):string=>escapeHtml(value||'');
const editorialHeading=(value:string):string=>value.trim().replace(/\.$/,'')+'.';

const MUSE_CSS = String.raw`
.muse-site{--m-ink:#252525;--m-red:#df321e;--m-muted:#777;--m-border:#dfdfdf;--m-soft:#f4f4f4;font-family:'Epilogue',Arial,sans-serif;color:var(--m-ink);background:#fff;width:100%;overflow:hidden;line-height:1.45;-webkit-font-smoothing:antialiased}
.muse-site *, .muse-site *:before,.muse-site *:after{box-sizing:border-box}
.muse-site a{color:inherit;text-decoration:none}.muse-site a:focus-visible,.muse-site summary:focus-visible{outline:3px solid var(--m-red);outline-offset:5px}
.muse-site h1,.muse-site h2,.muse-site h3,.muse-site p{margin:0}
.muse-site h1,.muse-site h2,.muse-site h3{font-family:'Urbanist',Arial,sans-serif;font-weight:600}
.muse-site .gutter{padding-left:5%;padding-right:5%}
.muse-site .header{min-height:100px;display:flex;justify-content:space-between;align-items:center;gap:24px;border-bottom:1px solid var(--m-border)}
.muse-site .brand{font-family:'Urbanist',Arial,sans-serif;font-size:clamp(24px,2.5vw,42px);font-weight:800;max-width:35%;line-height:1.05;overflow-wrap:anywhere}
.muse-site .brand i{color:var(--m-red);font-style:normal}
.muse-site .brand .brand-logo{display:block;max-height:72px;max-width:min(240px,100%);width:auto;height:auto;object-fit:contain}
.muse-site .links{display:flex;gap:clamp(15px,2.2vw,38px);align-items:center;font-size:12px;font-weight:600}
.muse-site .links a:hover{color:var(--m-red)}
.muse-site .nav-cta{display:inline-flex;align-items:center;gap:12px;border:1px solid var(--m-ink);padding:13px 17px;font-size:11px;font-weight:600}
.muse-site .nav-cta:hover{background:var(--m-ink);color:white}
.muse-site .mobile-links{display:none}
.muse-site .opening{padding-top:36px;padding-bottom:30px}
.muse-site .meta{display:flex;justify-content:space-between;align-items:center;gap:15px;font-size:10px;font-weight:600;letter-spacing:.045em;text-transform:uppercase}
.muse-site .red-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--m-red);margin-right:10px;vertical-align:middle}
.muse-site .opening-title{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px 0 20px}
.muse-site .opening-title h1{font-size:clamp(58px,12.5vw,200px);line-height:.95;font-weight:800;letter-spacing:-.065em;max-width:62%;overflow-wrap:anywhere}
.muse-site .opening-title h1 i{color:var(--m-red);font-style:normal}
.muse-site .opening-title h1.long-brand{font-size:clamp(48px,8.2vw,126px);letter-spacing:-.055em}
.muse-site .opening-title p{font-family:'Urbanist',Arial,sans-serif;font-size:clamp(22px,3.55vw,55px);font-weight:550;line-height:1.1;max-width:36%;overflow-wrap:break-word}
.muse-site .opening-title strong{color:var(--m-red);font-weight:600}
.muse-site .opening-foot{display:flex;align-items:end;justify-content:space-between;gap:20px;font-size:12px}
.muse-site .opening-foot p{color:var(--m-muted);max-width:560px;line-height:1.75}
.muse-site .arrow-link{white-space:nowrap;display:inline-flex;align-items:center;gap:24px;font-size:11px;font-weight:600;padding-bottom:6px}
.muse-site .arrow-link:hover{color:var(--m-red)}
.muse-site .feature{height:clamp(355px,42vw,560px);position:relative;margin:0 2%;overflow:hidden;background:linear-gradient(135deg,#aaa18f,#dbd6ce)}
.muse-site .feature img{display:block;width:100%;height:100%;object-fit:cover}
.muse-site .feature::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.19),transparent 39%,rgba(0,0,0,.60));pointer-events:none}
.muse-site .feature-overlay{position:absolute;z-index:1;inset:25px 3.3% 30px;display:flex;flex-direction:column;justify-content:space-between;color:#fff}
.muse-site .feature-meta{font-size:10px;display:flex;justify-content:space-between;gap:10px;letter-spacing:.06em}
.muse-site .feature-caption{display:flex;align-items:end;justify-content:space-between}
.muse-site .feature-caption h2{font-size:clamp(26px,3vw,45px);font-weight:550;line-height:1.05;margin-top:9px}
.muse-site .feature-round{display:grid;place-items:center;width:54px;height:54px;border:1px solid #fff;border-radius:50%;font-size:24px;flex:none}
.muse-site .portfolio{padding-top:100px;padding-bottom:105px}
.muse-site .section-heading{display:flex;align-items:end;justify-content:space-between;gap:24px}
.muse-site .eyebrow{font-size:10px;font-weight:700;letter-spacing:.065em;text-transform:uppercase}
.muse-site .section-heading h2{font-size:clamp(39px,4vw,60px);line-height:1.07;font-weight:550;margin-top:20px}
.muse-site .section-heading>p{max-width:320px;font-size:12px;line-height:1.8;color:var(--m-muted)}
.muse-site .line-meta{display:flex;justify-content:space-between;border-bottom:1px solid var(--m-border);margin:42px 0 32px;padding-bottom:18px;font-size:11px}
.muse-site .line-meta span:last-child{color:var(--m-muted)}
.muse-site .grid{display:grid;grid-template-columns:1.22fr 1fr;gap:48px 55px;align-items:start}
.muse-site .work:nth-child(2){grid-column:2;grid-row:1/span 2;padding-top:95px}
.muse-site .work:nth-child(3){grid-column:1}
.muse-site .work figure{margin:0;overflow:hidden;background:#e5e2dc}
.muse-site .work img{display:block;width:100%;aspect-ratio:1.43;object-fit:cover;transition:transform .6s}
.muse-site .work:nth-child(2) img{aspect-ratio:.78}
.muse-site .work:nth-child(3) img{aspect-ratio:1.5}
.muse-site .work:hover img{transform:scale(1.035)}
.muse-site .image-placeholder{min-height:290px;background:linear-gradient(130deg,#b9b8af,#e3e0d9);display:flex;align-items:center;justify-content:center;color:#555;font-size:13px}
.muse-site .work figcaption{display:flex;justify-content:space-between;gap:10px;padding-top:18px}
.muse-site .work h3{font-size:clamp(20px,2vw,26px);font-weight:550}
.muse-site .work p{font-size:10px;color:var(--m-muted);margin-top:8px;line-height:1.8}
.muse-site .work .ordinal{font-size:10px;color:var(--m-muted)}
.muse-site .statement{grid-column:2;padding:0 0 0 8%}
.muse-site .statement .plus{font-family:'Urbanist',sans-serif;font-size:56px;color:var(--m-red);font-weight:300;line-height:1}
.muse-site .statement p{font-family:'Urbanist',sans-serif;font-size:clamp(26px,2.8vw,43px);font-weight:550;line-height:1.15;margin:16px 0}
.muse-site .statement em{color:var(--m-muted);font-style:normal}
.muse-site .studio{background:var(--m-soft);padding-top:70px;padding-bottom:74px}
.muse-site .studio-content{display:grid;grid-template-columns:1.2fr 1fr;gap:80px;margin-top:36px}
.muse-site .studio-content h2{font-size:clamp(40px,4.4vw,66px);line-height:1.09;font-weight:550}
.muse-site .studio-content h2 em{color:var(--m-red);font-style:normal}
.muse-site .studio-content p{font-size:13px;color:#555;line-height:1.9;margin-bottom:17px}
.muse-site .studio-content a{display:inline-flex;gap:15px;margin-top:10px;padding-bottom:8px;border-bottom:1px solid var(--m-ink);font-size:11px;font-weight:600}
.muse-site .approach{padding-top:90px;padding-bottom:100px}
.muse-site .steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:38px;margin-top:55px}
.muse-site .step{border-top:1px solid var(--m-border);padding-top:19px}
.muse-site .step .number{font-size:10px;color:var(--m-red)}
.muse-site .step h3{font-size:clamp(26px,2.4vw,35px);font-weight:550;margin:25px 0 13px}
.muse-site .step p{font-size:12px;line-height:1.85;color:var(--m-muted)}
.muse-site .contact{background:var(--m-red);color:white;padding-top:35px;padding-bottom:25px}
.muse-site .contact-top{display:flex;justify-content:space-between;gap:20px}
.muse-site .contact a.contact-action{display:flex;justify-content:space-between;align-items:center;gap:20px;width:100%;font-family:'Urbanist',sans-serif;font-size:clamp(55px,9vw,135px);font-weight:550;line-height:1.02;padding:40px 0 50px;overflow-wrap:anywhere}
.muse-site .contact a.contact-action:hover{opacity:.83}
.muse-site .contact .out-arrow{font-size:.65em;font-weight:300;flex:none}
.muse-site .foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:15px;border-top:1px solid rgba(255,255,255,.38);padding-top:25px;font-size:10px}
.muse-site .foot strong{font-family:'Urbanist',sans-serif;font-size:30px}
.muse-site .contact a:focus-visible{outline:3px solid white}
@media(min-width:1600px){.muse-site .gutter{padding-left:max(5%,calc((100% - 1440px)/2));padding-right:max(5%,calc((100% - 1440px)/2))}}
@media(max-width:1000px){.muse-site .grid{gap:35px 28px}.muse-site .studio-content{gap:35px}.muse-site .opening-title h1{font-size:clamp(70px,11vw,145px)}}
@media(max-width:740px){
.muse-site .gutter{padding-left:6%;padding-right:6%}
.muse-site .header{min-height:80px}.muse-site .brand{max-width:66%;font-size:32px}
.muse-site .links,.muse-site .nav-cta{display:none}
.muse-site .mobile-links{display:block;margin-left:auto;max-width:25%}
.muse-site .mobile-links summary{list-style:none;cursor:pointer;font-weight:700;font-size:12px}
.muse-site .mobile-links[open] nav{position:absolute;z-index:12;top:70px;left:0;right:0;background:white;border-bottom:1px solid var(--m-border);display:grid;gap:18px;padding:24px 6%;box-shadow:0 20px 30px rgba(0,0,0,.09)}
.muse-site .header{position:relative}
.muse-site .opening{padding-top:27px;padding-bottom:28px}
.muse-site .meta{font-size:8px}.muse-site .meta>span:last-child{font-size:7px}
.muse-site .opening-title{display:block;padding:18px 0 22px}
.muse-site .opening-title h1{font-size:clamp(55px,15vw,112px);max-width:100%;letter-spacing:-.06em}
.muse-site .opening-title h1.long-brand{font-size:clamp(37px,10vw,72px);letter-spacing:-.045em}
.muse-site .opening-title p{font-size:clamp(27px,8vw,42px);max-width:100%;margin-top:14px}
.muse-site .opening-foot{font-size:10px}.muse-site .arrow-link{max-width:120px;white-space:normal;gap:10px;font-size:9px}
.muse-site .feature{margin:0;height:350px}
.muse-site .feature-meta{font-size:8px}.muse-site .feature-overlay{inset:21px 6% 22px}.muse-site .feature-caption h2{font-size:30px}
.muse-site .feature-round{width:43px;height:43px;font-size:20px}
.muse-site .portfolio{padding-top:55px;padding-bottom:58px}
.muse-site .section-heading{display:block}.muse-site .section-heading h2{font-size:42px}
.muse-site .section-heading>p{font-size:11px;margin-top:18px}
.muse-site .line-meta{margin:27px 0}
.muse-site .grid{display:grid;grid-template-columns:minmax(0,1fr);gap:32px}
.muse-site .work:nth-child(2),.muse-site .work:nth-child(3),.muse-site .statement{grid-column:1;grid-row:auto;padding:0}
.muse-site .work:nth-child(2){width:85%;margin-left:auto}
.muse-site .work:nth-child(3){width:94%}
.muse-site .statement p{font-size:33px}
.muse-site .studio{padding-top:43px;padding-bottom:50px}
.muse-site .studio-content{display:grid;grid-template-columns:minmax(0,1fr);gap:25px;margin-top:20px}
.muse-site .studio-content h2{font-size:42px}.muse-site .studio-content p{font-size:12px}
.muse-site .approach{padding-top:55px;padding-bottom:58px}
.muse-site .approach .section-heading h2{font-size:39px}
.muse-site .steps{grid-template-columns:minmax(0,1fr);gap:29px;margin-top:35px}
.muse-site .step h3{margin-top:16px;font-size:30px}
.muse-site .contact{padding-top:30px}
.muse-site .contact-top{gap:12px}.muse-site .contact .eyebrow{font-size:8px}
.muse-site .contact a.contact-action{font-size:clamp(52px,10vw,77px);padding:35px 0}
.muse-site .foot strong{font-size:26px}
}
@media(prefers-reduced-motion:reduce){.muse-site *{transition:none!important;scroll-behavior:auto!important}}
`;

function imageHtml(src:string,alt:string):string {
  const safe=src.trim();
  return safe
    ? `<img src="${esc(safe)}" alt="${esc(alt)}" loading="lazy" decoding="async">`
    : '<div class="image-placeholder" role="img" aria-label="Fotografia ainda não disponível">Imagem do projeto</div>';
}
function photoCard(index:number,title:string,description:string,image:string,location:string):string {
  return `<article class="work"><figure>${imageHtml(image,title)}</figure><figcaption><div><h3>${esc(title)}</h3><p>${esc(description)} · ${esc(location)}</p></div><span class="ordinal">0${index}</span></figcaption></article>`;
}

const typeByAnchor:Record<string,SiteSection['type']>={
  inicio:'hero',portfolio:'services',estudio:'about',abordagem:'process',contato:'cta',
};

/**
 * Edits stored in the CRM config are applied to the same semantic HTML
 * sections visible to the user. This preserves existing text-edit workflows.
 */
function bindTextEdits(html:string,model:SiteSchemaModel,
  applyText:(markup:string,sectionId:string,model:SiteSchemaModel)=>string):string {
  return html.replace(
    /(<section\b[^>]*\bdata-muse-anchor="(inicio|portfolio|estudio|abordagem|contato)"[^>]*>)([\s\S]*?)(<\/section>)/g,
    (match,opening:string,key:string,body:string,closing:string)=>{
      const kind=typeByAnchor[key];
      const section=model.sections.find(item=>item.visible&&item.type===kind);
      if(!section)return match;
      return opening+applyText(body,section.id,model)+closing;
    }
  );
}

export function renderMuseEditorial(
  model:SiteSchemaModel,ctx:RenderContext,
  applyText:(html:string,sectionId:string,model:SiteSchemaModel)=>string
):string {
  const data=adaptCrmToFrigolog(model,ctx);
  const name=data.brand.name;
  // Muse originated as an architecture portfolio; for health, legal and
  // other service businesses the generated page must speak about services,
  // not pretend that the client sells design projects.
  const portfolioNiche=/arquitet|engenhar|design|portf[oó]lio|fotograf|decorac|interior/i.test(
    [model.business.niche,model.business.description].filter(Boolean).join(' ')
  );
  const worksLabel=portfolioNiche?'Projetos':'Serviços';
  const worksIntro=portfolioNiche?'Explore nosso trabalho':'Conheça nossos serviços';
  const worksCaption=portfolioNiche?'Projetos e soluções':'Atendimentos e serviços';
  const worksEyebrow=portfolioNiche?'NOSSO TRABALHO':'NOSSOS SERVIÇOS';
  // A long personal/professional name must not become a giant 5-line heading
  // on narrow mobile screens. Keep the editorial typography, shrink safely.
  const longBrand=name.length>18;
  const region=[model.business.city,model.business.state].filter(Boolean).join(', ');
  const picture=data.hero.image.src;
  const second=data.about.image.src;
  const third=data.coverage.image.src;
  const services=data.services.items;
  const contactUrl=data.contact.ctaUrl;
  const cards=[
    photoCard(1,services[0].title,services[0].description,second,region),
    photoCard(2,services[1].title,services[1].description,third,region),
    photoCard(3,services[2].title,services[2].description,picture,region),
  ];
  const steps=(data.coverage.steps.length
    ? data.coverage.steps
    : data.highlights.slice(0,3)).slice(0,3);
  const nav=`<a href="#portfolio">${worksLabel}</a><a href="#estudio">Sobre</a><a href="#abordagem">Como trabalhamos</a>`;
  const html=`<div class="muse-site">
<header class="header gutter">
  <a class="brand" href="#inicio" aria-label="Voltar ao início">${data.brand.logoUrl?`<img class="brand-logo" src="${esc(data.brand.logoUrl)}" alt="${esc(name)}" loading="eager">`:`${esc(name)}<i>.</i>`}</a>
  <nav class="links" aria-label="Menu principal">${nav}</nav>
  <a class="nav-cta" href="${esc(contactUrl)}">${esc(data.contact.ctaLabel)} <span aria-hidden="true">↗</span></a>
  <details class="mobile-links"><summary>Menu ☰</summary><nav aria-label="Menu celular">${nav}<a href="${esc(contactUrl)}">${esc(data.contact.ctaLabel)}</a></nav></details>
</header>
<main id="conteudo">
  <section id="inicio" data-muse-anchor="inicio" class="opening gutter">
    <div class="meta"><span><i class="red-dot"></i>${esc(data.hero.eyebrow)}</span><span>${esc(region)}</span></div>
    <div class="opening-title"><h1${longBrand?' class="long-brand"':''}>${esc(name.toLowerCase())}<i>.</i></h1><p>${esc(editorialHeading(data.hero.title))}</p></div>
    <div class="opening-foot"><p>${esc(data.hero.description)}</p><a class="arrow-link" href="#portfolio">${worksIntro} <span aria-hidden="true">↓</span></a></div>
  </section>
  <div class="feature" role="group" aria-label="Imagem em destaque">
    ${imageHtml(picture,data.hero.image.alt)}
    <div class="feature-overlay"><div class="feature-meta"><span>EM DESTAQUE</span><span>01 / 03</span></div>
      <div class="feature-caption"><div><span class="eyebrow">${esc(data.hero.eyebrow)}</span><h2>${esc(data.hero.title)}</h2></div>
      <a class="feature-round" href="#portfolio" aria-label="Explorar projetos">↗</a></div>
    </div>
  </div>
  <section id="portfolio" data-muse-anchor="portfolio" class="portfolio gutter">
    <div class="section-heading"><div><span class="eyebrow">01 — ${worksEyebrow}</span><h2>${esc(data.services.heading)}</h2></div>
      <p>${esc(data.hero.description)}</p></div>
    <div class="line-meta"><span>${worksCaption}</span><span>01 / 03</span></div>
    <div class="grid">${cards.join('')}
      <div class="statement"><span class="plus" aria-hidden="true">+</span>
        <p>${esc(data.highlights[0].title)}.<br><em>${esc(data.highlights[1].title)}.</em></p>
        <span class="eyebrow">${esc(data.brand.tagline)}</span></div>
    </div>
  </section>
  <section id="estudio" data-muse-anchor="estudio" class="studio gutter">
    <span class="eyebrow">02 — SOBRE NÓS</span>
    <div class="studio-content">
      <h2>${esc(data.about.heading)}</h2>
      <div><p>${esc(data.about.paragraphs[0])}</p><p>${esc(data.about.paragraphs[1])}</p>
        <a href="${esc(contactUrl)}">${esc(data.about.ctaLabel)} <span aria-hidden="true">↗</span></a></div>
    </div>
  </section>
  <section id="abordagem" data-muse-anchor="abordagem" class="approach gutter">
    <div class="section-heading"><div><span class="eyebrow">03 — NOSSA ABORDAGEM</span><h2>${esc(data.coverage.heading)}</h2></div></div>
    <div class="steps">${steps.map((step,i)=>`<article class="step">
      <span class="number">0${i+1} — ${i===0?'INÍCIO':i===1?'PROCESSO':'RESULTADO'}</span>
      <h3>${esc(step.title)}</h3><p>${esc(step.description)}</p>
    </article>`).join('')}</div>
  </section>
</main>
<section id="contato" data-muse-anchor="contato" class="contact gutter">
  <div class="contact-top"><span class="eyebrow">${esc(data.contact.eyebrow)}</span><span class="eyebrow">${esc(data.brand.tagline)}</span></div>
  <a class="contact-action" href="${esc(contactUrl)}">${esc(data.contact.heading)}<span class="out-arrow" aria-hidden="true">↗</span></a>
  <div class="foot"><strong>${esc(name)}.</strong><span>${esc(data.footer.copyright)}</span><span>PageNova AI</span></div>
</section>
</div>`;
  return bindTextEdits(html,model,applyText);
}
export const MUSE_EDITORIAL_CSS=MUSE_CSS;
