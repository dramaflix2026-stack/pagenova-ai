// @ts-nocheck
import {NextRequest} from "next/server";
import {lookup} from "node:dns/promises";
import {isIP} from "node:net";
import {request as httpsRequest} from "node:https";
import {verifyClonerMedia} from "@/server/services/cloner-media";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=20;
const MAX_MEDIA_BYTES=3_500_000;
const accepted=new Set(["image/jpeg","image/png","image/webp","image/gif","image/avif"]);
function publicIp(ip:string):boolean{
 if(isIP(ip)===4){
  const p=ip.split(".").map(Number);
  return p[0]>0&&p[0]<224&&p[0]!==10&&p[0]!==127&&p[0]!==169&&
   !(p[0]===172&&p[1]>=16&&p[1]<=31)&&!(p[0]===192&&p[1]===168)&&
   !(p[0]===100&&p[1]>=64&&p[1]<=127)&&!(p[0]===198&&p[1]>=18&&p[1]<=19)&&
   !(p[0]===192&&p[1]===0)&&!(p[0]===198&&p[1]===51&&p[2]===100)&&
   !(p[0]===203&&p[1]===0&&p[2]===113);
 }
 if(isIP(ip)===6){
  const v=ip.toLowerCase();
  return !v.includes(".")&&/^[23][0-9a-f]{0,3}:/.test(v)&&!v.startsWith("2001:db8:");
 }
 return false;
}
async function pinnedAddress(raw:string){
 let url:URL;
 try{url=new URL(raw)}catch{throw Error("INVALID_URL");}
 if(url.protocol!=="https:"||url.username||url.password||url.port&&url.port!=="443"||
   isIP(url.hostname)||!url.hostname||url.hostname.length>253||
   url.hostname.endsWith(".local")||url.hostname==="localhost")throw Error("UNSAFE_URL");
 const records=await lookup(url.hostname,{all:true,verbatim:true}).catch(()=>[]);
 if(!records.length||records.some(r=>!publicIp(r.address)))throw Error("PRIVATE_HOST");
 return {url,ip:(records.find(r=>r.family===4)||records[0]).address};
}
async function loadImage(raw:string,redirect=0):Promise<{bytes:Buffer;mime:string}>{
 const {url,ip}=await pinnedAddress(raw);
 return new Promise((resolve,reject)=>{
  const request=httpsRequest({
   protocol:"https:",hostname:ip,port:443,servername:url.hostname,
   path:url.pathname+url.search,method:"GET",rejectUnauthorized:true,
   timeout:8000,
   headers:{
    Host:url.host,Accept:"image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.6",
    "User-Agent":"Mozilla/5.0 (compatible; PageNova-ClonerMedia/1.0)",
    Referer:url.origin+"/",
   },
  },response=>{
   const status=response.statusCode||0;
   if([301,302,303,307,308].includes(status)){
    const next=response.headers.location;
    response.resume();
    if(!next||redirect>=2){reject(Error("REDIRECT_LIMIT"));return;}
    const target=new URL(String(next),url).href;
    loadImage(target,redirect+1).then(resolve,reject);return;
   }
   if(status!==200){response.resume();reject(Error("REMOTE_IMAGE_STATUS_"+status));return;}
   const mime=String(response.headers["content-type"]||"").split(";")[0].trim().toLowerCase();
   if(!accepted.has(mime)){response.resume();reject(Error("IMAGE_MIME"));return;}
   if(Number(response.headers["content-length"]||0)>MAX_MEDIA_BYTES){
    response.resume();reject(Error("IMAGE_TOO_LARGE"));return;
   }
   let total=0;
   const parts:Buffer[]=[];
   response.on("data",(buf:Buffer)=>{
    total+=buf.length;
    if(total>MAX_MEDIA_BYTES){request.destroy(Error("IMAGE_TOO_LARGE"));return;}
    parts.push(buf);
   });
   response.on("end",()=>resolve({bytes:Buffer.concat(parts),mime}));
   response.on("error",reject);
  });
  request.on("timeout",()=>request.destroy(Error("IMAGE_TIMEOUT")));
  request.on("error",reject);request.end();
 });
}
export async function GET(request:NextRequest){
 const u=request.nextUrl.searchParams.get("u")||"",sig=request.nextUrl.searchParams.get("sig")||"";
 if(!verifyClonerMedia(u,sig))return new Response("Imagem indisponível.",{status:403});
 try{
  const {bytes,mime}=await loadImage(u);
  return new Response(new Uint8Array(bytes),{status:200,headers:{
    "Content-Type":mime,
    "Cache-Control":"public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    "X-Content-Type-Options":"nosniff",
    "Cross-Origin-Resource-Policy":"same-origin",
  }});
 }catch{
  return new Response("Imagem original indisponível.",{status:502,headers:{"Cache-Control":"no-store"}});
 }
}
