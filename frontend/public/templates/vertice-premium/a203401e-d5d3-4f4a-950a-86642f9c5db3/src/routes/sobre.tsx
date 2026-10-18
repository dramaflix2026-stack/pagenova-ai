import { createFileRoute } from "@tanstack/react-router";
import { CtaBand, PageHero } from "@/components/site";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre nós — Vértice Consultoria" },
      { name: "description", content: "Conheça a história, missão, valores e a equipe da Vértice Consultoria." },
      { property: "og:title", content: "Sobre a Vértice Consultoria" },
      { property: "og:description", content: "História, missão, valores e equipe." },
    ],
  }),
  component: Sobre,
});

const values = [
  ["Missão", "Gerar valor real e duradouro para nossos clientes por meio de estratégia e execução."],
  ["Visão", "Ser referência em consultoria independente na América Latina até 2030."],
  ["Valores", "Ética, transparência, excelência técnica e compromisso com resultado."],
];
const timeline = [
  ["2001", "Fundação em São Paulo com três sócios."],
  ["2009", "Abertura do escritório no Rio de Janeiro."],
  ["2016", "Expansão internacional: Lisboa e Bogotá."],
  ["2024", "Lançamento da área de transformação digital."],
];
const team: [string, string][] = [["Ana Ribeiro", "Sócia-fundadora"], ["Carlos Mendes", "Diretor de Estratégia"], ["Juliana Prado", "Diretora de Operações"], ["Paulo Nunes", "Head de Tecnologia"]];

function Sobre() {
  return (
    <>
      <PageHero eyebrow="Sobre nós" title="Duas décadas construindo parcerias de confiança."
        text="Somos uma consultoria independente formada por especialistas apaixonados por resolver problemas complexos." />

      <section className="container-site grid gap-6 py-20 md:grid-cols-3">
        {values.map(([t, d]) => (
          <div key={t} className="rounded-xl border bg-card p-8">
            <h3 className="text-2xl text-primary">{t}</h3>
            <p className="mt-3 text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="bg-secondary py-20">
        <div className="container-site">
          <p className="eyebrow">Nossa trajetória</p>
          <div className="mt-10 grid gap-8 md:grid-cols-4">
            {timeline.map(([y, d]) => (
              <div key={y} className="border-t-2 border-accent pt-5">
                <p className="font-display text-4xl text-primary">{y}</p>
                <p className="mt-2 text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site py-20">
        <p className="eyebrow">Liderança</p>
        <h2 className="mt-4 text-4xl">Nossa equipe</h2>
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
          {team.map(([n, r]) => (
            <div key={n}>
              <div className="flex aspect-square items-center justify-center rounded-xl bg-primary font-display text-5xl text-primary-foreground">
                {n.split(" ").map((p) => p[0]).join("")}
              </div>
              <p className="mt-4 font-semibold">{n}</p>
              <p className="text-sm text-muted-foreground">{r}</p>
            </div>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
