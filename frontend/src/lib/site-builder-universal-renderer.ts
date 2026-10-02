import type {
  SitePage,
  SitePageKey,
  SiteProject,
} from "@/lib/site-builder";

import type {
  UniversalSectionKind,
  UniversalSectionPlan,
  UniversalSiteStrategy,
} from "@/lib/site-builder-universal";

/**
 * PageNova Universal Renderer
 *
 * U5.6E.4B:
 * - semantic structure only;
 * - no niche detection;
 * - no renderer dispatch yet;
 * - no Live Editor mutation;
 * - no legacy renderer mutation.
 *
 * The purpose of this module is to create a deterministic semantic
 * representation between SiteStrategy and the future HTML renderer.
 */

export type UniversalRenderableSection = {
  kind: UniversalSectionKind;
  priority: number;
  purpose: string;
  sourceIndex: number | null;
  title: string;
  body: string;
};

export type UniversalRenderModel = {
  pageKey: SitePageKey;
  strategy: UniversalSiteStrategy;
  page: SitePage;
  sections: UniversalRenderableSection[];
};

const SECTION_KIND_SET = new Set<UniversalSectionKind>([
  "hero",
  "services",
  "products",
  "benefits",
  "features",
  "about",
  "authority",
  "process",
  "portfolio",
  "gallery",
  "team",
  "testimonials",
  "pricing",
  "faq",
  "location",
  "contact",
  "final-cta",
]);

function normalizeText(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizePriority(
  value: unknown,
  fallback: number,
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  return fallback;
}

function isUniversalSectionKind(
  value: unknown,
): value is UniversalSectionKind {
  return (
    typeof value === "string" &&
    SECTION_KIND_SET.has(value as UniversalSectionKind)
  );
}

function normalizePlan(
  strategy: UniversalSiteStrategy,
): UniversalSectionPlan[] {
  return strategy.sections
    .map((section, index) => ({
      ...section,
      kind: isUniversalSectionKind(section.kind)
        ? section.kind
        : "features",
      priority: normalizePriority(
        section.priority,
        index + 1,
      ),
      purpose: normalizeText(section.purpose),
    }))
    .sort((a, b) => a.priority - b.priority);
}

function normalizePageSections(
  page: SitePage,
): SitePage["sections"] {
  return Array.isArray(page.sections)
    ? page.sections
        .map((section) => ({
          title: normalizeText(section.title),
          body: normalizeText(section.body),
          kind: isUniversalSectionKind(section.kind)
            ? section.kind
            : undefined,
        }))
        .filter(
          (section) =>
            section.title.length > 0 ||
            section.body.length > 0,
        )
    : [];
}

/**
 * Hero content is stored in the root SitePage fields, not in
 * page.sections. Therefore it must never consume one of the
 * generic page section entries.
 */
function renderHeroModel(
  plan: UniversalSectionPlan,
): UniversalRenderableSection {
  return {
    kind: "hero",
    priority: plan.priority,
    purpose: normalizeText(plan.purpose),
    sourceIndex: null,
    title: "",
    body: "",
  };
}

/**
 * Generic semantic sections currently consume SitePage.sections
 * sequentially.
 *
 * This is intentionally isolated here so the future content schema can
 * become semantic without requiring another renderer rewrite.
 */
function renderContentModel(
  plan: UniversalSectionPlan,
  pageSections: SitePage["sections"],
  sourceIndex: number,
  consumedIndexes: Set<number>,
): UniversalRenderableSection {
  /*
   * New universal projects persist semantic identity in page sections.
   *
   * Once semantic identity exists, a planned section may consume only
   * content with the same semantic kind. This prevents content intended
   * for features, process, benefits, etc. from falling into pricing,
   * testimonials, FAQ, contact, or another unrelated planned section.
   *
   * Positional fallback remains only for legacy projects whose stored
   * sections predate semantic kind persistence.
   */
  const hasSemanticContent = pageSections.some(
    (section) => isUniversalSectionKind(section.kind),
  );

  let resolvedIndex = -1;

  if (hasSemanticContent) {
    resolvedIndex = pageSections.findIndex(
      (section, index) =>
        !consumedIndexes.has(index) &&
        section.kind === plan.kind,
    );
  } else {
    resolvedIndex = sourceIndex;

    while (
      resolvedIndex < pageSections.length &&
      consumedIndexes.has(resolvedIndex)
    ) {
      resolvedIndex += 1;
    }
  }

  const source =
    resolvedIndex >= 0 &&
    resolvedIndex < pageSections.length
      ? pageSections[resolvedIndex]
      : undefined;

  if (source && resolvedIndex >= 0) {
    consumedIndexes.add(resolvedIndex);
  }

  return {
    kind: plan.kind,
    priority: plan.priority,
    purpose: normalizeText(plan.purpose),
    sourceIndex: source ? resolvedIndex : null,
    title: normalizeText(source?.title),
    body: normalizeText(source?.body),
  };
}
/**
 * Build the deterministic semantic representation used by the future
 * Universal Renderer.
 *
 * Important:
 * - strategy controls structure/order;
 * - page controls generated content;
 * - niche names never control rendering;
 * - hero does not consume page.sections;
 * - missing content remains explicit instead of inventing copy.
 */
export function createUniversalRenderModel(
  project: SiteProject,
  pageKey: SitePageKey,
): UniversalRenderModel | null {
  const strategy = project.siteStrategy;
  const page = project.pages?.[pageKey];

  if (!strategy || !page) {
    return null;
  }

  const plan = normalizePlan(strategy);
  const pageSections = normalizePageSections(page);

  let sourceIndex = 0;
  const consumedIndexes = new Set<number>();

  const sections = plan.map(
    (section): UniversalRenderableSection => {
      if (section.kind === "hero") {
        return renderHeroModel(section);
      }

      const rendered = renderContentModel(
        section,
        pageSections,
        sourceIndex,
        consumedIndexes,
      );

      if (rendered.sourceIndex !== null) {
        while (
          sourceIndex < pageSections.length &&
          consumedIndexes.has(sourceIndex)
        ) {
          sourceIndex += 1;
        }
      }

      return rendered;
    },
  );

  return {
    pageKey,
    strategy,
    page,
    sections,
  };
}

/**
 * Stable semantic DOM id.
 *
 * Existing #feature-N compatibility is intentionally NOT implemented
 * here. That compatibility belongs to the HTML rendering layer, where
 * both semantic IDs and legacy editor aliases can be emitted together.
 */
export function universalSectionId(
  section: UniversalRenderableSection,
  occurrence: number,
): string {
  const safeOccurrence =
    Number.isFinite(occurrence) && occurrence > 0
      ? Math.floor(occurrence)
      : 1;

  return `pn-section-${section.kind}-${safeOccurrence}`;
}

/**
 * Determines whether a project is eligible for the universal path.
 *
 * During migration renderSitePreview can use this as a feature boundary:
 * projects without a persisted strategy continue through the legacy
 * renderer unchanged.
 */
export function hasUniversalRenderStrategy(
  project: SiteProject,
): boolean {
  return Boolean(
    project.siteStrategy &&
      Array.isArray(project.siteStrategy.sections) &&
      project.siteStrategy.sections.length > 0,
  );
}
/* ============================================================
 * U5.6E.4C — UNIVERSAL SEMANTIC HTML LAYER
 * ============================================================
 *
 * This layer renders semantic section kinds without niche branches.
 *
 * It is intentionally NOT connected to renderSitePreview yet.
 * E.4D will own dispatcher integration and legacy fallback.
 */

function escapeUniversalHtml(value: unknown): string {
  return normalizeText(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function universalNav(project: SiteProject): string {
  const labels: Record<SitePageKey, string> = {
    home: "Início",
    sobre: "Sobre",
    servicos: "Serviços",
    contato: "Contato",
  };

  return (Object.keys(labels) as SitePageKey[])
    .filter((key) => Boolean(project.pages?.[key]))
    .map(
      (key) =>
        `<a href="#${key}" data-page="${key}">${escapeUniversalHtml(labels[key])}</a>`,
    )
    .join("");
}

function universalWhatsAppHref(
  value: string | undefined,
): string {
  const phone = normalizeText(value).replace(/\D/g, "");

  return phone
    ? `https://wa.me/${phone}`
    : "";
}

function universalInstagramHref(
  value: string | undefined,
): string {
  const raw = normalizeText(value);

  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const handle = raw
    .replace(/^@/, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/^www\.instagram\.com\//i, "")
    .replace(/\/+$/, "");

  return handle
    ? `https://www.instagram.com/${handle}`
    : "";
}

function universalFacebookHref(
  value: string | undefined,
): string {
  const raw = normalizeText(value);

  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const path = raw
    .replace(/^facebook\.com\//i, "")
    .replace(/^www\.facebook\.com\//i, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  return path
    ? `https://www.facebook.com/${path}`
    : "";
}

function universalEmailHref(
  value: string | undefined,
): string {
  const email = normalizeText(value);

  return email
    ? `mailto:${encodeURIComponent(email)}`
    : "";
}

function universalContactHref(project: SiteProject): string {
  const conversion = project.siteStrategy?.profile.conversion;

  const whatsappHref =
    universalWhatsAppHref(project.contactWhatsApp);

  const emailHref =
    universalEmailHref(project.contactEmail);

  /*
   * Respect the planned conversion when the project actually
   * contains the corresponding persisted contact data.
   *
   * The universal strategy currently supports conversion types
   * whose concrete destination is not yet persisted by SiteProject
   * (form, checkout, booking, phone and visit). We do not invent
   * destinations for those channels.
   */
  if (conversion === "whatsapp" && whatsappHref) {
    return whatsappHref;
  }

  if (conversion === "email" && emailHref) {
    return emailHref;
  }

  /*
   * Safe real-data fallback.
   *
   * A CTA must never receive a fabricated URL. If the requested
   * conversion has no concrete destination, use another persisted
   * direct contact channel when available, otherwise point to the
   * semantic contact section.
   */
  if (whatsappHref) {
    return whatsappHref;
  }

  if (emailHref) {
    return emailHref;
  }

  return "#contato";
}

function universalContactItems(
  project: SiteProject,
): Array<{
  label: string;
  value: string;
  href: string;
}> {
  const items: Array<{
    label: string;
    value: string;
    href: string;
  }> = [];

  const email = normalizeText(project.contactEmail);
  const whatsapp = normalizeText(project.contactWhatsApp);
  const instagram = normalizeText(project.contactInstagram);
  const facebook = normalizeText(project.contactFacebook);

  const emailHref = universalEmailHref(email);
  const whatsappHref = universalWhatsAppHref(whatsapp);
  const instagramHref = universalInstagramHref(instagram);
  const facebookHref = universalFacebookHref(facebook);

  if (whatsapp && whatsappHref) {
    items.push({
      label: "WhatsApp",
      value: whatsapp,
      href: whatsappHref,
    });
  }

  if (email && emailHref) {
    items.push({
      label: "E-mail",
      value: email,
      href: emailHref,
    });
  }

  if (instagram && instagramHref) {
    items.push({
      label: "Instagram",
      value: instagram,
      href: instagramHref,
    });
  }

  if (facebook && facebookHref) {
    items.push({
      label: "Facebook",
      value: facebook,
      href: facebookHref,
    });
  }

  return items;
}
function universalSectionLabel(
  kind: UniversalSectionKind,
): string {
  const labels: Record<UniversalSectionKind, string> = {
    hero: "Destaque",
    services: "Serviços",
    products: "Produtos",
    benefits: "Benefícios",
    features: "Recursos",
    about: "Sobre",
    authority: "Experiência",
    process: "Como funciona",
    portfolio: "Portfólio",
    gallery: "Galeria",
    team: "Equipe",
    testimonials: "Depoimentos",
    pricing: "Planos",
    faq: "Perguntas frequentes",
    location: "Localização",
    contact: "Contato",
    "final-cta": "Próximo passo",
  };

  return labels[kind];
}

function universalSectionClass(
  kind: UniversalSectionKind,
): string {
  switch (kind) {
    case "services":
    case "products":
    case "benefits":
    case "features":
    case "portfolio":
    case "gallery":
    case "team":
    case "testimonials":
    case "pricing":
      return "pn-universal-section pn-universal-grid-section";

    case "process":
      return "pn-universal-section pn-universal-process-section";

    case "faq":
      return "pn-universal-section pn-universal-faq-section";

    case "about":
    case "authority":
    case "location":
    case "contact":
      return "pn-universal-section pn-universal-editorial-section";

    case "final-cta":
      return "pn-universal-section pn-universal-final-cta";

    default:
      return "pn-universal-section";
  }
}

function renderUniversalHero(
  project: SiteProject,
  model: UniversalRenderModel,
): string {
  const page = model.page;
  const strategy = model.strategy;
  const href = universalContactHref(project);

  const heroStyle = strategy.design.heroStyle;
  const density = strategy.design.density;

  return `
    <section
      class="hero pn-universal-hero pn-hero-${heroStyle} pn-density-${density}"
      data-pn-section="true"
      data-pn-section-kind="hero"
      data-pn-source=".hero"
    >
      <div class="pn-universal-shell pn-universal-hero-inner">
        <div class="pn-universal-hero-copy">
          ${
            page.eyebrow
              ? `<div class="eyebrow">${escapeUniversalHtml(page.eyebrow)}</div>`
              : ""
          }

          <h1>${escapeUniversalHtml(page.heading)}</h1>

          ${
            page.introduction
              ? `<p class="hero-lead">${escapeUniversalHtml(page.introduction)}</p>`
              : ""
          }

          ${
            page.cta
              ? `<a class="btn" href="${escapeUniversalHtml(href)}">${escapeUniversalHtml(page.cta)}</a>`
              : ""
          }
        </div>

        <div class="pn-universal-hero-visual" aria-hidden="true">
          <span class="pn-universal-hero-orb"></span>
          <span class="pn-universal-hero-mark">${escapeUniversalHtml(project.name.slice(0, 1).toUpperCase())}</span>
        </div>
      </div>
    </section>
  `;
}

function universalSemanticVisual(
  kind: UniversalSectionKind,
): string {
  switch (kind) {
    case "benefits":
      return `
        <div class="pn-semantic-visual pn-benefits-visual" aria-hidden="true">
          <span class="pn-benefit-orb pn-benefit-orb-a"></span>
          <span class="pn-benefit-orb pn-benefit-orb-b"></span>
          <span class="pn-benefit-check">✓</span>
        </div>
      `;

    case "features":
      return `
        <div class="pn-semantic-visual pn-features-visual" aria-hidden="true">
          <span class="pn-feature-module pn-feature-module-a"></span>
          <span class="pn-feature-module pn-feature-module-b"></span>
          <span class="pn-feature-module pn-feature-module-c"></span>
        </div>
      `;

    case "services":
      return `
        <div class="pn-semantic-visual pn-services-visual" aria-hidden="true">
          <span class="pn-service-line"></span>
          <span class="pn-service-node pn-service-node-a"></span>
          <span class="pn-service-node pn-service-node-b"></span>
          <span class="pn-service-node pn-service-node-c"></span>
        </div>
      `;

    case "products":
      return `
        <div class="pn-semantic-visual pn-products-visual" aria-hidden="true">
          <span class="pn-product-panel pn-product-panel-back"></span>
          <span class="pn-product-panel pn-product-panel-front"></span>
        </div>
      `;

    case "process":
      return `
        <div class="pn-semantic-visual pn-process-visual" aria-hidden="true">
          <span class="pn-process-track"></span>
          <span class="pn-process-dot pn-process-dot-a">1</span>
          <span class="pn-process-dot pn-process-dot-b">2</span>
          <span class="pn-process-dot pn-process-dot-c">3</span>
        </div>
      `;

    case "about":
    case "authority":
      return `
        <div class="pn-semantic-visual pn-editorial-visual" aria-hidden="true">
          <span class="pn-editorial-block pn-editorial-block-a"></span>
          <span class="pn-editorial-block pn-editorial-block-b"></span>
        </div>
      `;

    case "portfolio":
    case "gallery":
      return `
        <div class="pn-semantic-visual pn-gallery-visual" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;

    case "team":
      return `
        <div class="pn-semantic-visual pn-team-visual" aria-hidden="true">
          <span class="pn-avatar pn-avatar-a"></span>
          <span class="pn-avatar pn-avatar-b"></span>
          <span class="pn-avatar pn-avatar-c"></span>
        </div>
      `;

    case "testimonials":
      return `
        <div class="pn-semantic-visual pn-testimonial-visual" aria-hidden="true">
          <span class="pn-quote-mark">“</span>
          <span class="pn-quote-line pn-quote-line-a"></span>
          <span class="pn-quote-line pn-quote-line-b"></span>
        </div>
      `;

    case "pricing":
      return `
        <div class="pn-semantic-visual pn-pricing-visual" aria-hidden="true">
          <span class="pn-price-line"></span>
          <span class="pn-price-line pn-price-line-short"></span>
          <span class="pn-price-button"></span>
        </div>
      `;

    case "faq":
      return `
        <div class="pn-semantic-visual pn-faq-visual" aria-hidden="true">
          <span>+</span>
          <span>+</span>
          <span>+</span>
        </div>
      `;

    case "location":
      return `
        <div class="pn-semantic-visual pn-location-visual" aria-hidden="true">
          <span class="pn-location-ring"></span>
          <span class="pn-location-pin"></span>
        </div>
      `;

    default:
      return "";
  }
}

function renderUniversalGenericSection(
  section: UniversalRenderableSection,
  occurrence: number,
  legacyFeatureIndex: number,
): string {
  const semanticId = universalSectionId(section, occurrence);

  const legacyId =
    legacyFeatureIndex > 0
      ? `feature-${legacyFeatureIndex}`
      : semanticId;

  const label = universalSectionLabel(section.kind);
  const className = universalSectionClass(section.kind);

  const title = section.title
    ? `<h2>${escapeUniversalHtml(section.title)}</h2>`
    : "";

  const body = section.body
    ? `<p>${escapeUniversalHtml(section.body)}</p>`
    : "";

  const visual = universalSemanticVisual(section.kind);

  const compositionClass =
    section.kind === "process"
      ? "pn-composition-process"
      : section.kind === "faq"
        ? "pn-composition-faq"
        : "pn-composition-semantic";

  return `
    <section
      id="${legacyId}"
      class="${className} ${compositionClass}"
      data-pn-section="true"
      data-pn-section-kind="${escapeUniversalHtml(section.kind)}"
      data-pn-semantic-id="${escapeUniversalHtml(semanticId)}"
      data-pn-source="#${legacyId}"
    >
      <div class="pn-universal-shell">
        <div class="pn-universal-section-heading">
          <span class="pn-universal-kicker">${escapeUniversalHtml(label)}</span>
          ${title}
        </div>

        <div class="pn-universal-section-content">
          <div class="pn-semantic-copy">
            ${body}
          </div>

          ${visual}
        </div>
      </div>
    </section>
  `;
}
function renderUniversalContactSection(
  project: SiteProject,
  section: UniversalRenderableSection,
  occurrence: number,
  legacyFeatureIndex: number,
): string {
  const items = universalContactItems(project);

  if (items.length === 0) {
    return "";
  }

  const semanticId = universalSectionId(
    section,
    occurrence,
  );

  const legacyId =
    legacyFeatureIndex > 0
      ? `feature-${legacyFeatureIndex}`
      : semanticId;

  const links = items
    .map(
      (item) => `
        <a
          class="pn-universal-contact-item"
          href="${escapeUniversalHtml(item.href)}"
          target="${
            item.href.startsWith("http")
              ? "_blank"
              : "_self"
          }"
          rel="${
            item.href.startsWith("http")
              ? "noopener noreferrer"
              : ""
          }"
        >
          <span class="pn-universal-contact-label">
            ${escapeUniversalHtml(item.label)}
          </span>
          <strong>
            ${escapeUniversalHtml(item.value)}
          </strong>
        </a>
      `,
    )
    .join("");

  return `
    <section
      id="${legacyId}"
      class="pn-universal-section pn-universal-contact"
      data-pn-section="true"
      data-pn-section-kind="contact"
      data-pn-semantic-id="${escapeUniversalHtml(semanticId)}"
      data-pn-source="#${legacyId}"
    >
      <div class="pn-universal-shell">
        <div class="pn-universal-section-copy">
          <span class="pn-universal-kicker">Contato</span>
          ${
            section.title
              ? `<h2>${escapeUniversalHtml(section.title)}</h2>`
              : `<h2>Fale conosco</h2>`
          }
          ${
            section.body
              ? `<p>${escapeUniversalHtml(section.body)}</p>`
              : ""
          }
        </div>

        <div class="pn-universal-contact-grid">
          ${links}
        </div>
      </div>
    </section>
  `;
}
function renderUniversalFinalCta(
  project: SiteProject,
  model: UniversalRenderModel,
  section: UniversalRenderableSection,
  occurrence: number,
  legacyFeatureIndex: number,
): string {
  const semanticId = universalSectionId(section, occurrence);
  const legacyId =
    legacyFeatureIndex > 0
      ? `feature-${legacyFeatureIndex}`
      : semanticId;

  const page = model.page;
  const href = universalContactHref(project);

  return `
    <section
      id="${legacyId}"
      class="pn-universal-section pn-universal-final-cta"
      data-pn-section="true"
      data-pn-section-kind="final-cta"
      data-pn-semantic-id="${escapeUniversalHtml(semanticId)}"
      data-pn-source="#${legacyId}"
    >
      <div class="pn-universal-shell pn-universal-final-cta-inner">
        <span class="pn-universal-kicker">Próximo passo</span>
        ${
          section.title
            ? `<h2>${escapeUniversalHtml(section.title)}</h2>`
            : `<h2>${escapeUniversalHtml(page.heading)}</h2>`
        }
        ${
          section.body
            ? `<p>${escapeUniversalHtml(section.body)}</p>`
            : ""
        }
        ${
          page.cta
            ? `<a class="btn" href="${escapeUniversalHtml(href)}">${escapeUniversalHtml(page.cta)}</a>`
            : ""
        }
      </div>
    </section>
  `;
}

function renderUniversalSemanticSections(
  project: SiteProject,
  model: UniversalRenderModel,
): string {
  const occurrences = new Map<UniversalSectionKind, number>();

  let legacyFeatureIndex = 0;

  return model.sections
    .filter((section) => section.kind !== "hero")
    .filter(
      (section) =>
        section.kind === "final-cta" ||
        section.title.length > 0 ||
        section.body.length > 0,
    )
    .map((section) => {
      const occurrence =
        (occurrences.get(section.kind) ?? 0) + 1;

      occurrences.set(section.kind, occurrence);

      /*
       * Preserve the current editor's #feature-N contract while
       * semantic IDs are carried separately in data-pn-semantic-id.
       *
       * This is migration compatibility, not the final semantic
       * selector architecture.
       */
      legacyFeatureIndex += 1;

      if (section.kind === "contact") {
        return renderUniversalContactSection(
          project,
          section,
          occurrence,
          legacyFeatureIndex,
        );
      }

      if (section.kind === "final-cta") {
        return renderUniversalFinalCta(
          project,
          model,
          section,
          occurrence,
          legacyFeatureIndex,
        );
      }

      return renderUniversalGenericSection(
        section,
        occurrence,
        legacyFeatureIndex,
      );
    })
    .join("");
}
function universalRendererStyles(
  strategy: UniversalSiteStrategy,
): string {
  const density = strategy.design.density;
  const cardStyle = strategy.design.cardStyle;

  const sectionPadding =
    density === "compact"
      ? "64px"
      : density === "editorial"
        ? "104px"
        : "84px";

  const cardShadow =
    cardStyle === "elevated"
      ? "0 22px 55px rgba(15,23,42,.12)"
      : "none";

  const cardBorder =
    cardStyle === "minimal"
      ? "transparent"
      : "rgba(15,23,42,.10)";

  const cardBackground =
    cardStyle === "soft"
      ? "rgba(15,23,42,.035)"
      : "#ffffff";

  return `
    :root{
      --pn-text:#111827;
      --pn-muted:#64748b;
      --pn-border:rgba(15,23,42,.10);
      --pn-surface:#ffffff;
      --pn-soft:#f8fafc;
      --pn-accent:#111827;
      --pn-section-space:${sectionPadding};
      --pn-card-shadow:${cardShadow};
      --pn-card-border:${cardBorder};
      --pn-card-background:${cardBackground};
    }

    *{box-sizing:border-box}

    html{scroll-behavior:smooth}

    body{
      margin:0;
      color:var(--pn-text);
      background:#fff;
      font-family:"Poppins",sans-serif;
      -webkit-font-smoothing:antialiased;
    }

    a{color:inherit;text-decoration:none}

    .pn-universal-shell{
      width:min(1180px,calc(100% - 48px));
      margin:0 auto;
    }

    .pn-site-header{
      position:relative;
      z-index:20;
      display:grid;
      grid-template-columns:1fr auto 1fr;
      align-items:center;
      min-height:76px;
      padding:14px max(24px,calc((100vw - 1180px)/2));
      border-bottom:1px solid var(--pn-border);
      background:rgba(255,255,255,.96);
    }

    .pn-site-header .brand{
      grid-column:1;
      justify-self:start;
      font-weight:800;
      letter-spacing:-.03em;
    }

    .pn-site-header nav{
      grid-column:3;
      justify-self:end;
      display:flex;
      align-items:center;
      gap:24px;
      font-size:14px;
      font-weight:600;
    }

    .pn-site-header nav a{
      opacity:.76;
      transition:opacity .2s ease;
    }

    .pn-site-header nav a:hover{opacity:1}

    .pn-universal-hero{
      position:relative;
      overflow:hidden;
      background:
        radial-gradient(circle at 82% 22%,rgba(15,23,42,.08),transparent 28%),
        linear-gradient(180deg,#fff,#f8fafc);
    }

    .pn-universal-hero-inner{
      min-height:620px;
      display:grid;
      grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);
      align-items:center;
      gap:64px;
      padding-top:84px;
      padding-bottom:84px;
    }

    .pn-density-compact .pn-universal-hero-inner{
      min-height:500px;
      padding-top:58px;
      padding-bottom:58px;
    }

    .pn-density-editorial .pn-universal-hero-inner{
      min-height:680px;
      padding-top:104px;
      padding-bottom:104px;
    }

    .pn-universal-hero-copy{max-width:760px}

    .eyebrow,
    .pn-universal-kicker{
      display:block;
      margin-bottom:16px;
      color:var(--pn-muted);
      font-size:12px;
      font-weight:800;
      letter-spacing:.14em;
      text-transform:uppercase;
    }

    .hero h1{
      max-width:850px;
      margin:0;
      font-size:clamp(42px,6vw,76px);
      line-height:1.02;
      letter-spacing:-.055em;
    }

    .hero .hero-lead{
      max-width:700px;
      margin:26px 0 0;
      color:var(--pn-muted);
      font-size:clamp(17px,2vw,20px);
      line-height:1.75;
    }

    .btn{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:50px;
      margin-top:30px;
      padding:14px 22px;
      border-radius:12px;
      background:var(--pn-accent);
      color:#fff;
      font-weight:700;
    }

    .pn-universal-hero-visual{
      position:relative;
      min-height:360px;
      border:1px solid var(--pn-border);
      border-radius:32px;
      overflow:hidden;
      background:
        linear-gradient(145deg,#f8fafc,#e2e8f0);
    }

    .pn-universal-hero-orb{
      position:absolute;
      width:320px;
      height:320px;
      border-radius:999px;
      right:-60px;
      top:-50px;
      background:rgba(15,23,42,.08);
      box-shadow:
        0 0 0 70px rgba(15,23,42,.035),
        0 0 0 140px rgba(15,23,42,.018);
    }

    .pn-universal-hero-mark{
      position:absolute;
      left:36px;
      bottom:18px;
      font-size:clamp(110px,15vw,210px);
      line-height:1;
      font-weight:800;
      letter-spacing:-.09em;
      opacity:.08;
    }

    .pn-hero-centered .pn-universal-hero-inner{
      display:block;
      min-height:auto;
      padding-top:110px;
      padding-bottom:110px;
      text-align:center;
    }

    .pn-hero-centered .pn-universal-hero-copy{
      margin:0 auto;
    }

    .pn-hero-centered .hero-lead{
      margin-left:auto;
      margin-right:auto;
    }

    .pn-hero-centered .pn-universal-hero-visual{
      display:none;
    }

    .pn-universal-section{
      padding:var(--pn-section-space) 0;
      border-top:1px solid var(--pn-border);
    }

    .pn-universal-section:nth-of-type(even){
      background:var(--pn-soft);
    }

    .pn-universal-section .pn-universal-shell{
      display:grid;
      grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);
      gap:70px;
      align-items:start;
    }

    .pn-universal-section-heading h2{
      margin:0;
      font-size:clamp(30px,4vw,48px);
      line-height:1.08;
      letter-spacing:-.045em;
    }

    .pn-universal-section-content{
      min-height:100px;
      padding:30px;
      border:1px solid var(--pn-card-border);
      border-radius:20px;
      background:var(--pn-card-background);
      box-shadow:var(--pn-card-shadow);
    }

    .pn-universal-section-content p{
      margin:0;
      color:var(--pn-muted);
      font-size:17px;
      line-height:1.8;
      white-space:pre-line;
    }

    .pn-universal-process-section
      .pn-universal-section-content{
      border-left:4px solid var(--pn-accent);
    }

    .pn-universal-faq-section
      .pn-universal-section-content{
      border-radius:12px;
    }

    .pn-universal-contact-grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:14px;
      margin-top:28px;
    }

    .pn-universal-contact-item{
      display:flex;
      flex-direction:column;
      gap:6px;
      padding:18px;
      border:1px solid var(--pn-border);
      border-radius:14px;
      background:#fff;
      color:inherit;
      text-decoration:none;
      overflow-wrap:anywhere;
    }

    .pn-universal-contact-label{
      font-size:12px;
      font-weight:700;
      letter-spacing:.08em;
      text-transform:uppercase;
      color:var(--pn-muted);
    }

    @media (max-width:720px){
      .pn-universal-contact-grid{
        grid-template-columns:1fr;
      }
    }
    .pn-universal-final-cta{
      background:#111827 !important;
      color:#fff;
      text-align:center;
    }

    .pn-universal-final-cta
      .pn-universal-final-cta-inner{
      display:block;
      max-width:850px;
    }

    .pn-universal-final-cta .pn-universal-kicker{
      color:#94a3b8;
    }

    .pn-universal-final-cta h2{
      margin:0;
      font-size:clamp(34px,5vw,58px);
      line-height:1.05;
      letter-spacing:-.05em;
    }

    .pn-universal-final-cta p{
      max-width:680px;
      margin:22px auto 0;
      color:#cbd5e1;
      line-height:1.75;
    }

    .pn-universal-final-cta .btn{
      background:#fff;
      color:#111827;
    }

    .pn-universal-footer{
      padding:34px 24px;
      border-top:1px solid var(--pn-border);
      text-align:center;
      color:var(--pn-muted);
      font-size:13px;
    }

    @media(max-width:820px){
      .pn-site-header{
        grid-template-columns:1fr;
        gap:14px;
      }

      .pn-site-header .brand,
      .pn-site-header nav{
        grid-column:1;
        justify-self:start;
      }

      .pn-site-header nav{
        flex-wrap:wrap;
        gap:14px 18px;
      }

      .pn-universal-hero-inner{
        min-height:auto;
        grid-template-columns:1fr;
        gap:36px;
        padding-top:64px;
        padding-bottom:64px;
      }

      .pn-universal-hero-visual{
        min-height:260px;
      }

      .pn-universal-section .pn-universal-shell{
        grid-template-columns:1fr;
        gap:28px;
      }
    }

    @media(max-width:560px){
      .pn-universal-shell{
        width:min(100% - 32px,1180px);
      }

      .pn-site-header{
        padding:16px;
      }

      .hero h1{
        font-size:clamp(38px,12vw,56px);
      }

      .pn-universal-hero-visual{
        min-height:210px;
      }

      .pn-universal-section-content{
        padding:22px;
      }
    }

    /* ==========================================================
       U5.6E.7 - UNIVERSAL SEMANTIC VISUAL COMPOSITIONS
       ========================================================== */

    .pn-composition-semantic .pn-universal-section-content,
    .pn-composition-process .pn-universal-section-content,
    .pn-composition-faq .pn-universal-section-content{
      position:relative;
      overflow:hidden;
      min-height:260px;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      gap:30px;
      padding:34px;
      border-radius:28px;
      background:
        linear-gradient(
          145deg,
          rgba(255,255,255,.98),
          rgba(248,250,252,.92)
        );
      box-shadow:0 22px 60px rgba(15,23,42,.07);
    }

    .pn-semantic-copy{
      position:relative;
      z-index:2;
      max-width:680px;
    }

    .pn-semantic-copy p{
      margin:0;
    }

    .pn-semantic-visual{
      position:relative;
      z-index:1;
      min-height:110px;
      border-radius:22px;
      overflow:hidden;
    }

    /* BENEFITS */

    .pn-benefits-visual{
      background:
        radial-gradient(
          circle at 18% 50%,
          rgba(15,23,42,.09),
          transparent 30%
        ),
        linear-gradient(
          135deg,
          rgba(15,23,42,.035),
          #fff
        );
    }

    .pn-benefit-orb{
      position:absolute;
      border-radius:999px;
      border:1px solid rgba(15,23,42,.16);
    }

    .pn-benefit-orb-a{
      width:110px;
      height:110px;
      left:24px;
      top:50%;
      transform:translateY(-50%);
    }

    .pn-benefit-orb-b{
      width:62px;
      height:62px;
      left:72px;
      top:50%;
      transform:translateY(-50%);
      background:rgba(15,23,42,.06);
    }

    .pn-benefit-check{
      position:absolute;
      right:34px;
      top:50%;
      transform:translateY(-50%);
      font-size:52px;
      line-height:1;
      font-weight:800;
      color:var(--pn-accent);
    }

    /* FEATURES */

    .pn-features-visual{
      display:grid;
      grid-template-columns:1.2fr .8fr;
      grid-template-rows:1fr 1fr;
      gap:10px;
      background:transparent;
    }

    .pn-feature-module{
      display:block;
      border-radius:18px;
      border:1px solid var(--pn-border);
      background:
        linear-gradient(
          145deg,
          rgba(15,23,42,.06),
          #fff
        );
    }

    .pn-feature-module-a{
      grid-row:1 / 3;
    }

    .pn-feature-module-b{
      opacity:.78;
    }

    .pn-feature-module-c{
      opacity:.52;
    }

    /* SERVICES */

    .pn-services-visual{
      background:
        linear-gradient(
          90deg,
          rgba(15,23,42,.04),
          #fff
        );
    }

    .pn-service-line{
      position:absolute;
      left:12%;
      right:12%;
      top:50%;
      height:2px;
      background:rgba(15,23,42,.16);
    }

    .pn-service-node{
      position:absolute;
      top:50%;
      width:28px;
      height:28px;
      transform:translate(-50%,-50%);
      border-radius:999px;
      background:#fff;
      border:7px solid var(--pn-accent);
      box-shadow:0 8px 22px rgba(15,23,42,.12);
    }

    .pn-service-node-a{
      left:18%;
    }

    .pn-service-node-b{
      left:50%;
    }

    .pn-service-node-c{
      left:82%;
    }

    /* PRODUCTS */

    .pn-products-visual{
      min-height:145px;
      background:
        linear-gradient(
          135deg,
          rgba(15,23,42,.035),
          #fff
        );
    }

    .pn-product-panel{
      position:absolute;
      width:54%;
      height:88px;
      border-radius:18px;
      border:1px solid var(--pn-border);
      background:#fff;
      box-shadow:0 18px 42px rgba(15,23,42,.08);
    }

    .pn-product-panel-back{
      right:10%;
      top:18px;
      opacity:.62;
      transform:rotate(4deg);
    }

    .pn-product-panel-front{
      left:10%;
      bottom:18px;
      border-top:5px solid var(--pn-accent);
    }

    /* PROCESS */

    .pn-composition-process .pn-universal-section-content{
      border-left:4px solid var(--pn-accent);
    }

    .pn-process-visual{
      min-height:92px;
      overflow:visible;
    }

    .pn-process-track{
      position:absolute;
      left:8%;
      right:8%;
      top:50%;
      height:2px;
      background:var(--pn-border);
    }

    .pn-process-dot{
      position:absolute;
      top:50%;
      width:42px;
      height:42px;
      display:grid;
      place-items:center;
      transform:translate(-50%,-50%);
      border-radius:999px;
      background:var(--pn-accent);
      color:#fff;
      font-size:13px;
      font-weight:800;
    }

    .pn-process-dot-a{
      left:8%;
    }

    .pn-process-dot-b{
      left:50%;
      opacity:.72;
    }

    .pn-process-dot-c{
      left:92%;
      opacity:.48;
    }

    /* ABOUT / AUTHORITY */

    .pn-editorial-visual{
      min-height:128px;
      background:
        linear-gradient(
          135deg,
          #111827,
          #334155
        );
    }

    .pn-editorial-block{
      position:absolute;
      border-radius:18px;
      background:#fff;
    }

    .pn-editorial-block-a{
      width:42%;
      height:58%;
      left:8%;
      top:18%;
      opacity:.92;
    }

    .pn-editorial-block-b{
      width:32%;
      height:34%;
      right:10%;
      bottom:16%;
      opacity:.35;
    }

    /* PORTFOLIO / GALLERY */

    .pn-gallery-visual{
      display:grid;
      grid-template-columns:1.3fr .8fr .8fr;
      gap:10px;
      min-height:145px;
      background:transparent;
    }

    .pn-gallery-visual span{
      display:block;
      border-radius:18px;
      background:
        linear-gradient(
          145deg,
          rgba(15,23,42,.10),
          rgba(15,23,42,.025)
        );
      border:1px solid var(--pn-border);
    }

    /* TEAM */

    .pn-team-visual{
      min-height:120px;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:18px;
      background:rgba(15,23,42,.035);
    }

    .pn-avatar{
      width:68px;
      height:68px;
      border-radius:999px;
      border:8px solid #fff;
      background:#cbd5e1;
      box-shadow:0 10px 28px rgba(15,23,42,.1);
    }

    .pn-avatar-b{
      width:84px;
      height:84px;
      background:#94a3b8;
    }

    /* TESTIMONIALS */

    .pn-testimonial-visual{
      padding:20px 26px;
      background:rgba(15,23,42,.035);
    }

    .pn-quote-mark{
      font-size:64px;
      line-height:.8;
      font-weight:900;
      color:var(--pn-accent);
    }

    .pn-quote-line{
      position:absolute;
      left:88px;
      height:10px;
      border-radius:999px;
      background:var(--pn-border);
    }

    .pn-quote-line-a{
      right:10%;
      top:38px;
    }

    .pn-quote-line-b{
      right:30%;
      top:64px;
    }

    /* PRICING */

    .pn-pricing-visual{
      min-height:130px;
      padding:26px;
      background:#111827;
    }

    .pn-price-line{
      display:block;
      width:58%;
      height:12px;
      margin-bottom:14px;
      border-radius:999px;
      background:rgba(255,255,255,.82);
    }

    .pn-price-line-short{
      width:34%;
      opacity:.45;
    }

    .pn-price-button{
      position:absolute;
      right:24px;
      bottom:24px;
      width:110px;
      height:36px;
      border-radius:999px;
      background:#fff;
    }

    /* FAQ */

    .pn-composition-faq .pn-universal-section-content{
      gap:14px;
    }

    .pn-faq-visual{
      min-height:auto;
      display:grid;
      gap:8px;
      background:transparent;
    }

    .pn-faq-visual span{
      height:46px;
      display:flex;
      align-items:center;
      justify-content:flex-end;
      padding:0 18px;
      border:1px solid var(--pn-border);
      border-radius:14px;
      background:#fff;
      color:var(--pn-text);
      font-size:24px;
    }

    /* LOCATION */

    .pn-location-visual{
      min-height:135px;
      background:
        linear-gradient(
          45deg,
          transparent 48%,
          var(--pn-border) 49%,
          var(--pn-border) 51%,
          transparent 52%
        ),
        linear-gradient(
          -45deg,
          transparent 48%,
          var(--pn-border) 49%,
          var(--pn-border) 51%,
          transparent 52%
        ),
        rgba(15,23,42,.025);
      background-size:42px 42px;
    }

    .pn-location-ring{
      position:absolute;
      width:72px;
      height:72px;
      left:50%;
      top:50%;
      transform:translate(-50%,-50%);
      border:2px solid var(--pn-accent);
      border-radius:999px;
    }

    .pn-location-pin{
      position:absolute;
      width:22px;
      height:22px;
      left:50%;
      top:50%;
      transform:translate(-50%,-50%);
      border-radius:999px;
      background:var(--pn-accent);
      box-shadow:0 0 0 10px rgba(15,23,42,.10);
    }

    /* MOBILE */

    @media(max-width:760px){
      .pn-composition-semantic .pn-universal-section-content,
      .pn-composition-process .pn-universal-section-content,
      .pn-composition-faq .pn-universal-section-content{
        min-height:auto;
        padding:24px;
        border-radius:22px;
      }

      .pn-semantic-visual{
        min-height:92px;
      }

      .pn-gallery-visual{
        grid-template-columns:1fr 1fr;
      }

      .pn-gallery-visual span:first-child{
        grid-column:1 / -1;
        min-height:92px;
      }
    }
`;
}

function universalRendererScript(): string {
  return `
    document.addEventListener('click',function(event){
      var target=event.target;
      if(!(target instanceof Element))return;

      var link=target.closest('[data-page]');
      if(!link)return;

      event.preventDefault();

      parent.postMessage({
        type:'pagenova-site-preview-page',
        key:link.getAttribute('data-page')
      },'*');
    });
  `;
}

/**
 * Standalone Universal Renderer HTML.
 *
 * IMPORTANT:
 * This function is deliberately not wired into renderSitePreview during
 * E.4C. It can be integrated only after build validation and dispatcher
 * fallback review.
 */
export function renderUniversalSitePreview(
  project: SiteProject,
  pageKey: SitePageKey,
): string {
  const model = createUniversalRenderModel(
    project,
    pageKey,
  );

  if (!model) {
    return "";
  }

  const nav = universalNav(project);
  const sections = renderUniversalSemanticSections(
    project,
    model,
  );

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeUniversalHtml(project.name)}</title>
  <style>${universalRendererStyles(model.strategy)}</style>
</head>
<body>
  <header class="pn-site-header">
    <a
      class="brand"
      href="#home"
      data-page="home"
      data-pn-source=".pn-site-header .brand"
    >${escapeUniversalHtml(project.name)}</a>

    <nav data-pn-source=".pn-site-header nav">
      ${nav}
    </nav>
  </header>

  <main>
    ${renderUniversalHero(project, model)}
    ${sections}
  </main>

  <footer class="pn-universal-footer">
    ${escapeUniversalHtml(project.name)}
  </footer>

  <script>${universalRendererScript()}</script>
</body>
</html>`;
}