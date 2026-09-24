import Link from "next/link";

import { PageNovaProductDemo } from "@/components/pagenova-product-demo";
import { PageNovaEditorDemo } from "@/components/pagenova-editor-demo";
import { PageNovaGeneratorDemo } from "@/components/pagenova-generator-demo";
import { PageNovaSocialProof } from "@/components/pagenova-social-proof";
import { PageNovaOfferCard } from "@/components/pagenova-offer-card";
import { PageNovaFaq, PageNovaHowItWorks, PageNovaReveal } from "@/components/pagenova-motion-sections";
const features = [
  {
    icon: "◇",
    title: "Clone por URL",
    description:
      "Cole a URL de uma landing page e transforme sua estrutura em um projeto editável.",
  },
  {
    icon: "✎",
    title: "Editor visual",
    description:
      "Altere textos, imagens e links diretamente na página, sem precisar programar.",
  },
  {
    icon: "✦",
    title: "Criação com IA",
    description:
      "Comece uma nova landing page a partir das informações principais da sua oferta.",
  },
  {
    icon: "▤",
    title: "Seus projetos",
    description:
      "Organize as páginas que você clonou ou criou dentro de um único workspace.",
  },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-violet-300/20 bg-gradient-to-br from-[#8B5CFF] via-[#6C3BFF] to-[#4320C9] shadow-[0_0_30px_rgba(108,59,255,0.3)]">
        <span className="text-lg font-black tracking-[-0.08em] text-white">
          N
        </span>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-white/50 blur-[3px]" />
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-[17px] font-bold tracking-[-0.035em] text-white">
          PageNova
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-400">
          AI
        </span>
      </div>
    </div>
  );
}

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080515] text-white">
      <div className="border-b border-white/[0.07] bg-gradient-to-r from-[#5222D7] via-[#7547FF] to-[#5222D7]">
        <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-center px-6 text-center text-[11px] font-semibold tracking-wide text-white/90">
          ✦ Transforme sua próxima ideia em uma landing page.
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
              <a href="#produto" className="transition hover:text-white">
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
                href="/app"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#815BFF] to-[#6338F2] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(108,59,255,0.28)] transition hover:brightness-110 pagenova-premium-cta"
              >
                Começar agora
                <Arrow />
              </Link>
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-24 text-center md:px-8 md:pb-32 md:pt-32">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-500/[0.09] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.9)]" />
            Clone · Edite · Crie
          </div>

          <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-bold leading-[0.98] tracking-[-0.055em] md:text-7xl lg:text-[82px]">
            Landing pages
            <span className="block bg-gradient-to-r from-[#D8CEFF] via-[#A98CFF] to-[#7547FF] bg-clip-text text-transparent">
              em minutos.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/50 md:text-lg md:leading-8">
            Clone uma landing page existente ou crie uma nova estrutura.
            Personalize textos, imagens e links em um editor visual simples.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/app"
              className="inline-flex min-h-13 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#845FFF] to-[#6438F4] px-7 py-3.5 text-sm font-bold shadow-[0_14px_45px_rgba(108,59,255,0.32)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Começar agora — R$97
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
            <span>✓ Pagamento único</span>
            <span>✓ Acesso imediato</span>
            <span>✓ Sem mensalidade</span>
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
        <div className="pointer-events-none absolute left-1/2 top-[-240px] h-[430px] w-[900px] -translate-x-1/2 rounded-full bg-violet-300/20 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32">
          {/* PAGENOVA_LP_A7_1_RECURSOS_REVEAL */}
          <PageNovaReveal>
<div className="mx-auto max-w-3xl text-center">
            <span className="rounded-full bg-[#EEE9FF] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#6C3BFF]">
              Recursos
            </span>

            <h2 className="mt-5 text-4xl font-bold tracking-[-0.045em] md:text-5xl">
              Tudo que você precisa para trabalhar sua landing page.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#716C80]">
              Do clone à edição, a PageNova reúne as principais etapas em um
              único ambiente.
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
                href="/app"
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

                  {/* PAGENOVA_LP_A6_7_SOCIAL_PROOF */}
      <PageNovaSocialProof />
{/* PAGENOVA_LP_A6_6_PREMIUM_OFFER */}
      <section
        id="preco"
        className="relative scroll-mt-20 overflow-hidden bg-[#090516] text-white"
      >
        <div className="pointer-events-none absolute left-1/2 top-[44%] h-[760px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6D3DFF]/[0.14] blur-[140px]" />
        <div className="pointer-events-none absolute left-[8%] top-[18%] h-64 w-64 rounded-full bg-violet-600/[0.07] blur-[100px]" />
        <div className="pointer-events-none absolute bottom-[6%] right-[8%] h-72 w-72 rounded-full bg-fuchsia-500/[0.05] blur-[110px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-violet-400/25 bg-violet-500/[0.08] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">
              Acesso completo
            </span>

            <h2 className="mt-6 text-4xl font-bold tracking-[-0.045em] md:text-5xl">
              Tudo em um único acesso.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/45">
              Uma única compra para acessar o ecossistema PageNova e
              começar a trabalhar suas landing pages.
            </p>
          </div>

          {/* PAGENOVA_LP_A6_8_3D_OFFER */}
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
              href="/app"
              className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300"
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