import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {quarantineReviewedReuses,reuseKey} from "../src/lib/builder-v2-learned-technique-quarantine.ts";
import {selectApprovedExecutionTechnique} from "../src/lib/builder-v2-universal-solution-reuse.ts";
const uuid=n=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const source=uuid(200);
const edge=(n,technique="section-background")=>({
 event_id:uuid(n),source_event_id:source,technique,created_at:new Date(Date.UTC(2026,10,17,10,n)).toISOString()
});
const outcome=(n,review_status="approved",execution_status="applied")=>({
 id:uuid(n),review_status,execution_status,
 created_at:new Date(Date.UTC(2026,10,17,9,n)).toISOString(),
 reviewed_at:new Date(Date.UTC(2026,10,17,11,n)).toISOString()
});
const memory={event_id:source,intent:"style",target:"services",section_key:"services",strategy:"universal-visual-verified",
 review_status:"approved",execution_status:"applied",verification:"visual",
 context:{niche:"Auto centers",model:"02",family:"9",template:"prompt-adaptive"},
 deltas:[{kind:"section-style",section:"services",field:"backgroundColor",before:"#ffffff",after:"#aabbcc"}]};
const request={intent:"style",target:"services",sectionKey:"services",niche:"Auto centers",model:"02",family:"9",template:"prompt-adaptive",instruction:"Pinte o fundo da seção Serviços de laranja"};
test("Delivery 11: two successful existing reuses do not get quarantined",()=>{
 const result=quarantineReviewedReuses([edge(1),edge(2)],[outcome(1),outcome(2)]);
 assert.equal(result.usable,true);assert.equal(result.reviewed,2);assert.equal(result.blocked.size,0);
 assert.equal(selectApprovedExecutionTechnique([memory],request)?.technique,"section-background");
});
test("Delivery 11: two recent explicit rejections quarantine only the failing technique",()=>{
 const result=quarantineReviewedReuses([edge(1),edge(2),edge(3)],
  [outcome(1),outcome(2,"rejected"),outcome(3,"rejected")]);
 assert.equal(result.blocked.has(reuseKey(source,"section-background")),true);
 assert.equal(selectApprovedExecutionTechnique([{...memory,blockedTechniques:["section-background"]}],request),null);
});
test("Delivery 11: one rejected reuse does not discard a previously valid method",()=>{
 const r=quarantineReviewedReuses([edge(1),edge(2)],[outcome(1),outcome(2,"rejected")]);
 assert.equal(r.blocked.size,0);assert.equal(r.failed,1);
});
test("Delivery 11: pending review stays neutral; failures from other techniques stay separate",()=>{
 const rows=[edge(1),edge(2,"block-copy"),edge(3)];
 const outcomes=[outcome(1,"rejected"),outcome(2,"rejected"),{...outcome(3),review_status:"pending",reviewed_at:null}];
 const r=quarantineReviewedReuses(rows,outcomes);
 assert.equal(r.usable,true);assert.equal(r.reviewed,2);assert.equal(r.pending,1);assert.equal(r.blocked.size,0);
});
test("Delivery 11: nonreviewed, missing, unknown technique, corrupted or truncated history fails closed",()=>{
 assert.equal(quarantineReviewedReuses([edge(1)],[]).usable,false);
 assert.equal(quarantineReviewedReuses([edge(1)],[outcome(1)],false).usable,false);
 assert.equal(quarantineReviewedReuses([{...edge(1),technique:"script-exec"}],[outcome(1)]).usable,false);
 assert.equal(quarantineReviewedReuses([{...edge(1),created_at:"2026-11-17T08:00:00Z"}],[outcome(1)]).usable,false);
 assert.equal(quarantineReviewedReuses([edge(1)],[{...outcome(1),reviewed_at:null}]).usable,false);
});
test("Delivery 11: blocked source allows an alternate approved source and does not replay old values",()=>{
 const next={...memory,event_id:uuid(201)};
 const selected=selectApprovedExecutionTechnique([{...memory,blockedTechniques:["section-background"]},next],request);
 assert.equal(selected?.sourceEventId,next.event_id);
 const learned=readFileSync(new URL("../src/lib/builder-v2-universal-learned-style.ts",import.meta.url),"utf8");
 assert.match(learned,/const section=resolveUniversalSection\(site,label\)/);
 assert.doesNotMatch(learned,/technique\.deltas|technique\.after/);
});
test("Delivery 11: Supabase queries are owner-scoped and quarantine happens before selecting",()=>{
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(page,/from\("builder_editor_learning_reuses"\)/);
 assert.match(page,/\.eq\("user_id",user\.id\)/);
 assert.match(page,/quarantineReviewedReuses\(edges,targets as ReuseOutcome\[\],true\)/);
 assert.match(page,/blockedTechniques:/);
 assert.match(page,/readApprovedEditorSolutionCases\(inferredIntent,inferredTarget\)/);
 assert.match(page,/selectApprovedExecutionTechnique\(approvedSolutions/);
});
