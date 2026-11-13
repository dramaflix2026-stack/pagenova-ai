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
 const moved=oldOrder.length===newOrder.length&&oldOrder.some((id,i)=>newOrder[i]!==id);
 for(const id of ids){
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
  if(old&&next&&JSON.stringify(old)===JSON.stringify(next)&&!moved)return reject("Bloco indicado não foi modificado: "+id);
 }
 for(const [id,old] of oldBlocks){
  if(ids.has(id))continue;
  const next=nextBlocks.get(id);
  if(!next)return reject("Bloco não solicitado removido: "+id);
  if(JSON.stringify(old)!==JSON.stringify(next))return reject("Bloco não solicitado alterado: "+id);
 }
 for(const id of nextBlocks.keys())if(!oldBlocks.has(id)&&!ids.has(id))return reject("Bloco não solicitado adicionado: "+id);
 // A move may shift other blocks' indices but must preserve their relative order.
 const stableOld=oldOrder.filter(id=>!ids.has(id)),stableNew=newOrder.filter(id=>!ids.has(id));
 if(JSON.stringify(stableOld)!==JSON.stringify(stableNew))return reject("Ordem relativa de blocos não solicitados alterada.");
 return {ok:true,reason:"Alterações declaradas confirmadas."};
}
