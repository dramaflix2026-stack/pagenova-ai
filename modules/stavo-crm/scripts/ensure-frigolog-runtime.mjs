/**
 * Railway may restore a cached dist/server bundle produced before the canonical
 * FRIGOLOG sources were synchronized. Do not start a worker with the committed
 * placeholder fingerprint. Repair that bundle once, before accepting jobs.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const entry = resolve('dist/server/index.js');
function bundleIsReady() {
  if (!existsSync(entry)) return false;
  const code = readFileSync(entry, 'utf8');
  // The literal may also occur inside the guard expression. Instead of only
  // searching for it, confirm the canonical CSS payload was bundled.
  return code.includes('frigolog-kpi-grid') &&
    code.includes('FRIGOLOG canonical source') &&
    code.includes('pn-photo-missing') &&
    // The previous bundled component had no operation steps, even though
    // the adapter had already started populating them. Build must include the
    // actual step-card JSX before serving any site or generation job.
    code.includes('data-pn-operation-steps') &&
    // A successful previous deploy is insufficient when Railway resumes a
    // server compiled before the infinite mobile carousel was introduced.
    code.includes('data-pn-kpi-rail') &&
    code.includes('PAGENOVA_KPI_CONTINUOUS_MARQUEE_V1') &&
    code.includes('pausedUntil');
}
if (!bundleIsReady()) {
  console.warn('[FRIGOLOG] Runtime bundle missing canonical operation cards or continuous KPI carousel. Rebuilding before starting worker.');
  for (const args of [
    ['scripts/sync-frigolog-master.mjs'],
    ['scripts/build-server.mjs'],
  ]) {
    const result = spawnSync(process.execPath, args, {
      cwd: process.cwd(), env: process.env, stdio: 'inherit',
    });
    if (result.status !== 0) {
      throw new Error('[FRIGOLOG] Refusing to start with an unsynchronized template: ' + args[0]);
    }
  }
  if (!bundleIsReady()) {
    throw new Error('[FRIGOLOG] Build completed but the canonical CSS was not bundled. Aborting.');
  }
}
console.log('[FRIGOLOG] Canonical template available in server bundle.');
