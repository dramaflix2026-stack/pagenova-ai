/**
 * Frente 3: product-to-module mapping for NEW Kiwify subscriptions.
 * Isolated from the legacy webhook. This module does not grant access,
 * process payments, or modify existing subscriptions.
 *
 * Set explicit Kiwify product IDs in server-only configuration before use.
 * Names, prices, checkout URLs and webhook signatures are NOT product IDs.
 */
import { expandEntitlements, MODULAR_CATALOG } from "./modular-catalog";

export const NEW_KIWIFY_PRODUCT_ENV_KEYS = {
  "bundle.studio": "KIWIFY_PRODUCT_ID_STUDIO",
  "bundle.crm": "KIWIFY_PRODUCT_ID_CRM",
  "studio.sites": "KIWIFY_PRODUCT_ID_SITES",
  "studio.landing": "KIWIFY_PRODUCT_ID_LANDING",
  "studio.cloner": "KIWIFY_PRODUCT_ID_CLONER",
  "studio.forms": "KIWIFY_PRODUCT_ID_FORMS",
  "studio.quizzes": "KIWIFY_PRODUCT_ID_QUIZZES",
  "studio.ebooks": "KIWIFY_PRODUCT_ID_EBOOKS",
  "crm.search": "KIWIFY_PRODUCT_ID_CRM_SEARCH",
  "crm.leads": "KIWIFY_PRODUCT_ID_CRM_LEADS",
  "crm.operations": "KIWIFY_PRODUCT_ID_CRM_OPERATIONS",
} as const;

export type NewKiwifyProductCode = keyof typeof NEW_KIWIFY_PRODUCT_ENV_KEYS;
export type ProductIdConfiguration = Partial<Record<NewKiwifyProductCode, string>>;

export function validateProductIdConfiguration(config: ProductIdConfiguration): void {
  const ids = new Set<string>();
  for (const code of Object.keys(NEW_KIWIFY_PRODUCT_ENV_KEYS) as NewKiwifyProductCode[]) {
    const id = config[code]?.trim();
    if (!id) continue;
    if (ids.has(id)) throw new Error("Duplicate Kiwify product ID configuration");
    ids.add(id);
  }
}

/**
 * Fail closed: unknown, ambiguous and coming-soon products grant no modules.
 * Returns null instead of falling back to a product name or a full-access plan.
 */
export function resolveNewKiwifyProduct(
  productId: unknown,
  config: ProductIdConfiguration,
): { code: NewKiwifyProductCode; modules: readonly string[] } | null {
  if (typeof productId !== "string" || !productId.trim()) return null;
  validateProductIdConfiguration(config);
  const matches = (Object.keys(NEW_KIWIFY_PRODUCT_ENV_KEYS) as NewKiwifyProductCode[])
    .filter(code => config[code]?.trim() === productId.trim());
  if (matches.length !== 1) return null;
  const code = matches[0];
  const entry = MODULAR_CATALOG.find(item => item.code === code);
  if (!entry || entry.status === "coming_soon") return null;
  return { code, modules: expandEntitlements([code]) };
}

/**
 * Aggregate active, individually verified subscriptions. A revoked order
 * only removes the modules it contributed; overlapping rights remain.
 * The caller MUST authenticate and filter orders by the current customer.
 */
export function aggregateActiveKiwifyModules(
  orders: readonly { productId: string; status: string }[],
  config: ProductIdConfiguration,
): string[] {
  const result = new Set<string>();
  for (const order of orders) {
    if (order.status !== "active") continue;
    const mapped = resolveNewKiwifyProduct(order.productId, config);
    for (const module of mapped?.modules ?? []) result.add(module);
  }
  return [...result];
}
