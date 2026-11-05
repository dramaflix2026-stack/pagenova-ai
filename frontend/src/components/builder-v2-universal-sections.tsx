import {Children,cloneElement,isValidElement,type CSSProperties,type ReactNode} from "react";
import {resolveUniversalSection} from "../lib/builder-v2-universal-targets";
import type {UniversalSectionEvent,UniversalSectionReference} from "../lib/builder-v2-universal-operations";

/** Reorder approved React sections as whole units. No DOM mutation or replacement layouts. */
export function UniversalTemplateSections({site,children}:{site:{universalSectionStyles?:Record<string,{backgroundColor?:string;headingColor?:string}>;universalSectionEvents?:UniversalSectionEvent[];universalBanners?:{id:string;afterSection:string;beforeSection:string;text:string;backgroundColor:string;textColor:string}[];motion?:{sections?:Record<string,{effect?:string}>};blocks?:{section?:string;type?:string;background?:string;color?:string}[]};children:ReactNode}){
 const events=site.universalSectionEvents;

 const nodes=Children.toArray(children);
 const keyOf=(node:ReactNode)=>isValidElement<{"data-universal-section"?:string}>(node)?node.props["data-universal-section"]:undefined;
 const sectionNodes=nodes.filter(node=>keyOf(node));
 // Duplicate section identifiers make reordering ambiguous. Preserve the approved
 // composition instead of silently dropping one of the React sections.
 const keys=sectionNodes.map(node=>keyOf(node)!);
 if(new Set(keys).size!==keys.length)return <>{children}</>;
 const decorated=sectionNodes.map(node=>{
  const key=keyOf(node)!;
  if(!isValidElement<{style?:CSSProperties;children?:ReactNode}>(node))return node;
  const background=site.universalSectionStyles?.[key]?.backgroundColor??site.blocks?.find(block=>block.section===key&&typeof block.background==="string")?.background;
  const headingColor=site.universalSectionStyles?.[key]?.headingColor;
  const explicitMotion=site.motion?.sections?.[key];
  const style=background?{...node.props.style,backgroundColor:background}:node.props.style;
  const headingOverride=headingColor&&/^#[0-9a-f]{6}$/i.test(headingColor)?<style key={"universal-heading-"+key}>{`[data-universal-section="${key}"] h1,[data-universal-section="${key}"] h2,[data-universal-section="${key}"] h3{color:${headingColor}!important}`}</style>:null;
  return cloneElement(node,{
   ...({"data-section-id":key} as object),
   ...(explicitMotion?.effect&&explicitMotion.effect!=="none"?{"data-pn-motion-auto":""}:{}),
   ...(style?{style}:{}),
   ...(headingOverride?{children:<>{node.props.children}{headingOverride}</>}: {})
  });
 });
 const byKey=new Map(decorated.map(node=>[keyOf(node)!,node]));
 const inventory={blocks:[...byKey.keys()].map(id=>({id,section:id,type:"heading",text:id}))};
 const keyFor=(reference?:UniversalSectionReference)=>reference&&typeof reference.id==="string"&&(resolveUniversalSection(inventory,reference.id)||(typeof reference.label==="string"?resolveUniversalSection(inventory,reference.label):null));
 const order=[...byKey.keys()],visible=new Set(order);
 for(const event of Array.isArray(events)?events:[]){
  if(!event||!event.section||typeof event.section.id!=="string")continue;
  const source=keyFor(event.section);if(!source)continue;
  if(event.action==="remove"){visible.delete(source);continue;}
  if(event.action==="restore"){visible.add(source);continue;}
  if(event.action!=="move")continue;
  const target=keyFor(event.before||event.after);
  if((event.before||event.after)&&(!target||target===source||!visible.has(target)))continue;
  // Removed sections are not valid movement anchors; retain the last safe order.
  order.splice(order.indexOf(source),1);
  const index=target?order.indexOf(target)+(event.after?1:0):0;
  order.splice(index,0,source);
 }
 const sorted=order.filter(key=>visible.has(key)).map(key=>byKey.get(key)!);
 const banners=Array.isArray(site.universalBanners)?site.universalBanners:[];
 const withBanners:ReactNode[]=[];
 for(let i=0;i<sorted.length;i++){
  const node=sorted[i],section=keyOf(node)!;
  withBanners.push(node);
  for(const banner of banners){
   if(banner.afterSection!==section||keyOf(sorted[i+1])!==banner.beforeSection)continue;
   if(!/^#[0-9a-f]{6}$/i.test(banner.backgroundColor)||typeof banner.text!=="string")continue;
   withBanners.push(<section key={banner.id} data-universal-section={banner.id} style={{backgroundColor:banner.backgroundColor,color:banner.textColor||"#FFFFFF",padding:"clamp(3rem,7vw,6rem) 7%",textAlign:"center",width:"100%"}}><p style={{fontSize:"clamp(1.4rem,3vw,2.8rem)",lineHeight:1.3,margin:0}}>{banner.text}</p></section>);
  }
 }
 let inserted=false;
 return <>{nodes.flatMap(node=>{if(!keyOf(node))return [node];if(inserted)return [];inserted=true;return withBanners;})}</>;
}
