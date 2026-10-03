/**
 * Aritmetica monetaria em centavos inteiros.
 * Valores nunca transitam como float: o banco usa DECIMAL e a API usa string.
 */

export type Money = string;

const MAX_CENTS = 9_999_999_999_99; // compativel com DECIMAL(14,2)

/** Converte '1234.56' | 1234.56 | '1.234,56' para centavos inteiros. */
export function toCents(value: Money | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Valor monetario invalido.');
    return Math.round(value * 100);
  }

  let normalized = value.trim();
  // Aceita entrada brasileira "1.234,56" alem do formato canonico "1234.56".
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  }
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error('Valor monetario invalido.');
  }

  const negative = normalized.startsWith('-');
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole = '0', fraction = ''] = unsigned.split('.');
  const cents = Number(whole) * 100 + Number((fraction + '00').slice(0, 2));
  if (!Number.isSafeInteger(cents)) throw new Error('Valor monetario fora do intervalo suportado.');
  return negative ? -cents : cents;
}

/** Converte centavos para a string decimal usada pela API e pelo banco. */
export function fromCents(cents: number): Money {
  if (!Number.isFinite(cents)) throw new Error('Valor monetario invalido.');
  const rounded = Math.round(cents);
  const negative = rounded < 0;
  const abs = Math.abs(rounded);
  const whole = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

export function addMoney(...values: (Money | number | null | undefined)[]): Money {
  return fromCents(values.reduce<number>((total, value) => total + toCents(value), 0));
}

export function subtractMoney(a: Money | number, b: Money | number): Money {
  return fromCents(toCents(a) - toCents(b));
}

export function multiplyMoney(value: Money | number, quantity: number): Money {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error('A quantidade precisa ser um inteiro nao negativo.');
  }
  return fromCents(toCents(value) * quantity);
}

/** Divisao usada apenas em medias (ticket medio). Arredonda para o centavo. */
export function divideMoney(value: Money | number, divisor: number): Money {
  if (!Number.isFinite(divisor) || divisor === 0) throw new Error('Divisor invalido.');
  return fromCents(toCents(value) / divisor);
}

export function compareMoney(a: Money | number, b: Money | number): number {
  const left = toCents(a);
  const right = toCents(b);
  return left === right ? 0 : left < right ? -1 : 1;
}

export const isZero = (value: Money | number | null | undefined): boolean => toCents(value) === 0;
export const isPositive = (value: Money | number | null | undefined): boolean => toCents(value) > 0;

/** Normaliza qualquer entrada aceita para a forma canonica '0.00'. */
export function normalizeMoney(value: Money | number | null | undefined): Money {
  const cents = toCents(value);
  if (Math.abs(cents) > MAX_CENTS) {
    throw new Error('Valor monetario fora do intervalo suportado.');
  }
  return fromCents(cents);
}

export const ZERO: Money = '0.00';
