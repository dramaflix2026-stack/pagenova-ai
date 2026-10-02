import type {
  SitePage,
  SitePageKey,
  SiteProject,
} from "@/lib/site-builder";

import {
  PAGENOVA_TEMPLATE_001,
  PAGENOVA_TEMPLATE_001_ID,
  supportsTemplate001,
} from "@/lib/site-builder-template-001";

type SiteSection = SitePage["sections"][number];
type SiteSectionItem = NonNullable<SiteSection["items"]>[number];

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const firstText = (...values: unknown[]): string => {
  for (const value of values) {
    const candidate = text(value);
    if (candidate) return candidate;
  }

  return "";
};

const sectionItems = (section: SiteSection): SiteSectionItem[] =>
  Array.isArray(section.items) ? section.items : [];

const itemTitle = (item: SiteSectionItem): string =>
  firstText(
    "title" in item ? item.title : "",
    "name" in item ? item.name : "",
    "label" in item ? item.label : "",
  );

const itemDescription = (item: SiteSectionItem): string =>
  firstText(
    "description" in item ? item.description : "",
    "text" in item ? item.text : "",
    "body" in item ? item.body : "",
    "content" in item ? item.content : "",
  );

const itemImage = (item: SiteSectionItem): string =>
  firstText(
    "imageUrl" in item ? item.imageUrl : "",
    "image" in item ? item.image : "",
  );

const sectionTitle = (section: SiteSection): string =>
  firstText(section.title);

const sectionSubtitle = (section: SiteSection): string =>
  firstText(section.body);

const sectionBody = (section: SiteSection): string =>
  firstText(section.body);

const sectionImage = (section: SiteSection): string => {
  const itemWithImage = sectionItems(section).find(
    (item) => Boolean(itemImage(item)),
  );

  return itemWithImage ? itemImage(itemWithImage) : "";
};

const sectionByKind = (
  page: SitePage,
  kinds: readonly string[],
): SiteSection | undefined =>
  page.sections.find((section) =>
    section.kind ? kinds.includes(section.kind) : false,
  );

const sectionsByKind = (
  page: SitePage,
  kinds: readonly string[],
): SiteSection[] =>
  page.sections.filter((section) =>
    section.kind ? kinds.includes(section.kind) : false,
  );

const renderImage = (
  src: string,
  alt: string,
  className: string,
): string => {
  if (!src) return "";

  return `
    <img
      class="${className}"
      src="${escapeHtml(src)}"
      alt="${escapeHtml(alt)}"
      loading="lazy"
    />
  `;
};

const renderGenericCards = (
  section: SiteSection,
  eyebrow: string,
): string => {
  const items = sectionItems(section);

  const cards =
    items.length > 0
      ? items
          .map((item, index) => {
            const title =
              itemTitle(item) ||
              `${eyebrow} ${String(index + 1).padStart(2, "0")}`;

            const description = itemDescription(item);
            const image = itemImage(item);

            return `
              <article class="pn001-card">
                ${
                  image
                    ? renderImage(
                        image,
                        title,
                        "pn001-card-image",
                      )
                    : `
                      <div class="pn001-card-index">
                        ${String(index + 1).padStart(2, "0")}
                      </div>
                    `
                }

                <div class="pn001-card-content">
                  <h3>${escapeHtml(title)}</h3>
                  ${
                    description
                      ? `<p>${escapeHtml(description)}</p>`
                      : ""
                  }
                </div>
              </article>
            `;
          })
          .join("")
      : `
        <article class="pn001-card pn001-card-wide">
          <div class="pn001-card-content">
            <h3>${escapeHtml(sectionTitle(section))}</h3>
            ${
              sectionBody(section)
                ? `<p>${escapeHtml(sectionBody(section))}</p>`
                : ""
            }
          </div>
        </article>
      `;

  return `
    <section class="pn001-section" data-kind="${escapeHtml(
      section.kind ?? "",
    )}">
      <div class="pn001-container">
        <div class="pn001-section-head">
          <span class="pn001-eyebrow">${escapeHtml(eyebrow)}</span>
          <h2>${escapeHtml(sectionTitle(section))}</h2>
          ${
            sectionSubtitle(section)
              ? `<p>${escapeHtml(sectionSubtitle(section))}</p>`
              : ""
          }
        </div>

        <div class="pn001-grid">
          ${cards}
        </div>
      </div>
    </section>
  `;
};

const renderHero = (
  project: SiteProject,
  page: SitePage,
  hero: SiteSection | undefined,
): string => {
  const title = firstText(
    hero ? sectionTitle(hero) : "",
    project.name,
    "Uma nova forma de apresentar seu negócio.",
  );

  const description = firstText(
    hero ? sectionSubtitle(hero) : "",
    hero ? sectionBody(hero) : "",
    "Clareza, confiança e uma experiência digital construída para transformar atenção em ação.",
  );

  const image = hero ? sectionImage(hero) : "";

  return `
    <section class="pn001-hero">
      <div class="pn001-container pn001-hero-grid">
        <div class="pn001-hero-copy">
          <span class="pn001-pill">
            ${escapeHtml(project.name || "PageNova")}
          </span>

          <h1>${escapeHtml(title)}</h1>

          <p>${escapeHtml(description)}</p>

          <div class="pn001-hero-actions">
            <a class="pn001-button pn001-button-primary" href="#pn001-main">
              Quero saber mais
            </a>

            <a class="pn001-button pn001-button-secondary" href="#pn001-contact">
              Falar agora
            </a>
          </div>

          <div class="pn001-hero-proof">
            <span class="pn001-proof-dot"></span>
            <span>Experiência clara, moderna e orientada à conversão.</span>
          </div>
        </div>

        <div class="pn001-hero-visual">
          ${
            image
              ? renderImage(
                  image,
                  title,
                  "pn001-hero-image",
                )
              : `
                <div class="pn001-visual-placeholder">
                  <div class="pn001-visual-orb"></div>

                  <div class="pn001-floating-card pn001-floating-card-a">
                    <span>01</span>
                    <strong>Estratégia</strong>
                  </div>

                  <div class="pn001-floating-card pn001-floating-card-b">
                    <span>02</span>
                    <strong>Experiência</strong>
                  </div>

                  <div class="pn001-floating-card pn001-floating-card-c">
                    <span>03</span>
                    <strong>Resultado</strong>
                  </div>
                </div>
              `
          }
        </div>
      </div>
    </section>
  `;
};

const renderAuthority = (
  section: SiteSection,
): string => {
  const items = sectionItems(section);

  if (items.length === 0) {
    return renderGenericCards(section, "Confiança");
  }

  return `
    <section class="pn001-trust">
      <div class="pn001-container">
        <div class="pn001-trust-row">
          ${items
            .slice(0, 4)
            .map((item) => {
              const title = itemTitle(item);
              const description = itemDescription(item);

              return `
                <div class="pn001-trust-item">
                  ${
                    title
                      ? `<strong>${escapeHtml(title)}</strong>`
                      : ""
                  }

                  ${
                    description
                      ? `<span>${escapeHtml(description)}</span>`
                      : ""
                  }
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    </section>
  `;
};

const renderAbout = (
  section: SiteSection,
): string => {
  const image = sectionImage(section);

  return `
    <section class="pn001-section pn001-about">
      <div class="pn001-container pn001-about-grid">
        <div class="pn001-about-copy">
          <span class="pn001-eyebrow">Sobre</span>

          <h2>${escapeHtml(sectionTitle(section))}</h2>

          ${
            sectionBody(section)
              ? `<p>${escapeHtml(sectionBody(section))}</p>`
              : ""
          }
        </div>

        <div class="pn001-about-visual">
          ${
            image
              ? renderImage(
                  image,
                  sectionTitle(section),
                  "pn001-about-image",
                )
              : `
                <div class="pn001-about-panel">
                  <span>PageNova</span>
                  <strong>Uma apresentação que transmite valor antes mesmo da primeira conversa.</strong>
                </div>
              `
          }
        </div>
      </div>
    </section>
  `;
};

const renderTestimonials = (
  section: SiteSection,
): string => {
  const items = sectionItems(section);

  return `
    <section class="pn001-section pn001-testimonials">
      <div class="pn001-container">
        <div class="pn001-section-head">
          <span class="pn001-eyebrow">Experiências</span>
          <h2>${escapeHtml(sectionTitle(section))}</h2>

          ${
            sectionSubtitle(section)
              ? `<p>${escapeHtml(sectionSubtitle(section))}</p>`
              : ""
          }
        </div>

        <div class="pn001-testimonial-grid">
          ${
            items.length
              ? items
                  .slice(0, 6)
                  .map((item) => {
                    const title = itemTitle(item);
                    const description = itemDescription(item);

                    return `
                      <article class="pn001-quote">
                        <div class="pn001-stars">★★★★★</div>

                        ${
                          description
                            ? `<blockquote>“${escapeHtml(
                                description,
                              )}”</blockquote>`
                            : ""
                        }

                        ${
                          title
                            ? `<strong>${escapeHtml(title)}</strong>`
                            : ""
                        }
                      </article>
                    `;
                  })
                  .join("")
              : `
                <article class="pn001-quote">
                  <blockquote>
                    “${escapeHtml(sectionBody(section))}”
                  </blockquote>
                </article>
              `
          }
        </div>
      </div>
    </section>
  `;
};

const renderPricing = (
  section: SiteSection,
): string =>
  renderGenericCards(section, "Planos");

const renderFaq = (
  section: SiteSection,
): string => {
  const items = sectionItems(section);

  return `
    <section class="pn001-section pn001-faq">
      <div class="pn001-container pn001-faq-layout">
        <div class="pn001-section-head pn001-section-head-sticky">
          <span class="pn001-eyebrow">FAQ</span>
          <h2>${escapeHtml(sectionTitle(section))}</h2>

          ${
            sectionSubtitle(section)
              ? `<p>${escapeHtml(sectionSubtitle(section))}</p>`
              : ""
          }
        </div>

        <div class="pn001-faq-list">
          ${
            items.length
              ? items
                  .slice(0, 8)
                  .map((item) => {
                    const title = itemTitle(item);
                    const description = itemDescription(item);

                    return `
                      <details class="pn001-faq-item">
                        <summary>
                          <span>${escapeHtml(title)}</span>
                          <span class="pn001-faq-plus">+</span>
                        </summary>

                        ${
                          description
                            ? `<p>${escapeHtml(description)}</p>`
                            : ""
                        }
                      </details>
                    `;
                  })
                  .join("")
              : `
                <div class="pn001-faq-item pn001-faq-fallback">
                  <p>${escapeHtml(sectionBody(section))}</p>
                </div>
              `
          }
        </div>
      </div>
    </section>
  `;
};

const renderContact = (
  section: SiteSection,
): string => `
  <section
    class="pn001-section pn001-contact"
    id="pn001-contact"
  >
    <div class="pn001-container">
      <div class="pn001-contact-card">
        <div>
          <span class="pn001-eyebrow">Contato</span>
          <h2>${escapeHtml(sectionTitle(section))}</h2>

          ${
            sectionBody(section)
              ? `<p>${escapeHtml(sectionBody(section))}</p>`
              : ""
          }
        </div>

        <a class="pn001-button pn001-button-primary" href="#">
          Entrar em contato
        </a>
      </div>
    </div>
  </section>
`;

const renderFinalCta = (
  project: SiteProject,
  section: SiteSection,
): string => `
  <section class="pn001-final">
    <div class="pn001-container">
      <div class="pn001-final-card">
        <span class="pn001-eyebrow">Próximo passo</span>

        <h2>
          ${escapeHtml(
            firstText(
              sectionTitle(section),
              `Vamos conversar sobre ${project.name}?`,
            ),
          )}
        </h2>

        ${
          sectionBody(section)
            ? `<p>${escapeHtml(sectionBody(section))}</p>`
            : ""
        }

        <a class="pn001-button pn001-button-light" href="#pn001-contact">
          Começar agora
        </a>
      </div>
    </div>
  </section>
`;

const renderSemanticSection = (
  project: SiteProject,
  section: SiteSection,
): string => {
  switch (section.kind) {
    case "authority":
      return renderAuthority(section);

    case "about":
      return renderAbout(section);

    case "benefits":
      return renderGenericCards(section, "Benefícios");

    case "features":
      return renderGenericCards(section, "Diferenciais");

    case "services":
      return renderGenericCards(section, "Serviços");

    case "products":
      return renderGenericCards(section, "Soluções");

    case "process":
      return renderGenericCards(section, "Como funciona");

    case "portfolio":
      return renderGenericCards(section, "Projetos");

    case "gallery":
      return renderGenericCards(section, "Galeria");

    case "testimonials":
      return renderTestimonials(section);

    case "pricing":
      return renderPricing(section);

    case "faq":
      return renderFaq(section);

    case "contact":
      return renderContact(section);

    case "final-cta":
      return renderFinalCta(project, section);

    case "hero":
      return "";

    default:
      return renderGenericCards(section, "Destaque");
  }
};

const templateStyles = `
  :root {
    --pn001-bg: #f5f7f6;
    --pn001-surface: #ffffff;
    --pn001-text: #101513;
    --pn001-muted: #66706c;
    --pn001-line: rgba(16, 21, 19, 0.10);
    --pn001-accent: #1a9b70;
    --pn001-accent-strong: #087a54;
    --pn001-dark: #0d1713;
    --pn001-radius: 28px;
    --pn001-shadow: 0 24px 80px rgba(15, 28, 22, 0.08);
  }

  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    background:
      radial-gradient(
        circle at 80% 0%,
        rgba(80, 220, 169, 0.10),
        transparent 30%
      ),
      var(--pn001-bg);
    color: var(--pn001-text);
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  .pn001-site {
    overflow: hidden;
  }

  .pn001-container {
    width: min(
      calc(100% - 40px),
      ${PAGENOVA_TEMPLATE_001.design.maxContentWidth}px
    );
    margin: 0 auto;
  }

  .pn001-header {
    position: relative;
    z-index: 20;
    padding: 22px 0;
  }

  .pn001-header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    min-height: 64px;
    padding: 10px 12px 10px 22px;
    border: 1px solid var(--pn001-line);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 14px 40px rgba(20, 32, 27, 0.05);
    backdrop-filter: blur(18px);
  }

  .pn001-brand {
    display: flex;
    align-items: center;
    gap: 11px;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .pn001-brand-mark {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--pn001-accent);
    box-shadow: 0 0 0 6px rgba(26, 155, 112, 0.10);
  }

  .pn001-nav {
    display: flex;
    align-items: center;
    gap: 26px;
    color: var(--pn001-muted);
    font-size: 14px;
    font-weight: 600;
  }

  .pn001-header-cta {
    padding: 13px 20px;
    border-radius: 999px;
    background: var(--pn001-dark);
    color: #fff;
    font-size: 14px;
    font-weight: 750;
  }

  .pn001-hero {
    padding: 72px 0 110px;
  }

  .pn001-hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.04fr) minmax(360px, .96fr);
    gap: 72px;
    align-items: center;
  }

  .pn001-pill,
  .pn001-eyebrow {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    color: var(--pn001-accent-strong);
    font-size: 12px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .pn001-pill {
    padding: 10px 14px;
    border: 1px solid rgba(26, 155, 112, .18);
    border-radius: 999px;
    background: rgba(80, 220, 169, .09);
  }

  .pn001-hero h1 {
    max-width: 780px;
    margin: 25px 0 24px;
    font-size: clamp(48px, 6vw, 82px);
    line-height: .98;
    letter-spacing: -.055em;
  }

  .pn001-hero-copy > p {
    max-width: 650px;
    margin: 0;
    color: var(--pn001-muted);
    font-size: clamp(18px, 2vw, 21px);
    line-height: 1.65;
  }

  .pn001-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 34px;
  }

  .pn001-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 54px;
    padding: 0 24px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 800;
    transition:
      transform .2s ease,
      box-shadow .2s ease;
  }

  .pn001-button:hover {
    transform: translateY(-2px);
  }

  .pn001-button-primary {
    background: var(--pn001-accent);
    color: #06271c;
    box-shadow: 0 14px 32px rgba(26, 155, 112, .18);
  }

  .pn001-button-secondary {
    border: 1px solid var(--pn001-line);
    background: rgba(255, 255, 255, .72);
  }

  .pn001-button-light {
    background: #fff;
    color: var(--pn001-dark);
  }

  .pn001-hero-proof {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 30px;
    color: var(--pn001-muted);
    font-size: 13px;
    font-weight: 650;
  }

  .pn001-proof-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--pn001-accent);
    box-shadow: 0 0 0 5px rgba(26, 155, 112, .10);
  }

  .pn001-hero-visual {
    position: relative;
  }

  .pn001-hero-image,
  .pn001-visual-placeholder {
    width: 100%;
    min-height: 590px;
    border-radius: 40px;
    box-shadow: var(--pn001-shadow);
  }

  .pn001-hero-image {
    display: block;
    object-fit: cover;
  }

  .pn001-visual-placeholder {
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(
        145deg,
        #0e1c17 0%,
        #173d30 55%,
        #49d5a2 160%
      );
  }

  .pn001-visual-placeholder::before {
    content: "";
    position: absolute;
    inset: 10%;
    border: 1px solid rgba(255, 255, 255, .10);
    border-radius: 32px;
  }

  .pn001-visual-orb {
    position: absolute;
    width: 380px;
    height: 380px;
    top: 90px;
    left: 50%;
    border-radius: 50%;
    transform: translateX(-50%);
    background:
      radial-gradient(
        circle at 35% 30%,
        #9affd7,
        #37c895 36%,
        #0f5f45 72%
      );
    box-shadow:
      0 50px 120px rgba(0, 0, 0, .30),
      inset 0 0 80px rgba(255, 255, 255, .12);
  }

  .pn001-floating-card {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 7px;
    min-width: 150px;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, .16);
    border-radius: 20px;
    background: rgba(255, 255, 255, .11);
    color: #fff;
    backdrop-filter: blur(18px);
  }

  .pn001-floating-card span {
    color: rgba(255, 255, 255, .56);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .12em;
  }

  .pn001-floating-card strong {
    font-size: 16px;
  }

  .pn001-floating-card-a {
    top: 56px;
    left: 34px;
  }

  .pn001-floating-card-b {
    right: 30px;
    bottom: 150px;
  }

  .pn001-floating-card-c {
    left: 44px;
    bottom: 42px;
  }

  .pn001-trust {
    padding: 0 0 46px;
  }

  .pn001-trust-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-top: 1px solid var(--pn001-line);
    border-bottom: 1px solid var(--pn001-line);
  }

  .pn001-trust-item {
    min-height: 130px;
    padding: 28px;
    border-right: 1px solid var(--pn001-line);
  }

  .pn001-trust-item:last-child {
    border-right: 0;
  }

  .pn001-trust-item strong,
  .pn001-trust-item span {
    display: block;
  }

  .pn001-trust-item strong {
    margin-bottom: 8px;
    font-size: 26px;
    letter-spacing: -.035em;
  }

  .pn001-trust-item span {
    color: var(--pn001-muted);
    font-size: 13px;
    line-height: 1.5;
  }

  .pn001-section {
    padding: 110px 0;
  }

  .pn001-section-head {
    max-width: 760px;
    margin-bottom: 48px;
  }

  .pn001-section-head h2,
  .pn001-about h2,
  .pn001-contact h2,
  .pn001-final h2 {
    margin: 14px 0 18px;
    font-size: clamp(38px, 5vw, 62px);
    line-height: 1.04;
    letter-spacing: -.045em;
  }

  .pn001-section-head p,
  .pn001-about-copy p,
  .pn001-contact-card p,
  .pn001-final-card p {
    color: var(--pn001-muted);
    font-size: 17px;
    line-height: 1.7;
  }

  .pn001-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .pn001-card {
    min-height: 290px;
    overflow: hidden;
    border: 1px solid var(--pn001-line);
    border-radius: var(--pn001-radius);
    background: rgba(255, 255, 255, .82);
    box-shadow: 0 12px 40px rgba(18, 31, 25, .035);
  }

  .pn001-card-wide {
    grid-column: span 2;
  }

  .pn001-card-image {
    display: block;
    width: 100%;
    height: 220px;
    object-fit: cover;
  }

  .pn001-card-index {
    display: flex;
    align-items: flex-end;
    height: 110px;
    padding: 24px;
    color: rgba(16, 21, 19, .18);
    font-size: 42px;
    font-weight: 800;
    letter-spacing: -.06em;
  }

  .pn001-card-content {
    padding: 26px;
  }

  .pn001-card-content h3 {
    margin: 0 0 12px;
    font-size: 21px;
    letter-spacing: -.025em;
  }

  .pn001-card-content p {
    margin: 0;
    color: var(--pn001-muted);
    line-height: 1.65;
  }

  .pn001-about {
    background: var(--pn001-dark);
    color: #fff;
  }

  .pn001-about-grid {
    display: grid;
    grid-template-columns: .9fr 1.1fr;
    gap: 72px;
    align-items: center;
  }

  .pn001-about-copy p {
    color: rgba(255, 255, 255, .65);
  }

  .pn001-about-image,
  .pn001-about-panel {
    width: 100%;
    min-height: 470px;
    border-radius: 34px;
  }

  .pn001-about-image {
    display: block;
    object-fit: cover;
  }

  .pn001-about-panel {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 42px;
    background:
      radial-gradient(
        circle at 70% 20%,
        rgba(80, 220, 169, .38),
        transparent 34%
      ),
      linear-gradient(
        145deg,
        #18392e,
        #101c18
      );
    border: 1px solid rgba(255, 255, 255, .10);
  }

  .pn001-about-panel span {
    margin-bottom: 18px;
    color: #50dca9;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .pn001-about-panel strong {
    max-width: 520px;
    font-size: clamp(28px, 4vw, 46px);
    line-height: 1.08;
    letter-spacing: -.04em;
  }

  .pn001-testimonials {
    background: #edf1ef;
  }

  .pn001-testimonial-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .pn001-quote {
    min-height: 260px;
    padding: 30px;
    border: 1px solid var(--pn001-line);
    border-radius: var(--pn001-radius);
    background: #fff;
  }

  .pn001-stars {
    margin-bottom: 24px;
    color: var(--pn001-accent-strong);
    letter-spacing: .08em;
  }

  .pn001-quote blockquote {
    margin: 0 0 28px;
    font-size: 18px;
    line-height: 1.65;
  }

  .pn001-quote strong {
    font-size: 14px;
  }

  .pn001-faq-layout {
    display: grid;
    grid-template-columns: .8fr 1.2fr;
    gap: 70px;
    align-items: start;
  }

  .pn001-section-head-sticky {
    position: sticky;
    top: 30px;
  }

  .pn001-faq-list {
    border-top: 1px solid var(--pn001-line);
  }

  .pn001-faq-item {
    border-bottom: 1px solid var(--pn001-line);
  }

  .pn001-faq-item summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
    padding: 24px 0;
    cursor: pointer;
    list-style: none;
    font-size: 17px;
    font-weight: 750;
  }

  .pn001-faq-item summary::-webkit-details-marker {
    display: none;
  }

  .pn001-faq-item p {
    margin: 0;
    padding: 0 50px 24px 0;
    color: var(--pn001-muted);
    line-height: 1.7;
  }

  .pn001-faq-plus {
    font-size: 24px;
    font-weight: 400;
  }

  .pn001-contact-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 50px;
    padding: 54px;
    border: 1px solid var(--pn001-line);
    border-radius: 36px;
    background: #fff;
    box-shadow: var(--pn001-shadow);
  }

  .pn001-contact-card > div {
    max-width: 700px;
  }

  .pn001-final {
    padding: 20px 0 90px;
  }

  .pn001-final-card {
    position: relative;
    overflow: hidden;
    padding: 78px;
    border-radius: 42px;
    background:
      radial-gradient(
        circle at 90% 10%,
        rgba(80, 220, 169, .38),
        transparent 30%
      ),
      var(--pn001-dark);
    color: #fff;
  }

  .pn001-final-card::after {
    content: "";
    position: absolute;
    width: 280px;
    height: 280px;
    right: -80px;
    bottom: -140px;
    border: 1px solid rgba(255, 255, 255, .10);
    border-radius: 50%;
  }

  .pn001-final-card p {
    max-width: 700px;
    color: rgba(255, 255, 255, .66);
  }

  .pn001-final-card .pn001-button {
    position: relative;
    z-index: 2;
    margin-top: 20px;
  }

  .pn001-footer {
    padding: 30px 0 48px;
  }

  .pn001-footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding-top: 28px;
    border-top: 1px solid var(--pn001-line);
    color: var(--pn001-muted);
    font-size: 13px;
  }

  @media (max-width: 900px) {
    .pn001-nav {
      display: none;
    }

    .pn001-hero {
      padding-top: 44px;
    }

    .pn001-hero-grid,
    .pn001-about-grid,
    .pn001-faq-layout {
      grid-template-columns: 1fr;
      gap: 42px;
    }

    .pn001-hero-image,
    .pn001-visual-placeholder {
      min-height: 480px;
    }

    .pn001-trust-row,
    .pn001-grid,
    .pn001-testimonial-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .pn001-trust-item:nth-child(2) {
      border-right: 0;
    }

    .pn001-section-head-sticky {
      position: static;
    }
  }

  @media (max-width: 640px) {
    .pn001-container {
      width: min(calc(100% - 28px), 1180px);
    }

    .pn001-header {
      padding-top: 14px;
    }

    .pn001-header-inner {
      min-height: 58px;
      padding-left: 17px;
    }

    .pn001-header-cta {
      padding: 11px 15px;
      font-size: 12px;
    }

    .pn001-hero {
      padding: 42px 0 72px;
    }

    .pn001-hero h1 {
      font-size: clamp(43px, 14vw, 62px);
    }

    .pn001-hero-copy > p {
      font-size: 17px;
    }

    .pn001-hero-actions {
      flex-direction: column;
    }

    .pn001-button {
      width: 100%;
    }

    .pn001-hero-image,
    .pn001-visual-placeholder {
      min-height: 410px;
      border-radius: 28px;
    }

    .pn001-visual-orb {
      width: 270px;
      height: 270px;
    }

    .pn001-floating-card {
      min-width: 120px;
      padding: 14px;
    }

    .pn001-floating-card-a {
      top: 26px;
      left: 18px;
    }

    .pn001-floating-card-b {
      right: 18px;
      bottom: 110px;
    }

    .pn001-floating-card-c {
      left: 18px;
      bottom: 24px;
    }

    .pn001-trust-row,
    .pn001-grid,
    .pn001-testimonial-grid {
      grid-template-columns: 1fr;
    }

    .pn001-trust-item {
      border-right: 0;
      border-bottom: 1px solid var(--pn001-line);
    }

    .pn001-trust-item:last-child {
      border-bottom: 0;
    }

    .pn001-section {
      padding: 78px 0;
    }

    .pn001-card-wide {
      grid-column: auto;
    }

    .pn001-about-panel,
    .pn001-about-image {
      min-height: 390px;
      border-radius: 28px;
    }

    .pn001-about-panel {
      padding: 28px;
    }

    .pn001-contact-card {
      align-items: flex-start;
      flex-direction: column;
      padding: 32px 26px;
      border-radius: 28px;
    }

    .pn001-final {
      padding-bottom: 60px;
    }

    .pn001-final-card {
      padding: 46px 26px;
      border-radius: 30px;
    }

    .pn001-footer-inner {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;

export function renderTemplate001Preview(
  project: SiteProject,
  pageKey: SitePageKey,
): string {
  if (!supportsTemplate001(project, pageKey)) {
    return "";
  }

  const page = project.pages[pageKey];

  if (!page) {
    return "";
  }

  const hero = sectionByKind(page, ["hero"]);

  const authority = sectionByKind(page, ["authority"]);

  const contentSections = page.sections.filter(
    (section) =>
      section.kind !== "hero" &&
      section !== authority,
  );

  const renderedContent = contentSections
    .map((section) =>
      renderSemanticSection(project, section),
    )
    .join("");

  const hasContact = sectionsByKind(
    page,
    ["contact"],
  ).length > 0;

  return `
    <style>${templateStyles}</style>

    <div
      class="pn001-site"
      data-pagenova-template="${PAGENOVA_TEMPLATE_001_ID}"
    >
      <header class="pn001-header">
        <div class="pn001-container pn001-header-inner">
          <a class="pn001-brand" href="#">
            <span class="pn001-brand-mark"></span>
            <span>${escapeHtml(project.name || "PageNova")}</span>
          </a>

          <nav class="pn001-nav">
            <a href="#pn001-main">Conheça</a>
            <a href="#pn001-main">Soluções</a>
            <a href="#pn001-contact">Contato</a>
          </nav>

          <a
            class="pn001-header-cta"
            href="${hasContact ? "#pn001-contact" : "#pn001-main"}"
          >
            Falar agora
          </a>
        </div>
      </header>

      ${renderHero(project, page, hero)}

      ${authority ? renderAuthority(authority) : ""}

      <main id="pn001-main">
        ${renderedContent}
      </main>

      <footer class="pn001-footer">
        <div class="pn001-container pn001-footer-inner">
          <div class="pn001-brand">
            <span class="pn001-brand-mark"></span>
            <span>${escapeHtml(project.name || "PageNova")}</span>
          </div>

          <span>
            © ${new Date().getFullYear()}
            ${escapeHtml(project.name || "")}.
            Todos os direitos reservados.
          </span>
        </div>
      </footer>
    </div>
  `;
}