import { assertPublicUrl } from "./public-url-security";
import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium } from "playwright-core";

const MAX_BROWSER_HTML_BYTES =
  5 * 1024 * 1024;

const BROWSER_TIMEOUT_MS = 30000;

export type BrowserFetchedPage = {
  html: string;
  finalUrl: URL;
};

async function settleDynamicPage(
  page: import("playwright-core").Page
): Promise<void> {
  await page.waitForLoadState(
    "domcontentloaded"
  );

  try {
    await page.waitForLoadState(
      "networkidle",
      {
        timeout: 8000,
      }
    );
  } catch {
    // Some pages keep background connections alive.
  }

  await page.evaluate(`
    (async () => {
      const sleep = (ms) =>
        new Promise((resolve) =>
          setTimeout(resolve, ms)
        );

      let previousHeight = 0;

      for (
        let pass = 0;
        pass < 3;
        pass += 1
      ) {
        const height = Math.max(
          document.body
            ? document.body.scrollHeight
            : 0,
          document.documentElement
            ? document.documentElement.scrollHeight
            : 0
        );

        const viewportHeight =
          Math.max(
            window.innerHeight || 0,
            800
          );

        const step =
          Math.max(
            500,
            Math.floor(
              viewportHeight * 0.75
            )
          );

        for (
          let position = 0;
          position <= height;
          position += step
        ) {
          window.scrollTo(
            0,
            position
          );

          await sleep(140);
        }

        window.scrollTo(
          0,
          height
        );

        await sleep(800);

        const newHeight =
          Math.max(
            document.body
              ? document.body.scrollHeight
              : 0,
            document.documentElement
              ? document.documentElement.scrollHeight
              : 0
          );

        if (
          newHeight === previousHeight
        ) {
          break;
        }

        previousHeight =
          newHeight;
      }

      window.scrollTo(0, 0);

      await sleep(500);
    })()
  `);

  try {
    await page.waitForLoadState(
      "networkidle",
      {
        timeout: 5000,
      }
    );
  } catch {
    // Best effort after lazy-loading scroll.
  }
}
export async function fetchPageWithBrowser(
  sourceUrl: string
): Promise<BrowserFetchedPage> {
  const requestedUrl =
    await assertPublicUrl(sourceUrl);

  let browser:
    import("playwright-core").Browser |
    null = null;

  try {
    const windowsCandidates = [
      process.env.PROGRAMFILES
        ? `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`
        : "",
      process.env["PROGRAMFILES(X86)"]
        ? `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`
        : "",
      process.env.LOCALAPPDATA
        ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
        : "",
      process.env.PROGRAMFILES
        ? `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`
        : "",
      process.env["PROGRAMFILES(X86)"]
        ? `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`
        : "",
    ].filter(Boolean);

    let executablePath: string;
    let launchArgs: string[];

    if (process.platform === "win32") {
      const fs =
        await import("node:fs");

      const localExecutable =
        windowsCandidates.find(
          (candidate) =>
            fs.existsSync(candidate)
        );

      if (!localExecutable) {
        throw new Error(
          "BROWSER_LOCAL_NAO_ENCONTRADO"
        );
      }

      executablePath =
        localExecutable;

      launchArgs = [
        "--disable-dev-shm-usage",
        "--no-first-run",
        "--no-default-browser-check",
      ];
    } else {
      executablePath =
        await chromium.executablePath();

      launchArgs =
        chromium.args;
    }

    browser =
      await playwrightChromium.launch({
        args: launchArgs,
        executablePath,
        headless: true,
      });

    const context =
      await browser.newContext({
        viewport: {
          width: 1440,
          height: 1000,
        },

        locale: "pt-BR",

        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36",
      });

    const page =
      await context.newPage();

    await page.route(
      "**/*",
      async (route) => {
        const request =
          route.request();

        const requestUrl =
          request.url();

        let parsed: URL;

        try {
          parsed =
            new URL(requestUrl);
        } catch {
          await route.abort(
            "blockedbyclient"
          );
          return;
        }

        if (
          parsed.protocol !== "http:" &&
          parsed.protocol !== "https:"
        ) {
          await route.continue();
          return;
        }

        try {
          await assertPublicUrl(
            requestUrl
          );

          await route.continue();
        } catch {
          await route.abort(
            "blockedbyclient"
          );
        }
      }
    );

    page.setDefaultTimeout(
      BROWSER_TIMEOUT_MS
    );

    const response =
      await page.goto(
        requestedUrl.href,
        {
          waitUntil:
            "domcontentloaded",

          timeout:
            BROWSER_TIMEOUT_MS,
        }
      );

    if (!response) {
      throw new Error(
        "BROWSER_SEM_RESPOSTA"
      );
    }

    const status =
      response.status();

    if (
      status < 200 ||
      status >= 400
    ) {
      throw new Error(
        `HTTP_${status}`
      );
    }

    const finalUrl =
      await assertPublicUrl(page.url());

    await settleDynamicPage(page);

    const html =
      await page.content();

    if (
      Buffer.byteLength(
        html,
        "utf8"
      ) >
      MAX_BROWSER_HTML_BYTES
    ) {
      throw new Error(
        "PAGINA_MUITO_GRANDE"
      );
    }

    await context.close();

    return {
      html,
      finalUrl,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}