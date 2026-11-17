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
