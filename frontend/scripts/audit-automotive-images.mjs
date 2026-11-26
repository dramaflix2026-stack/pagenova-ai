#!/usr/bin/env node
/**
 * Audit first-party Vértice images. Run from frontend/: node scripts/audit-automotive-images.mjs
 * Exit 1 until the real photographs have been installed.
 */
import {existsSync,readFileSync,statSync} from "node:fs";
import {join} from "node:path";
const root=join(process.cwd(),"public","images","automotive");
const names=["hero",...Array.from({length:6},(_,i)=>`service-${i}`)];
const formats=["webp","jpg","jpeg","png"];
let failed=0;
for(const name of names){
 const file=formats.map(ext=>join(root,`${name}.${ext}`)).find(existsSync);
 if(!file){console.error(`MISSING: ${name} (webp/jpg/jpeg/png)`);failed++;continue;}
 const bytes=readFileSync(file);
 const isJpeg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
 const isPng=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const isWebp=bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP";
 if(statSync(file).size<2000||!(isJpeg||isPng||isWebp)){console.error(`INVALID: ${file}`);failed++;continue;}
 console.log(`OK: ${file}`);
}
console.log(`Automotive photo audit: ${names.length-failed}/${names.length} valid assets`);
process.exitCode=failed?1:0;
