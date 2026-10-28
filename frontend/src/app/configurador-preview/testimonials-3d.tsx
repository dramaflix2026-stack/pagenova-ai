const samples=[
 {initials:"AM",name:"Ana Martins",role:"Exemplo ilustrativo",text:"Uma experiência mais simples para organizar minhas ferramentas.",tilt:"-rotate-3",color:"from-emerald-400 to-lime-300"},
 {initials:"RC",name:"Rafael Costa",role:"Exemplo ilustrativo",text:"Tudo em um só lugar, com um visual fácil de entender.",tilt:"rotate-2",color:"from-sky-400 to-emerald-300"},
 {initials:"BL",name:"Beatriz Lima",role:"Exemplo ilustrativo",text:"Gostei da liberdade de escolher apenas o que preciso.",tilt:"-rotate-2",color:"from-lime-400 to-teal-300"}
];
export default function Testimonials3D(){
 return <section id="depoimentos" aria-labelledby="testimonials-title" className="relative mt-16 scroll-mt-24 border-t border-white/15 py-14 sm:py-20">
  <div className="pointer-events-none absolute -right-16 top-8 h-44 w-44 rounded-full bg-[#b9f77a]/5 blur-[60px]" aria-hidden="true"/>
  <div className="relative grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
   <div><span className="text-[11px] font-extrabold uppercase tracking-[.24em] text-[#b9f77a]">A experiência PageNova</span><h2 id="testimonials-title" className="mt-3 max-w-sm text-3xl font-black leading-tight tracking-tight sm:text-4xl">Tecnologia que aproxima você dos resultados.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-white/55">Veja como podem ser apresentadas as experiências de clientes nesta seção.</p><p className="mt-5 inline-flex rounded-full border border-amber-300/20 bg-amber-200/5 px-3 py-1.5 text-[11px] text-amber-100/75">Depoimentos ilustrativos — aguardando avaliações verificadas</p></div>
   <div className="relative mx-auto flex w-full max-w-[600px] flex-col gap-6 px-2 py-6 sm:px-5 [perspective:1000px]">
    <div className="pointer-events-none absolute inset-8 rounded-full bg-[#b9f77a]/10 blur-[70px]" aria-hidden="true"/>
    {samples.map((sample,index)=><article key={sample.name} className={`pn-testimonial-card group relative flex items-center gap-4 rounded-full border border-[#b9f77a]/30 bg-[linear-gradient(110deg,rgba(33,54,38,.96),rgba(16,27,20,.97)_65%,rgba(49,75,47,.85))] px-4 py-5 shadow-[0_20px_35px_rgba(0,0,0,.42),inset_0_1px_0_rgba(220,255,206,.16)] backdrop-blur-xl transition-transform duration-500 hover:!rotate-0 hover:scale-[1.025] sm:px-6 ${sample.tilt}`} style={{animationDelay:`${index*160}ms`}}>
     <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-[#b9f77a]/50 bg-gradient-to-br ${sample.color} text-sm font-black text-[#102012] shadow-[0_0_22px_rgba(185,247,122,.25)] sm:h-16 sm:w-16`}>{sample.initials}</div>
     <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><strong className="text-sm font-bold text-[#d9ffb8]">{sample.name}</strong><span aria-label="Cinco estrelas decorativas" className="text-[11px] tracking-[.1em] text-[#d6ff75]">★★★★★</span></div><p className="mt-1 text-[11px] text-white/60">{sample.role}</p><p className="mt-1 text-xs leading-5 text-white/90 sm:text-sm">{sample.text}</p></div>
     <span aria-hidden="true" className="absolute inset-0 rounded-full border border-[#b9f77a]/0 transition-colors group-hover:border-[#b9f77a]/45"/>
    </article>)}
   </div>
  </div>
 </section>;
}
