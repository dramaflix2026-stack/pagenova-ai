const plans = [
  {
    name: "Mensal",
    price: "R$147",
    cycle: "por mês",
    equivalent: "R$147/mês",
    detail: "Pagamento mensal",
    badge: "",
    featured: false,
  },
  {
    name: "Trimestral",
    price: "R$397",
    cycle: "a cada 3 meses",
    equivalent: "R$132,33/mês",
    detail: "Economia de R$44 por ciclo",
    badge: "Economize 10%",
    featured: false,
  },
  {
    name: "Semestral",
    price: "R$747",
    cycle: "a cada 6 meses",
    equivalent: "R$124,50/mês",
    detail: "Economia de R$135 por ciclo",
    badge: "Economize 15%",
    featured: true,
  },
  {
    name: "Anual",
    price: "R$1.297",
    cycle: "a cada 12 meses",
    equivalent: "R$108,08/mês",
    detail: "Economia de R$467 por ciclo",
    badge: "Economize 26%",
    featured: false,
  },
] as const;

const included = [
  "Clonador e editor visual",
  "Gerador de landing pages",
  "Criador de sites por nicho",
  "CRM e dashboard no navegador",
  "Agenda de serviços no navegador",
  "Projetos salvos para continuar editando",
];

export function PageNovaOfferCard() {
  return (
    <div className="mt-14">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`relative flex flex-col overflow-hidden rounded-[26px] border p-6 transition duration-300 hover:-translate-y-1 ${
              plan.featured
                ? "border-emerald-300/60 bg-gradient-to-b from-emerald-400/[0.16] to-[#0d211b] shadow-[0_24px_70px_rgba(0,215,155,.16)]"
                : "border-white/10 bg-[#10211c] hover:border-emerald-300/30"
            }`}
          >
            {plan.featured && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00DFA6] via-[#84FFD3] to-[#00DFA6]" />}
            <div className="min-h-7">
              {plan.badge && (
                <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  {plan.badge}
                </span>
              )}
            </div>
            <h3 className="mt-5 text-xl font-bold">{plan.name}</h3>
            <div className="mt-6 flex items-baseline gap-2">
              <strong className="text-4xl font-black tracking-[-.05em]">{plan.price}</strong>
            </div>
            <p className="mt-1 text-sm text-white/45">{plan.cycle}</p>
            <div className="mt-7 border-t border-white/10 pt-6">
              <p className="text-lg font-semibold text-emerald-200">{plan.equivalent}</p>
              <p className="mt-1 text-xs text-white/45">{plan.detail}</p>
            </div>
            <div className="mt-auto pt-9">
              <span className="flex min-h-12 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 text-center text-sm font-bold text-emerald-200">
                Checkout em preparação
              </span>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-9 rounded-[26px] border border-white/10 bg-white/[0.035] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">Incluído em todos os planos</p>
            <h3 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">O espaço para criar e acompanhar.</h3>
          </div>
          <span className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/55">Mesmo acesso, períodos diferentes</span>
        </div>
        <ul className="mt-7 grid gap-3 text-sm text-white/70 sm:grid-cols-2 lg:grid-cols-3">
          {included.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="text-emerald-300">✓</span>{item}
            </li>
          ))}
        </ul>
        <p className="mt-7 border-t border-white/10 pt-5 text-xs leading-6 text-white/40">
          CRM, dashboard e agendamento são espaços de trabalho salvos no navegador. Os checkouts de assinatura serão conectados quando os links de cada plano estiverem disponíveis.
        </p>
      </div>
    </div>
  );
}