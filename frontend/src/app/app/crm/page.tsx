"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const CRM_ROUTES: Record<string, string> = {
  dashboard: "/",
  buscar: "/buscar",
  crm: "/crm",
  reunioes: "/reunioes",
  "sites-ia": "/sites-ia",
  importar: "/importar",
  servicos: "/servicos",
  financeiro: "/financeiro",
  metas: "/metas",
  equipe: "/equipe",
  configuracoes: "/configuracoes",
};

export default function CrmPage() {
  const searchParams = useSearchParams();
  const crmView = searchParams.get("view") ?? "dashboard";
  const iframeSrc = useMemo(
    () => `/stavo-crm/index.html#${CRM_ROUTES[crmView] ?? "/"}`,
    [crmView],
  );

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    void fetch("/api/crm/me", { cache: "no-store", credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) throw new Error("CRM indisponivel");
        if (active) setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => { active = false; };
  }, []);

  if (status === "ready") {
    return (
      <main className="flex h-[calc(100vh-4rem)] min-h-[640px] flex-col overflow-hidden bg-[#070b14]">
        {(crmView === "crm" || crmView === "sites-ia" || crmView === "buscar") && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-400/20 bg-[#10221e] px-4 py-2 text-sm text-white"><span>Template universal disponível para testes. A importação automática do lead ainda não está ativa.</span><Link href="/templates/universal" className="rounded-lg bg-emerald-400 px-3 py-2 font-bold text-[#08130e]">Abrir gerador universal →</Link></div>}
        <iframe
          src={iframeSrc}
          title="PageNova CRM"
          className="min-h-0 w-full flex-1 border-0"
          onLoad={(event) => {
            // The PageNova workspace already provides the primary navigation.
            // Hide only the redundant sidebar inside the embedded CRM.
            const doc = event.currentTarget.contentDocument;
            if (!doc || doc.getElementById("pagenova-hide-embedded-crm-nav")) return;
            const style = doc.createElement("style");
            style.id = "pagenova-hide-embedded-crm-nav";
            style.textContent = "@media (min-width: 1024px) { aside.w-60 { display: none !important; } }";
            doc.head.appendChild(style);
          }}
          allow="clipboard-read; clipboard-write"
        />
      </main>
    );
  }

  return (
    <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[#070b14] p-6 text-white">
      <div className="max-w-lg text-center">
        <div className={`mx-auto mb-5 h-3 w-3 rounded-full ${status === "error" ? "bg-red-400" : "animate-pulse bg-amber-400"}`} />
        <p className="text-lg font-medium">
          {status === "error" ? "Nao foi possivel conectar o CRM." : "Conectando seu CRM ao PageNova..."}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          {status === "error" ? "Atualize a pagina para tentar novamente." : "Preparando seu workspace e carregando a interface."}
        </p>
      </div>
    </main>
  );
}
