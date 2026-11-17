/**
 * Universal editor binding for editorial sections that are rendered by a premium
 * component, rather than by a corresponding site.blocks section.
 *
 * The registered target must be explicit and independently rendered. Never
 * fabricate a missing section or guess an alias across template families.
 */
import type {UniversalSite,UniversalResult} from "./builder-v2-universal-operations.ts";
import {verifyUniversalEditResult} from "./builder-v2-universal-learning.ts";

type PremiumSite=UniversalSite&{
 title?:string;niche?:string;briefingLayoutVariant?:string;
 header?:{brand?:string};
 universalSectionStyles?:Record<string,{backgroundColor?:string;headingColor?:string;textColor?:string}>;
};
type Binding={section:string;labels:string[];supports:(site:PremiumSite)=>boolean};
const norm=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
const isFloriculture=(site:PremiumSite)=>{
 const declared=norm([site.niche||"",site.title||"",site.header?.brand||""].join(" "));
 return /(?:floricultur|atelier floral|jardim de ambar)/.test(declared);
};
const knownBindings:Binding[]=[
 // The Floricultura M01 renderer owns exactly one #produtos section. Other
 // models have distinct approved styles and do not consume this override.
 {section:"produtos",labels:["colecoes florais","colecoes","nossas colecoes","nossa selecao floral"],
  supports:site=>site.briefingLayoutVariant!=="02"&&site.briefingLayoutVariant!=="03"&&isFloriculture(site)}
];

/** A precise single-edit request with harmless preservation/preview clauses. */
function readBackgroundRequest(instruction:string):{label:string;color:string}|null{
 if(typeof instruction!=="string"||instruction.length>900||/[;{}<>]/.test(instruction))return null;
 const clean=instruction.replace(/\s+/g," ").trim();
 const match=clean.match(/^(?:altere|mude|troque|coloque|defina|ajuste)\s+(?:(?:exclusivamente|somente|apenas)\s+)?(?:a\s+)?(?:cor\s+de\s+)?fundo\s+(?:da|do|de)\s+(?:se[cç][aã]o\s+(?:(?:de|da|dos|das)\s+)?)?(.+?)\s+(?:para|pra|em)\s+(#[0-9a-fA-F]{6})(?:\.\s*([\s\S]*))?\.?$/iu);
 if(!match)return null;
 const rest=(match[3]||"").trim().replace(/[.!?]$/,"");
 if(rest){
  const clauses=rest.split(/[.!?]\s+/).map(x=>x.trim()).filter(Boolean);
  if(clauses.some(clause=>!/^(?:preserv[ea]|mantenha|n[aã]o\s+(?:altere|modifique)|a\s+(?:altera[cç][aã]o|mudan[cç]a)\s+deve\s+aparecer)\b/iu.test(clause)||
   /\b(?:adicione|remova|exclua|insira|crie|centralize|troque|mude|publique)\b/iu.test(clause)))return null;
 }
 return {label:norm(match[1]),color:match[2].toUpperCase()};
}

/**
 * Applies a scoped, actual section style using the standard universal
 * section-style delta. Standard verifyUniversalEditResult and visual proof
 * audits must still pass; this function never creates a learning approval.
 */
export function applyRenderedSectionBackground<T extends PremiumSite>(
 site:T,instruction:string
):UniversalResult<T>|null{
 const request=readBackgroundRequest(instruction);
 if(!request)return null;
 const matches=knownBindings.filter(binding=>binding.supports(site)&&binding.labels.includes(request.label));
 if(matches.length!==1)return null;
 const target=matches[0].section;
 const previous=site.universalSectionStyles||{};
 const existing=previous[target]||{};
 if(existing.backgroundColor?.toUpperCase()===request.color)
  return {ok:false,error:"A cor já está registrada. Confirme sua aplicação na prévia antes de avaliar a tentativa."};
 const next={...site,universalSectionStyles:{
  ...previous,[target]:{...existing,backgroundColor:request.color}
 }} as T;
 const changedIds=["section-style:"+target];
 const check=verifyUniversalEditResult(site,next,changedIds);
 return check.ok?{ok:true,site:next,changedIds}:{ok:false,error:check.reason};
}
