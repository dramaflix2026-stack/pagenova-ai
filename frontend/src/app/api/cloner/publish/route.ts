import {NextRequest,NextResponse} from "next/server";
import {createHash} from "node:crypto";
import * as cheerio from "cheerio";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";
import {verifyClonerMedia} from "@/server/services/cloner-media";

export const runtime="nodejs";
export const maxDuration=40;
const BUCKET="pagenova-published-sites";
function cleanHtml(raw:string):string{
  const $=cheerio.load(raw);
  $("script,iframe,object,embed,form,input,button,textarea,select,video,audio,svg,base,meta[http-equiv],link").remove();
  $("*").each((_,element)=>{
    const attrs=Object.keys((element as unknown as {attribs?:Record<string,string>}).attribs||{});
    for(const name of attrs)if(/^on/i.test(name))$(element).removeAttr(name);
    if(element.type==="tag"&&element.tagName==="a"){
      const url=$(element).attr("href")||"";
      if(!/^https?:\/\//i.test(url))$(element).removeAttr("href");
      $(element).attr("rel","noopener noreferrer").attr("target","_blank");
    }
    if(element.type==="tag"&&element.tagName==="img"){
      const url=$(element).attr("src")||"";
      const isRemote=/^https:\/\//i.test(url);
      const isInline=/^data:image\/(?:png|jpeg|webp);base64,/i.test(url)&&url.length<=180000;
      let isSignedLocal=false;
      if(url.startsWith("/api/cloner/media?")){
        try{
          const parsed=new URL(url,"https://pagenova.local");
          isSignedLocal=parsed.pathname==="/api/cloner/media"&&verifyClonerMedia(
            parsed.searchParams.get("u")||"",parsed.searchParams.get("sig")||"");
        }catch{isSignedLocal=false;}
      }
      if(!isRemote&&!isInline&&!isSignedLocal)$(element).remove();
    }
  });
  $('meta[charset]').remove();
  $("head").prepend('<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">');
  const sanitized="<!doctype html>"+$.html();
  if(sanitized.length>750_000)throw new FormServiceError("Projeto muito grande. Reduza o número de imagens ou blocos.",413);
  return sanitized;
}
export async function POST(request:NextRequest){
  try{
    const origin=request.headers.get("origin");
    if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    const {admin,userId}=await authorizedForms();
    const raw=await request.text();
    if(raw.length>800_000)throw new FormServiceError("Projeto muito grande para publicação.",413);
    const input=JSON.parse(raw) as {projectId?:unknown;title?:unknown;html?:unknown};
    if(typeof input.projectId!=="string"||!(/^[0-9a-f-]{36}$/i.test(input.projectId))||
       typeof input.html!=="string"||input.html.length<50)
      throw new FormServiceError("O projeto ainda não tem HTML válido.",422);
    const content=cleanHtml(input.html);
    const title=typeof input.title==="string"?input.title.trim().slice(0,160):"Projeto editável";
    // Deterministic per owner+project: publishing again updates the SAME public
    // URL instead of creating orphan copies on every edit/republish.
    const slug="c-"+createHash("sha256").update(userId+":"+input.projectId).digest("hex").slice(0,32);
    const data=JSON.stringify({ownerId:userId,projectId:input.projectId,title,content,
      publishedAt:new Date().toISOString()});
    const existingBucket=await admin.storage.getBucket(BUCKET);
    if(!existingBucket.data){
      const created=await admin.storage.createBucket(BUCKET,{
        public:false,fileSizeLimit:20*1024*1024,allowedMimeTypes:["application/json"],
      });
      if(created.error){
        const check=await admin.storage.getBucket(BUCKET);
        if(!check.data)throw new FormServiceError("Armazenamento de publicação indisponível.",503);
      }
    }
    const {error}=await admin.storage.from(BUCKET).upload("published-clones/"+slug+".json",
      new Blob([data],{type:"application/json"}),{
        upsert:true,contentType:"application/json",cacheControl:"0"
      });
    if(error)throw new FormServiceError("Não foi possível publicar a página. Tente novamente.",503);
    return NextResponse.json({ok:true,url:request.nextUrl.origin+"/c/"+slug,slug},
      {headers:{"Cache-Control":"no-store"}});
  }catch(error){
    if(error instanceof SyntaxError)return NextResponse.json({error:"Pedido inválido."},{status:400});
    return errorsAsResponse(error);
  }
}