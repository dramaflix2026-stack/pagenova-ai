import { createFileRoute } from "@tanstack/react-router";
import { CtaBand, PageHero } from "@/components/site";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — Vértice Consultoria" },
      { name: "description", content: "Estratégia, processos, transformação digital, finanças, pessoas e ESG." },
      { property: "og:title", content: "Serviços da Vértice Consultoria" },
      { property: "og:description", content: "Soluções completas para cada fase do seu negócio." },
    ],
  }),
  component: Servicos,
});

const services = [
  ["Estratégia corporativa", "Diagnóstico, planejamento estratégico, fusões e aquisições."],
  ["Gestão e processos", "Mapeamento, redesenho de processos e gestão por indicadores."],
  ["Transformação digital", "Roadmaps de tecnologia, dados, IA e automação."],
  ["Finanças corporativas", "Valuation, reestruturação e eficiência de custos."],
  ["Pessoas e cultura", "Desenho organizacional, liderança e gestão de mudança."],
  ["ESG e sustentabilidade", "Estratégias e relatórios de impacto ambiental e social."],
];
const steps = [["Diagnóstico", "Entendemos o contexto e os desafios."], ["Plano", "Desenhamos a solução com metas claras."], ["Execução", "Implementamos lado a lado com seu time."], ["Resultados", "Medimos, ajustamos e escalamos."]];
const faq = [
  ["Quanto tempo dura um projeto?", "Em média de 3 a 12 meses, dependendo do escopo."],
  ["Vocês atendem empresas de médio porte?", "Sim, atendemos de médias empresas a grandes corporações."],
  ["Como funciona o orçamento?", "Após uma conversa inicial gratuita, enviamos uma proposta detalhada."],
];

function Servicos() {
  return (
    <>
      <PageHero eyebrow="Serviços" title="Do diagnóstico à execução, ao seu lado."
        text="Atuamos de forma integrada em seis frentes para gerar impacto real no seu negócio." />

      <section className="container-site grid gap-6 py-20 md:grid-cols-3">
        {services.map(([t, d], i) => (
          <div key={t} className="group rounded-xl border bg-card p-8 transition hover:-translate-y-1 hover:border-accent">
            <p className="font-display text-accent">0{i + 1}</p>
            <h3 className="mt-6 text-2xl">{t}</h3>
            <p className="mt-3 text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container-site">
          <p className="eyebrow">Como trabalhamos</p>
          <div className="mt-10 grid gap-8 md:grid-cols-4">
            {steps.map(([t, d], i) => (
              <div key={t}>
                <p className="font-display text-6xl text-accent">{i + 1}</p>
                <h3 className="mt-4 text-2xl">{t}</h3>
                <p className="mt-2 opacity-70">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site max-w-3xl py-20">
        <p className="eyebrow">Perguntas frequentes</p>
        <div className="mt-8 divide-y border-y">
          {faq.map(([q, a]) => (
            <details key={q} className="py-5">
              <summary className="cursor-pointer font-display text-xl">{q}</summary>
              <p className="mt-3 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
