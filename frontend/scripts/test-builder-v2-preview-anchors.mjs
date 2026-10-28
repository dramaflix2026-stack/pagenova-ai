import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {interceptPreviewFragmentNavigation} from "../src/lib/builder-v2-preview-navigation.ts";
import {immersiveHeroTextColor} from "../src/lib/builder-v2-hero-contrast.ts";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=(relative)=>readFileSync(path.join(root,relative),"utf8");

function simulateClick(href,{existingId="contato",reduceMotion=false}={}){
  const scroll=[];
  let prevented=0,lookedUp="";
  const anchor={getAttribute(name){return name==="href"?href:null}};
  const target={getBoundingClientRect(){return {top:540}}};
  const win={
    scrollY:110,
    getComputedStyle(){return {scrollMarginTop:"80px"}},
    matchMedia(){return {matches:reduceMotion}},
    scrollTo(params){scroll.push(params)}
  };
  const doc={
    defaultView:win,
    scrollingElement:{scrollTop:110},
    documentElement:{scrollTop:110},
    getElementById(id){lookedUp=id;return id===existingId?target:null}
  };
  const event={
    target:{closest(selector){assert.equal(selector,"a[href]");return anchor}},
    preventDefault(){prevented++}
  };
  const handled=interceptPreviewFragmentNavigation(event,doc);
  return {handled,prevented,scroll,lookedUp};
}
test("T12 regression — #contato stays inside iframe and scrolls instead of navigating",()=>{
  const result=simulateClick("#contato");
  assert.equal(result.handled,true);
  assert.equal(result.prevented,1);
  assert.equal(result.lookedUp,"contato");
  assert.deepEqual(result.scroll,[{top:570,behavior:"smooth"}]);
});
test("T12 regression — missing anchors cannot load Builder route",()=>{
  const result=simulateClick("#seção-inexistente");
  assert.equal(result.handled,true);
  assert.equal(result.prevented,1);
  assert.equal(result.scroll.length,0);
});
test("T12 regression — external links and document routes remain untouched",()=>{
  for(const href of ["https://example.com","/site/cliente","mailto:contato@example.com","tel:+5511999999999"]){
    const result=simulateClick(href);
    assert.equal(result.handled,false,href);
    assert.equal(result.prevented,0,href);
    assert.equal(result.scroll.length,0,href);
  }
});
test("T12 regression — keyboard/assistive click supports URI-encoded fragments",()=>{
  const result=simulateClick("#Fale%20Conosco",{existingId:"Fale Conosco",reduceMotion:true});
  assert.equal(result.prevented,1);
  assert.equal(result.lookedUp,"Fale Conosco");
  assert.equal(result.scroll[0].behavior,"instant");
});
test("T12 regression — empty hash is prevented without site navigation",()=>{
  const result=simulateClick("#");
  assert.equal(result.handled,true);
  assert.equal(result.prevented,1);
  assert.equal(result.scroll.length,0);
});
test("Dark immersive hero defaults to white for readability",()=>{
  assert.equal(immersiveHeroTextColor("#142636",true,undefined),"#FFFFFF");
  assert.equal(immersiveHeroTextColor("#222222",true,false),"#FFFFFF");
  assert.equal(immersiveHeroTextColor("#222222",false,undefined),"#222222");
});
test("Explicit client color commands take precedence over default contrast",()=>{
  assert.equal(immersiveHeroTextColor("#D4AF37",true,true),"#D4AF37");
  assert.equal(immersiveHeroTextColor("#222222",true,true),"#222222");
});
test("iframe integration captures link clicks and renderer uses contrast resolver",()=>{
 const preview=source("src/components/builder-v2-preview-frame.tsx");
 const site=source("src/components/builder-v2-site.tsx");
 const route=source("src/app/api/builder-v2/chat/route.ts");
 assert.match(preview,/frameDocument\.addEventListener\("click",onClick,true\)/);
 assert.match(preview,/frameDocument\.removeEventListener\("click",onClick,true\)/);
 assert.match(site,/immersiveHeroTextColor/); 
 assert.match(site,/immersiveHeroTextColor\(!adaptiveTemplate&&!b\.colorExplicit&&visualLayout!=="hero"\?"#234638":b\.color\|\|safeColor\(b\.color\),immersiveHero,b\.colorExplicit\)/);
 assert.match(site,/immersiveHeroTextColor\(b\.color\|\|readableColor\(safeColor\(b\.color\),sectionBackground\),immersiveHero,b\.colorExplicit\)/);
 assert.match(route,/clean\.colorExplicit=true/);
 assert.match(site,/<section id=\{isContact\?"contato":group\.id\}/);
});
