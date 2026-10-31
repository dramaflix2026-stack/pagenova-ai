/** Template 6 — Comércio e Varejo. Names match niche-photo-catalog.json exactly. */
export const TEMPLATE_6_CATEGORY = "Comércio e Varejo" as const;
export const TEMPLATE_6_NICHES = [
  "Loja de roupas",
  "Moda feminina",
  "Moda masculina",
  "Joalheria",
  "Ótica",
  "Pet shop",
  "Calçados",
  "Eletrônicos",
  "Cosméticos",
  "Papelaria",
  "Presentes",
  "Floricultura",
  "Brinquedos",
  "Artigos esportivos",
  "Loja de suplementos"
] as const;
export type Template6Niche = (typeof TEMPLATE_6_NICHES)[number];
export function isTemplate6Niche(value: string): value is Template6Niche {
  return (TEMPLATE_6_NICHES as readonly string[]).includes(value);
}
