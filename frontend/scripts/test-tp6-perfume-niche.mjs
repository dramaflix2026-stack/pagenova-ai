import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import ts from "typescript";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(file)=>readFileSync(path.join(root,file),"utf8");
test("all changed TP6 components parse as TSX",()=>{
 for(const file of ["src/components/builder-v2-site.tsx","src/components/builder-v2-tp6-model2.tsx","src/components/builder-v2-tp6-model3.tsx","src/components/builder-v2-tp6-model3-reviews-faq.tsx","src/components/builder-v2-tp6-model2-store-footer.tsx","src/components/tp6-perfume-preview-reviews.tsx"]){
  const parsed=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[],file);
 }
});
test("declared perfumery identity wins over stale clothes metadata in all three variants",()=>{
 const s=read("src/components/builder-v2-site.tsx");
 assert.match(s,/const perfumeIdentity=\/perfumaria/);
 assert.ok(s.includes('perfumeIdentity?"Perfumaria e cosméticos"'));
 assert.ok(s.includes('const retailHeading='));
 assert.ok(s.includes('const retailDescription='));
 assert.ok(s.includes("image={perfumeBrief?internetPhotos[0]:heroImage}"));
 for(const v of ["01","02","03"])assert.ok(s.includes('getTP6Model2InternetPhotos(retailNiche,"'+v+'")'));
});
test("each perfume preview has eight product-only photos and preserved non-perfume behavior",()=>{
 const s=read("src/lib/tp6-model2-internet-photos.ts");
 const start=s.indexOf('"Perfumaria e cosméticos": [');
 const stop=s.indexOf('],',start);
 assert.ok(start>=0&&stop>start);
 const ids=[...s.slice(start,stop).matchAll(/"([0-9]{13}-[a-z0-9]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,12);
 assert.equal(new Set(ids).size,12);
 assert.ok(s.includes('niche==="Perfumaria e cosméticos"?Array.from({length:8}'));
 assert.ok(s.includes('photoIds["E-commerce multimarcas"]'));
});
test("perfume preview testimonials are disclosed and cannot publish fictional reviews",()=>{
 const s=read("src/components/tp6-perfume-preview-reviews.tsx");
 assert.ok(s.includes("if(publishedMode)return"));
 assert.ok(s.includes("NÃO REPRESENTAM CLIENTES REAIS"));
 assert.ok(s.includes("width:56,height:56,minWidth:56,maxWidth:56"));
 assert.equal((s.match(/"photo-\d{13}-/g)||[]).length,5);
 for(const file of ["src/components/builder-v2-tp6-model2.tsx","src/components/builder-v2-tp6-model3-reviews-faq.tsx"])assert.ok(read(file).includes("<TP6PerfumePreviewReviews publishedMode={publishedMode}/>"));
});
test("FAQ is tailored to perfumes and supports questions beyond a single pair",()=>{
 for(const file of ["src/components/builder-v2-tp6-model2.tsx","src/components/builder-v2-tp6-model3-reviews-faq.tsx"]){
 const s=read(file);
 assert.ok(s.includes('niche==="Perfumaria e cosméticos"&&pairs.length<4'));
 for(const keyword of ["perfume","pele","maquiagem","entrega","troca"])assert.ok(s.toLocaleLowerCase("pt-BR").includes(keyword),file+": "+keyword);
 }
});
test("fictional map and phone are preview only and clearly labeled",()=>{
 const f=read("src/components/builder-v2-tp6-model2-store-footer.tsx");
 assert.ok(f.includes('!publishedMode&&!address?.trim()'));
 assert.ok(f.includes("LOCALIZAÇÃO DEMONSTRATIVA · DADOS FICTÍCIOS"));
 assert.ok(f.includes("Endereço fictício:"));
 assert.ok(f.includes("Telefone fictício:"));
 assert.ok(f.includes("openstreetmap.org/export/embed.html"));
 const site=read("src/components/builder-v2-site.tsx");
 assert.ok(site.includes('cnpj={props.site.footer?.cnpj} publishedMode={props.publishedMode}/>'));
});
test("model 3 perfume editorial is distinct from clothes copy",()=>{
 const s=read("src/components/builder-v2-tp6-model3.tsx");
 assert.ok(s.includes('niche==="Perfumaria e cosméticos"?"Na nossa perfumaria'));
});
