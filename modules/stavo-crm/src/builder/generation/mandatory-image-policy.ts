/**
 * Universal-site mandatory imagery policy. With no real Google/owner photo,
 * the generator needs three distinct editorial illustrations; with one real
 * photo it needs two; with two or more real photos it only needs the AI hero.
 * Synthetic imagery is never represented as photographs of a real company.
 *
 * The obsolete PAGENOVA_AI_HERO_IMAGES switch cannot disable an advertised
 * feature; budget checks, API key and explicit consent for image-only repairs
 * continue to apply.
 */
export type MandatoryImageSlot = 'hero' | 'about' | 'supplement';
export function imageGenerationKeyPresent(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}
export function requiredIllustrationSlots(realPhotoCount: number): MandatoryImageSlot[] {
  const count = Number.isFinite(realPhotoCount) ? Math.max(0, Math.floor(realPhotoCount)) : 0;
  if (count === 0) return ['hero', 'about', 'supplement'];
  if (count === 1) return ['hero', 'supplement'];
  return ['hero'];
}
