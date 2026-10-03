/**
 * Pagina de um projeto de site com IA.
 *
 * Mostra o que for pertinente ao estado atual: fila/gerando -> progresso ao
 * vivo; falhou -> erro com retomada; pronto/publicado -> o editor visual
 * completo, sobre esta mesma pagina.
 */
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

import { formatDate } from '@shared/format';
import { SITE_PROJECT_STATUS_LABELS, isProjectBusy, type SiteProjectStatus } from '@site-kit/types/site-ai';
import { PageBody, PageHeader } from '../components/layout/AppLayout';
import { SiteEditor } from '../components/site-ai/editor/SiteEditor';
import { SiteProgressView } from '../components/site-ai/SiteProgressView';
import { useArchiveSiteProject, useGenerateSite, useSiteProject } from '../hooks/useSiteAi';
import { formatUsd } from '../lib/site-ai-format';
import { Badge, Button, Callout, ErrorState, LoadingBlock } from '../components/ui';
import { useToast } from '../components/ui/Toast';

export default function SiteProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const query = useSiteProject(projectId ?? null);
  const generate = useGenerateSite(projectId ?? '');
  const archive = useArchiveSiteProject();

  if (query.isLoading) return <LoadingBlock label="Carregando projeto..." />;
  if (query.isError || !query.data) {
    return <ErrorState message="Projeto nao encontrado ou voce nao tem acesso a ele." />;
  }

  const { project, jobs } = query.data;
  const latestJob = jobs[0];
  const busy = isProjectBusy(project.status as SiteProjectStatus);
  const editable = project.status === 'READY' || project.status === 'PUBLISHED';

  const header = (
    <PageHeader
      title={project.businessName}
      description={`${SITE_PROJECT_STATUS_LABELS[project.status]} · atualizado em ${formatDate(project.updatedAt)}`}
      actions={
        <div className="flex items-center gap-2">
          <Badge tone="outline">Custo: {formatUsd(project.costAccumulatedUsd)}</Badge>
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
        <SiteEditor projectId={project.id} />
      </>
    );
  }

  return (
    <>
      {header}
      <PageBody className="mx-auto max-w-3xl space-y-4">
        {project.status === 'BRIEFING' ? (
          <Callout tone="neutral" title="Este projeto ainda nao foi gerado">
            <div className="flex items-center justify-between gap-3">
              <span>O briefing esta salvo. Inicie a geracao quando estiver pronto.</span>
              <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
                {generate.isPending ? 'Enviando...' : 'Gerar agora'}
              </Button>
            </div>
          </Callout>
        ) : null}

        {(busy || project.status === 'FAILED') && latestJob ? (
          <SiteProgressView projectId={project.id} jobId={latestJob.id} />
        ) : null}
      </PageBody>
    </>
  );
}
