import {universalInstructionClauses} from "./builder-v2-universal-plan.ts";
import {applyUniversalNamedLanguage,resolveUniversalSection} from "./builder-v2-universal-targets.ts";
import {parseUniversalCardEdit,applyUniversalCardEdit} from "./builder-v2-universal-card-edits.ts";
import {parseUniversalCopyEdit,applyUniversalCopyEdit} from "./builder-v2-universal-copy-edits.ts";
import {applyUniversalHeadingBatch} from "./builder-v2-universal-heading-batches.ts";
import {applyUniversalPracticalEdit} from "./builder-v2-universal-practical-edits.ts";
export {universalInstructionClauses as splitUniversalInstructions} from "./builder-v2-universal-plan.ts";
import {applyUniversalOperations,type UniversalSite,type UniversalOperation,type UniversalResult} from "./builder-v2-universal-operations.ts";

/** Conservative natural-language adapter: ambiguous requests stay in the legacy AI path. */
function applySingleUniversalNaturalLanguage<T extends UniversalSite>(site:T,instruction:string):UniversalResult<T>|null{
 // Exact quoted heading replacement scoped to a named section; never touch other copy.
 const scopedExactHeading=instruction.trim().match(/^na\s+se[cç][aã]o\s+(.+?),\s*(?:troque|altere|mude|substitua)\s+(?:somente\s+|apenas\s+)?(?:o\s+)?t[ií]tulo\s+[\"“]([^\"”]{1,300})[\"”]\s+(?:para|por)\s+[\"“]([^\"”]{1,300})[\"”](?:\s*[.!?,;:]?\s*(?:n[aã]o\s+altere|sem\s+alterar|preserve|mantenha)\b[\s\S]*)?\s*[.!?]?$/i);
 if(scopedExactHeading){
  const section=resolveUniversalSection(site,scopedExactHeading[1].trim());
  if(!section)return {ok:false,error:"A seção solicitada não foi identificada de forma única. Nenhuma alteração aplicada."};
  const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const original=normalize(scopedExactHeading[2]);
  const candidates=site.blocks.filter(b=>b.section===section&&b.type==="heading"&&normalize(String(b.text||""))===original);
  if(candidates.length!==1)return {ok:false,error:"O título original não foi localizado de forma única na seção. Nenhuma alteração aplicada."};
  const target=candidates[0],value=scopedExactHeading[3].trim();
  if(!value||normalize(value)===original)return {ok:false,error:"O título novo está vazio ou já corresponde ao original. Nenhuma alteração aplicada."};
  const result=applyUniversalOperations(site,[{action:"update",blockId:target.id,changes:{text:value}}]);
  if(!result.ok)return result;
  return {ok:true,site:{...result.site,blocks:result.site.blocks.map(b=>b.id===target.id?{...b,textExplicit:true}:b)} as T,changedIds:result.changedIds};
 }
 // Explicit named-section title replacement: two quoted spans identify the section and new copy.
 // Never mistake the section name for the requested replacement text.
 const namedSectionTitle=instruction.match(/^(?:altere|troque|mude|substitua)\\s+o\\s+t[ií]tulo\\s+da\\s+se[cç][aã]o\\s+[\"“]([^\"”]{1,130})[\"”]\\s+(?:para|por)\\s+[\"“]([^\"”]{1,300})[\"”](?:\\s*[,.;]?[\\s\\S]*)?$/i);
 if(namedSectionTitle){
  const section=resolveUniversalSection(site,namedSectionTitle[1].trim());
  if(!section)return {ok:false,error:"A seção indicada não foi identificada de forma única. Nenhuma alteração aplicada."};
  const headings=site.blocks.filter(b=>b.section===section&&b.type==="heading");
  if(headings.length!==1)return {ok:false,error:"O título da seção não possui um único bloco editável. Nenhuma alteração aplicada."};
  const heading=headings[0],value=namedSectionTitle[2].trim();
  if(!value||heading.text===value)return {ok:false,error:"O novo título está vazio ou já está aplicado. Nenhuma alteração aplicada."};
  const changed=applyUniversalOperations(site,[{action:"update",blockId:heading.id,changes:{text:value}}]);
  if(!changed.ok)return changed;
  return {ok:true,site:{...changed.site,blocks:changed.site.blocks.map(b=>b.id===heading.id?{...b,textExplicit:true}:b)} as T,changedIds:changed.changedIds};
 }
 // A scoped heading request takes precedence over mentions of images to PRESERVE.
 const scopedHeroTitle=instruction.match(/^na\\s+primeira\\s+se[cç][aã]o\\s*(?:\\(\\s*hero\\s*\\))?\\s*,?\\s*altere\\s+(?:somente\\s+|apenas\\s+)?o\\s+t[ií]tulo\\s+principal\\s+para\\s+['"“]([^'"”]+)['"”]/i);
 if(scopedHeroTitle){
  const first=resolveUniversalSection(site,"capa")||site.blocks.find(b=>b.type==="heading"&&b.section)?.section;
  const heading=site.blocks.find(b=>b.section===first&&b.type==="heading");
  if(!heading)return {ok:false,error:"O título principal não possui um bloco editável. Nenhuma alteração aplicada."};
  if(heading.text===scopedHeroTitle[1])return {ok:true,site,changedIds:[]};
  return {ok:true,site:{...site,blocks:site.blocks.map(b=>b.id===heading.id?{...b,text:scopedHeroTitle[1]}:b)},changedIds:[heading.id]};
 }
 const bannerIntent=/^(?:adicione|crie|inclua|insira)\s+uma\s+(?:nova\s+)?faixa\s+horizontal\b/i.test(instruction);
 if(bannerIntent){
  const anchors=instruction.match(/entre\s+(?:as\s+)?se[cç][oõ]es\s+(.+?)\s+e\s+(.+?)(?:[,.;]|$)/i);
  const message=instruction.match(/["“]([^"”]{1,300})["”]/);
  const bg=instruction.match(/fundo[^#]{0,70}(#[0-9a-f]{6})/i);
  if(!anchors||!message||!bg)return {ok:false,error:"Informe as seções, texto entre aspas e cor da faixa. Nenhuma alteração aplicada."};
  const first=resolveUniversalSection(site,anchors[1].trim());
  const second=resolveUniversalSection(site,anchors[2].trim());
  if(!first||!second||first===second)return {ok:false,error:"Não foi possível localizar as seções de referência. Nenhuma alteração aplicada."};
  const raw=(site as Record<string,unknown>).universalBanners;
  const existing=Array.isArray(raw)?raw:[];
  const id="universal-banner-"+(existing.length+1);
  return {ok:true,site:{...site,universalBanners:[...existing,{id,afterSection:first,beforeSection:second,text:message[1],backgroundColor:bg[1],textColor:"#FFFFFF"}]},changedIds:[id]};
 }
 const namedColors:Record<string,string>={preto:"#000000",branco:"#FFFFFF",cinza:"#808080",grafite:"#303030",chumbo:"#36454F",azul:"#2563EB",verde:"#16A34A",vermelho:"#DC2626",amarelo:"#EAB308",laranja:"#F97316",roxo:"#9333EA",rosa:"#EC4899",bege:"#E8DDCB",marrom:"#795548",dourado:"#D4AF37",creme:"#FFFDD0"};
 const colorValue=(raw:string)=>{const value=raw.toLowerCase().trim();if(value.startsWith("#"))return value.length===4?"#"+value.slice(1).split("").map(x=>x+x).join(""):value;const [name,modifier]=value.split(/\s+/);if(!namedColors[name])return null;const variants:Record<string,Record<string,string>>={cinza:{escuro:"#303030",claro:"#D1D5DB"},azul:{escuro:"#1E3A8A",claro:"#93C5FD"},verde:{escuro:"#166534",claro:"#86EFAC"},vermelho:{escuro:"#991B1B",claro:"#FCA5A5"},preto:{suave:"#171717",fosco:"#171717"}};return variants[name]?.[modifier]||namedColors[name];};
 const colorPattern="(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|(?:"+Object.keys(namedColors).join("|")+")(?:\\s+(?:escuro|claro|suave|fosco))?)";
 const backgroundPatterns=[
  new RegExp("^(?:quero\\s+)?(?:deixar|deixa|deixe|mudar|muda|mude|trocar|troca|troque|colocar|coloca|coloque|altere|altera|alterar)\\s+(?:somente\\s+)?(?:o\\s+)?fundo\\s+(?:da\\s+|do\\s+|dos\\s+|de\\s+)?(?:parte\\s+)?(?:se[cç][aã]o\\s+(?:de\\s+|dos\\s+|da\\s+)?)?(.+?)\\s+(?:(?:na\\s+cor|para|pra|em|com)\\s+)?"+colorPattern+"(?:\\b|$)","i"),
  new RegExp("^(?:na\\s+)?se[cç][aã]o\\s+(.+?),?\\s+(?:altere|mude|troque|coloque|deixe)\\s+(?:somente\\s+|apenas\\s+)?(?:a\\s+)?(?:cor\\s+de\\s+)?fundo\\s+(?:para|pra|em|com)\\s+"+colorPattern+"(?:\\b|$)","i"),
  new RegExp("^(?:altere|mude|troque)\\s+(?:somente\\s+)?(?:a\\s+)?cor\\s+de\\s+fundo\\s+da\\s+se[cç][aã]o\\s+(.+?)\\s+(?:para|pra)\\s+"+colorPattern+"(?:\\b|$)","i"),
  new RegExp("^(?:quero\\s+)?(?:deixar|deixe|colocar|coloque)\\s+(?:a\\s+)?(?:parte|se[cç][aã]o)\\s+(?:de|dos|da)\\s+(.+?)\\s+(?:com\\s+)?fundo\\s+"+colorPattern+"(?:\\b|$)","i")
 ];
 const sectionBackground=backgroundPatterns.map(pattern=>instruction.match(pattern)).find(Boolean);
 if(sectionBackground){
  const label=sectionBackground[1].trim().replace(/,$/,"").trim().replace(/^[\s"“”\u0027‘’]+|[\s"“”\u0027‘’]+$/g,"");
  const section=resolveUniversalSection(site,label);
  if(!section)return {ok:false,error:"Seção "+label+" não encontrada. Nenhuma alteração aplicada."};
  const backgroundColor=colorValue(sectionBackground[2]);
  if(!backgroundColor)return {ok:false,error:"Cor não reconhecida. Nenhuma alteração aplicada."};
  const existing=(site as Record<string,unknown>).universalSectionStyles;
  const styles=existing&&typeof existing==="object"&&!Array.isArray(existing)?existing as Record<string,unknown>:{};
  return {ok:true,site:{...site,universalSectionStyles:{...styles,[section]:{...((styles[section]&&typeof styles[section]==="object")?styles[section] as object:{}),backgroundColor}}},changedIds:["section-style:"+section]};
 }
 const sectionHeadings=instruction.match(/^na\s+se[cç][aã]o\s+(.+?),?\s+altere\s+(?:todos\s+)?os\s+t[ií]tulos\s+para\s+(?:a\s+)?cor\s+(?:[\p{L}-]+\s+)?(#[0-9a-f]{6})/iu)
  ||instruction.match(/^altere\s+(?:a\s+)?cor\s+(?:de\s+)?(?:todos\s+)?os\s+t[ií]tulos\s+da\s+se[cç][aã]o\s+(.+?)\s+para\s+(?:[\p{L}-]+\s+)?(#[0-9a-f]{6})/iu);
 if(sectionHeadings){
  const section=resolveUniversalSection(site,sectionHeadings[1].trim().replace(/,$/,""));
  if(!section)return {ok:false,error:"Seção não encontrada. Nenhuma alteração aplicada."};
  const existing=(site as Record<string,unknown>).universalSectionStyles;
  const styles=existing&&typeof existing==="object"&&!Array.isArray(existing)?existing as Record<string,unknown>:{};
  return {ok:true,site:{...site,universalSectionStyles:{...styles,[section]:{...((styles[section]&&typeof styles[section]==="object")?styles[section] as object:{}),headingColor:sectionHeadings[2]}}},changedIds:["section-heading-color:"+section]};
 }
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
 const fullSectionRemove=text.match(/^(?:remova|exclua|apague)\s+(?:completamente\s+)?(?:a\s+)?se[cç][aã]o\s+["“”']([^"“”']+)["“”'](?:\s+que\s+acabamos\s+de\s+adicionar)?(?:\s*,[\s\S]*)?$/i);
 if(fullSectionRemove){
  const section=resolveSection(fullSectionRemove[1]);
  if("error" in section)return {ok:false,error:section.error};
  return applyUniversalOperations(site,[{action:"remove-section",sectionId:section.id}]);
 }
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

/** Resolve visible editor labels without guessing when multiple blocks match. */
function applyVisibleEditorCommand<T extends UniversalSite>(site:T,raw:string):UniversalResult<T>|null{
 const text=raw.trim().replace(/\.$/,"");
 const norm=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
 const fail=(label:string):UniversalResult<T>=>({ok:false,error:"Não foi possível identificar um único elemento para: "+label+". Nenhuma alteração aplicada."});
 const update=(candidates:typeof site.blocks,value:string,label:string)=>{
  if(candidates.length!==1)return fail(label);
  return applyUniversalOperations(site,[{action:"update",blockId:candidates[0].id,changes:{text:value}}]);
 };
 const newSection=text.match(/^adicione\s+uma\s+nova\s+se[cç][aã]o\s+chamada\s+["“]([^"”]+)["”],?\s+imediatamente\s+depois\s+da\s+se[cç][aã]o\s+["“]([^"”]+)["”],?\s+com\s+um\s+t[ií]tulo,\s+uma\s+breve\s+introdu[cç][aã]o\s+e\s+tr[eê]s\s+cards:\s*(.+?)(?:\.\s*utilize\s+textos\s+profissionais(?:\s+e\s+preserve\s+a\s+identidade\s+visual\s+do\s+site)?)?\.?$/i);
 if(newSection){
  const anchorSection=resolveUniversalSection(site,newSection[2]);
  if(!anchorSection)return fail("seção de referência "+newSection[2]);
  const labels=newSection[3].replace(/\.$/,"").split(/\s*,\s*|\s+e\s+/i).map(v=>v.trim()).filter(Boolean);
  if(labels.length!==3)return fail("três cards de "+newSection[1]);
  const sectionId="custom-"+norm(newSection[1]).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  if(site.blocks.some(b=>b.section===sectionId))return fail("seção já existente "+newSection[1]);
  const descriptions:Record<string,string>={
   "modelagem bim":"Modelagem integrada para coordenar disciplinas, visualizar soluções e reduzir incompatibilidades durante o desenvolvimento dos projetos.",
   "planejamento digital":"Ferramentas digitais para organizar etapas, acompanhar cronogramas e apoiar decisões técnicas com maior precisão.",
   "gestao de projetos":"Acompanhamento estruturado de escopo, prazos e entregas para promover eficiência e transparência na execução."
  };
  const id=(n:number)=>sectionId+"-"+n;
  const blocks=[
   {id:id(0),type:"heading",section:sectionId,text:newSection[1]},
   {id:id(1),type:"paragraph",section:sectionId,text:"Tecnologia e planejamento integrados para desenvolver projetos com precisão, eficiência e colaboração."},
   ...labels.map((label,i)=>({id:id(i+2),type:"paragraph",section:sectionId,text:label+": "+(descriptions[norm(label)]||"Soluções técnicas aplicadas com planejamento, colaboração e foco na qualidade das entregas.")}))
  ];
  const last=site.blocks.filter(b=>b.section===anchorSection).at(-1);
  if(!last)return fail(newSection[2]);
  const operations:UniversalOperation[]=[];
  let afterId=last.id;
  for(const block of blocks){operations.push({action:"add",block,afterId});afterId=block.id;}
  return applyUniversalOperations(site,operations);
 }
 const colorCards=text.match(/^(?:altere|troque|mude|substitua)\s+a\s+cor\s+de\s+fundo\s+dos\s+(?:quatro|4|todos\s+os)\s+cards\s+da\s+se[cç][aã]o\s+["“]?([^"”]+?)["”]?\s+de\s+.+?\s+para\s+.+?\(?(#[0-9a-f]{6})\)?/i);
 if(colorCards){
  const section=resolveUniversalSection(site,colorCards[1]);
  if(!section)return fail(colorCards[1]);
  const cards=site.blocks.filter(b=>b.section===section&&b.type==="paragraph"&&/[:—–]/.test(String(b.text||"")));
  if(cards.length!==4)return fail("quatro cards da seção "+colorCards[1]);
  return applyUniversalOperations(site,cards.map(b=>({action:"update" as const,blockId:b.id,changes:{background:colorCards[2]}})));
 }
 const hero=resolveUniversalSection(site,"capa");
 // Shared hero targeting: a description beneath the heading is a paragraph, never a heading.
 // Preservation clauses are stripped by applyUniversalNaturalLanguage before this handler.
 const heroCopy=text.match(/^(?:altere|troque|mude|substitua)\s+a\s+(?:descri[cç][aã]o|subt[ií]tulo)\s+(?:(?:logo\s+)?abaixo\s+do\s+t[ií]tulo\s+principal\s+|principal\s+)?(?:da\s+)?(?:capa|hero|primeira\s+se[cç][aã]o)\s+(?:para|por)\s+["“]([^"”]+)["”"]\s*\.?$/i);
 if(heroCopy)return hero?update(site.blocks.filter(b=>b.section===hero&&b.type==="paragraph"),heroCopy[1],"descrição da capa"):fail("capa");
 const heroTitle=text.match(/^(?:altere|troque|mude|substitua)\s+o\s+t[ií]tulo\s+(?:principal\s+)?(?:da\s+)?(?:capa|hero|primeira\s+se[cç][aã]o)\s+(?:para|por)\s+["“]([^"”]+)["”]$/i);
 if(heroTitle)return hero?update(site.blocks.filter(b=>b.section===hero&&b.type==="heading"),heroTitle[1],"título principal da capa"):fail("capa");
 const namedPrimaryButton=text.match(/^(?:altere|troque|mude|substitua)\s+o\s+texto\s+do\s+bot[aã]o\s+principal\s+da\s+capa\s+de\s+["“]([^"”]+)["”]\s+(?:para|por)\s+["“]([^"”]+)["”](?:,?\s+preservando\s+o\s+link\s+e\s+a\s+anima[cç][aã]o\s+existentes?)?\.?$/i);
 if(namedPrimaryButton){
  if(!hero)return fail("capa");
  const buttons=site.blocks.filter(b=>b.section===hero&&b.type==="button"&&norm(String(b.text||""))===norm(namedPrimaryButton[1]));
  return update(buttons,namedPrimaryButton[2],"botão principal da capa");
 }
 const primaryButton=text.match(/^(?:altere|troque|mude|substitua)\s+o\s+texto\s+do\s+bot[aã]o\s+principal\s+(?:para|por)\s+["“]([^"”]+)["”]$/i);
 if(primaryButton)return hero?update(site.blocks.filter(b=>b.section===hero&&b.type==="button"),primaryButton[1],"botão principal"):fail("capa");
 const namedTitle=text.match(/^(?:na\s+se[cç][aã]o\s+(.+?),\s*)?(?:altere|troque|mude|substitua)\s+o\s+t[ií]tulo\s+["“]([^"”]+)["”]\s+(?:para|por)\s+["“]([^"”]+)["”]$/i);
 if(namedTitle){
  const section=namedTitle[1]?resolveUniversalSection(site,namedTitle[1]):null;
  if(namedTitle[1]&&!section)return fail(namedTitle[1]);
  const candidates=site.blocks.filter(b=>(b.type==="heading"||b.type==="paragraph")&&(!section||b.section===section)&&norm(String(b.text||"").split(/:\s|\s[—–]\s/)[0])===norm(namedTitle[2]));
  if(candidates.length!==1)return fail(namedTitle[2]);
  const block=candidates[0],original=String(block.text||"");
  const separator=original.match(/:\s|\s[—–]\s/);
  const next=separator?namedTitle[3]+original.slice((separator.index||0)):namedTitle[3];
  return applyUniversalOperations(site,[{action:"update",blockId:block.id,changes:{text:next}}]);
 }
 const namedDescription=text.match(/^(?:altere|troque|mude|substitua)\s+o\s+texto\s+do\s+diferencial\s+["“]([^"”]+)["”]\s+(?:para|por)\s+["“]([^"”]+)["”]$/i);
 if(namedDescription){
  const section=resolveUniversalSection(site,"nossos diferenciais");
  if(!section)return fail("Nossos Diferenciais");
  const blocks=site.blocks.filter(b=>b.section===section);
  const matching=blocks.filter(b=>norm(String(b.text||"")).includes(norm(namedDescription[1])));
  if(matching.length!==1)return fail(namedDescription[1]);
  const block=matching[0];
  const current=String(block.text||"");
  const separator=current.indexOf(":");
  const next=separator>=0?current.slice(0,separator+1)+" "+namedDescription[2]:namedDescription[2];
  return applyUniversalOperations(site,[{action:"update",blockId:block.id,changes:{text:next}}]);
 }
 return null;
}

/** Create a section from natural user language, without template IDs or rigid syntax. */
function applyNaturalSectionCreation<T extends UniversalSite>(site:T,instruction:string):UniversalResult<T>|null{
 const normalized=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
 const request=instruction.match(/^\s*(?:adicione|crie|inclua|insira)\s+uma\s+(?:nova\s+)?se[cç][aã]o\s+(?:chamada|denominada)\s+(?:"([^"]+)"|“([^”]+)”|'([^']+)'|([^,.\n]+?)(?=\s*(?:,|\.|\s+imediatamente\s+antes|\s+antes|\s+depois|\s+ap[oó]s|$)))/i);
 if(!request)return null;
 const name=(request[1]||request[2]||request[3]||request[4]||"").trim().replace(/\s+(?:com|contendo)\s+(?:(?:um|dois|duas|tr[eê]s|quatro|cinco|seis|\d+)\s+cards?\b).*$/i,"").trim();
 if(!name)return {ok:false,error:"Informe o nome da nova seção."};
 const destination=instruction.match(/\b(?:imediatamente\s+)?(antes|depois|ap[oó]s)\s+(?:(?:das|dos|da|do|de|as|os|a|o)\b\s+)?(?:se[cç][aã]o\s+)?(?:de\s+)?["“”']?([^,"“”'.\n]+)["“”']?/i);
 if(!destination && !site.blocks.length)return {ok:false,error:"O site não possui seções para posicionar a nova seção."};
 const targetLabel=destination?.[2]?.trim().replace(/\s+(?:com|contendo|que)\s+.*$/i,"").trim();
 const target=targetLabel?resolveUniversalSection(site,targetLabel):null;
 if(destination&&!target)return {ok:false,error:"Seção de referência não encontrada: "+targetLabel+". Nenhuma alteração aplicada."};
 const sectionId="custom-"+normalized(name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
 if(site.blocks.some(b=>b.section===sectionId))return {ok:false,error:"Essa seção já existe. Nenhuma alteração aplicada."};
 const before=destination?normalized(destination[1])==="antes":false;
 const defaultAnchor=site.blocks.findIndex(b=>/^(contact|contato|footer|rodape|localizacao|location)(?:-|$)/i.test(String(b.section||"")));
 const index=destination?(before?site.blocks.findIndex(b=>b.section===target):site.blocks.findLastIndex(b=>b.section===target)+1):(defaultAnchor>0?defaultAnchor:site.blocks.length);
 const previous=site.blocks[index-1];
 if(!previous)return {ok:false,error:"Não foi possível inserir a seção nessa posição."};
 const numbered=[...instruction.matchAll(/(?:^|\n)\s*(\d{1,2})[.)]\s*([^:\n—–]+?)\s*(?::|[—–])\s*([^\n]+)/g)].map(m=>({title:m[2].trim(),description:m[3].trim()}));
 const countWord=instruction.match(/(?:crie|adicione|inclua|com|contendo|tenha|possua)\s+(?:(?:\w+\s+){0,2})?(um|dois|duas|tr[eê]s|quatro|cinco|seis|\d{1,2})\s+cards?/i)?.[1];
 const quantities:Record<string,number>={um:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6};
 const requestedCount=countWord?(quantities[normalized(countWord)]??Number(countWord)):null;
 if(requestedCount!==null&&(!Number.isInteger(requestedCount)||requestedCount<1||requestedCount>12))return {ok:false,error:"Quantidade de cards fora do intervalo permitido (1 a 12). Nenhuma alteração aplicada."};
 let cards=numbered;
 if(cards.length===0){
  const region=instruction.match(/cards?\s+com\s+os\s+t[ií]tulos?\s+([\s\S]+?)(?=\.\s|\s+Cada card\b|$)/i)?.[1]
   ||instruction.match(/cards?\s*:\s*([\s\S]+?)(?=\.\s|\s+Cada card\b|$)/i)?.[1]||"";
  const labels=[...region.matchAll(/["“]([^"”]{2,120})["”]/g)].map(m=>m[1].trim());
  if(!labels.length&&region){
   const parts=region.split(/\s*,\s*/).map(label=>label.trim().replace(/[.!]+$/,"")).filter(Boolean);
   const unquoted=requestedCount!==null&&parts.length===requestedCount?parts:requestedCount!==null&&parts.length===requestedCount-1?parts.flatMap((part,index)=>index===parts.length-1?part.split(/\s+e\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/i):[part]):parts;
   if(requestedCount!==null&&unquoted.length>requestedCount){
    const last=unquoted.splice(requestedCount-1).join(" e ");unquoted.push(last);
   }
   if(unquoted.length>=2&&unquoted.length<=12)labels.push(...unquoted);
  }
  if(labels.length)cards=labels.map(title=>{const descriptions:Record<string,string>={"seguranca":"Aplicamos critérios técnicos, procedimentos preventivos e verificações contínuas para proteger pessoas e assegurar a execução responsável.","transparência":"Mantemos comunicação clara sobre etapas, decisões e entregas, com acompanhamento acessível ao cliente.","excelencia tecnica":"Unimos planejamento, conhecimento especializado e controle rigoroso para entregar soluções confiáveis e bem executadas."};const key=normalized(title);
   const sectionKey=normalized(name);
   const isCreativeProcess=/processo|metodologia|etapas|jornada|fluxo/.test(sectionKey);
   const stageCopy=isCreativeProcess?(
    /briefing|imersao|diagnostico|descoberta|levantamento|planejamento/.test(key)?"Começamos ouvindo suas necessidades, entendendo o espaço e definindo objetivos, referências e prioridades que orientam o projeto.":
    /desenvolvimento|criacao|projeto|execucao|producao|concepcao/.test(key)?"Transformamos o briefing em propostas e soluções, refinando cada detalhe com atenção à funcionalidade, estética e coerência do conjunto.":
    /entrega|acompanhamento|finalizacao|conclusao|implementacao/.test(key)?"Organizamos a entrega e acompanhamos os ajustes finais, garantindo clareza nas orientações e cuidado com os detalhes do projeto.":null
   ):null;
   const description=descriptions[key]||stageCopy||"Apresentamos esta etapa com clareza, alinhando expectativas, decisões e próximos passos às necessidades do projeto.";
   return {title,description};});
 }
 // Interpret natural process-stage lists as cards, even when users say "etapas" rather than "cards".
 // Keep this limited to explicit new-section requests; never mutate existing sections.
 if(!cards.length){
  const stages=instruction.match(/\b(?:inclua|adicione|crie|com|contendo)\s+(?:(?:as|os)\s+)?(um|dois|duas|tr[eê]s|quatro|cinco|seis|\d{1,2})\s+(?:etapas|passos|fases)\s*:\s*([^.!?\n]+)/i);
  if(stages){
   const count=quantities[normalized(stages[1])]??Number(stages[1]);
   const names=stages[2].split(/\s*,\s*|\s+e\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/).map(v=>v.trim()).filter(Boolean);
   if(count>=1&&count<=12&&names.length===count){
    cards=names.map(title=>{
     const key=normalized(title);
     const description=/briefing|imersao|diagnostico/.test(key)?"Entendemos as necessidades, objetivos e referências para orientar cada decisão do projeto.":
      /conceito|concepcao/.test(key)?"Desenvolvemos a direção criativa e apresentamos soluções alinhadas à identidade e às expectativas do cliente.":
      /desenvolvimento|projeto|execucao/.test(key)?"Detalhamos as soluções e refinamos os elementos técnicos e visuais do projeto.":
      /entrega|finalizacao|conclusao/.test(key)?"Apresentamos o resultado e orientamos os próximos passos com clareza e atenção aos detalhes.":
      "Organizamos esta etapa com objetivos, decisões e entregas claros.";
     return {title,description};
    });
   }
  }
 }
 // A normal customer may request three cards without specifying their titles.
 // Supply editable, non-claim-based placeholders instead of rejecting the instruction.
 if(!cards.length&&requestedCount===3&&/\b(?:diferenciais|vantagens|benef[ií]cios)\b/i.test(name)){
  cards=[
   {title:"Atendimento personalizado",description:"Apresentamos as opções disponíveis e orientamos cada cliente de acordo com suas necessidades."},
   {title:"Cuidado em cada etapa",description:"Organizamos as informações e acompanhamos as etapas do atendimento com clareza."},
   {title:"Compromisso com você",description:"Facilitamos o contato para esclarecer dúvidas e encontrar a solução mais adequada."}
  ];
 }
 // An ordinary four-differential request should not require the user to supply card titles.
 // Use neutral, editable sample copy; never fabricate business-specific achievements.
 if(!cards.length&&/\b(?:quatro|4)\s+diferenciais\b/i.test(instruction)){
  cards=[
   {title:"Atendimento personalizado",description:"Conheça as opções disponíveis e receba orientações de acordo com suas necessidades."},
   {title:"Seleção de imóveis",description:"Explore imóveis apresentados com informações claras e organizadas."},
   {title:"Transparência",description:"Encontre informações objetivas para comparar possibilidades com tranquilidade."},
   {title:"Experiência de navegação",description:"Descubra os espaços em uma apresentação visual intuitiva e responsiva."}
  ];
 }
 if(!cards.length||requestedCount!==null&&cards.length!==requestedCount)return {ok:false,error:"A quantidade ou os títulos dos cards não correspondem ao pedido. Nenhuma alteração aplicada."};
 if(cards.length>12||new Set(cards.map(c=>normalized(c.title))).size!==cards.length)return {ok:false,error:"Os cards precisam ter títulos únicos e quantidade válida. Nenhuma alteração aplicada."};
 const entries=[{type:"heading",text:name},...cards.flatMap(card=>[
  {type:"heading",text:card.title},
  {type:"paragraph",text:card.description}
 ])];
 const operations:UniversalOperation[]=[];let afterId=previous.id;
 for(let i=0;i<entries.length;i++){
  const block={id:sectionId+"-"+i,section:sectionId,...entries[i]};
  operations.push({action:"add",block,afterId});afterId=block.id;
 }
 return applyUniversalOperations(site,operations);
}

/** Structured multi-line brief for a named three-card section. All changes commit atomically. */
function applyStructuredSectionBrief<T extends UniversalSite>(site:T,instruction:string):UniversalResult<T>|null{
 const clean=(value:string)=>value.replace(/^[\s*"“”']+|[\s*"“”']+$/g,"").trim();
 const norm=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
 const heading=instruction.match(/(?:^|\n)\s*(?:1[.)]\s*)?(?:nova\s+se[cç][aã]o\s*[—–:-]\s*|adicione\s+uma\s+nova\s+se[cç][aã]o\s+chamada\s+)[“"]?([^\n"”]+?)[”"]?\s*(?:\n|$)/i);
 if(!heading)return null;
 const name=clean(heading[1]).replace(/[.]+$/,"");
 const anchor=instruction.match(/(?:imediatamente\s+)?ap[oó]s\s+a\s+se[cç][aã]o\s+[“"]([^"”]+)[”"]/i);
 if(!anchor)return {ok:false,error:"Indique a seção após a qual a nova seção deve aparecer. Nenhuma alteração aplicada."};
 const anchorId=resolveUniversalSection(site,anchor[1]);
 if(!anchorId)return {ok:false,error:"Seção de referência não encontrada ou ambígua. Nenhuma alteração aplicada."};
 const sectionId="custom-"+norm(name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
 if(site.blocks.some(b=>b.section===sectionId))return {ok:false,error:"A seção solicitada já existe. Nenhuma alteração aplicada."};
 const description=instruction.match(/(?:^|\n)\s*Descri[cç][aã]o\s*:\s*([^\n]+)/i)?.[1]?.trim();
 const cards=[...instruction.matchAll(/(?:^|\n)\s*(?:\*\*)?Card\s+([123])\s*[—–:-]\s*([^\n*]+)(?:\*\*)?\s*\n+([^\n]+)/gi)];
 if(cards.length!==3||new Set(cards.map(m=>m[1])).size!==3||!description)return {ok:false,error:"Informe a descrição e os três cards com título e texto, cada um em linhas separadas. Nenhuma alteração aplicada."};
 const titles=cards.sort((a,b)=>Number(a[1])-Number(b[1])).map(m=>clean(m[2]));
 const details=cards.map(m=>clean(m[3]));
 const rename=instruction.match(/(?:altere|troque|mude|substitua)\s+o\s+t[ií]tulo\s+do\s+segundo\s+card\s+de\s+[“"]([^"”]+)[”"]\s+para\s+[“"]([^"”]+)[”"]/i);
 if(rename){if(norm(titles[1])!==norm(rename[1]))return {ok:false,error:"O título original do segundo card não corresponde ao briefing. Nenhuma alteração aplicada."};titles[1]=rename[2];}
 const replaceThird=instruction.match(/(?:no\s+terceiro\s+card|do\s+terceiro\s+card)[\s\S]*?(?:descri[cç][aã]o\s+por\s*:\s*|descri[cç][aã]o\s+para\s*:\s*)[“"]([^"”]+)[”"]/i);
 if(replaceThird)details[2]=replaceThird[1];
 const wantsNavy=/azul-marinho/i.test(instruction)&&/fundo\s+(?:dos\s+)?(?:tr[eê]s\s+)?cards/i.test(instruction);
 const blocks:UniversalOperation[]=[];
 const last=site.blocks.filter(b=>b.section===anchorId).at(-1);
 if(!last)return {ok:false,error:"Seção de referência sem blocos. Nenhuma alteração aplicada."};
 let afterId=last.id;
 const entries=[{type:"heading",text:name},{type:"paragraph",text:description},...titles.map((title,i)=>({type:"paragraph",text:title+": "+details[i],...(wantsNavy?{background:"#14243b",color:"#ffffff",textColor:"#e5e7eb"}:{})}))];
 for(let i=0;i<entries.length;i++){const block={id:sectionId+"-"+i,section:sectionId,...entries[i]};blocks.push({action:"add",block,afterId});afterId=block.id;}
 return applyUniversalOperations(site,blocks);
}

/** Atomic edit of an existing numbered process: rename a step and append another. */
function applyProcessStepRevision<T extends UniversalSite>(site:T,instruction:string):UniversalResult<T>|null{
 const norm=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
 const sectionMatch=instruction.match(/(?:na|no)\s+se[cç][aã]o\s+["“]([^"”]+)["”]/i);
 const rename=instruction.match(/(?:altere|troque|mude|substitua)\s+o\s+t[ií]tulo\s+da\s+segunda\s+etapa\s+de\s+["“]([^"”]+)["”]\s+para\s+["“]([^"”]+)["”]/i);
 const addition=instruction.match(/adicione\s+uma\s+quinta\s+etapa\s+chamada\s+["“]([^"”]+)["”]\s*,?\s+com\s+a\s+descri[cç][aã]o\s*:\s*["“]([^"”]+)["”]/i);
 if(!sectionMatch||!rename||!addition)return null;
 const sectionId=resolveUniversalSection(site,sectionMatch[1]);
 if(!sectionId)return {ok:false,error:"Seção de processo não encontrada ou ambígua. Nenhuma alteração aplicada."};
 const blocks=site.blocks.filter(b=>b.section===sectionId);
 const steps=blocks.filter(b=>b.type==="paragraph"&&/^\s*[^:：—–]+\s*[:：—–]\s*\S/.test(String(b.text||"")));
 if(steps.length!==4)return {ok:false,error:"Esperadas quatro etapas existentes na seção indicada. Nenhuma alteração aplicada."};
 const original=String(steps[1].text||"");
 const match=original.match(/^\s*([^:：—–]+)(\s*[:：—–]\s*)([\s\S]*)$/);
 if(!match||norm(match[1])!==norm(rename[1]))return {ok:false,error:"O título da segunda etapa não corresponde ao informado. Nenhuma alteração aplicada."};
 if(steps.some(b=>norm(String(b.text||"").split(/[:：—–]/)[0])===norm(addition[1])))return {ok:false,error:"A quinta etapa já existe. Nenhuma alteração aplicada."};
 const newId=sectionId+"-step-"+Date.now().toString(36);
 const operations:UniversalOperation[]=[
  {action:"update",blockId:steps[1].id,changes:{text:rename[2]+match[2]+match[3]}},
  {action:"add",block:{id:newId,type:"paragraph",section:sectionId,text:addition[1]+": "+addition[2]},afterId:steps[3].id}
 ];
 return applyUniversalOperations(site,operations);
}

/** Remove and reorder process steps in a single atomic transaction. */
function applyProcessStepReorder<T extends UniversalSite>(site:T,instruction:string):UniversalResult<T>|null{
 const sectionMatch=instruction.match(/(?:na|no)\s+se[cç][aã]o\s+["“]([^"”]+)["”]/i);
 const removal=instruction.match(/remova\s+a\s+etapa\s+["“]([^"”]+)["”]/i);
 const movement=instruction.match(/mova\s+a\s+etapa\s+["“]([^"”]+)["”]\s+para\s+a\s+primeira\s+posi[cç][aã]o/i);
 if(!sectionMatch||!removal||!movement)return null;
 const norm=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
 const sectionId=resolveUniversalSection(site,sectionMatch[1]);
 if(!sectionId)return {ok:false,error:"Seção de processo não encontrada ou ambígua. Nenhuma alteração aplicada."};
 const blocks=site.blocks.filter(b=>b.section===sectionId);
 const steps=blocks.filter(b=>b.type==="paragraph"&&/^\s*[^:：—–]+\s*[:：—–]\s*\S/.test(String(b.text||"")));
 const matches=(title:string)=>steps.filter(b=>norm(String(b.text||"").split(/[:：—–]/)[0])===norm(title));
 const removeMatches=matches(removal[1]),moveMatches=matches(movement[1]);
 if(removeMatches.length!==1||moveMatches.length!==1||removeMatches[0].id===moveMatches[0].id)return {ok:false,error:"Etapas não identificadas de forma única. Nenhuma alteração aplicada."};
 if(steps.length!==5)return {ok:false,error:"Esperadas cinco etapas antes da reorganização. Nenhuma alteração aplicada."};
 const firstIndex=site.blocks.findIndex(b=>b.id===steps[0].id);
 const anchor=site.blocks[firstIndex-1];
 if(!anchor||anchor.section!==sectionId)return {ok:false,error:"Âncora da primeira etapa não encontrada. Nenhuma alteração aplicada."};
 return applyUniversalOperations(site,[
  {action:"remove",blockId:removeMatches[0].id},
  {action:"move",blockId:moveMatches[0].id,afterId:anchor.id}
 ]);
}

/** Layout-only commands must never fall through to image-edit heuristics. */
function applyProcessTimelineLayout<T extends UniversalSite>(site:T,instruction:string):UniversalResult<T>|null{
 const requestsLayout=/\b(?:altere|mude|troque|transforme|converta)\b[\s\S]{0,110}\blayout\b/i.test(instruction);
 const requestsTimeline=/linha do tempo vertical|timeline vertical/i.test(instruction);
 if(!requestsLayout||!requestsTimeline)return null;
 const sectionMatch=instruction.match(/(?:na|no)\s+se[cç][aã]o\s+["“]([^"”]+)["”]/i);
 if(!sectionMatch)return {ok:false,error:"Informe a seção que receberá a linha do tempo. Nenhuma alteração aplicada."};
 const sectionId=resolveUniversalSection(site,sectionMatch[1]);
 if(!sectionId)return {ok:false,error:"Seção não encontrada ou ambígua. Nenhuma alteração aplicada."};
 const heading=site.blocks.find(b=>b.section===sectionId&&b.type==="heading");
 const steps=site.blocks.filter(b=>b.section===sectionId&&b.type==="paragraph"&&/^\s*[^:：—–]+\s*[:：—–]\s*\S/.test(String(b.text||"")));
 if(!heading||steps.length<2)return {ok:false,error:"Seção sem título ou etapas suficientes para a linha do tempo. Nenhuma alteração aplicada."};
 const numberMatch=instruction.match(/numera[cç][aã]o\s+0?1\s+a\s+0?(\d+)/i);
 if(numberMatch&&Number(numberMatch[1])!==steps.length)return {ok:false,error:"A quantidade de etapas não corresponde à numeração solicitada. Nenhuma alteração aplicada."};
 return applyUniversalOperations(site,[{action:"update",blockId:heading.id,changes:{layout:"timeline-vertical"}}]);
}

/** All supported clauses commit together. Unsupported compound requests cannot hit partial legacy shortcuts. */
export function applyUniversalNaturalLanguage<T extends UniversalSite>(site:T,rawInstruction:string):UniversalResult<T>|null{
 // A comma after a pasted image URL separates clauses; it is not part of the image address.
 const instruction=rawInstruction;
 // Exact quoted title edit is handled atomically before generic clause splitting.
 const exactHeading=instruction.trim().match(/^na\s+se[cç][aã]o\s+(.+?),\s*(?:troque|altere|mude|substitua)\s+(?:somente\s+|apenas\s+)?(?:o\s+)?t[ií]tulo\s+["“]([^"”]{1,300})["”]\s+(?:para|por)\s+["“]([^"”]{1,300})["”](?:\s*[.!?,;:]?\s*(?:n[aã]o\s+altere|sem\s+alterar|preserve|mantenha)\b[\s\S]*)?\s*[.!?]?$/i);
 // Plain-language variant: no quotation marks, commas or final punctuation required.
 // "de ... para ..." supplies unambiguous old/new boundaries.
 const plainHeading=!exactHeading?instruction.trim().match(/^na\s+se[cç][aã]o\s+(.+?)\s*,?\s*(?:troque|altere|mude|substitua)\s+(?:somente\s+|apenas\s+)?(?:o\s+)?t[ií]tulo\s+de\s+(.+?)\s+(?:para|por)\s+(.+?)(?:\s+(?:n[aã]o\s+altere|sem\s+alterar|preserve|mantenha)\b[\s\S]*)?\s*[.!?]?$/i):null;
 const resolvedHeading=exactHeading||plainHeading;
 if(resolvedHeading){
  const section=resolveUniversalSection(site,resolvedHeading[1].trim());
  if(!section)return {ok:false,error:"A seção solicitada não foi identificada de forma única. Nenhuma alteração aplicada."};
  const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const original=normalize(resolvedHeading[2]);
  const matches=site.blocks.filter(b=>b.section===section&&b.type==="heading"&&normalize(String(b.text||""))===original);
  if(matches.length!==1)return {ok:false,error:"O título original não foi localizado de forma única na seção. Nenhuma alteração aplicada."};
  const target=matches[0],value=exactHeading?resolvedHeading[3].trim():resolvedHeading[3].trim().replace(/[!?]$/,'').trim();
  if(!value||normalize(value)===original)return {ok:false,error:"O novo título é inválido ou igual ao original. Nenhuma alteração aplicada."};
  const result=applyUniversalOperations(site,[{action:"update",blockId:target.id,changes:{text:value}}]);
  if(!result.ok)return result;
  return {ok:true,site:{...result.site,blocks:result.site.blocks.map(b=>b.id===target.id?{...b,textExplicit:true}:b)} as T,changedIds:result.changedIds};
 }
 // Update existing process cards in place; preservation constraints are not separate actions.
 const existingProcessEdit=instruction.match(/^na\s+se[cç][aã]o\s+["“]([^"”]+)["”]\s*,?\s*mantenha\s+os\s+(?:tr[eê]s|3)\s+cards\s+existentes\s+e\s+substitua\s+somente\s+suas\s+descri[cç][oõ]es\b/i);
 if(existingProcessEdit){
  const section=resolveUniversalSection(site,existingProcessEdit[1]);
  if(!section)return {ok:false,error:"Seção não encontrada. Nenhuma alteração aplicada."};
  const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const entries=site.blocks.filter(b=>b.section===section);
  const updates:UniversalOperation[]=[];
  for(let index=0;index<entries.length;index++){
   const heading=entries[index];
   if(heading.type!=="heading")continue;
   const label=normalize(heading.text||"");
   const description=/briefing|imersao|diagnostico|descoberta/.test(label)?"Começamos ouvindo suas necessidades, entendendo o espaço e definindo objetivos, referências e prioridades para orientar o projeto.":/desenvolvimento|criacao|projeto|execucao/.test(label)?"Transformamos o briefing em propostas e soluções, refinando funcionalidade, estética e cada detalhe do projeto.":/entrega|acompanhamento|finalizacao|conclusao/.test(label)?"Organizamos a entrega e acompanhamos os ajustes finais, com orientações claras e atenção a cada detalhe.":null;
   if(!description)continue;
   const paragraph=entries.slice(index+1).find(b=>b.type==="heading"||b.type==="paragraph");
   if(paragraph?.type==="paragraph"&&paragraph.text!==description)updates.push({action:"update",blockId:paragraph.id,changes:{text:description}});
  }
  if(updates.length!==3)return {ok:false,error:"Não foi possível identificar exatamente três descrições editáveis nesta seção. Nenhuma alteração aplicada."};
  return applyUniversalOperations(site,updates);
 }
 // Atomic process-section rename + three-card color update (regression Test 6).
 // A compound request must never report success after applying only one clause.
 const processRename=instruction.match(/(?:na\\s+se[cç][aã]o\\s+["“]([^"”]+)["”][\\s,;:]*)?(?:altere|troque|mude|renomeie|substitua)\\s+o\\s+t[ií]tulo\\s+(?:principal\\s+)?(?:da\\s+se[cç][aã]o\\s+)?(?:para|por)\\s+["“]([^"”]+)["”]/i);
 const cardGreen=instruction.match(/(?:t[ií]tulos?\\s+(?:dos?\\s+)?(?:tr[eê]s|3)\\s+cards|(?:tr[eê]s|3)\\s+t[ií]tulos?\\s+dos?\\s+cards)[\\s\\S]{0,130}?(#[0-9a-fA-F]{6})/i);
 if(processRename&&cardGreen){
  const oldName=processRename[1]||"Nosso Processo Criativo";
  const section=resolveUniversalSection(site,oldName);
  if(!section)return {ok:false,error:"Seção do pedido composto não encontrada. Nenhuma alteração aplicada."};
  const blocks=site.blocks.filter(b=>b.section===section);
  const headings=blocks.filter(b=>b.type==="heading");
  if(headings.length!==4)return {ok:false,error:"O pedido exige um título principal e três títulos de cards editáveis. Nenhuma alteração aplicada."};
  const ops:UniversalOperation[]=[];
  if(headings[0].text!==processRename[2])ops.push({action:"update",blockId:headings[0].id,changes:{text:processRename[2]}});
  for(const heading of headings.slice(1))if(heading.color?.toLowerCase()!==cardGreen[1].toLowerCase())ops.push({action:"update",blockId:heading.id,changes:{color:cardGreen[1]}});
  const result=ops.length?applyUniversalOperations(site,ops):{ok:true as const,site,changedIds:[]};
  if(!result.ok)return result;
  const updated=result.site.blocks.filter(b=>b.section===section&&b.type==="heading");
  if(updated[0]?.text!==processRename[2]||updated.slice(1).length!==3||updated.slice(1).some(b=>b.color?.toLowerCase()!==cardGreen[1].toLowerCase()))
   return {ok:false,error:"A verificação do pedido composto falhou. Nenhuma alteração aplicada."};
  return result;
 }
 // Ordinary scoped alignment: do not acknowledge success without changing the requested headings.
 const naturalHeadingAlignment=instruction.match(/(?:centralize|alinhe(?:\s+ao\s+centro)?)\s+(?:todos?\s+)?(?:os\s+)?t[ií]tulos?\s+(?:da|de|do)\s+se[cç][aã]o\s+(?:de\s+)?([^,.;\n]+?)(?=\s+(?:sem|n[aã]o|mantendo|preservando)\b|[.!?]|$)/i);
 if(naturalHeadingAlignment){
  const section=resolveUniversalSection(site,naturalHeadingAlignment[1].trim());
  if(!section)return {ok:false,error:"Seção de títulos não encontrada. Nenhuma alteração aplicada."};
  const headings=site.blocks.filter(b=>b.section===section&&b.type==="heading");
  if(!headings.length)return {ok:false,error:"Nenhum título editável encontrado nessa seção. Nenhuma alteração aplicada."};
  const ops:UniversalOperation[]=headings.filter(b=>b.align!=="center"||b.alignExplicit!==true).map(b=>({action:"update",blockId:b.id,changes:{align:"center"}}));
  return ops.length?applyUniversalOperations(site,ops):{ok:true,site,changedIds:[],requestedCount:headings.length,alreadyCorrectCount:headings.length};
 }
 // Section-scoped alignment: never propagate a title-only request to all site blocks.
 const scopedCardAlignment=instruction.match(/^na\s+se[cç][aã]o\s+["“]([^"”]+)["”]\s*,?\s*centralize\s+o\s+t[ií]tulo\s+principal\s+da\s+se[cç][aã]o\s+e\s+os\s+t[ií]tulos\s+dos\s+(?:tr[eê]s|3)\s+cards\b/i);
 if(scopedCardAlignment){
  const section=resolveUniversalSection(site,scopedCardAlignment[1]);
  if(!section)return {ok:false,error:"Seção solicitada não encontrada. Nenhuma alteração aplicada."};
  const blocks=site.blocks.filter(b=>b.section===section);
  const headings=blocks.filter(b=>b.type==="heading");
  const descriptions=blocks.filter(b=>b.type==="paragraph");
  if(headings.length!==4||descriptions.length!==3)return {ok:false,error:"A seção não possui exatamente um título principal e três cards editáveis. Nenhuma alteração aplicada."};
  const ops:UniversalOperation[]=[
   ...headings.filter(b=>b.align!=="center").map(b=>({action:"update" as const,blockId:b.id,changes:{align:"center"}})),
   ...descriptions.filter(b=>b.align!=="left"||b.cardTitleAlign!=="center").map(b=>({action:"update" as const,blockId:b.id,changes:{align:"left",cardTitleAlign:"center"}}))
  ];
  if(!ops.length)return {ok:true,site,changedIds:[]};
  return applyUniversalOperations(site,ops);
 }
 // Paired hero copy must be committed atomically, not partially by a single-action matcher.
 const pairedHeroCopy=instruction.match(/^(?:na\s+(?:primeira\s+se[cç][aã]o|capa|hero)\s*,?\s*)?(?:altere|troque|mude|substitua)\s+o\s+t[ií]tulo\s+(?:principal\s+)?(?:da\s+capa\s+)?para\s+["“]([^"”]+)["”]\s+e\s+o\s+subt[ií]tulo\s+para\s+["“]([^"”]+)["”]/i);
 if(pairedHeroCopy){
  const hero=resolveUniversalSection(site,"capa")||site.blocks.find(b=>b.type==="heading")?.section;
  const heading=site.blocks.find(b=>b.section===hero&&b.type==="heading");
  const subtitle=site.blocks.find(b=>b.section===hero&&b.type==="paragraph");
  if(!heading||!subtitle)return {ok:false,error:"Título e subtítulo da capa precisam ser editáveis. Nenhuma alteração aplicada."};
  return applyUniversalOperations(site,[
   {action:"update",blockId:heading.id,changes:{text:pairedHeroCopy[1]}},
   {action:"update",blockId:subtitle.id,changes:{text:pairedHeroCopy[2]}}
  ]);
 }
 const batch=applyUniversalHeadingBatch(site,instruction);
 if(batch)return batch;
 // A practical matcher may recognize only the first action in a combined request.
 // Defer multi-action instructions to the atomic clause processor below.
 // A preservation sentence is not a second mutation. The practical hero-photo
 // handler strips preservation constraints and must run before the AI fallback.
 // Previously, sentence splitting routed this request to the legacy editor,
 // which could acknowledge an edit without changing the rendered hero.
 const combinedHeroPhoto=/^(?:substitua|troque|altere|mude)\s+(?:(?:somente|apenas)\s+)?(?:a\s+)?(?:imagem|foto|fotografia)\s+(?:(?:principal|de\s+fundo)\s+)?(?:da\s+(?:primeira\s+se[cç][aã]o|capa|hero)|do\s+(?:hero|banner))\s+(?:por|pela|para)\s+/i.test(instruction)
  && /[,;]\s*(?:troque|altere|mude|substitua|mova|remova|adicione|crie|inclua|insira)\b/i.test(instruction);
 const practical=combinedHeroPhoto?null:applyUniversalPracticalEdit(site,instruction);
 if(practical)return practical;
 const scopedText=parseUniversalCopyEdit(site,instruction);
 if(scopedText){
  if("error" in scopedText)return {ok:false,error:scopedText.error};
  // A semantic rewrite must be generated by the server. Never apply half an edit.
  if(scopedText.intent.generateText)return null;
  return applyUniversalCopyEdit(site,scopedText.intent);
 }
 const cardRequest=parseUniversalCardEdit(site,instruction);
 if(cardRequest){
  if("error" in cardRequest)return {ok:false,error:cardRequest.error};
  // Missing descriptive copy must be written in the scoped server-side AI path,
  // never acknowledged as a partial local title edit.
  if(cardRequest.intent.generateDescription)return null;
  return applyUniversalCardEdit(site,cardRequest.intent);
 }
 // Handle explicitly quoted hero heading/description edits before generic matching.
 // Accept "somente", optional "da capa", preservation clauses and paired requests.
 const heroTitleEdit=instruction.match(/(?:altere|troque|mude|substitua|defina)\s+(?:somente\s+)?o\s+t[ií]tulo\s+principal(?:\s+(?:da\s+)?capa)?\s+(?:para|por|como)\s+["“]([^"”]+)["”]/i);
 const heroDescriptionEdit=instruction.match(/(?:altere|troque|mude|substitua|defina)\s+(?:somente\s+)?a\s+descri[cç][aã]o(?:\s+(?:da\s+)?capa)?\s+(?:para|por|como)\s+["“]([^"”]+)["”]/i)
  ||(heroTitleEdit?instruction.match(/\be\s+a\s+descri[cç][aã]o(?:\s+(?:da\s+)?capa)?\s+(?:para|por|como)\s+["“]([^"”]+)["”]/i):null);
 if(heroTitleEdit||heroDescriptionEdit){
  const hero=resolveUniversalSection(site,"capa");
  if(!hero)return {ok:false,error:"Capa não encontrada. Nenhuma alteração aplicada."};
  const heroBlocks=site.blocks.filter(b=>b.section===hero);
  const heading=heroBlocks.find(b=>b.type==="heading");
  const description=heroBlocks.find(b=>b.type==="paragraph");
  if((heroTitleEdit&&!heading)||(heroDescriptionEdit&&!description))
   return {ok:false,error:"Título ou descrição da capa não encontrado. Nenhuma alteração aplicada."};
  const operations:UniversalOperation[]=[];
  if(heroTitleEdit&&heading)operations.push({action:"update",blockId:heading.id,changes:{text:heroTitleEdit[1]}});
  if(heroDescriptionEdit&&description)operations.push({action:"update",blockId:description.id,changes:{text:heroDescriptionEdit[1]}});
  return applyUniversalOperations(site,operations);
 }
 // Explicit section introduction must not fall through to generic paragraph/card selection.
 const introRequest=/\b(?:par[aá]grafo\s+introdut[oó]rio|texto\s+introdut[oó]rio)\b/i.test(instruction)
  &&/\b(?:se[cç][aã]o\s+(?:de\s+)?servi[cç]os|servi[cç]os)\b/i.test(instruction);
 if(introRequest){
  const section=resolveUniversalSection(site,"serviços");
  const value=instruction.match(/\b(?:para|por)\s*:\s*["“]([^"”]+)["”]/i)?.[1]
   ||instruction.match(/\b(?:para|por)\s*:\s*([\s\S]*?)(?=\.\s*(?:N[aã]o\s+altere|Mantenha|Preserve)\b|$)/i)?.[1]?.trim().replace(/^["“]|["”]\s*$/g,"");
  if(!section||!value)return {ok:false,error:"Não foi possível identificar a introdução e o texto solicitado. Nenhuma alteração aplicada."};
  const blocks=site.blocks.filter(b=>b.section===section);
  const heading=blocks.find(b=>b.type==="heading");
  if(!heading)return {ok:false,error:"Título da seção de serviços não encontrado. Nenhuma alteração aplicada."};
  // Section introduction is anchored immediately after the section heading.
  const index=site.blocks.findIndex(b=>b.id===heading.id);
  const following=site.blocks.slice(index+1).find(b=>b.section===section&&b.type==="paragraph");
  const candidate=following&&(!/^[^:]{2,60}:\s+\S/.test(String(following.text||"")))?following:null;
  if(candidate)return applyUniversalOperations(site,[{action:"update",blockId:candidate.id,changes:{text:value}}]);
  const id="universal-services-intro-"+Date.now().toString(36);
  return applyUniversalOperations(site,[{action:"add",afterId:heading.id,block:{id,type:"paragraph",section,text:value}}]);
 }
 // Resolve natural-language card repair requests atomically, before splitting context sentences.
 const serviceRepair=/\b(?:servi[cç]os|primeiros?\s+cards?)\b/i.test(instruction)
  &&/\b(?:primeiro|segundo)\s+card\b/i.test(instruction)
  &&/\b(?:substitua|defina|altere)\b/i.test(instruction);
 const titleReplacement=instruction.match(/(?:substitua|troque|altere)\s+o\s+t[ií]tulo\s+["“]([^"”]+)["”]\s+(?:por|para)\s+["“]([^"”]+)["”]/i);
 const descriptionReplacement=instruction.match(/(?:a\s+)?descri[cç][aã]o\s+atual\s+(?:por|para)\s+["“]([^"”]+)["”]/i);
 const secondTitle=instruction.match(/(?:no\s+segundo\s+card|segundo\s+card)[^.]*?(?:defina|altere|troque|substitua)\s+o\s+t[ií]tulo\s+(?:como|para|por)\s+["“]([^"”]+)["”]/i);
 if(serviceRepair&&(titleReplacement||descriptionReplacement||secondTitle)){
  const section=resolveUniversalSection(site,"serviços");
  if(!section)return {ok:false,error:"Seção de serviços não encontrada. Nenhuma alteração aplicada."};
  const blocks=site.blocks.filter(b=>b.section===section);
  const sectionHeading=blocks.find(b=>b.type==="heading");
  const headings=blocks.filter(b=>b.type==="heading"&&b.id!==sectionHeading?.id);
  const intro=blocks.find(b=>b.type==="paragraph");
  const descriptions=blocks.filter(b=>b.type==="paragraph"&&b.id!==intro?.id);
  const ops:UniversalOperation[]=[];
  if(titleReplacement){
   const target=headings[0];
   if(!target)return {ok:false,error:"Título do primeiro card não encontrado. Nenhuma alteração aplicada."};
   if(target.text!==titleReplacement[1]&&target.text!==titleReplacement[2])return {ok:false,error:"Título atual do primeiro card não corresponde ao solicitado. Nenhuma alteração aplicada."};
   ops.push({action:"update",blockId:target.id,changes:{text:titleReplacement[2]}});
  }
  if(descriptionReplacement){
   if(!descriptions[0])return {ok:false,error:"Descrição do primeiro card não encontrada. Nenhuma alteração aplicada."};
   ops.push({action:"update",blockId:descriptions[0].id,changes:{text:descriptionReplacement[1]}});
  }
  if(secondTitle){
   if(!headings[1])return {ok:false,error:"Título do segundo card não encontrado. Nenhuma alteração aplicada."};
   ops.push({action:"update",blockId:headings[1].id,changes:{text:secondTitle[1]}});
  }
  return applyUniversalOperations(site,ops);
 }
 // Atomic service-card copy edits: map visible ordinal cards, not the section introduction.
 const serviceCopy=/\b(?:se[cç][aã]o\s+(?:de\s+)?servi[cç]os|card\s+(?:da\s+)?se[cç][aã]o\s+(?:de\s+)?servi[cç]os)\b/i.test(instruction);
 const cardTitle=[...instruction.matchAll(/(?:altere|troque|mude|substitua)\s+o\s+t[ií]tulo\s+do\s+(primeiro|segundo|terceiro|quarto)\s+card\s+(?:para|por)\s+["“]([^"”]+)["”]/gi)];
 const cardDescription=[...instruction.matchAll(/(?:altere|troque|mude|substitua)\s+a\s+descri[cç][aã]o\s+(?:desse\s+mesmo|do\s+(?:primeiro|segundo|terceiro|quarto))\s+card\s+(?:para|por)\s+["“]([^"”]+)["”]/gi)];
 if(serviceCopy&&(cardTitle.length||cardDescription.length)){
  const section=resolveUniversalSection(site,"serviços");
  if(!section)return {ok:false,error:"Seção de serviços não identificada. Nenhuma alteração aplicada."};
  const blocks=site.blocks.filter(b=>b.section===section);
  // Renderer contract: first paragraph is section intro; card titles are separate headings.
  const allParagraphs=blocks.filter(b=>b.type==="paragraph");
  const paragraphs=allParagraphs.slice(1);
  const headings=blocks.filter(b=>b.type==="heading").slice(1);
  const sectionHeading=blocks.find(b=>b.type==="heading");
  const ordinal=(word:string)=>({primeiro:0,segundo:1,terceiro:2,quarto:3} as Record<string,number>)[word.toLowerCase()];
  const ops:UniversalOperation[]=[];
  const titles=new Map<number,string>();
  const descriptions=new Map<number,string>();
  for(const match of cardTitle)titles.set(ordinal(match[1]),match[2]);
  for(const match of cardDescription){
   const index=/desse\s+mesmo/i.test(match[0])?(cardTitle.length?ordinal(cardTitle[0][1]):-1):ordinal(match[0].match(/(?:primeiro|segundo|terceiro|quarto)/i)?.[0]||"");
   descriptions.set(index,match[1]);
  }
  for(const [index,value] of descriptions){
   if(index<0||!paragraphs[index])return {ok:false,error:"Descrição do card "+(index+1)+" não encontrada. Nenhuma alteração aplicada."};
   ops.push({action:"update",blockId:paragraphs[index].id,changes:{text:value}});
  }
  // Materialize missing card-heading overrides in ordinal order, without modifying intro.
  if(titles.size){
   if(!sectionHeading)return {ok:false,error:"Título da seção não encontrado. Nenhuma alteração aplicada."};
   const max=Math.max(...titles.keys());
   let afterId=sectionHeading.id;
   for(let index=0;index<=max;index++){
    const heading=headings[index];
    if(heading){
     if(titles.has(index))ops.push({action:"update",blockId:heading.id,changes:{text:titles.get(index)!}});
     afterId=heading.id;
    }else{
     const id="universal-service-card-title-"+index+"-"+Date.now().toString(36);
     const label=titles.get(index)||String(paragraphs[index]?.text||"").split(":")[0].trim();
     if(!label)return {ok:false,error:"Título do card "+(index+1)+" não identificado. Nenhuma alteração aplicada."};
     ops.push({action:"add",afterId,block:{id,type:"heading",section,text:label}});
     afterId=id;
    }
   }
  }
  return applyUniversalOperations(site,ops);
 }
 const timelineLayout=applyProcessTimelineLayout(site,instruction);
 if(timelineLayout)return timelineLayout;
 const processReorder=applyProcessStepReorder(site,instruction);
 if(processReorder)return processReorder;
 const processRevision=applyProcessStepRevision(site,instruction);
 if(processRevision)return processRevision;
 const naturalSection=applyNaturalSectionCreation(site,instruction);
 if(naturalSection)return naturalSection;
 const structured=applyStructuredSectionBrief(site,instruction);
 if(structured)return structured;
 // Atomic two-field hero restoration/edit, independent of visual template.
 // Explicit field labels prevent the description from ever being written into a heading.
 const heroFields=/\b(?:na\s+capa|capa\s+do\s+site|hero)\b/i.test(instruction)
  &&/\bt[ií]tulo\s+principal\s*:/i.test(instruction)
  &&/\bdescri[cç][aã]o\s+(?:abaixo\s+do\s+t[ií]tulo|da\s+capa)?\s*:/i.test(instruction);
 if(heroFields){
  const title=instruction.match(/t[ií]tulo\s+principal\s*:\s*["“]([^"”]+)["”]/i)?.[1];
  const description=instruction.match(/descri[cç][aã]o\s+(?:abaixo\s+do\s+t[ií]tulo|da\s+capa)?\s*:\s*["“]([^"”]+)["”]/i)?.[1];
  const hero=resolveUniversalSection(site,"capa");
  if(!title||!description||!hero)return {ok:false,error:"Informe título e descrição entre aspas e identifique a capa. Nenhuma alteração aplicada."};
  const headings=site.blocks.filter(b=>b.section===hero&&b.type==="heading");
  const paragraphs=site.blocks.filter(b=>b.section===hero&&b.type==="paragraph");
  if(headings.length!==1||paragraphs.length!==1)return {ok:false,error:"Não foi possível identificar um único título e uma única descrição na capa. Nenhuma alteração aplicada."};
  return applyUniversalOperations(site,[
   {action:"update",blockId:headings[0].id,changes:{text:title}},
   {action:"update",blockId:paragraphs[0].id,changes:{text:description}}
  ]);
 }
 // Scoped CTA theme override: keep section backgrounds, headings and images untouched.
 const siteCtaColor=instruction.match(/^\s*(?:altere|troque|mude|defina|atualize)\s+(?:a\s+)?cor\s+(?:de\s+fundo\s+)?de\s+todos\s+os\s+bot[oõ]es\s+principais\s+(?:do\s+site\s+)?(?:para|por)\s+(azul[\s-]*marinho(?:\s+escuro)?|#[0-9a-f]{3,6}|preto|branco|verde|vermelho|azul|dourado)(?:[.!?\s]|$)/i);
 if(siteCtaColor){
  const raw=siteCtaColor[1].toLowerCase().trim();
  const color=/^azul[\s-]*marinho/.test(raw)?"#1E3A5F":raw==="preto"?"#000000":raw==="branco"?"#FFFFFF":raw==="verde"?"#16A34A":raw==="vermelho"?"#DC2626":raw==="azul"?"#2563EB":raw==="dourado"?"#D4AF37":raw;
  const expanded=/^#[0-9a-f]{3}$/i.test(color)?"#"+color.slice(1).split("").map(x=>x+x).join(""):color;
  return {ok:true,site:{...site,universalPrimaryCtaColor:expanded} as T,changedIds:["primary-cta-theme"]};
 }
 // Universal hero CTA label-only edit: preserve the existing URL and all other properties.
 const heroButtonColor=instruction.match(/^(?:altere|troque|mude|defina)\s+a\s+cor\s+de\s+fundo\s+do\s+bot[aã]o\s+principal\s+da\s+capa\s+(?:para|por)\s+(?:preto\s*)?\(?\s*(#[0-9a-f]{3,8})\s*\)?\.?(?:\s+(?:mantenha|preserve|n[aã]o\s+altere)\b[\s\S]*)?$/i);
 if(heroButtonColor){
  const hero=resolveUniversalSection(site,"capa");
  if(!hero)return {ok:false,error:"Não foi possível localizar a capa. Nenhuma alteração aplicada."};
  const buttons=site.blocks.filter(b=>b.section===hero&&b.type==="button");
  const primary=buttons.filter(b=>["primary","principal","main"].includes(String(b.role||b.variant||b.ctaRole||"").toLowerCase()));
  const linked=buttons.filter(b=>typeof b.href==="string"&&b.href.trim()&&!b.href.startsWith("#"));
  const target=primary.length===1?primary[0]:linked.length===1?linked[0]:buttons[0];
  if(!target)return {ok:false,error:"Botão principal da capa não encontrado. Nenhuma alteração aplicada."};
  return applyUniversalOperations(site,[{action:"update",blockId:target.id,changes:{background:heroButtonColor[1]}}]);
 }
 const heroImageUrl=instruction.match(/^(?:substitua|troque|altere|mude)\s+somente\s+a\s+imagem\s+principal\s+da\s+capa(?:\s+do\s+site)?\s+pela\s+fotografia\s+dispon[ií]vel\s+nesta\s+url\s*:\s*(https:\/\/[^\s]+)(?:\s+(?:mantenha|preserve|n[aã]o\s+altere)\b[\s\S]*)?$/i);
 if(heroImageUrl){
  const hero=resolveUniversalSection(site,"capa");
  if(!hero)return {ok:false,error:"Não foi possível localizar a capa. Nenhuma alteração aplicada."};
  const images=site.blocks.filter(b=>b.section===hero&&b.type==="image");
  if(!images.length)return {ok:false,error:"Imagem principal da capa não encontrada. Nenhuma alteração aplicada."};
  const src=heroImageUrl[1].replace(/[.,;]+$/,"");
  return applyUniversalOperations(site,[{action:"update",blockId:images[0].id,changes:{src}}]);
 }
 const heroCtaRequest=instruction.match(/^(?:altere|troque|mude|substitua)\s+o\s+texto\s+do\s+bot[aã]o\s+principal\s+da\s+capa\s+(?:para|por)\s+["“]([^"”]+)["”"]\s*\.?\s*(?:(?:mantenha|preserve|n[aã]o\s+altere)\b[\s\S]*)?$/i);
 if(heroCtaRequest){
  const hero=resolveUniversalSection(site,"capa");
  if(!hero)return {ok:false,error:"Não foi possível localizar a capa. Nenhuma alteração aplicada."};
  const buttons=site.blocks.filter(b=>b.section===hero&&b.type==="button");
  if(buttons.length===1)return applyUniversalOperations(site,[{action:"update",blockId:buttons[0].id,changes:{text:heroCtaRequest[1]}}]);
  if(buttons.length>1){
   // Primary CTA is the first actionable button in hero document order.
   // Prefer explicit semantic roles when supplied by a renderer.
   const primary=buttons.filter(b=>["primary","principal","main"].includes(String(b.role||b.variant||b.ctaRole||"").toLowerCase()));
   if(primary.length===1)return applyUniversalOperations(site,[{action:"update",blockId:primary[0].id,changes:{text:heroCtaRequest[1]}}]);
   const linked=buttons.filter(b=>typeof b.href==="string"&&b.href.trim()&&!b.href.startsWith("#"));
   if(linked.length===1)return applyUniversalOperations(site,[{action:"update",blockId:linked[0].id,changes:{text:heroCtaRequest[1]}}]);
   // TP1 Model 02 renders heroBlocks.find(type === "button") as its primary CTA.
   // Match that renderer contract: first button within the resolved hero section.
   // Secondary hardcoded anchor links are not universal button blocks.
   return applyUniversalOperations(site,[{action:"update",blockId:buttons[0].id,changes:{text:heroCtaRequest[1]}}]);
  }
  // Some approved templates render the hero CTA from site.header when no hero button block exists.
  // Materialize a section-scoped override instead of changing header.ctaLabel globally.
  const header=site.header as {ctaLabel?:unknown;ctaHref?:unknown}|undefined;
  const href=typeof header?.ctaHref==="string"?header.ctaHref.trim():"";
  const originalLabel=typeof header?.ctaLabel==="string"?header.ctaLabel.trim():"";
  if(!originalLabel||!href)return {ok:false,error:"O botão da capa não possui um bloco editável nem um CTA configurado. Nenhuma alteração aplicada."};
  const existingIds=new Set(site.blocks.map(b=>b.id));
  let id="universal-hero-primary-cta",suffix=1;
  while(existingIds.has(id))id="universal-hero-primary-cta-"+suffix++;
  const anchor=site.blocks.filter(b=>b.section===hero).at(-1);
  if(!anchor)return {ok:false,error:"A capa não possui blocos editáveis. Nenhuma alteração aplicada."};
  return applyUniversalOperations(site,[{action:"add",afterId:anchor.id,block:{id,type:"button",section:hero,text:heroCtaRequest[1],href}}]);
 }
 const actionableInstruction=instruction.replace(/^\s*quero\s+(?:(?:fazer|realizar|pedir)\s+(?:algumas?\s+)?(?:altera[cç][oõ]es|mudan[cç]as|edi[cç][oõ]es)|personalizar|editar|modificar)\s+(?:(?:no|neste|nesse|o)\s+)?site[^:\r\n]{0,160}:\s*/i,"").trim();
 // Preservation sentences are constraints, not mutations. Remove them only at
 // sentence boundaries so an action containing "preservando" stays intact.
 const mutationInstruction=actionableInstruction
  .replace(/(?:^|[.!?]\s+)(?:preserve|mantenha|n[aã]o\s+(?:altere|modifique|mexa))\b[^\r\n]*/gi,"")
  .trim();
 const clauses=universalInstructionClauses(mutationInstruction)
  .map(clause=>clause.replace(/^\s*\d{1,2}[.)]\s*/,"").trim())
  .filter(clause=>!/^quero\s+(?:fazer|realizar|pedir)\s+(?:algumas?\s+)?(?:altera[cç][oõ]es|mudan[cç]as|edi[cç][oõ]es)\s+(?:no|neste|nesse)\s+site\b[^:]*:?\s*$/i.test(clause))
  .filter(clause=>! /^(?:n[aã]o\s+(?:altere|modifique|mexa)|preserve|mantenha)\b/i.test(clause));
 if(clauses.length>20)return {ok:false,error:"Divida o pedido em até 20 alterações por mensagem. Nenhuma alteração aplicada."};
 let current=site;const changedIds:string[]=[];
 for(const clause of clauses){
  // Resolve "dessa seção" only when an earlier clause in this atomic request
  // uniquely identified the section. Never guess from a different site block.
  const actionableClause=clause.replace(/\s*[.!?]\s*(?:n[aã]o\s+modifique|n[aã]o\s+altere|preserve|mantenha)\b[\s\S]*$/i,"").trim();
  const contextualTitle=actionableClause.match(/^(?:deixe|altere|mude|troque|coloque)\s+o\s+t[ií]tulo\s+dessa\s+se[cç][aã]o\s+(?:na\s+cor\s+|para\s+|em\s+)(?:cor\s+)?(amarel[oa]|pret[oa]|branc[oa]|azul|verde|vermelh[oa]|laranja|rox[oa]|rosa|#[0-9a-fA-F]{6})\s*[.!?]?$/i);
  const previousSections=[...new Set(changedIds.filter(id=>id.startsWith("section-style:")).map(id=>id.slice("section-style:".length)))];
  let contextualResult:UniversalResult<T>|null=null;
  if(contextualTitle&&previousSections.length===1){
   const colors:Record<string,string>={amarelo:"#EAB308",amarela:"#EAB308",preto:"#000000",preta:"#000000",branco:"#FFFFFF",branca:"#FFFFFF",azul:"#2563EB",verde:"#16A34A",vermelho:"#DC2626",vermelha:"#DC2626",laranja:"#F97316",roxo:"#9333EA",roxa:"#9333EA",rosa:"#EC4899"};
   const color=colors[contextualTitle[1].toLowerCase()]||contextualTitle[1];
   const section=previousSections[0];
   const raw=(current as Record<string,unknown>).universalSectionStyles;
   const styles=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
   const previous=styles[section];
   contextualResult={ok:true,site:{...current,universalSectionStyles:{...styles,[section]:{...(previous&&typeof previous==="object"&&!Array.isArray(previous)?previous:{}),headingColor:color}}} as T,changedIds:["section-heading-color:"+section]};
  }
  // ID and quoted-label commands remain backward compatible.
  const result=contextualResult||applyVisibleEditorCommand(current,clause)||applySingleUniversalNaturalLanguage(current,clause)||applyUniversalNamedLanguage(current,clause);
  if(!result){
   if(clauses.length===1)return null;
   return {ok:false,error:"Não foi possível interpretar com segurança uma parte do pedido: “"+clause+"”. Nenhuma alteração aplicada. Detalhe o elemento, conteúdo ou destino desejado."};
  }
  if(!result.ok)return result;
  current=result.site;changedIds.push(...result.changedIds);
 }
 return changedIds.length?{ok:true,site:current,changedIds:[...new Set(changedIds)]}:null;
}
