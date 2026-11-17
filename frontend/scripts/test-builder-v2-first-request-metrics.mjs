import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {measureFirstRequests,wilson95} from "../src/lib/builder-v2-first-request-metrics.ts";
const IDs=["00000000-0000-4000-8000-000000000001","00000000-0000-4000-8000-000000000002","00000000-0000-4000-8000-000000000003","00000000-0000-4000-8000-000000000004"];
const event=(id,request=IDs[0],index=1,review="approved",execution="applied")=>({
 id,request_id:request,operation_index:index,review_status:review,execution_status:execution,
 created_at:"2026-11-17T10:00:01Z",submitted_at:"2026-11-17T10:00:00Z"
});
test("Delivery 8: legacy approvals are never invented as successful first attempts",()=>{
 const stats=measureFirstRequests([event(IDs[1])],new Set(),61);
 assert.equal(stats.legacyEvents,60);assert.equal(stats.tracedRequests,1);
 assert.equal(stats.successfulRequests,1);assert.equal(stats.ratePercent,null);
 assert.equal(stats.statisticallySupports98Percent,false);
});
test("Delivery 8: fail + success in one UUID is ONE unsuccessful submitted request",()=>{
 const stats=measureFirstRequests([event(IDs[1],IDs[0],1,"rejected","applied"),event(IDs[2],IDs[0],2)],new Set(),2);
 assert.equal(stats.reviewedRequests,1);assert.equal(stats.failedRequests,1);assert.equal(stats.successfulRequests,0);
});
test("Delivery 8: compound requests require every operation reviewed and applied",()=>{
 const pass=measureFirstRequests([event(IDs[1],IDs[0],1),event(IDs[2],IDs[0],2)],new Set(),2);
 assert.equal(pass.successfulRequests,1);
 const pending=measureFirstRequests([event(IDs[1],IDs[0],1),event(IDs[2],IDs[0],2,"pending")],new Set(),2);
 assert.equal(pending.reviewedRequests,0);assert.equal(pending.pendingRequests,1);
});
test("Delivery 8: missing or duplicate operation indices and unconfirmed dates are excluded",()=>{
 const stats=measureFirstRequests([event(IDs[1],IDs[0],1),event(IDs[2],IDs[0],1),{...event(IDs[3],IDs[3]),submitted_at:null}],new Set(),3);
 assert.equal(stats.unverifiableRequests,2);assert.equal(stats.reviewedRequests,0);
});
test("Delivery 8: only attested reused event IDs can enter assisted cohort",()=>{
 const stats=measureFirstRequests([event(IDs[1],IDs[0]),event(IDs[2],IDs[2])],new Set([IDs[1],IDs[3]]),2);
 assert.equal(stats.withVerifiedReuse.reviewed,1);assert.equal(stats.withoutVerifiedReuse.reviewed,1);
 assert.equal(stats.comparisonReady,false);
});
test("Delivery 8: rate requires 30 complete requests and a complete dataset",()=>{
 const rows=Array.from({length:30},(_,i)=>event("00000000-0000-4000-8000-"+String(i+1).padStart(12,"0"),"11111111-1111-4111-8111-"+String(i+1).padStart(12,"0")));
 const enough=measureFirstRequests(rows,new Set(),30);
 assert.equal(enough.ratePercent,100);assert.equal(enough.minimumSampleReached,true);
 assert.equal(enough.statisticallySupports98Percent,false);
 const cut=measureFirstRequests(rows,new Set(),30,false);
 assert.equal(cut.ratePercent,null);assert.equal(cut.completeDataset,false);
});
test("Delivery 8: 95% interval is conservative, cannot claim 98% from 2/2",()=>{
 const conf=wilson95(2,2);
 assert.ok(conf?.lower<0.5);assert.equal(wilson95(0,0),null);
 const large=wilson95(1000,1000);assert.ok(large?.lower>0.98);
});
test("Delivery 8: UI reads owner-scoped status only and never raw instructions or customer site data",()=>{
 const ui=readFileSync(new URL("../src/components/builder-v2-learning-metrics.tsx",import.meta.url),"utf8");
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(ui,/\.eq\("user_id",user\.id\)/);
 assert.match(ui,/\.not\("request_id","is",null\)/);
 assert.match(ui,/builder_editor_learning_reuses/);
 assert.match(ui,/Amostra insuficiente/);
 assert.doesNotMatch(ui,/select\(".*(?:instruction_redacted|requested_value|site|deltas|prompt).*"\)/);
 assert.match(page,/<BuilderV2LearningMetrics enabled=\{internalLearningAccess\}\/>/);
});
