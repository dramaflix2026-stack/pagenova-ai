import type { SitePage, SitePageKey, SiteProject } from "@/lib/site-builder";

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

const properties = [
  { id: 1, type: "Apartamento", area: "Centro", rooms: 2, baths: 2, parking: 1, size: 78, price: 420000 },
  { id: 2, type: "Casa", area: "Jardins", rooms: 3, baths: 2, parking: 2, size: 156, price: 750000 },
  { id: 3, type: "Apartamento", area: "Vila Nova", rooms: 1, baths: 1, parking: 1, size: 49, price: 310000 },
  { id: 4, type: "Casa", area: "Centro", rooms: 4, baths: 3, parking: 2, size: 211, price: 980000 },
  { id: 5, type: "Apartamento", area: "Jardins", rooms: 3, baths: 2, parking: 2, size: 104, price: 590000 },
  { id: 6, type: "Casa", area: "Vila Nova", rooms: 2, baths: 2, parking: 1, size: 122, price: 530000 },
  { id: 7, type: "Studio", area: "Centro", rooms: 1, baths: 1, parking: 0, size: 36, price: 270000 },
  { id: 8, type: "Cobertura", area: "Jardins", rooms: 4, baths: 3, parking: 3, size: 188, price: 1240000 },
  { id: 9, type: "Apartamento", area: "Vila Nova", rooms: 2, baths: 1, parking: 1, size: 67, price: 390000 },
];

function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(value);
}

export function renderRealEstatePage(
  project: SiteProject,
  page: SitePage,
  pageKey: SitePageKey,
): string {
  const name = escape(project.name);
  const nav = ([
    ["home", "Início"], ["sobre", "Sobre"], ["servicos", "Imóveis"], ["contato", "Contato"],
  ] as const).filter(([key]) => project.pages[key])
    .map(([key, label]) =>
      `<a href="#${key}" data-page="${key}" ${key === pageKey ? 'aria-current="page"' : ""}>${label}</a>`
    ).join("");

  const cards = properties.map((item) => `
    <button type="button" class="property" data-property="${item.id}"
      data-type="${item.type}" data-area="${item.area}"
      data-rooms="${item.rooms}" data-price="${item.price}">
      <span class="property-art art-${item.id % 4}">
        <span class="sample">IMÓVEL DEMONSTRATIVO</span>
        <span class="art-number">${String(item.id).padStart(2, "0")}</span>
      </span>
      <span class="property-body">
        <span class="meta">${item.type} · ${item.area}</span>
        <strong>${item.type} em ${item.area}</strong>
        <span class="features">${item.size} m² · ${item.rooms} quartos · ${item.parking} vagas</span>
        <span class="bottom"><b>${formatPrice(item.price)}</b><span>Ver detalhes ↗</span></span>
      </span>
    </button>`).join("");

  const about = page.sections.map(({ title, body }, index) =>
    `<article class="about-item"><span>0${index + 1}</span><h3>${escape(title)}</h3><p>${escape(body)}</p></article>`
  ).join("");

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} — ${escape(page.heading)}</title>
<style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f7f5ef;color:#202822;font-family:Arial,Helvetica,sans-serif}
button,select{font:inherit}button{cursor:pointer}a{color:inherit;text-decoration:none}[hidden]{display:none!important}
header{background:#fff;display:flex;justify-content:space-between;align-items:center;gap:22px;padding:22px max(5%,calc((100% - 1200px)/2));border-bottom:1px solid #e9e5dd}
.brand{font-size:22px;font-weight:800;letter-spacing:-.055em}nav{display:flex;flex-wrap:wrap;gap:25px;font-size:14px}nav a[aria-current]{color:#bd6848;font-weight:800}
.shell{max-width:1200px;margin:auto;padding-left:28px;padding-right:28px}
.hero{background:#f0ebe2;border-bottom:1px solid #e4dccf}.hero-grid{display:grid;grid-template-columns:1.25fr .75fr;align-items:center;gap:70px;padding-top:75px;padding-bottom:75px}
.eyebrow{font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#b45b40}
h1,h2,h3{font-family:Georgia,serif;font-weight:400;letter-spacing:-.045em}h1{font-size:clamp(42px,5.5vw,76px);line-height:1.07;margin:20px 0;max-width:780px}
.hero p,.intro{line-height:1.75;color:#67675f;font-size:17px;max-width:650px}
.hero-art{min-height:360px;border-radius:12px;background:linear-gradient(155deg,#c2b7a7,#858679 60%,#46584e);position:relative;overflow:hidden}
.hero-art:before{content:"";position:absolute;left:12%;right:12%;bottom:0;height:75%;border:2px solid #fff6;border-bottom:0;border-radius:130px 130px 0 0;box-shadow:0 0 0 28px #ffffff0d}
.hero-art span{position:absolute;bottom:22px;left:22px;background:#fff;padding:10px 13px;border-radius:5px;font-size:10px;font-weight:800;letter-spacing:.12em}
.section{padding-top:76px;padding-bottom:86px}.section-title{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:29px}
h2{font-size:clamp(33px,4vw,49px);margin:10px 0 0}.section-title p{font-size:13px;color:#77796f}
.filters{display:grid;grid-template-columns:repeat(4,1fr) auto;gap:10px;align-items:end;background:#fff;border:1px solid #e7e1d7;border-radius:12px;padding:18px;margin-bottom:35px;box-shadow:0 12px 32px #1b27100b}
.filters label{font-size:11px;letter-spacing:.06em;font-weight:800;color:#777870}.filters select{margin-top:8px;width:100%;height:42px;padding:0 10px;background:#fbfaf7;border:1px solid #deddd5;border-radius:7px;color:#202822}
.filters button,.primary{border:0;border-radius:7px;background:#bd6848;color:#fff;padding:13px 18px;font-weight:800;min-height:42px}
.properties{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.property{text-align:left;border:1px solid #e7e1d7;background:#fff;border-radius:11px;padding:0;overflow:hidden;color:inherit;transition:transform .2s,box-shadow .2s}
.property:hover{transform:translateY(-4px);box-shadow:0 18px 42px #1d291921}
.property-art{height:215px;display:flex;align-items:end;justify-content:space-between;padding:16px;background:linear-gradient(135deg,#c4c0b3,#6d8279);color:#fff}
.art-1{background:linear-gradient(135deg,#c9c1b2,#847b71)}.art-2{background:linear-gradient(135deg,#abbdb7,#5c766e)}.art-3{background:linear-gradient(135deg,#d2c1aa,#826f5c)}
.sample{background:#19271da8;border-radius:4px;padding:8px;font-size:9px;font-weight:800;letter-spacing:.1em}.art-number{font:48px Georgia,serif;opacity:.45}
.property-body{display:flex;flex-direction:column;gap:12px;padding:22px}.meta{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#b45b40}
.property-body strong{font:24px Georgia,serif;letter-spacing:-.025em}.features{font-size:13px;color:#73776e}
.bottom{border-top:1px solid #eee9e0;padding-top:17px;display:flex;justify-content:space-between;align-items:center;gap:8px}.bottom b{font-size:19px}.bottom span{font-size:12px;color:#b45b40;font-weight:800}
.empty{border:1px dashed #c8c4b7;border-radius:10px;padding:30px;color:#71766b}
.about{background:#e9eee8}.about-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:30px}.about-item{border-top:1px solid #b9c8ba;padding:23px 12px 0 0}
.about-item span{color:#b45b40;font-weight:800}.about-item h3{font-size:25px;margin:17px 0 8px}.about-item p{font-size:14px;line-height:1.7;color:#59675c}
.detail{padding-top:45px;padding-bottom:95px}.back{border:0;background:transparent;padding:10px 0;color:#b45b40;font-weight:800}
.detail-grid{display:grid;grid-template-columns:1.4fr .6fr;gap:38px;margin-top:30px}
.gallery-main{min-height:390px;display:flex;align-items:end;padding:25px;border-radius:12px;background:linear-gradient(135deg,#c5b9a7,#526b5c);color:#fff}
.gallery-main span{background:#19271dba;padding:10px;border-radius:4px;font-size:11px;letter-spacing:.12em}
.gallery-thumbs{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:12px}.gallery-thumbs span{height:90px;border-radius:8px;background:linear-gradient(135deg,#b7c8be,#648079)}
.gallery-thumbs span:nth-child(2){background:linear-gradient(135deg,#d3c1ae,#8e7866)}.gallery-thumbs span:nth-child(3){background:linear-gradient(135deg,#c9cab9,#66766b)}
.detail h1{font-size:clamp(37px,4.5vw,58px)}.detail-side{border:1px solid #e7e1d7;border-radius:12px;background:white;padding:28px;height:max-content;position:sticky;top:20px}
.detail-side .price{font-size:29px;font-weight:800;margin:15px 0}.detail-side p{line-height:1.7;color:#686f66}.detail-side .primary{display:block;text-align:center;margin-top:22px}
.specs{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:25px 0}.spec{background:white;border:1px solid #e7e1d7;border-radius:9px;padding:20px;text-align:center}
.spec b{display:block;font-size:20px}.spec span{display:block;color:#77796f;font-size:12px;margin-top:5px}
.detail-description{line-height:1.8;color:#606a60;max-width:700px}.detail-note{font-size:13px;color:#77796f;line-height:1.6;margin-top:25px}
footer{padding:32px 6%;background:#243a30;color:#e4e9df;font-size:13px}
@media(max-width:900px){.hero-grid,.detail-grid{grid-template-columns:1fr}.hero-art{min-height:260px}.filters{grid-template-columns:repeat(2,1fr)}.filters button{grid-column:span 2}.properties,.about-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:620px){header{align-items:start;flex-direction:column}.shell{padding-left:18px;padding-right:18px}.hero-grid{padding-top:55px;padding-bottom:55px;gap:28px}.filters,.properties,.about-grid{grid-template-columns:1fr}.filters button{grid-column:auto}.section{padding-top:60px;padding-bottom:65px}.specs{grid-template-columns:repeat(2,1fr)}.property-art{height:190px}}
</style></head><body>
<header><strong class="brand">${name}</strong><nav>${nav}</nav></header>
<div id="listing">
${pageKey === "servicos" ? "" : `<section class="hero"><div class="shell hero-grid"><div>
<span class="eyebrow">${escape(page.eyebrow)}</span><h1>${escape(page.heading)}</h1>
<p>${escape(page.introduction)}</p></div><div class="hero-art"><span>SEU CATÁLOGO COMEÇA AQUI</span></div></div></section>`}
${pageKey === "sobre" ? `<section class="about"><div class="shell section"><span class="eyebrow">Sobre ${name}</span><h2>${escape(page.heading)}</h2><p class="intro">${escape(page.introduction)}</p><div class="about-grid">${about}</div></div></section>` : `
<main class="shell section" id="results">
<div class="section-title"><div><span class="eyebrow">Busca de imóveis</span><h2>${pageKey === "servicos" ? escape(page.heading) : "Explore as oportunidades"}</h2></div>
<p>Imóveis demonstrativos para visualizar o funcionamento. Adicione um catálogo real antes de publicar.</p></div>
<form class="filters" id="filters">
<label>TIPO<select id="type"><option value="">Todos os tipos</option><option>Apartamento</option><option>Casa</option><option>Studio</option><option>Cobertura</option></select></label>
<label>BAIRRO<select id="area"><option value="">Todos os bairros</option><option>Centro</option><option>Jardins</option><option>Vila Nova</option></select></label>
<label>QUARTOS<select id="rooms"><option value="">Qualquer quantidade</option><option value="1">1 ou mais</option><option value="2">2 ou mais</option><option value="3">3 ou mais</option><option value="4">4 ou mais</option></select></label>
<label>PREÇO ATÉ<select id="price"><option value="">Sem limite</option><option value="400000">R$ 400 mil</option><option value="600000">R$ 600 mil</option><option value="900000">R$ 900 mil</option><option value="1500000">R$ 1,5 milhão</option></select></label>
<button type="submit">Buscar →</button></form>
<div class="section-title"><h2>Imóveis disponíveis</h2><p id="count">9 demonstrativos</p></div>
<div class="properties">${cards}</div><p class="empty" id="empty" hidden>Nenhum imóvel demonstrativo atende aos filtros selecionados.</p>
</main><section class="about"><div class="shell section"><span class="eyebrow">Uma jornada mais simples</span><h2>Da busca ao primeiro contato.</h2>
<div class="about-grid"><article class="about-item"><span>01</span><h3>Filtre</h3><p>Encontre opções por tipo, bairro, quartos e faixa de preço.</p></article>
<article class="about-item"><span>02</span><h3>Conheça</h3><p>Abra cada ficha para consultar características e detalhes.</p></article>
<article class="about-item"><span>03</span><h3>Converse</h3><p>Entre em contato para falar sobre o imóvel escolhido.</p></article></div></div></section>`}
</div>
<section class="shell detail" id="detail" hidden><button type="button" class="back" id="back">← Voltar aos imóveis</button>
<div class="detail-grid"><div><div class="gallery-main"><span>GALERIA DEMONSTRATIVA · INSIRA FOTOS REAIS</span></div>
<div class="gallery-thumbs"><span></span><span></span><span></span></div>
<span class="eyebrow" id="detail-type"></span><h1 id="detail-title"></h1><p class="intro" id="detail-area"></p>
<div class="specs"><div class="spec"><b id="detail-size"></b><span>Área</span></div><div class="spec"><b id="detail-rooms"></b><span>Quartos</span></div><div class="spec"><b id="detail-baths"></b><span>Banheiros</span></div><div class="spec"><b id="detail-parking"></b><span>Vagas</span></div></div>
<h2>Sobre este imóvel</h2><p class="detail-description">Esta ficha demonstra a navegação. Preencha descrição, fotos, endereço e informações verificadas do imóvel para transformá-la em anúncio real.</p>
<p class="detail-note">Localização e mapa aparecem quando houver endereço real cadastrado.</p></div>
<aside class="detail-side"><span class="eyebrow">Valor demonstrativo</span><div class="price" id="detail-price"></div>
<p>Gostou deste perfil de imóvel? A equipe poderá orientar você quando o catálogo real estiver cadastrado.</p>
<a href="#contato" data-page="contato" class="primary">Falar sobre este imóvel →</a>
<p class="detail-note">Os dados exibidos nesta prévia são exemplos e não representam ofertas disponíveis.</p></aside></div></section>
<footer>${name} · Prévia imobiliária com catálogo demonstrativo</footer>
<script>
const items=${JSON.stringify(properties)};
const cards=document.querySelectorAll("[data-property]");
const filters=document.getElementById("filters");
if(filters)filters.addEventListener("submit",function(event){
 event.preventDefault();
 const type=document.getElementById("type").value,area=document.getElementById("area").value;
 const rooms=Number(document.getElementById("rooms").value||0),price=Number(document.getElementById("price").value||0);
 let count=0;
 cards.forEach(function(card){
   const show=(!type||card.dataset.type===type)&&(!area||card.dataset.area===area)&&
     Number(card.dataset.rooms)>=rooms&&(!price||Number(card.dataset.price)<=price);
   card.hidden=!show;if(show)count++;
 });
 document.getElementById("count").textContent=count+" encontrado"+(count===1?"":"s");
 document.getElementById("empty").hidden=count>0;
 document.getElementById("results").scrollIntoView({behavior:"smooth"});
});
cards.forEach(function(card){card.addEventListener("click",function(){
 const item=items.find(function(value){return value.id===Number(card.dataset.property)});
 if(!item)return;
 document.getElementById("detail-type").textContent=item.type+" · Imóvel demonstrativo";
 document.getElementById("detail-title").textContent=item.type+" em "+item.area;
 document.getElementById("detail-area").textContent="Bairro "+item.area+" · Localização ilustrativa";
 document.getElementById("detail-size").textContent=item.size+" m²";
 document.getElementById("detail-rooms").textContent=String(item.rooms);
 document.getElementById("detail-baths").textContent=String(item.baths);
 document.getElementById("detail-parking").textContent=String(item.parking);
 document.getElementById("detail-price").textContent=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(item.price);
 document.getElementById("listing").hidden=true;document.getElementById("detail").hidden=false;
 window.scrollTo({top:0,behavior:"smooth"});
})});
document.getElementById("back").addEventListener("click",function(){
 document.getElementById("detail").hidden=true;document.getElementById("listing").hidden=false;
 window.scrollTo({top:0,behavior:"smooth"});
});
document.addEventListener("click",function(event){
 const link=event.target.closest("[data-page]");
 if(link){event.preventDefault();parent.postMessage({type:"pagenova-site-preview-page",key:link.dataset.page},"*")}
});
</script></body></html>`;
}