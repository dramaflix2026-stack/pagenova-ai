import { defineConfig, devices } from '@playwright/test';

/**
 * Testes E2E da PROPRIA aplicacao.
 * Playwright nunca e usado para extrair dados do Google Maps.
 *
 * Requer a aplicacao rodando com um banco de teste:
 *   npm run build && npm start
 * Veja docs/testing.md para o procedimento completo.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // O fluxo movel usa "Mover para...", nunca arrastar.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
