/**
 * Builder 2.0 — read-only shadow registry (Phase B).
 *
 * This is intentionally NOT wired into rendering or generation yet. The legacy
 * family resolver remains authoritative while adapter contracts are audited.
 *
 * Source of truth for niche labels: briefing-template-families.ts. No duplicate
 * list, template mutation, CSS overrides, new demo data or image fallback.
 */
import {
  BRIEFING_TEMPLATE_FAMILIES,
  resolveBriefingFamily,
  type BriefingFamilyId,
} from "./briefing-template-families.ts";

export const BUILDER_V2_TEMPLATE_REGISTRY_VERSION = 1;
export const BUILDER_V2_STATIC_MODEL_IDS = ["01", "02", "03"] as const;
export type BuilderV2StaticModelId = (typeof BUILDER_V2_STATIC_MODEL_IDS)[number];

/** An observation is NOT a guarantee that the universal editor can apply an edit. */
export type BuilderV2CapabilityEvidence =
  | "not-audited"
  | "partial"
  | "source-observed";

export type BuilderV2EditCapability =
  | "copy"
  | "image"
  | "section-structure"
  | "reviews"
  | "location-contact"
  | "visual-style";

export type BuilderV2RenderStrategy =
  | "mixed-classic-specialized"
  | "specialized"
  | "pending-audit";

export type BuilderV2RegistryNiche = Readonly<{
  id: string;
  label: string;
  familyId: BriefingFamilyId;
}>;

export type BuilderV2RegistryModel = Readonly<{
  id: BuilderV2StaticModelId;
  label: string;
  /** Inventory key; NOT a replacement renderer/component or routing decision. */
  key: string;
  familyId: BriefingFamilyId;
  renderStrategy: BuilderV2RenderStrategy;
  /** Source-observed section IDs; not a guarantee of universal editing support. */
  observedSections: readonly string[];
  capabilities: Readonly<Record<BuilderV2EditCapability, BuilderV2CapabilityEvidence>>;
}>;

export type BuilderV2RegistryFamily = Readonly<{
  id: BriefingFamilyId;
  name: string;
  niches: readonly BuilderV2RegistryNiche[];
  models: Readonly<Record<BuilderV2StaticModelId, BuilderV2RegistryModel>>;
}>;

export type BuilderV2ResolvedRegistryRoute = Readonly<{
  registryVersion: number;
  familyId: BriefingFamilyId;
  familyName: string;
  requestedNiche: string;
  /**
   * Exact normalized catalog match only. Null for a legacy alias or inference;
   * never invent a canonical niche ID from a business name or long briefing.
   */
  nicheId: string | null;
  canonicalNiche: string | null;
  modelId: BuilderV2StaticModelId;
  modelKey: string;
  matchedBy: "catalog" | "legacy-resolver";
}>;

const normalize = (input: string) =>
  input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const noAuditCapabilities: Readonly<Record<BuilderV2EditCapability, BuilderV2CapabilityEvidence>> =
  Object.freeze({
    copy: "not-audited",
    image: "not-audited",
    "section-structure": "not-audited",
    reviews: "not-audited",
    "location-contact": "not-audited",
    "visual-style": "not-audited",
  });

/**
 * Only TP1 has been inspected in Phase B. The shared testimonials component
 * appears in all three variants, but that is merely source evidence; runtime
 * behavior and arbitrary edit commands are not yet proven.
 */
const tp1Capabilities: Readonly<Record<BuilderV2EditCapability, BuilderV2CapabilityEvidence>> =
  Object.freeze({
    copy: "partial",
    image: "partial",
    "section-structure": "partial",
    reviews: "source-observed",
    "location-contact": "partial",
    "visual-style": "partial",
  });

const tp1ObservedSections: Readonly<Record<BuilderV2StaticModelId, readonly string[]>> =
  Object.freeze({
    // Modelo 01 may render the classic fallback; these IDs describe only its
    // specialized component, not the total behavior for every TP1 niche.
    "01": Object.freeze([
      "inicio", "sobre", "servicos", "diferenciais", "experiencia",
      "galeria", "depoimentos", "faq", "contato", "rodape",
    ]),
    "02": Object.freeze([
      "inicio", "sobre", "servicos", "diferenciais", "como-funciona",
      "galeria", "depoimentos", "faq", "contato", "trajetoria", "rodape",
    ]),
    // Modelo 03's section IDs are source-observed, even when an individual
    // component does not yet expose data-universal-section attributes.
    "03": Object.freeze([
      "inicio", "conceito", "servicos", "diferenciais", "experiencia",
      "galeria", "depoimentos", "faq", "contato", "trajetoria", "rodape",
    ]),
  });

function createModel(familyId: BriefingFamilyId, id: BuilderV2StaticModelId): BuilderV2RegistryModel {
  const tp1 = familyId === 1;
  return Object.freeze({
    id,
    label: "Modelo " + Number(id),
    key: "tp" + familyId + ":static:" + id,
    familyId,
    renderStrategy: tp1
      ? (id === "01" ? "mixed-classic-specialized" : "specialized")
      : "pending-audit",
    observedSections: tp1 ? tp1ObservedSections[id] : Object.freeze([] as string[]),
    capabilities: tp1 ? tp1Capabilities : noAuditCapabilities,
  });
}

/** Immutable inventory derived from the EXISTING catalog; never edits its data. */
export const BUILDER_V2_TEMPLATE_REGISTRY: readonly BuilderV2RegistryFamily[] =
  Object.freeze(BRIEFING_TEMPLATE_FAMILIES.map((family) => {
    const id: BriefingFamilyId = family.id;
    const niches = Object.freeze(family.niches.map((label) =>
      Object.freeze({
        id: "tp" + id + ":" + normalize(label),
        label,
        familyId: id,
      }),
    ));
    return Object.freeze({
      id,
      name: family.name,
      niches,
      models: Object.freeze({
        "01": createModel(id, "01"),
        "02": createModel(id, "02"),
        "03": createModel(id, "03"),
      }),
    });
  }));

const familyById = new Map<BriefingFamilyId, BuilderV2RegistryFamily>(
  BUILDER_V2_TEMPLATE_REGISTRY.map((family) => [family.id, family]),
);

export function getBuilderV2RegistryFamily(id: number): BuilderV2RegistryFamily | null {
  return familyById.get(id as BriefingFamilyId) ?? null;
}

export function getBuilderV2RegistryModel(
  familyId: number,
  modelId: string,
): BuilderV2RegistryModel | null {
  const family = getBuilderV2RegistryFamily(familyId);
  if (!family || !BUILDER_V2_STATIC_MODEL_IDS.some((id) => id === modelId)) return null;
  return family.models[modelId as BuilderV2StaticModelId];
}

/**
 * Shadow lookup MUST agree with the legacy resolver before any active switch.
 * No implicit fallback to TP1, model 01 or a different business niche.
 */
export function resolveBuilderV2RegistryRoute(
  niche: string,
  modelId: string,
): BuilderV2ResolvedRegistryRoute | null {
  if (typeof niche !== "string" || !niche.trim()) return null;
  const familyId = resolveBriefingFamily(niche);
  if (!familyId) return null;
  const family = getBuilderV2RegistryFamily(familyId);
  const model = getBuilderV2RegistryModel(familyId, modelId);
  if (!family || !model) return null;
  const requestedNiche = niche.trim();
  const exact = family.niches.find((entry) => normalize(entry.label) === normalize(requestedNiche));
  return Object.freeze({
    registryVersion: BUILDER_V2_TEMPLATE_REGISTRY_VERSION,
    familyId,
    familyName: family.name,
    requestedNiche,
    nicheId: exact?.id ?? null,
    canonicalNiche: exact?.label ?? null,
    modelId: model.id,
    modelKey: model.key,
    matchedBy: exact ? "catalog" : "legacy-resolver",
  });
}
