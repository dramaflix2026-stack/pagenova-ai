import { NextRequest } from "next/server";
import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";
import { authorizedForms, errorsAsResponse, FormServiceError } from "@/lib/forms/server";
import { normalizeEbook } from "@/lib/ebooks/schema";
import { renderEbookHtml } from "@/lib/ebooks/render";

export const runtime="nodejs";
export const maxDuration=90;

export async function POST(request:NextRequest) {
  let browser: Awaited<ReturnType<typeof playwright.launch>>|null=null;
  try {
    const origin=request.headers.get("origin");
    if(origin && origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    await authorizedForms();
    const raw=await request.text();
    if(raw.length>3_800_000)throw new FormServiceError("Imagens muito grandes para exportação direta. Use Imprimir / Salvar PDF no editor.",413);
    const payload=JSON.parse(raw) as {ebook?:unknown};
    const ebook=normalizeEbook(payload.ebook);
    const html=renderEbookHtml(ebook);
    browser=await playwright.launch({
      args:chromium.args,
      executablePath:await chromium.executablePath(),
      headless:true,
    });
    const page=await browser.newPage({viewport:{width:900,height:1273},deviceScaleFactor:1});
    await page.route("**/*",async route=>{
      const url=route.request().url();
      if(url.startsWith("data:") ||
        /^https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|upload\.wikimedia\.org)\//.test(url)){
        await route.continue();
      }else{
        await route.abort();
      }
    });
    await page.setContent(html,{waitUntil:"domcontentloaded",timeout:20000});
    await page.evaluate(()=>document.fonts.ready);
    await page.evaluate(async()=>{
      const images=[...document.images];
      await Promise.all(images.map(image=>{
        if(image.complete)return Promise.resolve();
        return new Promise<void>(resolve=>{
          const finish=()=>resolve();
          image.addEventListener("load",finish,{once:true});
          image.addEventListener("error",finish,{once:true});
          setTimeout(finish,8000);
        });
      }));
    });
    const pdf=await page.pdf({
      format:"A4",preferCSSPageSize:true,printBackground:true,
      margin:{top:"0",right:"0",bottom:"0",left:"0"},
      tagged:true,
    });
    return new Response(new Uint8Array(pdf),{
      headers:{
        "Content-Type":"application/pdf",
        "Content-Disposition":"attachment; filename=\"pagenova-ebook.pdf\"",
        "Cache-Control":"no-store",
      }
    });
  }catch(error){return errorsAsResponse(error);}
  finally{if(browser)await browser.close().catch(()=>undefined);}
}
