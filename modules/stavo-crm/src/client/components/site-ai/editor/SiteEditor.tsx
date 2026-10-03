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
import { PropertiesPanel } from './PropertiesPanel';
import { PublishPanel } from './PublishPanel';
import { SectionsPanel } from './SectionsPanel';

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
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'conflict'>('idle');
  const [conflictConfig, setConflictConfig] = useState<SiteSchemaModel | null>(null);
  const [aiInstruction, setAiInstruction] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [showPublish, setShowPublish] = useState(false);

  const loadedRef = useRef(false);

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
      resolveAsset: (assetId) => {
        const asset = byId.get(assetId);
        return asset ? { url: asset.url, width: asset.width ?? undefined, height: asset.height ?? undefined } : null;
      },
    };
  }, [assetsQuery.data]);

  const html = useMemo(() => (config ? renderSite(config, previewCtx) : ''), [config, previewCtx]);
  const lintReport = useMemo(() => (config ? lintSite(config) : null), [config]);

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
    setConflictConfig(null);
    setSaveState('saved');
    toast.error('Suas alteracoes locais foram descartadas: a versao mais recente do servidor foi carregada.');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
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

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 shrink-0">
          <SectionsPanel
            sections={config.sections}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={handleReorder}
            onToggleVisible={handleToggleVisible}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        </div>

        <div className="flex flex-1 items-start justify-center overflow-auto bg-muted p-4">
          <iframe
            title="Previa do site"
            srcDoc={html}
            className={
              'h-full rounded-md border border-border bg-white shadow-sm transition-all ' +
              (viewport === 'mobile' ? 'w-[390px]' : 'w-full max-w-5xl')
            }
          />
        </div>

        <div className="w-80 shrink-0 border-l border-border">
          {selectedSection ? (
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-y-auto">
                <PropertiesPanel
                  projectId={projectId}
                  section={selectedSection}
                  anchors={anchors}
                  onChange={handleSectionChange}
                />
              </div>
              <div className="border-t border-border p-3">
                <Textarea
                  rows={2}
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  placeholder='Comando para a IA, ex.: "deixe mais direto"'
                />
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={handleAiEdit}
                  disabled={!aiInstruction.trim() || aiEdit.isPending}
                >
                  {aiEdit.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  Editar com IA
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
              Selecione uma secao para editar.
            </div>
          )}
        </div>

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
    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
      <Button variant="secondary" size="sm" onClick={onUndo} disabled={!canUndo}>
        <Undo2 className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button variant="secondary" size="sm" onClick={onRedo} disabled={!canRedo}>
        <Redo2 className="h-4 w-4" aria-hidden="true" />
      </Button>

      <div className="ml-2 flex rounded-md border border-border">
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

      <span className="text-xs text-muted-foreground">{saveLabel}</span>

      {errorCount > 0 ? <Badge tone="danger">{errorCount} erro(s)</Badge> : null}
      {warningCount > 0 ? <Badge tone="warning">{warningCount} aviso(s)</Badge> : null}

      <div className="ml-auto flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onCreateVersion}>
          Criar versao
        </Button>
        <Button variant="secondary" size="sm" onClick={onShowVersions}>
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
