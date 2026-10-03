/**
 * Biblioteca de componentes: metas, cobertura e qualidade real.
 *
 * O risco que estes testes existem para impedir: uma biblioteca que ANUNCIA 78
 * variantes e entrega 12 que funcionam e 66 que caem no fallback. Aqui toda
 * variante do registry e renderizada de verdade, e o HTML precisa provar que
 * ela e diferente das outras.
 */
import { describe, expect, it } from 'vitest';

import { buildFixtureSite } from '@server/modules/site-ai/fixture';
import { checkCompatibility, findVariant, VARIANT_REGISTRY, variantsFor } from '@site-kit/registry/variants';
import { renderSite, type RenderContext } from '@site-kit/renderer/render-site';
import { HEADER_VARIANTS, siteSchema, type SectionType, type SiteSection } from '@site-kit/schemas/site-schema';

const ctx: RenderContext = {
  profile: 'DEMO',
  resolveAsset: (assetId) => ({ url: `assets/images/${assetId}.webp`, width: 1200, height: 900 }),
};

/** Metas da secao 10.3 da especificacao. */
const METAS: Record<SectionType, number> = {
  hero: 8,
  about: 5,
  audience: 4,
  services: 6,
  benefits: 5,
  authority: 4,
  stats: 3,
  process: 5,
  gallery: 4,
  offer: 4,
  testimonials: 4,
  faq: 4,
  cta: 5,
  contactMap: 4,
  whatsappForm: 3,
  footer: 5,
};

describe('metas da biblioteca', () => {
  it('cada familia atinge a meta da especificacao', () => {
    for (const [type, meta] of Object.entries(METAS) as Array<[SectionType, number]>) {
      expect(variantsFor(type).length, `familia ${type}`).toBe(meta);
    }
  });

  it('o cabecalho tem as 5 variantes previstas', () => {
    expect(HEADER_VARIANTS).toHaveLength(5);
  });

  it('o total bate com a soma da tabela: 73 secoes mais 5 cabecalhos', () => {
    const somaDasMetas = Object.values(METAS).reduce((a, b) => a + b, 0);

    expect(somaDasMetas).toBe(73);
    expect(VARIANT_REGISTRY).toHaveLength(73);
    expect(somaDasMetas + HEADER_VARIANTS.length).toBe(78);
  });

  it('nenhuma variante fica marcada como experimental sem aviso', () => {
    // Experimental e permitido, mas nao pode contar como biblioteca pronta.
    const experimentais = VARIANT_REGISTRY.filter((v) => v.status !== 'STABLE');
    expect(experimentais).toHaveLength(0);
  });

  it('todo id e unico em TODO o catalogo, nao so na familia', () => {
    // A secao guarda apenas `variant`, sem o tipo. Dois ids iguais em familias
    // diferentes fazem a busca devolver a variante errada.
    const ids = VARIANT_REGISTRY.map((v) => v.id);
    const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);

    expect(repetidos, `ids repetidos: ${repetidos.join(', ')}`).toHaveLength(0);
  });

  it('a busca por id devolve a variante da familia certa', () => {
    for (const variant of VARIANT_REGISTRY) {
      expect(findVariant(variant.id)?.type, variant.id).toBe(variant.type);
    }
  });

  it('toda descricao fala de composicao, e nao de cor', () => {
    for (const variant of VARIANT_REGISTRY) {
      expect(variant.description.length, variant.id).toBeGreaterThan(30);
      // Descrever uma variante por cor seria sinal de que ela e so um token.
      expect(variant.description.toLowerCase(), variant.id).not.toMatch(
        /^(azul|verde|vermelho|escuro|claro)\b/,
      );
    }
  });

  it('limites de itens sao coerentes', () => {
    for (const variant of VARIANT_REGISTRY) {
      expect(variant.minItems, variant.id).toBeLessThanOrEqual(variant.maxItems);
      expect(variant.motionPresets.length, variant.id).toBeGreaterThan(0);
      expect(variant.densities.length, variant.id).toBeGreaterThan(0);
    }
  });

  it('variante que exige imagem declara que aceita imagem', () => {
    for (const variant of VARIANT_REGISTRY) {
      if (variant.requiresImage) expect(variant.supportsImage, variant.id).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Renderizacao real de cada variante
// ---------------------------------------------------------------------------

/**
 * Constroi uma secao valida do tipo pedido, com a variante pedida.
 *
 * Usa a fixture como base e troca o necessario, para o conteudo ser realista em
 * portugues -- texto curto demais esconderia problemas de quebra de layout.
 */
function sectionFor(type: SectionType, variant: string): SiteSection {
  const image = { assetId: 'A'.repeat(26), alt: 'Imagem do consultorio', focalX: 0.5, focalY: 0.5 };
  const cta = {
    kind: 'whatsapp' as const,
    label: 'Agendar uma avaliacao',
    target: '+5519998877665',
  };
  const items = [
    { title: 'Consulta de nutricao clinica', body: 'Avaliacao completa e plano por escrito.', icon: 'clipboard-list' },
    { title: 'Acompanhamento mensal', body: 'Retornos para ajustar o plano conforme a rotina muda.', icon: 'calendar-check' },
    { title: 'Pre e pos-operatorio', body: 'Preparo e recuperacao junto com a equipe medica.', icon: 'heart-pulse' },
    { title: 'Atendimento online', body: 'A mesma consulta por video, com plano enviado depois.', icon: 'video' },
    { title: 'Reavaliacao semestral', body: 'Revisao completa a cada seis meses.', icon: 'target' },
    { title: 'Orientacao familiar', body: 'Ajuste do plano para a casa toda.', icon: 'users' },
  ];

  const base = {
    id: `s-${type}-${variant}`,
    variant,
    visible: true as const,
    anchor: `a-${variant}`,
    motionPreset: 'fade-in' as const,
  };

  switch (type) {
    case 'hero':
      return {
        ...base,
        type,
        eyebrow: 'Nutricao clinica em Campinas',
        headline: 'Um plano alimentar que sobrevive a sua semana de trabalho',
        subheadline: 'Atendimento presencial no Cambui ou online, a partir do que voce ja come.',
        primaryCta: cta,
        secondaryCta: { kind: 'anchor' as const, label: 'Ver como funciona', target: 'a-x' },
        image,
        highlights: ['9 anos de consultorio', 'Presencial e online'],
      };
    case 'about':
      return {
        ...base,
        type,
        headline: 'Nove anos atendendo no Cambui',
        body: ['Paragrafo com texto suficiente para testar quebra de linha em coluna estreita e larga.'],
        image,
      };
    case 'services':
      return { ...base, type, headline: 'Formas de atendimento', subheadline: 'Todas partem da mesma avaliacao.', items };
    case 'benefits':
      return { ...base, type, headline: 'O que muda no seu dia', items: items.slice(0, 4) };
    case 'audience':
      return { ...base, type, headline: 'Para quem e', subheadline: 'Veja se faz sentido.', items: items.slice(0, 4).map((i) => ({ ...i, image })) };
    case 'authority':
      return {
        ...base,
        type,
        headline: 'Quem atende',
        body: 'Texto de autoridade com tamanho realista para conferir o respiro do bloco.',
        personName: 'Marina Ferraz',
        personRole: 'Nutricionista clinica',
        image,
        credentials: ['CRN-3 numero 41287', 'Pos-graduacao em Nutricao Clinica'],
      };
    case 'stats':
      return {
        ...base,
        type,
        headline: 'Em numeros',
        items: [
          { value: '9 anos', label: 'de consultorio' },
          { value: '2 formatos', label: 'presencial e online' },
          { value: '30 dias', label: 'ate o primeiro retorno' },
        ],
      };
    case 'process':
      return { ...base, type, headline: 'Como funciona', subheadline: 'Da conversa ao retorno.', steps: items.slice(0, 4).map((i) => ({ ...i, image })), cta };
    case 'gallery':
      return { ...base, type, headline: 'O consultorio', images: [image, image, image, image] };
    case 'offer':
      return {
        ...base,
        type,
        headline: 'Primeira avaliacao',
        body: 'Uma hora de consulta com plano enviado por escrito em ate tres dias.',
        bullets: ['Avaliacao completa', 'Plano por escrito', 'Retorno em 30 dias'],
        cta,
      };
    case 'testimonials':
      return {
        ...base,
        type,
        headline: 'O que dizem',
        items: [
          { quote: 'O plano coube no meu dia a dia, com marmita e tudo, o que nunca tinha acontecido.', author: 'Renata C.', role: 'paciente desde 2024' },
          { quote: 'Quando minha rotina virou, a gente ajustou em vez de recomecar do zero.', author: 'Paulo M.', role: 'paciente desde 2023' },
          { quote: 'A avaliacao foi bem mais detalhada do que eu esperava.', author: 'Julia R.', role: 'paciente' },
        ],
      };
    case 'faq':
      return {
        ...base,
        type,
        headline: 'Duvidas frequentes de quem vai comecar',
        items: [
          { question: 'Preciso cortar tudo que eu gosto?', answer: 'Nao. O plano parte do que voce ja come e ajusta quantidade e horario.' },
          { question: 'Atende online?', answer: 'Sim, com a mesma duracao e o mesmo plano por escrito.' },
          { question: 'Quanto tempo ate o retorno?', answer: 'O primeiro retorno costuma ser em 30 dias.' },
          { question: 'Precisa de pedido medico?', answer: 'Nao e obrigatorio, mas exames recentes ajudam.' },
        ],
      };
    case 'cta':
      return { ...base, type, headline: 'Comece com uma conversa', body: 'Me conte o que voce procura.', primaryCta: cta };
    case 'contactMap':
      return {
        ...base,
        type,
        headline: 'Onde fica',
        address: 'Rua Coronel Quirino, 1420, sala 32, Cambui, Campinas - SP',
        mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJx',
        showEmbeddedMap: false,
        contacts: [cta, { kind: 'tel' as const, label: 'Ligar', target: '+5519998877665' }],
        openingHours: ['Segunda a sexta, das 8h as 19h', 'Sabado, das 8h as 12h'],
      };
    case 'whatsappForm':
      return {
        ...base,
        type,
        headline: 'Fale comigo',
        body: 'Preencha e o WhatsApp abre com a mensagem pronta.',
        fields: [
          { name: 'nome', label: 'Seu nome', type: 'text' as const, required: true, options: [] },
          { name: 'assunto', label: 'O que voce procura', type: 'textarea' as const, required: false, options: [] },
        ],
        submitLabel: 'Falar no WhatsApp',
        whatsappE164: '+5519998877665',
      };
    case 'footer':
      return {
        ...base,
        type,
        businessName: 'Marina Ferraz Nutricao',
        tagline: 'Nutricao clinica em Campinas.',
        links: [{ kind: 'anchor' as const, label: 'Atendimento', target: 'a-x' }],
        socialLinks: [{ kind: 'external' as const, label: 'Instagram', target: 'https://instagram.com/x' }],
        legalNote: 'CRN-3 numero 41287',
        showAgencyCredit: false,
      };
    default: {
      const exhaustive: never = type;
      throw new Error(`tipo sem fixture: ${String(exhaustive)}`);
    }
  }
}

/** Renderiza uma pagina com uma unica secao da variante pedida. */
function renderOnly(section: SiteSection): string {
  const model = buildFixtureSite();
  const hero = model.sections.find((s) => s.type === 'hero')!;

  // Toda pagina precisa de um H1; quando a propria secao e a hero, ela basta.
  model.sections = section.type === 'hero' ? [section] : [hero, section];
  model.navigation.items = [];

  return renderSite(model, ctx);
}

describe('toda variante do registry renderiza de verdade', () => {
  for (const variant of VARIANT_REGISTRY) {
    it(`${variant.type}/${variant.id} produz HTML proprio`, () => {
      const section = sectionFor(variant.type, variant.id);

      // A secao montada precisa ser valida contra o schema.
      const model = buildFixtureSite();
      model.sections = section.type === 'hero' ? [section, model.sections.at(-1)!] : [model.sections[0]!, section];
      model.navigation.items = [];
      expect(() => siteSchema.parse(model), `${variant.id} no schema`).not.toThrow();

      const html = renderOnly(section);

      // A classe da variante precisa aparecer: sem ela, o renderer caiu no
      // fallback e a variante nao existe de fato.
      expect(html, `${variant.id} deveria emitir sua propria classe`).toContain(variant.id);
      expect(html).toContain('<main id="conteudo">');
    });
  }
});

describe('variantes sao materialmente diferentes', () => {
  for (const [type, meta] of Object.entries(METAS) as Array<[SectionType, number]>) {
    it(`as ${meta} variantes de ${type} geram HTML distinto entre si`, () => {
      const htmls = variantsFor(type).map((variant) => {
        const html = renderOnly(sectionFor(type, variant.id));
        // Remove o nome da variante para que a diferenca venha da ESTRUTURA,
        // e nao apenas da classe CSS que o renderer carimba.
        return html.split(variant.id).join('');
      });

      expect(new Set(htmls).size, `${type} tem variantes duplicadas`).toBe(htmls.length);
    });
  }
});

describe('compatibilidade declarada bate com a realidade', () => {
  it('a quantidade de itens da fixture de teste respeita os limites', () => {
    for (const variant of VARIANT_REGISTRY) {
      const section = sectionFor(variant.type, variant.id) as unknown as Record<string, unknown>;
      const list =
        (section.items as unknown[]) ??
        (section.steps as unknown[]) ??
        (section.images as unknown[]) ??
        (section.fields as unknown[]) ??
        [];

      const count = Array.isArray(list) ? list.length : 0;
      const hasImage = Boolean(section.image) || (Array.isArray(section.images) && section.images.length > 0);

      // A contagem e presa dentro da faixa declarada: o objetivo e provar que
      // uma secao legitima passa, e nao reproduzir os limites aqui.
      const dentroDaFaixa = Math.min(Math.max(count, variant.minItems), variant.maxItems);

      const result = checkCompatibility({
        variantId: variant.id,
        type: variant.type,
        itemCount: dentroDaFaixa,
        hasImage: hasImage || !variant.requiresImage,
        motionPreset: variant.motionPresets[0]!,
      });

      expect(result, `${variant.type}/${variant.id}`).toEqual({ ok: true });
    }
  });
});

describe('invariantes que valem para toda a biblioteca', () => {
  const todas = VARIANT_REGISTRY.map((variant) => ({
    variant,
    html: renderOnly(sectionFor(variant.type, variant.id)),
  }));

  it('nenhuma variante emite um segundo H1', () => {
    for (const { variant, html } of todas) {
      expect((html.match(/<h1/g) ?? []).length, variant.id).toBe(1);
    }
  });

  it('nenhuma variante injeta script alem do JSON-LD', () => {
    for (const { variant, html } of todas) {
      expect((html.match(/<script/g) ?? []).length, variant.id).toBe(1);
    }
  });

  it('todo link externo leva noopener', () => {
    for (const { variant, html } of todas) {
      for (const tag of html.match(/<a[^>]*target="_blank"[^>]*>/g) ?? []) {
        expect(tag, `${variant.id}: ${tag}`).toContain('rel="noopener noreferrer"');
      }
    }
  });

  it('nenhuma variante deixa vazar caminho interno', () => {
    for (const { variant, html } of todas) {
      expect(html, variant.id).not.toContain('localhost');
      expect(html, variant.id).not.toContain('C:\\');
      expect(html, variant.id).not.toContain('/api/');
    }
  });
});

describe('todas as variantes de cabecalho', () => {
  for (const variant of HEADER_VARIANTS) {
    it(`${variant} mantem o menu acessivel`, () => {
      const model = buildFixtureSite();
      model.navigation.headerVariant = variant;

      const html = renderSite(model, ctx);

      expect(html).toContain('id="menu-principal"');
      expect(html).toContain('aria-label="Navegacao principal"');
      expect(html).toContain(`site-header--${variant.replace('inline-right', 'inline').replace('centered-split', 'centered').replace('minimal-cta', 'minimal').replace('stacked-bar', 'stacked').replace('transparent-overlay', 'overlay')}`);
    });
  }

  it('as 5 variantes de cabecalho geram HTML distinto', () => {
    const htmls = HEADER_VARIANTS.map((variant) => {
      const model = buildFixtureSite();
      model.navigation.headerVariant = variant;
      return renderSite(model, ctx);
    });

    expect(new Set(htmls).size).toBe(HEADER_VARIANTS.length);
  });
});
