/**
 * Automated screenshot/report generator using the REAL Builder V2 renderer.
 * Run from frontend: node --experimental-strip-types scripts/audit-builder-v2-visual.mjs --full
 * Requires Playwright Chromium: npx playwright-core install chromium.
 * Sample mode without --full covers all families and high-risk niches.
 */
import {spawn} from "node:child_process";
import {existsSync,mkdirSync,writeFileSync} from "node:fs";
import {join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {chromium} from "playwright-core";
import {BRIEFING_TEMPLATE_FAMILIES} from "../src/lib/briefing-template-families.ts";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const output=resolve(process.env.PAGENOVA_QA_OUTPUT||join(root,"qa-artifacts","builder-v2"));
const base=process.env.PAGENOVA_QA_URL||"http://127.0.0.1:8000";
const args=process.argv.slice(2);
const full=args.includes("--full");
const strict=args.includes("--strict");
const external=args.includes("--external-server");
const models=["01","02","03"];
const screens=[{name:"mobile",width:390,height:844},{name:"desktop",width:1440,height:900}];
const all=BRIEFING_TEMPLATE_FAMILIES.flatMap(f=>f.niches.map(niche=>({family:f.id,niche})));
const important=new Set(["Comida japonesa","Padaria","Food truck","Barbearia","Estúdio de maquiagem","Materiais de construção","Perfumaria e cosméticos"]);
const chosen=full?all:all.filter(item=>important.has(item.niche)||BRIEFING_TEMPLATE_FAMILIES.some(f=>f.id===item.family&&f.niches[0]===item.niche));
const slug=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const safe=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
mkdirSync(output,{recursive:true});
let server=null;
let browser=null;
const rows=[];
let stderr="";
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const fixture=item=>base+"/qa-preview/builder-v2?niche="+encodeURIComponent(item.niche)+"&model=01";
async function runServer(){
  if(external)return;
  server=spawn("npm",["run","dev"],{cwd:root,env:{...process.env,NEXT_TELEMETRY_DISABLED:"1"},stdio:["ignore","pipe","pipe"],detached:process.platform!=="win32"});
  server.stdout.on("data",part=>{stderr=(stderr+String(part)).slice(-3000)});
  server.stderr.on("data",part=>{stderr=(stderr+String(part)).slice(-3000)});
  const until=Date.now()+180000;
  while(Date.now()<until){
    if(server.exitCode!==null)throw Error("Dev server exited: "+stderr);
    try{
      const response=await fetch(fixture(chosen[0]),{signal:AbortSignal.timeout(9000)});
      if(response.status===200)return;
    }catch{}
    await sleep(1300);
  }
  throw Error("Local QA route not ready: "+stderr);
}
function stopServer(){
  if(!server)return;
  try{if(process.platform!=="win32"&&server.pid)process.kill(-server.pid,"SIGTERM");else server.kill("SIGTERM")}catch{}
}
try{
  await runServer();
  const bin=process.env.CHROME_BIN||process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if(bin&&!existsSync(bin))throw Error("Chromium missing at "+bin);
  browser=await chromium.launch({headless:true,...(bin?{executablePath:bin}:{}),args:["--no-sandbox","--disable-dev-shm-usage"]});
  const contexts={};
  for(const device of screens)contexts[device.name]=await browser.newContext({viewport:{width:device.width,height:device.height},deviceScaleFactor:1,isMobile:device.name==="mobile",reducedMotion:"reduce",locale:"pt-BR"});
  for(const [index,item] of chosen.entries()){
    for(const model of models)for(const device of screens){
      const file=slug(item.niche)+"-m"+model+"-"+device.name+".jpeg";
      const record={niche:item.niche,family:item.family,model,viewport:device.name,file,status:"error",images:0,sections:[],broken:[],repeated:[],overflow:0,errors:[],warnings:[],sha:null};
      const page=await contexts[device.name].newPage();
      page.on("pageerror",error=>record.errors.push(String(error.message).slice(0,350)));
      try{
        const response=await page.goto(base+"/qa-preview/builder-v2?niche="+encodeURIComponent(item.niche)+"&model="+model,{waitUntil:"domcontentloaded",timeout:90000});
        if(!response||response.status()>=400)throw Error("HTTP "+response?.status());
        await page.locator("[data-qa-builder-v2='true']").waitFor({timeout:20000});
        await page.evaluate(()=>{for(const img of document.images)img.loading="eager"});
        await page.waitForTimeout(1700);
        const audit=await page.evaluate(()=>{
          const imgs=[...document.images];
          const urls=imgs.map(x=>x.currentSrc||x.src).filter(Boolean);
          const counts={};
          for(const src of urls)counts[src]=(counts[src]||0)+1;
          return {
            images:imgs.length,
            sections:[...new Set([...document.querySelectorAll("[data-universal-section]")].map(x=>x.getAttribute("data-universal-section")))].filter(Boolean),
            broken:imgs.filter(x=>x.complete&&x.naturalWidth===0).map(x=>x.currentSrc||x.src).slice(0,20),
            unloaded:imgs.filter(x=>!x.complete).length,
            repeated:Object.entries(counts).filter(([,n])=>n>=3).map(([src,n])=>({src,n})).slice(0,12),
            overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
            textSize:document.querySelector("[data-qa-builder-v2]")?.textContent?.trim().length||0,
            h1Count:document.querySelector("[data-qa-builder-v2]")?.querySelectorAll("h1").length||0,
          };
        });
        Object.assign(record,audit);
        if(audit.textSize<140)record.errors.push("Incomplete site content");
        if(audit.h1Count===0)record.warnings.push("Missing H1");
        if(audit.overflow>12)record.errors.push("Horizontal overflow "+audit.overflow+"px");
        if(audit.images===0)record.warnings.push("No images");
        if(audit.broken.length)record.errors.push(audit.broken.length+" broken images");
        if(audit.unloaded)record.warnings.push(audit.unloaded+" images not yet loaded");
        if(audit.repeated.length)record.warnings.push(audit.repeated.length+" repeated photo URLs");
        const isJapanese=item.family===3&&/japones|sushi/i.test(slug(item.niche));
        if(isJapanese&&model==="01"){
          // Exercise actual navigation, not only a source-code/text check.
          // Verify the menu is collapsed by default on both mobile and desktop.
          const trigger=page.locator('[data-japanese-header="compact"] button[aria-expanded]');
          const menu=page.getByRole("navigation",{name:"Menu principal do restaurante"});
          if(await trigger.count()!==1){
            record.errors.push("Missing Japanese M1 hamburger control");
          }else{
            if(await menu.count())record.errors.push("Japanese menu unexpectedly visible on page load");
            await trigger.click();
            if(await trigger.getAttribute("aria-expanded")!=="true"||!(await menu.isVisible())){
              record.errors.push("Japanese hamburger did not expand the navigation");
            }else{
              await menu.getByRole("link",{name:"Especialidades"}).click();
              if(await trigger.getAttribute("aria-expanded")!=="false"||await menu.count()){
                record.errors.push("Japanese menu did not close after navigation");
              }
              await trigger.click();
              await page.keyboard.press("Escape");
              if(await trigger.getAttribute("aria-expanded")!=="false"||await menu.count()){
                record.errors.push("Japanese menu did not close on Escape");
              }
            }
          }
          const footerGridColumns=await page.locator('[data-japanese-footer="premium"] .grid').first().evaluate(el=>
            getComputedStyle(el).gridTemplateColumns.split(/\s+/).filter(Boolean).length
          ).catch(()=>0);
          const expectedColumns=device.name==="desktop"?3:1;
          if(footerGridColumns!==expectedColumns)record.errors.push(
            "Japanese footer should have "+expectedColumns+" responsive grid columns; found "+footerGridColumns
          );
        }
        if(isJapanese){
          const bakeryUrls=record.broken.concat(await page.locator("img").evaluateAll(imgs=>imgs.map(x=>x.currentSrc||x.src).filter(x=>/photo-1509440159596-0249088772ff|photo-1555507036-ab1f4038808a|photo-1598373182133-52452f7691ef|photo-1549931319-a545dcf3bc73/.test(x))));
          if(bakeryUrls.some(url=>/photo-1509440159596-0249088772ff|photo-1555507036-ab1f4038808a|photo-1598373182133-52452f7691ef|photo-1549931319-a545dcf3bc73/.test(url)))record.errors.push("Bakery photo used in Japanese restaurant");
        }
        const expected=item.family===3?["inicio","especialidades","sobre","galeria","depoimentos","faq","localizacao","rodape"]:[];
        for(const sec of expected.filter(x=>!record.sections.includes(x)))record.warnings.push("Missing section: "+sec);
        const bytes=await page.screenshot({path:join(output,file),type:"jpeg",quality:62,fullPage:true,animations:"disabled",timeout:45000});
        record.sha=createHash("sha256").update(bytes).digest("hex").slice(0,16);
        record.status=record.errors.length?"error":record.warnings.length?"warning":"ok";
      }catch(error){record.errors.push(String(error.message||error).slice(0,900))}
      finally{rows.push(record);await page.close()}
    }
    if((index+1)%10===0||index+1===chosen.length)console.log("Audited "+(index+1)+"/"+chosen.length+" niches; "+rows.length+" model/viewport cases.");
  }
}catch(error){console.error("Audit startup failed:",error);process.exitCode=1}
finally{
  if(browser)await browser.close();
  stopServer();
  const counts={ok:rows.filter(x=>x.status==="ok").length,warnings:rows.filter(x=>x.status==="warning").length,errors:rows.filter(x=>x.status==="error").length};
  const summary={allNiches:all.length,selectedNiches:chosen.length,models:3,viewports:2,expected:chosen.length*6,completed:rows.length,counts,full,strict,date:new Date().toISOString()};
  writeFileSync(join(output,"report.json"),JSON.stringify({summary,entries:rows},null,2));
  const cells=rows.map(r=>'<article class="'+safe(r.status)+'"><h3>'+safe(r.niche)+' / M'+r.model+' / '+r.viewport+'</h3><a href="'+safe(r.file)+'"><img loading="lazy" src="'+safe(r.file)+'" alt="Screenshot"></a><p>'+r.images+' imagens, '+r.sections.length+' seções</p><p>'+safe(r.errors.concat(r.warnings).join(" • "))+'</p></article>').join("");
  const html='<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PageNova · Auditoria visual</title><style>body{background:#131a16;color:#f3f7ef;font-family:Arial;margin:0}header{padding:22px;background:#1a2a21;position:sticky;top:0}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;padding:16px}article{background:#26352c;padding:12px;border:1px solid #445c4d;border-radius:10px}article.error{border-color:#e27878}article.warning{border-color:#e7b967}h3{font-size:15px;min-height:32px}img{width:100%;height:320px;object-fit:cover;object-position:top}p{font-size:12px;overflow-wrap:anywhere}button{background:#b7f666;padding:8px;border:0;border-radius:5px;margin-right:8px}[hidden]{display:none!important}</style><header><h1>PageNova · Auditoria visual</h1><p>'+summary.completed+' / '+summary.expected+' cenários · '+counts.errors+' erros · '+counts.warnings+' alertas</p><button onclick="filterSites(\'all\')">Todos</button><button onclick="filterSites(\'error\')">Erros</button><button onclick="filterSites(\'warning\')">Alertas</button><button onclick="filterSites(\'ok\')">OK</button></header><main>'+cells+'</main><script>function filterSites(s){document.querySelectorAll("article").forEach(e=>e.hidden=s!=="all"&&!e.classList.contains(s))}</script></html>';
  writeFileSync(join(output,"index.html"),html);
  console.log("Results at "+output+"/index.html "+JSON.stringify(summary));
  if(strict&&counts.errors)process.exitCode=1;
}
