/**
 * Hash de senha, forca minima e regras de evento singular.
 */
import { describe, expect, it } from 'vitest';

import {
  checkPasswordStrength,
  hashPassword,
  needsRehash,
  verifyPassword,
} from '@server/modules/auth/password';
import { progressiveDelayMs } from '@server/modules/auth/service';
import { isSingletonEvent, SINGLETON_EVENT_TYPES } from '@server/modules/leads/events';
import { safeCompare } from '@server/modules/auth/sessions';

describe('forca da senha', () => {
  it('exige pelo menos 12 caracteres', () => {
    expect(checkPasswordStrength('curta123').ok).toBe(false);
    expect(checkPasswordStrength('senhaMuitoBoa2026!').ok).toBe(true);
  });

  it('recusa senhas obvias e repetitivas', () => {
    expect(checkPasswordStrength('senha123456').ok).toBe(false);
    expect(checkPasswordStrength('aaaaaaaaaaaaaa').ok).toBe(false);
    expect(checkPasswordStrength('ababababababab').ok).toBe(false);
  });

  it('sempre explica o motivo da recusa', () => {
    const result = checkPasswordStrength('curta');
    expect(result.ok).toBe(false);
    expect(result.reason).toBeTruthy();
  });
});

describe('hash de senha', () => {
  it('gera hash verificavel', async () => {
    const hash = await hashPassword('minhaSenhaSegura2026');
    expect(await verifyPassword('minhaSenhaSegura2026', hash)).toBe(true);
    expect(await verifyPassword('outraSenhaQualquer!!', hash)).toBe(false);
  });

  it('usa salt individual: a mesma senha gera hashes diferentes', async () => {
    const a = await hashPassword('minhaSenhaSegura2026');
    const b = await hashPassword('minhaSenhaSegura2026');
    expect(a).not.toBe(b);
    expect(await verifyPassword('minhaSenhaSegura2026', a)).toBe(true);
    expect(await verifyPassword('minhaSenhaSegura2026', b)).toBe(true);
  });

  it('nao guarda a senha em texto no hash', async () => {
    const hash = await hashPassword('minhaSenhaSegura2026');
    expect(hash).not.toContain('minhaSenhaSegura2026');
    expect(hash.startsWith('scrypt$')).toBe(true);
  });

  it('normaliza unicode antes de derivar', async () => {
    // "á" composto e decomposto precisam validar igual.
    const hash = await hashPassword('senhaComAcentoá123');
    expect(await verifyPassword('senhaComAcentoá123', hash)).toBe(true);
  });

  it('recusa hash malformado sem lancar erro', async () => {
    expect(await verifyPassword('qualquer', 'lixo')).toBe(false);
    expect(await verifyPassword('qualquer', '')).toBe(false);
    expect(await verifyPassword('qualquer', 'scrypt$a$b$c$d$e')).toBe(false);
  });

  it('recusa parametros de custo absurdos (protecao contra DoS)', async () => {
    expect(await verifyPassword('qualquer', 'scrypt$999999999$8$1$AAAA$AAAA')).toBe(false);
  });

  it('detecta hash com parametros antigos', () => {
    expect(needsRehash('scrypt$16384$8$1$AAAA$AAAA')).toBe(true);
    expect(needsRehash('formato-desconhecido')).toBe(true);
  });
});

describe('protecao contra forca bruta', () => {
  it('o atraso cresce com as falhas e tem teto', () => {
    expect(progressiveDelayMs(0)).toBe(0);
    expect(progressiveDelayMs(1)).toBe(0);
    expect(progressiveDelayMs(3)).toBeGreaterThan(0);
    expect(progressiveDelayMs(5)).toBeGreaterThan(progressiveDelayMs(3));
    expect(progressiveDelayMs(50)).toBeLessThanOrEqual(2000);
  });
});

describe('comparacao de tokens', () => {
  it('compara em tempo constante e recusa tamanhos diferentes', () => {
    expect(safeCompare('abc123', 'abc123')).toBe(true);
    expect(safeCompare('abc123', 'abc124')).toBe(false);
    expect(safeCompare('abc', 'abc123')).toBe(false);
    expect(safeCompare('', '')).toBe(true);
  });
});

describe('eventos singulares', () => {
  it('primeiro contato e primeira resposta existem uma unica vez por lead', () => {
    expect(isSingletonEvent('FIRST_CONTACT_RECORDED')).toBe(true);
    expect(isSingletonEvent('FIRST_RESPONSE_RECORDED')).toBe(true);
    expect(SINGLETON_EVENT_TYPES).toHaveLength(2);
  });

  it('tentativas e follow-ups podem se repetir', () => {
    expect(isSingletonEvent('CONTACT_ATTEMPT_RECORDED')).toBe(false);
    expect(isSingletonEvent('FOLLOW_UP_COMPLETED')).toBe(false);
    expect(isSingletonEvent('STAGE_MOVED')).toBe(false);
    expect(isSingletonEvent('PAYMENT_RECEIVED')).toBe(false);
  });
});
