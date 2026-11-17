import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Assinaturas existentes | PageNova AI",
  description: "Planos de assinatura já oferecidos pela PageNova AI, com pagamento na Kiwify.",
  robots: { index: false, follow: false },
};

/**
 * Safe bridge while the new Studio/CRM individual checkouts do not have a
 * verified entitlement mapping. These are the exact four commercial offers
 * already present on the legacy public homepage at migration start.
 */
const currentPlans = [
  { name: "Mensal", price: "R$ 147", period: "por mês", url: "https://pay.kiwify.com.br/a13pNpS" },
  { name: "Trimestral", price: "R$ 397", period: "por 3 meses", url: "https://pay.kiwify.com.br/SQ1dOyd" },
  { name: "Semestral", price: "R$ 747", period: "por 6 meses", url: "https://pay.kiwify.com.br/cgZcPet" },
  { name: "Anual", price: "R$ 1.297", period: "por 12 meses", url: "https://pay.kiwify.com.br/oS6Bmzg" },
] as const;

export default function ExistingSubscriptions() {
  return (
    <main className="min-h-screen bg-[#06120b] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#9af684]">PageNova AI</Link>
          <div className="flex flex-wrap items-center gap-5 text-sm">
            <Link href="/login" className="text-white/75 hover:text-white">Entrar</Link>
            <Link href="/cadastro?trial=1" className="rounded-xl bg-[#93ee7d] px-4 py-3 font-semibold text-[#09150c]">Teste grátis de 5 dias</Link>
          </div>
        </header>
        <section className="mt-14 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#9af684]">Contratação atual</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">Planos de assinatura da PageNova AI</h1>
          <p className="mt-5 text-base leading-relaxed text-white/70">
            Estes são os ciclos de assinatura disponibilizados na versão anterior da PageNova.
            Os novos pacotes Studio, CRM e Completo ainda precisam de validação de pagamento
            e liberação automática de acesso antes de começarem a ser vendidos por aqui.
          </p>
        </section>
        <section className="mt-10 grid gap-4 sm:grid-cols-2" aria-label="Assinaturas disponíveis">
          {currentPlans.map((plan) => (
            <article key={plan.name} className="rounded-2xl border border-white/15 bg-white/[.045] p-6">
              <h2 className="text-lg font-bold">{plan.name}</h2>
              <p className="mt-3 text-3xl font-bold">{plan.price}</p>
              <p className="mt-1 text-sm text-white/60">{plan.period}</p>
              <a
                href={plan.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#9af684] px-4 font-bold text-[#08130a] hover:bg-[#b2ffa5]"
              >Ir para o checkout Kiwify</a>
            </article>
          ))}
        </section>
        <p className="mt-7 text-sm leading-relaxed text-white/60">
          Confira os valores, recursos incluídos, periodicidade, renovação e condições na tela do checkout
          antes de pagar. Use o mesmo e-mail de cadastro na PageNova para facilitar a associação da assinatura.
        </p>
        <footer className="mt-12 border-t border-white/15 py-6 text-xs text-white/50">
          PageNova AI · <Link href="/login" className="underline">Acessar minha conta</Link>
        </footer>
      </div>
    </main>
  );
}
