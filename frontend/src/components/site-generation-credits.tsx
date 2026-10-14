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
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-2xl border p-4 text-left ${credits.exhausted
        ? "border-red-400/30 bg-red-400/[.07]"
        : "border-emerald-400/25 bg-emerald-400/[.055]"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-white">
          {credits.verified
            ? `Créditos para gerar sites: ${credits.remaining} de ${credits.limit} disponíveis`
            : `Seu plano inclui até ${credits.limit} gerações de sites por ciclo`}
        </p>
        <span className="rounded-full border border-emerald-400/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
          1 crédito por novo site
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-white/65">
        {credits.exhausted
          ? "Seus créditos de geração acabaram neste ciclo. Você pode continuar editando, visualizando e publicando os projetos existentes."
          : credits.status === "loading"
            ? "Verificando seu saldo individual..."
            : credits.status === "error"
              ? "Não foi possível consultar o saldo agora. O servidor vai validar os créditos quando você solicitar a geração."
              : !credits.verified
                ? "Saldo individual ainda não confirmado. A quantidade acima é a franquia contratada, não um saldo disponível."
                : "Uma geração inicial concluída consome 1 crédito. As gerações feitas no CRM também utilizam este mesmo saldo."}
      </p>
      {!credits.exhausted && (
        <p className="mt-1 text-xs leading-5 text-white/50">
          Edições, alterações de texto, troca de imagens, prévias e publicação não gastam crédito de geração.
        </p>
      )}
    </div>
  );
}
