/** Exact, idempotent review contract for the Universal Editor.
 * A verdict must never migrate from one edit UUID to another.
 * This is review bookkeeping, not proof that an edit is visually correct.
 */
export type LearningVerdict="pending"|"approved"|"rejected";
export type ReviewCandidate={id:string;status:LearningVerdict};
export type ReviewRow={id:string;review_status:string};
export type LocalReviewRow={id:string;review?:string;outcome?:string};
export type ReviewCommitResult="confirmed"|"missing"|"conflict";

/** Prefer the exact selected pending edit, even if another pending cloud edit exists. */
export function selectPendingEditorReview(
 current:ReviewCandidate|null,
 cloud:readonly ReviewRow[],
 local:readonly LocalReviewRow[]
):ReviewCandidate|null{
 if(current?.status==="approved"||current?.status==="rejected")return current;
 if(current?.status==="pending"){
  const sameCloud=cloud.find(e=>e.id===current.id);
  if(sameCloud?.review_status==="pending")return current;
  if(!sameCloud&&local.some(e=>e.id===current.id&&e.review==="pending"&&["applied","rejected"].includes(e.outcome||"")))return current;
 }
 const remote=cloud.find(e=>e.review_status==="pending");
 if(remote)return {id:remote.id,status:"pending"};
 const waiting=[...local].reverse().find(e=>e.review==="pending"&&["applied","rejected"].includes(e.outcome||"")&&!cloud.some(c=>c.id===e.id));
 return waiting?{id:waiting.id,status:"pending"}:null;
}

/** A user approval of a failed automatic execution is retained as feedback but
 * must not become a positive training example until the execution is verified. */
export function eligibleAsApprovedExperience(row:{review_status:string;execution_status:string}):boolean{
 return row.review_status==="approved"&&row.execution_status==="applied";
}

/** The adapter MUST read and conditionally update the same authenticated user's UUID.
 * A review already set to the same verdict is idempotent; conflicting verdicts fail closed.
 */
export async function commitExactEditorReview(
 id:string,
 verdict:Exclude<LearningVerdict,"pending">,
 adapter:{read:()=>Promise<ReviewRow|null>;updatePending:()=>Promise<ReviewRow|null>}
):Promise<ReviewCommitResult>{
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return "missing";
 const prior=await adapter.read();
 if(!prior||prior.id!==id)return "missing";
 if(prior.review_status===verdict)return "confirmed";
 if(prior.review_status!=="pending")return "conflict";
 const updated=await adapter.updatePending();
 if(updated?.id===id&&updated.review_status===verdict)return "confirmed";
 // Another tab or request may have raced this one: reread only this ID.
 const final=await adapter.read();
 if(!final||final.id!==id)return "missing";
 return final.review_status===verdict?"confirmed":"conflict";
}
