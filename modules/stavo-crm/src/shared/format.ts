/**
 * Formatacao pt-BR compartilhada. Nao faz calculo financeiro:
 * todos os valores chegam prontos do backend como string decimal.
 */
import { APP_TIMEZONE, CURRENCY, LOCALE } from './constants';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const monthFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: APP_TIMEZONE,
  month: 'long',
  year: 'numeric',
});

/** R$ 1.234,56 */
export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return currencyFormatter.format(0);
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return currencyFormatter.format(0);
  return currencyFormatter.format(parsed);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '0';
  return numberFormatter.format(value);
}

/**
 * Percentual com uma casa. Denominador zero retorna null para que a interface
 * mostre um traco com explicacao, nunca uma porcentagem enganosa.
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${numberFormatter.format(Math.round(value * 1000) / 10)}%`;
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  // Datas puras (AAAA-MM-DD) sao ancoradas ao meio-dia UTC para que a
  // conversao para America/Sao_Paulo nunca caia no dia anterior.
  const raw = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00.000Z` : value;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** 20/08/2026 */
export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : '—';
}

/** 20/08/2026 14:35 */
export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : '—';
}

/** agosto de 2026 — recebe competencia AAAA-MM */
export function formatReferencePeriod(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return '—';
  const date = new Date(`${value}-15T12:00:00.000Z`);
  return monthFormatter.format(date);
}

/** "3 dias", "5 horas", "agora" — duracao humana a partir de milissegundos. */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) return '—';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'dia' : 'dias'}`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? 'mes' : 'meses'}`;
}

/** "ha 3 dias" / "em 2 dias" a partir de uma data. */
export function formatRelative(value: string | Date | null | undefined, now = new Date()): string {
  const date = toDate(value);
  if (!date) return '—';
  const diff = date.getTime() - now.getTime();
  const label = formatDuration(Math.abs(diff));
  if (label === '—') return '—';
  if (label === 'agora') return 'agora';
  return diff < 0 ? `ha ${label}` : `em ${label}`;
}

/** Telefone brasileiro legivel: (11) 98888-7777. Outros paises: E.164. */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return '—';
  const digits = e164.replace(/\D/g, '');
  if (e164.startsWith('+55') && (digits.length === 12 || digits.length === 13)) {
    const national = digits.slice(2);
    const ddd = national.slice(0, 2);
    const rest = national.slice(2);
    const middle = rest.length === 9 ? rest.slice(0, 5) : rest.slice(0, 4);
    const end = rest.length === 9 ? rest.slice(5) : rest.slice(4);
    return `(${ddd}) ${middle}-${end}`;
  }
  return e164;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
