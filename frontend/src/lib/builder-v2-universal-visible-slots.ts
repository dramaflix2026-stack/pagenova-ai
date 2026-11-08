/**
 * Adapter registry for editorial text slots which exist in a renderer but
 * have no persisted block in older generated projects.
 *
 * The universal editor uses this registry; it never guesses that a missing
 * block is visually present. Other templates may register slots here without
 * changing the copy parser or executor.
 */
import {resolveBriefingFamily} from "./briefing-template-families.ts";
import {resolveUniversalSection} from "./builder-v2-universal-targets.ts";
import type {UniversalSite} from "./builder-v2-universal-operations.ts";

export type DeclaredTextSlot={key:string;defaultText:string};
export function declaredVirtualTextSlot(
 site:UniversalSite,section:string,type:string,index:number
):DeclaredTextSlot|null{
 const variant=String(site.briefingLayoutVariant||"");
 const niche=typeof site.niche==="string"?site.niche:"";
 // TP1 Model 03 has a second About paragraph in JSX even when the
 // generated project persists only one about-paragraph block.
 const motion=site.cinematic&&typeof site.cinematic==="object"
  ?(site.cinematic as {mode?:string}).mode:undefined;
 const isTP1Model3=variant==="03"&&resolveBriefingFamily(niche)===1&&motion!=="immersive-3d";
 const family=resolveBriefingFamily(niche);
 const isTP5=site.templateId==="prompt-adaptive"&&family===5&&motion!=="immersive-3d";
 if(isTP5&&type==="heading"&&index===0){
  const about=resolveUniversalSection(site,"sobre");
  const faq=resolveUniversalSection(site,"faq");
  if((about&&section===about)||(faq&&section===faq))
   return {key:section+":heading:0",defaultText:section===about?"Sobre a empresa":"Perguntas frequentes"};
 }

 if(isTP1Model3&&resolveUniversalSection(site,"sobre")===section&&type==="paragraph"&&index===1)
  return {key:section+":paragraph:1",defaultText:"Nosso olhar parte da escuta e da intenção de criar experiências que façam sentido para você."};
 return null;
}
