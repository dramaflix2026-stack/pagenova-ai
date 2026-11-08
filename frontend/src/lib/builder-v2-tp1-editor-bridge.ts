/**
 * TP1 Model 03: safe, explicit bridge between accepted block edits and
 * the approved React composition. No fallback image or text is changed unless
 * an edit/asset upload explicitly targeted its block.
 *
 * This module deliberately does not touch templates 01/02, other families or
 * 3D. Structural operations and visual styles still require separate adapters.
 */
import {
  isSafeUniversalUrl,
  type UniversalBlock,
  type UniversalResult,
  type UniversalSite,
} from "./builder-v2-universal-operations.ts";

type BlockSite = Pick<UniversalSite, "blocks">;
type EditableTextType = "heading" | "paragraph" | "button";
type BlockKind = EditableTextType | "image";

const normalized = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const sections: Record<string, readonly string[]> = {
  inicio: ["inicio", "hero", "home", "capa", "principal"],
  sobre: ["sobre", "about", "conceito", "essencia", "nossa-essencia"],
  servicos: ["servicos", "services", "especialidades"],
  diferenciais: ["diferenciais", "differences", "differentials"],
  experiencia: ["experiencia", "processo", "como-funciona", "etapas"],
  galeria: ["galeria", "gallery", "portfolio"],
  faq: ["faq", "perguntas", "perguntas-frequentes", "duvidas", "duvidas-frequentes"],
  contato: ["contato", "contact"],
  trajetoria: ["trajetoria", "historia", "history"],
  rodape: ["rodape", "footer"],
};

/** The counts are actual slots rendered by TP1 Model 03, not generic promises. */
export const TP1_MODEL3_VISIBLE_SLOTS: Readonly<Record<string, Readonly<Partial<Record<BlockKind, number>>>>> =
  Object.freeze({
    inicio: Object.freeze({heading: 1, paragraph: 1, image: 1, button: 1}),
    sobre: Object.freeze({heading: 1, paragraph: 2, image: 1}),
    servicos: Object.freeze({heading: 5, paragraph: 5, image: 4}),
    diferenciais: Object.freeze({heading: 1, paragraph: 1}),
    experiencia: Object.freeze({heading: 4, paragraph: 4, image: 3}),
    galeria: Object.freeze({heading: 1, paragraph: 1, image: 6}),
    faq: Object.freeze({heading: 1, paragraph: 6}),
    contato: Object.freeze({heading: 1, paragraph: 1, image: 1}),
    trajetoria: Object.freeze({heading: 5, paragraph: 5, image: 4}),
    rodape: Object.freeze({heading: 1}),
  });

const canonicalSection = (section: string): string | null => {
  const id = normalized(section);
  return Object.keys(sections).find((key) => sections[key].some((name) => normalized(name) === id)) ?? null;
};

export function tp1Model3SectionBlock(
  site: BlockSite, section: string, type: BlockKind, index = 0,
): UniversalBlock | undefined {
  const key = canonicalSection(section);
  if (!key || !Number.isInteger(index) || index < 0) return undefined;
  return site.blocks.filter((block) =>
    block.type === type && !!block.section && canonicalSection(block.section) === key
  )[index];
}

/** null means "no explicit override"; an intentionally empty value stays empty. */
export function tp1Model3EditedText(
  site: BlockSite, section: string, type: EditableTextType, index = 0,
): string | null {
  const block = tp1Model3SectionBlock(site, section, type, index);
  return block?.textExplicit === true && typeof block.text === "string" ? block.text : null;
}

export function tp1Model3EditedImage(site: BlockSite, section: string, index = 0): string | null {
  const block = tp1Model3SectionBlock(site, section, "image", index);
  return block && (block.srcExplicit === true || block.userUploaded === true) &&
    isSafeUniversalUrl(block.src, true) ? block.src! : null;
}

/**
 * Local chat transaction guard. Detects unsupported edits BEFORE setSite,
 * undo snapshot and success message. All blocks must remain in the same order,
 * and every field that changed must have a real display slot in Model 03.
 */
export function prepareTP1Model3VisibleEdit<T extends UniversalSite>(
  previous: T, candidate: UniversalResult<T>,
): UniversalResult<T> {
  if (!candidate.ok) return candidate;
  const next = candidate.site;
  if (!Array.isArray(previous.blocks) || !Array.isArray(next.blocks)) {
    return {ok: false, error: "Estrutura de blocos inválida. O site foi preservado."};
  }
  // Model 03 section structure/style adapters are not yet installed.
  const {blocks: _old, ...priorMetadata} = previous;
  const {blocks: _new, ...nextMetadata} = next;
  if (JSON.stringify(priorMetadata) !== JSON.stringify(nextMetadata) ||
      previous.blocks.length !== next.blocks.length ||
      previous.blocks.some((block, i) => block.id !== next.blocks[i]?.id)) {
    return {ok: false, error: "Esse Modelo 3 ainda não suporta alterar a estrutura ou o estilo da seção pelo motor universal. Nenhuma alteração foi aplicada."};
  }
  const changed = new Set(candidate.changedIds);
  if (!changed.size) {
    return {ok: false, error: "Nenhum bloco visível foi alterado. O site foi preservado."};
  }
  const editedBlocks: UniversalBlock[] = [];
  let observedChanges = 0;
  for (const [i, before] of previous.blocks.entries()) {
    const after = next.blocks[i];
    if (!after || typeof after !== "object") {
      return {ok: false, error: "A edição retornou um bloco inválido. O site foi preservado."};
    }
    if (!changed.has(before.id)) {
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        return {ok: false, error: "A edição incluiu alterações fora dos blocos solicitados. O site foi preservado."};
      }
      editedBlocks.push(after);
      continue;
    }
    const section = canonicalSection(before.section || "");
    const kind = before.type as BlockKind;
    const allowedSlots = section && TP1_MODEL3_VISIBLE_SLOTS[section]?.[kind];
    const ordinal = section
      ? previous.blocks.slice(0, i).filter((block) =>
          block.type === kind && !!block.section && canonicalSection(block.section) === section
        ).length
      : -1;
    if (!section || !allowedSlots || ordinal >= allowedSlots || after.type !== before.type ||
        after.section !== before.section) {
      return {ok: false, error: "O bloco solicitado não possui um elemento editável correspondente no Modelo 3. Nenhuma alteração foi aplicada."};
    }
    const changedFields = Object.keys({...before, ...after}).filter((key) =>
      JSON.stringify(before[key]) !== JSON.stringify(after[key])
    );
    const allowedFields = kind === "image" ? ["src"] :
      kind === "button" && section === "inicio" ? ["text", "href"] :
      kind === "heading" || kind === "paragraph" ? ["text"] : [];
    if (!changedFields.length || changedFields.some((field) => !allowedFields.includes(field))) {
      return {ok: false, error: "Esse tipo de edição ainda não está ligado ao componente visual do Modelo 3. Nenhuma alteração foi aplicada."};
    }
    // The FAQ renderer can show only real question/answer pairs. Do not
    // acknowledge a paragraph rewrite that would disappear from the accordion.
    if (section === "faq" && kind === "paragraph" &&
        changedFields.includes("text") &&
        !/^[^?]{3,}\?\s*\S/.test(String(after.text || "").trim())) {
      return {ok: false, error: "Para alterar uma resposta do FAQ, informe pergunta e resposta no mesmo bloco. Nenhuma alteração foi aplicada."};
    }
    if (changedFields.includes("src") && !isSafeUniversalUrl(after.src, true)) {
      return {ok: false, error: "A URL da fotografia é inválida. Nenhuma alteração foi aplicada."};
    }
    const validated: UniversalBlock = {...after,
      ...(changedFields.includes("text") ? {textExplicit: true} : {}),
      ...(changedFields.includes("src") ? {srcExplicit: true} : {}),
      ...(changedFields.includes("href") ? {hrefExplicit: true} : {}),
    };
    editedBlocks.push(validated);
    observedChanges++;
  }
  if (observedChanges !== changed.size) {
    return {ok: false, error: "A edição contém um alvo que não é exibido nesse modelo. Nenhuma alteração foi aplicada."};
  }
  return {ok: true, site: {...next, blocks: editedBlocks} as T, changedIds: candidate.changedIds};
}
