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
const {initialSiteMotion,applySiteMotionInstruction,isMotionOnlyInstruction,motionRuleFor}=exports;
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
});
