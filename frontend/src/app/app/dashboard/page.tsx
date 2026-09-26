"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { listPageNovaProjects } from "@/lib/pagenova-project-store";

type Stage = "novo" | "contato" | "proposta" | "fechado";

type Lead = {
  id: string;
  name: string;
  company: string;
  amount: number;
  owner: string;
  source: string;
  stage: Stage;
  createdAt: string;
};

type CrmProject = {
  kind: "sales-crm";
  id: string;
  name: string;
  leads: Lead[];
  updatedAt: string;
};

const stages: { id: Stage; label: string; color: string }[] = [
  { id: "novo", label: "Novo", color: "bg-sky-400" },
  { id: "contato", label: "Contato", color: "bg-amber-400" },
  { id: "proposta", label: "Proposta", color: "bg-violet-400" },
  { id: "fechado", label: "Fechado", color: "bg-emerald-400" },
];

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(value);

function safeAmount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<CrmProject[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function reload() {
    setLoading(true);
    listPageNovaProjects<CrmProject>()
      .then((items) => {
        const crms = items.filter((item) =>
          item?.kind === "sales-crm" && typeof item.id === "string" && Array.isArray(item.leads)
        ).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
        setProjects(crms);
        setSelectedId((current) =>
          crms.some((item) => item.id === current) ? current : crms[0]?.id || "");
        setError("");
      })
      .catch(() => setError("Não foi possível ler os projetos salvos neste navegador."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    const refresh = () => reload();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const selected = projects.find((project) => project.id === selectedId);
  const allLeads = useMemo(() => selected?.leads || [], [selected]);
  const owners = useMemo(() =>
    [...new Set(allLeads.map((lead) => lead.owner).filter(Boolean))].sort(),
    [allLeads]);

  const leads = useMemo(() =>
    allLeads.filter((lead) => !ownerFilter || lead.owner === ownerFilter),
    [allLeads, ownerFilter]);

  const active = leads.filter((lead) => lead.stage !== "fechado");
  const won = leads.filter((lead) => lead.stage === "fechado");
  const pipeline = active.reduce((sum, lead) => sum + safeAmount(lead.amount), 0);
  const revenue = won.reduce((sum, lead) => sum + safeAmount(lead.amount), 0);
  const totalValue = leads.reduce((sum, lead) => sum + safeAmount(lead.amount), 0);
  const conversion = leads.length ? Math.round(won.length / leads.length * 100) : 0;
  const average = leads.length ? totalValue / leads.length : 0;

  const stageData = stages.map((stage) => {
    const items = leads.filter((lead) => lead.stage === stage.id);
    return {
      ...stage,
      count: items.length,
      value: items.reduce((sum, lead) => sum + safeAmount(lead.amount), 0),
    };
  });

  const ownerData = [...new Set(leads.map((lead) => lead.owner || "Sem responsável"))]
    .map((owner) => {
      const items = leads.filter((lead) => (lead.owner || "Sem responsável") === owner);
      return {
        owner,
        count: items.length,
        open: items.filter((lead) => lead.stage !== "fechado").length,
        value: items.reduce((sum, lead) => sum + safeAmount(lead.amount), 0),
      };
    })
    .sort((a, b) => b.value - a.value);

  const orderedLeads = [...leads].sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || ""));

  return <>
    <AppHeader title="Dashboard de Vendas" description="Indicadores calculados a partir dos leads do CRM." />
    <main className="mx-auto max-w-[1600px] px-5 py-8 lg:px-9">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Link href="/app/builder" className="text-sm text-emerald-300 hover:underline">
            ← Voltar à criação
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Dashboard / Painel</h1>
          <p className="mt-2 text-sm text-white/50">
            Os números vêm dos negócios cadastrados neste navegador.
          </p>
        </div>
        <button onClick={reload} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold hover:border-emerald-400/50">
          Atualizar dados
        </button>
      </div>

      {error && <p role="alert" className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
        {error}
      </p>}
      {loading && <p className="mt-8 text-white/50">Carregando dados...</p>}

      {!loading && !error && projects.length === 0 && <section className="mt-8 rounded-2xl border border-white/10 bg-[#111923] p-8">
        <h2 className="text-xl font-bold">Seu painel começa com um CRM</h2>
        <p className="mt-2 max-w-xl leading-7 text-white/55">
          Crie um CRM, cadastre seus leads e volte aqui para acompanhar o funil e os indicadores.
        </p>
        <Link href="/app/crm" className="mt-6 inline-flex rounded-xl bg-emerald-400 px-5 py-3 font-bold text-[#08130e]">
          Criar CRM →
        </Link>
      </section>}

      {!loading && selected && <>
        <div className="mt-8 flex flex-wrap gap-4">
          <label className="text-sm text-white/65">Projeto
            <select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setOwnerFilter(""); }}
              className="ml-3 rounded-xl border border-white/15 bg-[#171b26] px-4 py-3 text-white">
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          <label className="text-sm text-white/65">Responsável
            <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}
              className="ml-3 rounded-xl border border-white/15 bg-[#171b26] px-4 py-3 text-white">
              <option value="">Todos</option>
              {owners.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
            </select>
          </label>
          <Link href={`/app/crm?project=${encodeURIComponent(selected.id)}`}
            className="rounded-xl border border-emerald-400/40 px-4 py-3 text-sm font-semibold text-emerald-300">
            Abrir CRM →
          </Link>
        </div>

        <section aria-label="Indicadores" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Em negociação", money(pipeline), `${active.length} negócios ativos`],
            ["Negócios fechados", money(revenue), `${won.length} negócios ganhos`],
            ["Conversão", `${conversion}%`, "Fechados sobre o total"],
            ["Ticket médio", money(average), `${leads.length} leads analisados`],
          ].map(([label, value, detail]) => <article key={label}
            className="rounded-2xl border border-white/10 bg-[#111923] p-6">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-emerald-300">{label}</p>
            <strong className="mt-4 block text-3xl tracking-tight">{value}</strong>
            <p className="mt-2 text-xs text-white/45">{detail}</p>
          </article>)}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-2xl border border-white/10 bg-[#111923] p-6">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Funil</span>
            <h2 className="mt-2 text-xl font-bold">Valor por etapa</h2>
            <div className="mt-7 space-y-6">
              {stageData.map((stage) => <div key={stage.id}>
                <div className="mb-2 flex justify-between gap-4 text-sm">
                  <span className="flex items-center gap-2"><i className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                    {stage.label} <span className="text-white/40">({stage.count})</span></span>
                  <strong>{money(stage.value)}</strong>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${stage.color}`}
                    style={{ width: `${totalValue ? stage.value / totalValue * 100 : 0}%` }} />
                </div>
              </div>)}
            </div>
            {leads.length === 0 && <p className="mt-7 text-sm text-white/45">Nenhum lead cadastrado neste filtro.</p>}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#111923] p-6">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Equipe</span>
            <h2 className="mt-2 text-xl font-bold">Por responsável</h2>
            <div className="mt-6 space-y-3">
              {ownerData.map((item) => <div key={item.owner}
                className="rounded-xl border border-white/10 bg-black/15 p-4">
                <div className="flex justify-between gap-3"><strong className="truncate">{item.owner}</strong>
                  <b className="text-emerald-300">{money(item.value)}</b></div>
                <p className="mt-2 text-xs text-white/45">{item.count} leads · {item.open} em negociação</p>
              </div>)}
              {ownerData.length === 0 && <p className="text-sm text-white/45">Sem responsáveis para exibir.</p>}
            </div>
          </section>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#111923]">
          <div className="flex flex-wrap justify-between gap-3 border-b border-white/10 p-6">
            <div><span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Negócios</span>
              <h2 className="mt-2 text-xl font-bold">Leads recentes</h2></div>
            <span className="text-sm text-white/45">{orderedLeads.length} registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/50">
                <tr><th className="p-4">Lead</th><th className="p-4">Empresa</th>
                  <th className="p-4">Etapa</th><th className="p-4">Responsável</th>
                  <th className="p-4 text-right">Valor</th></tr>
              </thead>
              <tbody>
                {orderedLeads.slice(0, 25).map((lead) => <tr key={lead.id} className="border-t border-white/10">
                  <td className="p-4 font-semibold">{lead.name}</td>
                  <td className="p-4 text-white/60">{lead.company || "—"}</td>
                  <td className="p-4">{stages.find((stage) => stage.id === lead.stage)?.label || lead.stage}</td>
                  <td className="p-4 text-white/60">{lead.owner || "—"}</td>
                  <td className="p-4 text-right font-semibold text-emerald-300">{money(safeAmount(lead.amount))}</td>
                </tr>)}
              </tbody>
            </table>
            {orderedLeads.length === 0 && <p className="p-6 text-sm text-white/45">
              Cadastre um lead no CRM para preencher este painel.
            </p>}
          </div>
        </section>
      </>}
    </main>
  </>;
}