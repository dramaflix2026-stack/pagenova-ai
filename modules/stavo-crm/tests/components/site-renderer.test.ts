/**
 * Renderer, registry e runtime.
 *
 * O que estes testes garantem: o HTML que chega ao cliente e semantico, seguro
 * contra injecao, legivel sem JavaScript e identico nos tres destinos
 * (preview, publicacao e ZIP).
 */
import { describe, expect, it } from 'vitest';

import { buildFixtureSite } from '@server/modules/site-ai/fixture';
import { checkCompatibility, findVariant, registryForPrompt, variantsFor, VARIANT_REGISTRY } from '@site-kit/registry/variants';
import { escapeHtml, renderSite, renderStyles, type RenderContext } from '@site-kit/renderer/render-site';
import { minifyRuntime, SITE_RUNTIME_JS } from '@site-kit/interactions/runtime';
import { siteSchema } from '@site-kit/schemas/site-schema';

const ctx: RenderContext = {
  profile: 'DEMO',
  resolveAsset: (assetId) => ({ url: `assets/images/${assetId}.webp`, width: 1200, height: 800 }),
};

const render = (model = buildFixtureSite()) => renderSite(model, ctx);

describe('escape de HTML', () => {
  it('neutraliza as cinco entidades perigosas', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml(`"aspas" 'simples'`)).toBe('&quot;aspas&quot; &#39;simples&#39;');
  });

  it('trata nulo e indefinido sem imprimir "null" na pagina', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('seguranca do HTML gerado', () => {
  it('nao deixa passar script injetado pelo conteudo', () => {
    const model = buildFixtureSite();
    (model.sections[0] as { headline: string }).headline =
      '<script>fetch("https://evil.example")</script>';

    const html = renderSite(model, ctx);

    expect(html).not.toContain('<script>fetch');
    expect(html).toContain('&lt;script&gt;');
  });

  it('nao deixa quebrar um atributo com aspas', () => {
    const model = buildFixtureSite();
    (model.sections[0] as { image?: unknown }).image = {
      assetId: 'B'.repeat(26),
      alt: '" onerror="alert(1)',
      focalX: 0.5,
      focalY: 0.5,
    };

    const html = renderSite(model, ctx);
    expect(html).not.toContain('onerror="alert(1)"');
    expect(html).toContain('&quot; onerror=&quot;');
  });

  it('so tem os scripts que o renderer coloca de proposito', () => {
    const html = render();
    const scripts = html.match(/<script/g) ?? [];

    // Apenas o JSON-LD. Sem runtime injetado, nao existe outro.
    expect(scripts).toHaveLength(1);
    expect(html).toContain('application/ld+json');
  });

  it('fecha o JSON-LD contra quebra de tag', () => {
    const model = buildFixtureSite();
    model.seo.description = 'Fim </script><script>alert(1)</script>';

    const html = renderSite(model, ctx);
    expect(html).not.toContain('</script><script>alert(1)');
  });
});

describe('estrutura semantica', () => {
  it('tem exatamente um H1', () => {
    const html = render();
    expect(html.match(/<h1/g) ?? []).toHaveLength(1);
  });

  it('declara o idioma e a viewport', () => {
    const html = render();
    expect(html).toContain('<html lang="pt-BR">');
    expect(html).toContain('name="viewport"');
  });

  it('tem landmark principal e link para pular a navegacao', () => {
    const html = render();
    expect(html).toContain('<main id="conteudo">');
    expect(html).toContain('class="skip"');
  });

  it('usa <details> no FAQ, que funciona sem JavaScript', () => {
    const html = render();
    expect(html).toContain('<details class="faq-item">');
    expect(html).toContain('<summary>');
  });

  it('marca o menu com aria e controla o botao', () => {
    const html = render();
    expect(html).toContain('aria-controls="menu-principal"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Navegacao principal"');
  });
});

describe('conteudo sem JavaScript', () => {
  it('todo texto visivel esta no HTML inicial', () => {
    const model = buildFixtureSite();
    const html = renderSite(model, ctx);

    // Se o conteudo dependesse de JS, estas frases nao estariam aqui.
    expect(html).toContain('Um plano alimentar que sobrevive a sua semana de trabalho');
    expect(html).toContain('Consulta de nutricao clinica');
    expect(html).toContain('Preciso cortar tudo que eu gosto?');
  });

  it('o CSS so esconde elementos quando ha JavaScript', () => {
    const css = renderStyles(buildFixtureSite().theme);

    // A regra de opacidade zero vive atras da classe `.js`, que so e ligada
    // pelo runtime. Sem script, nada some.
    expect(css).toContain('.js [data-animate]{opacity:0');
    expect(css).not.toMatch(/^\[data-animate\]\{opacity:0/m);
  });
});

describe('links', () => {
  it('monta o wa.me a partir do telefone, com a mensagem codificada', () => {
    const html = render();
    expect(html).toContain('https://wa.me/5519998877665?text=');
  });

  it('protege todo link externo com noopener', () => {
    const html = render();
    const externos = html.match(/<a[^>]*target="_blank"[^>]*>/g) ?? [];

    expect(externos.length).toBeGreaterThan(0);
    for (const tag of externos) {
      expect(tag, tag).toContain('rel="noopener noreferrer"');
    }
  });

  it('ancora interna vira hash e nao abre em nova aba', () => {
    const html = render();
    expect(html).toContain('href="#como-funciona"');
  });
});

describe('SEO e perfil', () => {
  it('a demonstracao sai com noindex tecnico e invisivel', () => {
    const html = render();
    expect(html).toContain('content="noindex,nofollow,noarchive"');
    // Invisivel: nada na pagina diz ao cliente que e uma amostra.
    expect(html.toLowerCase()).not.toContain('demonstra');
    expect(html.toLowerCase()).not.toContain('>preview<');
  });

  it('nao emite canonical quando nao ha dominio final', () => {
    const html = render();
    expect(html).not.toContain('rel="canonical"');
  });

  it('o perfil de producao passa a permitir indexacao', () => {
    const model = buildFixtureSite();
    model.seo.noindex = false;

    const html = renderSite(model, { ...ctx, profile: 'PRODUCTION' });
    expect(html).toContain('content="index,follow"');
  });

  it('o JSON-LD nao inventa nota nem contagem de avaliacoes', () => {
    const html = render();
    expect(html).not.toContain('aggregateRating');
    expect(html).not.toContain('reviewCount');
    expect(html).toContain('"@type":"ProfessionalService"');
  });

  it('todo dado de contato do JSON-LD e exatamente o fato confirmado, nunca outro (secao 19.5: NAP)', () => {
    const model = buildFixtureSite();
    const html = renderSite(model, ctx);
    const jsonLdMatch = /<script type="application\/ld\+json">(.+?)<\/script>/.exec(html);
    const jsonLd = JSON.parse(jsonLdMatch![1]!) as Record<string, unknown>;

    expect(jsonLd.telephone).toBe(model.business.phoneE164?.value);
    expect(jsonLd.email).toBe(model.business.email?.value);
    expect((jsonLd.address as { streetAddress: string }).streetAddress).toBe(model.business.address?.value);
    expect(jsonLd.name).toBe(model.business.name);
  });

  it('nao declara telefone/email/endereco que o negocio nao confirmou', () => {
    const model = buildFixtureSite();
    model.business.phoneE164 = null;
    model.business.email = null;
    model.business.address = null;

    const html = renderSite(model, ctx);
    const jsonLdMatch = /<script type="application\/ld\+json">(.+?)<\/script>/.exec(html);
    const jsonLd = JSON.parse(jsonLdMatch![1]!) as Record<string, unknown>;

    expect(jsonLd.telephone).toBeUndefined();
    expect(jsonLd.email).toBeUndefined();
    expect(jsonLd.address).toBeUndefined();
  });
});

describe('assets', () => {
  it('a imagem ausente some sem quebrar o layout', () => {
    const model = buildFixtureSite();
    (model.sections[0] as { image?: unknown }).image = {
      assetId: 'C'.repeat(26),
      alt: 'Retrato',
      focalX: 0.5,
      focalY: 0.5,
    };

    const html = renderSite(model, { ...ctx, resolveAsset: () => null });
    expect(html).not.toContain('<img');
    expect(html).toContain('<h1');
  });

  it('aplica o ponto focal escolhido no editor', () => {
    const model = buildFixtureSite();
    (model.sections[0] as { image?: unknown }).image = {
      assetId: 'D'.repeat(26),
      alt: 'Consultorio',
      focalX: 0.25,
      focalY: 0.75,
    };

    const html = renderSite(model, ctx);
    expect(html).toContain('object-position:25.0% 75.0%');
  });

  it('resolve o caminho pelo contexto, permitindo ZIP relativo', () => {
    const model = buildFixtureSite();
    (model.sections[0] as { image?: unknown }).image = {
      assetId: 'E'.repeat(26),
      alt: 'x',
      focalX: 0.5,
      focalY: 0.5,
    };

    const html = renderSite(model, ctx);
    expect(html).toContain('src="assets/images/EEEEEEEEEEEEEEEEEEEEEEEEEE.webp"');
    expect(html).not.toContain('http://localhost');
  });
});

describe('CSS a partir dos tokens', () => {
  it('leva as cores do tema para as variaveis', () => {
    const css = renderStyles(buildFixtureSite().theme);
    expect(css).toContain('--primary:#9c4221');
    expect(css).toContain('--bg:#fbf8f4');
  });

  it('respeita prefers-reduced-motion desligando transicoes', () => {
    const css = renderStyles(buildFixtureSite().theme);
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
    expect(css).toContain('transition-duration:.001ms!important');
  });

  it('da alvo de toque de 48px nos botoes e campos', () => {
    const css = renderStyles(buildFixtureSite().theme);
    expect(css).toContain('min-height:48px');
  });

  it('impede rolagem horizontal', () => {
    const css = renderStyles(buildFixtureSite().theme);
    expect(css).toContain('overflow-x:hidden');
  });

  it('a densidade muda o respiro das secoes', () => {
    const model = buildFixtureSite();
    const arejado = renderStyles({ ...model.theme, density: 'AIRY' });
    const compacto = renderStyles({ ...model.theme, density: 'COMPACT' });

    expect(arejado).not.toBe(compacto);
  });
});

describe('determinismo: um renderer para os tres destinos', () => {
  it('a mesma entrada produz exatamente os mesmos bytes', () => {
    // E o que garante que o cliente abra o site que o administrador aprovou.
    expect(render()).toBe(render());
  });
});

describe('registry de variantes', () => {
  it('toda variante do registry e valida contra o schema quando usada', () => {
    const model = buildFixtureSite();
    for (const section of model.sections) {
      const variant = findVariant(section.variant);
      expect(variant, `${section.type}/${section.variant}`).not.toBeNull();
      expect(variant!.type).toBe(section.type);
    }
    expect(() => siteSchema.parse(model)).not.toThrow();
  });

  it('recusa variante inexistente', () => {
    const result = checkCompatibility({
      variantId: 'carrossel-3d',
      type: 'hero',
      itemCount: 0,
      hasImage: false,
      motionPreset: 'fade-in',
    });
    expect(result).toMatchObject({ ok: false, code: 'UNKNOWN_VARIANT' });
  });

  it('recusa variante de outro tipo de secao', () => {
    const result = checkCompatibility({
      variantId: 'accordion-single',
      type: 'hero',
      itemCount: 3,
      hasImage: false,
      motionPreset: 'fade-in',
    });
    expect(result).toMatchObject({ ok: false, code: 'WRONG_TYPE' });
  });

  it('recusa itens de menos e de mais', () => {
    // Uma grade de tres colunas com um item vira um cartao solitario.
    expect(
      checkCompatibility({
        variantId: 'cards-3col',
        type: 'services',
        itemCount: 1,
        hasImage: false,
        motionPreset: 'fade-in',
      }),
    ).toMatchObject({ ok: false, code: 'TOO_FEW_ITEMS' });

    expect(
      checkCompatibility({
        variantId: 'cards-3col',
        type: 'services',
        itemCount: 50,
        hasImage: false,
        motionPreset: 'fade-in',
      }),
    ).toMatchObject({ ok: false, code: 'TOO_MANY_ITEMS' });
  });

  it('recusa animacao nao testada naquela variante', () => {
    expect(
      checkCompatibility({
        variantId: 'accordion-single',
        type: 'faq',
        itemCount: 4,
        hasImage: false,
        motionPreset: 'counter-on-view',
      }),
    ).toMatchObject({ ok: false, code: 'MOTION_NOT_SUPPORTED' });
  });

  it('a representacao para o prompt nao vaza codigo de componente', () => {
    const texto = registryForPrompt();

    expect(texto).toContain('hero/editorial-split');
    expect(texto).not.toContain('<div');
    expect(texto).not.toContain('function');
    expect(texto).not.toContain('className');
  });

  it('todo tipo usado pela fixture tem ao menos uma variante ofertavel', () => {
    for (const section of buildFixtureSite().sections) {
      expect(variantsFor(section.type).length, section.type).toBeGreaterThan(0);
    }
  });

  it('nenhum id de variante se repete', () => {
    const ids = VARIANT_REGISTRY.map((v) => v.id + '/' + v.type);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/**
 * O runtime tem cobertura propria e detalhada em `site-motion.test.ts`.
 * Aqui fica apenas o que e responsabilidade do RENDERER: embutir o script
 * uma unica vez e nao deixar o conteudo depender dele.
 */
describe('runtime dentro do documento', () => {
  it('e embutido uma unica vez quando o contexto pede', () => {
    const comRuntime = renderSite(buildFixtureSite(), { ...ctx, inlineRuntime: SITE_RUNTIME_JS });

    expect((comRuntime.match(/__siteRuntimeCleanup/g) ?? []).length).toBe(1);
    expect(comRuntime.indexOf('__siteRuntimeCleanup')).toBeGreaterThan(comRuntime.indexOf('</main>'));
  });

  it('sem runtime, a pagina sai apenas com o JSON-LD', () => {
    expect((render().match(/<script/g) ?? []).length).toBe(1);
  });

  it('a minificacao continua produzindo codigo valido', () => {
    expect(() => new Function(minifyRuntime())).not.toThrow();
  });
});
