/**
 * Step 3: replay an approved TECHNIQUE, not an old edit.
 * Only a single explicit section background request; the NEW user's color
 * is parsed from the NEW instruction. Never copy saved colors or block IDs.
 */
import {resolveUniversalSection} from "./builder-v2-universal-targets.ts";
import {verifyUniversalEditResult} from "./builder-v2-universal-learning.ts";
import type {UniversalSite,UniversalResult} from "./builder-v2-universal-operations.ts";
import type {ApprovedTechnique} from "./builder-v2-universal-solution-reuse.ts";
const norm=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const named:Record<string,string>={
 azul:"#2563eb",verde:"#16a34a",preto:"#111111",branco:"#ffffff",
 vermelho:"#dc2626",amarelo:"#eab308",cinza:"#6b7280",grafite:"#30343b",
 laranja:"#f97316",dourado:"#c9ac7b",roxo:"#9333ea",rosa:"#ec4899",
 marrom:"#78350f",bege:"#d6c2a4"
};
export function applyApprovedSectionBackground<T extends UniversalSite>(
 site:T,instruction:string,technique:ApprovedTechnique|null
):UniversalResult<T>|null{
 if(technique?.technique!=="section-background"||typeof instruction!=="string"||
  instruction.length>270||/[\n;{}]/.test(instruction))return null;
 const clean=instruction.trim().replace(/[.!?]\s*$/,"");
 const match=clean.match(/^(?:pinte|deixe|mude|altere|troque|coloque|defina|ajuste)\s+(?:(?:somente|apenas)\s+)?(?:o\s+)?fundo\s+(?:da|do|de)\s+(?:se[cç][aã]o\s+)?(.+?)\s+(?:para|de|em)\s+(#[0-9a-fA-F]{6}|[\p{L}]+)$/iu);
 if(!match)return null;
 const label=match[1].trim(),colorInput=match[2].trim();
 const color=/^#[0-9a-fA-F]{6}$/.test(colorInput)?colorInput.toLowerCase():named[norm(colorInput)];
 if(!color)return null;
 const section=resolveUniversalSection(site,label);
 // Never synthesize a missing/ambiguous renderer section.
 if(!section||!site.blocks.some(block=>block.section===section))return null;
 const current=((site as Record<string,unknown>).universalSectionStyles||{}) as Record<string,unknown>;
 const previous=current[section]&&typeof current[section]==="object"&&!Array.isArray(current[section])
  ?current[section] as Record<string,unknown>:{};
 if(previous.backgroundColor===color)return null; // An idempotent request has no new learning signal.
 const next={...site,universalSectionStyles:{...current,[section]:{...previous,backgroundColor:color}}} as T;
 const changedIds=["section-style:"+section];
 const verified=verifyUniversalEditResult(site,next,changedIds);
 return verified.ok?{ok:true,site:next,changedIds}:null;
}
