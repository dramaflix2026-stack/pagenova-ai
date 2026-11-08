import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {universalInstructionClauses} from "../src/lib/builder-v2-universal-plan.ts";
import {parseUniversalCardEdit,applyUniversalCardEdit,universalEditedCardCopy} from "../src/lib/builder-v2-universal-card-edits.ts";
import {applyUniversalNaturalLanguage} from "../src/lib/builder-v2-universal-language.ts";

const originalRequest="No segundo card da seção Nossos tratamentos, altere o título para 'Purificação Facial' e atualize a descrição. Não altere os outros cards.";
const composite=(section="servicos",name="Serviços")=>({
 niche:"Clínica de estética",title:"Maison Lumière",
 blocks:[
  {id:section+"-heading",type:"heading",section,text:name},
  {id:section+"-intro",type:"paragraph",section,text:"Uma seleção de tratamentos personalizados."},
  ...["Harmonização facial: Equilíbrio e harmonia.","Limpeza de pele profunda: Cuidado e revitalização.","Tratamentos corporais: Atenção ao corpo.","Rejuvenescimento: Cuidado individual."].map((text,i)=>({id:"card-"+section+"-"+i,type:"paragraph",section,layout:"grid",text})),
  {id:"footer",type:"heading",section:"rodape",text:"Entre em contato"}
 ]
});
const split=(section="servicos")=>({
 niche:"Consultoria",blocks:[
  {id:"sec",section,type:"heading",text:"Nossos serviços"},
  {id:"intro",section,type:"paragraph",text:"Conheça o que fazemos."},
  ...["Consultoria","Diagnóstico","Planejamento","Execução"].flatMap((title,i)=>[
   {id:"heading-"+i,section,type:"heading",text:title},
   {id:"description-"+i,section,type:"paragraph",text:"Descrição "+i}
  ])
 ]
});
const snapshot=value=>JSON.parse(JSON.stringify(value));

test("comma following contextual ordinal+section is not a command boundary",()=>{
 assert.deepEqual(universalInstructionClauses(originalRequest),[originalRequest]);
});
test("the reported production request resolves a single stable card ID and requests generated copy",()=>{
 const site=composite();
 const result=parseUniversalCardEdit(site,originalRequest);
 assert.ok(result&&"intent" in result);
 assert.equal(result.intent.target.ordinal,1);
 assert.equal(result.intent.target.section,"servicos");
 assert.equal(result.intent.target.titleId,"card-servicos-1");
 assert.equal(result.intent.generateDescription,true);
 assert.equal(result.intent.newTitle,"Purificação Facial");
 assert.equal(applyUniversalNaturalLanguage(site,originalRequest),null,"AI-only description remains server-scoped");
 const changed=applyUniversalCardEdit(site,result.intent,"Um cuidado facial personalizado para limpeza e renovação da pele.");
 assert.equal(changed.ok,true);
 if(!changed.ok)return;
 const altered=changed.site.blocks.filter(b=>b.text!==site.blocks.find(o=>o.id===b.id)?.text);
 assert.deepEqual(altered.map(x=>x.id),["card-servicos-1"]);
 assert.equal(changed.site.blocks[3].text,"Purificação Facial: Um cuidado facial personalizado para limpeza e renovação da pele.");
});
test("same shared resolver works on ten distinct niche labels using real section aliases",()=>{
 for(const niche of ["Estética","Dermatologia","Barbearia","Cafeteria","Restaurante","Loja de perfumes","Consultoria","Oficina","Hotel","Cursos"]){
  const site={...composite("servicos"),niche};
  const request="No segundo card da seção Nossos tratamentos, altere o título para 'Novo título'.";
  const result=applyUniversalNaturalLanguage(site,request);
  assert.equal(result?.ok,true,"niche: "+niche);
  if(result?.ok)assert.equal(result.site.blocks[3].text,"Novo título: Cuidado e revitalização.");
 }
});
test("exact custom heading is resolved independently of a fixed service alias",()=>{
 const site=composite("ofertas-especiais","Nossos tratamentos");
 const request="No terceiro card da seção Nossos tratamentos, altere o título para 'Tratamentos Personalizados'.";
 const result=applyUniversalNaturalLanguage(site,request);
 assert.equal(result?.ok,true);
 if(result?.ok)assert.equal(result.site.blocks[4].text,"Tratamentos Personalizados: Atenção ao corpo.");
});
test("separate title and description block editing remains atomic",()=>{
 const site=split("services");
 const request="No segundo card da seção Nossos serviços, altere o título para 'Nova avaliação' e atualize a descrição para 'Análise individual e prática'.";
 const result=applyUniversalNaturalLanguage(site,request);
 assert.equal(result?.ok,true);
 if(!result?.ok)return;
 assert.deepEqual(result.changedIds,["heading-1","description-1"]);
 assert.equal(result.site.blocks.find(b=>b.id==="heading-1")?.text,"Nova avaliação");
 assert.equal(result.site.blocks.find(b=>b.id==="description-1")?.text,"Análise individual e prática");
 assert.equal(result.site.blocks.find(b=>b.id==="heading-2")?.text,"Planejamento");
});
test("explicit description copy never triggers AI and preserves untouched fields",()=>{
 const site=composite();
 const before=snapshot(site);
 const request="No segundo card da seção Nossos tratamentos, altere o título para 'Purificação Facial' e atualize a descrição para 'Cuidado facial atualizado'.";
 const result=applyUniversalNaturalLanguage(site,request);
 assert.equal(result?.ok,true);
 if(result?.ok)assert.deepEqual(result.site.blocks[3],{...site.blocks[3],text:"Purificação Facial: Cuidado facial atualizado",textExplicit:true});
 assert.deepEqual(site,before);
});
test("no made-up description: missing generated copy rejects the entire transaction",()=>{
 const site=composite(),before=snapshot(site);
 const intent=parseUniversalCardEdit(site,originalRequest);
 assert.ok(intent&&"intent" in intent);
 const attempt=applyUniversalCardEdit(site,intent.intent);
 assert.equal(attempt.ok,false);
 assert.deepEqual(site,before);
});
test("unrecognized section or absent ordinal cannot mutate any other card",()=>{
 const site=composite(),before=snapshot(site);
 for(const request of [
  "No segundo card da seção Valores, altere o título para 'Não'.",
  "No oitavo card da seção Serviços, altere o título para 'Não'."
 ]){
  const result=applyUniversalNaturalLanguage(site,request);
  assert.equal(result?.ok,false);
  assert.deepEqual(site,before);
 }
});
test("numeric ordinals and accentless labels are supported without changing indices",()=>{
 const site=composite();
 const request="No 2º card da seção nossos tratamentos, altere o titulo para 'Nova Limpeza'.";
 const result=applyUniversalNaturalLanguage(site,request);
 assert.equal(result?.ok,true);
 if(result?.ok)assert.equal(result.site.blocks[3].text,"Nova Limpeza: Cuidado e revitalização.");
});
test("server uses the same card resolver, generates only missing description, and applies one atomic patch",()=>{
 const api=readFileSync(new URL("../src/app/api/builder-v2/chat/route.ts",import.meta.url),"utf8");
 assert.ok(api.includes("parseUniversalCardEdit(snapshot,instructionText)"));
 assert.ok(api.includes("applyUniversalCardEdit(snapshot,intent,description)"));
 assert.ok(api.includes("previousDescription:intent.target.originalDescription"));
 assert.ok(api.indexOf("parseUniversalCardEdit(snapshot,instructionText)")<api.indexOf("const result=applyUniversalNaturalLanguage("));
});

test("editorial section prefix resolves any real section ID without niche-specific code",()=>{
 const site=composite("produtos","Produtos");
 const request="No segundo card da seção Nossos produtos, altere o título para 'Novo Produto'.";
 const result=applyUniversalNaturalLanguage(site,request);
 assert.equal(result?.ok,true);
 if(result?.ok)assert.equal(result.site.blocks[3].text,"Novo Produto: Cuidado e revitalização.");
});
test("ambiguous alias across two distinct sections is rejected safely",()=>{
 const site=composite();
 site.blocks.push(
   {id:"treatments-heading",type:"heading",section:"tratamentos",text:"Tratamentos"},
   {id:"card-tratamentos-0",type:"paragraph",section:"tratamentos",layout:"grid",text:"Outro serviço: Descrição"}
 );
 const request="No primeiro card da seção Nossas especialidades, altere o título para 'Não posso adivinhar'.";
 const result=applyUniversalNaturalLanguage(site,request);
 assert.equal(result?.ok,false);
});

test("shared renderer binding preserves original design until an explicit edit",()=>{
 const site=composite();
 assert.equal(universalEditedCardCopy(site,"servicos",1),null);
 const result=applyUniversalNaturalLanguage(site,"No segundo card da seção Nossos tratamentos, altere o título para 'Purificação Facial'.");
 assert.equal(result?.ok,true);
 if(!result?.ok)return;
 assert.deepEqual(universalEditedCardCopy(result.site,"servicos",1),{
  title:"Purificação Facial",description:"Cuidado e revitalização."
 });
 assert.equal(universalEditedCardCopy(result.site,"servicos",0),null);
 assert.equal(universalEditedCardCopy(result.site,"servicos",2),null);
});
test("TP1 M3 renderer opts into the same generic card reading contract",()=>{
 const render=readFileSync(new URL("../src/components/builder-v2-tp1-model3-sections.tsx",import.meta.url),"utf8");
 assert.ok(render.includes('universalEditedCardCopy(site,"servicos",i)?.title??s'));
 assert.ok(render.includes('universalEditedCardCopy(site,"servicos",i)?.description??('));
});
