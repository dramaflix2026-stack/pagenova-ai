/**
 * Regras de acesso do Garimpoo.
 *
 * Tres decisoes sustentam este arquivo:
 *
 *  1. **Pagamento e a unica porta.** Nao existe cadastro. Um membro nasce de
 *     um evento de compra da Cakto e morre em reembolso, chargeback ou
 *     cancelamento. Nenhuma tela cria acesso.
 *  2. **Ativacao prova a compra.** Para escolher a senha, a pessoa informa o
 *     e-mail da compra E o numero do pedido. Sem o pedido, bastaria saber o
 *     e-mail de alguem da comunidade para roubar o acesso.
 *  3. **Compartilhar da trabalho.** A sessao gruda no dispositivo e e unica:
 *     entrar em outro lugar derruba o primeiro. O IP e guardado so como
 *     sinal -- travar por IP derrubaria quem sai do Wi-Fi para o 4G.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { getEnv } from '../../config/env';
import { getDb, type Database } from '../../db/client';
import type { GarimpooMember, GarimpooSession } from '../../db/schema';
import { badRequest, forbidden, tooManyRequests, unauthorized } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { checkPasswordStrength, hashPassword, verifyPassword } from '../auth/password';
import * as repo from './repository';

export const GARIMPOO_SESSION_COOKIE = 'garimpoo_sessao';
export const GARIMPOO_DEVICE_COOKIE = 'garimpoo_dispositivo';

/** Mensagem unica para credencial errada: nao revela quem e membro. */
const ERRO_LOGIN = 'E-mail ou senha incorretos.';

const sha256 = (valor: string): string => createHash('sha256').update(valor).digest('hex');

/** IP nunca e guardado em claro: serve para comparar, nao para identificar. */
const hashIp = (ip: string | undefined): string | null => (ip ? sha256(`garimpoo:${ip}`) : null);

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

// ---------------------------------------------------------------------------
// Webhook da Cakto
// ---------------------------------------------------------------------------

/**
 * Eventos que concedem e que cortam acesso.
 *
 * A Cakto nomeia eventos em portugues e em ingles conforme a integracao, e o
 * nome pode ganhar variantes com o tempo. Por isso a checagem e por palavra
 * contida, nao por igualdade exata -- e o que ainda acontece quando a
 * plataforma renomeia `purchase_approved` para `purchase.approved`.
 */
const CONCEDE = ['approved', 'aprovad', 'paid', 'pago', 'completed', 'renew', 'renov'];
const REVOGA = ['refund', 'reembols', 'estorn', 'chargeback', 'cancel', 'expired', 'expirad', 'dispute'];

export type CaktoDecision = 'GRANT' | 'REVOKE' | 'IGNORE';

export function classifyCaktoEvent(eventType: string): CaktoDecision {
  const tipo = eventType.toLowerCase();
  // Revogacao primeiro: "refund_approved" concede e revoga ao mesmo tempo, e
  // no empate a decisao segura e tirar o acesso.
  if (REVOGA.some((palavra) => tipo.includes(palavra))) return 'REVOKE';
  if (CONCEDE.some((palavra) => tipo.includes(palavra))) return 'GRANT';
  return 'IGNORE';
}

/** Compara o segredo sem vazar tempo. */
export function checkWebhookSecret(recebido: string | undefined): boolean {
  const esperado = getEnv().CAKTO_WEBHOOK_SECRET?.trim();
  if (!esperado) return false; // sem segredo configurado, o webhook fica fechado
  if (!recebido) return false;

  const a = Buffer.from(sha256(recebido));
  const b = Buffer.from(sha256(esperado));
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Campos que interessam no corpo do webhook.
 *
 * A Cakto envia bem mais que isto (endereco, valores, dados de cartao). Nada
 * disso e lido nem guardado: a ferramenta precisa saber quem comprou e se a
 * compra continua valendo, e so.
 */
export interface CaktoWebhookBody {
  event?: string;
  type?: string;
  id?: string;
  data?: {
    id?: string;
    status?: string;
    customer?: { email?: string; name?: string; phone?: string; id?: string };
    email?: string;
    name?: string;
    phone?: string;
    order_id?: string;
    orderId?: string;
  };
  [key: string]: unknown;
}

interface DadosDoEvento {
  externalId: string;
  eventType: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  orderId: string | null;
  customerId: string | null;
}

/** Le o corpo em qualquer um dos formatos que a Cakto usa. */
export function extractCaktoData(body: CaktoWebhookBody): DadosDoEvento {
  const data = body.data ?? {};
  const customer = data.customer ?? {};
  const orderId = data.order_id ?? data.orderId ?? data.id ?? null;
  const eventType = body.event ?? body.type ?? data.status ?? 'desconhecido';
  const email = customer.email ?? data.email ?? null;

  return {
    // Sem id de evento, a idempotencia cai para tipo + pedido: ainda impede o
    // reenvio do MESMO evento, que e o caso real de duplicata.
    externalId: body.id ?? `${eventType}:${orderId ?? email ?? 'sem-id'}`,
    eventType,
    email: email ? normalizeEmail(email) : null,
    name: customer.name ?? data.name ?? null,
    phone: customer.phone ?? data.phone ?? null,
    orderId,
    customerId: customer.id ?? null,
  };
}

export interface WebhookResult {
  applied: boolean;
  decision: CaktoDecision;
  outcome: string;
}

/**
 * Processa um evento da Cakto.
 *
 * Nunca lanca por evento desconhecido: devolver erro faria a Cakto reenviar
 * para sempre um evento que nunca vamos entender. Erro aqui e so para falha
 * real de banco.
 */
export async function handleCaktoEvent(
  body: CaktoWebhookBody,
  db: Database = getDb(),
): Promise<WebhookResult> {
  const dados = extractCaktoData(body);
  const decisao = classifyCaktoEvent(dados.eventType);

  if (decisao === 'IGNORE' || !dados.email) {
    const outcome = dados.email ? `Evento "${dados.eventType}" nao mexe em acesso.` : 'Evento sem e-mail.';
    await repo.recordWebhookEvent(
      { ...dados, status: 'IGNORED', outcome },
      db,
    );
    return { applied: false, decision: 'IGNORE', outcome };
  }

  const novo = await repo.recordWebhookEvent(
    { ...dados, status: 'APPLIED', outcome: decisao === 'GRANT' ? 'Acesso concedido.' : 'Acesso revogado.' },
    db,
  );

  if (!novo) {
    return { applied: false, decision: decisao, outcome: 'Evento repetido; nada mudou.' };
  }

  if (decisao === 'GRANT') {
    const { created } = await repo.upsertMemberFromPurchase(
      {
        email: dados.email,
        name: dados.name,
        phone: dados.phone,
        orderId: dados.orderId,
        customerId: dados.customerId,
      },
      db,
    );
    logger.info({ garimpoo: { evento: dados.eventType, novo: created } }, 'Garimpoo: acesso liberado.');
    return { applied: true, decision: 'GRANT', outcome: created ? 'Membro criado.' : 'Membro reativado.' };
  }

  const membro = await repo.findMemberByEmail(dados.email, db);
  if (!membro) {
    return { applied: false, decision: 'REVOKE', outcome: 'Nao havia membro com esse e-mail.' };
  }

  const motivo = dados.eventType.toLowerCase().includes('charge')
    ? 'CHARGEBACK'
    : dados.eventType.toLowerCase().includes('cancel')
      ? 'SUBSCRIPTION_CANCELED'
      : 'REFUND';

  await repo.revokeMember(membro.id, motivo, db);
  logger.info({ garimpoo: { evento: dados.eventType, motivo } }, 'Garimpoo: acesso revogado.');
  return { applied: true, decision: 'REVOKE', outcome: `Acesso revogado (${motivo}).` };
}

// ---------------------------------------------------------------------------
// Ativacao e login
// ---------------------------------------------------------------------------

export interface ActivateInput {
  email: string;
  orderId: string;
  password: string;
}

/**
 * Ativa a conta: valida a compra e grava a senha escolhida.
 *
 * O prazo (`GARIMPOO_ACTIVATION_HOURS`) existe para que um pedido antigo e
 * reembolsado nao continue valendo como prova para sempre.
 */
export async function activateAccess(input: ActivateInput, db: Database = getDb()): Promise<GarimpooMember> {
  const email = normalizeEmail(input.email);
  const membro = await repo.findMemberByEmail(email, db);

  const generico = badRequest(
    'Nao encontramos essa compra. Confira o e-mail e o numero do pedido que a Cakto enviou.',
    { code: 'GARIMPOO_PURCHASE_NOT_FOUND' },
  );

  if (!membro || !membro.lastOrderId) throw generico;
  if (membro.status === 'REVOKED') {
    throw forbidden('Este acesso foi encerrado. Se voce reassinou, use o pedido novo.');
  }
  if (membro.passwordHash) {
    throw badRequest('Esta conta ja foi ativada. Entre com a sua senha.', { code: 'GARIMPOO_ALREADY_ACTIVE' });
  }

  // Comparacao em tempo constante: o numero do pedido e o segredo aqui.
  const informado = Buffer.from(sha256(input.orderId.trim()));
  const esperado = Buffer.from(sha256(membro.lastOrderId));
  if (informado.length !== esperado.length || !timingSafeEqual(informado, esperado)) throw generico;

  const prazoHoras = getEnv().GARIMPOO_ACTIVATION_HOURS;
  const comprouEm = membro.purchasedAt?.getTime() ?? 0;
  if (Date.now() - comprouEm > prazoHoras * 60 * 60 * 1000) {
    throw badRequest(
      `O prazo de ${prazoHoras}h para ativar terminou. Chame o suporte na comunidade.`,
      { code: 'GARIMPOO_ACTIVATION_EXPIRED' },
    );
  }

  const forca = checkPasswordStrength(input.password);
  if (!forca.ok) {
    throw badRequest(forca.reason ?? 'Senha recusada.', {
      code: 'WEAK_PASSWORD',
      fieldErrors: { password: [forca.reason ?? 'Senha recusada.'] },
    });
  }

  await repo.activateMember(membro.id, await hashPassword(input.password), db);
  return (await repo.findMemberById(membro.id, db))!;
}

export interface LoginInput {
  email: string;
  password: string;
  deviceId: string;
  deviceLabel: string | null;
  ip?: string | undefined;
}

export interface LoginResult {
  member: GarimpooMember;
  /** Token bruto do cookie. So existe aqui: o banco guarda o hash. */
  token: string;
  expiresAt: Date;
}

export async function login(input: LoginInput, db: Database = getDb()): Promise<LoginResult> {
  const email = normalizeEmail(input.email);
  const membro = await repo.findMemberByEmail(email, db);

  // Paga o custo do hash mesmo sem membro, para o tempo de resposta nao
  // revelar quem comprou o acesso.
  const hashArmazenado =
    membro?.passwordHash ??
    'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
  const senhaConfere = await verifyPassword(input.password, hashArmazenado);

  if (!membro || !senhaConfere) throw unauthorized(ERRO_LOGIN);
  if (membro.status === 'REVOKED') {
    throw forbidden('Este acesso foi encerrado. Reassine a comunidade para voltar a usar.');
  }
  if (membro.status !== 'ACTIVE' || !membro.passwordHash) {
    throw badRequest('Conta ainda nao ativada. Use a pagina de ativacao com o numero do pedido.', {
      code: 'GARIMPOO_NOT_ACTIVATED',
    });
  }

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + getEnv().GARIMPOO_SESSION_DAYS * 24 * 60 * 60 * 1000);

  await repo.createSessionRevokingOthers(
    {
      memberId: membro.id,
      tokenHash: sha256(token),
      deviceId: input.deviceId,
      deviceLabel: input.deviceLabel,
      ipHash: hashIp(input.ip),
      expiresAt,
    },
    db,
  );
  await repo.touchLogin(membro.id, db);

  return { member: membro, token, expiresAt };
}

export interface SessionContext {
  member: GarimpooMember;
  session: GarimpooSession;
}

/**
 * Valida a sessao do cookie contra o dispositivo.
 *
 * Copiar o cookie de sessao para outro navegador nao basta: o `deviceId` vem
 * de um cookie separado, de vida longa, e a sessao so vale no dispositivo em
 * que nasceu. Se os dois nao baterem, a sessao morre na hora.
 */
export async function resolveSession(
  token: string | undefined,
  deviceId: string | undefined,
  db: Database = getDb(),
): Promise<SessionContext | null> {
  if (!token || !deviceId) return null;

  const sessao = await repo.findSessionByTokenHash(sha256(token), db);
  if (!sessao || sessao.revokedAt) return null;

  if (sessao.expiresAt.getTime() < Date.now()) {
    await repo.revokeSession(sessao.id, 'EXPIRED', db);
    return null;
  }

  if (sessao.deviceId !== deviceId) {
    await repo.revokeSession(sessao.id, 'DEVICE_MISMATCH', db);
    logger.warn({ garimpoo: { sessao: sessao.id } }, 'Garimpoo: sessao usada em outro dispositivo.');
    return null;
  }

  const membro = await repo.findMemberById(sessao.memberId, db);
  if (!membro || membro.status !== 'ACTIVE') {
    await repo.revokeSession(sessao.id, 'REVOKED_MEMBER', db);
    return null;
  }

  await repo.touchSession(sessao.id, db);
  return { member: membro, session: sessao };
}

export async function logout(sessionId: string, db: Database = getDb()): Promise<void> {
  await repo.revokeSession(sessionId, 'LOGOUT', db);
}

// ---------------------------------------------------------------------------
// Cota diaria
// ---------------------------------------------------------------------------

export interface QuotaStatus {
  used: number;
  limit: number;
  remaining: number;
}

const inicioDoDia = (agora = new Date()): Date =>
  new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

export async function quotaStatus(member: GarimpooMember, db: Database = getDb()): Promise<QuotaStatus> {
  const limit = member.dailySearchLimit ?? getEnv().GARIMPOO_DAILY_SEARCH_LIMIT;
  const used = await repo.countSearchesSince(member.id, inicioDoDia(), db);
  return { used, limit, remaining: Math.max(0, limit - used) };
}

/**
 * Recusa a busca quando o membro ja gastou a cota do dia.
 *
 * Sem isto, um membro sozinho consome a cota paga do Google e derruba a
 * ferramenta para a comunidade inteira no mesmo dia.
 */
export async function assertQuotaAvailable(
  member: GarimpooMember,
  db: Database = getDb(),
): Promise<QuotaStatus> {
  const status = await quotaStatus(member, db);
  if (status.remaining <= 0) {
    throw tooManyRequests(
      `Voce ja fez ${status.used} buscas hoje, o limite diario. Amanha o contador zera.`,
      'GARIMPOO_DAILY_LIMIT',
    );
  }
  return status;
}

export { hashIp, sha256 };
