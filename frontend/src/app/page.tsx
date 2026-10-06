import { PageNovaLandingMotion, PageNovaVideoShowcase } from "@/components/pagenova-landing-motion";
import Link from "next/link";
import { PAYMENT_BRANDS, PaymentBrand } from "@/components/payment-brands";

const plans = [
  {
    name: "Mensal",
    price: "R$147",
    cycle: "/ mês",
    equivalent: "R$147 por mês",
    saving: "Flexibilidade para começar",
    checkoutUrl: "https://pay.kiwify.com.br/a13pNpS",
    featured: false,
  },
  {
    name: "Trimestral",
    price: "R$397",
    cycle: "/ 3 meses",
    equivalent: "Equivale a R$132,33 por mês",
    saving: "Economize R$44 por ciclo",
    checkoutUrl: "https://pay.kiwify.com.br/SQ1dOyd",
    featured: false,
  },
  {
    name: "Semestral",
    price: "R$747",
    cycle: "/ 6 meses",
    equivalent: "Equivale a R$124,50 por mês",
    saving: "Economize R$135 por ciclo",
    checkoutUrl: "https://pay.kiwify.com.br/cgZcPet",
    featured: true,
  },
  {
    name: "Anual",
    price: "R$1.297",
    cycle: "/ 12 meses",
    equivalent: "Equivale a R$108,08 por mês",
    saving: "Economize R$467 por ciclo",
    checkoutUrl: "https://pay.kiwify.com.br/oS6Bmzg",
    featured: false,
  },
] as const;

const questions = [
  {
    question: "O que posso criar na PageNova?",
    answer:
      "Você pode criar landing pages, iniciar sites a partir de briefings por nicho, clonar páginas por URL e editar seus projetos. A plataforma também oferece CRM, dashboard e agenda de serviços.",
  },
  {
    question: "Preciso saber programar?",
    answer:
      "Não para iniciar e editar os elementos disponíveis na interface. Você informa o briefing, acompanha a criação e ajusta o projeto pelo editor.",
  },
  {
    question: "Os dados do CRM e da agenda ficam salvos onde?",
    answer:
      "Nesta versão, CRM e agenda guardam os dados no navegador em que você trabalha. Use o mesmo navegador e dispositivo para continuar esses projetos.",
  },
  {
    question: "Como funcionam os planos?",
    answer:
      "O plano mensal custa R$147 por mês. Os planos trimestral, semestral e anual são cobrados pelo respectivo período e têm menor custo mensal equivalente. Escolha o período desejado e siga para o checkout seguro.",
  },
  {
    question: "Preciso instalar algum programa para usar a PageNova?",
    answer:
      "Não. A PageNova funciona pelo navegador, então você pode acessar a plataforma online sem instalar um programa no computador.",
  },
  {
    question: "Consigo editar uma página depois de criá-la?",
    answer:
      "Sim. Os projetos criados na plataforma podem ser abertos novamente para continuar os ajustes disponíveis no editor.",
  },
  {
    question: "Posso continuar meus projetos depois?",
    answer:
      "Sim. A área Minhas páginas permite retornar aos projetos salvos. Recursos que atualmente armazenam dados no navegador, como CRM e agenda, devem ser acessados no mesmo navegador e dispositivo para manter esses dados disponíveis.",
  },
  {
    question: "A PageNova serve apenas para landing pages?",
    answer:
      "Não. A plataforma reúne ferramentas para criação de páginas e sites, além de recursos de organização comercial como CRM e agenda.",
  },
  {
    question: "Como escolho entre os planos mensal, trimestral, semestral e anual?",
    answer:
      "Os planos dão opções de período diferentes. Você pode comparar o valor total e o custo mensal equivalente exibidos na seção de planos e escolher o período mais adequado para você.",
  },
  {
    question: "O pagamento é feito dentro da PageNova?",
    answer:
      "Ao escolher um plano, você é direcionado ao checkout seguro da Kiwify correspondente ao período selecionado.",
  },
  {
    question: "Já tenho cadastro. Como acesso minha conta?",
    answer:
      "Use o botão Entrar no topo da página e informe os dados da sua conta para acessar a plataforma.",
  },
];

function Brand() {
  return (
    <img
      src="/brand/pagenova-logo.png"
      alt="PageNova AI"
      width={210}
      height={64}
      className="h-11 w-auto max-w-[165px] object-contain object-left sm:h-12 sm:max-w-[190px]"
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#31d9a4]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#31d9a4]" />
      {children}
    </span>
  );
}

function ProductFrame() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0c1512] shadow-[0_30px_90px_rgba(0,0,0,.38)]">
      <div className="flex h-11 items-center gap-2 border-b border-white/10 bg-[#0b1713] px-5">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="ml-4 text-[11px] text-white/45">PageNova AI / espaço de criação</span>
        <span className="ml-auto rounded-md bg-[#153b2d] px-2 py-1 text-[10px] font-semibold text-[#7ceac2]">
          Prévia
        </span>
      </div>
      <div className="grid min-h-[360px] md:grid-cols-[185px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#09120f] p-5 md:block">
          <div className="mb-8 h-2 w-20 rounded-full bg-[#32d9a4]" />
          {["Início", "Criar com IA", "Clonar", "Meus projetos", "CRM", "Agenda"].map(
            (item, index) => (
              <div
                key={item}
                className={`mb-2 rounded-lg px-3 py-2.5 text-xs ${
                  index === 1 ? "bg-[#173c2e] text-[#8ef3c9]" : "text-white/45"
                }`}
              >
                {item}
              </div>
            )
          )}
        </aside>
        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#5fe0b5]">
                Novo projeto
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                Da ideia à primeira prévia
              </h3>
            </div>
            <span className="rounded-full border border-[#44dca8]/25 px-3 py-1.5 text-[10px] text-[#9aebc8]">
              Briefing por nicho
            </span>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ["01", "Escolha", "Selecione o tipo de projeto"],
              ["02", "Descreva", "Personalize o briefing"],
              ["03", "Acompanhe", "Veja a prévia ganhar forma"],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-xl border border-white/10 bg-white/[.035] p-4">
                <span className="text-[11px] font-bold text-[#43dca8]">{number}</span>
                <strong className="mt-5 block text-sm text-white">{title}</strong>
                <p className="mt-1.5 text-xs leading-5 text-white/45">{description}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-[#4dddab]/15 bg-[#10261d] p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-white/75">Prévia do seu site</span>
              <span className="text-[10px] text-[#8beac1]">Em construção</span>
            </div>
            <div className="mt-5 h-2 w-1/3 rounded-full bg-[#78e9b9]/65" />
            <div className="mt-3 h-2 w-2/3 rounded-full bg-white/15" />
            <div className="mt-2 h-2 w-1/2 rounded-full bg-white/10" />
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="h-12 rounded-lg bg-[#1a4c39]" />
              <div className="h-12 rounded-lg bg-[#19402f]" />
              <div className="h-12 rounded-lg bg-[#173526]" />
            </div>
          </div>
          <p className="mt-3 text-[10px] text-white/35">
            Representação da interface. O resultado depende do briefing e do projeto.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="pn-mobile-centered min-h-screen bg-[#07110e] font-sans text-[#f2f6f1]"><PageNovaLandingMotion />
      <header className="sticky top-0 z-50 border-b border-white/[.08] bg-[#07110e]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between gap-5 px-5 md:px-8">
          <Link href="/" aria-label="PageNova AI, início"><Brand /></Link>
          <nav aria-label="Menu principal" className="hidden items-center gap-7 text-[13px] text-white/60 lg:flex">
            <a href="#plataforma" className="hover:text-white">Plataforma</a>
            <a href="#criacao" className="hover:text-white">Criação</a>
            <a href="#operacao" className="hover:text-white">Operação</a>
            <a href="#planos" className="hover:text-white">Planos</a>
            <a href="#duvidas" className="hover:text-white">Dúvidas</a>
          </nav>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              
              href="/app"
              prefetch
              className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/[.05] hover:text-white sm:border-0 sm:px-1 sm:text-sm"
            >
              Entrar
            </Link>
            <a
              href="#planos"
              className="rounded-lg bg-[#36d9a1] px-3 py-2 text-[11px] font-bold text-[#062018] transition hover:bg-[#7debc0] sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <span className="sm:hidden">Planos</span>
              <span className="hidden sm:inline">
                Conhecer planos <span aria-hidden="true">↗</span>
              </span>
            </a>
          </div>
        </div>
      </header>

      <section id="plataforma" className="relative overflow-hidden border-b border-white/[.07]">
        <div className="pointer-events-none absolute -right-32 top-0 h-[550px] w-[650px] rounded-full bg-[#0b7b55]/20 blur-[130px]" />
        <div className="pointer-events-none absolute -left-64 bottom-0 h-[360px] w-[550px] rounded-full bg-[#00aa78]/10 blur-[110px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-20 md:px-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-16 lg:pb-28 lg:pt-28">
          <div>
            <SectionLabel>Seu espaço para criar e evoluir</SectionLabel>
            <h1 className="mt-6 max-w-xl text-[clamp(2.8rem,5.2vw,5rem)] font-semibold leading-[1.04] tracking-[-.065em]">
              Sua ideia ganha forma.{" "}
              <span className="text-[#68e6b6]">Seu trabalho ganha ritmo.</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-8 text-white/58">
              Crie páginas e sites, edite o resultado e organize leads e agendamentos
              em um mesmo espaço de trabalho.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#criacao" className="rounded-xl bg-[#36d9a1] px-6 py-3.5 text-sm font-bold text-[#062018] transition hover:bg-[#7debc0]">
                Explorar a plataforma →
              </a>
              <a href="#planos" className="rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white/80 transition hover:border-[#75e8b7] hover:text-white">
                Ver os planos
              </a>
            </div>
            <p className="mt-6 text-xs text-white/40">
              Landing pages · Sites por nicho · CRM · Agenda
            </p>
          </div>
          <ProductFrame />
        </div>
      </section>

      <section id="criacao" className="scroll-mt-20 bg-[#f3f5f0] py-20 text-[#14251d] md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#137650]">
                01 / Criação
              </span>
              <h2 className="mt-5 max-w-lg text-4xl font-semibold leading-[1.12] tracking-[-.05em] md:text-5xl">
                Comece pela página que seu negócio precisa.
              </h2>
            </div>
            <p className="max-w-xl self-end text-base leading-8 text-[#586a5e]">
              Escolha um caminho, ajuste o briefing e acompanhe a criação. Você pode
              continuar editando depois que a primeira versão aparecer.
            </p>
          </div>

          <div className="mt-12 grid overflow-hidden rounded-[24px] border border-[#d7e1d7] bg-white lg:grid-cols-3">
            {[
              ["Sites por nicho", "Comece com um briefing voltado ao seu segmento. Imobiliária e SaaS já têm experiências próprias.", "Briefing → páginas → prévia"],
              ["Landing pages", "Gere uma página de oferta a partir das informações do produto ou serviço e refine o conteúdo.", "Oferta → estrutura → edição"],
              ["Clonar e editar", "Use uma URL como ponto de partida para um projeto editável e ajuste textos, imagens e links.", "URL → projeto → editor"],
            ].map(([title, description, path], index) => (
              <article key={title} className={`p-7 md:p-9 ${index < 2 ? "border-b border-[#e4e9e2] lg:border-b-0 lg:border-r" : ""}`}>
                <span className="text-xs font-bold text-[#178759]">0{index + 1}</span>
                <h3 className="mt-10 text-2xl font-semibold tracking-[-.035em]">{title}</h3>
                <p className="mt-4 min-h-24 text-sm leading-7 text-[#607064]">{description}</p>
                <p className="mt-7 border-t border-[#e9eee8] pt-5 text-xs font-semibold text-[#187552]">{path}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-mt-20 border-y border-white/[.07] bg-[#0a1b14] py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionLabel>O processo aparece na tela</SectionLabel>
            <h2 className="mt-5 max-w-lg text-4xl font-semibold leading-[1.12] tracking-[-.05em] md:text-5xl">
              Você acompanha a construção.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-white/55">
              O briefing já traz uma base para o nicho escolhido. Você personaliza
              a direção do projeto, gera as páginas e navega pela prévia para revisar o resultado.
            </p>
            <a href="/app" className="mt-8 inline-flex text-sm font-semibold text-[#74e6b6] hover:text-white">
              Entrar na plataforma →
            </a>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[#0e261b] p-5 sm:p-8">
            {[
              ["01", "Escolher o tipo", "Selecione o segmento ou comece por uma landing page."],
              ["02", "Ajustar o briefing", "Defina nome, proposta e informações do negócio."],
              ["03", "Gerar e acompanhar", "Veja as páginas aparecerem e abra a prévia."],
              ["04", "Refinar", "Edite os detalhes e continue trabalhando no projeto."],
            ].map(([number, title, description], index) => (
              <div key={number} className={`flex gap-5 py-4 ${index < 3 ? "border-b border-white/10" : ""}`}>
                <span className="mt-1 text-xs font-bold text-[#5ce1af]">{number}</span>
                <div>
                  <strong className="text-sm text-white">{title}</strong>
                  <p className="mt-1.5 text-sm leading-6 text-white/45">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="operacao" className="scroll-mt-20 bg-[#f3f5f0] py-20 text-[#14251d] md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#137650]">
              02 / Operação
            </span>
            <h2 className="mt-5 max-w-lg text-4xl font-semibold leading-[1.12] tracking-[-.05em] md:text-5xl">
              Depois de publicar a ideia, organize o trabalho.
            </h2>
            <p className="mt-6 max-w-md text-base leading-8 text-[#586a5e]">
              Criação e rotina comercial se encontram no mesmo produto. Comece com
              o que precisa agora e avance no seu ritmo.
            </p>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-[#d7e1d7] bg-white">
            {[
              ["CRM de vendas", "Cadastre leads, responsáveis e etapas do funil. Arraste negócios entre as fases.", "01"],
              ["Dashboard", "Acompanhe indicadores calculados a partir dos negócios cadastrados no CRM.", "02"],
              ["Agenda de serviços", "Cadastre serviços, visualize horários e organize reservas sem conflitos.", "03"],
              ["Projetos", "Volte às páginas e aos sites salvos para continuar a edição.", "04"],
            ].map(([title, description, number], index) => (
              <div key={title} className={`grid gap-3 p-6 sm:grid-cols-[42px_1fr] sm:p-7 ${index < 3 ? "border-b border-[#e4e9e2]" : ""}`}>
                <span className="text-xs font-bold text-[#168457]">{number}</span>
                <div>
                  <h3 className="text-lg font-semibold tracking-[-.025em]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#657367]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-7xl px-5 text-xs leading-6 text-[#748277] md:px-8">
          Nesta versão, CRM e agenda armazenam os dados no navegador utilizado.
        </p>
      </section>

      <PageNovaVideoShowcase />
      <section id="planos" className="scroll-mt-20 border-t border-white/[.07] bg-[#081710] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectionLabel>Planos PageNova</SectionLabel>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-.05em] md:text-5xl">
                Escolha seu período.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-white/50">
              Os mesmos recursos em todos os períodos. Ciclos maiores reduzem o
              custo mensal equivalente.
            </p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`flex flex-col rounded-[18px] border p-5 ${
                  plan.featured
                    ? "border-[#50dca9]/60 bg-[#123729]"
                    : "border-white/10 bg-[#0d2117]"
                }`}
              >
                <div className="flex min-h-7 items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white/85">{plan.name}</h3>
                  {plan.featured && (
                    <span className="rounded-full bg-[#40dfa5] px-2.5 py-1 text-[10px] font-bold text-[#082219]">
                      Destaque
                    </span>
                  )}
                </div>
                <div className="mt-5 flex flex-wrap items-baseline gap-1.5">
                  <strong className="text-[32px] font-semibold tracking-[-.05em]">{plan.price}</strong>
                  <span className="text-xs text-white/45">{plan.cycle}</span>
                </div>
                <p className="mt-2 text-xs text-white/55">{plan.equivalent}</p>
                <p className="mt-5 text-xs font-semibold text-[#79e4b6]">{plan.saving}</p>
                <a
                  href={plan.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-5 block rounded-lg px-3 py-2.5 text-center text-xs font-bold transition ${
                    plan.featured
                      ? "bg-[#50dca9] text-[#062018] hover:bg-[#79e4b6]"
                      : "border border-white/15 bg-white/[.04] text-white hover:border-[#50dca9]/50 hover:bg-[#50dca9]/10"
                  }`}
                >
                  Escolher {plan.name} <span aria-hidden="true">↗</span>
                </a>
              </article>
            ))}
          </div>
          <p className="mt-6 text-xs leading-6 text-white/40">
            Selecione o período desejado para continuar no checkout seguro da Kiwify.
          </p>
        </div>
      </section>

      <section id="duvidas" className="scroll-mt-20 bg-[#f3f5f0] py-20 text-[#14251d] md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#137650]">
              Dúvidas frequentes
            </span>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-.05em] md:text-5xl">
              Antes de começar.
            </h2>
          </div>
          <div className="divide-y divide-[#d9e1d8] border-y border-[#d9e1d8]">
            {questions.map(({ question, answer }) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-sm font-semibold marker:hidden sm:text-base">
                  {question}
                  <span aria-hidden="true" className="text-xl font-normal text-[#168457] group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pt-3 text-sm leading-7 text-[#647369]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="pn-landing-footer border-t border-white/10 bg-[#0b1511] text-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-12 md:px-8 lg:py-16">
          <div className="grid gap-9 text-left md:grid-cols-2 lg:grid-cols-[1.25fr_.65fr_1fr] lg:gap-14">
            <div className="min-w-0">
              <Brand />
              <p className="mt-5 max-w-[390px] text-sm leading-7 text-white/50">
                Crie páginas, organize seus projetos e concentre sua operação digital em um único espaço.
              </p>
              <div className="mt-7">
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/45">
                  Formas de pagamento
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Formas de pagamento aceitas">
                  {PAYMENT_BRANDS.map((brand) => <PaymentBrand key={brand} brand={brand} />)}
                </div>
                <p className="mt-3 text-[11px] leading-5 text-white/30">
                  Pagamento processado com segurança pela Kiwify.
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-left text-xs font-bold uppercase tracking-[.18em] text-[#50dca9]">Navegação</p>
              <nav className="mt-5 flex flex-col items-start gap-3.5 text-sm text-white/60" aria-label="Rodapé">
                <a href="#plataforma" className="transition hover:text-white">Plataforma</a>
                <a href="#planos" className="transition hover:text-white">Planos</a>
                <a href="#duvidas" className="transition hover:text-white">Dúvidas frequentes</a>
                <Link href="/app" className="transition hover:text-white">Entrar</Link>
              </nav>
            </div>

            <div className="min-w-0">
              <p className="text-left text-xs font-bold uppercase tracking-[.18em] text-[#50dca9]">Empresa</p>
              <div className="mt-5 grid gap-4 text-left">
                <div>
                  <p className="text-sm font-semibold text-white/75">Localização</p>
                  <p className="mt-1 max-w-[310px] text-xs leading-5 text-white/45">
                    Rua Dr. Amâncio de Carvalho<br />
                    São Bernardo do Campo — SP
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/75">CNPJ</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">65.879.205/0001-34</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/75">Suporte</p>
                  <div className="mt-1 flex flex-col items-start gap-1 text-xs leading-5 text-white/45">
                    <a
                      href="https://wa.me/5521987627887"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:text-[#50dca9]"
                    >
                      WhatsApp: +55 21 98762-7887
                    </a>
                    <a
                      href="mailto:suporte@pagenovaai.com.br"
                      className="break-all transition hover:text-[#50dca9]"
                    >
                      suporte@pagenovaai.com.br
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/75">Checkout</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">Compra processada pela Kiwify.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 sm:mt-12">
            <div className="flex flex-col gap-2 text-[11px] leading-5 text-white/35 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 PageNova AI. Todos os direitos reservados.</p>
              <p className="text-white/25">Landing Page Studio</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}