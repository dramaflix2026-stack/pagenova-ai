/**
 * Identidade de um tema.
 *
 * Hoje o tema de cada site e GERADO: a IA propoe paleta e tipografia dentro
 * das faixas de `designTokensSchema`, e o assembler ajusta o contraste. Nao
 * existe biblioteca de temas prontos -- por isso a lista built-in tem um item
 * so, `auto`, que nomeia exatamente esse comportamento.
 *
 * O tipo existe desde agora porque temas nomeados ("consultorio claro",
 * "oficina escura") sao o proximo passo natural do editor, e um id inventado
 * na hora vira dado solto no banco. `ThemeId` e string marcada: so nasce por
 * `themeId()`, que valida o formato.
 */

export type ThemeId = string & { readonly __brand: 'ThemeId' };

const THEME_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function isThemeId(value: string): value is ThemeId {
  return THEME_ID_PATTERN.test(value);
}

export function themeId(value: string): ThemeId {
  if (!isThemeId(value)) {
    throw new Error(`Id de tema invalido: "${value}". Use kebab-case, ex.: "consultorio-claro".`);
  }
  return value;
}

/** Tema gerado pela IA para aquele negocio, que e o comportamento atual. */
export const AUTO_THEME_ID = 'auto' as ThemeId;

export const BUILT_IN_THEME_IDS: readonly ThemeId[] = [AUTO_THEME_ID];

/** Modo de cor do tema. Espelha `designTokensSchema.mode`. */
export const THEME_MODES = ['LIGHT', 'DARK'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];
