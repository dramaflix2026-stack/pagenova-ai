import {NextRequest,NextResponse} from "next/server";
import {lookup} from "node:dns/promises";
import {isIP} from "node:net";
import {request as httpsRequest} from "node:https";
import * as cheerio from "cheerio";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";

export const runtime="nodejs";
export const maxDuration=35;
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
function normalizeHtml(html:string,base:URL){
  const $=cheerio.load(html);
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
  const images:SiteImage[]=$("img[src]").toArray().map(el=>({
    src:absolute($(el).attr("src")||"",base),alt:compact($(el).attr("alt")||"",100)
  })).filter(item=>item.src).slice(0,50);
  const elements=$("main section, main article, body > section, article, header, main, footer").toArray();
  const chosen=elements.length?elements.slice(0,12):[$("body").get(0)].filter(Boolean);
  const sections=chosen.map((el,i)=>{
    const element=$(el!);
    const heading=compact(element.find("h1,h2,h3").first().text()||"",160);
    const text=compact(element.find("p").first().text()||element.text(),650);
    const relevantLinks=element.find("a[href]").toArray().slice(0,4).map(link=>({
      text:compact($(link).text()||"Conhecer",90),href:absolute($(link).attr("href")||"",base)
    })).filter(item=>item.href);
    const relevantImages=element.find("img[src]").toArray().slice(0,2).map(img=>({
      src:absolute($(img).attr("src")||"",base),alt:compact($(img).attr("alt")||"",100)
    })).filter(item=>item.src);
    return {id:"section-"+i,type:"section",tag:el!.tagName||"section",heading:heading||null,text,
      links:relevantLinks,images:relevantImages};
  }).filter(section=>section.heading||section.text);
  if(sections.length===0)sections.push({id:"section-0",type:"section",tag:"section",heading:title,text:description,links:links.slice(0,2),images:images.slice(0,1)});
  // Safe, authored HTML, not arbitrary third-party JavaScript/CSS or embedded forms.
  const visualBodyHtml='<header class="nav"><strong>'+encode(title)+'</strong></header>'+
    sections.map((s,i)=>'<section class="block"><div class="copy"><span class="eyebrow">SEÇÃO '+String(i+1).padStart(2,"0")+'</span>'+
      '<h2>'+encode(s.heading||title)+'</h2><p>'+encode(s.text)+'</p>'+
      (s.links[0]?'<a href="'+encode(s.links[0].href)+'" target="_blank" rel="noopener noreferrer">'+encode(s.links[0].text)+'</a>':"")+
      '</div>'+(s.images[0]?'<img loading="lazy" src="'+encode(s.images[0].src)+'" alt="'+encode(s.images[0].alt)+'">':"")+'</section>').join("")+
    '<footer>Projeto importado e editável na PageNova</footer>';
  const visualHeadHtml='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<style>*{box-sizing:border-box}body{margin:0;background:#f7f8fa;color:#141b25;font:16px/1.7 Arial,sans-serif}.nav{padding:24px 6vw;background:#122c2b;color:white}.block{max-width:1240px;margin:auto;min-height:280px;padding:75px 6vw;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8%;align-items:center}.block:nth-child(odd){background:#eff4f2}.copy h2{font-size:clamp(30px,4vw,58px);line-height:1.1;margin:12px 0 23px}.copy p{white-space:pre-wrap}.block img{width:100%;max-height:400px;object-fit:contain;border-radius:20px}.eyebrow{font-size:11px;font-weight:800;letter-spacing:2px;color:#11825c}a{display:inline-block;margin-top:15px;background:#12a879;padding:12px 23px;color:#fff;border-radius:10px;text-decoration:none}footer{padding:38px;text-align:center;background:#122c2b;color:#fff}@media(max-width:720px){.block{grid-template-columns:1fr;padding:42px 24px}.block img{max-height:260px}.copy h2{font-size:36px}}</style>';
  return {title,description,favicon,headings,texts,links,images,sections,visualHeadHtml,visualBodyHtml,
    visualHtml:"<!doctype html><html lang=\"pt-BR\"><head>"+visualHeadHtml+"</head><body>"+visualBodyHtml+"</body></html>"};
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
    const {url,html}=await getPublicHtml(input.url.trim());
    const parsed=normalizeHtml(html,url);
    const project={id:crypto.randomUUID(),sourceUrl:input.url.trim(),finalUrl:url.href,domain:url.hostname,
      ...parsed,fetchedAt:new Date().toISOString()};
    return NextResponse.json({ok:true,engine:"public-html-import-v1",project,
      stats:{headings:parsed.headings.length,texts:parsed.texts.length,links:parsed.links.length,
        images:parsed.images.length,sections:parsed.sections.length}},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    if(error instanceof SyntaxError)return NextResponse.json({ok:false,error:"Dados inválidos."},{status:400});
    return errorsAsResponse(error);
  }
}