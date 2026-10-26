import test from "node:test";
import assert from "node:assert/strict";
import {planInstitutionalImageEdit,institutionalImageIntent,restoreInstitutionalSectionImages} from "../src/lib/builder-v2-institutional-images.ts";

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

test("gallery photo order can be changed while IDs and other sections stay stable",()=>{
  const before=original();
  const next=apply(before,"Mova a foto 3 do portfólio para a posição 1.");
  assert.deepEqual(next.blocks.filter(b=>b.section==="galeria"&&b.type==="image").map(b=>b.id),["p3","p1","p2"]);
  assert.equal(next.blocks.find(b=>b.id==="hero").src,before.blocks.find(b=>b.id==="hero").src);
});
test("restoring cover photos leaves subsequent text edits untouched",()=>{
  const previous=original();
  const edited=apply(previous,"Troque a imagem principal da capa.",["https://store/new.jpg"]);
  edited.blocks.find(b=>b.id==="lead").text="Texto editado após a foto";
  const restored=restoreInstitutionalSectionImages(edited,previous,"Restaure a foto anterior da capa");
  assert.equal(restored.site.blocks.find(b=>b.id==="hero").src,"https://img.example/old.jpg");
  assert.equal(restored.site.blocks.find(b=>b.id==="lead").text,"Texto editado após a foto");
});
test("adding image to Sobre Nos does not touch the cover",()=>{
  const before=original();
  before.blocks.push(text("about","sobre","Sobre nós","heading"));
  const next=apply(before,"Adicione esta foto à seção Sobre Nós.",["https://store/about.jpg"]);
  assert.ok(next.blocks.some(b=>b.section==="sobre"&&b.src==="https://store/about.jpg"));
  assert.equal(next.blocks.find(b=>b.id==="hero").src,"https://img.example/old.jpg");
});

test("one already-installed hero photo plus one attachment makes a double banner",()=>{
  const before=original();
  const result=apply(before,
    "Adicione esta imagem como segunda imagem da capa, formando um banner duplo. Preserve a imagem original, o título, a descrição e os botões.",
    ["https://store/new-second.jpg"]);
  assert.equal(result.heroComposition,"duo");
  assert.deepEqual(result.blocks.filter(b=>b.type==="image"&&b.section==="inicio").map(b=>b.src),
    ["https://img.example/old.jpg","https://store/new-second.jpg"]);
  assert.deepEqual(result.blocks.filter(b=>b.type!=="image"),before.blocks.filter(b=>b.type!=="image"));
});
test("existing visible hero from another section is recognized without moving its source",()=>{
  const before=original();
  before.blocks=before.blocks.filter(b=>b.id!=="hero");
  const result=apply(before,"Coloque esta foto como segunda imagem da capa, banner duplo.",
    ["https://store/extra.jpg"]);
  assert.equal(result.heroComposition,"duo");
  assert.deepEqual(result.blocks.filter(b=>b.section==="inicio"&&b.type==="image").map(b=>b.src),
    ["https://img.example/s1.jpg","https://store/extra.jpg"]);
  assert.equal(result.blocks.find(b=>b.id==="old-service")?.src,"https://img.example/s1.jpg");
  assert.deepEqual(result.blocks.filter(b=>b.type!=="image"),before.blocks.filter(b=>b.type!=="image"));
});
test("no attached second photo reports exactly one missing and changes nothing",()=>{
  const before=original();
  assert.throws(()=>apply(before,"Transforme a capa em banner duplo. Preserve tudo."),
    error=>/capa já possui 1 fotografia/.test(error.message)&&/anexe mais 1 foto/.test(error.message));
  assert.equal(before.heroComposition,"single");
  assert.equal(before.blocks.filter(b=>b.section==="inicio"&&b.type==="image").length,1);
});
test("first hero photo rendered from another section also counts toward missing total",()=>{
  const before=original();
  before.blocks=before.blocks.filter(b=>b.id!=="hero");
  assert.throws(()=>apply(before,"Forme um banner duplo com a foto atual e uma segunda imagem."),
    /capa já possui 1 fotografia/);
  assert.equal(before.blocks.find(b=>b.id==="old-service")?.src,"https://img.example/s1.jpg");
});
test("three images required for triplo but only one missing when two already exist",()=>{
  const before=original();
  before.blocks.push(img("hero-2","inicio","https://img.example/existing2.jpg"));
  assert.throws(()=>apply(before,"Transforme a capa em banner triplo. Preserve o restante."),
    /anexe mais 1 foto/);
});

test("replacing photo on second banner updates only that image",()=>{
  const before=original();
  before.heroComposition="duo";
  before.blocks.push(img("second-banner","inicio","https://img.example/second.jpg"));
  const next=apply(before,'Troque a imagem do segundo banner pela foto anexada.',["https://store/new-second.jpg"]);
  assert.equal(next.blocks.find(b=>b.id==="hero").src,"https://img.example/old.jpg");
  assert.equal(next.blocks.find(b=>b.id==="second-banner").src,"https://store/new-second.jpg");
  assert.equal(next.blocks.filter(b=>b.section==="inicio"&&b.type==="image").length,2);
  assert.deepEqual(next.blocks.filter(b=>b.type!=="image"),before.blocks.filter(b=>b.type!=="image"));
});
test("second photo on cover phrasing creates carousel composition",()=>{
  const before=original();
  const next=apply(before,"Adicione esta segunda foto na capa sem mexer na primeira.",["https://store/banner2.jpg"]);
  assert.equal(next.heroComposition,"duo");
  assert.equal(next.blocks.find(b=>b.id==="hero").src,"https://img.example/old.jpg");
  assert.ok(next.blocks.some(b=>b.section==="inicio"&&b.src==="https://store/banner2.jpg"));
});
