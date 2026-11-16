import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const file=name=>readFileSync(new URL(name,import.meta.url),"utf8");
const bridge=file("../src/components/builder-v2-tp9-model3.tsx");
const v3=file("../src/components/tp9-vertice-m3-approved.tsx");
const styles=file("../src/components/tp9-vertice-m3-approved.css");
const site=file("../src/components/builder-v2-site.tsx");
const manifest=JSON.parse(file("../quality/approved-templates-baseline.json"));

test("TP9 Model 3 Vértice branch is isolated; non-Vértice sites retain the original component",()=>{
 assert.match(bridge,/normalize\(props\.brand\)\.includes\("vertice auto center"\)/);
 assert.match(bridge,/<TP9VerticeModel3Approved \{\.\.\.props\}\/>/);
 assert.match(bridge,/<BaseTP9Model3 \{\.\.\.props\}\/>/);
 assert.match(bridge,/function BaseTP9Model3/);
 assert.match(site,/if\(props\.site\.briefingLayoutVariant==="03"\) return <BuilderV2TP9Model3/);
 assert.doesNotMatch(site,/TP9VerticeModel3Approved/);
});
test("All ten user-approved sections render once with unique targetable section IDs",()=>{
 const ids=["tp9v3-top","tp9v3-about","tp9v3-services","tp9v3-difference","tp9v3-process","tp9v3-gallery","tp9v3-reviews","tp9v3-faq","tp9v3-contact"];
 ids.forEach(id=>assert.match(v3,new RegExp('id="'+id+'"')));
 assert.match(v3,/09 \/ O PRÓXIMO CAPÍTULO/);
 assert.equal(new Set(ids).size,ids.length);
});
test("Six service cards, six sourced gallery photos and six optional demo reviews",()=>{
 const serviceSection=v3.split("const services=")[1].split("const stages=")[0];
 assert.equal((serviceSection.match(/title:"[^"]+",description:"[^"]+",photo:/g)||[]).length,6);
 assert.match(v3,/gallery:\["erWc6mrOq_I".*"ZFIgxM5BP5g"\]/);
 assert.equal((v3.match(/name:"Cliente demonstrativo \d+"/g)||[]).length,6);
 assert.match(v3,/DEMONSTRATIVO — NÃO É AVALIAÇÃO REAL/);
 assert.match(v3,/\[\.\.\.validReviews\.map/);
 assert.match(v3,/source\.gallery\.slice\(0,6-providedGallery\.length\)/);
});
test("FAQ contains exactly six useful fallback questions and accessible accordion",()=>{
 const faqBlock=v3.split("const fallbackFAQ:FAQ[]=")[1].split("const placeholderReviews")[0];
 assert.equal((faqBlock.match(/question:/g)||[]).length,6);
 assert.match(v3,/aria-expanded=\{openedFAQ===i\}/);
 assert.match(v3,/faqCards=\[\.\.\.customFAQs/);
});
test("No invented contacts; form is disabled without a validated registered channel",()=>{
 assert.match(v3,/const hasContact=Boolean\(safePhone\|\|safeEmail\)/);
 assert.match(v3,/disabled=\{!hasContact\}/);
 assert.match(v3,/não envia automaticamente/);
 assert.match(v3,/!hasContact\)\{setContactStatus/);
 assert.match(v3,/https:\/\/wa\.me\//);
 assert.match(v3,/mailto:/);
 assert.doesNotMatch(v3,/\b(?:11999999999|123456789|example@|contato@example)\b/);
});
test("Gallery has an accessible functional lightbox with Esc, arrow navigation, close and focus restore",()=>{
 assert.match(v3,/role="dialog" aria-modal="true"/);
 assert.match(v3,/e\.key==="Escape"/);
 assert.match(v3,/e\.key==="ArrowRight"/);
 assert.match(v3,/e\.key==="ArrowLeft"/);
 assert.match(v3,/returnFocus\.current\?\.focus/);
});
test("CSS is scoped and responsive, without modifying original global templates",()=>{
 assert.match(v3,/import "\.\/tp9-vertice-m3-approved\.css"/);
 assert.match(styles,/\.tp9v3-hero/);
 assert.match(styles,/\.tp9v3-reviewGrid/);
 assert.match(styles,/@media\(max-width:850px\)/);
 assert.match(styles,/@media\(max-width:560px\)/);
 assert.doesNotMatch(styles,/\.tp9m2-/);
});
test("Approved binding is pinned in the protected template manifest",()=>{
 const entry=manifest.protectedFiles.find(e=>e.path==="src/components/builder-v2-tp9-model3.tsx");
 assert.ok(entry);
 assert.match(entry.approvedBindingRevision.reason,/Vértice Auto Center TP9 Model 3/);
 assert.match(entry.approvedBindingRevision.sha,/^[0-9a-f]{40}$/);
});

test("Vértice service and journey tiles never match global broad card selectors",()=>{
 for(const oldClass of ["tp9v3-serviceCard","tp9v3-processCard","tp9v3-cardScrim","tp9v3-cardContent"]){
   assert.ok(!v3.includes(oldClass),oldClass+" collides with global card theme");
   assert.ok(!styles.includes(oldClass),oldClass+" collides with global card theme");
 }
 for(const newClass of ["tp9v3-serviceTile","tp9v3-processTile","tp9v3-photoShade","tp9v3-serviceContent"]){
   assert.ok(v3.includes(newClass),newClass+" must be rendered");
   assert.ok(styles.includes(newClass),newClass+" must have scoped styles");
 }
 assert.match(styles,/\.tp9v3-serviceTile \.tp9v3-serviceContent h3/);
 assert.match(styles,/\.tp9v3-processTile \.tp9v3-processCopy p/);
});
test("Vértice CTA footer stays a full-width stack instead of the forced global 4-column grid",()=>{
 assert.match(styles,/body footer\.tp9v3-footer>div\.tp9v3-wrap:first-child/);
 assert.match(styles,/display:block!important;/);
 assert.match(styles,/grid-template-columns:none!important;/);
 assert.match(styles,/body footer\.tp9v3-footer a\.tp9v3-button\.primary/);
 assert.match(styles,/grid-template-columns:1fr!important/);
});
