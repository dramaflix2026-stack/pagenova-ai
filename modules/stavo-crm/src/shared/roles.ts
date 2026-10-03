/**
 * Cargos da equipe e o que cada um pode fazer.
 *
 * Duas regras diferentes convivem aqui, e confundi-las e a fonte classica de
 * furo de permissao:
 *
 *   CARGO   -> o que a pessoa pode fazer no sistema (pesquisar no Google,
 *              ver o financeiro da empresa, gerenciar a equipe).
 *   DONO    -> quem pode MEXER em um lead especifico.
 *
 * Dono da conta, socio e suporte enxergam todos os leads. O vendedor enxerga
 * apenas os leads dele: a carteira dos colegas nao e dele para prospectar.
 * Mexer -- mover de coluna, editar, registrar venda, excluir -- e so do dono
 * do lead, com uma unica excecao: o dono da conta, que precisa conseguir
 * destravar o que ficou parado.
 *
 * Este arquivo e compartilhado entre servidor e navegador. O servidor e a
 * autoridade: a tela usa isto apenas para esconder botao que nao funcionaria.
 */

export const USER_ROLES = ['OWNER', 'PARTNER', 'EMPLOYEE', 'SUPPORT'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Dono da conta',
  PARTNER: 'Socio',
  // O valor gravado no banco continua EMPLOYEE: so o nome exibido mudou.
  EMPLOYEE: 'Vendedor',
  SUPPORT: 'Suporte',
};

export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  OWNER:
    'Acesso total. E o unico que gerencia a equipe e transfere leads de uma pessoa para outra.',
  PARTNER:
    'Prospecta, vende e ve o financeiro da empresa inteira. Nao mexe em lead de outra pessoa nem gerencia a equipe.',
  EMPLOYEE:
    'Pesquisa empresas e trabalha apenas os leads que ele mesmo adicionou. Nao ve os leads dos colegas, nao mexe na equipe e acompanha as metas que o dono da conta definir para ele.',
  SUPPORT:
    'Atende clientes ja fechados: le qualquer lead e registra anotacoes. Nao pesquisa no Google, nao move cards e nao ve o financeiro.',
};

/** Acoes controladas por cargo. */
export const CAPABILITIES = [
  /** Pesquisar empresas na API do Google (gasta cota paga). */
  'GOOGLE_SEARCH',
  /** Criar lead, seja pela pesquisa, importacao ou cadastro manual. */
  'LEAD_CREATE',
  /** Enxergar leads de OUTRA pessoa (e os sem dono). Sem isto, so os proprios. */
  'LEAD_VIEW_ANY',
  /** Mexer em lead de OUTRA pessoa. Sem isto, so nos proprios. */
  'LEAD_EDIT_ANY',
  /** Anotar em lead de outra pessoa, sem poder move-lo ou edita-lo. */
  'LEAD_NOTE_ANY',
  /** Excluir lead definitivamente (leva o financeiro junto). */
  'LEAD_DELETE',
  /** Transferir um lead de uma pessoa para outra. */
  'LEAD_TRANSFER',
  /** Importar planilha de leads. */
  'LEAD_IMPORT',
  /** Ver receita, cobrancas e metas da empresa inteira, nao so as suas. */
  'FINANCE_VIEW_ALL',
  /** Confirmar pagamento, estornar, mexer em assinatura. */
  'FINANCE_MANAGE',
  /** Definir metas. */
  'GOALS_MANAGE',
  /** Exportar dados. */
  'EXPORT_DATA',
  /** Etapas, servicos, motivos de perda, origens. */
  'SETTINGS_MANAGE',
  /** Adicionar, editar e desativar colaboradores. */
  'TEAM_MANAGE',
  /** Criar, editar e publicar sites com IA (gasta credito pago da API). */
  'SITE_AI_MANAGE',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/**
 * O que cada cargo pode.
 *
 * OWNER nao aparece na tabela: ele pode tudo, por definicao. Listar as
 * permissoes dele seria uma lista para esquecer de atualizar.
 */
const CAPABILITIES_BY_ROLE: Record<Exclude<UserRole, 'OWNER'>, readonly Capability[]> = {
  PARTNER: [
    'GOOGLE_SEARCH',
    'LEAD_CREATE',
    'LEAD_VIEW_ANY',
    'LEAD_DELETE',
    'LEAD_IMPORT',
    'FINANCE_VIEW_ALL',
    'FINANCE_MANAGE',
    'GOALS_MANAGE',
    'EXPORT_DATA',
    'SITE_AI_MANAGE',
  ],
  EMPLOYEE: ['GOOGLE_SEARCH', 'LEAD_CREATE'],
  // O suporte atende cliente de qualquer vendedor, entao precisa enxergar todos.
  SUPPORT: ['LEAD_VIEW_ANY', 'LEAD_NOTE_ANY'],
};

export function can(role: UserRole, capability: Capability): boolean {
  if (role === 'OWNER') return true;
  return CAPABILITIES_BY_ROLE[role].includes(capability);
}

/** Lista completa, usada pela tela de equipe para explicar cada cargo. */
export function capabilitiesOf(role: UserRole): Capability[] {
  if (role === 'OWNER') return [...CAPABILITIES];
  return [...CAPABILITIES_BY_ROLE[role]];
}

/**
 * Pode alterar este lead?
 *
 * Mexer e do dono. O dono da conta passa por cima porque, se o dono do lead
 * sair da empresa, alguem precisa conseguir destravar -- foi a decisao
 * explicita de projeto, e sem ela o lead ficaria preso para sempre.
 *
 * Lead sem dono (herdado de antes da equipe existir, ou de quem foi
 * desativado) fica liberado para quem cria lead E enxerga a carteira toda.
 * O vendedor fica de fora: lead solto espera o dono da conta redistribuir.
 */
export function canEditLead(role: UserRole, userId: string, ownerUserId: string | null): boolean {
  if (ownerUserId === null) return can(role, 'LEAD_CREATE') && can(role, 'LEAD_VIEW_ANY');
  if (ownerUserId === userId) return true;
  return can(role, 'LEAD_EDIT_ANY');
}

/** Pode sequer ver este lead? */
export function canViewLead(role: UserRole, userId: string, ownerUserId: string | null): boolean {
  return ownerUserId === userId || can(role, 'LEAD_VIEW_ANY');
}

/**
 * Recorte das listas de leads (quadro, busca, detalhe).
 * Devolve o id do usuario quando ele so pode ver os proprios leads.
 */
export function leadVisibilityOwnerFilter(role: UserRole, userId: string): string | null {
  return can(role, 'LEAD_VIEW_ANY') ? null : userId;
}

/** Pode registrar anotacao ou tentativa de contato neste lead? */
export function canNoteLead(role: UserRole, userId: string, ownerUserId: string | null): boolean {
  return canEditLead(role, userId, ownerUserId) || can(role, 'LEAD_NOTE_ANY');
}

/**
 * O painel e o financeiro mostram a empresa toda ou so o proprio trabalho?
 * Devolve o id do usuario quando a visao deve ser restrita a ele.
 */
export function metricsOwnerFilter(role: UserRole, userId: string): string | null {
  return can(role, 'FINANCE_VIEW_ALL') ? null : userId;
}
