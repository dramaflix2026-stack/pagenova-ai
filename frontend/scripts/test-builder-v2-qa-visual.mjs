import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {BRIEFING_TEMPLATE_FAMILIES,resolveBriefingFamily} from "../src/lib/briefing-template-families.ts";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=filename=>readFileSync(path.join(root,filename),"utf8");
const fixture=read("src/app/qa-preview/builder-v2/page.tsx");
const proxy=read("src/proxy.ts");
const runner=read("scripts/audit-builder-v2-visual.mjs");
const commands=JSON.parse(read("package.json")).scripts;

test("quality matrix lists all registered niche/variant combinations",()=>{
  const niches=BRIEFING_TEMPLATE_FAMILIES.flatMap(f=>f.niches.map(niche=>({niche,family:f.id})));
  assert.equal(BRIEFING_TEMPLATE_FAMILIES.length,10);
  assert.ok(niches.length>=139,"all registered niches must be included in automated QA");
  assert.equal(new Set(niches.map(x=>x.niche.toLowerCase())).size,niches.length,"no duplicate niche");
  for(const {niche,family} of niches)assert.equal(resolveBriefingFamily(niche),family);
  assert.equal(niches.length*3,417,"every registered niche has 3 models");
  assert.equal(niches.length*3*2,834,"mobile and desktop matrix is complete");
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
