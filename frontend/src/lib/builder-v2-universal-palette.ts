/**
 * Scoped, niche-neutral palette requests. Never treat preservation clauses
 * ("preserve as animacoes") as a request to edit animations.
 * This adapter edits only project-level design tokens, not media or blocks.
 */
const isHex=(value:string)=>/^#[0-9a-f]{6}$/i.test(value);
const normalize=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export type PaletteSite={
 blocks: readonly unknown[];
 background?:string;
 design?:{surface?:string;text?:string;muted?:string;accent?:string};
 motion?:unknown;
};

export function parseUniversalPaletteRequest(instruction:string):{background:string;accent:string;surface:string}|null{
 const text=normalize(instruction);
 const explicit=/(?:altere|troque|mude|atualize|aplique|defina|transforme|modifique)\b[\s\S]{0,110}\b(?:identidade visual|paleta|cores?|estilo visual|tema visual)\b/.test(text);
 if(!explicit)return null;
 const colors=[...instruction.matchAll(/#[0-9a-fA-F]{6}\b/g)].map(match=>match[0].toUpperCase());
 if(colors.length<3||!colors.slice(0,3).every(isHex))return null;
 const [background,accent,surface]=colors;
 return {background,accent,surface};
}

export function applyUniversalPaletteEdit<T extends PaletteSite>(
 site:T,instruction:string
):{site:T;summary:string}|null{
 const request=parseUniversalPaletteRequest(instruction);
 if(!request||!Array.isArray(site?.blocks)||!site.blocks.length)return null;
 const design={...(site.design||{}),surface:request.surface,accent:request.accent,text:request.surface,
  muted:"#D8D1C6"};
 // Preserve all block IDs, source images, copy, destinations and motion settings.
 const updated={...site,background:request.background,design} as T;
 const originalDesign=site.design||{};
 if(site.background===updated.background&&Object.entries(design).every(([key,value])=>
  (originalDesign as Record<string,unknown>)[key]===value)) {
   return {site,summary:"A paleta já estava na configuração solicitada. Nenhum outro elemento foi alterado."};
 }
 return {site:updated,summary:"Paleta visual atualizada: fundo "+request.background+
  ", destaque "+request.accent+" e superfície "+request.surface+
  ". Textos, imagens, links, seções e animações preservados."};
}
