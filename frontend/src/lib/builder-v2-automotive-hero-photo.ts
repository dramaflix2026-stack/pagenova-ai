import {isSafeUniversalUrl,type UniversalSite} from "./builder-v2-universal-operations.ts";

/** One-photo automotive hero intent. Never responds to preservation mentions or batches. */
export function isAutomotiveHeroPhotoIntent(prompt:string):boolean{
 const action=prompt.trim().split(/\.\s+(?:preserve|mantenha|sem alterar|n[aã]o altere)\b/i)[0];
 return /^(?:substitua|troque|altere|mude)\s+(?:somente\s+|apenas\s+)?(?:a\s+)?(?:imagem|foto|fotografia)\s+(?:principal\s+|de\s+destaque\s+)?(?:da\s+primeira\s+se[cç][aã]o|da\s+capa|do\s+hero|do\s+banner)\s+(?:por|pela|para)\s+(?:uma?\s+)?(?:fotografia|foto|imagem)\s+/i.test(action)
  &&!/(?:todas|todos|seis|6)\s+(?:as\s+)?(?:fotos|imagens|fotografias)/i.test(action);
}
/** A sourced, free Unsplash workshop photograph: mechanic at open car hood. */
export const automotiveMechanicWorkshopPhoto="https://images.unsplash.com/photo-1771340012319-0b4fca008b54?auto=format&fit=crop&w=1600&q=85";

/** Changing the editor override never rewrites seed images, copy or approved models. */
export function applyAutomotiveHeroPhoto<T extends UniversalSite>(
 site:T,src:string
):{ok:true;site:T;changedIds:string[]}|{ok:false;error:string}{
 if(!isSafeUniversalUrl(src,true)||!/^https:\/\/images\.unsplash\.com\//i.test(src))return {ok:false,error:"Fotografia insegura ou inválida."};
 if(site.universalHeroImageOverride===src)return {ok:false,error:"A fotografia solicitada já está registrada. Confira a prévia."};
 return {ok:true,site:{...site,universalHeroImageOverride:src} as T,changedIds:["hero-photo-override"]};
}
