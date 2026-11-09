import test from "node:test";
import {createHash} from "node:crypto";
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
test("model 1 has improved hero, six-card gallery, six dental testimonials and working location surface",()=>{
 const s=models[0];
 assert.match(s,/src=\{media\(0\)\}/);
 assert.match(s,/\[2,3,4,5,6,7\]\.map/);
 assert.match(s,/DentalTestimonials site=\{site\} publishedMode=\{publishedMode\}/);
 assert.match(s,/DentalLocation site=\{site\}/);
 assert.match(s,/DentalPremiumFooter site=\{site\} variant="01"/);
 assert.match(s,/id="dental-gallery"/);
 assert.match(s,/id="dental-contact"/);
});
test("model 2 has isolated hero, four team photos, animated counters, six reviews, map and premium footer",()=>{
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


test("dental footers put brand on full-width row and collapse based on actual container width, including desktop preview iframe",()=>{
 const start=shared.indexOf('export function DentalPremiumFooter(');
 const body=shared.slice(start);
 assert.match(body,/pn-dental-footer-main"><div className="pn-dental-footer-intro"/);
 assert.match(body,/pn-dental-footer-links/);
 assert.match(css,/\.pn-dental-footer\s*\{container-type:inline-size;container-name:pnDentalFooter/);
 assert.match(css,/\.pn-dental-footer \.pn-dental-footer-main>\.pn-dental-footer-intro/);
 assert.match(css,/\.pn-dental-footer \.pn-dental-footer-main>\.pn-dental-footer-links/);
 assert.match(css,/@container pnDentalFooter \(max-width:610px\)/);
 assert.match(css,/word-break:normal!important;overflow-wrap:break-word!important/);
 assert.match(css,/grid-template-columns:1fr!important/);
 assert.doesNotMatch(css,/\.pn-dental-footer-intro h2\{[^}]*word-break:break-all/);
});
test("dental KPIs use clinic-related animated examples only in preview and placeholders on published sites",()=>{
 for(const label of ["Atendimentos realizados","Anos de experiência","Profissionais na equipe","Satisfação dos pacientes"])assert.match(shared,new RegExp(label));
 for(const v of ["target:1250","target:8","target:4","target:98"])assert.ok(shared.includes(v),v);
 assert.doesNotMatch(shared,/Especialidades ilustrativas|Fotografias na seção ambientes|Espaços preparados para avaliações/);
 assert.match(shared,/publishedMode\?<strong className="pn-dental-kpi-empty"/);
 assert.match(shared,/SIMULAÇÃO PARA PERSONALIZAÇÃO/);
 assert.match(shared,/data-dental-kpis=\{publishedMode\?"pending":"preview-examples"\}/);
 assert.match(models[1],/DentalMetrics site=\{site\} model="02" publishedMode=\{publishedMode\}/);
 assert.match(models[2],/DentalMetrics site=\{site\} model="03" publishedMode=\{publishedMode\}/);
 assert.match(css,/pn-dental-kpi-status/);
});


test("global PageNova footer grid is explicitly neutralized at the shell level for all TP4 dental variants",()=>{
 const globals=read("src/app/globals.css");
 const shellScope="body footer.pn-dental-footer > div.pn-dental-footer-inner:first-child";
 const olderScope="body footer > div:first-child";
 assert.ok(globals.includes(olderScope),"The legacy universal footer rule is missing; inspect contract before changing this test.");
 const start=globals.indexOf(shellScope+" {");
 assert.ok(start>globals.indexOf(olderScope),"Specific dental override must be declared after the old global rule.");
 const end=globals.indexOf("}",start);
 const declaration=globals.slice(start,end);
 assert.match(declaration,/display:block\s*!important/);
 assert.match(declaration,/grid-template-columns:none\s*!important/);
 assert.match(declaration,/grid-template-rows:none\s*!important/);
 assert.match(declaration,/width:100%\s*!important/);
 assert.match(declaration,/max-width:1280px\s*!important/);
 assert.match(globals,/body footer\.pn-dental-footer\s*\{[\s\S]*?padding:0\s*!important/);
 assert.match(globals,/body footer\.pn-dental-footer \.pn-dental-footer-intro h2[\s\S]*?word-break:normal\s*!important/);
 // Regress all 3 variants, which use exactly this shell via the shared footer.
 for(const [i,m] of models.entries()){
   assert.ok(m.includes('DentalPremiumFooter site={site} variant="'+String(i+1).padStart(2,"0")+'"'));
 }
});


test("all three dental models show six named illustrated testimonial cards in preview without publishing fictional endorsements",()=>{
 const start=shared.indexOf("const demoProfiles=[");
 const end=shared.indexOf("];",start);
 const demo=shared.slice(start,end);
 const names=["Mariana Oliveira","Rafael Martins","Camila Rodrigues","Lucas Ferreira","Beatriz Almeida","Fernanda Costa"];
 assert.equal((demo.match(/\{name:/g)||[]).length,6,"Exactly six demo profiles, with portraits and dentistry-specific explanatory text");
 for(const name of names)assert.ok(demo.includes(name));
 assert.match(shared,/rows\.slice\(0,6\)/);
 assert.match(shared,/examples=!publishedMode&&verified\.length===0/);
 assert.match(shared,/FOTOS E RELATOS ILUSTRATIVOS/);
 for(const m of models)assert.match(m,/DentalTestimonials site=\{site\} publishedMode=\{publishedMode\}/);
});
test("model 2 KPI layout uses full-width grid and contains large digits without collision",()=>{
 assert.match(css,/\.tp4m2 \.tp4m2-numbers:has\(> \.pn-dental-kpis\)\s*\{[^}]*display:block!important/);
 assert.match(css,/\.tp4m2 \.tp4m2-numbers>\.pn-dental-kpis\s*\{[^}]*width:100%!important/);
 assert.match(css,/\.tp4m2 \.tp4m2-numbers \.pn-dental-kpi-grid\s*\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/\.tp4m2 \.tp4m2-numbers \.pn-dental-animated-num[\s\S]*?font-size:clamp\(28px,3\.3vw,54px\)!important/);
 assert.match(css,/@media\(max-width:1000px\)\s*\{\s*\.tp4m2 \.tp4m2-numbers \.pn-dental-kpi-grid\s*\{\s*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
test("model 2 team gallery keeps all image captions inside their own photo tiles and disclaimer below",()=>{
 assert.match(css,/\.tp4m2 \.pn-dental-team-photo-grid figure\s*\{[^}]*position:relative/);
 assert.match(css,/\.tp4m2 \.pn-dental-team-photo-grid figcaption\s*\{[^}]*position:absolute/);
 assert.match(css,/\.tp4m2 \.pn-dental-team-photo-grid figcaption\s*\{[^}]*bottom:10px/);
 assert.match(css,/\.tp4m2 \.tp4m2-team>p\.tp4m2-disclaimer\s*\{[^}]*clear:both/);
 assert.match(shared,/TP4_DENTAL_TEAM_IMAGES\.map/);
});


test("2026-11-09 approved dental models 1/2/3 are FROZEN at exact Git blob hashes",()=>{
 const lock=JSON.parse(read("config/tp4-odontologia-approved-lock.json"));
 assert.equal(lock.lock_id,"TP4_ODONTO_APROVADO_2026_11_09");
 assert.equal(lock.status,"frozen");
 assert.equal(Object.keys(lock.files).length,6);
 for(const [filename,approvedSha] of Object.entries(lock.files)){
  const bytes=readFileSync(resolve(root,filename));
  const gitSha=createHash("sha1").update("blob "+bytes.length+"\0").update(bytes).digest("hex");
  assert.equal(gitSha,approvedSha,
   filename+" deviated from USER-APPROVED dentistry design. Revert the change, or request explicit re-approval and update the freeze baseline.");
 }
});
