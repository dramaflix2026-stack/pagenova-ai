/**
 * Sessoes por cookie HttpOnly.
 *
 *  - o token bruto (32 bytes aleatorios) vive apenas no cookie do navegador;
 *  - o banco guarda somente o SHA-256 do token;
 *  - expiracao dupla: inatividade (last_seen_at) e absoluta (expires_at);
 *  - logout revoga a sessao; troca de senha revoga todas.
 *
 * Nada de autenticacao passa por localStorage.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { and, eq, isNull, lt, or, sql } from 'drizzle-orm';
import type { CookieOptions, Request, Response } from 'express';

import { getEnv } from '../../config/env';
import type { Database } from '../../db/client';
import { authSessions, users, workspaceMembers, workspaces, type User } from '../../db/schema';
import { newId } from '../../lib/ids';

export const SESSION_COOKIE = 'stavo_session';
export const CSRF_COOKIE = 'stavo_csrf';
export const CSRF_HEADER = 'x-csrf-token';

const TOKEN_BYTES = 32;

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

/** Hash curto do IP: suficiente para auditoria, sem guardar o endereco. */
const hashIp = (ip: string | undefined): string | null =>
  ip ? createHash('sha256').update(ip).digest('hex') : null;

const summarizeUserAgent = (userAgent: string | undefined): string | null =>
  userAgent ? userAgent.slice(0, 120) : null;

function cookieOptions(maxAgeMs: number): CookieOptions {
  const env = getEnv();
  const secure = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}

export interface SessionContext {
  workspaceId: string;
  sessionId: string;
  /**
   * O cargo e o nome viajam na sessao para que cada requisicao decida a
   * permissao sem uma consulta extra. Desativar ou rebaixar alguem revoga as
   * sessoes dessa pessoa, entao um cargo antigo nunca fica valendo aqui.
   */
  user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'lastLoginAt' | 'passwordChangedAt'>;
}

export interface CreateSessionOptions {
  workspaceId: string;
  db: Database;
  userId: string;
  req: Request;
  res: Response;
}

export async function createSession({
  workspaceId,
  db,
  userId,
  req,
  res,
}: CreateSessionOptions): Promise<string> {
  const env = getEnv();
  const now = new Date();
  const absoluteMs = env.SESSION_ABSOLUTE_HOURS * 60 * 60 * 1000;
  const token = randomBytes(TOKEN_BYTES).toString('base64url');

  await db.insert(authSessions).values({
    id: newId(),
    tokenHash: hashToken(token),
    userId,
    workspaceId,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + absoluteMs),
    ipHash: hashIp(req.ip),
    userAgentSummary: summarizeUserAgent(req.get('user-agent')),
  });

  res.cookie(SESSION_COOKIE, token, cookieOptions(absoluteMs));
  issueCsrfToken(res, absoluteMs);

  return token;
}

/**
 * Token CSRF em cookie legivel pelo JavaScript da propria aplicacao
 * (padrao double submit). O cookie de sessao continua HttpOnly.
 */
export function issueCsrfToken(res: Response, maxAgeMs?: number): string {
  const env = getEnv();
  const token = randomBytes(24).toString('base64url');
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  });
  return token;
}

/** Compara dois tokens em tempo constante, tolerando tamanhos diferentes. */
export function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function resolveSession(
  db: Database,
  token: string | undefined,
): Promise<SessionContext | null> {
  if (!token) return null;

  const env = getEnv();
  const now = new Date();
  const idleCutoff = new Date(now.getTime() - env.SESSION_IDLE_MINUTES * 60 * 1000);

  const [row] = await db
    .select({
      sessionId: authSessions.id,
      workspaceId: authSessions.workspaceId,
      lastSeenAt: authSessions.lastSeenAt,
      userId: users.id,
      email: users.email,
      name: users.name,
      role: workspaceMembers.role,
      active: users.active,
      lastLoginAt: users.lastLoginAt,
      passwordChangedAt: users.passwordChangedAt,
    })
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .where(
      and(
        eq(authSessions.tokenHash, hashToken(token)),
        eq(workspaceMembers.status, 'ACTIVE'),
        eq(workspaces.status, 'ACTIVE'),
        isNull(authSessions.revokedAt),
        sql`${authSessions.expiresAt} > ${now}`,
        sql`${authSessions.lastSeenAt} > ${idleCutoff}`,
      ),
    )
    .limit(1);

  if (!row || !row.active) return null;

  // Renova a janela de inatividade no maximo uma vez por minuto para nao
  // gerar escrita a cada requisicao.
  if (now.getTime() - row.lastSeenAt.getTime() > 60_000) {
    await db
      .update(authSessions)
      .set({ lastSeenAt: now })
      .where(eq(authSessions.id, row.sessionId));
  }

  return {
    sessionId: row.sessionId,
    workspaceId: row.workspaceId,
    user: {
      id: row.userId,
      email: row.email,
      name: row.name,
      role: row.role,
      lastLoginAt: row.lastLoginAt,
      passwordChangedAt: row.passwordChangedAt,
    },
  };
}

export async function revokeSession(db: Database, sessionId: string): Promise<void> {
  await db
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(eq(authSessions.id, sessionId));
}

export async function revokeAllSessions(db: Database, userId: string): Promise<void> {
  await db
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
}

export function clearSessionCookies(res: Response): void {
  const env = getEnv();
  const base = { path: '/', secure: env.NODE_ENV === 'production', sameSite: 'lax' as const };
  res.clearCookie(SESSION_COOKIE, { ...base, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...base, httpOnly: false });
}

/** Limpeza de sessoes vencidas; roda junto com os jobs de manutencao. */
export async function purgeExpiredSessions(db: Database): Promise<number> {
  const now = new Date();
  const result = await db
    .delete(authSessions)
    .where(
      or(
        lt(authSessions.expiresAt, now),
        lt(authSessions.revokedAt, new Date(now.getTime() - 7 * 86_400_000)),
      ),
    );
  return Number((result as unknown as { affectedRows?: number }).affectedRows ?? 0);
}
