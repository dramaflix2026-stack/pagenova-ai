import {resolveUniversalSection} from "./builder-v2-universal-targets.ts";
import {applyUniversalOperations,type UniversalResult,type UniversalSite,type UniversalOperation} from "./builder-v2-universal-operations.ts";

/**
 * High-confidence commands used in real Builder V2 conversational editing.
 * Return null for unrelated requests; never apply an incomplete mutation.
 * No user needs to know any template/family identifiers.
 */
const normalized=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const stock=(id:number)=>"https://images.pexels.com/photos/"+id+"/pexels-photo-"+id+".jpeg?auto=compress&cs=tinysrgb&w=1400";
const bakeryContext=(site:UniversalSite)=>/padaria|boulangerie|maison du pain|p[aã]es artesanais/i.test(
 [site.title,site.niche,site.header&&typeof site.header==="object"?(site.header as {brand?:string}).brand:""].filter(Boolean).join(" "));
const verifiedPhoto=(site:UniversalSite,prompt:string):string|null=>{
 const context=normalized([site.title,site.niche,site.header&&typeof site.header==="object"?(site.header as {brand?:string}).brand:""].filter(Boolean).join(" "));
 if(/arquitet|interior|atelie|decoracao|design de ambiente/.test(context)&&/arquitet|residenc|ambiente|interior|contemporan|alto padrao|projeto/.test(normalized(prompt)))
  return "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85";
 if(!bakeryContext(site))return null;
 const text=normalized(prompt);
 if(/padeir|amassand|trabalhand[o]? com massa|sovand|knead/.test(text))return stock(33593111);
 if(/brioche/.test(text))return stock(33541425);
 if(/croissant|folhado/.test(text))return stock(37778434);
 if(/baguete|baguette/.test(text))return stock(27969785);
 return null;
};
const fail=(error:string)=>({ok:false as const,error});
const unique=(site:UniversalSite,id:string)=>!site.blocks.some(b=>b.id===id&&b.id);
const stripConstraints=(s:string)=>s.trim().replace(/\.\s*(?:preserve|mantenha|n[aã]o\s+altere)\b[\s\S]*$/i,"").trim();

export function applyUniversalPracticalEdit<T extends UniversalSite>(site:T,instruction:string):UniversalResult<T>|null{
 const text=stripConstraints(instruction);
 // Combined hero and service styling is an atomic scoped edit.
 const compound=text.match(/^na\s+primeira\s+se[cç][aã]o,?\s*altere\s+o\s+t[ií]tulo\s+para\s+['"“]([^'"”]{3,180})['"”]/i);
 if(compound&&/arredonde\s+os\s+cantos\s+dos\s+cards/i.test(text)){
  const hero=resolveUniversalSection(site,"capa")||site.blocks.find(b=>b.type==="heading")?.section;
  const services=resolveUniversalSection(site,"especialidades");
  const heading=site.blocks.find(b=>b.section===hero&&b.type==="heading");
  const radiusText=text.match(/cantos\s+dos\s+cards\s+(?:para|em)\s+(\d{1,3})\s*px/i);
  const radius=radiusText?Number(radiusText[1]):NaN;
  if(!hero||!services||!heading||!Number.isFinite(radius)||radius<0||radius>64)return fail("Não foi possível identificar o título, os cards ou o raio. Nada foi alterado.");
  const centered=/centralizad[oa]/i.test(text);
  const applied=applyUniversalOperations(site,[{action:"update",blockId:heading.id,changes:{text:compound[1],...(centered?{align:"center"}:{})}}]);
  if(!applied.ok)return applied;
  const raw=site.universalSectionStyles&&typeof site.universalSectionStyles==="object"?site.universalSectionStyles as Record<string,Record<string,unknown>>:{};
  return {ok:true,site:{...applied.site,universalSectionStyles:{...raw,[hero]:{...raw[hero],...(centered?{heroCenter:true}:{}),...(/anima[cç][aã]o\s+suave\s+de\s+entrada/i.test(text)?{entryAnimation:"fade"}:{})},[services]:{...raw[services],cardRadius:radius}}} as T,changedIds:[...applied.changedIds,"section-style:"+hero,"section-style:"+services]};
 }
 // A single request may contain TWO section color changes; commit them together.
 const color=text.match(/^(?:na\s+)?se[cç][aã]o\s+([^,\r\n]{2,120}),\s*(?:altere|troque|mude)\s+(?:apenas\s+|somente\s+)?a\s+cor\s+de\s+fundo\s+(?:para|por)\s+(#[a-f0-9]{6})(?:\s+e\s+(?:(?:a\s+)?cor\s+(?:dos\s+|de\s+)?)?(?:os\s+)?t[ií]tulos?\s+(?:para|por|em)\s+(?:a\s+cor\s+)?(#[a-f0-9]{6}))?/i);
 if(color){
  const section=resolveUniversalSection(site,color[1]);
  if(!section)return fail("A seção '"+color[1]+"' não foi identificada. Nada foi alterado.");
  const raw=site.universalSectionStyles;
  const current=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw as Record<string,Record<string,string>>:{};
  const old=current[section]||{};
  const style={...old,backgroundColor:color[2],...(color[3]?{headingColor:color[3]}:{})};
  return {ok:true,site:{...site,universalSectionStyles:{...current,[section]:style}} as T,changedIds:["section-style:"+section]};
 }
 // "Na primeira seção" is the real hero; headings and subtitles are distinct blocks.
 const align=text.match(/^(?:na\s+primeira\s+se[cç][aã]o|(?:na|no)\s+(?:capa|hero)),\s*centralize\s+(?:o\s+)?t[ií]tulo\s+(?:principal\s+)?e\s+o\s+subt[ií]tulo/i);
 if(align){
  const section=resolveUniversalSection(site,"capa")||site.blocks.find(b=>b.type==="heading"&&b.section)?.section;
  if(!section)return fail("A primeira seção não foi encontrada. Nenhuma alteração aplicada.");
  const heading=site.blocks.find(b=>b.section===section&&b.type==="heading");
  const subtitle=site.blocks.find(b=>b.section===section&&b.type==="paragraph");
  if(!heading||!subtitle)return fail("A capa precisa de título e subtítulo editáveis. Nenhuma alteração aplicada.");
  const size=text.match(/espa[cç]amento\s+entre\s+eles\s+(?:para|de)\s+(\d{1,3})\s*px/i);
  const spacing=size?Number(size[1]):undefined;
  if(spacing!==undefined&&(spacing<0||spacing>180))return fail("Espaçamento fora do intervalo seguro.");
  const ops:UniversalOperation[]=[
   {action:"update",blockId:heading.id,changes:{align:"center",...(spacing!==undefined?{marginBottom:0}:{})}},
   {action:"update",blockId:subtitle.id,changes:{align:"center",...(spacing!==undefined?{spacing}:{})}}
  ];
  const result=applyUniversalOperations(site,ops);
  if(!result.ok)return result;
  const styles=site.universalSectionStyles&&typeof site.universalSectionStyles==="object"?site.universalSectionStyles as Record<string,Record<string,unknown>>:{};
  return {ok:true,site:{...result.site,universalSectionStyles:{...styles,[section]:{...styles[section],heroCenter:true}}} as T,changedIds:[...result.changedIds,"section-style:"+section]};
 }
 // Explicit ordinal replacement with verified real internet photo; no generated AI asset.
 const photoRequest=text.match(/^(?:(?:na|no)\s+se[cç][aã]o\s+([^,]{2,100}),\s*)?(?:substitua|troque|altere)\s+(?:somente\s+|apenas\s+)?a\s+(primeira|segunda|terceira|quarta|quinta|sexta|\d{1,2}[ªº°]?)\s+(?:foto|fotografia|imagem)(?:\s+(?:da|de|do)\s+(?:galeria|se[cç][aã]o\s+[a-zA-ZÀ-ÿ\s-]{2,70}))?\s+(?:por|para)\s+([\s\S]+)/i);
 if(photoRequest){
  const section=resolveUniversalSection(site,photoRequest[1]||"galeria");
  if(!section)return fail("A seção da fotografia não foi localizada. Nenhuma imagem foi removida.");
  const ord=({primeira:0,segunda:1,terceira:2,quarta:3,quinta:4,sexta:5} as Record<string,number>)[normalized(photoRequest[2])]??(Number(photoRequest[2].replace(/\D/g,""))-1);
  const images=site.blocks.filter(b=>b.section===section&&b.type==="image");
  if(!Number.isInteger(ord)||ord<0||(ord>=images.length&&!(ord===0&&images.length===0)))return fail("A posição da fotografia não possui bloco editável. A original foi preservada.");
  const url=photoRequest[3].match(/https:\/\/[^\s"'“”<>]+/)?.[0]||verifiedPhoto(site,photoRequest[3]);
  if(!url)return fail("Não foi localizada uma fotografia real verificada para esse pedido. Envie uma URL HTTPS ou anexe a imagem; a foto anterior foi preservada.");
  if(images.length===0){
   const last=site.blocks.filter(b=>b.section===section).at(-1);
   if(!last)return fail("A galeria não possui um destino editável. A original foi preservada.");
   const id="universal-gallery-photo-1";
   if(site.blocks.some(b=>b.id===id))return fail("Identificador de fotografia existente. A original foi preservada.");
   const result=applyUniversalOperations(site,[{action:"add",afterId:last.id,block:{id,type:"image",section,src:url,text:"Fotografia real de referência"}}]);
   if(!result.ok)return result;
   return {ok:true,site:{...result.site,blocks:result.site.blocks.map(b=>b.id===id?{...b,userUploaded:true,imageExplicit:true}:b)} as T,changedIds:[id]};
  }
  const original=images[ord];
  const updated=site.blocks.map(b=>b.id===original.id?{...b,src:url,userUploaded:true,imageExplicit:true}:b);
  return {ok:true,site:{...site,blocks:updated} as T,changedIds:[original.id]};
 }
 // A complete, naturally worded section request must not demand a rigid template prompt.
 const section=text.match(/^(?:adicione|crie|inclua)\s+uma\s+(?:nova\s+)?se[cç][aã]o\s+(?:chamada|denominada)\s+['"“]([^'"”]{2,120})['"”]/i);
 if(section){
  const rest=text.slice(section[0].length);
  const anchor=rest.match(/(?:logo\s+|imediatamente\s+)?(?:depois|ap[oó]s)\s+(?:(?:da|de)\s+)?(?:se[cç][aã]o\s+)?(?:(?:de|da)\s+)?(?:['"“])?([^.'"”\n,]{2,110})(?:['"”])?(?:\.|,|$)/i);
  if(!anchor)return null; // Existing structured three-card parsers still handle their own syntax.
  const destination=resolveUniversalSection(site,anchor[1]);
  if(!destination)return fail("Não encontrei a seção após a qual inserir '"+section[1]+"'. Nenhuma alteração aplicada.");
  const slug=normalized(section[1]).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const sectionId="custom-"+slug;
  if(site.blocks.some(b=>b.section===sectionId))return fail("A seção '"+section[1]+"' já existe. Nenhuma alteração aplicada.");
  const heading=rest.match(/(?:inclua|adicione|com)\s+(?:o\s+)?t[ií]tulo\s+['"“]([^'"”]{2,300})['"”]/i)?.[1];
  if(!heading)return fail("Não identifiquei o título da nova seção. Nenhuma alteração aplicada.");
  const description=rest.match(/(?:(?:uma\s+)?descri[cç][aã]o\s+(?:profissional\s+)?|(?:um\s+)?texto\s+)sobre\s+([^.,]{4,100})/i)?.[1];
  const textBody=description&&/encomenda/i.test(description)
   ?"Encomendas artesanais para celebrar momentos especiais. Entre em contato para conhecer as opções e confirmar disponibilidade."
   :description?"Conheça nossa proposta para "+description.trim()+". Consulte os detalhes e a disponibilidade diretamente com a equipe.":null;
  if(!textBody)return fail("Informe o tema da descrição para adicionar a seção com segurança.");
  const wantsPhoto=/\b(?:foto|fotografia|imagem)\s+real\s+de\s+([\s\S]+?)(?:\s+e\s+um\s+bot[aã]o|$)/i.exec(rest);
  const image=wantsPhoto?verifiedPhoto(site,wantsPhoto[1]):null;
  if(wantsPhoto&&!image)return fail("Não foi encontrada fotografia real verificada para a nova seção. Nada foi alterado.");
  const label=rest.match(/(?:bot[aã]o)\s+['"“]([^'"”]{2,120})['"”]/i)?.[1];
  const link=label&&/(?:leve\s+[aà]\s+galeria|para\s+(?:a\s+)?galeria)/i.test(rest)&&resolveUniversalSection(site,"galeria")?"#galeria":label&&/(?:se[cç][aã]o\s+de\s+contato|para\s+(?:o\s+)?contato)/i.test(rest)?"#contato":undefined;
  if(label&&!link)return fail("Não foi possível validar o destino do novo botão. Nada foi alterado.");
  const last=site.blocks.filter(b=>b.section===destination).at(-1);
  if(!last)return fail("Seção de referência sem conteúdo.");
  let afterId=last.id;
  const entries=[
   {type:"heading",text:heading},
   {type:"paragraph",text:textBody},
   ...(image?[{type:"image",text:"Fotografia editorial ilustrativa",src:image}]:[]),
   ...(label?[{type:"button",text:label,href:link}]:[])
  ];
  const ops:UniversalOperation[]=[];
  for(let i=0;i<entries.length;i++){
   const block={id:sectionId+"-"+i,section:sectionId,...entries[i]};
   ops.push({action:"add",block,afterId});afterId=block.id;
  }
  const applied=applyUniversalOperations(site,ops);
  if(!applied.ok)return applied;
  const updatedBlocks=applied.site.blocks.map(b=>b.section===sectionId&&b.type==="image"?{...b,userUploaded:true,imageExplicit:true}:b);
  const events=Array.isArray(applied.site.universalSectionEvents)?applied.site.universalSectionEvents:[];
  return {ok:true,site:{...applied.site,blocks:updatedBlocks,universalSectionEvents:[...events,{action:"move",section:{id:sectionId,label:section[1]},after:{id:destination}}]} as T,changedIds:applied.changedIds};
 }
 // Natural language append to any named set of cards, with photo if a verified source exists.
 const extra=text.match(/^(?:adicione|crie|inclua)\s+um\s+novo\s+card\s+(?:ao\s+final|no\s+fim)\s+da\s+se[cç][aã]o\s+(.+?)\s+com\s+o\s+t[ií]tulo\s+['"“]([^'"”]{2,150})['"”]\s*,?\s*(?:(?:uma|a)\s+)?descri[cç][aã]o\s+(?:profissional\s+)?(?:sobre\s+)?([\s\S]+?)(?=\s+e\s+(?:uma\s+)?(?:foto|fotografia|imagem)|\.\s*(?:utilize|use|mantenha|preserve)|$)/i);
 if(extra){
  const sectionId=resolveUniversalSection(site,extra[1]);
  if(!sectionId)return fail("Não foi possível identificar a seção dos cards. Nenhuma alteração aplicada.");
  const slug=normalized(extra[2]).replace(/[^a-z0-9]+/g,"-");
  const id="universal-extra-card-"+slug;
  if(!unique(site,id))return fail("O card já existe. Nenhuma alteração aplicada.");
  const requestedPhoto=/\b(?:foto|fotografia|imagem)\s+real\s+de\s+([^.,]+)/i.exec(text)?.[1];
  const image=requestedPhoto?verifiedPhoto(site,requestedPhoto):null;
  if(requestedPhoto&&!image)return fail("Não encontrei uma foto real verificada para o card. Nada foi alterado.");
  const anchor=site.blocks.filter(b=>b.section===sectionId).at(-1);
  if(!anchor)return fail("Seção sem cards editáveis. Nenhuma alteração aplicada.");
  const applied=applyUniversalOperations(site,[{action:"add",afterId:anchor.id,block:{id,type:"paragraph",section:sectionId,layout:"grid",text:extra[2]+": "+extra[3]}}]);
  if(!applied.ok)return applied;
  const blocks=[...applied.site.blocks];
  if(image)blocks.splice(blocks.findIndex(b=>b.id===id)+1,0,{id:id+"-image",section:sectionId,type:"image",text:extra[2],src:image,userUploaded:true,forCardId:id});
  return {ok:true,site:{...applied.site,blocks} as T,changedIds:image?[id,id+"-image"]:[id]};
 }
 return null;
}
