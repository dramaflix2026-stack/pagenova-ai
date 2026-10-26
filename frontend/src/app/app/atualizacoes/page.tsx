import Link from "next/link";
import {ArrowLeft,ArrowUpRight,CalendarDays,CheckCircle2,History,Sparkles} from "lucide-react";
import {pagenovaUpdates,updateDatePtBr} from "@/lib/pagenova-updates";

export const metadata={title:"Atualizações | PageNova AI",description:"Novidades, melhorias e correções da plataforma PageNova."};

const categories={
  Novidade:"border-lime-300/30 bg-lime-300/10 text-lime-200",
  Melhoria:"border-emerald-300/25 bg-emerald-300/[.08] text-emerald-200",
  Correção:"border-white/15 bg-white/[.06] text-white/75",
} as const;

export default function AtualizacoesPage(){
  return <main className="min-h-screen bg-[#090e0b] px-4 pb-20 pt-7 text-white sm:px-7 lg:px-10">
    <div className="mx-auto max-w-5xl">
      <Link href="/app" className="inline-flex items-center gap-2 text-xs font-semibold text-white/55 transition hover:text-lime-300"><ArrowLeft size={15}/> Voltar ao Início</Link>
      <header className="relative mt-6 overflow-hidden rounded-[24px] border border-lime-300/15 bg-[radial-gradient(ellipse_at_top_right,rgba(160,235,94,.16),transparent_52%),#142018] p-6 sm:p-9">
        <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-lime-300"><History size={14}/> Changelog da plataforma</div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">Tudo o que evoluiu na <span className="text-lime-300">PageNova.</span></h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Acompanhe as novidades, correções e melhorias que estão disponíveis. Atualizaremos este histórico a cada nova entrega.</p>
      </header>

      <section aria-label="Histórico de atualizações" className="mt-8 space-y-4">
        {pagenovaUpdates.map((entry,index)=><article id={entry.id} key={entry.id} className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#111914] px-5 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className={"rounded-full border px-3 py-1 text-[11px] font-bold "+categories[entry.category]}>{entry.category}</span>
            <time dateTime={entry.date} className="inline-flex items-center gap-1.5 text-xs text-white/45"><CalendarDays size={13}/>{updateDatePtBr(entry.date)}</time>
            {index===0&&<span className="inline-flex items-center gap-1 text-[11px] font-bold text-lime-300"><Sparkles size={13}/> Mais recente</span>}
          </div>
          <h2 className="mt-5 text-xl font-bold leading-snug tracking-tight">{entry.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">{entry.summary}</p>
          <ul className="mt-5 grid gap-2 text-sm text-white/65">
            {entry.details.map(line=><li key={line} className="flex items-start gap-2.5"><CheckCircle2 size={16} className="mt-[3px] shrink-0 text-lime-300/80"/><span>{line}</span></li>)}
          </ul>
          <Link href={entry.href} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-lime-300/25 bg-lime-300/[.065] px-4 py-2.5 text-xs font-semibold text-lime-300 transition hover:bg-lime-300/10">{entry.linkLabel}<ArrowUpRight size={14}/></Link>
        </article>)}
      </section>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-5">
        <p className="text-sm text-white/60">Quer conhecer as ferramentas e aprender a utilizá-las?</p>
        <Link href="/app/como-usar" className="text-xs font-bold text-lime-300 hover:text-lime-200">Como Usar a Plataforma →</Link>
      </div>
    </div>
  </main>;
}
