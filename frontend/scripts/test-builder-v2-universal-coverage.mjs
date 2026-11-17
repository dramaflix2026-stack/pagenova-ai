import test from "node:test";
import assert from "node:assert/strict";
import {auditUniversalCoverage,UNIVERSAL_TASKS} from "../src/lib/builder-v2-universal-coverage.ts";
const id=n=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const row=(n,intent="copy",niche="Auto Centers",model="02",review="approved",execution="applied")=>({
 id:id(n+10000),request_id:id(n),operation_index:1,
 submitted_at:"2026-11-17T09:10:00Z",created_at:"2026-11-17T09:10:01Z",
 review_status:review,execution_status:execution,intent,niche,model
});
test("Delivery 14: five editor operations map to exactly five separate metrics",()=>{
 const intents=["copy","style","image","add-section","layout"];
 const rows=intents.map((x,i)=>row(i+1,x,"Auto Centers",String(i%3+1)));
 const result=auditUniversalCoverage(rows,true);
 assert.deepEqual(result.tasks.map(x=>x.task),UNIVERSAL_TASKS);
 assert.deepEqual(result.tasks.map(x=>x.reviewed),[1,1,1,1,1]);
 assert.equal(result.reviewedRequests,5);
 assert.equal(result.coveredNicheModelPairs,3);
 assert.equal(result.hasFull399PairCoverage,false);
});
test("Delivery 14: removal and addition share the section cohort without double counting",()=>{
 const result=auditUniversalCoverage([row(1,"add-section"),row(2,"remove-section")],true);
 assert.equal(result.tasks.find(x=>x.task==="section").reviewed,2);
});
test("Delivery 14: one multi-operation request with mixed intents stays outside task cohorts",()=>{
 const rows=[{...row(1,"copy"),operation_index:1},{...row(2,"style"),request_id:id(1),operation_index:2}];
 const result=auditUniversalCoverage(rows,true);
 assert.equal(result.reviewedRequests,1);
 assert.equal(result.unknownOrMixedRequests,1);
 assert.equal(result.tasks.reduce((sum,x)=>sum+x.reviewed,0),0);
});
test("Delivery 14: incomplete, missing or duplicated operations do not become approvals",()=>{
 const first={...row(1),operation_index:2};
 const second={...row(2),request_id:id(1),operation_index:2};
 const third=row(3,"copy","Pet","03","pending");
 const result=auditUniversalCoverage([first,second,third],true);
 assert.equal(result.reviewedRequests,0);
 assert.equal(result.pendingOrUnverifiableRequests,2);
 assert.equal(result.coveredNicheModelPairs,0);
});
test("Delivery 14: unverified model or niche cannot contribute to 399-pair coverage",()=>{
 const result=auditUniversalCoverage([row(1,"copy","","02"),row(2,"style","Pet","invalid")],true);
 assert.equal(result.reviewedRequests,2);
 assert.equal(result.coveredNiches,0);
 assert.equal(result.coveredNicheModelPairs,0);
});
test("Delivery 14: incomplete pagination suppresses displayed performance percentages",()=>{
 const rows=Array.from({length:40},(_,i)=>row(i+1));
 const complete=auditUniversalCoverage(rows,true);
 assert.equal(complete.tasks[0].ratePercent,100);
 assert.ok(complete.tasks[0].lower95Percent>90);
 assert.equal(complete.hasEvidenceFor98Percent,false);
 const truncated=auditUniversalCoverage(rows,false);
 assert.equal(truncated.tasks[0].ratePercent,null);
 assert.equal(truncated.tasks[0].lower95Percent,null);
 assert.equal(truncated.hasFull399PairCoverage,false);
});
test("Delivery 14: few perfect samples never prove 98%; failed edits count as failures",()=>{
 const result=auditUniversalCoverage([row(1),row(2,"copy","Pet","01","rejected","applied")],true);
 assert.equal(result.tasks[0].successful,1);
 assert.equal(result.tasks[0].failed,1);
 assert.equal(result.tasks[0].ratePercent,null);
 assert.equal(result.hasEvidenceFor98Percent,false);
});

test("Delivery 15: 399 audited pairs on text alone do NOT prove universal success",()=>{
 const rows=Array.from({length:399},(_,i)=>row(i+1,"copy","Nicho "+(Math.floor(i/3)+1),"0"+(i%3+1)));
 const result=auditUniversalCoverage(rows,true);
 assert.equal(result.coveredNiches,133);
 assert.equal(result.nichesWithThreeModels,133);
 assert.equal(result.coveredNicheModelPairs,399);
 assert.equal(result.hasFull399PairCoverage,true);
 assert.equal(result.tasks[0].coveredPairs,399);
 assert.equal(result.tasks.find(x=>x.task==="image").coveredPairs,0);
 assert.equal(result.hasEvidenceFor98Percent,false);
});
