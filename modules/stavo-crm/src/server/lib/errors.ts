/**
 * Erros de aplicacao com codigo estavel e mensagem em portugues.
 * O envelope de erro da API sempre segue { code, message, fieldErrors, requestId, retryable }.
 */

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldErrors | undefined;
  readonly retryable: boolean;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    status: number,
    code: string,
    message: string,
    options: {
      fieldErrors?: FieldErrors;
      retryable?: boolean;
      details?: Record<string, unknown>;
      cause?: unknown;
    } = {},
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.fieldErrors = options.fieldErrors;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

export const badRequest = (
  message: string,
  options?: { code?: string; fieldErrors?: FieldErrors; details?: Record<string, unknown> },
) =>
  new AppError(400, options?.code ?? 'BAD_REQUEST', message, {
    ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
    ...(options?.details ? { details: options.details } : {}),
  });

export const unauthorized = (message = 'Sessao expirada ou inexistente. Entre novamente.') =>
  new AppError(401, 'UNAUTHORIZED', message);

export const forbidden = (message = 'Voce nao tem permissao para esta acao.') =>
  new AppError(403, 'FORBIDDEN', message);

export const notFound = (message = 'Registro nao encontrado.', code = 'NOT_FOUND') =>
  new AppError(404, code, message);

export const conflict = (
  message: string,
  options?: { code?: string; details?: Record<string, unknown> },
) =>
  new AppError(409, options?.code ?? 'CONFLICT', message, {
    ...(options?.details ? { details: options.details } : {}),
  });

export const unprocessable = (
  message: string,
  options?: { code?: string; fieldErrors?: FieldErrors; details?: Record<string, unknown> },
) =>
  new AppError(422, options?.code ?? 'UNPROCESSABLE', message, {
    ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
    ...(options?.details ? { details: options.details } : {}),
  });

export const tooManyRequests = (message: string, code = 'TOO_MANY_REQUESTS') =>
  new AppError(429, code, message, { retryable: true });

export const serviceUnavailable = (message: string, code = 'SERVICE_UNAVAILABLE') =>
  new AppError(503, code, message, { retryable: true });

export const internal = (message = 'Erro inesperado. Tente novamente.', cause?: unknown) =>
  new AppError(500, 'INTERNAL_ERROR', message, { cause, retryable: true });

/** Erro especifico de concorrencia otimista na movimentacao de etapa. */
export const stageConflict = (currentStageId: string, currentStageName: string) =>
  new AppError(
    409,
    'STAGE_CONFLICT',
    'Este lead ja foi movido em outro lugar. A tela foi atualizada com a posicao real.',
    { details: { currentStageId, currentStageName } },
  );

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;
