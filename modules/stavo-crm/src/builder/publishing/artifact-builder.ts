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
import { getEnv, siteAssetsDirAbsolute, publicSitesDirAbsolute } from '@server/config/env';

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

    // Process / services / benefits can carry a photo per item. The canonical
    // FRIGOLOG adapter reads process.steps[].image, so those bytes must ship
    // with published snapshots and ZIP exports, not just appear in preview.
    for (const field of ['steps', 'items'] as const) {
      const nested = record[field];
      if (!Array.isArray(nested)) continue;
      for (const item of nested) {
        if (!item || typeof item !== 'object') continue;
        const itemImage = (item as { image?: AssetRef }).image;
        if (itemImage?.assetId) ids.add(itemImage.assetId);
      }
    }
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
  options: { inlineRuntime?: string; publicBasePath?: string } = {},
): Promise<BuiltArtifact> {
  const assetIds = collectAssetIds(model);
  const assets = createLocalStorage(siteAssetsDirAbsolute());

  const files: ArtifactFile[] = [];
  const resolved = new Map<string, { url: string; width?: number; height?: number }>();

  for (const assetId of assetIds) {
    const source = await repo.findAsset(projectId, assetId);
    if (!source) continue; // asset removido depois de referenciado: some do site, nao quebra.

    let buffer = await assets.read(source.storageKey).catch(() => null);
    if (!buffer) {
      // Prefer recovering the very same bytes from an earlier immutable
      // publication rather than regenerating a paid AI image or replacing a
      // real portrait. Published artifacts are scoped to this project.
      const publicStorage = createLocalStorage(publicSitesDirAbsolute());
      const publications = await repo.listPublications(projectId);
      for (const publication of publications) {
        if (!publication.artifactKey || !['ACTIVE', 'SUPERSEDED'].includes(publication.status)) continue;
        const key = `${publication.artifactKey}/assets/images/${assetId}.webp`;
        buffer = await publicStorage.read(key).catch(() => null);
        if (buffer) {
          await assets.write(source.storageKey, buffer);
          break;
        }
      }
    }
    if (!buffer) {
      // Refuse to publish a broken image; do not pretend an unrelated photo
      // is the original asset or charge for another OpenAI generation.
      throw new Error(`Asset referenciado indisponivel no storage: ${assetId} (${source.source}).`);
    }

    const relative = `assets/images/${assetId}.webp`;
    files.push({ path: relative, buffer });
    const publicUrl = options.publicBasePath
      ? `${options.publicBasePath.replace(/\/$/, '')}/${relative}`
      : relative;
    resolved.set(assetId, { url: publicUrl, width: source.width ?? undefined, height: source.height ?? undefined });
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
