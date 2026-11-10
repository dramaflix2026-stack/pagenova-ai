import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import ts from "typescript";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(path.join(root,p),"utf8");
test("Shared review catalog contains six safe samples while florist default stays five",()=>{
 const s=read("src/components/builder-v2-tp6-premium-shared.tsx");
 const matches=[...s.matchAll(/\{name:"([^"]+)",role:"([^"]+)",quote:"([^"]+)",photo:"([^"]+)"\}/g)];
 assert.equal(matches.length,6);
 assert.match(s,/TP6RetailReviewSlots\(\{reviews=\[\],count=5\}/);
 assert.match(s,/const slots=count===6\?6:5/);
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
 assert.ok(ids.includes("1582794543139-8ac9cb0f7b11"));
 assert.ok(ids.includes("1561848355-890d054dc55a"),"floral bouquet replacement");
 assert.ok(!ids.includes("1526045478516-99145907023c"),"makeup brushes cannot appear in florist templates");assert.ok(!ids.includes("1508615070457-7baeba4003ab"));
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

test("Pet shop gets a sixth card in all three models, and only its Model 2 footer is compact",()=>{
 const shared=read("src/components/builder-v2-tp6-premium-shared.tsx");
 const m1=read("src/components/template6-retail-story.tsx");
 const m2=read("src/components/builder-v2-tp6-model2.tsx");
 const m3=read("src/components/builder-v2-tp6-model3-reviews-faq.tsx");
 const footer=read("src/components/builder-v2-tp6-model2-store-footer.tsx");
 const css=read("src/components/builder-v2-tp6-premium-shared.css");
 const entry=read("src/components/builder-v2-site.tsx");
 assert.match(shared,/const slots=count===6\?6:5/);
 assert.match(shared,/EXEMPLO FICTÍCIO · NÃO É CLIENTE REAL/);
 assert.match(shared,/slice\(0,limit===6\?6:5\)/);
 assert.match(m1,/TP6RetailReviewSlots reviews=\{reviews\} count=\{niche==="Pet shop"\|\|\/boutique/);
 assert.match(m2,/sixPetReviews\?<TP6RetailReviewSlots reviews=\{readTP6RealReviews\(blocks,6\)\} count=\{6\}/);
 assert.match(m3,/sixPetReviews\?<TP6RetailReviewSlots reviews=\{readTP6RealReviews\(blocks,6\)\} count=\{6\}/);
 assert.match(footer,/tp6m2-footer--pet/);
 assert.match(css,/\.tp6m2-footer--pet \.tp6m2-footer-signature\{[\s\S]*font-size:clamp\(35px,4\.9vw,68px\)!important/);
 assert.match(entry,/BuilderV2TP6Model2TestimonialsAndFAQ niche=\{retailNiche\} brand=/);
 assert.match(entry,/BuilderV2TP6Model3ReviewsFAQ niche=\{retailNiche\} brand=/);
 assert.match(entry,/const retailReviews=readTP6RealReviews\(props\.site\.blocks,retailNiche==="Pet shop"/);
 for(const [name,src] of [["M1",m1],["M2",m2],["M3",m3],["shared",shared],["footer",footer],["entry",entry]]){
  const parsed=ts.createSourceFile(name+".tsx",src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[],name);
 }
});
