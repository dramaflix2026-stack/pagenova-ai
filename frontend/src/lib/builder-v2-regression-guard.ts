/** Delivery 13/15. Detect new structural regressions and DOM damage to content
 * that the user did not ask to change. Evidence is transient, never persisted. */
import {isSafeUniversalUrl,type UniversalBlock,type UniversalSite} from "./builder-v2-universal-operations.ts";
export type RegressionSentinel={id:string;kind:"text"|"image"|"button";text?:string;src?:string;href?:string;loaded?:boolean};
export type RegressionCheck={ok:boolean;reason:string};
const ok=():RegressionCheck=>({ok:true,reason:"Nenhuma regressão detectada."});
const bad=(reason:string):RegressionCheck=>({ok:false,reason});
const sectionRuns=(blocks:readonly UniversalBlock[])=>{
 const counts=new Map<string,number>();let last="";
 for(const b of blocks){const key=b.section||"";if(key&&key!==last)counts.set(key,(counts.get(key)||0)+1);last=key;}
 return counts;
};
const isFooter=(s?:string)=>/^(?:footer|rodap[eé])$/i.test(s||"");
export function auditUniversalRegressionState(before:UniversalSite,after:UniversalSite,changedIds:readonly string[]):RegressionCheck{
 if(!before?.blocks||!after?.blocks||!changedIds.length)return bad("Edição sem dados verificáveis.");
 const a=before.blocks.map(b=>b.id),b=after.blocks.map(b=>b.id);
 if(new Set(a).size===a.length&&new Set(b).size!==b.length)return bad("A edição gerou IDs de blocos duplicados.");
 const oldRuns=sectionRuns(before.blocks),nowRuns=sectionRuns(after.blocks);
 for(const [name,count] of nowRuns)if(count>1&&(oldRuns.get(name)||0)<=1)
  return bad("Seção fragmentada indevidamente: "+name);
 if(isFooter(before.blocks.at(-1)?.section)){
  let foundFooter=false;
  for(const block of after.blocks){
   if(isFooter(block.section))foundFooter=true;
   else if(foundFooter)return bad("Seção inserida indevidamente após o rodapé.");
  }
 }
 const ids=new Set(changedIds),old=new Map(before.blocks.map(b=>[b.id,b]));
 for(const block of after.blocks){
  if(!ids.has(block.id))continue;
  const prev=old.get(block.id);
  if(block.type==="image"&&block.src!==prev?.src&&block.src!==undefined&&!isSafeUniversalUrl(block.src,true))
   return bad("Imagem alterada para URL inválida.");
  if(block.type==="button"&&block.href!==prev?.href&&block.href!==undefined&&!isSafeUniversalUrl(block.href))
   return bad("Botão alterado para link inválido.");
 }
 return ok();
}
const compact=(s:string)=>s.replace(/\s+/g," ").trim();
const visible=(el:HTMLElement,win:Pick<Window,"getComputedStyle">)=>el.getClientRects().length>0&&
 win.getComputedStyle(el).display!=="none"&&win.getComputedStyle(el).visibility!=="hidden";
const nodes=(root:ParentNode)=>Array.from(root.querySelectorAll<HTMLElement>("[data-block-id]"));
const image=(el:HTMLElement)=>el.tagName==="IMG"?el as HTMLImageElement:el.querySelector<HTMLImageElement>("img");
const anchor=(el:HTMLElement)=>el.tagName==="A"?el as HTMLAnchorElement:el.querySelector<HTMLAnchorElement>("a");
/** Only blocks visible in the old real preview can become sentinels. */
export function captureUniversalRegressionSentinels(
 root:ParentNode,win:Pick<Window,"getComputedStyle">,before:UniversalSite,after:UniversalSite,changedIds:readonly string[]
):RegressionSentinel[]{
 const oldVisible=nodes(root),changed=new Set(changedIds),next=new Map(after.blocks.map(b=>[b.id,b]));
 const sentinels:RegressionSentinel[]=[];
 for(const kind of ["heading","image","button","paragraph"]){
  for(const block of before.blocks){
   if(sentinels.length>=10)break;
   if(block.type!==kind||changed.has(block.id)||JSON.stringify(next.get(block.id))!==JSON.stringify(block))continue;
   const found=oldVisible.filter(el=>el.getAttribute("data-block-id")===block.id&&visible(el,win));
   if(found.length!==1)continue;
   const element=found[0],img=image(element),link=anchor(element);
   if(kind==="image"){
    if(!img)continue;
    sentinels.push({id:block.id,kind:"image",src:img.getAttribute("src")||"",loaded:img.complete&&img.naturalWidth>0});
   }else if(kind==="button"){
    sentinels.push({id:block.id,kind:"button",text:compact(element.textContent||""),
     ...(link?{href:link.getAttribute("href")||""}:{})});
   }else sentinels.push({id:block.id,kind:"text",text:compact(element.textContent||"")});
  }
 }
 return sentinels;
}
/** Negative DOM postconditions: unchanged elements must remain visible and intact. */
export function auditUniversalRegressionSentinels(
 root:ParentNode,win:Pick<Window,"getComputedStyle">,sentinels:readonly RegressionSentinel[]
):RegressionCheck{
 const all=nodes(root);
 for(const check of sentinels){
  const found=all.filter(el=>el.getAttribute("data-block-id")===check.id&&visible(el,win));
  if(found.length!==1)return bad("Elemento não editado ausente ou duplicado: "+check.id);
  const el=found[0];
  if(check.kind==="image"){
   const img=image(el);
   if(!img||img.getAttribute("src")!==check.src)return bad("Foto não solicitada foi alterada: "+check.id);
   if(check.loaded&&(!img.complete||img.naturalWidth===0))return bad("Foto preservada parou de carregar: "+check.id);
  }else{
   if(compact(el.textContent||"")!==check.text)return bad("Texto não solicitado mudou: "+check.id);
   if(check.kind==="button"&&check.href!==undefined&&anchor(el)?.getAttribute("href")!==check.href)
    return bad("Link não solicitado mudou: "+check.id);
  }
 }
 return ok();
}
