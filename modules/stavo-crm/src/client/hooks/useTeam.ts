/**
 * Equipe: colaboradores, cargos e transferencia de leads.
 *
 * A lista e visivel para todos -- o quadro precisa dos nomes para mostrar
 * quem trabalha cada lead. Adicionar, editar e desativar sao acoes do dono
 * da conta, e o servidor recusa quem nao for.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UserRole } from '@shared/roles';
import { api } from '../lib/api';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  /** Quantos leads esta pessoa trabalha hoje. */
  leadCount: number;
}

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: () => api.get<{ members: TeamMember[] }>('/team'),
    staleTime: 60_000,
  });
}

/** Invalida tudo que mostra nome ou permissao de colaborador. */
function useInvalidateTeam() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['team'] });
    void queryClient.invalidateQueries({ queryKey: ['board'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreateTeamMember() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (input: { name: string; email: string; role: UserRole; password: string }) =>
      api.post<{ member: TeamMember; message: string }>('/team', input),
    onSuccess: invalidate,
  });
}

export function useUpdateTeamMember() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (input: { id: string; name?: string; role?: UserRole; active?: boolean }) => {
      const { id, ...corpo } = input;
      return api.patch<{ ok: true }>(`/team/${id}`, corpo);
    },
    onSuccess: invalidate,
  });
}

export function useResetTeamMemberPassword() {
  return useMutation({
    mutationFn: (input: { id: string; password: string }) =>
      api.post<{ ok: true; message: string }>(`/team/${input.id}/password`, {
        password: input.password,
      }),
  });
}

export function useTransferLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { leadId: string; ownerUserId: string | null }) =>
      api.post<{ message: string }>(`/leads/${input.leadId}/transfer`, {
        ownerUserId: input.ownerUserId,
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['board'] });
      void queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Sugere uma senha inicial forte.
 *
 * Existe para o dono da conta nao cair no "Senha123": a senha e entregue a
 * pessoa uma unica vez e trocada por ela depois.
 */
export function sugerirSenha(): string {
  const bruto =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  // Letra, numero e maiuscula garantidos, para passar na checagem de forca.
  return `${bruto.replace(/-/g, '').slice(0, 16)}Aa1`;
}
