import assert from "node:assert/strict";
import { test } from "node:test";
import { MODULAR_CATALOG,normalizeSelection,expandEntitlements,resolveConfiguredOffer } from "../src/lib/commercial/modular-catalog.ts";

test("catalog has unique module codes",()=>{
 assert.equal(new Set(MODULAR_CATALOG.map(item=>item.code)).size,MODULAR_CATALOG.length);
});
test("single product is selectable",()=>{
 assert.deepEqual(normalizeSelection(["studio.sites","studio.sites"]),["studio.sites"]);
});
test("bundle absorbs separately selected tools",()=>{
 assert.deepEqual(normalizeSelection(["studio.sites","bundle.studio","studio.forms"]),["bundle.studio"]);
 assert.equal(expandEntitlements(["bundle.studio"]).filter(code=>code.startsWith("studio.")).length,6);
});
test("CRM and Studio bundles coexist",()=>{
 const result=expandEntitlements(["bundle.crm","bundle.studio"]);
 assert.equal(result.length,11);
});
test("unknown and unavailable modules fail closed",()=>{
 assert.throws(()=>normalizeSelection(["unknown"]));
 assert.throws(()=>normalizeSelection(["development.apps"]));
});
test("no unapproved checkout can open",()=>{
 assert.equal(resolveConfiguredOffer(["studio.sites"],[]),null);
 assert.equal(resolveConfiguredOffer(["studio.sites"],[{selection:["studio.sites"],currency:"BRL",amountCents:0,checkoutUrl:"https://example.com",active:true}]),null);
 assert.equal(resolveConfiguredOffer(["studio.sites"],[{selection:["studio.sites"],currency:"BRL",amountCents:1000,checkoutUrl:"http://example.com",active:true}]),null);
});
test("only an exact active server-side offer resolves",()=>{
 const offer={selection:["studio.sites","studio.forms"],currency:"BRL",amountCents:1000,checkoutUrl:"https://example.com",active:true};
 assert.equal(resolveConfiguredOffer(["studio.forms","studio.sites"],[offer]),offer);
 assert.equal(resolveConfiguredOffer(["studio.sites"],[offer]),null);
 assert.equal(resolveConfiguredOffer(["studio.forms","studio.sites"],[{...offer,active:false}]),null);
 assert.equal(resolveConfiguredOffer(["studio.forms","studio.sites"],[offer,offer]),null);
});
