"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const supabase = createClient();

    const redirectTo =
      `${window.location.origin}/auth/callback?next=/reset-password`;

    const { error: recoveryError } =
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo,
        },
      );

    if (recoveryError) {
      setError(
        "Não foi possível enviar o link agora. Tente novamente em alguns instantes.",
      );
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080510] px-5 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(108,59,255,0.20),transparent_38%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="relative w-full max-w-[430px]">
        <Link
          href="/"
          className="mx-auto mb-8 flex w-fit items-center justify-center"
          aria-label="PageNova AI"
        >
          <img
            src="/brand/pagenova-logo.png"
            alt="PageNova AI"
            className="h-[72px] w-auto max-w-[250px] object-contain transition duration-200 hover:brightness-110"
          />
        </Link>

        <section className="rounded-[28px] border border-white/[0.09] bg-white/[0.035] p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-xl text-violet-300">
              ✉
            </div>

            <h1 className="text-2xl font-bold tracking-[-0.04em]">
              Recuperar senha
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Enviaremos um link seguro para você definir uma nova senha.
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold text-white/55"
                >
                  E-mail da sua conta
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@email.com"
                  className="h-12 w-full rounded-xl border border-white/[0.09] bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/10"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-400/15 bg-red-500/[0.07] px-4 py-3 text-xs text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#845FFF] to-[#6438F4] text-sm font-bold shadow-[0_12px_35px_rgba(108,59,255,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.07] p-5 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                ✓
              </div>

              <p className="mt-3 text-sm font-semibold text-white">
                Verifique seu e-mail
              </p>

              <p className="mt-2 text-xs leading-5 text-white/40">
                Se existir uma conta vinculada ao endereço informado,
                você receberá um link para redefinir sua senha.
              </p>
            </div>
          )}

          <div className="mt-6 border-t border-white/[0.07] pt-6 text-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-violet-300 transition hover:text-violet-200"
            >
              ← Voltar para o login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
