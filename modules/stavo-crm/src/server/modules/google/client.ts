/**
 * Adapter da Google Places API (New).
 *
 * Regras:
 *  - a chave existe SOMENTE aqui, no servidor; nunca vai ao navegador nem ao log;
 *  - apenas endpoints oficiais; nada de scraping, navegador automatizado,
 *    API nao oficial ou proxy para contornar limite;
 *  - field mask minimo, porque o custo do Google e por campo solicitado;
 *  - retry apenas para erro transitorio, com backoff e jitter;
 *  - circuit breaker simples: apos falhas seguidas, para de tentar por um tempo;
 *  - a resposta bruta do Google nunca vaza para o cliente.
 */
import type { BusinessStatus } from '../../../shared/constants';
import { getEnv } from '../../config/env';
import { logger } from '../../lib/logger';
import { AppError, isAppError, serviceUnavailable, unprocessable } from '../../lib/errors';

/**
 * Field mask da busca. Cada campo adicional aumenta o custo -- este e o
 * conjunto minimo que sustenta a tela de resultados.
 */
export const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.primaryTypeDisplayName',
  'places.businessStatus',
  'places.googleMapsUri',
  'nextPageToken',
].join(',');

/** Field mask do detalhe ao vivo de um card ja no CRM. */
export const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'rating',
  'userRatingCount',
  'primaryTypeDisplayName',
  'businessStatus',
  'googleMapsUri',
  'photos',
].join(',');

export interface GooglePlaceRaw {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: { text?: string };
  businessStatus?: string;
  googleMapsUri?: string;
  photos?: Array<{ name?: string; widthPx?: number; heightPx?: number; authorAttributions?: Array<{ displayName?: string; uri?: string; photoUri?: string }> }>;
}

export interface TextSearchResponse {
  places: GooglePlaceRaw[];
  nextPageToken: string | null;
}

/** Traduz o businessStatus do Google para o vocabulario interno. */
export function mapBusinessStatus(value: string | undefined): BusinessStatus {
  switch (value) {
    case 'OPERATIONAL':
      return 'OPERATIONAL';
    case 'CLOSED_TEMPORARILY':
      return 'CLOSED_TEMPORARILY';
    case 'CLOSED_PERMANENTLY':
      return 'CLOSED_PERMANENTLY';
    default:
      return 'UNKNOWN';
  }
}

interface MotivoGoogle {
  status: string | null;
  message: string | null;
}

/**
 * Extrai apenas o motivo declarado pelo Google.
 *
 * O corpo de erro tem a forma:
 *   { "error": { "code": 403, "message": "...", "status": "PERMISSION_DENIED" } }
 *
 * Devolvemos `status` e `message`. Qualquer coisa parecida com uma chave de
 * API e removida por seguranca, e o texto e truncado.
 */
function extrairMotivo(corpo: string): MotivoGoogle {
  try {
    const json = JSON.parse(corpo) as {
      error?: { status?: string; message?: string };
    };
    const mensagem = json.error?.message ?? null;
    return {
      status: json.error?.status ?? null,
      message: mensagem
        ? mensagem.replace(/AIza[0-9A-Za-z_-]{10,}/g, '[chave oculta]').slice(0, 300)
        : null,
    };
  } catch {
    return { status: null, message: null };
  }
}

// --- Circuit breaker -------------------------------------------------------

const BREAKER = {
  failures: 0,
  openedAt: 0,
  threshold: 5,
  cooldownMs: 60_000,
};

function breakerIsOpen(): boolean {
  if (BREAKER.failures < BREAKER.threshold) return false;
  if (Date.now() - BREAKER.openedAt > BREAKER.cooldownMs) {
    BREAKER.failures = 0;
    return false;
  }
  return true;
}

function noteFailure(): void {
  BREAKER.failures += 1;
  if (BREAKER.failures === BREAKER.threshold) BREAKER.openedAt = Date.now();
}

function noteSuccess(): void {
  BREAKER.failures = 0;
}

/** Reinicia o estado do disjuntor; usado pelos testes. */
export function resetCircuitBreaker(): void {
  BREAKER.failures = 0;
  BREAKER.openedAt = 0;
}

// --- Requisicao ------------------------------------------------------------

const TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 3;

const isTransientStatus = (status: number): boolean =>
  status === 408 || status === 429 || status >= 500;

const backoffDelay = (attempt: number): number => {
  const base = 300 * 2 ** (attempt - 1);
  // Jitter evita que varias tentativas voltem exatamente ao mesmo tempo.
  return base + Math.floor(Math.random() * 200);
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

interface RequestOptions {
  path: string;
  fieldMask: string;
  method: 'GET' | 'POST';
  body?: unknown;
  /** Permite abortar quando o cliente desiste da requisicao. */
  signal?: AbortSignal | undefined;
}

async function callGoogle<T>(options: RequestOptions): Promise<T> {
  const env = getEnv();
  const apiKey = env.GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey) {
    throw unprocessable(
      'A pesquisa de empresas ainda nao esta configurada. ' +
        'Defina GOOGLE_MAPS_API_KEY no ambiente do servidor para habilitar esta tela.',
      { code: 'GOOGLE_NOT_CONFIGURED' },
    );
  }

  if (breakerIsOpen()) {
    throw serviceUnavailable(
      'A pesquisa do Google esta temporariamente indisponivel. Tente novamente em instantes. ' +
        'O restante do CRM continua funcionando.',
      'GOOGLE_CIRCUIT_OPEN',
    );
  }

  let lastError: unknown = null;
  let ultimoDiagnostico: Record<string, unknown> | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const onAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onAbort, { once: true });

    try {
      const response = await fetch(`${env.GOOGLE_PLACES_BASE_URL}${options.path}`, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          // A chave viaja somente neste cabecalho, nunca na URL nem no log.
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': options.fieldMask,
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        signal: controller.signal,
      });

      if (response.ok) {
        noteSuccess();
        return (await response.json()) as T;
      }

      // O corpo integral nunca e repassado. Extraimos apenas o motivo
      // declarado pelo Google, que e o dado necessario para corrigir a
      // configuracao e nao contem segredo.
      const detail = await response.text().catch(() => '');
      const motivo = extrairMotivo(detail);

      logger.warn(
        { status: response.status, path: options.path, motivo },
        'Resposta de erro da API do Google.',
      );

      const diagnostico = {
        googleStatus: response.status,
        googleReason: motivo.status,
        googleMessage: motivo.message,
      };

      if (response.status === 400) {
        throw unprocessable(
          'A pesquisa nao pode ser realizada com esses parametros. Revise nicho e localizacao.',
          { code: 'GOOGLE_BAD_REQUEST', details: diagnostico },
        );
      }
      if (response.status === 403 || response.status === 401) {
        throw unprocessable(
          'O Google recusou a chamada. Veja o motivo abaixo para saber o que ajustar.',
          { code: 'GOOGLE_FORBIDDEN', details: diagnostico },
        );
      }
      if (!isTransientStatus(response.status)) {
        throw new AppError(
          503,
          'GOOGLE_ERROR',
          'Nao foi possivel consultar o Google agora. Veja o motivo abaixo.',
          { retryable: true, details: diagnostico },
        );
      }

      ultimoDiagnostico = diagnostico;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      // Erro ja classificado por nos (403, 400, chave ausente) NAO e falha de
      // rede e nao deve ser repetido: repetir apenas gasta quota e troca a
      // causa real por uma mensagem generica.
      if (isAppError(error)) throw error;

      // Cancelamento do proprio cliente nao deve virar retry.
      if (options.signal?.aborted) {
        throw serviceUnavailable('Consulta cancelada.', 'GOOGLE_ABORTED');
      }
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error('timeout');
        ultimoDiagnostico = { networkCode: 'TIMEOUT', attempts: attempt };
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code?: unknown }).code === 'string'
      ) {
        // Erro de rede/DNS: o codigo diz se e bloqueio de saida, DNS ou recusa.
        lastError = error;
        ultimoDiagnostico = {
          networkCode: String((error as { code?: unknown }).code),
          attempts: attempt,
        };
      } else {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', onAbort);
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(backoffDelay(attempt));
    }
  }

  noteFailure();
  logger.warn({ err: lastError, path: options.path }, 'Falha ao consultar a API do Google.');
  throw new AppError(
    503,
    'GOOGLE_UNAVAILABLE',
    'Nao foi possivel consultar o Google agora. Tente novamente em instantes. ' +
      'Os dados internos do CRM continuam disponiveis.',
    {
      retryable: true,
      ...(ultimoDiagnostico ? { details: ultimoDiagnostico } : {}),
    },
  );
}

export interface TextSearchParams {
  textQuery: string;
  pageToken?: string | null;
  signal?: AbortSignal | undefined;
}

/**
 * Text Search (New). Uma pagina retorna ate 20 resultados.
 * NAO usa openNow: uma empresa operacional deve aparecer mesmo fora do
 * horario comercial.
 */
export async function textSearch(params: TextSearchParams): Promise<TextSearchResponse> {
  const env = getEnv();

  const body: Record<string, unknown> = {
    textQuery: params.textQuery,
    languageCode: env.GOOGLE_PLACES_LANGUAGE,
    regionCode: env.GOOGLE_PLACES_REGION,
    pageSize: 20,
  };

  if (params.pageToken) body.pageToken = params.pageToken;

  const response = await callGoogle<{ places?: GooglePlaceRaw[]; nextPageToken?: string }>({
    path: '/v1/places:searchText',
    method: 'POST',
    fieldMask: SEARCH_FIELD_MASK,
    body,
    signal: params.signal,
  });

  return {
    places: response.places ?? [],
    nextPageToken: response.nextPageToken ?? null,
  };
}

/** Resolve uma foto do Places sem expor a chave. A resposta e temporaria. */
export async function placePhotoMedia(photoName: string, maxWidthPx = 1600, signal?: AbortSignal): Promise<Response> {
  const env = getEnv();
  const apiKey = env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) throw unprocessable('Google Places nao configurado.', { code: 'GOOGLE_NOT_CONFIGURED' });
  if (!/^places\\/[^/]+\\/photos\\/[^/]+$/.test(photoName)) throw unprocessable('Referencia de foto invalida.', { code: 'GOOGLE_PHOTO_INVALID' });
  const width = Math.min(2400, Math.max(400, Math.round(maxWidthPx)));
  const url = new URL(`${env.GOOGLE_PLACES_BASE_URL}/v1/${photoName}/media`);
  url.searchParams.set('maxWidthPx', String(width));
  url.searchParams.set('skipHttpRedirect', 'true');
  const response = await fetch(url, { headers: { 'X-Goog-Api-Key': apiKey }, signal });
  if (!response.ok) throw serviceUnavailable('Nao foi possivel carregar a foto do Google agora.', 'GOOGLE_PHOTO_UNAVAILABLE');
  const payload = await response.json() as { photoUri?: string };
  if (!payload.photoUri) throw serviceUnavailable('O Google nao retornou a foto solicitada.', 'GOOGLE_PHOTO_UNAVAILABLE');
  return fetch(payload.photoUri, { signal, redirect: 'follow' });
}

/** Detalhes ao vivo de um local. A resposta e descartada apos a requisicao. */
export async function placeDetails(
  placeId: string,
  signal?: AbortSignal,
): Promise<GooglePlaceRaw> {
  const env = getEnv();
  const query = new URLSearchParams({
    languageCode: env.GOOGLE_PLACES_LANGUAGE,
    regionCode: env.GOOGLE_PLACES_REGION,
  });

  return callGoogle<GooglePlaceRaw>({
    path: `/v1/places/${encodeURIComponent(placeId)}?${query.toString()}`,
    method: 'GET',
    fieldMask: DETAILS_FIELD_MASK,
    signal,
  });
}
