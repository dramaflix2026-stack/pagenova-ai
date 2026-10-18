"use client";

import { useEffect } from "react";
import { ArrowUpRight, CalendarDays, Check, ContactRound, LayoutTemplate, MousePointer2, Sparkles } from "lucide-react";

const demonstrations = [
  {
    number: "01",
    title: "Sites e páginas com IA",
    description: "Do briefing ao primeiro layout editável, em um único fluxo.",
  },
  {
    number: "02",
    title: "Clonagem e editor visual",
    description: "Parta de uma URL e personalize textos, imagens e seções.",
  },
  {
    number: "03",
    title: "CRM e agenda",
    description: "Leads, etapas comerciais e compromissos organizados.",
  },
] as const;

function ProductPreview({type}:{type:number}){
  if(type===0) return <div className="relative flex min-h-[235px] flex-col overflow-hidden bg-[#edf4ee] text-[#113327]">
    <div className="flex h-10 items-center gap-2 border-b border-[#c6dcd0] bg-white/80 px-4">
      <span className="h-2 w-2 rounded-full bg-[#8fec78]"/><span className="h-2 w-2 rounded-full bg-[#bddacb]"/>
      <span className="ml-auto rounded-full bg-[#d6f5e5] px-2 py-1 text-[10px] font-semibold text-[#3e7838]">Prévia do site</span>
    </div>
    <div className="grid flex-1 grid-cols-[1.14fr_.86fr] items-center gap-3 p-5">
      <div>
        <span className="inline-flex rounded-full bg-[#d5f0df] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#3e7838]">Site profissional</span>
        <div className="mt-3 max-w-[185px] text-[22px] font-bold leading-[1.14] tracking-tight">Sua marca com presença digital.</div>
        <div className="mt-3 h-2 w-full max-w-40 rounded bg-[#c6d9cb]"/>
        <div className="mt-1.5 h-2 w-3/4 max-w-32 rounded bg-[#d7e3d8]"/>
        <div className="mt-4 inline-flex items-center gap-1 rounded-lg bg-[#3e7838] px-3 py-2 text-[10px] font-bold text-white">Saiba mais <ArrowUpRight className="h-3 w-3"/></div>
      </div>
      <div className="relative flex h-[154px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#acd9be] to-[#4eac86] shadow-[0_15px_35px_rgba(26,101,66,.20)]">
        <LayoutTemplate className="h-14 w-14 text-white/90" strokeWidth={1.2}/>
        <div className="absolute -bottom-2 -left-3 flex items-center gap-1 rounded-lg border border-white/70 bg-white px-2 py-1.5 text-[9px] font-semibold shadow-md">
          <Check className="h-3 w-3 text-[#467f3b]"/> Layout criado
        </div>
      </div>
    </div>
  </div>;
  if(type===1) return <div className="relative min-h-[235px] overflow-hidden bg-[#eaf1ec] p-4 text-[#143729]">
    <div className="rounded-2xl border border-[#cfdfd5] bg-white p-3 shadow-[0_14px_30px_rgba(12,55,37,.09)]">
      <div className="flex items-center gap-2 border-b border-[#e1eae3] pb-2">
        <span className="h-2 w-2 rounded-full bg-[#8fec78]"/>
        <span className="h-2 w-2 rounded-full bg-[#d9eadf]"/>
        <div className="ml-1 h-4 flex-1 rounded bg-[#f2f5f2] px-2 text-[9px] leading-4 text-[#668174]">seudominio.com.br</div>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_1.15fr] gap-3">
        <div className="space-y-2">
          <div className="h-3 w-4/5 rounded bg-[#174c37]"/>
          <div className="h-3 w-full rounded bg-[#174c37]"/>
          <div className="mt-2 h-2 w-full rounded bg-[#d6e0d6]"/>
          <div className="h-2 w-4/5 rounded bg-[#d6e0d6]"/>
          <div className="mt-4 h-6 w-1/2 rounded-md bg-[#8fec78]"/>
        </div>
        <div className="relative h-[123px] rounded-lg bg-gradient-to-br from-[#cceadb] to-[#7bbfa0]">
          <span className="absolute -right-1 -top-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[9px] font-bold text-[#3e7838] shadow">Editar <MousePointer2 className="h-3 w-3"/></span>
          <div className="absolute inset-5 rounded border-2 border-dashed border-[#3e7838]/50"/>
        </div>
      </div>
    </div>
    <div className="absolute bottom-5 right-6 flex items-center gap-2 rounded-xl border border-[#a6d8b9] bg-[#f9fdf9] px-3 py-2 text-[10px] font-bold text-[#3e7838] shadow-lg">
      <Sparkles className="h-4 w-4"/> Textos e imagens editáveis
    </div>
  </div>;
  return <div className="min-h-[235px] bg-[#eaf3ee] p-4 text-[#153829]">
    <div className="grid grid-cols-[1.1fr_.9fr] gap-3">
      <div className="rounded-2xl border border-[#d4e3d9] bg-white p-3 shadow-[0_10px_22px_rgba(21,78,49,.07)]">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold"><ContactRound className="h-4 w-4 text-[#467f3b]"/> Pipeline comercial</div>
        {[
          ["Novo contato","#d6f7e5"],["Em negociação","#cbefe0"],["Fechamento","#b5e7cf"],
        ].map(([name,color])=><div key={name} className="mb-2 rounded-lg border border-[#e5eee7] p-2">
          <div className="h-1.5 w-12 rounded" style={{background:color}}/>
          <span className="mt-1 block text-[9px] font-medium">{name}</span>
        </div>)}
      </div>
      <div className="rounded-2xl border border-[#d4e3d9] bg-white p-3 shadow-[0_10px_22px_rgba(21,78,49,.07)]">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold"><CalendarDays className="h-4 w-4 text-[#467f3b]"/> Agenda</div>
        <div className="grid grid-cols-7 gap-1">{Array.from({length:28},(_,i)=><span key={i} className={"grid aspect-square place-items-center rounded text-[7px] "+(i===17?"bg-[#8fec78] font-bold text-white":"bg-[#edf4ef] text-[#668071]")}>{i+1}</span>)}</div>
        <div className="mt-3 rounded bg-[#daf3e4] px-2 py-1.5 text-[9px] font-semibold text-[#187653]">Compromisso organizado</div>
      </div>
    </div>
  </div>;
}

export function PageNovaLandingMotion() {
  useEffect(() => {
    if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.querySelector(".pn-landing-v2");
    if (!root) return;
    const elements = Array.from(root.querySelectorAll(
      "section h1, section h2, section > div > p, section article, section details, section [data-pn-motion]"
    )).filter(element=>element.getBoundingClientRect().top>window.innerHeight*.85);
    elements.forEach(element=>element.classList.add("pn-reveal"));
    const observer = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add("pn-visible");
        observer.unobserve(entry.target);
      });
    },{threshold:.08,rootMargin:"0px 0px -35px 0px"});
    elements.forEach(element=>observer.observe(element));
    return ()=>{
      elements.forEach(element=>element.classList.remove("pn-reveal"));
      observer.disconnect();
    };
  },[]);
  return null;
}

const demoVideoPaths=["/videos/GERARSITEIA.mp4","/videos/CLONAR.mp4","/videos/CRM.mp4"] as const;

function DemonstrationVideo({index}:{index:number}){
  const [available,setAvailable]=useState(true);
  return <div className="relative aspect-video overflow-hidden bg-[#0b1510]">
    {available?<video
      className="h-full w-full object-contain"
      controls playsInline preload="metadata"
      aria-label={"Demonstração: "+demonstrations[index].title}
      onError={()=>setAvailable(false)}
      src={demoVideoPaths[index]}
    />:<div className="relative h-full w-full"><ProductPreview type={index}/><span className="absolute bottom-3 left-3 rounded-lg bg-[#0b1510]/90 px-3 py-1.5 text-xs text-white/90">Vídeo em preparação</span></div>}
  </div>;
}

export function PageNovaVideoShowcase(){
  return <section id="demonstracoes" className="scroll-mt-20 border-t border-white/[.08] bg-[#07140d] py-14 text-white md:py-24">
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#62e1ad]">Conheça por dentro</span>
          <h2 className="mt-4 max-w-xl text-[clamp(2.1rem,4vw,3.4rem)] font-semibold leading-[1.1] tracking-[-.05em]">Veja o que você pode construir.</h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-white/60 lg:justify-self-end">
          Veja demonstrações das ferramentas disponíveis. Crie páginas, personalize o resultado e organize seus projetos e contatos.
        </p>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {demonstrations.map((demo,index)=><article key={demo.number}
          className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0d2116] transition duration-300 hover:-translate-y-1 hover:border-[#65deb0]/50 hover:shadow-[0_18px_38px_rgba(0,0,0,.22)]">
          <DemonstrationVideo index={index}/>
          <div className="border-t border-white/10 p-5">
            <span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#68e2af]">{demo.number} / FUNCIONALIDADE</span>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">{demo.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-white/60">{demo.description}</p>
          </div>
        </article>)}
      </div>
      <p className="mt-4 text-center text-xs text-white/45">Conheça as funcionalidades e explore tudo na plataforma.</p>
    </div>
  </section>;
}
