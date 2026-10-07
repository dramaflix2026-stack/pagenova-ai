"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { readPageNovaProject, savePageNovaProject } from "@/lib/pagenova-project-store";
import { renderSitePreview, SITE_PAGES, type SitePage, type SitePageKey, type SiteProject, RevisionPlan } from "@/lib/site-builder";
import { getSitePreset, SITE_PRESETS } from "@/lib/site-builder-presets";
import { renderEditablePreview, type LiveEdit, type PreviewTheme } from "@/lib/site-builder-live-editor";
import { applyElementChanges } from "@/lib/site-builder-element-revision";

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
  const [brief, setBrief] = useState(SITE_PRESETS[0].brief);
  const [style, setStyle] = useState("moderno");
  const [refreshingImages, setRefreshingImages] = useState(false);
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
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");

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
      setProject(saved); setBrief(saved.brief); setStyle(saved.style);
      setSelectedPresetId(saved.presetId || "institucional");
      setActivePage(SITE_PAGES.find(({ key }) => saved.pages[key])?.key ?? "home");
      setPhase("ready");
    }).catch(() => setError("Não foi possível abrir o projeto salvo."));
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);


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

  async function requestPage(site: SiteProject, key: SitePageKey, editInstruction = "", screenshot = ""): Promise<{ page: SitePage; visualDirection?: SiteProject["visualDirection"]; headerDirection?: SiteProject["headerDirection"]; institutional?: SiteProject["institutional"]; siteStrategy?: SiteProject["siteStrategy"]; revisionPlan?: RevisionPlan }> {
    const controller = new AbortController();
    abortRef.current = controller;
    const response = await fetch("/api/builder/generate", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ name: site.name, brief: site.brief, style: site.style, key, presetId: site.presetId,
        institutional: site.institutional ? {
          role: site.institutional.role || "",
          audience: site.institutional.audience || "",
          offer: site.institutional.offer || "",
          process: site.institutional.process || "",
          proof: site.institutional.proof || "",
        } : undefined,
        currentHeaderDirection: site.headerDirection || undefined,
        instruction: editInstruction, screenshot, existingPage: editInstruction ? JSON.stringify(site.pages[key]).slice(0, 6000) : "" }),
    });
    const data = await response.json() as { page?: SitePage; visualDirection?: SiteProject["visualDirection"]; headerDirection?: SiteProject["headerDirection"]; institutional?: SiteProject["institutional"]; siteStrategy?: SiteProject["siteStrategy"]; revisionPlan?: RevisionPlan; error?: string };
    if (!response.ok || !data.page) throw new Error(data.error || "N├úo foi poss├¡vel gerar a p├ígina.");
    return {
      page: data.page as SitePage,
      visualDirection: data.visualDirection as SiteProject["visualDirection"] | undefined,
      headerDirection: data.headerDirection as SiteProject["headerDirection"] | undefined,
      institutional: data.institutional as SiteProject["institutional"] | undefined,
      siteStrategy: data.siteStrategy as SiteProject["siteStrategy"] | undefined,
      revisionPlan: data.revisionPlan as RevisionPlan | undefined,
    };
  }


  async function generatePages(site: SiteProject, keys: SitePageKey[]) {
    setPhase("generating"); setError(""); setPendingKeys(keys);
    let current = site;
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      setCurrentStep(key);
      try {
        const result = await requestPage(current, key);
        const page = result.page;
        current = {
          ...current,
          pages: { ...current.pages, [key]: page },
          siteStrategy: result.siteStrategy ?? current.siteStrategy,
          visualDirection:
            key === "home" && result.visualDirection
              ? result.visualDirection
              : current.visualDirection,
          headerDirection:
            key === "home" && result.headerDirection
              ? result.headerDirection
              : current.headerDirection,
        };
        await savePageNovaProject(current.id, current);
        setProject(current); setActivePage(key); setPendingKeys(keys.slice(index + 1));
        if (key === "home" || key === "sobre") {
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

    const prompt = brief.trim();

    if (prompt.length < 20) {
      setError("Descreva o site que você quer criar com pelo menos 20 caracteres.");
      return;
    }

    const normalizedPrompt = prompt.replace(/\s+/g, " ").trim();

    const cleanBusinessName = (value: string) =>
      value
        .replace(/^["“”'`]+|["“”'`]+$/g, "")
        .replace(
          /\s+(?:especializad[ao]|focad[ao]|voltad[ao]|que\s+(?:atua|oferece|trabalha)|com\s+(?:foco|atendimento|serviços)|para\s+(?:atender|oferecer))\b.*$/i,
          "",
        )
        .replace(/[.,;:!?]+$/g, "")
        .trim()
        .slice(0, 72);

    const explicitNamePatterns = [
      /\b(?:chamad[ao]|nomead[ao]|denominad[ao])\s+["“”'`]?([^,.;:\n]{2,72})/i,
      /\b(?:nome|marca)\s*[:=-]\s*["“”'`]?([^,.;:\n]{2,72})/i,
      /\b(?:sob\s+o\s+nome|com\s+o\s+nome)\s+["“”'`]?([^,.;:\n]{2,72})/i,
    ];

    let inferredName = "";

    for (const pattern of explicitNamePatterns) {
      const match = normalizedPrompt.match(pattern);

      if (match?.[1]) {
        inferredName = cleanBusinessName(match[1]);
        if (inferredName) break;
      }
    }

    if (!inferredName) {
      // Briefings naturais frequentemente comecam pelo nome da marca:
      // "Atelier Noma, escritorio de arquitetura..." ou "Lumiere Estetica - clinica...".
      // Aproveita esse primeiro segmento quando ele parece nome proprio, sem
      // transformar instrucoes como "Crie um site..." em nome da empresa.
      const leadingSegment = normalizedPrompt
        .split(/[,;:\n]|\s+[—–-]\s+/)[0]
        ?.trim();

      const looksLikeInstruction =
        /^(?:crie|criar|faça|faca|quero|desenvolva|monte|gere|preciso|site|landing)\b/i.test(
          leadingSegment || "",
        );

      if (
        leadingSegment &&
        leadingSegment.length >= 2 &&
        leadingSegment.length <= 72 &&
        !looksLikeInstruction
      ) {
        inferredName = cleanBusinessName(leadingSegment);
      }
    }

    if (!inferredName) {
      inferredName = "Sua marca";
    }

    const site: SiteProject = {
      kind: "institutional-site",
      id: crypto.randomUUID(),
      name: inferredName,
      presetId: "template-001",
      brief: prompt,
      style,
      pages: {},
      createdAt: new Date().toISOString(),
    };

    setError("");
    setProject(site);
    setActivePage("home");

    router.replace(`/app/builder?project=${site.id}`);

    void generatePages(
      site,
      SITE_PAGES.map(({ key }) => key),
    );
  }
async function revise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || (!instruction.trim() && !revisionImage) || phase === "generating") return;
    setError(""); setPhase("generating"); setCurrentStep(activePage);
    try {
      const result = await requestPage(
        project,
        activePage,
        instruction.trim() || "Analise o print e melhore esta página mantendo os dados reais.",
        revisionImage,
      );
      const page = result.page;

      const revisionPlan = result.revisionPlan;

      if (!revisionPlan) {
        throw new Error("A IA não retornou um plano de revisão válido.");
      }

      const headerRevisionRequested =
        revisionPlan.headerChanges.length > 0;

      const visualRevisionRequested =
        revisionPlan.visualChanges.length > 0;

      const institutionalRevisionRequested =
        revisionPlan.institutionalChanges.length > 0;

      const currentActivePageLiveEdits =
        project.liveEdits?.[activePage] || [];

      const headerProtectedLiveEdits =
        headerRevisionRequested
          ? currentActivePageLiveEdits.filter(
              (edit) => !edit.headerLayout
            )
          : currentActivePageLiveEdits;

      const elementRevision = applyElementChanges(
        headerProtectedLiveEdits,
        revisionPlan.elementChanges,
      );

      const elementRevisionRequested =
        revisionPlan.elementChanges.length > 0;

      const activePageLiveEdits =
        elementRevisionRequested
          ? elementRevision.edits
          : headerProtectedLiveEdits;

      const nextLiveEdits =
        headerRevisionRequested || elementRevisionRequested
          ? {
              ...project.liveEdits,
              [activePage]: activePageLiveEdits,
            }
          : project.liveEdits;

      console.info("[Builder] Revision plan element application", {
        requested: revisionPlan.elementChanges.length,
        applied: elementRevision.applied,
        ignored: elementRevision.ignored,
        unsupported: elementRevision.unsupported,
        elementAuthority: "revision-plan",
      });

      const updated = {
        ...project,
        pages: { ...project.pages, [activePage]: page },
        liveEdits: nextLiveEdits,
        visualDirection:
          visualRevisionRequested
            ? (result.visualDirection || project.visualDirection)
            : project.visualDirection,
        headerDirection:
          headerRevisionRequested && result.headerDirection
            ? {
                logoPosition: revisionPlan.headerChanges.some(
                  (change) => change.field === "logoPosition",
                )
                  ? result.headerDirection.logoPosition
                  : project.headerDirection?.logoPosition ??
                    result.headerDirection.logoPosition,
                menuStyle: revisionPlan.headerChanges.some(
                  (change) => change.field === "menuStyle",
                )
                  ? result.headerDirection.menuStyle
                  : project.headerDirection?.menuStyle ??
                    result.headerDirection.menuStyle,
                density: revisionPlan.headerChanges.some(
                  (change) => change.field === "density",
                )
                  ? result.headerDirection.density
                  : project.headerDirection?.density ??
                    result.headerDirection.density,
              }
            : project.headerDirection,
        institutional:
          institutionalRevisionRequested &&
          result.institutional
            ? result.institutional
            : project.institutional,
      };
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
        const result = await requestPage(current, key);
        const page = result.page;
        current = {
          ...current,
          pages: { ...current.pages, [key]: page },
          liveEdits: { ...current.liveEdits, [key]: [] },
        };
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
        [
      project?.pages[activePage],
      project?.previewTheme,
      project?.visualDirection,
      project?.headerDirection,
      project?.institutional,
      project?.liveEdits?.[activePage],
      activePage,
    ]);

  async function changeTheme(theme: PreviewTheme) {
    if (!project) return;
    const updated = { ...project, previewTheme: theme };
    setProject(updated);
    try { await savePageNovaProject(updated.id, updated); }
    catch { setError("Não foi possível salvar o tema."); }
  }

  function openPreviewInNewTab() {
    if (!project?.pages[activePage]) return;

    // A nova aba recebe a mesma renderizacao do editor, mas sem a camada de
    // edicao inline. Isso evita publicar ou duplicar dados so para visualizar.
    const html = renderSitePreview(project, activePage);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, "_blank", "noopener,noreferrer");

    if (!opened) {
      URL.revokeObjectURL(url);
      setError("O navegador bloqueou a nova aba. Permita pop-ups para abrir a prévia.");
      return;
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function publishSite() {
    if (!project?.pages.home || publishing) return;
    setPublishing(true);
    setError("");
    try {
      const response = await fetch("/api/builder/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Nao foi possivel publicar o site.");
      setPublishedUrl(data.url);
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel publicar o site.");
    } finally {
      setPublishing(false);
    }
  }

  return <>
    <AppHeader title="Criar Site com IA" description="Descreva seu negócio e acompanhe cada página aparecer." />
    <main className="mx-auto max-w-[1600px] px-5 py-8 lg:px-9">
      {!project && <div className="mx-auto max-w-5xl">
        <div className="mb-8"><span className="text-xs font-bold uppercase tracking-[.18em] text-emerald-400">PageNova Builder · {selectedPreset.title}</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">O que vamos criar hoje?</h1>
          <p className="mt-3 text-white/50">Escolha um ponto de partida, descreva sua ideia e acompanhe a criação na tela.</p></div>
        <form onSubmit={start} className="mx-auto max-w-3xl space-y-5 rounded-3xl border border-white/10 bg-[#11101b] p-6 md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
              Criar site com IA
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
              Descreva o site que você quer
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/45">
              Conte sobre o negócio, serviços, público, estilo ou qualquer detalhe importante. A IA cuida da estrutura e do conteúdo.
            </p>
          </div>

          <label className="block">
            <span className="sr-only">Descreva o site</span>

            <textarea
              value={brief}
              onChange={(event) => {
                setBrief(event.target.value);
                if (error) setError("");
              }}
              maxLength={2800}
              rows={9}
              required
              autoFocus
              placeholder="Ex.: Crie um site premium para uma clínica odontológica moderna chamada Lumina Odontologia, especializada em implantes, lentes de contato dental e estética do sorriso. Quero transmitir sofisticação, confiança e tecnologia..."
              className="w-full resize-y rounded-2xl border border-white/15 bg-black/30 p-5 text-base leading-7 text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
            />
          </label>

          <fieldset>
            <legend className="mb-3 text-sm font-medium text-white/70">
              Estilo visual
            </legend>

            <div className="grid gap-3 sm:grid-cols-3">
              {["moderno", "elegante", "vibrante"].map((item) => (
                <label
                  key={item}
                  className={`cursor-pointer rounded-xl border p-4 text-center capitalize transition ${
                    style === item
                      ? "border-emerald-400 bg-emerald-400/10 text-white"
                      : "border-white/10 text-white/55 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="style"
                    value={item}
                    checked={style === item}
                    onChange={() => setStyle(item)}
                    className="sr-only"
                  />
                  {item}
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={phase === "generating"}
            className="w-full rounded-xl bg-emerald-400 px-5 py-4 text-base font-bold text-[#08130e] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {phase === "generating" ? "Gerando site..." : "Gerar site →"}
          </button>

          <p className="text-center text-xs text-white/30">
            A IA interpreta seu pedido e cria o site diretamente.
          </p>
        </form>
        <section className="mt-12" aria-labelledby="builder-options-title">
          <div className="mb-5"><h2 id="builder-options-title" className="text-2xl font-bold">Explore o que você pode criar</h2><p className="mt-2 text-sm text-white/45">Escolha uma opção para começar. As próximas funções aparecem com seu status real.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{SITE_PRESETS.map((option) => <button type="button" key={option.id} onClick={() => { setSelectedPresetId(option.id); setBrief(option.brief); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-pressed={selectedPresetId === option.id} className={`block min-h-48 rounded-2xl border p-5 text-left transition hover:border-emerald-400/45 ${selectedPresetId === option.id ? "border-emerald-400/70 bg-emerald-400/10" : "border-white/10 bg-[#11101b]"}`}><span className="text-2xl" aria-hidden="true">{option.icon}</span><span className="mt-4 block text-lg font-semibold">{option.title}</span><span className="mt-2 block text-sm leading-6 text-white/45">{option.description}</span><span className="mt-5 block text-xs font-semibold text-emerald-300">Carregar briefing →</span></button>)}{projectOptions.map((option) => {
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
          <p className="text-xs text-white/35">Projeto salvo. Use a prévia em nova aba para revisar o site antes da publicação.</p>
        </aside>
        <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#191923]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4"><div className="flex flex-wrap gap-2">{SITE_PAGES.map(({ key, label }) => <button key={key} onClick={() => setActivePage(key)} disabled={!project.pages[key]} className={`rounded-lg px-3 py-2 text-sm disabled:opacity-30 ${activePage === key ? "bg-emerald-400 text-black" : "bg-white/5 text-white/70"}`}>{label}</button>)}</div><span className="text-xs text-white/40">Duplo clique no texto para editar</span></div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-3">
            <label className="text-xs text-white/70">Tema <select aria-label="Tema do site" value={project.previewTheme || "original"} onChange={(e) => void changeTheme(e.target.value as PreviewTheme)} className="ml-2 rounded-lg bg-white/10 p-2 text-white"><option className="text-black" value="original">Original</option><option className="text-black" value="claro">Claro</option><option className="text-black" value="escuro">Escuro</option><option className="text-black" value="areia">Areia</option></select></label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1" role="group" aria-label="Tamanho da prévia">{(["desktop", "tablet", "celular"] as const).map((mode) => <button type="button" key={mode} aria-pressed={viewport === mode} onClick={() => setViewport(mode)} className={`rounded-lg px-3 py-2 text-xs capitalize ${viewport === mode ? "bg-emerald-400 text-black" : "bg-white/10 text-white"}`}>{mode}</button>)}</div>
              <button type="button" disabled={!project.pages[activePage]} onClick={openPreviewInNewTab} className="rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:opacity-40">
                Abrir prévia em nova aba ↗
              </button>
              <button type="button" disabled={!project.pages.home || publishing || phase === "generating"} onClick={() => void publishSite()} className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-[#08130e] transition hover:bg-emerald-300 disabled:opacity-40">
                {publishing ? "Publicando..." : publishedUrl ? "Atualizar publicação" : "Publicar site"}
              </button>
              {publishedUrl ? <a href={publishedUrl} target="_blank" rel="noreferrer" className="max-w-[280px] truncate rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 hover:text-white" title={publishedUrl}>Ver site publicado ↗</a> : null}
            </div>
          </div>
          {preview ? <div className="overflow-auto bg-[#303630] p-3"><iframe ref={previewRef} key={activePage + project.pages[activePage]?.heading + (project.previewTheme || "original") + viewport} title={`Prévia de ${activePage} em ${viewport}`} sandbox="allow-scripts" srcDoc={preview} style={{ width: viewport === "desktop" ? "100%" : viewport === "tablet" ? 768 : 390, maxWidth: "100%" }} className="mx-auto block h-[720px] bg-white" /></div> : <div className="flex h-[720px] items-center justify-center text-white/40">A primeira página aparecerá aqui assim que ficar pronta.</div>}
        </section>
      </div>}
    </main>
  </>;
}
