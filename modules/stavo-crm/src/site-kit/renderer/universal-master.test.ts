import { describe, expect, it } from 'vitest';
import type { SiteSchemaModel } from '@site-kit/schemas/site-schema';
import { renderUniversalMaster } from './universal-master';

function fixture(): SiteSchemaModel {
  return {
    business: { name: 'Clínica <Exemplo>' },
    navigation: { headerCta: null, items: [{ label: 'Serviços', anchor: 'servicos' }] },
    objective: { primaryCta: { kind: 'anchor', target: 'contato', label: 'Agendar' } },
    theme: { colors: { primary: '#17665a', primaryForeground: '#ffffff' } },
    sections: [
      {
        id: 'hero-1', anchor: 'inicio', type: 'hero', visible: true,
        headline: 'Atendimento humano <dedicado>', eyebrow: 'Clínica de saúde',
        subheadline: 'Informações verificadas, sem dados inventados',
        primaryCta: { kind: 'anchor', target: 'contato', label: 'Agendar' },
      },
      {
        id: 'benefits-1', anchor: 'beneficios', type: 'benefits', visible: true,
        headline: 'Diferenciais', items: [{ title: 'Equipe dedicada', body: 'Atendimento personalizado' }, { title: 'Escuta', body: 'Acolhimento' }],
      },
      {
        id: 'services-1', anchor: 'servicos', type: 'services', visible: true,
        headline: 'Consultas e serviços', items: [{ title: 'Consulta', body: 'Cuidado individual' }],
      },
      {
        id: 'cta-1', anchor: 'contato', type: 'cta', visible: true,
        headline: 'Converse com nossa equipe', primaryCta: { kind: 'anchor', target: 'contato', label: 'Agendar' },
      },
    ],
  } as unknown as SiteSchemaModel;
}

describe('PageNova universal master renderer', () => {
  const context = { profile: 'DEMO' as const, resolveAsset: () => null };
  it('renders lead-specific data using the same saved sections', () => {
    const model = fixture();
    const html = renderUniversalMaster(model, context, () => '', (s) => s);
    expect(html).toContain('Clínica &lt;Exemplo&gt;');
    expect(html).toContain('Atendimento humano &lt;dedicado&gt;');
    expect(html).toContain('pn-master-kpis');
    expect(html).toContain('pn-master-services');
    expect(html).toContain('href="#contato"');
    expect(html).not.toContain('<Exemplo>');
  });
  it('does not render hidden sections and preserves editor section IDs', () => {
    const model = fixture();
    model.sections[2]!.visible = false;
    const html = renderUniversalMaster(model, context, () => '', (s) => s);
    expect(html).toContain('id="inicio"');
    expect(html).not.toContain('id="servicos"');
    expect(html).not.toContain('Consultas e serviços');
  });
  it('uses real uploaded image resolution instead of fabricated stock images', () => {
    const model = fixture();
    const hero = model.sections[0]!;
    if (hero.type !== 'hero') throw new Error('Invalid fixture');
    hero.image = { assetId: '0123456789ABCDEFGHJKMNPQRS', alt: 'Equipe na clínica', focalX: 0.5, focalY: 0.5 };
    const html = renderUniversalMaster(
      model,
      { profile: 'DEMO', resolveAsset: (id) => id === hero.image!.assetId ? { url: '/assets/real.webp' } : null },
      () => '',
      (s) => s,
    );
    expect(html).toContain('/assets/real.webp');
    expect(html).not.toContain('unsplash.com');
  });
});