/**
 * Montagem do artefato estatico: a peca compartilhada entre publicar (A12) e
 * exportar (A13). O que garante aqui: todo asset referenciado e coletado, o
 * HTML final referencia caminhos RELATIVOS (nao a API), e o runtime -- sem
 * ele, o site publicado nao teria menu, animacao nem formulario funcionando.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildFixtureSite } from '@server/modules/site-ai/fixture';
import { SITE_RUNTIME_JS } from '@site-kit/interactions/runtime';
import type * as EnvModule from '@server/config/env';
import type * as RepositoryModule from '@server/modules/site-ai/repository';

/**
 * O primeiro `await import()` deste arquivo compila o modulo inteiro (com o
 * renderer junto). Sob carga, isso passava dos 5s padrao do vitest e o teste
 * falhava sem nada de errado no codigo.
 */
vi.setConfig({ testTimeout: 30_000 });

vi.mock('@server/config/env', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof EnvModule;
  return { ...actual, siteAssetsDirAbsolute: () => (globalThis as { __testAssetsDir?: string }).__testAssetsDir ?? '' };
});

describe('collectAssetIds', () => {
  it('coleta a imagem de hero/about/authority quando presente', async () => {
    const { collectAssetIds } = await import('@builder/publishing/artifact-builder');
    const model = buildFixtureSite();
    (model.sections[0] as { image?: unknown }).image = {
      assetId: 'A'.repeat(26),
      alt: 'x',
      focalX: 0.5,
      focalY: 0.5,
    };

    expect(collectAssetIds(model)).toContain('A'.repeat(26));
  });

  it('nao duplica quando o mesmo asset e usado em dois lugares', async () => {
    const { collectAssetIds } = await import('@builder/publishing/artifact-builder');
    const model = buildFixtureSite();
    const ref = { assetId: 'B'.repeat(26), alt: 'x', focalX: 0.5, focalY: 0.5 };
    (model.sections[0] as { image?: unknown }).image = ref;
    model.seo.ogImage = ref;

    const ids = collectAssetIds(model);
    expect(ids.filter((id) => id === 'B'.repeat(26))).toHaveLength(1);
  });

  it('devolve lista vazia quando nenhuma secao tem imagem', async () => {
    const { collectAssetIds } = await import('@builder/publishing/artifact-builder');
    expect(collectAssetIds(buildFixtureSite())).toEqual([]);
  });
});

describe('buildSiteArtifactFiles', () => {
  let assetsDir: string;

  beforeEach(async () => {
    assetsDir = await mkdtemp(path.join(os.tmpdir(), 'site-ai-artifact-'));
    (globalThis as { __testAssetsDir?: string }).__testAssetsDir = assetsDir;
  });

  afterEach(async () => {
    await rm(assetsDir, { recursive: true, force: true });
    vi.resetModules();
  });

  it('embute o runtime quando pedido -- sem ele o site publicado nao teria menu nem animacao', async () => {
    const { buildSiteArtifactFiles } = await import('@builder/publishing/artifact-builder');
    const model = buildFixtureSite();

    const artifact = await buildSiteArtifactFiles('projeto-1', model, 'DEMO', { inlineRuntime: SITE_RUNTIME_JS });

    expect(artifact.html).toContain('__siteRuntimeCleanup');
    expect(artifact.html).toContain('data-nav-toggle');
  });

  it('sem inlineRuntime, o HTML nao contem nenhum script alem do JSON-LD', async () => {
    const { buildSiteArtifactFiles } = await import('@builder/publishing/artifact-builder');
    const artifact = await buildSiteArtifactFiles('projeto-1', buildFixtureSite(), 'DEMO');

    expect((artifact.html.match(/<script/g) ?? []).length).toBe(1);
  });

  it('asset referenciado mas ja removido do banco some da pagina sem quebrar a montagem', async () => {
    vi.doMock('@server/modules/site-ai/repository', async (importOriginal) => {
      const actual = (await importOriginal()) as typeof RepositoryModule;
      return { ...actual, findAsset: async () => null };
    });

    const { buildSiteArtifactFiles } = await import('@builder/publishing/artifact-builder');
    const model = buildFixtureSite();
    (model.sections[0] as { image?: unknown }).image = {
      assetId: 'C'.repeat(26),
      alt: 'x',
      focalX: 0.5,
      focalY: 0.5,
    };

    const artifact = await buildSiteArtifactFiles('projeto-1', model, 'DEMO');

    expect(artifact.files).toHaveLength(0); // nenhum asset copiado.
    expect(artifact.html).not.toContain('<img'); // e o renderer ja trata a ausencia.
    expect(artifact.html).toContain('<h1'); // o resto da pagina continua de pe.

    vi.doUnmock('@server/modules/site-ai/repository');
  });

  it('o perfil DEMO forca noindex mesmo se o schema pedir indexacao', async () => {
    const { buildSiteArtifactFiles } = await import('@builder/publishing/artifact-builder');
    const model = buildFixtureSite();
    model.seo.noindex = false;

    const artifact = await buildSiteArtifactFiles('projeto-1', model, 'DEMO');
    expect(artifact.html).toContain('noindex');
  });

  it('o perfil PRODUCTION respeita a configuracao real do schema', async () => {
    const { buildSiteArtifactFiles } = await import('@builder/publishing/artifact-builder');
    const model = buildFixtureSite();
    model.seo.noindex = false;

    const artifact = await buildSiteArtifactFiles('projeto-1', model, 'PRODUCTION');
    expect(artifact.html).toContain('index,follow');
  });

  it('o checksum e estavel para o mesmo modelo', async () => {
    const { buildSiteArtifactFiles } = await import('@builder/publishing/artifact-builder');
    const model = buildFixtureSite();

    const a = await buildSiteArtifactFiles('projeto-1', model, 'DEMO');
    const b = await buildSiteArtifactFiles('projeto-1', model, 'DEMO');
    expect(a.checksum).toBe(b.checksum);
  });
});
