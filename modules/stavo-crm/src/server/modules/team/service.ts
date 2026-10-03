/**
 * Equipe: socios, funcionarios e suporte.
 *
 * Protecoes que existem aqui e nao dependem da tela:
 *  - a conta nunca fica sem nenhum dono ativo (senao ninguem gerencia mais
 *    nada, e so um acesso ao banco resolveria);
 *  - ninguem rebaixa nem desativa a si mesmo, pelo mesmo motivo;
 *  - desativar ou trocar o cargo derruba as sessoes abertas da pessoa: um
 *    cargo antigo nao pode continuar valendo na aba que ela deixou aberta;
 *  - desativar NAO apaga os leads dela -- eles voltam a ficar sem dono, para
 *    que o dono da conta redistribua.
 */
import { and, asc, count, eq, ne } from 'drizzle-orm';

import type { CreateTeamMemberInput, UpdateTeamMemberInput } from '../../../shared/schemas';
import { USER_ROLE_LABELS, type UserRole } from '../../../shared/roles';
import type { Database } from '../../db/client';
import { auditLog, leads, users } from '../../db/schema';
import { isDuplicateKeyError } from '../../db/client';
import { conflict, notFound, unprocessable } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { checkPasswordStrength, hashPassword } from '../auth/password';
import { revokeAllSessions } from '../auth/sessions';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  /** Quantos leads esta pessoa trabalha hoje. */
  leadCount: number;
}

export async function listTeam(db: Database): Promise<TeamMember[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.name), asc(users.email));

  const carteiras = await db
    .select({ ownerUserId: leads.ownerUserId, total: count() })
    .from(leads)
    .groupBy(leads.ownerUserId);

  const porDono = new Map(carteiras.map((linha) => [linha.ownerUserId, Number(linha.total)]));

  return rows.map((linha) => ({
    ...linha,
    role: linha.role as UserRole,
    // Sem nome cadastrado (o administrador original), o e-mail identifica.
    name: linha.name.trim() || linha.email,
    leadCount: porDono.get(linha.id) ?? 0,
  }));
}

async function contarDonosAtivos(db: Database, exceptUserId?: string): Promise<number> {
  const [linha] = await db
    .select({ total: count() })
    .from(users)
    .where(
      and(
        eq(users.role, 'OWNER'),
        eq(users.active, true),
        ...(exceptUserId ? [ne(users.id, exceptUserId)] : []),
      ),
    );
  return Number(linha?.total ?? 0);
}

export async function createTeamMember(
  db: Database,
  input: CreateTeamMemberInput,
  actorUserId: string,
): Promise<TeamMember> {
  const forca = checkPasswordStrength(input.password);
  if (!forca.ok) {
    throw unprocessable(forca.reason ?? 'Senha inicial muito fraca.', {
      code: 'WEAK_PASSWORD',
      fieldErrors: { password: [forca.reason ?? 'Escolha uma senha mais forte.'] },
    });
  }

  const email = input.email.toLowerCase();
  const now = new Date();
  const userId = newId();

  try {
    await db.insert(users).values({
      id: userId,
      email,
      name: input.name,
      role: input.role,
      passwordHash: await hashPassword(input.password),
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw conflict('Ja existe um colaborador com este e-mail.', { code: 'EMAIL_IN_USE' });
    }
    throw error;
  }

  await db.insert(auditLog).values({
    id: newId(),
    action: 'TEAM_MEMBER_CREATED',
    entityType: 'users',
    entityId: userId,
    actorUserId,
    summary: `${input.name} adicionado como ${USER_ROLE_LABELS[input.role]}.`,
    metadata: { role: input.role },
    occurredAt: now,
  });

  return {
    id: userId,
    name: input.name,
    email,
    role: input.role,
    active: true,
    lastLoginAt: null,
    createdAt: now,
    leadCount: 0,
  };
}

export async function updateTeamMember(
  db: Database,
  userId: string,
  input: UpdateTeamMemberInput,
  actorUserId: string,
): Promise<void> {
  const [alvo] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!alvo) throw notFound('Colaborador nao encontrado.');

  const mudaCargo = input.role !== undefined && input.role !== alvo.role;
  const desativa = input.active === false && alvo.active;

  if (userId === actorUserId && (mudaCargo || desativa)) {
    throw unprocessable(
      'Voce nao pode mudar o proprio cargo nem se desativar. Peca a outro dono da conta.',
      { code: 'SELF_DEMOTION' },
    );
  }

  // Perder o ultimo dono ativo deixaria a conta sem ninguem para gerenciar a
  // equipe: nao haveria caminho de volta pela propria aplicacao.
  const perdeDono = alvo.role === 'OWNER' && (desativa || (mudaCargo && input.role !== 'OWNER'));
  if (perdeDono && (await contarDonosAtivos(db, userId)) === 0) {
    throw unprocessable(
      'Esta e a unica pessoa com cargo de dono da conta. Promova outra antes de mudar esta.',
      { code: 'LAST_OWNER' },
    );
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    // Os leads voltam ao pote comum em vez de ficarem presos a alguem que
    // nao entra mais no sistema.
    if (desativa) {
      await tx.update(leads).set({ ownerUserId: null }).where(eq(leads.ownerUserId, userId));
    }

    await tx.insert(auditLog).values({
      id: newId(),
      action: desativa ? 'TEAM_MEMBER_DEACTIVATED' : 'TEAM_MEMBER_UPDATED',
      entityType: 'users',
      entityId: userId,
      actorUserId,
      summary: desativa
        ? `${alvo.name || alvo.email} desativado. Os leads dele ficaram sem dono.`
        : `${alvo.name || alvo.email} atualizado.`,
      metadata: {
        ...(input.role !== undefined ? { fromRole: alvo.role, toRole: input.role } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
      occurredAt: now,
    });
  });

  // Fora da transacao: a sessao antiga nao pode sobreviver ao novo cargo.
  if (mudaCargo || desativa) {
    await revokeAllSessions(db, userId);
  }
}

export async function resetTeamMemberPassword(
  db: Database,
  userId: string,
  password: string,
  actorUserId: string,
): Promise<void> {
  const [alvo] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!alvo) throw notFound('Colaborador nao encontrado.');

  const forca = checkPasswordStrength(password);
  if (!forca.ok) {
    throw unprocessable(forca.reason ?? 'Senha muito fraca.', {
      code: 'WEAK_PASSWORD',
      fieldErrors: { password: [forca.reason ?? 'Escolha uma senha mais forte.'] },
    });
  }

  const now = new Date();

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), passwordChangedAt: now, updatedAt: now })
    .where(eq(users.id, userId));

  // Trocar a senha derruba todas as sessoes: e o unico jeito de expulsar
  // alguem que ja esta dentro.
  await revokeAllSessions(db, userId);

  await db.insert(auditLog).values({
    id: newId(),
    action: 'TEAM_MEMBER_PASSWORD_RESET',
    entityType: 'users',
    entityId: userId,
    actorUserId,
    summary: `Senha de ${alvo.name || alvo.email} redefinida.`,
    metadata: null,
    occurredAt: now,
  });
}
