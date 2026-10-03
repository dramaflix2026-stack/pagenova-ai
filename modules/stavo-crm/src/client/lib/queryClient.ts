import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api';

/**
 * Cache de estado de servidor.
 * Erros de autenticacao e validacao nunca sao repetidos automaticamente.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (error.status === 401 || error.status === 403 || error.status === 404) return false;
          if (!error.retryable) return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
