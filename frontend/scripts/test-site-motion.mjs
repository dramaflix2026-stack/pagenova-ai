import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=readFileSync(path.join(root,"src/lib/site-builder-animation.ts"),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
const exports={};
vm.runInNewContext(compiled.outputText,{exports,module:{exports},console,window:undefined});
const {initialSiteMotion,applySiteMotionInstruction,isMotionOnlyInstruction,motionRuleFor,attachSiteMotion}=exports;
const blocks=[
  {id:"hero-heading",section:"inicio",type:"heading",text:"Sua saúde"},
  {id:"hero-cta",section:"inicio",type:"button",text:"Agendar consulta"},
  {id:"service-heading",section:"servicos",type:"heading",text:"Nossos serviços"},
  {id:"service-1",section:"servicos",type:"paragraph",text:"Terapia: acolhimento"},
  {id:"service-2",section:"servicos",type:"paragraph",text:"Orientação: apoio"},
  {id:"gallery-heading",section:"galeria",type:"heading",text:"Galeria do consultório"},
  {id:"gallery-image",section:"galeria",type:"image",text:"Fotografia",src:"https://example.com/a.png"},
  {id:"faq-heading",section:"faq",type:"heading",text:"Dúvidas frequentes"},
  {id:"contact-heading",section:"contato",type:"heading",text:"Entre em contato"}
];
const site=(motion)=>({title:"Clínica exemplo",background:"#ffffff",motion,blocks:structuredClone(blocks)});
test("generation defaults to professional animations",()=>{
  assert.equal(initialSiteMotion("Crie um site para psicologia").preset,"professional");
  assert.equal(initialSiteMotion("Crie um site para clínica com animações suaves").preset,"professional");
  assert.equal(initialSiteMotion("Crie um site com animações dinâmicas").preset,"dynamic");
});
test("generation explicitly without animation respects user",()=>{
  assert.equal(initialSiteMotion("Crie um site sem animações").preset,"none");
  assert.equal(initialSiteMotion("Crie um site sem qualquer animação").preset,"none");
});
test("existing site created without animation gains effects from chat without data loss",()=>{
  const current=site(initialSiteMotion("Crie um site sem animações"));
  const before=JSON.stringify(current.blocks);
  const updated=applySiteMotionInstruction(current,"Anime os cards de serviços de baixo para cima com intervalo de 0,2 segundo");
  assert.equal(updated.preset,"professional");
  assert.equal(updated.blocks["service-1"].effect,"fade-up");
  assert.equal(updated.blocks["service-2"].staggerMs,200);
  const noDelay=applySiteMotionInstruction(site({preset:"professional"}),"Anime os cards sem atraso");
  assert.equal(noDelay.blocks["service-1"].effect,"fade-up");
  assert.equal(JSON.stringify(current.blocks),before);
});
test("chat overrides selected blocks and sections only",()=>{
  const updated=applySiteMotionInstruction(site({preset:"professional"}),"Faça o título da galeria surgir pela esquerda");
  assert.equal(updated.blocks["gallery-heading"].effect,"fade-left");
  assert.equal(updated.blocks["hero-heading"],undefined);
  const section=applySiteMotionInstruction(site(updated),"Adicione um efeito de zoom na seção FAQ");
  assert.equal(section.sections.faq.effect,"zoom");
  assert.equal(section.blocks["gallery-heading"].effect,"fade-left");
});
test("remove animations from whole site, preserving content",()=>{
  const current=site({preset:"professional",blocks:{"hero-heading":{effect:"zoom"}}});
  const before=JSON.stringify(current.blocks);
  const updated=applySiteMotionInstruction(current,"Retire todas as animações do site");
  assert.equal(updated.preset,"none");
  assert.equal(Object.keys(updated.blocks).length,0);
  assert.equal(JSON.stringify(current.blocks),before);
  assert.equal(motionRuleFor(updated,"inicio","hero-heading").effect,"none");
});
test("mobile-only opt out does not disable desktop",()=>{
  const updated=applySiteMotionInstruction(site({preset:"professional"}),"Deixe o mobile sem animações");
  assert.equal(updated.preset,"professional");
  assert.equal(updated.mobile,"none");
});
test("new sections inherit the preset and support targeted effect",()=>{
  const current=site({preset:"professional"});
  current.blocks.push({id:"depo-heading",type:"heading",section:"depoimentos",text:"Depoimentos"});
  const updated=applySiteMotionInstruction(current,"Coloque animação de zoom na seção Depoimentos");
  assert.equal(updated.sections.depoimentos.effect,"zoom");
  assert.equal(motionRuleFor(updated,"depoimentos","depo-heading").effect,"zoom");
});
test("combined section creation + motion is routed to full editing, not motion-only",()=>{
  assert.equal(isMotionOnlyInstruction("Crie uma nova seção de depoimentos com animação"),false);
  assert.equal(isMotionOnlyInstruction("Adicione animação na seção serviços"),true);
  assert.equal(isMotionOnlyInstruction("Altere a cor do título e anime os cards"),false);
  assert.equal(isMotionOnlyInstruction("Retire todas as animações"),true);
  assert.equal(isMotionOnlyInstruction("Altere a animação do título para vir da esquerda"),true);
  assert.equal(isMotionOnlyInstruction("Altere a cor do título e coloque animações nos cards"),false);
  assert.equal(isMotionOnlyInstruction("Centralize o título e anime os cards"),false);
});

test("ongoing movement is opt-in and preserves blocks when updated via chat",()=>{
  const current=site({preset:"professional"});
  const original=JSON.stringify(current.blocks);
  const updated=applySiteMotionInstruction(current,"Quero a página sempre em movimento");
  assert.equal(updated.continuous,true);
  assert.equal(updated.preset,"professional");
  assert.equal(JSON.stringify(current.blocks),original);
  const removed=applySiteMotionInstruction(site(updated),"Retire todas as animações");
  assert.equal(removed.continuous,false);
  assert.equal(removed.preset,"none");
});
test("targeted headings and buttons continue moving when requested",()=>{
  const title=applySiteMotionInstruction(site({preset:"professional"}),"Deixe o título da capa ficar em movimento");
  assert.equal(title.continuous,true);
  assert.equal(title.blocks["hero-heading"].effect,"float");
  const button=applySiteMotionInstruction(site(title),"Faça os botões pulsarem continuamente");
  assert.equal(button.continuous,true);
  assert.equal(button.blocks["hero-cta"].effect,"pulse");
});
test("isolated responsive preview does not disable animation via CSS override",()=>{
  const file=readFileSync(path.join(root,"src/components/builder-v2-preview-frame.tsx"),"utf8");
  assert.ok(file.includes('data-pn-preview-overrides'));
  assert.equal(file.includes('animation:none!important} .pn-motion-site'),false);
  assert.equal(file.includes('.pn-motion-target{opacity:1!important'),false);
  const renderer=readFileSync(path.join(root,"src/components/builder-v2-site.tsx"),"utf8");
  assert.ok(renderer.includes("attachSiteMotion(previewRef.current,site.motion)"));
});
test("DOM motion engine uses the embedded preview viewport rather than the parent window",()=>{
  const classes=new Set(),styles=new Map(),attrs={};
  const section={dataset:{sectionId:"inicio"},querySelectorAll:()=>[element]};
  const iframe={innerHeight:740,matchMedia:(q)=>({matches:q.includes("767px")}),requestAnimationFrame:(fn)=>{fn();return 1;},cancelAnimationFrame:()=>{},IntersectionObserver:class{observe(){} disconnect(){} unobserve(){}}};
  const element={
    dataset:{blockId:"hero-heading"},classList:{add:(...x)=>x.forEach(v=>classes.add(v)),remove:(...x)=>x.forEach(v=>classes.delete(v))},
    style:{setProperty:(k,v)=>styles.set(k,v),removeProperty:(k)=>styles.delete(k)},
    closest:()=>section,getBoundingClientRect:()=>({top:80}),matches:()=>false,querySelector:()=>null,
    removeAttribute:(k)=>delete attrs[k],isConnected:true
  };
  const rootEl={
    ownerDocument:{defaultView:iframe},dataset:{},querySelectorAll:()=>[element],
    removeAttribute:(name)=>delete rootEl.dataset[name],getAttribute:()=>null
  };
  const stop=attachSiteMotion(rootEl,{preset:"professional",mobile:"none"});
  assert.equal(classes.has("pn-motion-target"),false,"mobile suppression must use iframe width");
  stop();
});
