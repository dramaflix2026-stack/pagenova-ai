"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Megaphone, Sparkles, Store, Target } from "lucide-react";
import "./audience-section.css";

type Lang = "pt" | "en" | "es";
const audiences = [
  {
    id: "freelancers", accent: "#b6ff69", Icon: BriefcaseBusiness,
    image: "https://images.pexels.com/photos/35184836/pexels-photo-35184836.jpeg?auto=compress&cs=tinysrgb&w=1400",
    pos: "center 45%",
    pt: ["FREELANCERS", "Sua habilidade pode ir mais longe.", "Crie sites e landing pages para apresentar a clientes e ampliar seu portfólio.", "Criar meu próximo projeto"],
    en: ["FREELANCERS", "Take your skills further.", "Build websites and landing pages for clients and expand your portfolio.", "Start creating"],
    es: ["FREELANCERS", "Lleva tu talento más lejos.", "Crea sitios web y landing pages para clientes y amplía tu portafolio.", "Empezar a crear"]
  },
  {
    id: "agencies", accent: "#83ead6", Icon: Megaphone,
    image: "https://images.pexels.com/photos/5862323/pexels-photo-5862323.jpeg?auto=compress&cs=tinysrgb&w=1400",
    pos: "center 42%",
    pt: ["AGÊNCIAS DIGITAIS", "Mais criação. Mais possibilidades.", "Use modelos e ferramentas de IA para atender projetos digitais de diferentes nichos.", "Explorar o Studio"],
    en: ["DIGITAL AGENCIES", "More room to create.", "Use templates and AI tools to serve digital projects across industries.", "Explore Studio"],
    es: ["AGENCIAS DIGITALES", "Más creación. Más oportunidades.", "Usa plantillas e IA para desarrollar proyectos digitales de diversos sectores.", "Explorar Studio"]
  },
  {
    id: "entrepreneurs", accent: "#f1c78c", Icon: Store,
    image: "https://images.pexels.com/photos/36766777/pexels-photo-36766777.jpeg?auto=compress&cs=tinysrgb&w=1400",
    pos: "center 40%",
    pt: ["EMPREENDEDORES", "Sua ideia merece presença digital.", "Apresente seu negócio com uma identidade própria e personalize seu site usando IA.", "Apresentar meu negócio"],
    en: ["ENTREPRENEURS", "Bring your business online.", "Create a website for your business and customize it with AI.", "Showcase my business"],
    es: ["EMPRENDEDORES", "Tu negocio merece estar online.", "Presenta tu negocio con un sitio personalizado mediante IA.", "Presentar mi negocio"]
  },
  {
    id: "sales", accent: "#abd2fc", Icon: Target,
    image: "https://images.pexels.com/photos/2182971/pexels-photo-2182971.jpeg?auto=compress&cs=tinysrgb&w=1400",
    pos: "center 48%",
    pt: ["PROFISSIONAIS DE VENDAS", "Prospecção abre novas oportunidades.", "Pesquise empresas, organize leads e apresente soluções digitais a novos contatos.", "Conhecer o CRM"],
    en: ["SALES PROFESSIONALS", "Find your next opportunity.", "Discover businesses, organize leads and present digital solutions to prospects.", "Explore CRM"],
    es: ["PROFESIONALES DE VENTAS", "Encuentra nuevas oportunidades.", "Busca empresas, organiza leads y presenta soluciones digitales a prospectos.", "Conocer CRM"]
  }
] as const;

const copy = {
  pt: {
    eyebrow: "PARA QUEM FAZ ACONTECER", title: "Uma plataforma. Muitos caminhos para", highlight: "crescer.",
    desc: "Seja para criar, empreender ou encontrar novos clientes, a PageNova acompanha o seu próximo passo.",
    cta: "Encontre seu caminho com a PageNova",
    note: "Imagens ilustrativas de contextos profissionais; as pessoas retratadas não são apresentadas como clientes da PageNova."
  },
  en: {
    eyebrow: "FOR THE PEOPLE WHO BUILD", title: "One platform. Many ways to", highlight: "grow.",
    desc: "Whether you create, run a business or find new clients, PageNova helps you take the next step.",
    cta: "Find your way with PageNova",
    note: "Illustrative professional photography; the people shown are not presented as PageNova customers."
  },
  es: {
    eyebrow: "PARA QUIENES CREAN", title: "Una plataforma. Muchas formas de", highlight: "crecer.",
    desc: "Para crear, emprender o encontrar clientes, PageNova acompaña tu próximo paso.",
    cta: "Encuentra tu camino con PageNova",
    note: "Fotografías ilustrativas; las personas no se presentan como clientes de PageNova."
  }
} as const;

export function AudienceSection() {
  const [lang, setLang] = useState<Lang>("pt");
  useEffect(() => {
    const sync = () => {
      const value = document.documentElement.lang.toLowerCase();
      setLang(value.startsWith("en") ? "en" : value.startsWith("es") ? "es" : "pt");
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, []);

  const t = copy[lang];
  return (
    <section id="publicos" className="pn5-section relative isolate overflow-hidden border-t border-white/[.07] bg-[#080e0a] px-5 py-12 text-white sm:px-8 sm:py-20 lg:py-24">
      <div className="pn5-halo pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1240px]">
        <div className="mx-auto max-w-[850px] text-center">
          <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold tracking-[.17em] text-[#b6ff69] sm:mb-4 sm:text-xs">
            <Sparkles size={14} aria-hidden="true" />{t.eyebrow}
          </p>
          <h2 className="text-[clamp(2rem,7.5vw,2.65rem)] font-extrabold leading-[1.08] tracking-[-.055em] sm:text-[clamp(2.65rem,5.4vw,5.35rem)]">
            {t.title} <span className="text-[#b6ff69]">{t.highlight}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[690px] text-[14px] leading-[1.65] text-[#b8c4b9] sm:mt-5 sm:text-lg">{t.desc}</p>
        </div>
        <div className="pn5-grid mt-7 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4">
          {audiences.map(audience => {
            const c = audience[lang];
            const Icon = audience.Icon;
            return (
              <a key={audience.id} href="/cadastro" className="pn5-card group relative flex min-h-[278px] flex-col justify-between overflow-hidden rounded-[19px] border border-white/15 bg-[#17251a] p-5 text-left text-white sm:min-h-[340px] sm:rounded-[24px] sm:p-7" style={{ "--pn5-accent": audience.accent } as CSSProperties} aria-label={c[0]+": "+c[3]}>
                <div className="pn5-photo absolute inset-0">
                  <img src={audience.image} alt="" loading="lazy" decoding="async" style={{objectPosition:audience.pos}} onError={event=>{event.currentTarget.style.opacity="0";}}/>
                </div>
                <div className="pn5-shade pointer-events-none absolute inset-0"/>
                <div className="pn5-glint pointer-events-none absolute inset-0"/>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-black/35 text-white backdrop-blur-md"><Icon size={20} aria-hidden="true"/></span>
                  <span className="pn5-arrow flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/25"><ArrowUpRight size={18} aria-hidden="true"/></span>
                </div>
                <div className="relative z-10 max-w-[490px]">
                  <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[.15em]" style={{color:audience.accent}}>{c[0]}</div>
                  <h3 className="max-w-[420px] text-[clamp(1.7rem,6.4vw,2.25rem)] font-extrabold leading-[1.13] tracking-[-.05em] sm:text-[clamp(1.8rem,3vw,2.6rem)]">{c[1]}</h3>
                  <p className="mt-2 max-w-[440px] text-[12px] leading-[1.65] text-[#e0ebe1] sm:mt-3 sm:text-[14px]">{c[2]}</p>
                  <span className="mt-3 inline-flex items-center gap-2 border-b border-white/60 pb-1 text-xs font-bold sm:mt-4 sm:text-[13px]">{c[3]}<ArrowRight size={15} aria-hidden="true"/></span>
                </div>
              </a>
            );
          })}
        </div>
        <div className="mt-7 flex flex-col items-center gap-3 text-center sm:mt-9">
          <a href="/cadastro" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#b6ff69] px-5 text-[13px] font-bold text-[#10200b] transition-colors hover:bg-[#d5ffa2]">
            {t.cta}<ArrowRight size={16} aria-hidden="true"/>
          </a>
          <p className="max-w-[750px] text-[10px] leading-5 text-[#8e9c90] sm:text-[11px]">{t.note}</p>
        </div>
      </div>
    </section>
  );
}
