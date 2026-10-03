/**
 * Fuso e periodos.
 *
 * Invariante: o banco guarda UTC, mas "hoje", "esta semana" e "este mes" sao
 * sempre o dia civil de America/Sao_Paulo. Um erro aqui faz a meta diaria
 * contar leads do dia errado.
 */
import { describe, expect, it } from 'vitest';

import {
  addDaysToDateString,
  addMonthsToDateString,
  addMonthsToReferencePeriod,
  compareReferencePeriods,
  diffInDays,
  endOfMonthDateString,
  referencePeriodDueDate,
  referencePeriodsBetween,
  resolvePeriod,
  startOfLocalDay,
  startOfWeekDateString,
  toLocalDateString,
  toReferencePeriod,
} from '@server/domain/time';

describe('dia civil no fuso de Sao Paulo', () => {
  it('usa o dia de Sao Paulo, nao o de UTC', () => {
    // 2026-08-21T01:00Z ainda e dia 20 em Sao Paulo (UTC-3).
    expect(toLocalDateString(new Date('2026-08-21T01:00:00Z'))).toBe('2026-08-20');
    // 2026-08-21T03:00Z ja e dia 21.
    expect(toLocalDateString(new Date('2026-08-21T03:00:00Z'))).toBe('2026-08-21');
  });

  it('converte o inicio do dia civil para o instante UTC correto', () => {
    expect(startOfLocalDay('2026-08-20').toISOString()).toBe('2026-08-20T03:00:00.000Z');
  });

  it('deriva a competencia do dia civil', () => {
    expect(toReferencePeriod(new Date('2026-09-01T01:00:00Z'))).toBe('2026-08');
    expect(toReferencePeriod(new Date('2026-09-01T05:00:00Z'))).toBe('2026-09');
  });
});

describe('aritmetica de datas civis', () => {
  it('soma dias atravessando o mes', () => {
    expect(addDaysToDateString('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysToDateString('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('respeita ano bissexto', () => {
    expect(addDaysToDateString('2028-02-28', 1)).toBe('2028-02-29');
    expect(endOfMonthDateString('2028-02-10')).toBe('2028-02-29');
    expect(endOfMonthDateString('2026-02-10')).toBe('2026-02-28');
  });

  it('soma meses ajustando para o ultimo dia de meses curtos', () => {
    expect(addMonthsToDateString('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsToDateString('2026-01-31', 3)).toBe('2026-04-30');
    expect(addMonthsToDateString('2026-08-15', 1)).toBe('2026-09-15');
  });

  it('calcula diferenca em dias', () => {
    expect(diffInDays('2026-08-01', '2026-08-10')).toBe(9);
    expect(diffInDays('2026-08-10', '2026-08-01')).toBe(-9);
  });

  it('a semana comeca na segunda-feira', () => {
    // 2026-08-20 e uma quinta-feira.
    expect(startOfWeekDateString('2026-08-20')).toBe('2026-08-17');
    // Domingo pertence a semana que comecou na segunda anterior.
    expect(startOfWeekDateString('2026-08-23')).toBe('2026-08-17');
    expect(startOfWeekDateString('2026-08-24')).toBe('2026-08-24');
  });
});

describe('competencias mensais', () => {
  it('avanca competencia', () => {
    expect(addMonthsToReferencePeriod('2026-12', 1)).toBe('2027-01');
    expect(addMonthsToReferencePeriod('2026-01', -1)).toBe('2025-12');
  });

  it('compara competencias', () => {
    expect(compareReferencePeriods('2026-01', '2026-02')).toBe(-1);
    expect(compareReferencePeriods('2026-02', '2026-02')).toBe(0);
  });

  it('ajusta o dia de vencimento em meses curtos', () => {
    expect(referencePeriodDueDate('2026-02', 31)).toBe('2026-02-28');
    expect(referencePeriodDueDate('2028-02', 31)).toBe('2028-02-29');
    expect(referencePeriodDueDate('2026-08', 10)).toBe('2026-08-10');
  });

  it('lista competencias faltantes na ordem correta', () => {
    expect(referencePeriodsBetween('2026-06', '2026-09')).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
    ]);
    expect(referencePeriodsBetween('2026-06', '2026-06')).toEqual(['2026-06']);
    expect(referencePeriodsBetween('2026-07', '2026-06')).toEqual([]);
  });
});

describe('resolucao de periodos do dashboard', () => {
  // Quinta-feira, 20/08/2026, 15h em Sao Paulo.
  const now = new Date('2026-08-20T18:00:00Z');

  it('hoje cobre exatamente o dia civil de Sao Paulo', () => {
    const period = resolvePeriod({ preset: 'TODAY' }, now);
    expect(period.fromDate).toBe('2026-08-20');
    expect(period.toDate).toBe('2026-08-20');
    expect(period.start.toISOString()).toBe('2026-08-20T03:00:00.000Z');
    expect(period.end.toISOString()).toBe('2026-08-21T03:00:00.000Z');
  });

  it('esta semana vai de segunda a domingo', () => {
    const period = resolvePeriod({ preset: 'THIS_WEEK' }, now);
    expect(period.fromDate).toBe('2026-08-17');
    expect(period.toDate).toBe('2026-08-23');
  });

  it('este mes cobre o mes inteiro', () => {
    const period = resolvePeriod({ preset: 'THIS_MONTH' }, now);
    expect(period.fromDate).toBe('2026-08-01');
    expect(period.toDate).toBe('2026-08-31');
  });

  it('mes passado', () => {
    const period = resolvePeriod({ preset: 'LAST_MONTH' }, now);
    expect(period.fromDate).toBe('2026-07-01');
    expect(period.toDate).toBe('2026-07-31');
  });

  it('ultimos 7 dias inclui hoje', () => {
    const period = resolvePeriod({ preset: 'LAST_7_DAYS' }, now);
    expect(period.fromDate).toBe('2026-08-14');
    expect(period.toDate).toBe('2026-08-20');
  });

  it('periodo personalizado respeita as datas informadas', () => {
    const period = resolvePeriod(
      { preset: 'CUSTOM', from: '2026-01-01', to: '2026-03-31' },
      now,
    );
    expect(period.fromDate).toBe('2026-01-01');
    expect(period.toDate).toBe('2026-03-31');
  });
});
