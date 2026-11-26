#!/usr/bin/env node
/** Download seven real editorial automotive photos into the repository.
 * Run from the repository root: node frontend/scripts/vendor-automotive-photos.mjs
 * Fail closed on missing/invalid images. Existing assets are never overwritten.
 */
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {join} from "node:path";
const output=join(process.cwd(),"frontend/public/images/automotive");
const photos=[
 ["hero","photo-1486262715619-67b85e0b08d3"],
 ["service-0","photo-1486262715619-67b85e0b08d3"],
 ["service-1","photo-1493238792000-8113da705763"],
 ["service-2","photo-1544636331-e26879cd4d9b"],
 ["service-3","photo-1507136566006-cfc505b114fc"],
 ["service-4","photo-1614200187524-dc4b892acf16"],
 ["service-5","photo-1542362567-b07e54358753"]
];
const valid=(data)=>data.length>=2000&&data.length<=8_000_000&&data[0]===255&&data[1]===216&&data[2]===255;
await mkdir(output,{recursive:true});
for(const [name,id] of photos){
 const target=join(output,`${name}.jpg`);
 try{const existing=await readFile(target);if(valid(existing)){console.log("KEEP",name);continue;}throw Error(`Invalid existing asset: ${target}`);}catch(e){if(e.code!=="ENOENT")throw e;}
 const url=`https://images.unsplash.com/${id}?fit=crop&w=1200&q=82&fm=jpg`;
 let response;
 try{response=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:"follow"});}
 catch(e){throw Error(`Download failed for ${name}: ${e.message}`);}
 if(!response.ok)throw Error(`Download failed for ${name}: HTTP ${response.status}`);
 const data=Buffer.from(await response.arrayBuffer());
 if(!valid(data))throw Error(`Invalid JPEG for ${name}: ${data.length} bytes`);
 await writeFile(target,data,{flag:"wx"});
 console.log("SAVED",name,data.length);
}
console.log("All seven automotive assets verified.");
