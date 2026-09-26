"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { readPageNovaProject, savePageNovaProject } from "@/lib/pagenova-project-store";

type Stage = "novo" | "contato" | "proposta" | "fechado";

type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  amount: number;
  owner: string;
  source: string;
  notes: string;
  stage: Stage;
  createdAt: string;
};

type CrmProject = {
  kind: "sales-crm";
  id: string;
  name: string;
  leads: Lead[];
  createdAt: string;
  updatedAt: string;
};

const stages: { id: Stage; label: string; color: string }[] = [
  { id: "novo", label: "Novo", color: "bg-sky-400" },
  { id: "contato", label: "Contato", color: "bg-amber-400" },
  { id: "proposta", label: "Proposta", color: "bg-violet-400" },
  { id: "fechado", label: "Fechado", color: "bg-emerald-400" },
];

const emptyLead = (): Lead => ({
  id: "",
  name: "",
  company: "",
  email: "",
  phone: "",
  amount: 0,
  owner: "",
  source: "",
  notes: "",
  stage: "novo",
  createdAt: "",
});

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(value);

export default function CrmPage() {
  const [project, setProject] = useState<CrmProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingName, setCreatingName] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [draft, setDraft] = useState<Lead | null>(null);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("project");
    if (!id) {
      setLoading(false);
      return;
    }
    readPageNovaProject<CrmProject>(id)
      .then((saved) => {
        if (!saved || saved.kind !== "sales-crm" || !Array.isArray(saved.leads)) {
          setError("CRM não encontrado neste navegador.");
          return;
        }
        setProject(saved);
      })
      .catch(() => setError("Não foi possível abrir este CRM."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!project) return;
    setSaveState("Salvando...");
    const timer = window.setTimeout(() => {
      savePageNovaProject(project.id, project)
        .then(() => { setSaveState("Salvo neste navegador"); setError(""); })
        .catch(() => {
          setSaveState("Erro ao salvar");
          setError("Não foi possível salvar os dados. Verifique o armazenamento do navegador.");
        });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [project]);

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = creatingName.trim();
    if (name.length < 2) return;
    const now = new Date().toISOString();
    const next: CrmProject = {
      kind: "sales-crm", id: crypto.randomUUID(), name,
      leads: [], createdAt: now, updatedAt: now,
    };
    window.history.replaceState(null, "", `/app/crm?project=${next.id}`);
    setError("");
    setProject(next);
  }

  function updateLeads(leads: Lead[]) {
    if (!project) return;
    setProject({ ...project, leads, updatedAt: new Date().toISOString() });
  }

  function saveLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !draft || draft.name.trim().length < 2) return;
    if (!Number.isFinite(draft.amount) || draft.amount < 0) {
      setError("Informe um valor válido para o negócio.");
      return;
    }
    const next: Lead = {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      name: draft.name.trim(),
      company: draft.company.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      owner: draft.owner.trim(),
      source: draft.source.trim(),
      notes: draft.notes.trim(),
      createdAt: draft.createdAt || new Date().toISOString(),
    };
    updateLeads(draft.id
      ? project.leads.map((lead) => lead.id === draft.id ? next : lead)
      : [...project.leads, next]);
    setDraft(null);
    setError("");
  }

  function moveLead(id: string, stage: Stage) {
    if (!project) return;
    updateLeads(project.leads.map((lead) =>
      lead.id === id ? { ...lead, stage } : lead));
  }

  function deleteLead(id: string) {
    if (!project || !window.confirm("Excluir este lead?")) return;
    updateLeads(project.leads.filter((lead) => lead.id !== id));
    setDraft(null);
  }

  const owners = useMemo(() =>
    [...new Set((project?.leads || []).map((lead) => lead.owner).filter(Boolean))].sort(),
    [project]);

  const visible = useMemo(() =>
    (project?.leads || []).filter((lead) => !ownerFilter || lead.owner === ownerFilter),
    [project, ownerFilter]);

  const open = visible.filter((lead) => lead.stage !== "fechado");
  const closed = visible.filter((lead) => lead.stage === "fechado");
  const pipeline = open.reduce((sum, lead) => sum + lead.amount, 0);
  const closedAmount = closed.reduce((sum, lead) => sum + lead.amount, 0);
  const conversion = visible.length ? Math.round(closed.length / visible.length * 100) : 0;
  const average = visible.length
    ? visible.reduce((sum, lead) => sum + lead.amount, 0) / visible.length : 0;

  return <>
    <AppHeader title="CRM de Vendas" description="Acompanhe negócios, responsáveis e cada etapa do funil." />
    <main className="mx-auto max-w-[1700px] px-5 py-8 lg:px-9">
      {loading && <p className="text-white/60">Abrindo CRM...</p>}

      {!loading && !project && <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-[#11101b] p-8">
        <span className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Novo projeto</span>
        <h1 className="mt-3 text-3xl font-bold">Crie seu CRM de vendas</h1>
        <p className="mt-3 leading-7 text-white/55">
          Comece com um funil vazio e cadastre seus leads reais. Os dados serão salvos neste navegador.
        </p>
        <form onSubmit={createProject} className="mt-7 space-y-5">
          <label className="block text-sm font-semibold">Nome do CRM
            <input required minLength={2} maxLength={90} value={creatingName}
              onChange={(event) => setCreatingName(event.target.value)}
              placeholder="Ex.: Comercial 3NG"
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-4 outline-none focus:border-cyan-400" />
          </label>
          <button className="w-full rounded-xl bg-cyan-400 px-5 py-4 font-bold text-[#06131b] hover:bg-cyan-300">
            Criar CRM →
          </button>
        </form>
        {error && <p role="alert" className="mt-5 text-sm text-red-300">{error}</p>}
      </section>}

      {project && <>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Link href="/app/builder" className="text-sm text-cyan-300 hover:underline">← Voltar à criação</Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="mt-2 text-sm text-white/45">CRM salvo neste navegador · {saveState}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="text-sm text-white/65">
              Responsável
              <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}
                className="ml-3 rounded-xl border border-white/15 bg-[#171b26] px-4 py-3 text-white">
                <option value="">Todos</option>
                {owners.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
              </select>
            </label>
            <button onClick={() => setDraft(emptyLead())}
              className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-[#06131b] hover:bg-cyan-300">
              + Novo lead
            </button>
          </div>
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">{error}</p>}

        <section aria-label="Resumo do funil" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Em negociação", money(pipeline), `${open.length} leads ativos`],
            ["Taxa de conversão", `${conversion}%`, `${closed.length} fechados`],
            ["Total de leads", String(visible.length), "no filtro atual"],
            ["Ticket médio", money(average), `Fechados: ${money(closedAmount)}`],
          ].map(([label, value, detail]) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-[#111923] p-5">
              <p className="text-xs uppercase tracking-widest text-cyan-300">{label}</p>
              <strong className="mt-3 block text-2xl">{value}</strong>
              <p className="mt-1 text-xs text-white/45">{detail}</p>
            </article>
          ))}
        </section>

        <p className="mt-7 text-sm text-white/45">
          Arraste um cartão para mudar a etapa ou abra o lead e escolha a etapa no formulário.
        </p>
        <section aria-label="Funil de vendas" className="mt-4 grid gap-4 xl:grid-cols-4">
          {stages.map((stage) => {
            const leads = visible.filter((lead) => lead.stage === stage.id);
            const total = leads.reduce((sum, lead) => sum + lead.amount, 0);
            return <div key={stage.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("text/plain");
                if (id && project.leads.some((lead) => lead.id === id)) moveLead(id, stage.id);
              }}
              className="min-h-72 rounded-2xl border border-white/10 bg-[#0d141c] p-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                <h2 className="font-bold uppercase">{stage.label}</h2>
                <span className="ml-auto text-sm text-white/45">{leads.length}</span>
              </div>
              <p className="my-4 text-sm text-white/50">{money(total)}</p>
              <div className="space-y-3">
                {leads.map((lead) => <button key={lead.id} type="button" draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", lead.id)}
                  onClick={() => setDraft({ ...lead })}
                  className="block w-full cursor-grab rounded-xl border border-white/10 bg-[#17212b] p-4 text-left transition hover:border-cyan-400/50">
                  <strong className="block truncate">{lead.name}</strong>
                  <span className="mt-1 block truncate text-xs text-white/45">{lead.company || "Empresa não informada"}</span>
                  <span className="mt-4 flex items-center justify-between gap-2">
                    <b className="text-sm text-cyan-300">{money(lead.amount)}</b>
                    <small className="truncate text-white/45">{lead.owner || "Sem responsável"}</small>
                  </span>
                </button>)}
                {leads.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/35">
                  Nenhum lead nesta etapa.
                </p>}
              </div>
            </div>;
          })}
        </section>
      </>}

      {draft && project && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        onMouseDown={(event) => { if (event.target === event.currentTarget) setDraft(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="crm-dialog-title"
          className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-[#141b25] p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <h2 id="crm-dialog-title" className="text-2xl font-bold">{draft.id ? "Editar lead" : "Novo lead"}</h2>
            <button type="button" onClick={() => setDraft(null)} aria-label="Fechar"
              className="rounded-lg border border-white/15 px-3 py-2">✕</button>
          </div>
          <form onSubmit={saveLead} className="mt-6 grid gap-4 sm:grid-cols-2">
            {([
              ["name", "Nome", true], ["company", "Empresa", false],
              ["email", "E-mail", false], ["phone", "Telefone", false],
              ["owner", "Responsável", false], ["source", "Origem", false],
            ] as const).map(([key, label, required]) => <label key={key} className="text-sm">
              {label}
              <input required={required} type={key === "email" ? "email" : "text"}
                maxLength={key === "email" ? 160 : 100}
                value={draft[key]}
                onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 p-3 outline-none focus:border-cyan-400" />
            </label>)}
            <label className="text-sm">Valor do negócio (R$)
              <input type="number" min="0" step="0.01" required value={draft.amount}
                onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 p-3 outline-none focus:border-cyan-400" />
            </label>
            <label className="text-sm">Etapa
              <select value={draft.stage}
                onChange={(event) => setDraft({ ...draft, stage: event.target.value as Stage })}
                className="mt-2 w-full rounded-xl border border-white/15 bg-[#141b25] p-3">
                {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">Observações
              <textarea rows={4} maxLength={2000} value={draft.notes}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 p-3 outline-none focus:border-cyan-400" />
            </label>
            <div className="flex flex-wrap justify-between gap-3 sm:col-span-2">
              {draft.id ? <button type="button" onClick={() => deleteLead(draft.id)}
                className="rounded-xl border border-red-400/40 px-4 py-3 text-red-300">Excluir lead</button>
                : <span />}
              <button className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-[#06131b]">
                Salvar lead
              </button>
            </div>
          </form>
        </section>
      </div>}
    </main>
  </>;
}