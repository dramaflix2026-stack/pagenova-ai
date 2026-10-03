/**
 * Contraste e ajuste de cor.
 *
 * O contraste nao e preferencia estetica: um texto abaixo de WCAG AA e
 * ilegivel para parte real dos visitantes e derruba a nota de acessibilidade
 * do site entregue. Por isso a checagem e determinstica e bloqueia publicacao,
 * em vez de virar opiniao da IA.
 *
 * Formulas conforme WCAG 2.1 (luminancia relativa e razao de contraste).
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const value = Number.parseInt(match[1]!, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${((clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).padStart(6, '0')}`;
}

/**
 * Luminancia relativa.
 *
 * A linearizacao (o `Math.pow(x, 2.4)`) existe porque o olho nao percebe
 * brilho de forma linear; usar o valor bruto do canal daria um contraste
 * plausivel no papel e ruim na tela.
 */
export function relativeLuminance(color: Rgb): number {
  const channel = (raw: number): number => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

/** Razao de contraste entre duas cores. Vai de 1 (identicas) a 21. */
export function contrastRatio(foreground: string, background: string): number {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  if (!fg || !bg) return 0;

  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/** Texto normal precisa de 4.5:1; texto grande, de 3:1. */
export const AA_NORMAL = 4.5;
export const AA_LARGE = 3;

export const meetsAA = (foreground: string, background: string, large = false): boolean =>
  contrastRatio(foreground, background) >= (large ? AA_LARGE : AA_NORMAL);

/** As cinco cores que compoem o SiteSchema. Import por tipo, nao por valor. */
export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
}

export interface ContrastPair {
  fg: string;
  bg: string;
  label: string;
  /**
   * Caminho no schema para o EDITOR apontar -- nao necessariamente o campo
   * cujo VALOR e `fg`. No par texto-sobre-cartao, por exemplo, o path aponta
   * para `surface` (para nao repetir o path do par texto-sobre-fundo), mas
   * quem carrega o valor de `fg` continua sendo `text`. Use `fgKey` quando
   * precisar saber qual campo AJUSTAR, nunca derive isso do path.
   */
  path: string;
  /** Campo de `ThemeColors` que corresponde ao valor de `fg`. */
  fgKey: keyof ThemeColors;
  large?: boolean;
}

/**
 * Os pares de contraste que todo tema precisa respeitar.
 *
 * Definidos em UM lugar so e consumidos tanto pelo linter (que bloqueia
 * publicacao) quanto pelo assembler da IA (que ajusta a cor antes de o linter
 * rodar). Duas listas separadas divergiriam com o tempo: o assembler passaria
 * a corrigir um par que o linter nao checa mais, ou vice-versa.
 */
export function themeContrastPairs(colors: ThemeColors): ContrastPair[] {
  return [
    {
      fg: colors.text,
      bg: colors.background,
      label: 'texto sobre o fundo',
      path: 'theme.colors.text',
      fgKey: 'text',
    },
    {
      fg: colors.text,
      bg: colors.surface,
      label: 'texto sobre os cartoes',
      // O path aponta para 'surface' so para o editor ter um localizador
      // proprio; o campo que carrega `fg` continua sendo 'text' (fgKey).
      path: 'theme.colors.surface',
      fgKey: 'text',
    },
    {
      fg: colors.primaryForeground,
      bg: colors.primary,
      label: 'texto do botao principal',
      path: 'theme.colors.primaryForeground',
      fgKey: 'primaryForeground',
    },
    {
      fg: colors.accentForeground,
      bg: colors.accent,
      label: 'texto sobre o destaque',
      path: 'theme.colors.accentForeground',
      fgKey: 'accentForeground',
    },
    {
      fg: colors.muted,
      bg: colors.background,
      label: 'texto secundario',
      path: 'theme.colors.muted',
      fgKey: 'muted',
      large: true,
    },
  ];
}

/**
 * Aproxima uma cor do preto ou do branco ate atingir o contraste exigido.
 *
 * Usado quando o administrador escolhe uma cor de marca que nao contrasta com
 * o fundo. A intencao dele e preservada -- o matiz continua o mesmo, so a
 * luminosidade muda -- em vez de trocarmos a cor por outra qualquer.
 *
 * Devolve `null` quando nem o preto nem o branco resolvem, o que so acontece
 * com um fundo intermediario; nesse caso quem decide e a pessoa.
 */
export function adjustForContrast(
  color: string,
  background: string,
  target = AA_NORMAL,
): string | null {
  if (contrastRatio(color, background) >= target) return color;

  const rgb = hexToRgb(color);
  const bg = hexToRgb(background);
  if (!rgb || !bg) return null;

  // Fundo claro pede texto mais escuro, e vice-versa.
  const towardsBlack = relativeLuminance(bg) > 0.5;
  const anchor: Rgb = towardsBlack ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };

  // Busca binaria na mistura: 30 passos dao precisao muito abaixo de 1/255.
  let low = 0;
  let high = 1;
  let best: string | null = null;

  for (let i = 0; i < 30; i += 1) {
    const mid = (low + high) / 2;
    const candidate = rgbToHex({
      r: rgb.r + (anchor.r - rgb.r) * mid,
      g: rgb.g + (anchor.g - rgb.g) * mid,
      b: rgb.b + (anchor.b - rgb.b) * mid,
    });

    if (contrastRatio(candidate, background) >= target) {
      best = candidate;
      high = mid;
    } else {
      low = mid;
    }
  }

  return best;
}
