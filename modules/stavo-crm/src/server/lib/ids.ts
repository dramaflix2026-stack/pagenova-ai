/**
 * Identificadores ordenaveis por tempo (ULID monotonico simplificado).
 * 26 caracteres em Crockford base32: 10 de timestamp + 16 de aleatoriedade.
 * Ordenaveis cronologicamente, o que ajuda os indices do MySQL.
 */
import { randomBytes, randomUUID } from 'node:crypto';

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const TIME_LEN = 10;
const RANDOM_LEN = 16;

let lastTime = 0;
let lastRandom: number[] = [];

function encodeTime(now: number): string {
  let out = '';
  let value = now;
  for (let i = TIME_LEN - 1; i >= 0; i -= 1) {
    const mod = value % 32;
    out = ENCODING[mod] + out;
    value = (value - mod) / 32;
  }
  return out;
}

function randomChars(): number[] {
  const bytes = randomBytes(RANDOM_LEN);
  return Array.from(bytes, (byte) => byte % 32);
}

/** Incrementa a parte aleatoria para manter a ordem dentro do mesmo milissegundo. */
function incrementRandom(chars: number[]): number[] {
  const next = [...chars];
  for (let i = next.length - 1; i >= 0; i -= 1) {
    const current = next[i] ?? 0;
    if (current < 31) {
      next[i] = current + 1;
      return next;
    }
    next[i] = 0;
  }
  return randomChars();
}

export function newId(): string {
  const now = Date.now();
  if (now === lastTime && lastRandom.length === RANDOM_LEN) {
    lastRandom = incrementRandom(lastRandom);
  } else {
    lastTime = now;
    lastRandom = randomChars();
  }
  return encodeTime(now) + lastRandom.map((index) => ENCODING[index]).join('');
}

/** Chave de idempotencia gerada pelo servidor quando o cliente nao envia uma. */
export function newIdempotencyKey(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}
