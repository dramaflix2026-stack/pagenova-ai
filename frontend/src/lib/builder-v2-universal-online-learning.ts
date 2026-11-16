/**
 * Online contextual strategy selection from explicitly reviewed Supabase events.
 * Each approval/rejection updates the next Bayesian success estimate without
 * retraining or silently altering a template. All actions still require verification.
 */
export type ReviewedRoute="universal"|"ai-editor"|"scoped-copy";
export type ReviewedFeedback={
 intent:string;target:string;strategy:string;niche?:string|null;model?:string|null;section_key?:string|null;
 review_status:string;execution_status:string;failure_code?:string|null;
};
export type ReviewedDecision={
 route:ReviewedRoute|"none";usedEvidence:boolean;
 metrics:Record<ReviewedRoute,{successes:number;failures:number;mean:number;total:number}>;
};
const routes:ReviewedRoute[]=["universal","ai-editor","scoped-copy"];
export function feedbackRoute(strategy:string):ReviewedRoute|null {
 if(strategy==="universal"||strategy.startsWith("universal-")||strategy.startsWith("universal:"))return "universal";
 if(strategy==="ai-editor"||strategy.startsWith("ai-editor-"))return "ai-editor";
 if(strategy==="scoped-copy"||strategy==="copy"||strategy.startsWith("scoped-copy-"))return "scoped-copy";
 return null;
}
export function learnReviewedExecutionRoute(records:readonly ReviewedFeedback[],context:{
 intent:string;target:string;niche?:string;model?:string;sectionKey?:string;allowed:readonly ReviewedRoute[];
}):ReviewedDecision{
 const values=Object.fromEntries(routes.map(route=>[route,{successes:0,failures:0,mean:0.5,total:0}])) as ReviewedDecision["metrics"];
 const norm=(s?:string|null)=>(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
 for(let i=0;i<Math.min(500,records.length);i++){
  const row=records[i],route=feedbackRoute(row.strategy);
  if(!route||row.intent!==context.intent||row.target!==context.target)continue;
  if(context.sectionKey&&row.section_key&&row.section_key!==context.sectionKey)continue;
  const approved=row.review_status==="approved"&&row.execution_status==="applied";
  const rejected=row.review_status==="rejected";
  if(!approved&&!rejected)continue;
  // Same-niche/model examples have higher influence. Other niches are useful
  // but cannot dominate repeated local failures.
  const local=!!norm(context.niche)&&norm(context.niche)===norm(row.niche);
  const sameModel=!!norm(context.model)&&norm(context.model)===norm(row.model);
  const weight=(local?2:0.65)*(sameModel?1.4:0.9)*(i<40?1:0.7);
  if(approved)values[route].successes+=weight;
  if(rejected)values[route].failures+=weight;
 }
 for(const route of routes){
  const value=values[route];value.total=value.successes+value.failures;
  value.mean=(1+value.successes)/(2+value.total); // Beta(1,1) posterior mean.
 }
 const permitted=context.allowed.filter((v,i,a)=>routes.includes(v)&&a.indexOf(v)===i);
 const ordered=permitted.slice().sort((a,b)=>values[b].mean-values[a].mean||permitted.indexOf(a)-permitted.indexOf(b));
 const best=ordered[0],baseline=values.universal;
 if(!best)return {route:"none",usedEvidence:false,metrics:values};
 // No automatic exploration on user sites; require real positive reviews and
 // a meaningful margin before promoting a different execution strategy.
 const hasEvidence=values[best].total>=2.5&&values[best].successes>=1.8;
 const promoted=best!=="universal"&&hasEvidence&&
  values[best].mean>=0.62&&values[best].mean-baseline.mean>=0.14;
 const universalChosen=best==="universal"&&baseline.total>=2.5&&baseline.successes>=1.8;
 return {route:promoted?best:universalChosen?"universal":"none",usedEvidence:promoted||universalChosen,metrics:values};
}
