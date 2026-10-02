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

    background: var(--pn001-dark) !important;
    color: #fff !important;

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
`;

export const PAGENOVA_DESIGN_CORE_V6_SCRIPT = `
(() => {
  const boot = () => {
    const sites = document.querySelectorAll(
      '.pn001-site[data-pagenova-design-version="6"]'
    );

    sites.forEach((site) => {
      if (!(site instanceof HTMLElement)) return;

      /*
       * Automatic testimonial carousel.
       *
       * We clone the original cards once so the motion can loop
       * continuously without a blank gap.
       */
      const slider = site.querySelector(
        '.pn001-testimonial-slider'
      );

      if (
        slider instanceof HTMLElement &&
        slider.dataset.pnV6Carousel !== 'ready'
      ) {
        slider.dataset.pnV6Carousel = 'ready';

        const originalCards = Array.from(slider.children);

        if (originalCards.length > 1) {
          originalCards.forEach((card) => {
            const clone = card.cloneNode(true);

            if (clone instanceof HTMLElement) {
              clone.setAttribute('aria-hidden', 'true');
              clone.dataset.pnV6Clone = 'true';
            }

            slider.appendChild(clone);
          });

          const reduceMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
          );

          let paused = false;
          let position = 0;
          let lastTime = 0;

          const pause = () => {
            paused = true;
          };

          const resume = () => {
            paused = false;
            lastTime = performance.now();
          };

          slider.addEventListener('mouseenter', pause);
          slider.addEventListener('mouseleave', resume);
          slider.addEventListener('focusin', pause);
          slider.addEventListener('focusout', resume);

          const frame = (time) => {
            if (!lastTime) {
              lastTime = time;
            }

            const delta = Math.min(time - lastTime, 40);
            lastTime = time;

            if (!paused && !reduceMotion.matches) {
              position += delta * 0.035;

              const halfWidth = slider.scrollWidth / 2;

              if (halfWidth > 0 && position >= halfWidth) {
                position -= halfWidth;
              }

              slider.style.transform =
                'translate3d(' + (-position) + 'px,0,0)';
            } else if (reduceMotion.matches) {
              slider.style.transform = 'none';
            }

            requestAnimationFrame(frame);
          };

          requestAnimationFrame(frame);
        }
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {
      once: true
    });
  } else {
    boot();
  }
})();
`;