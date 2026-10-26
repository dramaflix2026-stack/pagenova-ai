import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {distinctProcessCardPhotos,matchApprovedNicheBank} from "../src/lib/builder-v2-process-card-images.ts";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(path.join(root,p),"utf8");
const catalog=JSON.parse(read("src/lib/niche-photo-catalog.json"));
const base="https://cdn.example/approved-niches/";
const cards=Array.from({length:3},(_,i)=>({id:"crm-process-step-"+(i+1)}));
const countDistinct=items=>new Set(items.map(item=>item?.src).filter(Boolean)).size;
test("odontology lead gets four different approved photos at no API cost",()=>{
 const repeated=[
  {id:"hero",src:"https://cdn.example/hero.webp"},
  {id:"google",src:"https://cdn.example/smile.webp"},
  {id:"repeat",src:"https://cdn.example/smile.webp"}
 ];
 const chosen=distinctProcessCardPhotos({
   cards,photos:repeated,niche:"Dentista",title:"Dra Daniele | DT Odontologia Integrada",
   catalog,baseUrl:base,crmImported:true,appendExtra:true
 });
 assert.equal(chosen.length,4);
 assert.equal(countDistinct(chosen),4);
 assert.ok(chosen.every(item=>item?.src?.startsWith(base)));
 assert.ok(chosen.every(item=>item?.mobileSrc?.startsWith(base)));
 assert.ok(chosen.every(item=>item?.src?.endsWith(".png")));
});
test("existing customer chat card-photo assignment is preserved and never duplicated elsewhere",()=>{
 const custom={id:"user-edited",forCardId:cards[0].id,src:"https://cdn.example/custom.webp",userUploaded:true};
 const chosen=distinctProcessCardPhotos({
   cards,photos:[custom,{id:"google",src:"https://cdn.example/one.webp"}],
   niche:"Odontologia",title:"Consultório",catalog,baseUrl:base,crmImported:true,appendExtra:true
 });
 assert.equal(chosen[0].src,custom.src);
 assert.equal(countDistinct(chosen),4);
 assert.ok(chosen.slice(1).every(item=>item.src!==custom.src));
});
test("duplicate links on two separate cards cannot render duplicate photos",()=>{
 const repeated=[...cards.map((c,i)=>({id:"card-"+i,forCardId:c.id,src:"https://cdn.example/same.webp"}))];
 const photos=distinctProcessCardPhotos({
   cards,photos:repeated,niche:"Odontologia",title:"Odonto",
   catalog,baseUrl:base,crmImported:true,appendExtra:true
 });
 assert.equal(countDistinct(photos),4);
});
test("unknown niche uses distinct real images only and no paid fallback",()=>{
 const photos=[{id:"a",src:"https://cdn.example/one.webp"},{id:"b",src:"https://cdn.example/two.webp"}];
 const chosen=distinctProcessCardPhotos({
   cards,photos,niche:"Desconhecido",title:"Algo sem categoria",
   catalog,baseUrl:base,crmImported:true,appendExtra:true
 });
 assert.equal(countDistinct(chosen),2);
 assert.equal(chosen.filter(Boolean).length,2);
 assert.equal(chosen.filter(Boolean).every(item=>item.src.startsWith("https://cdn.example/")),true);
});
test("all four existing visual templates share the same approved photo assignment",()=>{
 const renderer=read("src/components/builder-v2-site.tsx");
 assert.match(renderer,/distinctProcessCardPhotos\(/);
 assert.match(renderer,/const photo=processCardPhotos\[i\]/);
 assert.match(renderer,/processCardPhotos\[3\]/);
 assert.doesNotMatch(renderer,/processPhotos\[i%/);
 const source=read("src/app/app/builder-v2/page.tsx");
 assert.match(source,/setSite\(projectId\?\{\.\.\.parsed,crmImported:true\}:parsed\)/);
 const importer=read("src/lib/builder-v2-crm-import.ts");
 assert.match(importer,/crmImported:true/);
 assert.ok(matchApprovedNicheBank("Dentist", "Clínica", catalog)?.desktop.length>=4);
});
