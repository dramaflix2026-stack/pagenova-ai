import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const code=readFileSync(path.join(root,"src/lib/tp1-makeup-niche.ts"),"utf8");
const compiled=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
const exports={};
vm.runInNewContext(compiled.outputText,{exports,module:{exports},console});
const {isTP1MakeupSite,prepareTP1MakeupSite,MAKEUP_PHOTOS}=exports;
const block=(id,section,type,text,src,other={})=>({id,section,type,text,color:"#111111",align:"left",src,...other});

test("makeup brand outranks incorrectly persisted barbershop niche",()=>{
 const site={title:"Estúdio de Maquiagem",niche:"Barbearia",header:{brand:"Estúdio de Maquiagem"},background:"#fff",blocks:[block("h","inicio","heading","Realce sua beleza natural")]};
 assert.equal(isTP1MakeupSite(site),true);
 const normalized=prepareTP1MakeupSite(site);
 assert.equal(normalized.niche,"Estúdio de Maquiagem");
 assert.equal(site.niche,"Barbearia","source project must not be mutated");
});
test("real barbershop remains completely unchanged",()=>{
 const site={title:"Barbearia Profissional",niche:"Barbearia",blocks:[block("h","inicio","heading","Corte masculino")]};
 assert.equal(isTP1MakeupSite(site),false);
 assert.equal(prepareTP1MakeupSite(site),site,"must preserve existing approved barbershop");
});
test("all barbershop labels, paragraph and stock images are quarantined from makeup",()=>{
 const site={title:"Estúdio de Maquiagem",niche:"Barbearia",blocks:[
  block("hero","inicio","heading","Corte, barba e estilo para você"),
  block("intro","inicio","paragraph","Cuidado masculino e corte de cabelo"),
  block("hero-photo","inicio","image","Corte masculino","https://images.pexels.com/photos/7518731/pexels-photo-7518731.jpeg"),
  block("s1","servicos","heading","Barba completa"),
  block("s2","servicos","paragraph","Maquiagem para noivas com acabamento delicado"),
  block("s3","servicos","image","Corte masculino","https://images.pexels.com/photos/7518746/pexels-photo-7518746.jpeg"),
  block("g","galeria","image","Corte e barba","https://images.pexels.com/photos/19050581/pexels-photo-19050581.jpeg"),
  block("fake","depoimentos","paragraph","Lucas Ferreira | Cliente | Gostei do acabamento da barba"),
  block("real","servicos","image","Maquiagem de noivas","https://example.com/minha-foto.jpg",{userUploaded:true})
 ]};
 const next=prepareTP1MakeupSite(site);
 for(const item of next.blocks){
   assert.equal(/barbearia|barbeiro|barba|corte masculino|cuidado masculino/i.test(item.text||""),false,"stale copy "+item.id);
   assert.equal(/\/photos\/(?:7518731|7518746|19050581)\//.test(item.src||""),false,"stale image "+item.id);
 }
 assert.equal(next.blocks.some(x=>x.id==="fake"),false);
 assert.equal(next.blocks.find(x=>x.id==="s2").text,"Maquiagem para noivas com acabamento delicado","legitimate makeup text remains intact");
 assert.equal(next.blocks.find(x=>x.id==="real").src,"https://example.com/minha-foto.jpg","uploaded photo preserved");
 assert.equal(site.blocks.find(x=>x.id==="hero").text,"Corte, barba e estilo para você","original remains recoverable");
 assert.ok(next.blocks.find(x=>x.id==="g").src.startsWith("https://images.pexels.com/"));
});
test("curated makeup photo catalog has unique valid https sources",()=>{
 assert.ok(MAKEUP_PHOTOS.length>=25);
 assert.equal(new Set(MAKEUP_PHOTOS).size,MAKEUP_PHOTOS.length);
 for(const source of MAKEUP_PHOTOS)assert.match(source,/^https:\/\/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg/);
});
test("all three variants and generator compile to valid TSX grammar",()=>{
 const files=[
 "src/components/builder-v2-tp1-model1.tsx",
 "src/components/builder-v2-tp1-model2.tsx",
 "src/components/builder-v2-tp1-model3.tsx",
 "src/components/builder-v2-tp1-model3-sections.tsx",
 "src/components/builder-v2-site.tsx",
 "src/app/app/builder-v2/page.tsx"
 ];
 for(const file of files){
  const source=readFileSync(path.join(root,file),"utf8");
  const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.equal(tree.parseDiagnostics.length,0, file+": "+tree.parseDiagnostics.map(x=>ts.flattenDiagnosticMessageText(x.messageText," ")).join("; "));
 }
});
test("all template variants share correct makeup route and no demo map is exposed",()=>{
 const renderer=readFileSync(path.join(root,"src/components/builder-v2-site.tsx"),"utf8");
 assert.match(renderer,/prepareTP1MakeupSite\(site,selectedNiche\)/);
 assert.match(renderer,/BuilderV2TP1Model1 site=\{scopedSite\}/);
 assert.match(renderer,/BuilderV2TP1Model2Hero site=\{scopedSite\}/);
 assert.match(renderer,/BuilderV2TP1Model3Hero site=\{scopedSite\}/);
 const sections=readFileSync(path.join(root,"src/components/builder-v2-tp1-model3-sections.tsx"),"utf8");
 assert.equal(sections.includes("Avenida Paulista, 1000"),false);
 const m2=readFileSync(path.join(root,"src/components/builder-v2-tp1-model2.tsx"),"utf8");
 assert.equal(m2.includes("Avenida Paulista, 1000"),false);
 const page=readFileSync(path.join(root,"src/app/app/builder-v2/page.tsx"),"utf8");
 assert.ok(page.includes('effectiveBriefNiche=creatingMakeupSite?"Estúdio de Maquiagem":briefNiche'));
 assert.ok(page.includes("finishedSite=await generateVisuals(incoming,prompt);finishedSite=prepareTP1MakeupSite(finishedSite,shouldCreateProject?finishedSite.niche:selectedNiche)"));
 // A fresh florist project must not be projected as makeup from the previous selection.
 assert.ok(page.includes('const creatingMakeupSite=shouldCreateProject&&recognizedNiche==="Estúdio de maquiagem"'));
});
