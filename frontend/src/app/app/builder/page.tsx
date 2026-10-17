"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Paperclip, Plus, X, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { SiteGenerationCreditsNotice, useSiteGenerationCredits } from "@/components/site-generation-credits";
import { readPageNovaProject, savePageNovaProject, waitForPageNovaProjectSaves } from "@/lib/pagenova-project-store";
import { renderSitePreview, SITE_PAGES, type SitePage, type SitePageKey, type SiteProject, RevisionPlan } from "@/lib/site-builder";
import { inferSiteBrand } from "@/lib/infer-site-brand";
import { renderEditablePreview, type LiveEdit, type PreviewTheme } from "@/lib/site-builder-live-editor";
import { appendExtraSections, originalSectionCount, EXTRA_SECTION_OPTIONS, type ExtraSectionKind } from "@/lib/site-builder-extra-sections";
import { applyElementChanges } from "@/lib/site-builder-element-revision";
import { INITIAL_GENERATION_PROGRESS, REAL_GENERATION_STAGES, milestoneFor, type GenerationProgress } from "@/lib/site-generation-progress";

type Phase = "idle" | "generating" | "ready" | "error";
type SiteTemplateId = "frigolog-universal" | "muse-editorial" | "atelier-norte" | "vertice-corporate" | "restaurant-premium" | "real-estate-premium";

const STARTING_POINTS = [
  { id: "automatico", title: "Automático", icon: "✨", description: "A IA escolhe a estrutura." },
  { id: "institucional", title: "Institucional", icon: "🏢", description: "Empresa, serviços e contato." },
  { id: "imobiliaria", title: "Imobiliária", icon: "🏠", description: "Imóveis e atendimento." },
  { id: "restaurante", title: "Restaurante", icon: "🍽", description: "Cardápio e reservas." },
] as const;

type TranscriptionEvent={results:ArrayLike<ArrayLike<{transcript:string}>>;resultIndex:number};
type Transcriber={
  lang:string;continuous:boolean;interimResults:boolean;
  onresult:((event:TranscriptionEvent)=>void)|null;
  onstart:(()=>void)|null;
  onerror:((event:{error?:string})=>void)|null;
  onend:(()=>void)|null;
  start:()=>void;stop:()=>void;
};
async function compressReference(file:File):Promise<string>{
  const url=URL.createObjectURL(file);
  try{
    const image=new Image();image.src=url;await image.decode();
    const factor=Math.min(1,1150/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(image.naturalWidth*factor));
    canvas.height=Math.max(1,Math.round(image.naturalHeight*factor));
    canvas.getContext("2d")?.drawImage(image,0,0,canvas.width,canvas.height);
    return canvas.toDataURL("image/webp",0.7);
  }finally{URL.revokeObjectURL(url);}
}

export default function BuilderPage() {
  const router = useRouter();
  const siteCredits = useSiteGenerationCredits();

  const [brief, setBrief] = useState("");
  const briefTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Starts compact and expands as the user types or dictates a longer prompt.
  useEffect(() => {
    const textarea=briefTextareaRef.current;
    if(!textarea)return;
    textarea.style.height="0px";
    textarea.style.height=Math.min(290,Math.max(138,textarea.scrollHeight))+"px";
  },[brief]);
  const [attachments,setAttachments]=useState<File[]>([]);
  const attachInputRef=useRef<HTMLInputElement|null>(null);
  const transcriberRef=useRef<Transcriber|null>(null);
  // SpeechRecognition.start() only requests permission. Real listening starts on onstart.
  const [speechStatus,setSpeechStatus]=useState<"idle"|"requesting"|"listening">("idle");
  const isListening=speechStatus==="listening";
  const isRequestingMicrophone=speechStatus==="requesting";
  const [attachmentWarning,setAttachmentWarning]=useState("");
  const [style, setStyle] = useState("automatico");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState("automatico");
  // Rendering family, independent from the site's niche/type.
  const [templateId,setTemplateId]=useState<SiteTemplateId>("frigolog-universal");
  const [switchingTemplate,setSwitchingTemplate]=useState(false);
  // Auto-detect the industry from the actual brief; explicit user selection wins.
  const normalizedBrief = brief.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const detectedPresetId = /\b(restaurante|restaurantes|pizzaria|hamburgueria|bistro|cafeteria|churrascaria|lanchonete|sushi|gastronomia)\b/.test(normalizedBrief)
    ? "restaurante"
    : /\b(imobiliaria|imobiliarias|imoveis|corretor(?:a|es)? de imoveis|corretora de imoveis|empreendimentos imobiliarios)\b/.test(normalizedBrief)
      ? "imobiliaria"
      : null;
  const effectivePresetId = selectedPresetId === "automatico" ? (detectedPresetId ?? "institucional") : selectedPresetId;
  // Keep hand-picked visual families; specialized layouts are defaults only.
  const effectiveTemplateId:SiteTemplateId = templateId === "frigolog-universal"
    ? effectivePresetId === "restaurante" ? "restaurant-premium"
      : effectivePresetId === "imobiliaria" ? "real-estate-premium"
      : templateId
    : templateId;
  const selectedPreset = STARTING_POINTS.find((item) => item.id === effectivePresetId) ?? STARTING_POINTS[0];
  const [project, setProject] = useState<SiteProject | null>(null);
  const [activePage, setActivePage] = useState<SitePageKey>("home");
  const [phase, setPhase] = useState<Phase>("idle");
  const [generationProgress,setGenerationProgress]=useState<GenerationProgress>(INITIAL_GENERATION_PROGRESS);
  const [currentStep, setCurrentStep] = useState<SitePageKey | null>(null);
  const [error, setError] = useState("");
  const [instruction, setInstruction] = useState("");
  const [revisionImage, setRevisionImage] = useState("");
  const [revisionImageError, setRevisionImageError] = useState("");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "celular">("desktop");
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [crmProjectId, setCrmProjectId] = useState<string | null>(null);
  const [crmPreviewHtml, setCrmPreviewHtml] = useState("");
  const [sectionPickerOpen,setSectionPickerOpen]=useState(false);
  const [addingSection,setAddingSection]=useState(false);
  const [sectionUploadId,setSectionUploadId]=useState<string|null>(null);
  const sectionImageInputRef=useRef<HTMLInputElement|null>(null);
  const [editingBrand,setEditingBrand]=useState(false);
  const [brandDraft,setBrandDraft]=useState("");
  const [savingBrand,setSavingBrand]=useState(false);
  const [uploadingLogo,setUploadingLogo]=useState(false);
  const logoInputRef=useRef<HTMLInputElement|null>(null);
  const [costDebugEnabled, setCostDebugEnabled] = useState(false);
  const [costPanelOpen, setCostPanelOpen] = useState(false);
  const [costInfo, setCostInfo] = useState<{ costAccumulatedUsd: string; status: string } | null>(null);
  const [costError, setCostError] = useState("");
  const [costUsage, setCostUsage] = useState<Array<{ id: string; operation: string; model: string; status: string; inputTokens: number; outputTokens: number; costEstimatedUsd: string | null; costActualUsd: string | null; createdAt: string }>>([]);
  const [costAuditError, setCostAuditError] = useState("");
  async function refreshCostAudit(projectId: string) {
    setCostAuditError("");
    try {
      const response = await fetch(`/api/crm/site-projects/${encodeURIComponent(projectId)}/cost-audit`, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 403 ? "Detalhamento disponível somente para o administrador." : `Detalhamento indisponível (HTTP ${response.status}).`);
      const result = await response.json() as { usage?: typeof costUsage };
      setCostUsage(result.usage || []);
    } catch (cause) {
      setCostAuditError(cause instanceof Error ? cause.message : "Não foi possível consultar as chamadas.");
    }
  }


  async function refreshCost(projectId: string) {
    setCostError("");
    try {
      const response = await fetch(`/api/crm/site-projects/${encodeURIComponent(projectId)}`, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error(`Falha HTTP ${response.status}`);
      const detail = await response.json() as { project?: { costAccumulatedUsd?: string | number | null; status?: string } };
      const amount = detail.project?.costAccumulatedUsd;
      if (amount == null || !Number.isFinite(Number(amount))) throw new Error("O backend não retornou um custo válido.");
      setCostInfo({ costAccumulatedUsd: String(amount), status: detail.project?.status || "DESCONHECIDO" });
    } catch (cause) {
      setCostError(cause instanceof Error ? cause.message : "Não foi possível consultar o custo.");
    }
  }

  useEffect(() => {
    setCostDebugEnabled(new URLSearchParams(window.location.search).get("costDebug") === "1");
  }, []);

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
  useEffect(()=>()=>{transcriberRef.current?.stop();},[]);
  function attachFiles(incoming:FileList|null) {
    if(!incoming)return;
    const allowed=["image/png","image/jpeg","image/webp","application/pdf","text/plain"];
    const files=Array.from(incoming);
    if(files.some(file=>!allowed.includes(file.type)||file.size>5*1024*1024||file.size===0)){
      setAttachmentWarning("Aceitamos fotos PNG, JPG e WebP, PDF ou TXT de até 5 MB por arquivo.");
      return;
    }
    if(attachments.length+files.length>3){
      setAttachmentWarning("Adicione até 3 arquivos por geração.");
      return;
    }
    if([...attachments,...files].reduce((sum,file)=>sum+file.size,0)>9*1024*1024){
      setAttachmentWarning("Os anexos somados devem ter até 9 MB.");
      return;
    }
    setAttachmentWarning("");
    setAttachments(existing=>[...existing,...files]);
  }
  function toggleDictation(){
    // Allow cancelling a pending Android permission dialog or an active session.
    if(transcriberRef.current && speechStatus!=="idle"){
      try{transcriberRef.current.stop();}catch{/* recognition may not have started */}
      transcriberRef.current=null;
      setSpeechStatus("idle");
      return;
    }
    const win=window as Window & {
      SpeechRecognition?:new()=>Transcriber;
      webkitSpeechRecognition?:new()=>Transcriber;
    };
    const Constructor=win.SpeechRecognition||win.webkitSpeechRecognition;
    if(!Constructor){
      setAttachmentWarning("Este navegador não suporta transcrição por voz. Você também pode usar o microfone do teclado do celular para ditar o briefing.");
      return;
    }
    try{
      const speech=new Constructor();
      speech.lang="pt-BR";speech.continuous=true;speech.interimResults=false;
      speech.onstart=()=>{
        if(transcriberRef.current===speech)setSpeechStatus("listening");
      };
      speech.onresult=(event)=>{
        const segments:string[]=[];
        for(let index=event.resultIndex;index<event.results.length;index++){
          const text=event.results[index]?.[0]?.transcript?.trim();
          if(text)segments.push(text);
        }
        if(segments.length)setBrief(current=>(current.trim()?current.trim()+" ":"")+segments.join(" "));
      };
      speech.onerror=(event)=>{
        if(transcriberRef.current!==speech)return;
        transcriberRef.current=null;
        setSpeechStatus("idle");
        const reason=event.error||"";
        if(reason==="not-allowed"||reason==="service-not-allowed"||reason==="permission-denied"){
          setAttachmentWarning(
            "O Android bloqueou o acesso ao microfone. Feche botões flutuantes, balões de conversa e sobreposições de outros apps; depois tente novamente. Se continuar, confira a permissão do microfone para o Chrome."
          );
        }else if(reason==="audio-capture"){
          setAttachmentWarning("O microfone não está disponível. Verifique se outro app está usando o áudio e tente novamente.");
        }else if(reason==="network"){
          setAttachmentWarning("A transcrição precisa de conexão com a internet neste navegador. Verifique a rede ou use o microfone do teclado.");
        }else if(reason==="no-speech"){
          setAttachmentWarning("Não foi detectada nenhuma fala. Toque no microfone e tente novamente.");
        }else if(reason!=="aborted"){
          setAttachmentWarning("Não foi possível transcrever sua fala. Você pode tentar novamente ou usar o microfone do teclado.");
        }
      };
      speech.onend=()=>{
        if(transcriberRef.current===speech){
          transcriberRef.current=null;
          setSpeechStatus("idle");
        }
      };
      transcriberRef.current=speech;
      setAttachmentWarning("");
      setSpeechStatus("requesting");
      // Browsers show an OS-level permission dialog; only onstart confirms capture.
      speech.start();
    }catch{
      transcriberRef.current=null;
      setSpeechStatus("idle");
      setAttachmentWarning("Não foi possível solicitar o microfone. Feche sobreposições de outros aplicativos e tente novamente, ou use o microfone do teclado.");
    }
  }

  const [pendingKeys, setPendingKeys] = useState<SitePageKey[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLIFrameElement | null>(null);
  const inlineImageInputRef = useRef<HTMLInputElement | null>(null);
  const inlineImageKindRef = useRef<"hero" | "work">("hero");
  const previewStageRef = useRef<HTMLDivElement | null>(null);
  const [previewStageWidth, setPreviewStageWidth] = useState(0);

  useEffect(() => {
    const stage = previewStageRef.current;
    if (!stage) return;
    const update = () => setPreviewStageWidth(stage.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [project]);

  useEffect(() => {
    function handlePreviewNavigation(event: MessageEvent) {
      if (event.source !== previewRef.current?.contentWindow) return;
      if(event.data?.type==="pagenova-extra-image-file"){
        const id=event.data.id;
        const dataUrl=event.data.dataUrl;
        if(!project||typeof id!=="string"||!/^extra_[a-zA-Z0-9_-]{8,40}$/.test(id)||
          !(project.extraSections?.[activePage]||[]).some(s=>s.id===id)||
          typeof dataUrl!=="string"||dataUrl.length>12_000_000||
          !["data:image/png;base64,","data:image/jpeg;base64,","data:image/webp;base64,"].some(prefix=>dataUrl.startsWith(prefix)))return;
        void (async()=>{
          try{
            const blob=await(await fetch(dataUrl)).blob();
            const file=new File([blob],"imagem."+ (blob.type==="image/png"?"png":blob.type==="image/webp"?"webp":"jpg"),{type:blob.type});
            const optimized=await compressReference(file);
            if(optimized.length>1_400_000)throw Error("Imagem muito grande após otimização.");
            const existing=project.extraSections?.[activePage]||[];
            const updated={...project,extraSections:{...project.extraSections,[activePage]:existing.map(s=>s.id===id?{...s,imageUrl:optimized}:s)}};
            await savePageNovaProject(updated.id,updated);
            setProject(updated);
          }catch{setError("Não foi possível salvar a foto. Tente novamente.");}
        })();
        return;
      }
      if(event.data?.type==="pagenova-extra-section-drop"){
        const id=event.data.id,targetId=event.data.targetId;
        const slot=event.data.slot,after=event.data.after;
        if(!project||typeof id!=="string"||!Number.isInteger(slot)||slot<0||slot>100||
          typeof targetId!=="string"||typeof after!=="boolean")return;
        const current=project.extraSections?.[activePage]||[];
        const index=current.findIndex(s=>s.id===id);
        if(index<0||id===targetId)return;
        const reordered=[...current];
        const [moved]=reordered.splice(index,1);
        let insertAt=reordered.length;
        if(targetId){
          const destination=reordered.findIndex(s=>s.id===targetId);
          if(destination>=0)insertAt=destination+(after?1:0);
        }
        reordered.splice(insertAt,0,{...moved,slot});
        const updated={...project,extraSections:{...project.extraSections,[activePage]:reordered}};
        setProject(updated);
        void savePageNovaProject(updated.id,updated).catch(()=>setError("Não foi possível salvar a nova posição."));
        return;
      }
      if (event.data?.type === "pagenova-image-upload-error") {
        setError(String(event.data.message || "Falha no envio da imagem."));
        return;
      }
      if (event.data?.type === "pagenova-image-upload-file") {
        const dataUrl = event.data.dataUrl;
        if (typeof dataUrl !== "string" || dataUrl.length > 7_500_000 ||
          !["data:image/png;base64,", "data:image/jpeg;base64,", "data:image/webp;base64,"].some((prefix) => dataUrl.startsWith(prefix))) {
          setError("Arquivo de imagem inválido ou muito grande.");
          return;
        }
        const kind: "hero" | "work" = event.data.kind === "work" ? "work" : "hero";
        try {
          const comma = dataUrl.indexOf(",");
          const raw = atob(dataUrl.slice(comma + 1));
          const bytes = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
          const type = dataUrl.slice(5, dataUrl.indexOf(";"));
          const file = new File([bytes], kind + ".png", { type });
          void uploadSiteImage(file, kind);
        } catch {
          setError("Não foi possível processar a imagem selecionada.");
        }
        return;
      }
      if (event.data?.type === "pagenova-image-upload-request") {
        inlineImageKindRef.current = event.data.kind === "work" ? "work" : "hero";
        inlineImageInputRef.current?.click();
        return;
      }
      if (event.data?.type === "pagenova-live-edits") {
        const key = event.data.key as SitePageKey;
        const edits = event.data.edits as LiveEdit[];
        if (!project || key !== activePage || !project.pages[key] || !Array.isArray(edits) || !edits.length || edits.length > 30 ||
          edits.some((edit) => typeof edit?.selector !== "string" || edit.selector.length > 500 ||
            typeof edit.text !== "string" || edit.text.length > 2000 ||
            !Number.isFinite(edit.size) || edit.size < 10 || edit.size > 120 ||
            !/^#[a-fA-F0-9]{6}$/.test(edit.color))) return;
        const selectors = new Set(edits.map((edit) => edit.selector));
        const current = (project.liveEdits?.[key] || []).filter((edit) => !selectors.has(edit.selector));
        const updated = { ...project, liveEdits: { ...project.liveEdits,
          [key]: [...current, ...edits].slice(-100) } };
        setProject(updated);
        void savePageNovaProject(updated.id, updated).catch(() => setError("Não foi possível salvar a alteração de texto."));
        return;
      }
      if (event.data?.type === "pagenova-live-edit") {
        const key = event.data.key as SitePageKey;
        const edit = event.data.edit as LiveEdit;
        if (!project || key !== activePage || !project.pages[key] || typeof edit?.selector !== "string" ||
          edit.selector.length > 500 || typeof edit.text !== "string" || edit.text.length > 2000 ||
          !Number.isFinite(edit.size) || edit.size < 10 || edit.size > 120 ||
          !/^#[a-fA-F0-9]{6}$/.test(edit.color)) return;
        const current = project.liveEdits?.[key] || [];
        const protectedClosingSelector = /pn001-(?:final-cta|footer)/i;
        const sanitizedCurrent = current.filter((item) => {
          if (item.selector === edit.selector) return false;
          // Old drag snapshots for the responsive closing blocks can contain
          // fixed pixel geometry. Drop them as soon as any new edit is saved.
          return !protectedClosingSelector.test(item.selector);
        });
        const safeEdit = protectedClosingSelector.test(edit.selector)
          ? { ...edit, ghostId: "", left: undefined, top: undefined, width: undefined, height: undefined, movable: false }
          : edit;
        const updated = { ...project, liveEdits: { ...project.liveEdits,
          [key]: [...sanitizedCurrent, safeEdit].slice(-100) } };
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
      if(saved.templateId)setTemplateId(saved.templateId);
      setSelectedPresetId(saved.presetId || "institucional");
      setActivePage(SITE_PAGES.find(({ key }) => saved.pages[key])?.key ?? "home");
      // CRM projects may still be generating, or may have failed. Never
      // interpret the placeholder home page as a completed generation.
      if (saved.id.length === 26) {
        setCrmProjectId(saved.id);
        setPhase("generating");
        void fetch(`/api/crm/site-projects/${encodeURIComponent(saved.id)}`, {
          credentials: "same-origin", cache: "no-store",
        }).then(async (response) => {
          if (!response.ok) throw new Error("Não foi possível consultar a geração existente.");
          const detail = await response.json() as {
            project?: {status?:string;lastFailureMessage?:string|null};
            jobs?: Array<{id:string;status:string}>;
          };
          const status = detail.project?.status;
          if (status==="FAILED") {
            setPhase("error");
            setError(detail.project?.lastFailureMessage || "A geração anterior falhou. O projeto foi preservado.");
          } else if (status==="READY"||status==="PUBLISHED") {
            // The CRM draft is authoritative for the selected visual template.
            // A project created before the dropdown upgrade may have no local
            // templateId; fetch it without creating a new paid generation.
            try {
              const templateResponse=await fetch(`/api/crm/site-projects/${encodeURIComponent(saved.id)}/config`, {
                credentials:"same-origin",cache:"no-store",
              });
              if(templateResponse.ok){
                const templateData=await templateResponse.json().catch(()=>({})) as {
                  config?:{project?:{templateId?:string}};
                };
                const serverTemplate=templateData.config?.project?.templateId;
                if(serverTemplate==="frigolog-universal"||serverTemplate==="muse-editorial"||serverTemplate==="atelier-norte"||serverTemplate==="vertice-corporate"||serverTemplate==="restaurant-premium"||serverTemplate==="real-estate-premium"){
                  setTemplateId(serverTemplate);
                  setProject(previous=>previous?.id===saved.id?{...previous,templateId:serverTemplate}:previous);
                  if(saved.templateId!==serverTemplate){
                    void savePageNovaProject(saved.id,{...saved,templateId:serverTemplate}).catch(()=>undefined);
                  }
                }
              }
            } catch {
              // A temporary failure reading template metadata must not block
              // the existing generated HTML from loading successfully.
            }
            const html=await fetch(`/api/crm/site-projects/${encodeURIComponent(saved.id)}/render`, {
              credentials:"same-origin",cache:"no-store",
            });
            if (!html.ok) throw new Error(`O site existe, mas a prévia está indisponível (HTTP ${html.status}). O projeto foi preservado.`);
            setCrmPreviewHtml(await html.text());
            void refreshCost(saved.id);
            setPhase("ready");
          } else {
            // Status only: do not submit another paid generation.
            void monitorCrmGeneration(saved.id,detail.jobs?.[0]?.id);
          }
        }).catch((cause) => {
          setPhase("error");
          setError(cause instanceof Error ? cause.message : "Não foi possível consultar a geração.");
        });
      } else {
        setPhase("ready");
      }
    }).catch(() => setError("Não foi possível abrir o projeto salvo."));
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);


  async function uploadSiteImage(file: File, kind: "hero" | "work") {
    if (!project) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Envie uma imagem PNG, JPG ou WebP."); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter até 5 MB."); return;
    }
    setUploadingImage(true); setError("");
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string"
          ? resolve(reader.result) : reject(new Error("Imagem inválida."));
        reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
        reader.readAsDataURL(file);
      });
      const updated: SiteProject = {
        ...project,
        institutional: {
          role: "", audience: "", offer: "", process: "", proof: "",
          ...project.institutional,
          ...(kind === "hero" ? { portrait: image } : { businessPhoto: image, workPhoto: image }),
        },
      };
      await savePageNovaProject(updated.id, updated);
      setProject(updated);
      // Update the current CRM preview immediately without regenerating HTML.
      previewRef.current?.contentWindow?.postMessage({
        type: "pagenova-user-images", images: updated.institutional
      }, "*");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao carregar imagem.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function requestPage(site: SiteProject, key: SitePageKey, editInstruction = "", screenshot = ""): Promise<{ page: SitePage; visualDirection?: SiteProject["visualDirection"]; headerDirection?: SiteProject["headerDirection"]; institutional?: SiteProject["institutional"]; siteStrategy?: SiteProject["siteStrategy"]; revisionPlan?: RevisionPlan }> {
    const controller = new AbortController();
    abortRef.current = controller;
    const response = await fetch("/api/builder/generate", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ name: site.name, brief: site.brief,
        style: ["moderno","elegante","vibrante"].includes(site.style) ? site.style : "moderno",
        key, presetId: site.presetId,
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


  // Read real events from the existing CRM job. Polling is deliberately
  // used instead of SSE so the authenticated Next.js proxy stays simple.
  // A timer triggers reads only; it NEVER increases the percentage.
  async function monitorCrmGeneration(projectId: string, knownJobId?: string): Promise<void> {
    setPhase("generating");
    setError("");
    setCurrentStep("home");
    setGenerationProgress(INITIAL_GENERATION_PROGRESS);
    let jobId=knownJobId||null;
    let lastSequence=0;
    let consecutiveFailures=0;
    const wait=()=>new Promise<void>(resolve=>window.setTimeout(resolve,2000));
    try {
      // Multiple production deployments can temporarily interrupt the CRM API.
      // Never mark a running paid job failed just because one poll returned 502.
      for(let attempt=0;attempt<360;attempt++){
        let detail:{
          project?:{status?:string;lastFailureMessage?:string|null};
          jobs?:Array<{id?:string;status?:string;errorMessage?:string|null}>;
          error?:{message?:string};
        };
        try{
          const response=await fetch(`/api/crm/site-projects/${encodeURIComponent(projectId)}`,{
            credentials:"same-origin",cache:"no-store",signal:AbortSignal.timeout(12000),
          });
          if(response.status===401||response.status===403)
            throw new Error("Sua sessão expirou. Faça login novamente; o trabalho em andamento foi preservado.");
          if(!response.ok)throw new Error(`O motor de geração está temporariamente indisponível (HTTP ${response.status}).`);
          detail=await response.json();
          if(!detail.project)throw new Error("O estado do projeto não foi recebido.");
          consecutiveFailures=0;
        }catch(error){
          const message=error instanceof Error?error.message:"Falha de rede.";
          if(/sessão expirou/.test(message))throw error;
          consecutiveFailures++;
          if(consecutiveFailures>=30){
            throw new Error("A conexão com o motor de sites está instável. O projeto foi preservado e pode continuar sendo processado. Use 'Verificar geração existente' para consultar, sem criar outro site ou consumir outro crédito.");
          }
          setGenerationProgress(current=>({...current,label:"Reconectando ao motor de sites..."}));
          await wait();
          continue;
        }
        if(!jobId)jobId=detail.jobs?.[0]?.id||null;
        if(jobId){
          try{
            const response=await fetch(`/api/crm/site-jobs/${encodeURIComponent(jobId)}/events?after=${lastSequence}`,{
              credentials:"same-origin",cache:"no-store",signal:AbortSignal.timeout(12000),
            });
            if(response.ok){
              const history=await response.json() as {
                events?:Array<{sequence:number;stage?:string|null;eventType?:string;message?:string}>;
              };
              for(const entry of history.events||[]){
                lastSequence=Math.max(lastSequence,entry.sequence);
                if(entry.eventType!=="STAGE_STARTED"&&entry.eventType!=="COMPLETED")continue;
                const milestone=milestoneFor(entry.stage);
                if(!milestone)continue;
                setGenerationProgress(old=>({
                  percent:Math.max(old.percent,Math.min(95,milestone.percent)),
                  label:milestone.id==="COMPLETED"?"Finalizando prévia...":milestone.label,
                  stage:milestone.id,jobId,
                }));
              }
            }
          }catch{/* The project state remains authoritative if events cannot be read. */}
        }
        if(detail.project.status==="READY"||detail.project.status==="PUBLISHED"){
          // The project is already saved. Rendering may briefly be unavailable
          // while the server starts: retry instead of charging another generation.
          try{
            const response=await fetch(`/api/crm/site-projects/${encodeURIComponent(projectId)}/render`,{
              credentials:"same-origin",cache:"no-store",signal:AbortSignal.timeout(15000),
            });
            if(!response.ok)throw new Error(`Prévia indisponível (HTTP ${response.status}).`);
            const html=await response.text();
            if(!html.trim())throw new Error("A prévia retornou vazia.");
            setCrmPreviewHtml(html);
            setGenerationProgress({percent:100,label:"Seu site está pronto!",stage:"COMPLETED",jobId});
            void refreshCost(projectId);
            setCurrentStep(null);setPendingKeys([]);setPhase("ready");
            return;
          }catch{
            consecutiveFailures++;
            setGenerationProgress(current=>({...current,label:"Site salvo. Reabrindo prévia..."}));
            if(consecutiveFailures>=30)throw new Error("O site foi criado e salvo, mas a prévia está temporariamente indisponível. Clique em 'Verificar geração existente' para carregá-la sem custo.");
          }
        }else if(detail.project.status==="FAILED"){
          throw new Error(detail.project.lastFailureMessage||
            detail.jobs?.find(job=>job.id===jobId)?.errorMessage||
            "A geração falhou. O projeto foi preservado para diagnóstico.");
        }
        if(attempt<359)await wait();
      }
      throw new Error("A geração ainda não foi confirmada. O projeto continua salvo. Consulte em 'Verificar geração existente' sem criar outro pedido.");
    }catch(cause){
      setCurrentStep(null);setPendingKeys([]);setPhase("error");
      setError(cause instanceof Error?cause.message:"Não foi possível consultar a geração.");
    }
  }

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase === "generating") return;

    const prompt = brief.trim();
    if (prompt.length < 20) {
      setError("Descreva o site que você quer criar com pelo menos 20 caracteres.");
      return;
    }
    // Do not create an empty CRM project when the authoritative wallet has no credits.
    if (siteCredits.exhausted) {
      setError("Você utilizou as gerações de sites deste ciclo. Aguarde a renovação.");
      return;
    }

    // Do not submit a generic draft label when the briefing contains the
    // person's or business's actual name. Purely local parsing: no AI call.
    const inferredName = inferSiteBrand(prompt) || "Novo projeto";

    setPhase("generating");
    setGenerationProgress(INITIAL_GENERATION_PROGRESS);
    setError("");
    setCurrentStep("home");
    setPendingKeys([]);
    setCrmPreviewHtml("");
    setCostInfo(null);
    setCostError("");

    try {
      // Reference documents/images are interpreted BEFORE creating a paid
      // generation job. Never silently discard attachments.
      const attached=attachments.slice();
      let annotatedPrompt=prompt;
      const visualFiles=attached.filter(file=>file.type.startsWith("image/"));
      let initialImages:string[]=[];
      if(attached.length){
        const payload=new FormData();
        payload.append("mode","site");
        const prepared=await Promise.all(attached.map(async file=>{
          if(!file.type.startsWith("image/"))return file;
          const compressed=await compressReference(file);
          const blob=await (await fetch(compressed)).blob();
          return new File([blob],file.name.replace(/\.[^.]+$/,"")+".webp",{type:"image/webp"});
        }));
        if(prepared.reduce((sum,file)=>sum+file.size,0)>3.8*1024*1024)
          throw new Error("Os anexos ficaram grandes demais para enviar. Reduza ou divida seu PDF (até 3 MB).");
        prepared.forEach(file=>payload.append("files",file));
        const analysisResponse=await fetch("/api/builder/analyze-attachments",{
          method:"POST",credentials:"same-origin",body:payload,
        });
        const analysis=await analysisResponse.json().catch(()=>({})) as {
          summary?:string;error?:string;
        };
        if(!analysisResponse.ok||!analysis.summary){
          throw new Error(analysis.error||"Não foi possível analisar seus anexos. Nenhum site foi gerado.");
        }
        annotatedPrompt=(prompt+"\n\nREFERÊNCIAS ANEXADAS (interpretação da IA):\n"+
          analysis.summary);
        initialImages=await Promise.all(visualFiles.slice(0,2).map(compressReference));
      }
      const createResponse = await fetch("/api/crm/site-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          leadId: null,
          businessName: inferredName,
          internalName: inferredName,
          siteType: "ONE_PAGE",
          briefing: {
            templateId: effectiveTemplateId,
            business: { name: inferredName, services: [], differentials: [] },
            objective: { goal: "QUOTE_REQUESTS" },
            style: {
              theme: "AI_DECIDES",
              keywords: style === "automatico" ? ["responsivo"] : [style, "responsivo"],
              density: "BALANCED",
              motionLevel: "BALANCED"
            },
            freeformInstructions: effectivePresetId === "institucional" && selectedPresetId === "automatico"
              ? annotatedPrompt
              : `Site do tipo ${selectedPreset.title}. Use isso para orientar as seções, sem inventar dados ou funcionalidades.\n${annotatedPrompt}`,
            requiredSections: ["hero", "services", "benefits", "about", "process", "faq", "cta", "footer"],
            forbiddenSections: []
          }
        }),
      });
      const created = await createResponse.json() as { project?: { id: string }; error?: { message?: string } };
      if (!createResponse.ok || !created.project?.id) {
        throw new Error(created.error?.message || "Não foi possível criar o site no motor do PageNova.");
      }

      const projectId = created.project.id;
      setCrmProjectId(projectId);

      const localSite: SiteProject = {
        kind: "institutional-site",
        id: projectId,
        name: inferredName,
        templateId: effectiveTemplateId,
        presetId: effectivePresetId,
        brief: prompt,
        ...(initialImages.length ? {institutional:{
          role:"",audience:"",offer:"",process:"",proof:"",
          portrait:initialImages[0],
          businessPhoto:initialImages[1]||"",
        }} : {}),
        style,
        pages: {
          home: {
            key: "home",
            eyebrow: "",
            heading: inferredName,
            introduction: "",
            sections: [],
            cta: ""
          }
        },
        createdAt: new Date().toISOString(),
      };
      setProject(localSite);
      setActivePage("home");
      await savePageNovaProject(projectId, localSite);
      router.replace(`/app/builder?project=${projectId}`);

      const generateResponse = await fetch(`/api/crm/site-projects/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ idempotencyKey: `pagenova_${crypto.randomUUID()}` }),
      });
      const generation = await generateResponse.json() as { jobId?: string; error?: { message?: string } };
      if (!generateResponse.ok || !generation.jobId) {
        throw new Error(generation.error?.message || "Não foi possível iniciar a geração.");
      }
      // The same Supabase wallet is charged by the CRM proxy.
      void siteCredits.refresh();

      await monitorCrmGeneration(projectId,generation.jobId);
    } catch (cause) {
      setCurrentStep(null);
      setPendingKeys([]);
      setPhase("error");
      setError(cause instanceof Error ? cause.message : "Falha na geração.");
    }
  }

/** Deterministic local edits: never guess selectors or rewrite the Railway HTML. */
  function parseLocalEdit(raw: string):
    | { kind: "theme"; value: PreviewTheme }
    | { kind: "text"; field: "heading" | "eyebrow" | "cta"; value: string }
    | { kind: "logo"; value: "left" | "center" | "right" }
    | { kind: "replace"; from: string; to: string }
    | null {
    const input = raw.trim();
    const normalized = input.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.!?]+$/g, "").trim();
    const literal = input.match(/^(?:mude|troque|altere|substitua) (.{3,120}?) (?:para|por) (.{2,160})$/i);
    if (literal) return { kind: "replace", from: literal[1].trim(), to: literal[2].trim() };
    const theme = normalized.match(/^(?:mude|mudar|troque|trocar|altere|alterar|coloque|usar|use|aplique) (?:o |a )?(?:tema|aparencia)(?: (?:do site|da pagina))? (?:para |pra |por )?(original|claro|escuro|areia)$/);
    if (theme) return { kind: "theme", value: theme[1] as PreviewTheme };
    const logo = normalized.match(/^(?:alinhe|alinhar|posicione|posicionar|coloque|mude|troque) (?:o |a )?(?:logo|logotipo|logomarca) (?:para |a |ao |na |no )?(centro|esquerda|direita)$/);
    if (logo) return { kind: "logo", value: ({ centro: "center", esquerda: "left", direita: "right" } as const)[logo[1] as "centro" | "esquerda" | "direita"] };
    // Explicit delimiters avoid accidentally treating a complex instruction as literal copy.
    const copy = input.match(/^(?:troque|altere|mude|substitua|coloque) (?:o |a )?(t[ií]tulo principal|subt[ií]tulo|texto do bot[aã]o principal) (?:para|por) [\"“](.{1,180})[\"”]$/i);
    if (copy) {
      const field = /^t[ií]tulo principal$/i.test(copy[1]) ? "heading" : /^subt[ií]tulo$/i.test(copy[1]) ? "eyebrow" : "cta";
      return { kind: "text", field, value: copy[2] };
    }
    return null;
  }

  function tryLocalIframeCopy(field: "heading" | "eyebrow" | "cta" | "replace", value: string, from?: string): Promise<boolean> {
    const frame = previewRef.current?.contentWindow;
    if (!frame) return Promise.resolve(false);
    return new Promise((resolve) => {
      const id = "local-" + Date.now() + "-" + Math.random().toString(36).slice(2);
      let done = false;
      const finish = (ok: boolean) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        resolve(ok);
      };
      const onMessage = (event: MessageEvent) => {
        if (event.source === frame && event.data?.type === "pagenova-local-command-result" && event.data.id === id) finish(event.data.ok === true);
      };
      window.addEventListener("message", onMessage);
      const timer = window.setTimeout(() => finish(false), 1000);
      frame.postMessage({ type: "pagenova-local-command", id, command: { field, value, from } }, "*");
    });
  }

  async function revise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || (!instruction.trim() && !revisionImage) || phase === "generating") return;
    // Sem print e sem instrucao ambigua: alteracoes locais nao usam API.
    const local = revisionImage ? null : parseLocalEdit(instruction);
    if (local?.kind === "theme") {
      await changeTheme(local.value);
      setInstruction("");
      return;
    }
    if (local?.kind === "logo" && project.headerDirection) {
      const updated = { ...project, headerDirection: { ...project.headerDirection, logoPosition: local.value } };
      try {
        await savePageNovaProject(updated.id, updated);
        setProject(updated); setInstruction(""); setError("");
        return;
      } catch { setError("Falha ao salvar alinhamento; nenhuma chamada de IA foi feita."); return; }
    }
    if (local?.kind === "replace" && crmPreviewHtml) {
      const applied = await tryLocalIframeCopy("replace", local.to, local.from);
      if (applied) { setInstruction(""); setError(""); return; }
      setError("Não encontrei uma correspondência única para o texto na prévia. Nenhuma alteração foi aplicada e nenhuma chamada de IA foi feita. Selecione o texto diretamente no editor ou especifique onde ele aparece.");
      return;
    }
    if (local?.kind === "text" && crmPreviewHtml) {
      // O iframe gera a mesma LiveEdit usada pelo editor visual e pela publicacao.
      // Se nao houver um alvo unico e seguro, seguimos com a IA existente.
      if (await tryLocalIframeCopy(local.field, local.value)) {
        setInstruction(""); setError("");
        return;
      }
    }
    // Texto estruturado so pode ser alterado localmente se a pagina renderizada
    // for a do proprio projeto. No HTML do Railway, a alteracao seria invisivel.
    if (local?.kind === "text" && !crmPreviewHtml && project.pages[activePage]) {
      const updated = { ...project, pages: { ...project.pages, [activePage]: { ...project.pages[activePage], [local.field]: local.value } } };
      try {
        await savePageNovaProject(updated.id, updated);
        setProject(updated); setInstruction(""); setError("");
        return;
      } catch { setError("Falha ao salvar texto; nenhuma chamada de IA foi feita."); return; }
    }
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

  const originalSections=project?.pages[activePage]?originalSectionCount(crmPreviewHtml||renderSitePreview(project,activePage)):0;
  async function changeExtraSectionSlot(index:number,slot:number){
    if(!project?.pages[activePage]||addingSection||publishing)return;
    const list=[...(project.extraSections?.[activePage]||[])];
    if(!list[index])return;
    list[index]={...list[index],slot};
    const updated={...project,extraSections:{...project.extraSections,[activePage]:list}};
    setAddingSection(true);setError("");
    try{await savePageNovaProject(updated.id,updated);setProject(updated);}
    catch{setError("Não foi possível salvar a posição da seção.");}
    finally{setAddingSection(false);}
  }

  async function updateExtraSection(id:string,patch:Record<string,string>){
    if(!project||addingSection||publishing)return;
    const existing=project.extraSections?.[activePage]||[];
    const updated={...project,extraSections:{...project.extraSections,[activePage]:existing.map(s=>s.id===id?{...s,...patch}:s)}};
    setAddingSection(true);setError("");
    try{await savePageNovaProject(updated.id,updated);setProject(updated);}
    catch{setError("Não foi possível salvar a edição desta seção.");}
    finally{setAddingSection(false);}
  }
  async function uploadExtraSectionImage(file:File){
    const id=sectionUploadId;
    if(!id||!project)return;
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>8*1024*1024){
      setError("Envie JPG, PNG ou WebP de até 8 MB.");return;
    }
    try{
      const compressed=await compressReference(file);
      if(compressed.length>1400000)throw Error("A imagem ainda está grande. Escolha outra imagem.");
      await updateExtraSection(id,{imageUrl:compressed,imageAlt:file.name.replace(/\\.[^.]+$/,"")});
    }catch(e){setError(e instanceof Error?e.message:"Não foi possível carregar a imagem.");}
    finally{setSectionUploadId(null);}
  }

  async function addExtraSection(kind:ExtraSectionKind) {
    if(!project?.pages[activePage]||addingSection||phase==="generating")return;
    const preset=EXTRA_SECTION_OPTIONS.find(item=>item.kind===kind);
    if(!preset)return;
    const current=project.extraSections?.[activePage]||[];
    if(current.length>=24){setError("O limite é de 24 seções adicionais por página.");return;}
    const section={id:"extra_"+crypto.randomUUID().replace(/-/g,"").slice(0,16),kind,title:preset.title,body:preset.body,slot:originalSections};
    const updated={...project,extraSections:{...project.extraSections,[activePage]:[...current,section]}};
    setAddingSection(true);setSectionPickerOpen(false);setError("");
    try{
      await savePageNovaProject(updated.id,updated);
      setProject(updated);
    }catch{setError("Não foi possível salvar a nova seção. Tente novamente.");}
    finally{setAddingSection(false);}
  }

  async function deleteExtraSection(id:string,title:string) {
    if(!project?.pages[activePage]||addingSection||publishing)return;
    if(!window.confirm(`Excluir a seção "${title}" deste site? Esta ação não pode ser desfeita.`))return;
    const current=project.extraSections?.[activePage]||[];
    if(!current.some(section=>section.id===id))return;
    const updated={...project,extraSections:{...project.extraSections,[activePage]:current.filter(section=>section.id!==id)}};
    setAddingSection(true);setError("");
    try{
      await savePageNovaProject(updated.id,updated);
      setProject(updated);
    }catch{setError("Não foi possível excluir a seção. Tente novamente.");}
    finally{setAddingSection(false);}
  }

  async function moveExtraSection(index:number,direction:-1|1) {
    if(!project?.pages[activePage]||addingSection||publishing)return;
    const list=[...(project.extraSections?.[activePage]||[])];
    const item=list[index];
    if(!item)return;
    const slot=Math.min(originalSections,Math.max(0,item.slot??originalSections));
    // Move through the actual page, including the original template sections.
    // Within a slot, reorder extra sections without changing the original content.
    const siblings=list.map((section,i)=>({section,i})).filter(({section,i})=>i!==index &&
      Math.min(originalSections,Math.max(0,section.slot??originalSections))===slot);
    const nearest=direction<0?siblings.filter(({i})=>i<index).at(-1):siblings.find(({i})=>i>index);
    if(nearest){
      [list[index],list[nearest.i]]=[list[nearest.i],list[index]];
    }else{
      const nextSlot=slot+direction;
      if(nextSlot<0||nextSlot>originalSections)return;
      list[index]={...item,slot:nextSlot};
    }
    const updated={...project,extraSections:{...project.extraSections,[activePage]:list}};
    setAddingSection(true);setError("");
    try{await savePageNovaProject(updated.id,updated);setProject(updated);}
    catch{setError("Não foi possível salvar a nova posição da seção.");}
    finally{setAddingSection(false);}
  }

  const preview = useMemo(() => {
    if (!project) return "";
    // A CRM draft starts with an empty placeholder home page. Rendering it
    // made the UI claim "Inicio pronta" even if the real job had failed.
    if (crmProjectId && !crmPreviewHtml) return "";
    return renderEditablePreview(appendExtraSections(crmPreviewHtml || renderSitePreview(project, activePage),project.extraSections?.[activePage]), project, activePage);
  },
    // Text edits already update the current iframe; regenerate only on page or theme changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
        [
      crmPreviewHtml,
      crmProjectId,
      project?.pages[activePage],
      project?.extraSections?.[activePage],
      project?.previewTheme,
      project?.visualDirection,
      project?.headerDirection,
      project?.institutional,
      // Live edits are applied directly inside the iframe. Rebuilding srcDoc
      // here causes a white flash and destroys the active drag/resize gesture.
      activePage,
    ]);

  async function changeTheme(theme: PreviewTheme) {
    if (!project) return;
    const updated = { ...project, previewTheme: theme };
    setProject(updated);
    try { await savePageNovaProject(updated.id, updated); }
    catch { setError("Não foi possível salvar o tema."); }
  }

  // The dropdown selects the ACTUAL CRM rendering family, not a CSS color
  // filter. Re-render the saved schema without invoking any AI endpoint.
  async function changeSiteTemplate(nextTemplate: SiteTemplateId): Promise<void> {
    if(!project||!crmProjectId||phase==="generating"||switchingTemplate)return;
    if((project.templateId||"frigolog-universal")===nextTemplate)return;
    setSwitchingTemplate(true);
    setError("");
    try{
      const path=`/api/crm/site-projects/${encodeURIComponent(crmProjectId)}`;
      const configResponse=await fetch(path+"/config",{credentials:"same-origin",cache:"no-store"});
      const data=await configResponse.json().catch(()=>({})) as {
        config?:{project?:{templateId?:string};[key:string]:unknown};
        lockVersion?:number;
        error?:{message?:string};
      };
      if(!configResponse.ok||!data.config?.project||typeof data.lockVersion!=="number"){
        throw new Error(data.error?.message||"Não foi possível carregar o modelo atual do site.");
      }
      const nextConfig={
        ...data.config,
        project:{...data.config.project,templateId:nextTemplate},
      };
      const savedResponse=await fetch(path+"/config",{
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        credentials:"same-origin",
        body:JSON.stringify({config:nextConfig,expectedLockVersion:data.lockVersion}),
      });
      const savedResult=await savedResponse.json().catch(()=>({})) as {error?:{message?:string}};
      if(!savedResponse.ok){
        throw new Error(savedResult.error?.message||"Não foi possível salvar o modelo. Atualize a página e tente novamente.");
      }
      // Once the CRM accepted the change, persist the actual selection even if
      // a temporary preview failure prevents rendering immediately.
      const updated:SiteProject={...project,templateId:nextTemplate,previewTheme:"original"};
      setProject(updated);
      setTemplateId(nextTemplate);
      // Local cache failure must not interrupt a successful CRM template swap.
      await savePageNovaProject(updated.id,updated).catch(()=>undefined);
      const html=await fetch(path+"/render",{credentials:"same-origin",cache:"no-store"});
      if(!html.ok){
        throw new Error(`Modelo salvo, mas a prévia não carregou (HTTP ${html.status}). Verifique a geração existente.`);
      }
      setCrmPreviewHtml(await html.text());
      setPhase("ready");
    }catch(cause){
      setError(cause instanceof Error?cause.message:"Não foi possível trocar o modelo do site.");
    }finally{
      setSwitchingTemplate(false);
    }
  }

  // Free, non-generative correction for projects created with a placeholder
  // brand. Uses the existing optimistic-lock config route and saves the local
  // project label as well, so the published Muse branding matches the editor.
  async function saveProjectBrand():Promise<void> {
    if(!project||!crmProjectId||savingBrand)return;
    const name=brandDraft.trim().replace(/\s+/g," ");
    if(name.length<3||name.length>72){
      setError("Informe o nome da empresa ou profissional (3 a 72 caracteres).");return;
    }
    setSavingBrand(true);setError("");
    try{
      const configResponse=await fetch(`/api/crm/site-projects/${encodeURIComponent(crmProjectId)}/config`,{
        credentials:"same-origin",cache:"no-store",
      });
      const data=await configResponse.json().catch(()=>({})) as {
        config?:{business?:{name?:string};seo?:{title?:string};navigation?:{logo?:unknown;wordmark?:string}};
        lockVersion?:number;error?:{message?:string};
      };
      if(!configResponse.ok||!data.config||typeof data.lockVersion!=="number")
        throw new Error(data.error?.message||"Não foi possível consultar a versão atual do projeto.");
      const oldName=data.config.business?.name||"";
      const nextConfig={
        ...data.config,
        business:{...data.config.business,name},
        navigation:{...data.config.navigation,logo:null,wordmark:name.slice(0,60)},
        seo:data.config.seo?.title?.toLowerCase().includes(oldName.toLowerCase()) && oldName.length>2
          ? {...data.config.seo,title:data.config.seo.title.replace(oldName,name).slice(0,60)}
          : data.config.seo,
      };
      const response=await fetch(`/api/crm/site-projects/${encodeURIComponent(crmProjectId)}/config`,{
        method:"PATCH",headers:{"Content-Type":"application/json"},credentials:"same-origin",
        body:JSON.stringify({config:nextConfig,expectedLockVersion:data.lockVersion}),
      });
      const result=await response.json().catch(()=>({})) as {error?:{message?:string}};
      if(!response.ok)throw new Error(result.error?.message||
        "O projeto pode ter sido alterado em outra guia. Atualize a página e tente novamente.");
      const html=await fetch(`/api/crm/site-projects/${encodeURIComponent(crmProjectId)}/render`,{
        credentials:"same-origin",cache:"no-store",
      });
      if(!html.ok)throw new Error(`Nome salvo, mas a prévia não carregou (HTTP ${html.status}). Verifique a geração existente.`);
      setCrmPreviewHtml(await html.text());
      const saved={...project,name};
      setProject(saved);
      await savePageNovaProject(saved.id,saved);
      setEditingBrand(false);
    }catch(cause){
      setError(cause instanceof Error?cause.message:"Falha ao corrigir nome do site.");
    }finally{setSavingBrand(false);}
  }

  async function changeBrandLogo(file:File|null):Promise<void>{
    if(!project||!crmProjectId||uploadingLogo)return;
    if(file&&(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024)){
      setError('Envie uma logo PNG, JPG ou WebP de até 5 MB.');return;
    }
    setUploadingLogo(true);setError('');
    try{
      const path=`/api/crm/site-projects/${encodeURIComponent(crmProjectId)}`;
      let logoRef:{assetId:string;alt:string;focalX:number;focalY:number}|null=null;
      if(file){
        const form=new FormData();
        form.append('file',file);
        form.append('altText','Logo de '+project.name);
        const uploaded=await fetch(path+'/assets',{method:'POST',credentials:'same-origin',body:form});
        const media=await uploaded.json().catch(()=>({})) as {
          asset?:{id:string;url?:string};error?:{message?:string};
        };
        if(!uploaded.ok||!media.asset?.id){
          throw new Error(media.error?.message||'Falha ao enviar a logo.');
        }
        logoRef={assetId:media.asset.id,alt:'Logo de '+project.name,focalX:0.5,focalY:0.5};
      }
      const stored=await fetch(path+'/config',{credentials:'same-origin',cache:'no-store'});
      const data=await stored.json().catch(()=>({})) as {
        config?:{navigation?:{logo?:unknown};[key:string]:unknown};
        lockVersion?:number;error?:{message?:string};
      };
      if(!stored.ok||!data.config||typeof data.lockVersion!=='number'){
        throw new Error(data.error?.message||'Não foi possível carregar a versão do site.');
      }
      const nextConfig={...data.config,navigation:{
        ...data.config.navigation,
        logo:logoRef,
      }};
      const saved=await fetch(path+'/config',{
        method:'PATCH',credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({config:nextConfig,expectedLockVersion:data.lockVersion}),
      });
      const reply=await saved.json().catch(()=>({})) as {error?:{message?:string}};
      if(!saved.ok)throw new Error(reply.error?.message||
        'O site foi alterado em outra guia. Atualize antes de reenviar a logo.');
      const preview=await fetch(path+'/render',{credentials:'same-origin',cache:'no-store'});
      if(!preview.ok)throw new Error(`Logo salva, mas a prévia não abriu (HTTP ${preview.status}). Reabra o projeto.`);
      setCrmPreviewHtml(await preview.text());
    }catch(cause){setError(cause instanceof Error?cause.message:'Falha ao atualizar a logo.');}
    finally{setUploadingLogo(false);}
  }

  function openPreviewInNewTab() {
    if (!project?.pages[activePage]) return;

    // A nova aba recebe a mesma renderizacao do editor, mas sem a camada de
    // edicao inline. Isso evita publicar ou duplicar dados so para visualizar.
    const html = appendExtraSections(crmPreviewHtml || renderSitePreview(project, activePage),project.extraSections?.[activePage]);
    const config = JSON.stringify({
      version: 1,
      page: activePage,
      pages: project.liveEdits || {},
      images: {
        portrait: project.institutional?.portrait || "",
        businessPhoto: project.institutional?.businessPhoto || project.institutional?.workPhoto || "",
      },
    }).replace(/</g, "\\u003c");
    const overlay = '<script>window.__PAGENOVA_PUBLISHED_OVERLAY__=' + config +
      ';</' + 'script><script src="' + window.location.origin +
      '/pagenova-published-overlay.js" defer></' + 'script>';
    const withEdits = /<\/body>/i.test(html)
      ? html.replace(/<\/body>/i, overlay + "</body>")
      : html + overlay;
    const blob = new Blob([withEdits], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    // With the noopener feature, window.open() may return null EVEN WHEN the
    // browser opened the tab. A real anchor preserves noopener without a
    // misleading "popup blocked" error for successful previews.
    const link=document.createElement("a");
    link.href=url;link.target="_blank";link.rel="noopener noreferrer";
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function readPublicationResponse(response: Response, stage: string): Promise<{ url?: string; error?: string | { message?: string } }> {
    const raw = await response.text();
    let data: { url?: string; error?: string | { message?: string } } = {};
    try { data = JSON.parse(raw) as typeof data; }
    catch {
      const detail = raw.replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim().slice(0, 180);
      throw new Error(stage + " falhou (HTTP " + response.status + "). O servidor retornou texto em vez de JSON: " + (detail || response.statusText || "resposta vazia"));
    }
    if (!response.ok) {
      const message = typeof data.error === "string" ? data.error : data.error?.message;
      throw new Error(stage + " falhou (HTTP " + response.status + "): " + (message || "Erro no servidor."));
    }
    return data;
  }

  async function optimizePublicationImage(source: string): Promise<string> {
    if (!source.startsWith("data:image/")) return source;
    const image = new Image();
    image.src = source;
    await image.decode();
    const maxSide = 1400;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a imagem para publicação.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let output = canvas.toDataURL("image/webp", 0.76);
    if (output.length > 950_000) {
      const shrink = Math.sqrt(950_000 / output.length);
      const smaller = document.createElement("canvas");
      smaller.width = Math.max(1, Math.round(canvas.width * shrink));
      smaller.height = Math.max(1, Math.round(canvas.height * shrink));
      smaller.getContext("2d")?.drawImage(canvas, 0, 0, smaller.width, smaller.height);
      output = smaller.toDataURL("image/webp", 0.68);
    }
    if (output.length > 1_500_000) throw new Error("Imagem grande demais para publicação. Envie uma imagem menor.");
    return output;
  }

  async function publishSite() {
    if (!project?.pages.home || publishing) return;
    setPublishing(true);
    setError("");
    try {
      // Await pending edits without re-saving a possibly older React snapshot.
      await waitForPageNovaProjectSaves(project.id);
      if (crmProjectId) {
        const response = await fetch(`/api/crm/site-projects/${crmProjectId}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ acknowledgedWarnings: true }),
        });
        const data = await readPublicationResponse(response, "Publicação no Railway");
        if (!data.url) throw new Error("O Railway não retornou o endereço do site publicado.");
        // Publication already exists upstream. Keep its address visible even
        // if the subsequent overlay sync fails; do not report a false total failure.
        setPublishedUrl(data.url);
        // The Railway publication contains the original generated HTML.
        // Persist the visual editor overlay before reporting publication success.
        const overlayResponse = await fetch("/api/builder/published-overlay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            url: data.url,
            project: {
              id: project.id,
              kind: project.kind,
              liveEdits: project.liveEdits || {},
              extraSections: project.extraSections || {},
              institutional: {
                portrait: await optimizePublicationImage(project.institutional?.portrait || ""),
                businessPhoto: await optimizePublicationImage(project.institutional?.businessPhoto || project.institutional?.workPhoto || ""),
              },
            },
          }),
        });
        const overlayResult = await readPublicationResponse(overlayResponse, "Site publicado, mas a sincronização das imagens e edições");
        if (!overlayResponse.ok) {
          throw new Error(typeof overlayResult.error === "string" ? overlayResult.error : overlayResult.error?.message || "Site publicado, mas as edições visuais não foram sincronizadas.");
        }
        const publicUrl = overlayResult.url || data.url;
        setPublishedUrl(publicUrl);
        window.open(publicUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const response = await fetch("/api/builder/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });
      const data = await readPublicationResponse(response, "Publicação do site");
      if (!data.url) throw new Error("A publicação não retornou o endereço do site.");
      setPublishedUrl(data.url);
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel publicar o site.");
    } finally {
      setPublishing(false);
    }
  }

  return <>
    {project && <AppHeader title="Criar Site com IA" description="Revise o resultado e converse com a IA." align="center" />}
    <main className="mx-auto max-w-[1800px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp"
        className="hidden" aria-label="Selecionar logo do site"
        onChange={event=>{const file=event.target.files?.[0];if(file)void changeBrandLogo(file);event.target.value='';}} />
      <input ref={inlineImageInputRef} type="file" accept="image/png,image/jpeg,image/webp"
        className="hidden" aria-label="Selecionar imagem do site"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadSiteImage(file, inlineImageKindRef.current);
          event.target.value = "";
        }} />
      {!project && <div className="mx-auto flex min-h-[calc(100svh-215px)] max-w-5xl flex-col justify-center py-3 sm:py-10">
        <div className="mx-auto mb-6 max-w-3xl text-center sm:mb-8">
          <span className="text-[10px] font-bold uppercase tracking-[.14em] text-emerald-400 sm:text-xs sm:tracking-[.18em]">PageNova AI · Criação inteligente</span>
          <h1 className="mx-auto mt-3 max-w-2xl text-[30px] font-bold leading-[1.12] tracking-tight sm:text-5xl">Conte o que você quer criar</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/65 sm:mt-4 sm:max-w-2xl sm:text-base">Descreva o que você imagina. A PageNova transforma suas palavras em um site.</p>
        </div>
        <form onSubmit={start} className="mx-auto w-full max-w-3xl space-y-3 sm:space-y-4">
          <div className="relative rounded-[24px] border border-white/15 bg-[#11101b] p-3.5 shadow-[0_16px_65px_rgba(0,0,0,.22)] transition-all focus-within:border-emerald-400/60 focus-within:shadow-[0_12px_48px_rgba(16,185,129,.08)] sm:rounded-[28px] sm:p-6">
            <label htmlFor="pagenova-brief" className="sr-only">Descreva sua ideia de site</label>
            <textarea id="pagenova-brief" ref={briefTextareaRef}
              value={brief}
              onChange={(event)=>{setBrief(event.target.value);if(error)setError("");}}
              rows={3} required
              placeholder="Ex.: Quero um site moderno para minha clínica, com serviços, fotos da equipe e agendamento..."
              className="block min-h-[138px] max-h-[290px] w-full resize-none overflow-y-auto border-0 bg-transparent px-2 pt-1 pb-14 text-base leading-7 text-white outline-none placeholder:text-white/45 sm:min-h-[155px] sm:pb-16"
            />
            <input ref={attachInputRef} type="file" multiple
              accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
              className="hidden" aria-label="Selecionar arquivos de referência"
              onChange={event=>{attachFiles(event.target.files);event.target.value="";}}/>
            <div className="absolute bottom-3.5 left-3.5 flex items-center gap-2 sm:bottom-4 sm:left-6">
              <button type="button" title="Adicionar fotos, logo, PDF ou briefing"
                aria-label="Anexar arquivos de referência" onClick={()=>attachInputRef.current?.click()}
                disabled={phase==="generating"}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/[.08] text-white transition hover:border-emerald-400/50 hover:bg-emerald-400/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:opacity-40">
                <Plus className="h-5 w-5"/>
              </button>
              <button type="button"
                title={isListening?"Parar ditado":isRequestingMicrophone?"Cancelar solicitação do microfone":"Falar e transcrever"}
                aria-label={isListening?"Parar transcrição por voz":isRequestingMicrophone?"Cancelar solicitação do microfone":"Iniciar transcrição de voz"}
                aria-pressed={speechStatus!=="idle"} onClick={toggleDictation} disabled={phase==="generating"}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition disabled:opacity-40 ${
                  speechStatus!=="idle"?"border-red-400/60 bg-red-400/15 text-red-300 animate-pulse":"border-white/20 bg-white/[.08] text-white hover:border-emerald-400/50 hover:bg-emerald-400/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
                }`}>
                {speechStatus!=="idle"?<MicOff className="h-5 w-5"/>:<Mic className="h-5 w-5"/>}
              </button>
              {isRequestingMicrophone&&<span role="status" className="text-xs font-semibold text-amber-300">Aguardando permissão...</span>}
              {isListening&&<span role="status" className="text-xs font-semibold text-red-300">Ouvindo...</span>}
            </div>
          </div>
          {attachments.length>0&&<div className="flex flex-wrap gap-2">
            {attachments.map((file,index)=><span key={index} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[.055] px-3 py-2 text-xs text-emerald-200">
              <Paperclip className="h-3.5 w-3.5 shrink-0"/>
              <span className="max-w-[230px] truncate">{file.name}</span>
              <button type="button" aria-label={"Remover "+file.name} onClick={()=>setAttachments(items=>items.filter((_,i)=>i!==index))}
                className="rounded p-0.5 hover:bg-emerald-400/15"><X className="h-3.5 w-3.5"/></button>
            </span>)}
          </div>}
          {attachmentWarning&&<p role="alert" className="text-sm text-amber-300">{attachmentWarning}</p>}
          <SiteGenerationCreditsNotice credits={siteCredits} />
          {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={phase==="generating" || siteCredits.exhausted}
            className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-base font-bold text-[#08130e] shadow-[0_8px_28px_rgba(16,185,129,.11)] transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">
            {phase==="generating"?<><LoaderCircle className="h-5 w-5 animate-spin"/> Gerando site...</>:"Gerar site com IA →"}
          </button>
          <fieldset className="rounded-2xl border border-white/10 bg-white/[0.018] p-3.5 sm:p-5">
            <legend className="px-2 text-sm font-semibold text-white/85">Escolha o modelo</legend>
            <p className="mb-3 text-xs leading-5 text-white/50">A IA adapta o modelo ao seu negócio.</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3">
              <button type="button" aria-pressed={templateId==="frigolog-universal"}
                onClick={()=>setTemplateId("frigolog-universal")}
                className={`flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl border p-2.5 text-left transition hover:-translate-y-0.5 sm:block focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 ${
                  templateId==="frigolog-universal"?"border-emerald-400 bg-emerald-400/[0.08]":"border-white/15 bg-black/15 hover:border-emerald-400/30"
                }`}>
                <div aria-hidden="true" className="flex h-[68px] w-[108px] shrink-0 flex-col overflow-hidden rounded-lg bg-[#f4f7f5] p-2 sm:h-[100px] sm:w-full">
                  <div className="flex items-center justify-between"><span className="h-1.5 w-9 rounded bg-[#0e5e50]"/><span className="h-1 w-4 rounded bg-[#889a90]"/></div>
                  <div className="mt-2 flex flex-1 gap-2">
                    <div className="flex w-[55%] flex-col gap-1"><span className="h-2 w-full rounded bg-[#0e5e50]"/><span className="h-2 w-4/5 rounded bg-[#0e5e50]"/><span className="mt-1 h-1 w-[95%] rounded bg-[#8ca49d]"/><span className="mt-1 h-2 w-1/2 rounded bg-[#17af86]"/></div>
                    <div className="flex-1 rounded bg-gradient-to-tr from-[#285e55] to-[#b4c3b8]"/>
                  </div>
                  <div className="mt-1 flex gap-1">{[0,1,2].map(x=><span key={x} className="h-2.5 flex-1 rounded-sm bg-[#d4ddd7]"/>)}</div>
                </div>
                <span className="min-w-0 flex-1 sm:mt-2">
                  <span className="block text-sm font-semibold">Modelo 1 · Original</span>
                  <span className="mt-1 block text-[11px] leading-4 text-white/50">Moderno, estrutura comercial e conversão.</span>
                </span>
              </button>
              <button type="button" aria-pressed={templateId==="muse-editorial"}
                onClick={()=>setTemplateId("muse-editorial")}
                className={`flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl border p-2.5 text-left transition hover:-translate-y-0.5 sm:block focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 ${
                  templateId==="muse-editorial"?"border-emerald-400 bg-emerald-400/[0.08]":"border-white/15 bg-black/15 hover:border-emerald-400/30"
                }`}>
                <div aria-hidden="true" className="flex h-[68px] w-[108px] shrink-0 flex-col overflow-hidden rounded-lg bg-[#faf9f6] p-2 sm:h-[100px] sm:w-full">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-black tracking-tighter text-[#272522]">muse<span className="text-[#df321e]">.</span></span><span className="h-1 w-4 rounded bg-[#777]"/></div>
                  <div className="mt-1 flex items-end justify-between gap-1"><span className="text-[15px] font-black leading-none tracking-tighter text-[#242424] sm:text-[27px]">forma<span className="text-[#df321e]">.</span></span><span className="mb-0.5 h-3 w-[38%] rounded-sm bg-[#c7c4bd]"/></div>
                  <div className="mt-1 flex-1 rounded-sm bg-gradient-to-br from-[#6b756c] via-[#b5ae99] to-[#e3dac4]"/>
                  <div className="mt-1 flex gap-1"><span className="h-2 w-1/2 bg-[#d7d2c8]"/><span className="h-2 w-1/3 bg-[#c2b6a5]"/></div>
                </div>
                <span className="min-w-0 flex-1 sm:mt-2">
                  <span className="block text-sm font-semibold">Modelo 2 · Editorial</span>
                  <span className="mt-1 block text-[11px] leading-4 text-white/50">Muse: tipografia marcante e portfólio visual.</span>
                </span>
              </button>
              <button type="button" aria-pressed={templateId==="atelier-norte"}
                onClick={()=>setTemplateId("atelier-norte")}
                className={`flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl border p-2.5 text-left transition hover:-translate-y-0.5 sm:block focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 ${templateId==="atelier-norte"?"border-emerald-400 bg-emerald-400/[0.08]":"border-white/15 bg-black/15 hover:border-emerald-400/30"}`}>
                <div aria-hidden="true" className="flex h-[68px] w-[108px] shrink-0 flex-col overflow-hidden rounded-lg bg-[#f5f0e7] p-2 sm:h-[100px] sm:w-full">
                  <span className="text-[10px] font-semibold tracking-tight text-[#38302a]">atelier <i className="font-serif font-normal text-[#ba684e]">norte</i></span>
                  <span className="mt-1 font-serif text-[13px] leading-none text-[#38302a] sm:mt-2 sm:text-[26px]">Design <i className="text-[#ba684e]">com alma.</i></span>
                  <div className="mt-1 flex flex-1 gap-1"><span className="w-3/5 rounded-sm bg-[#c0ad99]"/><span className="flex-1 rounded-sm bg-[#e2d3c0]"/></div>
                  <div className="mt-1 h-1.5 rounded bg-[#d0bdab]"/>
                </div>
                <span className="min-w-0 flex-1 sm:mt-2">
                  <span className="block text-sm font-semibold">Modelo 3 · Atelier Norte</span>
                  <span className="mt-1 block text-[11px] leading-4 text-white/50">Institucional sofisticado, fundo claro e terracota.</span>
                </span>
              </button>
              <button type="button" aria-pressed={templateId==="vertice-corporate"}
                onClick={()=>setTemplateId("vertice-corporate")}
                className={`flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl border p-2.5 text-left transition hover:-translate-y-0.5 sm:block focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 ${templateId==="vertice-corporate"?"border-emerald-400 bg-emerald-400/[0.08]":"border-white/15 bg-black/15 hover:border-emerald-400/30"}`}>
                <div aria-hidden="true" className="flex h-[68px] w-[108px] shrink-0 flex-col overflow-hidden rounded-lg bg-[#f4f7f2] p-2 sm:h-[100px] sm:w-full">
                  <div className="flex items-center justify-between"><span className="text-[10px] font-black tracking-tight text-[#214734]">✦ vértice.</span><span className="h-1 w-5 rounded bg-[#9fb7a5]"/></div>
                  <div className="mt-2 flex flex-1 items-center gap-1.5"><div className="w-[63%] space-y-1"><span className="block h-2 w-4/5 rounded-sm bg-[#27573e]"/><span className="block h-2 w-full rounded-sm bg-[#27573e]"/><span className="block h-1 w-2/3 rounded-sm bg-[#9aae9e]"/><span className="block h-2 w-1/2 rounded-sm bg-[#27573e]"/></div><div className="h-full flex-1 rounded-sm bg-gradient-to-br from-[#d9e2db] to-[#648c74]"/></div>
                  <div className="mt-1 flex gap-1">{[0,1,2].map(n=><span key={n} className="h-2 flex-1 rounded-sm bg-[#d2ddd4]"/>)}</div>
                </div>
                <span className="min-w-0 flex-1 sm:mt-2">
                  <span className="block text-sm font-semibold">Modelo 4 · Vértice</span>
                  <span className="mt-1 block text-[11px] leading-4 text-white/50">Corporativo claro, verde institucional e fotografia ampla.</span>
                </span>
              </button>
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-white/85">Ponto de partida <span className="font-normal text-white/45">(opcional)</span></legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STARTING_POINTS.map((option) => (
                <button type="button" key={option.id} aria-pressed={selectedPresetId === option.id}
                  onClick={() => setSelectedPresetId(option.id)}
                  className={`flex min-h-[96px] flex-col items-start rounded-xl border p-3 text-left transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-emerald-400 sm:min-h-[108px] ${
                    selectedPresetId === option.id ? "border-emerald-400 bg-emerald-400/[.09] shadow-[0_0_0_1px_rgba(16,185,129,.1)]" : "border-white/15 bg-white/[.018] hover:border-emerald-400/30 hover:bg-white/[.045]"
                  }`}>
                  <span className="text-lg sm:text-xl" aria-hidden="true">{option.icon}</span>
                  <span className="mt-1.5 text-sm font-semibold sm:mt-2">{option.title}</span>
                  <span className="mt-1 text-[11px] leading-4 text-white/50">{option.description}</span>
                </button>
              ))}
            </div>
          </fieldset>
          {templateId === "frigolog-universal" && (effectivePresetId === "restaurante" || effectivePresetId === "imobiliaria") && (
            <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.045] px-3 py-2 text-xs leading-5 text-emerald-100/80">
              ✦ Estrutura especializada selecionada automaticamente: {effectivePresetId === "restaurante" ? "Restaurante" : "Imobiliária"}. Para usar outro visual, escolha um dos modelos acima.
            </p>
          )}
          <details className="rounded-xl border border-white/10 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-white/75">Estilo visual (opcional)</summary>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["automatico", "moderno", "elegante", "vibrante"].map((item) => (
                <label key={item} className={`cursor-pointer rounded-xl border px-2 py-3 text-center text-sm capitalize ${
                  style === item ? "border-emerald-400 bg-emerald-400/10" : "border-white/10 text-white/65"
                }`}>
                  <input type="radio" name="style" value={item} checked={style === item}
                    onChange={() => setStyle(item)} className="sr-only" />
                  {item === "automatico" ? "IA decide" : item}
                </label>
              ))}
            </div>
          </details>
        </form>
      </div>}

      {project && phase==="generating" && crmProjectId && !crmPreviewHtml && (
        <section className="mx-auto max-w-3xl rounded-[28px] border border-emerald-400/25 bg-[#0e1512] px-5 py-9 shadow-[0_22px_70px_rgba(0,0,0,.25)] sm:px-10 sm:py-12"
          role="region" aria-label="Acompanhamento da geração do site">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/[.12] text-emerald-300">
            <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden="true" />
          </div>
          <div className="mt-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[.19em] text-emerald-300">PageNova AI · Criando seu site</p>
            <h2 className="mt-3 break-words text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h2>
            <p className="mt-3 text-sm leading-6 text-white/55">As etapas abaixo vêm diretamente do servidor. Pode levar alguns minutos, especialmente ao gerar imagens.</p>
          </div>
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/25 p-5 sm:p-6" role="status" aria-live="polite">
            <div className="flex items-end justify-between gap-4">
              <p className="text-sm font-semibold text-emerald-200">{generationProgress.label}</p>
              <span className="shrink-0 text-4xl font-bold tabular-nums tracking-tight text-white">{generationProgress.percent}<span className="text-xl text-white/45">%</span></span>
            </div>
            <div role="progressbar" aria-label="Progresso da criação do site" aria-valuemin={0} aria-valuemax={100}
              aria-valuenow={generationProgress.percent}
              className="mt-4 h-3 overflow-hidden rounded-full bg-white/[.10]">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-[width] duration-500"
                style={{width:`${generationProgress.percent}%`}}/>
            </div>
            <div className="mt-4 grid grid-cols-10 gap-1.5" aria-hidden="true">
              {REAL_GENERATION_STAGES.map(item=><div key={item.id} className={`h-1.5 rounded-full ${
                generationProgress.percent>=item.percent?"bg-emerald-400":"bg-white/10"
              }`}/>)}
            </div>
            <p className="mt-5 text-xs leading-5 text-white/45">
              O percentual representa etapas concluídas, não tempo decorrido. Se uma etapa demorar mais, a barra aguardará a confirmação do servidor.
            </p>
          </div>
          <p className="mt-5 text-center text-xs text-white/40">O projeto foi salvo automaticamente. Você pode voltar depois pela guia Meus sites sem iniciar outra geração.</p>
        </section>
      )}
      {project && !(phase==="generating" && crmProjectId && !crmPreviewHtml) && <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="space-y-5 rounded-[24px] border border-white/10 bg-[#0d1110] p-5 text-center shadow-[0_18px_60px_rgba(0,0,0,.22)] xl:sticky xl:top-4 xl:max-h-[calc(100vh-32px)] xl:overflow-auto">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">PageNova AI</span>
            <div className="mt-3 flex flex-col items-center justify-center gap-3">
              <h2 className="w-full break-words text-xl font-bold">{project.name}</h2>
              {crmProjectId&&phase!=="generating"&&<details className="w-full max-w-xs rounded-xl border border-emerald-400/25 bg-emerald-400/[.05] p-2 text-sm">
                <summary className="cursor-pointer select-none rounded-lg px-3 py-2 font-semibold text-emerald-200">✎ Personalizar logo</summary>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={()=>logoInputRef.current?.click()} disabled={uploadingLogo||publishing||switchingTemplate}
                    className="min-h-11 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{uploadingLogo?"Enviando...":"Trocar logo"}</button>
                  <button type="button" onClick={()=>{setEditingBrand(true);setBrandDraft(project.name==="Novo projeto"?"":project.name);}}
                    className="min-h-11 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white">Escrever logo</button>
                  <button type="button" onClick={()=>{if(window.confirm("Remover a logo personalizada e exibir o nome da empresa?"))void changeBrandLogo(null);}}
                    disabled={uploadingLogo||publishing||switchingTemplate}
                    className="min-h-11 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/65 disabled:opacity-40">Remover logo</button>
                </div>
              </details>}
            </div>
            {editingBrand&&<form onSubmit={event=>{event.preventDefault();void saveProjectBrand();}}
              className="mt-3 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-emerald-400/25 bg-black/20 p-3">
              <label htmlFor="pagenova-edit-brand" className="w-full text-xs text-white/70">
                Nome que substituirá a logo no site (sem gerar novamente)
              </label>
              <input id="pagenova-edit-brand" type="text" required minLength={3} maxLength={72}
                value={brandDraft} onChange={event=>setBrandDraft(event.target.value)}
                placeholder="Ex.: Nathalia Ferreira Psicóloga"
                className="w-full min-w-0 rounded-lg border border-white/20 bg-[#101514] px-3 py-2 text-center text-sm text-white outline-none focus:border-emerald-400"/>
              <button type="submit" disabled={savingBrand}
                className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-[#08130e] disabled:opacity-50">
                {savingBrand?"Salvando...":"Aplicar texto na logo"}
              </button>
            </form>}
            <p className="mt-2 text-sm text-white/50">{phase==="generating"?"Criando seu site…":phase==="ready"?"Site pronto para revisão.":"A criação foi interrompida."}</p>
          </div>
          <form id="pagenova-revision-form" onSubmit={revise} className="space-y-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[.04] p-4">
            <label htmlFor="builder-change" className="block text-sm font-semibold text-emerald-200">✨ Converse com a IA</label>
            <p className="mx-auto max-w-[40ch] text-xs leading-5 text-white/50">Peça mudanças em textos, cores e seções. Ajustes simples podem ser feitos sem nova geração.</p>
            <textarea id="builder-change" value={instruction} onChange={event=>setInstruction(event.target.value)}
              onPaste={pasteRevisionImage} rows={4}
              placeholder="Ex.: Deixe os títulos mais diretos e melhore os serviços."
              className="w-full rounded-xl border border-white/15 bg-black/30 p-3 text-left text-sm outline-none focus:border-emerald-400" />
            <button type="submit" disabled={!project.pages[activePage]||phase==="generating"||(!instruction.trim()&&!revisionImage)}
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-[#08130e] disabled:opacity-40">
              {phase==="generating"?"Aguarde a geração":"Enviar instrução →"}
            </button>
            {revisionImage&&<button type="button" onClick={()=>setRevisionImage("")} className="text-xs text-emerald-300">Remover print anexado</button>}
            {revisionImageError&&<p role="alert" className="text-xs text-red-300">{revisionImageError}</p>}
          </form>
          {crmProjectId ? (
            <div role="status" className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/70">
              <p className="font-semibold text-white">Status da criação</p>
              <p className="mt-2">{phase==="ready" ? "Site gerado e pronto para revisão." :
                phase==="error" ? "A geração precisa de atenção. O projeto foi mantido." :
                "Acompanhando as etapas no servidor. Aguarde a confirmação."}</p>
            </div>
          ) : (
            <ol className="space-y-2" aria-label="Páginas do projeto">{SITE_PAGES.map(({key,label})=>(
              <li key={key} className="rounded-xl border border-white/10 px-3 py-2 text-sm">
                {label} · {project.pages[key]?"Disponível":"Pendente"}
              </li>
            ))}</ol>
          )}
          {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          {phase==="error"&&crmProjectId&&<button type="button" onClick={()=>void monitorCrmGeneration(crmProjectId)}
            className="w-full rounded-xl border border-emerald-400/40 px-4 py-3 font-semibold text-emerald-200">
            Verificar geração existente
          </button>}
          <p className="mx-auto max-w-[46ch] text-xs text-white/35">Projeto salvo. Use a prévia em nova aba para revisar o site antes da publicação.</p>
        </aside>
        <section className="min-w-0 overflow-hidden rounded-[26px] border border-white/10 bg-[#0d1110] shadow-[0_22px_80px_rgba(0,0,0,.28)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4"><div className="flex flex-wrap gap-2">{SITE_PAGES.map(({ key, label }) => <button key={key} onClick={() => setActivePage(key)} disabled={!project.pages[key]} className={`rounded-lg px-3 py-2 text-sm disabled:opacity-30 ${activePage === key ? "bg-emerald-400 text-black" : "bg-white/5 text-white/70"}`}>{label}</button>)}</div><span className="text-xs text-white/40">Duplo clique no texto para editar</span></div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-3">
            <label className="flex min-w-0 max-w-full flex-wrap items-center gap-2 text-xs text-white/70"><span>Estilo do site</span><select aria-label="Template visual do site" value={project.templateId || "frigolog-universal"} onChange={(e) => void changeSiteTemplate(e.target.value as SiteTemplateId)} disabled={!crmProjectId||phase==="generating"||switchingTemplate||publishing} className="min-w-0 max-w-full rounded-lg bg-white/10 p-2 text-white disabled:opacity-50"><option className="text-black" value="frigolog-universal">Modelo 1 · Original</option><option className="text-black" value="muse-editorial">Modelo 2 · Muse Editorial</option><option className="text-black" value="atelier-norte">Modelo 3 · Atelier Norte</option><option className="text-black" value="vertice-corporate">Modelo 4 · Vértice Corporativo</option><option className="text-black" value="restaurant-premium">Restaurante · Especializado</option><option className="text-black" value="real-estate-premium">Imobiliária · Especializado</option></select>{switchingTemplate&&<span role="status" className="ml-2 text-emerald-300">Aplicando modelo...</span>}</label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1" role="group" aria-label="Tamanho da prévia">{(["desktop", "tablet", "celular"] as const).map((mode) => <button type="button" key={mode} aria-pressed={viewport === mode} onClick={() => setViewport(mode)} className={`rounded-lg px-3 py-2 text-xs capitalize ${viewport === mode ? "bg-emerald-400 text-black" : "bg-white/10 text-white"}`}>{mode}</button>)}</div>
              <button type="button" disabled={!project.pages[activePage]} onClick={openPreviewInNewTab} className="rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:opacity-40">
                Abrir prévia em nova aba ↗
              </button>
              <button type="button" disabled={!project.pages.home || publishing || phase === "generating" || switchingTemplate} onClick={() => void publishSite()} className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-[#08130e] transition hover:bg-emerald-300 disabled:opacity-40">
                {publishing ? "Publicando..." : publishedUrl ? "Atualizar publicação" : "Publicar site"}
              </button>
              {publishedUrl ? <a href={publishedUrl} target="_blank" rel="noreferrer" className="max-w-[280px] truncate rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 hover:text-white" title={publishedUrl}>Ver site publicado ↗</a> : null}
              {costDebugEnabled && crmProjectId ? <button type="button" onClick={() => { setCostPanelOpen((value) => !value); void refreshCost(crmProjectId); void refreshCostAudit(crmProjectId); }} className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200">🔒 Custo IA</button> : null}
            </div>
            {costDebugEnabled && costPanelOpen && crmProjectId ? <div className="w-full rounded-xl border border-amber-400/25 bg-black/40 p-4 text-xs text-white/75" role="region" aria-label="Diagnóstico de custo da IA"><p className="font-semibold text-amber-200">Custo estimado acumulado pelo backend</p><p className="mt-2 text-xl font-bold text-white">{costInfo ? `US$ ${Number(costInfo.costAccumulatedUsd).toFixed(6)}` : "Consultando..."}</p><p className="mt-1">Status: {costInfo?.status || "Aguardando"} · Projeto: {crmProjectId}</p><p className="mt-2 text-white/50">Valor acumulado registrado no banco para este projeto. Pode incluir regenerações e edições. Não representa cobrança auditada nem discrimina tokens.</p>{costError ? <p className="mt-2 text-red-300">{costError}</p> : null}<button type="button" onClick={() => void refreshCost(crmProjectId)} className="mt-3 rounded-lg border border-white/20 px-3 py-2">Atualizar custo</button><div className="mt-4 border-t border-white/10 pt-3"><p className="font-semibold text-amber-200">Chamadas registradas: {costUsage.length}</p>{costAuditError ? <p className="mt-2 text-amber-300">{costAuditError}</p> : null}{costUsage.map((item) => <div key={item.id} className="mt-2 rounded-lg border border-white/10 p-3"><div className="flex flex-wrap justify-between gap-2"><strong>{item.operation}</strong><span>{item.status}</span></div><p className="mt-1">Modelo: {item.model}</p><p>Entrada: {item.inputTokens.toLocaleString("pt-BR")} tokens · Saída: {item.outputTokens.toLocaleString("pt-BR")} tokens</p><p className="font-semibold text-white">US$ {Number(item.costActualUsd ?? item.costEstimatedUsd ?? 0).toFixed(6)} {item.costActualUsd ? "(real informado)" : "(estimado)"}</p></div>)}</div></div> : null}
            {error && <div role="alert" className="mt-3 w-full rounded-lg border border-red-400/40 bg-red-950/40 px-3 py-3 text-sm text-red-100">{error}</div>}
            {publishing && <p role="status" className="mt-2 w-full text-sm font-medium text-emerald-300">Publicando no Railway e sincronizando as edições. Aguarde…</p>}
          </div>
          {project.pages[activePage]&&phase!=="generating"&&
          <div className="border-b border-white/10 px-3 py-3 sm:px-4">
            <button type="button" onClick={()=>setSectionPickerOpen(open=>!open)} aria-expanded={sectionPickerOpen}
              disabled={addingSection||publishing}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-200 active:scale-[.98] disabled:opacity-50">
              <span aria-hidden="true" className="text-lg">＋</span> Adicionar seção
            </button>
            {sectionPickerOpen&&<div role="dialog" aria-label="Escolher uma seção" className="mt-3 w-full max-w-md rounded-2xl border border-emerald-400/25 bg-[#142019] p-3 shadow-xl">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-white">Adicionar ao site</span>
                <button type="button" onClick={()=>setSectionPickerOpen(false)} aria-label="Fechar opções de seção" className="rounded-lg border border-white/15 px-3 py-2 text-xs">Fechar ✕</button>
              </div>
              <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto overscroll-contain sm:grid-cols-3">
                {EXTRA_SECTION_OPTIONS.map(item=><button type="button" key={item.kind} onClick={()=>void addExtraSection(item.kind)}
                  className="min-h-12 rounded-xl border border-white/10 bg-white/[.05] px-2 py-3 text-center text-xs font-semibold text-white/85 active:bg-emerald-400/20 hover:border-emerald-400/35">
                  {item.label}
                </button>)}
              </div>
              <p className="mt-3 text-[11px] leading-5 text-white/45">A seção será adicionada ao final. Em “Organizar seções” você poderá escolher entre quais partes originais ela aparece. Sem nova geração de IA.</p>
            </div>}
          </div>}
          <input ref={sectionImageInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label="Selecionar imagem da seção" onChange={event=>{const file=event.target.files?.[0];event.target.value="";if(file)void uploadExtraSectionImage(file);}}/>
          {!!project.extraSections?.[activePage]?.length&&
          <div className="border-b border-white/10 px-3 pb-3 sm:px-4" aria-label="Organizar seções adicionais">
            <details className="group max-w-lg rounded-xl border border-white/10 bg-white/[.03] p-3">
              <summary className="cursor-pointer select-none text-sm font-semibold text-white/80">Organizar seções adicionadas ({project.extraSections[activePage]?.length})</summary>
              <p className="mt-2 text-xs text-white/50">Escolha onde cada seção extra aparece entre as seções originais. As setas movem a seção para cima ou para baixo no site, inclusive entre as partes do template. O conteúdo original permanece intacto.</p>
              <ol className="mt-3 space-y-2">
                {project.extraSections[activePage]?.map((item,index,list)=><li key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 p-2">
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-white/85">{index+1}. {item.title}</span>
                  <select aria-label={`Posição de ${item.title} entre seções do site`} disabled={addingSection||publishing}
                    value={Math.min(originalSections,Math.max(0,item.slot??originalSections))}
                    onChange={event=>void changeExtraSectionSlot(index,Number(event.target.value))}
                    className="max-w-[132px] min-w-0 rounded-lg border border-white/15 bg-[#1b2920] px-1 py-2 text-[11px] text-white sm:max-w-[190px]">
                    {Array.from({length:originalSections+1},(_,slot)=><option key={slot} value={slot}>
                      {slot===0?"Antes da 1ª":slot===originalSections?"Final da página":`Após seção ${slot}`}
                    </option>)}
                  </select>
                  {["image","image-left","image-right","image-top"].includes(item.kind)&&
                   <button type="button" disabled={addingSection||publishing} onClick={()=>{setSectionUploadId(item.id);sectionImageInputRef.current?.click();}}
                     className="min-h-10 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2 text-[11px] font-semibold text-emerald-200 disabled:opacity-50">
                     {item.imageUrl?"Trocar foto":"Enviar foto"}
                   </button>}
                  <div className="flex shrink-0 gap-1">
                    <button type="button" disabled={(index===0&&(item.slot??originalSections)===0)||addingSection||publishing} onClick={()=>void moveExtraSection(index,-1)} aria-label={`Subir seção ${item.title}`} className="min-h-10 min-w-10 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2 text-sm font-bold text-emerald-200 disabled:opacity-30">↑</button>
                    <button type="button" disabled={(index===list.length-1&&(item.slot??originalSections)>=originalSections)||addingSection||publishing} onClick={()=>void moveExtraSection(index,1)} aria-label={`Descer seção ${item.title}`} className="min-h-10 min-w-10 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2 text-sm font-bold text-emerald-200 disabled:opacity-30">↓</button>
                    <button type="button" disabled={addingSection||publishing} onClick={()=>void deleteExtraSection(item.id,item.title)} aria-label={`Excluir seção ${item.title}`} title="Excluir seção" className="flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-red-400/30 bg-red-400/10 text-red-300 disabled:opacity-30 hover:bg-red-400/20">
                      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v7m4-7v7"/></svg>
                    </button>
                  </div>
                  {["image","image-left","image-right","image-top"].includes(item.kind)&&
                    <details className="w-full">
                      <summary className="cursor-pointer text-xs text-emerald-200">Editar texto da seção</summary>
                      <form className="mt-2 grid gap-2" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);void updateExtraSection(item.id,{title:String(data.get("title")||""),body:String(data.get("body")||"")});}}>
                        <input name="title" defaultValue={item.title} maxLength={180} aria-label="Título da seção" className="min-h-10 w-full rounded-lg border border-white/15 bg-[#1b2920] px-3 text-sm"/>
                        <textarea name="body" defaultValue={item.body} maxLength={1800} rows={2} aria-label="Descrição da seção" className="w-full rounded-lg border border-white/15 bg-[#1b2920] p-3 text-sm"/>
                        <button disabled={addingSection} type="submit" className="min-h-10 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-black">Salvar texto</button>
                      </form>
                    </details>}
                </li>)}
              </ol>
            </details>
          </div>}
          {preview ? (() => {
            const virtualWidth = viewport === "desktop" ? 1440 : viewport === "tablet" ? 768 : 390;
            const available = Math.max(280, previewStageWidth - 32);
            const scale = Math.min(1, available / virtualWidth);
            const visibleHeight = Math.round(900 * scale);
            return <div ref={previewStageRef} className="relative overflow-hidden bg-[#090d0c] p-4 sm:p-6">
              <div className="mx-auto overflow-hidden rounded-[22px] border border-white/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,.42)]" style={{ width: virtualWidth * scale, height: visibleHeight }}>
                <iframe ref={previewRef} key={activePage + project.pages[activePage]?.heading + (project.previewTheme || "original") + (project.templateId || "frigolog-universal") + viewport} title={`Prévia de ${activePage} em ${viewport}`} sandbox="allow-scripts allow-forms allow-downloads" srcDoc={preview}
                  style={{ width: virtualWidth, height: 900, transform: `scale(${scale})`, transformOrigin: "top left", border: 0 }}
                  className="block bg-white" />
              </div>
              <div className="pointer-events-none mt-3 text-center text-[10px] font-semibold uppercase tracking-[.16em] text-white/30">{viewport} · {virtualWidth}px · {Math.round(scale * 100)}%</div>
            </div>;
          })() : <div ref={previewStageRef} className="flex h-[720px] items-center justify-center bg-[#090d0c] text-white/40">Seu site aparecerá aqui quando a geração estiver concluída.</div>}
        </section>
      </div>}
    </main>
  </>;
}
