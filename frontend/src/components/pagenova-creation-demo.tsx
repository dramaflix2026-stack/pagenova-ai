"use client";

import { useEffect, useState } from "react";

const phases = [
  { label: "Lendo o briefing", progress: 22 },
  { label: "Criando estrutura", progress: 46 },
  { label: "Escrevendo conteúdo", progress: 68 },
  { label: "Montando o visual", progress: 86 },
  { label: "Site pronto", progress: 100 },
] as const;

export function PageNovaCreationDemo() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhase((current) => (current + 1) % phases.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  const current = phases[phase];
  const ready = phase === phases.length - 1;

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#091510] shadow-[0_32px_100px_rgba(0,0,0,.42)]">
      <div className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-[#31d9a4]/10 blur-[90px]" />
      <div className="flex h-12 items-center gap-2 border-b border-white/10 bg-[#0b1713] px-4 sm:px-5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="ml-2 truncate text-[10px] text-white/40 sm:ml-4 sm:text-[11px]">PageNova AI / criação em tempo real</span>
        <span className={"ml-auto shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold " + (ready ? "bg-[#31d9a4] text-[#062018]" : "bg-[#153b2d] text-[#7ceac2]")}>
          {ready ? "PRONTO ✓" : "IA ATIVA"}
        </span>
      </div>

      <div className="relative p-4 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#5fe0b5]">Novo site</p>
            <h3 className="mt-1.5 text-base font-semibold text-white sm:text-lg">Clínica Sorriso · São Bernardo do Campo</h3>
          </div>
          <div className="hidden items-center gap-2 text-[9px] text-white/35 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#31d9a4]" /> Gerando agora
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-white/10 bg-white/[.035] p-3.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-white/70">{current.label}</span>
            <span className="font-bold text-[#6ce5b8]">{current.progress}%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#39d9a3] transition-[width] duration-700 ease-out" style={{ width: current.progress + "%" }} />
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {phases.map((item, index) => (
              <div key={item.label} className={"h-1 rounded-full transition duration-500 " + (index <= phase ? "bg-[#39d9a3]/80" : "bg-white/10")} />
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#f4f1e9] text-[#13251d] shadow-[0_18px_55px_rgba(0,0,0,.25)]">
          <div className="flex h-9 items-center justify-between border-b border-black/[.06] bg-white/70 px-3">
            <div className="h-2 w-16 rounded-full bg-[#163b2e]/15" />
            <div className="flex gap-2"><div className="h-2 w-8 rounded-full bg-black/10" /><div className="h-5 w-12 rounded-md bg-[#153d2f]" /></div>
          </div>
          <div className="grid min-h-[245px] grid-cols-[1.08fr_.92fr] items-center gap-3 p-4 sm:min-h-[285px] sm:gap-6 sm:p-6">
            <div className="relative">
              <span className={"inline-flex rounded-full bg-[#dff5ea] px-2 py-1 text-[7px] font-bold uppercase tracking-[.14em] text-[#137650] transition-all duration-500 " + (phase >= 1 ? "opacity-100" : "translate-y-2 opacity-20")}>Odontologia humanizada</span>
              <h4 className={"mt-3 text-[22px] font-bold leading-[.98] tracking-[-.045em] transition-all duration-700 sm:text-[34px] " + (phase >= 2 ? "translate-y-0 opacity-100" : "translate-y-3 opacity-20")}>Seu sorriso merece cuidado de verdade.</h4>
              <p className={"mt-3 max-w-[250px] text-[8px] leading-4 text-black/50 transition-all duration-700 sm:text-[10px] " + (phase >= 2 ? "opacity-100" : "opacity-20")}>Atendimento próximo, tecnologia e um plano pensado para você.</p>
              <div className={"mt-4 inline-flex rounded-lg bg-[#143d2f] px-3 py-2 text-[7px] font-bold text-white transition-all duration-700 sm:text-[8px] " + (phase >= 3 ? "scale-100 opacity-100" : "scale-90 opacity-20")}>Agendar avaliação →</div>
            </div>
            <div className={"relative min-h-[190px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#d7eee3] via-[#b9dfcd] to-[#6fbb99] transition-all duration-700 sm:min-h-[225px] " + (phase >= 3 ? "scale-100 opacity-100" : "scale-[.96] opacity-30")}>
              <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/35 blur-xl" />
              <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/30 bg-white/25 p-3 backdrop-blur-md">
                <div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-[12px]">✦</div><div><div className="h-1.5 w-16 rounded bg-white/80" /><div className="mt-1.5 h-1.5 w-10 rounded bg-white/45" /></div></div>
              </div>
            </div>
          </div>
          <div className={"grid grid-cols-3 gap-2 border-t border-black/[.06] p-3 transition-all duration-700 " + (ready ? "opacity-100" : "opacity-45")}>
            {["Avaliação", "Tratamentos", "WhatsApp"].map((item) => <div key={item} className="rounded-lg bg-white px-2 py-2 text-center text-[7px] font-semibold shadow-sm sm:text-[8px]">{item}</div>)}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[9px] text-white/35">Briefing → IA → estrutura → visual → site pronto</p>
          <span className={"shrink-0 text-[9px] font-semibold transition " + (ready ? "text-[#66e4b5]" : "text-white/35")}>{ready ? "Pronto para editar" : "Construindo..."}</span>
        </div>
      </div>
    </div>
  );
}
