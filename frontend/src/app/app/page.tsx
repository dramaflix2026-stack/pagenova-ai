import Link from "next/link";
import { AppHeader } from "@/components/app-header";

export default function AppPage() {
  return (
    <>
      <AppHeader
        title="Início"
        description="Seu workspace de landing pages."
      />

      <main className="relative mx-auto max-w-7xl overflow-hidden px-6 py-10 lg:px-10">
        <div className="pointer-events-none absolute -right-48 -top-40 h-[420px] w-[420px] rounded-full bg-violet-600/[0.08] blur-[110px]" />
        <div className="pointer-events-none absolute left-1/3 top-28 h-72 w-72 rounded-full bg-fuchsia-500/[0.025] blur-[100px]" />

        <section className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/[0.07] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">
              PageNova AI
            </span>
          </div>

          <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-[-0.045em] text-white md:text-5xl">
            Sua próxima landing page
            <span className="block bg-gradient-to-r from-[#B8A7FF] via-[#8B5CFF] to-[#6C3BFF] bg-clip-text text-transparent">
              começa aqui.
            </span>
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/45">
            Clone uma página existente ou crie uma nova estrutura com a
            PageNova. Simples, rápido e sem complicação.
          </p>
        </section>

        <section className="relative mt-10 grid gap-5 md:grid-cols-2">
          <Link
            href="/app/cloner"
            className="group relative overflow-hidden rounded-[28px] border border-violet-400/20 bg-[#100B1D] p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-[#130D24]"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-violet-600/[0.13] blur-[70px] transition group-hover:bg-violet-600/[0.18]" />

            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-gradient-to-br from-[#8B5CFF] to-[#5A31E8] text-xl font-black text-white shadow-[0_10px_35px_rgba(108,59,255,0.2)]">
              ◇
            </div>

            <div className="relative mt-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-400">
                Clone
              </p>

              <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-white">
                Clonar Landing Page
              </h3>

              <p className="mt-3 max-w-md leading-7 text-white/40">
                Cole a URL de uma landing page e transforme sua estrutura
                em um projeto totalmente editável.
              </p>

              <div className="mt-8 flex items-center gap-2 font-semibold text-violet-300">
                Abrir clonador
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/app/gerador"
            className="group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0E0B17] p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/25 hover:bg-[#120D20]"
          >
            <div className="pointer-events-none absolute -right-20 -bottom-24 h-56 w-56 rounded-full bg-fuchsia-500/[0.06] blur-[80px]" />

            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.09] bg-white/[0.04] text-xl text-violet-200">
              ✦
            </div>

            <div className="relative mt-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
                Create
              </p>

              <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-white">
                Criar Landing Page
              </h3>

              <p className="mt-3 max-w-md leading-7 text-white/40">
                Informe os dados principais da sua oferta e transforme sua
                ideia em uma nova landing page.
              </p>

              <div className="mt-8 flex items-center gap-2 font-semibold text-white/75">
                Abrir gerador
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </div>
            </div>
          </Link>
        </section>

        <section className="relative mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
                Workspace
              </p>

              <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-white">
                Minhas páginas
              </h3>

              <p className="mt-1 text-sm text-white/35">
                Acesse e continue trabalhando nos seus projetos.
              </p>
            </div>

            <Link
              href="/app/paginas"
              className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2 text-sm font-medium text-white/55 transition hover:border-violet-400/25 hover:bg-violet-500/[0.06] hover:text-white"
            >
              Ver todas →
            </Link>
          </div>

          <div className="mt-5 flex min-h-48 items-center justify-center rounded-[28px] border border-dashed border-white/[0.09] bg-white/[0.015] p-8 text-center">
            <div>
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-violet-300">
                +
              </div>

              <p className="mt-4 font-medium text-white/65">
                Seus projetos ficam aqui
              </p>

              <p className="mt-1 text-sm text-white/25">
                Clone ou crie uma landing page para começar.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}