/**
 * Delivery 14/15 — evidence-only coverage of the five Universal Editor tasks.
 * Counts a submitted request exactly once; the same request must not inflate
 * multiple intent cohorts. Observed coverage is per authenticated owner only,
 * NOT a platform-wide claim or a simulated benchmark.
 */
import {measureFirstRequests,wilson95,type MeasuredEditorEvent} from "./builder-v2-first-request-metrics.ts";

export type UniversalCoverageEvent=MeasuredEditorEvent&{
 niche?:string|null;model?:string|null;intent?:string|null;
};
export const UNIVERSAL_TASKS=["text","color","image","section","layout"] as const;
export type UniversalTask=typeof UNIVERSAL_TASKS[number];
export type UniversalTaskCoverage={
 task:UniversalTask;reviewed:number;successful:number;failed:number;
 ratePercent:number|null;lower95Percent:number|null;coveredPairs:number;
};
export type UniversalCoverageAudit={
 completeDataset:boolean;reviewedRequests:number;
 unknownOrMixedRequests:number;pendingOrUnverifiableRequests:number;
 coveredNiches:number;coveredNicheModelPairs:number;
 nichesWithThreeModels:number;modelVariants:number;
 tasks:UniversalTaskCoverage[];hasFull399PairCoverage:boolean;
 hasEvidenceFor98Percent:boolean;
};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const round=(v:number)=>Math.round(v*10)/10;
const taskFor=(intent:unknown):UniversalTask|null=>{
 switch(intent){
 case "copy":return "text";
 case "style":return "color";
 case "image":return "image";
 case "add-section":case "remove-section":return "section";
 case "layout":return "layout";
 default:return null;
 }
};
const nicheFor=(value:unknown):string|null=>{
 if(typeof value!=="string")return null;
 const key=value.normalize("NFKC").trim().toLocaleLowerCase("pt-BR").replace(/\s+/g," ");
 return key&&key.length<=100?key:null;
};
const modelFor=(value:unknown):string|null=>{
 if(typeof value!=="string")return null;
 const raw=value.trim().toLowerCase();
 const match=/^(?:(?:modelo|model|m)\s*[-:]?\s*)?0?([123])$/.exec(raw);
 return match?match[1]:null;
};
export function auditUniversalCoverage(
 events:readonly UniversalCoverageEvent[],completeDataset:boolean
):UniversalCoverageAudit{
 const byRequest=new Map<string,UniversalCoverageEvent[]>();
 for(const item of events){
  if(!item||typeof item.request_id!=="string"||!UUID.test(item.request_id))continue;
  const existing=byRequest.get(item.request_id)||[];
  existing.push(item);byRequest.set(item.request_id,existing);
 }
 const sums=new Map<UniversalTask,{reviewed:number;successful:number;failed:number}>(
  UNIVERSAL_TASKS.map(task=>[task,{reviewed:0,successful:0,failed:0}])
 );
 const coverage=new Map<string,Set<string>>();
 const taskPairs=new Map<UniversalTask,Set<string>>(UNIVERSAL_TASKS.map(task=>[task,new Set<string>()]));
 let reviewedRequests=0,unknownOrMixedRequests=0,pendingOrUnverifiableRequests=0;
 for(const rows of byRequest.values()){
  // Same admission rules as the first-request metrics: a complete, ordered,
  // dated, reviewed and applied/rejected set of operations for one UUID.
  const result=measureFirstRequests(rows,new Set(),rows.length,true);
  if(result.reviewedRequests!==1){
   pendingOrUnverifiableRequests++;continue;
  }
  reviewedRequests++;
  const kinds=new Set(rows.map(row=>taskFor(row.intent)));
  if(kinds.size!==1||kinds.has(null)){unknownOrMixedRequests++;continue;}
  const task=[...kinds][0] as UniversalTask;
  const counter=sums.get(task)!;
  counter.reviewed++;if(result.successfulRequests===1)counter.successful++;
  else counter.failed++;
  const niches=new Set(rows.map(row=>nicheFor(row.niche)));
  const models=new Set(rows.map(row=>modelFor(row.model)));
  if(niches.size===1&&models.size===1&&!niches.has(null)&&!models.has(null)){
   const niche=[...niches][0] as string,model=[...models][0] as string;
   const mapped=coverage.get(niche)||new Set<string>();
   mapped.add(model);coverage.set(niche,mapped);
   taskPairs.get(task)!.add(niche+"|"+model);
  }
 }
 const tasks:UniversalTaskCoverage[]=UNIVERSAL_TASKS.map(task=>{
  const cohort=sums.get(task)!;
  const conf=completeDataset?wilson95(cohort.successful,cohort.reviewed):null;
  const sufficient=completeDataset&&cohort.reviewed>=30;
  return {task,...cohort,ratePercent:sufficient?round(cohort.successful/cohort.reviewed*100):null,
   lower95Percent:sufficient&&conf?round(conf.lower*100):null,
   coveredPairs:taskPairs.get(task)!.size};
 });
 const coveredNicheModelPairs=[...coverage.values()].reduce((sum,x)=>sum+x.size,0);
 const nichesWithThreeModels=[...coverage.values()].filter(x=>x.size===3).length;
 const distinctModels=new Set([...coverage.values()].flatMap(x=>[...x])).size;
 const hasFull399PairCoverage=completeDataset&&coverage.size>=133&&
  coveredNicheModelPairs>=399&&nichesWithThreeModels>=133&&distinctModels===3;
 return {completeDataset,reviewedRequests,unknownOrMixedRequests,pendingOrUnverifiableRequests,
  coveredNiches:coverage.size,coveredNicheModelPairs,nichesWithThreeModels,
  modelVariants:distinctModels,tasks,hasFull399PairCoverage,
  // Universal proof requires EACH task across ALL 133 niches × 3 models,
  // never just 399 visits for one task and a high global rate. Use the raw
  // lower bound, not the rounded UI percentage, to avoid false positives.
  hasEvidenceFor98Percent:hasFull399PairCoverage&&tasks.every(x=>{
   const interval=completeDataset?wilson95(x.successful,x.reviewed):null;
   return x.coveredPairs>=399&&x.reviewed>=399&&interval!==null&&interval.lower>=0.98;
  })};
}
