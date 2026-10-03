/**
 * Metricas oficiais.
 *
 * Duas informacoes distintas, nunca misturadas:
 *   ESTADO ATUAL  -> onde cada lead esta agora (contagem por coluna);
 *   HISTORICO     -> o que aconteceu no periodo (eventos imutaveis).
 *
 * Mover um card para tras muda o estado atual e NAO apaga fato historico.
 *
 * Formulas:
 *   Taxa de resposta   = leads unicos que responderam / leads unicos com primeiro contato
 *   Taxa de recusa     = leads unicos recusados / leads unicos com primeiro contato
 *   Taxa de conversao  = leads unicos com venda confirmada / leads unicos com primeiro contato
 *   Ticket medio       = valor das vendas confirmadas / quantidade de vendas confirmadas
 *   Receita realizada  = pagamentos confirmados menos estornos, pela data do pagamento
 *   MRR ativo          = soma das assinaturas ACTIVE (expectativa, nao recebimento)
 *
 * Denominador zero devolve `null`, para que a interface mostre um traco com
 * explicacao em vez de uma porcentagem enganosa.
 */
import { APP_TIMEZONE } from '../../../shared/constants';
import { MEETING_URGENCY_LABELS, MEETING_URGENCY_PRIORITY } from '../../../shared/meetings';
import { listMeetingAlerts } from '../meetings/service';
import { and, countDistinct, eq, gte, inArray, isNull, lt, lte, sql } from 'drizzle-orm';

import type { Database } from '../../db/client';
import {
  followUps,
  leadEvents,
  leadLosses,
  leadServiceInterests,
  leads,
  lossReasons,
  payments,
  receivables,
  sales,
  services,
  stages,
  subscriptions,
} from '../../db/schema';
import { addMoney, divideMoney, fromCents, toCents, ZERO } from '../../domain/money';
import { resolvePeriod, toLocalDateString, type ResolvedPeriod } from '../../domain/time';

/**
 * Filtro de metricas. Proposital: nao reaproveita o filtro do dashboard para que
 * metas e dashboard possam pedir recortes diferentes sem acoplamento.
 */
export interface MetricFilters {
  sourceId?: string | undefined;
  serviceId?: string | undefined;
  niche?: string | null | undefined;
  city?: string | null | undefined;
  /**
   * Restringe TUDO aos leads desta pessoa.
   *
   * Nao e um filtro de tela: e a regra de cargo. Socio e dono da conta veem a
   * empresa inteira (vem nulo); funcionario e suporte veem so o proprio
   * trabalho. Quem preenche e o servidor, a partir da sessao -- nunca o
   * navegador, senao bastaria mexer na URL para ver o faturamento alheio.
   */
  ownerUserId?: string | null | undefined;
}

/** Filtro por atributos do lead, aplicado como subconsulta nos eventos. */
function leadScope(filters: MetricFilters) {
  const conditions = [];
  if (filters.ownerUserId) conditions.push(eq(leads.ownerUserId, filters.ownerUserId));
  if (filters.sourceId) conditions.push(eq(leads.sourceId, filters.sourceId));
  if (filters.niche) conditions.push(eq(leads.prospectingNiche, filters.niche));
  if (filters.city) conditions.push(eq(leads.prospectingCity, filters.city));
  if (filters.serviceId) {
    conditions.push(
      sql`exists (select 1 from ${leadServiceInterests}
                  where ${leadServiceInterests.leadId} = ${leads.id}
                    and ${leadServiceInterests.serviceId} = ${filters.serviceId})`,
    );
  }
  return conditions;
}

/** Restringe eventos aos leads que passam pelo filtro do dashboard. */
function eventLeadFilter(filters: MetricFilters) {
  const conditions = leadScope(filters);
  if (conditions.length === 0) return sql`1 = 1`;
  return sql`${leadEvents.leadId} in (select ${leads.id} from ${leads} where ${and(...conditions)})`;
}

export interface PeriodMetrics {
  firstContacts: number;
  contactAttempts: number;
  responses: number;
  followUpsCompleted: number;
  negotiationsStarted: number;
  lossesRecorded: number;
  salesConfirmed: number;
  realizedRevenue: string;
  /** null quando nao ha primeiro contato no periodo. */
  responseRate: number | null;
  lossRate: number | null;
  conversionRate: number | null;
  averageTicket: string | null;
}

async function countDistinctLeadsByEvent(
  db: Database,
  eventType: string,
  period: ResolvedPeriod,
  filters: MetricFilters,
): Promise<number> {
  const [row] = await db
    .select({ total: countDistinct(leadEvents.leadId) })
    .from(leadEvents)
    .where(
      and(
        eq(leadEvents.eventType, eventType),
        gte(leadEvents.occurredAt, period.start),
        lt(leadEvents.occurredAt, period.end),
        eventLeadFilter(filters),
      ),
    );
  return Number(row?.total ?? 0);
}

async function countEvents(
  db: Database,
  eventType: string,
  period: ResolvedPeriod,
  filters: MetricFilters,
): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)` })
    .from(leadEvents)
    .where(
      and(
        eq(leadEvents.eventType, eventType),
        gte(leadEvents.occurredAt, period.start),
        lt(leadEvents.occurredAt, period.end),
        eventLeadFilter(filters),
      ),
    );
  return Number(row?.total ?? 0);
}

/**
 * Leads prospectados: leads que entraram no CRM no periodo (pesquisa,
 * importacao ou cadastro manual). Arquivados contam -- o esforco aconteceu.
 */
export async function countLeadsProspected(
  db: Database,
  period: ResolvedPeriod,
  filters: MetricFilters,
): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)` })
    .from(leads)
    .where(
      and(
        gte(leads.createdAt, period.start),
        lt(leads.createdAt, period.end),
        ...leadScope(filters),
      ),
    );
  return Number(row?.total ?? 0);
}

/** Receita realizada: pagamentos confirmados menos estornos, pela data civil. */
export async function realizedRevenue(
  db: Database,
  period: ResolvedPeriod,
  filters: MetricFilters,
): Promise<string> {
  const scope = leadScope(filters);

  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(
      and(
        gte(payments.paymentDate, period.fromDate),
        lte(payments.paymentDate, period.toDate),
        scope.length > 0
          ? sql`${payments.leadId} in (select ${leads.id} from ${leads} where ${and(...scope)})`
          : sql`1 = 1`,
      ),
    );

  // Estornos sao gravados com valor negativo: a soma ja e liquida.
  return fromCents(toCents(String(row?.total ?? '0')));
}

export async function getPeriodMetrics(
  db: Database,
  period: ResolvedPeriod,
  filters: MetricFilters,
): Promise<PeriodMetrics> {
  const scope = leadScope(filters);

  const firstContacts = await countDistinctLeadsByEvent(
    db,
    'FIRST_CONTACT_RECORDED',
    period,
    filters,
  );
  const responses = await countDistinctLeadsByEvent(db, 'FIRST_RESPONSE_RECORDED', period, filters);
  const contactAttempts = await countEvents(db, 'CONTACT_ATTEMPT_RECORDED', period, filters);
  const followUpsCompleted = await countEvents(db, 'FOLLOW_UP_COMPLETED', period, filters);
  const negotiationsStarted = await countDistinctLeadsByEvent(
    db,
    'NEGOTIATION_STARTED',
    period,
    filters,
  );
  const lossesRecorded = await countDistinctLeadsByEvent(db, 'LOSS_RECORDED', period, filters);

  // Vendas confirmadas: entidade de venda, nao contagem de itens.
  const [salesRow] = await db
    .select({
      total: sql<number>`count(*)`,
      amount: sql<string>`coalesce(sum(${sales.totalSnapshot}), 0)`,
      leadsWithSale: countDistinct(sales.leadId),
    })
    .from(sales)
    .where(
      and(
        eq(sales.status, 'CONFIRMED'),
        gte(sales.confirmedAt, period.start),
        lt(sales.confirmedAt, period.end),
        scope.length > 0
          ? sql`${sales.leadId} in (select ${leads.id} from ${leads} where ${and(...scope)})`
          : sql`1 = 1`,
      ),
    );

  const salesConfirmed = Number(salesRow?.total ?? 0);
  const salesAmount = String(salesRow?.amount ?? '0');
  const leadsWithSale = Number(salesRow?.leadsWithSale ?? 0);

  const revenue = await realizedRevenue(db, period, filters);

  // Denominador zero -> null. A interface mostra "—" com explicacao.
  const rate = (numerator: number): number | null =>
    firstContacts === 0 ? null : numerator / firstContacts;

  return {
    firstContacts,
    contactAttempts,
    responses,
    followUpsCompleted,
    negotiationsStarted,
    lossesRecorded,
    salesConfirmed,
    realizedRevenue: revenue,
    responseRate: rate(responses),
    lossRate: rate(lossesRecorded),
    conversionRate: rate(leadsWithSale),
    averageTicket: salesConfirmed === 0 ? null : divideMoney(salesAmount, salesConfirmed),
  };
}

export interface FunnelEntry {
  stageId: string;
  stageName: string;
  semanticKey: string;
  color: string;
  count: number;
}

/** Estado atual: onde cada lead esta agora. Arquivados ficam de fora. */
export async function getFunnel(db: Database, filters: MetricFilters): Promise<FunnelEntry[]> {
  const scope = leadScope(filters);

  const rows = await db
    .select({
      stageId: stages.id,
      stageName: stages.name,
      semanticKey: stages.semanticKey,
      color: stages.color,
      count: sql<number>`count(${leads.id})`,
    })
    .from(stages)
    .leftJoin(
      leads,
      and(
        eq(leads.currentStageId, stages.id),
        isNull(leads.archivedAt),
        scope.length > 0 ? and(...scope) : sql`1 = 1`,
      ),
    )
    .where(isNull(stages.deletedAt))
    .groupBy(stages.id, stages.name, stages.semanticKey, stages.color, stages.position)
    .orderBy(stages.position);

  return rows.map((row) => ({ ...row, count: Number(row.count) }));
}

export interface FinancialSnapshot {
  pendingTotal: string;
  overdueTotal: string;
  activeMrr: string;
  nextDueDate: string | null;
  activeSubscriptions: number;
}

/** Fotografia financeira atual, independente do periodo selecionado. */
export async function getFinancialSnapshot(
  db: Database,
  ownerUserId?: string | null,
): Promise<FinancialSnapshot> {
  // Funcionario ve so a propria carteira; socio e dono veem tudo.
  const doDono = ownerUserId
    ? sql`${receivables.leadId} in (select ${leads.id} from ${leads} where ${leads.ownerUserId} = ${ownerUserId})`
    : sql`1 = 1`;

  const [pending] = await db
    .select({
      total: sql<string>`coalesce(sum(${receivables.amount}), 0)`,
    })
    .from(receivables)
    .where(and(inArray(receivables.status, ['PENDING', 'OVERDUE']), doDono));

  const [overdue] = await db
    .select({ total: sql<string>`coalesce(sum(${receivables.amount}), 0)` })
    .from(receivables)
    .where(and(eq(receivables.status, 'OVERDUE'), doDono));

  const [mrr] = await db
    .select({
      total: sql<string>`coalesce(sum(${subscriptions.amountSnapshot}), 0)`,
      count: sql<number>`count(*)`,
      nextDue: sql<string | null>`min(${subscriptions.nextDueDate})`,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, 'ACTIVE'),
        ownerUserId
          ? sql`${subscriptions.leadId} in (select ${leads.id} from ${leads} where ${leads.ownerUserId} = ${ownerUserId})`
          : sql`1 = 1`,
      ),
    );

  return {
    pendingTotal: fromCents(toCents(String(pending?.total ?? '0'))),
    overdueTotal: fromCents(toCents(String(overdue?.total ?? '0'))),
    // MRR e expectativa contratada, jamais receita ja recebida.
    activeMrr: fromCents(toCents(String(mrr?.total ?? '0'))),
    nextDueDate: mrr?.nextDue ?? null,
    activeSubscriptions: Number(mrr?.count ?? 0),
  };
}

export interface AttentionItem {
  kind:
    | 'FOLLOW_UP_OVERDUE'
    | 'FOLLOW_UP_TODAY'
    | 'PAYMENT_OVERDUE'
    | 'STALLED_NEGOTIATION'
    | 'SELECTED_IDLE'
    | 'INCOMPLETE_DATA'
    | 'UPCOMING_RECURRENCE'
    | 'GOOGLE_QUOTA'
    | 'MEETING_SOON'
    | 'MEETING_NEEDS_OUTCOME';
  title: string;
  description: string;
  leadId: string | null;
  amount: string | null;
  dueDate: string | null;
  /** Reuniao referenciada, quando o item for de reuniao. */
  meetingId?: string | null;
  /** Link da sala, para o alerta oferecer "Entrar" sem mais um clique. */
  meetUrl?: string | null;
  /** Instante ISO do inicio, para a tela formatar no fuso do negocio. */
  startAt?: string | null;
  priority: number;
}

/** Lista priorizada de "Precisa da sua atencao". */
/** "28/08 14:00 as 15:00", no fuso do negocio. */
function formatMeetingWindow(start: Date, end: Date): string {
  const data = new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
  }).format(start);
  const hora = (valor: Date) =>
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: APP_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
    }).format(valor);
  return `${data} ${hora(start)} as ${hora(end)}`;
}

export async function getAttentionItems(
  db: Database,
  options: {
    stalledNegotiationDays: number;
    stalledSelectedDays: number;
    now?: Date;
    /** Vendedor: so alertas dos proprios leads. Vem da sessao. */
    onlyOwnerUserId?: string | null;
  },
): Promise<AttentionItem[]> {
  const now = options.now ?? new Date();
  const today = toLocalDateString(now);
  const items: AttentionItem[] = [];
  const dono = options.onlyOwnerUserId ? eq(leads.ownerUserId, options.onlyOwnerUserId) : undefined;

  // Reunioes primeiro: um compromisso marcado tem hora e nao espera.
  //
  // Uma reuniao vira UM item com a maior urgencia atual -- os lembretes de
  // 24h e 1h decidem quando ela entra no radar, nunca geram duas linhas.
  let alertas = await listMeetingAlerts(db, now);
  if (options.onlyOwnerUserId && alertas.length > 0) {
    const proprios = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(inArray(leads.id, [...new Set(alertas.map((a) => a.leadId))]), dono));
    const ids = new Set(proprios.map((linha) => linha.id));
    alertas = alertas.filter((alerta) => ids.has(alerta.leadId));
  }
  for (const alerta of alertas) {
    const emAndamento = alerta.urgency === 'IN_PROGRESS';
    const pendente = alerta.urgency === 'NEEDS_OUTCOME';

    items.push({
      kind: pendente ? 'MEETING_NEEDS_OUTCOME' : 'MEETING_SOON',
      title: pendente
        ? `Reuniao sem desfecho: ${alerta.leadName}`
        : `${MEETING_URGENCY_LABELS[alerta.urgency]}: ${alerta.leadName}`,
      description: pendente
        ? `"${alerta.title}" ja terminou. Marque como concluida, ausencia ou reagende.`
        : `${alerta.title} — ${formatMeetingWindow(alerta.startAt, alerta.endAt)}`,
      leadId: alerta.leadId,
      amount: null,
      dueDate: toLocalDateString(alerta.startAt),
      meetingId: alerta.meetingId,
      meetUrl: alerta.meetUrl,
      startAt: alerta.startAt.toISOString(),
      // Pendente e em andamento passam na frente de follow-up atrasado.
      priority: pendente ? 0 : emAndamento ? 0 : MEETING_URGENCY_PRIORITY[alerta.urgency],
    });
  }

  const overdueFollowUps = await db
    .select({
      leadId: followUps.leadId,
      name: leads.internalName,
      dueAt: followUps.dueAt,
    })
    .from(followUps)
    .innerJoin(leads, eq(leads.id, followUps.leadId))
    .where(
      and(
        eq(followUps.status, 'PENDING'),
        lt(followUps.dueAt, today),
        isNull(leads.archivedAt),
        dono,
      ),
    )
    .orderBy(followUps.dueAt)
    .limit(20);

  for (const row of overdueFollowUps) {
    items.push({
      kind: 'FOLLOW_UP_OVERDUE',
      title: `Follow-up atrasado: ${row.name}`,
      description: `Estava previsto para ${row.dueAt}.`,
      leadId: row.leadId,
      amount: null,
      dueDate: row.dueAt,
      priority: 1,
    });
  }

  const todayFollowUps = await db
    .select({ leadId: followUps.leadId, name: leads.internalName, dueAt: followUps.dueAt })
    .from(followUps)
    .innerJoin(leads, eq(leads.id, followUps.leadId))
    .where(
      and(
        eq(followUps.status, 'PENDING'),
        eq(followUps.dueAt, today),
        isNull(leads.archivedAt),
        dono,
      ),
    )
    .limit(20);

  for (const row of todayFollowUps) {
    items.push({
      kind: 'FOLLOW_UP_TODAY',
      title: `Follow-up para hoje: ${row.name}`,
      description: 'Retorno programado para hoje.',
      leadId: row.leadId,
      amount: null,
      dueDate: row.dueAt,
      priority: 2,
    });
  }

  const overduePayments = await db
    .select({
      leadId: receivables.leadId,
      name: leads.internalName,
      amount: receivables.amount,
      dueDate: receivables.dueDate,
      description: receivables.descriptionSnapshot,
    })
    .from(receivables)
    .innerJoin(leads, eq(leads.id, receivables.leadId))
    .where(
      and(
        inArray(receivables.status, ['OVERDUE', 'PENDING']),
        lt(receivables.dueDate, today),
        dono,
      ),
    )
    .orderBy(receivables.dueDate)
    .limit(20);

  for (const row of overduePayments) {
    items.push({
      kind: 'PAYMENT_OVERDUE',
      title: `Pagamento vencido: ${row.name}`,
      description: `${row.description} - vencimento em ${row.dueDate}.`,
      leadId: row.leadId,
      amount: row.amount,
      dueDate: row.dueDate,
      priority: 1,
    });
  }

  const stalledCutoff = new Date(
    now.getTime() - options.stalledNegotiationDays * 24 * 60 * 60 * 1000,
  );
  const stalled = await db
    .select({ leadId: leads.id, name: leads.internalName, since: leads.stageEnteredAt })
    .from(leads)
    .innerJoin(stages, eq(stages.id, leads.currentStageId))
    .where(
      and(
        eq(stages.semanticKey, 'NEGOTIATION'),
        lt(leads.stageEnteredAt, stalledCutoff),
        isNull(leads.archivedAt),
        dono,
      ),
    )
    .limit(20);

  for (const row of stalled) {
    items.push({
      kind: 'STALLED_NEGOTIATION',
      title: `Negociacao parada: ${row.name}`,
      description: `Sem movimentacao ha mais de ${options.stalledNegotiationDays} dias.`,
      leadId: row.leadId,
      amount: null,
      dueDate: null,
      priority: 3,
    });
  }

  const idleCutoff = new Date(now.getTime() - options.stalledSelectedDays * 24 * 60 * 60 * 1000);
  const idle = await db
    .select({ leadId: leads.id, name: leads.internalName })
    .from(leads)
    .innerJoin(stages, eq(stages.id, leads.currentStageId))
    .where(
      and(
        eq(stages.semanticKey, 'SELECTED'),
        lt(leads.stageEnteredAt, idleCutoff),
        isNull(leads.archivedAt),
        dono,
      ),
    )
    .limit(20);

  for (const row of idle) {
    items.push({
      kind: 'SELECTED_IDLE',
      title: `Selecionado sem abordagem: ${row.name}`,
      description: `Aguardando o primeiro contato ha mais de ${options.stalledSelectedDays} dias.`,
      leadId: row.leadId,
      amount: null,
      dueDate: null,
      priority: 4,
    });
  }

  const incomplete = await db
    .select({ leadId: leads.id, name: leads.internalName })
    .from(leads)
    .where(and(eq(leads.incompleteLevel, 'CRITICAL'), isNull(leads.archivedAt), dono))
    .limit(20);

  for (const row of incomplete) {
    items.push({
      kind: 'INCOMPLETE_DATA',
      title: `Dados incompletos: ${row.name}`,
      description: 'Falta um meio de contato ou o nome interno.',
      leadId: row.leadId,
      amount: null,
      dueDate: null,
      priority: 3,
    });
  }

  const upcoming = await db
    .select({
      leadId: subscriptions.leadId,
      name: leads.internalName,
      service: subscriptions.serviceNameSnapshot,
      amount: subscriptions.amountSnapshot,
      nextDueDate: subscriptions.nextDueDate,
    })
    .from(subscriptions)
    .innerJoin(leads, eq(leads.id, subscriptions.leadId))
    .where(and(eq(subscriptions.status, 'ACTIVE'), dono))
    .orderBy(subscriptions.nextDueDate)
    .limit(10);

  for (const row of upcoming) {
    if (!row.nextDueDate) continue;
    items.push({
      kind: 'UPCOMING_RECURRENCE',
      title: `Proxima recorrencia: ${row.name}`,
      description: `${row.service} vence em ${row.nextDueDate}.`,
      leadId: row.leadId,
      amount: row.amount,
      dueDate: row.nextDueDate,
      priority: 5,
    });
  }

  return items.sort(
    (a, b) => a.priority - b.priority || (a.dueDate ?? '').localeCompare(b.dueDate ?? ''),
  );
}

export interface SeriesPoint {
  date: string;
  firstContacts: number;
  responses: number;
  sales: number;
  revenue: string;
}

/** Serie diaria de desempenho no periodo, no fuso operacional. */
export async function getDailySeries(
  db: Database,
  period: ResolvedPeriod,
  filters: MetricFilters,
): Promise<SeriesPoint[]> {
  const tz = 'America/Sao_Paulo';

  const eventRows = await db
    .select({
      day: sql<string>`date(convert_tz(${leadEvents.occurredAt}, '+00:00', ${tzOffsetExpr(tz)}))`,
      eventType: leadEvents.eventType,
      total: countDistinct(leadEvents.leadId),
    })
    .from(leadEvents)
    .where(
      and(
        inArray(leadEvents.eventType, ['FIRST_CONTACT_RECORDED', 'FIRST_RESPONSE_RECORDED']),
        gte(leadEvents.occurredAt, period.start),
        lt(leadEvents.occurredAt, period.end),
        eventLeadFilter(filters),
      ),
    )
    .groupBy(sql`1`, leadEvents.eventType);

  const paymentRows = await db
    .select({
      day: payments.paymentDate,
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(
      and(gte(payments.paymentDate, period.fromDate), lte(payments.paymentDate, period.toDate)),
    )
    .groupBy(payments.paymentDate);

  const saleRows = await db
    .select({
      day: sql<string>`date(convert_tz(${sales.confirmedAt}, '+00:00', ${tzOffsetExpr(tz)}))`,
      total: sql<number>`count(*)`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.status, 'CONFIRMED'),
        gte(sales.confirmedAt, period.start),
        lt(sales.confirmedAt, period.end),
      ),
    )
    .groupBy(sql`1`);

  const byDay = new Map<string, SeriesPoint>();
  const ensure = (date: string): SeriesPoint => {
    const existing = byDay.get(date);
    if (existing) return existing;
    const point: SeriesPoint = { date, firstContacts: 0, responses: 0, sales: 0, revenue: ZERO };
    byDay.set(date, point);
    return point;
  };

  for (const row of eventRows) {
    const point = ensure(String(row.day));
    if (row.eventType === 'FIRST_CONTACT_RECORDED') point.firstContacts = Number(row.total);
    else point.responses = Number(row.total);
  }
  for (const row of paymentRows) {
    ensure(String(row.day)).revenue = fromCents(toCents(String(row.total)));
  }
  for (const row of saleRows) {
    ensure(String(row.day)).sales = Number(row.total);
  }

  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * MySQL nao aceita nome de fuso sem as tabelas de timezone carregadas.
 * O sistema opera em America/Sao_Paulo (UTC-3, sem horario de verao desde 2019),
 * entao o deslocamento fixo e correto e portavel na Hostinger.
 */
function tzOffsetExpr(_tz: string) {
  return sql`'-03:00'`;
}

export interface BreakdownEntry {
  label: string;
  count: number;
  amount: string;
}

/** Vendas por servico, origem, nicho e cidade no periodo. */
export async function getBreakdowns(db: Database, period: ResolvedPeriod) {
  const bySource = await db
    .select({
      label: sql<string>`coalesce((select name from lead_sources where id = ${leads.sourceId}), 'Sem origem')`,
      count: sql<number>`count(distinct ${sales.id})`,
      amount: sql<string>`coalesce(sum(${sales.totalSnapshot}), 0)`,
    })
    .from(sales)
    .innerJoin(leads, eq(leads.id, sales.leadId))
    .where(
      and(
        eq(sales.status, 'CONFIRMED'),
        gte(sales.confirmedAt, period.start),
        lt(sales.confirmedAt, period.end),
      ),
    )
    .groupBy(sql`1`)
    .orderBy(sql`3 desc`)
    .limit(15);

  const byService = await db
    .select({
      label: services.name,
      count: sql<number>`count(*)`,
      amount: sql<string>`coalesce(sum(${leadServiceInterests.proposedPrice}), 0)`,
    })
    .from(leadServiceInterests)
    .innerJoin(services, eq(services.id, leadServiceInterests.serviceId))
    .where(eq(leadServiceInterests.status, 'WON'))
    .groupBy(services.name)
    .orderBy(sql`3 desc`)
    .limit(15);

  const byNiche = await db
    .select({
      label: sql<string>`coalesce(${leads.prospectingNiche}, 'Sem nicho')`,
      count: sql<number>`count(distinct ${sales.id})`,
      amount: sql<string>`coalesce(sum(${sales.totalSnapshot}), 0)`,
    })
    .from(sales)
    .innerJoin(leads, eq(leads.id, sales.leadId))
    .where(
      and(
        eq(sales.status, 'CONFIRMED'),
        gte(sales.confirmedAt, period.start),
        lt(sales.confirmedAt, period.end),
      ),
    )
    .groupBy(sql`1`)
    .orderBy(sql`3 desc`)
    .limit(15);

  const byCity = await db
    .select({
      label: sql<string>`coalesce(${leads.prospectingCity}, 'Sem cidade')`,
      count: sql<number>`count(distinct ${sales.id})`,
      amount: sql<string>`coalesce(sum(${sales.totalSnapshot}), 0)`,
    })
    .from(sales)
    .innerJoin(leads, eq(leads.id, sales.leadId))
    .where(
      and(
        eq(sales.status, 'CONFIRMED'),
        gte(sales.confirmedAt, period.start),
        lt(sales.confirmedAt, period.end),
      ),
    )
    .groupBy(sql`1`)
    .orderBy(sql`3 desc`)
    .limit(15);

  const byLossReason = await db
    .select({
      label: lossReasons.name,
      count: sql<number>`count(*)`,
      amount: sql<string>`'0.00'`,
    })
    .from(leadLosses)
    .innerJoin(lossReasons, eq(lossReasons.id, leadLosses.lossReasonId))
    .where(and(gte(leadLosses.occurredAt, period.start), lt(leadLosses.occurredAt, period.end)))
    .groupBy(lossReasons.name)
    .orderBy(sql`2 desc`)
    .limit(15);

  const normalize = (rows: { label: string; count: number; amount: string }[]): BreakdownEntry[] =>
    rows.map((row) => ({
      label: row.label,
      count: Number(row.count),
      amount: fromCents(toCents(String(row.amount))),
    }));

  return {
    bySource: normalize(bySource),
    byService: normalize(byService),
    byNiche: normalize(byNiche),
    byCity: normalize(byCity),
    byLossReason: normalize(byLossReason),
  };
}

/** Tempo medio em cada etapa, calculado por stage_history. */
export async function getAverageStageTime(db: Database) {
  const rows = await db
    .select({
      stageName: stages.name,
      semanticKey: stages.semanticKey,
      averageHours: sql<number>`avg(timestampdiff(hour, stage_history.entered_at, coalesce(stage_history.exited_at, utc_timestamp(3))))`,
      passages: sql<number>`count(*)`,
    })
    .from(sql`stage_history`)
    .innerJoin(stages, sql`${stages.id} = stage_history.stage_id`)
    .groupBy(stages.name, stages.semanticKey, stages.position)
    .orderBy(stages.position);

  return rows.map((row) => ({
    stageName: row.stageName,
    semanticKey: row.semanticKey,
    averageHours: Number(row.averageHours ?? 0),
    passages: Number(row.passages ?? 0),
  }));
}

export { resolvePeriod, addMoney };
