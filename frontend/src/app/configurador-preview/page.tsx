"use client";

import {useMemo,useState} from "react";
import {MODULAR_CATALOG,normalizeSelection,expandEntitlements} from "@/lib/commercial/modular-catalog";

const groups=[{id:"studio",title:"Estúdio"},{id:"crm",title:"CRM"},{id:"development",title:"Desenvolvimento"}] as const;

export default function ConfiguradorPreview(){
  const [selected,setSelected]=useState<string[]>([]);
  const [tab,setTab]=useState<string>("studio");
  const normalized=useMemo(()=>normalizeSelection(selected),[selected]);
  const granted=useMemo(()=>expandEntitlements(selected),[selected]);
  const items=MODULAR_CATALOG.filter(item=>item.family===tab);
  function toggle(code:string){
    setSelected(current=>current.includes(code)?current.filter(v=>v!==code):[...current,code]);
  }
  return <main className="min-h-screen bg-[#080e0a] px-4 py-10 text-white sm:px-8">
    <div className="mx-auto max-w-7xl">
      <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-xs font-semibold text-lime-300">PREVIEW · SEM COBRANÇAS</span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">Monte sua PageNova AI</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">Escolha apenas as ferramentas que você precisa. Os valores e checkouts serão habilitados após homologação.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section aria-label="Catálogo de ferramentas">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Famílias de produtos">
            {groups.map(group=><button key={group.id} role="tab" aria-selected={tab===group.id} onClick={()=>setTab(group.id)} className={"rounded-xl px-4 py-3 text-sm font-semibold transition "+(tab===group.id?"bg-lime-300 text-[#102013]":"border border-white/15 bg-white/5 text-white/70 hover:bg-white/10")}>{group.title}</button>)}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {items.map(item=>{
              const unavailable=item.status==="coming_soon";
              const checked=selected.includes(item.code);
              const included=!checked&&granted.includes(item.code);
              return <button key={item.code} type="button" disabled={unavailable} onClick={()=>toggle(item.code)} aria-pressed={checked} className={"min-h-36 rounded-2xl border p-5 text-left transition "+(checked?"border-lime-300/70 bg-lime-300/10":included?"border-emerald-400/30 bg-emerald-400/5":"border-white/10 bg-[#121d15] hover:border-lime-300/35")+(unavailable?" cursor-not-allowed opacity-45":"")}>
                <div className="flex items-start justify-between gap-3"><strong className="text-base">{item.title}</strong><span className={"grid h-6 w-6 shrink-0 place-items-center rounded-md border text-sm "+(checked?"border-lime-300 bg-lime-300 text-[#102013]":"border-white/25 text-white/40")}>{checked?"✓":"+"}</span></div>
                <span className="mt-5 block text-xs text-white/50">{unavailable?"Em breve":included?"Já incluído no pacote":item.status==="needs_validation"?"Em homologação":"Disponível para seleção no preview"}</span>
              </button>;
            })}
          </div>
        </section>
        <aside className="rounded-2xl border border-lime-300/25 bg-[#14221a] p-5 lg:sticky lg:top-6" aria-label="Resumo da seleção">
          <h2 className="text-xl font-bold">Sua assinatura</h2>
          <p className="mt-1 text-sm text-white/55">{normalized.length} {normalized.length===1?"item selecionado":"itens selecionados"}</p>
          <div className="mt-5 space-y-2">{normalized.length?normalized.map(code=>{
            const item=MODULAR_CATALOG.find(v=>v.code===code);
            return <div key={code} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm"><span>{item?.title}</span><button type="button" onClick={()=>toggle(code)} className="text-xs font-semibold text-lime-300" aria-label={"Remover "+item?.title}>Remover</button></div>;
          }):<p className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-white/45">Selecione uma ou mais ferramentas para começar.</p>}</div>
          <div className="mt-6 border-t border-white/10 pt-5"><p className="text-xs uppercase tracking-widest text-white/45">Valor mensal</p><p className="mt-2 text-2xl font-bold text-lime-300">A definir</p><p className="mt-2 text-xs leading-5 text-white/45">Este é um preview. Nenhuma compra ou assinatura será criada.</p></div>
          <button type="button" disabled className="mt-5 w-full cursor-not-allowed rounded-xl bg-lime-300/50 px-4 py-4 font-bold text-[#102013]">Checkout em preparação</button>
        </aside>
      </div>
    </div>
    <div className="h-20 lg:hidden" aria-hidden="true"/>
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-lime-300/20 bg-[#0d1710]/95 px-4 py-3 backdrop-blur lg:hidden"><div><p className="text-xs text-white/50">{normalized.length} selecionados</p><strong className="text-sm text-lime-300">Preço a definir</strong></div><button disabled className="rounded-lg bg-lime-300/50 px-4 py-3 text-sm font-bold text-[#102013]">Em preparação</button></div>
  </main>;
}
