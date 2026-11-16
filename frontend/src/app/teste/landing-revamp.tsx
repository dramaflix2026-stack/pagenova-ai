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
function LanguageFlag({code}:{code:Lang}){return <svg className="pnr-country-flag" viewBox="0 0 30 20" width="30" height="20" role="img" aria-label={code==="pt"?"Brasil":code==="en"?"Estados Unidos":"Espanha"}>{code==="pt"?<><rect width="30" height="20" fill="#159447"/><path d="M15 2 28 10 15 18 2 10Z" fill="#FFDF00"/><circle cx="15" cy="10" r="5.2" fill="#173A91"/><path d="M10 8.6q5-1.4 10 2" fill="none" stroke="#fff" strokeWidth="1.1"/></>:code==="en"?<><rect width="30" height="20" fill="#fff"/>{[0,1,2,3,4,5,6].map(i=><rect key={i} x="0" y={i*3} width="30" height="1.6" fill="#B22234"/>)}<rect width="13" height="11" fill="#3C3B6E"/>{[0,1,2].map(i=>[0,1,2,3].map(j=><circle key={i+"-"+j} cx={2+j*3} cy={2+i*3} r=".65" fill="#fff"/>))}</>:<><rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/><rect x="8" y="8" width="3" height="5" rx=".5" fill="#AA151B"/></>}</svg>}

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
  audiences:[["Freelancers","Crie sites profissionais em menos tempo, amplie seu portfólio e conquiste novos clientes."],["Agências Digitais","Acelere suas entregas, atenda mais projetos e escale sua operação com inteligência artificial."],["Empreendedores","Transforme sua ideia em uma presença digital profissional, com a identidade do seu negócio."],["Vendas e Leads","Encontre oportunidades, organize seus contatos e transforme prospecção em novos negócios."]],
  pricesTag:"PLANOS DA PAGENOVA",pricesTitle:"Planos completos para o seu",pricesHi:"crescimento.",
  pricesDesc:"Escolha a ferramenta que combina com sua necessidade. Valores mensais em reais.",
  plans:[
    {name:"PageNova Studio",subtitle:"Criação de sites",features:["Gerar Site com IA","Landing Page com IA","Clonar Site","Gerar Quiz","Gerar E-books"]},
    {name:"PageNova CRM",subtitle:"Prospecção e vendas",features:["Dashboard","Buscar Empresas","Gerar Site com IA","Organização Comercial"]},
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
 const [langOpen,setLangOpen]=useState(false);
 const [audienceTab,setAudienceTab]=useState(0);
 useEffect(()=>{
  const search=new URLSearchParams(window.location.search).get("lang");
  if(search==="pt"||search==="en"||search==="es"){setLang(search);return;}
  const browser=navigator.language.toLowerCase();
  setLang(browser.startsWith("en")?"en":browser.startsWith("es")?"es":"pt");
 },[]);
 useEffect(()=>{document.documentElement.lang=lang==="pt"?"pt-BR":lang;},[lang]);
 useEffect(()=>{
  const section=document.querySelector<HTMLElement>(".pnr-audiences");
  if(!section)return;
  if(!("IntersectionObserver" in window)){section.classList.add("pnr-audiences-visible");return;}
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{if(entry.isIntersecting){section.classList.add("pnr-audiences-visible");observer.unobserve(entry.target);}});
  },{threshold:.16});
  observer.observe(section);
  return ()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  const rail=document.querySelector<HTMLElement>(".pnr-style-grid");
  if(!rail)return;
  const cards=Array.from(rail.querySelectorAll<HTMLElement>(".pnr-style-card"));
  let raf=0;
  const update=()=>{
   raf=0;
   const center=rail.getBoundingClientRect().left+rail.clientWidth/2;
   const rects=cards.map(card=>card.getBoundingClientRect());
   let active=0,dist=Infinity;
   rects.forEach((rect,i)=>{
    const delta=Math.abs(rect.left+rect.width/2-center);
    if(delta<dist){dist=delta;active=i;}
   });
   cards.forEach((card,i)=>{
    card.classList.toggle("pnr-style-active",i===active);
    card.dataset.side=i<active?"left":i>active?"right":"center";
    const rect=rects[i];
    const offset=(rect.left+rect.width/2-center)/Math.max(1,rect.width);
    card.style.setProperty("--pnr-distance",String(Math.max(-1.5,Math.min(1.5,offset))));
   });
  };
  const onScroll=()=>{if(!raf)raf=requestAnimationFrame(update);};
  update();
  rail.addEventListener("scroll",onScroll,{passive:true});
  window.addEventListener("resize",onScroll);
  return ()=>{rail.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll);if(raf)cancelAnimationFrame(raf);};
 },[]);

 const t=translations[lang];
 const switchLang=(value:Lang)=>{
  setLang(value);setMenu(false);setLangOpen(false);
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
    <div className="pnr-navright"><div className="pnr-language-picker"><button type="button" className="pnr-language-trigger" aria-label="Selecionar idioma" aria-expanded={langOpen} onClick={()=>setLangOpen(!langOpen)}><span className="pnr-flag" aria-hidden="true"><LanguageFlag code={lang}/></span><ChevronDown size={13}/></button>{langOpen&&<div className="pnr-language-options" role="group" aria-label="Idiomas">{([["pt","🇧🇷","Português"],["en","🇺🇸","English"],["es","🇪🇸","Español"]] as const).map(([value,flag,label])=><button key={value} type="button" className={lang===value?"is-active":""} onClick={()=>switchLang(value)}><span aria-hidden="true"><LanguageFlag code={value}/></span><span>{label}</span></button>)}</div>}</div><Link href="/login">{t.login}</Link><Link href="/cadastro" className="pnr-btn pnr-btn-primary">{t.start}<ArrowUpRight size={16}/></Link></div>
    <button className="pnr-menu-toggle" type="button" aria-expanded={menu} aria-label="Menu" onClick={()=>setMenu(v=>!v)}>{menu?<X/>:<Menu/>}</button>
   </div>
   {menu&&<nav className="pnr-mobile-menu">{t.nav.map((label,i)=><a key={label} href={navigation[i]} onClick={()=>setMenu(false)}>{label}</a>)}<div className="pnr-mobile-languages">{(["pt","en","es"] as const).map(value=><button key={value} type="button" aria-pressed={lang===value} onClick={()=>switchLang(value)}><><LanguageFlag code={value}/> {value==="pt"?"Português":value==="en"?"English":"Español"}</></button>)}</div><Link href="/login">{t.login}</Link><Link href="/cadastro" className="pnr-btn pnr-btn-primary" onClick={()=>setMenu(false)}>{t.start}<ArrowRight size={17}/></Link></nav>}
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
      <div className="pnr-hero-image-stage">
       <img className="pnr-hero-art-approved" src="/landing-premium/hero-illustration-hd.avif" alt="" width="1002" height="611" loading="eager" decoding="async" fetchPriority="high" />
      </div>
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
    <div className="pnr-style-grid" data-motion-scope="styles">{(["institucional","cinematografico","3d-imersivo"] as const).map((id,i)=><div className="pnr-style-card" key={id}><picture><source media="(max-width: 650px)" srcSet={"/gallery-styles/"+id+"-mobile.webp?v=20261111-new-art"}/><img src={"/gallery-styles/"+id+"-desktop.webp"} alt={t.types[i]} width="1600" height="900" loading="lazy" decoding="async"/></picture></div>)}</div>
    <p className="pnr-footnote">{t.stylesNote}</p>
   </section>
   <section id="publicos" className="pnr-section pnr-audiences">
    <header className="pnr-section-heading"><p className="pnr-overline">{t.audienceTag}</p><h2>{t.audienceTitle} <em>{t.audienceHi}</em></h2><p>{t.audienceDesc}</p></header>
    <div className="pnr-showcase">
     <div className="pnr-showcase-tabs" role="tablist" aria-label={lang==="pt"?"Selecione seu perfil":lang==="es"?"Selecciona tu perfil":"Choose your profile"}>{t.audiences.map((item,i)=>{const Icon=audiencesIcons[i];return <button key={i} type="button" role="tab" id={"pnr-showcase-tab-"+i} aria-selected={audienceTab===i} aria-controls="pnr-showcase-panel" tabIndex={audienceTab===i?0:-1} className={"pnr-showcase-tab"+(audienceTab===i?" is-active":"")} onClick={()=>setAudienceTab(i)} onKeyDown={e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();const next=(audienceTab+(e.key==="ArrowRight"?1:3))%4;setAudienceTab(next);document.getElementById("pnr-showcase-tab-"+next)?.focus();}}}><Icon size={17}/><span>{item[0]}</span></button>})}</div>
     <div className="pnr-showcase-stage" id="pnr-showcase-panel" role="tabpanel" aria-labelledby={"pnr-showcase-tab-"+audienceTab}>
      <div className="pnr-showcase-copy"><span className="pnr-showcase-kicker"><Sparkles size={15}/> PAGENOVA AI / 0{audienceTab+1}</span><h3>{t.audiences[audienceTab][0]}</h3><p>{t.audiences[audienceTab][1]}</p><Link className="pnr-showcase-link" href={audienceTab===3?"#solucoes":"/cadastro"}>{lang==="pt"?"Começar agora":lang==="es"?"Empezar ahora":"Get started"}<ArrowUpRight size={17}/></Link><div className="pnr-showcase-copy-footer"><span/><span>{lang==="pt"?"Sua operação, mais inteligente.":lang==="es"?"Tu operación, más inteligente.":"Smarter workflows for you."}</span></div></div>
      <div className="pnr-showcase-dashboard" aria-hidden="true">{[1,2,3,4].map((n)=><img key={n} className={"pnr-showcase-approved-art is-loaded"+(audienceTab===n-1?" is-current":"")} src={"/images/pagenova-vitrine-"+n+".webp"} alt="" loading="eager" decoding="async" fetchPriority={n===1?"high":"auto"} width="1672" height="941"/>)}</div>
      </div>
     </div><p className="pnr-audience-ai"><Sparkles size={17}/><span>{lang==="pt"?"Potencializado por inteligência artificial":lang==="es"?"Impulsado por inteligencia artificial":"Powered by artificial intelligence"}</span></p>
   </section>
   <PremiumAiDemo/>
   <section id="planos" className="pnr-section pnr-pricing">
    <header className="pnr-section-heading"><p className="pnr-overline">{t.pricesTag}</p><h2>{t.pricesTitle} <em>{t.pricesHi}</em></h2><p>{t.pricesDesc}</p></header>
    <div className="pnr-price-grid" data-motion-scope="plans">{t.plans.map((p,i)=>{const Icon=priceIcons[i];return <article key={i} className={"pnr-price-card"+(i===3?" is-featured":"")}>
     {i===3&&<div className="pnr-featured-label"><Crown size={12}/>{t.featured}</div>}
     <div className="pnr-price-top"><span className="pnr-price-icon"><Icon size={22}/></span><div><h3>{p.name}</h3><small>{p.subtitle}</small></div></div>
     <div className="pnr-price-number"><span>R$</span><strong>{amounts[i]}</strong><span>/mês</span></div>
     <div className="pnr-price-details"><span>{t.includes}</span><ul>{p.features.map(f=><li key={f}><Check size={15}/>{f}</li>)}</ul></div>
     {i===2?<button type="button" className="pnr-price-button pnr-price-button-soon" disabled aria-label="Apps e Sistemas: Em Breve">Em Breve</button>:<Link href={"/teste/montar-pacote?plan="+(["studio","crm","apps","completo"][i])} className={"pnr-price-button"+(i===3?" primary":"")}>Montar meu pacote <ArrowRight size={15}/></Link>}<small className="pnr-price-pending">{i===2?"Disponível em breve":"Personalize sua contratação"}</small>
    </article>})}</div><p className="pnr-footnote">{t.pricesNote}</p>
   </section>
   <PageNovaTrustSections language={lang}/>
   <section className="pnr-orb-section" aria-label={lang==="pt"?"Inteligência em movimento":lang==="en"?"Intelligence in motion":"Inteligencia en movimiento"}>
    <div className="pnr-orb-copy"><span className="pnr-orb-eyebrow">PAGENOVA AI / INTELLIGENCE</span><h2>{lang==="pt"?"Ideias em constante":lang==="en"?"Ideas in constant":"Ideas en constante"} <em>{lang==="pt"?"evolução.":lang==="en"?"evolution.":"evolución."}</em></h2><p>{lang==="pt"?"Tecnologia que conecta possibilidades e transforma o que você imagina em algo real.":lang==="en"?"Technology connecting possibilities and turning imagination into reality.":"Tecnología que conecta posibilidades y transforma la imaginación en realidad."}</p></div>
    <div className="pnr-orb-stage" aria-label={lang==="pt"?"Espaço reservado à esfera de partículas aprovada":"Approved particle sphere artwork area"}><div className="pnr-orb-art" role="img" aria-label={lang==="pt"?"Esfera de partículas verdes — arte original aguardando arquivo autorizado":"Green particle sphere — original licensed artwork pending"} /></div>
   </section>
  </main>
  <PageNovaFooter language={lang}/>
 </div>;
}

// Shared landing sections: single source of truth for the landing and package configurator.
export function PageNovaTrustSections({language="pt"}:{language?:Lang}){
 const t=translations[language];
 const [openFaq,setOpenFaq]=useState<number|null>(0);
 return <div className="pnr-page pnr-shared-trust"><section className="pnr-section pnr-trust" id="garantia">
    <div className="pnr-guarantee pnr-guarantee-full-art"><img className="pnr-guarantee-full-image" src="/images/garantia-pagenova-original.webp" alt="Garantia incondicional de 7 dias PageNova AI" loading="lazy" decoding="async" /></div>
    <div className="pnr-faq" id="faq"><div className="pnr-faq-intro"><p className="pnr-overline">{t.faqTag}</p><h2>{t.faqTitle} <em>{t.faqHi}</em></h2><p>{t.faqDesc}</p></div><div className="pnr-faq-items">{t.faqs.map((item:FAQ,i)=><div key={i} className={"pnr-faq-item"+(openFaq===i?" opened":"")}><button type="button" aria-expanded={openFaq===i} onClick={()=>setOpenFaq(openFaq===i?null:i)}>{item.q}<ChevronDown size={17}/></button>{openFaq===i&&<p>{item.a}</p>}</div>)}</div></div>
   </section></div>;
}
export function PageNovaFooter({language="pt",onPackagePage=false}:{language?:Lang;onPackagePage?:boolean}){
 const t=translations[language];
 const footerAnchors=onPackagePage?[["/teste#solucoes","/teste#solucoes","/teste#planos"],["/teste#solucoes","/teste#planos","/teste#estilos"],["#faq","#faq","#faq"]]:[["#solucoes","#solucoes","#planos"],["#solucoes","#planos","#estilos"],["#faq","#faq","#faq"]];
 return <div className="pnr-page pnr-shared-footer"><footer className="pnr-footer pnr-footer-onesignal"><div className="pnr-footer-inner"><div className="pnr-footer-brand"><img src="/brand/pagenova-logo.png" width={204} height={62} alt="PageNova AI"/><p>{t.footerDesc}</p></div>{t.footerLinks.map((column,i)=><div className="pnr-footer-column" key={i}><strong>{t.footerCols[i]}</strong>{column.map((label,j)=><a key={j} href={footerAnchors[i][j]}>{label}</a>)}</div>)}<div className="pnr-footer-column pnr-footer-social-column"><strong>{t.footerCols[3]}</strong><div className="pnr-socials">{([{name:"YouTube",url:"https://www.youtube.com/",icon:<img src="https://cdn.jsdelivr.net/npm/simple-icons@v15/icons/youtube.svg" alt="" width={27} height={27} loading="lazy" />},{name:"Instagram",url:"https://www.instagram.com/",icon:<img src="https://cdn.jsdelivr.net/npm/simple-icons@v15/icons/instagram.svg" alt="" width={27} height={27} loading="lazy" />},{name:"TikTok",url:"https://www.tiktok.com/",icon:<img src="https://cdn.jsdelivr.net/npm/simple-icons@v15/icons/tiktok.svg" alt="" width={27} height={27} loading="lazy" />}]).map(social=><a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.name} title={social.name}>{social.icon}</a>)}</div></div></div><div className="pnr-footer-bottom"><div className="pnr-footer-bottom-brand"><img src="/brand/pagenova-logo.png" width={148} height={46} alt="PageNova AI"/></div><p className="pnr-copyright">© {new Date().getFullYear()} {t.footerBottom}</p></div></footer></div>;
}
