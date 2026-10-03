/**
 * Fontes dos sites gerados.
 *
 * Problema que este arquivo resolve: o tema escolhia uma familia ("Fraunces",
 * "Sora") e o HTML nunca carregava fonte nenhuma. Toda pagina caia em Georgia
 * + fonte do sistema, e a decisao tipografica da IA nao tinha efeito visual --
 * uma das causas de "todo site parece igual".
 *
 * As familias sao carregadas do Google Fonts. A URL e montada SOMENTE a partir
 * desta lista fechada: o nome da familia nunca vem de texto livre do modelo ou
 * do usuario, entao nao existe caminho para injetar conteudo na tag `<link>`.
 *
 * Alternativa possivel, caso a dependencia externa passe a incomodar (LGPD,
 * site offline, latencia): hospedar os arquivos .woff2 no proprio servidor.
 * Basta trocar a implementacao de `fontLinkTags` -- nada mais depende disto.
 */

export type FontSource = 'google' | 'none';

interface FontSpec {
  /** Nome da familia no Google Fonts. */
  family: string;
  /** Pilha de reserva usada ate a fonte carregar (e se ela nao carregar). */
  fallback: string;
  /** Pesos pedidos ao Google. Titulo usa 400-800; corpo, 400 e 600. */
  weights: string;
}

const SANS_FALLBACK = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const SERIF_FALLBACK = "Georgia,'Times New Roman',serif";

/**
 * `satisfies` em vez de anotacao: o objeto continua checado contra FontSpec,
 * mas as CHAVES sobrevivem no tipo. E o que permite `ThemeFont` abaixo ser a
 * uniao das familias hospedadas, e nao um `string` qualquer.
 */
export const FONT_SPECS = {
  Inter: { family: 'Inter', fallback: SANS_FALLBACK, weights: '400;500;600;700' },
  Manrope: { family: 'Manrope', fallback: SANS_FALLBACK, weights: '400;500;600;700;800' },
  Sora: { family: 'Sora', fallback: SANS_FALLBACK, weights: '400;500;600;700;800' },
  'Space Grotesk': { family: 'Space Grotesk', fallback: SANS_FALLBACK, weights: '400;500;600;700' },
  'DM Sans': { family: 'DM Sans', fallback: SANS_FALLBACK, weights: '400;500;600;700' },
  'Work Sans': { family: 'Work Sans', fallback: SANS_FALLBACK, weights: '400;500;600;700;800' },
  Fraunces: { family: 'Fraunces', fallback: SERIF_FALLBACK, weights: '400;500;600;700;800' },
  'Playfair Display': { family: 'Playfair Display', fallback: SERIF_FALLBACK, weights: '400;500;600;700;800' },
  Lora: { family: 'Lora', fallback: SERIF_FALLBACK, weights: '400;500;600;700' },
  'DM Serif Display': { family: 'DM Serif Display', fallback: SERIF_FALLBACK, weights: '400' },
} satisfies Record<string, FontSpec>;

/** Familias que a plataforma hospeda. Um tema so pode escolher entre elas. */
export type ThemeFont = keyof typeof FONT_SPECS;

/** Dominios que a CSP precisa liberar para o Google Fonts funcionar. */
export const GOOGLE_FONTS_STYLE_ORIGIN = 'https://fonts.googleapis.com';
export const GOOGLE_FONTS_FILE_ORIGIN = 'https://fonts.gstatic.com';

/**
 * Familia + reserva, pronta para o CSS.
 *
 * Familia desconhecida (projeto antigo, fonte removida do catalogo) nao quebra
 * a pagina: cai na pilha do sistema.
 */
/** Busca tolerante: a familia pode vir de um projeto antigo, fora do catalogo. */
const specOf = (font: string): FontSpec | undefined =>
  (FONT_SPECS as Record<string, FontSpec | undefined>)[font];

export function fontStack(font: string): string {
  const spec = specOf(font);
  if (!spec) return SANS_FALLBACK;
  return `'${spec.family}',${spec.fallback}`;
}

/**
 * Tags `<link>` do Google Fonts para as familias usadas.
 *
 * `display=swap`: o texto aparece na fonte de reserva e troca quando a fonte
 * chega. Sem isso, o visitante ve um bloco em branco enquanto a fonte carrega.
 */
export function fontLinkTags(fonts: string[], source: FontSource = 'google'): string {
  if (source !== 'google') return '';

  const families = [...new Set(fonts)]
    .map((font) => specOf(font))
    .filter((spec): spec is FontSpec => Boolean(spec))
    .map((spec) => `family=${encodeURIComponent(spec.family).replace(/%20/g, '+')}:wght@${spec.weights}`);

  if (families.length === 0) return '';

  const href = `${GOOGLE_FONTS_STYLE_ORIGIN}/css2?${families.join('&')}&display=swap`;
  return (
    `<link rel="preconnect" href="${GOOGLE_FONTS_STYLE_ORIGIN}">` +
    `<link rel="preconnect" href="${GOOGLE_FONTS_FILE_ORIGIN}" crossorigin>` +
    `<link rel="stylesheet" href="${href}">`
  );
}
