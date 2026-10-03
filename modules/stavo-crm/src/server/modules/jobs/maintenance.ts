/**
 * Manutencao idempotente.
 *
 * Roda em tres situacoes, sempre com o mesmo resultado:
 *  - ao abrir o dashboard ou o financeiro (garantia sem cron);
 *  - pelo comando `npm run jobs:recurrences`;
 *  - pelo cron opcional da hospedagem.
 *
 * Um "debounce" em memoria evita repetir o trabalho a cada request; a
 * corretude, porem, NAO depende dele -- a unicidade esta no banco.
 */
import type { Database } from '../../db/client';
import { logger } from '../../lib/logger';
import { purgeExpiredSessions } from '../auth/sessions';
import { generateRecurrences, type RecurrenceRunResult } from '../finance/service';

export interface MaintenanceResult extends RecurrenceRunResult {
  sessionsPurged: number;
  skipped: boolean;
}

/** Intervalo minimo entre execucoes disparadas pelo uso da aplicacao. */
const MIN_INTERVAL_MS = 5 * 60 * 1000;

let lastRunAt = 0;
let running: Promise<MaintenanceResult> | null = null;

export async function runMaintenance(
  db: Database,
  options: { force?: boolean; now?: Date } = {},
): Promise<MaintenanceResult> {
  const now = options.now ?? new Date();

  if (!options.force && now.getTime() - lastRunAt < MIN_INTERVAL_MS) {
    return {
      generated: 0,
      subscriptionsProcessed: 0,
      overdueMarked: 0,
      sessionsPurged: 0,
      skipped: true,
    };
  }

  // Uma execucao por vez dentro do processo; o banco protege o resto.
  if (running) return running;

  running = (async () => {
    try {
      const recurrences = await generateRecurrences(db, { now });
      const sessionsPurged = await purgeExpiredSessions(db);
      lastRunAt = Date.now();

      if (recurrences.generated > 0) {
        logger.info(
          { generated: recurrences.generated },
          'Mensalidades geradas pelo job de recorrencias.',
        );
      }

      return { ...recurrences, sessionsPurged, skipped: false };
    } finally {
      running = null;
    }
  })();

  return running;
}

/** Dispara a manutencao sem bloquear a resposta ao usuario. */
export function scheduleMaintenance(db: Database): void {
  void runMaintenance(db).catch((error: unknown) => {
    logger.error({ err: error }, 'Falha ao executar a manutencao automatica.');
  });
}

/** Usado pelos testes para zerar o debounce. */
export function resetMaintenanceThrottle(): void {
  lastRunAt = 0;
  running = null;
}
