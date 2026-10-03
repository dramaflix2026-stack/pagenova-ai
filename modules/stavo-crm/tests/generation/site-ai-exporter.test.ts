/**
 * Exportacao ZIP (secao 17 da especificacao).
 *
 * O que estes testes protegem: o pacote abre sem backend, sem chave e sem
 * localhost; o perfil de demonstracao e o de producao produzem robots e
 * sitemap coerentes com o que foi confirmado; e um schema com erro nunca
 * vira um ZIP entregavel.
 */
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import { buildFixtureSite } from '@server/modules/site-ai/fixture';
import { exportProjectZip } from '@builder/publishing/exporter';

async function fileText(zip: JSZip, name: string): Promise<string | null> {
  const entry = zip.file(name);
  return entry ? entry.async('string') : null;
}

describe('exportProjectZip', () => {
  it('produz um pacote com a estrutura minima da secao 17.2', async () => {
    const result = await exportProjectZip('projeto-1', buildFixtureSite(), { allowIndexing: false });
    const zip = await JSZip.loadAsync(result.buffer);

    expect(zip.file('index.html')).toBeTruthy();
    expect(zip.file('404.html')).toBeTruthy();
    expect(zip.file('favicon.svg')).toBeTruthy();
    expect(zip.file('robots.txt')).toBeTruthy();
    expect(zip.file('README-DEPLOY.txt')).toBeTruthy();
    expect(result.filename).toBe('marina-ferraz-nutricao.zip');
  });

  it('perfil demonstracao: noindex e sem sitemap', async () => {
    const result = await exportProjectZip('projeto-1', buildFixtureSite(), { allowIndexing: false });
    const zip = await JSZip.loadAsync(result.buffer);

    expect(await fileText(zip, 'robots.txt')).toContain('Disallow: /');
    expect(zip.file('sitemap.xml')).toBeNull();

    const html = await fileText(zip, 'index.html');
    expect(html).toContain('noindex');
  });

  it('perfil producao com dominio confirmado: indexavel, com sitemap e canonical', async () => {
    const result = await exportProjectZip('projeto-1', buildFixtureSite(), {
      allowIndexing: true,
      canonicalUrl: 'https://marinaferraznutricao.com.br',
    });
    const zip = await JSZip.loadAsync(result.buffer);

    expect(await fileText(zip, 'robots.txt')).toContain('Allow: /');
    expect(await fileText(zip, 'robots.txt')).toContain('sitemap.xml');
    expect(zip.file('sitemap.xml')).toBeTruthy();
    expect(await fileText(zip, 'sitemap.xml')).toContain('marinaferraznutricao.com.br');

    const html = await fileText(zip, 'index.html');
    expect(html).toContain('index,follow');
    expect(html).toContain('rel="canonical" href="https://marinaferraznutricao.com.br"');
  });

  it('sem dominio confirmado, nunca gera canonical falso mesmo pedindo indexacao', async () => {
    const result = await exportProjectZip('projeto-1', buildFixtureSite(), { allowIndexing: true });
    const zip = await JSZip.loadAsync(result.buffer);

    const html = await fileText(zip, 'index.html');
    expect(html).not.toContain('rel="canonical"');
    expect(zip.file('sitemap.xml')).toBeNull();
  });

  it('recusa exportar um schema com erro estrutural do linter', async () => {
    const broken = buildFixtureSite();
    broken.theme.colors.text = broken.theme.colors.background; // contraste zero.

    await expect(exportProjectZip('projeto-1', broken, { allowIndexing: false })).rejects.toThrow();
  });

  it('nunca inclui localhost, caminho de API ou variavel de ambiente', async () => {
    const result = await exportProjectZip('projeto-1', buildFixtureSite(), { allowIndexing: false });
    const zip = await JSZip.loadAsync(result.buffer);

    for (const [name, entry] of Object.entries(zip.files)) {
      if (entry.dir || !/\.(html|txt|xml)$/.test(name)) continue;
      const text = await entry.async('string');
      expect(text, name).not.toContain('localhost');
      expect(text, name).not.toContain('/api/');
      expect(text, name).not.toContain('ANTHROPIC_API_KEY');
    }
  });

  it('um nome de negocio com palavra coincidente ("Localhost Cafe") nao e bloqueado por falso positivo', async () => {
    const result = await exportProjectZip('projeto-1', buildFixtureSite(), {
      allowIndexing: false,
      businessNameOverride: 'Localhost Cafe',
    });
    // A checagem e sensivel a maiusculas/minusculas: "Localhost" (nome real,
    // capitalizado) nunca e confundido com "localhost" (o vazamento tecnico).
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it('respeita o nome de negocio alternativo informado na exportacao', async () => {
    const result = await exportProjectZip('projeto-1', buildFixtureSite(), {
      allowIndexing: false,
      businessNameOverride: 'Nome Final Combinado Com O Cliente',
    });
    const zip = await JSZip.loadAsync(result.buffer);
    const html = await fileText(zip, 'index.html');

    expect(html).toContain('Nome Final Combinado Com O Cliente');
    expect(result.filename).toBe('nome-final-combinado-com-o-cliente.zip');
  });

  it('o README nunca menciona segredo e explica Netlify e Hostinger', async () => {
    const result = await exportProjectZip('projeto-1', buildFixtureSite(), { allowIndexing: false });
    const zip = await JSZip.loadAsync(result.buffer);
    const readme = await fileText(zip, 'README-DEPLOY.txt');

    expect(readme).toContain('NETLIFY');
    expect(readme).toContain('HOSTINGER');
    expect(readme?.toLowerCase()).not.toContain('senha:');
    expect(readme?.toLowerCase()).not.toContain('api_key');
  });

  it('o favicon e um SVG valido, sem script embutido', async () => {
    const result = await exportProjectZip('projeto-1', buildFixtureSite(), { allowIndexing: false });
    const zip = await JSZip.loadAsync(result.buffer);
    const favicon = await fileText(zip, 'favicon.svg');

    expect(favicon).toContain('<svg');
    expect(favicon).not.toContain('<script');
    expect(favicon).not.toContain('onload');
  });

  it('embute o runtime -- sem ele o pacote abriria sem menu, animacao nem formulario', async () => {
    const result = await exportProjectZip('projeto-1', buildFixtureSite(), { allowIndexing: false });
    const zip = await JSZip.loadAsync(result.buffer);
    const html = await fileText(zip, 'index.html');

    expect(html).toContain('__siteRuntimeCleanup');
    expect(html).toContain('data-nav-toggle');
    expect(html).toContain('data-whatsapp-form');
  });

  it('e reproduzivel: exportar duas vezes o mesmo rascunho da o mesmo HTML', async () => {
    const model = buildFixtureSite();
    const a = await exportProjectZip('projeto-1', model, { allowIndexing: false });
    const b = await exportProjectZip('projeto-1', model, { allowIndexing: false });

    const zipA = await JSZip.loadAsync(a.buffer);
    const zipB = await JSZip.loadAsync(b.buffer);
    expect(await fileText(zipA, 'index.html')).toBe(await fileText(zipB, 'index.html'));
  });
});
