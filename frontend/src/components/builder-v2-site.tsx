"use client";
import {adaptivePalette, type AdaptiveDesign} from "@/lib/builder-v2-brief-contract";
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
export type BuilderV2SiteData = { design?:AdaptiveDesign; cinematic?: CinematicAppearance; templateId?: "institutional-complete" | "minimalist-sophisticated" | "prompt-adaptive"; kind?: "institutional" | "restaurant" | "real-estate" | "catalog"; title: string; background: string; blocks: Block[]; id?: string; niche?: string; publishedUrl?: string; heroPresentation?: "immersive" | "split"; crmImported?:boolean; heroComposition?: "single" | "duo" | "trio"; heroBannerCopy?: Record<string,{title?:string;description?:string;buttonText?:string;buttonHref?:string}>; sectionMediaLayouts?: Record<string,"grid" | "mosaic" | "carousel">; sectionMediaManaged?: string[]; processImageCard?: boolean; processImageCardTitle?: string; processImageCardDescription?: string; motion?: SiteMotion; restaurant?: {whatsapp?:string;menu?:{id:string;name:string;description:string;price:number;category:string;image?:string}[]}; realEstateWhatsapp?:string; properties?:PropertyItem[]; socialProof?: { enabled?: boolean; rating?: number; reviewCount?: number; platform?: string; avatars?: string[]; initials?: string[] }; header?: { enabled?: boolean; brand?: string; logoUrl?: string; ctaLabel?: string; ctaHref?: string; background?: string; textColor?: string; sticky?: boolean; navItems?: Array<{label:string;href:string}> }; extras?: SiteExtras; footer?: (SocialFooter & {cnpj?:string;address?:string;email?:string;showMenu?:boolean}) };
const premiumThemes = {
  legal: {dark:"#101d33",accent:"#c9b782",light:"#f7f5ef"},
  health: {dark:"#164b3b",accent:"#d7e9df",light:"#f6f9f7"},
  creative: {dark:"#202327",accent:"#e5cbb3",light:"#f7f5f1"}
};
function readableColor(color:string,background:string) {
  const rgb=(value:string)=>{const raw=value.trim().replace("#","");const v=/^[0-9a-f]{3}$/i.test(raw)?raw.split("").map(c=>c+c).join(""):raw;if(!/^[0-9a-f]{6}$/i.test(v))return null;return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));};
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

export function BuilderV2Site(props:{site:BuilderV2SiteData;selectedNiche?:string;publishedMode?:boolean;templateId?:"institutional-complete"|"minimalist-sophisticated"|"prompt-adaptive"}){
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
function BuilderV2ClassicSite({site,selectedNiche="",publishedMode=false,templateId:requestedTemplateId="institutional-complete"}:{site:BuilderV2SiteData;selectedNiche?:string;publishedMode?:boolean;templateId?:"institutional-complete"|"minimalist-sophisticated"|"prompt-adaptive"}) {
  const templateId = requestedTemplateId==="institutional-complete" && site.templateId && site.templateId!=="institutional-complete" ? site.templateId : requestedTemplateId;
  // Template 5 is opt-in and scoped: existing institutional, cinematic and 3D renderers remain unchanged.
  const adaptiveTemplate=templateId==="prompt-adaptive"||site.templateId==="prompt-adaptive";
  const adaptiveTheme=adaptivePalette(site.background,site.design);
  const adaptiveColor=site.blocks.find(block=>block.type==="button"&&/^#[0-9a-f]{6}$/i.test(block.background||""))?.background
    ||site.blocks.find(block=>block.type==="heading"&&/^#[0-9a-f]{6}$/i.test(block.color||"")&&block.color?.toLowerCase()!=="#ffffff")?.color
    ||adaptiveTheme.accent;
  const adaptiveDark=adaptiveTheme.dark;
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
  // The map is rendered immediately before FAQ, so count it as its own visible section.
  const cinematicNumber=(index:number)=>index+1+(site.cinematic?.mode==="cinematic"&&!!site.extras?.address?.trim()&&visibleSections.slice(0,index+1).some(g=>/faq|perguntas/i.test(g.id))?1:0);
  const cinematicMapNumber=(index:number)=>index+1;
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
  const extraNav=Array.isArray(header?.navItems)?header.navItems.filter((item:any)=>typeof item?.label==="string"&&typeof item?.href==="string"&&item.href.startsWith("#")&&!nav.some(g=>"#"+g.id===item.href)):[];
  const ctaHref=header?.ctaHref||"#contato";
  const ctaLabel=adaptiveTemplate&&(!header?.ctaLabel||/agendar conversa/i.test(header.ctaLabel))?"Entre em contato":(header?.ctaLabel||"Agendar conversa");
  const headerBackground=adaptiveTemplate?(header?.background||site.background||"#ffffff"):(header?.background||"#ffffff");
  const headerColor=adaptiveTemplate?readableColor(header?.textColor||adaptiveTheme.ink,headerBackground):(header?.textColor||"#1c2e27");
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

/* Cinematic palette contract: neutral champagne accents, readable light cards.
   Scoped to cinematic mode; static and immersive 3D are unaffected. */
.pn-cinematic-enabled{--pn-cinema-accent:#c6a77b;--pn-cinema-ink:#24211d}
.pn-cinematic-enabled .pn-motion-site>section :is(article,[class*="bg-white"],[class*="bg-[#fff"],[class*="bg-slate-50"]){color:var(--pn-cinema-ink)}
.pn-cinematic-enabled .pn-motion-site>section :is(article,[class*="bg-white"],[class*="bg-[#fff"],[class*="bg-slate-50"]) :is(h1,h2,h3,h4,p,li,blockquote,span){color:var(--pn-cinema-ink)!important;text-shadow:none!important}
.pn-cinematic-enabled .pn-motion-site>section :is(article,[class*="bg-white"],[class*="bg-[#fff"],[class*="bg-slate-50"]) :is(a,button){color:inherit}
.pn-cinematic-enabled .pn-motion-site>section :is(article,[class*="bg-white"],[class*="bg-[#fff"],[class*="bg-slate-50"]) [style*="color: rgb(255"],.pn-cinematic-enabled .pn-motion-site>section :is(article,[class*="bg-white"]) [style*="color: #fff"]{color:var(--pn-cinema-ink)!important}
.pn-cinematic-enabled .pn-motion-site>section :is(article,[class*="rounded"]){border-top-color:var(--pn-cinema-accent)}
.pn-cinematic-enabled .pn-motion-site>section [class*="text-emerald"],.pn-cinematic-enabled .pn-motion-site>section [class*="text-green"]{color:var(--pn-cinema-accent)!important}
.pn-cinematic-enabled .pn-motion-site>section [class*="border-emerald"],.pn-cinematic-enabled .pn-motion-site>section [class*="border-green"]{border-color:var(--pn-cinema-accent)!important}
.pn-cinematic-enabled .pn-motion-site>section [class*="bg-emerald"],.pn-cinematic-enabled .pn-motion-site>section [class*="bg-green"]{background-color:var(--pn-cinema-accent)!important;color:var(--pn-cinema-ink)!important}

/* Contrast rules: transparent cinematic cards sit over video, so they require light ink.
   Only genuinely light-surface cards use dark ink. Do not classify every article as white. */
.pn-cinematic-enabled .pn-motion-site>section article:not(.pn-premium-info-card):not([class*="bg-white"]):not([class*="bg-slate-50"]) :is(h1,h2,h3,h4,p,li,blockquote,span){color:#fff!important;text-shadow:0 1px 3px rgba(0,0,0,.55)!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card :is(h1,h2,h3,h4,p,li,blockquote,span){color:#24211d!important;text-shadow:none!important}
.pn-cinematic-enabled .pn-motion-site>section article[class*="bg-white"] :is(h1,h2,h3,h4,p,li,blockquote,span),
.pn-cinematic-enabled .pn-motion-site>section article[class*="bg-slate-50"] :is(h1,h2,h3,h4,p,li,blockquote,span){color:#24211d!important;text-shadow:none!important}

/* Cinematic video overlay cards: explicit surfaces and contrast.
   Override inherited inline text colors and legacy emerald borders. */
.pn-cinematic-enabled .pn-motion-site>section article:not(.pn-premium-info-card){
  background-color:rgba(9,12,11,.76)!important;
  color:#fff!important;
  border-color:#c6a77b!important;
}
.pn-cinematic-enabled .pn-motion-site>section article:not(.pn-premium-info-card) :is(h1,h2,h3,h4,h5,p,li,blockquote,span,strong,small){
  color:#fff!important;
  -webkit-text-fill-color:#fff!important;
  text-shadow:0 1px 3px rgba(0,0,0,.55)!important;
}
.pn-cinematic-enabled .pn-motion-site>section article.pn-premium-info-card{
  background-color:#f8f5ef!important;
  border-color:#c6a77b!important;
}
.pn-cinematic-enabled .pn-motion-site>section article.pn-premium-info-card :is(h1,h2,h3,h4,h5,p,li,blockquote,span,strong,small){
  color:#24211d!important;
  -webkit-text-fill-color:#24211d!important;
  text-shadow:none!important;
}
.pn-cinematic-enabled .pn-motion-site>section article :is([class*="border-emerald"],[class*="border-green"]){border-color:#c6a77b!important}

/* Cinematic content readability: neutral opaque panels, including nested card copy. */
.pn-cinematic-enabled .pn-motion-site>section article:not(.pn-premium-info-card){
 background:rgba(12,12,11,.92)!important;
 background-image:none!important;
 border-left-color:#c6a77b!important;
}
.pn-cinematic-enabled .pn-motion-site>section article:not(.pn-premium-info-card) :is(div,h1,h2,h3,h4,h5,p,span,strong,small,blockquote){
 color:#fff!important;-webkit-text-fill-color:#fff!important;
}
.pn-cinematic-enabled .pn-motion-site>section article:not(.pn-premium-info-card) :is(p,span,small){opacity:1!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-about{max-width:1080px!important;padding-top:2rem!important;padding-bottom:2rem!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-about>div.grid{align-items:center!important;gap:1.75rem!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-about>div.grid>div:first-child{min-height:0!important;max-height:400px!important;position:relative!important;top:auto!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-about>div.grid>div:first-child :is(img,picture){max-height:400px!important;object-fit:cover!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-about p{font-size:clamp(.95rem,1.15vw,1.1rem)!important;line-height:1.65!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-about h2{font-size:clamp(1.8rem,3vw,2.75rem)!important}
@media(max-width:767px){
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-about>div.grid>div:first-child,
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-about>div.grid>div:first-child :is(img,picture){max-height:260px!important}
}

.pn-cinematic-enabled .pn-cinematic-gallery-card{background:#121110!important;background-image:none!important;border-color:#c6a77b!important}
.pn-cinematic-enabled .pn-cinematic-gallery-card h3,.pn-cinematic-enabled .pn-cinematic-gallery-card p{color:#fff!important;-webkit-text-fill-color:#fff!important;opacity:1!important;text-shadow:none!important}
/* Published cinematic parity: photo cards are div-based in some layouts. */
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-photo-card,
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-text-card{
 background:#141311!important;background-image:none!important;
 border-color:#c6a77b!important;
}
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-photo-card>div:last-child,
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-text-card{
 background:rgba(13,12,11,.96)!important;
}
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-photo-card>div:last-child :is(h1,h2,h3,h4,p,span,strong,small),
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-text-card :is(h1,h2,h3,h4,p,span,strong,small){
 color:#fff!important;-webkit-text-fill-color:#fff!important;opacity:1!important;text-shadow:none!important;
}
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-photo-card [class*="border-l"],
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-photo-card [class*="bg-emerald"]{border-color:#c6a77b!important;background-color:#c6a77b!important}
.pn-cinematic-enabled .pn-motion-site>section[data-section-id*="sobre"] p,
.pn-cinematic-enabled .pn-motion-site>section[data-section-id*="historia"] p,
.pn-cinematic-enabled .pn-motion-site>section[data-section-id*="about"] p{
 font-size:clamp(1rem,1.25vw,1.15rem)!important;line-height:1.65!important;
}
.pn-cinematic-enabled .pn-motion-site>section[data-section-id*="sobre"] img,
.pn-cinematic-enabled .pn-motion-site>section[data-section-id*="historia"] img,
.pn-cinematic-enabled .pn-motion-site>section[data-section-id*="about"] img{
 max-height:420px!important;object-fit:cover!important;
}

/* Universal cinematic About layout: preview and published use the same renderer. */
.pn-cinematic-enabled .pn-cinema-about .pn-cinema-about-copy p{font-size:clamp(1rem,1.2vw,1.12rem)!important;line-height:1.75!important;color:#f5f1ea!important;text-align:left!important}
.pn-cinematic-enabled .pn-cinema-about .pn-cinema-about-title :is(h1,h2,h3){color:#fff!important;text-align:left!important}
.pn-cinematic-enabled .pn-cinema-about .pn-cinema-about-media img{transition:transform .8s ease}
@media(hover:hover){.pn-cinematic-enabled .pn-cinema-about .pn-cinema-about-media:hover img{transform:scale(1.035)}}
@media(max-width:767px){.pn-cinematic-enabled .pn-cinema-about .pn-cinema-about-media{margin-top:.5rem}.pn-cinematic-enabled .pn-cinema-about .pn-cinema-about-copy p{font-size:1rem!important}}
@media(prefers-reduced-motion:reduce){.pn-cinematic-enabled .pn-cinema-about .pn-cinema-about-media img{transition:none!important}}

/* CINEMATIC V3 — consistent premium editorial panels and legible surfaces */
.pn-cinematic-enabled .pn-cinema-about-kicker{font-size:clamp(1.6rem,3.7vw,3rem)!important;line-height:1.12!important;letter-spacing:.015em!important;max-width:100%;text-wrap:balance}
.pn-cinematic-enabled .pn-cinema-about-kicker>span{flex-shrink:0}
.pn-cinematic-enabled .pn-cinema-about{padding-block:clamp(2.5rem,6vw,5.5rem)!important}
.pn-cinematic-enabled .pn-cinema-about-copy{border-left:2px solid #c6a77b;padding-left:clamp(1rem,2vw,1.7rem)}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card{background:#f6f1e9!important;background-image:none!important;border:1px solid #d2b58c!important;box-shadow:0 14px 38px rgba(0,0,0,.24)!important;opacity:1!important;filter:none!important;transform:none;min-height:210px}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card :is(h3,p,span){color:#28221c!important;-webkit-text-fill-color:#28221c!important;text-shadow:none!important;opacity:1!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card>div{background:transparent!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card:nth-child(4n+2),.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card:nth-child(4n+3){background:#eee5d8!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card h3{font-size:clamp(1.3rem,2vw,1.8rem)!important;line-height:1.22!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card p{font-size:clamp(.95rem,1.15vw,1.06rem)!important;line-height:1.7!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card:hover{box-shadow:0 24px 52px rgba(0,0,0,.38)!important;transform:translateY(-4px)}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card [aria-hidden="true"]{color:#28221c!important}
@media(max-width:640px){.pn-cinematic-enabled .pn-cinema-about-kicker{font-size:clamp(1.5rem,6vw,2rem)!important}.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card{min-height:0}}
@media(prefers-reduced-motion:reduce){.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card:hover{transform:none}}

/* Cinematic contrast and palette: universal across niches. */
.pn-cinematic-enabled .pn-motion-site>section .pn-process-card{background:#f8f5ef!important;background-image:none!important;border-color:#c6a77b!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-process-card :is(h3,p,span){color:#24211d!important;-webkit-text-fill-color:#24211d!important;text-shadow:none!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-process-card>div{background:transparent!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-form-submit{background:#c6a77b!important;color:#17130e!important;-webkit-text-fill-color:#17130e!important;border:1px solid #f1d6a8!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-form-submit:disabled{opacity:.65!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-photo-card{background:#141311!important;background-image:none!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-photo-card>div:last-child{background:#141311!important;background-image:none!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-social-proof{animation:pn-cinema-proof-entrance .85s ease-out both}
@keyframes pn-cinema-proof-entrance{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@media(prefers-reduced-motion:reduce){.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-social-proof{animation:none!important}}
/* Shared cinematic editorial hierarchy and depth */
.pn-cinematic-enabled .pn-motion-site>section .pn-section-heading h2{font-size:clamp(2rem,4vw,3.6rem)!important;line-height:1.13!important;letter-spacing:-.035em!important;color:#fff!important;text-shadow:0 3px 24px rgba(0,0,0,.35)}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-section-eyebrow{animation:pn-cinema-proof-entrance .85s ease-out both}
.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-text-card,.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-photo-card{box-shadow:0 20px 48px rgba(0,0,0,.25)!important;transition:transform .45s ease,box-shadow .45s ease}
@media(hover:hover){.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-text-card:hover,.pn-cinematic-enabled .pn-motion-site>section .pn-editorial-photo-card:hover{transform:translateY(-5px);box-shadow:0 28px 65px rgba(0,0,0,.4)!important}}
@media(prefers-reduced-motion:reduce){.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-section-eyebrow{animation:none!important}}
@keyframes pn-google-glow{0%,100%{filter:drop-shadow(0 0 0 transparent)}50%{filter:drop-shadow(0 0 8px rgba(251,188,5,.75))}}.pn-cinematic-enabled .pn-google-mark{animation:pn-google-glow 2.8s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.pn-cinematic-enabled .pn-google-mark{animation:none!important}}
.pn-cinematic-enabled .pn-cinema-section-eyebrow{font-size:clamp(1.1rem,2.7vw,2.5rem)!important;letter-spacing:.07em!important;line-height:1.25!important;color:#f6e4c7!important;text-align:center!important}.pn-cinematic-enabled .pn-cinema-section-eyebrow>span{flex-shrink:0}
/* Universal cinematic section headings: one consistent premium scale. */
.pn-cinematic-enabled .pn-cinema-section-eyebrow{font-size:clamp(1.65rem,4.4vw,3.3rem)!important;font-weight:750!important;letter-spacing:.035em!important;line-height:1.16!important;text-wrap:balance!important;max-width:100%!important}
.pn-cinematic-enabled .pn-cinema-map{isolation:isolate}
.pn-cinematic-enabled .pn-cinema-map iframe{display:block;filter:saturate(.8);transition:filter .4s ease}
.pn-cinematic-enabled .pn-cinema-map iframe:hover{filter:saturate(1)}
@media(max-width:480px){.pn-cinematic-enabled .pn-cinema-section-eyebrow{font-size:clamp(1.55rem,6.1vw,2rem)!important;letter-spacing:.02em!important;gap:.5rem!important}.pn-cinematic-enabled .pn-cinema-section-eyebrow>span{width:1.2rem!important}}
/* Cinematic section labels share the same hierarchy, including About. */
.pn-cinematic-enabled .pn-cinema-map .pn-cinema-section-eyebrow{font-size:clamp(1.65rem,4.4vw,3.3rem)!important}
.pn-cinematic-enabled .pn-section-heading .pn-cinema-section-eyebrow{min-height:2.5rem}
@media(max-width:480px){.pn-cinematic-enabled .pn-cinema-map .pn-cinema-section-eyebrow{font-size:clamp(1.55rem,6.1vw,2rem)!important}}
.pn-cinematic-enabled .pn-cinema-about-title :is(h1,h2,h3){font-size:clamp(1.65rem,4.4vw,3.3rem)!important;line-height:1.16!important;letter-spacing:.035em!important;font-weight:750!important;color:#f6e4c7!important}
@media(max-width:480px){.pn-cinematic-enabled .pn-cinema-about-title :is(h1,h2,h3){font-size:clamp(1.55rem,6.1vw,2rem)!important}}

/* Cinematic desktop: controlled editorial scale, not oversized headlines. */
@media(min-width:768px){
.pn-cinematic-enabled .pn-cinema-section-eyebrow,
.pn-cinematic-enabled .pn-cinema-map .pn-cinema-section-eyebrow{font-size:clamp(1.65rem,2.65vw,2.55rem)!important;line-height:1.2!important;max-width:950px!important;margin-inline:auto!important}
.pn-cinematic-enabled .pn-cinema-about-title :is(h1,h2,h3){font-size:clamp(2.1rem,3.1vw,2.95rem)!important;line-height:1.14!important}
.pn-cinematic-enabled .pn-immersive-hero>div>div{max-width:980px!important}
.pn-cinematic-enabled .pn-immersive-hero .pn-section-heading :is(h1,h2){font-size:clamp(3.2rem,5.2vw,5.5rem)!important;line-height:1.03!important;text-shadow:0 5px 34px rgba(0,0,0,.8)!important}
.pn-cinematic-enabled .pn-immersive-hero .pn-section-heading{margin-bottom:1.5rem!important}
}
.pn-cinematic-enabled .pn-cinema-about>div>div:first-child>span:first-child{font-size:clamp(1.45rem,2.5vw,2.35rem)!important;letter-spacing:.045em!important;line-height:1.2!important;font-weight:750!important;display:flex!important;flex-wrap:wrap!important}
.pn-cinematic-enabled .pn-static-testimonials article{min-width:0!important;max-width:100%!important}
.pn-cinematic-enabled .pn-static-testimonials article>div:last-child{display:flex!important;flex-direction:row!important;align-items:center!important;gap:12px!important;min-width:0!important}
.pn-cinematic-enabled .pn-static-testimonials article>div:last-child>img{display:block!important;flex:0 0 48px!important;width:48px!important;height:48px!important;min-width:48px!important;max-width:48px!important;max-height:48px!important;aspect-ratio:1!important;border-radius:50%!important;object-fit:cover!important;position:static!important}
.pn-cinematic-enabled .pn-static-testimonials article>div:last-child>div{flex:1 1 auto!important;min-width:0!important;width:auto!important;max-width:calc(100% - 130px)!important}
.pn-cinematic-enabled .pn-static-testimonials article>div:last-child>div p{overflow-wrap:break-word!important;word-break:normal!important;white-space:normal!important;line-height:1.45!important}
.pn-cinematic-enabled .pn-static-testimonials article>div:last-child>span:last-child{flex:0 0 auto!important;white-space:nowrap!important}
@media(max-width:480px){.pn-cinematic-enabled .pn-cinema-about>div>div:first-child>span:first-child{font-size:1.3rem!important}.pn-cinematic-enabled .pn-static-testimonials article>div:last-child>span:last-child{font-size:10px!important}}

/* Universal cinematic art direction: scoped by semantic section, independent of niche. */
@media(min-width:768px){
.pn-cinematic-enabled .pn-cine-hero{position:relative;min-height: min(840px,94vh)!important;display:flex;align-items:center}
.pn-cinematic-enabled .pn-cine-hero>div{position:relative;z-index:1;width:100%}
.pn-cinematic-enabled .pn-cine-hero .pn-section-heading :is(h1,h2){font-size:clamp(3.5rem,5.5vw,5.8rem)!important;max-width:1000px;margin-inline:auto;text-wrap:balance}
.pn-cinematic-enabled .pn-cine-hero:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 48%,rgba(0,0,0,.30),transparent 67%),linear-gradient(0deg,rgba(0,0,0,.4),transparent 35%);pointer-events:none;z-index:0}
}
.pn-cinematic-enabled .pn-cine-services .pn-editorial-text-card,
.pn-cinematic-enabled .pn-cine-differentials .pn-editorial-text-card{position:relative!important;overflow:hidden!important;border-radius:22px!important;transition:transform .3s ease,box-shadow .3s ease!important}
.pn-cinematic-enabled .pn-cine-services .pn-editorial-text-card{border:1px solid rgba(207,173,117,.7)!important;border-top:4px solid #c8a676!important;background:linear-gradient(140deg,#fffdf8,#ede8de)!important;padding:clamp(22px,2.5vw,36px)!important;min-height:210px!important}
.pn-cinematic-enabled .pn-cine-services .pn-editorial-text-card:after{content:"";position:absolute;right:-32px;bottom:-32px;width:135px;height:135px;border:1px solid rgba(154,119,66,.16);border-radius:50%;pointer-events:none}
.pn-cinematic-enabled .pn-cine-services .pn-editorial-text-card>span{font-size:13px!important;color:#866944!important;letter-spacing:.22em!important}
.pn-cinematic-enabled .pn-cine-services .pn-editorial-text-card :is(h3,strong){font-weight:750!important;letter-spacing:-.02em!important}
.pn-cinematic-enabled .pn-cine-differentials .pn-editorial-text-card{border:1px solid rgba(218,187,137,.65)!important;background:linear-gradient(145deg,#fdf9f1,#e9dfcf)!important;padding:clamp(24px,2.6vw,38px)!important;min-height:225px!important}
.pn-cinematic-enabled .pn-cine-differentials .pn-editorial-text-card>span{font-size:clamp(2rem,3.2vw,3.4rem)!important;line-height:1!important;letter-spacing:-.04em!important;color:rgba(128,93,48,.48)!important}
.pn-cinematic-enabled .pn-cine-process .pn-editorial-photo-card{border:1px solid rgba(215,177,120,.8)!important;border-radius:22px!important;background:linear-gradient(150deg,#191815,#0d0e0c)!important;box-shadow:0 16px 42px rgba(0,0,0,.26)!important}
.pn-cinematic-enabled .pn-cine-process .pn-editorial-photo-card>div:first-child{aspect-ratio:5/3!important}
.pn-cinematic-enabled .pn-cine-process .pn-editorial-photo-card img{filter:saturate(.88) contrast(1.04)}
.pn-cinematic-enabled .pn-cine-process .pn-editorial-photo-card>div:last-child{padding:25px!important}
.pn-cinematic-enabled .pn-cine-process .pn-editorial-photo-card>div:last-child :is(h3,p){color:#f6eee1!important}
.pn-cinematic-enabled .pn-cine-process .pn-editorial-photo-card>div:last-child>span{color:#d9b985!important;font-size:1.3rem!important;font-weight:800!important}
.pn-cinematic-enabled .pn-cine-gallery figure{position:relative;overflow:hidden;border-radius:20px}
.pn-cinematic-enabled .pn-cine-gallery figcaption{font-size:clamp(1rem,1.5vw,1.3rem)!important;font-weight:700!important;letter-spacing:.01em!important}
@media(hover:hover){.pn-cinematic-enabled .pn-cine-services .pn-editorial-text-card:hover,.pn-cinematic-enabled .pn-cine-differentials .pn-editorial-text-card:hover{transform:translateY(-7px)!important;box-shadow:0 26px 48px rgba(0,0,0,.24)!important}}
@media(max-width:767px){.pn-cinematic-enabled .pn-cine-services .pn-editorial-text-card,.pn-cinematic-enabled .pn-cine-differentials .pn-editorial-text-card{min-height:0!important}.pn-cinematic-enabled .pn-cine-hero{min-height:550px!important}}

/* Actual rendered card components: pn-premium-info-card, not editorial cards. */
.pn-cinematic-enabled .pn-cine-services .pn-premium-info-card,
.pn-cinematic-enabled .pn-cine-differentials .pn-premium-info-card{border-radius:24px!important;position:relative!important;overflow:hidden!important;transition:transform .35s ease,box-shadow .35s ease!important}
.pn-cinematic-enabled .pn-cine-services .pn-premium-info-card{background:linear-gradient(145deg,#fffcf6,#e9e0d3)!important;border:1px solid #cbb08a!important;border-top:5px solid #b28b56!important;box-shadow:0 18px 35px rgba(0,0,0,.18)!important}
.pn-cinematic-enabled .pn-cine-differentials .pn-premium-info-card{background:linear-gradient(135deg,#f8f0e3,#e4d5be)!important;border:1px solid #bfa17a!important;box-shadow:0 16px 40px rgba(0,0,0,.2)!important}
.pn-cinematic-enabled .pn-cine-services .pn-premium-info-card>div,
.pn-cinematic-enabled .pn-cine-differentials .pn-premium-info-card>div{padding:clamp(26px,2.7vw,40px)!important}
.pn-cinematic-enabled .pn-cine-services .pn-premium-info-card :is(h3,h4),
.pn-cinematic-enabled .pn-cine-differentials .pn-premium-info-card :is(h3,h4){font-size:clamp(1.25rem,1.7vw,1.7rem)!important;letter-spacing:-.025em!important;line-height:1.25!important;color:#29251e!important}
.pn-cinematic-enabled .pn-cine-services .pn-premium-info-card p,
.pn-cinematic-enabled .pn-cine-differentials .pn-premium-info-card p{color:#4d463d!important;line-height:1.7!important}
.pn-cinematic-enabled .pn-cine-services .pn-premium-info-card span,
.pn-cinematic-enabled .pn-cine-differentials .pn-premium-info-card span{color:#80603d!important}
.pn-cinematic-enabled .pn-cine-services .pn-premium-info-card:before,
.pn-cinematic-enabled .pn-cine-differentials .pn-premium-info-card:before{content:"";position:absolute;bottom:-45px;right:-45px;width:150px;height:150px;border-radius:50%;border:1px solid rgba(150,110,59,.24);pointer-events:none}
@media(hover:hover){.pn-cinematic-enabled .pn-cine-services .pn-premium-info-card:hover,.pn-cinematic-enabled .pn-cine-differentials .pn-premium-info-card:hover{transform:translateY(-6px)!important;box-shadow:0 26px 50px rgba(0,0,0,.3)!important}}


/* Cinematic contrast safety: each surface owns its ink color. */
.pn-cinematic-enabled .pn-cine-services .pn-editorial-text-card,
.pn-cinematic-enabled .pn-cine-differentials .pn-editorial-text-card{background:linear-gradient(145deg,#f9f3e9,#e6d7c0)!important;border:1px solid #b89a70!important;border-radius:10px!important;box-shadow:0 18px 50px rgba(0,0,0,.28)!important;transform:none!important}
.pn-cinematic-enabled .pn-cine-services .pn-editorial-text-card :is(h1,h2,h3,h4,p,li,span,strong,small),
.pn-cinematic-enabled .pn-cine-differentials .pn-editorial-text-card :is(h1,h2,h3,h4,p,li,span,strong,small){color:#25211c!important;opacity:1!important;text-shadow:none!important}
.pn-cinematic-enabled .pn-cine-services .pn-editorial-text-card:nth-child(even),
.pn-cinematic-enabled .pn-cine-differentials .pn-editorial-text-card:nth-child(even){background:linear-gradient(145deg,#efe3d0,#f9f3e9)!important}
.pn-cinematic-enabled .pn-cine-services .pn-editorial-text-card>span,
.pn-cinematic-enabled .pn-cine-differentials .pn-editorial-text-card>span{color:#795d38!important}
.pn-cinematic-enabled .pn-cine-services .pn-editorial-text-card:after,
.pn-cinematic-enabled .pn-cine-differentials .pn-editorial-text-card:after{opacity:.22!important}
.pn-cinematic-enabled .pn-cine-about .pn-cinema-section-eyebrow{font-size:clamp(1.6rem,3.8vw,3.2rem)!important}
@media(max-width:767px){.pn-cinematic-enabled .pn-cine-services .pn-editorial-text-card,.pn-cinematic-enabled .pn-cine-differentials .pn-editorial-text-card{min-height:0!important}}
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
/* CINEMATIC PREMIUM REBUILD: reference-driven editorial composition; video remains library-managed. */
.pn-cinematic-enabled{--pn-cinema-gold:#d8b77e;--pn-cinema-cream:#f0e3ce;--pn-cinema-ink:#0b0a09;font-family:var(--font-poppins),Arial,sans-serif}
.pn-cinematic-enabled .pn-motion-site>section{position:relative;border-bottom:1px solid rgba(216,183,126,.2)!important;padding-block:clamp(3.5rem,6.5vw,7rem)!important}
.pn-cinematic-enabled .pn-motion-site>section:first-child{min-height:min(86vh,840px);display:flex;align-items:center}
.pn-cinematic-enabled .pn-motion-site>section:first-child h1{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(2.7rem,6.4vw,6.5rem)!important;font-weight:700!important;line-height:1.05!important;letter-spacing:-.045em!important;max-width:14ch;text-wrap:balance;text-shadow:0 6px 30px rgba(0,0,0,.6)}
.pn-cinematic-enabled .pn-motion-site>section:first-child :is(p,span){text-shadow:0 2px 15px rgba(0,0,0,.7)}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-section-eyebrow{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(2rem,3.8vw,3.8rem)!important;font-weight:700!important;line-height:1.12!important;letter-spacing:-.035em!important;text-transform:none!important;text-shadow:0 4px 20px rgba(0,0,0,.5);max-width:100%;overflow-wrap:anywhere}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about-kicker{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(2rem,3.8vw,3.8rem)!important;font-weight:700!important;letter-spacing:-.035em!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card{background:#11100e!important;border:1px solid rgba(216,183,126,.48)!important;border-radius:14px!important;min-height:0!important;overflow:hidden;box-shadow:0 12px 35px rgba(0,0,0,.38)!important;transition:transform .3s ease,border-color .3s ease!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card:nth-child(n){background:#11100e!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card>div:not(.pn-cinema-service-image){background:#11100e!important;padding:clamp(1rem,2vw,1.65rem)!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card :is(h3,p,span){color:#f5ead9!important;-webkit-text-fill-color:#f5ead9!important;text-shadow:none!important;opacity:1!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card h3{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(1.3rem,1.8vw,1.75rem)!important;line-height:1.2!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card p{color:#e2d6c4!important;-webkit-text-fill-color:#e2d6c4!important;font-size:clamp(.95rem,1.1vw,1.05rem)!important;line-height:1.65!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card:hover{transform:translateY(-5px)!important;border-color:#d8b77e!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-differential:nth-child(n){background:#f1e6d4!important;border-color:#d8b77e!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-differential>div:not(.pn-cinema-service-image){background:#f1e6d4!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-differential :is(h3,p,span){color:#251b13!important;-webkit-text-fill-color:#251b13!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-differential p{color:#473b2f!important;-webkit-text-fill-color:#473b2f!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-service-image{aspect-ratio:1.5;overflow:hidden;background:#211b16}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-service-image img{height:100%!important;width:100%!important;object-fit:cover!important;transition:transform .5s ease}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card:hover .pn-cinema-service-image img{transform:scale(1.06)}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about{gap:clamp(2rem,4vw,5rem)!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about-media{border-radius:8px!important;border-color:rgba(216,183,126,.45)!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-process-card{border-radius:12px!important;background:#11100e!important;border-color:rgba(216,183,126,.5)!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-process-card>div{background:#11100e!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-process-card :is(h3,p,span){color:#f4e9d8!important;-webkit-text-fill-color:#f4e9d8!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-map iframe{border-radius:12px}
@media(max-width:767px){.pn-cinematic-enabled .pn-motion-site>section{padding-block:3rem!important}.pn-cinematic-enabled .pn-motion-site>section:first-child{min-height:72vh}.pn-cinematic-enabled .pn-motion-site>section:first-child h1{font-size:clamp(2.35rem,9vw,4rem)!important}.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-section-eyebrow{font-size:clamp(1.7rem,6vw,2.6rem)!important}.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about-kicker{font-size:clamp(1.7rem,6vw,2.6rem)!important}}
@media(prefers-reduced-motion:reduce){.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card,.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-service-image img{transition:none!important}}


/* Editorial layout refinements, universal across niches */
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about-title h2{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(2rem,3.2vw,3.4rem)!important;line-height:1.1!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about-copy{font-size:clamp(1rem,1.2vw,1.15rem)!important;line-height:1.85!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card{background-image:none!important;filter:none!important;opacity:1!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card *{text-shadow:none!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-service:nth-child(n){background:#11100e!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-service :is(h3,p,span){color:#f5ead9!important;-webkit-text-fill-color:#f5ead9!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-service p{color:#e2d6c4!important;-webkit-text-fill-color:#e2d6c4!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-differential:nth-child(n){background:#f1e6d4!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-differential :is(h3,p,span){color:#251b13!important;-webkit-text-fill-color:#251b13!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-differential p{color:#473b2f!important;-webkit-text-fill-color:#473b2f!important}

/* Cinematic structural composition: sequential journey instead of generic card grid. */
.pn-cinematic-enabled .pn-cinema-process-timeline>.grid{position:relative;gap:clamp(1.5rem,3vw,3rem)!important}
.pn-cinematic-enabled .pn-cinema-process-timeline>.grid:before{content:"";position:absolute;left:50%;top:2rem;bottom:2rem;width:1px;background:linear-gradient(transparent,#d8b77e 15%,#d8b77e 85%,transparent);pointer-events:none}
.pn-cinematic-enabled .pn-cinema-process-timeline>.grid>article{position:relative;overflow:hidden!important;border-radius:8px!important;border:1px solid rgba(216,183,126,.55)!important;background:#11100e!important;box-shadow:0 24px 50px rgba(0,0,0,.3)!important}
.pn-cinematic-enabled .pn-cinema-process-timeline>.grid>article:nth-child(even){margin-top:clamp(2rem,6vw,6rem)}
.pn-cinematic-enabled .pn-cinema-process-timeline>.grid>article :is(h3,h4){font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(1.45rem,2.2vw,2.1rem)!important;line-height:1.2!important;color:#f6e7d0!important;-webkit-text-fill-color:#f6e7d0!important}
.pn-cinematic-enabled .pn-cinema-process-timeline>.grid>article p{color:#e1d4c0!important;-webkit-text-fill-color:#e1d4c0!important;line-height:1.7!important}
.pn-cinematic-enabled .pn-cinema-process-timeline>.grid>article img{height:100%!important;width:100%!important;object-fit:cover!important;filter:saturate(.83)}
.pn-cinematic-enabled .pn-cinema-process-timeline>.grid>article>div:first-child:has(img){aspect-ratio:16/10!important;overflow:hidden}
.pn-cinematic-enabled .pn-cinema-process-timeline>.grid>article>div:last-child{padding:clamp(1.2rem,2vw,2rem)!important;background:#11100e!important}
.pn-cinematic-enabled [data-pn-section-kind="gallery"] .grid>div:nth-child(4n+1){grid-row:span 2}
.pn-cinematic-enabled [data-pn-section-kind="gallery"] .grid>div{position:relative;overflow:hidden;border-radius:8px!important;border:1px solid rgba(216,183,126,.5)!important}
.pn-cinematic-enabled [data-pn-section-kind="gallery"] .grid img{object-fit:cover!important;width:100%!important;height:100%!important;transition:transform .5s ease}
.pn-cinematic-enabled [data-pn-section-kind="gallery"] .grid>div:hover img{transform:scale(1.035)}
.pn-cinematic-enabled [data-pn-section-kind="testimonials"] blockquote{border:1px solid rgba(216,183,126,.55)!important;border-radius:10px!important;box-shadow:0 15px 40px rgba(0,0,0,.25)!important}
.pn-cinematic-enabled [data-pn-section-kind="testimonials"] blockquote img{width:48px!important;height:48px!important;max-width:48px!important;object-fit:cover!important;border-radius:50%!important;flex-shrink:0!important}
@media(max-width:767px){.pn-cinematic-enabled .pn-cinema-process-timeline>.grid:before{left:10px}.pn-cinematic-enabled .pn-cinema-process-timeline>.grid>article:nth-child(even){margin-top:0}.pn-cinematic-enabled [data-pn-section-kind="gallery"] .grid>div:nth-child(4n+1){grid-row:auto}}

/* Cinematic reference: coherent premium finishes on responsive compositions. */
.pn-cinematic-enabled .pn-motion-site>section .pn-section-heading{margin-bottom:clamp(2rem,4vw,4.5rem)!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-section-heading h2{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(2.2rem,4.2vw,4.4rem)!important;font-weight:700!important;line-height:1.08!important;letter-spacing:-.035em!important;text-wrap:balance}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about{padding-block:clamp(1rem,2vw,2rem)!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about-copy{border-left:2px solid #d8b77e!important;padding-left:clamp(1rem,2vw,1.75rem)!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about-copy p{font-size:clamp(1rem,1.2vw,1.13rem)!important;line-height:1.9!important;max-width:54ch}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about-media{border-radius:10px!important;box-shadow:18px 18px 0 -10px rgba(216,183,126,.55),0 25px 70px rgba(0,0,0,.4)!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-service-image img{filter:saturate(.88) contrast(1.06)}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card{isolation:isolate}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card .pn-cinema-service-image{border-bottom:1px solid rgba(216,183,126,.42)}
.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card:hover .pn-cinema-service-image img{filter:saturate(1) contrast(1.04)}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-form-submit{background:#d8b77e!important;color:#17120d!important;-webkit-text-fill-color:#17120d!important;border:1px solid #e8d0a7!important;border-radius:7px!important;font-weight:800!important;letter-spacing:.03em!important;box-shadow:0 8px 24px rgba(0,0,0,.25)!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-form-submit:hover{background:#f1d6a6!important}
.pn-cinematic-enabled .pn-motion-site>section input,.pn-cinematic-enabled .pn-motion-site>section textarea{border-radius:7px!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-map{max-width:1100px!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-map iframe{min-height:310px}
@media(max-width:767px){.pn-cinematic-enabled .pn-motion-site>section .pn-section-heading{margin-bottom:1.8rem!important}.pn-cinematic-enabled .pn-motion-site>section .pn-section-heading h2{font-size:clamp(1.9rem,7.5vw,3rem)!important}.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about-media{box-shadow:9px 9px 0 -5px rgba(216,183,126,.55),0 15px 40px rgba(0,0,0,.35)!important}.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about-copy p{line-height:1.75!important}.pn-cinematic-enabled .pn-motion-site>section .pn-premium-info-card:hover{transform:none!important}.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-map iframe{min-height:250px}}

/* Premium FAQ: visually coherent dark accordion, readable open states. */
.pn-cinematic-enabled .pn-cinema-faq-premium{max-width:1000px!important}
.pn-cinematic-enabled .pn-cinema-faq-premium details{background:#11100e!important;border:1px solid rgba(216,183,126,.5)!important;border-radius:9px!important;color:#f1e4d0!important;box-shadow:0 12px 28px rgba(0,0,0,.18)!important}
.pn-cinematic-enabled .pn-cinema-faq-premium details[open]{border-color:#d8b77e!important;background:#191611!important}
.pn-cinematic-enabled .pn-cinema-faq-premium summary{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(1.1rem,1.5vw,1.4rem)!important;color:#f1e4d0!important;-webkit-text-fill-color:#f1e4d0!important;padding-block:.4rem!important}
.pn-cinematic-enabled .pn-cinema-faq-premium summary>span:last-child{color:#d8b77e!important;-webkit-text-fill-color:#d8b77e!important}
.pn-cinematic-enabled .pn-cinema-faq-premium details>div{border-top-color:rgba(216,183,126,.35)!important;color:#dfd0b9!important;-webkit-text-fill-color:#dfd0b9!important;font-size:1rem!important;line-height:1.8!important}
@media(max-width:767px){.pn-cinematic-enabled .pn-cinema-faq-premium details{padding:1.1rem!important}}

/* About hierarchy: small section label + one editable editorial heading, never a duplicate. */
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about-kicker{font-family:Arial,sans-serif!important;font-size:clamp(.72rem,.9vw,.86rem)!important;line-height:1.4!important;font-weight:800!important;letter-spacing:.19em!important;text-transform:uppercase!important;color:#d8b77e!important;-webkit-text-fill-color:#d8b77e!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about-title .pn-section-heading{margin-bottom:0!important;text-align:left!important}
.pn-cinematic-enabled .pn-motion-site>section .pn-cinema-about-title .pn-section-heading h2{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(2.2rem,4vw,4.25rem)!important;line-height:1.08!important;font-weight:700!important;letter-spacing:-.04em!important;text-align:left!important;text-wrap:balance}

/* Structural cinematic compositions: photo-led services, editorial differences, asymmetric gallery. */
.pn-cinematic-enabled [data-pn-composition="services"]>.grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:clamp(1rem,2vw,1.8rem)!important}
.pn-cinematic-enabled [data-pn-composition="services"]>.grid>article{padding:0!important;min-height:370px!important;border:1px solid rgba(216,183,126,.5)!important;border-radius:9px!important;background:#10100e!important;box-shadow:0 20px 50px rgba(0,0,0,.28)!important;overflow:hidden!important}
.pn-cinematic-enabled [data-pn-composition="services"]>.grid>article>div:first-child:has(img){width:100%!important;height:clamp(180px,19vw,275px)!important;aspect-ratio:auto!important;flex:none!important;border-radius:0!important;overflow:hidden!important}
.pn-cinematic-enabled [data-pn-composition="services"]>.grid>article>div:first-child:has(img) img{width:100%!important;height:100%!important;object-fit:cover!important;transition:transform .5s ease!important}
.pn-cinematic-enabled [data-pn-composition="services"]>.grid>article:hover img{transform:scale(1.04)}
.pn-cinematic-enabled [data-pn-composition="services"]>.grid>article>div:last-child{padding:clamp(1.3rem,2.3vw,2.2rem)!important}
.pn-cinematic-enabled [data-pn-composition="services"]>.grid>article h3{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(1.4rem,2vw,2rem)!important;line-height:1.18!important}
.pn-cinematic-enabled [data-pn-composition="differentials"]>.grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:0!important;border-top:1px solid rgba(216,183,126,.5)!important;border-left:1px solid rgba(216,183,126,.5)!important}
.pn-cinematic-enabled [data-pn-composition="differentials"]>.grid>article{min-height:220px!important;padding:clamp(1.6rem,3vw,3.2rem)!important;border:0!important;border-right:1px solid rgba(216,183,126,.5)!important;border-bottom:1px solid rgba(216,183,126,.5)!important;border-radius:0!important;background:rgba(11,10,9,.9)!important;box-shadow:none!important;transform:none!important}
.pn-cinematic-enabled [data-pn-composition="differentials"]>.grid>article h3{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(1.4rem,2vw,2rem)!important;line-height:1.2!important}
.pn-cinematic-enabled [data-pn-composition="differentials"]>.grid>article>div:first-child:has(img){display:none!important}
.pn-cinematic-enabled [data-pn-section-kind="gallery"] .grid{grid-template-columns:repeat(12,minmax(0,1fr))!important;align-items:stretch!important;gap:clamp(.8rem,1.8vw,1.5rem)!important}
.pn-cinematic-enabled [data-pn-section-kind="gallery"] .grid>*{grid-column:span 6!important;min-width:0!important}
.pn-cinematic-enabled [data-pn-section-kind="gallery"] .grid>*:nth-child(4n+1){grid-column:span 7!important}
.pn-cinematic-enabled [data-pn-section-kind="gallery"] .grid>*:nth-child(4n+2){grid-column:span 5!important}
.pn-cinematic-enabled [data-pn-section-kind="gallery"] .grid>*:nth-child(4n+3){grid-column:span 5!important}
.pn-cinematic-enabled [data-pn-section-kind="gallery"] .grid>*:nth-child(4n+4){grid-column:span 7!important}
.pn-cinematic-enabled [data-pn-section-kind="gallery"] .grid img{height:100%!important;max-height:490px!important;width:100%!important;object-fit:cover!important}
@media(max-width:767px){.pn-cinematic-enabled [data-pn-composition="services"]>.grid,.pn-cinematic-enabled [data-pn-composition="differentials"]>.grid{grid-template-columns:minmax(0,1fr)!important}.pn-cinematic-enabled [data-pn-composition="services"]>.grid>article{min-height:0!important}.pn-cinematic-enabled [data-pn-composition="services"]>.grid>article>div:first-child:has(img){height:220px!important}.pn-cinematic-enabled [data-pn-composition="differentials"]>.grid>article{min-height:0!important}.pn-cinematic-enabled [data-pn-section-kind="gallery"] .grid>*{grid-column:span 12!important}}

@media(min-width:1024px){.pn-cinematic-enabled [data-pn-composition="services"]>.grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}.pn-cinematic-enabled [data-pn-composition="services"]>.grid>article{min-height:0!important}.pn-cinematic-enabled [data-pn-composition="services"]>.grid>article>div:first-child:has(img){height:170px!important}.pn-cinematic-enabled [data-pn-composition="services"]>.grid>article>div:last-child{padding:1.25rem!important}.pn-cinematic-enabled [data-pn-composition="services"]>.grid>article h3{font-size:1.35rem!important}.pn-cinematic-enabled [data-pn-composition="services"]>.grid>article p{font-size:.94rem!important;line-height:1.65!important}}
/* Cinematic family 02: gastronomy. Deliberately distinct from barbershop bronze/editorial. */
.pn-cinema-gastronomy{--pn-food-accent:#ed6138;--pn-food-cream:#fff1db;font-family:var(--font-poppins),Arial,sans-serif}
.pn-cinema-gastronomy .pn-cinema-section-eyebrow{color:#ffb07a!important;letter-spacing:.22em!important}
.pn-cinema-gastronomy h1,.pn-cinema-gastronomy h2,.pn-cinema-gastronomy h3{font-family:var(--font-poppins),Arial,sans-serif!important;font-weight:800!important;letter-spacing:-.035em!important}
.pn-cinema-gastronomy [data-pn-composition="services"]>.grid{gap:1.1rem!important}
.pn-cinema-gastronomy [data-pn-composition="services"]>.grid>article{border-radius:1.2rem!important;border-color:rgba(237,97,56,.5)!important;background:#1d1512!important}
.pn-cinema-gastronomy [data-pn-composition="services"]>.grid>article img{object-fit:cover!important}
.pn-cinema-gastronomy .pn-cinema-contact-location,.pn-cinema-gastronomy .pn-cinema-faq-premium details{border-color:rgba(237,97,56,.5)!important;background:#1b1513!important}
.pn-cinema-gastronomy .pn-cinema-contact-location a:last-child,.pn-cinema-gastronomy .pn-cinema-contact-location button{background:#ed6138!important;color:#fff!important}
.pn-cinema-gastronomy .pn-cinema-contact-location p,.pn-cinema-gastronomy .pn-cinema-contact-location address{color:#fff1db!important}
@media(min-width:1024px){.pn-cinema-gastronomy [data-pn-composition="services"]>.grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.pn-cinema-gastronomy [data-pn-composition="services"]>.grid>article img{height:225px!important}}
`}</style>}
        
        
        {templateId==="minimalist-sophisticated"&&<style>{`/* Template 2 — single coherent design system. All rules scoped to Template 2. */
.pn-template-editorial{--pn-ink:#24362c;--pn-accent:#55725f;--pn-muted:#556259;--pn-paper:#f8f8f5;color:var(--pn-ink);font-family:Arial,Helvetica,sans-serif}
.pn-template-editorial header{background:#fff!important;color:var(--pn-ink)!important;border-color:#e4e8e2!important}
.pn-template-editorial .pn-motion-site>section{border-radius:0!important}
.pn-template-editorial .pn-motion-site>section:not(:first-child) .pn-section-heading,
.pn-template-editorial .pn-motion-site>section:not(:first-child) .pn-section-heading :is(h1,h2,h3),
.pn-template-editorial .pn-motion-site>section:not(:first-child) [data-block-id][class*="heading"]{color:#17251d!important}
.pn-template-editorial .pn-editorial-premium article{transform-style:preserve-3d;perspective:1000px;box-shadow:0 12px 25px rgba(22,42,31,.08),0 28px 55px rgba(22,42,31,.055)!important}
.pn-template-editorial .pn-editorial-premium article:hover{transform:translateY(-7px) rotateX(1.2deg);box-shadow:0 25px 60px rgba(22,42,31,.16)!important}
.pn-template-editorial .pn-editorial-premium article:before{content:"";position:absolute;inset:0 0 auto;height:3px;background:linear-gradient(90deg,#315f48,#a4cbb4,transparent);pointer-events:none}
.pn-template-editorial .pn-editorial-premium article{position:relative}
@media(prefers-reduced-motion:reduce){.pn-template-editorial .pn-editorial-premium article:hover{transform:none}}
.pn-template-editorial .pn-motion-site>section:not(:first-child) h1,
.pn-template-editorial .pn-motion-site>section:not(:first-child) h2,
.pn-template-editorial .pn-motion-site>section:not(:first-child) h3{color:var(--pn-ink)!important;letter-spacing:-.035em!important;line-height:1.15!important}
.pn-template-editorial .pn-motion-site>section:not(:first-child) .pn-section-heading,
.pn-template-editorial .pn-motion-site>section:not(:first-child) .pn-section-heading *{text-align:center!important;color:var(--pn-ink)!important}
.pn-template-editorial .pn-motion-site>section:not(:first-child) .pn-section-heading{max-width:850px!important;margin:0 auto 44px!important}
.pn-template-editorial .pn-motion-site>section:not(:first-child) .pn-section-heading h2{font-size:clamp(2rem,3.4vw,3.3rem)!important;font-weight:750!important;line-height:1.14!important}
.pn-template-editorial .pn-editorial-layout{max-width:1200px!important;min-width:0}
.pn-template-editorial .pn-editorial-layout h1{font-size:clamp(2.6rem,6vw,5.8rem)!important}
.pn-template-editorial .pn-editorial-layout p{line-height:1.7!important}
.pn-template-editorial .pn-editorial-premium article,
.pn-template-editorial .pn-editorial-about article{background:#fff!important;border:1px solid #e2e7e0!important;border-radius:22px!important;box-shadow:0 14px 40px rgba(26,42,31,.075)!important;overflow:hidden;transition:transform .25s ease,box-shadow .25s ease}
.pn-template-editorial .pn-editorial-premium article:hover,
.pn-template-editorial .pn-editorial-about article:hover{transform:translateY(-4px);box-shadow:0 22px 50px rgba(26,42,31,.12)!important}
.pn-template-editorial .pn-editorial-premium article h3{font-size:1.17rem!important;font-weight:750!important;line-height:1.3!important;color:var(--pn-ink)!important}
.pn-template-editorial .pn-editorial-premium article p,
.pn-template-editorial .pn-editorial-about article p{color:var(--pn-muted)!important;font-size:.98rem!important;line-height:1.7!important}
.pn-template-editorial .pn-editorial-premium article span{color:var(--pn-accent)!important}
.pn-template-editorial .pn-editorial-premium article img{width:100%;height:100%;object-fit:cover}
.pn-template-editorial .pn-editorial-about>div.grid>div:first-child{border-radius:22px;overflow:hidden;min-height:350px}
.pn-template-editorial .pn-editorial-about>div.grid>div:first-child img{width:100%;height:100%;min-height:350px;object-fit:cover}
.pn-template-editorial .pn-editorial-about>div.grid>div{min-width:0}
.pn-template-editorial .pn-editorial-layout img{max-width:100%}
.pn-template-editorial .pn-editorial-layout a{transition:transform .2s ease,opacity .2s ease}
.pn-template-editorial .pn-editorial-layout a:hover{opacity:.9}
.pn-template-editorial footer{background:#17251d!important;color:#fff!important}
@media(max-width:767px){.pn-template-editorial .pn-motion-site>section:not(:first-child) .pn-section-heading{margin-bottom:28px!important}.pn-template-editorial .pn-editorial-about>div.grid>div:first-child{min-height:260px}.pn-template-editorial .pn-editorial-premium article{min-height:0}}
@media(prefers-reduced-motion:reduce){.pn-template-editorial *{transition:none!important}}
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
        <section className={`${site.cinematic?.mode==="cinematic"&&"pn-cinematic-enabled "}${site.cinematic?.mode==="cinematic"&&/hamb[uú]rg|burger|pizz|restaurante|sushi|japon[eê]s|churrasc|cafeteria|padaria|confeitaria|doceria|sorveteria|a[cç]a[ií]|marmitaria|pastelaria|esfiharia|bistr[oô]|gastronomi|food truck|massas|rotisseria|delivery/i.test([site.niche,site.title,selectedNiche].filter(Boolean).join(" "))?"pn-cinema-gastronomy ":""}${templateId==="minimalist-sophisticated"?"pn-template-editorial ":""}${publishedMode ? "w-full bg-white text-black" : "overflow-hidden rounded-2xl border border-white/15 bg-white text-black"}`}>{site.blocks.length>0&&site.extras?.enabled?.announcement!==false&&!!site.extras?.announcement&&<div className="overflow-hidden bg-[#173c2e] px-5 py-2 text-center text-sm text-white"><style>{`@keyframes pn-announcement-flow{to{transform:translateX(-50%)}}@media(prefers-reduced-motion:reduce){.pn-announcement-track{animation:none!important}}`}</style>{site.extras?.announcementMotion?<div className="pn-announcement-track flex w-max items-center" style={{animation:`pn-announcement-flow ${Math.max(8,Math.min(120,site.extras?.announcementSpeed||24))}s linear infinite`,animationDirection:site.extras?.announcementDirection==="right"?"reverse":"normal"}}>{[0,1].map(i=><div key={i} aria-hidden={i===1} className="flex shrink-0 items-center gap-12 pr-12">{Array.from({length:4},(_,j)=><span key={j} className="whitespace-nowrap">{site.extras?.announcement||"Conheça nossos serviços e entre em contato para saber mais."}</span>)}</div>)}</div>:site.extras?.announcement||"Conheça nossos serviços e entre em contato para saber mais."}</div>}{showHeader&&<header style={{backgroundColor:headerBackground,color:headerColor}} className={`z-50 border-b border-black/10 shadow-[0_2px_18px_rgba(0,0,0,.04)] ${header?.sticky===false?"relative":"sticky top-0"}`}><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-12"><a href="#inicio" onClick={()=>setMenuOpen(false)} className="flex min-w-0 max-w-[calc(100%-4rem)] items-center gap-2.5 text-sm font-bold tracking-tight sm:text-base">{header?.logoUrl?<img src={header.logoUrl} alt={brand} className="h-9 max-w-[150px] object-contain sm:h-11 sm:max-w-[200px]"/>:<span className="block max-w-[min(55vw,210px)] truncate whitespace-nowrap lg:max-w-[250px]">{brand}</span>}</a><nav aria-label="Navegação principal" className="hidden min-w-0 flex-1 items-center justify-end gap-3 xl:gap-5 2xl:flex">{nav.slice(0,5).map(g=><a key={g.id} href={"#"+g.id} className="max-w-[150px] truncate whitespace-nowrap text-xs font-medium opacity-80 transition hover:opacity-100 xl:text-sm">{navLabel(g)}</a>)}{extraNav.map((item:any)=><a key={item.href} href={item.href} className="max-w-[150px] truncate whitespace-nowrap text-xs font-medium opacity-80 transition hover:opacity-100 xl:text-sm">{item.label}</a>)}</nav><div className="flex shrink-0 items-center gap-3"><a href={ctaHref} style={adaptiveTemplate?{backgroundColor:adaptiveColor}:undefined} className="hidden rounded-full bg-[#193f31] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2b5b48] sm:inline-flex">{ctaLabel}</a><button type="button" aria-label={menuOpen?"Fechar menu":"Abrir menu"} aria-expanded={menuOpen} aria-controls="pn-builder-mobile-menu" onClick={()=>setMenuOpen(v=>!v)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-current/20 text-xl 2xl:hidden">{menuOpen?"×":"☰"}</button></div></div>{menuOpen&&<nav id="pn-builder-mobile-menu" aria-label="Navegação mobile" className="max-h-[min(65vh,470px)] overflow-y-auto border-t border-black/10 px-5 pb-4 pt-1 2xl:hidden">{nav.map(g=><a key={g.id} href={"#"+g.id} onClick={()=>setMenuOpen(false)} className="block border-b border-black/10 py-2.5 text-sm font-medium">{navLabel(g)}</a>)}{extraNav.map((item:any)=><a key={item.href} href={item.href} onClick={()=>setMenuOpen(false)} className="block border-b border-black/10 py-2.5 text-sm font-medium">{item.label}</a>)}<a href={ctaHref} onClick={()=>setMenuOpen(false)} style={adaptiveTemplate?{backgroundColor:adaptiveColor}:undefined} className="mt-4 block rounded-xl bg-[#193f31] px-5 py-3 text-center text-sm font-semibold text-white">{ctaLabel}</a></nav>}</header>}
        {<CinematicBackground appearance={site.cinematic}/>}
        <div ref={previewRef} data-pn-template={adaptiveTemplate?"prompt-adaptive":undefined} className={adaptiveTemplate?"pn-motion-site":"pn-motion-site pn-institutional-responsive"} style={{backgroundColor:site.cinematic?.mode==="cinematic"&&(site.cinematic.desktopUrl||site.cinematic.mobileUrl)?"transparent":site.background}}>{adaptiveTemplate&&<style>{`
[data-pn-template="prompt-adaptive"] { --pn-accent: ${adaptiveColor}; --pn-surface:${adaptiveTheme.surface}; --pn-ink:${adaptiveTheme.ink}; --pn-muted:${adaptiveTheme.muted}; --pn-card-ink:${adaptiveTheme.cardInk}; --pn-card-muted:${adaptiveTheme.cardMuted}; }
[data-pn-template="prompt-adaptive"] section { color:var(--pn-ink); }
[data-pn-template="prompt-adaptive"] section[id*="process"] ol,[data-pn-template="prompt-adaptive"] section[id*="funciona"] ol {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
[data-pn-template="prompt-adaptive"] section :is(h1,h2,h3){overflow-wrap:anywhere}
[data-pn-template="prompt-adaptive"] section article {min-width:0}
@media(min-width:768px){[data-pn-template="prompt-adaptive"] [data-pn-columns]{grid-template-columns:repeat(var(--pn-card-columns),minmax(0,1fr))}}
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
[data-pn-template="prompt-adaptive"] [data-pn-composition="services"] .pn-premium-card,[data-pn-template="prompt-adaptive"] [data-pn-composition="differentials"] .pn-premium-card,[data-pn-template="prompt-adaptive"] [data-pn-composition="modalities"] .pn-premium-card{position:relative;isolation:isolate;min-height:215px;background:var(--pn-surface);border:1px solid rgba(255,255,255,.11);border-top:1px solid rgba(255,255,255,.2)}
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
/* Desktop readability: prevent oversized adaptive headings, cards and excessive vertical gaps. */
@media(min-width:1024px){
[data-pn-template="prompt-adaptive"] section{min-height:0!important}
[data-pn-template="prompt-adaptive"] section h1{font-size:clamp(2.5rem,4vw,4.25rem)!important;line-height:1.12!important}
[data-pn-template="prompt-adaptive"] section h2{font-size:clamp(2rem,3vw,3.3rem)!important;line-height:1.15!important}
[data-pn-template="prompt-adaptive"] section h3{font-size:clamp(1.2rem,1.65vw,1.7rem)!important;line-height:1.25!important}
[data-pn-template="prompt-adaptive"] section p{font-size:clamp(.95rem,1.15vw,1.15rem)!important;line-height:1.6!important}
[data-pn-template="prompt-adaptive"] section article{min-height:0!important}
[data-pn-template="prompt-adaptive"] section blockquote{min-height:0!important}
[data-pn-template="prompt-adaptive"] section .pn-adaptive-testimonials{align-items:start!important}
}
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

[data-pn-template="prompt-adaptive"] section article { background:var(--pn-surface); border-color:var(--pn-accent); color:var(--pn-card-ink); box-shadow:0 14px 40px rgba(0,0,0,.18); }
[data-pn-template="prompt-adaptive"] section article h3,
[data-pn-template="prompt-adaptive"] section article p,
[data-pn-template="prompt-adaptive"] section article li { color:var(--pn-card-ink); opacity:1; }
[data-pn-template="prompt-adaptive"] section article p { color:var(--pn-card-muted); }
[data-pn-template="prompt-adaptive"] section article a { background:var(--pn-accent); border-color:var(--pn-accent); color:#fff; }
[data-pn-template="prompt-adaptive"] section article:hover { transform:translateY(-3px); transition:transform .2s ease; }
[data-pn-template="prompt-adaptive"] section article h3 { font-family:inherit; font-weight:750; }
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

[data-pn-template="prompt-adaptive"] section h2 { text-shadow:none; }
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
          const sectionBackground=(adaptiveTemplate?(first?.background||site.background||"#ffffff"):templateId==="minimalist-sophisticated" ? (index%2===0?"#ffffff":"#f7f8f5") : first?.background)||(templateId==="minimalist-sophisticated"?(index%2===0?"#f7f5f0":"#eae7df"):(index===0?theme.dark:index%2?theme.light:site.background));

          
          const sectionTheme=adaptivePalette(sectionBackground,site.design);
          const heroPhotoCandidate=blocks.find(b=>b.type==="image"&&!!b.src)?.src || (index===0 ? visibleSections.flatMap(section=>section.blocks).find(b=>b.type==="image"&&!!b.src)?.src : undefined);
          const multiHero=index===0&&(site.heroComposition==="duo"||site.heroComposition==="trio")&&blocks.filter(b=>b.type==="image"&&!!b.src).length>=(site.heroComposition==="duo"?2:3);
          const immersiveHero=multiHero||(index===0&&(site.heroPresentation!=="split")&&!!heroPhotoCandidate);
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
          const testimonials=textItems.filter(b=>clean(b.text).length>18).slice(0,adaptiveTemplate?undefined:6); const cinematicTestimonials=site.cinematic?.mode==="cinematic"&&testimonials.length===3?[...testimonials,{...testimonials[0],id:group.id+"-illustrative-fourth",text:"Depoimento ilustrativo: Atendimento cuidadoso, ambiente agradável e uma experiência pensada nos mínimos detalhes."} as Block]:testimonials;
          const testimonialInfo=(item:Block)=>{const raw=clean(item.text).replace(/^[“"]|[”"]$/g,"").trim();const parts=raw.includes("|")?raw.split(/\s*\|\s*/).map(p=>p.trim()).filter(Boolean):raw.split(/\s+[—–]\s+/).map(p=>p.trim()).filter(Boolean);const first=parts[0]||"";const validName=/^[\p{L}.'-]+(?:\s+[\p{L}.'-]+){1,4}$/u.test(first)&&!/^depoimento/i.test(first);const name=parts.length>=3&&validName?first:"";const city=name?parts[1]:"";const message=name?parts.slice(2).join(" — "):raw.replace(/^depoimento\s*\d+\s*[:—–-]?\s*/i,"");return {name,city,message,photo:(site.blocks.filter(photo=>photo.type==="image"&&!!photo.src&&photo.section===group.id).find(photo=>photo.id===item.id+"-photo"||photo.forCardId===item.id||(!!name&&photo.text?.trim().toLocaleLowerCase("pt-BR")===name.toLocaleLowerCase("pt-BR")))||images.find(photo=>photo.id===item.id+"-photo"||photo.forCardId===item.id||(!!name&&photo.text===name)))?.src||""};};
          const isPrinciples=/princip|diferencia|valores|filosofia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const isHumanizedApproach=/abordagem.humanizada|nossa.abordagem/i.test(id+" "+heading.map(b=>b.text).join(" "));
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
          const menuPrice=(text:string)=>(text.match(/R\$\s*\d{1,4}(?:[.,]\d{2})?/i)||[])[0]||"";
          const menuDescription=(text:string)=>text.replace(/(?:^|[\s|—–-])(?:pre[cç]o\s*:?\s*)?R\$\s*\d{1,4}(?:[.,]\d{2})?/gi," ").replace(/\s{2,}/g," ").replace(/^[\s|—–:,-]+|[\s|—–:,-]+$/g,"").trim();
          const menuOrderUrl=(name:string)=>{const base=normalizedSocialLink("whatsapp",site.footer?.whatsapp||site.restaurant?.whatsapp||"");if(!base)return "";try{const url=new URL(base);if(!/(^|\.)wa\.me$|(^|\.)api\.whatsapp\.com$|(^|\.)web\.whatsapp\.com$/.test(url.hostname))return base;const message="Olá! Gostaria de pedir: "+name+".";const existing=url.searchParams.get("text");url.searchParams.set("text",existing?existing+"\n"+message:message);return url.toString();}catch{return base;}};
          const safeColor=(color:string)=>{const c=readableColor(color,sectionBackground);const lightBackground=/^#(?:[cdef][0-9a-f]|f[0-9a-f]|[a-f]{3})/i.test(sectionBackground)||/^(white|#fff(?:fff)?)$/i.test(sectionBackground);if(lightBackground&&(/^#(?:[cdef][0-9a-f]|f[0-9a-f])/i.test(c)||/^(?:white|#fff(?:fff)?)$/i.test(c)))return "#26382f";const dark=/^#(?:1[0-9a-f]|2[0-9a-f]|3[0-9a-f])/i.test(sectionBackground);return dark&&/^#(?:0[0-9a-f]|1[0-9a-f]|2[0-9a-f]|3[0-9a-f])/i.test(c)?"#f7f4eb":c;};
          const render=(b:Block)=> {
            if(b.type==="heading") return <h2 key={b.id} data-block-id={b.id} style={{textAlign:b.align||(!adaptiveTemplate?"center":undefined),color:immersiveHeroTextColor((templateId==="institutional-complete"||templateId==="minimalist-sophisticated")&&!immersiveHero?"#171c19":b.colorExplicit?b.color:readableColor(b.color||"#234638",sectionBackground),immersiveHero,b.colorExplicit),["--pn-block-color" as string]:immersiveHeroTextColor((templateId==="institutional-complete"||templateId==="minimalist-sophisticated")&&!immersiveHero?"#171c19":b.colorExplicit?b.color:readableColor(b.color||"#234638",sectionBackground),immersiveHero,b.colorExplicit),fontFamily:b.fontFamily||displayFont,fontSize:b.fontSize?`${b.fontSize}px`:undefined,...(b.mobileFontSize?{["--pn-mobile-font-size" as string]:`${b.mobileFontSize}px`}:{})}} data-pn-responsive-mobile-size={b.mobileFontSize?"true":undefined} className={visualLayout==="hero"?"max-w-3xl text-[clamp(2rem,4.2vw,3.9rem)] font-medium leading-[1.04] tracking-[-.05em]":adaptiveTemplate?"mx-auto max-w-4xl text-center text-[clamp(1.65rem,3vw,2.8rem)] font-medium":"mx-auto max-w-4xl text-center text-[clamp(1.65rem,3vw,2.8rem)] font-medium leading-[1.1] tracking-[-.045em]"}>{publicHeading(b.text,id)}</h2>;
            if(b.type==="paragraph") return <p key={b.id} data-block-id={b.id} style={{textAlign:adaptiveTemplate?b.align||undefined:visualLayout==="hero"?"center":b.align||undefined,color:immersiveHeroTextColor(b.colorExplicit?b.color:readableColor(b.color||"#36483e",sectionBackground),immersiveHero,b.colorExplicit),["--pn-block-color" as string]:immersiveHeroTextColor(b.colorExplicit?b.color:readableColor(b.color||"#36483e",sectionBackground),immersiveHero,b.colorExplicit),fontSize:b.fontSize?`${b.fontSize}px`:undefined}} className={visualLayout==="hero"?"mx-auto max-w-2xl text-center text-[15px] leading-[1.65] md:text-lg":!adaptiveTemplate&&b.section===group.id&&heading.some(h=>h.id===b.id)?"mx-auto max-w-2xl text-center text-[15px] leading-[1.65] md:text-lg":"max-w-2xl text-[15px] leading-[1.65] md:text-lg"}>{clean(b.text).replace(/(?:telefone\s*:\s*)?\(?11\)?\s*1234[-\s]?5678/gi,"")}</p>;
            if(b.type==="image") return b.src?<picture key={b.id} data-block-id={b.id}>{b.mobileSrc&&<source media="(max-width: 767px)" srcSet={b.mobileSrc}/>}<img src={b.src} alt={b.text||"Fotografia do negócio"} loading="lazy" onError={event=>{const img=event.currentTarget;if(img.dataset.fallbackAttempted||b.userUploaded)return;img.dataset.fallbackAttempted="true";const niche=Object.keys(nichePhotoCatalog).find(name=>site.title.toLocaleLowerCase("pt-BR").includes(name.toLocaleLowerCase("pt-BR")))||(/psicolog|terap/i.test(site.title)?"Psicologia":undefined);const entry=niche?(nichePhotoCatalog as Record<string,{desktop:string[];mobile:string[]}>)[niche]:undefined;const candidates=entry?.desktop||[];if(candidates.length){const source=img.parentElement?.querySelector("source");source?.remove();img.src=nichePhotoBase+candidates[Math.abs(b.id.split("").reduce((n,c)=>n+c.charCodeAt(0),0))%candidates.length]+".png";}else{img.style.display="none";}}} data-pn-image-fit={b.imageFit} className="aspect-[4/3] w-full rounded-2xl object-cover" style={{objectFit:b.imageFit||"cover",objectPosition:b.imagePosition||"center"}}/></picture>:null;
            const proof=site.socialProof;
            const showProof=index===0&&buttons[0]?.id===b.id&&proof?.enabled!==false&&!adaptiveTemplate;
            const rating=typeof proof?.rating==="number"&&proof.rating>0&&proof.rating<=5?proof.rating:4.9;
            const count=typeof proof?.reviewCount==="number"&&proof.reviewCount>0?proof.reviewCount:287;
            const isExample=!(typeof proof?.rating==="number"&&typeof proof?.reviewCount==="number");
            const social=<div className="pn-cinema-social-proof mt-6 flex w-fit max-w-full items-center gap-3 rounded-2xl border border-white/20 bg-black/45 px-4 py-3 text-left shadow-lg backdrop-blur-md" aria-label="Google"><span aria-hidden="true" className="pn-google-mark text-3xl font-extrabold" style={{background:"conic-gradient(#4285f4 0 25%,#34a853 25% 48%,#fbbc05 48% 70%,#ea4335 70% 88%,#4285f4 88%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>G</span><div className="min-w-0"><p className="text-sm font-semibold text-white">Google</p>{!isExample?<><p className="text-sm font-semibold text-[#e8bd72]">{rating.toLocaleString("pt-BR",{maximumFractionDigits:1})}/5 ★★★★★</p><p className="text-xs text-white/85">{count.toLocaleString("pt-BR")} avaliações</p></>:<p className="text-xs text-white/85">Conheça nossa presença no Google</p>}</div></div>;
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
          const isTreatments=/tratament|servi[cç]os|servic|procediment|card[aá]pio|menu|pratos|hamb[uú]rgueres|pizzas|produtos/i.test(id+" "+heading.map(block=>block.text).join(" "));
          const adaptivePricing=adaptiveTemplate&&/planos|pre[cç]os|pricing|investimento/i.test(id);
          const adaptiveServices=adaptiveTemplate&&isTreatments;
          const adaptiveDifferentials=adaptiveTemplate&&/diferencia|por.que|escolher/i.test(id);
          const isAboutEditorial=/sobre|hist[oó]ria|quem.somos|nossa.equipe|ess[eê]ncia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const isDifferentials=!isAboutEditorial&&/diferencia|por.que|vantagen|escolher|escolha|excel[eê]ncia|compromisso|jornada|valores|filosofia/i.test(id+" "+heading.map(b=>b.text).join(" "));
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
                {heading.map(block=><h2 key={block.id} data-block-id={block.id} className="mb-10 text-left text-3xl font-bold tracking-tight md:text-5xl" style={{color:block.colorExplicit?block.color:sectionTheme.ink,textAlign:block.align,fontFamily:block.fontFamily}}>{block.text}</h2>)}
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
          const headingNode=<div className="pn-section-heading mx-auto mb-8 max-w-4xl space-y-3 text-center md:mb-11">{site.cinematic?.mode==="cinematic"&&index>0&&!isAboutEditorial&&<div className="pn-cinema-section-eyebrow mb-5 flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[.27em] text-[#dbc19b]"><span className="h-px w-9 bg-current"/> {String(cinematicNumber(index)).padStart(2,"0")} / {heading.map(h=>publicHeading(h.text,id)).filter(Boolean).join(" ")|| (isTestimonials?"DEPOIMENTOS":isProcess?"NOSSO PROCESSO":isGallery?"GALERIA":isContact?"CONTATO":/faq|perguntas/i.test(id)?"PERGUNTAS FREQUENTES":"DESCUBRA MAIS")} <span className="h-px w-9 bg-current"/></div>}{(site.cinematic?.mode==="cinematic"&&index>0&&!isAboutEditorial?[]:heading).map(b=>{
            if(adaptiveTemplate){
              const cleanTitle=b.text.replace(/\s*[—–-]\s*(?:fundo|layout|com contagem|indicadores animados|responsiv|#[0-9a-f]{6}).*$/i,"").trim();
              return render({...b,text:cleanTitle});
            }
            return isGallery&&b.type==="heading"&&/resultados/i.test(b.text)?render({...b,text:b.text.replace(/resultados/gi,"Imagens")}):render(b);
          })}</div>;
          const editorialVisuals=uniqueImages.filter(b=>!!b.src);
          const cardImage=(card:Block,i:number)=>isTreatments&&!treatmentHasCompletePhotos?undefined:(images.find(image=>image.forCardId===card.id)||editorialVisuals[i]);
          const editorialCardsForDisplay=textItems.filter(b=>b.type==="paragraph"&&b.text.trim().length>0);
          const editorialDescription=(item:Block)=>{
            const parsed=cardText(item);
            const title=(parsed.name||"").trim();
            const description=(parsed.description||item.text||"").trim();
            return title&&description.toLocaleLowerCase("pt-BR").startsWith(title.toLocaleLowerCase("pt-BR")+":")
              ?description.slice(title.length+1).trim():description;
          };
          const editorialPhotoCard=(b:Block,i:number)=> cardImage(b,i) ? <article key={b.id} data-block-id={b.id} className="pn-editorial-photo-card group min-w-0 overflow-hidden rounded-xl border border-[#e4e7e3] bg-white"><div className="relative aspect-[4/3] overflow-hidden bg-[#f1f3f0]"><img src={cardImage(b,i)?.src} alt={editorialTitle(b,i)} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" style={{objectFit:cardImage(b,i)?.imageFit||"cover",objectPosition:cardImage(b,i)?.imagePosition||"center"}}/></div><div className="p-5 text-left sm:p-6"><span className="mb-3 block text-left text-xs font-bold tracking-[.2em] text-[#607787]">{String(i+1).padStart(2,"0")}</span><div className="text-left [&_p]:!text-left [&_p]:!text-[1rem] [&_p]:!leading-relaxed">{render(b)}</div></div></article> : <div key={b.id} data-block-id={b.id} className="pn-editorial-text-card min-w-0 rounded border border-[#e5eaf0] bg-white px-5 py-5 sm:px-6 sm:py-6" style={{display:"flex",flexDirection:"column",justifyContent:"flex-start",alignSelf:"start",height:"auto",minHeight:0,gap:"12px"}}><span className="block text-left text-xs font-bold leading-5 tracking-[.2em] text-[#607787]" style={{position:"static",margin:0}}>{String(i+1).padStart(2,"0")}</span><div className="min-w-0 text-left [&_p]:!m-0 [&_p]:!text-left [&_p]:!text-[1rem] [&_p]:!leading-relaxed">{render(b)}</div></div>;
          const imageNode=(b:Block,i:number)=><div key={b.id} className={i===0?"overflow-hidden rounded-[1.75rem]":"overflow-hidden rounded-2xl"}>{b.src?render(b):<div data-block-id={b.id} className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-[#c5cbbf] bg-[#f1f1e9] text-center text-sm text-[#52615a]">{b.text||"Adicionar imagem"}</div>}</div>;
          if(isGallery&&galleryImages.length===0&&textItems.length===0&&buttons.length===0)return null;
          return <section id={isContact?"contato":group.id} key={group.id+"-"+index} data-section-id={group.id} data-pn-section-kind={isContact?"contact":isTestimonials?"testimonials":isProcess?"process":isGallery?"gallery":"content"} style={{backgroundColor:sectionBackground,...(adaptiveTemplate?{["--pn-surface" as string]:sectionTheme.surface,["--pn-ink" as string]:sectionTheme.ink,["--pn-muted" as string]:sectionTheme.muted,["--pn-card-ink" as string]:sectionTheme.cardInk,["--pn-card-muted" as string]:sectionTheme.cardMuted}:{}),...(immersivePhoto?{backgroundImage:`linear-gradient(90deg,rgba(9,19,28,.90),rgba(9,19,28,.54)),url("${immersivePhoto.replace(/"/g,"%22")}")`,backgroundSize:"cover",backgroundPosition:"center"}:{})}} className={`pn-institutional-section scroll-mt-20 overflow-hidden ${immersiveHero?"pn-immersive-hero":""} ${multiHero?"pn-carousel-hero":""} ${site.cinematic?.mode==="cinematic"?(index===0?"pn-cine-hero":isAboutEditorial?"pn-cine-about":isDifferentials?"pn-cine-differentials":isProcess?"pn-cine-process":isGallery?"pn-cine-gallery":isTreatments?"pn-cine-services":""):""} ${templateId==="minimalist-sophisticated"?"px-5 py-8 sm:px-8 sm:py-12 md:px-14 md:py-14":"px-5 py-10 sm:px-8 sm:py-14 md:px-14 md:py-16"}`}>
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
                    <div className={adaptiveTemplate?"mx-auto w-full max-w-3xl space-y-4 [&_p]:mx-auto":"mx-auto max-w-2xl space-y-4 text-center [&_p]:!mx-auto [&_p]:!text-center"}>{textItems.slice(0,3).map(render)}</div>
                    {(!adaptiveTemplate||!/planos|pre[cç]os|pricing/i.test(id))&&buttons.length>0&&<div className={"flex flex-wrap items-start gap-3 "+(buttons[0]?.align==="right"?"justify-end":"justify-center")}>{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div>}
                  </>}
                />:
              immersiveHero?
                <div className={adaptiveTemplate?"relative z-10 mx-auto flex min-h-[450px] w-full max-w-5xl flex-col items-center justify-center gap-5 py-6 text-center sm:min-h-[520px] sm:gap-7 lg:min-h-[590px] lg:py-14":"relative z-10 mx-auto flex min-h-[450px] w-full max-w-4xl flex-col items-center justify-center gap-5 py-6 text-center sm:min-h-[520px] sm:gap-7 lg:min-h-[590px] lg:py-14"}>
                  {headingNode}
                  <div className={adaptiveTemplate?"max-w-2xl space-y-4":"mx-auto max-w-2xl space-y-4 text-center [&_p]:!mx-auto [&_p]:!text-center"}>{textItems.slice(0,3).map(render)}</div>
                  {(!adaptiveTemplate||!/planos|pre[cç]os|pricing/i.test(id))&&buttons.length>0&&<div className={`flex flex-wrap items-start gap-3 ${adaptiveTemplate?"justify-center":buttons[0]?.align==="right"?"justify-end":"justify-center"}`}>{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div>}
                </div>:
              site.cinematic?.mode==="cinematic" && isAboutEditorial && index>0?
                <div className="pn-cinema-about mx-auto w-full max-w-6xl py-5 md:py-12">
                  <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)] lg:gap-14">
                    <div className="min-w-0 space-y-6 lg:pr-4">
                      <span className="pn-cinema-about-kicker inline-flex items-center gap-3 font-bold uppercase text-[#f6e4c7]"><span className="h-px w-9 bg-current"/> {String(cinematicNumber(index)).padStart(2,"0")} / NOSSA HISTÓRIA</span>
                      <div className="pn-cinema-about-title [&_h2]:!text-left [&_h2]:!font-semibold [&_h2]:!tracking-tight [&_h2]:!leading-[1.12] [&_h2]:!text-[clamp(1.85rem,3.3vw,3.3rem)]">{headingNode}</div>
                      <div className="pn-cinema-about-copy max-w-[54ch] space-y-4">{textItems.slice(0,2).map(render)}</div>
                      {buttons.length>0&&<div className="flex flex-wrap gap-3 pt-2">{buttons.map(render)}</div>}
                    </div>
                    <div className="pn-cinema-about-media relative min-w-0 overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#171513] shadow-[0_30px_80px_rgba(0,0,0,.3)]">
                      <div className="aspect-[5/4] max-h-[470px] w-full overflow-hidden [&_img]:!h-full [&_img]:!w-full [&_img]:!object-cover [&_picture]:!block [&_picture]:!h-full">{uniqueImages.slice(0,1).map(imageNode)}</div>
                      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"/>
                      <span className="pointer-events-none absolute bottom-5 left-5 rounded-full border border-white/30 bg-black/55 px-4 py-2 text-[.65rem] font-semibold uppercase tracking-[.2em] text-white backdrop-blur-md">NOSSA ESSÊNCIA</span>
                    </div>
                  </div>
                </div>:
              featureProcessCard?
                <div className="mx-auto w-full max-w-6xl">
                  {headingNode}
                  <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {textItems.map((item,i)=>{
                      const card=cardText(item);
                      const photo=processCardPhotos[i];
                      return <article key={item.id} data-block-id={item.id} style={{...(item.radius?{borderRadius:`${item.radius}px`}:{}),...(item.cardBorderWidth!==undefined?{borderWidth:`${item.cardBorderWidth}px`,borderStyle:"solid" as const,borderColor:item.cardBorderColor||"#E5E7EB"}:{}),...(item.cardShadow?{boxShadow:item.cardShadow}:{})}} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#dce7df] border-l-[5px] border-l-[#527566] bg-white shadow-[0_8px_24px_rgba(20,35,29,.04)]">
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
                    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#dce7df] border-l-[5px] border-l-[#527566] bg-white shadow-[0_8px_24px_rgba(20,35,29,.04)]">
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
              templateId==="minimalist-sophisticated"&&!isTestimonials&&!isContact&&visualLayout!=="faq"&&!/faq|perguntas.frequentes/i.test(id)?<div className="pn-editorial-layout mx-auto max-w-[1320px]">
                {index===0?<div className="grid items-center gap-7 py-5 lg:min-h-[560px] lg:grid-cols-[1.1fr_.9fr] lg:gap-16 lg:py-12"><div className="order-2 min-w-0 space-y-6 lg:order-1"><span className="block text-xs font-semibold uppercase tracking-[.35em] opacity-60">EM DESTAQUE / {String(index+1).padStart(2,"0")}</span>{headingNode}<div className="max-w-lg space-y-5">{textItems.slice(0,2).map(render)}</div><div className="flex flex-wrap gap-3">{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div></div><div className="order-1 min-h-0 lg:order-2 lg:min-h-[500px] [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{sectionImages.slice(0,1).map(imageNode)}</div></div>:
                isAboutEditorial?<div className="pn-editorial-about mx-auto max-w-6xl py-10 lg:py-16"><div className="mx-auto mb-12 max-w-4xl text-center">{headingNode}</div><div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,.96fr)] lg:gap-10"><div className="relative min-h-[280px] overflow-hidden rounded-3xl bg-[#e6eee8] shadow-[0_24px_60px_rgba(22,47,35,.12)] lg:sticky lg:top-28 lg:h-[min(640px,78vh)] [&_img]:!h-full [&_img]:!w-full [&_img]:!object-cover">{uniqueImages.slice(0,1).map(imageNode)}</div><div className="flex min-w-0 flex-col justify-center gap-4">{editorialCardsForDisplay.slice(0,3).map((item,i)=><article key={item.id} data-block-id={item.id} className="group rounded-2xl border border-[#dce6df] bg-white p-6 shadow-[0_14px_36px_rgba(25,55,40,.07)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(25,55,40,.13)] lg:p-7"><div className="mb-3 text-xs font-bold tracking-[.2em] text-[#397356]">NOSSA ESSÊNCIA · {String(i+1).padStart(2,"0")}</div><div className="text-base leading-relaxed text-[#344b3c]">{render(item)}</div></article>)}</div></div><div className="mt-9 flex justify-center gap-3">{buttons.map(render)}</div></div>:
                (isTreatments||isDifferentials||isProcess)?<div className="pn-editorial-premium mx-auto max-w-6xl py-8 lg:py-12">
                  <div className="mx-auto mb-12 max-w-4xl text-center">{headingNode}</div>
                  <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {editorialCardsForDisplay.slice(0,4).map((item,i)=>{
                      const card=cardText(item);
                      const photo=uniqueImages[i];
                      return <article key={item.id} data-block-id={item.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#dce5de] bg-white shadow-[0_16px_40px_rgba(25,55,40,.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(25,55,40,.14)]">
                        {photo&&isProcess?<div className="aspect-[4/3] overflow-hidden">{imageNode(photo,i)}</div>:<div className="flex items-center justify-between px-6 pt-7"><span className="text-3xl font-semibold tracking-tight text-[#3d7158]">{String(i+1).padStart(2,"0")}</span><span className="h-px w-12 bg-[#a6c8b4]"/></div>}
                        <div className="flex flex-1 flex-col gap-4 px-6 py-7"><h3 className="text-lg font-bold leading-snug text-[#1d3529]">{card.name||editorialTitle(item,i)}</h3><p className="text-base leading-relaxed text-[#46564d]">{editorialDescription(item)}</p></div>
                      </article>;
                    })}
                  </div>
                  <div className="mt-9 flex flex-wrap justify-center gap-4">{buttons.map(render)}</div>
                </div>:
                isGallery?<div className="space-y-10"><div className="mx-auto max-w-4xl text-center">{headingNode}</div>{galleryImages.length>0?<div className="grid gap-5 sm:grid-cols-2">{galleryImages.slice(0,6).map((b,i)=><div key={b.id} className="min-w-0 overflow-hidden rounded-3xl shadow-[0_18px_45px_rgba(20,40,29,.12)]">{imageNode(b,i)}</div>)}</div>:<div className="rounded-2xl border border-dashed border-[#b7c8bd] p-8 text-center text-[#425b4b]">Adicione imagens para compor esta galeria.</div>}</div>:
                <div className="grid gap-8 py-4 lg:grid-cols-2 lg:gap-12 lg:py-12"><div className="lg:sticky lg:top-28 lg:self-start"><span className="mb-5 block text-xs font-semibold uppercase tracking-[.3em] opacity-55">{String(index+1).padStart(2,"0")} / {group.id.replace(/[-_]/g," ")}</span>{headingNode}</div><div className="space-y-6">{editorialCardsForDisplay.length>0?(isProcess?<ol className="relative space-y-0 border-l border-[#cad4cf] pl-7">{editorialCardsForDisplay.slice(0,8).map((b,i)=><li key={b.id} data-block-id={b.id} className="relative border-b border-[#e1e6e2] py-6 first:pt-0 last:border-b-0"><span aria-hidden="true" className="absolute -left-[35px] top-7 flex h-4 w-4 items-center justify-center rounded-full border-[3px] border-white bg-[#527566] first:top-1"/><span className="mb-2 block text-xs font-semibold tracking-[.2em] text-[#607787]">ETAPA {String(i+1).padStart(2,"0")}</span><div className="[&_p]:!text-left [&_p]:!leading-relaxed">{render(b)}</div></li>)}</ol>:isDifferentials?<div className="divide-y divide-[#dfe5e0]">{editorialCardsForDisplay.slice(0,8).map((b,i)=><article key={b.id} data-block-id={b.id} className="grid gap-3 py-6 first:pt-0 sm:grid-cols-[48px_1fr] sm:gap-5"><span className="text-lg font-semibold text-[#729284]">{String(i+1).padStart(2,"0")}</span><div className="[&_p]:!text-left [&_p]:!leading-relaxed">{render(b)}</div></article>)}</div>:isTreatments?<div className="divide-y divide-[#dfe5e0]">{editorialCardsForDisplay.slice(0,8).map((b,i)=><article key={b.id} data-block-id={b.id} className="flex gap-5 py-6 first:pt-0"><span className="shrink-0 pt-1 text-xs font-semibold tracking-[.15em] text-[#729284]">{String(i+1).padStart(2,"0")}</span><div className="[&_p]:!text-left [&_p]:!leading-relaxed">{render(b)}</div></article>)}</div>:<div className="grid gap-3 sm:grid-cols-2">{editorialCardsForDisplay.slice(0,8).map(editorialPhotoCard)}</div>):editorialVisuals.length>0?<div className="grid gap-4 sm:grid-cols-2">{editorialVisuals.slice(0,4).map(imageNode)}</div>:null}<div className="flex flex-wrap gap-3">{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div></div></div>}
              </div>:
              isGallery?<>{headingNode}<div className="grid grid-cols-2 gap-3 md:hidden">{sectionImages.slice(0,6).map((b,i)=><div key={b.id} className={i===0?"col-span-2":""}>{imageNode(b,i)}</div>)}</div><div className="hidden md:grid md:grid-cols-2 md:gap-6">{sectionImages.slice(0,6).map((b,i)=><div key={b.id} className={site.cinematic?.mode==="cinematic"?"pn-cinematic-gallery-card grid min-w-0 items-center gap-4 overflow-hidden rounded-2xl border border-[#c6a77b] bg-[#121110] p-4 lg:gap-5":adaptiveTemplate?"grid min-w-0 items-center gap-4 overflow-hidden rounded-2xl border-0 bg-[var(--pn-surface)] p-3 lg:gap-5":"grid min-w-0 items-center gap-4 rounded-2xl border border-[#dce7df] bg-white/70 p-4 lg:gap-5"}><div className="">{imageNode(b,i)}</div><div className="min-w-0"><h3 className={site.cinematic?.mode==="cinematic"?"mb-2 text-lg font-semibold leading-snug text-white":adaptiveTemplate?"mb-2 text-lg font-semibold leading-snug text-[var(--pn-card-ink)]":"mb-2 text-lg font-semibold leading-snug text-[#24332e]"}>{textItems[i]&&cardText(textItems[i]).name&&!/^(nossa atuação|conheça mais|saiba mais)$/i.test(cardText(textItems[i]).name)?cardText(textItems[i]).name:["Nosso espaço","Atendimento próximo","Cuidado em cada detalhe","Nossa equipe","Experiência e acolhimento","Conheça nosso trabalho"][i]}</h3><p className={site.cinematic?.mode==="cinematic"?"text-sm leading-relaxed text-white/90":adaptiveTemplate?"text-sm leading-relaxed text-[var(--pn-card-muted)]":"text-sm leading-relaxed text-[#52615a]"}>{textItems[i]&&!/^(conheça mais sobre nosso trabalho|conheça nossa abordagem|nossa atuação)/i.test(cardText(textItems[i]).description)?cardText(textItems[i]).description:["Conheça os ambientes e os detalhes do nosso trabalho.","Uma experiência pensada para atender você com atenção.","Cada detalhe faz parte da nossa forma de trabalhar.","Pessoas e processos dedicados a um atendimento cuidadoso.","Compromisso com qualidade em cada etapa.","Descubra como podemos ajudar você."][i]}</p></div></div>)}</div></>:
              isTestimonials?<>{headingNode}{site.cinematic?.mode==="cinematic"?<div className="pn-cinema-editorial-testimonials mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 md:grid-cols-2">{cinematicTestimonials.map((item,i)=>{const t=testimonialInfo(item);return <article key={item.id} data-block-id={item.id} className="flex min-h-[230px] flex-col justify-between rounded-xl border border-[#d8b77e]/55 bg-[#11100e]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,.32)] md:p-8"><div><span aria-hidden="true" className="font-serif text-5xl leading-none text-[#d8b77e]">“</span><p className="mt-2 break-words font-serif text-[clamp(1.1rem,1.55vw,1.45rem)] leading-[1.65] text-[#f0e5d6]">{t.message.replace(/^depoimento ilustrativo:\s*/i,"")}</p></div><div className="mt-7 flex items-center gap-3 border-t border-[#d8b77e]/30 pt-5">{t.photo?<img src={t.photo} alt={t.name||"Retrato ilustrativo"} loading="lazy" className="h-12 w-12 shrink-0 rounded-full border border-[#d8b77e]/50 object-cover"/>:<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d8b77e] font-bold text-[#11100e]">{(t.name||"C").slice(0,1).toUpperCase()}</span>}<div className="min-w-0"><p className="font-semibold text-[#f5ead9]">{t.name||`Relato ilustrativo ${String(i+1).padStart(2,"0")}`}</p><p className="text-xs text-[#d0b993]">{t.city||"Depoimento demonstrativo"}</p></div><span className="ml-auto shrink-0 text-sm tracking-wide text-[#d8b77e]" aria-label="Cinco estrelas">★★★★★</span></div></article>})}</div>:adaptiveTemplate?<div className="pn-adaptive-testimonials grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">{testimonials.map(item=>{const t=testimonialInfo(item);const message=t.message.replace(/^depoimento ilustrativo:\s*/i,"").replace(/^(?:[^|]{2,65}\s*\|\s*){1,2}/,"").replace(/^["“]|["”]$/g,"");return <blockquote key={item.id} data-block-id={item.id} className="min-w-0 w-full rounded-2xl bg-[var(--pn-surface)] px-6 py-8 text-left shadow-lg md:min-w-0 md:max-w-none"><span aria-hidden="true" className="mb-5 block text-4xl leading-none" style={{color:adaptiveColor}}>“</span><p className="break-words text-base leading-7 text-[var(--pn-card-ink)]">{message}</p><footer className="mt-6 border-t border-[#38383d] pt-4 text-xs font-semibold uppercase tracking-wider text-[var(--pn-card-muted)]">Relato ilustrativo</footer></blockquote>})}</div>:!adaptiveTemplate?<div className="pn-static-testimonials mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">{testimonials.map((item,i)=>{const t=testimonialInfo(item);return <article key={item.id} data-block-id={item.id} className="group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[22px] border border-[#dbe7df] border-t-[4px] border-t-[#527566] bg-white p-7 text-left shadow-[0_10px_32px_rgba(24,47,37,.045)] transition-[border-color,box-shadow] duration-300 hover:border-[#9bb7a5] hover:shadow-[0_16px_40px_rgba(24,47,37,.09)] sm:p-8"><div><div className="mb-5 flex items-center justify-between gap-4"><span className="text-[11px] font-bold uppercase tracking-[.23em] text-[#799184]">Experiência {String(i+1).padStart(2,"0")}</span><span aria-hidden="true" className="font-serif text-5xl leading-[.6] text-[#b9c9bc]">“</span></div><p className="break-words font-serif text-[clamp(1.08rem,1.5vw,1.35rem)] leading-[1.6] text-[#263b32]">“{t.message}”</p></div><div className="mt-8 flex items-center gap-3 border-t border-[#e3e9e2] pt-5">{t.photo?<img src={t.photo} alt={t.name||"Cliente"} loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover"/>:<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e6eee7] text-sm font-bold text-[#315542]">{(t.name||"C").slice(0,1).toUpperCase()}</span>}<div className="min-w-0"><p className="text-sm font-bold text-[#244433]">{t.name||"Cliente"}</p>{t.city&&<p className="text-xs text-[#75877b]">{t.city}</p>}</div><span className="ml-auto text-xs tracking-[.12em] text-[#648b77]" aria-label="Cinco estrelas">★★★★★</span></div></article>})}{testimonials.length===3&&<article className="group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[22px] border border-[#dbe7df] border-t-[4px] border-t-[#527566] bg-white p-7 text-left shadow-[0_10px_32px_rgba(24,47,37,.045)] sm:p-8"><div><div className="mb-5 flex items-center justify-between gap-4"><span className="text-[11px] font-bold uppercase tracking-[.23em] text-[#799184]">Experiência 04 · exemplo</span><span aria-hidden="true" className="font-serif text-5xl leading-[.6] text-[#b9c9bc]">“</span></div><p className="break-words font-serif text-[clamp(1.08rem,1.5vw,1.35rem)] leading-[1.6] text-[#263b32]">“Encontrei um espaço acolhedor, onde pude conversar com tranquilidade e compreender melhor meus sentimentos.”</p></div><div className="mt-8 flex items-center gap-3 border-t border-[#e3e9e2] pt-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e6eee7] text-sm font-bold text-[#315542]">E</span><div className="min-w-0"><p className="text-sm font-bold text-[#244433]">Cliente ilustrativo</p><p className="text-xs text-[#75877b]">Localização não informada · substitua pelo chat</p></div><span className="ml-auto text-xs tracking-[.12em] text-[#648b77]" aria-label="Cinco estrelas">★★★★★</span></div></article>}</div>:templateId==="minimalist-sophisticated"?<div className="grid gap-4 sm:grid-cols-2">{testimonials.map(item=>{const t=testimonialInfo(item);return <article key={item.id} data-block-id={item.id} className="min-w-0 rounded-xl border border-[#e5e8e4] bg-white p-5 sm:p-7"><p className="break-words text-base leading-relaxed text-[#33453d]">“{t.message}”</p><p className="mt-5 font-semibold text-[#183b2b]">{t.name||"Paciente"}</p>{t.city&&<p className="text-sm text-[#68776e]">{t.city}</p>}</article>})}</div>:<div className="pn-static-testimonials mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{testimonials.map((item,i)=>{const t=testimonialInfo(item);return <article key={item.id} data-block-id={item.id} className="group relative flex min-w-0 flex-col overflow-hidden rounded-[26px] border border-[#d8e4dc] bg-white p-7 shadow-[0_12px_35px_rgba(18,51,37,.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(18,51,37,.11)]"><div className="mb-6 flex items-start justify-between gap-4"><span aria-hidden="true" className="font-serif text-6xl leading-[.7] text-[#8cae98]">“</span><span className="rounded-full bg-[#eaf2ec] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.14em] text-[#3e654e]">Relato {String(i+1).padStart(2,"0")}</span></div><blockquote className="mb-8 flex-1 break-words text-[17px] leading-[1.75] text-[#2a4437]">{t.message.replace(/^[“"]|[”"]$/g,"")}</blockquote><div className="flex items-center gap-3 border-t border-[#e4ece6] pt-5">{t.photo?<img src={t.photo} alt={t.name||"Cliente"} loading="lazy" className="h-12 w-12 shrink-0 rounded-full object-cover"/>:<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dcebe0] text-lg font-bold text-[#315840]">{(t.name||"C").slice(0,1).toUpperCase()}</div>}<div className="min-w-0"><p className="truncate text-sm font-bold text-[#1d4430]">{t.name||"Cliente"}</p>{t.city&&<p className="truncate text-xs text-[#6c8374]">{t.city}</p>}</div><span className="ml-auto shrink-0 text-xs tracking-[.06em] text-[#b28c45]" aria-label="Cinco estrelas">★★★★★</span></div></article>})}</div>}</>:
              (visualLayout==="faq"||/faq|perguntas.frequentes/i.test(id))?<>{site.cinematic?.mode==="cinematic"&&!!site.extras?.address?.trim()&&<div className="pn-cinema-map mx-auto mb-16 w-full max-w-6xl"><div className="mb-9 text-center"><div className="pn-cinema-section-eyebrow flex items-center justify-center gap-3 uppercase text-[#f6e4c7]"><span className="h-px w-8 bg-current"/> {String(cinematicMapNumber(index)).padStart(2,"0")} / ONDE ESTAMOS <span className="h-px w-8 bg-current"/></div><p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#e8d9c4] md:text-lg">Venha nos visitar. Confira nossa localização no mapa, veja o endereço completo e encontre o melhor caminho para chegar até nós.</p></div><div className="overflow-hidden rounded-[1.5rem] border border-[#c6a77b]/60 bg-[#171513] p-2 shadow-[0_25px_70px_rgba(0,0,0,.4)]"><iframe title="Mapa de localização" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-[290px] w-full rounded-[1.1rem] border-0 md:h-[410px]" src={"https://www.google.com/maps?q="+encodeURIComponent(site.extras?.address||"")+"&output=embed"}/></div><div className="mx-auto mt-5 flex max-w-3xl flex-col items-center gap-3 rounded-2xl border border-[#c6a77b]/50 bg-[#171513]/85 px-5 py-6 text-center shadow-[0_15px_45px_rgba(0,0,0,.3)] backdrop-blur-sm"><span className="text-xs font-semibold uppercase tracking-[.22em] text-[#dbc19b]">ENDEREÇO</span><address className="text-base not-italic leading-relaxed text-[#f1e6d4] md:text-lg">{site.extras?.address||""}</address><a className="mt-2 rounded-full border border-[#dbc19b] px-5 py-2 text-sm font-semibold text-[#f6e4c7] transition hover:bg-[#dbc19b] hover:text-[#171513]" href={"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(site.extras?.address||"")} target="_blank" rel="noopener noreferrer">Abrir rota no Google Maps ↗</a></div></div>}{headingNode}<div className={`pn-cinema-faq mx-auto max-w-3xl space-y-3 ${site.cinematic?.mode==="cinematic"?"pn-cinema-faq-premium":""}`}>{textItems.map(b=>{const at=b.text.indexOf("?");return <details key={b.id} className="group rounded-xl border border-[#e9e4da] bg-white px-5 py-4 text-[#24332e]"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold leading-snug [&::-webkit-details-marker]:hidden"><span className="min-w-0 flex-1">{at>=0?b.text.slice(0,at+1):b.text}</span><span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center text-xl leading-none group-open:rotate-45">+</span></summary>{at>=0&&(b.text.slice(at+1).trim()||site.cinematic?.mode==="cinematic")&&<div className="mt-3 border-t border-[#eee9e0] pt-3 text-sm leading-relaxed text-[#354c40]">{b.text.slice(at+1).trim()||(site.cinematic?.mode==="cinematic"?cinematicFaqAnswer(b.text):"")}</div>}</details>})}</div></>:
              (visualLayout==="hero"||visualLayout==="split")&&!isPrinciples?<div className={sectionImages.length?"grid min-w-0 items-center gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-12":"mx-auto max-w-3xl"}>
                <div className={isHumanizedApproach?"min-w-0 space-y-5 rounded-[26px] border border-[#dce7df] bg-white p-6 shadow-[0_12px_35px_rgba(24,47,37,.05)] sm:p-9 [&_p]:border-l-[3px] [&_p]:border-[#9bb7a5] [&_p]:pl-5 [&_p]:leading-[1.85] [&_p]:text-[#355547]":"min-w-0 space-y-5"}>{blocks.filter(b=>b.type==="heading"||b.type==="button"||(b.type==="paragraph"&&textItems.slice(0,visualLayout==="hero"?1:3).some(item=>item.id===b.id))).map(render)}</div>
                {sectionImages.length>0&&<div className={"relative min-w-0 [&_img]:w-full "+(sectionImages.length>1&&sectionImages.some(b=>b.userUploaded)?"grid grid-cols-2 gap-3":"")}>{sectionImages.slice(0,sectionImages.some(b=>b.userUploaded)?6:1).map(imageNode)}</div>}
              </div>:
              useEditorialGrid?<div className="space-y-8 md:space-y-12">
                <div className="flex flex-col gap-4">{headingNode}</div>
                {(!adaptiveTemplate&&(isTreatments||isDifferentials))?<div className={`grid items-stretch gap-4 ${isTreatments&&editorialCards[0]?.columns===1?"md:grid-cols-1":isTreatments&&editorialCards[0]?.columns===3?"md:grid-cols-3":isTreatments&&editorialCards[0]?.columns===4?"md:grid-cols-4":"md:grid-cols-2"}`}>{editorialCards.slice(0,isTreatments?undefined:4).map((item,i)=>{const card=cardText(item);const photo=cardImage(item,i);return <article key={item.id} data-block-id={item.id} style={{backgroundColor:"#ffffff",backgroundImage:"none",boxShadow:"0 8px 26px rgba(24,47,37,.055)",...(item.radius?{borderRadius:`${item.radius}px`}:{}),...(item.cardBorderWidth!==undefined?{borderWidth:`${item.cardBorderWidth}px`,borderStyle:"solid" as const,borderColor:item.cardBorderColor||"#E5E7EB"}:{})}} className={`pn-premium-info-card group relative flex h-full flex-col overflow-hidden rounded-[22px] border bg-white shadow-none transition-colors duration-300 ${isDifferentials?"pn-premium-differential border-[#dce5dd]":"pn-premium-service border-[#dce7df]"}`}>{photo&&<div className="pn-cinema-service-image aspect-[16/10] overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{render(photo)}</div>}<div className={`flex h-full flex-col space-y-3 p-6 md:p-8 ${isDifferentials?"md:py-9":""}`}><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold uppercase tracking-[.25em] text-[#718066]">{isTreatments?"Serviço":"Diferencial"} {String(i+1).padStart(2,"0")}</span>{isDifferentials?<span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dce7df] bg-[#f0f5f0] text-[#365b46]">✦</span>:<span aria-hidden="true" className="h-1 w-9 rounded-full bg-[#91ad95] transition-all duration-300 group-hover:w-14"/>}</div><h3 style={item.fontFamily?{fontFamily:item.fontFamily}:undefined} className={`text-[clamp(1.35rem,1.9vw,1.85rem)] leading-[1.2] text-[#24332e] ${isDifferentials?"font-semibold":"font-serif"}`}>{editorialTitle(item,i)}</h3><p className="max-w-[55ch] text-[15px] leading-[1.75] text-[#4d5652]">{card.description}</p>{/planos|pre[cç]os|pricing/i.test(id)&&(buttons[i]||adaptiveTemplate)&&<div className="mt-5">{buttons[i]?render(buttons[i]):<a href="#contato" className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold">Quero este plano</a>}</div>}</div></article>})}</div>:<div className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">{!useTextOnlyTreatments&&uniqueImages[0]&&<div className="relative overflow-hidden rounded-[2rem] shadow-[22px_24px_0_-8px_rgba(113,128,102,.15)] [&_img]:aspect-[4/5] [&_img]:w-full [&_img]:object-cover">{render(uniqueImages[0])}</div>}<div className="divide-y divide-[#8a907e]/25">{editorialCards.slice(0,isTreatments?undefined:5).map((item,i)=>{const card=cardText(item);return <div key={item.id} data-block-id={item.id} className="grid grid-cols-[2.5rem_1fr] gap-4 py-5 first:pt-0"><span className="pt-1 text-xs font-semibold tracking-widest text-[#778567]">{String(i+1).padStart(2,"0")}</span><div><h3 style={item.fontFamily?{fontFamily:item.fontFamily}:undefined} className="font-serif text-[clamp(1.4rem,2vw,2rem)] leading-snug text-[#24332e]">{editorialTitle(item,i)}</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></div>})}</div></div>}
                {(!adaptiveTemplate||!/planos|pre[cç]os|pricing/i.test(id))&&buttons.length>0&&<div className="flex flex-wrap gap-3">{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div>}
              </div>:
              adaptiveTemplate&&isProcess?<div data-pn-composition="process" className={`mx-auto w-full max-w-6xl ${site.cinematic?.mode==="cinematic"?"pn-cinema-process-timeline":""}`}>{headingNode}<div className="grid gap-5 md:grid-cols-2">{textItems.filter(item=>item.type==="paragraph"&&item.text.trim().length>5).map((item,i)=>{const card=cardText(item);const photo=processCardPhotos[i];const numberedOnly=/^(?:etapa|passo)?\s*0?\d{1,2}$/i.test(card.name.trim());const processParts=numberedOnly?card.description.split(/\s+[—–:]\s+/,2):[];const title=numberedOnly?(processParts[0]||"Etapa").trim():(card.name||card.description.split(/[.!?]/)[0]).replace(/^\s*(?:etapa|passo)?\s*0?\d{1,2}\s*[:—–.-]?\s*/i,"").trim();const description=numberedOnly&&processParts.length>1?card.description.slice(processParts[0].length).replace(/^\s*[—–:]\s*/,"").trim():card.description.trim();return <article key={item.id} data-block-id={item.id} style={{...(item.radius!==undefined?{borderRadius:item.radius}:{}),...(item.cardShadow?{boxShadow:item.cardShadow}:{}),...(item.background?{backgroundColor:item.background}:{}),...(item.cardBorderWidth!==undefined?{borderWidth:item.cardBorderWidth,borderColor:item.cardBorderColor}:{}),fontFamily:item.fontFamily}} className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-[#18191d] md:flex-row">{photo&&<div className="aspect-[16/10] w-full shrink-0 overflow-hidden md:aspect-auto md:w-[42%] [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{render(photo)}</div>}<div className="flex min-w-0 flex-1 flex-col justify-center p-6 md:p-7"><span className="mb-4 block text-3xl font-black tracking-tight" style={{color:adaptiveColor}}>{String(i+1).padStart(2,"0")}</span><h3 style={{color:item.colorExplicit?item.color:adaptivePalette(item.background||sectionTheme.surface,site.design).ink,textAlign:item.align,fontFamily:item.fontFamily}} className="text-xl font-bold leading-tight text-white">{title||"Etapa "+String(i+1).padStart(2,"0")}</h3>{description&&description!==title&&<p className="mt-3 text-sm leading-6 text-[#cbd0d4]">{description}</p>}</div></article>})}</div></div>:
              adaptiveModalities?<div data-pn-composition="modalities" className="mx-auto max-w-6xl">{headingNode}<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{textItems.filter(item=>item.type==="paragraph"&&item.text.trim().length>5).map((item,i)=>{const card=cardText(item);return <article key={item.id} data-block-id={item.id} style={{...(item.radius!==undefined?{borderRadius:item.radius}:{}),...(item.cardShadow?{boxShadow:item.cardShadow}:{}),...(item.background?{backgroundColor:item.background}:{}),...(item.cardBorderWidth!==undefined?{borderWidth:item.cardBorderWidth,borderColor:item.cardBorderColor}:{}),fontFamily:item.fontFamily}} className="min-w-0 rounded-xl border-0 bg-[#181818] p-4 shadow-none md:p-6"><div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border text-xl font-bold" style={{borderColor:adaptiveColor,color:adaptiveColor}}>{["◆","↗","◉","✦"][i%4]}</div><h3 style={{color:item.colorExplicit?item.color:adaptivePalette(item.background||sectionTheme.surface,site.design).ink,textAlign:item.align,fontFamily:item.fontFamily}} className="text-base font-bold text-white md:text-xl">{card.name||card.description.split(/[,.]/)[0]}</h3>{card.description&&<p className="mt-2 text-xs leading-5 text-[#c9cbd0] md:text-sm md:leading-6">{card.description}</p>}</article>})}</div></div>:
              (adaptiveTeam||adaptiveModalities||adaptiveServices||adaptiveDifferentials)?<div data-pn-composition={adaptiveServices?"services":adaptiveTeam?"team":adaptiveModalities?"modalities":"differentials"} className="mx-auto max-w-6xl">{headingNode}<div data-pn-columns={textItems.find(item=>item.columns)?.columns} style={{["--pn-card-columns" as string]:textItems.find(item=>item.columns)?.columns}} className={adaptiveTeam||adaptiveDifferentials?"grid gap-6 md:grid-cols-2":adaptiveServices?"pn-adaptive-services-grid grid gap-6 sm:grid-cols-2 xl:grid-cols-3":"grid gap-6 sm:grid-cols-2 lg:grid-cols-4"}>{textItems.filter(item=>item.type==="paragraph"&&item.text.trim().length>5).map((item,i)=>{const card=cardText(item);const photo=cardImage(item,i);return <article key={item.id} data-block-id={item.id} style={{...(item.radius!==undefined?{borderRadius:item.radius}:{}),...(item.cardShadow?{boxShadow:item.cardShadow}:{}),...(item.background?{backgroundColor:item.background}:{}),...(item.cardBorderWidth!==undefined?{borderWidth:item.cardBorderWidth,borderColor:item.cardBorderColor}:{}),fontFamily:item.fontFamily}} className={adaptiveTemplate?"group pn-premium-card flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#191b20] p-6 shadow-[0_16px_45px_rgba(0,0,0,.24)] transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_24px_60px_rgba(0,0,0,.36)] md:p-8":"group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-[#1b1d22]"}>{photo&&<div className={adaptiveTeam||adaptiveDifferentials?"h-24 w-24 shrink-0 overflow-hidden rounded-xl [&_img]:h-full [&_img]:w-full [&_img]:object-cover":"aspect-[16/10] overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover"}>{render(photo)}</div>}<div className={adaptiveTemplate?"flex min-w-0 flex-1 flex-col justify-start":"flex min-w-0 flex-1 flex-col justify-start p-6"}><span className="mb-3 block text-xs font-bold uppercase tracking-[.2em]" style={{color:adaptiveColor}}>{adaptiveTeam?"Especialidade":adaptiveServices?(site.cinematic?.mode==="cinematic"&&/hamb[uú]rg|burger|pizz|restaurante|sushi|japon[eê]s|churrasc|cafeteria|padaria|confeitaria|doceria|sorveteria|a[cç]a[ií]|marmitaria|pastelaria|esfiharia|bistr[oô]|gastronomi|food truck|massas|rotisseria|delivery/i.test([site.niche,site.title,selectedNiche].filter(Boolean).join(" "))?"DO NOSSO CARDÁPIO":"Serviço"):adaptiveDifferentials?"Diferencial":"Modalidade"} {String(i+1).padStart(2,"0")}</span><h3 style={{color:item.colorExplicit?item.color:adaptivePalette(item.background||sectionTheme.surface,site.design).ink,textAlign:item.align,fontFamily:item.fontFamily}} className="text-lg font-bold leading-snug text-white">{card.name||card.description.split(/[,.]/)[0]}</h3>{card.name&&card.description&&<p style={item.textColor?{color:item.textColor}:undefined} className="mt-2 text-sm leading-6 text-[#c9cbd0]">{site.cinematic?.mode==="cinematic"&&/hamb[uú]rg|burger|pizz|restaurante|sushi|japon[eê]s|churrasc|cafeteria|padaria|confeitaria|doceria|sorveteria|a[cç]a[ií]|marmitaria|pastelaria|esfiharia|bistr[oô]|gastronomi|food truck|massas|rotisseria|delivery/i.test([site.niche,site.title,selectedNiche].filter(Boolean).join(" "))?menuDescription(card.description):card.description}</p>}{site.cinematic?.mode==="cinematic"&&/hamb[uú]rg|burger|pizz|restaurante|sushi|japon[eê]s|churrasc|cafeteria|padaria|confeitaria|doceria|sorveteria|a[cç]a[ií]|marmitaria|pastelaria|esfiharia|bistr[oô]|gastronomi|food truck|massas|rotisseria|delivery/i.test([site.niche,site.title,selectedNiche].filter(Boolean).join(" "))&&/card[aá]pio|menu|pratos|hamb[uú]rgueres|pizzas|produtos/i.test(id+" "+heading.map(block=>block.text).join(" "))&&<div className="mt-auto pt-5"><div className="flex flex-wrap items-center justify-between gap-3">{menuPrice(item.text)&&<strong className="text-xl font-extrabold text-[#ffb07a]">{menuPrice(item.text)}</strong>}{normalizedSocialLink("whatsapp",site.footer?.whatsapp||site.restaurant?.whatsapp||"")?<a href={menuOrderUrl(card.name||card.description.split(/[,.]/)[0])||undefined} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#ed6138] px-5 py-2.5 text-sm font-bold text-white">Pedir pelo WhatsApp ↗</a>:<span className="rounded-full border border-[#ed6138]/60 px-4 py-2 text-xs font-semibold text-[#ffb07a]">Consulte disponibilidade</span>}</div></div>}</div></article>})}</div></div>:
              (visualLayout==="grid"||isProcess||isPrinciples)&&!isContact&&!adaptivePricing&&!(adaptiveTemplate&&(isProcess||adaptiveServices||adaptiveDifferentials||adaptiveTeam||adaptiveModalities))?<>{headingNode}<div className={`grid auto-rows-auto items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3`}>{uniqueVisualCards.map((item,i)=>{const card=cardText(item);const photo=isPrinciples?undefined:(isProcess?processCardPhotos[i]:cardImage(item,i));return <article key={item.id} className={`pn-process-card group h-fit self-start overflow-hidden border border-[#dce7df] bg-white shadow-[0_8px_30px_rgba(20,35,29,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-lg ${isProcess?"rounded-lg border-l-4 border-l-[#9c947b]":"rounded-2xl"}`}>{photo&&<div className="aspect-[16/10] overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:rounded-none [&_img]:object-cover">{render(photo)}</div>}<div className="p-5 md:p-7">{isProcess&&!/^\s*\d{1,2}\s*$/.test(card.name)&&<span className="mb-4 inline-flex rounded-lg bg-[#f5f0e4] px-3 py-2 text-xs font-semibold text-[#92773b]">{String(i+1).padStart(2,"0")}</span>}<h3 data-block-id={item.id} style={{color:templateId==="institutional-complete"?"#171c19":/^#[0-9a-fA-F]{6}$/.test(item.color||"")?item.color:"#24332e"}} className="mb-2 text-lg font-bold leading-snug">{card.name&&!/^destaque\s*\d+$/i.test(card.name)?card.name:(card.description.split(/[,.]/)[0].trim().split(" ").slice(0,5).join(" ")||"Nossa proposta")}</h3><p className="text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></article>})}</div>{buttons.length>0&&!/planos|pre[cç]os|pricing/i.test(id)&&<div className="mt-7 flex flex-wrap gap-3">{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div>}</>:
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
              isContact||visualLayout==="banner"?<div className={adaptiveTemplate&&isContact?"mx-auto max-w-5xl space-y-5 text-left":"max-w-3xl space-y-5 text-left"}>{headingNode}{textItems.filter(b=>!/\b(?:xx|xxx|rua principal|contato@clinic)/i.test(b.text)&&(!adaptiveTemplate||!isContact||/^(?:campo obrigatório|nome completo|e-?mail|telefone|mensagem|preencha os dados)/i.test(b.text.trim()))).slice(0,2).map(b=>isContact?render({...b,text:b.text.replace(/Use o formulário abaixo[^.]*\.?/gi,"Envie sua mensagem pelos canais de atendimento disponíveis.").replace(/formulário abaixo/gi,"canal de atendimento")}):render(b))}{(adaptiveTemplate&&(isContact||/planos|pre[cç]os|pricing/i.test(id))?[]:buttons).map(render)}{isContact&&site.cinematic?.mode==="cinematic"&&<div className="pn-cinema-contact-location mx-auto mt-9 w-full max-w-6xl overflow-hidden rounded-xl border border-[#d8b77e]/60 bg-[#11100e]/95 p-4 text-center shadow-2xl md:p-8"><p className="mb-5 text-xs font-bold uppercase tracking-[.24em] text-[#d8b77e]">ONDE ESTAMOS</p>{true?<><iframe title="Mapa de localização" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="mb-6 h-[300px] w-full rounded-lg border-0 md:h-[430px]" src={"https://www.google.com/maps?q="+encodeURIComponent((site.extras?.address?.trim()||"Avenida Paulista, 1578 - Bela Vista, São Paulo - SP"))+"&output=embed"}/><div className="mx-auto max-w-3xl"><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-[#d8b77e]">ENDEREÇO {site.extras?.address?.trim()?"":"· DEMONSTRATIVO"}</p><address className="mb-5 text-lg not-italic leading-relaxed text-[#f2e5d1]">{(site.extras?.address?.trim()||"Avenida Paulista, 1578 - Bela Vista, São Paulo - SP")}</address><a className="mb-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-[#d8b77e] px-6 py-3 font-semibold text-[#e9d3aa]" href={"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent((site.extras?.address?.trim()||"Avenida Paulista, 1578 - Bela Vista, São Paulo - SP"))} target="_blank" rel="noopener noreferrer">Como chegar ↗</a></div></>:<p className="mb-6 text-[#e9d3aa]">Informe o endereço pelo chat para exibir o mapa e a localização.</p>}<div className="mt-2 border-t border-[#d8b77e]/30 pt-6"><p className="mb-4 text-base text-[#f2e5d1]">Entre em contato e agende seu atendimento.</p>{normalizedSocialLink("whatsapp",site.footer?.whatsapp||"")?<a href={normalizedSocialLink("whatsapp",site.footer?.whatsapp||"")||undefined} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-lg bg-[#d8b77e] px-9 py-4 text-base font-bold text-[#17120d] shadow-lg transition hover:brightness-110">Falar pelo WhatsApp ↗</a>:<button type="button" title="WhatsApp demonstrativo: configure um número real pelo chat" onClick={()=>window.alert("WhatsApp demonstrativo. Configure o número real pelo chat para ativar o atendimento.")} className="inline-flex min-h-14 items-center justify-center rounded-lg bg-[#d8b77e] px-9 py-4 text-base font-bold text-[#17120d] shadow-lg">Falar pelo WhatsApp ↗</button>}</div></div>}{isContact&&site.cinematic?.mode!=="cinematic"&&<form onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);const subject=encodeURIComponent("Contato pelo site "+site.title);const body=encodeURIComponent("Nome: "+data.get("name")+"\nE-mail: "+data.get("email")+"\nTelefone: "+data.get("phone")+"\nMensagem: "+data.get("message"));if(site.footer?.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.footer.email)){window.location.href="mailto:"+site.footer.email+"?subject="+subject+"&body="+body;}else{window.location.href="mailto:?subject="+subject+"&body="+body;}}} className="mx-auto mt-6 grid w-full max-w-2xl gap-4 rounded-2xl border border-[#e2dfd5] bg-white p-5 text-left shadow-sm sm:p-8"><p className="text-sm text-[#46534b]">{site.footer?.email?"Preencha os campos para abrir sua mensagem no aplicativo de e-mail.":"Formulário de demonstração: configure um e-mail de destino para habilitar o envio."}</p><label className="grid gap-2 text-sm font-medium text-[#24332e]">Nome<input name="name" required maxLength={100} className="min-h-12 rounded-lg border border-[#d9ddd5] px-4 text-[#24332e]"/></label><label className="grid gap-2 text-sm font-medium text-[#24332e]">E-mail<input name="email" type="email" required maxLength={160} className="min-h-12 rounded-lg border border-[#d9ddd5] px-4 text-[#24332e]"/></label><label className="grid gap-2 text-sm font-medium text-[#24332e]">Telefone<input name="phone" type="tel" autoComplete="tel" required maxLength={30} className="min-h-12 rounded-lg border border-[#d9ddd5] px-4 text-[#24332e]"/></label><label className="grid gap-2 text-sm font-medium text-[#24332e]">Mensagem<textarea name="message" required maxLength={3000} rows={4} className="rounded-lg border border-[#d9ddd5] px-4 py-3 text-[#24332e]"/></label><button type="submit" disabled={!site.footer?.email} style={{backgroundColor:site.blocks.some(b=>b.type==="button"&&/^#(?:e50914|ff0000|dc0000)$/i.test(String(b.color)))?"#E50914":"#243e32"}} className="pn-cinema-form-submit min-h-12 rounded-xl px-6 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Preparar mensagem</button></form>}</div>:
              <div className={sectionImages.length?"grid min-w-0 items-center gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-12":"mx-auto max-w-3xl space-y-5"}><div className="space-y-5">{heading.map(render)}{textItems.slice(0,3).map(render)}{(adaptiveTemplate&&/planos|pre[cç]os|pricing/i.test(id)?[]:buttons).map(render)}</div>{sectionImages.slice(0,1).map(imageNode)}</div>}
            </div>
          </section>;
        })}{site.blocks.length>0&&<BuilderExtras extras={{...site.extras,enabled:{announcement:false,video:site.extras?.enabled?.video===true,comparison:site.extras?.enabled?.comparison===true,partners:site.extras?.enabled?.partners===true,pricing:site.extras?.enabled?.pricing===true,counters:site.extras?.enabled?.counters===true&&!visibleSections.some(g=>/n[uú]meros|indicadores|estat[ií]sticas|trajet[oó]ria/i.test(g.id+" "+g.blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" "))),faq:false,map:site.extras?.enabled?.map!==false&&!!site.extras?.address,popup:site.extras?.enabled?.popup!==false,backToTop:site.extras?.enabled?.backToTop!==false}}} />}{site.blocks.length>0&&<footer className="pn-builder-v2-footer px-6 py-10 text-[#f7f5ed] md:px-12 md:py-14 lg:px-16" style={{backgroundColor:adaptiveTemplate?(adaptivePalette(adaptiveColor).dark?adaptiveColor:"#24332e"):"#102a22"}}>
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
