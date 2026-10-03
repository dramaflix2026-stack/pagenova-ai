/**
 * QA determinístico do site gerado (secao 8.7 e 26 da especificacao).
 *
 * "Determinístico" e a palavra que importa: nada aqui pede opiniao a uma IA.
 * Um navegador real renderiza o HTML que `renderSite` produziu e o teste
 * verifica fatos mecanicos -- ha rolagem horizontal? o eixo de acessibilidade
 * falha? o menu funciona sem JavaScript?
 *
 * Nao depende do CRM rodando: e HTML servido via `page.setContent`, o mesmo
 * que sairia do servidor, da publicacao ou do ZIP. Por isso roda sem MySQL.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { buildFixtureSite } from '../../src/server/modules/site-ai/fixture';
import { lintSite } from '@site-kit/utils/linter';
import { renderSite } from '@site-kit/renderer/render-site';
import { SITE_RUNTIME_JS } from '@site-kit/interactions/runtime';

const AXE_SOURCE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const VIEWPORTS = [
  { width: 320, height: 720, label: '320px' },
  { width: 360, height: 740, label: '360px' },
  { width: 390, height: 780, label: '390px' },
  { width: 768, height: 1024, label: '768px' },
  { width: 1024, height: 800, label: '1024px' },
  { width: 1440, height: 900, label: '1440px' },
];

function fixtureHtml(withRuntime: boolean): string {
  const model = buildFixtureSite();
  return renderSite(model, {
    profile: 'DEMO',
    resolveAsset: () => null,
    inlineRuntime: withRuntime ? SITE_RUNTIME_JS : undefined,
  });
}

async function hasHorizontalOverflow(page: Page): Promise<{ overflow: boolean; scrollWidth: number; clientWidth: number }> {
  return page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
}

test.describe('linter deterministico: a fixture e o padrao de qualidade', () => {
  test('zero erros e zero avisos', () => {
    const report = lintSite(buildFixtureSite());
    expect(report.errors, JSON.stringify(report.errors, null, 2)).toHaveLength(0);
    expect(report.warnings, JSON.stringify(report.warnings, null, 2)).toHaveLength(0);
  });
});

test.describe('responsividade: sem rolagem horizontal em nenhuma largura', () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.setContent(fixtureHtml(true), { waitUntil: 'load' });

      const result = await hasHorizontalOverflow(page);
      expect(result.overflow, `scrollWidth=${result.scrollWidth} clientWidth=${result.clientWidth}`).toBe(false);
    });
  }
});

test.describe('menu movel', () => {
  test('abre, foca o primeiro link e fecha com Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await page.setContent(fixtureHtml(true), { waitUntil: 'load' });

    const toggle = page.locator('[data-nav-toggle]');
    await toggle.click();

    const nav = page.locator('#menu-principal');
    await expect(nav).toHaveAttribute('data-open', 'true');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(nav).toHaveAttribute('data-open', 'false');
  });

  test('sem JavaScript, o menu continua sendo uma lista de links navegavel', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 780 } });
    const page = await context.newPage();
    await page.setContent(fixtureHtml(true), { waitUntil: 'load' });

    // Sem JS a classe `js` nunca liga, e o CSS de esconder nunca vale --
    // o conteudo continua visivel e os links do menu continuam clicaveis.
    const links = page.locator('#menu-principal a');
    expect(await links.count()).toBeGreaterThan(0);
    await expect(page.locator('h1')).toBeVisible();

    await context.close();
  });
});

test.describe('acessibilidade (axe-core)', () => {
  test('nenhuma violacao critica ou serie no desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.setContent(fixtureHtml(true), { waitUntil: 'load' });
    await page.addScriptTag({ content: AXE_SOURCE });

    const violations = await page.evaluate(async () => {
      // @ts-expect-error -- axe e injetado via addScriptTag, sem tipos aqui.
      const result = await window.axe.run(document, {
        // Regra de contraste ja e coberta, com mais precisao, pelo linter
        // (secao 9.6): ele conhece os tokens exatos, o axe so ve pixels
        // renderizados e pode falsear com fontes de fallback do ambiente.
        rules: { 'color-contrast': { enabled: false } },
      });
      return result.violations.map((v: { id: string; impact: string; nodes: unknown[] }) => ({
        id: v.id,
        impact: v.impact,
        count: v.nodes.length,
      }));
    });

    const serious = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });

  test('nenhuma violacao critica ou serie no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await page.setContent(fixtureHtml(true), { waitUntil: 'load' });
    await page.addScriptTag({ content: AXE_SOURCE });

    const violations = await page.evaluate(async () => {
      // @ts-expect-error -- idem.
      const result = await window.axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
      return result.violations.map((v: { id: string; impact: string }) => ({ id: v.id, impact: v.impact }));
    });

    const serious = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });
});

test.describe('reduced-motion', () => {
  test('todo o conteudo esta visivel imediatamente quando o visitante pede menos movimento', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.setContent(fixtureHtml(true), { waitUntil: 'load' });

    // A classe `js` nao liga com reduced-motion (site-runtime.ts): confirma
    // que a regra de escurecer para animar nunca chega a se aplicar.
    const hasJsClass = await page.evaluate(() => document.documentElement.classList.contains('js'));
    expect(hasJsClass).toBe(false);

    const hiddenBySectionAnimation = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('[data-animate]'));
      return sections.filter((el) => getComputedStyle(el).opacity === '0').length;
    });
    expect(hiddenBySectionAnimation).toBe(0);

    await context.close();
  });
});

test.describe('conteudo sem JavaScript', () => {
  test('titulo, textos e CTA principal aparecem sem executar nenhum script', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.setContent(fixtureHtml(true), { waitUntil: 'load' });

    await expect(page.locator('h1')).toContainText('plano alimentar');
    await expect(page.getByRole('link', { name: /agendar uma avaliacao/i }).first()).toBeVisible();

    await context.close();
  });
});

test.describe('screenshots locais (evidencia visual determinística)', () => {
  for (const viewport of [{ w: 390, h: 900, name: 'mobile' }, { w: 1440, h: 1100, name: 'desktop' }]) {
    test(`captura em ${viewport.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.w, height: viewport.h });
      await page.setContent(fixtureHtml(true), { waitUntil: 'load' });

      // Uma screenshot de pagina inteira nao rola de verdade: sem isto, o
      // IntersectionObserver nunca chega a disparar para as secoes abaixo da
      // dobra original, e elas saem da captura com opacity:0, como se
      // estivessem vazias. `scrollIntoViewIfNeeded` faz o navegador rolar de
      // fato, com os passos de renderizacao que o observer depende -- um
      // `scrollTo` bruto seguido de volta imediata pode nunca chegar a
      // pintar o estado intermediario. Um visitante rolando normalmente
      // nunca veria a secao vazia: o disparo acontece bem antes dela ficar
      // totalmente visivel (rootMargin -12%).
      const animated = page.locator('[data-animate]');
      const total = await animated.count();
      for (let i = 0; i < total; i += 1) {
        await animated.nth(i).scrollIntoViewIfNeeded();
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForFunction(
        () => document.querySelectorAll('[data-animate]:not(.is-visible)').length === 0,
        { timeout: 5000 },
      );

      const screenshotPath = path.join(testInfo.outputDir, `fixture-${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await testInfo.attach(`fixture-${viewport.name}`, { path: screenshotPath, contentType: 'image/png' });
    });
  }
});
