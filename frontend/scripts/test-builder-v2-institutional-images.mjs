import test from "node:test";
import assert from "node:assert/strict";
import {planInstitutionalImageEdit,institutionalImageIntent} from "../src/lib/builder-v2-institutional-images.ts";

const img=(id,section,src)=>({id,type:"image",section,text:"Foto "+id,color:"#fff",align:"center",src});
const text=(id,section,value,type="paragraph")=>({id,type,section,text:value,color:"#222",align:"left"});
const original=()=>({title:"Arquitetura",blocks:[
  text("h1","inicio","Projeto de interiores","heading"),text("lead","inicio","Descrição original"),
  text("cta","inicio","Fale conosco","button"),img("hero","inicio","https://img.example/old.jpg"),
  text("services-title","servicos","Serviços","heading"),
  text("card1","servicos","Projeto: casas"),text("card2","servicos","Consultoria: espaços"),
  text("card3","servicos","Decoração: ambientes"),
  img("old-service","servicos","https://img.example/s1.jpg"),
  text("gallery-title","galeria","Portfólio","heading"),
  img("p1","galeria","https://img.example/p1.jpg"),
  img("p2","galeria","https://img.example/p2.jpg"),
  img("p3","galeria","https://img.example/p3.jpg")
],heroComposition:"single"});
const apply=(site,instruction,urls=[])=>planInstitutionalImageEdit(site,instruction,urls).site;
test("protections mentioning photos are never treated as photo edits",()=>{
  assert.equal(institutionalImageIntent("Altere a descrição, mas não altere a imagem."),false);
  assert.equal(institutionalImageIntent("Preserve as imagens e troque só o título."),false);
});
test("two uploaded photos make a true double hero without touching copy",()=>{
  const before=original();
  const result=apply(before,"Anexei duas fotos, coloque as duas na capa lado a lado.",["https://store/p1.jpg","https://store/p2.jpg"]);
  assert.equal(result.heroComposition,"duo");
  assert.deepEqual(result.blocks.filter(b=>b.section==="inicio"&&b.type==="image").slice(0,2).map(b=>b.src),["https://store/p1.jpg","https://store/p2.jpg"]);
  assert.deepEqual(result.blocks.filter(b=>b.type!=="image"),before.blocks.filter(b=>b.type!=="image"));
  assert.equal(before.blocks.find(b=>b.id==="hero").src,"https://img.example/old.jpg");
});
test("triple hero keeps three uploaded images in requested order",()=>{
  const next=apply(original(),"Coloque três imagens na capa, triplo banner.",["https://store/1","https://store/2","https://store/3"]);
  assert.equal(next.heroComposition,"trio");
  assert.deepEqual(next.blocks.filter(b=>b.section==="inicio"&&b.type==="image").slice(0,3).map(b=>b.src),["https://store/1","https://store/2","https://store/3"]);
});
test("replace second card photo without changing its title or other cards",()=>{
  const before=original();
  const next=apply(before,"Troque a imagem do segundo card de serviços.",["https://store/card2.jpg"]);
  const asset=next.blocks.find(b=>b.forCardId==="card2");
  assert.equal(asset.src,"https://store/card2.jpg");
  assert.equal(next.blocks.find(b=>b.id==="card2").text,"Consultoria: espaços");
  assert.equal(next.blocks.find(b=>b.id==="old-service").src,before.blocks.find(b=>b.id==="old-service").src);
});
test("mobile-only photo changes neither desktop nor other blocks",()=>{
  const before=original();
  const next=apply(before,"Troque somente a imagem mobile da capa.",["https://store/mobile.jpg"]);
  assert.equal(next.blocks.find(b=>b.id==="hero").src,"https://img.example/old.jpg");
  assert.equal(next.blocks.find(b=>b.id==="hero").mobileSrc,"https://store/mobile.jpg");
});
test("show whole image without cropping and keep source file",()=>{
  const before=original();
  const next=apply(before,"Mantenha a imagem inteira da capa, sem cortes.");
  assert.equal(next.blocks.find(b=>b.id==="hero").imageFit,"contain");
  assert.equal(next.blocks.find(b=>b.id==="hero").src,before.blocks.find(b=>b.id==="hero").src);
});
test("gallery deletion preserves other images and marks gallery managed",()=>{
  const next=apply(original(),"Remova a terceira fotografia do portfólio.");
  assert.equal(next.blocks.find(b=>b.id==="p3"),undefined);
  assert.equal(next.blocks.find(b=>b.id==="p2").src,"https://img.example/p2.jpg");
  assert.ok(next.sectionMediaManaged.includes("galeria"));
});
test("carousel and gallery grid are non-destructive",()=>{
  const next=apply(original(),"Transforme a galeria em carrossel.");
  assert.equal(next.sectionMediaLayouts.galeria,"carousel");
  assert.equal(next.blocks.length,original().blocks.length);
});
test("invalid card requests reject atomically",()=>{
  const input=original();
  assert.throws(()=>apply(input,"Troque a imagem do card 18 de serviços.",["https://store/photo.jpg"]),/Não encontrei/);
  assert.equal(input.blocks.length,original().blocks.length);
});
