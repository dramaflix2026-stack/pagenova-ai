import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const file=p=>readFileSync(new URL("../src/components/"+p,import.meta.url),"utf8");
const models=[1,2,3].map(i=>file("builder-v2-tp2-model"+i+".tsx"));
const shared=file("builder-v2-tp2-evidence.tsx"),site=file("builder-v2-site.tsx");
test("TP2 all 3 have metrics, five testimonial slots, contact map and premium footer",()=>{
 for(const m of models){
  for(const name of ["TP2EvidenceNumbers","TP2EvidenceTestimonials","TP2ContactMap","TP2PremiumFooterBody"])assert.ok(m.includes(name),name);
  assert.match(m,/data-universal-section="rodape"/);
 }
 assert.match(shared,/sample\.slice\(0,Math\.max\(0,5-real\.length\)\)/);
 assert.match(shared,/publishedMode\?\[\]/);
 assert.match(shared,/RELATO FICTÍCIO/);
 assert.match(shared,/não resultados comerciais/);
 assert.match(shared,/prefers-reduced-motion/);
});
test("publishedMode reaches both TP2 switchable models and fictitious testimonials stay in preview only",()=>{
 assert.match(site,/BuilderV2TP2Model2 site=\{site\} publishedMode=\{publishedMode\}/);
 assert.match(site,/BuilderV2TP2Model3 site=\{site\} publishedMode=\{publishedMode\}/);
 assert.match(shared,/CINCO RELATOS FICTÍCIOS/);
});
test("mobile footer links, map, real WhatsApp and older materials experiences remain available",()=>{
 assert.match(shared,/google\.com\/maps\?q=/);
 assert.match(shared,/wa\.me/);
 assert.match(shared,/href=\{home\}/);
 assert.match(shared,/sm:grid-cols-2 lg:grid-cols-3/);
 assert.match(models[1],/<MaterialProof variant=\{2\}\/>/);
 assert.match(models[2],/<MaterialProof variant=\{3\}\/>/);
 assert.match(models[1],/<MaterialTestimonials provided=\{testimonials\} variant=\{2\}\/>/);
 assert.match(models[2],/<MaterialTestimonials variant=\{3\} provided=\{testimonials\}\/>/);
});
