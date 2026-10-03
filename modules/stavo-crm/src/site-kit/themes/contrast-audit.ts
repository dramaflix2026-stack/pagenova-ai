/**
 * Auditoria de contraste de um tema.
 *
 * Existe para que "o tema esta acessivel" seja uma medicao, nao uma opiniao.
 * O teste usa isto para reprovar qualquer tema fora do AA, e a documentacao
 * usa o mesmo calculo para publicar os numeros -- assim documento e produto
 * nunca discordam.
 *
 * Criterios (WCAG 2.1):
 *  - texto normal sobre o fundo em que ele aparece: 4.5:1 (1.4.3);
 *  - texto grande (titulo): 3:1 -- aqui exigimos 4.5 mesmo assim, porque o
 *    mesmo token pinta texto pequeno em outras secoes;
 *  - componente de interface e foco: 3:1 (1.4.11).
 */
import { AA_LARGE, AA_NORMAL, contrastRatio } from '@site-kit/themes/colors';
import type { ThemeTokens } from '@site-kit/themes/tokens';

export interface ContrastCheck {
  /** O que esta sendo medido, em portugues, para aparecer no relatorio. */
  label: string;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
  passes: boolean;
  /** Texto (1.4.3) ou elemento de interface (1.4.11). */
  kind: 'text' | 'ui';
}

const check = (
  label: string,
  foreground: string,
  background: string,
  required: number,
  kind: ContrastCheck['kind'],
): ContrastCheck => {
  const ratio = Number(contrastRatio(foreground, background).toFixed(2));
  return { label, foreground, background, ratio, required, passes: ratio >= required, kind };
};

/**
 * Todos os pares que precisam passar.
 *
 * O botao primario e medido contra `primary` mesmo quando o preenchimento e
 * gradiente: o gradiente vai de `primary` ate uma variacao mais clara, entao a
 * cor mais dificil para o texto e justamente `primary`.
 */
export function auditThemeContrast(tokens: ThemeTokens): ContrastCheck[] {
  const { colors } = tokens;

  return [
    check('Texto sobre o fundo', colors.foreground, colors.background, AA_NORMAL, 'text'),
    check('Texto sobre o cartao', colors.foreground, colors.surface, AA_NORMAL, 'text'),
    check('Texto de apoio sobre o fundo', colors.muted, colors.background, AA_NORMAL, 'text'),
    check('Texto de apoio sobre o cartao', colors.muted, colors.surface, AA_NORMAL, 'text'),
    check('Texto do botao primario', colors.primaryForeground, colors.primary, AA_NORMAL, 'text'),
    check('Texto sobre o secundario', colors.foreground, colors.secondary, AA_NORMAL, 'text'),
    check('Sucesso sobre o fundo', colors.success, colors.background, AA_NORMAL, 'text'),
    check('Alerta sobre o fundo', colors.warning, colors.background, AA_NORMAL, 'text'),
    check('Erro sobre o fundo', colors.error, colors.background, AA_NORMAL, 'text'),
    check('Botao primario sobre o fundo', colors.primary, colors.background, AA_LARGE, 'ui'),
    check('Anel de foco sobre o fundo', colors.ring, colors.background, AA_LARGE, 'ui'),
    check('Anel de foco sobre o cartao', colors.ring, colors.surface, AA_LARGE, 'ui'),
    check('Destaque sobre o fundo', colors.accent, colors.background, AA_LARGE, 'ui'),
    check('Borda sobre o fundo', colors.border, colors.background, 1.3, 'ui'),
  ];
}

/** Checagens reprovadas. Lista vazia significa tema aprovado. */
export const failingChecks = (tokens: ThemeTokens): ContrastCheck[] =>
  auditThemeContrast(tokens).filter((item) => !item.passes);
