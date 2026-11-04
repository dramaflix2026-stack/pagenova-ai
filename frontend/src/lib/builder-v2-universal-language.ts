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
 const heroCopy=text.match(/^(?:altere|troque|mude|substitua)\s+a\s+(?:descri[cç][aã]o|subt[ií]tulo)\s+(?:(?:logo\s+)?abaixo\s+do\s+t[ií]tulo\s+principal\s+|principal\s+)?(?:da\s+)?capa\s+(?:para|por)\s+["“]([^"”]+)["”"]\s*\.?$/i);
 if(heroCopy)return hero?update(site.blocks.filter(b=>b.section===hero&&b.type==="paragraph"),heroCopy[1],"descrição da capa"):fail("capa");
 const heroTitle=text.match(/^(?:altere|troque|mude|substitua)\s+o\s+t[ií]tulo\s+principal\s+(?:da\s+)?capa\s+(?:para|por)\s+["“]([^"”]+)["”]$/i);
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
export function applyUniversalNaturalLanguage<T extends UniversalSite>(site:T,instruction:string):UniversalResult<T>|null{
 const timelineLayout=applyProcessTimelineLayout(site,instruction);
 if(timelineLayout)return timelineLayout;
 const processReorder=applyProcessStepReorder(site,instruction);
 if(processReorder)return processReorder;
 const processRevision=applyProcessStepRevision(site,instruction);
 if(processRevision)return processRevision;
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
 // Universal hero CTA label-only edit: preserve the existing URL and all other properties.
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
  .replace(/(?:^|[.!?]\s+)(?:preserve|mantenha|n[aã]o\s+altere)\b[^\r\n]*/gi,"")
  .trim();
 const clauses=universalInstructionClauses(mutationInstruction)
  .map(clause=>clause.replace(/^\s*\d{1,2}[.)]\s*/,"").trim())
  .filter(clause=>!/^quero\s+(?:fazer|realizar|pedir)\s+(?:algumas?\s+)?(?:altera[cç][oõ]es|mudan[cç]as|edi[cç][oõ]es)\s+(?:no|neste|nesse)\s+site\b[^:]*:?\s*$/i.test(clause))
  .filter(clause=>! /^(?:n[aã]o\s+altere|preserve|mantenha)\b/i.test(clause));
 if(clauses.length>20)return {ok:false,error:"Divida o pedido em até 20 alterações por mensagem. Nenhuma alteração aplicada."};
 let current=site;const changedIds:string[]=[];
 for(const clause of clauses){
  // ID and quoted-label commands remain backward compatible.
  const result=applyVisibleEditorCommand(current,clause)||applySingleUniversalNaturalLanguage(current,clause)||applyUniversalNamedLanguage(current,clause);
  if(!result){
   if(clauses.length===1)return null;
   return {ok:false,error:"Não foi possível interpretar com segurança uma parte do pedido: “"+clause+"”. Nenhuma alteração aplicada. Detalhe o elemento, conteúdo ou destino desejado."};
  }
  if(!result.ok)return result;
  current=result.site;changedIds.push(...result.changedIds);
 }
 return changedIds.length?{ok:true,site:current,changedIds:[...new Set(changedIds)]}:null;
}
