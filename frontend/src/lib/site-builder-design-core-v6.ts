/* ==========================================================
   PAGENOVA DESIGN CORE V6
   UNIFIED DESIGN DNA

   V6 is intentionally the LAST visual layer.

   Goals:
   - one visual identity across the whole generated website
   - no inherited fixed green/teal identity
   - palette from the project remains the source of truth
   - header and hero feel like one system
   - no fake 3D image effect
   - services/process cards inherit project identity
   - stable FAQ layout
   - automatic testimonial carousel
   - preserve semantic renderer and live editor
   ========================================================== */

export const PAGENOVA_DESIGN_CORE_V6_STYLES = `

  /* ========================================================
     DESIGN DNA
     ======================================================== */

  .pn001-site {
    --pn-v6-accent-soft:
      color-mix(
        in srgb,
        var(--pn001-accent) 11%,
        var(--pn001-surface)
      );

    --pn-v6-accent-soft-2:
      color-mix(
        in srgb,
        var(--pn001-accent) 6%,
        var(--pn001-bg)
      );

    --pn-v6-accent-line:
      color-mix(
        in srgb,
        var(--pn001-accent) 32%,
        transparent
      );

    --pn-v6-dark-line:
      color-mix(
        in srgb,
        var(--pn001-accent) 24%,
        rgba(255,255,255,.12)
      );

    --pn-v6-shadow:
      0 18px 48px rgba(15, 23, 42, .075);

    --pn-v6-shadow-hover:
      0 22px 58px rgba(15, 23, 42, .11);

    background: var(--pn001-bg) !important;
    color: var(--pn001-text) !important;
  }

  /* ========================================================
     HEADER
     Same identity as hero.
     ======================================================== */

  .pn001-site .pn001-header {
    position: relative !important;
    z-index: 50 !important;

    padding:
      14px
      clamp(18px, 4vw, 56px)
      0 !important;

    background: #ffffff !important;
    color: #111111 !important;

    border: 0 !important;
  }

  .pn001-site .pn001-header-inner {
    min-height: 72px !important;

    padding:
      10px
      12px
      10px
      14px !important;

    border:
      1px solid
      rgba(255,255,255,.10) !important;

    border-radius: 18px !important;

    background:
      color-mix(
        in srgb,
        var(--pn001-dark) 92%,
        var(--pn001-accent) 8%
      ) !important;

    box-shadow: none !important;

    backdrop-filter: blur(18px) !important;
    -webkit-backdrop-filter: blur(18px) !important;
  }

  .pn001-site .pn001-brand,
  .pn001-site .pn001-brand-name {
    color: #fff !important;
  }

  .pn001-site .pn001-brand-symbol {
    background: var(--pn001-accent) !important;
    color: var(--pn001-accent-contrast) !important;

    border:
      1px solid
      color-mix(
        in srgb,
        var(--pn001-accent) 72%,
        white
      ) !important;

    box-shadow: none !important;
  }

  .pn001-site .pn001-header-cta {
    background: var(--pn001-accent) !important;
    color: var(--pn001-accent-contrast) !important;

    border:
      1px solid
      var(--pn001-accent) !important;

    box-shadow: none !important;
  }

  .pn001-site .pn001-header-cta:hover {
    background: var(--pn001-accent-strong) !important;
    border-color: var(--pn001-accent-strong) !important;

    transform: translateY(-1px) !important;
    box-shadow: none !important;
  }

  .pn001-site .pn001-menu-button {
    background:
      color-mix(
        in srgb,
        var(--pn001-accent) 15%,
        transparent
      ) !important;

    color: var(--pn001-accent) !important;

    border:
      1px solid
      color-mix(
        in srgb,
        var(--pn001-accent) 36%,
        transparent
      ) !important;

    box-shadow: none !important;
  }

  .pn001-site .pn001-menu-button:hover {
    background: var(--pn001-accent) !important;
    color: var(--pn001-accent-contrast) !important;
  }

  /* ========================================================
     HERO
     ======================================================== */

  .pn001-site .pn001-hero {
    margin-top: 0 !important;

    background:
      radial-gradient(
        circle at 84% 14%,
        color-mix(
          in srgb,
          var(--pn001-accent) 14%,
          transparent
        ),
        transparent 34%
      ),
      var(--pn001-dark) !important;

    color: #fff !important;
  }

  .pn001-site .pn001-hero h1 {
    max-width: 780px !important;

    font-size:
      clamp(46px, 5.25vw, 76px) !important;

    line-height: .96 !important;
    letter-spacing: -.052em !important;

    color: #fff !important;
  }

  .pn001-site .pn001-hero p {
    color: rgba(255,255,255,.72) !important;
  }

  .pn001-site .pn001-hero .pn001-pill,
  .pn001-site .pn001-hero .pn001-kicker {
    color:
      color-mix(
        in srgb,
        var(--pn001-accent) 82%,
        white
      ) !important;
  }

  .pn001-site .pn001-hero-media,
  .pn001-site .pn001-hero-image {
    position: relative !important;

    transform: none !important;
    translate: none !important;

    box-shadow:
      0 26px 80px rgba(0,0,0,.20) !important;

    border:
      1px solid
      rgba(255,255,255,.10) !important;

    outline: 0 !important;

    transition:
      border-color .25s ease,
      box-shadow .25s ease !important;
  }

  .pn001-site .pn001-hero-media:hover,
  .pn001-site .pn001-hero-image:hover {
    transform: none !important;
    translate: none !important;

    box-shadow:
      0 26px 80px rgba(0,0,0,.20) !important;

    border-color:
      color-mix(
        in srgb,
        var(--pn001-accent) 32%,
        rgba(255,255,255,.10)
      ) !important;
  }

  .pn001-site .pn001-hero-media::before,
  .pn001-site .pn001-hero-media::after,
  .pn001-site .pn001-hero-image::before,
  .pn001-site .pn001-hero-image::after {
    box-shadow: none !important;
    transform: none !important;
  }

  /* ========================================================
     GLOBAL ACCENT
     No fixed PageNova green.
     ======================================================== */

  .pn001-site .pn001-kicker,
  .pn001-site .pn001-pill {
    color: var(--pn001-accent-strong) !important;
  }

  .pn001-site a:not(.pn001-brand) {
    text-decoration-color:
      color-mix(
        in srgb,
        var(--pn001-accent) 50%,
        transparent
      );
  }

  /* ========================================================
     SERVICES / FEATURES / BENEFITS / PROCESS
     ======================================================== */

  .pn001-site .pn001-services,
  .pn001-site .pn001-features,
  .pn001-site .pn001-benefits,
  .pn001-site .pn001-process {
    background:
      linear-gradient(
        180deg,
        var(--pn001-bg) 0%,
        var(--pn-v6-accent-soft-2) 100%
      ) !important;
  }

  .pn001-site .pn001-cards {
    gap: clamp(16px, 2vw, 24px) !important;

    border: 0 !important;
    background: transparent !important;
  }

  .pn001-site .pn001-card {
    position: relative !important;
    overflow: hidden !important;

    border:
      1px solid
      var(--pn001-line) !important;

    border-radius: 20px !important;

    background:
      linear-gradient(
        180deg,
        var(--pn001-surface) 0%,
        color-mix(
          in srgb,
          var(--pn001-accent) 3%,
          var(--pn001-surface)
        ) 100%
      ) !important;

    color: var(--pn001-text) !important;

    box-shadow: var(--pn-v6-shadow) !important;

    transform: none !important;
    translate: none !important;

    transition:
      transform .24s ease,
      border-color .24s ease,
      box-shadow .24s ease !important;
  }

  .pn001-site .pn001-card::before {
    content: "" !important;

    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;

    width: auto !important;
    height: 3px !important;

    background:
      linear-gradient(
        90deg,
        var(--pn001-accent),
        color-mix(
          in srgb,
          var(--pn001-accent) 18%,
          transparent
        )
      ) !important;

    transform: none !important;
    box-shadow: none !important;
  }

  .pn001-site .pn001-card::after {
    box-shadow: none !important;
  }

  .pn001-site .pn001-card:hover {
    transform: translateY(-4px) !important;
    translate: none !important;

    border-color: var(--pn-v6-accent-line) !important;

    box-shadow: var(--pn-v6-shadow-hover) !important;
  }

  .pn001-site .pn001-card h3 {
    color: var(--pn001-text) !important;
  }

  .pn001-site .pn001-card p {
    color: var(--pn001-muted) !important;
  }

  /* Numbered/process visual elements inherit the same DNA. */

  .pn001-site .pn001-process .pn001-card strong,
  .pn001-site .pn001-process .pn001-card b,
  .pn001-site .pn001-card-number,
  .pn001-site .pn001-number {
    color: var(--pn001-accent-strong) !important;
  }

  /* ========================================================
     ABOUT
     Preserve the section that is already visually successful.
     ======================================================== */

  .pn001-site .pn001-about {
    background:
      linear-gradient(
        135deg,
        var(--pn001-dark) 0%,
        color-mix(
          in srgb,
          var(--pn001-dark) 88%,
          var(--pn001-accent) 12%
        ) 100%
      ) !important;

    color: #fff !important;
  }

  .pn001-site .pn001-about h2,
  .pn001-site .pn001-about h3 {
    color: #fff !important;
  }

  .pn001-site .pn001-about p {
    color: rgba(255,255,255,.70) !important;
  }

  .pn001-site .pn001-about .pn001-kicker {
    color:
      color-mix(
        in srgb,
        var(--pn001-accent) 78%,
        white
      ) !important;
  }

  .pn001-site .pn001-about-image {
    box-shadow:
      0 24px 70px rgba(0,0,0,.22) !important;

    border:
      1px solid
      var(--pn-v6-dark-line) !important;
  }

  /* ========================================================
     GALLERY / PORTFOLIO
     Real sections only. No fake 3D treatment.
     ======================================================== */

  .pn001-site .pn001-gallery,
  .pn001-site .pn001-portfolio {
    background: var(--pn001-surface) !important;
  }

  .pn001-site .pn001-gallery img,
  .pn001-site .pn001-portfolio img {
    transform: none !important;

    box-shadow:
      0 18px 48px rgba(15,23,42,.10) !important;

    border:
      1px solid
      var(--pn001-line) !important;
  }

  .pn001-site .pn001-gallery img:hover,
  .pn001-site .pn001-portfolio img:hover {
    transform: none !important;
  }

  /* ========================================================
     TESTIMONIALS
     ======================================================== */

  .pn001-site .pn001-testimonials-v6 {
    overflow: hidden !important;

    background:
      linear-gradient(
        135deg,
        var(--pn-v6-accent-soft) 0%,
        var(--pn001-bg) 100%
      ) !important;
  }

  .pn001-site .pn001-testimonial-slider {
    display: flex !important;

    grid-template-columns: none !important;
    grid-auto-flow: unset !important;
    grid-auto-columns: unset !important;

    gap: 18px !important;

    width: max-content !important;
    max-width: none !important;

    overflow: visible !important;

    scroll-snap-type: none !important;
    scrollbar-width: none !important;

    will-change: transform !important;
  }

  .pn001-site .pn001-testimonial-slider::-webkit-scrollbar {
    display: none !important;
  }

  .pn001-site .pn001-testimonial-card-v6 {
    display: flex !important;
    flex: 0 0 clamp(300px, 31vw, 390px) !important;

    min-height: 310px !important;

    border:
      1px solid
      var(--pn001-line) !important;

    border-radius: 20px !important;

    background: var(--pn001-surface) !important;

    box-shadow:
      0 16px 42px rgba(15,23,42,.07) !important;
  }

  .pn001-site
  .pn001-testimonial-card-v6:nth-child(n) {
    display: flex !important;
  }

  /* ========================================================
     FAQ
     ======================================================== */

  .pn001-site .pn001-faq-v6 {
    overflow: visible !important;

    background: var(--pn001-bg) !important;
  }

  .pn001-site .pn001-faq-v6 .pn001-container {
    overflow: visible !important;
  }

  .pn001-site .pn001-faq-layout,
  .pn001-site .pn001-faq-grid {
    display: grid !important;

    grid-template-columns:
      minmax(260px, .72fr)
      minmax(0, 1.28fr) !important;

    gap: clamp(44px, 7vw, 96px) !important;

    align-items: start !important;

    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;

    overflow: visible !important;
  }

  .pn001-site .pn001-faq-copy,
  .pn001-site .pn001-faq-list {
    position: relative !important;
    top: auto !important;

    width: 100% !important;

    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;

    overflow: visible !important;
  }

  .pn001-site .pn001-faq-v6 h2 {
    max-width: 620px !important;

    font-size:
      clamp(38px, 4.8vw, 68px) !important;

    line-height: .98 !important;
    letter-spacing: -.045em !important;

    color: var(--pn001-text) !important;
  }

  .pn001-site .pn001-faq-item {
    position: relative !important;

    width: 100% !important;

    margin: 0 0 12px !important;

    padding:
      0
      clamp(18px, 2vw, 26px) !important;

    border:
      1px solid
      var(--pn001-line) !important;

    border-radius: 16px !important;

    background: var(--pn001-surface) !important;

    box-shadow: none !important;

    overflow: hidden !important;
  }

  .pn001-site .pn001-faq-item:hover {
    border-color: var(--pn-v6-accent-line) !important;
  }

  .pn001-site .pn001-faq-item summary,
  .pn001-site .pn001-faq-question,
  .pn001-site .pn001-faq-trigger {
    color: var(--pn001-text) !important;
  }

  .pn001-site .pn001-faq-item p,
  .pn001-site .pn001-faq-answer {
    color: var(--pn001-muted) !important;
  }

  /* ========================================================
     CONTACT
     ======================================================== */

  .pn001-site .pn001-contact {
    background:
      linear-gradient(
        180deg,
        var(--pn001-bg),
        var(--pn-v6-accent-soft-2)
      ) !important;
  }

  .pn001-site .pn001-contact-card,
  .pn001-site .pn001-contact-panel,
  .pn001-site .pn001-contact-form {
    border-color: var(--pn001-line) !important;
    background: var(--pn001-surface) !important;

    box-shadow:
      0 18px 52px rgba(15,23,42,.07) !important;
  }

  /* ========================================================
     FINAL CTA
     Compact and connected to hero.
     ======================================================== */

  .pn001-site .pn001-final-cta {
    min-height: 0 !important;

    padding:
      clamp(60px, 7vw, 94px)
      0 !important;

    background: var(--pn001-bg) !important;
  }

  .pn001-site .pn001-final-cta-card,
  .pn001-site .pn-v2-final-cta-card {
    min-height: 0 !important;
    height: auto !important;

    padding:
      clamp(36px, 5vw, 62px) !important;

    border:
      1px solid
      var(--pn-v6-dark-line) !important;

    border-radius: 24px !important;

    background:
      radial-gradient(
        circle at 86% 14%,
        color-mix(
          in srgb,
          var(--pn001-accent) 18%,
          transparent
        ),
        transparent 32%
      ),
      var(--pn001-dark) !important;

    box-shadow: none !important;

    color: #fff !important;
  }

  .pn001-site .pn001-final-cta-card h2,
  .pn001-site .pn-v2-final-cta-card h2 {
    max-width: 760px !important;

    font-size:
      clamp(38px, 4.6vw, 64px) !important;

    line-height: .98 !important;
    letter-spacing: -.045em !important;

    color: #fff !important;
  }

  .pn001-site .pn001-final-cta-card p,
  .pn001-site .pn-v2-final-cta-card p {
    color: rgba(255,255,255,.70) !important;
  }

  /* ========================================================
     FOOTER
     ======================================================== */

  .pn001-site .pn001-footer {
    background: var(--pn001-dark) !important;
    color: rgba(255,255,255,.72) !important;

    border-top:
      1px solid
      var(--pn-v6-dark-line) !important;
  }

  .pn001-site .pn001-footer .pn001-brand-name,
  .pn001-site .pn001-footer h2,
  .pn001-site .pn001-footer h3 {
    color: #fff !important;
  }

  .pn001-site .pn001-footer a {
    color: rgba(255,255,255,.72) !important;
  }

  .pn001-site .pn001-footer a:hover {
    color:
      color-mix(
        in srgb,
        var(--pn001-accent) 76%,
        white
      ) !important;
  }

  /* ========================================================
     MOBILE
     ======================================================== */

  @media (max-width: 900px) {

    .pn001-site .pn001-header {
      padding:
        10px
        12px
        0 !important;
    }

    .pn001-site .pn001-header-inner {
      min-height: 64px !important;
      border-radius: 14px !important;
    }

    .pn001-site .pn001-hero h1 {
      font-size:
        clamp(42px, 11vw, 62px) !important;
    }

    .pn001-site .pn001-hero-media,
    .pn001-site .pn001-hero-image {
      min-height: 340px !important;
      max-height: 500px !important;
    }

    .pn001-site .pn001-faq-layout,
    .pn001-site .pn001-faq-grid {
      grid-template-columns: 1fr !important;
      gap: 32px !important;
    }

    .pn001-site .pn001-testimonial-card-v6 {
      flex-basis:
        min(82vw, 350px) !important;
    }

    .pn001-site .pn001-final-cta-card,
    .pn001-site .pn-v2-final-cta-card {
      padding:
        32px
        24px !important;

      border-radius: 20px !important;
    }
  }

  @media (max-width: 620px) {

    .pn001-site .pn001-header-cta {
      display: none !important;
    }

    .pn001-site .pn001-hero h1 {
      font-size:
        clamp(40px, 12.5vw, 54px) !important;
    }

    .pn001-site .pn001-card {
      border-radius: 17px !important;
    }

    .pn001-site .pn001-faq-v6 h2 {
      font-size:
        clamp(36px, 10vw, 48px) !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {

    .pn001-site *,
    .pn001-site *::before,
    .pn001-site *::after {
      scroll-behavior: auto !important;
    }

    .pn001-site .pn001-card,
    .pn001-site .pn001-hero-media,
    .pn001-site .pn001-hero-image {
      transition: none !important;
    }
  }


  /* ========================================================
     PAGENOVA V6.3 - VISUAL IDENTITY MANAGER

     UNIVERSAL PRODUCT CONTRACT

     The generated project keeps its own accent identity.

     Structural visual language:
     - white
     - neutral white
     - project dark
     - project accent

     No niche mapping.
     No fixed PageNova green.
     No beige / ivory / linen structural surfaces.
     Header remains controlled by V6.2.1.
     ======================================================== */

  .pn001-site {
    --pn-v63-white: #ffffff;
    --pn-v63-neutral: #f7f8fa;
    --pn-v63-neutral-2: #f1f3f5;

    --pn-v63-text: #15171a;
    --pn-v63-muted: #687078;

    --pn-v63-line:
      rgba(15, 23, 42, .11);

    --pn-v63-line-strong:
      rgba(15, 23, 42, .16);

    --pn-v63-accent-soft:
      color-mix(
        in srgb,
        var(--pn001-accent) 7%,
        #ffffff
      );

    --pn-v63-accent-soft-2:
      color-mix(
        in srgb,
        var(--pn001-accent) 4%,
        #ffffff
      );

    --pn-v63-dark-accent:
      color-mix(
        in srgb,
        var(--pn001-dark) 88%,
        var(--pn001-accent) 12%
      );

    --pn-v63-dark-accent-strong:
      color-mix(
        in srgb,
        var(--pn001-dark) 80%,
        var(--pn001-accent) 20%
      );

    --pn-v63-shadow:
      0 16px 44px rgba(15, 23, 42, .07);

    --pn-v63-shadow-hover:
      0 20px 54px rgba(15, 23, 42, .10);

    background:
      var(--pn-v63-white) !important;

    color:
      var(--pn-v63-text) !important;
  }

  /*
   * GLOBAL LIGHT SURFACES
   *
   * Old palette background/surfaceSoft may still exist as variables
   * for compatibility, but they no longer define the page canvas.
   */

  .pn001-site main {
    background:
      var(--pn-v63-white) !important;
  }

  .pn001-site .pn001-section:not(.pn001-about):not(.pn001-final-cta),
  .pn001-site section:not(.pn001-hero):not(.pn001-about):not(.pn001-final-cta) {
    color:
      var(--pn-v63-text);
  }

  /*
   * HERO
   *
   * Dark expression of the generated identity.
   */

  .pn001-site > .pn001-hero,
  .pn001-site .pn001-hero {
    background:
      radial-gradient(
        circle at 84% 14%,
        color-mix(
          in srgb,
          var(--pn001-accent) 17%,
          transparent
        ),
        transparent 35%
      ),
      linear-gradient(
        135deg,
        var(--pn001-dark) 0%,
        var(--pn-v63-dark-accent) 100%
      ) !important;

    color:
      #ffffff !important;
  }

  .pn001-site .pn001-hero h1,
  .pn001-site .pn001-hero h2 {
    color:
      #ffffff !important;
  }

  .pn001-site .pn001-hero p {
    color:
      rgba(255,255,255,.74) !important;
  }

  .pn001-site .pn001-hero .pn001-kicker,
  .pn001-site .pn001-hero .pn001-pill {
    color:
      color-mix(
        in srgb,
        var(--pn001-accent) 78%,
        #ffffff
      ) !important;
  }

  /*
   * SERVICES / FEATURES / BENEFITS
   *
   * White section.
   * Accent appears in details, not as a tinted page background.
   */

  .pn001-site .pn001-services,
  .pn001-site .pn001-features,
  .pn001-site .pn001-benefits {
    background:
      var(--pn-v63-white) !important;
  }

  /*
   * PROCESS
   *
   * Slight neutral separation, never beige.
   */

  .pn001-site .pn001-process {
    background:
      var(--pn-v63-neutral) !important;
  }

  /*
   * CARDS
   */

  .pn001-site .pn001-card {
    border:
      1px solid
      var(--pn-v63-line) !important;

    background:
      #ffffff !important;

    color:
      var(--pn-v63-text) !important;

    box-shadow:
      var(--pn-v63-shadow) !important;
  }

  .pn001-site .pn001-card::before {
    background:
      linear-gradient(
        90deg,
        var(--pn001-accent),
        color-mix(
          in srgb,
          var(--pn001-accent) 20%,
          transparent
        )
      ) !important;
  }

  .pn001-site .pn001-card:hover {
    border-color:
      color-mix(
        in srgb,
        var(--pn001-accent) 32%,
        var(--pn-v63-line)
      ) !important;

    box-shadow:
      var(--pn-v63-shadow-hover) !important;
  }

  .pn001-site .pn001-card h3,
  .pn001-site .pn001-card h4 {
    color:
      var(--pn-v63-text) !important;
  }

  .pn001-site .pn001-card p {
    color:
      var(--pn-v63-muted) !important;
  }

  /*
   * ABOUT
   *
   * Second major dark identity anchor.
   */

  .pn001-site .pn001-about {
    background:
      linear-gradient(
        135deg,
        var(--pn001-dark) 0%,
        var(--pn-v63-dark-accent-strong) 100%
      ) !important;

    color:
      #ffffff !important;
  }

  .pn001-site .pn001-about h2,
  .pn001-site .pn001-about h3 {
    color:
      #ffffff !important;
  }

  .pn001-site .pn001-about p {
    color:
      rgba(255,255,255,.72) !important;
  }

  /*
   * PORTFOLIO / GALLERY
   */

  .pn001-site .pn001-gallery,
  .pn001-site .pn001-portfolio {
    background:
      #ffffff !important;
  }

  /*
   * TESTIMONIALS
   *
   * Neutral-white stage.
   * Accent remains in small identity details.
   */

  .pn001-site .pn001-testimonials,
  .pn001-site .pn001-testimonials-v6 {
    background:
      var(--pn-v63-neutral) !important;
  }

  .pn001-site .pn001-testimonial-card,
  .pn001-site .pn001-testimonial-card-v6 {
    border-color:
      var(--pn-v63-line) !important;

    background:
      #ffffff !important;

    color:
      var(--pn-v63-text) !important;

    box-shadow:
      var(--pn-v63-shadow) !important;
  }

  /*
   * FAQ
   *
   * Always a clean closing light section.
   */

  .pn001-site .pn001-faq,
  .pn001-site .pn001-faq-v6 {
    background:
      #ffffff !important;

    color:
      var(--pn-v63-text) !important;
  }

  .pn001-site .pn001-faq-item {
    border:
      1px solid
      var(--pn-v63-line) !important;

    background:
      #ffffff !important;

    box-shadow:
      none !important;
  }

  .pn001-site .pn001-faq-item:hover {
    border-color:
      color-mix(
        in srgb,
        var(--pn001-accent) 34%,
        var(--pn-v63-line)
      ) !important;
  }

  .pn001-site .pn001-faq-item summary,
  .pn001-site .pn001-faq-question,
  .pn001-site .pn001-faq-trigger {
    color:
      var(--pn-v63-text) !important;
  }

  .pn001-site .pn001-faq-item p,
  .pn001-site .pn001-faq-answer {
    color:
      var(--pn-v63-muted) !important;
  }

  /*
   * CONTACT
   *
   * Neutral separation before final CTA.
   */

  .pn001-site .pn001-contact {
    background:
      var(--pn-v63-neutral) !important;
  }

  .pn001-site .pn001-contact-card,
  .pn001-site .pn001-contact-panel,
  .pn001-site .pn001-contact-form {
    border-color:
      var(--pn-v63-line) !important;

    background:
      #ffffff !important;

    color:
      var(--pn-v63-text) !important;

    box-shadow:
      var(--pn-v63-shadow) !important;
  }

  .pn001-site .pn001-contact input,
  .pn001-site .pn001-contact textarea,
  .pn001-site .pn001-contact select {
    border-color:
      var(--pn-v63-line) !important;

    background:
      #ffffff !important;

    color:
      var(--pn-v63-text) !important;
  }

  .pn001-site .pn001-contact input:focus,
  .pn001-site .pn001-contact textarea:focus,
  .pn001-site .pn001-contact select:focus {
    border-color:
      var(--pn001-accent) !important;

    outline:
      3px solid
      color-mix(
        in srgb,
        var(--pn001-accent) 13%,
        transparent
      ) !important;
  }

  /*
   * FINAL CTA
   *
   * Third dark identity anchor.
   */

  .pn001-site .pn001-final-cta {
    background:
      #ffffff !important;
  }

  .pn001-site .pn001-final-cta-card,
  .pn001-site .pn-v2-final-cta-card {
    background:
      radial-gradient(
        circle at 86% 14%,
        color-mix(
          in srgb,
          var(--pn001-accent) 20%,
          transparent
        ),
        transparent 34%
      ),
      linear-gradient(
        135deg,
        var(--pn001-dark) 0%,
        var(--pn-v63-dark-accent) 100%
      ) !important;

    color:
      #ffffff !important;
  }

  /*
   * FOOTER
   *
   * Full-width dark identity surface.
   */

  html body
  .pn001-site
  > footer.pn001-footer {
    background:
      linear-gradient(
        135deg,
        var(--pn001-dark) 0%,
        var(--pn-v63-dark-accent) 100%
      ) !important;

    background-color:
      var(--pn001-dark) !important;

    color:
      rgba(255,255,255,.74) !important;
  }

  html body
  .pn001-site
  > footer.pn001-footer a {
    color:
      rgba(255,255,255,.76) !important;
  }

  html body
  .pn001-site
  > footer.pn001-footer a:hover {
    color:
      color-mix(
        in srgb,
        var(--pn001-accent) 72%,
        #ffffff
      ) !important;
  }

  /*
   * ACCENT CONTROLS
   */

  .pn001-site .pn001-button-primary,
  .pn001-site .pn001-contact-form button {
    background:
      var(--pn001-accent) !important;

    border-color:
      var(--pn001-accent) !important;

    color:
      var(--pn001-accent-contrast) !important;
  }

  .pn001-site .pn001-button-primary:hover,
  .pn001-site .pn001-contact-form button:hover {
    background:
      var(--pn001-accent-strong) !important;

    border-color:
      var(--pn001-accent-strong) !important;
  }

  /*
   * IMPORTANT:
   * Header deliberately NOT redefined here.
   * V6.2.1 remains the authoritative white-header contract.
   */

`;

export const PAGENOVA_DESIGN_CORE_V6_SCRIPT = `
(() => {
  const boot = () => {
    const sites = document.querySelectorAll(
      '.pn001-site[data-pagenova-design-version^="6"]'
    );

    sites.forEach((site) => {
      if (!(site instanceof HTMLElement)) return;

      /*
       * Automatic testimonial carousel.
       *
       * PageNova V6.6:
       * continuous infinite horizontal movement.
       */
      const slider = site.querySelector(
        '.pn001-testimonial-slider'
      );

      if (
        slider instanceof HTMLElement &&
        slider.dataset.pnV6Carousel !== 'ready'
      ) {
        slider.dataset.pnV6Carousel = 'ready';

        const originals = Array.from(
          slider.children
        ).filter(
          (card) =>
            card instanceof HTMLElement &&
            card.dataset.pnV6Clone !== 'true'
        );

        if (originals.length > 1) {
          originals.forEach((card) => {
            const clone = card.cloneNode(true);

            if (clone instanceof HTMLElement) {
              clone.dataset.pnV6Clone = 'true';

              clone.setAttribute(
                'aria-hidden',
                'true'
              );

              slider.appendChild(clone);
            }
          });

          const reduceMotion =
            window.matchMedia(
              '(prefers-reduced-motion: reduce)'
            );

          let paused = false;
          let position = 0;
          let lastTime = 0;

          const getLoopWidth = () => {
            const children =
              Array.from(slider.children);

            const first =
              children[0];

            const firstClone =
              children[originals.length];

            if (
              first instanceof HTMLElement &&
              firstClone instanceof HTMLElement
            ) {
              return (
                firstClone.offsetLeft -
                first.offsetLeft
              );
            }

            return slider.scrollWidth / 2;
          };

          const renderPosition = () => {
            slider.style.transform =
              'translate3d(' +
              (-position) +
              'px,0,0)';
          };

          const pause = () => {
            paused = true;
          };

          const resume = () => {
            paused = false;
            lastTime = performance.now();
          };

          slider.addEventListener(
            'mouseenter',
            pause
          );

          slider.addEventListener(
            'mouseleave',
            resume
          );

          slider.addEventListener(
            'focusin',
            pause
          );

          slider.addEventListener(
            'focusout',
            resume
          );

          slider.addEventListener(
            'pointerdown',
            pause
          );

          window.addEventListener(
            'pointerup',
            resume
          );

          const frame = (time) => {
            if (!lastTime) {
              lastTime = time;
            }

            const delta = Math.min(
              time - lastTime,
              40
            );

            lastTime = time;

            if (reduceMotion.matches) {
              position = 0;
              slider.style.transform = 'none';
            } else if (!paused) {
              position += delta * 0.032;

              const loopWidth =
                getLoopWidth();

              if (
                loopWidth > 0 &&
                position >= loopWidth
              ) {
                position -= loopWidth;
              }

              renderPosition();
            }

            requestAnimationFrame(frame);
          };

          const motionChanged = () => {
            if (reduceMotion.matches) {
              position = 0;
              slider.style.transform = 'none';
            } else {
              lastTime = performance.now();
            }
          };

          if (
            typeof reduceMotion.addEventListener ===
            'function'
          ) {
            reduceMotion.addEventListener(
              'change',
              motionChanged
            );
          }

          window.addEventListener(
            'resize',
            () => {
              const loopWidth =
                getLoopWidth();

              if (
                loopWidth > 0 &&
                position >= loopWidth
              ) {
                position =
                  position % loopWidth;

                renderPosition();
              }
            }
          );

          requestAnimationFrame(frame);
        }
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      boot,
      {
        once: true
      }
    );
  } else {
    boot();
  }
})()

  /* ========================================================
     PAGENOVA V6.1 STRUCTURAL CONTRACT
     Header/footer are global surfaces, never floating cards.
     ======================================================== */

  .pn001-site {
    width: 100% !important;
    max-width: none !important;
  }

  /* HEADER: ALWAYS WHITE + FULL WIDTH */

  .pn001-site .pn001-header {
    width: 100% !important;
    max-width: none !important;

    margin: 0 !important;
    padding: 0 !important;

    background: #ffffff !important;
    color: var(--pn001-text) !important;

    border: 0 !important;
    border-bottom:
      1px solid
      color-mix(
        in srgb,
        var(--pn001-text) 10%,
        transparent
      ) !important;

    border-radius: 0 !important;
    box-shadow: none !important;
  }

  .pn001-site .pn001-header-inner {
    width:
      min(
        calc(100% - 40px),
        1180px
      ) !important;

    max-width: 1180px !important;
    min-height: 78px !important;

    margin: 0 auto !important;
    padding: 10px 0 !important;

    border: 0 !important;
    border-radius: 0 !important;

    background: transparent !important;
    color: var(--pn001-text) !important;

    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .pn001-site .pn001-brand-logo {
    display: inline-flex !important;
    align-items: center !important;

    min-width: 0 !important;
    max-width:
      min(
        52vw,
        560px
      ) !important;

    gap: 0 !important;
  }

  .pn001-site .pn001-brand-symbol {
    display: none !important;
  }

  .pn001-site .pn001-brand,
  .pn001-site .pn001-brand-name {
    color: var(--pn001-text) !important;
  }

  .pn001-site .pn001-brand-name {
    max-width: 100% !important;

    overflow: hidden !important;

    font-size:
      clamp(
        17px,
        1.7vw,
        22px
      ) !important;

    font-weight: 850 !important;
    letter-spacing: -.04em !important;

    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .pn001-site .pn001-header-actions {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;

    flex: 0 0 auto !important;
    gap: 10px !important;
  }

  .pn001-site .pn001-header-cta {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;

    flex: 0 0 auto !important;

    width: auto !important;
    min-width: 118px !important;
    min-height: 46px !important;

    padding: 0 20px !important;

    border:
      1px solid
      var(--pn001-accent) !important;

    border-radius: 12px !important;

    background: var(--pn001-accent) !important;
    color: var(--pn001-accent-contrast) !important;

    box-shadow: none !important;

    font-size: 13px !important;
    font-weight: 850 !important;
    line-height: 1 !important;

    white-space: nowrap !important;
  }

  .pn001-site .pn001-header-cta:hover {
    transform: translateY(-1px) !important;

    background:
      var(--pn001-accent-strong) !important;

    border-color:
      var(--pn001-accent-strong) !important;
  }

  .pn001-site .pn001-menu-button {
    flex: 0 0 46px !important;

    width: 46px !important;
    height: 46px !important;

    border-radius: 12px !important;

    background:
      var(--pn001-accent) !important;

    border-color:
      var(--pn001-accent) !important;
  }

  /* FAQ: CLOSING SECTION, STABLE LAYOUT */

  .pn001-site .pn001-faq,
  .pn001-site .pn001-faq-v6 {
    position: relative !important;
    clear: both !important;

    width: 100% !important;

    padding-top:
      clamp(
        80px,
        9vw,
        126px
      ) !important;

    padding-bottom:
      clamp(
        80px,
        9vw,
        126px
      ) !important;
  }

  .pn001-site .pn001-faq-layout {
    display: grid !important;

    grid-template-columns:
      minmax(0, .78fr)
      minmax(0, 1.22fr) !important;

    gap:
      clamp(
        42px,
        7vw,
        92px
      ) !important;

    align-items: start !important;
  }

  .pn001-site .pn001-faq-intro,
  .pn001-site .pn001-section-head-sticky {
    position: static !important;
    top: auto !important;
  }

  .pn001-site .pn001-faq-list {
    min-width: 0 !important;
  }

  /* FOOTER: ALWAYS FULL WIDTH */

  .pn001-site .pn001-footer,
  .pn001-site .pn001-footer-v5,
  .pn001-site .pn-v2-footer {
    position: relative !important;

    width: 100% !important;
    max-width: none !important;

    margin: 0 !important;

    padding:
      clamp(
        58px,
        7vw,
        88px
      )
      0
      30px !important;

    border: 0 !important;
    border-radius: 0 !important;

    background: var(--pn001-dark) !important;
    color: #ffffff !important;

    box-shadow: none !important;
  }

  .pn001-site .pn001-footer > .pn001-container {
    width:
      min(
        calc(100% - 40px),
        1180px
      ) !important;

    max-width: 1180px !important;
    margin: 0 auto !important;
  }

  .pn001-site .pn001-footer-logo .pn001-brand-symbol {
    display: none !important;
  }

  .pn001-site .pn001-footer-logo {
    gap: 0 !important;
  }

  /* MOBILE */

  @media (max-width: 700px) {

    .pn001-site .pn001-header-inner {
      width:
        min(
          calc(100% - 28px),
          1180px
        ) !important;

      min-height: 68px !important;
      padding: 8px 0 !important;
    }

    .pn001-site .pn001-brand-logo {
      max-width:
        calc(100% - 58px) !important;
    }

    .pn001-site .pn001-brand-name {
      font-size: 16px !important;
    }

    .pn001-site .pn001-header-cta {
      display: none !important;
    }

    .pn001-site .pn001-menu-button {
      flex-basis: 44px !important;
      width: 44px !important;
      height: 44px !important;
    }

    .pn001-site .pn001-faq-layout {
      grid-template-columns:
        1fr !important;

      gap: 34px !important;
    }

    .pn001-site .pn001-footer > .pn001-container {
      width:
        min(
          calc(100% - 28px),
          1180px
        ) !important;
    }
  }

  /* ========================================================
     PAGENOVA V6.2 FINAL CONTRACT
     ======================================================== */

  /*
   * HEADER GLOBAL
   * Sempre branco.
   * Sempre edge-to-edge.
   * Nome escrito como logo.
   */

  .pn001-site > .pn001-header {
    position: relative !important;
    z-index: 50 !important;

    box-sizing: border-box !important;

    width: 100% !important;
    max-width: none !important;

    margin: 0 !important;
    padding: 0 !important;

    border: 0 !important;
    border-bottom:
      1px solid rgba(15, 23, 42, .10) !important;

    border-radius: 0 !important;

    background: #ffffff !important;
    color: #111111 !important;

    box-shadow: none !important;

    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .pn001-site
  > .pn001-header
  > .pn001-header-inner {
    box-sizing: border-box !important;

    width: calc(100% - 48px) !important;
    max-width: 1180px !important;

    min-height: 76px !important;

    margin: 0 auto !important;
    padding: 10px 0 !important;

    border: 0 !important;
    border-radius: 0 !important;

    background: transparent !important;
    color: #111111 !important;

    box-shadow: none !important;

    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .pn001-site .pn001-header .pn001-brand-logo {
    display: inline-flex !important;

    min-width: 0 !important;
    max-width: min(56vw, 620px) !important;

    align-items: center !important;

    color: #111111 !important;

    text-decoration: none !important;
  }

  .pn001-site .pn001-header .pn001-brand-name {
    display: block !important;

    max-width: 100% !important;

    overflow: hidden !important;

    color: #111111 !important;

    font-size:
      clamp(17px, 1.6vw, 21px) !important;

    font-weight: 850 !important;
    line-height: 1.05 !important;
    letter-spacing: -.04em !important;

    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  /*
   * CTA DO HEADER
   */

  .pn001-site .pn001-header .pn001-header-actions {
    display: flex !important;

    flex: 0 0 auto !important;

    align-items: center !important;
    justify-content: flex-end !important;

    gap: 10px !important;
  }

  .pn001-site .pn001-header .pn001-header-cta {
    display: inline-flex !important;

    box-sizing: border-box !important;

    flex: 0 0 auto !important;

    width: auto !important;
    min-width: 118px !important;
    max-width: none !important;

    height: 44px !important;
    min-height: 44px !important;

    margin: 0 !important;
    padding: 0 20px !important;

    align-items: center !important;
    justify-content: center !important;

    border:
      1px solid var(--pn001-accent) !important;

    border-radius: 10px !important;

    background:
      var(--pn001-accent) !important;

    color:
      var(--pn001-accent-contrast) !important;

    box-shadow: none !important;

    font-size: 13px !important;
    font-weight: 850 !important;
    line-height: 1 !important;

    text-decoration: none !important;
    white-space: nowrap !important;

    transform: none !important;
  }

  .pn001-site .pn001-header .pn001-header-cta:hover {
    transform: translateY(-1px) !important;

    box-shadow:
      0 8px 20px
      rgba(15, 23, 42, .10) !important;
  }

  /*
   * HAMBURGER
   */

  .pn001-site .pn001-header .pn001-menu-button {
    box-sizing: border-box !important;

    flex: 0 0 44px !important;

    width: 44px !important;
    height: 44px !important;

    margin: 0 !important;
    padding: 0 !important;

    border:
      1px solid rgba(17, 17, 17, .16) !important;

    border-radius: 10px !important;

    background: #ffffff !important;

    box-shadow: none !important;

    transform: none !important;
  }

  .pn001-site .pn001-header .pn001-menu-button span {
    background: #111111 !important;
  }

  /*
   * HERO
   */

  .pn001-site > .pn001-hero {
    margin-top: 0 !important;
  }

  /*
   * SECOES
   *
   * Impede card unico estreito perdido no desktop.
   */

  .pn001-site .pn001-card-grid {
    width: 100% !important;
  }

  /*
   * PROCESSO
   * O composer garante pelo menos 3 itens.
   */

  .pn001-site
  [data-kind="process"]
  .pn001-card-grid,
  .pn001-site
  [data-section-kind="process"]
  .pn001-card-grid {
    grid-template-columns:
      repeat(3, minmax(0, 1fr)) !important;
  }

  /*
   * FAQ
   */

  .pn001-site .pn001-faq-v6,
  .pn001-site .pn001-faq {
    clear: both !important;
  }

  /*
   * FOOTER GLOBAL
   * Fundo ocupa 100%.
   * Conteudo interno continua alinhado.
   */

  .pn001-site > .pn001-footer {
    box-sizing: border-box !important;

    width: 100% !important;
    max-width: none !important;

    margin: 0 !important;

    padding:
      clamp(58px, 7vw, 88px)
      0
      30px !important;

    border: 0 !important;
    border-radius: 0 !important;

    background:
      var(--pn001-dark) !important;

    color: #ffffff !important;

    box-shadow: none !important;
  }

  .pn001-site
  > .pn001-footer
  > .pn001-container {
    box-sizing: border-box !important;

    width: calc(100% - 48px) !important;
    max-width: 1180px !important;

    margin: 0 auto !important;

    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  /*
   * MOBILE
   */

  @media (max-width: 760px) {

    .pn001-site
    > .pn001-header
    > .pn001-header-inner {
      width: calc(100% - 28px) !important;

      min-height: 66px !important;

      padding: 8px 0 !important;
    }

    .pn001-site
    .pn001-header
    .pn001-brand-logo {
      max-width:
        calc(100% - 58px) !important;
    }

    .pn001-site
    .pn001-header
    .pn001-brand-name {
      font-size: 15px !important;
    }

    .pn001-site
    .pn001-header
    .pn001-header-cta {
      display: none !important;
    }

    .pn001-site
    [data-kind="process"]
    .pn001-card-grid,
    .pn001-site
    [data-section-kind="process"]
    .pn001-card-grid {
      grid-template-columns: 1fr !important;
    }

    .pn001-site
    > .pn001-footer
    > .pn001-container {
      width:
        calc(100% - 28px) !important;
    }
  }

  /* ========================================================
     PAGENOVA GLOBAL WHITE HEADER V6.2.1

     PRODUCT CONTRACT:
     - always white
     - always full width
     - never a floating card
     - text-only brand
     - accent CTA
     - independent from generated Design DNA
     ======================================================== */

  html body .pn001-site > header.pn001-header {
    position: relative !important;
    z-index: 100 !important;

    display: block !important;

    box-sizing: border-box !important;

    width: 100% !important;
    min-width: 100% !important;
    max-width: none !important;

    margin:
      0 !important;

    padding:
      0 !important;

    border:
      0 !important;

    border-bottom:
      1px solid rgba(15, 23, 42, .10) !important;

    border-radius:
      0 !important;

    outline:
      0 !important;

    background:
      #ffffff !important;

    background-color:
      #ffffff !important;

    background-image:
      none !important;

    color:
      #111111 !important;

    box-shadow:
      none !important;

    filter:
      none !important;

    transform:
      none !important;

    backdrop-filter:
      none !important;

    -webkit-backdrop-filter:
      none !important;
  }

  html body
  .pn001-site
  > header.pn001-header
  > .pn001-header-inner {
    position: relative !important;

    display: flex !important;

    box-sizing: border-box !important;

    width:
      min(
        calc(100% - 48px),
        1180px
      ) !important;

    min-width:
      0 !important;

    max-width:
      1180px !important;

    min-height:
      76px !important;

    margin:
      0 auto !important;

    padding:
      10px 0 !important;

    align-items:
      center !important;

    justify-content:
      space-between !important;

    gap:
      20px !important;

    border:
      0 !important;

    border-radius:
      0 !important;

    outline:
      0 !important;

    background:
      transparent !important;

    background-color:
      transparent !important;

    background-image:
      none !important;

    color:
      #111111 !important;

    box-shadow:
      none !important;

    filter:
      none !important;

    transform:
      none !important;

    backdrop-filter:
      none !important;

    -webkit-backdrop-filter:
      none !important;
  }

  /*
   * Remove qualquer pseudo-elemento decorativo herdado.
   */

  html body
  .pn001-site
  > header.pn001-header::before,

  html body
  .pn001-site
  > header.pn001-header::after,

  html body
  .pn001-site
  > header.pn001-header
  > .pn001-header-inner::before,

  html body
  .pn001-site
  > header.pn001-header
  > .pn001-header-inner::after {
    display:
      none !important;

    content:
      none !important;
  }

  /*
   * BRAND
   */

  html body
  .pn001-site
  > header.pn001-header
  .pn001-brand-logo {
    display:
      inline-flex !important;

    flex:
      1 1 auto !important;

    min-width:
      0 !important;

    max-width:
      620px !important;

    margin:
      0 !important;

    padding:
      0 !important;

    align-items:
      center !important;

    gap:
      0 !important;

    border:
      0 !important;

    border-radius:
      0 !important;

    background:
      transparent !important;

    color:
      #111111 !important;

    box-shadow:
      none !important;

    text-decoration:
      none !important;

    transform:
      none !important;
  }

  /*
   * Nunca usar monograma/icone automatico como logo.
   */

  html body
  .pn001-site
  > header.pn001-header
  .pn001-brand-symbol {
    display:
      none !important;
  }

  html body
  .pn001-site
  > header.pn001-header
  .pn001-brand-name {
    display:
      block !important;

    max-width:
      100% !important;

    margin:
      0 !important;

    padding:
      0 !important;

    overflow:
      hidden !important;

    color:
      #111111 !important;

    font-size:
      clamp(
        17px,
        1.55vw,
        21px
      ) !important;

    font-weight:
      850 !important;

    line-height:
      1.05 !important;

    letter-spacing:
      -.04em !important;

    text-overflow:
      ellipsis !important;

    white-space:
      nowrap !important;

    text-shadow:
      none !important;
  }

  /*
   * ACTIONS
   */

  html body
  .pn001-site
  > header.pn001-header
  .pn001-header-actions {
    display:
      flex !important;

    flex:
      0 0 auto !important;

    width:
      auto !important;

    margin:
      0 !important;

    padding:
      0 !important;

    align-items:
      center !important;

    justify-content:
      flex-end !important;

    gap:
      10px !important;

    background:
      transparent !important;

    box-shadow:
      none !important;
  }

  /*
   * FALAR AGORA
   */

  html body
  .pn001-site
  > header.pn001-header
  .pn001-header-cta {
    display:
      inline-flex !important;

    box-sizing:
      border-box !important;

    flex:
      0 0 auto !important;

    width:
      auto !important;

    min-width:
      118px !important;

    max-width:
      none !important;

    height:
      44px !important;

    min-height:
      44px !important;

    max-height:
      44px !important;

    margin:
      0 !important;

    padding:
      0 20px !important;

    align-items:
      center !important;

    justify-content:
      center !important;

    border:
      1px solid
      var(--pn001-accent) !important;

    border-radius:
      999px !important;

    background:
      var(--pn001-accent) !important;

    background-color:
      var(--pn001-accent) !important;

    background-image:
      none !important;

    color:
      var(--pn001-accent-contrast) !important;

    box-shadow:
      none !important;

    filter:
      none !important;

    transform:
      none !important;

    font-size:
      13px !important;

    font-weight:
      850 !important;

    line-height:
      1 !important;

    letter-spacing:
      -.01em !important;

    text-decoration:
      none !important;

    white-space:
      nowrap !important;
  }

  html body
  .pn001-site
  > header.pn001-header
  .pn001-header-cta:hover {
    transform:
      translateY(-1px) !important;

    box-shadow:
      0 8px 22px
      rgba(15, 23, 42, .12) !important;
  }

  /*
   * HAMBURGER
   */

  html body
  .pn001-site
  > header.pn001-header
  .pn001-menu-button {
    display:
      inline-flex !important;

    box-sizing:
      border-box !important;

    flex:
      0 0 44px !important;

    width:
      44px !important;

    min-width:
      44px !important;

    max-width:
      44px !important;

    height:
      44px !important;

    min-height:
      44px !important;

    max-height:
      44px !important;

    margin:
      0 !important;

    padding:
      0 !important;

    align-items:
      center !important;

    justify-content:
      center !important;

    border:
      1px solid
      rgba(17, 17, 17, .16) !important;

    border-radius:
      12px !important;

    background:
      #ffffff !important;

    background-color:
      #ffffff !important;

    background-image:
      none !important;

    color:
      #111111 !important;

    box-shadow:
      none !important;

    filter:
      none !important;

    transform:
      none !important;
  }

  html body
  .pn001-site
  > header.pn001-header
  .pn001-menu-button span {
    background:
      #111111 !important;
  }

  /*
   * MOBILE
   */

  @media (max-width: 760px) {

    html body
    .pn001-site
    > header.pn001-header
    > .pn001-header-inner {
      width:
        calc(100% - 28px) !important;

      min-height:
        66px !important;

      padding:
        8px 0 !important;

      gap:
        10px !important;
    }

    html body
    .pn001-site
    > header.pn001-header
    .pn001-brand-logo {
      max-width:
        calc(100% - 56px) !important;
    }

    html body
    .pn001-site
    > header.pn001-header
    .pn001-brand-name {
      font-size:
        15px !important;
    }

    html body
    .pn001-site
    > header.pn001-header
    .pn001-header-cta {
      display:
        none !important;
    }
  }

  /* ============================================================
     PAGENOVA HEADER CONTRACT V6.3.2
     GLOBAL / WHITE / FULL WIDTH / NO CARD
     ============================================================ */

  .pn001-site .pn001-header,
  .pn001-site > .pn001-header {
    position: relative !important;
    z-index: 100 !important;

    display: block !important;
    box-sizing: border-box !important;

    width: 100% !important;
    max-width: none !important;

    margin: 0 !important;
    padding: 0 !important;

    background: #ffffff !important;
    background-image: none !important;

    color: #111111 !important;

    border: 0 !important;
    border-radius: 0 !important;

    box-shadow: none !important;

    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .pn001-site .pn001-header .pn001-header-inner,
  .pn001-site > .pn001-header > .pn001-header-inner {
    display: flex !important;
    box-sizing: border-box !important;

    width: min(calc(100% - 48px), 1180px) !important;
    max-width: 1180px !important;

    min-height: 76px !important;

    margin: 0 auto !important;
    padding: 10px 0 !important;

    align-items: center !important;
    justify-content: space-between !important;

    gap: 24px !important;

    background: #ffffff !important;
    background-image: none !important;

    color: #111111 !important;

    border: 0 !important;
    border-radius: 0 !important;

    outline: 0 !important;

    box-shadow: none !important;

    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .pn001-site .pn001-header .pn001-brand-logo,
  .pn001-site .pn001-header .pn001-brand,
  .pn001-site .pn001-header .pn001-brand-name {
    color: #111111 !important;
  }

  .pn001-site .pn001-header .pn001-brand-logo,
  .pn001-site .pn001-header .pn001-brand {
    text-decoration: none !important;
  }

  .pn001-site .pn001-header .pn001-brand-name {
    font-size: clamp(17px, 1.6vw, 21px) !important;
    font-weight: 850 !important;
    letter-spacing: -0.035em !important;
  }

  .pn001-site .pn001-header .pn001-brand-mark {
    display: none !important;
  }

  .pn001-site .pn001-header .pn001-header-actions {
    display: flex !important;

    flex: 0 0 auto !important;

    align-items: center !important;
    justify-content: flex-end !important;

    gap: 10px !important;
  }

  .pn001-site .pn001-header .pn001-header-cta {
    display: inline-flex !important;

    align-items: center !important;
    justify-content: center !important;

    width: auto !important;
    min-width: 118px !important;
    height: 44px !important;
    min-height: 44px !important;

    margin: 0 !important;
    padding: 0 20px !important;

    background: var(--pn001-accent) !important;
    background-image: none !important;

    color: var(--pn001-accent-contrast) !important;

    border: 1px solid var(--pn001-accent) !important;
    border-radius: 999px !important;

    box-shadow: none !important;

    font-weight: 800 !important;
    text-decoration: none !important;
    white-space: nowrap !important;
  }

  .pn001-site .pn001-header .pn001-header-cta:hover {
    background: var(--pn001-accent-strong) !important;
    border-color: var(--pn001-accent-strong) !important;

    transform: translateY(-1px) !important;
  }

  .pn001-site .pn001-header .pn001-menu-button {
    display: inline-flex !important;
    box-sizing: border-box !important;

    flex: 0 0 44px !important;

    width: 44px !important;
    height: 44px !important;

    margin: 0 !important;
    padding: 0 !important;

    align-items: center !important;
    justify-content: center !important;
    flex-direction: column !important;

    gap: 5px !important;

    background: #ffffff !important;
    background-image: none !important;

    border: 1px solid rgba(17,17,17,.16) !important;
    border-radius: 999px !important;

    box-shadow: none !important;
  }

  .pn001-site .pn001-header .pn001-menu-button span {
    width: 18px !important;
    height: 2px !important;

    margin: 0 !important;

    background: #111111 !important;

    border-radius: 999px !important;
  }

  .pn001-site > .pn001-hero {
    margin-top: 0 !important;
  }

  @media (max-width: 760px) {

    .pn001-site .pn001-header .pn001-header-inner,
    .pn001-site > .pn001-header > .pn001-header-inner {
      width: calc(100% - 28px) !important;

      min-height: 66px !important;

      padding: 8px 0 !important;
    }

    .pn001-site .pn001-header .pn001-header-cta {
      display: none !important;
    }

    .pn001-site .pn001-header .pn001-brand-name {
      font-size: 15px !important;
    }
  }

  /* PAGENOVA_HEADER_HARD_FIX_BEGIN */

  /*
   * GLOBAL HEADER CONTRACT
   *
   * Estrutura:
   *
   * [ WHITE FULL-WIDTH HEADER ]
   *       brand        CTA menu
   *
   * O header interno NUNCA pode virar card.
   */

  html body .pn001-site > header.pn001-header {
    position: relative !important;
    z-index: 999 !important;

    display: block !important;
    box-sizing: border-box !important;

    width: 100% !important;
    max-width: none !important;

    margin: 0 !important;
    padding: 0 !important;

    background: #ffffff !important;
    background-color: #ffffff !important;
    background-image: none !important;

    color: #111111 !important;

    border: 0 !important;
    border-radius: 0 !important;

    outline: 0 !important;

    box-shadow: none !important;

    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;

    overflow: visible !important;
  }

  html body .pn001-site
  > header.pn001-header
  > .pn001-header-inner {
    position: relative !important;

    display: flex !important;
    box-sizing: border-box !important;

    width: min(calc(100% - 48px), 1180px) !important;
    max-width: 1180px !important;

    min-height: 76px !important;

    margin: 0 auto !important;
    padding: 10px 0 !important;

    align-items: center !important;
    justify-content: space-between !important;

    gap: 24px !important;

    /*
     * CRITICO:
     * elimina o card vinho.
     */
    background: transparent !important;
    background-color: transparent !important;
    background-image: none !important;

    color: #111111 !important;

    border: 0 !important;
    border-width: 0 !important;
    border-style: none !important;
    border-color: transparent !important;

    border-radius: 0 !important;

    outline: 0 !important;

    box-shadow: none !important;

    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;

    filter: none !important;

    overflow: visible !important;
  }

  /*
   * Mata pseudo-elementos que poderiam pintar
   * o card internamente.
   */
  html body .pn001-site
  > header.pn001-header
  > .pn001-header-inner::before,

  html body .pn001-site
  > header.pn001-header
  > .pn001-header-inner::after {
    content: none !important;
    display: none !important;

    background: transparent !important;
    background-image: none !important;

    border: 0 !important;
    box-shadow: none !important;
  }

  /*
   * BRAND
   */

  html body .pn001-site
  > header.pn001-header
  .pn001-brand-logo,

  html body .pn001-site
  > header.pn001-header
  .pn001-brand,

  html body .pn001-site
  > header.pn001-header
  .pn001-brand-name {
    color: #111111 !important;
  }

  html body .pn001-site
  > header.pn001-header
  .pn001-brand-logo,

  html body .pn001-site
  > header.pn001-header
  .pn001-brand {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;

    text-decoration: none !important;
  }

  html body .pn001-site
  > header.pn001-header
  .pn001-brand-mark {
    display: none !important;
  }

  html body .pn001-site
  > header.pn001-header
  .pn001-brand-name {
    font-size: clamp(17px, 1.6vw, 21px) !important;
    font-weight: 850 !important;
    letter-spacing: -0.035em !important;

    white-space: nowrap !important;
  }

  /*
   * ACTIONS
   */

  html body .pn001-site
  > header.pn001-header
  .pn001-header-actions {
    display: flex !important;

    flex: 0 0 auto !important;

    align-items: center !important;
    justify-content: flex-end !important;

    gap: 10px !important;

    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
  }

  /*
   * CTA
   */

  html body .pn001-site
  > header.pn001-header
  .pn001-header-cta {
    display: inline-flex !important;

    box-sizing: border-box !important;

    align-items: center !important;
    justify-content: center !important;

    flex: 0 0 auto !important;

    width: auto !important;
    min-width: 118px !important;

    height: 44px !important;
    min-height: 44px !important;

    margin: 0 !important;
    padding: 0 20px !important;

    background: var(--pn001-accent) !important;
    background-color: var(--pn001-accent) !important;
    background-image: none !important;

    color: var(--pn001-accent-contrast) !important;

    border:
      1px solid
      var(--pn001-accent) !important;

    border-radius: 999px !important;

    box-shadow: none !important;

    font-weight: 800 !important;
    text-decoration: none !important;

    white-space: nowrap !important;
  }

  /*
   * HAMBURGER
   */

  html body .pn001-site
  > header.pn001-header
  .pn001-menu-button {
    display: inline-flex !important;

    box-sizing: border-box !important;

    flex: 0 0 44px !important;

    width: 44px !important;
    height: 44px !important;

    margin: 0 !important;
    padding: 0 !important;

    align-items: center !important;
    justify-content: center !important;
    flex-direction: column !important;

    gap: 5px !important;

    background: #ffffff !important;
    background-color: #ffffff !important;
    background-image: none !important;

    border:
      1px solid
      rgba(17,17,17,.18) !important;

    border-radius: 999px !important;

    box-shadow: none !important;
  }

  html body .pn001-site
  > header.pn001-header
  .pn001-menu-button span {
    display: block !important;

    width: 18px !important;
    height: 2px !important;

    margin: 0 !important;

    background: #111111 !important;

    border: 0 !important;
    border-radius: 999px !important;
  }

  /*
   * HERO COMECA LOGO ABAIXO DO HEADER.
   */

  html body .pn001-site
  > header.pn001-header
  + .pn001-hero,

  html body .pn001-site
  > .pn001-hero {
    margin-top: 0 !important;
  }

  /*
   * MOBILE
   */

  @media (max-width: 760px) {

    html body .pn001-site
    > header.pn001-header
    > .pn001-header-inner {
      width: calc(100% - 28px) !important;

      min-height: 66px !important;

      padding: 8px 0 !important;

      background: transparent !important;

      border: 0 !important;
      border-radius: 0 !important;

      box-shadow: none !important;
    }

    html body .pn001-site
    > header.pn001-header
    .pn001-header-cta {
      display: none !important;
    }

    html body .pn001-site
    > header.pn001-header
    .pn001-brand-name {
      font-size: 15px !important;
    }
  }

  /* PAGENOVA_HEADER_HARD_FIX_END */

  /* PAGENOVA_V65_BEGIN */

  /* ============================================================
     PAGENOVA V6.5
     DENSITY + TYPOGRAPHY + SECTION VARIETY

     Objetivos:
     - reduzir escala exagerada
     - reduzir altura vertical
     - aumentar densidade visual
     - evitar repeticao de cards
     - preservar identidade dinamica
     - preservar header
     - preservar About
     - preservar footer
     ============================================================ */

  /*
   * GLOBAL CONTENT DENSITY
   */

  .pn001-site .pn001-section {
    padding-top: clamp(68px, 7vw, 96px) !important;
    padding-bottom: clamp(68px, 7vw, 96px) !important;
  }

  .pn001-site .pn001-section-head {
    margin-bottom: clamp(28px, 3.5vw, 46px) !important;
  }

  /*
   * SECTION TYPOGRAPHY
   */

  .pn001-site .pn001-section-head h2,
  .pn001-site .pn001-services h2,
  .pn001-site .pn001-benefits h2,
  .pn001-site .pn001-features h2,
  .pn001-site .pn001-process h2,
  .pn001-site .pn001-testimonials-v6 h2,
  .pn001-site .pn001-faq h2,
  .pn001-site .pn001-contact h2 {
    font-size: clamp(36px, 4.2vw, 52px) !important;
    line-height: 1.02 !important;
    letter-spacing: -0.045em !important;
  }

  .pn001-site .pn001-section-head p,
  .pn001-site .pn001-services .pn001-section-copy,
  .pn001-site .pn001-benefits .pn001-section-copy,
  .pn001-site .pn001-features .pn001-section-copy,
  .pn001-site .pn001-process .pn001-section-copy {
    max-width: 760px !important;
    font-size: clamp(16px, 1.45vw, 18px) !important;
    line-height: 1.65 !important;
  }

  /*
   * HERO
   * Mantem impacto, mas para de ocupar uma tela inteira.
   */

  .pn001-site .pn001-hero {
    min-height: 0 !important;

    padding-top: clamp(54px, 5.5vw, 76px) !important;
    padding-bottom: clamp(58px, 6vw, 82px) !important;
  }

  .pn001-site .pn001-hero h1 {
    max-width: 720px !important;

    font-size: clamp(48px, 5.4vw, 66px) !important;
    line-height: .98 !important;
    letter-spacing: -0.052em !important;
  }

  .pn001-site .pn001-hero p {
    max-width: 620px !important;

    font-size: clamp(16px, 1.5vw, 19px) !important;
    line-height: 1.55 !important;
  }

  .pn001-site .pn001-hero-media,
  .pn001-site .pn001-hero-media img,
  .pn001-site .pn001-hero-image {
    min-height: 400px !important;
    max-height: 520px !important;
  }

  /*
   * GENERIC CARDS
   * Remove gigantismo.
   */

  .pn001-site .pn001-card {
    min-height: 0 !important;
    height: auto !important;

    padding: clamp(24px, 2.8vw, 34px) !important;

    box-shadow:
      0 14px 38px
      rgba(15, 20, 18, .045) !important;
  }

  .pn001-site .pn001-card h3,
  .pn001-site .pn001-card strong {
    font-size: clamp(24px, 2.4vw, 34px) !important;
    line-height: 1.08 !important;
  }

  .pn001-site .pn001-card p {
    font-size: 16px !important;
    line-height: 1.6 !important;
  }

  /*
   * SERVICES
   * Editorial rows.
   * Continua elegante e numerado, mas muito mais compacto.
   */

  .pn001-site .pn001-services .pn001-grid {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 0 !important;

    border-top:
      1px solid
      var(--pn001-line) !important;
  }

  .pn001-site .pn001-services .pn001-card {
    display: grid !important;
    grid-template-columns:
      minmax(72px, .18fr)
      minmax(220px, .75fr)
      minmax(280px, 1.5fr) !important;

    align-items: center !important;

    gap: clamp(20px, 3vw, 46px) !important;

    padding:
      clamp(26px, 3vw, 40px)
      0 !important;

    border: 0 !important;
    border-bottom:
      1px solid
      var(--pn001-line) !important;

    border-radius: 0 !important;

    background: transparent !important;
    box-shadow: none !important;
  }

  .pn001-site .pn001-services .pn001-card-number,
  .pn001-site .pn001-services .pn001-number {
    font-size: clamp(32px, 4vw, 54px) !important;
    opacity: .16 !important;
  }

  /*
   * BENEFITS
   * Nao repete Services.
   * Vira grid compacto com cards leves.
   */

  .pn001-site .pn001-benefits {
    background:
      var(--pn-v63-neutral-white, #f7f8fa) !important;
  }

  .pn001-site .pn001-benefits .pn001-grid {
    display: grid !important;
    grid-template-columns:
      repeat(3, minmax(0, 1fr)) !important;

    gap: 18px !important;
  }

  .pn001-site .pn001-benefits .pn001-card {
    min-height: 220px !important;

    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-end !important;

    padding: 28px !important;

    border:
      1px solid
      var(--pn001-line) !important;

    border-radius: 22px !important;

    background: #ffffff !important;

    box-shadow: none !important;
  }

  .pn001-site .pn001-benefits .pn001-card::before {
    content: "" !important;

    display: block !important;

    width: 42px !important;
    height: 3px !important;

    margin-bottom: auto !important;

    background:
      var(--pn001-accent) !important;

    border-radius: 999px !important;
  }

  /*
   * FEATURES / DIFERENCIAIS
   * Duas colunas editoriais.
   * Diferente de Services e Benefits.
   */

  .pn001-site .pn001-features .pn001-grid {
    display: grid !important;
    grid-template-columns:
      repeat(2, minmax(0, 1fr)) !important;

    gap: 1px !important;

    overflow: hidden !important;

    border:
      1px solid
      var(--pn001-line) !important;

    border-radius: 24px !important;

    background:
      var(--pn001-line) !important;
  }

  .pn001-site .pn001-features .pn001-card {
    min-height: 190px !important;

    padding:
      clamp(28px, 3vw, 40px) !important;

    border: 0 !important;
    border-radius: 0 !important;

    background: #ffffff !important;
    box-shadow: none !important;
  }

  /*
   * PROCESS
   * Timeline horizontal no desktop.
   */

  .pn001-site .pn001-process {
    background:
      var(--pn-v63-neutral-white, #f7f8fa) !important;
  }

  .pn001-site .pn001-process .pn001-grid {
    position: relative !important;

    display: grid !important;
    grid-template-columns:
      repeat(3, minmax(0, 1fr)) !important;

    gap: 22px !important;
  }

  .pn001-site .pn001-process .pn001-grid::before {
    content: "" !important;

    position: absolute !important;

    top: 27px !important;
    left: 7% !important;
    right: 7% !important;

    height: 1px !important;

    background:
      color-mix(
        in srgb,
        var(--pn001-accent) 34%,
        var(--pn001-line)
      ) !important;
  }

  .pn001-site .pn001-process .pn001-card {
    position: relative !important;
    z-index: 1 !important;

    min-height: 0 !important;

    padding:
      70px
      24px
      26px !important;

    border: 0 !important;
    border-radius: 0 !important;

    background: transparent !important;
    box-shadow: none !important;
  }

  .pn001-site .pn001-process .pn001-card-number,
  .pn001-site .pn001-process .pn001-number {
    position: absolute !important;

    top: 8px !important;
    left: 24px !important;

    display: flex !important;

    width: 40px !important;
    height: 40px !important;

    align-items: center !important;
    justify-content: center !important;

    border-radius: 999px !important;

    background:
      var(--pn001-accent) !important;

    color:
      var(--pn001-accent-contrast) !important;

    font-size: 13px !important;
    font-weight: 800 !important;

    opacity: 1 !important;
  }

  /*
   * ABOUT
   * Nao muda estrutura/composicao.
   * Somente impede tipografia gigante.
   */

  .pn001-site .pn001-about h2 {
    font-size: clamp(40px, 4.7vw, 58px) !important;
    line-height: 1 !important;
  }

  /*
   * TESTIMONIALS
   */

  .pn001-site .pn001-testimonials-v6 {
    padding-top: clamp(70px, 7vw, 94px) !important;
    padding-bottom: clamp(70px, 7vw, 94px) !important;
  }

  .pn001-site .pn001-testimonials-v6 .pn001-quote,
  .pn001-site .pn001-testimonials-v6 .pn001-card {
    min-height: 0 !important;

    padding: 24px !important;

    border-radius: 20px !important;
  }

  .pn001-site .pn001-quote {
    min-height: 0 !important;
  }

  /*
   * FAQ
   */

  .pn001-site .pn001-faq {
    padding-top: clamp(72px, 7vw, 96px) !important;
    padding-bottom: clamp(72px, 7vw, 96px) !important;
  }

  .pn001-site .pn001-faq-layout,
  .pn001-site .pn001-faq-grid {
    gap: clamp(34px, 5vw, 72px) !important;
  }

  .pn001-site .pn001-faq h2 {
    max-width: 440px !important;
  }

  .pn001-site .pn001-faq details,
  .pn001-site .pn001-faq-item {
    min-height: 0 !important;
  }

  .pn001-site .pn001-faq summary {
    padding:
      22px
      24px !important;

    font-size: clamp(16px, 1.4vw, 18px) !important;
  }

  /*
   * CONTACT
   */

  .pn001-site .pn001-contact {
    padding-top: clamp(68px, 7vw, 94px) !important;
    padding-bottom: clamp(68px, 7vw, 94px) !important;
  }

  .pn001-site .pn001-contact-card,
  .pn001-site .pn001-contact-shell {
    min-height: 0 !important;

    padding:
      clamp(32px, 4vw, 54px) !important;

    border-radius: 28px !important;
  }

  .pn001-site .pn001-contact input,
  .pn001-site .pn001-contact textarea {
    font-size: 16px !important;
  }

  .pn001-site .pn001-contact textarea {
    min-height: 110px !important;
  }

  /*
   * FINAL CTA
   */

  .pn001-site .pn001-final-cta {
    min-height: 0 !important;

    padding:
      clamp(52px, 6vw, 76px)
      0 !important;
  }

  .pn001-site .pn001-final-cta-card,
  .pn001-site .pn-v2-final-cta-card {
    min-height: 0 !important;

    padding:
      clamp(30px, 4vw, 46px) !important;
  }

  .pn001-site .pn001-final-cta h2,
  .pn001-site .pn001-final h2 {
    font-size: clamp(38px, 4.5vw, 56px) !important;
    line-height: 1 !important;
  }

  /*
   * TABLET
   */

  @media (max-width: 900px) {

    .pn001-site .pn001-benefits .pn001-grid,
    .pn001-site .pn001-process .pn001-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr)) !important;
    }

    .pn001-site .pn001-services .pn001-card {
      grid-template-columns:
        64px
        1fr !important;
    }

    .pn001-site .pn001-services .pn001-card p {
      grid-column: 2 !important;
    }

    .pn001-site .pn001-process .pn001-grid::before {
      display: none !important;
    }
  }

  /*
   * MOBILE
   */

  @media (max-width: 700px) {

    .pn001-site .pn001-section {
      padding-top: 58px !important;
      padding-bottom: 58px !important;
    }

    .pn001-site .pn001-section-head h2,
    .pn001-site .pn001-services h2,
    .pn001-site .pn001-benefits h2,
    .pn001-site .pn001-features h2,
    .pn001-site .pn001-process h2,
    .pn001-site .pn001-testimonials-v6 h2,
    .pn001-site .pn001-faq h2,
    .pn001-site .pn001-contact h2 {
      font-size: clamp(32px, 9vw, 42px) !important;
    }

    .pn001-site .pn001-hero {
      padding-top: 42px !important;
      padding-bottom: 52px !important;
    }

    .pn001-site .pn001-hero h1 {
      font-size: clamp(42px, 12vw, 56px) !important;
    }

    .pn001-site .pn001-hero-media,
    .pn001-site .pn001-hero-media img,
    .pn001-site .pn001-hero-image {
      min-height: 300px !important;
      max-height: 400px !important;
    }

    .pn001-site .pn001-services .pn001-card {
      grid-template-columns: 52px 1fr !important;

      gap: 14px !important;

      padding:
        24px
        0 !important;
    }

    .pn001-site .pn001-benefits .pn001-grid,
    .pn001-site .pn001-features .pn001-grid,
    .pn001-site .pn001-process .pn001-grid {
      grid-template-columns: 1fr !important;
    }

    .pn001-site .pn001-benefits .pn001-card,
    .pn001-site .pn001-features .pn001-card {
      min-height: 0 !important;
    }

    .pn001-site .pn001-process .pn001-card {
      padding:
        62px
        4px
        22px !important;
    }

    .pn001-site .pn001-process .pn001-card-number,
    .pn001-site .pn001-process .pn001-number {
      left: 4px !important;
    }

    .pn001-site .pn001-about h2 {
      font-size: clamp(36px, 10vw, 48px) !important;
    }

    .pn001-site .pn001-final-cta h2,
    .pn001-site .pn001-final h2 {
      font-size: clamp(34px, 9vw, 44px) !important;
    }
  }


  /* PAGENOVA_V651_BEGIN
     ============================================================
     PAGENOVA V6.5.1
     COMPACT PREMIUM COMPOSITION

     Header  : preserved
     About   : preserved
     Footer  : preserved
     ============================================================ */

  /*
   * GLOBAL DENSITY
   */

  .pn001-site .pn001-section:not(.pn001-about) {
    padding-top:
      clamp(46px, 4.8vw, 66px) !important;

    padding-bottom:
      clamp(46px, 4.8vw, 66px) !important;
  }

  .pn001-site
  .pn001-section:not(.pn001-about)
  + .pn001-section:not(.pn001-about) {
    padding-top:
      clamp(38px, 4vw, 56px) !important;
  }

  .pn001-site .pn001-section-head {
    margin-bottom:
      clamp(20px, 2.5vw, 30px) !important;
  }

  .pn001-site .pn001-section-head h2,
  .pn001-site .pn001-services h2,
  .pn001-site .pn001-benefits h2,
  .pn001-site .pn001-features h2,
  .pn001-site .pn001-process h2,
  .pn001-site .pn001-testimonials-v6 h2,
  .pn001-site .pn001-faq h2,
  .pn001-site .pn001-contact h2 {
    font-size:
      clamp(31px, 3.4vw, 45px) !important;

    line-height: 1.03 !important;
  }

  .pn001-site .pn001-section-head p,
  .pn001-site .pn001-section-copy {
    font-size:
      clamp(15px, 1.25vw, 17px) !important;

    line-height: 1.55 !important;
  }

  /*
   * GENERIC CARDS
   */

  .pn001-site .pn001-card {
    min-height: 0 !important;
    height: auto !important;

    border-radius: 18px !important;

    box-shadow:
      0 10px 28px
      rgba(18, 31, 25, .04) !important;
  }

  .pn001-site .pn001-card-index {
    height: auto !important;

    padding:
      20px
      20px
      4px !important;

    font-size:
      clamp(27px, 2.6vw, 36px) !important;
  }

  .pn001-site .pn001-card-content {
    padding:
      18px
      20px
      22px !important;
  }

  .pn001-site .pn001-card-content h3 {
    margin-bottom: 8px !important;

    font-size:
      clamp(19px, 1.7vw, 23px) !important;

    line-height: 1.12 !important;
  }

  .pn001-site .pn001-card-content p {
    font-size: 15px !important;
    line-height: 1.5 !important;
  }

  /*
   * TEXT-ONLY CARDS
   */

  .pn001-site
  .pn-v3-grid-text-only
  .pn-v3-card-text {
    display: grid !important;

    grid-template-columns:
      62px
      minmax(0, 1fr) !important;

    align-items: start !important;

    min-height: 0 !important;

    overflow: hidden !important;
  }

  .pn001-site
  .pn-v3-grid-text-only
  .pn-v3-card-text
  .pn001-card-index {
    display: flex !important;

    align-items: flex-start !important;
    justify-content: flex-start !important;

    height: 100% !important;

    padding:
      20px
      0
      20px
      20px !important;

    font-size: 24px !important;

    border-right:
      1px solid
      var(--pn001-line) !important;
  }

  .pn001-site
  .pn-v3-grid-text-only
  .pn-v3-card-text
  .pn001-card-content {
    padding:
      20px
      22px !important;
  }

  /*
   * SERVICES
   * True editorial rows.
   */

  .pn001-site
  .pn001-services
  .pn-v3-grid-text-only {
    grid-template-columns: 1fr !important;

    gap: 0 !important;

    border-top:
      1px solid
      var(--pn001-line) !important;
  }

  .pn001-site
  .pn001-services
  .pn-v3-card-text {
    grid-template-columns:
      76px
      minmax(210px, .72fr)
      minmax(280px, 1.28fr) !important;

    align-items: center !important;

    border: 0 !important;

    border-bottom:
      1px solid
      var(--pn001-line) !important;

    border-radius: 0 !important;

    background: transparent !important;

    box-shadow: none !important;
  }

  .pn001-site
  .pn001-services
  .pn-v3-card-text:hover {
    transform: none !important;
    box-shadow: none !important;
  }

  .pn001-site
  .pn001-services
  .pn-v3-card-text
  .pn001-card-index {
    height: auto !important;

    padding:
      19px
      0 !important;

    border-right: 0 !important;

    font-size: 25px !important;

    opacity: .42 !important;
  }

  .pn001-site
  .pn001-services
  .pn-v3-card-text
  .pn001-card-content {
    display: contents !important;
  }

  .pn001-site
  .pn001-services
  .pn-v3-card-text
  h3 {
    margin: 0 !important;

    padding:
      19px
      20px
      19px
      0 !important;

    font-size:
      clamp(20px, 1.8vw, 25px) !important;
  }

  .pn001-site
  .pn001-services
  .pn-v3-card-text
  p {
    margin: 0 !important;

    padding:
      19px
      0 !important;

    font-size: 15px !important;
    line-height: 1.5 !important;
  }

  /*
   * BENEFITS
   */

  .pn001-site
  .pn001-benefits
  .pn001-grid {
    grid-template-columns:
      repeat(3, minmax(0, 1fr)) !important;

    gap: 13px !important;
  }

  .pn001-site
  .pn001-benefits
  .pn001-card {
    min-height: 145px !important;

    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-end !important;

    padding: 20px !important;
  }

  .pn001-site
  .pn001-benefits
  .pn001-card-index {
    height: auto !important;

    padding:
      0
      0
      22px !important;

    font-size: 22px !important;
  }

  .pn001-site
  .pn001-benefits
  .pn001-card-content {
    padding: 0 !important;
  }

  /*
   * FEATURES / DIFFERENTIALS
   */

  .pn001-site
  .pn001-features
  .pn001-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr)) !important;

    gap: 1px !important;

    overflow: hidden !important;

    border:
      1px solid
      var(--pn001-line) !important;

    border-radius: 18px !important;

    background:
      var(--pn001-line) !important;
  }

  .pn001-site
  .pn001-features
  .pn001-card {
    min-height: 0 !important;

    border: 0 !important;
    border-radius: 0 !important;

    background: #ffffff !important;

    box-shadow: none !important;
  }

  .pn001-site
  .pn001-features
  .pn001-card:hover {
    transform: none !important;
    box-shadow: none !important;
  }

  /*
   * PROCESS
   */

  .pn001-site
  .pn001-process
  .pn001-grid {
    position: relative !important;

    grid-template-columns:
      repeat(3, minmax(0, 1fr)) !important;

    gap: 0 !important;
  }

  .pn001-site
  .pn001-process
  .pn001-grid::before {
    content: "" !important;

    position: absolute !important;

    top: 20px !important;
    left: 20px !important;
    right: 20px !important;

    height: 1px !important;

    background:
      color-mix(
        in srgb,
        var(--pn001-accent) 30%,
        var(--pn001-line)
      ) !important;
  }

  .pn001-site
  .pn001-process
  .pn001-card {
    position: relative !important;
    z-index: 1 !important;

    min-height: 0 !important;

    border: 0 !important;
    border-radius: 0 !important;

    background: transparent !important;

    box-shadow: none !important;
  }

  .pn001-site
  .pn001-process
  .pn001-card:hover {
    transform: none !important;
    box-shadow: none !important;
  }

  .pn001-site
  .pn001-process
  .pn001-card-index {
    position: relative !important;

    display: flex !important;

    width: 40px !important;
    height: 40px !important;

    margin-bottom: 14px !important;

    padding: 0 !important;

    align-items: center !important;
    justify-content: center !important;

    border: 0 !important;

    border-radius: 999px !important;

    background:
      var(--pn001-accent) !important;

    color:
      var(--pn001-accent-contrast) !important;

    font-size: 12px !important;
  }

  .pn001-site
  .pn001-process
  .pn001-card-content {
    padding:
      0
      20px
      12px
      0 !important;
  }

  /*
   * TESTIMONIALS
   */

  .pn001-site
  .pn001-testimonials-v6 {
    padding-top:
      clamp(46px, 4.8vw, 64px) !important;

    padding-bottom:
      clamp(46px, 4.8vw, 64px) !important;
  }

  .pn001-site
  .pn001-testimonial-heading {
    margin-bottom:
      clamp(20px, 2.5vw, 28px) !important;
  }

  .pn001-site
  .pn001-testimonial-slider {
    gap: 13px !important;

    overflow-x: auto !important;

    scroll-behavior: smooth !important;

    scroll-snap-type:
      x mandatory !important;

    transform: none !important;

    scrollbar-width: none !important;
  }

  .pn001-site
  .pn001-testimonial-slider::-webkit-scrollbar {
    display: none !important;
  }

  .pn001-site
  .pn001-testimonial-card-v6 {
    flex:
      0
      0
      clamp(260px, 27vw, 330px) !important;

    min-height: 220px !important;

    padding:
      18px
      20px !important;

    border-radius: 17px !important;

    scroll-snap-align: start !important;
  }

  .pn001-site
  .pn001-testimonial-card-v6
  > p {
    margin-top: 16px !important;

    font-size: 15px !important;

    line-height: 1.5 !important;
  }

  .pn001-site
  .pn001-testimonial-stars {
    margin-top: 16px !important;

    font-size: 12px !important;

    letter-spacing: 3px !important;
  }

  /*
   * FAQ
   */

  .pn001-site
  .pn001-faq-v6 {
    padding-top:
      clamp(46px, 4.8vw, 64px) !important;

    padding-bottom:
      clamp(46px, 4.8vw, 64px) !important;
  }

  .pn001-site
  .pn001-faq-v6
  .pn001-faq-layout {
    gap:
      clamp(28px, 4.5vw, 64px) !important;
  }

  .pn001-site
  .pn001-faq-item
  summary {
    padding:
      17px
      0 !important;
  }

  /*
   * CONTACT
   */

  .pn001-site
  .pn001-contact {
    padding-top:
      clamp(46px, 4.8vw, 64px) !important;

    padding-bottom:
      clamp(46px, 4.8vw, 64px) !important;
  }

  .pn001-site
  .pn001-contact-shell,
  .pn001-site
  .pn001-contact-card {
    min-height: 0 !important;
  }

  /*
   * FINAL CTA
   */

  .pn001-site
  .pn001-final-cta {
    min-height: 0 !important;

    padding-top:
      clamp(38px, 4vw, 54px) !important;

    padding-bottom:
      clamp(38px, 4vw, 54px) !important;
  }

  .pn001-site
  .pn001-final-cta-card {
    min-height: 0 !important;

    padding:
      clamp(28px, 4vw, 48px) !important;
  }

  /*
   * TABLET
   */

  @media (max-width: 900px) {

    .pn001-site
    .pn001-services
    .pn-v3-card-text {
      grid-template-columns:
        54px
        minmax(0, 1fr) !important;

      align-items: start !important;
    }

    .pn001-site
    .pn001-services
    .pn-v3-card-text
    .pn001-card-content {
      display: block !important;

      padding:
        18px
        0 !important;
    }

    .pn001-site
    .pn001-services
    .pn-v3-card-text
    h3 {
      margin-bottom: 7px !important;
      padding: 0 !important;
    }

    .pn001-site
    .pn001-services
    .pn-v3-card-text
    p {
      padding: 0 !important;
    }

    .pn001-site
    .pn001-benefits
    .pn001-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr)) !important;
    }

    .pn001-site
    .pn001-process
    .pn001-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr)) !important;
    }

    .pn001-site
    .pn001-process
    .pn001-grid::before {
      display: none !important;
    }
  }

  /*
   * MOBILE
   */

  @media (max-width: 640px) {

    .pn001-site
    .pn001-section:not(.pn001-about) {
      padding-top: 40px !important;
      padding-bottom: 40px !important;
    }

    .pn001-site
    .pn001-section:not(.pn001-about)
    + .pn001-section:not(.pn001-about) {
      padding-top: 34px !important;
    }

    .pn001-site
    .pn001-section-head {
      margin-bottom: 20px !important;
    }

    .pn001-site .pn001-section-head h2,
    .pn001-site .pn001-services h2,
    .pn001-site .pn001-benefits h2,
    .pn001-site .pn001-features h2,
    .pn001-site .pn001-process h2,
    .pn001-site .pn001-testimonials-v6 h2,
    .pn001-site .pn001-faq h2,
    .pn001-site .pn001-contact h2 {
      font-size: 31px !important;
    }

    .pn001-site
    .pn-v3-grid-text-only
    .pn-v3-card-text {
      grid-template-columns:
        46px
        minmax(0, 1fr) !important;
    }

    .pn001-site
    .pn-v3-grid-text-only
    .pn-v3-card-text
    .pn001-card-index {
      padding:
        17px
        0
        17px
        14px !important;

      font-size: 20px !important;
    }

    .pn001-site
    .pn-v3-grid-text-only
    .pn-v3-card-text
    .pn001-card-content {
      padding:
        17px
        16px !important;
    }

    .pn001-site
    .pn001-benefits
    .pn001-grid,
    .pn001-site
    .pn001-features
    .pn001-grid,
    .pn001-site
    .pn001-process
    .pn001-grid {
      grid-template-columns:
        1fr !important;
    }

    .pn001-site
    .pn001-benefits
    .pn001-card {
      min-height: 0 !important;
    }

    .pn001-site
    .pn001-testimonials-v6,
    .pn001-site
    .pn001-faq-v6,
    .pn001-site
    .pn001-contact {
      padding-top: 40px !important;
      padding-bottom: 40px !important;
    }

    .pn001-site
    .pn001-testimonial-card-v6 {
      flex:
        0
        0
        min(82vw, 290px) !important;

      min-height: 205px !important;

      padding: 17px !important;
    }

    .pn001-site
    .pn001-final-cta {
      padding-top: 32px !important;
      padding-bottom: 32px !important;
    }

    .pn001-site
    .pn001-final-cta-card {
      padding:
        26px
        20px !important;
    }
  }

  /* PAGENOVA_V651_END */


  /* PAGENOVA_V66_BEGIN
     ============================================================
     STRUCTURAL COMPOSITION SYSTEM
     ============================================================ */

  .pn001-site .pn001-v66-services,
  .pn001-site .pn001-v66-benefits,
  .pn001-site .pn001-v66-features,
  .pn001-site .pn001-v66-process {
    padding-top:
      clamp(48px, 5vw, 70px) !important;

    padding-bottom:
      clamp(48px, 5vw, 70px) !important;
  }

  /*
   * SHARED HEAD
   */

  .pn001-site .pn001-v66-head {
    display: grid !important;

    grid-template-columns:
      minmax(110px, .34fr)
      minmax(0, 1.66fr) !important;

    gap:
      clamp(22px, 4.5vw, 68px) !important;

    align-items:
      start !important;

    margin-bottom:
      clamp(25px, 3.4vw, 42px) !important;
  }

  .pn001-site .pn001-v66-head-copy {
    max-width:
      760px !important;
  }

  .pn001-site .pn001-v66-head h2 {
    margin:
      0 !important;

    font-size:
      clamp(30px, 3.2vw, 44px) !important;

    line-height:
      1.03 !important;
  }

  .pn001-site .pn001-v66-head p {
    max-width:
      660px !important;

    margin:
      12px 0 0 !important;

    font-size:
      15px !important;

    line-height:
      1.55 !important;

    color:
      var(--pn001-muted) !important;
  }

  /*
   * SERVICES
   * Thin editorial rows.
   */

  .pn001-site .pn001-v66-service-list {
    border-top:
      1px solid var(--pn001-line) !important;
  }

  .pn001-site .pn001-v66-service-row {
    display:
      grid !important;

    grid-template-columns:
      52px
      minmax(180px, .72fr)
      minmax(260px, 1.28fr)
      34px !important;

    gap:
      clamp(14px, 2.2vw, 32px) !important;

    align-items:
      center !important;

    min-height:
      94px !important;

    padding:
      17px 2px !important;

    margin:
      0 !important;

    border:
      0 !important;

    border-bottom:
      1px solid var(--pn001-line) !important;

    border-radius:
      0 !important;

    background:
      transparent !important;

    box-shadow:
      none !important;
  }

  .pn001-site .pn001-v66-service-number {
    font-size:
      11px !important;

    font-weight:
      800 !important;

    letter-spacing:
      .12em !important;

    color:
      var(--pn001-accent) !important;
  }

  .pn001-site .pn001-v66-service-row h3 {
    margin:
      0 !important;

    font-size:
      clamp(19px, 1.7vw, 24px) !important;

    line-height:
      1.12 !important;
  }

  .pn001-site .pn001-v66-service-row p {
    margin:
      0 !important;

    font-size:
      14px !important;

    line-height:
      1.55 !important;

    color:
      var(--pn001-muted) !important;
  }

  .pn001-site .pn001-v66-service-arrow {
    display:
      grid !important;

    place-items:
      center !important;

    width:
      32px !important;

    height:
      32px !important;

    border:
      1px solid var(--pn001-line) !important;

    border-radius:
      999px !important;
  }

  /*
   * BENEFITS
   * Compact tiles.
   */

  .pn001-site .pn001-v66-benefits {
    background:
      var(--pn001-surface-soft) !important;
  }

  .pn001-site .pn001-v66-benefit-grid {
    display:
      grid !important;

    grid-template-columns:
      repeat(3, minmax(0, 1fr)) !important;

    gap:
      14px !important;
  }

  .pn001-site .pn001-v66-benefit {
    min-height:
      180px !important;

    padding:
      21px !important;

    border:
      1px solid var(--pn001-line) !important;

    border-radius:
      15px !important;

    background:
      var(--pn001-surface) !important;

    box-shadow:
      none !important;
  }

  .pn001-site .pn001-v66-benefit-top {
    display:
      flex !important;

    align-items:
      center !important;

    justify-content:
      space-between !important;

    margin-bottom:
      25px !important;
  }

  .pn001-site .pn001-v66-benefit-dot {
    width:
      8px !important;

    height:
      8px !important;

    border-radius:
      999px !important;

    background:
      var(--pn001-accent) !important;
  }

  .pn001-site .pn001-v66-benefit-number {
    font-size:
      10px !important;

    font-weight:
      800 !important;

    opacity:
      .46 !important;
  }

  .pn001-site .pn001-v66-benefit h3 {
    margin:
      0 0 8px !important;

    font-size:
      clamp(19px, 1.6vw, 23px) !important;

    line-height:
      1.12 !important;
  }

  .pn001-site .pn001-v66-benefit p {
    margin:
      0 !important;

    font-size:
      14px !important;

    line-height:
      1.5 !important;

    color:
      var(--pn001-muted) !important;
  }

  /*
   * DIFFERENTIALS
   * Own dark editorial identity.
   */

  .pn001-site .pn001-v66-feature-shell {
    padding:
      clamp(28px, 4vw, 48px) !important;

    border-radius:
      22px !important;

    background:
      var(--pn001-dark) !important;

    color:
      #ffffff !important;
  }

  .pn001-site
  .pn001-v66-feature-shell
  .pn001-eyebrow {
    color:
      var(--pn001-accent) !important;
  }

  .pn001-site
  .pn001-v66-feature-shell
  .pn001-v66-head p {
    color:
      rgba(255,255,255,.64) !important;
  }

  .pn001-site .pn001-v66-feature-grid {
    display:
      grid !important;

    grid-template-columns:
      repeat(2, minmax(0, 1fr)) !important;

    border-top:
      1px solid rgba(255,255,255,.14) !important;

    border-left:
      1px solid rgba(255,255,255,.14) !important;
  }

  .pn001-site .pn001-v66-feature {
    display:
      grid !important;

    grid-template-columns:
      40px
      minmax(0, 1fr) !important;

    gap:
      15px !important;

    min-height:
      142px !important;

    padding:
      22px !important;

    border-right:
      1px solid rgba(255,255,255,.14) !important;

    border-bottom:
      1px solid rgba(255,255,255,.14) !important;
  }

  .pn001-site .pn001-v66-feature-index {
    display:
      grid !important;

    place-items:
      center !important;

    width:
      32px !important;

    height:
      32px !important;

    border:
      1px solid rgba(255,255,255,.25) !important;

    border-radius:
      999px !important;

    font-size:
      10px !important;

    font-weight:
      800 !important;
  }

  .pn001-site .pn001-v66-feature h3 {
    margin:
      2px 0 7px !important;

    color:
      #ffffff !important;

    font-size:
      clamp(18px, 1.55vw, 22px) !important;
  }

  .pn001-site .pn001-v66-feature p {
    margin:
      0 !important;

    color:
      rgba(255,255,255,.62) !important;

    font-size:
      14px !important;

    line-height:
      1.5 !important;
  }

  /*
   * PROCESS
   * Horizontal timeline.
   */

  .pn001-site .pn001-v66-process-timeline {
    display:
      flex !important;

    align-items:
      flex-start !important;

    width:
      100% !important;

    gap:
      0 !important;
  }

  .pn001-site .pn001-v66-process-step {
    flex:
      1 1 0 !important;

    min-width:
      0 !important;

    padding-right:
      clamp(16px, 2.5vw, 32px) !important;
  }

  .pn001-site .pn001-v66-process-track {
    display:
      flex !important;

    align-items:
      center !important;

    margin-bottom:
      18px !important;
  }

  .pn001-site .pn001-v66-process-node {
    display:
      grid !important;

    place-items:
      center !important;

    flex:
      0 0 40px !important;

    width:
      40px !important;

    height:
      40px !important;

    border-radius:
      999px !important;

    background:
      var(--pn001-accent) !important;

    color:
      var(--pn001-accent-contrast) !important;

    font-size:
      11px !important;

    font-weight:
      800 !important;
  }

  .pn001-site .pn001-v66-process-line {
    display:
      block !important;

    flex:
      1 1 auto !important;

    height:
      1px !important;

    background:
      var(--pn001-line) !important;
  }

  .pn001-site
  .pn001-v66-process-step:last-child
  .pn001-v66-process-line {
    opacity:
      0 !important;
  }

  .pn001-site .pn001-v66-process-copy {
    max-width:
      245px !important;
  }

  .pn001-site .pn001-v66-process-copy h3 {
    margin:
      0 0 7px !important;

    font-size:
      clamp(18px, 1.5vw, 22px) !important;

    line-height:
      1.14 !important;
  }

  .pn001-site .pn001-v66-process-copy p {
    margin:
      0 !important;

    color:
      var(--pn001-muted) !important;

    font-size:
      14px !important;

    line-height:
      1.5 !important;
  }

  /*
   * TESTIMONIALS
   */

  .pn001-site .pn001-testimonials,
  .pn001-site .pn001-testimonials-v6 {
    overflow:
      hidden !important;

    padding-top:
      clamp(44px, 4.5vw, 62px) !important;

    padding-bottom:
      clamp(44px, 4.5vw, 62px) !important;
  }

  .pn001-site .pn001-testimonial-slider {
    display:
      flex !important;

    grid-template-columns:
      none !important;

    grid-auto-flow:
      unset !important;

    grid-auto-columns:
      unset !important;

    gap:
      14px !important;

    width:
      max-content !important;

    max-width:
      none !important;

    overflow:
      visible !important;

    scroll-snap-type:
      none !important;

    will-change:
      transform !important;
  }

  .pn001-site
  .pn001-testimonial-slider
  > * {
    flex:
      0 0 clamp(260px, 27vw, 318px) !important;

    width:
      clamp(260px, 27vw, 318px) !important;

    min-width:
      0 !important;

    min-height:
      205px !important;

    height:
      auto !important;
  }

  .pn001-site .pn001-testimonial-card-v6,
  .pn001-site
  .pn001-testimonial-slider
  .pn001-quote {
    padding:
      18px !important;

    border-radius:
      16px !important;
  }

  .pn001-site .pn001-testimonial-stars {
    margin-top:
      16px !important;
  }

  .pn001-site .pn001-testimonial-card-v6 > p,
  .pn001-site
  .pn001-testimonial-slider
  blockquote {
    margin-top:
      14px !important;

    font-size:
      14px !important;

    line-height:
      1.52 !important;
  }

  /*
   * FINAL CTA
   */

  .pn001-site .pn001-final-cta {
    padding-top:
      28px !important;

    padding-bottom:
      32px !important;
  }

  .pn001-site .pn001-final-cta-card {
    display:
      grid !important;

    grid-template-columns:
      minmax(0, 1fr)
      auto !important;

    align-items:
      center !important;

    gap:
      clamp(24px, 4vw, 58px) !important;

    min-height:
      0 !important;

    padding:
      clamp(25px, 3vw, 36px)
      clamp(25px, 4vw, 46px) !important;

    border-radius:
      19px !important;
  }

  .pn001-site .pn001-final-cta-copy {
    max-width:
      700px !important;
  }

  .pn001-site .pn001-final-cta-copy h2 {
    margin:
      6px 0 8px !important;

    font-size:
      clamp(27px, 2.8vw, 40px) !important;

    line-height:
      1.04 !important;
  }

  .pn001-site .pn001-final-cta-copy p {
    margin:
      0 !important;

    max-width:
      600px !important;

    font-size:
      14px !important;

    line-height:
      1.5 !important;
  }

  /*
   * TABLET
   */

  @media (max-width: 980px) {

    .pn001-site .pn001-v66-head {
      grid-template-columns:
        1fr !important;

      gap:
        9px !important;
    }

    .pn001-site .pn001-v66-benefit-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr)) !important;
    }

    .pn001-site .pn001-v66-service-row {
      grid-template-columns:
        42px
        minmax(150px, .8fr)
        minmax(0, 1.2fr)
        32px !important;
    }

    .pn001-site .pn001-v66-process-timeline {
      display:
        grid !important;

      grid-template-columns:
        1fr !important;
    }

    .pn001-site .pn001-v66-process-step {
      display:
        grid !important;

      grid-template-columns:
        42px
        minmax(0, 1fr) !important;

      gap:
        15px !important;

      padding:
        0 0 20px !important;
    }

    .pn001-site .pn001-v66-process-track {
      flex-direction:
        column !important;

      margin:
        0 !important;
    }

    .pn001-site .pn001-v66-process-line {
      width:
        1px !important;

      min-height:
        54px !important;

      flex:
        1 1 54px !important;
    }

    .pn001-site .pn001-v66-process-copy {
      max-width:
        520px !important;

      padding-top:
        7px !important;
    }
  }

  /*
   * MOBILE
   */

  @media (max-width: 700px) {

    .pn001-site .pn001-v66-services,
    .pn001-site .pn001-v66-benefits,
    .pn001-site .pn001-v66-features,
    .pn001-site .pn001-v66-process {
      padding-top:
        40px !important;

      padding-bottom:
        40px !important;
    }

    .pn001-site .pn001-v66-service-row {
      grid-template-columns:
        34px
        minmax(0, 1fr)
        30px !important;

      gap:
        10px !important;

      min-height:
        0 !important;

      padding:
        16px 0 !important;
    }

    .pn001-site .pn001-v66-service-row p {
      grid-column:
        2 / 4 !important;

      padding-right:
        10px !important;
    }

    .pn001-site .pn001-v66-benefit-grid {
      grid-template-columns:
        1fr !important;
    }

    .pn001-site .pn001-v66-benefit {
      min-height:
        0 !important;
    }

    .pn001-site .pn001-v66-feature-shell {
      padding:
        23px 17px !important;

      border-radius:
        18px !important;
    }

    .pn001-site .pn001-v66-feature-grid {
      grid-template-columns:
        1fr !important;
    }

    .pn001-site .pn001-v66-feature {
      min-height:
        0 !important;

      padding:
        18px 15px !important;
    }

    .pn001-site
    .pn001-testimonial-slider
    > * {
      flex-basis:
        min(82vw, 284px) !important;

      width:
        min(82vw, 284px) !important;
    }

    .pn001-site .pn001-final-cta-card {
      grid-template-columns:
        1fr !important;

      gap:
        18px !important;

      padding:
        24px 19px !important;
    }
  }


  /* ========================================================
     PAGENOVA V6.7 - GLOBAL COMPOSITION QUALITY
     Keeps every generated page centered, readable and stable.
     ======================================================== */

  .pn001-site,
  .pn001-site * { box-sizing: border-box !important; }

  .pn001-site {
    overflow-x: clip !important;
    text-rendering: optimizeLegibility !important;
  }

  .pn001-site .pn001-container {
    width: min(calc(100% - clamp(32px, 7vw, 96px)), 1180px) !important;
    max-width: 1180px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  .pn001-site h1,
  .pn001-site h2,
  .pn001-site h3,
  .pn001-site p,
  .pn001-site a,
  .pn001-site span {
    overflow-wrap: break-word !important;
    word-break: normal !important;
  }

  .pn001-site img {
    max-width: 100% !important;
    height: auto;
  }

  .pn001-site .pn001-section,
  .pn001-site .pn001-about,
  .pn001-site .pn001-contact,
  .pn001-site .pn001-testimonials,
  .pn001-site .pn001-testimonials-v6 {
    height: auto !important;
    min-height: 0 !important;
  }

  .pn001-site .pn001-section-head,
  .pn001-site .pn001-v66-head {
    width: 100% !important;
    max-width: 920px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  .pn001-site .pn001-section-head > p,
  .pn001-site .pn001-v66-head-copy > p {
    max-width: 720px !important;
  }

  .pn001-site .pn001-hero-grid,
  .pn001-site .pn001-about-grid,
  .pn001-site .pn001-contact-shell,
  .pn001-site .pn001-faq-layout {
    min-width: 0 !important;
  }

  .pn001-site .pn001-hero-copy,
  .pn001-site .pn001-about-copy,
  .pn001-site .pn001-contact-copy,
  .pn001-site .pn001-v66-head-copy {
    min-width: 0 !important;
  }

  .pn001-site .pn001-hero-actions {
    align-items: center !important;
    flex-wrap: wrap !important;
  }

  .pn001-site .pn001-button,
  .pn001-site .pn001-form-submit {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
  }

  .pn001-site .pn001-footer {
    padding: clamp(42px, 6vw, 72px) 0 clamp(30px, 4vw, 48px) !important;
  }

  .pn001-site .pn001-footer-inner {
    width: 100% !important;
    min-height: 0 !important;
    display: grid !important;
    grid-template-columns: minmax(180px, 1.2fr) repeat(2, minmax(140px, .8fr)) !important;
    align-items: start !important;
    gap: clamp(24px, 5vw, 64px) !important;
    padding-top: clamp(24px, 3vw, 36px) !important;
  }

  .pn001-site .pn001-footer-inner > * {
    min-width: 0 !important;
    max-width: 100% !important;
  }

  .pn001-site .pn001-footer nav,
  .pn001-site .pn001-footer ul {
    display: grid !important;
    gap: 10px !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .pn001-site .pn001-footer a {
    line-height: 1.5 !important;
  }

  @media (max-width: 900px) {
    .pn001-site .pn001-container {
      width: min(calc(100% - 36px), 1180px) !important;
    }

    .pn001-site .pn001-hero-grid,
    .pn001-site .pn001-about-grid,
    .pn001-site .pn001-contact-shell {
      grid-template-columns: minmax(0, 1fr) !important;
      gap: clamp(30px, 7vw, 52px) !important;
    }

    .pn001-site .pn001-hero-copy,
    .pn001-site .pn001-about-copy {
      width: 100% !important;
      max-width: 760px !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    .pn001-site .pn001-hero-visual,
    .pn001-site .pn001-about-visual {
      width: 100% !important;
      max-width: 760px !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    .pn001-site .pn001-footer-inner {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
  }

  @media (max-width: 640px) {
    .pn001-site .pn001-container {
      width: calc(100% - 28px) !important;
    }

    .pn001-site .pn001-header {
      padding-left: 10px !important;
      padding-right: 10px !important;
    }

    .pn001-site .pn001-header-inner {
      width: 100% !important;
      max-width: 100% !important;
    }

    .pn001-site .pn001-hero {
      padding-top: 48px !important;
      padding-bottom: 58px !important;
    }

    .pn001-site .pn001-hero h1 {
      max-width: 100% !important;
      font-size: clamp(38px, 11.5vw, 54px) !important;
      line-height: .98 !important;
      letter-spacing: -.045em !important;
    }

    .pn001-site .pn001-hero-copy > p {
      max-width: 100% !important;
      font-size: 16px !important;
      line-height: 1.62 !important;
    }

    .pn001-site .pn001-hero-actions {
      width: 100% !important;
      gap: 10px !important;
    }

    .pn001-site .pn001-hero-actions .pn001-button {
      width: 100% !important;
      min-height: 50px !important;
    }

    .pn001-site .pn001-hero-image,
    .pn001-site .pn001-about-image {
      width: 100% !important;
      min-height: 0 !important;
      max-height: 520px !important;
      aspect-ratio: 4 / 5 !important;
      object-fit: cover !important;
      object-position: center !important;
    }

    .pn001-site .pn001-section,
    .pn001-site .pn001-v66-services,
    .pn001-site .pn001-v66-benefits,
    .pn001-site .pn001-v66-features,
    .pn001-site .pn001-v66-process {
      padding-top: 56px !important;
      padding-bottom: 56px !important;
    }

    .pn001-site .pn001-section-head h2,
    .pn001-site .pn001-v66-head h2 {
      font-size: clamp(32px, 9vw, 44px) !important;
      line-height: 1.02 !important;
      letter-spacing: -.035em !important;
    }

    .pn001-site .pn001-contact-shell,
    .pn001-site .pn001-contact-card,
    .pn001-site .pn001-form {
      width: 100% !important;
      max-width: 100% !important;
    }

    .pn001-site .pn001-form-row {
      grid-template-columns: 1fr !important;
    }

    .pn001-site .pn001-final-cta {
      padding: 18px 0 28px !important;
    }

    .pn001-site .pn001-final-cta-card,
    .pn001-site .pn-v2-final-cta-card {
      width: 100% !important;
      padding: 28px 20px !important;
    }

    .pn001-site .pn001-footer {
      padding-top: 38px !important;
    }

    .pn001-site .pn001-footer-inner {
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 22px !important;
    }

    .pn001-site .pn001-footer-inner > * {
      width: 100% !important;
    }
  }

  /* ============================================================
     PAGENOVA V6.7 MOBILE CLOSING CONTRACT
     Final CTA + footer must never preserve desktop columns in a
     narrow preview or on a real phone.
     ============================================================ */
  @media (max-width: 760px) {
    .pn001-site .pn001-final-cta-card,
    .pn001-site .pn-v2-final-cta-card {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) !important;
      align-items: start !important;
      gap: 24px !important;
      width: 100% !important;
      min-width: 0 !important;
      padding: 30px 24px !important;
    }

    .pn001-site .pn001-final-cta-copy,
    .pn001-site .pn001-final-cta-action {
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
    }

    .pn001-site .pn001-final-cta h2,
    .pn001-site .pn001-final-cta p {
      width: 100% !important;
      max-width: 100% !important;
      overflow-wrap: normal !important;
      word-break: normal !important;
    }

    .pn001-site .pn001-final-cta h2 {
      font-size: clamp(34px, 10vw, 44px) !important;
      line-height: 1.02 !important;
    }

    .pn001-site .pn001-final-cta-action .pn001-button {
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
    }

    .pn001-site .pn001-footer-main {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) !important;
      gap: 34px !important;
      width: 100% !important;
      min-width: 0 !important;
      padding-bottom: 38px !important;
    }

    .pn001-site .pn001-footer-brand-column,
    .pn001-site .pn001-footer-column {
      grid-column: auto !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .pn001-site .pn001-footer-brand-column p,
    .pn001-site .pn001-footer-links,
    .pn001-site .pn001-footer-links a,
    .pn001-site .pn001-footer-links span {
      max-width: 100% !important;
      overflow-wrap: normal !important;
      word-break: normal !important;
    }

    .pn001-site .pn001-footer-bottom {
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 12px !important;
    }
  }

  /* PAGENOVA_V66_END */
  /* PAGENOVA_V65_END */`;