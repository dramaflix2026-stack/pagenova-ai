"use client";


import {
  installEditorDomBridge,
  type EditorSelectedElement,
} from "@/lib/editor-dom-bridge";
import { readPageNovaProject } from "@/lib/pagenova-project-store";
import { useMemo, useState, useCallback, useRef,
  useEffect,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

type CloneProject = {
  id: string;
  sourceUrl: string;
  finalUrl: string;
  domain: string;
  title: string;
  description: string;
  favicon: string | null;

  headings: string[];
  texts: string[];

  links: Array<{
    text: string;
    href: string;
  }>;

  images: Array<{
    src: string;
    alt: string;
  }>;

  sections: unknown[];

  visualHtml: string;
  visualBodyHtml: string;
  visualHeadHtml: string;

  fetchedAt: string;
};

type Viewport =
  | "desktop"
  | "tablet"
  | "mobile";

const viewportWidths: Record<
  Viewport,
  string
> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

async function readProject(
  projectId: string
): Promise<CloneProject | null> {
  if (
    typeof window === "undefined" ||
    !projectId
  ) {
    return null;
  }

  // PAGENOVA_V7_9I_6C_INDEXEDDB_READ
  try {
    const indexedProject =
      await readPageNovaProject<CloneProject>(projectId);

    if (indexedProject) {
      return indexedProject;
    }
  } catch (error) {
    console.warn(
      "[PageNova] IndexedDB project read failed.",
      error,
    );
  }

  // Legacy compatibility.
  const savedRaw =
    window.sessionStorage.getItem(
      `lp-clone-project:${projectId}`
    );

  const tempRaw =
    window.sessionStorage.getItem(
      `lp-clone-temp:${projectId}`
    );

  const raw = savedRaw ?? tempRaw;

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CloneProject;
  } catch {
    return null;
  }
}
export default function EditorPage() {
  // V4A_INTERACTIVE_DOM_BRIDGE
  const editorIframeRef =
    useRef<HTMLIFrameElement | null>(null);

  const editorBridgeCleanupRef =
    useRef<(() => void) | null>(null);

  const [selectedElement, setSelectedElement] =
    useState<EditorSelectedElement | null>(null);

  // V4B_1_REAL_TEXT_EDITING_FINAL
  const [editingText, setEditingText] =
    useState("");

  const [textEditStatus, setTextEditStatus] =
    useState<string | null>(null);
  // V4B_1_2U_STYLE_SEGMENT_SNAPSHOT
  // Snapshot of the original text-node distribution.
  // It is captured only when Carregar is pressed.
  const textStyleSnapshotRef =
    useRef<{
      selector: string;
      lengths: number[];
    } | null>(null);

  // V4B_2_CONTEXTUAL_EDITING
  const [editingImageSrc, setEditingImageSrc] =
    useState("");

  const [editingLinkHref, setEditingLinkHref] =
    useState("");

  const [contextEditStatus, setContextEditStatus] =
    useState<string | null>(null);

  const handleEditorIframeLoad =
    useCallback(() => {
      editorBridgeCleanupRef.current?.();

      const iframe =
        editorIframeRef.current;

      if (!iframe) {
        return;
      }

      editorBridgeCleanupRef.current =
        installEditorDomBridge(
          iframe,
          setSelectedElement
        );
    }, []);
  // V4B_1_2R_2_CALLBACK_ORDER
  // DOM resolver must be declared before text callbacks.
const getSelectedDomElement =
    useCallback((): Element | null => {
      if (!selectedElement) {
        return null;
      }

      const document =
        editorIframeRef.current
          ?.contentDocument;

      if (!document) {
        return null;
      }

      // V4B_1_2H_DIRECT_DOM_TARGET
      const directTarget =
        (document as Document & {
          __lpStudioSelectedElement?: HTMLElement;
        }).__lpStudioSelectedElement;

      if (
        directTarget &&
        directTarget.ownerDocument === document &&
        directTarget.isConnected
      ) {
        return directTarget;
      }

      try {
        return document.querySelector(
          selectedElement.selector
        );
      } catch {
        return null;
      }
    }, [selectedElement]);

  const loadSelectedText =
    useCallback(() => {
      if (!selectedElement) {
        setTextEditStatus(
          "Selecione um elemento primeiro."
        );
        return;
      }

      const document =
        editorIframeRef.current
          ?.contentDocument;

      if (!document) {
        setTextEditStatus(
          "Preview indisponível."
        );
        return;
      }

      // V4B_1_2Q_WHOLE_BLOCK_TEXT
      const directTarget =
        (document as Document & {
          __lpStudioSelectedElement?: HTMLElement;
        }).__lpStudioSelectedElement;

      let target: Element | null =
        directTarget?.isConnected
          ? directTarget
          : null;

      if (!target) {
        try {
          target =
            document.querySelector(
              selectedElement.selector
            );
        } catch {
          target = null;
        }
      }

      if (!target) {
        setTextEditStatus(
          "Elemento não encontrado."
        );
        return;
      }

      const blockedTags =
        new Set([
          "IMG",
          "VIDEO",
          "AUDIO",
          "INPUT",
          "TEXTAREA",
          "SELECT",
          "SVG",
          "IFRAME",
          "SCRIPT",
          "STYLE",
        ]);

      if (
        blockedTags.has(
          target.tagName.toUpperCase()
        )
      ) {
        setTextEditStatus(
          "Esse elemento não possui texto editável."
        );
        return;
      }

      const fullText =
        (target.textContent ?? "")
          .replace(/\s+/g, " ")
          .trim();

            // V4B_1_2U_CAPTURE_STYLE_SEGMENTS
      const snapshotDocument =
        target.ownerDocument;

      const snapshotWindow =
        snapshotDocument.defaultView;

      const snapshotTextNodes: Text[] = [];

      if (snapshotWindow) {
        const snapshotWalker =
          snapshotDocument.createTreeWalker(
            target,
            snapshotWindow.NodeFilter.SHOW_TEXT
          );

        let snapshotNode =
          snapshotWalker.nextNode();

        while (snapshotNode) {
          if (
            snapshotNode.nodeType ===
            snapshotWindow.Node.TEXT_NODE
          ) {
            const snapshotTextNode =
              snapshotNode as Text;

            const snapshotValue =
              snapshotTextNode.nodeValue ?? "";

            if (snapshotValue.length > 0) {
              snapshotTextNodes.push(
                snapshotTextNode
              );
            }
          }

          snapshotNode =
            snapshotWalker.nextNode();
        }
      }

      textStyleSnapshotRef.current = {
        selector:
          selectedElement.selector,
        lengths:
          snapshotTextNodes.map(
            (textNode) =>
              (textNode.nodeValue ?? "")
                .length
          ),
      };
setEditingText(fullText);

      setTextEditStatus(
        "Texto completo carregado."
      );
    }, [selectedElement]);

  const applySelectedText =
    useCallback(() => {
      if (!selectedElement) {
        setTextEditStatus(
          "Selecione um elemento primeiro."
        );
        return;
      }

      const targetElement =
        getSelectedDomElement();

      if (!targetElement) {
        setTextEditStatus(
          "Elemento não encontrado."
        );
        return;
      }

      const blockedTags =
        new Set([
          "IMG",
          "VIDEO",
          "AUDIO",
          "INPUT",
          "TEXTAREA",
          "SELECT",
          "SVG",
          "IFRAME",
          "SCRIPT",
          "STYLE",
        ]);

      if (
        blockedTags.has(
          targetElement.tagName
            .toUpperCase()
        )
      ) {
        setTextEditStatus(
          "Esse elemento não possui texto editável."
        );
        return;
      }

      const nextText =
        editingText
          .replace(/\s+/g, " ")
          .trim();

      if (!nextText) {
        setTextEditStatus(
          "Digite um texto antes de aplicar."
        );
        return;
      }

      // V4B_1_2W_STRUCTURAL_STYLE_ANCHOR_ENGINE
      // Preserve the real DOM elements that own style.
      // STRONG, SPAN and other inline wrappers remain
      // untouched; only their Text.nodeValue changes.

      const ownerDocument =
        targetElement.ownerDocument;

      const ownerWindow =
        ownerDocument.defaultView;

      if (!ownerWindow) {
        setTextEditStatus(
          "Preview indisponível."
        );
        return;
      }

      const walker =
        ownerDocument.createTreeWalker(
          targetElement,
          ownerWindow.NodeFilter.SHOW_TEXT
        );

      type StyleSegment = {
        node: Text;
        element: HTMLElement;
        text: string;
        start: number;
        end: number;
      };

      const segments: StyleSegment[] = [];

      let logicalText = "";
      let walkerNode =
        walker.nextNode();

      while (walkerNode) {
        if (
          walkerNode.nodeType ===
          ownerWindow.Node.TEXT_NODE
        ) {
          const textNode =
            walkerNode as Text;

          const parentElement =
            textNode.parentElement;

          if (parentElement) {
            const rawValue =
              textNode.nodeValue ?? "";

            const normalizedValue =
              rawValue
                .replace(/\s+/g, " ");

            if (
              normalizedValue.length > 0
            ) {
              let segmentText =
                normalizedValue;

              if (
                logicalText.length === 0
              ) {
                segmentText =
                  segmentText
                    .replace(/^\s+/, "");
              }

              if (
                logicalText.endsWith(" ") &&
                segmentText.startsWith(" ")
              ) {
                segmentText =
                  segmentText.slice(1);
              }

              if (segmentText.length > 0) {
                const start =
                  logicalText.length;

                logicalText +=
                  segmentText;

                segments.push({
                  node: textNode,
                  element: parentElement,
                  text: segmentText,
                  start,
                  end: logicalText.length,
                });
              }
            }
          }
        }

        walkerNode =
          walker.nextNode();
      }

      logicalText =
        logicalText.trimEnd();

      if (segments.length === 0) {
        setTextEditStatus(
          "Nenhum segmento estilizado encontrado."
        );
        return;
      }

      const oldText =
        logicalText;

      const sharedLimit =
        Math.min(
          oldText.length,
          nextText.length
        );

      let prefixLength = 0;

      while (
        prefixLength < sharedLimit &&
        oldText.charAt(prefixLength) ===
          nextText.charAt(prefixLength)
      ) {
        prefixLength += 1;
      }

      let suffixLength = 0;

      while (
        suffixLength <
          oldText.length - prefixLength &&
        suffixLength <
          nextText.length - prefixLength &&
        oldText.charAt(
          oldText.length - 1 - suffixLength
        ) ===
          nextText.charAt(
            nextText.length - 1 - suffixLength
          )
      ) {
        suffixLength += 1;
      }

      const oldEditStart =
        prefixLength;

      const oldEditEnd =
        oldText.length -
        suffixLength;

      const newEditStart =
        prefixLength;

      const newEditEnd =
        nextText.length -
        suffixLength;

      const findSegmentIndex =
        (position: number) => {
          if (position <= 0) {
            return 0;
          }

          for (
            let index = 0;
            index < segments.length;
            index += 1
          ) {
            if (
              position <
              segments[index].end
            ) {
              return index;
            }
          }

          return segments.length - 1;
        };

      const editSegmentIndex =
        findSegmentIndex(
          Math.min(
            oldEditStart,
            Math.max(
              0,
              oldText.length - 1
            )
          )
        );

      const buffers =
        segments.map(() => "");

      for (
        let index = 0;
        index < prefixLength;
        index += 1
      ) {
        const segmentIndex =
          findSegmentIndex(index);

        buffers[segmentIndex] +=
          nextText.charAt(index);
      }

      const replacement =
        nextText.slice(
          newEditStart,
          newEditEnd
        );

      buffers[editSegmentIndex] +=
        replacement;

      const oldSuffixStart =
        oldEditEnd;

      const newSuffixStart =
        newEditEnd;

      for (
        let offset = 0;
        offset < suffixLength;
        offset += 1
      ) {
        const oldPosition =
          oldSuffixStart + offset;

        const newPosition =
          newSuffixStart + offset;

        const segmentIndex =
          findSegmentIndex(
            oldPosition
          );

        buffers[segmentIndex] +=
          nextText.charAt(
            newPosition
          );
      }

      for (
        let index = 0;
        index < segments.length;
        index += 1
      ) {
        segments[index].node.nodeValue =
          buffers[index];
      }

      // Keep the actual styled wrapper elements.
      // No destructive DOM reconstruction is
      // performed here.
      setSelectedElement({
        ...selectedElement,
        tagName:
          targetElement.tagName
            .toLowerCase(),
        text: nextText,
      });

      setEditingText(nextText);

      setTextEditStatus(
        "Bloco alterado preservando a estrutura de estilos."
      );
    }, [
      editingText,
      selectedElement,
      getSelectedDomElement,
    ]);
  const loadSelectedContext =
    useCallback(() => {
      const target =
        getSelectedDomElement();

      if (!target) {
        setEditingImageSrc("");
        setEditingLinkHref("");
        setContextEditStatus(
          "Elemento indisponível."
        );

        return;
      }

      const image =
        target instanceof HTMLImageElement
          ? target
          : target.querySelector("img");

      const link =
        target instanceof HTMLAnchorElement
          ? target
          : target.closest("a") ??
            target.querySelector("a");

      setEditingImageSrc(
        image?.getAttribute("src") ??
          ""
      );

      setEditingLinkHref(
        link?.getAttribute("href") ??
          ""
      );

      setContextEditStatus(null);
    }, [getSelectedDomElement]);

  // V4B_2_2_REAL_IMAGE_REPLACEMENT
  const applySelectedImage =
    useCallback(() => {
      const target =
        getSelectedDomElement();

      if (!target) {
        setContextEditStatus(
          "Elemento não encontrado."
        );

        return;
      }

      const nextSrc =
        editingImageSrc.trim();

      if (!nextSrc) {
        setContextEditStatus(
          "Informe a URL da imagem."
        );

        return;
      }

      // V4B_2_6B_DIRECT_SELECTED_IMG
      // V4B_2_6C_CROSS_IFRAME_IMG_TYPE
      const image: HTMLImageElement | null =
        target.tagName.toLowerCase() === "img"
          ? (target as HTMLImageElement)
          : target.querySelector<HTMLImageElement>(
              "img"
            );

      const picture =
        image?.closest("picture") ??
        (target instanceof HTMLPictureElement
          ? target
          : target.querySelector("picture"));

      const targetElement =
        target instanceof HTMLElement
          ? target
          : null;

      let changed = false;

      if (image) {
        image.src = nextSrc;

        image.setAttribute(
          "src",
          nextSrc
        );

        image.removeAttribute(
          "srcset"
        );

        image.removeAttribute(
          "sizes"
        );

        const lazyAttributes = [
          "data-src",
          "data-lazy-src",
          "data-original",
          "data-lazy",
          "data-srcset",
          "data-lazy-srcset",
        ];

        for (
          const attribute of
          lazyAttributes
        ) {
          if (
            image.hasAttribute(
              attribute
            )
          ) {
            if (
              attribute.includes(
                "srcset"
              )
            ) {
              image.removeAttribute(
                attribute
              );
            } else {
              image.setAttribute(
                attribute,
                nextSrc
              );
            }
          }
        }

        image.style.setProperty(
          "content",
          "normal",
          "important"
        );

        changed = true;
      }

      if (picture) {
        const sources =
          picture.querySelectorAll(
            "source"
          );

        sources.forEach(
          (source) => {
            source.removeAttribute(
              "srcset"
            );

            source.removeAttribute(
              "data-srcset"
            );

            source.removeAttribute(
              "sizes"
            );
          }
        );

        changed = true;
      }

      if (targetElement) {
        const computedStyle =
          targetElement.ownerDocument
            .defaultView
            ?.getComputedStyle(
              targetElement
            );

        const currentBackground =
          computedStyle?.backgroundImage ??
          "";

        if (
          currentBackground &&
          currentBackground !== "none"
        ) {
          targetElement.style.setProperty(
            "background-image",
            `url("${nextSrc}")`,
            "important"
          );

          changed = true;
        }
      }

      if (!image && !changed) {
        const descendants =
          Array.from(
            target.querySelectorAll<HTMLElement>(
              "*"
            )
          );

        const backgroundTarget =
          descendants.find(
            (element) => {
              const style =
                element.ownerDocument
                  .defaultView
                  ?.getComputedStyle(
                    element
                  );

              return (
                style?.backgroundImage &&
                style.backgroundImage !==
                  "none"
              );
            }
          );

        if (backgroundTarget) {
          backgroundTarget.style.setProperty(
            "background-image",
            `url("${nextSrc}")`,
            "important"
          );

          changed = true;
        }
      }

      if (!changed) {
        setContextEditStatus(
          "Nenhuma imagem visual foi encontrada nesse elemento. Clique diretamente na imagem."
        );

        return;
      }

      if (image) {
        window.setTimeout(
          () => {
            image.src = nextSrc;

            image.setAttribute(
              "src",
              nextSrc
            );
          },
          0
        );
      }

      setContextEditStatus(
        "Imagem visual alterada com sucesso."
      );
    }, [
      editingImageSrc,
      getSelectedDomElement,
    ]);
  const applySelectedLink =
    useCallback(() => {
      const target =
        getSelectedDomElement();

      if (!target) {
        setContextEditStatus(
          "Elemento não encontrado."
        );

        return;
      }

            // V4B_3B_CROSS_IFRAME_LINK
      const link: HTMLAnchorElement | null =
        target.tagName.toLowerCase() === "a"
          ? (target as HTMLAnchorElement)
          :
              (target.closest(
                "a"
              ) as HTMLAnchorElement | null) ??
              target.querySelector<HTMLAnchorElement>(
                "a"
              );

      if (!link) {
        setContextEditStatus(
          "O elemento selecionado não possui link."
        );

        return;
      }

      const nextHref =
        editingLinkHref.trim();

      if (!nextHref) {
        setContextEditStatus(
          "Informe o destino do link."
        );

        return;
      }

      link.setAttribute(
        "href",
        nextHref
      );

      setContextEditStatus(
        "Link alterado com sucesso."
      );
    }, [
      editingLinkHref,
      getSelectedDomElement,
    ]);
  const params =
    useParams();

  const router =
    useRouter();

  const projectId =
    String(params.id || "");

    const [project, setProject] =
    useState<CloneProject | null>(
      null
    );

  const [mounted, setMounted] =
    useState(false);

  // V4D_4_HYDRATION_SAFE_PROJECT_STATE
  // SSR and the first client render both start with
  // project=null and mounted=false.
  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(
        async () => {
          const storedProject =
            await readProject(projectId);

          setProject(storedProject);
          setMounted(true);
        }
      );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [projectId]);

  // V4C_2_REAL_SAVE
  const [saveStatus, setSaveStatus] =
    useState<string | null>(null);

  const saveEditedProject =
    useCallback(() => {
if (!project) {
        setSaveStatus(
          "Projeto não encontrado."
        );

        return;
      }

      const iframe =
        editorIframeRef.current;

      const document =
        iframe?.contentDocument;

      if (!document) {
        setSaveStatus(
          "Preview não disponível para salvar."
        );

        return;
      }

      const clonedDocument =
        document.cloneNode(
          true
        ) as Document;

      clonedDocument
        .querySelectorAll(
          "[data-lp-editor-hover], [data-lp-editor-selected]"
        )
        .forEach((element) => {
          element.removeAttribute(
            "data-lp-editor-hover"
          );

          element.removeAttribute(
            "data-lp-editor-selected"
          );
        });

      clonedDocument
        .getElementById(
          "lp-studio-editor-bridge-style"
        )
        ?.remove();

      const doctype =
        clonedDocument.doctype
          ? `<!DOCTYPE ${clonedDocument.doctype.name}>`
          : "<!DOCTYPE html>";

      const nextVisualHtml =
        `${doctype}${clonedDocument.documentElement.outerHTML}`;

      const nextVisualHeadHtml =
        clonedDocument.head?.innerHTML ??
        "";

      const nextVisualBodyHtml =
        clonedDocument.body?.innerHTML ??
        "";

      const nextProject: CloneProject = {
        ...project,
        visualHtml: nextVisualHtml,
        visualHeadHtml: nextVisualHeadHtml,
        visualBodyHtml: nextVisualBodyHtml,
      };

      try {
        window.sessionStorage.setItem(
          `lp-clone-project:${project.id}`,
          JSON.stringify(nextProject)
        );

        // V5C_2B_PROMOTE_TEMP_TO_SAVED_PROJECT
        window.sessionStorage.removeItem(
          `lp-clone-temp:${project.id}`
        );

        window.sessionStorage.setItem(
          "lp-clone-current-project",
          project.id
        );

        setProject(nextProject);

        setSaveStatus(
          "Alterações salvas com sucesso."
        );
      } catch {
        setSaveStatus(
          "Não foi possível salvar as alterações."
        );
      }
    }, [project]);
  const [viewport, setViewport] =
    useState<Viewport>(
      "desktop"
    );

  const previewHtml =
    useMemo(
      () =>
        project?.visualHtml ||
        "",
      [project]
    );

  // V4D_4_HYDRATION_RENDER_GATE
  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090909] px-6 text-white">
        <div className="text-center">
          <p className="text-sm text-neutral-400">
            Carregando editor...
          </p>
        </div>
      </main>
    );
  }
  if (!project) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090909] px-6 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">
            Projeto não encontrado
          </h1>

          <p className="mt-3 text-neutral-400">
            Clone novamente uma Landing Page
            para abrir o editor.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/app/cloner"
              )
            }
            className="mt-6 rounded-xl bg-emerald-400 px-5 py-3 font-bold text-black"
          >
            Voltar ao clonador
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#090909] text-white">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#101010] px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/app/cloner"
              )
            }
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5"
          >
            ← Voltar
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {project.title}
            </p>

            <p className="truncate text-xs text-neutral-500">
              {project.domain}
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {(
            [
              "desktop",
              "tablet",
              "mobile",
            ] as Viewport[]
          ).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() =>
                setViewport(item)
              }
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                viewport === item
                  ? "bg-emerald-400 text-black"
                  : "border border-white/10 text-neutral-400 hover:bg-white/5"
              }`}
            >
              {item === "desktop"
                ? "Desktop"
                : item === "tablet"
                  ? "Tablet"
                  : "Mobile"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-300 lg:inline">
            Preview V1
          </span>

                    <div className="flex items-center gap-2">
            {saveStatus ? (
              <span className="hidden text-xs text-emerald-300 xl:inline">
                {saveStatus}
              </span>
            ) : null}

            <button
              type="button"
              onClick={saveEditedProject}
              className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-emerald-300"
            >
              Salvar
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#101010] p-5 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Editor
          </p>

          <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
            <p className="text-sm font-medium text-emerald-300">
              Clone visual ativo
            </p>

            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Esta etapa valida a fidelidade
              visual antes de habilitarmos
              edição de textos, imagens e
              botões.
            </p>
          </div>

          <div className="mt-5 space-y-2">
            <div className="rounded-xl border border-white/10 p-3">
              <p className="text-xs text-neutral-500">
                Títulos
              </p>

              <p className="mt-1 font-semibold">
                {project.headings.length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 p-3">
              <p className="text-xs text-neutral-500">
                Textos
              </p>

              <p className="mt-1 font-semibold">
                {project.texts.length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 p-3">
              <p className="text-xs text-neutral-500">
                Imagens
              </p>

              <p className="mt-1 font-semibold">
                {project.images.length}
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 overflow-auto bg-[#1a1a1a] p-4 md:p-6">
          <div
            className="mx-auto h-full transition-[width] duration-200"
            style={{
              width:
                viewportWidths[
                  viewport
                ],
              maxWidth: "100%",
            }}
          >
          <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
                  Elemento selecionado
                </p>

                {selectedElement ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium text-white">
                      &lt;{selectedElement.tagName}&gt;
                    </p>

                    <p className="max-w-3xl truncate text-xs text-zinc-400">
                      {selectedElement.text ||
                        selectedElement.src ||
                        selectedElement.href ||
                        "Elemento sem texto"}
                    </p>

                    <p className="max-w-3xl truncate font-mono text-[11px] text-zinc-600">
                      {selectedElement.selector}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-400">
                    Passe o mouse pela página e clique em um elemento para selecioná-lo.
                  </p>
                )}
              </div>

              {/* V4B_2_1_CONTEXT_PANEL_RENDER_FIX */}
              {selectedElement ? (
                <div
                  data-editor-context-panel="true"
                  className="mt-4 w-full rounded-xl border border-emerald-400/30 bg-emerald-400/[0.04] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">
                        Imagem e link
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Edite a mídia ou o destino do elemento selecionado.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={loadSelectedContext}
                      className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                    >
                      Carregar
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <label className="block text-xs font-medium text-zinc-400">
                        URL da imagem
                      </label>

                      <input
                        type="text"
                        value={editingImageSrc}
                        onChange={(event) =>
                          setEditingImageSrc(
                            event.target.value
                          )
                        }
                        placeholder="https://site.com/imagem.webp"
                        className="mt-2 w-full rounded-lg border border-zinc-800 bg-[#090909] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500/60"
                      />

                      <button
                        type="button"
                        onClick={applySelectedImage}
                        className="mt-2 w-full rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-300"
                      >
                        Aplicar imagem
                      </button>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <label className="block text-xs font-medium text-zinc-400">
                        Destino do link / botão
                      </label>

                      <input
                        type="text"
                        value={editingLinkHref}
                        onChange={(event) =>
                          setEditingLinkHref(
                            event.target.value
                          )
                        }
                        placeholder="https://site.com/checkout"
                        className="mt-2 w-full rounded-lg border border-zinc-800 bg-[#090909] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500/60"
                      />

                      <button
                        type="button"
                        onClick={applySelectedLink}
                        className="mt-2 w-full rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/15"
                      >
                        Aplicar link
                      </button>
                    </div>
                  </div>

                  {contextEditStatus ? (
                    <p className="mt-3 text-xs text-zinc-400">
                      {contextEditStatus}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {selectedElement ? (
                <div className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">
                        Editar texto
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Altere o conteúdo do elemento selecionado.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={loadSelectedText}
                      className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                    >
                      Carregar
                    </button>
                  </div>

                  <textarea
                    value={editingText}
                    onChange={(event) =>
                      setEditingText(
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Texto do elemento..."
                    className="mt-3 w-full resize-y rounded-lg border border-zinc-800 bg-[#090909] px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/60"
                  />

                  <button
                    type="button"
                    onClick={applySelectedText}
                    className="mt-3 w-full rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-300"
                  >
                    Aplicar texto
                  </button>

                  {textEditStatus ? (
                    <p className="mt-2 text-xs text-zinc-400">
                      {textEditStatus}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {selectedElement ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedElement(null);
                    setEditingText("");
                    setTextEditStatus(null);
                    setEditingImageSrc("");
                    setEditingLinkHref("");
                    setContextEditStatus(null);
                  }}
                  className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                >
                  Limpar
                </button>
              ) : null}
            </div>
          </div>
            <iframe
              onLoad={handleEditorIframeLoad}
              ref={editorIframeRef}
              title={`Preview de ${project.title}`}
              srcDoc={previewHtml}
              sandbox="allow-same-origin"
              referrerPolicy="no-referrer"
              className="h-full min-h-[calc(100vh-7rem)] w-full rounded-xl border border-white/10 bg-white shadow-2xl"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
