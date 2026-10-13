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
} from '../../../hooks/useSiteAi';
import { Badge, Button, Callout, LoadingBlock, Textarea } from '../../ui';
import { useToast } from '../../ui/Toast';
import { PublishPanel } from './PublishPanel';

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
  const pendingImageRef = useRef<{ sectionId: string; slot: PhotoSlot } | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const [inlineEditor, setInlineEditor] = useState<{ x: number; y: number; kind: 'text' | 'image' } | null>(null);
  const [missingPreviewPhotos, setMissingPreviewPhotos] = useState<string[]>([]);

  const loadedRef = useRef(false);
  const skipNextAutosaveRef = useRef(false);

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
      setSelectedId(parsed.data.sections[0]?.id ?? null);
      loadedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftQuery.data]);

  const config = history.value;

  // Autosave debounced. Nunca salva so no localStorage (secao 15.8): o banco
  // e sempre a fonte persistente, mesmo que o navegador feche no meio.
  useEffect(() => {
    if (!config || !loadedRef.current) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      setSaveState('saved');
      return;
    }

    setSaveState('saving');
    const timer = setTimeout(() => {
      saveConfig.mutate(
        { config, expectedLockVersion: lockVersion },
        {
          onSuccess: (result) => {
            setLockVersion(result.project.lockVersion);
            setSaveState('saved');
          },
          onError: (error: unknown) => {
            const details = (error as { details?: { config?: unknown; project?: { lockVersion: number } } })?.details;
            if (details?.config) {
              setConflictConfig(details.config as SiteSchemaModel);
              setSaveState('conflict');
            } else {
              setSaveState('error');
            }
          },
        },
      );
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.ctrlKey || event.metaKey;
      if (!meta) return;
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        history.undo();
      } else if (event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault();
        history.redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [history]);

  // Mesmo renderer do servidor, resolvendo cada asset pela URL autenticada
  // real -- e assim que o preview deixa de ser uma aproximacao e passa a ser
  // literalmente o que sera publicado (secao 5.5).
  const previewCtx = useMemo<RenderContext>(() => {
    const byId = new Map((assetsQuery.data ?? []).map((asset) => [asset.id, asset]));
    return {
      profile: 'DEMO',
      inlineRuntime: SITE_RUNTIME_JS,
      resolveAsset: (assetId) => {
        const asset = byId.get(assetId);
        return asset ? { url: asset.url, width: asset.width ?? undefined, height: asset.height ?? undefined } : null;
      },
    };
  }, [assetsQuery.data]);

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
    if (typeof serverLockVersion === 'number') setLockVersion(serverLockVersion);
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
  const finishInlineEdit = (save = true) => {
    const element = editElementRef.current;
    if (!element) { setInlineEditor(null); return; }
    const before = originalTextRef.current;
    const after = element.innerText.trim();
    const isPhoto = element.tagName === 'IMG';
    element.contentEditable = 'false';
    element.style.outline = '';
    element.style.outlineOffset = '';
    let nextSections = config.sections;
    let changed = false;
    if (save && !isPhoto && after && after !== before) {
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
        toast.error('Este texto do template ainda não tem campo editável.');
        element.innerText = before;
      }
    } else if (!save && !isPhoto) {
      element.innerText = before;
    }
    let nextStyles = config.visualTextEdits;
    const pending = pendingStyleRef.current;
    if (save && pending?.key) {
      nextStyles = [...nextStyles.filter((item) => item.key !== pending.key),pending];
      changed = true;
    }
    rememberScroll();
    editElementRef.current = null;
    pendingStyleRef.current = null;
    dragRef.current = null;
    setInlineEditor(null);
    if (changed && save) history.set({ ...config, sections: nextSections, visualTextEdits: nextStyles });
  };
  const showToolbar = (element: HTMLElement, x: number, y: number, kind: 'text' | 'image') => {
    const rect = previewFrameRef.current?.getBoundingClientRect();
    if (!rect) return;
    editElementRef.current = element;
    const key = element.dataset.pnEdit;
    pendingStyleRef.current = key
      ? { ...(config.visualTextEdits.find((e) => e.key === key) ?? { key }) }
      : null;
    const width = Math.min(420,window.innerWidth - 16);
    setInlineEditor({
      x: Math.max(8,Math.min(rect.left+x-width/2,window.innerWidth-width-8)),
      y: Math.max(54,Math.min(rect.top+y-100,window.innerHeight-165)),
      kind,
    });
  };
  const installInlineEditor = () => {
    const frame = previewFrameRef.current;
    const doc = frame?.contentDocument;
    if (!frame || !doc) return;
    frame.contentWindow?.scrollTo(scrollRef.current.x,scrollRef.current.y);
    const style = doc.createElement('style');
    style.textContent = '[data-pn-edit]:hover{outline:1px dashed #06b6a5;outline-offset:3px}' +
      'img[data-pn-photo]{cursor:pointer}' +
      '[contenteditable=true]{outline:2px solid #06b6a5!important;outline-offset:3px}';
    doc.head.appendChild(style);
    doc.addEventListener('click',(event) => {
      const target = event.target as HTMLElement;
      if (target.closest('a[href]')) event.preventDefault();
      const img = target.closest('img[data-pn-photo]') as HTMLImageElement | null;
      if (!img) return;
      event.preventDefault();
      const section = selectedSource(img);
      const slot = img.dataset.pnPhoto as PhotoSlot | undefined;
      if (!section || !slot || !['hero','about','operation'].includes(slot)) return;
      if (editElementRef.current && editElementRef.current !== img) finishInlineEdit();
      pendingImageRef.current = { sectionId:section.id,slot };
      showToolbar(img,event.clientX,event.clientY,'image');
    });
    doc.addEventListener('dblclick',(event) => {
      const target = event.target as HTMLElement;
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
      const text = target.closest('[data-pn-edit]') as HTMLElement | null;
      if (!text || text.tagName === 'IMG' || !text.innerText?.trim() ||
          text.closest('.pn-kpi-clone,[aria-hidden="true"]')) return;
      event.preventDefault();
      event.stopPropagation();
      if (editElementRef.current && editElementRef.current !== text) finishInlineEdit();
      originalTextRef.current = text.innerText.trim();
      text.contentEditable = 'true';
      text.focus();
      showToolbar(text,event.clientX,event.clientY,'text');
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
      if (!el || el.tagName === 'IMG') return;
      if (!el.contains(event.target as Node)) finishInlineEdit();
    });
  };
  const uploadInlinePhoto = async (file: File) => {
    const target = pendingImageRef.current;
    if (!target) return;
    try {
      const { asset } = await uploadAsset.mutateAsync(file);
      if (!asset) throw new Error('Arquivo não retornado pelo servidor.');
      const ref = {
        assetId:asset.id,alt:('Imagem enviada: '+file.name).slice(0,180),
        focalX:0.5,focalY:0.5,
      };
      const sections = config.sections.map((section) => {
        if (section.id !== target.sectionId) return section;
        if (section.type === 'hero' && target.slot === 'hero') return { ...section,image:ref };
        if (section.type === 'about' && target.slot === 'about') return { ...section,image:ref };
        if (section.type === 'process' && target.slot === 'operation') return {
          ...section,steps:section.steps.map((step,i) => i === 0 ? {...step,image:ref} : step),
        };
        return section;
      });
      rememberScroll();
      await assetsQuery.refetch();
      editElementRef.current = null;
      setInlineEditor(null);
      history.set({...config,sections});
      toast.success('Imagem atualizada. Salvando automaticamente.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message :
        'Não foi possível converter a imagem. Escolha uma foto suportada.');
    } finally {
      pendingImageRef.current = null;
    }
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
    element.style.position = 'relative';
    element.style.transform = 'translate('+edit.offsetX+'px,'+edit.offsetY+'px)';
  };

  const applyUniversalVisual = () => {
    if (!config) return;
    const nextTemplate = config.project.templateId === 'frigolog-universal' ? 'standard' : 'frigolog-universal';
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
    toast.success(nextTemplate === 'frigolog-universal'
      ? 'Visual PageNova aplicado! Conteudo e imagens preservados. Revise antes de publicar.'
      : 'Visual anterior restaurado. O conteudo foi preservado.');
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
      {diagnosticsQuery.data?.universalTemplateSupported && config.project.templateId !== 'frigolog-universal' ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 bg-primary-soft px-3 py-2">
          <span className="text-xs font-medium">Novo visual PageNova: use o layout aprovado com o seu conteudo, sem gerar novamente.</span>
          <Button size="sm" variant="secondary" onClick={applyUniversalVisual}>Aplicar visual PageNova</Button>
        </div>
      ) : diagnosticsQuery.data?.universalTemplateSupported && config.project.templateId === 'frigolog-universal' ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted px-3 py-2">
          <span className="text-xs font-medium">✓ Visual PageNova ativo</span>
          <Button size="sm" variant="ghost" onClick={applyUniversalVisual}>Visual anterior</Button>
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

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <label htmlFor="pn-edit-section" className="text-xs font-semibold">Secao:</label>
        <select id="pn-edit-section" aria-label="Escolher secao para editar"
          value={selectedId ?? ''} onChange={(event) => setSelectedId(event.target.value)}
          className="min-w-0 max-w-[220px] flex-1 rounded-lg border border-border bg-surface px-2 py-2 text-xs">
          {config.sections.map((item) => <option key={item.id} value={item.id}>{item.type === 'hero' ? 'Inicio' : item.type === 'about' ? 'Sobre' : item.type === 'services' ? 'Servicos' : item.type === 'cta' ? 'Contato' : item.type} · {item.id}</option>)}
        </select>
        <Button size="sm" variant="secondary" onClick={() => setShowProperties((v) => !v)}>
          {showProperties ? 'Voltar ao site' : 'Editar textos e fotos'}
        </Button>
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
              ref={previewFrameRef}
              onLoad={() => { installInlineEditor(); checkPreviewImages(); }}
              title="Previa do site"
              srcDoc={editorPreviewHtml}
              className={'h-full rounded-md border border-border bg-white shadow-sm transition-all ' + (viewport === 'mobile' ? 'w-full max-w-[430px]' : 'w-full max-w-6xl')}
            />
          )}
        </div>

        {inlineEditor ? (
          <div
            className="fixed z-[100] flex items-center gap-1 rounded-lg border border-border bg-surface p-1.5 shadow-xl"
            style={{ left: inlineEditor.x, top: inlineEditor.y }}
            onMouseDown={(event) => event.preventDefault()}
          >
            <select className="h-8 rounded border border-border bg-surface px-2 text-xs" defaultValue="" onChange={(e) => styleInlineElement('fontSize', e.target.value)}>
              <option value="" disabled>Tamanho</option>
              <option value="14px">14</option><option value="16px">16</option><option value="20px">20</option><option value="28px">28</option><option value="36px">36</option><option value="48px">48</option>
            </select>
            <button type="button" className="h-8 w-8 rounded font-bold hover:bg-muted" onClick={() => styleInlineElement('fontWeight', editElementRef.current?.style.fontWeight === '700' ? '400' : '700')}>B</button>
            <button type="button" className="h-8 w-8 rounded italic hover:bg-muted" onClick={() => styleInlineElement('fontStyle', editElementRef.current?.style.fontStyle === 'italic' ? 'normal' : 'italic')}>I</button>
            <select className="h-8 max-w-28 rounded border border-border bg-surface px-2 text-xs" defaultValue="" onChange={(e) => styleInlineElement('fontFamily', e.target.value)}>
              <option value="" disabled>Fonte</option>
              <option value="Inter, sans-serif">Inter</option>
              <option value="Poppins, sans-serif">Poppins</option>
              <option value="Montserrat, sans-serif">Montserrat</option>
              <option value="Georgia, serif">Georgia</option>
            </select>
            <input aria-label="Cor do texto" type="color" className="h-8 w-9 cursor-pointer bg-transparent" onChange={(e) => styleInlineElement('color', e.target.value)} />
            <button type="button" title="Alinhar a esquerda" className="h-8 w-8 rounded text-xs hover:bg-muted" onClick={() => styleInlineElement('textAlign', 'left')}>L</button>
            <button type="button" title="Centralizar" className="h-8 w-8 rounded text-xs hover:bg-muted" onClick={() => styleInlineElement('textAlign', 'center')}>C</button>
            <button type="button" title="Alinhar a direita" className="h-8 w-8 rounded text-xs hover:bg-muted" onClick={() => styleInlineElement('textAlign', 'right')}>R</button>
          </div>
        ) : null}

        {showProperties && selectedSection ? (
          <aside className="absolute inset-0 z-20 flex flex-col border-l border-border bg-surface lg:static lg:w-[360px] lg:shrink-0" aria-label="Edicao das propriedades da secao">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <strong className="text-sm">Editar {selectedSection.type}</strong>
              <Button variant="ghost" size="sm" onClick={() => setShowProperties(false)}>Fechar</Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <PropertiesPanel projectId={projectId} section={selectedSection} anchors={anchors} onChange={handleSectionChange} />
            </div>
          </aside>
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
              setShowProperties(false);
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
