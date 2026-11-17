import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateStrategyEvidence} from "../src/lib/builder-v2-strategy-evidence.ts";
const id=n=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const event=(n,request=n,operation=1,route="universal-five-types-visual-verified",review="approved",execution="applied")=>({
 id:id(n),request_id:id(request),operation_index:operation,
 submitted_at:"2026-11-17T11:10:00Z",created_at:"2026-11-17T11:10:02Z",
 review_status:review,execution_status:execution,strategy:route,intent:"copy",target:"hero"
});
const source={id:id(100),review_status:"approved",execution_status:"applied",reviewed_at:"2026-11-17T11:00:00Z"};
const memory={event_id:id(100),schema_version:2,verification:"visual"};
test("Delivery 9: each route is counted by reviewed command, not by operations",()=>{
 const rows=[event(1,1,1),event(2,1,2),event(3,3,1,"ai-editor","rejected")];
 const result=evaluateStrategyEvidence(rows,[],[],[]);
 assert.deepEqual(result.routes.map(x=>[x.key,x.reviewed,x.successful,x.failed]),[
  ["universal",1,1,0],["ai-editor",1,0,1],["scoped-copy",0,0,0]
 ]);
 assert.equal(result.contexts.length,2);
 assert.equal(result.statisticallyPreferredRoute,null);
});
test("Delivery 9: an attributed reuse requires an approved source and visual v2 memory BEFORE target",()=>{
 const target=event(1);
 const reuse=[{event_id:id(1),source_event_id:id(100),technique:"section-background"}];
 const ok=evaluateStrategyEvidence([target],reuse,[source],[memory]);
 assert.equal(ok.requestsWithVerifiedReuse,1);assert.equal(ok.verifiedReuseOperations,1);
 const late=evaluateStrategyEvidence([target],reuse,[{...source,reviewed_at:"2026-11-17T11:20:00Z"}],[memory]);
 assert.equal(late.requestsWithVerifiedReuse,0);assert.equal(late.missingOrLateReuseOperations,1);
 const notVisual=evaluateStrategyEvidence([target],reuse,[source],[{...memory,verification:"data"}]);
 assert.equal(notVisual.requestsWithVerifiedReuse,0);
 const unapproved=evaluateStrategyEvidence([target],reuse,[{...source,review_status:"rejected"}],[memory]);
 assert.equal(unapproved.requestsWithVerifiedReuse,0);
});
test("Delivery 9: an untraced older reuse is never evidence for a tracked request",()=>{
 const result=evaluateStrategyEvidence([event(1)],[{event_id:id(200),source_event_id:id(100)}],[source],[memory]);
 assert.equal(result.withVerifiedReuse.reviewed,0);
 assert.equal(result.withoutVerifiedReuseRecord.reviewed,1);
});
test("Delivery 9: mixed route requests and unresolved operations are excluded from strategy wins",()=>{
 const rows=[event(1,1,1),event(2,1,2,"ai-editor"),event(3,3,1,"scoped-copy","pending"),
   event(4,4,2)];
 const stats=evaluateStrategyEvidence(rows,[],[],[]);
 assert.equal(stats.mixedRouteRequests,1);assert.equal(stats.incompleteRequests,2);
 assert.equal(stats.routes.reduce((v,r)=>v+r.successful,0),0);
});
test("Delivery 9: a request with a rejected operation is not a success",()=>{
 const rows=[event(1,1,1),event(2,1,2,"universal-color","rejected","applied")];
 const stats=evaluateStrategyEvidence(rows,[],[],[]);
 assert.equal(stats.routes[0].failed,1);assert.equal(stats.routes[0].successful,0);
});
test("Delivery 9: tiny sample or incomplete pagination never creates winning strategy",()=>{
 const tiny=evaluateStrategyEvidence([event(1)],[],[],[]);
 assert.equal(tiny.eligibleForStrategyComparison,false);
 assert.equal(tiny.routes[0].ratePercent,null);
 const trunc=evaluateStrategyEvidence([event(1)],[],[],[],false);
 assert.equal(trunc.eligibleForStrategyComparison,false);
 assert.equal(trunc.statisticallyPreferredRoute,null);
});
test("Delivery 9: UI fetches only owner-scoped identifiers and status, no prompts or customer content",()=>{
 const ui=readFileSync(new URL("../src/components/builder-v2-learning-metrics.tsx",import.meta.url),"utf8");
 assert.match(ui,/evaluateStrategyEvidence/);
 assert.match(ui,/builder_editor_solution_memories/);
 assert.match(ui,/builder_editor_learning_reuses/);
 assert.match(ui,/\.eq\("user_id",user\.id\)/);
 assert.match(ui,/Amostra insuficiente|Amostra pequena/);
 assert.doesNotMatch(ui,/\.select\("[^"]*(?:instruction_redacted|deltas|site|customer_prompt|requested_value)[^"]*"\)/);
});
