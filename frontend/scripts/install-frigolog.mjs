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

// FRIGOLOG_STATS_V9: consistent KPI layout across landscape and mobile.
const statsCss = "\n/* FRIGOLOG_STATS_V9: responsive KPI panel */\n.frigolog-template .stats-grid,\n.frigolog-template .stats-container,\n.frigolog-template .stats-list {\n  align-items:stretch;\n}\n@media (min-width: 768px) {\n .frigolog-template .stats-grid,\n .frigolog-template .stats-list {\n   display:grid!important;\n   grid-template-columns:repeat(4,minmax(0,1fr))!important;\n   gap:14px!important;\n   align-items:stretch!important;\n }\n .frigolog-template .stats-grid > *,\n .frigolog-template .stats-list > * {\n   min-width:0;\n   padding:20px 16px!important;\n   border:1px solid #cbd9e4;\n   border-radius:16px;\n   background:rgba(255,255,255,.64);\n }\n .frigolog-template .stats-grid svg,\n .frigolog-template .stats-list svg {flex-shrink:0;width:24px;height:24px;}\n}\n@media (min-width:768px) and (max-width:1100px) {\n .frigolog-template .stats-grid,\n .frigolog-template .stats-list {grid-template-columns:repeat(2,minmax(0,1fr))!important;}\n}\n@media (max-width:767px) {\n .frigolog-template .stats-grid,\n .frigolog-template .stats-list {display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;}\n .frigolog-template .stats-grid > *,\n .frigolog-template .stats-list > * {padding:16px 12px!important;border:1px solid #cbd9e4;border-radius:12px;background:#ffffffb8;min-width:0;}\n .frigolog-template .stats-grid svg,\n .frigolog-template .stats-list svg {width:22px;height:22px;flex-shrink:0;}\n}\n";
const existingStatsCss = readFileSync(cssPath, 'utf8');
if (!existingStatsCss.includes('FRIGOLOG_STATS_V9')) writeFileSync(cssPath, existingStatsCss + '\n' + statsCss);

// FRIGOLOG_KPI_V10: update the actual React markup (not guessed CSS class names).
const templatePath = resolve(root, 'frontend/src/app/templates/frigolog/FrigologTemplate.tsx');
let template = readFileSync(templatePath, 'utf8');
if (!template.includes('FRIGOLOG_KPI_V10')) {
  const originalImport = 'MessageCircle, Thermometer } from "lucide-react";';
  const updatedImport = 'MessageCircle, Thermometer, Clock3, MapPin } from "lucide-react";';
  const originalStats = `const stats = [
  { value: "24/7", label: "Monitoramento de temperatura" },
  { value: "−18 °C a +4 °C", label: "Faixa controlada em toda a operação" },
  { value: "Frota própria", label: "Baús e carretas refrigerados" },
  { value: "SP inteira", label: "Capital, ABC, interior e litoral" },
];`;
  const updatedStats = `// FRIGOLOG_KPI_V10
const stats = [
  { icon: Clock3, value: "24/7", label: "Monitoramento de temperatura" },
  { icon: Thermometer, value: "−18 °C a +4 °C", label: "Faixa controlada em toda a operação" },
  { icon: Truck, value: "Frota própria", label: "Baús e carretas refrigerados" },
  { icon: MapPin, value: "SP inteira", label: "Capital, ABC, interior e litoral" },
];`;
  const originalSection = `<section className="border-b border-border bg-secondary/50 py-7" aria-label="Números da operação">
        <div className="site-container grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{stats.map(item => <div key={item.value} className="flex items-center gap-4 lg:justify-center"><Thermometer className="h-6 w-6 shrink-0 text-primary" strokeWidth={1.4} /><div className="min-w-0"><p className="text-[15px] font-bold leading-tight">{item.value}</p><p className="mt-1 text-xs text-muted-foreground">{item.label}</p></div></div>)}</div>
      </section>`;
  const updatedSection = `<section className="frigolog-kpi-section border-b border-border bg-secondary/50" aria-label="Números da operação">
        <div className="site-container frigolog-kpi-grid">{stats.map(item => <div key={item.value} className="frigolog-kpi-card"><span className="frigolog-kpi-icon"><item.icon strokeWidth={1.8} aria-hidden="true" /></span><div className="frigolog-kpi-copy"><p className="frigolog-kpi-value">{item.value}</p><p className="frigolog-kpi-label">{item.label}</p></div></div>)}</div>
      </section>`;
  for (const [from, to] of [[originalImport, updatedImport], [originalStats, updatedStats], [originalSection, updatedSection]]) {
    if (!template.includes(from)) throw new Error('FRIGOLOG KPI V10: expected source markup not found; aborting');
    template = template.replace(from, to);
  }
  writeFileSync(templatePath, template);
}
const kpiCss = `
/* FRIGOLOG_KPI_V10: actual rendered KPI cards */
.frigolog-template .frigolog-kpi-section {padding:24px 0 28px;}
.frigolog-template .frigolog-kpi-grid {display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;}
.frigolog-template .frigolog-kpi-card {display:flex;align-items:center;gap:13px;min-width:0;min-height:104px;padding:18px 16px;border:1px solid #d2dfe8;border-radius:14px;background:rgba(255,255,255,.78);box-shadow:0 5px 15px rgba(19,53,78,.04);}
.frigolog-template .frigolog-kpi-icon {display:flex;flex:0 0 42px;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;background:#e4eef5;color:#2d597d;}
.frigolog-template .frigolog-kpi-icon svg {width:23px;height:23px;}
.frigolog-template .frigolog-kpi-copy {min-width:0;}
.frigolog-template .frigolog-kpi-value {font-size:17px;font-weight:750;line-height:1.25;color:#192d3e;}
.frigolog-template .frigolog-kpi-label {margin-top:5px;font-size:12px;line-height:1.45;color:#5b6975;}
@media (max-width:1100px) {.frigolog-template .frigolog-kpi-grid {grid-template-columns:repeat(2,minmax(0,1fr));}}
@media (max-width:600px) {
 .frigolog-template .frigolog-kpi-section {padding:15px 0 20px;}
 .frigolog-template .frigolog-kpi-grid {gap:9px;}
 .frigolog-template .frigolog-kpi-card {display:block;min-height:140px;padding:14px 12px;border-radius:12px;}
 .frigolog-template .frigolog-kpi-icon {width:36px;height:36px;margin-bottom:12px;}
 .frigolog-template .frigolog-kpi-icon svg {width:20px;height:20px;}
 .frigolog-template .frigolog-kpi-value {font-size:15px;}
 .frigolog-template .frigolog-kpi-label {font-size:11px;}
}
@media (max-width:340px) {.frigolog-template .frigolog-kpi-grid {grid-template-columns:1fr;}.frigolog-template .frigolog-kpi-card {display:flex;min-height:90px;}}
`;
const kpiCssCurrent = readFileSync(cssPath, 'utf8');
if (!kpiCssCurrent.includes('FRIGOLOG_KPI_V10')) writeFileSync(cssPath, kpiCssCurrent + '\n' + kpiCss);

// FRIGOLOG_KPI_STRIP_V11: requested continuous strip instead of separate cards.
const stripCss = "\n/* FRIGOLOG_KPI_STRIP_V11: one continuous horizontal strip, no individual cards */\n.frigolog-template .frigolog-kpi-section {padding:0!important;background:#e6eef5!important;border-bottom:1px solid #ccd9e4;}\n.frigolog-template .frigolog-kpi-grid {display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:0!important;align-items:stretch;padding-top:24px;padding-bottom:24px;}\n.frigolog-template .frigolog-kpi-card {display:flex!important;flex-direction:row!important;align-items:center!important;gap:11px!important;min-height:74px!important;padding:10px 13px!important;border:0!important;border-right:1px solid #cad8e4!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;}\n.frigolog-template .frigolog-kpi-card:last-child {border-right:0!important;}\n.frigolog-template .frigolog-kpi-icon {display:flex!important;flex:0 0 34px!important;align-items:center;justify-content:center;width:34px!important;height:34px!important;margin:0!important;border-radius:0!important;background:transparent!important;color:#2d597d!important;}\n.frigolog-template .frigolog-kpi-icon svg {width:24px!important;height:24px!important;}\n.frigolog-template .frigolog-kpi-value {font-size:15px!important;font-weight:750;line-height:1.3;}\n.frigolog-template .frigolog-kpi-label {font-size:11px!important;line-height:1.35;margin-top:4px;}\n@media (max-width:700px) {\n .frigolog-template .frigolog-kpi-grid {display:flex!important;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:thin;padding-top:12px;padding-bottom:12px;}\n .frigolog-template .frigolog-kpi-card {flex:0 0 190px!important;scroll-snap-align:start;}\n .frigolog-template .frigolog-kpi-value {font-size:14px!important;}\n}\n";
const stripCurrentCss = readFileSync(cssPath, 'utf8');
if (!stripCurrentCss.includes('FRIGOLOG_KPI_STRIP_V11')) writeFileSync(cssPath, stripCurrentCss + '\n' + stripCss);

// FRIGOLOG_SECTION_ALIGNMENT_V12
const alignmentCss = "\n/* FRIGOLOG_SECTION_ALIGNMENT_V12: unified centered section headings */\n.frigolog-template #servicos > .site-container > div:first-child {display:block!important;text-align:center!important;}\n.frigolog-template #servicos > .site-container > div:first-child > div {width:100%;text-align:center!important;}\n.frigolog-template #servicos > .site-container > div:first-child .eyebrow,\n.frigolog-template #servicos > .site-container > div:first-child .section-heading {text-align:center!important;}\n.frigolog-template #servicos > .site-container > div:first-child > span {display:none!important;}\n.frigolog-template #sobre .eyebrow,\n.frigolog-template #sobre .section-heading {text-align:center!important;}\n.frigolog-template #contato .eyebrow,\n.frigolog-template #contato .section-heading {text-align:center!important;}\n.frigolog-template #contato .section-heading {max-width:850px;margin-inline:auto;}\n@media (max-width:767px) {\n .frigolog-template #servicos .section-heading,\n .frigolog-template #sobre .section-heading,\n .frigolog-template #contato .section-heading {font-size:clamp(28px,7.5vw,36px)!important;line-height:1.15;}\n}\n";
const alignmentCurrent = readFileSync(cssPath, 'utf8');
if (!alignmentCurrent.includes('FRIGOLOG_SECTION_ALIGNMENT_V12')) writeFileSync(cssPath, alignmentCurrent + '\n' + alignmentCss);

// FRIGOLOG_CONTACT_BUTTON_CENTER_V13
const contactButtonCss = `
/* FRIGOLOG_CONTACT_BUTTON_CENTER_V13: center contact CTA without changing its appearance */
.frigolog-template #contato a.frigolog-button,
.frigolog-template #contato button.frigolog-button {display:flex!important;width:max-content!important;max-width:100%!important;margin-left:auto!important;margin-right:auto!important;justify-content:center!important;}
`;
const contactButtonCurrent = readFileSync(cssPath, 'utf8');
if (!contactButtonCurrent.includes('FRIGOLOG_CONTACT_BUTTON_CENTER_V13')) writeFileSync(cssPath, contactButtonCurrent + '\n' + contactButtonCss);

// FRIGOLOG_ABOUT_CONTENT_CENTER_V14
const aboutCss = "\n/* FRIGOLOG_ABOUT_CONTENT_CENTER_V14 */\n@media(max-width:767px){.frigolog-template #sobre>.site-container>div{text-align:center!important}.frigolog-template #sobre>.site-container>div>p:not(.eyebrow){text-align:center!important;max-width:640px;margin-left:auto!important;margin-right:auto!important}.frigolog-template #sobre>.site-container>div>div{width:fit-content;max-width:100%;margin-left:auto!important;margin-right:auto!important;text-align:left!important}.frigolog-template #sobre>.site-container>div>div>p{text-align:left!important}.frigolog-template #sobre>.site-container>div>a{display:flex!important;width:max-content!important;max-width:100%!important;margin-left:auto!important;margin-right:auto!important;justify-content:center!important}}";
const aboutCurrent = readFileSync(cssPath,'utf8');
if(!aboutCurrent.includes('FRIGOLOG_ABOUT_CONTENT_CENTER_V14')) writeFileSync(cssPath,aboutCurrent+'\n'+aboutCss);
