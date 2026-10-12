/**
 * Optional image generation for the PageNova hero. Never generates a person's
 * likeness or claims that a synthetic room is the actual business premises.
 * Generated assets are stored under the project, not reused across tenants.
 */
import { processUploadedImage } from '@builder/publishing/image-processing';
import { createLocalStorage } from '@builder/publishing/storage';
import { siteAssetsDirAbsolute } from '@server/config/env';
import { newId } from '@server/lib/ids';
import type { SiteProject } from '@server/db/schema';
import * as repo from '@server/modules/site-ai/repository';

const MODEL = 'gpt-image-1-mini';
const MAX_RESPONSE_BYTES = 12_000_000;

export async function ensureIllustrativeHero(project: SiteProject, slot: 'hero' | 'supplement' = 'hero'): Promise<'created' | 'existing' | 'unavailable'> {
  const key = process.env.OPENAI_API_KEY;
  const estimatedUsd = Number(process.env.PAGENOVA_AI_HERO_ESTIMATED_USD ?? '0.05');
  // Never perform a paid call without a positive, finite cost estimate.
  if (!Number.isFinite(estimatedUsd) || estimatedUsd <= 0) return 'unavailable';
  if (!key) return 'unavailable';
  const assets = await repo.listAssets(project.id);
  const storage = createLocalStorage(siteAssetsDirAbsolute());
  for (const asset of assets.filter((item) => item.source === 'AI_GENERATED' && !item.deletedAt && (item.altText ?? '').includes(`[${slot}]`) && (item.width ?? 0) > (item.height ?? 0))) {
    if (await storage.read(asset.storageKey).then(() => true).catch(() => false)) return 'existing';
  }

  // Never put private lead data, addresses, names, or real people's likenesses
  // in the prompt. The sector is sufficient for an illustrative banner.
  const niche = String(project.internalName ?? '').slice(0, 100);
  const dental = /odont|dent|sorriso|ortodont|implante|clinica dental/i.test(niche + ' ' + project.businessName);
  const subject = dental
    ? 'a modern, welcoming dental treatment room with an empty dental chair and clean equipment'
    : 'an elegant, contemporary small-business interior with no identifying branding';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        size: '1536x1024',
        quality: 'low',
        n: 1,
        prompt: `Photorealistic editorial website ${slot === 'hero' ? 'hero background' : 'supporting section image'} depicting ${subject}. Wide landscape composition, soft natural light, polished architecture, ${slot === 'hero' ? 'ample uncluttered negative space on the left for readable website copy, visual interest on the right' : 'balanced centered composition showing a different perspective of the space'}. No people, no text, no logos, no watermarks. Illustrative scene only, not a photograph of a specific real business.`,
      }),
    });
    if (!response.ok) return 'unavailable';
    const payload = await response.json() as { data?: Array<{ b64_json?: string }> };
    const encoded = payload.data?.[0]?.b64_json;
    if (!encoded || encoded.length > MAX_RESPONSE_BYTES * 1.4) return 'unavailable';
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.length > MAX_RESPONSE_BYTES) return 'unavailable';
    const processed = await processUploadedImage(bytes);
    if (!processed.ok) return 'unavailable';
    const storageKey = `${project.id}/${newId()}.webp`;
    await storage.write(storageKey, processed.image.optimized.buffer);
    await repo.insertAsset({
      projectId: project.id,
      source: 'AI_GENERATED',
      provider: 'OpenAI',
      providerModel: MODEL,
      storageKey,
      originalFilename: null,
      mimeType: 'image/webp',
      width: processed.image.optimized.width,
      height: processed.image.optimized.height,
      sizeBytes: processed.image.optimized.sizeBytes,
      checksum: processed.image.checksum,
      altText: `[${slot}] ` + (dental ? 'Imagem ilustrativa gerada por IA de consultorio odontologico' : 'Ambiente ilustrativo gerado por IA'),
      rightsStatus: 'AI_GENERATED',
      createdBy: project.ownerUserId,
    });
    await repo.recordUsage({
      projectId: project.id,
      jobId: null,
      provider: 'OpenAI',
      operation: 'GENERATE_IMAGE',
      model: MODEL,
      imageCount: 1,
      costEstimatedUsd: estimatedUsd.toFixed(6),
      pricingVersion: 'configurable-image-estimate-v1',
      status: 'SUCCESS',
    });
    await repo.addProjectCost(project.id, estimatedUsd.toFixed(6));
    return 'created';
  } catch {
    return 'unavailable';
  } finally {
    clearTimeout(timeout);
  }
}
