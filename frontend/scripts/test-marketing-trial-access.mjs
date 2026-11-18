import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

// Compile the exact production trial server module to in-memory JS.
// All database calls are faked: zero users are created and no production rows are changed.
const path = resolve(import.meta.dirname, "../src/lib/trial/server.ts");
const source = readFileSync(path, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.equal(compiled.diagnostics?.filter(x => x.category === ts.DiagnosticCategory.Error).length ?? 0, 0);
const { getPageNovaAccess, TrialUnavailable } = await import(
  "data:text/javascript;base64," + Buffer.from(compiled.outputText).toString("base64")
);

const confirmed = {
  id: "00000000-0000-4000-8000-000000000111",
  email: " User@Example.com ",
  email_confirmed_at: "2026-11-17T10:00:00Z",
};
const trial = {
  active: true,
  startedAt: "2026-11-17T10:00:00Z",
  expiresAt: "2026-11-22T10:00:00Z",
  sitesLimit: 2, sitesUsed: 0, sitesRemaining: 2,
  googleLimit: 5, googleUsed: 0, googleRemaining: 5,
  reason: "active",
};

function fakeAdmin({ paid = null, paidError = null, trialData = trial, rpcError = null } = {}) {
  const calls = [];
  const chain = {
    select(...args) { calls.push(["select", ...args]); return this; },
    eq(...args) { calls.push(["eq", ...args]); return this; },
    ilike(...args) { calls.push(["ilike", ...args]); return this; },
    limit(...args) { calls.push(["limit", ...args]); return this; },
    maybeSingle() { calls.push(["maybeSingle"]); return Promise.resolve({ data: paid, error: paidError }); },
  };
  return {
    calls,
    from(table) { calls.push(["from", table]); return chain; },
    rpc(name, params) { calls.push(["rpc", name, params]); return Promise.resolve({ data: trialData, error: rpcError }); },
  };
}

test("paid entitlement takes precedence over a trial and makes no trial RPC", async () => {
  const admin = fakeAdmin({ paid: { id: "existing-entitlement" } });
  const result = await getPageNovaAccess(admin, confirmed, true);
  assert.deepEqual(result, { kind: "paid" });
  assert.equal(admin.calls.some(x => x[0] === "rpc"), false);
});

test("unconfirmed email cannot start a trial", async () => {
  const admin = fakeAdmin();
  const result = await getPageNovaAccess(admin, { ...confirmed, email_confirmed_at: null }, true);
  assert.deepEqual(result, { kind: "none", reason: "email_not_verified" });
  assert.equal(admin.calls.some(x => x[0] === "rpc"), false);
});

test("missing email cannot request trial access", async () => {
  const admin = fakeAdmin();
  assert.deepEqual(await getPageNovaAccess(admin, { ...confirmed, email: "" }, true), {
    kind: "none", reason: "missing_email",
  });
  assert.equal(admin.calls.length, 0);
});

test("first verified app access requests the trial exactly once with normalized email", async () => {
  const admin = fakeAdmin();
  const result = await getPageNovaAccess(admin, confirmed, true);
  assert.equal(result.kind, "trial");
  assert.deepEqual(result.trial, trial);
  const rpcCalls = admin.calls.filter(x => x[0] === "rpc");
  assert.equal(rpcCalls.length, 1);
  assert.equal(rpcCalls[0][1], "pagenova_trial_access");
  assert.deepEqual(rpcCalls[0][2], {
    p_owner_id: confirmed.id, p_email: "user@example.com", p_start: true,
  });
});

test("read-only access check does not start a new trial", async () => {
  const admin = fakeAdmin({ trialData: { active: false, reason: "not_started" } });
  const result = await getPageNovaAccess(admin, confirmed, false);
  assert.deepEqual(result, { kind: "none", trial: { active: false, reason: "not_started" }, reason: "not_started" });
  assert.equal(admin.calls.find(x => x[0] === "rpc")?.[2]?.p_start, false);
});

test("expired trial is refused, not re-created as a new free trial", async () => {
  const admin = fakeAdmin({ trialData: { active: false, reason: "expired", expiresAt: "2026-11-10T00:00:00Z" } });
  const result = await getPageNovaAccess(admin, confirmed, true);
  assert.equal(result.kind, "none");
  assert.equal(result.reason, "expired");
});

test("a trial already claimed by another identity is refused", async () => {
  const admin = fakeAdmin({ trialData: { active: false, reason: "already_claimed" } });
  const result = await getPageNovaAccess(admin, confirmed, true);
  assert.equal(result.kind, "none");
  assert.equal(result.reason, "already_claimed");
});

test("paid entitlement lookup failure fails closed before trial RPC", async () => {
  const admin = fakeAdmin({ paidError: { code: "503" } });
  await assert.rejects(() => getPageNovaAccess(admin, confirmed, true), err => err instanceof TrialUnavailable && err.status === 503);
  assert.equal(admin.calls.some(x => x[0] === "rpc"), false);
});

test("Supabase trial RPC failure returns unavailable, never free access", async () => {
  const admin = fakeAdmin({ rpcError: { code: "PGRST503" } });
  await assert.rejects(() => getPageNovaAccess(admin, confirmed, true), err => err instanceof TrialUnavailable && err.status === 503);
});

test("disabled trials cannot start or query trial access", async () => {
  const old = process.env.PAGENOVA_TRIAL_ENABLED;
  process.env.PAGENOVA_TRIAL_ENABLED = "0";
  try {
    const admin = fakeAdmin();
    assert.deepEqual(await getPageNovaAccess(admin, confirmed, true), { kind: "none", reason: "trials_disabled" });
    assert.equal(admin.calls.some(x => x[0] === "rpc"), false);
  } finally {
    if (old === undefined) delete process.env.PAGENOVA_TRIAL_ENABLED;
    else process.env.PAGENOVA_TRIAL_ENABLED = old;
  }
});
