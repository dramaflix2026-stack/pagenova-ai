/**
 * Seed idempotente de etapas, origens, motivos de perda e configuracoes.
 *
 *   npm run db:seed
 */
import { getDb, closeDatabase } from '../src/server/db/client';
import { assertStageIntegrity, runSeed } from '../src/server/db/seed';
import { workspaces } from '../src/server/db/schema';

async function main(): Promise<void> {
  const db = getDb();

  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .limit(1);

  if (!workspace) {
    throw new Error('Nenhum workspace encontrado para executar o seed.');
  }

  const result = await runSeed(db, workspace.id);
  await assertStageIntegrity(db, workspace.id);

  console.log('Seed concluido (idempotente):');
  console.log(`  etapas criadas .............. ${result.stagesCreated}`);
  console.log(`  origens criadas ............. ${result.sourcesCreated}`);
  console.log(`  motivos de perda criados .... ${result.lossReasonsCreated}`);
  console.log(`  configuracoes criadas ....... ${result.settingsCreated}`);
}

main()
  .then(async () => {
    await closeDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('Falha no seed:', error instanceof Error ? error.message : error);
    await closeDatabase();
    process.exit(1);
  });
