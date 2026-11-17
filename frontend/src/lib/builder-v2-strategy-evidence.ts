/**
 * Delivery 9/15: compare execution routes and verify genuine learning reuse.
 * Counts are per first submitted request ID, not per message or raw feedback.
 * Attribution is descriptive only, and is NOT a causal A/B experiment.
 */
import {feedbackRoute,type ReviewedRoute} from "./builder-v2-universal-online-learning.ts";
import {wilson95,type MeasuredEditorEvent} from "./builder-v2-first-request-metrics.ts";

export type StrategyEvent=MeasuredEditorEvent&{
 strategy:string;intent:string;target:string;section_key?:string|null;niche?:string|null;model?:string|null;
};
export type ReuseEdge={event_id:string;source_event_id:string;technique?:string|null};
export type SourceReview={id:string;review_status:string;execution_status:string;reviewed_at:string|null};
export type SourceMemory={event_id:string;schema_version:number;verification:string};
export type StrategyRow={key:ReviewedRoute;label:string;reviewed:number;successful:number;failed:number;ratePercent:number|null;lower95Percent:number|null;upper95Percent:number|null};
export type ContextRow={key:string;route:ReviewedRoute;reviewed:number;successful:number;failed:number};
export type StrategyEvidence={
 routes:StrategyRow[];
 contexts:ContextRow[];
 mixedRouteRequests:number;
 incompleteRequests:number;
 unclassifiedRequests:number;
 requestsWithVerifiedReuse:number;
 /** Source-reviewed and visual-verified reuse IDs only; never raw reuse links. */
 verifiedReuseEventIds:string[];
 verifiedReuseOperations:number;
 missingOrLateReuseOperations:number;
 eligibleForStrategyComparison:boolean;
 statisticallyPreferredRoute:ReviewedRoute|null;
 withVerifiedReuse:{reviewed:number;successful:number;failed:number};
 withoutVerifiedReuseRecord:{reviewed:number;successful:number;failed:number};
 completeDataset:boolean;
};

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const names:Record<ReviewedRoute,string>={universal:"Motor Universal", "ai-editor":"Editor IA", "scoped-copy":"Edição de texto"};
const routes:ReviewedRoute[]=["universal","ai-editor","scoped-copy"];
const rounded=(n:number)=>Math.round(n*10)/10;
const validDate=(value:unknown)=>typeof value==="string"&&Number.isFinite(Date.parse(value));
const simplified=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
const counted=(row:StrategyEvent)=>row.review_status==="approved"&&row.execution_status==="applied";

/**
 * An attribution requires: an existing same-account source with a reviewed,
 * applied verdict; a visual-verified v2 solution memory; approval BEFORE the
 * target command; and a real target with an applied execution.
 * Inputs are read through Supabase owner RLS; no prompt, URL or customer copy.
 */
export function evaluateStrategyEvidence(
 events:readonly StrategyEvent[],edges:readonly ReuseEdge[],
 sources:readonly SourceReview[],memories:readonly SourceMemory[],
 completeDataset=true
):StrategyEvidence{
 const sourceById=new Map(sources.map(x=>[x.id,x]));
 const memIds=new Set(memories.filter(x=>x.schema_version===2&&x.verification==="visual").map(x=>x.event_id));
 const byId=new Map(events.map(x=>[x.id,x]));
 const verifiedTargets=new Set<string>();
 let missing=0,verifiedOps=0;
 for(const edge of edges){
  const target=byId.get(edge.event_id);
  const source=sourceById.get(edge.source_event_id);
  if(!target){continue;} // Old, untraced reuse is not first-attempt evidence
  const valid=uuid.test(edge.event_id)&&uuid.test(edge.source_event_id)&&edge.event_id!==edge.source_event_id&&
   target.execution_status==="applied"&&source?.review_status==="approved"&&
   source.execution_status==="applied"&&memIds.has(edge.source_event_id)&&
   validDate(source.reviewed_at)&&validDate(target.submitted_at)&&
   Date.parse(source.reviewed_at!)<=Date.parse(target.submitted_at!);
  if(!valid){missing++;continue;}
  verifiedOps++;verifiedTargets.add(edge.event_id);
 }
 const groups=new Map<string,StrategyEvent[]>();
 for(const e of events){
  if(!uuid.test(e.id)||!uuid.test(e.request_id||""))continue;
  const a=groups.get(e.request_id!)||[];a.push(e);groups.set(e.request_id!,a);
 }
 const totals=new Map<ReviewedRoute,{reviewed:number;successful:number;failed:number}>(
  routes.map(x=>[x,{reviewed:0,successful:0,failed:0}]));
 const contexts=new Map<string,ContextRow>();
 const assisted={reviewed:0,successful:0,failed:0};
 const noReuse={reviewed:0,successful:0,failed:0};
 let mixed=0,incomplete=0,unclassified=0,usedReuse=0;
 for(const group of groups.values()){
  const indices=group.map(x=>x.operation_index);
  const uniqueIndices=new Set(indices);
  const sameTimestamp=group.every(e=>validDate(e.submitted_at)&&e.submitted_at===group[0].submitted_at&&
   validDate(e.created_at)&&Date.parse(e.created_at)>=Date.parse(e.submitted_at!));
  const contiguous=uniqueIndices.size===group.length&&
   indices.every(x=>Number.isInteger(x)&&x!==null&&x>=1&&x<=64)&&
   Math.min(...(indices as number[]))===1&&Math.max(...(indices as number[]))===group.length;
  if(!sameTimestamp||!contiguous||group.some(e=>!["approved","rejected"].includes(e.review_status)||
   !["applied","rejected"].includes(e.execution_status))){incomplete++;continue;}
  const allRoutes=new Set(group.map(e=>feedbackRoute(e.strategy)).filter((v):v is ReviewedRoute=>v!==null));
  if(allRoutes.size>1){mixed++;continue;}
  if(group.some(e=>feedbackRoute(e.strategy)===null)){unclassified++;continue;}
  const route=[...allRoutes][0];
  const passed=group.every(counted);
  const stats=totals.get(route)!;
  stats.reviewed++;if(passed)stats.successful++;else stats.failed++;
  const assistedGroup=group.some(e=>verifiedTargets.has(e.id));
  const cohort=assistedGroup?assisted:noReuse;
  cohort.reviewed++;if(passed)cohort.successful++;else cohort.failed++;
  if(assistedGroup)usedReuse++;
  const pairKeys=new Set(group.map(e=>simplified(e.intent||"")+" / "+simplified(e.target||"")));
  if(pairKeys.size===1){
   const pair=[...pairKeys][0];if(pair!== " / "){
    const key=route+"|"+pair;
    const existing=contexts.get(key)||{key:pair,route,reviewed:0,successful:0,failed:0};
    existing.reviewed++;if(passed)existing.successful++;else existing.failed++;
    contexts.set(key,existing);
   }
  }
 }
 const rows=routes.map(route=>{
  const stats=totals.get(route)!;
  const ci=completeDataset&&stats.reviewed>=30?wilson95(stats.successful,stats.reviewed):null;
  return {key:route,label:names[route],...stats,
    ratePercent:ci?rounded(stats.successful/stats.reviewed*100):null,
    lower95Percent:ci?rounded(ci.lower*100):null,upper95Percent:ci?rounded(ci.upper*100):null
  };
 });
 // Never proclaim a statistically superior route merely from raw ranks.
 // A comparison requires 30 verified requests on EACH route, then
 // non-overlapping Wilson intervals. Still descriptive, not causal.
 const eligible=completeDataset&&rows.every(x=>x.reviewed>=30);
 const candidate=eligible?rows.slice().sort((a,b)=>(b.ratePercent??0)-(a.ratePercent??0))[0]:null;
 const rivals=candidate?rows.filter(x=>x.key!==candidate.key):[];
 const superior=candidate&&rivals.every(x=>(candidate.lower95Percent??0)>(x.upper95Percent??100))
  ?candidate.key:null;
 return {routes:rows,contexts:[...contexts.values()].sort((a,b)=>b.reviewed-a.reviewed||a.key.localeCompare(b.key)).slice(0,12),
  mixedRouteRequests:mixed,incompleteRequests:incomplete,unclassifiedRequests:unclassified,
  requestsWithVerifiedReuse:usedReuse,verifiedReuseOperations:verifiedOps,
  verifiedReuseEventIds:[...verifiedTargets].sort(),
  missingOrLateReuseOperations:missing,eligibleForStrategyComparison:eligible,
  statisticallyPreferredRoute:superior,
  withVerifiedReuse:assisted,withoutVerifiedReuseRecord:noReuse,completeDataset};
}
