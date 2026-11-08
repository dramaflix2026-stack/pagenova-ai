/**
 * Template-agnostic card target resolution for Builder V2.
 * A user refers to a section + card ordinal, never to a TP or template index.
 * Existing stable block IDs remain the only mutation targets.
 */
import {resolveUniversalSection} from "./builder-v2-universal-targets.ts";
import {applyUniversalOperations,type UniversalSite,type UniversalResult,type UniversalOperation,type UniversalBlock} from "./builder-v2-universal-operations.ts";

const ORDINALS:Record<string,number>={
 primeiro:0,primeira:0,segundo:1,segunda:1,terceiro:2,terceira:2,quarto:3,quarta:3,
 quinto:4,quinta:4,sexto:5,sexta:5,setimo:6,setima:6,oitavo:7,oitava:7,
 nono:8,nona:8,decimo:9,decima:9,
};
const clean=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const parseCard=(value:string):{title:string;description:string;separator:string}|null=>{
 const m=value.match(/^\s*([^:：—–\n]{2,100}?)(:\s+|\s+[—–]\s+)([\s\S]+)$/);
 return m&&m[1].trim()&&m[3].trim()?{title:m[1].trim(),description:m[3].trim(),separator:m[2]}:null;
};
export type UniversalCardTarget={
 section:string;ordinal:number;titleId:string;descriptionId:string;format:"combined"|"split";
 originalTitle:string;originalDescription:string;separator:string;
};
export type UniversalCardEdit={
 target:UniversalCardTarget;newTitle:string;newDescription?:string;
 generateDescription:boolean;
};
export type UniversalCardResolution={intent:UniversalCardEdit}|{error:string}|null;
export function resolveUniversalCardTarget(site:UniversalSite,section:string,ordinal:number):UniversalCardTarget|null{
 if(!Number.isInteger(ordinal)||ordinal<0)return null;
 const sectionBlocks=site.blocks.filter(b=>b.section===section);
 const headings=sectionBlocks.filter(b=>b.type==="heading");
 const paragraphs=sectionBlocks.filter(b=>b.type==="paragraph");
 // Card rows with title and description in the same persisted block.
 const formatted=paragraphs.map(block=>({block,data:parseCard(String(block.text||""))})).filter((item):item is {block:UniversalBlock;data:NonNullable<ReturnType<typeof parseCard>>}=>!!item.data);
 const realCards=formatted.filter(item=>item.block.layout==="grid"||item.block.layout==="cards"||/^(?:card|service|produto|item)[-_]/i.test(item.block.id));
 const combined=realCards.length>ordinal?realCards[ordinal]:(headings.length<=1&&formatted.length>ordinal?formatted[ordinal]:undefined);
 let target:UniversalCardTarget|undefined;
 if(combined){
  target={section,ordinal,titleId:combined.block.id,descriptionId:combined.block.id,format:"combined",
    originalTitle:combined.data.title,originalDescription:combined.data.description,separator:combined.data.separator};
 }else{
  const cardHeadings=headings.slice(1);
  const introOffset=paragraphs.length>cardHeadings.length?1:0;
  const heading=cardHeadings[ordinal],paragraph=paragraphs[ordinal+introOffset];
  if(heading&&paragraph)target={section,ordinal,titleId:heading.id,descriptionId:paragraph.id,format:"split",
   originalTitle:String(heading.text||""),originalDescription:String(paragraph.text||""),separator:""};
 }
 return target??null;
}
/** Shared explicit copy; the approved original design is unchanged until edited. */
export function universalEditedCardCopy(site:UniversalSite,sectionLabel:string,ordinal:number):{title?:string;description?:string}|null{
 const section=resolveUniversalSection(site,sectionLabel);
 if(!section)return null;
 const target=resolveUniversalCardTarget(site,section,ordinal);
 if(!target)return null;
 const title=site.blocks.find(b=>b.id===target.titleId);
 const description=site.blocks.find(b=>b.id===target.descriptionId);
 if(target.format==="combined"){
  if(title?.textExplicit!==true)return null;
  const parsed=parseCard(String(title.text||""));
  return parsed?{title:parsed.title,description:parsed.description}:null;
 }
 const result={
  ...(title?.textExplicit===true?{title:String(title.text||"")}:{}),
  ...(description?.textExplicit===true?{description:String(description.text||"")}:{})
 };
 return Object.keys(result).length?result:null;
}
export function parseUniversalCardEdit(site:UniversalSite,instruction:string):UniversalCardResolution{
 const raw=instruction.trim().replace(/\.\s*(?:n[aã]o\s+altere|preserve|mantenha)\b[\s\S]*$/i,"").trim().replace(/\.\s*$/,"");
 const m=raw.match(/^no\s+(primeiro|primeira|segundo|segunda|terceiro|terceira|quarto|quarta|quinto|quinta|sexto|sexta|s[eé]timo|s[eé]tima|oitavo|oitava|nono|nona|d[eé]cimo|d[eé]cima|\d{1,2}(?:[º°ªo])?)\s+card\s+d[ae]\s+se[cç][aã]o\s+(.{1,130}?),\s*(.+)$/is);
 if(!m)return null;
 const ordinalText=clean(m[1]).replace(/^(\d{1,2})[º°ªo]$/,"$1");
 const ordinal=/^\d{1,2}$/.test(ordinalText)?Number(ordinalText)-1:ORDINALS[ordinalText];
 if(!Number.isInteger(ordinal)||ordinal<0||ordinal>19)return {error:"Número do card fora do intervalo. Nenhuma alteração aplicada."};
 const section=resolveUniversalSection(site,m[2].trim().replace(/^["“']|["”']$/g,""));
 if(!section)return {error:"Seção '"+m[2].trim()+"' não encontrada ou ambígua. Nenhuma alteração aplicada."};
 const command=m[3].trim();
 const title=command.match(/^(?:altere|troque|mude|substitua|defina)\s+(?:somente\s+)?(?:o\s+)?t[ií]tulo\s+(?:para|por|como)\s+["“']([^"”']{1,300})["”'](?:\s+e\s+(.+))?$/is);
 if(!title)return {error:"Informe o novo título do card entre aspas e, se desejar, a descrição. Nenhuma alteração aplicada."};
 const tail=title[2]?.trim();
 const description=tail?.match(/^(?:atualize|reescreva|melhore|altere|troque|mude|substitua)\s+(?:a\s+)?descri[cç][aã]o(?:\s+(?:para|por|como)\s+["“']([^"”']{1,1200})["”'])?$/is);
 if(tail&&!description)return {error:"A instrução sobre a descrição não está clara. Nenhuma alteração aplicada."};
 const target=resolveUniversalCardTarget(site,section,ordinal);
 if(!target)return {error:"O card "+(ordinal+1)+" não tem título e descrição editáveis identificados nessa seção. Nenhuma alteração aplicada."};
 return {intent:{target,newTitle:title[1].trim(),...(description?.[1]?{newDescription:description[1].trim()}:{}),
   generateDescription:!!description&&!description[1]}};
}
/** Always apply both fields as one transaction, including one-block card copy. */
export function applyUniversalCardEdit<T extends UniversalSite>(
 site:T,intent:UniversalCardEdit,generatedDescription?:string
):UniversalResult<T>{
 const {target,newTitle}=intent;
 const description=intent.newDescription??generatedDescription;
 if(intent.generateDescription&&(!description||!description.trim()))return {ok:false,error:"A nova descrição não foi produzida. Nenhuma alteração aplicada."};
 if(!site.blocks.some(b=>b.id===target.titleId&&b.section===target.section))return {ok:false,error:"Card original não encontrado. Nenhuma alteração aplicada."};
 const ops:UniversalOperation[]=[];
 if(target.format==="combined"){
  const block=site.blocks.find(b=>b.id===target.titleId);
  const original=block?parseCard(String(block.text||"")):null;
  if(!original)return {ok:false,error:"Formato do card foi alterado. Nenhuma alteração aplicada."};
  const next=newTitle+original.separator+(description??original.description);
  if(next!==block?.text)ops.push({action:"update",blockId:target.titleId,changes:{text:next}});
 }else{
  if(!site.blocks.some(b=>b.id===target.descriptionId&&b.section===target.section))return {ok:false,error:"Descrição original não encontrada. Nenhuma alteração aplicada."};
  if(target.originalTitle!==newTitle)ops.push({action:"update",blockId:target.titleId,changes:{text:newTitle}});
  if(description!==undefined&&description!==target.originalDescription)ops.push({action:"update",blockId:target.descriptionId,changes:{text:description}});
 }
 if(!ops.length)return {ok:false,error:"Nenhum conteúdo foi alterado. O site foi preservado."};
 const applied=applyUniversalOperations(site,ops);
 if(!applied.ok)return applied;
 const ids=new Set(applied.changedIds);
 return {ok:true,changedIds:applied.changedIds,
  site:{...applied.site,blocks:applied.site.blocks.map(block=>ids.has(block.id)?{...block,textExplicit:true}:block)} as T};

}
