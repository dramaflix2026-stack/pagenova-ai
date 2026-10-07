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
  ["Mariana Oliveira","São Paulo — SP","A PageNova deixou muito mais simples tirar uma landing page do papel e continuar os ajustes no mesmo lugar.","https://i.pravatar.cc/160?img=47"],
  ["Carlos Mendes","Belo Horizonte — MG","Consegui organizar meus projetos, páginas e contatos sem ficar alternando entre várias ferramentas.","https://i.pravatar.cc/160?img=12"],
  ["Juliana Costa","Curitiba — PR","O fluxo de criação é direto. Começo pelo briefing, gero a base e depois consigo refinar o conteúdo.","https://i.pravatar.cc/160?img=44"],
  ["Rafael Almeida","Campinas — SP","A parte de sites com IA acelerou bastante a primeira versão e me deu uma base boa para editar.","https://i.pravatar.cc/160?img=13"],
  ["Camila Ferreira","Florianópolis — SC","Gostei de concentrar criação e organização comercial no mesmo painel. Ficou muito mais prático.","https://i.pravatar.cc/160?img=32"],
  ["Bruno Martins","Rio de Janeiro — RJ","Eu precisava ganhar velocidade para testar páginas e a PageNova tornou esse processo bem mais organizado.","https://i.pravatar.cc/160?img=11"],
  ["Larissa Souza","Goiânia — GO","A interface é simples de entender e consigo voltar aos projetos para continuar trabalhando quando preciso.","https://i.pravatar.cc/160?img=45"],
  ["Felipe Rocha","Porto Alegre — RS","O CRM junto com as páginas facilita muito acompanhar o que estou criando para cada oportunidade.","https://i.pravatar.cc/160?img=14"],
  ["Amanda Ribeiro","Recife — PE","O que mais gostei foi poder partir de uma estrutura pronta e personalizar sem precisar começar tudo do zero.","https://i.pravatar.cc/160?img=48"],
  ["Diego Carvalho","Salvador — BA","A PageNova reuniu etapas que antes eu fazia separadas. Hoje meu processo de criação está bem mais enxuto.","https://i.pravatar.cc/160?img=8"],
  ["Beatriz Lima","Fortaleza — CE","Criar a primeira versão ficou rápido e depois consigo revisar textos e seções com muito mais tranquilidade.","https://i.pravatar.cc/160?img=36"],
  ["Lucas Nogueira","Brasília — DF","Uso para organizar ideias e transformar briefing em página. Economiza bastante tempo no começo do projeto.","https://i.pravatar.cc/160?img=3"],
  ["Isabela Moreira","Vitória — ES","A experiência ficou muito mais fluida do que montar cada parte manualmente em ferramentas diferentes.","https://i.pravatar.cc/160?img=49"],
  ["Gustavo Barros","Santos — SP","Gostei principalmente da continuidade: crio, salvo e depois volto para editar o mesmo projeto.","https://i.pravatar.cc/160?img=15"],
  ["Natália Correia","Niterói — RJ","A plataforma me ajuda a manter páginas, contatos e tarefas mais organizados em um único ambiente.","https://i.pravatar.cc/160?img=47"],
  ["Henrique Duarte","Londrina — PR","Para validar novas páginas, ter uma primeira versão rapidamente faz muita diferença no meu dia a dia.","https://i.pravatar.cc/160?img=12"],
  ["Renata Castro","Joinville — SC","Achei o fluxo bem intuitivo. Mesmo sem programar consigo entender o que fazer em cada etapa.","https://i.pravatar.cc/160?img=44"],
  ["Thiago Freitas","Uberlândia — MG","A criação por briefing me ajuda a estruturar melhor a oferta antes de entrar nos detalhes da página.","https://i.pravatar.cc/160?img=13"],
  ["Paula Azevedo","Ribeirão Preto — SP","O editor e a organização dos projetos deixaram meu processo menos improvisado e muito mais consistente.","https://i.pravatar.cc/160?img=32"],
  ["Eduardo Monteiro","Maringá — PR","Consigo centralizar o trabalho e acompanhar melhor cada projeto sem perder o histórico do que já fiz.","https://i.pravatar.cc/160?img=11"],
  ["Carolina Teixeira","João Pessoa — PB","A PageNova tornou a criação mais acessível para mim e ainda deixa espaço para personalizar depois.","https://i.pravatar.cc/160?img=45"],
  ["André Cardoso","Sorocaba — SP","Ter criação e CRM próximos ajuda muito quando estou trabalhando páginas para diferentes negócios.","https://i.pravatar.cc/160?img=14"],
  ["Letícia Moraes","Campo Grande — MS","A primeira versão sai rápido e eu consigo focar meu tempo no que realmente precisa de ajuste.","https://i.pravatar.cc/160?img=48"],
  ["Marcelo Pires","São José dos Campos — SP","O processo ficou mais previsível: briefing, geração, revisão e edição, tudo seguindo uma sequência clara.","https://i.pravatar.cc/160?img=8"],
  ["Gabriela Farias","Natal — RN","Gostei de conseguir visualizar o projeto e continuar refinando sem precisar reconstruir a página.","https://i.pravatar.cc/160?img=36"],
  ["Vinícius Lopes","Cuiabá — MT","Para quem trabalha com várias ideias ao mesmo tempo, ter os projetos organizados ajuda bastante.","https://i.pravatar.cc/160?img=3"],
  ["Priscila Andrade","Belém — PA","A plataforma facilitou meu fluxo e reduziu o tempo que eu gastava montando estruturas repetitivas.","https://i.pravatar.cc/160?img=49"],
  ["Rodrigo Vieira","São Luís — MA","Uso a PageNova para acelerar páginas e manter as oportunidades organizadas no CRM.","https://i.pravatar.cc/160?img=15"],
  ["Fernanda Campos","Aracaju — SE","Foi fácil entender a proposta e começar. O fato de poder editar depois me dá bastante liberdade.","https://i.pravatar.cc/160?img=47"],
  ["Matheus Gonçalves","São Bernardo do Campo — SP","A PageNova me ajuda a transformar uma ideia em algo visual rapidamente e continuar evoluindo o projeto.","https://i.pravatar.cc/160?img=12"],
].map(([name, location, quote, avatar]) => ({ name, location, quote, avatar }));

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
              <span className="sm:hidden">Criar conta</span>
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
            Demonstração visual temporária do carrossel. Os relatos serão substituídos pelas avaliações reais dos clientes.
          </p>
        </div>

        <div className="pn-testimonials-viewport mt-8">
          <div className="pn-testimonials-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="pn-testimonials-set" aria-hidden={copy > 0}>
                {testimonialMocks.map((item, index) => (
                  <article key={`${copy}-${item.name}`} className="pn-testimonial-card">
                    <div className="flex items-center gap-3">
                      <img src={item.avatar} alt="" className="h-16 w-16 shrink-0 rounded-full border-2 border-[#50dca9]/35 object-cover shadow-[0_8px_24px_rgba(0,0,0,.30)]" />
                      <div className="min-w-0 text-left">
                        <p className="truncate text-base font-semibold text-white">{item.name}</p>
                        <p className="mt-0.5 text-xs text-white/70">{item.location}</p>
                        <span className="mt-1 inline-flex rounded-full border border-[#50dca9]/20 bg-[#50dca9]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.12em] text-[#7ceac2]">
                          Demonstração
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 text-left text-[15px] tracking-[.12em] text-[#50dca9]" aria-label="5 estrelas">★★★★★</div>
                    <p className="mt-3 text-left text-sm leading-6 text-white/90">“{item.quote}”</p>
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
            animation: pnTestimonialsMarquee 150s linear infinite;
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
            min-height: 286px;
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
            .pn-testimonials-track { animation-duration: 125s; }
            .pn-testimonial-card { width: 86vw; min-height: 292px; padding: 22px; }
          }
          @media (prefers-reduced-motion: reduce) {
            .pn-testimonials-track { animation-play-state: paused; }
          }
        `}</style>
      </section>

      <section className="bg-[#f3f5f0] py-10 text-[#14251d] md:py-16">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <div className="overflow-hidden rounded-[30px] border border-[#e1d5ad] bg-white shadow-[0_24px_70px_rgba(20,37,29,.10)]">
            <div className="relative grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_38%,#fffdf4_0,#fff5d2_35%,#edf5ec_100%)] px-6 py-10">
              <div className="absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-[#d9a82f]/45 to-transparent" />
              <div className="relative grid h-52 w-52 place-items-center rounded-full bg-white/70 p-3 shadow-[0_24px_60px_rgba(132,92,0,.18)] ring-1 ring-[#d7ad42]/25 sm:h-56 sm:w-56">
                <img src="/guarantees/guarantee-7.png" alt="Selo de garantia de 7 dias" className="h-full w-full rounded-full object-contain" />
              </div>
            </div>
            <div className="px-6 py-7 text-center sm:px-10 sm:py-9">
              <span className="inline-flex rounded-full border border-[#e4c86d] bg-[#fff9e7] px-4 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#80621b]">Garantia de satisfação</span>
              <h2 className="mx-auto mt-5 max-w-2xl text-[1.8rem] font-semibold leading-[1.12] tracking-[-.04em] sm:text-4xl">7 dias para conhecer a PageNova com tranquilidade.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#647369] sm:text-base">Se a plataforma não fizer sentido para você, solicite o cancelamento dentro do prazo de 7 dias após a compra.</p>
              <div className="mx-auto mt-7 grid max-w-2xl grid-cols-2 gap-3 text-left sm:gap-4">
                {[
                  { icon: "card", eyebrow: "PAGAMENTO", title: "Pagamento seguro", text: "Checkout protegido pela Kiwify" },
                  { icon: "shield", eyebrow: "GARANTIA", title: "7 dias protegidos", text: "Compre com tranquilidade" },
                  { icon: "lock", eyebrow: "PRIVACIDADE", title: "Dados protegidos", text: "Segurança em cada etapa" },
                  { icon: "support", eyebrow: "ATENDIMENTO", title: "Suporte PageNova", text: "Conte com nosso time" },
                ].map((item) => (
                  <div key={item.title} className="group relative min-h-[144px] overflow-hidden rounded-[24px] border border-[#d9d1b7]/80 bg-white p-4 shadow-[0_14px_34px_rgba(18,55,42,.08),inset_0_1px_0_rgba(255,255,255,1)] transition duration-300 hover:-translate-y-1 hover:border-[#c8b15e] hover:shadow-[0_20px_42px_rgba(18,55,42,.13)] sm:min-h-[150px] sm:p-5">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(217,185,82,.14),transparent_43%),radial-gradient(circle_at_0%_100%,rgba(64,199,151,.09),transparent_42%)]" />
                    <div className="pointer-events-none absolute left-4 right-4 top-0 h-px bg-gradient-to-r from-transparent via-[#c9ad4c]/70 to-transparent" />
                    <div className="relative">
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#d7c474]/60 bg-[#f8f6ea] text-[#0c6848] shadow-[0_8px_20px_rgba(24,82,59,.10),inset_0_1px_0_rgba(255,255,255,1)] transition duration-300 group-hover:scale-105 group-hover:bg-[#f4f1df]">
                          {item.icon === "card" && <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/></svg>}
                          {item.icon === "shield" && <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 20 6v5c0 5.2-3.4 8.6-8 10-4.6-1.4-8-4.8-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>}
                          {item.icon === "lock" && <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/></svg>}
                          {item.icon === "support" && <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2ZM17 18c-1 2-3 3-5 3"/></svg>}
                        </span>
                        <span className="text-[8px] font-extrabold tracking-[.16em] text-[#a2832c] sm:text-[9px]">{item.eyebrow}</span>
                      </div>
                      <p className="text-[12px] font-extrabold leading-[1.25] tracking-[-.01em] text-[#21382d] sm:text-[14px]">{item.title}</p>
                      <p className="mt-1.5 text-[10px] leading-[1.45] text-[#708078] sm:text-[11px]">{item.text}</p>
                    </div>
                  </div>
                ))}
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

          <div className="mt-5 flex items-center justify-center gap-5 sm:justify-end" aria-label="Selos de confiança">
            <div className="flex h-[62px] w-[190px] items-center justify-center" title="Norton">
              <img src="/trust/norton.svg" alt="Norton" className="h-full w-full object-contain" />
            </div>
            <div className="flex h-[62px] w-[150px] items-center justify-center" title="Reclame Aqui">
              <img src="/trust/reclame-aqui.svg" alt="Reclame Aqui" className="h-full w-full object-contain" />
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
