import Link from "next/link";

import { PageNovaProductDemo } from "@/components/pagenova-product-demo";
import { PageNovaEditorDemo } from "@/components/pagenova-editor-demo";
import { PageNovaGeneratorDemo } from "@/components/pagenova-generator-demo";

import { PageNovaOfferCard } from "@/components/pagenova-offer-card";
import { PageNovaFaq, PageNovaHowItWorks, PageNovaReveal } from "@/components/pagenova-motion-sections";
const features = [
  {
    icon: "◇",
    title: "Clonador por URL",
    description: "Transforme a estrutura de uma página existente em um projeto que você pode editar.",
  },
  {
    icon: "✎",
    title: "Editor visual",
    description: "Ajuste textos, imagens e links diretamente na página e continue de onde parou.",
  },
  {
    icon: "✦",
    title: "Landing pages com IA",
    description: "Comece uma página de oferta com uma estrutura gerada a partir do seu briefing.",
  },
  {
    icon: "▦",
    title: "Sites por nicho",
    description: "Parta de um briefing para imobiliária, SaaS e outros segmentos, com prévia durante a criação.",
  },
  {
    icon: "◎",
    title: "CRM de vendas",
    description: "Organize leads, etapas e responsáveis em um espaço de trabalho no seu navegador.",
  },
  {
    icon: "▤",
    title: "Dashboard",
    description: "Visualize indicadores e a evolução dos negócios cadastrados no CRM.",
  },
  {
    icon: "◷",
    title: "Agendamento",
    description: "Cadastre serviços, organize reservas e evite conflitos entre horários.",
  },
  {
    icon: "▣",
    title: "Seus projetos",
    description: "Reabra as páginas e os sites salvos para seguir editando e evoluindo suas ideias.",
  },
];
function Brand() {
  return (
    <div className="flex items-center">
      <img
        src="/brand/pagenova-logo.png"
        alt="PageNova AI — Landing Page Studio"
        width={210}
        height={64}
        className="h-12 w-auto max-w-[180px] object-contain object-left sm:h-14 sm:max-w-[210px]"
      />
    </div>
  );
}
function Arrow() {
  return <span aria-hidden="true">→</span>;
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080515] text-white">
      <div className="border-b border-white/[0.07] bg-gradient-to-r from-[#008B6C] via-[#00C997] to-[#008B6C]">
        <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-center px-6 text-center text-[11px] font-semibold tracking-wide text-white/90">
          ✦ Crie páginas, sites e ferramentas para colocar suas ideias em movimento.
        </div>
      </div>

      <section className="relative overflow-hidden bg-[#080515]">
        {/* PAGENOVA_HERO_SKY */}
        <div
          className="pagenova-sky pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="pagenova-sky-base" />

          <div className="pagenova-nebula pagenova-nebula-a" />
          <div className="pagenova-nebula pagenova-nebula-b" />
          <div className="pagenova-nebula pagenova-nebula-c" />

          <div className="pagenova-cloud pagenova-cloud-left">
            <span />
            <span />
            <span />
          </div>

          <div className="pagenova-cloud pagenova-cloud-right">
            <span />
            <span />
            <span />
          </div>

          <div className="pagenova-cloud pagenova-cloud-top">
            <span />
            <span />
          </div>

          <div className="pagenova-stars pagenova-stars-small" />
          <div className="pagenova-stars pagenova-stars-medium" />

          <span className="pagenova-star pagenova-star-01" />
          <span className="pagenova-star pagenova-star-02" />
          <span className="pagenova-star pagenova-star-03" />
          <span className="pagenova-star pagenova-star-04" />
          <span className="pagenova-star pagenova-star-05" />
          <span className="pagenova-star pagenova-star-06" />
          <span className="pagenova-star pagenova-star-07" />
          <span className="pagenova-star pagenova-star-08" />
          <span className="pagenova-star pagenova-star-09" />
          <span className="pagenova-star pagenova-star-10" />

          <span className="pagenova-comet pagenova-comet-01" />
          <span className="pagenova-comet pagenova-comet-02" />
          <span className="pagenova-comet pagenova-comet-03" />

          <div className="pagenova-horizon-glow" />
          <div className="pagenova-sky-vignette" />
        </div>

        <header className="relative z-20 mx-auto max-w-7xl px-5 pt-5 md:px-8">
          <div className="flex h-[68px] items-center justify-between rounded-2xl border border-white/[0.09] bg-[#0E0919]/80 px-5 shadow-2xl shadow-black/20 backdrop-blur-xl md:px-7">
            <Link href="/" aria-label="PageNova AI">
              <Brand />
            </Link>

            <nav className="hidden items-center gap-8 text-[13px] font-medium text-white/55 lg:flex">
              <a href="#recursos" className="transition hover:text-white">
                Recursos
              </a>
              <a href="#como-funciona" className="transition hover:text-white">
                Como funciona
              </a>
              <a href="#modulos" className="transition hover:text-white">
                Produto
              </a>
              <a href="#preco" className="transition hover:text-white">
                Preço
              </a>
              <a href="#faq" className="transition hover:text-white">
                FAQ
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden px-3 py-2 text-sm font-medium text-white/60 transition hover:text-white sm:block"
              >
                Entrar
              </Link>

              <Link
                href="#preco"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00C997] to-[#008B6C] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(108,59,255,0.28)] transition hover:brightness-110 pagenova-premium-cta"
              >
                Começar agora
                <Arrow />
              </Link>
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-24 text-center md:px-8 md:pb-32 md:pt-32">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-400/[0.09] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(196,181,253,0.9)]" />
            CRIE · ORGANIZE · EVOLUA
          </div>

                    <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-bold leading-[0.98] tracking-[-0.055em] md:text-7xl lg:text-[82px]">
            Sua ideia merece
            <span className="block bg-gradient-to-r from-[#C5FFE5] via-[#28F2BC] to-[#00BB91] bg-clip-text text-transparent">
              mais que um template.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/60 md:text-lg md:leading-8">
            Crie landing pages e sites, edite visualmente e organize projetos, leads e agendamentos.
            Uma plataforma para tirar sua operação do papel e continuar evoluindo.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#preco"
              className="inline-flex min-h-13 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#00C997] to-[#008B6C] px-7 py-3.5 text-sm font-bold shadow-[0_14px_45px_rgba(108,59,255,0.32)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Conhecer os planos
              <Arrow />
            </Link>

            <a
              href="#produto"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-6 py-3.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-[9px]">
                ▶
              </span>
              Ver como funciona
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[11px] font-medium text-white/30">
            <span>✓ Planos de assinatura</span>
            <span>✓ Acesse as demonstrações</span>
            <span>✓ Escolha seu período</span>
          </div>

          <div
            id="produto"
            className="relative mx-auto mt-20 max-w-6xl scroll-mt-28"
          >
            <div className="absolute -inset-12 rounded-[80px] bg-violet-600/[0.12] blur-[80px]" />

            {/* PAGENOVA_LP_A4_COMPONENT */}
            <PageNovaProductDemo />
        </div>
              </div>
      </section>

      <section
        id="recursos"
        className="relative scroll-mt-20 overflow-hidden bg-[#F8F7FC] text-[#171329]"
      >
        <div className="pointer-events-none absolute left-1/2 top-[-240px] h-[430px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-300/20 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32">
          {/* PAGENOVA_LP_A7_1_RECURSOS_REVEAL */}
          <PageNovaReveal>
<div className="mx-auto max-w-3xl text-center">
            <span className="rounded-full bg-[#EEE9FF] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#6C3BFF]">
              Recursos
            </span>

            <h2 className="mt-5 text-4xl font-bold tracking-[-0.045em] md:text-5xl">
              Da primeira página à operação do seu negócio.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#716C80]">
              A PageNova reúne criação, edição e ferramentas para você organizar o trabalho em um só lugar.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[24px] border pagenova-premium-card border-[#E7E2F0] bg-white p-6 shadow-[0_16px_50px_rgba(38,25,70,0.05)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#835FFF] to-[#6034EB] font-bold text-white shadow-lg shadow-violet-500/15">
                  {feature.icon}
                </div>

                <h3 className="mt-7 text-lg font-bold tracking-[-0.025em]">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#777181]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-24 grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7547FF]">
                Editor visual
              </span>

              <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] md:text-5xl">
                Edite a página do seu jeito.
              </h2>

              <p className="mt-5 max-w-lg leading-7 text-[#716C80]">
                Selecione elementos diretamente na página e personalize os
                principais conteúdos da sua landing page.
              </p>

              <div className="mt-8 space-y-3 text-sm font-medium text-[#4E495A]">
                <p>✓ Edite textos</p>
                <p>✓ Troque imagens</p>
                <p>✓ Ajuste links e CTAs</p>
                <p>✓ Salve seus projetos</p>
              </div>

              <Link
                href="#preco"
                className="mt-9 inline-flex items-center gap-3 rounded-xl bg-[#171329] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#251D3B]"
              >
                Conhecer a PageNova
                <Arrow />
              </Link>
            </div>

            {/* PAGENOVA_LP_A5_EDITOR_LIVE_DEMO */}
            <PageNovaEditorDemo />
          </div>

                    {/* PAGENOVA_LP_A6_LIVE_GENERATOR */}
          <div className="mt-24">
            <PageNovaGeneratorDemo />
          </div>
          </PageNovaReveal>
        </div>
      </section>

      <section
        id="como-funciona"
        className="relative scroll-mt-20 overflow-hidden bg-white"
      >
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.035] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-28">
          {/* PAGENOVA_LP_A7_1_HOW_MOTION */}
          <PageNovaHowItWorks />
        </div>
      </section>

      <section id="modulos" className="relative scroll-mt-20 overflow-hidden bg-[#071611] text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-400/[0.09] blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32">
          <div className="max-w-3xl">
            <span className="text-xs font-black uppercase tracking-[.22em] text-emerald-300">
              O produto em ação
            </span>
            <h2 className="mt-5 text-4xl font-bold tracking-[-.045em] md:text-6xl">
              Crie a presença. Organize o próximo passo.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/55">
              Comece pelo site ou pela página de oferta. Depois use os espaços de trabalho da PageNova
              para acompanhar leads, indicadores e reservas.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            <article className="rounded-[26px] border border-emerald-300/20 bg-gradient-to-br from-[#123329] to-[#0c201a] p-7 md:p-9">
              <span className="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">01 · Criar</span>
              <h3 className="mt-5 text-2xl font-bold">Sites com briefing por nicho</h3>
              <p className="mt-4 leading-7 text-white/60">
                Selecione o segmento, ajuste o briefing e acompanhe a geração das páginas na prévia.
                Imobiliária e SaaS já possuem experiências próprias.
              </p>
              <div className="mt-8 rounded-2xl border border-emerald-300/15 bg-[#071a14] p-5">
                <div className="flex items-center gap-2 text-xs text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Briefing → geração → prévia → edição
                </div>
              </div>
            </article>

            <article className="rounded-[26px] border border-white/10 bg-[#10241d] p-7 md:p-9">
              <span className="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">02 · Personalizar</span>
              <h3 className="mt-5 text-2xl font-bold">Clonador e editor visual</h3>
              <p className="mt-4 leading-7 text-white/60">
                Use uma URL como ponto de partida ou crie uma landing page. Ajuste os elementos principais
                e mantenha seus projetos disponíveis para continuar o trabalho.
              </p>
              <div className="mt-8 flex flex-wrap gap-2 text-xs text-white/60">
                <span className="rounded-full border border-white/15 px-3 py-2">Textos</span>
                <span className="rounded-full border border-white/15 px-3 py-2">Imagens</span>
                <span className="rounded-full border border-white/15 px-3 py-2">Links</span>
              </div>
            </article>

            <article className="rounded-[26px] border border-white/10 bg-[#10241d] p-7 md:p-9">
              <span className="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">03 · Acompanhar</span>
              <h3 className="mt-5 text-2xl font-bold">CRM e dashboard</h3>
              <p className="mt-4 leading-7 text-white/60">
                Cadastre leads, acompanhe etapas de venda e visualize indicadores calculados a partir do CRM.
                Nesta versão, os dados ficam no navegador usado para trabalhar.
              </p>
            </article>

            <article className="rounded-[26px] border border-white/10 bg-[#10241d] p-7 md:p-9">
              <span className="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">04 · Organizar</span>
              <h3 className="mt-5 text-2xl font-bold">Agenda de serviços</h3>
              <p className="mt-4 leading-7 text-white/60">
                Cadastre serviços, consulte horários livres, bloqueie conflitos e exporte reservas para o calendário.
                A gestão da agenda também funciona neste navegador.
              </p>
            </article>
          </div>
        </div>
      </section>
{/* PAGENOVA_LP_A6_6_PREMIUM_OFFER */}
      <section id="preco" className="pagenova-sales relative scroll-mt-20 overflow-hidden bg-[#06130f] text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[620px] w-[960px] -translate-x-1/2 rounded-full bg-emerald-400/[0.11] blur-[130px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.2em] text-emerald-200">
              Uma plataforma. Seu ritmo.
            </span>
            <h2 className="mt-6 text-4xl font-bold tracking-[-.045em] md:text-6xl">
              Escolha como você quer crescer.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/55">
              Os mesmos recursos da PageNova em todos os períodos. Assine mensalmente ou economize ao escolher um ciclo maior.
            </p>
          </div>
          <PageNovaOfferCard />
        </div>
      </section>

      <section
        id="faq"
        className="relative scroll-mt-20 overflow-hidden bg-[#F8F7FC]"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[780px] -translate-x-1/2 rounded-full bg-violet-500/[0.05] blur-[110px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-28">
          {/* PAGENOVA_LP_A7_1_FAQ */}
          <PageNovaFaq />
        </div>
      </section>

      <footer className="border-t border-white/[0.07] bg-[#080515]">
        <div className="mx-auto max-w-7xl px-6 py-10 md:px-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <Brand />

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/30">
              <a href="#recursos" className="hover:text-white">
                Recursos
              </a>
              <a href="#como-funciona" className="hover:text-white">
                Como funciona
              </a>
              <a href="#preco" className="hover:text-white">
                Preço
              </a>
              <a href="#faq" className="hover:text-white">
                FAQ
              </a>
            </div>

            <Link
              href="#preco"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"
            >
              Começar agora
              <Arrow />
            </Link>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-3 border-t border-white/[0.07] pt-6 text-[10px] text-white/20 sm:flex-row">
            <p>© 2026 PageNova AI.</p>
            <p>Clone. Edite. Crie.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}