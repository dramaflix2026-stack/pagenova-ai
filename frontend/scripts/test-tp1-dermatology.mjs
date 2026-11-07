import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import ts from "typescript";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>readFileSync(path.join(root,file),"utf8");
test("dermatology visual components parse as TSX",()=>{
 for(const file of ["src/components/builder-v2-site.tsx","src/components/builder-v2-tp1-model2.tsx","src/components/builder-v2-tp1-model3-sections.tsx","src/components/builder-v2-tp1-model3.tsx"]){
  const parsed=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[],file);
 }
});
test("model 1 removes only repeated dermatology process-photo section",()=>{
 const s=read("src/components/builder-v2-site.tsx");
 assert.ok(s.includes("const dermatologyModel1="));
 assert.ok(s.includes("const processPhotos=allVisibleSections"));
 assert.ok(s.includes("photos.filter(src=>pool.has(src)).length>=2"));
});
test("model 2 has a real map around a clearly fictional preview-only address and WhatsApp button",()=>{
 const s=read("src/components/builder-v2-tp1-model2.tsx");
 assert.ok(s.includes("const isDermatology="));
 assert.ok(s.includes("const showDemoMap=(isMakeup||isDermatology)&&!publishedMode&&!footerAddress"));
 assert.ok(s.includes("https://www.google.com/maps?q="));
 assert.ok(s.includes("ENDEREÇO FICTÍCIO"));
 assert.ok(s.includes("Falar pelo WhatsApp"));
 assert.ok(s.includes("cadastre um número real de WhatsApp"));
});
test("model 3 uses dermatologist photography for every section, never generic fashion slots",()=>{
 const s=read("src/components/builder-v2-tp1-model3-sections.tsx");
 const catalog=read("src/lib/tp1-dermatology-photos.ts");
 const urls=[...catalog.matchAll(/https:\/\/images\.(?:pexels|unsplash)\.com\/[^"\s]+/g)].map(m=>m[0]);
 assert.ok(urls.length>=20);
 assert.equal(new Set(urls).size,urls.length);
 assert.ok(s.includes('if(id.startsWith("derm-"))'));
 assert.ok(s.includes('photos:Array.from({length:24}'));
 for(const key of ["config.photos[5+i]","config.photos[9+i]","config.photos[15]","config.photos[16]","isDermatology?i+17"])assert.ok(s.includes(key),key);
 assert.ok(s.includes("isDermatology && !testimonials.length"));
 assert.ok(read("src/components/builder-v2-tp1-model3.tsx").includes("getDermatologyInternetPhoto(0)"));
});
