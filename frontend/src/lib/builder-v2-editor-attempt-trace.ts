/**
 * PageNova Universal Editor — delivery 1/15: submission and operation tracing.
 * A submitted prompt is a distinct request. Related corrections are intentionally
 * NOT guessed from timestamps or similar text; that correlation is implemented
 * only when evidence is available in a later delivery.
 *
 * Does not store instructions, addresses, contact details or customer content.
 */
export type EditorSubmissionTrace={
  requestId:string;
  projectId:string|null;
  submittedAt:string;
  nextOperationIndex:number;
};
export type EditorOperationTrace={
  requestId:string;
  projectId:string|null;
  submittedAt:string;
  operationIndex:number;
};
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROJECT_RE=/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/;
/** No project name, arbitrary URL, or prompt text can enter the project identifier. */
export function safeEditorProjectId(projectId:unknown):string|null{
 return typeof projectId==="string"&&PROJECT_RE.test(projectId)?projectId:null;
}
export function beginEditorSubmissionTrace(projectId:unknown,uuid:string,submittedAt:string):EditorSubmissionTrace{
 if(!UUID_RE.test(uuid))throw new Error("Invalid submission UUID");
 if(!Number.isFinite(Date.parse(submittedAt))||submittedAt.length>36)throw new Error("Invalid submission timestamp");
 return {requestId:uuid,projectId:safeEditorProjectId(projectId),submittedAt,nextOperationIndex:0};
}
/** Increment only after the attempt is actually captured; no fabricated history. */
export function nextEditorOperationTrace(trace:EditorSubmissionTrace|null):EditorOperationTrace|null{
 if(!trace||!UUID_RE.test(trace.requestId)||trace.nextOperationIndex>=64)return null;
 trace.nextOperationIndex+=1;
 return {requestId:trace.requestId,projectId:trace.projectId,submittedAt:trace.submittedAt,
  operationIndex:trace.nextOperationIndex};
}
/** Historical events have no trace; keep them readable without inventing IDs. */
export function isValidEditorOperationTrace(value:unknown):value is EditorOperationTrace{
 if(!value||typeof value!=="object")return false;
 const t=value as Partial<EditorOperationTrace>;
 return typeof t.requestId==="string"&&UUID_RE.test(t.requestId)&&
  (t.projectId===null||safeEditorProjectId(t.projectId)===t.projectId)&&
  typeof t.submittedAt==="string"&&Number.isFinite(Date.parse(t.submittedAt))&&
  Number.isInteger(t.operationIndex)&&Number(t.operationIndex)>=1&&Number(t.operationIndex)<=64;
}
