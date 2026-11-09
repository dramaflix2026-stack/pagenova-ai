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
 assert.match(shared,/Indicadores de projetos realizados, clientes atendidos e experiência serão exibidos somente quando a empresa fornecer dados verificáveis/);
 assert.match(shared,/data-tp2-mode="approach"/);
 assert.match(shared,/data-tp2-mode="verified"/);
 assert.match(shared,/hasTP2VerifiedMetrics/);
 assert.doesNotMatch(shared,/Especialidades apresentadas|Perguntas frequentes respondidas/);
 assert.match(shared,/pntp2-footer-columns/);
 assert.match(shared,/pntp2-footer-column-title/);
 assert.match(shared,/universalBlockProps\(headlineBlock\)/);
 assert.match(models[1],/headlineBlock=\{footerParagraph\|\|footerHeading\}/);
 assert.match(models[2],/headlineBlock=\{footerHeading\|\|footerParagraph\}/);
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
 const footerCss=file("builder-v2-tp2-evidence.css");
 assert.match(footerCss,/\.pntp2-footer-columns/);
 assert.match(footerCss,/@media\(max-width:600px\)/);
 assert.match(footerCss,/font-size:12px!important/);
 assert.match(models[1],/<MaterialProof variant=\{2\}\/>/);
 assert.match(models[2],/<MaterialProof variant=\{3\}\/>/);
 assert.match(models[1],/<MaterialTestimonials provided=\{testimonials\} variant=\{2\}\/>/);
 assert.match(models[2],/<MaterialTestimonials variant=\{3\} provided=\{testimonials\}\/>/);
});


test("TP2 footer overrides the legacy global four-column rule on its direct child",()=>{
 const css=readFileSync(new URL("../src/app/globals.css",import.meta.url),"utf8");
 assert.match(css,/body footer > div:first-child\s*\{[\s\S]*?grid-template-columns:\s*minmax\(240px/);
 assert.match(css,/body footer\.pn-tp2-footer > div\[data-tp2-proof="premium-footer"\]:first-child\s*\{[\s\S]*?display:block !important;[\s\S]*?grid-template-columns:none !important/);
 assert.match(css,/body footer\.pn-tp2-footer \.pntp2-footer-columns\s*\{[\s\S]*?grid-template-columns:repeat\(3,minmax\(0,1fr\)\) !important/);
 assert.match(css,/@media\(max-width:640px\)\s*\{[\s\S]*?body footer\.pn-tp2-footer \.pntp2-footer-columns/);
 assert.match(models[0],/className="pn-tp2-footer bg/);
 assert.match(models[1],/className="tp2m2-footer pn-tp2-footer"/);
 assert.match(models[2],/isMaterials\?" pnmat-m3-footer":" pn-tp2-footer"/);
});
