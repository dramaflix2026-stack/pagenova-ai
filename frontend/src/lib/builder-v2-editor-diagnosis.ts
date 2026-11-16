/**
 * PageNova Universal Editor — delivery 05/15: conservative error diagnosis.
 *
 * A validator observation is NOT the root cause of a failure.
 * Strategy-derived signals are hypotheses, never facts.
 * No exception text, URLs, user instructions or personal data are stored here.
 * Only a finite, versioned vocabulary crosses the Supabase boundary.
 */
import type {UniversalFeedbackFailureCode} from "./builder-v2-universal-feedback.ts";
import type {EditorFailurePath} from "./builder-v2-editor-failure-coverage.ts";

export const EDITOR_DIAGNOSIS_EVIDENCE=[
 "state-postcondition","dom-section-absent","dom-color-mismatch",
 "dom-photo-absent","dom-layout-mismatch","no-state-delta","preflight-missing-hex"
] as const;
export type EditorDiagnosticEvidence=typeof EDITOR_DIAGNOSIS_EVIDENCE[number];
export type EditorDiagnosticStage=
 "interpretation"|"target-resolution"|"state-verification"|"visual-verification"|
 "execution"|"persistence"|"network"|"unknown";
export type EditorDiagnosticCause=
 "command-interpretation"|"target-resolution"|"mutation-no-op"|
 "unexpected-mutation"|"unverified-postcondition"|"unsupported-operation";
export type EditorFailureDiagnosis={
 source:"deterministic-v1";
 status:"observed"|"hypothesis"|"undiagnosed";
 stage:EditorDiagnosticStage;
 code:UniversalFeedbackFailureCode;
 cause:EditorDiagnosticCause|null;
 evidence:EditorDiagnosticEvidence|"strategy-label"|"none";
 confidence:number;
};
const failureCodes=new Set(["parse","missing-target","no-change","unrequested-change","postcondition","unsupported","unknown"]);
const observedEvidence=new Set<string>(EDITOR_DIAGNOSIS_EVIDENCE);
const stages=new Set(["interpretation","target-resolution","state-verification","visual-verification","execution","persistence","network","unknown"]);
const causes=new Set(["command-interpretation","target-resolution","mutation-no-op","unexpected-mutation","unverified-postcondition","unsupported-operation"]);
const observedFacts:Record<EditorDiagnosticEvidence,{stage:EditorDiagnosticStage;code:UniversalFeedbackFailureCode}>={
 "state-postcondition":{stage:"state-verification",code:"postcondition"},
 "dom-section-absent":{stage:"visual-verification",code:"missing-target"},
 "dom-color-mismatch":{stage:"visual-verification",code:"postcondition"},
 "dom-photo-absent":{stage:"visual-verification",code:"postcondition"},
 "dom-layout-mismatch":{stage:"visual-verification",code:"postcondition"},
 "no-state-delta":{stage:"state-verification",code:"no-change"},
 "preflight-missing-hex":{stage:"interpretation",code:"parse"}
};
const signalToHypothesis:Partial<Record<UniversalFeedbackFailureCode,{stage:EditorDiagnosticStage;cause:EditorDiagnosticCause}>>={
 parse:{stage:"interpretation",cause:"command-interpretation"},
 "missing-target":{stage:"target-resolution",cause:"target-resolution"},
 "no-change":{stage:"execution",cause:"mutation-no-op"},
 "unrequested-change":{stage:"state-verification",cause:"unexpected-mutation"},
 postcondition:{stage:"state-verification",cause:"unverified-postcondition"},
 unsupported:{stage:"execution",cause:"unsupported-operation"}
};
const workflowStage=(p?:EditorFailurePath):EditorDiagnosticStage=>{
 if(p==="persistence")return "persistence";
 if(p==="preflight")return "interpretation";
 if(p==="reference-image"||p==="generation-images"||p==="generation-attachments"||p==="image-generation")return "execution";
 if(p==="ai-editor"||p==="site-generation")return "network";
 return p?"execution":"unknown";
};
export function diagnoseEditorFailure(input:{
 failureCode:UniversalFeedbackFailureCode|null|undefined;
 failurePath?:EditorFailurePath;
 evidence?:EditorDiagnosticEvidence;
}):EditorFailureDiagnosis{
 if(input.evidence&&Object.prototype.hasOwnProperty.call(observedFacts,input.evidence)){
  const fact=observedFacts[input.evidence];
  return {source:"deterministic-v1",status:"observed",stage:fact.stage,code:fact.code,
   cause:null,evidence:input.evidence,confidence:90};
 }
 const signal=input.failureCode&&failureCodes.has(input.failureCode)?input.failureCode:"unknown";
 const inferred=signalToHypothesis[signal];
 if(inferred)return {source:"deterministic-v1",status:"hypothesis",stage:inferred.stage,code:signal,
  cause:inferred.cause,evidence:"strategy-label",confidence:35};
 // A caught exception identifies a workflow, not a failure's technical cause.
 return {source:"deterministic-v1",status:"undiagnosed",stage:workflowStage(input.failurePath),
  code:"unknown",cause:null,evidence:"none",confidence:0};
}
export function isValidEditorFailureDiagnosis(v:unknown):v is EditorFailureDiagnosis{
 if(!v||typeof v!=="object")return false;
 const x=v as Partial<EditorFailureDiagnosis>;
 if(x.source!=="deterministic-v1"||!["observed","hypothesis","undiagnosed"].includes(String(x.status))||
   !stages.has(String(x.stage))||!failureCodes.has(String(x.code)))return false;
 if(x.cause!==null&&(typeof x.cause!=="string"||!causes.has(x.cause)))return false;
 if(typeof x.confidence!=="number"||!Number.isInteger(x.confidence))return false;
 if(x.status==="observed")return x.confidence===90&&x.cause===null&&
   typeof x.evidence==="string"&&observedEvidence.has(x.evidence)&&
   observedFacts[x.evidence as EditorDiagnosticEvidence].code===x.code&&
   observedFacts[x.evidence as EditorDiagnosticEvidence].stage===x.stage;
 if(x.status==="hypothesis")return x.confidence===35&&x.evidence==="strategy-label"&&
   x.code!=="unknown"&&signalToHypothesis[x.code]?.cause===x.cause&&
   signalToHypothesis[x.code]?.stage===x.stage;
 return x.confidence===0&&x.cause===null&&x.code==="unknown"&&x.evidence==="none";
}
