import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Newsletter } from "@/components/site";
import { posts } from "@/lib/content";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog e Insights — Vértice Consultoria" },
      { name: "description", content: "Artigos sobre estratégia, gestão, tecnologia, ESG e pessoas escritos pelos especialistas da Vértice." },
      { property: "og:title", content: "Insights — Vértice Consultoria" },
      { property: "og:description", content: "Conteúdo prático sobre estratégia e gestão." },
    ],
  }),
  component: Blog,
});

function Blog() {
  const [first, ...rest] = posts;
  return (
    <>
      <PageHero eyebrow="Insights" title="Ideias para quem lidera." text="Análises, tendências e aprendizados direto dos nossos projetos." />
      <section className="container-site py-20">
        <article className="rounded-2xl bg-primary p-10 text-primary-foreground md:p-16">
          <span className="eyebrow">Destaque · {first.tag}</span>
          <h2 className="mt-6 max-w-3xl text-4xl md:text-5xl">{first.title}</h2>
          <p className="mt-6 text-sm opacity-70">{first.date} · {first.read} de leitura</p>
        </article>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {rest.map((p) => (
            <article key={p.title} className="group rounded-xl border bg-card p-8 transition hover:border-accent">
              <span className="eyebrow">{p.tag}</span>
              <h3 className="mt-4 text-2xl group-hover:text-accent">{p.title}</h3>
              <p className="mt-6 text-sm text-muted-foreground">{p.date} · {p.read}</p>
            </article>
          ))}
        </div>
      </section>
      <Newsletter />
    </>
  );
}
