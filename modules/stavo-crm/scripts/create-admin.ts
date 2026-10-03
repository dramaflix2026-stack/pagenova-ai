/**
 * Bootstrap do administrador unico.
 *
 * Regras de seguranca:
 *  - le a senha de ADMIN_INITIAL_PASSWORD (variavel de ambiente do servidor);
 *  - e idempotente: recusa substituir um usuario ja existente;
 *  - nunca imprime a senha no terminal ou em log;
 *  - orienta a remover a variavel apos a criacao.
 *
 *   npm run admin:bootstrap
 */
import { eq } from 'drizzle-orm';

import { getEnv } from '../src/server/config/env';
import { closeDatabase, getDb } from '../src/server/db/client';
import { users } from '../src/server/db/schema';
import { newId } from '../src/server/lib/ids';
import { checkPasswordStrength, hashPassword } from '../src/server/modules/auth/password';

async function main(): Promise<void> {
  const env = getEnv();
  const db = getDb();
  const email = env.ADMIN_EMAIL.toLowerCase();

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    console.log(`Administrador ja existe (${email}). Nada foi alterado.`);
    console.log('Para trocar a senha use: npm run admin:reset-password');
    return;
  }

  const anyUser = await db.select({ id: users.id }).from(users).limit(1);
  if (anyUser.length > 0) {
    throw new Error(
      'Ja existe um usuario cadastrado com outro e-mail. Esta aplicacao e de administrador unico. ' +
        'Revise o banco antes de continuar.',
    );
  }

  const password = env.ADMIN_INITIAL_PASSWORD?.trim();
  if (!password) {
    throw new Error(
      'ADMIN_INITIAL_PASSWORD nao esta definida. Defina a variavel de ambiente no servidor ' +
        '(nunca em arquivo versionado) e rode novamente.',
    );
  }

  const strength = checkPasswordStrength(password);
  if (!strength.ok) {
    throw new Error(`Senha inicial recusada: ${strength.reason}`);
  }

  const now = new Date();
  await db.insert(users).values({
    id: newId(),
    email,
    passwordHash: await hashPassword(password),
    active: true,
    passwordChangedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Administrador criado: ${email}`);
  console.log('');
  console.log('PROXIMOS PASSOS OBRIGATORIOS:');
  console.log('  1. Faca o primeiro login na aplicacao.');
  console.log('  2. REMOVA a variavel ADMIN_INITIAL_PASSWORD do ambiente do servidor.');
  console.log('  3. Reinicie a aplicacao.');
  console.log('');
  console.log('A senha nao foi exibida nem registrada em log por seguranca.');
}

main()
  .then(async () => {
    await closeDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('Falha no bootstrap:', error instanceof Error ? error.message : error);
    await closeDatabase();
    process.exit(1);
  });
