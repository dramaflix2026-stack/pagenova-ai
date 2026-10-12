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
