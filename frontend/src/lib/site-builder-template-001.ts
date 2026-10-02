import type {
  SitePage,
  SitePageKey,
  SiteProject,
} from "@/lib/site-builder";

export const PAGENOVA_TEMPLATE_001_ID = "template-001" as const;

export type PageNovaTemplateId =
  typeof PAGENOVA_TEMPLATE_001_ID;

export type TemplateSectionKind =
  NonNullable<SitePage["sections"][number]["kind"]>;

export type TemplateSectionRole =
  | "hero"
  | "trust"
  | "problem"
  | "benefits"
  | "services"
  | "process"
  | "showcase"
  | "results"
  | "testimonials"
  | "pricing"
  | "faq"
  | "contact"
  | "cta";

export type Template001SectionRule = {
  role: TemplateSectionRole;
  acceptedKinds: readonly TemplateSectionKind[];
  optional: boolean;
  maxItems?: number;
};

export type Template001Definition = {
  id: typeof PAGENOVA_TEMPLATE_001_ID;
  name: string;
  version: 1;
  description: string;

  design: {
    maxContentWidth: number;
    sectionSpacing: "spacious";
    radius: "soft";
    hero: "split";
    header: "minimal";
    cardStyle: "bordered";
    visualDensity: "balanced";
  };

  sections: readonly Template001SectionRule[];
};

export const PAGENOVA_TEMPLATE_001: Template001Definition = {
  id: PAGENOVA_TEMPLATE_001_ID,

  name: "PageNova Premium 001",

  version: 1,

  description:
    "Template premium universal orientado por conteudo semantico.",

  design: {
    maxContentWidth: 1180,
    sectionSpacing: "spacious",
    radius: "soft",
    hero: "split",
    header: "minimal",
    cardStyle: "bordered",
    visualDensity: "balanced",
  },

  sections: [
    {
      role: "hero",
      acceptedKinds: ["hero"],
      optional: false,
    },

    {
      role: "trust",
      acceptedKinds: ["authority", "testimonials"],
      optional: true,
      maxItems: 4,
    },

    {
      role: "problem",
      acceptedKinds: ["about"],
      optional: true,
    },

    {
      role: "benefits",
      acceptedKinds: ["benefits", "features"],
      optional: true,
      maxItems: 6,
    },

    {
      role: "services",
      acceptedKinds: ["services", "products"],
      optional: true,
      maxItems: 6,
    },

    {
      role: "process",
      acceptedKinds: ["process"],
      optional: true,
      maxItems: 4,
    },

    {
      role: "showcase",
      acceptedKinds: ["portfolio", "gallery"],
      optional: true,
      maxItems: 6,
    },

    {
      role: "results",
      acceptedKinds: ["authority", "benefits"],
      optional: true,
      maxItems: 4,
    },

    {
      role: "testimonials",
      acceptedKinds: ["testimonials"],
      optional: true,
      maxItems: 6,
    },

    {
      role: "pricing",
      acceptedKinds: ["pricing"],
      optional: true,
      maxItems: 3,
    },

    {
      role: "faq",
      acceptedKinds: ["faq"],
      optional: true,
      maxItems: 8,
    },

    {
      role: "contact",
      acceptedKinds: ["contact"],
      optional: true,
    },

    {
      role: "cta",
      acceptedKinds: ["final-cta"],
      optional: true,
    },
  ],
};

export type Template001RenderContext = {
  project: SiteProject;
  page: SitePage;
  pageKey: SitePageKey;
};

export function getTemplate001Definition(): Template001Definition {
  return PAGENOVA_TEMPLATE_001;
}

export function supportsTemplate001(
  project: SiteProject,
  pageKey: SitePageKey,
): boolean {
  const page = project.pages[pageKey];

  if (!page) {
    return false;
  }

  return page.sections.length > 0;
}