const samples=[
 {initials:"AM",name:"Ana Martins",role:"Exemplo ilustrativo",text:"Uma experiência mais simples para organizar minhas ferramentas.",tilt:"-rotate-2",color:"from-emerald-400 to-lime-300"},
 {initials:"RC",name:"Rafael Costa",role:"Exemplo ilustrativo",text:"Tudo em um só lugar, com um visual fácil de entender.",tilt:"rotate-1",color:"from-sky-400 to-emerald-300"},
 {initials:"BL",name:"Beatriz Lima",role:"Exemplo ilustrativo",text:"Gostei da liberdade de escolher apenas o que preciso.",tilt:"-rotate-1",color:"from-lime-400 to-teal-300"}
];
export default function Testimonials3D(){
 return <section id="depoimentos" aria-labelledby="testimonials-title" className="pn-section-divider relative mt-16 scroll-mt-24 py-14 sm:py-20">
  <div className="pointer-events-none absolute -right-16 top-8 h-44 w-44 rounded-full bg-[#b9f77a]/5 blur-[60px]" aria-hidden="true"/>
  <div className="relative grid items-center gap-12 lg:grid-cols-[.85fr_1.15fr]">
   <div><span className="text-[11px] font-extrabold uppercase tracking-[.24em] text-[#b9f77a]">A experiência PageNova</span><h2 id="testimonials-title" className="mt-3 max-w-sm text-3xl font-black leading-tight tracking-tight sm:text-4xl">Tecnologia que aproxima você dos resultados.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-white/55">Um espaço para compartilhar histórias reais de quem cria e cresce com a PageNova.</p><p className="mt-5 inline-flex rounded-full border border-amber-300/20 bg-amber-200/5 px-3 py-1.5 text-[11px] text-amber-100/75">Depoimentos ilustrativos — aguardando avaliações verificadas</p></div>
   <div className="relative mx-auto flex w-full max-w-[600px] flex-col gap-5 px-2 py-8 sm:px-5 [perspective:1000px]">
    <div className="pointer-events-none absolute inset-8 rounded-full bg-[#b9f77a]/10 blur-[70px]" aria-hidden="true"/>
    {samples.map((sample,index)=><article key={sample.name} className={`pn-testimonial-card group relative flex items-center gap-4 rounded-[28px] border border-[#b9f77a]/30 px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,.5),0_0_28px_rgba(114,255,120,.07),inset_0_1px_0_rgba(220,255,206,.13)] backdrop-blur-xl transition-transform duration-500 hover:!rotate-0 hover:scale-[1.025] hover:border-[#b9f77a]/60 sm:px-6 ${sample.tilt}`} style={{animationDelay:`${index*160}ms`,background:"linear-gradient(112deg, #1b2e20 0%, #0c1811 65%, #213822 100%)",color:"#f5fff3"}}>
     <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-[#b9f77a]/60 bg-gradient-to-br ${sample.color} text-sm font-black text-[#102012] shadow-[0_0_22px_rgba(185,247,122,.25)] sm:h-16 sm:w-16`}>{sample.initials}</div>
     <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><strong className="text-sm font-bold !text-[#d9ffb8]">{sample.name}</strong><span aria-label="Estrelas ilustrativas, não representam avaliações reais" className="text-[11px] tracking-[.1em] text-[#d6ff75]">★★★★★</span></div><p className="mt-1 text-[11px] !text-[#b8c9b8]">{sample.role}</p><p className="mt-1 text-xs leading-5 !text-white sm:text-sm">{sample.text}</p></div>
     <span aria-hidden="true" className="absolute inset-0 rounded-[28px] border border-[#b9f77a]/0 transition-colors group-hover:border-[#b9f77a]/45"/>
    </article>)}
   </div>
  </div>
 </section>;
}
