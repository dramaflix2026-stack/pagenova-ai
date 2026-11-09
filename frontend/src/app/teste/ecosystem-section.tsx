"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Blocks, Check, ChevronRight, Code2, Globe, LayoutTemplate, Search, Sparkles, Users } from "lucide-react";
type Lang = "pt"|"en"|"es";
type Key = "studio"|"crm"|"apps";
const keys:Key[]=["studio","crm","apps"];
const color={studio:"#b6ff69",crm:"#7ee4cf",apps:"#bfa7fa"};
const icons={studio:LayoutTemplate,crm:Users,apps:Blocks};
const locale={
 pt:{kicker:"UM ECOSSISTEMA DE CRIAÇÃO E NEGÓCIOS",title:"Três ferramentas. Um universo de",highlight:"possibilidades.",desc:"Da ideia ao próximo cliente. Descubra o ecossistema PageNova.",preview:"Prévia ilustrativa",features:"Principais recursos",cta:"Começar agora",note:"Interfaces demonstrativas. Recursos de Apps e Sistemas estão em evolução.",select:"Selecionar ferramenta",products:{
 studio:{name:"PageNova Studio",label:"CRIAÇÃO DIGITAL",headline:"Crie seu próximo grande projeto.",desc:"Sites, landing pages e personalização com inteligência artificial.",features:["Sites e landing pages","Modelos por nicho","Edição com IA"]},
 crm:{name:"PageNova CRM",label:"PROSPECÇÃO E VENDAS",headline:"Encontre novas oportunidades.",desc:"Pesquisa de empresas e organização de leads e oportunidades comerciais.",features:["Busca de empresas","Gestão de leads","Organização comercial"]},
 apps:{name:"Apps e Sistemas",label:"EM EVOLUÇÃO",headline:"Novas soluções estão chegando.",desc:"Uma frente de expansão para sistemas e aplicativos. Algumas funcionalidades estão em desenvolvimento.",features:["Soluções digitais","Expansão de produtos","Recursos em desenvolvimento"]}
 }},
 en:{kicker:"AN ECOSYSTEM FOR CREATORS & BUSINESS",title:"Three tools. A world of",highlight:"possibilities.",desc:"From your first idea to your next customer. Explore PageNova's ecosystem.",preview:"Illustrative preview",features:"Main capabilities",cta:"Get started",note:"Illustrative interfaces. Apps & Systems is still evolving.",select:"Choose a tool",products:{
 studio:{name:"PageNova Studio",label:"DIGITAL CREATION",headline:"Create your next big project.",desc:"Websites, landing pages and AI-powered customization.",features:["Websites and landing pages","Industry templates","AI editing"]},
 crm:{name:"PageNova CRM",label:"PROSPECTING & SALES",headline:"Discover new opportunities.",desc:"Business search and organized leads and opportunities.",features:["Business discovery","Lead management","Sales organization"]},
 apps:{name:"Apps & Systems",label:"IN DEVELOPMENT",headline:"New digital solutions are coming.",desc:"An expanding direction for applications and systems. Some capabilities are in development.",features:["Digital solutions","Product expansion","Capabilities in development"]}
 }},
 es:{kicker:"UN ECOSISTEMA PARA CREAR Y VENDER",title:"Tres herramientas. Un mundo de",highlight:"posibilidades.",desc:"Desde la primera idea hasta tu próximo cliente. Descubre el ecosistema PageNova.",preview:"Vista ilustrativa",features:"Principales funciones",cta:"Comenzar ahora",note:"Interfaces ilustrativas. Apps y Sistemas sigue evolucionando.",select:"Elegir herramienta",products:{
 studio:{name:"PageNova Studio",label:"CREACIÓN DIGITAL",headline:"Crea tu próximo gran proyecto.",desc:"Sitios web, landing pages y personalización con IA.",features:["Sitios y landing pages","Plantillas por sector","Edición con IA"]},
 crm:{name:"PageNova CRM",label:"PROSPECCIÓN Y VENTAS",headline:"Descubre nuevas oportunidades.",desc:"Búsqueda de empresas y organización de leads y oportunidades.",features:["Búsqueda de empresas","Gestión de leads","Organización comercial"]},
 apps:{name:"Apps y Sistemas",label:"EN DESARROLLO",headline:"Nuevas soluciones están llegando.",desc:"Una línea en expansión para aplicaciones y sistemas. Algunas funciones siguen en desarrollo.",features:["Soluciones digitales","Expansión de productos","Funciones en desarrollo"]}
 }} 
} as const;
function Mockup({mode}:{mode:Key}){
 return <div className="h-full overflow-hidden rounded-xl border border-white/10 bg-[#0d1912]">
  <div className="flex h-9 items-center gap-1.5 border-b border-white/10 bg-[#0a110c] px-3"><i className="h-2 w-2 rounded-full bg-red-400/70"/><i className="h-2 w-2 rounded-full bg-amber-400/70"/><i className="h-2 w-2 rounded-full bg-emerald-400/70"/><span className="ml-auto text-[9px] text-white/40">PageNova</span></div>
  {mode==="studio" ? <div className="flex h-[calc(100%-36px)] gap-3 p-3"><div className="w-8 shrink-0 space-y-3 border-r border-white/10 pt-3">{[1,2,3,4].map(i=><div key={i} className="h-4 w-4 rounded bg-[#b6ff69]/20"/>)}</div><div className="min-w-0 flex-1"><div className="h-28 rounded-lg border border-[#b6ff69]/20 bg-gradient-to-r from-[#1d3325] to-[#3d6850] p-4 sm:h-40"><div className="h-2 w-12 rounded-full bg-[#b6ff69]"/><div className="mt-5 h-4 w-[65%] rounded bg-white/80"/><div className="mt-2 h-4 w-[45%] rounded bg-white/60"/><div className="mt-4 h-5 w-20 rounded bg-[#b6ff69]"/></div><div className="mt-3 grid grid-cols-3 gap-2">{[1,2,3].map(i=><div key={i} className="h-12 rounded border border-white/10 bg-white/10 sm:h-16"/>)}</div></div></div> :
  mode==="crm" ? <div className="p-4"><div className="grid grid-cols-3 gap-2">{[1,2,3].map(i=><div key={i} className="rounded-lg border border-white/10 bg-[#7ee4cf]/10 p-3"><div className="h-2 w-12 rounded bg-white/35"/><div className="mt-3 h-5 w-9 rounded bg-[#7ee4cf]"/></div>)}</div><div className="mt-4 flex h-24 items-end gap-3 rounded-lg bg-[#7ee4cf]/10 p-4 sm:h-36">{[35,62,44,75,55,90,72].map((n,i)=><i key={i} style={{height:n+"%"}} className="flex-1 rounded-t bg-[#7ee4cf]/65"/>)}</div><div className="mt-3 space-y-2">{[1,2,3].map(i=><div key={i} className="h-4 rounded bg-white/10"/>)}</div></div> :
  <div className="grid grid-cols-2 gap-3 p-4">{[Code2,Globe,Blocks,Sparkles].map((Icon,i)=><div key={i} className="flex h-20 items-center gap-3 rounded-xl border border-[#bfa7fa]/20 bg-[#bfa7fa]/10 p-3 sm:h-28"><Icon className="text-[#bfa7fa]" size={24}/><div className="space-y-2"><div className="h-2 w-14 rounded bg-[#bfa7fa]/60"/><div className="h-2 w-10 rounded bg-white/25"/></div></div>)}</div>}
 </div>;
}
export function EcosystemSection(){
 const [lang,setLang]=useState<Lang>("pt"),[active,setActive]=useState<Key>("studio");
 useEffect(()=>{const update=()=>{const l=document.documentElement.lang.toLowerCase();setLang(l.startsWith("en")?"en":l.startsWith("es")?"es":"pt")};update();const ob=new MutationObserver(update);ob.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});return()=>ob.disconnect()},[]);
 const t=locale[lang],p=t.products[active],ActiveIcon=icons[active];
 return <section id="ecossistema" className="relative isolate overflow-hidden border-t border-white/[.07] bg-[#090f0b] px-5 py-14 text-white sm:px-8 sm:py-20 lg:py-24" style={{fontFamily:"inherit"}}>
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,rgba(182,255,105,.08),transparent_60%)]"/>
  <div className="relative mx-auto max-w-[1240px]">
   <div className="mx-auto max-w-[950px] text-center"><p className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold tracking-[.16em] text-[#b6ff69] sm:text-xs"><Sparkles size={14}/>{t.kicker}</p><h2 className="text-[clamp(2.4rem,5.5vw,5.2rem)] font-extrabold leading-[1.07] tracking-[-.065em]">{t.title} <span className="text-[#b6ff69]">{t.highlight}</span></h2><p className="mx-auto mt-5 max-w-[700px] text-[15px] leading-7 text-[#b5c1b6] sm:text-lg">{t.desc}</p></div>
   <div role="group" aria-label={t.select} className="relative z-10 mx-auto mt-9 grid max-w-[940px] grid-cols-1 gap-3 sm:grid-cols-3">{keys.map(key=>{const Icon=icons[key];return <button type="button" key={key} aria-pressed={active===key} onClick={()=>setActive(key)} className={"flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-all duration-300 hover:-translate-y-1 "+(active===key?"border-[#b6ff69]/50 bg-[#b6ff69]/10":"border-white/10 bg-white/[.035] hover:border-white/30")}><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[.045]" style={{color:color[key]}}><Icon size={22}/></div><div className="min-w-0 flex-1"><strong className="block text-sm">{t.products[key].name}</strong><span className="mt-1 block text-[9px] font-bold tracking-[.08em] text-white/50">{t.products[key].label}</span></div><ChevronRight size={18} className="shrink-0 text-[#b6ff69]"/></button>})}</div>
   <div className="relative mt-7 overflow-hidden rounded-[25px] border border-[#b6ff69]/20 bg-[#101a13] shadow-[0_30px_100px_#0009] lg:grid lg:min-h-[480px] lg:grid-cols-[.4fr_.6fr]">
    <div className="relative z-10 border-b border-white/10 px-6 py-9 sm:px-9 lg:flex lg:flex-col lg:justify-center lg:border-b-0 lg:border-r lg:py-10"><div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[.05] px-3 py-2 text-[10px] font-bold tracking-[.1em]" style={{color:color[active]}}><ActiveIcon size={14}/>{p.label}</div><h3 className="mt-5 text-[clamp(1.85rem,3.1vw,3.2rem)] font-extrabold leading-[1.13] tracking-[-.055em]">{p.headline}</h3><p className="mt-4 text-sm leading-7 text-[#b0c0b4]">{p.desc}</p><p className="mt-6 text-[11px] font-bold tracking-[.1em] text-white/50">{t.features}</p><ul className="mt-3 space-y-2.5">{p.features.map(feature=><li key={feature} className="flex items-start gap-2 text-[13px] text-white/85"><Check size={16} className="mt-0.5 shrink-0" style={{color:color[active]}}/>{feature}</li>)}</ul><a href="/cadastro" className="mt-7 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-[#b6ff69] px-5 text-xs font-bold text-[#10200d] hover:bg-[#d5ffa6]">{t.cta}<ArrowRight size={16}/></a></div>
    <div className="pn4-exploded" aria-label={t.preview}>
     <div className="pn4-layers" key={active}>
       {keys.map((key,i)=>{const LayerIcon=icons[key];return <div key={key} className={"pn4-layer pn4-layer-"+i+(active===key?" pn4-layer-active":"")} style={{"--panel-color":color[key]} as React.CSSProperties}>
         <div className="pn4-layer-header"><LayerIcon size={18}/><b>{t.products[key].name}</b><span/></div>
         <div className="pn4-layer-body">
           <div className="pn4-layer-eyebrow"/><div className="pn4-layer-line"/><div className="pn4-layer-line short"/>
           <div className="pn4-layer-modules">{[0,1,2].map(n=><div key={n}><span/><i/></div>)}</div>
         </div>
       </div>})}
     </div>
     <span className="pn4-layer-note">{t.preview}</span>
    </div>
   </div>
   <p className="mx-auto mt-5 max-w-[720px] text-center text-xs leading-6 text-[#8a998c]">{t.note}</p>
  </div>
 <style>{`
.pn4-exploded{position:relative;min-height:390px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(ellipse at center,#39634726,transparent 70%),#101a15;perspective:1500px;isolation:isolate}
.pn4-layers{position:relative;width:min(94%,680px);height:320px;transform-style:preserve-3d}
.pn4-layer{position:absolute;top:12%;height:76%;width:39%;border:1.5px solid var(--panel-color);border-radius:19px;background:linear-gradient(140deg,#ffffff3b,#ffffff10 55%,#ffffff17);box-shadow:0 16px 50px #0007,inset 0 1px #ffffff65;backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);transform-style:preserve-3d;animation:pn4-open .85s cubic-bezier(.2,.8,.2,1) both}
.pn4-layer-0{left:0;transform:perspective(1300px) rotateY(-33deg) translateZ(70px);--offset:-50px;z-index:3}
.pn4-layer-1{left:30%;transform:perspective(1300px) rotateY(-33deg) translateZ(10px);--offset:0px;z-index:2;animation-delay:.1s}
.pn4-layer-2{left:60%;transform:perspective(1300px) rotateY(-33deg) translateZ(-50px);--offset:50px;z-index:1;animation-delay:.2s}
.pn4-layer-active{background:linear-gradient(135deg,color-mix(in srgb,var(--panel-color) 24%,transparent),#ffffff25 55%,#ffffff0e);box-shadow:0 24px 60px #0008,inset 0 1px #fff9,0 0 40px color-mix(in srgb,var(--panel-color) 20%,transparent)}
.pn4-layer-header{height:20%;display:flex;gap:7px;align-items:center;padding:0 9%;border-bottom:1px solid #ffffff55;color:var(--panel-color)}
.pn4-layer-header b{font-size:10px;line-height:1.3}.pn4-layer-header span{margin-left:auto;height:6px;width:6px;border-radius:50%;background:var(--panel-color)}
.pn4-layer-body{padding:14% 11%}.pn4-layer-eyebrow{height:7px;width:45%;border-radius:3px;background:var(--panel-color)}
.pn4-layer-line{height:12px;width:92%;margin-top:15px;border-radius:4px;background:#ffffffbb}.pn4-layer-line.short{width:65%;margin-top:7px;background:#ffffff7c}
.pn4-layer-modules{display:grid;gap:6px;margin-top:20px;grid-template-columns:repeat(3,1fr)}.pn4-layer-modules div{height:50px;border:1px solid #ffffff40;border-radius:7px;background:#ffffff24;padding:8px}.pn4-layer-modules span{display:block;height:14px;background:var(--panel-color);opacity:.7;border-radius:3px}.pn4-layer-modules i{display:block;height:4px;margin-top:6px;background:#fff8;border-radius:3px}
.pn4-layer-note{position:absolute;bottom:13px;right:18px;padding:8px 12px;border:1px solid #b6ff6944;border-radius:999px;background:#0b160fd9;color:#c5edb4;font-size:10px}
@keyframes pn4-open{from{opacity:0;translate:var(--offset) 0}to{opacity:1;translate:0 0}}
@media(max-width:640px){.pn4-exploded{min-height:280px}.pn4-layers{width:98%;height:235px}.pn4-layer{top:18%;height:66%;width:43%;border-radius:12px}.pn4-layer-1{left:28%}.pn4-layer-2{left:56%}.pn4-layer-header b{font-size:7px}.pn4-layer-header svg{width:14px}.pn4-layer-body{padding:12% 9%}.pn4-layer-modules div{height:26px;padding:4px}.pn4-layer-line{height:7px}.pn4-layer-note{bottom:5px;right:9px}}
@media(prefers-reduced-motion:reduce){.pn4-layer{animation:none}}
`}</style>
 </section>
}
