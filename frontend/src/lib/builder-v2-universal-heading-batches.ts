/**
 * Atomic contextual multi-section heading edits. Every requested target is
 * validated before applying any mutation. This parser is niche-independent.
 */
import {resolveUniversalSection} from "./builder-v2-universal-targets.ts";
import {applyUniversalOperations,type UniversalSite,type UniversalResult,type UniversalOperation} from "./builder-v2-universal-operations.ts";
import {declaredVirtualTextSlot} from "./builder-v2-universal-visible-slots.ts";

type HeadingRequest={sectionLabel:string;newText:string};
type HeadingTarget={section:string;blockId?:string;overrideKey?:string;newText:string};
const norm=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();

function splitContextualSentences(instruction:string):string[]{
 const result:string[]=[];let quote="";let start=0;
 for(let i=0;i<instruction.length;i++){
  const char=instruction[i];
  if(quote){if(char===quote||(quote==="“"&&char==="”")||(quote==="‘"&&char==="’"))quote="";continue;}
  if(char==='"'||char==="“"||char==="‘"||(char==="'"&&!/\p{L}/u.test(instruction[i-1]||" "))){quote=char;continue;}
  if(!/[.!?]/.test(char))continue;
  const next=instruction.slice(i+1);
  if(!/^\s+(?:(?:na\s+(?:capa|primeira\s+se[cç][aã]o|se[cç][aã]o))|(?:preserve|mantenha|n[aã]o\s+altere|sem\s+alterar))\b/i.test(next))continue;
  result.push(instruction.slice(start,i+1).trim());
  const space=next.match(/^\s*/)?.[0].length||0;
  i+=space;start=i+1;
 }
 result.push(instruction.slice(start).trim());
 return result.filter(Boolean);
}
const stripEnd=(text:string)=>text.trim().replace(/[.!?]\s*$/,"").trim();
function parseOne(sentence:string):HeadingRequest|null{
 const clean=stripEnd(sentence);
 const quoted='["“]([^"”]{1,300})["”]';
 const hero=new RegExp("^na\\s+(?:capa|primeira\\s+se[cç][aã]o)\\s*,\\s*(?:altere|troque|mude|substitua|defina)\\s+(?:somente\\s+|apenas\\s+)?(?:o\\s+)?t[ií]tulo\\s+principal\\s+(?:para|por|como)\\s+"+quoted+"$","i").exec(clean);
 if(hero)return {sectionLabel:"capa",newText:hero[1]};
 const section=new RegExp("^na\\s+se[cç][aã]o\\s+([^,]{1,120})\\s*,\\s*(?:altere|troque|mude|substitua|defina)\\s+(?:somente\\s+|apenas\\s+)?(?:o\\s+)?t[ií]tulo\\s+(?:principal\\s+)?(?:para|por|como)\\s+"+quoted+"$","i").exec(clean);
 return section?{sectionLabel:section[1].trim(),newText:section[2]}:null;
}
const preserveOnly=(sentence:string)=>/^(?:preserve|mantenha|n[aã]o\s+altere|sem\s+alterar)\b/i.test(stripEnd(sentence));

/** Returns null for unrelated/single requests, or an atomic success/failure. */
export function applyUniversalHeadingBatch<T extends UniversalSite>(site:T,instruction:string):UniversalResult<T>|null{
 const sentences=splitContextualSentences(instruction);
 const actionable=sentences.filter(sentence=>!preserveOnly(sentence));
 if(actionable.length<2)return null;
 if(!actionable.some(sentence=>/^\s*na\s+(?:capa|primeira\s+se[cç][aã]o|se[cç][aã]o)\s*[, ]/i.test(sentence)))return null;
 if(actionable.length>20)return {ok:false,error:"Limite de 20 edições por mensagem. Nenhuma alteração aplicada."};
 const requests:HeadingRequest[]=[];
 for(const sentence of actionable){
  const parsed=parseOne(sentence);
  if(!parsed)return {ok:false,error:"Não foi possível interpretar todas as alterações de título: “"+sentence+"”. Nenhuma alteração aplicada."};
  requests.push(parsed);
 }
 if(!site?.blocks?.length)return {ok:false,error:"Este projeto não tem blocos editáveis. Nenhuma alteração aplicada."};
 const targets:HeadingTarget[]=[];
 const uniqueSections=new Set<string>();
 for(const request of requests){
  const section=resolveUniversalSection(site,request.sectionLabel);
  if(!section)return {ok:false,error:"Seção “"+request.sectionLabel+"” não encontrada de forma única. Nenhuma alteração aplicada."};
  if(uniqueSections.has(section))return {ok:false,error:"A seção “"+request.sectionLabel+"” foi solicitada mais de uma vez. Nenhuma alteração aplicada."};
  uniqueSections.add(section);
  const headings=site.blocks.filter(block=>block.section===section&&block.type==="heading");
  if(headings.length>1)return {ok:false,error:"Há mais de um título possível na seção “"+request.sectionLabel+"”. Nenhuma alteração aplicada."};
  const heading=headings[0];
  if(heading){
   if(typeof heading.text!=="string"||norm(heading.text)===norm(request.newText))
    return {ok:false,error:"O título solicitado já existe ou não é editável em “"+request.sectionLabel+"”. Nenhuma alteração aplicada."};
   targets.push({section,blockId:heading.id,newText:request.newText});
  }else{
   const declared=declaredVirtualTextSlot(site,section,"heading",0);
   if(!declared)return {ok:false,error:"O título da seção “"+request.sectionLabel+"” não está mapeado ao renderizador. Nenhuma alteração aplicada."};
   targets.push({section,overrideKey:declared.key,newText:request.newText});
  }
 }
 const operations:UniversalOperation[]=targets.filter(t=>t.blockId).map(t=>({action:"update",blockId:t.blockId!,changes:{text:t.newText}}));
 const result=operations.length?applyUniversalOperations(site,operations):{ok:true,site:T,changedIds:string[]};
 if(!result.ok)return result;
 const updatedBlocks=result.site.blocks.map(block=>targets.some(t=>t.blockId===block.id)?{...block,textExplicit:true}:block);
 const source=site.universalCopyOverrides;
 const originalOverrides=source&&typeof source==="object"&&!Array.isArray(source)?source as Record<string,unknown>:{};
 const overrides={...originalOverrides};
 for(const target of targets)if(target.overrideKey)overrides[target.overrideKey]=target.newText;
 const updatedSite={...result.site,blocks:updatedBlocks,...(targets.some(t=>t.overrideKey)?{universalCopyOverrides:overrides}:{})} as T;
 return {ok:true,site:updatedSite,changedIds:targets.map(t=>t.blockId||"virtual-copy:"+t.overrideKey)};
}
