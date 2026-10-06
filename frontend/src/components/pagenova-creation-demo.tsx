"use client";

import { useEffect, useState } from "react";

const phases = [
  { label: "Lendo o briefing", progress: 14 },
  { label: "Planejando seções", progress: 32 },
  { label: "Escrevendo conteúdo", progress: 55 },
  { label: "Criando o visual", progress: 78 },
  { label: "Finalizando página", progress: 94 },
  { label: "Site pronto", progress: 100 },
] as const;

export function PageNovaCreationDemo() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setPhase((v) => (v + 1) % phases.length), 1600);
    return () => window.clearInterval(timer);
  }, []);

  const current = phases[phase];
  const ready = phase === phases.length - 1;

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#081711] shadow-[0_32px_100px_rgba(0,0,0,.44)]">
      <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-[#31d9a4]/10 blur-[85px]" />
      <div className="flex h-12 items-center gap-2 border-b border-white/10 bg-[#0b1713] px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="ml-2 truncate text-[10px] text-white/40">PageNova AI / criação em tempo real</span>
        <span className={"ml-auto rounded-full px-2.5 py-1 text-[9px] font-bold "+(ready?"bg-[#31d9a4] text-[#062018]":"bg-[#153b2d] text-[#7ceac2]")}>{ready?"SITE PRONTO ✓":"IA ATIVA"}</span>
      </div>

      <div className="relative p-4 sm:p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#5fe0b5]">Novo site</p><h3 className="mt-1.5 text-base font-semibold text-white sm:text-lg">Clínica Sorriso · São Bernardo do Campo</h3></div>
          <span className="hidden text-[9px] text-white/40 sm:block">{ready?"Pronto para editar":"Gerando agora..."}</span>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/[.035] p-3.5">
          <div className="flex items-center justify-between text-[10px]"><span className="font-semibold text-white/75">{current.label}</span><span className="font-bold text-[#6ce5b8]">{current.progress}%</span></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#39d9a3] transition-[width] duration-700" style={{width:current.progress+"%"}} /></div>
          <div className="mt-3 flex justify-between gap-1">
            {phases.map((x,i)=><span key={x.label} className={"h-1 flex-1 rounded-full transition-all duration-500 "+(i<=phase?"bg-[#39d9a3]/80":"bg-white/10")} />)}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[#f6f3eb] text-[#13251d] shadow-[0_20px_60px_rgba(0,0,0,.30)]">
          <div className="flex h-9 items-center justify-between border-b border-black/[.06] bg-white/80 px-3"><div className="h-2 w-16 rounded bg-[#173c2e]/15" /><div className="flex gap-2"><div className="h-2 w-8 rounded bg-black/10"/><div className="h-5 w-12 rounded-md bg-[#153d2f]"/></div></div>

          <div className="relative min-h-[300px] p-4 sm:min-h-[330px] sm:p-6">
            {phase===0 && <div className="absolute inset-0 z-20 grid place-items-center bg-[#f6f3eb]/95 p-6"><div className="w-full max-w-sm space-y-3"><div className="h-3 w-28 animate-pulse rounded bg-[#2c8d69]/25"/><div className="h-7 w-4/5 animate-pulse rounded bg-[#173c2e]/15"/><div className="h-3 w-full animate-pulse rounded bg-black/10"/><div className="h-3 w-3/4 animate-pulse rounded bg-black/10"/><p className="pt-3 text-center text-[9px] font-semibold uppercase tracking-[.16em] text-[#27815f]">Interpretando seu briefing...</p></div></div>}

            <div className="grid grid-cols-[1.08fr_.92fr] items-center gap-3 sm:gap-6">
              <div>
                <span className={"inline-flex rounded-full bg-[#dff5ea] px-2 py-1 text-[7px] font-bold uppercase tracking-[.14em] text-[#137650] transition-all duration-500 "+(phase>=1?"opacity-100":"opacity-0")}>Odontologia humanizada</span>
                <h4 className={"mt-3 text-[24px] font-bold leading-[.98] tracking-[-.05em] transition-all duration-700 sm:text-[36px] "+(phase>=2?"translate-y-0 opacity-100":"translate-y-3 opacity-20")}>Seu sorriso merece cuidado de verdade.</h4>
                <p className={"mt-3 text-[8px] leading-4 text-black/50 transition duration-700 sm:text-[10px] "+(phase>=2?"opacity-100":"opacity-20")}>Atendimento próximo, tecnologia e um plano pensado para você.</p>
                <div className={"mt-4 inline-flex rounded-lg bg-[#143d2f] px-3 py-2 text-[7px] font-bold text-white transition-all duration-700 "+(phase>=3?"scale-100 opacity-100":"scale-90 opacity-0")}>Agendar avaliação →</div>
              </div>
              <div className={"relative min-h-[205px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#d7eee3] via-[#b9dfcd] to-[#70bb99] transition-all duration-700 sm:min-h-[235px] "+(phase>=3?"scale-100 opacity-100":"scale-[.96] opacity-20")}>
                <div className="absolute left-1/2 top-[43%] h-28 w-20 -translate-x-1/2 -translate-y-1/2 rounded-[50%_50%_45%_45%] bg-white/30 blur-[1px]" />
                <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/35 bg-white/30 p-3 backdrop-blur-md"><div className="flex items-center gap-2"><div className="grid h-7 w-7 place-items-center rounded-full bg-white/80">✦</div><div className="flex-1"><div className="h-1.5 w-4/5 rounded bg-white/90"/><div className="mt-1.5 h-1.5 w-1/2 rounded bg-white/50"/></div></div></div>
              </div>
            </div>

            <div className={"mt-5 grid grid-cols-3 gap-2 transition-all duration-700 "+(phase>=4?"translate-y-0 opacity-100":"translate-y-2 opacity-0")}>
              {["Avaliação","Tratamentos","WhatsApp"].map(x=><div key={x} className="rounded-xl border border-black/[.05] bg-white p-2 text-center text-[7px] font-semibold shadow-sm">{x}</div>)}
            </div>

            {ready && <div className="absolute inset-0 z-30 grid place-items-center bg-[#0c281d]/88 p-6 backdrop-blur-[2px]"><div className="text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#46dda7] text-2xl font-black text-[#082219] shadow-[0_0_35px_rgba(70,221,167,.35)]">✓</div><p className="mt-4 text-lg font-bold text-white">Seu site está pronto</p><p className="mt-1 text-[10px] text-white/55">Abra a prévia e continue editando.</p><div className="mx-auto mt-4 inline-flex rounded-lg bg-[#46dda7] px-4 py-2 text-[9px] font-bold text-[#082219]">Abrir site →</div></div></div>}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3"><p className="text-[9px] text-white/35">Briefing → estrutura → copy → visual → revisão</p><span className={"shrink-0 text-[9px] font-semibold "+(ready?"text-[#66e4b5]":"text-white/35")}>{ready?"Concluído":"Construindo..."}</span></div>
      </div>
    </div>
  );
}
