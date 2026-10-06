/**
 * Fila e worker de Sites com IA contra o banco real.
 *
 * O que so o banco prova:
 *  - a mesma chave de idempotencia nunca cria um segundo job -- o clique
 *    duplo nao pode virar duas chamadas pagas;
 *  - o claim atomico nunca deixa dois workers levarem o mesmo job;
 *  - um lease vencido volta para a fila (com tentativa sobrando) ou vira
 *    FAILED retomavel (sem tentativa sobrando) -- nunca fica RUNNING para
 *    sempre;
 *  - uma execucao completa grava projeto, versao e uso de IA na MESMA
 *    trilha, com o job terminando SUCCEEDED e a versao acessivel depois.
 *
 * Sem TEST_DB_* configurado a suite e IGNORADA com aviso -- nunca mascarada
 * como aprovada. Veja docs/testing.md.
 */
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { Database } from '@server/db/client';
import { loadEnv, setEnvForTests } from '@server/config/env';
import { newId } from '@server/lib/ids';
import * as repo from '@server/modules/site-ai/repository';
import { startSiteAiWorker, type WorkerHandle } from '@builder/generation/worker';

import { hasTestDatabase, resetDatabase, schema, setupTestDatabase, SKIP_MESSAGE, teardownTestDatabase } from './setup';

const suite = hasTestDatabase ? describe : describe.skip;

if (!hasTestDatabase) {
  console.warn(`\n${SKIP_MESSAGE}\n`);
}

/** Espera ate a condicao ser verdadeira ou o tempo limite estourar. */
async function waitUntil(check: () => Promise<boolean>, timeoutMs = 10_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Tempo limite esperando a condicao.');
}

suite('fila e worker de sites com IA', () => {
  let db: Database;
  const ADMIN = 'usuario-de-teste-000000001';

  beforeAll(async () => {
    db = await setupTestDatabase();
    // Modo mock: o worker precisa rodar de ponta a ponta sem chamar a
    // Anthropic de verdade -- nenhum teste automatizado pode gastar credito.
    process.env.SITE_AI_ENABLED = 'true';
    process.env.SITE_AI_MOCK_MODE = 'true';
    setEnvForTests(loadEnv(process.env));
  });

  afterAll(async () => {
    delete process.env.SITE_AI_ENABLED;
    delete process.env.SITE_AI_MOCK_MODE;
    setEnvForTests(loadEnv(process.env));
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetDatabase(db);
    // site_projects.owner_user_id tem FK para users.id: precisa existir de verdade.
    const now = new Date();
    await db.insert(schema.users).values({
      id: ADMIN,
      email: 'teste-worker@stavo.local',
      passwordHash: 'scrypt$32768$8$1$AAAA$AAAA',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  });

  async function createProjectRow(overrides: Partial<{ businessName: string; draftConfig: unknown }> = {}) {
    return repo.insertProject('01TESTWORKSPACE000000000001', {
      leadId: null,
      ownerUserId: ADMIN,
      internalName: overrides.businessName ?? 'Projeto de teste',
      businessName: overrides.businessName ?? 'Projeto de teste',
      siteType: 'ONE_PAGE',
      desiredSlug: null,
      draftConfig: overrides.draftConfig ?? {
        business: { name: overrides.businessName ?? 'Projeto de teste', services: [], differentials: [] },
      },
      creativeSeed: 'seed-integracao-0001',
      budgetLimitUsd: '5',
      createdBy: ADMIN,
    });
  }

  it('idempotencia: a mesma chave nunca cria um segundo job', async () => {
    const projectId = await createProjectRow();
    const key = `idem-${newId()}`;

    const first = await repo.enqueueJob({
      projectId,
      type: 'INITIAL_GENERATION',
      idempotencyKey: key,
      maxAttempts: 2,
      createdBy: ADMIN,
    });
    const second = await repo.enqueueJob({
      projectId,
      type: 'INITIAL_GENERATION',
      idempotencyKey: key,
      maxAttempts: 2,
      createdBy: ADMIN,
    });

    expect(second.job.id).toBe(first.job.id);
    expect(second.created).toBe(false);

    const rows = await db
      .select()
      .from(schema.siteGenerationJobs)
      .where(eq(schema.siteGenerationJobs.idempotencyKey, key));
    expect(rows).toHaveLength(1);
  });

  it('claim atomico: dois workers disputando o mesmo job, so um leva', async () => {
    const projectId = await createProjectRow();
    const { job } = await repo.enqueueJob({
      projectId,
      type: 'INITIAL_GENERATION',
      idempotencyKey: `claim-${newId()}`,
      maxAttempts: 2,
      createdBy: ADMIN,
    });

    const [a, b] = await Promise.all([
      repo.claimJob(job.id, 'worker-a', 60),
      repo.claimJob(job.id, 'worker-b', 60),
    ]);

    // Exatamente um dos dois venceu a corrida.
    expect([a, b].filter(Boolean)).toHaveLength(1);
  });

  it('lease vencido com tentativa sobrando volta para PENDING', async () => {
    const projectId = await createProjectRow();
    const { job } = await repo.enqueueJob({
      projectId,
      type: 'INITIAL_GENERATION',
      idempotencyKey: `lease-${newId()}`,
      maxAttempts: 3,
      createdBy: ADMIN,
    });

    await repo.claimJob(job.id, 'worker-morto', -1); // lease ja nasce vencido.
    const recovered = await repo.recoverExpiredLeases();
    expect(recovered).toBeGreaterThanOrEqual(1);

    const after = await repo.findJob(job.id);
    expect(after?.status).toBe('PENDING');
    expect(after?.leaseOwner).toBeNull();
  });

  it('lease vencido sem tentativa sobrando vira FAILED retomavel', async () => {
    const projectId = await createProjectRow();
    const { job } = await repo.enqueueJob({
      projectId,
      type: 'INITIAL_GENERATION',
      idempotencyKey: `lease-esgotado-${newId()}`,
      maxAttempts: 1,
      createdBy: ADMIN,
    });

    await repo.claimJob(job.id, 'worker-morto', -1); // attempt vai a 1, que ja e o maximo.
    await repo.recoverExpiredLeases();

    const after = await repo.findJob(job.id);
    expect(after?.status).toBe('FAILED');
    expect(after?.errorRetryable).toBe(true);
  });

  describe('execucao completa', () => {
    let worker: WorkerHandle;

    beforeEach(() => {
      worker = startSiteAiWorker({ pollIntervalMs: 100, leaseSeconds: 30 });
    });

    afterEach(async () => {
      await worker.stop();
    });

    it('do enfileiramento ao job SUCCEEDED, salvando projeto, versao e uso', async () => {
      const projectId = await createProjectRow({
        businessName: 'Clinica Aurora',
        draftConfig: {
          business: {
            name: 'Clinica Aurora',
            niche: 'Odontologia',
            services: [{ name: 'Limpeza', description: 'Profilaxia completa.' }],
            differentials: [],
          },
          objective: { goal: 'APPOINTMENTS' },
          style: { theme: 'LIGHT', keywords: [], density: 'BALANCED', motionLevel: 'BALANCED' },
        },
      });
      // O worker so aceita levar um projeto QUEUED para GENERATING; em
      // producao isso vem de `requestGeneration` (service.ts). Aqui
      // reproduzimos a mesma transicao antes de enfileirar direto pelo repo.
      await repo.updateProjectStatus(projectId, 'BRIEFING', 'QUEUED');

      const { job } = await repo.enqueueJob({
        projectId,
        type: 'INITIAL_GENERATION',
        idempotencyKey: `full-${newId()}`,
        maxAttempts: 2,
        createdBy: ADMIN,
      });

      await waitUntil(async () => {
        const current = await repo.findJob(job.id);
        return current?.status === 'SUCCEEDED' || current?.status === 'FAILED';
      });

      const finished = await repo.findJob(job.id);
      expect(finished?.status, JSON.stringify(finished)).toBe('SUCCEEDED');

      const project = await repo.findProject(projectId);
      expect(project?.status).toBe('READY');
      expect(project?.currentVersionNumber).toBe(1);
      expect(Number(project?.costAccumulatedUsd)).toBeGreaterThanOrEqual(0);

      const versions = await repo.listVersions(projectId);
      expect(versions).toHaveLength(1);
      expect(versions[0]?.origin).toBe('GENERATION');

      const events = await repo.listEvents(job.id);
      expect(events.some((e) => e.stage === 'COMPLETED')).toBe(true);
      // As etapas aparecem na ordem em que realmente aconteceram.
      const stages = events.map((e) => e.stage).filter(Boolean);
      expect(stages.indexOf('VALIDATING_BRIEFING')).toBeLessThan(stages.indexOf('SAVING_VERSION'));

      const usage = await db
        .select()
        .from(schema.siteAiUsage)
        .where(eq(schema.siteAiUsage.jobId, job.id));
      expect(usage.length).toBeGreaterThan(0);
      expect(usage[0]?.status).toBe('SUCCESS');
    });

    it('um restart do worker recupera um job travado em RUNNING', async () => {
      // O worker do beforeEach ja esta de pe com poll a cada 100ms; se o
      // deixassemos rodando, ele disputaria (e poderia vencer) o claim
      // manual abaixo antes do teste conseguir forjar o lease vencido. Por
      // isso ele para AQUI, o cenario e montado sem ninguem de olho na fila,
      // e so entao um worker novo sobe para provar a recuperacao de verdade.
      await worker.stop();

      const projectId = await createProjectRow({ businessName: 'Estudio Recovery' });
      await repo.updateProjectStatus(projectId, 'BRIEFING', 'QUEUED');
      const { job } = await repo.enqueueJob({
        projectId,
        type: 'INITIAL_GENERATION',
        idempotencyKey: `restart-${newId()}`,
        maxAttempts: 2,
        createdBy: ADMIN,
      });

      // Simula um processo antigo que travou no meio, com lease ja vencido.
      await repo.claimJob(job.id, 'processo-morto', -1);
      expect((await repo.findJob(job.id))?.status).toBe('RUNNING');

      // O "restart": um worker novo sobe, recupera o lease vencido e entao
      // processa normalmente. Reatribuido para o afterEach parar so este.
      worker = startSiteAiWorker({ pollIntervalMs: 100, leaseSeconds: 30 });

      await waitUntil(async () => {
        const current = await repo.findJob(job.id);
        return current?.status === 'SUCCEEDED' || current?.status === 'FAILED';
      });

      expect((await repo.findJob(job.id))?.status).toBe('SUCCEEDED');
    });
  });
});
