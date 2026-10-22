/**
 * Builder V2 — photographic asset catalog contract.
 * This module is intentionally NOT wired into generation yet.
 * Images must be reviewed, licensed and uploaded before activation.
 * No generated portraits, fake staff or misleading business imagery.
 */
export const NICHE_PHOTO_ROLES = [
  "hero",
  "services",
  "team",
  "environment",
  "details",
  "institutional",
] as const;

export type NichePhotoRole = (typeof NICHE_PHOTO_ROLES)[number];
export type NichePhoto = {
  role: NichePhotoRole;
  url: string;
  alt: string;
  credit?: string;
  licenseSource: string;
  approved: boolean;
};
export type NichePhotoCollection = {
  niche: string;
  photos: NichePhoto[];
};

/** A niche is usable only when all six reviewed photographs are available. */
export function isNichePhotoCollectionReady(
  collection: NichePhotoCollection | undefined,
): collection is NichePhotoCollection {
  if (!collection || collection.photos.length !== NICHE_PHOTO_ROLES.length) return false;
  return NICHE_PHOTO_ROLES.every(role => collection.photos.some(photo =>
    photo.role === role &&
    photo.approved &&
    /^https:\/\//.test(photo.url) &&
    photo.alt.trim().length > 0 &&
    photo.licenseSource.trim().length > 0
  ));
}

/**
 * Curated catalog: populate only after real photos have been licensed,
 * reviewed and uploaded. An empty catalog MUST NOT trigger AI imagery.
 */
export const nichePhotoCollections: Record<string, NichePhotoCollection> = {};
export function findApprovedNichePhotos(niche: string): NichePhoto[] | null {
  const collection = nichePhotoCollections[niche.toLocaleLowerCase("pt-BR").trim()];
  return isNichePhotoCollectionReady(collection) ? collection.photos : null;
}
