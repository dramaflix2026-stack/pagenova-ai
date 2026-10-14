"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, ArrowUpRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    const requestedNext = searchParams.get("next");

    const destination =
      requestedNext?.startsWith("/app")
        ? requestedNext
        : "/app";

    router.replace(destination);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07110e] px-4 py-10 font-sans text-white sm:px-5 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(37,216,157,0.12),transparent_38%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#2cd9a0]/[.07] blur-[120px]" />

      <div className="relative w-full max-w-[455px]">
        <Link
          href="/"
          className="mx-auto mb-7 flex w-fit items-center justify-center"
          aria-label="PageNova AI"
        >
          <img
            src="/brand/pagenova-logo.png"
            alt="PageNova AI"
            className="h-[65px] w-auto max-w-[240px] object-contain transition duration-200 hover:brightness-105"
          />
        </Link>

        <section className="rounded-[28px] border border-white/[0.12] bg-[#10241c]/90 p-7 shadow-[0_28px_85px_rgba(0,0,0,.38)] backdrop-blur-xl sm:p-9">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#5ce1af]/25 bg-[#36d9a1]/10 text-[#82efc2]">
              <ArrowUpRight className="h-6 w-6" aria-hidden="true" />
            </div>

            <h1 className="text-[clamp(1.55rem,5vw,2rem)] font-bold leading-tight tracking-[-0.045em]">
              Entre na sua conta
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/60">
              Sua criação, seus projetos e seu CRM em um só lugar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold text-white/55"
              >
                E-mail
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                className="h-12 w-full rounded-xl border border-white/[0.12] bg-[#091b14] pl-4 pr-12 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-[#60dfa9]/70 focus:ring-4 focus:ring-[#36d9a1]/15"
              />
              <button type="button" onClick={() => setPasswordVisible((value) => !value)}
                aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#36d9a1]">
                {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-white/55"
                >
                  Senha
                </label>

                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-[#82efc2] transition hover:text-[#a2f5d4]"
                >
                  Esqueci minha senha
                </Link>
              </div>

              <div className="relative">
              <input
                id="password"
                type={passwordVisible ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha"
                className="h-12 w-full rounded-xl border border-white/[0.12] bg-[#091b14] px-4 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-[#60dfa9]/70 focus:ring-4 focus:ring-[#36d9a1]/15"
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
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#36d9a1] text-sm font-bold shadow-[0_12px_35px_rgba(44,217,154,0.16)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 border-t border-white/[0.07] pt-6 text-center">
            <p className="text-xs text-white/55">
              Ainda não tem acesso?
            </p>

            <div className="mt-3 flex flex-col items-center gap-3">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center rounded-xl border border-[#5ce1af]/35 bg-[#36d9a1]/10 px-5 py-2.5 text-xs font-semibold text-[#a2f5d4] transition hover:bg-[#36d9a1]/20"
              >
                Cadastre-se
              </Link>
              <Link
                href="/#planos"
                className="text-xs font-medium text-white/45 transition hover:text-white/70"
              >
                Conhecer os planos →
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-white/50">
          © 2026 PageNova AI · Crie. Publique. Evolua.
        </p>
      </div>
    </main>
  );
}

function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110e] text-white">
      <div className="text-sm text-white/60">
        Carregando...
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
