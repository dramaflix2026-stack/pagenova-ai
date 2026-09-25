import { assertPublicUrl } from "./public-url-security";
import * as cheerio from "cheerio";
import crypto from "node:crypto";
import dns from "node:dns/promises";
import net from "node:net";

import {
  fetchPageWithBrowser,
} from "./browser-cloner";

import type {
  CloneProject,
  CloneSection,
  CloneSectionType,
} from "../types/cloner";

const MAX_HTML_BYTES = 5 * 1024 * 1024;

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("javascript:")
  ) {
    return trimmed;
  }

  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return "";
  }
}

function absolutizeSrcset(
  value: string,
  baseUrl: string
): string {
  if (!value) {
    return "";
  }

  return value
    .split(",")
    .map((candidate) => {
      const trimmed = candidate.trim();

      if (!trimmed) {
        return "";
      }

      const pieces = trimmed.split(/\s+/);
      const source = pieces.shift() || "";
      const descriptor = pieces.join(" ");

      const absolute = absoluteUrl(source, baseUrl);

      if (!absolute) {
        return "";
      }

      return descriptor
        ? `${absolute} ${descriptor}`
        : absolute;
    })
    .filter(Boolean)
    .join(", ");
}

function absolutizeCssUrls(
  css: string,
  baseUrl: string
): string {
  return css.replace(
    /url\(\s*(['"]?)(.*?)\1\s*\)/gi,
    (_match, _quote, rawValue: string) => {
      const value = rawValue.trim();

      if (
        !value ||
        value.startsWith("data:") ||
        value.startsWith("blob:") ||
        value.startsWith("#")
      ) {
        return `url("${value}")`;
      }

      const absolute = absoluteUrl(value, baseUrl);

      return absolute
        ? `url("${absolute}")`
        : `url("${value}")`;
    }
  );
}

function inferSectionType(
  tag: string,
  id: string,
  className: string,
  heading: string
): CloneSectionType {
  const haystack =
    `${tag} ${id} ${className} ${heading}`.toLowerCase();

  if (
    tag === "header" ||
    /navbar|nav-bar|site-header|menu/.test(haystack)
  ) {
    return "header";
  }

  if (
    /hero|banner|headline|masthead/.test(haystack)
  ) {
    return "hero";
  }

  if (
    /feature|benefit|vantag|beneficio/.test(haystack)
  ) {
    return "features";
  }

  if (
    /testimonial|depoiment|review|avaliac/.test(
      haystack
    )
  ) {
    return "testimonials";
  }

  if (
    /pricing|price|preco|preço|oferta|offer/.test(
      haystack
    )
  ) {
    return "pricing";
  }

  if (
    /faq|pergunt|duvida|dúvida/.test(haystack)
  ) {
    return "faq";
  }

  if (
    tag === "footer" ||
    /footer|rodape|rodapé/.test(haystack)
  ) {
    return "footer";
  }

  if (
    tag === "section" ||
    tag === "main" ||
    tag === "article"
  ) {
    return "content";
  }

  return "unknown";
}

function extractSections(
  $: cheerio.CheerioAPI,
  baseUrl: string
): CloneSection[] {
  const sections: CloneSection[] = [];

  const selectors = [
    "header",
    "main > section",
    "body > section",
    "main > article",
    "body > main",
    "body > div",
    "footer",
  ].join(",");

  $(selectors)
    .slice(0, 60)
    .each((index, element) => {
      const node = $(element);

      const tag =
        "tagName" in element &&
        typeof element.tagName === "string"
          ? element.tagName.toLowerCase()
          : "section";

      const heading = cleanText(
        node.find("h1,h2,h3").first().text()
      );

      const text = cleanText(
        node.text()
      ).slice(0, 4000);

      if (
        !text &&
        !node.find("img").length
      ) {
        return;
      }

      const links = node
        .find("a[href]")
        .slice(0, 30)
        .map((_i, anchor) => {
          const href = absoluteUrl(
            $(anchor).attr("href") || "",
            baseUrl
          );

          return {
            text: cleanText(
              $(anchor).text()
            ).slice(0, 300),
            href,
          };
        })
        .get()
        .filter((item) => item.href);

      const images = node
        .find("img")
        .slice(0, 30)
        .map((_i, image) => {
          const srcValue =
            $(image).attr("src") ||
            $(image).attr("data-src") ||
            $(image).attr("data-lazy-src") ||
            "";

          return {
            src: absoluteUrl(
              srcValue,
              baseUrl
            ),
            alt: cleanText(
              $(image).attr("alt") || ""
            ),
          };
        })
        .get()
        .filter((item) => item.src);

      sections.push({
        id: `section-${index + 1}`,
        type: inferSectionType(
          tag,
          node.attr("id") || "",
          node.attr("class") || "",
          heading
        ),
        tag,
        heading: heading || null,
        text,
        links,
        images,
      });
    });

  return sections;
}

function buildVisualDocument(
  originalHtml: string,
  baseUrl: string
): {
  html: string;
  headHtml: string;
  bodyHtml: string;
} {
  const $ = cheerio.load(originalHtml);
  // V3D2_PRELOAD_STYLE_PROMOTION
  //
  // WordPress/LiteSpeed can deliver the primary stylesheet as:
  //
  //   rel="preload" as="style"
  //
  // and rely on JavaScript to activate it later.
  //
  // The safe clone intentionally removes source-page JavaScript.
  // Therefore style preloads must be promoted to real stylesheets
  // before active content is removed.
  $("link").each((_index, element) => {
    if (!("attribs" in element)) {
      return;
    }

    const link = $(element);

    const rel = String(
      link.attr("rel") || ""
    )
      .toLowerCase()
      .trim();

    const as = String(
      link.attr("as") || ""
    )
      .toLowerCase()
      .trim();

    const href = String(
      link.attr("href") || ""
    ).trim();

    if (!href) {
      return;
    }

    const relTokens = rel
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);

    const isPreloadedStyle =
      relTokens.includes("preload") &&
      as === "style";

    if (!isPreloadedStyle) {
      return;
    }

    link.attr(
      "rel",
      "stylesheet"
    );

    link.removeAttr("as");
    link.removeAttr("onload");

    link.attr(
      "data-lp-cloner-promoted",
      "preload-style"
    );
  });


  // ----------------------------------------------------------
  // Remove execution / tracking / embedded application content.
  // ----------------------------------------------------------

  $(
    [
      "script",
      "noscript",
      "iframe",
      "object",
      "embed",
      "portal",
    ].join(",")
  ).remove();

  // ----------------------------------------------------------
  // Remove dangerous/active metadata.
  // ----------------------------------------------------------

  $('meta[http-equiv="refresh"]').remove();

  // ----------------------------------------------------------
  // Neutralize forms.
  // ----------------------------------------------------------

  $("form").each((_index, element) => {
    const form = $(element);

    form.removeAttr("action");
    form.removeAttr("method");
    form.attr(
      "data-lp-cloner-form",
      "disabled"
    );
  });

  $("input,button,textarea,select").each(
    (_index, element) => {
      $(element).attr(
        "data-lp-cloner-control",
        "true"
      );
    }
  );

  // ----------------------------------------------------------
  // Remove inline JS event handlers.
  // ----------------------------------------------------------

  $("*").each((_index, element) => {
    const node = $(element);

    const attributes =
      "attribs" in element &&
      element.attribs
        ? element.attribs
        : {};

    for (const attributeName of Object.keys(
      attributes
    )) {
      if (
        attributeName
          .toLowerCase()
          .startsWith("on")
      ) {
        node.removeAttr(attributeName);
      }
    }
  });

  // ----------------------------------------------------------
  // Resolve normal URL attributes.
  // ----------------------------------------------------------

  const urlAttributes = [
    "src",
    "href",
    "poster",
    "data-src",
    "data-lazy-src",
  ];

  $("*").each((_index, element) => {
    const node = $(element);

    for (const attribute of urlAttributes) {
      const value = node.attr(attribute);

      if (!value) {
        continue;
      }

      if (
        attribute === "href" &&
        value.startsWith("#")
      ) {
        continue;
      }

      const absolute = absoluteUrl(
        value,
        baseUrl
      );

      if (absolute) {
        node.attr(
          attribute,
          absolute
        );
      }
    }

    const srcset =
      node.attr("srcset");

    if (srcset) {
      node.attr(
        "srcset",
        absolutizeSrcset(
          srcset,
          baseUrl
        )
      );
    }

    const dataSrcset =
      node.attr("data-srcset");

    if (dataSrcset) {
      node.attr(
        "data-srcset",
        absolutizeSrcset(
          dataSrcset,
          baseUrl
        )
      );
    }

    const style =
      node.attr("style");

    if (style) {
      node.attr(
        "style",
        absolutizeCssUrls(
          style,
          baseUrl
        )
      );
    }
  });

  // ----------------------------------------------------------
  // Resolve CSS URLs inside style blocks.
  // ----------------------------------------------------------

  $("style").each((_index, element) => {
    const node = $(element);
    const css = node.html() || "";

    node.html(
      absolutizeCssUrls(
        css,
        baseUrl
      )
    );
  });

  // ----------------------------------------------------------
  // Lazy images: if src is placeholder and data-src exists,
  // promote the real image because original JS was removed.
  // ----------------------------------------------------------

  $("img").each((_index, element) => {
    const image = $(element);

    const dataSrc =
      image.attr("data-src") ||
      image.attr("data-lazy-src");

    const currentSrc =
      image.attr("src") || "";

    if (
      dataSrc &&
      (
        !currentSrc ||
        currentSrc.startsWith("data:")
      )
    ) {
      image.attr(
        "src",
        absoluteUrl(
          dataSrc,
          baseUrl
        )
      );
    }

    const dataSrcset =
      image.attr("data-srcset");

    if (
      dataSrcset &&
      !image.attr("srcset")
    ) {
      image.attr(
        "srcset",
        absolutizeSrcset(
          dataSrcset,
          baseUrl
        )
      );
    }

    image.removeAttr("loading");
  });

  // ----------------------------------------------------------
  // Add base so remaining relative CSS/navigation resolves.
  // ----------------------------------------------------------

  $("base").remove();

  $("head").prepend(
    `<base href="${baseUrl}">`
  );

  // ----------------------------------------------------------
  // Preview safety layer.
  // ----------------------------------------------------------

  $("head").append(`
    <style data-lp-cloner-safety="true">
      html {
        scroll-behavior: auto !important;
      }

      body {
        min-height: 100vh;
      }

      a {
        cursor: default !important;
      }

      form,
      button,
      input,
      textarea,
      select {
        pointer-events: none !important;
      }
    </style>
  `);

  const headHtml =
    $("head").html() || "";

  const bodyHtml =
    $("body").html() || "";

  const html =
    $.html();

  return {
    html,
    headHtml,
    bodyHtml,
  };
}

async function fetchPage(
  requestedUrl: URL
): Promise<{
  html: string;
  finalUrl: URL;
}> {
  let currentUrl =
    requestedUrl;

  let redirectCount = 0;

  while (true) {
    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      15000
    );

    let response: Response;

    try {
      response = await fetch(
        currentUrl.href,
        {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
            "Accept-Language":
              "pt-BR,pt;q=0.9,en;q=0.8",
          },
        }
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw new Error("TIMEOUT");
      }

      throw new Error(
        "FALHA_AO_ACESSAR_URL"
      );
    } finally {
      clearTimeout(timeout);
    }

    if (
      response.status >= 300 &&
      response.status < 400
    ) {
      if (redirectCount >= 5) {
        throw new Error(
          "REDIRECT_LIMIT"
        );
      }

      const location =
        response.headers.get(
          "location"
        );

      if (!location) {
        throw new Error(
          "REDIRECT_INVALIDO"
        );
      }

      const nextUrl = new URL(
        location,
        currentUrl.href
      );

      currentUrl =
        await assertPublicUrl(
          nextUrl.href
        );

      redirectCount++;

      continue;
    }

    if (!response.ok) {
      throw new Error(
        `HTTP_${response.status}`
      );
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      !contentType
        .toLowerCase()
        .includes("text/html")
    ) {
      throw new Error(
        "CONTEUDO_NAO_HTML"
      );
    }

    const declaredLength =
      Number(
        response.headers.get(
          "content-length"
        ) || "0"
      );

    if (
      Number.isFinite(
        declaredLength
      ) &&
      declaredLength >
        MAX_HTML_BYTES
    ) {
      throw new Error(
        "PAGINA_MUITO_GRANDE"
      );
    }

    const html =
      await response.text();

    if (
      Buffer.byteLength(
        html,
        "utf8"
      ) >
      MAX_HTML_BYTES
    ) {
      throw new Error(
        "PAGINA_MUITO_GRANDE"
      );
    }

    return {
      html,
      finalUrl: currentUrl,
    };
  }
}

export async function cloneLandingPage(
  sourceUrl: string
): Promise<CloneProject> {
  const requestedUrl =
    await assertPublicUrl(
      sourceUrl
    );

  let fetched: {
    html: string;
    finalUrl: URL;
  };

  try {
    fetched =
      await fetchPage(
        requestedUrl
      );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    if (message !== "HTTP_403") {
      throw error;
    }

    const browserFetched =
      await fetchPageWithBrowser(
        requestedUrl.href
      );

    const browserFinalUrl =
      await assertPublicUrl(
        browserFetched.finalUrl.href
      );

    if (
      Buffer.byteLength(
        browserFetched.html,
        "utf8"
      ) > MAX_HTML_BYTES
    ) {
      throw new Error(
        "PAGINA_MUITO_GRANDE"
      );
    }

    fetched = {
      html: browserFetched.html,
      finalUrl: browserFinalUrl,
    };
  }

  const originalHtml =
    fetched.html;

  const finalUrl =
    fetched.finalUrl.href;

  const $ =
    cheerio.load(
      originalHtml
    );

  const title =
    cleanText(
      $("title").first().text()
    );

  const description =
    cleanText(
      $(
        'meta[name="description"]'
      ).attr("content") || ""
    );

  const faviconValue =
    $('link[rel~="icon"]')
      .first()
      .attr("href") || "";

  const favicon =
    faviconValue
      ? absoluteUrl(
          faviconValue,
          finalUrl
        )
      : null;

  const headings =
    $("h1,h2,h3")
      .slice(0, 100)
      .map((_index, element) =>
        cleanText(
          $(element).text()
        )
      )
      .get()
      .filter(Boolean);

  const texts =
    $("p,li")
      .slice(0, 300)
      .map((_index, element) =>
        cleanText(
          $(element).text()
        )
      )
      .get()
      .filter(
        (value) =>
          value.length >= 2
      );

  const links =
    $("a[href]")
      .slice(0, 200)
      .map((_index, element) => ({
        text: cleanText(
          $(element).text()
        ).slice(0, 300),

        href: absoluteUrl(
          $(element).attr(
            "href"
          ) || "",
          finalUrl
        ),
      }))
      .get()
      .filter(
        (item) => item.href
      );

  const images =
    $("img")
      .slice(0, 200)
      .map((_index, element) => {
        const srcValue =
          $(element).attr(
            "src"
          ) ||
          $(element).attr(
            "data-src"
          ) ||
          $(element).attr(
            "data-lazy-src"
          ) ||
          "";

        return {
          src: absoluteUrl(
            srcValue,
            finalUrl
          ),

          alt: cleanText(
            $(element).attr(
              "alt"
            ) || ""
          ),
        };
      })
      .get()
      .filter(
        (item) => item.src
      );

  const sections =
    extractSections(
      $,
      finalUrl
    );

  const visual =
    buildVisualDocument(
      originalHtml,
      finalUrl
    );

  return {
    id: crypto.randomUUID(),

    sourceUrl:
      requestedUrl.href,

    finalUrl,

    domain:
      fetched.finalUrl.hostname,

    title:
      title ||
      fetched.finalUrl.hostname,

    description,

    favicon,

    headings,
    texts,
    links,
    images,
    sections,

    visualHtml:
      visual.html,

    visualBodyHtml:
      visual.bodyHtml,

    visualHeadHtml:
      visual.headHtml,

    fetchedAt:
      new Date().toISOString(),
  };
}