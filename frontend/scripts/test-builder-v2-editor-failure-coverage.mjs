import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 EDITOR_FAILURE_PATHS,isEditorFailurePath,shouldCaptureEditorFailure
} from "../src/lib/builder-v2-editor-failure-coverage.ts";

const editor=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
const sql=readFileSync(new URL("../supabase/migrations/20261116_builder_editor_learning_failure_path_v1.sql",import.meta.url),"utf8");
const start=editor.indexOf("  async function send()"),end=editor.indexOf("  function newProject()",start);
const send=editor.slice(start,end);

test("15 error paths are non-sensitive literals from a bounded taxonomy",()=>{
 assert.equal(EDITOR_FAILURE_PATHS.length,15);
 assert.equal(new Set(EDITOR_FAILURE_PATHS).size,15);
 for(const path of EDITOR_FAILURE_PATHS){
  assert.equal(isEditorFailurePath(path),true);
  assert.ok(path.length<48);
  assert.ok(sql.includes("'"+path+"'"));
 }
 assert.equal(isEditorFailurePath("https://other-client.example"),false);
 assert.equal(isEditorFailurePath("stack: Error: customer's code"),false);
 assert.equal(isEditorFailurePath(null),false);
});
test("a visible error requires a real submitted command and cannot be recorded twice",()=>{
 assert.equal(shouldCaptureEditorFailure("ai-editor","Altere o fundo de Serviços",false),true);
 assert.equal(shouldCaptureEditorFailure("ai-editor","Altere o fundo de Serviços",true),false);
 assert.equal(shouldCaptureEditorFailure("ai-editor","  ",false),false);
 assert.equal(shouldCaptureEditorFailure("ai-editor",null,false),false);
 assert.equal(shouldCaptureEditorFailure("arbitrary-path","Altere o fundo",false),false);
});
test("all user-visible exception handlers in the editor are covered without disrupting an existing rejection",()=>{
 const clauses=[...send.matchAll(/\bcatch\s*(?:\([^)]*\))?\s*\{/g)].map(match=>send.slice(match.index,match.index+450));
 assert.equal(clauses.length,15,"review catch sites if new editor branches were added");
 const explicit=clauses.filter(chunk=>chunk.includes('recordEditorPathFailureOnce('));
 const legacy=clauses.filter(chunk=>chunk.includes('recordEditorLearningEvent(')&&!chunk.includes('recordEditorPathFailureOnce('));
 const reraised=clauses.filter(chunk=>/catch\s*\{\s*throw new Error\(/.test(chunk));
 assert.equal(explicit.length,13);
 assert.equal(legacy.length,1,"existing image failure stays on the old feedback path");
 assert.equal(reraised.length,1,"JSON parse failure must be rethrown to the outer catcher");
 assert.equal(explicit.length+legacy.length+reraised.length,clauses.length);
});
test("preflight blocks are captured as rejected events, not silently displayed",()=>{
 assert.match(send,/if\(!hex\)\{recordEditorPathFailureOnce\("preflight","preflight-missing-hex"\)/);
 assert.match(send,/recordEditorPathFailureOnce\("preflight"\);\s*setVoiceNotice\("Para referência visual/);
 assert.match(send,/recordEditorPathFailureOnce\("preflight"\);setGenerationError\("Você utilizou todas/);
 assert.match(send,/setGenerationError\(explanation\);\s*recordEditorPathFailureOnce\("preflight"\)/);
});
test("real estate, institutional, banner and prior photo recovery paths are captured",()=>{
 for(const path of ["real-estate-gallery","image-restore","banner-copy","institutional-image"]){
  assert.match(send,new RegExp('catch\\(error\\)\\{[\\s\\S]{0,50}recordEditorPathFailureOnce\\("'+path+'"\\)'));
 }
});
test("all 3D image, gallery and section exceptions are captured separately",()=>{
 for(const path of ["immersive-section","immersive-gallery","immersive-image"]){
  assert.match(send,new RegExp('catch\\(error\\)\\{[\\s\\S]{0,55}recordEditorPathFailureOnce\\("'+path+'"\\)'));
 }
 assert.equal((send.match(/recordEditorPathFailureOnce\("immersive-section"\)/g)||[]).length,2);
});
test("failure of a reference attachment is captured without the file contents",()=>{
 assert.match(send,/catch\(error\)\{recordEditorPathFailureOnce\("reference-image"\);setVoiceNotice/);
 assert.doesNotMatch(sql,/error_message|raw_file|attachment_bytes|private_url/);
});
test("partial generation failures are captured without marking image or storage success",()=>{
 for(const p of ["generation-images","generation-attachments","persistence"]){
  assert.match(send,new RegExp('recordEditorPathFailureOnce\\("'+p+'"\\)'));
 }
 assert.match(send,/recordEditorPathFailureOnce\("persistence"\);\s*setStorageError\(/);
 assert.match(send,/photoApplyFailed=true/);
});
test("outer AI edit/generation exception is captured, including service errors",()=>{
 assert.match(send,/recordEditorPathFailureOnce\(\(!site\.blocks\.length\|\|isFullSiteCreationBrief\(prompt\)\)\?"site-generation":"ai-editor"\)/);
 assert.match(send,/catch\s*\{\s*throw new Error\(response\.status===504/);
 assert.match(send,/recordEditorPathFailureOnce\(\(!site\.blocks\.length/);
});
test("request tracing also starts for a new site generation, without inventing correction links",()=>{
 assert.match(send,/if\(!busy\)activeSubmissionTraceRef\.current=\(!!prompt\|\|propertyFiles\.length>0\)/);
 assert.match(send,/const submittedFailureTrace=activeSubmissionTraceRef\.current/);
 assert.match(send,/const recordEditorPathFailureOnce=\(path:EditorFailurePath,evidence\?:EditorDiagnosticEvidence\)=>/);
 assert.match(send,/capturedFailureRequestIdsRef\.current\.has\(submittedFailureTrace\.requestId\)/);
 assert.match(editor,/if\(outcome==="rejected"&&submission\?\.requestId\)/);
 assert.match(send,/shouldCaptureEditorFailure\(path,prompt,alreadyRecorded\)/);
 assert.match(send,/captureReviewCandidate\(\)/);
});
test("only a bounded path crosses the Supabase boundary; raw Error never enters ML",()=>{
 assert.match(editor,/event\.outcome==="rejected"&&isEditorFailurePath\(event\.failurePath\)/);
 assert.match(editor,/failure_path:event\.failurePath/);
 assert.match(editor,/\.safeInstruction\)/);
 assert.match(editor,/recordEditorLearningEvent\(site\.niche\|\|"",prompt,"rejected","editor-error:"\+path/);
 assert.doesNotMatch(editor,/failure_path:error\.message|error_message:error|exception_message:error/);
});
test("DB schema is backward-compatible with owner RLS, no raw error strings or added permissions",()=>{
 assert.match(sql,/ALTER TABLE public\.builder_editor_learning_events/);
 assert.match(sql,/ADD COLUMN IF NOT EXISTS failure_path text/);
 assert.match(sql,/failure_path IS NULL OR/);
 assert.match(sql,/execution_status='rejected'/);
 assert.doesNotMatch(sql,/INSERT INTO|UPDATE public|CREATE TABLE|GRANT UPDATE|DISABLE ROW LEVEL SECURITY|DROP TABLE|TRUNCATE/i);
});
test("legacy approval, solution memories and new interpretation remain unaffected",()=>{
 assert.match(editor,/review_status:"pending"/);
 assert.match(editor,/isValidEditorInterpretation\(event\.interpretation\)/);
 assert.match(editor,/isSafeEditorInstruction\(event\.safeInstruction\)/);
 assert.match(editor,/recordEditorLearningEvent\(site\.niche\|\|"",prompt,"applied","image-generation"/);
 assert.match(editor,/captureVerifiedEditorSolution\(/);
 assert.match(editor,/confirmCloudEditorLearningReview\(/);
});
