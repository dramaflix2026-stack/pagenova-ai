/**
 * Ordem dos resultados da pesquisa.
 *
 * A tela responde "quem vale a pena abordar primeiro", entao o padrao e a
 * pontuacao em ordem decrescente. As demais ordens continuam disponiveis,
 * como manda a especificacao, e nenhuma delas esconde resultado.
 */
import { describe, expect, it } from 'vitest';

import { ordenarResultados, type SearchResultItem } from '@client/lib/searchResults';

/** Resultado minimo: so os campos que participam da ordenacao importam. */
const resultado = (
  name: string,
  score: number,
  rating: number | null = null,
  userRatingCount: number | null = null,
): SearchResultItem => ({
  placeId: `place-${name}`,
  name,
  address: null,
  category: null,
  businessStatus: 'OPERATIONAL',
  rating,
  userRatingCount,
  phone: { display: null, e164: null, isValid: false, type: 'UNKNOWN' },
  website: { url: null, classification: 'NONE', label: 'Sem site' },
  actions: {
    whatsappUrl: null,
    callUrl: null,
    instagramUrl: null,
    instagramSearchUrl: '',
    mapsUrl: '',
  },
  score,
  scoreReasons: [],
  existing: null,
});

const nomes = (lista: SearchResultItem[]) => lista.map((item) => item.name);

describe('ordenarResultados', () => {
  it('por pontuacao, do maior para o menor', () => {
    const entrada = [
      resultado('media', 50),
      resultado('alta', 90),
      resultado('baixa', 10),
      resultado('altissima', 95),
    ];

    expect(nomes(ordenarResultados(entrada, 'SCORE'))).toEqual([
      'altissima',
      'alta',
      'media',
      'baixa',
    ]);
  });

  it('empate preserva a ordem que o Google devolveu', () => {
    // Sem estabilidade, dois empatados trocariam de lugar sem motivo.
    const entrada = [
      resultado('primeiro-do-google', 70),
      resultado('segundo-do-google', 70),
      resultado('terceiro-do-google', 70),
    ];

    expect(nomes(ordenarResultados(entrada, 'SCORE'))).toEqual([
      'primeiro-do-google',
      'segundo-do-google',
      'terceiro-do-google',
    ]);
  });

  it('nenhum resultado e escondido por pontuacao baixa', () => {
    const entrada = [resultado('alta', 90), resultado('zero', 0)];
    const saida = ordenarResultados(entrada, 'SCORE');

    expect(saida).toHaveLength(2);
    expect(nomes(saida)).toContain('zero');
  });

  it('nao altera a lista original', () => {
    // A lista vem do estado do React: ordenar no lugar corromperia a origem.
    const entrada = [resultado('baixa', 10), resultado('alta', 90)];
    ordenarResultados(entrada, 'SCORE');

    expect(nomes(entrada)).toEqual(['baixa', 'alta']);
  });

  it('relevancia mantem exatamente a ordem do Google', () => {
    const entrada = [resultado('baixa', 10), resultado('alta', 90), resultado('media', 50)];

    expect(nomes(ordenarResultados(entrada, 'RELEVANCE'))).toEqual(['baixa', 'alta', 'media']);
  });

  it('por nota, do maior para o menor', () => {
    const entrada = [resultado('tres', 0, 3), resultado('cinco', 0, 5), resultado('quatro', 0, 4)];

    expect(nomes(ordenarResultados(entrada, 'RATING'))).toEqual(['cinco', 'quatro', 'tres']);
  });

  it('quem nao tem nota vai para o fim, sem sumir', () => {
    const entrada = [resultado('sem-nota', 0, null), resultado('com-nota', 0, 4.2)];
    const saida = ordenarResultados(entrada, 'RATING');

    expect(nomes(saida)).toEqual(['com-nota', 'sem-nota']);
  });

  it('por numero de avaliacoes, do maior para o menor', () => {
    const entrada = [
      resultado('poucas', 0, null, 3),
      resultado('muitas', 0, null, 400),
      resultado('nenhuma', 0, null, null),
    ];

    expect(nomes(ordenarResultados(entrada, 'REVIEWS'))).toEqual(['muitas', 'poucas', 'nenhuma']);
  });

  it('lista vazia nao quebra', () => {
    expect(ordenarResultados([], 'SCORE')).toEqual([]);
  });
});
