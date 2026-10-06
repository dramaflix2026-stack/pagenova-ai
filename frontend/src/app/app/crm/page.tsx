"use client";

import { useEffect, useState } from "react";

export default function CrmPage() {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("Conectando seu CRM ao PageNova...");

  useEffect(() => {
    let active = true;
    void fetch("/api/crm/me", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("CRM indisponivel");
        if (active) {
          setReady(true);
          setMessage("CRM conectado. A interface integrada sera carregada nesta area.");
        }
      })
      .catch(() => {
        if (active) setMessage("Nao foi possivel conectar o CRM. Verifique a configuracao da integracao.");
      });
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#070b14] p-6 text-white">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
        <div className="border-b border-white/10 px-7 py-6">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400">PageNova</div>
          <h1 className="mt-2 text-3xl font-semibold">CRM</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Leads, funil, reunioes, vendas e prospeccao no mesmo ecossistema PageNova.</p>
        </div>
        <div className="grid min-h-[520px] place-items-center p-8">
          <div className="max-w-lg text-center">
            <div className={`mx-auto mb-5 h-3 w-3 rounded-full ${ready ? "bg-emerald-400" : "animate-pulse bg-amber-400"}`} />
            <p className="text-lg font-medium">{message}</p>
            <p className="mt-3 text-sm text-slate-500">Seu acesso e liberado automaticamente pelo plano PageNova ativo.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
