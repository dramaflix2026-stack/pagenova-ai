import {universalPreviewSectionSelectors} from "./builder-v2-universal-preview-sections.ts";

type VisualSite={
  universalSectionStyles?:Record<string,{backgroundColor?:unknown;headingColor?:unknown;textColor?:unknown}>;
  universalPrimaryCtaColor?:unknown;
  blocks?:Array<{id?:string;section?:string;type?:string;color?:string;cardTitleAlign?:string}>;
};
const hex=(value:unknown):value is string=>typeof value==="string"&&/^#[0-9a-fA-F]{6}$/.test(value);
const sectionId=(value:string)=>/^[a-zA-Z0-9_-]{1,80}$/.test(value);

/** Published builder pages must apply the same saved palette and scoped edits
 * as the actual Studio preview. Do not modify frozen niche/model renderers. */
export function builderV2PublishedStyleCss(site:VisualSite):string{
 const rules:string[]=[];
 const styles=site.universalSectionStyles;
 if(styles&&typeof styles==="object"&&!Array.isArray(styles)){
  for(const [section,style] of Object.entries(styles)){
   if(!sectionId(section)||!style||typeof style!=="object"||Array.isArray(style))continue;
   const selectors=universalPreviewSectionSelectors(section);
   if(!selectors.length)continue;
   if(hex(style.backgroundColor))
    rules.push(selectors.join(",")+"{background-color:"+style.backgroundColor+"!important}");
   if(hex(style.headingColor))
    rules.push(selectors.map(sel=>sel+" .pn-section-heading, "+sel+" .pn-section-heading h2, "+sel+" h2").join(",")+"{color:"+style.headingColor+"!important}");
   if(hex(style.textColor))
    rules.push(selectors.map(sel=>sel+" :is(h1,h2,h3,h4,h5,h6,p,blockquote,span,small,strong,em,li)").join(",")+"{color:"+style.textColor+"!important;-webkit-text-fill-color:"+style.textColor+"!important}");
  }
 }
 if(hex(site.universalPrimaryCtaColor)){
  const selectors=[
   "a[class*='cta' i]","a[class*='button' i]","a[class*='btn' i]",
   "a[role='button']","button[class*='primary' i]","button[data-cta]",
   "a[data-cta]","[data-primary-cta]","section a[href][class*='action' i]"
  ];
  rules.push(selectors.join(",")+"{background-color:"+site.universalPrimaryCtaColor+"!important;color:#FFFFFF!important;border-color:"+site.universalPrimaryCtaColor+"!important}");
 }
 const blocks=Array.isArray(site.blocks)?site.blocks:[];
 for(const block of blocks){
  const section=block.section||"";
  if(!sectionId(section)||!section.startsWith("custom-"))continue;
  if(block.type==="paragraph"&&block.cardTitleAlign==="center")
   rules.push(`[data-section-id="${section}"] .pn-section-heading,[data-section-id="${section}"] .pn-section-heading h2{ text-align:center!important;margin-left:auto!important;margin-right:auto!important}[data-section-id="${section}"] h3{text-align:center!important}[data-section-id="${section}"] p{text-align:left!important}`);
 }
 return [...new Set(rules)].join("\n");
}
