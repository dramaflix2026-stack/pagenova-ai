/**
 * Recover existing media before a site is republished. This never invokes
 * paid image generation. Use verified assets already belonging to this project
 * and recover previous published copies after Railway replaces its filesystem.
 */
import type { SiteSchemaModel, AssetRef } from '@site-kit/schemas/site-schema';
import type { SiteProject } from '@server/db/schema';
import * as repo from '@server/modules/site-ai/repository';
import { createLocalStorage } from '@builder/publishing/storage';
import { publicSitesDirAbsolute, siteAssetsDirAbsolute } from '@server/config/env';

type ImageAsset = Awaited<ReturnType<typeof repo.listAssets>>[number];
type AvailableAsset = { asset: ImageAsset; ref: AssetRef };

export async function restoreAvailableImageSlots(project: SiteProject, model: SiteSchemaModel): Promise<void> {
  const assets = createLocalStorage(siteAssetsDirAbsolute());
  const published = createLocalStorage(publicSitesDirAbsolute());
  const candidates = (await repo.listAssets(project.id)).filter((a) =>
    !a.deletedAt &&
    a.mimeType.startsWith('image/') &&
    ['OWNED', 'LICENSED', 'AI_GENERATED'].includes(a.rightsStatus) &&
    (!a.expiresAt || a.expiresAt > new Date()),
  );
  if (!candidates.length) return;

  const publications = await repo.listPublications(project.id);
  const available: AvailableAsset[] = [];
  for (const asset of candidates) {
    let buffer = await assets.read(asset.storageKey).catch(() => null);
    if (!buffer) {
      for (const publication of publications) {
        if (!publication.artifactKey || !['ACTIVE','SUPERSEDED'].includes(publication.status)) continue;
        const saved = await published.read(
          `${publication.artifactKey}/assets/images/${asset.id}.webp`,
        ).catch(() => null);
        if (!saved) continue;
        buffer = saved;
        await assets.write(asset.storageKey, saved);
        break;
      }
    }
    if (!buffer) continue;
    available.push({
      asset,
      ref: {
        assetId: asset.id,
        alt: (asset.altText || 'Imagem do projeto').slice(0, 200),
        focalX: asset.focalX === null ? 0.5 : Number(asset.focalX),
        focalY: asset.focalY === null ? 0.5 : Number(asset.focalY),
      },
    });
  }

  const availableIds = new Set(available.map(({asset}) => asset.id));
  const isAvailable = (ref: AssetRef | undefined) => Boolean(ref?.assetId && availableIds.has(ref.assetId));
  const used = new Set<string>();
  for (const section of model.sections) {
    const existing = 'image' in section ? section.image as AssetRef | undefined : undefined;
    if (existing?.assetId) used.add(existing.assetId);
    if (section.type === 'process') {
      for (const step of section.steps) if (step.image?.assetId) used.add(step.image.assetId);
    }
  }

  const assign = (predicate: (candidate: ImageAsset) => boolean): AssetRef | undefined => {
    const found = available.find(({asset}) => !used.has(asset.id) && predicate(asset));
    if (!found) return;
    used.add(found.asset.id);
    return found.ref;
  };
  const portrait = model.sections.find((section) => section.type === 'about');
  if (portrait?.type === 'about' && !isAvailable(portrait.image)) {
    const replacement = assign((asset) => asset.source === 'GOOGLE_PLACES') ??
      assign((asset) => asset.source === 'UPLOAD');
    // Keep the missing reference if there is no safe alternative: the
    // artifact builder will report the missing original instead of lying.
    if (replacement) portrait.image = replacement;
  }
  const hero = model.sections.find((section) => section.type === 'hero');
  if (hero?.type === 'hero' && !isAvailable(hero.image)) {
    const replacement = assign((asset) => asset.source === 'AI_GENERATED' &&
      (asset.altText ?? '').includes('[hero]') &&
      (asset.width ?? 0) > (asset.height ?? 0)) ??
      assign((asset) => asset.source === 'UPLOAD' && (asset.width ?? 0) > (asset.height ?? 0)) ??
      assign((asset) => asset.source === 'GOOGLE_PLACES' && (asset.width ?? 0) > (asset.height ?? 0));
    if (replacement) hero.image = replacement;
  }
  const process = model.sections.find((section) => section.type === 'process');
  if (process?.type === 'process' && process.steps.length &&
      !process.steps.some((step) => isAvailable(step.image))) {
    const replacement = assign((asset) => asset.source === 'GOOGLE_PLACES') ??
      assign((asset) => asset.source === 'UPLOAD') ??
      assign((asset) => asset.source === 'AI_GENERATED' &&
        (asset.altText ?? '').includes('[supplement]'));
    if (replacement) {
      for (const step of process.steps) {
        if (step.image?.assetId && !isAvailable(step.image)) delete step.image;
      }
      process.steps[0]!.image = replacement;
    }
  }
}
