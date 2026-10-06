/**
 * Redefinicao emergencial da senha do administrador.
 *
 * Executa APENAS no servidor, exige confirmacao explicita e revoga todas as
 * sessoes ativas. Nao depende de e-mail. A senha nunca aparece no terminal.
 *
 *   ADMIN_NEW_PASSWORD='...' npm run admin:reset-password -- --confirm
 *
 * Ver docs/admin-password-reset.md.
 */
import { eq } from 'drizzle-orm';

import { getEnv } from '../src/server/config/env';
import { closeDatabase, getDb } from '../src/server/db/client';
import { auditLog, authSessions, users, workspaceMembers } from '../src/server/db/schema';
import { newId } from '../src/server/lib/ids';
import { checkPasswordStrength, hashPassword } from '../src/server/modules/auth/password';

async function main(): Promise<void> {
  const env = getEnv();
  const db = getDb();

  if (!process.argv.includes('--confirm')) {
    console.log('Esta operacao redefine a senha do administrador e encerra TODAS as sessoes.');
    console.log('');
    console.log('Para confirmar, rode novamente com --confirm:');
    console.log("  ADMIN_NEW_PASSWORD='sua-nova-senha' npm run admin:reset-password -- --confirm");
    process.exitCode = 1;
    return;
  }

  const newPassword = process.env.ADMIN_NEW_PASSWORD?.trim();
  if (!newPassword) {
    throw new Error(
      'ADMIN_NEW_PASSWORD nao definida. Passe a nova senha por variavel de ambiente, ' +
        'nunca como argumento de linha de comando (o historico do shell guardaria o valor).',
    );
  }

  const strength = checkPasswordStrength(newPassword);
  if (!strength.ok) {
    throw new Error(`Senha recusada: ${strength.reason}`);
  }

  const email = (process.env.ADMIN_RESET_EMAIL ?? env.ADMIN_EMAIL).toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    throw new Error(`Nenhum usuario encontrado para ${email}.`);
  }

  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, user.id))
    .limit(1);

  if (!membership) {
    throw new Error('Usuario sem workspace associado.');
  }

  const now = new Date();
  const passwordHash = await hashPassword(newPassword);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, passwordChangedAt: now, updatedAt: now, active: true })
      .where(eq(users.id, user.id));

    // Revoga todas as sessoes: qualquer navegador aberto precisa entrar de novo.
    await tx
      .update(authSessions)
      .set({ revokedAt: now })
      .where(eq(authSessions.userId, user.id));

    await tx.insert(auditLog).values({
      workspaceId: membership.workspaceId,
      id: newId(),
      action: 'ADMIN_PASSWORD_RESET_CLI',
      entityType: 'users',
      entityId: user.id,
      actorUserId: null,
      summary: 'Senha redefinida por tarefa administrativa no servidor.',
      metadata: { sessionsRevoked: true },
      occurredAt: now,
    });
  });

  console.log(`Senha redefinida para ${email}.`);
  console.log('Todas as sessoes ativas foram revogadas.');
  console.log('Limpe a variavel ADMIN_NEW_PASSWORD do ambiente e do historico do shell.');
}

main()
  .then(async () => {
    await closeDatabase();
    process.exit(process.exitCode ?? 0);
  })
  .catch(async (error: unknown) => {
    console.error('Falha na redefinicao:', error instanceof Error ? error.message : error);
    await closeDatabase();
    process.exit(1);
  });
