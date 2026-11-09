"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CinematicFilmReel } from "./cinematic-film-reel";
import { ArrowUpRight, ChevronDown, Globe2, Menu, Play, Sparkles, X } from "lucide-react";

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
    <main className="pn-hero relative overflow-hidden lg:min-h-screen bg-[#080d0a] text-[#f5f9f4]" style={{fontFamily:"inherit"}}>
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
            <a href="#galeria" className="transition hover:text-white">{t.nav[1]}</a>
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
            <a onClick={()=>setMenuOpen(false)} href="#galeria">{t.nav[1]}</a>
            <a onClick={()=>setMenuOpen(false)} href="#planos">{t.nav[2]}</a>
            <div className="flex gap-2">{(["pt","en","es"] as const).map(l=><button type="button" key={l} onClick={()=>changeLang(l)} className={"rounded-md border px-3 py-2 text-xs "+(lang===l?"border-[#b6ff69] text-[#b6ff69]":"border-white/20")}>{l.toUpperCase()}</button>)}</div>
            <Link href="/login" className="text-white/75">{t.login}</Link>
            <Link href="/cadastro" className="rounded-lg bg-[#b6ff69] px-4 py-3 text-center font-bold text-[#101a0d]">{t.start}</Link>
          </nav>
        )}
      </header>

      <section id="plataforma" className="relative z-10 mx-auto max-w-[1260px] px-5 pb-10 pt-[64px] text-center sm:px-8 sm:pt-[82px] lg:pt-[94px]">
        <div className="pn-hero-badge mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-[#b6ff69]/25 bg-[#b6ff69]/[0.065] px-4 py-2 text-[10px] font-bold tracking-[.19em] text-[#b6ff69] sm:text-xs">
          <Sparkles size={14}/>{t.eyebrow}
        </div>
        <div className="pn-hero-stage relative mx-auto flex min-h-[300px] max-w-[1220px] items-center justify-center py-12 sm:min-h-[370px] sm:py-16 lg:min-h-[410px]">
          <CinematicFilmReel />
          <div aria-hidden="true" className="pointer-events-none absolute z-[1] inset-x-[5%] inset-y-[14%] rounded-full bg-[#080d0a]/65 blur-[55px] sm:inset-x-[16%]"/>
          <h1 className="relative z-10 mx-auto max-w-[1040px] text-[clamp(2.65rem,7vw,6.8rem)] font-extrabold leading-[1.05] tracking-[-.065em] drop-shadow-[0_8px_28px_#080d0a]">
            {t.first}<br/><span className="text-[#b6ff69]">{t.highlight}</span>
          </h1>
        </div>
        <p className="mx-auto mt-3 max-w-[680px] text-[15px] leading-[1.85] text-[#aebbae] sm:text-lg">{t.description}</p>
        <div className="pn-hero-buttons mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/cadastro" className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#b6ff69] px-7 text-[14px] font-bold text-[#0d190a] transition hover:-translate-y-0.5 hover:bg-[#d4ffaa] hover:shadow-[0_12px_40px_#a3fc4930] sm:w-auto">{t.start}<ArrowUpRight className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={19}/></Link>
          <a href="#galeria" className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/[.035] px-7 text-[14px] font-semibold text-white transition hover:border-white/40 hover:bg-white/[.08] sm:w-auto"><Play size={16} fill="currentColor"/>{t.watch}</a>
        </div>
        <div id="planos" aria-hidden="true" className="h-px" />
      </section>
      <style>{`@media(max-width:639px){
.pn-hero header>div{height:64px}
.pn-hero header img{max-height:34px}
.pn-hero #plataforma{padding-top:30px;padding-bottom:28px}
.pn-hero .pn-hero-badge{margin-bottom:2px;padding:7px 11px;font-size:9px;letter-spacing:.08em;max-width:100%}
.pn-hero-stage{min-height:225px;padding-top:20px;padding-bottom:20px}
.pn-hero-stage h1{font-size:clamp(36px,9.5vw,48px);line-height:1.04;letter-spacing:-.06em}
.pn-hero #plataforma>p{margin-top:3px;font-size:14px;line-height:1.62;max-width:360px}
.pn-hero .pn-hero-buttons{margin-top:17px;gap:9px}
.pn-hero .pn-hero-buttons a{min-height:48px;font-size:13px}
}`}</style>
    </main>
  );
}
