"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BarChart3, Blocks, BriefcaseBusiness, Building2, Check, ChevronDown, CircleHelp, Clapperboard, Code2, Crown, Globe2, Layers3, LayoutTemplate, Menu, MonitorSmartphone, Play, Rocket, ShieldCheck, ShoppingBag, Sparkles, Store, Target, Users, WandSparkles, X, Zap } from "lucide-react";
import { PremiumAiDemo } from "./premium-ai-demo";
import "./landing-revamp.css";
import "./landing-fidelity.css";
import "./landing-stability.css";
import "./landing-hero-premium.css";

type Lang = "pt" | "en" | "es";
type FAQ = { q: string; a: string };
const translations = {
 pt: {
  nav:["Plataforma","Possibilidades","Planos","Cases"],login:"Entrar",start:"Começar agora",
  heroTag:"CRIAÇÃO DIGITAL COM IA",heroHead:"Sites, CRM e Sistemas\ncom Inteligência",heroHi:"Artificial.",
  heroDesc:"Crie, personalize e escale seu negócio digital com uma plataforma completa, rápida e intuitiva.",heroCta:"Criar meu projeto agora",heroDemo:"Ver demonstração",
  benefit:["Criação rápida com IA","Diversos estilos de site","Desktop e celular","Mais presença digital"],
  stylesTag:"TRÊS ESTILOS DE SITES",stylesTitle:"Três estilos.",stylesHi:"Infinitas possibilidades.",stylesDesc:"Escolha a experiência visual que combina com a sua ideia.",
  types:["Institucional","Cinematográfico","3D Imersivo"],stylesNote:"Artes demonstrativas dos estilos disponíveis. Não representam projetos publicados de clientes.",
  solutionsTag:"SOLUÇÕES DA PAGENOVA",solutionsTitle:"Tudo o que você precisa em",solutionsHi:"um só lugar.",
  solutionsDesc:"Ferramentas para criar, prospectar e desenvolver seu negócio digital.",
  solutionNames:["PageNova Studio","PageNova CRM","Apps e Sistemas"],
  solutionDescriptions:["Criação e personalização de sites com IA.","Pesquisa de empresas e organização de leads.","Novas soluções digitais em desenvolvimento."],
  solutionBadge:"Em evolução",
  audienceTag:"POSSIBILIDADES REAIS",audienceTitle:"Mais criação. Mais",audienceHi:"resultados.",
  audienceDesc:"Soluções que se adaptam ao seu negócio, do freelancer à agência.",
  audiences:[["Freelancers","Crie sites profissionais e amplie seu portfólio."],["Agências Digitais","Atenda projetos de diferentes segmentos."],["Empreendedores","Tenha sua presença digital com identidade própria."],["Vendas e Leads","Prospecção e organização de oportunidades."]],
  pricesTag:"PLANOS DA PAGENOVA",pricesTitle:"Planos completos para o seu",pricesHi:"crescimento.",
  pricesDesc:"Escolha a ferramenta que combina com sua necessidade. Valores mensais em reais.",
  plans:[
    {name:"PageNova Studio",subtitle:"Criação de sites",features:["Sites e landing pages","Modelos por nicho","Personalização com IA"]},
    {name:"PageNova CRM",subtitle:"Prospecção e vendas",features:["Pesquisa de empresas","Gestão de leads","Organização comercial"]},
    {name:"Apps e Sistemas",subtitle:"Em desenvolvimento",features:["Novas soluções digitais","Aplicativos e sistemas","Recursos em evolução"]},
    {name:"PageNova Completa",subtitle:"Ecossistema integrado",features:["PageNova Studio","PageNova CRM","Apps e Sistemas (em evolução)"]}
  ],
  includes:"O QUE ESTÁ INCLUÍDO",featured:"PLANO EM DESTAQUE",choose:"Escolher plano",pending:"Contratação em preparação",pricesNote:"Os recursos e valores apresentados são informativos. Funcionalidades em evolução não são oferecidas como disponíveis.",
  guaranteeTag:"COMPRE SEM RISCO",guaranteeTitle:"Garantia incondicional de",guaranteeHi:"7 dias.",guaranteeDesc:"Garantia de sete dias para sua contratação, conforme os termos de reembolso que serão publicados junto ao checkout.",guaranteeSeal:"7 DIAS",
  faqTag:"PERGUNTAS FREQUENTES",faqTitle:"Tire suas",faqHi:"dúvidas.",
  faqDesc:"Tudo o que você precisa saber antes de começar.",
  faqs:[
   {q:"O que é a PageNova AI?",a:"Uma plataforma de criação de sites com IA, prospecção comercial e novas soluções digitais em desenvolvimento."},
   {q:"Preciso saber programar para usar?",a:"A proposta do Studio é permitir criar e personalizar sites por uma interface visual e comandos de IA, sem precisar programar."},
   {q:"Posso cancelar quando quiser?",a:"Os termos de cancelamento serão informados no momento da contratação. Consulte-os antes de assinar."},
   {q:"Quais formas de pagamento são aceitas?",a:"As opções de pagamento aparecerão quando a contratação estiver disponível."},
   {q:"O plano tem garantia?",a:"A política de garantia de sete dias será detalhada nos termos da contratação."}
  ],
  footerDesc:"Criação digital, prospecção comercial e soluções de IA em um só ecossistema.",footerCols:["Plataforma","Institucional","Suporte","Siga a PageNova"],footerLinks:[["Studio","CRM","Apps e Sistemas"],["Sobre nós","Planos","Cases"],["Central de ajuda","Contato","Termos de uso"]],footerBottom:"PageNova AI. Todos os direitos reservados."
 },
 en: {
  nav:["Platform","Possibilities","Plans","Examples"],login:"Log in",start:"Get started",
  heroTag:"AI-POWERED DIGITAL CREATION",heroHead:"Websites, CRM and Systems\npowered by",heroHi:"Artificial Intelligence.",
  heroDesc:"Create, customize and grow your digital business with a comprehensive, fast and intuitive platform.",heroCta:"Start my project",heroDemo:"See demonstration",
  benefit:["Fast AI creation","Multiple website styles","Desktop and mobile","Stronger online presence"],
  stylesTag:"THREE WEBSITE STYLES",stylesTitle:"Three styles.",stylesHi:"Endless possibilities.",stylesDesc:"Choose the visual experience that fits your idea.",
  types:["Institutional","Cinematic","Immersive 3D"],stylesNote:"Illustrative style concepts, not published client projects.",
  solutionsTag:"PAGENOVA SOLUTIONS",solutionsTitle:"Everything you need in",solutionsHi:"one place.",
  solutionsDesc:"Tools to build, prospect and develop your digital business.",
  solutionNames:["PageNova Studio","PageNova CRM","Apps & Systems"],
  solutionDescriptions:["AI-powered website creation and customization.","Business discovery and lead organization.","New digital solutions in development."],solutionBadge:"In development",
  audienceTag:"REAL POSSIBILITIES",audienceTitle:"More creating. More",audienceHi:"results.",
  audienceDesc:"Solutions for your business, from freelancers to agencies.",
  audiences:[["Freelancers","Build professional websites and grow your portfolio."],["Digital Agencies","Serve projects in different industries."],["Entrepreneurs","Build your digital presence with your own identity."],["Sales & Leads","Prospecting and opportunity management."]],
  pricesTag:"PAGENOVA PLANS",pricesTitle:"Complete plans for your",pricesHi:"growth.",
  pricesDesc:"Choose the right tool for your needs. Monthly prices in BRL.",
  plans:[
   {name:"PageNova Studio",subtitle:"Web creation",features:["Websites and landing pages","Industry templates","AI customization"]},
   {name:"PageNova CRM",subtitle:"Prospecting and sales",features:["Business discovery","Lead management","Sales organization"]},
   {name:"Apps & Systems",subtitle:"In development",features:["New digital solutions","Applications and systems","Upcoming capabilities"]},
   {name:"PageNova Complete",subtitle:"Unified ecosystem",features:["PageNova Studio","PageNova CRM","Apps & Systems (in development)"]}
  ],
  includes:"WHAT'S INCLUDED",featured:"FEATURED PLAN",choose:"Select plan",pending:"Checkout coming soon",pricesNote:"Features and prices are informational. In-development features are not presented as available.",
  guaranteeTag:"BUY WITH CONFIDENCE",guaranteeTitle:"Unconditional",guaranteeHi:"7-day guarantee.",guaranteeDesc:"Seven-day guarantee subject to the refund terms published with checkout.",guaranteeSeal:"7 DAYS",
  faqTag:"FREQUENTLY ASKED QUESTIONS",faqTitle:"Get your",faqHi:"answers.",faqDesc:"What to know before getting started.",
  faqs:[
   {q:"What is PageNova AI?",a:"A platform for AI-assisted website creation, sales prospecting and evolving digital solutions."},
   {q:"Do I need to code?",a:"Studio is designed for visual website creation and AI editing without programming."},
   {q:"Can I cancel?",a:"Cancellation terms will be presented at checkout."},
   {q:"Which payment methods are available?",a:"Payment options will be displayed when checkout becomes available."},
   {q:"Is there a guarantee?",a:"The seven-day guarantee policy will be detailed in the purchase terms."}
  ],
  footerDesc:"Digital creation, commercial prospecting and AI solutions in one ecosystem.",footerCols:["Platform","Company","Support","Follow PageNova"],footerLinks:[["Studio","CRM","Apps & Systems"],["About us","Plans","Examples"],["Help center","Contact","Terms of use"]],footerBottom:"PageNova AI. All rights reserved."
 },
 es: {
  nav:["Plataforma","Posibilidades","Planes","Ejemplos"],login:"Ingresar",start:"Comenzar ahora",
  heroTag:"CREACIÓN DIGITAL CON IA",heroHead:"Sitios, CRM y Sistemas\ncon Inteligencia",heroHi:"Artificial.",
  heroDesc:"Crea, personaliza y haz crecer tu negocio digital con una plataforma completa, rápida e intuitiva.",heroCta:"Crear mi proyecto",heroDemo:"Ver demostración",
  benefit:["Creación rápida con IA","Distintos estilos web","Ordenador y móvil","Mayor presencia digital"],
  stylesTag:"TRES ESTILOS DE SITIOS",stylesTitle:"Tres estilos.",stylesHi:"Infinitas posibilidades.",stylesDesc:"Elige la experiencia visual que encaja con tu idea.",
  types:["Institucional","Cinematográfico","3D Inmersivo"],stylesNote:"Imágenes ilustrativas de estilos, no proyectos publicados de clientes.",
  solutionsTag:"SOLUCIONES PAGENOVA",solutionsTitle:"Todo lo que necesitas en",solutionsHi:"un solo lugar.",
  solutionsDesc:"Herramientas para crear, prospectar y desarrollar tu negocio digital.",
  solutionNames:["PageNova Studio","PageNova CRM","Apps y Sistemas"],
  solutionDescriptions:["Creación y personalización de sitios con IA.","Búsqueda de empresas y organización de leads.","Nuevas soluciones digitales en desarrollo."],solutionBadge:"En desarrollo",
  audienceTag:"POSIBILIDADES REALES",audienceTitle:"Más creación. Más",audienceHi:"resultados.",
  audienceDesc:"Soluciones adaptadas a tu negocio, desde freelancers hasta agencias.",
  audiences:[["Freelancers","Crea sitios profesionales y amplía tu portafolio."],["Agencias Digitales","Atiende proyectos en diferentes sectores."],["Emprendedores","Crea tu presencia digital con identidad propia."],["Ventas y Leads","Prospección y gestión de oportunidades."]],
  pricesTag:"PLANES PAGENOVA",pricesTitle:"Planes completos para tu",pricesHi:"crecimiento.",
  pricesDesc:"Elige la herramienta que necesitas. Precios mensuales en BRL.",
  plans:[
   {name:"PageNova Studio",subtitle:"Creación web",features:["Sitios y landing pages","Plantillas por sector","Personalización con IA"]},
   {name:"PageNova CRM",subtitle:"Prospección y ventas",features:["Búsqueda de empresas","Gestión de leads","Organización comercial"]},
   {name:"Apps y Sistemas",subtitle:"En desarrollo",features:["Nuevas soluciones digitales","Aplicaciones y sistemas","Próximas funcionalidades"]},
   {name:"PageNova Completa",subtitle:"Ecosistema integrado",features:["PageNova Studio","PageNova CRM","Apps y Sistemas (en desarrollo)"]}
  ],
  includes:"QUÉ INCLUYE",featured:"PLAN DESTACADO",choose:"Elegir plan",pending:"Contratación en preparación",pricesNote:"Los recursos y precios son informativos. Las funciones en desarrollo no se presentan como disponibles.",
  guaranteeTag:"COMPRA SIN RIESGO",guaranteeTitle:"Garantía incondicional de",guaranteeHi:"7 días.",guaranteeDesc:"Garantía de siete días según los términos de reembolso publicados durante la contratación.",guaranteeSeal:"7 DÍAS",
  faqTag:"PREGUNTAS FRECUENTES",faqTitle:"Resuelve tus",faqHi:"dudas.",faqDesc:"Todo lo que debes saber antes de comenzar.",
  faqs:[
   {q:"¿Qué es PageNova AI?",a:"Una plataforma de creación de sitios con IA, prospección comercial y nuevas soluciones digitales."},
   {q:"¿Necesito saber programar?",a:"Studio permite crear y personalizar sitios mediante una interfaz visual y comandos de IA."},
   {q:"¿Puedo cancelar?",a:"Los términos de cancelación se informarán durante la contratación."},
   {q:"¿Qué métodos de pago se aceptan?",a:"Las opciones aparecerán cuando esté disponible la contratación."},
   {q:"¿Hay garantía?",a:"La política de garantía de siete días se detallará en los términos de compra."}
  ],
  footerDesc:"Creación digital, prospección comercial y soluciones de IA en un solo ecosistema.",footerCols:["Plataforma","Empresa","Soporte","Sigue a PageNova"],footerLinks:[["Studio","CRM","Apps y Sistemas"],["Sobre nosotros","Planes","Ejemplos"],["Ayuda","Contacto","Términos de uso"]],footerBottom:"PageNova AI. Todos los derechos reservados."
 }
} as const;

const products = [
 { icon:LayoutTemplate, color:"lime",target:"#estilos" },
 { icon:Users, color:"aqua",target:"#publicos" },
 { icon:Blocks, color:"violet",target:"#planos" }
] as const;
const audiencesIcons=[MonitorSmartphone,Rocket,Store,Target];
const priceIcons=[Zap,BarChart3,Layers3,Crown];
const amounts=[207,247,397,597];

export function LandingRevamp() {
 const [lang,setLang]=useState<Lang>("pt");
 const [menu,setMenu]=useState(false);
 const [openFaq,setOpenFaq]=useState<number|null>(0);
 useEffect(()=>{
  const search=new URLSearchParams(window.location.search).get("lang");
  if(search==="pt"||search==="en"||search==="es"){setLang(search);return;}
  const browser=navigator.language.toLowerCase();
  setLang(browser.startsWith("en")?"en":browser.startsWith("es")?"es":"pt");
 },[]);
 useEffect(()=>{document.documentElement.lang=lang==="pt"?"pt-BR":lang;},[lang]);
 const t=translations[lang];
 const switchLang=(value:Lang)=>{
  setLang(value);setMenu(false);
  const url=new URL(window.location.href);url.searchParams.set("lang",value);
  window.history.replaceState(null,"",url.toString());
 };
 const navigation=["#solucoes","#estilos","#planos","#publicos"];
 const footerAnchors=[["#solucoes","#solucoes","#planos"],["#solucoes","#planos","#estilos"],["#faq","#faq","#faq"]];
 return <div className="pnr-page" data-visual-stage="static">
  <div className="pnr-global-ambient" aria-hidden="true"/>
  <header className="pnr-header">
   <div className="pnr-nav">
    <Link href="/teste" className="pnr-brand" aria-label="PageNova AI"><img src="/brand/pagenova-logo.png" width="160" height="48" alt="PageNova AI"/></Link>
    <nav className="pnr-navlinks" aria-label="Principal">{t.nav.map((label,i)=><a key={label} href={navigation[i]}>{label}</a>)}</nav>
    <div className="pnr-navright"><label className="pnr-language"><Globe2 size={15}/><select aria-label="Idioma / Language" value={lang} onChange={e=>switchLang(e.target.value as Lang)}><option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option></select><ChevronDown size={12}/></label><Link href="/login">{t.login}</Link><Link href="/cadastro" className="pnr-btn pnr-btn-primary">{t.start}<ArrowUpRight size={16}/></Link></div>
    <button className="pnr-menu-toggle" type="button" aria-expanded={menu} aria-label="Menu" onClick={()=>setMenu(v=>!v)}>{menu?<X/>:<Menu/>}</button>
   </div>
   {menu&&<nav className="pnr-mobile-menu">{t.nav.map((label,i)=><a key={label} href={navigation[i]} onClick={()=>setMenu(false)}>{label}</a>)}<div className="pnr-mobile-languages">{(["pt","en","es"] as const).map(value=><button key={value} type="button" aria-pressed={lang===value} onClick={()=>switchLang(value)}>{value.toUpperCase()}</button>)}</div><Link href="/login">{t.login}</Link><Link href="/cadastro" className="pnr-btn pnr-btn-primary" onClick={()=>setMenu(false)}>{t.start}<ArrowRight size={17}/></Link></nav>}
  </header>
  <main>
   <section id="plataforma" className="pnr-hero pnr-hero--premium" data-motion-scope="hero">
    <div className="pnr-hero-ring" aria-hidden="true"/>
    <div className="pnr-hero-inner">
     <div className="pnr-hero-copy">
      <p className="pnr-pill"><Sparkles size={15}/>{t.heroTag}</p>
      <h1>{t.heroHead} <span>{t.heroHi}</span></h1>
      <p className="pnr-hero-desc">{t.heroDesc}</p>
      <div className="pnr-actions"><Link className="pnr-btn pnr-btn-primary" href="/cadastro">{t.heroCta}<ArrowRight size={17}/></Link><a className="pnr-btn pnr-btn-outline" href="#edicao-ia"><Play size={15} fill="currentColor"/>{t.heroDemo}</a></div>
     </div>
     <div className="pnr-hero-art pnr-hero-scene" data-motion-layer="hero-visual" aria-hidden="true">
      <div className="pnr-hero-scene-glow" data-motion-layer="ambient" />
      <div className="pnr-hero-light-sweep" data-motion-layer="ambient" />
      <img className="pnr-hero-art-approved" src="/landing-premium/hero-illustration-hd.avif" alt="" width="1002" height="611" loading="eager" decoding="async" fetchPriority="high" />
      <div className="pnr-hero-tech-highlight pnr-hero-tech-highlight--visual" data-motion-layer="ambient" />
      <div className="pnr-hero-tech-highlight pnr-hero-tech-highlight--dev" data-motion-layer="ambient" />
      <div className="pnr-hero-tech-highlight pnr-hero-tech-highlight--growth" data-motion-layer="ambient" />
     </div>
    </div>
    <div className="pnr-benefits">{t.benefit.map((b,i)=>{const Icon=[Zap,Layers3,MonitorSmartphone,BarChart3][i];return <div key={i}><Icon size={21}/><span>{b}</span></div>})}</div>
   </section>
   <section id="solucoes" className="pnr-section pnr-solutions">
    <header className="pnr-section-heading"><p className="pnr-overline">{t.solutionsTag}</p><h2>{t.solutionsTitle} <em>{t.solutionsHi}</em></h2><p>{t.solutionsDesc}</p></header>
    <div className="pnr-product-grid" data-motion-scope="solutions">{products.map((p,i)=>{const Icon=p.icon;return <a key={i} href={p.target} className={"pnr-product pnr-product-"+p.color}><span className="pnr-product-icon"><Icon size={25}/></span><span className="pnr-product-text"><strong>{t.solutionNames[i]}</strong><small>{t.solutionDescriptions[i]}</small>{i===2&&<small className="pnr-status">{t.solutionBadge}</small>}</span><ArrowUpRight size={19} className="pnr-product-arrow"/></a>})}</div>
   </section>
   <section id="estilos" className="pnr-section pnr-styles">
    <header className="pnr-section-heading"><p className="pnr-overline">{t.stylesTag}</p><h2>{t.stylesTitle} <em>{t.stylesHi}</em></h2><p>{t.stylesDesc}</p></header>
    <div className="pnr-style-grid" data-motion-scope="styles">{(["institucional","cinematografico","3d-imersivo"] as const).map((id,i)=><div className="pnr-style-card" key={id}><picture><source media="(max-width: 650px)" srcSet={"/gallery-styles/"+id+"-mobile.webp"}/><img src={"/gallery-styles/"+id+"-desktop.webp"} alt={t.types[i]} width="1600" height="900" loading="lazy" decoding="async"/></picture></div>)}</div>
    <p className="pnr-footnote">{t.stylesNote}</p>
   </section>
   <section id="publicos" className="pnr-section pnr-audiences">
    <header className="pnr-section-heading"><p className="pnr-overline">{t.audienceTag}</p><h2>{t.audienceTitle} <em>{t.audienceHi}</em></h2><p>{t.audienceDesc}</p></header>
    <div className="pnr-audience-grid" data-motion-scope="audiences">{t.audiences.map((item,i)=>{const Icon=audiencesIcons[i];return <Link key={i} href={i===3?"#solucoes":"/cadastro"} className="pnr-audience-card"><span className="pnr-audience-icon"><Icon size={24}/></span><strong>{item[0]}</strong><p>{item[1]}</p><ArrowUpRight className="pnr-audience-arrow" size={20}/></Link>})}</div>
   </section>
   <PremiumAiDemo/>
   <section id="planos" className="pnr-section pnr-pricing">
    <header className="pnr-section-heading"><p className="pnr-overline">{t.pricesTag}</p><h2>{t.pricesTitle} <em>{t.pricesHi}</em></h2><p>{t.pricesDesc}</p></header>
    <div className="pnr-price-grid" data-motion-scope="plans">{t.plans.map((p,i)=>{const Icon=priceIcons[i];return <article key={i} className={"pnr-price-card"+(i===3?" is-featured":"")}>
     {i===3&&<div className="pnr-featured-label"><Crown size={12}/>{t.featured}</div>}
     <div className="pnr-price-top"><span className="pnr-price-icon"><Icon size={22}/></span><div><h3>{p.name}</h3><small>{p.subtitle}</small></div></div>
     <div className="pnr-price-number"><span>R$</span><strong>{amounts[i]}</strong><span>/mês</span></div>
     <div className="pnr-price-details"><span>{t.includes}</span><ul>{p.features.map(f=><li key={f}><Check size={15}/>{f}</li>)}</ul></div>
     <button type="button" disabled className={"pnr-price-button"+(i===3?" primary":"")} title={t.pending}>{t.choose}<ArrowRight size={15}/></button><small className="pnr-price-pending">{t.pending}</small>
    </article>})}</div><p className="pnr-footnote">{t.pricesNote}</p>
   </section>
   <section className="pnr-section pnr-trust" id="garantia">
    <div className="pnr-guarantee"><div className="pnr-shield"><ShieldCheck strokeWidth={1.4} size={100}/></div><div className="pnr-guarantee-copy"><p className="pnr-overline">{t.guaranteeTag}</p><h2>{t.guaranteeTitle} <em>{t.guaranteeHi}</em></h2><p>{t.guaranteeDesc}</p></div><div className="pnr-seal"><strong>7</strong><span>{t.guaranteeSeal}</span></div></div>
    <div className="pnr-faq" id="faq"><div className="pnr-faq-intro"><p className="pnr-overline">{t.faqTag}</p><h2>{t.faqTitle} <em>{t.faqHi}</em></h2><p>{t.faqDesc}</p></div><div className="pnr-faq-items">{t.faqs.map((item:FAQ,i)=><div key={i} className={"pnr-faq-item"+(openFaq===i?" opened":"")}><button type="button" aria-expanded={openFaq===i} onClick={()=>setOpenFaq(openFaq===i?null:i)}>{item.q}<ChevronDown size={17}/></button>{openFaq===i&&<p>{item.a}</p>}</div>)}</div></div>
   </section>
  </main>
  <footer className="pnr-footer"><div className="pnr-footer-inner"><div className="pnr-footer-brand"><img src="/brand/pagenova-logo.png" width={204} height={62} alt="PageNova AI"/><p>{t.footerDesc}</p></div>{t.footerLinks.map((column,i)=><div className="pnr-footer-column" key={i}><strong>{t.footerCols[i]}</strong>{column.map((label,j)=><a key={j} href={footerAnchors[i][j]}>{label}</a>)}</div>)}<div className="pnr-footer-column"><strong>{t.footerCols[3]}</strong><div className="pnr-socials"><span title="YouTube">YT</span><span title="Instagram">IG</span><span title="TikTok">TT</span><span title="LinkedIn">in</span></div></div></div><p className="pnr-copyright">© {new Date().getFullYear()} {t.footerBottom}</p></footer>
 </div>;
}
