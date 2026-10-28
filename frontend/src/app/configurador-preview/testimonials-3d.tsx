const examples=[
 {initials:"AM",name:"Ana Martins",text:"Uma experiência mais simples para organizar minhas ferramentas."},
 {initials:"RC",name:"Rafael Costa",text:"Tudo em um só lugar, com um visual fácil de entender."},
 {initials:"BL",name:"Beatriz Lima",text:"Gostei da liberdade de escolher apenas o que preciso."},
 {initials:"JP",name:"João Pereira",text:"Consigo visualizar minhas soluções em um só painel."},
 {initials:"CS",name:"Carla Souza",text:"A proposta de escolher cada ferramenta faz muito sentido."},
 {initials:"LM",name:"Lucas Mendes",text:"Uma forma prática de planejar as ferramentas do meu negócio."}
];
export default function Testimonials3D(){
 return <section id="depoimentos" aria-labelledby="testimonials-title" className="pn-section-divider relative mt-20 scroll-mt-24 overflow-hidden py-16 sm:py-20">
  <div className="mx-auto mb-10 grid max-w-[1180px] gap-6 lg:grid-cols-[220px_1fr] lg:gap-14">
   <div className="pt-2 text-xs font-extrabold uppercase tracking-[.2em] text-[#b9f77a]">03 <span className="mx-3 text-white/35">—</span> Experiências</div>
   <div><h2 id="testimonials-title" className="max-w-[850px] text-4xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl">O que importa é a <span className="text-[#b9f77a]">experiência de quem usa.</span></h2><p className="mt-5 max-w-[680px] text-base leading-7 text-white/75">Um espaço para mostrar histórias de quem cria, organiza e cresce com a PageNova AI.</p><p className="mt-4 text-xs font-medium text-[#d9ffb8]">Demonstração visual: os exemplos abaixo não são avaliações reais.</p></div>
  </div>
  <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-white/10 py-6" aria-label="Exemplos ilustrativos de depoimentos">
   <div className="pn-testimonials-track flex w-max gap-4 px-4 motion-reduce:animate-none">
    {[...examples,...examples].map((sample,index)=><article key={index} aria-hidden={index>=examples.length} className="flex h-[310px] w-[235px] shrink-0 flex-col justify-between overflow-hidden rounded-[20px] border border-[#b9f77a]/25 bg-[#111c14] p-5 shadow-[0_12px_36px_rgba(0,0,0,.45)] sm:h-[350px] sm:w-[260px]">
     <div className="flex items-center justify-between"><div className="grid h-12 w-12 place-items-center rounded-full bg-[#b9f77a] text-sm font-black text-[#10210d]">{sample.initials}</div><span className="text-xl text-[#b9f77a]" aria-hidden="true">“</span></div>
     <p className="text-lg font-semibold leading-7 text-white">{sample.text}</p>
     <div className="border-t border-white/15 pt-4"><strong className="block text-sm font-bold text-[#d9ffb8]">{sample.name}</strong><span className="mt-1 block text-xs text-white/70">Exemplo ilustrativo</span></div>
    </article>)}
   </div>
  </div>
  <style>{`@keyframes pnTestimonialScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}.pn-testimonials-track{animation:pnTestimonialScroll 46s linear infinite}.pn-testimonials-track:hover{animation-play-state:paused}@media(prefers-reduced-motion:reduce){.pn-testimonials-track{animation:none}}`}</style>
 </section>;
}
