import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import ts from "typescript";
import {getTP1RealReviews,getTP1FamilyContact} from "../src/lib/tp1-family-content.ts";
const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const read=path=>readFileSync(resolve(root,path),"utf8");

test("TP1 shared review parser accepts real supplied feedback but skips fictitious and unrelated content",()=>{
 const data=[
  {type:"paragraph",section:"depoimentos",text:"Camila Sousa | São Paulo | Gostei muito da atenção e da explicação clara sobre os cuidados."},
  {type:"paragraph",section:"avaliacoes",text:"João Silva | Santo André | O atendimento foi cuidadoso e todas as etapas foram explicadas."},
  {type:"paragraph",section:"depoimentos",text:"Maria Lima | Cliente | Depoimento fictício para demonstrar o modelo."},
  {type:"paragraph",section:"sobre",text:"Ana Lima | Cidade | Uma avaliação que não pertence à seção de depoimentos."}
 ];
 const result=getTP1RealReviews(data);
 assert.equal(result.length,2);
 assert.equal(result[0].name,"Camila Sousa");
 assert.equal(result[1].name,"João Silva");
 assert.equal(getTP1RealReviews([]).length,0);
});

test("all beauty-premium niches share preview map behavior and no fake public address or phone",()=>{
 const niches=["Barbearia","Clínica de estética","Dermatologia","SPA e bem-estar","Odontologia estética","Fisioterapia","Psicologia e terapias","Salão de beleza premium","Estúdio de maquiagem","Fotografia profissional","Consultoria de imagem"];
 for(const niche of niches){
  const site={niche,footer:{}};
  const preview=getTP1FamilyContact(site,false);
  assert.equal(preview.demonstrative,true,niche);
  assert.match(preview.mapSrc,/google.com\/maps\?q=/);
  assert.equal(preview.whatsappHref,"");
  const publicPage=getTP1FamilyContact(site,true);
  assert.equal(publicPage.mapSrc,"",niche);
  assert.equal(publicPage.whatsappHref,"",niche);
 }
 const configured=getTP1FamilyContact({footer:{address:"Rua das Flores, 45, São Paulo",whatsapp:"(11) 99999-9999"}},true);
 assert.match(configured.mapSrc,/Rua%20das%20Flores/);
 assert.equal(configured.whatsappHref,"https://wa.me/5511999999999");
});

test("all three TP1 models and the classic renderer share review component and parse",()=>{
 const files=[
  "src/components/builder-v2-site.tsx",
  "src/components/builder-v2-tp1-model1.tsx",
  "src/components/builder-v2-tp1-model2.tsx",
  "src/components/builder-v2-tp1-model3.tsx",
  "src/components/builder-v2-tp1-model3-sections.tsx",
  "src/components/builder-v2-tp1-family-testimonials.tsx"
 ];
 for(const file of files){
  const parsed=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[],file);
 }
 for(const file of [files[0],files[1],files[2],files[4]])assert.ok(read(file).includes("TP1FamilyTestimonials"),file);
 assert.ok(read(files[0]).includes("visibleSections.splice("));
 assert.ok(read(files[2]).includes("familyContact.demonstrative"));
 assert.ok(read(files[4]).includes("familyContact.previewWhatsApp"));
});

test("aesthetics model 1 keeps taupe palette, and every TP1 model has five preview review cards",()=>{
 const chooser=read("src/components/builder-v2-site.tsx");
 const stylesheet=read("src/components/builder-v2-tp1-family-testimonials.css");
 const reviews=read("src/components/builder-v2-tp1-family-testimonials.tsx");
 assert.ok(chooser.includes('data-tp1-aesthetic-model1={model1Aesthetic?"true":undefined}'));
 assert.ok(stylesheet.includes('[data-tp1-aesthetic-model1="true"]'));
 assert.ok(stylesheet.includes("color:#92735e!important"));
 const entries=reviews.match(/name:"(?:Camila Duarte|Rafael Martins|Ana Ribeiro|Lucas Ferreira|Marina Costa)"/g)||[];
 assert.equal(entries.length,5);
 assert.ok(reviews.includes("if(publishedMode&&!realReviews.length)return null;"));
 assert.ok(reviews.includes("5-realReviews.length"));
 assert.ok(reviews.includes("EXEMPLO FICTÍCIO"));
});
test("aesthetics model 3 has distinct topical image slots",()=>{
 const imageFile=read("src/lib/tp1-aesthetic-photos.ts");
 const photoIds=[...imageFile.matchAll(/pexels-photo-(\d+)\.jpeg/g)].map(x=>x[1]);
 assert.equal(photoIds.length,22);
 assert.equal(new Set(photoIds).size,22);
 const model=read("src/components/builder-v2-tp1-model3-sections.tsx");
 for(const text of ['photos:Array.from({length:22},(_,i)=>"aest-"+i)','isDermatology||isAesthetic?5:4','isDermatology||isAesthetic?i+1:i','isDermatology||isAesthetic?config.photos[6+i]','isDermatology||isAesthetic?config.photos[9+i]','isDermatology||isAesthetic?config.photos[16]','isDermatology||isAesthetic?i+17:i+5'])assert.ok(model.includes(text),text);
 assert.ok(read("src/components/builder-v2-tp1-model3.tsx").includes("getTP1AestheticImage(0)"));
});
