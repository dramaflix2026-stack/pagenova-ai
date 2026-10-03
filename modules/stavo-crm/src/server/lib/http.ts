/**
 * Utilitarios de rota: validacao no boundary com Zod e captura de erros async.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { TypeOf, ZodTypeAny } from 'zod';
import { ZodError } from 'zod';

import { badRequest, type FieldErrors } from './errors';

/** Converte um ZodError no mapa de erros por campo usado pela API. */
export function toFieldErrors(error: ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

/**
 * Valida no boundary e devolve exatamente `z.infer<S>`, para que o tipo
 * batido no router seja o mesmo declarado em @shared/schemas.
 */
export function parseOrThrow<S extends ZodTypeAny>(
  schema: S,
  value: unknown,
  message?: string,
): TypeOf<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw badRequest(message ?? 'Alguns campos precisam ser corrigidos.', {
      code: 'VALIDATION_ERROR',
      fieldErrors: toFieldErrors(result.error),
    });
  }
  return result.data as TypeOf<S>;
}

export const parseBody = <S extends ZodTypeAny>(schema: S, req: Request): TypeOf<S> =>
  parseOrThrow(schema, req.body);

export const parseQuery = <S extends ZodTypeAny>(schema: S, req: Request): TypeOf<S> =>
  parseOrThrow(schema, req.query, 'Os filtros informados sao invalidos.');

/** Envolve handlers async para que rejeicoes cheguem ao tratador central. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

/** Converte '1'/'true' de query string em boolean. */
export const asBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  return fallback;
};

export const isZodError = (error: unknown): error is ZodError => error instanceof ZodError;
