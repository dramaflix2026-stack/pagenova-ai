import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@server': resolvePath('./src/server'),
      '@client': resolvePath('./src/client'),
      '@shared': resolvePath('./src/shared'),
      '@site-kit': resolvePath('./src/site-kit'),
      '@builder': resolvePath('./src/builder'),
      '@tests': resolvePath('./tests'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // .tsx cobre os testes de componente, que rodam em jsdom via docblock.
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/components/**/*.test.{ts,tsx}',
      'tests/generation/**/*.test.{ts,tsx}',
      'tests/visual/**/*.test.{ts,tsx}',
      'tests/accessibility/**/*.test.{ts,tsx}',
    ],
    // Nenhum teste consome a API real do Google.
    env: {
      NODE_ENV: 'test',
      APP_TIMEZONE: 'America/Sao_Paulo',
      SESSION_SECRET: 'teste-local-sessao-com-tamanho-suficiente-1234',
      GOOGLE_MAPS_API_KEY: '',
    },
  },
});
