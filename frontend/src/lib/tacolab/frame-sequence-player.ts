/**
 * TacoLab frame-sequence scroll player.
 * Supply actual sequential frames from ONE 3D render/turntable capture.
 * Four unrelated photos are NOT a valid input sequence.
 * The player deliberately never crossfades or rotates unrelated photographs.
 */
export type TacoSequenceOptions = {
  frameUrls: string[];
  journey: HTMLElement;
  canvas: HTMLCanvasElement;
  onProgress?: (progress: number, frameIndex: number) => void;
  maxCachedFrames?: number;
};
export function createTacoSequencePlayer({
  frameUrls, journey, canvas, onProgress, maxCachedFrames = 36
}: TacoSequenceOptions) {
  if (frameUrls.length < 16) throw new Error("TacoLab needs at least 16 consistent frames from the same taco");
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas 2D unavailable");
  const cache = new Map<number, HTMLImageElement>();
  const loading = new Set<number>();
  let disposed = false, raf = 0, lastIndex = -1;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const progress = () => clamp(-journey.getBoundingClientRect().top /
    Math.max(1, journey.offsetHeight - window.innerHeight));
  const load = (index: number) => {
    if (index < 0 || index >= frameUrls.length || cache.has(index) || loading.has(index) || disposed) return;
    loading.add(index);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      loading.delete(index);
      if (disposed) return;
      cache.set(index, img);
      if (cache.size > maxCachedFrames) {
        for (const key of cache.keys()) {
          if (Math.abs(key - lastIndex) > 5) { cache.delete(key); break; }
        }
      }
      schedule();
    };
    img.onerror = () => loading.delete(index);
    img.src = frameUrls[index];
  };
  const paint = (img: HTMLImageElement) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.clearRect(0, 0, w, h);
    const ratio = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * ratio, dh = img.naturalHeight * ratio;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  };
  const render = () => {
    raf = 0;
    if (disposed) return;
    const p = progress();
    const index = Math.round(p * (frameUrls.length - 1));
    lastIndex = index;
    for (let delta = 0; delta <= 5; delta++) {
      load(index + delta);
      if (delta) load(index - delta);
    }
    const current = cache.get(index);
    if (current) paint(current);
    // Do not replace a missing frame with a different camera angle:
    // hold the last valid rendered canvas until the exact frame loads.
    onProgress?.(p, index);
  };
  const schedule = () => { if (!raf && !disposed) raf = requestAnimationFrame(render); };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("pageshow", schedule);
  render();
  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      cache.clear();
    }
  };
}
