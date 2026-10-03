/**
 * Aplica as migracoes pendentes ao iniciar.
 *
 * Por que na inicializacao, e nao por linha de comando: a hospedagem nao da
 * acesso a terminal. Sem isto, toda mudanca de schema exigiria liberar um IP
 * no MySQL remoto e rodar o script de outra maquina -- um ritual manual que
 * mais cedo ou mais tarde seria esquecido, deixando o codigo novo rodando
 * sobre um banco velho.
 *
 * O `migrate` do Drizzle e idempotente: ele registra o que ja aplicou em
 * `__drizzle_migrations` e so executa o que falta. Rodar de novo nao repete
 * nada.
 *
 * Premissa desta aplicacao: UM processo. Com varias instancias subindo ao
 * mesmo tempo, isto precisaria de trava distribuida.
 *
 * Falhar aqui NAO derruba o processo. Um servidor no ar que sabe explicar o
 * problema em /api/ready e melhor que um processo morto que nao explica nada.
 */
import path from 'node:path';

import { migrate } from 'drizzle-orm/mysql2/migrator';

import { getEnv } from '../config/env';
import { logger } from '../lib/logger';
import { getDb } from './client';

export type MigrationStatus = 'pendente' | 'aplicadas' | 'falhou' | 'desligado';

export interface MigrationState {
  status: MigrationStatus;
  /** Codigo do erro, quando falhou. Nunca a mensagem crua do banco. */
  code?: string;
  at?: string;
}

let state: MigrationState = { status: 'pendente' };

export const getMigrationState = (): MigrationState => state;

export async function runPendingMigrations(): Promise<void> {
  const env = getEnv();

  if (!env.AUTO_MIGRATE) {
    state = { status: 'desligado' };
    logger.info('AUTO_MIGRATE desligado: as migracoes precisam ser aplicadas manualmente.');
    return;
  }

  // A pasta acompanha o repositorio, entao existe tambem em producao.
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');

  try {
    await migrate(getDb(), { migrationsFolder });
    state = { status: 'aplicadas', at: new Date().toISOString() };
    logger.info('Migracoes verificadas: o banco esta na versao do codigo.');
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : 'DESCONHECIDO';

    state = { status: 'falhou', code, at: new Date().toISOString() };

    logger.error(
      { err: error, migrationsFolder },
      'Falha ao aplicar migracoes. A aplicacao subiu, mas telas que dependem das ' +
        'tabelas novas vao falhar. Consulte /api/ready.',
    );
  }
}
