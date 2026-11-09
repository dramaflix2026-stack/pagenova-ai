"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LiveHeroShowcase } from "./live-hero-showcase";
import { ArrowUpRight, ChevronDown, Globe2, Layers3, Menu, MonitorSmartphone, Play, Sparkles, TrendingUp, X, Zap } from "lucide-react";
import "./hero-modelo-um.css";

type Lang = "pt" | "en" | "es";
const copy = {
  pt: {
    nav: ["Plataforma", "Possibilidades", "Planos"], cases:"Cases",
    login: "Entrar", start: "Começar agora", eyebrow: "A NOVA ERA DA CRIAÇÃO DIGITAL",
    first: "Suas ideias merecem", highlight: "ir além.", description: "Crie sites, landing pages e projetos digitais com inteligência artificial. Personalize sua presença online e encontre novas oportunidades em um só lugar.",
    watch: "Explorar a plataforma", preview: "Uma plataforma. Novas possibilidades.", browser: "Prévia do seu projeto",
    demoTitle: "Da sua ideia para a tela.", demoDescription: "Uma prévia ilustrativa da experiência de criação. O editor real está disponível na plataforma.",
    site: "Sites com IA", crm: "CRM de vendas", page: "Landing pages", footer: "Uma nova forma de criar começa aqui.",
    sample: "Seu próximo projeto começa aqui.", sampleSubtitle: "Uma experiência digital feita para o seu negócio.", sampleBtn: "Saiba mais",
    sampleLabel: "MODELO DE SITE", language: "Idioma", mobileNav: "Abrir navegação"
  },
  en: {
    nav: ["Platform", "Possibilities", "Plans"], cases:"Examples",
    login: "Log in", start: "Get started", eyebrow: "THE NEXT ERA OF DIGITAL CREATION",
    first: "Your ideas deserve", highlight: "more.", description: "Create websites, landing pages and digital projects with artificial intelligence. Customize your online presence and explore new business opportunities in one place.",
    watch: "Explore the platform", preview: "One platform. New possibilities.", browser: "Your project preview",
    demoTitle: "From idea to screen.", demoDescription: "An illustrative preview of the creation experience. The real editor is available inside the platform.",
    site: "AI websites", crm: "Sales CRM", page: "Landing pages", footer: "A new way to create starts here.",
    sample: "Your next project starts here.", sampleSubtitle: "A digital experience built for your business.", sampleBtn: "Learn more",
    sampleLabel: "WEBSITE TEMPLATE", language: "Language", mobileNav: "Open navigation"
  },
  es: {
    nav: ["Plataforma", "Posibilidades", "Planes"], cases:"Ejemplos",
    login: "Ingresar", start: "Empezar ahora", eyebrow: "LA NUEVA ERA DE LA CREACIÓN DIGITAL",
    first: "Tus ideas merecen", highlight: "ir más allá.", description: "Crea sitios web, landing pages y proyectos digitales con inteligencia artificial. Personaliza tu presencia en línea y descubre oportunidades de negocio en un solo lugar.",
    watch: "Explorar la plataforma", preview: "Una plataforma. Nuevas posibilidades.", browser: "Vista previa de tu proyecto",
    demoTitle: "De la idea a la pantalla.", demoDescription: "Una vista ilustrativa de la experiencia de creación. El editor real está disponible en la plataforma.",
    site: "Sitios con IA", crm: "CRM de ventas", page: "Landing pages", footer: "Una nueva forma de crear comienza aquí.",
    sample: "Tu próximo proyecto empieza aquí.", sampleSubtitle: "Una experiencia digital creada para tu negocio.", sampleBtn: "Saber más",
    sampleLabel: "PLANTILLA DE SITIO", language: "Idioma", mobileNav: "Abrir navegación"
  }
} as const;

function preferredLang(): Lang {
  if (typeof window === "undefined") return "pt";
  const value = new URLSearchParams(window.location.search).get("lang");
  if (value === "pt" || value === "en" || value === "es") return value;
  const browser = navigator.language.toLowerCase();
  return browser.startsWith("es") ? "es" : browser.startsWith("en") ? "en" : "pt";
}

export function HeroModeloUm() {
  const [lang, setLang] = useState<Lang>("pt");
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setLang(preferredLang()); }, []);
  useEffect(() => { document.documentElement.lang = lang === "pt" ? "pt-BR" : lang; }, [lang]);
  const t = copy[lang];
  const changeLang = (next: Lang) => {
    setLang(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url);
    setMenuOpen(false);
  };


  const benefits = {
    pt: ["Criação rápida com IA","Diversos estilos de site","Desktop e celular","Mais presença digital"],
    en: ["Fast creation with AI","Multiple site styles","Desktop and mobile","Stronger online presence"],
    es: ["Creación rápida con IA","Distintos estilos web","Ordenador y móvil","Más presencia digital"]
  }[lang];
  const BenefitIcons=[Zap,Layers3,MonitorSmartphone,TrendingUp];
  return (
    <main className="pn-premium-hero relative isolate overflow-hidden bg-[#08130c] text-[#f5f9f4]">
      <div className="pn-premium-glow pn-premium-glow-left" aria-hidden="true"/>
      <div className="pn-premium-glow pn-premium-glow-right" aria-hidden="true"/>
      <header className="pn-premium-header relative z-30 border-b border-white/[0.055] backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1360px] items-center justify-between px-5 sm:px-8 xl:px-12">
          <Link href="/teste" className="inline-flex items-center gap-3" aria-label="PageNova AI">
            <img src="/brand/pagenova-logo.png" width="166" height="48" alt="PageNova AI" className="h-9 w-auto max-w-[164px] object-contain sm:h-10"/>
          </Link>
          <nav className="hidden items-center gap-9 text-[13px] font-semibold text-white/75 lg:flex" aria-label="Navegação principal">
            <a href="#ecossistema" className="transition hover:text-[#b6ff69]">{t.nav[0]}</a>
            <a href="#galeria" className="transition hover:text-[#b6ff69]">{t.nav[1]}</a>
            <a href="#planos" className="transition hover:text-[#b6ff69]">{t.nav[2]}</a><a href="#publicos" className="transition hover:text-[#b6ff69]">{t.cases}</a>
          </nav>
          <div className="hidden items-center gap-4 sm:flex">
            <label className="relative inline-flex items-center gap-1.5 text-xs font-semibold text-white/80">
              <Globe2 size={16}/><span className="sr-only">{t.language}</span>
              <select aria-label={t.language} value={lang} onChange={(e)=>changeLang(e.target.value as Lang)} className="cursor-pointer appearance-none bg-transparent pr-4 outline-none">
                <option className="bg-[#121b14]" value="pt">PT</option><option className="bg-[#121b14]" value="en">EN</option><option className="bg-[#121b14]" value="es">ES</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-0"/>
            </label>
            <Link href="/login" className="px-2 py-2 text-[13px] font-semibold text-white/85 hover:text-white">{t.login}</Link>
            <Link href="/cadastro" className="inline-flex items-center gap-2 rounded-full bg-[#a6ff61] px-5 py-3 text-[13px] font-bold text-[#0b1608] transition hover:bg-[#cdff96]">{t.start}<ArrowUpRight size={16}/></Link>
          </div>
          <button type="button" className="rounded-lg border border-white/20 p-2 sm:hidden" aria-label={t.mobileNav} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>
            {menuOpen?<X size={20}/>:<Menu size={20}/>}
          </button>
        </div>
        {menuOpen && (
          <nav className="flex flex-col gap-4 border-t border-white/10 bg-[#0e1a10] p-6 sm:hidden">
            <a onClick={()=>setMenuOpen(false)} href="#ecossistema">{t.nav[0]}</a><a onClick={()=>setMenuOpen(false)} href="#galeria">{t.nav[1]}</a><a onClick={()=>setMenuOpen(false)} href="#planos">{t.nav[2]}</a><a onClick={()=>setMenuOpen(false)} href="#publicos">{t.cases}</a>
            <div className="flex gap-2">{(["pt","en","es"] as const).map(l=><button type="button" key={l} onClick={()=>changeLang(l)} className={"rounded-md border px-3 py-2 text-xs "+(lang===l?"border-[#b6ff69] text-[#b6ff69]":"border-white/20")}>{l.toUpperCase()}</button>)}</div>
            <Link href="/login" className="text-white/80">{t.login}</Link>
            <Link href="/cadastro" className="rounded-lg bg-[#a6ff61] px-4 py-3 text-center font-bold text-[#101a0d]">{t.start}</Link>
          </nav>
        )}
      </header>
      <section id="plataforma" className="pn-premium-stage relative flex min-h-[720px] flex-col items-center justify-center px-5 pt-12 pb-14 text-center sm:px-8 lg:min-h-[750px] lg:pt-14">
        <div className="absolute inset-0 hidden lg:block"><LiveHeroShowcase lang={lang}/></div>
        <div className="pn-premium-content relative z-10 mx-auto flex w-full max-w-[680px] flex-col items-center">
          <div className="pn-premium-badge mb-5 inline-flex items-center gap-2 rounded-full border border-[#a6ff61]/50 bg-[#0c1b0e]/80 px-5 py-2 text-[10px] font-bold tracking-[.17em] text-[#b6ff69] sm:text-xs">
            <Sparkles size={15}/>{t.eyebrow}
          </div>
          <h1 className="pn-premium-title text-[clamp(2.75rem,6.5vw,5.6rem)] font-extrabold leading-[1.04] tracking-[-.068em]">
            {t.first}<br/><span className="text-[#a6ff61]">{t.highlight}</span>
          </h1>
          <p className="pn-premium-description mt-6 max-w-[580px] text-[15px] leading-[1.7] text-[#d1decf] sm:text-[16px]">{t.description}</p>
          <div className="pn-premium-ctas mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/cadastro" className="pn-premium-cta-primary group inline-flex min-h-[54px] w-full items-center justify-center gap-3 rounded-full bg-[#a6ff61] px-7 text-[14px] font-bold text-[#0c1808] transition hover:-translate-y-1 hover:bg-[#caff91] sm:w-auto">
              {t.start}<ArrowUpRight size={19} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
            </Link>
            <a href="#galeria" className="pn-premium-cta-secondary inline-flex min-h-[54px] w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-[#0b150e]/80 px-7 text-[14px] font-semibold text-white backdrop-blur-lg transition hover:border-[#b6ff69]/60 sm:w-auto">
              <Play size={16} fill="currentColor"/>{t.watch}
            </a>
          </div>
        </div>
        <div className="relative z-10 block w-full lg:hidden"><LiveHeroShowcase lang={lang} mobile/></div>
        <div className="pn-premium-benefits relative z-10 mx-auto mt-14 grid w-full max-w-[1050px] grid-cols-2 gap-4 text-left sm:mt-16 sm:grid-cols-4 sm:gap-0 lg:mt-24">
          {benefits.map((benefit,index)=>{
            const Icon=BenefitIcons[index];
            return <div key={index} className="pn-premium-benefit flex items-center justify-center gap-3">
              <Icon size={25} className="shrink-0 text-[#b6ff69]" strokeWidth={1.8}/>
              <span className="max-w-[145px] text-[11px] font-semibold leading-[1.4] text-[#e2ebdf] sm:text-[12px]">{benefit}</span>
            </div>;
          })}
        </div>
        <div className="pn-premium-arc pointer-events-none absolute bottom-0 left-[-10%] z-[2] h-[95px] w-[120%] rounded-[50%] border-b border-[#97ff58]/70" aria-hidden="true"/>
      </section>
    </main>
  );
}
