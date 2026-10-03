/**
 * Sistema de temas: contrato dos tokens, contraste e emissao de CSS.
 *
 * O teste mais importante deste arquivo e o de contraste. Ele e a diferenca
 * entre "achamos que o tema esta acessivel" e "o tema esta acessivel": um
 * ajuste de cor que reprove em AA quebra a suite antes de chegar ao cliente.
 */
import { describe, expect, it } from 'vitest';

import { FONT_SPECS } from '@site-kit/themes/fonts';
import { auditThemeContrast, failingChecks } from '@site-kit/themes/contrast-audit';
import { hexToHslTriplet, themeCssVariables, themeStyleBlock } from '@site-kit/themes/css';
import { THEME_PRESETS } from '@site-kit/themes/presets';
import { DEFAULT_THEME_ID, THEME_IDS, findTheme, themeOptions, themeOrDefault } from '@site-kit/themes/registry';
import { THEME_COLOR_TOKENS } from '@site-kit/themes/tokens';
import { isThemeId } from '@site-kit/types/theme';

const ID_ESPERADOS = [
  'personal-editorial',
  'startup-modern',
  'professional-editorial',
  'corporate-trust',
  'local-vibrant',
  'local-premium-dark',
  'clinical-clean',
  'nature-organic',
];

describe('catalogo de temas', () => {
  it('tem os oito temas pedidos, com id valido e unico', () => {
    expect(THEME_PRESETS.map((t) => t.id)).toEqual(ID_ESPERADOS);
    expect(new Set(THEME_PRESETS.map((t) => t.id)).size).toBe(THEME_PRESETS.length);
    for (const id of THEME_IDS) expect(isThemeId(id), id).toBe(true);
  });

  it('todo tema define os treze tokens de cor, em hexadecimal', () => {
    for (const tema of THEME_PRESETS) {
      for (const token of THEME_COLOR_TOKENS) {
        const valor = tema.tokens.colors[token];
        expect(valor, `${tema.id}.${token}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  it('todo tema define forma, container, tipografia e botao', () => {
    for (const tema of THEME_PRESETS) {
      const { shape, typography, button } = tema.tokens;
      expect(shape.radius, tema.id).toBeGreaterThanOrEqual(0);
      expect(shape.container, tema.id).toBeGreaterThanOrEqual(1000);
      expect(shape.shadow, tema.id).toBeTruthy();
      expect(button.gradient, tema.id).toContain('gradient');
      expect(button.highlight, tema.id).toBeTruthy();
      expect(typography.headingMaxRem, tema.id).toBeGreaterThan(typography.headingMinRem);
    }
  });

  it('so usa fontes que a plataforma hospeda', () => {
    for (const tema of THEME_PRESETS) {
      expect(FONT_SPECS, `${tema.id}: titulo`).toHaveProperty(tema.tokens.typography.heading);
      expect(FONT_SPECS, `${tema.id}: corpo`).toHaveProperty(tema.tokens.typography.body);
    }
  });

  it('existe pelo menos um tema escuro e a maioria clara', () => {
    const escuros = THEME_PRESETS.filter((t) => t.mode === 'DARK');
    expect(escuros.length).toBeGreaterThanOrEqual(1);
    expect(escuros.length).toBeLessThan(THEME_PRESETS.length);
  });
});

describe('contraste WCAG AA', () => {
  it.each(THEME_PRESETS.map((tema) => [tema.id, tema] as const))(
    'tema %s passa em todos os pares medidos',
    (_id, tema) => {
      const reprovados = failingChecks(tema.tokens);
      const detalhe = reprovados
        .map((c) => `${c.label}: ${c.ratio} < ${c.required} (${c.foreground} sobre ${c.background})`)
        .join('; ');
      expect(reprovados, detalhe).toHaveLength(0);
    },
  );

  it('texto e botao principal ficam acima de 4.5:1 em todo tema', () => {
    for (const tema of THEME_PRESETS) {
      const checks = auditThemeContrast(tema.tokens);
      const texto = checks.find((c) => c.label === 'Texto sobre o fundo')!;
      const botao = checks.find((c) => c.label === 'Texto do botao primario')!;
      expect(texto.ratio, `${tema.id}: texto`).toBeGreaterThanOrEqual(4.5);
      expect(botao.ratio, `${tema.id}: botao`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('a auditoria realmente reprova um tema ruim', () => {
    // Sem isto, um medidor quebrado deixaria os testes acima verdes a toa.
    const ruim = {
      ...THEME_PRESETS[0]!.tokens,
      colors: { ...THEME_PRESETS[0]!.tokens.colors, foreground: '#CFCFCF', background: '#FFFFFF' },
    };
    expect(failingChecks(ruim).length).toBeGreaterThan(0);
  });
});

describe('emissao de CSS', () => {
  it('converte hexadecimal para o trigemeo HSL do Tailwind', () => {
    expect(hexToHslTriplet('#FFFFFF')).toBe('0 0% 100%');
    expect(hexToHslTriplet('#000000')).toBe('0 0% 0%');
    expect(hexToHslTriplet('#FF0000')).toBe('0 100% 50%');
    // Valor invalido nao quebra a pagina.
    expect(hexToHslTriplet('nao-e-cor')).toBe('0 0% 0%');
  });

  it('emite todos os tokens, com nome em kebab-case', () => {
    const css = themeCssVariables(THEME_PRESETS[0]!.tokens);

    for (const token of THEME_COLOR_TOKENS) {
      const nome = `--${token.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`;
      expect(css, nome).toContain(`${nome}: `);
    }
    for (const nome of [
      '--radius',
      '--shadow',
      '--container',
      '--font-heading',
      '--font-body',
      '--button-gradient',
      '--button-highlight',
    ]) {
      expect(css, nome).toContain(`${nome}: `);
    }
  });

  it('por padrao emite o trigemeo puro, para uso com hsl(var(--x))', () => {
    const css = themeCssVariables(THEME_PRESETS[3]!.tokens);
    expect(css).toMatch(/--primary: \d+ \d+% \d+%;/);
    expect(css).not.toContain('--primary: hsl(');
  });

  it('com wrap, entrega a cor pronta para quem nao usa Tailwind', () => {
    const css = themeCssVariables(THEME_PRESETS[3]!.tokens, { wrap: true });
    expect(css).toMatch(/--primary: hsl\(\d+ \d+% \d+%\);/);
  });

  it('o bloco de estilo isola o tema por data-theme e declara o color-scheme', () => {
    const escuro = THEME_PRESETS.find((t) => t.mode === 'DARK')!;
    const bloco = themeStyleBlock(escuro);
    expect(bloco).toContain(`[data-theme='${escuro.id}']`);
    expect(bloco).toContain('color-scheme: dark;');
  });

  it('a fonte emitida traz a pilha de reserva, nao so o nome', () => {
    const css = themeCssVariables(THEME_PRESETS[0]!.tokens);
    expect(css).toContain("--font-heading: 'Fraunces',Georgia");
  });
});

describe('registro', () => {
  it('busca por id devolve o tema certo e nulo para o que nao existe', () => {
    expect(findTheme('clinical-clean')?.name).toBe('Clinico limpo');
    expect(findTheme('tema-que-nao-existe')).toBeNull();
  });

  it('tema removido nao derruba a pagina: cai no padrao', () => {
    expect(themeOrDefault('tema-que-nao-existe').id).toBe(DEFAULT_THEME_ID);
    expect(themeOrDefault(null).id).toBe(DEFAULT_THEME_ID);
    expect(themeOrDefault('nature-organic').id).toBe('nature-organic');
  });

  it('a lista de escolha traz id, nome, descricao e modo', () => {
    for (const opcao of themeOptions()) {
      expect(opcao.id).toBeTruthy();
      expect(opcao.name).toBeTruthy();
      expect(opcao.description.length).toBeGreaterThan(20);
      expect(['LIGHT', 'DARK']).toContain(opcao.mode);
    }
  });
});
