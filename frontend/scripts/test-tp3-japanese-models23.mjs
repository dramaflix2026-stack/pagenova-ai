import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import ts from "typescript";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(path.join(root,p),"utf8");
const shared=read("src/components/builder-v2-tp3-japanese-shared.tsx");
const model2=read("src/components/builder-v2-tp3-model2.tsx");
const model3=read("src/components/builder-v2-tp3-model3.tsx");
const sourceOf=variant=>variant===2?model2:model3;
const idsBetween=(start,end,pattern)=>{
 const a=shared.indexOf(start),b=shared.indexOf(end,a);
 assert.ok(a>=0&&b>a,start+" not found");
 return [...shared.slice(a,b).matchAll(pattern)].map(m=>m[1]);
};

test("Japanese M2 and M3 and shared components parse as valid TypeScript JSX",()=>{
 for(const file of ["src/components/builder-v2-tp3-model2.tsx","src/components/builder-v2-tp3-model3.tsx","src/components/builder-v2-tp3-japanese-shared.tsx"]){
  const parsed=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[],file);
 }
});

test("Twenty-seven unique real Japanese photo choices avoid repetition",()=>{
 const unsplash=idsBetween("export const JAPANESE_TP3_PHOTO_IDS=[","] as const",/\"(photo-[0-9a-z-]+)\"/gi);
 const pexels=idsBetween("export const JAPANESE_TP3_PEXELS_IDS=[","] as const",/\b(\d{6,9})\b/g);
 assert.equal(new Set(unsplash).size,15,"curated sushi sources should contain 15 distinct Unsplash photos");
 assert.equal(pexels.length,12,"12 specifically documented Pexels sushi photos");
 assert.equal(new Set(pexels).size,12);
 const count=new Set(unsplash).size+pexels.length;
 assert.ok(count>=25,"full M2 needs at least 21 distinct photos");
 assert.match(shared,/new Set\(JAPANESE_TP3_PHOTO_IDS\.map/);
 assert.match(shared,/JAPANESE_TP3_PEXELS_IDS\.map/);
 assert.match(shared,/images\.unsplash\.com/);
 assert.match(shared,/images\.pexels\.com/);
 for(const bad of ["photo-1509440159596-0249088772ff","photo-1598373182133-52452f7691ef","photo-1549931319-a545dcf3bc73","photo-1555507036-ab1f4038808a","photo-1567620905732-2d1ec7ab7445"]){
  assert.ok(!unsplash.includes(bad),"known bread / pancake photo in sushi catalog: "+bad);
 }
});

test("Japanese imagery overrides all generic generated categories, preserving verified owner imports",()=>{
 for(const variant of [2,3]){
  const source=sourceOf(variant);
  assert.match(source,/isJapanese=!isTruck&&isJapaneseTP3Site\(site\)/);
  assert.match(source,new RegExp("isJapanese\\?japaneseTP3Photo\\(i,"+variant));
  assert.match(source,/isJapanese\?japaneseTP3OwnerImage\(site/);
  assert.match(source,/!isJapanese\|\|b\.userUploaded===true\|\|site\.crmImported===true/);
  assert.match(source,/isJapanese\?japaneseTP3Photo\(0/);
  assert.match(source,/isJapanese\?niches\.find\(/);
  assert.match(source,/isTruck\?/);
 }
 assert.match(model2,/photo\(isJapanese\?i\+12:i\+6\)/);
 assert.match(model2,/photo\(isJapanese\?i\+19:i\+10\)/);
 assert.match(model3,/photo\(isJapanese\?14:6\)/);
 assert.match(model3,/photo\(isJapanese\?i\+15:i\+7\)/);
});

test("Four matching photo testimonials on both models, with fictional endorsements hidden on publication",()=>{
 for(const variant of [2,3]){
  const source=sourceOf(variant);
  assert.match(source,new RegExp("JapaneseTP3Testimonials site=\\{site\\} publishedMode=\\{publishedMode\\} variant=\\{"+variant+"\\}"));
  assert.match(source,/isTruck\?<FoodTruckTestimonials/);
 }
 for(const name of ["Mariana Costa","Rafael Almeida","Camila Ferreira","Lucas Martins"]){
  assert.ok(shared.includes(name),name);
 }
 assert.match(shared,/testimonials\.length;i<4;i\+\+/);
 assert.match(shared,/if\(!publishedMode\)/);
 assert.match(shared,/Depoimentos demonstrativos:/);
 assert.match(shared,/Avaliação de demonstração/);
 assert.match(shared,/Foto ilustrativa/);
 assert.match(shared,/rounded-full object-cover/);
});

test("Numbers use real content counts or available values, animate on entering viewport and honor reduced motion",()=>{
 for(const variant of [2,3]){
  const source=sourceOf(variant);
  assert.match(source,new RegExp("JapaneseTP3AnimatedNumbers raw=\\{(?:metrics|numbers)\\} faqCount=\\{universalFaqItems\\(site\\.blocks,(?:faq|questions)\\)\\.length\\} variant=\\{"+variant+"\\}"));
 }
 assert.match(shared,/IntersectionObserver/);
 assert.match(shared,/requestAnimationFrame/);
 assert.match(shared,/prefers-reduced-motion: reduce/);
 assert.match(shared,/Math\.round\(progress\*metric\.value\)/);
 for(const text of ["Pedidos realizados · exemplo","Clientes satisfeitos · exemplo","Anos de tradição · exemplo"]){
  assert.ok(shared.includes(text));
 }
 assert.match(shared,/Prévia ilustrativa: os números abaixo são fictícios/);
 assert.match(shared,/if\(publishedMode\)return \{metrics:\[\],example:false\}/);
 assert.match(shared,/categorias\|etapas\|perguntas/);
});

test("Japanese location and WhatsApp appear in both models without false public addresses",()=>{
 for(const variant of [2,3]){
  const source=sourceOf(variant);
  assert.match(source,new RegExp("isJapanese&&<JapaneseTP3Location site=\\{site\\} publishedMode=\\{publishedMode\\} variant=\\{"+variant+"\\}"));
 }
 assert.ok(shared.includes("data-japanese-tp3-location={variant}"));
 assert.match(shared,/Mapa ilustrativo de São Paulo/);
 assert.match(shared,/Endereço fictício · apenas demonstração/);
 assert.ok(shared.includes("https://www.google.com/maps?q="));
 assert.match(shared,/phone.length>=10&&phone.length<=13/);
 assert.match(shared,/Cadastre o número oficial para ativar o botão/);
 assert.match(shared,/!publishedMode/);
});

test("Japanese footer bypasses the exact global four-column !important CSS conflict",()=>{
 const css=read("src/app/globals.css");
 const model1=read("src/components/builder-v2-tp3-japanese-model1.tsx");
 assert.match(css,/body footer > div:first-child/);
 assert.match(css,/body footer\\.pn-japanese-footer > \\.pn-japanese-footer-shell:first-child/);
 assert.match(css,/body footer\\.pn-japanese-footer \\.pn-japanese-footer-grid/);
 assert.match(css,/display:block !important/);
 assert.match(css,/grid-template-columns:none !important/);
 assert.match(css,/minmax\\(0,1\\.45fr\\) minmax\\(0,\\.65fr\\) minmax\\(0,\\.95fr\\)/);
 assert.match(css,/@media\\(max-width:700px\\)/);
 assert.match(model1,/className="pn-japanese-footer bg-/);
 assert.match(model1,/pn-japanese-footer-grid grid min-w-0/);
 assert.match(shared,/pn-japanese-footer-shell mx-auto max-w-7xl/);
});
test("Gold background in Japanese M3 has contrasting text for explanation and numbers",()=>{
 const css=read("src/components/builder-v2-tp3-model3.css");
 assert.match(css,/\\.tp3m3 \\.tp3m3-numbers p/);
 assert.match(css,/data-japanese-metrics-disclaimer="demo"/);
 assert.match(css,/color:#292015 !important/);
 assert.match(css,/\\.tp3m3 \\.tp3m3-pillars p/);
 assert.match(shared,/publishedMode=false/);
 assert.match(shared,/if\\(publishedMode\\)return \\{metrics:\\[\\],example:false\\}/);
});
test("Premium footer is scoped to Japanese M2/M3 and capped in desktop/mobile",()=>{
 for(const variant of [2,3]){
  const source=sourceOf(variant);
  assert.match(source,new RegExp("isJapanese\\?<JapaneseTP3Footer site=\\{site\\} publishedMode=\\{publishedMode\\} variant=\\{"+variant+"\\}"));
  assert.match(source,/FoodTruckPremiumFooter/);
  assert.match(source,new RegExp('variant=\\{'+variant+'\\}'));
 }
 assert.match(shared,/data-japanese-tp3-footer=\{variant\}/);
 assert.match(shared,/pn-japanese-footer-shell/);
 assert.match(shared,/pn-japanese-footer-grid/);
 assert.match(shared,/md:grid-cols-\[minmax\(0,1\.35fr\)_minmax\(0,\.8fr\)_minmax\(0,1fr\)\]/);
 assert.match(shared,/font-serif text-\[clamp\(2rem,4vw,3\.7rem\)\]/);
 assert.match(shared,/break-words/);
 assert.match(shared,/Endereço fictício — prévia/);
 assert.match(shared,/Todos os direitos reservados/);
});
