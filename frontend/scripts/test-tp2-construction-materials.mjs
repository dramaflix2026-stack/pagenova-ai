import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import ts from "typescript";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>readFileSync(path.join(root,file),"utf8");
test("construction TP2 components are valid TSX, including all three model renderers",()=>{
 for(const f of ["src/components/builder-v2-tp2-construction.tsx","src/components/builder-v2-tp2-model1.tsx","src/components/builder-v2-tp2-model2.tsx","src/components/builder-v2-tp2-model3.tsx","src/components/builder-v2-site.tsx"]){
   const p=ts.createSourceFile(f,read(f),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
   assert.equal(p.parseDiagnostics.length,0,f+": "+p.parseDiagnostics.map(x=>ts.flattenDiagnosticMessageText(x.messageText," ")).join("; "));
 }
});
test("material niche detection and all material-specific sections isolated to TP2",()=>{
 const shared=read("src/components/builder-v2-tp2-construction.tsx");
 for(const word of ["isConstructionMaterials","materialPhotoIds","constructionPhotoFor","MaterialProof","MaterialTestimonials","materialDemoTestimonials"]){
  assert.ok(shared.includes(word),word);
 }
 assert.match(shared,/materiais\?\\s\+/);
 for(const n of ["1","2","3"]){
  const s=read("src/components/builder-v2-tp2-model"+n+".tsx");
  assert.ok(s.includes("isConstructionMaterials"),"M"+n);
  assert.ok(s.includes("isMaterials?"),"M"+n+" scoped");
 }
});
test("construction catalog has at least 24 distinct verified photo IDs and material catalog descriptions",()=>{
 const s=read("src/components/builder-v2-tp2-construction.tsx");
 const body=s.split("const materialPhotoIds=[")[1]?.split("] as const;")[0];
 assert.ok(body,"images array");
 const ids=[...body.matchAll(/\b\d{7,8}\b/g)].map(x=>x[0]);
 assert.ok(ids.length>=24,"at least 24 construction photos");
 assert.equal(new Set(ids).size,ids.length,"no repeated photo IDs in material catalog");
 assert.match(s,/cement bags/);
 assert.match(s,/tools/);
 assert.match(s,/metal pipes/);
});
test("five distinct fictional testimonials are explicitly marked as fictional",()=>{
 const s=read("src/components/builder-v2-tp2-construction.tsx");
 const names=["Mariana Oliveira","Ricardo Almeida","Patrícia Souza","Carlos Ferreira","Juliana Martins"];
 for(const n of names)assert.ok(s.includes(n),n);
 assert.ok(s.includes('demo:true'),"fiction tags");
 assert.ok(s.includes("RELATO FICTÍCIO · FOTO ILUSTRATIVA"));
 assert.ok(s.includes("Não representam compradores reais"));
});
test("model 1 contact sections merged and example address only in editing preview",()=>{
 const s=read("src/components/builder-v2-tp2-model1.tsx");
 assert.ok(s.includes("{!isMaterials&&<section id=\"localizacao\""),"old section only for nonmaterials");
 assert.match(s,/!publishedMode&&isMaterials/);
 assert.match(s,/ENDEREÇO FICTÍCIO/);
 assert.ok(s.indexOf("Mapa demonstrativo de materiais de construção") < s.indexOf("Falar no WhatsApp"),"map before WhatsApp");
 assert.ok(s.includes("materialFAQ"));
 assert.ok(s.includes("materialPractices"));
 assert.match(s,/RODAPÉ PREMIUM/);
 const route=read("src/components/builder-v2-site.tsx");
 assert.ok(route.includes("BuilderV2TP2Model1 site={site} publishedMode={publishedMode}"));
});
test("model 2 3 have results with technical details and 5 photos testimonials and isolated premium footer",()=>{
 for(const model of [2,3]){
  const s=read("src/components/builder-v2-tp2-model"+model+".tsx");
  assert.match(s,/MaterialProof/);
  assert.match(s,/MaterialTestimonials/);
  assert.match(s,/constructionPhotoFor/);
  assert.match(s,/pnmat-building/);
  assert.match(s,/galleryImages\[i\]/);
 }
 const m2=read("src/components/builder-v2-tp2-model2.tsx");
 assert.match(m2,/materialPillars/);
 assert.match(m2,/Nossa prática/);
 const m3=read("src/components/builder-v2-tp2-model3.tsx");
 assert.match(m3,/pnmat-m3-footer/);
 assert.match(m3,/pnmat-m3-brand/);
});
