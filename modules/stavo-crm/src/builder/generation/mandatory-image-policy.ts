/**
 * Mandatory image slots for CRM-generated sites.
 * Verified Google Places / owner images take priority over synthetic media.
 * AI illustrations fill only missing hero/about/process slots and never
 * impersonate a real business. With three real photos, no AI image is needed.
 * The caller still enforces budget and provider prerequisites for required slots.
 */
export type MandatoryImageSlot = 'hero' | 'about' | 'supplement';
export function imageGenerationKeyPresent(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}
export function requiredIllustrationSlots(realPhotoCount: number): MandatoryImageSlot[] {
  const count = Number.isFinite(realPhotoCount) ? Math.max(0, Math.floor(realPhotoCount)) : 0;
  if (count === 0) return ['hero', 'about', 'supplement'];
  if (count === 1) return ['about', 'supplement'];
  if (count === 2) return ['supplement'];
  return [];
}

/**
 * Deterministic CRM hero selection, independent of the model's proposed image
 * binding. This never mutates/deletes existing template media or asset records.
 */
export function choosePrimaryHeroImage<T extends {
  assetId: string;
  source: string;
  description: string;
  width?: number | null;
  height?: number | null;
}>(candidates: readonly T[], reservedAboutAssetId?: string): T | undefined {
  const remaining = candidates.filter((item) => item.assetId !== reservedAboutAssetId);
  const isWide = (item: T) => !item.width || !item.height || item.width >= item.height;
  const prefer = (source: string, wideOnly: boolean): T | undefined =>
    remaining.find((item) => item.source === source && (!wideOnly || isWide(item)));

  return prefer('GOOGLE_PLACES', true)
    ?? prefer('GOOGLE_PLACES', false)
    ?? prefer('UPLOAD', true)
    ?? prefer('UPLOAD', false)
    ?? remaining.find((item) => item.source === 'AI_GENERATED' && item.description.includes('[hero]'))
    ?? remaining[0];
}
