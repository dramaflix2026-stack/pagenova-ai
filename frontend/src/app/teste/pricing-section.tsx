"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Layers3, Sparkles } from "lucide-react";
import "./pricing-section.css";

type Lang = "pt" | "en" | "es";
type Plan = "studio" | "crm" | "apps" | "complete";

const plans: { key: Plan; monthly: number; featured?: boolean }[] = [
  {key:"studio", monthly:207},
  {key:"crm", monthly:247},
  {key:"apps", monthly:397},
  {key:"complete", monthly:597, featured:true}
];

const texts = {
  pt: {
    eyebrow:"PLANOS PAGE NOVA", title:"Uma escolha. Novas", highlight:"possibilidades.",
    desc:"Escolha a ferramenta certa para seu momento ou reúna o ecossistema PageNova em uma única assinatura.",
    per:"/mês", currency:"R$", featureLabel:"O que você encontra", featured:"PLANO EM DESTAQUE",
    action:"Escolher plano", pending:"Página de contratação em preparação", note:"Valores apresentados em reais (BRL), por mês. As páginas de contratação serão disponibilizadas posteriormente. A área de Apps e Sistemas continua em evolução.",
    items:{
      studio:{name:"PageNova Studio",description:"Para criar e personalizar sua presença digital.",features:["Sites e landing pages","Modelos por nicho","Personalização com IA"]},
      crm:{name:"PageNova CRM",description:"Para prospectar e organizar oportunidades comerciais.",features:["Pesquisa de empresas","Gestão de leads","Oportunidades comerciais"]},
      apps:{name:"Apps e Sistemas",description:"Para acompanhar novas soluções digitais da plataforma.",features:["Soluções digitais","Aplicativos e sistemas","Recursos em evolução"]},
      complete:{name:"PageNova Completa",description:"Para explorar as frentes da PageNova em um só lugar.",features:["PageNova Studio","PageNova CRM","Apps e Sistemas (em evolução)"]}
    }
  },
  en: {
    eyebrow:"PAGENOVA PLANS",title:"One choice. New",highlight:"possibilities.",
    desc:"Choose the right tool for your goals or bring together the PageNova ecosystem in one subscription.",
    per:"/month",currency:"R$",featureLabel:"What it includes",featured:"FEATURED PLAN",
    action:"Select plan",pending:"Checkout page coming soon",note:"Prices shown in Brazilian reais (BRL), billed monthly. Checkout pages will be added later. Apps & Systems remains in development.",
    items:{
      studio:{name:"PageNova Studio",description:"Build and personalize your digital presence.",features:["Websites and landing pages","Industry-focused templates","AI customization"]},
      crm:{name:"PageNova CRM",description:"Discover and organize sales opportunities.",features:["Business discovery","Lead management","Sales opportunities"]},
      apps:{name:"Apps & Systems",description:"Explore PageNova's expanding digital solutions.",features:["Digital solutions","Apps and systems","Features in development"]},
      complete:{name:"PageNova Complete",description:"Explore the PageNova ecosystem together.",features:["PageNova Studio","PageNova CRM","Apps & Systems (evolving)"]}
    }
  },
  es: {
    eyebrow:"PLANES PAGENOVA",title:"Una elección. Nuevas",highlight:"posibilidades.",
    desc:"Elige la herramienta ideal para ti o reúne el ecosistema PageNova en una suscripción.",
    per:"/mes",currency:"R$",featureLabel:"Qué incluye",featured:"PLAN DESTACADO",
    action:"Elegir plan",pending:"Página de contratación próximamente",note:"Precios en reales brasileños (BRL), por mes. Las páginas de contratación se añadirán después. Apps y Sistemas sigue en desarrollo.",
    items:{
      studio:{name:"PageNova Studio",description:"Crea y personaliza tu presencia digital.",features:["Sitios web y landing pages","Plantillas por sector","Personalización con IA"]},
      crm:{name:"PageNova CRM",description:"Encuentra y organiza oportunidades comerciales.",features:["Búsqueda de empresas","Gestión de leads","Oportunidades comerciales"]},
      apps:{name:"Apps y Sistemas",description:"Conoce nuevas soluciones digitales de la plataforma.",features:["Soluciones digitales","Aplicaciones y sistemas","Funciones en desarrollo"]},
      complete:{name:"PageNova Completa",description:"Explora el ecosistema PageNova en un solo lugar.",features:["PageNova Studio","PageNova CRM","Apps y Sistemas (en desarrollo)"]}
    }
  }
} as const;

export function PricingSection() {
  const [lang,setLang] = useState<Lang>("pt");
  useEffect(()=>{
    const sync=()=>{
      const l=document.documentElement.lang.toLowerCase();
      setLang(l.startsWith("en")?"en":l.startsWith("es")?"es":"pt");
    };
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
    return ()=>observer.disconnect();
  },[]);
  const t=texts[lang];
  return (
    <section id="planos" className="pn6-section relative isolate overflow-hidden border-t border-white/10 bg-[#080d09] px-5 py-12 text-white sm:px-8 sm:py-20 lg:py-24">
      <div className="pn6-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1270px]">
        <header className="mx-auto max-w-[850px] text-center">
          <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold tracking-[.18em] text-[#b6ff69] sm:text-xs">
            <Sparkles size={15} aria-hidden="true"/>{t.eyebrow}
          </p>
          <h2 className="text-[clamp(2rem,7.6vw,2.7rem)] font-extrabold leading-[1.09] tracking-[-.06em] sm:text-[clamp(2.7rem,5.4vw,5.2rem)]">
            {t.title} <span className="text-[#b6ff69]">{t.highlight}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[680px] text-[14px] leading-[1.7] text-[#b9c7bb] sm:mt-5 sm:text-lg">{t.desc}</p>
        </header>
        <div className="pn6-grid mt-7 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {plans.map(plan=>{
            const detail=t.items[plan.key];
            return (
              <article key={plan.key} className={"pn6-card group relative flex min-w-0 flex-col overflow-hidden rounded-[21px] border px-5 pb-5 pt-6 sm:rounded-[24px] sm:px-6 sm:pb-6 sm:pt-8 "+(plan.featured?"pn6-card-featured border-[#b6ff69]/80 bg-[#172519]":"border-white/[.13] bg-[#111a14]")}>
                {plan.featured && <div className="pn6-corner-glow pointer-events-none absolute inset-0" aria-hidden="true"/>}
                <div className="relative z-10">
                  <div className="mb-4 flex min-h-6 items-center justify-between gap-2">
                    {plan.featured?
                      <span className="pn6-pill inline-flex items-center gap-1.5 rounded-full border border-[#b6ff69]/45 bg-[#b6ff69]/10 px-3 py-1 text-[9px] font-extrabold tracking-[.08em] text-[#b6ff69]"><Sparkles size={12} aria-hidden="true"/>{t.featured}</span>
                      :<span className="h-6"/>}
                    {plan.featured?<Layers3 size={19} className="text-[#b6ff69]" aria-hidden="true"/>:null}
                  </div>
                  <h3 className="min-h-[30px] text-[18px] font-bold tracking-[-.035em] sm:text-[19px]">{detail.name}</h3>
                  <p className="mt-2 min-h-[45px] text-[12px] leading-[1.65] text-[#b1bdb3] sm:min-h-[60px]">{detail.description}</p>
                  <div className="mt-5 flex items-baseline gap-1.5 border-b border-white/10 pb-5 sm:mt-6">
                    <span className="text-[16px] font-semibold text-[#b7c3b8]">{t.currency}</span>
                    <span className="pn6-price text-[clamp(2.75rem,7vw,3.6rem)] font-extrabold leading-none tracking-[-.07em]">{plan.monthly}</span>
                    <span className="text-[12px] font-medium text-[#9fad9f]">{t.per}</span>
                  </div>
                  <div className="mt-5 text-[11px] font-bold uppercase tracking-[.09em] text-[#c7d8c9]">{t.featureLabel}</div>
                  <ul className="mt-4 space-y-3">
                    {detail.features.map(feature=><li key={feature} className="flex items-start gap-2.5 text-[12px] leading-[1.6] text-[#d5e0d5] sm:text-[13px]">
                      <Check size={15} className="mt-[2px] shrink-0 text-[#b6ff69]" aria-hidden="true"/>{feature}
                    </li>)}
                  </ul>
                </div>
                <div className="relative z-10 mt-auto pt-7">
                  <button disabled type="button" title={t.pending} aria-label={detail.name+": "+t.pending} className={"pn6-button flex min-h-[46px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl text-[13px] font-bold "+(plan.featured?"bg-[#b6ff69] text-[#102009]":"border border-white/25 bg-white/[.09] text-[#e4eae3]")}>
                    {t.action} <ArrowRight size={16} aria-hidden="true"/>
                  </button>
                  <p className="mt-2 text-center text-[10px] leading-4 text-[#91a092]">{t.pending}</p>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mx-auto mt-6 max-w-[850px] text-center text-[11px] leading-[1.7] text-[#8e9d90] sm:mt-8">{t.note}</p>
      </div>
    </section>
  );
}
