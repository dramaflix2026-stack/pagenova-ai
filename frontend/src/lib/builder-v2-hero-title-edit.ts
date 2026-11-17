type HeroTitleSite={blocks:{id:string;type:string;text?:string;section?:string;textExplicit?:boolean}[];universalHeroHeadingBlockId?:string};
const heroSections=/^(?:hero|inicio|início|home|capa|principal|apresentacao|apresentação|banner)(?:[-_].*)?$/i;
export type HeroTitleEdit<T>={ok:true;site:T;changedIds:[string];headline:string}|{ok:false;error:string};
/** Isolated visual edit independent of business niche. Reuses an actual heading block. */
export function applyIsolatedHeroTitleEdit<T extends HeroTitleSite>(site:T,instruction:string):HeroTitleEdit<T>|null{
 const match=instruction.trim().match(/^(?:altere|mude|troque|substitua|atualize|modifique)\s+(?:(?:somente|apenas)\s+)?(?:o\s+)?t[ií]tulo\s+(?:principal|da\s+capa|do\s+hero)\s+(?:(?:da|do)\s+(?:se[cç][aã]o\s+)?(?:inicial|capa|hero|home|site))?\s*(?:para|por)\s*["“']([^"“”']{2,120})["”']([\s\S]*)$/iu);
 if(!match)return null;
 const headline=match[1].trim();
 const tail=match[2].replace(/^[\s.!?;]+/,"").trim();
 if(tail&&!/^(?:preserv[ea]|mantenha|n[aã]o\s+altere|sem\s+alterar|deixe\s+as\s+demais)\b/i.test(tail))return null;
 if(!headline||/[\u0000-\u001f<>]/.test(headline))return {ok:false,error:"Título inválido; nenhuma alteração aplicada."};
 const headings=site.blocks.filter(b=>b.type==="heading"&&typeof b.id==="string"&&!!b.id&&typeof b.text==="string");
 const target=headings.find(b=>heroSections.test(b.section||""))||headings[0];
 if(!target)return {ok:false,error:"Não identifiquei um título inicial editável. O site foi preservado."};
 if(site.universalHeroHeadingBlockId===target.id&&target.text===headline)
  return {ok:false,error:"Esse título já está vinculado à capa. Confira a prévia."};
 const blocks=site.blocks.map(block=>block.id===target.id?{...block,text:headline,textExplicit:true}:block);
 return {ok:true,site:{...site,blocks,universalHeroHeadingBlockId:target.id} as T,changedIds:[target.id],headline};
}
