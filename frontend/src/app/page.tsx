import { PageNovaLandingMotion, PageNovaVideoShowcase } from "@/components/pagenova-landing-motion";
import Link from "next/link";
import { PageNovaCreationDemo } from "@/components/pagenova-creation-demo";
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

const showcaseFlows = [
  { number:"01", label:"CRIAÇÃO COM IA", title:"Do briefing à primeira versão", description:"Escolha o tipo de página e descreva seu negócio. A IA organiza a estrutura para você revisar." },
  { number:"02", label:"EDIÇÃO VISUAL", title:"Refine sem recomeçar", description:"Altere textos, imagens, seções e a identidade visual do projeto depois de gerar." },
  { number:"03", label:"SITES PROFISSIONAIS", title:"Publique a sua presença digital", description:"Transforme uma ideia em um site editável e acompanhe suas versões no mesmo espaço." },
  { number:"04", label:"LANDING PAGES", title:"Páginas orientadas à conversão", description:"Estruture ofertas, benefícios e chamadas para ação com uma apresentação clara." },
  { number:"05", label:"QUIZZES E FORMULÁRIOS", title:"Colete informações com facilidade", description:"Crie jornadas de perguntas e formulários que fazem parte da sua operação." },
  { number:"06", label:"EBOOKS COM IA", title:"Conteúdo com identidade própria", description:"Monte ebooks, revise capítulos e personalize o visual antes de exportar." },
  { number:"07", label:"CRM DE VENDAS", title:"Organize os próximos contatos", description:"Mantenha leads e oportunidades por etapa, com contexto para continuar o atendimento." },
  { number:"08", label:"AGENDA", title:"Mais clareza na rotina", description:"Visualize compromissos, serviços e horários sem alternar de ferramenta." },
] as const;

const questions = [
  {
    question: "O que posso criar na PageNova?",
    answer: "Você pode criar sites institucionais, landing pages, quizzes, formulários e ebooks com IA, além de clonar páginas para edição e organizar sua operação com CRM, agenda e projetos.",
  },
  {
    question: "Preciso saber programar?",
    answer: "Não. A PageNova foi feita para você partir de um briefing, gerar a primeira versão e continuar os ajustes pela interface visual.",
  },
  {
    question: "Consigo editar o site depois de criá-lo?",
    answer: "Sim. Você pode voltar aos projetos salvos e continuar refinando textos, seções e outros elementos disponíveis no editor.",
  },
  {
    question: "Onde ficam meus projetos, CRM e agenda?",
    answer: "Os dados ficam vinculados à sua conta e ao seu espaço de trabalho na PageNova, para você continuar sua operação depois.",
  },
  {
    question: "A PageNova serve apenas para landing pages?",
    answer: "Não. Você também encontra sites institucionais, quizzes, formulários, ebooks, clonagem e edição visual, CRM e agenda.",
  },
  {
    question: "Como funcionam os planos?",
    answer: "Você escolhe entre mensal, trimestral, semestral e anual. Os ciclos maiores reduzem o custo mensal equivalente e o pagamento é concluído no checkout seguro da Kiwify.",
  },
  {
    question: "Quando vou receber acesso à plataforma?",
    answer: "Após a confirmação do pagamento, faça seu cadastro com o mesmo e-mail da compra. O acesso é vinculado à assinatura ativa.",
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
  return <PageNovaCreationDemo />;
}

export default function Home() {
  return (
    <main className="pn-mobile-centered pn-landing-v2 min-h-screen overflow-x-clip bg-[#07110e] font-sans text-[#f2f6f1]"><PageNovaLandingMotion />
      <header className="sticky top-0 z-50 border-b border-white/[.08] bg-[#07110e]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2.5 px-4 sm:gap-5 sm:px-6 md:px-8">
          <Link href="/" aria-label="PageNova AI, início" className="min-w-0 shrink [&_img]:h-10 [&_img]:max-w-[135px] sm:shrink-0 sm:[&_img]:h-11 sm:[&_img]:max-w-[165px]"><Brand /></Link>
          <nav aria-label="Menu principal" className="hidden items-center gap-7 text-[13px] text-white/60 lg:flex">
            <a href="#plataforma" className="hover:text-white">Plataforma</a>
            <a href="#criacao" className="hover:text-white">Criação</a>
            <a href="#operacao" className="hover:text-white">Operação</a>
            <a href="#planos" className="hover:text-white">Planos</a>
            <a href="#duvidas" className="hover:text-white">Dúvidas</a>
          </nav>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link href="/cadastro" className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-xl bg-[#36d9a1] px-2.5 py-2.5 text-[11px] font-bold text-[#062018] transition hover:bg-[#7debc0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7debc0] sm:px-5 sm:text-sm">
              Cadastre-se
            </Link>
            <Link href="/login" className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-xl border border-white/25 bg-white/[.035] px-2.5 py-2.5 text-[11px] font-semibold text-white transition hover:border-[#75e8b7] hover:bg-white/[.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7debc0] sm:px-5 sm:text-sm">
              Login
            </Link>
          </div>
        </div>
      </header>

      <section id="plataforma" className="relative overflow-hidden border-b border-white/[.07]">
        <div className="pointer-events-none absolute -right-32 top-0 h-[550px] w-[650px] rounded-full bg-[#0b7b55]/20 blur-[130px]" />
        <div className="pointer-events-none absolute -left-64 bottom-0 h-[360px] w-[550px] rounded-full bg-[#00aa78]/10 blur-[110px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-9 px-5 pb-14 pt-14 md:px-8 md:pb-20 md:pt-20 lg:grid-cols-[.85fr_1.15fr] lg:gap-16 lg:pb-24 lg:pt-24">
          <div>
            <SectionLabel>Seu espaço para criar e evoluir</SectionLabel>
            <h1 className="mt-5 max-w-xl text-[clamp(2.45rem,5.2vw,5rem)] font-semibold leading-[1.04] tracking-[-.055em]">
              Sua ideia ganha forma.{" "}
              <span className="text-[#68e6b6]">Seu trabalho ganha ritmo.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-7 text-white/58 sm:text-base sm:leading-8">
              Crie sites, landing pages, quizzes, formulários e ebooks com IA. Edite o resultado e organize leads e agendamentos em um só lugar.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#criacao" className="rounded-xl bg-[#36d9a1] px-6 py-3.5 text-sm font-bold text-[#062018] transition hover:bg-[#7debc0]">
                Explorar a plataforma →
              </a>
              <a href="#planos" className="rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white/80 transition hover:border-[#75e8b7] hover:text-white">
                Ver os planos
              </a>
            </div>
            <p className="mt-6 text-xs text-white/40">
              Sites com IA · Landing pages · Ebooks · CRM · Agenda
            </p>
          </div>
          <ProductFrame />
        </div>
      </section>

      <section id="criacao" className="scroll-mt-20 bg-[#f3f5f0] py-14 text-[#14251d] md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#137650]">
                01 / Criação
              </span>
              <h2 className="mt-4 max-w-lg text-[2.15rem] font-semibold leading-[1.1] tracking-[-.045em] md:text-5xl">
                Comece pela página que seu negócio precisa.
              </h2>
            </div>
            <p className="max-w-xl self-end text-base leading-8 text-[#586a5e]">
              Escolha um caminho, ajuste o briefing e acompanhe a criação. Você pode
              continuar editando depois que a primeira versão aparecer.
            </p>
          </div>

          <div className="mt-8 grid overflow-hidden rounded-[22px] border border-[#d7e1d7] bg-white lg:mt-12 lg:grid-cols-3">
            {[
              ["Sites e landing pages", "Crie sites institucionais e páginas de oferta com um briefing direcionado ao seu negócio.", "Briefing → estrutura → prévia"],
              ["Quizzes, formulários e ebooks", "Produza conteúdos, colete respostas e prepare materiais editáveis com o auxílio da IA.", "Ideia → conteúdo → personalização"],
              ["Clonar e editar", "Use uma URL como ponto de partida para um projeto editável e ajuste textos, imagens e links.", "URL → projeto → editor"],
            ].map(([title, description, path], index) => (
              <article key={title} className={`p-6 md:p-9 ${index < 2 ? "border-b border-[#e4e9e2] lg:border-b-0 lg:border-r" : ""}`}>
                <span className="text-xs font-bold text-[#178759]">0{index + 1}</span>
                <h3 className="mt-5 text-xl font-semibold tracking-[-.035em] md:mt-10 md:text-2xl">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#607064] md:min-h-24 md:leading-7">{description}</p>
                <p className="mt-5 border-t border-[#e9eee8] pt-4 text-xs font-semibold text-[#187552]">{path}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-mt-20 border-y border-white/[.07] bg-[#0a1b14] py-14 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 md:px-8 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionLabel>O processo aparece na tela</SectionLabel>
            <h2 className="mt-4 max-w-lg text-[2.15rem] font-semibold leading-[1.1] tracking-[-.045em] md:text-5xl">
              Você acompanha a construção.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-white/55">
              O briefing já traz uma base para o nicho escolhido. Você personaliza
              a direção do projeto, gera as páginas e navega pela prévia para revisar o resultado.
            </p>
            <a href="#planos" className="mt-8 inline-flex text-sm font-semibold text-[#74e6b6] hover:text-white">Conhecer os planos →</a>
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

      <section id="operacao" className="scroll-mt-20 bg-[#f3f5f0] py-14 text-[#14251d] md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#137650]">
              02 / Operação
            </span>
            <h2 className="mt-4 max-w-lg text-[2.15rem] font-semibold leading-[1.1] tracking-[-.045em] md:text-5xl">
              Depois de publicar a ideia, organize o trabalho.
            </h2>
            <p className="mt-6 max-w-md text-base leading-8 text-[#586a5e]">
              Criação e operação comercial se encontram no mesmo produto. Comece com o que precisa agora e evolua no seu ritmo.
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
          CRM, leads e agenda ficam vinculados à sua conta e ao seu espaço de trabalho.
        </p>
      </section>

      <PageNovaVideoShowcase />
      <section id="planos" className="scroll-mt-20 border-t border-white/[.07] bg-[#081710] py-14 md:py-24">
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
          <div className="mt-7 grid grid-cols-2 gap-2.5 md:mt-10 md:grid-cols-2 md:gap-3 xl:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`flex flex-col rounded-[16px] border p-4 sm:p-5 ${
                  plan.featured
                    ? "border-[#50dca9]/60 bg-[#123729]"
                    : "border-white/10 bg-[#0d2117]"
                }`}
              >
                <div className="flex min-h-7 items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-white/85 sm:text-sm">{plan.name}</h3>
                  {plan.featured && (
                    <span className="rounded-full bg-[#40dfa5] px-2.5 py-1 text-[10px] font-bold text-[#082219]">
                      Destaque
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-baseline gap-1 sm:mt-5 sm:gap-1.5">
                  <strong className="text-[26px] font-semibold tracking-[-.05em] sm:text-[32px]">{plan.price}</strong>
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

      <section className="overflow-hidden border-t border-white/[.07] bg-[#0b1c15] py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionLabel>Tudo em um só lugar</SectionLabel>
          <h2 className="mt-4 max-w-2xl text-[2.15rem] font-semibold leading-[1.08] tracking-[-.045em] md:text-5xl">
            Cada ideia encontra seu próprio caminho.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
            Da criação ao relacionamento com seus clientes: conheça os fluxos que você pode reunir na PageNova.
          </p>
        </div>

        <div className="pn-testimonials-viewport mt-8">
          <div className="pn-testimonials-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="pn-testimonials-set" aria-hidden={copy > 0}>
                {showcaseFlows.map((item) => (
                  <article key={`${copy}-${item.number}`} className="pn-testimonial-card">
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#67e4b3]/25 bg-[#49dba5]/10 text-lg font-bold text-[#7ceac2]">{item.number}</span>
                      <span className="rounded-full border border-[#50dca9]/20 bg-[#50dca9]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#9cf3cf]">{item.label}</span>
                    </div>
                    <h3 className="mt-6 text-left text-[19px] font-semibold leading-snug tracking-[-.03em] text-white">{item.title}</h3>
                    <p className="mt-3 text-left text-sm leading-6 text-white/70">{item.description}</p>
                    <div className="mt-5 border-t border-white/10 pt-3 text-left text-[11px] font-semibold text-[#7ceac2]">Funcionalidade da PageNova <span aria-hidden="true">↗</span></div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>

        <style>{`
          .pn-testimonials-viewport {
            width: 100%;
            overflow: hidden;
            -webkit-mask-image: none;
            mask-image: none;
          }
          .pn-testimonials-track {
            display: flex;
            width: max-content;
            animation: pnTestimonialsMarquee 52s linear infinite;
            will-change: transform;
          }
          .pn-testimonials-set {
            display: flex;
            flex-shrink: 0;
            gap: 16px;
            padding-right: 16px;
          }
          .pn-testimonial-card {
            width: min(86vw, 390px);
            min-height: 280px;
            flex: 0 0 auto;
            border: 1px solid rgba(80,220,169,.34);
            border-radius: 24px;
            padding: 20px;
            background: #102a20;
            color: #fff;
            box-shadow: 0 14px 32px rgba(0,0,0,.26);
            -webkit-font-smoothing: antialiased;
            text-rendering: geometricPrecision;
          }
          @keyframes pnTestimonialsMarquee {
            from { transform: translate3d(0,0,0); }
            to { transform: translate3d(-50%,0,0); }
          }
          @media (max-width: 767px) {
            .pn-testimonials-track { animation-duration: 48s; }
            .pn-testimonial-card { width: min(84vw,340px); min-height: 285px; padding: 22px; }
          }
          @media (prefers-reduced-motion: reduce) {
            .pn-testimonials-track { animation: none; max-width: 100vw; }
          }
        `}</style>
      </section>

      <section id="garantia" aria-label="Garantia de satisfação de 7 dias" className="bg-[#f5f8f3] py-10 md:py-16">
        <div className="mx-auto w-full max-w-[920px] px-3 sm:px-6">
          <a
            href="#planos"
            aria-label="Garantia PageNova de 7 dias. Ver opções de planos."
            className="group relative block cursor-pointer rounded-2xl outline-offset-4 transition-transform duration-200 hover:scale-[1.006] focus-visible:outline-2 focus-visible:outline-[#148453] motion-reduce:transform-none"
          >
            <img
              src="/guarantees/garantia-pagenova-interativa.svg"
              alt="7 dias para conhecer a PageNova com tranquilidade. Pagamento seguro, dados protegidos, suporte e garantia. Ver planos agora."
              width="1122"
              height="1402"
              loading="lazy"
              decoding="async"
              className="block h-auto w-full select-none"
            />
            <img
              src="/guarantees/guarantee-7.png"
              alt=""
              aria-hidden="true"
              width="380"
              height="380"
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute left-1/2 top-[1.8%] w-[33%] -translate-x-1/2 object-contain drop-shadow-[0_14px_24px_rgba(56,39,9,0.16)]"
            />
          </a>
        </div>
      </section>

      <section id="duvidas" className="scroll-mt-20 bg-[#f3f5f0] py-12 text-[#14251d] md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-4 border-b border-[#d9e1d8] pb-7 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#137650]">
                Dúvidas frequentes
              </span>
              <h2 className="mt-3 text-[2.15rem] font-semibold leading-tight tracking-[-.045em] md:text-5xl">
                Ficou alguma dúvida?
              </h2>
            </div>
            <p className="max-w-xl text-left text-sm leading-6 text-[#647369] lg:justify-self-end">
              Respostas rápidas sobre criação, edição, seus dados e os planos da PageNova.
            </p>
          </div>
          <div className="mt-4 grid gap-2 lg:grid-cols-2 lg:gap-3">
            {questions.map(({ question, answer }) => (
              <details key={question} className="group rounded-2xl border border-[#d9e1d8] bg-white px-5 shadow-[0_1px_0_rgba(20,37,29,.02)] open:border-[#b8d9ca] open:bg-[#fbfdfb]">
                <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-4 text-left text-[15px] font-semibold leading-5 marker:hidden">
                  <span>{question}</span>
                  <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eaf5ef] text-xl font-normal text-[#168457] transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="border-t border-[#e7ece8] pb-5 pt-4 text-left text-sm leading-6 text-[#647369]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="pn-landing-footer border-t border-white/10 bg-[#0b1511] text-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-7 md:px-8 md:py-10">
          <div className="grid grid-cols-2 gap-x-7 gap-y-7 text-left lg:grid-cols-[1.25fr_.65fr_1fr] lg:gap-12">
            <div className="col-span-2 min-w-0 text-center lg:col-span-1 lg:text-left">
              <div className="flex justify-center lg:justify-start"><Brand /></div>
              <p className="mx-auto mt-3 max-w-[430px] text-xs leading-5 text-white/50 lg:mx-0 sm:text-sm">
                Crie, publique e organize sua operação digital em um único espaço.
              </p>
              <div className="mt-4 border-t border-white/[.08] pt-4">
                <p className="text-[9px] font-bold uppercase tracking-[.17em] text-white/40">Pagamento seguro</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 lg:justify-start" aria-label="Formas de pagamento aceitas">
                  {PAYMENT_BRANDS.map((brand) => <PaymentBrand key={brand} brand={brand} />)}
                </div>
                <p className="mt-2 text-[10px] leading-4 text-white/30">Checkout processado pela Kiwify.</p>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#50dca9]">Navegação</p>
              <nav className="mt-3 flex flex-col items-start gap-2.5 text-xs text-white/60 sm:text-sm" aria-label="Rodapé">
                <a href="#plataforma" className="transition hover:text-white">Plataforma</a>
                <a href="#criacao" className="transition hover:text-white">Criação</a>
                <a href="#planos" className="transition hover:text-white">Planos</a>
                <a href="#duvidas" className="transition hover:text-white">Dúvidas</a>
              </nav>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#50dca9]">Empresa</p>
              <div className="mt-3 grid gap-3 text-left text-[11px] leading-4 text-white/45 sm:text-xs">
                <div>
                  <p className="font-semibold text-white/75">Localização</p>
                  <p className="mt-1">São Bernardo do Campo — SP</p>
                </div>
                <div>
                  <p className="font-semibold text-white/75">CNPJ</p>
                  <p className="mt-1">65.879.205/0001-34</p>
                </div>
                <div>
                  <p className="font-semibold text-white/75">Suporte</p>
                  <div className="mt-1 flex flex-col items-start gap-1">
                    <a href="https://wa.me/5521987627887" target="_blank" rel="noopener noreferrer" className="transition hover:text-[#50dca9]">WhatsApp</a>
                    <a href="mailto:suporte@pagenovaai.com.br" className="break-all transition hover:text-[#50dca9]">suporte@pagenovaai.com.br</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-1 border-t border-white/10 pt-4 text-center text-[10px] leading-4 text-white/35 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p>© 2026 PageNova AI. Todos os direitos reservados.</p>
            <p className="text-white/25">Landing Page Studio</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:ml-auto sm:max-w-[360px]" aria-label="Selos de confiança">
            <div className="flex h-[68px] items-center justify-center rounded-2xl border border-white/10 bg-white px-4 shadow-[0_10px_28px_rgba(0,0,0,.16)]" title="Norton">
              <img src="/trust/norton.svg" alt="Norton" className="h-[42px] w-full object-contain" />
            </div>
            <div className="flex h-[68px] items-center justify-center rounded-2xl border border-white/10 bg-white px-4 shadow-[0_10px_28px_rgba(0,0,0,.16)]" title="Reclame Aqui">
              <img src="/trust/reclame-aqui.svg" alt="Reclame Aqui" className="h-[52px] w-full object-contain" />
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
