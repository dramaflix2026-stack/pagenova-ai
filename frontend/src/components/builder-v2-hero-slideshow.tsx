"use client";

import {useEffect,useState,type ReactNode} from "react";

export type HeroBannerSlide={
  id:string;
  src:string;
  mobileSrc?:string;
  title?:string;
  description?:string;
  buttonText?:string;
  buttonHref?:string;
  imageFit?:"cover"|"contain";
  imagePosition?:string;
};

/**
 * One hero, several independent full-size banners. No photo is rendered as a
 * second stacked image or an extra section. Slide 1 receives the original
 * approved heading/paragraph/buttons verbatim through firstContent.
 */
export function BuilderV2HeroSlideshow({
  slides,firstContent,firstAlign="left"
}:{
  slides:HeroBannerSlide[];firstContent:ReactNode;firstAlign?:"left"|"center"|"right";
}){
  const [active,setActive]=useState(0);
  const [paused,setPaused]=useState(false);
  useEffect(()=>{setActive(i=>Math.min(i,Math.max(0,slides.length-1)));},[slides.length]);
  useEffect(()=>{
    if(slides.length<2||paused||typeof window==="undefined")return;
    if(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)return;
    const timer=window.setInterval(()=>{
      if(!document.hidden)setActive(i=>(i+1)%slides.length);
    },8000);
    return ()=>window.clearInterval(timer);
  },[slides.length,paused]);
  if(!slides.length)return null;
  const go=(direction:number)=>setActive(i=>(i+direction+slides.length)%slides.length);
  const align=firstAlign==="center"?"items-center text-center":firstAlign==="right"?"items-end text-right":"items-start text-left";
  return <div
    className="pn-hero-slideshow relative isolate min-h-[510px] w-full overflow-hidden rounded-xl bg-[#14202a] text-white sm:min-h-[600px] lg:min-h-[660px]"
    role="region" aria-roledescription="carrossel" aria-label="Banners da capa"
    onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
    onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setPaused(false);}}
  >
    {slides.map((slide,index)=>
      <div key={slide.id} aria-hidden={index!==active} inert={index!==active}
        className={"absolute inset-0 transition-opacity duration-700 ease-in-out "+(index===active?"z-10 opacity-100":"z-0 opacity-0 pointer-events-none")}>
        <picture className="pn-hero-slide-picture absolute inset-0 block h-full w-full" aria-hidden="true">
          {slide.mobileSrc&&<source media="(max-width:767px)" srcSet={slide.mobileSrc}/>}
          <img src={slide.src} alt="" loading={index===0?"eager":"lazy"}
            className="block h-full w-full" style={{objectFit:slide.imageFit||"cover",objectPosition:slide.imagePosition||"center"}}/>
        </picture>
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#08121ce0] via-[#09131bb7] to-[#09131b69] max-sm:bg-gradient-to-t max-sm:from-[#08121ce8] max-sm:via-[#09131bad] max-sm:to-[#07131b69]"/>
        <div className={"relative mx-auto flex min-h-[510px] w-full max-w-6xl flex-col justify-center px-5 py-20 sm:min-h-[600px] sm:px-10 lg:min-h-[660px] lg:px-14 "+(index===0?align:"items-start text-left")}>
          {index===0?
            <div className="w-full max-w-4xl space-y-5 sm:space-y-7">{firstContent}</div>
            :<div className="w-full max-w-[740px] space-y-5 text-left sm:space-y-7">
              <span className="inline-block text-xs font-semibold uppercase tracking-[.22em] text-white/70">Conheça nosso trabalho</span>
              <h2 className="max-w-3xl font-serif text-[clamp(2rem,5vw,4.5rem)] font-medium leading-[1.05] tracking-[-.045em] text-white">{slide.title||"Novas perspectivas para seus espaços"}</h2>
              <p className="max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">{slide.description||"Explore possibilidades que unem estética, funcionalidade e atenção aos detalhes."}</p>
              {slide.buttonText&&slide.buttonHref&&/^(#|https?:\/\/|mailto:|tel:)/i.test(slide.buttonHref)&&
                <a className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#e0b750] px-7 py-3 text-sm font-semibold text-[#14202a]" href={slide.buttonHref}>{slide.buttonText}</a>}
            </div>}
        </div>
      </div>)}
    <div className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-between gap-3 px-4 sm:bottom-7 sm:px-8" aria-label="Controles dos banners">
      <button type="button" aria-label="Banner anterior" onClick={()=>go(-1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/45 bg-[#14202a99] text-xl text-white backdrop-blur-sm hover:bg-white/25">‹</button>
      <div className="flex items-center justify-center gap-2">
        {slides.map((slide,index)=><button type="button" key={slide.id}
          aria-label={"Mostrar banner "+(index+1)} aria-current={active===index?"true":undefined}
          onClick={()=>setActive(index)}
          className={"h-2.5 rounded-full transition-all "+(active===index?"w-8 bg-white":"w-2.5 bg-white/55 hover:bg-white/80")}/>)}
      </div>
      <button type="button" aria-label="Próximo banner" onClick={()=>go(1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/45 bg-[#14202a99] text-xl text-white backdrop-blur-sm hover:bg-white/25">›</button>
    </div>
  </div>;
}
