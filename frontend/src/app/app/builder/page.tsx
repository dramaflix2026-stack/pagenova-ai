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
  { title: "Dashboard / Painel", description: "Indicadores reais dos projetos de CRM.", icon: "▤", kind: "link", href: "/app/dashboard" },
  { title: "CRM de Vendas", description: "Funil, leads, responsáveis e indicadores.", icon: "◎", kind: "link", href: "/app/crm" },
  { title: "Agendamento", description: "Serviços, disponibilidade e reservas.", icon: "◷", kind: "link", href: "/app/agendamento" },
  { title: "Área de Membros", description: "Conteúdo e acesso para assinantes.", icon: "♧", kind: "future" },
  { title: "Quiz e Formulário", description: "Perguntas, respostas e captação.", icon: "☷", kind: "future" },
] as const;

export default function BuilderPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [brief, setBrief] = useState(SITE_PRESETS[0].brief);
  const [style, setStyle] = useState("moderno");
  const [contactEmail, setContactEmail] = useState("");
  const [role, setRole] = useState("");
  const [audience, setAudience] = useState("");
  const [offer, setOffer] = useState("");
  const [process, setProcess] = useState("");
  const [proof, setProof] = useState("");
  const [photos, setPhotos] = useState<{ portrait?: string; businessPhoto?: string; workPhoto?: string }>({});
  const [photoError, setPhotoError] = useState("");

  async function selectPhoto(key: "portrait" | "businessPhoto" | "workPhoto", file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Use uma imagem JPG, PNG ou WebP."); return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError("A imagem deve ter no máximo 8 MB."); return;
    }
    try {
      const image = new Image();
      const source = URL.createObjectURL(file);
      try {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
          image.src = source;
        });
        const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Não foi possível preparar a imagem.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const result = canvas.toDataURL("image/jpeg", 0.78);
        if (result.length > 1200000) throw new Error("Imagem grande demais após otimização.");
        setPhotos((current) => ({ ...current, [key]: result }));
        setPhotoError("");
      } finally {
        URL.revokeObjectURL(source);
      }
    } catch (cause) {
      setPhotoError(cause instanceof Error ? cause.message : "Falha ao carregar a imagem.");
    }
  }
  const [selectedPresetId, setSelectedPresetId] = useState("institucional");
  const selectedPreset = getSitePreset(selectedPresetId);
  const [project, setProject] = useState<SiteProject | null>(null);
  const [activePage, setActivePage] = useState<SitePageKey>("home");
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentStep, setCurrentStep] = useState<SitePageKey | null>(null);
  const [error, setError] = useState("");
  const [instruction, setInstruction] = useState("");
  const [revisionImage, setRevisionImage] = useState("");
  const [revisionImageError, setRevisionImageError] = useState("");

  async function prepareRevisionImage(file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setRevisionImageError("Envie um print PNG, JPG ou WebP."); return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setRevisionImageError("O print deve ter até 8 MB."); return;
    }
    const url = URL.createObjectURL(file);
    try {
      const picture = new Image();
      await new Promise<void>((resolve, reject) => {
        picture.onload = () => resolve();
        picture.onerror = () => reject(new Error("Não foi possível abrir o print."));
        picture.src = url;
      });
      const ratio = Math.min(1, 1400 / Math.max(picture.naturalWidth, picture.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(picture.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(picture.naturalHeight * ratio));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Não foi possível processar o print.");
      context.drawImage(picture, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", 0.72);
      if (data.length > 1200000) throw new Error("O print ficou grande demais. Recorte a área importante e tente novamente.");
      setRevisionImage(data);
      setRevisionImageError("");
    } catch (cause) {
      setRevisionImageError(cause instanceof Error ? cause.message : "Falha ao ler o print.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function pasteRevisionImage(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const file = Array.from(event.clipboardData.items)
      .find((item) => item.kind === "file" && item.type.startsWith("image/"))?.getAsFile();
    if (file) {
      event.preventDefault();
      void prepareRevisionImage(file);
    }
  }
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
      setRole(saved.institutional?.role || "");
      setAudience(saved.institutional?.audience || "");
      setOffer(saved.institutional?.offer || "");
      setProcess(saved.institutional?.process || "");
      setProof(saved.institutional?.proof || "");
      setPhotos({
        portrait: saved.institutional?.portrait,
        businessPhoto: saved.institutional?.businessPhoto,
        workPhoto: saved.institutional?.workPhoto,
      });
      setSelectedPresetId(saved.presetId || "institucional");
      setActivePage(SITE_PAGES.find(({ key }) => saved.pages[key])?.key ?? "home");
      setPhase("ready");
    }).catch(() => setError("Não foi possível abrir o projeto salvo."));
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function requestPage(site: SiteProject, key: SitePageKey, editInstruction = "", screenshot = ""): Promise<SitePage> {
    const controller = new AbortController();
    abortRef.current = controller;
    const response = await fetch("/api/builder/generate", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ name: site.name, brief: site.brief, style: site.style, key, presetId: site.presetId,
        institutional: site.presetId === "institucional" ? {
          role: site.institutional?.role || "",
          audience: site.institutional?.audience || "",
          offer: site.institutional?.offer || "",
          process: site.institutional?.process || "",
          proof: site.institutional?.proof || "",
        } : undefined,
        instruction: editInstruction, screenshot, existingPage: editInstruction ? JSON.stringify(site.pages[key]) : "" }),
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
      presetId: selectedPresetId, brief: brief.trim(), style, contactEmail: contactEmail.trim(),
      institutional: selectedPresetId === "institucional" ? {
        role: role.trim(), audience: audience.trim(), offer: offer.trim(),
        process: process.trim(), proof: proof.trim(), ...photos,
      } : undefined,
      pages: {}, createdAt: new Date().toISOString() };
    setProject(site); setActivePage("home");
    router.replace(`/app/builder?project=${site.id}`);
    void generatePages(site, SITE_PAGES.map(({ key }) => key));
  }

  async function revise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !instruction.trim() || phase === "generating") return;
    setError(""); setPhase("generating"); setCurrentStep(activePage);
    try {
      const page = await requestPage(project, activePage, instruction.trim(), revisionImage);
      const updated = { ...project, pages: { ...project.pages, [activePage]: page } };
      await savePageNovaProject(updated.id, updated);
      setProject(updated); setInstruction(""); setRevisionImage(""); setPhase("ready");
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
          {selectedPresetId === "institucional" && <section className="space-y-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
            <div>
              <h2 className="text-lg font-bold">Apresente seu negócio de verdade</h2>
              <p className="mt-1 text-sm text-white/55">Esses dados aparecem na apresentação e orientam a escrita da IA. Preencha apenas o que for real.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Quem é você e o que faz?
                <input value={role} onChange={(event) => setRole(event.target.value)} maxLength={160} placeholder="Ex.: psicóloga clínica, atendimento individual" className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-white outline-none focus:border-emerald-400" />
              </label>
              <label className="block text-sm font-medium">Para quem é o seu trabalho?
                <input value={audience} onChange={(event) => setAudience(event.target.value)} maxLength={180} placeholder="Ex.: adultos que buscam acompanhamento psicológico" className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-white outline-none focus:border-emerald-400" />
              </label>
            </div>
            <label className="block text-sm font-medium">O que você oferece e entrega?
              <textarea value={offer} onChange={(event) => setOffer(event.target.value)} maxLength={700} rows={3} placeholder="Liste serviços reais e explique o que está incluído." className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-white outline-none focus:border-emerald-400" />
            </label>
            <label className="block text-sm font-medium">Como funciona o atendimento ou trabalho?
              <textarea value={process} onChange={(event) => setProcess(event.target.value)} maxLength={600} rows={3} placeholder="Descreva as etapas reais, do primeiro contato à entrega." className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-white outline-none focus:border-emerald-400" />
            </label>
            <label className="block text-sm font-medium">Dados, experiência ou credenciais verificáveis
              <textarea value={proof} onChange={(event) => setProof(event.target.value)} maxLength={450} rows={2} placeholder="Opcional. Informe apenas dados comprováveis, sem inventar números ou depoimentos." className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-white outline-none focus:border-emerald-400" />
            </label>
            <div>
              <h3 className="text-sm font-semibold">Imagens do site</h3>
              <p className="mt-1 text-xs text-white/45">Opcionais. Serão otimizadas e salvas neste navegador com o projeto. Sem foto, a prévia mostra um espaço preparado para você adicioná-la.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {([
                  ["portrait", "Foto principal sua"],
                  ["businessPhoto", "Foto do negócio ou ambiente"],
                  ["workPhoto", "Foto do trabalho ou serviço"],
                ] as const).map(([key, label]) => <label key={key} className="cursor-pointer rounded-xl border border-dashed border-white/20 p-3 text-sm">
                  <span className="block font-medium">{label}</span>
                  {photos[key] ? <img src={photos[key]} alt={`Prévia: ${label}`} className="mt-2 h-28 w-full rounded-lg object-cover" /> : <span className="mt-2 block text-xs text-white/40">Adicionar imagem</span>}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void selectPhoto(key, event.target.files?.[0])} className="mt-3 block w-full text-xs text-white/50 file:mr-2 file:rounded file:border-0 file:bg-emerald-400 file:px-2 file:py-1 file:text-black" />
                  {photos[key] && <button type="button" onClick={(event) => { event.preventDefault(); setPhotos((current) => ({ ...current, [key]: undefined })); }} className="mt-2 text-xs text-emerald-300">Remover imagem</button>}
                </label>)}
              </div>
              {photoError && <p role="alert" className="mt-2 text-sm text-red-300">{photoError}</p>}
            </div>
          </section>}          <div className="flex flex-wrap gap-2">{selectedPreset.modules.map((module) => <span key={module} className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-xs text-emerald-200">{module}</span>)}</div>
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
          <form onSubmit={revise} className="border-t border-white/10 pt-5">
            <label className="text-sm font-semibold" htmlFor="builder-change">Peça uma alteração nesta página</label>
            <p className="mt-1 text-xs leading-5 text-white/45">Escreva o que deseja mudar. Você também pode colar um print aqui com Ctrl+V para a IA analisar a referência.</p>
            <textarea id="builder-change" value={instruction} onChange={(event) => setInstruction(event.target.value)} onPaste={pasteRevisionImage} maxLength={700} rows={4} placeholder="Ex.: use este print como referência para melhorar a seção de apresentação, mantendo minhas informações reais." className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-sm outline-none focus:border-emerald-400" />
            <label className="mt-3 block cursor-pointer rounded-xl border border-dashed border-white/20 px-3 py-3 text-xs text-white/65 hover:border-emerald-400/50">
              Anexar print da tela
              <input type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-emerald-400 file:px-2 file:py-1 file:text-black" onChange={(event) => { const file = event.target.files?.[0]; if (file) void prepareRevisionImage(file); event.target.value = ""; }} />
            </label>
            {revisionImage && <div className="mt-3 rounded-xl border border-emerald-400/30 p-2">
              <img src={revisionImage} alt="Print anexado para a IA analisar" className="max-h-44 w-full rounded-lg object-contain" />
              <button type="button" onClick={() => setRevisionImage("")} className="mt-2 text-xs text-emerald-300">Remover print</button>
            </div>}
            {revisionImageError && <p role="alert" className="mt-2 text-xs text-red-300">{revisionImageError}</p>}
            <button disabled={!project.pages[activePage] || phase === "generating" || !instruction.trim()} className="mt-3 w-full rounded-xl border border-emerald-400/40 px-4 py-3 text-sm font-semibold text-emerald-300 disabled:opacity-40">Enviar pedido e print para a IA</button>
          </form>
          <p className="text-xs text-white/35">Projeto salvo neste navegador. A publicação e o domínio serão adicionados em uma próxima etapa.</p>
        </aside>
        <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#191923]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4"><div className="flex flex-wrap gap-2">{SITE_PAGES.map(({ key, label }) => <button key={key} onClick={() => setActivePage(key)} disabled={!project.pages[key]} className={`rounded-lg px-3 py-2 text-sm disabled:opacity-30 ${activePage === key ? "bg-emerald-400 text-black" : "bg-white/5 text-white/70"}`}>{label}</button>)}</div><span className="text-xs text-white/40">Prévia ao vivo</span></div>
          {preview ? <iframe ref={previewRef} key={activePage + project.pages[activePage]?.heading} title={`Prévia de ${activePage}`} sandbox="allow-scripts" srcDoc={preview} className="h-[720px] w-full bg-white" /> : <div className="flex h-[720px] items-center justify-center text-white/40">A primeira página aparecerá aqui assim que ficar pronta.</div>}
        </section>
      </div>}
    </main>
  </>;
}
