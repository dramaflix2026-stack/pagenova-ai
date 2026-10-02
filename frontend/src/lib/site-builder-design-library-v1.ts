import type { SiteProject } from "@/lib/site-builder";

export type PageNovaDesignVariant =
  | "editorial"
  | "studio"
  | "bold";

export type PageNovaDesignDirection = {
  id: PageNovaDesignVariant;
  name: string;
  className: string;
  description: string;
};

export const PAGENOVA_DESIGN_LIBRARY_V1 = {
  editorial: {
    id: "editorial",
    name: "Editorial",
    className: "pn-design-editorial",
    description:
      "Composição sofisticada, editorial, assimétrica e com bastante respiro.",
  },

  studio: {
    id: "studio",
    name: "Studio",
    className: "pn-design-studio",
    description:
      "Composição moderna, modular, precisa e orientada por grids.",
  },

  bold: {
    id: "bold",
    name: "Bold",
    className: "pn-design-bold",
    description:
      "Composição de alto impacto, tipografia grande e contraste forte.",
  },
} satisfies Record<
  PageNovaDesignVariant,
  PageNovaDesignDirection
>;

const stableHash = (value: string): number => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);

    hash = Math.imul(
      hash,
      16777619,
    );
  }

  return hash >>> 0;
};

export const resolvePageNovaDesignVariant = (
  project: SiteProject,
): PageNovaDesignVariant => {
  /*
   * Selection is deterministic.
   *
   * We intentionally do NOT use Math.random().
   * A project must preserve the same visual identity across
   * pages and across renders.
   *
   * VisualDirection participates in the seed when available,
   * so future AI planning can influence composition without
   * introducing niche-specific branches.
   */
  const visualSeed = project.visualDirection
    ? [
        project.visualDirection.heroLayout,
        project.visualDirection.heroAlignment,
        project.visualDirection.heroContentWidth,
        project.visualDirection.imageFocus,
        project.visualDirection.density,
        project.visualDirection.cardStyle,
      ].join("|")
    : "";

  const seed = [
    project.id,
    project.name,
    project.style,
    visualSeed,
  ].join("|");

  const variants: PageNovaDesignVariant[] = [
    "editorial",
    "studio",
    "bold",
  ];

  return variants[
    stableHash(seed) % variants.length
  ];
};

export const getPageNovaDesignDirection = (
  project: SiteProject,
): PageNovaDesignDirection => {
  const variant =
    resolvePageNovaDesignVariant(project);

  return PAGENOVA_DESIGN_LIBRARY_V1[
    variant
  ];
};

export const PAGENOVA_DESIGN_LIBRARY_V1_STYLES = `
  /* ==========================================================
     PAGENOVA DESIGN LIBRARY V1
     Three deterministic premium visual systems
     ========================================================== */

  /* ----------------------------------------------------------
     SHARED QUALITY PASS
     ---------------------------------------------------------- */

  .pn001-site {
    --pn-dl-radius-sm: 14px;
    --pn-dl-radius-md: 24px;
    --pn-dl-radius-lg: 36px;
    --pn-dl-shadow-soft:
      0 24px 70px rgba(10, 20, 16, 0.08);
  }

  .pn001-site .pn001-section {
    position: relative;
  }

  .pn001-site .pn001-button,
  .pn001-site .pn001-header-cta,
  .pn001-site .pn001-menu-button,
  .pn001-site a {
    transition:
      transform 180ms ease,
      box-shadow 180ms ease,
      background 180ms ease,
      border-color 180ms ease,
      opacity 180ms ease;
  }

  .pn001-site .pn001-button:hover,
  .pn001-site .pn001-header-cta:hover {
    transform: translateY(-2px);
  }

  .pn001-site .pn001-hero img,
  .pn001-site .pn001-about img {
    transition: transform 700ms cubic-bezier(.2,.8,.2,1);
  }

  .pn001-site .pn001-hero:hover img,
  .pn001-site .pn001-about:hover img {
    transform: scale(1.018);
  }

  /* ==========================================================
     01 — EDITORIAL
     Luxury / magazine / asymmetry
     ========================================================== */

  .pn-design-editorial {
    --pn001-bg: #f4f1eb;
    --pn001-surface: #fffdf9;
    --pn001-text: #151713;
    --pn001-muted: #6e7069;
    --pn001-line: rgba(21, 23, 19, 0.12);
  }

  .pn-design-editorial .pn001-header {
    padding-top: 22px;
  }

  .pn-design-editorial .pn001-header-inner {
    min-height: 68px;
    padding: 8px 8px 8px 4px;
    border: 0;
    border-bottom: 1px solid var(--pn001-line);
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
  }

  .pn-design-editorial .pn001-brand-symbol {
    border-radius: 50%;
  }

  .pn-design-editorial .pn001-header-cta {
    border-radius: 999px;
  }

  .pn-design-editorial .pn001-menu-button {
    border-radius: 999px;
  }

  .pn-design-editorial .pn001-hero {
    padding-top: clamp(72px, 9vw, 130px);
    padding-bottom: clamp(80px, 10vw, 150px);
    background:
      radial-gradient(
        circle at 82% 16%,
        rgba(30, 155, 111, .10),
        transparent 30%
      ),
      #f4f1eb;
  }

  .pn-design-editorial .pn001-hero-grid {
    grid-template-columns:
      minmax(0, .92fr)
      minmax(420px, 1.08fr);
    gap: clamp(60px, 8vw, 126px);
    align-items: center;
  }

  .pn-design-editorial .pn001-hero h1 {
    max-width: 760px;
    font-size: clamp(58px, 7.1vw, 104px);
    line-height: .88;
    letter-spacing: -.07em;
  }

  .pn-design-editorial .pn001-hero p {
    max-width: 590px;
    font-size: clamp(18px, 1.55vw, 22px);
    line-height: 1.7;
  }

  .pn-design-editorial .pn001-pill {
    border: 0;
    padding-left: 0;
    padding-right: 0;
    background: transparent;
    letter-spacing: .16em;
  }

  .pn-design-editorial .pn001-hero-media,
  .pn-design-editorial .pn001-hero-image {
    border-radius: 160px 18px 18px 18px;
    overflow: hidden;
  }

  .pn-design-editorial .pn001-section {
    padding-top: clamp(96px, 10vw, 150px);
    padding-bottom: clamp(96px, 10vw, 150px);
  }

  .pn-design-editorial .pn001-cards {
    gap: 1px;
    border-top: 1px solid var(--pn001-line);
    border-bottom: 1px solid var(--pn001-line);
  }

  .pn-design-editorial .pn001-card {
    border: 0;
    border-right: 1px solid var(--pn001-line);
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .pn-design-editorial .pn001-card:last-child {
    border-right: 0;
  }

  .pn-design-editorial .pn001-about {
    background: #151d19;
  }

  .pn-design-editorial .pn001-about-grid {
    gap: clamp(60px, 8vw, 120px);
  }

  .pn-design-editorial .pn001-testimonial-slider {
    grid-auto-columns: minmax(360px, 1fr);
  }

  .pn-design-editorial .pn001-testimonial-card-v6 {
    border-radius: 4px;
    box-shadow: none;
  }

  .pn-design-editorial .pn001-faq-v6 {
    background: #fffdf9;
  }

  .pn-design-editorial .pn001-final-cta-card {
    border-radius: 4px;
  }

  /* ==========================================================
     02 — STUDIO
     Modular / product-design / clean
     ========================================================== */

  .pn-design-studio {
    --pn001-bg: #eef2f0;
    --pn001-surface: #ffffff;
    --pn001-text: #0b1511;
    --pn001-muted: #68736e;
    --pn001-line: rgba(11, 21, 17, .09);
  }

  .pn-design-studio .pn001-header {
    padding-top: 16px;
  }

  .pn-design-studio .pn001-header-inner {
    min-height: 70px;
    border-radius: 16px;
    box-shadow:
      0 12px 40px rgba(11, 21, 17, .055);
  }

  .pn-design-studio .pn001-brand-symbol {
    border-radius: 10px;
  }

  .pn-design-studio .pn001-header-cta,
  .pn-design-studio .pn001-menu-button {
    border-radius: 10px;
  }

  .pn-design-studio .pn001-hero {
    padding-top: clamp(64px, 7vw, 100px);
    padding-bottom: clamp(70px, 8vw, 120px);
    background:
      linear-gradient(
        135deg,
        #eef4f1 0%,
        #f8faf9 55%,
        #e8f1ed 100%
      );
  }

  .pn-design-studio .pn001-hero-grid {
    grid-template-columns:
      minmax(0, 1fr)
      minmax(440px, .96fr);
    gap: clamp(34px, 5vw, 76px);
  }

  .pn-design-studio .pn001-hero h1 {
    font-size: clamp(54px, 6.2vw, 88px);
    line-height: .94;
    letter-spacing: -.06em;
  }

  .pn-design-studio .pn001-hero-media,
  .pn-design-studio .pn001-hero-image {
    border-radius: 28px;
    overflow: hidden;
  }

  .pn-design-studio .pn001-section {
    padding-top: clamp(82px, 8vw, 120px);
    padding-bottom: clamp(82px, 8vw, 120px);
  }

  .pn-design-studio .pn001-cards {
    gap: 18px;
  }

  .pn-design-studio .pn001-card {
    border-radius: 22px;
    background: rgba(255,255,255,.92);
    box-shadow:
      0 18px 55px rgba(11,21,17,.055);
  }

  .pn-design-studio .pn001-card:hover {
    transform: translateY(-5px);
    box-shadow:
      0 26px 70px rgba(11,21,17,.09);
  }

  .pn-design-studio .pn001-about {
    margin:
      clamp(28px, 4vw, 58px)
      clamp(16px, 3vw, 44px);
    border-radius: 34px;
    overflow: hidden;
  }

  .pn-design-studio .pn001-testimonials-v6 {
    margin:
      clamp(20px, 3vw, 42px)
      clamp(16px, 3vw, 44px);
    border-radius: 34px;
  }

  .pn-design-studio .pn001-testimonial-slider {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-flow: row;
    grid-auto-columns: unset;
    overflow: visible;
  }

  .pn-design-studio .pn001-testimonial-card-v6 {
    min-height: 330px;
    border-radius: 22px;
  }

  .pn-design-studio
  .pn001-testimonial-card-v6:nth-child(n+7) {
    display: none;
  }

  .pn-design-studio .pn001-faq-item {
    padding-left: 18px;
    padding-right: 18px;
    border-radius: 14px;
  }

  .pn-design-studio .pn001-final-cta-card {
    border-radius: 30px;
    box-shadow:
      0 24px 70px rgba(11,21,17,.10);
  }

  /* ==========================================================
     03 — BOLD
     High impact / strong contrast / large type
     ========================================================== */

  .pn-design-bold {
    --pn001-bg: #f6f7f4;
    --pn001-surface: #ffffff;
    --pn001-text: #07110d;
    --pn001-muted: #606a65;
    --pn001-line: rgba(7, 17, 13, .12);
  }

  .pn-design-bold .pn001-header {
    padding-top: 0;
    padding-bottom: 0;
    background: #07110d;
  }

  .pn-design-bold .pn001-header-inner {
    max-width: none;
    min-height: 82px;
    padding-left: clamp(24px, 5vw, 74px);
    padding-right: clamp(24px, 5vw, 74px);
    border: 0;
    border-radius: 0;
    background: #07110d;
    box-shadow: none;
  }

  .pn-design-bold .pn001-brand-name {
    color: #ffffff;
  }

  .pn-design-bold .pn001-brand-symbol {
    background: #22b985;
    color: #07110d;
    border-radius: 6px;
  }

  .pn-design-bold .pn001-header-cta {
    background: #ffffff;
    color: #07110d;
    border-radius: 4px;
  }

  .pn-design-bold .pn001-menu-button {
    background: #22b985;
    color: #07110d;
    border-radius: 4px;
  }

  .pn-design-bold .pn001-hero {
    min-height: min(820px, 88vh);
    padding-top: clamp(80px, 9vw, 140px);
    padding-bottom: clamp(80px, 9vw, 140px);
    background: #07110d;
    color: #ffffff;
  }

  .pn-design-bold .pn001-hero-grid {
    grid-template-columns:
      minmax(0, 1.08fr)
      minmax(380px, .92fr);
    gap: clamp(36px, 5vw, 80px);
  }

  .pn-design-bold .pn001-hero h1 {
    max-width: 880px;
    color: #ffffff;
    font-size: clamp(62px, 8vw, 118px);
    line-height: .84;
    letter-spacing: -.075em;
  }

  .pn-design-bold .pn001-hero p {
    max-width: 620px;
    color: rgba(255,255,255,.68);
    font-size: clamp(18px, 1.6vw, 23px);
  }

  .pn-design-bold .pn001-pill {
    border-color: rgba(255,255,255,.18);
    background: rgba(255,255,255,.07);
    color: #7ce1bd;
  }

  .pn-design-bold .pn001-hero-media,
  .pn-design-bold .pn001-hero-image {
    border-radius: 4px;
    overflow: hidden;
  }

  .pn-design-bold .pn001-section {
    padding-top: clamp(100px, 10vw, 160px);
    padding-bottom: clamp(100px, 10vw, 160px);
  }

  .pn-design-bold .pn001-section h2 {
    letter-spacing: -.065em;
  }

  .pn-design-bold .pn001-card {
    border: 2px solid #07110d;
    border-radius: 4px;
    box-shadow: none;
  }

  .pn-design-bold .pn001-card:hover {
    transform: translate(-5px, -5px);
    box-shadow: 7px 7px 0 #07110d;
  }

  .pn-design-bold .pn001-about {
    background: #07110d;
  }

  .pn-design-bold .pn001-about-grid {
    gap: clamp(40px, 7vw, 110px);
  }

  .pn-design-bold .pn001-testimonials-v6 {
    background: #dff5ec;
  }

  .pn-design-bold .pn001-testimonial-heading h2 {
    font-size: clamp(52px, 7vw, 92px);
    line-height: .88;
  }

  .pn-design-bold .pn001-testimonial-slider {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-flow: row;
    grid-auto-columns: unset;
    overflow: visible;
    gap: 12px;
  }

  .pn-design-bold .pn001-testimonial-card-v6 {
    min-height: 340px;
    border: 2px solid #07110d;
    border-radius: 4px;
    box-shadow: none;
  }

  .pn-design-bold
  .pn001-testimonial-card-v6:nth-child(n+7) {
    display: none;
  }

  .pn-design-bold .pn001-faq-v6 {
    background: #f6f7f4;
  }

  .pn-design-bold .pn001-faq-v6 .pn001-faq-intro h2 {
    font-size: clamp(54px, 7vw, 92px);
    line-height: .88;
  }

  .pn-design-bold .pn001-faq-item {
    border-bottom: 2px solid #07110d;
  }

  .pn-design-bold .pn001-final-cta-card {
    border-radius: 4px;
    background: #22b985;
    color: #07110d;
  }

  .pn-design-bold .pn001-footer {
    background: #050c09;
  }

  /* ==========================================================
     RESPONSIVE LIBRARY
     ========================================================== */

  @media (max-width: 980px) {
    .pn-design-editorial .pn001-hero-grid,
    .pn-design-studio .pn001-hero-grid,
    .pn-design-bold .pn001-hero-grid {
      grid-template-columns: 1fr;
    }

    .pn-design-editorial .pn001-hero h1,
    .pn-design-studio .pn001-hero h1,
    .pn-design-bold .pn001-hero h1 {
      max-width: 850px;
    }

    .pn-design-editorial .pn001-hero-media,
    .pn-design-editorial .pn001-hero-image {
      border-radius: 80px 18px 18px 18px;
    }

    .pn-design-studio .pn001-testimonial-slider,
    .pn-design-bold .pn001-testimonial-slider {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .pn-design-editorial .pn001-hero,
    .pn-design-studio .pn001-hero,
    .pn-design-bold .pn001-hero {
      min-height: auto;
      padding-top: 58px;
      padding-bottom: 72px;
    }

    .pn-design-editorial .pn001-hero h1,
    .pn-design-studio .pn001-hero h1,
    .pn-design-bold .pn001-hero h1 {
      font-size: clamp(48px, 14vw, 68px);
      line-height: .91;
    }

    .pn-design-editorial .pn001-section,
    .pn-design-studio .pn001-section,
    .pn-design-bold .pn001-section {
      padding-top: 76px;
      padding-bottom: 76px;
    }

    .pn-design-studio .pn001-about,
    .pn-design-studio .pn001-testimonials-v6 {
      margin-left: 8px;
      margin-right: 8px;
      border-radius: 22px;
    }

    .pn-design-studio .pn001-testimonial-slider,
    .pn-design-bold .pn001-testimonial-slider {
      display: grid;
      grid-template-columns: 1fr;
      overflow: visible;
    }

    .pn-design-studio
    .pn001-testimonial-card-v6:nth-child(n+4),
    .pn-design-bold
    .pn001-testimonial-card-v6:nth-child(n+4) {
      display: none;
    }

    .pn-design-bold .pn001-header-inner {
      min-height: 68px;
      padding-left: 14px;
      padding-right: 14px;
    }

    .pn-design-bold .pn001-header-cta {
      display: none;
    }
  }
`;