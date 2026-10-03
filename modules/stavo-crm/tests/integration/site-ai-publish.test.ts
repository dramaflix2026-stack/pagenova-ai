/**
 * Publicacao contra o banco real e um servidor de verdade (secao 16).
 *
 * O smoke test da publicacao (secao 16.8) faz uma requisicao HTTP de
 * verdade contra a rota publica -- por isso este teste sobe um `app.listen`
 * de verdade, na porta que `getEnv().PORT` informa, e nao so o objeto
 * Express em memoria.
 *
 * Sem TEST_DB_* configurado a suite e IGNORADA com aviso -- nunca mascarada
 * como aprovada. Veja docs/testing.md.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import type { Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';

import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { Database } from '@server/db/client';
import { loadEnv, setEnvForTests } from '@server/config/env';
import { buildFixtureSite } from '@server/modules/site-ai/fixture';
import * as repo from '@server/modules/site-ai/repository';

import { hasTestDatabase, resetDatabase, schema, setupTestDatabase, SKIP_MESSAGE, teardownTestDatabase } from './setup';

const suite = hasTestDatabase ? describe : describe.skip;

if (!hasTestDatabase) {
  console.warn(`\n${SKIP_MESSAGE}\n`);
}

const ADMIN = 'usuario-de-teste-000000001';
const TEST_PORT = 34987;

suite('publicacao de sites com IA', () => {
  let db: Database;
  let app: Express;
  let server: Server;
  let publicDir: string;
  let assetsDir: string;

  beforeAll(async () => {
    db = await setupTestDatabase();

    publicDir = await mkdtemp(path.join(os.tmpdir(), 'site-ai-public-'));
    assetsDir = await mkdtemp(path.join(os.tmpdir(), 'site-ai-assets-'));

    process.env.SITE_AI_ENABLED = 'true';
    process.env.SITE_AI_MOCK_MODE = 'true';
    process.env.PORT = String(TEST_PORT);
    process.env.SITE_PUBLIC_ASSETS_DIR = publicDir;
    process.env.SITE_ASSETS_DIR = assetsDir;
    setEnvForTests(loadEnv(process.env));

    const { createApp } = await import('@server/app');
    app = createApp();
    server = await new Promise((resolve) => {
      const s = app.listen(TEST_PORT, '127.0.0.1', () => resolve(s));
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(() => resolve(undefined)));
    await rm(publicDir, { recursive: true, force: true });
    await rm(assetsDir, { recursive: true, force: true });
    delete process.env.SITE_AI_ENABLED;
    delete process.env.SITE_AI_MOCK_MODE;
    delete process.env.PORT;
    delete process.env.SITE_PUBLIC_ASSETS_DIR;
    delete process.env.SITE_ASSETS_DIR;
    setEnvForTests(loadEnv(process.env));
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetDatabase(db);
    // site_projects.owner_user_id tem FK para users.id: precisa existir de verdade.
    const now = new Date();
    await db.insert(schema.users).values({
      id: ADMIN,
      email: 'teste-publish@stavo.local',
      passwordHash: 'scrypt$32768$8$1$AAAA$AAAA',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  });

  async function projectReadyToPublish(businessName: string): Promise<string> {
    const model = buildFixtureSite();
    model.business.name = businessName;

    const projectId = await repo.insertProject({
      leadId: null,
      ownerUserId: ADMIN,
      internalName: businessName,
      businessName,
      siteType: 'ONE_PAGE',
      desiredSlug: null,
      draftConfig: model,
      creativeSeed: 'seed-publish-0001',
      budgetLimitUsd: '5',
      createdBy: ADMIN,
    });
    await repo.updateProjectStatus(projectId, 'BRIEFING', 'QUEUED');
    await repo.updateProjectStatus(projectId, 'QUEUED', 'GENERATING');
    await repo.updateProjectStatus(projectId, 'GENERATING', 'READY', { currentVersionNumber: 1 });
    return projectId;
  }

  it('publica: cria publicacao ativa, projeto vira PUBLISHED, a URL responde 200', async () => {
    const { publishProject } = await import('@builder/publishing/publisher');
    const projectId = await projectReadyToPublish('Clinica Publicar Um');
    const project = await repo.findProject(projectId);

    const result = await publishProject(project!, ADMIN, { acknowledgedWarnings: false });

    expect(result.publication.status).toBe('ACTIVE');
    expect(result.url).toContain(`/p/${result.publication.slug}`);

    const response = await fetch(`http://127.0.0.1:${TEST_PORT}/p/${result.publication.slug}`);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('Clinica Publicar Um');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');

    const updated = await repo.findProject(projectId);
    expect(updated?.status).toBe('PUBLISHED');
    expect(updated?.activePublicationId).toBe(result.publication.id);
  });

  it('recarregar a URL funciona (nao e um recurso de uso unico)', async () => {
    const { publishProject } = await import('@builder/publishing/publisher');
    const projectId = await projectReadyToPublish('Clinica Reload');
    const project = await repo.findProject(projectId);
    const result = await publishProject(project!, ADMIN, { acknowledgedWarnings: false });

    const first = await fetch(`http://127.0.0.1:${TEST_PORT}/p/${result.publication.slug}`);
    const second = await fetch(`http://127.0.0.1:${TEST_PORT}/p/${result.publication.slug}`);
    expect(await first.text()).toBe(await second.text());
  });

  it('atualizar a publicacao mantem o MESMO link e supera a anterior', async () => {
    const { publishProject } = await import('@builder/publishing/publisher');
    const projectId = await projectReadyToPublish('Clinica Atualizar');

    const first = await publishProject((await repo.findProject(projectId))!, ADMIN, { acknowledgedWarnings: false });

    // Edita o rascunho e publica de novo.
    const editedModel = { ...buildFixtureSite(), business: { ...buildFixtureSite().business, name: 'Clinica Atualizar' } };
    editedModel.seo.title = 'Titulo atualizado para a segunda publicacao';
    const projectAfterEdit = await repo.findProject(projectId);
    await repo.updateProject(projectId, projectAfterEdit!.lockVersion, { draftConfig: editedModel });

    const second = await publishProject((await repo.findProject(projectId))!, ADMIN, { acknowledgedWarnings: false });

    expect(second.publication.slug).toBe(first.publication.slug);
    expect(second.publication.publicationNumber).toBe(first.publication.publicationNumber + 1);

    const firstRow = await repo.findPublication(first.publication.id);
    expect(firstRow?.status).toBe('SUPERSEDED');

    const response = await fetch(`http://127.0.0.1:${TEST_PORT}/p/${second.publication.slug}`);
    expect(await response.text()).toContain('Titulo atualizado');
  });

  it('rollback restaura a publicacao anterior como ativa', async () => {
    const { publishProject, rollbackPublication } = await import('@builder/publishing/publisher');
    const projectId = await projectReadyToPublish('Clinica Rollback');

    const first = await publishProject((await repo.findProject(projectId))!, ADMIN, { acknowledgedWarnings: false });
    await publishProject((await repo.findProject(projectId))!, ADMIN, { acknowledgedWarnings: false });

    await rollbackPublication((await repo.findProject(projectId))!, first.publication.id);

    const restored = await repo.findPublication(first.publication.id);
    expect(restored?.status).toBe('ACTIVE');

    const response = await fetch(`http://127.0.0.1:${TEST_PORT}/p/${first.publication.slug}`);
    expect(response.status).toBe(200);
  });

  it('despublicar tira o link do ar sem apagar o historico', async () => {
    const { publishProject, unpublishProject } = await import('@builder/publishing/publisher');
    const projectId = await projectReadyToPublish('Clinica Despublicar');

    const result = await publishProject((await repo.findProject(projectId))!, ADMIN, { acknowledgedWarnings: false });
    await unpublishProject((await repo.findProject(projectId))!);

    const response = await fetch(`http://127.0.0.1:${TEST_PORT}/p/${result.publication.slug}`);
    expect(response.status).toBe(404);

    const publications = await repo.listPublications(projectId);
    expect(publications).toHaveLength(1); // o registro continua existindo, so o status muda.
    expect(publications[0]?.status).toBe('UNPUBLISHED');
  });

  it('recusa publicar um schema com erro estrutural do linter', async () => {
    const { publishProject } = await import('@builder/publishing/publisher');
    const projectId = await projectReadyToPublish('Clinica Com Erro');

    const project = await repo.findProject(projectId);
    const broken = buildFixtureSite();
    broken.theme.colors.text = broken.theme.colors.background; // contraste zero: ERROR garantido.
    await repo.updateProject(projectId, project!.lockVersion, { draftConfig: broken });

    await expect(
      publishProject((await repo.findProject(projectId))!, ADMIN, { acknowledgedWarnings: true }),
    ).rejects.toThrow();

    const stillNotPublished = await repo.findProject(projectId);
    expect(stillNotPublished?.status).not.toBe('PUBLISHED');
  });

  it('dois projetos nao podem publicar sob o mesmo endereco', async () => {
    const { publishProject } = await import('@builder/publishing/publisher');
    const projectAId = await projectReadyToPublish('Nome Disputado');
    const projectBId = await projectReadyToPublish('Nome Disputado');

    const first = await publishProject((await repo.findProject(projectAId))!, ADMIN, { acknowledgedWarnings: false });

    await expect(
      publishProject((await repo.findProject(projectBId))!, ADMIN, {
        acknowledgedWarnings: false,
        desiredSlug: first.publication.slug,
      }),
    ).rejects.toThrow();
  });

  it('a pagina publica nao vaza rota interna nem caminho de disco', async () => {
    const { publishProject } = await import('@builder/publishing/publisher');
    const projectId = await projectReadyToPublish('Clinica Sem Vazamento');
    const result = await publishProject((await repo.findProject(projectId))!, ADMIN, { acknowledgedWarnings: false });

    const response = await fetch(`http://127.0.0.1:${TEST_PORT}/p/${result.publication.slug}`);
    const html = await response.text();

    expect(html).not.toContain('/api/site-projects');
    expect(html).not.toContain('draftConfig');
    expect(html.toLowerCase()).not.toContain('c:\\users');
  });

  it('um slug inexistente responde 404 neutro, sem exigir login', async () => {
    const response = await fetch(`http://127.0.0.1:${TEST_PORT}/p/nao-existe-nunca-000`);
    expect(response.status).toBe(404);
    const html = await response.text();
    expect(html.toLowerCase()).not.toContain('senha');
    expect(html).not.toContain('/entrar');
  });
});
