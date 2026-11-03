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

test("remove section by its visible heading",()=>{
 const result=applyUniversalNaturalLanguage(site(),"Remova a seção Serviços");
 assert.equal(result?.ok,true);
 if(!result?.ok)return;
 assert.deepEqual(result.site.blocks.map(b=>b.id),["h","cta","f"]);
});
test("move section by its visible heading",()=>{
 const result=applyUniversalNaturalLanguage(site(),"Mova a seção Serviços depois da seção FAQ");
 assert.equal(result?.ok,true);
 if(!result?.ok)return;
 assert.deepEqual(result.site.blocks.map(b=>b.id),["h","cta","f","s","c1"]);
});
test("ambiguous visible headings must never remove a section",()=>{
 const original=site();
 original.blocks.push({id:"duplicate",type:"heading",section:"second-services",text:"Serviços"});
 const before=structuredClone(original);
 const result=applyUniversalNaturalLanguage(original,"Remova a seção Serviços");
 assert.equal(result?.ok,false);
 assert.deepEqual(original,before);
});

test("change image by ID without touching other blocks",()=>{
 const original=site();original.blocks.push({id:"photo",type:"image",section:"hero",src:"https://example.com/old.jpg"});
 const result=applyUniversalNaturalLanguage(original,"Troque a imagem do bloco id photo para https://example.com/new.jpg");
 assert.equal(result?.ok,true);if(!result?.ok)return;
 assert.equal(result.site.blocks.at(-1).src,"https://example.com/new.jpg");
 assert.equal(original.blocks.at(-1).src,"https://example.com/old.jpg");
});
test("reject unsafe image URLs and wrong block types",()=>{
 const original=site();
 assert.equal(applyUniversalNaturalLanguage(original,"Troque a imagem do bloco id h para https://example.com/photo.jpg")?.ok,false);
 assert.equal(applyUniversalNaturalLanguage(original,"Troque a imagem do bloco id h para javascript:alert(1)"),null);
});
test("edit block color and alignment",()=>{
 const color=applyUniversalNaturalLanguage(site(),"Altere a cor do bloco id h para #111111");
 assert.equal(color?.ok,true);if(color?.ok)assert.equal(color.site.blocks[0].color,"#111111");
 const alignment=applyUniversalNaturalLanguage(site(),"Altere o alinhamento do bloco id h para centro");
 assert.equal(alignment?.ok,true);if(alignment?.ok)assert.equal(alignment.site.blocks[0].align,"center");
});
test("edit button label by its unique current text",()=>{
 const result=applyUniversalNaturalLanguage(site(),'Troque o texto do botão "Contato" para "Fale conosco"');
 assert.equal(result?.ok,true);if(result?.ok)assert.equal(result.site.blocks[1].text,"Fale conosco");
});

test("chat response preserves explicit hero and media settings",()=>{
 const editor=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 for(const key of ["heroPresentation","heroComposition","heroBannerCopy","sectionMediaLayouts","sectionMediaManaged"]){
  assert.ok(editor.includes("incoming."+key+"??site."+key),key+" should retain server changes");
 }
});
test("builder draft is persisted and rehydrated from the active storage key",()=>{
 const editor=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(editor,/localStorage\.setItem\(activeStorageKey,JSON\.stringify\(site\)\)/);
 assert.match(editor,/localStorage\.getItem\(key\)/);
});

test("publishing supports a valid existing site after section removal",()=>{
 const editor=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(editor,/if\(publishing\|\|busy\|\|site\.blocks\.length<1\)return;/);
 assert.match(editor,/body:JSON\.stringify\(\{site:current\}\)/);
});

test("server publication accepts valid edited sites with fewer than four blocks",()=>{
 const route=readFileSync(new URL("../src/app/api/builder-v2/publish/route.ts",import.meta.url),"utf8");
 assert.doesNotMatch(route,/site\.blocks\.length<4/);
 assert.match(route,/site\.blocks\.length<1/);
 assert.match(route,/site:snapshot/);
 assert.match(route,/storage\.upload\(slug\+"\.json"/);
});

test("public site renderer accepts the same minimum block count as publication API",()=>{
 const page=readFileSync(new URL("../src/app/site/[slug]/page.tsx",import.meta.url),"utf8");
 assert.match(page,/payload\.site\.blocks\.length<1/);
 assert.doesNotMatch(page,/payload\.site\.blocks\.length<4/);
 assert.match(page,/<BuilderV2Site site=\{publishedSite\}/);
});

test("TP3 model 01 hero consumes edited heading, image and CTA blocks",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp3-model1.tsx",import.meta.url),"utf8");
 assert.match(component,/heroHeading\|\|/);
 assert.match(component,/src=\{heroImage\|\|image\(0\)\}/);
 assert.match(component,/href=\{heroButton\?\.href\|\|"#especialidades"\}/);
 assert.match(component,/heroButton\?\.text\|\|/);
});

test("TP3 model 01 uses section-scoped editable content with design fallbacks",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp3-model1.tsx",import.meta.url),"utf8");
 assert.match(component,/const specialtyBlocks=sectionBlocks/);
 assert.match(component,/const historyBlocks=sectionBlocks/);
 assert.match(component,/const galleryBlocks=sectionBlocks/);
 assert.match(component,/specialtyImages\[i\]\|\|image\(i\+1\)/);
 assert.match(component,/sectionText\(historyBlocks,"paragraph"\)/);
 assert.match(component,/galleryImages\[\[6,7,3\]\.indexOf\(i\)\]/);
});
