/**
 * Single source of truth for the FRIGOLOG layout.
 *
 * Both the PageNova Next preview and the Stavo CRM renderer use the SAME React
 * source and the SAME CSS extracted from frontend/frigolog-next-integration-v7.zip.
 *
 * This runs before both CRM builds. It deliberately fails instead of silently
 * falling back to a separately designed "similar" template.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const crm = resolve(dirname(new URL(import.meta.url).pathname), '..');
const root = resolve(crm, '..', '..');
let frontend = resolve(root, 'frontend');
const output = resolve(crm, 'src/site-kit/renderer');

function run(exe, args, cwd = crm) {
  const r = spawnSync(exe, args, { cwd, env: process.env, encoding: 'utf8',
    shell: process.platform === 'win32', maxBuffer: 15 * 1024 * 1024 });
  if (r.status !== 0) throw new Error('[FRIGOLOG] ' + exe + ' ' + args.join(' ') +
    ' exited ' + r.status + '\n' + String(r.stderr || r.stdout || '').slice(-3000));
}

// Railway can build with a root directory limited to modules/stavo-crm.
// In that case the frontend/ directory is NOT part of its build context.
// Bootstrap the same approved files from the PUBLIC GitHub repo, pinned to
// the exact deployment commit, rather than falling back to imitation CSS.
if (!existsSync(resolve(frontend, 'frigolog-next-integration-v7.zip'))) {
  const remoteCommit = [
    process.env.RAILWAY_GIT_COMMIT_SHA,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.GITHUB_SHA,
  ].find((value) => /^[a-f0-9]{40}$/i.test(value ?? '')) ?? 'main';
  frontend = resolve(crm, 'node_modules/.cache/pn-frigolog-mirror/frontend');
  const files = [
    'frigolog-next-integration-v7.zip',
    'scripts/install-frigolog.mjs',
    'src/components/templates/UniversalFrigologTemplate.tsx',
    'src/components/templates/universal-frigolog.css',
    'src/lib/frigolog-template-data.ts',
  ];
  console.log('[FRIGOLOG] Full frontend not in deployment context; downloading canonical source at', remoteCommit);
  for (const path of files) {
    const target = resolve(frontend, path);
    if (existsSync(target)) continue;
    const url = 'https://raw.githubusercontent.com/dramaflix2026-stack/pagenova-ai/' +
      remoteCommit + '/frontend/' + path;
    let downloaded = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length === 0) throw new Error('empty response');
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, bytes);
        downloaded = true;
        break;
      } catch (err) {
        if (attempt === 2) throw new Error('[FRIGOLOG] Canonical source unavailable: ' +
          path + ' (' + String(err).slice(0, 180) + '). Aborting instead of imitating template.');
        await new Promise((resolveWait) => setTimeout(resolveWait, 800 * (attempt + 1)));
      }
    }
    if (!downloaded) throw new Error('[FRIGOLOG] Failed to download ' + path);
  }
}
const cssFile = resolve(frontend, 'src/app/templates/frigolog/frigolog.css');
const previewCss = resolve(frontend, 'src/components/templates/universal-frigolog.css');
const previewComponent = resolve(frontend, 'src/components/templates/UniversalFrigologTemplate.tsx');
const previewData = resolve(frontend, 'src/lib/frigolog-template-data.ts');
const zip = resolve(frontend, 'frigolog-next-integration-v7.zip');
if (!existsSync(zip)) throw new Error('[FRIGOLOG] Approved ZIP unavailable, refusing approximation');
if (!existsSync(cssFile)) {
  // Applies all production refinements (V8-V15) to the exact approved V7 CSS.
  run(process.execPath, ['scripts/install-frigolog.mjs'], frontend);
}
for (const path of [cssFile, previewCss, previewComponent, previewData]) {
  if (!existsSync(path)) throw new Error('[FRIGOLOG] Canonical source missing: ' + path);
}
mkdirSync(output, { recursive: true });

const sourceComponent = readFileSync(previewComponent, 'utf8');
const copiedComponent = sourceComponent
  .replace(/from ["']@\/lib\/frigolog-template-data["']/g, "from './frigolog-template-data.generated'")
  .replace(/^["']use client["'];?\s*/m, '');
if (copiedComponent.includes('@/lib/frigolog-template-data')) {
  throw new Error('[FRIGOLOG] The component still references an unavailable frontend alias');
}
writeFileSync(resolve(output, 'frigolog-react.generated.tsx'), copiedComponent);
writeFileSync(resolve(output, 'frigolog-template-data.generated.ts'), readFileSync(previewData, 'utf8'));

// Tailwind utility rules used by the canonical component (not a reinterpretation).
// The final original CSS overrides utilities just like on the Next preview.
const inputPath = resolve(crm, 'node_modules/.cache/pn-frigolog-input.css');
const tailwindPath = resolve(crm, 'node_modules/.cache/pn-frigolog-utilities.css');
const configPath = resolve(crm, 'node_modules/.cache/pn-frigolog.config.cjs');
mkdirSync(dirname(inputPath), { recursive: true });
writeFileSync(inputPath, '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
writeFileSync(configPath, [
  'module.exports={',
  'content:[' + JSON.stringify(previewComponent) + '],',
  'theme:{extend:{colors:{',
  'primary:"var(--primary)",background:"var(--background)",foreground:"var(--foreground)",',
  'muted:"var(--muted)",card:"var(--card)",border:"var(--border)",',
  '"primary-foreground":"var(--primary-foreground)"',
  '}}},plugins:[]};'
].join('\n'));
const cli = resolve(crm, 'node_modules/tailwindcss/lib/cli.js');
if (!existsSync(cli)) throw new Error('[FRIGOLOG] CRM Tailwind CLI not installed');
run(process.execPath, [cli, '-i', inputPath, '-o', tailwindPath, '-c', configPath, '--minify']);
const css = [
  readFileSync(tailwindPath, 'utf8'),
  readFileSync(cssFile, 'utf8'),
  readFileSync(previewCss, 'utf8'),
  // SSR intentionally does not insert broken photos or invent photos of a business.
  '.frigolog-template .hero:not(:has(.hero-image)){background:linear-gradient(118deg,#eaf2f6,#d9e5f0)}',
  '.frigolog-template .hero:has(.hero-image) .hero-image{object-fit:cover}',
  '.frigolog-template #sobre:not(:has(.about-image))>.site-container{display:block;max-width:860px}',
  '.frigolog-template #sobre:not(:has(.about-image))>.site-container>div{margin-inline:auto}',
  '.frigolog-template #operacao:not(:has(img)) .site-container>img{display:none}',
  '.frigolog-template [hidden]{display:none!important}',
  // The same button is an anchor in published static HTML and an interactive
  // anchor in the Next preview; preserve its original FRIGOLOG dimensions.
  '.frigolog-template a.frigolog-button{text-decoration:none}',
].join('\n');
const fingerprint = createHash('sha256')
  .update(sourceComponent).update(readFileSync(cssFile)).update(readFileSync(previewCss))
  .digest('hex').slice(0, 16);
writeFileSync(resolve(output, 'frigolog-style.generated.ts'),
  '// GENERATED: DO NOT EDIT. Same CSS as Next FRIGOLOG preview.\n' +
  'export const FRIGOLOG_APPROVED_CSS = ' + JSON.stringify(css) + ';\n' +
  'export const FRIGOLOG_SOURCE_FINGERPRINT = ' + JSON.stringify(fingerprint) + ';\n');
console.log('[FRIGOLOG] One canonical React+CSS source synced, SHA256:', fingerprint);
