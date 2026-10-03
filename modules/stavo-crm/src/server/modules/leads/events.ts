/**
 * Motor de eventos do CRM.
 *
 * O log `lead_events` e imutavel: nada e apagado ou editado. Correcoes viram
 * eventos de reversao.
 *
 * Dois tipos de evento sao SINGULARES por lead e o banco garante isso pela
 * coluna `unique_scope`:
 *   - FIRST_CONTACT_RECORDED  (o primeiro contato existe uma unica vez)
 *   - FIRST_RESPONSE_RECORDED (a primeira resposta existe uma unica vez)
 *
 * Voltar o card e mover de novo NAO cria um segundo evento; tres follow-ups
 * continuam sendo um unico primeiro contato.
 */
import { and, desc, eq } from 'drizzle-orm';

import type { LeadEventType } from '../../../shared/constants';
import { isDuplicateKeyError, type Database } from '../../db/client';
import { leadEvents, type LeadEvent } from '../../db/schema';
import { newId } from '../../lib/ids';

/** Eventos que podem existir no maximo uma vez por lead. */
export const SINGLETON_EVENT_TYPES: readonly LeadEventType[] = [
  'FIRST_CONTACT_RECORDED',
  'FIRST_RESPONSE_RECORDED',
];

export const isSingletonEvent = (eventType: LeadEventType): boolean =>
  SINGLETON_EVENT_TYPES.includes(eventType);

export interface RecordEventInput {
  leadId: string;
  eventType: LeadEventType;
  occurredAt?: Date;
  actorUserId?: string | null;
  payload?: Record<string, unknown> | null;
  /** Repetir a mesma chave nao gera um segundo evento. */
  idempotencyKey?: string | null;
  /**
   * Reuniao referenciada, quando aplicavel.
   *
   * Coluna propria em vez de campo dentro do payload: "eventos desta reuniao"
   * e consulta do drawer, e filtrar por JSON nao usa indice.
   */
  meetingId?: string | null;
  /**
   * Escopo extra de unicidade para eventos que se repetem por ciclo, como
   * LOSS_RECORDED (um por ciclo logico de perda).
   */
  uniqueScopeSuffix?: string | null;
}

export interface RecordEventResult {
  event: LeadEvent | null;
  /** false quando o evento ja existia e nada novo foi criado. */
  created: boolean;
}

function buildUniqueScope(input: RecordEventInput): string | null {
  if (input.uniqueScopeSuffix) {
    return `${input.leadId}:${input.eventType}:${input.uniqueScopeSuffix}`.slice(0, 80);
  }
  if (isSingletonEvent(input.eventType)) {
    return `${input.leadId}:${input.eventType}`.slice(0, 80);
  }
  return null;
}

/**
 * Registra um evento respeitando unicidade e idempotencia.
 * Deve rodar dentro da transacao da operacao de negocio.
 */
export async function recordEvent(
  tx: Database,
  input: RecordEventInput,
): Promise<RecordEventResult> {
  const uniqueScope = buildUniqueScope(input);
  const occurredAt = input.occurredAt ?? new Date();

  // Curto-circuito antes de tentar inserir: evita gastar id e log de erro.
  if (uniqueScope) {
    const existing = await findByUniqueScope(tx, uniqueScope);
    if (existing) return { event: existing, created: false };
  }

  if (input.idempotencyKey) {
    const existing = await findByIdempotencyKey(tx, input.idempotencyKey);
    if (existing) return { event: existing, created: false };
  }

  const row = {
    id: newId(),
    leadId: input.leadId,
    eventType: input.eventType,
    uniqueScope,
    idempotencyKey: input.idempotencyKey ?? null,
    meetingId: input.meetingId ?? null,
    actorUserId: input.actorUserId ?? null,
    occurredAt,
    payloadVersion: 1,
    payload: input.payload ?? null,
    createdAt: new Date(),
  };

  try {
    await tx.insert(leadEvents).values(row);
    return { event: row as LeadEvent, created: true };
  } catch (error) {
    // Corrida entre duas requisicoes simultaneas: o banco decidiu por nos.
    if (isDuplicateKeyError(error)) {
      const existing = uniqueScope
        ? await findByUniqueScope(tx, uniqueScope)
        : input.idempotencyKey
          ? await findByIdempotencyKey(tx, input.idempotencyKey)
          : null;
      if (existing) return { event: existing, created: false };
    }
    throw error;
  }
}

async function findByUniqueScope(tx: Database, uniqueScope: string): Promise<LeadEvent | null> {
  const [row] = await tx
    .select()
    .from(leadEvents)
    .where(eq(leadEvents.uniqueScope, uniqueScope))
    .limit(1);
  return row ?? null;
}

async function findByIdempotencyKey(tx: Database, key: string): Promise<LeadEvent | null> {
  const [row] = await tx
    .select()
    .from(leadEvents)
    .where(eq(leadEvents.idempotencyKey, key))
    .limit(1);
  return row ?? null;
}

/** Indica se o lead ja possui um evento singular registrado. */
export async function hasSingletonEvent(
  db: Database,
  leadId: string,
  eventType: LeadEventType,
): Promise<boolean> {
  const [row] = await db
    .select({ id: leadEvents.id })
    .from(leadEvents)
    .where(eq(leadEvents.uniqueScope, `${leadId}:${eventType}`))
    .limit(1);
  return Boolean(row);
}

/** Historico completo de um lead, do mais recente para o mais antigo. */
export async function listLeadEvents(
  db: Database,
  leadId: string,
  limit = 200,
): Promise<LeadEvent[]> {
  return db
    .select()
    .from(leadEvents)
    .where(eq(leadEvents.leadId, leadId))
    .orderBy(desc(leadEvents.occurredAt), desc(leadEvents.id))
    .limit(limit);
}

/** Ultimo evento de um tipo, usado para regras dependentes de ciclo. */
export async function lastEventOfType(
  db: Database,
  leadId: string,
  eventType: LeadEventType,
): Promise<LeadEvent | null> {
  const [row] = await db
    .select()
    .from(leadEvents)
    .where(and(eq(leadEvents.leadId, leadId), eq(leadEvents.eventType, eventType)))
    .orderBy(desc(leadEvents.occurredAt), desc(leadEvents.id))
    .limit(1);
  return row ?? null;
}
