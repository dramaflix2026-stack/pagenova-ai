/**
 * Sistema de movimento: presets, runtime e degradacao.
 *
 * O risco que estes testes existem para impedir e o pior defeito possivel em
 * um site de prospecao: o cliente abre o link, o JavaScript falha ou ele usa
 * reduced-motion, e a pagina aparece em branco porque o CSS escondeu tudo
 * esperando uma animacao que nunca veio.
 */
import { describe, expect, it } from 'vitest';

import { buildFixtureSite } from '@server/modules/site-ai/fixture';
import {
  findMotionPreset,
  MOTION_PRESETS,
  MOTION_REGISTRY,
  motionForPrompt,
  presetsForLevel,
} from '@site-kit/interactions/motion';
import { renderSite, renderStyles, type RenderContext } from '@site-kit/renderer/render-site';
import { minifyRuntime, SITE_RUNTIME_JS, SITE_RUNTIME_VERSION } from '@site-kit/interactions/runtime';
import { siteSchema } from '@site-kit/schemas/site-schema';

const ctx: RenderContext = { profile: 'DEMO', resolveAsset: () => null };
const css = renderStyles(buildFixtureSite().theme);

describe('registry de movimento', () => {
  it('todo preset do schema existe no registry, e vice-versa', () => {
    const noRegistry = MOTION_REGISTRY.map((p) => p.id).sort();
    expect(noRegistry).toEqual([...MOTION_PRESETS].sort());
  });

  it('nenhum preset exige um motor de timeline externo', () => {
    // Se algum exigisse, o site publicado passaria a depender de uma
    // biblioteca de terceiros -- e o ZIP deixaria de abrir sozinho.
    for (const preset of MOTION_REGISTRY) {
      expect(preset.needsTimelineEngine, preset.id).toBe(false);
    }
  });

  it('todo preset declara os campos que a especificacao exige', () => {
    for (const preset of MOTION_REGISTRY) {
      expect(preset.description.length, preset.id).toBeGreaterThan(20);
      expect(['enter', 'scrub', 'ambient', 'global']).toContain(preset.trigger);
      expect(['same', 'reduced', 'off']).toContain(preset.mobile);
      expect(['low', 'medium', 'high']).toContain(preset.cost);
    }
  });

  it('preset caro fica desligado no celular', () => {
    for (const preset of MOTION_REGISTRY) {
      if (preset.cost === 'high') expect(preset.mobile, preset.id).toBe('off');
    }
  });

  it('todo scrub e desligado ou reduzido no celular', () => {
    for (const preset of MOTION_REGISTRY.filter((p) => p.trigger === 'scrub')) {
      expect(preset.mobile, preset.id).not.toBe('same');
    }
  });

  it('a busca por id devolve o preset certo', () => {
    for (const preset of MOTION_REGISTRY) {
      expect(findMotionPreset(preset.id)?.id).toBe(preset.id);
    }
    expect(findMotionPreset('explodir-tudo')).toBeNull();
  });
});

describe('niveis de movimento do briefing', () => {
  it('sem animacao significa nenhuma, nao uma discreta', () => {
    expect(presetsForLevel('NONE')).toEqual(['none']);
  });

  it('sutil exclui scrub, contador e qualquer coisa cara', () => {
    const sutis = presetsForLevel('SUBTLE').map((id) => findMotionPreset(id)!);

    for (const preset of sutis) {
      expect(preset.trigger, preset.id).toBe('enter');
      expect(preset.cost, preset.id).toBe('low');
    }
    expect(presetsForLevel('SUBTLE')).not.toContain('parallax-subtle');
    expect(presetsForLevel('SUBTLE')).not.toContain('counter-on-view');
  });

  it('equilibrado libera mais, mas nunca o que e caro', () => {
    const equilibrados = presetsForLevel('BALANCED');

    expect(equilibrados).toContain('counter-on-view');
    expect(equilibrados).toContain('cta-gradient-flow');
    // parallax e o unico marcado como caro.
    expect(equilibrados).not.toContain('parallax-subtle');
  });

  it('o texto para o prompt lista apenas o permitido e nao vaza codigo', () => {
    const texto = motionForPrompt('SUBTLE');

    expect(texto).toContain('fade-up-soft');
    expect(texto).not.toContain('parallax-subtle');
    expect(texto).not.toContain('requestAnimationFrame');
    expect(texto).not.toContain('gsap');
  });
});

/**
 * Quebra a folha em regras `seletor { declaracoes }`.
 *
 * A analise precisa ser por REGRA, e nao por linha: uma regra com varios
 * seletores ocupa varias linhas, e olhar linha a linha nao enxerga o `.js` que
 * abre o bloco.
 */
function regras(folha: string): Array<{ seletor: string; corpo: string }> {
  const semComentarios = folha.replace(/\/\*[\s\S]*?\*\//g, '');
  const encontradas: Array<{ seletor: string; corpo: string }> = [];

  for (const match of semComentarios.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    encontradas.push({ seletor: match[1]!.trim(), corpo: match[2]!.trim() });
  }
  return encontradas;
}

describe('CSS: nada fica escondido sem JavaScript', () => {
  it('toda regra que zera a opacidade esta atras da classe js', () => {
    const escondem = regras(css).filter((r) => /opacity:0(?![.\d])/.test(r.corpo));

    expect(escondem.length).toBeGreaterThan(0);
    for (const regra of escondem) {
      // A unica excecao aceita e um keyframe: ele so roda se houver animacao,
      // e animacao so existe quando o runtime esta vivo.
      const ehKeyframe = /^(from|to|\d+%)$/.test(regra.seletor);
      expect(regra.seletor.includes('.js') || ehKeyframe, regra.seletor).toBe(true);
    }
  });

  it('nenhuma regra recorta conteudo fora da classe js', () => {
    for (const regra of regras(css).filter((r) => r.corpo.includes('clip-path:inset'))) {
      expect(regra.seletor.includes('.js'), regra.seletor).toBe(true);
    }
  });

  it('cada preset com CSS proprio aparece na folha', () => {
    for (const id of ['text-lines-reveal', 'image-mask-reveal', 'counter-on-view', 'cta-gradient-flow', 'section-background-shift', 'parallax-subtle', 'stagger-cards', 'fade-in', 'none']) {
      expect(css, id).toContain(`[data-animate="${id}"]`);
    }
  });

  it('reduced-motion desliga clip-path, cascata e gradiente', () => {
    const bloco = css.slice(css.indexOf('@media(prefers-reduced-motion:reduce)'));

    expect(bloco).toContain('clip-path:none!important');
    expect(bloco).toContain('animation:none');
    expect(bloco).toContain('scroll-behavior:auto');
  });
});

describe('runtime', () => {
  it('e sintaticamente valido', () => {
    expect(() => new Function(SITE_RUNTIME_JS)).not.toThrow();
  });

  it('a versao minificada continua valida e preserva URL', () => {
    const minificado = minifyRuntime();

    expect(() => new Function(minificado)).not.toThrow();
    expect(minificado).toContain('https://wa.me/');
    expect(minificado).not.toContain('// ---- Menu do celular');
  });

  it('cabe folgado no orcamento de bundle', () => {
    // A meta da especificacao e 250 KB comprimidos para o JS inicial. Este
    // runtime e a unica coisa que a pagina carrega.
    expect(SITE_RUNTIME_JS.length).toBeLessThan(20 * 1024);
  });

  it('nao faz requisicao a lugar nenhum', () => {
    expect(SITE_RUNTIME_JS).not.toContain('fetch(');
    expect(SITE_RUNTIME_JS).not.toContain('XMLHttpRequest');
    expect(SITE_RUNTIME_JS).not.toContain('sendBeacon');
    expect(SITE_RUNTIME_JS).not.toContain('import(');
  });

  it('nao depende de nenhuma biblioteca externa', () => {
    for (const nome of ['gsap', 'ScrollTrigger', 'lenis', 'THREE', 'jQuery']) {
      expect(SITE_RUNTIME_JS, nome).not.toContain(nome);
    }
  });

  it('checa reduced-motion antes de ligar a classe js', () => {
    const posCheck = SITE_RUNTIME_JS.indexOf('prefers-reduced-motion');
    const posClasse = SITE_RUNTIME_JS.indexOf("root.className += ' js'");

    expect(posCheck).toBeGreaterThan(-1);
    expect(posClasse).toBeGreaterThan(posCheck);
    expect(SITE_RUNTIME_JS).toContain('if (!reduced)');
  });

  it('revela tudo quando o visitante pede menos movimento', () => {
    expect(SITE_RUNTIME_JS).toContain('revealAll');
    expect(SITE_RUNTIME_JS).toContain('if (reduced ||');
  });

  it('expoe uma limpeza para o preview do editor', () => {
    // Sem isto, cada re-render do editor deixaria observadores vivos e as
    // animacoes passariam a disparar duas, tres, dez vezes.
    expect(SITE_RUNTIME_JS).toContain('__siteRuntimeCleanup');
    expect(SITE_RUNTIME_JS).toContain('observer.disconnect()');
    expect(SITE_RUNTIME_JS).toContain('removeEventListener');
    expect(SITE_RUNTIME_JS).toContain('cancelAnimationFrame');
  });

  it('usa um unico ouvinte de scroll, agrupado por quadro', () => {
    // Varios ouvintes independentes seriam a forma mais rapida de derrubar os
    // quadros em um celular fraco.
    expect((SITE_RUNTIME_JS.match(/'scroll'/g) ?? []).length).toBe(1);
    expect(SITE_RUNTIME_JS).toContain('requestAnimationFrame');
    expect(SITE_RUNTIME_JS).toContain('{ passive: true }');
  });

  it('desliga os presets de scrub no celular', () => {
    expect(SITE_RUNTIME_JS).toContain('if (!isMobile)');
  });

  it('o contador devolve o texto original ao terminar', () => {
    // "9 anos" precisa voltar a ser "9 anos", e nao virar "9".
    expect(SITE_RUNTIME_JS).toContain('node.textContent = original');
  });

  it('a versao esta declarada', () => {
    expect(SITE_RUNTIME_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('runtime dentro da pagina', () => {
  const html = renderSite(buildFixtureSite(), { ...ctx, inlineRuntime: SITE_RUNTIME_JS });

  it('entra apenas uma vez e no fim do corpo', () => {
    expect((html.match(/__siteRuntimeCleanup/g) ?? []).length).toBe(1);
    expect(html.indexOf('__siteRuntimeCleanup')).toBeGreaterThan(html.indexOf('</main>'));
  });

  it('o conteudo continua presente mesmo ignorando o script', () => {
    const semScript = html.replace(/<script[\s\S]*?<\/script>/g, '');

    expect(semScript).toContain('Um plano alimentar que sobrevive a sua semana de trabalho');
    expect(semScript).toContain('Preciso cortar tudo que eu gosto?');
    expect(semScript).toContain('href="https://wa.me/5519998877665');
  });

  it('cada secao carrega o preset que o schema declarou', () => {
    const model = buildFixtureSite();

    for (const section of model.sections) {
      if (section.motionPreset === 'none') continue;
      expect(html, section.id).toContain(`data-animate="${section.motionPreset}"`);
    }
  });

  it('um preset invalido nem chega ao renderer', () => {
    const model = buildFixtureSite();
    (model.sections[0] as { motionPreset: string }).motionPreset = 'explodir';

    expect(() => siteSchema.parse(model)).toThrow();
  });
});
