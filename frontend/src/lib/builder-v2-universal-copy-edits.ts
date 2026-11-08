/**
 * Universal text-target contract. Decides WHAT to edit before any media, CTA
 * link or banner shortcut. This file deliberately contains no niche/model IDs.
 */
import {resolveUniversalSection} from "./builder-v2-universal-targets.ts";
import {declaredVirtualTextSlot} from "./builder-v2-universal-visible-slots.ts";
import {applyUniversalOperations,type UniversalSite,type UniversalResult} from "./builder-v2-universal-operations.ts";

export type UniversalCopyIntent={
  targetId:string;section:string;type:"paragraph"|"button";ordinal:number;
  previousText:string;newText?:string;generateText:boolean;rewriteGuidance?:string;virtualSlotKey?:string;
};
export type UniversalCopyResolution={intent:UniversalCopyIntent}|{error:string}|null;
const clean=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const ordinal=(raw:string):number|null=>{
 const s=clean(raw).replace(/^(\d{1,2})[ºª°o]$/,"$1");
 if(/^\d{1,2}$/.test(s)){const n=Number(s)-1;return n>=0&&n<20?n:null;}
 const n=({primeiro:0,primeira:0,segundo:1,segunda:1,terceiro:2,terceira:2,quarto:3,quarta:3,quinto:4,quinta:4} as Record<string,number>)[s];
 return Number.isInteger(n)?n:null;
};
const stripped=(s:string)=>s.trim()
 .replace(/\.\s*(?:n[aã]o\s+(?:modifique|altere|mude|troque|mex[aă]|substitua)|preserve|mantenha|sem\s+alterar)\b[\s\S]*$/i,"")
 .replace(/\.\s*$/,"").trim();
const quoted=(s:string)=>s.match(/^(?:["“‘'])([^"”’']{1,12000})(?:["”’'])$/s)?.[1]||null;
const firstSection=(site:UniversalSite)=>{
 const resolved=resolveUniversalSection(site,"capa");
 if(resolved)return resolved;
 const first=site.blocks.find(b=>b.type==="heading"&&!!b.section)?.section;
 return first||null;
};
function byIndex(site:UniversalSite,section:string,type:"paragraph"|"button",index:number):UniversalCopyResolution{
 const blocks=site.blocks.filter(b=>b.section===section&&b.type===type);
 const block=blocks[index];
 if(!block){
  const declared=declaredVirtualTextSlot(site,section,type,index);
  if(!declared)return {error:"O elemento solicitado não possui um bloco editável correspondente. Nenhuma alteração aplicada."};
  return {intent:{targetId:"virtual-copy:"+declared.key,section,type,ordinal:index,
    previousText:declared.defaultText,virtualSlotKey:declared.key,generateText:false}};
 }
 return {intent:{targetId:block.id,section,type,ordinal:index,previousText:String(block.text||""),generateText:false}};
}
export function parseUniversalCopyEdit(site:UniversalSite,raw:string):UniversalCopyResolution{
 if(!site||!Array.isArray(site.blocks)||!raw.trim())return null;
 const text=stripped(raw);
 // The first section's subtitle is the hero's FIRST paragraph, not a photo or heading.
 const subtitle=text.match(/^(?:altere|troque|mude|substitua|defina)\s+(?:somente\s+|apenas\s+)?(?:o\s+)?subt[ií]tulo\s+(?:da\s+primeira\s+se[cç][aã]o|da\s+capa|do\s+hero|principal)\s+(?:para|por|como)\s+(.+)$/is);
 if(subtitle){
  const value=quoted(subtitle[1].trim());
  if(value===null)return {error:"Informe o novo subtítulo entre aspas. Nenhuma alteração aplicada."};
  const section=firstSection(site);
  if(!section)return {error:"A primeira seção não foi identificada. Nenhuma alteração aplicada."};
  const result=byIndex(site,section,"paragraph",0);
  return result&&"intent" in result?{intent:{...result.intent,newText:value}}:result;
 }
 // A new LABEL must never require a new URL. The existing button href is preserved.
 const cta=text.match(/^(?:altere|troque|mude|substitua|defina)\s+(?:somente\s+|apenas\s+)?(?:o\s+)?texto\s+do\s+bot[aã]o\s+principal\s+(?:da\s+capa|do\s+hero|da\s+primeira\s+se[cç][aã]o)\s+(?:para|por|como)\s+(.+)$/is);
 if(cta){
  const value=quoted(cta[1].trim());
  if(value===null)return {error:"Informe o novo texto do botão entre aspas. Nenhuma alteração aplicada."};
  const section=firstSection(site);
  if(!section)return {error:"A capa não foi identificada. Nenhuma alteração aplicada."};
  const buttons=site.blocks.filter(b=>b.section===section&&b.type==="button");
  const primary=buttons.filter(b=>["primary","principal","main"].includes(clean(String(b.role||b.variant||b.ctaRole||""))));
  const selected=primary.length===1?primary[0]:buttons[0];
  if(!selected)return {error:"O botão principal não possui um bloco editável identificável. Nenhuma alteração aplicada."};
  return {intent:{targetId:selected.id,section,type:"button",ordinal:buttons.indexOf(selected),previousText:String(selected.text||""),newText:value,generateText:false}};
 }
 // "Na seção Sobre a clínica, reescreva o segundo parágrafo..." supports any
 // named section. Semantic rewriting is scoped to this single stable ID.
 const rewrite=text.match(/^na\s+se[cç][aã]o\s+(.{1,130}?),\s*(?:reescreva|reformule|melhore|atualize|refa[cç]a)\s+(?:somente\s+|apenas\s+)?(?:o\s+)?(primeiro|segundo|terceiro|quarto|quinto|\d{1,2}[ºª°o]?)\s+par[aá]grafo\s+(?:com\s+)?(.+)$/is);
 if(rewrite){
  const section=resolveUniversalSection(site,rewrite[1].trim());
  if(!section)return {error:"A seção '"+rewrite[1].trim()+"' não foi identificada de forma única. Nenhuma alteração aplicada."};
  const index=ordinal(rewrite[2]);
  if(index===null)return {error:"A posição do parágrafo não foi reconhecida. Nenhuma alteração aplicada."};
  const result=byIndex(site,section,"paragraph",index);
  if(!result||"error" in result)return result;
  return {intent:{...result.intent,generateText:true,rewriteGuidance:rewrite[3].trim()}};
 }
 return null;
}
export function applyUniversalCopyEdit<T extends UniversalSite>(
 site:T,intent:UniversalCopyIntent,generated?:string
):UniversalResult<T>{
 const value=(intent.generateText?generated:intent.newText)?.trim();
 if(!value||value===intent.previousText.trim())return {ok:false,error:"O novo texto não foi produzido ou não altera o conteúdo. Nenhuma alteração aplicada."};
 if(intent.virtualSlotKey){
  const declaration=declaredVirtualTextSlot(site,intent.section,intent.type,intent.ordinal);
  if(!declaration||declaration.key!==intent.virtualSlotKey)
   return {ok:false,error:"Esse slot não está disponível no modelo atual. Nenhuma alteração aplicada."};
  const existing=site.universalCopyOverrides&&typeof site.universalCopyOverrides==="object"&&!Array.isArray(site.universalCopyOverrides)
   ?site.universalCopyOverrides as Record<string,string>:{};
  return {ok:true,changedIds:[intent.targetId],
   site:{...site,universalCopyOverrides:{...existing,[declaration.key]:value}} as T};
 }
 const block=site.blocks.find(b=>b.id===intent.targetId&&b.section===intent.section&&b.type===intent.type);
 if(!block)return {ok:false,error:"O elemento original mudou. Nenhuma alteração aplicada."};
 const result=applyUniversalOperations(site,[{action:"update",blockId:block.id,changes:{text:value}}]);
 if(!result.ok)return result;
 return {ok:true,changedIds:result.changedIds,site:{...result.site,blocks:result.site.blocks.map(b=>b.id===block.id?{...b,textExplicit:true}:b)} as T};
}
/** Read explicit text only; approved model defaults win when there is no edit. */
export function universalEditedTextSlot(
 site:{blocks:readonly {id:string;type:string;section?:string;text?:string}[]},
 sectionLabel:string,type:"heading"|"paragraph"|"button",index=0
):string|null{
 const source=site as unknown as UniversalSite;
 const section=resolveUniversalSection(source,sectionLabel);
 if(!section)return null;
 const declared=declaredVirtualTextSlot(source,section,type,index);
 if(declared){
  const overrides=source.universalCopyOverrides;
  if(overrides&&typeof overrides==="object"&&!Array.isArray(overrides)){
   const explicit=(overrides as Record<string,unknown>)[declared.key];
   if(typeof explicit==="string")return explicit;
  }
 }
 const block=source.blocks.filter(b=>b.section===section&&b.type===type)[index];
 return block?.textExplicit===true&&typeof block.text==="string"?block.text:null;
}
/** Reject unrelated mutations before saving a server-generated text rewrite. */
export function isIsolatedUniversalCopyResult(previous:UniversalSite,next:UniversalSite,intent:UniversalCopyIntent):boolean{
 if(!next||!Array.isArray(next.blocks)||next.blocks.length!==previous.blocks.length)return false;
 const {blocks:_p,...before}=previous,{blocks:_n,...after}=next;
 if(intent.virtualSlotKey){
  if(JSON.stringify(previous.blocks)!==JSON.stringify(next.blocks))return false;
  const {universalCopyOverrides:_pCopy,...oldMetadata}=before;
  const {universalCopyOverrides:_nCopy,...newMetadata}=after;
  if(JSON.stringify(oldMetadata)!==JSON.stringify(newMetadata))return false;
  const oldOverrides=(_pCopy&&typeof _pCopy==="object"&&!Array.isArray(_pCopy))?_pCopy as Record<string,unknown>:{};
  const newOverrides=(_nCopy&&typeof _nCopy==="object"&&!Array.isArray(_nCopy))?_nCopy as Record<string,unknown>:{};
  const expected={...oldOverrides,[intent.virtualSlotKey]:newOverrides[intent.virtualSlotKey]};
  return typeof newOverrides[intent.virtualSlotKey]==="string"&&
   newOverrides[intent.virtualSlotKey]!==oldOverrides[intent.virtualSlotKey]&&
   JSON.stringify(expected)===JSON.stringify(newOverrides);
 }
 if(JSON.stringify(before)!==JSON.stringify(after))return false;
 let changed=0;
 for(let i=0;i<previous.blocks.length;i++){
  const prior=previous.blocks[i],candidate=next.blocks[i];
  if(!candidate||prior.id!==candidate.id)return false;
  if(prior.id!==intent.targetId){if(JSON.stringify(prior)!==JSON.stringify(candidate))return false;continue;}
  const {text:_old,...priorRest}=prior,{text:_new,textExplicit:_explicit,...candidateRest}=candidate;
  const {textExplicit:_priorExplicit,...stablePrior}=priorRest;
  if(JSON.stringify(stablePrior)!==JSON.stringify(candidateRest)||candidate.textExplicit!==true||typeof candidate.text!=="string"||candidate.text===prior.text)return false;
  changed++;
 }
 return changed===1;
}
