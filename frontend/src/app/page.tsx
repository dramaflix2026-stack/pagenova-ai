import type {Metadata} from "next";
import { PageNovaLandingMotion, PageNovaVideoShowcase } from "@/components/pagenova-landing-motion";
import Link from "next/link";
import { PageNovaCreationDemo } from "@/components/pagenova-creation-demo";
import {PageNovaCountryMarquee} from "@/components/pagenova-country-marquee";
import { PAYMENT_BRANDS, PaymentBrand } from "@/components/payment-brands";

export const metadata:Metadata={alternates:{canonical:"/",languages:{"pt-BR":"/","en":"/en","es":"/es"}}};

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
    question: "Como funciona o teste grátis de 5 dias?",
    answer: "Crie uma conta, confirme o e-mail e acesse o painel. O teste começa no primeiro acesso, dura 120 horas e oferece 2 gerações de sites pelo CRM e 5 páginas de pesquisa Google Places, além das ferramentas locais.",
  },
  {
    question: "Preciso de cartão ou serei cobrado após 5 dias?",
    answer: "Não. O teste não pede cartão e termina automaticamente, sem cobranças. Seus projetos ficam preservados para quando decidir assinar.",
  },
  {
    question: "Quando recebo acesso à assinatura paga?",
    answer: "Após a confirmação do pagamento na Kiwify, entre com o mesmo e-mail que usou na PageNova. A assinatura paga substitui os limites do teste, sem apagar seus projetos.",
  },
];

function Brand() {
  return (
    <img
      src="/brand/pagenova-logo.png"
      alt="PageNova AI"
      width={210}
      height={64}
      className="pn-brand-logo h-11 w-auto max-w-[165px] object-contain object-left sm:h-12 sm:max-w-[190px]"
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8fec78]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#8fec78]" />
      {children}
    </span>
  );
}

function ProductFrame() {
  return <PageNovaCreationDemo />;
}

export default function Home() {
  return (
    <main className="pn-mobile-centered pn-landing-v2 min-h-screen overflow-x-clip bg-[#0b100d] font-sans text-[#f2f6f1]"><PageNovaLandingMotion />
      <header className="sticky top-0 z-50 border-b border-white/[.08] bg-[#0b100d]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2.5 px-4 sm:gap-5 sm:px-6 md:px-8">
          <Link href="/" aria-label="PageNova AI, início" className="min-w-0 shrink [&_img]:h-10 [&_img]:max-w-[135px] sm:shrink-0 sm:[&_img]:h-11 sm:[&_img]:max-w-[165px]"><Brand /></Link>
          <nav aria-label="Menu principal" className="hidden items-center gap-5 text-[13px] text-white/60 2xl:flex">
            <a href="#plataforma" className="hover:text-white">Plataforma</a>
            <a href="#criacao" className="hover:text-white">Criação</a>
            <a href="#operacao" className="hover:text-white">Operação</a>
            <a href="#planos" className="hover:text-white">Planos</a>
            <a href="#duvidas" className="hover:text-white">Dúvidas</a>
             <Link href="/afiliados" className="hover:text-[#8fec78]">Afiliados</Link>
          </nav>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link href="/cadastro?trial=1" className="pn-brand-button inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-xl bg-[#8fec78] px-2.5 py-2.5 text-[11px] font-bold text-[#14220f] transition hover:bg-[#a8f494] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8f494] sm:px-5 sm:text-sm">
              Testar 5 dias grátis
            </Link>
            <Link href="/login" className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-xl border border-white/25 bg-white/[.035] px-2.5 py-2.5 text-[11px] font-semibold text-white transition hover:border-[#a8f494] hover:bg-white/[.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8f494] sm:px-5 sm:text-sm">
              Login
            </Link>
             <nav aria-label="Idioma da página" className="hidden items-center gap-1 text-xs font-semibold text-white/55 md:flex">
               <span aria-current="page" className="rounded-md bg-[#8fec78]/15 px-1.5 py-2 text-[#8fec78]">PT</span>
               <a href="/api/site-language?lang=en" hrefLang="en" className="px-1.5 py-2 hover:text-white">EN</a>
               <a href="/api/site-language?lang=es" hrefLang="es" className="px-1.5 py-2 hover:text-white">ES</a>
             </nav>
          </div>
        </div>
      </header>

      <section id="plataforma" className="relative overflow-hidden border-b border-white/[.07]">
        <div className="pointer-events-none absolute -right-32 top-0 h-[550px] w-[650px] rounded-full bg-[#3e7838]/20 blur-[130px]" />
        <div className="pointer-events-none absolute -left-64 bottom-0 h-[360px] w-[550px] rounded-full bg-[#5ba949]/10 blur-[110px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-9 px-5 pb-14 pt-14 md:px-8 md:pb-20 md:pt-20 lg:grid-cols-1 lg:gap-9 lg:pb-24 lg:pt-24">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center"> 
            <SectionLabel>Seu espaço para criar e evoluir</SectionLabel>
            <h1 className="mt-5 max-w-4xl text-[clamp(2.45rem,5vw,4.75rem)] font-semibold leading-[1.08] tracking-[-.055em]">
              Sua ideia ganha forma.{" "}
              <span className="text-[#a8f494]">Seu trabalho ganha ritmo.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/58 sm:text-lg sm:leading-8">
              Crie sites, landing pages, quizzes, formulários e ebooks com IA. Edite o resultado e organize leads e agendamentos em um só lugar.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/cadastro?trial=1" className="pn-brand-button rounded-xl bg-[#8fec78] px-6 py-3.5 text-sm font-bold text-[#14220f] transition hover:bg-[#a8f494]">
                Começar meus 5 dias grátis →
              </Link>
              <a href="#planos" className="rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white/80 transition hover:border-[#a8f494] hover:text-white">
                Ver os planos
              </a>
            </div>
            <p className="mt-6 text-xs text-white/40">
              Teste grátis sem cartão · 2 sites pelo CRM · 5 páginas Google Places · Sem cobrança automática
            </p>
          </div>
          <div className="min-w-0 w-full"><PageNovaCountryMarquee lang="pt" /></div>
          <div className="mx-auto w-full min-w-0 max-w-4xl"><ProductFrame /></div>
        </div>
      </section>

      <section aria-labelledby="pn-audience-heading" className="border-b border-white/[.08] bg-[#101b14] px-5 py-10 md:py-14">
        <div className="mx-auto max-w-7xl">
          <span className="text-[11px] font-bold uppercase tracking-[.16em] text-[#8fec78]">Para quem é a PageNova?</span>
          <h2 id="pn-audience-heading" className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Seu negócio, suas ideias, seu próximo projeto.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">Uma estrutura para criar páginas, experimentar ofertas e organizar contatos sem depender de várias ferramentas.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Prestadores de serviços","Negócios locais","Infoprodutores","Afiliados","Agências","Freelancers","Pequenas empresas"].map(name=><span key={name} className="rounded-full border border-[#8fec78]/20 bg-[#8fec78]/[.07] px-3 py-2 text-xs font-semibold text-[#d5f5ca]">{name}</span>)}
          </div>
          <p className="mt-5 text-xs leading-6 text-white/45">Site comercial em português, inglês e espanhol. A pesquisa de empresas permite selecionar países internacionais no CRM; os recursos internos ainda estão em processo de tradução.</p>
        </div>
      </section>

      <section id="criacao" className="scroll-mt-20 bg-[#f3f5f0] py-14 text-[#14251d] md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#3e7838]">
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
                <span className="text-xs font-bold text-[#467f3b]">0{index + 1}</span>
                <h3 className="mt-5 text-xl font-semibold tracking-[-.035em] md:mt-10 md:text-2xl">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#607064] md:min-h-24 md:leading-7">{description}</p>
                <p className="mt-5 border-t border-[#e9eee8] pt-4 text-xs font-semibold text-[#3e7838]">{path}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-mt-20 border-y border-white/[.07] bg-[#0b100d] py-14 md:py-24">
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
            <a href="#planos" className="mt-8 inline-flex text-sm font-semibold text-[#a8f494] hover:text-white">Conhecer os planos →</a>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[#142019] p-5 sm:p-8">
            {[
              ["01", "Escolher o tipo", "Selecione o segmento ou comece por uma landing page."],
              ["02", "Ajustar o briefing", "Defina nome, proposta e informações do negócio."],
              ["03", "Gerar e acompanhar", "Veja as páginas aparecerem e abra a prévia."],
              ["04", "Refinar", "Edite os detalhes e continue trabalhando no projeto."],
            ].map(([number, title, description], index) => (
              <div key={number} className={`flex gap-5 py-4 ${index < 3 ? "border-b border-white/10" : ""}`}>
                <span className="mt-1 text-xs font-bold text-[#a8f494]">{number}</span>
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
            <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#3e7838]">
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
                <span className="text-xs font-bold text-[#467f3b]">{number}</span>
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
                    ? "border-[#8fec78]/60 bg-[#123729]"
                    : "border-white/10 bg-[#0d2117]"
                }`}
              >
                <div className="flex min-h-7 items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-white/85 sm:text-sm">{plan.name}</h3>
                  {plan.featured && (
                    <span className="rounded-full bg-[#8fec78] px-2.5 py-1 text-[10px] font-bold text-[#14220f]">
                      Destaque
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-baseline gap-1 sm:mt-5 sm:gap-1.5">
                  <strong className="text-[26px] font-semibold tracking-[-.05em] sm:text-[32px]">{plan.price}</strong>
                  <span className="text-xs text-white/45">{plan.cycle}</span>
                </div>
                <p className="mt-2 text-xs text-white/55">{plan.equivalent}</p>
                <p className="mt-5 text-xs font-semibold text-[#a8f494]">{plan.saving}</p>
                <a
                  href={plan.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-5 block rounded-lg px-3 py-2.5 text-center text-xs font-bold transition ${
                    plan.featured
                      ? "bg-[#8fec78] text-[#14220f] hover:bg-[#a8f494]"
                      : "border border-white/15 bg-white/[.04] text-white hover:border-[#8fec78]/50 hover:bg-[#8fec78]/10"
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

      <section className="overflow-hidden border-t border-white/[.07] bg-[#0b100d] py-12 md:py-20">
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
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#a8f494]/25 bg-[#8fec78]/10 text-lg font-bold text-[#a8f494]">{item.number}</span>
                      <span className="rounded-full border border-[#8fec78]/20 bg-[#8fec78]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#c6f8ad]">{item.label}</span>
                    </div>
                    <h3 className="mt-6 text-left text-[19px] font-semibold leading-snug tracking-[-.03em] text-white">{item.title}</h3>
                    <p className="mt-3 text-left text-sm leading-6 text-white/70">{item.description}</p>
                    <div className="mt-5 border-t border-white/10 pt-3 text-left text-[11px] font-semibold text-[#a8f494]">Funcionalidade da PageNova <span aria-hidden="true">↗</span></div>
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
            background: #18271d;
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
              <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#3e7838]">
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
                  <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eaf5ef] text-xl font-normal text-[#467f3b] transition group-open:rotate-45">
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
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start" aria-label="Formas de pagamento aceitas">
                  {PAYMENT_BRANDS.map((brand) => <PaymentBrand key={brand} brand={brand} />)}
                </div>
                <p className="mt-2 text-[10px] leading-4 text-white/30">Checkout processado pela Kiwify.</p>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#8fec78]">Navegação</p>
              <nav className="mt-3 flex flex-col items-start gap-2.5 text-xs text-white/60 sm:text-sm" aria-label="Rodapé">
                <a href="#plataforma" className="transition hover:text-white">Plataforma</a>
                <a href="#criacao" className="transition hover:text-white">Criação</a>
                <a href="#planos" className="transition hover:text-white">Planos</a>
                <a href="#duvidas" className="transition hover:text-white">Dúvidas</a>
                <Link href="/afiliados" className="transition hover:text-[#8fec78]">Seja um afiliado</Link>
                <div aria-label="Idioma da página" className="mt-2 flex items-center gap-3 text-xs font-semibold">
                  <span aria-current="page" className="text-[#8fec78]">Português</span>
                  <a href="/api/site-language?lang=en" hrefLang="en" className="hover:text-white">English</a>
                  <a href="/api/site-language?lang=es" hrefLang="es" className="hover:text-white">Español</a>
                </div>
              </nav>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#8fec78]">Empresa</p>
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
                    <a href="https://wa.me/5521987627887" target="_blank" rel="noopener noreferrer" className="transition hover:text-[#8fec78]">WhatsApp</a>
                    <a href="mailto:suporte@pagenovaai.com.br" className="break-all transition hover:text-[#8fec78]">suporte@pagenovaai.com.br</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-1 border-t border-white/10 pt-4 text-center text-[10px] leading-4 text-white/35 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p>© 2026 PageNova AI. Todos os direitos reservados.</p>
            <p className="text-white/25">Landing Page Studio</p>
          </div>

          <div className="mt-6 grid w-full grid-cols-2 gap-3 sm:ml-auto sm:max-w-[410px]" aria-label="Selos de confiança">
            <div className="flex h-[68px] min-w-0 items-center justify-center rounded-2xl border border-[#a8f494]/20 bg-[#142019] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]" title="Norton">
              <img src="/trust/norton.svg" alt="Norton" width="383" height="88" loading="lazy" className="block h-auto max-h-11 w-full object-contain" />
            </div>
            <div className="flex h-[68px] min-w-0 items-center justify-center rounded-2xl border border-[#a8f494]/20 bg-[#142019] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]" title="Reclame Aqui">
              <img src="/trust/reclame-aqui.svg" alt="Reclame Aqui" width="620" height="112" loading="lazy" className="block h-auto max-h-10 w-full object-contain" />
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
