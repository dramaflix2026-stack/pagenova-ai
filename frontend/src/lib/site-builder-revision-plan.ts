import type { RevisionPlan, SitePage } from "@/lib/site-builder";

type SiteSection = SitePage["sections"][number];
type SectionChange = RevisionPlan["sectionChanges"][number];

export type SectionRevisionResult = {
  sections: SitePage["sections"];
  applied: number;
  ignored: number;
};

const MAX_SECTIONS = 20;

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cloneSections(
  sections: SitePage["sections"],
): SitePage["sections"] {
  return sections.map((section) => ({
    title: section.title,
    body: section.body,
    ...(section.kind ? { kind: section.kind } : {}),
    ...(Array.isArray(section.items) && section.items.length > 0
      ? {
          items: section.items.map((item) => ({
            title: item.title,
            body: item.body,
          })),
        }
      : {}),
  }));
}

function isExistingIndex(
  index: number,
  length: number,
): boolean {
  return Number.isInteger(index) && index >= 0 && index < length;
}

function resolveInsertIndex(
  targetIndex: number,
  length: number,
): number {
  if (!Number.isInteger(targetIndex) || targetIndex < 0) {
    return length;
  }

  return Math.min(targetIndex, length);
}

function applyUpdate(
  sections: SitePage["sections"],
  change: SectionChange,
): boolean {
  if (!isExistingIndex(change.index, sections.length)) {
    return false;
  }

  const current = sections[change.index];
  const title = normalizeText(change.title);
  const body = normalizeText(change.body);

  if (!title && !body) {
    return false;
  }

  sections[change.index] = {
    title: title || current.title,
    body: body || current.body,
    ...(current.kind ? { kind: current.kind } : {}),
    ...(Array.isArray(current.items) && current.items.length > 0
      ? {
          items: current.items.map((item) => ({
            title: item.title,
            body: item.body,
          })),
        }
      : {}),
  };

  return true;
}

function applyRemove(
  sections: SitePage["sections"],
  change: SectionChange,
): boolean {
  if (!isExistingIndex(change.index, sections.length)) {
    return false;
  }

  sections.splice(change.index, 1);
  return true;
}

function applyAdd(
  sections: SitePage["sections"],
  change: SectionChange,
): boolean {
  if (sections.length >= MAX_SECTIONS) {
    return false;
  }

  const title = normalizeText(change.title);
  const body = normalizeText(change.body);

  if (!title || !body) {
    return false;
  }

  const section: SiteSection = {
    title,
    body,
  };

  const insertIndex = resolveInsertIndex(
    change.targetIndex,
    sections.length,
  );

  sections.splice(insertIndex, 0, section);
  return true;
}

function applyMove(
  sections: SitePage["sections"],
  change: SectionChange,
): boolean {
  if (!isExistingIndex(change.index, sections.length)) {
    return false;
  }

  if (
    !Number.isInteger(change.targetIndex) ||
    change.targetIndex < 0 ||
    change.targetIndex >= sections.length
  ) {
    return false;
  }

  if (change.index === change.targetIndex) {
    return true;
  }

  const [section] = sections.splice(change.index, 1);

  sections.splice(
    Math.min(change.targetIndex, sections.length),
    0,
    section,
  );

  return true;
}

export function applySectionChanges(
  currentSections: SitePage["sections"],
  changes: RevisionPlan["sectionChanges"],
): SectionRevisionResult {
  const sections = cloneSections(currentSections);

  let applied = 0;
  let ignored = 0;

  for (const change of changes) {
    let didApply = false;

    switch (change.action) {
      case "update":
        didApply = applyUpdate(sections, change);
        break;

      case "remove":
        didApply = applyRemove(sections, change);
        break;

      case "add":
        didApply = applyAdd(sections, change);
        break;

      case "move":
        didApply = applyMove(sections, change);
        break;

      default:
        didApply = false;
    }

    if (didApply) {
      applied += 1;
    } else {
      ignored += 1;
    }
  }

  return {
    sections,
    applied,
    ignored,
  };
}