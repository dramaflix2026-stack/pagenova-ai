/**
 * Shared data contract for the PageNova Ebook Studio.
 * Keep output independent from any AI vendor so users can edit and export it.
 */
export type EbookPageKind = "cover" | "chapter" | "feature" | "quote" | "summary" | "back" | "checklist" | "steps" | "comparison" | "timeline" | "caseStudy" | "gallery" | "infographic" | "insight" | "recipe";
export type EbookTheme = "editorial" | "midnight" | "forest" | "corporate" | "modern" | "premium";
export type EbookImageMode = "web" | "ai" | "none";

export type EbookPage = {
  id: string;
  kind: EbookPageKind;
  eyebrow: string;
  title: string;
  lead: string;
  body: string;
  bullets: string[];
  imagePrompt: string;
  imageUrl: string;
  imageCredit: string;
};

export type EbookProject = {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  audience: string;
  prompt: string;
  theme: EbookTheme;
  imageMode: EbookImageMode;
  pages: EbookPage[];
  updatedAt: string;
};

const KINDS = new Set<EbookPageKind>(["cover", "chapter", "feature", "quote", "summary", "back", "checklist", "steps", "comparison", "timeline", "caseStudy", "gallery", "infographic", "insight", "recipe"]);
const THEMES = new Set<EbookTheme>(["editorial", "midnight", "forest", "corporate", "modern", "premium"]);
const IMAGE_MODES = new Set<EbookImageMode>(["web", "ai", "none"]);
const asString = (input: unknown): string => typeof input === "string" ? input : "";
export function newEbookId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}
export function normalizeEbook(raw: unknown): EbookProject {
  if (!raw || typeof raw !== "object") throw new Error("Ebook inválido.");
  const obj = raw as Record<string, unknown>;
  const rawPages = Array.isArray(obj.pages) ? obj.pages : [];
  if (rawPages.length < 2 || rawPages.length > 80) throw new Error("O ebook precisa de 2 a 80 páginas.");
  const pages = rawPages.map((value, index): EbookPage => {
    if (!value || typeof value !== "object") throw new Error("Página inválida.");
    const p = value as Record<string, unknown>;
    const kind = asString(p.kind) as EbookPageKind;
    const bullets = Array.isArray(p.bullets) ? p.bullets.filter((v): v is string => typeof v === "string") : [];
    return {
      id: asString(p.id) || "pagina-" + (index + 1),
      kind: KINDS.has(kind) ? kind : index === 0 ? "cover" : "chapter",
      eyebrow: asString(p.eyebrow),
      title: asString(p.title),
      lead: asString(p.lead),
      body: asString(p.body),
      bullets: bullets.slice(0,12),
      imagePrompt: asString(p.imagePrompt),
      imageUrl: asString(p.imageUrl),
      imageCredit: asString(p.imageCredit),
    };
  });
  if (!pages[0].title.trim()) throw new Error("A capa precisa de título.");
  const theme = asString(obj.theme) as EbookTheme;
  const mode = asString(obj.imageMode) as EbookImageMode;
  return {
    id: asString(obj.id) || newEbookId(),
    title: asString(obj.title) || pages[0].title,
    subtitle: asString(obj.subtitle),
    author: asString(obj.author) || "PageNova AI",
    audience: asString(obj.audience),
    prompt: asString(obj.prompt),
    theme: THEMES.has(theme) ? theme : "editorial",
    imageMode: IMAGE_MODES.has(mode) ? mode : "web",
    pages,
    updatedAt: asString(obj.updatedAt) || new Date().toISOString(),
  };
}

export function makeEmptyPage(index: number): EbookPage {
  return {
    id: newEbookId(),
    kind: "chapter",
    eyebrow: "CAPÍTULO " + String(index).padStart(2,"0"),
    title: "Novo capítulo",
    lead: "Uma ideia importante em destaque.",
    body: "Escreva aqui o conteúdo do seu capítulo.",
    bullets: [],
    imagePrompt: "",
    imageUrl: "",
    imageCredit: "",
  };
}

export const ebookThemes: Record<EbookTheme,{name:string;paper:string;ink:string;accent:string;soft:string}> = {
  editorial: {name:"Editorial",paper:"#F7F2E9",ink:"#292922",accent:"#B37A54",soft:"#E9DED0"},
  midnight: {name:"Noturno",paper:"#121B2D",ink:"#F4F1E9",accent:"#E1B765",soft:"#24354B"},
  forest: {name:"Natureza",paper:"#EDF1E9",ink:"#17372E",accent:"#678D64",soft:"#D5E2D5"},
  corporate: {name:"Corporativo",paper:"#F4F6F8",ink:"#172839",accent:"#2A6D9A",soft:"#E1EAF1"},
  modern: {name:"Moderno",paper:"#FFFFFF",ink:"#192021",accent:"#6B52D4",soft:"#EBE8F9"},
  premium: {name:"Premium",paper:"#121A16",ink:"#F7F0E3",accent:"#C6A96D",soft:"#27362D"},
};
