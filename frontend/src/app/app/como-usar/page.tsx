"use client";

import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";

type GuideMode = "cloner" | "generator";

type GuideStep = {
  number: string;
  title: string;
  text: string;
  action: string;
};

const clonerSteps: GuideStep[] = [
  {
    number: "01",
    title: "Cole a URL",
    text: "Abra o Clonador e cole no campo a URL da landing page que deseja transformar em um projeto editável.",
    action: "Cole a URL no campo indicado.",
  },
  {
    number: "02",
    title: "Clone a página",
    text: "Depois de informar a URL, clique em Clonar página. A PageNova começa a analisar e importar a landing page.",
    action: "Clique em Clonar página.",
  },
  {
    number: "03",
    title: "Selecione um elemento",
    text: "Dentro do editor, clique diretamente no texto, imagem ou botão que deseja alterar. O elemento fica destacado.",
    action: "Clique diretamente no elemento.",
  },
  {
    number: "04",
    title: "Edite diretamente",
    text: "Dê dois cliques rápidos em um texto para editar diretamente na página. Você também pode usar os controles do editor.",
    action: "Dê dois cliques e digite o novo texto.",
  },
  {
    number: "05",
    title: "Confira a responsividade",
    text: "Alterne entre Desktop, Tablet e Mobile para conferir a landing page em diferentes larguras.",
    action: "Clique em Desktop, Tablet ou Mobile.",
  },
  {
    number: "06",
    title: "Salve seu projeto",
    text: "Quando terminar, clique em Salvar. Depois você poderá abrir novamente o projeto em Minhas páginas.",
    action: "Clique em Salvar.",
  },
];

const generatorSteps: GuideStep[] = [
  {
    number: "01",
    title: "Abra o Gerador",
    text: "Entre no Gerador IA e inicie uma nova landing page para sua oferta.",
    action: "Comece um novo projeto.",
  },
  {
    number: "02",
    title: "Informe sua oferta",
    text: "Preencha os dados solicitados sobre produto, público, preço e oferta. Essas informações orientam a geração.",
    action: "Preencha os campos da oferta.",
  },
  {
    number: "03",
    title: "Gere a Landing Page",
    text: "Clique para gerar. A PageNova usa os dados preenchidos para construir a copy e a estrutura inicial.",
    action: "Clique em Gerar Landing Page.",
  },
  {
    number: "04",
    title: "Revise o resultado",
    text: "A landing page gerada aparece para revisão. Confira títulos, argumentos, imagens, seções e chamadas para ação.",
    action: "Revise a página gerada.",
  },
  {
    number: "05",
    title: "Personalize",
    text: "Abra o editor e personalize o conteúdo visualmente antes de finalizar seu projeto.",
    action: "Edite os elementos necessários.",
  },
  {
    number: "06",
    title: "Salve e continue",
    text: "Salve o projeto para encontrá-lo novamente em Minhas páginas e continuar a edição quando quiser.",
    action: "Clique em Salvar.",
  },
];

function Cursor({
  className,
  click = false,
}: {
  className: string;
  click?: boolean;
}) {
  return (
    <div
      className={`pointer-events-none absolute z-30 transition-all duration-700 ${className}`}
    >
      {click ? (
        <span className="absolute -left-3 -top-3 h-8 w-8 animate-ping rounded-full border border-violet-400/60" />
      ) : null}
      <svg
        width="24"
        height="28"
        viewBox="0 0 24 28"
        fill="none"
        className="drop-shadow-[0_3px_5px_rgba(0,0,0,.7)]"
      >
        <path
          d="M2 2L20 14H12L8 24L2 2Z"
          fill="#8b5cf6"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function BrowserShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#07070a] shadow-2xl shadow-black/40">
      <div className="flex h-10 items-center gap-2 border-b border-white/10 bg-[#0d0c12] px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <div className="ml-3 flex h-6 flex-1 items-center rounded-md border border-white/[0.06] bg-black/30 px-3 text-[9px] text-white/30">
          pagenova-ai.vercel.app
        </div>
      </div>
      {children}
    </div>
  );
}

function MiniSidebar({ active }: { active: "cloner" | "generator" | "pages" }) {
  const items = [
    ["Início", "home"],
    ["Clonador", "cloner"],
    ["Gerador", "generator"],
    ["Minhas páginas", "pages"],
  ];

  return (
    <div className="hidden w-[105px] shrink-0 border-r border-white/[0.07] bg-[#090713] p-3 sm:block">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600 text-[9px] font-black text-white">
          N
        </div>
        <span className="text-[8px] font-bold text-white">PageNova</span>
      </div>

      <div className="space-y-1.5">
        {items.map(([label, id]) => (
          <div
            key={id}
            className={`rounded-md px-2 py-2 text-[8px] ${
              active === id
                ? "border border-violet-500/30 bg-violet-500/15 text-white"
                : "text-white/30"
            }`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function ClonerDemo({ step }: { step: number }) {
  if (step <= 1) {
    return (
      <BrowserShell>
        <div className="relative flex min-h-[310px]">
          <MiniSidebar active="cloner" />

          <div className="relative flex-1 p-5 sm:p-7">
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-violet-400">
              Clonador
            </div>
            <div className="mt-1 text-lg font-bold text-white">
              Clone uma Landing Page
            </div>
            <div className="mt-1 text-[9px] text-white/35">
              Cole a URL da página que deseja editar.
            </div>

            <div className="mt-7">
              <div className="mb-2 text-[9px] font-semibold text-white/60">
                URL da Landing Page
              </div>

              <div
                className={`relative flex h-11 items-center rounded-lg border px-3 text-[10px] transition ${
                  step === 0
                    ? "border-violet-500 bg-violet-500/[0.06] shadow-[0_0_0_3px_rgba(139,92,246,.08)]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <span className={step === 0 ? "text-white/75" : "text-white/55"}>
                  https://allantorquato.com/
                </span>
                {step === 0 ? (
                  <span className="ml-0.5 h-4 w-px animate-pulse bg-violet-400" />
                ) : null}
              </div>

              <button
                type="button"
                className={`mt-3 h-10 w-full rounded-lg text-[10px] font-bold text-white transition ${
                  step === 1
                    ? "bg-violet-500 shadow-[0_0_25px_rgba(124,58,237,.35)]"
                    : "bg-violet-600"
                }`}
              >
                {step === 1 ? "Clonando página..." : "Clonar página"}
              </button>
            </div>

            {step === 0 ? (
              <>
                <Cursor className="left-[43%] top-[155px] animate-[tutorialCursor_2.4s_ease-in-out_infinite]" />
                <div className="absolute bottom-4 right-4 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-[8px] font-semibold text-violet-200">
                  1. Cole aqui
                </div>
              </>
            ) : (
              <>
                <Cursor
                  click
                  className="bottom-[63px] left-[58%] animate-[tutorialClick_1.8s_ease-in-out_infinite]"
                />
                <div className="absolute bottom-4 right-4 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-[8px] font-semibold text-violet-200">
                  2. Clique para clonar
                </div>
              </>
            )}
          </div>
        </div>
      </BrowserShell>
    );
  }

  if (step === 2 || step === 3) {
    return (
      <BrowserShell>
        <div className="relative min-h-[310px] bg-[#0a090e]">
          <div className="flex h-10 items-center justify-between border-b border-white/10 px-4">
            <div className="text-[9px] font-bold text-white">
              Editor PageNova
            </div>
            <div className="flex gap-1">
              <span className="rounded-md bg-violet-600 px-2 py-1 text-[7px] font-bold text-white">
                Desktop
              </span>
              <span className="rounded-md bg-white/[0.04] px-2 py-1 text-[7px] text-white/35">
                Tablet
              </span>
              <span className="rounded-md bg-white/[0.04] px-2 py-1 text-[7px] text-white/35">
                Mobile
              </span>
            </div>
          </div>

          <div className="flex min-h-[270px]">
            <div className="flex-1 bg-black p-5">
              <div className="mx-auto max-w-sm rounded-lg border border-white/10 bg-[#060606] px-5 py-7 text-center">
                <div className="mb-2 text-[7px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                  Sua nova oportunidade
                </div>

                <div
                  className={`relative mx-auto max-w-[260px] rounded px-2 py-1 text-[16px] font-black leading-tight text-white ${
                    step === 2
                      ? "outline outline-2 outline-violet-500"
                      : "outline outline-2 outline-emerald-400"
                  }`}
                >
                  {step === 3
                    ? "Transforme sua ideia em resultado"
                    : "Transforme sua ideia em vendas"}

                  {step === 3 ? (
                    <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-white align-middle" />
                  ) : null}
                </div>

                <div className="mx-auto mt-3 h-1.5 w-4/5 rounded-full bg-white/10" />
                <div className="mx-auto mt-1.5 h-1.5 w-3/5 rounded-full bg-white/[0.06]" />

                <div className="mx-auto mt-5 w-28 rounded-md bg-emerald-500 px-3 py-2 text-[8px] font-bold text-black">
                  QUERO COMEÇAR
                </div>
              </div>
            </div>

            <div className="hidden w-[130px] border-l border-white/10 bg-[#0d0c12] p-3 sm:block">
              <div className="text-[7px] font-bold uppercase tracking-[0.16em] text-violet-400">
                Elemento
              </div>
              <div className="mt-3 rounded-md border border-white/10 bg-white/[0.03] p-2 text-[7px] text-white/50">
                {step === 3 ? "Editando texto..." : "H1 selecionado"}
              </div>
              <div className="mt-2 h-7 rounded-md border border-white/10 bg-black/20" />
              <div className="mt-2 h-7 rounded-md border border-white/10 bg-black/20" />
            </div>
          </div>

          {step === 2 ? (
            <>
              <Cursor
                click
                className="left-[44%] top-[115px] animate-[tutorialClick_1.8s_ease-in-out_infinite]"
              />
              <div className="absolute bottom-3 left-3 rounded-full bg-violet-600 px-3 py-1.5 text-[8px] font-bold text-white">
                Clique no elemento
              </div>
            </>
          ) : (
            <>
              <Cursor
                click
                className="left-[49%] top-[116px] animate-[tutorialDoubleClick_1.5s_ease-in-out_infinite]"
              />
              <div className="absolute bottom-3 left-3 rounded-full bg-emerald-500 px-3 py-1.5 text-[8px] font-bold text-black">
                2 cliques → edite direto
              </div>
            </>
          )}
        </div>
      </BrowserShell>
    );
  }

  if (step === 4) {
    return (
      <BrowserShell>
        <div className="relative min-h-[310px] bg-[#0a090e] p-4">
          <div className="flex items-center justify-center gap-1.5">
            {["Desktop", "Tablet", "Mobile"].map((item, index) => (
              <div
                key={item}
                className={`rounded-md px-3 py-2 text-[8px] font-bold ${
                  index === 2
                    ? "bg-violet-600 text-white"
                    : "border border-white/10 bg-white/[0.03] text-white/40"
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-center">
            <div className="h-[205px] w-[145px] overflow-hidden rounded-xl border-4 border-white/10 bg-black shadow-2xl">
              <div className="h-4 border-b border-white/10 bg-[#111]" />
              <div className="p-3 text-center">
                <div className="mx-auto mt-3 h-2 w-14 rounded bg-violet-500/60" />
                <div className="mx-auto mt-3 text-[9px] font-black leading-tight text-white">
                  Transforme sua ideia em resultado
                </div>
                <div className="mx-auto mt-3 h-1 w-20 rounded bg-white/10" />
                <div className="mx-auto mt-1 h-1 w-16 rounded bg-white/[0.07]" />
                <div className="mx-auto mt-4 rounded bg-emerald-500 py-2 text-[6px] font-black text-black">
                  QUERO COMEÇAR
                </div>
              </div>
            </div>
          </div>

          <Cursor
            click
            className="left-[64%] top-[52px] animate-[tutorialClick_1.8s_ease-in-out_infinite]"
          />

          <div className="absolute bottom-3 right-3 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[8px] font-bold text-violet-200">
            Mobile selecionado
          </div>
        </div>
      </BrowserShell>
    );
  }

  return (
    <BrowserShell>
      <div className="relative flex min-h-[310px]">
        <MiniSidebar active="pages" />

        <div className="relative flex-1 p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] text-white/35">Projeto atual</div>
              <div className="mt-1 text-base font-bold text-white">
                Landing Page clonada
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg bg-violet-600 px-4 py-2 text-[9px] font-bold text-white shadow-[0_0_22px_rgba(124,58,237,.35)]"
            >
              Salvar
            </button>
          </div>

          <div className="mt-7 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
            <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15">
                ✓
              </span>
              Projeto salvo com sucesso
            </div>
            <div className="mt-2 text-[8px] text-white/35">
              Disponível em Minhas páginas
            </div>
          </div>

          <Cursor
            click
            className="right-[54px] top-[60px] animate-[tutorialClick_1.8s_ease-in-out_infinite]"
          />

          <div className="absolute bottom-4 right-4 rounded-full bg-violet-600 px-3 py-1.5 text-[8px] font-bold text-white">
            Clique em Salvar
          </div>
        </div>
      </div>
    </BrowserShell>
  );
}

function GeneratorDemo({ step }: { step: number }) {
  if (step === 0) {
    return (
      <BrowserShell>
        <div className="relative flex min-h-[310px]">
          <MiniSidebar active="generator" />
          <div className="relative flex-1 p-5 sm:p-7">
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-violet-400">
              Gerador IA
            </div>
            <div className="mt-1 text-lg font-bold text-white">
              Crie sua Landing Page
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-violet-500/40 bg-violet-500/10 p-4">
                <div className="text-[10px] font-bold text-white">
                  Produto físico
                </div>
                <div className="mt-2 text-[8px] leading-4 text-white/35">
                  Landing Page para produtos e ofertas.
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-[10px] font-bold text-white">
                  Produto digital
                </div>
                <div className="mt-2 text-[8px] leading-4 text-white/35">
                  Cursos, ebooks e infoprodutos.
                </div>
              </div>
            </div>
            <Cursor
              click
              className="left-[42%] top-[145px] animate-[tutorialClick_1.8s_ease-in-out_infinite]"
            />
            <div className="absolute bottom-4 right-4 rounded-full bg-violet-600 px-3 py-1.5 text-[8px] font-bold text-white">
              Escolha o tipo de oferta
            </div>
          </div>
        </div>
      </BrowserShell>
    );
  }

  if (step === 1) {
    return (
      <BrowserShell>
        <div className="relative flex min-h-[310px]">
          <MiniSidebar active="generator" />
          <div className="relative flex-1 p-5 sm:p-6">
            <div className="text-[12px] font-bold text-white">
              Dados da oferta
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                ["Nome do produto", "SmartWatch Pro"],
                ["Preço", "R$ 97,00"],
                ["Público", "Homens e mulheres 25+"],
                ["Categoria", "Tecnologia"],
              ].map(([label, value], index) => (
                <div key={label}>
                  <div className="mb-1 text-[7px] text-white/35">{label}</div>
                  <div
                    className={`flex h-8 items-center rounded-md border px-2 text-[8px] ${
                      index === 0
                        ? "border-violet-500 bg-violet-500/[0.05] text-white/80"
                        : "border-white/10 bg-white/[0.02] text-white/45"
                    }`}
                  >
                    {value}
                    {index === 0 ? (
                      <span className="ml-0.5 h-3 w-px animate-pulse bg-violet-400" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <div className="mb-1 text-[7px] text-white/35">
                Descrição da oferta
              </div>
              <div className="h-14 rounded-md border border-white/10 bg-white/[0.02] p-2 text-[8px] leading-4 text-white/40">
                Relógio inteligente com recursos para rotina, esporte e
                produtividade.
              </div>
            </div>

            <Cursor className="left-[38%] top-[100px] animate-[tutorialCursor_2.4s_ease-in-out_infinite]" />
          </div>
        </div>
      </BrowserShell>
    );
  }

  if (step === 2) {
    return (
      <BrowserShell>
        <div className="relative flex min-h-[310px]">
          <MiniSidebar active="generator" />
          <div className="relative flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-sm rounded-xl border border-violet-500/25 bg-violet-500/[0.05] p-5 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-lg">
                ✦
              </div>
              <div className="mt-3 text-[12px] font-bold text-white">
                Sua oferta está pronta
              </div>
              <div className="mt-1 text-[8px] text-white/35">
                A PageNova criará a estrutura e a copy.
              </div>
              <button
                type="button"
                className="mt-5 w-full rounded-lg bg-violet-600 py-3 text-[9px] font-bold text-white shadow-[0_0_28px_rgba(124,58,237,.3)]"
              >
                Gerar Landing Page
              </button>
            </div>

            <Cursor
              click
              className="bottom-[67px] left-[57%] animate-[tutorialClick_1.8s_ease-in-out_infinite]"
            />

            <div className="absolute bottom-3 right-3 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[8px] font-bold text-violet-200">
              IA começa a construir
            </div>
          </div>
        </div>
      </BrowserShell>
    );
  }

  if (step === 3) {
    return (
      <BrowserShell>
        <div className="relative min-h-[310px] bg-[#08080a] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[9px] font-bold text-white">
              Preview gerado
            </div>
            <div className="rounded-md border border-white/10 px-2 py-1 text-[7px] text-white/40">
              Revisar
            </div>
          </div>

          <div className="mx-auto max-w-md overflow-hidden rounded-lg border border-white/10 bg-black">
            <div className="bg-gradient-to-br from-violet-950/70 to-black px-6 py-7 text-center">
              <div className="text-[7px] font-bold uppercase tracking-[0.2em] text-violet-300">
                Tecnologia para sua rotina
              </div>
              <div className="mx-auto mt-2 max-w-xs text-[16px] font-black leading-tight text-white">
                Mais controle no seu pulso
              </div>
              <div className="mx-auto mt-3 h-1.5 w-4/5 rounded-full bg-white/10" />
              <div className="mx-auto mt-1.5 h-1.5 w-3/5 rounded-full bg-white/[0.06]" />
              <div className="mx-auto mt-4 w-32 rounded-md bg-violet-600 py-2 text-[7px] font-bold text-white">
                CONHECER AGORA
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-12 rounded-md border border-white/[0.06] bg-white/[0.025]"
                />
              ))}
            </div>
          </div>

          <Cursor className="right-[22%] top-[105px] animate-[tutorialCursor_2.4s_ease-in-out_infinite]" />
        </div>
      </BrowserShell>
    );
  }

  if (step === 4) {
    return (
      <BrowserShell>
        <div className="relative min-h-[310px] bg-[#0a090e]">
          <div className="flex h-10 items-center justify-between border-b border-white/10 px-4">
            <div className="text-[9px] font-bold text-white">
              Personalizar página
            </div>
            <div className="rounded-md bg-violet-600 px-3 py-1.5 text-[7px] font-bold text-white">
              Salvar
            </div>
          </div>

          <div className="flex min-h-[270px]">
            <div className="flex-1 bg-black p-5">
              <div className="mx-auto max-w-sm rounded-lg border border-white/10 bg-[#070707] px-5 py-8 text-center">
                <div className="text-[7px] uppercase tracking-[0.18em] text-violet-300">
                  SmartWatch Pro
                </div>
                <div className="relative mx-auto mt-2 max-w-[250px] rounded px-2 py-1 text-[15px] font-black text-white outline outline-2 outline-violet-500">
                  Mais controle no seu pulso
                </div>
                <div className="mx-auto mt-3 h-1.5 w-3/4 rounded bg-white/10" />
                <div className="mx-auto mt-5 w-28 rounded bg-violet-600 py-2 text-[7px] font-bold text-white">
                  COMPRAR AGORA
                </div>
              </div>
            </div>

            <div className="hidden w-[135px] border-l border-white/10 bg-[#0d0c12] p-3 sm:block">
              <div className="text-[7px] font-bold text-violet-400">
                TEXTO
              </div>
              <div className="mt-2 rounded border border-violet-500/30 bg-violet-500/[0.05] p-2 text-[7px] text-white/60">
                Mais controle no seu pulso
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1">
                <div className="h-6 rounded bg-white/[0.05]" />
                <div className="h-6 rounded bg-white/[0.05]" />
                <div className="h-6 rounded bg-violet-500/30" />
              </div>
            </div>
          </div>

          <Cursor
            click
            className="left-[45%] top-[116px] animate-[tutorialDoubleClick_1.5s_ease-in-out_infinite]"
          />
        </div>
      </BrowserShell>
    );
  }

  return (
    <BrowserShell>
      <div className="relative flex min-h-[310px]">
        <MiniSidebar active="pages" />
        <div className="relative flex-1 p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] text-white/35">
                Landing Page gerada
              </div>
              <div className="mt-1 text-base font-bold text-white">
                SmartWatch Pro
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg bg-violet-600 px-4 py-2 text-[9px] font-bold text-white"
            >
              Salvar
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] font-bold text-white">
                  SmartWatch Pro
                </div>
                <div className="mt-1 text-[7px] text-white/35">
                  Projeto salvo agora
                </div>
              </div>
              <div className="rounded-md border border-white/10 px-3 py-1.5 text-[7px] text-white/50">
                Continuar editando
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-[8px] font-semibold text-emerald-300">
            ✓ Projeto disponível em Minhas páginas
          </div>

          <Cursor
            click
            className="right-[54px] top-[60px] animate-[tutorialClick_1.8s_ease-in-out_infinite]"
          />
        </div>
      </div>
    </BrowserShell>
  );
}

function PracticalDemo({
  mode,
  step,
}: {
  mode: GuideMode;
  step: number;
}) {
  return mode === "cloner" ? (
    <ClonerDemo step={step} />
  ) : (
    <GeneratorDemo step={step} />
  );
}

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
        description="Veja na prática como usar cada ferramenta da PageNova."
      />

      <style jsx global>{`
        @keyframes tutorialCursor {
          0%,
          100% {
            transform: translate(-18px, 10px);
          }
          50% {
            transform: translate(18px, -5px);
          }
        }

        @keyframes tutorialClick {
          0%,
          100% {
            transform: translateY(4px) scale(1);
          }
          45% {
            transform: translateY(0) scale(1);
          }
          55% {
            transform: translateY(0) scale(0.88);
          }
          65% {
            transform: translateY(0) scale(1);
          }
        }

        @keyframes tutorialDoubleClick {
          0%,
          100% {
            transform: scale(1);
          }
          25% {
            transform: scale(0.86);
          }
          38% {
            transform: scale(1);
          }
          55% {
            transform: scale(0.86);
          }
          68% {
            transform: scale(1);
          }
        }
      `}</style>

      <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-7 md:py-10">
        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0c0b11]">
          <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.22),transparent_38%)] px-7 py-8 md:px-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-violet-400">
              Tutorial interativo
            </span>

            <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-white md:text-4xl">
              Aprenda vendo exatamente onde clicar.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              Escolha uma ferramenta e acompanhe o fluxo visual. Cada passo
              reproduz a ação que você fará dentro da PageNova.
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

          <div className="grid lg:grid-cols-[330px_minmax(0,1fr)]">
            <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
                  Passo a passo
                </span>
                <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[9px] font-bold text-violet-300">
                  {activeStep + 1}/{steps.length}
                </span>
              </div>

              <div className="space-y-2">
                {steps.map((step, index) => (
                  <button
                    key={`${mode}-${step.number}`}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className={`group flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                      activeStep === index
                        ? "border-violet-500/40 bg-violet-500/10"
                        : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ${
                        activeStep === index
                          ? "bg-violet-600 text-white"
                          : "bg-white/[0.05] text-white/35"
                      }`}
                    >
                      {step.number}
                    </div>

                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-white">
                        {step.title}
                      </div>
                      <div className="mt-1 truncate text-[11px] text-white/35">
                        {step.action}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-h-[650px] flex-col p-6 md:p-8 lg:p-10">
              <div key={`${mode}-${activeStep}`}>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 text-xs font-bold text-violet-300">
                    {steps[activeStep].number}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/30">
                    Passo {activeStep + 1} de {steps.length}
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-bold text-white md:text-3xl">
                  {steps[activeStep].title}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 md:text-base md:leading-7">
                  {steps[activeStep].text}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/[0.06] px-3 py-2 text-[11px] font-semibold text-violet-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/20 text-[9px]">
                    →
                  </span>
                  {steps[activeStep].action}
                </div>

                <div className="mt-7">
                  <PracticalDemo mode={mode} step={activeStep} />
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                <button
                  type="button"
                  disabled={activeStep === 0}
                  onClick={() =>
                    setActiveStep((value) => Math.max(0, value - 1))
                  }
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-25"
                >
                  ← Anterior
                </button>

                {activeStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveStep((value) =>
                        Math.min(steps.length - 1, value + 1),
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
                    {mode === "cloner"
                      ? "Abrir Clonador"
                      : "Abrir Gerador"}{" "}
                    →
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