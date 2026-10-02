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

/* ==========================================================
   PAGENOVA DESIGN LIBRARY V2
   Structural composition systems
   ========================================================== */

export const PAGENOVA_DESIGN_LIBRARY_V2_STYLES = `
  /* ========================================================
     V2 SHARED
     ======================================================== */

  .pn001-site[data-pagenova-design-version="2"],
  .pn001-site[data-pagenova-design-version="3"] {
    --pn-v2-gap: clamp(28px, 5vw, 72px);
  }

  .pn001-site[data-pagenova-design-version="2"],
  .pn001-site[data-pagenova-design-version="3"]
  .pn-v2-hero-visual {
    min-width: 0;
  }

  .pn001-site[data-pagenova-design-version="2"],
  .pn001-site[data-pagenova-design-version="3"]
  .pn-v2-card {
    transition:
      transform 220ms ease,
      box-shadow 220ms ease,
      border-color 220ms ease;
  }

  /* ========================================================
     EDITORIAL
     Hero: cinematic editorial composition
     Cards: numbered horizontal editorial list
     About: image-led magazine composition
     Testimonials: featured quote + supporting cards
     CTA: dark editorial panel
     ======================================================== */

  .pn-design-editorial .pn-v2-hero {
    position: relative;
    padding:
      clamp(72px, 8vw, 118px)
      0
      clamp(96px, 10vw, 150px);
  }

  .pn-design-editorial .pn-v2-hero-grid {
    position: relative;
    display: grid;
    grid-template-columns:
      minmax(0, .82fr)
      minmax(460px, 1.18fr);
    gap: clamp(36px, 6vw, 94px);
    align-items: end;
  }

  .pn-design-editorial .pn-v2-hero-copy {
    position: relative;
    z-index: 2;
    padding-bottom: clamp(22px, 5vw, 76px);
  }

  .pn-design-editorial .pn-v2-hero-copy h1 {
    max-width: 720px;
    font-family:
      Georgia,
      "Times New Roman",
      serif;
    font-size: clamp(58px, 7.5vw, 108px);
    font-weight: 500;
    line-height: .88;
    letter-spacing: -.065em;
  }

  .pn-design-editorial .pn-v2-hero-copy > p {
    max-width: 520px;
    font-size: 18px;
    line-height: 1.75;
  }

  .pn-design-editorial .pn-v2-hero-visual {
    position: relative;
  }

  .pn-design-editorial .pn-v2-hero-visual::before {
    content: "";
    position: absolute;
    width: 44%;
    height: 62%;
    left: -9%;
    bottom: -7%;
    z-index: -1;
    border-radius: 999px 999px 24px 24px;
    background: rgba(26,155,112,.10);
  }

  .pn-design-editorial .pn-v2-hero-visual
  .pn001-hero-image,
  .pn-design-editorial .pn-v2-hero-visual
  .pn001-visual-placeholder {
    min-height: clamp(560px, 68vw, 760px);
    border-radius: 160px 18px 18px 18px;
    object-fit: cover;
  }

  .pn-design-editorial .pn-v2-card-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
    border-top: 1px solid var(--pn001-line);
  }

  .pn-design-editorial .pn-v2-card {
    display: grid;
    grid-template-columns:
      120px
      minmax(0, .9fr)
      minmax(260px, 1.1fr);
    min-height: 0;
    align-items: center;
    gap: 28px;
    padding: 30px 0;
    border: 0;
    border-bottom: 1px solid var(--pn001-line);
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .pn-design-editorial .pn-v2-card:hover {
    transform: translateX(8px);
  }

  .pn-design-editorial .pn-v2-card
  .pn001-card-index {
    height: auto;
    padding: 0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 46px;
    font-weight: 400;
  }

  .pn-design-editorial .pn-v2-card
  .pn001-card-image {
    grid-column: 1 / 2;
    width: 96px;
    height: 96px;
    border-radius: 50%;
  }

  .pn-design-editorial .pn-v2-card
  .pn001-card-content {
    grid-column: 2 / -1;
    padding: 0;
  }

  .pn-design-editorial .pn-v2-card
  .pn001-card-content h3 {
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(25px, 3vw, 38px);
    font-weight: 500;
  }

  .pn-design-editorial .pn-v2-about {
    padding-top: clamp(100px, 12vw, 170px);
    padding-bottom: clamp(100px, 12vw, 170px);
  }

  .pn-design-editorial .pn-v2-about-grid {
    grid-template-columns:
      minmax(0, .72fr)
      minmax(480px, 1.28fr);
    gap: clamp(50px, 9vw, 140px);
  }

  .pn-design-editorial .pn-v2-about-copy {
    align-self: end;
    padding-bottom: 40px;
  }

  .pn-design-editorial .pn-v2-about-copy h2 {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 500;
    font-size: clamp(50px, 6vw, 84px);
    line-height: .94;
  }

  .pn-design-editorial .pn-v2-about
  .pn001-about-image {
    min-height: 650px;
    border-radius: 14px 140px 14px 14px;
  }

  .pn-design-editorial .pn-v2-testimonial-layout {
    display: grid;
    grid-template-columns:
      minmax(0, 1.35fr)
      minmax(260px, .65fr);
    grid-auto-flow: row;
    grid-auto-columns: unset;
    overflow: visible;
    gap: 18px;
  }

  .pn-design-editorial .pn-v2-testimonial-layout
  .pn001-testimonial-card-v6:first-child {
    grid-row: span 2;
    min-height: 100%;
    padding: clamp(30px, 5vw, 58px);
  }

  .pn-design-editorial .pn-v2-testimonial-layout
  .pn001-testimonial-card-v6:first-child > p {
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(24px, 3vw, 38px);
    line-height: 1.3;
  }

  .pn-design-editorial .pn-v2-testimonial-layout
  .pn001-testimonial-card-v6:nth-child(n+4) {
    display: none;
  }

  .pn-design-editorial .pn-v2-final-cta-card {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      auto;
    gap: 50px;
    align-items: end;
    padding: clamp(48px, 7vw, 92px);
    border-radius: 12px 90px 12px 12px;
    background: #111814;
    color: #fff;
  }

  .pn-design-editorial .pn-v2-final-cta-card h2 {
    max-width: 800px;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(46px, 6vw, 78px);
    font-weight: 500;
    line-height: .95;
  }

  .pn-design-editorial .pn-v2-final-cta-card p {
    color: rgba(255,255,255,.64);
  }

  /* ========================================================
     STUDIO
     Hero: precise split
     Cards: asymmetric bento
     About: framed studio module
     Testimonials: clean 3-column grid
     CTA: floating conversion card
     ======================================================== */

  .pn-design-studio .pn-v2-hero {
    padding:
      clamp(62px, 7vw, 100px)
      0
      clamp(82px, 9vw, 132px);
  }

  .pn-design-studio .pn-v2-hero-grid {
    grid-template-columns:
      minmax(0, .95fr)
      minmax(460px, 1.05fr);
    gap: clamp(42px, 6vw, 82px);
  }

  .pn-design-studio .pn-v2-hero-copy {
    padding:
      clamp(12px, 2vw, 28px)
      0;
  }

  .pn-design-studio .pn-v2-hero-copy h1 {
    max-width: 760px;
    font-size: clamp(58px, 6.7vw, 96px);
    line-height: .91;
  }

  .pn-design-studio .pn-v2-hero-visual
  .pn001-hero-image,
  .pn-design-studio .pn-v2-hero-visual
  .pn001-visual-placeholder {
    min-height: 650px;
    border-radius: 28px;
  }

  .pn-design-studio .pn-v2-card-grid {
    display: grid;
    grid-template-columns:
      repeat(12, minmax(0, 1fr));
    gap: 16px;
  }

  .pn-design-studio .pn-v2-card {
    grid-column: span 4;
    min-height: 320px;
  }

  .pn-design-studio .pn-v2-card:nth-child(1),
  .pn-design-studio .pn-v2-card:nth-child(5) {
    grid-column: span 7;
  }

  .pn-design-studio .pn-v2-card:nth-child(2),
  .pn-design-studio .pn-v2-card:nth-child(6) {
    grid-column: span 5;
  }

  .pn-design-studio .pn-v2-card:nth-child(1)
  .pn001-card-image,
  .pn-design-studio .pn-v2-card:nth-child(5)
  .pn001-card-image {
    height: 280px;
  }

  .pn-design-studio .pn-v2-card:hover {
    transform: translateY(-7px);
  }

  .pn-design-studio .pn-v2-about {
    margin:
      clamp(30px, 4vw, 60px)
      clamp(16px, 3vw, 44px);
    border-radius: 38px;
  }

  .pn-design-studio .pn-v2-about-grid {
    grid-template-columns:
      minmax(0, 1fr)
      minmax(420px, .92fr);
    gap: clamp(46px, 7vw, 96px);
  }

  .pn-design-studio .pn-v2-about
  .pn001-about-image {
    min-height: 560px;
    border-radius: 24px;
  }

  .pn-design-studio .pn-v2-testimonial-layout {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    grid-auto-flow: row;
    grid-auto-columns: unset;
    overflow: visible;
    gap: 16px;
  }

  .pn-design-studio .pn-v2-testimonial-layout
  .pn001-testimonial-card-v6:nth-child(n+7) {
    display: none;
  }

  .pn-design-studio .pn-v2-final-cta-card {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      auto;
    align-items: center;
    gap: 46px;
    padding: clamp(42px, 6vw, 72px);
    border: 1px solid rgba(16,21,19,.08);
    border-radius: 32px;
    background:
      radial-gradient(
        circle at 92% 8%,
        rgba(34,185,133,.22),
        transparent 34%
      ),
      #ffffff;
    color: var(--pn001-text);
    box-shadow: 0 30px 90px rgba(11,21,17,.09);
  }

  /* ========================================================
     BOLD
     Hero: impact split / oversized typography
     Cards: hard graphic grid
     About: poster composition
     Testimonials: hard grid
     CTA: conversion billboard
     ======================================================== */

  .pn-design-bold .pn-v2-hero {
    min-height: 820px;
    display: flex;
    align-items: center;
  }

  .pn-design-bold .pn-v2-hero-grid {
    width: min(calc(100% - 48px), 1320px);
    grid-template-columns:
      minmax(0, 1.14fr)
      minmax(390px, .86fr);
    gap: clamp(38px, 5vw, 78px);
  }

  .pn-design-bold .pn-v2-hero-copy h1 {
    max-width: 900px;
    font-size: clamp(70px, 8.4vw, 126px);
    line-height: .82;
    text-transform: none;
  }

  .pn-design-bold .pn-v2-hero-visual
  .pn001-hero-image,
  .pn-design-bold .pn-v2-hero-visual
  .pn001-visual-placeholder {
    min-height: 620px;
    border: 2px solid rgba(255,255,255,.2);
    border-radius: 2px;
    box-shadow: 14px 14px 0 #22b985;
  }

  .pn-design-bold .pn-v2-card-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .pn-design-bold .pn-v2-card {
    min-height: 340px;
    border: 2px solid #07110d;
    border-radius: 2px;
  }

  .pn-design-bold .pn-v2-card:nth-child(3n+1) {
    grid-column: span 2;
    display: grid;
    grid-template-columns:
      minmax(260px, .72fr)
      minmax(0, 1.28fr);
  }

  .pn-design-bold .pn-v2-card:nth-child(3n+1)
  .pn001-card-image {
    width: 100%;
    height: 100%;
    min-height: 340px;
  }

  .pn-design-bold .pn-v2-card:hover {
    transform: translate(-7px, -7px);
    box-shadow: 9px 9px 0 #22b985;
  }

  .pn-design-bold .pn-v2-about {
    border-top: 2px solid #22b985;
    border-bottom: 2px solid #22b985;
  }

  .pn-design-bold .pn-v2-about-grid {
    grid-template-columns:
      minmax(0, 1.08fr)
      minmax(380px, .92fr);
    gap: clamp(50px, 8vw, 120px);
  }

  .pn-design-bold .pn-v2-about-copy h2 {
    font-size: clamp(60px, 7.5vw, 104px);
    line-height: .86;
  }

  .pn-design-bold .pn-v2-about
  .pn001-about-image {
    min-height: 600px;
    border: 2px solid rgba(255,255,255,.22);
    border-radius: 2px;
  }

  .pn-design-bold .pn-v2-testimonial-layout {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    grid-auto-flow: row;
    grid-auto-columns: unset;
    overflow: visible;
    gap: 12px;
  }

  .pn-design-bold .pn-v2-testimonial-layout
  .pn001-testimonial-card-v6:nth-child(n+7) {
    display: none;
  }

  .pn-design-bold .pn-v2-final-cta {
    padding-top: 30px;
    padding-bottom: 110px;
  }

  .pn-design-bold .pn-v2-final-cta-card {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      auto;
    align-items: end;
    gap: 60px;
    padding: clamp(52px, 7vw, 96px);
    border: 2px solid #07110d;
    border-radius: 2px;
    background: #22b985;
    color: #07110d;
    box-shadow: 12px 12px 0 #07110d;
  }

  .pn-design-bold .pn-v2-final-cta-card h2 {
    max-width: 900px;
    font-size: clamp(56px, 7vw, 98px);
    line-height: .86;
    letter-spacing: -.07em;
  }

  .pn-design-bold .pn-v2-final-cta-card p {
    max-width: 700px;
    color: rgba(7,17,13,.72);
  }

  .pn-design-bold .pn-v2-final-cta-card
  .pn001-button-primary {
    background: #07110d;
    color: #fff;
    box-shadow: none;
  }

  /* ========================================================
     FAQ DIFFERENT COMPOSITIONS
     ======================================================== */

  .pn-design-editorial .pn-v2-faq
  .pn001-faq-layout {
    grid-template-columns:
      minmax(300px, .62fr)
      minmax(0, 1.38fr);
  }

  .pn-design-editorial .pn-v2-faq
  .pn001-faq-intro h2 {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 500;
  }

  .pn-design-studio .pn-v2-faq
  .pn001-faq-list {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 12px;
    border-top: 0;
  }

  .pn-design-studio .pn-v2-faq
  .pn001-faq-item {
    padding: 0 20px;
    border: 1px solid var(--pn001-line);
    border-radius: 18px;
    background: #fff;
  }

  .pn-design-bold .pn-v2-faq
  .pn001-faq-layout {
    grid-template-columns:
      minmax(320px, .8fr)
      minmax(0, 1.2fr);
  }

  .pn-design-bold .pn-v2-faq
  .pn001-faq-item {
    border-bottom: 2px solid #07110d;
  }

  /* ========================================================
     FOOTER SYSTEMS
     ======================================================== */

  .pn-design-editorial .pn-v2-footer {
    padding-top: 86px;
    background: #111814;
  }

  .pn-design-editorial .pn-v2-footer
  .pn001-footer-main {
    grid-template-columns:
      minmax(0, 1.4fr)
      minmax(180px, .3fr)
      minmax(220px, .3fr);
    gap: 70px;
  }

  .pn-design-studio .pn-v2-footer {
    margin: 0 18px 18px;
    border-radius: 32px;
    background: #0d1713;
  }

  .pn-design-bold .pn-v2-footer {
    padding-top: 72px;
    border-top: 8px solid #22b985;
    background: #050c09;
  }

  .pn-design-bold .pn-v2-footer
  .pn001-footer-main {
    grid-template-columns:
      minmax(0, 1.5fr)
      minmax(170px, .25fr)
      minmax(220px, .25fr);
  }

  /* ========================================================
     RESPONSIVE V2
     ======================================================== */

  @media (max-width: 980px) {
    .pn-design-editorial .pn-v2-hero-grid,
    .pn-design-studio .pn-v2-hero-grid,
    .pn-design-bold .pn-v2-hero-grid,
    .pn-design-editorial .pn-v2-about-grid,
    .pn-design-studio .pn-v2-about-grid,
    .pn-design-bold .pn-v2-about-grid,
    .pn-design-editorial .pn-v2-final-cta-card,
    .pn-design-studio .pn-v2-final-cta-card,
    .pn-design-bold .pn-v2-final-cta-card {
      grid-template-columns: 1fr;
    }

    .pn-design-editorial .pn-v2-card {
      grid-template-columns:
        90px
        minmax(0, 1fr);
    }

    .pn-design-studio .pn-v2-card {
      grid-column: span 6;
    }

    .pn-design-studio .pn-v2-card:nth-child(1),
    .pn-design-studio .pn-v2-card:nth-child(2),
    .pn-design-studio .pn-v2-card:nth-child(5),
    .pn-design-studio .pn-v2-card:nth-child(6) {
      grid-column: span 6;
    }

    .pn-design-bold .pn-v2-card:nth-child(3n+1) {
      grid-template-columns: 1fr;
    }

    .pn-design-editorial .pn-v2-testimonial-layout,
    .pn-design-studio .pn-v2-testimonial-layout,
    .pn-design-bold .pn-v2-testimonial-layout {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .pn-design-editorial .pn-v2-testimonial-layout
    .pn001-testimonial-card-v6:first-child {
      grid-row: auto;
    }

    .pn-design-studio .pn-v2-faq
    .pn001-faq-list {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .pn-design-editorial .pn-v2-hero-grid,
    .pn-design-studio .pn-v2-hero-grid,
    .pn-design-bold .pn-v2-hero-grid {
      grid-template-columns: 1fr;
    }

    .pn-design-editorial .pn-v2-hero-copy h1,
    .pn-design-studio .pn-v2-hero-copy h1,
    .pn-design-bold .pn-v2-hero-copy h1 {
      font-size: clamp(48px, 14vw, 70px);
      line-height: .9;
    }

    .pn-design-editorial .pn-v2-hero-visual
    .pn001-hero-image,
    .pn-design-editorial .pn-v2-hero-visual
    .pn001-visual-placeholder,
    .pn-design-studio .pn-v2-hero-visual
    .pn001-hero-image,
    .pn-design-studio .pn-v2-hero-visual
    .pn001-visual-placeholder,
    .pn-design-bold .pn-v2-hero-visual
    .pn001-hero-image,
    .pn-design-bold .pn-v2-hero-visual
    .pn001-visual-placeholder {
      min-height: 430px;
    }

    .pn-design-editorial .pn-v2-hero-visual
    .pn001-hero-image,
    .pn-design-editorial .pn-v2-hero-visual
    .pn001-visual-placeholder {
      border-radius: 70px 12px 12px 12px;
    }

    .pn-design-studio .pn-v2-card-grid {
      grid-template-columns: 1fr;
    }

    .pn-design-studio .pn-v2-card,
    .pn-design-studio .pn-v2-card:nth-child(1),
    .pn-design-studio .pn-v2-card:nth-child(2),
    .pn-design-studio .pn-v2-card:nth-child(5),
    .pn-design-studio .pn-v2-card:nth-child(6) {
      grid-column: auto;
    }

    .pn-design-bold .pn-v2-card-grid {
      grid-template-columns: 1fr;
    }

    .pn-design-bold .pn-v2-card:nth-child(3n+1) {
      grid-column: auto;
    }

    .pn-design-editorial .pn-v2-testimonial-layout,
    .pn-design-studio .pn-v2-testimonial-layout,
    .pn-design-bold .pn-v2-testimonial-layout {
      grid-template-columns: 1fr;
    }

    .pn-design-editorial .pn-v2-final-cta-card,
    .pn-design-studio .pn-v2-final-cta-card,
    .pn-design-bold .pn-v2-final-cta-card {
      padding: 34px 24px;
    }

    .pn-design-bold .pn-v2-final-cta-card {
      box-shadow: 7px 7px 0 #07110d;
    }

    .pn-design-studio .pn-v2-footer {
      margin: 0 8px 8px;
      border-radius: 22px;
    }
  }
`;

/* ==========================================================
   PAGENOVA DESIGN LIBRARY V3
   Quality / density / media-aware composition
   ========================================================== */

export const PAGENOVA_DESIGN_LIBRARY_V3_STYLES = `

  /* ========================================================
     GLOBAL V3 RHYTHM
     ======================================================== */

  .pn001-site[data-pagenova-design-version="2"],
  .pn001-site[data-pagenova-design-version="3"]
  .pn001-section {
    scroll-margin-top: 40px;
  }

  .pn001-site[data-pagenova-design-version="2"],
  .pn001-site[data-pagenova-design-version="3"]
  .pn001-section-head {
    margin-bottom: clamp(34px, 5vw, 62px);
  }

  .pn001-site[data-pagenova-design-version="2"],
  .pn001-site[data-pagenova-design-version="3"]
  .pn001-section-head > p {
    max-width: 760px;
  }

  /* ========================================================
     CARD DENSITY
     Critical V3 fix:
     no huge empty Bento cards when there is no media.
     ======================================================== */

  .pn001-site
  .pn-v3-grid-text-only {
    align-items: stretch;
  }

  .pn001-site
  .pn-v3-grid-text-only
  .pn-v3-card-text {
    min-height: 0 !important;
  }

  .pn001-site
  .pn-v3-card-text
  .pn001-card-index {
    flex: 0 0 auto;
  }

  .pn001-site
  .pn-v3-card-text
  .pn001-card-content {
    min-height: 0;
  }

  .pn001-site
  .pn-v3-card-text
  .pn001-card-content p {
    max-width: 660px;
  }

  /* --------------------------------------------------------
     BOLD TEXT-ONLY SERVICES
     -------------------------------------------------------- */

  .pn-design-bold
  .pn-v3-grid-text-only {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .pn-design-bold
  .pn-v3-grid-text-only
  .pn-v3-card-text,
  .pn-design-bold
  .pn-v3-grid-text-only
  .pn-v3-card-text:nth-child(3n+1) {
    grid-column: auto;
    display: flex;
    flex-direction: column;
    min-height: 290px !important;
    padding: 30px 28px;
  }

  .pn-design-bold
  .pn-v3-grid-text-only
  .pn001-card-index {
    margin-bottom: auto;
    font-size: clamp(38px, 5vw, 64px);
    line-height: 1;
    opacity: .20;
  }

  .pn-design-bold
  .pn-v3-grid-text-only
  .pn001-card-content {
    padding: 0;
    margin-top: 54px;
  }

  .pn-design-bold
  .pn-v3-grid-text-only
  .pn001-card-content h3 {
    font-size: clamp(23px, 2.2vw, 32px);
    line-height: 1.05;
  }

  .pn-design-bold
  .pn-v3-grid-text-only
  .pn001-card-content p {
    margin-top: 14px;
    line-height: 1.65;
  }

  /* Media exists -> V2 Bento stays active */

  .pn-design-bold
  .pn-v3-grid-has-media
  .pn-v3-card-media {
    overflow: hidden;
  }

  .pn-design-bold
  .pn-v3-grid-has-media
  .pn001-card-image {
    object-fit: cover;
  }

  /* --------------------------------------------------------
     STUDIO TEXT-ONLY SERVICES
     -------------------------------------------------------- */

  .pn-design-studio
  .pn-v3-grid-text-only {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .pn-design-studio
  .pn-v3-grid-text-only
  .pn-v3-card-text,
  .pn-design-studio
  .pn-v3-grid-text-only
  .pn-v3-card-text:nth-child(1),
  .pn-design-studio
  .pn-v3-grid-text-only
  .pn-v3-card-text:nth-child(2),
  .pn-design-studio
  .pn-v3-grid-text-only
  .pn-v3-card-text:nth-child(5),
  .pn-design-studio
  .pn-v3-grid-text-only
  .pn-v3-card-text:nth-child(6) {
    grid-column: auto;
    min-height: 260px !important;
  }

  .pn-design-studio
  .pn-v3-grid-text-only
  .pn001-card-content {
    padding-top: 18px;
  }

  /* --------------------------------------------------------
     EDITORIAL TEXT-ONLY SERVICES
     -------------------------------------------------------- */

  .pn-design-editorial
  .pn-v3-grid-text-only
  .pn-v3-card-text {
    min-height: 0 !important;
    padding-top: 28px;
    padding-bottom: 28px;
  }

  /* ========================================================
     MEDIA CARDS
     ======================================================== */

  .pn-v3-card-media
  .pn001-card-image {
    display: block;
    width: 100%;
    object-fit: cover;
  }

  .pn-design-studio
  .pn-v3-card-media
  .pn001-card-image {
    min-height: 230px;
  }

  .pn-design-bold
  .pn-v3-card-media
  .pn001-card-image {
    min-height: 280px;
  }

  /* ========================================================
     ABOUT - reduce dead space
     ======================================================== */

  .pn-design-bold
  .pn-v2-about {
    padding-top: clamp(76px, 9vw, 118px);
    padding-bottom: clamp(76px, 9vw, 118px);
  }

  .pn-design-bold
  .pn-v2-about-grid {
    align-items: center;
  }

  .pn-design-bold
  .pn-v2-about
  .pn001-about-image {
    min-height: 520px;
    max-height: 680px;
    object-fit: cover;
  }

  .pn-design-studio
  .pn-v2-about
  .pn001-about-image {
    min-height: 500px;
  }

  /* ========================================================
     TESTIMONIALS V3
     Stronger hierarchy; less repetitive wall of cards.
     ======================================================== */

  .pn-design-bold
  .pn-v2-testimonial-layout {
    grid-template-columns:
      minmax(0, 1.2fr)
      minmax(0, .8fr)
      minmax(0, .8fr);
    gap: 14px;
  }

  .pn-design-bold
  .pn-v2-testimonial-layout
  .pn001-testimonial-card-v6:first-child {
    grid-row: span 2;
    padding: clamp(34px, 4vw, 52px);
  }

  .pn-design-bold
  .pn-v2-testimonial-layout
  .pn001-testimonial-card-v6:first-child > p {
    font-size: clamp(24px, 2.6vw, 36px);
    line-height: 1.35;
  }

  .pn-design-bold
  .pn-v2-testimonial-layout
  .pn001-testimonial-card-v6:nth-child(n+6) {
    display: none;
  }

  .pn-design-studio
  .pn-v2-testimonial-layout {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .pn-design-studio
  .pn-v2-testimonial-layout
  .pn001-testimonial-card-v6:first-child {
    grid-column: span 2;
  }

  .pn-design-studio
  .pn-v2-testimonial-layout
  .pn001-testimonial-card-v6:nth-child(n+6) {
    display: none;
  }

  .pn-design-editorial
  .pn-v2-testimonial-layout
  .pn001-testimonial-card-v6:nth-child(n+4) {
    display: none;
  }

  /* ========================================================
     FAQ V3
     ======================================================== */

  .pn001-site
  .pn-v2-faq {
    padding-top: clamp(80px, 9vw, 128px);
    padding-bottom: clamp(80px, 9vw, 128px);
  }

  .pn-design-bold
  .pn-v2-faq
  .pn001-faq-intro h2 {
    max-width: 520px;
    font-size: clamp(58px, 6vw, 88px);
    line-height: .88;
  }

  .pn-design-bold
  .pn-v2-faq
  .pn001-faq-item {
    padding-top: 23px;
    padding-bottom: 23px;
  }

  .pn-design-studio
  .pn-v2-faq
  .pn001-faq-item {
    min-height: 92px;
  }

  /* ========================================================
     CONTACT V3
     Remove excessive empty area around conversion section.
     ======================================================== */

  .pn001-site
  .pn001-contact {
    padding-top: clamp(72px, 8vw, 112px);
    padding-bottom: clamp(72px, 8vw, 112px);
  }

  .pn001-site
  .pn001-contact-card {
    min-height: 0;
  }

  /* ========================================================
     FINAL CTA V3
     More intentional closing, less isolated rectangle.
     ======================================================== */

  .pn001-site
  .pn-v2-final-cta {
    padding-top: clamp(36px, 5vw, 72px);
    padding-bottom: clamp(76px, 9vw, 120px);
  }

  .pn-design-bold
  .pn-v2-final-cta-card {
    position: relative;
    overflow: hidden;
    min-height: 430px;
    grid-template-columns:
      minmax(0, 1.25fr)
      minmax(220px, .35fr);
    align-items: end;
  }

  .pn-design-bold
  .pn-v2-final-cta-card::before {
    content: "";
    position: absolute;
    width: 320px;
    height: 320px;
    right: -90px;
    top: -130px;
    border: 2px solid rgba(7,17,13,.22);
    border-radius: 50%;
  }

  .pn-design-bold
  .pn-v2-final-cta-card::after {
    content: "";
    position: absolute;
    width: 180px;
    height: 180px;
    right: 80px;
    top: -70px;
    border: 2px solid rgba(7,17,13,.16);
    border-radius: 50%;
  }

  .pn-design-bold
  .pn001-final-cta-action {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: flex-end;
  }

  .pn-design-bold
  .pn001-final-cta-action
  .pn001-button {
    min-width: 190px;
    justify-content: center;
  }

  .pn-design-studio
  .pn-v2-final-cta-card {
    min-height: 360px;
  }

  .pn-design-editorial
  .pn-v2-final-cta-card {
    min-height: 390px;
  }

  /* ========================================================
     FOOTER TRANSITION
     ======================================================== */

  .pn001-site
  .pn-v2-footer {
    margin-top: 0;
  }

  /* ========================================================
     MOBILE V3
     ======================================================== */

  @media (max-width: 980px) {

    .pn-design-bold
    .pn-v3-grid-text-only,
    .pn-design-studio
    .pn-v3-grid-text-only {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .pn-design-bold
    .pn-v2-testimonial-layout,
    .pn-design-studio
    .pn-v2-testimonial-layout {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .pn-design-bold
    .pn-v2-testimonial-layout
    .pn001-testimonial-card-v6:first-child {
      grid-row: auto;
    }

    .pn-design-bold
    .pn-v2-final-cta-card {
      grid-template-columns: 1fr;
      min-height: 0;
    }

    .pn-design-bold
    .pn001-final-cta-action {
      justify-content: flex-start;
    }
  }

  @media (max-width: 700px) {

    .pn-design-bold
    .pn-v3-grid-text-only,
    .pn-design-studio
    .pn-v3-grid-text-only {
      grid-template-columns: 1fr;
    }

    .pn-design-bold
    .pn-v3-grid-text-only
    .pn-v3-card-text,
    .pn-design-studio
    .pn-v3-grid-text-only
    .pn-v3-card-text {
      min-height: 220px !important;
    }

    .pn-design-bold
    .pn-v2-testimonial-layout,
    .pn-design-studio
    .pn-v2-testimonial-layout,
    .pn-design-editorial
    .pn-v2-testimonial-layout {
      grid-template-columns: 1fr;
    }

    .pn-design-studio
    .pn-v2-testimonial-layout
    .pn001-testimonial-card-v6:first-child {
      grid-column: auto;
    }

    .pn-design-bold
    .pn-v2-about
    .pn001-about-image,
    .pn-design-studio
    .pn-v2-about
    .pn001-about-image {
      min-height: 390px;
    }

    .pn-design-bold
    .pn-v2-final-cta-card,
    .pn-design-studio
    .pn-v2-final-cta-card,
    .pn-design-editorial
    .pn-v2-final-cta-card {
      min-height: 0;
    }
  }
`;
