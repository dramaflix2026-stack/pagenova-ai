import type { RevisionPlan } from "@/lib/site-builder";
import type { LiveEdit } from "@/lib/site-builder-live-editor";

type ElementChange = RevisionPlan["elementChanges"][number];

export type ElementRevisionResult = {
  edits: LiveEdit[];
  applied: number;
  ignored: number;
  unsupported: number;
};

const MAX_LIVE_EDITS = 100;

function selectorsForCards(): string[] {
  return Array.from(
    { length: 6 },
    (_, index) => `#feature-${index + 1}`,
  );
}
function selectorForTarget(
  target: ElementChange["target"],
  sectionIndex: number,
): string | null {
  switch (target) {
    case "heading":
      return ".hero h1";

    case "eyebrow":
      return ".hero .eyebrow";

    case "introduction":
      return ".hero .hero-lead";

    case "cta":
      return ".hero .btn";

    case "hero":
      return ".hero";

    case "header":
      return ".pn-site-header";

    case "navigation":
      return ".pn-site-header nav";

    case "logo":
      return ".pn-site-header .brand";

    case "cards":
      return null;

    case "section":
      return Number.isInteger(sectionIndex) && sectionIndex >= 0
        ? `#feature-${sectionIndex + 1}`
        : null;

    default:
      return null;
  }
}

function emptyEdit(selector: string): LiveEdit {
  return {
    selector,
    text: "",
    font: "",
    size: 0,
    color: "",
  };
}

function cloneEdits(edits: LiveEdit[]): LiveEdit[] {
  return edits.map((edit) => ({ ...edit }));
}

function upsertEdit(
  edits: LiveEdit[],
  selector: string,
  mutate: (edit: LiveEdit) => LiveEdit,
): LiveEdit[] {
  const index = edits.findIndex(
    (edit) => edit.selector === selector && !edit.ghostId,
  );

  if (index === -1) {
    return [...edits, mutate(emptyEdit(selector))];
  }

  return edits.map((edit, editIndex) =>
    editIndex === index ? mutate({ ...edit }) : edit,
  );
}

function sizeForChange(
  target: ElementChange["target"],
  size: ElementChange["size"],
): number | null {
  if (size === "none") {
    return null;
  }

  const defaults: Partial<
    Record<ElementChange["target"], number>
  > = {
    heading: 64,
    eyebrow: 11,
    introduction: 19,
    cta: 13,
    logo: 20,
    navigation: 14,
  };

  const base = defaults[target];

  if (!base) {
    return null;
  }

  if (size === "smaller") {
    return Math.max(10, Math.round(base * 0.82));
  }

  if (size === "larger") {
    return Math.round(base * 1.22);
  }

  return base;
}

function weightForEmphasis(
  emphasis: ElementChange["emphasis"],
): number | null {
  switch (emphasis) {
    case "subtle":
      return 500;

    case "default":
      return 600;

    case "strong":
      return 800;

    default:
      return null;
  }
}

export function applyElementChanges(
  currentEdits: LiveEdit[],
  changes: RevisionPlan["elementChanges"],
): ElementRevisionResult {
  let edits = cloneEdits(currentEdits);
  let applied = 0;
  let ignored = 0;
  let unsupported = 0;

  for (const change of changes) {
    if (
      change.target === "cards" &&
      change.cardStyle !== "none" &&
      (change.action === "restyle" || change.action === "update")
    ) {
      const cardStyle = change.cardStyle;

      for (const cardSelector of selectorsForCards()) {
        edits = upsertEdit(
          edits,
          cardSelector,
          (edit) => ({
            ...edit,
            cardStyle,
          }),
        );
      }

      applied += 1;
      continue;
    }

    const selector = selectorForTarget(
      change.target,
      change.sectionIndex,
    );

    if (!selector) {
      ignored += 1;
      continue;
    }

    if (change.action === "remove") {
      const before = edits.length;

      edits = edits.filter(
        (edit) => edit.selector !== selector,
      );

      if (edits.length !== before) {
        applied += 1;
      } else {
        ignored += 1;
      }

      continue;
    }

    if (change.action === "align") {
      if (change.alignment === "none") {
        ignored += 1;
        continue;
      }

      edits = upsertEdit(
        edits,
        selector,
        (edit) => ({
          ...edit,
          textAlign: change.alignment === "none" ? undefined : change.alignment,
        }),
      );

      applied += 1;
      continue;
    }

    if (change.action === "resize") {
      const size = sizeForChange(
        change.target,
        change.size,
      );

      if (size === null) {
        unsupported += 1;
        continue;
      }

      edits = upsertEdit(
        edits,
        selector,
        (edit) => ({
          ...edit,
          size,
        }),
      );

      applied += 1;
      continue;
    }

    if (change.action === "restyle") {
      let changed = false;


      const fontWeight =
        weightForEmphasis(change.emphasis);

      if (fontWeight !== null) {
        edits = upsertEdit(
          edits,
          selector,
          (edit) => ({
            ...edit,
            fontWeight,
          }),
        );

        changed = true;
      }

      if (changed) {
        applied += 1;
      } else {
        unsupported += 1;
      }

      continue;
    }

    if (change.action === "update") {
      let changed = false;

      if (change.alignment !== "none") {
        edits = upsertEdit(
          edits,
          selector,
          (edit) => ({
            ...edit,
            textAlign: change.alignment === "none" ? undefined : change.alignment,
          }),
        );

        changed = true;
      }

      const size = sizeForChange(
        change.target,
        change.size,
      );

      if (size !== null) {
        edits = upsertEdit(
          edits,
          selector,
          (edit) => ({
            ...edit,
            size,
          }),
        );

        changed = true;
      }

      const fontWeight =
        weightForEmphasis(change.emphasis);

      if (fontWeight !== null) {
        edits = upsertEdit(
          edits,
          selector,
          (edit) => ({
            ...edit,
            fontWeight,
          }),
        );

        changed = true;
      }


      if (changed) {
        applied += 1;
      } else {
        ignored += 1;
      }

      continue;
    }

    unsupported += 1;
  }

  if (edits.length > MAX_LIVE_EDITS) {
    edits = edits.slice(-MAX_LIVE_EDITS);
  }

  return {
    edits,
    applied,
    ignored,
    unsupported,
  };
}