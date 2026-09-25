export type SitePageKey = "home" | "sobre" | "servicos" | "contato";

export const SITE_PAGES: { key: SitePageKey; label: string }[] = [
  { key: "home", label: "Início" },
  { key: "sobre", label: "Sobre" },
  { key: "servicos", label: "Serviços" },
  { key: "contato", label: "Contato" },
];

export type SitePage = {
  key: SitePageKey;
  eyebrow: string;
  heading: string;
  introduction: string;
  sections: { title: string; body: string }[];
  cta: string;
};

export type SiteProject = {
  kind: "institutional-site";
  id: string;
  name: string;
  brief: string;
  style: string;
  presetId?: string;
  pages: Partial<Record<SitePageKey, SitePage>>;
  createdAt: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

export function renderSitePreview(project: SiteProject, pageKey: SitePageKey): string {
  const page = project.pages[pageKey];
  if (!page) return "";
  if (project.presetId === "imobiliaria" && pageKey === "home") return renderRealEstateHome(project, page);

  const palette = project.style === "vibrante"
    ? { background: "#10122b", foreground: "#f8f8ff", accent: "#a78bfa", surface: "#1c1e3b" }
    : project.style === "elegante"
      ? { background: "#f5f1eb", foreground: "#252019", accent: "#8e624d", surface: "#ffffff" }
      : { background: "#f6f8f7", foreground: "#172723", accent: "#087f63", surface: "#ffffff" };

  const nav = SITE_PAGES.filter(({ key }) => project.pages[key]).map(({ key, label }) =>
    `<a href="#${key}" data-page="${key}" ${key === pageKey ? 'aria-current="page"' : ""}>${label}</a>`,
  ).join("");
  const sections = page.sections.map((section) =>
    `<article class="card"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.body)}</p></article>`,
  ).join("");
  const modules = getSitePreset(project.presetId || "institucional").modules.map((module, index) =>
    `<span><b>0${index + 1}</b> ${escapeHtml(module)}</span>`,
  ).join("");

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(project.name)} — ${escapeHtml(page.heading)}</title><style>
    *{box-sizing:border-box}body{margin:0;background:${palette.background};color:${palette.foreground};font-family:Arial,Helvetica,sans-serif}a{color:inherit;text-decoration:none}header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px max(6%,calc((100% - 1160px)/2));border-bottom:1px solid currentColor}header strong{font-size:20px;letter-spacing:-.04em}nav{display:flex;gap:24px;font-size:14px;flex-wrap:wrap}nav a[aria-current]{color:${palette.accent};font-weight:700}.hero{padding:100px max(6%,calc((100% - 1160px)/2)) 85px}.eyebrow{color:${palette.accent};font-weight:700;letter-spacing:.18em;text-transform:uppercase;font-size:12px}h1{font-size:clamp(42px,6vw,78px);line-height:1.05;letter-spacing:-.055em;max-width:900px;margin:22px 0}p{line-height:1.7}.hero p{font-size:19px;max-width:680px;opacity:.75}.button{display:inline-block;margin-top:20px;padding:15px 24px;border-radius:10px;background:${palette.accent};color:#fff;font-weight:700}.modules{display:flex;flex-wrap:wrap;gap:14px;padding:0 max(6%,calc((100% - 1160px)/2)) 65px}.modules span{padding:13px 16px;border:1px solid currentColor;border-radius:12px;font-size:13px;opacity:.75}.modules b{color:${palette.accent};margin-right:8px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:20px;padding:0 max(6%,calc((100% - 1160px)/2)) 90px}.card{padding:30px;border-radius:18px;background:${palette.surface};box-shadow:0 12px 35px #0000000a}.card h2{font-size:21px;margin:0 0 14px}.card p{margin:0;opacity:.75}footer{padding:30px 6%;border-top:1px solid currentColor;opacity:.65;font-size:13px}@media(max-width:650px){header{align-items:flex-start;flex-direction:column}.hero{padding-top:65px}}
  </style></head><body><header><strong>${escapeHtml(project.name)}</strong><nav>${nav}</nav></header><main><section class="hero"><div class="eyebrow">${escapeHtml(page.eyebrow)}</div><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.introduction)}</p>${project.pages.contato && pageKey !== "contato" ? `<a class="button" href="#contato" data-page="contato">${escapeHtml(page.cta)}</a>` : ""}</section><div class="modules">${modules}</div><section class="grid">${sections}</section></main><footer>${escapeHtml(project.name)} · Site em criação no PageNova AI</footer><script>document.addEventListener('click',function(event){var link=event.target.closest('[data-page]');if(link){event.preventDefault();parent.postMessage({type:'pagenova-site-preview-page',key:link.getAttribute('data-page')},'*')}})</script></body></html>`;
}

function renderRealEstateHome(project: SiteProject, page: SitePage): string {
  const nav = SITE_PAGES.filter(({ key }) => project.pages[key]).map(({ key, label }) => `<a href="#${key}" data-page="${key}">${label}</a>`).join("");
  const sections = page.sections.map(({ title, body }) => `<article><span class="marker">✦</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></article>`).join("");
  const examples = [
    { type: "Apartamento", area: "Centro", rooms: 2, price: 420000, size: 78 },
    { type: "Casa", area: "Jardins", rooms: 3, price: 750000, size: 156 },
    { type: "Apartamento", area: "Jardins", rooms: 1, price: 310000, size: 49 },
    { type: "Casa", area: "Centro", rooms: 4, price: 980000, size: 211 },
    { type: "Apartamento", area: "Vila Nova", rooms: 3, price: 590000, size: 104 },
    { type: "Casa", area: "Vila Nova", rooms: 2, price: 530000, size: 122 },
  ];
  const cards = examples.map((item, index) => `<button class="property" data-index="${index}" data-type="${item.type}" data-area="${item.area}" data-rooms="${item.rooms}" data-price="${item.price}"><span class="visual visual-${index % 3}"><span>IMÓVEL DEMONSTRATIVO</span><b>0${index + 1}</b></span><span class="property-content"><small>${item.type} · ${item.area}</small><strong>Exemplo ${index + 1} — ${item.type.toLowerCase()} em ${item.area}</strong><span class="facts">${item.size} m² <i>·</i> ${item.rooms} quartos</span><span class="price">${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(item.price)}</span></span></button>`).join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(project.name)} — Imóveis</title><style>
  *{box-sizing:border-box}body{margin:0;color:#152b27;background:#f8f8f4;font-family:Arial,Helvetica,sans-serif}a{color:inherit;text-decoration:none}button,select{font:inherit}header{display:flex;align-items:center;justify-content:space-between;padding:23px 6%;background:white;gap:18px}header strong{font-size:24px;letter-spacing:-.06em}header nav{display:flex;flex-wrap:wrap;gap:24px;font-size:14px}header nav a:hover{color:#167664}.hero{padding:80px 6% 105px;background:#123c35;color:#fff;position:relative;overflow:hidden}.hero:after{content:'';position:absolute;width:430px;height:430px;border:1px solid #ffffff30;border-radius:50%;right:-90px;top:-80px;box-shadow:0 0 0 70px #ffffff08,0 0 0 150px #ffffff06;pointer-events:none}.hero>*{position:relative;z-index:1}.eyebrow,.kicker{font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#96cfc0}.hero h1{font-family:Georgia,serif;font-weight:400;font-size:clamp(42px,6vw,80px);line-height:1.08;letter-spacing:-.045em;max-width:820px;margin:22px 0}.hero p{max-width:630px;line-height:1.75;color:#d8e7df;font-size:18px}.search{display:grid;grid-template-columns:repeat(4,1fr) auto;gap:10px;background:#fff;padding:16px;border-radius:18px;box-shadow:0 24px 55px #142d2230;max-width:1180px;margin:-50px auto 0;position:relative;z-index:2}.search label{font-size:11px;font-weight:700;color:#61716a;display:block;padding:6px 12px}.search select{display:block;width:100%;border:0;background:transparent;color:#152b27;padding:9px 0;outline:0}.search button,.action{border:0;border-radius:10px;background:#c39b68;color:#142820;font-weight:800;padding:18px 24px;cursor:pointer}.wrap{max-width:1220px;margin:auto;padding:80px 28px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:30px}.section-head h2{font:400 clamp(30px,4vw,48px) Georgia,serif;letter-spacing:-.04em;margin:10px 0 0}.section-head p{color:#66736d;font-size:13px}.properties{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.property{text-align:left;border:1px solid #e3e8e2;background:#fff;border-radius:15px;overflow:hidden;cursor:pointer;padding:0;color:inherit;transition:transform .2s,box-shadow .2s}.property:hover{transform:translateY(-4px);box-shadow:0 16px 35px #0b32251a}.visual{display:flex;height:190px;align-items:end;justify-content:space-between;padding:18px;color:#fff;background:linear-gradient(140deg,#95a99d,#345448)}.visual-1{background:linear-gradient(140deg,#c5bba7,#746b57)}.visual-2{background:linear-gradient(140deg,#b3c4bb,#596d66)}.visual span{font-size:10px;letter-spacing:.16em;font-weight:800;background:#17372ba8;padding:8px;border-radius:4px}.visual b{font:50px Georgia,serif;opacity:.4}.property-content{display:flex;flex-direction:column;gap:11px;padding:20px}.property-content small{color:#527c6f;text-transform:uppercase;font-weight:800;letter-spacing:.08em}.property-content strong{font:22px Georgia,serif}.facts{color:#758079;font-size:13px}.facts i{padding:0 8px}.price{padding-top:8px;border-top:1px solid #e8eee8;font-size:21px;font-weight:800}.empty{display:none;color:#6d7770;padding:28px;border:1px dashed #aab8ac;border-radius:12px}.editorial{background:#eaf0eb}.editorial .wrap{padding-top:70px;padding-bottom:70px}.features{display:grid;grid-template-columns:repeat(3,1fr);gap:25px}.features article{border-top:1px solid #baccc1;padding:25px 10px 0 0}.features h3{font:25px Georgia,serif;margin:16px 0}.features p{line-height:1.7;color:#5b6d62}.marker{color:#ae8a5e;font-size:24px}.detail{position:fixed;inset:0;background:#071b16a8;z-index:10;display:none;align-items:center;justify-content:center;padding:20px}.detail.open{display:flex}.detail-panel{width:min(550px,100%);background:#fff;border-radius:18px;padding:30px;max-height:90vh;overflow:auto}.detail-panel h2{font:36px Georgia,serif;margin:10px 0}.detail-panel p{line-height:1.7;color:#5b6d62}.detail-panel .action{display:inline-block;margin-top:12px;text-decoration:none}.close{float:right;border:0;background:#edf2ed;padding:10px 13px;border-radius:8px;cursor:pointer}footer{background:#123c35;color:#d4e5dc;padding:36px 6%;font-size:13px}@media(max-width:850px){.search{grid-template-columns:repeat(2,1fr);margin:-35px 20px 0}.search button{grid-column:span 2}.properties,.features{grid-template-columns:repeat(2,1fr)}}@media(max-width:570px){header{align-items:start;flex-direction:column}.hero{padding:65px 6% 90px}.search,.properties,.features{grid-template-columns:1fr}.search button{grid-column:auto}.wrap{padding:60px 20px}}
  </style></head><body><header><strong>${escapeHtml(project.name)}</strong><nav>${nav}</nav></header><main><section class="hero"><div class="eyebrow">${escapeHtml(page.eyebrow)}</div><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.introduction)}</p></section><form class="search" id="search"><label>TIPO<select id="type"><option value="">Todos os tipos</option><option>Apartamento</option><option>Casa</option></select></label><label>BAIRRO<select id="area"><option value="">Todos os bairros</option><option>Centro</option><option>Jardins</option><option>Vila Nova</option></select></label><label>QUARTOS<select id="rooms"><option value="">Qualquer quantidade</option><option value="1">1 ou mais</option><option value="2">2 ou mais</option><option value="3">3 ou mais</option><option value="4">4 ou mais</option></select></label><label>PREÇO ATÉ<select id="price"><option value="">Sem limite</option><option value="400000">R$ 400 mil</option><option value="600000">R$ 600 mil</option><option value="800000">R$ 800 mil</option><option value="1000000">R$ 1 milhão</option></select></label><button type="submit">Buscar imóveis →</button></form><section class="wrap" id="list"><div class="section-head"><div><span class="kicker">Vitrine de imóveis</span><h2>Encontre o seu próximo lugar</h2></div><p>Dados demonstrativos para explorar o site. Substitua pelo catálogo real.</p></div><div class="properties">${cards}</div><p class="empty" id="empty">Nenhum imóvel demonstrativo atende a esses filtros. Ajuste sua busca.</p></section><section class="editorial"><div class="wrap"><span class="kicker">${escapeHtml(project.name)}</span><div class="section-head"><h2>Uma experiência feita para decidir bem.</h2></div><div class="features">${sections}</div></div></section></main><div class="detail" id="detail" role="dialog" aria-modal="true" aria-label="Detalhes do imóvel"><div class="detail-panel"><button class="close" id="close" aria-label="Fechar">✕</button><span class="kicker">IMÓVEL DEMONSTRATIVO</span><h2 id="detail-title"></h2><p id="detail-facts"></p><strong id="detail-price"></strong><p>Esta ficha ilustra o funcionamento da página. Adicione fotos, descrição, endereço e informações reais antes de publicar um imóvel.</p><a class="action" href="#contato" data-page="contato">Falar com a imobiliária →</a></div></div><footer>${escapeHtml(project.name)} · Prévia com imóveis demonstrativos</footer><script>
  const examples=${JSON.stringify(examples)};const cards=document.querySelectorAll('.property');document.getElementById('search').addEventListener('submit',function(e){e.preventDefault();let visible=0;cards.forEach(function(card){let match=(!document.getElementById('type').value||card.dataset.type===document.getElementById('type').value)&&(!document.getElementById('area').value||card.dataset.area===document.getElementById('area').value)&&(!document.getElementById('rooms').value||Number(card.dataset.rooms)>=Number(document.getElementById('rooms').value))&&(!document.getElementById('price').value||Number(card.dataset.price)<=Number(document.getElementById('price').value));card.hidden=!match;if(match)visible++});document.getElementById('empty').style.display=visible?'none':'block';document.getElementById('list').scrollIntoView({behavior:'smooth'})});cards.forEach(function(card){card.addEventListener('click',function(){let item=examples[Number(card.dataset.index)];document.getElementById('detail-title').textContent=item.type+' em '+item.area;document.getElementById('detail-facts').textContent=item.size+' m² · '+item.rooms+' quartos · '+item.area;document.getElementById('detail-price').textContent=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(item.price);document.getElementById('detail').classList.add('open')})});document.getElementById('close').onclick=function(){document.getElementById('detail').classList.remove('open')};document.getElementById('detail').addEventListener('click',function(e){if(e.target===this)this.classList.remove('open')});document.addEventListener('click',function(e){let link=e.target.closest('[data-page]');if(link){e.preventDefault();parent.postMessage({type:'pagenova-site-preview-page',key:link.dataset.page},'*')}});
  </script></body></html>`;
}
import { getSitePreset } from "@/lib/site-builder-presets";
