/** Shared, template-independent editing contract for Builder V2.
 * Renderers consume site blocks; this module never changes template identity.
 */
export type UniversalBlock = {
 id:string; type:string; section?:string; text?:string; href?:string; src?:string;
 color?:string; background?:string; align?:string; fontSize?:number;
 [key:string]:unknown;
};
export type UniversalSectionReference={id:string;label?:string};
export type UniversalSectionEvent={action:"remove"|"move"|"restore";section:UniversalSectionReference;after?:UniversalSectionReference;before?:UniversalSectionReference};
export type UniversalSite = {blocks:UniversalBlock[];universalSectionEvents?:UniversalSectionEvent[];[key:string]:unknown};
export type UniversalOperation =
 | {action:"update";blockId:string;changes:Partial<UniversalBlock>}
 | {action:"remove";blockId:string}
 | {action:"add";block:UniversalBlock;afterId?:string}
 | {action:"move";blockId:string;afterId?:string}
 | {action:"remove-section";sectionId:string}
 | {action:"move-section";sectionId:string;afterSectionId?:string;beforeSectionId?:string};
export type UniversalResult<T>={ok:true;site:T;changedIds:string[]}|{ok:false;error:string};
const allowed=new Set(["text","href","src","color","background","align","fontSize","fontFamily","mobileFontSize","textColor","radius","spacing","layout","columns","imageFit","imagePosition","mobileSrc","cardBorderWidth","cardBorderColor","cardShadow"]);
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==="object"&&!Array.isArray(value);
export function isSafeUniversalUrl(value:unknown,image=false):boolean {
 if(typeof value!=="string"||!value||/[\\\s\u0000-\u001f\u007f]/.test(value))return false;
 if(image&&/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value))return true;
 if(value.startsWith("/")&&!value.startsWith("//"))return true;
 if(!image&&/^(?:mailto:|tel:|#).+/i.test(value))return true;
 try{const url=new URL(value);return url.protocol==="https:"&&!!url.hostname&&!url.username&&!url.password;}catch{return false;}
}
const safeUrl=isSafeUniversalUrl;
const blockTypes=new Set(["heading","paragraph","button","image"]);
function validateChanges(changes:Record<string,unknown>):string|null {
 if(!Object.keys(changes).length||Object.keys(changes).some(k=>!allowed.has(k)))return "Propriedade não editável.";
 for(const [key,value] of Object.entries(changes)){
  if(!["fontSize","mobileFontSize","columns","cardBorderWidth","radius","spacing"].includes(key)&&typeof value!=="string")return "Valor de texto inválido: "+key;
 }
 for(const key of ["href","src","mobileSrc"]){
  if(typeof changes[key]==="string"&&String(changes[key]).length>(key==="href"?2000:1000000))return "Endereço excede o tamanho permitido.";
  if(changes[key]!==undefined&&!safeUrl(changes[key],key!=="href"))return "Endereço inválido ou inseguro: "+key;
 }
 for(const key of ["text","color","background","fontFamily","textColor","cardBorderColor","cardShadow","imagePosition"]){
  if(changes[key]!==undefined&&(typeof changes[key]!=="string"||String(changes[key]).length>(key==="text"?12000:300)))return "Texto ou estilo inválido: "+key;
 }
 for(const [key,min,max] of [["fontSize",8,160],["mobileFontSize",8,160],["columns",1,12],["cardBorderWidth",0,24],["radius",0,200],["spacing",0,240]] as const){
  const value=changes[key];
  if(value!==undefined&&(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max||(key==="columns"&&!Number.isInteger(value))))return "Valor inválido: "+key;
 }
 if(changes.align!==undefined&&!["left","center","right"].includes(String(changes.align)))return "Alinhamento inválido.";
 if(changes.layout!==undefined&&!["hero","grid","split","banner","faq","gallery","standard"].includes(String(changes.layout)))return "Layout inválido.";
 if(changes.imageFit!==undefined&&!["cover","contain"].includes(String(changes.imageFit)))return "Ajuste de imagem inválido.";
 return null;
}
export function applyUniversalOperations<T extends UniversalSite>(site:T,operations:UniversalOperation[]):UniversalResult<T>{
 if(!site||!Array.isArray(site.blocks)||!Array.isArray(operations)||operations.length===0||operations.length>50)return {ok:false,error:"Lote de edição inválido."};
 if(site.blocks.some(b=>!record(b)||typeof b.id!=="string"||!b.id||!blockTypes.has(b.type)))return {ok:false,error:"Blocos de origem inválidos."};
 const blocks=site.blocks.map(b=>({...b}));
 const changedIds:string[]=[];
 const sectionEvents=[...(Array.isArray(site.universalSectionEvents)?site.universalSectionEvents:[])].filter(event=>record(event)&&record(event.section)&&typeof event.section.id==="string"&&["remove","move","restore"].includes(event.action));
 const sectionReference=(id:string):UniversalSectionReference=>({id,...(blocks.find(b=>b.section===id&&b.type==="heading")?.text?{label:blocks.find(b=>b.section===id&&b.type==="heading")!.text}:{})});
 const indexOf=(id:string)=>blocks.findIndex(b=>b.id===id);
 const fail=(message:string):UniversalResult<T>=>({ok:false,error:message});
 if(new Set(blocks.map(b=>b.id)).size!==blocks.length)return fail("IDs de blocos duplicados.");
 for(const op of operations){
  if(!record(op))return fail("Operação inválida.");
  if(op.action==="update"){
   const index=indexOf(op.blockId);
   if(index<0)return fail("Bloco não encontrado: "+op.blockId);
   const changes=op.changes;
   if(!record(changes))return fail("Propriedade não editável.");
   const error=validateChanges(changes);if(error)return fail(error);
   blocks[index]={...blocks[index],...changes,...(changes.color!==undefined?{colorExplicit:true}:{}),...(changes.align!==undefined?{alignExplicit:true}:{})};changedIds.push(op.blockId);
  }else if(op.action==="remove"){
   const index=indexOf(op.blockId);if(index<0)return fail("Bloco não encontrado.");
   blocks.splice(index,1);changedIds.push(op.blockId);
  }else if(op.action==="add"){
   if(!record(op.block)||typeof op.block.id!=="string"||!op.block.id.trim()||op.block.id.length>128||!blockTypes.has(op.block.type)||indexOf(op.block.id)>=0)return fail("Novo bloco inválido ou duplicado.");
   if(op.block.section!==undefined&&(typeof op.block.section!=="string"||!op.block.section.trim()))return fail("Seção inválida.");
   const {id:_id,type:_type,section:_section,...properties}=op.block;
   if(Object.keys(properties).length){const error=validateChanges(properties);if(error)return fail(error);}
   const index=op.afterId===undefined?blocks.length:indexOf(op.afterId)+1;
   if(op.afterId!==undefined&&index===0)return fail("Âncora não encontrada.");
   if(op.block.section&&sectionEvents.some(event=>event.section.id===op.block.section&&event.action==="remove")&&!sectionEvents.some(event=>event.section.id===op.block.section&&event.action==="restore"))sectionEvents.push({action:"restore",section:{id:op.block.section,...(op.block.type==="heading"&&op.block.text?{label:op.block.text}:{})}});
   blocks.splice(index,0,{text:"",color:"#171c19",align:"left",...op.block,...(op.block.color!==undefined?{colorExplicit:true}:{})});changedIds.push(op.block.id);
  }else if(op.action==="move"){
   const index=indexOf(op.blockId);
   if(index<0||op.afterId===op.blockId)return fail("Movimentação inválida.");
   if(op.afterId!==undefined&&indexOf(op.afterId)<0)return fail("Âncora não encontrada.");
   const [block]=blocks.splice(index,1);
   const target=op.afterId===undefined?0:indexOf(op.afterId)+1;
   blocks.splice(target,0,block);changedIds.push(op.blockId);
  }else if(op.action==="remove-section"){
   if(!op.sectionId||!blocks.some(b=>b.section===op.sectionId))return fail("Seção não encontrada.");
   sectionEvents.push({action:"remove",section:sectionReference(op.sectionId)});
   for(let i=blocks.length-1;i>=0;i--)if(blocks[i].section===op.sectionId){changedIds.push(blocks[i].id);blocks.splice(i,1);}
  }else if(op.action==="move-section"){
   if(!op.sectionId||op.sectionId===op.afterSectionId||op.sectionId===op.beforeSectionId||(op.afterSectionId!==undefined&&op.beforeSectionId!==undefined))return fail("Movimentação de seção inválida.");
   const section=blocks.filter(b=>b.section===op.sectionId);
   if(!section.length||op.afterSectionId!==undefined&&!blocks.some(b=>b.section===op.afterSectionId)||op.beforeSectionId!==undefined&&!blocks.some(b=>b.section===op.beforeSectionId))return fail("Seção ou âncora não encontrada.");
   sectionEvents.push({action:"move",section:sectionReference(op.sectionId),...(op.afterSectionId!==undefined?{after:sectionReference(op.afterSectionId)}:{}),...(op.beforeSectionId!==undefined?{before:sectionReference(op.beforeSectionId)}:{})});
   for(let i=blocks.length-1;i>=0;i--)if(blocks[i].section===op.sectionId)blocks.splice(i,1);
   let target=0;
   if(op.afterSectionId!==undefined){target=blocks.reduce((last,b,i)=>b.section===op.afterSectionId?i+1:last,0);}
   if(op.beforeSectionId!==undefined)target=blocks.findIndex(b=>b.section===op.beforeSectionId);
   blocks.splice(target,0,...section);changedIds.push(...section.map(b=>b.id));
  }else return fail("Operação desconhecida.");
 }
 if(blocks.length>160)return fail("O site excede o limite de 160 blocos.");
 if(!blocks.length)return fail("O site não pode ficar sem blocos.");
 return {ok:true,site:{...site,blocks,...(sectionEvents.length?{universalSectionEvents:sectionEvents}:{})},changedIds:[...new Set(changedIds)]};
}
