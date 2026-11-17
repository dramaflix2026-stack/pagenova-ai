import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applyIsolatedHeroTitleEdit} from "../src/lib/builder-v2-hero-title-edit.ts";
import {planUniversalVisualProof,auditUniversalVisualProof} from "../src/lib/builder-v2-editor-visual-proof.ts";

const seed=()=>({id:"studio-project-01",title:"Vértice Auto Center",niche:"Auto centers",
 briefingLayoutVariant:"02",templateId:"prompt-adaptive",
 blocks:[{id:"main-h1",section:"hero",type:"heading",text:"Performance em cada detalhe."},
 {id:"about-h2",section:"sobre",type:"heading",text:"Nossa história"},
 {id:"main-photo",section:"hero",type:"image",src:"https://example.com/old.jpg"}]});
const command='Altere somente o título principal da seção inicial para "PageNova Teste de Persistência 07". Preserve todas as demais seções, imagens, cores, botões e alinhamentos.';
test("explicit hero edit updates exactly one heading, keeps template identity and other blocks",()=>{
 const before=seed();const edit=applyIsolatedHeroTitleEdit(before,command);
 assert.equal(edit?.ok,true);
 assert.equal(edit.site.universalHeroHeadingBlockId,"main-h1");
 assert.equal(edit.site.blocks[0].text,"PageNova Teste de Persistência 07");
 assert.equal(edit.site.blocks[0].textExplicit,true);
 assert.deepEqual(edit.site.blocks.slice(1),before.blocks.slice(1));
 assert.equal(edit.site.briefingLayoutVariant,"02");
 assert.equal(before.blocks[0].text,"Performance em cada detalhe.");
});
test("previously persisted invisible headline still requires actual DOM proof when projection is established",()=>{
 const before=seed();before.blocks[0].text="PageNova Teste de Persistência 07";
 const edit=applyIsolatedHeroTitleEdit(before,command);
 assert.equal(edit?.ok,true);
 assert.deepEqual(planUniversalVisualProof(before,edit.site,edit.changedIds),{
   ok:true,contract:{version:1,tasks:[{kind:"block-text",id:"main-h1",text:"PageNova Teste de Persistência 07"}]}
 });
});
test("failed actual preview must not be reported as applied",()=>{
 const original=seed();
 const edit=applyIsolatedHeroTitleEdit(original,command);
 assert.equal(edit?.ok,true);
 const planned=planUniversalVisualProof(original,edit.site,edit.changedIds);
 assert.equal(planned.ok,true);
 const el=(value)=>({
  getAttribute:name=>name==="data-block-id"?"main-h1":null,
  getClientRects:()=>[{}],textContent:value
 });
 const root=value=>({querySelectorAll:selector=>selector==="[data-block-id]"?[el(value)]:[]});
 const window={getComputedStyle:()=>({display:"block",visibility:"visible"})};
 assert.equal(auditUniversalVisualProof(root("Performance em cada detalhe."),window,planned.contract).ok,false);
 assert.equal(auditUniversalVisualProof(root("PageNova Teste de Persistência 07"),window,planned.contract).ok,true);
});
test("unrelated and compound instructions never mutate the site",()=>{
 const original=seed();
 assert.equal(applyIsolatedHeroTitleEdit(original,'Altere o título principal da seção inicial para "Novo" e exclua as fotos'),null);
 assert.equal(applyIsolatedHeroTitleEdit(original,"Troque a imagem da capa"),null);
 assert.equal(applyIsolatedHeroTitleEdit(original,'Altere o título principal da seção inicial para "<script>"')?.ok,false);
 assert.equal(original.blocks[0].text,"Performance em cada detalhe.");
});
test("approved default cover is unmodified unless an explicit site block ID is bound",()=>{
 const component=readFileSync(new URL("../src/components/builder-v2-tp9-model2-hero.tsx",import.meta.url),"utf8");
 const renderer=readFileSync(new URL("../src/components/builder-v2-site.tsx",import.meta.url),"utf8");
 const editor=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(component,/headline\?\.trim\(\)\|\|\(isDetailing\?/);
 assert.match(component,/data-block-id=\{headlineBlockId\}/);
 assert.match(renderer,/heroTitleOverrideBlock\?\.text/);
 assert.match(renderer,/heroTitleOverrideBlock\?\.id/);
 assert.match(editor,/pendingUniversalVisualProofRef\.current=\{trace:activeSubmissionTraceRef\.current/);
});
