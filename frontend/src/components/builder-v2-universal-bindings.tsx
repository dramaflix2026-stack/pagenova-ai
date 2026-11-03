import type {CSSProperties} from "react";
import type {UniversalBlock} from "../lib/builder-v2-universal-operations";

/** Apply explicit edits without replacing the approved template's default typography. */
export function universalBlockProps(block?:UniversalBlock,button=false){
 if(!block)return {};
 const style:CSSProperties={
  ...(block.colorExplicit&&typeof block.color==="string"?(button?{backgroundColor:block.color}:{color:block.color}):{}),
  ...(typeof block.textColor==="string"?{color:block.textColor}:{}),
  ...(block.alignExplicit?{textAlign:block.align as CSSProperties["textAlign"]}:{}),
  ...(typeof block.fontFamily==="string"?{fontFamily:block.fontFamily}:{}),
  ...(typeof block.fontSize==="number"?{"--pn-edit-desktop-size":block.fontSize+"px"}:{}),
  ...(typeof block.mobileFontSize==="number"?{"--pn-edit-mobile-size":block.mobileFontSize+"px"}:{}),
  ...(typeof block.radius==="number"?{borderRadius:block.radius}:{}),
  ...(typeof block.background==="string"?{backgroundColor:block.background}:{})
 } as CSSProperties;
 return {"data-block-id":block.id,"data-pn-edit-desktop":typeof block.fontSize==="number"?"true":undefined,"data-pn-edit-mobile":typeof block.mobileFontSize==="number"?"true":undefined,style};
}
export function UniversalTypographyRules(){
 return <style>{`[data-pn-edit-desktop="true"]{font-size:var(--pn-edit-desktop-size)!important}@media(max-width:767px){[data-pn-edit-mobile="true"]{font-size:var(--pn-edit-mobile-size)!important}}`}</style>;
}
export function universalFaqItems(blocks:UniversalBlock[],fallback:readonly (readonly string[])[]):readonly (readonly string[])[]{
 const entries=blocks.filter(b=>b.type==="paragraph"&&/faq|pergunt|duvidas|dúvidas/i.test(b.section||"")).flatMap(block=>{
  const text=String(block.text||"").trim(),index=text.indexOf("?");
  return index>0&&text.slice(index+1).trim()?[[text.slice(0,index+1),text.slice(index+1).trim()]]:[];
 });
 return entries.length?entries:fallback;
}
