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
  avatar: `https://i.pravatar.cc/180?img=${(index % 70) + 1}`,
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
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 gap-4 pr-4" aria-hidden={copy === 1}>
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
            to { transform: translateX(-50%); }
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
              <svg viewBox="0 0 240 240" className="relative h-40 w-40 drop-shadow-[0_18px_30px_rgba(122,82,0,.20)] sm:h-44 sm:w-44" role="img" aria-label="Garantia de 7 dias">
                <defs><linearGradient id="goldPremium" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff6bd"/><stop offset=".38" stopColor="#f6d267"/><stop offset=".72" stopColor="#dda72f"/><stop offset="1" stopColor="#b7770c"/></linearGradient><linearGradient id="greenPremium" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#173c2e"/><stop offset="1" stopColor="#071b14"/></linearGradient></defs>
                <circle cx="120" cy="120" r="105" fill="#fffaf0" stroke="#d4a43a" strokeWidth="2"/>
                <circle cx="120" cy="120" r="96" fill="url(#goldPremium)"/>
                <circle cx="120" cy="120" r="76" fill="url(#greenPremium)" stroke="#fff1aa" strokeWidth="2"/>
                <circle cx="120" cy="120" r="66" fill="none" stroke="#d8aa48" strokeWidth="1" opacity=".65"/>
                <text x="120" y="31" textAnchor="middle" fill="#6e4b0b" fontSize="11" fontWeight="900" letterSpacing="3.2">GARANTIA</text>
                <text x="120" y="77" textAnchor="middle" fill="#f6d267" fontSize="16">★ ★ ★</text>
                <text x="120" y="143" textAnchor="middle" fill="#fff3b2" fontSize="78" fontWeight="950">7</text>
                <text x="120" y="168" textAnchor="middle" fill="#f6d267" fontSize="18" fontWeight="900" letterSpacing="4">DIAS</text>
                <path d="M91 188l16 16 42-45" fill="none" stroke="#fff1aa" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="120" y="226" textAnchor="middle" fill="#6e4b0b" fontSize="9" fontWeight="900" letterSpacing="2.3">COMPRA PROTEGIDA</text>
              </svg>
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