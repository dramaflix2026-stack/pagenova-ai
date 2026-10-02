import type {
  SitePage,
  SiteProject,
} from "@/lib/site-builder";

/* ==========================================================
   PAGENOVA DESIGN CORE V5
   ========================================================== */

export type PageNovaPaletteV5 = {
  id: string;
  background: string;
  surface: string;
  surfaceSoft: string;
  text: string;
  muted: string;
  accent: string;
  accentStrong: string;
  accentContrast: string;
  dark: string;
  line: string;
};

const stableHashV5 = (value: string): number => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

/*
 * Universal curated palettes.
 *
 * IMPORTANT:
 * These are visual systems, not niche mappings.
 * No dentistry/architecture/technology keyword branch exists.
 *
 * The project identity deterministically selects a palette.
 */
const PALETTES_V5: readonly PageNovaPaletteV5[] = [
  {
    id: "graphite-sand",
    background: "#f3f0e9",
    surface: "#fffdf8",
    surfaceSoft: "#e9e3d8",
    text: "#171713",
    muted: "#6d685f",
    accent: "#a76443",
    accentStrong: "#7d432a",
    accentContrast: "#ffffff",
    dark: "#181816",
    line: "rgba(23,23,19,.14)",
  },
  {
    id: "navy-ice",
    background: "#f2f5f7",
    surface: "#ffffff",
    surfaceSoft: "#e4eaee",
    text: "#101820",
    muted: "#66727b",
    accent: "#356d86",
    accentStrong: "#234f63",
    accentContrast: "#ffffff",
    dark: "#101b22",
    line: "rgba(16,24,32,.13)",
  },
  {
    id: "burgundy-ivory",
    background: "#f6f1ec",
    surface: "#fffaf5",
    surfaceSoft: "#eaded6",
    text: "#201716",
    muted: "#74645f",
    accent: "#8b4b4d",
    accentStrong: "#683538",
    accentContrast: "#ffffff",
    dark: "#211719",
    line: "rgba(32,23,22,.13)",
  },
  {
    id: "indigo-stone",
    background: "#f3f3f5",
    surface: "#ffffff",
    surfaceSoft: "#e5e4e9",
    text: "#16161b",
    muted: "#696872",
    accent: "#57558f",
    accentStrong: "#3f3d70",
    accentContrast: "#ffffff",
    dark: "#17171d",
    line: "rgba(22,22,27,.13)",
  },
  {
    id: "olive-linen",
    background: "#f4f2e8",
    surface: "#fffdf6",
    surfaceSoft: "#e7e3d1",
    text: "#191b16",
    muted: "#6a6e60",
    accent: "#707a49",
    accentStrong: "#525b34",
    accentContrast: "#ffffff",
    dark: "#181c15",
    line: "rgba(25,27,22,.13)",
  },
  {
    id: "cobalt-white",
    background: "#f4f6fa",
    surface: "#ffffff",
    surfaceSoft: "#e7ebf3",
    text: "#111722",
    muted: "#687080",
    accent: "#3d62a8",
    accentStrong: "#294984",
    accentContrast: "#ffffff",
    dark: "#101722",
    line: "rgba(17,23,34,.13)",
  },
  {
    id: "copper-charcoal",
    background: "#f3f0ec",
    surface: "#fffdfa",
    surfaceSoft: "#e8e0d8",
    text: "#191715",
    muted: "#706861",
    accent: "#b16d42",
    accentStrong: "#874b29",
    accentContrast: "#ffffff",
    dark: "#171614",
    line: "rgba(25,23,21,.14)",
  },
];

export const resolvePageNovaPaletteV5 = (
  project: SiteProject,
): PageNovaPaletteV5 => {
  const visual = project.visualDirection;

  const seed = [
    project.id || "",
    project.name || "",
    project.style || "",
    visual?.heroLayout || "",
    visual?.heroAlignment || "",
    visual?.heroContentWidth || "",
    visual?.imageFocus || "",
    visual?.density || "",
    visual?.cardStyle || "",
  ].join("|");

  return PALETTES_V5[
    stableHashV5(seed) % PALETTES_V5.length
  ];
};

export const pageNovaPaletteStyleV5 = (
  palette: PageNovaPaletteV5,
): string =>
  [
    `--pn001-bg:${palette.background}`,
    `--pn001-surface:${palette.surface}`,
    `--pn001-surface-soft:${palette.surfaceSoft}`,
    `--pn001-text:${palette.text}`,
    `--pn001-muted:${palette.muted}`,
    `--pn001-accent:${palette.accent}`,
    `--pn001-accent-strong:${palette.accentStrong}`,
    `--pn001-accent-contrast:${palette.accentContrast}`,
    `--pn001-dark:${palette.dark}`,
    `--pn001-line:${palette.line}`,
  ].join(";");

/* ==========================================================
   HOME COMPLETENESS
   ========================================================== */

const kindOf = (
  section: SitePage["sections"][number],
): string => String(section.kind || "");

const hasKind = (
  sections: SitePage["sections"],
  kinds: readonly string[],
): boolean =>
  sections.some((section) =>
    kinds.includes(kindOf(section)),
  );

export const completeHomeSectionsV5 = (
  project: SiteProject,
  page: SitePage,
): SitePage["sections"] => {
  const sections = [...page.sections];

  /*
   * Do not fabricate business facts.
   * Fallback sections use only project/page information
   * and generic process/presentation copy.
   */

  if (
    !hasKind(sections, [
      "services",
      "products",
      "benefits",
      "features",
    ])
  ) {
    sections.push({
      title: "O que podemos desenvolver juntos",
      body:
        "Conheça as principais possibilidades apresentadas pela empresa e encontre o caminho mais adequado para sua necessidade.",
      kind: "services",
      items: [
        {
          title: "Soluções personalizadas",
          body:
            "Uma abordagem construída a partir das necessidades, objetivos e contexto de cada projeto.",
        },
        {
          title: "Planejamento",
          body:
            "Definição clara de prioridades, etapas e próximos passos antes da execução.",
        },
        {
          title: "Acompanhamento",
          body:
            "Comunicação objetiva durante o desenvolvimento para manter decisões e expectativas alinhadas.",
        },
      ],
    });
  }

  if (!hasKind(sections, ["about", "authority"])) {
    sections.push({
      title: `Conheça ${project.name || "a empresa"}`,
      body:
        page.introduction ||
        "Uma apresentação da proposta, da forma de trabalho e dos princípios que orientam cada entrega.",
      kind: "about",
    });
  }

  if (!hasKind(sections, ["process"])) {
    sections.push({
      title: "Como funciona",
      body:
        "Um processo organizado para transformar a necessidade inicial em próximos passos claros.",
      kind: "process",
      items: [
        {
          title: "01 · Conversa inicial",
          body:
            "Entendimento do contexto, das necessidades e do objetivo principal.",
        },
        {
          title: "02 · Direção",
          body:
            "Organização das prioridades e definição do caminho mais adequado.",
        },
        {
          title: "03 · Desenvolvimento",
          body:
            "Execução e acompanhamento das etapas previstas.",
        },
      ],
    });
  }

  /*
   * Portfolio/gallery is only added when institutional images
   * actually exist. This avoids fake projects/cases.
   */
  const institutional = project.institutional;

  const hasVisualMaterial = Boolean(
    institutional?.portrait ||
    institutional?.businessPhoto ||
    institutional?.workPhoto
  );

  if (
    hasVisualMaterial &&
    !hasKind(sections, ["portfolio", "gallery"])
  ) {
    sections.push({
      title: "Uma visão do trabalho",
      body:
        "Alguns registros visuais ajudam a apresentar a linguagem, o cuidado e a forma como o trabalho ganha vida.",
      kind: "gallery",
    });
  }

  return sections;
};

/* ==========================================================
   V5 VISUAL STABILIZATION
   ========================================================== */

export const PAGENOVA_DESIGN_CORE_V5_STYLES = `

  /* ========================================================
     GLOBAL COLOR SYSTEM
     Remove PageNova green identity from generated sites.
     ======================================================== */

  .pn001-site {
    background: var(--pn001-bg) !important;
    color: var(--pn001-text) !important;
  }

  .pn001-site .pn001-kicker,
  .pn001-site .pn001-pill {
    color: var(--pn001-accent-strong) !important;
  }

  .pn001-site .pn001-pill {
    border-color: var(--pn001-line) !important;
    background: color-mix(
      in srgb,
      var(--pn001-accent) 8%,
      transparent
    ) !important;
  }

  .pn001-site .pn001-button-primary {
    background: var(--pn001-accent) !important;
    border-color: var(--pn001-accent) !important;
    color: var(--pn001-accent-contrast) !important;
  }

  /* ========================================================
     HEADER V5
     Compact, independent, aligned.
     ======================================================== */

  .pn001-site .pn001-header {
    padding: 0 !important;
    background: var(--pn001-surface) !important;
    border-bottom: 1px solid var(--pn001-line) !important;
  }

  .pn001-site .pn001-header-inner {
    min-height: 76px !important;
    max-width: 1180px !important;
    margin: 0 auto !important;
    padding: 10px 24px !important;

    border: 0 !important;
    border-radius: 0 !important;

    background: transparent !important;
    box-shadow: none !important;
  }

  .pn001-site .pn001-brand-symbol {
    background: var(--pn001-accent) !important;
    color: var(--pn001-accent-contrast) !important;
  }

  .pn001-site .pn001-brand-name {
    color: var(--pn001-text) !important;
  }

  .pn001-site .pn001-header-cta {
    min-height: 44px !important;
    padding: 0 20px !important;

    background: var(--pn001-dark) !important;
    border-color: var(--pn001-dark) !important;
    color: #fff !important;
  }

  .pn001-site .pn001-menu-button {
    width: 44px !important;
    height: 44px !important;

    background: var(--pn001-accent) !important;
    border-color: var(--pn001-accent) !important;
  }

  /* ========================================================
     HERO V5
     Stop giant typography.
     ======================================================== */

  .pn001-site .pn001-hero {
    min-height: auto !important;

    padding-top:
      clamp(58px, 6.2vw, 88px) !important;

    padding-bottom:
      clamp(62px, 7vw, 96px) !important;
  }

  .pn001-site .pn001-hero-grid {
    align-items: center !important;
    gap: clamp(42px, 6vw, 84px) !important;
  }

  .pn001-site .pn001-hero-copy {
    max-width: 620px !important;
  }

  .pn001-site .pn001-hero h1 {
    max-width: 11.5ch !important;

    margin-top: 22px !important;
    margin-bottom: 22px !important;

    font-size:
      clamp(48px, 5.6vw, 78px) !important;

    line-height: .94 !important;
    letter-spacing: -.055em !important;

    text-wrap: balance !important;
  }

  .pn001-site .pn001-hero-copy > p {
    max-width: 590px !important;

    font-size:
      clamp(17px, 1.45vw, 20px) !important;

    line-height: 1.58 !important;
  }

  .pn001-site .pn001-hero-media {
    min-height: 460px !important;
    max-height: 590px !important;
  }

  .pn001-site .pn001-hero-media img {
    width: 100% !important;
    height: 100% !important;

    min-height: 460px !important;
    max-height: 590px !important;

    object-fit: cover !important;
  }

  /* ========================================================
     SECTION ACCENTS
     ======================================================== */

  .pn001-site .pn001-services,
  .pn001-site .pn001-features,
  .pn001-site .pn001-benefits,
  .pn001-site .pn001-testimonials-v6 {
    background:
      color-mix(
        in srgb,
        var(--pn001-accent) 5%,
        var(--pn001-bg)
      ) !important;
  }

  .pn001-site .pn001-about {
    background: var(--pn001-dark) !important;
  }

  .pn001-site .pn001-about h2,
  .pn001-site .pn001-about .pn001-kicker {
    color: #fff !important;
  }

  /* ========================================================
     FINAL CTA V5
     No giant green card.
     ======================================================== */

  .pn001-site .pn001-final-cta {
    padding:
      clamp(70px, 8vw, 110px)
      0 !important;

    background: var(--pn001-bg) !important;
  }

  .pn001-site .pn001-final-cta-card,
  .pn001-site .pn-v2-final-cta .pn001-final-cta-card {

    position: relative !important;

    display: grid !important;

    grid-template-columns:
      minmax(0, 1fr)
      auto !important;

    align-items: end !important;

    gap: 54px !important;

    min-height: 0 !important;

    padding:
      clamp(42px, 5vw, 68px) !important;

    border:
      1px solid
      var(--pn001-line) !important;

    border-radius: 26px !important;

    background: var(--pn001-dark) !important;

    color: #ffffff !important;

    box-shadow:
      0 24px 70px
      rgba(0,0,0,.10) !important;

    overflow: hidden !important;
  }

  .pn001-site .pn001-final-cta-card::before {
    content: "" !important;

    position: absolute !important;
    right: -90px !important;
    top: -130px !important;

    width: 310px !important;
    height: 310px !important;

    border-radius: 50% !important;

    border:
      1px solid
      color-mix(
        in srgb,
        var(--pn001-accent) 60%,
        transparent
      ) !important;

    pointer-events: none !important;
  }

  .pn001-site .pn001-final-cta-copy {
    position: relative !important;
    z-index: 1 !important;

    max-width: 700px !important;
  }

  .pn001-site .pn001-final-cta .pn001-kicker {
    color: var(--pn001-accent) !important;
  }

  .pn001-site .pn001-final-cta h2 {
    max-width: 12ch !important;

    margin:
      16px
      0
      20px !important;

    color: #fff !important;

    font-size:
      clamp(38px, 4.5vw, 64px) !important;

    line-height: .98 !important;
    letter-spacing: -.045em !important;
  }

  .pn001-site .pn001-final-cta p {
    max-width: 620px !important;

    color:
      rgba(255,255,255,.72) !important;

    font-size: 17px !important;
    line-height: 1.6 !important;
  }

  .pn001-site .pn001-final-cta-action {
    position: relative !important;
    z-index: 1 !important;
  }

  .pn001-site
  .pn001-final-cta
  .pn001-button-primary {

    min-width: 170px !important;

    background: var(--pn001-accent) !important;
    color: var(--pn001-accent-contrast) !important;

    border-color:
      var(--pn001-accent) !important;
  }

  /* ========================================================
     CONTACT
     ======================================================== */

  .pn001-site .pn001-contact-form button {
    background: var(--pn001-accent) !important;
    border-color: var(--pn001-accent) !important;
    color: var(--pn001-accent-contrast) !important;
  }

  /* ========================================================
     FOOTER
     ======================================================== */

  .pn001-site .pn001-footer {
    background: var(--pn001-dark) !important;
  }

  .pn001-site .pn001-footer .pn001-brand-symbol {
    background: var(--pn001-accent) !important;
  }

  /* ========================================================
     TABLET
     ======================================================== */

  @media (max-width: 980px) {

    .pn001-site .pn001-hero h1 {
      font-size:
        clamp(46px, 7vw, 68px) !important;
    }

    .pn001-site .pn001-hero-media,
    .pn001-site .pn001-hero-media img {
      min-height: 390px !important;
      max-height: 520px !important;
    }

    .pn001-site .pn001-final-cta-card {
      grid-template-columns: 1fr !important;
      align-items: start !important;
      gap: 32px !important;
    }
  }

  /* ========================================================
     MOBILE
     ======================================================== */

  @media (max-width: 700px) {

    .pn001-site .pn001-header-inner {
      min-height: 66px !important;
      padding: 8px 14px !important;
    }

    .pn001-site .pn001-header-cta {
      display: none !important;
    }

    .pn001-site .pn001-hero {
      padding-top: 48px !important;
      padding-bottom: 58px !important;
    }

    .pn001-site .pn001-hero h1 {
      max-width: 12ch !important;

      font-size:
        clamp(40px, 12vw, 58px) !important;

      line-height: .96 !important;
    }

    .pn001-site .pn001-hero-media,
    .pn001-site .pn001-hero-media img {
      min-height: 320px !important;
      max-height: 430px !important;
    }

    .pn001-site .pn001-final-cta {
      padding: 64px 0 !important;
    }

    .pn001-site .pn001-final-cta-card {
      padding: 34px 26px !important;
      border-radius: 20px !important;
    }

    .pn001-site .pn001-final-cta h2 {
      font-size:
        clamp(36px, 11vw, 50px) !important;
    }
  }
`;