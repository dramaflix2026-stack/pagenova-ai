"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CadastroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  async function resendConfirmation() {
    if (resending || !email.trim()) return;
    setResending(true);
    setResent(false);
    setError("");
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: window.location.origin + "/auth/callback?next=/app" },
      });
      if (resendError) {
        setError(["over_request_rate_limit", "over_email_send_rate_limit", "too_many_requests"].includes(resendError.code || "")
          ? "Aguarde alguns instantes antes de solicitar outro link."
          : "Não foi possível solicitar o link de confirmação. Tente novamente mais tarde.");
        return;
      }
      setResent(true);
    } catch {
      setError("Falha ao solicitar o link. Tente novamente mais tarde.");
    } finally {
      setResending(false);
    }
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");

    if (password.length < 8) {
      setError("Use uma senha com pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas informadas não são iguais.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin + "/auth/callback?next=/app",
        },
      });

      if (signupError) {
        const code = signupError.code || "";
        if (code === "user_already_exists" || signupError.message.toLowerCase().includes("already registered")) {
          setError("Este e-mail pode já ter uma conta. Acesse o login ou utilize 'Esqueci minha senha' para ativar seu acesso.");
        } else if (["over_request_rate_limit", "over_email_send_rate_limit", "too_many_requests"].includes(code)) {
          setError("Muitas solicitações. Aguarde alguns minutos para tentar novamente.");
        } else {
          setError("Não foi possível concluir o cadastro. Verifique os dados e tente novamente.");
        }
        return;
      }

      if (data.session) {
        router.replace("/app");
        router.refresh();
        return;
      }

      // A signup without a session cannot sign in until email verification.
      // Supabase can also return a non-session response for already-registered
      // addresses, so explain the safe recovery path without enumerating users.
      setSent(true);
      setPassword("");
      setConfirmation("");
    } catch {
      setError("Não foi possível concluir o cadastro agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07110e] px-4 py-10 font-sans text-white sm:px-5 sm:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(54,217,161,0.12),transparent_40%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-400/[.06] blur-[110px]" />

      <div className="relative w-full max-w-[440px]">
        <Link href="/" className="mx-auto mb-8 flex w-fit items-center justify-center" aria-label="Voltar para a PageNova AI">
          <img src="/brand/pagenova-logo.png" alt="PageNova AI"
            className="h-[65px] w-auto max-w-[240px] object-contain" />
        </Link>

        <section className="rounded-[28px] border border-white/[.10] bg-[#10241c]/90 p-6 shadow-[0_28px_85px_rgba(0,0,0,.38)] backdrop-blur-xl sm:p-9">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-xl text-emerald-300" aria-hidden="true">
              ✦
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Crie sua conta PageNova</h1>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Cadastre seu e-mail para acessar sua área de trabalho.
            </p>
          </div>

          {sent ? (
            <div role="status" className="mt-7 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] p-5 text-center">
              <p className="font-semibold text-emerald-200">Confirme seu e-mail antes de entrar</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Enviamos as instruções de ativação, quando aplicável, para <strong className="break-all text-white">{email.trim().toLowerCase()}</strong>.
                Abra o link recebido para confirmar sua conta antes de fazer login.
                Confira também spam e promoções.
              </p>
              <p className="mt-3 text-xs leading-5 text-white/50">
                Comprou pela Kiwify? Use o mesmo e-mail da compra. Se você já recebeu um convite
                ou já tem cadastro, utilize o link original ou recupere sua senha.
              </p>
              {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[.07] px-4 py-3 text-xs text-red-200">{error}</p>}
              {resent && <p role="status" className="mt-4 text-xs leading-5 text-emerald-200">Se a conta estiver aguardando confirmação, um novo link será enviado.</p>}
              <div className="mt-5 flex flex-col gap-2">
                <button type="button" onClick={() => void resendConfirmation()} disabled={resending}
                  className="rounded-xl border border-emerald-400/35 px-5 py-3 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/10 disabled:opacity-50">
                  {resending ? "Enviando..." : "Reenviar confirmação"}
                </button>
                <Link href="/forgot-password" className="rounded-xl border border-white/15 px-5 py-3 text-xs font-semibold text-white/70 hover:bg-white/[.05]">
                  Já tenho conta · redefinir senha
                </Link>
                <Link href="/login" className="rounded-xl bg-[#36d9a1] px-5 py-3 text-sm font-bold text-[#062018] transition hover:bg-[#7debc0]">
                  Já confirmei · ir para login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={register} className="mt-7 space-y-4">
              <div>
                <label htmlFor="signup-email" className="mb-2 block text-xs font-semibold text-white/65">
                  E-mail
                </label>
                <input id="signup-email" type="email" autoComplete="email" required maxLength={254}
                  value={email} onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@email.com"
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#091b14] px-4 text-sm text-white outline-none placeholder:text-white/55 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10" />
              </div>
              <div>
                <label htmlFor="signup-password" className="mb-2 block text-xs font-semibold text-white/65">
                  Senha
                </label>
                <input id="signup-password" type="password" autoComplete="new-password" required minLength={8}
                  value={password} onChange={(event) => setPassword(event.target.value)}
                  placeholder="Pelo menos 8 caracteres"
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/55 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10" />
              </div>
              <div>
                <label htmlFor="signup-confirmation" className="mb-2 block text-xs font-semibold text-white/65">
                  Confirmar senha
                </label>
                <input id="signup-confirmation" type="password" autoComplete="new-password" required minLength={8}
                  value={confirmation} onChange={(event) => setConfirmation(event.target.value)}
                  placeholder="Repita sua senha"
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/55 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10" />
              </div>

              {error && <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/[.08] px-4 py-3 text-sm text-red-200">{error}</p>}

              <button type="submit" disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#36d9a1] text-sm font-bold text-[#062018] transition hover:bg-[#7debc0] disabled:cursor-not-allowed disabled:opacity-55">
                {loading ? "Criando conta..." : "Cadastre-se"}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-xs leading-5 text-white/45">
            O cadastro não ativa uma assinatura. Para usar a plataforma, é preciso ter um plano ativo
            vinculado ao mesmo e-mail.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-5 text-center text-sm">
            <span className="text-white/45">Já tem uma conta?</span>
            <Link href="/login" className="font-semibold text-emerald-300 hover:text-emerald-200">Login</Link>
            <span className="text-white/25">·</span>
            <Link href="/#planos" className="font-semibold text-white/70 hover:text-white">Conhecer planos</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
