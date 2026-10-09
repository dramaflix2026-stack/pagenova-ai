import { createHmac } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Usage = {
  subscriberId: string;
  subscriptionId: string;
  cycleStart: string;
  cycleEnd: string;
  status: string;
  sitesUsed: number;
  sitesRemaining: number;
  googlePagesUsed: number;
  googlePagesRemaining: number;
};

export default async function AdminConsumptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Explicit UUID allowlist; subscriber entitlement alone never grants admin access.
  const allowed = (process.env.PAGENOVA_ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (!allowed.includes(user.id)) redirect("/app/dashboard");

  const secret = process.env.PAGENOVA_ADMIN_REPORT_SECRET;
  const origin = process.env.PAGENOVA_CRM_API_URL;
  if (!secret || secret.length < 32 || !origin) {
    return <main className="p-8"><h1 className="text-2xl font-bold">Consumo de assinantes</h1><p>Relatório não configurado.</p></main>;
  }
  const target = new URL("/api/internal/pagenova/admin/subscriber-usage", origin);
  if (target.username || target.password || target.search || target.hash ||
      (process.env.NODE_ENV === "production" && target.protocol !== "https:")) {
    throw new Error("Invalid admin report destination");
  }
  const timestamp = String(Date.now());
  const signature = createHmac("sha256", secret).update(["subscriber-usage", timestamp].join("\n")).digest("hex");
  let entries: Usage[] = [];
  let error = "";
  let truncated = false;
  try {
    const response = await fetch(target, {
      headers: { "x-pagenova-admin-timestamp": timestamp, "x-pagenova-admin-signature": signature },
      redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("CRM report unavailable");
    const report = await response.json() as { entries: Usage[]; truncated: boolean };
    entries = report.entries;
    truncated = report.truncated;
  } catch {
    error = "Não foi possível consultar o CRM. Tente novamente mais tarde.";
  }

  return <main className="mx-auto max-w-7xl space-y-6 p-6 text-white">
    <header><h1 className="text-3xl font-bold">Consumo dos assinantes</h1><p className="text-neutral-400">Ciclos de cobrança e franquias individuais</p></header>
    {error && <p role="alert" className="rounded-lg border border-red-600 p-4">{error}</p>}
    {truncated && <p className="text-amber-300">Exibindo somente os 500 ciclos mais recentes.</p>}
    <div className="overflow-x-auto rounded-xl border border-white/15">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="bg-white/10"><tr>{["Assinante", "Assinatura", "Início", "Fim", "Status", "Sites", "Google"].map((label) => <th key={label} className="p-3">{label}</th>)}</tr></thead>
        <tbody>{entries.map((item, index) => <tr key={item.subscriberId + item.cycleStart + index} className="border-t border-white/10">
          <td className="p-3">{item.subscriberId}</td><td className="p-3">{item.subscriptionId}</td>
          <td className="p-3">{new Date(item.cycleStart).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
          <td className="p-3">{new Date(item.cycleEnd).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
          <td className="p-3">{item.status}</td><td className="p-3">{item.sitesUsed}/40 · restam {item.sitesRemaining}</td>
          <td className="p-3">{item.googlePagesUsed}/150 · restam {item.googlePagesRemaining}</td>
        </tr>)}</tbody>
      </table>
      {!error && entries.length === 0 && <p className="p-6 text-neutral-400">Nenhum ciclo encontrado.</p>}
    </div>
  </main>;
}
