/**
 * Acesso ao banco do Garimpoo.
 *
 * Tudo que envolve dinheiro e acesso passa por aqui, e nada aqui decide
 * regra: quem decide e o `service.ts`. A separacao existe porque conceder ou
 * cortar acesso e a operacao mais sensivel desta ferramenta -- a regra
 * precisa ficar num lugar so, testavel sem banco.
 */
import { and, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm';

import { getDb, type Database } from '../../db/client';
import {
  garimpooMembers,
  garimpooSearchLog,
  garimpooSessions,
  garimpooWebhookEvents,
  type GarimpooMember,
  type GarimpooSession,
} from '../../db/schema';
import { newId } from '../../lib/ids';

// ---------------------------------------------------------------------------
// Membros
// ---------------------------------------------------------------------------

export async function findMemberByEmail(
  email: string,
  db: Database = getDb(),
): Promise<GarimpooMember | null> {
  const [row] = await db
    .select()
    .from(garimpooMembers)
    .where(eq(garimpooMembers.email, email.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}

export async function findMemberById(id: string, db: Database = getDb()): Promise<GarimpooMember | null> {
  const [row] = await db.select().from(garimpooMembers).where(eq(garimpooMembers.id, id)).limit(1);
  return row ?? null;
}

export interface UpsertMemberInput {
  email: string;
  name?: string | null;
  phone?: string | null;
  orderId?: string | null;
  customerId?: string | null;
  purchasedAt?: Date;
}

/**
 * Compra aprovada: cria o membro ou reativa um antigo.
 *
 * Quem ja tinha senha volta direto para ACTIVE (comprou de novo depois de um
 * reembolso, por exemplo). Quem nunca ativou fica PENDING ate escolher a
 * senha. A senha existente NUNCA e apagada aqui: recompra nao pode derrubar
 * quem ja estava usando.
 */
export async function upsertMemberFromPurchase(
  input: UpsertMemberInput,
  db: Database = getDb(),
): Promise<{ member: GarimpooMember; created: boolean }> {
  const email = input.email.trim().toLowerCase();
  const now = new Date();
  const existente = await findMemberByEmail(email, db);

  if (existente) {
    await db
      .update(garimpooMembers)
      .set({
        name: input.name ?? existente.name,
        phone: input.phone ?? existente.phone,
        lastOrderId: input.orderId ?? existente.lastOrderId,
        caktoCustomerId: input.customerId ?? existente.caktoCustomerId,
        purchasedAt: input.purchasedAt ?? now,
        status: existente.passwordHash ? 'ACTIVE' : 'PENDING',
        revokedAt: null,
        revokedReason: null,
        updatedAt: now,
      })
      .where(eq(garimpooMembers.id, existente.id));

    return { member: (await findMemberById(existente.id, db))!, created: false };
  }

  const id = newId();
  await db.insert(garimpooMembers).values({
    id,
    email,
    name: input.name ?? null,
    phone: input.phone ?? null,
    status: 'PENDING',
    source: 'CAKTO',
    lastOrderId: input.orderId ?? null,
    caktoCustomerId: input.customerId ?? null,
    purchasedAt: input.purchasedAt ?? now,
    createdAt: now,
    updatedAt: now,
  });

  return { member: (await findMemberById(id, db))!, created: true };
}

/** Ativacao: grava a senha escolhida e libera o uso. */
export async function activateMember(
  memberId: string,
  passwordHash: string,
  db: Database = getDb(),
): Promise<void> {
  const now = new Date();
  await db
    .update(garimpooMembers)
    .set({ passwordHash, status: 'ACTIVE', activatedAt: now, updatedAt: now })
    .where(eq(garimpooMembers.id, memberId));
}

/** Corta o acesso e derruba as sessoes abertas, na mesma transacao. */
export async function revokeMember(
  memberId: string,
  reason: string,
  db: Database = getDb(),
): Promise<void> {
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(garimpooMembers)
      .set({ status: 'REVOKED', revokedAt: now, revokedReason: reason, updatedAt: now })
      .where(eq(garimpooMembers.id, memberId));

    await tx
      .update(garimpooSessions)
      .set({ revokedAt: now, revokedReason: 'REVOKED_MEMBER' })
      .where(and(eq(garimpooSessions.memberId, memberId), isNull(garimpooSessions.revokedAt)));
  });
}

export async function touchLogin(memberId: string, db: Database = getDb()): Promise<void> {
  const now = new Date();
  await db
    .update(garimpooMembers)
    .set({ lastLoginAt: now, updatedAt: now })
    .where(eq(garimpooMembers.id, memberId));
}

// ---------------------------------------------------------------------------
// Sessoes
// ---------------------------------------------------------------------------

export interface CreateSessionInput {
  memberId: string;
  tokenHash: string;
  deviceId: string;
  deviceLabel: string | null;
  ipHash: string | null;
  expiresAt: Date;
}

/**
 * Cria a sessao e revoga as outras: sessao unica por membro.
 *
 * E a trava principal contra senha compartilhada. Duas pessoas usando a mesma
 * conta ficam se derrubando, o que resolve sozinho sem bloquear quem trocou
 * de aparelho de verdade.
 */
export async function createSessionRevokingOthers(
  input: CreateSessionInput,
  db: Database = getDb(),
): Promise<string> {
  const id = newId();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(garimpooSessions)
      .set({ revokedAt: now, revokedReason: 'NEW_LOGIN' })
      .where(and(eq(garimpooSessions.memberId, input.memberId), isNull(garimpooSessions.revokedAt)));

    await tx.insert(garimpooSessions).values({
      id,
      memberId: input.memberId,
      tokenHash: input.tokenHash,
      deviceId: input.deviceId,
      deviceLabel: input.deviceLabel,
      ipHash: input.ipHash,
      createdAt: now,
      lastSeenAt: now,
      expiresAt: input.expiresAt,
    });
  });

  return id;
}

export async function findSessionByTokenHash(
  tokenHash: string,
  db: Database = getDb(),
): Promise<GarimpooSession | null> {
  const [row] = await db
    .select()
    .from(garimpooSessions)
    .where(eq(garimpooSessions.tokenHash, tokenHash))
    .limit(1);
  return row ?? null;
}

export async function touchSession(sessionId: string, db: Database = getDb()): Promise<void> {
  await db
    .update(garimpooSessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(garimpooSessions.id, sessionId));
}

export async function revokeSession(
  sessionId: string,
  reason: string,
  db: Database = getDb(),
): Promise<void> {
  await db
    .update(garimpooSessions)
    .set({ revokedAt: new Date(), revokedReason: reason })
    .where(and(eq(garimpooSessions.id, sessionId), isNull(garimpooSessions.revokedAt)));
}

/** Limpeza das sessoes vencidas. Roda junto da manutencao diaria. */
export async function expireOldSessions(db: Database = getDb()): Promise<number> {
  const result = await db
    .update(garimpooSessions)
    .set({ revokedAt: new Date(), revokedReason: 'EXPIRED' })
    .where(and(isNull(garimpooSessions.revokedAt), lt(garimpooSessions.expiresAt, new Date())));
  return Number((result as unknown as { rowsAffected?: number }).rowsAffected ?? 0);
}

// ---------------------------------------------------------------------------
// Buscas
// ---------------------------------------------------------------------------

export interface SearchLogInput {
  memberId: string;
  niche: string;
  city?: string | null;
  state?: string | null;
  resultCount: number;
  pageNumber: number;
  ipHash: string | null;
}

export async function logSearch(input: SearchLogInput, db: Database = getDb()): Promise<void> {
  await db.insert(garimpooSearchLog).values({
    id: newId(),
    memberId: input.memberId,
    niche: input.niche.slice(0, 120),
    city: input.city?.slice(0, 120) ?? null,
    state: input.state?.slice(0, 80) ?? null,
    resultCount: input.resultCount,
    pageNumber: input.pageNumber,
    ipHash: input.ipHash,
    createdAt: new Date(),
  });
}

/** Buscas do membro desde `from`. Alimenta o limite diario. */
export async function countSearchesSince(
  memberId: string,
  from: Date,
  db: Database = getDb(),
): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)` })
    .from(garimpooSearchLog)
    .where(and(eq(garimpooSearchLog.memberId, memberId), gte(garimpooSearchLog.createdAt, from)));
  return Number(row?.total ?? 0);
}

export async function recentSearches(memberId: string, limit = 10, db: Database = getDb()) {
  return db
    .select({
      niche: garimpooSearchLog.niche,
      city: garimpooSearchLog.city,
      state: garimpooSearchLog.state,
      resultCount: garimpooSearchLog.resultCount,
      createdAt: garimpooSearchLog.createdAt,
    })
    .from(garimpooSearchLog)
    .where(eq(garimpooSearchLog.memberId, memberId))
    .orderBy(desc(garimpooSearchLog.createdAt))
    .limit(Math.min(limit, 50));
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

export interface WebhookEventInput {
  externalId: string;
  eventType: string;
  orderId: string | null;
  email: string | null;
  status: 'APPLIED' | 'IGNORED' | 'FAILED';
  outcome: string;
}

/**
 * Registra o evento. Devolve `false` quando ele JA tinha sido processado.
 *
 * A idempotencia mora no indice unico: a plataforma reenvia evento quando nao
 * recebe 200 rapido, e conceder acesso duas vezes ou revogar por engano seria
 * pior do que ignorar uma repeticao.
 */
export async function recordWebhookEvent(
  input: WebhookEventInput,
  db: Database = getDb(),
): Promise<boolean> {
  const existente = await db
    .select({ id: garimpooWebhookEvents.id })
    .from(garimpooWebhookEvents)
    .where(
      and(
        eq(garimpooWebhookEvents.provider, 'CAKTO'),
        eq(garimpooWebhookEvents.externalId, input.externalId),
      ),
    )
    .limit(1);

  if (existente.length > 0) return false;

  await db.insert(garimpooWebhookEvents).values({
    id: newId(),
    provider: 'CAKTO',
    externalId: input.externalId,
    eventType: input.eventType,
    orderId: input.orderId,
    email: input.email,
    status: input.status,
    outcome: input.outcome.slice(0, 255),
    receivedAt: new Date(),
  });

  return true;
}
