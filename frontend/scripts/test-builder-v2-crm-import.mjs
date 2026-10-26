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
 for(const key of BUILDER_V2_CRM_TEMPLATES)assert.ok(crm.includes(key),key);
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
