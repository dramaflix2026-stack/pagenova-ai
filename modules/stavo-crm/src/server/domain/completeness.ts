/**
 * Nivel de completude do lead.
 *
 * CRITICAL (contorno vermelho): falta o nome interno OU nao existe nenhum meio
 *   direto de contato persistido.
 * WARNING (aviso amarelo): faltam dados uteis porem opcionais.
 *
 * Nada aqui bloqueia o fluxo: um lead importado sem telefone entra assim mesmo,
 * apenas sinalizado.
 */
import type { ContactType, IncompleteLevel, LinkType } from '../../shared/constants';

export interface CompletenessInput {
  internalName: string | null | undefined;
  contacts: { type: ContactType; isValid: boolean }[];
  links: { type: LinkType }[];
  city: string | null | undefined;
  hasService: boolean;
  /** Leads do Google podem consultar dados publicos ao vivo pelo place_id. */
  hasPlaceId: boolean;
}

export interface CompletenessResult {
  level: IncompleteLevel;
  /** Frases curtas exibidas no drawer do card. */
  criticalIssues: string[];
  warnings: string[];
}

/** Tipos de contato que permitem falar diretamente com o lead. */
const DIRECT_CONTACT_TYPES: ContactType[] = ['PHONE', 'WHATSAPP', 'EMAIL'];

export function evaluateCompleteness(input: CompletenessInput): CompletenessResult {
  const criticalIssues: string[] = [];
  const warnings: string[] = [];

  if (!input.internalName || input.internalName.trim().length === 0) {
    criticalIssues.push('Nome interno ausente');
  }

  const directContacts = input.contacts.filter((contact) =>
    DIRECT_CONTACT_TYPES.includes(contact.type),
  );

  if (directContacts.length === 0) {
    // Para lead do Google o telefone pode ser consultado ao vivo, entao a
    // ausencia de contato proprio e um alerta, nao um bloqueio critico.
    if (input.hasPlaceId) {
      warnings.push('Nenhum contato proprio salvo - consulte os dados atuais do Google');
    } else {
      criticalIssues.push('Telefone ausente');
    }
  } else if (directContacts.every((contact) => !contact.isValid)) {
    criticalIssues.push('Nenhum contato valido - revise o telefone informado');
  }

  const linkTypes = new Set(input.links.map((link) => link.type));
  if (!linkTypes.has('INSTAGRAM')) warnings.push('Instagram ausente');
  if (!linkTypes.has('WEBSITE')) warnings.push('Website ausente');
  if (!linkTypes.has('MAPS') && !input.hasPlaceId) warnings.push('Google Maps ausente');
  if (!input.city) warnings.push('Cidade ausente');
  if (!input.hasService) warnings.push('Servico nao associado');

  const level: IncompleteLevel =
    criticalIssues.length > 0 ? 'CRITICAL' : warnings.length > 0 ? 'WARNING' : 'NONE';

  return { level, criticalIssues, warnings };
}
