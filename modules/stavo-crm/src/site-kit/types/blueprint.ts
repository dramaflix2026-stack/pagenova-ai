/**
 * Identidade de um blueprint: uma composicao de pagina pronta.
 *
 * Um blueprint diz QUAIS familias entram e em QUE ordem, para um objetivo
 * ("agendamento", "orcamento", "autoridade"). Ele nao carrega texto, nem cor,
 * nem HTML: e so a espinha da pagina, e serve como ponto de partida tanto para
 * a IA quanto para o editor.
 *
 * Ainda nao existe nenhum (`src/site-kit/blueprints/` esta vazio de
 * proposito). O tipo vem antes para que o primeiro blueprint nasca com forma
 * definida em vez de virar um objeto livre.
 */
import type { ComponentCategory } from './component';

export type BlueprintId = string & { readonly __brand: 'BlueprintId' };

const BLUEPRINT_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function isBlueprintId(value: string): value is BlueprintId {
  return BLUEPRINT_ID_PATTERN.test(value);
}

export function blueprintId(value: string): BlueprintId {
  if (!isBlueprintId(value)) {
    throw new Error(`Id de blueprint invalido: "${value}". Use kebab-case, ex.: "agendamento-local".`);
  }
  return value;
}

/** Uma posicao da pagina dentro do blueprint. */
export interface BlueprintSlot {
  category: ComponentCategory;
  /**
   * Sugestao de variante. Ausente = quem monta escolhe (a IA, ou a primeira
   * variante aprovada da familia).
   */
  suggestedVariant?: string;
  /** Slot que pode ser omitido quando falta fato confirmado para ele. */
  optional?: boolean;
}

export interface Blueprint {
  id: BlueprintId;
  name: string;
  /** Para que serve, em uma frase: e o que o editor mostra na escolha. */
  description: string;
  /** Objetivo do site que este blueprint atende melhor. */
  objective: string;
  /** Ordem da pagina. O primeiro slot e o hero; o ultimo, o rodape. */
  slots: readonly BlueprintSlot[];
}
