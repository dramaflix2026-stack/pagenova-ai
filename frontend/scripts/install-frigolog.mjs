import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, sep } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const root = resolve(process.cwd(), '..');
const zip = readFileSync(resolve(process.cwd(), 'frigolog-next-integration-v7.zip'));
const allowed = ['frontend/src/app/templates/frigolog/', 'frontend/public/lovable/frigolog/'];
let end = -1;
for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65557); i--) {
  if (zip.readUInt32LE(i) === 0x06054b50) { end = i; break; }
}
if (end < 0) throw new Error('FRIGOLOG ZIP: missing central directory');
const count = zip.readUInt16LE(end + 10);
let cursor = zip.readUInt32LE(end + 16);
let extracted = 0;
for (let i = 0; i < count; i++) {
  if (zip.readUInt32LE(cursor) !== 0x02014b50) throw new Error('FRIGOLOG ZIP: corrupt directory');
  const method = zip.readUInt16LE(cursor + 10);
  const compressed = zip.readUInt32LE(cursor + 20);
  const uncompressed = zip.readUInt32LE(cursor + 24);
  const nameLength = zip.readUInt16LE(cursor + 28);
  const extraLength = zip.readUInt16LE(cursor + 30);
  const commentLength = zip.readUInt16LE(cursor + 32);
  const localOffset = zip.readUInt32LE(cursor + 42);
  const name = zip.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
  cursor += 46 + nameLength + extraLength + commentLength;
  if (!allowed.some(prefix => name.startsWith(prefix)) || name.endsWith('/')) continue;
  const target = resolve(root, name);
  if (relative(root, target).startsWith('..' + sep) || relative(root, target) === '..') throw new Error('Unsafe ZIP path');
  if (zip.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('FRIGOLOG ZIP: bad local header');
  const start = localOffset + 30 + zip.readUInt16LE(localOffset + 26) + zip.readUInt16LE(localOffset + 28);
  const compressedBytes = zip.subarray(start, start + compressed);
  const data = method === 0 ? compressedBytes : method === 8 ? inflateRawSync(compressedBytes) : null;
  if (!data || data.length !== uncompressed) throw new Error('FRIGOLOG ZIP: invalid entry ' + name);
  if (existsSync(target)) {
    if (!readFileSync(target).equals(data)) throw new Error('FRIGOLOG existing file differs: ' + name);
    continue;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, data);
  extracted++;
}
for (const file of ['page.tsx', 'FrigologTemplate.tsx', 'FrigologUI.tsx', 'frigolog.css']) {
  if (!existsSync(resolve(root, 'frontend/src/app/templates/frigolog', file))) throw new Error('Missing FRIGOLOG file: ' + file);
}
for (const image of ['team.jpg', 'fleet.jpg', 'cold-storage.jpg']) {
  if (!existsSync(resolve(root, 'frontend/public/lovable/frigolog', image))) throw new Error('Missing FRIGOLOG image: ' + image);
}
console.log('FRIGOLOG V7 assets ready (' + extracted + ' extracted)');

// Mobile refinements are applied after extraction because template source is packaged in ZIP.
const mobileCss = "\n/* FRIGOLOG_MOBILE_V8: scoped layout fixes for dynamically extracted template */\n@media (max-width: 767px) {\n .frigolog-template .site-header {height:72px;position:sticky;top:0;z-index:100;background:var(--background);}\n .frigolog-template .site-header > .site-container {display:flex!important;align-items:center;justify-content:space-between;gap:10px;height:100%;}\n .frigolog-template .site-header .brand-name {font-size:20px;line-height:1.05;}\n .frigolog-template .site-header .brand-sub {font-size:7px;letter-spacing:1.2px;line-height:1.35;max-width:160px;}\n .frigolog-template .site-header a[aria-label=\"Frigolog — início\"] {display:flex;align-items:center;gap:8px;min-width:0;flex:1;}\n .frigolog-template .site-header a[aria-label=\"Frigolog — início\"] svg {width:30px;height:30px;flex-shrink:0;}\n .frigolog-template .site-header .frigolog-button--icon {display:inline-flex!important;position:static!important;flex:0 0 42px;align-items:center;justify-content:center;width:42px;height:42px;padding:8px;border-radius:8px;}\n .frigolog-template .site-header .frigolog-button--icon svg {width:22px;height:22px;}\n .frigolog-template .site-header > .site-container > .frigolog-button:not(.frigolog-button--icon) {display:none!important;}\n .frigolog-template .site-header nav[aria-label=\"Menu móvel\"] {position:absolute;top:100%;left:0;right:0;width:100%;z-index:101;background:var(--background);box-shadow:0 12px 24px #152a4030;padding:12px 20px 20px;}\n .frigolog-template .site-header nav[aria-label=\"Menu móvel\"] a {display:block;padding:12px 4px;}\n .frigolog-template .site-header nav[aria-label=\"Menu móvel\"] .frigolog-button {width:100%;margin-top:8px;}\n .frigolog-template .hero {min-height:530px;}\n .frigolog-template .hero-content {padding-top:44px;padding-bottom:46px;}\n .frigolog-template .hero h1 {font-size:clamp(30px,8vw,38px);line-height:1.12;max-width:100%;}\n .frigolog-template .hero .eyebrow {margin-bottom:16px;}\n .frigolog-template .hero-content > p:not(.eyebrow) {line-height:1.6;}\n .frigolog-template #servicos,.frigolog-template #sobre,.frigolog-template #operacao {padding-top:54px;padding-bottom:54px;}\n .frigolog-template .section-heading {font-size:clamp(26px,7vw,31px);line-height:1.18;}\n .frigolog-template #servicos .service-card {min-height:0!important;padding:22px!important;}\n .frigolog-template #servicos .service-card h3 {margin-top:14px;}\n .frigolog-template #servicos .service-card p {margin-top:8px;}\n .frigolog-template #servicos .service-card .frigolog-button {margin-top:14px;padding:6px 0;}\n .frigolog-template #sobre .about-image {aspect-ratio:4/3;object-fit:cover;}\n .frigolog-template #operacao img {aspect-ratio:16/10;object-fit:cover;}\n .frigolog-template #contato {padding-top:48px;padding-bottom:48px;}\n .frigolog-template footer {padding-top:32px;padding-bottom:32px;}\n .frigolog-template section[id] {scroll-margin-top:76px;}\n}\n@media (max-width: 380px) {\n .frigolog-template .site-container {width:calc(100% - 32px);}\n .frigolog-template .site-header .brand-name {font-size:18px;}\n .frigolog-template .site-header .brand-sub {font-size:6.5px;}\n}\n";
const cssPath = resolve(root, 'frontend/src/app/templates/frigolog/frigolog.css');
const currentCss = readFileSync(cssPath, 'utf8');
if (!currentCss.includes('FRIGOLOG_MOBILE_V8')) writeFileSync(cssPath, currentCss + '\n' + mobileCss);
