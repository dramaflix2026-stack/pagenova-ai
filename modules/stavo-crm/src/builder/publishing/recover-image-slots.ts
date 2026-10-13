/**
 * Canonical media binding for all PageNova/FRIGOLOG sites.
 * Bind only bytes that can actually be read. Avoid references to deleted
 * Railway ephemeral files, repeated images, and missing sections.
 *
 * This function NEVER calls an image API. Image creation (and its cost) is
 * handled beforehand, explicitly, by the generation / recovery workflow.
 */
import type { AssetRef, SiteSchemaModel } from '@site-kit/schemas/site-schema';
import type { SiteProject } from '@server/db/schema';
import * as repo from '@server/modules/site-ai/repository';
import { createLocalStorage } from '@builder/publishing/storage';
import { publicSitesDirAbsolute, siteAssetsDirAbsolute } from '@server/config/env';

type ImageAsset = Awaited<ReturnType<typeof repo.listAssets>>[number];
type Available = { asset: ImageAsset; ref: AssetRef };

export interface MediaSlotStatus {
  hero: boolean;
  about: boolean;
  process: boolean;
}

export async function restoreAvailableImageSlots(
  project: SiteProject,
  model: SiteSchemaModel,
  options: { required?: boolean } = {},
): Promise<MediaSlotStatus> {
  const storage = createLocalStorage(siteAssetsDirAbsolute());
  const publicStorage = createLocalStorage(publicSitesDirAbsolute());
  const candidates = (await repo.listAssets(project.id)).filter((a) =>
    !a.deletedAt && a.mimeType.startsWith('image/') &&
    ['OWNED', 'LICENSED', 'AI_GENERATED'].includes(a.rightsStatus) &&
    (!a.expiresAt || a.expiresAt > new Date()),
  );
  const publications = await repo.listPublications(project.id);
  const available: Available[] = [];

  for (const asset of candidates) {
    let bytes = await storage.read(asset.storageKey).catch(() => null);
    if (!bytes) {
      // Published copies are immutable. Prefer original bytes over re-fetching
      // a Google image or making a new (paid) image generation call.
      for (const publication of publications) {
        if (!publication.artifactKey || !['ACTIVE', 'SUPERSEDED'].includes(publication.status)) continue;
        bytes = await publicStorage.read(
          `${publication.artifactKey}/assets/images/${asset.id}.webp`,
        ).catch(() => null);
        if (bytes) {
          await storage.write(asset.storageKey, bytes);
          break;
        }
      }
    }
    if (!bytes) continue;
    available.push({
      asset,
      ref: {
        assetId: asset.id,
        alt: (asset.altText || (asset.source === 'AI_GENERATED' ? 'Imagem ilustrativa gerada por IA' : 'Fotografia do projeto')).slice(0, 200),
        focalX: asset.focalX === null ? 0.5 : Number(asset.focalX),
        focalY: asset.focalY === null ? 0.5 : Number(asset.focalY),
      },
    });
  }

  const byId = new Map(available.map((item) => [item.asset.id, item]));
  const used = new Set<string>();
  const isAiSlot = (a: ImageAsset, slot: 'hero' | 'about' | 'supplement') =>
    a.source === 'AI_GENERATED' && (a.altText ?? '').includes(`[${slot}]`);

  const choose = (
    current: AssetRef | undefined,
    kinds: ReadonlyArray<(a: ImageAsset) => boolean>,
  ): AssetRef | undefined => {
    // A verified current selection is authoritative unless already used by a
    // previous section; gallery/hero/process must not repeat the same image.
    if (current?.assetId && byId.has(current.assetId) && !used.has(current.assetId)) {
      used.add(current.assetId);
      return current;
    }
    for (const kind of kinds) {
      const match = available.find(({ asset }) => !used.has(asset.id) && kind(asset));
      if (match) {
        used.add(match.asset.id);
        return match.ref;
      }
    }
    return undefined;
  };

  const isReal = (a: ImageAsset) => a.source === 'GOOGLE_PLACES' || a.source === 'UPLOAD';
  const isWide = (a: ImageAsset) => !a.width || !a.height || a.width >= a.height;

  const hero = model.sections.find((section) => section.type === 'hero');
  const about = model.sections.find((section) => section.type === 'about');
  const process = model.sections.find((section) => section.type === 'process');

  if (hero?.type === 'hero') {
    // Prefer the dedicated AI hero over an older generic photo occupying that
    // slot, freeing genuine business photos for the About section.
    const currentHero = hero.image && byId.get(hero.image.assetId)?.asset.source === 'AI_GENERATED'
      ? hero.image : undefined;
    hero.image = choose(currentHero, [
      (a) => isAiSlot(a, 'hero'),
      (a) => isReal(a) && isWide(a),
    ]);
  }

  if (about?.type === 'about') {
    // Prefer the business's actual Google/owner photo. When none exists, show
    // a labelled illustrative business scene, NEVER an AI-made staff portrait.
    const originalAbout = about.image && byId.get(about.image.assetId);
    const currentAbout = originalAbout && isReal(originalAbout.asset) ? about.image : undefined;
    about.image = choose(currentAbout, [
      (a) => isReal(a),
      (a) => isAiSlot(a, 'about'),
    ]);
  }

  if (process?.type === 'process') {
    // Keep existing usable step references; prefer the first step visually,
    // and avoid reusing the Hero/About asset. A unique supplement is mandatory
    // when Google has fewer distinct photos than the required image sections.
    const first = process.steps[0];
    let bound: AssetRef | undefined;
    if (first) {
      const existing = process.steps.find((step) => step.image && byId.has(step.image.assetId) &&
        !used.has(step.image.assetId))?.image;
      bound = choose(existing, [
        (a) => isReal(a),
        (a) => isAiSlot(a, 'supplement'),
      ]);
      process.steps.forEach((step, i) => {
        step.image = i === 0 ? bound : undefined;
      });
    }
  }

  const status: MediaSlotStatus = {
    hero: Boolean(hero?.type === 'hero' && hero.image),
    about: Boolean(about?.type === 'about' && about.image),
    process: Boolean(process?.type === 'process' && process.steps[0]?.image),
  };
  if (options.required && (!status.hero || !status.about || !status.process)) {
    const missing = (Object.entries(status) as Array<[keyof MediaSlotStatus, boolean]>)
      .filter(([, present]) => !present).map(([slot]) => slot);
    throw new Error(
      'PAGENOVA_MANDATORY_IMAGES_MISSING: ' + missing.join(', ') +
      '. Imagens obrigatórias ausentes ou arquivos não recuperáveis; ' +
      'não liberar nem publicar site sem imagens.',
    );
  }
  return status;
}
