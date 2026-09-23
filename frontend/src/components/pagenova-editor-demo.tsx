"use client";

import { useEffect, useState } from "react";

type DemoPhase =
  | "idle"
  | "select-title"
  | "edit-title"
  | "select-image"
  | "edit-image"
  | "select-link"
  | "edit-link"
  | "saving"
  | "saved";

const phases: DemoPhase[] = [
  "idle",
  "select-title",
  "edit-title",
  "select-image",
  "edit-image",
  "select-link",
  "edit-link",
  "saving",
  "saved",
];

function isPhase(
  phase: DemoPhase,
  values: DemoPhase[],
) {
  return values.includes(phase);
}

export function PageNovaEditorDemo() {
  const [phaseIndex, setPhaseIndex] = useState(0);

  const phase = phases[phaseIndex];

  useEffect(() => {
    const duration =
      phase === "saved"
        ? 1800
        : phase === "idle"
          ? 900
          : 1250;

    const timer = window.setTimeout(() => {
      setPhaseIndex((current) => (current + 1) % phases.length);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [phase]);

  const titleSelected = isPhase(phase, [
    "select-title",
    "edit-title",
  ]);

  const imageSelected = isPhase(phase, [
    "select-image",
    "edit-image",
  ]);

  const linkSelected = isPhase(phase, [
    "select-link",
    "edit-link",
  ]);

  const editedTitle =
    phaseIndex >= phases.indexOf("edit-title");

  const editedImage =
    phaseIndex >= phases.indexOf("edit-image");

  const editedLink =
    phaseIndex >= phases.indexOf("edit-link");

  const cursorPositions: Record<
    DemoPhase,
    { left: string; top: string }
  > = {
    idle: {
      left: "48%",
      top: "74%",
    },
    "select-title": {
      left: "35%",
      top: "38%",
    },
    "edit-title": {
      left: "84%",
      top: "31%",
    },
    "select-image": {
      left: "25%",
      top: "61%",
    },
    "edit-image": {
      left: "84%",
      top: "43%",
    },
    "select-link": {
      left: "36%",
      top: "77%",
    },
    "edit-link": {
      left: "84%",
      top: "55%",
    },
    saving: {
      left: "91%",
      top: "5%",
    },
    saved: {
      left: "91%",
      top: "5%",
    },
  };

  const cursor = cursorPositions[phase];

  return (
    <div
      data-pagenova-editor-demo
      className="relative rounded-[30px] border border-[#DDD6EC] bg-[#ECE8F7] p-4 shadow-[0_30px_80px_rgba(54,39,92,0.12)] md:p-7"
    >
      <div className="pointer-events-none absolute inset-x-[15%] bottom-[-8%] h-28 rounded-full bg-violet-500/15 blur-[55px]" />

      <div className="relative overflow-hidden rounded-[22px] border border-black/10 bg-[#0B0A0D] shadow-2xl">
        <div className="flex h-11 items-center justify-between border-b border-white/[0.08] px-4">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/10" />
            <span className="h-2 w-2 rounded-full bg-white/10" />
          </div>

          <span className="text-[9px] font-bold tracking-[0.08em] text-white/40">
            PAGENOVA EDITOR
          </span>

          <div
            className={[
              "min-w-[58px] rounded-md px-3 py-1.5 text-center text-[8px] font-bold text-white transition-all duration-500",
              phase === "saving"
                ? "scale-[0.97] bg-violet-400 shadow-[0_0_22px_rgba(139,92,246,0.7)]"
                : phase === "saved"
                  ? "bg-emerald-500 shadow-[0_0_22px_rgba(16,185,129,0.35)]"
                  : "bg-violet-600",
            ].join(" ")}
          >
            {phase === "saving"
              ? "Salvando..."
              : phase === "saved"
                ? "Salvo ✓"
                : "Salvar"}
          </div>
        </div>

        <div className="relative grid min-h-[390px] grid-cols-[1fr_120px] sm:grid-cols-[1fr_180px]">
          <div className="relative flex items-center justify-center overflow-hidden bg-[#F2E8D9] p-5">
            <div className="pointer-events-none absolute left-[15%] top-[14%] h-44 w-44 rounded-full bg-orange-200/20 blur-3xl" />

            <div className="relative w-full max-w-md rounded-2xl bg-[#F8F0E5] p-7 text-[#161616] shadow-xl">
              <span className="text-[9px] font-bold uppercase tracking-widest text-orange-600">
                Nova oferta
              </span>

              <div
                className={[
                  "relative mt-3 rounded-lg transition-all duration-500",
                  titleSelected
                    ? "ring-2 ring-violet-500 ring-offset-4 ring-offset-[#F8F0E5]"
                    : "",
                ].join(" ")}
              >
                {titleSelected && (
                  <span className="absolute -top-7 left-0 rounded-md bg-violet-600 px-2 py-1 text-[7px] font-bold text-white shadow-lg">
                    Texto
                  </span>
                )}

                <h3 className="max-w-xs text-3xl font-black leading-[0.95] tracking-[-0.05em] transition-all duration-500">
                  {editedTitle
                    ? "Sua próxima landing page começa aqui."
                    : "Uma landing page pronta para sua ideia."}
                </h3>
              </div>

              <div
                className={[
                  "relative mt-5 overflow-hidden rounded-xl transition-all duration-500",
                  imageSelected
                    ? "ring-2 ring-violet-500 ring-offset-4 ring-offset-[#F8F0E5]"
                    : "",
                ].join(" ")}
              >
                {imageSelected && (
                  <span className="absolute left-2 top-2 z-20 rounded-md bg-violet-600 px-2 py-1 text-[7px] font-bold text-white shadow-lg">
                    Imagem
                  </span>
                )}

                <div
                  className={[
                    "relative h-20 overflow-hidden transition-all duration-700",
                    editedImage
                      ? "bg-gradient-to-br from-[#6D3CF4] via-[#8C63FF] to-[#D8C8FF]"
                      : "bg-gradient-to-br from-[#E8D8C4] via-[#D9C2A5] to-[#B89978]",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "absolute rounded-full transition-all duration-700",
                      editedImage
                        ? "left-[58%] top-[-18px] h-24 w-24 bg-white/20"
                        : "left-[62%] top-3 h-14 w-14 bg-white/25",
                    ].join(" ")}
                  />

                  <div
                    className={[
                      "absolute transition-all duration-700",
                      editedImage
                        ? "bottom-3 left-4 h-2 w-28 rounded-full bg-white/45"
                        : "bottom-3 left-4 h-2 w-20 rounded-full bg-black/10",
                    ].join(" ")}
                  />

                  <div
                    className={[
                      "absolute bottom-7 left-4 h-2 rounded-full transition-all duration-700",
                      editedImage
                        ? "w-20 bg-white/30"
                        : "w-28 bg-black/10",
                    ].join(" ")}
                  />
                </div>
              </div>

              <p className="mt-4 max-w-xs text-xs leading-5 text-black/50">
                Personalize conteúdo, imagens e chamadas diretamente no editor.
              </p>

              <div
                className={[
                  "relative mt-5 inline-flex rounded-lg px-4 py-2.5 text-[9px] font-bold text-white transition-all duration-500",
                  editedLink
                    ? "bg-violet-600 shadow-[0_8px_22px_rgba(109,60,244,0.28)]"
                    : "bg-black",
                  linkSelected
                    ? "ring-2 ring-violet-500 ring-offset-4 ring-offset-[#F8F0E5]"
                    : "",
                ].join(" ")}
              >
                {linkSelected && (
                  <span className="absolute -top-7 left-0 rounded-md bg-violet-600 px-2 py-1 text-[7px] font-bold text-white shadow-lg">
                    Link / CTA
                  </span>
                )}

                {editedLink
                  ? "Criar minha página →"
                  : "Quero conhecer"}
              </div>
            </div>
          </div>

          <div className="border-l border-white/[0.07] bg-[#0D0B12] p-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold text-white/55">
                Editar elemento
              </p>

              <span
                className={[
                  "h-1.5 w-1.5 rounded-full transition-all duration-300",
                  phase === "idle"
                    ? "bg-white/15"
                    : "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]",
                ].join(" ")}
              />
            </div>

            <div className="mt-4 space-y-2">
              {[
                ["Texto", titleSelected],
                ["Imagem", imageSelected],
                ["Link", linkSelected],
                ["Elemento", false],
              ].map(([item, active]) => (
                <div
                  key={String(item)}
                  className={[
                    "relative overflow-hidden rounded-lg border px-3 py-2.5 text-[8px] transition-all duration-500",
                    active
                      ? "border-violet-400/60 bg-violet-500/15 text-violet-200 shadow-[0_0_18px_rgba(124,58,237,0.15)]"
                      : "border-white/[0.07] bg-white/[0.025] text-white/35",
                  ].join(" ")}
                >
                  {String(item)}

                  {active && (
                    <span className="absolute inset-y-0 left-0 w-[2px] bg-violet-400" />
                  )}
                </div>
              ))}
            </div>

            <div
              className={[
                "mt-4 rounded-lg border border-white/[0.07] bg-black/20 p-3 transition-all duration-500",
                phase === "edit-title" ||
                phase === "edit-image" ||
                phase === "edit-link"
                  ? "opacity-100"
                  : "opacity-30",
              ].join(" ")}
            >
              <div className="h-1.5 w-10 rounded-full bg-white/10" />
              <div className="mt-2 h-7 rounded-md border border-white/[0.07] bg-white/[0.03]" />
            </div>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-50 transition-all duration-700 ease-in-out"
            style={{
              left: cursor.left,
              top: cursor.top,
            }}
          >
            <div className="relative">
              <div
                className={[
                  "absolute -left-3 -top-3 h-8 w-8 rounded-full border transition-all duration-300",
                  phase === "idle" || phase === "saved"
                    ? "scale-50 border-transparent opacity-0"
                    : "scale-100 border-violet-300/40 bg-violet-400/10 opacity-100",
                ].join(" ")}
              />

              <svg
                width="18"
                height="22"
                viewBox="0 0 18 22"
                fill="none"
                className="relative drop-shadow-[0_3px_5px_rgba(0,0,0,0.35)]"
              >
                <path
                  d="M2 1.5L16 12.4L9.7 13.6L6.4 20.2L2 1.5Z"
                  fill="white"
                  stroke="#5B32D6"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {phase === "saved" && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-emerald-400/20 bg-[#101913]/95 px-4 py-2 text-[8px] font-bold text-emerald-300 shadow-xl">
              ✓ Alterações salvas
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {phases.map((item, index) => (
          <span
            key={item}
            className={[
              "h-1 rounded-full transition-all duration-500",
              index === phaseIndex
                ? "w-5 bg-violet-500"
                : "w-1 bg-[#CFC6E1]",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}