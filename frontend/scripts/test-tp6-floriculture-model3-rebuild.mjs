import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const ui=read("../src/components/builder-v2-floriculture-model3.tsx");
const css=read("../src/components/builder-v2-floriculture-model3.css");
const route=read("../src/components/builder-v2-site.tsx");
const model1=read("../src/components/builder-v2-floriculture-model1.tsx");
const model2=read("../src/components/builder-v2-floriculture-model2.tsx");
const manifest=JSON.parse(read("../quality/approved-templates-baseline.json"));

test("Floricultura M3 opt-in is limited to variant 03 and niche Floricultura",()=>{
 assert.match(route,/import \{ TP6FloricultureModel3 \} from "@\/components\/builder-v2-floriculture-model3"/);
 assert.match(route,/if\(variant==="03"\)\{const photos=getTP6Model2InternetPhotos\(retailNiche,"03"\);if\(retailNiche==="Floricultura"\)/);
 assert.match(route,/return <TP6FloricultureModel3/);
 assert.match(route,/if\(variant==="02"\)/);
 assert.match(route,/return <TP6FloricultureModel2/);
 assert.match(route,/return <TP10UniversalCustomSections blocks=\{props.site.blocks\} sectionEvents=\{props.site.universalSectionEvents\} floriculture><TP6FloricultureModel1/);
 assert.match(route,/BuilderV2TP6Model3Hero/);
 assert.match(model1,/export function TP6FloricultureModel1/);
 assert.match(model2,/export function TP6FloricultureModel2/);
 assert.equal(manifest.protectedFileCount,162);
 assert.match(manifest.protectedFiles.find(e=>e.path==="src/components/builder-v2-site.tsx").approvedBindingRevision.reason,/Explicit user approval 2026-11-17/);
});
test("Twelve distinct floral sections and single semantic header/footer",()=>{
 for(const id of ["inicio","sobre","diferenciais","produtos","como-comprar","depoimentos","faq","contato","newsletter","localizacao","informacoes-loja","rodape"]){
  assert.ok(ui.includes('id="'+id+'"'),"Missing "+id);
  assert.equal((ui.match(new RegExp('id="'+id+'"',"g"))||[]).length,1,"Duplicate "+id);
 }
 assert.match(ui,/data-floriculture-redesign="2026-11-17"/);
 assert.match(ui,/className="pn-floral3-header"/);
 assert.match(ui,/className="pn-floral3-footer"/);
});
test("Editorial hero and six expandable gallery photos with keyboard navigation",()=>{
 assert.match(ui,/className="pn-floral3-hero-image"/);
 assert.match(ui,/const gallery=Array.from\(\{length:6\}/);
 assert.match(ui,/onClick=\{\(\)=>setLightbox\(i\)\}/);
 assert.match(ui,/role="dialog" aria-modal="true"/);
 for(const key of ["Escape","ArrowRight","ArrowLeft"])assert.ok(ui.includes('event.key==="'+key+'"'));
 assert.match(css,/\.pn-floral3-gallery\{display:grid;grid-template-columns:1fr 1fr 1fr/);
});
test("Four differentiators, three photographed steps, six testimonial slots in desktop 3x2",()=>{
 assert.match(ui,/const values=\[/);
 assert.match(ui,/const journey=\[/);
 assert.match(ui,/Array.from\(\{length:6\}/);
 assert.match(ui,/EXEMPLO FICTÍCIO · NÃO É CLIENTE REAL/);
 assert.match(ui,/reviews\.filter/);
 assert.match(css,/\.pn-floral3-testimonial-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
test("Six functional FAQ items and keyboard-accessible mobile navigation",()=>{
 const faq=ui.split("const faqs=[")[1]?.split("] as const;")[0]||"";
 assert.equal((faq.match(/\["(?:Como|Posso|Vocês) /g)||[]).length,6);
 assert.match(ui,/<details key=\{q\}/);
 assert.match(ui,/aria-expanded=\{menu\}/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test("Contact has name, phone, occasion and message, only real configured channels",()=>{
 for(const n of ["pn-floral3-name","pn-floral3-phone","pn-floral3-occasion","pn-floral3-message"])assert.ok(ui.includes(n));
 assert.match(ui,/const canContact=canWhats\|\|canMail/);
 assert.match(ui,/disabled=\{!canContact\}/);
 assert.match(ui,/https:\/\/wa\.me\//);
 assert.match(ui,/mailto:/);
 assert.match(ui,/onSubmit=\{goContact\}/);
});
test("Newsletter requires HTTPS backend and never fakes success",()=>{
 assert.match(ui,/const newsletterActive=!!newsletterEndpoint&&\/\^https:/);
 assert.match(ui,/!response\.ok/);
 assert.match(ui,/disabled=\{!newsletterActive\|\|subscription==="sending"\}/);
 assert.match(ui,/A inscrição será habilitada após configurar uma integração real/);
});
test("Real map, labelled fictional address, configured WhatsApp displayed underneath",()=>{
 assert.match(ui,/openstreetmap\.org\/export\/embed\.html/);
 assert.match(ui,/maps\.google\.com\/maps\?q/);
 assert.match(ui,/ENDEREÇO FICTÍCIO · LOCALIZAÇÃO ILUSTRATIVA/);
 assert.match(ui,/<iframe/);
 assert.ok(ui.indexOf("{displayedAddress}")<ui.indexOf("FALAR NO WHATSAPP"));
 assert.match(ui,/canWhats\?<a/);
});
test("Existing TP6 editing bridge is read, without modifying Universal Editor",()=>{
 for(const token of ["edits?.historyTitle","edits?.collectionBackground","edits?.collectionHeadingColor","edits?.firstCollectionCard?.title","edits?.addedSections"])assert.ok(ui.includes(token));
 assert.match(ui,/TP6RetailCustomSections sections=\{edits\?\.addedSections\}/);
 assert.doesNotMatch(css,/\.pn-floral1-|\.pn-floral2-|\.tp6m3-/);
});
test("New design and renderer parse as valid TSX",()=>{
 for(const [name,source] of [["floral-model3",ui],["site",route]]){
  const ast=ts.createSourceFile(name+".tsx",source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(ast.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[],name);
 }
});

test("Approved visual revision: 3 sections only, split hero and clear cards",()=>{
 assert.match(ui,/const heroHeadline=/);
 assert.match(ui,/className="pn-floral3-hero-visual"/);
 assert.match(ui,/className="pn-floral3-hero-divider"/);
 assert.doesNotMatch(ui,/className="pn-floral3-hero-overlay"/);
 assert.match(ui,/className="pn-floral3-value-top"/);
 assert.match(ui,/className="pn-floral3-value-copy"/);
 assert.match(ui,/className="pn-floral3-journey-copy"/);
 for(const label of ["Escolha seu estilo","Conte sua ideia","Finalize os detalhes"])assert.ok(ui.includes(label));
 assert.match(css,/\.pn-floral3 \.pn-floral3-hero\{display:grid;grid-template-columns:/);
 assert.match(css,/\.pn-floral3 \.pn-floral3-values-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.pn-floral3 \.pn-floral3-journey-copy\{/);
 assert.match(css,/@media\(max-width:520px\)/);
});
