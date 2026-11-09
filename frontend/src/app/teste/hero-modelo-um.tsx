"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Globe2, Menu, Monitor, MousePointer2, Play, Sparkles, X } from "lucide-react";

type Lang = "pt" | "en" | "es";
const copy = {
  pt: {
    nav: ["Plataforma", "Possibilidades", "Planos"],
    login: "Entrar", start: "Começar agora", eyebrow: "A NOVA ERA DA CRIAÇÃO DIGITAL",
    first: "Suas ideias merecem", highlight: "ir além.", description: "Crie sites, landing pages e projetos digitais com inteligência artificial. Personalize sua presença online e encontre novas oportunidades em um só lugar.",
    watch: "Explorar a plataforma", preview: "Uma plataforma. Novas possibilidades.", browser: "Prévia do seu projeto",
    demoTitle: "Da sua ideia para a tela.", demoDescription: "Uma prévia ilustrativa da experiência de criação. O editor real está disponível na plataforma.",
    site: "Sites com IA", crm: "CRM de vendas", page: "Landing pages", footer: "Uma nova forma de criar começa aqui.",
    sample: "Seu próximo projeto começa aqui.", sampleSubtitle: "Uma experiência digital feita para o seu negócio.", sampleBtn: "Saiba mais",
    sampleLabel: "MODELO DE SITE", language: "Idioma", mobileNav: "Abrir navegação"
  },
  en: {
    nav: ["Platform", "Possibilities", "Plans"],
    login: "Log in", start: "Get started", eyebrow: "THE NEXT ERA OF DIGITAL CREATION",
    first: "Your ideas deserve", highlight: "more.", description: "Create websites, landing pages and digital projects with artificial intelligence. Customize your online presence and explore new business opportunities in one place.",
    watch: "Explore the platform", preview: "One platform. New possibilities.", browser: "Your project preview",
    demoTitle: "From idea to screen.", demoDescription: "An illustrative preview of the creation experience. The real editor is available inside the platform.",
    site: "AI websites", crm: "Sales CRM", page: "Landing pages", footer: "A new way to create starts here.",
    sample: "Your next project starts here.", sampleSubtitle: "A digital experience built for your business.", sampleBtn: "Learn more",
    sampleLabel: "WEBSITE TEMPLATE", language: "Language", mobileNav: "Open navigation"
  },
  es: {
    nav: ["Plataforma", "Posibilidades", "Planes"],
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080d0a] text-[#f5f9f4]" style={{fontFamily:"Poppins, Arial, sans-serif"}}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-370px] h-[680px] w-[880px] -translate-x-1/2 rounded-full bg-[#8df44b]/[0.075] blur-[110px]" />
        <div className="absolute inset-0 opacity-[0.15]" style={{backgroundImage:"linear-gradient(#a1c69a18 1px,transparent 1px),linear-gradient(90deg,#a1c69a18 1px,transparent 1px)",backgroundSize:"72px 72px",maskImage:"linear-gradient(to bottom,black,transparent 72%)"}} />
      </div>

      <header className="relative z-20 border-b border-white/[0.08] bg-[#080d0a]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-5 sm:px-8 xl:px-12">
          <Link href="/teste" className="inline-flex items-center gap-3" aria-label="PageNova AI">
            <img src="/brand/pagenova-logo.png" width="166" height="48" alt="PageNova AI" className="h-10 w-auto max-w-[166px] object-contain" />
          </Link>
          <nav className="hidden items-center gap-9 text-[13px] font-medium text-white/65 lg:flex" aria-label="Navegação principal">
            <a href="#plataforma" className="transition hover:text-white">{t.nav[0]}</a>
            <a href="#possibilidades" className="transition hover:text-white">{t.nav[1]}</a>
            <a href="#planos" className="transition hover:text-white">{t.nav[2]}</a>
          </nav>
          <div className="hidden items-center gap-4 sm:flex">
            <label className="relative inline-flex items-center gap-1.5 text-xs font-semibold text-white/70">
              <Globe2 size={16}/><span className="sr-only">{t.language}</span>
              <select aria-label={t.language} value={lang} onChange={(e)=>changeLang(e.target.value as Lang)} className="cursor-pointer appearance-none bg-transparent pr-4 outline-none">
                <option className="bg-[#121b14]" value="pt">PT</option>
                <option className="bg-[#121b14]" value="en">EN</option>
                <option className="bg-[#121b14]" value="es">ES</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-0" />
            </label>
            <Link href="/login" className="px-2 py-2 text-[13px] font-semibold text-white/80 hover:text-white">{t.login}</Link>
            <Link href="/cadastro" className="inline-flex items-center gap-2 rounded-xl bg-[#b6ff69] px-4 py-3 text-[13px] font-bold text-[#0b1608] transition hover:bg-[#d1ff9c]">{t.start}<ArrowUpRight size={16}/></Link>
          </div>
          <button type="button" className="rounded-lg border border-white/15 p-2 sm:hidden" aria-label={t.mobileNav} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X size={20}/>:<Menu size={20}/>}</button>
        </div>
        {menuOpen && (
          <nav className="flex flex-col gap-4 border-t border-white/10 bg-[#0e1710] p-6 sm:hidden">
            <a onClick={()=>setMenuOpen(false)} href="#plataforma">{t.nav[0]}</a>
            <a onClick={()=>setMenuOpen(false)} href="#possibilidades">{t.nav[1]}</a>
            <a onClick={()=>setMenuOpen(false)} href="#planos">{t.nav[2]}</a>
            <div className="flex gap-2">{(["pt","en","es"] as const).map(l=><button type="button" key={l} onClick={()=>changeLang(l)} className={"rounded-md border px-3 py-2 text-xs "+(lang===l?"border-[#b6ff69] text-[#b6ff69]":"border-white/20")}>{l.toUpperCase()}</button>)}</div>
            <Link href="/login" className="text-white/75">{t.login}</Link>
            <Link href="/cadastro" className="rounded-lg bg-[#b6ff69] px-4 py-3 text-center font-bold text-[#101a0d]">{t.start}</Link>
          </nav>
        )}
      </header>

      <section id="plataforma" className="relative z-10 mx-auto max-w-[1260px] px-5 pb-16 pt-[92px] text-center sm:px-8 sm:pt-[118px] lg:pt-[136px]">
        <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-[#b6ff69]/25 bg-[#b6ff69]/[0.065] px-4 py-2 text-[10px] font-bold tracking-[.19em] text-[#b6ff69] sm:text-xs">
          <Sparkles size={14}/>{t.eyebrow}
        </div>
        <h1 className="mx-auto max-w-[1110px] text-[clamp(2.7rem,7.5vw,7.2rem)] font-extrabold leading-[1.05] tracking-[-.065em]">
          {t.first}<br/><span className="text-[#b6ff69]">{t.highlight}</span>
        </h1>
        <p className="mx-auto mt-7 max-w-[680px] text-[15px] leading-[1.85] text-[#aebbae] sm:text-lg">{t.description}</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/cadastro" className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#b6ff69] px-7 text-[14px] font-bold text-[#0d190a] transition hover:-translate-y-0.5 hover:bg-[#d4ffaa] hover:shadow-[0_12px_40px_#a3fc4930] sm:w-auto">{t.start}<ArrowUpRight className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={19}/></Link>
          <a href="#demonstracao" className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/[.035] px-7 text-[14px] font-semibold text-white transition hover:border-white/40 hover:bg-white/[.08] sm:w-auto"><Play size={16} fill="currentColor"/>{t.watch}</a>
        </div>
        <p id="possibilidades" className="mt-20 text-[10px] font-bold uppercase tracking-[.25em] text-[#8b9e8d] sm:mt-24">{t.preview}</p>
        <div className="mx-auto mt-7 flex flex-wrap items-center justify-center gap-3">
          {[{label:t.site,icon:Monitor},{label:t.page,icon:MousePointer2},{label:t.crm,icon:Check}].map(({label,icon:Icon})=><span key={label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-4 py-2 text-[11px] font-medium text-white/70"><Icon size={14} className="text-[#b6ff69]"/>{label}</span>)}
        </div>

        <div id="demonstracao" className="relative mx-auto mt-10 max-w-[1120px]">
          <div aria-hidden="true" className="absolute -inset-5 rounded-[32px] bg-[#a2ff54]/[.10] blur-[62px]" />
          <div className="relative overflow-hidden rounded-[20px] border border-[#b6ff69]/20 bg-[#111914] p-2 shadow-[0_35px_130px_#0009] sm:rounded-[27px] sm:p-3">
            <div className="mb-2 flex h-10 items-center gap-3 rounded-xl border border-white/[.07] bg-[#0b110d] px-4 text-left">
              <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#fd7777]/70"/><span className="h-2.5 w-2.5 rounded-full bg-[#e7bd63]/70"/><span className="h-2.5 w-2.5 rounded-full bg-[#7bd68a]/70"/></div>
              <span className="mx-auto max-w-[240px] truncate rounded-md bg-white/[.055] px-4 py-1 text-[10px] text-white/40">{t.browser}</span>
            </div>
            <div className="relative min-h-[350px] overflow-hidden rounded-[13px] border border-white/[.08] bg-[#151f1a] sm:min-h-[480px]">
              <div aria-hidden="true" className="absolute inset-0 opacity-70" style={{background:"radial-gradient(ellipse at 70% 40%,#3e6850 0%,#1d3228 33%,#101d17 70%)"}} />
              <div aria-hidden="true" className="absolute right-[-12%] top-[8%] h-[360px] w-[360px] rounded-full border border-[#b6ff69]/20 shadow-[inset_0_0_90px_#a6f4701a] sm:h-[540px] sm:w-[540px]" />
              <div aria-hidden="true" className="absolute right-[2%] top-[25%] h-44 w-44 rotate-45 rounded-[35px] border border-[#b6ff69]/20 bg-[#b6ff69]/[0.065] backdrop-blur-sm sm:h-72 sm:w-72" />
              <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-5 text-left sm:px-10">
                <span className="text-sm font-bold tracking-tight text-white">NOVA<span className="text-[#b6ff69]">.</span></span>
                <div className="flex gap-5 text-[10px] font-medium text-white/45"><span>Studio</span><span>Design</span><span>Contato</span></div>
              </div>
              <div className="relative z-10 flex min-h-[300px] items-center px-6 py-12 text-left sm:min-h-[410px] sm:px-16">
                <div className="max-w-[570px]">
                  <span className="mb-5 inline-block border-l-2 border-[#b6ff69] pl-3 text-[10px] font-semibold tracking-[.18em] text-[#c6e6bd]">{t.sampleLabel}</span>
                  <h2 className="max-w-[550px] text-[clamp(2rem,4.6vw,4.5rem)] font-extrabold leading-[1.08] tracking-[-.055em] text-white">{t.sample}</h2>
                  <p className="mt-5 max-w-[380px] text-xs leading-6 text-white/60 sm:text-sm">{t.sampleSubtitle}</p>
                  <span className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#b6ff69] px-5 py-3 text-xs font-bold text-[#142110]">{t.sampleBtn}<ArrowRight size={14}/></span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-5 text-xs leading-6 text-white/40">{t.demoDescription}</p>
        </div>
        <p className="mt-16 text-[12px] font-medium tracking-[.04em] text-white/45">{t.footer}</p>
        <div id="planos" aria-hidden="true" className="h-px" />
      </section>
    </main>
  );
}
