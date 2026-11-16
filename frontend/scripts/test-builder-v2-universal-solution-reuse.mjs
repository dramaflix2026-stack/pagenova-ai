import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {selectApprovedExecutionTechnique,shouldRerouteUsingApprovedTechnique,confirmedReuseSource} from "../src/lib/builder-v2-universal-solution-reuse.ts";

const goodId="f4e327b9-6a37-46b9-979a-fd0c4e27c620";
const otherId="4e90752f-50b6-4bfb-8d50-c5df7646d0b4";
const base={
 event_id:goodId,intent:"style",target:"services",section_key:"services",
 strategy:"universal",review_status:"approved",execution_status:"applied",
 verification:"visual",context:{niche:"Fisioterapia",model:"02",family:"4",template:"institutional"},
 deltas:[{kind:"section-style",section:"services",field:"backgroundColor",before:"#ffffff",after:"#222222"}]
};
const context={
 intent:"style",target:"services",sectionKey:"services",
 niche:"Fisioterapia",model:"02",family:"4",
 instruction:"Mude o fundo da seção Serviços para azul"
};
const pick=(a=[base],b={})=>selectApprovedExecutionTechnique(a,{...context,...b});
test("retrieves matching approved real section-background technique without reusing old color",()=>{
 const selected=pick();
 assert.equal(selected.sourceEventId,goodId);
 assert.equal(selected.technique,"section-background");
 assert.ok(!("after" in selected)&&!("before" in selected));
 assert.ok(!JSON.stringify(selected).includes("#222222"));
});
test("one reviewed, applied, verified memory is required",()=>{
 for(const field of ["review_status","execution_status"]){
  const row={...base,[field]:field==="review_status"?"pending":"rejected"};
  assert.equal(pick([row]),null);
 }
 assert.equal(pick([{...base,review_status:"rejected"}]),null);
 assert.equal(pick([{...base,verification:"unverified"}]),null);
 assert.equal(pick([{...base,event_id:"invalid"}]),null);
});
test("requested target and section must both match; wrong niche and family never transfer",()=>{
 assert.equal(pick([]),null);
 assert.equal(pick([base],{target:"hero"}),null);
 assert.equal(pick([base],{sectionKey:"footer"}),null);
 assert.equal(pick([base],{niche:"Pizzaria",family:"3"}),null);
 assert.equal(pick([base],{model:"03"}),null);
 assert.equal(pick([base],{target:"unspecified"}),null);
});
test("same niche is preferred over same-family cross-niche case, visual over data-only",()=>{
 const distant={...base,event_id:otherId,verification:"model",context:{...base.context,niche:"Acupuntura"}};
 const selected=pick([distant,base]);
 assert.equal(selected.sourceEventId,goodId);
 const family=pick([distant],{niche:"Quiropraxia",family:"4"});
 assert.equal(family?.sourceEventId,otherId);
});
test("different technique: title color must not be mistaken for background change",()=>{
 const title={...base,deltas:[{kind:"section-style",section:"services",field:"headingColor",after:"#123456"}]};
 assert.equal(pick([title]),null);
 assert.equal(pick([title],{instruction:"Mude a cor do título da seção Serviços para branco"})?.technique,"section-heading-color");
});
test("approved text changes guide only copy operations for the right target",()=>{
 const copy={...base,intent:"copy",target:"hero",section_key:"hero",deltas:[{kind:"block-field",section:"hero",blockType:"heading",field:"text",after:"Antigo slogan"}]};
 const c={...context,intent:"copy",target:"hero",sectionKey:"hero",instruction:"Troque o texto da hero para novo slogan"};
 assert.equal(selectApprovedExecutionTechnique([copy],c)?.technique,"block-copy");
 assert.equal(selectApprovedExecutionTechnique([copy],{...c,target:"services"}),null);
});
test("approved moves, alignment and section removal are distinct techniques",()=>{
 const layout={...base,intent:"layout",target:"services",deltas:[{kind:"block-field",section:"services",blockType:"heading",field:"align",before:"left",after:"center"}]};
 assert.equal(pick([layout],{intent:"layout",instruction:"Centralize o título da seção Serviços"})?.technique,"block-alignment");
 assert.equal(pick([layout],{intent:"layout",instruction:"Mova a seção serviços depois de contato"}),null);
 const move={...layout,deltas:[{kind:"section-event",section:"services",field:"move"}]};
 assert.equal(pick([move],{intent:"layout",instruction:"Mova a seção serviços depois de contato"})?.technique,"section-reorder");
 const removal={...base,intent:"remove-section",deltas:[{kind:"section-event",section:"services",field:"remove"}]};
 assert.equal(pick([removal],{intent:"remove-section"})?.technique,"section-remove");
});
test("no direct replay of images, links, uploaded customer data, arbitrary values or unsupported changes",()=>{
 const malicious={...base,deltas:[{kind:"section-photo",section:"services",field:"src",after:"https://example.com/secret?token=private"}]};
 assert.equal(pick([malicious]),null);
 assert.equal(pick([{...base,deltas:[{kind:"block-other",reason:"raw CSS"}]}]),null);
});
test("approved memory can override weak AI/copy heuristic when matching and safe",()=>{
 const selected=pick();
 const defaults={compound:false,hasAttachments:false,imageChange:false,preferScopedCopy:false,learnedAiEligible:true,strongAiEvidence:false};
 assert.equal(shouldRerouteUsingApprovedTechnique(selected,defaults),true);
 assert.equal(shouldRerouteUsingApprovedTechnique(selected,{...defaults,preferScopedCopy:true,learnedAiEligible:false}),true);
});
test("no override for attachments, compound edits, images, or a strong evidenced AI route",()=>{
 const selected=pick();
 const d={compound:false,hasAttachments:false,imageChange:false,preferScopedCopy:false,learnedAiEligible:true,strongAiEvidence:false};
 assert.equal(shouldRerouteUsingApprovedTechnique(null,d),false);
 assert.equal(shouldRerouteUsingApprovedTechnique(selected,{...d,hasAttachments:true}),false);
 assert.equal(shouldRerouteUsingApprovedTechnique(selected,{...d,imageChange:true}),false);
 assert.equal(shouldRerouteUsingApprovedTechnique(selected,{...d,compound:true}),false);
 assert.equal(shouldRerouteUsingApprovedTechnique(selected,{...d,strongAiEvidence:true}),false);
});
test("counts reuse only after strategy was changed and a fresh verified edit succeeded",()=>{
 const selected=pick();
 assert.equal(confirmedReuseSource(selected,false,true),null);
 assert.equal(confirmedReuseSource(selected,true,false),null);
 assert.equal(confirmedReuseSource(null,true,true),null);
 assert.equal(confirmedReuseSource(selected,true,true),goodId);
});
test("production path is wired before execution and attribution is tied to the new feedback UUID",()=>{
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 const schema=readFileSync(new URL("../supabase/migrations/20261116_builder_editor_learning_reuses.sql",import.meta.url),"utf8");
 assert.match(page,/readApprovedEditorSolutionCases\(inferredIntent,inferredTarget\)/);
 assert.match(page,/selectApprovedExecutionTechnique\(approvedSolutions/);
 assert.match(page,/shouldRerouteUsingApprovedTechnique\(approvedTechnique/);
 assert.match(page,/confirmedReuseSource\(approvedTechnique,memoryRouteOverride,!!verifiedSolution\)/);
 assert.match(page,/event_id:event.id,user_id:user.id,source_event_id:event.reuse.sourceEventId/);
 assert.match(schema,/source_event\.review_status='approved'/);
 assert.match(schema,/source_event\.execution_status='applied'/);
 assert.match(schema,/next_event\.execution_status='applied'/);
 assert.match(schema,/\(select auth\.uid\(\)\)=user_id/);
 assert.match(schema,/revoke all on public\.builder_editor_learning_reuses from public,anon,authenticated/);
 assert.doesNotMatch(schema,/raw_prompt|instruction\s+text/);
});
