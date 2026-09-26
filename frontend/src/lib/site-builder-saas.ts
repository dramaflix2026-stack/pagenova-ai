import type { SitePage, SitePageKey, SiteProject } from "@/lib/site-builder";

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

export function renderSaasPage(
  project: SiteProject,
  page: SitePage,
  pageKey: SitePageKey,
): string {
  const name = esc(project.name);
  const title = esc(page.heading);
  const intro = esc(page.introduction);
  const email = project.contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(project.contactEmail)
    ? project.contactEmail : "";
  const contact = project.pages.contato
    ? '<a href="#contato" data-page="contato" class="button">Solicitar demonstração <span aria-hidden="true">↗</span></a>'
    : email
      ? `<a href="mailto:${esc(email)}?subject=Demonstracao%20do%20produto" class="button">Solicitar demonstração ↗</a>`
      : "";
  const nav = ([
    ["home", "Início"], ["servicos", "Recursos"], ["sobre", "Sobre"], ["contato", "Contato"],
  ] as const).filter(([key]) => project.pages[key])
    .map(([key, label]) =>
      `<a href="#${key}" data-page="${key}" ${key === pageKey ? 'aria-current="page"' : ""}>${label}</a>`
    ).join("");

  const cards = page.sections.map((section, index) => `
    <article class="feature">
      <span class="feature-number">${String(index + 1).padStart(2, "0")}</span>
      <h3>${esc(section.title)}</h3>
      <p>${esc(section.body)}</p>
    </article>
  `).join("");

  const steps = page.sections.slice(0, 3).map((section, index) => `
    <article class="step">
      <span>0${index + 1}</span>
      <h3>${esc(section.title)}</h3>
      <p>${esc(section.body)}</p>
    </article>
  `).join("");

  const faq = page.sections.slice(0, 4).map((section) => `
    <details><summary>${esc(section.title)}<span aria-hidden="true">+</span></summary>
    <p>${esc(section.body)}</p></details>
  `).join("");

  const productVisual = `
    <div class="product-visual" role="img" aria-label="Representação ilustrativa da interface do produto">
      <div class="window-top"><span></span><span></span><span></span><strong>${name} / Visão geral</strong></div>
      <div class="window-body">
        <aside><b>${name}</b><div class="selected">Visão geral</div><div>Atividades</div>
          <div>Fluxos</div><div>Relatórios</div><div>Configurações</div></aside>
        <div class="window-main"><div class="visual-heading"><span>Seu espaço de trabalho</span><span>●</span></div>
          <div class="metric-row"><div><small>Visão</small><strong>01</strong></div>
            <div><small>Fluxo</small><strong>02</strong></div>
            <div><small>Resultados</small><strong>03</strong></div></div>
          <div class="chart"><i style="height:42%"></i><i style="height:67%"></i>
            <i style="height:53%"></i><i style="height:83%"></i>
            <i style="height:72%"></i><i style="height:96%"></i>
            <i style="height:76%"></i></div>
          <div class="visual-note">Interface ilustrativa · adicione capturas reais do produto</div>
        </div>
      </div>
    </div>`;

  const home = `
    <section class="hero wrap"><span class="eyebrow">${esc(page.eyebrow)}</span>
      <h1>${title}</h1><p>${intro}</p>
      <div class="actions">${contact}<a href="#recursos" class="button secondary">Explorar recursos ↓</a></div>
      ${productVisual}
    </section>
    <section class="section light" id="recursos"><div class="wrap">
      <span class="eyebrow">O produto</span><h2>Uma experiência pensada para o seu trabalho.</h2>
      <p class="section-intro">Conheça as capacidades descritas para ${name}.</p>
      <div class="feature-grid">${cards}</div>
    </div></section>
    <section class="section" id="funcionamento"><div class="wrap">
      <span class="eyebrow">Como funciona</span><h2>Do primeiro passo ao resultado.</h2>
      <div class="steps">${steps}</div>
    </div></section>
    <section class="section light" id="planos"><div class="wrap plans">
      <div><span class="eyebrow">Planos e acesso</span>
        <h2>Encontre a configuração certa para sua equipe.</h2>
        <p>Valores, limites e condições devem ser definidos pelo responsável pelo produto.</p></div>
      <div class="plan-card"><span class="eyebrow">Converse com a equipe</span>
        <h3>Conheça ${name}</h3><p>Veja o produto, tire dúvidas e receba as condições comerciais atualizadas.</p>
        ${contact}</div>
    </div></section>
    <section class="section" id="faq"><div class="wrap faq">
      <div><span class="eyebrow">Saiba mais</span><h2>O que você precisa conhecer.</h2>
        <p>Informações sobre o produto, com base no briefing informado.</p></div>
      <div>${faq}</div>
    </div></section>`;

  const inner = `
    <section class="inner-hero wrap"><span class="eyebrow">${esc(page.eyebrow)}</span>
      <h1>${title}</h1><p>${intro}</p>${contact}</section>
    <section class="section light"><div class="wrap">
      <span class="eyebrow">${pageKey === "servicos" ? "Funcionalidades" : "Conheça o produto"}</span>
      <h2>${pageKey === "servicos" ? "Recursos em detalhe." : "Uma visão mais completa."}</h2>
      <div class="feature-grid">${cards}</div>
    </div></section>
    <section class="section"><div class="wrap faq">
      <div><span class="eyebrow">Em detalhes</span><h2>Entenda cada possibilidade.</h2></div>
      <div>${faq}</div>
    </div></section>`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — ${name}</title>
<style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#090f19;color:#ecf5f4;font-family:Arial,Helvetica,sans-serif}
a{color:inherit;text-decoration:none}button{font:inherit}h1,h2,h3,p{margin-top:0}
.wrap{width:min(1160px,calc(100% - 40px));margin:auto}
header{position:sticky;top:0;z-index:5;border-bottom:1px solid #ffffff18;background:#09101be8;backdrop-filter:blur(18px)}
.header-inner{min-height:76px;display:flex;justify-content:space-between;align-items:center;gap:24px}
.brand{font-size:21px;font-weight:800;letter-spacing:-.05em}
.brand-mark{display:inline-grid;place-items:center;width:34px;height:34px;background:#5ce3cb;color:#08211e;border-radius:10px;margin-right:9px}
nav{display:flex;gap:28px;flex-wrap:wrap;font-size:13px;color:#bbcecd}nav a:hover,nav a[aria-current]{color:#5ce3cb}
.eyebrow{text-transform:uppercase;letter-spacing:.18em;font-weight:800;font-size:11px;color:#5ce3cb}
.hero{text-align:center;padding-top:105px}.hero h1{font-size:clamp(44px,6vw,78px);line-height:1.05;letter-spacing:-.065em;max-width:900px;margin:22px auto}
.hero>p,.inner-hero>p{color:#a9bcbb;font-size:18px;line-height:1.7;max-width:730px;margin:0 auto 26px}
.actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:60px}
.button{display:inline-flex;align-items:center;justify-content:center;gap:12px;border-radius:11px;padding:15px 22px;background:#5ce3cb;color:#09251f;font-weight:800;font-size:14px}
.button:hover{background:#8af1df}.button.secondary{background:#ffffff0b;color:#e6f7f4;border:1px solid #ffffff24}
.product-visual{max-width:1040px;text-align:left;border:1px solid #ffffff25;border-radius:18px 18px 0 0;overflow:hidden;box-shadow:0 30px 110px #36e6ca20;background:#111d29}
.window-top{height:43px;display:flex;align-items:center;gap:7px;padding:0 17px;border-bottom:1px solid #ffffff19}
.window-top span{width:8px;height:8px;border-radius:50%;background:#ffffff50}.window-top strong{margin-left:20px;color:#91adaa;font-size:11px}
.window-body{display:grid;grid-template-columns:190px 1fr;min-height:350px}.window-body aside{padding:22px;border-right:1px solid #ffffff15}
.window-body aside b{display:block;margin-bottom:26px}.window-body aside div{padding:11px;font-size:12px;color:#93a9a9}
.window-body aside .selected{color:#5ce3cb;background:#5ce3cb14;border-radius:8px}
.window-main{padding:27px}.visual-heading{display:flex;justify-content:space-between;font-weight:700}
.metric-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:23px 0}
.metric-row div{background:#1b2a35;border:1px solid #ffffff15;border-radius:11px;padding:16px}
.metric-row small{display:block;color:#9cb1b0;font-size:11px}.metric-row strong{display:block;color:#5ce3cb;font-size:25px;margin-top:9px}
.chart{height:125px;display:flex;align-items:end;gap:10px;border:1px solid #ffffff15;border-radius:11px;padding:17px;background:#14232f}
.chart i{flex:1;background:linear-gradient(#5ce3cb,#2c817b);border-radius:5px 5px 0 0}
.visual-note{font-size:11px;color:#9cafb0;margin-top:14px}
.section{padding:100px 0}.section.light{background:#f6faf9;color:#142724}
.section h2{font-size:clamp(35px,4vw,53px);line-height:1.1;letter-spacing:-.05em;max-width:730px;margin:14px 0 18px}
.section-intro,.section p{line-height:1.7;color:#a9bcbb}.section.light p{color:#5d7470}
.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:45px}
.feature{padding:27px;border:1px solid #a5c7be55;border-radius:15px;background:#fff}
.feature-number{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:10px;background:#e3f8f2;color:#087d69;font-size:12px;font-weight:800}
.feature h3{color:#142724;font-size:19px;margin:22px 0 10px}.feature p{color:#60736f!important;font-size:14px;margin:0}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:45px}
.step{border-top:1px solid #5ce3cb66;padding-top:24px}.step span{color:#5ce3cb;font-size:12px;font-weight:800}
.step h3{font-size:21px;margin:20px 0 12px}
.plans,.faq{display:grid;grid-template-columns:1fr 1fr;gap:65px;align-items:start}
.plan-card{padding:32px;border:1px solid #bad7cf;border-radius:18px;background:#fff;box-shadow:0 20px 70px #113d3515}
.plan-card h3{font-size:30px;margin:18px 0 10px}.plan-card .button{margin-top:12px}
.faq details{border-bottom:1px solid #ffffff30;padding:19px 0}
.faq summary{list-style:none;cursor:pointer;font-weight:700;display:flex;justify-content:space-between;gap:20px}
.faq summary::-webkit-details-marker{display:none}.faq details p{font-size:14px;padding-top:18px}
.inner-hero{padding-top:95px;padding-bottom:85px}.inner-hero h1{font-size:clamp(42px,5vw,70px);letter-spacing:-.06em;max-width:850px;margin:20px 0}
.inner-hero>p{margin-left:0}.inner-hero .button{margin-top:8px}
.cta{padding:80px 0;text-align:center;background:#17372f}.cta h2{font-size:clamp(32px,4vw,48px);letter-spacing:-.05em;margin:15px auto;max-width:750px}
.cta .button{margin-top:15px}footer{padding:30px 0;color:#a5b9b6;font-size:12px}
@media(max-width:800px){.feature-grid,.steps{grid-template-columns:repeat(2,1fr)}.plans,.faq{grid-template-columns:1fr;gap:25px}}
@media(max-width:620px){.header-inner{align-items:flex-start;flex-direction:column;padding:17px 0}nav{gap:15px}
.hero{padding-top:67px}.hero h1{font-size:43px}.window-body{grid-template-columns:1fr}.window-body aside{display:none}
.metric-row{gap:6px}.metric-row div{padding:10px}.section{padding:70px 0}
.feature-grid,.steps{grid-template-columns:1fr}.inner-hero{padding-top:65px;padding-bottom:55px}}
</style></head><body>
<header><div class="wrap header-inner"><a href="#home" data-page="home" class="brand"><span class="brand-mark">✦</span>${name}</a><nav>${nav}</nav></div></header>
<main>${pageKey === "home" ? home : inner}
<section class="cta"><div class="wrap"><span class="eyebrow">Próximo passo</span>
<h2>Veja como ${name} pode se encaixar na sua operação.</h2>
<p>Converse com a equipe para conhecer o produto e suas condições atuais.</p>${contact}</div></section>
</main><footer class="wrap">${name} · Prévia criada com PageNova AI</footer>
<script>document.addEventListener("click",function(event){
const link=event.target.closest("[data-page]");
if(link){event.preventDefault();parent.postMessage({type:"pagenova-site-preview-page",key:link.dataset.page},"*")}
});</script></body></html>`;
}