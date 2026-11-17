import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const ui=read("../src/components/builder-v2-floriculture-model1.tsx");
const css=read("../src/components/builder-v2-floriculture-model1.css");
const router=read("../src/components/builder-v2-site.tsx");
const photoSource=read("../src/lib/tp6-model2-internet-photos.ts");
const freeze=JSON.parse(read("../quality/approved-templates-baseline.json"));

test("Floricultura Model 01 renders approved twelve-part editorial hierarchy",()=>{
 for(const name of ["pn-floral1-head","pn-floral1-hero","pn-floral1-collections","pn-floral1-about","pn-floral1-benefits","pn-floral1-gallery","pn-floral1-reviews","pn-floral1-process","pn-floral1-faq","pn-floral1-cta","pn-floral1-contact","pn-floral1-location","pn-floral1-footer"]){
  assert.ok(ui.includes(name),name);
 }
 const anchors=["inicio","produtos","colecao","sobre","diferenciais","galeria","depoimentos","como-comprar","perguntas-frequentes","contato","localizacao","rodape"];
 for(const anchor of anchors)assert.ok(ui.includes('id="'+anchor+'"'),"missing #"+anchor);
 assert.match(ui,/heroTitle/);
 assert.match(ui,/heroImage/);
 assert.match(ui,/edits\?\.historyTitle/);
 assert.match(ui,/edits\?\.collectionBackground/);
 assert.match(ui,/edits\?\.firstCollectionCard/);
 assert.match(ui,/TP6RetailCustomSections sections=\{edits\?\.addedSections\}/);
});
test("Six photographic, labelled testimonials in 3x2 desktop layout",()=>{
 assert.match(ui,/Array\.from\(\{length:6\}/);
 assert.match(ui,/pn-floral1-reviews-grid/);
 assert.match(ui,/EXEMPLO FICTÍCIO · NÃO É CLIENTE REAL/);
 assert.match(ui,/Retrato ilustrativo, não representa um cliente real/);
 assert.match(css,/\.pn-floral1-reviews-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:860px\)/);
 assert.match(css,/\.pn-floral1-reviews-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.pn-floral1-reviews-grid\{grid-template-columns:1fr\}/);
 assert.ok(ui.includes("Juliana Santos"),"sixth review must not be a pet-shop sample");
});
test("Forms and location never fake WhatsApp or email submission",()=>{
 assert.match(ui,/canContact=hasWhats\|\|hasMail/);
 assert.match(ui,/onSubmit=\{send\}/);
 assert.match(ui,/disabled=\{!canContact\}/);
 assert.match(ui,/https:\/\/wa\.me\//);
 assert.match(ui,/mailto:/);
 assert.match(ui,/window\.open/);
 assert.match(ui,/ENDEREÇO FICTÍCIO · DEMONSTRAÇÃO/);
 assert.match(ui,/openstreetmap\.org\/export\/embed\.html/);
 assert.match(ui,/<iframe/);
 assert.match(ui,/pn-floral1-no-whatsapp/);
 assert.ok(ui.indexOf("pn-floral1-location-card")<ui.indexOf("pn-floral1-footer"),"map before footer");
});
test("Gallery really opens six photos, faq expands and mobile menu works",()=>{
 assert.match(ui,/Array\.from\(\{length:6\}/);
 assert.match(ui,/setLightbox\(i\)/);
 assert.match(ui,/role="dialog" aria-modal="true"/);
 assert.match(ui,/event\.key==="Escape"/);
 assert.match(ui,/aria-expanded=\{faqOpen===i\}/);
 assert.match(ui,/aria-expanded=\{menuOpen\}/);
 assert.match(css,/\.pn-floral1-mosaic\{display:grid/);
 assert.match(css,/\.pn-floral1-collection-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:590px\)/);
 assert.match(css,/\.pn-floral1-collection-grid\{grid-template-columns:1fr/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test("Only TP6 Floricultura Model 01 opts in; models 02/03 remain their original components",()=>{
 assert.match(router,/if\(variant==="03"\)/);
 assert.match(router,/if\(variant==="02"\)/);
 assert.match(router,/if\(variant==="01"&&retailNiche==="Floricultura"\)/);
 assert.match(router,/TP6FloricultureModel1/);
 assert.ok(router.indexOf('if(variant==="01"&&retailNiche==="Floricultura")')>router.indexOf('if(variant==="02")'));
 for(const original of ["Template6RetailHero","Template6RetailCollection","Template6RetailStory","BuilderV2TP6Model2Hero","BuilderV2TP6Model3Hero"])assert.ok(router.includes(original));
 const entry=freeze.protectedFiles.find(x=>x.path==="src/components/builder-v2-site.tsx");
 assert.match(entry.approvedBindingRevision.reason,/Explicit user approval/);
 assert.equal(freeze.protectedFileCount,162);
});
test("Uses actual florist photo pool rather than unrelated niche images",()=>{
 const ids=photoSource.match(/"Floricultura": \[([\s\S]*?)\n  \]/)?.[1];
 assert.ok(ids);
 assert.ok((ids.match(/"[0-9]{13}-[a-z0-9]+"/g)||[]).length>=6);
 assert.match(ui,/images\.filter\(safePhoto\)/);
});
test("Dedicated components parse as TSX",()=>{
 for(const [name,source] of [["floriculture",ui],["site",router]]){
  const parsed=ts.createSourceFile(name+".tsx",source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[],name);
 }
});

test("Collection captions have dedicated padding, readable typography and a non-overlapping arrow",()=>{
 assert.match(css,/\.pn-floral1-collection-card\{display:flex;flex-direction:column;min-width:0;overflow:hidden/);
 assert.match(css,/\.pn-floral1-collection-name\{position:relative;display:block;flex:1 1 auto;min-width:0;min-height:151px;padding:24px 28px 29px/);
 assert.match(css,/\.pn-floral1-collection-name>div\{min-width:0;padding-right:20px/);
 assert.match(css,/\.pn-floral1-collection-name h3\{font:400 clamp\(21px,1\.75vw,27px\)/);
 assert.match(css,/\.pn-floral1-collection-name h3\{[^}]*word-break:normal;hyphens:none/);
 assert.match(css,/\.pn-floral1-collection-name p\{color:#5e6d62;font-size:13px;line-height:1\.7/);
 assert.match(css,/\.pn-floral1-collection-name>strong\{position:absolute;top:25px;right:22px/);
 assert.match(css,/@media\(max-width:860px\)\{[\s\S]*\.pn-floral1-collection-name\{min-height:158px;padding:22px 18px 24px\}/);
 assert.match(css,/@media\(max-width:590px\)\{[\s\S]*\.pn-floral1-collection-name\{min-height:133px;padding:23px 22px 26px\}/);
 assert.match(css,/\.pn-floral1-footer-wordmark,\.pn-floral1-wordmark\{font-size:clamp\(42px,6vw,98px\)/);
 assert.match(css,/\.pn-floral1-wordmark\{font-size:clamp\(36px,8\.2vw,58px\)/);
 assert.ok(!css.includes(".tp6m2-")&&!css.includes(".tp6m3-"),"no CSS changes to protected models 02 or 03");
});
