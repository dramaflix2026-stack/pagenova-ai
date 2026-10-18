import { createFileRoute } from "@tanstack/react-router";
import { CtaBand, PageHero } from "@/components/site";
import { cases } from "@/lib/content";

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "Cases de sucesso — Vértice Consultoria" },
      { name: "description", content: "Projetos reais e resultados mensuráveis entregues pela Vértice a clientes de diversos setores." },
      { property: "og:title", content: "Cases de sucesso — Vértice" },
      { property: "og:description", content: "Resultados reais em varejo, energia, saúde, logística e mais." },
    ],
  }),
  component: Cases,
});

function Cases() {
  return (
    <>
      <PageHero eyebrow="Cases" title="Resultados que falam por nós." text="Uma seleção de projetos que transformaram empresas em diferentes setores." />
      <section className="container-site grid gap-6 py-20 md:grid-cols-2">
        {cases.map((c, i) => (
          <article key={c.slug} className={`flex flex-col justify-between rounded-2xl p-10 transition hover:-translate-y-1 ${i % 3 === 0 ? "bg-primary text-primary-foreground" : "border bg-card"}`}>
            <div className="flex justify-between text-sm"><span className="eyebrow">{c.sector}</span><span className="opacity-60">{c.client}</span></div>
            <h3 className="mt-10 text-3xl">{c.title}</h3>
            <p className="mt-8 border-t border-current/20 pt-5 font-display text-xl text-accent">{c.result}</p>
          </article>
        ))}
      </section>
      <CtaBand />
    </>
  );
}
