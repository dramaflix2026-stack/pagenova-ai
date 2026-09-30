"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { readPageNovaProject, savePageNovaProject } from "@/lib/pagenova-project-store";
import { renderSitePreview, SITE_PAGES, type SitePage, type SitePageKey, type SiteProject } from "@/lib/site-builder";
import { getSitePreset, SITE_PRESETS } from "@/lib/site-builder-presets";
import { renderEditablePreview, type LiveEdit, type PreviewTheme } from "@/lib/site-builder-live-editor";

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
  const [briefIdea, setBriefIdea] = useState("");
  const [creatingBrief, setCreatingBrief] = useState(false);
  const [briefError, setBriefError] = useState("");
  const [style, setStyle] = useState("moderno");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWhatsApp, setContactWhatsApp] = useState("");
  const [contactInstagram, setContactInstagram] = useState("");
  const [contactFacebook, setContactFacebook] = useState("");
  const [refreshingImages, setRefreshingImages] = useState(false);
  const [institutionalFacts, setInstitutionalFacts] = useState({ role: "", audience: "", offer: "", process: "", proof: "" });
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
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "celular">("desktop");

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
      if (event.source !== previewRef.current?.contentWindow) return;
      if (event.data?.type === "pagenova-live-edit") {
        const key = event.data.key as SitePageKey;
        const edit = event.data.edit as LiveEdit;
        if (!project || key !== activePage || !project.pages[key] || typeof edit?.selector !== "string" ||
          edit.selector.length > 500 || typeof edit.text !== "string" || edit.text.length > 2000 ||
          !Number.isFinite(edit.size) || edit.size < 10 || edit.size > 120 ||
          !/^#[a-fA-F0-9]{6}$/.test(edit.color)) return;
        const current = project.liveEdits?.[key] || [];
        const updated = { ...project, liveEdits: { ...project.liveEdits,
          [key]: [...current.filter((item) => item.selector !== edit.selector), edit].slice(-100) } };
        setProject(updated);
        void savePageNovaProject(updated.id, updated).catch(() => setError("Não foi possível salvar a edição."));
        return;
      }
      if (event.data?.type !== "pagenova-site-preview-page") return;
      const key = event.data.key as SitePageKey;
      if (SITE_PAGES.some((item) => item.key === key) && project?.pages[key]) setActivePage(key);
    }
    window.addEventListener("message", handlePreviewNavigation);
    return () => window.removeEventListener("message", handlePreviewNavigation);
  }, [project, activePage]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("project");
    if (!id) return;
    readPageNovaProject<SiteProject>(id).then((saved) => {
      if (!saved || saved.kind !== "institutional-site") return;
      setProject(saved); setName(saved.name); setBrief(saved.brief); setStyle(saved.style); setContactEmail(saved.contactEmail || ""); setContactWhatsApp(saved.contactWhatsApp || ""); setContactInstagram(saved.contactInstagram || ""); setContactFacebook(saved.contactFacebook || ""); setInstitutionalFacts({ role: saved.institutional?.role || "", audience: saved.institutional?.audience || "", offer: saved.institutional?.offer || "", process: saved.institutional?.process || "", proof: saved.institutional?.proof || "" });
      setSelectedPresetId(saved.presetId || "institucional");
      setActivePage(SITE_PAGES.find(({ key }) => saved.pages[key])?.key ?? "home");
      setPhase("ready");
    }).catch(() => setError("Não foi possível abrir o projeto salvo."));
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function createBriefWithAI() {
    if (creatingBrief || phase === "generating") return;

    const cleanName = name.trim();
    const cleanIdea = briefIdea.trim();

    if (cleanName.length < 2) {
      setBriefError("Informe primeiro o nome do negócio.");
      return;
    }

    if (cleanIdea.length < 10) {
      setBriefError("Descreva rapidamente o negócio com pelo menos 10 caracteres.");
      return;
    }

    setCreatingBrief(true);
    setBriefError("");
    setError("");

    try {
      const response = await fetch("/api/builder/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          description: cleanIdea,
          presetId: selectedPresetId,
        }),
      });

      const data = await response.json() as {
        brief?: string;
        institutional?: {
          role?: string;
          audience?: string;
          offer?: string;
          process?: string;
          proof?: string;
        };
        error?: string;
      };

      if (!response.ok || !data.brief) {
        throw new Error(
          data.error ||
          "Não foi possível criar o briefing.",
        );
      }

      setBrief(data.brief);

      if (
        selectedPresetId === "institucional" &&
        data.institutional
      ) {
        setInstitutionalFacts((current) => ({
          role:
            data.institutional?.role?.trim() ||
            current.role,
          audience:
            data.institutional?.audience?.trim() ||
            current.audience,
          offer:
            data.institutional?.offer?.trim() ||
            current.offer,
          process:
            data.institutional?.process?.trim() ||
            current.process,
          proof:
            data.institutional?.proof?.trim() ||
            current.proof,
        }));
      }
    } catch (cause) {
      setBriefError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível criar o briefing.",
      );
    } finally {
      setCreatingBrief(false);
    }
  }
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
        instruction: editInstruction, screenshot, existingPage: editInstruction ? JSON.stringify(site.pages[key]).slice(0, 6000) : "" }),
    });
    const data = await response.json() as { page?: SitePage; error?: string };
    if (!response.ok || !data.page) throw new Error(data.error || "Não foi possível gerar a página.");
    return data.page;
  }

  async function requestImage(site: SiteProject, kind: "hero" | "work"): Promise<string> {
    const controller = new AbortController();
    abortRef.current = controller;
    const response = await fetch("/api/builder/image", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ name: site.name, brief: site.brief, kind }),
    });
    const data = await response.json() as { image?: string; error?: string };
    if (!response.ok || !data.image?.startsWith("data:image/jpeg;base64,")) throw new Error(data.error || "Falha ao criar a imagem.");
    return data.image;
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
        if (site.presetId === "institucional" && (key === "home" || key === "sobre")) {
          try {
            const image = await requestImage(current, key === "home" ? "hero" : "work");
            current = { ...current, institutional: {
              role: current.institutional?.role || "", audience: current.institutional?.audience || "",
              offer: current.institutional?.offer || "", process: current.institutional?.process || "",
              proof: current.institutional?.proof || "",
              ...current.institutional,
              [key === "home" ? "portrait" : "businessPhoto"]: image,
            } };
            await savePageNovaProject(current.id, current);
            setProject(current);
          } catch (imageError) {
            if ((imageError as Error).name === "AbortError") return;
            console.warn("[Builder] Imagem indisponível; conteúdo preservado", imageError);
          }
        }
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
    if (selectedPresetId === "institucional" && institutionalFacts.offer.trim().length < 8) {
      setError("Informe os serviços ou produtos reais que devem aparecer nos cards."); return;
    }
    const site: SiteProject = { kind: "institutional-site", id: crypto.randomUUID(), name: name.trim(),
      presetId: selectedPresetId, brief: brief.trim(), style, contactEmail: contactEmail.trim(), contactWhatsApp: contactWhatsApp.trim(), contactInstagram: contactInstagram.trim(), contactFacebook: contactFacebook.trim(),
      institutional: selectedPresetId === "institucional" ? Object.fromEntries(Object.entries(institutionalFacts).map(([key, value]) => [key, value.trim()])) as SiteProject["institutional"] : undefined,
      pages: {}, createdAt: new Date().toISOString() };
    setProject(site); setActivePage("home");
    router.replace(`/app/builder?project=${site.id}`);
    void generatePages(site, SITE_PAGES.map(({ key }) => key));
  }

  async function revise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || (!instruction.trim() && !revisionImage) || phase === "generating") return;
    setError(""); setPhase("generating"); setCurrentStep(activePage);
    try {
      const page = await requestPage(project, activePage, instruction.trim() || "Analise o print e melhore esta página mantendo os dados reais.", revisionImage);
      const updated = { ...project, pages: { ...project.pages, [activePage]: page } };
      await savePageNovaProject(updated.id, updated);
      setProject(updated); setInstruction(""); setRevisionImage(""); setPhase("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível aplicar a alteração."); setPhase("error");
    } finally { setCurrentStep(null); }
  }

  async function regenerateCopy() {
    if (!project || phase === "generating" || !window.confirm("Recriar os textos das quatro páginas? As edições manuais de texto serão substituídas. As imagens serão mantidas.")) return;
    if (!project.institutional?.offer?.trim()) { setError("Informe os serviços ou produtos reais antes de refazer os textos."); return; }
    setPhase("generating"); setError("");
    let current = project;
    for (const { key } of SITE_PAGES) {
      if (!current.pages[key]) continue;
      setCurrentStep(key);
      try {
        const page = await requestPage(current, key);
        current = { ...current, pages: { ...current.pages, [key]: page },
          liveEdits: { ...current.liveEdits, [key]: [] } };
        await savePageNovaProject(current.id, current);
        setProject(current); setActivePage(key);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Falha ao recriar os textos.");
        setPhase("error"); setCurrentStep(null); return;
      }
    }
    setCurrentStep(null); setPhase("ready");
  }

  const preview = useMemo(() => project ? renderEditablePreview(renderSitePreview(project, activePage), project, activePage) : "",
    // Text edits already update the current iframe; regenerate only on page or theme changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project?.pages[activePage], project?.previewTheme, activePage]);

  async function changeTheme(theme: PreviewTheme) {
    if (!project) return;
    const updated = { ...project, previewTheme: theme };
    setProject(updated);
    try { await savePageNovaProject(updated.id, updated); }
    catch { setError("Não foi possível salvar o tema."); }
  }

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
          <label className="block text-sm font-medium">E-mail que receberá os contatos<input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} required placeholder="contato@suaempresa.com.br" className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-4 text-white outline-none focus:border-emerald-400" /></label>          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-medium">WhatsApp do negócio<input type="tel" value={contactWhatsApp} onChange={(event) => setContactWhatsApp(event.target.value)} placeholder="11999999999" maxLength={22} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-4 text-white outline-none focus:border-emerald-400" /></label>
            <label className="block text-sm font-medium">Instagram<input value={contactInstagram} onChange={(event) => setContactInstagram(event.target.value)} placeholder="@suaempresa" maxLength={100} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-4 text-white outline-none focus:border-emerald-400" /></label>
            <label className="block text-sm font-medium">Facebook<input value={contactFacebook} onChange={(event) => setContactFacebook(event.target.value)} placeholder="facebook.com/suaempresa" maxLength={200} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-4 text-white outline-none focus:border-emerald-400" /></label>
          </div>          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-white">
                Quer que a IA monte o briefing?
              </span>
              <span className="text-xs leading-5 text-white/45">
                Explique rapidamente o negócio. A IA organiza um briefing completo e você pode revisar tudo antes de criar o site.
              </span>
            </div>

            <textarea
              value={briefIdea}
              onChange={(event) => {
                setBriefIdea(event.target.value);
                if (briefError) setBriefError("");
              }}
              maxLength={1200}
              rows={3}
              placeholder="Ex.: Somos a DroneField e fazemos inspeções de lavouras com drones para identificar áreas afetadas e gerar relatórios técnicos para produtores rurais."
              className="mt-4 w-full resize-y rounded-xl border border-white/15 bg-black/30 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
            />

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-white/35">
                A IA não cria o site ainda — apenas prepara o briefing.
              </span>

              <button
                type="button"
                onClick={() => void createBriefWithAI()}
                disabled={creatingBrief || phase === "generating"}
                className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400/60 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingBrief ? "Criando briefing..." : "✨ Criar briefing com IA"}
              </button>
            </div>

            {briefError && (
              <p role="alert" className="mt-3 text-sm text-red-300">
                {briefError}
              </p>
            )}
          </div>

          <label className="block text-sm font-medium">
            Briefing do site
            <span className="font-normal text-white/45">
              {" "}· revise e edite antes de gerar
            </span>
            <textarea
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              maxLength={2800}
              rows={10}
              required
              className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-black/30 p-4 leading-7 text-white outline-none focus:border-emerald-400"
            />
          </label>
          {selectedPresetId === "institucional" && <fieldset className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5"><legend className="px-2 text-sm font-semibold text-emerald-200">Dados reais para personalizar o site</legend><p className="mb-4 text-xs leading-5 text-white/55">Preencha apenas o que você pode confirmar. Campos vazios não serão inventados pela IA.</p><div className="grid gap-3 sm:grid-cols-2">{([
            ["role", "Quem você é / sua atuação", "Ex.: psicóloga clínica"],
            ["audience", "Quem você atende", "Ex.: adultos em atendimento online"],
            ["offer", "Serviços e modalidades", "Ex.: psicoterapia individual online"],
            ["process", "Como funciona o atendimento", "Ex.: primeira conversa para conhecer a demanda"],
            ["proof", "Credencial verificável", "Ex.: registro profissional, se aplicável"],
          ] as const).map(([key, label, placeholder]) => <label key={key} className="block text-xs font-medium text-white/80">{label}{key === "offer" && <span className="ml-1 text-emerald-300">* obrigatório</span>}<input value={institutionalFacts[key]} onChange={(event) => setInstitutionalFacts((current) => ({ ...current, [key]: event.target.value }))} required={key === "offer"} maxLength={400} placeholder={placeholder} className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 p-3 text-sm text-white outline-none focus:border-emerald-400" /></label>)}</div></fieldset>}
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
          {project.presetId === "institucional" && <label className="block text-xs font-medium text-white/75">Serviços e produtos reais<textarea value={project.institutional?.offer || ""} onChange={(event) => { const updated = { ...project, institutional: { role: "", audience: "", process: "", proof: "", ...project.institutional, offer: event.target.value } }; setProject(updated); void savePageNovaProject(updated.id, updated).catch(() => setError("Falha ao salvar os serviços.")); }} rows={3} maxLength={400} placeholder="Ex.: lavagem de roupas, passadoria, coleta e entrega (somente o que você realmente oferece)" className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 p-3 text-sm text-white" /></label>}
          <fieldset className="space-y-2 rounded-xl border border-white/10 p-3">
            <legend className="px-1 text-xs font-semibold text-emerald-200">Contatos e redes do site</legend>
            {([
              ["contactEmail", "E-mail", "contato@suaempresa.com.br"],
              ["contactWhatsApp", "WhatsApp", "11999999999"],
              ["contactInstagram", "Instagram", "@suaempresa"],
              ["contactFacebook", "Facebook", "facebook.com/suaempresa"],
            ] as const).map(([key, label, placeholder]) => (
              <label key={key} className="block text-xs text-white/75">{label}
                <input type={key === "contactEmail" ? "email" : "text"} value={project[key] || ""}
                  onChange={(event) => {
                    const updated = { ...project, [key]: event.target.value };
                    setProject(updated);
                    void savePageNovaProject(updated.id, updated).catch(() => setError("Não foi possível salvar o contato."));
                  }}
                  placeholder={placeholder} maxLength={200}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 p-2.5 text-sm text-white" />
              </label>
            ))}
          </fieldset>          {project.presetId === "institucional" && <button type="button" disabled={refreshingImages}
            onClick={async () => {
              setRefreshingImages(true);
              setError("");
              try {
                const hero = await requestImage(project, "hero");
                const work = await requestImage(project, "work");
                const updated = {
                  ...project,
                  institutional: {
                    role: "", audience: "", offer: "", process: "", proof: "",
                    ...project.institutional,
                    portrait: hero,
                    workPhoto: work,
                    businessPhoto: work,
                  },
                };
                await savePageNovaProject(updated.id, updated);
                setProject(updated);
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Falha ao gerar as imagens.");
              } finally {
                setRefreshingImages(false);
              }
            }}
            className="w-full rounded-xl border border-emerald-400/35 px-4 py-3 text-sm font-semibold text-emerald-200 disabled:opacity-50">
            {refreshingImages ? "Gerando dois banners…" : "Gerar novamente os dois banners"}
          </button>}          <ol className="space-y-2" aria-label="Progresso da criação">{SITE_PAGES.map(({ key, label }) => <li key={key} className={`rounded-xl border p-3 text-sm ${currentStep === key ? "border-emerald-400/50 bg-emerald-400/10" : project.pages[key] ? "border-white/10" : "border-white/5 text-white/40"}`}><span className="mr-2">{project.pages[key] ? "✓" : currentStep === key ? "◌" : "○"}</span>{label}<span className="float-right text-xs">{project.pages[key] ? "Pronta" : currentStep === key ? "Criando" : "Aguardando"}</span></li>)}</ol>
          {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          {phase === "error" && pendingKeys.length > 0 && <button onClick={() => void generatePages(project, pendingKeys)} className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-[#08130e]">Tentar novamente</button>}
          {phase === "ready" && SITE_PAGES.some(({ key }) => !project.pages[key]) &&
            <button onClick={() => void generatePages(project, SITE_PAGES.filter(({ key }) => !project.pages[key]).map(({ key }) => key))} className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-[#08130e]">Continuar criação</button>}
          {phase === "ready" && project.presetId === "institucional" && <button type="button" onClick={() => void regenerateCopy()} className="w-full rounded-xl border border-emerald-400/35 px-4 py-3 text-sm font-semibold text-emerald-200">Refazer textos com as novas diretrizes</button>}
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
            <button disabled={!project.pages[activePage] || phase === "generating" || (!instruction.trim() && !revisionImage)} className="mt-3 w-full rounded-xl border border-emerald-400/40 px-4 py-3 text-sm font-semibold text-emerald-300 disabled:opacity-40">Enviar pedido e print para a IA</button>
          </form>
          <p className="text-xs text-white/35">Projeto salvo neste navegador. A publicação e o domínio serão adicionados em uma próxima etapa.</p>
        </aside>
        <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#191923]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4"><div className="flex flex-wrap gap-2">{SITE_PAGES.map(({ key, label }) => <button key={key} onClick={() => setActivePage(key)} disabled={!project.pages[key]} className={`rounded-lg px-3 py-2 text-sm disabled:opacity-30 ${activePage === key ? "bg-emerald-400 text-black" : "bg-white/5 text-white/70"}`}>{label}</button>)}</div><span className="text-xs text-white/40">Duplo clique no texto para editar</span></div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-3">
            <label className="text-xs text-white/70">Tema <select aria-label="Tema do site" value={project.previewTheme || "original"} onChange={(e) => void changeTheme(e.target.value as PreviewTheme)} className="ml-2 rounded-lg bg-white/10 p-2 text-white"><option className="text-black" value="original">Original</option><option className="text-black" value="claro">Claro</option><option className="text-black" value="escuro">Escuro</option><option className="text-black" value="areia">Areia</option></select></label>
            <div className="flex gap-1" role="group" aria-label="Tamanho da prévia">{(["desktop", "tablet", "celular"] as const).map((mode) => <button type="button" key={mode} aria-pressed={viewport === mode} onClick={() => setViewport(mode)} className={`rounded-lg px-3 py-2 text-xs capitalize ${viewport === mode ? "bg-emerald-400 text-black" : "bg-white/10 text-white"}`}>{mode}</button>)}</div>
          </div>
          {preview ? <div className="overflow-auto bg-[#303630] p-3"><iframe ref={previewRef} key={activePage + project.pages[activePage]?.heading + (project.previewTheme || "original") + viewport} title={`Prévia de ${activePage} em ${viewport}`} sandbox="allow-scripts" srcDoc={preview} style={{ width: viewport === "desktop" ? "100%" : viewport === "tablet" ? 768 : 390, maxWidth: "100%" }} className="mx-auto block h-[720px] bg-white" /></div> : <div className="flex h-[720px] items-center justify-center text-white/40">A primeira página aparecerá aqui assim que ficar pronta.</div>}
        </section>
      </div>}
    </main>
  </>;
}
