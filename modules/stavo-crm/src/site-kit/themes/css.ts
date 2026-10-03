/**
 * Emissao dos tokens do tema como CSS.
 *
 * Formato: trigemeo HSL sem a funcao em volta (`--primary: 158 82% 26%`), que
 * e a convencao do Tailwind v3 usada pelo CRM -- `hsl(var(--primary))` no
 * `tailwind.config.ts`. Duas vantagens praticas:
 *
 *  1. o mesmo token serve com opacidade: `hsl(var(--primary) / .12)` para um
 *     fundo suave, sem precisar de uma variavel `--primary-soft`;
 *  2. o site publicado (que nao usa Tailwind) consome a mesma variavel, so
 *     que envolvendo em `hsl()` no CSS gerado.
 *
 * Quem consome fora do Tailwind tem `themeCssVariables(..., { wrap: true })`,
 * que ja entrega `--primary: hsl(158 82% 26%)`.
 */
import { hexToRgb } from '@site-kit/themes/colors';
import { fontStack } from '@site-kit/themes/fonts';
import type { ThemePreset, ThemeTokens } from '@site-kit/themes/tokens';

/** `#0B7A63` -> `166 83% 26%`. Sem a funcao `hsl()` em volta. */
export function hexToHslTriplet(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '0 0% 0%';

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

/** Nome CSS de cada token de cor: `primaryForeground` -> `--primary-foreground`. */
const cssName = (token: string): string => `--${token.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`)}`;

export interface ThemeCssOptions {
  /** `true` entrega `hsl(...)` pronto, para quem nao usa Tailwind. */
  wrap?: boolean;
  /** Indentacao de cada linha. */
  indent?: string;
}

/**
 * Linhas `--token: valor;` de um tema, na ordem: cor, forma, tipografia, botao.
 *
 * Os raios derivam de um unico `radius`: um tema define a forma, nao quatro
 * numeros soltos que podem se contradizer.
 */
export function themeCssVariables(tokens: ThemeTokens, options: ThemeCssOptions = {}): string {
  const { wrap = false, indent = '  ' } = options;
  const color = (hex: string): string => (wrap ? `hsl(${hexToHslTriplet(hex)})` : hexToHslTriplet(hex));

  const { colors, shape, typography, button } = tokens;

  const linhas: Array<[string, string]> = [
    ...Object.entries(colors).map(([token, hex]) => [cssName(token), color(hex)] as [string, string]),

    ['--radius', `${shape.radius}px`],
    ['--radius-sm', `${Math.max(0, Math.round(shape.radius * 0.4))}px`],
    ['--radius-lg', `${Math.round(shape.radius * 1.6)}px`],
    ['--radius-pill', '999px'],
    ['--shadow', shape.shadow],
    ['--container', `${shape.container}px`],

    ['--font-heading', fontStack(typography.heading)],
    ['--font-body', fontStack(typography.body)],
    ['--font-heading-weight', String(typography.headingWeight)],
    ['--font-heading-min', `${typography.headingMinRem}rem`],
    ['--font-heading-max', `${typography.headingMaxRem}rem`],
    ['--leading-tight', String(typography.lineHeightTight)],
    ['--leading-body', String(typography.lineHeightBody)],

    ['--button-gradient', button.gradient],
    ['--button-highlight', button.highlight],
  ];

  return linhas.map(([nome, valor]) => `${indent}${nome}: ${valor};`).join('\n');
}

/**
 * Bloco `:root` completo de um tema.
 *
 * `data-theme` no mesmo seletor permite trocar de tema em uma pagina que ja
 * tem outro aplicado -- util na documentacao visual e na previa do editor.
 */
export function themeStyleBlock(preset: ThemePreset, options: ThemeCssOptions = {}): string {
  return [
    `:root[data-theme='${preset.id}'], [data-theme='${preset.id}'] {`,
    `  color-scheme: ${preset.mode === 'DARK' ? 'dark' : 'light'};`,
    themeCssVariables(preset.tokens, options),
    '}',
  ].join('\n');
}
