/**
 * Cliente HTTP da API.
 *
 * Autenticacao vem do cookie HttpOnly de sessao -- nada e guardado em
 * localStorage. O token CSRF vem do cookie legivel e vai no cabecalho.
 */
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './constants';

export interface ApiErrorEnvelope {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string[]> | undefined;
  readonly requestId: string;
  readonly retryable: boolean;
  readonly details: Record<string, unknown> | undefined;

  constructor(status: number, envelope: ApiErrorEnvelope) {
    super(envelope.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = envelope.code;
    this.fieldErrors = envelope.fieldErrors;
    this.requestId = envelope.requestId;
    this.retryable = envelope.retryable;
    this.details = envelope.details;
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Envia FormData (upload) em vez de JSON. */
  formData?: FormData;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {};

  if (method !== 'GET') {
    const csrf = readCookie(CSRF_COOKIE_NAME);
    if (csrf) headers[CSRF_HEADER_NAME] = csrf;
  }

  if (options.body !== undefined && !options.formData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    ...(options.formData
      ? { body: options.formData }
      : options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';

  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const payload = (await response.json().catch(() => null)) as { error?: ApiErrorEnvelope } | null;
      if (payload?.error) throw new ApiError(response.status, payload.error);
    }
    throw new ApiError(response.status, {
      code: 'UNKNOWN_ERROR',
      message:
        response.status >= 500
          ? 'O servidor nao respondeu como esperado. Tente novamente em instantes.'
          : 'Nao foi possivel concluir a acao.',
      requestId: response.headers.get('x-request-id') ?? '',
      retryable: response.status >= 500,
    });
  }

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) =>
    apiRequest<T>(path, signal ? { signal } : {}),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'DELETE', body }),
  upload: <T>(path: string, formData: FormData) =>
    apiRequest<T>(path, { method: 'POST', formData }),
};

/** Monta querystring ignorando valores vazios. */
export function buildQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

/** Chave de idempotencia por acao, para que reenvios nao dupliquem nada. */
export function newIdempotencyKey(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}
