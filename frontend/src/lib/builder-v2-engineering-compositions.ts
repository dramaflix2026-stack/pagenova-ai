export type EngineeringCompositionId = "TP2-COMP-01" | "TP2-TECH-01";

export function resolveEngineeringComposition(sectionId: string, heading: string): EngineeringCompositionId | null {
  const label = [sectionId, heading].join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/tecnolog/.test(label)) return "TP2-TECH-01";
  if (/competenc/.test(label)) return "TP2-COMP-01";
  return null;
}

export const engineeringCompositionRegistry = {
  "TP2-COMP-01": { family: "engineering", kind: "competencies", variant: "editorial-numbered" },
  "TP2-TECH-01": { family: "engineering", kind: "technologies", variant: "editorial-numbered" },
} as const;
