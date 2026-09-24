"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas informadas não são iguais.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(
        "Este link de recuperação não é mais válido. Solicite um novo link.",
      );
      setLoading(false);
      return;
    }

    const { error: updateError } =
      await supabase.auth.updateUser({
        password,
      });

    if (updateError) {
      setError(
        "Não foi possível alterar sua senha. Solicite um novo link e tente novamente.",
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    window.setTimeout(() => {
      router.replace("/app");
      router.refresh();
    }, 1200);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080510] px-5 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(108,59,255,0.20),transparent_38%)]" />

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
              🔒
            </div>

            <h1 className="text-2xl font-bold tracking-[-0.04em]">
              Defina sua nova senha
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Escolha uma nova senha para sua conta PageNova AI.
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-semibold text-white/55"
                >
                  Nova senha
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="h-12 w-full rounded-xl border border-white/[0.09] bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-xs font-semibold text-white/55"
                >
                  Confirmar nova senha
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Repita a nova senha"
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
                {loading ? "Salvando..." : "Definir nova senha"}
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.07] p-5 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                ✓
              </div>

              <p className="mt-3 text-sm font-semibold text-white">
                Senha alterada
              </p>

              <p className="mt-2 text-xs text-white/40">
                Redirecionando para o PageNova...
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
