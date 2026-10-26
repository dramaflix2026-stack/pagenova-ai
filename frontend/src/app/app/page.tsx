import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient as createAdminClient} from "@supabase/supabase-js";
import {
  ArrowRight,ArrowUpRight,BookOpen,Check,ChevronRight,Clock3,
  FileText,Globe,LayoutTemplate,MessageCircle,PlayCircle,Sparkles,Users
} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {getPageNovaAccess} from "@/lib/trial/server";
import {pagenovaUpdates,updateDatePtBr} from "@/lib/pagenova-updates";
import {ContinuePageNovaProject} from "@/components/continue-pagenova-project";

export const dynamic="force-dynamic";

const shortcuts=[
  {title:"Meus sites",subtitle:"Acesse seus projetos",href:"/app/paginas",icon:FileText},
  {title:"Landing Pages",subtitle:"Crie uma página de conversão",href:"/app/landing",icon:LayoutTemplate},
  {title:"Chat com IA",subtitle:"Seu assistente PageNova",href:"/app/chat-ai",icon:MessageCircle},
  {title:"Domínios",subtitle:"Configure seu endereço",href:"/app/dominios",icon:Globe},
];

export default async function AppPage(){
  const session=await createClient();
  const {data:{user}}=await session.auth.getUser();
  if(!user?.email)redirect("/login");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)redirect("/access-required");
  const admin=createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const access=await getPageNovaAccess(admin,user,true);
  if(access.kind==="none")redirect(access.reason==="expired"?"/trial-expired":"/access-required");

  const studioHref=access.kind==="trial"?"/app/crm?view=sites-ia":"/app/builder-v2";
  const latest=pagenovaUpdates.slice(0,2);

  return <main className="relative min-h-screen overflow-x-hidden bg-[#090e0b] text-white">
    <div aria-hidden="true" className="pointer-events-none absolute left-[-18rem] top-[-14rem] h-[38rem] w-[38rem] rounded-full bg-emerald-500/[.065] blur-[110px]"/>
    <div aria-hidden="true" className="pointer-events-none absolute right-[-18rem] top-[10rem] h-[34rem] w-[34rem] rounded-full bg-lime-400/[.055] blur-[110px]"/>
    <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-7 sm:pt-9 lg:px-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.19em] text-lime-300">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,.7)]"/>
          PageNova AI <span className="text-white/25">/</span> Início
        </span>
        <Link href="/app/atualizacoes" className="inline-flex items-center gap-1.5 text-xs font-medium text-white/55 transition hover:text-lime-300">
          Novidades da plataforma <ArrowUpRight size={14}/>
        </Link>
      </div>

      <section aria-labelledby="home-title" className="relative overflow-hidden rounded-[24px] border border-lime-300/15 bg-[radial-gradient(ellipse_at_88%_30%,rgba(142,220,96,.18),transparent_45%),linear-gradient(120deg,#142218,#0c1610_70%)] px-5 py-6 sm:rounded-[26px] sm:px-9 sm:py-10 lg:px-12 lg:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border border-lime-200/10"/>
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-16 h-[28rem] w-[28rem] rounded-full border border-lime-200/[.07]"/>
        <div className="relative z-10 max-w-[780px]">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-lime-300/20 sm:mb-4 bg-lime-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-lime-200 sm:text-xs">
            <Sparkles size={13}/> Seu espaço de criação
          </span>
          <h1 id="home-title" className="max-w-[720px] text-[clamp(1.85rem,5.3vw,4rem)] font-extrabold leading-[1.09] tracking-[-.05em]">
            Bem-vindo à <span className="text-lime-300">PageNova AI.</span>
          </h1>
          <p className="mt-3 max-w-[570px] text-sm leading-6 text-white/65 sm:mt-4 sm:leading-7 sm:text-base">
            Sua central para criar sites, trabalhar com leads e acompanhar tudo o que evolui na plataforma.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-7 sm:flex sm:flex-wrap sm:gap-3">
            <Link href={studioHref} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-lime-300 px-2.5 py-2 text-xs font-extrabold text-[#142017] shadow-[0_10px_35px_rgba(173,241,95,.13)] transition hover:bg-lime-200 sm:min-h-12 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm">
              <Sparkles size={16} className="shrink-0"/> <span className="sm:hidden">Criar site</span><span className="hidden sm:inline">Criar site com IA</span> <ArrowRight size={14} className="shrink-0"/>
            </Link>
            <ContinuePageNovaProject/>
          </div>
          <Link href="/app/como-usar" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition hover:text-lime-300 sm:mt-4">
            <PlayCircle size={15}/> Primeira vez aqui? Veja como usar <ArrowRight size={12}/>
          </Link>
          <div className="mt-4 hidden flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-white/50 sm:mt-6 sm:flex">
            <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-lime-300"/> Criação com IA</span>
            <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-lime-300"/> Edição pelo chat</span>
            <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-lime-300"/> Prévia responsiva</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="home-actions" className="mt-8 sm:mt-10">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-lime-300/75">Acessos rápidos</p>
            <h2 id="home-actions" className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">O que vamos criar hoje?</h2>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Link href={studioHref} className="group relative flex min-h-[166px] flex-col justify-between overflow-hidden rounded-[22px] border border-lime-300/20 bg-[#17281c] p-4 transition hover:border-lime-300/50 hover:bg-[#1b3122] sm:p-6">
            <div className="pointer-events-none absolute right-[-26px] top-[-30px] h-36 w-36 rotate-[-18deg] rounded-[40px] border-[23px] border-lime-300/10" aria-hidden="true"/>
            <div className="relative flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-lime-300/20 bg-lime-300/10 text-lime-300"><Sparkles size={21}/></span>
              <ArrowUpRight size={19} className="text-lime-300/60 transition group-hover:translate-x-1 group-hover:-translate-y-1"/>
            </div>
            <div className="relative mt-4 sm:mt-6">
              <h3 className="text-lg font-bold tracking-tight sm:text-xl">Gerar site com IA</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/55">Descreva seu negócio, escolha o visual e personalize pelo chat.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-lime-300">Abrir PageNova Studio <ArrowRight size={14}/></span>
            </div>
          </Link>
          <Link href="/app/crm?view=sites-ia" className="group relative flex min-h-[166px] flex-col justify-between overflow-hidden rounded-[22px] border border-white/10 bg-[#111a15] p-4 transition hover:border-lime-300/35 hover:bg-[#15221a] sm:p-6">
            <div className="pointer-events-none absolute bottom-[-90px] right-[-60px] h-56 w-56 rounded-full bg-emerald-400/[.075] blur-[30px]" aria-hidden="true"/>
            <div className="relative flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[.06] text-white/80"><Users size={21}/></span>
              <ArrowUpRight size={19} className="text-white/35 transition group-hover:translate-x-1 group-hover:-translate-y-1"/>
            </div>
            <div className="relative mt-4 sm:mt-6">
              <h3 className="text-lg font-bold tracking-tight sm:text-xl">Site a partir de um lead</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/55">Use os dados de uma empresa do CRM e deixe a IA preparar o site.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white/85">Ir para o CRM <ArrowRight size={14}/></span>
            </div>
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {shortcuts.map(item=><Link key={item.href} href={item.href} className="group flex min-h-[112px] flex-col justify-between rounded-2xl border border-white/[.085] bg-white/[.025] p-4 transition hover:border-lime-300/35 hover:bg-white/[.055]">
            <item.icon size={19} className="text-lime-300/85"/>
            <div className="mt-4"><span className="block text-sm font-semibold text-white/90">{item.title}</span><span className="mt-1 block text-[11px] text-white/45">{item.subtitle}</span></div>
          </Link>)}
        </div>
      </section>

      <section aria-labelledby="home-updates" id="novidades" className="mt-10 scroll-mt-24 sm:mt-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-lime-300/75">Evolução contínua</p>
            <h2 id="home-updates" className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Novidades da PageNova</h2>
            <p className="mt-2 text-xs text-white/45 sm:text-sm">Melhorias e correções recentes, em um só lugar.</p>
          </div>
          <Link href="/app/atualizacoes" className="inline-flex items-center gap-1.5 text-xs font-bold text-lime-300 hover:text-lime-200">Ver histórico completo <ArrowRight size={14}/></Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {latest.map((entry,index)=><article key={entry.id} className="flex flex-col rounded-[20px] border border-white/10 bg-[#111914] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className={"rounded-full border px-2.5 py-1 text-[10px] font-bold "+(index===0?"border-lime-300/30 bg-lime-300/10 text-lime-200":"border-white/10 bg-white/[.04] text-white/60")}>{entry.category}</span>
              <time dateTime={entry.date} className="text-[11px] text-white/40">{updateDatePtBr(entry.date)}</time>
            </div>
            <h3 className="mt-4 text-base font-bold leading-snug tracking-tight sm:mt-5">{entry.title}</h3>
            <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-white/55 sm:line-clamp-none">{entry.summary}</p>
            <Link href={entry.href} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-lime-300 hover:text-lime-200 sm:mt-5">{entry.linkLabel} <ArrowUpRight size={13}/></Link>
          </article>)}
        </div>
      </section>

      <section aria-labelledby="home-learning" className="mt-12 grid gap-4 rounded-[24px] border border-white/10 bg-[linear-gradient(120deg,#15251a,#101912)] px-5 py-7 md:grid-cols-[1.3fr_.7fr] md:items-center md:px-8 md:py-9">
        <div>
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-lime-300"><BookOpen size={15}/> Central de aprendizado</span>
          <h2 id="home-learning" className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">Aprenda a usar a plataforma.</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-white/55">Encontre tutoriais interativos, orientações para começar e a área reservada aos próximos vídeos.</p>
          <Link href="/app/como-usar" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold text-[#142017] transition hover:bg-lime-200">Como Usar a Plataforma <ArrowRight size={15}/></Link>
        </div>
        <div aria-hidden="true" className="hidden h-36 items-center justify-center rounded-2xl border border-lime-300/15 bg-[radial-gradient(circle_at_center,rgba(174,232,104,.16),rgba(7,19,12,.7))] md:flex">
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-lime-300/30 bg-lime-300/10 text-lime-300"><PlayCircle size={40} strokeWidth={1.5}/></span>
        </div>
      </section>
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-5 text-[11px] text-white/35">
        <span>PageNova AI · Sua plataforma de criação</span>
        <Link href="/app/atualizacoes" className="inline-flex items-center gap-1 transition hover:text-lime-300"><Clock3 size={12}/> Histórico de atualizações <ChevronRight size={12}/></Link>
      </footer>
    </div>
  </main>;
}
