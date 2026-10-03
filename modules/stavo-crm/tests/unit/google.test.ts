/**
 * Integracao Google: field mask minimo, tratamento de status do negocio,
 * paginacao e mapeamento dos resultados.
 *
 * NENHUM teste consome a API real. A chave nao esta definida no ambiente de
 * teste e o `fetch` e substituido por fixtures.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DETAILS_FIELD_MASK,
  SEARCH_FIELD_MASK,
  mapBusinessStatus,
  resetCircuitBreaker,
  textSearch,
  type GooglePlaceRaw,
} from '@server/modules/google/client';
import { buildTextQuery, mapPlace } from '@server/modules/google/service';

const place = (overrides: Partial<GooglePlaceRaw> = {}): GooglePlaceRaw => ({
  id: 'ChIJ_teste',
  displayName: { text: 'Padaria Sao Joao' },
  formattedAddress: 'Av. Paulista, 1000 - Sao Paulo',
  nationalPhoneNumber: '(11) 98888-7777',
  internationalPhoneNumber: '+55 11 98888-7777',
  websiteUri: 'https://www.padariasaojoao.com.br',
  rating: 4.7,
  userRatingCount: 210,
  primaryTypeDisplayName: { text: 'Padaria' },
  businessStatus: 'OPERATIONAL',
  googleMapsUri: 'https://maps.google.com/?cid=1',
  ...overrides,
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetCircuitBreaker();
});

describe('field mask', () => {
  it('pede apenas os campos usados pela tela de resultados', () => {
    const fields = SEARCH_FIELD_MASK.split(',');
    expect(fields).toContain('places.id');
    expect(fields).toContain('places.displayName');
    expect(fields).toContain('places.businessStatus');
    expect(fields).toContain('nextPageToken');
    // Campos caros que a aplicacao nao usa nunca sao solicitados.
    expect(SEARCH_FIELD_MASK).not.toContain('places.reviews');
    expect(SEARCH_FIELD_MASK).not.toContain('places.photos');
    expect(SEARCH_FIELD_MASK).not.toContain('places.currentOpeningHours');
    expect(SEARCH_FIELD_MASK).not.toContain('*');
  });

  it('o detalhe usa mask propria, sem prefixo places.', () => {
    expect(DETAILS_FIELD_MASK).toContain('id');
    expect(DETAILS_FIELD_MASK).not.toContain('places.');
    expect(DETAILS_FIELD_MASK).not.toContain('reviews');
  });
});

describe('status do negocio', () => {
  it('traduz os valores do Google', () => {
    expect(mapBusinessStatus('OPERATIONAL')).toBe('OPERATIONAL');
    expect(mapBusinessStatus('CLOSED_TEMPORARILY')).toBe('CLOSED_TEMPORARILY');
    expect(mapBusinessStatus('CLOSED_PERMANENTLY')).toBe('CLOSED_PERMANENTLY');
    expect(mapBusinessStatus(undefined)).toBe('UNKNOWN');
  });
});

describe('mapeamento de resultado', () => {
  it('extrai os campos e classifica o site', () => {
    const result = mapPlace(place());
    expect(result.placeId).toBe('ChIJ_teste');
    expect(result.name).toBe('Padaria Sao Joao');
    expect(result.phone.e164).toBe('+5511988887777');
    expect(result.website.classification).toBe('OWN_WEBSITE');
    expect(result.businessStatus).toBe('OPERATIONAL');
  });

  it('WhatsApp aparece como acao, nunca como confirmacao', () => {
    const result = mapPlace(place());
    expect(result.actions.whatsappUrl).toBe('https://wa.me/5511988887777');
    // A confirmacao de WhatsApp nao existe: o Google nao informa isso.
    expect(JSON.stringify(result)).not.toContain('WhatsApp confirmado');
  });

  it('telefone fixo nao recebe acao de WhatsApp', () => {
    const result = mapPlace(place({ internationalPhoneNumber: '+55 11 3333-4444' }));
    expect(result.phone.type).toBe('FIXED_LINE');
    expect(result.actions.whatsappUrl).toBeNull();
    expect(result.actions.callUrl).toBe('tel:+551133334444');
  });

  it('sem telefone nao gera nenhum botao de contato', () => {
    const result = mapPlace(
      place({ internationalPhoneNumber: undefined, nationalPhoneNumber: undefined }),
    );
    expect(result.phone.e164).toBeNull();
    expect(result.actions.whatsappUrl).toBeNull();
    expect(result.actions.callUrl).toBeNull();
  });

  it('Instagram como website vira acao de Instagram', () => {
    const result = mapPlace(place({ websiteUri: 'https://instagram.com/padaria' }));
    expect(result.website.classification).toBe('INSTAGRAM');
    expect(result.actions.instagramUrl).toBe('https://instagram.com/padaria');
  });

  it('sempre oferece busca manual de Instagram', () => {
    const result = mapPlace(place());
    expect(result.actions.instagramSearchUrl).toContain('google.com/search');
  });

  it('empresa sem nome no Google nao quebra o card', () => {
    const result = mapPlace(place({ displayName: undefined }));
    expect(result.name).toBe('Empresa sem nome no Google');
  });

  it('a pontuacao vem acompanhada de motivos', () => {
    const result = mapPlace(place({ websiteUri: undefined }));
    expect(result.score).toBeGreaterThan(0);
    expect(result.scoreReasons.length).toBeGreaterThan(0);
  });
});

describe('consulta textual', () => {
  it('monta a consulta a partir dos campos do formulario', () => {
    expect(
      buildTextQuery({
        niche: 'psicologos',
        country: 'Brasil',
        state: 'SP',
        city: 'Campinas',
        region: 'Cambui',
        websiteFilter: 'ALL',
        requirePhone: true,
        serviceId: null,
        pageToken: null,
        searchRunId: null,
      }),
    ).toBe('psicologos, Cambui, Campinas, SP, Brasil');
  });

  it('ignora campos vazios', () => {
    expect(
      buildTextQuery({
        niche: 'dentistas',
        country: 'Brasil',
        state: null,
        city: 'Santos',
        region: null,
        websiteFilter: 'ALL',
        requirePhone: true,
        serviceId: null,
        pageToken: null,
        searchRunId: null,
      }),
    ).toBe('dentistas, Santos, Brasil');
  });
});

describe('chamada HTTP (mockada)', () => {
  it('nunca envia openNow e envia a chave apenas no cabecalho', async () => {
    process.env.GOOGLE_MAPS_API_KEY = 'chave-de-teste';
    const { setEnvForTests, loadEnv } = await import('@server/config/env');
    setEnvForTests(loadEnv(process.env));

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ places: [place()], nextPageToken: 'token-2' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await textSearch({ textQuery: 'psicologos, Campinas' });

    expect(response.places).toHaveLength(1);
    expect(response.nextPageToken).toBe('token-2');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/v1/places:searchText');

    const body = JSON.parse(String(init.body));
    // "Aberto agora" NUNCA e usado como filtro.
    expect(body).not.toHaveProperty('openNow');
    expect(body.pageSize).toBe(20);
    expect(body.languageCode).toBe('pt-BR');

    // A chave viaja apenas no cabecalho, nunca na URL.
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Goog-Api-Key']).toBe('chave-de-teste');
    expect(url).not.toContain('chave-de-teste');

    delete process.env.GOOGLE_MAPS_API_KEY;
    setEnvForTests(loadEnv(process.env));
  });

  it('a segunda pagina so e buscada quando o token e informado', async () => {
    process.env.GOOGLE_MAPS_API_KEY = 'chave-de-teste';
    const { setEnvForTests, loadEnv } = await import('@server/config/env');
    setEnvForTests(loadEnv(process.env));

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ places: [], nextPageToken: null }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await textSearch({ textQuery: 'teste', pageToken: 'token-2' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body)).pageToken).toBe('token-2');
    // Uma chamada por pagina solicitada: nada e pre-carregado.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    delete process.env.GOOGLE_MAPS_API_KEY;
    setEnvForTests(loadEnv(process.env));
  });

  it('um erro classificado (403) chega intacto e NAO e repetido', async () => {
    // Regressao: o catch tratava o proprio AppError como falha de rede,
    // repetia 3 vezes e trocava a causa real pela mensagem generica.
    // O motivo declarado pelo Google ficava invisivel para o operador.
    process.env.GOOGLE_MAPS_API_KEY = 'chave-de-teste';
    const { setEnvForTests, loadEnv } = await import('@server/config/env');
    setEnvForTests(loadEnv(process.env));

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 403,
            status: 'PERMISSION_DENIED',
            message: 'Billing has not been enabled for this project.',
          },
        }),
        { status: 403, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(textSearch({ textQuery: 'teste' })).rejects.toMatchObject({
      code: 'GOOGLE_FORBIDDEN',
      details: {
        googleStatus: 403,
        googleReason: 'PERMISSION_DENIED',
      },
    });

    // Uma unica chamada: repetir so gastaria quota sem chance de sucesso.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    delete process.env.GOOGLE_MAPS_API_KEY;
    setEnvForTests(loadEnv(process.env));
  });

  it('a chave nunca aparece na mensagem devolvida ao usuario', async () => {
    process.env.GOOGLE_MAPS_API_KEY = 'AIzaSyExemploDeChaveParaTeste123456';
    const { setEnvForTests, loadEnv } = await import('@server/config/env');
    setEnvForTests(loadEnv(process.env));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 403,
              status: 'PERMISSION_DENIED',
              message: 'API key not valid: AIzaSyExemploDeChaveParaTeste123456',
            },
          }),
          { status: 403, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    await textSearch({ textQuery: 'teste' }).catch((erro: unknown) => {
      const texto = JSON.stringify(erro);
      expect(texto).not.toContain('AIzaSyExemploDeChaveParaTeste123456');
      expect(texto).toContain('[chave oculta]');
    });

    delete process.env.GOOGLE_MAPS_API_KEY;
    setEnvForTests(loadEnv(process.env));
  });

  it('sem chave configurada a aplicacao explica em vez de falhar de forma tecnica', async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    const { setEnvForTests, loadEnv } = await import('@server/config/env');
    setEnvForTests(loadEnv(process.env));

    await expect(textSearch({ textQuery: 'teste' })).rejects.toMatchObject({
      code: 'GOOGLE_NOT_CONFIGURED',
    });
  });
});
