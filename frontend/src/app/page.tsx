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

const testimonialMocks = [
  ["Mariana Oliveira","São Paulo — SP","A PageNova deixou muito mais simples tirar uma landing page do papel e continuar os ajustes no mesmo lugar."],
  ["Carlos Mendes","Belo Horizonte — MG","Consegui organizar meus projetos, páginas e contatos sem ficar alternando entre várias ferramentas."],
  ["Juliana Costa","Curitiba — PR","O fluxo de criação é direto. Começo pelo briefing, gero a base e depois consigo refinar o conteúdo."],
  ["Rafael Almeida","Campinas — SP","A parte de sites com IA acelerou bastante a primeira versão e me deu uma base boa para editar."],
  ["Camila Ferreira","Florianópolis — SC","Gostei de concentrar criação e organização comercial no mesmo painel. Ficou muito mais prático."],
  ["Bruno Martins","Rio de Janeiro — RJ","Eu precisava ganhar velocidade para testar páginas e a PageNova tornou esse processo bem mais organizado."],
  ["Larissa Souza","Goiânia — GO","A interface é simples de entender e consigo voltar aos projetos para continuar trabalhando quando preciso."],
  ["Felipe Rocha","Porto Alegre — RS","O CRM junto com as páginas facilita muito acompanhar o que estou criando para cada oportunidade."],
  ["Amanda Ribeiro","Recife — PE","O que mais gostei foi poder partir de uma estrutura pronta e personalizar sem precisar começar tudo do zero."],
  ["Diego Carvalho","Salvador — BA","A PageNova reuniu etapas que antes eu fazia separadas. Hoje meu processo de criação está bem mais enxuto."],
  ["Beatriz Lima","Fortaleza — CE","Criar a primeira versão ficou rápido e depois consigo revisar textos e seções com muito mais tranquilidade."],
  ["Lucas Nogueira","Brasília — DF","Uso para organizar ideias e transformar briefing em página. Economiza bastante tempo no começo do projeto."],
  ["Isabela Moreira","Vitória — ES","A experiência ficou muito mais fluida do que montar cada parte manualmente em ferramentas diferentes."],
  ["Gustavo Barros","Santos — SP","Gostei principalmente da continuidade: crio, salvo e depois volto para editar o mesmo projeto."],
  ["Natália Correia","Niterói — RJ","A plataforma me ajuda a manter páginas, contatos e tarefas mais organizados em um único ambiente."],
  ["Henrique Duarte","Londrina — PR","Para validar novas páginas, ter uma primeira versão rapidamente faz muita diferença no meu dia a dia."],
  ["Renata Castro","Joinville — SC","Achei o fluxo bem intuitivo. Mesmo sem programar consigo entender o que fazer em cada etapa."],
  ["Thiago Freitas","Uberlândia — MG","A criação por briefing me ajuda a estruturar melhor a oferta antes de entrar nos detalhes da página."],
  ["Paula Azevedo","Ribeirão Preto — SP","O editor e a organização dos projetos deixaram meu processo menos improvisado e muito mais consistente."],
  ["Eduardo Monteiro","Maringá — PR","Consigo centralizar o trabalho e acompanhar melhor cada projeto sem perder o histórico do que já fiz."],
  ["Carolina Teixeira","João Pessoa — PB","A PageNova tornou a criação mais acessível para mim e ainda deixa espaço para personalizar depois."],
  ["André Cardoso","Sorocaba — SP","Ter criação e CRM próximos ajuda muito quando estou trabalhando páginas para diferentes negócios."],
  ["Letícia Moraes","Campo Grande — MS","A primeira versão sai rápido e eu consigo focar meu tempo no que realmente precisa de ajuste."],
  ["Marcelo Pires","São José dos Campos — SP","O processo ficou mais previsível: briefing, geração, revisão e edição, tudo seguindo uma sequência clara."],
  ["Gabriela Farias","Natal — RN","Gostei de conseguir visualizar o projeto e continuar refinando sem precisar reconstruir a página."],
  ["Vinícius Lopes","Cuiabá — MT","Para quem trabalha com várias ideias ao mesmo tempo, ter os projetos organizados ajuda bastante."],
  ["Priscila Andrade","Belém — PA","A plataforma facilitou meu fluxo e reduziu o tempo que eu gastava montando estruturas repetitivas."],
  ["Rodrigo Vieira","São Luís — MA","Uso a PageNova para acelerar páginas e manter as oportunidades organizadas no CRM."],
  ["Fernanda Campos","Aracaju — SE","Foi fácil entender a proposta e começar. O fato de poder editar depois me dá bastante liberdade."],
  ["Matheus Gonçalves","São Bernardo do Campo — SP","A PageNova me ajuda a transformar uma ideia em algo visual rapidamente e continuar evoluindo o projeto."],
].map(([name, location, quote], index) => ({
  name, location, quote,
  avatar: `https://randomuser.me/api/portraits/${["Mariana","Juliana","Camila","Larissa","Amanda","Beatriz","Isabela","Natália","Renata","Paula","Carolina","Letícia","Gabriela","Priscila","Fernanda"].includes(name.split(" ")[0]) ? "women" : "men"}/${(index * 3 + 7) % 90}.jpg`,
}));

const questions = [
  {
    question: "O que posso criar na PageNova?",
    answer: "Você pode criar landing pages e sites com IA, clonar páginas para edição e organizar sua operação com CRM, agenda e projetos em um só lugar.",
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
    answer: "Não. Além de landing pages, a plataforma reúne criação de sites, clonagem e edição de páginas, CRM, agenda e organização de projetos.",
  },
  {
    question: "Como funcionam os planos?",
    answer: "Você escolhe entre mensal, trimestral, semestral e anual. Os ciclos maiores reduzem o custo mensal equivalente e o pagamento é concluído no checkout seguro da Kiwify.",
  },
  {
    question: "Já tenho cadastro. Como acesso minha conta?",
    answer: "Toque em Entrar no topo da página e use os dados da sua conta para acessar a plataforma e seus projetos.",
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
              <span className="sm:hidden">Cadastre-se</span>
              <span className="hidden sm:inline">Criar minha conta <span aria-hidden="true">→</span></span>
            </a>
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
              Crie páginas e sites, edite o resultado e organize leads e agendamentos
              em um mesmo espaço de trabalho.
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
              Landing pages · Sites por nicho · CRM · Agenda
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
              ["Sites por nicho", "Comece com um briefing voltado ao seu segmento. Imobiliária e SaaS já têm experiências próprias.", "Briefing → páginas → prévia"],
              ["Landing pages", "Gere uma página de oferta a partir das informações do produto ou serviço e refine o conteúdo.", "Oferta → estrutura → edição"],
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
          <SectionLabel>Experiência de quem usa</SectionLabel>
          <h2 className="mt-4 max-w-2xl text-[2.15rem] font-semibold leading-[1.08] tracking-[-.045em] md:text-5xl">
            Histórias de quem constrói com a PageNova.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
            Modelo visual dos depoimentos. Os conteúdos abaixo são demonstrações temporárias e serão substituídos pelas avaliações reais dos clientes.
          </p>
        </div>
        <div className="mt-8 overflow-hidden">
          <div className="flex w-max [animation:pagenova-testimonials_72s_linear_infinite]">
            {[0, 1, 2, 3].map((copy) => (
              <div key={copy} className="flex shrink-0 gap-4 pr-4" aria-hidden={copy > 0}>
                {testimonialMocks.map((item, index) => (
                  <article key={`${copy}-${item.name}`} className="w-[84vw] max-w-[350px] shrink-0 rounded-[24px] border border-[#50dca9]/20 bg-[linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025))] p-5 shadow-[0_18px_48px_rgba(0,0,0,.20)]">
                    <div className="flex items-center gap-3">
                      <img src={item.avatar} alt="" className="h-14 w-14 shrink-0 rounded-full border border-[#50dca9]/35 bg-[#10261d] object-cover" loading="lazy" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{item.name}</p>
                        <p className="mt-0.5 text-xs text-white/50">{item.location}</p>
                        <span className="mt-1 inline-flex rounded-full border border-[#50dca9]/20 bg-[#50dca9]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.12em] text-[#7ceac2]">Demonstração</span>
                      </div>
                    </div>
                    <div className="mt-4 text-[15px] tracking-[.12em] text-[#50dca9]" aria-label="5 estrelas">★★★★★</div>
                    <p className="mt-3 text-sm leading-6 text-white/70">“{item.quote}”</p>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes pagenova-testimonials {
            from { transform: translateX(0); }
            to { transform: translate3d(-25%, 0, 0); }
          }
          @media (prefers-reduced-motion: reduce) {
            [class*="pagenova-testimonials"] { animation: none !important; }
          }
        `}</style>
      </section>

      <section className="bg-[#f3f5f0] py-10 text-[#14251d] md:py-16">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <div className="overflow-hidden rounded-[30px] border border-[#e1d5ad] bg-white shadow-[0_24px_70px_rgba(20,37,29,.10)]">
            <div className="relative grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_38%,#fffdf4_0,#fff5d2_35%,#edf5ec_100%)] px-6 py-10">
              <div className="absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-[#d9a82f]/45 to-transparent" />
              <img src="data:image/webp;base64,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" alt="Garantia de 7 dias" className="relative h-44 w-44 rounded-full object-cover drop-shadow-[0_18px_30px_rgba(122,82,0,.22)] sm:h-48 sm:w-48" />
            </div>
            <div className="px-6 py-7 text-center sm:px-10 sm:py-9">
              <span className="inline-flex rounded-full border border-[#e4c86d] bg-[#fff9e7] px-4 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#80621b]">Garantia de satisfação</span>
              <h2 className="mx-auto mt-5 max-w-2xl text-[1.8rem] font-semibold leading-[1.12] tracking-[-.04em] sm:text-4xl">7 dias para conhecer a PageNova com tranquilidade.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#647369] sm:text-base">Se a plataforma não fizer sentido para você, solicite o cancelamento dentro do prazo de 7 dias após a compra.</p>
              <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-2 text-left sm:grid-cols-4">
                {["Checkout Kiwify","7 dias de garantia","Dados protegidos","Suporte PageNova"].map((item) => <div key={item} className="rounded-xl border border-[#e7e4d8] bg-[#faf9f3] px-3 py-3 text-xs font-semibold text-[#405047]"><span className="mr-1.5 text-[#168457]">✓</span>{item}</div>)}
              </div>
              <a href="#planos" className="mt-7 inline-flex w-full max-w-sm items-center justify-center rounded-2xl bg-[#0d3527] px-6 py-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(13,53,39,.18)] transition hover:bg-[#164c39]">Ver planos agora <span className="ml-2">→</span></a>
            </div>
          </div>
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
                <Link href="/app" className="font-semibold text-white/80 transition hover:text-white">Entrar</Link>
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
        </div>
      </footer>   </main>
  );
}