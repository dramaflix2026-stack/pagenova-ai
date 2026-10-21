/**
 * Niche-specific illustrations for mandatory PageNova image slots. Never generates a person's
 * likeness or claims that a synthetic room is the actual business premises.
 * Generated assets are stored under the project, not reused across tenants.
 */
import { processUploadedImage } from '@builder/publishing/image-processing';
import { createLocalStorage } from '@builder/publishing/storage';
import { siteAssetsDirAbsolute } from '@server/config/env';
import { newId } from '@server/lib/ids';
import { logger } from '@server/lib/logger';
import type { SiteProject } from '@server/db/schema';
import * as repo from '@server/modules/site-ai/repository';

const MODEL = 'gpt-image-1-mini';
const MAX_RESPONSE_BYTES = 12_000_000;

export async function ensureIllustrativeHero(project: SiteProject, slot: 'hero' | 'about' | 'supplement' = 'hero'): Promise<'created' | 'existing' | 'unavailable'> {
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
  // The project name can be generic ("Novo projeto"). Read the saved briefing
  // only to classify the industry; never send the original briefing to images.
  const draft = project.draftConfig as {freeformInstructions?: unknown; business?: {name?: unknown; niche?: unknown; description?: unknown}} | null;
  const brief = typeof draft?.freeformInstructions === 'string' ? draft.freeformInstructions.slice(0, 1800) : '';
  const industry = typeof draft?.business?.niche === 'string' ? draft.business.niche.slice(0, 100) : '';
  const context = [niche, project.businessName, industry, brief].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const sectors: Array<{pattern: RegExp; subject: string; label: string}> = [
    {pattern: /odont|dentist|dentari|ortodont|implante dent|clinica dental|sorriso prime/, subject: 'a contemporary dental treatment room with an empty dental chair, dental lamp and clean dental instruments', label: 'consultorio odontologico'},
    {pattern: /estetica|spa|beleza|skincare|facial|depilac|cosmetic/, subject: 'a refined beauty treatment studio with a professional treatment bed and elegant skincare equipment', label: 'clinica de estetica'},
    {pattern: /cabelo|cabeleireir|barbearia|barber|salao de beleza/, subject: 'an upscale hair salon with styling chairs, large mirrors and professional hairdressing tools', label: 'salao de beleza'},
    {pattern: /restaurante|pizzaria|hamburguer|cafeteria|bistro|gastronom|sushi|padaria/, subject: 'a welcoming restaurant dining room with beautifully arranged tables and a warm culinary atmosphere', label: 'restaurante'},
    {pattern: /imobiliari|imoveis|corretor de imoveis|arquitet|interiores/, subject: 'a sophisticated residential interior with thoughtful architecture and natural daylight', label: 'arquitetura e imoveis'},
    {pattern: /academia|fitness|pilates|personal trainer|musculac/, subject: 'a bright modern fitness studio with organized exercise equipment and ample open floor space', label: 'estudio de atividade fisica'},
    {pattern: /advocac|advogad|juridic|escritorio de direito/, subject: 'an elegant law office with a refined meeting table, bookshelves and natural daylight', label: 'escritorio juridico'},
    {pattern: /medic|saude|fisioterap|psicolog|nutricion|terapia|clinica/, subject: 'a modern welcoming healthcare consultation room with professional clinical furniture', label: 'consultorio de saude'},
    {pattern: /tecnolog|tech|informat|sistemas|digital|software|comput|infraestrutura|conectividade|cloud/, subject: 'a sophisticated technology workspace with contemporary computers and thoughtfully arranged equipment', label: 'tecnologia'},
    {pattern: /loja|ecommerce|e-commerce|moda|vestuario|roupas|boutique/, subject: 'a premium retail boutique interior with carefully curated merchandise displays', label: 'comercio varejista'},
    {pattern: /construc|engenhari|reforma|obra|marcenaria/, subject: 'a polished architecture and construction project space with quality building materials and professional tools', label: 'construcao e engenharia'},
    {pattern: /pet shop|veterinari|animais|banho e tosa/, subject: 'a clean modern veterinary consultation room with organized pet care equipment', label: 'cuidados animais'},
  ];
  const sector = sectors.find(item => item.pattern.test(context));
  const subject = sector?.subject ?? 'a refined neutral editorial still life of professional tools on a minimal studio background, with no unrelated retail or fashion scenery';
  const sectorLabel = sector?.label ?? 'atividade profissional';
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
        prompt: `Premium editorial website illustration for ${slot === 'hero' ? 'the homepage hero' : slot === 'about' ? 'the company story/about section' : 'the how-we-work/process section'} depicting ${subject}. Beautiful, wide horizontal 3:2 composition, distinct visual perspective and carefully arranged details. ${slot === 'hero' ? 'Open negative space on the left for overlaid website copy, important details on the right.' : slot === 'about' ? 'Warm editorial details with a sophisticated close-up perspective, suitable for a company introduction.' : 'A practical process-oriented work scene from an alternate angle, visually distinct from the hero and about sections.'} Soft natural light, realistic materials. NO PEOPLE, NO FACES, no people-like photographs, NO TEXT, no logos, no trademarks, no watermarks. Conceptual illustration only; never pretend this depicts a real business, premises or team.`,
      }),
    });
    if (!response.ok) {
      // Never log API keys, prompts or the response body; the HTTP status is
      // enough to distinguish auth/quota/model errors in Railway logs.
      logger.warn({ projectId: project.id, slot, model: MODEL, httpStatus: response.status },
        'PAGENOVA_IMAGE_OPENAI_HTTP_FAILURE');
      return 'unavailable';
    }
    const payload = await response.json() as { data?: Array<{ b64_json?: string }> };
    const encoded = payload.data?.[0]?.b64_json;
    if (!encoded || encoded.length > MAX_RESPONSE_BYTES * 1.4) {
      logger.warn({ projectId: project.id, slot, model: MODEL }, 'PAGENOVA_IMAGE_INVALID_RESPONSE');
      return 'unavailable';
    }
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.length > MAX_RESPONSE_BYTES) {
      logger.warn({ projectId: project.id, slot, size: bytes.length }, 'PAGENOVA_IMAGE_OVERSIZE');
      return 'unavailable';
    }
    const processed = await processUploadedImage(bytes);
    if (!processed.ok) {
      logger.warn({ projectId: project.id, slot }, 'PAGENOVA_IMAGE_PROCESSING_FAILED');
      return 'unavailable';
    }
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
      altText: `[${slot}] Imagem ilustrativa gerada por IA de ${sectorLabel}`,
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
  } catch (error) {
    logger.error({ err: error, projectId: project.id, slot }, 'PAGENOVA_IMAGE_STORAGE_OR_NETWORK_FAILED');
    return 'unavailable';
  } finally {
    clearTimeout(timeout);
  }
}
