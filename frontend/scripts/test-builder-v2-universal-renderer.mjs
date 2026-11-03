import test from "node:test";
import assert from "node:assert/strict";
import {fixture,render} from "./builder-v2-renderer-harness.mjs";
test("actual classic renderer honors explicit heading colors, typography and relative CTA URLs",()=>{
 for(const templateId of ["institutional-complete","minimalist-sophisticated"]){
  const site={...fixture(),templateId};
  for(const publishedMode of [false,true]){
   const $=render(site,publishedMode);
   assert.match($('[data-block-id="hero"]').attr("style"),/color:#663399/);
   assert.equal($('[data-block-id="cta"]').attr("href"),"/contato?origem=site#form");
   assert.match($('[data-block-id="intro"]').attr("style"),/font-family:Georgia/);
   assert.equal($('[data-block-id="intro"]').attr("data-pn-responsive-mobile-size"),"true");
   assert.match($('[data-block-id="cta"]').attr("style"),/font-size:19px/);
   assert.equal($('[data-block-id="cta"]').attr("data-pn-responsive-mobile-size"),"true");
  }
 }
});
test("actual preview and public render preserve reordered sections and removed blocks",()=>{
 const site=fixture();site.blocks=[...site.blocks.filter(b=>b.section==="faq"),...site.blocks.filter(b=>b.section==="inicio"&&b.id!=="intro")];
 for(const publishedMode of [false,true]){
  const $=render(site,publishedMode);
  assert.equal($('[data-block-id="intro"]').length,0);
  const html=$.html();assert.ok(html.indexOf('data-block-id="faq"')<html.indexOf('data-block-id="hero"'));
 }
});

test("actual TP3 models preserve section removals and reordering in preview and public snapshots",async()=>{
 const {applyUniversalNaturalLanguage}=await import("../src/lib/builder-v2-universal-language.ts");
 for(const variant of ["01","02","03"]){
  const site={...fixture(),niche:"Restaurante",templateId:"prompt-adaptive",briefingLayoutVariant:variant};
  site.blocks.push({id:"about",type:"heading",section:"sobre",text:"Sobre a marca",color:"#111",align:"left"},{id:"gallery",type:"heading",section:"galeria",text:"Galeria cadastrada",color:"#111",align:"left"});
  const changed=applyUniversalNaturalLanguage(site,"Remova a seção inicio e mova a galeria para antes da seção sobre");
  assert.equal(changed?.ok,true,changed?.error);
  for(const publishedMode of [false,true]){
   const $=render(JSON.parse(JSON.stringify(changed.site)),publishedMode);
   assert.equal($('[data-universal-section="inicio"]').length,0);
   const order=$('[data-universal-section]').map((_,element)=>$(element).attr("data-universal-section")).get();
   assert.ok(order.includes("galeria"),"TP3 "+variant+" must use its approved renderer");
   assert.equal(order.indexOf("galeria"),order.indexOf("sobre")-1);
   assert.equal($("header").length,1);
  }
 }
});
