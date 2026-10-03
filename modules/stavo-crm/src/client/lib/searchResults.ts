/**
 * Resultado da pesquisa de empresas e a ordem em que aparece na tela.
 *
 * Vive fora de SearchPage.tsx porque o arquivo de um componente deve exportar
 * apenas componentes -- caso contrario o recarregamento rapido do Vite para de
 * funcionar naquela tela.
 */

export interface SearchResultItem {
  placeId: string;
  name: string;
  address: string | null;
  category: string | null;
  businessStatus: string;
  rating: number | null;
  userRatingCount: number | null;
  phone: { display: string | null; e164: string | null; isValid: boolean; type: string };
  website: { url: string | null; classification: string; label: string };
  actions: {
    whatsappUrl: string | null;
    callUrl: string | null;
    instagramUrl: string | null;
    instagramSearchUrl: string;
    mapsUrl: string;
  };
  score: number;
  scoreReasons: { label: string; weight: number }[];
  existing: { leadId: string; internalName: string; stageName: string } | null;
}

export type SortOption = 'RELEVANCE' | 'SCORE' | 'RATING' | 'REVIEWS';

/**
 * Ordem em que os resultados aparecem.
 *
 * O padrao e a pontuacao, do mais promissor para o menos promissor: e a
 * pergunta que a tela de pesquisa responde -- quem vale a pena abordar
 * primeiro.
 *
 * Empates mantem a ordem em que o Google devolveu, porque `sort` e estavel em
 * JavaScript. Na pratica a relevancia do Google vira o criterio de desempate,
 * em vez de a ordem entre empatados virar arbitraria.
 *
 * Nada e escondido: pontuacao baixa desce na lista, mas continua visivel.
 */
export function ordenarResultados(
  results: SearchResultItem[],
  sortBy: SortOption,
): SearchResultItem[] {
  const copia = [...results];

  switch (sortBy) {
    case 'SCORE':
      return copia.sort((a, b) => b.score - a.score);
    case 'RATING':
      return copia.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case 'REVIEWS':
      return copia.sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0));
    default:
      // Relevancia original: exatamente a ordem devolvida pelo Google.
      return copia;
  }
}
