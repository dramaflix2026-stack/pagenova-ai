/** Motor Universal 1 — versioned, privacy-aware learning contract.
 * Recording and retrieval are intentionally opt-in until a tenant-isolated
 * Supabase persistence adapter and RLS policies are verified.
 */
import type {UniversalBlock,UniversalSite} from "./builder-v2-universal-operations.ts";

export type UniversalLearningVerdict="approved"|"rejected"|"pending";
export type UniversalLearningOutcome="applied"|"already-correct"|"failed"|"unverified";
export type UniversalLearningContext={niche?:string;family?:string;model?:string;templateId?:string};
export type UniversalLearningRecord={
 schemaVersion:1;instruction:string;context:UniversalLearningContext;
 outcome:UniversalLearningOutcome;verdict:UniversalLearningVerdict;
 requestedChanges:number;verifiedChanges:number;
 changes:ReadonlyArray<{blockId:string;field:string;before?:string|number|boolean|null;after?:string|number|boolean|null}>;
};

/** Stable failure taxonomy shared across niches. Never infer a successful edit from a diagnostic. */
export type UniversalFailureCode="parse"|"missing-target"|"no-change"|"unrequested-change"|"postcondition"|"unsupported"|"unknown";
export function diagnoseUniversalEditFailure(reason:string):UniversalFailureCode{
 const message=reason.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 if(/nao foi possivel interpretar|interpreta|parte do pedido|comando nao reconhecido/.test(message))return "parse";
 if(/nao encontr|inexistente|missing block|sem bloco|nao possui|nao existe/.test(message))return "missing-target";
 if(/inalterado|nenhuma alteracao|nao produziu alteracao|nao foi modificado|no expected changes/.test(message))return "no-change";
 if(/nao solicitad|outras secoes|dados gerais|ordem relativa|duplicados/.test(message))return "unrequested-change";
 if(/postcondition|nao foi modificad|nao foi confirmad|nao confirmad|nao foi atualizad/.test(message))return "postcondition";
 if(/nao suportad|unsupported|divida o pedido|ate 20/.test(message))return "unsupported";
 return "unknown";
}

const comparable=(v:unknown):v is string|number|boolean|null=>v===null||typeof v==="string"||typeof v==="number"||typeof v==="boolean";
/** Only explicit scalar block mutations are eligible for deterministic verification. */
export function verifyUniversalBlockChanges<T extends UniversalSite>(before:T,after:T,expected:ReadonlyArray<{blockId:string;field:string;value:unknown}>):{
 ok:boolean;checked:number;failures:string[]
}{
 const oldBlocks=new Map<string,UniversalBlock>(before.blocks.map(b=>[b.id,b]));
 const newBlocks=new Map<string,UniversalBlock>(after.blocks.map(b=>[b.id,b]));
 const failures:string[]=[];
 if(expected.length===0)return {ok:false,checked:0,failures:["no expected changes to verify"]};
 for(const item of expected){
  const old=oldBlocks.get(item.blockId),next=newBlocks.get(item.blockId);
  if(!old||!next){failures.push(item.blockId+": missing block");continue;}
  if(!comparable(item.value)||!comparable(next[item.field])){
   failures.push(item.blockId+"."+item.field+": unsupported verification type");continue;
  }
  if(next[item.field]!==item.value)failures.push(item.blockId+"."+item.field+": postcondition not met");
 }
 return {ok:failures.length===0,checked:expected.length,failures};
}

/** No automatic promotion: only explicit approvals can seed future retrieval. */
export function eligibleUniversalLearningExample(record:UniversalLearningRecord):boolean{
 return record.schemaVersion===1&&record.verdict==="approved"&&
  (record.outcome==="applied"||record.outcome==="already-correct")&&
  record.requestedChanges>0&&record.verifiedChanges===record.requestedChanges;
}

/** Conservative case-based retrieval: examples are suggestions, never mutations.
 * Approved examples from the same niche and model rank above cross-niche ones.
 * Rejected or unverified events are never eligible to guide execution.
 */
export function rankApprovedUniversalExperiences(records:readonly UniversalLearningRecord[],context:UniversalLearningContext,limit=5):UniversalLearningRecord[]{
 const normalized=(v?:string)=>(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
 const score=(r:UniversalLearningRecord)=>
  (normalized(r.context.niche)&&normalized(r.context.niche)===normalized(context.niche)?8:0)+
  (normalized(r.context.family)&&normalized(r.context.family)===normalized(context.family)?4:0)+
  (normalized(r.context.model)&&normalized(r.context.model)===normalized(context.model)?2:0);
 return records.filter(eligibleUniversalLearningExample)
  .map((record,index)=>({record,index,score:score(record)}))
  .sort((a,b)=>b.score-a.score||a.index-b.index)
  .slice(0,Math.max(0,Math.min(20,Math.trunc(limit)||0)))
  .map(item=>item.record);
}

/** Validate that a successful universal operation changed only its declared blocks.
 * Section-level structural edits may reorder blocks; changed IDs must still be real.
 */
/** Verify block changes, additions, removals and order changes without mutating unrelated content. */
export function verifyUniversalEditResult<T extends UniversalSite>(before:T,after:T,changedIds:readonly string[]):{ok:boolean;reason:string}{
 const reject=(reason:string)=>({ok:false,reason});
 if(!changedIds.length)return reject("Nenhuma alteração identificada.");
 const oldBlocks=new Map(before.blocks.map(b=>[b.id,b]));
 const nextBlocks=new Map(after.blocks.map(b=>[b.id,b]));
 const ids=new Set(changedIds);
 if(ids.size!==changedIds.length)return reject("IDs de alteração duplicados.");
 if(JSON.stringify(before)===JSON.stringify(after))return reject("O site permaneceu inalterado.");
 const oldOrder=before.blocks.map(b=>b.id),newOrder=after.blocks.map(b=>b.id);
 for(const id of ids){
  if(id==="primary-cta-theme"){
   const previous=(before as Record<string,unknown>).universalPrimaryCtaColor;
   const updated=(after as Record<string,unknown>).universalPrimaryCtaColor;
   if(typeof updated!=="string"||!/^#[0-9a-fA-F]{6}$/.test(updated)||previous===updated)return reject("A cor dos CTAs não foi modificada.");
   continue;
  }
  if(id.startsWith("section-heading-color:")){
   const section=id.slice("section-heading-color:".length);
   const oldStyles=(before as Record<string,unknown>).universalSectionStyles as Record<string,Record<string,unknown>>|undefined;
   const nextStyles=(after as Record<string,unknown>).universalSectionStyles as Record<string,Record<string,unknown>>|undefined;
   const previous=oldStyles?.[section]?.headingColor;
   const updated=nextStyles?.[section]?.headingColor;
   if(typeof updated!=="string"||!/^#[0-9a-fA-F]{6}$/.test(updated)||previous===updated)return reject("Cor do título da seção não foi modificada: "+section);
   continue;
  }
  if(id.startsWith("section-style:")){
   const section=id.slice("section-style:".length);
   const oldStyles=(before as Record<string,unknown>).universalSectionStyles as Record<string,unknown>|undefined;
   const nextStyles=(after as Record<string,unknown>).universalSectionStyles as Record<string,unknown>|undefined;
   const previous=oldStyles?.[section];
   const updated=nextStyles?.[section];
   if(!updated||typeof updated!=="object"||JSON.stringify(previous)===JSON.stringify(updated))return reject("Estilo da seção não foi modificado: "+section);
   const beforeOther={...(oldStyles||{})};const afterOther={...(nextStyles||{})};delete beforeOther[section];delete afterOther[section];
   if(JSON.stringify(beforeOther)!==JSON.stringify(afterOther))return reject("Estilos de outras seções foram alterados.");
   continue;
  }
  const old=oldBlocks.get(id),next=nextBlocks.get(id);
  if(!old&&!next)return reject("Bloco alterado inexistente: "+id);
  if(old&&next&&JSON.stringify(old)===JSON.stringify(next)&&oldOrder.indexOf(id)===newOrder.indexOf(id))return reject("Bloco indicado não foi modificado nem movido: "+id);
 }
 for(const [id,old] of oldBlocks){
  if(ids.has(id))continue;
  const next=nextBlocks.get(id);
  if(!next)return reject("Bloco não solicitado removido: "+id);
  if(JSON.stringify(old)!==JSON.stringify(next))return reject("Bloco não solicitado alterado: "+id);
 }
 for(const id of nextBlocks.keys())if(!oldBlocks.has(id)&&!ids.has(id))return reject("Bloco não solicitado adicionado: "+id);
 // A move may shift other blocks' indices but must preserve their relative order.
 const oldMetadata={...(before as Record<string,unknown>)};
 const nextMetadata={...(after as Record<string,unknown>)};
 delete oldMetadata.blocks;delete nextMetadata.blocks;
 const declaredStyleSections=changedIds.filter(id=>id.startsWith("section-style:")||id.startsWith("section-heading-color:")).map(id=>id.slice(id.indexOf(":")+1));
 if(declaredStyleSections.length){
  const oldStyles=(oldMetadata.universalSectionStyles||{}) as Record<string,unknown>;
  const nextStyles=(nextMetadata.universalSectionStyles||{}) as Record<string,unknown>;
  const remainingOld={...oldStyles},remainingNext={...nextStyles};
  for(const section of declaredStyleSections){delete remainingOld[section];delete remainingNext[section];}
  if(JSON.stringify(remainingOld)!==JSON.stringify(remainingNext))return reject("Estilos de seções não solicitadas foram alterados.");
  delete oldMetadata.universalSectionStyles;delete nextMetadata.universalSectionStyles;
 }
 if(ids.has("primary-cta-theme")){
  delete oldMetadata.universalPrimaryCtaColor;
  delete nextMetadata.universalPrimaryCtaColor;
 }
 const oldEvents=oldMetadata.universalSectionEvents;
 const nextEvents=nextMetadata.universalSectionEvents;
 if(JSON.stringify(oldEvents)!==JSON.stringify(nextEvents)){
  const previous=Array.isArray(oldEvents)?oldEvents:[];
  const updated=Array.isArray(nextEvents)?nextEvents:[];
  const newEvents=updated.slice(previous.length);
  const allowedSections=new Set(changedIds.filter(id=>!id.startsWith("section-style:")).map(id=>oldBlocks.get(id)?.section||nextBlocks.get(id)?.section||id));
  if(updated.length<previous.length||JSON.stringify(updated.slice(0,previous.length))!==JSON.stringify(previous)||
    !newEvents.length||newEvents.some(event=>!event||typeof event!=="object"||!allowedSections.has(event.section?.id)))
    return reject("Eventos de seções não solicitadas foram alterados.");
  delete oldMetadata.universalSectionEvents;delete nextMetadata.universalSectionEvents;
 }
 if(JSON.stringify(oldMetadata)!==JSON.stringify(nextMetadata))return reject("Dados gerais do site foram alterados sem solicitação.");
 const stableOld=oldOrder.filter(id=>!ids.has(id)),stableNew=newOrder.filter(id=>!ids.has(id));
 if(JSON.stringify(stableOld)!==JSON.stringify(stableNew))return reject("Ordem relativa de blocos não solicitados alterada.");
 return {ok:true,reason:"Alterações declaradas confirmadas."};
}
