/**
 * Contrato de um tema: quais tokens existem e o que cada um significa.
 *
 * Duas regras que este arquivo sustenta:
 *
 *  1. componente nunca escreve cor. Ele usa `var(--primary)`, e quem decide o
 *     valor e o tema. Trocar de tema nao pode exigir tocar em nenhuma secao;
 *  2. o nome do token diz o PAPEL, nao a cor. `--primary` continua sendo o
 *     primario quando ele for verde, rosa ou dourado; `--rosa-queimado` seria
 *     mentira no primeiro tema que mudasse.
 *
 * As cores sao guardadas em hexadecimal porque e assim que o contraste e
 * calculado (`themes/colors.ts`) e como o schema atual ja trabalha. A emissao
 * para CSS converte para trigemeo HSL, que e o formato do Tailwind v3 usado
 * pelo CRM (`hsl(var(--primary))`) -- ver `themes/css.ts`.
 */
import type { ThemeFont } from '@site-kit/themes/fonts';

/** Papel de cada cor. Todo tema precisa definir os treze. */
export interface ThemeColorTokens {
  /** Fundo da pagina. */
  background: string;
  /** Texto principal sobre `background` e sobre `surface`. */
  foreground: string;
  /** Texto de apoio: legenda, descricao, rodape. Ainda precisa ser legivel. */
  muted: string;
  /** Cartao, caixa e faixa que sobem um nivel em relacao ao fundo. */
  surface: string;
  /** Cor de acao: botao principal, link de destaque, barra do cabecalho. */
  primary: string;
  /** Texto sobre `primary`. E o par que decide se o botao e legivel. */
  primaryForeground: string;
  /** Apoio do primario: fundo de selo, borda ativa, estado hover discreto. */
  secondary: string;
  /** Destaque pontual: numero, icone, detalhe do CTA. Nunca texto corrido. */
  accent: string;
  /** Linha de separacao e contorno de card. */
  border: string;
  /** Anel de foco do teclado. Precisa ser visivel sobre o fundo. */
  ring: string;
  success: string;
  warning: string;
  error: string;
}

export const THEME_COLOR_TOKENS = [
  'background',
  'foreground',
  'muted',
  'surface',
  'primary',
  'primaryForeground',
  'secondary',
  'accent',
  'border',
  'ring',
  'success',
  'warning',
  'error',
] as const;
export type ThemeColorToken = (typeof THEME_COLOR_TOKENS)[number];

/** Tipografia: duas familias, ambas da lista hospedada (`themes/fonts.ts`). */
export interface ThemeTypographyTokens {
  heading: ThemeFont;
  body: ThemeFont;
  /** Peso do titulo. Serifa de display costuma pedir menos peso que sans. */
  headingWeight: 400 | 500 | 600 | 700 | 800;
  /** Extremos da escala fluida do titulo, em rem. */
  headingMinRem: number;
  headingMaxRem: number;
  /** Altura de linha do titulo e do corpo. */
  lineHeightTight: number;
  lineHeightBody: number;
}

/** Forma e profundidade. */
export interface ThemeShapeTokens {
  /** Raio base em px. Os demais raios derivam dele na emissao do CSS. */
  radius: number;
  /** Sombra pronta, ja com os valores de cor embutidos. */
  shadow: string;
  /** Largura maxima do conteudo, em px. */
  container: number;
}

/** Tratamento do botao principal. */
export interface ThemeButtonTokens {
  /**
   * Preenchimento do botao primario. Gradiente ou cor chapada -- em ambos os
   * casos o texto continua sendo `primaryForeground`, entao o contraste e
   * medido contra `primary`, que e a cor mais escura do gradiente.
   */
  gradient: string;
  /** Brilho sutil sobre o botao (borda interna, realce no hover). */
  highlight: string;
}

export interface ThemeTokens {
  colors: ThemeColorTokens;
  typography: ThemeTypographyTokens;
  shape: ThemeShapeTokens;
  button: ThemeButtonTokens;
}

/** Tema nomeado, pronto para uso. */
export interface ThemePreset {
  /** Id em kebab-case. Precisa bater com a chave do registro. */
  id: string;
  name: string;
  /** Quando escolher este tema, em uma frase. */
  description: string;
  /** Claro ou escuro: decide a direcao dos ajustes automaticos. */
  mode: 'LIGHT' | 'DARK';
  tokens: ThemeTokens;
}
