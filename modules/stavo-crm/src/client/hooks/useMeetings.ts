/**
 * Consultas e mutacoes das reunioes.
 *
 * Toda mutacao envia idempotencyKey e expectedVersion:
 *  - a chave impede que clique duplo ou retry de rede criem duas reunioes;
 *  - a versao impede sobrescrever uma alteracao feita em outra aba.
 *
 * A invalidacao e coordenada de proposito: uma reuniao aparece no calendario,
 * no card do lead, no drawer, no historico e nos alertas. Esquecer uma dessas
 * chaves deixa a tela mostrando o horario antigo.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { MeetingStatus, MeetingUrgency } from '@shared/meetings';
import { api, buildQuery, newIdempotencyKey } from '../lib/api';

export interface Meeting {
  id: string;
  leadId: string;
  leadName: string;
  leadStageName: string;
  leadArchived: boolean;
  title: string;
  agenda: string | null;
  internalNotes: string | null;
  serviceId: string | null;
  serviceName: string | null;
  startAt: string;
  endAt: string;
  timezone: string;
  meetUrl: string;
  status: MeetingStatus;
  outcome: string | null;
  cancelReason: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  noShowAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingAlert {
  meetingId: string;
  leadId: string;
  leadName: string;
  title: string;
  startAt: string;
  endAt: string;
  meetUrl: string;
  urgency: MeetingUrgency;
  reminderId: string | null;
}

export interface MeetingRangeFilters {
  status?: MeetingStatus | undefined;
  leadId?: string | undefined;
  search?: string | undefined;
}

export const meetingKeys = {
  all: ['meetings'] as const,
  range: (start: string, end: string, filtros: MeetingRangeFilters) =>
    ['meetings', 'range', start, end, filtros] as const,
  detail: (id: string) => ['meetings', 'detail', id] as const,
  upcoming: (leadId?: string) => ['meetings', 'upcoming', leadId ?? 'todos'] as const,
  alerts: ['meetings', 'alerts'] as const,
};

/**
 * Invalida TUDO que mostra reuniao.
 *
 * Uma unica funcao para todos os pontos: quem adicionar uma mutacao nova
 * herda a invalidacao correta sem precisar lembrar da lista.
 */
export function useInvalidateMeetings() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    // O card do quadro carrega a proxima reuniao junto com o lead.
    void queryClient.invalidateQueries({ queryKey: ['board'] });
    void queryClient.invalidateQueries({ queryKey: ['lead'] });
    // Os alertas vivem dentro do painel.
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

/** Somente a janela visivel do calendario, nunca a tabela inteira. */
export function useMeetingsRange(start: string, end: string, filtros: MeetingRangeFilters = {}) {
  return useQuery({
    queryKey: meetingKeys.range(start, end, filtros),
    queryFn: () =>
      api.get<{ meetings: Meeting[] }>(`/meetings${buildQuery({ start, end, ...filtros })}`),
    enabled: Boolean(start && end),
    staleTime: 30_000,
  });
}

export function useMeeting(id: string | null) {
  return useQuery({
    queryKey: meetingKeys.detail(id ?? ''),
    queryFn: () => api.get<{ meeting: Meeting }>(`/meetings/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpcomingMeetings(options: { leadId?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: meetingKeys.upcoming(options.leadId),
    queryFn: () =>
      api.get<{ meetings: Meeting[] }>(
        `/meetings/upcoming${buildQuery({ leadId: options.leadId, limit: options.limit })}`,
      ),
    staleTime: 60_000,
  });
}

/**
 * Alertas de reuniao.
 *
 * Atualiza a cada 60 segundos e ao voltar o foco para a janela: o usuario
 * costuma deixar a plataforma aberta, e uma reuniao que entra na faixa de
 * "menos de 1 hora" precisa aparecer sem exigir F5.
 */
export function useMeetingAlerts() {
  return useQuery({
    queryKey: meetingKeys.alerts,
    queryFn: () => api.get<{ alerts: MeetingAlert[] }>('/meetings/alerts'),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    // Aba escondida nao precisa consultar: economiza bateria e requisicao.
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Mutacoes
// ---------------------------------------------------------------------------

export interface CreateMeetingPayload {
  leadId: string;
  title: string;
  agenda: string | null;
  internalNotes: string | null;
  serviceId: string | null;
  startAt: string;
  endAt: string;
  timezone: string;
  meetUrl: string;
  reminderOffsetsMinutes: number[];
}

export function useCreateMeeting() {
  const invalidate = useInvalidateMeetings();
  return useMutation({
    mutationFn: (input: CreateMeetingPayload) =>
      api.post<{ meeting: Meeting; message: string }>('/meetings', {
        ...input,
        idempotencyKey: newIdempotencyKey('meet'),
      }),
    onSuccess: invalidate,
  });
}

export interface UpdateMeetingPayload {
  id: string;
  expectedVersion: number;
  title?: string;
  agenda?: string | null;
  internalNotes?: string | null;
  serviceId?: string | null;
  meetUrl?: string;
}

export function useUpdateMeeting() {
  const invalidate = useInvalidateMeetings();
  return useMutation({
    mutationFn: ({ id, ...corpo }: UpdateMeetingPayload) =>
      api.patch<{ meeting: Meeting }>(`/meetings/${id}`, {
        ...corpo,
        idempotencyKey: newIdempotencyKey('meet-upd'),
      }),
    onSuccess: invalidate,
  });
}

export interface ReschedulePayload {
  id: string;
  expectedVersion: number;
  startAt: string;
  endAt: string;
  meetUrl?: string;
  reminderOffsetsMinutes?: number[];
}

export function useRescheduleMeeting() {
  const invalidate = useInvalidateMeetings();
  return useMutation({
    mutationFn: ({ id, ...corpo }: ReschedulePayload) =>
      api.post<{ meeting: Meeting }>(`/meetings/${id}/reschedule`, {
        ...corpo,
        idempotencyKey: newIdempotencyKey('meet-resched'),
      }),
    onSuccess: invalidate,
  });
}

/** Cancelar, concluir e ausencia compartilham a mesma forma. */
function useOutcomeMutation<T extends Record<string, unknown>>(
  caminho: 'cancel' | 'complete' | 'no-show',
  prefixo: string,
) {
  const invalidate = useInvalidateMeetings();
  return useMutation({
    mutationFn: ({ id, ...corpo }: T & { id: string }) =>
      api.post<{ meeting: Meeting; message: string }>(`/meetings/${id}/${caminho}`, {
        ...corpo,
        idempotencyKey: newIdempotencyKey(prefixo),
      }),
    onSuccess: invalidate,
  });
}

export const useCancelMeeting = () =>
  useOutcomeMutation<{ reason: string; expectedVersion: number }>('cancel', 'meet-cancel');

export const useCompleteMeeting = () =>
  useOutcomeMutation<{ outcome: string | null; expectedVersion: number }>('complete', 'meet-done');

export const useNoShowMeeting = () =>
  useOutcomeMutation<{ note: string | null; expectedVersion: number }>('no-show', 'meet-noshow');

/** Marcar o aviso como visto NAO cancela a reuniao. */
export function useUpdateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: 'READ' | 'DISMISSED' }) =>
      api.patch<{ ok: true }>(`/meeting-reminders/${input.id}`, { status: input.status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meetingKeys.alerts });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
