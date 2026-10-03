/**
 * Constantes compartilhadas entre servidor e cliente.
 * Nao contem segredo, chave, credencial ou valor de ambiente.
 */

export const APP_TIMEZONE = 'America/Sao_Paulo';
export const CURRENCY = 'BRL';
export const LOCALE = 'pt-BR';

/** Significado interno de cada etapa; sobrevive a renomeacao pelo usuario. */
export const STAGE_SEMANTIC_KEYS = [
  'SELECTED',
  'FIRST_CONTACT',
  'FOLLOW_UP',
  'REPLIED',
  'NEGOTIATION',
  'AWAITING_PAYMENT',
  'WON',
  'LOST',
  'AUXILIARY',
] as const;
export type StageSemanticKey = (typeof STAGE_SEMANTIC_KEYS)[number];

/** Etapas principais existem uma unica vez; AUXILIARY pode se repetir. */
export const PRINCIPAL_SEMANTIC_KEYS = STAGE_SEMANTIC_KEYS.filter(
  (key) => key !== 'AUXILIARY',
) as readonly Exclude<StageSemanticKey, 'AUXILIARY'>[];

export const STAGE_MEANINGS: Record<StageSemanticKey, string> = {
  SELECTED: 'Lead escolhido para prospeccao, ainda sem nenhuma abordagem feita.',
  FIRST_CONTACT: 'A primeira abordagem ja foi enviada. O retorno pode estar pendente.',
  FOLLOW_UP: 'Lead que precisa de novas tentativas ou de um retorno agendado.',
  REPLIED: 'O lead respondeu pelo menos uma vez a abordagem.',
  NEGOTIATION: 'Proposta e valores estao sendo discutidos.',
  AWAITING_PAYMENT: 'Existe um valor combinado a receber que ainda nao foi confirmado.',
  WON: 'Venda concluida com recebimento confirmado.',
  LOST: 'Lead recusado ou perdido, com motivo registrado.',
  AUXILIARY: 'Etapa de organizacao propria. Nao alimenta metricas principais sozinha.',
};

export const ORIGIN_TYPES = ['GOOGLE_PLACE', 'IMPORTED', 'MANUAL'] as const;
export type OriginType = (typeof ORIGIN_TYPES)[number];

export const ORIGIN_TYPE_LABELS: Record<OriginType, string> = {
  GOOGLE_PLACE: 'Google Maps',
  IMPORTED: 'Importado',
  MANUAL: 'Manual',
};

export const CONTACT_TYPES = ['PHONE', 'WHATSAPP', 'EMAIL', 'OTHER'] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  PHONE: 'Telefone',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  OTHER: 'Outro',
};

export const LINK_TYPES = [
  'WEBSITE',
  'DEMO_OR_PROPOSAL',
  'INSTAGRAM',
  'FACEBOOK',
  'WHATSAPP',
  'MAPS',
  'DIRECTORY',
  'LINK_IN_BIO',
  'OTHER',
] as const;
export type LinkType = (typeof LINK_TYPES)[number];

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  WEBSITE: 'Site',
  DEMO_OR_PROPOSAL: 'Demonstracao ou proposta',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  WHATSAPP: 'WhatsApp',
  MAPS: 'Google Maps',
  DIRECTORY: 'Diretorio',
  LINK_IN_BIO: 'Pagina de links',
  OTHER: 'Outro',
};

export const DATA_ORIGINS = ['MANUAL', 'IMPORT', 'USER_CONFIRMED'] as const;
export type DataOrigin = (typeof DATA_ORIGINS)[number];

export const BILLING_TYPES = ['ONE_TIME', 'RECURRING_MONTHLY'] as const;
export type BillingType = (typeof BILLING_TYPES)[number];

export const BILLING_TYPE_LABELS: Record<BillingType, string> = {
  ONE_TIME: 'Pagamento unico',
  RECURRING_MONTHLY: 'Recorrente mensal',
};

export const ACTIVITY_TYPES = [
  'NOTE',
  'CALL',
  'WHATSAPP_ATTEMPT',
  'CONTACT_ATTEMPT',
  'MEETING',
  'OTHER',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  NOTE: 'Anotacao',
  CALL: 'Ligacao',
  WHATSAPP_ATTEMPT: 'Tentativa por WhatsApp',
  CONTACT_ATTEMPT: 'Tentativa de contato',
  MEETING: 'Reuniao',
  OTHER: 'Outro',
};

/** Tipos de atividade que representam uma tentativa de contato com o lead. */
export const CONTACT_ATTEMPT_ACTIVITY_TYPES: readonly ActivityType[] = [
  'CALL',
  'WHATSAPP_ATTEMPT',
  'CONTACT_ATTEMPT',
  'MEETING',
];

export const LEAD_EVENT_TYPES = [
  'LEAD_CREATED',
  'LEAD_ARCHIVED',
  'LEAD_TRANSFERRED',
  'MEETING_SCHEDULED',
  'MEETING_UPDATED',
  'MEETING_RESCHEDULED',
  'MEETING_CANCELED',
  'MEETING_COMPLETED',
  'MEETING_NO_SHOW',
  'LEAD_RESTORED',
  'STAGE_MOVED',
  'FIRST_CONTACT_RECORDED',
  'CONTACT_ATTEMPT_RECORDED',
  'FOLLOW_UP_SCHEDULED',
  'FOLLOW_UP_COMPLETED',
  'FIRST_RESPONSE_RECORDED',
  'NEGOTIATION_STARTED',
  'LOSS_RECORDED',
  'AWAITING_PAYMENT_RECORDED',
  'SALE_RECORDED',
  'SALE_REVERSED',
  'RECEIVABLE_GENERATED',
  'PAYMENT_RECEIVED',
  'PAYMENT_REVERSED',
  'SUBSCRIPTION_STARTED',
  'SUBSCRIPTION_CHANGED',
  'SUBSCRIPTION_CANCELED',
  'DATA_CONFIRMED',
  'IMPORT_COMPLETED',
] as const;
export type LeadEventType = (typeof LEAD_EVENT_TYPES)[number];

export const LEAD_EVENT_LABELS: Record<LeadEventType, string> = {
  LEAD_CREATED: 'Lead criado',
  LEAD_ARCHIVED: 'Lead arquivado',
  LEAD_TRANSFERRED: 'Lead transferido',
  MEETING_SCHEDULED: 'Reuniao agendada',
  MEETING_UPDATED: 'Reuniao editada',
  MEETING_RESCHEDULED: 'Reuniao reagendada',
  MEETING_CANCELED: 'Reuniao cancelada',
  MEETING_COMPLETED: 'Reuniao concluida',
  MEETING_NO_SHOW: 'Cliente nao compareceu',
  LEAD_RESTORED: 'Lead restaurado',
  STAGE_MOVED: 'Etapa alterada',
  FIRST_CONTACT_RECORDED: 'Primeiro contato registrado',
  CONTACT_ATTEMPT_RECORDED: 'Tentativa de contato registrada',
  FOLLOW_UP_SCHEDULED: 'Follow-up agendado',
  FOLLOW_UP_COMPLETED: 'Follow-up concluido',
  FIRST_RESPONSE_RECORDED: 'Primeira resposta registrada',
  NEGOTIATION_STARTED: 'Negociacao iniciada',
  LOSS_RECORDED: 'Perda registrada',
  AWAITING_PAYMENT_RECORDED: 'Aguardando pagamento registrado',
  SALE_RECORDED: 'Venda registrada',
  SALE_REVERSED: 'Venda revertida',
  RECEIVABLE_GENERATED: 'Cobranca gerada',
  PAYMENT_RECEIVED: 'Pagamento recebido',
  PAYMENT_REVERSED: 'Pagamento estornado',
  SUBSCRIPTION_STARTED: 'Recorrencia iniciada',
  SUBSCRIPTION_CHANGED: 'Recorrencia alterada',
  SUBSCRIPTION_CANCELED: 'Recorrencia cancelada',
  DATA_CONFIRMED: 'Dado confirmado pelo usuario',
  IMPORT_COMPLETED: 'Importacao concluida',
};

export const RECEIVABLE_STATUSES = ['PENDING', 'OVERDUE', 'PAID', 'CANCELED', 'REVERSED'] as const;
export type ReceivableStatus = (typeof RECEIVABLE_STATUSES)[number];

export const RECEIVABLE_STATUS_LABELS: Record<ReceivableStatus, string> = {
  PENDING: 'Pendente',
  OVERDUE: 'Vencido',
  PAID: 'Recebido',
  CANCELED: 'Cancelado',
  REVERSED: 'Estornado',
};

export const SALE_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELED', 'REVERSED'] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  PENDING: 'Aguardando pagamento',
  CONFIRMED: 'Confirmada',
  CANCELED: 'Cancelada',
  REVERSED: 'Estornada',
};

export const SUBSCRIPTION_STATUSES = ['ACTIVE', 'PAUSED', 'CANCELED'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  CANCELED: 'Cancelada',
};

export const GOAL_METRIC_TYPES = [
  'LEADS_PROSPECTED',
  'FIRST_CONTACTS',
  'SALES_COUNT',
  'REALIZED_REVENUE',
] as const;
export type GoalMetricType = (typeof GOAL_METRIC_TYPES)[number];

export const GOAL_METRIC_LABELS: Record<GoalMetricType, string> = {
  LEADS_PROSPECTED: 'Leads prospectados',
  FIRST_CONTACTS: 'Primeiros contatos',
  SALES_COUNT: 'Vendas concluidas',
  REALIZED_REVENUE: 'Receita recebida',
};

export const GOAL_PERIOD_TYPES = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
export type GoalPeriodType = (typeof GOAL_PERIOD_TYPES)[number];

export const GOAL_PERIOD_LABELS: Record<GoalPeriodType, string> = {
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
};

/** Nivel de completude dos dados do lead; controla o destaque visual do card. */
export const INCOMPLETE_LEVELS = ['NONE', 'WARNING', 'CRITICAL'] as const;
export type IncompleteLevel = (typeof INCOMPLETE_LEVELS)[number];

export const WEBSITE_CLASSIFICATIONS = [
  'OWN_WEBSITE',
  'INSTAGRAM',
  'FACEBOOK_OR_SOCIAL',
  'WHATSAPP',
  'LINK_IN_BIO',
  'DIRECTORY_OR_PLATFORM',
  'UNKNOWN',
  'NONE',
] as const;
export type WebsiteClassification = (typeof WEBSITE_CLASSIFICATIONS)[number];

export const WEBSITE_CLASSIFICATION_LABELS: Record<WebsiteClassification, string> = {
  OWN_WEBSITE: 'Provavel site proprio',
  INSTAGRAM: 'Instagram como site',
  FACEBOOK_OR_SOCIAL: 'Rede social como site',
  WHATSAPP: 'WhatsApp como site',
  LINK_IN_BIO: 'Pagina de links',
  DIRECTORY_OR_PLATFORM: 'Diretorio ou plataforma',
  UNKNOWN: 'Link nao classificado - verificar',
  NONE: 'Sem nenhum link',
};

export const WEBSITE_FILTERS = [
  'ALL',
  'NO_OWN_WEBSITE',
  'HAS_OWN_WEBSITE',
  'NO_LINK',
  'SOCIAL_AS_WEBSITE',
] as const;
export type WebsiteFilter = (typeof WEBSITE_FILTERS)[number];

export const WEBSITE_FILTER_LABELS: Record<WebsiteFilter, string> = {
  ALL: 'Todos',
  NO_OWN_WEBSITE: 'Sem site proprio',
  HAS_OWN_WEBSITE: 'Com site proprio',
  NO_LINK: 'Sem nenhum link',
  SOCIAL_AS_WEBSITE: 'Rede social como site',
};

export const BUSINESS_STATUSES = [
  'OPERATIONAL',
  'CLOSED_TEMPORARILY',
  'CLOSED_PERMANENTLY',
  'UNKNOWN',
] as const;
export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

export const GOOGLE_SKU_TYPES = ['TEXT_SEARCH', 'PLACE_DETAILS'] as const;
export type GoogleSkuType = (typeof GOOGLE_SKU_TYPES)[number];

export const GOOGLE_SKU_LABELS: Record<GoogleSkuType, string> = {
  TEXT_SEARCH: 'Pesquisa de empresas (Text Search)',
  PLACE_DETAILS: 'Detalhes do local (Place Details)',
};

export const IDENTITY_KEY_TYPES = ['PLACE_ID', 'PHONE', 'OWN_DOMAIN', 'NAME_ADDRESS'] as const;
export type IdentityKeyType = (typeof IDENTITY_KEY_TYPES)[number];

export const IDENTITY_KEY_LABELS: Record<IdentityKeyType, string> = {
  PLACE_ID: 'Identificador do Google',
  PHONE: 'Telefone',
  OWN_DOMAIN: 'Dominio proprio',
  NAME_ADDRESS: 'Nome e endereco',
};

export const DUPLICATE_REVIEW_STATUSES = [
  'PENDING',
  'CONFIRMED_SAME',
  'CONFIRMED_DIFFERENT',
  'DISMISSED',
] as const;
export type DuplicateReviewStatus = (typeof DUPLICATE_REVIEW_STATUSES)[number];

export const IMPORT_ROW_STATUSES = [
  'IMPORTED',
  'DUPLICATE',
  'PROBABLE_DUPLICATE',
  'INCOMPLETE',
  'INVALID',
  'EMPTY',
] as const;
export type ImportRowStatus = (typeof IMPORT_ROW_STATUSES)[number];

export const IMPORT_ROW_STATUS_LABELS: Record<ImportRowStatus, string> = {
  IMPORTED: 'Importado',
  DUPLICATE: 'Duplicado ignorado',
  PROBABLE_DUPLICATE: 'Possivel duplicidade',
  INCOMPLETE: 'Importado com dados incompletos',
  INVALID: 'Invalido',
  EMPTY: 'Linha vazia ignorada',
};

/** Campos de lead que podem ser mapeados na importacao. */
export const IMPORT_FIELDS = [
  'name',
  'phone',
  'whatsapp',
  'email',
  'instagram',
  'website',
  'demoUrl',
  'mapsUrl',
  'address',
  'city',
  'state',
  'country',
  'niche',
  'source',
  'service',
  'proposedPrice',
  'notes',
  'nextFollowUp',
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  name: 'Nome da empresa/lead',
  phone: 'Telefone',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  instagram: 'Instagram',
  website: 'Website',
  demoUrl: 'Link da demonstracao ou proposta',
  mapsUrl: 'Google Maps',
  address: 'Endereco',
  city: 'Cidade',
  state: 'Estado',
  country: 'Pais',
  niche: 'Nicho',
  source: 'Origem',
  service: 'Servico',
  proposedPrice: 'Valor proposto',
  notes: 'Observacoes',
  nextFollowUp: 'Proximo follow-up',
};

/** Texto de atribuicao exibido junto de qualquer dado vindo do Google. */
export const ATTRIBUTION_TEXT = 'Dados de lugares fornecidos pelo Google';
