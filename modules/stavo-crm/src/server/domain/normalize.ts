/**
 * Normalizacao deterministica usada pela deduplicacao.
 *
 * Funcoes puras e testaveis: mesma entrada, mesma saida, sem I/O.
 * O hash serve de indice; a amostra legivel serve de auditoria.
 */
import { createHash } from 'node:crypto';

// Metadados completos: sem eles getType() devolve undefined e o botao de
// WhatsApp nao conseguiria distinguir celular de telefone fixo.
import { parsePhoneNumberFromString, type PhoneNumber } from 'libphonenumber-js/max';

import type { IdentityKeyType } from '../../shared/constants';

/** Remove acentos, pontuacao e espacos redundantes; devolve minusculas. */
export function normalizeText(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Palavras que nao ajudam a distinguir empresas em nomes normalizados. */
const NAME_STOPWORDS = new Set([
  'ltda',
  'me',
  'eireli',
  'sa',
  's a',
  'epp',
  'mei',
  'cia',
  'e',
  'de',
  'da',
  'do',
  'das',
  'dos',
]);

export function normalizeCompanyName(value: string | null | undefined): string {
  const base = normalizeText(value);
  if (!base) return '';
  const tokens = base.split(' ').filter((token) => token && !NAME_STOPWORDS.has(token));
  return (tokens.length > 0 ? tokens : base.split(' ')).join(' ');
}

/** Abreviacoes de logradouro unificadas para tornar o endereco comparavel. */
const ADDRESS_REPLACEMENTS: [RegExp, string][] = [
  [/\b(av|avd|avenida)\b/g, 'av'],
  [/\b(r|rua)\b/g, 'r'],
  [/\b(rod|rodovia)\b/g, 'rod'],
  [/\b(al|alameda)\b/g, 'al'],
  [/\b(tv|travessa)\b/g, 'tv'],
  [/\b(pc|praca)\b/g, 'pc'],
  [/\b(numero|num|no|n)\b/g, ''],
  [/\b(apto|apt|apartamento)\b/g, 'ap'],
  [/\b(sala|sl)\b/g, 'sl'],
  [/\b(bairro)\b/g, ''],
  [/\b(cep)\b/g, ''],
];

export function normalizeAddress(value: string | null | undefined): string {
  let base = normalizeText(value);
  if (!base) return '';
  for (const [pattern, replacement] of ADDRESS_REPLACEMENTS) {
    base = base.replace(pattern, replacement);
  }
  return base.replace(/\s+/g, ' ').trim();
}

export interface NormalizedPhone {
  /** E.164 quando valido; null caso contrario. */
  e164: string | null;
  /** Somente digitos, usado como ultimo recurso de comparacao. */
  digits: string;
  isValid: boolean;
  country: string | null;
  /** MOBILE | FIXED_LINE | UNKNOWN — a API do Google nao garante o tipo. */
  type: 'MOBILE' | 'FIXED_LINE' | 'UNKNOWN';
}

/**
 * Normaliza telefone com libphonenumber. `defaultCountry` cobre numeros
 * digitados sem DDI, o caso comum em planilhas brasileiras.
 */
export function normalizePhone(
  value: string | null | undefined,
  defaultCountry = 'BR',
): NormalizedPhone {
  const raw = (value ?? '').trim();
  const digits = raw.replace(/\D/g, '');

  if (!raw) {
    return { e164: null, digits: '', isValid: false, country: null, type: 'UNKNOWN' };
  }

  let parsed: PhoneNumber | undefined;
  try {
    parsed = parsePhoneNumberFromString(raw, defaultCountry as never);
  } catch {
    parsed = undefined;
  }

  if (!parsed || !parsed.isValid()) {
    return { e164: null, digits, isValid: false, country: null, type: 'UNKNOWN' };
  }

  const numberType = parsed.getType();
  const type: NormalizedPhone['type'] =
    numberType === 'MOBILE'
      ? 'MOBILE'
      : numberType === 'FIXED_LINE'
        ? 'FIXED_LINE'
        : // FIXED_LINE_OR_MOBILE e o retorno comum no Brasil: fica incerto de proposito.
          'UNKNOWN';

  return {
    e164: parsed.number,
    digits: parsed.number.replace(/\D/g, ''),
    isValid: true,
    country: parsed.country ?? null,
    type,
  };
}

/** Host normalizado: minusculo, sem protocolo, sem www e sem porta. */
export function normalizeHost(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    return host.length > 0 ? host : null;
  } catch {
    return null;
  }
}

/** URL canonica para exibicao e comparacao: sem barra final nem rastreadores. */
export function normalizeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    url.hash = '';

    for (const param of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_|ref$|source$)/i.test(param)) {
        url.searchParams.delete(param);
      }
    }

    let output = url.toString();
    if (output.endsWith('/') && url.pathname === '/') {
      output = output.slice(0, -1);
    }
    return output;
  } catch {
    return null;
  }
}

export function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed) ? trimmed : null;
}

/** Perfil do Instagram em minusculas, sem @, sem query e sem barra final. */
export function normalizeInstagram(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;

  const handleOnly = raw.replace(/^@/, '');
  if (/^[A-Za-z0-9._]{1,30}$/.test(handleOnly) && !handleOnly.includes('.com')) {
    return `https://instagram.com/${handleOnly.toLowerCase()}`;
  }

  const host = normalizeHost(raw);
  if (host !== 'instagram.com') return null;

  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    const handle = url.pathname.split('/').filter(Boolean)[0];
    return handle ? `https://instagram.com/${handle.toLowerCase()}` : null;
  } catch {
    return null;
  }
}

export const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

export interface IdentityKey {
  keyType: IdentityKeyType;
  keyHash: string;
  /** Amostra curta para auditoria; nunca o valor completo de dado sensivel. */
  keySample: string;
}

const sample = (value: string): string => value.slice(0, 120);

export const placeIdKey = (placeId: string): IdentityKey => ({
  keyType: 'PLACE_ID',
  keyHash: sha256(`PLACE_ID:${placeId.trim()}`),
  keySample: sample(placeId.trim()),
});

/** Somente telefones validos viram identidade forte. */
export const phoneKey = (e164: string): IdentityKey => ({
  keyType: 'PHONE',
  keyHash: sha256(`PHONE:${e164}`),
  keySample: sample(e164),
});

export const domainKey = (host: string): IdentityKey => ({
  keyType: 'OWN_DOMAIN',
  keyHash: sha256(`OWN_DOMAIN:${host}`),
  keySample: sample(host),
});

/**
 * Nome + endereco so forma identidade quando ambos existem: nome sozinho
 * jamais deduplica (franquias e unidades sao leads legitimos distintos).
 */
export function nameAddressKey(
  name: string | null | undefined,
  address: string | null | undefined,
): IdentityKey | null {
  const normalizedName = normalizeCompanyName(name);
  const normalizedAddress = normalizeAddress(address);
  if (!normalizedName || !normalizedAddress) return null;
  if (normalizedName.length < 3 || normalizedAddress.length < 6) return null;

  const composed = `${normalizedName}|${normalizedAddress}`;
  return {
    keyType: 'NAME_ADDRESS',
    keyHash: sha256(`NAME_ADDRESS:${composed}`),
    keySample: sample(composed),
  };
}

/** Similaridade 0..1 por bigramas (Dice). Usada em "possivel duplicidade". */
export function similarity(a: string, b: string): number {
  const left = normalizeText(a).replace(/\s/g, '');
  const right = normalizeText(b).replace(/\s/g, '');
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.length < 2 || right.length < 2) return left === right ? 1 : 0;

  const bigrams = new Map<string, number>();
  for (let i = 0; i < left.length - 1; i += 1) {
    const gram = left.slice(i, i + 2);
    bigrams.set(gram, (bigrams.get(gram) ?? 0) + 1);
  }

  let matches = 0;
  for (let i = 0; i < right.length - 1; i += 1) {
    const gram = right.slice(i, i + 2);
    const count = bigrams.get(gram) ?? 0;
    if (count > 0) {
      bigrams.set(gram, count - 1);
      matches += 1;
    }
  }

  return (2 * matches) / (left.length - 1 + right.length - 1);
}
