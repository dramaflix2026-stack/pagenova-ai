import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {captureSafeEditorInstruction} from "../src/lib/builder-v2-editor-safe-instruction.ts";
import {classifyUniversalFeedback} from "../src/lib/builder-v2-universal-feedback.ts";
import {
 interpretEditorFeedback,isValidEditorInterpretation,safeEditorInterpretationContext
} from "../src/lib/builder-v2-editor-interpretation.ts";
import {beginEditorSubmissionTrace,nextEditorOperationTrace,isValidEditorOperationTrace} from "../src/lib/builder-v2-editor-attempt-trace.ts";

const context={familyId:9,templateId:"prompt-adaptive",model:"02"};
const derive=(raw,ctx=context)=>{
 const safe=captureSafeEditorInstruction(raw);
 return {safe,result:interpretEditorFeedback(classifyUniversalFeedback(raw),safe,ctx)};
};

test("reports its real source as deterministic rules, not unverified AI understanding",()=>{
 const {result}=derive("Pinte o fundo da seção Serviços de verde.");
 assert.deepEqual(result,{
  source:"rules-v1",status:"explicit",element:"section",property:"backgroundColor",
  requestedValueKind:"named-color",requestedValue:"verde",familyId:9,templateId:"prompt-adaptive"
 });
 assert.equal(isValidEditorInterpretation(result),true);
});
test("extracts only an explicit six-digit HEX requested now",()=>{
 const {result}=derive("Altere a cor de fundo da seção Serviços para #2563EB.");
 assert.equal(result.requestedValueKind,"hex");
 assert.equal(result.requestedValue,"#2563EB");
 assert.equal(result.element,"section");
});
test("names of private customers and quoted text NEVER become requested values",()=>{
 const raw="Troque o título da seção Serviços para 'Clínica João Silva'";
 const {safe,result}=derive(raw);
 assert.equal(safe.status,"stored");
 assert.equal(result.property,"text");
 assert.equal(result.element,"heading");
 assert.equal(result.requestedValue,null);
 assert.equal(result.requestedValueKind,null);
 assert.ok(!JSON.stringify(result).includes("João"));
 assert.ok(!JSON.stringify(result).includes("Clínica"));
});
test("omitted sensitive requests yield unknown interpretation, retaining only canonical template context",()=>{
 const raw="Troque a foto da seção Serviços por https://cliente.exemplo.com/privado?token=secreto";
 const {safe,result}=derive(raw);
 assert.deepEqual(safe,{version:1,status:"omitted",text:null});
 assert.equal(result.status,"unavailable");
 assert.equal(result.element,null);
 assert.equal(result.property,null);
 assert.equal(result.requestedValue,null);
 assert.equal(result.familyId,9);
 assert.equal(result.templateId,"prompt-adaptive");
});
test("explicit alignment stores a narrow machine-readable value",()=>{
 const {result}=derive("Centralize o título da seção Serviços");
 assert.equal(result.status,"explicit");
 assert.equal(result.element,"heading");
 assert.equal(result.property,"align");
 assert.equal(result.requestedValueKind,"alignment");
 assert.equal(result.requestedValue,"center");
});
test("ordering requests do not invent a destination section or render position",()=>{
 const {result}=derive("Mova a seção Serviços depois da seção FAQ");
 assert.equal(result.property,"order");
 assert.equal(result.element,"section");
 assert.equal(result.status,"partial");
 assert.equal(result.requestedValue,null);
});
test("small explicit card counts are allowed while copy and image sources remain private",()=>{
 const {result}=derive("Adicione 6 cards na seção Serviços");
 assert.equal(result.property,"presence");
 assert.equal(result.element,"card");
 assert.equal(result.requestedValueKind,"count");
 assert.equal(result.requestedValue,"6");
});
test("ambiguous multiple colors cannot become a fabricated requested value",()=>{
 const {result}=derive("Altere a cor do título da seção Serviços para azul e verde");
 assert.equal(result.property,"color");
 assert.equal(result.requestedValue,null);
 assert.equal(result.requestedValueKind,null);
 assert.equal(result.status,"partial");
});
test("unknown target does not become a made-up section",()=>{
 const {result}=derive("Mude o fundo do site para #123456");
 assert.equal(result.status,"partial");
 assert.equal(result.element,null);
 assert.equal(result.property,"backgroundColor");
});
test("no raw site name, public media URL, customer copy or unsupported value enters the structured record",()=>{
 for(const input of [
  "Altere o telefone do site para 11987654321",
  "Mude a foto da seção Serviços para https://exemplo.test/image.png",
  "Troque o nome da empresa para 'Segredos & Cia'",
  "Altere o título para 'sb_secret_confidencial'"
 ]){
  const {result}=derive(input);
  const raw=JSON.stringify(result);
  assert.ok(!raw.includes("Segredos")&&!raw.includes("11987654321")&&!raw.includes("https://")&&!raw.includes("sb_secret"));
  assert.ok(result.requestedValue===null);
 }
});
test("canonical family IDs and 3 approved template IDs are validated",()=>{
 assert.deepEqual(safeEditorInterpretationContext(context),context);
 assert.equal(safeEditorInterpretationContext({...context,familyId:11}),null);
 assert.equal(safeEditorInterpretationContext({...context,familyId:0}),null);
 assert.equal(safeEditorInterpretationContext({...context,templateId:"some-custom-template"}),null);
 assert.equal(safeEditorInterpretationContext({...context,model:"04"}),null);
 assert.equal(safeEditorInterpretationContext({}),null);
 assert.equal(safeEditorInterpretationContext(null),null);
});
test("malicious or inconsistent persisted interpretation payloads are rejected",()=>{
 const good=derive("Pinte o fundo da seção Serviços de verde").result;
 assert.equal(isValidEditorInterpretation({...good,requestedValue:"https://private.test"}),false);
 assert.equal(isValidEditorInterpretation({...good,requestedValue:"#123456"}),false); // named vs hex
 assert.equal(isValidEditorInterpretation({...good,requestedValueKind:"hex",requestedValue:"#ABCDEF",property:"text"}),false);
 assert.equal(isValidEditorInterpretation({...good,source:"AI-verified"}),false);
 assert.equal(isValidEditorInterpretation({...good,element:"html"}),false);
 assert.equal(isValidEditorInterpretation({...good,familyId:133}),false);
});
test("request context is frozen with the original asynchronous visual verification",()=>{
 const req1=beginEditorSubmissionTrace("project-1","f4e327b9-6a37-46b9-979a-fd0c4e27c620","2026-11-16T15:00:00Z");
 req1.interpretationContext=context;
 const req2=beginEditorSubmissionTrace("project-2","4e90752f-50b6-4bfb-8d50-c5df7646d0b4","2026-11-16T15:00:01Z");
 req2.interpretationContext={familyId:4,templateId:"institutional-complete",model:"03"};
 const delayed=nextEditorOperationTrace(req1);
 const later=nextEditorOperationTrace(req2);
 assert.equal(isValidEditorOperationTrace(delayed),true);
 assert.equal(delayed?.interpretationContext?.familyId,9);
 assert.equal(later?.interpretationContext?.familyId,4);
 assert.equal(delayed?.requestId,req1.requestId);
});
test("Supabase sync uses the original feedback UUID and never stores a raw requested text value",()=>{
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(page,/interpretEditorFeedback\(\{intent,target,sectionKey\},safeInstruction/);
 assert.match(page,/safeEditorInterpretationContext\(\{[\s\S]*?familyId:resolveBriefingFamily/);
 assert.match(page,/isValidEditorInterpretation\(event\.interpretation\)/);
 assert.match(page,/interpretation_source:event\.interpretation\.source/);
 assert.match(page,/interpretation_status:event\.interpretation\.status/);
 assert.match(page,/interpreted_element:event\.interpretation\.element/);
 assert.match(page,/interpreted_property:event\.interpretation\.property/);
 assert.match(page,/requested_value_kind:event\.interpretation\.requestedValueKind/);
 assert.match(page,/requested_value:event\.interpretation\.requestedValue/);
 assert.match(page,/family_id:event\.interpretation\.familyId/);
 assert.match(page,/template_id:event\.interpretation\.templateId/);
 assert.match(page,/id:event\.id,user_id:user\.id/);
 assert.doesNotMatch(page,/requested_value:instruction|original_prompt:instruction/);
});
test("schema is bounded, RLS-compatible and keeps legacy feedback untouched",()=>{
 const sql=readFileSync(new URL("../supabase/migrations/20261116_builder_editor_learning_interpretation_v1.sql",import.meta.url),"utf8");
 assert.match(sql,/ALTER TABLE public\.builder_editor_learning_events/);
 assert.match(sql,/ADD COLUMN IF NOT EXISTS interpretation_source text/);
 assert.match(sql,/ADD COLUMN IF NOT EXISTS requested_value text/);
 assert.match(sql,/interpretation_source='rules-v1'/);
 assert.match(sql,/interpretation_status IN \('explicit','partial','unavailable'\)/);
 assert.match(sql,/requested_value_kind='hex'/);
 assert.match(sql,/requested_value_kind='count'/);
 assert.doesNotMatch(sql,/UPDATE\s+public\.builder_editor_learning_events\s+SET|CREATE TABLE|DROP TABLE|TRUNCATE|GRANT UPDATE|DISABLE ROW LEVEL SECURITY/i);
});
