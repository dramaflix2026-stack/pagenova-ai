import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = process.cwd();
const editor = readFileSync(join(root, "public/pagenova-live-editor.js"), "utf8");
const builder = readFileSync(join(root, "src/app/app/builder/page.tsx"), "utf8");
const types = readFileSync(join(root, "src/lib/site-builder-live-editor.ts"), "utf8");

test("iframe exposes selector inventory for actual CRM elements", () => {
  assert.match(editor, /pagenova-editor-inventory-request/);
  assert.match(editor, /pagenova-editor-inventory-result/);
  assert.match(builder, /readRenderedElementInventory\(\)/);
});

test("AI edit batch validates before applying and returns an acknowledgement", () => {
  const start = editor.indexOf("function executeTextOperations(operations)");
  const end = editor.indexOf("// Conservative zero-API edits", start);
  const implementation = editor.slice(start, end);
  assert.ok(start > 0 && end > start);
  assert.match(implementation, /pending\.forEach\(applyEdit\)/);
  assert.match(implementation, /invalid-operation/);
  assert.match(implementation, /target-not-editable/);
  assert.match(editor, /pagenova-ai-text-result/);
});

test("styles are persisted in overlays", () => {
  for (const key of ["backgroundColor", "borderRadius"]) {
    assert.ok(editor.includes(key));
    assert.ok(types.includes(key));
  }
});

test("AI changes are committed before success and can be undone", () => {
  const start = builder.indexOf("async function executeCrmTextPlan");
  const end = builder.indexOf("async function tryDeterministicStyleCommand", start);
  const implementation = builder.slice(start, end);
  assert.match(implementation, /await savePageNovaProject\(updated\.id, updated\)/);
  assert.match(implementation, /revisionHistory/);
  assert.match(builder, /undoLastAiRevision/);
});

test("publishing reloads latest persisted project after queued saves", () => {
  const start = builder.indexOf("async function publishSite");
  const implementation = builder.slice(start, builder.indexOf("return <>", start));
  assert.match(implementation, /await waitForPageNovaProjectSaves\(project\.id\)/);
  assert.match(implementation, /readPageNovaProject<SiteProject>\(project\.id\)/);
  assert.match(implementation, /liveEdits: publicationProject\.liveEdits/);
});

test("CRM structural edits are bounded to extra sections and undo snapshots", () => {
  assert.match(builder, /change\.action === "add"/);
  assert.match(builder, /change\.action === "remove"/);
  assert.match(builder, /change\.action === "update"/);
  assert.match(builder, /change\.action === "move"/);
  assert.match(builder, /change\.index - originalSections/);
  assert.match(builder, /sections: existingExtras/);
  assert.match(builder, /last\.sections \?/);
});

test("AI revision plan exposes exact DOM selector operations", () => {
  const route = readFileSync(join(root, "src/app/api/builder/generate/route.ts"), "utf8");
  assert.match(route, /domOperations: normalizedDomOperations/);
  assert.match(route, /validDomActions/);
  assert.match(builder, /inventorySelectors\.has\(op\.selector\)/);
  assert.match(builder, /const bySelector = new Map<string, LiveEdit>/);
});
