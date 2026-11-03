import test from "node:test";
import assert from "node:assert/strict";
import {fixture,render} from "./builder-v2-renderer-harness.mjs";
test("actual classic renderer honors explicit heading colors, typography and relative CTA URLs",()=>{
 for(const templateId of ["institutional-complete","minimalist-sophisticated"]){
  const site={...fixture(),templateId};
  for(const publishedMode of [false,true]){
   const $=render(site,publishedMode);
   assert.match($('[data-block-id="hero"]').attr("style"),/color:#663399/);
   assert.equal($('[data-block-id="cta"]').attr("href"),"/contato?origem=site#form");
   assert.match($('[data-block-id="intro"]').attr("style"),/font-family:Georgia/);
   assert.equal($('[data-block-id="intro"]').attr("data-pn-responsive-mobile-size"),"true");
   assert.match($('[data-block-id="cta"]').attr("style"),/font-size:19px/);
   assert.equal($('[data-block-id="cta"]').attr("data-pn-responsive-mobile-size"),"true");
  }
 }
});
test("actual preview and public render preserve reordered sections and removed blocks",()=>{
 const site=fixture();site.blocks=[...site.blocks.filter(b=>b.section==="faq"),...site.blocks.filter(b=>b.section==="inicio"&&b.id!=="intro")];
 for(const publishedMode of [false,true]){
  const $=render(site,publishedMode);
  assert.equal($('[data-block-id="intro"]').length,0);
  const html=$.html();assert.ok(html.indexOf('data-block-id="faq"')<html.indexOf('data-block-id="hero"'));
 }
});

test("actual TP3 models preserve section removals and reordering in preview and public snapshots",async()=>{
 const {applyUniversalNaturalLanguage}=await import("../src/lib/builder-v2-universal-language.ts");
 for(const variant of ["01","02","03"]){
  const site={...fixture(),niche:"Restaurante",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.push({id:"about",type:"heading",section:"sobre",text:"Sobre a marca",color:"#111",align:"left"},{id:"gallery",type:"heading",section:"galeria",text:"Galeria cadastrada",color:"#111",align:"left"});
  const changed=applyUniversalNaturalLanguage(site,"Remova a seção inicio e mova a galeria para antes da seção sobre");
  assert.equal(changed?.ok,true,changed?.error);
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(changed.site)),publishedMode);
   assert.equal($('[data-universal-section="inicio"]').length,0);
   const order=$('[data-universal-section]').map((_,element)=>$(element).attr("data-universal-section")).get();
   assert.ok(order.includes("galeria"),"TP3 "+variant+" must use its approved renderer");
   assert.equal(order.indexOf("galeria"),order.indexOf("sobre")-1);
   assert.equal($("header").length,1);
  }
 }
});

test("TP3 edited FAQ never resurrects preset questions when its paragraph is empty",()=>{
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Restaurante",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks=site.blocks.filter(block=>block.id!=="question");
  site.blocks.push({id:"faq-edited",type:"paragraph",section:"faq",text:"",color:"#111",align:"left"});
  for(const publishedMode of [false,true]){
   const $=render(site,publishedMode);
   assert.equal($('[data-universal-section="faq"] article, [data-universal-section="faq"] .tp3m3-faq-item').length,0,"empty edited FAQ must not restore presets");
  }
  site.blocks[site.blocks.length-1].text="Posso reservar? Entre em contato para confirmar.";
  for(const publishedMode of [false,true]){
   const $=render(site,publishedMode);
   assert.equal($('[data-universal-section="faq"] article, [data-universal-section="faq"] .tp3m3-faq-item').length,1);
   assert.match($('[data-universal-section="faq"]').text(),/Posso reservar\?/);
  }
 }
});

test("universal adapter keeps every specialized section when identifiers collide",async()=>{
 const {createRequire}=await import("node:module");
 const require=createRequire(import.meta.url);
 const React=require("react");
 const {renderToStaticMarkup}=require("react-dom/server");
 const {UniversalTemplateSections}=require("../src/components/builder-v2-universal-sections.tsx");
 const section=(id,content)=>React.createElement("section",{"data-universal-section":id},content);
 const site={universalSectionEvents:[{action:"move",section:{id:"sobre"},before:{id:"inicio"}}]};
 const html=renderToStaticMarkup(React.createElement(UniversalTemplateSections,{site},section("inicio","Primeira capa"),section("inicio","Segunda capa"),section("sobre","Sobre")));
 assert.match(html,/Primeira capa/);
 assert.match(html,/Segunda capa/);
 assert.ok(html.indexOf("Primeira capa")<html.indexOf("Segunda capa"));
 assert.ok(html.indexOf("Segunda capa")<html.indexOf("Sobre"));
});

test("universal section adapter does not anchor a move to a removed section",async()=>{
 const {createRequire}=await import("node:module");
 const require=createRequire(import.meta.url);
 const React=require("react");
 const {renderToStaticMarkup}=require("react-dom/server");
 const {UniversalTemplateSections}=require("../src/components/builder-v2-universal-sections.tsx");
 const section=(id)=>React.createElement("section",{"data-universal-section":id},id);
 const site={universalSectionEvents:[
  {action:"remove",section:{id:"sobre"}},
  {action:"move",section:{id:"contato"},before:{id:"sobre"}}
 ]};
 const html=renderToStaticMarkup(React.createElement(UniversalTemplateSections,{site},section("inicio"),section("sobre"),section("galeria"),section("contato")));
 const $=(await import("cheerio")).load(html);
 assert.deepEqual($("[data-universal-section]").map((_,node)=>$(node).attr("data-universal-section")).get(),["inicio","galeria","contato"]);
});

test("TP1 model 02 actual preview/public render honors removal, movement and reload",async()=>{
 const {applyUniversalOperations}=await import("../src/lib/builder-v2-universal-operations.ts");
 const site={...fixture(),niche:"Salão de beleza premium",templateId:"prompt-adaptive",briefingLayoutVariant:"02"};
 site.blocks.push(
  {id:"tp1-about",type:"heading",section:"sobre",text:"Sobre a marca",color:"#111",align:"left"},
  {id:"tp1-services",type:"heading",section:"servicos",text:"Serviços",color:"#111",align:"left"},
  {id:"tp1-gallery",type:"heading",section:"galeria",text:"Galeria",color:"#111",align:"left"}
 );
 const result=applyUniversalOperations(site,[
  {action:"remove-section",sectionId:"servicos"},
  {action:"move-section",sectionId:"galeria",beforeSectionId:"sobre"}
 ]);
 assert.equal(result.ok,true,result.error);
 if(!result.ok)return;
 const restored=JSON.parse(JSON.stringify(result.site));
 for(const publishedMode of [false,true]){
  const $=render(restored,publishedMode);
  assert.equal($('[data-universal-section="servicos"]').length,0);
  assert.equal($('[data-universal-section="galeria"]').length,1);
  assert.equal($('[data-universal-section="sobre"]').length,1);
  const order=$('[data-universal-section]').map((_,el)=>$(el).attr("data-universal-section")).get();
  assert.ok(order.indexOf("galeria")<order.indexOf("sobre"),"gallery must precede about in TP1 "+publishedMode);
 }
});

test("TP1 model 02 keeps removed sections hidden after follow-up AI edit and reload",async()=>{
 const {applyUniversalOperations}=await import("../src/lib/builder-v2-universal-operations.ts");
 const {applyUniversalNaturalLanguage}=await import("../src/lib/builder-v2-universal-language.ts");
 const site={...fixture(),niche:"Salão de beleza premium",templateId:"prompt-adaptive",briefingLayoutVariant:"02"};
 site.blocks.push({id:"about-title",type:"heading",section:"sobre",text:"Sobre a empresa",color:"#111",align:"left"},
  {id:"service-title",type:"heading",section:"servicos",text:"Serviços oferecidos",color:"#111",align:"left"});
 const removed=applyUniversalOperations(site,[{action:"remove-section",sectionId:"servicos"}]);
 assert.equal(removed.ok,true,removed.error);
 if(!removed.ok)return;
 const edited=applyUniversalNaturalLanguage(removed.site,'Altere o texto "Sobre a empresa" para "Nossa essência"');
 assert.equal(edited?.ok,true,edited?.error);
 if(!edited?.ok)return;
 const reloaded=JSON.parse(JSON.stringify(edited.site));
 for(const publishedMode of [false,true]){
  const $=render(reloaded,publishedMode);
  assert.equal($('[data-universal-section="servicos"]').length,0,"removed services must remain hidden");
  assert.equal($('[data-universal-section="sobre"]').length,1);
  assert.match($('[data-universal-section="sobre"]').text(),/Nossa essência/);
 }
});

test("TP2 model 02 renders universal removal and movement in preview and public output",async()=>{
 const {applyUniversalOperations}=await import("../src/lib/builder-v2-universal-operations.ts");
 const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:"02"};
 site.blocks.push({id:"tp2-about",type:"heading",section:"sobre",text:"Sobre a empresa"},
  {id:"tp2-services",type:"heading",section:"servicos",text:"Especialidades"},
  {id:"tp2-gallery",type:"heading",section:"galeria",text:"Galeria"});
 const result=applyUniversalOperations(site,[
  {action:"remove-section",sectionId:"servicos"},
  {action:"move-section",sectionId:"galeria",beforeSectionId:"sobre"}
 ]);
 assert.equal(result.ok,true,result.error);
 if(!result.ok)return;
 for(const publishedMode of [false,true]){
  const $=render(JSON.parse(JSON.stringify(result.site)),publishedMode);
  assert.equal($('[data-universal-section="servicos"]').length,0);
  const order=$('[data-universal-section]').map((_,node)=>$(node).attr("data-universal-section")).get();
  assert.ok(order.indexOf("galeria")>=0&&order.indexOf("galeria")<order.indexOf("sobre"));
  assert.equal($("header").length,1);
 }
});

test("TP2 model 03 preserves section removal and movement after reload in preview and public output",async()=>{
 const {applyUniversalOperations}=await import("../src/lib/builder-v2-universal-operations.ts");
 const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:"03"};
 site.blocks.push({id:"tp2m3-about",type:"heading",section:"sobre",text:"Sobre"},
  {id:"tp2m3-services",type:"heading",section:"servicos",text:"Especialidades"},
  {id:"tp2m3-gallery",type:"heading",section:"galeria",text:"Galeria"});
 const result=applyUniversalOperations(site,[
  {action:"remove-section",sectionId:"servicos"},
  {action:"move-section",sectionId:"galeria",beforeSectionId:"sobre"}
 ]);
 assert.equal(result.ok,true,result.error);
 if(!result.ok)return;
 for(const publishedMode of [false,true]){
  const $=render(JSON.parse(JSON.stringify(result.site)),publishedMode);
  assert.equal($('[data-universal-section="servicos"]').length,0);
  const order=$('[data-universal-section]').map((_,node)=>$(node).attr("data-universal-section")).get();
  assert.ok(order.indexOf("galeria")>=0&&order.indexOf("galeria")<order.indexOf("sobre"));
  assert.equal($("header").length,1);
 }
});

test("TP2 model 02 and 03 bind editable hero title, description and CTA in preview and public output",()=>{
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.find(block=>block.id==="intro").text="Descrição personalizada da capa";
  const cta=site.blocks.find(block=>block.id==="cta");
  cta.text="Solicitar proposta";cta.href="/contato?origem=tp2";
  for(const publishedMode of [false,true]){
   const $=render(site,publishedMode);
   assert.match($('[data-universal-section="inicio"]').text(),/Descrição personalizada da capa/);
   assert.equal($('[data-block-id="cta"]').attr("href"),"/contato?origem=tp2");
   assert.match($('[data-block-id="cta"]').text(),/Solicitar proposta/);
  }
 }
});

test("TP2 model 02 and 03 render edited about heading, paragraph and image without changing their section structure",()=>{
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.push(
   {id:"tp2-about-title",type:"heading",section:"sobre",text:"Nossa engenharia personalizada"},
   {id:"tp2-about-text",type:"paragraph",section:"sobre",text:"Descrição exclusiva da empresa"},
   {id:"tp2-about-image",type:"image",section:"sobre",src:"https://example.com/about-custom.jpg"}
  );
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(site)),publishedMode);
   const about=$('[data-universal-section="sobre"]');
   assert.match(about.text(),/Nossa engenharia personalizada/);
   assert.match(about.text(),/Descrição exclusiva da empresa/);
   assert.equal(about.find('[data-block-id="tp2-about-image"]').attr("src"),"https://example.com/about-custom.jpg");
   assert.equal(about.find('[data-block-id="tp2-about-title"]').length,1);
  }
 }
});
