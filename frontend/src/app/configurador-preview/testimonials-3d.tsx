"use client";
import { useEffect, useState } from "react";
const TOTAL=12;
const numbers=Array.from({length:TOTAL},(_,i)=>i+1);
const endpoint="/api/configurador-preview/testimonials";
const fallback=(n:number)=>`https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/configurador-preview/depoimentos/conversa-${String(n).padStart(2,"0")}.png`;
export default function Testimonials3D(){
 const [images,setImages]=useState<Record<number,string>>({});
 useEffect(()=>{let active=true;fetch(endpoint,{cache:"no-store",signal:AbortSignal.timeout(12000)}).then(async r=>{if(!r.ok)throw Error("storage");return r.json() as Promise<{images:Record<number,string>}>;}).then(data=>{if(active)setImages(data.images||{});}).catch(()=>{});return()=>{active=false;};},[]);
 const ready=numbers.filter(n=>images[n]);
 return <section id="depoimentos" aria-labelledby="testimonials-title" className="pn-section-divider relative mt-20 scroll-mt-24 overflow-hidden py-16 sm:py-20">
 <div className="mx-auto mb-10 grid max-w-[1180px] gap-6 px-5 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-14"><div className="pt-2 text-xs font-extrabold uppercase tracking-[.2em] text-[#b9f77a]">04 <span className="mx-3 text-white/35">—</span> Experiências</div><h2 id="testimonials-title" className="max-w-[850px] text-4xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl">Veja como a <span className="text-[#b9f77a]">PageNova funciona na prática.</span></h2></div>
 <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-white/10 py-6" aria-label="Depoimentos em imagens">
 {ready.length>0?<div className="pn-testimonials-track pn-testimonials-ready flex w-max gap-4 px-4">{[...ready,...ready].map((number,index)=><div key={index} className="aspect-[9/16] w-[225px] shrink-0 overflow-hidden rounded-[18px] border border-white/15 bg-[#111c14] sm:w-[265px] lg:w-[300px]"><img src={images[number]} alt={index<ready.length?`Conversa demonstrativa ${number}`:""} className="h-full w-full object-contain" decoding="async"/></div>)}</div>:<div className="min-h-[260px] grid place-items-center text-sm text-white/50">Depoimentos em preparação.</div>}
 </div>
 <style>{`@keyframes pnTestimonialScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}.pn-testimonials-ready{animation:pnTestimonialScroll 80s linear infinite}.pn-testimonials-ready:hover{animation-play-state:paused}@media(prefers-reduced-motion:reduce){.pn-testimonials-ready{animation:none;max-width:100vw;overflow-x:auto}}`}</style>
 </section>;
}