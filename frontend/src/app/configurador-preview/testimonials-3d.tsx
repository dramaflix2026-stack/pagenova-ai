"use client";
import { useState } from "react";

// Os 12 arquivos devem ser publicados neste diretório, sem alterar a numeração.
const screenshots = Array.from({length:12},(_,index)=>({
 number:index+1,
 src:`/testimonials/pagenova-conversa-${String(index+1).padStart(2,"0")}.webp`
}));

function ConversationCard({number,src,duplicate}:{number:number;src:string;duplicate:boolean}){
 const [failed,setFailed]=useState(false);
 return <div aria-hidden={duplicate} className="relative aspect-[9/16] w-[220px] shrink-0 overflow-hidden rounded-[18px] border border-white/15 bg-[#111c14] shadow-[0_12px_36px_rgba(0,0,0,.4)] sm:w-[265px] lg:w-[300px]">
  {!failed ? <img src={src} alt={`Exemplo ilustrativo de conversa ${number} sobre a PageNova AI`} loading={duplicate?"lazy":"eager"} decoding="async" onError={()=>setFailed(true)} className="h-full w-full object-contain"/> : <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"><span className="text-4xl font-black text-[#b9f77a]">{String(number).padStart(2,"0")}</span><span className="text-sm font-semibold text-white/80">Conversa ilustrativa em preparação</span></div>}
 </div>;
}
export default function Testimonials3D(){
 return <section id="depoimentos" aria-labelledby="testimonials-title" className="pn-section-divider relative mt-20 scroll-mt-24 overflow-hidden py-16 sm:py-20">
  <div className="mx-auto mb-10 grid max-w-[1180px] gap-6 px-5 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-14">
   <div className="pt-2 text-xs font-extrabold uppercase tracking-[.2em] text-[#b9f77a]">04 <span className="mx-3 text-white/35">—</span> Experiências</div>
   <div><h2 id="testimonials-title" className="max-w-[850px] text-4xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl">Veja como a <span className="text-[#b9f77a]">PageNova funciona na prática.</span></h2><p className="mt-4 text-sm font-medium text-[#d9ffb8]">Conversas demonstrativas criadas com IA. Não representam clientes nem resultados reais.</p></div>
  </div>
  <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-white/10 py-6" aria-label="Galeria de 12 conversas ilustrativas">
   <div className="pn-testimonials-track flex w-max gap-4 px-4">
    {[...screenshots,...screenshots].map((item,index)=><ConversationCard key={index} {...item} duplicate={index>=screenshots.length}/>)}
   </div>
  </div>
  <style>{`@keyframes pnTestimonialScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}.pn-testimonials-track{animation:pnTestimonialScroll 110s linear infinite}.pn-testimonials-track:hover{animation-play-state:paused}@media(prefers-reduced-motion:reduce){.pn-testimonials-track{animation:none;max-width:100vw;overflow-x:auto}}`}</style>
 </section>;
}
