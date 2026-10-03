/**
 * Regras de negocio das reunioes.
 *
 * Invariantes que este arquivo garante, e que nenhuma tela pode dispensar:
 *
 *  - toda reuniao pertence a um lead existente e nao arquivado;
 *  - o link do Meet e obrigatorio e passa pelo dominio compartilhado;
 *  - reuniao nao comeca no passado nem termina antes de comecar;
 *  - duas reunioes AGENDADAS nunca se sobrepoem;
 *  - reagendar altera a MESMA linha e registra o antes/depois;
 *  - cancelar, concluir e registrar ausencia nunca apagam nada;
 *  - reuniao + evento + lembretes vivem na mesma transacao;
 *  - repetir a mesma requisicao devolve o mesmo resultado, sem duplicar.
 *
 * Concorrencia: a checagem de conflito roda DENTRO da transacao com
 * `SELECT ... FOR UPDATE` sobre a janela. No InnoDB em REPEATABLE READ isso
 * pega gap lock no intervalo do indice, entao duas requisicoes quase
 * simultaneas nao conseguem inserir reunioes sobrepostas -- a segunda espera
 * a primeira e enxerga o conflito.
 */
import { and, asc, desc, eq, gt, gte, inArray, isNull, lt, lte, ne, or, sql } from 'drizzle-orm';

import {
  DEFAULT_REMINDER_OFFSETS,
  futureReminderOffsets,
  meetingUrgency,
  parseMeetUrl,
  type MeetingStatus,
  type MeetingUrgency,
} from '../../../shared/meetings';
import type {
  CancelMeetingInput,
  CompleteMeetingInput,
  CreateMeetingInput,
  NoShowMeetingInput,
  RescheduleMeetingInput,
  UpdateMeetingInput,
} from '../../../shared/schemas';
import type { Database } from '../../db/client';
import {
  leadEvents,
  leads,
  meetingReminders,
  meetings,
  services,
  stages,
  type Meeting,
} from '../../db/schema';
import { AppError, badRequest, conflict, notFound, unprocessable } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { recordEvent } from '../leads/events';

// ---------------------------------------------------------------------------
// Erros de dominio
// ---------------------------------------------------------------------------

const meetingNotFound = () => notFound('Reuniao nao encontrada.', 'MEETING_NOT_FOUND');

const staleVersion = () =>
  new AppError(
    409,
    'STALE_MEETING_VERSION',
    'Esta reuniao foi alterada em outro lugar. Atualize a tela e tente de novo.',
  );

const invalidTransition = (from: MeetingStatus, to: MeetingStatus) =>
  new AppError(
    409,
    'INVALID_MEETING_TRANSITION',
    `Uma reuniao ${from === 'SCHEDULED' ? 'agendada' : 'ja encerrada'} nao pode ser marcada como ${to}.`,
  );

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

export interface MeetingView extends Meeting {
  leadName: string;
  leadStageName: string;
  leadArchived: boolean;
  serviceName: string | null;
}

const VIEW_COLUMNS = {
  meeting: meetings,
  leadName: leads.internalName,
  leadStageName: stages.name,
  leadArchivedAt: leads.archivedAt,
  serviceName: services.name,
};

const toView = (row: {
  meeting: Meeting;
  leadName: string;
  leadStageName: string;
  leadArchivedAt: Date | null;
  serviceName: string | null;
}): MeetingView => ({
  ...row.meeting,
  leadName: row.leadName,
  leadStageName: row.leadStageName,
  leadArchived: Boolean(row.leadArchivedAt),
  serviceName: row.serviceName,
});

const baseQuery = (db: Database) =>
  db
    .select(VIEW_COLUMNS)
    .from(meetings)
    .innerJoin(leads, eq(leads.id, meetings.leadId))
    .innerJoin(stages, eq(stages.id, leads.currentStageId))
    .leftJoin(services, eq(services.id, meetings.serviceId));

export async function getMeetingOrThrow(db: Database, meetingId: string): Promise<MeetingView> {
  const [row] = await baseQuery(db).where(eq(meetings.id, meetingId)).limit(1);
  if (!row) throw meetingNotFound();
  return toView(row);
}

export interface ListMeetingsFilters {
  start: Date;
  end: Date;
  status?: MeetingStatus | undefined;
  leadId?: string | undefined;
  search?: string | undefined;
}

/**
 * Reunioes que TOCAM a janela pedida.
 *
 * Uma reuniao que comeca antes do inicio da janela e termina dentro dela
 * precisa aparecer; por isso a comparacao e de sobreposicao, e nao
 * `start_at between ...`, que esconderia eventos atravessando a borda.
 */
export async function listMeetings(
  db: Database,
  filters: ListMeetingsFilters,
): Promise<MeetingView[]> {
  const conditions = [lt(meetings.startAt, filters.end), gt(meetings.endAt, filters.start)];

  if (filters.status) conditions.push(eq(meetings.status, filters.status));
  if (filters.leadId) conditions.push(eq(meetings.leadId, filters.leadId));
  if (filters.search) {
    const termo = `%${filters.search}%`;
    conditions.push(
      or(sql`${leads.internalName} like ${termo}`, sql`${meetings.title} like ${termo}`)!,
    );
  }

  const rows = await baseQuery(db)
    .where(and(...conditions))
    .orderBy(asc(meetings.startAt))
    .limit(500);

  return rows.map(toView);
}

/** Proximas reunioes agendadas: card, drawer e resumo do dia. */
export async function listUpcomingMeetings(
  db: Database,
  options: { limit?: number; leadId?: string; now?: Date } = {},
): Promise<MeetingView[]> {
  const now = options.now ?? new Date();
  const conditions = [
    eq(meetings.status, 'SCHEDULED'),
    // Em andamento ainda conta como proxima: o botao do Meet importa agora.
    gt(meetings.endAt, now),
  ];
  if (options.leadId) conditions.push(eq(meetings.leadId, options.leadId));

  const rows = await baseQuery(db)
    .where(and(...conditions))
    .orderBy(asc(meetings.startAt))
    .limit(Math.min(options.limit ?? 20, 100));

  return rows.map(toView);
}

/** Todas as reunioes de um lead, futuras e passadas, para o drawer. */
export async function listMeetingsByLead(
  db: Database,
  leadId: string,
  limit = 50,
): Promise<MeetingView[]> {
  const rows = await baseQuery(db)
    .where(eq(meetings.leadId, leadId))
    .orderBy(desc(meetings.startAt))
    .limit(limit);
  return rows.map(toView);
}

export interface NextMeetingSummary {
  id: string;
  leadId: string;
  title: string;
  startAt: Date;
  endAt: Date;
  meetUrl: string;
  /** Quantas outras reunioes agendadas o lead ainda tem depois desta. */
  otherCount: number;
}

/**
 * Proxima reuniao de cada lead do quadro, em UMA consulta.
 *
 * O Kanban desenha centenas de cards; buscar reuniao card a card seria N+1 e
 * derrubaria o tempo de carregamento do quadro.
 */
export async function nextMeetingByLead(
  db: Database,
  leadIds: string[],
  now: Date = new Date(),
): Promise<Map<string, NextMeetingSummary>> {
  const resultado = new Map<string, NextMeetingSummary>();
  if (leadIds.length === 0) return resultado;

  const rows = await db
    .select({
      id: meetings.id,
      leadId: meetings.leadId,
      title: meetings.title,
      startAt: meetings.startAt,
      endAt: meetings.endAt,
      meetUrl: meetings.meetUrl,
    })
    .from(meetings)
    .where(
      and(
        inArray(meetings.leadId, leadIds),
        eq(meetings.status, 'SCHEDULED'),
        gt(meetings.endAt, now),
      ),
    )
    .orderBy(asc(meetings.leadId), asc(meetings.startAt));

  for (const row of rows) {
    const atual = resultado.get(row.leadId);
    if (atual) {
      atual.otherCount += 1;
      continue;
    }
    resultado.set(row.leadId, { ...row, otherCount: 0 });
  }

  return resultado;
}

// ---------------------------------------------------------------------------
// Validacoes compartilhadas pelas mutacoes
// ---------------------------------------------------------------------------

/**
 * Trava a janela e recusa sobreposicao com outra reuniao agendada.
 *
 * `FOR UPDATE` e o que torna a checagem confiavel sob concorrencia: sem ele,
 * duas requisicoes simultaneas leriam "sem conflito" e ambas gravariam.
 */
async function assertNoConflict(
  tx: Database,
  range: { start: Date; end: Date },
  ignoreMeetingId?: string,
): Promise<void> {
  const conditions = [
    eq(meetings.status, 'SCHEDULED'),
    lt(meetings.startAt, range.end),
    gt(meetings.endAt, range.start),
  ];
  if (ignoreMeetingId) conditions.push(ne(meetings.id, ignoreMeetingId));

  const [conflito] = await tx
    .select({
      id: meetings.id,
      startAt: meetings.startAt,
      endAt: meetings.endAt,
      leadName: leads.internalName,
    })
    .from(meetings)
    .innerJoin(leads, eq(leads.id, meetings.leadId))
    .where(and(...conditions))
    .limit(1)
    .for('update');

  if (!conflito) return;

  const hora = (valor: Date) =>
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(valor);

  throw new AppError(
    409,
    'MEETING_CONFLICT',
    `Ja existe uma reuniao com ${conflito.leadName} entre ${hora(conflito.startAt)} e ` +
      `${hora(conflito.endAt)}. Escolha outro horario.`,
    { details: { conflictingMeetingId: conflito.id } },
  );
}

/** Faixa temporal valida para uma reuniao que esta sendo marcada agora. */
function assertValidRange(start: Date, end: Date, now: Date): void {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw badRequest('Data ou horario invalido.', { code: 'INVALID_TIME_RANGE' });
  }
  if (end <= start) {
    throw badRequest('O horario final deve ser posterior ao horario inicial.', {
      code: 'INVALID_TIME_RANGE',
      fieldErrors: { endAt: ['O horario final deve ser posterior ao horario inicial.'] },
    });
  }
  if (start < now) {
    throw badRequest('Nao e possivel agendar uma reuniao no passado.', {
      code: 'MEETING_IN_PAST',
      fieldErrors: { startAt: ['Nao e possivel agendar uma reuniao no passado.'] },
    });
  }
}

/** O lead precisa existir e estar ativo para receber reuniao nova. */
async function assertLeadUsable(tx: Database, leadId: string): Promise<void> {
  const [lead] = await tx
    .select({ id: leads.id, archivedAt: leads.archivedAt })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!lead) throw notFound('Cliente nao encontrado no CRM.', 'LEAD_NOT_FOUND');
  if (lead.archivedAt) {
    throw unprocessable('Este lead esta arquivado. Restaure-o antes de agendar uma reuniao.', {
      code: 'LEAD_ARCHIVED',
    });
  }
}

/** Recusa salvar por cima de uma versao que a tela nao viu. */
function assertVersion(atual: Meeting, esperada: number): void {
  if (atual.version !== esperada) throw staleVersion();
}

// ---------------------------------------------------------------------------
// Lembretes
// ---------------------------------------------------------------------------

/**
 * Cria os lembretes ainda futuros da versao informada.
 *
 * Lembrete no passado nao e criado: ele nunca dispararia. Uma reuniao marcada
 * para daqui a 20 minutos simplesmente nasce sem lembretes e ja entra na
 * faixa de urgencia dos alertas.
 */
async function createReminders(
  tx: Database,
  meeting: { id: string; startAt: Date; version: number },
  offsets: readonly number[],
  now: Date,
): Promise<void> {
  const validos = futureReminderOffsets(meeting.startAt, offsets, now);
  if (validos.length === 0) return;

  await tx.insert(meetingReminders).values(
    validos.map((offset) => ({
      id: newId(),
      meetingId: meeting.id,
      offsetMinutes: offset,
      remindAt: new Date(meeting.startAt.getTime() - offset * 60_000),
      status: 'PENDING',
      meetingVersion: meeting.version,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

/** Cancela logicamente os lembretes que ainda nao foram vistos. */
async function cancelPendingReminders(tx: Database, meetingId: string, now: Date): Promise<void> {
  await tx
    .update(meetingReminders)
    .set({ status: 'CANCELED', canceledAt: now, updatedAt: now })
    .where(
      and(
        eq(meetingReminders.meetingId, meetingId),
        inArray(meetingReminders.status, ['PENDING', 'READ']),
      ),
    );
}

// ---------------------------------------------------------------------------
// Idempotencia
// ---------------------------------------------------------------------------

/**
 * Ja processamos esta requisicao?
 *
 * O log de eventos e a fonte: cada mutacao grava um evento com a chave do
 * cliente, e a coluna tem indice unico. Reenviar por timeout ou clique duplo
 * encontra o evento e devolve a reuniao como estava.
 */
async function alreadyProcessed(db: Database, idempotencyKey: string): Promise<string | null> {
  const [evento] = await db
    .select({ meetingId: leadEvents.meetingId })
    .from(leadEvents)
    .where(eq(leadEvents.idempotencyKey, idempotencyKey))
    .limit(1);
  return evento?.meetingId ?? null;
}

// ---------------------------------------------------------------------------
// Criacao
// ---------------------------------------------------------------------------

export async function createMeeting(
  db: Database,
  input: CreateMeetingInput,
  actorUserId: string,
  now: Date = new Date(),
): Promise<MeetingView> {
  const repetida = await alreadyProcessed(db, input.idempotencyKey);
  if (repetida) return getMeetingOrThrow(db, repetida);

  const start = new Date(input.startAt);
  const end = new Date(input.endAt);
  assertValidRange(start, end, now);

  // O schema ja normalizou, mas a autoridade final e o dominio: uma chamada
  // direta a API nao pode contornar a regra do link.
  const link = parseMeetUrl(input.meetUrl);
  if (!link.ok) {
    throw badRequest(link.reason, {
      code: 'INVALID_MEET_URL',
      fieldErrors: { meetUrl: [link.reason] },
    });
  }

  const meetingId = newId();

  await db.transaction(async (tx) => {
    await assertLeadUsable(tx, input.leadId);
    await assertNoConflict(tx, { start, end });

    await tx.insert(meetings).values({
      id: meetingId,
      leadId: input.leadId,
      title: input.title,
      agenda: input.agenda ?? null,
      internalNotes: input.internalNotes ?? null,
      serviceId: input.serviceId ?? null,
      startAt: start,
      endAt: end,
      timezone: input.timezone,
      meetUrl: link.url,
      status: 'SCHEDULED',
      createdBy: actorUserId,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    await recordEvent(tx, {
      leadId: input.leadId,
      eventType: 'MEETING_SCHEDULED',
      occurredAt: now,
      actorUserId,
      meetingId,
      payload: {
        title: input.title,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        timezone: input.timezone,
      },
      idempotencyKey: input.idempotencyKey,
    });

    await createReminders(
      tx,
      { id: meetingId, startAt: start, version: 1 },
      input.reminderOffsetsMinutes ?? DEFAULT_REMINDER_OFFSETS,
      now,
    );
  });

  return getMeetingOrThrow(db, meetingId);
}

// ---------------------------------------------------------------------------
// Edicao de conteudo
// ---------------------------------------------------------------------------

export async function updateMeeting(
  db: Database,
  meetingId: string,
  input: UpdateMeetingInput,
  actorUserId: string,
  now: Date = new Date(),
): Promise<MeetingView> {
  const repetida = await alreadyProcessed(db, input.idempotencyKey);
  if (repetida) return getMeetingOrThrow(db, repetida);

  const atual = await getMeetingOrThrow(db, meetingId);
  assertVersion(atual, input.expectedVersion);

  if (atual.status !== 'SCHEDULED') {
    throw new AppError(
      409,
      'INVALID_MEETING_TRANSITION',
      'Somente uma reuniao agendada pode ser editada.',
    );
  }

  let novoLink = atual.meetUrl;
  if (input.meetUrl !== undefined) {
    const link = parseMeetUrl(input.meetUrl);
    if (!link.ok) {
      throw badRequest(link.reason, {
        code: 'INVALID_MEET_URL',
        fieldErrors: { meetUrl: [link.reason] },
      });
    }
    novoLink = link.url;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(meetings)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.agenda !== undefined ? { agenda: input.agenda ?? null } : {}),
        ...(input.internalNotes !== undefined
          ? { internalNotes: input.internalNotes ?? null }
          : {}),
        ...(input.serviceId !== undefined ? { serviceId: input.serviceId ?? null } : {}),
        meetUrl: novoLink,
        version: atual.version + 1,
        updatedAt: now,
      })
      .where(and(eq(meetings.id, meetingId), eq(meetings.version, input.expectedVersion)));

    await recordEvent(tx, {
      leadId: atual.leadId,
      eventType: 'MEETING_UPDATED',
      occurredAt: now,
      actorUserId,
      meetingId,
      payload: {
        title: input.title ?? atual.title,
        meetUrlChanged: novoLink !== atual.meetUrl,
      },
      idempotencyKey: input.idempotencyKey,
    });
  });

  return getMeetingOrThrow(db, meetingId);
}

// ---------------------------------------------------------------------------
// Reagendamento
// ---------------------------------------------------------------------------

/**
 * Muda o horario da MESMA reuniao.
 *
 * Nao cria uma segunda linha: sem isso, a data antiga ficaria com um evento
 * fantasma no calendario e o lead pareceria ter duas reunioes.
 */
export async function rescheduleMeeting(
  db: Database,
  meetingId: string,
  input: RescheduleMeetingInput,
  actorUserId: string,
  now: Date = new Date(),
): Promise<MeetingView> {
  const repetida = await alreadyProcessed(db, input.idempotencyKey);
  if (repetida) return getMeetingOrThrow(db, repetida);

  const atual = await getMeetingOrThrow(db, meetingId);
  assertVersion(atual, input.expectedVersion);

  if (atual.status !== 'SCHEDULED') {
    throw invalidTransition(atual.status as MeetingStatus, 'SCHEDULED');
  }

  const start = new Date(input.startAt);
  const end = new Date(input.endAt);
  assertValidRange(start, end, now);

  let novoLink = atual.meetUrl;
  if (input.meetUrl !== undefined) {
    const link = parseMeetUrl(input.meetUrl);
    if (!link.ok) {
      throw badRequest(link.reason, {
        code: 'INVALID_MEET_URL',
        fieldErrors: { meetUrl: [link.reason] },
      });
    }
    novoLink = link.url;
  }

  const novaVersao = atual.version + 1;

  await db.transaction(async (tx) => {
    // A propria reuniao nao conta como conflito consigo mesma.
    await assertNoConflict(tx, { start, end }, meetingId);

    await tx
      .update(meetings)
      .set({
        startAt: start,
        endAt: end,
        meetUrl: novoLink,
        version: novaVersao,
        updatedAt: now,
      })
      .where(and(eq(meetings.id, meetingId), eq(meetings.version, input.expectedVersion)));

    await recordEvent(tx, {
      leadId: atual.leadId,
      eventType: 'MEETING_RESCHEDULED',
      occurredAt: now,
      actorUserId,
      meetingId,
      payload: {
        from: { startAt: atual.startAt.toISOString(), endAt: atual.endAt.toISOString() },
        to: { startAt: start.toISOString(), endAt: end.toISOString() },
      },
      idempotencyKey: input.idempotencyKey,
    });

    // Os avisos do horario antigo morrem junto com o horario antigo.
    await cancelPendingReminders(tx, meetingId, now);
    await createReminders(
      tx,
      { id: meetingId, startAt: start, version: novaVersao },
      input.reminderOffsetsMinutes ?? DEFAULT_REMINDER_OFFSETS,
      now,
    );
  });

  return getMeetingOrThrow(db, meetingId);
}

// ---------------------------------------------------------------------------
// Desfechos
// ---------------------------------------------------------------------------

interface OutcomeOptions {
  status: Exclude<MeetingStatus, 'SCHEDULED'>;
  eventType: 'MEETING_COMPLETED' | 'MEETING_CANCELED' | 'MEETING_NO_SHOW';
  campos: Partial<Meeting>;
  payload: Record<string, unknown>;
  expectedVersion: number;
  idempotencyKey: string;
}

/**
 * Caminho unico dos tres desfechos.
 *
 * Concentrar aqui garante que nenhum deles esqueca de cancelar lembretes ou
 * de gravar o evento -- o tipo de divergencia que aparece semanas depois como
 * "aquele aviso continua aparecendo".
 */
async function applyOutcome(
  db: Database,
  meetingId: string,
  actorUserId: string,
  now: Date,
  options: OutcomeOptions,
): Promise<MeetingView> {
  const repetida = await alreadyProcessed(db, options.idempotencyKey);
  if (repetida) return getMeetingOrThrow(db, repetida);

  const atual = await getMeetingOrThrow(db, meetingId);
  assertVersion(atual, options.expectedVersion);

  if (atual.status !== 'SCHEDULED') {
    throw invalidTransition(atual.status as MeetingStatus, options.status);
  }

  await db.transaction(async (tx) => {
    await tx
      .update(meetings)
      .set({
        status: options.status,
        ...options.campos,
        version: atual.version + 1,
        updatedAt: now,
      })
      .where(and(eq(meetings.id, meetingId), eq(meetings.version, options.expectedVersion)));

    await recordEvent(tx, {
      leadId: atual.leadId,
      eventType: options.eventType,
      occurredAt: now,
      actorUserId,
      meetingId,
      payload: { previousStatus: atual.status, ...options.payload },
      idempotencyKey: options.idempotencyKey,
    });

    await cancelPendingReminders(tx, meetingId, now);
  });

  return getMeetingOrThrow(db, meetingId);
}

export function completeMeeting(
  db: Database,
  meetingId: string,
  input: CompleteMeetingInput,
  actorUserId: string,
  now: Date = new Date(),
): Promise<MeetingView> {
  // Concluir NAO move etapa nem registra venda: sao decisoes proprias do CRM.
  return applyOutcome(db, meetingId, actorUserId, now, {
    status: 'COMPLETED',
    eventType: 'MEETING_COMPLETED',
    campos: { completedAt: now, outcome: input.outcome ?? null },
    payload: { hasOutcome: Boolean(input.outcome) },
    expectedVersion: input.expectedVersion,
    idempotencyKey: input.idempotencyKey,
  });
}

export function cancelMeeting(
  db: Database,
  meetingId: string,
  input: CancelMeetingInput,
  actorUserId: string,
  now: Date = new Date(),
): Promise<MeetingView> {
  return applyOutcome(db, meetingId, actorUserId, now, {
    status: 'CANCELED',
    eventType: 'MEETING_CANCELED',
    campos: { canceledAt: now, cancelReason: input.reason },
    payload: { reason: input.reason },
    expectedVersion: input.expectedVersion,
    idempotencyKey: input.idempotencyKey,
  });
}

export function noShowMeeting(
  db: Database,
  meetingId: string,
  input: NoShowMeetingInput,
  actorUserId: string,
  now: Date = new Date(),
): Promise<MeetingView> {
  return applyOutcome(db, meetingId, actorUserId, now, {
    status: 'NO_SHOW',
    eventType: 'MEETING_NO_SHOW',
    campos: { noShowAt: now, outcome: input.note ?? null },
    payload: { hasNote: Boolean(input.note) },
    expectedVersion: input.expectedVersion,
    idempotencyKey: input.idempotencyKey,
  });
}

// ---------------------------------------------------------------------------
// Alertas
// ---------------------------------------------------------------------------

export interface MeetingAlert {
  meetingId: string;
  leadId: string;
  leadName: string;
  title: string;
  startAt: Date;
  endAt: Date;
  meetUrl: string;
  urgency: MeetingUrgency;
  /** Lembrete que sustenta este alerta, quando houver. */
  reminderId: string | null;
}

/**
 * Reunioes que merecem atencao agora.
 *
 * Cada reuniao vira UM item, com a maior urgencia atual. Os lembretes de 24h
 * e 1h nao geram duas linhas: eles apenas decidem se a reuniao ja entrou no
 * radar. Um lembrete dispensado tira a reuniao da lista ate que ela mude de
 * faixa de urgencia.
 */
export async function listMeetingAlerts(
  db: Database,
  now: Date = new Date(),
  horizonDays = 7,
): Promise<MeetingAlert[]> {
  const limite = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);
  // Reuniao vencida sem desfecho continua cobrando decisao, mas nao para sempre.
  const pisoVencidas = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      meetingId: meetings.id,
      leadId: meetings.leadId,
      leadName: leads.internalName,
      title: meetings.title,
      startAt: meetings.startAt,
      endAt: meetings.endAt,
      meetUrl: meetings.meetUrl,
      status: meetings.status,
    })
    .from(meetings)
    .innerJoin(leads, eq(leads.id, meetings.leadId))
    .where(
      and(
        eq(meetings.status, 'SCHEDULED'),
        isNull(leads.archivedAt),
        lte(meetings.startAt, limite),
        gte(meetings.endAt, pisoVencidas),
      ),
    )
    .orderBy(asc(meetings.startAt))
    .limit(100);

  if (rows.length === 0) return [];

  // Um lembrete PENDENTE e ja vencido mantem a reuniao no radar; dispensado
  // ou lido tira. Sem isto, dispensar o aviso nao teria efeito nenhum.
  const lembretes = await db
    .select({
      id: meetingReminders.id,
      meetingId: meetingReminders.meetingId,
      status: meetingReminders.status,
      remindAt: meetingReminders.remindAt,
    })
    .from(meetingReminders)
    .where(
      and(
        inArray(
          meetingReminders.meetingId,
          rows.map((row) => row.meetingId),
        ),
        lte(meetingReminders.remindAt, now),
      ),
    );

  const vencidosPendentes = new Map<string, string>();
  const dispensados = new Set<string>();
  for (const lembrete of lembretes) {
    if (lembrete.status === 'PENDING') {
      if (!vencidosPendentes.has(lembrete.meetingId)) {
        vencidosPendentes.set(lembrete.meetingId, lembrete.id);
      }
    } else if (lembrete.status === 'DISMISSED' || lembrete.status === 'READ') {
      dispensados.add(lembrete.meetingId);
    }
  }

  const alertas: MeetingAlert[] = [];

  for (const row of rows) {
    const urgency = meetingUrgency(
      { start: row.startAt, end: row.endAt },
      row.status as MeetingStatus,
      now,
    );
    if (!urgency) continue;

    const temLembreteVencido = vencidosPendentes.has(row.meetingId);
    const foiDispensado = dispensados.has(row.meetingId);

    // Faixas criticas aparecem mesmo sem lembrete: uma reuniao comecando em
    // 10 minutos nao pode depender de um aviso ter sido criado.
    const critica =
      urgency === 'IN_PROGRESS' || urgency === 'WITHIN_HOUR' || urgency === 'NEEDS_OUTCOME';

    if (!critica && (foiDispensado || !temLembreteVencido)) continue;

    alertas.push({
      meetingId: row.meetingId,
      leadId: row.leadId,
      leadName: row.leadName,
      title: row.title,
      startAt: row.startAt,
      endAt: row.endAt,
      meetUrl: row.meetUrl,
      urgency,
      reminderId: vencidosPendentes.get(row.meetingId) ?? null,
    });
  }

  return alertas;
}

/** Marca o lembrete como visto ou dispensado. Nao mexe na reuniao. */
export async function updateReminderStatus(
  db: Database,
  reminderId: string,
  status: 'READ' | 'DISMISSED',
  now: Date = new Date(),
): Promise<void> {
  const [lembrete] = await db
    .select({ id: meetingReminders.id, status: meetingReminders.status })
    .from(meetingReminders)
    .where(eq(meetingReminders.id, reminderId))
    .limit(1);

  if (!lembrete) throw notFound('Lembrete nao encontrado.');
  if (lembrete.status === 'CANCELED') {
    throw conflict('Este lembrete ja nao vale: a reuniao foi alterada.');
  }

  await db
    .update(meetingReminders)
    .set({
      status,
      ...(status === 'READ' ? { readAt: now } : { dismissedAt: now }),
      updatedAt: now,
    })
    .where(eq(meetingReminders.id, reminderId));
}

/** Reunioes futuras de um lead: usado antes de arquivar. */
export async function countFutureMeetings(
  db: Database,
  leadId: string,
  now: Date = new Date(),
): Promise<number> {
  const [linha] = await db
    .select({ total: sql<number>`count(*)` })
    .from(meetings)
    .where(
      and(eq(meetings.leadId, leadId), eq(meetings.status, 'SCHEDULED'), gt(meetings.endAt, now)),
    );
  return Number(linha?.total ?? 0);
}
