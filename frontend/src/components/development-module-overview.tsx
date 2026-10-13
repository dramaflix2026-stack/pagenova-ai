import Link from "next/link";
import { ArrowLeft, ArrowRight, Blocks, CheckCircle2, Clock3, Smartphone, Sparkles } from "lucide-react";

type ModuleKind = "apps" | "systems";

export function DevelopmentModuleOverview({ kind }: { kind: ModuleKind }) {
  const isApp = kind === "apps";
  const title = isApp ? "Desenvolver Aplicativos" : "Desenvolver Sistemas";
  const description = isApp
    ? "Um espaço dedicado à criação de aplicativos a partir de uma ideia."
    : "Um espaço dedicado a sistemas personalizados para empresas e operações.";
  const examples = isApp
    ? ["Aplicativos para clientes", "Agendamentos e serviços", "Portais e experiências mobile"]
    : ["Painéis administrativos", "Gestão de processos", "Plataformas e ferramentas internas"];

  return (
    <main className="relative isolate min-h-[calc(100svh-64px)] overflow-hidden bg-[#090c11] px-4 py-10 text-white sm:px-6 sm:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_12%,rgba(16,185,129,0.13),transparent_58%)]" />
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/app/builder" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/65 transition hover:border-emerald-400/25 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Voltar ao PageNova Studio
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/[0.07] px-3 py-1.5 text-xs font-semibold text-amber-200">
            <Clock3 className="h-3.5 w-3.5" /> Em desenvolvimento
          </span>
        </header>

        <section className="mx-auto mt-12 flex max-w-2xl flex-col items-center text-center sm:mt-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.09] text-emerald-300 shadow-[0_0_50px_rgba(16,185,129,.08)]">
            {isApp ? <Smartphone className="h-8 w-8" strokeWidth={1.65}/> : <Blocks className="h-8 w-8" strokeWidth={1.65}/>}
          </div>
          <p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-emerald-300">
            PageNova AI · Desenvolvimento
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">{description}</p>
          <div className="mt-7 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-5 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-white/90">
              <Sparkles className="h-4 w-4 text-emerald-300"/> Novo módulo em preparação
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/50">
              A aba já está disponível no menu, mas a criação de {isApp ? "aplicativos" : "sistemas"} ainda não foi liberada. Nenhuma geração ou cobrança acontece nesta tela.
            </p>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-3xl rounded-[26px] border border-white/10 bg-[#11151b] p-5 sm:p-7">
          <h2 className="text-center text-sm font-bold uppercase tracking-[.13em] text-white/65">
            Exemplos para este espaço
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {examples.map(example=>(
              <div key={example} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-4 text-sm text-white/75">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300/75"/>
                <span>{example}</span>
              </div>
            ))}
          </div>
        </section>

        <nav aria-label="Outras ferramentas" className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={isApp ? "/app/sistemas" : "/app/aplicativos"}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-emerald-400/30 hover:text-white">
            {isApp ? "Desenvolver Sistemas" : "Desenvolver Aplicativos"} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/app/builder"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#04261a] transition hover:bg-emerald-300">
            Gerar Site com IA <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </main>
  );
}
