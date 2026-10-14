import { describe, expect, it } from 'vitest';
import type { SiteSchemaModel } from '@site-kit/schemas/site-schema';
import { renderAtelierNorte, ATELIER_NORTE_CSS, ATELIER_NORTE_RUNTIME } from '@site-kit/renderer/atelier-norte-render';

const model = {
  project: { templateId: 'atelier-norte' },
  business: {
    name: 'Exemplo Soluções',
    niche: 'Consultoria empresarial',
    description: 'Orientação para pequenas empresas.',
    city: 'São Paulo',
    state: 'SP',
    services: [{ name: 'Consultoria', description: 'Projetos personalizados.' }],
    whatsappE164: null, phoneE164: null, email: null, address: null,
  },
  theme: {
    colors: { primary: '#b6644c', accent: '#b6644c', background: '#f6f2eb', text: '#332b28' },
  },
  navigation: { logo: null },
  objective: { primaryCta: { kind: 'anchor', target: 'contato', label: 'Fale conosco' } },
  sections: [],
} as unknown as SiteSchemaModel;

describe('Template 003 Atelier Norte', () => {
  it('renders all four original navigation destinations with real business data', () => {
    const html = renderAtelierNorte(model, { profile: 'DEMO', resolveAsset: () => null }, text => text);
    for (const page of ['inicio', 'sobre', 'servicos', 'contato']) {
      expect(html).toContain('data-at-view="' + page + '"');
      expect(html).toContain('href="#' + page + '"');
    }
    expect(html).toContain('Exemplo Soluções');
    expect(html).toContain('Consultoria');
    expect(html).not.toContain('Marina Costa');
    expect(html).not.toContain('contato@ateliernorte.com.br');
  });

  it('retains typography, colors, mobile layout, and a syntactically valid browser runtime', () => {
    expect(ATELIER_NORTE_CSS).toContain('Instrument Serif');
    expect(ATELIER_NORTE_CSS).toContain('Work Sans');
    expect(ATELIER_NORTE_CSS).toContain('oklch(.56 .14 40)');
    expect(ATELIER_NORTE_CSS).toContain('@media(max-width:767px)');
    expect(() => new Function(ATELIER_NORTE_RUNTIME)).not.toThrow();
    expect(ATELIER_NORTE_RUNTIME).toContain('FormData');
    expect(ATELIER_NORTE_RUNTIME).toContain('hashchange');
  });
});
