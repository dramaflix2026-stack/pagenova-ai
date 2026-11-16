import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 selectPendingEditorReview,commitExactEditorReview,eligibleAsApprovedExperience
} from "../src/lib/builder-v2-universal-review.ts";

const firstId="f4e327b9-6a37-46b9-979a-fd0c4e27c620";
const nextId="4e90752f-50b6-4bfb-8d50-c5df7646d0b4";
const otherId="f678abf7-d6c1-4cb3-aa43-ea8043c24d89";

test("newer background refresh cannot silently replace the selected pending edit",()=>{
 const current={id:firstId,status:"pending"};
 const cloud=[{id:nextId,review_status:"pending"},{id:firstId,review_status:"pending"}];
 assert.deepEqual(selectPendingEditorReview(current,cloud,[]),current);
});
test("unsynced local candidate remains selected until its exact event reaches Supabase",()=>{
 const current={id:firstId,status:"pending"};
 const local=[{id:firstId,review:"pending",outcome:"applied"}];
 const cloud=[{id:nextId,review_status:"pending"}];
 assert.deepEqual(selectPendingEditorReview(current,cloud,local),current);
});
test("completed cloud reviews do not stay eligible or migrate onto another UUID",()=>{
 const cloud=[{id:firstId,review_status:"approved"},{id:nextId,review_status:"pending"}];
 const result=selectPendingEditorReview({id:firstId,status:"pending"},cloud,[]);
 assert.deepEqual(result,{id:nextId,status:"pending"});
 assert.deepEqual(selectPendingEditorReview({id:firstId,status:"approved"},cloud,[]),{id:firstId,status:"approved"});
});
test("initial recovery chooses most recent pending event only when no edit is selected",()=>{
 assert.deepEqual(selectPendingEditorReview(null,[{id:firstId,review_status:"rejected"},{id:nextId,review_status:"pending"}],[]),{id:nextId,status:"pending"});
 assert.equal(selectPendingEditorReview(null,[{id:firstId,review_status:"approved"}],[]),null);
});
test("matching id can be approved exactly once, with idempotent retry",async()=>{
 let row={id:firstId,review_status:"pending"};
 let writes=0;
 const adapter={read:async()=>row,updatePending:async()=>{writes++;row={id:firstId,review_status:"approved"};return row;}};
 assert.equal(await commitExactEditorReview(firstId,"approved",adapter),"confirmed");
 assert.equal(await commitExactEditorReview(firstId,"approved",adapter),"confirmed");
 assert.equal(writes,1);
 assert.equal(await commitExactEditorReview(firstId,"rejected",adapter),"conflict");
 assert.equal(writes,1);
});
test("unknown id, wrong returned id and racing verdicts fail closed",async()=>{
 assert.equal(await commitExactEditorReview(firstId,"approved",{read:async()=>({id:otherId,review_status:"pending"}),updatePending:async()=>({id:otherId,review_status:"approved"})}),"missing");
 let row={id:firstId,review_status:"pending"};
 assert.equal(await commitExactEditorReview(firstId,"approved",{read:async()=>row,updatePending:async()=>{row={id:firstId,review_status:"rejected"};return null;}}),"conflict");
 assert.equal(await commitExactEditorReview("wrong-id","approved",{read:async()=>row,updatePending:async()=>row}),"missing");
});
test("user approval of an automatically rejected execution is retained but not learned as success",()=>{
 assert.equal(eligibleAsApprovedExperience({review_status:"approved",execution_status:"rejected"}),false);
 assert.equal(eligibleAsApprovedExperience({review_status:"approved",execution_status:"applied"}),true);
 assert.equal(eligibleAsApprovedExperience({review_status:"pending",execution_status:"applied"}),false);
});
test("Builder implementation uses exact tenant-and-event identity for conditional updates",()=>{
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(page,/commitExactEditorReview\(eventId,status/);
 assert.match(page,/\.eq\("id",eventId\)\.eq\("user_id",userId\)\.eq\("review_status","pending"\)/);
 assert.match(page,/selectPendingEditorReview\(current,events,localEvents\)/);
 assert.match(page,/reviewSubmitInFlightRef\.current/);
 assert.match(page,/disabled=\{reviewSubmitting\}/);
 assert.doesNotMatch(page,/O identificador da edição estava desatualizado\. Recarreguei/);
 assert.match(page,/\.eq\("review_status","approved"\)\.eq\("execution_status","applied"\)/);
});
