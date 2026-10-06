import { and, eq } from 'drizzle-orm';
import { workspaceMembers, workspaces } from '../../db/schema';
/**
 * Rotas de autenticacao.
 *  POST /api/auth/login        publica, com rate limit
 *  POST /api/auth/logout       revoga a sessao atual
 *  POST /api/auth/password     troca de senha autenticada
 *  GET  /api/me                dados do usuario da sessao
 */
import { capabilitiesOf, type UserRole } from '../../../shared/roles';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { changePasswordSchema, loginSchema } from '../../../shared/schemas';
import { getEnv } from '../../config/env';
import { getDb } from '../../db/client';
import { asyncHandler, parseBody } from '../../lib/http';
import { csrfProtection, requireAuth } from '../../middleware';
import { changePassword, attemptLogin } from './service';
import { clearSessionCookies, createSession, issueCsrfToken, revokeSession } from './sessions';

async function resolveWorkspaceId(
  db: ReturnType<typeof getDb>,
  userId: string,
): Promise<string> {
  const [membership] = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.status, 'ACTIVE'),
        eq(workspaces.status, 'ACTIVE'),
      ),
    )
    .limit(1);

  if (!membership?.workspaceId) {
    throw new Error('Usuario sem workspace ativo.');
  }

  return membership.workspaceId;
}
/** Limite por IP. O lockout por conta fica no servico, gravado no banco. */
const loginRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => getEnv().NODE_ENV === 'test',
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_LOGIN_ATTEMPTS',
        message: 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.',
        requestId: req.requestId,
        retryable: true,
      },
    });
  },
});

export const authRouter: Router = Router();

authRouter.post(
  '/auth/login',
  loginRateLimit,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(loginSchema, req);
    const db = getDb();

    const result = await attemptLogin(db, {
      email: input.email,
      password: input.password,
      ip: req.ip,
    });

    const workspaceId = await resolveWorkspaceId(db, result.userId);
    await createSession({
      db,
      userId: result.userId,
      workspaceId,
      req,
      res,
    });

    res.status(200).json({ user: { email: result.email } });
  }),
);

authRouter.post(
  '/auth/logout',
  csrfProtection,
  asyncHandler(async (req, res) => {
    if (req.session) {
      await revokeSession(getDb(), req.session.sessionId);
    }
    clearSessionCookies(res);
    res.status(200).json({ ok: true });
  }),
);

authRouter.post(
  '/auth/password',
  requireAuth,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(changePasswordSchema, req);
    const db = getDb();
    const userId = req.session!.user.id;

    await changePassword(db, {
      userId,
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    });

    // Todas as sessoes foram revogadas; este navegador recebe uma nova.
    const workspaceId = await resolveWorkspaceId(db, userId);
    await createSession({
      db,
      userId,
      workspaceId,
      req,
      res,
    });

    res.status(200).json({
      ok: true,
      message: 'Senha alterada. Os outros dispositivos conectados precisarao entrar novamente.',
    });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const env = getEnv();
    // Garante que o cookie CSRF exista mesmo apos expirar antes da sessao.
    if (!(req.cookies as Record<string, string> | undefined)?.stavo_csrf) {
      issueCsrfToken(res);
    }
    res.status(200).json({
      user: {
        id: req.session!.user.id,
        email: req.session!.user.email,
        name: req.session!.user.name.trim() || req.session!.user.email,
        role: req.session!.user.role,
        // A tela usa isto so para esconder botao que nao funcionaria; quem
        // decide de verdade e o servidor, em cada rota.
        capabilities: capabilitiesOf(req.session!.user.role as UserRole),
        lastLoginAt: req.session!.user.lastLoginAt,
        passwordChangedAt: req.session!.user.passwordChangedAt,
      },
      app: {
        name: env.APP_NAME,
        timezone: env.APP_TIMEZONE,
        googleConfigured: Boolean(env.GOOGLE_MAPS_API_KEY?.trim()),
        /** Sinaliza que o segredo de bootstrap ainda esta no ambiente. */
        bootstrapSecretPresent: Boolean(env.ADMIN_INITIAL_PASSWORD?.trim()),
      },
    });
  }),
);
