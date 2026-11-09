"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, X } from "lucide-react";

type Locale = "pt" | "en" | "es";
type Category = "all" | "business" | "commerce" | "services";

const examples = [
  {id:"engineering",category:"business",style:"industrial",art:"/templates/vertice-premium/a203401e-d5d3-4f4a-950a-86642f9c5db3/src/assets/hero.jpg",brand:"VÉRTICE",accent:"#e7bd7a",theme:"#101a1d",
    names:{pt:"Engenharia e arquitetura",en:"Engineering & architecture",es:"Ingeniería y arquitectura"},
    headline:{pt:"Projetos que inspiram o amanhã.",en:"Building what comes next.",es:"Proyectos que inspiran el mañana."},
    categoryLabel:{pt:"Institucional",en:"Business website",es:"Institucional"}},
  {id:"laundry",category:"services",style:"laundry",art:"/pagenova-lavanderia-banner-1.png",brand:"LAVANDERIA",accent:"#7ee5cc",theme:"#0a2330",
    names:{pt:"Lavanderia moderna",en:"Modern laundry",es:"Lavandería moderna"},
    headline:{pt:"Cuidado especial em cada detalhe.",en:"Care in every detail.",es:"Cuidado en cada detalle."},
    categoryLabel:{pt:"Serviços",en:"Services",es:"Servicios"}},
  {id:"creative",category:"commerce",style:"creative",art:"/landing-universal/offer.webp",brand:"ATELIER",accent:"#e6c6a0",theme:"#3b3029",
    names:{pt:"Marca e produtos digitais",en:"Brand & digital products",es:"Marca y productos digitales"},
    headline:{pt:"Criatividade com personalidade.",en:"Made to stand out.",es:"Creatividad con personalidad."},
    categoryLabel:{pt:"Página de vendas",en:"Sales page",es:"Página de ventas"}},
  {id:"technology",category:"business",style:"technology",art:"",brand:"NEXORA / AI",accent:"#a3ff69",theme:"#0b1420",
    names:{pt:"Tecnologia e inteligência artificial",en:"Technology & AI",es:"Tecnología e IA"},
    headline:{pt:"Ideias que movem o futuro.",en:"Ideas moving us forward.",es:"Ideas que impulsan el futuro."},
    categoryLabel:{pt:"SaaS e tecnologia",en:"SaaS & technology",es:"SaaS y tecnología"}},
  {id:"hotel",category:"services",style:"hotel",art:"/landing-universal/hero.webp",brand:"AURORA",accent:"#f6d7a4",theme:"#192922",
    names:{pt:"Hotelaria e experiências",en:"Hospitality & experiences",es:"Hotelería y experiencias"},
    headline:{pt:"O lugar para viver o extraordinário.",en:"A place to feel extraordinary.",es:"Un lugar para lo extraordinario."},
    categoryLabel:{pt:"Hospitalidade",en:"Hospitality",es:"Hospitalidad"}},
  {id:"retail",category:"commerce",style:"retail",art:"/pagenova-lavanderia-banner-2.png",brand:"ESSÊNCIA",accent:"#f6c6bf",theme:"#322129",
    names:{pt:"Loja e catálogo online",en:"Online store & catalog",es:"Tienda y catálogo"},
    headline:{pt:"Uma experiência feita para você.",en:"Designed around you.",es:"Una experiencia para ti."},
    categoryLabel:{pt:"Varejo",en:"Retail",es:"Comercio"}}
] as const;

const dictionary = {
  pt:{eyebrow:"CRIATIVIDADE SEM LIMITES",title:"Uma ideia. Infinitas",highlight:"possibilidades.",desc:"Explore diferentes direções visuais para o seu negócio. Cada nicho pede uma identidade — e a PageNova ajuda você a criar a sua.",all:"Todos",business:"Institucional",commerce:"Vendas e lojas",services:"Serviços",tag:"EXEMPLO VISUAL",view:"Ampliar prévia",note:"Composições demonstrativas de nichos. Não são depoimentos nem projetos publicados de clientes.",cta:"Começar meu projeto",close:"Fechar prévia",prev:"Anterior",next:"Próximo",counter:"de"},
  en:{eyebrow:"CREATIVITY WITHOUT LIMITS",title:"One idea. Endless",highlight:"possibilities.",desc:"Explore different visual directions for your business. Every industry deserves its own identity — PageNova helps you create yours.",all:"All",business:"Business",commerce:"Sales & stores",services:"Services",tag:"VISUAL CONCEPT",view:"View preview",note:"Illustrative industry concepts, not published client projects or testimonials.",cta:"Start my project",close:"Close preview",prev:"Previous",next:"Next",counter:"of"},
  es:{eyebrow:"CREATIVIDAD SIN LÍMITES",title:"Una idea. Infinitas",highlight:"posibilidades.",desc:"Explora diferentes estilos visuales para tu negocio. Cada sector merece su propia identidad y PageNova te ayuda a crearla.",all:"Todos",business:"Institucional",commerce:"Ventas y tiendas",services:"Servicios",tag:"EJEMPLO VISUAL",view:"Ampliar vista",note:"Conceptos visuales ilustrativos, no son proyectos de clientes publicados.",cta:"Empezar mi proyecto",close:"Cerrar vista",prev:"Anterior",next:"Siguiente",counter:"de"}
} as const;

function SiteVisual({item,lang}:{item:typeof examples[number];lang:Locale}) {
  return <div className={"pn-gallery-visual pn-gallery-"+item.style} style={{background:item.theme}}>
    {item.art && <img className="pn-gallery-photo" src={item.art} alt="" loading="lazy" decoding="async" />}
    <div className="pn-gallery-shade"/>
    {item.id==="technology" && <div className="pn-gallery-tech-art" aria-hidden="true"><span/><span/><span/><span/></div>}
    <div className="pn-gallery-browser">
      <span/><span/><span/>
      <span className="pn-gallery-url">pagenova.site / preview</span>
    </div>
    <div className="pn-gallery-siteheader">
      <b>{item.brand}<i style={{color:item.accent}}>.</i></b>
      <div><span/><span/><span/></div>
      <span className="pn-gallery-cta-mini" style={{background:item.accent}}/>
    </div>
    <div className="pn-gallery-copy">
      <span className="pn-gallery-overline" style={{color:item.accent}}>{item.categoryLabel[lang]}</span>
      <h3>{item.headline[lang]}</h3>
      <p><span/><span/></p>
      <div className="pn-gallery-mini-button" style={{background:item.accent}}><span/><ArrowUpRight size={11}/></div>
    </div>
    <div className="pn-gallery-bottom"><span/><span/><span/></div>
  </div>;
}

export function LandingGallery() {
  const [lang,setLang]=useState<Locale>("pt");
  const [category,setCategory]=useState<Category>("all");
  const [selected,setSelected]=useState<number|null>(null);
  useEffect(()=>{
    const sync=()=>{const value=document.documentElement.lang.toLowerCase();setLang(value.startsWith("en")?"en":value.startsWith("es")?"es":"pt");};
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(selected===null)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const onKey=(e:KeyboardEvent)=>{
      if(e.key==="Escape")setSelected(null);
      if(e.key==="ArrowRight")setSelected(i=>i===null?i:(i+1)%examples.length);
      if(e.key==="ArrowLeft")setSelected(i=>i===null?i:(i+examples.length-1)%examples.length);
    };
    window.addEventListener("keydown",onKey);
    return ()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",onKey);};
  },[selected]);
  const t=dictionary[lang];
  const shown=examples.map((item,index)=>({...item,index})).filter(item=>category==="all"||item.category===category);
  return <>
    <section id="galeria" className="pn-gallery-section relative z-10 overflow-hidden border-t border-white/[.07] bg-[#090e0b] px-5 py-20 sm:px-8 sm:py-28 lg:py-36">
      <div className="pn-gallery-halo" aria-hidden="true"/>
      <div className="relative mx-auto max-w-[1250px]">
        <div className="mx-auto max-w-[890px] text-center">
          <p className="mb-5 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[.24em] text-[#b6ff69]"><span className="h-[5px] w-[5px] rounded-full bg-[#b6ff69]"/>{t.eyebrow}</p>
          <h2 className="text-[clamp(2.35rem,5.4vw,5.5rem)] font-extrabold leading-[1.08] tracking-[-.06em] text-white">{t.title}<br/><span className="text-[#b6ff69]">{t.highlight}</span></h2>
          <p className="mx-auto mt-6 max-w-[670px] text-[15px] leading-[1.8] text-[#b3beb4] sm:text-lg">{t.desc}</p>
        </div>
        <div className="mt-11 flex flex-wrap justify-center gap-2.5 sm:mt-14" aria-label={lang==="pt"?"Filtros de projetos":"Project filters"}>
          {(["all","business","commerce","services"] as const).map(key=><button type="button" key={key} onClick={()=>setCategory(key)} aria-pressed={category===key} className={"min-h-10 rounded-full border px-4 text-xs font-semibold transition-colors sm:px-5 sm:text-sm "+(category===key?"border-[#b6ff69] bg-[#b6ff69] text-[#0d1b0a]":"border-white/15 bg-white/[.04] text-[#c9d5ca] hover:border-[#b6ff69]/50 hover:text-white")}>{t[key]}</button>)}
        </div>
        <div className="pn-gallery-grid mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map(item=><article key={item.id} className="pn-gallery-card group min-w-0 overflow-hidden rounded-[22px] border border-white/[.11] bg-[#111a14] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#b6ff69]/40 hover:shadow-[0_30px_80px_#0008]">
            <button type="button" onClick={()=>setSelected(item.index)} className="block w-full cursor-zoom-in text-left" aria-label={t.view+": "+item.names[lang]}>
              <div className="pn-gallery-media overflow-hidden border-b border-white/[.09]"><SiteVisual item={item} lang={lang}/></div>
              <div className="flex items-center justify-between gap-3 px-5 py-5">
                <div className="min-w-0"><span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#99ab9c]">{item.categoryLabel[lang]}</span><h3 className="mt-1 truncate text-[17px] font-bold text-white">{item.names[lang]}</h3></div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-[#b6ff69] transition group-hover:border-[#b6ff69] group-hover:bg-[#b6ff69] group-hover:text-[#101b0e]"><ArrowUpRight size={19}/></span>
              </div>
            </button>
          </article>)}
        </div>
        <div className="mt-10 flex flex-col items-center gap-5 text-center sm:mt-14">
          <p className="max-w-[650px] text-xs leading-6 text-[#8e9c90]">{t.note}</p>
          <a href="/cadastro" className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#b6ff69] px-6 text-[13px] font-bold text-[#101a0d] transition hover:bg-[#d5ffa8]">{t.cta}<ArrowRight size={17}/></a>
        </div>
      </div>
    </section>
    <AiEditorDemo lang={lang}/>
    {selected!==null && <div className="pn-gallery-modal fixed inset-0 z-[200] flex items-center justify-center bg-[#030603]/90 p-3 backdrop-blur-xl sm:p-8" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}>
      <div role="dialog" aria-modal="true" aria-label={examples[selected].names[lang]} className="w-full max-w-[1050px] overflow-hidden rounded-2xl border border-[#a5ff6a]/25 bg-[#0c130e] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6"><div className="min-w-0"><p className="text-[10px] tracking-[.2em] text-[#b6ff69]">{t.tag}</p><h3 className="truncate text-sm font-bold text-white sm:text-lg">{examples[selected].names[lang]}</h3></div><button type="button" onClick={()=>setSelected(null)} className="rounded-full border border-white/20 p-2 text-white hover:bg-white/10" aria-label={t.close}><X size={18}/></button></div>
        <SiteVisual item={examples[selected]} lang={lang}/>
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6"><button type="button" className="inline-flex items-center gap-2 text-xs font-semibold text-white/80" onClick={()=>setSelected((selected+examples.length-1)%examples.length)}><ChevronLeft size={18}/>{t.prev}</button><span className="text-xs text-white/55">{selected+1} {t.counter} {examples.length}</span><button type="button" className="inline-flex items-center gap-2 text-xs font-semibold text-white/80" onClick={()=>setSelected((selected+1)%examples.length)}>{t.next}<ChevronRight size={18}/></button></div>
      </div>
    </div>}
    <style>{`
      .pn-gallery-section{font-family:inherit}.pn-gallery-halo{position:absolute;left:50%;top:0;width:70vw;height:500px;transform:translateX(-50%);pointer-events:none;background:radial-gradient(ellipse at center,#96f35b0b,transparent 66%)}
      .pn-gallery-visual{height:260px;position:relative;overflow:hidden;color:white;isolation:isolate}
      .pn-gallery-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.75;filter:saturate(.88)}
      .pn-gallery-shade{position:absolute;inset:0;background:linear-gradient(90deg,#0b1010f0 0%,#101713a8 50%,#090d0a35 100%)}
      .pn-gallery-industrial .pn-gallery-photo{object-position:60% 45%}
      .pn-gallery-laundry .pn-gallery-photo{object-position:65% 50%}
      .pn-gallery-creative .pn-gallery-photo{object-position:75% 50%}
      .pn-gallery-hotel .pn-gallery-photo{object-position:70% 40%}
      .pn-gallery-retail .pn-gallery-photo{object-position:62% 42%}
      .pn-gallery-browser{position:relative;height:23px;display:flex;align-items:center;gap:5px;padding:0 12px;background:#07100bc4;border-bottom:1px solid #ffffff20}
      .pn-gallery-browser>span:not(.pn-gallery-url){width:5px;height:5px;border-radius:50%;background:#fa8383}.pn-gallery-browser>span:nth-child(2){background:#f0c979}.pn-gallery-browser>span:nth-child(3){background:#78b99a}
      .pn-gallery-url{position:absolute;left:35%;right:35%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;font-size:7px;letter-spacing:.03em;color:#ffffff70}
      .pn-gallery-siteheader{position:relative;z-index:2;height:45px;display:flex;align-items:center;justify-content:space-between;padding:0 17px;border-bottom:1px solid #ffffff26}
      .pn-gallery-siteheader>b{font-size:11px;font-weight:800;letter-spacing:.04em}.pn-gallery-siteheader i{font-style:normal}
      .pn-gallery-siteheader>div{display:flex;gap:9px}.pn-gallery-siteheader>div span{display:block;width:22px;height:3px;border-radius:3px;background:#ffffff85}
      .pn-gallery-cta-mini{width:38px;height:12px;border-radius:3px}
      .pn-gallery-copy{position:relative;z-index:2;margin:26px 0 0 22px;width:58%;max-width:320px}
      .pn-gallery-overline{text-transform:uppercase;font-size:8px;letter-spacing:.16em;font-weight:800}
      .pn-gallery-copy h3{font-size:clamp(17px,2.2vw,26px);line-height:1.18;letter-spacing:-.045em;font-weight:800;margin-top:8px;text-wrap:balance}
      .pn-gallery-copy p{margin-top:11px;display:flex;flex-direction:column;gap:5px}
      .pn-gallery-copy p span{display:block;height:4px;width:80%;background:#ffffffa3;border-radius:5px}.pn-gallery-copy p span:last-child{width:60%;background:#ffffff65}
      .pn-gallery-mini-button{margin-top:13px;display:flex;align-items:center;gap:6px;width:70px;height:22px;justify-content:center;border-radius:4px;color:#101713}
      .pn-gallery-mini-button span{width:29px;height:3px;border-radius:2px;background:#102013a1}
      .pn-gallery-bottom{position:absolute;bottom:12px;left:22px;display:flex;gap:6px}.pn-gallery-bottom span{width:31px;height:3px;background:#ffffff35;border-radius:4px}
      .pn-gallery-tech-art{position:absolute;inset:20px -40px -40px 40%;transform:rotate(-18deg)}
      .pn-gallery-tech-art span{display:block;position:absolute;inset:10% 10%;border:1px solid #a3ff6980;border-radius:30px;box-shadow:0 0 50px #a3ff691b;background:linear-gradient(130deg,#a3ff6930,#263e7640)}
      .pn-gallery-tech-art span:nth-child(2){inset:24% -2% 24% 20%;transform:rotate(28deg)}
      .pn-gallery-tech-art span:nth-child(3){inset:35% 17%;transform:rotate(-30deg);border-color:#7ab1ff95}
      .pn-gallery-tech-art span:nth-child(4){inset:44% 35%;background:#a3ff6945}
      .pn-gallery-modal .pn-gallery-visual{height:min(62vh,570px)}
      .pn-gallery-modal .pn-gallery-siteheader{height:65px;padding:0 5%}
      .pn-gallery-modal .pn-gallery-siteheader>b{font-size:20px}
      .pn-gallery-modal .pn-gallery-copy{margin:7% 0 0 6%;max-width:530px}
      .pn-gallery-modal .pn-gallery-overline{font-size:12px}
      .pn-gallery-modal .pn-gallery-copy h3{font-size:clamp(27px,5vw,60px);line-height:1.12}
      .pn-gallery-modal .pn-gallery-copy p span{height:6px}
      .pn-gallery-modal .pn-gallery-mini-button{width:110px;height:35px}
      @media(max-width:640px){.pn-gallery-visual{height:245px}.pn-gallery-copy{margin-top:25px}.pn-gallery-modal .pn-gallery-visual{height:min(56vh,410px)}.pn-gallery-modal .pn-gallery-copy{width:76%;margin-top:48px}.pn-gallery-modal .pn-gallery-siteheader{height:48px}.pn-gallery-modal .pn-gallery-copy h3{font-size:clamp(24px,6vw,38px)}}
      @media(prefers-reduced-motion:reduce){.pn-gallery-card{transition:none!important;transform:none!important}}
    `}</style>
  </>;
}

type DemoStep = 0|1|2;
const aiDemoTranslations = {
  pt:{
    eyebrow:"PERSONALIZAÇÃO COM INTELIGÊNCIA ARTIFICIAL",headline:"Você imagina. A IA",highlight:"transforma.",description:"Peça mudanças em linguagem natural e veja o projeto ganhar uma nova aparência. Uma demonstração interativa de como funciona a personalização.",
    chat:"Assistente PageNova",assistant:"Assistente de criação",status:"Demonstração interativa",site:"Prévia do site",live:"Atualização visual",prompt:"Escolha uma alteração",send:"Aplicar alteração",done:"Alteração aplicada",ready:"Escolha um comando para ver o resultado",note:"Simulação visual ilustrativa. Não envia comandos ao Builder, não consome créditos nem altera projetos reais.",
    prompts:["Mude o título e a chamada principal","Troque as cores para um estilo premium","Adicione uma seção de diferenciais"],assistantReplies:["Atualizei o título e a mensagem principal.","Nova identidade visual aplicada ao projeto.","Seção de diferenciais adicionada."],
    defaultTitle:"Uma experiência para descobrir.",changedTitle:"Seu próximo nível começa aqui.",subtitle:"Soluções que conectam ideias e negócios.",features:"Por que escolher nossa marca",featureNames:["Design exclusivo","Experiência intuitiva","Resultados sob medida"],cta:"Conhecer soluções",before:"Antes",after:"Depois",reset:"Reiniciar",next:"Próxima alteração"
  },
  en:{
    eyebrow:"AI-POWERED CUSTOMIZATION",headline:"You imagine. AI",highlight:"transforms.",description:"Request changes in natural language and watch your project take a new shape. An interactive showcase of what customization can look like.",
    chat:"PageNova Assistant",assistant:"Creative assistant",status:"Interactive demo",site:"Website preview",live:"Visual update",prompt:"Choose an edit",send:"Apply change",done:"Change applied",ready:"Choose a request to see the result",note:"Illustrative visual simulation. Does not send commands to the real Builder, use credits, or modify projects.",
    prompts:["Update the hero headline","Switch to a premium color palette","Add a key benefits section"],assistantReplies:["Headline and primary message updated.","A premium color palette has been applied.","A new benefits section has been added."],
    defaultTitle:"An experience worth discovering.",changedTitle:"Your next chapter starts here.",subtitle:"Solutions connecting ideas and business.",features:"Why choose our brand",featureNames:["Distinctive design","Easy experience","Made for your goals"],cta:"Explore services",before:"Before",after:"After",reset:"Reset",next:"Next edit"
  },
  es:{
    eyebrow:"PERSONALIZACIÓN CON INTELIGENCIA ARTIFICIAL",headline:"Tú imaginas. La IA",highlight:"transforma.",description:"Pide cambios con lenguaje natural y descubre cómo evoluciona el diseño. Una demostración interactiva de personalización.",
    chat:"Asistente PageNova",assistant:"Asistente creativo",status:"Demostración interactiva",site:"Vista del sitio",live:"Cambio visual",prompt:"Elige un cambio",send:"Aplicar cambio",done:"Cambio aplicado",ready:"Elige una instrucción para ver el resultado",note:"Simulación visual ilustrativa. No envía comandos al Builder real, no consume créditos ni modifica proyectos.",
    prompts:["Cambia el título principal","Utiliza una paleta premium","Añade una sección de beneficios"],assistantReplies:["Título principal actualizado.","Nueva paleta de colores aplicada.","Sección de beneficios añadida."],
    defaultTitle:"Una experiencia por descubrir.",changedTitle:"Tu próximo nivel comienza aquí.",subtitle:"Soluciones que conectan ideas y negocios.",features:"Por qué elegir nuestra marca",featureNames:["Diseño exclusivo","Experiencia intuitiva","A tu medida"],cta:"Conocer servicios",before:"Antes",after:"Después",reset:"Reiniciar",next:"Siguiente cambio"
  }
} as const;

function AiEditorDemo({lang}:{lang:Locale}) {
  const t=aiDemoTranslations[lang];
  const [step,setStep]=useState<DemoStep>(0);
  const [stage,setStage]=useState(0);
  const [playing,setPlaying]=useState(true);
  const [animating,setAnimating]=useState(false);
  useEffect(()=>{
    if(!playing)return;
    if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
    const timer=window.setInterval(()=>{
      setStep(prev=>(prev+1)%3 as DemoStep);
      setStage(prev=>Math.min(3,prev+1));
    },6200);
    return ()=>window.clearInterval(timer);
  },[playing]);
  useEffect(()=>{
    setAnimating(true);
    const id=window.setTimeout(()=>setAnimating(false),420);
    return ()=>window.clearTimeout(id);
  },[step,stage]);
  const showNewTitle=stage>=1;
  const premium=stage>=2;
  const showFeatures=stage>=3;
  const theme=premium?"#cfb390":"#b6ff69";
  const handleChange=(index:DemoStep)=>{
    setPlaying(false);
    setStep(index);
    setStage(index+1);
  };
  const reset=()=>{setPlaying(false);setStep(0);setStage(0);};
  return <section id="edicao-ia" className="relative isolate overflow-hidden border-t border-white/[.07] bg-[#070d09] px-5 py-20 text-white sm:px-8 sm:py-28 lg:py-36" style={{fontFamily:"inherit"}}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_55%_45%,rgba(154,255,96,.075),transparent_62%)]"/>
    <div className="relative mx-auto max-w-[1280px]">
      <div className="mx-auto max-w-[920px] text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#b6ff69]/25 bg-[#b6ff69]/[.06] px-4 py-2 text-[10px] font-bold tracking-[.15em] text-[#b6ff69] sm:text-xs"><span className="text-base">✦</span>{t.eyebrow}</div>
        <h2 className="text-[clamp(2.55rem,5.7vw,5.8rem)] font-extrabold leading-[1.04] tracking-[-.065em]">{t.headline}<br/><span className="text-[#b6ff69]">{t.highlight}</span></h2>
        <p className="mx-auto mt-6 max-w-[720px] text-[15px] leading-[1.8] text-[#abb8ae] sm:text-lg">{t.description}</p>
      </div>
      <div className="mt-12 overflow-hidden rounded-[24px] border border-[#9cff7833] bg-[#0b130e] shadow-[0_35px_110px_#0009] lg:mt-16 lg:grid lg:min-h-[590px] lg:grid-cols-[.39fr_.61fr]">
        <div className="flex flex-col border-b border-white/10 lg:border-b-0 lg:border-r">
          <div className="flex min-h-[74px] items-center gap-3 border-b border-white/10 px-5 sm:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b6ff69]/10 text-[#b6ff69]"><span className="text-xl">✦</span></div>
            <div><p className="text-sm font-bold">{t.chat}</p><p className="text-xs text-white/45">{t.assistant}</p></div>
            <span className="ml-auto rounded-full border border-[#b6ff69]/20 bg-[#b6ff69]/[.06] px-2 py-1 text-[10px] text-[#b6ff69]">{t.status}</span>
          </div>
          <div className="flex-1 space-y-5 p-5 sm:p-7" aria-live="polite">
            <div className="ml-auto max-w-[94%] rounded-2xl rounded-tr-md border border-white/10 bg-[#1b2a20] p-4 text-sm leading-6 text-white/90"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#b6ff69]">{t.prompt}</span>{t.prompts[step]}</div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#b6ff69]/15 text-[#b6ff69]">✦</div>
              <div className="max-w-[90%] rounded-2xl rounded-tl-md border border-white/10 bg-[#101b14] p-4 text-sm leading-6 text-[#d7e2d8]"><p>{stage>0?t.assistantReplies[step]:t.ready}</p>{stage>0&&<span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#b6ff69]"><Check size={14}/>{t.done}</span>}</div>
            </div>
          </div>
          <div className="border-t border-white/10 p-4 sm:p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.12em] text-white/50">{t.prompt}</p>
            <div className="flex flex-col gap-2">
              {t.prompts.map((prompt,index)=><button key={index} type="button" aria-pressed={stage>0&&step===index} onClick={()=>handleChange(index as DemoStep)} className={"flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left text-xs leading-5 transition sm:text-[13px] "+(stage>0&&step===index?"border-[#b6ff69]/50 bg-[#b6ff69]/10 text-white":"border-white/10 bg-white/[.025] text-[#c6d0c8] hover:border-[#b6ff69]/30 hover:text-white")}>{prompt}<ArrowUpRight size={15} className="shrink-0 text-[#b6ff69]"/></button>)}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3"><button type="button" onClick={reset} className="text-xs text-white/55 underline underline-offset-4 hover:text-white">{t.reset}</button><span className="text-[10px] text-white/35">{stage>0?`${Math.min(stage,3)}/3`:"0/3"}</span></div>
          </div>
        </div>
        <div className="min-w-0 bg-[#101a14]">
          <div className="flex min-h-[55px] items-center justify-between gap-3 border-b border-white/10 px-4 sm:px-6">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ee7777]"/><span className="h-2 w-2 rounded-full bg-[#dfbc68]"/><span className="h-2 w-2 rounded-full bg-[#78c991]"/><span className="ml-2 text-xs font-medium text-white/65">{t.site}</span></div>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#b6ff69]"><span className="h-1.5 w-1.5 rounded-full bg-[#b6ff69]"/>{t.live}</span>
          </div>
          <div className="p-3 sm:p-5">
            <div className={"relative flex min-h-[380px] flex-col overflow-hidden rounded-xl border border-white/10 transition-colors duration-500 sm:min-h-[490px] "+(premium?"bg-[#201c1a]":"bg-[#13241c]")}>
              <div className="absolute inset-0 pointer-events-none" style={{background:premium?"radial-gradient(circle at 86% 46%,#b89a6a60,transparent 45%)":"radial-gradient(circle at 86% 46%,#78be8c55,transparent 45%)"}}/>
              <div className="relative flex h-16 items-center justify-between gap-3 border-b border-white/10 px-5 sm:px-8">
                <span className="text-lg font-extrabold tracking-tight">ATELIER<span style={{color:theme}}>.</span></span><div className="hidden gap-5 sm:flex">{["Studio","Sobre","Contato"].map(x=><span key={x} className="text-[10px] text-white/60">{x}</span>)}</div><span className="h-6 w-12 rounded-md transition-colors duration-500" style={{background:theme}}/>
              </div>
              <div className="relative grid flex-1 grid-cols-1 items-center gap-5 p-6 sm:grid-cols-[1.1fr_.9fr] sm:gap-8 sm:p-9">
                <div className={"relative z-10 transition-all duration-500 "+(animating?"opacity-75 translate-y-1":"opacity-100 translate-y-0")}>
                  <p className="mb-4 text-[10px] font-bold tracking-[.21em] uppercase" style={{color:theme}}>Branding & Design Studio</p>
                  <h3 className="max-w-[410px] text-[clamp(2.3rem,4vw,4.7rem)] font-extrabold leading-[1.04] tracking-[-.065em]">{showNewTitle?t.changedTitle:t.defaultTitle}</h3>
                  <p className="mt-5 max-w-[320px] text-[13px] leading-6 text-white/70">{t.subtitle}</p>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-xs font-bold text-[#101710] transition-colors duration-500" style={{background:theme}}>{t.cta}<ArrowRight size={14}/></span>
                </div>
                <div className="relative mx-auto hidden h-60 w-full max-w-[250px] items-center justify-center sm:flex">
                  <div className="absolute h-52 w-52 rotate-12 rounded-[35px] border transition-colors duration-500" style={{borderColor:theme+"70",background:theme+"18"}}/>
                  <div className="absolute h-44 w-44 -rotate-[16deg] rounded-[35px] border transition-colors duration-500" style={{borderColor:theme+"80",background:theme+"25"}}/>
                  <div className="relative flex h-28 w-28 rotate-6 items-center justify-center rounded-[28px] border bg-white/[.06] text-6xl shadow-2xl" style={{borderColor:theme+"65"}}>✦</div>
                </div>
              </div>
              <div className={"relative grid overflow-hidden border-t border-white/10 bg-black/20 transition-all duration-500 "+(showFeatures?"grid-rows-[1fr] opacity-100":"grid-rows-[0fr] opacity-0")}>
                <div className="min-h-0"><div className="p-5 sm:p-7"><p className="mb-4 text-sm font-bold">{t.features}</p><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{t.featureNames.map(name=><div key={name} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-[11px]"><Check size={14} style={{color:theme}}/>{name}</div>)}</div></div></div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-5 text-[11px] text-white/50 sm:px-6"><span>{t.before} / {t.after}</span><span className="text-[#b6ff69]">{stage>0?t.done:t.ready}</span></div>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-[720px] text-center text-xs leading-6 text-[#819285]">{t.note}</p>
    </div>
  </section>;
}
