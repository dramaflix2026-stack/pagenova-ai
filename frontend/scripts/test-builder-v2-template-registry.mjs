import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  BRIEFING_TEMPLATE_FAMILIES,
  resolveBriefingFamily,
} from "../src/lib/briefing-template-families.ts";
import {
  BUILDER_V2_STATIC_MODEL_IDS,
  BUILDER_V2_TEMPLATE_REGISTRY,
  BUILDER_V2_TEMPLATE_REGISTRY_VERSION,
  getBuilderV2RegistryFamily,
  getBuilderV2RegistryModel,
  resolveBuilderV2RegistryRoute,
} from "../src/lib/builder-v2-template-registry.ts";

test("shadow registry derives all 139 catalog niches without altering legacy routing", () => {
  assert.equal(BUILDER_V2_TEMPLATE_REGISTRY_VERSION, 1);
  assert.equal(BUILDER_V2_TEMPLATE_REGISTRY.length, 10);
  const sourceLabels = BRIEFING_TEMPLATE_FAMILIES.flatMap((family) => family.niches);
  const registered = BUILDER_V2_TEMPLATE_REGISTRY.flatMap((family) => family.niches);
  assert.equal(sourceLabels.length, 139, "Catalog changes require explicit reconciliation with the 133 target.");
  assert.equal(registered.length, sourceLabels.length);
  assert.deepEqual(registered.map((niche) => niche.label), sourceLabels);
  assert.equal(new Set(registered.map((niche) => niche.id)).size, 139);
  assert.deepEqual(
    BUILDER_V2_TEMPLATE_REGISTRY.map((family) => family.id),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
});

test("139 niches × 3 models resolve exactly as the existing family resolver", () => {
  assert.deepEqual([...BUILDER_V2_STATIC_MODEL_IDS], ["01", "02", "03"]);
  let combinations = 0;
  for (const family of BUILDER_V2_TEMPLATE_REGISTRY) {
    assert.equal(getBuilderV2RegistryFamily(family.id), family);
    assert.deepEqual(Object.keys(family.models), ["01", "02", "03"]);
    for (const niche of family.niches) {
      assert.equal(niche.familyId, family.id);
      assert.equal(resolveBriefingFamily(niche.label), family.id);
      for (const modelId of BUILDER_V2_STATIC_MODEL_IDS) {
        combinations++;
        const route = resolveBuilderV2RegistryRoute(niche.label, modelId);
        assert.ok(route, niche.label + "/" + modelId);
        assert.equal(route.familyId, family.id);
        assert.equal(route.modelId, modelId);
        assert.equal(route.nicheId, niche.id);
        assert.equal(route.canonicalNiche, niche.label);
        assert.equal(route.matchedBy, "catalog");
        assert.equal(route.modelKey, getBuilderV2RegistryModel(family.id, modelId)?.key);
      }
    }
  }
  assert.equal(combinations, 417);
});

test("legacy aliases retain their family without claiming an exact catalog niche", () => {
  for (const [alias, familyId] of [
    ["barbershop", 1],
    ["perfumaria", 6],
    ["imobiliaria", 7],
    ["dermatologia clinica", 4],
  ]) {
    const result = resolveBuilderV2RegistryRoute(alias, "02");
    assert.ok(result);
    assert.equal(result.familyId, familyId);
    // Unaccented canonical spelling is considered an exact normalized match.
    if (alias === "dermatologia clinica" || alias === "imobiliaria") continue;
    assert.equal(result.nicheId, null);
    assert.equal(result.matchedBy, "legacy-resolver");
  }
  assert.equal(resolveBuilderV2RegistryRoute("Clínica de estética", "01")?.familyId, 1);
  assert.equal(resolveBuilderV2RegistryRoute("Dermatologia", "01")?.familyId, 1);
  assert.equal(resolveBuilderV2RegistryRoute("Dermatologia clínica", "01")?.familyId, 4);
});

test("invalid family, variant or unknown niche never silently falls back", () => {
  assert.equal(getBuilderV2RegistryFamily(0), null);
  assert.equal(getBuilderV2RegistryFamily(11), null);
  assert.equal(getBuilderV2RegistryModel(1, "04"), null);
  assert.equal(getBuilderV2RegistryModel(0, "01"), null);
  assert.equal(resolveBuilderV2RegistryRoute("Clínica de estética", "04"), null);
  assert.equal(resolveBuilderV2RegistryRoute("", "01"), null);
  assert.equal(resolveBuilderV2RegistryRoute("Nicho totalmente desconhecido XQZ", "01"), null);
});

test("all registry entries are immutable and use stable deterministic keys", () => {
  assert.ok(Object.isFrozen(BUILDER_V2_TEMPLATE_REGISTRY));
  const family = getBuilderV2RegistryFamily(1);
  assert.ok(family);
  assert.ok(Object.isFrozen(family));
  assert.ok(Object.isFrozen(family.models));
  assert.ok(Object.isFrozen(family.niches));
  assert.ok(family.niches.every((niche) => Object.isFrozen(niche)));
  for (const familyEntry of BUILDER_V2_TEMPLATE_REGISTRY) {
    for (const modelId of BUILDER_V2_STATIC_MODEL_IDS) {
      const model = familyEntry.models[modelId];
      assert.ok(Object.isFrozen(model));
      assert.ok(Object.isFrozen(model.capabilities));
      assert.ok(Object.isFrozen(model.observedSections));
      assert.equal(model.label, "Modelo " + Number(modelId));
      assert.equal(model.key, "tp" + familyEntry.id + ":static:" + modelId);
    }
  }
});

test("TP1 observations distinguish classic fallback, specialized variants and unverified capabilities", () => {
  assert.equal(getBuilderV2RegistryModel(1, "01")?.renderStrategy, "mixed-classic-specialized");
  assert.equal(getBuilderV2RegistryModel(1, "02")?.renderStrategy, "specialized");
  assert.equal(getBuilderV2RegistryModel(1, "03")?.renderStrategy, "specialized");
  assert.equal(getBuilderV2RegistryModel(1, "01")?.capabilities.reviews, "source-observed");
  assert.equal(getBuilderV2RegistryModel(1, "03")?.capabilities["visual-style"], "partial");
  assert.ok(getBuilderV2RegistryModel(1, "03")?.observedSections.includes("conceito"));
  assert.ok(getBuilderV2RegistryModel(1, "02")?.observedSections.includes("como-funciona"));
  assert.equal(getBuilderV2RegistryModel(4, "03")?.capabilities.reviews, "not-audited");
  assert.deepEqual(getBuilderV2RegistryModel(4, "03")?.observedSections, []);
});

test("registry is in shadow mode and cannot change the live editor/renderer yet", () => {
  const page = readFileSync(new URL("../src/app/app/builder-v2/page.tsx", import.meta.url), "utf8");
  const renderer = readFileSync(new URL("../src/components/builder-v2-site.tsx", import.meta.url), "utf8");
  assert.ok(page.includes("resolveBriefingFamily("));
  assert.ok(renderer.includes("resolveBriefingFamily("));
  assert.ok(!page.includes("builder-v2-template-registry"));
  assert.ok(!renderer.includes("builder-v2-template-registry"));
  assert.ok(renderer.includes('data-tp1-aesthetic-model1={model1Aesthetic?"true":undefined}'));
});
