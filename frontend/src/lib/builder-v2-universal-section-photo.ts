import {isSafeUniversalUrl,type UniversalSite} from "./builder-v2-universal-operations.ts";
/** Scoped image edits must never invoke the legacy six-photo pipeline. */
const norm=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
export type ScopedSectionPhotoRequest={sectionLabel:string;description:string};
export function parseScopedSectionPhotoRequest(instruction:string):ScopedSectionPhotoRequest|null{
 const first=instruction.trim().split(/(?:\.\s+|\n)(?:preserve|mantenha|sem alterar|nao altere|garanta)\b/i)[0];
 const match=first.match(/^(?:substitua|troque|altere|mude)\s+(?:(?:somente|apenas|exclusivamente)\s+)?(?:a\s+)?(?:(?:primeira|1ª|1a)\s+)?(?:fotografia|foto|imagem)\s+(?:(?:principal|de destaque)\s+)?(?:da|do)\s+se[cç][aã]o\s+(.+?)\s+(?:por|pela|para)\s+(?:(?:uma?|a)\s+)?(?:fotografia|foto|imagem)\s+(.+?)(?:\.|$)/i);
 if(!match)return null;
 return {sectionLabel:match[1].trim(),description:match[2].trim()};
}
export function isSingleSectionImageIntent(instruction:string):boolean{
 const text=norm(instruction);
 return /(?:substitu|troqu|alter|mud)\w*/.test(text)&&/(?:fotografia|foto|imagem)/.test(text)&&/\bsecao\b/.test(text)&&!/(?:todas|todos|seis|6)\s+(?:as\s+)?(?:imagens|fotos|fotografias)/.test(text);
}
export function canonicalPhotoSection(label:string):string|null{
 const name=norm(label).replace(/^(?:a|o|da|do|nossos?|nossas?)\s+/,"").trim();
 return ["abordagem","diferenciais","diferencial"].includes(name)?"differences": /^(?:sobre|sobre a instituicao|sobre a escola|sobre nos)$/.test(name)?"about-first":null;
}
/* Existing, curated real classroom photograph from Unsplash, not generated content. */
const classroomPhoto="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=85";
export function curatedRealSectionPhoto(description:string):string|null{
 const text=norm(description);
 return /(?:estudant|alun|sala de aula|classroom|escola|educacao)/.test(text)?classroomPhoto: /(?:violao|guitarra|musica|professor)/.test(text)?"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1400&q=85":null;
}
export function readUniversalSectionPhoto(overrides:Record<string,string>|undefined,section:string,fallback:string):string{
 const src=overrides?.[section];
 return typeof src==="string"&&isSafeUniversalUrl(src,true)?src:fallback;
}
export function applyUniversalSectionPhoto<T extends UniversalSite>(site:T,section:string,src:string):
 {ok:true;site:T;changedIds:string[]}|{ok:false;error:string}{
 if(!["differences","about-first"].includes(section))return {ok:false,error:"Esta seção não possui adaptador visual validado. Nenhuma imagem foi alterada."};
 if(!isSafeUniversalUrl(src,true)||!/^https:\/\//i.test(src))return {ok:false,error:"URL de fotografia insegura ou inválida."};
 const before=(site.universalSectionImages||{}) as Record<string,string>;
 if(before[section]===src)return {ok:false,error:"Esta fotografia já está registrada para a seção."};
 const next={...site,universalSectionImages:{...before,[section]:src}} as T;
 if(JSON.stringify(site.blocks)!==JSON.stringify(next.blocks))return {ok:false,error:"Edição alteraria blocos fora da seção solicitada."};
 return {ok:true,site:next,changedIds:["section-photo:"+section]};
}
