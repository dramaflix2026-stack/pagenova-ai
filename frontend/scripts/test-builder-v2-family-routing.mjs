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
 assert.equal(new Set(all.map(n=>n.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase())).size,all.length);
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
