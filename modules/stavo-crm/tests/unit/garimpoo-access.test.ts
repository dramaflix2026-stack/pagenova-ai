/**
 * Regras de acesso do Garimpoo.
 *
 * Aqui moram as decisoes que valem dinheiro: quem entra, quem e cortado e o
 * que acontece quando a senha e compartilhada. O repositorio e simulado -- o
 * que se testa e a REGRA, nao o banco.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as EnvModule from '@server/config/env';
import type { GarimpooMember, GarimpooSession } from '@server/db/schema';

const env: Record<string, unknown> = {};

vi.mock('@server/config/env', async (importOriginal) => {
  const original = await importOriginal<typeof EnvModule>();
  Object.assign(env, original.loadEnv(process.env), {
    CAKTO_WEBHOOK_SECRET: 'segredo-de-teste',
    GARIMPOO_DAILY_SEARCH_LIMIT: 3,
    GARIMPOO_SESSION_DAYS: 30,
    GARIMPOO_ACTIVATION_HOURS: 168,
  });
  return { ...original, getEnv: () => env };
});

/** Repositorio simulado: guarda em memoria o que o banco guardaria. */
const banco = {
  membros: new Map<string, GarimpooMember>(),
  sessoes: new Map<string, GarimpooSession>(),
  eventos: new Set<string>(),
  buscasHoje: 0,
  revogadas: [] as Array<{ id: string; motivo: string }>,
  sessoesCriadas: [] as Array<{ memberId: string; deviceId: string }>,
};

vi.mock('@server/modules/garimpoo/repository', () => ({
  findMemberByEmail: async (email: string) =>
    [...banco.membros.values()].find((m) => m.email === email.toLowerCase()) ?? null,
  findMemberById: async (id: string) => banco.membros.get(id) ?? null,
  upsertMemberFromPurchase: async (input: { email: string; orderId?: string | null }) => {
    const existente = [...banco.membros.values()].find((m) => m.email === input.email);
    if (existente) {
      existente.status = existente.passwordHash ? 'ACTIVE' : 'PENDING';
      existente.revokedAt = null;
      existente.lastOrderId = input.orderId ?? existente.lastOrderId;
      return { member: existente, created: false };
    }
    const membro = criarMembro({ email: input.email, lastOrderId: input.orderId ?? null });
    return { member: membro, created: true };
  },
  activateMember: async (id: string, hash: string) => {
    const membro = banco.membros.get(id)!;
    membro.passwordHash = hash;
    membro.status = 'ACTIVE';
    membro.activatedAt = new Date();
  },
  revokeMember: async (id: string, motivo: string) => {
    const membro = banco.membros.get(id)!;
    membro.status = 'REVOKED';
    membro.revokedReason = motivo;
    membro.revokedAt = new Date();
  },
  touchLogin: async () => undefined,
  createSessionRevokingOthers: async (input: { memberId: string; deviceId: string; tokenHash: string }) => {
    banco.sessoesCriadas.push({ memberId: input.memberId, deviceId: input.deviceId });
    for (const sessao of banco.sessoes.values()) {
      if (sessao.memberId === input.memberId && !sessao.revokedAt) {
        sessao.revokedAt = new Date();
        sessao.revokedReason = 'NEW_LOGIN';
      }
    }
    const id = `sessao-${banco.sessoes.size + 1}`;
    banco.sessoes.set(input.tokenHash, {
      id,
      memberId: input.memberId,
      tokenHash: input.tokenHash,
      deviceId: input.deviceId,
      deviceLabel: null,
      ipHash: null,
      createdAt: new Date(),
      lastSeenAt: new Date(),
      expiresAt: new Date(Date.now() + 86_400_000),
      revokedAt: null,
      revokedReason: null,
    } as GarimpooSession);
    return id;
  },
  findSessionByTokenHash: async (hash: string) => banco.sessoes.get(hash) ?? null,
  touchSession: async () => undefined,
  revokeSession: async (id: string, motivo: string) => {
    banco.revogadas.push({ id, motivo });
    for (const sessao of banco.sessoes.values()) {
      if (sessao.id === id) {
        sessao.revokedAt = new Date();
        sessao.revokedReason = motivo;
      }
    }
  },
  countSearchesSince: async () => banco.buscasHoje,
  logSearch: async () => undefined,
  recordWebhookEvent: async (input: { externalId: string }) => {
    if (banco.eventos.has(input.externalId)) return false;
    banco.eventos.add(input.externalId);
    return true;
  },
}));

const servico = await import('@server/modules/garimpoo/service');
const { hashPassword } = await import('@server/modules/auth/password');

function criarMembro(overrides: Partial<GarimpooMember> & { email: string }): GarimpooMember {
  const membro = {
    id: `membro-${banco.membros.size + 1}`,
    name: null,
    phone: null,
    status: 'PENDING',
    source: 'CAKTO',
    lastOrderId: null,
    caktoCustomerId: null,
    passwordHash: null,
    dailySearchLimit: null,
    purchasedAt: new Date(),
    activatedAt: null,
    lastLoginAt: null,
    revokedAt: null,
    revokedReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as GarimpooMember;
  banco.membros.set(membro.id, membro);
  return membro;
}

const bancoFalso = {} as never;

beforeEach(() => {
  banco.membros.clear();
  banco.sessoes.clear();
  banco.eventos.clear();
  banco.buscasHoje = 0;
  banco.revogadas = [];
  banco.sessoesCriadas = [];
});

describe('webhook: o que concede e o que corta acesso', () => {
  it('compra aprovada concede, em portugues ou ingles', () => {
    for (const evento of ['purchase_approved', 'compra_aprovada', 'payment.paid', 'subscription_renewed']) {
      expect(servico.classifyCaktoEvent(evento), evento).toBe('GRANT');
    }
  });

  it('reembolso, chargeback e cancelamento cortam', () => {
    for (const evento of ['refund', 'reembolso_aprovado', 'chargeback', 'subscription_canceled', 'expired']) {
      expect(servico.classifyCaktoEvent(evento), evento).toBe('REVOKE');
    }
  });

  it('no empate, a decisao segura e cortar', () => {
    // "refund_approved" contem "approved" E "refund": tem que revogar.
    expect(servico.classifyCaktoEvent('refund_approved')).toBe('REVOKE');
  });

  it('evento desconhecido nao mexe em acesso', () => {
    expect(servico.classifyCaktoEvent('cart_abandoned')).toBe('IGNORE');
  });

  it('sem segredo configurado, o webhook fica fechado', () => {
    expect(servico.checkWebhookSecret('segredo-de-teste')).toBe(true);
    expect(servico.checkWebhookSecret('errado')).toBe(false);
    expect(servico.checkWebhookSecret(undefined)).toBe(false);

    env.CAKTO_WEBHOOK_SECRET = '';
    expect(servico.checkWebhookSecret('qualquer')).toBe(false);
    env.CAKTO_WEBHOOK_SECRET = 'segredo-de-teste';
  });

  it('le o e-mail e o pedido nos formatos que a Cakto usa', () => {
    const dados = servico.extractCaktoData({
      id: 'evt_1',
      event: 'purchase_approved',
      data: { id: 'ped_99', customer: { email: 'Maria@Exemplo.com', name: 'Maria', phone: '11999' } },
    });
    expect(dados.email).toBe('maria@exemplo.com');
    expect(dados.orderId).toBe('ped_99');
    expect(dados.externalId).toBe('evt_1');
  });
});

describe('webhook: efeito no acesso', () => {
  it('compra cria o membro pendente de ativacao', async () => {
    const resultado = await servico.handleCaktoEvent(
      { id: 'evt_1', event: 'purchase_approved', data: { id: 'ped_1', customer: { email: 'ana@x.com' } } },
      bancoFalso,
    );

    expect(resultado.decision).toBe('GRANT');
    const membro = [...banco.membros.values()][0]!;
    expect(membro.status).toBe('PENDING');
    expect(membro.lastOrderId).toBe('ped_1');
  });

  it('o mesmo evento reenviado nao faz efeito duas vezes', async () => {
    const evento = { id: 'evt_1', event: 'purchase_approved', data: { id: 'ped_1', customer: { email: 'ana@x.com' } } };
    await servico.handleCaktoEvent(evento, bancoFalso);
    const segundo = await servico.handleCaktoEvent(evento, bancoFalso);

    expect(segundo.applied).toBe(false);
    expect(segundo.outcome).toContain('repetido');
    expect(banco.membros.size).toBe(1);
  });

  it('reembolso revoga o acesso de quem ja estava usando', async () => {
    const membro = criarMembro({ email: 'ana@x.com', status: 'ACTIVE', passwordHash: 'hash' });

    await servico.handleCaktoEvent(
      { id: 'evt_2', event: 'refund_approved', data: { id: 'ped_1', customer: { email: 'ana@x.com' } } },
      bancoFalso,
    );

    expect(banco.membros.get(membro.id)!.status).toBe('REVOKED');
    expect(banco.membros.get(membro.id)!.revokedReason).toBe('REFUND');
  });

  it('chargeback e cancelamento gravam motivos diferentes', async () => {
    const a = criarMembro({ email: 'a@x.com', status: 'ACTIVE', passwordHash: 'h' });
    const b = criarMembro({ email: 'b@x.com', status: 'ACTIVE', passwordHash: 'h' });

    await servico.handleCaktoEvent(
      { id: 'evt_3', event: 'chargeback', data: { customer: { email: 'a@x.com' } } },
      bancoFalso,
    );
    await servico.handleCaktoEvent(
      { id: 'evt_4', event: 'subscription_canceled', data: { customer: { email: 'b@x.com' } } },
      bancoFalso,
    );

    expect(banco.membros.get(a.id)!.revokedReason).toBe('CHARGEBACK');
    expect(banco.membros.get(b.id)!.revokedReason).toBe('SUBSCRIPTION_CANCELED');
  });

  it('recompra depois de reembolso reativa, sem apagar a senha', async () => {
    const membro = criarMembro({
      email: 'ana@x.com',
      status: 'REVOKED',
      passwordHash: 'hash-antigo',
      revokedReason: 'REFUND',
    });

    await servico.handleCaktoEvent(
      { id: 'evt_5', event: 'purchase_approved', data: { id: 'ped_2', customer: { email: 'ana@x.com' } } },
      bancoFalso,
    );

    const atual = banco.membros.get(membro.id)!;
    expect(atual.status).toBe('ACTIVE');
    expect(atual.passwordHash).toBe('hash-antigo');
  });
});

describe('ativacao: o pedido e a prova de compra', () => {
  const dados = { email: 'ana@x.com', orderId: 'ped_1', password: 'SenhaForte2026!' };

  it('ativa quando e-mail e pedido conferem', async () => {
    criarMembro({ email: 'ana@x.com', lastOrderId: 'ped_1' });
    const membro = await servico.activateAccess(dados, bancoFalso);

    expect(membro.status).toBe('ACTIVE');
    expect(membro.passwordHash).toBeTruthy();
  });

  it('saber o e-mail nao basta: pedido errado e recusado', async () => {
    criarMembro({ email: 'ana@x.com', lastOrderId: 'ped_1' });
    await expect(servico.activateAccess({ ...dados, orderId: 'ped_errado' }, bancoFalso)).rejects.toThrow(
      /Nao encontramos essa compra/,
    );
  });

  it('e-mail sem compra nenhuma recebe a mesma mensagem, sem revelar nada', async () => {
    await expect(servico.activateAccess(dados, bancoFalso)).rejects.toThrow(/Nao encontramos essa compra/);
  });

  it('quem foi reembolsado nao consegue ativar', async () => {
    criarMembro({ email: 'ana@x.com', lastOrderId: 'ped_1', status: 'REVOKED' });
    await expect(servico.activateAccess(dados, bancoFalso)).rejects.toThrow(/encerrado/);
  });

  it('conta ja ativada manda entrar com a senha', async () => {
    criarMembro({ email: 'ana@x.com', lastOrderId: 'ped_1', passwordHash: 'hash', status: 'ACTIVE' });
    await expect(servico.activateAccess(dados, bancoFalso)).rejects.toThrow(/ja foi ativada/);
  });

  it('senha fraca e recusada', async () => {
    criarMembro({ email: 'ana@x.com', lastOrderId: 'ped_1' });
    await expect(servico.activateAccess({ ...dados, password: '123456' }, bancoFalso)).rejects.toThrow();
  });

  it('pedido antigo perde a validade', async () => {
    const antigo = new Date(Date.now() - 200 * 60 * 60 * 1000); // 200h atras
    criarMembro({ email: 'ana@x.com', lastOrderId: 'ped_1', purchasedAt: antigo });
    await expect(servico.activateAccess(dados, bancoFalso)).rejects.toThrow(/prazo/);
  });
});

describe('login e sessao unica', () => {
  const senha = 'SenhaForte2026!';

  async function membroAtivo(email = 'ana@x.com'): Promise<GarimpooMember> {
    return criarMembro({ email, status: 'ACTIVE', passwordHash: await hashPassword(senha) });
  }

  it('entra com a senha certa e prende a sessao ao dispositivo', async () => {
    const membro = await membroAtivo();
    const resultado = await servico.login(
      { email: membro.email, password: senha, deviceId: 'disp-1', deviceLabel: 'Android' },
      bancoFalso,
    );

    expect(resultado.token).toBeTruthy();
    expect(banco.sessoesCriadas[0]!.deviceId).toBe('disp-1');
  });

  it('senha errada e e-mail inexistente dao a MESMA resposta', async () => {
    await membroAtivo();
    const erroSenha = await servico
      .login({ email: 'ana@x.com', password: 'errada', deviceId: 'd', deviceLabel: null }, bancoFalso)
      .catch((e: Error) => e.message);
    const erroEmail = await servico
      .login({ email: 'ninguem@x.com', password: senha, deviceId: 'd', deviceLabel: null }, bancoFalso)
      .catch((e: Error) => e.message);

    expect(erroSenha).toBe(erroEmail);
  });

  it('revogado nao entra, mesmo com a senha certa', async () => {
    const membro = await membroAtivo();
    membro.status = 'REVOKED';

    await expect(
      servico.login({ email: membro.email, password: senha, deviceId: 'd', deviceLabel: null }, bancoFalso),
    ).rejects.toThrow(/encerrado/);
  });

  it('entrar em outro lugar derruba a sessao anterior', async () => {
    const membro = await membroAtivo();
    const primeira = await servico.login(
      { email: membro.email, password: senha, deviceId: 'disp-1', deviceLabel: null },
      bancoFalso,
    );
    await servico.login(
      { email: membro.email, password: senha, deviceId: 'disp-2', deviceLabel: null },
      bancoFalso,
    );

    // Quem compartilhou a senha perde o acesso ao usar em dois lugares.
    const continua = await servico.resolveSession(primeira.token, 'disp-1', bancoFalso);
    expect(continua).toBeNull();
  });

  it('copiar o cookie para outro navegador nao funciona', async () => {
    const membro = await membroAtivo();
    const sessao = await servico.login(
      { email: membro.email, password: senha, deviceId: 'disp-1', deviceLabel: null },
      bancoFalso,
    );

    const roubada = await servico.resolveSession(sessao.token, 'disp-do-amigo', bancoFalso);
    expect(roubada).toBeNull();
    // A sessao original tambem morre: uso em outro aparelho e sinal de vazamento.
    expect(banco.revogadas.some((r) => r.motivo === 'DEVICE_MISMATCH')).toBe(true);
  });

  it('reembolso no meio do uso derruba a sessao aberta', async () => {
    const membro = await membroAtivo();
    const sessao = await servico.login(
      { email: membro.email, password: senha, deviceId: 'disp-1', deviceLabel: null },
      bancoFalso,
    );

    membro.status = 'REVOKED';
    expect(await servico.resolveSession(sessao.token, 'disp-1', bancoFalso)).toBeNull();
  });
});

describe('cota diaria', () => {
  it('conta o que ja foi gasto e o que sobra', async () => {
    const membro = criarMembro({ email: 'ana@x.com', status: 'ACTIVE' });
    banco.buscasHoje = 2;

    const status = await servico.quotaStatus(membro, bancoFalso);
    expect(status).toEqual({ used: 2, limit: 3, remaining: 1 });
  });

  it('bloqueia quando a cota do dia acaba', async () => {
    const membro = criarMembro({ email: 'ana@x.com', status: 'ACTIVE' });
    banco.buscasHoje = 3;

    await expect(servico.assertQuotaAvailable(membro, bancoFalso)).rejects.toThrow(/limite diario/);
  });

  it('limite proprio do membro vence o padrao do ambiente', async () => {
    const membro = criarMembro({ email: 'vip@x.com', status: 'ACTIVE', dailySearchLimit: 100 });
    banco.buscasHoje = 50;

    const status = await servico.quotaStatus(membro, bancoFalso);
    expect(status.limit).toBe(100);
    expect(status.remaining).toBe(50);
  });
});
