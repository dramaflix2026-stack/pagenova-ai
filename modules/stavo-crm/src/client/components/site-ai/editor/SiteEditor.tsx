/**
 * Editor visual (secao 15 da especificacao).
 *
 * O preview usa a MESMA `renderSite` que o servidor usa para publicar e para
 * exportar o ZIP -- e por isso que aqui ela roda dentro do navegador, sobre o
 * mesmo `SiteSchema` que este editor esta alterando. Nao existe um "renderer
 * de preview" e um "renderer de producao" com implementacoes que podem
 * divergir (secao 5.5).
 */
import { Grip, ImagePlus, Loader2, Monitor, Redo2, Smartphone, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { renderSite, type RenderContext } from '@site-kit/renderer/render-site';
import { SITE_RUNTIME_JS } from '@site-kit/interactions/runtime';
import { siteSchema, type SiteSchemaModel, type SiteSection } from '@site-kit/schemas/site-schema';
import { lintSite } from '@site-kit/utils/linter';
import { repairThemeContrast } from '@site-kit/themes/colors';
import { useHistoryState } from '../../../hooks/useHistoryState';
import {
  useAiEditSection,
  useCreateSiteVersion,
  useRestoreSiteVersion,
  useSaveSiteConfig,
  useSiteAiDiagnostics,
  useSiteAssets,
  useSiteDraftConfig,
  useSiteProject,
  useUploadSiteAsset,
  type SiteAssetSummary,
} from '../../../hooks/useSiteAi';
import { Badge, Button, Callout, LoadingBlock, Textarea } from '../../ui';
import { useToast } from '../../ui/Toast';
import { PublishPanel } from './PublishPanel';
import { mountCanvasHandles } from './inlineCanvasHandles';

const AUTOSAVE_DELAY_MS = 1200;
type InlineStyle = SiteSchemaModel['visualTextEdits'][number];
type PhotoSlot = 'hero' | 'about' | 'operation';
const PHOTO_ACCEPT = 'image/*,.heic,.heif,.avif,.tif,.tiff,.bmp';

interface SiteEditorProps {
  projectId: string;
}

export function SiteEditor({ projectId }: SiteEditorProps) {
  const toast = useToast();
  const draftQuery = useSiteDraftConfig(projectId);
  const diagnosticsQuery = useSiteAiDiagnostics();
  const projectQuery = useSiteProject(projectId);
  const assetsQuery = useSiteAssets(projectId);
  const uploadAsset = useUploadSiteAsset(projectId);
  const saveConfig = useSaveSiteConfig(projectId);
  const createVersion = useCreateSiteVersion(projectId);
  const restoreVersion = useRestoreSiteVersion(projectId);
  const aiEdit = useAiEditSection(projectId);

  const history = useHistoryState<SiteSchemaModel | null>(null);
  const latestConfigRef = useRef<SiteSchemaModel | null>(null);
  const [newAssets, setNewAssets] = useState<Record<string,SiteAssetSummary>>({});
  const [previewImageUrls, setPreviewImageUrls] = useState<Record<string,string>>({});
  const temporaryUrlsRef = useRef<string[]>([]);
  const selectionCleanupRef = useRef<(() => void) | null>(null);
  const [previewRevision,setPreviewRevision] = useState(0);
  const previewDocumentCacheRef = useRef<{key:string; html:string}>({key:'',html:''});
  const [lockVersion, setLockVersion] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop',
  );
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'conflict'>('idle');
  const [conflictConfig, setConflictConfig] = useState<SiteSchemaModel | null>(null);
  const [aiInstruction, setAiInstruction] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const editElementRef = useRef<HTMLElement | null>(null);
  const originalTextRef = useRef('');
  const pendingStyleRef = useRef<InlineStyle | null>(null);
  const originalStyleRef = useRef('');
  const toolbarDragRef = useRef<{ pointerId:number; x:number; y:number; left:number; top:number } | null>(null);
  const pendingImageRef = useRef<{ sectionId: string; slot: PhotoSlot } | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingLogo,setUploadingLogo] = useState(false);
  const scrollRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const [inlineEditor, setInlineEditor] = useState<{ x: number; y: number; kind: 'text' | 'image' | 'block' } | null>(null);
  const [missingPreviewPhotos, setMissingPreviewPhotos] = useState<string[]>([]);

  const loadedRef = useRef(false);
  const skipNextAutosaveRef = useRef(false);
  const persistedDraftFingerprintRef = useRef<string | null>(null);
  const queuedDraftRef = useRef<SiteSchemaModel | null>(null);
  const serializedSaveRunningRef = useRef(false);
  const saveLockVersionRef = useRef(0);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => {
      if (media.matches) setViewport('mobile');
    };
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  // Carrega o rascunho UMA vez; depois disso o estado local e a autoridade
  // ate o proximo save/restauracao, para o editor nao sobrescrever a
  // digitacao do administrador com uma resposta de cache antiga.
  useEffect(() => {
    if (loadedRef.current || !draftQuery.data) return;
    const parsed = siteSchema.safeParse(draftQuery.data.config);
    if (parsed.success) {
      history.reset(parsed.data);
      setLockVersion(draftQuery.data.lockVersion);
      saveLockVersionRef.current = draftQuery.data.lockVersion;
      persistedDraftFingerprintRef.current = JSON.stringify(parsed.data);
      queuedDraftRef.current = null;
      setSelectedId(parsed.data.sections[0]?.id ?? null);
      loadedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftQuery.data]);

  const config = history.value;
  latestConfigRef.current = config;
  useEffect(() => () => {
    selectionCleanupRef.current?.();
    for (const url of temporaryUrlsRef.current) URL.revokeObjectURL(url);
    temporaryUrlsRef.current = [];
  }, []);

  // Serialize saves: never send two PATCH /config calls using an obsolete
  // optimistic lockVersion. Drag/resize can commit many times in one second.
  // The latest complete draft always wins without discarding prior edits.
  const saveMutateAsyncRef = useRef(saveConfig.mutateAsync);
  saveMutateAsyncRef.current = saveConfig.mutateAsync;

  const flushQueuedDraft = async () => {
    if (serializedSaveRunningRef.current) return;
    serializedSaveRunningRef.current = true;
    try {
      while (queuedDraftRef.current) {
        const draft = queuedDraftRef.current;
        const fingerprint = JSON.stringify(draft);
        if (fingerprint === persistedDraftFingerprintRef.current) break;
        const result = await saveMutateAsyncRef.current({
          config:draft,expectedLockVersion:saveLockVersionRef.current,
        });
        const version = result.project.lockVersion;
        saveLockVersionRef.current = version;
        persistedDraftFingerprintRef.current = fingerprint;
        setLockVersion(version);
      }
      setSaveState('saved');
    } catch (error: unknown) {
      const details = (error as {
        details?: { config?: unknown; project?: {lockVersion:number} };
      })?.details;
      if (details?.config) {
        setConflictConfig(details.config as SiteSchemaModel);
        setSaveState('conflict');
      } else {
        setSaveState('error');
      }
    } finally {
      serializedSaveRunningRef.current = false;
    }
  };

  useEffect(() => {
    if (!config || !loadedRef.current) return;
    queuedDraftRef.current = config;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      persistedDraftFingerprintRef.current = JSON.stringify(config);
      saveLockVersionRef.current = lockVersion;
      setSaveState('saved');
      return;
    }
    if (JSON.stringify(config) === persistedDraftFingerprintRef.current) {
      setSaveState('saved');
      return;
    }
    setSaveState('saving');
    const timer = setTimeout(() => { void flushQueuedDraft(); }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // Configuration fingerprint is the only auto-save trigger; the serialized
    // worker reads the newest queued draft and current server lockVersion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.ctrlKey || event.metaKey;
      if (!meta) return;
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        history.undo();
        setPreviewRevision((revision) => revision + 1);
      } else if (event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault();
        history.redo();
        setPreviewRevision((revision) => revision + 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [history]);

  // Mesmo renderer do servidor, resolvendo cada asset pela URL autenticada
  // real -- e assim que o preview deixa de ser uma aproximacao e passa a ser
  // literalmente o que sera publicado (secao 5.5).
  const previewCtx = useMemo<RenderContext>(() => {
    const byId = new Map([...((assetsQuery.data ?? []).map((asset) => [asset.id, asset] as const)),...Object.entries(newAssets)]);
    return {
      profile: 'DEMO',
      inlineRuntime: SITE_RUNTIME_JS,
      resolveAsset: (assetId) => {
        const asset = byId.get(assetId);
        return asset ? {
          url: previewImageUrls[assetId] ?? new URL(asset.url,window.location.origin).href,
          width: asset.width ?? undefined,height: asset.height ?? undefined,
        } : null;
      },
    };
  }, [assetsQuery.data,newAssets,previewImageUrls]);

  const previewResult = useMemo(() => {
    if (!config) return { html: '', error: null as string | null };
    try {
      return { html: renderSite(config, previewCtx), error: null as string | null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { html: '', error: message || 'Erro desconhecido ao renderizar o site.' };
    }
  }, [config, previewCtx]);

  // Keep the approved site markup intact. Only disable its sticky header
  // inside the EDITOR iframe so scrolling the site is not obscured by two
  // separate navigation bars (PageNova CRM + the client's website).
  // Published HTML still has the original sticky FRIGOLOG navigation.
  const editorPreviewHtml = useMemo(() => {
    if (!previewResult.html || config?.project.templateId !== 'frigolog-universal') {
      return previewResult.html;
    }
    const editorChrome = '<style id="pn-editor-chrome">' +
      '.frigolog-template .site-header{position:relative!important;top:auto!important}' +
      '</style>';
    return previewResult.html.replace('</head>', editorChrome + '</head>');
  }, [previewResult.html, config?.project.templateId]);

  // A transform/resize changes only visualTextEdits. Replacing iframe.srcDoc
  // for those edits destroys the DOM, resets scroll, blinks the full preview
  // and briefly steals selection. Keep the same document until page content
  // or image assets change; the selected DOM element is updated live.
  const layoutSignature = config
    ? JSON.stringify({...config,visualTextEdits:[]})
    : '';
  const iframeDocumentKey = [
    layoutSignature,
    previewRevision,
    // Image replacements do change the page's document.
    Object.keys(previewImageUrls).sort().join(','),
  ].join('|');
  const currentDocument = previewDocumentCacheRef.current;
  if (currentDocument.key !== iframeDocumentKey) {
    currentDocument.key = iframeDocumentKey;
    currentDocument.html = editorPreviewHtml;
  }
  const stableEditorPreviewHtml = currentDocument.html;

  const lintReport = useMemo(() => {
    if (!config) return null;
    try {
      return lintSite(config);
    } catch {
      return null;
    }
  }, [config]);

  const selectedSection = config?.sections.find((s) => s.id === selectedId) ?? null;

  if (draftQuery.isLoading) return <LoadingBlock label="Carregando o rascunho..." />;
  if (draftQuery.isError || !config) {
    return (
      <Callout tone="danger" title="Nao foi possivel carregar">
        Nao foi possivel carregar o projeto para edicao.
      </Callout>
    );
  }

  const updateSections = (sections: SiteSection[]) => history.set({ ...config, sections });

  const handleSelectSection = (id: string) => setSelectedId(id);

  const handleSectionChange = (next: SiteSection) => {
    updateSections(config.sections.map((s) => (s.id === next.id ? next : s)));
  };

  const handleReorder = (from: number, to: number) => {
    const next = [...config.sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    updateSections(next);
  };

  const handleToggleVisible = (id: string) => {
    updateSections(config.sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  };

  const handleDuplicate = (id: string) => {
    const index = config.sections.findIndex((s) => s.id === id);
    if (index === -1) return;
    const original = config.sections[index]!;
    const copy = { ...original, id: `${original.id}-copia-${Date.now().toString(36)}` };
    const next = [...config.sections];
    next.splice(index + 1, 0, copy);
    updateSections(next);
  };

  const handleDelete = (id: string) => {
    if (config.sections.length <= 2) {
      toast.error('O site precisa de pelo menos duas secoes.');
      return;
    }
    updateSections(config.sections.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleAiEdit = () => {
    if (!selectedSection || !aiInstruction.trim()) return;
    aiEdit.mutate(
      { sectionId: selectedSection.id, instruction: aiInstruction.trim() },
      {
        onSuccess: (result) => {
          handleSectionChange(result.section as SiteSection);
          setAiInstruction('');
          toast.success('Secao atualizada pela IA. Use Ctrl+Z para desfazer se preferir a versao anterior.');
        },
        onError: () => toast.error('Nao foi possivel aplicar a edicao. Tente descrever de outra forma.'),
      },
    );
  };

  const discardAndReload = () => {
    if (!conflictConfig) return;
    history.reset(conflictConfig);
    const serverLockVersion = projectQuery.data?.lockVersion ?? draftQuery.data?.lockVersion;
    if (typeof serverLockVersion === 'number') {
      setLockVersion(serverLockVersion);
      saveLockVersionRef.current = serverLockVersion;
      persistedDraftFingerprintRef.current = JSON.stringify(conflictConfig);
    }
    setConflictConfig(null);
    setSaveState('saved');
    void draftQuery.refetch().then((result) => {
      if (typeof result.data?.lockVersion === 'number') setLockVersion(result.data.lockVersion);
    });
    toast.error('Suas alteracoes locais foram descartadas: a versao mais recente do servidor foi carregada.');
  };

  const rememberScroll = () => {
    const win = previewFrameRef.current?.contentWindow;
    if (win) scrollRef.current = { x: win.scrollX, y: win.scrollY };
  };
  const selectedSource = (element: HTMLElement): SiteSection | undefined => {
    const anchor = element.closest('section[id]')?.id;
    const aliases: Record<string,SiteSection['type']> = {
      inicio:'hero',servicos:'services',sobre:'about',operacao:'process',contato:'cta',
    };
    return config.sections.find((s) => s.id === anchor || s.anchor === anchor) ??
      config.sections.find((s) => s.type === aliases[anchor ?? '']);
  };
  const replaceSectionText = (section: SiteSection, oldText: string, newText: string): SiteSection => {
    // First try exact field matching. Headline fragments can require a substring
    // match (for example the Frigolog heading's accented nested span).
    const blocked = new Set(['id','type','variant','anchor','assetId','alt','icon','url',
      'kind','source','target','focalX','focalY']);
    for (const partial of [false,true]) {
      let changed = false;
      const walk = (value: unknown): unknown => {
        if (typeof value === 'string') {
          if (changed) return value;
          if (value.trim() === oldText.trim()) { changed = true; return newText; }
          if (partial && oldText.length >= 6 && value.includes(oldText)) {
            changed = true;
            return value.replace(oldText,newText);
          }
          return value;
        }
        if (Array.isArray(value)) return value.map(walk);
        if (value && typeof value === 'object') {
          return Object.fromEntries(Object.entries(value as Record<string,unknown>)
            .map(([key,child]) => [key,blocked.has(key)?child:walk(child)]));
        }
        return value;
      };
      const result = walk(section) as SiteSection;
      if (changed) return result;
    }
    return section;
  };
  /** Save geometry immediately without unloading the iframe or losing selection. */
  const commitSelectedGeometry = () => {
    const selected = editElementRef.current;
    const pending = pendingStyleRef.current;
    const latest = latestConfigRef.current;
    if (!selected || !pending?.key || !latest) return;
    if (JSON.stringify(pending) === originalStyleRef.current) return;
    const visualTextEdits = [...latest.visualTextEdits.filter((item) => item.key !== pending.key),{...pending}];
    const next = {...latest,visualTextEdits};
    latestConfigRef.current = next;
    originalStyleRef.current = JSON.stringify(pending);
    history.set(next);
  };

  const finishInlineEdit = (save = true) => {
    const element = editElementRef.current;
    if (!element) { setInlineEditor(null); return; }
    selectionCleanupRef.current?.();
    selectionCleanupRef.current = null;
    const before = originalTextRef.current;
    const after = element.innerText.trim();
    const isPhoto = element.tagName === 'IMG';
    const isBlock = element.tagName === 'ARTICLE';
    element.contentEditable = 'false';
    element.style.outline = '';
    element.style.outlineOffset = '';
    let nextSections = config.sections;
    let changed = false;
    if (save && !isPhoto && !isBlock && after && after !== before) {
      const preferred = selectedSource(element);
      const candidates = preferred
        ? [preferred,...config.sections.filter((s) => s.id !== preferred.id)]
        : config.sections;
      for (const item of candidates) {
        const updated = replaceSectionText(item,before,after);
        if (JSON.stringify(updated) !== JSON.stringify(item)) {
          nextSections = config.sections.map((s) => s.id === item.id ? updated : s);
          changed = true;
          break;
        }
      }
      if (!changed) {
        // Fixed template labels are not necessarily fields of SiteSchema.
        // Persist them by stable rendered element key, including after publish.
        const pending = pendingStyleRef.current;
        if (pending?.key) {
          pending.textOverride = after.slice(0,1000);
          changed = true;
        } else {
          toast.error('Não foi possível identificar este bloco de texto.');
          element.innerText = before;
        }
      }
    } else if (!save && !isPhoto && !isBlock) {
      element.innerText = before;
    }
    let nextStyles = config.visualTextEdits;
    const pending = pendingStyleRef.current;
    if (save && pending?.key && JSON.stringify(pending) !== originalStyleRef.current) {
      nextStyles = [...nextStyles.filter((item) => item.key !== pending.key),pending];
      changed = true;
    }
    rememberScroll();
    editElementRef.current = null;
    pendingStyleRef.current = null;
    dragRef.current = null;
    setInlineEditor(null);
    if (changed && save) history.set({ ...config, sections: nextSections, visualTextEdits: nextStyles });
    if (!save) setPreviewRevision((current) => current + 1);
  };
  /** One tap selects and exposes resize/move handles. Only double tap edits text. */
  const showToolbar = (
    element: HTMLElement, x: number, y: number,
    kind: 'text' | 'image' | 'block', openMenu = false,
  ) => {
    const frame = previewFrameRef.current;
    const rect = frame?.getBoundingClientRect();
    if (!frame || !rect) return;
    if (editElementRef.current === element && !openMenu) return;
    selectionCleanupRef.current?.();
    selectionCleanupRef.current = null;
    editElementRef.current = element;
    originalTextRef.current = element.innerText?.trim() ?? '';
    const key = element.dataset.pnEdit;
    pendingStyleRef.current = key
      ? { ...(config.visualTextEdits.find((item) => item.key === key) ?? { key }) }
      : null;
    originalStyleRef.current = JSON.stringify(pendingStyleRef.current);
    const iframeDoc = frame.contentDocument;
    if (iframeDoc && pendingStyleRef.current) {
      selectionCleanupRef.current = mountCanvasHandles(
        iframeDoc,element,pendingStyleRef.current,commitSelectedGeometry,
      );
    }
    if (!openMenu) {
      setInlineEditor(null);
      return;
    }
    const width = Math.min(420,window.innerWidth - 16);
    const view = window.visualViewport;
    const viewportTop = view?.offsetTop ?? 0;
    const visibleHeight = view?.height ?? window.innerHeight;
    setInlineEditor({
      x: Math.max(8,Math.min(rect.left+x-width/2,window.innerWidth-width-8)),
      y: Math.max(viewportTop+8,Math.min(rect.top+y-140,viewportTop+visibleHeight-110)),
      kind,
    });
  };
  const installInlineEditor = () => {
    const frame = previewFrameRef.current;
    const doc = frame?.contentDocument;
    if (!frame || !doc) return;
    selectionCleanupRef.current?.();
    selectionCleanupRef.current = null;
    frame.contentWindow?.scrollTo(scrollRef.current.x,scrollRef.current.y);
    const style = doc.createElement('style');
    // A single selection frame is enough. Hover outlines on every nested
    // span previously created overlapping dashed boxes over headings.
    style.textContent = 'img[data-pn-photo]{cursor:pointer}' +
      '[contenteditable=true]{outline:2px solid #06b6a5!important;outline-offset:3px}' +
      'article[data-pn-edit]{cursor:grab}' +
      '[data-pn-edit],img[data-pn-photo]{touch-action:manipulation}';
    doc.head.appendChild(style);
    doc.addEventListener('click',(event) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-pn-canvas-control]')) return;
      if (target.closest('a[href]')) event.preventDefault();
      if (target.closest('.pn-kpi-clone,[aria-hidden="true"]')) return;
      const image = target.closest('img[data-pn-photo]') as HTMLImageElement | null;
      if (image) {
        const section = selectedSource(image);
        const slot = image.dataset.pnPhoto as PhotoSlot | undefined;
        if (!section || !slot || !['hero','about','operation'].includes(slot)) return;
        event.preventDefault();
        if (editElementRef.current && editElementRef.current !== image) finishInlineEdit();
        pendingImageRef.current = { sectionId:section.id,slot };
        showToolbar(image,event.clientX,event.clientY,'image');
        return;
      }
      const nearest = target.closest('[data-pn-edit]') as HTMLElement | null;
      // Select the entire heading/paragraph rather than an inner inline span.
      // A span's first-line box produced cropped selection borders on mobile.
      const fullTextBlock = nearest?.closest(
        'h1[data-pn-edit],h2[data-pn-edit],h3[data-pn-edit],h4[data-pn-edit],p[data-pn-edit],li[data-pn-edit]',
      ) as HTMLElement | null;
      const selectable = fullTextBlock ?? nearest;
      if (!selectable) {
        if (editElementRef.current) finishInlineEdit();
        return;
      }
      if (selectable === editElementRef.current) return;
      if (editElementRef.current) finishInlineEdit();
      showToolbar(selectable,event.clientX,event.clientY,
        selectable.tagName === 'ARTICLE' ? 'block' : 'text');
    });
    doc.addEventListener('dblclick',(event) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-pn-canvas-control]')) return;
      const img = target.closest('img[data-pn-photo]') as HTMLImageElement | null;
      if (img) {
        event.preventDefault();
        event.stopPropagation();
        const section = selectedSource(img);
        const slot = img.dataset.pnPhoto as PhotoSlot | undefined;
        if (section && slot && ['hero','about','operation'].includes(slot)) {
          pendingImageRef.current = { sectionId:section.id,slot };
          imageInputRef.current?.click();
        }
        return;
      }
      const nearestText = target.closest('[data-pn-edit]') as HTMLElement | null;
      const parentText = nearestText?.closest(
        'h1[data-pn-edit],h2[data-pn-edit],h3[data-pn-edit],h4[data-pn-edit],p[data-pn-edit],li[data-pn-edit]',
      ) as HTMLElement | null;
      const text = parentText ?? nearestText;
      if (!text || text.tagName === 'IMG' || text.tagName === 'ARTICLE' ||
          !text.innerText?.trim() || text.closest('.pn-kpi-clone,[aria-hidden="true"]')) return;
      event.preventDefault();
      event.stopPropagation();
      if (editElementRef.current && editElementRef.current !== text) finishInlineEdit();
      originalTextRef.current = text.innerText.trim();
      text.contentEditable = 'true';
      text.focus();
      showToolbar(text,event.clientX,event.clientY,'text',true);
    });
    doc.addEventListener('keydown',(event) => {
      if (!editElementRef.current || editElementRef.current.tagName === 'IMG') return;
      if (event.key === 'Escape') { event.preventDefault(); finishInlineEdit(false); }
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();finishInlineEdit(true);
      }
    });
    doc.addEventListener('pointerdown',(event) => {
      const el = editElementRef.current;
      if (!el || (event.target as HTMLElement).closest('[data-pn-canvas-control]')) return;
      if (!el.contains(event.target as Node)) finishInlineEdit();
    });
  };
  const uploadInlinePhoto = async (file: File) => {
    const selected = pendingImageRef.current;
    if (!selected) return;
    try {
      const { asset } = await uploadAsset.mutateAsync(file);
      if (!asset?.id || !asset.url) throw new Error('O upload não retornou uma imagem válida.');
      // Verify actual image bytes at the CRM proxy endpoint before claiming
      // success. This catches 404/session/path failures that were invisible
      // when only the asset metadata was checked.
      const publicUrl = new URL(asset.url, window.location.origin).href;
      const response = await fetch(publicUrl,{credentials:'include',cache:'no-store'});
      if (!response.ok || !(response.headers.get('content-type') ?? '').startsWith('image/')) {
        throw new Error('A imagem foi recebida, mas não pôde ser aberta no editor. Confira o armazenamento do Railway.');
      }
      const media = await response.blob();
      if (!media.size) throw new Error('O servidor retornou a imagem vazia.');
      // A same-origin object URL removes cross-frame authentication and
      // asynchronous React Query races from immediate canvas preview. Only
      // its validated assetId is persisted to the server-side site schema.
      const localUrl = URL.createObjectURL(media);
      temporaryUrlsRef.current.push(localUrl);
      const current = latestConfigRef.current;
      if (!current) throw new Error('O rascunho ainda não está pronto para edição.');
      const ref = {
        assetId:asset.id,
        alt:('Imagem enviada: '+file.name).slice(0,180),
        focalX:0.5,focalY:0.5,
      };
      const sections = current.sections.map((section) => {
        if (section.id !== selected.sectionId) return section;
        if (section.type === 'hero' && selected.slot === 'hero') {
          return { ...section,image:ref };
        }
        if (section.type === 'about' && selected.slot === 'about') {
          return { ...section,image:ref };
        }
        if (section.type === 'process' && selected.slot === 'operation') {
          return {
            ...section,
            steps:section.steps.map((step,i) => i === 0 ? {...step,image:ref} : step),
          };
        }
        return section;
      });
      const parsed = siteSchema.safeParse({...current,sections});
      if (!parsed.success) throw new Error('O site recusou a referência da foto. Nenhuma alteração foi salva.');
      rememberScroll();
      selectionCleanupRef.current?.();
      selectionCleanupRef.current = null;
      editElementRef.current = null;
      setInlineEditor(null);
      setNewAssets((previous) => ({...previous,[asset.id]:asset}));
      setPreviewImageUrls((previous) => ({...previous,[asset.id]:localUrl}));
      history.set(parsed.data);
      // Refresh in the background; rendering no longer depends on this race.
      void assetsQuery.refetch();
      toast.success('Nova imagem carregada no site. Salvando...');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível abrir a imagem enviada.');
    } finally {
      pendingImageRef.current = null;
    }
  };
  /** Brand logo belongs to navigation, not to any photograph section. */
  const uploadBrandLogo=async(file:File)=>{
    if(!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>5*1024*1024){
      toast.error('Escolha uma logo PNG, JPG ou WebP de até 5 MB.');return;
    }
    setUploadingLogo(true);
    try{
      const {asset}=await uploadAsset.mutateAsync(file);
      if(!asset?.id||!asset.url)throw new Error('O upload não retornou uma logo válida.');
      const publicUrl=new URL(asset.url,window.location.origin).href;
      const response=await fetch(publicUrl,{credentials:'include',cache:'no-store'});
      if(!response.ok||!(response.headers.get('content-type')??'').startsWith('image/'))
        throw new Error('A logo foi enviada, mas o servidor não conseguiu abrir sua imagem.');
      const blob=await response.blob();
      if(!blob.size)throw new Error('O servidor retornou uma imagem vazia.');
      const localUrl=URL.createObjectURL(blob);
      temporaryUrlsRef.current.push(localUrl);
      const current=latestConfigRef.current;
      if(!current)throw new Error('O projeto não está pronto para edição.');
      const navigation={
        ...current.navigation,
        logo:{assetId:asset.id,alt:('Logo da empresa: '+file.name).slice(0,180),focalX:0.5,focalY:0.5},
      };
      const parsed=siteSchema.safeParse({...current,navigation});
      if(!parsed.success)throw new Error('Não foi possível salvar a logo no projeto.');
      setNewAssets(previous=>({...previous,[asset.id]:asset}));
      setPreviewImageUrls(previous=>({...previous,[asset.id]:localUrl}));
      history.set(parsed.data);
      void assetsQuery.refetch();
      toast.success('Logo atualizada! Salvando no site...');
    }catch(error){
      toast.error(error instanceof Error?error.message:'Falha ao trocar a logo.');
    }finally{setUploadingLogo(false);}
  };
  const styleInlineElement = (
    property: 'fontSize'|'fontFamily'|'color'|'fontWeight'|'fontStyle'|'textAlign',value: string,
  ) => {
    const element = editElementRef.current;
    const edit = pendingStyleRef.current;
    if (!element || !edit || element.tagName === 'IMG') return;
    element.style[property] = value;
    if (property === 'fontSize') edit.fontSizePx = Math.min(120,Math.max(10,parseInt(value,10)||16));
    else if (property === 'fontFamily') edit.fontFamily = value.split(',')[0]!.trim() as InlineStyle['fontFamily'];
    else if (property === 'color') edit.color = value;
    else if (property === 'fontWeight') edit.fontWeight = value as InlineStyle['fontWeight'];
    else if (property === 'fontStyle') edit.fontStyle = value as InlineStyle['fontStyle'];
    else edit.textAlign = value as InlineStyle['textAlign'];
  };
  const startMove = (clientX:number,clientY:number) => {
    const edit = pendingStyleRef.current;
    const element = editElementRef.current;
    if (!edit || !element) return;
    if (element.contentEditable === 'true') element.contentEditable = 'false';
    dragRef.current = { startX:clientX,startY:clientY,x:edit.offsetX??0,y:edit.offsetY??0 };
  };
  const move = (clientX:number,clientY:number) => {
    const drag = dragRef.current,edit = pendingStyleRef.current,element = editElementRef.current;
    if (!drag || !edit || !element) return;
    edit.offsetX = Math.max(-400,Math.min(400,Math.round(drag.x+clientX-drag.startX)));
    edit.offsetY = Math.max(-400,Math.min(400,Math.round(drag.y+clientY-drag.startY)));
    if (element.ownerDocument.defaultView?.getComputedStyle(element).position === 'static') {
      element.style.setProperty('position','relative','important');
    }
    element.style.setProperty('transform','translate('+edit.offsetX+'px,'+edit.offsetY+'px)','important');
  };

  const applyVisualTemplate = (nextTemplate: 'standard' | 'frigolog-universal' | 'muse-editorial' | 'atelier-norte' | 'vertice-corporate' | 'restaurant-premium' | 'real-estate-premium') => {
    if (!config || config.project.templateId === nextTemplate) return;
    // Preserve text, images and generated business content. Only switch
    // the deterministic HTML layout, with undo and autosave support.
    const order = ['hero', 'benefits', 'services', 'about', 'process', 'testimonials', 'faq', 'contactMap', 'cta', 'footer'];
    const sections = nextTemplate === 'frigolog-universal'
      ? [...config.sections].sort((a, b) => {
          const i = order.indexOf(a.type);
          const j = order.indexOf(b.type);
          return (i < 0 ? 90 : i) - (j < 0 ? 90 : j);
        })
      : config.sections;
    history.set({ ...config, project: { ...config.project, templateId: nextTemplate }, sections,
      theme: { ...config.theme, colors: repairThemeContrast(config.theme.colors) } });
    toast.success(nextTemplate === 'atelier-norte'
      ? 'Atelier Norte aplicado! Conteúdo e logo preservados. Revise antes de publicar.'
      : nextTemplate === 'muse-editorial'
      ? 'Muse Editorial aplicado! Conteúdo preservado. Revise as seções antes de publicar.'
      : nextTemplate === 'frigolog-universal'
        ? 'Modelo Original aplicado! Conteúdo preservado. Revise antes de publicar.'
        : 'Visual anterior restaurado. Conteúdo preservado.');
  };

  const correctColors = () => {
    history.set({ ...config, theme: { ...config.theme, colors: repairThemeContrast(config.theme.colors) } });
    toast.success('Contraste ajustado para leitura acessivel. A cor da marca foi preservada o maximo possivel.');
  };

  const checkPreviewImages = () => {
    const doc = previewFrameRef.current?.contentDocument;
    if (!doc) return;
    const images = Array.from(doc.querySelectorAll<HTMLImageElement>('.frigolog-template img[data-pn-photo]'));
    const update = () => {
      setMissingPreviewPhotos(
        images.filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.dataset.pnPhoto || 'imagem'),
      );
    };
    for (const img of images) {
      img.addEventListener('error', update, { once: true });
      img.addEventListener('load', update, { once: true });
    }
    update();
  };

  return (
    <div className="flex h-[72dvh] min-h-[28rem] w-full min-w-0 flex-col overflow-hidden md:h-[calc(100vh-8rem)] md:min-h-[32rem]">
      <EditorTopBar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={history.undo}
        onRedo={history.redo}
        viewport={viewport}
        onViewportChange={setViewport}
        saveState={saveState}
        onShowVersions={() => setShowVersions((v) => !v)}
        onCreateVersion={() => createVersion.mutate(undefined, { onSuccess: () => toast.success('Versao criada.') })}
        onShowPublish={() => setShowPublish((v) => !v)}
        warningCount={lintReport?.warnings.length ?? 0}
        errorCount={lintReport?.errors.length ?? 0}
        onShowIssues={() => setShowIssues((v) => !v)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-3 py-2"
        role="group" aria-label="Identidade visual da empresa">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">Logo do site</p>
          <p className="text-[11px] text-muted-foreground">Troque ou remova sem nova geração de IA. Funciona em todos os modelos.</p>
        </div>
        <div className="flex items-center gap-2">
          {config.navigation.logo&&<button type="button"
            onClick={()=>history.set({...config,navigation:{...config.navigation,logo:null}})}
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
            Remover logo
          </button>}
          <button type="button" disabled={uploadingLogo||uploadAsset.isPending}
            onClick={()=>logoInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary-soft px-3 py-2 text-xs font-semibold text-primary disabled:opacity-50">
            <ImagePlus className="h-4 w-4" />
            {uploadingLogo?'Enviando logo...':config.navigation.logo?'Trocar logo':'Adicionar logo'}
          </button>
          <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp"
            className="hidden" aria-label="Selecionar nova logo do site"
            onChange={event=>{const file=event.target.files?.[0];if(file)void uploadBrandLogo(file);event.target.value='';}}/>
        </div>
      </div>
      {diagnosticsQuery.data?.universalTemplateSupported ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-3 py-3"
          role="group" aria-label="Alterar template visual do site">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">Template visual do site</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Troque o layout sem gerar novamente. Textos e imagens continuam no projeto.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              ['frigolog-universal', 'Modelo 1 · Original'],
              ['muse-editorial', 'Modelo 2 · Muse Editorial'],
              ['atelier-norte','Modelo 3 · Atelier Norte'],
              ['standard', 'Visual anterior'],
            ] as const).map(([id,label])=>(
              <button key={id} type="button" aria-pressed={(config.project.templateId ?? 'standard')===id}
                onClick={()=>applyVisualTemplate(id)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  (config.project.templateId ?? 'standard')===id
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {showIssues && lintReport ? (
        <div className="max-h-48 overflow-y-auto border-b border-border bg-surface px-3 py-3" role="region" aria-label="Erros e avisos do site">
          {lintReport.errors.some((item) => item.code === 'A11Y_CONTRAST') ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted p-3">
              <p className="text-xs">As cores do tema nao atingem o contraste minimo para publicacao.</p>
              <Button size="sm" onClick={correctColors}>Corrigir contraste automaticamente</Button>
            </div>
          ) : null}
          {lintReport.errors.length === 0 && lintReport.warnings.length === 0 ? (
            <p className="text-sm">Nenhum problema encontrado.</p>
          ) : (
            <ul className="space-y-2">
              {[...lintReport.errors, ...lintReport.warnings].map((issue, i) => (
                <li key={issue.code + issue.path + i}>
                  <button type="button" className="w-full rounded-lg border border-border px-3 py-2 text-left text-xs hover:bg-muted"
                    onClick={() => {
                      const match = /^sections\[(\d+)\]/.exec(issue.path);
                      if (match) setSelectedId(config.sections[Number(match[1])]?.id ?? null);
                    }}>
                    <strong className={issue.severity === 'ERROR' ? 'text-danger' : 'text-warning'}>
                      {issue.severity === 'ERROR' ? 'Erro que bloqueia publicacao' : 'Aviso'}
                    </strong>
                    <span className="ml-2">{issue.message}</span>
                    <span className="mt-1 block text-muted-foreground">{issue.path}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
        <span>Toque para selecionar; arraste o próprio bloco para mover. O canto redimensiona sem cortar o texto.</span>
        <span>Duplo clique no texto para editar. Duplo clique na imagem para trocar.</span>
      </div>
      {config.project.templateId === 'frigolog-universal' && missingPreviewPhotos.length > 0 ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-400/30 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          <span>{missingPreviewPhotos.length} imagem(ns) não carregaram. Abra Publicar para executar o diagnóstico e a recuperação das imagens. Nenhuma nova geração do site é necessária.</span>
        </div>
      ) : null}
      {saveState === 'conflict' ? (
        <Callout tone="danger" title="Conflito de edicao">
          <div className="flex items-center justify-between gap-3">
            <span>Alguem salvou uma alteracao neste site enquanto voce editava.</span>
            <Button size="sm" variant="secondary" onClick={discardAndReload}>
              Descartar minhas alteracoes e recarregar
            </Button>
          </div>
        </Callout>
      ) : null}

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 items-start justify-center overflow-auto bg-muted p-0 md:p-4">
          {previewResult.error ? (
            <div className="m-3 w-full max-w-2xl rounded-lg border border-danger/30 bg-surface p-4 text-left shadow-sm">
              <p className="text-sm font-semibold text-danger">Erro ao montar a previa do site</p>
              <p className="mt-2 break-words text-xs text-muted-foreground">{previewResult.error}</p>
            </div>
          ) : (
            <iframe
              key={previewRevision}
              ref={previewFrameRef}
              onLoad={() => { installInlineEditor(); checkPreviewImages(); }}
              title="Previa do site"
              srcDoc={stableEditorPreviewHtml}
              className={'h-full rounded-md border border-border bg-white shadow-sm transition-all ' + (viewport === 'mobile' ? 'w-full max-w-[430px]' : 'w-full max-w-6xl')}
            />
          )}
        </div>

        <input
          ref={imageInputRef}
          className="hidden"
          type="file"
          accept={PHOTO_ACCEPT}
          aria-label="Trocar imagem da página"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadInlinePhoto(file);
            event.target.value = '';
          }}
        />
        {inlineEditor ? (
          <div
            role="toolbar"
            aria-label={inlineEditor.kind === 'text' ? 'Editar texto selecionado' : inlineEditor.kind === 'image' ? 'Editar imagem selecionada' : 'Mover cartão selecionado'}
            className="fixed z-[100] flex max-w-[calc(100vw-16px)] flex-wrap items-center gap-1 rounded-xl border border-border bg-surface p-2 text-foreground shadow-2xl"
            style={{ left:inlineEditor.x,top:inlineEditor.y,width:'min(420px, calc(100vw - 16px))' }}
          >
            <div
              role="button"
              tabIndex={0}
              aria-label="Arrastar menu de edição"
              title="Segure aqui para mover o menu"
              className="mb-1 flex h-9 w-full touch-none select-none items-center justify-between rounded-lg border border-border/40 bg-muted/60 px-3 text-xs font-medium text-muted-foreground"
              style={{ cursor:'grab' }}
              onPointerDown={(event) => {
                if (!inlineEditor) return;
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                toolbarDragRef.current = {
                  pointerId:event.pointerId,x:event.clientX,y:event.clientY,
                  left:inlineEditor.x,top:inlineEditor.y,
                };
              }}
              onPointerMove={(event) => {
                const drag = toolbarDragRef.current;
                if (!drag || drag.pointerId !== event.pointerId) return;
                event.preventDefault();
                const view = window.visualViewport;
                const top = view?.offsetTop ?? 0;
                const height = view?.height ?? window.innerHeight;
                const width = Math.min(420,window.innerWidth-16);
                setInlineEditor((current) => current ? {
                  ...current,
                  x:Math.max(8,Math.min(window.innerWidth-width-8,drag.left+event.clientX-drag.x)),
                  y:Math.max(top+8,Math.min(top+height-52,drag.top+event.clientY-drag.y)),
                } : current);
              }}
              onPointerUp={(event) => {
                if (toolbarDragRef.current?.pointerId === event.pointerId) toolbarDragRef.current = null;
              }}
              onPointerCancel={() => { toolbarDragRef.current = null; }}
              onKeyDown={(event) => {
                if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
                event.preventDefault();
                const dx = event.key === 'ArrowLeft' ? -12 : event.key === 'ArrowRight' ? 12 : 0;
                const dy = event.key === 'ArrowUp' ? -12 : event.key === 'ArrowDown' ? 12 : 0;
                setInlineEditor((current) => current ? {...current,x:Math.max(8,current.x+dx),y:Math.max(8,current.y+dy)}:current);
              }}
            >
              <span className="flex items-center gap-2"><Grip className="h-4 w-4" aria-hidden="true" /> Arrastar menu</span>
              <span className="text-[10px]">Segure e mova</span>
            </div>
            {inlineEditor.kind === 'text' ? (
              <>
                <select aria-label="Tamanho da fonte" className="h-8 rounded border border-border bg-surface px-1 text-xs"
                  defaultValue="" onChange={(event) => styleInlineElement('fontSize',event.target.value)}>
                  <option value="" disabled>Tam.</option>
                  {[12,14,16,18,20,24,28,32,36,42,48,56,64,72].map((n) =>
                    <option key={n} value={n+'px'}>{n}</option>)}
                </select>
                <select aria-label="Fonte" className="h-8 max-w-32 rounded border border-border bg-surface px-1 text-xs"
                  defaultValue="" onChange={(event) => styleInlineElement('fontFamily',event.target.value)}>
                  <option value="" disabled>Fonte</option>
                  <option value="Inter,sans-serif">Inter</option>
                  <option value="Poppins,sans-serif">Poppins</option>
                  <option value="Montserrat,sans-serif">Montserrat</option>
                  <option value="Georgia,serif">Georgia</option>
                </select>
                <input aria-label="Cor do texto" type="color" className="h-8 w-9 cursor-pointer"
                  onChange={(event) => styleInlineElement('color',event.target.value)} />
                <button type="button" aria-label="Negrito" className="h-8 w-8 rounded font-bold hover:bg-muted"
                  onClick={() => styleInlineElement('fontWeight',pendingStyleRef.current?.fontWeight === '700' ? '400':'700')}>B</button>
                <button type="button" aria-label="Itálico" className="h-8 w-8 rounded italic hover:bg-muted"
                  onClick={() => styleInlineElement('fontStyle',pendingStyleRef.current?.fontStyle === 'italic' ? 'normal':'italic')}>I</button>
                <button type="button" aria-label="Alinhar à esquerda" className="h-8 w-7 rounded hover:bg-muted"
                  onClick={() => styleInlineElement('textAlign','left')}>L</button>
                <button type="button" aria-label="Centralizar" className="h-8 w-7 rounded hover:bg-muted"
                  onClick={() => styleInlineElement('textAlign','center')}>C</button>
                <button type="button" aria-label="Alinhar à direita" className="h-8 w-7 rounded hover:bg-muted"
                  onClick={() => styleInlineElement('textAlign','right')}>R</button>
              </>
            ) : inlineEditor.kind === 'image' ? (
              <button type="button" className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold hover:bg-muted"
                onClick={() => imageInputRef.current?.click()}>
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                {uploadAsset.isPending ? 'Enviando...' : 'Trocar imagem'}
              </button>
            ) : <span className="px-1 text-xs font-semibold">Card selecionado</span>}
            <button type="button" aria-label="Arrastar bloco" title="Segure e arraste para mover o bloco"
              className="flex h-8 touch-none items-center gap-1 rounded-lg border border-border px-2 text-xs font-semibold hover:bg-muted"
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                startMove(event.clientX,event.clientY);
              }}
              onPointerMove={(event) => { if (dragRef.current) move(event.clientX,event.clientY); }}
              onPointerUp={(event) => {
                if (!dragRef.current) return;
                move(event.clientX,event.clientY);
                dragRef.current = null;
                finishInlineEdit(true);
              }}
              onPointerCancel={() => { dragRef.current = null; finishInlineEdit(true); }}>
              <Grip className="h-4 w-4" aria-hidden="true" /> Mover
            </button>
            <button type="button" className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
              onClick={() => finishInlineEdit(true)}>Concluir</button>
            <button type="button" className="h-8 rounded-lg px-2 text-xs hover:bg-muted"
              onClick={() => finishInlineEdit(false)}>Cancelar</button>
          </div>
        ) : null}
        {showPublish ? (
          <PublishPanel
            projectId={projectId}
            currentSlug={projectQuery.data?.project.desiredSlug ?? null}
            onClose={() => setShowPublish(false)}
            onImagesRecovered={(restored, latestLockVersion) => {
              const parsed = siteSchema.safeParse(restored);
              if (!parsed.success) {
                toast.error('As imagens foram publicadas, mas o editor precisa recarregar o novo rascunho.');
                return;
              }
              skipNextAutosaveRef.current = true;
              history.reset(parsed.data);
              setLockVersion(latestLockVersion);
              saveLockVersionRef.current = latestLockVersion;
              persistedDraftFingerprintRef.current = JSON.stringify(parsed.data);
              setInlineEditor(null);
              setMissingPreviewPhotos([]);
              void assetsQuery.refetch();
              void draftQuery.refetch();
              void projectQuery.refetch();
            }}
          />
        ) : null}
      </div>

      {showVersions ? (
        <VersionsDrawer
          projectId={projectId}
          onClose={() => setShowVersions(false)}
          onRestore={(versionId) =>
            restoreVersion.mutate(versionId, {
              onSuccess: () => {
                loadedRef.current = false;
                setShowVersions(false);
                toast.success('Versao restaurada no rascunho.');
              },
            })
          }
        />
      ) : null}
    </div>
  );
}

function EditorTopBar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  viewport,
  onViewportChange,
  saveState,
  onShowVersions,
  onCreateVersion,
  onShowPublish,
  warningCount,
  errorCount,
  onShowIssues,
}: {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  viewport: 'desktop' | 'mobile';
  onViewportChange: (v: 'desktop' | 'mobile') => void;
  saveState: 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
  onShowVersions: () => void;
  onCreateVersion: () => void;
  onShowPublish: () => void;
  warningCount: number;
  errorCount: number;
  onShowIssues: () => void;
}) {
  const saveLabel = {
    idle: '',
    saving: 'Salvando...',
    saved: 'Salvo',
    error: 'Erro ao salvar',
    conflict: 'Conflito',
  }[saveState];

  return (
    <div className="flex max-w-full items-center gap-1 overflow-x-auto border-b border-border px-2 py-2 md:gap-2 md:px-3">
      <Button variant="secondary" size="sm" onClick={onUndo} disabled={!canUndo}>
        <Undo2 className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button variant="secondary" size="sm" onClick={onRedo} disabled={!canRedo}>
        <Redo2 className="h-4 w-4" aria-hidden="true" />
      </Button>

      <div className="ml-1 hidden rounded-md border border-border sm:flex md:ml-2">
        <button
          type="button"
          onClick={() => onViewportChange('desktop')}
          className={'flex items-center gap-1 px-2 py-1 text-xs ' + (viewport === 'desktop' ? 'bg-primary-soft text-primary' : '')}
        >
          <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
          Computador
        </button>
        <button
          type="button"
          onClick={() => onViewportChange('mobile')}
          className={'flex items-center gap-1 border-l border-border px-2 py-1 text-xs ' + (viewport === 'mobile' ? 'bg-primary-soft text-primary' : '')}
        >
          <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
          Celular
        </button>
      </div>

      <span className="shrink-0 text-xs text-muted-foreground">{saveLabel}</span>

      {errorCount > 0 ? <button type="button" onClick={onShowIssues} aria-label="Ver detalhes dos erros"><Badge tone="danger">{errorCount} erro(s) · detalhes</Badge></button> : null}
      {warningCount > 0 ? <button type="button" onClick={onShowIssues} aria-label="Ver detalhes dos avisos"><Badge tone="warning">{warningCount} aviso(s) · detalhes</Badge></button> : null}

      <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
        <Button className="hidden sm:inline-flex" variant="secondary" size="sm" onClick={onCreateVersion}>
          Criar versao
        </Button>
        <Button className="hidden sm:inline-flex" variant="secondary" size="sm" onClick={onShowVersions}>
          Historico
        </Button>
        <Button size="sm" onClick={onShowPublish}>
          Publicar
        </Button>
      </div>
    </div>
  );
}

function VersionsDrawer({
  projectId,
  onClose,
  onRestore,
}: {
  projectId: string;
  onClose: () => void;
  onRestore: (versionId: string) => void;
}) {
  const project = useSiteProject(projectId);
  const versions = project.data?.versions ?? [];

  return (
    <div className="border-t border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">Historico de versoes</p>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </div>
      <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
        {versions.map((version) => (
          <li key={version.id} className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-muted">
            <span>
              #{version.versionNumber} · {version.origin} · {version.summary ?? 'sem resumo'}
            </span>
            <Button size="sm" variant="ghost" onClick={() => onRestore(version.id)}>
              Restaurar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
