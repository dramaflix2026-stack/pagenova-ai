/**
 * Delivery 11/15: quarantine a learned technique based on explicit reviews
 * of its recorded reuses. No template, memory row or evaluation is mutated.
 */
export type ReuseEdge={event_id:string;source_event_id:string;technique:string;created_at:string};
export type ReuseOutcome={id:string;review_status:string;execution_status:string;created_at:string;reviewed_at:string|null};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const known=new Set(["section-background","section-heading-color","block-color","block-copy","block-alignment","section-reorder","section-remove","section-add"]);
const validTime=(x:unknown):x is string=>typeof x==="string"&&x.length>10&&Number.isFinite(Date.parse(x));
export const reuseKey=(source:string,technique:string)=>source+"|"+technique;
export function quarantineReviewedReuses(edges:readonly ReuseEdge[],targets:readonly ReuseOutcome[],complete=true):{
 usable:boolean;blocked:ReadonlySet<string>;reviewed:number;failed:number;pending:number
}{
 const fail=()=>({usable:false,blocked:new Set(edges.map(x=>reuseKey(x.source_event_id,x.technique))),reviewed:0,failed:0,pending:0});
 if(!complete)return fail();
 const map=new Map(targets.map(x=>[x.id,x]));
 if(map.size!==targets.length)return fail();
 const groups=new Map<string,Array<{date:number;failed:boolean}>>();
 let reviewed=0,failed=0,pending=0;
 for(const edge of edges){
  const target=map.get(edge.event_id);
  if(!UUID.test(edge.event_id)||!UUID.test(edge.source_event_id)||edge.event_id===edge.source_event_id||
   !known.has(edge.technique)||!validTime(edge.created_at)||!target||!validTime(target.created_at)||
   Date.parse(edge.created_at)<Date.parse(target.created_at))return fail();
  if(target.review_status==="pending"){pending++;continue;}
  if(!["approved","rejected"].includes(target.review_status)||!validTime(target.reviewed_at)||
   Date.parse(target.reviewed_at)<Date.parse(target.created_at))return fail();
  const bad=target.review_status==="rejected"||target.execution_status!=="applied";
  const key=reuseKey(edge.source_event_id,edge.technique);
  const entries=groups.get(key)||[];
  entries.push({date:Date.parse(target.created_at),failed:bad});groups.set(key,entries);
  reviewed++;if(bad)failed++;
 }
 const blocked=new Set<string>();
 for(const [key,values] of groups){
  values.sort((a,b)=>b.date-a.date);
  const last3=values.slice(0,3).filter(x=>x.failed).length;
  const last5=values.slice(0,5).filter(x=>x.failed).length;
  if(last3>=2||last5>=3)blocked.add(key);
 }
 return {usable:true,blocked,reviewed,failed,pending};
}
