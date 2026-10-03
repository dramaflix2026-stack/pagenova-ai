/**
 * Caminho completo do modo demonstracao, sem rede: SiteSpec -> plano ->
 * montagem -> linter -> HTML.
 *
 * Tres nichos com direcao visual deliberadamente diferente. O que se cobra
 * aqui e o que o diagnostico apontou como causa de "site generico":
 *  - a direcao visual precisa CHEGAR ao HTML (paleta, fontes, variantes);
 *  - dois nichos diferentes nao podem terminar com a mesma cara;
 *  - imagem so aparece quando existe imagem real;
 *  - regras de composicao erradas sao corrigidas sem chamada paga.
 */
import { describe, expect, it } from 'vitest';

import { assemblePlan } from '@builder/generation/assembler';
import { aliasCandidates } from '@builder/generation/image-candidates';
import { emptyBusinessFacts } from '@builder/generation/mock-provider';
import type { GenerateSitePlanInput } from '@builder/generation/provider';
import { convertSpecToPlan } from '@builder/generation/spec-to-plan';
import type { SiteSpec } from '@builder/generation/site-spec';
import { lintSite } from '@site-kit/utils/linter';
import { renderSite } from '@site-kit/renderer/render-site';
import { specFixture, specSection } from '@tests/fixtures/site-spec';

function inputFor(name: string, overrides: Partial<GenerateSitePlanInput> = {}): GenerateSitePlanInput {
  return {
    business: { ...emptyBusinessFacts(name), niche: 'servicos', city: 'Campinas' },
    siteType: 'ONE_PAGE',
    objective: { goal: 'APPOINTMENTS' },
    style: { theme: 'AI_DECIDES', keywords: [], density: 'BALANCED', motionLevel: 'BALANCED' },
    creativeSeed: 'seed-1',
    ...overrides,
  };
}

/** Converte, monta e renderiza -- o mesmo caminho do worker. */
function build(spec: SiteSpec, input = inputFor('Negocio'), candidates = aliasCandidates([])) {
  const conversion = convertSpecToPlan(spec, input, candidates);
  const assembled = assemblePlan({
    plan: conversion.plan,
    business: input.business,
    siteType: input.siteType,
    creativeSeed: input.creativeSeed,
    promptVersion: '2.0.0',
    imageBindings: conversion.imageBindings,
  });
  const html = renderSite(assembled.model, {
    profile: 'DEMO',
    resolveAsset: (assetId) => ({ url: `/assets/${assetId}.webp`, width: 1600, height: 900 }),
  });
  return { ...conversion, ...assembled, html };
}

// --- Tres nichos -----------------------------------------------------------

const clinica = specFixture();

const advocacia = specFixture({
  palette: {
    background: '#12141A',
    surface: '#1B1F27',
    text: '#F2F1EE',
    muted: '#A9AEB8',
    primary: '#C9A227',
    primaryForeground: '#12141A',
    accent: '#7A8699',
    accentForeground: '#12141A',
    border: '#2A2F3A',
    rationale: 'Escuro sobrio com dourado discreto: autoridade sem frieza corporativa.',
  },
  typography: { headingFont: 'Playfair Display', bodyFont: 'Work Sans', scale: 'DRAMATIC', headingWeight: '700', rationale: 'Serifa classica com sans aberta.' },
  visualDirection: { mode: 'DARK', shape: 'SHARP', density: 'AIRY', elevation: 'NONE', buttonStyle: 'OUTLINE', headerVariant: 'minimal-cta', imageTreatment: 'DUOTONE' },
  sections: [
    specSection({ type: 'hero', variant: 'minimal-rule', headline: 'Defesa tecnica em direito de familia, com linguagem que se entende', primaryCta: { intent: 'whatsapp', label: 'Agendar conversa', whatsappMessage: 'Oi, preciso de orientacao.' } }),
    specSection({ type: 'process', variant: 'numbered-steps', headline: 'Como conduzimos um caso', items: [
      { title: 'Conversa inicial', body: 'Entendemos o contexto e os prazos.', icon: 'clipboard-list', image: 'none' },
      { title: 'Estrategia', body: 'Apresentamos os caminhos possiveis por escrito.', icon: 'target', image: 'none' },
      { title: 'Acompanhamento', body: 'Atualizacao a cada movimentacao do processo.', icon: 'clock', image: 'none' },
    ] }),
    specSection({ type: 'faq', variant: 'side-heading', headline: 'Perguntas frequentes', faq: [
      { question: 'Atende fora de Campinas?', answer: 'Sim, com reunioes on-line.' },
      { question: 'Quanto tempo leva?', answer: 'Depende do caso; damos uma estimativa na primeira conversa.' },
    ] }),
    specSection({ type: 'footer', variant: 'legal-only', tagline: 'Advocacia de familia.' }),
  ],
});

const padaria = specFixture({
  palette: {
    background: '#FFF7EC',
    surface: '#FFFFFF',
    text: '#2E1F14',
    muted: '#7A6553',
    primary: '#C2410C',
    primaryForeground: '#FFFFFF',
    accent: '#7C9A5B',
    accentForeground: '#2E1F14',
    border: '#EADDCB',
    rationale: 'Terrosos quentes remetem a forno e pao fresco.',
  },
  typography: { headingFont: 'Sora', bodyFont: 'DM Sans', scale: 'QUIET', headingWeight: '800', rationale: 'Geometrica marcante para um tom despojado.' },
  visualDirection: { mode: 'LIGHT', shape: 'ROUND', density: 'COMPACT', elevation: 'MEDIUM', buttonStyle: 'SOFT', headerVariant: 'stacked-bar', imageTreatment: 'NATURAL' },
  sections: [
    specSection({ type: 'hero', variant: 'editorial-split', headline: 'Pao de fermentacao lenta, assado todo dia as 6h', image: 'img-1', primaryCta: { intent: 'whatsapp', label: 'Encomendar', whatsappMessage: 'Oi! Quero encomendar.' } }),
    specSection({ type: 'gallery', variant: 'grid-uniform', headline: 'Da bancada para a sua mesa', gallery: ['img-1', 'img-2'] }),
    specSection({ type: 'benefits', variant: 'icon-grid', headline: 'Por que o sabor muda', items: [
      { title: 'Fermentacao de 24h', body: 'Mais leve para digerir.', icon: 'clock', image: 'none' },
      { title: 'Farinha moida perto', body: 'Compramos de um moinho da regiao.', icon: 'leaf', image: 'none' },
    ] }),
    specSection({ type: 'footer', variant: 'inline-bar', tagline: 'Padaria de bairro.' }),
  ],
});

const duasImagens = aliasCandidates([
  { assetId: 'a'.repeat(26), width: 1600, height: 900, description: 'paes na bancada', focalX: 0.5, focalY: 0.5, source: 'UPLOAD' },
  { assetId: 'b'.repeat(26), width: 1200, height: 1200, description: 'forno aceso', focalX: 0.5, focalY: 0.5, source: 'UPLOAD' },
]);

describe('tres nichos produzem sites diferentes', () => {
  const sites = {
    clinica: build(clinica, inputFor('Clinica Aurora')),
    advocacia: build(advocacia, inputFor('Marques Advocacia')),
    padaria: build(padaria, inputFor('Padaria Levain'), duasImagens),
  };

  it('cada um monta, passa no linter e vira HTML', () => {
    for (const [nome, site] of Object.entries(sites)) {
      expect(lintSite(site.model).errors, nome).toEqual([]);
      expect(site.html.length, nome).toBeGreaterThan(1000);
    }
  });

  it('a direcao visual chega ao HTML: paleta, fontes e modo', () => {
    expect(sites.advocacia.model.theme.mode).toBe('DARK');
    expect(sites.advocacia.html).toContain('Playfair Display');
    expect(sites.padaria.html).toContain('Sora');
    expect(sites.clinica.html).toContain('Fraunces');
    // A cor principal de cada nicho aparece nos tokens do CSS.
    expect(sites.padaria.html.toUpperCase()).toContain('#C2410C');
  });

  it('nenhum par de nichos termina com a mesma cara', () => {
    const assinatura = (site: (typeof sites)['clinica']) =>
      [
        site.model.theme.colors.primary,
        site.model.theme.typography.headingFont,
        site.model.theme.radii.md,
        site.model.sections.map((section) => `${section.type}:${section.variant}`).join(','),
      ].join('|');

    const assinaturas = Object.values(sites).map(assinatura);
    expect(new Set(assinaturas).size).toBe(assinaturas.length);
  });

  it('a densidade e o formato escolhidos mudam espacamento e raio', () => {
    expect(sites.advocacia.model.theme.spacing.sectionPaddingRem).toBeGreaterThan(
      sites.padaria.model.theme.spacing.sectionPaddingRem,
    );
    expect(sites.padaria.model.theme.radii.md).toBeGreaterThan(sites.advocacia.model.theme.radii.md);
  });
});

describe('imagens: so as reais entram', () => {
  it('sem upload, a galeria e descartada e nenhum <img> sobra', () => {
    const site = build(padaria, inputFor('Padaria Levain'));
    expect(site.model.sections.some((section) => section.type === 'gallery')).toBe(false);
    expect(site.html).not.toContain('<img');
    // Some ja na conversao, antes de chegar ao montador: o aviso explica por que.
    expect(site.adjustments.join(' ')).toContain('Galeria removida');
  });

  it('com uploads, hero e galeria usam os assets reais', () => {
    const site = build(padaria, inputFor('Padaria Levain'), duasImagens);
    const hero = site.model.sections.find((section) => section.type === 'hero');
    expect(hero && 'image' in hero ? hero.image?.assetId : null).toBe('a'.repeat(26));
    expect(site.html).toContain(`/assets/${'a'.repeat(26)}.webp`);
    const gallery = site.model.sections.find((section) => section.type === 'gallery');
    expect(gallery && 'images' in gallery ? gallery.images.length : 0).toBe(2);
  });

  it('o texto alternativo da imagem vem da descricao do upload, nunca da IA', () => {
    const site = build(padaria, inputFor('Padaria Levain'), duasImagens);
    const hero = site.model.sections.find((section) => section.type === 'hero');
    expect(hero && 'image' in hero ? hero.image?.alt : null).toBe('paes na bancada');
  });
});

describe('correcoes sem chamada paga', () => {
  it('variante de outro tipo e trocada pela primeira valida do tipo', () => {
    const spec = specFixture({
      sections: [
        specSection({ type: 'hero', variant: 'accordion-single', headline: 'Titulo' }),
        specSection({ type: 'footer', variant: 'simple-centered' }),
      ],
    });
    const site = build(spec);
    const hero = site.model.sections.find((section) => section.type === 'hero');
    expect(hero?.variant).not.toBe('accordion-single');
    expect(site.adjustments.join(' ')).toContain('accordion-single');
  });

  it('movimento fora do nivel do briefing e substituido', () => {
    const spec = specFixture({
      sections: [
        specSection({ type: 'hero', variant: 'centered-statement', headline: 'Titulo', motionPreset: 'parallax-subtle' }),
        specSection({ type: 'footer', variant: 'simple-centered' }),
      ],
    });
    const site = build(spec, inputFor('X', { style: { theme: 'AI_DECIDES', keywords: [], density: 'BALANCED', motionLevel: 'SUBTLE' } }));
    expect(site.model.sections[0]!.motionPreset).not.toBe('parallax-subtle');
    expect(site.adjustments.join(' ')).toContain('parallax-subtle');
  });

  it('hero fora do inicio volta para a primeira posicao', () => {
    const spec = specFixture({
      sections: [
        specSection({ type: 'faq', variant: 'accordion-single', headline: 'Duvidas', faq: [
          { question: 'a?', answer: 'sim' },
          { question: 'b?', answer: 'nao' },
        ] }),
        specSection({ type: 'hero', variant: 'centered-statement', headline: 'Titulo do hero' }),
        specSection({ type: 'footer', variant: 'simple-centered' }),
      ],
    });
    const site = build(spec);
    expect(site.model.sections[0]!.type).toBe('hero');
    expect(site.model.sections[site.model.sections.length - 1]!.type).toBe('footer');
  });

  it('secao com itens de menos e removida em vez de virar layout quebrado', () => {
    const spec = specFixture({
      sections: [
        specSection({ type: 'hero', variant: 'centered-statement', headline: 'Titulo' }),
        specSection({ type: 'benefits', variant: 'icon-grid', headline: 'Beneficios', items: [
          { title: 'Unico', body: '', icon: 'none', image: 'none' },
        ] }),
        specSection({ type: 'footer', variant: 'simple-centered' }),
      ],
    });
    const site = build(spec);
    expect(site.model.sections.some((section) => section.type === 'benefits')).toBe(false);
    expect(site.adjustments.join(' ')).toContain('benefits');
  });

  it('a IA nao consegue escrever telefone, preco nem depoimento no site', () => {
    const spec = specFixture({
      sections: [
        specSection({ type: 'hero', variant: 'centered-statement', headline: 'Ligue 11 98888-7777 e pague R$ 99' }),
        specSection({ type: 'testimonials', variant: 'card-grid', headline: 'O que dizem' }),
        specSection({ type: 'footer', variant: 'simple-centered' }),
      ],
    });
    const site = build(spec);
    // Depoimento sem fato confirmado nao vira secao.
    expect(site.model.sections.some((section) => section.type === 'testimonials')).toBe(false);
    // O texto do hero continua sendo texto: nenhum link de telefone e criado a partir dele.
    expect(site.html).not.toContain('tel:11988887777');
  });
});
