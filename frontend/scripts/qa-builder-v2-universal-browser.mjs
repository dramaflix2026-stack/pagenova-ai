import assert from "node:assert/strict";
import {mkdirSync,writeFileSync,readFileSync} from "node:fs";
import {resolve} from "node:path";
import {chromium as playwright} from "playwright-core";
import chromium from "@sparticuz/chromium";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import {fileURLToPath} from "node:url";
import {fixture,renderHtml} from "./builder-v2-renderer-harness.mjs";
const directory=resolve(process.env.PAGENOVA_QA_OUTPUT||"/tmp/pagenova-browser-qa");
mkdirSync(directory,{recursive:true});
const cssPath=fileURLToPath(new URL("../src/app/globals.css",import.meta.url));
const appCss=process.env.PAGENOVA_QA_CSS?readFileSync(process.env.PAGENOVA_QA_CSS,"utf8"):(await postcss([tailwind({base:resolve(cssPath,"../../.."),optimize:true})]).process(readFileSync(cssPath,"utf8"),{from:cssPath})).css;
const browser=await playwright.launch({args:chromium.args,executablePath:await chromium.executablePath(),headless:true});
const results=[];
try{
 const page=await browser.newPage();
 await page.route("**/*",route=>route.abort());
 const errors=[];page.on("pageerror",error=>errors.push(error.message));
 for(const templateId of ["institutional-complete","minimalist-sophisticated"]){
  for(const publishedMode of [false,true]){
   await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+appCss+'</style><style>body{margin:0}</style></head><body>'+renderHtml({...fixture(),templateId},publishedMode)+"</body></html>");
   for(const width of [1440,768,390]){
    await page.setViewportSize({width,height:950});
    const state=await page.evaluate(()=>{
     const style=id=>{const element=document.querySelector('[data-block-id="'+id+'"]');const s=getComputedStyle(element);return {color:s.color,fontSize:s.fontSize,fontFamily:s.fontFamily,href:element.getAttribute("href")};};
     return {heading:style("hero"),intro:style("intro"),cta:style("cta"),overflow:document.documentElement.scrollWidth>innerWidth};
    });
    assert.equal(state.heading.color,"rgb(102, 51, 153)");
    assert.equal(state.heading.fontSize,width<768?"26px":"48px");
    assert.equal(state.cta.fontSize,width<768?"16px":"19px");
    assert.equal(state.cta.href,"/contato?origem=site#form");
    assert.match(state.intro.fontFamily,/Georgia/);
    if(width<768)assert.equal(state.intro.fontSize,"18px");
    assert.deepEqual(errors,[]);
    assert.equal(state.overflow,false,"Unexpected horizontal overflow");
    results.push({templateId,publishedMode,width,...state});
    await page.screenshot({path:resolve(directory,`${templateId}-${publishedMode?"public":"preview"}-${width}.png`),fullPage:true});
   }
  }
 }
 writeFileSync(resolve(directory,"results.json"),JSON.stringify(results,null,2));
 console.log("PASS: 12 browser scenarios (2 templates × preview/public × desktop/tablet/mobile); actual computed colors, typography and CTA destinations.");
}finally{await browser.close();}
