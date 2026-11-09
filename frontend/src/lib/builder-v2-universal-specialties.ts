import {universalEditedCardCopy} from "./builder-v2-universal-card-edits.ts";
import {resolveUniversalSection} from "./builder-v2-universal-targets.ts";
import type {UniversalSite} from "./builder-v2-universal-operations.ts";

/** All models read their cards from stable edited IDs, never recreate the template. */
export function universalSpecialtyCards(site:UniversalSite,sectionLabel:string,defaults:readonly string[]){
 const section=resolveUniversalSection(site,sectionLabel);
 const approved=defaults.map((title,i)=>{
  const edited=universalEditedCardCopy(site,sectionLabel,i);
  return {id:"original-"+i,title:edited?.title||title,description:edited?.description||"",image:undefined as string|undefined};
 });
 if(!section)return approved;
 const added=site.blocks.filter(b=>b.section===section&&b.type==="paragraph"&&b.id.startsWith("universal-extra-card-")).map(b=>{
  const text=String(b.text||"");
  const colon=text.indexOf(": ");
  if(colon<1)return null;
  const photo=site.blocks.find(v=>v.section===section&&v.type==="image"&&v.forCardId===b.id&&typeof v.src==="string");
  return {id:b.id,title:text.slice(0,colon),description:text.slice(colon+2),image:photo?.src};
 }).filter((v):v is {id:string;title:string;description:string;image:string|undefined}=>!!v);
 return [...approved,...added];
}
