/**
 * Pool MySQL e instancia Drizzle.
 *
 * Configuracao critica:
 *  - `timezone: 'Z'` faz colunas DATETIME serem lidas/gravadas como UTC;
 *  - `dateStrings: ['DATE']` mantem datas civis como 'AAAA-MM-DD' (sem fuso);
 *  - DECIMAL chega como string, preservando a precisao monetaria;
 *  - todas as queries sao parametrizadas pelo driver.
 */
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import mysql, { type Pool } from 'mysql2/promise';

import { getEnv } from '../config/env';
import { logger } from '../lib/logger';
import * as schema from './schema';

export type Database = MySql2Database<typeof schema>;

let pool: Pool | null = null;
let db: Database | null = null;

export function getPool(): Pool {
  if (pool) return pool;
  const env = getEnv();

  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ...(env.DB_SSL ? { ssl: { rejectUnauthorized: true } } : {}),
    connectionLimit: env.DB_POOL_SIZE,
    waitForConnections: true,
    queueLimit: 0,
    timezone: 'Z',
    dateStrings: ['DATE'],
    supportBigNumbers: true,
    bigNumberStrings: false,
    charset: 'utf8mb4_unicode_ci',
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
  });

  return pool;
}

export function getDb(): Database {
  if (!db) {
    db = drizzle(getPool(), { schema, mode: 'default' });
  }
  return db;
}

/** Usado por testes de integracao para injetar uma conexao propria. */
export function setDbForTests(instance: Database | null, instancePool: Pool | null): void {
  db = instance;
  pool = instancePool;
}

export async function pingDatabase(): Promise<void> {
  const connection = await getPool().getConnection();
  try {
    await connection.query('SELECT 1');
  } finally {
    connection.release();
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
    } catch (error) {
      logger.warn({ err: error }, 'Falha ao encerrar o pool MySQL.');
    }
    pool = null;
    db = null;
  }
}

/** Erro de violacao de unicidade do MySQL. */
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ER_DUP_ENTRY'
  );
}

/** Nome do indice que falhou, util para diferenciar conflitos. */
export function duplicateKeyName(error: unknown): string | null {
  if (!isDuplicateKeyError(error)) return null;
  const message = (error as { message?: string }).message ?? '';
  const match = message.match(/for key '(?:[^.']+\.)?([^']+)'/);
  return match?.[1] ?? null;
}
