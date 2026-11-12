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
