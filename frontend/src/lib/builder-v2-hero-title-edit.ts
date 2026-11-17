type HeroTitleSite={blocks:{id:string;type:string;text?:string;section?:string;textExplicit?:boolean}[];universalHeroHeadingBlockId?:string};
const heroSections=/^(?:hero|inicio|início|home|capa|principal|apresentacao|apresentação|banner)(?:[-_].*)?$/i;
export type HeroTitleEdit<T>={ok:true;site:T;changedIds:[string];headline:string}|{ok:false;error:string};

const normalizeTitle=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[.!?]+$/,"").replace(/\s+/g," ").trim().toLowerCase();
const unquoteTitle=(text:string)=>text.trim().replace(/^["“”'‘’]+|["“”'‘’]+$/g,"").trim();
/** Recognize a precise, unquoted from-to Hero request. Extra editing commands are never swallowed. */
function readOldNewHero(instruction:string):{previous:string;next:string}|null{
 const sentences=instruction.trim().split(/\.\s+(?=[A-ZÀ-Ú])/u);
 const main=sentences.shift()?.trim().replace(/[.!?]+$/,"")||"";
 if(sentences.some(sentence=>!/^(?:preserv[ea]|mantenha|a\s+(?:altera[cç][aã]o|mudan[cç]a)\s+deve\s+aparecer)\b/iu.test(sentence)||
  /\b(?:adicione|remova|exclua|insira|troque|mude|crie|publique|centralize)\b/iu.test(sentence)))return null;
 const match=main.match(/^(?:altere|mude|troque|substitua|atualize|modifique)\s+(?:(?:exclusivamente|somente|apenas)\s+)?(?:o\s+)?t[ií]tulo\s+(?:principal\s+)?(?:do\s+hero|da\s+capa|da\s+se[cç][aã]o\s+inicial)\s+de\s+(.+?)\s+(?:para|por)\s+(.+)$/iu);
 if(!match)return null;
 const previous=unquoteTitle(match[1]),next=unquoteTitle(match[2]);
 if(previous.length<2||previous.length>180||next.length<2||next.length>180||/[\u0000-\u001f<>]/.test(previous+next))return null;
 return {previous,next};
}
/** Isolated visual edit independent of business niche. Reuses an actual heading block. */
export function applyIsolatedHeroTitleEdit<T extends HeroTitleSite>(site:T,instruction:string):HeroTitleEdit<T>|null{
 const fromTo=readOldNewHero(instruction);
 const match=fromTo?null:instruction.trim().match(/^(?:altere|mude|troque|substitua|atualize|modifique)\s+(?:(?:somente|apenas)\s+)?(?:o\s+)?t[ií]tulo\s+(?:principal|da\s+capa|do\s+hero)\s+(?:(?:da|do)\s+(?:se[cç][aã]o\s+)?(?:inicial|capa|hero|home|site))?\s*(?:para|por)\s*["“']([^"“”']{2,120})["”']([\s\S]*)$/iu);
 if(!fromTo&&!match)return null;
 const headline=fromTo?.next||match?.[1]?.trim()||"";
 const tail=(match?.[2]||"").replace(/^[\s.!?;]+/,"").trim();
 if(tail&&!/^(?:preserv[ea]|mantenha|n[aã]o\s+altere|sem\s+alterar|deixe\s+as\s+demais)\b/i.test(tail))return null;
 if(!headline||/[\u0000-\u001f<>]/.test(headline))return {ok:false,error:"Título inválido; nenhuma alteração aplicada."};
 const headings=site.blocks.filter(b=>b.type==="heading"&&typeof b.id==="string"&&!!b.id&&typeof b.text==="string");
 const target=headings.find(b=>heroSections.test(b.section||""))||headings[0];
 if(!target)return {ok:false,error:"Não identifiquei um título inicial editável. O site foi preservado."};
 if(fromTo&&normalizeTitle(target.text||"")!==normalizeTitle(fromTo.previous))return {ok:false,error:"O texto antigo não corresponde ao título atual da capa. Nenhuma alteração aplicada."};
 if(site.universalHeroHeadingBlockId===target.id&&target.text===headline)
  return {ok:false,error:"Esse título já está vinculado à capa. Confira a prévia."};
 const blocks=site.blocks.map(block=>block.id===target.id?{...block,text:headline,textExplicit:true}:block);
 return {ok:true,site:{...site,blocks,universalHeroHeadingBlockId:target.id} as T,changedIds:[target.id],headline};
}
