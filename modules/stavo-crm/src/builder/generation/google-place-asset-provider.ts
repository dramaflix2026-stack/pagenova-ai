/**
 * Importa fotos reais do Google Places para o projeto antes da geracao.
 *
 * A chave do Google nunca sai do servidor. As fotos sao baixadas pelo endpoint
 * oficial, normalizadas pelo mesmo pipeline seguro dos uploads e viram assets
 * do projeto. Assim preview, editor, exportacao e publicacao usam o mesmo
 * AssetRef estavel, sem URL externa fragil.
 */
import { eq } from 'drizzle-orm';

import { processUploadedImage } from '@builder/publishing/image-processing';
import { createLocalStorage } from '@builder/publishing/storage';
import { siteAssetsDirAbsolute } from '@server/config/env';
import { getDb } from '@server/db/client';
import { leads, type SiteProject } from '@server/db/schema';
import { newId } from '@server/lib/ids';
import { placePhotoMedia } from '@server/modules/google/client';
import { fetchLiveDetails } from '@server/modules/google/service';
import * as repo from '@server/modules/site-ai/repository';

const MAX_GOOGLE_ASSETS = 5;

export async function ensureGooglePlaceAssets(project: SiteProject): Promise<number> {
  if (!project.leadId) return 0;

  const existing = (await repo.listAssets(project.id)).filter(
    (asset) => asset.source === 'GOOGLE_PLACES' && !asset.deletedAt,
  );
  if (existing.length >= 2) return existing.length;

  const db = getDb();
  const [lead] = await db
    .select({ placeId: leads.placeId })
    .from(leads)
    .where(eq(leads.id, project.leadId))
    .limit(1);

  if (!lead?.placeId) return existing.length;

  const details = await fetchLiveDetails(db, project.workspaceId, lead.placeId);
  const photos = details.photos.slice(0, MAX_GOOGLE_ASSETS);
  if (photos.length === 0) return existing.length;

  const storage = createLocalStorage(siteAssetsDirAbsolute());
  let imported = existing.length;

  for (const [index, photo] of photos.entries()) {
    if (imported >= MAX_GOOGLE_ASSETS) break;
    try {
      const response = await placePhotoMedia(photo.name, index === 0 ? 2000 : 1600);
      if (!response.ok) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      const processed = await processUploadedImage(buffer);
      if (!processed.ok) continue;

      const storageKey = `${project.id}/${newId()}.webp`;
      await storage.write(storageKey, processed.image.optimized.buffer);

      await repo.insertAsset({
        projectId: project.id,
        source: 'GOOGLE_PLACES',
        provider: 'Google Places',
        storageKey,
        originalFilename: null,
        mimeType: 'image/webp',
        width: processed.image.optimized.width,
        height: processed.image.optimized.height,
        sizeBytes: processed.image.optimized.sizeBytes,
        checksum: processed.image.checksum,
        altText: [
          `Foto real de ${project.businessName}`,
          photo.attribution ? `Google Places - credito: ${photo.attribution}` : 'Google Places',
        ].join(' - ').slice(0, 300),
        rightsStatus: 'LICENSED',
        createdBy: project.createdBy,
      });
      imported += 1;
    } catch {
      // Foto individual indisponivel nao deve derrubar a geracao inteira.
      continue;
    }
  }

  return imported;
}
