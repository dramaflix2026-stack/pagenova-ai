"use client";

import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";

type GuideMode = "cloner" | "generator";

const clonerSteps = [
  {
    number: "01",
    title: "Cole a URL",
    text: "Abra o Clonador e cole a URL da landing page que deseja transformar em um projeto editável.",
    action: "URL da Landing Page",
    accent: "https://site.com/pagina",
  },
  {
    number: "02",
    title: "Clone a página",
    text: "Clique em Clonar página. A PageNova analisa a estrutura, o conteúdo e os elementos visuais da página.",
    action: "Clonar página",
    accent: "Analisando estrutura...",
  },
  {
    number: "03",
    title: "Selecione um elemento",
    text: "No editor, clique diretamente em um texto, imagem ou botão. O elemento selecionado será destacado.",
    action: "Clique no elemento",
    accent: "Elemento selecionado",
  },
  {
    number: "04",
    title: "Edite o conteúdo",
    text: "Altere textos, imagens e destinos de links. As modificações aparecem no preview da página.",
    action: "Aplicar alteração",
    accent: "Edição visual",
  },
  {
    number: "05",
    title: "Confira a responsividade",
    text: "Use Desktop, Tablet e Mobile para conferir como a página se comporta em diferentes telas.",
    action: "Desktop · Tablet · Mobile",
    accent: "Preview responsivo",
  },
  {
    number: "06",
    title: "Salve seu projeto",
    text: "Quando terminar, clique em Salvar. O projeto ficará disponível em Minhas páginas para continuar depois.",
    action: "Salvar",
    accent: "Projeto salvo",
  },
];

const generatorSteps = [
  {
    number: "01",
    title: "Abra o Gerador",
    text: "Entre no Gerador e escolha o tipo de produto ou oferta que será usado na landing page.",
    action: "Criar Landing Page",
    accent: "Novo projeto",
  },
  {
    number: "02",
    title: "Informe sua oferta",
    text: "Preencha nome, categoria, descrição, preço e os demais dados solicitados pela PageNova.",
    action: "Dados da oferta",
    accent: "Produto + público",
  },
  {
    number: "03",
    title: "Gere a estrutura",
    text: "A PageNova usa os dados informados para construir a copy e a estrutura inicial da landing page.",
    action: "Gerar Landing Page",
    accent: "IA trabalhando",
  },
  {
    number: "04",
    title: "Revise o resultado",
    text: "Confira títulos, argumentos, seções e chamadas para ação antes de finalizar seu projeto.",
    action: "Revisar",
    accent: "Preview da página",
  },
  {
    number: "05",
    title: "Personalize",
    text: "Ajuste os elementos necessários para deixar a página alinhada com sua oferta e identidade.",
    action: "Editar página",
    accent: "Personalização",
  },
  {
    number: "06",
    title: "Salve e continue",
    text: "Salve o projeto para acessá-lo novamente pela área Minhas páginas.",
    action: "Salvar",
    accent: "Projeto disponível",
  },
];

export default function ComoUsarPage() {
  const [mode, setMode] = useState<GuideMode>("cloner");
  const [activeStep, setActiveStep] = useState(0);

  const steps = mode === "cloner" ? clonerSteps : generatorSteps;

  function changeMode(next: GuideMode) {
    setMode(next);
    setActiveStep(0);
  }

  return (
    <div className="min-h-full">
      <AppHeader
        title="Como usar"
        description="Aprenda o fluxo da PageNova passo a passo."
      />

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0c0b11]">
          <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.22),transparent_38%)] px-7 py-8 md:px-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-violet-400">
              Central de ajuda
            </span>

            <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-white md:text-4xl">
              Da primeira página ao projeto salvo.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              Escolha uma ferramenta e acompanhe cada etapa. Clique nos passos
              para visualizar o que acontece em cada momento.
            </p>

            <div className="mt-7 inline-flex rounded-xl border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => changeMode("cloner")}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                  mode === "cloner"
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-950/40"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Clonador
              </button>

              <button
                type="button"
                onClick={() => changeMode("generator")}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                  mode === "generator"
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-950/40"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Gerador IA
              </button>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r lg:p-7">
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <button
                    key={`${mode}-${step.number}`}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                      activeStep === index
                        ? "border-violet-500/40 bg-violet-500/10"
                        : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition ${
                        activeStep === index
                          ? "bg-violet-600 text-white"
                          : "bg-white/[0.05] text-white/35 group-hover:text-white/70"
                      }`}
                    >
                      {step.number}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">
                        {step.title}
                      </div>
                      <div className="mt-1 truncate text-xs text-white/35">
                        {step.action}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-h-[520px] flex-col justify-between p-7 md:p-10">
              <div key={`${mode}-${activeStep}`} className="animate-[fadeIn_.25s_ease-out]">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 text-xs font-bold text-violet-300">
                    {steps[activeStep].number}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/30">
                    Passo {activeStep + 1} de {steps.length}
                  </span>
                </div>

                <h2 className="mt-7 text-3xl font-bold text-white">
                  {steps[activeStep].title}
                </h2>

                <p className="mt-4 max-w-xl text-base leading-7 text-white/55">
                  {steps[activeStep].text}
                </p>

                <div className="mt-9 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="ml-3 text-[10px] uppercase tracking-[0.18em] text-white/25">
                      PageNova AI
                    </span>
                  </div>

                  <div className="relative flex min-h-56 items-center justify-center overflow-hidden p-8">
                    <div className="absolute h-40 w-40 animate-pulse rounded-full bg-violet-600/10 blur-3xl" />

                    <div className="relative w-full max-w-md rounded-2xl border border-violet-500/25 bg-[#111017] p-5 shadow-2xl shadow-violet-950/20">
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-400">
                        {steps[activeStep].accent}
                      </div>

                      <div className="mt-4 h-2 w-3/4 rounded-full bg-white/10" />
                      <div className="mt-2 h-2 w-1/2 rounded-full bg-white/[0.06]" />

                      <div className="mt-6 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-center text-sm font-semibold text-violet-200">
                        {steps[activeStep].action}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                <button
                  type="button"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((value) => Math.max(0, value - 1))}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-25"
                >
                  ← Anterior
                </button>

                {activeStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveStep((value) =>
                        Math.min(steps.length - 1, value + 1)
                      )
                    }
                    className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                  >
                    Próximo passo →
                  </button>
                ) : (
                  <Link
                    href={mode === "cloner" ? "/app/cloner" : "/app/gerador"}
                    className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                  >
                    {mode === "cloner" ? "Abrir Clonador" : "Abrir Gerador"} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}