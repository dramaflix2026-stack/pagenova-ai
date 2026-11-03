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

test("TP1 model 02 contact introduction uses universal editing without changing form submission",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp1-model2.tsx",import.meta.url),"utf8");
 assert.match(component,/id="tp1v2-contact-heading" \{\.\.\.universalBlockProps\(/);
 assert.match(component,/b\.section==="contato"&&b\.type==="heading"/);
 assert.match(component,/b\.section==="contato"&&b\.type==="paragraph"/);
 assert.match(component,/onSubmit=\{sendContact\}/);
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
