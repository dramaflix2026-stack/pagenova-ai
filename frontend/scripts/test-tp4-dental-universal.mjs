import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import ts from "typescript";
import {TP4_DENTAL_IMAGE_POOL,TP4_DENTAL_GALLERY_IMAGES,TP4_DENTAL_TEAM_IMAGES} from "../src/lib/tp4-dental-photo-catalog.ts";
const root=path.resolve(fileURLToPath(new URL("..",import.meta.url)));
const read=(file)=>readFileSync(path.join(root,file),"utf8");
const models=[1,2,3].map(n=>read("src/components/builder-v2-tp4-model"+n+".tsx"));
const shared=read("src/components/builder-v2-tp4-dental-enhancements.tsx");
const css=read("src/components/builder-v2-tp4-dental-enhancements.css");
const renderer=read("src/components/builder-v2-site.tsx");
test("all dental template files have valid TypeScript JSX syntax",()=>{
 for(const filename of ["src/components/builder-v2-tp4-model1.tsx","src/components/builder-v2-tp4-model2.tsx","src/components/builder-v2-tp4-model3.tsx","src/components/builder-v2-tp4-dental-enhancements.tsx"]){
  const tree=ts.createSourceFile(filename,read(filename),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.equal(tree.parseDiagnostics.length,0,filename+": "+tree.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")).join("; "));
 }
});
test("photography is real curated Pexels, 6 unique gallery images, 4 distinct team portraits, no disturbing dental closeup",()=>{
 assert.ok(TP4_DENTAL_IMAGE_POOL.length>=18);
 assert.equal(new Set(TP4_DENTAL_IMAGE_POOL).size,TP4_DENTAL_IMAGE_POOL.length);
 assert.equal(TP4_DENTAL_GALLERY_IMAGES.length,6);
 assert.equal(new Set(TP4_DENTAL_GALLERY_IMAGES).size,6);
 assert.equal(TP4_DENTAL_TEAM_IMAGES.length,4);
 assert.equal(new Set(TP4_DENTAL_TEAM_IMAGES).size,4);
 assert.ok(TP4_DENTAL_IMAGE_POOL.every(src=>/^https:\/\/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg$/.test(src)));
 for(const model of models){
  assert.doesNotMatch(model,/photo-1606811971618-4486d14f3f99/);
  assert.match(model,/TP4_DENTAL_IMAGE_POOL|tp4DentalImage/);
 }
});
test("model 1 has improved hero, six-card gallery, five dental testimonials and working location surface",()=>{
 const s=models[0];
 assert.match(s,/src=\{media\(0\)\}/);
 assert.match(s,/\[2,3,4,5,6,7\]\.map/);
 assert.match(s,/DentalTestimonials site=\{site\} publishedMode=\{publishedMode\}/);
 assert.match(s,/DentalLocation site=\{site\}/);
 assert.match(s,/DentalPremiumFooter site=\{site\} variant="01"/);
 assert.match(s,/id="dental-gallery"/);
 assert.match(s,/id="dental-contact"/);
});
test("model 2 has isolated hero, four team photos, animated counters, five reviews, map and premium footer",()=>{
 const s=models[1];
 assert.match(s,/img\(key==="dentistry"\?1:0\)/);
 assert.match(s,/DentalTeamGallery/);
 assert.match(s,/DentalMetrics site=\{site\} model="02"/);
 assert.match(s,/DentalTestimonials site=\{site\} publishedMode=\{publishedMode\}/);
 assert.match(s,/DentalLocation site=\{site\}/);
 assert.match(s,/DentalPremiumFooter site=\{site\} variant="02"/);
});
test("model 3 uses dentistry-only safe image pool, distinct hero, animated metrics, reviews and premium footer",()=>{
 const s=models[2];
 assert.match(s,/const images=dental\?\[\.\.\.TP4_DENTAL_IMAGE_POOL\]/);
 assert.match(s,/src=\{image\(dental\?16:0\)\}/);
 assert.match(s,/DentalMetrics site=\{site\} model="03"/);
 assert.match(s,/DentalTestimonials site=\{site\} publishedMode=\{publishedMode\}/);
 assert.match(s,/DentalPremiumFooter site=\{site\} variant="03"/);
 assert.match(s,/DentalLocation site=\{site\}/);
});
test("examples and fake clinic data never masquerade as real patient endorsements or appointment counts",()=>{
 assert.match(shared,/const examples=!publishedMode&&verified\.length===0/);
 assert.match(shared,/FOTOS E RELATOS ILUSTRATIVOS/);
 assert.match(shared,/não representam atendimentos, pacientes ou resultados reais/i);
 assert.match(shared,/Equipe profissional|Profissional|Foto editorial ilustrativa/);
 assert.doesNotMatch(shared,/1\.200\+|99% de satisfa[cç][aã]o|milhares de pacientes/);
 assert.match(shared,/window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
 assert.match(shared,/IntersectionObserver/);
});
test("model routing preserves the same approved 3 templates for every dental briefing and publication flags",()=>{
 assert.match(renderer,/BuilderV2TP4Model3 site=\{site\} publishedMode=\{publishedMode\}/);
 assert.match(renderer,/BuilderV2TP4Model2 site=\{site\} publishedMode=\{publishedMode\}/);
 assert.match(renderer,/BuilderV2TP4Model1 site=\{site\} publishedMode=\{publishedMode\}/);
 assert.match(shared,/https:\/\/www\.google\.com\/maps\?q=/);
 assert.match(shared,/https:\/\/wa\.me\//);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/pn-dental-footer-main/);
 assert.match(css,/pn-dental-kpi-grid/);
});
