import { SignOutButton } from "./sign-out-button";

export default function AccessRequiredPage() {
  return (
    <main className="min-h-screen bg-[#070b09] px-6 py-16 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-3xl border border-emerald-500/20 bg-white/[0.03] p-8 shadow-2xl">
          <div className="mb-5 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
            PageNova AI
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Acesso não liberado
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/60">
            Não encontramos um acesso ativo para o e-mail desta conta.
            Use o mesmo e-mail informado na compra do PageNova AI.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <SignOutButton />

            <a
              href="https://pay.kiwify.com.br/cMMBGQH"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              Garantir acesso
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
