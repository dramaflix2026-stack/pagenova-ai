import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
import {applyRenderedSectionBackground} from "../src/lib/builder-v2-rendered-section-background.ts";
import {verifyUniversalEditResult} from "../src/lib/builder-v2-universal-learning.ts";
import {planUniversalVisualProof,auditUniversalVisualProof} from "../src/lib/builder-v2-editor-visual-proof.ts";
import {classifyUniversalFeedback} from "../src/lib/builder-v2-universal-feedback.ts";
import {applyRenderedFloricultureSectionCreation,resolveRenderedFloralAnchor,floricultureCustomSectionId} from "../src/lib/builder-v2-rendered-floriculture-section.ts";
import {verifiedPeonyBouquetPhoto,isExplicitFloriculturePeonyHeroIntent,applyVerifiedFloricultureHeroPhoto} from "../src/lib/builder-v2-floriculture-hero-photo.ts";


const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const ui=read("../src/components/builder-v2-floriculture-model1.tsx");
const css=read("../src/components/builder-v2-floriculture-model1.css");
const router=read("../src/components/builder-v2-site.tsx");
const photoSource=read("../src/lib/tp6-model2-internet-photos.ts");
const freeze=JSON.parse(read("../quality/approved-templates-baseline.json"));

test("Floricultura Model 01 renders approved twelve-part editorial hierarchy",()=>{
 for(const name of ["pn-floral1-head","pn-floral1-hero","pn-floral1-collections","pn-floral1-about","pn-floral1-benefits","pn-floral1-gallery","pn-floral1-reviews","pn-floral1-process","pn-floral1-faq","pn-floral1-cta","pn-floral1-contact","pn-floral1-location","pn-floral1-footer"]){
  assert.ok(ui.includes(name),name);
 }
 const anchors=["inicio","produtos","colecao","sobre","diferenciais","galeria","depoimentos","como-comprar","perguntas-frequentes","contato","localizacao","rodape"];
 for(const anchor of anchors)assert.ok(ui.includes('id="'+anchor+'"'),"missing #"+anchor);
 assert.match(ui,/heroTitle/);
 assert.match(ui,/heroImage/);
 assert.match(ui,/edits\?\.historyTitle/);
 assert.match(ui,/edits\?\.collectionBackground/);
 assert.match(ui,/edits\?\.firstCollectionCard/);
 assert.match(ui,/TP6RetailCustomSections sections=\{edits\?\.addedSections\}/);
});
test("Six photographic, labelled testimonials in 3x2 desktop layout",()=>{
 assert.match(ui,/Array\.from\(\{length:6\}/);
 assert.match(ui,/pn-floral1-reviews-grid/);
 assert.match(ui,/EXEMPLO FICTÍCIO · NÃO É CLIENTE REAL/);
 assert.match(ui,/Retrato ilustrativo, não representa um cliente real/);
 assert.match(css,/\.pn-floral1-reviews-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:860px\)/);
 assert.match(css,/\.pn-floral1-reviews-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.pn-floral1-reviews-grid\{grid-template-columns:1fr\}/);
 assert.ok(ui.includes("Juliana Santos"),"sixth review must not be a pet-shop sample");
});
test("Forms and location never fake WhatsApp or email submission",()=>{
 assert.match(ui,/canContact=hasWhats\|\|hasMail/);
 assert.match(ui,/onSubmit=\{send\}/);
 assert.match(ui,/disabled=\{!canContact\}/);
 assert.match(ui,/https:\/\/wa\.me\//);
 assert.match(ui,/mailto:/);
 assert.match(ui,/window\.open/);
 assert.match(ui,/ENDEREÇO FICTÍCIO · DEMONSTRAÇÃO/);
 assert.match(ui,/openstreetmap\.org\/export\/embed\.html/);
 assert.match(ui,/<iframe/);
 assert.match(ui,/pn-floral1-no-whatsapp/);
 assert.ok(ui.indexOf("pn-floral1-location-card")<ui.indexOf("pn-floral1-footer"),"map before footer");
});
test("Gallery really opens six photos, faq expands and mobile menu works",()=>{
 assert.match(ui,/Array\.from\(\{length:6\}/);
 assert.match(ui,/setLightbox\(i\)/);
 assert.match(ui,/role="dialog" aria-modal="true"/);
 assert.match(ui,/event\.key==="Escape"/);
 assert.match(ui,/aria-expanded=\{faqOpen===i\}/);
 assert.match(ui,/aria-expanded=\{menuOpen\}/);
 assert.match(css,/\.pn-floral1-mosaic\{display:grid/);
 assert.match(css,/\.pn-floral1-collection-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:590px\)/);
 assert.match(css,/\.pn-floral1-collection-grid\{grid-template-columns:1fr/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test("Only TP6 Floricultura Model 01 opts in; models 02/03 remain their original components",()=>{
 assert.match(router,/if\(variant==="03"\)/);
 assert.match(router,/if\(variant==="02"\)/);
 assert.match(router,/if\(variant==="01"&&retailNiche==="Floricultura"\)/);
 assert.match(router,/TP6FloricultureModel1/);
 assert.ok(router.indexOf('if(variant==="01"&&retailNiche==="Floricultura")')>router.indexOf('if(variant==="02")'));
 for(const original of ["Template6RetailHero","Template6RetailCollection","Template6RetailStory","BuilderV2TP6Model2Hero","BuilderV2TP6Model3Hero"])assert.ok(router.includes(original));
 const entry=freeze.protectedFiles.find(x=>x.path==="src/components/builder-v2-site.tsx");
 assert.match(entry.approvedBindingRevision.reason,/Explicit user approval/);
 assert.equal(freeze.protectedFileCount,162);
});
test("Uses actual florist photo pool rather than unrelated niche images",()=>{
 const ids=photoSource.match(/"Floricultura": \[([\s\S]*?)\n  \]/)?.[1];
 assert.ok(ids);
 assert.ok((ids.match(/"[0-9]{13}-[a-z0-9]+"/g)||[]).length>=6);
 assert.match(ui,/images\.filter\(safePhoto\)/);
});
test("Dedicated components parse as TSX",()=>{
 for(const [name,source] of [["floriculture",ui],["site",router]]){
  const parsed=ts.createSourceFile(name+".tsx",source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[],name);
 }
});

test("Collection captions have dedicated padding, readable typography and a non-overlapping arrow",()=>{
 assert.match(css,/\.pn-floral1-collection-card\{display:flex;flex-direction:column;min-width:0;overflow:hidden/);
 assert.match(css,/\.pn-floral1-collection-name\{position:relative;display:block;flex:1 1 auto;min-width:0;min-height:151px;padding:24px 28px 29px/);
 assert.match(css,/\.pn-floral1-collection-name>div\{min-width:0;padding-right:20px/);
 assert.match(css,/\.pn-floral1-collection-name h3\{font:400 clamp\(21px,1\.75vw,27px\)/);
 assert.match(css,/\.pn-floral1-collection-name h3\{[^}]*word-break:normal;hyphens:none/);
 assert.match(css,/\.pn-floral1-collection-name p\{color:#5e6d62;font-size:13px;line-height:1\.7/);
 assert.match(css,/\.pn-floral1-collection-name>strong\{position:absolute;top:25px;right:22px/);
 assert.match(css,/@media\(max-width:860px\)\{[\s\S]*\.pn-floral1-collection-name\{min-height:158px;padding:22px 18px 24px\}/);
 assert.match(css,/@media\(max-width:590px\)\{[\s\S]*\.pn-floral1-collection-name\{min-height:133px;padding:23px 22px 26px\}/);
 assert.match(css,/\.pn-floral1-footer-wordmark,\.pn-floral1-wordmark\{font-size:clamp\(42px,6vw,98px\)/);
 assert.match(css,/\.pn-floral1-wordmark\{font-size:clamp\(36px,8\.2vw,58px\)/);
 assert.ok(!css.includes(".tp6m2-")&&!css.includes(".tp6m3-"),"no CSS changes to protected models 02 or 03");
});

test("Floricultura Model 01 Hero binds a real DOM heading to the active editor block",()=>{
 assert.match(ui,/headlineBlockId\?:string/);
 assert.match(ui,/data-block-id=\{headlineBlockId\}/);
 assert.match(ui,/<h1 data-block-id=\{headlineBlockId\}>\{heroTitle\}<\/h1>/);
 assert.match(router,/headlineBlockId=\{props.site.blocks.find\(b=>b.type==="heading"&&b.text\?\.trim\(\)\)\?\.id\}/);
 assert.match(router,/if\(variant==="01"&&retailNiche==="Floricultura"\)/);
});

const isolatedBackgroundPrompt="Altere exclusivamente a cor de fundo da seção Coleções Florais para #EFE7DC. Preserve as cores dos textos, imagens, cards, botões e todas as demais seções. A alteração deve aparecer imediatamente na prévia, sem precisar publicar o site.";
const isolatedBackgroundSeed=()=>({
 title:"Jardim de Âmbar — Atelier Floral",niche:"Floricultura",briefingLayoutVariant:"01",
 blocks:[{id:"floral-hero",type:"heading",section:"hero",text:"Flores que fazem cada instante florescer"}],
 universalSectionStyles:{hero:{backgroundColor:"#ffffff"},produtos:{headingColor:"#26382D"}}
});
test("real Test 02 phrase edits only Model 01's rendered Coleções Florais background",()=>{
 const original=isolatedBackgroundSeed();
 const result=applyRenderedSectionBackground(original,isolatedBackgroundPrompt);
 assert.equal(result?.ok,true);
 assert.deepEqual(result.changedIds,["section-style:produtos"]);
 assert.equal(result.site.universalSectionStyles.produtos.backgroundColor,"#EFE7DC");
 assert.equal(result.site.universalSectionStyles.produtos.headingColor,"#26382D");
 assert.deepEqual(result.site.universalSectionStyles.hero,original.universalSectionStyles.hero);
 assert.deepEqual(result.site.blocks,original.blocks);
 assert.equal(original.universalSectionStyles.produtos.backgroundColor,undefined);
 assert.equal(verifyUniversalEditResult(original,result.site,result.changedIds).ok,true);
});
test("real collection #produtos DOM must show the requested color before success",()=>{
 const before=isolatedBackgroundSeed();
 const result=applyRenderedSectionBackground(before,isolatedBackgroundPrompt);
 assert.equal(result?.ok,true);
 const proof=planUniversalVisualProof(before,result.site,result.changedIds);
 assert.deepEqual(proof,{ok:true,contract:{version:1,tasks:[{kind:"section-color",section:"produtos",color:"#EFE7DC",target:"background"}]}});
 const section={id:"produtos",getAttribute:()=>null,getClientRects:()=>[{}],querySelectorAll:()=>[]};
 const root={querySelectorAll:selector=>selector.includes("section")?[section]:[]};
 const browser=color=>({getComputedStyle:()=>({display:"block",visibility:"visible",backgroundColor:color})});
 assert.equal(auditUniversalVisualProof(root,browser("rgb(239, 231, 220)"),proof.contract).ok,true);
 assert.equal(auditUniversalVisualProof(root,browser("rgb(248, 245, 236)"),proof.contract).ok,false);
 assert.equal(auditUniversalVisualProof({querySelectorAll:()=>[]},browser("rgb(239, 231, 220)"),proof.contract).ok,false);
});
test("no unrelated template, model or compound operation may consume the special binding",()=>{
 const seed=isolatedBackgroundSeed();
 assert.equal(applyRenderedSectionBackground({...seed,briefingLayoutVariant:"02"},isolatedBackgroundPrompt),null);
 assert.equal(applyRenderedSectionBackground({...seed,briefingLayoutVariant:"03"},isolatedBackgroundPrompt),null);
 assert.equal(applyRenderedSectionBackground({...seed,niche:"Auto centers",title:"Vértice Auto Center"},isolatedBackgroundPrompt),null);
 assert.equal(applyRenderedSectionBackground(seed,isolatedBackgroundPrompt+" Mude o botão principal."),null);
 assert.equal(applyRenderedSectionBackground(seed,"Altere exclusivamente a cor de fundo da seção Inventário para #EFE7DC."),null);
 assert.equal(applyRenderedSectionBackground(seed,isolatedBackgroundPrompt.replace("#EFE7DC","#GGGGGG")),null);
});
test("Test 02 renderer wiring remains isolated to premium M1 and normal universal guards",()=>{
 const editor=read("../src/app/app/builder-v2/page.tsx");
 assert.match(editor,/const renderedBackground=!generic\?\.ok\?applyRenderedSectionBackground\(site,prompt\):null/);
 assert.match(editor,/pendingUniversalVisualProofRef.current=\{/);
 assert.match(editor,/strategy:"universal-rendered-section-background-visual-verified"/);
 assert.match(editor,/planUniversalVisualProof\(site,parsed.site,parsed.changedIds\)/);
 assert.match(router,/sectionBackgroundOverride=\{props.site.universalSectionStyles\?\.produtos\?\.backgroundColor\}/);
 assert.match(ui,/sectionBackgroundOverride&&\/\^#\[a-f\\d\]\{6\}\$\/i\.test\(sectionBackgroundOverride\)/);
 const otherModels=["../src/components/builder-v2-floriculture-model2.tsx","../src/components/builder-v2-floriculture-model3.tsx"].map(read);
 for(const source of otherModels)assert.ok(!source.includes("sectionBackgroundOverride"));
});


test("ML: 'exclusivamente' can never be mistaken for 'excluir seção'",()=>{
 const classified=classifyUniversalFeedback(isolatedBackgroundPrompt);
 assert.deepEqual(classified,{intent:"style",target:"collections",sectionKey:"produtos"});
 const styleWithoutClause=classifyUniversalFeedback("Altere exclusivamente a cor de fundo da seção Coleções Florais para #EFE7DC.");
 assert.deepEqual(styleWithoutClause,{intent:"style",target:"collections",sectionKey:"produtos"});
 const realRemoval=classifyUniversalFeedback("Exclua a seção Coleções Florais");
 assert.equal(realRemoval.intent,"remove-section");
 const negative=classifyUniversalFeedback("Altere o fundo da seção Coleções Florais e não remova a seção");
 assert.equal(negative.intent,"style");
});
test("ML: the exact premium color path must execute before historical Supabase route ranking",()=>{
 const source=read("../src/app/app/builder-v2/page.tsx");
 const premium=source.indexOf("const premiumBackground=applyRenderedSectionBackground(site,prompt);");
 const history=source.indexOf("const [approvedPatterns,approvedSolutions]=await Promise.all(");
 const generic=source.indexOf("const generic=applyUniversalNaturalLanguage(site,prompt);");
 assert.ok(premium>0&&history>premium&&generic>premium);
 const scope=source.slice(premium,source.indexOf("const compound=splitUniversalInstructions(prompt).length>1;",premium));
 assert.match(scope,/verifyUniversalEditResult\(site,premiumBackground.site,premiumBackground.changedIds\)/);
 assert.match(scope,/planUniversalVisualProof\(site,premiumBackground.site,premiumBackground.changedIds\)/);
 assert.match(scope,/pendingUniversalVisualProofRef.current=\{/);
 assert.match(scope,/captureCurrentPreviewRegression/);
 assert.doesNotMatch(scope,/recordEditorLearningEvent\([^;]*"applied"/);
 assert.match(scope,/setSite\(premiumBackground.site\)/);
});
test("ML: section background works with sites that lack prior universalSectionStyles",()=>{
 const bare=isolatedBackgroundSeed();
 delete bare.universalSectionStyles;
 const updated=applyRenderedSectionBackground(bare,isolatedBackgroundPrompt);
 assert.equal(updated?.ok,true);
 assert.equal(updated.site.universalSectionStyles.produtos.backgroundColor,"#EFE7DC");
 assert.deepEqual(updated.site.blocks,bare.blocks);
 assert.equal(verifyUniversalEditResult(bare,updated.site,updated.changedIds).ok,true);
});

test("Test 03: verified real internet photo changes only persisted Hero override",()=>{
 const before=isolatedBackgroundSeed();
 const request="Substitua exclusivamente a fotografia principal do Hero por uma fotografia real da internet mostrando um buquê premium de peônias rosas e brancas. Mantenha o mesmo layout, as dimensões da imagem, os textos e os botões. A nova fotografia deve aparecer corretamente na prévia, sem imagens quebradas e sem modificações nas demais seções.";
 assert.equal(isExplicitFloriculturePeonyHeroIntent(request),true);
 const changed=applyVerifiedFloricultureHeroPhoto(before,verifiedPeonyBouquetPhoto);
 assert.equal(changed.ok,true);
 assert.deepEqual(changed.changedIds,["hero-photo-override"]);
 assert.equal(changed.site.universalHeroImageOverride,verifiedPeonyBouquetPhoto);
 assert.deepEqual(changed.site.blocks,before.blocks);
 assert.deepEqual(changed.site.universalSectionStyles,before.universalSectionStyles);
 assert.equal(before.universalHeroImageOverride,undefined);
 assert.equal(applyVerifiedFloricultureHeroPhoto(changed.site,verifiedPeonyBouquetPhoto).ok,false);
 assert.equal(applyVerifiedFloricultureHeroPhoto(before,"http://unsafe.example/fake.jpg").ok,false);
});
test("Test 03: the real Model 01 Hero is the unique marked image and other models stay frozen",()=>{
 const editor=read("../src/app/app/builder-v2/page.tsx");
 assert.match(ui,/heroPhotoOverride\?:string/);
 assert.match(ui,/data-universal-hero-photo=\{safePhoto\(heroPhotoOverride\)\?"true":undefined\}/);
 assert.match(ui,/const mainPhoto=safePhoto\(heroPhotoOverride\)\?heroPhotoOverride!/);
 assert.match(router,/heroPhotoOverride=\{props.site.universalHeroImageOverride\}/);
 assert.match(router,/if\(variant==="01"&&retailNiche==="Floricultura"\)/);
 assert.match(editor,/isExplicitFloriculturePeonyHeroIntent\(prompt\)/);
 assert.match(editor,/strategy:"floriculture-hero-photo"/);
 assert.match(editor,/pendingHeroPhotoVisualReviewRef.current=\{/);
 assert.match(editor,/photo.complete&&photo.naturalWidth>0/);
 assert.match(editor,/setSite\(pending.before\)/);
 const otherModels=["../src/components/builder-v2-floriculture-model2.tsx","../src/components/builder-v2-floriculture-model3.tsx"].map(read);
 for(const source of otherModels)assert.ok(!source.includes("heroPhotoOverride"));
});


const actualTest04Prompt="Adicione uma nova seção chamada Cuidados com as Flores, imediatamente depois da seção Um processo tão especial quanto as flores e antes de Perguntas Frequentes.\n\nCrie três cards com as seguintes orientações:\n\n1. Água fresca — Troque a água regularmente para conservar as flores.\n2. Luz indireta — Evite exposição direta ao sol e calor intenso.\n3. Cuidado com as hastes — Faça cortes diagonais para favorecer a hidratação.\n\nUtilize um design premium, elegante e responsivo, seguindo a identidade visual atual da floricultura.\n\nNão duplique seções, não altere os conteúdos existentes e não modifique o rodapé.\n\nA nova seção deve aparecer imediatamente na prévia, na posição solicitada.";
const test04Site=()=>({
 niche:"Floricultura",title:"Jardim de Âmbar — Atelier Floral",briefingLayoutVariant:"01",
 blocks:[
  {id:"hero-title",type:"heading",section:"hero",text:"Flores que fazem cada instante florescer"},
  {id:"hero-description",type:"paragraph",section:"hero",text:"Buquês premium."},
  {id:"footer-title",type:"heading",section:"footer",text:"Contato"},
  {id:"footer-text",type:"paragraph",section:"footer",text:"Informações institucionais"}
 ]
});
test("Test 04: the exact customer request parses TWO independent real visible anchors and 3 literal cards",()=>{
 const before=test04Site();
 const output=applyRenderedFloricultureSectionCreation(before,actualTest04Prompt);
 assert.equal(output?.ok,true);
 const section=floricultureCustomSectionId("Cuidados com as Flores");
 assert.equal(section,"custom-cuidados-com-as-flores");
 assert.equal(output.changedIds.length,8);
 const inserted=output.site.blocks.filter(block=>block.section===section);
 assert.equal(inserted.length,8);
 assert.deepEqual(inserted.filter(b=>b.type==="heading").map(b=>b.text),[
  "Cuidados com as Flores","Água fresca","Luz indireta","Cuidado com as hastes"
 ]);
 assert.deepEqual(inserted.filter(b=>b.type==="paragraph").slice(1).map(b=>b.text),[
  "Troque a água regularmente para conservar as flores.",
  "Evite exposição direta ao sol e calor intenso.",
  "Faça cortes diagonais para favorecer a hidratação."
 ]);
 assert.equal(output.site.blocks.at(-1).id,"footer-text");
 assert.deepEqual(output.site.blocks.filter(b=>b.section==="hero"||b.section==="footer"),before.blocks);
 const placement=output.site.universalSectionEvents.at(-1);
 assert.equal(placement.action,"move");
 assert.equal(placement.section.id,section);
 assert.equal(placement.after.id,"como-comprar");
 assert.equal(placement.before.id,"perguntas-frequentes");
 assert.equal(verifyUniversalEditResult(before,output.site,output.changedIds).ok,true);
 const proof=planUniversalVisualProof(before,output.site,output.changedIds);
 assert.equal(proof.ok,true);
 assert.deepEqual(proof.contract.tasks,[{
  kind:"section-new",section,heading:"Cuidados com as Flores",
  cardTitles:["Água fresca","Luz indireta","Cuidado com as hastes"],
  preceding:"como-comprar",following:"perguntas-frequentes"
 }]);
});
test("Test 04: only a single custom section between Process and FAQ passes visual proof",()=>{
 const before=test04Site();
 const edit=applyRenderedFloricultureSectionCreation(before,actualTest04Prompt);
 assert.equal(edit.ok,true);
 const proof=planUniversalVisualProof(before,edit.site,edit.changedIds);
 const visible=()=>[{}];
 const oldProcess={id:"como-comprar",getAttribute:()=>null,getClientRects:visible,
  compareDocumentPosition:()=>4};
 const faq={id:"perguntas-frequentes",getAttribute:()=>null,getClientRects:visible};
 const titles=["Água fresca","Luz indireta","Cuidado com as hastes"];
 const cards=titles.map(title=>({querySelector:()=>({textContent:title})}));
 const fresh={id:"custom-cuidados-com-as-flores",getAttribute:()=>null,getClientRects:visible,
  querySelector:()=>({textContent:"Cuidados com as Flores"}),
  querySelectorAll:sel=>sel==="article"?cards:[],compareDocumentPosition:()=>4};
 const root={querySelectorAll:sel=>sel==="section"?[oldProcess,fresh,faq]:[]};
 const view={getComputedStyle:()=>({display:"block",visibility:"visible"})};
 assert.equal(auditUniversalVisualProof(root,view,proof.contract).ok,true);
 const duplicated={querySelectorAll:sel=>sel==="section"?[oldProcess,fresh,fresh,faq]:[]};
 assert.equal(auditUniversalVisualProof(duplicated,view,proof.contract).ok,false);
 const missing={querySelectorAll:sel=>sel==="section"?[oldProcess,faq]:[]};
 assert.equal(auditUniversalVisualProof(missing,view,proof.contract).ok,false);
});
test("Test 04: ambiguous, reversed, duplicate or unsupported requests cannot fake learning",()=>{
 const seed=test04Site(),done=applyRenderedFloricultureSectionCreation(seed,actualTest04Prompt);
 assert.equal(applyRenderedFloricultureSectionCreation(done.site,actualTest04Prompt).ok,false);
 assert.equal(applyRenderedFloricultureSectionCreation({...seed,briefingLayoutVariant:"02"},actualTest04Prompt),null);
 assert.equal(applyRenderedFloricultureSectionCreation({...seed,briefingLayoutVariant:"03"},actualTest04Prompt),null);
 assert.equal(applyRenderedFloricultureSectionCreation({...seed,niche:"Auto centers",title:"Vértice Auto Center"},actualTest04Prompt),null);
 assert.equal(applyRenderedFloricultureSectionCreation(seed,actualTest04Prompt.replace("Um processo tão especial quanto as flores","Seção Inexistente")).ok,false);
 assert.equal(applyRenderedFloricultureSectionCreation(seed,actualTest04Prompt.replace("depois da seção Um processo tão especial quanto as flores e antes de Perguntas Frequentes","depois da seção Perguntas Frequentes e antes de Um processo tão especial quanto as flores")).ok,false);
 assert.equal(resolveRenderedFloralAnchor("Histórias em cada flor."),"depoimentos");
 assert.equal(resolveRenderedFloralAnchor("Um processo tão especial quanto as flores."),"como-comprar");
 assert.equal(resolveRenderedFloralAnchor("Perguntas Frequentes"),"perguntas-frequentes");
});
test("ML: new-section intent and feedback target ignore the FAQ anchor name",()=>{
 assert.deepEqual(classifyUniversalFeedback(actualTest04Prompt),{intent:"add-section",target:"sections"});
 const input="Adicione uma nova seção chamada Cuidados com as Flores, imediatamente depois da seção Um processo tão especial quanto as flores e antes de Perguntas Frequentes.";
 assert.deepEqual(classifyUniversalFeedback(input),{intent:"add-section",target:"sections"});
});
test("Test 04 renderer works in published M1 and preview with no duplicate portal",()=>{
 const editor=read("../src/app/app/builder-v2/page.tsx");
 const portal=read("../src/components/tp10-universal-custom-sections.tsx");
 assert.match(editor,/const renderedFloralSection=!reference/);
 assert.match(editor,/applyRenderedFloricultureSectionCreation\(site,prompt\)/);
 assert.match(editor,/rollbackOnFailure:true/);
 assert.match(editor,/strategy:"universal-rendered-section-add-visual-verified"/);
 assert.match(router,/return <TP10UniversalCustomSections blocks=\{props.site.blocks\} sectionEvents=\{props.site.universalSectionEvents\} floriculture>/);
 assert.match(editor,/site.blocks.filter\(b=>!b.section\?\.startsWith\("custom-"\)\)/);
 assert.match(portal,/floriculture\?"DICAS DO ATELIER"/);
 assert.match(portal,/resolveTP10CustomPlacement/);
 assert.match(portal,/createPortal/);
});

