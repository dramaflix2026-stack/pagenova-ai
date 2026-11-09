import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import ts from "typescript";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(path.join(root,p),"utf8");
test("Florist testimonials contain five portraits, full names, niche narratives and clear fictional labels",()=>{
 const s=read("src/components/builder-v2-tp6-premium-shared.tsx");
 const matches=[...s.matchAll(/\{name:"([^"]+)",role:"([^"]+)",quote:"([^"]+)",photo:"([^"]+)"\}/g)];
 assert.equal(matches.length,5);
 for(const m of matches){assert.ok(m[1].includes(" "));assert.ok(m[2].length>5);assert.ok(m[3].length>40);assert.match(m[4],/^https:\/\/images\.unsplash\.com\/photo-/);}
 assert.match(s,/EXEMPLO FICTÍCIO · NÃO É CLIENTE REAL/);
 assert.match(s,/pn-t6-review-portrait/);
 assert.match(read("src/components/template6-retail-story.tsx"),/TP6RetailReviewSlots reviews=\{reviews\}/);
 for(const p of ["src/components/builder-v2-tp6-model2.tsx","src/components/builder-v2-tp6-model3-reviews-faq.tsx"]){
  const t=read(p);assert.match(t,/niche==="Floricultura"\?<TP6RetailReviewSlots reviews=\{readTP6RealReviews\(blocks\)\}/);
  assert.match(t,/TP6PerfumePreviewReviews publishedMode=\{publishedMode\}/);
 }
});
test("Floriculture photo pool excludes reported mismatched image and legacy cosmetic content",()=>{
 const s=read("src/lib/tp6-model2-internet-photos.ts");
 const b=s.match(/"Floricultura": \[([\s\S]+?)\n  \],/);assert.ok(b);
 const ids=[...b[1].matchAll(/"(\d{10,13}-[a-z0-9]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,8);assert.equal(new Set(ids).size,8);
 assert.ok(ids.includes("1582794543139-8ac9cb0f7b11"));assert.ok(!ids.includes("1508615070457-7baeba4003ab"));
 const css=read("src/components/builder-v2-tp6-premium-shared.css");
 assert.match(css,/\.pn-t6-legacy\{display:none!important\}/);
 assert.match(css,/@media\(max-width:700px\)/);
});
test("Updated shared TP6 and model renderers parse",()=>{
 for(const file of ["src/components/builder-v2-tp6-premium-shared.tsx","src/components/builder-v2-tp6-model2.tsx","src/components/builder-v2-tp6-model3-reviews-faq.tsx","src/components/template6-retail-story.tsx"]){
  const s=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(s.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[],file);
 }
});
