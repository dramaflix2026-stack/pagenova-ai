/**
 * Editor visual (secao 15 da especificacao).
 *
 * O preview usa a MESMA `renderSite` que o servidor usa para publicar e para
 * exportar o ZIP -- e por isso que aqui ela roda dentro do navegador, sobre o
 * mesmo `SiteSchema` que este editor esta alterando. Nao existe um "renderer
 * de preview" e um "renderer de producao" com implementacoes que podem
 * divergir (secao 5.5).
 */
import { Loader2, Monitor, Redo2, Smartphone, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { renderSite, type RenderContext } from '@site-kit/renderer/render-site';
import { SITE_RUNTIME_JS } from '@site-kit/interactions/runtime';
import { siteSchema, type SiteSchemaModel, type SiteSection } from '@site-kit/schemas/site-schema';
import { lintSite } from '@site-kit/utils/linter';
import { useHistoryState } from '../../../hooks/useHistoryState';
import {
  useAiEditSection,
  useCreateSiteVersion,
  useRestoreSiteVersion,
  useSaveSiteConfig,
  useSiteAssets,
  useSiteDraftConfig,
  useSiteProject,
} from '../../../hooks/useSiteAi';
import { Badge, Button, Callout, LoadingBlock, Textarea } from '../../ui';
import { useToast } from '../../ui/Toast';
import { PublishPanel } from './PublishPanel';

const AUTOSAVE_DELAY_MS = 1200;

interface SiteEditorProps {
  projectId: string;
}

export function SiteEditor({ projectId }: SiteEditorProps) {
  const toast = useToast();
  const draftQuery = useSiteDraftConfig(projectId);
  const projectQuery = useSiteProject(projectId);
  const assetsQuery = useSiteAssets(projectId);
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
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const editElementRef = useRef<HTMLElement | null>(null);
  const [inlineEditor, setInlineEditor] = useState<{ x: number; y: number } | null>(null);

  const loadedRef = useRef(false);

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

  const lintReport = useMemo(() => {
    if (!config) return null;
    try {
      return lintSite(config);
    } catch {
      return null;
    }
  }, [config]);

  const selectedSection = config?.sections.find((s) => s.id === selectedId) ?? null;
  const anchors = config?.sections.map((s) => s.anchor).filter((a): a is string => Boolean(a)) ?? [];

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

  const replaceTextInSection = (section: SiteSection, before: string, after: string): SiteSection => {
    let replaced = false;
    const walk = (value: unknown): unknown => {
      if (!replaced && typeof value === 'string' && value.trim() === before.trim()) {
        replaced = true;
        return after;
      }
      if (Array.isArray(value)) return value.map(walk);
      if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
          out[key] = ['id', 'type', 'variant', 'anchor'].includes(key) ? child : walk(child);
        }
        return out;
      }
      return value;
    };
    return walk(section) as SiteSection;
  };

  const installInlineEditor = () => {
    const frame = previewFrameRef.current;
    const doc = frame?.contentDocument;
    if (!doc) return;

    doc.addEventListener('dblclick', (event) => {
      const target = event.target instanceof frame.contentWindow!.HTMLElement ? event.target as HTMLElement : null;
      if (!target || !target.textContent?.trim()) return;
      const editable = target.closest('h1,h2,h3,h4,p,span,a,button,li') as HTMLElement | null;
      if (!editable) return;

      event.preventDefault();
      event.stopPropagation();
      editElementRef.current = editable;
      const original = editable.innerText;
      editable.contentEditable = 'true';
      editable.dataset.pnOriginalText = original;
      editable.style.outline = '2px solid #31d6a1';
      editable.style.outlineOffset = '3px';
      editable.focus();

      const rect = editable.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      setInlineEditor({
        x: Math.max(12, Math.min(frameRect.left + rect.left, window.innerWidth - 330)),
        y: Math.max(8, frameRect.top + rect.top - 52),
      });

      editable.onblur = () => {
        const before = editable.dataset.pnOriginalText ?? original;
        const after = editable.innerText.trim();
        editable.contentEditable = 'false';
        editable.style.outline = '';
        editable.style.outlineOffset = '';
        if (after && after !== before) {
          const sectionNode = editable.closest('section[id]');
          const anchorId = sectionNode?.id;
          const section = config.sections.find((item) => item.anchor === anchorId)
            ?? config.sections.find((item) => item.id === anchorId);
          if (section) handleSectionChange(replaceTextInSection(section, before, after));
        }
        window.setTimeout(() => setInlineEditor(null), 120);
      };
    });
  };

  const styleInlineElement = (
    property: 'fontSize' | 'fontFamily' | 'color' | 'fontWeight' | 'fontStyle' | 'textAlign',
    value: string,
  ) => {
    const element = editElementRef.current;
    if (!element) return;
    element.style[property] = value;

    const key = element.dataset.pnEdit;
    if (key) {
      const previous = config.visualTextEdits.find((item) => item.key === key) ?? { key };
      const patch =
        property === 'fontSize'
          ? { fontSizePx: Number.parseInt(value, 10) }
          : property === 'fontFamily'
            ? { fontFamily: value.split(',')[0]!.trim() as 'Inter' | 'Poppins' | 'Montserrat' | 'Georgia' }
            : property === 'color'
              ? { color: value }
              : property === 'fontWeight'
                ? { fontWeight: value as '400' | '500' | '600' | '700' | '800' | '900' }
                : property === 'fontStyle'
                  ? { fontStyle: value as 'normal' | 'italic' }
                  : { textAlign: value as 'left' | 'center' | 'right' };
      const nextEdit = { ...previous, ...patch };
      history.set({
        ...config,
        visualTextEdits: [...config.visualTextEdits.filter((item) => item.key !== key), nextEdit],
      });
    }
    element.focus();
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
      />

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
              onLoad={installInlineEditor}
              title="Previa do site"
              srcDoc={previewResult.html}
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

        {showPublish ? (
          <PublishPanel
            projectId={projectId}
            currentSlug={projectQuery.data?.project.desiredSlug ?? null}
            onClose={() => setShowPublish(false)}
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

      {errorCount > 0 ? <Badge tone="danger">{errorCount} erro(s)</Badge> : null}
      {warningCount > 0 ? <Badge tone="warning">{warningCount} aviso(s)</Badge> : null}

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
