/**
 * Registro dos temas: o unico lugar que sabe quais existem.
 *
 * Busca por id nunca lanca em tempo de execucao. Um projeto salvo com um tema
 * que foi removido continua abrindo -- cai no tema padrao e registra o
 * problema no retorno, em vez de derrubar a pagina do cliente.
 */
import { THEME_PRESETS } from '@site-kit/themes/presets';
import { themeId, type ThemeId } from '@site-kit/types/theme';
import type { ThemePreset } from '@site-kit/themes/tokens';

const BY_ID = new Map<string, ThemePreset>(THEME_PRESETS.map((preset) => [preset.id, preset]));

/** Ids disponiveis, na ordem em que aparecem para quem escolhe. */
export const THEME_IDS: readonly ThemeId[] = THEME_PRESETS.map((preset) => themeId(preset.id));

/** Tema usado quando nenhum foi escolhido ou o escolhido nao existe mais. */
export const DEFAULT_THEME_ID: ThemeId = themeId('corporate-trust');

export const findTheme = (id: string): ThemePreset | null => BY_ID.get(id) ?? null;

/** Busca que sempre devolve um tema utilizavel. */
export function themeOrDefault(id: string | null | undefined): ThemePreset {
  return (id ? findTheme(id) : null) ?? findTheme(DEFAULT_THEME_ID)!;
}

/** Lista curta para a tela de escolha: id, nome, descricao e modo. */
export const themeOptions = (): Array<Pick<ThemePreset, 'id' | 'name' | 'description' | 'mode'>> =>
  THEME_PRESETS.map(({ id, name, description, mode }) => ({ id, name, description, mode }));

export { THEME_PRESETS };
