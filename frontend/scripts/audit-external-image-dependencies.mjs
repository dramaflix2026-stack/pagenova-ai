#!/usr/bin/env node
/**
 * Inventory external image dependencies across frontend source.
 * Run from frontend/: node scripts/audit-external-image-dependencies.mjs
 * No network calls or modifications to approved templates.
 */
import {readdirSync,readFileSync} from "node:fs";
import {join,relative} from "node:path";
const root=join(process.cwd(),"src");
const extensions=/\.(?:tsx?|jsx?|json|css)$/;
const imageHosts=/https?:\/\/(?:images\.unsplash\.com|unsplash\.com|images\.pexels\.com|images\.pixabay\.com|cdn\.pixabay\.com)[^\s"'<>\\`)]*/g;
const results=[];
function walk(dir){
 for(const entry of readdirSync(dir,{withFileTypes:true})){
  if(entry.name.startsWith(".")||entry.name==="node_modules")continue;
  const path=join(dir,entry.name);
  if(entry.isDirectory()){walk(path);continue;}
  if(!extensions.test(entry.name))continue;
  const source=readFileSync(path,"utf8");
  const urls=[...source.matchAll(imageHosts)].map(m=>m[0]);
  if(!urls.length)continue;
  results.push({file:relative(process.cwd(),path),references:urls.length,uniqueUrls:[...new Set(urls)].length,hosts:[...new Set(urls.map(url=>{try{return new URL(url).hostname}catch{return "invalid"}}))]});
 }
}
walk(root);
results.sort((a,b)=>b.references-a.references);
console.log(JSON.stringify({filesWithExternalPhotos:results.length,totalReferences:results.reduce((n,r)=>n+r.references,0),files:results},null,2));
