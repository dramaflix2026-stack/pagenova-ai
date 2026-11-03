import {readFileSync} from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import {applyUniversalOperations} from "../src/lib/builder-v2-universal-operations.ts";
const site=()=>({templateId:"prompt-adaptive",briefingLayoutVariant:"03",blocks:[
 {id:"h",type:"heading",section:"hero",text:"Original"},
 {id:"cta",type:"button",section:"hero",text:"Contato",href:"#contact"},
 {id:"s",type:"heading",section:"services",text:"Serviços"},
 {id:"c1",type:"paragraph",section:"services",text:"Card 1"},
 {id:"f",type:"heading",section:"faq",text:"FAQ"}
]});
test("atomic multi-operation edits preserve template and untouched blocks",()=>{
 const original=site();const before=structuredClone(original);
 const result=applyUniversalOperations(original,[{action:"update",blockId:"h",changes:{text:"Novo título"}},{action:"remove",blockId:"f"},{action:"add",block:{id:"c2",type:"paragraph",section:"services",text:"Card 2"},afterId:"c1"}]);
 assert.equal(result.ok,true);if(!result.ok)return;
 assert.equal(result.site.templateId,"prompt-adaptive");assert.equal(result.site.briefingLayoutVariant,"03");
 assert.deepEqual(result.site.blocks.find(b=>b.id==="cta"),original.blocks[1]);
 assert.deepEqual(original,before);assert.deepEqual(result.site.blocks.map(b=>b.id),["h","cta","s","c1","c2"]);
});
test("failed batch never applies earlier edits",()=>{
 const original=site();const before=structuredClone(original);
 const result=applyUniversalOperations(original,[{action:"update",blockId:"h",changes:{text:"Changed"}},{action:"remove",blockId:"missing"}]);
 assert.equal(result.ok,false);assert.deepEqual(original,before);
});
test("reject unsafe links and immutable ids",()=>{
 assert.equal(applyUniversalOperations(site(),[{action:"update",blockId:"cta",changes:{href:"javascript:alert(1)"}}]).ok,false);
 assert.equal(applyUniversalOperations(site(),[{action:"update",blockId:"h",changes:{id:"other"}}]).ok,false);
});
test("section movement preserves the order of its blocks",()=>{
 const result=applyUniversalOperations(site(),[{action:"move-section",sectionId:"hero",afterSectionId:"faq"}]);
 assert.equal(result.ok,true);if(result.ok)assert.deepEqual(result.site.blocks.map(b=>b.id),["s","c1","f","h","cta"]);
});

test("chat route dispatches structured operations before legacy edits",()=>{
 const source=readFileSync(new URL("../src/app/api/builder-v2/chat/route.ts",import.meta.url),"utf8");
 assert.ok(source.includes("applyUniversalOperations("));
 assert.ok(source.indexOf("if(!isFresh&&!fullSiteBrief&&body.universalOperations!==undefined)")<source.indexOf("// Atomic edits for the most common chat commands."));
 assert.match(source,/if\(!result\.ok\)return NextResponse\.json\(\{error:result\.error\},\{status:422\}\)/);
});
