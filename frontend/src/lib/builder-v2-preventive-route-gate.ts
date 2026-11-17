/**
 * Delivery 10/15 — preventive promotion gate for the existing PageNova editor.
 * An old approval is diagnostic context, not permission to replace a safe path.
 * No site mutation, no customer content, and no cross-account query happens here.
 */
import {feedbackRoute,type ReviewedRoute} from "./builder-v2-universal-online-learning.ts";
export type PreflightReview={
 id:string; request_id?:string|null; operation_index?:number|null;
 submitted_at?:string|null; created_at?:string|null; reviewed_at?:string|null;
 intent:string;target:string;strategy:string;niche?:string|null;model?:string|null;
 section_key?:string|null;review_status:string;execution_status:string;
};
export type PreflightContext={
 intent:string;target:string;niche:string;model:string;sectionKey?:string;
 recordsComplete:boolean;
};
export type PreflightSummary={
 route:ReviewedRoute;reviewed:number;successful:number;failed:number;
 recentFailures:number;eligible:boolean;
};
export type PreflightGate={
 allowAiPromotion:boolean;allowScopedCopyPromotion:boolean;
 reviewedRequests:number;excludedRequests:number;legacyEvents:number;
 complete:boolean;routes:PreflightSummary[];
};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROUTES:ReviewedRoute[]=["universal","ai-editor","scoped-copy"];
const norm=(s?:string|null)=>(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
const timestamp=(value?:string|null):number=>typeof value==="string"&&value.length>10?Date.parse(value):NaN;
type GroupResult={route:ReviewedRoute;success:boolean;submittedAt:number};
export function assessPreventiveRouteGate(records:readonly PreflightReview[],ctx:PreflightContext):PreflightGate{
 const groups=new Map<string,PreflightReview[]>();
 let legacy=0;
 for(const row of records){
  if(!UUID.test(row.request_id||"")){legacy++;continue;}
  const key=row.request_id!;
  const events=groups.get(key)||[];events.push(row);groups.set(key,events);
 }
 const verified:GroupResult[]=[];
 let excluded=0;
 for(const rows of groups.values()){
  const indexes=rows.map(r=>r.operation_index);
  const numeric=indexes as number[];
  const submitted=timestamp(rows[0].submitted_at);
  const complete= indexes.every(v=>Number.isInteger(v)&&v!==null&&v!==undefined&&v>=1&&v<=64)&&
   new Set(indexes).size===rows.length&&Math.min(...numeric)===1&&Math.max(...numeric)===rows.length;
  const sameTime=rows.every(r=>r.submitted_at===rows[0].submitted_at);
  const reviewed=rows.every(r=>["approved","rejected"].includes(r.review_status)&&
   ["applied","rejected"].includes(r.execution_status)&&
   Number.isFinite(timestamp(r.created_at))&&Number.isFinite(timestamp(r.reviewed_at))&&
   timestamp(r.created_at)>=submitted&&timestamp(r.reviewed_at)>=timestamp(r.created_at));
  const matching=rows.every(r=>
   !!norm(ctx.niche)&&!!norm(ctx.model)&&norm(r.niche)===norm(ctx.niche)&&
   norm(r.model)===norm(ctx.model)&&norm(r.intent)===norm(ctx.intent)&&
   norm(r.target)===norm(ctx.target)&&
   (!ctx.sectionKey||norm(r.section_key)===norm(ctx.sectionKey)));
  const route=feedbackRoute(rows[0].strategy);
  const oneRoute=route!==null&&rows.every(r=>feedbackRoute(r.strategy)===route);
  if(!Number.isFinite(submitted)||!sameTime||!complete||!reviewed||!matching||!oneRoute){
   excluded++;continue;
  }
  verified.push({route:route!,success:rows.every(r=>r.review_status==="approved"&&r.execution_status==="applied"),submittedAt:submitted});
 }
 const routes=ROUTES.map(route=>{
  const list=verified.filter(r=>r.route===route).sort((a,b)=>b.submittedAt-a.submittedAt);
  const reviewed=list.length,successful=list.filter(r=>r.success).length;
  const recentFailures=list.slice(0,5).filter(r=>!r.success).length;
  // An operational gate, NOT proof of 98–99% first-attempt performance.
  const eligible=ctx.recordsComplete&&reviewed>=8&&successful/reviewed>=0.85&&recentFailures<=1;
  return {route,reviewed,successful,failed:reviewed-successful,recentFailures,eligible};
 });
 const universal=routes[0];
 const allowed=(route:ReviewedRoute)=>{
  const other=routes.find(r=>r.route===route)!;
  if(!other.eligible)return false;
  // A promoted route needs an observed improvement when universal has enough data.
  if(universal.reviewed>=8&&
     other.successful/other.reviewed < universal.successful/universal.reviewed+0.1)return false;
  return true;
 };
 return {allowAiPromotion:allowed("ai-editor"),
   allowScopedCopyPromotion:allowed("scoped-copy"),reviewedRequests:verified.length,
   excludedRequests:excluded,legacyEvents:legacy,complete:ctx.recordsComplete,routes};
}
