/**
 * Montagem do artefato estatico: a fonte compartilhada entre a publicacao
 * (A12) e a exportacao ZIP (A13).
 *
 * As duas etapas da especificacao insistem no mesmo ponto por caminhos
 * diferentes -- secao 5.5 ("um unico renderer") e secao 17.1 ("a mesma
 * fonte") -- porque e o unico jeito de garantir que o link publicado e o
 * ZIP baixado sejam BIT A BIT o mesmo site. Esta funcao e onde essa garantia
 * vive: publicar e exportar chamam o MESMO `buildSiteArtifactFiles`, so o
 * destino dos bytes muda depois.
 */
import { createHash } from 'node:crypto';

import { renderSite, type RenderContext } from '@site-kit/renderer/render-site';
import type { AssetRef, SiteSchemaModel } from '@site-kit/schemas/site-schema';
import * as repo from '@server/modules/site-ai/repository';
import { createLocalStorage } from '@builder/publishing/storage';
import { getEnv, siteAssetsDirAbsolute } from '@server/config/env';

export interface ArtifactFile {
  /** Caminho relativo dentro do artefato, ex.: "assets/images/x.webp". */
  path: string;
  buffer: Buffer;
}

export interface BuiltArtifact {
  html: string;
  files: ArtifactFile[];
  checksum: string;
}

/** Todo assetId referenciado pelo modelo. Hoje: imagem unica por secao, logo, OG. */
export function collectAssetIds(model: SiteSchemaModel): string[] {
  const ids = new Set<string>();

  for (const section of model.sections) {
    const record = section as unknown as Record<string, unknown>;
    const image = record.image as AssetRef | undefined;
    if (image?.assetId) ids.add(image.assetId);

    const images = record.images as AssetRef[] | undefined;
    if (Array.isArray(images)) for (const img of images) if (img?.assetId) ids.add(img.assetId);
  }
  if (model.navigation.logo?.assetId) ids.add(model.navigation.logo.assetId);
  if (model.seo.ogImage?.assetId) ids.add(model.seo.ogImage.assetId);

  return [...ids];
}

/**
 * Renderiza o HTML e copia os assets referenciados para caminhos RELATIVOS.
 *
 * `profile` decide noindex/canonical (secao 17.3): a demonstracao e sempre
 * noindex; o perfil de producao usa o que o `SiteSchema` ja tiver
 * configurado, sem inventar um canonical para um dominio que nao existe.
 */
export async function buildSiteArtifactFiles(
  projectId: string,
  model: SiteSchemaModel,
  profile: RenderContext['profile'],
  options: { inlineRuntime?: string } = {},
): Promise<BuiltArtifact> {
  const assetIds = collectAssetIds(model);
  const assets = createLocalStorage(siteAssetsDirAbsolute());

  const files: ArtifactFile[] = [];
  const resolved = new Map<string, { url: string; width?: number; height?: number }>();

  for (const assetId of assetIds) {
    const source = await repo.findAsset(projectId, assetId);
    if (!source) continue; // asset removido depois de referenciado: some do site, nao quebra.

    const buffer = await assets.read(source.storageKey).catch(() => null);
    if (!buffer) continue;

    const relative = `assets/images/${assetId}.webp`;
    files.push({ path: relative, buffer });
    resolved.set(assetId, { url: relative, width: source.width ?? undefined, height: source.height ?? undefined });
  }

  const ctx: RenderContext = {
    profile,
    resolveAsset: (assetId) => resolved.get(assetId) ?? null,
    inlineRuntime: options.inlineRuntime,
    fontSource: getEnv().SITE_FONTS_SOURCE,
  };
  const html = renderSite(model, ctx);
  const checksum = createHash('sha256').update(html).digest('hex');

  return { html, files, checksum };
}
