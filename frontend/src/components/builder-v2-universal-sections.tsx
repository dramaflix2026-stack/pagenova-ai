import {Children,cloneElement,isValidElement,type CSSProperties,type ReactNode} from "react";
import {resolveUniversalSection} from "../lib/builder-v2-universal-targets";
import type {UniversalSectionEvent,UniversalSectionReference} from "../lib/builder-v2-universal-operations";

/** Reorder approved React sections as whole units. No DOM mutation or replacement layouts. */
export function UniversalTemplateSections({site,children,customSectionTheme}:{site:{universalSectionStyles?:Record<string,{backgroundColor?:string;headingColor?:string;cardTitleColor?:string;descriptionColor?:string;cardDescriptionColor?:string;heroCenter?:boolean;entryAnimation?:string;cardRadius?:number}>;universalSectionEvents?:UniversalSectionEvent[];universalBanners?:{id:string;afterSection:string;beforeSection:string;text:string;backgroundColor:string;textColor:string}[];motion?:{sections?:Record<string,{effect?:string}>};blocks?:{id?:string;section?:string;type?:string;text?:string;src?:string;href?:string;align?:string;background?:string;color?:string;layout?:string}[]};children:ReactNode;customSectionTheme?:{background:string;color:string;accent:string}}){
 const events=site.universalSectionEvents;

 const nodes=Children.toArray(children);
 const keyOf=(node:ReactNode)=>isValidElement<{"data-universal-section"?:string}>(node)?node.props["data-universal-section"]:undefined;
 // Sections created through chat are real blocks, not a silent data-only update.
 const customKeys=[...new Set((site.blocks||[]).map(b=>b.section).filter((v):v is string=>typeof v==="string"&&v.startsWith("custom-")))];
 const templateNodes=nodes.filter(node=>keyOf(node));
 const inferredTheme=(section:string)=>{
  const first=(site.blocks||[]).findIndex(b=>b.section===section);
  const next=(site.blocks||[]).slice(first+1).find(b=>b.section&&!b.section.startsWith("custom-"))?.section;
  const candidate=templateNodes.find(node=>keyOf(node)==="processo")||templateNodes.find(node=>keyOf(node)===next)||templateNodes[0];
  const classes=isValidElement<{className?:string}>(candidate)?String(candidate.props.className||""):"";
  const background=classes.split(" ").find(token=>token.startsWith("bg-[#")&&token.endsWith("]"))?.slice(5,-1);
  const cardAccent=classes.split(" ").find(token=>token.startsWith("border-t-[#")&&token.endsWith("]"))?.slice(11,-1);
  const siteColor=(site.blocks||[]).find(b=>b.section==="processo"&&/^#[0-9a-f]{6}$/i.test(b.color||""))?.color;

