/**
 * Middlewares transversais: contexto de requisicao, autenticacao, CSRF,
 * validacao de origem e tratamento central de erros.
 */
import {
  provisionPageNovaIdentity,
  verifyPageNovaIdentity,
} from '../modules/auth/pagenova-sso';
import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

import { can, USER_ROLE_LABELS, type Capability, type UserRole } from '../../shared/roles';
import { getEnv } from '../config/env';
import { getDb } from '../db/client';
import { AppError, forbidden, isAppError, unauthorized } from '../lib/errors';
import { toFieldErrors } from '../lib/http';
import { logger } from '../lib/logger';
import {
  CSRF_COOKIE,
  CSRF_HEADER,
  SESSION_COOKIE,
  issueCsrfToken,
  resolveSession,
  safeCompare,
  type SessionContext,
} from '../modules/auth/sessions';

declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
    session?: SessionContext;
  }
}

/** Identificador correlacionavel entre log e resposta de erro. */
export const requestContext: RequestHandler = (req, res, next) => {
  const incoming = req.get('x-request-id');
  req.requestId = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
};

/** Rotas privadas nunca devem ser indexadas. Complementa, nunca substitui, o login. */
export const noIndex: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  next();
};

/**
 * Carrega a sessao quando existir, sem exigir autenticacao.
 * Usado por rotas que mudam de comportamento quando ha sessao.
 */
/**
 * Recebe a identidade ja autenticada pelo PageNova.
 *
 * Estes headers somente sao confiaveis quando possuem assinatura HMAC
 * criada no backend do PageNova com PAGENOVA_SSO_SECRET.
 */
export const loadPageNovaIdentity: RequestHandler = (req, _res, next) => {
  const externalUserId = req.get('x-pagenova-user-id') ?? '';
  const email = req.get('x-pagenova-user-email') ?? '';
  const name = req.get('x-pagenova-user-name') ?? '';
  const timestamp = req.get('x-pagenova-timestamp') ?? '';
  const signature = req.get('x-pagenova-signature') ?? '';

  // Requisicao convencional do Stavo: deixa loadSession cuidar dela.
  if (!externalUserId && !signature) {
    next();
    return;
  }

  const identity = verifyPageNovaIdentity({
    secret: process.env.PAGENOVA_SSO_SECRET ?? '',
    externalUserId,
    email,
    name,
    timestamp,
    signature,
  });

  if (!identity) {
    next(unauthorized('Identidade PageNova invalida.'));
    return;
  }

  provisionPageNovaIdentity(getDb(), identity)
    .then((context) => {
      req.session = {
        sessionId: `pagenova:${identity.externalUserId}`,
        workspaceId: context.workspaceId,
        user: context.user,
      };

      next();
    })
    .catch(next);
};
export const loadSession: RequestHandler = (req, _res, next) => {
  // A identidade PageNova assinada ja e uma sessao completa para esta requisicao.
  if (req.session?.sessionId.startsWith('pagenova:')) {
    next();
    return;
  }

  const token = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
  resolveSession(getDb(), token)
    .then((session) => {
      if (session) req.session = session;
      next();
    })
    .catch(next);
};

/** Exige sessao valida. Responde 401 em JSON, sem redirecionar a API. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  if (req.session) return next();
  next(unauthorized());
};

/**
 * Exige um cargo com a permissao informada.
 *
 * A tela ja esconde o que a pessoa nao pode fazer, mas esconder botao nao e
 * seguranca: quem souber o endereco chama a rota direto. A decisao final e
 * sempre aqui.
 *
 * A mensagem diz qual cargo faltou, e nao apenas "sem permissao": quem
 * esbarrou precisa saber a quem pedir.
 */
export const requireCapability =
  (capability: Capability): RequestHandler =>
  (req, _res, next) => {
    if (!req.session) return next(unauthorized());

    const role = req.session.user.role as UserRole;
    if (can(role, capability)) return next();

    next(
      forbidden(
        `Seu cargo (${USER_ROLE_LABELS[role] ?? role}) nao permite esta acao. ` +
          'Peca ao dono da conta se voce precisa dela.',
      ),
    );
  };

/**
 * Exige a permissao apenas nos metodos que ALTERAM dados.
 *
 * Varias telas precisam ler o que nao podem editar: o quadro depende da lista
 * de etapas e servicos, e um funcionario precisa ver as proprias metas sem
 * poder redefini-las. Travar o GET junto quebraria essas telas.
 */
export const requireCapabilityToWrite =
  (capability: Capability): RequestHandler =>
  (req, res, next) =>
    req.method === 'GET' ? next() : requireCapability(capability)(req, res, next);

/**
 * Garante que o cookie CSRF exista, inclusive para quem ainda NAO entrou.
 *
 * Sem isso a tela de login fica impossivel de usar: o navegador nao teria
 * token para enviar no cabecalho e toda tentativa de login seria recusada
 * pela propria protecao.
 *
 * O token so e emitido quando esta ausente. Reemitir a cada requisicao
 * invalidaria formularios abertos em outra aba.
 */
export const ensureCsrfCookie: RequestHandler = (req, res, next) => {
  const cookies = (req.cookies ?? {}) as Record<string, string>;
  if (!cookies[CSRF_COOKIE]) {
    issueCsrfToken(res);
  }
  next();
};

/**
 * CSRF por double submit: o cookie legivel precisa bater com o cabecalho.
 * Aplicado a toda mutacao; metodos seguros passam direto.
 */
export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  // Requisicoes PageNova chegam por um proxy same-origin autenticado e
  // possuem identidade HMAC validada antes deste middleware. O proxy faz a
  // verificacao de Origin; nao existe cookie Stavo para double-submit aqui.
  if (req.session?.sessionId.startsWith('pagenova:')) return next();

  const cookies = (req.cookies ?? {}) as Record<string, string>;
  const cookieToken = cookies[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || !safeCompare(cookieToken, headerToken)) {
    return next(
      forbidden('Sua sessao precisa ser atualizada. Recarregue a pagina e tente novamente.'),
    );
  }
  next();
};

/**
 * Valida Origin/Referer nas mutacoes. A aplicacao e same-origin: qualquer
 * origem diferente da propria e recusada.
 */
export const validateOrigin: RequestHandler = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const origin = req.get('origin');
  if (!origin) return next(); // clientes nao-navegador (cron, CLI) nao enviam Origin

  const env = getEnv();
  const allowed = new Set<string>([env.APP_URL]);
  const host = req.get('host');
  if (host) {
    allowed.add(`${req.protocol}://${host}`);
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }
  if (env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:5173');
    allowed.add('http://127.0.0.1:5173');
  }

  if (!allowed.has(origin)) {
    logger.warn({ requestId: req.requestId, path: req.path }, 'Origem recusada em mutacao.');
    return next(forbidden('Origem da requisicao nao autorizada.'));
  }
  next();
};

/** 404 padronizado para rotas de API inexistentes. */
export const apiNotFound: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND', 'Rota de API nao encontrada.'));
};

interface ErrorEnvelope {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

/**
 * Tratador central. Nunca vaza stack, SQL ou resposta bruta de terceiros
 * para o cliente; o detalhe tecnico fica somente no log do servidor.
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) return next(error);

  let status = 500;
  let envelope: ErrorEnvelope = {
    code: 'INTERNAL_ERROR',
    message: 'Erro inesperado. Tente novamente em instantes.',
    requestId: req.requestId,
    retryable: true,
  };

  if (isAppError(error)) {
    status = error.status;
    envelope = {
      code: error.code,
      message: error.message,
      requestId: req.requestId,
      retryable: error.retryable,
      ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
      ...(error.details ? { details: error.details } : {}),
    };
  } else if (error instanceof ZodError) {
    status = 400;
    envelope = {
      code: 'VALIDATION_ERROR',
      message: 'Alguns campos precisam ser corrigidos.',
      fieldErrors: toFieldErrors(error),
      requestId: req.requestId,
      retryable: false,
    };
  } else if (isBodyTooLarge(error)) {
    status = 413;
    envelope = {
      code: 'PAYLOAD_TOO_LARGE',
      message: 'O conteudo enviado e maior do que o limite permitido.',
      requestId: req.requestId,
      retryable: false,
    };
  } else if (isMalformedJson(error)) {
    status = 400;
    envelope = {
      code: 'MALFORMED_JSON',
      message: 'O corpo da requisicao nao e um JSON valido.',
      requestId: req.requestId,
      retryable: false,
    };
  }

  const logPayload = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    status,
    code: envelope.code,
  };

  if (status >= 500) {
    // Falha inesperada: o stack completo fica no log do servidor (nunca na resposta).
    logger.error({ ...logPayload, err: error }, 'Falha no processamento da requisicao.');
  } else {
    // Recusa esperada (401, 403, 404, validacao): apenas o essencial, sem stack.
    logger.warn(logPayload, 'Requisicao recusada.');
  }

  res.status(status).json({ error: envelope });
}

function isBodyTooLarge(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('type' in error
      ? (error as { type?: string }).type === 'entity.too.large'
      : (error as { code?: string }).code === 'LIMIT_FILE_SIZE')
  );
}

function isMalformedJson(error: unknown): boolean {
  return (
    error instanceof SyntaxError && 'body' in error && (error as { status?: number }).status === 400
  );
}
