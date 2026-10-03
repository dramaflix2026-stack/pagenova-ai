/**
 * Consultas e mutacoes de Sites com IA.
 *
 * Segue o mesmo padrao de `useCrm.ts`: toda mutacao que custa dinheiro ou
 * cria algo leva idempotency key, para o clique duplo nunca virar duas
 * chamadas pagas nem dois projetos.
 */
import { useEffect, useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateSiteProjectInput } from '@shared/schemas';
import type { SiteJobStage, SiteJobStatus, SiteProjectStatus } from '@site-kit/types/site-ai';
import { api, buildQuery, newIdempotencyKey } from '../lib/api';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../lib/constants';

export interface SiteAiDiagnostics {
  enabled: boolean;
  mode: 'real' | 'mock' | 'bloqueado';
  anthropicConfigured: boolean;
  openAiConfigured: boolean;
  imageGenerationEnabled: boolean;
  siteModel: string;
  fastModel: string;
  imageModel: string;
  publicBaseUrl: string;
  storageDriver: string;
  storageDir: string;
  monthlyBudgetUsd: number;
  projectBudgetUsd: number;
  jobConcurrency: number;
  blockedReason: string | null;
}

export interface SiteProjectSummary {
  id: string;
  leadId: string | null;
  internalName: string;
  businessName: string;
  siteType: string;
  status: SiteProjectStatus;
  desiredSlug: string | null;
  currentVersionNumber: number;
  activePublicationId: string | null;
  lockVersion: number;
  costAccumulatedUsd: string;
  lastFailureCode: string | null;
  lastFailureMessage: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface SiteJobSummary {
  id: string;
  projectId: string;
  type: string;
  status: SiteJobStatus;
  stage: SiteJobStage | null;
  progress: number;
  attempt: number;
  maxAttempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  errorRetryable: boolean | null;
  cancelRequestedAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface SiteProjectDetail {
  project: SiteProjectSummary;
  versions: Array<{
    id: string;
    versionNumber: number;
    origin: string;
    summary: string | null;
    createdAt: string;
  }>;
  jobs: SiteJobSummary[];
}

export const siteAiKeys = {
  diagnostics: ['site-ai', 'diagnostics'] as const,
  projects: (filters: object) => ['site-ai', 'projects', filters] as const,
  project: (id: string) => ['site-ai', 'project', id] as const,
  job: (id: string) => ['site-ai', 'job', id] as const,
};

export function useSiteAiDiagnostics(enabled = true) {
  return useQuery({
    queryKey: siteAiKeys.diagnostics,
    queryFn: () => api.get<{ diagnostics: SiteAiDiagnostics }>('/site-ai/diagnostics'),
    select: (data) => data.diagnostics,
    enabled,
    staleTime: 30_000,
  });
}

export interface SiteProjectFilters {
  status?: SiteProjectStatus;
  leadId?: string;
  search?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export function useSiteProjects(filters: SiteProjectFilters, enabled = true) {
  return useQuery({
    queryKey: siteAiKeys.projects(filters),
    queryFn: () =>
      api.get<{ projects: SiteProjectSummary[]; total: number }>(`/site-projects${buildQuery(filters)}`),
    enabled,
  });
}

/** Projeto ativo de um lead especifico, para decidir a acao do card/drawer. */
export function useSiteProjectByLead(leadId: string | null) {
  return useSiteProjects({ leadId: leadId ?? undefined, includeArchived: false, limit: 1 }, Boolean(leadId));
}

export function useSiteProject(id: string | null) {
  return useQuery({
    queryKey: siteAiKeys.project(id ?? ''),
    queryFn: () => api.get<SiteProjectDetail>(`/site-projects/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSiteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSiteProjectInput) => api.post<{ project: SiteProjectSummary }>('/site-projects', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['site-ai', 'projects'] });
    },
  });
}

export function useGenerateSite(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<{ jobId: string; created: boolean }>(`/site-projects/${projectId}/generate`, {
        idempotencyKey: newIdempotencyKey('sitegen'),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteAiKeys.project(projectId) });
    },
  });
}

export function useArchiveSiteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => api.post<{ project: SiteProjectSummary }>(`/site-projects/${projectId}/archive`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['site-ai'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Editor: rascunho, versoes e edicao por IA
// ---------------------------------------------------------------------------

export function useSiteDraftConfig(projectId: string | null) {
  return useQuery({
    queryKey: ['site-ai', 'config', projectId ?? ''],
    queryFn: () => api.get<{ config: unknown; lockVersion: number }>(`/site-projects/${projectId}/config`),
    enabled: Boolean(projectId),
    // O editor gerencia o proprio estado depois de carregado; refazer a busca
    // por tras sobrescreveria uma edicao em andamento.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export interface SaveConfigResult {
  project: SiteProjectSummary;
  lint: { errors: unknown[]; warnings: unknown[] };
}

export function useSaveSiteConfig(projectId: string) {
  return useMutation({
    mutationFn: (input: { config: unknown; expectedLockVersion: number }) =>
      api.patch<SaveConfigResult>(`/site-projects/${projectId}/config`, input),
  });
}

export function useCreateSiteVersion(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (summary?: string) => api.post<{ versionNumber: number }>(`/site-projects/${projectId}/versions`, { summary }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteAiKeys.project(projectId) });
    },
  });
}

export function useRestoreSiteVersion(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) =>
      api.post<{ project: SiteProjectSummary }>(`/site-projects/${projectId}/versions/${versionId}/restore`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteAiKeys.project(projectId) });
      void queryClient.invalidateQueries({ queryKey: ['site-ai', 'config', projectId] });
    },
  });
}

export function useAiEditSection(projectId: string) {
  return useMutation({
    mutationFn: (input: { sectionId: string; instruction: string }) =>
      api.post<{ project: SiteProjectSummary; section: unknown }>(
        `/site-projects/${projectId}/sections/${input.sectionId}/ai-edit`,
        { instruction: input.instruction },
      ),
  });
}

// ---------------------------------------------------------------------------
// Assets (secao 13)
// ---------------------------------------------------------------------------

export interface SiteAssetSummary {
  id: string;
  projectId: string;
  source: string;
  originalFilename: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  altText: string | null;
  focalX: number;
  focalY: number;
  rightsStatus: string;
  createdAt: string;
  url: string;
}

export function useSiteAssets(projectId: string | null) {
  return useQuery({
    queryKey: ['site-ai', 'assets', projectId ?? ''],
    queryFn: () => api.get<{ assets: SiteAssetSummary[] }>(`/site-projects/${projectId}/assets`),
    select: (data) => data.assets,
    enabled: Boolean(projectId),
  });
}

export function useUploadSiteAsset(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.upload<{ asset: SiteAssetSummary }>(`/site-projects/${projectId}/assets`, formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['site-ai', 'assets', projectId] });
    },
  });
}

export function useUpdateSiteAsset(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { assetId: string; altText?: string; focalX?: number; focalY?: number }) =>
      api.patch<{ asset: SiteAssetSummary }>(`/site-projects/${projectId}/assets/${input.assetId}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['site-ai', 'assets', projectId] });
    },
  });
}

export function useDeleteSiteAsset(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) => api.delete(`/site-projects/${projectId}/assets/${assetId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['site-ai', 'assets', projectId] });
    },
  });
}

// ---------------------------------------------------------------------------
// Publicacao (secao 16)
// ---------------------------------------------------------------------------

export interface SitePublicationSummary {
  id: string;
  projectId: string;
  publicationNumber: number;
  slug: string;
  status: string;
  noindex: boolean;
  smokeTestPassedAt: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  publishedAt: string | null;
  supersededAt: string | null;
  unpublishedAt: string | null;
  createdAt: string;
}

export function useSitePublications(projectId: string | null) {
  return useQuery({
    queryKey: ['site-ai', 'publications', projectId ?? ''],
    queryFn: () => api.get<{ publications: SitePublicationSummary[] }>(`/site-projects/${projectId}/publications`),
    select: (data) => data.publications,
    enabled: Boolean(projectId),
  });
}

export function usePublishSite(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { acknowledgedWarnings: boolean; desiredSlug?: string }) =>
      api.post<{ publication: SitePublicationSummary; url: string }>(`/site-projects/${projectId}/publish`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteAiKeys.project(projectId) });
      void queryClient.invalidateQueries({ queryKey: ['site-ai', 'publications', projectId] });
    },
  });
}

export function useUnpublishSite(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ project: SiteProjectSummary }>(`/site-projects/${projectId}/unpublish`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteAiKeys.project(projectId) });
      void queryClient.invalidateQueries({ queryKey: ['site-ai', 'publications', projectId] });
    },
  });
}

export function useRollbackPublication(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicationId: string) =>
      api.post<{ project: SiteProjectSummary }>(`/site-projects/${projectId}/publications/${publicationId}/rollback`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteAiKeys.project(projectId) });
      void queryClient.invalidateQueries({ queryKey: ['site-ai', 'publications', projectId] });
    },
  });
}

// ---------------------------------------------------------------------------
// Exportacao ZIP (secao 17)
// ---------------------------------------------------------------------------

/**
 * Baixa o ZIP e dispara o download do navegador.
 *
 * Nao usa `api.post` (que espera JSON): a resposta e binaria. O nome do
 * arquivo vem do cabecalho `Content-Disposition` que o servidor define.
 */
export function useExportSiteZip(projectId: string) {
  return useMutation({
    mutationFn: async (input: { allowIndexing: boolean; canonicalUrl?: string }) => {
      const csrf = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`))?.[1];
      const response = await fetch(`/api/site-projects/${projectId}/exports`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { [CSRF_HEADER_NAME]: decodeURIComponent(csrf) } : {}),
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(payload?.error?.message ?? 'Nao foi possivel exportar o site.');
      }

      const disposition = response.headers.get('content-disposition') ?? '';
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'site.zip';
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
  });
}

// ---------------------------------------------------------------------------
// WhatsApp / abordagem (secao 18)
// ---------------------------------------------------------------------------

export interface SiteOutreachMessage {
  id: string;
  projectId: string;
  publicationId: string | null;
  leadId: string | null;
  phoneSnapshot: string | null;
  messageText: string;
  editedByUser: boolean;
  openedAt: string | null;
  confirmedSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useOutreachMessages(projectId: string | null) {
  return useQuery({
    queryKey: ['site-ai', 'outreach', projectId ?? ''],
    queryFn: () => api.get<{ messages: SiteOutreachMessage[] }>(`/site-projects/${projectId}/outreach`),
    select: (data) => data.messages,
    enabled: Boolean(projectId),
  });
}

export function useGenerateOutreach(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ message: SiteOutreachMessage }>(`/site-projects/${projectId}/outreach/generate`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['site-ai', 'outreach', projectId] });
    },
  });
}

export function useEditOutreach(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, messageText }: { messageId: string; messageText: string }) =>
      api.patch<{ message: SiteOutreachMessage }>(`/site-projects/${projectId}/outreach/${messageId}`, { messageText }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['site-ai', 'outreach', projectId] });
    },
  });
}

/** Marca que o link `wa.me` foi aberto. Isto NAO confirma que a mensagem foi enviada. */
export function useMarkOutreachOpened(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      api.post<{ message: SiteOutreachMessage }>(`/site-projects/${projectId}/outreach/${messageId}/opened`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['site-ai', 'outreach', projectId] });
    },
  });
}

/** Confirmacao manual e consciente de envio -- so ela gera a atividade no lead. */
export function useConfirmOutreachSent(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      api.post<{ message: SiteOutreachMessage }>(`/site-projects/${projectId}/outreach/${messageId}/confirm-sent`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['site-ai', 'outreach', projectId] });
      void queryClient.invalidateQueries({ queryKey: siteAiKeys.project(projectId) });
    },
  });
}

export function useCancelSiteJob(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => api.post<{ job: SiteJobSummary }>(`/site-jobs/${jobId}/cancel`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteAiKeys.project(projectId) });
    },
  });
}

export function useRetrySiteJob(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => api.post<{ job: SiteJobSummary }>(`/site-jobs/${jobId}/retry`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteAiKeys.project(projectId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Progresso ao vivo
// ---------------------------------------------------------------------------

export interface SiteJobEvent {
  sequence: number;
  eventType: string;
  stage: SiteJobStage | null;
  message: string;
  createdAt: string;
}

export interface JobProgressState {
  job: SiteJobSummary | null;
  events: SiteJobEvent[];
  connected: boolean;
}

/**
 * Acompanha um job por SSE, com fallback automatico para polling.
 *
 * O estado exibido vem sempre do ULTIMO snapshot do banco recebido -- nunca
 * de contagem local. Se o navegador reconstruir o componente, o efeito
 * reconecta e continua da sequencia recebida por ultimo (secao 22.3).
 */
export function useSiteJobProgress(jobId: string | null): JobProgressState {
  const [state, setState] = useState<JobProgressState>({ job: null, events: [], connected: false });
  const lastSequence = useRef(0);

  useEffect(() => {
    if (!jobId) {
      setState({ job: null, events: [], connected: false });
      return;
    }

    setState({ job: null, events: [], connected: false });
    lastSequence.current = 0;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let source: EventSource | null = null;

    const applyEvents = (job: SiteJobSummary, events: SiteJobEvent[]) => {
      if (cancelled) return;
      setState((prev) => {
        const merged = [...prev.events];
        for (const event of events) {
          if (event.sequence > lastSequence.current) {
            merged.push(event);
            lastSequence.current = event.sequence;
          }
        }
        return { job, events: merged, connected: true };
      });
    };

    const poll = async () => {
      try {
        const data = await api.get<{ job: SiteJobSummary; events: SiteJobEvent[] }>(
          `/site-jobs/${jobId}/events?after=${lastSequence.current}`,
        );
        applyEvents(data.job, data.events);
        if (!cancelled && !isTerminal(data.job.status)) {
          pollTimer = setTimeout(() => void poll(), 2500);
        }
      } catch {
        if (!cancelled) pollTimer = setTimeout(() => void poll(), 4000);
      }
    };

    // SSE e o canal preferido; falhando (proxy sem suporte, rede instavel),
    // o polling assume sem o usuario perceber a troca.
    if (typeof EventSource !== 'undefined') {
      source = new EventSource(`/api/site-jobs/${jobId}/stream`);

      source.addEventListener('job', (event) => {
        const job = JSON.parse((event as MessageEvent).data) as SiteJobSummary;
        setState((prev) => ({ ...prev, job, connected: true }));
        if (isTerminal(job.status)) source?.close();
      });

      source.addEventListener('stage', (event) => {
        const payload = JSON.parse((event as MessageEvent).data) as Omit<SiteJobEvent, 'sequence' | 'createdAt'>;
        const sequence = Number((event as MessageEvent).lastEventId);
        if (sequence > lastSequence.current) {
          lastSequence.current = sequence;
          setState((prev) => ({
            ...prev,
            events: [...prev.events, { ...payload, sequence, createdAt: new Date().toISOString() }],
          }));
        }
      });

      source.onerror = () => {
        source?.close();
        source = null;
        if (!cancelled) void poll();
      };
    } else {
      void poll();
    }

    return () => {
      cancelled = true;
      source?.close();
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [jobId]);

  return state;
}

const isTerminal = (status: SiteJobStatus): boolean =>
  status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELED';
