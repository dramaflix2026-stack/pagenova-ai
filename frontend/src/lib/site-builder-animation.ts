/**
 * PageNova Universal Motion — independent of the visual template.
 * Persist motion rules as data, keyed by stable section/block IDs.
 * Never rewrite the layout or copy in order to animate it.
 */
export type MotionPreset = "professional" | "none" | "dynamic";
export type MotionEffect = "fade-up" | "fade-left" | "fade-right" | "zoom" | "pulse" | "float" | "none";
export type MotionRule = {
  effect: MotionEffect;
  durationMs?: number;
  staggerMs?: number;
  device?: "all" | "desktop" | "mobile";
};
export type SiteMotion = {
  preset: MotionPreset;
  sections?: Record<string, MotionRule>;
  blocks?: Record<string, MotionRule>;
  mobile?: "inherit" | "none";
};

type MotionBlock = { id?: unknown; type?: unknown; section?: unknown; text?: unknown };
type MotionSite = { motion?: SiteMotion; blocks?: MotionBlock[] };
const normalize = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export const hasMotionIntent = (text: string) => /anima|efeito|fade.?in|parallax|surg|apare[cç]|desliz|puls|flutu|movimento|transi[cç][aã]o|zoom/i.test(text);
export function isMotionOnlyInstruction(text: string): boolean {
  if (!hasMotionIntent(text)) return false;
  return !/(?:adicione|inclua|crie|criar|remova|exclua|mova|reorganize|inserir)\s+(?:(?:uma?|nov[ao]s?|mais)\s+){0,3}(?:se[cç][aã]o|bloco|formul[aá]rio)|(?:troque|altere|mude|substitua|reescreva)[\s\S]{0,55}(?:texto|t[ií]tulo|cor|fundo|layout|imagem|foto|fonte|alinhamento)/i.test(text);
}
export function initialSiteMotion(text: string): SiteMotion {
  const off = /(?:sem|nenhuma?s?|n[aã]o (?:quero|use|coloque|adicione))\s+(?:qualquer\s+)?(?:anima[cç][oõ]es?|efeitos?\s+de\s+movimento)|(?:anima[cç][oõ]es?|efeitos?)\s+(?:desligad[ao]s?|desativad[ao]s?)|site\s+est[aá]tico/i.test(text);
  return { preset: off ? "none" : /anima[cç][oõ]es?\s+(?:bem\s+)?(?:din[aâ]micas?|intensas?|marcantes?)/i.test(text) ? "dynamic" : "professional" };
}
const duration = (text: string): number | undefined => {
  const match = text.match(/(?:dura[cç][aã]o\s+(?:de\s+)?|em\s+)(\d+(?:[.,]\d+)?)\s*(?:segundos?|s\b|ms\b)/i);
  if (!match) return undefined;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? Math.round(Math.max(150, Math.min(2400, value * (/ms\b/i.test(match[0]) ? 1 : 1000)))) : undefined;
};
const stagger = (text: string): number | undefined => {
  const match = text.match(/(?:intervalo\s+(?:de\s+)?|a\s+cada\s+)(\d+(?:[.,]\d+)?)\s*(ms|milissegundos?|segundos?|s\b)/i);
  if (!match) return undefined;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? Math.round(Math.max(0, Math.min(1000, value * (/^(?:ms|milisseg)/i.test(match[2]) ? 1 : 1000)))) : undefined;
};
function findSectionIds(site: MotionSite, text: string): string[] {
  const blocks = site.blocks ?? [];
  const ids = [...new Set(blocks.map(b=>String(b.section||"")).filter(Boolean))];
  const normalized = normalize(text);
  const matches = ids.filter(id => {
    const heading = blocks.find(b=>b.section===id&&b.type==="heading");
    const terms = [normalize(id), normalize(String(heading?.text||""))].filter(x=>x.length>=3);
    return terms.some(term => normalized.includes(term));
  });
  if (matches.length) return matches;
  const labels: Record<string,RegExp> = {
    inicio:/\b(hero|capa|inicio|principal)\b/i, servicos:/\b(servicos|tratamentos)\b/i,
    galeria:/\b(galeria|fotos|imagens)\b/i, faq:/\b(faq|perguntas|duvidas)\b/i,
    contato:/\b(contato|formulario)\b/i, sobre:/\b(sobre|historia)\b/i,
    diferenciais:/\b(diferenciais|beneficios)\b/i
  };
  return ids.filter(id=>Object.entries(labels).some(([label,pattern])=>normalize(id).includes(label)&&pattern.test(normalized)));
}
export function applySiteMotionInstruction(site: MotionSite, instruction: string): SiteMotion {
  const previous: SiteMotion = site.motion ?? {preset:"professional"};
  const next: SiteMotion = {
    ...previous, sections:{...(previous.sections||{})}, blocks:{...(previous.blocks||{})}
  };
  if (!hasMotionIntent(instruction)) return next;
  const normalized = normalize(instruction);
  const disable = /(?:\bsem\b|\bremov\w*|\bretir\w*|\bexclu\w*|\bdesativ\w*|\bdeslig\w*|\bcancel\w*|\bparar\b|\belimin\w*|\bnao quero\b)/.test(normalized);
  const mobileOnlyOff = /(?:mobile|celular)[\s\S]{0,32}(?:sem|desativ|deslig)|(?:sem|desativ|deslig)[\s\S]{0,32}(?:mobile|celular)/i.test(instruction);
  if (mobileOnlyOff) {
    next.mobile = "none";
    if (/apenas|somente/i.test(instruction) && !/(?:todos|todas|site inteiro)/i.test(instruction)) return next;
  }
  if (/(?:mobile|celular)[\s\S]{0,30}(?:com|ativ)|(?:ativ|anima)[\s\S]{0,30}(?:mobile|celular)/i.test(instruction) && !mobileOnlyOff) next.mobile="inherit";
  const all = /(?:todo|toda|todos|todas|inteiro|geral|site completo|site todo|pagina inteira)\b/.test(normalized);
  const sections = findSectionIds(site,instruction);
  const blocks = site.blocks||[];
  const targetButtons = /\b(botao|botoes|cta|whatsapp)\b/.test(normalized);
  const targetHeading = /\b(titulo|titulos|cabecalho)\b/.test(normalized);
  const targetCards = /\b(cards?|cartoes?)\b/.test(normalized);
  const requestedEffect: MotionEffect =
    disable?"none":/puls/.test(normalized)?"pulse":/flutu/.test(normalized)?"float":
    /zoom|aproxim/.test(normalized)?"zoom":
    /(?:esquerda|pela esquerda|da esquerda)/.test(normalized)?"fade-left":
    /(?:direita|pela direita|da direita)/.test(normalized)?"fade-right":"fade-up";
  const rule: MotionRule = {effect:requestedEffect};
  const parsedDuration=duration(instruction), parsedStagger=stagger(instruction);
  if(parsedDuration!==undefined)rule.durationMs=parsedDuration;
  if(parsedStagger!==undefined)rule.staggerMs=parsedStagger;
  if(/somente|apenas|so\s+no/i.test(normalized)) {
    if(/desktop|computador/i.test(normalized) && !/mobile|celular/i.test(normalized)) rule.device="desktop";
    if(/mobile|celular/i.test(normalized) && !/desktop|computador/i.test(normalized)) rule.device="mobile";
  }
  if (all || (!sections.length&&!targetButtons&&!targetHeading&&!targetCards)) {
    next.preset=disable?"none":/dinam|intens|marcante/.test(normalized)?"dynamic":"professional";
    if(disable){next.sections={};next.blocks={};}
    return next;
  }
  const allowedSections = sections.length ? sections : [...new Set(blocks.map(b=>String(b.section||"")).filter(Boolean))];
  if (!disable && next.preset==="none") next.preset="professional";
  if (targetButtons || targetHeading || targetCards) {
    const matching = blocks.filter(b=>allowedSections.includes(String(b.section||"")) && (
      targetButtons&&b.type==="button" || targetHeading&&b.type==="heading" || targetCards&&b.type==="paragraph"
    ));
    matching.forEach(b=>{if(typeof b.id==="string")next.blocks![b.id]=rule;});
  } else {
    allowedSections.forEach(id=>{next.sections![id]=rule;});
  }
  return next;
}
export function motionRuleFor(config: SiteMotion|undefined, sectionId: string, blockId?:string): MotionRule {
  if(config?.preset==="none") return {effect:"none"};
  return (blockId && config?.blocks?.[blockId]) || config?.sections?.[sectionId] || {effect:"fade-up"};
}
/** DOM adapter: used by the Builder preview, independent of template markup. */
export function attachSiteMotion(root: HTMLElement|null, config?: SiteMotion): () => void {
  if (!root) return () => {};
  const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-section-id] [data-block-id], [data-section-id] details, [data-section-id] .grid > div"))
    .filter((el,index,all)=> all.indexOf(el)===index && !el.closest("[hidden]"));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  const observers: IntersectionObserver[]=[];
  targets.forEach((element,index)=>{
    const section=element.closest<HTMLElement>("[data-section-id]");
    const rule=motionRuleFor(config,section?.dataset.sectionId||"",element.dataset.blockId);
    const suppressed = reduce || config?.preset==="none" || (mobile && config?.mobile==="none") ||
      (rule.device==="desktop"&&mobile) || (rule.device==="mobile"&&!mobile);
    element.classList.remove("pn-motion-target","pn-motion-visible","pn-motion-loop");
    element.style.removeProperty("--pn-motion-duration");
    element.style.removeProperty("--pn-motion-delay");
    element.removeAttribute("data-pn-motion-effect");
    if(suppressed || rule.effect==="none") return;
    const effect=rule.effect;
    element.dataset.pnMotionEffect=effect;
    element.style.setProperty("--pn-motion-duration",String(rule.durationMs || (config?.preset==="dynamic"?780:680))+"ms");
    const sectionIndex=Array.from(section?.querySelectorAll("[data-block-id], details, .grid > div")||[]).indexOf(element);
    const staggerMs=rule.staggerMs??(config?.preset==="dynamic"?110:75);
    element.style.setProperty("--pn-motion-delay",String(Math.min(450,Math.max(0,sectionIndex<0?index%4:sectionIndex%5)*staggerMs))+"ms");
    element.classList.add("pn-motion-target");
    if(effect==="pulse"||effect==="float"){element.classList.add("pn-motion-visible","pn-motion-loop");return;}
    if(!("IntersectionObserver" in window) || element.getBoundingClientRect().top < window.innerHeight*.85){
      element.classList.add("pn-motion-visible");return;
    }
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("pn-motion-visible");observer.unobserve(entry.target);}})},{threshold:.06,rootMargin:"0px 0px -18px 0px"});
    observer.observe(element);observers.push(observer);
  });
  return ()=>{observers.forEach(observer=>observer.disconnect());targets.forEach(el=>{el.classList.remove("pn-motion-target","pn-motion-visible","pn-motion-loop");el.removeAttribute("data-pn-motion-effect");el.style.removeProperty("--pn-motion-duration");el.style.removeProperty("--pn-motion-delay");});};
}
