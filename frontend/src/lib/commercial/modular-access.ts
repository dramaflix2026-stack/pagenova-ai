/** Server-only modular authorization helpers.
 * Data MUST be fetched with a trusted backend and scoped to the authenticated
 * user's verified identity. Never trust an email passed by the browser.
 */
import {expandEntitlements, MODULAR_CATALOG} from "./modular-catalog";

export type ModularGrant = Readonly<{
  module_code: string;
  state: string;
  valid_from: string | null;
  valid_until: string | null;
}>;

const VALID_CODES = new Set(MODULAR_CATALOG.filter(x=>x.status!=="coming_soon").map(x=>x.code));
const FAMILY_TO_MODULES: Readonly<Record<string,readonly string[]>> = {
  studio: ["studio.sites","studio.landing","studio.cloner","studio.forms","studio.quizzes","studio.ebooks"],
  crm: ["crm.search","crm.leads","crm.operations"],
  // apps is intentionally omitted: development tools are not yet available.
};

/** Valid at time, independently of how many overlapping subscriptions exist. */
export function resolveActiveModules(grants: readonly ModularGrant[], at = new Date()): string[] {
  if (!Number.isFinite(at.getTime())) throw new Error("Invalid timestamp");
  const modules = new Set<string>();
  for (const grant of grants) {
    if (grant.state !== "active") continue;
    const start = grant.valid_from ? new Date(grant.valid_from).getTime() : -Infinity;
    const end = grant.valid_until ? new Date(grant.valid_until).getTime() : Infinity;
    if (!Number.isFinite(start) && start !== -Infinity) continue;
    if (!Number.isFinite(end) && end !== Infinity) continue;
    if (at.getTime() < start || at.getTime() >= end) continue;
    const direct = FAMILY_TO_MODULES[grant.module_code] ?? (VALID_CODES.has(grant.module_code) ? expandEntitlements([grant.module_code]) : []);
    for (const code of direct) if (VALID_CODES.has(code)) modules.add(code);
  }
  return [...modules];
}

export function hasModularAccess(grants: readonly ModularGrant[], moduleCode: string, at?: Date): boolean {
  if (!VALID_CODES.has(moduleCode)) return false;
  return resolveActiveModules(grants, at).includes(moduleCode);
}
