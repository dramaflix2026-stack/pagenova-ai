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

test("TP2 history chapter content and images remain independently editable in both variants",()=>{
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.push(
   {id:"tp2-history-title",type:"heading",section:"trajetoria",text:"Nossa evolução"},
   {id:"tp2-history-chapter-1",type:"heading",section:"trajetoria",text:"Primeira etapa"},
   {id:"tp2-history-chapter-2",type:"heading",section:"trajetoria",text:"Segunda etapa"},
   {id:"tp2-history-desc-1",type:"paragraph",section:"trajetoria",text:"Nossa origem"},
   {id:"tp2-history-desc-2",type:"paragraph",section:"trajetoria",text:"Nosso futuro"},
   {id:"tp2-history-image-1",type:"image",section:"trajetoria",src:"https://example.com/history-one.jpg"},
   {id:"tp2-history-image-2",type:"image",section:"trajetoria",src:""}
  );
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(site)),publishedMode);
   const section=$('[data-universal-section="trajetoria"]');
   assert.match(section.text(),/Nossa evolução/);
   assert.equal(section.find('[data-block-id="tp2-history-chapter-1"]').text(),"Primeira etapa");
   assert.equal(section.find('[data-block-id="tp2-history-chapter-2"]').text(),"Segunda etapa");
   assert.equal(section.find('[data-block-id="tp2-history-desc-1"]').text(),"Nossa origem");
   assert.equal(section.find('[data-block-id="tp2-history-desc-2"]').text(),"Nosso futuro");
   assert.equal(section.find('[data-block-id="tp2-history-image-1"]').attr("src"),"https://example.com/history-one.jpg");
   assert.equal(section.find('[data-block-id="tp2-history-image-2"]').length,1);
  }
 }
});

test("TP2 numbers and testimonials headings are editable without inventing metrics or reviews",()=>{
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.push(
   {id:"tp2-metrics-title",type:"heading",section:"numeros",text:"Indicadores verificáveis"},
   {id:"tp2-testimonials-title",type:"heading",section:"depoimentos",text:"Experiências compartilhadas"}
  );
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(site)),publishedMode);
   const numbers=$('[data-universal-section="numeros"]');
   const testimonials=$('[data-universal-section="depoimentos"]');
   assert.equal(numbers.find('[data-block-id="tp2-metrics-title"]').text(),"Indicadores verificáveis");
   assert.equal(testimonials.find('[data-block-id="tp2-testimonials-title"]').text(),"Experiências compartilhadas");
   // When commercial indicators are absent, the cards count actual site structure,
   // not invented customers, projects or revenue. Demo reviews are preview-only.
   assert.equal(numbers.find('[data-tp2-proof="numbers"] strong').length,0);
   assert.match(numbers.text(),/O QUE ORIENTA NOSSA ABORDAGEM/);
   assert.equal(numbers.find('[data-tp2-mode="approach"] article').length,3);
   assert.equal(testimonials.find('[data-tp2-proof="testimonials"] blockquote').length,publishedMode?0:6);
   if(!publishedMode)assert.match(testimonials.text(),/RELATO FICTÍCIO/);
  }
 }
});

test("TP2 footer headline edits preserve brand and never create unregistered contact details",()=>{
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.push({id:"tp2-footer-headline",type:variant==="02"?"paragraph":"heading",section:"rodape",text:"Construímos o próximo capítulo juntos"});
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(site)),publishedMode);
   const footer=$('[data-universal-section="rodape"]');
   assert.equal(footer.find('[data-block-id="tp2-footer-headline"]').text(),"Construímos o próximo capítulo juntos");
   assert.ok(footer.text().includes(site.title),"brand must remain in footer");
   assert.equal(footer.find('a[href^="mailto:"]').length,0,"missing email must not be fabricated");
  }
 }
});

test("TP2 integrated edits, removal and section reordering survive JSON reload in preview and public output",async()=>{
 const {applyUniversalOperations}=await import("../src/lib/builder-v2-universal-operations.ts");
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks=site.blocks.filter(block=>!/faq|pergunt|duvidas|dúvidas/i.test(block.section||""));
  site.blocks.push(
   {id:"integrated-about",type:"heading",section:"sobre",text:"Nossa empresa"},
   {id:"integrated-services",type:"heading",section:"servicos",text:"Serviços"},
   {id:"integrated-gallery",type:"heading",section:"galeria",text:"Galeria"},
   {id:"integrated-faq-title",type:"heading",section:"faq",text:"Perguntas iniciais"},
   {id:"integrated-faq-pair",type:"paragraph",section:"faq",text:"Qual é o prazo? O prazo depende do projeto."},
   {id:"integrated-footer",type:variant==="02"?"paragraph":"heading",section:"rodape",text:"Mensagem original"}
  );
  const changed=applyUniversalOperations(site,[
   {action:"update",blockId:"integrated-faq-title",changes:{text:"Perguntas personalizadas"}},
   {action:"update",blockId:"integrated-footer",changes:{text:"Mensagem final personalizada"}},
   {action:"remove-section",sectionId:"servicos"},
   {action:"move-section",sectionId:"galeria",beforeSectionId:"sobre"}
  ]);
  assert.equal(changed.ok,true,changed.error);
  if(!changed.ok)continue;
  const reloaded=JSON.parse(JSON.stringify(changed.site));
  for(const publishedMode of [false,true]){
   const $=render(reloaded,publishedMode);
   assert.equal($('[data-universal-section="servicos"]').length,0);
   const order=$('[data-universal-section]').map((_,node)=>$(node).attr("data-universal-section")).get();
   assert.ok(order.indexOf("galeria")<order.indexOf("sobre"));
   assert.equal($('[data-universal-section="faq"] [data-block-id="integrated-faq-title"]').text(),"Perguntas personalizadas");
   assert.equal($('[data-universal-section="rodape"] [data-block-id="integrated-footer"]').text(),"Mensagem final personalizada");
   assert.equal($('[data-universal-section="contato"] form').length,1);
  }
 }
});

test("TP2 sequential natural-language edits preserve removed sections, reordered gallery and updated content",async()=>{
 const {applyUniversalOperations}=await import("../src/lib/builder-v2-universal-operations.ts");
 const {applyUniversalNaturalLanguage}=await import("../src/lib/builder-v2-universal-language.ts");
 for(const variant of ["02","03"]){
  const site={...fixture(),niche:"Engenharia",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.push(
   {id:"tp2-sequential-about",type:"heading",section:"sobre",text:"Nossa empresa"},
   {id:"tp2-sequential-services",type:"heading",section:"servicos",text:"Nossos serviços"},
   {id:"tp2-sequential-gallery",type:"heading",section:"galeria",text:"Nossa galeria"},
   {id:"tp2-sequential-footer",type:variant==="02"?"paragraph":"heading",section:"rodape",text:"Vamos conversar"}
  );
  const layout=applyUniversalOperations(site,[
   {action:"remove-section",sectionId:"servicos"},
   {action:"move-section",sectionId:"galeria",beforeSectionId:"sobre"}
  ]);
  assert.equal(layout.ok,true,layout.error);
  if(!layout.ok)continue;
  const first=applyUniversalNaturalLanguage(JSON.parse(JSON.stringify(layout.site)),'Altere o texto "Nossa empresa" para "Quem somos"');
  assert.equal(first?.ok,true,first?.error);
  if(!first?.ok)continue;
  const second=applyUniversalNaturalLanguage(JSON.parse(JSON.stringify(first.site)),'Altere o texto "Vamos conversar" para "Fale com nossa equipe"');
  assert.equal(second?.ok,true,second?.error);
  if(!second?.ok)continue;
  const reloaded=JSON.parse(JSON.stringify(second.site));
  assert.equal(site.blocks.find(b=>b.id==="tp2-sequential-about").text,"Nossa empresa","original fixture must remain unchanged");
  for(const publishedMode of [false,true]){
   const $=render(reloaded,publishedMode);
   assert.equal($('[data-universal-section="servicos"]').length,0);
   const order=$('[data-universal-section]').map((_,node)=>$(node).attr("data-universal-section")).get();
   assert.ok(order.indexOf("galeria")<order.indexOf("sobre"));
   assert.equal($('[data-universal-section="sobre"] [data-block-id="tp2-sequential-about"]').text(),"Quem somos");
   assert.equal($('[data-universal-section="rodape"] [data-block-id="tp2-sequential-footer"]').text(),"Fale com nossa equipe");
  }
 }
});


test("TP5 model 02 visible hero CTA reflects the universal edit while preserving the original action",async()=>{
 const {applyUniversalNaturalLanguage}=await import("../src/lib/builder-v2-universal-language.ts");
 const original={...fixture(),title:"Maison Lumière",niche:"Inteligência Artificial",templateId:"prompt-adaptive",briefingLayoutVariant:"02"};
 const initial=render(original,false);
 assert.match(initial(".da-actions .da-button-blue").text(),/Iniciar conversa/);
 const command='Troque o texto do botão principal da capa para "Quero agendar minha avaliação". Preserve o link e a aparência original do botão.';
 const patched=applyUniversalNaturalLanguage(original,command);
 assert.equal(patched?.ok,true,patched?.error);
 if(!patched?.ok)return;
 assert.deepEqual(patched.changedIds,["cta"]);
 const edited=patched.site.blocks.find(block=>block.id==="cta");
 const source=original.blocks.find(block=>block.id==="cta");
 assert.equal(edited?.text,"Quero agendar minha avaliação");
 assert.equal(edited?.href,source?.href);
 assert.equal(edited?.textExplicit,true);
 for(const publishedMode of [false,true]){
  const $=render(JSON.parse(JSON.stringify(patched.site)),publishedMode);
  const hero=$(".da-actions .da-button-blue");
  assert.equal(hero.length,1);
  assert.match(hero.text(),/Quero agendar minha avaliação/);
  assert.doesNotMatch(hero.text(),/Iniciar conversa/);
  assert.ok(hero.hasClass("da-button-blue"));
  assert.match($(".da-header .da-button-dark").text(),/Vamos conversar/,"do not change header CTA");
  assert.equal($(".da-link").first().attr("href"),"#tp5m2-solutions");
 }
 assert.equal(render(original,false)(".da-actions .da-button-blue").text().includes("Iniciar conversa"),true);
});
test("one universal CTA edit appears in every TP5 visual variant after JSON restore",async()=>{
 const {applyUniversalNaturalLanguage}=await import("../src/lib/builder-v2-universal-language.ts");
 for(const variant of ["01","02","03"]){
  const original={...fixture(),title:"Demo Teste",niche:"Marketing digital",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  const edited=applyUniversalNaturalLanguage(original,'Troque o texto do botão principal da capa para "Quero agendar minha avaliação". Preserve o link e a aparência original do botão.');
  assert.equal(edited?.ok,true,variant+": "+edited?.error);
  if(!edited?.ok)continue;
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(edited.site)),publishedMode);
   const selector=variant==="01"?".pn-t5-primary":variant==="02"?".da-actions .da-button-blue":'[data-tp5-variant="03"] a[href="#tp5-solutions"]';
   const button=$(selector);
   assert.equal(button.length,1,"TP5 "+variant+" CTA exists");
   assert.match(button.text(),/Quero agendar minha avaliação/,"TP5 "+variant+" CTA reflects the edit");
  }
 }
});


test("TP5 second about paragraph updates the actual preview across all three variants",async()=>{
 const {parseUniversalCopyEdit,applyUniversalCopyEdit}=await import("../src/lib/builder-v2-universal-copy-edits.ts");
 const prompt="Na seção Sobre a empresa, reescreva o segundo parágrafo com um tom mais sofisticado e acolhedor. Preserve o título, o primeiro parágrafo, as imagens e todos os outros elementos.";
 const updatedText="Nossa equipe acolhe cada projeto com atenção, elegância e cuidado individualizado.";
 const originalFixture=fixture();
 for(const variant of ["01","02","03"]){
  const site={...originalFixture,niche:"Marketing digital",title:"Maison Lumière",templateId:"prompt-adaptive",briefingLayoutVariant:variant,
   blocks:[
    ...originalFixture.blocks,
    {id:"about-heading",type:"heading",section:"sobre",text:"Sobre a empresa"},
    {id:"about-p1",type:"paragraph",section:"sobre",text:"Primeiro parágrafo original."},
    {id:"about-p2",type:"paragraph",section:"sobre",text:"Segundo parágrafo original."}
   ]};
  const parsed=parseUniversalCopyEdit(site,prompt);
  assert.ok(parsed&&"intent" in parsed,"parse TP5 "+variant);
  assert.equal(parsed.intent.targetId,"about-p2");
  assert.equal(parsed.intent.generateText,true);
  const result=applyUniversalCopyEdit(site,parsed.intent,updatedText);
  assert.equal(result.ok,true,variant+": "+result.error);
  if(!result.ok)continue;
  assert.deepEqual(result.changedIds,["about-p2"]);
  assert.equal(site.blocks.find(b=>b.id==="about-p2").text,"Segundo parágrafo original.","do not mutate original");
  assert.equal(result.site.blocks.find(b=>b.id==="about-p1").text,"Primeiro parágrafo original.");
  for(const publishedMode of [false,true]){
   const before=render(site,publishedMode);
   const after=render(JSON.parse(JSON.stringify(result.site)),publishedMode);
   const slot=after('[data-universal-copy-slot="sobre:paragraph:1"]');
   assert.equal(slot.length,1,"TP5 "+variant+" must render exactly one edited second About paragraph");
   assert.equal(slot.text(),updatedText,"TP5 "+variant+" must show generated content");
   const aboutFirstSelector=variant==="01"?".pn-t5-about-copy p:first-of-type":variant==="02"?"#tp5m2-about p:first-of-type":'[data-tp5-variant="03"] section:nth-of-type(3) p:first-of-type';
   assert.equal(after(aboutFirstSelector).first().text(),before(aboutFirstSelector).first().text(),"TP5 "+variant+" must keep the first visible paragraph");
   assert.deepEqual(after("img").map((_,img)=>after(img).attr("src")).get(),before("img").map((_,img)=>before(img).attr("src")).get(),"TP5 "+variant+" must preserve photos");
  }
 }
});
test("TP5 model 02 does not create another About paragraph without an explicit edit",()=>{
 const original={...fixture(),niche:"Marketing digital",templateId:"prompt-adaptive",briefingLayoutVariant:"02"};
 const $=render(original,false);
 assert.equal($('#tp5m2-about [data-universal-copy-slot="sobre:paragraph:1"]').length,0);
 assert.equal($("#tp5m2-about .da-text-link").length,1);
});


test("edited heading color survives preview and published HTML without changing copy",()=>{
 for(const templateId of ["institutional-complete","minimalist-sophisticated"]){
  const before={...fixture(),templateId};
  const after=structuredClone(before);
  const heading=after.blocks.find(block=>block.id==="hero");
  heading.color="#c2410c";heading.colorExplicit=true;
  for(const publishedMode of [false,true]){
   const $=render(after,publishedMode);
   const target=$('[data-block-id="hero"]');
   assert.equal(target.length,1,templateId+" hero should exist");
   assert.match(target.attr("style")||"",/color:#c2410c/,templateId+" must render edited color");
   assert.ok(target.text().includes("Título editado"),templateId+" must preserve heading text");
   assert.ok(!($.html()||"").includes("color:#663399"),templateId+" must not retain old heading color");
  }
 }
});

test("Vértice TP9 Modelo 1 differenciais remain scoped with four cards and a real repair photo",async()=>{
 const {readFileSync}=await import("node:fs");
 const integration=readFileSync(new URL("../src/components/template9-automotive-sections.tsx",import.meta.url),"utf8");
 const section=readFileSync(new URL("../src/components/tp9-vertice-differentials.tsx",import.meta.url),"utf8");
 assert.match(integration,/isVertice&&<TP9VerticeDifferentials contactHref=\{target\}\/>/);
 assert.match(integration,/!isVertice&&<section id="tp9-diferenciais"/);
 assert.equal((section.match(/\{number:"0[1-4]",title:/g)||[]).length,4);
 assert.match(section,/id="tp9-diferenciais"/);
 assert.match(section,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(section,/grid-template-columns:1fr/);
 assert.match(section,/images\.unsplash\.com\/photo-/);
 assert.match(section,/Converse com nossa equipe/);
 assert.doesNotMatch(section,/[0-9]+\s*(?:anos|clientes|estrelas|avaliações|certificações)/i);
});

test("Vértice TP9 Modelo 1 workflow has four anchored steps and keeps other templates untouched",async()=>{
 const {readFileSync}=await import("node:fs");
 const source=readFileSync(new URL("../src/components/template9-automotive-experience.tsx",import.meta.url),"utf8");
 const step=readFileSync(new URL("../src/components/tp9-vertice-process.tsx",import.meta.url),"utf8");
 assert.match(source,/isVertice&&<TP9VerticeProcess contactHref=\{target\}\/>/);
 assert.match(source,/!isVertice&&<section className="pn-t9x-section" id="tp9-processo"/);
 assert.match(source,/id="tp9-galeria"/);
 assert.equal((step.match(/\{number:"0[1-4]",title:/g)||[]).length,4);
 assert.match(step,/id="tp9-processo"/);
 assert.match(step,/grid-template-columns:minmax\(0,\.92fr\) minmax\(0,1\.08fr\)/);
 assert.match(step,/grid-template-columns:1fr/);
 assert.match(step,/unsplash\.com\/photos\/erWc6mrOq_I/);
 assert.match(step,/Solicitar atendimento/);
 assert.match(step,/Orientação e orçamento/);
 assert.match(step,/Execução autorizada/);
});

test("Vértice TP9 approved gallery displays six distinct repair photos and an accessible lightbox",async()=>{
 const {readFileSync}=await import("node:fs");
 const integration=readFileSync(new URL("../src/components/template9-automotive-experience.tsx",import.meta.url),"utf8");
 const gallery=readFileSync(new URL("../src/components/tp9-vertice-gallery.tsx",import.meta.url),"utf8");
 assert.match(integration,/isVertice&&<TP9VerticeGallery\/>/);
 assert.match(integration,/!isVertice&&<section className="pn-t9x-section pn-t9x-gallery"/);
 assert.match(integration,/\{reviewsSection\}/);
 assert.match(gallery,/id="tp9-galeria"/);
 assert.match(gallery,/aria-modal="true"/);
 assert.match(gallery,/if\(event\.key==="Escape"\)/);
 assert.match(gallery,/if\(event\.key==="ArrowLeft"\)/);
 assert.match(gallery,/if\(event\.key==="ArrowRight"\)/);
 assert.match(gallery,/role="dialog"/);
 assert.match(gallery,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(gallery,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(gallery,/grid-template-columns:1fr/);
 assert.match(gallery,/Fotografias ilustrativas de terceiros/);
 const photos=[...gallery.matchAll(/photo:"(photo-[^"]+)"/g)].map(match=>match[1]);
 assert.equal(photos.length,6,"must contain exactly six real photos");
 assert.equal(new Set(photos).size,6,"all six photos must be different");
});

test("Vértice TP9 FAQ preserves six accessible questions, working controls and original contact",async()=>{
 const {readFileSync}=await import("node:fs");
 const integrated=readFileSync(new URL("../src/components/template9-automotive-closing.tsx",import.meta.url),"utf8");
 const faq=readFileSync(new URL("../src/components/tp9-vertice-faq.tsx",import.meta.url),"utf8");
 assert.match(integrated,/isVertice&&<TP9VerticeFAQ\/>/);
 assert.match(integrated,/!isVertice&&<section className="pn-t9c-faq" id="tp9-faq"/);
 assert.match(integrated,/id="tp9-orcamento"/);
 assert.match(integrated,/\{locationSection\}/);
 assert.match(faq,/id="tp9-faq"/);
 assert.equal((faq.match(/\{question:"/g)||[]).length,6);
 assert.match(faq,/aria-expanded=\{expanded\}/);
 assert.match(faq,/aria-controls=\{answerId\}/);
 assert.match(faq,/onClick=\{\(\)=>setOpenIndex\(expanded\?null:index\)\}/);
 assert.match(faq,/role="region"/);
 assert.match(faq,/grid-template-columns:minmax\(0,\.94fr\) minmax\(0,1\.06fr\)/);
 assert.match(faq,/grid-template-columns:1fr/);
 assert.match(faq,/images\.unsplash\.com\/photo-/);
 assert.match(faq,/href="#tp9-orcamento"/);
 assert.match(faq,/Como consultar prazos e disponibilidade/);
 assert.match(faq,/Os valores são informados pelo site/);
});

test("Vértice TP9 quote form respects configured channels and preserves approved FAQ and legacy contact",async()=>{
 const {readFileSync}=await import("node:fs");
 const integrated=readFileSync(new URL("../src/components/template9-automotive-closing.tsx",import.meta.url),"utf8");
 const quote=readFileSync(new URL("../src/components/tp9-vertice-quote.tsx",import.meta.url),"utf8");
 assert.match(integrated,/isVertice&&<TP9VerticeFAQ\/>/);
 assert.match(integrated,/isVertice&&<TP9VerticeQuote brand=\{brand\} email=\{email\} whatsapp=\{whatsapp\}\/>/);
 assert.match(integrated,/!isVertice&&<section id="tp9-orcamento"/);
 assert.match(integrated,/\{locationSection\}/);
 assert.match(quote,/id="tp9-orcamento"/);
 assert.match(quote,/id="tp9-contato"/);
 assert.match(quote,/validPhone=phone.length>=10&&phone.length<=15\?phone:null/);
 assert.match(quote,/validMail=email\?\.trim\(\)/);
 assert.match(quote,/disabled=\{!hasContact\}/);
 assert.match(quote,/role="status"/);
 assert.match(quote,/window\.open\(url,"_blank","noopener,noreferrer"\)/);
 assert.match(quote,/window\.location\.href=url/);
 assert.match(quote,/href=\{preparedLink\}/);
 assert.match(quote,/não envia automaticamente/);
 assert.match(quote,/id="pn-vq-name".*?required/);
 assert.match(quote,/id="pn-vq-reply".*?required/);
 assert.match(quote,/id="pn-vq-vehicle".*?required/);
 assert.match(quote,/id="pn-vq-service".*?required/);
 assert.match(quote,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(quote,/grid-template-columns:1fr/);
 assert.match(quote,/SERVICES=\[/);
});

test("Vértice TP9 Model 1 cinematic closing keeps approved footer and uses real quote form",async()=>{
 const {readFileSync}=await import("node:fs");
 const component=readFileSync(new URL("../src/components/template9-automotive-final.tsx",import.meta.url),"utf8");
 const closing=readFileSync(new URL("../src/components/tp9-vertice-final-cta.tsx",import.meta.url),"utf8");
 assert.match(component,/isVertice&&<TP9VerticeFinalCTA\/>/);
 assert.match(component,/!isVertice&&<section className="pn-t9f-cta" id="tp9-chamada-final"/);
 assert.match(component,/<footer className="pn-t9f-footer" id="tp9-rodape"/);
 assert.match(closing,/id="tp9-chamada-final"/);
 assert.match(closing,/href="#tp9-orcamento"/);
 assert.match(closing,/Seu carro merece/);
 assert.match(closing,/Solicitar orçamento/);
 assert.match(closing,/images\.unsplash\.com\/photo-1635352124120-739339ec9ac1/);
 assert.doesNotMatch(closing,/photo-1486262715619-67b85e0b08d3/);
 assert.match(closing,/font:900 clamp\(44px,6\.5vw,100px\)\/1\.065 Inter/);
 assert.match(closing,/@media\(max-width:480px\)/);
 assert.doesNotMatch(closing,/https:\/\/wa\.me\/|mailto:/);
});

test("Vértice TP9 Model 1 premium footer contains real-contact links and working top anchor",async()=>{
 const {readFileSync}=await import("node:fs");
 const final=readFileSync(new URL("../src/components/template9-automotive-final.tsx",import.meta.url),"utf8");
 const footer=readFileSync(new URL("../src/components/tp9-vertice-premium-footer.tsx",import.meta.url),"utf8");
 const hero=readFileSync(new URL("../src/components/tp9-vertice-handcar-hero.tsx",import.meta.url),"utf8");
 assert.match(final,/isVertice&&<TP9VerticePremiumFooter brand=\{brand\} niche=\{niche\} email=\{email\} whatsapp=\{whatsapp\} address=\{address\}\/>/);
 assert.match(final,/!isVertice&&<footer className="pn-t9f-footer" id="tp9-rodape"/);
 assert.match(final,/isVertice&&<TP9VerticeFinalCTA\/>/);
 assert.match(footer,/id="tp9-rodape"/);
 assert.match(footer,/href="#tp9-inicio"/);
 assert.match(footer,/Voltar ao topo/);
 assert.match(hero,/id="tp9-inicio"/);
 assert.match(footer,/href:"#tp9-orcamento"/);
 assert.match(footer,/href:"#tp9-faq"/);
 assert.match(footer,/href:"#tp9-galeria"/);
 assert.match(footer,/href:"#tp9-processo"/);
 assert.match(footer,/validPhone&&<div className="pn-vfooter-contact"/);
 assert.match(footer,/validMail&&<div className="pn-vfooter-contact"/);
 assert.match(footer,/validAddress&&<>/);
 assert.match(footer,/!hasContact&&<p className="pn-vfooter-no-contact"/);
 assert.match(footer,/https:\/\/wa\.me\/"\+validPhone/);
 assert.match(footer,/mailto:"\+validMail/);
 assert.doesNotMatch(footer,/https:\/\/(?:www\.)?(?:instagram|facebook)\.com\//);
 assert.match(footer,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(footer,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(footer,/grid-template-columns:1fr/);
 assert.match(footer,/pn-vfooter-signature/);
 assert.match(footer,/VÉRTIC<span className="pn-vfooter-signature-accent">E<\/span>/);
});
