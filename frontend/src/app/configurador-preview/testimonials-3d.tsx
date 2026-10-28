"use client";
const imageNames=[
  "Conversa de sucesso da Boutique Elegance.png",
  "Conversa de Sucesso na Academia.png",
  "Conversa sobre resultados da PageNova AI.png",
  "Depoimento de Cliente no WhatsApp (1).png",
  "Depoimento de Cliente no WhatsApp (2).png",
  "Depoimento de Cliente no WhatsApp (3).png",
  "Depoimento de Cliente no WhatsApp (4).png",
  "Depoimento de Cliente no WhatsApp.png",
  "Depoimento de sucesso no WhatsApp (1).png",
  "Depoimento de Sucesso no WhatsApp.png",
  "Depoimento PetLove no WhatsApp.png"
];
const images=imageNames.map(name=>"https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/configurador-preview/depoimentos/"+encodeURIComponent(name));
export default function Testimonials3D(){
return <section id="depoimentos" aria-labelledby="testimonials-title" className="pn-section-divider relative mt-12 scroll-mt-24 overflow-hidden py-10 sm:mt-20 sm:py-20">
<div className="mx-auto mb-6 grid max-w-[1180px] gap-6 px-5 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-14"><div className="pt-2 text-xs font-extrabold uppercase tracking-[.2em] text-[#b9f77a]">04 <span className="mx-3 text-white/35">—</span> Experiências</div><h2 id="testimonials-title" className="max-w-[850px] text-[clamp(1.9rem,8vw,2.5rem)] font-black leading-[1.12] tracking-tight text-white sm:text-5xl">Veja como a <span className="text-[#b9f77a]">PageNova funciona na prática.</span></h2></div>
<div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-white/10 py-6" aria-label="Depoimentos em imagens">
<div className="pn-testimonials-track pn-testimonials-ready flex w-max gap-4 px-4">{[...images,...images].map((src,index)=><div key={index} className="aspect-[9/16] w-[205px] shrink-0 overflow-hidden rounded-[18px] border border-white/15 bg-[#111c14] sm:w-[265px] lg:w-[300px]"><img src={src} alt={index<images.length?`Depoimento de cliente ${index+1}`:""} className="h-full w-full object-contain" decoding="async" loading={index<3?"eager":"lazy"}/></div>)}</div>
</div>
<style>{`@keyframes pnTestimonialScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}.pn-testimonials-ready{animation:pnTestimonialScroll 80s linear infinite}.pn-testimonials-ready:hover{animation-play-state:paused}@media(prefers-reduced-motion:reduce){.pn-testimonials-ready{animation:none;max-width:100vw;overflow-x:auto}}`}</style>
</section>;
}