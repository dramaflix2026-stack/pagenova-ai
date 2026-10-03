/**
 * Consultas de leitura do CRM: quadro Kanban, filtros e detalhe do card.
 *
 * Todos os agregados financeiros vem do banco. O navegador nunca soma
 * dinheiro.
 */
import { listMeetingsByLead, nextMeetingByLead, type MeetingView } from '../meetings/service';
import {
  canEditLead,
  canViewLead,
  leadVisibilityOwnerFilter,
  type UserRole,
} from '../../../shared/roles';
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lte, ne, or, sql } from 'drizzle-orm';

import type { LeadFilters } from '../../../shared/schemas';
import type { Database } from '../../db/client';
import {
  activities,
  followUps,
  leadContacts,
  leadLinks,
  leadServiceInterests,
  leads,
  receivables,
  saleItems,
  sales,
  services,
  stages,
  subscriptions,
  type Lead,
} from '../../db/schema';
import { evaluateCompleteness } from '../../domain/completeness';
import { whatsappLink, mapsLinkFromPlaceId } from '../../domain/links';
import { addMoney, ZERO } from '../../domain/money';
import { toLocalDateString } from '../../domain/time';

export interface BoardCard {
  id: string;
  internalName: string;
  originType: string;
  sourceName: string | null;
  stageId: string;
  incompleteLevel: string;
  stageEnteredAt: Date;
  createdAt: Date;
  archivedAt: Date | null;
  city: string | null;
  niche: string | null;
  /** Servicos em proposta, com o valor negociado. */
  serviceSummary: { name: string; billingType: string }[];
  proposedTotal: string;
  billingTypes: string[];
  nextFollowUpAt: string | null;
  followUpStatus: 'NONE' | 'OVERDUE' | 'TODAY' | 'UPCOMING';
  pendingAmount: string;
  overdueAmount: string;
  paidAmount: string;
  hasActiveSubscription: boolean;
  attemptCount: number;
  hasReplied: boolean;
  hasSale: boolean;
  /** Quem trabalha o lead. Nulo quando esta no pote comum. */
  owner: { id: string; name: string } | null;
  /** Falso quando quem esta olhando nao pode mexer neste lead. */
  canEdit: boolean;
  /**
   * Proxima reuniao agendada, se houver. Somente a mais proxima: o card e
   * pequeno e mostrar todas o tornaria ilegivel.
   */
  nextMeeting: {
    id: string;
    title: string;
    startAt: Date;
    endAt: Date;
    meetUrl: string;
    /** Quantas outras reunioes futuras existem alem desta. */
    otherCount: number;
  } | null;
}

export interface BoardColumn {
  id: string;
  name: string;
  semanticKey: string;
  color: string;
  position: number;
  active: boolean;
  cardCount: number;
  /** Soma dos valores em aberto dos cards da coluna. */
  financialTotal: string;
  cards: BoardCard[];
}

function buildFilterConditions(filters: LeadFilters, today: string) {
  const conditions = [];

  switch (filters.archived) {
    case 'ONLY':
      conditions.push(isNotNull(leads.archivedAt));
      break;
    case 'INCLUDE':
      break;
    default:
      conditions.push(isNull(leads.archivedAt));
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        sql`${leads.internalName} like ${term}`,
        sql`${leads.prospectingCity} like ${term}`,
        sql`${leads.prospectingNiche} like ${term}`,
        sql`${leads.address} like ${term}`,
      ),
    );
  }

  if (filters.stageId) conditions.push(eq(leads.currentStageId, filters.stageId));
  if (filters.sourceId) conditions.push(eq(leads.sourceId, filters.sourceId));
  if (filters.originType) conditions.push(eq(leads.originType, filters.originType));
  if (filters.city) conditions.push(eq(leads.prospectingCity, filters.city));
  if (filters.niche) conditions.push(eq(leads.prospectingNiche, filters.niche));
  if (filters.createdFrom)
    conditions.push(gte(leads.createdAt, new Date(`${filters.createdFrom}T00:00:00Z`)));
  if (filters.createdTo)
    conditions.push(lte(leads.createdAt, new Date(`${filters.createdTo}T23:59:59Z`)));

  if (filters.completeness === 'COMPLETE') conditions.push(eq(leads.incompleteLevel, 'NONE'));
  if (filters.completeness === 'CRITICAL') conditions.push(eq(leads.incompleteLevel, 'CRITICAL'));
  if (filters.completeness === 'INCOMPLETE') conditions.push(ne(leads.incompleteLevel, 'NONE'));

  if (filters.serviceId) {
    conditions.push(
      sql`exists (select 1 from ${leadServiceInterests}
                  where ${leadServiceInterests.leadId} = ${leads.id}
                    and ${leadServiceInterests.serviceId} = ${filters.serviceId})`,
    );
  }

  if (filters.followUpStatus && filters.followUpStatus !== 'ANY') {
    const pending = sql`select 1 from ${followUps}
                         where ${followUps.leadId} = ${leads.id}
                           and ${followUps.status} = 'PENDING'`;
    switch (filters.followUpStatus) {
      case 'OVERDUE':
        conditions.push(sql`exists (${pending} and ${followUps.dueAt} < ${today})`);
        break;
      case 'TODAY':
        conditions.push(sql`exists (${pending} and ${followUps.dueAt} = ${today})`);
        break;
      case 'UPCOMING':
        conditions.push(sql`exists (${pending} and ${followUps.dueAt} > ${today})`);
        break;
      case 'NONE':
        conditions.push(sql`not exists (${pending})`);
        break;
    }
  }

  if (filters.financialStatus && filters.financialStatus !== 'ANY') {
    const base = sql`select 1 from ${receivables} where ${receivables.leadId} = ${leads.id}`;
    switch (filters.financialStatus) {
      case 'PENDING':
        conditions.push(sql`exists (${base} and ${receivables.status} in ('PENDING','OVERDUE'))`);
        break;
      case 'OVERDUE':
        conditions.push(sql`exists (${base} and ${receivables.status} = 'OVERDUE')`);
        break;
      case 'PAID':
        conditions.push(sql`exists (${base} and ${receivables.status} = 'PAID')`);
        break;
      case 'NONE':
        conditions.push(sql`not exists (${base})`);
        break;
    }
  }

  return conditions;
}

/** Quadro completo com colunas, cards e agregados por coluna. */
export interface BoardViewer {
  id: string;
  role: string;
}

export async function getBoard(
  db: Database,
  filters: LeadFilters,
  viewer?: BoardViewer,
  now: Date = new Date(),
): Promise<{ columns: BoardColumn[]; totalCards: number }> {
  const today = toLocalDateString(now);

  const columns = await db
    .select()
    .from(stages)
    .where(isNull(stages.deletedAt))
    .orderBy(asc(stages.position));

  const conditions = buildFilterConditions(filters, today);
  // Vendedor so recebe os proprios cards. Vem da sessao, nunca da URL.
  const onlyOwner = viewer ? leadVisibilityOwnerFilter(viewer.role as UserRole, viewer.id) : null;
  if (onlyOwner) conditions.push(eq(leads.ownerUserId, onlyOwner));

  const rows = await db
    .select({
      lead: leads,
      stageId: leads.currentStageId,
      sourceName: sql<string | null>`(select name from lead_sources where id = ${leads.sourceId})`,
      ownerName: sql<string | null>`(
        select coalesce(nullif(trim(name), ''), email) from users
         where id = ${leads.ownerUserId}
      )`,
      nextFollowUpAt: sql<string | null>`(
        select min(${followUps.dueAt}) from ${followUps}
         where ${followUps.leadId} = ${leads.id} and ${followUps.status} = 'PENDING'
      )`,
      pendingAmount: sql<string>`(
        select coalesce(sum(${receivables.amount}), 0) from ${receivables}
         where ${receivables.leadId} = ${leads.id}
           and ${receivables.status} in ('PENDING','OVERDUE')
      )`,
      overdueAmount: sql<string>`(
        select coalesce(sum(${receivables.amount}), 0) from ${receivables}
         where ${receivables.leadId} = ${leads.id} and ${receivables.status} = 'OVERDUE'
      )`,
      paidAmount: sql<string>`(
        select coalesce(sum(${receivables.amount}), 0) from ${receivables}
         where ${receivables.leadId} = ${leads.id} and ${receivables.status} = 'PAID'
      )`,
      proposedTotal: sql<string>`(
        select coalesce(sum(${leadServiceInterests.proposedPrice}), 0)
          from ${leadServiceInterests}
         where ${leadServiceInterests.leadId} = ${leads.id}
           and ${leadServiceInterests.status} = 'OPEN'
      )`,
      attemptCount: sql<number>`(
        select count(*) from lead_events
         where lead_id = ${leads.id} and event_type = 'CONTACT_ATTEMPT_RECORDED'
      )`,
      hasReplied: sql<number>`(
        select count(*) from lead_events
         where lead_id = ${leads.id} and event_type = 'FIRST_RESPONSE_RECORDED'
      )`,
      hasSale: sql<number>`(
        select count(*) from ${sales}
         where ${sales.leadId} = ${leads.id} and ${sales.status} in ('PENDING','CONFIRMED')
      )`,
      hasActiveSubscription: sql<number>`(
        select count(*) from ${subscriptions}
         where ${subscriptions.leadId} = ${leads.id} and ${subscriptions.status} = 'ACTIVE'
      )`,
    })
    .from(leads)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(leads.stageEnteredAt))
    .limit(2000);

  const leadIds = rows.map((row) => row.lead.id);
  const interestsByLead = await loadInterests(db, leadIds);
  // Uma consulta para o quadro inteiro: buscar reuniao card a card seria N+1.
  const meetingsByLead = await nextMeetingByLead(db, leadIds, now);

  const cards: BoardCard[] = rows.map((row) => {
    const nextFollowUpAt = row.nextFollowUpAt;
    const followUpStatus: BoardCard['followUpStatus'] = !nextFollowUpAt
      ? 'NONE'
      : nextFollowUpAt < today
        ? 'OVERDUE'
        : nextFollowUpAt === today
          ? 'TODAY'
          : 'UPCOMING';

    const interests = interestsByLead.get(row.lead.id) ?? [];

    return {
      id: row.lead.id,
      internalName: row.lead.internalName,
      originType: row.lead.originType,
      sourceName: row.sourceName,
      stageId: row.lead.currentStageId,
      incompleteLevel: row.lead.incompleteLevel,
      stageEnteredAt: row.lead.stageEnteredAt,
      createdAt: row.lead.createdAt,
      archivedAt: row.lead.archivedAt,
      city: row.lead.prospectingCity,
      niche: row.lead.prospectingNiche,
      serviceSummary: interests.map((item) => ({
        name: item.serviceName,
        billingType: item.billingType,
      })),
      proposedTotal: String(row.proposedTotal ?? '0.00'),
      billingTypes: [...new Set(interests.map((item) => item.billingType))],
      nextFollowUpAt,
      followUpStatus,
      pendingAmount: String(row.pendingAmount ?? '0.00'),
      overdueAmount: String(row.overdueAmount ?? '0.00'),
      paidAmount: String(row.paidAmount ?? '0.00'),
      hasActiveSubscription: Number(row.hasActiveSubscription) > 0,
      attemptCount: Number(row.attemptCount ?? 0),
      hasReplied: Number(row.hasReplied) > 0,
      hasSale: Number(row.hasSale) > 0,
      owner: row.lead.ownerUserId
        ? { id: row.lead.ownerUserId, name: row.ownerName ?? 'Colaborador removido' }
        : null,
      // Calculado no servidor: a tela nao deve refazer a regra de permissao.
      canEdit: viewer
        ? canEditLead(viewer.role as UserRole, viewer.id, row.lead.ownerUserId)
        : true,
      nextMeeting: meetingsByLead.get(row.lead.id)
        ? {
            id: meetingsByLead.get(row.lead.id)!.id,
            title: meetingsByLead.get(row.lead.id)!.title,
            startAt: meetingsByLead.get(row.lead.id)!.startAt,
            endAt: meetingsByLead.get(row.lead.id)!.endAt,
            meetUrl: meetingsByLead.get(row.lead.id)!.meetUrl,
            otherCount: meetingsByLead.get(row.lead.id)!.otherCount,
          }
        : null,
    };
  });

  const byStage = new Map<string, BoardCard[]>();
  for (const card of cards) {
    const list = byStage.get(card.stageId) ?? [];
    list.push(card);
    byStage.set(card.stageId, list);
  }

  return {
    columns: columns.map((stage) => {
      const stageCards = byStage.get(stage.id) ?? [];
      const semantic = stage.semanticKey;

      // O total financeiro da coluna reflete o que faz sentido nela:
      // proposta em negociacao, pendencia ao aguardar, recebido em venda.
      const financialTotal = stageCards.reduce<string>((sum, card) => {
        if (semantic === 'WON') return addMoney(sum, card.paidAmount);
        if (semantic === 'AWAITING_PAYMENT') return addMoney(sum, card.pendingAmount);
        if (semantic === 'NEGOTIATION') return addMoney(sum, card.proposedTotal);
        return sum;
      }, ZERO);

      return {
        id: stage.id,
        name: stage.name,
        semanticKey: stage.semanticKey,
        color: stage.color,
        position: stage.position,
        active: stage.active,
        cardCount: stageCards.length,
        financialTotal,
        cards: stageCards,
      };
    }),
    totalCards: cards.length,
  };
}

async function loadInterests(db: Database, leadIds: string[]) {
  const map = new Map<
    string,
    { serviceName: string; billingType: string; price: string | null }[]
  >();
  if (leadIds.length === 0) return map;

  const rows = await db
    .select({
      leadId: leadServiceInterests.leadId,
      serviceName: services.name,
      billingType: leadServiceInterests.billingTypeSnapshot,
      price: leadServiceInterests.proposedPrice,
    })
    .from(leadServiceInterests)
    .innerJoin(services, eq(services.id, leadServiceInterests.serviceId))
    .where(
      and(
        inArray(leadServiceInterests.leadId, leadIds),
        ne(leadServiceInterests.status, 'CANCELED'),
      ),
    );

  for (const row of rows) {
    const list = map.get(row.leadId) ?? [];
    list.push({ serviceName: row.serviceName, billingType: row.billingType, price: row.price });
    map.set(row.leadId, list);
  }

  return map;
}

export interface LeadDetail {
  lead: Lead;
  stageName: string;
  sourceName: string | null;
  /** Quem trabalha o lead. Nulo quando esta no pote comum. */
  owner: { id: string; name: string } | null;
  /** Falso quando quem esta olhando so pode acompanhar. */
  canEdit: boolean;
  /** Reunioes do lead, da mais recente para a mais antiga. */
  meetings: MeetingView[];
  contacts: (typeof leadContacts.$inferSelect & { whatsappUrl: string | null })[];
  links: (typeof leadLinks.$inferSelect)[];
  interests: {
    id: string;
    serviceId: string;
    serviceName: string;
    billingType: string;
    proposedPrice: string | null;
    status: string;
    notes: string | null;
  }[];
  activities: (typeof activities.$inferSelect)[];
  followUps: (typeof followUps.$inferSelect)[];
  finance: {
    receivables: (typeof receivables.$inferSelect)[];
    sales: {
      id: string;
      status: string;
      agreedAt: string;
      confirmedAt: Date | null;
      total: string;
      items: { name: string; billingType: string; unitPrice: string; quantity: number }[];
    }[];
    subscriptions: (typeof subscriptions.$inferSelect)[];
    pendingTotal: string;
    paidTotal: string;
  };
  completeness: ReturnType<typeof evaluateCompleteness>;
  /** Somente para leads do Google: o front busca os dados ao vivo. */
  google: { placeId: string; mapsUrl: string } | null;
}

export interface LeadOption {
  id: string;
  internalName: string;
  stageName: string;
  city: string | null;
  niche: string | null;
}

/**
 * Busca enxuta para o autocomplete de reuniao.
 *
 * Devolve o minimo para diferenciar homonimos (etapa e cidade) e no maximo 20
 * linhas. Baixar o quadro inteiro so para preencher um campo levaria centenas
 * de cards com valores financeiros para o navegador.
 *
 * Arquivados ficam de fora: nao se agenda reuniao com lead arquivado.
 */
export async function searchLeadOptions(
  db: Database,
  termo: string,
  limit = 20,
  onlyOwnerUserId: string | null = null,
): Promise<LeadOption[]> {
  const busca = `%${termo.trim()}%`;

  return db
    .select({
      id: leads.id,
      internalName: leads.internalName,
      stageName: stages.name,
      city: leads.prospectingCity,
      niche: leads.prospectingNiche,
    })
    .from(leads)
    .innerJoin(stages, eq(stages.id, leads.currentStageId))
    .where(
      and(
        isNull(leads.archivedAt),
        sql`${leads.internalName} like ${busca}`,
        onlyOwnerUserId ? eq(leads.ownerUserId, onlyOwnerUserId) : undefined,
      ),
    )
    .orderBy(asc(leads.internalName))
    .limit(Math.min(limit, 50));
}

export async function getLeadDetail(
  db: Database,
  leadId: string,
  viewer?: BoardViewer,
): Promise<LeadDetail | null> {
  const [row] = await db
    .select({
      lead: leads,
      stageName: stages.name,
      sourceName: sql<string | null>`(select name from lead_sources where id = ${leads.sourceId})`,
      ownerName: sql<string | null>`(
        select coalesce(nullif(trim(name), ''), email) from users
         where id = ${leads.ownerUserId}
      )`,
    })
    .from(leads)
    .innerJoin(stages, eq(stages.id, leads.currentStageId))
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!row) return null;
  // Lead de outra pessoa responde como inexistente para o vendedor: nem o
  // nome da empresa deve vazar.
  if (viewer && !canViewLead(viewer.role as UserRole, viewer.id, row.lead.ownerUserId)) {
    return null;
  }

  const contactRows = await db
    .select()
    .from(leadContacts)
    .where(eq(leadContacts.leadId, leadId))
    .orderBy(desc(leadContacts.isPrimary), asc(leadContacts.createdAt));

  const linkRows = await db
    .select()
    .from(leadLinks)
    .where(eq(leadLinks.leadId, leadId))
    .orderBy(desc(leadLinks.isPrimary), asc(leadLinks.createdAt));

  const interestRows = await db
    .select({
      id: leadServiceInterests.id,
      serviceId: leadServiceInterests.serviceId,
      serviceName: services.name,
      billingType: leadServiceInterests.billingTypeSnapshot,
      proposedPrice: leadServiceInterests.proposedPrice,
      status: leadServiceInterests.status,
      notes: leadServiceInterests.notes,
    })
    .from(leadServiceInterests)
    .innerJoin(services, eq(services.id, leadServiceInterests.serviceId))
    .where(eq(leadServiceInterests.leadId, leadId))
    .orderBy(desc(leadServiceInterests.createdAt));

  const activityRows = await db
    .select()
    .from(activities)
    .where(eq(activities.leadId, leadId))
    .orderBy(desc(activities.occurredAt))
    .limit(200);

  const followUpRows = await db
    .select()
    .from(followUps)
    .where(eq(followUps.leadId, leadId))
    .orderBy(desc(followUps.dueAt));

  const receivableRows = await db
    .select()
    .from(receivables)
    .where(eq(receivables.leadId, leadId))
    .orderBy(desc(receivables.dueDate));

  const saleRows = await db
    .select()
    .from(sales)
    .where(eq(sales.leadId, leadId))
    .orderBy(desc(sales.agreedAt));

  const saleItemRows =
    saleRows.length > 0
      ? await db
          .select()
          .from(saleItems)
          .where(
            inArray(
              saleItems.saleId,
              saleRows.map((sale) => sale.id),
            ),
          )
      : [];

  const subscriptionRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.leadId, leadId))
    .orderBy(desc(subscriptions.createdAt));

  const pendingTotal = receivableRows
    .filter((item) => item.status === 'PENDING' || item.status === 'OVERDUE')
    .reduce<string>((sum, item) => addMoney(sum, item.amount), ZERO);

  const paidTotal = receivableRows
    .filter((item) => item.status === 'PAID')
    .reduce<string>((sum, item) => addMoney(sum, item.amount), ZERO);

  const completeness = evaluateCompleteness({
    internalName: row.lead.internalName,
    contacts: contactRows.map((contact) => ({
      type: contact.type as never,
      isValid: contact.isValid,
    })),
    links: linkRows.map((link) => ({ type: link.type as never })),
    city: row.lead.prospectingCity,
    hasService: interestRows.length > 0,
    hasPlaceId: Boolean(row.lead.placeId),
  });

  return {
    lead: row.lead,
    stageName: row.stageName,
    sourceName: row.sourceName,
    owner: row.lead.ownerUserId
      ? { id: row.lead.ownerUserId, name: row.ownerName ?? 'Colaborador removido' }
      : null,
    canEdit: viewer ? canEditLead(viewer.role as UserRole, viewer.id, row.lead.ownerUserId) : true,
    meetings: await listMeetingsByLead(db, leadId),
    contacts: contactRows.map((contact) => ({
      ...contact,
      // Link montado a partir do numero normalizado; nunca afirma ter WhatsApp.
      whatsappUrl:
        contact.normalizedValue && (contact.type === 'PHONE' || contact.type === 'WHATSAPP')
          ? whatsappLink(contact.normalizedValue)
          : null,
    })),
    links: linkRows,
    interests: interestRows,
    activities: activityRows,
    followUps: followUpRows,
    finance: {
      receivables: receivableRows,
      sales: saleRows.map((sale) => ({
        id: sale.id,
        status: sale.status,
        agreedAt: sale.agreedAt,
        confirmedAt: sale.confirmedAt,
        total: sale.totalSnapshot,
        items: saleItemRows
          .filter((item) => item.saleId === sale.id)
          .map((item) => ({
            name: item.serviceNameSnapshot,
            billingType: item.billingTypeSnapshot,
            unitPrice: item.unitPriceSnapshot,
            quantity: item.quantity,
          })),
      })),
      subscriptions: subscriptionRows,
      pendingTotal,
      paidTotal,
    },
    completeness,
    google: row.lead.placeId
      ? { placeId: row.lead.placeId, mapsUrl: mapsLinkFromPlaceId(row.lead.placeId) }
      : null,
  };
}

/** Valores distintos usados para preencher os filtros da interface. */
export async function getFilterOptions(db: Database) {
  const cities = await db
    .selectDistinct({ value: leads.prospectingCity })
    .from(leads)
    .where(isNotNull(leads.prospectingCity))
    .orderBy(asc(leads.prospectingCity))
    .limit(300);

  const niches = await db
    .selectDistinct({ value: leads.prospectingNiche })
    .from(leads)
    .where(isNotNull(leads.prospectingNiche))
    .orderBy(asc(leads.prospectingNiche))
    .limit(300);

  return {
    cities: cities.map((row) => row.value).filter((value): value is string => Boolean(value)),
    niches: niches.map((row) => row.value).filter((value): value is string => Boolean(value)),
  };
}
