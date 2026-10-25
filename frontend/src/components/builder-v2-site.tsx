"use client";
import { useEffect, useRef, useState } from "react";
import { BuilderExtras, type SiteExtras } from "@/components/builder-v2-extras";
import nichePhotoCatalog from "@/lib/niche-photo-catalog.json";
import { attachSiteMotion, type SiteMotion } from "@/lib/site-builder-animation";
import { SiteWhatsAppButton } from "@/components/site-whatsapp-button";
import "@/app/app/builder-v2/motion.css";
const SocialIcon=({name,size=20}:{name:"instagram"|"facebook"|"whatsapp"|"youtube";size?:number})=><svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{name==="instagram"?<><rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2"/></>:name==="facebook"?<path d="M13.5 22v-8.8h3l.5-3.7h-3.5V7.1c0-1.1.4-1.8 1.9-1.8h1.9V2.1c-.3 0-1.4-.1-2.7-.1-2.8 0-4.7 1.7-4.7 4.9v2.6H7v3.7h2.9V22h3.6z"/>:name==="youtube"?<path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/>:<path d="M12.04 2C6.52 2 2.03 6.49 2.03 12c0 1.76.46 3.48 1.33 5L2 22l5.14-1.35A9.97 9.97 0 0 0 12.04 22C17.56 22 22.05 17.51 22.05 12S17.56 2 12.04 2Zm0 18.3a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-3.14.82.84-3.06-.2-.32a8.3 8.3 0 1 1 7.03 3.9Zm4.56-6.21c-.25-.13-1.48-.73-1.71-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.26-1.49-1.41-1.74-.15-.25-.02-.39.11-.51.12-.11.25-.29.38-.44.12-.14.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.41-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09s.9 2.42 1.02 2.59c.13.17 1.77 2.7 4.28 3.78.6.26 1.07.42 1.43.53.6.19 1.15.16 1.59.1.49-.07 1.48-.61 1.69-1.2.21-.59.21-1.09.15-1.2-.06-.1-.23-.17-.48-.29Z"/>}</svg>;
function TestimonialCarousel({children,auto=true}:{children:React.ReactNode;auto?:boolean}){const items=Array.isArray(children)?children:[children];const animate=auto&&items.length>0;const copies=Math.max(2,Math.ceil(8/Math.max(1,items.length)));const groups=Array.from({length:copies},(_,i)=>i);return <div className="pn-testimonial-marquee relative overflow-hidden" aria-label="Depoimentos"><style>{`@keyframes pn-testimonials-flow{from{transform:translateX(0)}to{transform:translateX(calc(-100% / var(--pn-marquee-copies)))}}.pn-testimonial-marquee .pn-testimonial-track{display:flex;width:max-content;animation:pn-testimonials-flow var(--pn-marquee-duration) linear infinite;will-change:transform}@media(hover:hover) and (pointer:fine){.pn-testimonial-marquee:hover .pn-testimonial-track{animation-play-state:paused}}@media(prefers-reduced-motion:reduce){.pn-testimonial-marquee .pn-testimonial-track{animation:none!important}}`}</style><div className="pn-testimonial-track" style={{"--pn-marquee-copies":copies,"--pn-marquee-duration":`${Math.max(14,items.length*8)}s`,animationPlayState:animate?"running":"paused"} as React.CSSProperties}>{groups.map(i=><div key={i} aria-hidden={i>0?"true":undefined} className="flex shrink-0 gap-4 pr-4 [&>*]:w-[min(78vw,340px)] [&>*]:shrink-0 md:[&>*]:w-[360px]">{items}</div>)}</div></div>}
const nichePhotoBase="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/";

type Block = { id: string; type: "heading" | "paragraph" | "button" | "image"; text: string; color: string; align: "left" | "center" | "right"; src?: string; mobileSrc?: string; section?: string; fontSize?: number; radius?: number; cardBorderWidth?: number; cardBorderColor?: string; cardShadow?: string; spacing?: number; href?: string; layout?: "hero" | "grid" | "split" | "banner" | "faq" | "gallery" | "standard"; background?: string; columns?: number };
export type BuilderV2SiteData = { templateId?: "institutional-complete" | "minimalist-sophisticated" | "modern-impactful" | "image-text-alternating"; kind?: "institutional" | "restaurant" | "real-estate" | "catalog"; title: string; background: string; blocks: Block[]; id?: string; niche?: string; publishedUrl?: string; heroPresentation?: "immersive" | "split"; processImageCard?: boolean; processImageCardTitle?: string; processImageCardDescription?: string; motion?: SiteMotion; restaurant?: {whatsapp?:string;menu?:{id:string;name:string;description:string;price:number;category:string;image?:string}[]}; realEstateWhatsapp?:string; socialProof?: { enabled?: boolean; rating?: number; reviewCount?: number; platform?: string; avatars?: string[]; initials?: string[] }; header?: { enabled?: boolean; brand?: string; logoUrl?: string; ctaLabel?: string; ctaHref?: string; background?: string; textColor?: string; sticky?: boolean }; extras?: SiteExtras; footer?: { cnpj?: string; address?: string; email?: string; instagram?: string; facebook?: string; youtube?: string; whatsapp?: string; whatsappMessage?: string; showFloatingWhatsapp?: boolean; showMenu?: boolean } };
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

export function BuilderV2Site({site,selectedNiche="",publishedMode=false,templateId="institutional-complete"}:{site:BuilderV2SiteData;selectedNiche?:string;publishedMode?:boolean;templateId?:"institutional-complete"|"minimalist-sophisticated"|"modern-impactful"|"image-text-alternating"}) {
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
  const nav=footerNavSections;
  const ctaHref=header?.ctaHref||"#contato";
  const ctaLabel=header?.ctaLabel||"Agendar conversa";
  const headerBackground=header?.background||"#ffffff";
  const headerColor=header?.textColor||"#1c2e27";
  const navLabel=(g:{id:string;blocks:Block[]})=>/servic|tratament|especialidade/i.test(g.id)?"Serviços":/sobre|hist[oó]ria|institucional/i.test(g.id)?"Sobre":/diferenc/i.test(g.id)?"Diferenciais":/depoiment/i.test(g.id)?"Depoimentos":/galeria/i.test(g.id)?"Galeria":/contato|agend/i.test(g.id)?"Contato":publicHeading(g.blocks.find(b=>b.type==="heading")?.text||g.id,g.id).replace(/:.*/,"");
  return (
        <>
        {<style>{`
.pn-institutional-section.pn-immersive-hero{color:#fff!important}
.pn-institutional-section.pn-immersive-hero :is(h1,h2,h3,p){color:#fff!important}
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
        <section className={`${templateId==="minimalist-sophisticated"?"pn-template-editorial ":templateId==="modern-impactful"?"pn-template-impact ":templateId==="image-text-alternating"?"pn-template-alternating ":""}${publishedMode ? "w-full bg-white text-black" : "overflow-hidden rounded-2xl border border-white/15 bg-white text-black"}`}>{site.blocks.length>0&&site.extras?.enabled?.announcement!==false&&<div className="overflow-hidden bg-[#173c2e] px-5 py-2 text-center text-sm text-white"><style>{`@keyframes pn-announcement-flow{to{transform:translateX(-50%)}}@media(prefers-reduced-motion:reduce){.pn-announcement-track{animation:none!important}}`}</style>{site.extras?.announcementMotion?<div className="pn-announcement-track flex w-max items-center" style={{animation:`pn-announcement-flow ${Math.max(8,Math.min(120,site.extras?.announcementSpeed||24))}s linear infinite`,animationDirection:site.extras?.announcementDirection==="right"?"reverse":"normal"}}>{[0,1].map(i=><div key={i} aria-hidden={i===1} className="flex shrink-0 items-center gap-12 pr-12">{Array.from({length:4},(_,j)=><span key={j} className="whitespace-nowrap">{site.extras?.announcement||"Conheça nossos serviços e entre em contato para saber mais."}</span>)}</div>)}</div>:site.extras?.announcement||"Conheça nossos serviços e entre em contato para saber mais."}</div>}{showHeader&&<header style={{backgroundColor:headerBackground,color:headerColor}} className={`z-50 border-b border-black/10 shadow-[0_2px_18px_rgba(0,0,0,.04)] ${header?.sticky===false?"relative":"sticky top-0"}`}><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-12"><a href="#inicio" onClick={()=>setMenuOpen(false)} className="flex min-w-0 max-w-[calc(100%-4rem)] items-center gap-2.5 text-sm font-bold tracking-tight sm:text-base">{header?.logoUrl?<img src={header.logoUrl} alt={brand} className="h-9 max-w-[150px] object-contain sm:h-11 sm:max-w-[200px]"/>:<span className="block max-w-[min(55vw,210px)] truncate whitespace-nowrap lg:max-w-[250px]">{brand}</span>}</a><nav aria-label="Navegação principal" className="hidden items-center gap-5 lg:flex">{nav.slice(0,5).map(g=><a key={g.id} href={"#"+g.id} className="text-sm font-medium opacity-80 transition hover:opacity-100">{navLabel(g)}</a>)}</nav><div className="flex shrink-0 items-center gap-3"><a href={ctaHref} className="hidden rounded-full bg-[#193f31] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2b5b48] sm:inline-flex">{ctaLabel}</a><button type="button" aria-label={menuOpen?"Fechar menu":"Abrir menu"} aria-expanded={menuOpen} aria-controls="pn-builder-mobile-menu" onClick={()=>setMenuOpen(v=>!v)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-current/20 text-xl lg:hidden">{menuOpen?"×":"☰"}</button></div></div>{menuOpen&&<nav id="pn-builder-mobile-menu" aria-label="Navegação mobile" className="max-h-[min(65vh,470px)] overflow-y-auto border-t border-black/10 px-5 pb-4 pt-1 lg:hidden">{nav.map(g=><a key={g.id} href={"#"+g.id} onClick={()=>setMenuOpen(false)} className="block border-b border-black/10 py-2.5 text-sm font-medium">{navLabel(g)}</a>)}<a href={ctaHref} onClick={()=>setMenuOpen(false)} className="mt-4 block rounded-xl bg-[#193f31] px-5 py-3 text-center text-sm font-semibold text-white">{ctaLabel}</a></nav>}</header>}
        <div ref={previewRef} className="pn-motion-site" style={{backgroundColor:site.background}}>{!site.blocks.length && <div className="flex min-h-[420px] flex-col items-center justify-center px-8 py-16 text-center"><p className="text-2xl font-bold text-slate-900">Seu site ainda não foi gerado</p><p className="mt-3 max-w-md text-slate-600">Escreva no chat, por exemplo: Faça um site premium para advogados. Depois clique em Enviar e aplicar.</p></div>}{visibleSections.map((group,index)=>{
          const blocks=group.blocks;
          const first=blocks[0];
          const id=group.id.toLowerCase();
          const layout=(/pergunt|faq/i.test(id+" "+blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" "))?"faq":undefined) || (/galeria|foto|portf[oó]lio/i.test(id)?"gallery":undefined) || first?.layout || (/servic|tratament|especialidade|benefic|diferencia|atuacao|atua[cç][aã]o|processo|etapas/.test(id)?"grid":/pergunt|faq/.test(id)?"faq":/galeria|foto/.test(id)?"gallery":/equipe|estrutura|sobre|institucional/.test(id)?"split":index===0?"hero":"standard");
          const preset=designPresets.find(p=>p.match.test(site.title))||designPresets[3];
          const theme = /advoga|jurid|direito|escritorio/i.test(site.title) ? premiumThemes.legal : /clinic|odonto|medic|saude/i.test(site.title) ? premiumThemes.health : premiumThemes.creative;
          // Incomplete editorial sections must not reserve empty space in the published page.
          if(/conte[uú]do|artigo|blog|not[ií]cia|publica[cç][aã]o/i.test(id) && blocks.filter(b=>b.type==="paragraph"&&removeVisualDirectives(b.text).trim().length>80).length<2)return null;
          const sectionBackground=(templateId==="image-text-alternating"?(index%2===0?"#ffffff":"#f1f6f5"):templateId==="minimalist-sophisticated" ? (index%2===0?"#ffffff":"#f7f8f5") : first?.background)||(templateId==="modern-impactful"?(index%2===0?"#12151b":"#202532"):templateId==="minimalist-sophisticated"?(index%2===0?"#f7f5f0":"#eae7df"):(index===0?theme.dark:index%2?theme.light:site.background));

          
          const heroPhotoCandidate=blocks.find(b=>b.type==="image"&&!!b.src)?.src || (index===0 ? visibleSections.flatMap(section=>section.blocks).find(b=>b.type==="image"&&!!b.src)?.src : undefined);
          const immersiveHero=index===0&&(templateId==="modern-impactful"||templateId==="image-text-alternating"||site.heroPresentation!=="split")&&!!heroPhotoCandidate;
          const immersivePhoto=immersiveHero?heroPhotoCandidate:undefined;
          const heading=blocks.filter(b=>b.type==="heading").slice(0,1);
          const images=blocks.filter(b=>b.type==="image"&&!!b.src);
          const paragraphs=blocks.filter(b=>b.type==="paragraph");
          const buttons=blocks.filter(b=>b.type==="button");
          const visualLayout=layout==="standard"&&paragraphs.length>=3?"grid":layout;
          const editorialTone=/est[eé]tica|beleza|spa|luxo|premium|arquitetura|interior|moda/i.test(site.title+" "+group.id);
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
            const preferred=existing.length>=4?existing:[...existing,...(borrowed?[borrowed]:[])];
            return [...preferred,...fallback].filter((item,i,all)=>!!item.src&&all.findIndex(photo=>photo.src===item.src)===i).slice(0,Math.max(4,existing.length));
          })():images;
          const cardItems=isGallery?galleryImages:textItems.slice(0,6);
          const isProcess=/etapas|processo|passos|como-funciona|atendimento|metodologia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const isTestimonials=/depoiment|testemunh|avalia[cç][aã]o|relatos?.de.clientes/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const testimonials=textItems.filter(b=>clean(b.text).length>18).slice(0,6);
          const testimonialInfo=(item:Block)=>{const raw=clean(item.text).replace(/^[“"]|[”"]$/g,"").trim();const parts=raw.includes("|")?raw.split(/\s*\|\s*/).map(p=>p.trim()).filter(Boolean):raw.split(/\s+[—–]\s+/).map(p=>p.trim()).filter(Boolean);const first=parts[0]||"";const validName=/^[\p{L}.'-]+(?:\s+[\p{L}.'-]+){1,4}$/u.test(first)&&!/^depoimento/i.test(first);const name=parts.length>=3&&validName?first:"";const city=name?parts[1]:"";const message=name?parts.slice(2).join(" — "):raw.replace(/^depoimento\s*\d+\s*[:—–-]?\s*/i,"");return {name,city,message,photo:images.find(photo=>photo.id===item.id+"-photo"||photo.text===name)?.src||""};};
          const isPrinciples=/princip|diferencia|valores|filosofia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const processPhotos=isProcess?Array.from(new Map(previewBlocks.filter(b=>b.type==="image"&&!!b.src).map(b=>[b.src,b])).values()).slice(0,6):[];
          const cardText=(b:Block)=>{const parts=clean(b.text).split(/:\s|\s[—–]\s/);const description=parts.length>1?parts.slice(1).join(" — ").trim():clean(b.text);const name=parts.length>1?parts[0].trim():"";return {name,description:name&&description.toLocaleLowerCase("pt-BR").startsWith(name.toLocaleLowerCase("pt-BR"))?description.slice(name.length).replace(/^[\s,.:—–-]+/,"").trim()||description:description};};
          const safeColor=(color:string)=>{const c=readableColor(color,sectionBackground);const lightBackground=/^#(?:[cdef][0-9a-f]|f[0-9a-f]|[a-f]{3})/i.test(sectionBackground)||/^(white|#fff(?:fff)?)$/i.test(sectionBackground);if(lightBackground&&(/^#(?:[cdef][0-9a-f]|f[0-9a-f])/i.test(c)||/^(?:white|#fff(?:fff)?)$/i.test(c)))return "#26382f";const dark=/^#(?:1[0-9a-f]|2[0-9a-f]|3[0-9a-f])/i.test(sectionBackground);return dark&&/^#(?:0[0-9a-f]|1[0-9a-f]|2[0-9a-f]|3[0-9a-f])/i.test(c)?"#f7f4eb":c;};
          const render=(b:Block)=> {
            if(b.type==="heading") return <h2 key={b.id} data-block-id={b.id} style={{textAlign:b.align||undefined,color:b.color||safeColor(b.color),["--pn-block-color" as string]:b.color||safeColor(b.color),fontFamily:displayFont,fontSize:b.fontSize?`${b.fontSize}px`:undefined}} className={visualLayout==="hero"?"max-w-3xl text-[clamp(2rem,4.2vw,3.9rem)] font-medium leading-[1.04] tracking-[-.05em]":"max-w-3xl text-[clamp(1.65rem,3vw,2.8rem)] font-medium leading-[1.1] tracking-[-.045em]"}>{publicHeading(b.text,id)}</h2>;
            if(b.type==="paragraph") return <p key={b.id} data-block-id={b.id} style={{textAlign:b.align||undefined,color:b.color||readableColor(safeColor(b.color),sectionBackground),["--pn-block-color" as string]:b.color||readableColor(safeColor(b.color),sectionBackground),fontSize:b.fontSize?`${b.fontSize}px`:undefined}} className="max-w-2xl text-[15px] leading-[1.65] md:text-lg">{clean(b.text).replace(/(?:telefone\s*:\s*)?\(?11\)?\s*1234[-\s]?5678/gi,"")}</p>;
            if(b.type==="image") return b.src?<picture key={b.id} data-block-id={b.id}>{b.mobileSrc&&<source media="(max-width: 767px)" srcSet={b.mobileSrc}/>}<img src={b.src} alt={b.text||"Fotografia do negócio"} loading="lazy" onError={event=>{const img=event.currentTarget;if(img.dataset.fallbackAttempted)return;img.dataset.fallbackAttempted="true";const niche=Object.keys(nichePhotoCatalog).find(name=>site.title.toLocaleLowerCase("pt-BR").includes(name.toLocaleLowerCase("pt-BR")))||(/psicolog|terap/i.test(site.title)?"Psicologia":undefined);const entry=niche?(nichePhotoCatalog as Record<string,{desktop:string[];mobile:string[]}>)[niche]:undefined;const candidates=entry?.desktop||[];if(candidates.length){const source=img.parentElement?.querySelector("source");source?.remove();img.src=nichePhotoBase+candidates[Math.abs(b.id.split("").reduce((n,c)=>n+c.charCodeAt(0),0))%candidates.length]+".png";}else{img.style.display="none";}}} className="aspect-[4/3] w-full rounded-2xl object-cover"/></picture>:null;
            const proof=site.socialProof;
            const showProof=index===0&&buttons[0]?.id===b.id&&proof?.enabled!==false;
            const rating=typeof proof?.rating==="number"&&proof.rating>0&&proof.rating<=5?proof.rating:4.9;
            const count=typeof proof?.reviewCount==="number"&&proof.reviewCount>0?proof.reviewCount:287;
            const isExample=!(typeof proof?.rating==="number"&&typeof proof?.reviewCount==="number");
            const social=<div className="mt-6 grid w-full max-w-[540px] grid-cols-[auto_minmax(0,1fr)] items-center justify-start gap-x-4 gap-y-2 text-left sm:gap-x-5" aria-label="Prova social"><div className="flex -space-x-2.5">{(proof?.avatars?.length?proof.avatars.slice(0,3):proof?.initials?.length?proof.initials.slice(0,3):["MV","AL","+5k"]).map((avatar,i)=>proof?.avatars?.length?<img key={i} src={avatar} alt={"Cliente "+(i+1)} className="h-11 w-11 rounded-full border-[3px] border-white object-cover"/>:<span key={i} className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white bg-[#f8e9d6] text-sm font-semibold text-[#142943]">{avatar}</span>)}</div><div className="min-w-0 text-left leading-tight"><p className="text-base font-semibold" style={{color:readableColor("#ffffff",sectionBackground)}}>{rating.toLocaleString("pt-BR",{maximumFractionDigits:1})}/5 <span className="font-normal">no {proof?.platform||"Google"}</span></p><p className="mt-1 text-sm" style={{color:readableColor("#e8bd72",sectionBackground)}}>+{count.toLocaleString("pt-BR")} avaliações</p>{isExample&&<span className="mt-1 block text-[10px] opacity-70" style={{color:readableColor("#ffffff",sectionBackground)}}>Dados ilustrativos · personalize com avaliações reais</span>}</div></div>;
            return <div key={b.id} className="w-full"><span className="flex w-full" style={{justifyContent:b.align==="center"?"center":b.align==="right"?"flex-end":"flex-start"}}><a data-block-id={b.id} href={b.href&&/^(https?:\/\/|mailto:|tel:|#)/.test(b.href)?b.href:(/agend|contato|convers|consulta|orçamento|saiba mais/i.test(b.text)?"#contato":undefined)} style={{backgroundColor:b.color,color:readableColor("#ffffff",b.color)}} className="inline-flex min-h-12 items-center justify-center rounded-xl px-7 py-3 text-sm font-semibold">{clean(b.text)}</a></span>{showProof&&social}</div>;
          };
          const isContact=/contato|agend|fale.conosco/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const hasContactAction=buttons.some(b=>!!b.href&&/^(https?:\/\/|mailto:|tel:)/i.test(b.href));
          const sectionImages=isPrinciples?[]:isGallery?galleryImages:images;
          const uniqueImages=sectionImages.filter((b,i,all)=>!!b.src&&all.findIndex(other=>other.src===b.src)===i);
          const visualCards=cardItems.filter(b=>b.type==="paragraph").filter(b=>b.text.trim().length>0).filter(b=>!/^solu[cç][oõ]es sofisticadas/i.test(b.text.trim())).filter(b=>!/^\s*(?:conheça|descubra|oferecemos|apresentamos|explore)\b/i.test(b.text.trim())||/[:—–]/.test(b.text));
          const seenCardTitles=new Set<string>();
          const uniqueVisualCards=visualCards.filter(item=>{const title=cardText(item).name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ");if(!title)return true;if(seenCardTitles.has(title))return false;seenCardTitles.add(title);return true;});
          const sectionHasPhotos=uniqueImages.length>0&&visualCards.length>0;
          const isTreatments=/tratament|servi[cç]os|procediment/i.test(id);
          const isDifferentials=/diferencia|por.que|vantagen|escolher|escolha|excel[eê]ncia|compromisso|jornada|valores|filosofia|hist[oó]ria|ess[eê]ncia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const editorialCards=uniqueVisualCards.filter(item=>{const card=cardText(item);return card.description.length>8;});
          const editorialTitle=(item:Block,i:number)=>{const card=cardText(item);return card.name&&!/^destaque\s*\d+$/i.test(card.name)?card.name:(isDifferentials?["Atenção aos detalhes","Experiência acolhedora","Cuidado em cada etapa","Compromisso com você","Um espaço para você"][i%5]:["Cuidado personalizado","Conheça nossos serviços","Sua experiência","Nosso atendimento"][i%4]);};
          const useEditorialGrid=visualLayout==="grid"&&(isTreatments||isDifferentials)&&editorialCards.length>=2;
          const treatmentHasCompletePhotos=uniqueImages.length>=editorialCards.slice(0,6).length;
          const useTextOnlyTreatments=isTreatments&&!treatmentHasCompletePhotos;
          // Default editorial structure: three process cards + the original hero photo as card four.
          // A chat instruction can disable this, or supply a different number of process cards.
          const featureProcessCard=site.processImageCard!==false&&site.heroPresentation!=="split"&&index>0&&isProcess&&
            textItems.length===3&&!!heroSourceImage?.src&&/processo|etapas|passos|metodologia|como.funciona|atendimento/i.test(id);

          // Skip AI-generated sections without usable customer-facing content.
          const contentParagraphs=paragraphs.filter(b=>clean(b.text).length>35 && !isDesignInstruction(b.text));
          if(!images.length && !buttons.length && contentParagraphs.length===0 && !/faq|perguntas|d[uú]vidas|contato|agend/i.test(id))return null;
          const visibleHeading=heading.some(b=>publicHeading(b.text,id).trim().length>0);
          if(!visibleHeading && !images.length && !buttons.length) return null;
          const headingNode=<div className="mb-6 max-w-3xl space-y-3 md:mb-8">{heading.map(b=>isGallery&&b.type==="heading"&&/resultados/i.test(b.text)?render({...b,text:b.text.replace(/resultados/gi,"Imagens")}):render(b))}</div>;
          const editorialVisuals=uniqueImages.filter(b=>!!b.src);
          const editorialCardsForDisplay=textItems.filter(b=>b.type==="paragraph"&&b.text.trim().length>0);
          const editorialPhotoCard=(b:Block,i:number)=> editorialVisuals[i] ? <article key={b.id} data-block-id={b.id} className="pn-editorial-photo-card group min-w-0 overflow-hidden rounded-xl border border-[#e4e7e3] bg-white"><div className="relative aspect-[4/3] overflow-hidden bg-[#f1f3f0]"><img src={editorialVisuals[i].src} alt={editorialTitle(b,i)} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" style={{objectPosition:`${35+(i%3)*15}% center`}}/></div><div className="p-5 text-left sm:p-6"><span className="mb-3 block text-left text-xs font-bold tracking-[.2em] text-[#607787]">{String(i+1).padStart(2,"0")}</span><div className="text-left [&_p]:!text-left [&_p]:!text-[1rem] [&_p]:!leading-relaxed">{render(b)}</div></div></article> : <div key={b.id} data-block-id={b.id} className="pn-editorial-text-card min-w-0 rounded border border-[#e5eaf0] bg-white px-5 py-5 sm:px-6 sm:py-6" style={{display:"flex",flexDirection:"column",justifyContent:"flex-start",alignSelf:"start",height:"auto",minHeight:0,gap:"12px"}}><span className="block text-left text-xs font-bold leading-5 tracking-[.2em] text-[#607787]" style={{position:"static",margin:0}}>{String(i+1).padStart(2,"0")}</span><div className="min-w-0 text-left [&_p]:!m-0 [&_p]:!text-left [&_p]:!text-[1rem] [&_p]:!leading-relaxed">{render(b)}</div></div>;
          const imageNode=(b:Block,i:number)=><div key={b.id} className={i===0?"overflow-hidden rounded-[1.75rem]":"overflow-hidden rounded-2xl"}>{b.src?render(b):<div data-block-id={b.id} className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-[#c5cbbf] bg-[#f1f1e9] text-center text-sm text-[#52615a]">{b.text||"Adicionar imagem"}</div>}</div>;
          if(isGallery&&galleryImages.length===0&&textItems.length===0&&buttons.length===0)return null;
          return <section id={isContact?"contato":group.id} key={group.id+"-"+index} data-section-id={group.id} style={{backgroundColor:sectionBackground,...(immersivePhoto?{backgroundImage:`linear-gradient(90deg,rgba(9,19,28,.90),rgba(9,19,28,.54)),url("${immersivePhoto.replace(/"/g,"%22")}")`,backgroundSize:"cover",backgroundPosition:"center"}:{})}} className={`pn-institutional-section pn-default-left scroll-mt-20 overflow-hidden ${immersiveHero?"pn-immersive-hero":""} ${templateId==="minimalist-sophisticated"?"px-5 py-8 sm:px-8 sm:py-12 md:px-14 md:py-14":"px-5 py-10 sm:px-8 sm:py-14 md:px-14 md:py-16"}`}>
            <div className="mx-auto max-w-6xl">
              {immersiveHero?
                <div className="relative z-10 flex min-h-[450px] w-full max-w-4xl flex-col justify-center gap-5 py-6 text-left sm:min-h-[520px] sm:gap-7 lg:min-h-[590px] lg:py-14">
                  {headingNode}
                  <div className="max-w-2xl space-y-4">{textItems.slice(0,3).map(render)}</div>
                  {buttons.length>0&&<div className={`flex flex-wrap items-start gap-3 ${buttons[0]?.align==="center"?"justify-center":buttons[0]?.align==="right"?"justify-end":"justify-start"}`}>{buttons.map(render)}</div>}
                </div>:
              featureProcessCard?
                <div className="mx-auto w-full max-w-6xl">
                  {headingNode}
                  <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {textItems.map((item,i)=>{
                      const card=cardText(item);
                      // Preserve the existing process-card photos. When there are other
                      // generated photos, reserve the original hero photo for card four.
                      const alternatives=processPhotos.filter(photo=>photo.src!==heroSourceImage?.src);
                      const candidates=alternatives.length>=3?alternatives:processPhotos;
                      const photo=candidates[i%candidates.length];
                      return <article key={item.id} data-block-id={item.id} style={{...(item.radius?{borderRadius:`${item.radius}px`}:{}),...(item.cardBorderWidth!==undefined?{borderWidth:`${item.cardBorderWidth}px`,borderStyle:"solid" as const,borderColor:item.cardBorderColor||"#E5E7EB"}:{}),...(item.cardShadow?{boxShadow:item.cardShadow}:{})}} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#e4e0d8] border-l-[5px] border-l-[#a69a76] bg-white shadow-[0_8px_24px_rgba(20,35,29,.04)]">
                        {photo?.src&&<picture data-block-id={photo.id} className="block aspect-[16/10] w-full overflow-hidden bg-[#eff1ec]">
                          {photo.mobileSrc&&<source media="(max-width: 767px)" srcSet={photo.mobileSrc}/>}
                          <img src={photo.src} alt={photo.text||card.name||"Imagem ilustrativa"} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"/>
                        </picture>}
                        <div className="flex grow flex-col p-5 sm:p-6">
                          <span className="mb-4 inline-flex w-fit rounded-xl bg-[#f5f0e4] px-3 py-2 text-xs font-bold text-[#92773b]">{String(i+1).padStart(2,"0")}</span>
                          <h3 className="mb-3 text-lg font-semibold leading-snug text-[#24332e]">{card.name||card.description.split(/[,.]/)[0]}</h3>
                          <p className="text-sm leading-relaxed text-[#53605b]">{card.description}</p>
                        </div>
                      </article>;
                    })}
                    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#e4e0d8] border-l-[5px] border-l-[#a69a76] bg-white shadow-[0_8px_24px_rgba(20,35,29,.04)]">
                      <picture data-block-id={heroSourceImage!.id} className="block aspect-[16/10] w-full overflow-hidden bg-[#eff1ec]">
                        {heroSourceImage!.mobileSrc&&<source media="(max-width: 767px)" srcSet={heroSourceImage!.mobileSrc}/>}
                        <img src={heroSourceImage!.src} alt={heroSourceImage!.text||"Imagem de apresentação do negócio"} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"/>
                      </picture>
                      <div className="flex grow flex-col p-5 sm:p-6">
                        <span className="mb-4 inline-flex w-fit rounded-xl bg-[#f5f0e4] px-3 py-2 text-xs font-bold text-[#92773b]">04</span>
                        <h3 className="mb-3 text-lg font-semibold leading-snug text-[#24332e]">{site.processImageCardTitle||"Nosso trabalho em imagens"}</h3>
                        <p className="text-sm leading-relaxed text-[#53605b]">{site.processImageCardDescription||"Uma apresentação visual do nosso trabalho e dos serviços oferecidos."}</p>
                      </div>
                    </article>
                  </div>
                  {buttons.length>0&&<div className="mt-7 flex flex-wrap gap-3">{buttons.map(render)}</div>}
                </div>:
              templateId==="image-text-alternating"&&!isTestimonials&&!isContact&&visualLayout!=="faq"&&!/faq|perguntas.frequentes/i.test(id)?<div className="mx-auto max-w-[1200px]">
                {isGallery?<div className="space-y-8"><div className="max-w-3xl">{headingNode}</div><div className="grid gap-4 sm:grid-cols-2">{sectionImages.filter(b=>!!b.src).slice(0,4).map((b,i)=><div key={b.id} className="pn-alternate-image">{imageNode(b,i)}</div>)}</div></div>:
                <div className={`pn-alternate-row pn-alternate-row-${index%2===0?"even":"odd"} ${index===0?"pn-alternate-hero":""}`}>
                  <div className="pn-alternate-copy space-y-6">
                    <span className="pn-alternate-kicker block">{index===0?"EDITORIAL / APRESENTAÇÃO":`CAPÍTULO ${String(index+1).padStart(2,"0")}`}</span>
                    {headingNode}
                    <div className={`pn-alternate-content ${/servi[cç]os|tratament|diferencia|vantagen/i.test(id)?"pn-alternate-list":""}`}>{textItems.slice(0,8).map((item,i)=><div key={item.id} className="pn-alternate-text-item" data-block-id={item.id}>{render(item)}</div>)}</div>
                    <div className="flex flex-wrap gap-3">{buttons.map(render)}</div>
                  </div>
                  {sectionImages.some(b=>!!b.src)?<div className="pn-alternate-image">{sectionImages.filter(b=>!!b.src).slice(0,index===0?1:2).map(imageNode)}</div>:null}
                </div>}
              </div>:
              templateId==="modern-impactful"&&!isTestimonials&&visualLayout!=="faq"&&!/faq|perguntas.frequentes/i.test(id)?<div className="pn-impact-panel mx-auto max-w-[1440px] text-white">
                {index===0?<div className="relative grid min-h-0 items-center gap-8 overflow-hidden py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-14 lg:py-16"><div className="relative z-10 min-w-0 space-y-7"><span className="pn-impact-label block text-xs">UMA NOVA EXPERIÊNCIA / 001</span><div className="[&_h1]:!text-white [&_h2]:!text-white">{headingNode}</div><div className="max-w-xl space-y-5 [&_p]:!text-white/80">{textItems.slice(0,2).map(render)}</div><div className="flex flex-wrap gap-4">{buttons.map(render)}</div><span aria-hidden="true" className="block h-1 w-24 bg-cyan-300"/></div><div className="relative min-h-[280px] overflow-hidden rounded-2xl border-l-[6px] border-cyan-300 lg:min-h-0 lg:aspect-[4/5] lg:max-h-[650px] [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_picture]:block [&_picture]:h-full">{sectionImages.slice(0,1).map(imageNode)}</div></div>:
                isGallery?<div className="space-y-12 py-12"><div className="[&_h2]:!text-white">{headingNode}</div><div className="grid gap-3 md:grid-cols-2">{sectionImages.slice(0,6).map((b,i)=><div key={b.id} className="min-w-0">{imageNode(b,i)}</div>)}</div></div>:
                <div className="grid min-w-0 gap-7 py-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-16 lg:py-16"><div className="min-w-0"><span className="pn-impact-label mb-5 block text-xs">EXPERIÊNCIA {String(index+1).padStart(2,"0")}</span><div className="[&_h2]:!text-white">{headingNode}</div></div><div className="min-w-0 space-y-7">{sectionImages.length>0&&<div className="grid gap-3 sm:grid-cols-2">{sectionImages.slice(0,2).map(imageNode)}</div>}{/processo|etapas|como.funciona/i.test(id)?<ol className="border-l border-cyan-300/40 pl-6">{textItems.map((item,i)=><li key={item.id} data-block-id={item.id} className="relative border-b border-white/15 py-5 first:pt-0 last:border-0"><span className="pn-impact-label mb-3 block text-xs">ETAPA {String(i+1).padStart(2,"0")}</span><div className="[&_p]:!text-left [&_p]:!text-white/85">{render(item)}</div></li>)}</ol>:/diferencia|vantagen|escolher/i.test(id)?<div className="divide-y divide-white/20">{textItems.map((item,i)=><div key={item.id} data-block-id={item.id} className="grid gap-3 py-5 first:pt-0 sm:grid-cols-[3rem_1fr]"><span className="pn-impact-label text-sm">{String(i+1).padStart(2,"0")}</span><div className="[&_p]:!text-left [&_p]:!text-white/85">{render(item)}</div></div>)}</div>:/servi[cç]os|tratament/i.test(id)?<div className="divide-y divide-white/20">{textItems.map((item,i)=><div key={item.id} data-block-id={item.id} className="flex min-w-0 gap-5 py-5 first:pt-0"><span className="pn-impact-label shrink-0 text-xs">{String(i+1).padStart(2,"0")}</span><div className="min-w-0 [&_p]:!text-left [&_p]:!text-white/85">{render(item)}</div></div>)}</div>:<div className="space-y-5">{textItems.map((item,i)=><div key={item.id} data-block-id={item.id} className="border-b border-white/15 pb-5 last:border-0 [&_p]:!text-left [&_p]:!text-white/85">{render(item)}</div>)}</div>}<div className="flex flex-wrap gap-4">{buttons.map(render)}</div></div></div>}
              </div>:
              templateId==="minimalist-sophisticated"&&!isTestimonials&&!isContact&&visualLayout!=="faq"&&!/faq|perguntas.frequentes/i.test(id)?<div className="pn-editorial-layout mx-auto max-w-[1320px]">
                {index===0?<div className="grid items-center gap-7 py-5 lg:min-h-[560px] lg:grid-cols-[1.1fr_.9fr] lg:gap-16 lg:py-12"><div className="order-2 min-w-0 space-y-6 lg:order-1"><span className="block text-xs font-semibold uppercase tracking-[.35em] opacity-60">EM DESTAQUE / {String(index+1).padStart(2,"0")}</span>{headingNode}<div className="max-w-lg space-y-5">{textItems.slice(0,2).map(render)}</div><div className="flex flex-wrap gap-3">{buttons.map(render)}</div></div><div className="order-1 min-h-0 lg:order-2 lg:min-h-[500px] [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{sectionImages.slice(0,1).map(imageNode)}</div></div>:
                isGallery?<div className="space-y-12"><div className="max-w-3xl">{headingNode}</div><div className="grid gap-4 sm:grid-cols-2">{uniqueImages.slice(0,6).map((b,i)=><div key={b.id} className="min-w-0">{imageNode(b,i)}</div>)}</div></div>:
                <div className="grid gap-8 py-4 lg:grid-cols-[.85fr_1.15fr] lg:gap-16 lg:py-12"><div className="lg:sticky lg:top-28 lg:self-start"><span className="mb-5 block text-xs font-semibold uppercase tracking-[.3em] opacity-55">{String(index+1).padStart(2,"0")} / {group.id.replace(/[-_]/g," ")}</span>{headingNode}</div><div className="space-y-6">{editorialCardsForDisplay.length>0?(isProcess?<ol className="relative space-y-0 border-l border-[#cad4cf] pl-7">{editorialCardsForDisplay.slice(0,8).map((b,i)=><li key={b.id} data-block-id={b.id} className="relative border-b border-[#e1e6e2] py-6 first:pt-0 last:border-b-0"><span aria-hidden="true" className="absolute -left-[35px] top-7 flex h-4 w-4 items-center justify-center rounded-full border-[3px] border-white bg-[#527566] first:top-1"/><span className="mb-2 block text-xs font-semibold tracking-[.2em] text-[#607787]">ETAPA {String(i+1).padStart(2,"0")}</span><div className="[&_p]:!text-left [&_p]:!leading-relaxed">{render(b)}</div></li>)}</ol>:isDifferentials?<div className="divide-y divide-[#dfe5e0]">{editorialCardsForDisplay.slice(0,8).map((b,i)=><article key={b.id} data-block-id={b.id} className="grid gap-3 py-6 first:pt-0 sm:grid-cols-[48px_1fr] sm:gap-5"><span className="text-lg font-semibold text-[#729284]">{String(i+1).padStart(2,"0")}</span><div className="[&_p]:!text-left [&_p]:!leading-relaxed">{render(b)}</div></article>)}</div>:isTreatments?<div className="divide-y divide-[#dfe5e0]">{editorialCardsForDisplay.slice(0,8).map((b,i)=><article key={b.id} data-block-id={b.id} className="flex gap-5 py-6 first:pt-0"><span className="shrink-0 pt-1 text-xs font-semibold tracking-[.15em] text-[#729284]">{String(i+1).padStart(2,"0")}</span><div className="[&_p]:!text-left [&_p]:!leading-relaxed">{render(b)}</div></article>)}</div>:<div className="grid gap-3 sm:grid-cols-2">{editorialCardsForDisplay.slice(0,8).map(editorialPhotoCard)}</div>):editorialVisuals.length>0?<div className="grid gap-4 sm:grid-cols-2">{editorialVisuals.slice(0,4).map(imageNode)}</div>:null}<div className="flex flex-wrap gap-3">{buttons.map(render)}</div></div></div>}
              </div>:
              isGallery?<>{headingNode}<div className="grid grid-cols-2 gap-3 md:hidden">{sectionImages.slice(0,6).map((b,i)=><div key={b.id} className={i===0?"col-span-2":""}>{imageNode(b,i)}</div>)}</div><div className="hidden md:grid md:grid-cols-2 md:gap-6">{sectionImages.slice(0,6).map((b,i)=><div key={b.id} className="grid min-w-0 items-center gap-4 rounded-2xl border border-[#e7e4dd] bg-white/70 p-4 lg:gap-5"><div className="">{imageNode(b,i)}</div><div className="min-w-0"><h3 className="mb-2 text-lg font-semibold leading-snug text-[#24332e]">{textItems[i]&&cardText(textItems[i]).name&&!/^(nossa atuação|conheça mais|saiba mais)$/i.test(cardText(textItems[i]).name)?cardText(textItems[i]).name:["Nosso espaço","Atendimento próximo","Cuidado em cada detalhe","Nossa equipe","Experiência e acolhimento","Conheça nosso trabalho"][i]}</h3><p className="text-sm leading-relaxed text-[#52615a]">{textItems[i]&&!/^(conheça mais sobre nosso trabalho|conheça nossa abordagem|nossa atuação)/i.test(cardText(textItems[i]).description)?cardText(textItems[i]).description:["Conheça os ambientes e os detalhes do nosso trabalho.","Uma experiência pensada para atender você com atenção.","Cada detalhe faz parte da nossa forma de trabalhar.","Pessoas e processos dedicados a um atendimento cuidadoso.","Compromisso com qualidade em cada etapa.","Descubra como podemos ajudar você."][i]}</p></div></div>)}</div></>:
              isTestimonials?<>{headingNode}{templateId==="image-text-alternating"?<div className="grid gap-5 md:grid-cols-2">{testimonials.map(item=>{const t=testimonialInfo(item);return <article key={item.id} data-block-id={item.id} className="min-w-0 border-t border-[#a8aaa2] px-1 py-6"><p className="break-words text-base leading-relaxed text-[#344039]">“{t.message}”</p><p className="mt-5 font-semibold text-[#293d34]">{t.name||"Paciente"}</p>{t.city&&<p className="text-sm text-[#65736c]">{t.city}</p>}</article>})}</div>:templateId==="minimalist-sophisticated"?<div className="grid gap-4 sm:grid-cols-2">{testimonials.map(item=>{const t=testimonialInfo(item);return <article key={item.id} data-block-id={item.id} className="min-w-0 rounded-xl border border-[#e5e8e4] bg-white p-5 sm:p-7"><p className="break-words text-base leading-relaxed text-[#33453d]">“{t.message}”</p><p className="mt-5 font-semibold text-[#183b2b]">{t.name||"Paciente"}</p>{t.city&&<p className="text-sm text-[#68776e]">{t.city}</p>}</article>})}</div>:<TestimonialCarousel auto={!/depoimentos?.est[aá]ticos?|sem.carrossel/i.test(site.title)}>{testimonials.map((item,i)=>{const t=testimonialInfo(item);return <article key={item.id} data-block-id={item.id} className="flex h-full min-h-[250px] flex-col overflow-hidden rounded-[24px] border border-[#e2e9e4] bg-white px-6 py-6 shadow-[0_14px_40px_rgba(15,38,29,.09)] sm:px-7 sm:py-7"><div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3.5">{t.photo?<img src={t.photo} alt={t.name?`Foto de \${t.name}`:"Foto do cliente"} className="h-12 w-12 shrink-0 rounded-full border border-[#dbe6de] object-cover"/>:<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e7f0e9] text-lg font-bold text-[#244c37]">{t.name?t.name.slice(0,1).toUpperCase():"✦"}</div>}<div className="min-w-0"><p className="text-[15px] font-bold leading-snug text-[#193d2c]">{t.name||"Depoimento"}</p>{t.city&&<p className="mt-0.5 text-xs leading-snug text-[#6e8176]">{t.city}</p>}</div></div><span className="shrink-0 text-xl font-serif text-[#94b6a0]" aria-hidden="true">“</span></div><div className="mb-4 h-px w-full bg-[#e8eee9]"/><p className="flex-1 text-[15px] leading-[1.8] text-[#354c40]">“{t.message}”</p><div className="mt-6 flex items-center gap-1 text-[14px] tracking-[.1em] text-[#b48a3c]" aria-label="Cinco estrelas">★★★★★</div></article>})}</TestimonialCarousel>}</>:
              (visualLayout==="faq"||/faq|perguntas.frequentes/i.test(id))?<>{headingNode}<div className="mx-auto max-w-3xl space-y-3">{textItems.map(b=>{const at=b.text.indexOf("?");return <details key={b.id} className="group rounded-xl border border-[#e9e4da] bg-white px-5 py-4 text-[#24332e]"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold leading-snug [&::-webkit-details-marker]:hidden"><span className="min-w-0 flex-1">{at>=0?b.text.slice(0,at+1):b.text}</span><span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center text-xl leading-none group-open:rotate-45">+</span></summary>{at>=0&&b.text.slice(at+1).trim()&&<p className="mt-3 border-t border-[#eee9e0] pt-3 text-sm leading-relaxed">{b.text.slice(at+1).trim()}</p>}</details>})}</div></>:
              (visualLayout==="hero"||visualLayout==="split")&&!isPrinciples?<div className={sectionImages.length?"grid min-w-0 items-center gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-12":"mx-auto max-w-3xl"}>
                <div className="min-w-0 space-y-5">{blocks.filter(b=>b.type==="heading"||b.type==="button"||(b.type==="paragraph"&&textItems.slice(0,3).some(item=>item.id===b.id))).map(render)}</div>
                {sectionImages.length>0&&<div className="relative min-w-0 [&_img]:w-full [&_img]:object-cover">{sectionImages.slice(0,1).map(imageNode)}</div>}
              </div>:
              useEditorialGrid?<div className="space-y-8 md:space-y-12">
                <div className="flex flex-col gap-4">{headingNode}</div>
                {(id==="servicos"||id==="diferenciais")?<div className={`grid items-stretch gap-4 ${id==="servicos"&&editorialCards[0]?.columns===1?"md:grid-cols-1":id==="servicos"&&editorialCards[0]?.columns===3?"md:grid-cols-3":id==="servicos"&&editorialCards[0]?.columns===4?"md:grid-cols-4":"md:grid-cols-2"}`}>{editorialCards.slice(0,id==="servicos"?undefined:4).map((item,i)=>{const card=cardText(item);const photo=treatmentHasCompletePhotos?uniqueImages[i]:undefined;return <article key={item.id} data-block-id={item.id} style={{...(item.radius?{borderRadius:`${item.radius}px`}:{}),...(item.cardBorderWidth!==undefined?{borderWidth:`${item.cardBorderWidth}px`,borderStyle:"solid" as const,borderColor:item.cardBorderColor||"#E5E7EB"}:{}),...(item.cardShadow?{boxShadow:item.cardShadow}:{})}} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e7e4dd] bg-white shadow-[0_8px_30px_rgba(20,35,29,0.045)]">{photo&&<div className="aspect-[16/10] overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{render(photo)}</div>}<div className="space-y-3 p-6 md:p-8"><span className="text-[10px] font-semibold uppercase tracking-[.25em] text-[#718066]">{id==="servicos"?"Serviço":"Diferencial"} {String(i+1).padStart(2,"0")}</span><h3 className="font-serif text-[clamp(1.5rem,2vw,2rem)] leading-tight text-[#24332e]">{editorialTitle(item,i)}</h3><p className="text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></article>})}</div>:<div className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">{!useTextOnlyTreatments&&uniqueImages[0]&&<div className="relative overflow-hidden rounded-[2rem] shadow-[22px_24px_0_-8px_rgba(113,128,102,.15)] [&_img]:aspect-[4/5] [&_img]:w-full [&_img]:object-cover">{render(uniqueImages[0])}</div>}<div className="divide-y divide-[#8a907e]/25">{editorialCards.slice(0,isTreatments?6:5).map((item,i)=>{const card=cardText(item);return <div key={item.id} data-block-id={item.id} className="grid grid-cols-[2.5rem_1fr] gap-4 py-5 first:pt-0"><span className="pt-1 text-xs font-semibold tracking-widest text-[#778567]">{String(i+1).padStart(2,"0")}</span><div><h3 className="font-serif text-[clamp(1.4rem,2vw,2rem)] leading-snug text-[#24332e]">{editorialTitle(item,i)}</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></div>})}</div></div>}
                {buttons.length>0&&<div className="flex flex-wrap gap-3">{buttons.map(render)}</div>}
              </div>:
              (visualLayout==="grid"||isProcess||isPrinciples)&&!isContact?<>{headingNode}<div className="grid auto-rows-auto items-start gap-4 md:grid-cols-2 lg:grid-cols-3">{uniqueVisualCards.map((item,i)=>{const card=cardText(item);const photo=isPrinciples?undefined:isProcess?processPhotos[i%Math.max(1,processPhotos.length)]:sectionHasPhotos?uniqueImages[i]:undefined;return <article key={item.id} className={`group h-fit self-start overflow-hidden border border-[#e7e4dd] bg-white shadow-[0_8px_30px_rgba(20,35,29,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-lg ${isProcess?"rounded-lg border-l-4 border-l-[#9c947b]":"rounded-2xl"}`}>{photo&&<div className="aspect-[16/10] overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:rounded-none [&_img]:object-cover">{render(photo)}</div>}<div className="p-5 md:p-7">{isProcess&&!/^\s*\d{1,2}\s*$/.test(card.name)&&<span className="mb-4 inline-flex rounded-lg bg-[#f5f0e4] px-3 py-2 text-xs font-semibold text-[#92773b]">{String(i+1).padStart(2,"0")}</span>}<h3 data-block-id={item.id} style={{color:/^#[0-9a-fA-F]{6}$/.test(item.color||"")?item.color:"#24332e"}} className="mb-2 text-lg font-bold leading-snug">{card.name&&!/^destaque\s*\d+$/i.test(card.name)?card.name:(card.description.split(/[,.]/)[0].trim().split(" ").slice(0,5).join(" ")||"Nossa proposta")}</h3><p className="text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></article>})}</div>{buttons.length>0&&<div className="mt-7 flex flex-wrap gap-3">{buttons.map(render)}</div>}</>:
              isContact||visualLayout==="banner"?<div className="max-w-3xl space-y-5 text-left">{heading.map(render)}{textItems.filter(b=>!/\b(?:xx|xxx|rua principal|contato@clinic)/i.test(b.text)).slice(0,2).map(b=>isContact?render({...b,text:b.text.replace(/Use o formulário abaixo[^.]*\.?/gi,"Envie sua mensagem pelos canais de atendimento disponíveis.").replace(/formulário abaixo/gi,"canal de atendimento")}):render(b))}{buttons.map(render)}{isContact&&<form onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);const subject=encodeURIComponent("Contato pelo site "+site.title);const body=encodeURIComponent("Nome: "+data.get("name")+"\nE-mail: "+data.get("email")+"\nMensagem: "+data.get("message"));if(site.footer?.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.footer.email)){window.location.href="mailto:"+site.footer.email+"?subject="+subject+"&body="+body;}else{window.location.href="mailto:?subject="+subject+"&body="+body;}}} className="mx-auto mt-6 grid max-w-xl gap-4 rounded-2xl border border-[#e2dfd5] bg-white p-5 text-left shadow-sm sm:p-8"><p className="text-sm text-[#46534b]">Preencha os dados para preparar sua mensagem no aplicativo de e-mail. Configure o e-mail de destino para receber contatos diretamente.</p><label className="grid gap-2 text-sm font-medium text-[#24332e]">Nome<input name="name" required maxLength={100} className="min-h-12 rounded-lg border border-[#d9ddd5] px-4 text-[#24332e]"/></label><label className="grid gap-2 text-sm font-medium text-[#24332e]">E-mail<input name="email" type="email" required maxLength={160} className="min-h-12 rounded-lg border border-[#d9ddd5] px-4 text-[#24332e]"/></label><label className="grid gap-2 text-sm font-medium text-[#24332e]">Mensagem<textarea name="message" required maxLength={3000} rows={4} className="rounded-lg border border-[#d9ddd5] px-4 py-3 text-[#24332e]"/></label><button type="submit" className="min-h-12 rounded-xl bg-[#243e32] px-6 font-semibold text-white">Preparar mensagem</button></form>}</div>:
              <div className={sectionImages.length?"grid min-w-0 items-center gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-12":"mx-auto max-w-3xl space-y-5"}><div className="space-y-5">{heading.map(render)}{textItems.slice(0,3).map(render)}{buttons.map(render)}</div>{sectionImages.slice(0,1).map(imageNode)}</div>}
            </div>
          </section>;
        })}{site.blocks.length>0&&<BuilderExtras extras={{...site.extras,enabled:{announcement:false,video:site.extras?.enabled?.video===true,comparison:site.extras?.enabled?.comparison===true,partners:site.extras?.enabled?.partners===true,pricing:site.extras?.enabled?.pricing===true,counters:true,faq:false,map:site.extras?.enabled?.map!==false&&!!site.extras?.address,popup:site.extras?.enabled?.popup!==false,backToTop:site.extras?.enabled?.backToTop!==false}}} />}{site.blocks.length>0&&<footer className="pn-builder-v2-footer bg-[#102a22] px-6 py-10 text-[#f7f5ed] md:px-12 md:py-14 lg:px-16">
  <div className="pn-builder-v2-footer-shell mx-auto w-full max-w-6xl">
    <div className="pn-builder-v2-footer-main grid min-w-0 items-start gap-x-12 gap-y-10 border-b border-white/15 pb-10 md:grid-cols-[minmax(0,1.65fr)_minmax(260px,.8fr)] lg:gap-x-20">
      <div className="min-w-0">
        <div className="mb-5 h-1 w-12 rounded-full bg-[#d4c19b]"/>
        <p className="max-w-2xl text-2xl font-bold leading-[1.18] tracking-tight [text-wrap:balance] sm:text-[1.75rem] lg:text-3xl">{site.title.split(/\s+[–—-]\s+/)[0].trim()}</p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">{/advoca|jur[ií]dic|direito/i.test(site.title+" "+site.blocks.map(b=>b.text).slice(0,10).join(" "))?"Atuação jurídica com clareza e responsabilidade.":/arquitet|interior|atelier/i.test(site.title+" "+site.blocks.map(b=>b.text).slice(0,10).join(" "))?"Arquitetura e interiores pensados para cada espaço.":/cl[ií]nica|sa[uú]de|est[eé]tica/i.test(site.title+" "+site.blocks.map(b=>b.text).slice(0,10).join(" "))?"Informações e atendimento em um só lugar.":"Conheça nossos serviços e entre em contato."}</p>
      </div>
      <div className="min-w-0 md:justify-self-end">
        <h3 className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-[#d4c19b]">Conecte-se</h3>
        <div className="space-y-4 text-sm leading-relaxed text-white/70">
          {site.footer?.cnpj&&<p><span className="mr-2 text-[#d4c19b]">▣</span>CNPJ: {site.footer.cnpj}</p>}
          {site.footer?.address&&<p><span className="mr-2 text-[#d4c19b]">⌖</span>{site.footer.address}</p>}
          <div className="flex flex-wrap items-center gap-2.5">
            {([["Instagram",site.footer?.instagram],["Facebook",site.footer?.facebook],["YouTube",site.footer?.youtube],["WhatsApp",site.footer?.whatsapp]] as const).map(([label,url])=>url?.startsWith("https://")?<a key={label} aria-label={label} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/[.08] text-white shadow-sm transition hover:-translate-y-1 hover:border-[#d4c19b] hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4c19b]">{label==="Instagram"?<SocialIcon name="instagram" size={19}/>:label==="Facebook"?<SocialIcon name="facebook" size={19}/>:label==="WhatsApp"?<SocialIcon name="whatsapp" size={21}/>:<SocialIcon name="youtube" size={21}/>}</a>:<span key={label} role="img" aria-label={`${label} — link ainda não configurado`} title={`${label}: configure o link pelo chat da PageNova AI`} className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[.035] text-white/55">{label==="Instagram"?<SocialIcon name="instagram" size={19}/>:label==="Facebook"?<SocialIcon name="facebook" size={19}/>:label==="WhatsApp"?<SocialIcon name="whatsapp" size={21}/>:<SocialIcon name="youtube" size={21}/>}</span>)}
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
</footer>}{<SiteWhatsAppButton numberOrUrl={site.footer?.whatsapp||site.restaurant?.whatsapp||site.realEstateWhatsapp} message={site.footer?.whatsappMessage} enabled={site.footer?.showFloatingWhatsapp!==false} preview={!publishedMode}/>}</div></section>
        </>
  );
}
