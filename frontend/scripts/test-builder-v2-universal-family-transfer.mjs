import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveBriefingFamily} from "../src/lib/briefing-template-families.ts";
import {selectApprovedExecutionTechnique} from "../src/lib/builder-v2-universal-solution-reuse.ts";
import {applyApprovedSectionBackground} from "../src/lib/builder-v2-universal-learned-style.ts";

const previous="f4e327b9-6a37-46b9-979a-fd0c4e27c620";
const reviewed={
 event_id:previous,intent:"style",target:"services",section_key:"services",
 strategy:"universal-visual-verified",review_status:"approved",execution_status:"applied",
 verification:"visual",
 context:{niche:"Auto centers",model:"02",family:"9",template:"prompt-adaptive"},
 deltas:[{kind:"section-style",section:"servicos",field:"backgroundColor",before:"#2563eb",after:"#16a34a"}]
};
const request={
 intent:"style",target:"services",sectionKey:"services",
 niche:"Oficinas mecânicas",model:"02",family:"9",template:"prompt-adaptive",
 instruction:"Pinte o fundo da seção Serviços de laranja"
};
const choose=(source=reviewed,query=request)=>selectApprovedExecutionTechnique([source],query);

test("canonical catalog identifies the two real TP9 niches and rejects unrelated TP",()=>{
 assert.equal(resolveBriefingFamily("Auto centers"),9);
 assert.equal(resolveBriefingFamily("Oficinas mecânicas"),9);
 assert.equal(resolveBriefingFamily("Autoelétricas"),9);
 assert.equal(resolveBriefingFamily("Pizzaria"),3);
 assert.equal(resolveBriefingFamily("Clínica veterinária"),4);
});
test("approved TP9 background memory transfers to another TP9 niche, not another family",()=>{
 const picked=choose();
 assert.equal(picked?.technique,"section-background");
 assert.equal(picked?.scope,"family");
 assert.equal(picked?.familyId,9);
 assert.equal(picked?.sourceEventId,previous);
 assert.equal(choose(reviewed,{...request,niche:"Pizzaria",family:"3"}),null);
 assert.equal(choose(reviewed,{...request,niche:"Clínica veterinária",family:"4"}),null);
});
test("same-niche memories remain preferred over same-family examples",()=>{
 const other={...reviewed,event_id:"4e90752f-50b6-4bfb-8d50-c5df7646d0b4",
  context:{...reviewed.context,niche:"Oficinas mecânicas"}};
 const selected=selectApprovedExecutionTechnique([reviewed,other],request);
 assert.equal(selected?.sourceEventId,other.event_id);
 assert.equal(selected?.scope,"niche");
});
test("family transfer fails closed if either source or requested family is forged",()=>{
 assert.equal(choose({...reviewed,context:{...reviewed.context,family:"3"}}),null);
 assert.equal(choose(reviewed,{...request,family:"3"}),null);
 assert.equal(choose({...reviewed,context:{...reviewed.context,niche:"Pizzaria",family:"9"}}),null);
 assert.equal(choose(reviewed,{...request,niche:"Nicho não registrado",family:"9"}),null);
});
test("family transfer requires identical model and template and explicit target section",()=>{
 assert.equal(choose(reviewed,{...request,model:"03"}),null);
 assert.equal(choose(reviewed,{...request,template:"institutional-complete"}),null);
 assert.equal(choose({...reviewed,context:{...reviewed.context,template:"minimalist-sophisticated"}}),null);
 assert.equal(choose(reviewed,{...request,template:undefined}),null);
 assert.equal(choose(reviewed,{...request,sectionKey:undefined}),null);
 assert.equal(choose({...reviewed,section_key:null}),null);
 assert.equal(choose(reviewed,{...request,sectionKey:"footer"}),null);
});
test("no cross-niche training from failed, pending, unverified or unsupported sources",()=>{
 assert.equal(choose({...reviewed,review_status:"rejected"}),null);
 assert.equal(choose({...reviewed,review_status:"pending"}),null);
 assert.equal(choose({...reviewed,execution_status:"rejected"}),null);
 assert.equal(choose({...reviewed,verification:"model"}),null);
 assert.equal(choose({...reviewed,strategy:"ai-editor"}),null);
 assert.equal(choose({...reviewed,strategy:"scoped-copy"}),null);
});
test("only the visually proven section-background adapter transfers across niches",()=>{
 const copy={...reviewed,intent:"copy",target:"services",
  deltas:[{kind:"block-field",section:"servicos",blockType:"paragraph",field:"text",after:"Texto privado"}]};
 assert.equal(choose(copy,{...request,intent:"copy",instruction:"Troque o texto da seção Serviços para outro texto"}),null);
 const alignment={...reviewed,intent:"layout",
  deltas:[{kind:"block-field",section:"servicos",blockType:"heading",field:"align",before:"left",after:"center"}]};
 assert.equal(choose(alignment,{...request,intent:"layout",instruction:"Centralize os títulos da seção Serviços"}),null);
 const images={...reviewed,intent:"image",
  deltas:[{kind:"section-photo",section:"servicos",field:"src",after:"<public-web-url>"}]};
 assert.equal(choose(images,{...request,intent:"image",instruction:"Troque a foto da seção Serviços"}),null);
});
test("new requested color, not source color, is applied to the correct section on target niche",()=>{
 const source=choose();
 const site={
  niche:"Oficinas mecânicas",blocks:[
   {id:"hero",type:"heading",section:"hero",text:"Oficina Exemplo"},
   {id:"servicos",type:"heading",section:"servicos",text:"Serviços"}
  ],
  universalSectionStyles:{hero:{backgroundColor:"#141414"},servicos:{backgroundColor:"#ffffff"}}
 };
 const output=applyApprovedSectionBackground(site,request.instruction,source);
 assert.equal(output?.ok,true);
 assert.equal(output?.site.universalSectionStyles.servicos.backgroundColor,"#f97316");
 assert.equal(output?.site.universalSectionStyles.hero.backgroundColor,"#141414");
 assert.deepEqual(output?.site.blocks,site.blocks);
 assert.notEqual(output?.site.universalSectionStyles.servicos.backgroundColor,reviewed.deltas[0].after);
});
test("production lookup and attribution stay scoped to the authenticated account",()=>{
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 const sql=readFileSync(new URL("../supabase/migrations/20261116_builder_editor_learning_reuses.sql",import.meta.url),"utf8");
 assert.match(page,/from\("builder_editor_solution_memories"\)[\s\S]*?\.eq\("user_id",user\.id\)/);
 assert.match(page,/from\("builder_editor_learning_events"\)[\s\S]*?\.eq\("user_id",user\.id\)/);
 assert.match(page,/template:site\.templateId,instruction:prompt/);
 assert.match(page,/approvedTechnique\.scope==="family"/);
 assert.match(page,/pendingBackgroundVisualReviewRef\.current=\{/);
 assert.match(sql,/source_event\.review_status='approved'/);
 assert.match(sql,/source_event\.user_id=\(select auth\.uid\(\)\)/);
});
