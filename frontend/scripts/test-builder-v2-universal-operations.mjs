import {applyUniversalNaturalLanguage} from "../src/lib/builder-v2-universal-language.ts";
import {resolveUniversalSection} from "../src/lib/builder-v2-universal-targets.ts";
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
 assert.equal(result?.ok,false);
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
 assert.equal(applyUniversalNaturalLanguage(original,"Troque a imagem do bloco id h para javascript:alert(1)")?.ok,false);
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

test("TP3 models 02 and 03 honor customer hero imagery and CTA",()=>{
 const second=readFileSync(new URL("../src/components/builder-v2-tp3-model2.tsx",import.meta.url),"utf8");
 const third=readFileSync(new URL("../src/components/builder-v2-tp3-model3.tsx",import.meta.url),"utf8");
 assert.match(second,/src=\{heroImage\|\|photo\(0\)\}/);
 assert.match(second,/href=\{heroButton\?\.href\|\|"#sabores"\}/);
 assert.match(third,/heroImage\|\|photo\(0\)/);
 assert.match(third,/href=\{heroButton\?\.href\|\|"#especialidades"\}/);
});

test("TP3 models 02 and 03 render section-scoped customer imagery",()=>{
 const second=readFileSync(new URL("../src/components/builder-v2-tp3-model2.tsx",import.meta.url),"utf8");
 const third=readFileSync(new URL("../src/components/builder-v2-tp3-model3.tsx",import.meta.url),"utf8");
 for(const component of [second,third]){
  assert.match(component,/const aboutImages=sectionImages/);
  assert.match(component,/const specialtyImages=sectionImages/);
  assert.match(component,/const galleryImages=sectionImages/);
  assert.match(component,/aboutImages\[0\]\|\|photo\(1\)/);
 }
 assert.match(second,/galleryImages\[i\]\|\|photo\(i\+6\)/);
 assert.match(third,/specialtyImages\[special\]\|\|photo\(special\+2\)/);
});

test("TP3 models 02 and 03 bind section-scoped copy without losing fallback layout",()=>{
 const second=readFileSync(new URL("../src/components/builder-v2-tp3-model2.tsx",import.meta.url),"utf8");
 const third=readFileSync(new URL("../src/components/builder-v2-tp3-model3.tsx",import.meta.url),"utf8");
 for(const component of [second,third]){
  assert.match(component,/const aboutTitle=sectionText/);
  assert.match(component,/const aboutDescription=sectionText/);
  assert.match(component,/const specialtiesTitle=sectionText/);
  assert.match(component,/aboutTitle\|\|/);
  assert.match(component,/aboutDescription\|\|/);
  assert.match(component,/specialtiesTitle\|\|/);
 }
 assert.match(second,/galleryTitle\|\|/);
});

test("unsafe image edit never falls through to the legacy chat engine",()=>{
 const original=site();original.blocks.push({id:"photo",type:"image",section:"hero",src:"https://example.com/safe.png"});
 const before=structuredClone(original);
 const result=applyUniversalNaturalLanguage(original,'Troque a imagem do bloco id photo para javascript:alert(1)');
 assert.equal(result?.ok,false);
 assert.deepEqual(original,before);
});
test("safe image edit is applied atomically",()=>{
 const original=site();original.blocks.push({id:"photo",type:"image",section:"hero",src:"https://example.com/old.png"});
 const result=applyUniversalNaturalLanguage(original,'Troque a imagem do bloco id photo para https://example.com/new.png');
 assert.equal(result?.ok,true);
 if(result?.ok)assert.equal(result.site.blocks.find(b=>b.id==="photo").src,"https://example.com/new.png");
});

test("explicit block link updates preserve query parameters",()=>{
 const url="https://example.com/order?src=chat&plan=1";
 const result=applyUniversalNaturalLanguage(site(),"Altere o link do botão id cta para "+url);
 assert.equal(result?.ok,true);
 if(result?.ok)assert.equal(result.site.blocks.find(b=>b.id==="cta").href,url);
});
test("explicit block link refuses unsafe destination",()=>{
 const result=applyUniversalNaturalLanguage(site(),"Altere o link do botão id cta para javascript:alert(1)");
 assert.equal(result?.ok,false);
});
test("font size edit validates supported range",()=>{
 const good=applyUniversalNaturalLanguage(site(),"Defina o tamanho da fonte do bloco id h para 48px");
 assert.equal(good?.ok,true);
 if(good?.ok)assert.equal(good.site.blocks.find(b=>b.id==="h").fontSize,48);
 const bad=applyUniversalNaturalLanguage(site(),"Defina o tamanho da fonte do bloco id h para 200px");
 assert.equal(bad?.ok,false);
});

test("universal editor rejects invalid mobile typography, columns and borders",()=>{
 const original=site();const before=structuredClone(original);
 for(const changes of [{mobileFontSize:4},{mobileFontSize:200},{columns:0},{columns:13},{columns:2.5},{cardBorderWidth:-1},{cardBorderWidth:25}]){
  const result=applyUniversalOperations(original,[{action:"update",blockId:"h",changes}]);
  assert.equal(result.ok,false);
  assert.deepEqual(original,before);
 }
 const valid=applyUniversalOperations(original,[{action:"update",blockId:"h",changes:{mobileFontSize:16,columns:3,cardBorderWidth:2}}]);
 assert.equal(valid.ok,true);
});

function completeSite(){
 return {...site(),motion:{enabled:true},cinematic:{mode:"immersive-3d",videoUrl:"https://example.com/approved.mp4"},header:{brand:"Marca cadastrada"},footer:{address:"Endereço fornecido"},blocks:[
  {id:"h",type:"heading",section:"hero",text:"Original",color:"#fff",align:"left"},
  {id:"description",type:"paragraph",section:"hero",text:"Descrição anterior"},
  {id:"photo",type:"image",section:"hero",src:"https://example.com/approved.png",mobileSrc:"https://example.com/mobile.png"},
  {id:"cta",type:"button",section:"hero",text:"Contato",href:"#contact"},
  {id:"s",type:"heading",section:"services",text:"Serviços"},
  {id:"card",type:"paragraph",section:"services",text:"Projeto: descrição cadastrada"},
  {id:"testimonials",type:"heading",section:"testimonials",text:"Depoimentos dos clientes"},
  {id:"review",type:"paragraph",section:"testimonials",text:"Relato fornecido pelo cliente"},
  {id:"f",type:"heading",section:"faq",text:"Perguntas frequentes"},
  {id:"answer",type:"paragraph",section:"faq",text:"Como funciona? Consulte a equipe."},
  {id:"contact",type:"heading",section:"contact",text:"Entre em contato"}
 ]};
}

test("semantic Portuguese edit batch applies every clause and preserves unrelated content in all identities",()=>{
 for(const templateId of ["institutional-complete","minimalist-sophisticated","prompt-adaptive"]){
  for(const mode of ["static","cinematic","immersive-3d"]){
   const original=completeSite();original.templateId=templateId;original.cinematic.mode=mode;
   const before=structuredClone(original);
   const result=applyUniversalNaturalLanguage(original,'Troque a imagem da capa por https://example.com/new.png, altere o título da capa para "Uma nova experiência", deixe os botões pretos, remova os depoimentos, adicione uma galeria com https://example.com/gallery.png e mova o FAQ para antes do contato');
   assert.equal(result?.ok,true,result?.error);if(!result?.ok)continue;
   assert.equal(result.site.blocks.find(b=>b.id==="h").text,"Uma nova experiência");
   assert.equal(result.site.blocks.find(b=>b.id==="photo").src,"https://example.com/new.png");
   assert.equal(result.site.blocks.find(b=>b.id==="photo").mobileSrc,original.blocks[2].mobileSrc);
   assert.equal(result.site.blocks.find(b=>b.id==="cta").color,"#000000");
   assert.equal(result.site.blocks.some(b=>b.section==="testimonials"),false);
   assert.ok(result.site.blocks.some(b=>b.layout==="gallery"));
   assert.ok(result.site.blocks.findIndex(b=>b.id==="f")<result.site.blocks.findIndex(b=>b.id==="contact"));
   for(const key of ["motion","cinematic","header","footer","templateId"])assert.deepEqual(result.site[key],original[key]);
   assert.deepEqual(result.site.blocks.find(b=>b.id==="card"),original.blocks.find(b=>b.id==="card"));
   assert.deepEqual(original,before);
   assert.deepEqual(JSON.parse(JSON.stringify(result.site)),result.site);
  }
 }
});
test("batch failure or unsupported clause never commits partial edits",()=>{
 for(const suffix of ['remova a seção inexistente','deixe tudo lindo','troque a imagem da capa por javascript:alert(1)']){
  const original=completeSite(),before=structuredClone(original);
  const result=applyUniversalNaturalLanguage(original,'Troque o título da capa para "Novo" e '+suffix);
  assert.equal(result?.ok,false);assert.deepEqual(original,before);
 }
});
test("quoted copy and full URLs are not split into commands",()=>{
 const result=applyUniversalNaturalLanguage(completeSite(),'Troque o título da capa para "Crie, altere e deixe sua marca; mova ideias" e altere o link do botão "Contato" para "https://example.com/path?a=1&b=2#contato"');
 assert.equal(result?.ok,true,result?.error);
 if(result?.ok){assert.equal(result.site.blocks[0].text,"Crie, altere e deixe sua marca; mova ideias");assert.equal(result.site.blocks.find(b=>b.id==="cta").href,"https://example.com/path?a=1&b=2#contato");}
});
test("semantic section resolver refuses duplicate aliases and ambiguous image targets",()=>{
 const original=completeSite();original.blocks.push({id:"h2",type:"heading",section:"capa",text:"Outra capa"});
 assert.equal(applyUniversalNaturalLanguage(original,'Troque o título da capa para "Novo"')?.ok,true); // Exact section ID is explicit.
 original.blocks.push({id:"photo2",type:"image",section:"hero",src:"https://example.com/other.png"});
 assert.equal(applyUniversalNaturalLanguage(original,"Troque a imagem do hero por https://example.com/new.png")?.ok,false);
 original.blocks.push({id:"more-faq",type:"heading",section:"questions",text:"Dúvidas frequentes"});
 for(const block of original.blocks)if(block.section==="faq")block.section="questions-first";
 assert.equal(applyUniversalNaturalLanguage(original,"Remova a seção FAQ")?.ok,false);
});
test("semantic typography supports desktop and mobile without touching other sections",()=>{
 const original=completeSite();
 const result=applyUniversalNaturalLanguage(original,'Defina a fonte do título da capa para Poppins; defina o tamanho da fonte do título da capa para 64px; defina o tamanho da fonte mobile do título da capa para 32px; defina o alinhamento do título da capa para centro');
 assert.equal(result?.ok,true,result?.error);if(!result?.ok)return;
 assert.equal(result.site.blocks[0].fontFamily,"Poppins");assert.equal(result.site.blocks[0].fontSize,64);assert.equal(result.site.blocks[0].mobileFontSize,32);assert.equal(result.site.blocks[0].align,"center");
 assert.deepEqual(result.site.blocks.slice(1),original.blocks.slice(1));
});
test("new gallery uses provided images only and produces publishable block fields",()=>{
 const result=applyUniversalNaturalLanguage(completeSite(),'Adicione uma galeria "Projetos reais" com https://example.com/a.png https://example.com/b.png');
 assert.equal(result?.ok,true,result?.error);if(!result?.ok)return;
 const added=result.site.blocks.filter(b=>b.section==="galeria");assert.equal(added.length,3);assert.equal(added[0].text,"Projetos reais");
 for(const block of added){assert.equal(typeof block.text,"string");assert.equal(typeof block.color,"string");assert.equal(block.align,"left");}
 assert.equal(applyUniversalNaturalLanguage(completeSite(),"Adicione uma galeria com javascript:alert(1)")?.ok,false);
});
test("untrusted structured operations return validation errors rather than throwing",()=>{
 for(const operations of [[null],[{}],[1],[{action:"update",blockId:"h",changes:[]}],[{action:"update",blockId:"h",changes:{text:{bad:true}}}],[{action:"update",blockId:"cta",changes:{href:42}}],[{action:"add",block:{id:"bad",type:"script"}}],[{action:"add",block:{id:"bad",type:"heading",fontSize:200}}]]){
  assert.doesNotThrow(()=>assert.equal(applyUniversalOperations(completeSite(),operations).ok,false));
 }
});
test("URL normalization bypasses fail for added and updated media and links",()=>{
 for(const value of ["/\\evil.example/a","https://example.com/\npath","//evil.example/a","https://user:password@example.com/a"," https://example.com/a","javascript:alert(1)"]){
  for(const key of ["src","mobileSrc","href"]){
   assert.equal(applyUniversalOperations(completeSite(),[{action:"update",blockId:"photo",changes:{[key]:value}}]).ok,false,value);
   assert.equal(applyUniversalOperations(completeSite(),[{action:"add",block:{id:"new",type:"image",[key]:value}}]).ok,false,value);
  }
 }
});
test("section movement before anchor is atomic and retains whole-section order",()=>{
 const original=completeSite();
 const result=applyUniversalNaturalLanguage(original,"Mova o contato para antes do FAQ");
 assert.equal(result?.ok,true,result?.error);if(!result?.ok)return;
 assert.deepEqual(result.site.blocks.slice(-3).map(b=>b.id),["contact","f","answer"]);
 assert.equal(applyUniversalOperations(original,[{action:"move-section",sectionId:"hero",beforeSectionId:"hero"}]).ok,false);
});

test("runtime JSON validation rejects malformed operations atomically",()=>{
 const original=site(),before=structuredClone(original);
 for(const op of [null,42,[],{action:"update",blockId:"h",changes:{text:42}},{action:"update",blockId:"cta",changes:{href:null}},{action:"add",block:{id:"new",type:"script",text:"oops"}},{action:"add",block:{id:"new",type:"heading",fontSize:900}},{action:"add",block:{id:"new",type:"image",src:[]}}]){
  assert.doesNotThrow(()=>{assert.equal(applyUniversalOperations(original,[{action:"update",blockId:"h",changes:{text:"Do not save"}},op]).ok,false);});
  assert.deepEqual(original,before);
 }
});
test("URLs reject backslash redirects, controls, malformed hosts and credentials",()=>{
 for(const href of ["/\\evil.example","https://","https://user:pass@example.com","https://example.com/\npath","//evil.example"]){
  assert.equal(applyUniversalOperations(site(),[{action:"update",blockId:"cta",changes:{href}}]).ok,false,href);
 }
 for(const href of ["/contato?x=1#form","https://example.com/?x=1&y=2#form","mailto:contato@example.com","tel:+5511999999999"]){
  assert.equal(applyUniversalOperations(site(),[{action:"update",blockId:"cta",changes:{href}}]).ok,true,href);
 }
});
const remoteCompleteSite=()=>({...site(),cinematic:{mode:"immersive-3d",desktopUrl:"https://example.com/video.mp4"},extras:{bakery3d:{heroImage:"https://example.com/3d.png"}},blocks:[
 ...site().blocks,{id:"image",type:"image",section:"hero",src:"https://example.com/old.jpg"},
 {id:"reviews",type:"heading",section:"testimonials",text:"Depoimentos"},
 {id:"contact",type:"heading",section:"contact",text:"Entre em contato"}
]});
test("combined natural language applies every clause and preserves visual identity",()=>{
 const original=remoteCompleteSite(),before=structuredClone(original);
 const result=applyUniversalNaturalLanguage(original,'Troque a imagem da capa por https://example.com/new.jpg, altere o título da capa para "Nova capa", deixe os botões pretos, remova os depoimentos, adicione uma galeria com https://example.com/g1.jpg https://example.com/g2.jpg e mova o FAQ para antes do contato');
 assert.equal(result?.ok,true,JSON.stringify(result));if(!result?.ok)return;
 assert.equal(result.site.blocks.find(b=>b.id==="image").src,"https://example.com/new.jpg");
 assert.equal(result.site.blocks.find(b=>b.id==="h").text,"Nova capa");
 assert.equal(result.site.blocks.find(b=>b.id==="cta").color,"#000000");
 assert.ok(!result.site.blocks.some(b=>b.section==="testimonials"));
 assert.equal(result.site.blocks.filter(b=>b.section==="galeria"&&b.type==="image").length,2);
 const order=[...new Set(result.site.blocks.map(b=>b.section))];
 assert.equal(order.indexOf("faq"),order.indexOf("contact")-1);
 assert.deepEqual(result.site.cinematic,original.cinematic);assert.deepEqual(result.site.extras,original.extras);
 assert.deepEqual(result.site.blocks.find(b=>b.id==="c1"),original.blocks.find(b=>b.id==="c1"));
 assert.deepEqual(original,before);
 const restored=JSON.parse(JSON.stringify(result.site));assert.deepEqual(restored,result.site);
});
test("unsupported or ambiguous clause rolls back the entire combined request",()=>{
 const original=remoteCompleteSite(),before=structuredClone(original);
 for(const instruction of ['Altere o título da capa para "Changed" e adicione uma galeria','Altere o título da capa para "Changed", remova os depoimentos e configure algo desconhecido']){
  const result=applyUniversalNaturalLanguage(original,instruction);assert.equal(result?.ok,false);assert.deepEqual(original,before);
 }
 original.blocks.push({id:"image2",type:"image",section:"hero",src:"https://example.com/second.jpg"});
 assert.equal(applyUniversalNaturalLanguage(original,'Altere o título da capa para "Changed" e troque a imagem da capa por https://example.com/new.jpg')?.ok,false);
});
test("quoted customer copy containing verbs and commas is never split",()=>{
 const result=applyUniversalNaturalLanguage(remoteCompleteSite(),'Altere o título da capa para "Descubra, crie e mude seu futuro" e remova os depoimentos');
 assert.equal(result?.ok,true);if(result?.ok)assert.equal(result.site.blocks[0].text,"Descubra, crie e mude seu futuro");
});
test("named section matching refuses collisions and respects exact headings",()=>{
 const original=remoteCompleteSite();original.blocks.push({id:"other-faq",type:"heading",section:"other-faq",text:"Perguntas frequentes"});
 // A precise ID is stronger than a broad alias; a duplicated visible title is ambiguous.
 assert.equal(applyUniversalNaturalLanguage(original,"Mova FAQ antes do contato")?.ok,true);
 original.blocks.push({id:"other-faq2",type:"heading",section:"other-faq2",text:"Perguntas frequentes"});
 assert.equal(applyUniversalNaturalLanguage(original,"Mova perguntas frequentes antes do contato")?.ok,false);
});
test("new blocks receive publication-compatible defaults and explicit color metadata",()=>{
 const result=applyUniversalOperations(site(),[{action:"add",block:{id:"new",type:"heading",text:"Nova seção",section:"new"}},{action:"update",blockId:"h",changes:{color:"#000000"}}]);
 assert.equal(result.ok,true);if(!result.ok)return;
 const added=result.site.blocks.at(-1);assert.equal(added.align,"left");assert.equal(added.color,"#171c19");assert.equal(result.site.blocks[0].colorExplicit,true);
});
test("universal dispatcher precedes editor shortcuts and edited short sites can publish",()=>{
 const editor=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.ok(editor.indexOf("const result=hasAttachments?null:applyUniversalNaturalLanguage(site,prompt)")<editor.indexOf("const socialEdit="));
 assert.match(editor,/disabled=\{publishing\|\|busy\|\|site\.blocks\.length<1\}/);
});

test("structural renderer events persist through JSON and roll back with failed batches",()=>{
 const original=completeSite();
 const removed=applyUniversalOperations(original,[{action:"remove-section",sectionId:"faq"}]);
 assert.equal(removed.ok,true);if(!removed.ok)return;
 assert.deepEqual(removed.site.universalSectionEvents,[{action:"remove",section:{id:"faq",label:"Perguntas frequentes"}}]);
 assert.deepEqual(JSON.parse(JSON.stringify(removed.site)),removed.site);
 const restored=applyUniversalOperations(removed.site,[{action:"add",block:{id:"faq-restored",type:"heading",section:"faq",text:"FAQ atualizado"}}]);
 assert.equal(restored.ok,true);if(restored.ok)assert.equal(restored.site.universalSectionEvents.at(-1).action,"restore");
 const before=structuredClone(removed.site);
 assert.equal(applyUniversalOperations(removed.site,[{action:"move-section",sectionId:"hero",beforeSectionId:"contact"},{action:"remove",blockId:"missing"}]).ok,false);
 assert.deepEqual(removed.site,before);
});
test("JSON objects cannot masquerade as layout, alignment or image fit",()=>{
 for(const key of ["align","layout","imageFit","fontFamily","color"]){
  const changes=JSON.parse('{"'+key+'":{"toString":"center"}}');
  assert.doesNotThrow(()=>assert.equal(applyUniversalOperations(completeSite(),[{action:"update",blockId:"h",changes}]).ok,false));
 }
});

test("adding a paragraph restores a previously removed section",()=>{
 const removed=applyUniversalOperations(site(),[{action:"remove-section",sectionId:"services"}]);
 assert.equal(removed.ok,true);
 if(!removed.ok)return;
 const restored=applyUniversalOperations(removed.site,[{action:"add",block:{id:"new-service",type:"paragraph",section:"services",text:"Serviço novo"}}]);
 assert.equal(restored.ok,true);
 if(!restored.ok)return;
 assert.equal(restored.site.blocks.find(b=>b.id==="new-service")?.text,"Serviço novo");
 assert.equal(restored.site.universalSectionEvents?.at(-1)?.action,"restore");
 assert.equal(restored.site.universalSectionEvents?.at(-1)?.section.id,"services");
});
test("latest removal takes precedence over earlier restore events",()=>{
 const original=site();
 original.universalSectionEvents=[
  {action:"remove",section:{id:"services"}},
  {action:"restore",section:{id:"services"}},
  {action:"remove",section:{id:"services"}}
 ];
 const result=applyUniversalOperations(original,[{action:"add",block:{id:"new-service",type:"paragraph",section:"services",text:"Novo"}}]);
 assert.equal(result.ok,true);
 if(result.ok)assert.equal(result.site.universalSectionEvents.at(-1).action,"restore");
});

test("TP1 model 02 hero uses section-scoped universal copy and button bindings",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 assert.match(component,/const heroBlocks=site\.blocks\.filter/);
 assert.match(component,/const headingBlock=heroBlocks\.find/);
 assert.match(component,/const descriptionBlock=heroBlocks\.find/);
 assert.match(component,/const heroButton=heroBlocks\.find/);
 assert.match(component,/universalBlockProps\(headingBlock\)/);
 assert.match(component,/universalBlockProps\(descriptionBlock\)/);
 assert.match(component,/universalBlockProps\(heroButton,true\)/);
 assert.match(component,/<UniversalTypographyRules\/>/);
});

test("TP1 model 02 uses customer hero image and universal FAQ without changing its composition",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 assert.match(component,/const heroImage=heroBlocks\.find/);
 assert.match(component,/src=\{heroImage\?\.src\|\|photo\.photo\}/);
 assert.match(component,/universalBlockProps\(heroImage\)/);
 assert.match(component,/const faqItems=universalFaqItems\(site\.blocks,/);
 assert.match(component,/faqItems\.map\(\(\[question,answer\],index\)/);
});

test("TP1 model 02 renders customer images in about and gallery sections",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 assert.match(component,/const aboutImages=aboutBlocks\.filter/);
 assert.match(component,/const galleryImages=galleryBlocks\.filter/);
 assert.match(component,/aboutImages\[0\]\?\.src\|\|photoWithEssence\.essence/);
 assert.match(component,/aboutImages\[1\]\?\.src\|\|photoWithEssence\.detail/);
 assert.match(component,/galleryImages\[index\]\?\.src\|\|/);
 assert.match(component,/universalBlockProps\(galleryImages\[index\]\)/);
});

test("TP1 model 02 binds about and gallery text to section-scoped blocks",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 for(const name of ["aboutHeading","aboutParagraphs","galleryHeading","galleryDescription"])assert.ok(component.includes("universalBlockProps("+name+(name==="aboutParagraphs"?"[0]":"")+")")||name==="aboutParagraphs"&&component.includes("universalBlockProps(aboutParagraphs[1])"),name);
 assert.match(component,/aboutHeading\?\.text\?\.trim\(\)/);
 assert.match(component,/galleryHeading\?\.text\?\.trim\(\)/);
 assert.match(component,/galleryDescription\?\.text\?\.trim\(\)/);
});

test("TP1 model 02 services, differentiators and journey use universal text bindings",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 for(const name of ["servicesHeading","servicesDescription","differencesHeading","differencesDescription","differencesImage"])assert.ok(component.includes("universalBlockProps("+name+")"),name);
 assert.match(component,/id="tp1v2-journey-heading" \{\.\.\.universalBlockProps\(/);
 assert.match(component,/b\.section==="como-funciona"&&b\.type==="heading"/);
 assert.match(component,/b\.section==="como-funciona"&&b\.type==="paragraph"/);
});

test("TP1 model 02 contact introduction keeps universal editing with map and WhatsApp",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 assert.match(component,/id="tp1v2-contact-heading" \{\.\.\.universalBlockProps\(/);
 assert.match(component,/b\.section==="contato"&&b\.type==="heading"/);
 assert.match(component,/b\.section==="contato"&&b\.type==="paragraph"/);
 assert.match(component,/title="Mapa demonstrativo de localização"/);
 assert.match(component,/VISITE OU FALE CONOSCO/);
 assert.match(component,/https:\/\/wa\.me\//);
});

test("TP1 model 02 service and differentiator cards have editable content",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 assert.match(component,/servicesBlocks\.filter\(b=>b\.type==="image"/);
 assert.match(component,/b\.id!==servicesHeading\?\.id/);
 assert.match(component,/b\.id!==servicesDescription\?\.id/);
 assert.match(component,/b\.id!==differencesHeading\?\.id/);
 assert.match(component,/b\.id!==differencesDescription\?\.id/);
});

test("TP1 model 02 journey cards bind individual text and typography",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 assert.match(component,/tp1v2-journey-steps/);
 assert.match(component,/universalBlockProps\(site\.blocks\.filter\(b=>b\.section==="como-funciona"/);
 assert.match(component,/b\.id!==site\.blocks\.find\(x=>x\.section==="como-funciona"/);
});

test("TP1 service images preserve card index even with an empty image source",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 assert.match(component,/servicesBlocks\.filter\(b=>b\.type==="image"\)\[index\]/);
 assert.doesNotMatch(component,/servicesBlocks\.filter\(b=>b\.type==="image"&&b\.src\?\.trim\(\)\)\[index\]/);
});

test("TP1 service card images ignore blank URL strings without shifting slots",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 assert.match(component,/servicesBlocks\.filter\(b=>b\.type==="image"\)\[index\]\?\.src\?\.trim\(\)\|\|/);
});

test("TP1 about and gallery images keep stable media slots",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 assert.match(component,/const aboutImages=aboutBlocks\.filter\(b=>b\.type==="image"\)/);
 assert.match(component,/const galleryImages=galleryBlocks\.filter\(b=>b\.type==="image"\)/);
 assert.match(component,/aboutImages\[0\]\?\.src/);
 assert.match(component,/aboutImages\[1\]\?\.src/);
 assert.match(component,/galleryImages\[index\]\?\.src/);
});

test("TP1 hero keeps the image block identity when its source is empty",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 assert.match(component,/const heroImage=heroBlocks\.find\(b=>b\.type==="image"\)/);
 assert.match(component,/universalBlockProps\(heroImage\)/);
 assert.match(component,/heroImage\?\.src\|\|photo\.photo/);
});

test("TP1 differentiator image retains editable block identity without a URL",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 assert.match(component,/const differencesImage=differencesBlocks\.find\(b=>b\.type==="image"\)/);
 assert.match(component,/universalBlockProps\(differencesImage\)/);
 assert.match(component,/differencesImage\?\.src\|\|/);
});

test("universal chat edits survive JSON persistence and follow-up edits across all template variants",()=>{
 for(const variant of ["01","02","03"]){
  const original=site();
  original.briefingLayoutVariant=variant;
  const edited=applyUniversalOperations(original,[
   {action:"update",blockId:"h",changes:{text:"Capa personalizada",fontSize:48}},
   {action:"update",blockId:"cta",changes:{href:"https://example.com/contato?source=builder"}},
   {action:"add",block:{id:"img-custom",type:"image",section:"hero",src:"https://example.com/hero.webp"},afterId:"cta"},
   {action:"move-section",sectionId:"services",afterSectionId:"faq"}
  ]);
  assert.equal(edited.ok,true,"initial edit failed for "+variant);
  if(!edited.ok)continue;
  const reloaded=JSON.parse(JSON.stringify(edited.site));
  assert.equal(reloaded.briefingLayoutVariant,variant);
  assert.equal(reloaded.blocks.find(b=>b.id==="h").text,"Capa personalizada");
  assert.equal(reloaded.blocks.find(b=>b.id==="h").fontSize,48);
  assert.equal(reloaded.blocks.find(b=>b.id==="cta").href,"https://example.com/contato?source=builder");
  assert.equal(reloaded.blocks.find(b=>b.id==="img-custom").src,"https://example.com/hero.webp");
  assert.equal(reloaded.universalSectionEvents.at(-1).action,"move");
  const followUp=applyUniversalNaturalLanguage(reloaded,'Troque o texto "Capa personalizada" por "Capa final"');
  assert.equal(followUp?.ok,true,"follow-up failed for "+variant);
  if(followUp?.ok){
   assert.equal(followUp.site.blocks.find(b=>b.id==="h").text,"Capa final");
   assert.equal(followUp.site.blocks.find(b=>b.id==="img-custom").src,"https://example.com/hero.webp");
   assert.equal(followUp.site.blocks.find(b=>b.id==="cta").href,"https://example.com/contato?source=builder");
   assert.deepEqual(followUp.site.universalSectionEvents,reloaded.universalSectionEvents);
  }
  assert.equal(original.blocks.find(b=>b.id==="h").text,"Original");
 }
});

test("Builder chat preserves universal section history when legacy AI omits it",()=>{
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(page,/incoming\.universalSectionEvents=creatingNewSite\?undefined:\(incoming\.universalSectionEvents\?\?site\.universalSectionEvents\)/);
 const existing={universalSectionEvents:[{action:"move",section:{id:"services"},after:{id:"faq"}}]};
 const incoming={title:"Edited by AI"};
 const merged={...incoming,universalSectionEvents:incoming.universalSectionEvents??existing.universalSectionEvents};
 assert.deepEqual(merged.universalSectionEvents,existing.universalSectionEvents);
});

test("TP1 model 02 renders approved sections through universal remove/reorder wrapper",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 assert.match(component,/import \{UniversalTemplateSections\} from "\.\/builder-v2-universal-sections"/);
 assert.match(component,/<UniversalTemplateSections site=\{site\}>/);
 assert.match(component,/<\/UniversalTemplateSections>/);
 for(const section of ["inicio","sobre","servicos","diferenciais","como-funciona","galeria","depoimentos","faq","contato","trajetoria","rodape"]){
  assert.ok(component.includes('data-universal-section="'+section+'"'),"missing section "+section);
 }
});

test("salon niche aliases route consistently to TP1 without redirecting other families",async()=>{
 const {resolveBriefingFamily}=await import("../src/lib/briefing-template-families.ts");
 for(const niche of ["Salão de beleza","Salão de beleza feminino","Salão de beleza masculino","Salão de beleza premium"]){
  assert.equal(resolveBriefingFamily(niche),1,niche);
 }
 assert.equal(resolveBriefingFamily("Clínica médica"),4);
 assert.equal(resolveBriefingFamily("Restaurante"),3);
 assert.equal(resolveBriefingFamily("Loja de roupas"),6);
});

test("cloud version history is explicitly scoped to the authenticated user",()=>{
 const route=readFileSync(new URL("../src/app/api/builder-v2/versions/route.ts",import.meta.url),"utf8");
 assert.match(route,/\.select\("id,label,site,created_at"\)\.eq\("user_id", user\.id\)\.eq\("project_id", projectId\)/);
 assert.match(route,/user_id: user\.id, project_id: projectId/);
});

test("publishing preserves universal section events in the persisted snapshot",()=>{
 const route=readFileSync(new URL("../src/app/api/builder-v2/publish/route.ts",import.meta.url),"utf8");
 assert.match(route,/const snapshot:BuilderV2SiteData=JSON\.parse\(JSON\.stringify\(site\)\)/);
 assert.match(route,/site:snapshot,publishedAt/);
 const site={id:"publish-test",title:"Site teste",blocks:[{id:"hero",type:"heading",section:"inicio",text:"Título"}],
  universalSectionEvents:[{action:"remove",section:{id:"servicos"}},{action:"move",section:{id:"galeria"},before:{id:"sobre"}}]};
 const snapshot=JSON.parse(JSON.stringify(site));
 delete snapshot.publishedUrl;
 const payload=JSON.parse(JSON.stringify({version:2,ownerId:"owner",projectId:site.id,name:site.title,site:snapshot,publishedAt:"2026-11-03T00:00:00Z"}));
 assert.deepEqual(payload.site.universalSectionEvents,site.universalSectionEvents);
 assert.equal(payload.site.blocks[0].text,"Título");
});

test("shared universal section resolver recognizes common labels without depending on a template family",async()=>{
 const {resolveUniversalSection}=await import("../src/lib/builder-v2-universal-targets.ts");
 const site={blocks:["inicio","sobre","servicos","diferenciais","como-funciona","projetos","galeria","numeros","depoimentos","faq","contato","trajetoria","rodape"].map(section=>({id:section,section,type:"heading",text:section}))};
 for(const [label,expected] of [
  ["Nossos diferenciais","diferenciais"],["Como funciona","como-funciona"],
  ["Nosso processo","como-funciona"],["Projetos em destaque","projetos"],
  ["Resultados e números","numeros"],["Indicadores","numeros"],
  ["Nossa trajetória","trajetoria"],["Nossa história","trajetoria"],
  ["Perguntas frequentes","faq"],["Rodapé premium","rodape"]
 ])assert.equal(resolveUniversalSection(site,label),expected,label);
 assert.equal(resolveUniversalSection(site,"Seção inexistente"),null);
});

test("universal section resolver refuses ambiguous aliases and prioritizes exact section labels",async()=>{
 const {resolveUniversalSection,applyUniversalNamedLanguage}=await import("../src/lib/builder-v2-universal-targets.ts");
 const site={blocks:[
  {id:"gallery-a",type:"heading",section:"galeria",text:"Galeria"},
  {id:"gallery-b",type:"heading",section:"gallery",text:"Fotos da empresa"},
  {id:"about",type:"heading",section:"sobre",text:"Nossa história"},
  {id:"history",type:"heading",section:"trajetoria",text:"Nossa trajetória"}
 ]};
 assert.equal(resolveUniversalSection(site,"fotos"),null,"two gallery aliases must not pick an arbitrary section");
 assert.equal(resolveUniversalSection(site,"galeria"),"galeria","exact ID must win over a second alias");
 assert.equal(resolveUniversalSection(site,"nossa história"),"sobre","exact heading must win over history alias");
 const before=JSON.stringify(site);
 const result=applyUniversalNamedLanguage(site,"Mova fotos antes de sobre");
 assert.equal(result?.ok,false,"ambiguous movement must be rejected");
 assert.equal(JSON.stringify(site),before,"ambiguous instruction must not mutate the original");
});

test("named-language section moves use the same universal operations and survive JSON reload",async()=>{
 const {applyUniversalNamedLanguage}=await import("../src/lib/builder-v2-universal-targets.ts");
 const site={templateId:"prompt-adaptive",blocks:[
  {id:"about-heading",type:"heading",section:"sobre",text:"Sobre a empresa"},
  {id:"process-heading",type:"heading",section:"como-funciona",text:"Nosso processo"},
  {id:"gallery-heading",type:"heading",section:"galeria",text:"Galeria"}
 ]};
 const moved=applyUniversalNamedLanguage(site,"Mova galeria antes de nosso processo");
 assert.equal(moved?.ok,true,moved?.error);
 if(!moved?.ok)return;
 const reloaded=JSON.parse(JSON.stringify(moved.site));
 assert.equal(reloaded.universalSectionEvents?.at(-1)?.action,"move");
 assert.equal(reloaded.universalSectionEvents?.at(-1)?.section?.id,"galeria");
 assert.equal(reloaded.universalSectionEvents?.at(-1)?.before?.id,"como-funciona");
 assert.equal(site.universalSectionEvents,undefined,"original site must remain immutable");
});

test("chat endpoint prioritizes explicit universal operation batches over full-site brief wording",()=>{
 const route=readFileSync(new URL("../src/app/api/builder-v2/chat/route.ts",import.meta.url),"utf8");
 assert.match(route,/if\(!isFresh&&body\.universalOperations!==undefined\)/);
 assert.doesNotMatch(route,/if\(!isFresh&&!fullSiteBrief&&body\.universalOperations!==undefined\)/);
 assert.match(route,/if\(!isFresh&&!fullSiteBrief&&Array\.isArray\(editingSite\?\.blocks\)/);
});

test("multi-clause universal chat edits commit atomically and preserve existing section events",()=>{
 const original={templateId:"prompt-adaptive",blocks:[
  {id:"about-title",type:"heading",section:"sobre",text:"Sobre a empresa"},
  {id:"footer-message",type:"paragraph",section:"rodape",text:"Mensagem original"},
  {id:"gallery-title",type:"heading",section:"galeria",text:"Galeria"}
 ],universalSectionEvents:[{action:"move",section:{id:"galeria",label:"Galeria"},before:{id:"sobre",label:"Sobre"}}]};
 const snapshot=JSON.stringify(original);
 const good=applyUniversalNaturalLanguage(original,'Altere o texto "Sobre a empresa" para "Nossa essência"; Altere o texto "Mensagem original" para "Fale conosco"');
 assert.equal(good?.ok,true,good?.error);
 if(!good?.ok)return;
 assert.equal(good.site.blocks.find(b=>b.id==="about-title").text,"Nossa essência");
 assert.equal(good.site.blocks.find(b=>b.id==="footer-message").text,"Fale conosco");
 assert.deepEqual(good.site.universalSectionEvents,original.universalSectionEvents);
 assert.equal(JSON.stringify(original),snapshot,"input must not be mutated");
 const bad=applyUniversalNaturalLanguage(original,'Altere o texto "Sobre a empresa" para "Nossa essência"; Altere algo completamente desconhecido');
 assert.equal(bad?.ok,false,"unsupported second clause must reject entire request");
 assert.equal(JSON.stringify(original),snapshot,"failed request must not mutate input");
 const missing=applyUniversalNaturalLanguage(original,'Altere o texto "Sobre a empresa" para "Nossa essência"; Altere o texto "Inexistente" para "Novo"');
 assert.equal(missing?.ok,false,"missing second target must reject entire request");
 assert.equal(JSON.stringify(original),snapshot,"failed target must not mutate input");
});

test("compound instruction parser recognizes faça as a boundary and refuses unsupported partial edits",async()=>{
 const {universalInstructionClauses}=await import("../src/lib/builder-v2-universal-plan.ts");
 const request='Altere o texto "Sobre a empresa" para "Nossa essência"; Faça uma edição completamente desconhecida';
 assert.deepEqual(universalInstructionClauses(request),[
  'Altere o texto "Sobre a empresa" para "Nossa essência"',
  "Faça uma edição completamente desconhecida"
 ]);
 const original={blocks:[{id:"about",type:"heading",section:"sobre",text:"Sobre a empresa"}]};
 const result=applyUniversalNaturalLanguage(original,request);
 assert.equal(result?.ok,false,"unknown second instruction must reject the entire request");
 assert.equal(original.blocks[0].text,"Sobre a empresa","first instruction must not leak into original");
});

test("compound parser preserves quoted punctuation, URLs and edit text while splitting independent commands",async()=>{
 const {universalInstructionClauses}=await import("../src/lib/builder-v2-universal-plan.ts");
 const request='Altere o texto "Sobre; e faça algo" para "Sobre; e crie conexões"; Mova galeria antes de sobre';
 assert.deepEqual(universalInstructionClauses(request),[
  'Altere o texto "Sobre; e faça algo" para "Sobre; e crie conexões"',
  'Mova galeria antes de sobre'
 ]);
 const multiline='Altere o texto "Início" para "Bem-vindo"\n2. Configure o link do botão "Contato" para https://example.com/a?x=1&y=2';
 assert.deepEqual(universalInstructionClauses(multiline),[
  'Altere o texto "Início" para "Bem-vindo"',
  'Configure o link do botão "Contato" para https://example.com/a?x=1&y=2'
 ]);
});

test("universal chat rejects more than twenty natural-language changes without mutating the site",()=>{
 const original={blocks:[{id:"hero",type:"heading",section:"hero",text:"Título original"}]};
 const before=JSON.stringify(original);
 const instructions=Array.from({length:21},(_,i)=>'Altere o texto "Título original" para "Título '+i+'"').join("; ");
 const result=applyUniversalNaturalLanguage(original,instructions);
 assert.equal(result?.ok,false,"oversized batch must be rejected");
 assert.match(result.error,/20 altera/i);
 assert.equal(JSON.stringify(original),before,"oversized batch must not change input");
});

test("builder UI and chat endpoint use one shared site creation classifier",async()=>{
 const {isFullSiteCreationBrief}=await import("../src/lib/builder-v2-universal-plan.ts");
 assert.equal(isFullSiteCreationBrief("Crie um site para uma clínica"),true);
 assert.equal(isFullSiteCreationBrief("Desenvolva um site profissional"),true);
 assert.equal(isFullSiteCreationBrief("Altere o texto da capa"),false);
 assert.equal(isFullSiteCreationBrief("Mova a galeria antes do FAQ"),false);
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 const route=readFileSync(new URL("../src/app/api/builder-v2/chat/route.ts",import.meta.url),"utf8");
 assert.match(page,/import \{isFullSiteCreationBrief\} from "@\/lib\/builder-v2-universal-plan"/);
 assert.match(route,/import \{isFullSiteCreationBrief\} from "@\/lib\/builder-v2-universal-plan"/);
 assert.match(page,/isFullSiteCreationBrief\(prompt\)/);
 assert.match(route,/isFullSiteCreationBrief\(instructionText\)/);
});

test("sequential universal edits survive reload and retain previous content and section events",()=>{
 const original={templateId:"prompt-adaptive",blocks:[
  {id:"hero-title",type:"heading",section:"hero",text:"Título original"},
  {id:"contact-button",type:"button",section:"contato",text:"Contato",href:"#contato"},
  {id:"gallery-title",type:"heading",section:"galeria",text:"Galeria"},
  {id:"about-title",type:"heading",section:"sobre",text:"Sobre nós"}
 ]};
 const first=applyUniversalNaturalLanguage(original,'Altere o texto "Título original" para "Nova identidade"');
 assert.equal(first?.ok,true,first?.error);
 if(!first?.ok)return;
 const reloaded=JSON.parse(JSON.stringify(first.site));
 const second=applyUniversalNaturalLanguage(reloaded,'Altere o link do botão "Contato" para https://example.com/contato');
 assert.equal(second?.ok,true,second?.error);
 if(!second?.ok)return;
 const third=applyUniversalNaturalLanguage(second.site,'Mova galeria antes de sobre');
 assert.equal(third?.ok,true,third?.error);
 if(!third?.ok)return;
 const publishedSnapshot=JSON.parse(JSON.stringify(third.site));
 assert.equal(publishedSnapshot.blocks.find(b=>b.id==="hero-title").text,"Nova identidade");
 assert.equal(publishedSnapshot.blocks.find(b=>b.id==="contact-button").href,"https://example.com/contato");
 assert.equal(publishedSnapshot.universalSectionEvents?.at(-1)?.action,"move");
 assert.equal(original.blocks[0].text,"Título original");
 assert.equal(original.blocks[1].href,"#contato");
});

test("section targeting prioritizes exact stable IDs over duplicate visible headings",()=>{
 const current={blocks:[
  {id:"a",type:"heading",section:"gallery",text:"Galeria"},
  {id:"b",type:"heading",section:"projects",text:"Gallery"},
  {id:"c",type:"heading",section:"about",text:"Sobre"}
 ]};
 assert.equal(resolveUniversalSection(current,"gallery"),"gallery");
 assert.equal(resolveUniversalSection(current,"Galeria"),"gallery");
 assert.equal(resolveUniversalSection(current,"projects"),"projects");
});

test("universal removal supports uniquely identified sections without deleting unrelated content",()=>{
 const original={blocks:[
  {id:"h",type:"heading",section:"hero",text:"Capa"},
  {id:"a",type:"heading",section:"about",text:"Sobre nós"},
  {id:"p",type:"paragraph",section:"about",text:"Nossa história"},
  {id:"f",type:"heading",section:"faq",text:"Perguntas frequentes"}
 ]};
 const result=applyUniversalNaturalLanguage(original,"Remova a seção Sobre nós");
 assert.equal(result?.ok,true,result?.error);
 if(!result?.ok)return;
 assert.equal(result.site.blocks.some(b=>b.section==="about"),false);
 assert.equal(result.site.blocks.some(b=>b.section==="hero"),true);
 assert.equal(result.site.blocks.some(b=>b.section==="faq"),true);
 assert.equal(original.blocks.length,4);
 const missing=applyUniversalNaturalLanguage(original,"Remova a seção inexistente");
 assert.equal(missing?.ok,false);
 assert.equal(original.blocks.length,4);
});

test("non-section removal instructions remain available to legacy animation handlers",()=>{
 const original=site();
 assert.equal(applyUniversalNaturalLanguage(original,"Remova as animações do site inteiro."),null);
 assert.equal(applyUniversalNaturalLanguage(original,"Remova o vídeo de fundo"),null);
});

test("publication warning from API is shown instead of unconditional success",()=>{
 const editor=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 const publish=readFileSync(new URL("../src/app/api/builder-v2/publish/route.ts",import.meta.url),"utf8");
 assert.match(publish,/notice:"Site publicado\. A atualização da lista de domínios/);
 assert.match(editor,/setPublishNotice\(data\.notice\|\|/);
});

test("unreadable local draft cannot be overwritten by autosave",()=>{
 const editor=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(editor,/else throw new Error\("Invalid saved draft"\)/);
 assert.match(editor,/setDraftRecoveryFailed\(true\)/);
 assert.match(editor,/if\(!loaded\|\|!draftHydrated\|\|!storageProjectReady\|\|draftRecoveryFailed\)return;/);
});

test("history recovery warning remains visible after successful draft autosave",()=>{
 const editor=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(editor,/previous\.startsWith\("Não foi possível"\)/);
 assert.match(editor,/if\(!loaded\|\|!draftHydrated\|\|historyRecoveryFailed\)return;/);
});

test("hero heading and description are edited together across all three visual variants",()=>{
 for(const variant of ["01","02","03"]){
  const original={templateId:"tp2",briefingLayoutVariant:variant,blocks:[
   {id:"hero-h",type:"heading",section:"hero",text:"Título original"},
   {id:"hero-p",type:"paragraph",section:"hero",text:"Descrição original"},
   {id:"hero-cta",type:"button",section:"hero",text:"Conheça",href:"#servicos"},
   {id:"about-h",type:"heading",section:"about",text:"Sobre"}
  ]};
  const snapshot=structuredClone(original);
  const instruction='Altere o título principal da capa para "Projetamos espaços que inspiram novas histórias" e a descrição da capa para "Desenvolvemos projetos de arquitetura e interiores que combinam elegância, conforto e funcionalidade." Não altere imagens, botões ou outras seções.';
  const result=applyUniversalNaturalLanguage(original,instruction);
  assert.equal(result?.ok,true,result?.error);
  if(!result?.ok)continue;
  assert.equal(result.changedIds.length,2);
  assert.equal(result.site.blocks[0].text,"Projetamos espaços que inspiram novas histórias");
  assert.equal(result.site.blocks[1].text,"Desenvolvemos projetos de arquitetura e interiores que combinam elegância, conforto e funcionalidade.");
  assert.deepEqual(result.site.blocks.slice(2),original.blocks.slice(2));
  assert.equal(result.site.briefingLayoutVariant,variant);
  assert.deepEqual(original,snapshot);
 }
});

test("universal hero edit matrix: 10 template families x 3 variants x section aliases",()=>{
 const sectionIds=["hero","inicio","capa"];
 const instruction='Altere o título principal da capa para "Novo título" e a descrição da capa para "Nova descrição". Não altere outras seções.';
 for(let family=1;family<=10;family++){
  for(const variant of ["01","02","03"]){
   for(const section of sectionIds){
    const original={templateId:"tp"+family,briefingLayoutVariant:variant,blocks:[
     {id:"h",type:"heading",section,text:"Título original"},
     {id:"p",type:"paragraph",section,text:"Descrição original"},
     {id:"cta",type:"button",section,text:"Saiba mais",href:"#contato"},
     {id:"other",type:"heading",section:"about",text:"Sobre"}
    ]};
    const result=applyUniversalNaturalLanguage(original,instruction);
    assert.equal(result?.ok,true,"family="+family+" variant="+variant+" section="+section+" "+result?.error);
    if(!result?.ok)continue;
    assert.equal(result.changedIds.length,2);
    assert.equal(result.site.blocks[0].text,"Novo título");
    assert.equal(result.site.blocks[1].text,"Nova descrição");
    assert.deepEqual(result.site.blocks.slice(2),original.blocks.slice(2));
    assert.equal(result.site.templateId,original.templateId);
    assert.equal(result.site.briefingLayoutVariant,variant);
   }
  }
 }
});

test("universal image, CTA and section removal preserve unrelated blocks across 30 visual variants",()=>{
 for(let family=1;family<=10;family++){
  for(const variant of ["01","02","03"]){
   const original={templateId:"tp"+family,briefingLayoutVariant:variant,blocks:[
    {id:"hero-h",type:"heading",section:"hero",text:"Título"},
    {id:"hero-p",type:"paragraph",section:"hero",text:"Descrição"},
    {id:"hero-img",type:"image",section:"hero",src:"https://example.com/old.jpg"},
    {id:"hero-btn",type:"button",section:"hero",text:"Contato",href:"#contato"},
    {id:"about-h",type:"heading",section:"about",text:"Sobre"},
    {id:"about-p",type:"paragraph",section:"about",text:"Sobre nós"},
    {id:"faq-h",type:"heading",section:"faq",text:"FAQ"}
   ]};
   const imageResult=applyUniversalNaturalLanguage(original,"Substitua somente a imagem principal da capa pela fotografia disponível nesta URL: https://example.com/new.jpg");
   assert.equal(imageResult?.ok,true,"image tp"+family+" model"+variant+": "+imageResult?.error);
   if(!imageResult?.ok)continue;
   assert.equal(imageResult.site.blocks[2].src,"https://example.com/new.jpg");
   assert.deepEqual(imageResult.site.blocks.filter(b=>b.id!=="hero-img"),original.blocks.filter(b=>b.id!=="hero-img"));
   const ctaResult=applyUniversalNaturalLanguage(imageResult.site,'Altere o texto do botão principal da capa para "Solicitar orçamento"');
   assert.equal(ctaResult?.ok,true,"CTA tp"+family+" model"+variant+": "+ctaResult?.error);
   if(!ctaResult?.ok)continue;
   assert.equal(ctaResult.site.blocks[3].text,"Solicitar orçamento");
   assert.equal(ctaResult.site.blocks[3].href,"#contato");
   const removal=applyUniversalNaturalLanguage(ctaResult.site,"Remova a seção Sobre");
   assert.equal(removal?.ok,true,"remove tp"+family+" model"+variant+": "+removal?.error);
   if(!removal?.ok)continue;
   assert.equal(removal.site.blocks.some(b=>b.section==="about"),false);
   assert.equal(removal.site.blocks.some(b=>b.section==="faq"),true);
   assert.equal(removal.site.briefingLayoutVariant,variant);
   assert.equal(removal.site.templateId,original.templateId);
   assert.equal(original.blocks[2].src,"https://example.com/old.jpg");
  }
 }
});

test("universal add and reorder section operations preserve 30 template identities",()=>{
 for(let family=1;family<=10;family++)for(const variant of ["01","02","03"]){
  const original={templateId:"tp"+family,briefingLayoutVariant:variant,blocks:[
   {id:"hero",type:"heading",section:"hero",text:"Capa"},
   {id:"about",type:"heading",section:"about",text:"Sobre"},
   {id:"about-body",type:"paragraph",section:"about",text:"Descrição"},
   {id:"faq",type:"heading",section:"faq",text:"FAQ"}
  ]};
  const added=applyUniversalOperations(original,[
   {action:"add",block:{id:"new-section-heading",type:"heading",section:"services",text:"Serviços"},afterId:"about-body"},
   {action:"add",block:{id:"new-section-body",type:"paragraph",section:"services",text:"Serviço novo"},afterId:"new-section-heading"}
  ]);
  assert.equal(added.ok,true,"add tp"+family+" model"+variant+": "+added.error);
  if(!added.ok)continue;
  assert.deepEqual(added.site.blocks.map(b=>b.id),["hero","about","about-body","new-section-heading","new-section-body","faq"]);
  const moved=applyUniversalOperations(added.site,[{action:"move-section",sectionId:"services",beforeSectionId:"about"}]);
  assert.equal(moved.ok,true,"move tp"+family+" model"+variant+": "+moved.error);
  if(!moved.ok)continue;
  assert.deepEqual(moved.site.blocks.map(b=>b.id),["hero","new-section-heading","new-section-body","about","about-body","faq"]);
  assert.equal(moved.site.universalSectionEvents.at(-1).action,"move");
  assert.equal(moved.site.universalSectionEvents.at(-1).before.id,"about");
  assert.equal(moved.site.templateId,original.templateId);
  assert.equal(moved.site.briefingLayoutVariant,variant);
  assert.deepEqual(original.blocks.map(b=>b.id),["hero","about","about-body","faq"]);
 }
});

test("TP2 model 1 routes all ten rendered sections through universal event ordering",()=>{
 const renderer=readFileSync(new URL("../src/components/builder-v2-tp2-model1.tsx",import.meta.url),"utf8");
 assert.match(renderer,/<UniversalTemplateSections site=\{site\}>/);
 for(const section of ["inicio","sobre","servicos","projetos","processo","diferenciais","experiencia","faq","informacoes","contato"]){
  assert.match(renderer,new RegExp('data-universal-section="'+section+'"'));
 }
});

test("universal hotel section move resolves accommodations aliases without touching other blocks",()=>{
 const site={templateId:"tp8",briefingLayoutVariant:"03",blocks:[
  {id:"hero",type:"heading",section:"inicio",text:"Refúgio"},
  {id:"rooms",type:"heading",section:"chales",text:"Nossos chalés"},
  {id:"rooms-p",type:"paragraph",section:"chales",text:"Acomodações"},
  {id:"diff",type:"heading",section:"diferenciais",text:"Diferenciais"},
  {id:"faq",type:"heading",section:"faq",text:"Perguntas frequentes"}
 ]};
 const result=applyUniversalNaturalLanguage(site,"Mova a seção Diferenciais para antes da seção Acomodações.");
 assert.equal(result?.ok,true,result?.error);
 if(result?.ok){
  assert.deepEqual(result.site.blocks.map(b=>b.id),["hero","diff","rooms","rooms-p","faq"]);
  assert.equal(result.site.briefingLayoutVariant,"03");
  assert.equal(result.site.universalSectionEvents.at(-1).before.id,"chales");
 }
});
