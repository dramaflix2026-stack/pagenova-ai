/**
 * Consultas e mutacoes do CRM.
 *
 * Toda mutacao critica envia uma idempotency_key: reenviar a mesma requisicao
 * nunca duplica evento, card ou valor.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { MoveLeadInput } from '@shared/schemas';
import { api, buildQuery, newIdempotencyKey } from '../lib/api';
import type { Meeting } from './useMeetings';
import type { BoardCardData } from '../components/crm/LeadCard';

export interface BoardColumnData {
  id: string;
  name: string;
  semanticKey: string;
  color: string;
  position: number;
  active: boolean;
  cardCount: number;
  financialTotal: string;
  cards: BoardCardData[];
}

export interface BoardResponse {
  columns: BoardColumnData[];
  totalCards: number;
}

export interface BoardFilters {
  search?: string;
  stageId?: string;
  sourceId?: string;
  serviceId?: string;
  city?: string;
  niche?: string;
  originType?: string;
  followUpStatus?: string;
  financialStatus?: string;
  completeness?: string;
  archived?: string;
  createdFrom?: string;
  createdTo?: string;
}

export const boardKey = (filters: BoardFilters) => ['board', filters] as const;

export function useBoard(filters: BoardFilters) {
  return useQuery({
    queryKey: boardKey(filters),
    queryFn: () => api.get<BoardResponse>(`/leads/board${buildQuery(filters)}`),
    staleTime: 15_000,
  });
}

export interface StageOption {
  id: string;
  name: string;
  semanticKey: string;
  color: string;
  position: number;
  active: boolean;
  isSystem: boolean;
  meaning: string | null;
}

export function useStages() {
  return useQuery({
    queryKey: ['stages'],
    queryFn: () => api.get<{ stages: StageOption[]; missingPrincipal: string[] }>('/stages'),
    staleTime: 5 * 60_000,
  });
}

export interface ServiceOption {
  id: string;
  name: string;
  description: string | null;
  billingType: 'ONE_TIME' | 'RECURRING_MONTHLY';
  defaultPrice: string;
  active: boolean;
}

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => api.get<{ services: ServiceOption[] }>('/services'),
    staleTime: 5 * 60_000,
  });
}

export interface SourceOption {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  isSystem: boolean;
}

export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: () => api.get<{ sources: SourceOption[] }>('/sources'),
    staleTime: 5 * 60_000,
  });
}

export interface LossReasonOption {
  id: string;
  name: string;
  active: boolean;
}

export function useLossReasons() {
  return useQuery({
    queryKey: ['loss-reasons'],
    queryFn: () => api.get<{ lossReasons: LossReasonOption[] }>('/loss-reasons'),
    staleTime: 5 * 60_000,
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: () => api.get<{ cities: string[]; niches: string[] }>('/leads/filter-options'),
    staleTime: 5 * 60_000,
  });
}

export interface LeadDetailResponse {
  /** Quem trabalha o lead. Nulo quando esta no pote comum. */
  owner: { id: string; name: string } | null;
  /** Calculado pelo servidor: falso quando voce so pode acompanhar. */
  canEdit: boolean;
  /** Reunioes do lead, da mais recente para a mais antiga. */
  meetings: Meeting[];
  lead: {
    id: string;
    internalName: string;
    originType: string;
    placeId: string | null;
    currentStageId: string;
    prospectingNiche: string | null;
    prospectingCity: string | null;
    prospectingState: string | null;
    prospectingCountry: string | null;
    address: string | null;
    campaignOrSearchContext: string | null;
    incompleteLevel: string;
    stageEnteredAt: string;
    createdAt: string;
    archivedAt: string | null;
    sourceId: string | null;
  };
  stageName: string;
  sourceName: string | null;
  contacts: {
    id: string;
    type: string;
    value: string;
    normalizedValue: string | null;
    origin: string;
    isPrimary: boolean;
    isConfirmed: boolean;
    isValid: boolean;
    whatsappUrl: string | null;
  }[];
  links: {
    id: string;
    type: string;
    url: string;
    normalizedHost: string | null;
    origin: string;
    isPrimary: boolean;
  }[];
  interests: {
    id: string;
    serviceId: string;
    serviceName: string;
    billingType: string;
    proposedPrice: string | null;
    status: string;
    notes: string | null;
  }[];
  activities: {
    id: string;
    activityType: string;
    body: string | null;
    occurredAt: string;
  }[];
  followUps: {
    id: string;
    dueAt: string;
    status: string;
    note: string | null;
    completedAt: string | null;
  }[];
  finance: {
    receivables: {
      id: string;
      descriptionSnapshot: string;
      referencePeriod: string | null;
      amount: string;
      dueDate: string;
      status: string;
      paidAt: string | null;
    }[];
    sales: {
      id: string;
      status: string;
      agreedAt: string;
      confirmedAt: string | null;
      total: string;
      items: { name: string; billingType: string; unitPrice: string; quantity: number }[];
    }[];
    subscriptions: {
      id: string;
      serviceNameSnapshot: string;
      amountSnapshot: string;
      status: string;
      firstDueDate: string;
      nextDueDate: string | null;
      canceledAt: string | null;
      cancellationReason: string | null;
    }[];
    pendingTotal: string;
    paidTotal: string;
  };
  completeness: { level: string; criticalIssues: string[]; warnings: string[] };
  google: { placeId: string; mapsUrl: string } | null;
}

export function useLeadDetail(leadId: string | null) {
  return useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => api.get<LeadDetailResponse>(`/leads/${leadId}`),
    enabled: Boolean(leadId),
  });
}

export interface LeadEventItem {
  id: string;
  eventType: string;
  occurredAt: string;
  payload: Record<string, unknown> | null;
}

export function useLeadHistory(leadId: string | null) {
  return useQuery({
    queryKey: ['lead-history', leadId],
    queryFn: () =>
      api.get<{
        events: LeadEventItem[];
        stageHistory: {
          id: string;
          stageName: string;
          semanticKey: string;
          enteredAt: string;
          exitedAt: string | null;
        }[];
        attemptCount: number;
      }>(`/leads/${leadId}/events`),
    enabled: Boolean(leadId),
  });
}

/**
 * Detalhes ao vivo do Google.
 * Falha aqui NAO derruba o card: o restante do drawer continua funcionando.
 */
export function useGoogleDetails(placeId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['google-details', placeId],
    queryFn: () => api.get<{ details: Record<string, unknown> }>(`/google/places/${placeId}`),
    enabled: Boolean(placeId) && enabled,
    retry: false,
    // Nao persistimos nada: cada abertura consulta e descarta.
    gcTime: 0,
    staleTime: 0,
  });
}

export interface MoveResult {
  lead: { id: string; currentStageId: string };
  applied: boolean;
  saleId: string | null;
  receivableIds: string[];
}

export function useMoveLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      input,
    }: {
      leadId: string;
      input: Omit<MoveLeadInput, 'idempotencyKey'> & { idempotencyKey?: string };
    }) =>
      api.post<MoveResult>(`/leads/${leadId}/move`, {
        ...input,
        idempotencyKey: input.idempotencyKey ?? newIdempotencyKey('move'),
      }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['board'] });
      void queryClient.invalidateQueries({ queryKey: ['lead'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}

export function useInvalidateCrm() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['board'] });
    void queryClient.invalidateQueries({ queryKey: ['lead'] });
    void queryClient.invalidateQueries({ queryKey: ['lead-history'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['finance'] });
  };
}
