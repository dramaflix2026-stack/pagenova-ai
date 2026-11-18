import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 beginEditorSubmissionTrace,nextEditorOperationTrace,
 isValidEditorOperationTrace,safeEditorProjectId
} from "../src/lib/builder-v2-editor-attempt-trace.ts";

const uuid1="f4e327b9-6a37-46b9-979a-fd0c4e27c620";
const uuid2="4e90752f-50b6-4bfb-8d50-c5df7646d0b4";
const now="2026-11-16T16:00:00.000Z";
test("each submitted prompt gets a distinct stable request and safe project identity",()=>{
 const first=beginEditorSubmissionTrace(uuid2,uuid1,now);
 const second=beginEditorSubmissionTrace(uuid2,uuid2,now);
 assert.equal(first.projectId,uuid2);
 assert.notEqual(first.requestId,second.requestId);
 assert.equal(first.nextOperationIndex,0);
 assert.equal(second.nextOperationIndex,0);
});
test("several execution events in one request are numbered, never considered separate prompts",()=>{
 const trace=beginEditorSubmissionTrace(uuid2,uuid1,now);
 const first=nextEditorOperationTrace(trace);
 const retry=nextEditorOperationTrace(trace);
 assert.deepEqual([first?.operationIndex,retry?.operationIndex],[1,2]);
 assert.equal(first?.requestId,uuid1);
 assert.equal(retry?.requestId,uuid1);
 assert.equal(first?.submittedAt,now);
 assert.equal(retry?.projectId,uuid2);
});
test("new prompt starts at operation 1, not a guessed correction of the preceding prompt",()=>{
 const first=beginEditorSubmissionTrace(uuid2,uuid1,now);
 nextEditorOperationTrace(first);
 const second=beginEditorSubmissionTrace(uuid2,uuid2,now);
 assert.equal(nextEditorOperationTrace(second)?.operationIndex,1);
 assert.notEqual(nextEditorOperationTrace(first)?.requestId,second.requestId);
});
test("delayed visual audit retains the original submission after another has started",()=>{
 const first=beginEditorSubmissionTrace(uuid2,uuid1,now);
 const second=beginEditorSubmissionTrace(uuid2,uuid2,now);
 const delayed=nextEditorOperationTrace(first);
 const current=nextEditorOperationTrace(second);
 assert.equal(delayed?.requestId,uuid1);
 assert.equal(current?.requestId,uuid2);
 assert.equal(delayed?.operationIndex,1);
});
test("missing, long or content-bearing project IDs are not copied into telemetry",()=>{
 assert.equal(safeEditorProjectId(null),null);
 assert.equal(safeEditorProjectId(""),null);
 assert.equal(safeEditorProjectId("project/secret?token=abc"),null);
 assert.equal(safeEditorProjectId("Project 1 - Customer Name"),null);
 assert.equal(safeEditorProjectId("x".repeat(130)),null);
 assert.equal(safeEditorProjectId("builder-v2-site:abc.123"),"builder-v2-site:abc.123");
 assert.equal(beginEditorSubmissionTrace("customer/private",uuid1,now).projectId,null);
});
test("rejects malformed request identifiers and invalid trace objects",()=>{
 assert.throws(()=>beginEditorSubmissionTrace("project","bad",now),/Invalid submission UUID/);
 assert.throws(()=>beginEditorSubmissionTrace("project",uuid1,"not-a-date"),/Invalid submission timestamp/);
 assert.equal(isValidEditorOperationTrace({requestId:"wrong",projectId:null,submittedAt:now,operationIndex:1}),false);
 assert.equal(isValidEditorOperationTrace({requestId:uuid1,projectId:null,submittedAt:now,operationIndex:0}),false);
 assert.equal(isValidEditorOperationTrace({requestId:uuid1,projectId:null,submittedAt:now,operationIndex:65}),false);
 assert.equal(isValidEditorOperationTrace(null),false);
});
test("caps operations per request and rejects fabricated synthetic history",()=>{
 const trace=beginEditorSubmissionTrace("project",uuid1,now);
 for(let i=1;i<=64;i++)assert.equal(nextEditorOperationTrace(trace)?.operationIndex,i);
 assert.equal(nextEditorOperationTrace(trace),null);
 assert.equal(trace.nextOperationIndex,64);
});
test("validated operation trace can be serialized without original prompt or site contents",()=>{
 const trace=nextEditorOperationTrace(beginEditorSubmissionTrace(uuid2,uuid1,now));
 assert.equal(isValidEditorOperationTrace(trace),true);
 const raw=JSON.stringify(trace);
 assert.ok(!raw.includes("Altere a cor"));
 assert.deepEqual(Object.keys(trace).sort(),["operationIndex","projectId","requestId","submittedAt"]);
});
test("existing learning records and review history are backward compatible",()=>{
 const sql=readFileSync(new URL("../supabase/migrations/20261116_builder_editor_learning_request_trace.sql",import.meta.url),"utf8");
 assert.match(sql,/ADD COLUMN IF NOT EXISTS request_id uuid/);
 assert.match(sql,/ADD COLUMN IF NOT EXISTS project_id text/);
 assert.match(sql,/ADD COLUMN IF NOT EXISTS operation_index integer/);
 assert.match(sql,/ADD COLUMN IF NOT EXISTS submitted_at timestamptz/);
 assert.match(sql,/request_id IS NULL AND operation_index IS NULL AND submitted_at IS NULL AND project_id IS NULL/);
 assert.doesNotMatch(sql,/UPDATE\s+public\.builder_editor_learning_events\s+SET/i);
 assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE/i);
});
test("production Builder passes the trace to existing Supabase event, retaining event ID for reviews",()=>{
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(page,/request_id:event\.trace\.requestId,project_id:event\.trace\.projectId/);
 assert.match(page,/operation_index:event\.trace\.operationIndex,submitted_at:event\.trace\.submittedAt/);
 assert.match(page,/beginEditorSubmissionTrace\(site\.id,crypto\.randomUUID\(\),new Date\(\)\.toISOString\(\)\)/);
 assert.match(page,/nextEditorOperationTrace\(submission\)/);
 assert.match(page,/persistEditorLearningEvent\(niche,instruction,outcome,strategy,model,solution,reuse,operation,failurePath,evidence\)/);
 assert.match(page,/outcome==="rejected"&&submission\?\.requestId/);
 assert.match(page,/capturedFailureRequestIdsRef\.current/);
 assert.match(page,/confirmCloudEditorLearningReview\(client,user\.id,event\.id,reviewed\)/);
 assert.match(page,/\.eq\("id",eventId\)\.eq\("user_id",userId\)\.eq\("review_status","pending"\)/);
});
test("all five asynchronous visual audit paths capture original submission, including failed audits",()=>{
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 const assignments=(page.match(/\.current=\{trace:activeSubmissionTraceRef\.current,/g)||[]).length;
 const successfulAudits=(page.match(/pending\.trace\)/g)||[]).length;
 const failedAudits=(page.match(/pending\.trace,undefined,/g)||[]).length;
 assert.equal(assignments,11,"all existing audits, the TP10 About heading route and the verified hero/AI entry points retain original request IDs");
 assert.match(page,/tp10-about-heading-proof-blocked/,"TP10 About route remains fail-closed on invalid proof");
 assert.match(page,/if\(heroChange\)\{/);
 assert.match(page,/if\(visual\?\.ok\)\{/);
 assert.equal(successfulAudits,5,"five successful visual pathways retain the original request, including the TP9 hero photograph");
 assert.equal(failedAudits,5,"five failed visual pathways retain request ID plus evidence");
 assert.match(page,/pendingHeroPhotoVisualReviewRef\.current/);
 assert.match(page,/capturedSubmission===undefined\?activeSubmissionTraceRef\.current:capturedSubmission/);
});

test("trace schema stores no client prompts or error texts and does not infer corrections",()=>{
 const sql=readFileSync(new URL("../supabase/migrations/20261116_builder_editor_learning_request_trace.sql",import.meta.url),"utf8");
 const logic=readFileSync(new URL("../src/lib/builder-v2-editor-attempt-trace.ts",import.meta.url),"utf8");
 assert.doesNotMatch(sql,/original_prompt|prompt_text|message_text|source_instruction|raw_command/);
 assert.doesNotMatch(logic,/related_request_id|correction_of|guessPreviousRequest/);
 assert.match(logic,/Related corrections are intentionally/);
});
