/**
 * Provedor de imagens a partir dos uploads do proprio projeto.
 *
 * Uploads chegam com `rightsStatus = OWNED` (quem envia declara ter o direito
 * de uso). So entram como candidatas as imagens ainda validas: nao apagadas,
 * nao expiradas e com direito de uso conhecido.
 */
import * as repo from '@server/modules/site-ai/repository';
import { createLocalStorage } from '@builder/publishing/storage';
import { siteAssetsDirAbsolute } from '@server/config/env';
import type { SiteAssetProvider, SiteImageCandidate } from '@builder/generation/image-candidates';

const USABLE_RIGHTS = new Set(['OWNED', 'LICENSED', 'AI_GENERATED']);

export class UploadAssetProvider implements SiteAssetProvider {
  readonly name = 'uploads';

  async listCandidates(projectId: string, now: Date = new Date()): Promise<SiteImageCandidate[]> {
    const assets = await repo.listAssets(projectId);

    const eligible = assets.filter(
      (asset) =>
        !asset.deletedAt &&
        asset.mimeType.startsWith('image/') &&
        USABLE_RIGHTS.has(asset.rightsStatus) &&
        (!asset.expiresAt || asset.expiresAt > now),
    );
    // MySQL metadata alone does not guarantee that the media file survived
    // Railway redeploys. Only expose verifiably readable bytes to the AI
    // planner and mandatory image binder; never count ghost assets.
    const storage = createLocalStorage(siteAssetsDirAbsolute());
    const present = await Promise.all(eligible.map(async (asset) =>
      storage.read(asset.storageKey).then((bytes) => bytes.length > 0).catch(() => false),
    ));
    return eligible
      .filter((_, index) => present[index])
      .map((asset) => ({
        assetId: asset.id,
        width: asset.width,
        height: asset.height,
        description: (asset.altText ?? '').trim(),
        focalX: asset.focalX === null ? 0.5 : Number(asset.focalX),
        focalY: asset.focalY === null ? 0.5 : Number(asset.focalY),
        source: asset.source,
      }));
  }
}
