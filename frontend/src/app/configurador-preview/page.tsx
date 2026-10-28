"use client";

import { useMemo, useState } from "react";
import { MODULAR_CATALOG, normalizeSelection, expandEntitlements } from "@/lib/commercial/modular-catalog";
import { calculatePreviewQuote, PREVIEW_PRICES_CENTS } from "@/lib/commercial/preview-pricing";

type Family = "studio" | "crm" | "development";
type Scenario = "studio" | "crm" | "development" | "all";
const ownedByScenario:Record<Scenario,string[]>={studio:[],crm:[],development:[],all:[]};
const baseByScenario:Record<Scenario,string>={studio:"bundle.studio",crm:"bundle.crm",development:"bundle.development",all:"bundle.all"};
const tabs: {id:Family;label:string}[]=[{id:"studio",label:"Estúdio"},{id:"crm",label:"CRM"},{id:"development",label:"Desenvolvimento"}];
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
"bundle.crm":{icon:"✦",description:"Toda a operação comercial integrada."}
};

export default function ConfiguradorPreview(){
 const [family,setFamily]=useState<Family>("studio");
 const [scenario,setScenario]=useState<Scenario>("studio");
 const owned=useMemo(()=>expandEntitlements(ownedByScenario[scenario]),[scenario]);
 const isOwned=(code:string)=>owned.includes(code);
 const [selected,setSelected]=useState<string[]>(["bundle.studio"]);
 const [expanded,setExpanded]=useState(false);
 const normalized=useMemo(()=>normalizeSelection(selected),[selected]);
 const granted=useMemo(()=>expandEntitlements(selected),[selected]);
 const selectedItems=normalized.map(code=>MODULAR_CATALOG.find(item=>item.code===code)!).filter(Boolean);
 const toolCount=granted.filter(code=>!code.startsWith("bundle.")).length;
 const quote=useMemo(()=>calculatePreviewQuote(normalized),[normalized]);
 const selectedBase=baseByScenario[scenario];
 const availableTabs=tabs.filter(tab=>tab.id!==scenario&&scenario!=="all");
 const brl=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
 const toggle=(code:string)=>{if(isOwned(code)||code===baseByScenario[scenario])return;setSelected(prev=>normalizeSelection(prev.includes(code)?prev.filter(item=>item!==code):[...prev,code]));};
 const changeScenario=(next:Scenario)=>{setScenario(next);setSelected([baseByScenario[next]]);setExpanded(false);setFamily(next==="studio"?"crm":"studio");};
 const tools=MODULAR_CATALOG.filter(item=>item.family===family&&!item.code.startsWith("bundle.")&&item.family!==scenario);
 const bundles=MODULAR_CATALOG.filter(item=>item.family===family&&item.code.startsWith("bundle.")&&item.code!==baseByScenario[scenario]&&item.code!=="bundle.all");
 return <main className="min-h-screen bg-[#090e0b] text-[#f7faf6]">
 <div className="mx-auto max-w-[1180px] px-5 pb-28 sm:px-8 lg:pb-16">
 <header className="flex items-center justify-between gap-3 border-b border-white/10 py-6">
 <div className="flex items-center gap-2.5"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#b9f77a] text-lg font-black text-[#10200c]">P</div><strong className="text-lg tracking-tight">PageNova <span className="text-[#b9f77a]">AI</span></strong></div>
 <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">Prévia · Sem cobranças</span>
 </header>
 <section className="py-10 sm:py-14">
 <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#b9f77a]">Sua plataforma, suas escolhas</span>
 <h1 className="mt-3 max-w-[760px] text-[clamp(2.2rem,4.3vw,3.8rem)] font-extrabold leading-[1.12] tracking-[-.045em]">Escolha as ferramentas.<br/><span className="text-[#b9f77a]">A gente simplifica o resto.</span></h1>
 <p className="mt-4 max-w-[590px] text-sm leading-7 text-white/55 sm:text-base">Monte seu espaço de trabalho com as soluções que fazem sentido para o seu negócio.</p>
 </section>
 <section aria-label="Escolha do pacote principal" className="mb-8 rounded-2xl border border-white/10 bg-[#121a14] p-4 sm:p-5">
 <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-bold">Escolha seu pacote principal</h2><span className="text-[11px] text-white/45">Valores mensais para novos clientes · sem cobrança nesta prévia</span></div>
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
 {([{id:"studio",label:"PageNova Studio",price:20700},{id:"crm",label:"PageNova CRM",price:24700},{id:"development",label:"Apps e Sistemas",price:39700},{id:"all",label:"PageNova Completa",price:59700}] as const).map(option=><button key={option.id} type="button" onClick={()=>changeScenario(option.id)} aria-pressed={scenario===option.id} className={"rounded-xl border p-4 text-left transition "+(scenario===option.id?"border-[#b9f77a] bg-[#1b2c1c]":"border-white/10 bg-white/[0.035] hover:border-[#b9f77a]/40")}>
 <span className="block text-sm font-bold">{option.label}</span><strong className="mt-2 block text-xl text-[#b9f77a]">{brl(option.price)}<span className="text-xs font-normal text-white/45">/mês</span></strong>
 <span className="mt-2 block text-[11px] text-white/45">{option.id==="all"?"Economize R$ 254 em relação aos 3 pacotes":option.id==="development"?"Em desenvolvimento · contratação indisponível":"Pacote principal incluído automaticamente"}</span>
 </button>)}
 </div>
 {scenario==="all"&&<p className="mt-3 text-xs text-[#b9f77a]">Studio + CRM + Apps e Sistemas. Economia de R$ 254/mês (29,8%). Apps e Sistemas ainda não disponível para contratação.</p>}
 {scenario==="development"&&<p className="mt-3 text-xs text-[#b9f77a]">Apps e Sistemas está em desenvolvimento. Esta seleção é apenas uma demonstração comercial.</p>}
 </section>
 <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_318px] lg:items-start lg:gap-8">
 <section aria-label="Escolha de ferramentas">
 <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-bold tracking-tight">{scenario==="all"?"Tudo incluído no pacote":"Adicione complementos"}</h2><span className="text-xs text-white/40">{scenario==="all"?"Sem cobrança duplicada":"Personalize seu pacote"}</span></div>
 {scenario!=="all"&&<div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-[#121a14] p-1" role="tablist" aria-label="Categorias">
 {availableTabs.map(tab=><button key={tab.id} type="button" role="tab" aria-selected={family===tab.id} onClick={()=>setFamily(tab.id)} className={"flex-1 rounded-lg px-2 py-3 text-xs font-bold transition sm:text-sm "+(family===tab.id?"bg-[#b9f77a] text-[#12210e]":"text-white/50 hover:bg-white/5 hover:text-white")}>{tab.label}</button>)}
 </div>}
 <div className="grid gap-3 sm:grid-cols-2">
 {(scenario==="all"?MODULAR_CATALOG.filter(item=>!item.code.startsWith("bundle.")):tools).map(item=>{
 const active=selected.includes(item.code);const included=!active&&granted.includes(item.code);const alreadyOwned=isOwned(item.code);const disabled=item.status==="coming_soon";
 return <button key={item.code} type="button" disabled={disabled||included||alreadyOwned||scenario==="all"} onClick={()=>toggle(item.code)} aria-pressed={active||included||alreadyOwned} className={"flex min-h-[126px] items-start gap-4 rounded-2xl border p-4 text-left transition sm:p-5 "+(active?"border-[#b9f77a] bg-[#1b2c1c]":included||alreadyOwned?"border-emerald-500/35 bg-[#16251a]":"border-white/10 bg-[#121a14] hover:border-[#b9f77a]/40")+(disabled?" cursor-not-allowed opacity-45":included||alreadyOwned?" cursor-default":"")}>
 <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.055] text-xl text-[#b9f77a]">{details[item.code].icon}</span>
 <span className="min-w-0 flex-1"><strong className="block text-[14px] font-bold">{item.title}</strong><span className="mt-2 block text-[12px] leading-5 text-white/45">{details[item.code].description}</span><span className="mt-2 block text-[11px] font-semibold text-white/55">{brl(PREVIEW_PRICES_CENTS[item.code])}/mês · simulação</span><span className="mt-2 block text-[11px] font-semibold text-[#b9f77a]">{included?"Incluído no pacote":disabled?"Em breve":alreadyOwned?"Já contratado":active?"Selecionado":""}</span></span>
 <span className={"grid h-6 w-6 shrink-0 place-items-center rounded-md border text-sm "+(active?"border-[#b9f77a] bg-[#b9f77a] text-[#10200c]":"border-white/20 text-white/45")}>{active||included||alreadyOwned?"✓":"+"}</span>
 </button>;
 })}
 </div>
 {scenario!=="all"&&bundles.length>0&&<section className="mt-8" aria-label="Pacotes completos">
 <div className="mb-3 flex items-center justify-between"><h3 className="text-base font-bold">Prefere tudo junto?</h3><span className="text-xs text-white/40">Pacote completo</span></div>{bundles.some(item=>(item.includedIn??[]).some(code=>isOwned(code)))&&<p className="mb-3 text-xs text-white/45">Upgrade de pacote com itens já contratados exige cálculo proporcional aprovado; indisponível nesta prévia para evitar cobrança duplicada.</p>}
 {bundles.filter(item=>!isOwned(item.code)&&!(item.includedIn??[]).some(code=>isOwned(code))).map(item=><button key={item.code} type="button" aria-pressed={selected.includes(item.code)} onClick={()=>toggle(item.code)} className={"flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition "+(selected.includes(item.code)?"border-[#b9f77a] bg-[#1b2c1c]":"border-[#b9f77a]/20 bg-[#152017] hover:border-[#b9f77a]/50")}>
 <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#b9f77a]/10 text-2xl text-[#b9f77a]">✦</span>
 <span className="min-w-0 flex-1"><strong className="block text-sm font-bold">{item.title}</strong><span className="mt-1 block text-xs text-white/50">{details[item.code].description} · {brl(PREVIEW_PRICES_CENTS[item.code])}/mês (simulação)</span></span>
 <span className="shrink-0 rounded-lg bg-[#b9f77a] px-3 py-2 text-xs font-bold text-[#10200c]">{selected.includes(item.code)?"Selecionado ✓":"Selecionar"}</span>
 </button>)}
 </section>}
 </section>
 <aside className="lg:sticky lg:top-6 lg:-mt-12" aria-label="Resumo da assinatura">
 <div className="rounded-2xl border border-white/10 bg-[#141e16] p-5 sm:p-6">
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
 <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-white/30">PageNova AI · Ambiente de demonstração</footer>
 </div>
 <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-white/10 bg-[#121a14]/95 px-5 py-3 backdrop-blur lg:hidden"><div><div className="text-[11px] text-white/45">{toolCount} ferramentas selecionadas</div><strong className="text-sm text-[#b9f77a]">{brl(quote.totalCents)}/mês*</strong></div><button type="button" disabled className="rounded-lg bg-[#b9f77a]/60 px-4 py-3 text-xs font-bold text-[#14210e]">Em preparação</button></div>
 </main>;
}
