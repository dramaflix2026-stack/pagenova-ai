import { createHmac, timingSafeEqual } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import type { Database } from '../../db/client';
import {
  users,
  workspaceMembers,
  workspaces,
} from '../../db/schema';
import { newId } from '../../lib/ids';

export interface PageNovaIdentity {
  externalUserId: string;
  email: string;
  name: string;
}

function normalize(value: string): string {
  return value.trim();
}

function secureEqual(leftValue: string, rightValue: string): boolean {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function verifyPageNovaIdentity(input: {
  secret: string;
  externalUserId: string;
  email: string;
  name: string;
  timestamp: string;
  signature: string;
}): PageNovaIdentity | null {
  const secret = normalize(input.secret);
  const externalUserId = normalize(input.externalUserId);
  const email = normalize(input.email).toLowerCase();
  const name = normalize(input.name);
  const timestamp = normalize(input.timestamp);
  const signature = normalize(input.signature);

  if (!secret || !externalUserId || !email || !timestamp || !signature) {
    return null;
  }

  const requestTime = Number(timestamp);

  if (!Number.isFinite(requestTime)) {
    return null;
  }

  // Evita replay de uma identidade assinada antiga.
  if (Math.abs(Date.now() - requestTime) > 60_000) {
    return null;
  }

  const payload = [
    externalUserId,
    email,
    name,
    timestamp,
  ].join('\n');

  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (!secureEqual(expected, signature)) {
    return null;
  }

  return {
    externalUserId,
    email,
    name: name || email,
  };
}

export async function provisionPageNovaIdentity(
  db: Database,
  identity: PageNovaIdentity,
) {
  return db.transaction(async (tx) => {
    let [user] = await tx
      .select()
      .from(users)
      .where(eq(users.externalAuthId, identity.externalUserId))
      .limit(1);

    if (!user) {
      const [existingByEmail] = await tx
        .select()
        .from(users)
        .where(eq(users.email, identity.email))
        .limit(1);

      if (existingByEmail) {
        await tx
          .update(users)
          .set({
            externalAuthId: identity.externalUserId,
            name: identity.name || existingByEmail.name,
            active: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingByEmail.id));

        [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, existingByEmail.id))
          .limit(1);
      } else {
        const userId = newId();
        const now = new Date();

        await tx.insert(users).values({
          id: userId,
          externalAuthId: identity.externalUserId,
          email: identity.email,
          name: identity.name,
          role: 'OWNER',
          active: true,

          /*
           * Usuario criado pelo PageNova nao usa login/senha do CRM.
           * O valor abaixo nunca e conhecido pelo usuario e nao concede
           * autenticacao convencional.
           */
          passwordHash: `PAGENOVA_SSO_ONLY:${newId()}`,

          createdAt: now,
          updatedAt: now,
        });

        [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
      }
    }

    if (!user) {
      throw new Error('Nao foi possivel provisionar o usuario PageNova.');
    }

    // O assinante PageNova sempre entra no workspace proprio, identificado
    // pelo mesmo externalUserId do Supabase. Participar da equipe de outro
    // workspace nao pode redirecionar o assinante para dados de terceiros.
    let [workspace] = await tx
      .select()
      .from(workspaces)
      .where(eq(workspaces.externalOwnerId, identity.externalUserId))
      .limit(1);

    if (!workspace) {
      const workspaceId = newId();
      const now = new Date();

      await tx.insert(workspaces).values({
        id: workspaceId,
        externalOwnerId: identity.externalUserId,
        name: `${identity.name || identity.email} - PageNova`,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      [workspace] = await tx
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);
    }

    if (!workspace) {
      throw new Error('Nao foi possivel provisionar o workspace PageNova.');
    }

    let [membership] = await tx
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspace.id),
          eq(workspaceMembers.userId, user.id),
        ),
      )
      .limit(1);

    if (!membership) {
      const now = new Date();
      await tx.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: user.id,
        role: 'OWNER',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      [membership] = await tx
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspace.id),
            eq(workspaceMembers.userId, user.id),
          ),
        )
        .limit(1);
    } else if (membership.status !== 'ACTIVE' || membership.role !== 'OWNER') {
      await tx
        .update(workspaceMembers)
        .set({ role: 'OWNER', status: 'ACTIVE', updatedAt: new Date() })
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspace.id),
            eq(workspaceMembers.userId, user.id),
          ),
        );
      membership = { ...membership, role: 'OWNER', status: 'ACTIVE', updatedAt: new Date() };
    }

    if (!membership) {
      throw new Error('Nao foi possivel provisionar o membership PageNova.');
    }

    return {
      workspaceId: membership.workspaceId,

      user: {
        id: user.id,
        email: user.email,
        name: user.name,

        // O papel efetivo vem do workspace.
        role: membership.role,

        lastLoginAt: user.lastLoginAt,
        passwordChangedAt: user.passwordChangedAt,
      },
    };
  });
}