import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site";
import { jobs } from "@/lib/content";

export const Route = createFileRoute("/carreiras")({
  head: () => ({
    meta: [
      { title: "Carreiras — Trabalhe na Vértice Consultoria" },
      { name: "description", content: "Vagas abertas, benefícios e cultura. Venha construir empresas mais fortes com a gente." },
      { property: "og:title", content: "Trabalhe na Vértice" },
      { property: "og:description", content: "Conheça nossas vagas e benefícios." },
    ],
  }),
  component: Carreiras,
});

const perks = [
  ["Crescimento acelerado", "Plano de carreira claro e mentoria com sócios."],
  ["Trabalho híbrido", "Flexibilidade de local e horário."],
  ["Saúde completa", "Plano médico, odontológico e apoio psicológico."],
  ["Educação", "Bolsas para MBA, idiomas e certificações."],
  ["Participação nos lucros", "Bônus anual atrelado a resultados."],
  ["Impacto real", "Projetos relevantes desde o primeiro dia."],
];

function Carreiras() {
  return (
    <>
      <PageHero eyebrow="Carreiras" title="Gente boa faz consultoria boa." text="Procuramos pessoas curiosas, éticas e com vontade de fazer diferença." />
      <section className="container-site py-20">
        <h2 className="text-4xl">Por que a Vértice</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {perks.map(([t, d]) => (
            <div key={t} className="rounded-xl border bg-card p-8">
              <div className="h-2 w-10 rounded-full bg-accent" />
              <h3 className="mt-6 text-xl">{t}</h3>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-secondary py-20">
        <div className="container-site">
          <h2 className="text-4xl">Vagas abertas</h2>
          <div className="mt-10 divide-y border-y">
            {jobs.map((j) => (
              <div key={j.title} className="flex flex-col justify-between gap-3 py-6 md:flex-row md:items-center">
                <div>
                  <h3 className="text-2xl">{j.title}</h3>
                  <p className="text-sm text-muted-foreground">{j.area} · {j.place}</p>
                </div>
                <Link to="/contato" className="btn-ghost text-primary">Candidatar-se →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
