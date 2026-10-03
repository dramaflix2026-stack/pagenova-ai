/**
 * Unidades federativas e municipios do Brasil.
 *
 * A lista vem do servidor e nunca muda durante a sessao, por isso e cacheada
 * indefinidamente: trocar de estado varias vezes faz uma requisicao por
 * estado, e so na primeira vez.
 */
import { useQuery } from '@tanstack/react-query';

import { api } from '../lib/api';

export interface EstadoOption {
  uf: string;
  nome: string;
}

export function useEstados() {
  return useQuery({
    queryKey: ['locations', 'states'],
    queryFn: () => api.get<{ states: EstadoOption[] }>('/locations/states'),
    staleTime: Infinity,
  });
}

/** Municipios da UF informada. Sem UF, nada e buscado. */
export function useCidades(uf: string) {
  return useQuery({
    queryKey: ['locations', 'cities', uf],
    queryFn: () =>
      api.get<{ uf: string; cities: string[] }>(
        `/locations/states/${encodeURIComponent(uf)}/cities`,
      ),
    enabled: Boolean(uf),
    staleTime: Infinity,
  });
}
