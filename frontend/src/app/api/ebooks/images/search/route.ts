import { NextRequest } from "next/server";
import { authorizedForms, errorsAsResponse, FormServiceError } from "@/lib/forms/server";

export const runtime="nodejs";
export const maxDuration=20;
/** Only properly licensed photographs from Wikimedia Commons, not hotlinked search snippets. */
type MediaResult={title?:string;imageinfo?:Array<{
  thumburl?:string;url?:string;descriptionurl?:string;
  extmetadata?:{LicenseShortName?:{value?:string};Artist?:{value?:string};Credit?:{value?:string}};
}>};
function clean(value:string):string{
  return value.replace(/<[^>]*>/g," ").replace(/&[^;\s]+;/g," ").replace(/\s+/g," ").trim().slice(0,110);
}
export async function GET(req:NextRequest) {
  try {
    await authorizedForms();
    const text=req.nextUrl.searchParams.get("q")?.trim()||"";
    if(!text)throw new FormServiceError("Descreva a imagem que deseja encontrar.");
    const search=text.slice(0,180).replace(/[^\p{L}\p{N}\s,\-.]/gu," ");
    const url=new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("action","query");
    url.searchParams.set("generator","search");
    url.searchParams.set("gsrsearch","filetype:bitmap "+search);
    url.searchParams.set("gsrnamespace","6");
    url.searchParams.set("gsrlimit","12");
    url.searchParams.set("prop","imageinfo");
    url.searchParams.set("iiprop","url|extmetadata");
    url.searchParams.set("iiurlwidth","1200");
    url.searchParams.set("format","json");
    const response=await fetch(url.toString(),{
      headers:{"User-Agent":"PageNovaEbooks/1.0 (creative-commons-attribution)","Accept":"application/json"},
      cache:"no-store",signal:AbortSignal.timeout(12000)
    });
    if(!response.ok)throw new FormServiceError("O banco de imagens não respondeu. Tente novamente.",502);
    const data=await response.json() as {query?:{pages?:Record<string,MediaResult>}};
    const choices=Object.values(data.query?.pages||{}).map(p=>{
      const info=p.imageinfo?.[0];
      const direct=info?.thumburl||info?.url||"";
      const license=info?.extmetadata?.LicenseShortName?.value||"";
      const credit=clean(info?.extmetadata?.Artist?.value||info?.extmetadata?.Credit?.value||"Wikimedia Commons");
      return {url:direct,license,credit,title:p.title||"",source:info?.descriptionurl||""};
    }).filter(p=>/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//.test(p.url)
      && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(p.url.split("?")[0])
      && /^(CC0|CC BY(?:\s|$)|Public domain|PD-)/i.test(p.license));
    if(!choices.length)return Response.json({image:null,notice:"Nenhuma foto livre compatível foi encontrada. A página manterá a arte editorial."});
    const selected=choices[0];
    return Response.json({image:{url:selected.url,credit:selected.credit+" · "+selected.license+" · Wikimedia Commons",source:selected.source}},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorsAsResponse(error);}
}
