import {NextRequest,NextResponse} from "next/server";
import {lookup} from "node:dns/promises";
import {isIP} from "node:net";
import {request as httpsRequest} from "node:https";
import * as cheerio from "cheerio";
import {createFaithfulVisual,stylesheetLinks,absolutizeCss} from "@/server/services/faithful-cloner";
import {signedClonerMedia} from "@/server/services/cloner-media";
import {fetchPageWithBrowser} from "@/server/services/browser-cloner";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";

export const runtime="nodejs";
export const maxDuration=90;
const MAX_HTML_BYTES=1_500_000;
const encode=(text:string)=>text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function publicAddress(ip:string):boolean{
  if(isIP(ip)===4){
    const p=ip.split(".").map(Number);
    return p[0]>0&&p[0]<224&&p[0]!==10&&p[0]!==127&&p[0]!==169&&
      !(p[0]===172&&p[1]>=16&&p[1]<=31)&&!(p[0]===192&&p[1]===168)&&
      !(p[0]===100&&p[1]>=64&&p[1]<=127)&&!(p[0]===198&&p[1]>=18&&p[1]<=19)&&
      !(p[0]===192&&p[1]===0)&&!(p[0]===192&&p[1]===0&&p[2]===2)&&
      !(p[0]===198&&p[1]===51&&p[2]===100)&&!(p[0]===203&&p[1]===0&&p[2]===113);
  }
  if(isIP(ip)===6){
    const v=ip.toLowerCase();
    if(v.includes("."))return false; // includes IPv4-mapped and transitional ranges
    return /^[23][0-9a-f]{0,3}:/.test(v)&&!v.startsWith("2001:db8:");
  }
  return false;
}
async function validateRemote(raw:string):Promise<{url:URL;ip:string}>{
  let url:URL;
  try{url=new URL(raw)}catch{throw new FormServiceError("Digite uma URL HTTPS válida.",422)}
  if(url.protocol!=="https:"||url.username||url.password||url.port&&url.port!=="443"||
    !url.hostname||url.hostname.length>253||url.hostname.endsWith(".local")||url.hostname==="localhost")
    throw new FormServiceError("Somente páginas HTTPS públicas podem ser importadas.",422);
  if(isIP(url.hostname))throw new FormServiceError("Endereços IP não podem ser importados.",422);
  const addresses=await lookup(url.hostname,{all:true,verbatim:true}).catch(()=>[]);
  if(!addresses.length||addresses.some(record=>!publicAddress(record.address)))
    throw new FormServiceError("O domínio não resolve para um endereço público permitido.",422);
  const selected=addresses.find(record=>record.family===4)||addresses[0];
  return {url,ip:selected.address};
}
function fetchPinnedHtml(url:URL,ip:string):Promise<{
  status:number;contentType:string;location:string;html:string;
}>{
  return new Promise((resolve,reject)=>{
    const request=httpsRequest({
      protocol:"https:",hostname:ip,port:443,servername:url.hostname,
      path:url.pathname+url.search,method:"GET",
      headers:{Host:url.host,Accept:"text/html","User-Agent":"PageNova-HTML-Importer/1.1"},
      timeout:13000,rejectUnauthorized:true,
    },response=>{
      const status=response.statusCode||0;
      const contentType=String(response.headers["content-type"]||"");
      const location=String(response.headers.location||"");
      if([301,302,303,307,308].includes(status)){
        response.resume();resolve({status,contentType,location,html:""});return;
      }
      if(Number(response.headers["content-length"]||0)>MAX_HTML_BYTES){
        response.resume();reject(new FormServiceError("Página grande demais para importar.",413));return;
      }
      let total=0;
      const parts:Buffer[]=[];
      response.on("data",(chunk:Buffer)=>{
        total+=chunk.length;
        if(total>MAX_HTML_BYTES){
          request.destroy(new Error("oversized_html"));
          return;
        }
        parts.push(chunk);
      });
      response.on("end",()=>resolve({status,contentType,location,html:Buffer.concat(parts).toString("utf8")}));
      response.on("error",reject);
    });
    request.on("timeout",()=>request.destroy(new Error("timeout")));
    request.on("error",error=>{
      reject(error.message==="oversized_html"?
        new FormServiceError("Página grande demais para importar.",413):error);
    });
    request.end();
  });
}
async function getPublicHtml(raw:string):Promise<{url:URL;html:string}>{
  let next=raw;
  for(let i=0;i<3;i++){
    const {url,ip}=await validateRemote(next);
    // Connect directly to the IP we verified, while retaining the public
    // domain for TLS SNI/certificate checks. Prevent DNS-rebinding between
    // validation and HTTP transport, not just private IP literals.
    let result:Awaited<ReturnType<typeof fetchPinnedHtml>>;
    try { result=await fetchPinnedHtml(url,ip); }
    catch(error){
      if(error instanceof FormServiceError)throw error;
      throw new FormServiceError("A página pública não pôde ser acessada com segurança.",502);
    }
    if([301,302,303,307,308].includes(result.status)){
      if(!result.location||i===2)throw new FormServiceError("A página possui redirecionamentos não suportados.",422);
      next=new URL(result.location,url).toString();continue;
    }
    if(result.status<200||result.status>=300)
      throw new FormServiceError("A página de origem não respondeu com sucesso (HTTP "+result.status+").",422);
    if(!result.contentType.toLowerCase().includes("text/html"))
      throw new FormServiceError("A URL não retornou uma página HTML.",422);
    return {url,html:result.html};
  }
  throw new FormServiceError("Não foi possível acessar a URL.",422);
}
function absolute(raw:string,base:URL):string{
  try{const u=new URL(raw,base);return u.protocol==="https:"||u.protocol==="http:"?u.href:""}catch{return ""}
}
function compact(raw:string,max=800):string{return raw.replace(/\s+/g," ").trim().slice(0,max)}
type TextLink={text:string;href:string};
type SiteImage={src:string;alt:string};

/** Read lazy-loaded image URLs before the placeholder src. Static HTML
 * importers cannot run a site's hydration/IntersectionObserver scripts. */
function importedImage(node:unknown,base:URL):SiteImage{
  const attrs=(node as {attribs?:Record<string,string>})?.attribs||{};
  const srcset=(value:string)=>value.split(",")[0]?.trim().split(/\s+/)[0]||"";
  const candidates=[
    attrs["data-src"],attrs["data-original"],attrs["data-lazy-src"],
    srcset(attrs["data-srcset"]||""),
    attrs.src,srcset(attrs.srcset||""),
  ];
  const src=candidates.map(v=>absolute(v||"",base)).find(Boolean)||"";
  return {src,alt:compact(attrs.alt||"",100)};
}
function normalizeHtml(html:string,base:URL,visual:ReturnType<typeof createFaithfulVisual>){
  const $=cheerio.load(html);
  // Reconstruct an accessible brand accent from public page metadata.
  // Never embed original CSS or JavaScript (they are not trusted).
  const themeMeta=($('meta[name="theme-color"]').attr("content")||"").trim();
  const stylesheet=$("style").toArray().map(el=>$(el).html()||"").join("\\n").slice(0,120_000);
  const cssToken=/(?:--(?:brand|primary|accent)(?:-color)?\\s*:\\s*)(#[0-9a-fA-F]{6})\\b/.exec(stylesheet)?.[1]||"";
  const candidate=/^#[a-f0-9]{6}$/i.test(themeMeta)?themeMeta:
    /^#[a-f0-9]{6}$/i.test(cssToken)?cssToken:"#12a879";
  const rgb=[1,3,5].map(index=>parseInt(candidate.slice(index,index+2),16));
  const contrastScore=(0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2])/255;
  const accent=contrastScore>.65?"#12805e":candidate;
  $("script,noscript,iframe,object,embed,form,input,button,textarea,select,video,audio,meta[http-equiv],base,svg").remove();
  $("[style]").removeAttr("style");
  $("[onclick],[onload],[onerror],[onmouseover],[onfocus]").each((_,el)=>{
    const attrs=Object.keys((el as unknown as {attribs:Record<string,string>}).attribs||{});
    attrs.filter(name=>/^on/i.test(name)).forEach(name=>$(el).removeAttr(name));
  });
  const title=compact($("title").first().text()||$("h1").first().text()||base.hostname,140);
  const description=compact($('meta[name="description"]').attr("content")||$("p").first().text(),500);
  const favicon=absolute($('link[rel~="icon"]').first().attr("href")||"",base)||null;
  const headings=$("h1,h2,h3").toArray().map(el=>compact($(el).text(),180)).filter(Boolean).slice(0,80);
  const texts=$("p,li").toArray().map(el=>compact($(el).text(),500)).filter(v=>v.length>=16).slice(0,100);
  const links:TextLink[]=$("a[href]").toArray().map(el=>({
    text:compact($(el).text()||"Visitar",90),href:absolute($(el).attr("href")||"",base)
  })).filter(item=>item.href).slice(0,100);
  const images:SiteImage[]=$("img").toArray().map(el=>importedImage(el,base))
    .filter(item=>item.src).slice(0,50);
  const elements=$("main section, main article, body > section, article, header, main, footer").toArray();
  const chosen=elements.length?elements.slice(0,12):[$("body").get(0)].filter(Boolean);
  const sections=chosen.map((el,i)=>{
    const element=$(el!);
    const heading=compact(element.find("h1,h2,h3").first().text()||"",160);
    const text=compact(element.find("p").first().text()||element.text(),650);
    const relevantLinks=element.find("a[href]").toArray().slice(0,4).map(link=>({
      text:compact($(link).text()||"Conhecer",90),href:absolute($(link).attr("href")||"",base)
    })).filter(item=>item.href);
    const relevantImages=element.find("img").toArray().map(img=>importedImage(img,base))
      .filter(item=>item.src).slice(0,2);
    return {id:"section-"+i,type:"section",tag:el!.tagName||"section",heading:heading||null,text,
      links:relevantLinks,images:relevantImages};
  }).filter(section=>section.heading||section.text);
  if(sections.length===0)sections.push({id:"section-0",type:"section",tag:"section",heading:title,text:description,links:links.slice(0,2),images:images.slice(0,1)});
  // Keep actual element hierarchy and styles. Section metadata is used only
  // for editor navigation, never as a substitute visual template.
  return {title,description,favicon,headings,texts,links,images,sections,
    ...visual};

}
/**
 * Only load public, pinned HTTPS stylesheets. No fetch() after DNS validation:
 * hostname-to-IP is fixed for the TLS connection (prevents DNS rebinding).
 * Failure is reported, never replaced by a fabricated theme.
 */
const CSS_MAX_SINGLE_BYTES=250000;
const CSS_TOTAL_LIMIT=500000;
async function publicCss(urlText:string):Promise<string>{
 const {url,ip}=await validateRemote(urlText);
 return new Promise((resolve,reject)=>{
  const request=httpsRequest({
   protocol:"https:",hostname:ip,port:443,servername:url.hostname,
   path:url.pathname+url.search,method:"GET",
   headers:{Host:url.host,Accept:"text/css,*/*;q=0.5","User-Agent":"Mozilla/5.0 (compatible; PageNova-Fidelity-Importer/2.0)"},
   timeout:6000,rejectUnauthorized:true,
  },response=>{
   if(response.statusCode!==200){response.resume();reject(Error("CSS_HTTP_"+response.statusCode));return;}
   const mime=String(response.headers["content-type"]||"").toLowerCase();
   if(mime&&!(mime.includes("text/css")||mime.includes("text/plain")||mime.includes("application/octet-stream"))){
    response.resume();reject(Error("CSS_MIME"));return;
   }
   if(Number(response.headers["content-length"]||0)>CSS_MAX_SINGLE_BYTES){
    response.resume();reject(Error("CSS_TOO_LARGE"));return;
   }
   const chunks:Buffer[]=[];let bytes=0;
   response.on("data",(chunk:Buffer)=>{
    bytes+=chunk.length;
    if(bytes>CSS_MAX_SINGLE_BYTES){request.destroy(Error("CSS_TOO_LARGE"));return;}
    chunks.push(chunk);
   });
   response.on("end",()=>resolve(absolutizeCss(Buffer.concat(chunks).toString("utf8"),url.href)));
   response.on("error",reject);
  });
  request.on("timeout",()=>request.destroy(Error("CSS_TIMEOUT")));
  request.on("error",reject);request.end();
 });
}
async function inlinedPublicCss(html:string,base:string):Promise<{
 content:string[];total:number;failed:number;
}>{
 const links=stylesheetLinks(html,base);
 // Fetch in parallel, but bound the memory, count and total bytes.
 const settled=await Promise.allSettled(links.map(publicCss));
 let total=0,failed=0;
 const content:string[]=[];
 for(const result of settled){
  if(result.status!=="fulfilled"){failed++;continue;}
  const text=result.value;
  if(total+text.length>CSS_TOTAL_LIMIT){failed++;continue;}
  total+=text.length;content.push(text);
 }
 return {content,total,failed};
}

export async function POST(request:NextRequest){
  try{
    await authorizedForms();
    const origin=request.headers.get("origin");
    if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    const text=await request.text();
    if(text.length>2000)throw new FormServiceError("Pedido muito grande.",413);
    const input=JSON.parse(text) as {url?:unknown};
    if(typeof input.url!=="string"||input.url.length>1400)throw new FormServiceError("Informe a URL de uma página.",422);
    // Prefer hydrated mobile browser DOM: static GET misses client-rendered
    // cards, text, images and Tailwind runtime styles. Retain pinned HTML
    // fetch only when Chromium is unavailable; disclose degraded fidelity.
    let url:URL,html:string;
    let engine:"hydrated-browser-v3"|"static-html-fallback-v3"="hydrated-browser-v3";
    let browserFallback=false;
    if(process.env.PAGENOVA_CLONER_BROWSER_DISABLED==="1"){
      const raw=await getPublicHtml(input.url.trim());
      url=raw.url;html=raw.html;
      engine="static-html-fallback-v3";browserFallback=true;
    }else{
      try{
        const snapshot=await fetchPageWithBrowser(input.url.trim());
        url=snapshot.finalUrl;html=snapshot.html;
      }catch(error){
        console.warn("[PageNova cloner] Chromium snapshot unavailable; using pinned HTML fallback",{
          code:error instanceof Error?error.message.slice(0,60):"UNKNOWN"
        });
        const raw=await getPublicHtml(input.url.trim());
        url=raw.url;html=raw.html;
        engine="static-html-fallback-v3";browserFallback=true;
      }
    }
    const styles=await inlinedPublicCss(html,url.href);
    const visual=createFaithfulVisual(html,url.href,styles.content,signedClonerMedia);
    const parsed=normalizeHtml(html,url,visual);
    const project={id:crypto.randomUUID(),sourceUrl:input.url.trim(),finalUrl:url.href,domain:url.hostname,
      ...parsed,fetchedAt:new Date().toISOString()};
    const warnings:string[]=[];
    if(browserFallback)warnings.push("O navegador visual não ficou disponível nesta importação. Foi usado HTML estático, que pode omitir galerias, efeitos e seções carregadas por JavaScript.");
    if(styles.failed)warnings.push(styles.failed+" folhas de estilo não puderam ser preservadas; o visual pode precisar de ajustes.");
    if(visual.detectedImages===0&&parsed.images.length>0)warnings.push("As imagens originais não puderam ser recuperadas.");
    return NextResponse.json({ok:true,engine,project,warnings,
      stats:{headings:parsed.headings.length,texts:parsed.texts.length,links:parsed.links.length,
        images:parsed.images.length,sections:parsed.sections.length,
        stylesheets:styles.content.length,recoveredImages:visual.recoveredImages}},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    if(error instanceof SyntaxError)return NextResponse.json({ok:false,error:"Dados inválidos."},{status:400});
    return errorsAsResponse(error);
  }
}