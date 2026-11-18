import {isSafeUniversalUrl,type UniversalSite} from "./builder-v2-universal-operations.ts";
import {isExplicitImageChangeRequest} from "./builder-v2-image-intent.ts";

/** Free Unsplash photograph of a pink-and-white peony bouquet, sourced from:
 * https://unsplash.com/photos/a-hand-holding-a-bouquet-of-pink-and-white-flowers-cpYD2MQ1DMI
 * A user request for a real internet photo must never silently invoke image generation.
 */
export const verifiedPeonyBouquetPhoto="https://images.unsplash.com/photo-1782038522695-12ecda5b5e6d?auto=format&fit=crop&w=1600&q=85";

/** Real rose bouquet photograph, Unsplash free license: Luca Severin, W6RnRtdLZvE. */
export const verifiedPinkWhiteRoseBouquetPhoto="https://images.unsplash.com/photo-1760080175227-615a3ff0b040?auto=format&fit=crop&w=1600&q=85";

const normalize=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
const preserve=/^(?:mantenha|preserve|preservar|sem\s+(?:alterar|modificar)|a\s+(?:nova\s+)?fotografia\s+deve|a\s+(?:troca|alteracao)\s+deve|garanta\s+que)\b/;
/** Intent & catalog matching are separate from photographic loading and DOM proof. */
export function isExplicitFloriculturePeonyHeroIntent(instruction:string):boolean{
 if(!isExplicitImageChangeRequest(instruction))return false;
 const clauses=instruction.trim().split(/\.\s+(?=[A-ZÀ-Ú])/u).map(normalize).filter(Boolean);
 const first=clauses[0]?.replace(/[.!?]+$/,"")||"";
 if(clauses.slice(1).some(c=>!preserve.test(c)||
   /\b(?:adicione|remova|exclua|insira|crie|centralize|mova|troque|substitua)\b/.test(c)))return false;
 if(!/^(?:substitua|troque|altere|mude)\s+(?:(?:exclusivamente|somente|apenas)\s+)?(?:a\s+)?(?:foto|fotografia|imagem)\s+(?:principal\s+|de\s+destaque\s+)?(?:do\s+hero|da\s+capa|do\s+banner)\s+(?:por|pela|para)\s+(?:(?:uma?|nova)\s+){0,2}(?:foto|fotografia|imagem)\s+/i.test(first))return false;
 if(!/\b(?:peonias?|peony|peonies)\b/.test(first)||!/\b(?:rosas?|pink)\b/.test(first)||!/\b(?:brancas?|white)\b/.test(first))return false;
 return !/\b(?:todas|todos|seis)\s+(?:as\s+)?(?:fotos|imagens|fotografias)\b/.test(first);
}

/** Recognizes the specific rose request without conflating roses with peonies. */
export function isExplicitFloricultureRoseHeroIntent(instruction:string):boolean{
 if(!isExplicitImageChangeRequest(instruction))return false;
 const first=normalize(instruction.split(/\.\s+(?=[A-ZÀ-Ú])/u)[0]||"");
 const rest=instruction.trim().split(/\.\s+(?=[A-ZÀ-Ú])/u).slice(1).map(normalize);
 if(rest.some(c=>!preserve.test(c)||/\b(?:adicione|remova|exclua|insira|crie|centralize|mova|troque|substitua)\b/.test(c)))return false;
 return /^(?:substitua|troque|altere|mude)\s+(?:(?:somente|apenas|exclusivamente)\s+)?(?:a\s+)?(?:imagem|foto|fotografia)\s+(?:principal\s+)?(?:do\s+hero|da\s+capa|do\s+banner)\s+(?:por|pela|para)\s+/.test(first)&&
 /\b(?:buque|arranjo)\b/.test(first)&&/\brosas?\b/.test(first)&&/\bbrancas?\b/.test(first)&&/\b(?:cor-de-rosa|rosa|rosadas?)\b/.test(first);
}

export function applyVerifiedFloricultureHeroPhoto<T extends UniversalSite>(
 site:T,src:string
):{ok:true;site:T;changedIds:["hero-photo-override"]}|{ok:false;error:string}{
 if(!isSafeUniversalUrl(src,true)||!/^https:\/\/images\.unsplash\.com\//i.test(src))
  return {ok:false,error:"A imagem não possui URL segura e verificada."};
 if(site.universalHeroImageOverride===src)
  return {ok:false,error:"Essa fotografia já está registrada na capa; confirme-a na prévia."};
 const after={...site,universalHeroImageOverride:src} as T;
 if(JSON.stringify(site.blocks)!==JSON.stringify(after.blocks))
  return {ok:false,error:"A edição modificaria blocos não solicitados."};
 const beforeRest={...site},afterRest={...after};
 delete beforeRest.universalHeroImageOverride;
 delete afterRest.universalHeroImageOverride;
 if(JSON.stringify(beforeRest)!==JSON.stringify(afterRest))
  return {ok:false,error:"Outros elementos seriam alterados."};
 return {ok:true,site:after,changedIds:["hero-photo-override"]};
}
