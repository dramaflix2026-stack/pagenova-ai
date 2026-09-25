"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { readPageNovaProject, savePageNovaProject } from "@/lib/pagenova-project-store";
import { renderSitePreview, SITE_PAGES, type SitePage, type SitePageKey, type SiteProject } from "@/lib/site-builder";
import { getSitePreset, SITE_PRESETS } from "@/lib/site-builder-presets";

type Phase = "idle" | "generating" | "ready" | "error";

const projectOptions = [
  { title: "Landing Page", description: "Uma página para apresentar e vender uma oferta.", icon: "🚀", kind: "link", href: "/app/gerador" },
  { title: "Clonar Página", description: "Comece a partir de uma URL existente.", icon: "◇", kind: "link", href: "/app/cloner" },
  { title: "Loja Online", description: "Catálogo, carrinho e pedidos.", icon: "🛍", kind: "future" },
  { title: "Dashboard", description: "Painéis com dados e indicadores.", icon: "▤", kind: "future" },
  { title: "CRM", description: "Clientes, negócios e acompanhamento.", icon: "◎", kind: "future" },
  { title: "Agendamento", description: "Horários, reservas e confirmações.", icon: "◷", kind: "future" },
  { title: "Área de Membros", description: "Conteúdo e acesso para assinantes.", icon: "♧", kind: "future" },
  { title: "Quiz e Formulário", description: "Perguntas, respostas e captação.", icon: "☷", kind: "future" },
] as const;

export default function BuilderPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [brief, setBrief] = useState(SITE_PRESETS[0].brief);
  const [style, setStyle] = useState("moderno");
  const [contactEmail, setContactEmail] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("institucional");
  const selectedPreset = getSitePreset(selectedPresetId);
  const [project, setProject] = useState<SiteProject | null>(null);
  const [activePage, setActivePage] = useState<SitePageKey>("home");
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentStep, setCurrentStep] = useState<SitePageKey | null>(null);
  const [error, setError] = useState("");
  const [instruction, setInstruction] = useState("");
  const [pendingKeys, setPendingKeys] = useState<SitePageKey[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    function handlePreviewNavigation(event: MessageEvent) {
      if (event.source !== previewRef.current?.contentWindow || event.data?.type !== "pagenova-site-preview-page") return;
      const key = event.data.key as SitePageKey;
      if (SITE_PAGES.some((item) => item.key === key) && project?.pages[key]) setActivePage(key);
    }
    window.addEventListener("message", handlePreviewNavigation);
    return () => window.removeEventListener("message", handlePreviewNavigation);
  }, [project]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("project");
    if (!id) return;
    readPageNovaProject<SiteProject>(id).then((saved) => {
      if (!saved || saved.kind !== "institutional-site") return;
      setProject(saved); setName(saved.name); setBrief(saved.brief); setStyle(saved.style); setContactEmail(saved.contactEmail || "");
      setSelectedPresetId(saved.presetId || "institucional");
      setActivePage(SITE_PAGES.find(({ key }) => saved.pages[key])?.key ?? "home");
      setPhase("ready");
    }).catch(() => setError("Não foi possível abrir o projeto salvo."));
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function requestPage(site: SiteProject, key: SitePageKey, editInstruction = ""): Promise<SitePage> {
    const controller = new AbortController();
    abortRef.current = controller;
    const response = await fetch("/api/builder/generate", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ name: site.name, brief: site.brief, style: site.style, key, presetId: site.presetId,
        instruction: editInstruction, existingPage: editInstruction ? JSON.stringify(site.pages[key]) : "" }),
    });
    const data = await response.json() as { page?: SitePage; error?: string };
    if (!response.ok || !data.page) throw new Error(data.error || "Não foi possível gerar a página.");
    return data.page;
  }

  async function generatePages(site: SiteProject, keys: SitePageKey[]) {
    setPhase("generating"); setError(""); setPendingKeys(keys);
    let current = site;
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      setCurrentStep(key);
      try {
        const page = await requestPage(current, key);
        current = { ...current, pages: { ...current.pages, [key]: page } };
        await savePageNovaProject(current.id, current);
        setProject(current); setActivePage(key); setPendingKeys(keys.slice(index + 1));
      } catch (cause) {
        if ((cause as Error).name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Falha na geração.");
        setPendingKeys(keys.slice(index)); setPhase("error"); setCurrentStep(null);
        return;
      }
    }
    setCurrentStep(null); setPendingKeys([]); setPhase("ready");
  }

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase === "generating") return;
    if (name.trim().length < 2 || brief.trim().length < 20) {
      setError("Informe o nome e descreva o negócio com pelo menos 20 caracteres."); return;
    }
    const site: SiteProject = { kind: "institutional-site", id: crypto.randomUUID(), name: name.trim(),
      presetId: selectedPresetId, brief: brief.trim(), style, contactEmail: contactEmail.trim(), pages: {}, createdAt: new Date().toISOString() };
    setProject(site); setActivePage("home");
    router.replace(`/app/builder?project=${site.id}`);
    void generatePages(site, SITE_PAGES.map(({ key }) => key));
  }

  async function revise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !instruction.trim() || phase === "generating") return;
    setError(""); setPhase("generating"); setCurrentStep(activePage);
    try {
      const page = await requestPage(project, activePage, instruction.trim());
      const updated = { ...project, pages: { ...project.pages, [activePage]: page } };
      await savePageNovaProject(updated.id, updated);
      setProject(updated); setInstruction(""); setPhase("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível aplicar a alteração."); setPhase("error");
    } finally { setCurrentStep(null); }
  }

  const preview = project ? renderSitePreview(project, activePage) : "";

  return <>
    <AppHeader title="Criar Site com IA" description="Descreva seu negócio e acompanhe cada página aparecer." />
    <main className="mx-auto max-w-[1600px] px-5 py-8 lg:px-9">
      {!project && <div className="mx-auto max-w-5xl">
        <div className="mb-8"><span className="text-xs font-bold uppercase tracking-[.18em] text-emerald-400">PageNova Builder · {selectedPreset.title}</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">O que vamos criar hoje?</h1>
          <p className="mt-3 text-white/50">Escolha um ponto de partida, descreva sua ideia e acompanhe a criação na tela.</p></div>
        <form onSubmit={start} className="mx-auto max-w-3xl space-y-5 rounded-3xl border border-white/10 bg-[#11101b] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">{selectedPreset.title}</p>
          <label className="block text-sm font-medium">Nome do negócio<input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required placeholder="Ex.: Clínica Horizonte" className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-4 text-white outline-none focus:border-emerald-400" /></label>
          <label className="block text-sm font-medium">E-mail que receberá os contatos<input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} required placeholder="contato@suaempresa.com.br" className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-4 text-white outline-none focus:border-emerald-400" /></label><label className="block text-sm font-medium">Briefing do site <span className="font-normal text-white/45">· edite os campos entre colchetes e acrescente seus dados</span><textarea value={brief} onChange={(event) => setBrief(event.target.value)} maxLength={2800} rows={10} required className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-black/30 p-4 leading-7 text-white outline-none focus:border-emerald-400" /></label>
          <div className="flex flex-wrap gap-2">{selectedPreset.modules.map((module) => <span key={module} className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-xs text-emerald-200">{module}</span>)}</div>
          <fieldset><legend className="mb-3 text-sm font-medium">Estilo visual</legend><div className="grid gap-3 sm:grid-cols-3">{["moderno", "elegante", "vibrante"].map((item) => <label key={item} className={`cursor-pointer rounded-xl border p-4 capitalize ${style === item ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"}`}><input type="radio" name="style" value={item} checked={style === item} onChange={() => setStyle(item)} className="mr-2 accent-emerald-400" />{item}</label>)}</div></fieldset>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <button className="w-full rounded-xl bg-emerald-400 px-5 py-4 font-bold text-[#08130e] hover:bg-emerald-300">Criar {selectedPreset.title.toLowerCase()} →</button>
        </form>
        <section className="mt-12" aria-labelledby="builder-options-title">
          <div className="mb-5"><h2 id="builder-options-title" className="text-2xl font-bold">Explore o que você pode criar</h2><p className="mt-2 text-sm text-white/45">Escolha uma opção para começar. As próximas funções aparecem com seu status real.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{SITE_PRESETS.map((option) => <button type="button" key={option.id} onClick={() => { setSelectedPresetId(option.id); setName(""); setBrief(option.brief); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-pressed={selectedPresetId === option.id} className={`block min-h-48 rounded-2xl border p-5 text-left transition hover:border-emerald-400/45 ${selectedPresetId === option.id ? "border-emerald-400/70 bg-emerald-400/10" : "border-white/10 bg-[#11101b]"}`}><span className="text-2xl" aria-hidden="true">{option.icon}</span><span className="mt-4 block text-lg font-semibold">{option.title}</span><span className="mt-2 block text-sm leading-6 text-white/45">{option.description}</span><span className="mt-5 block text-xs font-semibold text-emerald-300">Carregar briefing →</span></button>)}{projectOptions.map((option) => {
            const content = <><span className="text-2xl" aria-hidden="true">{option.icon}</span><span className="mt-4 block text-lg font-semibold text-white">{option.title}</span><span className="mt-2 block text-sm leading-6 text-white/45">{option.description}</span><span className={`mt-5 block text-xs font-semibold ${option.kind === "future" ? "text-white/30" : "text-emerald-300"}`}>{option.kind === "future" ? "Em desenvolvimento" : option.kind === "link" ? "Abrir ferramenta →" : "Criar agora →"}</span></>;
            const className = `block min-h-48 rounded-2xl border p-5 text-left transition border-white/10 bg-[#11101b] ${option.kind === "future" ? "opacity-65" : "hover:border-emerald-400/45"}`;
            if (option.kind === "link") return <Link key={option.title} href={option.href} className={className}>{content}</Link>;
            if (option.kind === "future") return <div key={option.title} className={className}>{content}</div>;
            return null;
          })}</div>
        </section>
      </div>}

      {project && <div className="grid gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="space-y-5 rounded-2xl border border-white/10 bg-[#11101b] p-5">
          <div><span className="text-xs font-bold uppercase tracking-widest text-emerald-400">{getSitePreset(project.presetId || "institucional").title}</span><h1 className="mt-2 text-2xl font-bold">{project.name}</h1><p className="mt-2 text-sm text-white/45">{phase === "generating" ? "Criando seu site…" : phase === "ready" ? "Site criado. Você pode pedir alterações." : "A criação foi interrompida."}</p></div>
          <ol className="space-y-2" aria-label="Progresso da criação">{SITE_PAGES.map(({ key, label }) => <li key={key} className={`rounded-xl border p-3 text-sm ${currentStep === key ? "border-emerald-400/50 bg-emerald-400/10" : project.pages[key] ? "border-white/10" : "border-white/5 text-white/40"}`}><span className="mr-2">{project.pages[key] ? "✓" : currentStep === key ? "◌" : "○"}</span>{label}<span className="float-right text-xs">{project.pages[key] ? "Pronta" : currentStep === key ? "Criando" : "Aguardando"}</span></li>)}</ol>
          {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          {phase === "error" && pendingKeys.length > 0 && <button onClick={() => void generatePages(project, pendingKeys)} className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-[#08130e]">Tentar novamente</button>}
          {phase === "ready" && SITE_PAGES.some(({ key }) => !project.pages[key]) &&
            <button onClick={() => void generatePages(project, SITE_PAGES.filter(({ key }) => !project.pages[key]).map(({ key }) => key))} className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-[#08130e]">Continuar criação</button>}
          <form onSubmit={revise} className="border-t border-white/10 pt-5"><label className="text-sm font-semibold" htmlFor="builder-change">Peça uma alteração nesta página</label><textarea id="builder-change" value={instruction} onChange={(event) => setInstruction(event.target.value)} maxLength={700} rows={3} placeholder="Ex.: destaque o atendimento personalizado" className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-sm outline-none focus:border-emerald-400" /><button disabled={!project.pages[activePage] || phase === "generating" || !instruction.trim()} className="mt-2 w-full rounded-xl border border-emerald-400/40 px-4 py-3 text-sm font-semibold text-emerald-300 disabled:opacity-40">Aplicar alteração</button></form>
          <p className="text-xs text-white/35">Projeto salvo neste navegador. A publicação e o domínio serão adicionados em uma próxima etapa.</p>
        </aside>
        <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#191923]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4"><div className="flex flex-wrap gap-2">{SITE_PAGES.map(({ key, label }) => <button key={key} onClick={() => setActivePage(key)} disabled={!project.pages[key]} className={`rounded-lg px-3 py-2 text-sm disabled:opacity-30 ${activePage === key ? "bg-emerald-400 text-black" : "bg-white/5 text-white/70"}`}>{label}</button>)}</div><span className="text-xs text-white/40">Prévia ao vivo</span></div>
          {preview ? <iframe ref={previewRef} key={activePage + project.pages[activePage]?.heading} title={`Prévia de ${activePage}`} sandbox="allow-scripts" srcDoc={preview} className="h-[720px] w-full bg-white" /> : <div className="flex h-[720px] items-center justify-center text-white/40">A primeira página aparecerá aqui assim que ficar pronta.</div>}
        </section>
      </div>}
    </main>
  </>;
}
