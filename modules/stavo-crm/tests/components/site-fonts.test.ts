/**
 * Fontes dos sites gerados.
 *
 * Antes, o tema escolhia "Fraunces" ou "Sora" e o HTML nao carregava fonte
 * nenhuma: tudo caia em Georgia + fonte do sistema. Estes testes travam o
 * carregamento, a pilha de reserva e o desligamento por configuracao.
 */
import { describe, expect, it } from 'vitest';

import { assemblePlan } from '@builder/generation/assembler';
import { emptyBusinessFacts } from '@builder/generation/mock-provider';
import { convertSpecToPlan } from '@builder/generation/spec-to-plan';
import { aliasCandidates } from '@builder/generation/image-candidates';
import type { GenerateSitePlanInput } from '@builder/generation/provider';
import { SITE_FONTS } from '@builder/generation/site-spec';
import { FONT_SPECS, fontLinkTags, fontStack } from '@site-kit/themes/fonts';
import { renderSite } from '@site-kit/renderer/render-site';
import { specFixture } from '@tests/fixtures/site-spec';

const input: GenerateSitePlanInput = {
  business: emptyBusinessFacts('Clinica Aurora'),
  siteType: 'ONE_PAGE',
  objective: { goal: 'APPOINTMENTS' },
  style: { theme: 'AI_DECIDES', keywords: [], density: 'BALANCED', motionLevel: 'BALANCED' },
  creativeSeed: 'seed-1',
};

function html(fontSource: 'google' | 'none' = 'google'): string {
  const { plan, imageBindings } = convertSpecToPlan(specFixture(), input, aliasCandidates([]));
  const { model } = assemblePlan({
    plan,
    business: input.business,
    siteType: 'ONE_PAGE',
    creativeSeed: 'seed-1',
    promptVersion: '2.0.0',
    imageBindings,
  });
  return renderSite(model, { profile: 'DEMO', resolveAsset: () => null, fontSource });
}

describe('catalogo de fontes', () => {
  it('toda fonte que a IA pode escolher sabe como ser carregada', () => {
    for (const font of SITE_FONTS) {
      expect(FONT_SPECS[font], font).toBeDefined();
    }
  });

  it('serifa cai em serifa e sans cai em sans quando a fonte nao carrega', () => {
    expect(fontStack('Fraunces')).toContain('Georgia');
    expect(fontStack('Inter')).toContain('system-ui');
    // Fonte fora do catalogo nao quebra a pagina.
    expect(fontStack('Fonte Inexistente')).toContain('system-ui');
  });

  it('monta uma unica requisicao com as familias usadas, com display=swap', () => {
    const tags = fontLinkTags(['Fraunces', 'Inter', 'Fraunces']);
    expect(tags.match(/rel="stylesheet"/g)).toHaveLength(1);
    expect(tags).toContain('family=Fraunces');
    expect(tags).toContain('family=Inter');
    expect(tags).toContain('display=swap');
    expect(tags).toContain('preconnect');
  });

  it('nome fora do catalogo nunca entra na URL', () => {
    const tags = fontLinkTags(['Inter', '"><script>alert(1)</script>']);
    expect(tags).not.toContain('script');
    expect(tags).toContain('family=Inter');
  });
});

describe('o site carrega a fonte escolhida', () => {
  it('o HTML pede as fontes do tema', () => {
    const page = html();
    expect(page).toContain('fonts.googleapis.com/css2');
    expect(page).toContain('family=Fraunces');
    expect(page).toContain('family=Inter');
  });

  it('a fonte tambem aparece na variavel de CSS, com reserva', () => {
    const page = html();
    expect(page).toContain("--font-heading:'Fraunces',Georgia");
    expect(page).toContain("--font-body:'Inter',system-ui");
  });

  it('com SITE_FONTS_SOURCE=none, nenhuma requisicao externa e feita', () => {
    const page = html('none');
    expect(page).not.toContain('fonts.googleapis.com');
    expect(page).not.toContain('fonts.gstatic.com');
    // O texto continua legivel na pilha do sistema.
    expect(page).toContain("--font-heading:'Fraunces',Georgia");
  });
});
