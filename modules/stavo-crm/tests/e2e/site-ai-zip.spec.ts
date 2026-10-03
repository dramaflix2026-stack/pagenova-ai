/**
 * Validacao do ZIP exportado (secao 17.6 da especificacao): gera, EXTRAI de
 * verdade num diretorio temporario, serve com um servidor estatico de
 * verdade e abre num navegador de verdade -- nao inspeciona so os bytes do
 * ZIP, prova que o pacote FUNCIONA fora de qualquer coisa que o CRM controle.
 */
import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import JSZip from 'jszip';
import { expect, test } from '@playwright/test';

import { buildFixtureSite } from '../../src/server/modules/site-ai/fixture';
import { exportProjectZip } from '@builder/publishing/exporter';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

async function extractZip(buffer: Buffer, targetDir: string): Promise<void> {
  const zip = await JSZip.loadAsync(buffer);
  const { writeFile, mkdir } = await import('node:fs/promises');

  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const dest = path.join(targetDir, name);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, await entry.async('nodebuffer'));
  }
}

function serveStatic(rootDir: string): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const requestPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
      const relative = requestPath === '/' ? '/index.html' : requestPath;
      const filePath = path.join(rootDir, relative);

      // A MESMA protecao que o storage do CRM aplica: nunca sair da raiz.
      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403).end();
        return;
      }

      if (!existsSync(filePath)) {
        const notFound = path.join(rootDir, '404.html');
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        createReadStream(notFound).pipe(res);
        return;
      }

      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
      createReadStream(filePath).pipe(res);
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({ server, port });
    });
  });
}

test.describe('ZIP exportado: extraido e servido de verdade', () => {
  let extractDir: string;
  let server: Server;
  let baseUrl: string;

  test.beforeAll(async () => {
    const result = await exportProjectZip('projeto-teste', buildFixtureSite(), { allowIndexing: false });

    extractDir = await mkdtemp(path.join(os.tmpdir(), 'site-ai-zip-'));
    await extractZip(result.buffer, extractDir);

    const listening = await serveStatic(extractDir);
    server = listening.server;
    baseUrl = `http://127.0.0.1:${listening.port}`;
  });

  test.afterAll(async () => {
    await new Promise((resolve) => server.close(() => resolve(undefined)));
    await rm(extractDir, { recursive: true, force: true });
  });

  test('abre sem nenhum backend, JS de terceiro ou dependencia externa', async ({ page }) => {
    const requestsToOutside: string[] = [];
    page.on('request', (request) => {
      if (!request.url().startsWith(baseUrl)) requestsToOutside.push(request.url());
    });

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const response = await page.goto(`${baseUrl}/`);
    expect(response?.status()).toBe(200);
    expect(requestsToOutside, JSON.stringify(requestsToOutside)).toHaveLength(0);
    expect(consoleErrors, JSON.stringify(consoleErrors)).toHaveLength(0);

    await expect(page.locator('h1')).toBeVisible();
  });

  test('recarregar a pagina funciona (index.html na raiz)', async ({ page }) => {
    await page.goto(`${baseUrl}/`);
    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('o botao de WhatsApp abre com a mensagem certa, sem backend', async ({ page }) => {
    await page.goto(`${baseUrl}/`);
    const link = page.getByRole('link', { name: /agendar uma avaliacao/i }).first();
    const href = await link.getAttribute('href');

    expect(href).toContain('https://wa.me/5519998877665');
    expect(href).toContain('text=');
  });

  test('caminho inexistente cai no 404.html do proprio pacote', async ({ page }) => {
    const response = await page.goto(`${baseUrl}/pagina-que-nao-existe`);
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText(/nao encontrada/i);
  });

  test('o menu movel funciona no pacote extraido, sem o CRM por perto', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto(`${baseUrl}/`);

    await page.locator('[data-nav-toggle]').click();
    await expect(page.locator('#menu-principal')).toHaveAttribute('data-open', 'true');
  });
});
