/**
 * Delivery 12/15 — evidence-only cross-niche reuse audit.
 * All inputs are read via authenticated owner RLS. No customer text, images,
 * template mutations, or historical result rewriting.
 */
import {resolveBriefingFamily} from "./briefing-template-families.ts";
import type {ReuseEdge} from "./builder-v2-learned-technique-quarantine.ts";
export type FamilySourceReview={
 id:string;niche:string;model:string;review_status:string;execution_status:string;reviewed_at:string|null;
};
export type FamilySolutionMemory={
 event_id:string;schema_version:number;verification:string;
 context:{niche:string;model:string;family:string;template?:string}|null;
};
export type FamilyTargetReview={
 id:string;niche:string;model:string;section_key:string|null;
 request_id:string|null;operation_index:number|null;submitted_at:string|null;
 created_at:string;reviewed_at:string|null;review_status:string;execution_status:string;
};
export type FamilyTransferAudit={
 usable:boolean;recordedSameNiche:number;recordedCrossNiche:number;
 verifiedSameNicheApproved:number;verifiedSameNicheRejected:number;
 verifiedCrossNicheApproved:number;verifiedCrossNicheRejected:number;
 pending:number;unverifiable:number;blockedDestinations:ReadonlySet<string>;
};
const n=(v?:string|null)=>(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
const dt=(v?:string|null)=>typeof v==="string"&&v.length>10?Date.parse(v):NaN;
const ok=(v?:string|null)=>Number.isFinite(dt(v));
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const section=(v?:string|null)=>{
 const s=n(v);
 return ({servicos:"services",galeria:"gallery",depoimentos:"testimonials",rodape:"footer",contato:"contact"} as Record<string,string>)[s]||s;
};
export const destinationFamilyTransferKey=(source:string,technique:string,niche:string,model:string,sectionKey:string)=>
 [source,n(technique),n(niche),n(model),section(sectionKey)].join("|");
export function auditFamilyTransfers(
 edges:readonly ReuseEdge[],sources:readonly FamilySourceReview[],
 memories:readonly FamilySolutionMemory[],targets:readonly FamilyTargetReview[],complete=true
):FamilyTransferAudit{
 const empty=():FamilyTransferAudit=>({usable:false,recordedSameNiche:0,recordedCrossNiche:0,
  verifiedSameNicheApproved:0,verifiedSameNicheRejected:0,verifiedCrossNicheApproved:0,
  verifiedCrossNicheRejected:0,pending:0,unverifiable:edges.length,blockedDestinations:new Set()});
 if(!complete)return empty();
 const src=new Map(sources.map(x=>[x.id,x])),mem=new Map(memories.map(x=>[x.event_id,x]));
 const trg=new Map(targets.map(x=>[x.id,x]));
 if(src.size!==sources.length||mem.size!==memories.length||trg.size!==targets.length)return empty();
 const groups=new Map<string,{date:number;failed:boolean}[]>();
 const seen=new Set<string>();
 let recordedSameNiche=0,recordedCrossNiche=0;
 let verifiedSameNicheApproved=0,verifiedSameNicheRejected=0;
 let verifiedCrossNicheApproved=0,verifiedCrossNicheRejected=0,pending=0,unverifiable=0;
 for(const edge of edges){
  const a=src.get(edge.source_event_id),m=mem.get(edge.source_event_id),b=trg.get(edge.event_id);
  if(!a||!m||!b||!UUID.test(edge.event_id)||!UUID.test(edge.source_event_id)||
   edge.event_id===edge.source_event_id||seen.has(edge.event_id)){unverifiable++;continue;}
  seen.add(edge.event_id);
  const same=!!n(a.niche)&&n(a.niche)===n(b.niche);
  if(same)recordedSameNiche++;else recordedCrossNiche++;
  const sf=resolveBriefingFamily(a.niche),tf=resolveBriefingFamily(b.niche);
  const validSource=m.schema_version===2&&m.verification==="visual"&&
   a.review_status==="approved"&&a.execution_status==="applied"&&
   !!m.context&&n(m.context.niche)===n(a.niche)&&n(m.context.model)===n(a.model)&&
   String(sf||"")===m.context.family&&!!sf;
  const validDest=!!tf&&sf===tf&&n(a.model)===n(b.model)&&
   !!section(b.section_key)&&["approved","rejected","pending"].includes(b.review_status);
  if(b.review_status==="pending"&&validSource&&validDest){pending++;continue;}
  const validTimes=ok(a.reviewed_at)&&ok(b.submitted_at)&&ok(b.created_at)&&
   ok(edge.created_at)&&ok(b.reviewed_at)&&
   dt(a.reviewed_at)<=dt(b.submitted_at)&&dt(b.submitted_at)<=dt(b.created_at)&&
   dt(b.created_at)<=dt(edge.created_at)&&dt(b.created_at)<=dt(b.reviewed_at);
  const validTechnique=same||edge.technique==="section-background";
  if(!validSource||!validDest||!validTimes||!validTechnique||
   !["applied","rejected"].includes(b.execution_status)){
   unverifiable++;continue;
  }
  const passed=b.review_status==="approved"&&b.execution_status==="applied";
  if(same){
   if(passed)verifiedSameNicheApproved++;else verifiedSameNicheRejected++;
  }else{
   if(passed)verifiedCrossNicheApproved++;else verifiedCrossNicheRejected++;
   const key=destinationFamilyTransferKey(edge.source_event_id,edge.technique,b.niche,b.model,b.section_key||"");
   const a=groups.get(key)||[];a.push({date:dt(b.submitted_at),failed:!passed});groups.set(key,a);
  }
 }
 const blockedDestinations=new Set<string>();
 for(const [key,events] of groups){
  events.sort((a,b)=>b.date-a.date);
  if(events.slice(0,3).filter(x=>x.failed).length>=2||
     events.slice(0,5).filter(x=>x.failed).length>=3)blockedDestinations.add(key);
 }
 return {usable:true,recordedSameNiche,recordedCrossNiche,
  verifiedSameNicheApproved,verifiedSameNicheRejected,
  verifiedCrossNicheApproved,verifiedCrossNicheRejected,pending,unverifiable,blockedDestinations};
}
