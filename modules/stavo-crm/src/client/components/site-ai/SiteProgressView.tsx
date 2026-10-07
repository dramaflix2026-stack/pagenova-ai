/**
 * Progresso ao vivo de uma geracao (secao 22.2/22.3).
 *
 * So mostra etapas que REALMENTE aconteceram -- vindas do banco via
 * `useSiteJobProgress`. Nao ha timer nem barra que anda sozinha: se o
 * servidor nao confirmou a etapa, ela aparece como pendente, parada.
 */
import { CheckCircle2, CircleDashed, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

import { SITE_JOB_STAGES, SITE_JOB_STAGE_LABELS, stageProgress, type SiteJobStage } from '@site-kit/types/site-ai';
import { formatDateTime } from '@shared/format';
import { useCancelSiteJob, useGenerateSite, useRetrySiteJob, useSiteJobProgress, type SiteJobSummary } from '../../hooks/useSiteAi';
import { Button, Callout } from '../ui';

interface SiteProgressViewProps {
  projectId: string;
  jobId: string;
  onCompleted?: () => void;
}

export function SiteProgressView({ projectId, jobId, onCompleted }: SiteProgressViewProps) {
  const { job, events, connected } = useSiteJobProgress(jobId);
  const cancel = useCancelSiteJob(projectId);
  const retry = useRetrySiteJob(projectId);
  const generate = useGenerateSite(projectId);

  const completedStages = new Set(
    events.filter((e) => e.stage && (e.eventType === 'STAGE_STARTED' || e.eventType === 'COMPLETED')).map((e) => e.stage),
  );

  useEffect(() => {
    if (job?.status === 'SUCCEEDED') onCompleted?.();
  }, [job?.status, onCompleted]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{statusLabel(job)}</p>
          <p className="text-xs text-muted-foreground">
            {connected ? 'Acompanhando em tempo real.' : 'Reconectando...'}
          </p>
        </div>
        {job?.status === 'PENDING' || job?.status === 'RUNNING' ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => cancel.mutate(jobId)}
            disabled={cancel.isPending || Boolean(job.cancelRequestedAt)}
          >
            {job.cancelRequestedAt ? 'Cancelando...' : 'Cancelar'}
          </Button>
        ) : null}
      </div>

      <ol className="space-y-2">
        {SITE_JOB_STAGES.map((stage) => (
          <StageRow
            key={stage}
            stage={stage}
            done={completedStages.has(stage) && stage !== job?.stage}
            current={job?.stage === stage && (job.status === 'RUNNING' || job.status === 'PENDING')}
          />
        ))}
      </ol>

      {job?.status === 'SUCCEEDED' ? (
        <Callout tone="success" title="Site criado com sucesso">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>O site esta pronto. Abrindo o editor para revisao...</p>
            {onCompleted ? <Button size="sm" onClick={onCompleted}>Abrir site agora</Button> : null}
          </div>
        </Callout>
      ) : null}

      {job?.status === 'FAILED' ? (
        <Callout tone="danger" title="A geracao falhou">
          <p>{job.errorMessage ?? 'Erro nao especificado.'}</p>
          {job.errorRetryable && job.attempt < job.maxAttempts ? (
            <Button className="mt-2" size="sm" onClick={() => retry.mutate(jobId)} disabled={retry.isPending}>
              Tentar novamente
            </Button>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Este job esgotou as tentativas. Inicie uma nova geracao com o briefing salvo.
              </p>
              <Button size="sm" onClick={() => generate.mutate()} disabled={generate.isPending}>
                {generate.isPending ? 'Enviando...' : 'Gerar novamente'}
              </Button>
            </div>
          )}
        </Callout>
      ) : null}

      {job?.status === 'CANCELED' ? (
        <Callout tone="warning" title="Geracao cancelada">
          Nenhuma cobranca adicional foi feita apos o cancelamento.
        </Callout>
      ) : null}

      <details className="rounded-md border border-border p-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground">Historico de eventos</summary>
        <ul className="mt-2 space-y-1">
          {events.map((event) => (
            <li key={event.sequence}>
              <span className="tabular-nums">{formatDateTime(event.createdAt)}</span> — {event.message}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function statusLabel(job: SiteJobSummary | null): string {
  if (!job) return 'Carregando...';
  switch (job.status) {
    case 'PENDING':
      return 'Na fila, aguardando um worker livre.';
    case 'RUNNING':
      return job.stage ? SITE_JOB_STAGE_LABELS[job.stage] : 'Trabalhando...';
    case 'SUCCEEDED':
      return 'Site pronto para revisao.';
    case 'FAILED':
      return 'A geracao falhou.';
    case 'CANCELED':
      return 'Geracao cancelada.';
    default:
      return job.status;
  }
}

function StageRow({ stage, done, current }: { stage: SiteJobStage; done: boolean; current: boolean }) {
  const Icon = done ? CheckCircle2 : current ? Loader2 : CircleDashed;

  return (
    <li className="flex items-center gap-3 text-sm">
      <Icon
        className={
          'h-4 w-4 shrink-0 ' +
          (done ? 'text-success' : current ? 'animate-spin text-primary' : 'text-muted-foreground')
        }
        aria-hidden="true"
      />
      <span className={done || current ? 'text-foreground' : 'text-muted-foreground'}>
        {SITE_JOB_STAGE_LABELS[stage]}
      </span>
      <span className="ml-auto text-xs text-muted-foreground">{stageProgress(stage)}%</span>
    </li>
  );
}
