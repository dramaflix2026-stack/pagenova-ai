import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {BUILDER_V2_CRM_TEMPLATES,crmAssetIds,crmTemplateFromConfig,convertCrmSiteToBuilder} from "../src/lib/builder-v2-crm-import.ts";
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(path.join(cwd,p),"utf8");
const img=(id)=>({assetId:id,alt:"Fotografia original do CRM"});
const cover="01KRM000000000000000000001";
const about="01KRM000000000000000000002";
const gallery="01KRM000000000000000000003";
const urls={[cover]:"https://cdn.example/hero.webp",[about]:"https://cdn.example/about.webp",[gallery]:"https://cdn.example/gallery.webp"};
const source=(template="image-text-alternating")=>({
 project:{builderV2TemplateId:template,templateId:"frigolog-universal"},
 business:{name:"Clínica Sorriso",niche:"Odontologia",
  phoneE164:{value:"+55 11 99999-8888"},instagramUrl:{value:"https://www.instagram.com/clinicasorriso/"}},
 theme:{colors:{background:"#ffffff",text:"#20332a"}},
 sections:[
  {id:"hero-1",type:"hero",headline:"Clínica Sorriso",subheadline:"Sua saúde em primeiro lugar",
   image:img(cover),primaryCta:{kind:"whatsapp",target:"5511999998888",label:"Agendar consulta"}},
  {id:"services-2",type:"services",headline:"Tratamentos",items:[
    {title:"Clínica geral",body:"Atendimento para sua saúde bucal"},
    {title:"Ortodontia",body:"Acompanhamento especializado"}]},
  {id:"about-3",type:"about",headline:"Nosso espaço",body:["Ambiente pensado para receber você."],image:img(about)},
  {id:"gallery-4",type:"gallery",headline:"Galeria de fotos",images:[img(gallery),img(about)]},
  {id:"footer-5",type:"footer",businessName:"Clínica Sorriso"}
 ]
});
test("four CRM choices are the exact existing Studio template IDs, never copies",()=>{
 assert.deepEqual(BUILDER_V2_CRM_TEMPLATES,[
 "institutional-complete","minimalist-sophisticated","modern-impactful","image-text-alternating"]);
 const studio=read("src/components/builder-v2-site.tsx");
 for(const key of BUILDER_V2_CRM_TEMPLATES)assert.ok(studio.includes(key),key);
 const crm=read("../modules/stavo-crm/src/client/pages/SiteAiPage.tsx");
 // The CRM does not ask which model to generate. It uses original Template 1
 // and leaves the other three available for later switching in the Builder.
 assert.match(crm,/builderV2TemplateId: 'institutional-complete' as const/);
 assert.doesNotMatch(crm,/Escolher template visual/);
});
test("lead import preserves existing CRM-generated hero photo, copy and selected template",()=>{
 const sourceSite=source();const converted=convertCrmSiteToBuilder(sourceSite,urls,"01KRMCRMPROJECT000000000001");
 assert.equal(converted.templateId,"image-text-alternating");
 assert.equal(converted.title,"Clínica Sorriso");
 assert.equal(converted.niche,"Odontologia");
 assert.equal(converted.blocks.find(b=>b.section==="principal"&&b.type==="image").src,urls[cover]);
 assert.equal(converted.blocks.find(b=>b.section==="principal"&&b.type==="heading").text,"Clínica Sorriso");
 assert.equal(converted.blocks.find(b=>b.section==="principal"&&b.type==="button").href,"https://wa.me/5511999998888");
 assert.ok(converted.blocks.some(b=>b.section==="sobre-nos"&&b.src===urls[about]));
 assert.ok(converted.blocks.some(b=>b.section==="galeria"&&b.src===urls[gallery]));
 assert.equal(sourceSite.sections[0].image.assetId,cover);
});
test("first hero cannot silently change to unrelated Google photo",()=>{
 assert.throws(()=>convertCrmSiteToBuilder(source(),{[about]:urls[about]},"01KRMCRMPROJECT000000000001"),/capa.*indisponível/);
});
test("lead niche is data, never a separate niche selection requirement",()=>{
 const converted=convertCrmSiteToBuilder(source("institutional-complete"),urls,"01KRMCRMPROJECT000000000001");
 assert.equal(converted.niche,"Odontologia");
 assert.equal(converted.templateId,"institutional-complete");
 assert.equal(converted.kind,"institutional");
});
test("old projects without Studio selection safely default to real Template 1",()=>{
 const config=source();delete config.project.builderV2TemplateId;
 assert.equal(crmTemplateFromConfig(config),"institutional-complete");
});
test("references deduplicated and site import never requests a paid generation job",()=>{
 assert.deepEqual(crmAssetIds(source()),[cover,about,gallery]);
 const transport=read("src/lib/builder-v2-crm-transport.ts");
 assert.doesNotMatch(transport,/\/generate[/"']/);
 assert.match(transport,/\/api\/crm\/site-projects\//);
 assert.match(transport,/\/api\/builder-v2\/assets/);
 const builder=read("src/app/app/builder-v2/page.tsx");
 assert.match(builder,/storageKey\+":crm:"\+projectId/);
 assert.match(builder,/importReadyCrmProject\(projectId\)/);
});

test("CRM import does not invent testimonials, rating counts or stock gallery images",()=>{
 const converted=convertCrmSiteToBuilder(source(),urls,"01KRMCRMPROJECT000000000001");
 assert.equal(converted.socialProof.enabled,false);
 assert.ok(converted.sectionMediaManaged.includes("galeria"));
 assert.ok(converted.blocks.filter(b=>b.type==="image").every(b=>b.userUploaded===true));
 assert.ok(converted.blocks.filter(b=>b.type==="image").every(b=>Object.values(urls).includes(b.src)));
});
test("first CRM import cannot persist an empty Site while photos are loading",()=>{
 const page=read("src/app/app/builder-v2/page.tsx");
 assert.match(page,/setDraftHydrated\(true\)/);
 assert.match(page,/if\(!loaded\|\|!draftHydrated\)return/);
 assert.match(page,/setCrmImporting\(true\)/);
 assert.match(page,/setCrmImportError\(/);
});
test("new CRM template projects auto-open original Builder while legacy projects are unaffected",()=>{
 const page=read("../modules/stavo-crm/src/client/pages/SiteProjectPage.tsx");
 assert.match(page,/useSiteDraftConfig\(editable/);
 assert.match(page,/builderV2TemplateId/);
 assert.match(page,/window\.top\?\.location\.assign\(destination\)/);
 assert.match(page,/crmLegacy/);
 assert.match(page,/templates\.includes\(modernSelection/);
});

test("CRM lead selection generates immediately; visual layout choice belongs in Builder after generation",()=>{
 const page=read("../modules/stavo-crm/src/client/pages/SiteAiPage.tsx");
 assert.match(page,/useEffect\(\(\)=>\{/);
 assert.match(page,/autoGenerationLeadRef\.current===selectedLeadId/);
 assert.match(page,/void createSiteDirectlyFromLead\(\)/);
 assert.match(page,/builderV2TemplateId: 'institutional-complete' as const/);
 assert.doesNotMatch(page,/selectedTemplateId/);
 assert.doesNotMatch(page,/Escolha um dos modelos/);
 assert.doesNotMatch(page,/Gerar com este template/);
 const editor=read("src/app/app/builder-v2/page.tsx");
 for(const template of BUILDER_V2_CRM_TEMPLATES)assert.ok(editor.includes(template));
 assert.match(editor,/setSite\(prev=>\(\{\.\.\.prev,templateId\}\)\)/);
});
test("Lead loading feedback no longer blocks scrolling behind a full-screen modal",()=>{
 const crm=read("../modules/stavo-crm/src/client/pages/SiteAiPage.tsx");
 assert.doesNotMatch(crm,/fixed inset-0 z-\[80\]/);
 assert.match(crm,/pointer-events-none fixed inset-x-0 bottom-3/);
 assert.match(crm,/pointer-events-auto w-full max-w-md/);
 assert.match(crm,/max-h-\[calc\(100dvh-2rem\)\] overflow-y-auto/);
});
