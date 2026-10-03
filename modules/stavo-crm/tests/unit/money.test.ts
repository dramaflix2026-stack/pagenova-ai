/**
 * Aritmetica monetaria: nunca pode perder centavo por causa de float.
 */
import { describe, expect, it } from 'vitest';

import {
  addMoney,
  compareMoney,
  divideMoney,
  fromCents,
  multiplyMoney,
  normalizeMoney,
  subtractMoney,
  toCents,
} from '@server/domain/money';

describe('conversao de valores', () => {
  it('converte string decimal para centavos', () => {
    expect(toCents('1234.56')).toBe(123456);
    expect(toCents('0.01')).toBe(1);
    expect(toCents('0')).toBe(0);
    expect(toCents('-10.50')).toBe(-1050);
  });

  it('aceita o formato brasileiro digitado pelo usuario', () => {
    expect(toCents('1.234,56')).toBe(123456);
    expect(toCents('999,90')).toBe(99990);
  });

  it('trata valor ausente como zero', () => {
    expect(toCents(null)).toBe(0);
    expect(toCents(undefined)).toBe(0);
    expect(toCents('')).toBe(0);
  });

  it('recusa entrada invalida em vez de converter silenciosamente', () => {
    expect(() => toCents('abc')).toThrow();
    expect(() => toCents('12,34,56')).toThrow();
    expect(() => toCents(Number.NaN)).toThrow();
  });

  it('volta de centavos para a forma canonica', () => {
    expect(fromCents(123456)).toBe('1234.56');
    expect(fromCents(5)).toBe('0.05');
    expect(fromCents(0)).toBe('0.00');
    expect(fromCents(-1050)).toBe('-10.50');
  });
});

describe('operacoes', () => {
  it('soma sem erro de ponto flutuante', () => {
    // 0.1 + 0.2 em float daria 0.30000000000000004
    expect(addMoney('0.10', '0.20')).toBe('0.30');
    expect(addMoney('19.99', '0.01')).toBe('20.00');
    expect(addMoney('100.00', '200.50', '0.50')).toBe('301.00');
  });

  it('subtrai preservando negativos', () => {
    expect(subtractMoney('100.00', '150.00')).toBe('-50.00');
  });

  it('multiplica por quantidade inteira', () => {
    expect(multiplyMoney('49.90', 3)).toBe('149.70');
    expect(multiplyMoney('49.90', 0)).toBe('0.00');
    expect(() => multiplyMoney('10.00', 1.5)).toThrow();
    expect(() => multiplyMoney('10.00', -1)).toThrow();
  });

  it('calcula ticket medio arredondando ao centavo', () => {
    expect(divideMoney('100.00', 3)).toBe('33.33');
    expect(divideMoney('1000.00', 4)).toBe('250.00');
    expect(() => divideMoney('10.00', 0)).toThrow();
  });

  it('compara valores', () => {
    expect(compareMoney('10.00', '10.00')).toBe(0);
    expect(compareMoney('9.99', '10.00')).toBe(-1);
    expect(compareMoney('10.01', '10.00')).toBe(1);
  });

  it('normaliza para duas casas', () => {
    expect(normalizeMoney(1234.5)).toBe('1234.50');
    expect(normalizeMoney('7')).toBe('7.00');
    expect(normalizeMoney(0)).toBe('0.00');
  });

  it('recusa valor fora do intervalo do DECIMAL(14,2)', () => {
    expect(() => normalizeMoney('99999999999999.99')).toThrow();
  });
});
