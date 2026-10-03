import {
  completeHomeSectionsV5,
  pageNovaPaletteStyleV5,
  PAGENOVA_DESIGN_CORE_V5_STYLES,
  resolvePageNovaPaletteV5,
} from "@/lib/site-builder-design-core-v5";
import {
  PAGENOVA_DESIGN_CORE_V6_SCRIPT,
  PAGENOVA_DESIGN_CORE_V6_STYLES,
} from "@/lib/site-builder-design-core-v6";
import {
  getPageNovaDesignDirection,
  PAGENOVA_DESIGN_LIBRARY_V1_STYLES,
  PAGENOVA_DESIGN_LIBRARY_V2_STYLES,
  PAGENOVA_DESIGN_LIBRARY_V3_STYLES,
  PAGENOVA_DESIGN_LIBRARY_V4_STYLES,
} from "@/lib/site-builder-design-library-v1";
import { SITE_PAGES } from "./site-builder";
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

  const hasCardMedia =
    items.some((item) => Boolean(itemImage(item)));

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
              <article class="pn001-card pn-v2-card ${image ? "pn-v3-card-media" : "pn-v3-card-text"}">
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

        <div class="pn001-grid pn-v2-card-grid ${hasCardMedia ? "pn-v3-grid-has-media" : "pn-v3-grid-text-only"}">
          ${cards}
        </div>
      </div>
    </section>
  `;
};


/* PAGENOVA_V66_STRUCTURAL_RENDERERS_BEGIN
   ============================================================
   PAGENOVA V6.6

   services = editorial rows
   benefits = compact tiles
   features = editorial differential panel
   process  = timeline
   ============================================================ */

const renderV66SectionHead = (
  section: SiteSection,
  eyebrow: string,
): string => `
  <div class="pn001-v66-head">
    <span class="pn001-eyebrow">
      ${escapeHtml(eyebrow)}
    </span>

    <div class="pn001-v66-head-copy">
      <h2>
        ${escapeHtml(sectionTitle(section))}
      </h2>

      ${
        sectionSubtitle(section)
          ? `<p>${escapeHtml(sectionSubtitle(section))}</p>`
          : ""
      }
    </div>
  </div>
`;

const renderV66Services = (
  section: SiteSection,
): string => {
  const items = sectionItems(section);

  const content = items
    .slice(0, 6)
    .map((item, index) => {
      const title =
        itemTitle(item) ||
        `Serviço ${String(index + 1).padStart(2, "0")}`;

      const description =
        itemDescription(item) ||
        "Conheça esta solução e entenda como ela pode atender à sua necessidade.";

      return `
        <article class="pn001-v66-service-row">
          <span class="pn001-v66-service-number">
            ${String(index + 1).padStart(2, "0")}
          </span>

          <h3>
            ${escapeHtml(title)}
          </h3>

          <p>
            ${escapeHtml(description)}
          </p>

          <span
            class="pn001-v66-service-arrow"
            aria-hidden="true"
          >
            →
          </span>
        </article>
      `;
    })
    .join("");

  return `
    <section
      class="pn001-section pn001-v66-services"
      data-kind="services"
    >
      <div class="pn001-container">
        ${renderV66SectionHead(section, "Serviços")}

        <div class="pn001-v66-service-list">
          ${content}
        </div>
      </div>
    </section>
  `;
};

const renderV66Benefits = (
  section: SiteSection,
): string => {
  const items = sectionItems(section);

  const content = items
    .slice(0, 6)
    .map((item, index) => {
      const title =
        itemTitle(item) ||
        `Benefício ${String(index + 1).padStart(2, "0")}`;

      const description =
        itemDescription(item);

      return `
        <article class="pn001-v66-benefit">
          <div class="pn001-v66-benefit-top">
            <span
              class="pn001-v66-benefit-dot"
              aria-hidden="true"
            ></span>

            <span class="pn001-v66-benefit-number">
              ${String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <h3>
            ${escapeHtml(title)}
          </h3>

          ${
            description
              ? `<p>${escapeHtml(description)}</p>`
              : ""
          }
        </article>
      `;
    })
    .join("");

  return `
    <section
      class="pn001-section pn001-v66-benefits"
      data-kind="benefits"
    >
      <div class="pn001-container">
        ${renderV66SectionHead(section, "Benefícios")}

        <div class="pn001-v66-benefit-grid">
          ${content}
        </div>
      </div>
    </section>
  `;
};

const renderV66Features = (
  section: SiteSection,
): string => {
  const items = sectionItems(section);

  const content = items
    .slice(0, 6)
    .map((item, index) => {
      const title =
        itemTitle(item) ||
        `Diferencial ${String(index + 1).padStart(2, "0")}`;

      const description =
        itemDescription(item);

      return `
        <article class="pn001-v66-feature">
          <span class="pn001-v66-feature-index">
            ${String(index + 1).padStart(2, "0")}
          </span>

          <div class="pn001-v66-feature-copy">
            <h3>
              ${escapeHtml(title)}
            </h3>

            ${
              description
                ? `<p>${escapeHtml(description)}</p>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <section
      class="pn001-section pn001-v66-features"
      data-kind="features"
    >
      <div class="pn001-container">
        <div class="pn001-v66-feature-shell">
          ${renderV66SectionHead(section, "Diferenciais")}

          <div class="pn001-v66-feature-grid">
            ${content}
          </div>
        </div>
      </div>
    </section>
  `;
};

const renderV66Process = (
  section: SiteSection,
): string => {
  const items = sectionItems(section);

  const content = items
    .slice(0, 5)
    .map((item, index) => {
      const rawTitle =
        itemTitle(item) ||
        `Etapa ${String(index + 1).padStart(2, "0")}`;

      const title = rawTitle.replace(
        /^\s*\d{1,2}\s*[·.\-:]\s*/,
        "",
      );

      const description =
        itemDescription(item);

      return `
        <article class="pn001-v66-process-step">
          <div class="pn001-v66-process-track">
            <span class="pn001-v66-process-node">
              ${String(index + 1).padStart(2, "0")}
            </span>

            <span
              class="pn001-v66-process-line"
              aria-hidden="true"
            ></span>
          </div>

          <div class="pn001-v66-process-copy">
            <h3>
              ${escapeHtml(title)}
            </h3>

            ${
              description
                ? `<p>${escapeHtml(description)}</p>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <section
      class="pn001-section pn001-v66-process"
      data-kind="process"
    >
      <div class="pn001-container">
        ${renderV66SectionHead(section, "Como funciona")}

        <div class="pn001-v66-process-timeline">
          ${content}
        </div>
      </div>
    </section>
  `;
};

/* PAGENOVA_V66_STRUCTURAL_RENDERERS_END */
const resolveTemplate001BrandName = (
  project: SiteProject,
): string => {
  const raw = firstText(project.name).trim();

  if (!raw) return "Sua marca";

  const instructionLike =
    /^(?:crie|criar|faça|faca|quero|desenvolva|monte|gere)\b/i.test(raw) ||
    /\b(?:site premium|site moderno|site institucional|landing page)\b/i.test(raw);

  if (!instructionLike) {
    return raw.slice(0, 72);
  }

  const patterns = [
    /\b(?:chamad[ao]|nomead[ao]|denominad[ao])\s+["“”'`]?([^,.;:\n]{2,72})/i,
    /\b(?:nome|marca)\s*[:=-]\s*["“”'`]?([^,.;:\n]{2,72})/i,
    /\b(?:sob\s+o\s+nome|com\s+o\s+nome)\s+["“”'`]?([^,.;:\n]{2,72})/i,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);

    if (match?.[1]) {
      const candidate = match[1]
        .replace(/^["“”'`]+|["“”'`]+$/g, "")
        .replace(
          /\s+(?:especializad[ao]|focad[ao]|voltad[ao]|que\s+(?:atua|oferece|trabalha)|com\s+(?:foco|atendimento|serviços)|para\s+(?:atender|oferecer))\b.*$/i,
          "",
        )
        .replace(/[.,;:!?]+$/g, "")
        .trim();

      if (candidate) return candidate.slice(0, 72);
    }
  }

  return "Sua marca";
};
const renderHero = (
  project: SiteProject,
  page: SitePage,
  hero: SiteSection | undefined,
): string => {
  const title = firstText(
    page.heading,
    hero ? sectionTitle(hero) : "",
    project.name,
    "Soluções pensadas para o que você precisa.",
  );

  const description = firstText(
    page.introduction,
    hero ? sectionSubtitle(hero) : "",
    hero ? sectionBody(hero) : "",
    "Conheça as soluções, diferenciais e formas de atendimento.",
  );

  const image = firstText(
    hero ? sectionImage(hero) : "",
    project.institutional?.portrait,
    project.institutional?.businessPhoto,
    project.institutional?.workPhoto,
  );

  return `
    <section class="pn001-hero pn-v2-hero">
      <div class="pn001-container pn001-hero-grid pn-v2-hero-grid">
        <div class="pn001-hero-copy pn-v2-hero-copy">
          <span class="pn001-pill">
            ${escapeHtml(resolveTemplate001BrandName(project))}
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
            <span>Atendimento com clareza, confiança e atenção aos detalhes.</span>
          </div>
        </div>

        <div class="pn001-hero-visual pn-v2-hero-visual">
          ${
            image
              ? renderImage(
                  image,
                  title,
                  "pn001-hero-image",
                )
              : `
                <div class="pn001-visual-placeholder pn001-visual-placeholder-clean">
                  <div class="pn001-visual-glow"></div>
                  <div class="pn001-visual-monogram">
                    ${escapeHtml(
                      (project.name || "P")
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part.charAt(0))
                        .join("")
                        .toUpperCase(),
                    )}
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
  project: SiteProject,
  section: SiteSection,
): string => {
  const image = firstText(
    sectionImage(section),
    project.institutional?.businessPhoto,
    project.institutional?.workPhoto,
    project.institutional?.portrait,
  );

  return `
    <section class="pn001-section pn001-about pn-v2-about">
      <div class="pn001-container pn001-about-grid pn-v2-about-grid">
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
                <div class="pn001-about-panel pn001-about-panel-brand">
                  <span>Sobre</span>
                  <strong>${escapeHtml(project.name || "Nossa história")}</strong>
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

        <div class="pn001-testimonial-grid pn001-testimonial-slider pn001-v66-testimonial-track" tabindex="0">
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
  project: SiteProject,
  section: SiteSection,
): string => {
  const email = firstText(project.contactEmail);
  const whatsapp = firstText(project.contactWhatsApp);
  const instagram = firstText(project.contactInstagram);

  return `
    <section
      class="pn001-section pn001-contact"
      id="pn001-contact"
    >
      <div class="pn001-container">
        <div class="pn001-contact-shell">
          <div class="pn001-contact-copy">
            <span class="pn001-eyebrow">Entre em contato</span>

            <h2>${escapeHtml(
              firstText(
                sectionTitle(section),
                `Fale com ${project.name}`,
              ),
            )}</h2>

            <p>
              ${escapeHtml(
                firstText(
                  sectionBody(section),
                  "Preencha seus dados e conte brevemente como podemos ajudar.",
                ),
              )}
            </p>

            <div class="pn001-contact-channels">
              ${
                email
                  ? `<div><span>E-mail</span><strong>${escapeHtml(email)}</strong></div>`
                  : ""
              }

              ${
                whatsapp
                  ? `<div><span>WhatsApp</span><strong>${escapeHtml(whatsapp)}</strong></div>`
                  : ""
              }

              ${
                instagram
                  ? `<div><span>Instagram</span><strong>${escapeHtml(instagram)}</strong></div>`
                  : ""
              }
            </div>
          </div>

          <form class="pn001-form" id="pn001-contact-form">
            <div class="pn001-form-row">
              <label>
                <span>Nome</span>
                <input
                  name="name"
                  type="text"
                  autocomplete="name"
                  placeholder="Seu nome"
                  required
                />
              </label>

              <label>
                <span>Telefone</span>
                <input
                  name="phone"
                  type="tel"
                  autocomplete="tel"
                  placeholder="(00) 00000-0000"
                />
              </label>
            </div>

            <label>
              <span>E-mail</span>
              <input
                name="email"
                type="email"
                autocomplete="email"
                placeholder="voce@email.com"
                required
              />
            </label>

            <label>
              <span>Como podemos ajudar?</span>
              <textarea
                name="message"
                rows="5"
                placeholder="Escreva sua mensagem..."
                required
              ></textarea>
            </label>

            <button
              class="pn001-form-submit"
              type="submit"
            >
              Enviar mensagem
              <span>→</span>
            </button>

            <p class="pn001-form-status" aria-live="polite"></p>
          </form>
        </div>
      </div>
    </section>
  `;
};
const renderInstitutionalFaq = (
  project: SiteProject,
): string => {
  const brandName = resolveTemplate001BrandName(project);

  const designDirection =
    getPageNovaDesignDirection(project);

  const offer = firstText(
    project.institutional?.offer,
  );

  const audience = firstText(
    project.institutional?.audience,
  );

  const process = firstText(
    project.institutional?.process,
  );

  const proof = firstText(
    project.institutional?.proof,
  );

  const contactChannels = [
    project.contactWhatsApp ? "WhatsApp" : "",
    project.contactEmail ? "e-mail" : "",
    project.contactInstagram ? "Instagram" : "",
    project.contactFacebook ? "Facebook" : "",
  ].filter(Boolean);

  const contactAnswer =
    contactChannels.length > 0
      ? `Você pode falar com a ${brandName} por ${contactChannels.join(", ")}.`
      : "Utilize o formulário desta página para enviar sua mensagem e solicitar mais informações.";

  const faqItems = [
    {
      question: `O que a ${brandName} oferece?`,
      answer:
        offer ||
        "Conheça os principais serviços apresentados nesta página e entre em contato para entender qual opção corresponde melhor à sua necessidade.",
    },
    {
      question: "Para quem os serviços são indicados?",
      answer:
        audience ||
        "Os serviços podem atender diferentes necessidades. Explique o que você procura para que a equipe possa orientar o próximo passo.",
    },
    {
      question: "Como funciona o atendimento?",
      answer:
        process ||
        "O atendimento começa pelo entendimento da sua necessidade. Depois disso, a equipe pode orientar sobre as opções e os próximos passos disponíveis.",
    },
    {
      question: "Como escolher o serviço mais adequado?",
      answer:
        "Conheça as opções apresentadas no site e converse com a equipe para esclarecer suas dúvidas antes de decidir.",
    },
    {
      question: `Por que conhecer a ${brandName}?`,
      answer:
        proof ||
        `Nesta página você encontra informações sobre a proposta, os serviços e a forma de atendimento da ${brandName}.`,
    },
    {
      question: "Como solicitar mais informações?",
      answer: contactAnswer,
    },
  ];

  return `
    <section
      class="pn001-section pn001-faq pn001-faq-v6 pn-v2-faq"
    >
      <div class="pn001-container pn001-faq-layout">

        <div class="pn001-faq-intro">
          <span class="pn001-kicker">
            DÚVIDAS FREQUENTES
          </span>

          <h2>
            Antes de entrar em contato
          </h2>

          <p>
            Confira respostas rápidas sobre serviços,
            atendimento e próximos passos.
          </p>
        </div>

        <div class="pn001-faq-list">
          ${faqItems
            .map(
              (item, index) => `
                <details
                  class="pn001-faq-item"
                  ${index === 0 ? "open" : ""}
                >
                  <summary>
                    <span>
                      ${escapeHtml(item.question)}
                    </span>

                    <span class="pn001-faq-plus">
                      +
                    </span>
                  </summary>

                  <p>
                    ${escapeHtml(item.answer)}
                  </p>
                </details>
              `,
            )
            .join("")}
        </div>

      </div>
    </section>
  `;
};
const renderDemoTestimonials = (
  project: SiteProject,
): string => {
  const brandName =
    resolveTemplate001BrandName(project);

  const demos = [
    {
      name: "Mariana Alves",
      photo: "https://i.pravatar.cc/160?img=47",
      text: `Gostei muito da experiência com a ${brandName}. Fui atendida com atenção e senti bastante cuidado em cada etapa.`,
    },
    {
      name: "Lucas Ferreira",
      photo: "https://i.pravatar.cc/160?img=12",
      text: `A equipe da ${brandName} foi muito profissional. Tudo foi explicado de forma clara e o atendimento foi muito organizado.`,
    },
    {
      name: "Camila Rodrigues",
      photo: "https://i.pravatar.cc/160?img=32",
      text: `Minha experiência com a ${brandName} foi muito positiva. Gostei principalmente da atenção e da clareza durante o atendimento.`,
    },
    {
      name: "Rafael Martins",
      photo: "https://i.pravatar.cc/160?img=11",
      text: `O atendimento da ${brandName} me passou confiança. A equipe ouviu o que eu precisava antes de orientar o próximo passo.`,
    },
    {
      name: "Juliana Costa",
      photo: "https://i.pravatar.cc/160?img=44",
      text: `Fui muito bem atendida pela ${brandName}. A comunicação foi simples, próxima e profissional.`,
    },
    {
      name: "Bruno Carvalho",
      photo: "https://i.pravatar.cc/160?img=15",
      text: `Gostei bastante da experiência com a ${brandName}. O processo foi organizado e recebi atenção sempre que precisei.`,
    },
    {
      name: "Fernanda Lima",
      photo: "https://i.pravatar.cc/160?img=45",
      text: `Desde o primeiro contato, a equipe da ${brandName} foi muito atenciosa. A experiência foi tranquila e bem conduzida.`,
    },
    {
      name: "Gustavo Almeida",
      photo: "https://i.pravatar.cc/160?img=13",
      text: `A ${brandName} demonstrou profissionalismo e cuidado. Gostei da forma objetiva como minhas dúvidas foram esclarecidas.`,
    },
    {
      name: "Patrícia Mendes",
      photo: "https://i.pravatar.cc/160?img=49",
      text: `Tive uma ótima experiência com a ${brandName}. Senti atenção aos detalhes e bastante cuidado durante todo o atendimento.`,
    },
    {
      name: "André Ribeiro",
      photo: "https://i.pravatar.cc/160?img=14",
      text: `A ${brandName} me chamou atenção pela organização e pela comunicação. Tudo foi conduzido com bastante atenção.`,
    },
    {
      name: "Renata Oliveira",
      photo: "https://i.pravatar.cc/160?img=48",
      text: `Gostei muito do atendimento da ${brandName}. A equipe tornou todo o processo fácil de entender e me deixou à vontade.`,
    },
    {
      name: "Felipe Santos",
      photo: "https://i.pravatar.cc/160?img=16",
      text: `Minha experiência com a ${brandName} foi excelente. Atendimento cuidadoso, comunicação clara e muita organização.`,
    },
    {
      name: "Aline Barbosa",
      photo: "https://i.pravatar.cc/160?img=46",
      text: `A equipe da ${brandName} ouviu minhas dúvidas e explicou tudo com calma. Foi uma experiência muito boa do início ao fim.`,
    },
    {
      name: "Diego Moreira",
      photo: "https://i.pravatar.cc/160?img=17",
      text: `Encontrei na ${brandName} um atendimento próximo e profissional. Gostei muito da atenção recebida durante todo o processo.`,
    },
    {
      name: "Isabela Rocha",
      photo: "https://i.pravatar.cc/160?img=43",
      text: `Fiquei muito satisfeita com a experiência na ${brandName}. Tudo foi conduzido com cuidado, respeito e atenção.`,
    },
  ];

  const cards = demos
    .map(
      (testimonial) => `
        <article
          class="pn001-testimonial-card pn001-testimonial-card-v6"
        >
          <div class="pn001-testimonial-person">

            <img
              class="pn001-testimonial-photo"
              src="${escapeHtml(testimonial.photo)}"
              alt="Perfil demonstrativo"
              loading="lazy"
              referrerpolicy="no-referrer"
            />

            <div class="pn001-testimonial-identity">
              <strong>
                ${escapeHtml(testimonial.name)}
              </strong>

              <span>
                Perfil demonstrativo
              </span>
            </div>

            <span class="pn001-demo-badge">
              DEMO
            </span>

          </div>

          <div
            class="pn001-testimonial-stars"
            aria-label="Exemplo visual de avaliação"
          >
            ★★★★★
          </div>

          <p>
            “${escapeHtml(testimonial.text)}”
          </p>

        </article>
      `,
    )
    .join("");

  return `
    <section
      class="pn001-section pn001-testimonials pn001-testimonials-v6 pn-v2-testimonials"
    >
      <div class="pn001-container">

        <div class="pn001-testimonial-heading">

          <div>
            <span class="pn001-kicker">
              EXPERIÊNCIAS
            </span>

            <h2>
              Experiências com
              ${escapeHtml(brandName)}
            </h2>

            <p class="pn001-testimonial-lead">
              Veja como avaliações reais podem ser
              apresentadas nesta área do site.
            </p>
          </div>

          <div class="pn001-demo-disclosure">
            <strong>
              CONTEÚDO DEMONSTRATIVO
            </strong>

            <span>
              Os perfis, imagens e relatos desta seção
              são exemplos visuais. Substitua-os por
              avaliações reais antes da publicação.
            </span>
          </div>

        </div>

        <div
          class="pn001-testimonial-slider pn-v2-testimonial-layout"
          tabindex="0"
        >
          ${cards}
        </div>

      </div>
    </section>
  `;
};
const renderFinalCta = (
  project: SiteProject,
  section: SiteSection,
): string => {
  const brandName =
    resolveTemplate001BrandName(project);

  const title = firstText(
    sectionTitle(section),
    `Pronto para dar o próximo passo com a ${brandName}?`,
  );

  const body = firstText(
    sectionBody(section),
    "Entre em contato para conversar sobre sua necessidade e conhecer os próximos passos.",
  );

  const whatsappDigits = String(
    project.contactWhatsApp || "",
  ).replace(/\D/g, "");

  const href = whatsappDigits
    ? `https://wa.me/${whatsappDigits}`
    : project.contactEmail
      ? `mailto:${project.contactEmail}`
      : "#pn001-contact";

  return `
    <section
      class="pn001-section pn001-final-cta pn-v2-final-cta"
    >
      <div class="pn001-container">
        <div class="pn001-final-cta-card pn-v2-final-cta-card">

          <div class="pn001-final-cta-copy">
            <span class="pn001-kicker">
              PRÓXIMO PASSO
            </span>

            <h2>
              ${escapeHtml(title)}
            </h2>

            <p>
              ${escapeHtml(body)}
            </p>
          </div>

          <div class="pn001-final-cta-action">
            <a
              class="pn001-button pn001-button-primary"
              href="${escapeHtml(href)}"
            >
              Falar agora
            </a>
          </div>

        </div>
      </div>
    </section>
  `;
};
const renderSemanticSection = (
  project: SiteProject,
  section: SiteSection,
): string => {
  switch (section.kind) {
    case "authority":
      return renderAuthority(section);

    case "about":
      return renderAbout(project, section);

    case "benefits":
      return renderV66Benefits(section);

    case "features":
      return renderV66Features(section);

    case "services":
      return renderV66Services(section);

    case "products":
      return renderGenericCards(section, "Soluções");

    case "process":
      return renderV66Process(section);

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
      return renderContact(project, section);

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

  /* ============================================================
     PAGENOVA TEMPLATE 001 V2
     ============================================================ */

  .pn001-site {
    background:
      radial-gradient(circle at 82% 5%, rgba(49, 205, 151, .12), transparent 26%),
      linear-gradient(180deg, #f8faf9 0%, #f3f6f4 100%);
  }

  .pn001-header {
    padding-top: 18px;
  }

  .pn001-header-inner {
    min-height: 68px;
}

  .pn001-brand {
    max-width: 300px;
    font-size: 17px;
  }

  .pn001-hero {
    padding: 54px 0 78px;
  }

  .pn001-hero-grid {
    grid-template-columns: minmax(0, 1.02fr) minmax(380px, .98fr);
    gap: clamp(42px, 6vw, 86px);
  }

  .pn001-hero h1 {
    max-width: 760px;
    margin-top: 22px;
    font-size: clamp(48px, 5.6vw, 76px);
    line-height: .98;
    letter-spacing: -.058em;
    text-wrap: balance;
  }

  .pn001-hero-copy > p {
    max-width: 610px;
    font-size: clamp(17px, 1.7vw, 20px);
    line-height: 1.62;
  }

  .pn001-hero-image,
  .pn001-visual-placeholder {
    min-height: 520px;
    max-height: 650px;
    border-radius: 34px;
  }

  .pn001-hero-image {
    display: block;
    object-fit: cover;
    object-position: center;
  }

  .pn001-visual-placeholder-clean {
    position: relative;
    display: grid;
    place-items: center;
    overflow: hidden;
    background:
      radial-gradient(circle at 70% 25%, rgba(67, 225, 169, .85), transparent 23%),
      linear-gradient(145deg, #10261e 0%, #0a1712 100%);
  }

  .pn001-visual-glow {
    position: absolute;
    width: 70%;
    aspect-ratio: 1;
    border-radius: 999px;
    background: rgba(48, 205, 150, .48);
    filter: blur(55px);
  }

  .pn001-visual-monogram {
    position: relative;
    z-index: 2;
    display: grid;
    width: 170px;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 42px;
    background: rgba(255,255,255,.08);
    color: #fff;
    font-size: 54px;
    font-weight: 850;
    letter-spacing: -.07em;
    backdrop-filter: blur(18px);
    box-shadow: 0 28px 70px rgba(0,0,0,.22);
  }

  .pn001-section {
    padding: 78px 0;
  }

  .pn001-section + .pn001-section {
    padding-top: 56px;
  }

  .pn001-section-head {
    max-width: 760px;
    margin-bottom: 36px;
  }

  .pn001-section-head h2,
  .pn001-about h2,
  .pn001-contact h2,
  .pn001-final h2 {
    text-wrap: balance;
    letter-spacing: -.045em;
  }

  .pn001-section-head h2,
  .pn001-about h2 {
    font-size: clamp(38px, 4.4vw, 58px);
    line-height: 1.02;
  }

  .pn001-grid {
    gap: 18px;
  }

  .pn001-card {
    min-height: 260px;
    border: 1px solid rgba(16, 21, 19, .08);
    border-radius: 26px;
    background: rgba(255,255,255,.88);
    box-shadow: 0 18px 55px rgba(18, 31, 25, .055);
    transition:
      transform .25s ease,
      box-shadow .25s ease,
      border-color .25s ease;
  }

  .pn001-card:hover {
    transform: translateY(-5px);
    border-color: rgba(26, 155, 112, .22);
    box-shadow: 0 26px 70px rgba(18, 31, 25, .09);
  }

  .pn001-card-index {
    color: rgba(16, 21, 19, .16);
    font-size: 38px;
    font-weight: 850;
    letter-spacing: -.05em;
  }

  .pn001-card h3 {
    font-size: 21px;
    letter-spacing: -.025em;
  }

  .pn001-card p {
    line-height: 1.65;
  }

  .pn001-about-grid {
    gap: 56px;
  }

  .pn001-about-image,
  .pn001-about-panel {
    min-height: 440px;
    border-radius: 32px;
  }

  .pn001-about-image {
    width: 100%;
    object-fit: cover;
  }

  .pn001-about-panel-brand {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 40px;
    background:
      radial-gradient(circle at 75% 20%, rgba(52, 214, 156, .48), transparent 28%),
      #0d1713;
    color: #fff;
  }

  .pn001-about-panel-brand span {
    color: rgba(255,255,255,.55);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .pn001-about-panel-brand strong {
    max-width: 480px;
    margin-top: 12px;
    font-size: clamp(34px, 4vw, 54px);
    line-height: 1;
    letter-spacing: -.05em;
  }

  .pn001-final {
    padding: 60px 0;
  }

  .pn001-final-card {
    padding: clamp(42px, 6vw, 76px);
    border-radius: 34px;
  }

  .pn001-contact {
    padding-top: 54px;
    padding-bottom: 72px;
  }

  .pn001-contact-card {
    gap: 36px;
    padding: clamp(34px, 5vw, 58px);
    border-radius: 30px;
    box-shadow: 0 22px 70px rgba(17, 30, 24, .07);
  }

  .pn001-contact-card > div {
    max-width: 760px;
  }

  .pn001-contact-card h2 {
    margin-top: 12px;
    font-size: clamp(36px, 4vw, 54px);
    line-height: 1.02;
  }

  .pn001-button {
    min-height: 52px;
    padding-inline: 25px;
  }

  .pn001-button-primary {
    color: #fff;
    background: linear-gradient(135deg, #149a6d, #22b47f);
    box-shadow: 0 16px 36px rgba(20, 154, 109, .22);
  }

  @media (max-width: 900px) {
    .pn001-hero {
      padding: 34px 0 56px;
    }

    .pn001-hero-grid {
      grid-template-columns: 1fr;
      gap: 34px;
    }

    .pn001-hero h1 {
      font-size: clamp(44px, 10vw, 66px);
    }

    .pn001-hero-image,
    .pn001-visual-placeholder {
      min-height: 420px;
    }

    .pn001-section {
      padding: 58px 0;
    }

    .pn001-about-grid {
      gap: 32px;
    }
  }

  @media (max-width: 640px) {
    .pn001-container {
      width: min(calc(100% - 28px), 1180px);
    }

    .pn001-header {
      padding: 12px 0;
    }

    .pn001-header-inner {
      min-height: 58px;
      padding: 8px 10px 8px 15px;
}

    .pn001-nav {
      display: none;
    }

    .pn001-header-cta {
      padding: 11px 15px;
      font-size: 12px;
    }

    .pn001-brand {
      max-width: 55%;
      font-size: 14px;
    }

    .pn001-hero {
      padding: 30px 0 44px;
    }

    .pn001-hero h1 {
      margin: 18px 0;
      font-size: clamp(40px, 12vw, 56px);
      line-height: .98;
    }

    .pn001-hero-copy > p {
      font-size: 17px;
    }

    .pn001-hero-actions {
      margin-top: 26px;
    }

    .pn001-button {
      width: 100%;
    }

    .pn001-hero-image,
    .pn001-visual-placeholder {
      min-height: 360px;
      border-radius: 26px;
    }

    .pn001-section {
      padding: 48px 0;
    }

    .pn001-section + .pn001-section {
      padding-top: 38px;
    }

    .pn001-section-head {
      margin-bottom: 26px;
    }

    .pn001-section-head h2,
    .pn001-about h2 {
      font-size: 38px;
    }

    .pn001-grid {
      grid-template-columns: 1fr;
    }

    .pn001-card {
      min-height: 220px;
      border-radius: 22px;
    }

    .pn001-about-image,
    .pn001-about-panel {
      min-height: 340px;
      border-radius: 24px;
    }

    .pn001-final {
      padding: 38px 0;
    }

    .pn001-final-card,
    .pn001-contact-card {
      padding: 30px 24px;
      border-radius: 24px;
    }

    .pn001-contact {
      padding: 38px 0 50px;
    }
  }

  /* ============================================================
     TEMPLATE 001 V4 — PROFESSIONAL INSTITUTIONAL
     ============================================================ */

  .pn001-header {
    padding: 20px 0 8px;
  }

  .pn001-header-inner {
    min-height: 78px;
    padding: 10px 12px 10px 16px;
}

  .pn001-brand-logo {
    gap: 13px;
  }

  .pn001-brand-symbol {
    display: grid;
    width: 46px;
    height: 46px;
    place-items: center;
    border-radius: 14px;
    background:
      linear-gradient(145deg, var(--pn001-accent), var(--pn001-accent-strong));
    color: #fff;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: -.03em;
    box-shadow: 0 10px 24px rgba(26,155,112,.22);
  }

  .pn001-brand-name {
    max-width: 290px;
    overflow: hidden;
    color: var(--pn001-text);
    font-size: 17px;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pn001-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pn001-menu-button {
    display: flex;
    width: 52px;
    height: 52px;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 5px;
    border: 0;
    border-radius: 16px;
    background: var(--pn001-dark);
    cursor: pointer;
  }

  .pn001-menu-button span {
    width: 20px;
    height: 2px;
    border-radius: 10px;
    background: #fff;
    transition: transform .25s ease;
  }

  .pn001-menu-overlay {
    position: fixed;
    z-index: 90;
    inset: 0;
    visibility: hidden;
    background: rgba(4,14,10,.58);
    opacity: 0;
    backdrop-filter: blur(8px);
    transition: .3s ease;
  }

  .pn001-menu-panel {
    position: fixed;
    z-index: 100;
    top: 0;
    right: 0;
    width: min(460px, 92vw);
    height: 100vh;
    padding: 30px;
    overflow-y: auto;
    background: #fff;
    box-shadow: -30px 0 100px rgba(5,20,14,.18);
    transform: translateX(105%);
    transition: transform .35s cubic-bezier(.2,.8,.2,1);
  }

  .pn001-menu-open .pn001-menu-overlay {
    visibility: visible;
    opacity: 1;
  }

  .pn001-menu-open .pn001-menu-panel {
    transform: translateX(0);
  }

  .pn001-menu-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--pn001-line);
  }

  .pn001-menu-close {
    display: grid;
    width: 46px;
    height: 46px;
    place-items: center;
    border: 1px solid var(--pn001-line);
    border-radius: 50%;
    background: #fff;
    color: var(--pn001-text);
    font-size: 28px;
    cursor: pointer;
  }

  .pn001-menu-links {
    display: flex;
    flex-direction: column;
    padding: 30px 0;
  }

  .pn001-menu-links a {
    display: grid;
    grid-template-columns: 40px 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 21px 4px;
    border-bottom: 1px solid var(--pn001-line);
  }

  .pn001-menu-links a span {
    color: var(--pn001-accent-strong);
    font-size: 11px;
    font-weight: 850;
  }

  .pn001-menu-links a strong {
    font-size: clamp(24px, 4vw, 34px);
    letter-spacing: -.04em;
  }

  .pn001-menu-links a b {
    font-size: 20px;
    font-weight: 500;
  }

  .pn001-menu-bottom {
    margin-top: 20px;
    padding: 25px;
    border-radius: 22px;
    background: var(--pn001-dark);
    color: #fff;
  }

  .pn001-menu-bottom span {
    display: block;
    margin-bottom: 8px;
    color: rgba(255,255,255,.55);
    font-size: 12px;
  }

  .pn001-menu-contact {
    font-weight: 800;
  }

  .pn001-hero {
    padding-top: 70px;
  }

  .pn001-hero h1 {
    font-size: clamp(48px, 5.2vw, 72px);
    line-height: 1;
  }

  .pn001-hero-image {
    aspect-ratio: 4 / 5;
    min-height: 0;
    max-height: 620px;
  }

  .pn001-demo-testimonials {
    position: relative;
    background:
      radial-gradient(circle at 90% 0%, rgba(43,195,142,.11), transparent 30%),
      #eef3f0;
  }

  .pn001-contact-shell {
    display: grid;
    grid-template-columns: .82fr 1.18fr;
    gap: clamp(45px, 7vw, 90px);
    padding: clamp(38px, 6vw, 72px);
    border: 1px solid var(--pn001-line);
    border-radius: 36px;
    background: #fff;
    box-shadow: 0 25px 80px rgba(14,30,22,.07);
  }

  .pn001-contact-copy h2 {
    margin: 14px 0 20px;
    font-size: clamp(38px, 4.5vw, 58px);
    line-height: 1.02;
    letter-spacing: -.05em;
  }

  .pn001-contact-copy > p {
    color: var(--pn001-muted);
    font-size: 17px;
    line-height: 1.7;
  }

  .pn001-contact-channels {
    display: grid;
    gap: 12px;
    margin-top: 34px;
  }

  .pn001-contact-channels > div {
    padding: 16px 18px;
    border: 1px solid var(--pn001-line);
    border-radius: 16px;
    background: #f8faf9;
  }

  .pn001-contact-channels span,
  .pn001-contact-channels strong {
    display: block;
  }

  .pn001-contact-channels span {
    margin-bottom: 5px;
    color: var(--pn001-muted);
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .1em;
  }

  .pn001-contact-channels strong {
    font-size: 14px;
  }

  .pn001-form {
    display: grid;
    gap: 17px;
    padding: 30px;
    border-radius: 28px;
    background: #f4f7f5;
  }

  .pn001-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .pn001-form label {
    display: grid;
    gap: 8px;
  }

  .pn001-form label > span {
    font-size: 12px;
    font-weight: 800;
  }

  .pn001-form input,
  .pn001-form textarea {
    width: 100%;
    border: 1px solid rgba(16,21,19,.1);
    border-radius: 14px;
    outline: 0;
    background: #fff;
    color: var(--pn001-text);
    font: inherit;
  }

  .pn001-form input {
    height: 54px;
    padding: 0 16px;
  }

  .pn001-form textarea {
    min-height: 130px;
    padding: 16px;
    resize: vertical;
  }

  .pn001-form input:focus,
  .pn001-form textarea:focus {
    border-color: var(--pn001-accent);
    box-shadow: 0 0 0 4px rgba(26,155,112,.09);
  }

  .pn001-form-submit {
    display: flex;
    min-height: 56px;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border: 0;
    border-radius: 15px;
    background:
      linear-gradient(135deg, var(--pn001-accent-strong), var(--pn001-accent));
    color: #fff;
    font-weight: 850;
    cursor: pointer;
  }

  .pn001-form-submit span {
    font-size: 20px;
  }

  .pn001-form-status {
    min-height: 18px;
    margin: 0;
    color: var(--pn001-muted);
    font-size: 12px;
    line-height: 1.5;
  }

  .pn001-footer {
    padding: 48px 0;
    background: #eef2f0;
  }

  @media (max-width: 900px) {
    .pn001-header-cta {
      display: none;
    }

    .pn001-contact-shell {
      grid-template-columns: 1fr;
      gap: 35px;
    }
  }

  @media (max-width: 640px) {
    .pn001-header-inner {
      min-height: 66px;
}

    .pn001-brand-symbol {
      width: 40px;
      height: 40px;
      border-radius: 12px;
    }

    .pn001-brand-name {
      max-width: 180px;
      font-size: 14px;
    }

    .pn001-menu-button {
      width: 44px;
      height: 44px;
      border-radius: 13px;
    }

    .pn001-menu-panel {
      width: 100%;
      padding: 22px;
    }

    .pn001-hero {
      padding-top: 38px;
    }

    .pn001-hero h1 {
      font-size: clamp(39px, 12vw, 54px);
    }

    .pn001-contact-shell {
      padding: 26px 20px;
      border-radius: 26px;
    }

    .pn001-form {
      padding: 20px;
      border-radius: 20px;
    }

    .pn001-form-row {
      grid-template-columns: 1fr;
    }
  }

  /* ============================================================
     PAGENOVA TEMPLATE 001 V5
     HEADER + FOOTER + TESTIMONIALS
     ============================================================ */

  .pn001-header {
    padding: 18px 0 8px;
  }

  .pn001-header-inner {
    min-height: 76px;
    padding: 10px 12px 10px 16px;
}

  .pn001-brand-logo {
    display: inline-flex;
    min-width: 0;
    max-width: min(52vw, 460px);
    align-items: center;
    gap: 12px;
  }

  .pn001-brand-symbol {
    flex: 0 0 auto;
    width: 46px;
    height: 46px;
    border-radius: 14px;
    box-shadow: 0 10px 28px rgba(20, 154, 109, .22);
  }

  .pn001-brand-name {
    overflow: hidden;
    color: #0d1713;
    font-size: 17px;
    font-weight: 850;
    letter-spacing: -.025em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pn001-header-actions {
    gap: 10px;
  }

  .pn001-header-cta {
    min-height: 48px;
    padding: 0 22px;
    border-radius: 16px;
  }

  .pn001-menu-button {
    width: 50px;
    height: 50px;
    border-radius: 16px;
  }

  .pn001-demo-testimonials {
    overflow: hidden;
    background:
      radial-gradient(circle at 80% 0%, rgba(34, 180, 127, .12), transparent 30%),
      #edf4f0;
  }

  .pn001-testimonial-heading {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 430px);
    align-items: end;
    gap: 42px;
    margin-bottom: 38px;
  }

  .pn001-testimonial-heading h2 {
    max-width: 720px;
    margin: 10px 0 0;
    font-size: clamp(40px, 5vw, 66px);
    line-height: .98;
    letter-spacing: -.055em;
  }

  .pn001-demo-notice {
    margin: 0;
    padding: 15px 18px;
    border: 1px solid rgba(15, 90, 65, .12);
    border-radius: 16px;
    background: rgba(255,255,255,.58);
    color: #52625b;
    font-size: 12px;
    font-weight: 750;
    line-height: 1.55;
    letter-spacing: .04em;
  }

  .pn001-testimonial-slider {
    display: grid;
    grid-auto-columns: minmax(330px, 390px);
    grid-auto-flow: column;
    gap: 18px;
    overflow-x: auto;
    padding: 4px 2px 24px;
    scroll-snap-type: x mandatory;
    scrollbar-width: thin;
  }

  .pn001-quote-v5 {
    display: flex;
    min-height: 330px;
    flex-direction: column;
    scroll-snap-align: start;
    padding: 28px;
    border: 1px solid rgba(16, 35, 28, .08);
    border-radius: 26px;
    background: rgba(255,255,255,.92);
    box-shadow: 0 18px 50px rgba(20, 38, 31, .06);
  }

  .pn001-quote-top {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pn001-demo-avatar {
    display: grid;
    flex: 0 0 auto;
    width: 52px;
    height: 52px;
    place-items: center;
    border-radius: 50%;
    background:
      radial-gradient(circle at 30% 25%, rgba(255,255,255,.35), transparent 25%),
      linear-gradient(145deg, #1ba979, #0d6148);
    color: #fff;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: -.02em;
  }

  .pn001-review-person {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 3px;
  }

  .pn001-review-person strong {
    color: #0e1814;
    font-size: 15px;
  }

  .pn001-review-person span {
    color: #718078;
    font-size: 12px;
  }

  .pn001-demo-badge {
    padding: 6px 8px;
    border-radius: 999px;
    background: #e4f4ed;
    color: #08724e;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .1em;
  }

  .pn001-quote-v5 .pn001-stars {
    margin-top: 26px;
    letter-spacing: .12em;
  }

  .pn001-quote-v5 blockquote {
    flex: 1;
    margin: 18px 0 26px;
    color: #17221d;
    font-size: 18px;
    line-height: 1.62;
  }

  .pn001-review-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding-top: 18px;
    border-top: 1px solid rgba(15,35,28,.08);
    color: #66746d;
    font-size: 11px;
    font-weight: 700;
  }

  .pn001-testimonial-note {
    margin-top: 12px;
    color: #74817b;
    font-size: 11px;
  }

  .pn001-faq-item {
    background: rgba(255,255,255,.62);
  }

  .pn001-faq-item[open] {
    background: #fff;
    box-shadow: 0 14px 45px rgba(20, 38, 31, .05);
  }

  .pn001-footer-v5 {
    margin-top: 0;
    padding: 70px 0 30px;
    background: #0c1712;
    color: #fff;
  }

  .pn001-footer-main {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(180px, .65fr) minmax(220px, .8fr);
    gap: clamp(42px, 7vw, 90px);
    padding-bottom: 58px;
  }

  .pn001-footer-brand-column {
    max-width: 470px;
  }

  .pn001-footer-logo {
    display: inline-flex;
    align-items: center;
    gap: 13px;
    color: #fff;
    font-size: 20px;
    font-weight: 850;
    letter-spacing: -.035em;
    text-decoration: none;
  }

  .pn001-footer-brand-column p {
    max-width: 440px;
    margin: 24px 0 0;
    color: rgba(255,255,255,.57);
    font-size: 15px;
    line-height: 1.7;
  }

  .pn001-footer-column {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .pn001-footer-label {
    color: rgba(255,255,255,.38);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: .15em;
    text-transform: uppercase;
  }

  .pn001-footer-links {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 13px;
  }

  .pn001-footer-links a,
  .pn001-footer-links span {
    color: rgba(255,255,255,.78);
    font-size: 14px;
    line-height: 1.45;
    text-decoration: none;
  }

  .pn001-footer-links a {
    transition: color .2s ease, transform .2s ease;
  }

  .pn001-footer-links a:hover {
    color: #fff;
    transform: translateX(3px);
  }

  .pn001-footer-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding-top: 26px;
    border-top: 1px solid rgba(255,255,255,.1);
    color: rgba(255,255,255,.38);
    font-size: 11px;
  }

  @media (max-width: 900px) {
    .pn001-testimonial-heading {
      grid-template-columns: 1fr;
      align-items: start;
      gap: 20px;
    }

    .pn001-footer-main {
      grid-template-columns: 1fr 1fr;
    }

    .pn001-footer-brand-column {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 640px) {
    .pn001-header-inner {
      min-height: 64px;
      padding: 7px 8px 7px 10px;
}

    .pn001-brand-logo {
      max-width: calc(100% - 118px);
      gap: 9px;
    }

    .pn001-brand-symbol {
      width: 40px;
      height: 40px;
      border-radius: 12px;
    }

    .pn001-brand-name {
      font-size: 14px;
    }

    .pn001-header-cta {
      display: none;
    }

    .pn001-menu-button {
      width: 46px;
      height: 46px;
      border-radius: 14px;
    }

    .pn001-testimonial-heading h2 {
      font-size: 40px;
    }

    .pn001-testimonial-slider {
      grid-auto-columns: minmax(280px, 88vw);
    }

    .pn001-quote-v5 {
      min-height: 315px;
      padding: 23px;
      border-radius: 22px;
    }

    .pn001-footer-v5 {
      padding-top: 52px;
    }

    .pn001-footer-main {
      grid-template-columns: 1fr;
      gap: 38px;
      padding-bottom: 42px;
    }

    .pn001-footer-brand-column {
      grid-column: auto;
    }

    .pn001-footer-bottom {
      align-items: flex-start;
      flex-direction: column;
    }

    .pn001-footer-signature {
      display: none;
    }
  }

  /* ==========================================================
     PAGENOVA TEMPLATE 001 V6
     ========================================================== */

  .pn001-header {
    padding-top: 16px;
    padding-bottom: 6px;
    background: transparent;
  }

  .pn001-header-inner {
    min-height: 72px;
    padding: 9px 10px 9px 16px;
}

  .pn001-brand-logo {
    gap: 12px;
  }

  .pn001-brand-symbol {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    border-radius: 13px;
  }

  .pn001-brand-name {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.035em;
  }

  .pn001-header-actions {
    gap: 9px;
  }

  .pn001-header-cta {
    min-height: 44px;
    padding: 0 19px;
    border-radius: 13px;
  }

  .pn001-menu-button {
    width: 44px;
    height: 44px;
    border-radius: 13px;
  }

  .pn001-hero {
    padding-top: 64px;
  }

  .pn001-pill {
    max-width: max-content;
    white-space: normal;
  }

  .pn001-testimonials-v6 {
    overflow: hidden;
    padding-top: 100px;
    padding-bottom: 100px;
    background:
      radial-gradient(
        circle at 84% 10%,
        rgba(26, 155, 112, 0.13),
        transparent 32%
      ),
      #edf5f1;
  }

  .pn001-testimonial-heading {
    display: grid;
    grid-template-columns:
      minmax(0, 1.25fr)
      minmax(280px, 0.75fr);
    gap: 48px;
    align-items: end;
    margin-bottom: 42px;
  }

  .pn001-testimonial-heading h2 {
    max-width: 760px;
    margin: 10px 0 14px;
    font-size: clamp(40px, 5vw, 66px);
    line-height: 0.98;
    letter-spacing: -0.055em;
  }

  .pn001-testimonial-lead {
    max-width: 580px;
    margin: 0;
    color: var(--pn001-muted);
    font-size: 17px;
    line-height: 1.6;
  }

  .pn001-demo-disclosure {
    padding: 18px 20px;
    border: 1px solid rgba(16, 21, 19, 0.09);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.68);
  }

  .pn001-demo-disclosure strong,
  .pn001-demo-disclosure span {
    display: block;
  }

  .pn001-demo-disclosure strong {
    margin-bottom: 6px;
    font-size: 10px;
    letter-spacing: 0.09em;
  }

  .pn001-demo-disclosure span {
    color: var(--pn001-muted);
    font-size: 13px;
    line-height: 1.5;
  }

  .pn001-testimonial-slider {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(330px, 390px);
    gap: 18px;
    overflow-x: auto;
    padding: 2px 2px 22px;
    scroll-snap-type: x mandatory;
    scrollbar-width: thin;
  }

  .pn001-testimonial-card-v6 {
    min-height: 350px;
    padding: 27px;
    border: 1px solid rgba(16, 21, 19, 0.08);
    border-radius: 25px;
    background: rgba(255, 255, 255, 0.97);
    box-shadow: 0 20px 55px rgba(16, 21, 19, 0.055);
    scroll-snap-align: start;
  }

  .pn001-testimonial-person {
    display: grid;
    grid-template-columns:
      52px
      minmax(0, 1fr)
      auto;
    align-items: center;
    gap: 13px;
  }

  .pn001-testimonial-photo {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    object-fit: cover;
    background: #dce9e3;
  }

  .pn001-testimonial-identity strong,
  .pn001-testimonial-identity span {
    display: block;
  }

  .pn001-testimonial-identity strong {
    font-size: 15px;
  }

  .pn001-testimonial-identity span {
    margin-top: 3px;
    color: var(--pn001-muted);
    font-size: 12px;
  }

  .pn001-demo-badge {
    padding: 6px 8px;
    border-radius: 999px;
    background: rgba(26, 155, 112, 0.10);
    color: var(--pn001-accent-strong);
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .pn001-testimonial-stars {
    margin-top: 27px;
    color: var(--pn001-accent-strong);
    letter-spacing: 4px;
  }

  .pn001-testimonial-card-v6 > p {
    margin: 24px 0 0;
    font-size: 17px;
    line-height: 1.65;
  }

  .pn001-faq-v6 {
    padding-top: 108px;
    padding-bottom: 108px;
    background: #ffffff;
  }

  .pn001-faq-v6 .pn001-faq-layout {
    display: grid;
    grid-template-columns:
      minmax(260px, 0.72fr)
      minmax(0, 1.28fr);
    gap: clamp(50px, 8vw, 118px);
    align-items: start;
  }

  .pn001-faq-v6 .pn001-faq-intro {
    position: sticky;
    top: 28px;
  }

  .pn001-faq-v6 .pn001-faq-intro h2 {
    margin: 10px 0 18px;
    font-size: clamp(40px, 5vw, 62px);
    line-height: 0.98;
    letter-spacing: -0.055em;
  }

  .pn001-faq-v6 .pn001-faq-intro p {
    max-width: 350px;
    color: var(--pn001-muted);
    font-size: 17px;
    line-height: 1.6;
  }

  .pn001-faq-v6 .pn001-faq-item {
    border-bottom: 1px solid var(--pn001-line);
  }

  .pn001-faq-v6 .pn001-faq-item:first-child {
    border-top: 1px solid var(--pn001-line);
  }

  .pn001-faq-v6 summary {
    display: flex;
    justify-content: space-between;
    gap: 22px;
    padding: 25px 0;
    cursor: pointer;
    font-size: 17px;
    font-weight: 800;
    list-style: none;
  }

  .pn001-faq-v6 summary::-webkit-details-marker {
    display: none;
  }

  .pn001-faq-v6 .pn001-faq-item > p {
    max-width: 720px;
    margin: -2px 0 27px;
    color: var(--pn001-muted);
    font-size: 16px;
    line-height: 1.7;
  }

  .pn001-faq-plus {
    color: var(--pn001-accent-strong);
    font-size: 22px;
  }

  .pn001-footer-v5 {
    padding-top: 58px;
    padding-bottom: 22px;
  }

  .pn001-footer-v5 .pn001-footer-main {
    padding-bottom: 38px;
  }

  @media (max-width: 900px) {
    .pn001-testimonial-heading,
    .pn001-faq-v6 .pn001-faq-layout {
      grid-template-columns: 1fr;
      gap: 28px;
    }

    .pn001-faq-v6 .pn001-faq-intro {
      position: static;
    }

    .pn001-testimonial-slider {
      grid-auto-columns: minmax(290px, 84vw);
    }
  }

  @media (max-width: 640px) {
    .pn001-header {
      padding-top: 9px;
      padding-bottom: 4px;
    }

    .pn001-header-inner {
      min-height: 62px;
      padding: 7px 8px 7px 11px;
}

    .pn001-brand-symbol {
      width: 38px;
      height: 38px;
      flex-basis: 38px;
      border-radius: 11px;
    }

    .pn001-brand-name {
      max-width: 155px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 15px;
    }

    .pn001-header-cta {
      display: none;
    }

    .pn001-menu-button {
      width: 41px;
      height: 41px;
    }

    .pn001-hero {
      padding-top: 42px;
    }

    .pn001-testimonials-v6,
    .pn001-faq-v6 {
      padding-top: 74px;
      padding-bottom: 74px;
    }

    .pn001-testimonial-heading h2,
    .pn001-faq-v6 .pn001-faq-intro h2 {
      font-size: 39px;
    }

    .pn001-testimonial-slider {
      grid-auto-columns: 88vw;
    }

    .pn001-testimonial-card-v6 {
      min-height: 340px;
      padding: 22px;
    }
  }

  /* PAGENOVA_V64_CANONICAL_HEADER_BEGIN */

  /*
   * PAGENOVA V6.4
   * CANONICAL GLOBAL HEADER
   *
   * HEADER = estrutura global.
   * HEADER-INNER = apenas container.
   * HEADER-INNER nunca pode ser card.
   */

  .pn001-site[data-pagenova-design-version="6.5"]
  > header.pn001-header {
    position: relative !important;
    z-index: 100 !important;

    box-sizing: border-box !important;

    display: block !important;

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

    box-shadow: none !important;

    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;

    overflow: visible !important;
  }

  .pn001-site[data-pagenova-design-version="6.5"]
  > header.pn001-header
  > .pn001-header-inner {
    position: relative !important;

    box-sizing: border-box !important;

    display: flex !important;

    width: min(calc(100% - 48px), 1180px) !important;
    max-width: 1180px !important;

    min-height: 76px !important;

    margin: 0 auto !important;
    padding: 10px 0 !important;

    align-items: center !important;
    justify-content: space-between !important;

    gap: 24px !important;

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

  .pn001-site[data-pagenova-design-version="6.5"]
  > header.pn001-header
  > .pn001-header-inner::before,

  .pn001-site[data-pagenova-design-version="6.5"]
  > header.pn001-header
  > .pn001-header-inner::after {
    content: none !important;
    display: none !important;

    background: none !important;

    border: 0 !important;
    border-radius: 0 !important;

    box-shadow: none !important;
  }

  /* =========================
     BRAND
     ========================= */

  .pn001-site[data-pagenova-design-version="6.5"]
  > header.pn001-header
  .pn001-brand,

  .pn001-site[data-pagenova-design-version="6.5"]
  > header.pn001-header
  .pn001-brand-logo {
    display: inline-flex !important;

    align-items: center !important;

    width: auto !important;
    height: auto !important;

    margin: 0 !important;
    padding: 0 !important;

    background: transparent !important;

    color: #111111 !important;

    border: 0 !important;
    border-radius: 0 !important;

    box-shadow: none !important;

    text-decoration: none !important;
  }

  .pn001-site[data-pagenova-design-version="6.5"]
  > header.pn001-header
  .pn001-brand-name {
    display: block !important;

    margin: 0 !important;

    color: #111111 !important;

    font-size: clamp(17px, 1.65vw, 21px) !important;
    font-weight: 850 !important;
    line-height: 1 !important;

    letter-spacing: -0.035em !important;

    white-space: nowrap !important;
  }

  .pn001-site[data-pagenova-design-version="6.5"]
  > header.pn001-header
  .pn001-brand-symbol,

  .pn001-site[data-pagenova-design-version="6.5"]
  > header.pn001-header
  .pn001-brand-mark {
    display: none !important;
  }

  /* =========================
     ACTIONS
     ========================= */

  .pn001-site[data-pagenova-design-version="6.5"]
  > header.pn001-header
  .pn001-header-actions {
    display: flex !important;

    flex: 0 0 auto !important;

    align-items: center !important;
    justify-content: flex-end !important;

    gap: 10px !important;

    margin: 0 !important;
    padding: 0 !important;

    background: transparent !important;

    border: 0 !important;
    border-radius: 0 !important;

    box-shadow: none !important;
  }

  /* =========================
     CTA
     ========================= */

  .pn001-site[data-pagenova-design-version="6.5"]
  > header.pn001-header
  .pn001-header-cta {
    box-sizing: border-box !important;

    display: inline-flex !important;

    align-items: center !important;
    justify-content: center !important;

    flex: 0 0 auto !important;

    width: auto !important;
    min-width: 116px !important;

    height: 44px !important;
    min-height: 44px !important;

    margin: 0 !important;
    padding: 0 20px !important;

    background: var(--pn001-accent) !important;
    background-color: var(--pn001-accent) !important;
    background-image: none !important;

    color: var(--pn001-accent-contrast) !important;

    border: 1px solid var(--pn001-accent) !important;
    border-radius: 999px !important;

    box-shadow: none !important;

    font-size: 14px !important;
    font-weight: 800 !important;

    line-height: 1 !important;

    text-decoration: none !important;

    white-space: nowrap !important;
  }

  /* =========================
     MENU
     ========================= */

  .pn001-site[data-pagenova-design-version="6.5"]
  > header.pn001-header
  .pn001-menu-button {
    box-sizing: border-box !important;

    display: inline-flex !important;

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

    color: #111111 !important;

    border: 1px solid rgba(17,17,17,.16) !important;
    border-radius: 999px !important;

    box-shadow: none !important;
  }

  .pn001-site[data-pagenova-design-version="6.5"]
  > header.pn001-header
  .pn001-menu-button span {
    display: block !important;

    width: 18px !important;
    height: 2px !important;

    margin: 0 !important;
    padding: 0 !important;

    background: #111111 !important;

    border: 0 !important;
    border-radius: 999px !important;
  }

  /* =========================
     MOBILE
     ========================= */

  @media (max-width: 760px) {

    .pn001-site[data-pagenova-design-version="6.5"]
    > header.pn001-header
    > .pn001-header-inner {
      width: calc(100% - 28px) !important;

      min-height: 66px !important;

      padding: 8px 0 !important;

      gap: 12px !important;

      background: transparent !important;

      border: 0 !important;
      border-radius: 0 !important;

      box-shadow: none !important;
    }

    .pn001-site[data-pagenova-design-version="6.5"]
    > header.pn001-header
    .pn001-header-cta {
      display: none !important;
    }

    .pn001-site[data-pagenova-design-version="6.5"]
    > header.pn001-header
    .pn001-brand-name {
      font-size: 15px !important;
    }
  }

  /* PAGENOVA_V64_CANONICAL_HEADER_END */
`;


/* ==========================================================
   PAGENOVA V6.2 - COMPLETE HOME COMPOSER
   ========================================================== */

const completeHomeSectionsV62 = (
  project: SiteProject,
  page: SitePage,
): SitePage["sections"] => {
  const sections = completeHomeSectionsV5(project, page).map(
    (section) => ({
      ...section,
      items: Array.isArray(section.items)
        ? section.items.map((item) => ({ ...item }))
        : section.items,
    }),
  );

  const sectionKind = (
    section: SitePage["sections"][number],
  ): string => String(section.kind || "");

  const hasKind = (
    kinds: readonly string[],
  ): boolean =>
    sections.some((section) =>
      kinds.includes(sectionKind(section)),
    );

  const findKind = (
    kinds: readonly string[],
  ) =>
    sections.find((section) =>
      kinds.includes(sectionKind(section)),
    );

  const projectName =
    project.name?.trim() || "a empresa";

  /*
   * SERVICOS / SOLUCOES
   */

  if (!hasKind(["services", "products"])) {
    sections.push({
      kind: "services",
      title: "Soluções pensadas para cada necessidade",
      body:
        "Cada projeto parte do entendimento do contexto, das prioridades e do resultado que precisa ser alcançado.",
      items: [
        {
          title: "Entendimento",
          body:
            "O primeiro passo é compreender a necessidade, o cenário e os objetivos apresentados.",
        },
        {
          title: "Direção",
          body:
            "As prioridades são organizadas para construir um caminho claro para o projeto.",
        },
        {
          title: "Desenvolvimento",
          body:
            "A execução segue uma direção coerente com o objetivo definido.",
        },
      ],
    });
  }

  /*
   * BENEFICIOS
   */

  if (!hasKind(["benefits"])) {
    sections.push({
      kind: "benefits",
      title: "Uma experiência mais clara em cada etapa",
      body:
        "Organização, comunicação e entendimento ajudam a transformar uma necessidade inicial em decisões mais objetivas.",
      items: [
        {
          title: "Clareza",
          body:
            "Informações e prioridades organizadas para facilitar as decisões.",
        },
        {
          title: "Coerência",
          body:
            "Cada etapa permanece conectada ao objetivo principal do projeto.",
        },
        {
          title: "Proximidade",
          body:
            "O diálogo mantém contexto, expectativas e próximos passos alinhados.",
        },
      ],
    });
  }

  /*
   * SOBRE
   */

  if (!hasKind(["about"])) {
    sections.push({
      kind: "about",
      title: `Conheça ${projectName}`,
      body:
        page.introduction ||
        "Conheça a proposta, a abordagem e a forma de conduzir cada novo projeto.",
      items: [],
    });
  }

  /*
   * DIFERENCIAIS
   */

  if (!hasKind(["features"])) {
    sections.push({
      kind: "features",
      title: "O que orienta cada projeto",
      body:
        "Uma boa entrega começa pela combinação entre contexto, prioridades e uma direção bem definida.",
      items: [
        {
          title: "Contexto em primeiro lugar",
          body:
            "As decisões partem da necessidade apresentada e do cenário de cada projeto.",
        },
        {
          title: "Prioridades bem definidas",
          body:
            "O que é mais importante ganha clareza antes do avanço das etapas.",
        },
        {
          title: "Direção consistente",
          body:
            "As escolhas permanecem conectadas ao objetivo principal do trabalho.",
        },
      ],
    });
  }

  /*
   * PROCESSO
   *
   * Corrige diretamente o problema visual observado:
   * nunca mais apenas um card solto em Como funciona.
   */

  const processSection = findKind(["process"]);

  if (processSection) {
    const originalItems =
      Array.isArray(processSection.items)
        ? processSection.items
        : [];

    const defaults = [
      {
        title: "Apresente sua ideia",
        body:
          "Conte o contexto, a necessidade e o principal objetivo para iniciar a conversa.",
      },
      {
        title: "Alinhamos a direção",
        body:
          "As informações são organizadas para definir prioridades e próximos passos.",
      },
      {
        title: "Seguimos com o projeto",
        body:
          "Com a direção definida, o desenvolvimento pode avançar de forma organizada.",
      },
    ];

    processSection.items = [
      originalItems[0] || defaults[0],
      originalItems[1] || defaults[1],
      originalItems[2] || defaults[2],
      ...originalItems.slice(3, 5),
    ];

    if (!processSection.title?.trim()) {
      processSection.title = "Como funciona";
    }

    if (!processSection.body?.trim()) {
      processSection.body =
        "Um caminho simples para transformar a necessidade inicial em próximos passos claros.";
    }
  } else {
    sections.push({
      kind: "process",
      title: "Como funciona",
      body:
        "Um caminho simples para transformar a necessidade inicial em próximos passos claros.",
      items: [
        {
          title: "Apresente sua ideia",
          body:
            "Conte o contexto, a necessidade e o principal objetivo para iniciar a conversa.",
        },
        {
          title: "Alinhamos a direção",
          body:
            "As informações são organizadas para definir prioridades e próximos passos.",
        },
        {
          title: "Seguimos com o projeto",
          body:
            "Com a direção definida, o desenvolvimento pode avançar de forma organizada.",
        },
      ],
    });
  }

    /*
   * PAGENOVA V6.3.1 - SINGLE ABOUT CONTRACT
   *
   * A Home pode ter no maximo uma secao semantica "about".
   * Se a IA enviar mais de uma, preservamos somente a primeira.
   */
  let aboutSeen = false;

  const uniqueSections = sections.filter((section) => {
    if (sectionKind(section) !== "about") {
      return true;
    }

    if (aboutSeen) {
      return false;
    }

    aboutSeen = true;
    return true;
  });

  return uniqueSections;
};
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

  const effectivePage =
    pageKey === "home"
      ? {
          ...page,
          sections: completeHomeSectionsV62(project, page),
        }
      : page;

  const brandName = resolveTemplate001BrandName(project);
  const paletteV5 =
    resolvePageNovaPaletteV5(project);

  const paletteStyleV5 =
    pageNovaPaletteStyleV5(paletteV5);

  const designDirection =
    getPageNovaDesignDirection(project);

  const hero = sectionByKind(effectivePage, ["hero"]);

  const authority = sectionByKind(effectivePage, ["authority"]);

  const closingKinds = new Set([
    "testimonials",
    "faq",
    "contact",
    "final-cta",
  ]);

  const homeContentPriority = new Map<string, number>([
    ["services", 10],
    ["products", 10],
    ["benefits", 20],
    ["about", 30],
    ["features", 40],
    ["process", 50],
    ["team", 60],
    ["portfolio", 70],
    ["gallery", 70],
    ["authority", 80],
    ["pricing", 85],
    ["location", 90],
  ]);

  const contentSections = effectivePage.sections
    .filter(
      (section) =>
        section.kind !== "hero" &&
        (
          pageKey !== "home" ||
          !closingKinds.has(section.kind || "")
        ),
    )
    .sort((a, b) => {
      if (pageKey !== "home") return 0;

      const priorityA =
        homeContentPriority.get(a.kind || "") ?? 55;

      const priorityB =
        homeContentPriority.get(b.kind || "") ?? 55;

      return priorityA - priorityB;
    });

  const renderedContent = contentSections
    .map((section) =>
      renderSemanticSection(project, section),
    )
    .join("");

  const hasContact = sectionsByKind(
    effectivePage,
    ["contact"],
  ).length > 0;

  const hasFaq =
    sectionsByKind(effectivePage, ["faq"]).length > 0;

  const hasTestimonials =
    sectionsByKind(effectivePage, ["testimonials"]).length > 0;

  const testimonialSection = sectionByKind(
    effectivePage,
    ["testimonials"],
  );

  const faqSection = sectionByKind(
    effectivePage,
    ["faq"],
  );

  const contactSection = sectionByKind(
    effectivePage,
    ["contact"],
  );

  const finalCtaSection = sectionByKind(
    effectivePage,
    ["final-cta"],
  );

  const homeEnhancements =
    pageKey === "home"
      ? `
          ${
            testimonialSection
              ? renderSemanticSection(
                  project,
                  testimonialSection,
                )
              : renderDemoTestimonials(project)
          }

          ${
            faqSection
              ? renderSemanticSection(
                  project,
                  faqSection,
                )
              : renderInstitutionalFaq(project)
          }

          ${
            contactSection
              ? renderSemanticSection(
                  project,
                  contactSection,
                )
              : renderContact(
                  project,
                  {
                    kind: "contact",
                    title: `Vamos conversar sobre o que você precisa?`,
                    body:
                      "Conte brevemente sua necessidade para iniciar uma conversa com a equipe.",
                    items: [],
                  },
                )
          }

          ${
            finalCtaSection
              ? renderSemanticSection(
                  project,
                  finalCtaSection,
                )
              : renderFinalCta(
                  project,
                  {
                    kind: "final-cta",
                    title: `Pronto para dar o próximo passo com ${brandName}?`,
                    body:
                      "Entre em contato para conversar sobre sua necessidade e entender os próximos passos.",
                    items: [],
                  },
                )
          }
        `
      : "";
  return `
    <style>${templateStyles}${PAGENOVA_DESIGN_LIBRARY_V1_STYLES}${PAGENOVA_DESIGN_LIBRARY_V2_STYLES}${PAGENOVA_DESIGN_LIBRARY_V3_STYLES}${PAGENOVA_DESIGN_LIBRARY_V4_STYLES}${PAGENOVA_DESIGN_CORE_V5_STYLES}${PAGENOVA_DESIGN_CORE_V6_STYLES}</style>

    <div
      class="pn001-site ${designDirection.className}"
      data-pagenova-template="${PAGENOVA_TEMPLATE_001_ID}"
      data-pagenova-design="${designDirection.id}"
      data-pagenova-design-version="6.5"
      data-pagenova-palette="${paletteV5.id}"
      style="${paletteStyleV5}"
      data-pagenova-hero-layout="${designDirection.id === "editorial" ? "editorial-overlay" : designDirection.id === "studio" ? "split-studio" : "impact-split"}"
      data-pagenova-card-layout="${designDirection.id === "editorial" ? "numbered-list" : designDirection.id === "studio" ? "bento-grid" : "impact-grid"}"
    >
      <header class="pn001-header">
        <div class="pn001-container pn001-header-inner">
          <a class="pn001-brand pn001-brand-logo" href="#" data-page="home">
            <span class="pn001-brand-name">
              ${escapeHtml(brandName)}
            </span>
          </a>

          <div class="pn001-header-actions">
            <a
              class="pn001-header-cta"
              href="${hasContact ? "#pn001-contact" : "#pn001-main"}"
            >
              Falar agora
            </a>

            <button
              class="pn001-menu-button"
              type="button"
              aria-label="Abrir menu"
              aria-expanded="false"
              aria-controls="pn001-menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        <div class="pn001-menu-overlay"></div>

        <aside
          class="pn001-menu-panel"
          id="pn001-menu"
          aria-hidden="true"
        >
          <div class="pn001-menu-top">
            <div class="pn001-brand pn001-brand-logo">
              <span class="pn001-brand-name">
                ${escapeHtml(brandName)}
              </span>
            </div>

            <button
              class="pn001-menu-close"
              type="button"
              aria-label="Fechar menu"
            >
              ×
            </button>
          </div>

          <nav class="pn001-menu-links">
            ${SITE_PAGES
              .filter(({ key }) => Boolean(project.pages[key]))
              .map(
                ({ key, label }, index) => `
                  <a href="#" data-page="${key}">
                    <span>0${index + 1}</span>
                    <strong>${escapeHtml(label)}</strong>
                    <b>→</b>
                  </a>
                `,
              )
              .join("")}
          </nav>

          <div class="pn001-menu-bottom">
            <span>Vamos conversar?</span>
            <a href="#pn001-contact" class="pn001-menu-contact">
              Entrar em contato →
            </a>
          </div>
        </aside>
      </header>

      ${renderHero(project, effectivePage, hero)}

      ${pageKey !== "home" && authority ? renderAuthority(authority) : ""}

      <main id="pn001-main">
        ${renderedContent}
        ${homeEnhancements}
      </main>

      <footer class="pn001-footer pn001-footer-v5 pn-v2-footer">
        <div class="pn001-container">
          <div class="pn001-footer-main">
            <div class="pn001-footer-brand-column">
              <a class="pn001-footer-logo" href="#" data-page="home">
                <span>${escapeHtml(brandName)}</span>
              </a>

              <p>
                ${escapeHtml(
                  firstText(
                    project.institutional?.role,
                    project.pages.home?.introduction,
                    "Informações, serviços e canais de atendimento em um só lugar.",
                  ),
                )}
              </p>
            </div>

            <div class="pn001-footer-column">
              <span class="pn001-footer-label">Navegação</span>

              <nav class="pn001-footer-links">
                ${SITE_PAGES
                  .filter(({ key }) => Boolean(project.pages[key]))
                  .map(
                    ({ key, label }) => `
                      <a href="#" data-page="${key}">
                        ${escapeHtml(label)}
                      </a>
                    `,
                  )
                  .join("")}
              </nav>
            </div>

            <div class="pn001-footer-column">
              <span class="pn001-footer-label">Contato</span>

              <div class="pn001-footer-links">
                ${
                  project.contactWhatsApp
                    ? `<span>${escapeHtml(project.contactWhatsApp)}</span>`
                    : ""
                }

                ${
                  project.contactEmail
                    ? `<span>${escapeHtml(project.contactEmail)}</span>`
                    : ""
                }

                ${
                  project.contactInstagram
                    ? `<span>${escapeHtml(project.contactInstagram)}</span>`
                    : ""
                }

                ${
                  project.contactFacebook
                    ? `<span>${escapeHtml(project.contactFacebook)}</span>`
                    : ""
                }

                ${
                  !project.contactWhatsApp &&
                  !project.contactEmail &&
                  !project.contactInstagram &&
                  !project.contactFacebook
                    ? `<a href="#pn001-contact">Falar com a equipe →</a>`
                    : ""
                }
              </div>
            </div>
          </div>

          <div class="pn001-footer-bottom">
            <span>
              © ${new Date().getFullYear()} ${escapeHtml(brandName)}.
              Todos os direitos reservados.
            </span>

            <span class="pn001-footer-signature">
              Atendimento profissional · Informações claras
            </span>
          </div>
        </div>
      </footer>
    </div>

    <script>
      (() => {
        const root = document.querySelector(".pn001-site");
        if (!root) return;

        const openButton = root.querySelector(".pn001-menu-button");
        const closeButton = root.querySelector(".pn001-menu-close");
        const panel = root.querySelector(".pn001-menu-panel");
        const overlay = root.querySelector(".pn001-menu-overlay");

        const setMenu = (open) => {
          root.classList.toggle("pn001-menu-open", open);

          if (openButton) {
            openButton.setAttribute(
              "aria-expanded",
              open ? "true" : "false",
            );
          }

          if (panel) {
            panel.setAttribute(
              "aria-hidden",
              open ? "false" : "true",
            );
          }
        };

        openButton?.addEventListener(
          "click",
          () => setMenu(true),
        );

        closeButton?.addEventListener(
          "click",
          () => setMenu(false),
        );

        overlay?.addEventListener(
          "click",
          () => setMenu(false),
        );

        root.querySelectorAll(".pn001-menu-links [data-page]")
          .forEach((link) => {
            link.addEventListener("click", () => setMenu(false));
          });

        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape") setMenu(false);
        });

        const form = root.querySelector("#pn001-contact-form");

        form?.addEventListener("submit", (event) => {
          event.preventDefault();

          const status = form.querySelector(".pn001-form-status");

          if (status) {
            status.textContent =
              "Mensagem preenchida. Configure o canal de recebimento ao publicar o site.";
          }
        });
      })();
    </script>
    <script>${PAGENOVA_DESIGN_CORE_V6_SCRIPT}</script>
  `;
}