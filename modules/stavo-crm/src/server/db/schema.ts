/**
 * Schema MySQL (Drizzle ORM).
 *
 * Invariantes estruturais:
 *  - dinheiro sempre DECIMAL(14,2), nunca float;
 *  - timestamps gravados em UTC (a conexao usa timezone 'Z');
 *  - historico nunca e apagado: leads sao arquivados, financeiro e cancelado
 *    ou estornado;
 *  - unicidade de eventos singulares por lead garantida por `unique_scope`,
 *    ja que o MySQL nao possui indice unico parcial;
 *  - identidade de lead normalizada impede duplicidade em qualquer origem.
 */
import {
  boolean,
  date,
  datetime,
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlTable,
  primaryKey,
  smallint,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

const id = () => varchar('id', { length: 26 });
const money = (name: string) => decimal(name, { precision: 14, scale: 2 });
const ts = (name: string) => datetime(name, { mode: 'date', fsp: 3 });

// ---------------------------------------------------------------------------
// Acesso
// ---------------------------------------------------------------------------

export const workspaces = mysqlTable(
  'workspaces',
  {
    id: id().primaryKey(),
    /**
     * Identidade externa do proprietario no PageNova/Supabase.
     * Permite provisionamento idempotente no primeiro acesso.
     */
    externalOwnerId: varchar('external_owner_id', { length: 128 }),
    name: varchar('name', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 120 }),
    status: varchar('status', { length: 16 }).notNull().default('ACTIVE'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('workspaces_external_owner_unique').on(table.externalOwnerId),
    uniqueIndex('workspaces_slug_unique').on(table.slug),
    index('workspaces_status_idx').on(table.status),
  ],
);
export const users = mysqlTable(
  'users',
  {
    id: id().primaryKey(),
    email: varchar('email', { length: 254 }).notNull(),
    externalAuthId: varchar('external_auth_id', { length: 128 }),
    /** Nome exibido nos cards e no historico: "Lucas esta trabalhando". */
    name: varchar('name', { length: 120 }).notNull().default(''),
    /** OWNER | PARTNER | EMPLOYEE | SUPPORT -- ver src/shared/roles.ts */
    role: varchar('role', { length: 16 }).notNull().default('OWNER'),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    active: boolean('active').notNull().default(true),
    lastLoginAt: ts('last_login_at'),
    passwordChangedAt: ts('password_changed_at'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email),
    uniqueIndex('users_external_auth_id_unique').on(table.externalAuthId),
],
);

export const workspaceMembers = mysqlTable(
  'workspace_members',
  {
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 26 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * OWNER | PARTNER | EMPLOYEE | SUPPORT.
     * O papel passa a valer dentro do workspace, nao globalmente.
     */
    role: varchar('role', { length: 16 }).notNull().default('EMPLOYEE'),
    status: varchar('status', { length: 16 }).notNull().default('ACTIVE'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.userId] }),
    index('workspace_members_user_idx').on(table.userId, table.status),
    index('workspace_members_workspace_idx').on(table.workspaceId, table.status),
  ],
);
export const authSessions = mysqlTable(
  'auth_sessions',
  {
    id: id().primaryKey(),
    /** Somente o hash do token e persistido; o valor bruto fica no cookie. */
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    userId: varchar('user_id', { length: 26 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    createdAt: ts('created_at').notNull(),
    lastSeenAt: ts('last_seen_at').notNull(),
    /** Expiracao absoluta; a inatividade e checada contra last_seen_at. */
    expiresAt: ts('expires_at').notNull(),
    revokedAt: ts('revoked_at'),
    /** Metadados minimos de seguranca, sem rastrear o usuario. */
    ipHash: varchar('ip_hash', { length: 64 }),
    userAgentSummary: varchar('user_agent_summary', { length: 120 }),
  },
  (table) => [
    uniqueIndex('auth_sessions_token_hash_unique').on(table.tokenHash),
    index('auth_sessions_user_idx').on(table.userId, table.expiresAt),
    index('auth_sessions_workspace_idx').on(table.workspaceId),
],
);

export const loginAttempts = mysqlTable(
  'login_attempts',
  {
    id: id().primaryKey(),
    /** Chave de agrupamento: hash do IP + e-mail tentado. */
    attemptKey: varchar('attempt_key', { length: 64 }).notNull(),
    failedCount: int('failed_count').notNull().default(0),
    firstFailedAt: ts('first_failed_at').notNull(),
    lastFailedAt: ts('last_failed_at').notNull(),
    lockedUntil: ts('locked_until'),
  },
  (table) => [uniqueIndex('login_attempts_key_unique').on(table.attemptKey)],
);

export const appSettings = mysqlTable(
  'app_settings',
  {
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    settingKey: varchar('setting_key', { length: 80 }).notNull(),
    /** Valor JSON validado por Zod na leitura. Nunca guarda segredo. */
    value: json('value').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.settingKey] }),
    index('app_settings_workspace_idx').on(table.workspaceId),
  ],
);

export const auditLog = mysqlTable(
  'audit_log',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    action: varchar('action', { length: 80 }).notNull(),
    entityType: varchar('entity_type', { length: 60 }),
    entityId: varchar('entity_id', { length: 26 }),
    actorUserId: varchar('actor_user_id', { length: 26 }),
    /** Resumo sanitizado; nunca contem senha, token ou segredo. */
    summary: varchar('summary', { length: 500 }),
    metadata: json('metadata'),
    occurredAt: ts('occurred_at').notNull(),
  },
  (table) => [
    index('audit_log_action_idx').on(table.action, table.occurredAt),
    index('audit_log_entity_idx').on(table.entityType, table.entityId),
  ],
);

// ---------------------------------------------------------------------------
// Catalogos
// ---------------------------------------------------------------------------

export const leadSources = mysqlTable(
  'lead_sources',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 60 }).notNull(),
    slug: varchar('slug', { length: 60 }).notNull(),
    isSystem: boolean('is_system').notNull().default(false),
    active: boolean('active').notNull().default(true),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [uniqueIndex('lead_sources_slug_unique').on(table.workspaceId, table.slug)],
);

export const stages = mysqlTable(
  'stages',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 60 }).notNull(),
    /** Significado interno; alimenta metricas mesmo apos renomeacao. */
    semanticKey: varchar('semantic_key', { length: 24 }).notNull(),
    color: varchar('color', { length: 9 }).notNull().default('#64748b'),
    position: int('position').notNull(),
    active: boolean('active').notNull().default(true),
    isSystem: boolean('is_system').notNull().default(false),
    /**
     * Etapa auxiliar removida do quadro. Continua existindo enquanto houver
     * historico apontando para ela, para nunca orfanar stage_history.
     */
    deletedAt: ts('deleted_at'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    index('stages_position_idx').on(table.position),
    index('stages_semantic_idx').on(table.semanticKey),
    index('stages_deleted_idx').on(table.deletedAt),
  ],
);

export const lossReasons = mysqlTable(
  'loss_reasons',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 80 }).notNull(),
    active: boolean('active').notNull().default(true),
    isSystem: boolean('is_system').notNull().default(false),
    position: int('position').notNull().default(0),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [index('loss_reasons_position_idx').on(table.position)],
);

export const services = mysqlTable(
  'services',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    description: text('description'),
    /** ONE_TIME | RECURRING_MONTHLY */
    billingType: varchar('billing_type', { length: 24 }).notNull(),
    defaultPrice: money('default_price').notNull().default('0.00'),
    active: boolean('active').notNull().default(true),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [index('services_active_idx').on(table.active, table.name)],
);

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export const leads = mysqlTable(
  'leads',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    /** GOOGLE_PLACE | IMPORTED | MANUAL */
    originType: varchar('origin_type', { length: 20 }).notNull(),
    sourceId: varchar('source_id', { length: 26 }).references(() => leadSources.id, {
      onDelete: 'restrict',
    }),
    currentStageId: varchar('current_stage_id', { length: 26 })
      .notNull()
      .references(() => stages.id, { onDelete: 'restrict' }),
    /** Rotulo do CRM definido pelo usuario, independente do Google. */
    internalName: varchar('internal_name', { length: 160 }).notNull(),
    /** Guardado por tempo indeterminado; unico e nunca compartilhado. */
    placeId: varchar('place_id', { length: 255 }),
    prospectingNiche: varchar('prospecting_niche', { length: 120 }),
    prospectingCountry: varchar('prospecting_country', { length: 80 }),
    prospectingState: varchar('prospecting_state', { length: 80 }),
    prospectingCity: varchar('prospecting_city', { length: 120 }),
    /** Endereco proprio do CRM (digitado/importado), nunca copiado do Google. */
    address: varchar('address', { length: 255 }),
    campaignOrSearchContext: varchar('campaign_or_search_context', { length: 255 }),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    /** NONE | WARNING | CRITICAL */
    incompleteLevel: varchar('incomplete_level', { length: 12 }).notNull().default('NONE'),
    /** Momento em que o lead entrou na etapa atual (para "tempo na etapa"). */
    stageEnteredAt: ts('stage_entered_at').notNull(),
    archivedAt: ts('archived_at'),
    /**
     * Quem trabalha este lead. Todos enxergam; so o dono mexe.
     *
     * Nulo para os leads criados antes da equipe existir -- e para quando o
     * colaborador e desativado, caso em que o lead volta a ficar livre em vez
     * de sumir junto com a pessoa.
     */
    ownerUserId: varchar('owner_user_id', { length: 26 }).references(() => users.id, {
      onDelete: 'set null',
    }),
    importJobId: varchar('import_job_id', { length: 26 }),
    searchRunId: varchar('search_run_id', { length: 26 }),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('leads_workspace_place_id_unique').on(table.workspaceId, table.placeId),
    index('leads_stage_idx').on(table.currentStageId, table.archivedAt),
    index('leads_source_idx').on(table.sourceId),
    index('leads_created_idx').on(table.createdAt),
    index('leads_archived_idx').on(table.archivedAt),
    index('leads_owner_idx').on(table.ownerUserId),
    index('leads_city_idx').on(table.prospectingCity),
    index('leads_niche_idx').on(table.prospectingNiche),
    index('leads_name_idx').on(table.internalName),
  ],
);

export const leadContacts = mysqlTable(
  'lead_contacts',
  {
    id: id().primaryKey(),
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    /** PHONE | WHATSAPP | EMAIL | OTHER */
    type: varchar('type', { length: 16 }).notNull(),
    value: varchar('value', { length: 160 }).notNull(),
    /** E.164 para telefones; minusculas para e-mail. */
    normalizedValue: varchar('normalized_value', { length: 160 }),
    /** MANUAL | IMPORT | USER_CONFIRMED */
    origin: varchar('origin', { length: 20 }).notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    isConfirmed: boolean('is_confirmed').notNull().default(false),
    /** Telefone que a biblioteca nao conseguiu validar continua visivel. */
    isValid: boolean('is_valid').notNull().default(true),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    index('lead_contacts_lead_idx').on(table.leadId, table.type),
    index('lead_contacts_normalized_idx').on(table.normalizedValue),
  ],
);

export const leadLinks = mysqlTable(
  'lead_links',
  {
    id: id().primaryKey(),
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    /** WEBSITE | DEMO_OR_PROPOSAL | INSTAGRAM | ... */
    type: varchar('type', { length: 24 }).notNull(),
    url: varchar('url', { length: 2048 }).notNull(),
    normalizedHost: varchar('normalized_host', { length: 253 }),
    /** MANUAL | IMPORT | USER_CONFIRMED */
    origin: varchar('origin', { length: 20 }).notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    index('lead_links_lead_idx').on(table.leadId, table.type),
    index('lead_links_host_idx').on(table.normalizedHost),
  ],
);

export const leadIdentityKeys = mysqlTable(
  'lead_identity_keys',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    /** PLACE_ID | PHONE | OWN_DOMAIN | NAME_ADDRESS */
    keyType: varchar('key_type', { length: 20 }).notNull(),
    keyHash: varchar('key_hash', { length: 64 }).notNull(),
    /** Amostra legivel para auditoria, sem expor dado desnecessario. */
    keySample: varchar('key_sample', { length: 120 }),
    /** Excecao humana: unidades reais que compartilham telefone/dominio. */
    isSharedException: boolean('is_shared_exception').notNull().default(false),
    exceptionReason: varchar('exception_reason', { length: 255 }),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [uniqueIndex('lead_identity_keys_unique').on(table.workspaceId, table.keyType, table.keyHash)],
);

export const leadIdentityMemberships = mysqlTable(
  'lead_identity_memberships',
  {
    identityKeyId: varchar('identity_key_id', { length: 26 }).notNull(),
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    createdAt: ts('created_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.identityKeyId, table.leadId] }),
    index('lead_identity_memberships_lead_idx').on(table.leadId),
    // Nome explicito: o gerado automaticamente teria 66 caracteres e o
    // MySQL recusa identificadores acima de 64.
    foreignKey({
      name: 'lead_identity_memberships_key_fk',
      columns: [table.identityKeyId],
      foreignColumns: [leadIdentityKeys.id],
    }).onDelete('cascade'),
  ],
);

export const duplicateReviews = mysqlTable(
  'duplicate_reviews',
  {
    id: id().primaryKey(),
    /** Lead criado que ficou sob suspeita; pode ser nulo quando bloqueado. */
    candidateLeadId: varchar('candidate_lead_id', { length: 26 }),
    existingLeadId: varchar('existing_lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),
    /** Resumo legivel do motivo da suspeita. */
    reason: varchar('reason', { length: 255 }).notNull(),
    candidatePayload: json('candidate_payload'),
    importJobId: varchar('import_job_id', { length: 26 }),
    importRowNumber: int('import_row_number'),
    /** PENDING | CONFIRMED_SAME | CONFIRMED_DIFFERENT | DISMISSED */
    status: varchar('status', { length: 24 }).notNull().default('PENDING'),
    reviewedAt: ts('reviewed_at'),
    createdAt: ts('created_at').notNull(),
  },
  (table) => [
    index('duplicate_reviews_status_idx').on(table.status, table.createdAt),
    index('duplicate_reviews_existing_idx').on(table.existingLeadId),
  ],
);

export const leadServiceInterests = mysqlTable(
  'lead_service_interests',
  {
    id: id().primaryKey(),
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),
    serviceId: varchar('service_id', { length: 26 })
      .notNull()
      .references(() => services.id, { onDelete: 'restrict' }),
    proposedPrice: money('proposed_price'),
    /** Congela o tipo de cobranca vigente na proposta. */
    billingTypeSnapshot: varchar('billing_type_snapshot', { length: 24 }).notNull(),
    notes: text('notes'),
    /** OPEN | WON | LOST | CANCELED */
    status: varchar('status', { length: 16 }).notNull().default('OPEN'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    index('lead_service_interests_lead_idx').on(table.leadId, table.status),
    index('lead_service_interests_service_idx').on(table.serviceId),
  ],
);

// ---------------------------------------------------------------------------
// Historico
// ---------------------------------------------------------------------------

export const leadEvents = mysqlTable(
  'lead_events',
  {
    id: id().primaryKey(),
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),
    eventType: varchar('event_type', { length: 40 }).notNull(),
    /**
     * Escopo de unicidade para eventos que so podem existir uma vez por lead
     * (primeiro contato, primeira resposta). NULL para eventos repetiveis --
     * o MySQL permite varios NULL em indice unico.
     */
    uniqueScope: varchar('unique_scope', { length: 80 }),
    /**
     * 191, nao 80: esta coluna guarda chaves COMPOSTAS (base do chamador +
     * sufixo de contexto, ex. ":receivable:<id>:<periodo>"), nao so a chave
     * bruta do cliente -- ver finance/service.ts. 80 estourava de verdade em
     * cobranca recorrente real (achado no ensaio de migracao da etapa A15).
     */
    idempotencyKey: varchar('idempotency_key', { length: 191 }),
    actorUserId: varchar('actor_user_id', { length: 26 }),
    /**
     * Reuniao referenciada, quando o evento for de reuniao.
     *
     * Coluna propria em vez de busca dentro do JSON: "todos os eventos desta
     * reuniao" e consulta frequente do drawer, e vasculhar payload nao usa
     * indice. Sem chave estrangeira de proposito -- o log e imutavel e nao
     * pode ser derrubado por uma exclusao futura.
     */
    meetingId: varchar('meeting_id', { length: 26 }),
    occurredAt: ts('occurred_at').notNull(),
    payloadVersion: smallint('payload_version').notNull().default(1),
    /** Nunca guarda snapshot proibido do Google. */
    payload: json('payload'),
    createdAt: ts('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('lead_events_unique_scope').on(table.uniqueScope),
    uniqueIndex('lead_events_idempotency_unique').on(table.idempotencyKey),
    index('lead_events_lead_idx').on(table.leadId, table.occurredAt),
    index('lead_events_type_idx').on(table.eventType, table.occurredAt),
    index('lead_events_meeting_idx').on(table.meetingId, table.occurredAt),
  ],
);

export const stageHistory = mysqlTable(
  'stage_history',
  {
    id: id().primaryKey(),
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),
    stageId: varchar('stage_id', { length: 26 })
      .notNull()
      .references(() => stages.id, { onDelete: 'restrict' }),
    semanticKey: varchar('semantic_key', { length: 24 }).notNull(),
    enteredAt: ts('entered_at').notNull(),
    exitedAt: ts('exited_at'),
    movementEventId: varchar('movement_event_id', { length: 26 }),
  },
  (table) => [
    index('stage_history_lead_idx').on(table.leadId, table.enteredAt),
    index('stage_history_open_idx').on(table.leadId, table.exitedAt),
    index('stage_history_stage_idx').on(table.stageId, table.enteredAt),
  ],
);

export const activities = mysqlTable(
  'activities',
  {
    id: id().primaryKey(),
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),
    /** NOTE | CALL | WHATSAPP_ATTEMPT | CONTACT_ATTEMPT | MEETING | OTHER */
    activityType: varchar('activity_type', { length: 24 }).notNull(),
    body: text('body'),
    occurredAt: ts('occurred_at').notNull(),
    createdBy: varchar('created_by', { length: 26 }),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    index('activities_lead_idx').on(table.leadId, table.occurredAt),
    index('activities_type_idx').on(table.activityType, table.occurredAt),
  ],
);

export const followUps = mysqlTable(
  'follow_ups',
  {
    id: id().primaryKey(),
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),
    /** Data civil de vencimento no fuso operacional. */
    dueAt: date('due_at', { mode: 'string' }).notNull(),
    /** PENDING | COMPLETED | CANCELED */
    status: varchar('status', { length: 16 }).notNull().default('PENDING'),
    note: text('note'),
    completedAt: ts('completed_at'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    index('follow_ups_status_due_idx').on(table.status, table.dueAt),
    index('follow_ups_lead_idx').on(table.leadId, table.status),
  ],
);

export const leadLosses = mysqlTable(
  'lead_losses',
  {
    id: id().primaryKey(),
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),
    lossReasonId: varchar('loss_reason_id', { length: 26 })
      .notNull()
      .references(() => lossReasons.id, { onDelete: 'restrict' }),
    note: text('note'),
    occurredAt: ts('occurred_at').notNull(),
    /** Ciclo logico: incrementa quando o lead e reaberto e perdido de novo. */
    cycle: int('cycle').notNull().default(1),
    createdAt: ts('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('lead_losses_cycle_unique').on(table.leadId, table.cycle),
    index('lead_losses_occurred_idx').on(table.occurredAt),
    index('lead_losses_reason_idx').on(table.lossReasonId),
  ],
);

// ---------------------------------------------------------------------------
// Financeiro
// ---------------------------------------------------------------------------

export const sales = mysqlTable(
  'sales',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),
    /** PENDING | CONFIRMED | CANCELED | REVERSED */
    status: varchar('status', { length: 16 }).notNull().default('PENDING'),
    agreedAt: date('agreed_at', { mode: 'string' }).notNull(),
    confirmedAt: ts('confirmed_at'),
    canceledAt: ts('canceled_at'),
    cancellationReason: varchar('cancellation_reason', { length: 500 }),
    /** Total congelado no momento do acordo. */
    totalSnapshot: money('total_snapshot').notNull(),
    notes: text('notes'),
    createdBy: varchar('created_by', { length: 26 }),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    index('sales_status_idx').on(table.status, table.confirmedAt),
    index('sales_lead_idx').on(table.leadId),
    index('sales_agreed_idx').on(table.agreedAt),
  ],
);

export const saleItems = mysqlTable(
  'sale_items',
  {
    id: id().primaryKey(),
    saleId: varchar('sale_id', { length: 26 })
      .notNull()
      .references(() => sales.id, { onDelete: 'cascade' }),
    serviceId: varchar('service_id', { length: 26 })
      .notNull()
      .references(() => services.id, { onDelete: 'restrict' }),
    /** Snapshots: alterar o catalogo depois nao muda a venda historica. */
    serviceNameSnapshot: varchar('service_name_snapshot', { length: 120 }).notNull(),
    billingTypeSnapshot: varchar('billing_type_snapshot', { length: 24 }).notNull(),
    unitPriceSnapshot: money('unit_price_snapshot').notNull(),
    quantity: int('quantity').notNull().default(1),
    totalSnapshot: money('total_snapshot').notNull(),
    createdAt: ts('created_at').notNull(),
  },
  (table) => [
    index('sale_items_sale_idx').on(table.saleId),
    index('sale_items_service_idx').on(table.serviceId),
  ],
);

export const subscriptions = mysqlTable(
  'subscriptions',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),
    saleItemId: varchar('sale_item_id', { length: 26 }).references(() => saleItems.id, {
      onDelete: 'set null',
    }),
    serviceId: varchar('service_id', { length: 26 })
      .notNull()
      .references(() => services.id, { onDelete: 'restrict' }),
    serviceNameSnapshot: varchar('service_name_snapshot', { length: 120 }).notNull(),
    /** Valor contratado; independente do preco atual do catalogo. */
    amountSnapshot: money('amount_snapshot').notNull(),
    /** ACTIVE | PAUSED | CANCELED */
    status: varchar('status', { length: 16 }).notNull().default('ACTIVE'),
    firstDueDate: date('first_due_date', { mode: 'string' }).notNull(),
    nextDueDate: date('next_due_date', { mode: 'string' }),
    /** Ultima competencia ja gerada, para o job idempotente. */
    lastGeneratedPeriod: varchar('last_generated_period', { length: 7 }),
    canceledAt: ts('canceled_at'),
    cancellationReason: varchar('cancellation_reason', { length: 500 }),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    index('subscriptions_status_next_idx').on(table.status, table.nextDueDate),
    index('subscriptions_lead_idx').on(table.leadId),
    index('subscriptions_service_idx').on(table.serviceId),
  ],
);

/** Alteracoes de valor de assinatura com vigencia por competencia. */
export const subscriptionChanges = mysqlTable(
  'subscription_changes',
  {
    id: id().primaryKey(),
    subscriptionId: varchar('subscription_id', { length: 26 })
      .notNull()
      .references(() => subscriptions.id, { onDelete: 'cascade' }),
    previousAmount: money('previous_amount').notNull(),
    newAmount: money('new_amount').notNull(),
    effectiveFrom: varchar('effective_from', { length: 7 }).notNull(),
    reason: varchar('reason', { length: 500 }),
    createdAt: ts('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('subscription_changes_unique').on(table.subscriptionId, table.effectiveFrom),
  ],
);

export const receivables = mysqlTable(
  'receivables',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),
    saleId: varchar('sale_id', { length: 26 }).references(() => sales.id, {
      onDelete: 'restrict',
    }),
    subscriptionId: varchar('subscription_id', { length: 26 }).references(() => subscriptions.id, {
      onDelete: 'restrict',
    }),
    /** Competencia AAAA-MM; obrigatoria para recorrencias. */
    referencePeriod: varchar('reference_period', { length: 7 }),
    descriptionSnapshot: varchar('description_snapshot', { length: 255 }).notNull(),
    amount: money('amount').notNull(),
    dueDate: date('due_date', { mode: 'string' }).notNull(),
    /** PENDING | OVERDUE | PAID | CANCELED | REVERSED */
    status: varchar('status', { length: 16 }).notNull().default('PENDING'),
    paidAt: ts('paid_at'),
    canceledAt: ts('canceled_at'),
    cancellationReason: varchar('cancellation_reason', { length: 500 }),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    // Impede mensalidade duplicada da mesma competencia.
    uniqueIndex('receivables_subscription_period_unique').on(
      table.subscriptionId,
      table.referencePeriod,
    ),
    index('receivables_status_due_idx').on(table.status, table.dueDate),
    index('receivables_lead_idx').on(table.leadId, table.status),
    index('receivables_sale_idx').on(table.saleId),
  ],
);

export const payments = mysqlTable(
  'payments',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    receivableId: varchar('receivable_id', { length: 26 })
      .notNull()
      .references(() => receivables.id, { onDelete: 'restrict' }),
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),
    amount: money('amount').notNull(),
    /** Data civil do recebimento; define o periodo da receita realizada. */
    paymentDate: date('payment_date', { mode: 'string' }).notNull(),
    /** CONFIRMED | REVERSAL */
    status: varchar('status', { length: 16 }).notNull().default('CONFIRMED'),
    /** Preenchido quando este registro estorna outro pagamento. */
    reversalOfId: varchar('reversal_of_id', { length: 26 }),
    reason: varchar('reason', { length: 500 }),
    // 191: mesma razao da coluna homonima em lead_events -- chave composta,
    // nao a chave bruta (ver finance/service.ts, ":payment:<receivableId>").
    idempotencyKey: varchar('idempotency_key', { length: 191 }),
    createdBy: varchar('created_by', { length: 26 }),
    createdAt: ts('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('payments_workspace_idempotency_unique').on(table.workspaceId, table.idempotencyKey),
    index('payments_receivable_idx').on(table.receivableId),
    index('payments_date_idx').on(table.paymentDate, table.status),
    index('payments_lead_idx').on(table.leadId),
  ],
);

export const goals = mysqlTable(
  'goals',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    /**
     * De quem e a meta. Nulo = meta da empresa inteira; preenchido = meta
     * individual, medida so nos leads dessa pessoa.
     */
    userId: varchar('user_id', { length: 26 }).references(() => users.id, {
      onDelete: 'cascade',
    }),
    /** LEADS_PROSPECTED | FIRST_CONTACTS | SALES_COUNT | REALIZED_REVENUE */
    metricType: varchar('metric_type', { length: 24 }).notNull(),
    /** DAILY | WEEKLY | MONTHLY */
    periodType: varchar('period_type', { length: 12 }).notNull(),
    targetValue: money('target_value').notNull(),
    startsOn: date('starts_on', { mode: 'string' }).notNull(),
    endsOn: date('ends_on', { mode: 'string' }),
    active: boolean('active').notNull().default(true),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    index('goals_active_idx').on(table.active, table.metricType, table.periodType),
    index('goals_user_idx').on(table.userId),
  ],
);

// ---------------------------------------------------------------------------
// Importacao
// ---------------------------------------------------------------------------

export const importJobs = mysqlTable(
  'import_jobs',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    originalFilename: varchar('original_filename', { length: 255 }).notNull(),
    sourceId: varchar('source_id', { length: 26 }),
    serviceId: varchar('service_id', { length: 26 }),
    /** PENDING | COMPLETED | FAILED */
    status: varchar('status', { length: 16 }).notNull().default('PENDING'),
    idempotencyKey: varchar('idempotency_key', { length: 80 }),
    totalRows: int('total_rows').notNull().default(0),
    importedRows: int('imported_rows').notNull().default(0),
    duplicateRows: int('duplicate_rows').notNull().default(0),
    probableDuplicateRows: int('probable_duplicate_rows').notNull().default(0),
    incompleteRows: int('incomplete_rows').notNull().default(0),
    invalidRows: int('invalid_rows').notNull().default(0),
    emptyRows: int('empty_rows').notNull().default(0),
    createdAt: ts('created_at').notNull(),
    completedAt: ts('completed_at'),
  },
  (table) => [
    uniqueIndex('import_jobs_workspace_idempotency_unique').on(table.workspaceId, table.idempotencyKey),
    index('import_jobs_created_idx').on(table.createdAt),
  ],
);

export const importRows = mysqlTable(
  'import_rows',
  {
    id: id().primaryKey(),
    importJobId: varchar('import_job_id', { length: 26 })
      .notNull()
      .references(() => importJobs.id, { onDelete: 'cascade' }),
    rowNumber: int('row_number').notNull(),
    /** IMPORTED | DUPLICATE | PROBABLE_DUPLICATE | INCOMPLETE | INVALID | EMPTY */
    status: varchar('status', { length: 24 }).notNull(),
    leadId: varchar('lead_id', { length: 26 }),
    duplicateLeadId: varchar('duplicate_lead_id', { length: 26 }),
    validationErrors: json('validation_errors'),
    /** Resumo do que casou na deduplicacao (tipo de chave, sem dado bruto). */
    normalizedMatchSummary: varchar('normalized_match_summary', { length: 255 }),
    /** Valores normalizados da linha, usados na revisao de campos vazios. */
    normalizedValues: json('normalized_values'),
    createdAt: ts('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('import_rows_job_row_unique').on(table.importJobId, table.rowNumber),
    index('import_rows_status_idx').on(table.importJobId, table.status),
  ],
);

// ---------------------------------------------------------------------------
// Google
// ---------------------------------------------------------------------------

export const googleApiUsage = mysqlTable(
  'google_api_usage',
  {
    id: id().primaryKey(),
    /** Competencia AAAA-MM no fuso operacional. */
    billingMonth: varchar('billing_month', { length: 7 }).notNull(),
    /** TEXT_SEARCH | PLACE_DETAILS */
    skuType: varchar('sku_type', { length: 24 }).notNull(),
    requestCount: int('request_count').notNull().default(0),
    /** NONE | WARNED | BLOCKED */
    warningState: varchar('warning_state', { length: 12 }).notNull().default('NONE'),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [uniqueIndex('google_api_usage_unique').on(table.billingMonth, table.skuType)],
);

/**
 * Metadados proprios da pesquisa. NAO armazena o conteudo dos resultados
 * retornados pelo Google.
 */
export const searchRuns = mysqlTable(
  'search_runs',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    queryText: varchar('query_text', { length: 255 }).notNull(),
    niche: varchar('niche', { length: 120 }),
    country: varchar('country', { length: 80 }),
    state: varchar('state', { length: 80 }),
    city: varchar('city', { length: 120 }),
    regionOrNeighborhood: varchar('region_or_neighborhood', { length: 120 }),
    selectedServiceId: varchar('selected_service_id', { length: 26 }),
    websiteFilter: varchar('website_filter', { length: 24 }),
    pagesRequested: int('pages_requested').notNull().default(0),
    resultCount: int('result_count').notNull().default(0),
    createdAt: ts('created_at').notNull(),
  },
  (table) => [index('search_runs_created_idx').on(table.createdAt)],
);

// ---------------------------------------------------------------------------
// Reunioes
// ---------------------------------------------------------------------------

export const meetings = mysqlTable(
  'meetings',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    /**
     * Toda reuniao pertence a exatamente um lead.
     *
     * RESTRICT, nunca CASCADE: apagar um lead nao pode levar a agenda junto
     * sem que alguem decida o que fazer com as reunioes futuras.
     */
    leadId: varchar('lead_id', { length: 26 })
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),
    title: varchar('title', { length: 160 }).notNull(),
    agenda: text('agenda'),
    /** Preparacao interna: nunca sai da plataforma autenticada. */
    internalNotes: text('internal_notes'),
    serviceId: varchar('service_id', { length: 26 }).references(() => services.id, {
      onDelete: 'set null',
    }),
    /** Instantes SEMPRE em UTC; a exibicao converte para o fuso do negocio. */
    startAt: ts('start_at').notNull(),
    endAt: ts('end_at').notNull(),
    /** Fuso em que a reuniao foi marcada, para exibir o rotulo correto. */
    timezone: varchar('timezone', { length: 64 }).notNull().default('America/Sao_Paulo'),
    /** Link ja normalizado pelo dominio; nunca o texto cru digitado. */
    meetUrl: varchar('meet_url', { length: 500 }).notNull(),
    /** SCHEDULED | COMPLETED | CANCELED | NO_SHOW */
    status: varchar('status', { length: 16 }).notNull().default('SCHEDULED'),
    outcome: text('outcome'),
    cancelReason: varchar('cancel_reason', { length: 500 }),
    completedAt: ts('completed_at'),
    canceledAt: ts('canceled_at'),
    noShowAt: ts('no_show_at'),
    createdBy: varchar('created_by', { length: 26 }).notNull(),
    /**
     * Concorrencia otimista. Sobe a cada alteracao; salvar com versao antiga
     * devolve 409 em vez de sobrescrever o trabalho de outra aba.
     */
    version: int('version').notNull().default(1),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    // Proximas reunioes de um lead (card e drawer).
    index('meetings_lead_idx').on(table.leadId, table.status, table.startAt),
    // Janela do calendario e deteccao de conflito.
    index('meetings_window_idx').on(table.status, table.startAt, table.endAt),
    index('meetings_start_idx').on(table.startAt),
  ],
);

export const meetingReminders = mysqlTable(
  'meeting_reminders',
  {
    id: id().primaryKey(),
    meetingId: varchar('meeting_id', { length: 26 })
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    /** Minutos antes do inicio: 1440 = 24h, 60 = 1h. */
    offsetMinutes: int('offset_minutes').notNull(),
    remindAt: ts('remind_at').notNull(),
    /** PENDING | READ | DISMISSED | CANCELED */
    status: varchar('status', { length: 16 }).notNull().default('PENDING'),
    readAt: ts('read_at'),
    dismissedAt: ts('dismissed_at'),
    canceledAt: ts('canceled_at'),
    /**
     * Versao da reuniao que gerou este lembrete.
     *
     * Reagendar cria lembretes de uma versao nova e cancela os antigos; sem
     * este carimbo, um aviso do horario velho continuaria elegivel.
     */
    meetingVersion: int('meeting_version').notNull(),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    // Varredura dos lembretes vencidos.
    index('meeting_reminders_due_idx').on(table.status, table.remindAt),
    index('meeting_reminders_meeting_idx').on(table.meetingId, table.status),
    // Um lembrete por reuniao/versao/antecedencia: reenviar a mesma
    // requisicao nao pode gerar dois avisos iguais.
    uniqueIndex('meeting_reminders_unique').on(
      table.meetingId,
      table.meetingVersion,
      table.offsetMinutes,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Sites com IA
// ---------------------------------------------------------------------------

/**
 * Projeto de site demonstrativo.
 *
 * O vinculo com o lead e OPCIONAL e `set null`: um projeto pode nascer avulso
 * e ser vinculado depois, e excluir um lead nao pode apagar em silencio o
 * historico de custo pago a uma API. O projeto orfao aparece na listagem do
 * modulo com o nome do negocio que ele mesmo guarda.
 */
export const siteProjects = mysqlTable(
  'site_projects',
  {
    id: id().primaryKey(),
    workspaceId: varchar('workspace_id', { length: 26 })
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    leadId: varchar('lead_id', { length: 26 }).references(() => leads.id, {
      onDelete: 'set null',
    }),
    ownerUserId: varchar('owner_user_id', { length: 26 })
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Rotulo interno na listagem; o cliente nunca ve. */
    internalName: varchar('internal_name', { length: 160 }).notNull(),
    /** Nome do negocio que aparece no site. Copiado, nunca referenciado. */
    businessName: varchar('business_name', { length: 160 }).notNull(),
    /** ONE_PAGE | LANDING -- ver src/shared/site-ai.ts */
    siteType: varchar('site_type', { length: 16 }).notNull(),
    /** BRIEFING | QUEUED | GENERATING | READY | PUBLISHED | FAILED | ARCHIVED */
    status: varchar('status', { length: 16 }).notNull().default('BRIEFING'),
    /** Slug pretendido antes da primeira publicacao. */
    desiredSlug: varchar('desired_slug', { length: 60 }),
    /**
     * Briefing e SiteSchema do rascunho.
     *
     * JSON porque a forma evolui por `schema_version`, nao por migracao: um
     * site gerado no schema 1 continua renderizavel depois do schema 2.
     */
    draftConfig: json('draft_config'),
    schemaVersion: varchar('schema_version', { length: 16 }).notNull().default('1.0.0'),
    rendererVersion: varchar('renderer_version', { length: 16 }).notNull().default('1.0.0'),
    promptVersion: varchar('prompt_version', { length: 16 }).notNull().default('1.0.0'),
    /**
     * Semente criativa persistente.
     *
     * Garante que o mesmo projeto seja reproduzivel e que dois negocios do
     * mesmo nicho nao caiam na mesma combinacao por acaso.
     */
    creativeSeed: varchar('creative_seed', { length: 32 }).notNull(),
    /** Assinatura de variantes/paleta/tipografia, para detectar repeticao. */
    designFingerprint: varchar('design_fingerprint', { length: 64 }),
    currentVersionNumber: int('current_version_number').notNull().default(0),
    activePublicationId: varchar('active_publication_id', { length: 26 }),
    /** Concorrencia otimista do editor: salvar com versao antiga da 409. */
    lockVersion: int('lock_version').notNull().default(1),
    /** Soma do que ja foi gasto com este projeto. Nunca float. */
    costAccumulatedUsd: decimal('cost_accumulated_usd', { precision: 12, scale: 6 })
      .notNull()
      .default('0'),
    /** Teto proprio deste projeto; abaixo dele o job nem chama o provider. */
    budgetLimitUsd: decimal('budget_limit_usd', { precision: 12, scale: 6 }),
    lastFailureCode: varchar('last_failure_code', { length: 64 }),
    lastFailureMessage: varchar('last_failure_message', { length: 500 }),
    createdBy: varchar('created_by', { length: 26 }).notNull(),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
    archivedAt: ts('archived_at'),
    deletedAt: ts('deleted_at'),
  },
  (table) => [
    index('site_projects_lead_idx').on(table.leadId, table.status),
    index('site_projects_status_idx').on(table.status, table.updatedAt),
    index('site_projects_owner_idx').on(table.ownerUserId),
    index('site_projects_updated_idx').on(table.updatedAt),
  ],
);

/**
 * Versao imutavel do config. Nunca sofre UPDATE.
 *
 * E o que permite desfazer, restaurar e publicar um snapshot que nao muda
 * quando o rascunho muda.
 */
export const siteProjectVersions = mysqlTable(
  'site_project_versions',
  {
    id: id().primaryKey(),
    projectId: varchar('project_id', { length: 26 })
      .notNull()
      .references(() => siteProjects.id, { onDelete: 'cascade' }),
    versionNumber: int('version_number').notNull(),
    config: json('config').notNull(),
    schemaVersion: varchar('schema_version', { length: 16 }).notNull(),
    rendererVersion: varchar('renderer_version', { length: 16 }).notNull(),
    promptVersion: varchar('prompt_version', { length: 16 }).notNull(),
    /** GENERATION | MANUAL | AI_PATCH | RESTORE | PUBLICATION */
    origin: varchar('origin', { length: 16 }).notNull(),
    summary: varchar('summary', { length: 300 }),
    /** SHA-256 do config canonico: detecta corrupcao e evita versao duplicada. */
    checksum: varchar('checksum', { length: 64 }).notNull(),
    createdBy: varchar('created_by', { length: 26 }),
    createdAt: ts('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('site_versions_number_unique').on(table.projectId, table.versionNumber),
    index('site_versions_project_idx').on(table.projectId, table.createdAt),
  ],
);

/**
 * Fila persistente em MySQL. Sem Redis e sem processo extra, como a
 * hospedagem exige.
 *
 * O job sobrevive a reload da pagina e a restart do processo: o estado mora
 * aqui, nunca na conexao aberta do navegador.
 */
export const siteGenerationJobs = mysqlTable(
  'site_generation_jobs',
  {
    id: id().primaryKey(),
    projectId: varchar('project_id', { length: 26 })
      .notNull()
      .references(() => siteProjects.id, { onDelete: 'cascade' }),
    /** INITIAL_GENERATION | SECTION_PATCH | ... -- ver src/shared/site-ai.ts */
    type: varchar('type', { length: 24 }).notNull(),
    /**
     * Chave de idempotencia.
     *
     * E o que impede o clique duplo de virar duas chamadas pagas: a segunda
     * insercao colide no indice unico e devolve o job que ja existe.
     */
    idempotencyKey: varchar('idempotency_key', { length: 120 }).notNull(),
    /** PENDING | RUNNING | SUCCEEDED | FAILED | CANCELED */
    status: varchar('status', { length: 16 }).notNull().default('PENDING'),
    stage: varchar('stage', { length: 32 }),
    /** Derivado da etapa concluida. Nunca um timer fingindo movimento. */
    progress: smallint('progress').notNull().default(0),
    provider: varchar('provider', { length: 24 }),
    model: varchar('model', { length: 80 }),
    /** Hash da entrada: retry identico pode reaproveitar resultado. */
    inputHash: varchar('input_hash', { length: 64 }),
    attempt: int('attempt').notNull().default(0),
    maxAttempts: int('max_attempts').notNull().default(2),
    priority: smallint('priority').notNull().default(0),
    /**
     * Posse do job por um worker.
     *
     * Sem lease, um processo derrubado no meio deixaria o job RUNNING para
     * sempre e o usuario olhando uma barra que nunca anda.
     */
    leaseOwner: varchar('lease_owner', { length: 64 }),
    leaseExpiresAt: ts('lease_expires_at'),
    cancelRequestedAt: ts('cancel_requested_at'),
    startedAt: ts('started_at'),
    finishedAt: ts('finished_at'),
    /** Codigo estavel e mensagem em portugues ja sanitizada. Nunca stack. */
    errorCode: varchar('error_code', { length: 64 }),
    errorMessage: varchar('error_message', { length: 500 }),
    errorRetryable: boolean('error_retryable'),
    resultRef: varchar('result_ref', { length: 26 }),
    createdBy: varchar('created_by', { length: 26 }).notNull(),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('site_jobs_idempotency_unique').on(table.idempotencyKey),
    // Indice de claim: o worker busca por status + prioridade + idade.
    index('site_jobs_claim_idx').on(table.status, table.priority, table.createdAt),
    index('site_jobs_project_idx').on(table.projectId, table.status),
    // Recuperacao de lease expirado no boot e no heartbeat.
    index('site_jobs_lease_idx').on(table.status, table.leaseExpiresAt),
  ],
);

/** Trilha append-only das etapas reais. Alimenta o SSE e o historico. */
export const siteGenerationEvents = mysqlTable(
  'site_generation_events',
  {
    id: id().primaryKey(),
    jobId: varchar('job_id', { length: 26 })
      .notNull()
      .references(() => siteGenerationJobs.id, { onDelete: 'cascade' }),
    /** Ordem estavel: o SSE reconecta com `last-event-id` e continua daqui. */
    sequence: int('sequence').notNull(),
    /** STAGE_STARTED | STAGE_COMPLETED | WARNING | FAILED | COMPLETED */
    eventType: varchar('event_type', { length: 24 }).notNull(),
    stage: varchar('stage', { length: 32 }),
    /** Texto que o usuario le. Ja em portugues, ja sanitizado. */
    message: varchar('message', { length: 300 }).notNull(),
    metadata: json('metadata'),
    createdAt: ts('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('site_events_sequence_unique').on(table.jobId, table.sequence),
    index('site_events_job_idx').on(table.jobId, table.createdAt),
  ],
);

/**
 * Arquivos do projeto, com proveniencia e direitos.
 *
 * `rightsStatus` e `expiresAt` existem porque nem tudo que pode ser exibido
 * temporariamente pode ser redistribuido dentro de um ZIP entregue ao cliente.
 */
export const siteAssets = mysqlTable(
  'site_assets',
  {
    id: id().primaryKey(),
    projectId: varchar('project_id', { length: 26 })
      .notNull()
      .references(() => siteProjects.id, { onDelete: 'cascade' }),
    /** UPLOAD | AI_GENERATED | CRM | EXTERNAL_REFERENCE */
    source: varchar('source', { length: 24 }).notNull(),
    provider: varchar('provider', { length: 24 }),
    providerModel: varchar('provider_model', { length: 80 }),
    /** Caminho no storage. Gerado pelo sistema, nunca vindo do nome enviado. */
    storageKey: varchar('storage_key', { length: 255 }).notNull(),
    originalFilename: varchar('original_filename', { length: 255 }),
    /** MIME detectado por magic bytes, nunca pela extensao. */
    mimeType: varchar('mime_type', { length: 80 }).notNull(),
    width: int('width'),
    height: int('height'),
    sizeBytes: int('size_bytes').notNull(),
    checksum: varchar('checksum', { length: 64 }).notNull(),
    altText: varchar('alt_text', { length: 300 }),
    focalX: decimal('focal_x', { precision: 5, scale: 4 }),
    focalY: decimal('focal_y', { precision: 5, scale: 4 }),
    transforms: json('transforms'),
    /** OWNED | LICENSED | AI_GENERATED | TEMPORARY | UNKNOWN */
    rightsStatus: varchar('rights_status', { length: 16 }).notNull().default('UNKNOWN'),
    attribution: json('attribution'),
    externalRef: varchar('external_ref', { length: 255 }),
    /** Uso temporario permitido: depois disto o asset nao pode ser exportado. */
    expiresAt: ts('expires_at'),
    createdBy: varchar('created_by', { length: 26 }).notNull(),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
    deletedAt: ts('deleted_at'),
  },
  (table) => [
    index('site_assets_project_idx').on(table.projectId, table.deletedAt),
    index('site_assets_checksum_idx').on(table.projectId, table.checksum),
  ],
);

/**
 * Publicacao: snapshot imutavel de uma versao, servido em uma URL publica.
 *
 * Editar o rascunho nao mexe no que esta no ar. Publicar de novo cria outra
 * linha e troca o ponteiro; se a nova falhar, a anterior continua ACTIVE.
 */
export const sitePublications = mysqlTable(
  'site_publications',
  {
    id: id().primaryKey(),
    projectId: varchar('project_id', { length: 26 })
      .notNull()
      .references(() => siteProjects.id, { onDelete: 'cascade' }),
    /**
     * Versao congelada nesta publicacao.
     *
     * A coluna se chama `version_id`, e nao `project_version_id`, porque o
     * nome da chave estrangeira derivado do nome longo batia nos 64 caracteres
     * que o MySQL aceita -- o mesmo teto que ja quebrou uma migracao aqui.
     *
     * RESTRICT: nao se apaga uma versao que esta no ar.
     */
    versionId: varchar('version_id', { length: 26 })
      .notNull()
      .references(() => siteProjectVersions.id, { onDelete: 'restrict' }),
    publicationNumber: int('publication_number').notNull(),
    slug: varchar('slug', { length: 60 }).notNull(),
    /** BUILDING | ACTIVE | SUPERSEDED | FAILED | UNPUBLISHED */
    status: varchar('status', { length: 16 }).notNull().default('BUILDING'),
    artifactKey: varchar('artifact_key', { length: 255 }),
    manifest: json('manifest'),
    artifactChecksum: varchar('artifact_checksum', { length: 64 }),
    /** Base usada no momento da publicacao, para reproduzir o link exato. */
    baseUrlSnapshot: varchar('base_url_snapshot', { length: 255 }),
    /** Demonstracao publica sempre com noindex. Tecnico, invisivel na pagina. */
    noindex: boolean('noindex').notNull().default(true),
    /** Resultado do smoke anonimo: sem ele o link nao e liberado. */
    smokeTestResult: json('smoke_test_result'),
    smokeTestPassedAt: ts('smoke_test_passed_at'),
    failureCode: varchar('failure_code', { length: 64 }),
    failureMessage: varchar('failure_message', { length: 500 }),
    publishedBy: varchar('published_by', { length: 26 }).notNull(),
    publishedAt: ts('published_at'),
    supersededAt: ts('superseded_at'),
    unpublishedAt: ts('unpublished_at'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('site_publications_number_unique').on(table.projectId, table.publicationNumber),
    index('site_publications_project_idx').on(table.projectId, table.status),
    // Resolucao da rota publica: /p/:slug -> publicacao ativa.
    index('site_publications_slug_idx').on(table.slug, table.status),
  ],
);

/**
 * Consumo de IA, append-only.
 *
 * Custo e parte do produto, nao log opcional. Estimado e registrado ficam em
 * colunas separadas de proposito: prometer um numero exato antes da chamada
 * seria mentira, e apagar a diferenca depois esconderia o erro da estimativa.
 */
export const siteAiUsage = mysqlTable(
  'site_ai_usage',
  {
    id: id().primaryKey(),
    projectId: varchar('project_id', { length: 26 }).references(() => siteProjects.id, {
      onDelete: 'set null',
    }),
    jobId: varchar('job_id', { length: 26 }),
    provider: varchar('provider', { length: 24 }).notNull(),
    /** GENERATE_PLAN | PATCH_SECTION | REVISE_COPY | OUTREACH | IMAGE | REVIEW */
    operation: varchar('operation', { length: 32 }).notNull(),
    model: varchar('model', { length: 80 }).notNull(),
    providerRequestId: varchar('provider_request_id', { length: 120 }),
    inputTokens: int('input_tokens').notNull().default(0),
    cacheCreationTokens: int('cache_creation_tokens').notNull().default(0),
    cacheReadTokens: int('cache_read_tokens').notNull().default(0),
    outputTokens: int('output_tokens').notNull().default(0),
    imageCount: int('image_count').notNull().default(0),
    imageSize: varchar('image_size', { length: 16 }),
    imageQuality: varchar('image_quality', { length: 16 }),
    costEstimatedUsd: decimal('cost_estimated_usd', { precision: 12, scale: 6 }),
    costActualUsd: decimal('cost_actual_usd', { precision: 12, scale: 6 }),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    /** De qual tabela de precos saiu a conta, para auditar depois. */
    pricingVersion: varchar('pricing_version', { length: 32 }),
    /** SUCCESS | FAILED | BLOCKED_BY_BUDGET */
    status: varchar('status', { length: 24 }).notNull(),
    latencyMs: int('latency_ms'),
    /**
     * Diagnostico da chamada (so metadados, nunca conteudo). Nulos em
     * registros anteriores a observabilidade e em operacoes sem IA de texto.
     */
    /** end_turn | max_tokens | refusal | ... -- por que o modelo parou. */
    stopReason: varchar('stop_reason', { length: 40 }),
    effort: varchar('effort', { length: 12 }),
    promptVersion: varchar('prompt_version', { length: 32 }),
    schemaVersion: varchar('schema_version', { length: 32 }),
    /** Chamadas feitas dentro da operacao (1 = sem reparo). */
    attempts: int('attempts'),
    /** Tipos dos blocos devolvidos, na ordem: "thinking,text". */
    contentBlocks: varchar('content_blocks', { length: 200 }),
    outputBytes: int('output_bytes'),
    /** Problemas de validacao encontrados na saida (0 = valida de primeira). */
    validationIssues: int('validation_issues'),
    errorCode: varchar('error_code', { length: 40 }),
    createdAt: ts('created_at').notNull(),
  },
  (table) => [
    index('site_usage_project_idx').on(table.projectId, table.createdAt),
    index('site_usage_job_idx').on(table.jobId),
    // Somatorio do orcamento mensal.
    index('site_usage_created_idx').on(table.createdAt),
  ],
);

/**
 * Mensagem de abordagem no WhatsApp.
 *
 * `openedAt` e `confirmedSentAt` sao campos diferentes de proposito: abrir o
 * `wa.me` nao prova que a mensagem foi enviada. So a confirmacao humana vira
 * evento de contato no CRM.
 */
export const siteOutreachMessages = mysqlTable(
  'site_outreach_messages',
  {
    id: id().primaryKey(),
    projectId: varchar('project_id', { length: 26 })
      .notNull()
      .references(() => siteProjects.id, { onDelete: 'cascade' }),
    publicationId: varchar('publication_id', { length: 26 }),
    leadId: varchar('lead_id', { length: 26 }).references(() => leads.id, {
      onDelete: 'set null',
    }),
    /** Numero no formato E.164 no momento do envio. Copia, nao referencia. */
    phoneSnapshot: varchar('phone_snapshot', { length: 24 }),
    messageText: text('message_text').notNull(),
    generatedByModel: varchar('generated_by_model', { length: 80 }),
    /** Foi editada a mao depois de gerada? Muda o que o historico significa. */
    editedByUser: boolean('edited_by_user').notNull().default(false),
    openedAt: ts('opened_at'),
    confirmedSentAt: ts('confirmed_sent_at'),
    createdBy: varchar('created_by', { length: 26 }).notNull(),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    index('site_outreach_project_idx').on(table.projectId, table.createdAt),
    index('site_outreach_lead_idx').on(table.leadId),
  ],
);

// ---------------------------------------------------------------------------
// Tipos inferidos
// ---------------------------------------------------------------------------
// Garimpoo: ferramenta publica de busca de leads, vendida junto da comunidade
// ---------------------------------------------------------------------------

/**
 * Quem pagou e pode usar o Garimpoo.
 *
 * Uma pessoa entra aqui pelo webhook da Cakto (compra aprovada) e sai por
 * reembolso, chargeback ou cancelamento de assinatura. O acesso NUNCA e
 * criado a mao pela tela: sem registro de pagamento, nao existe membro.
 *
 * `email` e a identidade -- e o mesmo campo que a Cakto envia e o unico que a
 * pessoa sabe de cor na hora de ativar.
 */
export const garimpooMembers = mysqlTable(
  'garimpoo_members',
  {
    id: id().primaryKey(),
    email: varchar('email', { length: 254 }).notNull(),
    name: varchar('name', { length: 160 }),
    /** Telefone como veio da Cakto; serve para achar a pessoa no WhatsApp. */
    phone: varchar('phone', { length: 32 }),
    /** PENDING (comprou, ainda nao ativou) | ACTIVE | REVOKED */
    status: varchar('status', { length: 16 }).notNull().default('PENDING'),
    /** CAKTO | MANUAL -- manual so para cortesia, sempre com motivo no log. */
    source: varchar('source', { length: 16 }).notNull().default('CAKTO'),
    /** Ultimo pedido aprovado. E o que a pessoa digita para provar a compra. */
    lastOrderId: varchar('last_order_id', { length: 120 }),
    caktoCustomerId: varchar('cakto_customer_id', { length: 120 }),
    /** Hash scrypt, no mesmo formato do CRM. Nulo ate a ativacao. */
    passwordHash: varchar('password_hash', { length: 255 }),
    /** Limite diario proprio; nulo usa o padrao do ambiente. */
    dailySearchLimit: int('daily_search_limit'),
    purchasedAt: ts('purchased_at'),
    activatedAt: ts('activated_at'),
    lastLoginAt: ts('last_login_at'),
    revokedAt: ts('revoked_at'),
    /** REFUND | CHARGEBACK | SUBSCRIPTION_CANCELED | MANUAL | ABUSE */
    revokedReason: varchar('revoked_reason', { length: 32 }),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('garimpoo_members_email_unique').on(table.email),
    index('garimpoo_members_status_idx').on(table.status),
  ],
);

/**
 * Sessao presa a UM dispositivo.
 *
 * Duas travas contra compartilhamento de senha:
 *  - `deviceId` vem de um cookie longo emitido na primeira visita. A sessao so
 *    vale naquele navegador; colar o cookie de sessao em outro nao funciona;
 *  - sessao unica: entrar em outro lugar revoga a anterior (`NEW_LOGIN`).
 *    Quem dividiu a senha vai se derrubar mutuamente, e isso e o ponto.
 *
 * O IP fica gravado como SINAL, nunca como tranca: internet movel troca de IP
 * o tempo todo e operadora compartilha IP entre milhares de clientes.
 */
export const garimpooSessions = mysqlTable(
  'garimpoo_sessions',
  {
    id: id().primaryKey(),
    memberId: varchar('member_id', { length: 26 })
      .notNull()
      .references(() => garimpooMembers.id, { onDelete: 'cascade' }),
    /** Somente o hash do token; o valor bruto vive no cookie. */
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    deviceId: varchar('device_id', { length: 64 }).notNull(),
    deviceLabel: varchar('device_label', { length: 120 }),
    ipHash: varchar('ip_hash', { length: 64 }),
    createdAt: ts('created_at').notNull(),
    lastSeenAt: ts('last_seen_at').notNull(),
    expiresAt: ts('expires_at').notNull(),
    revokedAt: ts('revoked_at'),
    /** NEW_LOGIN | LOGOUT | REVOKED_MEMBER | DEVICE_MISMATCH | EXPIRED */
    revokedReason: varchar('revoked_reason', { length: 32 }),
  },
  (table) => [
    uniqueIndex('garimpoo_sessions_token_unique').on(table.tokenHash),
    index('garimpoo_sessions_member_idx').on(table.memberId, table.revokedAt),
  ],
);

/**
 * Uma linha por busca feita.
 *
 * Sustenta o limite diario por pessoa -- sem ele, um membro sozinho queima a
 * cota paga do Google de todo mundo -- e mostra uso estranho (mesma conta
 * buscando de tres cidades distantes no mesmo dia).
 */
export const garimpooSearchLog = mysqlTable(
  'garimpoo_search_log',
  {
    id: id().primaryKey(),
    memberId: varchar('member_id', { length: 26 })
      .notNull()
      .references(() => garimpooMembers.id, { onDelete: 'cascade' }),
    niche: varchar('niche', { length: 120 }).notNull(),
    city: varchar('city', { length: 120 }),
    state: varchar('state', { length: 80 }),
    resultCount: int('result_count').notNull().default(0),
    /** Pagina 1 gasta cota; paginas seguintes tambem, e isso fica registrado. */
    pageNumber: int('page_number').notNull().default(1),
    ipHash: varchar('ip_hash', { length: 64 }),
    createdAt: ts('created_at').notNull(),
  },
  (table) => [index('garimpoo_search_member_idx').on(table.memberId, table.createdAt)],
);

/**
 * Eventos recebidos da Cakto.
 *
 * Guardados ANTES de agir e com id unico: a plataforma pode reenviar o mesmo
 * evento, e conceder acesso duas vezes ou revogar por engano seria pior do
 * que demorar. O corpo bruto nao e salvo -- ele tem dado pessoal do comprador
 * que a ferramenta nao precisa guardar.
 */
export const garimpooWebhookEvents = mysqlTable(
  'garimpoo_webhook_events',
  {
    id: id().primaryKey(),
    provider: varchar('provider', { length: 16 }).notNull().default('CAKTO'),
    /** Id do evento na origem; e a chave de idempotencia. */
    externalId: varchar('external_id', { length: 160 }).notNull(),
    eventType: varchar('event_type', { length: 60 }).notNull(),
    orderId: varchar('order_id', { length: 120 }),
    email: varchar('email', { length: 254 }),
    /** APPLIED | IGNORED | FAILED */
    status: varchar('status', { length: 16 }).notNull(),
    /** O que o evento causou, em uma frase, para auditar depois. */
    outcome: varchar('outcome', { length: 255 }),
    receivedAt: ts('received_at').notNull(),
  },
  (table) => [
    uniqueIndex('garimpoo_webhook_external_unique').on(table.provider, table.externalId),
    index('garimpoo_webhook_email_idx').on(table.email),
  ],
);

// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type AuthSession = typeof authSessions.$inferSelect;
export type Stage = typeof stages.$inferSelect;
export type LeadSource = typeof leadSources.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type LeadContact = typeof leadContacts.$inferSelect;
export type LeadLink = typeof leadLinks.$inferSelect;
export type LeadEvent = typeof leadEvents.$inferSelect;
export type StageHistoryRow = typeof stageHistory.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type FollowUp = typeof followUps.$inferSelect;
export type LossReason = typeof lossReasons.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Receivable = typeof receivables.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type ImportJob = typeof importJobs.$inferSelect;
export type ImportRow = typeof importRows.$inferSelect;
export type DuplicateReview = typeof duplicateReviews.$inferSelect;
export type GoogleApiUsage = typeof googleApiUsage.$inferSelect;
export type SearchRun = typeof searchRuns.$inferSelect;
export type LeadServiceInterest = typeof leadServiceInterests.$inferSelect;
export type LeadIdentityKey = typeof leadIdentityKeys.$inferSelect;
export type AuditLogRow = typeof auditLog.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type MeetingReminder = typeof meetingReminders.$inferSelect;
export type SiteProject = typeof siteProjects.$inferSelect;
export type SiteProjectVersion = typeof siteProjectVersions.$inferSelect;
export type SiteGenerationJob = typeof siteGenerationJobs.$inferSelect;
export type SiteGenerationEvent = typeof siteGenerationEvents.$inferSelect;
export type SiteAsset = typeof siteAssets.$inferSelect;
export type SitePublication = typeof sitePublications.$inferSelect;
export type SiteAiUsageRow = typeof siteAiUsage.$inferSelect;
export type SiteOutreachMessage = typeof siteOutreachMessages.$inferSelect;
export type GarimpooMember = typeof garimpooMembers.$inferSelect;
export type GarimpooSession = typeof garimpooSessions.$inferSelect;
export type GarimpooSearchLogRow = typeof garimpooSearchLog.$inferSelect;
export type GarimpooWebhookEvent = typeof garimpooWebhookEvents.$inferSelect;
