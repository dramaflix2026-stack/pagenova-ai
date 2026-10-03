import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

/**
 * Testes de integracao: exigem um MySQL de teste.
 * Configure TEST_DB_HOST / TEST_DB_NAME / TEST_DB_USER / TEST_DB_PASSWORD.
 * Sem isso, a suite e ignorada com aviso explicito (nunca falha silenciosa).
 */
export default defineConfig({
  resolve: {
    alias: {
      '@server': resolvePath('./src/server'),
      '@shared': resolvePath('./src/shared'),
      '@site-kit': resolvePath('./src/site-kit'),
      '@builder': resolvePath('./src/builder'),
      '@tests': resolvePath('./tests'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    // Migracoes e transacoes precisam de tempo e nao podem correr em paralelo.
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
