import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import about from "@/assets/about.jpg";
import { CtaBand, Newsletter } from "@/components/site";
import { cases, posts } from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vértice Consultoria — Estratégia que gera resultado" },
      { name: "description", content: "Consultoria estratégica, gestão e inovação para empresas que querem crescer com solidez." },
      { property: "og:title", content: "Vértice Consultoria" },
      { property: "og:description", content: "Estratégia, gestão e inovação para empresas em crescimento." },
    ],
  }),
  component: Index,
});

const stats = [["25+", "anos de mercado"], ["480", "projetos entregues"], ["96%", "clientes satisfeitos"], ["12", "países atendidos"]];
const services = [
  ["01", "Estratégia corporativa", "Planejamento de longo prazo, posicionamento e modelos de negócio."],
  ["02", "Gestão e processos", "Eficiência operacional, indicadores e governança."],
  ["03", "Transformação digital", "Tecnologia aplicada ao negócio, dados e automação."],
  ["04", "Finanças corporativas", "Valuation, reestruturação e eficiência de custos."],
  ["05", "Pessoas e cultura", "Liderança, desenho organizacional e gestão de mudança."],
  ["06", "ESG", "Estratégia de sustentabilidade, relatórios e certificações."],
];
const diffs = [
  ["Independência", "Sem vínculo com fornecedores: recomendamos só o que é melhor para você."],
  ["Execução junto", "Não entregamos só slides — implementamos lado a lado com seu time."],
  ["Foco em resultado", "Parte da nossa remuneração pode ser atrelada às metas atingidas."],
  ["Time sênior", "Especialistas com média de 15 anos de experiência em cada projeto."],
];
const steps = [["Diagnóstico", "Imersão no negócio, dados e entrevistas."], ["Estratégia", "Plano de ação com metas e prazos claros."], ["Implementação", "Execução acompanhada e gestão de mudança."], ["Evolução", "Monitoramento contínuo e ajustes."]];
const testimonials = [
  ["A Vértice reorganizou nossa operação e dobramos a margem em 18 meses.", "Mariana Costa", "CEO, Grupo Atlas"],
  ["Parceiros de verdade. Entendem o negócio antes de propor qualquer solução.", "Ricardo Alves", "Diretor, Nexo Energia"],
  ["Um time técnico, humano e extremamente comprometido com resultado.", "Fernanda Lima", "COO, Lumen Saúde"],
];
const clients = ["ATLAS", "NEXO", "LUMEN", "ÓRBITA", "VERDE&CO", "MERIDIAN"];
const faq = [
  ["Quais setores vocês atendem?", "Varejo, energia, saúde, logística, agronegócio, financeiro, indústria e serviços."],
  ["A primeira conversa tem custo?", "Não. O diagnóstico inicial é gratuito e sem compromisso."],
  ["Vocês atendem fora de São Paulo?", "Sim, atuamos em todo o Brasil e em mais 11 países."],
  ["Quanto tempo dura um projeto?", "De 3 a 12 meses em média, conforme o escopo."],
];

function Index() {
  return (
    <>
      <section className="container-site grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="eyebrow">Consultoria estratégica desde 2001</p>
          <h1 className="mt-5 text-5xl font-medium leading-[1.05] md:text-7xl">
            Construímos empresas <em className="text-accent">mais fortes</em>.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Há mais de duas décadas ajudamos organizações a transformar desafios em crescimento sustentável.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/contato" className="btn-primary">Diagnóstico gratuito →</Link>
            <Link to="/cases" className="btn-ghost text-primary">Ver cases</Link>
          </div>
          <div className="mt-10 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="text-accent">★★★★★</span> Nota 4.9 de 200+ clientes
          </div>
        </div>
        <div className="relative">
          <img src={hero} alt="Equipe colaborando em escritório" width={1600} height={1008} className="aspect-[4/5] w-full rounded-2xl object-cover" />
          <div className="absolute -bottom-6 -left-6 rounded-xl bg-primary p-6 text-primary-foreground shadow-xl">
            <p className="font-display text-4xl text-accent">R$ 2bi+</p>
            <p className="text-sm opacity-80">gerados para clientes</p>
          </div>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="container-site flex flex-wrap items-center justify-between gap-6 py-8 font-display text-xl tracking-widest text-muted-foreground">
          <span className="font-sans text-xs uppercase tracking-[.2em]">Confiam em nós</span>
          {clients.map((c) => <span key={c}>{c}</span>)}
        </div>
      </section>

      <section className="container-site grid items-center gap-16 py-24 md:grid-cols-2">
        <img src={about} alt="Consultora apresentando estratégia" loading="lazy" width={1200} height={1408} className="aspect-[5/6] w-full rounded-2xl object-cover" />
        <div>
          <p className="eyebrow">Quem somos</p>
          <h2 className="mt-4 text-4xl md:text-5xl">Estratégia com os pés no chão.</h2>
          <p className="mt-6 text-lg text-muted-foreground">Somos uma consultoria independente com mais de 80 especialistas. Unimos visão estratégica, rigor analítico e execução prática para entregar resultados que se sustentam.</p>
          <div className="mt-10 grid grid-cols-2 gap-8">
            {stats.map(([n, l]) => (
              <div key={l} className="border-l-2 border-accent pl-5">
                <p className="font-display text-4xl text-primary">{n}</p>
                <p className="mt-1 text-sm text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
          <Link to="/sobre" className="btn-ghost mt-10 text-primary">Conheça nossa história</Link>
        </div>
      </section>

      <section className="bg-primary py-24 text-primary-foreground">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">O que fazemos</p>
              <h2 className="mt-4 max-w-2xl text-4xl md:text-5xl">Soluções sob medida para cada fase do seu negócio.</h2>
            </div>
            <Link to="/servicos" className="btn-ghost">Todos os serviços</Link>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-xl bg-primary-foreground/15 md:grid-cols-3">
            {services.map(([n, t, d]) => (
              <div key={n} className="bg-primary p-8 transition hover:bg-primary-foreground/5">
                <p className="font-display text-accent">{n}</p>
                <h3 className="mt-6 text-2xl">{t}</h3>
                <p className="mt-3 opacity-70">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site py-24">
        <p className="eyebrow">Diferenciais</p>
        <h2 className="mt-4 max-w-2xl text-4xl md:text-5xl">Por que escolher a Vértice</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {diffs.map(([t, d]) => (
            <div key={t} className="rounded-xl border bg-card p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent font-display text-xl text-accent-foreground">✓</div>
              <h3 className="mt-6 text-xl">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-24">
        <div className="container-site">
          <p className="eyebrow">Metodologia</p>
          <h2 className="mt-4 text-4xl md:text-5xl">Como trabalhamos</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map(([t, d], i) => (
              <div key={t} className="relative border-t-2 border-accent pt-6">
                <p className="font-display text-6xl text-primary/20">0{i + 1}</p>
                <h3 className="mt-2 text-2xl">{t}</h3>
                <p className="mt-2 text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site py-24">
        <div className="flex items-end justify-between">
          <div><p className="eyebrow">Cases</p><h2 className="mt-4 text-4xl md:text-5xl">Resultados reais</h2></div>
          <Link to="/cases" className="btn-ghost hidden text-primary md:inline-flex">Ver todos</Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cases.slice(0, 3).map((c) => (
            <article key={c.slug} className="rounded-2xl border bg-card p-8 transition hover:-translate-y-1 hover:border-accent">
              <span className="eyebrow">{c.sector}</span>
              <h3 className="mt-6 text-2xl">{c.title}</h3>
              <p className="mt-6 font-display text-lg text-accent">{c.result}</p>
              <p className="mt-2 text-sm text-muted-foreground">{c.client}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-primary py-24 text-primary-foreground">
        <div className="container-site">
          <p className="eyebrow">Depoimentos</p>
          <h2 className="mt-4 text-4xl md:text-5xl">Quem confia na Vértice</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map(([q, n, r]) => (
              <figure key={n} className="rounded-xl border border-primary-foreground/15 p-8">
                <p className="text-accent">★★★★★</p>
                <blockquote className="mt-4 font-display text-xl leading-snug">“{q}”</blockquote>
                <figcaption className="mt-6 text-sm"><strong>{n}</strong><br /><span className="opacity-60">{r}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site py-24">
        <div className="flex items-end justify-between">
          <div><p className="eyebrow">Insights</p><h2 className="mt-4 text-4xl md:text-5xl">Do nosso blog</h2></div>
          <Link to="/blog" className="btn-ghost hidden text-primary md:inline-flex">Ver blog</Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {posts.slice(0, 3).map((p) => (
            <article key={p.title} className="group border-t pt-6">
              <span className="eyebrow">{p.tag}</span>
              <h3 className="mt-3 text-2xl group-hover:text-accent">{p.title}</h3>
              <p className="mt-4 text-sm text-muted-foreground">{p.date} · {p.read}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-site grid gap-12 pb-24 md:grid-cols-3">
        <div><p className="eyebrow">FAQ</p><h2 className="mt-4 text-4xl">Dúvidas frequentes</h2></div>
        <div className="divide-y border-y md:col-span-2">
          {faq.map(([q, a]) => (
            <details key={q} className="py-5">
              <summary className="cursor-pointer font-display text-xl">{q}</summary>
              <p className="mt-3 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <Newsletter />
      <CtaBand />
    </>
  );
}
