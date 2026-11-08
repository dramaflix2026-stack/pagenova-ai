import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import ts from "typescript";
import {
  JAPANESE_MODEL1_PHOTO_IDS, JAPANESE_MODEL1_SECTIONS, japaneseModel1Photo,
  isJapaneseCuisineNiche,isJapaneseCuisineSiteIdentity,isGenericJapaneseSiteName,japaneseModel1Brand
} from "../src/lib/tp3-japanese-model1.ts";
import {BRIEFING_TEMPLATE_FAMILIES,resolveBriefingFamily} from "../src/lib/briefing-template-families.ts";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(p)=>readFileSync(path.join(root,p),"utf8");
const isolated="src/components/builder-v2-tp3-japanese-model1.tsx";
const model="src/components/builder-v2-tp3-model1.tsx";

test("preflight: the complete niche registry routes every advertised niche to its own family",()=>{
  assert.equal(BRIEFING_TEMPLATE_FAMILIES.length,10);
  const all=BRIEFING_TEMPLATE_FAMILIES.flatMap(group=>group.niches.map(niche=>({niche,group:group.id})));
  assert.ok(all.length>=133,"a family cannot disappear without failing the production build");
  for(const {niche,group} of all){
    assert.equal(resolveBriefingFamily(niche),group,"routing for "+niche);
  }
  assert.equal(resolveBriefingFamily("Comida japonesa"),3);
  assert.equal(resolveBriefingFamily("Padaria"),3);
});

test("preflight: Japanese Model 1 never uses the bakery image catalog",()=>{
  assert.equal(JAPANESE_MODEL1_PHOTO_IDS.length,12);
  assert.equal(new Set(JAPANESE_MODEL1_PHOTO_IDS).size,12);
  assert.ok(JAPANESE_MODEL1_PHOTO_IDS.every(id=>/^photo-[\w-]+$/.test(id)));
  for(const id of [
    "photo-1509440159596-0249088772ff",
    "photo-1555507036-ab1f4038808a",
    "photo-1598373182133-52452f7691ef",
    "photo-1549931319-a545dcf3bc73",
    "photo-1534620808146-d33bb39128b2",
  ]){
    assert.ok(!JAPANESE_MODEL1_PHOTO_IDS.includes(id),"bread image forbidden: "+id);
  }
  for(const i of Array.from({length:12},(_,i)=>i)){
    assert.match(japaneseModel1Photo(i),/^https:\/\/images\.unsplash\.com\/photo-/);
  }
  assert.match(read(model),/if\(!isTruck&&isJapaneseCuisineSiteIdentity\(\{/);
  assert.match(read(isolated),/data-tp3-japanese="true"/);
});

test("preflight: JP name and niche detection never steal bakery or Food Truck",()=>{
  assert.ok(isJapaneseCuisineNiche("Comida japonesa"));
  assert.ok(isJapaneseCuisineNiche("Restaurante de sushi"));
  assert.ok(isJapaneseCuisineNiche("Temakeria"));
  assert.equal(isJapaneseCuisineNiche("Padaria"),false);
  assert.equal(isJapaneseCuisineNiche("Food truck"),false);
  assert.equal(isJapaneseCuisineNiche("Confeitaria"),false);
  assert.equal(isGenericJapaneseSiteName("Delícias da Comida Japonesa"),true);
  assert.deepEqual(japaneseModel1Brand("Delícias da Comida Japonesa",undefined,false),{brand:"Sakura Sushi",demo:true});
  assert.deepEqual(japaneseModel1Brand("Delícias da Comida Japonesa",undefined,true),{brand:"Restaurante japonês",demo:false});
  assert.deepEqual(japaneseModel1Brand("Sushi Haru",undefined,false),{brand:"Sushi Haru",demo:false});
  assert.deepEqual(japaneseModel1Brand("Sakura Sushi House","Gastronomia Premium",false),{brand:"Sakura Sushi House",demo:false});
  assert.deepEqual(japaneseModel1Brand("Delícias da Comida Japonesa","Sakura Sushi House",false),{brand:"Sakura Sushi House",demo:false});
});

test("preflight: old generic-gastronomy projects still render Japanese Model 1",()=>{
  assert.equal(isJapaneseCuisineSiteIdentity({
    niche:"Gastronomia",title:"Delícias da Comida Japonesa",
  }),true);
  assert.equal(isJapaneseCuisineSiteIdentity({
    niche:"Restaurantes",title:"Sakura Sushi House",
  }),true);
  assert.equal(isJapaneseCuisineSiteIdentity({
    niche:"Gastronomia Premium",title:"Novo Site",brand:"Sakura Sushi House",
  }),true);
  assert.equal(isJapaneseCuisineSiteIdentity({
    niche:"Gastronomia",title:"Restaurante",heroHeadings:["Comida japonesa de verdade"],
  }),true);
  assert.equal(isJapaneseCuisineSiteIdentity({
    selectedNiche:"Comida japonesa",niche:"Gastronomia",title:"Restaurante",
  }),true);
  for(const niche of ["Padaria","Pizzaria","Cafeteria","Food truck","Confeitaria","Hamburgueria"]){
    assert.equal(isJapaneseCuisineSiteIdentity({niche,title:"Sakura Sushi House"}),false,niche);
  }
  assert.equal(isJapaneseCuisineSiteIdentity({
    niche:"Gastronomia",title:"Delícias e sabores da casa",
  }),false);
  const rootRenderer=read("src/components/builder-v2-site.tsx");
  assert.match(rootRenderer,/japaneseSiteIdentity=isJapaneseCuisineSiteIdentity/);
  assert.match(rootRenderer,/\(family===3\|\|family===undefined\)&&japaneseSiteIdentity/);
  assert.match(rootRenderer,/BuilderV2TP3Model1 site=\{site\} selectedNiche=\{selectedNiche\}/);
});

test("preflight: every required Japanese site section is renderable",()=>{
  const source=read(isolated);
  assert.equal(JAPANESE_MODEL1_SECTIONS.length,10);
  for(const id of JAPANESE_MODEL1_SECTIONS){
    assert.ok(source.includes('data-universal-section="'+id+'"'),"required section "+id);
  }
  for(const id of ["inicio","especialidades","sobre","faq","localizacao","rodape"]){
    assert.ok(source.includes('id="'+id+'"'),"navigation anchor "+id);
  }
  assert.match(source,/const fallbackFaq = \[/);
  assert.match(source,/aria-expanded=\{openFaq===i\}/);
  assert.match(source,/const examples = \[/);
  assert.match(source,/i<4/);
  assert.match(source,/reviews\.some\(r=>r\.demo\)/);
  assert.match(source,/não representam clientes reais|os nomes, retratos e relatos são fictícios/);
  assert.match(source,/!publishedMode/);
  assert.match(source,/Cadastre um endereço real antes de publicar/);
  assert.match(source,/endereço verdadeiro|localização verdadeira/);
  assert.match(source,/google\.com\/maps\?q=/);
  assert.match(source,/https:\/\/wa\.me\//);
  assert.match(source,/site\.crmImported===true/);
});

test("preflight: Japanese renderer and entrypoint parse as valid TSX",()=>{
  for(const file of [isolated,model,"src/components/builder-v2-site.tsx"]){
    const parsed=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    const errors=parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," "));
    assert.deepEqual(errors,[],file);
  }
});
