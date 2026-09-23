export type EditorSelectedElement = {
  tagName: string;
  text: string;
  href: string;
  src: string;
  id: string;
  className: string;
  selector: string;
};

const BRIDGE_STYLE_ID =
  "lp-studio-editor-bridge-style";

function escapeCssIdentifier(
  value: string
): string {
  if (
    typeof CSS !== "undefined" &&
    typeof CSS.escape === "function"
  ) {
    return CSS.escape(value);
  }

  return value.replace(
    /[^a-zA-Z0-9_-]/g,
    (valueToEscape) => {
      const codePoint =
        valueToEscape.codePointAt(0);

      return codePoint
        ? `\${codePoint.toString(16)} `
        : "";
    }
  );
}

function createSelector(
  element: HTMLElement
): string {
  if (element.id) {
    return `#${escapeCssIdentifier(element.id)}`;
  }

  const parts: string[] = [];

  let current:
    | HTMLElement
    | null = element;

  while (
    current &&
    current.tagName.toLowerCase() !== "html"
  ) {
    const tag =
      current.tagName.toLowerCase();

    let part = tag;

    const parent:
      | HTMLElement
      | null = current.parentElement;

    if (parent) {
      const siblings =
        Array.from(parent.children).filter(
          (child) =>
            child.tagName === current?.tagName
        );

      if (siblings.length > 1) {
        const index =
          siblings.indexOf(current) + 1;

        part +=
          `:nth-of-type(${index})`;
      }
    }

    parts.unshift(part);

    current = parent;

    if (parts.length >= 8) {
      break;
    }
  }

  return parts.join(" > ");
}

function normalizeText(
  value: string | null | undefined
): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function isHtmlElement(
  value: EventTarget | null
): value is HTMLElement {
  if (!value) {
    return false;
  }

  const candidate =
    value as Node;

  return (
    candidate.nodeType === 1 &&
    typeof (
      value as HTMLElement
    ).tagName === "string"
  );
}

function isDomNode(
  value: EventTarget | null
): value is Node {
  if (!value) {
    return false;
  }

  return (
    typeof (
      value as Node
    ).nodeType === "number"
  );
}

export function installEditorDomBridge(
  iframe: HTMLIFrameElement,
  onSelect: (
    element:
      | EditorSelectedElement
      | null
  ) => void
): () => void {
  // V4A_INTERACTIVE_DOM_BRIDGE
  // V4A1_SAFE_EVENT_TARGET_NARROWING

  const document =
    iframe.contentDocument;

  if (!document) {
    return () => {};
  }

  const frameWindow =
    document.defaultView;

  if (!frameWindow) {
    return () => {};
  }

  const style =
    document.createElement("style");

  style.id =
    BRIDGE_STYLE_ID;

  style.textContent = `
    [data-lp-editor-hover="true"] {
      outline: 2px dashed #22c55e !important;
      outline-offset: 2px !important;
      cursor: pointer !important;
    }

    [data-lp-editor-selected="true"] {
      outline: 3px solid #22c55e !important;
      outline-offset: 2px !important;
    }
  `;

  document.head.appendChild(style);

  let hovered:
    | HTMLElement
    | null = null;

  let selected:
    | HTMLElement
    | null = null;

  const clearHover = () => {
    if (hovered) {
      hovered.removeAttribute(
        "data-lp-editor-hover"
      );
    }

    hovered = null;
  };

  const setHover = (
    element:
      | HTMLElement
      | null
  ) => {
    if (hovered === element) {
      return;
    }

    clearHover();

    if (!element) {
      return;
    }

    if (
      element === document.documentElement ||
      element === document.body
    ) {
      return;
    }

    hovered = element;

    hovered.setAttribute(
      "data-lp-editor-hover",
      "true"
    );
  };

  const handleMouseOver = (
    event: MouseEvent
  ) => {
    const target =
      event.target;

    if (!isHtmlElement(target)) {
      return;
    }

    setHover(target);
  };

  const handleMouseOut = (
    event: MouseEvent
  ) => {
    const related =
      event.relatedTarget;

    if (
      isDomNode(related) &&
      hovered?.contains(related)
    ) {
      return;
    }

    clearHover();
  };

  const handleClick = (
    event: MouseEvent
  ) => {
    const rawTarget =
      event.target;

    if (!isHtmlElement(rawTarget)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    

    // V4B_2_5_IMAGE_CLICK_PROMOTION
    let target: HTMLElement =
      rawTarget;

    if (
      target.tagName.toLowerCase() !==
      "img"
    ) {
      const images =
        target.querySelectorAll("img");

      if (images.length === 1) {
        const imageCandidate =
          images.item(0);

        if (
          imageCandidate &&
          isHtmlElement(imageCandidate)
        ) {
          target = imageCandidate;
        }
      }
    }

        // V4B_1_2O_MANUAL_HEADING_ANCESTOR
    // Images keep priority.
    // For text nodes/elements, walk the real DOM ancestry
    // manually until H1-H6 is found.
    if (
      target.tagName.toLowerCase() !== "img"
    ) {
      const headingTags =
        new Set([
          "H1",
          "H2",
          "H3",
          "H4",
          "H5",
          "H6",
        ]);

      let headingCandidate: HTMLElement | null =
        target;

      while (headingCandidate) {
        if (
          headingTags.has(
            headingCandidate.tagName.toUpperCase()
          )
        ) {
          target = headingCandidate;
          break;
        }

        const parentCandidate: HTMLElement | null =
          headingCandidate.parentElement;

        if (!parentCandidate) {
          break;
        }

        headingCandidate = parentCandidate;
      }
    }

    clearHover();

    if (selected) {
      selected.removeAttribute(
        "data-lp-editor-selected"
      );
    }

    selected = target;

    selected.setAttribute(
      "data-lp-editor-selected",
      "true"
    );

    const anchor =
      target.closest("a");

    const image =
      target.tagName
        .toLowerCase() === "img"
        ? target
        : target.querySelector("img");

        // V4B_1_2H_DOM_REFERENCE
    (document as Document & {
      __lpStudioSelectedElement?: HTMLElement;
    }).__lpStudioSelectedElement = target;
onSelect({
      tagName:
        target.tagName.toLowerCase(),

      text:
        normalizeText(
          target.innerText ||
          target.textContent
        ),

      href:
        anchor?.getAttribute("href") ||
        "",

      src:
        image?.getAttribute("src") ||
        "",

      id:
        target.id || "",

      className:
        typeof target.className ===
        "string"
          ? target.className
          : "",

      selector:
        createSelector(target),
    });
  };
  document.addEventListener(
    "mouseover",
    handleMouseOver,
    true
  );

  document.addEventListener(
    "mouseout",
    handleMouseOut,
    true
  );

  document.addEventListener(
    "click",
    handleClick,
    true
  );

  return () => {
    document.removeEventListener(
      "mouseover",
      handleMouseOver,
      true
    );

    document.removeEventListener(
      "mouseout",
      handleMouseOut,
      true
    );

    document.removeEventListener(
      "click",
      handleClick,
      true
    );

    clearHover();

    if (selected) {
      selected.removeAttribute(
        "data-lp-editor-selected"
      );
    }

    document
      .getElementById(
        BRIDGE_STYLE_ID
      )
      ?.remove();
  };
}