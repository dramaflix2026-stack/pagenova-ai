import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 diagnoseEditorFailure,isValidEditorFailureDiagnosis,EDITOR_DIAGNOSIS_EVIDENCE
} from "../src/lib/builder-v2-editor-diagnosis.ts";
import {inferUniversalFeedbackFailureCode} from "../src/lib/builder-v2-universal-feedback.ts";
const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
const sql=readFileSync(new URL("../supabase/migrations/20261116_builder_editor_learning_diagnosis_v1.sql",import.meta.url),"utf8");
const diagnose=(strategy,options={})=>diagnoseEditorFailure({
 failureCode:inferUniversalFeedbackFailureCode(strategy,"rejected"),...options
});
test("observed state validator failure records a verified SYMPTOM, not invented cause",()=>{
 const r=diagnose("universal-verification:postcondition",{evidence:"state-postcondition"});
 assert.deepEqual(r,{source:"deterministic-v1",status:"observed",stage:"state-verification",
  code:"postcondition",cause:null,evidence:"state-postcondition",confidence:90});
 assert.equal(isValidEditorFailureDiagnosis(r),true);
});
test("observed DOM target absence is not mistaken for a CSS issue",()=>{
 const r=diagnose("universal-visual-missing-target",{evidence:"dom-section-absent"});
 assert.equal(r.status,"observed");
 assert.equal(r.code,"missing-target");
 assert.equal(r.stage,"visual-verification");
 assert.equal(r.cause,null);
});
test("DOM color mismatch is observed but cannot prove which layer caused it",()=>{
 const r=diagnose("universal-visual-verification",{evidence:"dom-color-mismatch"});
 assert.equal(r.status,"observed");
 assert.equal(r.code,"postcondition");
 assert.equal(r.evidence,"dom-color-mismatch");
 assert.equal(r.cause,null);
});
test("photo and layout observations are typed without URLs or rendered content",()=>{
 for(const evidence of ["dom-photo-absent","dom-layout-mismatch"]){
  const r=diagnose("universal-visual-verification",{evidence});
  assert.equal(r.status,"observed");
  assert.equal(r.confidence,90);
  assert.equal(r.cause,null);
  assert.equal(isValidEditorFailureDiagnosis(r),true);
 }
});
test("explicit no-change and missing-HEX preflight have direct evidence",()=>{
 let a=diagnose("universal-no-change",{evidence:"no-state-delta"});
 assert.equal(a.code,"no-change");assert.equal(a.confidence,90);
 a=diagnose("editor-error:preflight",{failurePath:"preflight",evidence:"preflight-missing-hex"});
 assert.equal(a.code,"parse");assert.equal(a.stage,"interpretation");
 assert.equal(a.cause,null);
});
test("strategy-only missing target remains a LOW CONFIDENCE hypothesis",()=>{
 const r=diagnose("universal-section-background-unresolved");
 assert.deepEqual(r,{source:"deterministic-v1",status:"hypothesis",
  stage:"target-resolution",code:"missing-target",cause:"target-resolution",
  evidence:"strategy-label",confidence:35});
 assert.equal(isValidEditorFailureDiagnosis(r),true);
});
test("strategy-only parse, unsupported, no-change and mismatch remain hypotheses",()=>{
 for(const [strategy,cause] of [
  ["universal-parse:parse","command-interpretation"],
  ["universal-unsupported","unsupported-operation"],
  ["universal-no-change","mutation-no-op"],
  ["universal-verification:postcondition","unverified-postcondition"],
  ["universal-unrequested-change","unexpected-mutation"]
 ]){
  const r=diagnose(strategy);
  assert.equal(r.status,"hypothesis");
  assert.equal(r.cause,cause);
  assert.equal(r.evidence,"strategy-label");
  assert.equal(r.confidence,35);
  assert.equal(isValidEditorFailureDiagnosis(r),true);
 }
});
test("caught errors without evidence NEVER receive a guessed technical root cause",()=>{
 for(const path of ["reference-image","real-estate-gallery","immersive-gallery","institutional-image","ai-editor","site-generation"]){
  const r=diagnose("editor-error:"+path,{failurePath:path});
  assert.equal(r.status,"undiagnosed");
  assert.equal(r.code,"unknown");
  assert.equal(r.cause,null);
  assert.equal(r.evidence,"none");
  assert.equal(r.confidence,0);
  assert.equal(isValidEditorFailureDiagnosis(r),true);
 }
});
test("persistence failures identify affected STAGE but are not automatically diagnosed",()=>{
 const r=diagnose("editor-error:persistence",{failurePath:"persistence"});
 assert.equal(r.stage,"persistence");
 assert.equal(r.status,"undiagnosed");
 assert.equal(r.cause,null);
});
test("HTTP/network, parser and rendering cannot be confidently distinguished from exception alone",()=>{
 const r=diagnose("editor-error:ai-editor",{failurePath:"ai-editor"});
 assert.equal(r.stage,"network");
 assert.equal(r.status,"undiagnosed");
 assert.equal(r.confidence,0);
 assert.equal(r.cause,null);
});
test("rejects fabricated evidence and arbitrary client/private error messages",()=>{
 const base=diagnose("universal-visual-verification",{evidence:"dom-color-mismatch"});
 for(const x of [
  {...base,status:"observed",cause:"unverified-postcondition"},
  {...base,status:"observed",confidence:100},
  {...base,evidence:"https://private.client.test/file.png"},
  {...base,evidence:"stack: SecretError"},
  {...base,status:"hypothesis",confidence:90},
  {...base,status:"undiagnosed",code:"missing-target"},
  {...base,stage:"private-client-home"},
  {...base,source:"AI-verified"}
 ])assert.equal(isValidEditorFailureDiagnosis(x),false);
});
test("there is a finite evidence vocabulary, no generic freeform error payload",()=>{
 assert.equal(new Set(EDITOR_DIAGNOSIS_EVIDENCE).size,7);
 for(const v of EDITOR_DIAGNOSIS_EVIDENCE)assert.ok(sql.includes("'"+v+"'"));
 assert.doesNotMatch(sql,/raw_error|error_message|stacktrace|exception_text|original_prompt/);
});
test("all diagnostic columns go through the existing RLS owner feedback row",()=>{
 for(const field of ["source","status","stage","code","cause","evidence","confidence"]){
  assert.match(page,new RegExp("diagnosis_"+field+":event\\.diagnosis\\."+field));
  assert.match(sql,new RegExp("ADD COLUMN IF NOT EXISTS diagnosis_"+field));
 }
 assert.match(page,/event\.outcome==="rejected"&&isValidEditorFailureDiagnosis\(event\.diagnosis\)/);
 assert.match(page,/const diagnosis=outcome==="rejected"/);
 assert.match(page,/diagnoseEditorFailure\(\{failureCode,failurePath,evidence\}\)/);
 assert.match(page,/diagnosis\?\{diagnosis\}:\{\}/);
 assert.match(page,/id:event\.id,user_id:user\.id/);
});
test("feedback and solution learning remain independent of diagnostic confidence",()=>{
 assert.match(page,/review_status:"pending"/);
 assert.match(page,/recordEditorLearningEvent\(pending\.niche,pending\.prompt,"applied","universal-visual-verified"/);
 assert.match(page,/review_status","pending"/);
 assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE|GRANT UPDATE|CREATE TABLE|DISABLE ROW LEVEL SECURITY/i);
});
test("existing DOM/state validators supply observed evidence, not copied error text",()=>{
 for(const token of ["dom-section-absent","dom-color-mismatch","dom-photo-absent","dom-layout-mismatch","no-state-delta","state-postcondition","preflight-missing-hex"]){
  assert.ok(page.includes('"'+token+'"'),"missing evidence capture "+token);
 }
 assert.match(page,/root&&win\?"dom-layout-mismatch":undefined/);
 assert.match(page,/root\?undefined:targets\.length===0\?"dom-section-absent":"dom-photo-absent"/);
 assert.doesNotMatch(page,/diagnosis_evidence:error\.message|diagnosis_evidence:failureReason|diagnosis_evidence:verification\.reason/);
});
test("SQL enforces status, confidence, cause and stage consistency, preserving history",()=>{
 assert.match(sql,/ALTER TABLE public\.builder_editor_learning_events/);
 assert.match(sql,/diagnosis_source IS NULL AND diagnosis_status IS NULL/);
 assert.match(sql,/diagnosis_status='observed'/);
 assert.match(sql,/diagnosis_confidence=90/);
 assert.match(sql,/diagnosis_status='hypothesis'/);
 assert.match(sql,/diagnosis_confidence=35/);
 assert.match(sql,/diagnosis_status='undiagnosed'/);
 assert.match(sql,/diagnosis_confidence=0/);
 assert.match(sql,/execution_status='rejected'/);
 assert.doesNotMatch(sql,/UPDATE\s+public\.builder_editor_learning_events\s+SET|DROP TABLE|TRUNCATE|CREATE TABLE|GRANT UPDATE/i);
});
