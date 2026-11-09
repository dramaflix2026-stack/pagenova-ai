import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import ts from "typescript";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(path.join(root,p),"utf8");
const shared=read("src/components/builder-v2-tp3-family-shared.tsx");
const models=[1,2,3].map(i=>read("src/components/builder-v2-tp3-model"+i+".tsx"));
const css=read("src/app/globals.css");
const contract=s=>assert.match(shared,new RegExp(s));

test("TP3 M1-M3 and family components parse as valid TypeScript JSX",()=>{
 for(const file of ["src/components/builder-v2-tp3-model1.tsx","src/components/builder-v2-tp3-model2.tsx","src/components/builder-v2-tp3-model3.tsx","src/components/builder-v2-tp3-family-shared.tsx"]){
  const ast=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(ast.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[],file);
 }
});

test("one TP3 category resolver takes brand/title priority and preserves established specialty families",()=>{
 assert.match(shared,/export function resolveTP3FoodCategory/);
 assert.match(shared,/site\.header\?\.brand,site\.title,selectedNiche/);
 assert.match(shared,/const byBrand=categories\.find/);
 assert.match(shared,/const byNiche=categories\.find/);
 for(const niche of ["Pizzaria","Hamburgueria","Cafeteria","Padaria","Confeitaria","Marmitaria","Sorveteria","Churrascaria","Buffet","Comida japonesa","Açaí","Doceria","Food truck","Restaurante"]){
  assert.ok(shared.includes(',"'+niche+'"]'),"TP3 category absent: "+niche);
 }
 for(let i=0;i<models.length;i++){
  assert.match(models[i],/resolveTP3FoodCategory\(site/,"M"+(i+1)+" route");
  assert.match(models[i],/tp3FamilyInternetPhoto\(/,"M"+(i+1)+" external photos");
  assert.ok(models[i].includes("isFoodTruck(site)"),"Food Truck isolated in M"+(i+1));
 }
 assert.ok(models[0].includes("isJapaneseCuisineSiteIdentity"),"existing approved Japanese M1 is still isolated");
 assert.ok(models[1].includes("isJapaneseTP3Site"),"Japanese M2 preserved");
 assert.ok(models[2].includes("isJapaneseTP3Site"),"Japanese M3 preserved");
});

test("Pizzaria has a unique image bank independent of bakery, and every generic model uses it",()=>{
 const pizza=shared.slice(shared.indexOf(" Pizzaria:["),shared.indexOf(" ],",shared.indexOf(" Pizzaria:[")));
 const unsplash=[...pizza.matchAll(/"photo-[a-z0-9-]+"/gi)].map(m=>m[0]);
 const pexels=shared.slice(shared.indexOf("const pizzaPexelsIds=["),shared.indexOf("] as const",shared.indexOf("const pizzaPexelsIds=[")));
 const ids=[...pexels.matchAll(/\b\d{6,9}\b/g)].map(m=>m[0]);
 assert.ok(unsplash.length>=12,"Pizzaria requires a non-repeating food catalog");
 assert.equal(new Set(unsplash).size,unsplash.length);
 assert.ok(ids.length>=12,"Pizzaria needs extra real internet photos for complete pages");
 assert.equal(new Set(ids).size,ids.length);
 assert.match(shared,/images\.unsplash\.com/);
 assert.match(shared,/images\.pexels\.com/);
 for(const id of ["photo-1509440159596-0249088772ff","photo-1598373182133-52452f7691ef","photo-1549931319-a545dcf3bc73","photo-1567620905732-2d1ec7ab7445"]){
  assert.ok(!unsplash.some(item=>item.includes(id)),"bread/pancake image in Pizzaria pool: "+id);
 }
 assert.match(models[0],/const photo=\(slot:number\)=>tp3FamilyInternetPhoto\(category,1,slot,1400\)/);
 assert.match(models[1],/isJapanese\?japaneseTP3Photo\(i,2\):tp3FamilyInternetPhoto\(familyCategory,2,i,1400\)/);
 assert.match(models[2],/isJapanese\?japaneseTP3Photo\(i,3,1600\):tp3FamilyInternetPhoto\(familyCategory,3,i,1600\)/);
 assert.ok(shared.includes("TP3_PIZZA_DISTINCT_SOURCE_COUNT"));
});

test("untrusted generated photos do not override the selected food niche",()=>{
 assert.match(shared,/export function tp3TrustedBlockImage/);
 assert.match(shared,/block\.userUploaded===true/);
 assert.match(shared,/site\.crmImported===true/);
 assert.match(shared,/site\.sectionMediaManaged/);
 for(const model of models)assert.match(model,/tp3TrustedBlockImage\(site,b\)/);
 assert.match(models[1],/fallbackPhoto=.*tp3FamilyInternetPhoto\(familyCategory,2,24,1400\)/);
 assert.match(models[2],/fallbackPhoto=.*tp3FamilyInternetPhoto\(familyCategory,3,24,1600\)/);
});

test("M1 has 6 pictures in gallery plus all mandatory blocks with high-contrast contact",()=>{
 assert.match(models[0],/\[6,7,8,9,10,11\]/);
 assert.match(models[0],/galleryImages\[index\]\|\|photo\(i\)/);
 for(const key of ["diferenciais","processo","numeros","depoimentos","faq","localizacao","rodape"]){
  assert.ok(shared.includes('data-universal-section="'+key+'"'),"M1 section "+key+" missing");
 }
 assert.match(models[0],/TP3FamilyModel1Extras site=\{site\}/);
 assert.match(models[0],/pn-tp3-m1-contact/);
 assert.match(css,/section\.pn-tp3-m1-contact h2/);
});

test("Pizzaria M1 fermentation step uses an actual pizza dough photo with working fallback",()=>{
 assert.match(shared,/category==="Pizzaria"&&i===1\?"https:\/\/images\.pexels\.com\/photos\/35760003\/pexels-photo-35760003\.jpeg/);
 assert.match(shared,/img\.dataset\.tp3FallbackAttempt="1"/);
 assert.match(shared,/images\.pexels\.com\/photos\/33593107\/pexels-photo-33593107\.jpeg/);
 assert.match(shared,/img\.dataset\.tp3FallbackAttempt="2"/);
 assert.match(shared,/img\.src=tp3FamilyInternetPhoto\(category,1,12\)/);
 assert.match(shared,/img\.style\.visibility="hidden"/);
});
test("M2 and M3 render animated counters, four testimonial cards, a real contact panel and shared footer",()=>{
 for(let i=1;i<models.length;i++){
  const m=models[i];
  for(const component of ["TP3FamilyAnimatedNumbers","TP3FamilyTestimonials","TP3FamilyLocation","TP3FamilyFooter"]){
   assert.ok(m.includes("<"+component),"M"+(i+1)+": missing "+component);
  }
  assert.match(m,/publishedMode=\{publishedMode\}/);
  assert.ok(m.includes("<JapaneseTP3Testimonials"),"existing sushi logic kept");
  assert.ok(m.includes("<FoodTruckTestimonials"),"existing food-truck logic kept");
 }
 assert.match(models[1],/galleryImages\[i\]\|\|photo\(i\+12\)/);
 assert.match(models[2],/\[14,15,16,17,18\]\.map/);
 assert.match(models[2],/galleryImages\[i\+1\]\|\|photo\(slot\)/);
 assert.match(models[2],/photo\(isJapanese\?14:19\)/);
 assert.match(models[2],/photo\(isJapanese\?i\+15:i\+20\)/);
});

test("prototype preview clearly marks fictional claims and public sites use real data only",()=>{
 for(const name of ["Mariana Costa","Rafael Almeida","Camila Ferreira","Lucas Martins"])assert.ok(shared.includes(name),name);
 assert.match(shared,/for\(let i=entries\.length;i<4;i\+\+\)/);
 assert.match(shared,/if\(!publishedMode\)/);
 assert.match(shared,/Depoimentos de demonstração/);
 assert.match(shared,/Avaliação demonstrativa/);
 assert.match(shared,/Foto ilustrativa/);
 assert.match(shared,/if\(publishedMode\)return \{items:\[\],demo:false\}/);
 assert.match(shared,/Pedidos realizados · exemplo/);
 assert.match(shared,/Clientes satisfeitos · exemplo/);
 assert.match(shared,/Anos de tradição · exemplo/);
 assert.match(shared,/IntersectionObserver/);
 assert.match(shared,/requestAnimationFrame/);
 assert.match(shared,/prefers-reduced-motion: reduce/);
 assert.match(shared,/Math\.round\(progress\*it\.value\)/);
});

test("6+ FAQ entries and demo-only fictitious address while preserving real WhatsApp",()=>{
 const list=shared.slice(shared.indexOf("const faqDefaults:"),shared.indexOf("export function TP3FamilyFAQ"));
 const questions=[...list.matchAll(/^\s*\["/gm)];
 assert.ok(questions.length>=6,"family FAQ must cover customer basics");
 assert.match(shared,/universalFaqItems\(site\.blocks,faqDefaults\)/);
 assert.match(shared,/data-tp3-family-location/);
 assert.match(shared,/Endereço fictício — prévia demonstrativa/);
 assert.match(shared,/address\|\|!publishedMode/);
 assert.match(shared,/site\.restaurant\?\.whatsapp/);
 assert.match(shared,/wa\.me/);
});

test("TP3 family footer neutralizes global 4-column CSS: desktop 3, tablet 2, phone 1",()=>{
 assert.match(css,/body footer > div:first-child/);
 assert.match(css,/body footer\.pn-tp3-footer > \.pn-tp3-footer-shell:first-child/);
 assert.match(css,/grid-template-columns:none !important/);
 assert.match(css,/body footer\.pn-tp3-footer \.pn-tp3-footer-grid/);
 assert.match(css,/minmax\(0,1\.45fr\) minmax\(0,\.7fr\) minmax\(0,\.95fr\)/);
 assert.match(css,/@media \(max-width:700px\)/);
 assert.match(css,/@media \(min-width:701px\) and \(max-width:980px\)/);
 assert.match(shared,/data-tp3-family-footer=\{variant\}/);
 assert.match(shared,/pn-tp3-footer-shell/);
 assert.match(shared,/pn-tp3-footer-grid/);
});

test("Hamburgueria M3 fixes process and last gallery image without changing approved templates",()=>{
 const model=models[2];
 assert.ok(model.includes('const burgerProcessPhoto="https://images.pexels.com/photos/8365312/pexels-photo-8365312.jpeg'));
 assert.ok(model.includes('const burgerGallerySixPhoto="https://images.pexels.com/photos/4098851/pexels-photo-4098851.jpeg'));
 assert.ok(model.includes('familyCategory==="Hamburgueria"&&i===6?burgerProcessPhoto'));
 assert.ok(model.includes('familyCategory==="Hamburgueria"&&i===18?burgerGallerySixPhoto'));
 assert.ok(model.includes('familyCategory==="Hamburgueria"?11:24'));
 assert.ok(model.includes('photo(isJapanese?step+3:step+6)'));
 assert.ok(model.includes('[14,15,16,17,18].map'));
 assert.ok(model.includes('galleryImages[i+1]||photo(slot)'));
});
