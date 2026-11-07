import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import ts from "typescript";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(f)=>readFileSync(path.join(root,f),"utf8");
const shared=()=>read("src/components/builder-v2-tp3-foodtruck.tsx");
test("Food Truck components and all three models parse as TSX",()=>{
 for(const file of ["src/components/builder-v2-tp3-foodtruck.tsx","src/components/builder-v2-tp3-model1.tsx","src/components/builder-v2-tp3-model2.tsx","src/components/builder-v2-tp3-model3.tsx","src/components/builder-v2-site.tsx"]){
  const parsed=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[],file);
 }
});
test("Food Truck only: the M1/M2/M3 overrides are explicitly guarded",()=>{
 assert.ok(shared().includes("isFoodTruck"));
 for(const i of [1,2,3]){
  const code=read("src/components/builder-v2-tp3-model"+i+".tsx");
  assert.ok(code.includes("isFoodTruck(site)"),"M"+i+" scoped");
  assert.ok(code.includes("publishedMode"),"M"+i+" aware of published");
  assert.ok(code.includes("FoodTruckPremiumFooter"),"M"+i+" premium footer");
  assert.ok(code.includes("FoodTruckLocation"),"M"+i+" sample location");
  assert.ok(code.includes("FoodTruckTestimonials"),"M"+i+" testimonials");
 }
});
test("distinct Food Truck imagery for the 3 previews",()=>{
 const s=shared();
 const arr=s.slice(s.indexOf("const truckPhotos=["),s.indexOf("];",s.indexOf("const truckPhotos=[")));
 const urls=[...arr.matchAll(/(?:us\("([^"]+)"\)|px\((\d+)\))/g)].map(m=>m[1]||m[2]);
 assert.ok(urls.length>=22,"at least 22 images mapped");
 assert.equal(new Set(urls.slice(0,22)).size,22,"no repeats in used slots");
 for(const fragment of ["food truck","burger","fries","beverage","street"]){
  assert.ok(s.toLowerCase().includes(fragment),"explicit editorial intent: "+fragment);
 }
});
test("animated counts never invent business metrics",()=>{
 const s=shared();
 assert.ok(s.includes("IntersectionObserver"));
 assert.ok(s.includes("prefers-reduced-motion"));
 assert.ok(s.includes("não representam vendas, clientes"));
 assert.ok(s.includes("Etapas para consultar seu pedido"));
});
test("five fictional photo testimonials and no false endorsements",()=>{
 const s=shared();
 for(const name of ["Fernanda Lima","Rafael Costa","Camila Duarte","Bruno Martins","Larissa Almeida"])assert.ok(s.includes(name),name);
 assert.ok(s.includes("não representam clientes reais"));
 assert.ok(s.includes("Exemplo fictício"));
 assert.ok(s.includes("Foto ilustrativa")||s.includes("foto ilustrativa"));
});
test("sample map is only in preview with valid WhatsApp destination",()=>{
 const s=shared();
 assert.ok(s.includes('!publishedMode?'));
 assert.ok(s.includes("Endereço fictício · apenas prévia demonstrativa"));
 assert.ok(s.includes("Avenida Paulista, 1000"));
 assert.ok(s.includes("wa.me/"));
 const route=read("src/components/builder-v2-site.tsx");
 for(const i of [1,2,3])assert.ok(route.includes("BuilderV2TP3Model"+i+" site={site} publishedMode={publishedMode}"));
});
test("M1 has full supporting sections, M2 is consistent, M3 has six gallery images",()=>{
 const m1=read("src/components/builder-v2-tp3-model1.tsx");
 for(const t of ["FoodTruckExtraModel1","FoodTruckFaq","FoodTruckTestimonials","FoodTruckLocation"])assert.ok(m1.includes(t),t);
 const m2=read("src/components/builder-v2-tp3-model2.tsx");
 for(const t of ["truckPhoto(i+12)","truckPhoto(i+19)","FoodTruckNumbers","FoodTruckTestimonials"])assert.ok(m2.includes(t),t);
 const m3=read("src/components/builder-v2-tp3-model3.tsx");
 for(const t of ["[13,14,15,16,17,18]","truckPhoto(19)","FoodTruckNumbers","FoodTruckTestimonials"])assert.ok(m3.includes(t),t);
});
