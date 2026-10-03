/**
 * Regras de tempo e periodo.
 *
 * Invariante do sistema: o banco guarda SEMPRE UTC; toda janela de periodo
 * (hoje, semana, mes) e calculada no fuso operacional America/Sao_Paulo e
 * depois convertida para instantes UTC usados nas consultas.
 *
 * Semana: segunda-feira 00:00 ate domingo 23:59:59.999 (America/Sao_Paulo).
 */
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

import { APP_TIMEZONE } from '../../shared/constants';
import type { PeriodPreset } from '../../shared/schemas';

export interface DateRange {
  /** Inicio inclusivo, em UTC. */
  start: Date;
  /** Fim exclusivo, em UTC. */
  end: Date;
}

export const timezone = (): string => APP_TIMEZONE;

/** Data civil (AAAA-MM-DD) correspondente ao instante, no fuso operacional. */
export function toLocalDateString(instant: Date = new Date(), tz: string = APP_TIMEZONE): string {
  const zoned = toZonedTime(instant, tz);
  const year = zoned.getFullYear();
  const month = String(zoned.getMonth() + 1).padStart(2, '0');
  const day = String(zoned.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Competencia (AAAA-MM) correspondente ao instante, no fuso operacional. */
export function toReferencePeriod(instant: Date = new Date(), tz: string = APP_TIMEZONE): string {
  return toLocalDateString(instant, tz).slice(0, 7);
}

/** Instante UTC do inicio do dia civil informado. */
export function startOfLocalDay(date: string, tz: string = APP_TIMEZONE): Date {
  return fromZonedTime(`${date}T00:00:00.000`, tz);
}

/** Instante UTC do inicio do dia seguinte (fim exclusivo). */
export function endOfLocalDay(date: string, tz: string = APP_TIMEZONE): Date {
  return fromZonedTime(`${addDaysToDateString(date, 1)}T00:00:00.000`, tz);
}

/** Soma dias a uma data civil sem passar por fuso. */
export function addDaysToDateString(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const base = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function addMonthsToDateString(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const safeYear = year ?? 1970;
  const safeMonth = (month ?? 1) - 1;
  const safeDay = day ?? 1;
  const target = new Date(Date.UTC(safeYear, safeMonth + months, 1));
  // Preserva o dia do vencimento, ajustando para o ultimo dia de meses curtos.
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(safeDay, lastDay));
  return target.toISOString().slice(0, 10);
}

/** Diferenca em dias civis entre duas datas (b - a). */
export function diffInDays(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const left = Date.UTC(ay ?? 1970, (am ?? 1) - 1, ad ?? 1);
  const right = Date.UTC(by ?? 1970, (bm ?? 1) - 1, bd ?? 1);
  return Math.round((right - left) / 86_400_000);
}

/** Segunda-feira da semana da data informada. */
export function startOfWeekDateString(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const base = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  const weekday = base.getUTCDay(); // 0 = domingo
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addDaysToDateString(date, offset);
}

export function startOfMonthDateString(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function endOfMonthDateString(date: string): string {
  const [year, month] = date.split('-').map(Number);
  const last = new Date(Date.UTC(year ?? 1970, month ?? 1, 0)).getUTCDate();
  return `${date.slice(0, 7)}-${String(last).padStart(2, '0')}`;
}

export function startOfYearDateString(date: string): string {
  return `${date.slice(0, 4)}-01-01`;
}

/** Ultimo dia da competencia AAAA-MM. */
export function referencePeriodDueDate(period: string, dayOfMonth: number): string {
  const [year, month] = period.split('-').map(Number);
  const last = new Date(Date.UTC(year ?? 1970, month ?? 1, 0)).getUTCDate();
  return `${period}-${String(Math.min(dayOfMonth, last)).padStart(2, '0')}`;
}

export function addMonthsToReferencePeriod(period: string, months: number): string {
  const [year, month] = period.split('-').map(Number);
  const target = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1 + months, 1));
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function compareReferencePeriods(a: string, b: string): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

export interface ResolvedPeriod extends DateRange {
  /** Primeiro dia civil incluido no periodo. */
  fromDate: string;
  /** Ultimo dia civil incluido no periodo. */
  toDate: string;
  preset: PeriodPreset;
}

/**
 * Traduz um preset (ou intervalo personalizado) em janela UTC + datas civis.
 * `now` permite testes deterministicos.
 */
export function resolvePeriod(
  input: { preset: PeriodPreset; from?: string | undefined; to?: string | undefined },
  now: Date = new Date(),
  tz: string = APP_TIMEZONE,
): ResolvedPeriod {
  const today = toLocalDateString(now, tz);
  let fromDate: string;
  let toDate: string;

  switch (input.preset) {
    case 'TODAY':
      fromDate = today;
      toDate = today;
      break;
    case 'YESTERDAY':
      fromDate = addDaysToDateString(today, -1);
      toDate = fromDate;
      break;
    case 'THIS_WEEK':
      fromDate = startOfWeekDateString(today);
      toDate = addDaysToDateString(fromDate, 6);
      break;
    case 'LAST_7_DAYS':
      fromDate = addDaysToDateString(today, -6);
      toDate = today;
      break;
    case 'THIS_MONTH':
      fromDate = startOfMonthDateString(today);
      toDate = endOfMonthDateString(today);
      break;
    case 'LAST_30_DAYS':
      fromDate = addDaysToDateString(today, -29);
      toDate = today;
      break;
    case 'LAST_MONTH': {
      const previous = addMonthsToDateString(startOfMonthDateString(today), -1);
      fromDate = startOfMonthDateString(previous);
      toDate = endOfMonthDateString(previous);
      break;
    }
    case 'THIS_YEAR':
      fromDate = startOfYearDateString(today);
      toDate = `${today.slice(0, 4)}-12-31`;
      break;
    case 'ALL_TIME':
      fromDate = '1970-01-01';
      toDate = '2999-12-31';
      break;
    case 'CUSTOM':
      fromDate = input.from ?? today;
      toDate = input.to ?? today;
      break;
    default:
      fromDate = startOfMonthDateString(today);
      toDate = endOfMonthDateString(today);
  }

  return {
    fromDate,
    toDate,
    preset: input.preset,
    start: startOfLocalDay(fromDate, tz),
    end: endOfLocalDay(toDate, tz),
  };
}

/** Janela do dia corrente, usada pelas metas diarias. */
export function todayRange(now: Date = new Date(), tz: string = APP_TIMEZONE): ResolvedPeriod {
  return resolvePeriod({ preset: 'TODAY' }, now, tz);
}

/** Sequencia de competencias de `from` ate `to`, inclusive. */
export function referencePeriodsBetween(from: string, to: string): string[] {
  const periods: string[] = [];
  let current = from;
  let guard = 0;
  while (compareReferencePeriods(current, to) <= 0 && guard < 600) {
    periods.push(current);
    current = addMonthsToReferencePeriod(current, 1);
    guard += 1;
  }
  return periods;
}
