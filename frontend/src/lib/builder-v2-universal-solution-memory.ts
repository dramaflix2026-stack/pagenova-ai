/**
 * PageNova Universal Editor — Step 2/9: bounded, user-private solution memory.
 * Produces structured, independently verified deltas, not untrusted AI prose.
 * Approval is enforced at retrieval time via the linked feedback event.
 */
import {verifyUniversalEditResult} from "./builder-v2-universal-learning.ts";
import type {UniversalSite,UniversalBlock} from "./builder-v2-universal-operations.ts";

export type SolutionDelta={
 kind:"block-field"|"block-added"|"block-removed"|"block-moved"|"section-style"|"section-photo"|"site-style"|"section-event"|"block-other";
 blockId?:string;section?:string;blockType?:string;field?:string;
 before?:string|number|boolean|null;after?:string|number|boolean|null;
 fromIndex?:number;toIndex?:number;reason?:string;
};
export type EditorSolutionMemory={
 schemaVersion:2;
 verification:"model"|"visual";
 context:{niche:string;model:string;family:string;template:string};
 changedIds:string[];
 deltas:SolutionDelta[];
};
const allowedFields=new Set([
 "text","color","background","align","textColor","cardTitleAlign",
 "fontSize","mobileFontSize","fontFamily","layout","columns","radius",
 "spacing","marginBottom","cardBorderColor","cardBorderWidth","cardShadow",
 "imageFit","imagePosition","src","mobileSrc","href"
]);
const allowMetaStyle=new Set(["backgroundColor","headingColor","textColor","align","padding","gap"]);
const sanitizeContext=(s?:string)=>typeof s==="string"?s.trim().slice(0,90):"";
const safeScalar=(field:string,raw:unknown):string|number|boolean|null|undefined=>{
 if(raw===null)return null;
 if(typeof raw==="number")return Number.isFinite(raw)&&Math.abs(raw)<1e7?raw:undefined;
 if(typeof raw==="boolean")return raw;
 if(typeof raw!=="string")return undefined;
 // Signed images, uploads, and contact links are never copied into learning memory.
 if(["src","mobileSrc","href"].includes(field)){
  if(/^data:/i.test(raw))return "<uploaded-asset>";
  try{const url=new URL(raw,"https://pagenova.invalid");return url.hostname==="pagenova.invalid"?"<site-link>":url.protocol==="https:"?"<public-web-url>":url.protocol==="mailto:"||url.protocol==="tel:"?"<contact-link>":undefined;}catch{return "<link>";}
 }
 if(field==="text"){
  // Persist exact short text only within its owner's RLS scope; redact probable secrets and contacts.
  if(raw.length>240||/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:\+?55\s?)?\d{10,11}\b|(?:sk-|sb_secret_|Bearer\s)[\w-]{8,})/i.test(raw))return "<content-redacted>";
  return raw;
 }
 return raw.length<=140?raw:undefined;
};
const comparable=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const isRecord=(a:unknown):a is Record<string,unknown>=>!!a&&typeof a==="object"&&!Array.isArray(a);
const addBlockFields=(deltas:SolutionDelta[],id:string,before:UniversalBlock,after:UniversalBlock)=>{
 let known=0;
 for(const field of new Set([...Object.keys(before),...Object.keys(after)])){
  if(field==="id"||field==="type"||field==="section"||comparable(before[field],after[field]))continue;
  if(!allowedFields.has(field))continue;
  const original=safeScalar(field,before[field]),next=safeScalar(field,after[field]);
  // Missing fields are represented by null so the delta is still meaningful.
  if(original===undefined&&before[field]!==undefined||next===undefined&&after[field]!==undefined)continue;
  deltas.push({kind:"block-field",blockId:id,section:after.section||before.section||"",blockType:after.type,field,
   before:original===undefined?null:original,after:next===undefined?null:next});
  known++;
 }
 if(!known){
  const changed=Object.keys(after).filter(field=>!comparable(before[field],after[field])).filter(field=>field!=="id");
  if(changed.length)deltas.push({kind:"block-other",blockId:id,section:after.section||before.section||"",blockType:after.type,reason:"Campos não reutilizáveis: "+changed.slice(0,5).map(field=>field.replace(/[^a-zA-Z0-9_-]/g,"")).join(",")});
 }
};
const styleDeltas=(before:unknown,after:unknown,field:string,section:string):SolutionDelta[]=>{
 const b=isRecord(before)?before:{},a=isRecord(after)?after:{};
 const deltas:SolutionDelta[]=[];
 for(const key of new Set([...Object.keys(b),...Object.keys(a)])){
  if(!allowMetaStyle.has(key)||comparable(b[key],a[key]))continue;
  const old=safeScalar(key,b[key]),next=safeScalar(key,a[key]);
  if(old===undefined&&b[key]!==undefined||next===undefined&&a[key]!==undefined)continue;
  deltas.push({kind:"section-style",section,field:key,before:old===undefined?null:old,after:next===undefined?null:next});
 }
 if(!deltas.length&&JSON.stringify(b)!==JSON.stringify(a))deltas.push({kind:"section-style",section,reason:"Mudança de configuração estrutural não reutilizável"});
 return deltas;
};

/** A strict, single-section image override is a verified data change even
 * though the generic block verifier does not understand section-photo IDs. */
const verifyScopedPhoto=(before:UniversalSite,after:UniversalSite,ids:readonly string[]):boolean=>{
 if(ids.length!==1||!ids[0].startsWith("section-photo:"))return false;
 const section=ids[0].slice("section-photo:".length);
 if(!section||section.length>100||JSON.stringify(before.blocks)!==JSON.stringify(after.blocks))return false;
 const oldRoot={...before},newRoot={...after};
 const oldImages=isRecord(oldRoot.universalSectionImages)?oldRoot.universalSectionImages:{};
 const newImages=isRecord(newRoot.universalSectionImages)?newRoot.universalSectionImages:{};
 delete oldRoot.universalSectionImages;delete newRoot.universalSectionImages;
 if(JSON.stringify(oldRoot)!==JSON.stringify(newRoot))return false;
 const oldRemaining={...oldImages},newRemaining={...newImages};
 delete oldRemaining[section];delete newRemaining[section];
 return JSON.stringify(oldRemaining)===JSON.stringify(newRemaining)&&typeof newImages[section]==="string"&&oldImages[section]!==newImages[section];
};
/** Capture only successful deterministic edits; model verification does not imply visual approval. */
export function captureVerifiedEditorSolution<T extends UniversalSite>(
 before:T,after:T,changedIds:readonly string[],
 context:{niche?:string;model?:string;family?:string;template?:string},
 verification:"model"|"visual"="model"
):EditorSolutionMemory|null{
 if(!Array.isArray(changedIds)||changedIds.length<1||changedIds.length>50)return null;
 if(!verifyUniversalEditResult(before,after,changedIds).ok&&!verifyScopedPhoto(before,after,changedIds))return null;
 const oldMap=new Map(before.blocks.map(b=>[b.id,b])),nextMap=new Map(after.blocks.map(b=>[b.id,b]));
 const beforeRoot=before as Record<string,unknown>,afterRoot=after as Record<string,unknown>;
 const deltas:SolutionDelta[]=[];
 for(const id of changedIds){
  if(id.startsWith("section-photo:")){
   const section=id.slice("section-photo:".length);
   const oldImages=isRecord(beforeRoot.universalSectionImages)?beforeRoot.universalSectionImages:{};
   const newImages=isRecord(afterRoot.universalSectionImages)?afterRoot.universalSectionImages:{};
   deltas.push({kind:"section-photo",section,field:"src",before:safeScalar("src",oldImages[section])??null,after:safeScalar("src",newImages[section])??null});
   continue;
  }
  if(id==="primary-cta-theme"){
   const a=safeScalar("color",beforeRoot.universalPrimaryCtaColor),b=safeScalar("color",afterRoot.universalPrimaryCtaColor);
   if(typeof b==="string")deltas.push({kind:"site-style",field:"universalPrimaryCtaColor",before:a??null,after:b});
   continue;
  }
  if(id.startsWith("section-style:")||id.startsWith("section-heading-color:")){
   const section=id.slice(id.indexOf(":")+1);
   const oldStyles=beforeRoot.universalSectionStyles as Record<string,unknown>|undefined;
   const newStyles=afterRoot.universalSectionStyles as Record<string,unknown>|undefined;
   const old=oldStyles?.[section],next=newStyles?.[section];
   if(id.startsWith("section-heading-color:")){
    const a=isRecord(old)?safeScalar("headingColor",old.headingColor):null;
    const b=isRecord(next)?safeScalar("headingColor",next.headingColor):null;
    if(b!==undefined)deltas.push({kind:"section-style",section,field:"headingColor",before:a??null,after:b??null});
   }else deltas.push(...styleDeltas(old,next,"",section));
   continue;
  }
  const old=oldMap.get(id),next=nextMap.get(id);
  if(old&&!next){deltas.push({kind:"block-removed",blockId:id,section:old.section||"",blockType:old.type});continue;}
  if(!old&&next){deltas.push({kind:"block-added",blockId:id,section:next.section||"",blockType:next.type});continue;}
  if(old&&next){
   if(!comparable(old,next))addBlockFields(deltas,id,old,next);
   else{
    const from=before.blocks.findIndex(b=>b.id===id),to=after.blocks.findIndex(b=>b.id===id);
    if(from!==to)deltas.push({kind:"block-moved",blockId:id,section:next.section||"",blockType:next.type,fromIndex:from,toIndex:to});
   }
  }
 }
 const oldEvents=Array.isArray(before.universalSectionEvents)?before.universalSectionEvents:[];
 const nextEvents=Array.isArray(after.universalSectionEvents)?after.universalSectionEvents:[];
 for(const e of nextEvents.slice(oldEvents.length)){
  deltas.push({kind:"section-event",section:String(e.section.id||"").slice(0,100),field:e.action,
   reason:(e.after?.id?"after:"+e.after.id:"")+(e.before?.id?"before:"+e.before.id:"")});
 }
 if(deltas.length===0||deltas.length>50)return null;
 const memory:EditorSolutionMemory={
  schemaVersion:2,verification,
  context:{niche:sanitizeContext(context.niche),model:sanitizeContext(context.model),
   family:sanitizeContext(context.family),template:sanitizeContext(context.template)},
  changedIds:[...new Set(changedIds)].map(x=>String(x).slice(0,128)),
  deltas
 };
 return JSON.stringify(memory).length<=18000?memory:null;
}

/** The memory is not an approved solution until the linked event is explicitly approved. */
export function memoryCanGuideExecution(row:{review_status:string;execution_status:string;verification?:string|null}):boolean{
 return row.review_status==="approved"&&row.execution_status==="applied"&&
  ["model","visual"].includes(row.verification||"");
}
