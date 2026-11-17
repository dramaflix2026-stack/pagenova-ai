import assert from "node:assert/strict";
import test from "node:test";
import {planUniversalVisualProof,auditUniversalVisualProof} from "../src/lib/builder-v2-editor-visual-proof.ts";

const original={blocks:[
 {id:"hero-title",section:"hero",type:"heading",text:"Título antigo",color:"#111111",align:"left"},
 {id:"hero-photo",section:"hero",type:"image",src:"https://example.com/old.jpg"},
 {id:"services-title",section:"services",type:"heading",text:"Nossos serviços"}
]};
const changed=(id,changes)=>({...original,blocks:original.blocks.map(block=>block.id===id?{...block,...changes}:block)});
const plan=(before,after,ids)=>{const result=planUniversalVisualProof(before,after,ids);assert.equal(result.ok,true,JSON.stringify(result));return result.contract;};

test("delivery 6 — text, color, image and alignment create separate obligations",()=>{
 const cases=[
  ["hero-title",{text:"Título novo"},"block-text"],
  ["hero-title",{color:"#FFFFFF"},"block-color"],
  ["hero-photo",{src:"https://example.com/new.jpg"},"block-image"],
  ["hero-title",{align:"center"},"block-align"]
 ];
 for(const [id,changes,kind] of cases)assert.equal(plan(original,changed(id,changes),[id]).tasks[0].kind,kind);
});
test("delivery 6 — new section must prove its title, card count, and relative position",()=>{
 const after={...original,blocks:[...original.blocks,{id:"custom-title",section:"custom-process",type:"heading",text:"Nosso Processo"},
  {id:"card-1",section:"custom-process",type:"heading",text:"Primeira etapa"},
  {id:"card-body",section:"custom-process",type:"paragraph",text:"Descrição"}]};
 const contract=plan(original,after,["custom-title","card-1","card-body"]);
 assert.equal(contract.tasks.length,1);assert.equal(contract.tasks[0].kind,"section-new");
 assert.deepEqual(contract.tasks[0].cardTitles,["Primeira etapa"]);
});
test("delivery 6 — removed section requires absence in the DOM",()=>{
 const after={...original,blocks:original.blocks.filter(b=>b.section!=="services")};
 assert.equal(plan(original,after,["services-title"]).tasks[0].kind,"section-absent");
});
test("delivery 6 — no proof for nonvisual JSON metadata or unrelated IDs",()=>{
 assert.equal(planUniversalVisualProof(original,changed("hero-title",{imageExplicit:true}),["hero-title"]).ok,false);
 assert.equal(planUniversalVisualProof(original,original,["missing"]).ok,false);
});
const makeEl=(id,text,color="rgb(255, 255, 255)")=>({
 id:"",tagName:"H2",textContent:text,
 getAttribute:key=>key==="data-block-id"?id:null,
 getClientRects:()=>[{}],querySelectorAll:()=>[],
 styleColor:color,parentElement:null
});
const makeRoot=(blocks=[])=>({querySelectorAll:selector=>selector==="[data-block-id]"?blocks:[]});
const win={getComputedStyle:element=>({display:"block",visibility:"visible",color:element.styleColor,
 backgroundColor:element.styleColor,textAlign:"left"})};
test("delivery 6 — failed DOM/text is rejected, not silently recorded applied",()=>{
 const contract=plan(original,changed("hero-title",{text:"Título novo"}),["hero-title"]);
 assert.equal(auditUniversalVisualProof(makeRoot([]),win,contract).ok,false);
 assert.equal(auditUniversalVisualProof(makeRoot([makeEl("hero-title","Título antigo")]),win,contract).ok,false);
 assert.equal(auditUniversalVisualProof(makeRoot([makeEl("hero-title","Título novo")]),win,contract).ok,true);
 assert.equal(auditUniversalVisualProof(makeRoot([makeEl("hero-title","Título novo"),makeEl("hero-title","Título novo")]),win,contract).ok,false);
});
test("delivery 6 — actual computed color is authoritative",()=>{
 const contract=plan(original,changed("hero-title",{color:"#FFFFFF"}),["hero-title"]);
 assert.equal(auditUniversalVisualProof(makeRoot([makeEl("hero-title","Título antigo","rgb(255, 255, 255)")]),win,contract).ok,true);
 assert.equal(auditUniversalVisualProof(makeRoot([makeEl("hero-title","Título antigo","rgb(0, 0, 0)")]),win,contract).ok,false);
});
test("delivery 6 — image must match source AND be loaded",()=>{
 const contract=plan(original,changed("hero-photo",{src:"https://example.com/new.jpg"}),["hero-photo"]);
 const image=makeEl("hero-photo","");
 image.tagName="IMG";image.complete=false;image.naturalWidth=0;
 image.getAttribute=key=>key==="data-block-id"?"hero-photo":key==="src"?"https://example.com/new.jpg":null;
 assert.equal(auditUniversalVisualProof(makeRoot([image]),win,contract).ok,false);
 image.complete=true;image.naturalWidth=900;
 assert.equal(auditUniversalVisualProof(makeRoot([image]),win,contract).ok,true);
});
