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
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function resendConfirmation() {
    if (resending || !email.trim()) return;
    setResending(true);
    setError("");
    setConfirmationSent(false);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: window.location.origin + "/auth/callback?next=/app",
        },
      });
      if (resendError) {
        setError(["over_request_rate_limit", "over_email_send_rate_limit", "too_many_requests"].includes(resendError.code || "")
          ? "Aguarde alguns instantes antes de solicitar outro e-mail."
          : "Não foi possível solicitar o novo link. Aguarde e tente novamente.");
        return;
      }
      setConfirmationSent(true);
    } catch {
      setError("Não foi possível reenviar a confirmação agora. Tente novamente.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setNeedsConfirmation(false);
    setConfirmationSent(false);

    try {
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (loginError) {
        const code = loginError.code || "";
        const message = loginError.message.toLowerCase();
        const unconfirmed = code === "email_not_confirmed" || message.includes("email not confirmed");
        setNeedsConfirmation(unconfirmed);
        setError(unconfirmed
          ? "Seu e-mail ainda não foi confirmado. Abra o link enviado após o cadastro ou solicite um novo abaixo."
          : ["over_request_rate_limit", "over_email_send_rate_limit", "too_many_requests"].includes(code)
            ? "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente."
            : code === "invalid_credentials"
              ? "Não foi possível entrar com este e-mail e senha. Se acabou de comprar, confirme o e-mail primeiro. Você também pode redefinir a senha."
              : "Não foi possível autenticar agora. Tente novamente em alguns instantes.");
        return;
      }

      const requestedNext = searchParams.get("next");
      const destination = requestedNext?.startsWith("/app") && !requestedNext.startsWith("//")
        ? requestedNext : "/app";
      router.replace(destination);
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao serviço de login. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b100d] px-4 py-10 font-sans text-white sm:px-5 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(37,216,157,0.12),transparent_38%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#8fec78]/[.07] blur-[120px]" />

      <div className="relative w-full max-w-[455px]">
        <Link
          href="/"
          className="mx-auto mb-7 flex w-fit items-center justify-center"
          aria-label="PageNova AI"
        >
          <img
            src="/brand/pagenova-logo.png"
            alt="PageNova AI"
            className="pn-brand-logo h-[65px] w-auto max-w-[240px] object-contain transition duration-200 hover:brightness-105"
          />
        </Link>

        <section className="rounded-[28px] border border-white/[0.12] bg-[#142019]/90 p-7 shadow-[0_28px_85px_rgba(0,0,0,.38)] backdrop-blur-xl sm:p-9">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#a8f494]/25 bg-[#8fec78]/10 text-[#b8f5a5]">
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
              <label htmlFor="email" className="mb-2 block text-xs font-semibold text-white/70">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                className="h-12 w-full rounded-xl border border-white/[0.12] bg-[#101c15] px-4 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-[#a8f494]/70 focus:ring-4 focus:ring-[#8fec78]/15"
              />
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
                  className="text-[11px] font-medium text-[#b8f5a5] transition hover:text-[#c6f8ad]"
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
                  className="h-12 w-full rounded-xl border border-white/[0.12] bg-[#101c15] pl-4 pr-12 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-[#a8f494]/70 focus:ring-4 focus:ring-[#8fec78]/15"
                />
                <button type="button" onClick={() => setPasswordVisible((value) => !value)}
                  aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#8fec78]">
                  {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {searchParams.get("error") === "invalid_auth_link" && (
              <div role="alert" className="rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3 text-xs leading-5 text-amber-100">
                O link de ativação ou recuperação não é válido ou expirou. Solicite um novo link de confirmação
                ou utilize “Esqueci minha senha”.
              </div>
            )}
            {error && (
              <div role="alert" className="rounded-xl border border-red-400/15 bg-red-500/[0.07] px-4 py-3 text-xs leading-5 text-red-200">
                {error}
              </div>
            )}
            {needsConfirmation && (
              <button type="button" onClick={() => void resendConfirmation()} disabled={resending || loading}
                className="w-full rounded-xl border border-emerald-400/30 bg-emerald-400/[.08] px-4 py-3 text-xs font-bold text-emerald-200 hover:bg-emerald-400/[.14] disabled:opacity-50">
                {resending ? "Solicitando confirmação..." : "Reenviar e-mail de confirmação"}
              </button>
            )}
            {confirmationSent && (
              <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.07] px-4 py-3 text-xs leading-5 text-emerald-200">
                Se este e-mail estiver aguardando confirmação, enviaremos um novo link. Confira também a pasta de spam.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#8fec78] text-sm font-bold text-[#14220f] shadow-[0_12px_35px_rgba(44,217,154,0.16)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="inline-flex items-center justify-center rounded-xl border border-[#a8f494]/35 bg-[#8fec78]/10 px-5 py-2.5 text-xs font-semibold text-[#c6f8ad] transition hover:bg-[#8fec78]/20"
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
    <main className="flex min-h-screen items-center justify-center bg-[#0b100d] text-white">
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
