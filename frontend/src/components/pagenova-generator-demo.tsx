"use client";

import { useEffect, useState } from "react";

type Phase =
  | "idle"
  | "typing"
  | "style"
  | "tone"
  | "clicking"
  | "generating"
  | "complete";

const OFFER =
  "Curso prático para criar landing pages que convertem, voltado para empreendedores e produtores digitais.";

const PHASES: Phase[] = [
  "idle",
  "typing",
  "style",
  "tone",
  "clicking",
  "generating",
  "complete",
];

export function PageNovaGeneratorDemo() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [typedText, setTypedText] = useState("");

  const phase = PHASES[phaseIndex];

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (typedText.length < OFFER.length) {
        timer = setTimeout(() => {
          setTypedText(OFFER.slice(0, typedText.length + 1));
        }, 22);
      } else {
        timer = setTimeout(() => {
          setPhaseIndex(2);
        }, 550);
      }

      return () => clearTimeout(timer);
    }

    const durations: Record<Exclude<Phase, "typing">, number> = {
      idle: 700,
      style: 850,
      tone: 850,
      clicking: 500,
      generating: 1900,
      complete: 3000,
    };

    timer = setTimeout(() => {
      if (phase === "complete") {
        setTypedText("");
        setPhaseIndex(0);
        return;
      }

      setPhaseIndex((current) =>
        Math.min(current + 1, PHASES.length - 1)
      );
    }, durations[phase]);

    return () => clearTimeout(timer);
  }, [phase, typedText]);

  const showCursor =
    phase === "typing" ||
    phase === "style" ||
    phase === "tone" ||
    phase === "clicking";

  const cursorPositions: Record<
    "typing" | "style" | "tone" | "clicking",
    string
  > = {
    typing: "left-[66%] top-[32%]",
    style: "left-[62%] top-[58%]",
    tone: "left-[83%] top-[58%]",
    clicking: "left-[74%] top-[78%]",
  };

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0B0715] shadow-[0_30px_100px_rgba(74,39,160,0.18)]">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#6F3CFF]/15 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#9C7BFF]/10 blur-[100px]" />

      <div className="relative grid gap-12 px-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:py-14">
        <div className="flex flex-col justify-center">
          <div className="mb-5 text-[11px] font-bold uppercase tracking-[0.24em] text-[#A88BFF]">
            Gerador
          </div>

          <h2 className="max-w-[520px] text-[38px] font-bold leading-[1.04] tracking-[-0.04em] text-white md:text-[48px]">
            Não tem uma página para clonar? Comece uma nova.
          </h2>

          <p className="mt-6 max-w-[540px] text-[16px] leading-7 text-[#8F879E]">
            Informe os principais dados da sua oferta e use o gerador da
            PageNova como ponto de partida.
          </p>

          <div className="mt-8">
            <button
              type="button"
              className="rounded-xl bg-gradient-to-r from-[#8057FF] to-[#6934F5] px-7 py-4 text-sm font-bold text-white shadow-[0_12px_35px_rgba(111,60,255,0.25)] transition-transform hover:-translate-y-0.5"
            >
              Criar minha página
              <span className="ml-4">→</span>
            </button>
          </div>

          <div className="mt-8 flex items-center gap-3 text-xs text-[#71697E]">
            <span
              className={`h-2 w-2 rounded-full transition-all duration-500 ${
                phase === "complete"
                  ? "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]"
                  : "bg-[#7444FF] shadow-[0_0_14px_rgba(116,68,255,0.7)]"
              }`}
            />

            {phase === "complete"
              ? "Landing page criada"
              : phase === "generating"
                ? "PageNova AI está criando sua página..."
                : "Demonstração automática"}
          </div>
        </div>

        <div className="relative flex min-h-[410px] items-center">
          <div className="relative w-full overflow-hidden rounded-[26px] border border-white/10 bg-[#151020] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div
              className={`transition-all duration-700 ${
                phase === "complete"
                  ? "translate-x-[-8%] scale-[0.96] opacity-0"
                  : "translate-x-0 scale-100 opacity-100"
              }`}
            >
              <label className="mb-3 block text-[11px] font-semibold text-[#948AA5]">
                O que você está vendendo?
              </label>

              <div
                className={`min-h-[120px] rounded-2xl border bg-[#100C18] px-5 py-4 text-sm leading-6 transition-all duration-300 ${
                  phase === "typing"
                    ? "border-[#7645FF] shadow-[0_0_0_3px_rgba(118,69,255,0.08)]"
                    : "border-white/10"
                }`}
              >
                {typedText ? (
                  <span className="text-[#C4BDCF]">
                    {typedText}
                    {phase === "typing" && (
                      <span className="ml-0.5 animate-pulse text-[#A98BFF]">
                        |
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-[#625A6E]">
                    Descreva seu produto ou serviço, o público e a principal
                    proposta da sua oferta...
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div
                  className={`rounded-2xl border p-4 transition-all duration-500 ${
                    phase === "style" ||
                    phase === "tone" ||
                    phase === "clicking" ||
                    phase === "generating"
                      ? "border-[#7040FF]/60 bg-[#1B1230] shadow-[0_0_24px_rgba(112,64,255,0.08)]"
                      : "border-white/10 bg-[#100C18]"
                  }`}
                >
                  <div className="text-[10px] text-[#746B80]">
                    Estilo visual
                  </div>
                  <div className="mt-2 text-sm font-bold text-white">
                    Moderno
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-4 transition-all duration-500 ${
                    phase === "tone" ||
                    phase === "clicking" ||
                    phase === "generating"
                      ? "border-[#7040FF]/60 bg-[#1B1230] shadow-[0_0_24px_rgba(112,64,255,0.08)]"
                      : "border-white/10 bg-[#100C18]"
                  }`}
                >
                  <div className="text-[10px] text-[#746B80]">
                    Tom de comunicação
                  </div>
                  <div className="mt-2 text-sm font-bold text-white">
                    Persuasivo
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`relative mt-4 flex h-[54px] w-full items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white transition-all duration-500 ${
                  phase === "clicking" || phase === "generating"
                    ? "scale-[0.985] bg-[#6330F3] shadow-[0_0_30px_rgba(111,60,255,0.35)]"
                    : "bg-gradient-to-r from-[#8259FF] to-[#6933F4]"
                }`}
              >
                {phase === "generating" ? (
                  <>
                    <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Criando sua landing page...
                  </>
                ) : (
                  <>
                    Gerar landing page
                    <span className="ml-1 text-[#D7C9FF]">✦</span>
                  </>
                )}

                {phase === "clicking" && (
                  <span className="absolute inset-0 animate-ping rounded-xl border border-white/50" />
                )}
              </button>
            </div>

            <div
              className={`absolute inset-5 transition-all duration-700 ${
                phase === "complete"
                  ? "translate-x-0 scale-100 opacity-100"
                  : "pointer-events-none translate-x-[12%] scale-[0.96] opacity-0"
              }`}
            >
              <div className="h-full overflow-hidden rounded-[20px] border border-white/10 bg-[#F6F1E8] shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
                <div className="flex h-10 items-center justify-between border-b border-black/5 bg-white/70 px-4">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-black/15" />
                    <span className="h-2 w-2 rounded-full bg-black/15" />
                    <span className="h-2 w-2 rounded-full bg-black/15" />
                  </div>

                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                    Página criada
                  </div>
                </div>

                <div className="px-7 py-6">
                  <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7544FF]">
                    Sua nova oferta
                  </div>

                  <div className="mt-3 max-w-[360px] text-[28px] font-black leading-[0.95] tracking-[-0.04em] text-[#100C18]">
                    Transforme sua ideia em uma página pronta para vender.
                  </div>

                  <div className="mt-4 max-w-[390px] text-[11px] leading-5 text-[#746C69]">
                    Uma estrutura moderna criada a partir das informações da
                    sua oferta, pronta para você personalizar.
                  </div>

                  <div className="mt-5 h-[88px] overflow-hidden rounded-2xl bg-gradient-to-r from-[#7140FF] via-[#8B65FF] to-[#C4B5FF] p-4">
                    <div className="h-2 w-24 rounded-full bg-white/45" />
                    <div className="mt-2 h-2 w-36 rounded-full bg-white/30" />
                    <div className="mt-5 h-6 w-24 rounded-lg bg-white/90" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showCursor && (
            <div
              className={`pointer-events-none absolute z-30 transition-all duration-700 ${
                cursorPositions[
                  phase as "typing" | "style" | "tone" | "clicking"
                ]
              }`}
            >
              <div className="relative">
                <svg
                  width="26"
                  height="32"
                  viewBox="0 0 26 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]"
                >
                  <path
                    d="M2 2L22 18L13.2 19.4L9 28L2 2Z"
                    fill="#FFFFFF"
                    stroke="#7544FF"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>

                {phase === "clicking" && (
                  <span className="absolute -left-3 -top-3 h-12 w-12 animate-ping rounded-full border border-[#A98BFF]/70" />
                )}
              </div>
            </div>
          )}

          <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {PHASES.map((item, index) => (
              <span
                key={item}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === phaseIndex
                    ? "w-5 bg-[#7444FF]"
                    : "w-1.5 bg-[#D5CDE3]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}