/**
 * Delivery 08/15 — evidence-only first-request metrics.
 * The unit is one submitted command UUID, NOT a learning event or a generic approval.
 * We do not guess whether separate commands are corrections of the same task.
 */
export type MeasuredEditorEvent={
 id:string;request_id:string|null;operation_index:number|null;
 submitted_at:string|null;created_at:string;
 review_status:string;execution_status:string;
};
export type MeasuredCohort={reviewed:number;successful:number;failed:number;ratePercent:number|null};
export type FirstRequestMetrics={
 tracedEvents:number;legacyEvents:number;tracedRequests:number;
 reviewedRequests:number;successfulRequests:number;failedRequests:number;
 pendingRequests:number;unverifiableRequests:number;
 ratePercent:number|null;lower95Percent:number|null;upper95Percent:number|null;
 statisticallySupports98Percent:boolean;minimumSampleReached:boolean;
 withVerifiedReuse:MeasuredCohort;withoutVerifiedReuse:MeasuredCohort;
 comparisonReady:boolean;completeDataset:boolean;
};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validDate=(value:unknown)=>typeof value==="string"&&value.length>0&&Number.isFinite(Date.parse(value));
const round=(x:number)=>Math.round(x*10)/10;
export function wilson95(successes:number,total:number):{lower:number;upper:number}|null{
 if(!Number.isInteger(total)||total<=0||successes<0||successes>total)return null;
 const z=1.959963984540054, p=successes/total, z2=z*z;
 const denom=1+z2/total, center=(p+z2/(2*total))/denom;
 const margin=z*Math.sqrt(p*(1-p)/total+z2/(4*total*total))/denom;
 return {lower:Math.max(0,center-margin),upper:Math.min(1,center+margin)};
}
export function measureFirstRequests(
 events:readonly MeasuredEditorEvent[],
 reusedEventIds:ReadonlySet<string>,
 totalEventCount:number,
 completeDataset=true
):FirstRequestMetrics{
 const grouped=new Map<string,MeasuredEditorEvent[]>();
 for(const row of events){
  if(!row||typeof row.id!=="string"||typeof row.request_id!=="string"||
     !UUID.test(row.id)||!UUID.test(row.request_id))continue;
  const group=grouped.get(row.request_id)||[];
  group.push(row);grouped.set(row.request_id,group);
 }
 let reviewed=0,successful=0,failed=0,pending=0,unverifiable=0;
 const withReuse={reviewed:0,successful:0,failed:0};
 const withoutReuse={reviewed:0,successful:0,failed:0};
 for(const group of grouped.values()){
  const indices=group.map(row=>row.operation_index);
  const validIndexes=indices.every((index)=>Number.isInteger(index)&&index!==null&&index>=1&&index<=64);
  const indexSet=new Set(indices);
  const consecutive=validIndexes&&indexSet.size===group.length&&
    Math.min(...(indices as number[]))===1&&Math.max(...(indices as number[]))===group.length;
  const dates=group.every(row=>validDate(row.submitted_at)&&validDate(row.created_at)&&
    Date.parse(row.created_at)>=Date.parse(row.submitted_at||""));
  const submittedAt=group[0].submitted_at;
  const sameSubmission=group.every(row=>row.submitted_at===submittedAt);
  if(!consecutive||!dates||!sameSubmission){unverifiable++;continue;}
  if(group.some(row=>row.review_status==="pending")){pending++;continue;}
  if(group.some(row=>!["approved","rejected"].includes(row.review_status)||
    !["applied","rejected"].includes(row.execution_status))){unverifiable++;continue;}
  const passed=group.every(row=>row.review_status==="approved"&&row.execution_status==="applied");
  reviewed++;if(passed)successful++;else failed++;
  const assisted=group.some(row=>reusedEventIds.has(row.id));
  const cohort=assisted?withReuse:withoutReuse;
  cohort.reviewed++;
  if(passed)cohort.successful++;else cohort.failed++;
 }
 const interval=completeDataset?wilson95(successful,reviewed):null;
 const rate=completeDataset&&reviewed>=30?round(successful/reviewed*100):null;
 const cohortRate=(x:typeof withReuse):MeasuredCohort=>({
  ...x,ratePercent:completeDataset&&x.reviewed>=30?round(x.successful/x.reviewed*100):null
 });
 return {
  tracedEvents:events.length,
  legacyEvents:Math.max(0,totalEventCount-events.length),
  tracedRequests:grouped.size,
  reviewedRequests:reviewed,successfulRequests:successful,failedRequests:failed,
  pendingRequests:pending,unverifiableRequests:unverifiable,
  ratePercent:rate,
  lower95Percent:interval&&reviewed>=30?round(interval.lower*100):null,
  upper95Percent:interval&&reviewed>=30?round(interval.upper*100):null,
  minimumSampleReached:completeDataset&&reviewed>=30,
  statisticallySupports98Percent:completeDataset&&reviewed>=100&&!!interval&&interval.lower>=0.98,
  withVerifiedReuse:cohortRate(withReuse),
  withoutVerifiedReuse:cohortRate(withoutReuse),
  comparisonReady:completeDataset&&withReuse.reviewed>=30&&withoutReuse.reviewed>=30,
  completeDataset
 };
}
