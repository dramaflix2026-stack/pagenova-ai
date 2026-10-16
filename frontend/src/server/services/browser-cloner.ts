import { assertPublicUrl } from "./public-url-security";
import {isIP} from "node:net";
import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium } from "playwright-core";

const MAX_BROWSER_HTML_BYTES =
  5 * 1024 * 1024;

const BROWSER_TIMEOUT_MS = 30000;

export type BrowserFetchedPage = {
  html: string;
  finalUrl: URL;
  desktopImages: {id:string;src:string}[];
  desktopImageCount: number;
  mobileImageCount: number;
  desktopCaptured: boolean;
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

      const startedAt = Date.now();
      for (
        let pass = 0;
        pass < 3 && Date.now() - startedAt < 18000;
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
          position <= Math.min(height, 28000) && Date.now() - startedAt < 18000;
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
  // Executing a foreign website in headless Chromium requires stricter
  // network boundaries than the legacy browser extractor originally used.
  // The saved clone never carries these scripts into the editor or publication.
  const allowRemote=async(input:string)=>{
    const candidate=new URL(input);
    if(candidate.protocol!=="https:"||candidate.username||candidate.password||
       candidate.port&&candidate.port!=="443"||
       isIP(candidate.hostname)!==0||candidate.hostname.endsWith(".local")||candidate.hostname==="localhost"||
       candidate.hostname.endsWith(".internal")||candidate.hostname.endsWith(".test"))
      throw new Error("UNSAFE_BROWSER_ORIGIN");
    const parsed=await assertPublicUrl(input);
    return parsed;
  };
  const requestedUrl =
    await allowRemote(sourceUrl);

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
        serviceWorkers:"block",
        acceptDownloads:false,
        viewport: {
          width: 390,
          height: 844,
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

        if(parsed.protocol!=="https:"){
          await route.abort("blockedbyclient");
          return;
        }
        try {
          await allowRemote(requestUrl);

          await route.continue();
        } catch {
          await route.abort(
            "blockedbyclient"
          );
        }
      }
    );

    // No source WebSocket connections: they are unnecessary to capture the
    // rendered landing page and are not covered by ordinary HTTP routing.
    await page.routeWebSocket("**/*",socket=>socket.close());
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
      await allowRemote(page.url());

    await settleDynamicPage(page);

    // Snapshot mobile first. Stable image IDs survive most CSS-only responsive
    // layouts, letting the static clone preserve desktop art direction too.
    const mobileImageCount=await page.evaluate(()=>{
      const images=[...document.querySelectorAll("img")];
      images.forEach((image,index)=>image.setAttribute("data-pagenova-capture-img",String(index)));
      return images.length;
    });
    const html=await page.content();
    let desktopImages:{id:string;src:string}[]=[];
    let desktopImageCount=0,desktopCaptured=false;
    try{
      await page.setViewportSize({width:1440,height:900});
      await settleDynamicPage(page);
      const desktop=await page.evaluate(()=>{
        const images=[...document.querySelectorAll("img")];
        return {count:images.length,variants:images
          .filter(image=>image.hasAttribute("data-pagenova-capture-img"))
          .map(image=>({
            id:image.getAttribute("data-pagenova-capture-img")||"",
            src:image.currentSrc||image.getAttribute("src")||"",
          }))};
      });
      desktopImages=desktop.variants;
      desktopImageCount=desktop.count;
      desktopCaptured=true;
    }catch(error){
      // Never regress a successful mobile capture because a desktop-only
      // element, resize listener or third-party image timed out.
      console.warn("[PageNova cloner] Desktop secondary capture incomplete",{
        code:error instanceof Error?error.message.slice(0,60):"UNKNOWN"
      });
    }

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
      desktopImages,desktopImageCount,mobileImageCount,desktopCaptured,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}