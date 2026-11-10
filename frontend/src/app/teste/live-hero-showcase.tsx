"use client";
import "./live-hero-showcase.css";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Lang = "pt" | "en" | "es";

/**
 * The artwork is deliberately a real pre-composed image of the approved design.
 * Don't rebuild the mock site cards in DOM: this guarantees the approved appearance
 * and prevents missing external image URLs, blank cards and visual regressions.
 */
const mobileGallery = [
  { src: "/landing-hero/hero-left-hd.webp", key: "left" },
  { src: "/landing-hero/hero-right-hd.webp", key: "right" }
] as const;

const mobileCopy = {
  pt: {label:"Explore os estilos",prev:"Ver exemplos anteriores",next:"Ver próximos exemplos",slide:"Exemplos de sites"},
  en: {label:"Explore the styles",prev:"Previous examples",next:"Next examples",slide:"Website examples"},
  es: {label:"Explora los estilos",prev:"Ejemplos anteriores",next:"Más ejemplos",slide:"Ejemplos de sitios"}
} as const;

/** Mobile uses the same approved high-quality artwork, one full-size group at a time. */
function MobileHeroShowcase({lang}:{lang:Lang}) {
  const trackRef=useRef<HTMLDivElement>(null);
  const [active,setActive]=useState(0);
  const t=mobileCopy[lang];
  const goTo=(next:number)=>{
    const index=Math.max(0,Math.min(mobileGallery.length-1,next));
    const track=trackRef.current;
    const slide=track?.children.item(index) as HTMLElement | null;
    if(track && slide){
      track.scrollTo({left:slide.offsetLeft-track.offsetLeft-(track.clientWidth-slide.clientWidth)/2,behavior:"smooth"});
    }
    setActive(index);
  };
  return (
    <div className="pn9-mobile-showcase" role="region" aria-roledescription="carousel" aria-label={t.slide}>
      <div className="pn9-mobile-aura" aria-hidden="true"/>
      <div className="pn9-mobile-carousel" ref={trackRef} onScroll={event=>{
        const viewport=event.currentTarget;
        const closest=Array.from(viewport.children).reduce((best,element,index)=>{
          const target=element as HTMLElement;
          const distance=Math.abs(target.offsetLeft-viewport.offsetLeft+target.clientWidth/2-viewport.scrollLeft-viewport.clientWidth/2);
          return distance<best.distance?{index,distance}:best;
        },{index:0,distance:Infinity});
        setActive(closest.index);
      }}>
        {mobileGallery.map((item,index)=>
          <div key={item.key} className="pn9-mobile-slide" role="group" aria-roledescription="slide" aria-label={index+1+" / "+mobileGallery.length}>
            <img src={item.src} alt="" draggable={false} loading={index===0?"eager":"lazy"} decoding="async" fetchPriority={index===0?"high":"auto"}/>
          </div>
        )}
      </div>
      <div className="pn9-mobile-navigation">
        <span className="pn9-mobile-label">{t.label} <span className="pn9-mobile-count">0{active+1} / 0{mobileGallery.length}</span></span>
        <div className="pn9-mobile-controls">
          <button type="button" onClick={()=>goTo(active-1)} disabled={active===0} aria-label={t.prev}><ChevronLeft size={19}/></button>
          <button type="button" onClick={()=>goTo(active+1)} disabled={active===mobileGallery.length-1} aria-label={t.next}><ChevronRight size={19}/></button>
        </div>
      </div>
    </div>
  );
}

export function LiveHeroShowcase({ lang, mobile = false }: { lang: Lang; mobile?: boolean }) {
  if (mobile) return (
    <div className="pn9-mobile-ambient" aria-hidden="true">
      <div className="pn9-mobile-ambient-glow" />
      <div className="pn9-mobile-ambient-half pn9-mobile-ambient-left">
        <img src="/landing-hero/hero-left-hd.webp" alt="" draggable={false} decoding="async" fetchPriority="high" />
      </div>
      <div className="pn9-mobile-ambient-half pn9-mobile-ambient-right">
        <img src="/landing-hero/hero-right-hd.webp" alt="" draggable={false} decoding="async" fetchPriority="high" />
      </div>
      <div className="pn9-mobile-ambient-shield" />
    </div>
  );
  return (
    <div className={mobile ? "pn9-image-scene pn9-mobile" : "pn9-image-scene pn9-desktop"} aria-hidden="true">
      <svg className="pn9-sharp-defs" width="0" height="0" focusable="false" aria-hidden="true">
        <defs>
          <filter id={mobile ? "pn9-unsharp-mobile" : "pn9-unsharp-desktop"} x="-1%" y="-1%" width="102%" height="102%" colorInterpolationFilters="sRGB">
            <feConvolveMatrix order="3" kernelMatrix="0 -0.13 0 -0.13 1.52 -0.13 0 -0.13 0" divisor="1" bias="0" edgeMode="duplicate" preserveAlpha="true"/>
          </filter>
        </defs>
      </svg>
      <div className="pn9-glow pn9-glow-left" />
      <div className="pn9-glow pn9-glow-right" />
      <div className="pn9-half pn9-left">
        <img src="/landing-hero/hero-left-hd.webp" alt="" decoding="async" draggable={false} fetchPriority="high"/>
      </div>
      <div className="pn9-half pn9-right">
        <img src="/landing-hero/hero-right-hd.webp" alt="" decoding="async" draggable={false} fetchPriority="high"/>
      </div>
      <div className="pn9-text-shield"/>
    </div>
  );
}
