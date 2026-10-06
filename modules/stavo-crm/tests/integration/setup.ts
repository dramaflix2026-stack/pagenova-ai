/**
 * Infraestrutura dos testes de integracao.
 *
 * Exige um MySQL de teste. Sem ele a suite NAO e mascarada como aprovada:
 * ela e ignorada com um aviso explicito e o procedimento manual fica em
 * docs/testing.md.
 *
 * Configure antes de rodar:
 *   TEST_DB_HOST, TEST_DB_PORT, TEST_DB_NAME, TEST_DB_USER, TEST_DB_PASSWORD
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { sql } from 'drizzle-orm';
import mysql from 'mysql2/promise';

import { setDbForTests, type Database } from '@server/db/client';
import * as schema from '@server/db/schema';
import { runSeed } from '@server/db/seed';

export const hasTestDatabase = Boolean(process.env.TEST_DB_NAME && process.env.TEST_DB_USER);

export const SKIP_MESSAGE =
  'Testes de integracao ignorados: defina TEST_DB_HOST, TEST_DB_NAME, TEST_DB_USER e ' +
  'TEST_DB_PASSWORD apontando para um MySQL de teste. Veja docs/testing.md.';

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'drizzle',
);

let pool: mysql.Pool | null = null;
let db: Database | null = null;

export async function setupTestDatabase(): Promise<Database> {
  if (db) return db;

  pool = mysql.createPool({
    host: process.env.TEST_DB_HOST ?? '127.0.0.1',
    port: Number(process.env.TEST_DB_PORT ?? 3306),
    user: process.env.TEST_DB_USER!,
    password: process.env.TEST_DB_PASSWORD ?? '',
    database: process.env.TEST_DB_NAME!,
    connectionLimit: 5,
    timezone: 'Z',
    dateStrings: ['DATE'],
    multipleStatements: false,
  });

  db = drizzle(pool, { schema, mode: 'default' }) as Database;
  setDbForTests(db, pool);

  // Banco criado do zero pelas MESMAS migracoes usadas em producao.
  await migrate(db, { migrationsFolder });

  return db;
}

export async function teardownTestDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    setDbForTests(null, null);
  }
}

/** Ordem inversa de dependencia para respeitar as chaves estrangeiras. */
const TABLES_IN_DELETE_ORDER = [
  'site_ai_usage',
  'site_outreach_messages',
  'site_generation_events',
  'site_generation_jobs',
  'site_publications',
  'site_project_versions',
  'site_assets',
  'site_projects',
  'payments',
  'receivables',
  'subscription_changes',
  'subscriptions',
  'sale_items',
  'sales',
  'meeting_reminders',
  'meetings',
  'lead_losses',
  'follow_ups',
  'activities',
  'stage_history',
  'lead_events',
  'lead_service_interests',
  'duplicate_reviews',
  'lead_identity_memberships',
  'lead_identity_keys',
  'lead_links',
  'lead_contacts',
  'leads',
  'import_rows',
  'import_jobs',
  'search_runs',
  'google_api_usage',
  'goals',
  'audit_log',
  'auth_sessions',
  'login_attempts',
  'users',
  'services',
  'loss_reasons',
  'stages',
  'lead_sources',
  'app_settings',
];

/** Zera o banco e reaplica o seed antes de cada teste. */
export async function resetDatabase(database: Database): Promise<void> {
  await database.execute(sql`set foreign_key_checks = 0`);
  for (const table of TABLES_IN_DELETE_ORDER) {
    await database.execute(sql.raw(`delete from \`${table}\``));
  }
  await database.execute(sql`set foreign_key_checks = 1`);
  await runSeed(database, '01TESTWORKSPACE000000000001');
}

/** Etapa correspondente a um significado interno. */
export async function stageId(database: Database, semanticKey: string): Promise<string> {
  const [row] = await database
    .select({ id: schema.stages.id })
    .from(schema.stages)
    .where(sql`${schema.stages.semanticKey} = ${semanticKey}`)
    .limit(1);
  if (!row) throw new Error(`Etapa ${semanticKey} nao encontrada no seed.`);
  return row.id;
}

export { schema };
