"use client";

import { useEffect } from "react";

export default function BuilderError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[Builder 2.0] Falha de carregamento:", error); }, [error]);
  return <main className="min-h-screen bg-[#0b1110] flex items-center justify-center p-6 text-white">
    <section className="max-w-lg w-full rounded-2xl border border-white/15 bg-[#16231c] p-7 text-center shadow-xl">
      <h1 className="text-2xl font-semibold">Não foi possível carregar o editor</h1>
      <p className="mt-3 text-sm text-white/70">Seu projeto e suas alterações salvas não foram apagados. Tente abrir novamente o editor.</p>
      <button onClick={() => reset()} className="mt-6 rounded-xl bg-lime-400 px-6 py-3 font-semibold text-black">Tentar novamente</button>
      <p className="mt-4 text-xs text-white/45">Diagnóstico: {error.name}: {error.message || "sem mensagem"} {error.digest ? `(código ${error.digest})` : ""}</p>
      {error.stack && <details className="mt-4 text-left text-xs text-white/60"><summary className="cursor-pointer">Detalhes técnicos</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all">{error.stack.slice(0,2200)}</pre></details>}
    </section>
  </main>;
}
