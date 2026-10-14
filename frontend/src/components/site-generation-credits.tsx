"use client";

import { useCallback, useEffect, useState } from "react";

type CreditSnapshot = {
  configured: boolean;
  contract?: { sites?: number; google?: number };
  balance?: {
    active: boolean;
    sitesLimit?: number;
    sitesUsed?: number;
    sitesRemaining: number;
    startedAt?: string;
  };
};

export function useSiteGenerationCredits() {
  const [data, setData] = useState<CreditSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/credits", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Créditos indisponíveis");
      const snapshot = await response.json() as CreditSnapshot;
      setData(snapshot);
      setStatus("ready");
    } catch {
      setStatus("error");
      setData(null);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const balance = data?.configured ? data.balance : undefined;
  const verified = Boolean(balance?.active && Number.isFinite(balance?.sitesRemaining));
  const remaining = verified ? Math.max(0, balance!.sitesRemaining) : null;
  const limit = verified && Number.isFinite(balance?.sitesLimit)
    ? balance!.sitesLimit! : data?.contract?.sites ?? 40;

  return {
    status, refresh, verified, remaining, limit,
    exhausted: verified && remaining === 0,
  };
}

type CreditsState = ReturnType<typeof useSiteGenerationCredits>;

export function SiteGenerationCreditsNotice({ credits }: { credits: CreditsState }) {
  const noBalance = !credits.verified;
  const mainLabel = credits.exhausted
    ? "Créditos de geração esgotados neste ciclo"
    : credits.verified
      ? `${credits.remaining} de ${credits.limit} gerações disponíveis`
      : `Até ${credits.limit} gerações por ciclo`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`px-1 text-xs ${credits.exhausted ? "text-rose-300" : "text-white/55"}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-center">
        <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${credits.exhausted ? "bg-rose-400" : "bg-emerald-400"}`} aria-hidden="true" />
        <span className="font-semibold text-white/75">{mainLabel}</span>
        {!credits.exhausted && (
          <>
            <span className="text-white/25" aria-hidden="true">·</span>
            <span>1 crédito por novo site</span>
          </>
        )}
        <details className="group basis-full text-center">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-emerald-300/85 transition hover:text-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 [&::-webkit-details-marker]:hidden">
            Como funcionam os créditos?
            <span aria-hidden="true" className="text-[10px] transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="mx-auto mt-1 max-w-xl rounded-xl border border-white/10 bg-white/[.035] px-4 py-3 text-left text-xs leading-5 text-white/65">
            <p>O Studio e o CRM compartilham a mesma franquia de gerações por ciclo de assinatura. Uma nova geração concluída utiliza 1 crédito.</p>
            <p className="mt-1">Edições, alterações de texto, troca de imagens, prévias e publicação não consomem créditos de geração.</p>
            {noBalance && (
              <p className="mt-1 text-amber-200/80">
                {credits.status === "loading"
                  ? "Consultando saldo individual..."
                  : credits.status === "error"
                    ? "Saldo indisponível no momento. O servidor valida a geração quando ela é solicitada."
                    : "Saldo individual ainda não confirmado. A quantidade acima é a franquia contratada, não o saldo disponível."}
              </p>
            )}
            {credits.exhausted && <p className="mt-1 text-rose-200">A edição dos projetos existentes continua disponível. Para gerar novamente, aguarde a renovação.</p>}
          </div>
        </details>
      </div>
    </div>
  );
}
