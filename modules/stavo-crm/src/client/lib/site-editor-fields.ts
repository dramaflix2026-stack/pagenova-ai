/**
 * Politica de edicao por campo, usada pelo painel de propriedades.
 *
 * Regra que este arquivo existe para impor: um campo que carrega FATO
 * confirmado (depoimento, credencial, numero, telefone, endereco) nunca pode
 * virar texto livre no editor -- isso reabriria exatamente o risco que o
 * assembler (etapa A6) foi construido para fechar. Esses campos aparecem
 * como somente leitura, com a explicacao de onde o valor vem.
 */

export type FieldPolicy = 'editable' | 'readonly-fact';

/**
 * Campos bloqueados por SECAO especifica, porque o mesmo nome de campo tem
 * significado diferente conforme o tipo (por exemplo, `items` e copy livre em
 * `services` mas e depoimento confirmado em `testimonials`).
 */
const READONLY_BY_SECTION: Record<string, string[]> = {
  testimonials: ['items'],
  stats: ['items'],
  authority: ['credentials', 'personName'],
  contactMap: ['address', 'mapsUrl', 'contacts', 'openingHours'],
  whatsappForm: ['whatsappE164'],
  footer: ['businessName', 'links', 'socialLinks', 'legalNote', 'showAgencyCredit'],
};

/** Campos nunca editaveis em NENHUMA secao: estrutura, nao conteudo. */
const ALWAYS_READONLY = new Set(['id', 'type', 'anchor']);

export function fieldPolicy(sectionType: string, field: string): FieldPolicy {
  if (ALWAYS_READONLY.has(field)) return 'readonly-fact';
  if (READONLY_BY_SECTION[sectionType]?.includes(field)) return 'readonly-fact';
  return 'editable';
}

export const READONLY_EXPLANATION =
  'Este dado vem de um fato confirmado do negocio e nao pode ser digitado aqui. ' +
  'Para mudar, atualize o cadastro do lead ou gere uma nova versao.';
