import test from "node:test";
import assert from "node:assert/strict";
import {applyHeroBannerCopy,isScopedBannerCopyRequest,getHeroBannerImages} from "../src/lib/builder-v2-hero-banner-edits.ts";

const existing=()=>({
  heroComposition:"duo",
  blocks:[
    {id:"header",type:"heading",section:"inicio",text:"Studio Arquitetura & Design"},
    {id:"desc",type:"paragraph",section:"inicio",text:"Criamos espaços que combinam forma e beleza."},
    {id:"button",type:"button",section:"inicio",text:"Conheça nossos serviços",href:"#servicos"},
    {id:"visual-0",type:"image",section:"inicio",src:"https://store/old-first"},
    {id:"uploaded-second",type:"image",section:"inicio",src:"https://store/new-second"},
    {id:"other",type:"image",section:"servicos",src:"https://store/other"}
  ]
});
test("an uploaded second hero is its own banner without new site sections",()=>{
  const site=existing();
  assert.equal(getHeroBannerImages(site).length,2);
  assert.equal(site.blocks.filter(b=>b.type==="image"&&b.section==="inicio").length,2);
});
test("second banner headline is independent of the approved first",()=>{
  const site=existing();
  const result=applyHeroBannerCopy(site,'Altere o título do segundo banner para "Arquitetura que inspira"');
  assert.equal(result.site.heroBannerCopy["uploaded-second"].title,"Arquitetura que inspira");
  assert.deepEqual(result.site.blocks,site.blocks);
  assert.equal(site.heroBannerCopy,undefined);
});
test("second banner description and CTA can be edited together",()=>{
  const site=existing();
  const result=applyHeroBannerCopy(site,'Mude a descrição do segundo banner para "Ambientes elegantes" e o botão para "Veja o portfólio"');
  assert.equal(result.site.heroBannerCopy["uploaded-second"].description,"Ambientes elegantes");
  assert.equal(result.site.heroBannerCopy["uploaded-second"].buttonText,"Veja o portfólio");
  assert.deepEqual(result.site.blocks,site.blocks);
});
test("second banner link is updated only when valid",()=>{
  const site=existing();
  const result=applyHeroBannerCopy(site,'Altere o link do banner 2 para "#galeria"');
  assert.equal(result.site.heroBannerCopy["uploaded-second"].buttonHref,"#galeria");
  assert.throws(()=>applyHeroBannerCopy(site,'Altere o link do banner 2 para "javascript:alert(1)"'),/link ou âncora válido/);
});
test("primary banner edits and unrelated section text are not intercepted",()=>{
  assert.equal(isScopedBannerCopyRequest('Troque o título da capa principal'),false);
  assert.equal(isScopedBannerCopyRequest('Centralize o botão da seção serviços'),false);
  assert.equal(isScopedBannerCopyRequest('Troque a foto 2 do banner'),false);
});
test("a nonexistent third banner is not silently edited",()=>{
  const site=existing();
  site.heroComposition="trio";
  assert.throws(()=>applyHeroBannerCopy(site,'Mude o título do terceiro banner para "Novo título"'),/Não encontrei o banner 3/);
});
