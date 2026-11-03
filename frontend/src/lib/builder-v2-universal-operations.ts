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
const safeUrl=(value:string,image=false)=>image?/^(https:\/\/|\/)(?!\/)/i.test(value)||/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value):/^(https:\/\/|mailto:|tel:|#|\/)(?!\/)/i.test(value);
export function applyUniversalOperations<T extends UniversalSite>(site:T,operations:UniversalOperation[]):UniversalResult<T>{
 if(!site||!Array.isArray(site.blocks)||!Array.isArray(operations)||operations.length===0||operations.length>50)return {ok:false,error:"Lote de edição inválido."};
 const blocks=site.blocks.map(b=>({...b}));
 const changedIds:string[]=[];
 const indexOf=(id:string)=>blocks.findIndex(b=>b.id===id);
 const fail=(message:string):UniversalResult<T>=>({ok:false,error:message});
 if(new Set(blocks.map(b=>b.id)).size!==blocks.length)return fail("IDs de blocos duplicados.");
 for(const op of operations){
  if(op.action==="update"){
   const index=indexOf(op.blockId);
   if(index<0)return fail("Bloco não encontrado: "+op.blockId);
   const changes=op.changes;
   if(!changes||!Object.keys(changes).length||Object.keys(changes).some(k=>!allowed.has(k)))return fail("Propriedade não editável.");
   if(typeof changes.href==="string"&&!safeUrl(changes.href))return fail("Link inseguro.");
   if(typeof changes.src==="string"&&!safeUrl(changes.src,true))return fail("Imagem insegura.");
   if(typeof changes.mobileSrc==="string"&&!safeUrl(changes.mobileSrc,true))return fail("Imagem mobile insegura.");
   if(changes.mobileFontSize!==undefined&&(!Number.isFinite(changes.mobileFontSize)||Number(changes.mobileFontSize)<8||Number(changes.mobileFontSize)>160))return fail("Tamanho mobile inválido.");
   if(changes.columns!==undefined&&(!Number.isInteger(changes.columns)||Number(changes.columns)<1||Number(changes.columns)>12))return fail("Número de colunas inválido.");
   if(changes.cardBorderWidth!==undefined&&(!Number.isFinite(changes.cardBorderWidth)||Number(changes.cardBorderWidth)<0||Number(changes.cardBorderWidth)>24))return fail("Borda inválida.");
   if(changes.fontSize!==undefined&&(!Number.isFinite(changes.fontSize)||changes.fontSize<8||changes.fontSize>160))return fail("Tamanho inválido.");
   if(changes.align!==undefined&&!["left","center","right"].includes(String(changes.align)))return fail("Alinhamento inválido.");
   blocks[index]={...blocks[index],...changes};changedIds.push(op.blockId);
  }else if(op.action==="remove"){
   const index=indexOf(op.blockId);if(index<0)return fail("Bloco não encontrado.");
   blocks.splice(index,1);changedIds.push(op.blockId);
  }else if(op.action==="add"){
   if(!op.block?.id||!op.block.type||indexOf(op.block.id)>=0)return fail("Novo bloco inválido ou duplicado.");
   if(typeof op.block.href==="string"&&!safeUrl(op.block.href))return fail("Link inseguro no novo bloco.");
   if(typeof op.block.src==="string"&&!safeUrl(op.block.src,true))return fail("Imagem insegura no novo bloco.");
   if(typeof op.block.mobileSrc==="string"&&!safeUrl(op.block.mobileSrc,true))return fail("Imagem mobile insegura no novo bloco.");
   const index=op.afterId===undefined?blocks.length:indexOf(op.afterId)+1;
   if(op.afterId!==undefined&&index===0)return fail("Âncora não encontrada.");
   blocks.splice(index,0,{...op.block});changedIds.push(op.block.id);
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
