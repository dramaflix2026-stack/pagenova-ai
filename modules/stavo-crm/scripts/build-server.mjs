/**
 * Compila o backend em um unico arquivo CommonJS.
 * `--packages=external` mantem node_modules fora do bundle e resolve os
 * aliases de importacao sem precisar de loader em tempo de execucao.
 */
import { build } from 'esbuild';
import { rm, mkdir, readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Carimba a versao no binario para que /api/health informe exatamente qual
 * codigo esta rodando. Sem isso, "o novo ja subiu?" vira adivinhacao.
 */
function commitAtual() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return process.env.SOURCE_COMMIT?.slice(0, 7) ?? 'desconhecido';
  }
}

await rm('dist/server', { recursive: true, force: true });
await mkdir('dist/server', { recursive: true });

const result = await build({
  entryPoints: ['src/server/index.ts'],
  outfile: 'dist/server/index.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  packages: 'external',
  // lucide-react is ESM-only. An externalized import becomes require() in
  // the CommonJS worker and crashes when generating a site (around 60%).
  // Bundle its icon exports while keeping the other node_modules external.
  plugins: [{
    name: 'bundle-lucide-react-esm',
    setup(build) {
      build.onResolve({ filter: /^lucide-react$/ }, () => ({
        path: fileURLToPath(import.meta.resolve('lucide-react')),
      }));
    },
  }],
  sourcemap: false,
  minify: false,
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    __BUILD_COMMIT__: JSON.stringify(commitAtual()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});

if (result.errors.length > 0) {
  console.error('Falha ao compilar o servidor.');
  process.exit(1);
}

// Prevent a green Railway build with the placeholder source accidentally
// embedded in the worker bundle. A deployed app must not fail at 60%.
const output = await readFile('dist/server/index.js', 'utf8');
for (const required of [
  'frigolog-kpi-grid', 'pn-photo-missing', 'FRIGOLOG canonical source',
  'data-pn-operation-steps', 'data-pn-kpi-rail',
  'PAGENOVA_KPI_CONTINUOUS_MARQUEE_V1', 'pausedUntil',
]) {
  if (!output.includes(required)) {
    throw new Error('[FRIGOLOG] Compiled backend is missing canonical template marker: ' + required);
  }
}
console.log('[FRIGOLOG] Canonical template included in server bundle.');
console.log('Servidor compilado em dist/server/index.js');
