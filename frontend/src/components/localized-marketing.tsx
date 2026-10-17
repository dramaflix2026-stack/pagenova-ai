import Link from "next/link";
import {ArrowRight,BookOpen,BrainCircuit,Check,Copy,Files,Globe2,Layers3,LayoutDashboard,ListChecks,ShieldCheck,Sparkles,Users} from "lucide-react";
import {SetDocumentLanguage} from "@/components/set-document-language";

type Lang="en"|"es";
type Content={
 nav:[string,string,string,string];enter:string;trial:string;tagline:string;headline:[string,string];intro:string;
 explore:string;benefit:string;stepsTitle:string;steps:readonly [string,string][];
 capabilities:string;features:readonly [string,string][];plansTitle:string;plansSubtitle:string;
 periods:readonly string[];periodSuffix:readonly string[];choose:string;featured:string;
 savings:readonly string[];priceNote:string;questionsTitle:string;faq:readonly [string,string][];
 affiliate:string;foot:string;contact:string;pricing:string;
};
const copy:Record<Lang,Content>={
 en:{
  nav:["Platform","Features","Pricing","Questions"],enter:"Sign in",trial:"Try free for 5 days",tagline:"Create, publish and grow",
  headline:["Turn your ideas into real projects.","Build at your own pace."],
  intro:"Create websites, landing pages, quizzes, forms and ebooks using AI. Edit the results and organize your leads and appointments in one place.",
  explore:"Explore the tools",benefit:"Free trial without a credit card · Limited included usage · No automatic charge",
  stepsTitle:"From idea to a first version",steps:[
   ["Describe","Share what you want to create and choose the type of project."],
   ["Generate","Let the platform prepare the initial structure."],
   ["Edit","Adjust copy, images and sections in your workspace."],
   ["Publish","Review the preview and publish when ready."]
  ],
  capabilities:"What you can build",
  features:[
   ["AI websites","Start a business website from your brief and refine its sections."],
   ["Landing pages","Create focused pages for products, services and campaigns."],
   ["Quizzes and forms","Collect answers and organize visitors' submissions."],
   ["Ebooks","Build editable educational materials and export them."],
   ["Page cloning","Use a public page as a starting point for authorized editing."],
   ["CRM and appointments","Manage leads, deals and appointments in one workspace."]
  ],
  plansTitle:"Choose your subscription",plansSubtitle:"The same platform capabilities, with different billing periods. Prices below are charged in BRL.",
  periods:["Monthly","Quarterly","Semiannual","Annual"],periodSuffix:["/ month","/ 3 months","/ 6 months","/ 12 months"],
  choose:"Choose",featured:"Popular",savings:["Flexible monthly access","Lower effective monthly cost","Save with a longer term","Best effective monthly price"],
  priceNote:"Checkout is processed by Kiwify. Available payment methods, exchange rates and taxes depend on the buyer's location and provider.",
  questionsTitle:"Frequently asked questions",faq:[
   ["Can I try PageNova without a credit card?","Yes. The free trial lasts five days, starts upon your first access and ends automatically without a charge. Included resources have limits."],
   ["Will the app and CRM be translated too?","English is being introduced gradually. The logged-in workspace currently has Portuguese sections while localization is expanded."],
   ["Can I search for businesses abroad?","Yes. In the CRM, select the country, city and industry for a Google Places search. Each API request uses the same credit system."],
   ["Can I edit what I generate?","Yes. You can revisit saved work and edit available content and visual sections."],
   ["Is the price automatically converted?","The displayed prices are in Brazilian reais. Final payment and conversion options are shown by Kiwify at checkout."]
  ],
  affiliate:"Become a partner",foot:"Create, publish and organize your online projects in one space.",contact:"Contact",pricing:"Prices in BRL"
 },
 es:{
  nav:["Plataforma","Funciones","Planes","Preguntas"],enter:"Iniciar sesión",trial:"Prueba gratis 5 días",tagline:"Crea, publica y crece",
  headline:["Convierte tus ideas en proyectos reales.","Avanza a tu ritmo."],
  intro:"Crea sitios web, landing pages, cuestionarios, formularios y ebooks con IA. Edita los resultados y organiza tus clientes potenciales y citas en un solo lugar.",
  explore:"Conoce las herramientas",benefit:"Prueba gratuita sin tarjeta · Uso incluido limitado · Sin cobro automático",
  stepsTitle:"De la idea a la primera versión",steps:[
   ["Describe","Cuéntanos qué quieres crear y elige el tipo de proyecto."],
   ["Genera","La plataforma prepara la estructura inicial."],
   ["Edita","Ajusta los textos, imágenes y secciones en tu espacio de trabajo."],
   ["Publica","Revisa la vista previa y publica cuando esté listo."]
  ],
  capabilities:"Lo que puedes crear",
  features:[
   ["Sitios web con IA","Crea tu sitio empresarial desde una descripción y personalízalo."],
   ["Landing pages","Construye páginas para productos, servicios y campañas."],
   ["Quizzes y formularios","Recopila respuestas y organiza los registros."],
   ["Ebooks","Prepara materiales editables y expórtalos."],
   ["Clonación de páginas","Usa una página pública como base para una edición autorizada."],
   ["CRM y agenda","Organiza prospectos, negocios y citas en un mismo espacio."]
  ],
  plansTitle:"Elige tu suscripción",plansSubtitle:"Las mismas funcionalidades, con diferentes periodos de pago. Los precios están en reales brasileños.",
  periods:["Mensual","Trimestral","Semestral","Anual"],periodSuffix:["/ mes","/ 3 meses","/ 6 meses","/ 12 meses"],
  choose:"Elegir",featured:"Popular",savings:["Acceso mensual flexible","Menor costo mensual equivalente","Ahorra con un periodo más largo","Mejor precio mensual equivalente"],
  priceNote:"El pago se realiza por Kiwify. Los métodos disponibles, tasas de cambio e impuestos dependen de tu ubicación y del proveedor.",
  questionsTitle:"Preguntas frecuentes",faq:[
   ["¿Puedo probar PageNova sin tarjeta?","Sí. La prueba gratuita dura cinco días desde tu primer acceso y termina automáticamente sin cargos. Los recursos incluidos tienen límites."],
   ["¿La aplicación y el CRM también estarán traducidos?","Estamos incorporando el español progresivamente. Algunas secciones del espacio de trabajo siguen en portugués durante esta fase."],
   ["¿Puedo buscar empresas en otros países?","Sí. En el CRM, selecciona el país, la ciudad y el sector para buscar en Google Places. Las consultas usan el mismo sistema de créditos."],
   ["¿Puedo editar lo que genero?","Sí. Puedes volver a tus proyectos guardados y editar los contenidos y secciones disponibles."],
   ["¿Los precios se convierten automáticamente?","Los precios mostrados están en reales brasileños. Las opciones de pago y conversión aparecen en el checkout de Kiwify."]
  ],
  affiliate:"Hazte afiliado",foot:"Crea, publica y organiza tus proyectos digitales en un solo lugar.",contact:"Contacto",pricing:"Precios en BRL"
 }
};
const prices=["R$147","R$397","R$747","R$1.297"] as const;
const urls=[
 "https://pay.kiwify.com.br/a13pNpS",
 "https://pay.kiwify.com.br/SQ1dOyd",
 "https://pay.kiwify.com.br/cgZcPet",
 "https://pay.kiwify.com.br/oS6Bmzg",
] as const;
const featureIcons=[Sparkles,Layers3,ListChecks,BookOpen,Copy,LayoutDashboard] as const;
export function LocalizedMarketing({lang}:{lang:Lang}){
 const c=copy[lang];
 const switchUrl=(lng:"pt"|"en"|"es")=>"/api/site-language?lang="+lng;
 return <main className="pn-landing-v2 min-h-screen overflow-x-hidden bg-[#0b100d] font-sans text-white">
  <SetDocumentLanguage language={lang}/>
  <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b100d]/95 backdrop-blur-xl">
   <div className="mx-auto flex min-h-[70px] max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-8">
    <Link href="/" aria-label="PageNova AI" className="shrink-0">
     <img src="/brand/pagenova-logo.png" alt="PageNova AI" width={165} height={48} className="pn-brand-logo h-10 w-auto object-contain"/>
    </Link>
    <nav aria-label="Primary" className="hidden gap-5 text-xs text-white/65 lg:flex">
     {c.nav.map((name,i)=><a key={name} className="hover:text-[#8fec78]" href={["#platform","#features","#plans","#faq"][i]}>{name}</a>)}
    </nav>
    <div className="flex items-center gap-2">
     <nav className="flex items-center gap-1 text-xs font-semibold text-white/60" aria-label="Language">
      {([["pt","PT"],["en","EN"],["es","ES"]] as const).map(([code,label])=><a key={code} href={switchUrl(code)} hrefLang={code} aria-current={lang===code?"page":undefined}
       className={"rounded-md px-1.5 py-2 "+(lang===code?"bg-[#8fec78]/15 text-[#8fec78]":"hover:text-white")}>{label}</a>)}
     </nav>
     <Link href="/login" className="hidden rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold hover:border-[#8fec78] sm:block">{c.enter}</Link>
     <Link href="/cadastro?trial=1" className="rounded-lg bg-[#8fec78] px-3 py-2 text-xs font-bold text-[#14220f] hover:bg-[#a8f494]">{c.trial}</Link>
    </div>
   </div>
  </header>
  <section id="platform" className="relative overflow-hidden border-b border-white/10 px-5 py-16 sm:py-24">
   <div aria-hidden="true" className="pointer-events-none absolute -right-56 top-0 size-[500px] rounded-full bg-[#8fec78]/10 blur-[100px]"/>
   <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
    <div>
     <p className="text-xs font-bold uppercase tracking-[.2em] text-[#8fec78]">{c.tagline}</p>
     <h1 className="mt-5 max-w-3xl text-[clamp(2.5rem,6vw,4.8rem)] font-bold leading-[1.08] tracking-[-.055em]">{c.headline[0]} <span className="text-[#a8f494]">{c.headline[1]}</span></h1>
     <p className="mt-6 max-w-xl text-base leading-8 text-white/65">{c.intro}</p>
     <div className="mt-8 flex flex-wrap gap-3">
      <Link href="/cadastro?trial=1" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#8fec78] px-5 py-3 text-sm font-bold text-[#14220f] hover:bg-[#a8f494]">{c.trial}<ArrowRight className="size-4"/></Link>
      <a href="#features" className="inline-flex min-h-12 items-center rounded-xl border border-white/20 px-5 py-3 text-sm font-bold hover:border-[#8fec78]">{c.explore}</a>
     </div>
     <p className="mt-5 text-xs leading-5 text-white/40">{c.benefit}</p>
    </div>
    <div className="rounded-[28px] border border-[#8fec78]/25 bg-[#142019] p-6 shadow-[0_12px_70px_rgba(0,0,0,.3)] sm:p-8">
     <BrainCircuit className="size-9 text-[#8fec78]"/>
     <h2 className="mt-5 text-2xl font-bold">{c.stepsTitle}</h2>
     <div className="mt-5 space-y-4">
      {c.steps.map(([name,description],i)=><div key={name} className="flex items-start gap-3 border-t border-white/10 pt-4">
       <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#8fec78]/10 text-xs font-bold text-[#8fec78]">0{i+1}</span>
       <div><strong className="text-sm">{name}</strong><p className="mt-1 text-xs leading-6 text-white/55">{description}</p></div>
      </div>)}
     </div>
    </div>
   </div>
  </section>
  <section id="features" className="bg-[#f3f5f0] px-5 py-14 text-[#14251d] sm:py-20">
   <div className="mx-auto max-w-6xl">
    <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{c.capabilities}</h2>
    <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
     {c.features.map(([name,desc],i)=>{const Icon=featureIcons[i];return <article key={name} className="rounded-2xl border border-[#d8e4d8] bg-white p-6">
      <Icon className="size-7 text-[#3e7838]"/><h3 className="mt-5 text-lg font-bold">{name}</h3><p className="mt-3 text-sm leading-6 text-[#5a6b5a]">{desc}</p>
     </article>})}
    </div>
   </div>
  </section>
  <section id="plans" className="px-5 py-14 sm:py-20">
   <div className="mx-auto max-w-6xl">
    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#8fec78]"><Globe2 className="size-4"/>{c.pricing}</span>
    <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">{c.plansTitle}</h2>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">{c.plansSubtitle}</p>
    <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
     {prices.map((price,i)=><article key={price} className={"flex flex-col rounded-2xl border p-4 sm:p-6 "+(i===2?"border-[#8fec78]/50 bg-[#1b3421]":"border-white/10 bg-[#142019]")}>
      <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{c.periods[i]}</span>{i===2&&<span className="rounded-full bg-[#8fec78] px-2 py-1 text-[10px] font-bold text-[#14220f]">{c.featured}</span>}</div>
      <p className="mt-5 text-2xl font-bold sm:text-3xl">{price}</p>
      <p className="mt-1 text-xs text-white/50">{c.periodSuffix[i]}</p>
      <p className="mt-3 flex-1 text-xs leading-5 text-[#a8f494]">{c.savings[i]}</p>
      <a href={urls[i]} target="_blank" rel="noopener noreferrer" className="mt-5 rounded-lg bg-[#8fec78] px-3 py-3 text-center text-xs font-bold text-[#14220f] hover:bg-[#a8f494]">{c.choose} {c.periods[i]} ↗</a>
     </article>)}
    </div>
    <p className="mt-5 text-xs leading-6 text-white/40">{c.priceNote}</p>
   </div>
  </section>
  <section id="faq" className="bg-[#f3f5f0] px-5 py-14 text-[#14251d] sm:py-20">
   <div className="mx-auto max-w-6xl">
    <h2 className="text-3xl font-bold sm:text-5xl">{c.questionsTitle}</h2>
    <div className="mt-7 grid gap-3 md:grid-cols-2">
     {c.faq.map(([question,answer])=><details key={question} className="rounded-2xl border border-[#d8e4d8] bg-white p-5">
      <summary className="cursor-pointer text-sm font-bold leading-6">{question}</summary>
      <p className="mt-3 border-t border-[#d8e4d8] pt-3 text-sm leading-6 text-[#5b6a5d]">{answer}</p>
     </details>)}
    </div>
   </div>
  </section>
  <footer className="border-t border-white/10 px-5 py-10">
   <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
    <p className="max-w-md text-sm leading-6 text-white/55">{c.foot}</p>
    <div className="flex flex-wrap gap-5 text-sm">
     <Link href="/afiliados" className="text-[#8fec78] hover:text-white">{c.affiliate}</Link>
     <a href="mailto:suporte@pagenovaai.com.br" className="hover:text-[#8fec78]">{c.contact}</a>
    </div>
   </div>
   <p className="mx-auto mt-5 max-w-6xl text-xs text-white/30">© 2026 PageNova AI</p>
  </footer>
 </main>;
}
