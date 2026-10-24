import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {applyAnnouncementTextInstruction, referencesTopAnnouncement} from "../src/lib/builder-v2-announcement.ts";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const site=()=>({title:"PetLoVe",blocks:[{id:"hero-heading",type:"heading",text:"PetLoVe: cuidado de verdade para seu pet"},{id:"hero-cta",type:"button",text:"Ver serviços"}],extras:{enabled:{announcement:true},announcementMotion:true,announcementSpeed:24}});

test("top green strip targets only extras.announcement",()=>{
  const original=site();const snapshot=structuredClone(original);
  for(const instruction of [
    "Troque o texto conheça nossos serviços ... Para Frete grátis",
    "Troque o texto da tarja verde para Frete grátis",
    "Mude a faixa superior para Frete grátis",
    "Altere o aviso superior por Frete grátis",
    "Coloque Frete grátis na tarja verde"
  ]){
    const result=applyAnnouncementTextInstruction(original,instruction);
    assert.ok(result&&"site" in result,instruction);
    assert.equal(result.site.extras.announcement,"Frete grátis");
    assert.deepEqual(result.site.blocks,snapshot.blocks);
    assert.deepEqual(result.site.extras.enabled,snapshot.extras.enabled);
    assert.equal(result.site.extras.announcementMotion,true);
  }
  assert.deepEqual(original,snapshot);
});
test("button, logo and hero requests do not touch the strip",()=>{
  for(const instruction of ["Troque o texto do botão para Frete grátis","Mude o título principal para Promoção","Altere a logo para PetLoVe"]){
    assert.equal(applyAnnouncementTextInstruction(site(),instruction),null);
  }
  assert.equal(referencesTopAnnouncement("Troque o texto do botão para Frete grátis"),false);
});
test("identifies a previously customized announcement",()=>{
  const current={...site(),extras:{announcement:"Entrega ágil em todo o Brasil",announcementMotion:false}};
  const result=applyAnnouncementTextInstruction(current,"SUBSTITUA o texto ENTREGA ÁGIL EM todo ... por Oferta da semana!");
  assert.ok(result&&"site" in result);
  assert.equal(result.site.extras.announcement,"Oferta da semana!");
});
test("rejects unclear strip replacements without modifying the site",()=>{
  assert.deepEqual(applyAnnouncementTextInstruction(site(),"Troque a tarja verde"),{error:"Informe o novo texto da tarja superior. Nenhum outro elemento foi alterado."});
});
test("motion, color and unrelated image strips never become announcement text",()=>{
  const original=site();
  for(const instruction of [
    "Mude o movimento da faixa superior para direita",
    "Altere a cor da tarja verde para amarelo",
    "Troque o texto da faixa de produtos para Ofertas",
  ]) assert.equal(applyAnnouncementTextInstruction(original,instruction),null);
});
test("multi-target edits pass through the patch editor",()=>{
  assert.equal(applyAnnouncementTextInstruction(site(),"Troque a tarja verde para Frete grátis e mude o botão para Ver produtos"),null);
});
test("route keeps strip updates separate from CTA edits",()=>{
  const route=readFileSync(path.join(root,"src/app/api/builder-v2/chat/route.ts"),"utf8");
  assert.match(route,/applyAnnouncementTextInstruction\(editingSite,instructionText\)/);
  assert.match(route,/extraChanges\?:\{announcement\?:string\}/);
  assert.match(route,/announcement:editingSite\.extras\?\.announcement/);
});
