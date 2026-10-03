/**
 * Executa as migracoes versionadas.
 * Nunca sincroniza schema automaticamente e para na primeira falha.
 *
 *   npm run db:migrate
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { migrate } from 'drizzle-orm/mysql2/migrator';

import { getDb, closeDatabase } from '../src/server/db/client';
import { getEnv } from '../src/server/config/env';

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'drizzle',
);

async function main(): Promise<void> {
  const env = getEnv();
  console.log(`Aplicando migracoes em ${env.DB_NAME}@${env.DB_HOST}:${env.DB_PORT} ...`);

  await migrate(getDb(), { migrationsFolder });

  console.log('Migracoes aplicadas com sucesso.');
}

main()
  .then(async () => {
    await closeDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('\nFalha ao aplicar migracoes. Nenhuma etapa seguinte foi executada.');
    console.error(error instanceof Error ? error.message : error);
    await closeDatabase();
    process.exit(1);
  });
