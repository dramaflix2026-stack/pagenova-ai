"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const CRM_ROUTES: Record<string, string> = {
  dashboard: "/",
  buscar: "/buscar",
  pesquisadas: "/pesquisadas",
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

/**
 * Compatibility guard for stale CRM frontend bundles that still display an
 * internal "universal template" development banner above the Sites with AI
 * screen. Do not hide other banners or change the site's generator routes.
 *
 * The current CRM source has removed this old announcement, but a cached
 * compiled frontend may still render it. The guard stops watching shortly
 * after the embedded application mounts.
 */
function hideLegacyUniversalAnnouncement(doc: Document): void {
  const hide = () => {
    const actions = doc.querySelectorAll<HTMLElement>("a,button");
    for (const action of actions) {
      if (!action.textContent?.includes("Abrir gerador universal")) continue;
      let panel: HTMLElement | null = action.parentElement;
      while (panel && panel !== doc.body) {
        const label = panel.textContent ?? "";
        if (label.includes("Template universal disponível") && label.length < 360) {
          // Hiding (not removing) avoids interfering with React's DOM reconciliation.
          panel.style.setProperty("display", "none", "important");
          return true;
        }
        panel = panel.parentElement;
      }
    }
    return false;
  };

  if (hide() || !doc.body) return;
  const view = doc.defaultView;
  if (!view) return;
  const observer = new MutationObserver(() => {
    if (hide()) observer.disconnect();
  });
  observer.observe(doc.body, { childList: true, subtree: true });
  view.setTimeout(() => observer.disconnect(), 12_000);
}

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
        <iframe
          src={iframeSrc}
          title="PageNova CRM"
          className="min-h-0 w-full flex-1 border-0"
          onLoad={(event) => {
            // The PageNova workspace already provides the primary navigation.
            // Hide only the redundant sidebar inside the embedded CRM.
            const doc = event.currentTarget.contentDocument;
            if (!doc) return;
            if (!doc.getElementById("pagenova-hide-embedded-crm-nav")) {
              const style = doc.createElement("style");
              style.id = "pagenova-hide-embedded-crm-nav";
              style.textContent = "@media (min-width: 1024px) { aside.w-60 { display: none !important; } }";
              doc.head.appendChild(style);
            }
            // Only the Sites with AI view needs the legacy-banner safeguard.
            if (crmView === "sites-ia") {
              hideLegacyUniversalAnnouncement(doc);
              hideLegacyUniversalAnnouncement(document);
            }
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
