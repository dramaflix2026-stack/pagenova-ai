import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applyUniversalOperations} from "../src/lib/builder-v2-universal-operations.ts";
import {
  tp1Model3SectionBlock,
  tp1Model3EditedText,
  tp1Model3EditedImage,
  TP1_MODEL3_VISIBLE_SLOTS,
  prepareTP1Model3VisibleEdit,
} from "../src/lib/builder-v2-tp1-editor-bridge.ts";

const source=(file)=>readFileSync(new URL("../src/"+file,import.meta.url),"utf8");
const copy=(site)=>structuredClone(site);
const baseline=()=>({
  id:"project-1",title:"Estética Demo",niche:"Clínica de estética",
  templateId:"prompt-adaptive",briefingLayoutVariant:"03",background:"#eee",
  blocks:[
    {id:"hero-heading",section:"hero",type:"heading",text:"Hero original"},
    {id:"hero-desc",section:"hero",type:"paragraph",text:"Descrição original"},
    {id:"hero-btn",section:"hero",type:"button",text:"Contato",href:"#contato"},
    {id:"hero-img",section:"hero",type:"image",src:"https://example.com/old.jpg"},
    {id:"about-heading",section:"sobre",type:"heading",text:"Sobre"},
    {id:"about-para",section:"sobre",type:"paragraph",text:"Sobre texto"},
    {id:"about-img",section:"sobre",type:"image",src:"https://example.com/old2.jpg"},
    {id:"services-heading",section:"servicos",type:"heading",text:"Nossos serviços"},
    {id:"services-image-one",section:"servicos",type:"image",src:"https://example.com/a.jpg"},
    {id:"services-image-two",section:"servicos",type:"image",src:"https://example.com/b.jpg"},
    {id:"gallery-heading",section:"galeria",type:"heading",text:"Galeria"},
    {id:"gallery-image",section:"galeria",type:"image",src:"https://example.com/c.jpg"},
    {id:"faq-title",section:"faq",type:"heading",text:"Perguntas"},
    {id:"faq-one",section:"faq",type:"paragraph",text:"Há atendimento? Sim, sob consulta."},
    {id:"history-title",section:"trajetoria",type:"heading",text:"História"},
    {id:"history-image",section:"trajetoria",type:"image",src:"https://example.com/d.jpg"},
  ],
});

test("legacy site images and copy remain unchanged without explicit edit",()=>{
 const site=baseline();
 assert.equal(tp1Model3EditedText(site,"inicio","heading"),null);
 assert.equal(tp1Model3EditedImage(site,"inicio"),null);
 assert.equal(tp1Model3EditedImage(site,"sobre"),null);
 assert.equal(tp1Model3SectionBlock(site,"inicio","heading")?.id,"hero-heading");
 assert.equal(tp1Model3SectionBlock(site,"conceito","paragraph")?.id,"about-para");
 assert.equal(tp1Model3SectionBlock(site,"servicos","image",1)?.id,"services-image-two");
 assert.equal(tp1Model3SectionBlock(site,"servicos","image",5),undefined);
});

test("hero title edit becomes visibly addressable without modifying unrelated site data",()=>{
 const site=baseline(),original=copy(site);
 const edited=prepareTP1Model3VisibleEdit(site,applyUniversalOperations(site,[
  {action:"update",blockId:"hero-heading",changes:{text:"Nova identidade"}},
 ]));
 assert.equal(edited.ok,true);
 if(!edited.ok)return;
 assert.equal(tp1Model3EditedText(edited.site,"inicio","heading"),"Nova identidade");
 assert.equal(tp1Model3EditedText(edited.site,"sobre","heading"),null);
 assert.equal(edited.site.blocks[0].textExplicit,true);
 assert.equal(edited.site.blocks[1].text,original.blocks[1].text);
 assert.equal(edited.site.briefingLayoutVariant,original.briefingLayoutVariant);
 assert.deepEqual(site,original);
});

test("explicit image replacement uses requested slot and does not reuse another card image",()=>{
 const site=baseline(),original=copy(site);
 const result=prepareTP1Model3VisibleEdit(site,applyUniversalOperations(site,[
  {action:"update",blockId:"services-image-two",changes:{src:"https://images.pexels.com/photos/123/test.jpg"}},
 ]));
 assert.equal(result.ok,true);
 if(!result.ok)return;
 assert.equal(tp1Model3EditedImage(result.site,"servicos",0),null);
 assert.equal(tp1Model3EditedImage(result.site,"servicos",1),"https://images.pexels.com/photos/123/test.jpg");
 assert.equal(tp1Model3EditedImage(result.site,"inicio"),null);
 assert.deepEqual(site,original);
});

test("hero button text and URL edits are validated as one atomic transaction",()=>{
 const site=baseline();
 const result=prepareTP1Model3VisibleEdit(site,applyUniversalOperations(site,[
  {action:"update",blockId:"hero-btn",changes:{text:"Agendar",href:"#contato"}},
 ]));
 assert.equal(result.ok,true,"A changed label must still apply when its URL stays unchanged");
 if(result.ok){
   assert.equal(tp1Model3EditedText(result.site,"inicio","button"),"Agendar");
   assert.equal(result.site.blocks[2].hrefExplicit,undefined,"Unchanged URL is not marked explicit");
 }
 const noop=prepareTP1Model3VisibleEdit(site,applyUniversalOperations(site,[
  {action:"update",blockId:"hero-btn",changes:{text:"Contato",href:"#contato"}},
 ]));
 assert.equal(noop.ok,false,"The renderer must not report a no-op as an edit");
 const accepted=prepareTP1Model3VisibleEdit(site,applyUniversalOperations(site,[
  {action:"update",blockId:"hero-btn",changes:{text:"Agendar",href:"https://example.com/agendar"}},
 ]));
 assert.equal(accepted.ok,true);
 if(!accepted.ok)return;
 assert.equal(accepted.site.blocks[2].hrefExplicit,true);
 assert.equal(tp1Model3EditedText(accepted.site,"inicio","button"),"Agendar");
});

test("unsupported aesthetics color edit fails before it can be falsely reported as success",()=>{
 const site=baseline(),before=copy(site);
 const output=prepareTP1Model3VisibleEdit(site,applyUniversalOperations(site,[
  {action:"update",blockId:"hero-heading",changes:{color:"#00ff00"}},
 ]));
 assert.equal(output.ok,false);
 assert.deepEqual(site,before);
});

test("unknown section or unsupported field blocks an entire multi-operation request",()=>{
 const site=baseline(),before=copy(site);
 const attempted=prepareTP1Model3VisibleEdit(site,applyUniversalOperations(site,[
  {action:"update",blockId:"hero-heading",changes:{text:"Novo título"}},
  {action:"update",blockId:"faq-one",changes:{color:"#ff00aa"}},
 ]));
 assert.equal(attempted.ok,false);
 assert.deepEqual(site,before);
});

test("adding, deleting and reordering model-3 sections is conservatively refused",()=>{
 const site=baseline(),snapshot=copy(site);
 const removed=prepareTP1Model3VisibleEdit(site,applyUniversalOperations(site,[
   {action:"remove-section",sectionId:"sobre"},
 ]));
 assert.equal(removed.ok,false);
 const added=prepareTP1Model3VisibleEdit(site,applyUniversalOperations(site,[
   {action:"add",block:{id:"new-section",type:"heading",section:"nova-secao",text:"Nova"}},
 ]));
 assert.equal(added.ok,false);
 assert.deepEqual(site,snapshot);
});

test("FAQ invalid content is rejected; valid paired question and answer can be rendered",()=>{
 const site=baseline();
 const invalid=prepareTP1Model3VisibleEdit(site,applyUniversalOperations(site,[
   {action:"update",blockId:"faq-one",changes:{text:"Somente uma resposta sem pergunta"}},
 ]));
 assert.equal(invalid.ok,false);
 const valid=prepareTP1Model3VisibleEdit(site,applyUniversalOperations(site,[
   {action:"update",blockId:"faq-one",changes:{text:"Atende no sábado? Consulte a disponibilidade atualizada."}},
 ]));
 assert.equal(valid.ok,true);
 if(valid.ok)assert.equal(tp1Model3EditedText(valid.site,"faq","paragraph"),"Atende no sábado? Consulte a disponibilidade atualizada.");
});

test("explicit edit markers survive a complete JSON roundtrip like the saved draft",()=>{
 const site=baseline();
 const result=prepareTP1Model3VisibleEdit(site,applyUniversalOperations(site,[
  {action:"update",blockId:"hero-heading",changes:{text:"Novo título"}},
  {action:"update",blockId:"hero-img",changes:{src:"https://example.com/new.jpg"}},
 ]));
 assert.equal(result.ok,true);
 if(!result.ok)return;
 const restored=JSON.parse(JSON.stringify(result.site));
 assert.equal(tp1Model3EditedText(restored,"inicio","heading"),"Novo título");
 assert.equal(tp1Model3EditedImage(restored,"inicio"),"https://example.com/new.jpg");
 assert.equal(restored.templateId,site.templateId);
 assert.equal(restored.briefingLayoutVariant,site.briefingLayoutVariant);
});

test("unsafe image URLs cannot bypass the core operation validator",()=>{
 const site=baseline(),original=copy(site);
 const attempted=prepareTP1Model3VisibleEdit(site,applyUniversalOperations(site,[
  {action:"update",blockId:"hero-img",changes:{src:"javascript:alert(1)"}},
 ]));
 assert.equal(attempted.ok,false);
 assert.deepEqual(site,original);
});

test("real TP1 renderer is wired, existing Model 1/2 and CSS remain untouched",()=>{
 const hero=source("components/builder-v2-tp1-model3.tsx");
 const sections=source("components/builder-v2-tp1-model3-sections.tsx");
 const page=source("app/app/builder-v2/page.tsx");
 assert.ok(hero.includes('tp1Model3EditedImage(site,"inicio")'));
 assert.ok(hero.includes('tp1Model3EditedText(site,"inicio","heading")'));
 for(const section of ["sobre","servicos","diferenciais","experiencia","galeria","faq","contato","trajetoria","rodape"])
  assert.ok(sections.includes('edited("'+section+'","heading")'),section);
 assert.ok(sections.includes('imageOverride("galeria",i)'));
 assert.ok(sections.includes('imageOverride("servicos",i)'));
 assert.ok(page.includes('prepareTP1Model3VisibleEdit(site,result)'));
 assert.ok(page.includes('setSite(checkedResult.site)'));
 assert.ok(page.includes('const checkedRemote=prepareTP1Model3VisibleEdit(site,{ok:true,site:incoming,changedIds})'));
 assert.ok(page.indexOf("const checkedRemote=prepareTP1Model3VisibleEdit")<page.indexOf('recordVersion(site, "Antes da edição com IA")'));
 assert.equal(TP1_MODEL3_VISIBLE_SLOTS.galeria.image,6);
 const model1=source("components/builder-v2-tp1-model1.tsx");
 const model2=source("components/builder-v2-tp1-model2.tsx");
 assert.ok(!model1.includes("builder-v2-tp1-editor-bridge"));
 assert.ok(!model2.includes("builder-v2-tp1-editor-bridge"));
});

test("direct alignment shortcuts cannot report an invisible TP1 M3 edit",()=>{
 const site=baseline();
 const attempted=copy(site);
 attempted.blocks[2].align="center";
 const rejected=prepareTP1Model3VisibleEdit(site,{ok:true,site:attempted,changedIds:["hero-btn"]});
 assert.equal(rejected.ok,false);
 assert.deepEqual(site,baseline());
 const page=source("app/app/builder-v2/page.tsx");
 assert.ok(page.includes("const checkedDirect=directTP1Model3?prepareTP1Model3VisibleEdit(site,{"));
 assert.ok(page.indexOf("const checkedDirect=directTP1Model3?prepareTP1Model3VisibleEdit(site,{") < page.indexOf('recordVersion(site, "Antes de editar alinhamento")'));
 assert.ok(page.includes("setSite(checkedDirect?.ok?checkedDirect.site:direct.site)"));
});

test("uploaded image replacement is visible but unrenderable photo fields are rejected",()=>{
 const site=baseline();
 const replacement=copy(site);
 replacement.blocks[3].src="https://images.pexels.com/photos/123/upload.jpeg";
 replacement.blocks[3].userUploaded=true;
 const accepted=prepareTP1Model3VisibleEdit(site,{ok:true,site:replacement,changedIds:["hero-img"]});
 assert.equal(accepted.ok,true);
 if(accepted.ok){
   assert.equal(tp1Model3EditedImage(accepted.site,"inicio"),replacement.blocks[3].src);
   assert.equal(accepted.site.blocks[3].srcExplicit,true);
 }
 const bad=copy(site);
 bad.blocks[3].userUploaded=true;
 assert.equal(prepareTP1Model3VisibleEdit(site,{ok:true,site:bad,changedIds:["hero-img"]}).ok,false);
 const offscreen=copy(site);
 offscreen.blocks[3].src="https://example.com/new.jpg";
 offscreen.blocks[3].mobileSrc="https://example.com/mobile.jpg";
 offscreen.blocks[3].userUploaded=true;
 assert.equal(prepareTP1Model3VisibleEdit(site,{ok:true,site:offscreen,changedIds:["hero-img"]}).ok,false);
});

test("institutional uploaded image shortcut checks visibility before upload and history",()=>{
 const page=source("app/app/builder-v2/page.tsx");
 const beforeUpload=page.indexOf("const previewPlan=planInstitutionalImageEdit(site,prompt,provisional)");
 const checked=page.indexOf("const previewCheck=prepareTP1Model3VisibleEdit(site,");
 const upload=page.indexOf('await fetch("/api/builder-v2/assets",{method:"POST",body})',beforeUpload);
 const actual=page.indexOf("const uploadedCheck=uploadingToTP1Model3?prepareTP1Model3VisibleEdit(site,{");
 const version=page.indexOf('recordVersion(site,"Antes de alterar imagens institucionais")');
 assert.ok(beforeUpload>=0&&checked>beforeUpload&&upload>checked);
 assert.ok(actual>upload&&version>actual);
 assert.ok(page.includes("setSite({...("+"uploadedCheck?.ok?uploadedCheck.site:result.site"+"),id:projectId})"));
});
