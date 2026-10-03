/**
 * Sessao no cliente.
 *
 * Nao guarda token: a sessao vive no cookie HttpOnly. Este contexto apenas
 * pergunta ao servidor quem esta autenticado e trata o 401 sem criar loop de
 * redirecionamento.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import type { Capability, UserRole } from '@shared/roles';
import { ApiError, api } from '../lib/api';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /**
   * O que este cargo pode fazer. Serve para NAO desenhar botao que a pessoa
   * levaria um 403 ao clicar. Nao e seguranca: quem decide e o servidor.
   */
  capabilities: Capability[];
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
}

export interface AppInfo {
  name: string;
  timezone: string;
  googleConfigured: boolean;
  /** Lembra o administrador de remover o segredo de bootstrap. */
  bootstrapSecretPresent: boolean;
}

interface MeResponse {
  user: SessionUser;
  app: AppInfo;
}

interface AuthContextValue {
  user: SessionUser | null;
  /** Atalho de leitura: `pode('GOOGLE_SEARCH')`. */
  pode: (capability: Capability) => boolean;
  app: AppInfo | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await api.get<MeResponse>('/me');
      } catch (error) {
        // 401 e resposta esperada de quem ainda nao entrou.
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  const login = useCallback(
    async (email: string, password: string) => {
      await api.post('/auth/login', { email, password });
      await queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      // Limpa todo o cache: nenhum dado do CRM permanece apos sair.
      queryClient.clear();
      await query.refetch();
    }
  }, [queryClient, query]);

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: query.data?.user ?? null,
      pode: (capability: Capability) =>
        Boolean(query.data?.user?.capabilities?.includes(capability)),
      app: query.data?.app ?? null,
      isLoading: query.isLoading,
      login,
      logout,
      refresh,
    }),
    [query.data, query.isLoading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.');
  return context;
}
