"use client";
import { BuilderV2Immersive3D } from "@/components/builder-v2-immersive-3d";
import { CinematicBackground, type CinematicAppearance } from "@/components/builder-v2-cinematic-background";
import type {PropertyItem} from "@/components/builder-v2-real-estate";
import { useEffect, useRef, useState } from "react";
import { BuilderExtras, type SiteExtras } from "@/components/builder-v2-extras";
import nichePhotoCatalog from "@/lib/niche-photo-catalog.json";
import {distinctProcessCardPhotos} from "@/lib/builder-v2-process-card-images";
import { attachSiteMotion, type SiteMotion } from "@/lib/site-builder-animation";
import { SiteWhatsAppButton } from "@/components/site-whatsapp-button";
import {normalizedSocialLink,type SocialFooter} from "@/lib/site-social-links";
import {immersiveHeroTextColor} from "@/lib/builder-v2-hero-contrast";
import {BuilderV2HeroSlideshow} from "@/components/builder-v2-hero-slideshow";
import "@/app/app/builder-v2/motion.css";
const SocialIcon=({name,size=20}:{name:"instagram"|"facebook"|"whatsapp"|"youtube";size?:number})=><svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{name==="instagram"?<><rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2"/></>:name==="facebook"?<path d="M13.5 22v-8.8h3l.5-3.7h-3.5V7.1c0-1.1.4-1.8 1.9-1.8h1.9V2.1c-.3 0-1.4-.1-2.7-.1-2.8 0-4.7 1.7-4.7 4.9v2.6H7v3.7h2.9V22h3.6z"/>:name==="youtube"?<path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/>:<path d="M12.04 2C6.52 2 2.03 6.49 2.03 12c0 1.76.46 3.48 1.33 5L2 22l5.14-1.35A9.97 9.97 0 0 0 12.04 22C17.56 22 22.05 17.51 22.05 12S17.56 2 12.04 2Zm0 18.3a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-3.14.82.84-3.06-.2-.32a8.3 8.3 0 1 1 7.03 3.9Zm4.56-6.21c-.25-.13-1.48-.73-1.71-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.26-1.49-1.41-1.74-.15-.25-.02-.39.11-.51.12-.11.25-.29.38-.44.12-.14.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.41-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09s.9 2.42 1.02 2.59c.13.17 1.77 2.7 4.28 3.78.6.26 1.07.42 1.43.53.6.19 1.15.16 1.59.1.49-.07 1.48-.61 1.69-1.2.21-.59.21-1.09.15-1.2-.06-.1-.23-.17-.48-.29Z"/>}</svg>;
function TestimonialCarousel({children,auto=true,cinematic=false}:{children:React.ReactNode;auto?:boolean;cinematic?:boolean}){const items=Array.isArray(children)?children:[children];if(cinematic)return <div className="mx-auto grid w-full max-w-5xl min-w-0 grid-cols-1 gap-4 md:grid-cols-2">{items.map((item,i)=><div key={i} className="min-w-0 [&>*]:!w-full [&>*]:!max-w-full [&>*]:!min-w-0">{item}</div>)}</div>;const animate=auto&&items.length>0;const copies=Math.max(2,Math.ceil(8/Math.max(1,items.length)));const groups=Array.from({length:copies},(_,i)=>i);return <div className="pn-testimonial-marquee relative w-full overflow-hidden" aria-label="Depoimentos"><style>{`@keyframes pn-testimonials-flow{from{transform:translateX(0)}to{transform:translateX(calc(-100% / var(--pn-marquee-copies)))}}.pn-testimonial-marquee .pn-testimonial-track{display:flex;width:max-content;animation:pn-testimonials-flow var(--pn-marquee-duration) linear infinite;will-change:transform}@media(hover:hover) and (pointer:fine){.pn-testimonial-marquee:hover .pn-testimonial-track{animation-play-state:paused}}@media(prefers-reduced-motion:reduce){.pn-testimonial-marquee .pn-testimonial-track{animation:none!important}}`}</style><div className="pn-testimonial-track" style={{"--pn-marquee-copies":copies,"--pn-marquee-duration":`${Math.max(14,items.length*8)}s`,animationPlayState:animate?"running":"paused"} as React.CSSProperties}>{groups.map(i=><div key={i} aria-hidden={i>0?"true":undefined} className="flex shrink-0 gap-5 pr-5 [&>*]:w-[min(84vw,340px)] [&>*]:shrink-0 md:[&>*]:w-[350px]">{items}</div>)}</div></div>}
function cinematicFaqAnswer(question:string):string {
  const q=question.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase();
  if(/vegetarian/.test(q))return "Consulte nossa equipe para conhecer as opções vegetarianas disponíveis no cardápio atual.";
  if(/viagem|retirada|retirar|levar|delivery|entrega|pedido/.test(q))return "Entre em contato para consultar as opções de pedido, retirada e entrega disponíveis.";
  if(/gluten|alerg|intoleran/.test(q))return "Consulte a equipe antes de pedir para verificar ingredientes, opções disponíveis e possíveis contatos cruzados.";
  if(/horario|funcionamento|aberto|abre|fecha/.test(q))return "Confira os horários atualizados diretamente com a hamburgueria antes de visitar.";
  return "Entre em contato com nossa equipe para confirmar os detalhes e receber uma resposta personalizada.";
}
const nichePhotoBase="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/";

type Block = { id: string; type: "heading" | "paragraph" | "button" | "image"; text: string; color: string; align: "left" | "center" | "right"; src?: string; mobileSrc?: string; forCardId?: string; imageFit?: "contain" | "cover"; imagePosition?: string; userUploaded?: boolean; section?: string; fontSize?: number; mobileFontSize?: number; fontFamily?: string; textColor?: string; colorExplicit?: boolean; radius?: number; cardBorderWidth?: number; cardBorderColor?: string; cardShadow?: string; spacing?: number; href?: string; layout?: "hero" | "grid" | "split" | "banner" | "faq" | "gallery" | "standard"; background?: string; columns?: number };
export type BuilderV2SiteData = { cinematic?: CinematicAppearance; templateId?: "institutional-complete" | "minimalist-sophisticated" | "modern-impactful" | "image-text-alternating" | "prompt-adaptive"; kind?: "institutional" | "restaurant" | "real-estate" | "catalog"; title: string; background: string; blocks: Block[]; id?: string; niche?: string; publishedUrl?: string; heroPresentation?: "immersive" | "split"; crmImported?:boolean; heroComposition?: "single" | "duo" | "trio"; heroBannerCopy?: Record<string,{title?:string;description?:string;buttonText?:string;buttonHref?:string}>; sectionMediaLayouts?: Record<string,"grid" | "mosaic" | "carousel">; sectionMediaManaged?: string[]; processImageCard?: boolean; processImageCardTitle?: string; processImageCardDescription?: string; motion?: SiteMotion; restaurant?: {whatsapp?:string;menu?:{id:string;name:string;description:string;price:number;category:string;image?:string}[]}; realEstateWhatsapp?:string; properties?:PropertyItem[]; socialProof?: { enabled?: boolean; rating?: number; reviewCount?: number; platform?: string; avatars?: string[]; initials?: string[] }; header?: { enabled?: boolean; brand?: string; logoUrl?: string; ctaLabel?: string; ctaHref?: string; background?: string; textColor?: string; sticky?: boolean }; extras?: SiteExtras; footer?: (SocialFooter & {cnpj?:string;address?:string;email?:string;showMenu?:boolean}) };
const premiumThemes = {
  legal: {dark:"#101d33",accent:"#c9b782",light:"#f7f5ef"},
  health: {dark:"#164b3b",accent:"#d7e9df",light:"#f6f9f7"},
  creative: {dark:"#202327",accent:"#e5cbb3",light:"#f7f5f1"}
};
function readableColor(color:string,background:string) {
  const rgb=(value:string)=>{const v=value.trim().replace("#","");if(!/^[0-9a-f]{6}$/i.test(v))return null;return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));};
  const fg=rgb(color),bg=rgb(background);
  if(!fg||!bg)return color;
  const l=(v:number[])=>v[0]*.2126+v[1]*.7152+v[2]*.0722;
  const contrast=(a:number,b:number)=>(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  if(contrast(l(fg),l(bg))>=4.5)return color;
  return l(bg)>.4?"#24332e":"#f8f5e9";
}
const designPresets = [
 {id:"legal",match:/advoga|jurid|direito|escritorio/i,hero:"editorial",card:"bordered",accent:"#c9b782"},
 {id:"health",match:/clinic|odonto|medic|saude|terapia/i,hero:"split",card:"soft",accent:"#a6cbb9"},
 {id:"commerce",match:/loja|moda|produto|ecommerce|roupa/i,hero:"split",card:"soft",accent:"#e2a86c"},
 {id:"general",match:/.*/,hero:"editorial",card:"bordered",accent:"#c9b782"}
] as const;

export function BuilderV2Site(props:{site:BuilderV2SiteData;selectedNiche?:string;publishedMode?:boolean;templateId?:"institutional-complete"|"minimalist-sophisticated"|"modern-impactful"|"image-text-alternating"|"prompt-adaptive"}){
 if(props.site.cinematic?.mode==="immersive-3d")return <BuilderV2Immersive3D site={props.site}/>;
 return <BuilderV2ClassicSite {...props}/>;
}
function AdaptiveStatCounter({value,suffix,color}:{value:number;suffix:string;color:string}){
  const node=useRef<HTMLSpanElement>(null);
  const [progress,setProgress]=useState(0);
  useEffect(()=>{
    const target=node.current;
    if(!target)return;
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){setProgress(1);return;}
    let frame=0;
    let started=0;
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      observer.disconnect();
      const tick=(now:number)=>{
        if(!started)started=now;
        const t=Math.min(1,(now-started)/1400);
        setProgress(1-Math.pow(1-t,3));
        if(t<1)frame=requestAnimationFrame(tick);
      };
      frame=requestAnimationFrame(tick);
    },{threshold:0.2});
    observer.observe(target);
    return ()=>{observer.disconnect();cancelAnimationFrame(frame);};
  },[value]);
  const shown=value*progress;
  const decimals=Number.isInteger(value)?0:1;
  return <span ref={node} className="block text-4xl font-extrabold tabular-nums md:text-5xl" style={{color}}>{shown.toLocaleString("pt-BR",{minimumFractionDigits:decimals,maximumFractionDigits:decimals})}{suffix}</span>;
}
function BuilderV2ClassicSite({site,selectedNiche="",publishedMode=false,templateId="institutional-complete"}:{site:BuilderV2SiteData;selectedNiche?:string;publishedMode?:boolean;templateId?:"institutional-complete"|"minimalist-sophisticated"|"modern-impactful"|"image-text-alternating"|"prompt-adaptive"}) {
  // Template 5 is opt-in and scoped: existing institutional, cinematic and 3D renderers remain unchanged.
  const adaptiveTemplate=templateId==="prompt-adaptive"||site.templateId==="prompt-adaptive";
  const adaptiveColor=site.blocks.find(block=>block.type==="button"&&/^#[0-9a-f]{6}$/i.test(block.background||""))?.background
    ||site.blocks.find(block=>block.type==="heading"&&/^#[0-9a-f]{6}$/i.test(block.color||"")&&block.color?.toLowerCase()!=="#ffffff")?.color
    ||"#e50914";
  const adaptiveDark=/^#(?:0[0-9a-f]{5}|1[0-9a-f]{5}|2[0-9a-f]{5})$/i.test(site.background||"");
  const previewRef=useRef<HTMLDivElement>(null);
  const [menuOpen,setMenuOpen]=useState(false);
  useEffect(()=>attachSiteMotion(previewRef.current,site.motion),[site]);
  const stripLayoutMetadata = (value:string) => value.replace(/\b(?:hero|tratamentos?|apresenta[cç][aã]o|diferenciais|galeria|contato|faq)\s+layout\s+(?:hero|grid|split|banner|faq|gallery|standard)?\s*(?:com\s+)?(?:fundo\s+)?(?:areia(?:\s+claro)?|branco|verde|escuro|claro|preto)?/giu,"").replace(/\b(?:layout\s+(?:hero|grid|split|banner|faq|gallery|standard)|fundo\s+(?:areia(?:\s+claro)?|branco|verde|escuro|claro|preto))\b/giu,"").replace(/\s{2,}/g," ").trim();
  // Presentation metadata is not customer-facing content.
  const removeVisualDirectives = (value:string) => value
    .replace(/(?:\s*[-–—,;]\s*)?(?:background|fundo)\s*:?\s*(?:#[0-9a-f]{3,8}\b|white\b|black\b|transparent\b|branco\b|preto\b)/giu,"")
    .replace(/\s*[-–—,;]\s*$/u,"").replace(/\s*[,;]\s*$/u,"").trim();
  const publicHeading = (value:string,section:string) => {
    const cleaned=removeVisualDirectives(stripLayoutMetadata(value)).replace(/\s*[-–—,;]\s*$/u,"").trim();
    const title=/galeria|gallery|portf[oó]lio/i.test(section)
      ? cleaned.replace(/\s+(?:claro|escuro)\s*$/iu,"").trim()
      : cleaned;
    if(title&&!/^(?:hero|grid|split|banner|standard|gallery|faq)$/i.test(title))return title;
    return /tratament|servi[cç]/i.test(section)?"Nossos tratamentos":/apresent|sobre|cl[ií]nica/i.test(section)?"Conheça nosso espaço":/diferenc|escolh/i.test(section)?"Por que nos escolher":/galeria|resultad/i.test(section)?"Galeria de imagens":/contato|agend/i.test(section)?"Entre em contato":/faq|pergunt/i.test(section)?"Dúvidas frequentes":"Conheça nossos serviços";
  };
  const isDesignInstruction = (value:string) => /(?:hero\\s+layout|background\\s*#(?:[0-9a-f]{3,8})|layout\\s+(?:grid|split|standard)|fundo\\s+(?:marfim|branco|azul.marinho)|bordas?\\s+douradas?|[ií]cones?\\s+dourados?|imagem\\s+(?:a adicionar|impactante)|t[ií]tulo principal impactante|subt[ií]tulo suave|cabe[cç]alho elegante e responsivo)/i.test(value);
  const previewBlocks = site.blocks.filter(b=>(b.type==="heading"||!isDesignInstruction(b.text)) && (b.type!=="image" || !!b.src)).map(b=>({...b,section:b.section||"principal"}));
  const missingContact = previewBlocks.length>0 && !site.blocks.some(b=>/contato|agendamento|whatsapp/i.test(b.section||""));
  const sections = previewBlocks.reduce<Array<{id:string;blocks:Block[]}>>((acc,block)=>{
    const id = block.section || "principal";
    const existing = acc.find(group=>group.id===id);
    if(existing) existing.blocks.push(block);
    else acc.push({id,blocks:[block]});
    return acc;
  },[]);
  // A single source of truth for preview and footer navigation. Do not hide
  // service cards simply because the AI wrote a short (but valid) description.
  // The editor's block list is authoritative. Reordering sections must never
  // cause existing sections to disappear because of heuristic content filters.
  const visibleSections=sections.filter(group=>group.blocks.length>0);
  // Preserve the order stored in editable blocks. Chat-driven moves remain authoritative.
  const heroSourceImage=visibleSections[0]?.blocks.find(b=>b.type==="image"&&!!b.src);
  const footerCandidates=visibleSections.filter(g=>!/rodape|footer|faq/i.test(g.id));
  const footerContact=footerCandidates.find(g=>/contato|agend|fale.conosco|fale-conosco/i.test(g.id+" "+g.blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" ")));
  const footerNavSections=[
    ...footerCandidates.filter(g=>g!==footerContact).slice(0,footerContact?4:5),
    ...(footerContact?[footerContact]:[])
  ];

  const header=site.header;
  const showHeader=site.blocks.length>0&&header?.enabled!==false;
  const brand=header?.brand||site.title.split(/\\s+[–—-]\\s+/)[0].trim();
  const nav=adaptiveTemplate?footerNavSections.filter(g=>!/inicio|hero|capa/i.test(g.id)&&!/SUPERE SEUS LIMITES/i.test(g.blocks.find(b=>b.type==="heading")?.text||"")):footerNavSections;
  const ctaHref=header?.ctaHref||"#contato";
  const ctaLabel=adaptiveTemplate&&(!header?.ctaLabel||/agendar conversa/i.test(header.ctaLabel))?"Entre em contato":(header?.ctaLabel||"Agendar conversa");
  const headerBackground=adaptiveTemplate?(site.background||"#090909"):(header?.background||"#ffffff");
  const headerColor=adaptiveTemplate?"#ffffff":(header?.textColor||"#1c2e27");
  const navLabel=(g:{id:string;blocks:Block[]})=>/servic|tratament|especialidade/i.test(g.id)?"Serviços":/sobre|hist[oó]ria|institucional/i.test(g.id)?"Sobre":/diferenc/i.test(g.id)?"Diferenciais":/depoiment/i.test(g.id)?"Depoimentos":/galeria/i.test(g.id)?"Galeria":/contato|agend/i.test(g.id)?"Contato":publicHeading(g.blocks.find(b=>b.type==="heading")?.text||g.id,g.id).replace(/:.*/,"").split(/\s+[—–-]\s+/)[0].slice(0,34);
  return (
        <>
        {<style>{`
.pn-cinematic-enabled{isolation:isolate;position:relative;background:transparent!important}
.pn-cinematic-enabled .pn-cinematic-background{position:fixed!important;inset:0!important;z-index:0!important;pointer-events:none}
.pn-cinematic-enabled>header,.pn-cinematic-enabled>div:not(.pn-cinematic-background){position:relative;z-index:1}
.pn-cinematic-enabled .pn-motion-site{background:transparent!important}
.pn-cinematic-enabled .pn-motion-site>section{background:rgba(10,18,14,.38)!important}
.pn-cinematic-enabled .pn-motion-site>section :is(h1,h2,h3,p){color:#fff!important}
.pn-cinematic-enabled .pn-motion-site{position:relative;z-index:1;background:transparent!important}
.pn-cinematic-enabled .pn-motion-site>section{background:rgba(10,18,14,.60)!important;color:#fff!important}
.pn-cinematic-enabled .pn-motion-site>section :is(h1,h2,h3,p){color:#fff!important}
.pn-cinematic-enabled .pn-motion-site>section :is(article,div){background-color:transparent}

/* Cinematic-only refinements; static appearance remains unchanged. */
.pn-cinematic-enabled .pn-motion-site>section{background-color:rgba(10,18,14,.34)!important;background-blend-mode:multiply}
.pn-cinematic-enabled .pn-motion-site>section :is(h1,h2,h3,p){text-wrap:pretty}
.pn-cinematic-enabled .pn-motion-site>section :is(article,[class*="rounded"]){max-width:100%;min-width:0}
.pn-cinematic-enabled .pn-motion-site>section :is(article,[class*="rounded"]) p{overflow-wrap:anywhere}
@media(max-width:767px){
.pn-cinematic-enabled .pn-motion-site>section{padding-top:clamp(2.5rem,8vw,4rem)!important;padding-bottom:clamp(2.5rem,8vw,4rem)!important}
.pn-cinematic-enabled .pn-motion-site>section :is(article,[class*="rounded"]){min-height:0}
.pn-cinematic-enabled .pn-motion-site>section :is(h1,h2){line-height:1.15}
.pn-cinematic-enabled .pn-motion-site>section :is(.pn-testimonial-carousel,[class*="testimonial"]){max-width:100%;overflow:hidden}
}
.pn-institutional-section.pn-immersive-hero{color:#fff!important}
.pn-institutional-section.pn-immersive-hero :is(h1,h2,h3,p){color:#fff!important}
@media(max-width:767px){.pn-institutional-section [data-pn-responsive-mobile-size="true"]{font-size:var(--pn-mobile-font-size)!important}}
.pn-motion-site{scroll-behavior:smooth}
.pn-motion-site picture img[data-pn-image-fit="contain"]{object-fit:contain!important}
.pn-institutional-section.pn-immersive-hero .pn-hero-slide-picture{display:block!important}
.pn-institutional-section.pn-immersive-hero .pn-hero-slide-picture img{display:block!important}
.pn-institutional-section.pn-immersive-hero>div>.pn-hero-slideshow{max-width:none!important}
.pn-institutional-section.pn-immersive-hero.pn-carousel-hero{padding:0!important}
.pn-institutional-section.pn-immersive-hero.pn-carousel-hero>div{max-width:none!important}
/* Explicit editor colors override immersive hero defaults without changing other blocks. */
.pn-institutional-section.pn-immersive-hero :is(h1,h2,h3,p)[data-block-id][style*="color:"]{color:var(--pn-block-color,inherit)!important}
@media(min-width:1024px){
.pn-institutional-section.pn-immersive-hero{position:relative;min-height:660px;display:flex;align-items:center;color:#fff!important;background-color:#14202a!important}
.pn-institutional-section.pn-immersive-hero>div{width:100%}
.pn-institutional-section.pn-immersive-hero h1,.pn-institutional-section.pn-immersive-hero h2,.pn-institutional-section.pn-immersive-hero p{color:#fff!important}
.pn-institutional-section.pn-immersive-hero .pn-alternate-row,.pn-institutional-section.pn-immersive-hero .lg\\:grid-cols-2{display:block!important}
.pn-institutional-section.pn-immersive-hero .pn-alternate-copy{max-width:790px!important}
.pn-institutional-section.pn-immersive-hero picture,.pn-institutional-section.pn-immersive-hero .pn-alternate-image,.pn-institutional-section.pn-immersive-hero [data-block-id] img{display:none!important}
.pn-institutional-section.pn-immersive-hero>div>div{max-width:900px!important}

}
`}</style>}
        {templateId==="modern-impactful"&&<style>{`
.pn-template-impact{font-family:Arial,Helvetica,sans-serif;color:#f8f7f2;background:#12151b}
.pn-template-impact header{background:#11151d!important;color:#fff!important;border-color:#ffffff24!important;box-shadow:none!important}
.pn-template-impact header a,.pn-template-impact header button{color:inherit}
.pn-template-impact .pn-motion-site>section{border-radius:0!important}
.pn-template-impact .pn-motion-site>section h1,.pn-template-impact .pn-motion-site>section h2{font-family:Arial,Helvetica,sans-serif!important;font-weight:900!important;letter-spacing:-.065em!important;line-height:.98!important;text-transform:uppercase}
.pn-template-impact .pn-motion-site>section img{border-radius:0!important;filter:saturate(1.12)}
.pn-template-impact footer{background:#0d1118!important;color:#f7f8fa!important}
.pn-template-impact .pn-impact-panel{position:relative;isolation:isolate}
.pn-template-impact .pn-impact-panel:before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,#7c3aed33,transparent 45%,#06b6d433);pointer-events:none;z-index:-1}
.pn-template-impact .pn-impact-label{color:#a5f3fc;font-family:Arial,sans-serif;font-weight:800;letter-spacing:.25em;text-transform:uppercase}
/* Template 3 visual refinement: quieter editorial composition, deliberate mobile rhythm. */
.pn-template-impact{--impact-accent:#8ce1df}
.pn-template-impact .pn-impact-panel:before{background:linear-gradient(145deg,rgba(39,60,79,.26),transparent 68%)}
.pn-template-impact .pn-motion-site>section:not(.pn-immersive-hero){background:#121820!important;border:0!important}
.pn-template-impact .pn-motion-site>section:not(.pn-immersive-hero):nth-child(even){background:#19222c!important}
.pn-template-impact .pn-motion-site>section h1,.pn-template-impact .pn-motion-site>section h2{letter-spacing:-.045em!important;line-height:1.08!important;overflow-wrap:break-word;text-wrap:balance}
.pn-template-impact .pn-impact-panel img{border-radius:12px!important}
.pn-template-impact .pn-impact-panel a,.pn-template-impact .pn-impact-panel button{border-radius:12px!important}
.pn-template-impact .pn-impact-label{letter-spacing:.18em}
.pn-template-impact .pn-motion-site>section:has(.pn-impact-panel) .pn-impact-panel{width:100%}
.pn-template-impact .pn-motion-site>section:has(.pn-impact-panel) .pn-impact-panel>div{align-items:start}
.pn-template-impact .pn-motion-site>section:has(.pn-impact-panel) .pn-impact-panel p{line-height:1.65!important}
.pn-template-impact .pn-motion-site>section:has(.pn-impact-panel) .pn-impact-panel .divide-y>div{padding-block:1.1rem}
@media(max-width:767px){
.pn-template-impact .pn-motion-site>section{padding:34px 20px!important}
.pn-template-impact .pn-motion-site>section:first-child{padding-top:24px!important}
.pn-template-impact .pn-motion-site>section h1{font-size:clamp(2.15rem,9vw,3.35rem)!important}
.pn-template-impact .pn-motion-site>section h2{font-size:clamp(1.75rem,7vw,2.65rem)!important;text-align:left!important}
.pn-template-impact .pn-impact-panel>div{padding-top:12px!important;padding-bottom:18px!important;gap:24px!important;min-height:0!important}
.pn-template-impact .pn-impact-panel>div>div{min-width:0}
.pn-template-impact .pn-impact-panel .space-y-9{gap:0}
.pn-template-impact .pn-impact-panel .pn-impact-label{font-size:10px!important}
.pn-template-impact .pn-impact-panel p{font-size:1rem!important;line-height:1.6!important}
.pn-template-impact .pn-impact-panel img{max-height:350px;object-fit:cover}
.pn-template-impact .pn-impact-panel .border-l-\\[8px\\]{border-left-width:3px!important}
.pn-template-impact .pn-motion-site>section .mx-auto.max-w-6xl{width:100%}
.pn-template-impact .pn-motion-site>section .pn-impact-panel .grid{gap:20px}
.pn-template-impact .pn-motion-site>section .pn-impact-panel .divide-y>div{padding-block:15px}
.pn-template-impact .pn-motion-site>section .pn-impact-panel .space-y-7{gap:16px}
.pn-template-impact .pn-motion-site>section .pn-impact-panel .space-y-12{gap:24px}
.pn-template-impact .pn-motion-site>section:has(.pn-impact-panel) .pn-impact-panel a{max-width:100%}
}

@media(min-width:1024px){.pn-template-impact .pn-motion-site>section:first-child h1{font-size:clamp(4.5rem,8vw,9rem)!important}}
@media(prefers-reduced-motion:reduce){.pn-template-impact *{scroll-behavior:auto!important}}
`}</style>}
        {templateId==="image-text-alternating"&&<style>{`
.pn-template-alternating .pn-alternate-row:not(:has(.pn-alternate-image)){display:block!important;max-width:850px;margin-inline:auto}
.pn-template-alternating .pn-alternate-row:not(:has(.pn-alternate-image)) .pn-alternate-copy{max-width:850px}
.pn-template-alternating .pn-alternate-image>div{border-radius:0!important}
.pn-template-alternating .pn-alternate-image img{border-radius:0!important}
.pn-template-alternating .pn-alternate-copy a[style]{background:#304b40!important;color:white!important}
.pn-template-alternating .pn-alternate-row-odd .pn-alternate-image{order:-1}
.pn-template-alternating{font-family:Georgia,'Times New Roman',serif!important;color:#292b29!important}
.pn-template-alternating .pn-motion-site>section:not(.pn-immersive-hero){background:#faf8f4!important}
.pn-template-alternating .pn-motion-site>section:not(.pn-immersive-hero):nth-child(even){background:#eaece7!important}
.pn-template-alternating .pn-motion-site>section h1,.pn-template-alternating .pn-motion-site>section h2{font-family:Georgia,'Times New Roman',serif!important;font-weight:500!important;letter-spacing:-.045em!important;line-height:1.12!important;text-transform:none!important}
.pn-template-alternating .pn-alternate-row{gap:clamp(30px,7vw,110px);padding-block:clamp(22px,5vw,72px)}
.pn-template-alternating .pn-alternate-row-odd .pn-alternate-image{order:-1}
.pn-template-alternating .pn-alternate-image{border-radius:0!important;overflow:visible!important;position:relative}
.pn-template-alternating .pn-alternate-image>div{border-radius:0!important}
.pn-template-alternating .pn-alternate-image img{border-radius:0!important;max-height:650px!important;min-height:360px;object-fit:cover}
.pn-template-alternating .pn-alternate-hero .pn-alternate-image img{min-height:520px;max-height:740px!important}
.pn-template-alternating .pn-alternate-kicker{color:#9b6d49!important;letter-spacing:.3em!important;font-family:Arial,Helvetica,sans-serif}
.pn-template-alternating .pn-alternate-content{display:grid;gap:16px}
.pn-template-alternating .pn-alternate-list{border-top:1px solid #b9b8af;gap:0}
.pn-template-alternating .pn-alternate-list .pn-alternate-text-item{padding:19px 0;border-bottom:1px solid #c9cac2}
.pn-template-alternating .pn-alternate-quote{min-height:320px;display:grid;place-items:center;border:1px solid #c9c8bf}
.pn-template-alternating .pn-alternate-quote span{font-family:Georgia,serif;font-size:clamp(7rem,15vw,14rem);color:#c2c8be;font-weight:400}
.pn-template-alternating .pn-alternate-copy p{font-family:Arial,Helvetica,sans-serif!important;font-size:1rem!important;color:#4c544f!important}
@media(min-width:900px){.pn-template-alternating .pn-alternate-row{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)!important}.pn-template-alternating .pn-alternate-hero{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)!important}}
@media(max-width:899px){.pn-template-alternating .pn-alternate-row-odd .pn-alternate-image{order:-1}.pn-template-alternating .pn-alternate-image img{min-height:250px;max-height:400px!important}.pn-template-alternating .pn-alternate-hero .pn-alternate-image img{min-height:340px;max-height:450px!important}.pn-template-alternating .pn-alternate-row{padding-block:12px}}
.pn-template-alternating{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#172b32}
.pn-template-alternating header{background:#fff!important;color:#172b32!important;border-bottom:1px solid #e5ebea!important}
.pn-template-alternating .pn-motion-site>section{border-radius:0!important}
.pn-template-alternating .pn-motion-site>section h1,.pn-template-alternating .pn-motion-site>section h2{font-weight:800!important;letter-spacing:-.045em!important;line-height:1.1!important;text-wrap:balance;overflow-wrap:break-word}
.pn-template-alternating .pn-alternate-row{display:grid;grid-template-columns:minmax(0,1fr);gap:24px;align-items:center}
.pn-template-alternating .pn-alternate-copy{min-width:0}
.pn-template-alternating .pn-alternate-image{min-width:0;overflow:hidden;border-radius:20px}
.pn-template-alternating .pn-alternate-image img{width:100%;height:100%;max-height:520px;object-fit:cover;border-radius:20px!important}
.pn-template-alternating .pn-alternate-kicker{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#287a77}
.pn-template-alternating .pn-alternate-copy p{line-height:1.7!important}
.pn-template-alternating .pn-alternate-copy a{border-radius:9px!important}
.pn-template-alternating footer{background:#172b32!important;color:#fff!important}
@media(min-width:900px){.pn-template-alternating .pn-alternate-row{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(36px,6vw,96px);min-height:380px}.pn-template-alternating .pn-alternate-row:nth-child(even) .pn-alternate-image{order:-1}}
@media(max-width:899px){.pn-template-alternating .pn-motion-site>section{padding:36px 20px!important}.pn-template-alternating .pn-alternate-row{gap:22px}.pn-template-alternating .pn-alternate-image{order:-1}.pn-template-alternating .pn-alternate-image img{max-height:320px}.pn-template-alternating .pn-motion-site>section h1{font-size:clamp(2.1rem,8.5vw,3.2rem)!important}.pn-template-alternating .pn-motion-site>section h2{font-size:clamp(1.75rem,7vw,2.6rem)!important}}
`}</style>}
        {templateId==="minimalist-sophisticated"&&<style>{`/* Template 2: independent editorial visual system, preserving content and chat editing */
.pn-template-editorial{--pn-ink:#101820;--pn-paper:#fff;color:var(--pn-ink);font-family:Arial,Helvetica,sans-serif;background:#fff}
.pn-template-editorial header{background:#fff!important;color:#101820!important;border-color:#e4e9ec!important;box-shadow:none!important}
.pn-template-editorial header nav,.pn-template-editorial header button{font-family:Arial,Helvetica,sans-serif}
.pn-template-editorial .pn-motion-site>section{border-radius:0!important}
.pn-template-editorial .pn-motion-site>section h1,.pn-template-editorial .pn-motion-site>section h2,.pn-template-editorial .pn-motion-site>section h3{font-family:Arial,Helvetica,sans-serif!important;letter-spacing:-.065em!important;line-height:1.05!important}
.pn-template-editorial .pn-motion-site>section h1,.pn-template-editorial .pn-motion-site>section h2{font-weight:800!important}
.pn-template-editorial .pn-motion-site>section img{border-radius:0!important}
.pn-template-editorial .pn-motion-site>section button,.pn-template-editorial .pn-motion-site>section a{transition:transform .2s ease,opacity .2s ease}
.pn-template-editorial .pn-motion-site>section a:hover{opacity:.85}
.pn-template-editorial .pn-editorial-layout{min-width:0;font-family:Arial,Helvetica,sans-serif}
.pn-template-editorial .pn-editorial-layout h1{font-size:clamp(2.7rem,7vw,6.4rem)!important;overflow-wrap:anywhere}
.pn-template-editorial .pn-editorial-layout h2{font-size:clamp(2.1rem,4.5vw,4.6rem)!important;overflow-wrap:anywhere}
.pn-template-editorial .pn-editorial-layout p{line-height:1.55!important}
.pn-template-editorial .pn-editorial-layout img{max-height:520px;object-fit:cover}
.pn-template-editorial .pn-editorial-layout article{background:#fff!important;border:1px solid #e5eaf0!important;border-radius:3px!important;box-shadow:0 12px 30px rgba(16,24,32,.04)}
.pn-template-editorial .pn-editorial-layout article img{max-height:none!important;display:block}.pn-template-editorial .pn-editorial-layout article{display:flex;flex-direction:column}.pn-template-editorial .pn-editorial-layout article>div:last-child{flex:1}.pn-template-editorial .pn-editorial-layout article p{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}\n.pn-template-editorial .pn-editorial-layout article p{font-size:clamp(.95rem,1.4vw,1.1rem)!important;line-height:1.55!important}
.pn-template-editorial .pn-editorial-layout a:not([href^="#"]){border-radius:3px!important}
.pn-template-editorial footer{background:#101820!important;color:#fff!important;font-family:Arial,Helvetica,sans-serif!important}
.pn-template-editorial footer p:first-child{font-family:Arial,Helvetica,sans-serif!important;font-weight:700!important}
/* Compact, readable editorial mobile rhythm; limited to Template 2. */
.pn-template-editorial .pn-editorial-layout .pn-editorial-photo-card>div:last-child{display:flex!important;flex-direction:column!important;justify-content:flex-start!important;gap:1rem!important;min-height:0!important}
.pn-template-editorial .pn-editorial-layout .pn-editorial-photo-card>div:last-child>span{display:block!important;margin:0!important;line-height:1.4!important;min-height:1.4em!important;font-variant-numeric:tabular-nums!important;letter-spacing:.2em!important}
.pn-template-editorial .pn-editorial-layout .pn-editorial-photo-card>div:last-child>div{margin:0!important;align-self:stretch!important}
/* Keep the card number and copy together even when generic motion/layout rules stretch cards. */
.pn-template-editorial .pn-editorial-layout .pn-editorial-photo-card{height:auto!important;min-height:0!important;align-self:start!important}
.pn-template-editorial .pn-editorial-layout .pn-editorial-photo-card>div:last-child{flex:0 0 auto!important;display:block!important;padding:1.25rem!important;min-height:0!important;height:auto!important}
.pn-template-editorial .pn-editorial-layout .pn-editorial-photo-card>div:last-child>span{display:block!important;position:static!important;margin:0 0 .85rem!important;line-height:1.4!important}
.pn-template-editorial .pn-editorial-layout .pn-editorial-photo-card>div:last-child>div{display:block!important;margin:0!important;min-height:0!important;height:auto!important}
.pn-template-editorial .pn-editorial-layout article{box-shadow:none!important}
.pn-template-editorial .pn-editorial-layout article>div:last-child{padding:1.1rem!important}
.pn-template-editorial .pn-editorial-layout article p{-webkit-line-clamp:unset;display:block;overflow:visible}
.pn-template-editorial .pn-editorial-layout h2{letter-spacing:-.045em!important}
@media(max-width:639px){
.pn-template-editorial .pn-motion-site>section{padding-top:2rem!important;padding-bottom:2rem!important}
.pn-template-editorial .pn-editorial-layout h1{font-size:clamp(2.1rem,9vw,3.25rem)!important;line-height:1.12!important}
.pn-template-editorial .pn-editorial-layout h2{font-size:clamp(1.75rem,7vw,2.45rem)!important;line-height:1.14!important}
.pn-template-editorial .pn-editorial-layout .grid{row-gap:1rem}
.pn-template-editorial .pn-editorial-layout article p{font-size:.95rem!important;line-height:1.5!important}
.pn-template-editorial .pn-editorial-layout img{max-height:320px}
}
@media(max-width:639px){.pn-template-editorial .pn-editorial-layout img{max-height:300px}.pn-template-editorial .pn-editorial-layout h1{font-size:clamp(2.5rem,11vw,4rem)!important}.pn-template-editorial .pn-editorial-layout h2{font-size:clamp(2rem,8vw,3rem)!important}}
@media(min-width:1024px){.pn-template-editorial .pn-motion-site>section:first-child h1{font-size:clamp(4rem,7vw,7rem)!important}}
@media(prefers-reduced-motion:reduce){.pn-template-editorial *{scroll-behavior:auto!important}}
`}</style>}
        {!adaptiveTemplate&&<style>{`
@media(min-width:768px){
.pn-institutional-responsive{min-width:0;width:100%;overflow-x:clip}
.pn-institutional-responsive .pn-institutional-section{min-width:0;scroll-margin-top:115px;padding-top:clamp(4rem,6vw,6.5rem);padding-bottom:clamp(4rem,6vw,6.5rem)}
.pn-institutional-responsive .pn-institutional-section>div{width:100%;min-width:0}
.pn-institutional-responsive .pn-institutional-section h1,.pn-institutional-responsive .pn-institutional-section h2{max-width:100%;overflow-wrap:break-word}
.pn-institutional-responsive .pn-institutional-section .grid{min-width:0;align-items:stretch}
.pn-institutional-responsive .pn-institutional-section .grid>*{min-width:0}
.pn-institutional-responsive .pn-institutional-section article{min-width:0;max-width:100%;height:100%}
.pn-institutional-responsive .pn-institutional-section article img{max-width:100%;object-fit:cover}
.pn-institutional-responsive [data-pn-section-kind="contact"]>div{display:flex;flex-direction:column;align-items:center}
.pn-institutional-responsive [data-pn-section-kind="contact"]>div>div:not(form){width:100%;max-width:56rem}
.pn-institutional-responsive [data-pn-section-kind="contact"] form{width:min(100%,48rem);margin-inline:auto}
.pn-institutional-responsive [data-pn-section-kind="contact"] form~*{max-width:100%}
.pn-institutional-responsive [data-pn-section-kind="contact"] h2,.pn-institutional-responsive [data-pn-section-kind="contact"]>div>p{text-align:center}
.pn-institutional-responsive [data-pn-section-kind="testimonials"]>div{max-width:100%}
.pn-institutional-responsive [data-pn-section-kind="testimonials"] article{box-sizing:border-box}
.pn-institutional-responsive .pn-institutional-section:not(.pn-immersive-hero) h2{margin-inline:auto;max-width:960px;text-align:center;line-height:1.15}
.pn-institutional-responsive .pn-section-heading{width:100%;margin-inline:auto;text-align:center!important}
.pn-institutional-responsive .pn-section-heading h2,.pn-institutional-responsive .pn-section-heading p{text-align:center!important;margin-inline:auto!important;max-width:100%!important}
.pn-institutional-responsive .pn-institutional-section .grid>article{display:flex;flex-direction:column;min-height:100%;border-radius:18px}
.pn-institutional-responsive .pn-institutional-section .grid>article>div:last-child{flex:1;min-width:0}
.pn-institutional-responsive .pn-institutional-section .grid>article img{width:100%;max-width:100%;object-fit:cover}

.pn-institutional-responsive .pn-institutional-section:not(.pn-immersive-hero)>div>div:first-child:has(>h2){margin-inline:auto;text-align:center}
.pn-institutional-responsive .pn-institutional-section article{border-radius:20px;overflow:hidden}
.pn-institutional-responsive .pn-institutional-section article p{overflow-wrap:anywhere;line-height:1.7}
.pn-institutional-responsive [data-pn-section-kind="contact"]>div>p,.pn-institutional-responsive [data-pn-section-kind="contact"]>div>div>p{max-width:760px;margin-inline:auto;text-align:center}
.pn-institutional-responsive [data-pn-section-kind="contact"] form{justify-self:center;align-self:center}
.pn-institutional-responsive [data-pn-section-kind="testimonials"]{overflow:hidden}
.pn-institutional-responsive [data-pn-section-kind="testimonials"] blockquote{min-width:0}

}
@media(min-width:1024px){
.pn-institutional-responsive .pn-institutional-section:not(.pn-immersive-hero)>div{max-width:min(100%,1280px)}
.pn-institutional-responsive [data-pn-section-kind="process"] .grid{gap:clamp(1rem,2vw,2rem)}
}
`}</style>}
        <section className={`${site.cinematic?.mode==="cinematic"&&"pn-cinematic-enabled "}${templateId==="minimalist-sophisticated"?"pn-template-editorial ":templateId==="modern-impactful"?"pn-template-impact ":templateId==="image-text-alternating"?"pn-template-alternating ":""}${publishedMode ? "w-full bg-white text-black" : "overflow-hidden rounded-2xl border border-white/15 bg-white text-black"}`}>{site.blocks.length>0&&site.extras?.enabled?.announcement!==false&&!!site.extras?.announcement&&<div className="overflow-hidden bg-[#173c2e] px-5 py-2 text-center text-sm text-white"><style>{`@keyframes pn-announcement-flow{to{transform:translateX(-50%)}}@media(prefers-reduced-motion:reduce){.pn-announcement-track{animation:none!important}}`}</style>{site.extras?.announcementMotion?<div className="pn-announcement-track flex w-max items-center" style={{animation:`pn-announcement-flow ${Math.max(8,Math.min(120,site.extras?.announcementSpeed||24))}s linear infinite`,animationDirection:site.extras?.announcementDirection==="right"?"reverse":"normal"}}>{[0,1].map(i=><div key={i} aria-hidden={i===1} className="flex shrink-0 items-center gap-12 pr-12">{Array.from({length:4},(_,j)=><span key={j} className="whitespace-nowrap">{site.extras?.announcement||"Conheça nossos serviços e entre em contato para saber mais."}</span>)}</div>)}</div>:site.extras?.announcement||"Conheça nossos serviços e entre em contato para saber mais."}</div>}{showHeader&&<header style={{backgroundColor:headerBackground,color:headerColor}} className={`z-50 border-b border-black/10 shadow-[0_2px_18px_rgba(0,0,0,.04)] ${header?.sticky===false?"relative":"sticky top-0"}`}><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-12"><a href="#inicio" onClick={()=>setMenuOpen(false)} className="flex min-w-0 max-w-[calc(100%-4rem)] items-center gap-2.5 text-sm font-bold tracking-tight sm:text-base">{header?.logoUrl?<img src={header.logoUrl} alt={brand} className="h-9 max-w-[150px] object-contain sm:h-11 sm:max-w-[200px]"/>:<span className="block max-w-[min(55vw,210px)] truncate whitespace-nowrap lg:max-w-[250px]">{brand}</span>}</a><nav aria-label="Navegação principal" className="hidden items-center gap-5 lg:flex">{nav.slice(0,5).map(g=><a key={g.id} href={"#"+g.id} className="text-sm font-medium opacity-80 transition hover:opacity-100">{navLabel(g)}</a>)}</nav><div className="flex shrink-0 items-center gap-3"><a href={ctaHref} style={adaptiveTemplate?{backgroundColor:adaptiveColor}:undefined} className="hidden rounded-full bg-[#193f31] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2b5b48] sm:inline-flex">{ctaLabel}</a><button type="button" aria-label={menuOpen?"Fechar menu":"Abrir menu"} aria-expanded={menuOpen} aria-controls="pn-builder-mobile-menu" onClick={()=>setMenuOpen(v=>!v)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-current/20 text-xl lg:hidden">{menuOpen?"×":"☰"}</button></div></div>{menuOpen&&<nav id="pn-builder-mobile-menu" aria-label="Navegação mobile" className="max-h-[min(65vh,470px)] overflow-y-auto border-t border-black/10 px-5 pb-4 pt-1 lg:hidden">{nav.map(g=><a key={g.id} href={"#"+g.id} onClick={()=>setMenuOpen(false)} className="block border-b border-black/10 py-2.5 text-sm font-medium">{navLabel(g)}</a>)}<a href={ctaHref} onClick={()=>setMenuOpen(false)} style={adaptiveTemplate?{backgroundColor:adaptiveColor}:undefined} className="mt-4 block rounded-xl bg-[#193f31] px-5 py-3 text-center text-sm font-semibold text-white">{ctaLabel}</a></nav>}</header>}
        {<CinematicBackground appearance={site.cinematic}/>}
        <div ref={previewRef} data-pn-template={adaptiveTemplate?"prompt-adaptive":undefined} className={adaptiveTemplate?"pn-motion-site":"pn-motion-site pn-institutional-responsive"} style={{backgroundColor:site.cinematic?.mode==="cinematic"&&(site.cinematic.desktopUrl||site.cinematic.mobileUrl)?"transparent":site.background}}>{adaptiveTemplate&&<style>{`
[data-pn-template="prompt-adaptive"] { --pn-accent: ${adaptiveColor}; --pn-surface:#181818; --pn-ink:#f5f5f5; --pn-muted:#cbd0d4; }
[data-pn-template="prompt-adaptive"] section { color:#f5f5f5; }
[data-pn-template="prompt-adaptive"] section[id*="process"] ol,[data-pn-template="prompt-adaptive"] section[id*="funciona"] ol {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
[data-pn-template="prompt-adaptive"] section :is(h1,h2,h3){overflow-wrap:anywhere}
[data-pn-template="prompt-adaptive"] section article {min-width:0}
/* Four-card sections use a balanced 2x2 composition rather than a stranded final row. */
@media(min-width:1280px){[data-pn-template="prompt-adaptive"] .pn-adaptive-services-grid:has(> :nth-child(4):last-child){grid-template-columns:repeat(2,minmax(0,1fr))}}
[data-pn-template="prompt-adaptive"] [data-pn-composition="services"] .grid > article{width:100%;height:100%}
[data-pn-template="prompt-adaptive"] [data-pn-composition="process"] .grid > article{width:100%}

/* Center section headings, not body copy, and keep each content row balanced. */
[data-pn-template="prompt-adaptive"] section [data-pn-composition] > div:first-child:is(.text-center){text-align:center}
[data-pn-template="prompt-adaptive"] section [data-pn-composition="services"] .grid{grid-auto-flow:row;justify-content:center}
[data-pn-template="prompt-adaptive"] section [data-pn-composition="services"] article{min-height:210px}
[data-pn-template="prompt-adaptive"] section [data-pn-composition="process"] article{align-items:stretch}
[data-pn-template="prompt-adaptive"] section [data-pn-composition="process"] article>div:last-child{min-width:0}

/* Adaptive layouts must fill their grids without clipping or false equal-height columns. */
[data-pn-template="prompt-adaptive"] section .grid > *{min-width:0;max-width:100%}
[data-pn-template="prompt-adaptive"] [data-pn-composition="services"] .pn-premium-card,[data-pn-template="prompt-adaptive"] [data-pn-composition="differentials"] .pn-premium-card,[data-pn-template="prompt-adaptive"] [data-pn-composition="modalities"] .pn-premium-card{position:relative;isolation:isolate;min-height:215px;background:linear-gradient(145deg,#22252b 0%,#16181d 72%);border:1px solid rgba(255,255,255,.11);border-top:1px solid rgba(255,255,255,.2)}
[data-pn-template="prompt-adaptive"] .pn-premium-card:before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:var(--pn-accent);border-radius:20px 0 0 20px}
[data-pn-template="prompt-adaptive"] .pn-premium-card h3{font-size:clamp(1.1rem,1.5vw,1.4rem);letter-spacing:-.025em;line-height:1.3}
[data-pn-template="prompt-adaptive"] .pn-premium-card p{line-height:1.75}
[data-pn-template="prompt-adaptive"] [data-pn-composition="modalities"] .pn-premium-card{min-height:265px}
[data-pn-template="prompt-adaptive"] [data-pn-composition="modalities"] .pn-premium-card:after{content:"↗";position:absolute;right:22px;top:18px;color:var(--pn-accent);font-size:25px}
[data-pn-template="prompt-adaptive"] section[id*="contato"] > div > p,[data-pn-template="prompt-adaptive"] section[id*="contato"] [data-block-id]:is(p){text-align:center!important;margin-left:auto;margin-right:auto}

[data-pn-template="prompt-adaptive"] section img{max-width:100%;object-fit:cover}
[data-pn-template="prompt-adaptive"] section[data-pn-section-kind="pricing"] .grid{align-items:stretch}
[data-pn-template="prompt-adaptive"] section[data-pn-section-kind="pricing"] article{height:100%}
[data-pn-template="prompt-adaptive"] section .pn-adaptive-testimonials{align-items:stretch}
@media(min-width:1280px){[data-pn-template="prompt-adaptive"] section .pn-adaptive-testimonials{grid-template-columns:repeat(4,minmax(0,1fr))}}

[data-pn-template="prompt-adaptive"] section .pn-adaptive-testimonials blockquote {min-width:0}
/* Scoped responsive layout contracts for the prompt-adaptive template. */
[data-pn-template="prompt-adaptive"] [data-pn-composition="services"] .grid{align-items:stretch}
[data-pn-template="prompt-adaptive"] [data-pn-composition="services"] article{height:100%;box-shadow:none;min-width:0}
[data-pn-template="prompt-adaptive"] [data-pn-composition="services"] article>div:last-child{flex:1}
[data-pn-template="prompt-adaptive"] [data-pn-composition="team"] article{min-width:0;align-items:center}
[data-pn-template="prompt-adaptive"] [data-pn-composition="modalities"] article{height:100%;min-width:0}
[data-pn-template="prompt-adaptive"] section :is(h2,h3,p){overflow-wrap:break-word}
@media(max-width:767px){[data-pn-template="prompt-adaptive"] [data-pn-composition="modalities"] .grid{grid-template-columns:1fr 1fr}}
@media(max-width:420px){[data-pn-template="prompt-adaptive"] [data-pn-composition="modalities"] .grid{grid-template-columns:1fr}}

/* Responsive editorial layouts: prevent a single orphan process card and distribute cards evenly. */
@media(min-width:1280px){[data-pn-template="prompt-adaptive"] section[id*="process"] .grid,[data-pn-template="prompt-adaptive"] section[id*="funciona"] .grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
[data-pn-template="prompt-adaptive"] section .pn-adaptive-testimonials{width:100%;max-width:none}
[data-pn-template="prompt-adaptive"] section .pn-adaptive-testimonials blockquote{height:100%;display:flex;flex-direction:column;overflow-wrap:anywhere}
[data-pn-template="prompt-adaptive"] section .pn-adaptive-testimonials blockquote>*:last-child{margin-top:auto}

@media(max-width:640px){[data-pn-template="prompt-adaptive"] section[id*="process"] ol,[data-pn-template="prompt-adaptive"] section[id*="funciona"] ol{grid-template-columns:1fr}}

[data-pn-template="prompt-adaptive"] section article { background:#181818 !important; border-color:var(--pn-accent); color:#f5f5f5 !important; box-shadow:0 14px 40px rgba(0,0,0,.18); }
[data-pn-template="prompt-adaptive"] section article h3,
[data-pn-template="prompt-adaptive"] section article p,
[data-pn-template="prompt-adaptive"] section article li,
[data-pn-template="prompt-adaptive"] section article span { color:#f5f5f5 !important; opacity:1; }
[data-pn-template="prompt-adaptive"] section article p { color:#d6d9df !important; }
[data-pn-template="prompt-adaptive"] section article a { background:var(--pn-accent); border-color:var(--pn-accent); color:#fff !important; }
[data-pn-template="prompt-adaptive"] section article:hover { transform:translateY(-3px); transition:transform .2s ease; }
[data-pn-template="prompt-adaptive"] section article h3 { font-family:inherit !important; font-weight:750; }
[data-pn-template="prompt-adaptive"] section h2 { text-shadow:0 1px 1px rgba(0,0,0,.18); }
[data-pn-template="prompt-adaptive"] section form { color:#24332e; }
[data-pn-template="prompt-adaptive"] section:nth-of-type(3n+2) article { border-radius:10px 30px 10px 30px; }
[data-pn-template="prompt-adaptive"] section:nth-of-type(3n+3) article { border-left:4px solid var(--pn-accent); border-top-color:#35373d; border-right-color:#35373d; border-bottom-color:#35373d; border-radius:18px; }
[data-pn-template="prompt-adaptive"] section article img { width:100%; object-fit:cover; }
[data-pn-template="prompt-adaptive"] section[data-pn-section-kind="statistics"] article { border:0 !important; border-radius:0 !important; box-shadow:none !important; background:transparent !important; padding:18px 4px !important; }
[data-pn-template="prompt-adaptive"] section[data-pn-section-kind="statistics"] article:hover { transform:none; }
[data-pn-template="prompt-adaptive"] section[data-pn-section-kind="statistics"] .grid { gap:16px 32px; }
[data-pn-template="prompt-adaptive"] section[data-pn-section-kind="pricing"] article { border:1px solid #34363b !important; border-top:3px solid var(--pn-accent) !important; border-radius:22px !important; }
[data-pn-template="prompt-adaptive"] section[data-pn-section-kind="team"] article { border:0 !important; border-bottom:1px solid #35363a !important; border-radius:0 !important; box-shadow:none !important; }
[data-pn-template="prompt-adaptive"] section[data-pn-section-kind="team"] article:hover { transform:none; }
[data-pn-template="prompt-adaptive"] section h2 { overflow-wrap:anywhere; }
[data-pn-template="prompt-adaptive"] .pn-adaptive-testimonials { scrollbar-width:thin;scrollbar-color:var(--pn-accent) transparent; }
[data-pn-template="prompt-adaptive"] .pn-adaptive-testimonials blockquote {overflow-wrap:anywhere;}
[data-pn-template="prompt-adaptive"] section article:has(>div>span:first-child) {transition:transform .2s ease;}
[data-pn-template="prompt-adaptive"] [data-pn-section-kind="pricing"] article {border-radius:24px !important;min-height:380px;box-shadow:0 18px 50px rgba(0,0,0,.25)}
[data-pn-template="prompt-adaptive"] [data-pn-section-kind="pricing"] article a {display:flex;width:100%;text-align:center;justify-content:center}

[data-pn-template="prompt-adaptive"] section h2 { color:#fff !important; }
[data-pn-template="prompt-adaptive"] section form h2,[data-pn-template="prompt-adaptive"] section form p { color:#24332e; }

@media (prefers-reduced-motion:reduce){[data-pn-template="prompt-adaptive"] section article:hover{transform:none;}}

`}</style>}{!site.blocks.length && <div className="flex min-h-[420px] flex-col items-center justify-center px-8 py-16 text-center"><p className="text-2xl font-bold text-slate-900">Seu site ainda não foi gerado</p><p className="mt-3 max-w-md text-slate-600">Escreva no chat, por exemplo: Faça um site premium para advogados. Depois clique em Enviar e aplicar.</p></div>}{visibleSections.map((group,index)=>{
          const blocks=group.blocks;
          const first=blocks[0];
          const id=group.id.toLowerCase();
          const layout=(/pergunt|faq/i.test(id+" "+blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" "))?"faq":undefined) || (/galeria|foto|portf[oó]lio/i.test(id)?"gallery":undefined) || first?.layout || (/servic|tratament|especialidade|benefic|diferencia|atuacao|atua[cç][aã]o|processo|etapas/.test(id)?"grid":/pergunt|faq/.test(id)?"faq":/galeria|foto/.test(id)?"gallery":/equipe|estrutura|sobre|institucional/.test(id)?"split":index===0?"hero":"standard");
          const preset=designPresets.find(p=>p.match.test(site.title))||designPresets[3];
          const theme = /advoga|jurid|direito|escritorio/i.test(site.title) ? premiumThemes.legal : /clinic|odonto|medic|saude/i.test(site.title) ? premiumThemes.health : premiumThemes.creative;
          // Incomplete editorial sections must not reserve empty space in the published page.
          if(/conte[uú]do|artigo|blog|not[ií]cia|publica[cç][aã]o/i.test(id) && blocks.filter(b=>b.type==="paragraph"&&removeVisualDirectives(b.text).trim().length>80).length<2)return null;
          const sectionBackground=(adaptiveTemplate?(index===0?"#090909":index%3===0?"#11151b":index%3===1?"#181818":"#0d0e11"):templateId==="image-text-alternating"?(index%2===0?"#ffffff":"#f1f6f5"):templateId==="minimalist-sophisticated" ? (index%2===0?"#ffffff":"#f7f8f5") : first?.background)||(templateId==="modern-impactful"?(index%2===0?"#12151b":"#202532"):templateId==="minimalist-sophisticated"?(index%2===0?"#f7f5f0":"#eae7df"):(index===0?theme.dark:index%2?theme.light:site.background));

          
          const heroPhotoCandidate=blocks.find(b=>b.type==="image"&&!!b.src)?.src || (index===0 ? visibleSections.flatMap(section=>section.blocks).find(b=>b.type==="image"&&!!b.src)?.src : undefined);
          const multiHero=index===0&&(site.heroComposition==="duo"||site.heroComposition==="trio")&&blocks.filter(b=>b.type==="image"&&!!b.src).length>=(site.heroComposition==="duo"?2:3);
          const immersiveHero=multiHero||(index===0&&(templateId==="modern-impactful"||templateId==="image-text-alternating"||site.heroPresentation!=="split")&&!!heroPhotoCandidate);
          const immersivePhoto=immersiveHero&&!multiHero?heroPhotoCandidate:undefined;
          const heading=blocks.filter(b=>b.type==="heading").slice(0,1);
          const images=blocks.filter(b=>b.type==="image"&&!!b.src);
          const paragraphs=blocks.filter(b=>b.type==="paragraph");
          const buttons=blocks.filter(b=>b.type==="button");
          const visualLayout=layout==="standard"&&paragraphs.length>=3?"grid":layout;
          const editorialTone=/est[eé]tica|beleza|spa|luxo|arquitetura|interior|moda/i.test(site.title+" "+group.id)&&!/academia|fitness|muscula[cç][aã]o|treino|ironfit/i.test(site.title+" "+site.niche);
          const displayFont=editorialTone?"Georgia, Times New Roman, serif":"inherit";
          const isGallery=visualLayout==="gallery"||/portf[oó]lio|galeria/i.test(id+" "+blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" "));
          const clean=(value:string)=>removeVisualDirectives(value).replace(/\s*[-–—]\s*(?:(?:grid|hero|faq|banner|split|standard|gallery)|(?:fundo\s+)?(?:areia|branco|verde|escuro|claro|preto))(?:\s*[-–—]\s*(?:(?:fundo\s+)?(?:areia|branco|verde|escuro|claro|preto)))*/giu,"").replace(/\s*[-–—,;]?\s*(?:layout|design|background|fundo)\s*:\s*[^,;]+/giu,"").replace(/\s*[-–—]\s*$/u,"").trim();
          const textItems=paragraphs.filter(b=>!/^\s*\(?(apresente|adicione|insira|coloque|crie)\s.+layout/i.test(b.text));
          const galleryImages:Block[]=isGallery?(()=>{
            const existing=images.filter((block,i,all)=>!!block.src&&all.findIndex(item=>item.src===block.src)===i);
            // Reuse the existing About/Presentation image as the fourth gallery photo.
            // The original About section stays untouched. Respect galleries explicitly
            // customized with four or more photos by the customer/AI.
            const aboutPhoto=sections
              .filter(candidate=>candidate.id!==group.id&&/sobre|apresent|institucional|quem.somos|nossa.hist[oó]ria|a.cl[ií]nica/i.test(candidate.id+" "+candidate.blocks.filter(item=>item.type==="heading").map(item=>item.text).join(" ")))
              .flatMap(candidate=>candidate.blocks)
              .find(item=>item.type==="image"&&!!item.src&&!existing.some(photo=>photo.src===item.src));
            const borrowed=aboutPhoto?{...aboutPhoto,id:"gallery-reuse-"+aboutPhoto.id,section:group.id}:undefined;
            const bankCatalog=nichePhotoCatalog as Record<string,{desktop:string[];mobile:string[]}>;
            const titleAndHeadings=(site.title+" "+blocks.filter(item=>item.type==="heading").map(item=>item.text).join(" ")).toLocaleLowerCase("pt-BR");
            const bankKey=(selectedNiche&&bankCatalog[selectedNiche]?selectedNiche:undefined)
              ||Object.keys(bankCatalog).find(name=>titleAndHeadings.includes(name.toLocaleLowerCase("pt-BR")))
              ||(/psicolog/i.test(titleAndHeadings)?"Psicologia":undefined);
            const bank=bankKey?bankCatalog[bankKey]:undefined;
            const fallback:Block[]=bank?[3,4,5,2,1,0].filter(i=>!!bank.desktop[i]&&!!bank.mobile[i]).map(i=>({id:"gallery-niche-"+i,type:"image",text:"Fotografia ilustrativa",color:"#ffffff",align:"center" as const,section:group.id,src:nichePhotoBase+bank.desktop[i]+".png",mobileSrc:nichePhotoBase+bank.mobile[i]+".png"})):[];
            // Prefer the About photo over generated fallback photos for slot four.
            // Do not cap user-authored galleries or overwrite any existing images.
            if(site.sectionMediaManaged?.includes(group.id))return existing;
            const preferred=existing.length>=4?existing:[...existing,...(borrowed?[borrowed]:[])];
            return [...preferred,...fallback].filter((item,i,all)=>!!item.src&&all.findIndex(photo=>photo.src===item.src)===i).slice(0,Math.max(4,existing.length));
          })():images;
          const cardItems=isGallery?galleryImages:(/servic|tratament|modalidad|procediment/i.test(id)?textItems:textItems.slice(0,6));
          const isProcess=/etapas|processo|passos|como[- ]funciona|atendimento|metodologia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const isTestimonials=/depoiment|testemunh|avalia[cç][aã]o|relatos?.de.clientes/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const adaptiveTeam=adaptiveTemplate&&/equipe|profissionais|especialistas/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const adaptiveModalities=adaptiveTemplate&&/modalidades|atividades/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const testimonials=textItems.filter(b=>clean(b.text).length>18).slice(0,6);
          const testimonialInfo=(item:Block)=>{const raw=clean(item.text).replace(/^[“"]|[”"]$/g,"").trim();const parts=raw.includes("|")?raw.split(/\s*\|\s*/).map(p=>p.trim()).filter(Boolean):raw.split(/\s+[—–]\s+/).map(p=>p.trim()).filter(Boolean);const first=parts[0]||"";const validName=/^[\p{L}.'-]+(?:\s+[\p{L}.'-]+){1,4}$/u.test(first)&&!/^depoimento/i.test(first);const name=!adaptiveTemplate&&parts.length>=3&&validName?first:"";const city=name?parts[1]:"";const message=name?parts.slice(2).join(" — "):raw.replace(/^depoimento\s*\d+\s*[:—–-]?\s*/i,"");return {name,city,message,photo:images.find(photo=>photo.id===item.id+"-photo"||photo.text===name)?.src||""};};
          const isPrinciples=/princip|diferencia|valores|filosofia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const processPhotos=isProcess?previewBlocks.filter(b=>b.type==="image"&&!!b.src).slice(0,24):[];
          const processCardPhotos:Array<Block|undefined>=isProcess?distinctProcessCardPhotos({
            cards:textItems.map(item=>({id:item.id})),
            photos:[...processPhotos,...images.filter(photo=>!!photo.src&&!processPhotos.some(p=>p.id===photo.id))],
            niche:site.niche||selectedNiche,title:site.title,
            catalog:nichePhotoCatalog as Record<string,{desktop:string[];mobile:string[]}>,
            baseUrl:nichePhotoBase,crmImported:site.crmImported===true,
            appendExtra:textItems.length===3
          }).map(photo=>photo?.src?{...photo,type:"image" as const,text:photo.text||"Imagem ilustrativa",color:"#ffffff",align:"center" as const,section:group.id}:undefined):[];
          const cardText=(b:Block)=>{const parts=clean(b.text).split(/:\s|\s[—–]\s/);const description=parts.length>1?parts.slice(1).join(" — ").trim():clean(b.text);const name=parts.length>1?parts[0].trim():"";return {name,description:name&&description.toLocaleLowerCase("pt-BR").startsWith(name.toLocaleLowerCase("pt-BR"))?description.slice(name.length).replace(/^[\s,.:—–-]+/,"").trim()||description:description};};
          const safeColor=(color:string)=>{const c=readableColor(color,sectionBackground);const lightBackground=/^#(?:[cdef][0-9a-f]|f[0-9a-f]|[a-f]{3})/i.test(sectionBackground)||/^(white|#fff(?:fff)?)$/i.test(sectionBackground);if(lightBackground&&(/^#(?:[cdef][0-9a-f]|f[0-9a-f])/i.test(c)||/^(?:white|#fff(?:fff)?)$/i.test(c)))return "#26382f";const dark=/^#(?:1[0-9a-f]|2[0-9a-f]|3[0-9a-f])/i.test(sectionBackground);return dark&&/^#(?:0[0-9a-f]|1[0-9a-f]|2[0-9a-f]|3[0-9a-f])/i.test(c)?"#f7f4eb":c;};
          const render=(b:Block)=> {
            if(b.type==="heading") return <h2 key={b.id} data-block-id={b.id} style={{textAlign:b.align||(!adaptiveTemplate?"center":undefined),color:immersiveHeroTextColor(!adaptiveTemplate&&!b.colorExplicit&&visualLayout!=="hero"?"#234638":b.color||safeColor(b.color),immersiveHero,b.colorExplicit),["--pn-block-color" as string]:immersiveHeroTextColor(!adaptiveTemplate&&!b.colorExplicit&&visualLayout!=="hero"?"#234638":b.color||safeColor(b.color),immersiveHero,b.colorExplicit),fontFamily:b.fontFamily||displayFont,fontSize:b.fontSize?`${b.fontSize}px`:undefined,...(b.mobileFontSize?{["--pn-mobile-font-size" as string]:`${b.mobileFontSize}px`}:{})}} data-pn-responsive-mobile-size={b.mobileFontSize?"true":undefined} className={visualLayout==="hero"?"max-w-3xl text-[clamp(2rem,4.2vw,3.9rem)] font-medium leading-[1.04] tracking-[-.05em]":adaptiveTemplate?"mx-auto max-w-4xl text-center text-[clamp(1.65rem,3vw,2.8rem)] font-medium":"mx-auto max-w-4xl text-center text-[clamp(1.65rem,3vw,2.8rem)] font-medium leading-[1.1] tracking-[-.045em]"}>{publicHeading(b.text,id)}</h2>;
            if(b.type==="paragraph") return <p key={b.id} data-block-id={b.id} style={{textAlign:b.align||undefined,color:immersiveHeroTextColor(b.color||readableColor(safeColor(b.color),sectionBackground),immersiveHero,b.colorExplicit),["--pn-block-color" as string]:immersiveHeroTextColor(b.color||readableColor(safeColor(b.color),sectionBackground),immersiveHero,b.colorExplicit),fontSize:b.fontSize?`${b.fontSize}px`:undefined}} className={!adaptiveTemplate&&b.section===group.id&&heading.some(h=>h.id===b.id)?"mx-auto max-w-2xl text-center text-[15px] leading-[1.65] md:text-lg":"max-w-2xl text-[15px] leading-[1.65] md:text-lg"}>{clean(b.text).replace(/(?:telefone\s*:\s*)?\(?11\)?\s*1234[-\s]?5678/gi,"")}</p>;
            if(b.type==="image") return b.src?<picture key={b.id} data-block-id={b.id}>{b.mobileSrc&&<source media="(max-width: 767px)" srcSet={b.mobileSrc}/>}<img src={b.src} alt={b.text||"Fotografia do negócio"} loading="lazy" onError={event=>{const img=event.currentTarget;if(img.dataset.fallbackAttempted||b.userUploaded)return;img.dataset.fallbackAttempted="true";const niche=Object.keys(nichePhotoCatalog).find(name=>site.title.toLocaleLowerCase("pt-BR").includes(name.toLocaleLowerCase("pt-BR")))||(/psicolog|terap/i.test(site.title)?"Psicologia":undefined);const entry=niche?(nichePhotoCatalog as Record<string,{desktop:string[];mobile:string[]}>)[niche]:undefined;const candidates=entry?.desktop||[];if(candidates.length){const source=img.parentElement?.querySelector("source");source?.remove();img.src=nichePhotoBase+candidates[Math.abs(b.id.split("").reduce((n,c)=>n+c.charCodeAt(0),0))%candidates.length]+".png";}else{img.style.display="none";}}} data-pn-image-fit={b.imageFit} className="aspect-[4/3] w-full rounded-2xl object-cover" style={{objectFit:b.imageFit||"cover",objectPosition:b.imagePosition||"center"}}/></picture>:null;
            const proof=site.socialProof;
            const showProof=index===0&&buttons[0]?.id===b.id&&proof?.enabled!==false&&(!adaptiveTemplate||(typeof proof?.rating==="number"&&typeof proof?.reviewCount==="number"&&proof.reviewCount>0));
            const rating=typeof proof?.rating==="number"&&proof.rating>0&&proof.rating<=5?proof.rating:4.9;
            const count=typeof proof?.reviewCount==="number"&&proof.reviewCount>0?proof.reviewCount:287;
            const isExample=!(typeof proof?.rating==="number"&&typeof proof?.reviewCount==="number");
            const social=<div className="mt-6 grid w-full max-w-[540px] grid-cols-[auto_minmax(0,1fr)] items-center justify-start gap-x-4 gap-y-2 text-left sm:gap-x-5" aria-label="Prova social"><div className="flex -space-x-2.5">{(proof?.avatars?.length?proof.avatars.slice(0,3):proof?.initials?.length?proof.initials.slice(0,3):["MV","AL","+5k"]).map((avatar,i)=>proof?.avatars?.length?<img key={i} src={avatar} alt={"Cliente "+(i+1)} className="h-11 w-11 rounded-full border-[3px] border-white object-cover"/>:<span key={i} className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white bg-[#f8e9d6] text-sm font-semibold text-[#142943]">{avatar}</span>)}</div><div className="min-w-0 text-left leading-tight"><p className="text-base font-semibold" style={{color:readableColor("#ffffff",sectionBackground)}}>{rating.toLocaleString("pt-BR",{maximumFractionDigits:1})}/5 <span className="font-normal">no {proof?.platform||"Google"}</span></p><p className="mt-1 text-sm" style={{color:readableColor("#e8bd72",sectionBackground)}}>+{count.toLocaleString("pt-BR")} avaliações</p>{isExample&&<span className="mt-1 block text-[10px] opacity-70" style={{color:readableColor("#ffffff",sectionBackground)}}>Dados ilustrativos · personalize com avaliações reais</span>}</div></div>;
            return <div key={b.id} className="w-full"><span className="flex w-full" style={{justifyContent:b.align==="center"?"center":b.align==="right"?"flex-end":"flex-start"}}><a data-block-id={b.id} href={b.href&&/^(https?:\/\/|mailto:|tel:|#)/.test(b.href)?b.href:(/agend|contato|convers|consulta|orçamento|saiba mais/i.test(b.text)?"#contato":undefined)} style={{backgroundColor:b.color,color:b.textColor||readableColor("#ffffff",b.color),...(typeof b.radius==="number"?{borderRadius:`${b.radius}px`}:{})}} className="inline-flex min-h-12 items-center justify-center rounded-xl px-7 py-3 text-sm font-semibold">{clean(b.text)}</a></span>{showProof&&social}</div>;
          };
          const isContact=/contato|agend|fale.conosco/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const hasContactAction=buttons.some(b=>!!b.href&&/^(https?:\/\/|mailto:|tel:)/i.test(b.href));
          const sectionImages=isPrinciples?[]:isGallery?galleryImages:images;
          const uniqueImages=sectionImages.filter((b,i,all)=>!!b.src&&all.findIndex(other=>other.src===b.src)===i);
          const visualCards=cardItems.filter(b=>b.type==="paragraph").filter(b=>b.text.trim().length>0).filter(b=>!/^solu[cç][oõ]es sofisticadas/i.test(b.text.trim())).filter(b=>!/^\s*(?:conheça|descubra|oferecemos|apresentamos|explore)\b/i.test(b.text.trim())||/[:—–]/.test(b.text));
          const seenCardTitles=new Set<string>();
          const uniqueVisualCards=visualCards.filter(item=>{const title=cardText(item).name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ");if(!title)return true;if(seenCardTitles.has(title))return false;seenCardTitles.add(title);return true;});
          const sectionHasPhotos=uniqueImages.length>0&&visualCards.length>0;
          const isTreatments=/tratament|servi[cç]os|servic|procediment/i.test(id);
          const adaptivePricing=adaptiveTemplate&&/planos|pre[cç]os|pricing|investimento/i.test(id);
          const adaptiveServices=adaptiveTemplate&&isTreatments;
          const adaptiveDifferentials=adaptiveTemplate&&/diferencia|por.que|escolher/i.test(id);
          const isDifferentials=/diferencia|por.que|vantagen|escolher|escolha|excel[eê]ncia|compromisso|jornada|valores|filosofia|hist[oó]ria|ess[eê]ncia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const editorialCards=uniqueVisualCards.filter(item=>{const card=cardText(item);return card.description.length>8;});
          const editorialTitle=(item:Block,i:number)=>{const card=cardText(item);return card.name&&!/^destaque\s*\d+$/i.test(card.name)?card.name:(isDifferentials?["Atenção aos detalhes","Experiência acolhedora","Cuidado em cada etapa","Compromisso com você","Um espaço para você"][i%5]:["Cuidado personalizado","Conheça nossos serviços","Sua experiência","Nosso atendimento"][i%4]);};
          const useEditorialGrid=!adaptiveTemplate&&visualLayout==="grid"&&(isTreatments||isDifferentials)&&editorialCards.length>=2;
          const treatmentHasCompletePhotos=uniqueImages.length>=editorialCards.slice(0,6).length;
          const useTextOnlyTreatments=isTreatments&&!treatmentHasCompletePhotos;
          // Default editorial structure: three process cards + the original hero photo as card four.
          // A chat instruction can disable this, or supply a different number of process cards.
          const featureProcessCard=!adaptiveTemplate&&site.processImageCard!==false&&site.heroPresentation!=="split"&&index>0&&isProcess&&
            textItems.length===3&&!!heroSourceImage?.src&&/processo|etapas|passos|metodologia|como.funciona|atendimento/i.test(id);

          // Template 5: render statistics from editable blocks, never from invented defaults.
          // Keep original block IDs so editor/chat updates remain authoritative.
          const adaptiveStatistics=adaptiveTemplate&&/n[uú]meros|indicadores|estat[ií]sticas|resultados.em.n[uú]meros/i.test(id+" "+heading.map(b=>b.text).join(" "));
          if(adaptiveStatistics){
            const stats=paragraphs.map(block=>{
              const value=block.text.match(/(?:^|[:—–-]\s*)(\d{1,6}(?:[.,]\d{1,2})?)\s*(\+|%|anos?|mil)?/i);
              if(!value)return null;
              const raw=value[1].replace(",",".");
              const numeric=Number(raw);
              if(!Number.isFinite(numeric))return null;
              const label=block.text.replace(value[0]," ").replace(/\(?n[uú]mero demonstrativo e ilustrativo\)?\.?/gi,"").replace(/^[:\s—–-]+|[:\s—–-]+$/g,"").trim();
              return {block,numeric,suffix:value[2]||"",label:label||"Indicador"};
            }).filter((item):item is NonNullable<typeof item>=>item!==null);
            if(stats.length)return <section data-pn-section-kind="statistics" id={group.id} key={group.id+"-"+index} data-section-id={group.id} className="pn-institutional-section scroll-mt-20 px-6 py-16 md:px-12 md:py-24" style={{backgroundColor:sectionBackground}}>
              <div className="mx-auto max-w-6xl">
                {heading.map(block=><h2 key={block.id} data-block-id={block.id} className="mb-10 text-left text-3xl font-bold tracking-tight md:text-5xl" style={{color:"#ffffff"}}>Nossos números</h2>)}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{stats.map(item=><article key={item.block.id} data-block-id={item.block.id} className="p-5 md:p-8" style={{border:"none",boxShadow:"none",backgroundColor:"transparent"}}>
                  <AdaptiveStatCounter value={item.numeric} suffix={item.suffix} color={adaptiveColor}/>
                  <p className="mt-3 text-sm font-medium md:text-base" style={{color:adaptiveDark?"#d1d5db":"#374151"}}>{item.label}</p>
                </article>)}</div>
              </div>
            </section>;
          }
          // Skip AI-generated sections without usable customer-facing content.
          const contentParagraphs=paragraphs.filter(b=>clean(b.text).length>35 && !isDesignInstruction(b.text));
          if(!images.length && !buttons.length && contentParagraphs.length===0 && !/faq|perguntas|d[uú]vidas|contato|agend/i.test(id))return null;
          const visibleHeading=heading.some(b=>publicHeading(b.text,id).trim().length>0);
          if(!visibleHeading && !images.length && !buttons.length) return null;
          const headingNode=<div className="pn-section-heading mx-auto mb-8 max-w-4xl space-y-3 text-center md:mb-11">{heading.map(b=>{
            if(adaptiveTemplate){
              const kind=id.toLowerCase();
              const cleanTitle=/n[uú]meros|indicadores|estat[ií]sticas/.test(kind)?"Nossos números":
                /galeria/.test(kind)?"Galeria de imagens":
                /depoiment/.test(kind)?"Depoimentos":
                /processo|como.funciona|etapas/.test(kind)?"Como funciona":
                /planos|investimento|pre[cç]os/.test(kind)?"Planos e investimento":
                b.text.replace(/\s*[—–-]\s*(?:fundo|layout|com contagem|indicadores animados|responsiv|#[0-9a-f]{6}).*$/i,"").trim();
              return render({...b,text:cleanTitle});
            }
            return isGallery&&b.type==="heading"&&/resultados/i.test(b.text)?render({...b,text:b.text.replace(/resultados/gi,"Imagens")}):render(b);
          })}</div>;
          const editorialVisuals=uniqueImages.filter(b=>!!b.src);
          const cardImage=(card:Block,i:number)=>isTreatments&&!treatmentHasCompletePhotos?undefined:(images.find(image=>image.forCardId===card.id)||editorialVisuals[i]);
          const editorialCardsForDisplay=textItems.filter(b=>b.type==="paragraph"&&b.text.trim().length>0);
          const editorialPhotoCard=(b:Block,i:number)=> cardImage(b,i) ? <article key={b.id} data-block-id={b.id} className="pn-editorial-photo-card group min-w-0 overflow-hidden rounded-xl border border-[#e4e7e3] bg-white"><div className="relative aspect-[4/3] overflow-hidden bg-[#f1f3f0]"><img src={cardImage(b,i)?.src} alt={editorialTitle(b,i)} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" style={{objectFit:cardImage(b,i)?.imageFit||"cover",objectPosition:cardImage(b,i)?.imagePosition||"center"}}/></div><div className="p-5 text-left sm:p-6"><span className="mb-3 block text-left text-xs font-bold tracking-[.2em] text-[#607787]">{String(i+1).padStart(2,"0")}</span><div className="text-left [&_p]:!text-left [&_p]:!text-[1rem] [&_p]:!leading-relaxed">{render(b)}</div></div></article> : <div key={b.id} data-block-id={b.id} className="pn-editorial-text-card min-w-0 rounded border border-[#e5eaf0] bg-white px-5 py-5 sm:px-6 sm:py-6" style={{display:"flex",flexDirection:"column",justifyContent:"flex-start",alignSelf:"start",height:"auto",minHeight:0,gap:"12px"}}><span className="block text-left text-xs font-bold leading-5 tracking-[.2em] text-[#607787]" style={{position:"static",margin:0}}>{String(i+1).padStart(2,"0")}</span><div className="min-w-0 text-left [&_p]:!m-0 [&_p]:!text-left [&_p]:!text-[1rem] [&_p]:!leading-relaxed">{render(b)}</div></div>;
          const imageNode=(b:Block,i:number)=><div key={b.id} className={i===0?"overflow-hidden rounded-[1.75rem]":"overflow-hidden rounded-2xl"}>{b.src?render(b):<div data-block-id={b.id} className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-[#c5cbbf] bg-[#f1f1e9] text-center text-sm text-[#52615a]">{b.text||"Adicionar imagem"}</div>}</div>;
          if(isGallery&&galleryImages.length===0&&textItems.length===0&&buttons.length===0)return null;
          return <section id={isContact?"contato":group.id} key={group.id+"-"+index} data-section-id={group.id} data-pn-section-kind={isContact?"contact":isTestimonials?"testimonials":isProcess?"process":isGallery?"gallery":"content"} style={{backgroundColor:sectionBackground,...(immersivePhoto?{backgroundImage:`linear-gradient(90deg,rgba(9,19,28,.90),rgba(9,19,28,.54)),url("${immersivePhoto.replace(/"/g,"%22")}")`,backgroundSize:"cover",backgroundPosition:"center"}:{})}} className={`pn-institutional-section scroll-mt-20 overflow-hidden ${immersiveHero?"pn-immersive-hero":""} ${multiHero?"pn-carousel-hero":""} ${templateId==="minimalist-sophisticated"?"px-5 py-8 sm:px-8 sm:py-12 md:px-14 md:py-14":"px-5 py-10 sm:px-8 sm:py-14 md:px-14 md:py-16"}`}>
            <div className={multiHero?"w-full":"mx-auto max-w-6xl"}>
              {multiHero?
                <BuilderV2HeroSlideshow
                  slides={images.slice(0,site.heroComposition==="trio"?3:2).map((image,i)=>({
                    id:image.id,src:image.src!,mobileSrc:image.mobileSrc,
                    imageFit:image.imageFit,imagePosition:image.imagePosition,
                    ...(i===0?{}:{
                      title:/arquitet|interior|design/i.test(site.title)?"Arquitetura que inspira novas perspectivas":"Novas perspectivas para seu próximo projeto",
                      description:/arquitet|interior|design/i.test(site.title)?"Espaços com personalidade, harmonia e atenção aos detalhes.":"Conheça outras possibilidades e descubra o que podemos construir juntos.",
                      buttonText:buttons[0]?.text||"Conheça nossos serviços",
                      buttonHref:buttons[0]?.href||"#"+(visibleSections.find(g=>/servic|tratament/i.test(g.id))?.id||"contato")
                    }),
                    ...(site.heroBannerCopy?.[image.id]||{})
                  }))}
                  firstAlign={adaptiveTemplate?(heading[0]?.align||"center"):"center"}
                  firstContent={<>
                    {headingNode}
                    <div className={adaptiveTemplate?"mx-auto w-full max-w-3xl space-y-4 text-center [&_p]:!mx-auto [&_p]:!text-center":"mx-auto max-w-2xl space-y-4 text-center [&_p]:!mx-auto [&_p]:!text-center"}>{textItems.slice(0,3).map(render)}</div>
                    {(!adaptiveTemplate||!/planos|pre[cç]os|pricing/i.test(id))&&buttons.length>0&&<div className={"flex flex-wrap items-start gap-3 "+(buttons[0]?.align==="right"?"justify-end":"justify-center")}>{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div>}
                  </>}
                />:
              immersiveHero?
                <div className={adaptiveTemplate?"relative z-10 mx-auto flex min-h-[450px] w-full max-w-5xl flex-col items-center justify-center gap-5 py-6 text-center sm:min-h-[520px] sm:gap-7 lg:min-h-[590px] lg:py-14":"relative z-10 mx-auto flex min-h-[450px] w-full max-w-4xl flex-col items-center justify-center gap-5 py-6 text-center sm:min-h-[520px] sm:gap-7 lg:min-h-[590px] lg:py-14"}>
                  {headingNode}
                  <div className={adaptiveTemplate?"max-w-2xl space-y-4":"mx-auto max-w-2xl space-y-4 text-center [&_p]:!mx-auto [&_p]:!text-center"}>{textItems.slice(0,3).map(render)}</div>
                  {(!adaptiveTemplate||!/planos|pre[cç]os|pricing/i.test(id))&&buttons.length>0&&<div className={`flex flex-wrap items-start gap-3 ${adaptiveTemplate?"justify-center":buttons[0]?.align==="right"?"justify-end":"justify-center"}`}>{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div>}
                </div>:
              featureProcessCard?
                <div className="mx-auto w-full max-w-6xl">
                  {headingNode}
                  <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {textItems.map((item,i)=>{
                      const card=cardText(item);
                      const photo=processCardPhotos[i];
                      return <article key={item.id} data-block-id={item.id} style={{...(item.radius?{borderRadius:`${item.radius}px`}:{}),...(item.cardBorderWidth!==undefined?{borderWidth:`${item.cardBorderWidth}px`,borderStyle:"solid" as const,borderColor:item.cardBorderColor||"#E5E7EB"}:{}),...(item.cardShadow?{boxShadow:item.cardShadow}:{})}} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#e4e0d8] border-l-[5px] border-l-[#527566] bg-white shadow-[0_8px_24px_rgba(20,35,29,.04)]">
                        {photo?.src&&<picture data-block-id={photo.id} className="block aspect-[16/10] w-full overflow-hidden bg-[#eff1ec]">
                          {photo.mobileSrc&&<source media="(max-width: 767px)" srcSet={photo.mobileSrc}/>}
                          <img src={photo.src} alt={photo.text||card.name||"Imagem ilustrativa"} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"/>
                        </picture>}
                        <div className="flex grow flex-col p-5 sm:p-6">
                          <span className="mb-4 inline-flex w-fit rounded-xl bg-[#e7f0e9] px-3 py-2 text-xs font-bold text-[#365b46]">{String(i+1).padStart(2,"0")}</span>
                          <h3 className="mb-3 text-lg font-semibold leading-snug text-[#24332e]">{card.name||card.description.split(/[,.]/)[0]}</h3>
                          <p className="text-sm leading-relaxed text-[#53605b]">{card.description}</p>
                        </div>
                      </article>;
                    })}
                    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#e4e0d8] border-l-[5px] border-l-[#527566] bg-white shadow-[0_8px_24px_rgba(20,35,29,.04)]">
                      {processCardPhotos[3]?.src&&<picture data-block-id={processCardPhotos[3]!.id} className="block aspect-[16/10] w-full overflow-hidden bg-[#eff1ec]">
                        {processCardPhotos[3]?.mobileSrc&&<source media="(max-width: 767px)" srcSet={processCardPhotos[3]?.mobileSrc}/>}
                        <img src={processCardPhotos[3]!.src} alt={processCardPhotos[3]?.text||"Imagem ilustrativa do serviço"} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"/>
                      </picture>}
                      <div className="flex grow flex-col p-5 sm:p-6">
                        <span className="mb-4 inline-flex w-fit rounded-xl bg-[#e7f0e9] px-3 py-2 text-xs font-bold text-[#365b46]">04</span>
                        <h3 className="mb-3 text-lg font-semibold leading-snug text-[#24332e]">{site.processImageCardTitle||"Nosso trabalho em imagens"}</h3>
                        <p className="text-sm leading-relaxed text-[#53605b]">{site.processImageCardDescription||"Uma apresentação visual do nosso trabalho e dos serviços oferecidos."}</p>
                      </div>
                    </article>
                  </div>
                  {(!adaptiveTemplate||!/planos|pre[cç]os|pricing/i.test(id))&&buttons.length>0&&<div className="mt-7 flex flex-wrap gap-3">{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div>}
                </div>:
              isGallery&&site.sectionMediaLayouts?.[group.id]&&site.sectionMediaLayouts[group.id]!=="grid"?<div className="space-y-6">
                {headingNode}
                {site.sectionMediaLayouts[group.id]==="carousel"?
                  <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5" aria-label="Carrossel de fotografias">
                    {sectionImages.map((image,i)=><div key={image.id} className="w-[85%] shrink-0 snap-center sm:w-[58%] lg:w-[42%]">{imageNode(image,i)}</div>)}
                  </div>:
                  <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-5">
                    {sectionImages.map((image,i)=><div key={image.id} className={"min-w-0 "+(i===0?"col-span-2 row-span-2 sm:col-span-2":"")}>{imageNode(image,i)}</div>)}
                  </div>}
              </div>:
              templateId==="image-text-alternating"&&!isTestimonials&&!isContact&&visualLayout!=="faq"&&!/faq|perguntas.frequentes/i.test(id)?<div className="mx-auto max-w-[1200px]">
                {isGallery?<div className="space-y-8"><div className="max-w-3xl">{headingNode}</div><div className="grid gap-4 sm:grid-cols-2">{sectionImages.filter(b=>!!b.src).slice(0,4).map((b,i)=><div key={b.id} className="pn-alternate-image">{imageNode(b,i)}</div>)}</div></div>:
                <div className={`pn-alternate-row pn-alternate-row-${index%2===0?"even":"odd"} ${index===0?"pn-alternate-hero":""}`}>
                  <div className="pn-alternate-copy space-y-6">
                    <span className="pn-alternate-kicker block">{index===0?"EDITORIAL / APRESENTAÇÃO":`CAPÍTULO ${String(index+1).padStart(2,"0")}`}</span>
                    {headingNode}
                    <div className={`pn-alternate-content ${/servi[cç]os|tratament|diferencia|vantagen/i.test(id)?"pn-alternate-list":""}`}>{textItems.slice(0,8).map((item,i)=><div key={item.id} className="pn-alternate-text-item" data-block-id={item.id}>{render(item)}</div>)}</div>
                    <div className="flex flex-wrap gap-3">{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div>
                  </div>
                  {sectionImages.some(b=>!!b.src)?<div className="pn-alternate-image">{sectionImages.filter(b=>!!b.src).slice(0,index===0?1:2).map(imageNode)}</div>:null}
                </div>}
              </div>:
              templateId==="modern-impactful"&&!isTestimonials&&visualLayout!=="faq"&&!/faq|perguntas.frequentes/i.test(id)?<div className="pn-impact-panel mx-auto max-w-[1440px] text-white">
                {index===0?<div className="relative grid min-h-0 items-center gap-8 overflow-hidden py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-14 lg:py-16"><div className="relative z-10 min-w-0 space-y-7"><span className="pn-impact-label block text-xs">UMA NOVA EXPERIÊNCIA / 001</span><div className="[&_h1]:!text-white [&_h2]:!text-white">{headingNode}</div><div className="max-w-xl space-y-5 [&_p]:!text-white/80">{textItems.slice(0,2).map(render)}</div><div className="flex flex-wrap gap-4">{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div><span aria-hidden="true" className="block h-1 w-24 bg-cyan-300"/></div><div className="relative min-h-[280px] overflow-hidden rounded-2xl border-l-[6px] border-cyan-300 lg:min-h-0 lg:aspect-[4/5] lg:max-h-[650px] [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_picture]:block [&_picture]:h-full">{sectionImages.slice(0,1).map(imageNode)}</div></div>:
                isGallery?<div className="space-y-12 py-12"><div className="[&_h2]:!text-white">{headingNode}</div><div className="grid gap-3 md:grid-cols-2">{sectionImages.slice(0,6).map((b,i)=><div key={b.id} className="min-w-0">{imageNode(b,i)}</div>)}</div></div>:
                <div className="grid min-w-0 gap-7 py-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-16 lg:py-16"><div className="min-w-0"><span className="pn-impact-label mb-5 block text-xs">EXPERIÊNCIA {String(index+1).padStart(2,"0")}</span><div className="[&_h2]:!text-white">{headingNode}</div></div><div className="min-w-0 space-y-7">{sectionImages.length>0&&<div className="grid gap-3 sm:grid-cols-2">{sectionImages.slice(0,2).map(imageNode)}</div>}{/processo|etapas|como.funciona/i.test(id)?<ol className="border-l border-cyan-300/40 pl-6">{textItems.map((item,i)=><li key={item.id} data-block-id={item.id} className="relative border-b border-white/15 py-5 first:pt-0 last:border-0"><span className="pn-impact-label mb-3 block text-xs">ETAPA {String(i+1).padStart(2,"0")}</span><div className="[&_p]:!text-left [&_p]:!text-white/85">{render(item)}</div></li>)}</ol>:/diferencia|vantagen|escolher/i.test(id)?<div className="divide-y divide-white/20">{textItems.map((item,i)=><div key={item.id} data-block-id={item.id} className="grid gap-3 py-5 first:pt-0 sm:grid-cols-[3rem_1fr]"><span className="pn-impact-label text-sm">{String(i+1).padStart(2,"0")}</span><div className="[&_p]:!text-left [&_p]:!text-white/85">{render(item)}</div></div>)}</div>:/servi[cç]os|tratament/i.test(id)?<div className="divide-y divide-white/20">{textItems.map((item,i)=><div key={item.id} data-block-id={item.id} className="flex min-w-0 gap-5 py-5 first:pt-0"><span className="pn-impact-label shrink-0 text-xs">{String(i+1).padStart(2,"0")}</span><div className="min-w-0 [&_p]:!text-left [&_p]:!text-white/85">{render(item)}</div></div>)}</div>:<div className="space-y-5">{textItems.map((item,i)=><div key={item.id} data-block-id={item.id} className="border-b border-white/15 pb-5 last:border-0 [&_p]:!text-left [&_p]:!text-white/85">{render(item)}</div>)}</div>}<div className="flex flex-wrap gap-4">{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div></div></div>}
              </div>:
              templateId==="minimalist-sophisticated"&&!isTestimonials&&!isContact&&visualLayout!=="faq"&&!/faq|perguntas.frequentes/i.test(id)?<div className="pn-editorial-layout mx-auto max-w-[1320px]">
                {index===0?<div className="grid items-center gap-7 py-5 lg:min-h-[560px] lg:grid-cols-[1.1fr_.9fr] lg:gap-16 lg:py-12"><div className="order-2 min-w-0 space-y-6 lg:order-1"><span className="block text-xs font-semibold uppercase tracking-[.35em] opacity-60">EM DESTAQUE / {String(index+1).padStart(2,"0")}</span>{headingNode}<div className="max-w-lg space-y-5">{textItems.slice(0,2).map(render)}</div><div className="flex flex-wrap gap-3">{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div></div><div className="order-1 min-h-0 lg:order-2 lg:min-h-[500px] [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{sectionImages.slice(0,1).map(imageNode)}</div></div>:
                isGallery?<div className="space-y-12"><div className="max-w-3xl">{headingNode}</div><div className="grid gap-4 sm:grid-cols-2">{uniqueImages.slice(0,6).map((b,i)=><div key={b.id} className="min-w-0">{imageNode(b,i)}</div>)}</div></div>:
                <div className="grid gap-8 py-4 lg:grid-cols-[.85fr_1.15fr] lg:gap-16 lg:py-12"><div className="lg:sticky lg:top-28 lg:self-start"><span className="mb-5 block text-xs font-semibold uppercase tracking-[.3em] opacity-55">{String(index+1).padStart(2,"0")} / {group.id.replace(/[-_]/g," ")}</span>{headingNode}</div><div className="space-y-6">{editorialCardsForDisplay.length>0?(isProcess?<ol className="relative space-y-0 border-l border-[#cad4cf] pl-7">{editorialCardsForDisplay.slice(0,8).map((b,i)=><li key={b.id} data-block-id={b.id} className="relative border-b border-[#e1e6e2] py-6 first:pt-0 last:border-b-0"><span aria-hidden="true" className="absolute -left-[35px] top-7 flex h-4 w-4 items-center justify-center rounded-full border-[3px] border-white bg-[#527566] first:top-1"/><span className="mb-2 block text-xs font-semibold tracking-[.2em] text-[#607787]">ETAPA {String(i+1).padStart(2,"0")}</span><div className="[&_p]:!text-left [&_p]:!leading-relaxed">{render(b)}</div></li>)}</ol>:isDifferentials?<div className="divide-y divide-[#dfe5e0]">{editorialCardsForDisplay.slice(0,8).map((b,i)=><article key={b.id} data-block-id={b.id} className="grid gap-3 py-6 first:pt-0 sm:grid-cols-[48px_1fr] sm:gap-5"><span className="text-lg font-semibold text-[#729284]">{String(i+1).padStart(2,"0")}</span><div className="[&_p]:!text-left [&_p]:!leading-relaxed">{render(b)}</div></article>)}</div>:isTreatments?<div className="divide-y divide-[#dfe5e0]">{editorialCardsForDisplay.slice(0,8).map((b,i)=><article key={b.id} data-block-id={b.id} className="flex gap-5 py-6 first:pt-0"><span className="shrink-0 pt-1 text-xs font-semibold tracking-[.15em] text-[#729284]">{String(i+1).padStart(2,"0")}</span><div className="[&_p]:!text-left [&_p]:!leading-relaxed">{render(b)}</div></article>)}</div>:<div className="grid gap-3 sm:grid-cols-2">{editorialCardsForDisplay.slice(0,8).map(editorialPhotoCard)}</div>):editorialVisuals.length>0?<div className="grid gap-4 sm:grid-cols-2">{editorialVisuals.slice(0,4).map(imageNode)}</div>:null}<div className="flex flex-wrap gap-3">{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div></div></div>}
              </div>:
              isGallery?<>{headingNode}<div className="grid grid-cols-2 gap-3 md:hidden">{sectionImages.slice(0,6).map((b,i)=><div key={b.id} className={i===0?"col-span-2":""}>{imageNode(b,i)}</div>)}</div><div className="hidden md:grid md:grid-cols-2 md:gap-6">{sectionImages.slice(0,6).map((b,i)=><div key={b.id} className={adaptiveTemplate?"grid min-w-0 items-center gap-4 overflow-hidden rounded-2xl border-0 bg-[#181818] p-3 lg:gap-5":"grid min-w-0 items-center gap-4 rounded-2xl border border-[#e7e4dd] bg-white/70 p-4 lg:gap-5"}><div className="">{imageNode(b,i)}</div><div className="min-w-0"><h3 className={adaptiveTemplate?"mb-2 text-lg font-semibold leading-snug text-white":"mb-2 text-lg font-semibold leading-snug text-[#24332e]"}>{textItems[i]&&cardText(textItems[i]).name&&!/^(nossa atuação|conheça mais|saiba mais)$/i.test(cardText(textItems[i]).name)?cardText(textItems[i]).name:["Nosso espaço","Atendimento próximo","Cuidado em cada detalhe","Nossa equipe","Experiência e acolhimento","Conheça nosso trabalho"][i]}</h3><p className={adaptiveTemplate?"text-sm leading-relaxed text-[#cbd0d4]":"text-sm leading-relaxed text-[#52615a]"}>{textItems[i]&&!/^(conheça mais sobre nosso trabalho|conheça nossa abordagem|nossa atuação)/i.test(cardText(textItems[i]).description)?cardText(textItems[i]).description:["Conheça os ambientes e os detalhes do nosso trabalho.","Uma experiência pensada para atender você com atenção.","Cada detalhe faz parte da nossa forma de trabalhar.","Pessoas e processos dedicados a um atendimento cuidadoso.","Compromisso com qualidade em cada etapa.","Descubra como podemos ajudar você."][i]}</p></div></div>)}</div></>:
              isTestimonials?<>{headingNode}{adaptiveTemplate?<div className="pn-adaptive-testimonials grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">{testimonials.slice(0,4).map(item=>{const t=testimonialInfo(item);const message=t.message.replace(/^depoimento ilustrativo:\s*/i,"").replace(/^(?:[^|]{2,65}\s*\|\s*){1,2}/,"").replace(/^["“]|["”]$/g,"");return <blockquote key={item.id} data-block-id={item.id} className="min-w-0 w-full rounded-2xl bg-[#1c1c1f] px-6 py-8 text-left shadow-lg md:min-w-0 md:max-w-none"><span aria-hidden="true" className="mb-5 block text-4xl leading-none" style={{color:adaptiveColor}}>“</span><p className="break-words text-base leading-7 text-[#e2e2e5]">{message}</p><footer className="mt-6 border-t border-[#38383d] pt-4 text-xs font-semibold uppercase tracking-wider text-[#9fa1a8]">Relato ilustrativo</footer></blockquote>})}</div>:!adaptiveTemplate?<div className="pn-static-testimonials mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{testimonials.map((item,i)=>{const t=testimonialInfo(item);return <article key={item.id} data-block-id={item.id} className="group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[26px] border border-[#e2e7e2] bg-[#fffefa] p-7 text-left shadow-[0_12px_35px_rgba(24,47,37,.045)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(24,47,37,.10)] sm:p-8"><div><div className="mb-5 flex items-center justify-between gap-4"><span className="text-[11px] font-bold uppercase tracking-[.23em] text-[#799184]">Experiência {String(i+1).padStart(2,"0")}</span><span aria-hidden="true" className="font-serif text-5xl leading-[.6] text-[#b9c9bc]">“</span></div><p className="break-words font-serif text-[clamp(1.08rem,1.5vw,1.35rem)] leading-[1.6] text-[#263b32]">“{t.message}”</p></div><div className="mt-8 flex items-center gap-3 border-t border-[#e3e9e2] pt-5">{t.photo?<img src={t.photo} alt={t.name||"Cliente"} loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover"/>:<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e6eee7] text-sm font-bold text-[#315542]">{(t.name||"C").slice(0,1).toUpperCase()}</span>}<div className="min-w-0"><p className="text-sm font-bold text-[#244433]">{t.name||"Cliente"}</p>{t.city&&<p className="text-xs text-[#75877b]">{t.city}</p>}</div><span className="ml-auto text-xs tracking-[.12em] text-[#b48a3c]" aria-label="Cinco estrelas">★★★★★</span></div></article>})}</div>:templateId==="image-text-alternating"?<div className="grid gap-5 md:grid-cols-2">{testimonials.map(item=>{const t=testimonialInfo(item);return <article key={item.id} data-block-id={item.id} className="min-w-0 border-t border-[#a8aaa2] px-1 py-6"><p className="break-words text-base leading-relaxed text-[#344039]">“{t.message}”</p><p className="mt-5 font-semibold text-[#293d34]">{t.name||"Paciente"}</p>{t.city&&<p className="text-sm text-[#65736c]">{t.city}</p>}</article>})}</div>:templateId==="minimalist-sophisticated"?<div className="grid gap-4 sm:grid-cols-2">{testimonials.map(item=>{const t=testimonialInfo(item);return <article key={item.id} data-block-id={item.id} className="min-w-0 rounded-xl border border-[#e5e8e4] bg-white p-5 sm:p-7"><p className="break-words text-base leading-relaxed text-[#33453d]">“{t.message}”</p><p className="mt-5 font-semibold text-[#183b2b]">{t.name||"Paciente"}</p>{t.city&&<p className="text-sm text-[#68776e]">{t.city}</p>}</article>})}</div>:<div className="pn-static-testimonials mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{testimonials.map((item,i)=>{const t=testimonialInfo(item);return <article key={item.id} data-block-id={item.id} className="group relative flex min-w-0 flex-col overflow-hidden rounded-[26px] border border-[#d8e4dc] bg-white p-7 shadow-[0_12px_35px_rgba(18,51,37,.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(18,51,37,.11)]"><div className="mb-6 flex items-start justify-between gap-4"><span aria-hidden="true" className="font-serif text-6xl leading-[.7] text-[#8cae98]">“</span><span className="rounded-full bg-[#eaf2ec] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.14em] text-[#3e654e]">Relato {String(i+1).padStart(2,"0")}</span></div><blockquote className="mb-8 flex-1 break-words text-[17px] leading-[1.75] text-[#2a4437]">{t.message.replace(/^[“"]|[”"]$/g,"")}</blockquote><div className="flex items-center gap-3 border-t border-[#e4ece6] pt-5">{t.photo?<img src={t.photo} alt={t.name||"Cliente"} loading="lazy" className="h-12 w-12 shrink-0 rounded-full object-cover"/>:<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dcebe0] text-lg font-bold text-[#315840]">{(t.name||"C").slice(0,1).toUpperCase()}</div>}<div className="min-w-0"><p className="truncate text-sm font-bold text-[#1d4430]">{t.name||"Cliente"}</p>{t.city&&<p className="truncate text-xs text-[#6c8374]">{t.city}</p>}</div><span className="ml-auto shrink-0 text-xs tracking-[.06em] text-[#b28c45]" aria-label="Cinco estrelas">★★★★★</span></div></article>})}</div>}</>:
              (visualLayout==="faq"||/faq|perguntas.frequentes/i.test(id))?<>{headingNode}<div className="mx-auto max-w-3xl space-y-3">{textItems.map(b=>{const at=b.text.indexOf("?");return <details key={b.id} className="group rounded-xl border border-[#e9e4da] bg-white px-5 py-4 text-[#24332e]"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold leading-snug [&::-webkit-details-marker]:hidden"><span className="min-w-0 flex-1">{at>=0?b.text.slice(0,at+1):b.text}</span><span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center text-xl leading-none group-open:rotate-45">+</span></summary>{at>=0&&(b.text.slice(at+1).trim()||site.cinematic?.mode==="cinematic")&&<div className="mt-3 border-t border-[#eee9e0] pt-3 text-sm leading-relaxed text-[#354c40]">{b.text.slice(at+1).trim()||(site.cinematic?.mode==="cinematic"?cinematicFaqAnswer(b.text):"")}</div>}</details>})}</div></>:
              (visualLayout==="hero"||visualLayout==="split")&&!isPrinciples?<div className={sectionImages.length?"grid min-w-0 items-center gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-12":"mx-auto max-w-3xl"}>
                <div className="min-w-0 space-y-5">{blocks.filter(b=>b.type==="heading"||b.type==="button"||(b.type==="paragraph"&&textItems.slice(0,3).some(item=>item.id===b.id))).map(render)}</div>
                {sectionImages.length>0&&<div className={"relative min-w-0 [&_img]:w-full "+(sectionImages.length>1&&sectionImages.some(b=>b.userUploaded)?"grid grid-cols-2 gap-3":"")}>{sectionImages.slice(0,sectionImages.some(b=>b.userUploaded)?6:1).map(imageNode)}</div>}
              </div>:
              useEditorialGrid?<div className="space-y-8 md:space-y-12">
                <div className="flex flex-col gap-4">{headingNode}</div>
                {(!adaptiveTemplate&&(isTreatments||isDifferentials))?<div className={`grid items-stretch gap-4 ${isTreatments&&editorialCards[0]?.columns===1?"md:grid-cols-1":isTreatments&&editorialCards[0]?.columns===3?"md:grid-cols-3":isTreatments&&editorialCards[0]?.columns===4?"md:grid-cols-4":"md:grid-cols-2"}`}>{editorialCards.slice(0,isTreatments?undefined:4).map((item,i)=>{const card=cardText(item);const photo=cardImage(item,i);return <article key={item.id} data-block-id={item.id} style={{...(item.radius?{borderRadius:`${item.radius}px`}:{}),...(item.cardBorderWidth!==undefined?{borderWidth:`${item.cardBorderWidth}px`,borderStyle:"solid" as const,borderColor:item.cardBorderColor||"#E5E7EB"}:{}),...(item.cardShadow?{boxShadow:item.cardShadow}:{})}} className={`pn-premium-info-card group relative flex h-full flex-col overflow-hidden rounded-[22px] border bg-white shadow-none transition-colors duration-300 ${isDifferentials?"pn-premium-differential border-[#dce5dd]":"pn-premium-service border-[#e7e4dd]"}`}>{photo&&site.cinematic?.mode!=="cinematic"&&<div className="aspect-[16/10] overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{render(photo)}</div>}<div className={`flex h-full flex-col space-y-3 p-6 md:p-8 ${isDifferentials?"md:py-9":""}`}><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold uppercase tracking-[.25em] text-[#718066]">{isTreatments?"Serviço":"Diferencial"} {String(i+1).padStart(2,"0")}</span>{isDifferentials?<span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dce7df] bg-[#f0f5f0] text-[#365b46]">✦</span>:<span aria-hidden="true" className="h-1 w-9 rounded-full bg-[#91ad95] transition-all duration-300 group-hover:w-14"/>}</div><h3 style={item.fontFamily?{fontFamily:item.fontFamily}:undefined} className={`text-[clamp(1.35rem,1.9vw,1.85rem)] leading-[1.2] text-[#24332e] ${isDifferentials?"font-semibold":"font-serif"}`}>{editorialTitle(item,i)}</h3><p className="max-w-[55ch] text-[15px] leading-[1.75] text-[#4d5652]">{card.description}</p>{/planos|pre[cç]os|pricing/i.test(id)&&(buttons[i]||adaptiveTemplate)&&<div className="mt-5">{buttons[i]?render(buttons[i]):<a href="#contato" className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold">Quero este plano</a>}</div>}</div></article>})}</div>:<div className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">{!useTextOnlyTreatments&&uniqueImages[0]&&<div className="relative overflow-hidden rounded-[2rem] shadow-[22px_24px_0_-8px_rgba(113,128,102,.15)] [&_img]:aspect-[4/5] [&_img]:w-full [&_img]:object-cover">{render(uniqueImages[0])}</div>}<div className="divide-y divide-[#8a907e]/25">{editorialCards.slice(0,isTreatments?undefined:5).map((item,i)=>{const card=cardText(item);return <div key={item.id} data-block-id={item.id} className="grid grid-cols-[2.5rem_1fr] gap-4 py-5 first:pt-0"><span className="pt-1 text-xs font-semibold tracking-widest text-[#778567]">{String(i+1).padStart(2,"0")}</span><div><h3 style={item.fontFamily?{fontFamily:item.fontFamily}:undefined} className="font-serif text-[clamp(1.4rem,2vw,2rem)] leading-snug text-[#24332e]">{editorialTitle(item,i)}</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></div>})}</div></div>}
                {(!adaptiveTemplate||!/planos|pre[cç]os|pricing/i.test(id))&&buttons.length>0&&<div className="flex flex-wrap gap-3">{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div>}
              </div>:
              adaptiveTemplate&&isProcess?<div data-pn-composition="process" className="mx-auto w-full max-w-6xl">{headingNode}<div className="grid gap-5 md:grid-cols-2">{textItems.filter(item=>item.type==="paragraph"&&item.text.trim().length>5).slice(0,8).map((item,i)=>{const card=cardText(item);const photo=processCardPhotos[i];const numberedOnly=/^(?:etapa|passo)?\s*0?\d{1,2}$/i.test(card.name.trim());const processParts=numberedOnly?card.description.split(/\s+[—–:]\s+/,2):[];const title=numberedOnly?(processParts[0]||"Etapa").trim():(card.name||card.description.split(/[.!?]/)[0]).replace(/^\s*(?:etapa|passo)?\s*0?\d{1,2}\s*[:—–.-]?\s*/i,"").trim();const description=numberedOnly&&processParts.length>1?card.description.slice(processParts[0].length).replace(/^\s*[—–:]\s*/,"").trim():card.description.trim();return <article key={item.id} data-block-id={item.id} className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-[#18191d] md:flex-row">{photo&&<div className="aspect-[16/10] w-full shrink-0 overflow-hidden md:aspect-auto md:w-[42%] [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{render(photo)}</div>}<div className="flex min-w-0 flex-1 flex-col justify-center p-6 md:p-7"><span className="mb-4 block text-3xl font-black tracking-tight" style={{color:adaptiveColor}}>{String(i+1).padStart(2,"0")}</span><h3 className="text-xl font-bold leading-tight text-white">{title||"Etapa "+String(i+1).padStart(2,"0")}</h3>{description&&description!==title&&<p className="mt-3 text-sm leading-6 text-[#cbd0d4]">{description}</p>}</div></article>})}</div></div>:
              adaptiveModalities?<div data-pn-composition="modalities" className="mx-auto max-w-6xl">{headingNode}<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{textItems.filter(item=>item.type==="paragraph"&&item.text.trim().length>5).slice(0,8).map((item,i)=>{const card=cardText(item);return <article key={item.id} data-block-id={item.id} className="min-w-0 rounded-xl border-0 bg-[#181818] p-4 shadow-none md:p-6"><div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border text-xl font-bold" style={{borderColor:adaptiveColor,color:adaptiveColor}}>{["◆","↗","◉","✦"][i%4]}</div><h3 className="text-base font-bold text-white md:text-xl">{card.name||card.description.split(/[,.]/)[0]}</h3>{card.description&&<p className="mt-2 text-xs leading-5 text-[#c9cbd0] md:text-sm md:leading-6">{card.description}</p>}</article>})}</div></div>:
              (adaptiveTeam||adaptiveModalities||adaptiveServices||adaptiveDifferentials)?<div data-pn-composition={adaptiveServices?"services":adaptiveTeam?"team":adaptiveModalities?"modalities":"differentials"} className="mx-auto max-w-6xl">{headingNode}<div className={adaptiveTeam||adaptiveDifferentials?"grid gap-6 md:grid-cols-2":adaptiveServices?"pn-adaptive-services-grid grid gap-6 sm:grid-cols-2 xl:grid-cols-3":"grid gap-6 sm:grid-cols-2 lg:grid-cols-4"}>{textItems.filter(item=>item.type==="paragraph"&&item.text.trim().length>5).slice(0,8).map((item,i)=>{const card=cardText(item);const photo=adaptiveServices?(images.length>=textItems.length?cardImage(item,i):undefined):cardImage(item,i);return <article key={item.id} data-block-id={item.id} className={adaptiveTemplate?"group pn-premium-card flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#191b20] p-6 shadow-[0_16px_45px_rgba(0,0,0,.24)] transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_24px_60px_rgba(0,0,0,.36)] md:p-8":"group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-[#1b1d22]"}>{photo&&<div className={adaptiveTeam||adaptiveDifferentials?"h-24 w-24 shrink-0 overflow-hidden rounded-xl [&_img]:h-full [&_img]:w-full [&_img]:object-cover":"aspect-[16/10] overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover"}>{render(photo)}</div>}<div className={adaptiveTemplate?"flex min-w-0 flex-1 flex-col justify-start":"flex min-w-0 flex-1 flex-col justify-start p-6"}><span className="mb-3 block text-xs font-bold uppercase tracking-[.2em]" style={{color:adaptiveColor}}>{adaptiveTeam?"Especialidade":adaptiveServices?"Serviço":adaptiveDifferentials?"Diferencial":"Modalidade"} {String(i+1).padStart(2,"0")}</span><h3 className="text-lg font-bold leading-snug text-white">{card.name||card.description.split(/[,.]/)[0]}</h3>{card.name&&card.description&&<p className="mt-2 text-sm leading-6 text-[#c9cbd0]">{card.description}</p>}</div></article>})}</div></div>:
              (visualLayout==="grid"||isProcess||isPrinciples)&&!isContact&&!adaptivePricing&&!(adaptiveTemplate&&(isProcess||adaptiveServices||adaptiveDifferentials||adaptiveTeam||adaptiveModalities))?<>{headingNode}<div className={`grid auto-rows-auto items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3`}>{uniqueVisualCards.map((item,i)=>{const card=cardText(item);const photo=isPrinciples?undefined:(isProcess?processCardPhotos[i]:cardImage(item,i));return <article key={item.id} className={`group h-fit self-start overflow-hidden border border-[#e7e4dd] bg-white shadow-[0_8px_30px_rgba(20,35,29,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-lg ${isProcess?"rounded-lg border-l-4 border-l-[#9c947b]":"rounded-2xl"}`}>{photo&&<div className="aspect-[16/10] overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:rounded-none [&_img]:object-cover">{render(photo)}</div>}<div className="p-5 md:p-7">{isProcess&&!/^\s*\d{1,2}\s*$/.test(card.name)&&<span className="mb-4 inline-flex rounded-lg bg-[#f5f0e4] px-3 py-2 text-xs font-semibold text-[#92773b]">{String(i+1).padStart(2,"0")}</span>}<h3 data-block-id={item.id} style={{color:/^#[0-9a-fA-F]{6}$/.test(item.color||"")?item.color:"#24332e"}} className="mb-2 text-lg font-bold leading-snug">{card.name&&!/^destaque\s*\d+$/i.test(card.name)?card.name:(card.description.split(/[,.]/)[0].trim().split(" ").slice(0,5).join(" ")||"Nossa proposta")}</h3><p className="text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></article>})}</div>{buttons.length>0&&!/planos|pre[cç]os|pricing/i.test(id)&&<div className="mt-7 flex flex-wrap gap-3">{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div>}</>:
              adaptivePricing?<div data-pn-section-kind="pricing" className="mx-auto max-w-6xl">
                {headingNode}
                <div className="grid items-stretch gap-6 md:grid-cols-3">
                  {textItems.filter(b=>b.type==="paragraph"&&cardText(b).description.length>8).slice(0,6).map((item,i)=>{
                    const card=cardText(item);
                    const featured=/performance/i.test(card.name)&&!/elite|start/i.test(card.name);
                    const planName=card.name.replace(/\s*\(mais escolhido\)/i,"").replace(/^(?:diferencial|plano)\s*\d{1,2}\s*[:—–-]?\s*/i,"").trim()||"Plano "+(i+1);
                    const price=card.description.match(/R\$\s*[\d.,]+\s*(?:\/\s*m[eê]s|mensais|por m[eê]s)?/i);
                    const benefits=card.description.replace(price?.[0]||"","").replace(/mais escolhido/gi,"").replace(/^[\s.,:;—–()\-]+/,"").split(/\s*[.;]\s*|,\s*(?=[A-ZÀ-Ú])/).map(x=>x.trim()).filter(Boolean);
                    return <article key={item.id} data-block-id={item.id} className="relative flex h-full flex-col overflow-hidden rounded-3xl border p-7 shadow-xl md:p-9" style={{backgroundColor:"#181818",borderColor:featured?adaptiveColor:"#363636"}}>
                      {featured&&<span className="mb-5 self-start rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-white" style={{backgroundColor:adaptiveColor}}>Mais escolhido</span>}
                      <h3 className="text-2xl font-extrabold text-white">{planName}</h3>
                      {price&&<p className="mt-5 text-3xl font-black tracking-tight text-white">{price[0]}</p>}<ul className="mt-6 flex-1 space-y-3 text-sm leading-6 text-gray-200">{benefits.map((benefit,j)=><li key={j} className="flex gap-2"><span aria-hidden="true" style={{color:adaptiveColor}}>✓</span><span>{benefit}</span></li>)}</ul>
                      <div className="mt-8">{buttons[i]?render(buttons[i]):<a href="#contato" className="inline-flex w-full justify-center rounded-xl px-5 py-4 font-bold text-white" style={{backgroundColor:adaptiveColor}}>Quero este plano</a>}</div>
                    </article>;
                  })}
                </div>
              </div>:
              isContact||visualLayout==="banner"?<div className={adaptiveTemplate&&isContact?"mx-auto max-w-5xl space-y-5 text-left":"max-w-3xl space-y-5 text-left"}>{headingNode}{textItems.filter(b=>!/\b(?:xx|xxx|rua principal|contato@clinic)/i.test(b.text)&&(!adaptiveTemplate||!isContact||/^(?:campo obrigatório|nome completo|e-?mail|telefone|mensagem|preencha os dados)/i.test(b.text.trim()))).slice(0,2).map(b=>isContact?render({...b,text:b.text.replace(/Use o formulário abaixo[^.]*\.?/gi,"Envie sua mensagem pelos canais de atendimento disponíveis.").replace(/formulário abaixo/gi,"canal de atendimento")}):render(b))}{(adaptiveTemplate&&(isContact||/planos|pre[cç]os|pricing/i.test(id))?[]:buttons).map(render)}{isContact&&<form onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);const subject=encodeURIComponent("Contato pelo site "+site.title);const body=encodeURIComponent("Nome: "+data.get("name")+"\nE-mail: "+data.get("email")+"\nTelefone: "+data.get("phone")+"\nMensagem: "+data.get("message"));if(site.footer?.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.footer.email)){window.location.href="mailto:"+site.footer.email+"?subject="+subject+"&body="+body;}else{window.location.href="mailto:?subject="+subject+"&body="+body;}}} className="mx-auto mt-6 grid w-full max-w-2xl gap-4 rounded-2xl border border-[#e2dfd5] bg-white p-5 text-left shadow-sm sm:p-8"><p className="text-sm text-[#46534b]">{site.footer?.email?"Preencha os campos para abrir sua mensagem no aplicativo de e-mail.":"Formulário de demonstração: configure um e-mail de destino para habilitar o envio."}</p><label className="grid gap-2 text-sm font-medium text-[#24332e]">Nome<input name="name" required maxLength={100} className="min-h-12 rounded-lg border border-[#d9ddd5] px-4 text-[#24332e]"/></label><label className="grid gap-2 text-sm font-medium text-[#24332e]">E-mail<input name="email" type="email" required maxLength={160} className="min-h-12 rounded-lg border border-[#d9ddd5] px-4 text-[#24332e]"/></label><label className="grid gap-2 text-sm font-medium text-[#24332e]">Telefone<input name="phone" type="tel" autoComplete="tel" required maxLength={30} className="min-h-12 rounded-lg border border-[#d9ddd5] px-4 text-[#24332e]"/></label><label className="grid gap-2 text-sm font-medium text-[#24332e]">Mensagem<textarea name="message" required maxLength={3000} rows={4} className="rounded-lg border border-[#d9ddd5] px-4 py-3 text-[#24332e]"/></label><button type="submit" disabled={!site.footer?.email} style={{backgroundColor:site.blocks.some(b=>b.type==="button"&&/^#(?:e50914|ff0000|dc0000)$/i.test(String(b.color)))?"#E50914":"#243e32"}} className="min-h-12 rounded-xl px-6 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Preparar mensagem</button></form>}</div>:
              <div className={sectionImages.length?"grid min-w-0 items-center gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-12":"mx-auto max-w-3xl space-y-5"}><div className="space-y-5">{heading.map(render)}{textItems.slice(0,3).map(render)}{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div>{sectionImages.slice(0,1).map(imageNode)}</div>}
            </div>
          </section>;
        })}{site.blocks.length>0&&<BuilderExtras extras={{...site.extras,enabled:{announcement:false,video:site.extras?.enabled?.video===true,comparison:site.extras?.enabled?.comparison===true,partners:site.extras?.enabled?.partners===true,pricing:site.extras?.enabled?.pricing===true,counters:site.extras?.enabled?.counters===true&&!visibleSections.some(g=>/n[uú]meros|indicadores|estat[ií]sticas|trajet[oó]ria/i.test(g.id+" "+g.blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" "))),faq:false,map:site.extras?.enabled?.map!==false&&!!site.extras?.address,popup:site.extras?.enabled?.popup!==false,backToTop:site.extras?.enabled?.backToTop!==false}}} />}{site.blocks.length>0&&<footer className="pn-builder-v2-footer px-6 py-10 text-[#f7f5ed] md:px-12 md:py-14 lg:px-16" style={{backgroundColor:adaptiveTemplate?(site.background||"#111111"):"#102a22"}}>
  <div className="pn-builder-v2-footer-shell mx-auto w-full max-w-6xl">
    <div className="pn-builder-v2-footer-main grid min-w-0 items-start gap-x-12 gap-y-10 border-b border-white/15 pb-10 md:grid-cols-[minmax(0,1.65fr)_minmax(260px,.8fr)] lg:gap-x-20">
      <div className="min-w-0">
        <div className="mb-5 h-1 w-12 rounded-full" style={{backgroundColor:adaptiveTemplate?adaptiveColor:"#d4c19b"}}/>
        <p className="max-w-2xl text-2xl font-bold leading-[1.18] tracking-tight [text-wrap:balance] sm:text-[1.75rem] lg:text-3xl">{site.title.split(/\s+[–—-]\s+/)[0].trim()}</p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">{/advoca|jur[ií]dic|direito/i.test(site.title+" "+site.blocks.map(b=>b.text).slice(0,10).join(" "))?"Atuação jurídica com clareza e responsabilidade.":/arquitet|interior|atelier/i.test(site.title+" "+site.blocks.map(b=>b.text).slice(0,10).join(" "))?"Arquitetura e interiores pensados para cada espaço.":/cl[ií]nica|sa[uú]de|est[eé]tica/i.test(site.title+" "+site.blocks.map(b=>b.text).slice(0,10).join(" "))?"Informações e atendimento em um só lugar.":"Conheça nossos serviços e entre em contato."}</p>
      </div>
      <div className="min-w-0 md:justify-self-end">
        <h3 className="mb-5 text-xs font-bold uppercase tracking-[.18em]" style={{color:adaptiveTemplate?adaptiveColor:"#d4c19b"}}>Conecte-se</h3>
        <div className="space-y-4 text-sm leading-relaxed text-white/70">
          {site.footer?.cnpj&&<p><span className="mr-2 text-[#d4c19b]">▣</span>CNPJ: {site.footer.cnpj}</p>}
          {site.footer?.address&&<p><span className="mr-2 text-[#d4c19b]">⌖</span>{site.footer.address}</p>}
          <div className="flex flex-wrap items-center gap-2.5">
            {([["Instagram",site.footer?.instagram],["Facebook",site.footer?.facebook],["YouTube",site.footer?.youtube],["WhatsApp",site.footer?.whatsapp]] as const).map(([label,url])=>(normalizedSocialLink(label.toLowerCase() as "instagram"|"facebook"|"youtube"|"whatsapp",url||""))?<a key={label} aria-label={label} href={normalizedSocialLink(label.toLowerCase() as "instagram"|"facebook"|"youtube"|"whatsapp",url||"")||undefined} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/[.08] text-white shadow-sm transition hover:-translate-y-1 hover:border-[#d4c19b] hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4c19b]">{label==="Instagram"?<SocialIcon name="instagram" size={19}/>:label==="Facebook"?<SocialIcon name="facebook" size={19}/>:label==="WhatsApp"?<SocialIcon name="whatsapp" size={21}/>:<SocialIcon name="youtube" size={21}/>}</a>:(adaptiveTemplate?null:<span key={label} role="img" aria-label={`${label} — link ainda não configurado`} title={`${label}: configure o link pelo chat da PageNova AI`} className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[.035] text-white/55">{label==="Instagram"?<SocialIcon name="instagram" size={19}/>:label==="Facebook"?<SocialIcon name="facebook" size={19}/>:label==="WhatsApp"?<SocialIcon name="whatsapp" size={21}/>:<SocialIcon name="youtube" size={21}/>}</span>))}
          </div>
        </div>
      </div>
    </div>
    <nav aria-label="Menu do rodapé" className="pn-builder-v2-footer-nav min-w-0 border-b border-white/15 py-8">
      <h3 className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-[#d4c19b]">Explore</h3>
      <div className="flex min-w-0 flex-wrap items-center gap-x-8 gap-y-4 md:gap-x-10">
        {footerNavSections.map((g,i)=><a key={g.id} className="inline-block max-w-full text-sm leading-relaxed text-white/70 transition hover:text-white" href={/contato|agend|fale.conosco/i.test(g.id)?"#contato":"#"+g.id}>{i===0?"Início":navLabel(g)}</a>)}
      </div>
    </nav>
    <div className="pn-builder-v2-footer-legal mt-7 flex flex-col gap-3 text-left text-xs leading-relaxed text-white/50 md:flex-row md:items-center md:justify-between">
      <span>© {new Date().getFullYear()} {site.title.split(/\s+[–—-]\s+/)[0].trim()}. Todos os direitos reservados.</span>
      <span>Criado com PageNova AI</span>
    </div>
  </div>
</footer>}{<SiteWhatsAppButton numberOrUrl={site.footer?.whatsapp||site.restaurant?.whatsapp||site.realEstateWhatsapp} message={site.footer?.whatsappMessage} enabled={site.footer?.showFloatingWhatsapp!==false&&(!adaptiveTemplate||!!(site.footer?.whatsapp||site.restaurant?.whatsapp||site.realEstateWhatsapp))} effect={site.footer?.whatsappEffect} preview={!publishedMode}/>}</div></section>
        </>
  );
}
