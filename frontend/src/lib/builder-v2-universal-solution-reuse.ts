/**
 * Universal Editor step 3: learned case-based execution routing.
 * Trusted evidence: owner-scoped, approved AND applied feedback with a real
 * verified solution snapshot. A memory is a technique hint, NEVER a patch.
 */
import type {EditorSolutionMemory,SolutionDelta} from "./builder-v2-universal-solution-memory.ts";
export type ReviewedSolutionCase={
 event_id:string;intent:string;target:string;section_key?:string|null;strategy:string;
 review_status:string;execution_status:string;
 verification:"model"|"visual";context:EditorSolutionMemory["context"];deltas:SolutionDelta[];
};
export type SolutionRoutingContext={
 intent:string;target:string;sectionKey?:string;niche:string;model:string;family:string;
 instruction:string;
};
export type ApprovedTechnique={sourceEventId:string;technique:"section-background"|"section-heading-color"|"block-color"|"block-copy"|"block-alignment"|"section-reorder"|"section-remove"|"section-add";score:number;verification:"model"|"visual"};
const norm=(s?:string|null)=>(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const actionRelevant=(d:SolutionDelta,context:SolutionRoutingContext):ApprovedTechnique["technique"]|null=>{
 const q=norm(context.instruction);
 const style=context.intent==="style",copy=context.intent==="copy",layout=context.intent==="layout";
 if(style){
  if(/\bfundo\b|\bbackground\b/.test(q)&&d.kind==="section-style"&&d.field==="backgroundColor")return "section-background";
  if(/\bcor\b/.test(q)&&/\btitulo\b|\bcabecalho\b/.test(q)&&d.kind==="section-style"&&d.field==="headingColor")return "section-heading-color";
  if(/\bcor\b/.test(q)&&d.kind==="block-field"&&["color","textColor","background"].includes(d.field||""))return "block-color";
  return null;
 }
 if(copy&&d.kind==="block-field"&&d.field==="text"&&["heading","paragraph","button"].includes(d.blockType||""))return "block-copy";
 if(layout&&/\b(?:alinh|centraliz)/.test(q)&&d.kind==="block-field"&&d.field==="align")return "block-alignment";
 if(layout&&/\b(?:mova|mover|reposicion|ordem)/.test(q)&&
    (d.kind==="block-moved"||d.kind==="section-event"&&d.field==="move"))return "section-reorder";
 if(context.intent==="remove-section"&&(d.kind==="block-removed"||d.kind==="section-event"&&d.field==="remove"))return "section-remove";
 if(context.intent==="add-section"&&(d.kind==="block-added"||d.kind==="section-event"&&d.field==="restore"))return "section-add";
 return null;
};
const compatibleSection=(d:SolutionDelta,context:SolutionRoutingContext)=>{
 if(!context.sectionKey)return true;
 if(!d.section)return false;
 const canon=(s:string)=>({servicos:"services",depoimentos:"testimonials",galeria:"gallery",rodape:"footer",contato:"contact"} as Record<string,string>)[norm(s)]||norm(s);
 return canon(d.section)===canon(context.sectionKey);
};
/**
 * Prefer same niche+model; narrowly permit same-family+model only when
 * operation/section match. Cross-user cases are filtered BEFORE this function.
 * No learning from unreviewed, rejected or unsupported metadata.
 */
export function selectApprovedExecutionTechnique(records:readonly ReviewedSolutionCase[],context:SolutionRoutingContext):ApprovedTechnique|null{
 if(context.intent==="other"||context.target==="unspecified"||records.length===0)return null;
 const matches:ApprovedTechnique[]=[];
 for(const item of records.slice(0,150)){
  if(!uuid.test(item.event_id)||item.review_status!=="approved"||item.execution_status!=="applied")continue;
  if(item.intent!==context.intent||item.target!==context.target)continue;
  // Universal technique hints must come from a previously verified universal execution.
  // An AI-generated or niche-specific override is NOT a reusable universal adapter.
  if(!/^(?:universal(?:$|[-:]))/.test(item.strategy))continue;
  if(item.section_key&&context.sectionKey&&item.section_key!==context.sectionKey)continue;
  if(item.verification!=="visual"&&item.verification!=="model")continue;
  if(!item.context||!Array.isArray(item.deltas)||!item.deltas.length||item.deltas.length>50)continue;
  if(norm(item.context.model)!==norm(context.model)||!context.model)continue;
  const sameNiche=!!context.niche&&norm(item.context.niche)===norm(context.niche);
  const sameFamily=!!context.family&&norm(item.context.family)===norm(context.family);
  if(!sameNiche&&!sameFamily)continue;
  for(const d of item.deltas){
   if(!d||typeof d!=="object"||!compatibleSection(d,context))continue;
   const technique=actionRelevant(d,context);
   if(!technique)continue;
   const score=(sameNiche?10:4)+(sameFamily?2:0)+(item.verification==="visual"?3:0)+(!!item.section_key?1:0);
   matches.push({sourceEventId:item.event_id,technique,score,verification:item.verification});
   break;
  }
 }
 matches.sort((a,b)=>b.score-a.score);
 return matches[0]||null;
}
/** A memory only changes a route where the built-in handler would not
 * have attempted the deterministic universal engine first. */
export function shouldRerouteUsingApprovedTechnique(
 technique:ApprovedTechnique|null,
 options:{compound:boolean;hasAttachments:boolean;imageChange:boolean;preferScopedCopy:boolean;learnedAiEligible:boolean;strongAiEvidence:boolean}
):boolean{
 return !!technique&&!options.compound&&!options.hasAttachments&&!options.imageChange&&
  (options.preferScopedCopy||(options.learnedAiEligible&&!options.strongAiEvidence));
}
/** Only trusted confirmation can be attributed to a specific memory. */
export function confirmedReuseSource(technique:ApprovedTechnique|null,usedForRoute:boolean,verified:boolean):string|null{
 return technique&&usedForRoute&&verified?technique.sourceEventId:null;
}
