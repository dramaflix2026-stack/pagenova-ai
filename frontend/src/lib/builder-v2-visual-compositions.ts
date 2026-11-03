/**
 * Semantic visual composition routing for AI-created sections.
 * Existing approved template sections remain untouched: this registry only
 * supplies a composition when family AND section intent are unambiguous.
 */
export type VisualFamily = "beauty" | "engineering" | "gastronomy" | "health" | "marketing" | "retail" | "real-estate" | "hospitality" | "automotive" | "education";
export type VisualSectionKind = "competencies" | "technologies" | "services" | "process" | "gallery" | "testimonials" | "faq" | "contact" | "pricing" | "courses" | "products" | "properties" | "accommodations";

export type VisualComposition = Readonly<{
  id: string;
  family: VisualFamily;
  kind: VisualSectionKind;
  variant: string;
  renderer: "engineering-editorial" | "approved-template";
}>;

const definitions: readonly VisualComposition[] = [
  { id: "TP2-COMP-01", family: "engineering", kind: "competencies", variant: "editorial-numbered", renderer: "engineering-editorial" },
  { id: "TP2-TECH-01", family: "engineering", kind: "technologies", variant: "editorial-numbered", renderer: "engineering-editorial" },
];

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function classifySectionKind(sectionId: string, heading: string): VisualSectionKind | null {
  const label = normalize(sectionId + " " + heading);
  const rules: readonly [VisualSectionKind, RegExp][] = [
    ["technologies", /tecnolog|ferramentas digitais|modelagem bim/],
    ["competencies", /competenc|capacidades tecnicas|especialidades tecnicas/],
    ["testimonials", /depoiment|avaliac|testemunh/],
    ["faq", /perguntas frequentes|duvidas frequentes|\bfaq\b/],
    ["pricing", /precos|planos|investimento|tabela de valores/],
    ["gallery", /galeria|portfolio|projetos realizados/],
    ["process", /como funciona|metodologia|etapas|processo/],
    ["contact", /contato|fale conosco|orcamento/],
    ["courses", /cursos|formacoes|capacitac/],
    ["products", /produtos|colecoes|catalogo/],
    ["properties", /imoveis|empreendimentos/],
    ["accommodations", /acomodacoes|suites|quartos/],
    ["services", /servicos|solucoes|atuacao/],
  ];
  return rules.find(([, pattern]) => pattern.test(label))?.[0] ?? null;
}

export function resolveVisualComposition(family: VisualFamily | null, sectionId: string, heading: string): VisualComposition | null {
  if (!family) return null;
  const kind = classifySectionKind(sectionId, heading);
  if (!kind) return null;
  return definitions.find((entry) => entry.family === family && entry.kind === kind) ?? null;
}

export const visualCompositionRegistry = definitions;
