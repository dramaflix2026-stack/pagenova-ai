#!/usr/bin/env node
// Read-only audit of the Estático 03 family registry. Run: node scripts/audit-briefing-families.mjs
import fs from "node:fs";
import path from "node:path";
const source=fs.readFileSync(path.join(process.cwd(),"frontend/src/lib/briefing-template-families.ts"),"utf8");
const section=source.slice(source.indexOf("BRIEFING_TEMPLATE_FAMILIES"),source.indexOf("] as const;")+11);
const matches=[...section.matchAll(/(?:"id"|\bid):\s*(\d+)[\s\S]*?(?:"niches"|\bniches):\s*\[([\s\S]*?)\]/g)];
const families=matches.map(m=>({id:Number(m[1]),niches:[...m[2].matchAll(/"([^"]+)"/g)].map(x=>x[1])}));
const expected=[10,15,14,16,15,15,12,12,12,12];
const issues=[];
if(families.length!==10)issues.push("Expected 10 template families; got "+families.length);
const normalize=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const seen=new Map();
for(const [i,f] of families.entries()){
 if(f.id!==i+1)issues.push("Family ID mismatch at index "+i);
 if(f.niches.length!==expected[i])issues.push("TP"+f.id+": expected "+expected[i]+" niches; got "+f.niches.length);
 for(const niche of f.niches){
  const key=normalize(niche);
  if(seen.has(key))issues.push("Duplicate niche: "+niche+" (TP"+seen.get(key)+" and TP"+f.id+")");
  seen.set(key,f.id);
 }
}
if(seen.size!==133)issues.push("Expected 133 unique niches; got "+seen.size);
for(let id=6;id<=10;id++){
 if(!source.includes('return '+id+';'))issues.push('No explicit fallback return for TP'+id);
}
console.log(JSON.stringify({families:families.map(f=>({tp:f.id,niches:f.niches.length})),uniqueNiches:seen.size,issues},null,2));
if(issues.length)process.exitCode=1;
