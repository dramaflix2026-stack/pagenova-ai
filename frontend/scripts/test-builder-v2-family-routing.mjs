import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {BRIEFING_TEMPLATE_FAMILIES,resolveBriefingFamily} from "../src/lib/briefing-template-families.ts";

const families=BRIEFING_TEMPLATE_FAMILIES;
const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
test("ten families with unique ids and niches",()=>{
 assert.equal(families.length,10);
 assert.deepEqual(families.map(f=>f.id),[1,2,3,4,5,6,7,8,9,10]);
 const all=families.flatMap(f=>f.niches);
 assert.equal(new Set(all.map(n=>n.normalize("NFD").replace(/\p{M}/gu,"").toLowerCase())).size,all.length);
 console.log("Registered niches:",all.length,"(commercial target: 133; reconcile separately)");
});
test("every registered niche resolves to its own family",()=>{
 for(const family of families)for(const niche of family.niches)
  assert.equal(resolveBriefingFamily(niche),family.id,`${niche} should route to TP${family.id}`);
});
test("parent model selector exposes all three variants",()=>{
 assert.match(page,/\(\["01","02","03"\] as const\)\.map/);
 assert.match(page,/Modelo \{Number\(v\)\}/);
});
test("creation persists recognized family niche",()=>{
 assert.match(page,/detectedFamily\?BRIEFING_TEMPLATE_FAMILIES\.find/);
 assert.match(page,/briefingLayoutVariant:site\.briefingLayoutVariant\|\|"01"/);
});

test("TP2 TP3 TP4 follow the parent model selection",()=>{const renderer=readFileSync(new URL("../src/components/builder-v2-site.tsx",import.meta.url),"utf8");for(const n of [2,3,4]){const section=renderer.split(`function TP${n}LayoutChooser`)[1]?.split("function ")[0]||"";assert.match(section,/useEffect\(\(\)=>\{setVariant\(site\.briefingLayoutVariant/);}});

test("TP2 models render three distinct components without legacy fallback",()=>{const renderer=readFileSync(new URL("../src/components/builder-v2-site.tsx",import.meta.url),"utf8");const section=renderer.split("function TP2LayoutChooser")[1].split("function TP3LayoutChooser")[0];for(const name of ["BuilderV2TP2Model1","BuilderV2TP2Model2","BuilderV2TP2Model3"])assert.ok(section.includes("<"+name+" site={site}/>"),name);assert.ok(!section.includes("<BuilderV2ClassicSite"),"TP2 cannot silently render legacy template");});
