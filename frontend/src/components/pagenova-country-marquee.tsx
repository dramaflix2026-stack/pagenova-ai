type Language="pt"|"en"|"es";
const entries=[
 ["br","Brasil"],["us","Estados Unidos"],["pt","Portugal"],["ca","Canadá"],
 ["mx","México"],["es","Espanha"],["ar","Argentina"],["cl","Chile"],
 ["co","Colômbia"],["pe","Peru"],["gb","Reino Unido"],["fr","França"],
 ["de","Alemanha"],["it","Itália"],["au","Austrália"]
] as const;
const translations={
 pt:{title:"Explore oportunidades em diferentes países",detail:"Busca internacional de empresas pelo Google Places. A interface comercial está disponível em português, inglês e espanhol."},
 en:{title:"Explore business opportunities across countries",detail:"International business discovery through Google Places. The commercial website is available in Portuguese, English and Spanish."},
 es:{title:"Explora oportunidades comerciales en distintos países",detail:"Búsqueda internacional de empresas con Google Places. El sitio comercial está disponible en portugués, inglés y español."}
} as const;
export function PageNovaCountryMarquee({lang="pt"}:{lang?:Language}){
 const msg=translations[lang];
 return <aside aria-label={msg.title} className="pn-country-marquee relative isolate w-full min-w-0 overflow-hidden border-y border-[#8fec78]/15 bg-[#111e16] py-5">
  <div className="mx-auto max-w-7xl px-5 md:px-8">
   <p className="text-center text-[10px] font-bold uppercase tracking-[.18em] text-[#8fec78] sm:text-xs">{msg.title}</p>
  </div>
  <div className="relative mt-4 w-full min-w-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
   <div className="pn-country-marquee-track flex w-max items-center gap-3">
    {[0,1].map((copy)=><div key={copy} className="flex shrink-0 items-center gap-3" aria-hidden={copy===1?"true":undefined}>
     {entries.map(([code,name])=><span key={name} className="inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-[#8fec78]/20 bg-[#1b2d20] px-3.5 py-2 text-xs font-semibold text-[#eef6eb] sm:min-h-11 sm:px-4 sm:text-sm">
      <img src={`https://flagcdn.com/w40/${code}.png`} width={26} height={19} alt="" loading="lazy" decoding="async" className="h-[18px] w-[26px] shrink-0 rounded-[2px] object-cover shadow-sm" />{name}
     </span>)}
    </div>)}
   </div>
  </div>
  <p className="mx-auto mt-3 max-w-4xl px-5 text-center text-[11px] leading-5 text-white/50">{msg.detail}</p>
 </aside>;
}
