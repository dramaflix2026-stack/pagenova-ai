import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const ui=read("../src/components/builder-v2-floriculture-model2.tsx");
const css=read("../src/components/builder-v2-floriculture-model2.css");
const site=read("../src/components/builder-v2-site.tsx");
const model1=read("../src/components/builder-v2-floriculture-model1.tsx");
const manifest=JSON.parse(read("../quality/approved-templates-baseline.json"));

test("Floricultura M2 preserves all twelve approved visual sections",()=>{
 const sections=["pn-floral2-header","pn-floral2-hero","pn-floral2-collections","pn-floral2-difference","pn-floral2-gallery","pn-floral2-process","pn-floral2-testimonials","pn-floral2-faq","pn-floral2-contact","pn-floral2-newsletter","pn-floral2-location","pn-floral2-about","pn-floral2-footer"];
 for(const s of sections)assert.ok(ui.includes(s),"Missing "+s);
 const anchors=["inicio","colecoes","diferenciais","galeria","como-comprar","depoimentos","perguntas-frequentes","contato","newsletter","localizacao","sobre","rodape"];
 for(const a of anchors)assert.ok(ui.includes('id="'+a+'"'),"Missing #"+a);
});
test("Floricultura M2 only is opted-in, all generic and approved M1/M3 branches remain",()=>{
 assert.match(site,/import \{ TP6FloricultureModel2 \} from "@\/components\/builder-v2-floriculture-model2"/);
 assert.match(site,/if\(variant==="02"\)\{[\s\S]*?if\(retailNiche==="Floricultura"\)\{[\s\S]*?return <TP6FloricultureModel2/);
 assert.match(site,/if\(variant==="01"&&retailNiche==="Floricultura"\)/);
 assert.match(site,/if\(variant==="03"\)/);
 assert.match(site,/BuilderV2TP6Model2Hero/);
 assert.match(site,/BuilderV2TP6Model3Hero/);
 assert.match(site,/return <TP6FloricultureModel1/);
 assert.match(model1,/export function TP6FloricultureModel1/);
 const route=manifest.protectedFiles.find(e=>e.path==="src/components/builder-v2-site.tsx");
 assert.match(route.approvedBindingRevision.reason,/Explicit user approval 2026-11-17/);
 assert.equal(manifest.protectedFileCount,162);
});
test("Six enlarged floral gallery photographs and working keyboard lightbox",()=>{
 assert.match(ui,/Array\.from\(\{length:6\}/);
 assert.match(ui,/setLightbox\(i\)/);
 assert.match(ui,/role="dialog" aria-modal="true"/);
 assert.match(ui,/e\.key==="Escape"/);
 assert.match(ui,/e\.key==="ArrowRight"/);
 assert.match(ui,/e\.key==="ArrowLeft"/);
 assert.match(css,/\.pn-floral2-mosaic\{display:grid/);
});
test("Six clearly disclosed testimonials in 3 by 2 desktop grid",()=>{
 assert.equal((ui.match(/"EXEMPLO FICTÍCIO · NÃO É CLIENTE REAL"/g)||[]).length,1);
 assert.match(ui,/testimonialRows=Array\.from\(\{length:6\}/);
 assert.match(ui,/Foto de depoimento cadastrado/);
 assert.match(ui,/retratos?/i);
 assert.match(css,/\.pn-floral2-testimonial-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/\.pn-floral2-testimonial-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.pn-floral2-process-grid,\.pn-floral2-testimonial-grid\{grid-template-columns:1fr\}/);
});
test("Three photographed steps and four niche-specific benefits, no generic retail copy",()=>{
 assert.match(ui,/const process=\[/);
 assert.match(ui,/const features=\[/);
 assert.match(ui,/Flores selecionadas/);
 assert.match(ui,/Criação artesanal/);
 assert.match(ui,/Entrega planejada/);
 assert.match(ui,/pn-floral2-process-grid/);
 assert.ok(!ui.includes("Praticidade")&&!ui.includes("Seleção de eletrônicos"));
});
test("Six functional FAQ entries and a mobile hamburger",()=>{
 assert.match(ui,/const FAQs=\[/);
 const faqSource=ui.split("const FAQs=[")[1]?.split("] as const;")[0]||"";
 assert.equal((faqSource.match(/\["(?:Como|Vocês|Quais|Posso) /g)||[]).length,6);
 assert.match(ui,/aria-expanded=\{faqOpen===i\}/);
 assert.match(ui,/setFaqOpen\(faqOpen===i\?null:i\)/);
 assert.match(ui,/aria-expanded=\{menuOpen\}/);
 assert.match(css,/@media\(max-width:860px\)/);
 assert.match(css,/@media\(max-width:590px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test("Contact only opens registered WhatsApp/email and contains name phone occasion message",()=>{
 for(const v of ["pn-floral2-name","pn-floral2-phone","pn-floral2-occasion","pn-floral2-message"])assert.ok(ui.includes(v));
 assert.match(ui,/canContact=canWhats\|\|canMail/);
 assert.match(ui,/disabled=\{!canContact\}/);
 assert.match(ui,/https:\/\/wa\.me\//);
 assert.match(ui,/mailto:/);
 assert.match(ui,/onSubmit=\{submitContact\}/);
});
test("Newsletter can only submit to configured HTTPS integration, never fake success",()=>{
 assert.match(ui,/newsletterActive=!!newsletterEndpoint&&\/\^https:/);
 assert.match(ui,/if\(!newsletterActive\|\|!validEmail\(subscriber\)/);
 assert.match(ui,/if\(!response\.ok\)throw new Error/);
 assert.match(ui,/disabled=\{!newsletterActive\|\|newsletterState==="saving"\}/);
 assert.match(ui,/A inscrição estará disponível somente após configuração de uma integração real/);
});
test("Map is live, fictitious address is labelled and WhatsApp sits below address",()=>{
 assert.match(ui,/openstreetmap\.org\/export\/embed\.html/);
 assert.match(ui,/maps\.google\.com\/maps\?q/);
 assert.match(ui,/ENDEREÇO FICTÍCIO · DEMONSTRAÇÃO/);
 assert.match(ui,/<iframe/);
 assert.ok(ui.indexOf("{shownAddress}")<ui.indexOf("Conversar pelo WhatsApp"),"WhatsApp below address");
 assert.match(ui,/canWhats\?<a/);
});
test("Rodapé shows brand once and captions avoid tight overflow",()=>{
 assert.ok(!ui.includes("pn-floral2-wordmark"));
 assert.equal((ui.match(/className="pn-floral2-footer-brand"/g)||[]).length,1);
 assert.match(css,/\.pn-floral2-footer-brand\{font-size:clamp\(29px,3\.6vw,49px\)/);
 assert.match(css,/\.pn-floral2-collection-caption>div\{min-width:0;flex:1;overflow-wrap:normal;word-break:normal\}/);
 assert.match(css,/\.pn-floral2-collection-caption h3\{[^}]*hyphens:none/);
});
test("Compatibilidade do Editor Universal e memórias preservada",()=>{
 assert.match(ui,/edits\?\.collectionBackground/);
 assert.match(ui,/edits\?\.collectionHeadingColor/);
 assert.match(ui,/edits\?\.firstCollectionCard\?\.title/);
 assert.match(ui,/edits\?\.historyTitle/);
 assert.match(ui,/TP6RetailCustomSections sections=\{edits\?\.addedSections\}/);
 assert.doesNotMatch(css,/\.pn-floral1-|\.tp6m3-/);
});
test("New component and shared renderer parse as valid TSX",()=>{
 for(const [name,source] of [["floral-model2",ui],["renderer",site]]){
  const ast=ts.createSourceFile(name+".tsx",source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(ast.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[],name);
 }
});
