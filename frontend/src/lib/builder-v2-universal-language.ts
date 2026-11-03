import {universalInstructionClauses} from "./builder-v2-universal-plan.ts";
import {applyUniversalNamedLanguage,resolveUniversalSection} from "./builder-v2-universal-targets.ts";
export {universalInstructionClauses as splitUniversalInstructions} from "./builder-v2-universal-plan.ts";
import {applyUniversalOperations,type UniversalSite,type UniversalOperation,type UniversalResult} from "./builder-v2-universal-operations.ts";

/** Conservative natural-language adapter: ambiguous requests stay in the legacy AI path. */
function applySingleUniversalNaturalLanguage<T extends UniversalSite>(site:T,instruction:string):UniversalResult<T>|null{
 const normalized=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
 const text=instruction.trim();
 const q=[...text.matchAll(/["“”']([^"“”'\n]+)["“”']/g)].map(m=>m[1].trim());
 const match=text.match(/^(?:altere|troque|mude|substitua)\s+(?:o\s+)?(?:texto\s+(?:do|da)\s+)?(?:bloco|elemento)\s+(?:com\s+)?(?:id\s+)?["“”']?([a-zA-Z0-9_-]+)["“”']?\s+(?:para|por)\s+["“”']([^"“”']+)["“”']\s*\.?$/i);
 if(match){
  const id=match[1],value=match[2];
  if(!site.blocks.some(b=>b.id===id))return {ok:false,error:"Bloco indicado não encontrado."};
  return applyUniversalOperations(site,[{action:"update",blockId:id,changes:{text:value}}]);
 }
 // A quoted current label must identify exactly one block. No guessing by position.
 const quotedMatch=text.match(/^(?:altere|troque|mude|substitua)\s+(?:o\s+)?texto\s+["“”']([^"“”']+)["“”']\s+(?:para|por)\s+["“”']([^"“”']+)["“”']\s*\.?$/i);
 if(quotedMatch){
  const candidates=site.blocks.filter(b=>normalized(String(b.text||""))===normalized(quotedMatch[1]));
  if(candidates.length!==1)return {ok:false,error:"O texto indicado não identifica um único bloco. Nenhuma alteração aplicada."};
  return applyUniversalOperations(site,[{action:"update",blockId:candidates[0].id,changes:{text:quotedMatch[2]}}]);
 }
 const remove=text.match(/^(?:remova|exclua|apague)\s+(?:o\s+)?(?:bloco|elemento)\s+(?:com\s+)?id\s+["“”']?([a-zA-Z0-9_-]+)["“”']?\s*\.?$/i);
 if(remove)return applyUniversalOperations(site,[{action:"remove",blockId:remove[1]}]);
 const removeSection=text.match(/^(?:remova|exclua|apague)\s+(?:a\s+)?se[cç][aã]o\s+(?:com\s+)?id\s+["“”']?([a-zA-Z0-9_-]+)["“”']?\s*\.?$/i);
 if(removeSection)return applyUniversalOperations(site,[{action:"remove-section",sectionId:removeSection[1]}]);
 const moveSection=text.match(/^(?:mova|mover|reposicione)\s+(?:a\s+)?se[cç][aã]o\s+(?:com\s+)?id\s+["“”']?([a-zA-Z0-9_-]+)["“”']?\s+(?:para\s+)?(?:depois|ap[oó]s)\s+(?:da\s+)?se[cç][aã]o\s+(?:com\s+)?id\s+["“”']?([a-zA-Z0-9_-]+)["“”']?\s*\.?$/i);
 if(moveSection)return applyUniversalOperations(site,[{action:"move-section",sectionId:moveSection[1],afterSectionId:moveSection[2]}]);
 const resolveSection=(label:string):{id:string}|{error:string}=>{const id=resolveUniversalSection(site,label);return id?{id}:{error:"Seção não encontrada ou ambígua. Nenhuma alteração aplicada."};};
 const namedRemove=text.match(/^(?:remova|exclua|apague)\s+(?:a\s+)?se[cç][aã]o\s+["“”']?([^"“”'\n]+?)["“”']?\s*\.?$/i);
 if(namedRemove&&!/^id\s+/i.test(namedRemove[1])){
  const section=resolveSection(namedRemove[1]);
  if("error" in section)return {ok:false,error:section.error};
  return applyUniversalOperations(site,[{action:"remove-section",sectionId:section.id}]);
 }
 const namedMove=text.match(/^(?:mova|reposicione|coloque)\s+(?:a\s+)?se[cç][aã]o\s+["“”']?([^"“”'\n]+?)["“”']?\s+(?:para\s+)?(?:depois|ap[oó]s)\s+(?:da\s+)?se[cç][aã]o\s+["“”']?([^"“”'\n]+?)["“”']?\s*\.?$/i);
 if(namedMove&&!/^id\s+/i.test(namedMove[1])){
  const source=resolveSection(namedMove[1]),destination=resolveSection(namedMove[2]);
  if("error" in source)return {ok:false,error:source.error};
  if("error" in destination)return {ok:false,error:destination.error};
  return applyUniversalOperations(site,[{action:"move-section",sectionId:source.id,afterSectionId:destination.id}]);
 }
 // Recognized image edits must not bypass validation by falling into a legacy handler.
 const imageIntent=text.match(/^(?:altere|troque|mude|substitua)\s+(?:a\s+)?imagem\s+(?:do\s+)?(?:bloco\s+)?id\s+["“”']?([a-zA-Z0-9_-]+)["“”']?\s+(?:para|por)\s+(.+)$/i);
 if(imageIntent&&!/^(?:https:\/\/[^\s"'“”]+|\/[^\s"'“”]+)["“”']?\s*$/.test(imageIntent[2].trim().replace(/^["“”']|["“”']$/g,"")))return {ok:false,error:"Endereço de imagem inválido ou inseguro. Nenhuma alteração aplicada."};
 const image=text.match(/^(?:altere|troque|mude|substitua)\s+(?:a\s+)?imagem\s+(?:do\s+)?(?:bloco\s+)?id\s+["“”']?([a-zA-Z0-9_-]+)["“”']?\s+(?:para|por)\s+["“”']?(https:\/\/[^\s"“”']+|\/[^\s"“”']+)["“”']?\s*$/i);
 if(image){
  const block=site.blocks.find(b=>b.id===image[1]);
  if(!block||block.type!=="image")return {ok:false,error:"Imagem indicada não encontrada. Nenhuma alteração aplicada."};
  return applyUniversalOperations(site,[{action:"update",blockId:block.id,changes:{src:image[2]}}]);
 }
 const style=text.match(/^(?:altere|troque|mude|configure|defina)\s+(?:(?:a|o)\s+)?(?:cor|alinhamento)\s+(?:do\s+)?(?:bloco\s+)?id\s+["“”']?([a-zA-Z0-9_-]+)["“”']?\s+(?:para|como)\s+["“”']?([^"“”'\n]+?)["“”']?\s*$/i);
 if(style){
  const property=/\b(?:cor)\b/i.test(text.slice(0,text.indexOf("id")) )?"color":"align";
  const value=style[2].trim();
  if(!site.blocks.some(b=>b.id===style[1]))return {ok:false,error:"Bloco indicado não encontrado. Nenhuma alteração aplicada."};
  if(property==="color"&&!/^#[0-9a-f]{3,8}$/i.test(value))return {ok:false,error:"Use uma cor hexadecimal válida, como #000000."};
  const align=normalized(value);
  if(property==="align"&&!["left","center","right","esquerda","centro","direita"].includes(align))return {ok:false,error:"Alinhamento não reconhecido."};
  const result=property==="color"?{color:value}:{align:({esquerda:"left",centro:"center",direita:"right"} as Record<string,string>)[align]||align};
  return applyUniversalOperations(site,[{action:"update",blockId:style[1],changes:result}]);
 }
 const blockLink=text.match(/^(?:altere|troque|mude|configure)\s+(?:o\s+)?link\s+(?:do\s+)?(?:bot[aã]o\s+)?(?:bloco\s+)?id\s+["“”']?([a-zA-Z0-9_-]+)["“”']?\s+(?:para|por)\s+["“”']?([^\s"“”']+)["“”']?\s*$/i);
 if(blockLink){
  const block=site.blocks.find(b=>b.id===blockLink[1]);
  if(!block||block.type!=="button")return {ok:false,error:"Botão indicado não encontrado. Nenhuma alteração aplicada."};
  return applyUniversalOperations(site,[{action:"update",blockId:block.id,changes:{href:blockLink[2]}}]);
 }
 const fontSize=text.match(/^(?:altere|troque|mude|configure|defina)\s+(?:o\s+)?tamanho\s+(?:da\s+)?fonte\s+(?:do\s+)?(?:bloco\s+)?id\s+["“”']?([a-zA-Z0-9_-]+)["“”']?\s+(?:para|como)\s+(\d{1,3})(?:px)?\s*$/i);
 if(fontSize){
  if(!site.blocks.some(b=>b.id===fontSize[1]))return {ok:false,error:"Bloco indicado não encontrado. Nenhuma alteração aplicada."};
  return applyUniversalOperations(site,[{action:"update",blockId:fontSize[1],changes:{fontSize:Number(fontSize[2])}}]);
 }
 const buttonLabel=text.match(/^(?:altere|troque|mude|substitua)\s+(?:o\s+)?texto\s+(?:do\s+)?bot[aã]o\s+["“”']([^"“”']+)["“”']\s+(?:para|por)\s+["“”']([^"“”']+)["“”']\s*\.?$/i);
 if(buttonLabel){
  const candidates=site.blocks.filter(b=>b.type==="button"&&normalized(String(b.text||""))===normalized(buttonLabel[1]));
  if(candidates.length!==1)return {ok:false,error:"Botão não identificado de forma única. Nenhuma alteração aplicada."};
  return applyUniversalOperations(site,[{action:"update",blockId:candidates[0].id,changes:{text:buttonLabel[2]}}]);
 }
 // Explicit link edits are validated here; unsupported schemes must never reach legacy processing.
 const linkIntent=text.match(/^(?:altere|troque|mude|configure)\s+(?:o\s+)?link\s+(?:do\s+)?bot[aã]o\s+["“”']([^"“”']+)["“”']\s+(?:para|por)\s+(.+)$/i);
 if(linkIntent&&!/^(?:https:\/\/|mailto:|tel:|#|\/(?!\/))/i.test(linkIntent[2].replace(/^["“”']|["“”']$/g,"").trim()))return {ok:false,error:"Destino do botão inválido ou inseguro. Nenhuma alteração aplicada."};
 const link=text.match(/^(?:altere|troque|mude|configure)\s+(?:o\s+)?link\s+(?:do\s+)?bot[aã]o\s+["“”']([^"“”']+)["“”']\s+(?:para|por)\s+["“”']?(https?:\/\/[^\s"“”']+|mailto:[^\s"“”']+|tel:[^\s"“”']+|#[^\s"“”']+|\/[^\s"“”']+)["“”']?\s*$/i);
 if(link){
  const candidates=site.blocks.filter(b=>b.type==="button"&&normalized(String(b.text||""))===normalized(link[1]));
  if(candidates.length!==1)return {ok:false,error:"Botão não identificado de forma única. Nenhuma alteração aplicada."};
  return applyUniversalOperations(site,[{action:"update",blockId:candidates[0].id,changes:{href:link[2]}}]);
 }
 void q;
 return null;
}

/** All supported clauses commit together. Unsupported compound requests cannot hit partial legacy shortcuts. */
export function applyUniversalNaturalLanguage<T extends UniversalSite>(site:T,instruction:string):UniversalResult<T>|null{
 const actionableInstruction=instruction.replace(/^\s*quero\s+(?:fazer|realizar|pedir)\s+(?:algumas?\s+)?(?:altera[cç][oõ]es|mudan[cç]as|edi[cç][oõ]es)\s+(?:no|neste|nesse)\s+site[^\r\n]*[.:]?\s*/i,"").trim();
 const clauses=universalInstructionClauses(actionableInstruction)
  .map(clause=>clause.replace(/^\s*\d{1,2}[.)]\s*/,"").trim())
  .filter(clause=>!/^quero\s+(?:fazer|realizar|pedir)\s+(?:algumas?\s+)?(?:altera[cç][oõ]es|mudan[cç]as|edi[cç][oõ]es)\s+(?:no|neste|nesse)\s+site\b[^:]*:?\s*$/i.test(clause))
  .filter(clause=>! /^(?:preserve|mantenha)\s+(?:todas?\s+)?(?:as\s+)?(?:outras?\s+)?(?:informa[cç][oõ]es|se[cç][oõ]es|imagens|cores|anima[cç][oõ]es|design|restante|demais)\b/i.test(clause));
 if(clauses.length>20)return {ok:false,error:"Divida o pedido em até 20 alterações por mensagem. Nenhuma alteração aplicada."};
 let current=site;const changedIds:string[]=[];
 for(const clause of clauses){
  // ID and quoted-label commands remain backward compatible.
  const result=applySingleUniversalNaturalLanguage(current,clause)||applyUniversalNamedLanguage(current,clause);
  if(!result){
   if(clauses.length===1)return null;
   return {ok:false,error:"Não foi possível interpretar com segurança uma parte do pedido: “"+clause+"”. Nenhuma alteração aplicada. Detalhe o elemento, conteúdo ou destino desejado."};
  }
  if(!result.ok)return result;
  current=result.site;changedIds.push(...result.changedIds);
 }
 return changedIds.length?{ok:true,site:current,changedIds:[...new Set(changedIds)]}:null;
}
