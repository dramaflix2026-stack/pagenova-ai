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
