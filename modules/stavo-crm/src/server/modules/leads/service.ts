/**
 * Regras de negocio do CRM.
 *
 * Movimentacao de etapa e uma transacao unica que:
 *   1. valida o destino;
 *   2. confere a etapa esperada (concorrencia otimista);
 *   3. atualiza current_stage_id;
 *   4. fecha o stage_history anterior e abre o novo;
 *   5. cria STAGE_MOVED;
 *   6. cria o evento semantico apenas quando aplicavel;
 *   7. atualiza entidades financeiras nas etapas criticas.
 *
 * Regra fundamental: entrar em FOLLOW_UP nao registra tentativa. Tentativa e
 * uma acao explicita do usuario.
 */
import { and, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import type { StageSemanticKey } from '../../../shared/constants';
import { canEditLead, canNoteLead, canViewLead, type UserRole } from '../../../shared/roles';
import type {
  CreateLeadInput,
  LossDetailsInput,
  MoveLeadInput,
  NegotiationDetailsInput,
} from '../../../shared/schemas';
import { isDuplicateKeyError, type Database } from '../../db/client';
import {
  activities,
  auditLog,
  duplicateReviews,
  followUps,
  leadContacts,
  leadEvents,
  leadIdentityKeys,
  leadIdentityMemberships,
  leadLinks,
  leadLosses,
  leadServiceInterests,
  leads,
  lossReasons,
  meetings,
  payments,
  receivables,
  sales,
  services,
  stageHistory,
  stages,
  subscriptions,
  users,
  type Lead,
  type Stage,
} from '../../db/schema';
import { evaluateCompleteness } from '../../domain/completeness';
import { classifyWebsite, inferLinkType } from '../../domain/links';
import { normalizeMoney } from '../../domain/money';
import {
  normalizeEmail,
  normalizeHost,
  normalizePhone,
  normalizeUrl,
} from '../../domain/normalize';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  stageConflict,
  unprocessable,
} from '../../lib/errors';
import { newId } from '../../lib/ids';
import { confirmPayment, createSale } from '../finance/service';
import { countFutureMeetings } from '../meetings/service';
import { recordEvent } from './events';
import {
  attachIdentities,
  buildIdentityKeys,
  checkDuplicates,
  openDuplicateReview,
  refreshIdentities,
  type DuplicateVerdict,
} from './identity';

// ---------------------------------------------------------------------------
// Consultas basicas
// ---------------------------------------------------------------------------

export async function getStageOrThrow(db: Database, stageId: string): Promise<Stage> {
  const [stage] = await db.select().from(stages).where(eq(stages.id, stageId)).limit(1);
  if (!stage || stage.deletedAt) {
    throw notFound('Etapa nao encontrada. Atualize a pagina e tente novamente.', 'STAGE_NOT_FOUND');
  }
  return stage;
}

export async function getLeadOrThrow(db: Database, leadId: string): Promise<Lead> {
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) throw notFound('Lead nao encontrado.', 'LEAD_NOT_FOUND');
  return lead;
}

export interface LeadActor {
  id: string;
  role: string;
}

/** Nome de quem trabalha o lead, para a mensagem de recusa. */
async function ownerName(db: Database, ownerUserId: string): Promise<string> {
  const [dono] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, ownerUserId))
    .limit(1);
  return dono?.name?.trim() || dono?.email || 'outro colaborador';
}

/**
 * Recusa quem nao pode nem ver o lead (vendedor diante do lead de um colega).
 * Responde "nao encontrado" de proposito: confirmar que o lead existe ja
 * entregaria a carteira do outro.
 */
export async function assertCanViewLead(
  db: Database,
  leadId: string,
  actor: LeadActor,
): Promise<Lead> {
  const lead = await getLeadOrThrow(db, leadId);
  if (canViewLead(actor.role as UserRole, actor.id, lead.ownerUserId)) return lead;
  throw notFound('Lead nao encontrado.');
}

/**
 * Recusa a acao quando o lead e de outra pessoa.
 *
 * Mexer e do dono. O dono da conta passa por cima porque alguem precisa
 * conseguir destravar um lead cujo responsavel saiu.
 */
export async function assertCanEditLead(
  db: Database,
  leadId: string,
  actor: LeadActor,
): Promise<Lead> {
  const lead = await assertCanViewLead(db, leadId, actor);
  if (canEditLead(actor.role as UserRole, actor.id, lead.ownerUserId)) return lead;

  if (!lead.ownerUserId) {
    throw forbidden('Este lead esta sem responsavel. Peca ao dono da conta para atribui-lo.');
  }
  throw forbidden(
    `Este lead esta sendo trabalhado por ${await ownerName(db, lead.ownerUserId!)}. ` +
      'Voce pode acompanhar, mas nao alterar. Peca ao dono da conta para transferir.',
  );
}

/** Anotar e mais permissivo que mover: o suporte precisa registrar contato. */
export async function assertCanNoteLead(
  db: Database,
  leadId: string,
  actor: LeadActor,
): Promise<Lead> {
  const lead = await assertCanViewLead(db, leadId, actor);
  if (canNoteLead(actor.role as UserRole, actor.id, lead.ownerUserId)) return lead;

  if (!lead.ownerUserId) {
    throw forbidden('Este lead esta sem responsavel. Peca ao dono da conta para atribui-lo.');
  }
  throw forbidden(`Este lead esta sendo trabalhado por ${await ownerName(db, lead.ownerUserId!)}.`);
}

/**
 * Transfere o lead para outra pessoa. So o dono da conta chega aqui.
 * Fica no historico: transferencia silenciosa vira discussao depois.
 */
export async function transferLead(
  db: Database,
  leadId: string,
  newOwnerUserId: string | null,
  actorUserId: string,
): Promise<Lead> {
  const lead = await getLeadOrThrow(db, leadId);
  const now = new Date();

  if (newOwnerUserId) {
    const [destino] = await db
      .select({ id: users.id, active: users.active })
      .from(users)
      .where(eq(users.id, newOwnerUserId))
      .limit(1);
    if (!destino) throw notFound('Colaborador nao encontrado.');
    if (!destino.active) {
      throw unprocessable('Este colaborador esta desativado e nao pode receber leads.');
    }
  }

  return db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({ ownerUserId: newOwnerUserId, updatedAt: now })
      .where(eq(leads.id, leadId));

    await recordEvent(tx, {
      leadId,
      eventType: 'LEAD_TRANSFERRED',
      occurredAt: now,
      actorUserId,
      payload: { fromUserId: lead.ownerUserId, toUserId: newOwnerUserId },
    });

    const [row] = await tx.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    return row!;
  });
}

/** Ciclo logico atual do lead: aumenta a cada perda registrada. */
async function currentCycle(db: Database, leadId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(leadLosses)
    .where(eq(leadLosses.leadId, leadId));
  return Number(row?.total ?? 0) + 1;
}

// ---------------------------------------------------------------------------
// Criacao de lead
// ---------------------------------------------------------------------------

export interface CreateLeadResult {
  lead: Lead;
  /** Preenchido quando a criacao foi impedida por duplicidade. */
  duplicate?: DuplicateVerdict;
  duplicateReviewId?: string;
}

export interface CreateLeadOptions {
  actorUserId: string;
  originType?: 'GOOGLE_PLACE' | 'IMPORTED' | 'MANUAL';
  importJobId?: string | null;
  searchRunId?: string | null;
  /** Origem dos contatos/links criados junto com o lead. */
  dataOrigin?: 'MANUAL' | 'IMPORT' | 'USER_CONFIRMED';
}

/**
 * Cria um lead aplicando a deduplicacao global.
 * Lanca conflito quando existe identidade forte de outro lead.
 */
export async function createLead(
  db: Database,
  workspaceId: string,
  input: CreateLeadInput,
  options: CreateLeadOptions,
): Promise<CreateLeadResult> {
  const originType = options.originType ?? input.originType ?? 'MANUAL';
  const dataOrigin = options.dataOrigin ?? (originType === 'IMPORTED' ? 'IMPORT' : 'MANUAL');

  const phones = input.contacts
    .filter((contact) => contact.type === 'PHONE' || contact.type === 'WHATSAPP')
    .map((contact) => contact.value);
  const websites = input.links.filter((link) => link.type === 'WEBSITE').map((link) => link.url);

  const identityInput = {
    placeId: input.placeId ?? null,
    phones,
    websites,
    name: input.internalName,
    address: input.address ?? null,
    city: input.city ?? null,
  };

  const verdict = await checkDuplicates(db, identityInput, {
    allowSharedIdentity: input.allowSharedIdentity,
  });

  if (verdict.kind === 'BLOCKED') {
    throw conflict(
      `${verdict.reason}. O lead "${verdict.existing.internalName}" ja esta no CRM na etapa ${verdict.existing.stageName}.`,
      {
        code: 'DUPLICATE_LEAD',
        details: {
          existingLeadId: verdict.existing.id,
          existingLeadName: verdict.existing.internalName,
          existingStageName: verdict.existing.stageName,
          keyType: verdict.keyType,
        },
      },
    );
  }

  const selectedStage = await requireSemanticStage(db, 'SELECTED');
  const now = new Date();
  const leadId = newId();

  const created = await db.transaction(async (tx) => {
    await tx.insert(leads).values({
      workspaceId,
      id: leadId,
      originType,
      sourceId: input.sourceId ?? null,
      currentStageId: selectedStage.id,
      internalName: input.internalName,
      placeId: input.placeId ?? null,
      prospectingNiche: input.niche ?? null,
      prospectingCountry: input.country ?? null,
      prospectingState: input.state ?? null,
      prospectingCity: input.city ?? null,
      address: input.address ?? null,
      campaignOrSearchContext: input.campaignContext ?? null,
      status: 'ACTIVE',
      incompleteLevel: 'NONE',
      stageEnteredAt: now,
      // Quem traz o lead fica com ele: decisao de projeto, nao acidente.
      ownerUserId: options.actorUserId,
      importJobId: options.importJobId ?? null,
      searchRunId: options.searchRunId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    await insertContacts(tx, leadId, input.contacts, dataOrigin, now);
    await insertLinks(tx, leadId, input.links, dataOrigin, now);

    if (input.serviceId) {
      await addServiceInterest(tx, {
        leadId,
        serviceId: input.serviceId,
        proposedPrice: input.proposedPrice ?? null,
        notes: null,
        now,
      });
    }

    if (input.notes) {
      await tx.insert(activities).values({
        id: newId(),
        leadId,
        activityType: 'NOTE',
        body: input.notes,
        occurredAt: now,
        createdBy: options.actorUserId,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (input.nextFollowUpAt) {
      await tx.insert(followUps).values({
        id: newId(),
        leadId,
        dueAt: input.nextFollowUpAt,
        status: 'PENDING',
        note: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    await tx.insert(stageHistory).values({
      id: newId(),
      leadId,
      stageId: selectedStage.id,
      semanticKey: selectedStage.semanticKey,
      enteredAt: now,
      exitedAt: null,
      movementEventId: null,
    });

    // Identidades gravadas na MESMA transacao do lead.
    await attachIdentities(tx, workspaceId, leadId, buildIdentityKeys(identityInput), {
      sharedReason:
        verdict.kind === 'REVIEW' && input.allowSharedIdentity
          ? (input.sharedIdentityReason ?? 'Confirmado pelo usuario como leads diferentes')
          : null,
    });

    await recordEvent(tx, {
      leadId,
      eventType: 'LEAD_CREATED',
      occurredAt: now,
      actorUserId: options.actorUserId,
      payload: { originType, sourceId: input.sourceId ?? null },
      idempotencyKey: input.idempotencyKey ? `${input.idempotencyKey}:created` : null,
    });

    await refreshCompleteness(tx, leadId);

    const [row] = await tx.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    return row!;
  });

  // Suspeita registrada apos a criacao: o card existe e aguarda decisao humana.
  let duplicateReviewId: string | undefined;
  if (verdict.kind === 'REVIEW') {
    duplicateReviewId = await openDuplicateReview(db, {
      candidateLeadId: leadId,
      existingLeadId: verdict.existing.id,
      reason: verdict.reason,
      candidatePayload: { internalName: input.internalName, city: input.city ?? null },
      importJobId: options.importJobId ?? null,
    });
  }

  return {
    lead: created,
    ...(verdict.kind === 'REVIEW' ? { duplicate: verdict } : {}),
    ...(duplicateReviewId ? { duplicateReviewId } : {}),
  };
}

async function requireSemanticStage(db: Database, key: StageSemanticKey): Promise<Stage> {
  const [stage] = await db
    .select()
    .from(stages)
    .where(and(eq(stages.semanticKey, key), isNull(stages.deletedAt)))
    .limit(1);
  if (!stage) {
    throw unprocessable(
      `A etapa com o significado ${key} nao existe. Rode o seed ou recrie a etapa em Configuracoes.`,
      { code: 'MISSING_SEMANTIC_STAGE' },
    );
  }
  return stage;
}

export async function insertContacts(
  tx: Database,
  leadId: string,
  contacts: { type: string; value: string; isPrimary?: boolean }[],
  origin: 'MANUAL' | 'IMPORT' | 'USER_CONFIRMED',
  now: Date,
): Promise<void> {
  for (const [index, contact] of contacts.entries()) {
    const value = contact.value.trim();
    if (!value) continue;

    let normalizedValue: string | null = null;
    let isValid = true;

    if (contact.type === 'PHONE' || contact.type === 'WHATSAPP') {
      const phone = normalizePhone(value);
      normalizedValue = phone.e164;
      // Telefone invalido entra assim mesmo, marcado para revisao: nunca some.
      isValid = phone.isValid;
    } else if (contact.type === 'EMAIL') {
      normalizedValue = normalizeEmail(value);
      isValid = normalizedValue !== null;
    }

    await tx.insert(leadContacts).values({
      id: newId(),
      leadId,
      type: contact.type,
      value,
      normalizedValue,
      origin,
      isPrimary: contact.isPrimary ?? index === 0,
      isConfirmed: origin === 'USER_CONFIRMED',
      isValid,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function insertLinks(
  tx: Database,
  leadId: string,
  links: { type: string; url: string; isPrimary?: boolean }[],
  origin: 'MANUAL' | 'IMPORT' | 'USER_CONFIRMED',
  now: Date,
): Promise<void> {
  for (const [index, link] of links.entries()) {
    const normalized = normalizeUrl(link.url);
    if (!normalized) continue;

    // Link de demonstracao e o link do Maps sao dados PROPRIOS (nunca vem de
    // conteudo de terceiro pra classificar): preserva o tipo informado. Sem
    // isto, uma URL do Maps virava "DIRECTORY" -- `google.com` esta na lista
    // de diretorios/plataformas, porque normalmente e isso que ele e.
    const preservedType = link.type === 'DEMO_OR_PROPOSAL' || link.type === 'MAPS' ? link.type : null;

    await tx.insert(leadLinks).values({
      id: newId(),
      leadId,
      type: preservedType ?? inferLinkType(normalized),
      url: normalized,
      normalizedHost: normalizeHost(normalized),
      origin,
      isPrimary: link.isPrimary ?? index === 0,
      createdAt: now,
      updatedAt: now,
    });
  }
}

async function addServiceInterest(
  tx: Database,
  input: {
    leadId: string;
    serviceId: string;
    proposedPrice: string | null;
    notes: string | null;
    now: Date;
  },
): Promise<void> {
  const [service] = await tx
    .select()
    .from(services)
    .where(eq(services.id, input.serviceId))
    .limit(1);
  if (!service) throw notFound('Servico nao encontrado.');

  await tx.insert(leadServiceInterests).values({
    id: newId(),
    leadId: input.leadId,
    serviceId: service.id,
    proposedPrice: input.proposedPrice ? normalizeMoney(input.proposedPrice) : service.defaultPrice,
    billingTypeSnapshot: service.billingType,
    notes: input.notes,
    status: 'OPEN',
    createdAt: input.now,
    updatedAt: input.now,
  });
}

/** Recalcula o nivel de completude a partir dos dados atuais do lead. */
export async function refreshCompleteness(tx: Database, leadId: string): Promise<void> {
  const [lead] = await tx.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return;

  const contacts = await tx
    .select({ type: leadContacts.type, isValid: leadContacts.isValid })
    .from(leadContacts)
    .where(eq(leadContacts.leadId, leadId));

  const links = await tx
    .select({ type: leadLinks.type })
    .from(leadLinks)
    .where(eq(leadLinks.leadId, leadId));

  const [interest] = await tx
    .select({ id: leadServiceInterests.id })
    .from(leadServiceInterests)
    .where(eq(leadServiceInterests.leadId, leadId))
    .limit(1);

  const result = evaluateCompleteness({
    internalName: lead.internalName,
    contacts: contacts.map((contact) => ({
      type: contact.type as never,
      isValid: contact.isValid,
    })),
    links: links.map((link) => ({ type: link.type as never })),
    city: lead.prospectingCity,
    hasService: Boolean(interest),
    hasPlaceId: Boolean(lead.placeId),
  });

  await tx
    .update(leads)
    .set({ incompleteLevel: result.level, updatedAt: new Date() })
    .where(eq(leads.id, leadId));
}

// ---------------------------------------------------------------------------
// Movimentacao de etapa
// ---------------------------------------------------------------------------

export interface MoveLeadResult {
  lead: Lead;
  /** false quando a mesma chave de idempotencia ja tinha sido processada. */
  applied: boolean;
  saleId?: string;
  receivableIds?: string[];
}

export async function moveLead(
  db: Database,
  leadId: string,
  input: MoveLeadInput,
  actorUserId: string,
): Promise<MoveLeadResult> {
  // Requisicao repetida devolve o resultado original, sem mover de novo.
  const [alreadyProcessed] = await db
    .select({ id: leadEvents.id })
    .from(leadEvents)
    .where(eq(leadEvents.idempotencyKey, `${input.idempotencyKey}:move`))
    .limit(1);

  if (alreadyProcessed) {
    return { lead: await getLeadOrThrow(db, leadId), applied: false };
  }

  const destination = await getStageOrThrow(db, input.destinationStageId);
  const lead = await getLeadOrThrow(db, leadId);

  if (lead.archivedAt) {
    throw unprocessable('Este lead esta arquivado. Restaure-o antes de movimentar.', {
      code: 'LEAD_ARCHIVED',
    });
  }

  // Concorrencia otimista: a tela precisa estar olhando a posicao real.
  if (lead.currentStageId !== input.expectedCurrentStageId) {
    const current = await getStageOrThrow(db, lead.currentStageId);
    throw stageConflict(current.id, current.name);
  }

  if (lead.currentStageId === destination.id) {
    return { lead, applied: false };
  }

  const semanticKey = destination.semanticKey as StageSemanticKey;
  await validateDestinationRequirements(db, lead, semanticKey, input);

  const now = new Date();
  let saleId: string | undefined;
  let receivableIds: string[] | undefined;

  const updated = await db.transaction(async (tx) => {
    // 1. Estado atual
    await tx
      .update(leads)
      .set({ currentStageId: destination.id, stageEnteredAt: now, updatedAt: now })
      .where(eq(leads.id, leadId));

    // 2. Historico de etapas: fecha a passagem anterior, abre a nova.
    await tx
      .update(stageHistory)
      .set({ exitedAt: now })
      .where(and(eq(stageHistory.leadId, leadId), isNull(stageHistory.exitedAt)));

    // 3. Evento de movimentacao
    const movement = await recordEvent(tx, {
      leadId,
      eventType: 'STAGE_MOVED',
      occurredAt: now,
      actorUserId,
      payload: {
        fromStageId: lead.currentStageId,
        toStageId: destination.id,
        toSemanticKey: semanticKey,
      },
      idempotencyKey: `${input.idempotencyKey}:move`,
    });

    await tx.insert(stageHistory).values({
      id: newId(),
      leadId,
      stageId: destination.id,
      semanticKey: destination.semanticKey,
      enteredAt: now,
      exitedAt: null,
      movementEventId: movement.event?.id ?? null,
    });

    // 4. Evento semantico e efeitos financeiros
    const effects = await applySemanticEffects(tx, {
      lead,
      semanticKey,
      input,
      actorUserId,
      now,
    });
    saleId = effects.saleId;
    receivableIds = effects.receivableIds;

    await refreshCompleteness(tx, leadId);

    const [row] = await tx.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    return row!;
  });

  return {
    lead: updated,
    applied: true,
    ...(saleId ? { saleId } : {}),
    ...(receivableIds ? { receivableIds } : {}),
  };
}

/** Valida o que o destino exige ANTES de abrir a transacao. */
async function validateDestinationRequirements(
  db: Database,
  lead: Lead,
  semanticKey: StageSemanticKey,
  input: MoveLeadInput,
): Promise<void> {
  if (semanticKey === 'LOST') {
    if (!input.loss?.lossReasonId) {
      throw badRequest('Informe o motivo da perda para mover o lead para esta etapa.', {
        code: 'LOSS_REASON_REQUIRED',
        fieldErrors: { 'loss.lossReasonId': ['Selecione o motivo da perda.'] },
      });
    }
    const [reason] = await db
      .select({ id: lossReasons.id })
      .from(lossReasons)
      .where(eq(lossReasons.id, input.loss.lossReasonId))
      .limit(1);
    if (!reason) throw notFound('Motivo de perda nao encontrado.');
  }

  if (semanticKey === 'AWAITING_PAYMENT') {
    const hasSale = (input.sale?.items.length ?? 0) > 0;
    const openReceivables = await db
      .select({ total: count() })
      .from(receivables)
      .where(
        and(eq(receivables.leadId, lead.id), inArray(receivables.status, ['PENDING', 'OVERDUE'])),
      );

    if (!hasSale && Number(openReceivables[0]?.total ?? 0) === 0) {
      throw badRequest(
        'Para aguardar pagamento e preciso registrar pelo menos um valor a receber.',
        { code: 'SALE_DETAILS_REQUIRED' },
      );
    }
  }

  if (semanticKey === 'WON') {
    const hasReceivable = Boolean(input.won?.receivableId);
    const hasSale = (input.won?.sale?.items.length ?? 0) > 0;
    if (!hasReceivable && !hasSale) {
      throw badRequest(
        'Confirme o recebimento: selecione uma cobranca em aberto ou registre a venda.',
        { code: 'PAYMENT_DETAILS_REQUIRED' },
      );
    }
  }

  if (semanticKey === 'NEGOTIATION' && input.negotiation) {
    const ids = input.negotiation.interests.map((item) => item.serviceId);
    const found = await db
      .select({ id: services.id })
      .from(services)
      .where(inArray(services.id, ids));
    if (found.length !== new Set(ids).size) {
      throw notFound('Servico nao encontrado. Atualize a pagina e tente novamente.');
    }
  }
}

interface SemanticEffectsInput {
  lead: Lead;
  semanticKey: StageSemanticKey;
  input: MoveLeadInput;
  actorUserId: string;
  now: Date;
}

interface SemanticEffectsResult {
  saleId?: string;
  receivableIds?: string[];
}

/**
 * Efeitos por significado da etapa. Usa SEMPRE semantic_key, nunca o nome
 * visivel da coluna.
 */
async function applySemanticEffects(
  tx: Database,
  { lead, semanticKey, input, actorUserId, now }: SemanticEffectsInput,
): Promise<SemanticEffectsResult> {
  const key = input.idempotencyKey;

  switch (semanticKey) {
    case 'SELECTED':
    case 'AUXILIARY':
      // Apenas organizacao: nao gera evento historico proprio.
      return {};

    case 'FIRST_CONTACT':
      // Singular por lead: voltar e mover de novo nao cria outro primeiro contato.
      await recordEvent(tx, {
        leadId: lead.id,
        eventType: 'FIRST_CONTACT_RECORDED',
        occurredAt: now,
        actorUserId,
        payload: { source: 'STAGE_MOVE' },
      });
      return {};

    case 'FOLLOW_UP':
      // Entrar na coluna NAO conta tentativa: o usuario pode so estar organizando.
      return {};

    case 'REPLIED':
      await recordEvent(tx, {
        leadId: lead.id,
        eventType: 'FIRST_RESPONSE_RECORDED',
        occurredAt: now,
        actorUserId,
        payload: { source: 'STAGE_MOVE' },
      });
      return {};

    case 'NEGOTIATION': {
      if (input.negotiation) {
        await replaceNegotiationInterests(tx, lead.id, input.negotiation, now);
      }
      const cycle = await currentCycle(tx, lead.id);
      await recordEvent(tx, {
        leadId: lead.id,
        eventType: 'NEGOTIATION_STARTED',
        occurredAt: now,
        actorUserId,
        payload: { cycle, notes: input.negotiation?.notes ?? null },
        // Um inicio de negociacao por ciclo logico.
        uniqueScopeSuffix: String(cycle),
      });
      return {};
    }

    case 'AWAITING_PAYMENT': {
      let saleId: string | undefined;
      let receivableIds: string[] = [];

      if (input.sale && input.sale.items.length > 0) {
        const result = await createSale(tx, {
          leadId: lead.id,
          items: input.sale.items,
          agreedAt: input.sale.agreedAt,
          dueDate: input.sale.dueDate,
          notes: input.sale.notes ?? null,
          paidNow: false,
          actorUserId,
          idempotencyKey: key,
        });
        saleId = result.saleId;
        receivableIds = result.receivableIds;
      }

      await recordEvent(tx, {
        leadId: lead.id,
        eventType: 'AWAITING_PAYMENT_RECORDED',
        occurredAt: now,
        actorUserId,
        payload: { saleId: saleId ?? null, receivableIds },
        idempotencyKey: `${key}:awaiting`,
      });

      return { ...(saleId ? { saleId } : {}), receivableIds };
    }

    case 'WON': {
      let saleId: string | undefined;
      const receivableIds: string[] = [];

      // Caminho direto: nao passou por "Aguardando pagamento".
      if (input.won?.sale && input.won.sale.items.length > 0) {
        const result = await createSale(tx, {
          leadId: lead.id,
          items: input.won.sale.items,
          agreedAt: input.won.sale.agreedAt,
          dueDate: input.won.sale.dueDate,
          notes: input.won.sale.notes ?? null,
          paidNow: true,
          paymentDate: input.won.paymentDate,
          actorUserId,
          idempotencyKey: key,
        });
        saleId = result.saleId;
        receivableIds.push(...result.receivableIds);
      } else if (input.won?.receivableId) {
        // Caminho normal: confirma a cobranca ja existente.
        const payment = await confirmPayment(tx, {
          receivableId: input.won.receivableId,
          paymentDate: input.won.paymentDate,
          amount: input.won.amount ?? null,
          actorUserId,
          idempotencyKey: `${key}:payment`,
        });
        receivableIds.push(payment.receivable.id);
      }

      await markInterestsWon(tx, lead.id, now);

      return { ...(saleId ? { saleId } : {}), receivableIds };
    }

    case 'LOST': {
      const loss = input.loss as LossDetailsInput;
      const cycle = await currentCycle(tx, lead.id);

      try {
        await tx.insert(leadLosses).values({
          id: newId(),
          leadId: lead.id,
          lossReasonId: loss.lossReasonId,
          note: loss.note ?? null,
          occurredAt: now,
          cycle,
          createdAt: now,
        });
      } catch (error) {
        // Reenvio da mesma requisicao: o ciclo ja foi registrado.
        if (!isDuplicateKeyError(error)) throw error;
      }

      await recordEvent(tx, {
        leadId: lead.id,
        eventType: 'LOSS_RECORDED',
        occurredAt: now,
        actorUserId,
        payload: { lossReasonId: loss.lossReasonId, cycle, note: loss.note ?? null },
        uniqueScopeSuffix: String(cycle),
      });

      // "Retornar futuramente" resolve-se com data de follow-up, sem coluna nova.
      if (loss.followUpAt) {
        await tx.insert(followUps).values({
          id: newId(),
          leadId: lead.id,
          dueAt: loss.followUpAt,
          status: 'PENDING',
          note: 'Recontatar futuramente',
          createdAt: now,
          updatedAt: now,
        });
        await recordEvent(tx, {
          leadId: lead.id,
          eventType: 'FOLLOW_UP_SCHEDULED',
          occurredAt: now,
          actorUserId,
          payload: { dueAt: loss.followUpAt, source: 'LOSS' },
        });
      }

      await tx
        .update(leadServiceInterests)
        .set({ status: 'LOST', updatedAt: now })
        .where(
          and(eq(leadServiceInterests.leadId, lead.id), eq(leadServiceInterests.status, 'OPEN')),
        );

      return {};
    }

    default:
      return {};
  }
}

async function replaceNegotiationInterests(
  tx: Database,
  leadId: string,
  negotiation: NegotiationDetailsInput,
  now: Date,
): Promise<void> {
  // Interesses ainda abertos sao substituidos pela proposta atual; os que ja
  // viraram venda ou perda permanecem intocados.
  await tx
    .delete(leadServiceInterests)
    .where(and(eq(leadServiceInterests.leadId, leadId), eq(leadServiceInterests.status, 'OPEN')));

  for (const item of negotiation.interests) {
    await addServiceInterest(tx, {
      leadId,
      serviceId: item.serviceId,
      proposedPrice: item.proposedPrice,
      notes: item.notes ?? null,
      now,
    });
  }
}

async function markInterestsWon(tx: Database, leadId: string, now: Date): Promise<void> {
  await tx
    .update(leadServiceInterests)
    .set({ status: 'WON', updatedAt: now })
    .where(and(eq(leadServiceInterests.leadId, leadId), eq(leadServiceInterests.status, 'OPEN')));
}

// ---------------------------------------------------------------------------
// Tentativas, follow-ups e anotacoes
// ---------------------------------------------------------------------------

export async function recordActivity(
  db: Database,
  leadId: string,
  input: {
    activityType: string;
    body?: string | null;
    occurredAt?: string;
    nextFollowUpAt?: string | null;
    idempotencyKey?: string;
  },
  actorUserId: string,
): Promise<{ activityId: string }> {
  await getLeadOrThrow(db, leadId);

  const now = new Date();
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : now;
  const activityId = newId();

  await db.transaction(async (tx) => {
    await tx.insert(activities).values({
      id: activityId,
      leadId,
      activityType: input.activityType,
      body: input.body ?? null,
      occurredAt,
      createdBy: actorUserId,
      createdAt: now,
      updatedAt: now,
    });

    // Tentativa de contato e uma acao EXPLICITA. Nunca vira "contato novo":
    // o primeiro contato continua sendo um evento singular do lead.
    const isAttempt = ['CALL', 'WHATSAPP_ATTEMPT', 'CONTACT_ATTEMPT', 'MEETING'].includes(
      input.activityType,
    );

    if (isAttempt) {
      await recordEvent(tx, {
        leadId,
        eventType: 'CONTACT_ATTEMPT_RECORDED',
        occurredAt,
        actorUserId,
        payload: { activityId, activityType: input.activityType },
        idempotencyKey: input.idempotencyKey ? `${input.idempotencyKey}:attempt` : null,
      });
    }

    if (input.nextFollowUpAt) {
      await tx.insert(followUps).values({
        id: newId(),
        leadId,
        dueAt: input.nextFollowUpAt,
        status: 'PENDING',
        note: null,
        createdAt: now,
        updatedAt: now,
      });
      await recordEvent(tx, {
        leadId,
        eventType: 'FOLLOW_UP_SCHEDULED',
        occurredAt: now,
        actorUserId,
        payload: { dueAt: input.nextFollowUpAt },
        idempotencyKey: input.idempotencyKey ? `${input.idempotencyKey}:followup` : null,
      });
    }
  });

  return { activityId };
}

export async function scheduleFollowUp(
  db: Database,
  leadId: string,
  input: { dueAt: string; note?: string | null },
  actorUserId: string,
): Promise<{ followUpId: string }> {
  await getLeadOrThrow(db, leadId);

  const now = new Date();
  const followUpId = newId();

  await db.transaction(async (tx) => {
    await tx.insert(followUps).values({
      id: followUpId,
      leadId,
      dueAt: input.dueAt,
      status: 'PENDING',
      note: input.note ?? null,
      createdAt: now,
      updatedAt: now,
    });

    await recordEvent(tx, {
      leadId,
      eventType: 'FOLLOW_UP_SCHEDULED',
      occurredAt: now,
      actorUserId,
      payload: { followUpId, dueAt: input.dueAt },
    });
  });

  return { followUpId };
}

export async function completeFollowUp(
  db: Database,
  followUpId: string,
  input: { note?: string | null; nextDueAt?: string | null; idempotencyKey?: string },
  actorUserId: string,
): Promise<void> {
  const [followUp] = await db.select().from(followUps).where(eq(followUps.id, followUpId)).limit(1);
  if (!followUp) throw notFound('Follow-up nao encontrado.');
  if (followUp.status !== 'PENDING') return;

  const now = new Date();

  await db.transaction(async (tx) => {
    // Concluir nao apaga o historico: o registro permanece como COMPLETED.
    await tx
      .update(followUps)
      .set({
        status: 'COMPLETED',
        completedAt: now,
        note: input.note ?? followUp.note,
        updatedAt: now,
      })
      .where(eq(followUps.id, followUpId));

    await recordEvent(tx, {
      leadId: followUp.leadId,
      eventType: 'FOLLOW_UP_COMPLETED',
      occurredAt: now,
      actorUserId,
      payload: { followUpId },
      idempotencyKey: input.idempotencyKey ? `${input.idempotencyKey}:complete` : null,
    });

    if (input.nextDueAt) {
      const nextId = newId();
      await tx.insert(followUps).values({
        id: nextId,
        leadId: followUp.leadId,
        dueAt: input.nextDueAt,
        status: 'PENDING',
        note: null,
        createdAt: now,
        updatedAt: now,
      });
      await recordEvent(tx, {
        leadId: followUp.leadId,
        eventType: 'FOLLOW_UP_SCHEDULED',
        occurredAt: now,
        actorUserId,
        payload: { followUpId: nextId, dueAt: input.nextDueAt },
        idempotencyKey: input.idempotencyKey ? `${input.idempotencyKey}:next` : null,
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Arquivamento
// ---------------------------------------------------------------------------

export interface ArchiveLeadOptions {
  /**
   * Arquiva mesmo havendo reuniao futura, preservando os compromissos.
   * Exige decisao explicita de quem arquiva -- nunca e o padrao.
   */
  keepFutureMeetings?: boolean;
}

export async function archiveLead(
  db: Database,
  leadId: string,
  actorUserId: string,
  options?: ArchiveLeadOptions,
): Promise<void> {
  const lead = await getLeadOrThrow(db, leadId);
  if (lead.archivedAt) return;

  // Reuniao marcada com um lead que sai do quadro vira compromisso esquecido:
  // o card some, mas a hora continua na agenda. A decisao e de quem arquiva.
  const reunioesFuturas = await countFutureMeetings(db, leadId);
  if (reunioesFuturas > 0 && !options?.keepFutureMeetings) {
    throw unprocessable(
      reunioesFuturas === 1
        ? 'Este lead tem 1 reuniao futura agendada. Cancele a reuniao antes, ou confirme o arquivamento mantendo o compromisso.'
        : `Este lead tem ${reunioesFuturas} reunioes futuras agendadas. Cancele-as antes, ou confirme o arquivamento mantendo os compromissos.`,
      { code: 'LEAD_HAS_FUTURE_MEETINGS', details: { futureMeetings: reunioesFuturas } },
    );
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    // Arquivar, nunca apagar: eventos, vendas e pagamentos permanecem.
    await tx
      .update(leads)
      .set({ archivedAt: now, status: 'ARCHIVED', updatedAt: now })
      .where(eq(leads.id, leadId));

    await recordEvent(tx, {
      leadId,
      eventType: 'LEAD_ARCHIVED',
      occurredAt: now,
      actorUserId,
      payload: { stageId: lead.currentStageId },
    });

    await tx.insert(auditLog).values({
      workspaceId: lead.workspaceId,
      id: newId(),
      action: 'LEAD_ARCHIVED',
      entityType: 'leads',
      entityId: leadId,
      actorUserId,
      summary: `Lead "${lead.internalName}" arquivado.`,
      metadata: null,
      occurredAt: now,
    });
  });
}

export async function restoreLead(
  db: Database,
  leadId: string,
  actorUserId: string,
): Promise<void> {
  const lead = await getLeadOrThrow(db, leadId);
  if (!lead.archivedAt) return;

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({ archivedAt: null, status: 'ACTIVE', updatedAt: now })
      .where(eq(leads.id, leadId));

    await recordEvent(tx, {
      leadId,
      eventType: 'LEAD_RESTORED',
      occurredAt: now,
      actorUserId,
      payload: null,
    });
  });
}

// ---------------------------------------------------------------------------
// Exclusao definitiva
// ---------------------------------------------------------------------------

export interface LeadDeletionImpact {
  leadName: string;
  archived: boolean;
  sales: number;
  activeSubscriptions: number;
  activities: number;
  events: number;
  /** Todas as reunioes do lead, passadas e futuras. */
  meetings: number;
  /** Das acima, as ainda agendadas para acontecer. */
  futureMeetings: number;
  openReceivables: { count: number; total: string };
  receivedPayments: { count: number; total: string };
}

/**
 * O que exatamente sera apagado junto com o lead.
 *
 * Alimenta a confirmacao na tela. Uma exclusao irreversivel precisa dizer o
 * numero antes, nao depois: "some R$ 741,00 aguardando pagamento" e uma
 * informacao que muda a decisao de quem esta clicando.
 */
export async function getLeadDeletionImpact(
  db: Database,
  leadId: string,
): Promise<LeadDeletionImpact> {
  const lead = await getLeadOrThrow(db, leadId);

  const [abertos] = await db
    .select({
      count: count(),
      total: sql<string>`coalesce(sum(${receivables.amount}), 0)`,
    })
    .from(receivables)
    .where(
      and(eq(receivables.leadId, leadId), inArray(receivables.status, ['PENDING', 'OVERDUE'])),
    );

  // Estorno e gravado com valor negativo, entao a soma ja e liquida.
  const [recebidos] = await db
    .select({
      count: count(),
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(eq(payments.leadId, leadId));

  const [vendas] = await db.select({ count: count() }).from(sales).where(eq(sales.leadId, leadId));

  const [assinaturas] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(and(eq(subscriptions.leadId, leadId), eq(subscriptions.status, 'ACTIVE')));

  const [anotacoes] = await db
    .select({ count: count() })
    .from(activities)
    .where(eq(activities.leadId, leadId));

  const [eventos] = await db
    .select({ count: count() })
    .from(leadEvents)
    .where(eq(leadEvents.leadId, leadId));

  const [reunioes] = await db
    .select({ count: count() })
    .from(meetings)
    .where(eq(meetings.leadId, leadId));
  const reunioesFuturas = await countFutureMeetings(db, leadId);

  return {
    leadName: lead.internalName,
    archived: Boolean(lead.archivedAt),
    sales: Number(vendas?.count ?? 0),
    activeSubscriptions: Number(assinaturas?.count ?? 0),
    activities: Number(anotacoes?.count ?? 0),
    events: Number(eventos?.count ?? 0),
    meetings: Number(reunioes?.count ?? 0),
    futureMeetings: reunioesFuturas,
    openReceivables: {
      count: Number(abertos?.count ?? 0),
      total: normalizeMoney(String(abertos?.total ?? '0')),
    },
    receivedPayments: {
      count: Number(recebidos?.count ?? 0),
      total: normalizeMoney(String(recebidos?.total ?? '0')),
    },
  };
}

/**
 * Apaga o lead e TUDO que dependia dele, sem volta.
 *
 * Arquivar continua sendo o caminho normal: tira do quadro e preserva a
 * historia. Excluir existe para o que nunca deveria ter entrado -- teste,
 * engano, duplicata -- e por isso leva junto vendas, cobrancas, pagamentos e
 * assinaturas. E o unico jeito de o painel deixar de contar aquele dinheiro.
 *
 * A ordem abaixo NAO e livre: quase toda tabela aponta para `leads` com
 * ON DELETE RESTRICT, e o InnoDB recusa apagar o pai antes dos filhos. Filho
 * mais profundo primeiro, lead por ultimo.
 *
 * O registro em `audit_log` fica: ele nao tem chave estrangeira para o lead,
 * de proposito, para que reste prova de que a exclusao aconteceu.
 */
export async function deleteLead(
  db: Database,
  leadId: string,
  actorUserId: string,
): Promise<LeadDeletionImpact> {
  const impacto = await getLeadDeletionImpact(db, leadId);
  const now = new Date();

  const [deleteWorkspace] = await db
    .select({ workspaceId: leads.workspaceId })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!deleteWorkspace) {
    throw new Error('Lead nao encontrado.');
  }

  await db.transaction(async (tx) => {
    // 1. Financeiro, do mais dependente para o menos.
    await tx.delete(payments).where(eq(payments.leadId, leadId));
    await tx.delete(receivables).where(eq(receivables.leadId, leadId));
    // subscription_changes sai em cascata com a assinatura.
    await tx.delete(subscriptions).where(eq(subscriptions.leadId, leadId));
    // sale_items sai em cascata com a venda.
    await tx.delete(sales).where(eq(sales.leadId, leadId));

    // 2. Trilha do CRM.
    await tx.delete(stageHistory).where(eq(stageHistory.leadId, leadId));
    await tx.delete(leadLosses).where(eq(leadLosses.leadId, leadId));
    await tx.delete(leadServiceInterests).where(eq(leadServiceInterests.leadId, leadId));
    await tx.delete(followUps).where(eq(followUps.leadId, leadId));
    await tx.delete(activities).where(eq(activities.leadId, leadId));
    // Reunioes apontam para o lead com RESTRICT: sem esta linha o banco recusa
    // a exclusao de todo lead que ja teve reuniao. A confirmacao na tela ja
    // avisou quantas sao; os lembretes saem em cascata com cada reuniao.
    await tx.delete(meetings).where(eq(meetings.leadId, leadId));

    // `candidate_lead_id` nao tem chave estrangeira: sem esta linha sobraria
    // uma revisao de duplicidade apontando para um lead que nao existe mais.
    await tx.delete(duplicateReviews).where(eq(duplicateReviews.existingLeadId, leadId));
    await tx.delete(duplicateReviews).where(eq(duplicateReviews.candidateLeadId, leadId));

    await tx.delete(leadEvents).where(eq(leadEvents.leadId, leadId));

    // 3. Dados de contato e identidade (sairiam em cascata; explicito e mais
    //    facil de auditar do que confiar na regra do banco).
    await tx.delete(leadContacts).where(eq(leadContacts.leadId, leadId));
    await tx.delete(leadLinks).where(eq(leadLinks.leadId, leadId));
    await tx.delete(leadIdentityMemberships).where(eq(leadIdentityMemberships.leadId, leadId));

    await tx.delete(leads).where(eq(leads.id, leadId));

    // 4. Chaves de identidade que ficaram sem nenhum lead. Sem isto o banco
    //    acumula lixo a cada exclusao.
    await tx.delete(leadIdentityKeys).where(
      sql`not exists (
            select 1 from ${leadIdentityMemberships}
             where ${leadIdentityMemberships.identityKeyId} = ${leadIdentityKeys.id}
          )`,
    );

    await tx.insert(auditLog).values({
      workspaceId: deleteWorkspace.workspaceId,
      id: newId(),
      action: 'LEAD_DELETED',
      entityType: 'leads',
      entityId: leadId,
      actorUserId,
      summary: `Lead "${impacto.leadName}" excluido definitivamente.`,
      // O que sumiu do painel fica registrado aqui.
      metadata: {
        sales: impacto.sales,
        activeSubscriptions: impacto.activeSubscriptions,
        openReceivablesTotal: impacto.openReceivables.total,
        receivedPaymentsTotal: impacto.receivedPayments.total,
        events: impacto.events,
        meetings: impacto.meetings,
      },
      occurredAt: now,
    });
  });

  return impacto;
}

// ---------------------------------------------------------------------------
// Edicao de dados proprios
// ---------------------------------------------------------------------------

export async function updateLeadData(
  db: Database,
  leadId: string,
  input: Partial<{
    internalName: string;
    sourceId: string | null;
    niche: string | null;
    country: string | null;
    state: string | null;
    city: string | null;
    address: string | null;
    campaignContext: string | null;
  }>,
): Promise<Lead> {
  const lead = await getLeadOrThrow(db, leadId);
  const now = new Date();

  return db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({
        ...(input.internalName !== undefined ? { internalName: input.internalName } : {}),
        ...(input.sourceId !== undefined ? { sourceId: input.sourceId } : {}),
        ...(input.niche !== undefined ? { prospectingNiche: input.niche } : {}),
        ...(input.country !== undefined ? { prospectingCountry: input.country } : {}),
        ...(input.state !== undefined ? { prospectingState: input.state } : {}),
        ...(input.city !== undefined ? { prospectingCity: input.city } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.campaignContext !== undefined
          ? { campaignOrSearchContext: input.campaignContext }
          : {}),
        updatedAt: now,
      })
      .where(eq(leads.id, leadId));

    // Identidade muda junto com os dados, na mesma transacao.
    const contacts = await tx
      .select({ type: leadContacts.type, value: leadContacts.value })
      .from(leadContacts)
      .where(eq(leadContacts.leadId, leadId));
    const links = await tx
      .select({ url: leadLinks.url, type: leadLinks.type })
      .from(leadLinks)
      .where(eq(leadLinks.leadId, leadId));

    await refreshIdentities(tx, lead.workspaceId, leadId, {
      placeId: lead.placeId,
      phones: contacts
        .filter((contact) => contact.type === 'PHONE' || contact.type === 'WHATSAPP')
        .map((contact) => contact.value),
      websites: links.filter((link) => link.type === 'WEBSITE').map((link) => link.url),
      name: input.internalName ?? lead.internalName,
      address: input.address !== undefined ? input.address : lead.address,
      city: input.city !== undefined ? input.city : lead.prospectingCity,
    });

    await refreshCompleteness(tx, leadId);

    const [row] = await tx.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    return row!;
  });
}

/**
 * Salva um dado que veio ao vivo do Google como informacao propria do CRM,
 * apos confirmacao explicita do usuario.
 */
export async function confirmLeadContact(
  db: Database,
  leadId: string,
  input: { type: string; value: string; isPrimary?: boolean },
  actorUserId: string,
): Promise<void> {
  const lead = await getLeadOrThrow(db, leadId);
  const now = new Date();

  await db.transaction(async (tx) => {
    await insertContacts(tx, leadId, [input], 'USER_CONFIRMED', now);

    await refreshIdentities(tx, lead.workspaceId, leadId, {
      placeId: lead.placeId,
      phones: [input.value],
      name: lead.internalName,
      address: lead.address,
      city: lead.prospectingCity,
    });

    await recordEvent(tx, {
      leadId,
      eventType: 'DATA_CONFIRMED',
      occurredAt: now,
      actorUserId,
      payload: { field: 'contact', contactType: input.type },
    });

    await refreshCompleteness(tx, leadId);
  });
}

export async function confirmLeadLink(
  db: Database,
  leadId: string,
  input: { type: string; url: string; isPrimary?: boolean },
  actorUserId: string,
): Promise<void> {
  const lead = await getLeadOrThrow(db, leadId);
  const now = new Date();
  const classified = classifyWebsite(input.url);

  await db.transaction(async (tx) => {
    await insertLinks(tx, leadId, [input], 'USER_CONFIRMED', now);

    if (classified.classification === 'OWN_WEBSITE') {
      await refreshIdentities(tx, lead.workspaceId, leadId, {
        placeId: lead.placeId,
        websites: [input.url],
        name: lead.internalName,
        address: lead.address,
        city: lead.prospectingCity,
      });
    }

    await recordEvent(tx, {
      leadId,
      eventType: 'DATA_CONFIRMED',
      occurredAt: now,
      actorUserId,
      payload: { field: 'link', linkType: input.type },
    });

    await refreshCompleteness(tx, leadId);
  });
}

export async function removeLeadContact(db: Database, leadId: string, contactId: string) {
  await db
    .delete(leadContacts)
    .where(and(eq(leadContacts.id, contactId), eq(leadContacts.leadId, leadId)));
  await db.transaction(async (tx) => refreshCompleteness(tx, leadId));
}

export async function removeLeadLink(db: Database, leadId: string, linkId: string) {
  await db.delete(leadLinks).where(and(eq(leadLinks.id, linkId), eq(leadLinks.leadId, leadId)));
  await db.transaction(async (tx) => refreshCompleteness(tx, leadId));
}

/** Passagens por etapa, da mais recente para a mais antiga. */
export async function listStageHistory(db: Database, leadId: string) {
  return db
    .select({
      id: stageHistory.id,
      stageId: stageHistory.stageId,
      stageName: stages.name,
      semanticKey: stageHistory.semanticKey,
      enteredAt: stageHistory.enteredAt,
      exitedAt: stageHistory.exitedAt,
    })
    .from(stageHistory)
    .innerJoin(stages, eq(stages.id, stageHistory.stageId))
    .where(eq(stageHistory.leadId, leadId))
    .orderBy(desc(stageHistory.enteredAt));
}

/** Contagem de tentativas de contato registradas para o lead. */
export async function countContactAttempts(db: Database, leadId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(leadEvents)
    .where(
      and(eq(leadEvents.leadId, leadId), eq(leadEvents.eventType, 'CONTACT_ATTEMPT_RECORDED')),
    );
  return Number(row?.total ?? 0);
}

export const leadStageEnteredMs = (lead: Lead): number =>
  Date.now() - lead.stageEnteredAt.getTime();

export { sql };
