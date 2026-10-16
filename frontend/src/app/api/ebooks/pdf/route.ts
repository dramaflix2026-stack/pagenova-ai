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
    // A4 pages use overflow:hidden for consistent printing. Before exporting,
    // detect content extending beyond a sheet instead of silently cropping it.
    const overflowingSheets=async()=>page.evaluate(()=>{
      return [...document.querySelectorAll<HTMLElement>(".sheet")]
        .map((sheet,index)=>sheet.scrollHeight>sheet.clientHeight+6?index+1:0)
        .filter((pageNumber)=>pageNumber>0);
    });
    let overflow=await overflowingSheets();
    if(overflow.length){
      await page.addStyleTag({content:`
        .sheet.pdf-compact h2{font-size:35px!important;line-height:1.08!important}
        .sheet.pdf-compact .lead{font-size:14px!important;line-height:1.42!important}
        .sheet.pdf-compact .recipe-heading{margin-top:5mm!important}
        .sheet.pdf-compact .recipe-heading h2{font-size:34px!important;margin-top:3mm!important}
        .sheet.pdf-compact .recipe-meta{font-size:12px!important;margin-top:2mm!important}
        .sheet.pdf-compact .recipe-columns{margin-top:7mm!important;gap:5mm!important}
        .sheet.pdf-compact .recipe-columns h3{font-size:21px!important;padding-bottom:3mm!important;margin-bottom:3mm!important}
        .sheet.pdf-compact .recipe-ingredients{padding:5mm 4mm!important}
        .sheet.pdf-compact .recipe-ingredients ul{gap:2mm!important}
        .sheet.pdf-compact .recipe-ingredients li{font-size:11px!important;line-height:1.32!important}
        .sheet.pdf-compact .recipe-method ol{gap:2.5mm!important}
        .sheet.pdf-compact .recipe-method li{font-size:11.5px!important;line-height:1.4!important}
        .sheet.pdf-compact .article{font-size:11.5px!important;line-height:1.45!important}
        .sheet.pdf-compact .chapter-body,.sheet.pdf-compact .feature-layout{gap:5mm!important;margin-top:6mm!important}
      `});
      await page.evaluate((indexes:number[])=>{
        const sheets=[...document.querySelectorAll<HTMLElement>(".sheet")];
        for(const number of indexes)sheets[number-1]?.classList.add("pdf-compact");
      },overflow);
      overflow=await overflowingSheets();
    }
    if(overflow.length){
      throw new FormServiceError(
        "Algumas páginas excedem o espaço A4 ("+overflow.slice(0,8).join(", ")+"). Reduza os textos ou imagens dessas páginas no editor para evitar cortes.",
        422,
      );
    }
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
