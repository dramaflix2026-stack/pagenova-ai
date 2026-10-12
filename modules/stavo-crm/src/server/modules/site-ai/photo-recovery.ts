/**
 * Preview-safe repair for Google Places photos after Railway recreates its
 * ephemeral filesystem. Asset metadata remains in MySQL, but the image bytes
 * can disappear on redeploy. Never repair uploads with a random Google photo:
 * only assets explicitly sourced from GOOGLE_PLACES are recoverable here.
 *
 * Uses a single-flight per project and a bounded retry window so opening a
 * page with several missing photos does not trigger several paid Places calls.
 */
import type { SiteProject } from '@server/db/schema';
import { ensureGooglePlaceAssets } from '@builder/generation/google-place-asset-provider';

const inFlight = new Map<string, Promise<void>>();
const nextAttempt = new Map<string, number>();
const RETRY_WINDOW_MS = 2 * 60 * 1000;

export async function recoverMissingGooglePlacePhotos(project: SiteProject): Promise<void> {
  if (!project.leadId) return;
  const id = project.id;
  const running = inFlight.get(id);
  if (running) return running;
  const now = Date.now();
  if ((nextAttempt.get(id) ?? 0) > now) return;

  // Keep the cache bounded in case one worker serves many projects.
  if (nextAttempt.size > 250) {
    for (const [key, until] of nextAttempt) {
      if (until <= now) nextAttempt.delete(key);
    }
    if (nextAttempt.size > 250) nextAttempt.clear();
  }
  nextAttempt.set(id, now + RETRY_WINDOW_MS);

  const operation = ensureGooglePlaceAssets(project)
    .then(() => undefined)
    .catch(() => undefined) // Missing photo must not break unrelated site content.
    .finally(() => { inFlight.delete(id); });
  inFlight.set(id, operation);
  return operation;
}
