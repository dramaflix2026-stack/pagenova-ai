import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/site";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Vértice Consultoria" },
      { name: "description", content: "Fale com a Vértice Consultoria: formulário, telefone, e-mail e endereço." },
      { property: "og:title", content: "Fale com a Vértice Consultoria" },
      { property: "og:description", content: "Agende uma conversa com nossos especialistas." },
    ],
  }),
  component: Contato,
});

const field = "w-full rounded-md border bg-card px-4 py-3 outline-none focus:border-accent";

function Contato() {
  const [sent, setSent] = useState(false);
  return (
    <>
      <PageHero eyebrow="Contato" title="Vamos conversar?" text="Conte um pouco sobre seu desafio. Respondemos em até 1 dia útil." />
      <section className="container-site grid gap-12 py-20 md:grid-cols-5">
        <div className="space-y-8 md:col-span-2">
          {[["E-mail", "contato@vertice.com.br"], ["Telefone", "(11) 4000-0000"], ["Endereço", "Av. Paulista, 1000 — 12º andar, São Paulo/SP"], ["Horário", "Seg a sex, 9h às 18h"]].map(([t, d]) => (
            <div key={t}><p className="eyebrow">{t}</p><p className="mt-2 text-lg">{d}</p></div>
          ))}
        </div>
        <form className="space-y-4 rounded-xl border bg-card p-8 md:col-span-3"
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          {sent ? (
            <p className="py-16 text-center font-display text-2xl">Obrigado! Entraremos em contato em breve.</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <input required placeholder="Nome" className={field} />
                <input required type="email" placeholder="E-mail" className={field} />
              </div>
              <input placeholder="Empresa" className={field} />
              <textarea required rows={5} placeholder="Como podemos ajudar?" className={field} />
              <button className="btn-primary">Enviar mensagem →</button>
            </>
          )}
        </form>
      </section>
    </>
  );
}
