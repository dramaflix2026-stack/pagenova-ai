import type { SitePage, SitePageKey, SiteProject } from "@/lib/site-builder";

const esc = (value: string): string => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character] ?? character);

function media(value: string | undefined, label: string, variant: string): string {
  if (value && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 1200000) {
    return `<img src="${value}" alt="${esc(label)}" />`;
  }
  return `<div class="media-placeholder ${variant}" aria-label="Espaço reservado para ${esc(label)}">
    <span class="placeholder-mark">✳</span><span>ESPAÇO PARA IMAGEM</span><strong>${esc(label)}</strong>
    <small>Adicione sua própria fotografia no início da criação.</small></div>`;
}

export function renderInstitutionalPage(project: SiteProject, page: SitePage, pageKey: SitePageKey): string {
  const info = project.institutional;
  const name = esc(project.name);
  const nav = ([
    ["home", "Início"], ["sobre", "Sobre"], ["servicos", "Serviços"], ["contato", "Contato"],
  ] as const).filter(([key]) => project.pages[key])
    .map(([key, label]) => `<a href="#${key}" data-page="${key}" ${key === pageKey ? 'aria-current="page"' : ""}>${label}</a>`).join("");

  const sections = page.sections.map(({ title, body }, index) =>
    `<article class="service"><span class="index">${String(index + 1).padStart(2, "0")}</span>
      <h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join("");

  const intro = info?.role ? `<span class="identity">${esc(info.role)}</span>` : "";
  const audience = info?.audience ? `<p class="audience">Para quem: ${esc(info.audience)}</p>` : "";
  const offer = info?.offer ? `<p>${esc(info.offer)}</p>` : "";
  const process = info?.process ? `<p>${esc(info.process)}</p>` : "";
  const proof = info?.proof ? `<p>${esc(info.proof)}</p>` : "";
  const cta = project.pages.contato
    ? `<a class="button" href="#contato" data-page="contato">${esc(page.cta || "Entrar em contato")} <span>↗</span></a>` : "";
  const photo = media(info?.portrait, `Foto principal de ${project.name}`, "portrait");
  const business = media(info?.businessPhoto, `Ambiente de ${project.name}`, "environment");
  const work = media(info?.workPhoto, `Trabalho de ${project.name}`, "work");
  const heading = pageKey === "home" ? "Conheça o que fazemos" : pageKey === "sobre" ? "Nossa forma de trabalhar" : "Como podemos ajudar";

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${name} — ${esc(page.heading)}</title>
  <style>
  *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f7f8f4;color:#19332c;font-family:Arial,Helvetica,sans-serif}
  a{color:inherit;text-decoration:none}header{background:#fff;display:flex;justify-content:space-between;align-items:center;gap:24px;padding:21px max(5%,calc((100% - 1200px)/2));border-bottom:1px solid #e4eae2}
  .brand{font-size:21px;font-weight:800;letter-spacing:-.045em}nav{display:flex;flex-wrap:wrap;gap:24px;font-size:14px}nav a[aria-current]{color:#087a5b;font-weight:800}
  .shell{max-width:1200px;margin:auto;padding-left:26px;padding-right:26px}
  .hero{background:#edf2eb}.hero-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(300px,.92fr);gap:65px;align-items:center;padding-top:68px;padding-bottom:76px}
  .eyebrow,.kicker{display:block;font-size:11px;font-weight:800;letter-spacing:.17em;text-transform:uppercase;color:#087a5b}
  h1,h2,h3{font-family:Georgia,serif;font-weight:400;letter-spacing:-.04em}h1{font-size:clamp(42px,5vw,69px);line-height:1.09;margin:20px 0;max-width:720px}
  .lead{font-size:18px;line-height:1.75;color:#586d60;max-width:610px}.identity{display:block;color:#087a5b;font-weight:700;margin-top:22px}
  .audience{font-size:14px;color:#64776a;line-height:1.6}.button{display:inline-flex;gap:32px;align-items:center;justify-content:space-between;border-radius:7px;background:#136c51;color:#fff;font-weight:800;padding:16px 20px;margin-top:22px}
  .hero-media,.media-frame{overflow:hidden;border-radius:8px;background:#d7e4d7}.hero-media{height:500px}.hero-media img,.media-frame img{width:100%;height:100%;object-fit:cover;display:block}
  .media-placeholder{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;padding:25px;background:linear-gradient(145deg,#dbe8db,#bacfc2);color:#315849}
  .media-placeholder.environment{background:linear-gradient(145deg,#d5e5dd,#a6c3b2)}.media-placeholder.work{background:linear-gradient(145deg,#e3e8d8,#b8cbb9)}
  .placeholder-mark{font:58px Georgia,serif;opacity:.28}.media-placeholder span:not(.placeholder-mark){font-size:10px;font-weight:800;letter-spacing:.17em}.media-placeholder strong{font:25px Georgia,serif}.media-placeholder small{font-size:12px;line-height:1.5;max-width:230px}
  .section{padding-top:85px;padding-bottom:90px}.section h2{font-size:clamp(32px,4vw,50px);line-height:1.12;margin:15px 0 20px}
  .section-intro{max-width:690px;line-height:1.8;color:#64776a;font-size:17px}.services{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px;margin-top:35px}
  .service{padding:28px;background:#fff;border:1px solid #e1e8df;border-radius:8px;min-height:225px}.index{color:#087a5b;font-size:12px;font-weight:800}.service h3{font-size:25px;margin:23px 0 12px}.service p{color:#617368;font-size:14px;line-height:1.75;margin:0}
  .story{background:#e7eee7;color:#19332c}.story-grid{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:70px;padding-top:80px;padding-bottom:80px}
  .story h2{font-size:clamp(32px,4vw,51px);margin:16px 0}.story p{line-height:1.8;color:#526c5c}.story .kicker{color:#087a5b}.media-frame{height:390px}
  .proof{padding:24px;border-left:3px solid #087a5b;background:#fff;border-radius:0 8px 8px 0;margin-top:20px}.proof strong{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#087a5b}
  .gallery{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:32px}.gallery .media-frame{height:295px}
  .closing{text-align:center;background:#e7f0e7;padding:76px 22px}.closing h2{font-size:clamp(32px,4vw,49px);margin:15px auto;max-width:750px}.closing p{color:#627468;line-height:1.7}footer{padding:35px 6%;background:#102d23;color:#d9e7dd;font-size:13px}
  @media(max-width:850px){.hero-grid,.story-grid{grid-template-columns:1fr;gap:35px}.hero-media{height:420px}.services{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:620px){header{flex-direction:column;align-items:flex-start}.shell{padding-left:20px;padding-right:20px}.hero-grid{padding-top:55px;padding-bottom:55px}.hero-media{height:350px}.section{padding-top:65px;padding-bottom:70px}.services,.gallery{grid-template-columns:1fr}.story-grid{padding-top:65px;padding-bottom:65px}.media-frame,.gallery .media-frame{height:285px}h1{font-size:43px}}
  </style></head><body>
  <header><strong class="brand">${name}</strong><nav>${nav}</nav></header>
  <main>
    <section class="hero"><div class="shell hero-grid">
      <div><span class="eyebrow">${esc(page.eyebrow)}</span><h1>${esc(page.heading)}</h1>
      <p class="lead">${esc(page.introduction)}</p>${intro}${audience}${cta}</div>
      <div class="hero-media">${photo}</div>
    </div></section>
    <section class="shell section"><span class="kicker">${name}</span><h2>${heading}</h2>
      <p class="section-intro">${offer || esc(page.introduction)}</p>
      <div class="services">${sections}</div>
    </section>
    <section class="story"><div class="shell story-grid"><div class="media-frame">${business}</div><div>
      <span class="kicker">Sobre ${name}</span><h2>${pageKey === "sobre" ? esc(page.heading) : "Conheça quem está por trás deste trabalho."}</h2>
      <p>${esc(page.introduction)}</p>
      ${process ? `<div class="proof"><strong>Como funciona</strong>${process}</div>` : ""}
      ${proof ? `<div class="proof"><strong>Informações fornecidas</strong>${proof}</div>` : ""}
    </div></div></section>
    <section class="shell section"><span class="kicker">Nosso trabalho</span><h2>Conheça mais de perto.</h2>
      <p class="section-intro">Um espaço visual para mostrar a experiência, a equipe, o ambiente ou o serviço com suas próprias fotografias.</p>
      <div class="gallery"><div class="media-frame">${work}</div><div class="media-frame">${business}</div></div>
    </section>
    <section class="closing"><span class="kicker">Próximo passo</span><h2>Vamos conversar sobre o que você procura?</h2>
      <p>Entre em contato para conhecer as possibilidades de atendimento.</p>${cta}</section>
  </main><footer>${name} · Site em criação no PageNova AI</footer>
  <script>document.addEventListener("click",function(event){const link=event.target.closest("[data-page]");if(link){event.preventDefault();parent.postMessage({type:"pagenova-site-preview-page",key:link.dataset.page},"*")}})</script>
  </body></html>`;
}