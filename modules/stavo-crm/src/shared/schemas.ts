/**
 * Contratos Zod compartilhados entre cliente e servidor.
 * O servidor valida no boundary; o cliente reaproveita nos formularios.
 */
import { MEETING_LIMITS, MEETING_STATUSES, parseMeetUrl } from './meetings';
import { USER_ROLES } from './roles';
import {
  MOTION_LEVELS,
  SITE_PROJECT_STATUSES,
  SITE_TYPES,
  SLUG_MAX_LENGTH,
  SLUG_MIN_LENGTH,
  validateSlug,
} from '@site-kit/types/site-ai';
import { z } from 'zod';

import {
  ACTIVITY_TYPES,
  APP_TIMEZONE,
  BILLING_TYPES,
  CONTACT_TYPES,
  DUPLICATE_REVIEW_STATUSES,
  GOAL_METRIC_TYPES,
  GOAL_PERIOD_TYPES,
  IMPORT_FIELDS,
  LINK_TYPES,
  ORIGIN_TYPES,
  RECEIVABLE_STATUSES,
  STAGE_SEMANTIC_KEYS,
  SUBSCRIPTION_STATUSES,
  WEBSITE_FILTERS,
} from './constants';

// ---------------------------------------------------------------------------
// Primitivos
// ---------------------------------------------------------------------------

/** Identificadores sao ULID-like: 26 chars base32 maiusculo. */
export const idSchema = z.string().min(1).max(40);

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe o e-mail.')
  .max(254, 'E-mail muito longo.')
  .email('E-mail invalido.')
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(12, 'A senha deve ter pelo menos 12 caracteres.')
  .max(200, 'A senha deve ter no maximo 200 caracteres.');

/** Dinheiro trafega como string decimal para preservar precisao. */
export const moneySchema = z
  .string()
  .trim()
  .regex(/^-?\d{1,10}(\.\d{1,2})?$/, 'Valor monetario invalido.');

export const optionalMoneySchema = z
  .union([moneySchema, z.literal(''), z.null()])
  .optional()
  .transform((value) => (value === '' || value === null ? null : (value ?? null)));

/** Data no formato YYYY-MM-DD, interpretada no fuso de Sao Paulo. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida. Use o formato AAAA-MM-DD.');

export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const referencePeriodSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Competencia invalida. Use o formato AAAA-MM.');

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Cor invalida. Use o formato #RRGGBB.');

export const idempotencyKeySchema = z.string().trim().min(8).max(80);

const trimmedText = (max: number) => z.string().trim().max(max);

/** Campo de texto opcional: '' e tratado como ausente. */
export const optionalText = (max: number) =>
  z
    .union([trimmedText(max), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined) return null;
      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    });

export const urlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      const parsed = new URL(value.includes('://') ? value : `https://${value}`);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Endereco de site invalido.');

export const optionalUrlSchema = z
  .union([urlSchema, z.literal(''), z.null()])
  .optional()
  .transform((value) => (value === '' || value === null ? null : (value ?? null)));

// ---------------------------------------------------------------------------
// Paginacao e periodo
// ---------------------------------------------------------------------------

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const PERIOD_PRESETS = [
  'TODAY',
  'YESTERDAY',
  'THIS_WEEK',
  'LAST_7_DAYS',
  'THIS_MONTH',
  'LAST_30_DAYS',
  'LAST_MONTH',
  'THIS_YEAR',
  'ALL_TIME',
  'CUSTOM',
] as const;
export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  TODAY: 'Hoje',
  YESTERDAY: 'Ontem',
  THIS_WEEK: 'Esta semana',
  LAST_7_DAYS: 'Ultimos 7 dias',
  THIS_MONTH: 'Este mes',
  LAST_30_DAYS: 'Ultimos 30 dias',
  LAST_MONTH: 'Mes passado',
  THIS_YEAR: 'Este ano',
  ALL_TIME: 'Todo o periodo',
  CUSTOM: 'Periodo personalizado',
};

export const periodQuerySchema = z
  .object({
    preset: z.enum(PERIOD_PRESETS).default('TODAY'),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .refine((value) => value.preset !== 'CUSTOM' || (Boolean(value.from) && Boolean(value.to)), {
    message: 'Informe a data inicial e final do periodo personalizado.',
    path: ['from'],
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: 'A data inicial deve ser anterior a data final.',
    path: ['from'],
  });
export type PeriodQuery = z.infer<typeof periodQuerySchema>;

// ---------------------------------------------------------------------------
// Autenticacao
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha.').max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.').max(200),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'A confirmacao nao corresponde a nova senha.',
    path: ['confirmPassword'],
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    message: 'A nova senha precisa ser diferente da atual.',
    path: ['newPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ---------------------------------------------------------------------------
// Etapas, origens e motivos de perda
// ---------------------------------------------------------------------------

export const createStageSchema = z.object({
  name: trimmedText(60).min(1, 'Informe o nome da etapa.'),
  color: hexColorSchema.default('#64748b'),
  semanticKey: z.enum(STAGE_SEMANTIC_KEYS).default('AUXILIARY'),
});
export type CreateStageInput = z.infer<typeof createStageSchema>;

export const updateStageSchema = z.object({
  name: trimmedText(60).min(1, 'Informe o nome da etapa.').optional(),
  color: hexColorSchema.optional(),
  active: z.boolean().optional(),
});
export type UpdateStageInput = z.infer<typeof updateStageSchema>;

export const reorderStagesSchema = z.object({
  orderedIds: z.array(idSchema).min(1, 'Informe a nova ordem das etapas.'),
});

export const deleteStageSchema = z.object({
  destinationStageId: idSchema,
});

export const createSourceSchema = z.object({
  name: trimmedText(60).min(1, 'Informe o nome da origem.'),
});
export type CreateSourceInput = z.infer<typeof createSourceSchema>;

export const updateSourceSchema = z.object({
  name: trimmedText(60).min(1, 'Informe o nome da origem.').optional(),
  active: z.boolean().optional(),
});

export const createLossReasonSchema = z.object({
  name: trimmedText(80).min(1, 'Informe o motivo.'),
});

export const updateLossReasonSchema = z.object({
  name: trimmedText(80).min(1, 'Informe o motivo.').optional(),
  active: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Servicos
// ---------------------------------------------------------------------------

export const createServiceSchema = z.object({
  name: trimmedText(120).min(1, 'Informe o nome do servico.'),
  description: optionalText(1000),
  billingType: z.enum(BILLING_TYPES),
  defaultPrice: moneySchema,
});
export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = z.object({
  name: trimmedText(120).min(1, 'Informe o nome do servico.').optional(),
  description: optionalText(1000),
  billingType: z.enum(BILLING_TYPES).optional(),
  defaultPrice: moneySchema.optional(),
  active: z.boolean().optional(),
});
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export const leadContactInputSchema = z.object({
  type: z.enum(CONTACT_TYPES),
  value: trimmedText(160).min(1, 'Informe o contato.'),
  isPrimary: z.boolean().default(false),
});
export type LeadContactInput = z.infer<typeof leadContactInputSchema>;

export const leadLinkInputSchema = z.object({
  type: z.enum(LINK_TYPES),
  url: trimmedText(2048).min(1, 'Informe o link.'),
  isPrimary: z.boolean().default(false),
});
export type LeadLinkInput = z.infer<typeof leadLinkInputSchema>;

export const createLeadSchema = z.object({
  internalName: trimmedText(160).min(1, 'Informe o nome interno do lead.'),
  originType: z.enum(ORIGIN_TYPES).default('MANUAL'),
  sourceId: idSchema.optional().nullable(),
  placeId: optionalText(255),
  niche: optionalText(120),
  country: optionalText(80),
  state: optionalText(80),
  city: optionalText(120),
  address: optionalText(255),
  campaignContext: optionalText(255),
  notes: optionalText(4000),
  contacts: z.array(leadContactInputSchema).max(20).default([]),
  links: z.array(leadLinkInputSchema).max(20).default([]),
  serviceId: idSchema.optional().nullable(),
  proposedPrice: optionalMoneySchema,
  nextFollowUpAt: isoDateSchema.optional().nullable(),
  /** Confirmacao explicita quando o usuario decidiu que sao leads diferentes. */
  allowSharedIdentity: z.boolean().default(false),
  sharedIdentityReason: optionalText(255),
  idempotencyKey: idempotencyKeySchema.optional(),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z.object({
  internalName: trimmedText(160).min(1, 'Informe o nome interno do lead.').optional(),
  sourceId: idSchema.optional().nullable(),
  niche: optionalText(120),
  country: optionalText(80),
  state: optionalText(80),
  city: optionalText(120),
  address: optionalText(255),
  campaignContext: optionalText(255),
});
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const leadFiltersSchema = z.object({
  search: optionalText(120),
  stageId: idSchema.optional(),
  sourceId: idSchema.optional(),
  serviceId: idSchema.optional(),
  city: optionalText(120),
  niche: optionalText(120),
  originType: z.enum(ORIGIN_TYPES).optional(),
  followUpStatus: z.enum(['ANY', 'OVERDUE', 'TODAY', 'UPCOMING', 'NONE']).optional(),
  financialStatus: z.enum(['ANY', 'PENDING', 'OVERDUE', 'PAID', 'NONE']).optional(),
  completeness: z.enum(['ANY', 'COMPLETE', 'INCOMPLETE', 'CRITICAL']).optional(),
  archived: z.enum(['EXCLUDE', 'INCLUDE', 'ONLY']).default('EXCLUDE'),
  createdFrom: isoDateSchema.optional(),
  createdTo: isoDateSchema.optional(),
});
export type LeadFilters = z.infer<typeof leadFiltersSchema>;

// ---------------------------------------------------------------------------
// Equipe e propriedade do lead
// ---------------------------------------------------------------------------

export const transferLeadSchema = z.object({
  /** null devolve o lead ao pote comum, sem dono. */
  ownerUserId: z.string().length(26).nullable(),
});
export type TransferLeadInput = z.infer<typeof transferLeadSchema>;

// As mensagens vao para debaixo do campo na tela, entao sao escritas para
// quem esta preenchendo -- nao para quem escreveu o codigo.
export const createTeamMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe o nome da pessoa.')
    .max(120, 'O nome deve ter no maximo 120 caracteres.'),
  email: z
    .string()
    .trim()
    .email('Informe um e-mail valido.')
    .max(254, 'O e-mail deve ter no maximo 254 caracteres.'),
  role: z.enum(USER_ROLES),
  /** Senha inicial; a pessoa troca depois em Configuracoes. */
  password: z
    .string()
    .min(12, 'A senha deve ter pelo menos 12 caracteres.')
    .max(200, 'A senha deve ter no maximo 200 caracteres.'),
});
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;

export const updateTeamMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe o nome da pessoa.')
    .max(120, 'O nome deve ter no maximo 120 caracteres.')
    .optional(),
  role: z.enum(USER_ROLES).optional(),
  active: z.boolean().optional(),
});
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;

export const resetTeamMemberPasswordSchema = z.object({
  password: z
    .string()
    .min(12, 'A senha deve ter pelo menos 12 caracteres.')
    .max(200, 'A senha deve ter no maximo 200 caracteres.'),
});

// ---------------------------------------------------------------------------
// Movimentacao de etapa
// ---------------------------------------------------------------------------

export const saleItemInputSchema = z.object({
  serviceId: idSchema,
  unitPrice: moneySchema,
  quantity: z.coerce.number().int().min(1).max(999).default(1),
});
export type SaleItemInput = z.infer<typeof saleItemInputSchema>;

export const saleDetailsSchema = z.object({
  items: z.array(saleItemInputSchema).min(1, 'Selecione pelo menos um servico.'),
  agreedAt: isoDateSchema,
  dueDate: isoDateSchema,
  notes: optionalText(1000),
  /** Quando verdadeiro, o recebivel nasce quitado junto com o pagamento. */
  paidNow: z.boolean().default(false),
  paymentDate: isoDateSchema.optional().nullable(),
});
export type SaleDetailsInput = z.infer<typeof saleDetailsSchema>;

export const lossDetailsSchema = z.object({
  lossReasonId: idSchema,
  note: optionalText(1000),
  followUpAt: isoDateSchema.optional().nullable(),
});
export type LossDetailsInput = z.infer<typeof lossDetailsSchema>;

export const negotiationDetailsSchema = z.object({
  interests: z
    .array(
      z.object({
        serviceId: idSchema,
        proposedPrice: moneySchema,
        notes: optionalText(500),
      }),
    )
    .min(1, 'Selecione pelo menos um servico.'),
  notes: optionalText(1000),
});
export type NegotiationDetailsInput = z.infer<typeof negotiationDetailsSchema>;

export const wonDetailsSchema = z.object({
  /** Recebivel ja existente a confirmar; ausente cria venda direta. */
  receivableId: idSchema.optional().nullable(),
  paymentDate: isoDateSchema,
  amount: moneySchema.optional().nullable(),
  sale: saleDetailsSchema.optional().nullable(),
});
export type WonDetailsInput = z.infer<typeof wonDetailsSchema>;

export const moveLeadSchema = z.object({
  destinationStageId: idSchema,
  expectedCurrentStageId: idSchema,
  idempotencyKey: idempotencyKeySchema,
  negotiation: negotiationDetailsSchema.optional().nullable(),
  sale: saleDetailsSchema.optional().nullable(),
  loss: lossDetailsSchema.optional().nullable(),
  won: wonDetailsSchema.optional().nullable(),
});
export type MoveLeadInput = z.infer<typeof moveLeadSchema>;

// ---------------------------------------------------------------------------
// Atividades e follow-ups
// ---------------------------------------------------------------------------

export const createActivitySchema = z.object({
  activityType: z.enum(ACTIVITY_TYPES),
  body: optionalText(4000),
  occurredAt: isoDateTimeSchema.optional(),
  /** Agenda o proximo follow-up junto com a atividade. */
  nextFollowUpAt: isoDateSchema.optional().nullable(),
  idempotencyKey: idempotencyKeySchema.optional(),
});
export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = z.object({
  body: trimmedText(4000).min(1, 'A anotacao nao pode ficar vazia.'),
});

export const createFollowUpSchema = z.object({
  dueAt: isoDateSchema,
  note: optionalText(1000),
});
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;

export const completeFollowUpSchema = z.object({
  note: optionalText(1000),
  /** Agenda o proximo follow-up ao concluir o atual. */
  nextDueAt: isoDateSchema.optional().nullable(),
  idempotencyKey: idempotencyKeySchema.optional(),
});

// ---------------------------------------------------------------------------
// Contatos e links confirmados
// ---------------------------------------------------------------------------

export const confirmContactSchema = z.object({
  type: z.enum(CONTACT_TYPES),
  value: trimmedText(160).min(1, 'Informe o contato.'),
  isPrimary: z.boolean().default(false),
});

export const confirmLinkSchema = z.object({
  type: z.enum(LINK_TYPES),
  url: trimmedText(2048).min(1, 'Informe o link.'),
  isPrimary: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Google Places
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Garimpoo (ferramenta publica de busca)
// ---------------------------------------------------------------------------

export const garimpooActivateSchema = z.object({
  email: emailSchema,
  /** Numero do pedido da Cakto. E a prova de compra na ativacao. */
  orderId: trimmedText(120).min(3, 'Informe o numero do pedido.'),
  password: passwordSchema,
});
export type GarimpooActivateInput = z.infer<typeof garimpooActivateSchema>;

export const garimpooLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha.').max(200),
});

/**
 * Busca do Garimpoo: um recorte do formulario do CRM.
 *
 * Sem `serviceId` nem `searchRunId` de proposito -- os dois sao conceitos do
 * CRM, e a ferramenta publica nao conhece servico nem lead.
 */
export const garimpooSearchSchema = z.object({
  niche: trimmedText(120).min(2, 'Informe o nicho ou profissao.'),
  state: optionalText(80),
  city: optionalText(120),
  websiteFilter: z.enum(WEBSITE_FILTERS).default('ALL'),
  requirePhone: z.boolean().default(true),
  pageToken: optionalText(4000),
});
export type GarimpooSearchInput = z.infer<typeof garimpooSearchSchema>;

export const googleSearchSchema = z.object({
  niche: trimmedText(120).min(2, 'Informe o nicho ou profissao.'),
  country: trimmedText(80).default('Brasil'),
  state: optionalText(80),
  city: optionalText(120),
  region: optionalText(120),
  websiteFilter: z.enum(WEBSITE_FILTERS).default('ALL'),
  requirePhone: z.boolean().default(true),
  serviceId: idSchema.optional().nullable(),
  /** Token de pagina devolvido pela busca anterior; ausente inicia a pesquisa. */
  pageToken: optionalText(4000),
  searchRunId: idSchema.optional().nullable(),
});
export type GoogleSearchInput = z.infer<typeof googleSearchSchema>;

export const addGooglePlaceSchema = z.object({
  placeId: trimmedText(255).min(1, 'Identificador do local ausente.'),
  internalName: trimmedText(160).min(1, 'Informe o nome interno do lead.'),
  serviceId: idSchema.optional().nullable(),
  niche: optionalText(120),
  country: optionalText(80),
  state: optionalText(80),
  city: optionalText(120),
  region: optionalText(120),
  searchRunId: idSchema.optional().nullable(),
  idempotencyKey: idempotencyKeySchema.optional(),
  /**
   * Confirmacao explicita, no momento de adicionar, do que ja apareceu no
   * card de pesquisa (mesma consulta ao Google, sem chamada nova). Vazio por
   * padrao: so entra se o usuario marcar a caixa -- nunca automatico.
   */
  confirmedPhoneE164: z.string().trim().max(24).nullable().optional(),
  confirmedWebsiteUrl: z.string().trim().max(2048).nullable().optional(),
});
export type AddGooglePlaceInput = z.infer<typeof addGooglePlaceSchema>;

export const findInstagramSchema = z.object({
  websiteUrl: urlSchema,
});

// ---------------------------------------------------------------------------
// Importacao
// ---------------------------------------------------------------------------

export const importMappingSchema = z.object({
  /** Indice da coluna da planilha para cada campo mapeado. */
  columns: z.record(z.enum(IMPORT_FIELDS), z.number().int().min(0)).default({}),
  hasHeader: z.boolean().default(true),
  sheetName: optionalText(120),
  sourceId: idSchema.optional().nullable(),
  serviceId: idSchema.optional().nullable(),
});
export type ImportMapping = z.infer<typeof importMappingSchema>;

export const importPreviewSchema = z.object({
  uploadId: idSchema,
  mapping: importMappingSchema,
});

export const importConfirmSchema = z.object({
  uploadId: idSchema,
  mapping: importMappingSchema,
  idempotencyKey: idempotencyKeySchema,
});

export const importFillEmptySchema = z.object({
  /** Somente campos hoje vazios podem ser preenchidos, um a um. */
  fields: z
    .array(
      z.object({
        rowId: idSchema,
        field: z.enum(IMPORT_FIELDS),
      }),
    )
    .min(1, 'Selecione pelo menos um campo para preencher.'),
});

// ---------------------------------------------------------------------------
// Financeiro
// ---------------------------------------------------------------------------

export const confirmPaymentSchema = z.object({
  paymentDate: isoDateSchema,
  amount: moneySchema.optional().nullable(),
  note: optionalText(500),
  idempotencyKey: idempotencyKeySchema,
});
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;

export const reversePaymentSchema = z.object({
  reason: trimmedText(500).min(3, 'Informe o motivo do estorno.'),
  idempotencyKey: idempotencyKeySchema,
});

export const cancelReceivableSchema = z.object({
  reason: trimmedText(500).min(3, 'Informe o motivo do cancelamento.'),
});

export const cancelSaleSchema = z.object({
  reason: trimmedText(500).min(3, 'Informe o motivo do cancelamento.'),
  receivableAction: z.enum(['KEEP_PENDING', 'CANCEL']).default('CANCEL'),
});

export const cancelSubscriptionSchema = z.object({
  canceledAt: isoDateSchema,
  reason: trimmedText(500).min(3, 'Informe o motivo do cancelamento.'),
  openReceivableAction: z.enum(['KEEP_PENDING', 'CANCEL']).default('KEEP_PENDING'),
});
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;

export const changeSubscriptionSchema = z.object({
  newAmount: moneySchema,
  effectiveFrom: referencePeriodSchema,
  reason: optionalText(500),
});

export const receivableFiltersSchema = z.object({
  status: z.enum(RECEIVABLE_STATUSES).optional(),
  leadId: idSchema.optional(),
  serviceId: idSchema.optional(),
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
});

export const subscriptionFiltersSchema = z.object({
  status: z.enum(SUBSCRIPTION_STATUSES).optional(),
  leadId: idSchema.optional(),
});

// ---------------------------------------------------------------------------
// Metas
// ---------------------------------------------------------------------------

export const createGoalSchema = z.object({
  /** Nulo ou ausente = meta da empresa; um id = meta individual do vendedor. */
  userId: z.string().length(26).optional().nullable(),
  metricType: z.enum(GOAL_METRIC_TYPES),
  periodType: z.enum(GOAL_PERIOD_TYPES),
  targetValue: moneySchema,
  startsOn: isoDateSchema,
  endsOn: isoDateSchema.optional().nullable(),
});
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  targetValue: moneySchema.optional(),
  endsOn: isoDateSchema.optional().nullable(),
  active: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Duplicidade
// ---------------------------------------------------------------------------

export const resolveDuplicateSchema = z.object({
  decision: z.enum(['SAME', 'DIFFERENT', 'DISMISS']),
  reason: optionalText(500),
});
export type ResolveDuplicateInput = z.infer<typeof resolveDuplicateSchema>;

export const duplicateFiltersSchema = z.object({
  status: z.enum(DUPLICATE_REVIEW_STATUSES).default('PENDING'),
});

// ---------------------------------------------------------------------------
// Configuracoes
// ---------------------------------------------------------------------------

export const appSettingsSchema = z.object({
  appName: trimmedText(60).min(1, 'Informe o nome exibido.').optional(),
  stalledNegotiationDays: z.coerce.number().int().min(1).max(365).optional(),
  stalledSelectedDays: z.coerce.number().int().min(1).max(365).optional(),
  dashboardDefaultPeriod: z.enum(PERIOD_PRESETS).optional(),
  searchRequirePhoneByDefault: z.boolean().optional(),
  googleTextSearchLimit: z.coerce.number().int().min(0).max(100000).optional(),
  googleDetailsLimit: z.coerce.number().int().min(0).max(100000).optional(),
  googleWarningPercent: z.coerce.number().int().min(1).max(100).optional(),
});
export type AppSettingsInput = z.infer<typeof appSettingsSchema>;

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const dashboardFiltersSchema = z.object({
  preset: z.enum(PERIOD_PRESETS).default('TODAY'),
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  sourceId: idSchema.optional(),
  serviceId: idSchema.optional(),
  niche: optionalText(120),
  city: optionalText(120),
});
export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;

// ---------------------------------------------------------------------------
// Reunioes
// ---------------------------------------------------------------------------

/**
 * O link e validado pela MESMA funcao de dominio usada pelo formulario, para
 * que a tela nunca aceite algo que a API vai recusar.
 */
const meetUrlSchema = z
  .string()
  .trim()
  .max(MEETING_LIMITS.meetUrl, 'O link e longo demais.')
  .superRefine((valor, ctx) => {
    const resultado = parseMeetUrl(valor);
    if (!resultado.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: resultado.reason });
    }
  })
  // Guarda a forma normalizada: sem fragmento, sem espaco sobrando.
  .transform((valor) => {
    const resultado = parseMeetUrl(valor);
    return resultado.ok ? resultado.url : valor;
  });

/** Instante ISO 8601 com fuso explicito (Z ou offset). */
const instantSchema = z
  .string()
  .datetime({ offset: true, message: 'Informe a data e o horario da reuniao.' });

const reminderOffsetsSchema = z
  .array(z.number().int().min(1).max(20160))
  .max(6, 'Escolha no maximo 6 lembretes.')
  .optional();

export const createMeetingSchema = z
  .object({
    leadId: z.string().length(26, 'Selecione um cliente do CRM.'),
    title: z
      .string()
      .trim()
      .min(3, 'Informe o titulo da reuniao.')
      .max(MEETING_LIMITS.title, 'O titulo e longo demais.'),
    agenda: z.string().trim().max(MEETING_LIMITS.agenda).nullish(),
    internalNotes: z.string().trim().max(MEETING_LIMITS.internalNotes).nullish(),
    serviceId: z.string().length(26).nullish(),
    startAt: instantSchema,
    endAt: instantSchema,
    timezone: z.string().trim().min(1).max(64).default(APP_TIMEZONE),
    meetUrl: meetUrlSchema,
    reminderOffsetsMinutes: reminderOffsetsSchema,
    idempotencyKey: idempotencyKeySchema,
  })
  .refine((valor) => new Date(valor.endAt) > new Date(valor.startAt), {
    message: 'O horario final deve ser posterior ao horario inicial.',
    path: ['endAt'],
  });
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

/**
 * Edicao de conteudo. Data e horario NAO entram aqui de proposito: mudar o
 * horario e reagendamento, e reagendar precisa registrar o antes/depois.
 */
export const updateMeetingSchema = z.object({
  title: z.string().trim().min(3).max(MEETING_LIMITS.title).optional(),
  agenda: z.string().trim().max(MEETING_LIMITS.agenda).nullish(),
  internalNotes: z.string().trim().max(MEETING_LIMITS.internalNotes).nullish(),
  serviceId: z.string().length(26).nullish(),
  meetUrl: meetUrlSchema.optional(),
  expectedVersion: z.number().int().min(1),
  idempotencyKey: idempotencyKeySchema,
});
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;

export const rescheduleMeetingSchema = z
  .object({
    startAt: instantSchema,
    endAt: instantSchema,
    /** Ausente mantem o link atual, que ja passou pela validacao. */
    meetUrl: meetUrlSchema.optional(),
    reminderOffsetsMinutes: reminderOffsetsSchema,
    expectedVersion: z.number().int().min(1),
    idempotencyKey: idempotencyKeySchema,
  })
  .refine((valor) => new Date(valor.endAt) > new Date(valor.startAt), {
    message: 'O horario final deve ser posterior ao horario inicial.',
    path: ['endAt'],
  });
export type RescheduleMeetingInput = z.infer<typeof rescheduleMeetingSchema>;

export const cancelMeetingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Diga em poucas palavras por que a reuniao foi cancelada.')
    .max(MEETING_LIMITS.cancelReason),
  expectedVersion: z.number().int().min(1),
  idempotencyKey: idempotencyKeySchema,
});
export type CancelMeetingInput = z.infer<typeof cancelMeetingSchema>;

export const completeMeetingSchema = z.object({
  outcome: z.string().trim().max(MEETING_LIMITS.outcome).nullish(),
  expectedVersion: z.number().int().min(1),
  idempotencyKey: idempotencyKeySchema,
});
export type CompleteMeetingInput = z.infer<typeof completeMeetingSchema>;

export const noShowMeetingSchema = z.object({
  note: z.string().trim().max(MEETING_LIMITS.outcome).nullish(),
  expectedVersion: z.number().int().min(1),
  idempotencyKey: idempotencyKeySchema,
});
export type NoShowMeetingInput = z.infer<typeof noShowMeetingSchema>;

/** Janela consultada pelo calendario. O intervalo maximo e imposto na rota. */
export const meetingRangeSchema = z.object({
  start: instantSchema,
  end: instantSchema,
  status: z.enum(MEETING_STATUSES).optional(),
  leadId: z.string().length(26).optional(),
  search: z.string().trim().max(120).optional(),
});
export type MeetingRangeInput = z.infer<typeof meetingRangeSchema>;

// ---------------------------------------------------------------------------
// Sites com IA
// ---------------------------------------------------------------------------

/**
 * Etapa 1 do briefing (secao 7.1): negocio e objetivo.
 *
 * Campos de contato ficam como STRING SIMPLES aqui -- e um formulario, nao o
 * SiteSchema. `briefingToProviderInput` (worker) e quem embrulha o que o
 * administrador confirmou no formato `{value, source, confirmedAt}` que o
 * assembler exige para tratar como fato.
 */
export const siteBriefingBusinessSchema = z.object({
  name: z.string().trim().min(2).max(160),
  niche: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(80).optional(),
  serviceArea: z.string().trim().max(200).optional(),
  audience: z.string().trim().max(600).optional(),
  description: z.string().trim().max(600).optional(),
  services: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        description: z.string().trim().max(300).optional(),
      }),
    )
    .max(20)
    .default([]),
  differentials: z.array(z.string().trim().max(300)).max(10).default([]),
  phoneE164: z.string().trim().max(24).optional(),
  whatsappE164: z.string().trim().max(24).optional(),
  email: z.string().trim().email().max(254).optional(),
  address: z.string().trim().max(255).optional(),
  instagramUrl: z.string().trim().url().max(2048).optional(),
  websiteUrl: z.string().trim().url().max(2048).optional(),
  googleMapsUrl: z.string().trim().url().max(2048).optional(),
});
export type SiteBriefingBusiness = z.infer<typeof siteBriefingBusinessSchema>;

/** Etapa 2 (secao 7.2): tipo e direcao visual. Etapa 3 (secao 7.3): instrucoes. */
export const siteBriefingSchema = z.object({
  business: siteBriefingBusinessSchema,
  objective: z.object({
    goal: z.enum([
      'WHATSAPP_CONVERSATIONS',
      'QUOTE_REQUESTS',
      'APPOINTMENTS',
      'AUTHORITY',
      'OFFER_INTEREST',
      'CUSTOM',
    ]),
    customGoal: z.string().trim().max(200).optional(),
  }),
  style: z.object({
    theme: z.enum(['LIGHT', 'DARK', 'MIXED', 'AI_DECIDES']),
    keywords: z.array(z.string().trim().max(40)).max(6).default([]),
    primaryColor: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional(),
    accentColor: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional(),
    density: z.enum(['AIRY', 'BALANCED', 'COMPACT']),
    motionLevel: z.enum(MOTION_LEVELS),
  }),
  freeformInstructions: z.string().trim().max(4000).optional(),
  requiredSections: z.array(z.string().trim().max(30)).max(10).default([]),
  forbiddenSections: z.array(z.string().trim().max(30)).max(10).default([]),
});
export type SiteBriefingInput = z.infer<typeof siteBriefingSchema>;

/**
 * Criacao de projeto.
 *
 * `leadId` nulo e um caso legitimo, nao um esquecimento: o projeto avulso e
 * previsto e pode ser vinculado a um lead depois.
 */
export const createSiteProjectSchema = z.object({
  leadId: z.string().length(26).nullish(),
  internalName: z.string().trim().max(160).optional(),
  businessName: z
    .string()
    .trim()
    .min(2, 'Informe o nome do negocio.')
    .max(160, 'O nome do negocio pode ter no maximo 160 caracteres.'),
  siteType: z.enum(SITE_TYPES),
  desiredSlug: z.string().trim().max(60).nullish(),
  /** O briefing completo dos 3 passos do assistente. */
  briefing: siteBriefingSchema.optional(),
});
export type CreateSiteProjectInput = z.infer<typeof createSiteProjectSchema>;

export const updateSiteProjectSchema = z.object({
  internalName: z.string().trim().min(1).max(160).optional(),
  businessName: z.string().trim().min(2).max(160).optional(),
  siteType: z.enum(SITE_TYPES).optional(),
  desiredSlug: z.string().trim().max(60).nullish(),
  /** Concorrencia otimista do editor: sem isto, duas abas se sobrescrevem. */
  expectedLockVersion: z.number().int().min(1),
});
export type UpdateSiteProjectInput = z.infer<typeof updateSiteProjectSchema>;

export const siteProjectListSchema = z.object({
  status: z.enum(SITE_PROJECT_STATUSES).optional(),
  leadId: z.string().length(26).optional(),
  search: z.string().trim().max(120).optional(),
  includeArchived: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});
export type SiteProjectListInput = z.infer<typeof siteProjectListSchema>;

/** Disparo da geracao. A chave de idempotencia impede o clique duplo pago. */
export const generateSiteSchema = z.object({
  idempotencyKey: idempotencyKeySchema.optional(),
});
export type GenerateSiteInput = z.infer<typeof generateSiteSchema>;

/**
 * Slug pedido pelo usuario.
 *
 * A mensagem cita explicitamente as palavras proibidas porque o motivo nao e
 * obvio: o link vai para o cliente e nao pode denunciar que e uma amostra.
 */
export const siteSlugSchema = z
  .string()
  .trim()
  .min(SLUG_MIN_LENGTH)
  .max(SLUG_MAX_LENGTH)
  .refine((value) => validateSlug(value).ok, {
    message:
      'Endereco invalido. Use apenas letras, numeros e hifens, e evite palavras como ' +
      '"demo" ou "preview".',
  });
