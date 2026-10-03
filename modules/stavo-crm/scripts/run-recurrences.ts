/**
 * Executa a manutencao idempotente (mensalidades + vencidos + sessoes).
 * Pode ser agendado no cron da Hostinger:
 *
 *   cd /home/USUARIO/app && /usr/bin/node dist/server/jobs/run.js
 *
 * ou, em desenvolvimento:  npm run jobs:recurrences
 */
import { closeDatabase, getDb } from '../src/server/db/client';
import { runMaintenance } from '../src/server/modules/jobs/maintenance';

async function main(): Promise<void> {
  const result = await runMaintenance(getDb(), { force: true });

  console.log('Manutencao concluida:');
  console.log(`  assinaturas processadas ..... ${result.subscriptionsProcessed}`);
  console.log(`  mensalidades geradas ........ ${result.generated}`);
  console.log(`  cobrancas marcadas vencidas . ${result.overdueMarked}`);
  console.log(`  sessoes expiradas removidas . ${result.sessionsPurged}`);
}

main()
  .then(async () => {
    await closeDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('Falha na manutencao:', error instanceof Error ? error.message : error);
    await closeDatabase();
    process.exit(1);
  });
