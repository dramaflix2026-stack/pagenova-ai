/**
 * TP3 / Modelo 01 — editorial de comida japonesa.
 *
 * O modelo anterior compartilhava imagens de padaria com todos os nichos.
 * Este catálogo tem fotos de sushi/sashimi/cozinha japonesa provenientes do
 * conjunto externo já usado nos Modelos 02 e 03. Nunca reutilize fallback de
 * pão/croissant. O editor continua podendo sobrepor uma foto enviada pelo dono.
 */
export const JAPANESE_MODEL1_PHOTO_IDS = [
  "photo-1579871494447-9811cf80d66c", // sushi combinado
  "photo-1553621042-f6e147245754", // sushi servido
  "photo-1579584425555-c3ce17fd4351", // sushi e sashimi
  "photo-1611143669185-af224c5e3252", // prato japonês
  "photo-1559410545-0bdcd187e0a6", // cozinha japonesa
  "photo-1563612116625-3012372fccce", // culinária japonesa
  "photo-1558985250-27a406d64cb3", // especialidade oriental
  "photo-1617196034796-73dfa7b1fd56", // sushi
  "photo-1519984388953-d2406bc725e1", // prato japonês
  "photo-1583623025817-d180a2221d0a", // ambiente culinário
  "photo-1582450871972-ab5ca641643d", // sushi
  "photo-1615361200141-f45040f367be", // preparo japonês
] as const;

export const JAPANESE_MODEL1_SECTIONS = [
  "inicio", "especialidades", "diferenciais", "sobre", "galeria",
  "processo", "depoimentos", "faq", "localizacao", "rodape",
] as const;

export function isJapaneseCuisineNiche(nicheOrTitle: string): boolean {
  return /comida\s+japones[ae]|culin[aá]ria\s+japones[ae]|japon[eê]s|japonesa|sushi|temakeria|izakaya|sashimi|yakisoba|ramen/i.test(nicheOrTitle);
}
export function japaneseModel1Photo(index: number, width = 1400): string {
  const id = JAPANESE_MODEL1_PHOTO_IDS[Math.abs(Math.trunc(index)) % JAPANESE_MODEL1_PHOTO_IDS.length];
  return "https://images.unsplash.com/" + id + "?auto=format&fit=crop&w=" + width + "&q=85";
}
export function isGenericJapaneseSiteName(name: string): boolean {
  return /^(?:del[ií]cias?\s+(?:da\s+)?comida\s+japonesa|comida\s+japonesa|restaurante\s+japon[eê]s|gastronomia|novo\s+site|site\s+de\s+comida\s+japonesa)$/i.test(name.trim());
}
export function japaneseModel1Brand(siteTitle: string, headerBrand?: string, publishedMode = false): { brand: string; demo: boolean } {
  const raw = (headerBrand || siteTitle).trim();
  if (raw && !isGenericJapaneseSiteName(raw)) return { brand: raw, demo: false };
  return publishedMode
    ? { brand: "Restaurante japonês", demo: false }
    : { brand: "Sakura Sushi", demo: true };
}
