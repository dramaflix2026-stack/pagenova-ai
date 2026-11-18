import {applyUniversalOperations,type UniversalSite,type UniversalResult,type UniversalOperation} from "./builder-v2-universal-operations.ts";

/**
 * Safe renderer-aware adaptation for sections that live in dedicated premium
 * components (and therefore are not in the generated block inventory).
 * Recognizes TWO independent placement constraints and preserves user-provided
 * card titles and descriptions; never invents an anchor or mutates other copy.
 */
const normalized=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").replace(/[.!?]+$/,"").trim();
const quote=(s:string)=>s.trim().replace(/^["“”'‘’]+|["“”'‘’]+$/g,"").trim();
const floralAnchors:ReadonlyArray<{id:string;labels:string[]}>= [
 {id:"depoimentos",labels:["depoimentos","historias em cada flor","depoimentos dos clientes"]},
 {id:"como-comprar",labels:["como comprar","como funciona","processo","um processo tao especial quanto as flores"]},
 {id:"perguntas-frequentes",labels:["faq","perguntas frequentes","cada detalhe importa","duvidas frequentes"]}
];
export const resolveRenderedFloralAnchor=(label:string):string|null=>{
 const key=normalized(quote(label));
 const matches=floralAnchors.filter(item=>item.id===key||item.labels.includes(key));
 return matches.length===1?matches[0].id:null;
};
const allowed=(site:UniversalSite)=>{
 const info=site as UniversalSite&{niche?:string;title?:string;header?:{brand?:string};briefingLayoutVariant?:string};
 return info.briefingLayoutVariant==="01"&&/floricultur/i.test(info.niche||"")&&
 /(?:floricultur|atelier floral|jardim de ambar)/.test(normalized([info.title,info.header?.brand,info.niche].filter(Boolean).join(" ")));
};
const slug=(name:string)=>normalized(name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export const floricultureCustomSectionId=(name:string)=>"custom-"+slug(name);
export function applyRenderedFloricultureSectionCreation<T extends UniversalSite>(
 site:T,instruction:string
):UniversalResult<T>|null{
 if(!allowed(site)||typeof instruction!=="string"||instruction.length>3200||!site.blocks?.length)return null;
 const start=instruction.match(/^\s*(?:adicione|crie|inclua|insira)\s+uma\s+(?:nova\s+)?se[cç][aã]o\s+(?:chamada|denominada)\s+(.+?)(?=\s*,\s*|\s+(?:imediatamente\s+)?(?:antes|depois|ap[oó]s)\b|[.\r\n])/iu);
 if(!start)return null;
 const name=quote(start[1]);
 if(name.length<3||name.length>90||/[<>]/.test(name))return {ok:false,error:"Nome da seção inválido. O projeto foi preservado."};
 const firstLine=instruction.split(/(?<!\d)\.\s*(?:\n|$)/)[0];
 const following=firstLine.match(/\b(?:imediatamente\s+|logo\s+)?(?:depois|ap[oó]s)\s+(?:(?:da|do|de)\s+)?(?:se[cç][aã]o\s+)?(.+?)(?=\s+e\s+(?:imediatamente\s+)?antes\b|\s*,\s*(?:e\s+)?antes\b|[.!?]|$)/iu);
 const preceding=firstLine.match(/\b(?:e\s+)?(?:imediatamente\s+)?antes\s+(?:(?:da|do|de)\s+)?(?:se[cç][aã]o\s+)?(.+?)(?=[.!?]|$)/iu);
 // "Immediately before the footer" is already a complete placement constraint.
 // Never ask the customer to supply the preceding section for this request.
 const footerOnly=/\b(?:imediatamente\s+|logo\s+)?antes\s+(?:(?:do|da)\s+)?(?:rodap[eé]|footer)\b/iu.test(firstLine);
 if(footerOnly&&!following){
  return {ok:false,error:"A posição antes do rodapé foi reconhecida automaticamente, mas a inserção ainda não possui comprovação visual neste layout. Nenhuma alteração aplicada; não aprove esta tentativa."};
 }
 if(!following||!preceding)return {ok:false,error:"Informe duas referências: depois de qual seção e antes de qual seção. Nenhuma alteração aplicada."};
 const after=resolveRenderedFloralAnchor(following[1]),before=resolveRenderedFloralAnchor(preceding[1]);
 if(!after||!before)return {ok:false,error:"A referência visual não foi identificada: depois de '"+quote(following[1])+"', antes de '"+quote(preceding[1])+"'. Nenhuma alteração aplicada."};
 const order=floralAnchors.map(s=>s.id);
 if(order.indexOf(after)===-1||order.indexOf(before)!==order.indexOf(after)+1)
  return {ok:false,error:"As referências não são seções consecutivas do layout aprovado. Nenhuma alteração aplicada."};
 const cards=[...instruction.matchAll(/(?:^|\n)\s*(\d{1,2})[.)]\s*([^\n:—–]{2,100}?)\s*(?:[:—–])\s*([^\n]{5,500})/g)]
  .map(x=>({number:Number(x[1]),title:x[2].trim(),description:x[3].trim()}));
 const expected=instruction.match(/\b(?:crie|adicione|inclua|contendo|com)\s+(?:até\s+)?(tr[eê]s|quatro|cinco|seis|\d{1,2})\s+cards?\b/iu)?.[1];
 const amounts:{[key:string]:number}={tres:3,quatro:4,cinco:5,seis:6};
 const count=expected?(amounts[normalized(expected)]??Number(expected)):cards.length;
 if(!Number.isInteger(count)||count<1||count>12||cards.length!==count||cards.some((x,i)=>x.number!==i+1||!x.title||!x.description))
  return {ok:false,error:"Os cards não correspondem à quantidade e ao conteúdo informado. Nenhuma alteração aplicada."};
 if(new Set(cards.map(x=>normalized(x.title))).size!==cards.length)return {ok:false,error:"Cards duplicados. Nenhuma alteração aplicada."};
 const id=floricultureCustomSectionId(name);
 if(!id||id==="custom-"||site.blocks.some(b=>b.section===id))return {ok:false,error:"Essa seção já existe ou possui identificação inválida. Nenhuma duplicação aplicada."};
 const lastBeforeFooter=site.blocks.findIndex(b=>/^(?:footer|rodape)(?:[-_]|$)/i.test(b.section||""));
 const anchorIndex=lastBeforeFooter<0?site.blocks.length-1:lastBeforeFooter-1;
 if(anchorIndex<0)return {ok:false,error:"Não há posição segura antes do rodapé para salvar a seção."};
 const entries=[
  {type:"heading",text:name},
  {type:"paragraph",text:"Orientações simples para conservar a beleza das flores por mais tempo."},
  ...cards.flatMap(card=>[{type:"heading",text:card.title},{type:"paragraph",text:card.description}])
 ];
 const operations:UniversalOperation[]=[];
 let afterId=site.blocks[anchorIndex].id;
 for(let i=0;i<entries.length;i++){
  const block={id:id+"-"+i,section:id,...entries[i]};
  operations.push({action:"add",block,afterId});afterId=block.id;
 }
 const result=applyUniversalOperations(site,operations);
 if(!result.ok)return result;
 const events=(result.site.universalSectionEvents||[]);
 const placement={action:"move" as const,section:{id,label:name},
  after:{id:after,label:following[1].trim()},before:{id:before,label:preceding[1].trim()}};
 return {...result,site:{...result.site,universalSectionEvents:[...events,placement]} as T};
}


/** Single-anchor placement for the rendered TP6 M01 footer. No invented second anchor. */
export function applyFloralBeforeFooterCards<T extends UniversalSite>(site:T,instruction:string):UniversalResult<T>|null{
 if(!allowed(site)||!site.blocks?.length)return null;
 const first=instruction.split(/\.\s+(?=[A-ZÀ-Ú])/u)[0]||"";
 const match=first.match(/^\s*(?:adicione|crie|inclua|insira)\s+uma\s+(?:nova\s+)?se[cç][aã]o\s+(?:chamada|denominada)\s+["“]?([^"”]+?)["”]?\s*,?\s+imediatamente\s+antes\s+do\s+rodap[eé]/iu);
 if(!match)return null;
 const name=quote(match[1]);
 if(name.length<3||name.length>90)return {ok:false,error:"Título inválido; nenhuma edição aplicada."};
 const requested=first.match(/\b(?:com|contendo)\s+tr[eê]s\s+cards?\s*:\s*(.+)$/iu);
 if(!requested)return {ok:false,error:"Informe os três títulos dos cards; nenhuma edição aplicada."};
 const titles=[...requested[1].matchAll(/["“]([^"”]+)["”]/gu)].map(x=>x[1].trim());
 if(titles.length!==3||new Set(titles.map(normalized)).size!==3)return {ok:false,error:"Não foram identificados três cards distintos; nenhuma edição aplicada."};
 const id=floricultureCustomSectionId(name);
 const current=(site as T&{tp6RetailEdits?:{addedSections?:Array<{id:string}>}}).tp6RetailEdits;
 if(current?.addedSections?.some(s=>s.id===id))return {ok:false,error:"Essa seção já existe; nenhuma duplicação aplicada."};
 const descriptions=[
  "Renove a água do vaso com frequência para manter as flores frescas por mais tempo.",
  "Prefira um local arejado, com luz indireta, longe do calor excessivo.",
  "Corte as pontas dos caules em diagonal para facilitar a absorção de água."
 ];
 const cards=titles.map((title,i)=>({title,description:descriptions[i]}));
 const before=site as T&{tp6RetailEdits?:{addedSections?:Array<{id:string}>}};
 const after={...before,tp6RetailEdits:{...(before.tp6RetailEdits||{}),addedSections:[...((before.tp6RetailEdits?.addedSections||[]) as Array<{id:string}>),{id,name,title:name,description:"Cuidados simples para manter suas flores bonitas por mais tempo.",cards,placement:"before-footer"}]}} as T;
 return {ok:true,site:after,changedIds:["tp6-before-footer-"+id]};
}

/** Move only an existing, uniquely identified custom florist section.
 * The two editorial anchors are renderer-owned IDs absent from site.blocks;
 * the section itself must be a real existing custom section with unchanged cards.
 * Position, title and cards must pass the separate live DOM move audit.
 */
export function applyRenderedFloricultureSectionMove<T extends UniversalSite>(
 site:T,instruction:string
):UniversalResult<T>|null{
 if(!allowed(site)||typeof instruction!=="string"||instruction.length>1600)return null;
 const sentences=instruction.trim().split(/\.\s*(?=[A-ZÀ-Ú])/u).map(x=>x.trim().replace(/[.!?]+$/,"")).filter(Boolean);
 const move=sentences[0]?.match(/^(?:mova|reposicione)\s+(?:a\s+)?se[cç][aã]o\s+(.+?)\s+(?:para\s+)?(?:imediatamente\s+)?(?:depois|ap[oó]s)\s+(?:(?:da|do|de)\s+)?(?:se[cç][aã]o\s+)?(.+?)\s+e\s+(?:imediatamente\s+)?antes\s+(?:(?:da|do|de)\s+)?(?:se[cç][aã]o\s+)?(.+)$/iu);
 if(!move)return null; // Only the exact two-reference operation is in scope.
 const sourceName=quote(move[1]);
 const sourceId=floricultureCustomSectionId(sourceName);
 const sourceBlocks=site.blocks.filter(block=>block.section===sourceId);
 if(!sourceBlocks.length)return {ok:false,error:"A seção solicitada não existe no projeto. Nenhuma alteração aplicada."};
 const heading=sourceBlocks.filter(block=>block.type==="heading");
 if(heading.length<2||normalized(String(heading[0].text||""))!==normalized(sourceName))
  return {ok:false,error:"O título ou os cards da seção não foram identificados de forma única. Nenhuma alteração aplicada."};
 const center=sentences[1]?.match(/^(?:centralize|alinhe(?:\s+ao\s+centro)?)\s+(?:(?:exclusivamente|somente|apenas)\s+)?(?:o\s+)?t[ií]tulo\s+principal\s+(?:(?:da|de)\s+)?se[cç][aã]o\s+(.+)$/iu);
 if(!center||normalized(quote(center[1]))!==normalized(sourceName))
  return {ok:false,error:"Indique exclusivamente o título principal da mesma seção para centralizar. Nenhuma alteração aplicada."};
 const safeRest=sentences.slice(2).every(sentence=>
  /^(?:preserve|mantenha|n[aã]o\s+(?:duplique|modifique|altere|exclua|remova)|a\s+nova\s+posi[cç][aã]o)\b/iu.test(sentence) &&
  !/^(?:preserve|mantenha)\b[^.!?]*\b(?:altere|mova|troque|exclua|crie)\b/iu.test(sentence)
 );
 if(!safeRest)return {ok:false,error:"O comando contém outras alterações não verificáveis. Nenhuma alteração aplicada."};
 const after=resolveRenderedFloralAnchor(move[2]),before=resolveRenderedFloralAnchor(move[3]);
 const order=floralAnchors.map(anchor=>anchor.id);
 if(!after||!before||after===sourceId||before===sourceId||
  order.indexOf(before)!==order.indexOf(after)+1)
  return {ok:false,error:"As duas seções de referência são desconhecidas ou não são consecutivas. Nenhuma alteração aplicada."};
 const priorMoves=(site.universalSectionEvents||[]).filter(event=>event.action==="move"&&event.section.id===sourceId);
 const prior=priorMoves.at(-1);
 // Repeating an already successful operation must not manufacture an additional success.
 if(prior?.after?.id===after&&prior?.before?.id===before&&heading[0].align==="center")
  return {ok:false,error:"A seção já está nessa posição e seu título está centralizado. Confira a prévia; nenhuma edição duplicada."};
 const alignment=applyUniversalOperations(site,[{action:"update",blockId:heading[0].id,changes:{align:"center"}}]);
 if(!alignment.ok)return alignment;
 const placement={action:"move" as const,
  section:{id:sourceId,label:sourceName},
  after:{id:after,label:quote(move[2])},
  before:{id:before,label:quote(move[3])}};
 const events=(alignment.site.universalSectionEvents||[]);
 const siteAfter={...alignment.site,universalSectionEvents:[...events,placement]} as T;
 const changedIds=[...new Set([heading[0].id,...sourceBlocks.map(b=>b.id)])];
 return {ok:true,site:siteAfter,changedIds};
}
