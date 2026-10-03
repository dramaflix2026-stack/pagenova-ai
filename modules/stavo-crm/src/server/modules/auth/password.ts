/**
 * Hash de senha com scrypt nativo do Node.
 *
 * Escolha deliberada: nao exige compilacao nativa, roda em qualquer hospedagem
 * compartilhada e possui parametros de custo explicitos e versionados.
 * Formato armazenado: scrypt$N$r$p$saltBase64$hashBase64
 */
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';

/** Wrapper tipado: `promisify` nao preserva a sobrecarga com opcoes de custo. */
const scrypt = (
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });

/** Parametros atuais. Alterar aqui migra novas senhas sem quebrar as antigas. */
const PARAMS = { N: 2 ** 15, r: 8, p: 1, keyLength: 64, saltLength: 16 } as const;

/** scrypt exige memoria proporcional a 128 * N * r (~32 MB com N=32768). */
const MAX_MEMORY = 128 * PARAMS.N * PARAMS.r * 2;

export const MIN_PASSWORD_LENGTH = 12;

/** Senhas obviamente fracas sao recusadas no bootstrap e na troca de senha. */
const OBVIOUS_PASSWORDS = new Set([
  'senha123456',
  '123456789012',
  'password1234',
  'stavodigital',
  'qwertyuiop12',
  'administrador',
  'admin1234567',
]);

export interface PasswordCheck {
  ok: boolean;
  reason?: string;
}

/** Validacao minima de forca, sem exigir composicao decorativa. */
export function checkPasswordStrength(password: string): PasswordCheck {
  const value = password ?? '';
  if (value.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, reason: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  }
  if (value.length > 200) {
    return { ok: false, reason: 'A senha deve ter no maximo 200 caracteres.' };
  }
  const normalized = value.toLowerCase();
  if (OBVIOUS_PASSWORDS.has(normalized)) {
    return { ok: false, reason: 'Escolha uma senha menos previsivel.' };
  }
  if (/^(.)\1+$/.test(value)) {
    return { ok: false, reason: 'A senha nao pode repetir o mesmo caractere.' };
  }
  const distinct = new Set(value).size;
  if (distinct < 5) {
    return { ok: false, reason: 'A senha precisa de mais variedade de caracteres.' };
  }
  return { ok: true };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(PARAMS.saltLength);
  const derived = await scrypt(password.normalize('NFKC'), salt, PARAMS.keyLength, {
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
    maxmem: MAX_MEMORY,
  });

  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$');
}

/**
 * Comparacao em tempo constante. Nunca compara strings diretamente e nunca
 * revela por que a verificacao falhou.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

    const N = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const salt = Buffer.from(parts[4] ?? '', 'base64');
    const expected = Buffer.from(parts[5] ?? '', 'base64');

    if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
    if (salt.length === 0 || expected.length === 0) return false;
    // Limita o custo aceito para que um hash adulterado nao vire negacao de servico.
    if (N > 2 ** 17 || r > 32 || p > 16) return false;

    const derived = await scrypt(password.normalize('NFKC'), salt, expected.length, {
      N,
      r,
      p,
      maxmem: 128 * N * r * 2,
    });

    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Indica se o hash usa parametros antigos e deve ser regravado no proximo login. */
export function needsRehash(stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return true;
  return Number(parts[1]) < PARAMS.N || Number(parts[2]) < PARAMS.r;
}
