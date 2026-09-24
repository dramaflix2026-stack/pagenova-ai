"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEMO_URL = "https://minhaoferta.com";

type DemoPhase =
  | "typing"
  | "ready"
  | "clicking"
  | "analyzing"
  | "preview"
  | "editing"
  | "saving"
  | "saved";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export function PageNovaProductDemo() {
  const [phase, setPhase] = useState<DemoPhase>("typing");
  const [typedUrl, setTypedUrl] = useState("");
  const [headline, setHeadline] = useState("Transforme sua ideia em uma oferta.");
  const [runId, setRunId] = useState(0);

  const runRef = useRef(0);

  const replay = useCallback(() => {
    runRef.current += 1;
    setRunId(runRef.current);
  }, []);

  useEffect(() => {
    const currentRun = runId;
    let cancelled = false;

    const alive = () => !cancelled && currentRun === runRef.current;

    async function runDemo() {
      setPhase("typing");
      setTypedUrl("");
      setHeadline("Transforme sua ideia em uma oferta.");

      await sleep(550);
      if (!alive()) return;

      for (let index = 1; index <= DEMO_URL.length; index += 1) {
        setTypedUrl(DEMO_URL.slice(0, index));
        await sleep(55);
        if (!alive()) return;
      }

      setPhase("ready");
      await sleep(650);
      if (!alive()) return;

      setPhase("clicking");
      await sleep(420);
      if (!alive()) return;

      setPhase("analyzing");
      await sleep(1500);
      if (!alive()) return;

      setPhase("preview");
      await sleep(1700);
      if (!alive()) return;

      setPhase("editing");
      await sleep(700);
      if (!alive()) return;

      const finalHeadline = "Sua próxima grande oferta começa aqui.";
      setHeadline("");

      for (let index = 1; index <= finalHeadline.length; index += 1) {
        setHeadline(finalHeadline.slice(0, index));
        await sleep(38);
        if (!alive()) return;
      }

      await sleep(850);
      if (!alive()) return;

      setPhase("saving");
      await sleep(900);
      if (!alive()) return;

      setPhase("saved");

      await sleep(2600);
      if (!alive()) return;

      replay();
    }

    void runDemo();

    return () => {
      cancelled = true;
    };
  }, [runId, replay]);

  const hasPreview =
    phase === "preview" ||
    phase === "editing" ||
    phase === "saving" ||
    phase === "saved";

  const isEditing = phase === "editing";
  const isSaving = phase === "saving";
  const isSaved = phase === "saved";
  const isAnalyzing = phase === "analyzing";

  return (
    <div className="relative">
      {/* PAGENOVA_LP_A4_INTERACTIVE_DEMO */}
      {/* PAGENOVA_F5_3_LIVE_CURSOR */}

      <div
        aria-hidden="true"
        className={`pagenova-demo-cursor ${
          phase === "clicking"
            ? "pagenova-demo-cursor--clone"
            : phase === "preview"
              ? "pagenova-demo-cursor--headline"
              : phase === "editing"
                ? "pagenova-demo-cursor--editing"
                : phase === "saving"
                  ? "pagenova-demo-cursor--save"
                  : phase === "saved"
                    ? "pagenova-demo-cursor--saved"
                    : "pagenova-demo-cursor--hidden"
        }`}
      >
        <span className="pagenova-demo-cursor-pointer">➤</span>

        <span
          className={`pagenova-demo-click-ring ${
            phase === "clicking" ||
            phase === "preview" ||
            phase === "saving"
              ? "pagenova-demo-click-ring--active"
              : ""
          }`}
        />
      </div>

      <div className="absolute -right-1 top-[-54px] z-20">
        <button
          type="button"
          onClick={replay}
          className="rounded-full border border-white/[0.1] bg-[#100B1D]/90 px-4 py-2 text-[10px] font-bold text-white/55 backdrop-blur-xl transition hover:border-violet-400/30 hover:text-white"
        >
          ↻ Ver demonstração
        </button>
      </div>

      <div className="relative overflow-hidden rounded-[30px] border border-white/[0.12] bg-[#0C0913] p-2 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="overflow-hidden rounded-[23px] border border-white/[0.07] bg-[#0A0A0A]">
          <div className="flex h-12 items-center gap-2 border-b border-white/[0.07] px-5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />

            <div className="mx-auto flex h-7 w-[48%] max-w-md items-center rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-left text-[10px] text-white/25">
              app.pagenova.ai/clonador
            </div>
          </div>

          <div className="grid min-h-[480px] md:grid-cols-[190px_1fr]">
            <div className="hidden border-r border-white/[0.07] bg-[#090613] p-4 text-left md:block">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#865FFF] to-[#5B2EEB] text-sm font-black text-white">
                  N
                </div>

                <div>
                  <div className="text-xs font-bold text-white">
                    PageNova
                    <span className="ml-1 text-[8px] text-violet-400">AI</span>
                  </div>
                  <div className="mt-0.5 text-[7px] uppercase tracking-[0.16em] text-white/20">
                    Landing Page Studio
                  </div>
                </div>
              </div>

              <div className="mt-10 space-y-2">
                {["Início", "Clonador", "Gerador", "Minhas páginas"].map(
                  (item, index) => (
                    <div
                      key={item}
                      className={`rounded-xl px-3 py-3 text-xs transition-all duration-500 ${
                        index === 1
                          ? "border border-violet-400/20 bg-violet-500/[0.12] text-white"
                          : "text-white/30"
                      }`}
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="relative overflow-hidden p-6 text-left md:p-9">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-white">
                    {hasPreview ? "Editor visual" : "Clonar Landing Page"}
                  </p>

                  <p className="mt-1 text-[10px] text-white/30">
                    {hasPreview
                      ? "Personalize sua página em tempo real."
                      : "Cole uma URL para começar."}
                  </p>
                </div>

                {!hasPreview ? (
                  <div
                    className={`relative rounded-lg px-4 py-2 text-[10px] font-bold transition-all duration-300 ${
                      phase === "clicking"
                        ? "scale-95 bg-violet-400 text-white shadow-[0_0_35px_rgba(139,92,246,0.65)]"
                        : "bg-violet-600 text-white"
                    }`}
                  >
                    {isAnalyzing ? "Analisando..." : "Clonar página"}

                    {phase === "clicking" && (
                      <span className="absolute -bottom-4 -right-3 text-lg drop-shadow-lg">
                        ↖
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className={`rounded-lg px-4 py-2 text-[10px] font-bold transition-all duration-300 ${
                      isSaved
                        ? "bg-emerald-500 text-black"
                        : "bg-violet-600 text-white"
                    }`}
                  >
                    {isSaving
                      ? "Salvando..."
                      : isSaved
                        ? "✓ Projeto salvo"
                        : "Salvar"}
                  </div>
                )}
              </div>

              {!hasPreview ? (
                <>
                  <div className="mt-8 rounded-2xl border border-white/[0.08] bg-[#100D17] p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                      URL da landing page
                    </p>

                    <div
                      className={`mt-3 flex min-h-12 items-center rounded-xl border bg-black/20 px-4 text-xs transition-all duration-300 ${
                        phase === "ready" ||
                        phase === "clicking" ||
                        phase === "analyzing"
                          ? "border-violet-400/40 text-white/70 shadow-[0_0_25px_rgba(124,58,237,0.08)]"
                          : "border-violet-400/20 text-white/45"
                      }`}
                    >
                      <span>{typedUrl}</span>

                      {phase === "typing" && (
                        <span className="ml-0.5 h-4 w-px animate-pulse bg-violet-400" />
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {[
                      ["01", "Clone"],
                      ["02", "Edite"],
                      ["03", "Salve"],
                    ].map(([number, label], index) => {
                      const active =
                        (index === 0 &&
                          ["typing", "ready", "clicking", "analyzing"].includes(
                            phase,
                          )) ||
                        (index === 1 && phase === "analyzing") ||
                        (index === 2 &&
                          ["saving", "saved"].includes(phase));

                      return (
                        <div
                          key={number}
                          className={`rounded-2xl border p-5 transition-all duration-500 ${
                            active
                              ? "border-violet-400/25 bg-violet-500/[0.07]"
                              : "border-white/[0.07] bg-white/[0.025]"
                          }`}
                        >
                          <span className="text-[10px] font-bold text-violet-400">
                            {number}
                          </span>

                          <p className="mt-8 text-sm font-semibold">{label}</p>

                          <div className="mt-2 h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className={`h-full rounded-full bg-violet-500 transition-all duration-700 ${
                                active ? "w-full" : "w-1/3 opacity-40"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-[1.35fr_0.65fr]">
                    <div className="relative h-28 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-violet-500/[0.08] to-transparent">
                      {isAnalyzing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-violet-400/20 border-t-violet-400" />
                            <p className="mt-3 text-[9px] font-semibold text-white/40">
                              Lendo estrutura da página...
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="h-28 rounded-2xl border border-white/[0.07] bg-white/[0.02]" />
                  </div>
                </>
              ) : (
                <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_210px]">
                  <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#F5EFE4] p-5 text-[#17121F]">
                    <div className="mb-5 flex items-center justify-between border-b border-black/[0.07] pb-3">
                      <div className="h-2.5 w-20 rounded-full bg-black/10" />
                      <div className="flex gap-3">
                        <div className="h-2 w-10 rounded-full bg-black/10" />
                        <div className="h-2 w-10 rounded-full bg-black/10" />
                      </div>
                    </div>

                    <div className="grid min-h-[285px] items-center gap-5 sm:grid-cols-[1.1fr_0.9fr]">
                      <div>
                        <div className="mb-3 inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-[7px] font-black uppercase tracking-wider text-orange-600">
                          Nova oferta
                        </div>

                        <div
                          className={`relative rounded-lg p-1 transition-all duration-500 ${
                            isEditing
                              ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-[#F5EFE4]"
                              : ""
                          }`}
                        >
                          <h3 className="max-w-[330px] text-2xl font-black leading-[0.95] tracking-[-0.04em] sm:text-3xl">
                            {headline}
                            {isEditing && (
                              <span className="ml-0.5 inline-block h-6 w-[2px] animate-pulse bg-violet-600 align-middle" />
                            )}
                          </h3>

                          {isEditing && (
                            <span className="absolute -right-2 -top-3 rounded-md bg-violet-600 px-2 py-1 text-[7px] font-bold text-white shadow-lg">
                              Editando texto
                            </span>
                          )}
                        </div>

                        <p className="mt-4 max-w-[280px] text-[9px] leading-4 text-black/45">
                          Uma estrutura clara, objetiva e pronta para apresentar
                          sua oferta.
                        </p>

                        <div className="mt-5 inline-flex rounded-lg bg-[#17121F] px-4 py-2 text-[8px] font-bold text-white">
                          Quero conhecer →
                        </div>
                      </div>

                      <div className="relative min-h-[190px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#DCCFFF] via-[#B89AFF] to-[#7950F2]">
                        <div className="absolute left-5 top-5 h-16 w-16 rounded-full bg-white/20 blur-xl" />
                        <div className="absolute bottom-[-30px] right-[-15px] h-40 w-40 rounded-full bg-[#2E145F]/25" />

                        <div className="absolute inset-x-6 bottom-6 rounded-xl border border-white/20 bg-white/15 p-4 backdrop-blur-sm">
                          <div className="h-2 w-16 rounded-full bg-white/60" />
                          <div className="mt-2 h-2 w-24 rounded-full bg-white/25" />
                          <div className="mt-4 h-7 w-20 rounded-lg bg-white/80" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#100D17] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/30">
                      Editar elemento
                    </p>

                    <div
                      className={`mt-4 rounded-xl border p-3 transition-all duration-500 ${
                        isEditing
                          ? "border-violet-400/40 bg-violet-500/[0.08]"
                          : "border-white/[0.07] bg-black/15"
                      }`}
                    >
                      <p className="text-[8px] text-white/25">Texto</p>
                      <p className="mt-2 text-[9px] leading-4 text-white/65">
                        {headline}
                      </p>
                    </div>

                    <div className="mt-3 rounded-xl border border-white/[0.07] bg-black/15 p-3">
                      <p className="text-[8px] text-white/25">Imagem</p>
                      <div className="mt-2 h-7 rounded-lg bg-white/[0.04]" />
                    </div>

                    <div className="mt-3 rounded-xl border border-white/[0.07] bg-black/15 p-3">
                      <p className="text-[8px] text-white/25">Link / CTA</p>
                      <div className="mt-2 h-7 rounded-lg bg-white/[0.04]" />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isSaved
                            ? "bg-emerald-400"
                            : isSaving
                              ? "animate-pulse bg-amber-400"
                              : "bg-violet-400"
                        }`}
                      />

                      <span className="text-[8px] font-medium text-white/35">
                        {isSaved
                          ? "Alterações salvas"
                          : isSaving
                            ? "Salvando projeto..."
                            : isEditing
                              ? "Alteração em tempo real"
                              : "Página clonada"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute bottom-3 right-4 rounded-full border border-white/[0.07] bg-black/25 px-3 py-1.5 text-[8px] font-medium text-white/25 backdrop-blur-md">
                {phase === "typing" && "Digitando URL"}
                {phase === "ready" && "URL pronta"}
                {phase === "clicking" && "Clonando"}
                {phase === "analyzing" && "Analisando página"}
                {phase === "preview" && "Clone concluído"}
                {phase === "editing" && "Editando"}
                {phase === "saving" && "Salvando"}
                {phase === "saved" && "Pronto ✓"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}