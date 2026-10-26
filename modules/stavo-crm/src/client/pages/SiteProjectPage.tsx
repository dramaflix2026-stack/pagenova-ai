/**
 * Pagina de um projeto de site com IA.
 *
 * Mostra o que for pertinente ao estado atual: fila/gerando -> progresso ao
 * vivo; falhou -> erro com retomada; pronto/publicado -> o editor visual
 * completo, sobre esta mesma pagina.
 */
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import { formatDate } from '@shared/format';
import { SITE_PROJECT_STATUS_LABELS, isProjectBusy, type SiteProjectStatus } from '@site-kit/types/site-ai';
import { PageBody, PageHeader } from '../components/layout/AppLayout';
import { SiteEditor } from '../components/site-ai/editor/SiteEditor';
import { SiteProgressView } from '../components/site-ai/SiteProgressView';
import { useArchiveSiteProject, useGenerateSite, useSiteProject, useSiteDraftConfig } from '../hooks/useSiteAi';
import { SiteCreditsNotice, siteCreditsExhausted, usePageNovaSiteCredits } from '../components/site-ai/SiteCreditsNotice';
import { Badge, Button, Callout, ErrorState, LoadingBlock } from '../components/ui';
import { useToast } from '../components/ui/Toast';

export default function SiteProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams]=useSearchParams();
  const handoffStarted=useRef(false);
  const toast = useToast();
  const query = useSiteProject(projectId ?? null);
  const generate = useGenerateSite(projectId ?? '');
  const archive = useArchiveSiteProject();
  const credits = usePageNovaSiteCredits();
  const noSiteCredits = siteCreditsExhausted(credits.data);

  const project = query.data?.project;
  const jobs = query.data?.jobs ?? [];
  const latestJob = jobs[0];
  const busy = project ? isProjectBusy(project.status as SiteProjectStatus) : false;
  const editable = project ? project.status === 'READY' || project.status === 'PUBLISHED' : false;
  const savedConfig=useSiteDraftConfig(editable ? projectId ?? null : null);
  const modernSelection=(savedConfig.data?.config as {project?:{builderV2TemplateId?:string}}|null)?.project?.builderV2TemplateId;
  const showLegacy=searchParams.get('crmLegacy')==='1';
  const studioTemplates=['institutional-complete','minimalist-sophisticated','modern-impactful','image-text-alternating'];
  const openInStudio=editable&&!showLegacy&&studioTemplates.includes(modernSelection||'');
  const checkingEditor=editable&&!showLegacy&&savedConfig.isPending;
  const refreshAfterGeneration=useCallback(()=>{void query.refetch();},[query.refetch]);

  // Hooks precisam rodar na mesma ordem em todos os renders. Antes este hook
  // ficava depois dos returns de loading/error; quando a query terminava de
  // carregar, o React recebia um hook extra e a pagina podia desmontar inteira.
  useEffect(() => {
    if (latestJob?.status === 'SUCCEEDED' && !editable) {
      void query.refetch();
    }
  }, [latestJob?.status, editable, query.refetch]);

  useEffect(()=>{
    // Never render the old SiteEditor for new Builder V2 projects, even for a
    // single frame while the generated CRM config is being retrieved.
    if(!openInStudio||!projectId||handoffStarted.current)return;
    handoffStarted.current=true;
    window.top?.location.replace('/app/builder-v2?crmProject='+encodeURIComponent(projectId));
  },[openInStudio,projectId]);
  
  if (query.isLoading) return <LoadingBlock label="Carregando projeto..." />;
  if (query.isError || !query.data || !project) {
    return <ErrorState message="Projeto nao encontrado ou voce nao tem acesso a ele." />;
  }

  // The config query is async. While it resolves, render only the handoff UI.
  // Rendering SiteEditor here caused the old site to flash for a moment before
  // useEffect redirected to the original Builder 2.0.
  if(openInStudio||checkingEditor||handoffStarted.current){
    return <PageBody className="mx-auto flex min-h-[65dvh] max-w-3xl items-center justify-center px-4">
      <div role="status" aria-live="polite" className="w-full max-w-md rounded-2xl border border-primary/25 bg-surface p-7 text-center shadow-sm">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" aria-hidden="true"/>
        <h1 className="text-lg font-semibold text-foreground">Preparando seu site no PageNova Studio</h1>
        <p className="mt-2 text-sm text-muted-foreground">O conteúdo, a capa e as fotos do lead estão sendo preparados para edição.</p>
      </div>
    </PageBody>;
  }
  if(!showLegacy&&editable&&savedConfig.isError){
    return <PageBody className="mx-auto max-w-lg space-y-3 px-4 py-8">
      <ErrorState message="Não foi possível verificar o editor deste projeto. O site gerado permanece salvo."/>
      <div className="flex flex-wrap gap-2">
        <Button onClick={()=>void savedConfig.refetch()}>Tentar novamente</Button>
        <Button variant="secondary" onClick={()=>navigate('/sites-ia/'+projectId+'?crmLegacy=1')}>Abrir editor anterior</Button>
      </div>
    </PageBody>;
  }

  const header = (
    <PageHeader
      title={project.businessName}
      description={`${SITE_PROJECT_STATUS_LABELS[project.status]} · atualizado em ${formatDate(project.updatedAt)}`}
      actions={
        <div className="flex items-center gap-2">
          {editable ? (
            <Button onClick={() => {
              const url="/app/builder-v2?crmProject="+encodeURIComponent(project.id);
              // CRM lives inside a same-origin iframe. Open the original
              // Studio Builder at the workspace level, not inside this iframe.
              window.top?.location.assign(url);
            }}>
              Abrir no Builder 2.0
            </Button>
          ) : null}
          {editable&&modernSelection&&!showLegacy ? (
            <Button variant="secondary" onClick={()=>navigate('/sites-ia/'+project.id+'?crmLegacy=1')}>
              Editor anterior
            </Button>
          ) : null}
          {editable ? (
            <Button variant="secondary" onClick={() => document.getElementById('site-editor-preview')?.scrollIntoView({ behavior: 'smooth' })}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              Visualizar site
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => navigate('/sites-ia')}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar
          </Button>
          {!busy && project.status !== 'ARCHIVED' ? (
            <Button
              variant="secondary"
              onClick={() =>
                archive.mutate(project.id, {
                  onSuccess: () => {
                    toast.success('Projeto arquivado.');
                    navigate('/sites-ia');
                  },
                })
              }
              disabled={archive.isPending}
            >
              Arquivar
            </Button>
          ) : null}
        </div>
      }
    />
  );

  // O editor precisa da largura inteira da tela (tres colunas + previa) e
  // gerencia o proprio scroll interno -- nao cabe dentro do corpo estreito e
  // centralizado que as demais telas do modulo usam.
  if (editable) {
    return (
      <>
        {header}
        <div id="site-editor-preview">
          <SiteEditor projectId={project.id} />
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <PageBody className="mx-auto max-w-3xl space-y-4">
        {(project.status === 'BRIEFING' || project.status === 'FAILED') && <SiteCreditsNotice compact />}
        {project.status === 'BRIEFING' ? (
          <Callout tone="neutral" title="Este projeto ainda nao foi gerado">
            <div className="flex items-center justify-between gap-3">
              <span>O briefing esta salvo. Inicie a geracao quando estiver pronto.</span>
              <Button onClick={() => generate.mutate(undefined, { onSuccess: () => void credits.refetch() })} disabled={generate.isPending || noSiteCredits}>
                {generate.isPending ? 'Enviando...' : 'Gerar agora'}
              </Button>
            </div>
          </Callout>
        ) : null}

        {project.status === 'FAILED' ? (
          <Callout tone="neutral" title="A ultima geracao falhou">
            <div className="flex items-center justify-between gap-3">
              <span>O lead e o briefing continuam salvos. Inicie uma nova geracao com os dados deste projeto.</span>
              <Button onClick={() => generate.mutate(undefined, { onSuccess: () => void credits.refetch() })} disabled={generate.isPending || noSiteCredits}>
                {generate.isPending ? 'Enviando...' : 'Gerar novamente'}
              </Button>
            </div>
          </Callout>
        ) : null}

        {(busy || project.status === 'FAILED') && latestJob ? (
          <SiteProgressView
            projectId={project.id}
            jobId={latestJob.id}
            onCompleted={refreshAfterGeneration}
          />
        ) : null}
      </PageBody>
    </>
  );
}
