/**
 * Compila o backend em um unico arquivo CommonJS.
 * `--packages=external` mantem node_modules fora do bundle e resolve os
 * aliases de importacao sem precisar de loader em tempo de execucao.
 */
import { build } from 'esbuild';
import { rm, mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';

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

console.log('Servidor compilado em dist/server/index.js');
