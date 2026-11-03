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

test("TP2 models preserve independent service card title and image bindings in preview and published render",()=>{
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.push(
   {id:"tp2-services-heading",type:"heading",section:"servicos",text:"Soluções da empresa"},
   {id:"tp2-service-card-1",type:"heading",section:"servicos",text:"Projeto personalizado A"},
   {id:"tp2-service-card-2",type:"heading",section:"servicos",text:"Projeto personalizado B"},
   {id:"tp2-service-image-1",type:"image",section:"servicos",src:"https://example.com/first.jpg"},
   {id:"tp2-service-image-2",type:"image",section:"servicos",src:"https://example.com/second.jpg"}
  );
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(site)),publishedMode);
   const section=$('[data-universal-section="servicos"]');
   assert.match(section.text(),/Soluções da empresa/);
   assert.equal(section.find('[data-block-id="tp2-service-card-1"]').text(),"Projeto personalizado A");
   assert.equal(section.find('[data-block-id="tp2-service-card-2"]').text(),"Projeto personalizado B");
   assert.equal(section.find('[data-block-id="tp2-service-image-1"]').attr("src"),"https://example.com/first.jpg");
   assert.equal(section.find('[data-block-id="tp2-service-image-2"]').attr("src"),"https://example.com/second.jpg");
  }
 }
});

test("TP2 gallery uses only gallery image slots and keeps their identities across both render modes",()=>{
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.push(
   {id:"tp2-gallery-title",type:"heading",section:"galeria",text:"Nossa galeria exclusiva"},
   {id:"tp2-gallery-desc",type:"paragraph",section:"galeria",text:"Projetos ilustrados pela equipe"},
   {id:"tp2-gallery-image-1",type:"image",section:"galeria",src:"https://example.com/gallery-1.jpg"},
   {id:"tp2-gallery-image-2",type:"image",section:"galeria",src:""},
   {id:"tp2-gallery-image-3",type:"image",section:"galeria",src:"https://example.com/gallery-3.jpg"},
   {id:"tp2-other-image",type:"image",section:"sobre",src:"https://example.com/about.jpg"}
  );
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(site)),publishedMode);
   const gallery=$('[data-universal-section="galeria"]');
   assert.match(gallery.text(),/Nossa galeria exclusiva/);
   assert.match(gallery.text(),/Projetos ilustrados pela equipe/);
   assert.equal(gallery.find('[data-block-id="tp2-gallery-image-1"]').attr("src"),"https://example.com/gallery-1.jpg");
   assert.equal(gallery.find('[data-block-id="tp2-gallery-image-2"]').length,1);
   assert.equal(gallery.find('[data-block-id="tp2-gallery-image-3"]').attr("src"),"https://example.com/gallery-3.jpg");
   assert.equal(gallery.find('[data-block-id="tp2-other-image"]').length,0);
  }
 }
});

test("TP2 differences preserve individually editable card headings across model 02 and 03",()=>{
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.push(
   {id:"tp2-differences-title",type:"heading",section:"diferenciais",text:"Nossos diferenciais personalizados"},
   {id:"tp2-difference-1",type:"heading",section:"diferenciais",text:"Atendimento dedicado"},
   {id:"tp2-difference-2",type:"heading",section:"diferenciais",text:"Processos transparentes"}
  );
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(site)),publishedMode);
   const section=$('[data-universal-section="diferenciais"]');
   assert.match(section.text(),/Nossos diferenciais personalizados/);
   assert.equal(section.find('[data-block-id="tp2-difference-1"]').text(),"Atendimento dedicado");
   assert.equal(section.find('[data-block-id="tp2-difference-2"]').text(),"Processos transparentes");
   assert.equal(section.find("h3").length,4);
  }
 }
});

test("TP2 process steps preserve separate titles descriptions and image slots across both models",()=>{
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.push(
   {id:"tp2-process-title",type:"heading",section:"como-funciona",text:"Nosso processo personalizado"},
   {id:"tp2-process-step-1",type:"heading",section:"como-funciona",text:"Diagnóstico inicial"},
   {id:"tp2-process-step-2",type:"heading",section:"como-funciona",text:"Planejamento técnico"},
   {id:"tp2-process-desc-1",type:"paragraph",section:"como-funciona",text:"Analisamos o contexto."},
   {id:"tp2-process-desc-2",type:"paragraph",section:"como-funciona",text:"Definimos o escopo."},
   {id:"tp2-process-img-1",type:"image",section:"como-funciona",src:"https://example.com/step-1.jpg"},
   {id:"tp2-process-img-2",type:"image",section:"como-funciona",src:""}
  );
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(site)),publishedMode);
   const section=$('[data-universal-section="como-funciona"]');
   assert.match(section.text(),/Nosso processo personalizado/);
   assert.equal(section.find('[data-block-id="tp2-process-step-1"]').text(),"Diagnóstico inicial");
   assert.equal(section.find('[data-block-id="tp2-process-step-2"]').text(),"Planejamento técnico");
   assert.equal(section.find('[data-block-id="tp2-process-desc-1"]').text(),"Analisamos o contexto.");
   assert.equal(section.find('[data-block-id="tp2-process-desc-2"]').text(),"Definimos o escopo.");
   assert.equal(section.find('[data-block-id="tp2-process-img-1"]').attr("src"),"https://example.com/step-1.jpg");
   assert.equal(section.find('[data-block-id="tp2-process-img-2"]').length,1);
  }
 }
});

test("TP2 project showcase renders editable text and independent image slots in preview and public output",()=>{
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.push(
   {id:"tp2-project-title",type:"heading",section:"projetos",text:"Portfólio personalizado"},
   {id:"tp2-project-description",type:"paragraph",section:"projetos",text:"Conheça nossos projetos selecionados"},
   {id:"tp2-project-image-1",type:"image",section:"projetos",src:"https://example.com/project-one.jpg"},
   {id:"tp2-project-image-2",type:"image",section:"projetos",src:""},
   {id:"tp2-project-image-3",type:"image",section:"projetos",src:"https://example.com/project-three.jpg"}
  );
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(site)),publishedMode);
   const section=$('[data-universal-section="projetos"]');
   assert.match(section.text(),/Portfólio personalizado/);
   assert.match(section.text(),/Conheça nossos projetos selecionados/);
   assert.equal(section.find('[data-block-id="tp2-project-image-1"]').attr("src"),"https://example.com/project-one.jpg");
   assert.equal(section.find('[data-block-id="tp2-project-image-2"]').length,1);
   assert.equal(section.find('[data-block-id="tp2-project-image-3"]').attr("src"),"https://example.com/project-three.jpg");
  }
 }
});

test("TP2 contact heading and image edits preserve the existing functional form in both models",()=>{
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.push(
   {id:"tp2-contact-title",type:"heading",section:"contato",text:"Solicite atendimento especializado"},
   {id:"tp2-contact-image",type:"image",section:"contato",src:"https://example.com/contact.jpg"}
  );
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(site)),publishedMode);
   const section=$('[data-universal-section="contato"]');
   assert.match(section.text(),/Solicite atendimento especializado/);
   assert.equal(section.find('[data-block-id="tp2-contact-image"]').attr("src"),"https://example.com/contact.jpg");
   assert.equal(section.find("form").length,1);
   assert.equal(section.find("input").length,2);
   assert.equal(section.find("textarea").length,1);
   assert.equal(section.find('button[type="submit"]').length,1);
  }
 }
});

test("TP2 FAQ uses editable question-answer pairs and preserves accordion controls",()=>{
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks=site.blocks.filter(block=>!/faq|pergunt|duvidas|dúvidas/i.test(block.section||""));
  site.blocks.push(
   {id:"tp2-faq-title",type:"heading",section:"faq",text:"Dúvidas sobre nossos serviços"},
   {id:"tp2-faq-item-1",type:"paragraph",section:"faq",text:"Vocês fazem vistoria? Sim, mediante agendamento."},
   {id:"tp2-faq-item-2",type:"paragraph",section:"faq",text:"Como solicitar proposta? Entre em contato pelos canais cadastrados."}
  );
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(site)),publishedMode);
   const section=$('[data-universal-section="faq"]');
   assert.match(section.text(),/Dúvidas sobre nossos serviços/);
   assert.equal(section.find('[data-block-id="tp2-faq-item-1"]').length,1);
   assert.equal(section.find('[data-block-id="tp2-faq-item-2"]').length,1);
   assert.match(section.text(),/Vocês fazem vistoria\?/);
   assert.match(section.text(),/Como solicitar proposta\?/);
   assert.equal(section.find('button[aria-expanded]').length,2);
   assert.doesNotMatch(section.text(),/Como solicitar um orçamento\?/);
  }
 }
});
