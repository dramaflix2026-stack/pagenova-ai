import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {BRIEFING_TEMPLATE_FAMILIES,resolveBriefingFamily,isDentalNicheIdentity,isPhysioNicheIdentity} from "../src/lib/briefing-template-families.ts";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=filename=>readFileSync(path.join(root,filename),"utf8");
const fixture=read("src/app/qa-preview/builder-v2/page.tsx");
const proxy=read("src/proxy.ts");
const runner=read("scripts/audit-builder-v2-visual.mjs");
const commands=JSON.parse(read("package.json")).scripts;

test("quality matrix lists all registered niche/variant combinations",()=>{
  const niches=BRIEFING_TEMPLATE_FAMILIES.flatMap(f=>f.niches.map(niche=>({niche,family:f.id})));
  assert.equal(BRIEFING_TEMPLATE_FAMILIES.length,10);
  assert.ok(niches.length>=140,"all registered niches including veterinary healthcare must be included in automated QA");
  assert.equal(new Set(niches.map(x=>x.niche.toLowerCase())).size,niches.length,"no duplicate niche");
  // Odontologia estética remains listed in the original 140-niche catalog,\n  // but all dentistry briefings now deliberately route to approved TP4.\n  for(const {niche,family} of niches)assert.equal(resolveBriefingFamily(niche),isDentalNicheIdentity(niche)||isPhysioNicheIdentity(niche)?4:family,niche);
  assert.equal(niches.length*3,420,"every registered niche has 3 models");
  assert.equal(niches.length*3*2,840,"mobile and desktop matrix is complete");
});

test("the QA fixture calls the production BuilderV2Site component with selectable variants",()=>{
  assert.match(fixture,/import \{BuilderV2Site,type BuilderV2SiteData\}/);
  assert.match(fixture,/templateId:"prompt-adaptive"/);
  assert.match(fixture,/briefingLayoutVariant:model/);
  assert.match(fixture,/niches\.some/);
  assert.match(fixture,/data-qa-builder-v2="true"/);
  assert.match(fixture,/publishedMode=\{false\}/);
  assert.doesNotMatch(fixture,/from\s+["\x27][^"\x27]*(?:supabase|crm)/i);
  assert.doesNotMatch(fixture,/process\.env\.(?:OPENAI_API_KEY|SUPABASE)/);
});

test("QA pages never expose data in Production, Preview or remote hosts",()=>{
  assert.match(fixture,/process\.env\.NODE_ENV!=="development"\)notFound\(\)/);
  assert.match(proxy,/pathname\.startsWith\("\/qa-preview\/"\)/);
  assert.match(proxy,/process\.env\.NODE_ENV!=="development"/);
  assert.match(proxy,/host!=="localhost"&&host!=="127\.0\.0\.1"/);
  assert.match(proxy,/new NextResponse\("Not found",\{status:404\}\)/);
});

test("screenshot runner covers mobile, desktop and missing-image/layout failures",()=>{
  assert.match(runner,/const models=\["01","02","03"\]/);
  assert.match(runner,/const screens=\[/);
  assert.match(runner,/390,height:844/);
  assert.match(runner,/1440,height:900/);
  assert.match(runner,/full=args\.includes\("--full"\)/);
  assert.match(runner,/playwright-core/);
  assert.match(runner,/page\.screenshot/);
  assert.match(runner,/broken:\[/);
  assert.match(runner,/Horizontal overflow/);
  assert.match(runner,/report\.json/);
  assert.match(runner,/index\.html/);
  assert.match(runner,/Bakery photo used in Japanese restaurant/);
  assert.match(commands["qa:visual:all"],/--full/);
  assert.match(commands["qa:visual:strict"],/--strict/);
});

test("language school keeps six clearly fictional demo cards in preview and publication",()=>{
 const component=read("src/components/tp10-language-testimonials.tsx");
 const m1=read("src/components/template10-education-experience.tsx");
 const m2=read("src/components/builder-v2-tp10-model2.tsx");
 const m3=read("src/components/builder-v2-tp10-model3.tsx");
 const hero=read("src/components/template10-education-hero.tsx");
 const router=read("src/components/builder-v2-site.tsx");
 assert.equal((component.match(/\{name:"/g)||[]).length,6,"six distinct illustrative entries");
 assert.match(component,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,"three columns on desktop");
 assert.match(component,/@media\(max-width:900px\).*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,"two columns on tablet");
 assert.match(component,/@media\(max-width:560px\).*grid-template-columns:1fr/,"one column on mobile");
 assert.match(component,/const demoCount=Math\.max\(0,6-actual\.length\)/,"preserve six cards in preview and publication");
 assert.match(component,/DEMONSTRAÇÃO FICTÍCIA/,"published site must identify fictional examples prominently");
 assert.match(component,/Exemplo fictício · Não é aluno real/,"clear demonstration label");
 assert.match(m1,/isLanguageSchool\(niche,brand\)\?<TP10LanguageTestimonials variant="01"/);
 assert.match(m2,/isLanguageSchool\(niche,brand\)\?<TP10LanguageTestimonials variant="02"/);
 assert.match(m3,/isLanguageSchool\(niche,brand\)\?<TP10LanguageTestimonials variant="03"/);
 assert.match(hero,/Template10EducationExperience niche=\{niche\} brand=\{brand\} testimonials=\{testimonials\} publishedMode=\{publishedMode\}/);
 for(const tag of ["BuilderV2TP10Model2","BuilderV2TP10Model3","Template10EducationHero"]){
  assert.ok(router.includes("<"+tag+" brand={cleanBrand} publishedMode={props.publishedMode}"));
 }
});

test("all three language school footers are restrained and scoped to that niche",()=>{
 const m1=read("src/components/template10-education-final.tsx");
 const m2=read("src/components/builder-v2-tp10-model2.tsx");
 const m3=read("src/components/builder-v2-tp10-model3.tsx");
 assert.match(m1,/pn-t10-final-footer--language/);
 assert.match(m1,/isLanguageSchool\(niche,brand\)/);
 assert.match(m2,/tp10m2\[data-tp10-languages="true"\] \.footer h2/);
 assert.match(m3,/tp10m3\[data-tp10-languages="true"\] \.footer h2/);
 assert.match(m3,/tp10m3\[data-tp10-languages="true"\] \.contact \.contactGrid>div>p\{color:#272129;opacity:1\}/);
 assert.match(m2,/href="#tp10m2-reviews"/);
 assert.match(m3,/href="#tp10m3-reviews"/);
 assert.match(m2,/footerBottom\{margin-top:0/);
 assert.match(m3,/footerBottom\{position:relative;z-index:1;margin-top:0/);
});
