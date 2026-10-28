"use client";

import Testimonials3D from "./testimonials-3d";

import { useMemo, useState } from "react";
import { MODULAR_CATALOG, normalizeSelection, expandEntitlements } from "@/lib/commercial/modular-catalog";
import { calculatePreviewQuote, PREVIEW_PRICES_CENTS } from "@/lib/commercial/preview-pricing";

type Family = "studio" | "crm" | "development";
type Scenario = "studio" | "crm" | "development" | "all";
const ownedByScenario:Record<Scenario,string[]>={studio:[],crm:[],development:[],all:[]};
const baseByScenario:Record<Scenario,string>={studio:"bundle.studio",crm:"bundle.crm",development:"bundle.development",all:"bundle.all"};

const details:Record<string,{icon:string;description:string}>={
"studio.sites":{icon:"◈",description:"Sites profissionais criados com IA."},
"studio.landing":{icon:"▣",description:"Páginas para campanhas e vendas."},
"studio.cloner":{icon:"⧉",description:"Recrie e personalize páginas."},
"studio.forms":{icon:"☷",description:"Capture contatos com facilidade."},
"studio.quizzes":{icon:"✳",description:"Engaje e qualifique seu público."},
"studio.ebooks":{icon:"▤",description:"Crie materiais digitais com IA."},
"crm.search":{icon:"◎",description:"Encontre empresas para prospectar."},
"crm.leads":{icon:"◇",description:"Organize seus contatos e negócios."},
"crm.operations":{icon:"▥",description:"Centralize sua operação comercial."},
"development.apps":{icon:"⌘",description:"Aplicativos para seu negócio."},
"development.systems":{icon:"⬡",description:"Sistemas para sua operação."},
"bundle.studio":{icon:"✦",description:"Todas as ferramentas do Estúdio."},
"bundle.crm":{icon:"✦",description:"Toda a operação comercial integrada."},
"bundle.development":{icon:"✦",description:"Criação de aplicativos e sistemas sob demanda. Em desenvolvimento."},
"bundle.all":{icon:"✦",description:"Studio, CRM e Apps e Sistemas em um único pacote."}
};

export default function ConfiguradorPreview(){

 const [scenario,setScenario]=useState<Scenario>("studio");
 const owned=useMemo(()=>expandEntitlements(ownedByScenario[scenario],true),[scenario]);
 const isOwned=(code:string)=>owned.includes(code);
 const [selected,setSelected]=useState<string[]>(["bundle.studio"]);
 const [expanded,setExpanded]=useState(false);
 const [menuOpen,setMenuOpen]=useState(false);
 const [openFaq,setOpenFaq]=useState<number|null>(null);
 const normalized=useMemo(()=>normalizeSelection(selected,true),[selected]);
 const granted=useMemo(()=>expandEntitlements(selected,true),[selected]);
 const selectedItems=normalized.map(code=>MODULAR_CATALOG.find(item=>item.code===code)!).filter(Boolean);
 const toolCount=granted.filter(code=>!code.startsWith("bundle.")).length;
 const quote=useMemo(()=>calculatePreviewQuote(normalized),[normalized]);
 const selectedBase=baseByScenario[scenario];
 
 const brl=(cents:number)=>Number.isFinite(cents)?new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100):"Em breve";
 const toggle=(code:string)=>{if(isOwned(code)||code===baseByScenario[scenario])return;setSelected(prev=>normalizeSelection(prev.includes(code)?prev.filter(item=>item!==code):[...prev,code],true));};
 const changeScenario=(next:Scenario)=>{setScenario(next);setSelected([baseByScenario[next]]);setExpanded(false);};
 

 return <main className="min-h-screen bg-[#090e0b] text-[#f7faf6]">

 <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090e0b]/95 px-5 py-4 backdrop-blur-xl sm:px-8">
 <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
 <a href="#inicio" className="flex shrink-0 items-center gap-2.5" aria-label="PageNova AI, voltar ao início"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#b9f77a] text-lg font-black italic text-[#10200c]">P</span><strong className="text-base font-extrabold tracking-tight sm:text-lg">PageNova<span className="text-[#b9f77a]">AI</span></strong></a>
 <nav aria-label="Navegação principal" className="hidden items-center gap-6 text-xs font-semibold text-white/65 md:flex"><a className="hover:text-[#b9f77a]" href="#pacotes">Ferramentas</a><a className="hover:text-[#b9f77a]" href="#como-funciona">Como funciona</a><a className="hover:text-[#b9f77a]" href="#duvidas">Dúvidas frequentes</a></nav>
 <div className="flex items-center gap-3"><span className="hidden rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/45 sm:inline-flex">Prévia · Sem cobranças</span><a href="/app" className="hidden rounded-xl border border-[#b9f77a]/45 px-3 py-2 text-xs font-bold text-[#b9f77a] hover:bg-[#b9f77a]/10 md:inline-flex">Entrar na plataforma</a><button type="button" onClick={()=>setMenuOpen(v=>!v)} aria-label={menuOpen?"Fechar menu":"Abrir menu"} aria-expanded={menuOpen} className="rounded-lg border border-white/20 px-3 py-2 text-sm md:hidden">{menuOpen?"✕":"☰"}</button></div>
 </div>
 {menuOpen&&<nav aria-label="Menu móvel" className="mx-auto mt-4 flex max-w-[1440px] flex-col gap-1 border-t border-white/10 pt-3 text-sm md:hidden">{[["Ferramentas","#pacotes"],["Como funciona","#como-funciona"],["Dúvidas frequentes","#duvidas"],["Entrar na plataforma","/app"]].map(([label,href])=><a key={href} href={href} onClick={()=>setMenuOpen(false)} className="rounded-lg px-3 py-3 text-white/80 hover:bg-white/5">{label}</a>)}</nav>}

 </header>
 <div className="mx-auto max-w-[1180px] px-5 pb-28 sm:px-8 lg:pb-16">
 <section id="inicio" className="scroll-mt-24 py-8 sm:py-10">
 <div className="pn-hero-lockup relative mb-5 flex min-h-[150px] flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(54,255,104,.12),transparent_70%)] px-3 py-8 text-center sm:min-h-[215px] sm:py-10" aria-label="PageNova AI — Product Intelligence">
 <div className="pn-hero-brand relative z-10 flex w-full max-w-full items-center justify-center gap-3 sm:gap-6">
 <svg aria-hidden="true" viewBox="0 0 120 120" className="pn-hero-p h-[clamp(56px,9vw,108px)] w-[clamp(56px,9vw,110px)] shrink-0 drop-shadow-[0_0_20px_rgba(50,255,90,.25)]"><defs><linearGradient id="pnSymbolGradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#8eff5b"/><stop offset="55%" stopColor="#2efb57"/><stop offset="100%" stopColor="#77ffba"/></linearGradient></defs><path fill="url(#pnSymbolGradient)" d="M39 14h42c25 0 36 13 33 34-3 22-20 35-46 35H48l-13 24H7L36 47h38c9 0 13-4 14-10 1-6-3-9-10-9H32z"/><path fill="#20c94e" opacity=".7" d="M34 52h36L48 83H19z"/></svg>
 <strong className="pn-hero-wordmark whitespace-nowrap text-[clamp(1.9rem,6.9vw,5.7rem)] font-black leading-none tracking-[-.075em] text-white">PageNova<span className="text-[#43ff65]">AI</span></strong>
 </div>
 <div className="pn-hero-line relative z-10 mt-4 h-px w-[min(75%,420px)] bg-gradient-to-r from-transparent via-[#b9f77a] to-transparent" />
 <span className="pn-hero-tag relative z-10 mt-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#b9f77a] sm:text-sm sm:tracking-[.45em]">Product Intelligence</span>
 </div>
 <div className="mt-1 flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-3">
 <h1 className="text-[clamp(1.65rem,3.1vw,2.65rem)] font-extrabold leading-[1.16] tracking-[-.04em] text-white">Escolha as ferramentas.</h1>
 <p className="text-[clamp(1.05rem,2vw,1.65rem)] font-bold leading-[1.2] tracking-[-.025em] text-[#b9f77a]">A gente simplifica o resto.</p>
 </div>
 </section>
 <section id="pacotes" aria-label="Escolha do pacote principal" className="scroll-mt-24 mb-12 border-t border-white/15 pt-9 lg:mb-14">
 <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-bold">Escolha seu pacote principal</h2><span className="text-[11px] text-white/45">Valores mensais para novos clientes · sem cobrança nesta prévia</span></div>
 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
 {([{id:"studio",label:"PageNova Studio",price:20700},{id:"crm",label:"PageNova CRM",price:24700},{id:"development",label:"Apps e Sistemas",price:39700},{id:"all",label:"PageNova Completa",price:59700}] as const).map(option=><button key={option.id} type="button" onClick={()=>changeScenario(option.id)} aria-pressed={scenario===option.id} className={"relative flex min-h-[190px] flex-col justify-between gap-4 overflow-hidden rounded-[20px] border p-5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b9f77a] sm:p-6 "+(scenario===option.id?"border-[#b9f77a] bg-[#203421] shadow-[0_0_0_1px_rgba(185,247,122,0.14),0_14px_35px_rgba(0,0,0,0.24)]":"border-white/10 bg-white/[0.035] hover:border-[#b9f77a]/40")}>
 <span className="flex items-center justify-between gap-2"><span className="block text-sm font-bold">{option.label}</span><span className={"grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs "+(scenario===option.id?"border-[#b9f77a] bg-[#b9f77a] text-[#12200e]":"border-white/20 text-white/40")}>{scenario===option.id?"✓":"+"}</span></span><strong className="block text-[27px] font-extrabold tracking-tight text-[#b9f77a]">{brl(option.price)}<span className="ml-1 text-xs font-normal tracking-normal text-white/45">/mês</span></strong>
 <span className="block text-[11px] leading-[1.6] text-white/55">{option.id==="all"?"Economize R$ 254 em relação aos 3 pacotes":option.id==="development"?"Em desenvolvimento · contratação indisponível":"Pacote principal incluído automaticamente"}</span>
 </button>)}
 </div>
 {scenario==="all"&&<p className="mt-3 text-xs text-[#b9f77a]">Studio + CRM + Apps e Sistemas. Economia de R$ 254/mês (29,8%). Apps e Sistemas ainda não disponível para contratação.</p>}
 {scenario==="development"&&<p className="mt-3 text-xs text-[#b9f77a]">Apps e Sistemas está em desenvolvimento. Esta seleção é apenas uma demonstração comercial.</p>}
 </section>
 <div className="grid items-start gap-10 border-t border-white/15 pt-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-10 xl:gap-12">
 <section aria-label="Escolha de ferramentas">
 <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold tracking-tight">{scenario==="all"?"Tudo incluído no pacote":"Adicione complementos"}</h2><span className="text-xs text-white/40">{scenario==="all"?"Sem cobrança duplicada":"Personalize seu pacote"}</span></div>
 <p className="mb-5 text-sm leading-6 text-white/50">Personalize seu pacote. Recursos em desenvolvimento são apenas demonstrativos.</p>
 <div className="grid auto-rows-fr gap-3 sm:grid-cols-2">
 {(scenario==="all"?MODULAR_CATALOG.filter(item=>!item.code.startsWith("bundle.")):MODULAR_CATALOG.filter(item=>!item.code.startsWith("bundle.")&&item.family!==scenario)).map(item=>{
 const active=selected.includes(item.code);const included=!active&&granted.includes(item.code);const alreadyOwned=isOwned(item.code);const disabled=item.status==="coming_soon";
 return <button key={item.code} type="button" disabled={disabled||included||alreadyOwned||scenario==="all"} onClick={()=>toggle(item.code)} aria-pressed={active||included||alreadyOwned} className={"group flex h-full min-h-[146px] items-start gap-3 rounded-[20px] border p-4 text-left shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_18px_35px_rgba(0,0,0,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b9f77a] sm:p-5 "+(active?"border-[#b9f77a] bg-[#1b2c1c]":included||alreadyOwned?"border-emerald-500/35 bg-[#16251a]":"border-white/10 bg-[#121a14] hover:border-[#b9f77a]/40")+(disabled?" cursor-not-allowed opacity-60":included||alreadyOwned?" cursor-default":"")}>
 <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.055] text-xl text-[#b9f77a]">{details[item.code].icon}</span>
 <span className="min-w-0 flex-1"><strong className="block text-[14px] font-bold">{item.title}</strong><span className="mt-2 block text-[12px] leading-5 text-white/45">{details[item.code].description}</span><span className="mt-2 block text-[11px] font-semibold text-white/55">{Number.isFinite(PREVIEW_PRICES_CENTS[item.code])?`${brl(PREVIEW_PRICES_CENTS[item.code])}/mês · simulação`:"Preço avulso ainda não definido"}</span><span className="mt-3 block text-[11px] font-semibold text-[#b9f77a]">{included?"Incluído no pacote":disabled?"Em breve":alreadyOwned?"Já contratado":active?"Selecionado":""}</span></span>
 <span className={"grid h-6 w-6 shrink-0 place-items-center rounded-md border text-sm "+(active?"border-[#b9f77a] bg-[#b9f77a] text-[#10200c]":"border-white/20 text-white/45")}>{active||included||alreadyOwned?"✓":"+"}</span>
 </button>;
 })}
 </div>
 </section>
 <aside className="min-w-0 self-start lg:sticky lg:top-8" aria-label="Resumo da assinatura">
 <div className="rounded-[24px] border border-[#b9f77a]/20 bg-gradient-to-b from-[#1a271b] to-[#121c15] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)] sm:p-7">
 <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-bold">Seu pacote</h2><span className="rounded-full bg-[#b9f77a]/10 px-2.5 py-1 text-xs font-semibold text-[#b9f77a]">{toolCount} {toolCount===1?"ferramenta":"ferramentas"}</span></div>
 <p className="mt-2 text-xs leading-5 text-white/45">Personalize sua assinatura. {owned.length>0?"Itens já contratados não entram na simulação de cobrança.":""}</p>
 {owned.length>0&&<div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3"><strong className="text-xs text-[#b9f77a]">Já incluído na sua conta (simulação)</strong><p className="mt-1 text-xs text-white/55">{ownedByScenario[scenario].map(code=>MODULAR_CATALOG.find(item=>item.code===code)?.title).join(" + ")}</p></div>}
 <div className="mt-5 space-y-2">{selectedItems.length?selectedItems.map(item=><div key={item.code} className="flex items-center justify-between gap-2 border-b border-white/[0.07] py-2.5"><span className="text-xs font-medium text-white/80">{item.title}</span><button type="button" onClick={()=>toggle(item.code)} disabled={item.code===selectedBase} aria-label={"Remover "+item.title} className="rounded p-1 text-xs text-white/45 hover:text-white disabled:opacity-30">{item.code===selectedBase?"Base":"✕"}</button></div>):<p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs leading-6 text-white/45">Suas ferramentas selecionadas aparecerão aqui.</p>}</div>
 {selectedItems.length>0&&<button type="button" onClick={()=>setExpanded(v=>!v)} className="mt-4 text-xs font-semibold text-[#b9f77a]">{expanded?"Ocultar":"Ver"} ferramentas incluídas ({toolCount}) ↓</button>}
 {expanded&&selectedItems.length>0&&<div className="mt-3 space-y-2 rounded-xl bg-white/[0.035] p-3">{granted.filter(code=>!code.startsWith("bundle.")).map(code=><p key={code} className="text-xs text-white/60">✓ {MODULAR_CATALOG.find(item=>item.code===code)?.title}</p>)}</div>}
 <div className="mt-6 border-t border-white/10 pt-5"><span className="text-xs text-white/45">Mensalidade proposta · novos clientes</span>{quote.discountPercent>0&&<div className="mt-3 flex justify-between text-xs text-white/55"><span>Subtotal {brl(quote.subtotalCents)}</span><span className="text-[#b9f77a]">-{quote.discountPercent}% ({brl(quote.discountCents)})</span></div>}<p className="mt-2 text-2xl font-bold text-[#b9f77a]">{brl(quote.totalCents)}<span className="ml-1 text-xs font-medium text-white/45">/mês</span></p><p className="mt-2 text-xs leading-5 text-white/40">Tabela proposta para novos clientes. Checkout desativado; Apps e Sistemas ainda não disponível.</p></div>
 <button type="button" disabled className="mt-5 w-full cursor-not-allowed rounded-xl bg-[#b9f77a]/60 px-4 py-3.5 text-sm font-bold text-[#14210e]">Checkout em preparação</button>
 </div>
 <p className="mt-3 text-center text-[11px] text-white/35">Nenhuma cobrança será realizada nesta prévia. Contratos antigos preservados.</p>
 </aside>
 </div>

 <section id="como-funciona" className="scroll-mt-24 mt-16 border-t border-white/15 pt-12"><div className="mb-6"><span className="text-[11px] font-bold uppercase tracking-[.2em] text-[#b9f77a]">Simples do início ao fim</span><h2 className="mt-2 text-2xl font-extrabold">Como funciona</h2></div><div className="grid gap-4 md:grid-cols-3">{[{n:"01",title:"Escolha",text:"Selecione um pacote e personalize suas ferramentas."},{n:"02",title:"Contrate",text:"Quando disponível, finalize sua assinatura pelo checkout seguro."},{n:"03",title:"Utilize",text:"Acesse as ferramentas liberadas na sua conta PageNova AI."}].map(step=><div key={step.n} className="border-l border-[#b9f77a]/30 px-5 py-2"><span className="text-sm font-black text-[#b9f77a]">{step.n}</span><h3 className="mt-3 text-lg font-bold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-white/55">{step.text}</p></div>)}</div></section>
 <Testimonials3D />
 <section id="duvidas" className="scroll-mt-24 mt-16 max-w-[840px] border-t border-white/15 pt-12"><span className="text-[11px] font-bold uppercase tracking-[.2em] text-[#b9f77a]">Informações importantes</span><h2 className="mb-6 mt-2 text-2xl font-extrabold">Dúvidas frequentes</h2><div className="space-y-3">{[{q:"Posso contratar ferramentas individualmente?",a:"Essa é a proposta do configurador modular. As contratações ainda estão desativadas nesta prévia."},{q:"A cobrança é mensal?",a:"Os valores exibidos são propostas mensais para novos clientes. As condições finais serão apresentadas antes da contratação."},{q:"Posso mudar meu pacote depois?",a:"A gestão de alterações de assinatura está sendo preparada. As regras definitivas serão informadas no lançamento."},{q:"O que acontece com quem já é cliente?",a:"Os contratos e acessos antigos serão preservados. Esta prévia não altera assinaturas existentes."},{q:"Apps e Sistemas já está disponível?",a:"Ainda não. As opções de Apps e Sistemas são demonstrativas e não podem ser contratadas nesta prévia."}].map((item,index)=><div key={item.q} className="overflow-hidden border-b border-white/15"><button type="button" onClick={()=>setOpenFaq(openFaq===index?null:index)} aria-expanded={openFaq===index} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold"><span>{item.q}</span><span className="text-xl text-[#b9f77a]">{openFaq===index?"−":"+"}</span></button>{openFaq===index&&<p className="px-5 pb-5 text-sm leading-6 text-white/60">{item.a}</p>}</div>)}</div></section>
 </div>
 <footer className="mt-16 w-full border-t border-[#b9f77a]/15 bg-[#101711] px-5 py-12 text-sm text-white/60 sm:px-8"><div className="mx-auto grid max-w-[1440px] gap-9 sm:grid-cols-2 lg:grid-cols-4"><div><strong className="text-lg font-black text-white">PageNova<span className="text-[#b9f77a]">AI</span></strong><p className="mt-2 text-xs font-bold uppercase tracking-[.17em] text-[#b9f77a]">Product Intelligence</p><p className="mt-4 text-xs leading-6 text-white/50">Sua plataforma de ferramentas inteligentes para criar, organizar e crescer.</p></div><div><h3 className="mb-4 font-bold text-white">Plataforma</h3><div className="flex flex-col gap-3 text-xs"><a href="#pacotes" className="hover:text-[#b9f77a]">Ferramentas e pacotes</a><a href="#como-funciona" className="hover:text-[#b9f77a]">Como funciona</a><a href="/app" className="hover:text-[#b9f77a]">Acessar plataforma</a></div></div><div><h3 className="mb-4 font-bold text-white">Suporte</h3><div className="flex flex-col gap-3 text-xs"><a href="#duvidas" className="hover:text-[#b9f77a]">Dúvidas frequentes</a><span className="text-white/40">Canais de atendimento em preparação</span></div></div><div><h3 className="mb-4 font-bold text-white">Informações</h3><p className="text-xs leading-6 text-white/50">Ambiente de demonstração. Sem cobranças. Produtos em desenvolvimento não estão disponíveis para contratação.</p></div></div><div className="mx-auto mt-10 flex max-w-[1440px] flex-wrap justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40"><span>© 2026 PageNova AI. Todos os direitos reservados.</span><span>Prévia comercial · contratos anteriores preservados</span></div></footer>
 <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-white/10 bg-[#121a14]/95 px-5 py-3 backdrop-blur lg:hidden"><div><div className="text-[11px] text-white/45">{toolCount} ferramentas selecionadas</div><strong className="text-sm text-[#b9f77a]">{brl(quote.totalCents)}/mês*</strong></div><button type="button" disabled className="rounded-lg bg-[#b9f77a]/60 px-4 py-3 text-xs font-bold text-[#14210e]">Em preparação</button></div>
 <style jsx global>{`
 @keyframes pnSymbolReveal {0%{opacity:0;transform:translateX(-35px) scale(.68) rotate(-9deg);filter:blur(14px)}70%{opacity:1;filter:blur(0)}100%{opacity:1;transform:translateX(0) scale(1) rotate(0);filter:blur(0)}}
 @keyframes pnWordmarkReveal {0%,12%{opacity:0;transform:translateX(28px);filter:blur(10px)}100%{opacity:1;transform:translateX(0);filter:blur(0)}}
 @keyframes pnHeroLine {0%{opacity:0;transform:scaleX(0)}100%{opacity:1;transform:scaleX(1)}}
 @keyframes pnHeroTag {0%{opacity:0;transform:translateY(12px);letter-spacing:.7em}100%{opacity:1;transform:translateY(0)}}
 .pn-hero-p{animation:pnSymbolReveal 1.25s cubic-bezier(.18,.8,.2,1) both}
 .pn-hero-wordmark{animation:pnWordmarkReveal 1.4s cubic-bezier(.18,.8,.2,1) .45s both}
 .pn-hero-line{animation:pnHeroLine 1s ease-out 1.15s both}
 .pn-hero-tag{animation:pnHeroTag 1s ease-out 1.45s both}
 @keyframes pnBotWalkLeft{0%{opacity:0;transform:translateX(-95px) scale(.65)}45%{opacity:1}75%,100%{opacity:1;transform:translateX(0) scale(1)}}
 @keyframes pnBotWalkRight{0%{opacity:0;transform:translateX(95px) scale(.65)}45%{opacity:1}75%,100%{opacity:1;transform:translateX(0) scale(1)}}
 @keyframes pnBotStep{0%,100%{transform:rotate(12deg)}50%{transform:rotate(-14deg)}}
 @keyframes pnBotBob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-5px) rotate(2deg)}}
 @keyframes pnConfettiBlast{0%,44%{opacity:0;transform:translate(0,0) rotate(0) scale(.3)}49%{opacity:1}72%{opacity:1;transform:translate(var(--dx),var(--dy)) rotate(var(--rot)) scale(1)}100%{opacity:0;transform:translate(calc(var(--dx) * 1.5),calc(var(--dy) * .1)) rotate(calc(var(--rot) * 2)) scale(.65)}}
 .pn-bot{width:clamp(55px,9vw,116px);height:clamp(72px,12vw,145px);perspective:500px;filter:drop-shadow(0 0 12px rgba(75,255,100,.16))}
 .pn-bot-left{left:1%;animation:pnBotWalkLeft 2.3s cubic-bezier(.2,.75,.2,1) both}
 .pn-bot-right{right:1%;animation:pnBotWalkRight 2.3s cubic-bezier(.2,.75,.2,1) both}
 .pn-bot-body{height:100%;width:100%;transform-style:preserve-3d;animation:pnBotBob .28s ease-in-out 7 alternate}
 .pn-bot-leg{transform-origin:50% 78%;animation:pnBotStep .3s ease-in-out 7 alternate}
 .pn-bot-leg-b{animation-delay:-.15s}
 .pn-bot-eye{filter:drop-shadow(0 0 5px #43ff65)}
 .pn-confetti-piece{position:absolute;display:block;width:6px;height:11px;border-radius:2px;opacity:0;animation:pnConfettiBlast 2.6s ease-out var(--delay) both}
 .pn-bot-right .pn-confetti{transform:scaleX(-1);left:10%}
 @media(max-width:640px){.pn-bot{width:45px;height:60px;bottom:5px}.pn-hero-brand{transform:scale(.83)}.pn-confetti-piece{width:4px;height:7px}}
 @keyframes pnTestimonialAppear{0%{opacity:0;transform:translateY(24px) rotateX(14deg)}100%{opacity:1;transform:translateY(0) rotateX(0)}}
 .pn-testimonial-card{transform-style:preserve-3d;animation:pnTestimonialAppear .8s cubic-bezier(.2,.8,.2,1) both}
 @media (prefers-reduced-motion:reduce){.pn-hero-p,.pn-hero-wordmark,.pn-hero-line,.pn-hero-tag,.pn-bot,.pn-bot-body,.pn-bot-leg,.pn-confetti-piece,.pn-testimonial-card{animation:none!important}}
 `}</style>
 </main>;
}
