import test from "node:test";
import assert from "node:assert/strict";
import {fixture,render} from "./builder-v2-renderer-harness.mjs";
import {applyUniversalNaturalLanguage} from "../src/lib/builder-v2-universal-language.ts";
import {applyUniversalHeadingBatch} from "../src/lib/builder-v2-universal-heading-batches.ts";
import {summarizeUniversalEdit} from "../src/lib/builder-v2-universal-operations.ts";

const prompt='Na capa, altere somente o título principal para "Beleza e inovação em perfeita harmonia". Na seção Sobre a empresa, altere o título para "Nossa essência". Na seção Perguntas Frequentes, altere o título para "Tire suas dúvidas". Preserve todas as imagens, os botões, os parágrafos e as demais seções.';
const create=(variant="02")=>{
 const initial=fixture();
 return {...initial,niche:"Marketing digital",title:"Maison Lumière",templateId:"prompt-adaptive",briefingLayoutVariant:variant,blocks:[
  ...initial.blocks,
  {id:"about-heading",type:"heading",text:"Sobre a empresa",section:"sobre",color:"#123456",fontSize:42},
  {id:"about-first",type:"paragraph",text:"O primeiro parágrafo deve permanecer.",section:"sobre"},
  {id:"about-second",type:"paragraph",text:"O segundo parágrafo deve permanecer.",section:"sobre"},
  {id:"about-photo",type:"image",src:"https://example.com/office.jpg",section:"sobre"},
 ]};
};

test("exact customer batch atomically edits three persisted heading targets",()=>{
 const site=create(),original=structuredClone(site);
 const result=applyUniversalNaturalLanguage(site,prompt);
 assert.equal(result?.ok,true,result?.error);
 if(!result?.ok)return;
 assert.deepEqual(result.changedIds,["hero","about-heading","faq"]);
 assert.equal(result.requestedCount,3);
 assert.equal(result.alreadyCorrectCount,0);
 assert.equal(result.site.blocks.find(b=>b.id==="hero").text,"Beleza e inovação em perfeita harmonia");
 assert.equal(result.site.blocks.find(b=>b.id==="about-heading").text,"Nossa essência");
 assert.equal(result.site.blocks.find(b=>b.id==="faq").text,"Tire suas dúvidas");
 for(const id of result.changedIds)assert.equal(result.site.blocks.find(b=>b.id===id).textExplicit,true);
 for(const b of original.blocks.filter(b=>!result.changedIds.includes(b.id))){
  assert.deepEqual(result.site.blocks.find(x=>x.id===b.id),b,"unchanged "+b.id);
 }
 assert.deepEqual(site,original,"original is not mutated");
});
test("retry of same batch after a prior Hero-only edit finishes two missing headings",()=>{
 const site=create();site.blocks[0].text="Beleza e inovação em perfeita harmonia";
 const result=applyUniversalNaturalLanguage(site,prompt);
 assert.equal(result?.ok,true,result?.error);
 if(!result?.ok)return;
 assert.deepEqual(result.changedIds,["about-heading","faq"]);
 assert.equal(result.requestedCount,3);
 assert.equal(result.alreadyCorrectCount,1);
 assert.equal(summarizeUniversalEdit(result),"3 de 3 títulos atendidos: 2 títulos alterados agora e 1 já estava correto. Demais conteúdos preservados.");
 assert.equal(result.site.blocks[0].text,"Beleza e inovação em perfeita harmonia");
});
test("visual About and FAQ titles change in each TP5 model in preview and published output",()=>{
 for(const variant of ["01","02","03"]){
  const site=create(variant);
  const result=applyUniversalNaturalLanguage(site,prompt);
  assert.equal(result?.ok,true,variant+": "+result?.error);
  if(!result?.ok)continue;
  const saved=JSON.parse(JSON.stringify(result.site));
  for(const publishedMode of [false,true]){
   const before=render(site,publishedMode),after=render(saved,publishedMode);
   const about=after('[data-universal-heading="sobre"]');
   const faq=after('[data-universal-heading="faq"]');
   assert.equal(about.length,1,"About heading present "+variant);
   assert.equal(faq.length,1,"FAQ heading present "+variant);
   assert.equal(about.text(),"Nossa essência");
   assert.equal(faq.text(),"Tire suas dúvidas");
   assert.equal(before('[data-universal-heading="sobre"]').text().includes("Nossa essência"),false);
   assert.equal(after("h1").first().text().includes("Beleza e inovação em perfeita harmonia"),true);
   assert.deepEqual(after("img").map((_,img)=>after(img).attr("src")).get(),
    before("img").map((_,img)=>before(img).attr("src")).get(),"no image changes "+variant);
  }
 }
});
test("missing FAQ heading uses declared visible renderer slot, without inventing a block",()=>{
 for(const variant of ["01","02","03"]){
  const site=create(variant);site.blocks=site.blocks.filter(b=>b.id!=="faq");
  // A FAQ question still establishes that section in legacy projects.
  assert.ok(site.blocks.some(b=>b.section==="faq"));
  const changed=applyUniversalNaturalLanguage(site,prompt);
  assert.equal(changed?.ok,true,variant+": "+changed?.error);
  if(!changed?.ok)continue;
  assert.equal(changed.site.universalCopyOverrides["faq:heading:0"],"Tire suas dúvidas");
  assert.equal(changed.site.blocks.some(b=>b.id==="faq"),false);
  assert.equal(render(JSON.parse(JSON.stringify(changed.site)),false)('[data-universal-heading="faq"]').text(),"Tire suas dúvidas");
 }
});
test("invalid second or third section rolls back the entire batch",()=>{
 const site=create(),before=structuredClone(site);
 const invalid=prompt.replace("Na seção Sobre a empresa","Na seção Inexistente");
 const result=applyUniversalNaturalLanguage(site,invalid);
 assert.equal(result?.ok,false);
 assert.deepEqual(site,before);
});
test("unsupported clauses and ambiguous heading targets are rejected atomically",()=>{
 const site=create(),before=structuredClone(site);
 const bad=prompt.replace('altere o título para "Nossa essência"','remova a seção completamente');
 assert.equal(applyUniversalNaturalLanguage(site,bad)?.ok,false);
 const duplicated=structuredClone(site);
 duplicated.blocks.push({id:"about-extra",type:"heading",section:"sobre",text:"Outro título"});
 assert.equal(applyUniversalHeadingBatch(duplicated,prompt)?.ok,false);
 assert.deepEqual(site,before);
});
test("batch engine works across niche strings without business-specific parsing",()=>{
 for(const niche of ["Clínica de estética","Barbearia","Restaurante","Oficina","Floricultura","Escola","Hotel","Consultoria","Imobiliária","Marketing digital"]){
  const site={...create(),niche};
  const result=applyUniversalNaturalLanguage(site,prompt);
  assert.equal(result?.ok,true,niche+": "+result?.error);
  if(result?.ok)assert.deepEqual(result.changedIds,["hero","about-heading","faq"]);
 }
});

test("other universal edits keep their original successful confirmation",()=>{
 assert.equal(summarizeUniversalEdit({changedIds:["hero"]}),"Edição universal aplicada a 1 bloco(s). Demais conteúdos preservados.");
 assert.equal(summarizeUniversalEdit({changedIds:["a","b"]}),"Edição universal aplicada a 2 bloco(s). Demais conteúdos preservados.");
});
