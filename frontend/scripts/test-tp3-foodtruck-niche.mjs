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
 assert.ok(s.includes("indicadores ilustrativos da prévia")||s.includes("Indicadores ilustrativos da prévia"));
 assert.ok(s.includes("não serão publicados sem dados reais"));
 assert.ok(s.includes("publishedMode"));
 assert.ok(s.includes("Pedidos servidos"));
 assert.ok(s.includes("Eventos atendidos"));
 assert.ok(s.includes("Avaliação positiva"));
 assert.ok(s.includes("Aguardando dados reais")||s.includes("Dado ainda não informado"));
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
 for(const i of [1,2,3]){
  const expected=i===1
    ? "BuilderV2TP3Model1 site={site} selectedNiche={selectedNiche} publishedMode={publishedMode}"
    : "BuilderV2TP3Model"+i+" site={site} publishedMode={publishedMode}";
  assert.ok(route.includes(expected),"TP3 Model "+i+" route must retain the required props");
 }
});
test("M1 has full supporting sections, M2 is consistent, M3 has six gallery images",()=>{
 const m1=read("src/components/builder-v2-tp3-model1.tsx");
 for(const t of ["FoodTruckExtraModel1","FoodTruckFaq","FoodTruckTestimonials","FoodTruckLocation"])assert.ok(m1.includes(t),t);
 const m2=read("src/components/builder-v2-tp3-model2.tsx");
 for(const t of ["truckPhotoBrazil(i+12)","truckScene(\"model2StoryA\")","truckScene(\"model2StoryB\")","FoodTruckNumbers","FoodTruckTestimonials"])assert.ok(m2.includes(t),t);
 const m3=read("src/components/builder-v2-tp3-model3.tsx");
 for(const t of ["[13,14,15,16,17,18]","truckPhoto(19)","FoodTruckNumbers","FoodTruckTestimonials"])assert.ok(m3.includes(t),t);
});

test("Mobile Food Truck reviews have fixed avatar dimensions without collapsing reviewer names",()=>{
 const code=shared();
 assert.ok(code.includes("width:56,height:56,minWidth:56,maxWidth:56"));
 assert.ok(code.includes('flex:"0 0 56px"'));
 assert.ok(code.includes('maxWidth:"calc(100% - 70px)"'));
 assert.ok(code.includes('wordBreak:"normal"'));
 for(const i of [2,3])assert.ok(read("src/components/builder-v2-tp3-model"+i+".tsx").includes("<FoodTruckTestimonials"),"M"+i);
});
test("Beverage category does not reuse a burger photo and published pages cannot show illustrative KPIs",()=>{
 const src=shared();
 const m2=read("src/components/builder-v2-tp3-model2.tsx");
 const m3=read("src/components/builder-v2-tp3-model3.tsx");
 assert.ok(src.includes("5:px(6763221)"));
 assert.ok(src.includes("truckBeverageFallback"));
 assert.ok(src.includes("truckMenuPhoto"));
 assert.ok(m2.includes("truckPhotoBrazil(i+2)"));
 assert.ok(m2.includes("truckMenuPhoto(m.name,i+6)"));
 assert.ok(m2.includes("i===3?truckBeverageFallback()"));
 assert.ok(m2.includes("<FoodTruckNumbers data={metrics} publishedMode={publishedMode} dark/>"));
 assert.ok(m3.includes("<FoodTruckNumbers data={numbers} publishedMode={publishedMode}/>"));
 assert.ok(src.includes("const preview=!parsed.length&&!publishedMode"));
});
test("Editorial Brazilian photo replacements are unique across the M2 photo slots",()=>{
 const src=shared();
 const existing=src.slice(src.indexOf("const truckPhotos=["),src.indexOf("];",src.indexOf("const truckPhotos=[")));
 const existingIds=[...existing.matchAll(/(?:us\("([^"]+)"\)|px\((\d+)\))/g)].map(m=>m[1]||m[2]);
 const override=src.slice(src.indexOf("const brazilianTruckPhotos:"),src.indexOf("};",src.indexOf("const brazilianTruckPhotos:")));
 const overriden=new Map([...override.matchAll(/(\d+):px\((\d+)\)/g)].map(m=>[Number(m[1]),m[2]]));
 const slots=[0,1,...Array.from({length:21},(_,i)=>i+2)];
 const values=slots.map(i=>overriden.get(i)||existingIds[i]);
 assert.equal(new Set(values).size,values.length,"distinct photos throughout M2");
});

test("food truck photo roles follow Brazilian context and category intent",()=>{
 const sharedSource=shared();
 const m1=read("src/components/builder-v2-tp3-model1.tsx");
 const m2=read("src/components/builder-v2-tp3-model2.tsx");
 const m3=read("src/components/builder-v2-tp3-model3.tsx");
 for(const key of ["model1Hero","model1Gallery","model2Hero","model2About","model2StoryA","model2StoryB","model3Hero","model3About"])assert.ok(sharedSource.includes(key+":"),"curated scene: "+key);
 assert.ok(m1.includes('truckScene("model1Hero")'));
 assert.ok(m1.includes('i===3?truckBeverageFallback()'));
 assert.ok(m1.includes("grid-cols-1 gap-6 min-[480px]:grid-cols-2"),"mobile cards have sufficient width");
 assert.ok(m1.includes('[6,7,3,8]'),"four gallery images, not English-sign photo");
 assert.ok(m1.includes("[overflow-wrap:anywhere]"),"long category names cannot collide");
 assert.ok(m2.includes('truckScene("model2Hero")'));
 assert.ok(m2.includes('truckScene("model2About")'));
 assert.ok(m3.includes('truckScene("model3Hero")'));
 assert.ok(m3.includes('truckScene("model3About")'));
 assert.ok(sharedSource.includes('export const truckBeverageFallback=()=>us("photo-1513558161293-cdaf765edfd4")'),"beverage fallback must be an actual drink");
});
