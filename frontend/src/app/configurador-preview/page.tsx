"use client";

import { useMemo, useState } from "react";
import { MODULAR_CATALOG, normalizeSelection, expandEntitlements } from "@/lib/commercial/modular-catalog";

type Family = "studio" | "crm" | "development";
const categories: {id:Family;label:string;hint:string}[]=[
{id:"studio",label:"Estúdio Criativo",hint:"Criação & publicação"},
{id:"crm",label:"CRM Inteligente",hint:"Prospecção & vendas"},
{id:"development",label:"Desenvolvimento",hint:"Em breve"}
];
const info:Record<string,{icon:string;description:string;benefit:string;featured?:boolean}>={
"studio.sites":{icon:"◈",description:"Crie sites profissionais com IA, do briefing à publicação.",benefit:"Sites prontos para vender",featured:true},
"studio.landing":{icon:"▣",description:"Páginas de alta conversão para campanhas e lançamentos.",benefit:"Mais conversões"},
"studio.cloner":{icon:"⧉",description:"Recrie referências visuais e personalize cada detalhe.",benefit:"Agilidade criativa"},
"studio.forms":{icon:"☷",description:"Formulários personalizados para captar e organizar contatos.",benefit:"Captação de leads"},
"studio.quizzes":{icon:"✳",description:"Quizzes interativos para engajar e qualificar seu público.",benefit:"Engajamento inteligente"},
"studio.ebooks":{icon:"▤",description:"Produza materiais digitais com assistência de IA.",benefit:"Conteúdo em escala"},
"crm.search":{icon:"◎",description:"Encontre empresas e oportunidades para prospectar.",benefit:"Novos negócios"},
"crm.leads":{icon:"◇",description:"Organize contatos e acompanhe cada oportunidade.",benefit:"Pipeline organizado"},
"crm.operations":{icon:"▥",description:"Centralize sua rotina e processos comerciais.",benefit:"Mais produtividade"},
"development.apps":{icon:"⌘",description:"Uma nova geração de aplicações para o seu negócio.",benefit:"Em desenvolvimento"},
"development.systems":{icon:"⬡",description:"Soluções digitais sob medida para sua operação.",benefit:"Em desenvolvimento"},
"bundle.studio":{icon:"✦",description:"Todas as ferramentas do Estúdio em uma única seleção.",benefit:"6 ferramentas incluídas",featured:true},
"bundle.crm":{icon:"✦",description:"Busca, gestão de leads e operação comercial integradas.",benefit:"3 ferramentas incluídas",featured:true}
};

export default function ConfiguradorPreview(){
 const [family,setFamily]=useState<Family>("studio");
 const [selected,setSelected]=useState<string[]>([]);
 const [showDetails,setShowDetails]=useState(false);
 const selection=useMemo(()=>normalizeSelection(selected),[selected]);
 const included=useMemo(()=>expandEntitlements(selected),[selected]);
 const chosen=selection.map(code=>MODULAR_CATALOG.find(x=>x.code===code)!).filter(Boolean);
 const toggle=(code:string)=>setSelected(prev=>prev.includes(code)?prev.filter(v=>v!==code):[...prev,code]);
 const totalTools=included.filter(x=>!x.startsWith("bundle.")).length;
 const groupItems=MODULAR_CATALOG.filter(item=>item.family===family);
 return <main className="min-h-screen bg-[#070c09] text-[#f7fff8]">
 <div className="pointer-events-none absolute inset-x-0 top-0 h-[680px] overflow-hidden" aria-hidden="true"><div className="absolute -left-48 -top-64 h-[620px] w-[620px] rounded-full bg-emerald-500/[0.09] blur-[110px]"/><div className="absolute right-0 top-0 h-[450px] w-[450px] rounded-full bg-lime-400/[0.055] blur-[100px]"/></div>
 <div className="relative mx-auto max-w-[1300px] px-5 pb-36 pt-7 sm:px-8 lg:pb-20">
 <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.09] pb-6">
 <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#c7ff69] text-2xl font-black text-[#0c1a0b]">P</div><div><div className="text-lg font-black tracking-tight">PageNova <span className="text-[#baff67]">AI</span></div><div className="text-[10px] font-bold uppercase tracking-[.22em] text-white/40">Monte seu espaço</div></div></div>
 <div className="flex items-center gap-2 rounded-full border border-[#a9f45d]/25 bg-[#a9f45d]/[0.07] px-4 py-2 text-[11px] font-bold tracking-wide text-[#c7ff83]"><span className="h-1.5 w-1.5 rounded-full bg-[#b7ff73]"/> AMBIENTE DE DEMONSTRAÇÃO · SEM COBRANÇAS</div>
 </header>
 <section className="pb-9 pt-12 sm:pb-11 sm:pt-16">
 <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] font-semibold text-[#b4ed99]"><span>✦</span> Sua plataforma, do seu jeito <span className="text-white/25">/</span> Configurador de soluções</div>
 <h1 className="max-w-[850px] text-[clamp(2.35rem,5.4vw,4.7rem)] font-black leading-[1.06] tracking-[-.055em]">Sua próxima grande ideia<br/><span className="bg-gradient-to-r from-[#d4ff91] via-[#a7ef6a] to-[#4ccf8a] bg-clip-text text-transparent">começa com as ferramentas certas.</span></h1>
 <p className="mt-6 max-w-[650px] text-[15px] leading-7 text-white/55 sm:text-[17px]">Crie, atraia clientes e cresça com inteligência artificial. Escolha ferramentas individuais ou combine soluções em um único espaço.</p>
 <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-white/65"><span><b className="mr-2 text-[#baff70]">✓</b>Escolha livre</span><span><b className="mr-2 text-[#baff70]">✓</b>Ferramentas integradas</span><span><b className="mr-2 text-[#baff70]">✓</b>Monte no seu ritmo</span></div>
 </section>
 <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start xl:gap-9">
 <section>
 <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#9ee776]">01 / ESCOLHA SUAS SOLUÇÕES</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight">Explore as ferramentas</h2></div><span className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/50">{MODULAR_CATALOG.filter(x=>x.status!=="coming_soon"&&!x.code.startsWith("bundle.")).length} ferramentas para explorar</span></div>
 <div className="mb-5 grid gap-2 rounded-2xl border border-white/[0.09] bg-[#101a13] p-1.5 sm:grid-cols-3" role="tablist" aria-label="Categorias">
 {categories.map(c=><button key={c.id} role="tab" aria-selected={family===c.id} onClick={()=>setFamily(c.id)} className={"rounded-xl px-4 py-3.5 text-left transition "+(family===c.id?"bg-[#c7ff75] text-[#11200d] shadow-[0_4px_24px_rgba(185,255,111,.12)]":"text-white/65 hover:bg-white/[0.055]")}>
 <span className="block text-[13px] font-extrabold">{c.label}</span><span className={"mt-1 block text-[11px] "+(family===c.id?"text-[#29411c]":"text-white/35")}>{c.hint}</span></button>)}
 </div>
 <div className="grid gap-3 sm:grid-cols-2">
 {groupItems.map(item=>{
 const detail=info[item.code];const active=selected.includes(item.code);const isIncluded=!active&&included.includes(item.code);const disabled=item.status==="coming_soon";const bundle=item.code.startsWith("bundle.");
 return <button key={item.code} type="button" disabled={disabled} onClick={()=>toggle(item.code)} aria-pressed={active} className={"group relative flex min-h-[208px] flex-col overflow-hidden rounded-[20px] border p-5 text-left transition-all duration-200 sm:p-6 "+(active?"border-[#bbfa75] bg-[#182d1b] shadow-[0_0_0_1px_rgba(180,255,100,.1)]":isIncluded?"border-emerald-400/35 bg-[#12221a]":"border-white/[0.09] bg-[#111b15] hover:-translate-y-0.5 hover:border-[#9de875]/40 hover:bg-[#17231a]")+(disabled?" cursor-not-allowed opacity-45":"")}>
 {bundle&&<div className="absolute right-0 top-0 rounded-bl-xl bg-[#c5ff78] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#15230e]">PACOTE</div>}
 <div className="flex items-start justify-between gap-3"><div className="grid h-12 w-12 place-items-center rounded-[14px] border border-[#a6f36a]/20 bg-[#a7ed66]/10 text-[26px] font-bold text-[#c7ff86]">{detail.icon}</div>{!bundle&&<span className={"grid h-7 w-7 place-items-center rounded-lg border text-lg "+(active?"border-[#c6ff7b] bg-[#c6ff7b] text-[#14220f]":"border-white/20 text-white/55 group-hover:border-[#b9f477]")}>{active?"✓":isIncluded?"✓":"+"}</span>}</div>
 <h3 className="mt-5 text-[16px] font-extrabold tracking-tight">{item.title}</h3><p className="mt-2 text-[12px] leading-[1.65] text-white/50">{detail.description}</p>
 <div className="mt-auto flex items-center justify-between gap-2 pt-5"><span className="text-[11px] font-semibold text-[#b1e88b]">{disabled?"Em breve":isIncluded?"Incluído no pacote":detail.benefit}</span><span className="text-[11px] font-bold text-white/50">{active?"✓ Selecionado":disabled?"Indisponível":isIncluded?"Incluído":"Adicionar →"}</span></div>
 </button>;
 })}
 </div>
 <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><span className="text-xl text-[#b4f77a]">✧</span><p className="text-xs leading-6 text-white/50"><b className="text-white/75">Dica:</b> ao selecionar um pacote completo, as ferramentas incluídas aparecem automaticamente como disponíveis. Você pode personalizar sua escolha a qualquer momento.</p></div>
 </section>
 <aside className="lg:sticky lg:top-7">
 <div className="overflow-hidden rounded-[24px] border border-[#9cdd6d]/30 bg-[#142019] shadow-[0_18px_70px_rgba(0,0,0,.25)]">
 <div className="border-b border-white/10 bg-gradient-to-br from-[#1d3523] to-[#142019] p-6"><div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[.17em] text-[#b8ed93]">02 / SUA SELEÇÃO</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#b7f46c]/10 text-xl text-[#c7ff86]">◈</span></div><h2 className="mt-3 text-2xl font-extrabold tracking-tight">Seu espaço PageNova</h2><p className="mt-2 text-xs leading-5 text-white/50">Tudo o que você precisa, em um só lugar.</p></div>
 <div className="p-6">
 <div className="mb-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><strong className="block text-2xl font-black text-[#c9ff87]">{selection.length}</strong><span className="text-[11px] text-white/45">seleções</span></div><div className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><strong className="block text-2xl font-black text-[#c9ff87]">{totalTools}</strong><span className="text-[11px] text-white/45">ferramentas incluídas</span></div></div>
 {chosen.length?<div className="space-y-2">{chosen.map(item=><div key={item.code} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#1b2b20] px-3 py-3"><div className="flex min-w-0 items-center gap-2"><span className="text-[#c7ff86]">{info[item.code].icon}</span><span className="truncate text-xs font-bold">{item.title}</span></div><button type="button" onClick={()=>toggle(item.code)} className="rounded-md px-2 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-white" aria-label={"Remover "+item.title}>✕</button></div>)}</div>:<div className="rounded-xl border border-dashed border-[#a5e778]/20 bg-[#a5e778]/[0.025] px-4 py-7 text-center"><div className="text-3xl text-[#b7ef87]/70">✦</div><p className="mt-3 text-xs leading-6 text-white/50">Seu próximo projeto começa aqui.<br/>Selecione suas primeiras ferramentas.</p></div>}
 {selection.length>0&&<button onClick={()=>setShowDetails(v=>!v)} className="mt-4 text-xs font-semibold text-[#baf480] underline decoration-[#baf480]/40 underline-offset-4">{showDetails?"Ocultar":"Ver"} ferramentas incluídas ({totalTools})</button>}
 {showDetails&&selection.length>0&&<div className="mt-3 flex flex-wrap gap-1.5">{included.filter(x=>!x.startsWith("bundle.")).map(code=><span key={code} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] text-white/65">{MODULAR_CATALOG.find(x=>x.code===code)?.title}</span>)}</div>}
 <div className="mt-6 border-t border-white/10 pt-5"><div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-white/45">Investimento</span><span className="rounded-full bg-[#b7f46c]/10 px-2 py-1 text-[10px] font-bold text-[#c8ff86]">EM DEFINIÇÃO</span></div><p className="mt-3 text-[28px] font-black tracking-tight text-[#c7ff86]">Valores em breve</p><p className="mt-2 text-xs leading-5 text-white/45">Estamos finalizando os planos. Este ambiente não realiza cobranças nem ativa assinaturas.</p></div>
 <button type="button" disabled className="mt-5 w-full cursor-not-allowed rounded-xl bg-[#a8d66f]/60 px-4 py-4 text-sm font-black text-[#12210c]">Checkout em preparação ↗</button><p className="mt-3 text-center text-[11px] text-white/35">Prévia exclusiva para avaliação</p>
 </div></div>
 <div className="mt-4 flex items-start gap-2 px-3 text-[11px] leading-5 text-white/40"><span className="text-[#b6f77b]">✓</span> Os planos atuais e assinaturas existentes permanecem inalterados.</div>
 </aside></div>
 <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-7 text-xs text-white/35"><span>PageNova AI · Soluções inteligentes para quem faz acontecer.</span><span>Ambiente de demonstração · Frente 3</span></footer>
 </div>
 <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-[#b4f577]/20 bg-[#101a13]/95 px-5 py-3 shadow-[0_-10px_40px_rgba(0,0,0,.4)] backdrop-blur lg:hidden"><div><div className="text-[11px] text-white/50">{selection.length} seleções · {totalTools} ferramentas</div><div className="text-sm font-black text-[#c7ff86]">Valores em breve</div></div><button type="button" disabled className="rounded-xl bg-[#b1db80]/60 px-4 py-3 text-xs font-black text-[#10200e]">Em preparação ↗</button></div>
 </main>;
}
