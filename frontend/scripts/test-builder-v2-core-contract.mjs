import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {BRIEFING_TEMPLATE_FAMILIES,resolveBriefingFamily} from "../src/lib/briefing-template-families.ts";
import {applyUniversalOperations} from "../src/lib/builder-v2-universal-operations.ts";
const read=(path)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");

test("the catalog has ten unique families and no duplicate niche labels",()=>{
 const families=BRIEFING_TEMPLATE_FAMILIES;
 assert.equal(families.length,10);
 assert.deepEqual(families.map(f=>f.id),[1,2,3,4,5,6,7,8,9,10]);
 const niches=families.flatMap(f=>f.niches);
 const unique=new Set(niches.map(n=>n.normalize("NFD").replace(/\p{M}/gu,"").toLowerCase()));
 assert.equal(unique.size,niches.length);
 assert.ok(niches.length>=133,"unexpected loss of catalog niches");
 console.log("Inventory:",niches.length,"registered niches; historical commercial target 133.");
});

test("every niche routes to its declared family; dermatology distinction is stable",()=>{
 for(const family of BRIEFING_TEMPLATE_FAMILIES)for(const niche of family.niches)
  assert.equal(resolveBriefingFamily(niche),family.id,niche);
 assert.equal(resolveBriefingFamily("Clínica de estética"),1);
 assert.equal(resolveBriefingFamily("Dermatologia"),1);
 assert.equal(resolveBriefingFamily("Dermatologia clínica"),4);
});

test("Builder uses three model variants and dispatches all registered families",()=>{
 const page=read("app/app/builder-v2/page.tsx");
 const renderer=read("components/builder-v2-site.tsx");
 assert.match(page,/\["01","02","03"\]\s+as\s+const/);
 assert.ok(page.includes("resolveBriefingFamily("));
 assert.ok(page.includes('fetch("/api/builder-v2/chat"'));
 for(let id=1;id<=10;id++)
  assert.ok(renderer.includes("family==="+id),"missing family dispatch TP"+id);
 assert.ok(renderer.includes("briefingLayoutVariant"));
});

test("universal block edit is targeted, preserves identity and never mutates source",()=>{
 const original={
  id:"test",templateId:"prompt-adaptive",briefingLayoutVariant:"03",niche:"Clínica de estética",
  extras:{marker:true},blocks:[
   {id:"hero",type:"heading",section:"hero",text:"Original"},
   {id:"intro",type:"paragraph",section:"hero",text:"Preservar"},
   {id:"faq",type:"heading",section:"faq",text:"Perguntas"}
  ]
 };
 const before=structuredClone(original);
 const applied=applyUniversalOperations(original,[{action:"update",blockId:"hero",changes:{text:"Alterado"}}]);
 assert.equal(applied.ok,true);
 if(!applied.ok)return;
 assert.equal(applied.site.blocks[0].text,"Alterado");
 assert.deepEqual(applied.site.blocks.slice(1),before.blocks.slice(1));
 assert.equal(applied.site.briefingLayoutVariant,"03");
 assert.deepEqual(applied.site.extras,before.extras);
 assert.deepEqual(original,before);
});

test("unsafe URL or missing block makes the entire edit batch fail",()=>{
 const original={blocks:[
  {id:"title",type:"heading",section:"hero",text:"Original"},
  {id:"cta",type:"button",section:"hero",text:"Contato",href:"#contato"}
 ]};
 const before=structuredClone(original);
 const failed=applyUniversalOperations(original,[
  {action:"update",blockId:"title",changes:{text:"Novo"}},
  {action:"update",blockId:"cta",changes:{href:"javascript:alert(1)"}}
 ]);
 assert.equal(failed.ok,false);
 assert.deepEqual(original,before);
 assert.equal(applyUniversalOperations(original,[{action:"update",blockId:"missing",changes:{text:"Novo"}}]).ok,false);
});

test("preview truthfulness, autosave hydration guard and publishing snapshot remain present",()=>{
 const previews=read("components/builder-v2-tp1-family-testimonials.tsx");
 const page=read("app/app/builder-v2/page.tsx");
 const publish=read("app/api/builder-v2/publish/route.ts");
 assert.ok(previews.includes("if(publishedMode&&!realReviews.length)return null;"));
 assert.ok(previews.includes("EXEMPLO FICTÍCIO"));
 for(const marker of ["draftHydrated","storageProjectReady","draftRecoveryFailed","readPageNovaProject","savePageNovaProject","applyUniversalNaturalLanguage"])
  assert.ok(page.includes(marker),marker);
 assert.ok(publish.includes("snapshot"));
});
