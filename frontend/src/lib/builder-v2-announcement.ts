// The top announcement is not a block. Resolve explicit requests against its
// dedicated data field before dispatching block edits to the AI.
export const DEFAULT_BUILDER_ANNOUNCEMENT = "Conheça nossos serviços e entre em contato para saber mais.";

type EditableAnnouncementSite = {
  extras?: { announcement?: string; [key: string]: unknown };
};

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim();

export function referencesTopAnnouncement(instruction: string, currentText = DEFAULT_BUILDER_ANNOUNCEMENT): boolean {
  const text = normalize(instruction);
  const explicit = /\b(?:tarja|faixa|barra (?:verde|superior|do topo|de avisos)|aviso (?:superior|do topo|de cima)|banner (?:superior|do topo)|(?:texto|mensagem) (?:do|no) topo)\b/.test(text);
  if (explicit) return true;
  // Users often quote only the beginning of the visible announcement.
  // Never mistake a named hero CTA for the announcement.
  if (/\b(?:botao|cta|titulo|subtitulo|logo|logotipo|marca)\b/.test(text)) return false;
  const firstWords = normalize(currentText).split(/\s+/).slice(0, 3).join(" ");
  return firstWords.length >= 15 && text.includes(firstWords);
}

export function applyAnnouncementTextInstruction<T extends EditableAnnouncementSite>(site: T, instruction: string): {site: T; summary: string} | {error: string} | null {
  const text = normalize(instruction);
  if (!referencesTopAnnouncement(instruction, site.extras?.announcement)) return null;
  if (!/\b(?:troque|trocar|mude|mudar|altere|alterar|substitua|substituir|atualize|atualizar|coloque|escreva|defina|modifique|modificar)\b/.test(text)) return null;
  // Compound instructions must go through the patch editor, which can target
  // both regular blocks and this separate field transactionally.
  if (/\be (?:tambem )?(?:troque|mude|altere|substitua|atualize|coloque|modifique|remova|adicione)\b/.test(text)) return null;
  let nextText = instruction.match(/[\s\S]*\b(?:para|por)\s+([\s\S]+)$/i)?.[1];
  if (!nextText) nextText = instruction.match(/^(?:coloque|escreva|defina)\s+(?:o\s+texto\s+)?(.+?)\s+(?:na|no|em)\s+(?:tarja|faixa|barra|aviso)\b/i)?.[1];
  if (!nextText) return {error: "Informe o novo texto da tarja superior. Nenhum outro elemento foi alterado."};
  nextText = nextText.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").replace(/\s+/g, " ").trim();
  if (!nextText || nextText.length > 300) return {error: "O texto da tarja deve ter de 1 a 300 caracteres. Nenhuma alteração foi aplicada."};
  return {
    site: {...site, extras: {...site.extras, announcement: nextText}} as T,
    summary: 'Texto da tarja superior atualizado para "' + nextText + '". Botões, títulos e demais elementos preservados.',
  };
}
