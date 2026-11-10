/**
 * Conservative acknowledgement guard for deterministic Builder V2 edits.
 * Data mutations are not proof of a visible edit in specialized React templates.
 * This observes the real iframe DOM (not site.blocks) before confirming success.
 */
export type BuilderVisualSnapshot={text:string;markup:string};
export type BuilderVisualSite={blocks:readonly {id:string;type:string;text?:string;src?:string;mobileSrc?:string;href?:string}[]};
const norm=(value:string)=>value.replace(/\s+/g," ").trim().toLocaleLowerCase("pt-BR");
const textParts=(value:string):string[]=>{
 const raw=value.trim();
 const combined=raw.match(/^([^:：—–\n]{2,100})(?::\s+|\s+[—–]\s+)(.+)$/s);
 return combined?[combined[1].trim(),combined[2].trim()]:[raw];
};
/** Returns null while the iframe isn't available; do not claim visual success. */
export function captureBuilderVisualSnapshot():BuilderVisualSnapshot|null{
 if(typeof document==="undefined")return null;
 const frame=document.querySelector('iframe[title^="Visualização"]') as HTMLIFrameElement|null;
 const doc=frame?.contentDocument;
 const root=doc?.getElementById("pn-v2-preview-root");
 if(!root||!root.childElementCount)return null;
 const walker=doc!.createTreeWalker(root,4);
 const words:string[]=[];
 for(let node=walker.nextNode();node;node=walker.nextNode()){
  const element=node.parentElement;
  if(!element||element.closest('style,script,noscript,svg,[aria-hidden="true"]'))continue;
  const value=node.textContent?.trim();
  if(value)words.push(value);
 }
 return {text:norm(words.join(" ")),markup:root.innerHTML};
}
function renderedAsset(markup:string,url:string):boolean{
 if(!url.trim())return false;
 if(markup.includes(url)||markup.includes(url.replace(/&/g,"&amp;")))return true;
 try{return decodeURIComponent(markup).includes(url);}catch{return false;}
}
export type BuilderVisualVerification={ok:true}|{ok:false;reason:string};
/**
 * Each requested new text or image must exist in the rendered output.
 * Style, ordering and section edits must change actual iframe markup too.
 * This deliberately refuses to confirm an unchanged render even if blocks changed.
 */
export function verifyBuilderVisualEdit(beforeSite:BuilderVisualSite,afterSite:BuilderVisualSite,before:BuilderVisualSnapshot|null,after:BuilderVisualSnapshot|null):BuilderVisualVerification{
 if(!before||!after)return {ok:false,reason:"A prévia ainda não está disponível para confirmar a edição."};
 if(before.markup===after.markup&&before.text===after.text)
  return {ok:false,reason:"O conteúdo da prévia permaneceu igual. A edição não foi confirmada."};
 const oldBlocks=new Map(beforeSite.blocks.map(block=>[block.id,block]));
 const updated=afterSite.blocks.filter(block=>oldBlocks.get(block.id)?.text!==block.text||oldBlocks.get(block.id)?.src!==block.src||oldBlocks.get(block.id)?.mobileSrc!==block.mobileSrc||oldBlocks.get(block.id)?.href!==block.href);
 for(const block of updated){
  const previous=oldBlocks.get(block.id);
  if(block.type==="image"){
   const requested=block.src!==previous?.src?block.src:block.mobileSrc!==previous?.mobileSrc?block.mobileSrc:undefined;
   if(requested&&!renderedAsset(after.markup,requested))
    return {ok:false,reason:"A fotografia atualizada não apareceu no HTML da prévia."};
  }else if(typeof block.text==="string"&&block.text!==previous?.text){
   for(const fragment of textParts(block.text)){
    if(fragment.length>=2&&!after.text.includes(norm(fragment)))
     return {ok:false,reason:"O texto solicitado não apareceu na prévia. O modelo visual pode não estar conectado ao bloco editado."};
   }
  }
  if(typeof block.href==="string"&&block.href!==previous?.href&&!renderedAsset(after.markup,block.href))
   return {ok:false,reason:"O novo destino do botão não apareceu na prévia."};
 }
 return {ok:true};
}
