/**
 * Conversao de horario das reunioes no navegador.
 *
 * O formulario coleta data e hora no fuso do negocio (Brasilia). O servidor
 * so aceita instante ISO com fuso explicito. Esta camada faz a ponte em UM
 * lugar -- converter em cada tela e a receita classica da reuniao que aparece
 * tres horas deslocada.
 *
 * Nunca usar `new Date('2026-08-28 14:00')`: essa forma e interpretada pelo
 * fuso do NAVEGADOR, entao a mesma reuniao mudaria de hora se a pessoa
 * viajasse ou tivesse o relogio configurado em outro pais.
 */
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

import { APP_TIMEZONE } from '@shared/constants';

export interface LocalParts {
  /** AAAA-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
}

const doisDigitos = (valor: number): string => String(valor).padStart(2, '0');

/** Data e hora de Brasilia -> instante UTC. */
export function toInstant(date: string, time: string, tz: string = APP_TIMEZONE): Date {
  return fromZonedTime(`${date}T${time}:00.000`, tz);
}

/** Instante -> data e hora de Brasilia, prontos para os campos do formulario. */
export function toLocalParts(instant: Date | string, tz: string = APP_TIMEZONE): LocalParts {
  const data = typeof instant === 'string' ? new Date(instant) : instant;
  const zoned = toZonedTime(data, tz);
  return {
    date: `${zoned.getFullYear()}-${doisDigitos(zoned.getMonth() + 1)}-${doisDigitos(zoned.getDate())}`,
    time: `${doisDigitos(zoned.getHours())}:${doisDigitos(zoned.getMinutes())}`,
  };
}

/** Minutos entre dois instantes, para preencher a duracao. */
export function durationMinutes(start: Date | string, end: Date | string): number {
  const inicio = typeof start === 'string' ? new Date(start) : start;
  const fim = typeof end === 'string' ? new Date(end) : end;
  return Math.round((fim.getTime() - inicio.getTime()) / 60_000);
}

/** Soma minutos a um instante. */
export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * 60_000);
}

const horaFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: APP_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
});

const diaCurtoFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: 'short',
});

/** "15:00" no fuso do negocio. */
export const formatTime = (instant: Date | string): string =>
  horaFormatter.format(typeof instant === 'string' ? new Date(instant) : instant);

/** Dia civil de Brasilia correspondente ao instante. */
function localDay(instant: Date): string {
  return toLocalParts(instant).date;
}

/**
 * Rotulo curto do card: "Hoje, 15:00", "Amanha, 10:30", "28 ago., 14:00".
 *
 * O dia e comparado no fuso do negocio, nao no do navegador: as 23h de
 * Brasilia ainda e "hoje" para quem trabalha aqui.
 */
export function formatMeetingWhen(start: Date | string, now: Date = new Date()): string {
  const inicio = typeof start === 'string' ? new Date(start) : start;
  const hoje = localDay(now);
  const amanha = localDay(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  const dia = localDay(inicio);

  if (dia === hoje) return `Hoje, ${formatTime(inicio)}`;
  if (dia === amanha) return `Amanha, ${formatTime(inicio)}`;
  return `${diaCurtoFormatter.format(inicio).replace('.', '.')}, ${formatTime(inicio)}`;
}

/** "28/08 das 14:00 as 15:00" — usado no detalhe e nos alertas. */
export function formatMeetingWindow(start: Date | string, end: Date | string): string {
  const inicio = typeof start === 'string' ? new Date(start) : start;
  const fim = typeof end === 'string' ? new Date(end) : end;
  const data = new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(inicio);
  return `${data} das ${formatTime(inicio)} as ${formatTime(fim)}`;
}

/**
 * "em 45 minutos", "agora", "ha 2 horas".
 *
 * Serve ao alerta, que precisa comunicar proximidade sem obrigar a pessoa a
 * calcular a diferenca de cabeca.
 */
export function formatProximity(start: Date | string, now: Date = new Date()): string {
  const inicio = typeof start === 'string' ? new Date(start) : start;
  const minutos = Math.round((inicio.getTime() - now.getTime()) / 60_000);

  if (minutos <= 0 && minutos > -60) return 'agora';
  if (minutos < 0) {
    const passados = Math.abs(minutos);
    if (passados < 60 * 24) return `ha ${Math.round(passados / 60)} h`;
    return `ha ${Math.round(passados / (60 * 24))} dia(s)`;
  }
  if (minutos < 60) return `em ${minutos} min`;
  if (minutos < 60 * 24) return `em ${Math.round(minutos / 60)} h`;
  return `em ${Math.round(minutos / (60 * 24))} dia(s)`;
}

/** Reuniao acontecendo neste instante. */
export function isHappeningNow(
  start: Date | string,
  end: Date | string,
  now: Date = new Date(),
): boolean {
  const inicio = typeof start === 'string' ? new Date(start) : start;
  const fim = typeof end === 'string' ? new Date(end) : end;
  return inicio.getTime() <= now.getTime() && fim.getTime() > now.getTime();
}
