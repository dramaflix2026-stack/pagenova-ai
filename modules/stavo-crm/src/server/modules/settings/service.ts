/**
 * Catalogos configuraveis: etapas, origens, servicos, motivos de perda e
 * preferencias gerais.
 *
 * Principio: personalizar o processo NUNCA reescreve historico.
 *  - alterar preco de servico nao muda venda, recebivel ou assinatura antiga;
 *  - renomear etapa nao afeta metricas (elas usam semantic_key);
 *  - servico e origem com historico sao desativados, nunca apagados;
 *  - etapa com historico e removida do quadro, mas continua existindo para
 *    que stage_history nunca fique orfao.
 */
import { and, asc, count, eq, isNull, ne, sql } from 'drizzle-orm';

import {
  PRINCIPAL_SEMANTIC_KEYS,
  type StageSemanticKey,
} from '../../../shared/constants';
import type { AppSettingsInput } from '../../../shared/schemas';
import type { Database } from '../../db/client';
import {
  appSettings,
  auditLog,
  leadServiceInterests,
  leadSources,
  leads,
  lossReasons,
  saleItems,
  services,
  stageHistory,
  stages,
  subscriptions,
  type Service,
  type Stage,
} from '../../db/schema';
import { normalizeMoney } from '../../domain/money';
import { normalizeText } from '../../domain/normalize';
import { badRequest, conflict, notFound, unprocessable } from '../../lib/errors';
import { newId } from '../../lib/ids';

// ---------------------------------------------------------------------------
// Etapas
// ---------------------------------------------------------------------------

export async function listStages(db: Database, workspaceId: string, includeInactive = true): Promise<Stage[]> {
  const rows = await db
    .select()
    .from(stages)
    .where(and(eq(stages.workspaceId, workspaceId), isNull(stages.deletedAt)))
    .orderBy(asc(stages.position), asc(stages.createdAt));
  return includeInactive ? rows : rows.filter((stage) => stage.active);
}

export async function createStage(db: Database, workspaceId: string, input: { name: string; color: string; semanticKey: StageSemanticKey },
): Promise<Stage> {
  // Etapa principal e unica: duas colunas com o mesmo significado quebrariam
  // as metricas do dashboard.
  if (input.semanticKey !== 'AUXILIARY') {
    const [existing] = await db
      .select({ id: stages.id })
      .from(stages)
      .where(and(eq(stages.semanticKey, input.semanticKey), isNull(stages.deletedAt)))
      .limit(1);
    if (existing) {
      throw conflict(
        'Ja existe uma etapa com esse significado. Renomeie a etapa atual em vez de criar outra.',
        { code: 'DUPLICATE_SEMANTIC_STAGE' },
      );
    }
  }

  const [maxPosition] = await db
    .select({ value: sql<number>`coalesce(max(${stages.position}), -1)` })
    .from(stages);

  const now = new Date();
  const id = newId();

  await db.insert(stages).values({
    workspaceId,
    id,
    name: input.name,
    semanticKey: input.semanticKey,
    color: input.color,
    position: Number(maxPosition?.value ?? -1) + 1,
    active: true,
    isSystem: false,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.select().from(stages).where(and(eq(stages.workspaceId, workspaceId), eq(stages.id, id))).limit(1);
  return row!;
}

export async function updateStage(db: Database, workspaceId: string, stageId: string,
  input: { name?: string; color?: string; active?: boolean },
): Promise<Stage> {
  const [stage] = await db.select().from(stages).where(and(eq(stages.workspaceId, workspaceId), eq(stages.id, stageId))).limit(1);
  if (!stage || stage.deletedAt) throw notFound('Etapa nao encontrada.');

  // Desativar uma etapa principal esconderia parte do funil.
  if (input.active === false && stage.semanticKey !== 'AUXILIARY') {
    throw unprocessable(
      'Etapas principais do funil nao podem ser desativadas. Voce pode renomea-las ou mudar a cor.',
      { code: 'PRINCIPAL_STAGE_REQUIRED' },
    );
  }

  await db
    .update(stages)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(stages.workspaceId, workspaceId), eq(stages.id, stageId)));

  const [row] = await db.select().from(stages).where(and(eq(stages.workspaceId, workspaceId), eq(stages.id, stageId))).limit(1);
  return row!;
}

export async function reorderStages(db: Database, workspaceId: string, orderedIds: string[]): Promise<Stage[]> {
  const existing = await listStages(db, workspaceId);
  const known = new Set(existing.map((stage) => stage.id));

  for (const id of orderedIds) {
    if (!known.has(id)) throw badRequest('Uma das etapas informadas nao existe.');
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    for (const [position, id] of orderedIds.entries()) {
      await tx.update(stages).set({ position, updatedAt: now }).where(and(eq(stages.workspaceId, workspaceId), eq(stages.id, id)));
    }
  });

  return listStages(db, workspaceId);
}

export interface DeleteStageResult {
  /** true quando a linha foi realmente removida; false quando so saiu do quadro. */
  hardDeleted: boolean;
  movedLeads: number;
}

/**
 * Remove uma etapa auxiliar. Exige etapa de destino para os cards existentes.
 * Se houver historico apontando para ela, a etapa e apenas retirada do quadro
 * para que stage_history continue integro.
 */
export async function deleteStage(db: Database, workspaceId: string, stageId: string,
  destinationStageId: string,
  actorUserId: string,
): Promise<DeleteStageResult> {
  const [stage] = await db.select().from(stages).where(and(eq(stages.workspaceId, workspaceId), eq(stages.id, stageId))).limit(1);
  if (!stage || stage.deletedAt) throw notFound('Etapa nao encontrada.');

  if (stage.semanticKey !== 'AUXILIARY') {
    throw unprocessable(
      'Esta e uma etapa principal do funil e nao pode ser apagada. ' +
        'Renomeie-a ou reordene o quadro.',
      { code: 'PRINCIPAL_STAGE_REQUIRED' },
    );
  }

  if (destinationStageId === stageId) {
    throw badRequest('Escolha uma etapa de destino diferente da que sera removida.');
  }

  const [destination] = await db
    .select()
    .from(stages)
    .where(and(eq(stages.workspaceId, workspaceId), eq(stages.id, destinationStageId)))
    .limit(1);
  if (!destination || destination.deletedAt) throw notFound('Etapa de destino nao encontrada.');

  const now = new Date();

  return db.transaction(async (tx) => {
    const moved = await tx
      .update(leads)
      .set({ currentStageId: destinationStageId, stageEnteredAt: now, updatedAt: now })
      .where(eq(leads.currentStageId, stageId));

    const movedLeads = Number((moved as unknown as { affectedRows?: number }).affectedRows ?? 0);

    const [historyRow] = await tx
      .select({ total: count() })
      .from(stageHistory)
      .where(eq(stageHistory.stageId, stageId));

    const hasHistory = Number(historyRow?.total ?? 0) > 0;

    if (hasHistory) {
      // Historico preservado: a etapa some do quadro mas continua referenciavel.
      await tx
        .update(stages)
        .set({ deletedAt: now, active: false, updatedAt: now })
        .where(and(eq(stages.workspaceId, workspaceId), eq(stages.id, stageId)));
    } else {
      await tx.delete(stages).where(and(eq(stages.workspaceId, workspaceId), eq(stages.id, stageId)));
    }

    await tx.insert(auditLog).values({
      workspaceId,
      id: newId(),
      action: 'STAGE_DELETED',
      entityType: 'stages',
      entityId: stageId,
      actorUserId,
      summary: `Etapa "${stage.name}" removida do quadro.`,
      metadata: { destinationStageId, movedLeads, historyPreserved: hasHistory },
      occurredAt: now,
    });

    return { hardDeleted: !hasHistory, movedLeads };
  });
}

/** Verifica que todas as etapas principais continuam presentes. */
export async function missingPrincipalStages(db: Database, workspaceId: string): Promise<StageSemanticKey[]> {
  const rows = await db
    .select({ semanticKey: stages.semanticKey })
    .from(stages)
    .where(and(eq(stages.workspaceId, workspaceId), isNull(stages.deletedAt)));
  const present = new Set(rows.map((row) => row.semanticKey));
  return PRINCIPAL_SEMANTIC_KEYS.filter((key) => !present.has(key));
}

// ---------------------------------------------------------------------------
// Origens
// ---------------------------------------------------------------------------

export async function listSources(db: Database, workspaceId: string) {
  return db.select().from(leadSources).where(eq(leadSources.workspaceId, workspaceId)).orderBy(asc(leadSources.name));
}

export async function createSource(db: Database, workspaceId: string, name: string) {
  const slug = normalizeText(name).replace(/\s+/g, '-').slice(0, 60);
  if (!slug) throw badRequest('Informe um nome valido para a origem.');

  const [existing] = await db
    .select({ id: leadSources.id })
    .from(leadSources)
    .where(and(eq(leadSources.workspaceId, workspaceId), eq(leadSources.slug, slug)))
    .limit(1);
  if (existing) throw conflict('Ja existe uma origem com esse nome.');

  const now = new Date();
  const id = newId();
  await db.insert(leadSources).values({
    workspaceId,
    id,
    name,
    slug,
    isSystem: false,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.select().from(leadSources).where(and(eq(leadSources.workspaceId, workspaceId), eq(leadSources.id, id))).limit(1);
  return row!;
}

export async function updateSource(db: Database, workspaceId: string, sourceId: string,
  input: { name?: string; active?: boolean },
) {
  const [source] = await db
    .select()
    .from(leadSources)
    .where(and(eq(leadSources.workspaceId, workspaceId), eq(leadSources.id, sourceId)))
    .limit(1);
  if (!source) throw notFound('Origem nao encontrada.');

  if (input.name && source.isSystem) {
    throw unprocessable('Origens padrao nao podem ser renomeadas. Voce pode desativa-las.', {
      code: 'SYSTEM_SOURCE',
    });
  }

  await db
    .update(leadSources)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(leadSources.workspaceId, workspaceId), eq(leadSources.id, sourceId)));

  const [row] = await db.select().from(leadSources).where(and(eq(leadSources.workspaceId, workspaceId), eq(leadSources.id, sourceId))).limit(1);
  return row!;
}

/** Origem com leads vinculados nunca e apagada: apenas desativada. */
export async function deleteSource(db: Database, workspaceId: string, sourceId: string) {
  const [used] = await db
    .select({ total: count() })
    .from(leads)
    .where(eq(leads.sourceId, sourceId));

  if (Number(used?.total ?? 0) > 0) {
    throw unprocessable(
      'Esta origem possui leads vinculados e nao pode ser excluida. Desative-a para parar de usa-la.',
      { code: 'SOURCE_IN_USE' },
    );
  }

  const [source] = await db
    .select()
    .from(leadSources)
    .where(and(eq(leadSources.workspaceId, workspaceId), eq(leadSources.id, sourceId)))
    .limit(1);
  if (!source) throw notFound('Origem nao encontrada.');
  if (source.isSystem) {
    throw unprocessable('Origens padrao nao podem ser excluidas. Desative-a para parar de usa-la.', {
      code: 'SYSTEM_SOURCE',
    });
  }

  await db.delete(leadSources).where(and(eq(leadSources.workspaceId, workspaceId), eq(leadSources.id, sourceId)));
}

// ---------------------------------------------------------------------------
// Servicos
// ---------------------------------------------------------------------------

export async function listServices(db: Database, workspaceId: string): Promise<Service[]> {
  return db.select().from(services).where(eq(services.workspaceId, workspaceId)).orderBy(asc(services.active), asc(services.name));
}

export async function createService(db: Database, workspaceId: string, input: { name: string; description: string | null; billingType: string; defaultPrice: string },
): Promise<Service> {
  const now = new Date();
  const id = newId();

  await db.insert(services).values({
    workspaceId,
    id,
    name: input.name,
    description: input.description,
    billingType: input.billingType,
    defaultPrice: normalizeMoney(input.defaultPrice),
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.select().from(services).where(and(eq(services.workspaceId, workspaceId), eq(services.id, id))).limit(1);
  return row!;
}

export async function updateService(db: Database, workspaceId: string, serviceId: string,
  input: {
    name?: string;
    description?: string | null;
    billingType?: string;
    defaultPrice?: string;
    active?: boolean;
  },
): Promise<Service> {
  const [service] = await db.select().from(services).where(and(eq(services.workspaceId, workspaceId), eq(services.id, serviceId))).limit(1);
  if (!service) throw notFound('Servico nao encontrado.');

  // Trocar o tipo de cobranca com historico mudaria o sentido de vendas antigas.
  if (input.billingType && input.billingType !== service.billingType) {
    const [used] = await db
      .select({ total: count() })
      .from(saleItems)
      .where(eq(saleItems.serviceId, serviceId));
    if (Number(used?.total ?? 0) > 0) {
      throw unprocessable(
        'Este servico ja possui vendas registradas e o tipo de cobranca nao pode mudar. ' +
          'Crie um novo servico com o outro tipo.',
        { code: 'BILLING_TYPE_LOCKED' },
      );
    }
  }

  // Alterar o preco padrao NAO altera propostas, vendas, recebiveis ou
  // assinaturas ja existentes: todos guardam snapshot proprio.
  await db
    .update(services)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.billingType !== undefined ? { billingType: input.billingType } : {}),
      ...(input.defaultPrice !== undefined
        ? { defaultPrice: normalizeMoney(input.defaultPrice) }
        : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(services.workspaceId, workspaceId), eq(services.id, serviceId)));

  const [row] = await db.select().from(services).where(and(eq(services.workspaceId, workspaceId), eq(services.id, serviceId))).limit(1);
  return row!;
}

export interface ServiceUsage {
  interests: number;
  saleItems: number;
  subscriptions: number;
  hasHistory: boolean;
}

export async function serviceUsage(db: Database, workspaceId: string, serviceId: string): Promise<ServiceUsage> {
  const [interests] = await db
    .select({ total: count() })
    .from(leadServiceInterests)
    .where(eq(leadServiceInterests.serviceId, serviceId));
  const [items] = await db
    .select({ total: count() })
    .from(saleItems)
    .where(eq(saleItems.serviceId, serviceId));
  const [subs] = await db
    .select({ total: count() })
    .from(subscriptions)
    .where(eq(subscriptions.serviceId, serviceId));

  const usage = {
    interests: Number(interests?.total ?? 0),
    saleItems: Number(items?.total ?? 0),
    subscriptions: Number(subs?.total ?? 0),
  };

  return { ...usage, hasHistory: usage.interests + usage.saleItems + usage.subscriptions > 0 };
}

/** Servico com historico nunca e apagado fisicamente: e desativado. */
export async function deleteService(db: Database, workspaceId: string, serviceId: string): Promise<{ deactivated: boolean }> {
  const usage = await serviceUsage(db, workspaceId, serviceId);

  if (usage.hasHistory) {
    await updateService(db, workspaceId, serviceId, { active: false });
    return { deactivated: true };
  }

  await db.delete(services).where(and(eq(services.workspaceId, workspaceId), eq(services.id, serviceId)));
  return { deactivated: false };
}

// ---------------------------------------------------------------------------
// Motivos de perda
// ---------------------------------------------------------------------------

export async function listLossReasons(db: Database, workspaceId: string) {
  return db.select().from(lossReasons).where(eq(lossReasons.workspaceId, workspaceId)).orderBy(asc(lossReasons.position), asc(lossReasons.name));
}

export async function createLossReason(db: Database, workspaceId: string, name: string) {
  const [maxPosition] = await db
    .select({ value: sql<number>`coalesce(max(${lossReasons.position}), -1)` })
    .from(lossReasons)
    .where(eq(lossReasons.workspaceId, workspaceId));

  const now = new Date();
  const id = newId();
  await db.insert(lossReasons).values({
    workspaceId,
    id,
    name,
    active: true,
    isSystem: false,
    position: Number(maxPosition?.value ?? -1) + 1,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.select().from(lossReasons).where(and(eq(lossReasons.workspaceId, workspaceId), eq(lossReasons.id, id))).limit(1);
  return row!;
}

export async function updateLossReason(db: Database, workspaceId: string, reasonId: string,
  input: { name?: string; active?: boolean },
) {
  const [reason] = await db.select().from(lossReasons).where(and(eq(lossReasons.workspaceId, workspaceId), eq(lossReasons.id, reasonId))).limit(1);
  if (!reason) throw notFound('Motivo nao encontrado.');

  // Sempre precisa existir ao menos um motivo ativo para registrar perdas.
  if (input.active === false) {
    const [remaining] = await db
      .select({ total: count() })
      .from(lossReasons)
      .where(and(eq(lossReasons.active, true), ne(lossReasons.id, reasonId)));
    if (Number(remaining?.total ?? 0) === 0) {
      throw unprocessable('Mantenha pelo menos um motivo de perda ativo.', {
        code: 'LAST_ACTIVE_LOSS_REASON',
      });
    }
  }

  await db
    .update(lossReasons)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(lossReasons.workspaceId, workspaceId), eq(lossReasons.id, reasonId)));

  const [row] = await db.select().from(lossReasons).where(and(eq(lossReasons.workspaceId, workspaceId), eq(lossReasons.id, reasonId))).limit(1);
  return row!;
}

// ---------------------------------------------------------------------------
// Preferencias gerais
// ---------------------------------------------------------------------------

export interface AppPreferences {
  appName: string;
  stalledNegotiationDays: number;
  stalledSelectedDays: number;
  dashboardDefaultPeriod: string;
  searchRequirePhoneByDefault: boolean;
  googleTextSearchLimit: number | null;
  googleDetailsLimit: number | null;
  googleWarningPercent: number | null;
}

const PREFERENCE_DEFAULTS: AppPreferences = {
  appName: 'Stavo Digital',
  stalledNegotiationDays: 7,
  stalledSelectedDays: 5,
  dashboardDefaultPeriod: 'THIS_MONTH',
  searchRequirePhoneByDefault: true,
  googleTextSearchLimit: null,
  googleDetailsLimit: null,
  googleWarningPercent: null,
};

export async function getPreferences(db: Database, workspaceId: string): Promise<AppPreferences> {
  const rows = await db.select().from(appSettings)
    .where(eq(appSettings.workspaceId, workspaceId));
  const map = new Map(rows.map((row) => [row.settingKey, row.value]));

  const read = <K extends keyof AppPreferences>(key: K): AppPreferences[K] => {
    const value = map.get(key);
    return (value === undefined || value === null
      ? PREFERENCE_DEFAULTS[key]
      : value) as AppPreferences[K];
  };

  return {
    appName: read('appName'),
    stalledNegotiationDays: Number(read('stalledNegotiationDays')),
    stalledSelectedDays: Number(read('stalledSelectedDays')),
    dashboardDefaultPeriod: read('dashboardDefaultPeriod'),
    searchRequirePhoneByDefault: Boolean(read('searchRequirePhoneByDefault')),
    googleTextSearchLimit: read('googleTextSearchLimit'),
    googleDetailsLimit: read('googleDetailsLimit'),
    googleWarningPercent: read('googleWarningPercent'),
  };
}

export async function updatePreferences(db: Database, workspaceId: string, input: AppSettingsInput,
  actorUserId: string,
): Promise<AppPreferences> {
  const now = new Date();
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);

  await db.transaction(async (tx) => {
    for (const [key, value] of entries) {
      // Nenhum segredo entra aqui: chaves de API vivem so no ambiente.
      await tx
        .insert(appSettings)
        .values({ workspaceId, settingKey: key, value: value as never, updatedAt: now })
        .onDuplicateKeyUpdate({ set: { value: value as never, updatedAt: now } });
    }

    if (entries.length > 0) {
      await tx.insert(auditLog).values({
        workspaceId,
      id: newId(),
        action: 'SETTINGS_UPDATED',
        entityType: 'app_settings',
        entityId: null,
        actorUserId,
        summary: 'Preferencias da plataforma atualizadas.',
        metadata: { keys: entries.map(([key]) => key) },
        occurredAt: now,
      });
    }
  });

  return getPreferences(db, workspaceId);
}
