"use client";

import { useEffect, useState } from "react";

export default function CrmPage() {
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
      <main className="h-[calc(100vh-4rem)] min-h-[640px] overflow-hidden bg-[#070b14]">
        <iframe
          src="/stavo-crm/index.html#/"
          title="PageNova CRM"
          className="h-full w-full border-0"
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
