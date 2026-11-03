/** Shared, template-independent editing contract for Builder V2.
 * Renderers consume site blocks; this module never changes template identity.
 */
export type UniversalBlock = {
 id:string; type:string; section?:string; text?:string; href?:string; src?:string;
 color?:string; background?:string; align?:string; fontSize?:number;
 [key:string]:unknown;
};
export type UniversalSite = {blocks:UniversalBlock[];[key:string]:unknown};
export type UniversalOperation =
 | {action:"update";blockId:string;changes:Partial<UniversalBlock>}
 | {action:"remove";blockId:string}
 | {action:"add";block:UniversalBlock;afterId?:string}
 | {action:"move";blockId:string;afterId?:string}
 | {action:"remove-section";sectionId:string}
 | {action:"move-section";sectionId:string;afterSectionId?:string};
export type UniversalResult<T>={ok:true;site:T;changedIds:string[]}|{ok:false;error:string};
const allowed=new Set(["text","href","src","color","background","align","fontSize","fontFamily","mobileFontSize","textColor","radius","spacing","layout","columns","imageFit","imagePosition","mobileSrc","cardBorderWidth","cardBorderColor","cardShadow"]);
// Runtime validation is required: operations arrive as untrusted JSON, not TS values.
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==="object"&&!Array.isArray(value);
const safeUrl=(value:string,image=false)=>{
 if(!value||/[\\\s\u0000-\u001f\u007f]/.test(value))return false;
 if(image&&/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value))return true;
 if(value.startsWith("/")&&!value.startsWith("//"))return true;
 if(!image&&/^(?:mailto:|tel:|#).+/i.test(value))return true;
 try{const url=new URL(value);return url.protocol==="https:"&&!!url.hostname&&!url.username&&!url.password;}catch{return false;}
};
const validateChanges=(changes:Record<string,unknown>):string|null=>{
 for(const [key,value] of Object.entries(changes)){
  if(!allowed.has(key))return "Propriedade não editável.";
  if(["fontSize","mobileFontSize","columns","cardBorderWidth","radius","spacing"].includes(key)){
   const bounds:Record<string,[number,number]>={fontSize:[8,160],mobileFontSize:[8,160],columns:[1,12],cardBorderWidth:[0,24],radius:[0,200],spacing:[0,240]};
   const [min,max]=bounds[key];
   if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max||(key==="columns"&&!Number.isInteger(value)))return "Valor numérico inválido: "+key;
  }else if(typeof value!=="string")return "Valor de texto inválido: "+key;
  if(typeof value!=="string")continue;
  if(value.length>(key==="text"?12000:key==="src"||key==="mobileSrc"?1000000:2000))return "Valor excede o tamanho permitido.";
  if(key==="href"&&!safeUrl(value))return "Link inseguro.";
  if((key==="src"||key==="mobileSrc")&&!safeUrl(value,true))return "Imagem insegura.";
  if(key==="align"&&!["left","center","right"].includes(value))return "Alinhamento inválido.";
  if(key==="layout"&&!["hero","grid","split","banner","faq","gallery","standard"].includes(value))return "Layout inválido.";
  if(key==="imageFit"&&!["cover","contain"].includes(value))return "Ajuste de imagem inválido.";
 }
 return null;
};
export function applyUniversalOperations<T extends UniversalSite>(site:T,operations:UniversalOperation[]):UniversalResult<T>{
 if(!site||!Array.isArray(site.blocks)||!Array.isArray(operations)||operations.length===0||operations.length>50)return {ok:false,error:"Lote de edição inválido."};
 if(site.blocks.some(b=>!record(b)||typeof b.id!=="string"||!b.id||typeof b.type!=="string"))return {ok:false,error:"Bloco de origem inválido."};
 const blocks=site.blocks.map(b=>({...b}));
 const changedIds:string[]=[];
 const indexOf=(id:string)=>blocks.findIndex(b=>b.id===id);
 const fail=(message:string):UniversalResult<T>=>({ok:false,error:message});
 if(new Set(blocks.map(b=>b.id)).size!==blocks.length)return fail("IDs de blocos duplicados.");
 for(const op of operations){
  if(!record(op))return fail("Operação inválida.");
  if(op.action==="update"){
   const index=indexOf(op.blockId);
   if(index<0)return fail("Bloco não encontrado: "+op.blockId);
   const changes=op.changes;
   if(!record(changes)||!Object.keys(changes).length)return fail("Propriedade não editável.");
   const error=validateChanges(changes);if(error)return fail(error);
   blocks[index]={...blocks[index],...changes,...(changes.color!==undefined?{colorExplicit:true}:{})};changedIds.push(op.blockId);
  }else if(op.action==="remove"){
   const index=indexOf(op.blockId);if(index<0)return fail("Bloco não encontrado.");
   blocks.splice(index,1);changedIds.push(op.blockId);
  }else if(op.action==="add"){
   if(!record(op.block)||typeof op.block.id!=="string"||!op.block.id.trim()||op.block.id.length>128||!["heading","paragraph","button","image"].includes(op.block.type)||indexOf(op.block.id)>=0)return fail("Novo bloco inválido ou duplicado.");
   if(op.block.section!==undefined&&typeof op.block.section!=="string")return fail("Seção inválida.");
   const {id:_id,type:_type,section:_section,...properties}=op.block;
   const error=validateChanges(properties);if(error)return fail(error);
   if(blocks.length>=160)return fail("Limite de blocos excedido.");
   const index=op.afterId===undefined?blocks.length:indexOf(op.afterId)+1;
   if(op.afterId!==undefined&&index===0)return fail("Âncora não encontrada.");
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
   for(let i=blocks.length-1;i>=0;i--)if(blocks[i].section===op.sectionId){changedIds.push(blocks[i].id);blocks.splice(i,1);}
  }else if(op.action==="move-section"){
   if(!op.sectionId||op.sectionId===op.afterSectionId)return fail("Movimentação de seção inválida.");
   const section=blocks.filter(b=>b.section===op.sectionId);
   if(!section.length||op.afterSectionId!==undefined&&!blocks.some(b=>b.section===op.afterSectionId))return fail("Seção ou âncora não encontrada.");
   for(let i=blocks.length-1;i>=0;i--)if(blocks[i].section===op.sectionId)blocks.splice(i,1);
   let target=0;
   if(op.afterSectionId!==undefined){target=blocks.reduce((last,b,i)=>b.section===op.afterSectionId?i+1:last,0);}
   blocks.splice(target,0,...section);changedIds.push(...section.map(b=>b.id));
  }else return fail("Operação desconhecida.");
 }
 if(!blocks.length)return fail("O site não pode ficar sem blocos.");
 return {ok:true,site:{...site,blocks},changedIds:[...new Set(changedIds)]};
}
