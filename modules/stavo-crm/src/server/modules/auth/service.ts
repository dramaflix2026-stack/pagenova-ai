/**
 * Regras de autenticacao: login com protecao contra forca bruta,
 * troca de senha autenticada e auditoria.
 *
 * Mensagens de erro sao SEMPRE genericas para nao permitir enumerar usuarios.
 */
import { createHash } from 'node:crypto';

import { eq } from 'drizzle-orm';

import type { Database } from '../../db/client';
import { auditLog, loginAttempts, users } from '../../db/schema';
import { badRequest, tooManyRequests, unauthorized } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { checkPasswordStrength, hashPassword, needsRehash, verifyPassword } from './password';
import { revokeAllSessions } from './sessions';

/** Mensagem unica para credencial invalida, usuario inexistente ou inativo. */
const GENERIC_LOGIN_ERROR = 'E-mail ou senha incorretos.';

const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_MINUTES = 15;
/** Contagem de falhas expira apos esta janela sem novas tentativas. */
const ATTEMPT_WINDOW_MINUTES = 30;

const attemptKey = (email: string, ip: string | undefined): string =>
  createHash('sha256').update(`${email.toLowerCase()}|${ip ?? 'sem-ip'}`).digest('hex');

/** Atraso progressivo: cresce com o numero de falhas, com teto de 2 segundos. */
export function progressiveDelayMs(failedCount: number): number {
  if (failedCount <= 1) return 0;
  return Math.min(2000, 2 ** Math.min(failedCount, 10) * 15);
}

const sleep = (ms: number): Promise<void> =>
  ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

export interface LoginResult {
  userId: string;
  email: string;
}

export async function attemptLogin(
  db: Database,
  input: { email: string; password: string; ip?: string | undefined },
): Promise<LoginResult> {
  const now = new Date();
  const key = attemptKey(input.email, input.ip);

  const [attempt] = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.attemptKey, key))
    .limit(1);

  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    const minutes = Math.max(1, Math.ceil((attempt.lockedUntil.getTime() - now.getTime()) / 60000));
    throw tooManyRequests(
      `Muitas tentativas seguidas. Aguarde ${minutes} minuto(s) antes de tentar novamente.`,
      'LOGIN_LOCKED',
    );
  }

  // A janela de contagem expira sozinha; um acerto tardio nao herda falhas antigas.
  const windowExpired =
    attempt && now.getTime() - attempt.lastFailedAt.getTime() > ATTEMPT_WINDOW_MINUTES * 60_000;
  const currentFailures = !attempt || windowExpired ? 0 : attempt.failedCount;

  await sleep(progressiveDelayMs(currentFailures));

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);

  // Mesmo sem usuario, o custo do hash e pago para nao vazar existencia por tempo.
  const storedHash =
    user?.passwordHash ??
    'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
  const passwordMatches = await verifyPassword(input.password, storedHash);

  if (!user || !user.active || !passwordMatches) {
    await registerFailure(db, key, currentFailures, now);
    throw unauthorized(GENERIC_LOGIN_ERROR);
  }

  await clearFailures(db, key);

  const updates: Partial<typeof users.$inferInsert> = { lastLoginAt: now, updatedAt: now };
  // Atualiza o hash quando os parametros de custo evoluirem.
  if (needsRehash(user.passwordHash)) {
    updates.passwordHash = await hashPassword(input.password);
  }
  await db.update(users).set(updates).where(eq(users.id, user.id));

  return { userId: user.id, email: user.email };
}

async function registerFailure(
  db: Database,
  key: string,
  currentFailures: number,
  now: Date,
): Promise<void> {
  const failedCount = currentFailures + 1;
  const lockedUntil =
    failedCount >= MAX_FAILED_ATTEMPTS ? new Date(now.getTime() + LOCKOUT_MINUTES * 60_000) : null;

  await db
    .insert(loginAttempts)
    .values({
      id: newId(),
      attemptKey: key,
      failedCount,
      firstFailedAt: now,
      lastFailedAt: now,
      lockedUntil,
    })
    .onDuplicateKeyUpdate({
      set: { failedCount, lastFailedAt: now, lockedUntil },
    });
}

async function clearFailures(db: Database, key: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.attemptKey, key));
}

export async function changePassword(
  db: Database,
  input: { userId: string; currentPassword: string; newPassword: string },
): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  if (!user) throw unauthorized();

  const matches = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!matches) {
    throw badRequest('A senha atual esta incorreta.', {
      code: 'INVALID_CURRENT_PASSWORD',
      fieldErrors: { currentPassword: ['A senha atual esta incorreta.'] },
    });
  }

  const strength = checkPasswordStrength(input.newPassword);
  if (!strength.ok) {
    throw badRequest(strength.reason ?? 'Senha recusada.', {
      code: 'WEAK_PASSWORD',
      fieldErrors: { newPassword: [strength.reason ?? 'Senha recusada.'] },
    });
  }

  const now = new Date();
  const passwordHash = await hashPassword(input.newPassword);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, passwordChangedAt: now, updatedAt: now })
      .where(eq(users.id, user.id));

    // Toda sessao anterior perde a validade; o proprio navegador refaz o login.
    await revokeAllSessions(tx as unknown as Database, user.id);

    await tx.insert(auditLog).values({
      id: newId(),
      action: 'PASSWORD_CHANGED',
      entityType: 'users',
      entityId: user.id,
      actorUserId: user.id,
      summary: 'Senha alterada pelo administrador autenticado.',
      metadata: { sessionsRevoked: true },
      occurredAt: now,
    });
  });
}
