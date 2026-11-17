import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessPreventiveRouteGate} from "../src/lib/builder-v2-preventive-route-gate.ts";
const id=n=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const event=(n,route="ai-editor-visual-verified",review="approved",changes={})=>({
 id:id(n),request_id:id(n),operation_index:1,
 submitted_at:"2026-11-17T08:00:00Z",created_at:"2026-11-17T08:00:01Z",
 reviewed_at:"2026-11-17T08:00:05Z",intent:"copy",target:"hero",
 niche:"Auto centers",model:"02",section_key:"hero",strategy:route,
 review_status:review,execution_status:"applied",...changes
});
const ctx={intent:"copy",target:"hero",niche:"Auto centers",model:"02",sectionKey:"hero",recordsComplete:true};
test("delivery 10: 59 legacy approvals do not outweigh one traced outcome",()=>{
 const rows=[...Array.from({length:59},(_,i)=>event(i+10,"ai-editor","approved",{request_id:null})),event(1)];
 const result=assessPreventiveRouteGate(rows,ctx);
 assert.equal(result.legacyEvents,59);
 assert.equal(result.reviewedRequests,1);
 assert.equal(result.allowAiPromotion,false);
});
test("delivery 10: promotion requires 8 fully reviewed requests in the same context",()=>{
 assert.equal(assessPreventiveRouteGate([event(1),event(2)],ctx).allowAiPromotion,false);
 const e=Array.from({length:8},(_,i)=>event(i+1));
 assert.equal(assessPreventiveRouteGate(e,ctx).allowAiPromotion,true);
});
test("delivery 10: repeated recent failures prevent route promotion",()=>{
 const rows=Array.from({length:10},(_,i)=>event(i+1,"ai-editor-visual-verified",i>=7?"rejected":"approved",{
  submitted_at:new Date(Date.UTC(2026,10,17,8,i)).toISOString(),
  created_at:new Date(Date.UTC(2026,10,17,8,i,1)).toISOString(),
  reviewed_at:new Date(Date.UTC(2026,10,17,8,i,2)).toISOString()
 }));
 const result=assessPreventiveRouteGate(rows,ctx);
 assert.equal(result.allowAiPromotion,false);
 assert.equal(result.routes[1].recentFailures,3);
});
test("delivery 10: mismatched niche, model, target, and section are not transferred",()=>{
 const data=[
  event(1,"ai-editor","approved",{niche:"Oficinas mecânicas"}),
  event(2,"ai-editor","approved",{model:"03"}),
  event(3,"ai-editor","approved",{target:"gallery"}),
  event(4,"ai-editor","approved",{section_key:"footer"})
 ];
 assert.equal(assessPreventiveRouteGate(data,ctx).reviewedRequests,0);
});
test("delivery 10: incomplete, pending and mixed-route commands cannot promote a route",()=>{
 const cases=[
  [event(1,"ai-editor","approved",{operation_index:2})],
  [event(1),event(2,"ai-editor","approved",{request_id:id(1),operation_index:1})],
  [event(1,"ai-editor","pending")],
  [event(1),event(2,"universal","approved",{request_id:id(1),operation_index:2})],
  [event(1,"ai-editor","approved",{reviewed_at:null})]
 ];
 for(const data of cases){
  const summary=assessPreventiveRouteGate(data,ctx);
  assert.equal(summary.reviewedRequests,0);
  assert.ok(summary.excludedRequests>=1);
 }
});
test("delivery 10: data pagination truncation prevents any promotion",()=>{
 const rows=Array.from({length:20},(_,i)=>event(i+1));
 const result=assessPreventiveRouteGate(rows,{...ctx,recordsComplete:false});
 assert.equal(result.allowAiPromotion,false);
 assert.equal(result.allowScopedCopyPromotion,false);
});
test("delivery 10: an equally strong verified universal path is not displaced",()=>{
 const ai=Array.from({length:10},(_,i)=>event(i+1));
 const universal=Array.from({length:10},(_,i)=>event(i+101,"universal-five-types-visual-verified"));
 assert.equal(assessPreventiveRouteGate([...ai,...universal],ctx).allowAiPromotion,false);
});
test("delivery 10: scoped copy can be promoted independently with sufficient evidence",()=>{
 const rows=Array.from({length:8},(_,i)=>event(i+1,"scoped-copy"));
 const p=assessPreventiveRouteGate(rows,ctx);
 assert.equal(p.allowScopedCopyPromotion,true);
 assert.equal(p.allowAiPromotion,false);
});
test("delivery 10: route guards are owner-scoped and keep real DOM audit before success",()=>{
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(page,/assessPreventiveRouteGate\(approvedPatterns,/);
 assert.match(page,/\.eq\("user_id",user\.id\)/);
 assert.match(page,/preventiveGate\.allowAiPromotion/);
 assert.match(page,/preventiveGate\.allowScopedCopyPromotion/);
 assert.match(page,/strategy:"ai-editor-visual-verified"/);
 assert.match(page,/pending\.strategy\|\|"universal-five-types-visual-verified"/);
 assert.match(page,/auditUniversalVisualProof\(root,win,pending\.contract\)/);
});
