import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Load TypeScript source with the compiler already installed for the Next.js app.
const source = readFileSync(new URL("../src/lib/pagenova-commercial-access.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.equal(compiled.diagnostics?.length ?? 0, 0);
const module = { exports: {} };
new Function("module", "exports", compiled.outputText)(module, module.exports);
const { resolveCommercialModules, isUniqueProviderEvent } = module.exports;

const now = new Date("2026-10-21T12:00:00Z");
const sub = {
  id: "s1", owner_id: "user-1", customer_email: "buyer@example.com",
  state: "active", starts_at: "2026-10-01T00:00:00Z",
  current_period_ends_at: "2026-11-01T00:00:00Z", canceled_at: null,
};
const grant = {
  subscription_id: "s1", owner_id: "user-1", customer_email: "buyer@example.com",
  module_code: "crm", state: "active", valid_from: null, valid_until: null,
};
const resolve = (subscriptions = [sub], grants = [grant], ownerId = "user-1", email = "BUYER@example.com") =>
  resolveCommercialModules({ subscriptions, grants, ownerId, email, now });

test("active matching paid subscription grants only purchased module", () => {
  assert.deepEqual(resolve(), ["crm"]);
  assert.deepEqual(resolve([sub], [{ ...grant, module_code: "studio" }]), ["studio"]);
});

test("wrong user and email cannot inherit a different customer's purchase", () => {
  assert.deepEqual(resolve([sub], [grant], "user-2"), []);
  assert.deepEqual(resolve([sub], [grant], "other@example.com"), []);
  assert.deepEqual(resolve([sub], [{ ...grant, owner_id: "user-2" }]), []);
});

test("revoked, refunded, late, canceled and expired access fails closed", () => {
  for (const state of ["pending", "past_due", "canceled", "refunded", "chargeback", "expired"]) {
    assert.deepEqual(resolve([{ ...sub, state }]), [], state);
  }
  assert.deepEqual(resolve([{ ...sub, current_period_ends_at: "2026-10-20T00:00:00Z" }]), []);
  assert.deepEqual(resolve([sub], [{ ...grant, state: "revoked" }]), []);
  assert.deepEqual(resolve([sub], [{ ...grant, valid_until: "2026-10-20T00:00:00Z" }]), []);
});

test("multiple purchased modules combine only when backed by active subscriptions", () => {
  assert.deepEqual(resolve([sub], [grant, { ...grant, module_code: "apps" }]), ["crm", "apps"]);
  assert.deepEqual(resolve([sub], [grant, { ...grant, module_code: "apps", subscription_id: "missing" }]), ["crm"]);
});

test("duplicate provider event key is recognized", () => {
  const seen = new Set(["kiwify:order-123"]);
  assert.equal(isUniqueProviderEvent("kiwify", "order-123", seen), false);
  assert.equal(isUniqueProviderEvent("kiwify", "order-124", seen), true);
  assert.equal(isUniqueProviderEvent("", "order-124", seen), false);
});


const mappingSource = readFileSync(new URL("../src/lib/pagenova-commercial-kiwify.ts", import.meta.url), "utf8");
const mappingCompiled = ts.transpileModule(mappingSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.equal(mappingCompiled.diagnostics?.length ?? 0, 0);
const mappingModule = { exports: {} };
new Function("module", "exports", mappingCompiled.outputText)(mappingModule, mappingModule.exports);
const { resolveKiwifyCheckout, resolveKiwifyCommercialEvent } = mappingModule.exports;

const checkout = {
  id: "mapping-1", plan_code: "crm_studio", provider: "kiwify",
  provider_product_id: "product-123", provider_offer_id: "offer-456",
  billing_period: "monthly", state: "active",
};

test("Kiwify mapping requires exact trusted product and offer IDs", () => {
  const input = { productId: "product-123", offerId: "offer-456" };
  assert.equal(resolveKiwifyCheckout(input, [checkout]).status, "matched");
  assert.equal(resolveKiwifyCheckout({ ...input, offerId: "wrong" }, [checkout]).status, "unmapped");
  assert.equal(resolveKiwifyCheckout({ ...input, productId: "wrong" }, [checkout]).status, "unmapped");
  assert.equal(resolveKiwifyCheckout({ productId: null, offerId: null }, [checkout]).status, "invalid");
  assert.equal(resolveKiwifyCheckout(input, [{ ...checkout, state: "draft" }]).status, "unmapped");
  assert.equal(resolveKiwifyCheckout(input, [checkout, { ...checkout, id: "mapping-2", plan_code: "apps" }]).status, "ambiguous");
});

test("commercial Kiwify lifecycle requires paid status and defers cancellations", () => {
  assert.equal(resolveKiwifyCommercialEvent("order_approved", "paid"), "activate");
  assert.equal(resolveKiwifyCommercialEvent("order_approved", "pending"), "ignore");
  assert.equal(resolveKiwifyCommercialEvent("subscription_renewed", "paid"), "activate");
  assert.equal(resolveKiwifyCommercialEvent("order_refunded", null), "revoke");
  assert.equal(resolveKiwifyCommercialEvent("chargeback", null), "revoke");
  assert.equal(resolveKiwifyCommercialEvent("subscription_canceled", null), "defer");
  assert.equal(resolveKiwifyCommercialEvent("subscription_late", null), "defer");
});
