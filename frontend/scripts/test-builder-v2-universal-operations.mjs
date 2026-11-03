import {applyUniversalNaturalLanguage} from "../src/lib/builder-v2-universal-language.ts";
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

test("quoted text changes only its unique block across template variants",()=>{
 for(const variant of ["01","02","03"]){
  const original=site();original.briefingLayoutVariant=variant;
  const result=applyUniversalNaturalLanguage(original,'Troque o texto "Original" por "Nova capa"');
  assert.equal(result?.ok,true);
  if(result?.ok){assert.equal(result.site.blocks[0].text,"Nova capa");assert.deepEqual(result.site.blocks[1],original.blocks[1]);}
 }
});
test("ambiguous text refuses to guess and preserves source",()=>{
 const original=site();original.blocks.push({id:"duplicate",type:"heading",section:"other",text:"Original"});
 const before=structuredClone(original);
 const result=applyUniversalNaturalLanguage(original,'Troque o texto "Original" por "Novo"');
 assert.equal(result?.ok,false);assert.deepEqual(original,before);
});
test("unknown instructions fall through without inventing edits",()=>{
 assert.equal(applyUniversalNaturalLanguage(site(),"Deixe o site mais premium"),null);
});

test("CTA link keeps full HTTPS URL including query and fragment",()=>{
 const original=site();
 const url="https://example.com/agendar?origem=site&campanha=abc#contato";
 const result=applyUniversalNaturalLanguage(original,'Altere o link do botão "Contato" para "'+url+'"');
 assert.equal(result?.ok,true);
 if(result?.ok)assert.equal(result.site.blocks.find(b=>b.id==="cta").href,url);
});
test("unsafe CTA URL is never accepted",()=>{
 const result=applyUniversalNaturalLanguage(site(),'Altere o link do botão "Contato" para "javascript:alert(1)"');
 assert.equal(result,null);
});

test("new blocks reject unsafe destinations without mutating the site",()=>{
 const original=site();const snapshot=structuredClone(original);
 for(const block of [{id:"bad1",type:"button",href:"javascript:alert(1)"},{id:"bad2",type:"image",src:"javascript:alert(1)"}]){
  const result=applyUniversalOperations(original,[{action:"add",block}]);
  assert.equal(result.ok,false);assert.deepEqual(original,snapshot);
 }
});

test("editor accepts existing-site edits with fewer than four blocks",()=>{
 const editor=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(editor,/creatingNewSite\s*\?\s*data\.site\.blocks\.length\s*<\s*4\s*:\s*data\.site\.blocks\.length\s*<\s*1/);
});
test("shared preview renderer preserves section order from edited blocks",()=>{
 const renderer=readFileSync(new URL("../src/components/builder-v2-site.tsx",import.meta.url),"utf8");
 assert.match(renderer,/const sections = previewBlocks\.reduce/);
 assert.match(renderer,/else acc\.push\(\{id,blocks:\[block\]\}\)/);
});

test("natural language removes an explicit section without altering others",()=>{
 const original=site();
 const result=applyUniversalNaturalLanguage(original,"Remova a seção id services");
 assert.equal(result?.ok,true);
 if(!result?.ok)return;
 assert.deepEqual(result.site.blocks.map(b=>b.id),["h","cta","f"]);
 assert.equal(original.blocks.length,5);
});
test("natural language moves an explicit section after another",()=>{
 const result=applyUniversalNaturalLanguage(site(),"Mova a seção id hero depois da seção id faq");
 assert.equal(result?.ok,true);
 if(!result?.ok)return;
 assert.deepEqual(result.site.blocks.map(b=>b.id),["s","c1","f","h","cta"]);
});
test("unknown section moves fail atomically",()=>{
 const original=site();
 const result=applyUniversalNaturalLanguage(original,"Mova a seção id hero depois da seção id inexistente");
 assert.equal(result?.ok,false);
 assert.deepEqual(original,site());
});
