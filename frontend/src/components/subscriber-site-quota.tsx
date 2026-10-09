"use client";

import { useEffect, useState } from "react";

type Balance = { used: number; limit: number; remaining: number; cycleEnd: string; google?: { used: number; limit: number; remaining: number } };

export function SubscriberSiteQuota() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/crm/pagenova/subscriber-site-usage", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Quota unavailable");
        return response.json() as Promise<Balance>;
      })
      .then((data) => {
        if (Number.isInteger(data.used) && Number.isInteger(data.limit) && Number.isInteger(data.remaining)) setBalance(data);
        else setUnavailable(true);
      })
      .catch((error: unknown) => {
        if (!(error instanceof Error && error.name === "AbortError")) setUnavailable(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <section aria-label="Saldo de gerações de sites com IA" className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold">Gerações de sites com IA</h2>
      {balance ? (
        <>
          <p className="mt-2 text-sm">Você utilizou {balance.used} de {balance.limit} gerações neste ciclo.</p>
          <p className="mt-1 text-2xl font-bold">{balance.remaining} disponíveis</p>
          <div role="progressbar" aria-valuenow={balance.used} aria-valuemin={0} aria-valuemax={balance.limit}
            className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, Math.max(0, balance.used / Math.max(1, balance.limit) * 100))}%` }} />
          </div>
          <p className="mt-2 text-xs opacity-70">Saldo compartilhado entre o CRM e o gerador de sites.</p>
          {balance.google && <p className="mt-4 text-sm">Google: {balance.google.remaining} de {balance.google.limit} paginas restantes.</p>}
        </>
      ) : <p className="mt-2 text-sm opacity-70">{unavailable ? "Saldo indisponível: aguardando confirmação do ciclo de assinatura." : "Consultando saldo..."}</p>}
    </section>
  );
}
