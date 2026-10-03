/**
 * Provedor de imagens a partir dos uploads do proprio projeto.
 *
 * Uploads chegam com `rightsStatus = OWNED` (quem envia declara ter o direito
 * de uso). So entram como candidatas as imagens ainda validas: nao apagadas,
 * nao expiradas e com direito de uso conhecido.
 */
import * as repo from '@server/modules/site-ai/repository';
import type { SiteAssetProvider, SiteImageCandidate } from '@builder/generation/image-candidates';

const USABLE_RIGHTS = new Set(['OWNED', 'LICENSED']);

export class UploadAssetProvider implements SiteAssetProvider {
  readonly name = 'uploads';

  async listCandidates(projectId: string, now: Date = new Date()): Promise<SiteImageCandidate[]> {
    const assets = await repo.listAssets(projectId);

    return assets
      .filter(
        (asset) =>
          asset.mimeType.startsWith('image/') &&
          USABLE_RIGHTS.has(asset.rightsStatus) &&
          (!asset.expiresAt || asset.expiresAt > now),
      )
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
