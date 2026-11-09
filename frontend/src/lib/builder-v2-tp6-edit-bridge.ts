/** Rendered TP6 retail edits: the response is successful only when the visual template reads it. */
export type TP6RetailCard={title:string;description:string};
export type TP6RetailAddedSection={id:string;name:string;title:string;description:string;cards:TP6RetailCard[];background?:string;cardRadius?:number};
export type TP6RetailVisualEdits={
 historyTitle?:string;collectionBackground?:string;collectionHeadingColor?:string;
 firstCollectionCard?:TP6RetailCard;addedSections?:TP6RetailAddedSection[];
};
type Site={title?:string;niche?:string;header?:{brand?:string|boolean};blocks:{type?:string;text?:string;section?:string}[];tp6RetailEdits?:TP6RetailVisualEdits};
const normalize=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const error=(reason:string)=>({ok:false as const,error:reason});
export function applyTP6RetailChatEdit<T extends Site>(site:T,instruction:string){
 const hint=normalize([site.title,site.niche,site.header?.brand,...site.blocks.filter(x=>x.type==="heading").slice(0,8).map(x=>x.text)].join(" "));
 if(!/(floricultur|flores|florais|buque|arranjos|jardim de amelia|loja de roupas|loja de calcados|perfumaria|joalheria|otica|pet shop|papelaria|varejo|boutique)/.test(hint))return null;
 const cur:TP6RetailVisualEdits=site.tp6RetailEdits&&typeof site.tp6RetailEdits==="object"?site.tp6RetailEdits:{};
 const ok=(next:TP6RetailVisualEdits,ids:string[],summary:string)=>({ok:true as const,site:{...site,tp6RetailEdits:next} as T,changedIds:ids,summary});
 const text=instruction.trim().replace(/\.\s*(?:preserve|mantenha|n[aã]o modifique|n[aã]o altere)\b[\s\S]*$/i,"");
 const about=text.match(/^na\s+se[cç][aã]o\s+(?:nossa\s+hist[oó]ria|sobre(?:\s+n[oó]s)?),\s*(?:altere|mude|troque)\s+(?:somente\s+|apenas\s+)?o\s+t[ií]tulo(?:\s+principal)?\s+para\s+['"“]([^'"”]{2,180})['"”]/i);
 if(about)return ok({...cur,historyTitle:about[1]},["tp6:about:title"],"Título da seção Nossa História atualizado na prévia.");
 const palette=/^na\s+se[cç][aã]o\s+(?:(?:nossas?|de)\s+)?cole[cç][oõ]es\s*,/i.test(text)&&/\b(?:altere|mude|troque)\b/i.test(text)&&/fundo/i.test(text)&&/t[ií]tulos?/i.test(text);
 if(palette){
  const hex=[...text.matchAll(/#[0-9a-fA-F]{6}\b/g)].map(x=>x[0].toUpperCase());
  if(hex.length!==2)return error("Informe as duas cores hexadecimais do fundo e dos títulos. Nenhuma alteração aplicada.");
  return ok({...cur,collectionBackground:hex[0],collectionHeadingColor:hex[1]},["tp6:collection:background","tp6:collection:headings"],"Cores da seção Nossas Coleções atualizadas na prévia.");
 }
 const first=/^na\s+se[cç][aã]o\s+(?:de\s+|das?\s+|nossas?\s+)?cole[cç][oõ]es,\s*(?:encontre\s+)?(?:o\s+)?primeiro\s+card/i.test(text);
 if(first){
  const title=text.match(/(?:altere|mude|troque)\s+(?:seu\s+|o\s+)?t[ií]tulo\s+(?:para|por)\s+['"“]([^'"”]{2,150})['"”]/i)?.[1];
  const description=text.match(/(?:altere|mude|troque)\s+a\s+descri[cç][aã]o\s+(?:desse\s+|do\s+)?card\s+(?:para|por)\s+['"“]([^'"”]{3,360})['"”]/i)?.[1];
  if(!title||!description)return error("Não identifiquei título e descrição do primeiro card. Nada foi alterado.");
  return ok({...cur,firstCollectionCard:{title,description}},["tp6:collection:card:1"],"Título e descrição do primeiro card atualizados na prévia.");
 }
 const create=text.match(/^(?:adicione|crie|inclua)\s+uma\s+(?:nova\s+)?se[cç][aã]o\s+(?:chamada|denominada)\s+['"“]([^'"”]{2,120})['"”]/i);
 if(create){
  const rest=text.slice(create[0].length);
  if(!/(?:imediatamente\s+|logo\s+)?antes\s+d[ae]\s+se[cç][aã]o\s+de\s+perguntas\s+frequentes/i.test(rest))
    return error("A posição da nova seção não foi identificada. Nada foi alterado.");
  const heading=rest.match(/(?:inclua|adicione|com)\s+(?:o\s+)?t[ií]tulo\s+['"“]([^'"”]{2,170})['"”]/i)?.[1];
  const list=rest.match(/(?:quatro|4)\s+cards\s*:\s*([^.]{10,240})/i)?.[1];
  if(!heading||!list)return error("Título ou lista dos quatro cards não encontrados. Nada foi alterado.");
  const names=list.replace(/\s+e\s+/gi,",").split(/\s*,\s*/).map(x=>x.trim()).filter(Boolean);
  if(names.length!==4||new Set(names.map(normalize)).size!==4)return error("São necessários quatro cards distintos. Nada foi alterado.");
  const id="tp6-custom-"+normalize(create[1]).replace(/[^a-z0-9]+/g,"-");
  if(cur.addedSections?.some(s=>s.id===id))return error("A seção já existe. Não foi duplicada.");
  const cards=names.map(name=>({title:name,description:"Arranjos e flores para "+name.toLocaleLowerCase("pt-BR")+", com composições personalizáveis para uma ocasião especial."}));
  const extra:TP6RetailAddedSection={id,name:create[1],title:heading,description:"Flores para aniversários, casamentos, presentes românticos e celebrações especiais, com arranjos que valorizam cada momento.",cards};
  return ok({...cur,addedSections:[...(cur.addedSections||[]),extra]},["tp6:section:"+id],"Seção criada com quatro cards imediatamente antes das perguntas frequentes.");
 }
 // Follow-up combined edit of a user-created retail section.
 const combined=text.match(/^na\s+se[cç][aã]o\s+([^,]{2,120}),\s*altere\s+o\s+t[ií]tulo\s+para\s+['"“]([^'"”]{2,170})['"”]/i);
 if(combined){
  const target=cur.addedSections?.find(s=>normalize(s.name)===normalize(combined[1]));
  if(!target)return null;
  const color=text.match(/#[0-9a-fA-F]{6}\b/)?.[0];
  const radius=text.match(/cantos\s+(?:dos\s+)?(?:quatro\s+)?cards\s+(?:para|em)\s+(\d{1,3})\s*px/i)?.[1];
  if(!color||!radius||Number(radius)>64)return error("Cor ou raio do card inválido. Nenhuma alteração aplicada.");
  const next={...target,title:combined[2],background:color.toUpperCase(),cardRadius:Number(radius)};
  return ok({...cur,addedSections:cur.addedSections!.map(s=>s.id===target.id?next:s)},["tp6:section:"+target.id],"Título, fundo e cantos dos cards atualizados na seção.");
 }
 return null;
}
