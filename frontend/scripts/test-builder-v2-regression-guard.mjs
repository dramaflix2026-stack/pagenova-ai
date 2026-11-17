import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditUniversalRegressionState,captureUniversalRegressionSentinels,auditUniversalRegressionSentinels} from "../src/lib/builder-v2-regression-guard.ts";
import {verifyUniversalEditResult} from "../src/lib/builder-v2-universal-learning.ts";
const site={templateId:"approved",blocks:[
 {id:"hero",section:"hero",type:"heading",text:"Bem-vindo"},
 {id:"photo",section:"hero",type:"image",src:"https://example.com/old.jpg"},
 {id:"services",section:"services",type:"heading",text:"Serviços"},
 {id:"copy",section:"services",type:"paragraph",text:"Descrição"},
 {id:"cta",section:"contact",type:"button",text:"Contato",href:"https://example.com"},
 {id:"footer",section:"footer",type:"heading",text:"Rodapé"}]};
const change=(id,data)=>({...site,blocks:site.blocks.map(b=>b.id===id?{...b,...data}:b)});
const img=(src,loaded=true)=>({complete:loaded,naturalWidth:loaded?100:0,getAttribute:k=>k==="src"?src:null});
const a=href=>({getAttribute:k=>k==="href"?href:null});
const el=(id,text="",nested={})=>({
 tagName:"DIV",textContent:text,getClientRects:()=>[{}],
 getAttribute:key=>key==="data-block-id"?id:null,
 querySelector:key=>key==="img"?nested.img||null:key==="a"?nested.a||null:null
});
const root=items=>({querySelectorAll:k=>k==="[data-block-id]"?items:[]});
const win={getComputedStyle:()=>({display:"block",visibility:"visible"})};
test("delivery 13: legitimate focused edit passes current and new regression gates",()=>{
 const next=change("hero",{text:"Nova chamada"});
 assert.equal(auditUniversalRegressionState(site,next,["hero"]).ok,true);
 assert.equal(verifyUniversalEditResult(site,next,["hero"]).ok,true);
});
test("delivery 13: newly duplicated block IDs never pass",()=>{
 const next={...site,blocks:[...site.blocks,{...site.blocks[0]}]};
 assert.match(auditUniversalRegressionState(site,next,["hero"]).reason,/duplicados/);
 assert.equal(verifyUniversalEditResult(site,next,["hero"]).ok,false);
});
test("delivery 13: split section in otherwise contiguous page is detected",()=>{
 const b=site.blocks.slice();
 b.splice(4,0,{id:"split",type:"paragraph",section:"services",text:"fora de ordem"});
 assert.match(auditUniversalRegressionState(site,{...site,blocks:b},["split"]).reason,/fragmentada/);
});
test("delivery 13: adding section after protected terminal footer fails; adding before succeeds",()=>{
 const block={id:"new",type:"heading",section:"custom-team",text:"Equipe"};
 assert.equal(auditUniversalRegressionState(site,{...site,blocks:[...site.blocks,block]},["new"]).ok,false);
 assert.equal(auditUniversalRegressionState(site,{...site,blocks:[...site.blocks.slice(0,-1),block,site.blocks.at(-1)]},["new"]).ok,true);
});
test("delivery 13: invalid new URLs are never accepted for changed CTA or photo",()=>{
 assert.equal(auditUniversalRegressionState(site,change("photo",{src:"javascript:alert(1)"}),["photo"]).ok,false);
 assert.equal(auditUniversalRegressionState(site,change("cta",{href:"javascript:alert(1)"}),["cta"]).ok,false);
});
test("delivery 13: old visible untouched blocks become compact regression sentinels",()=>{
 const before=root([el("services","Serviços"),el("photo","",{img:img("https://example.com/old.jpg")}),
  el("cta","Contato",{a:a("https://example.com")})]);
 const s=captureUniversalRegressionSentinels(before,win,site,change("hero",{text:"Outro"}),["hero"]);
 assert.equal(s.length,3);
 assert.equal(s.some(x=>x.id==="hero"),false);
 assert.equal(auditUniversalRegressionSentinels(before,win,s).ok,true);
});
test("delivery 13: unrelated text and CTA links changing in the preview are rejected",()=>{
 const before=root([el("services","Serviços"),el("cta","Contato",{a:a("https://example.com")})]);
 const s=captureUniversalRegressionSentinels(before,win,site,change("hero",{text:"Outro"}),["hero"]);
 assert.equal(auditUniversalRegressionSentinels(root([el("services","Mudou"),el("cta","Contato",{a:a("https://example.com")})]),win,s).ok,false);
 assert.equal(auditUniversalRegressionSentinels(root([el("services","Serviços"),el("cta","Contato",{a:a("https://wrong.example")})]),win,s).ok,false);
});
test("delivery 13: missing, duplicated, broken image sentinel fails; invisible baseline is neutral",()=>{
 const before=root([el("photo","",{img:img("https://example.com/old.jpg")})]);
 const s=captureUniversalRegressionSentinels(before,win,site,change("hero",{text:"Outro"}),["hero"]);
 assert.equal(auditUniversalRegressionSentinels(root([]),win,s).ok,false);
 assert.equal(auditUniversalRegressionSentinels(root([el("photo","",{img:img("https://example.com/old.jpg")}),el("photo","",{img:img("https://example.com/old.jpg")})]),win,s).ok,false);
 assert.equal(auditUniversalRegressionSentinels(root([el("photo","",{img:img("https://example.com/old.jpg",false)})]),win,s).ok,false);
 assert.deepEqual(captureUniversalRegressionSentinels(root([]),win,site,change("hero",{text:"Outro"}),["hero"]),[]);
});
test("delivery 13: preflight and visual regression guard are connected to learning verdict",()=>{
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 const verify=readFileSync(new URL("../src/lib/builder-v2-universal-learning.ts",import.meta.url),"utf8");
 assert.match(verify,/auditUniversalRegressionState\(before,after,changedIds\)/);
 assert.match(page,/captureUniversalRegressionSentinels\(/);
 assert.match(page,/auditUniversalRegressionSentinels\(/);
 assert.match(page,/regressionSentinels:/);
 assert.match(page,/recordEditorLearningEvent\(pending\.niche,pending\.prompt,"rejected"/);
});
