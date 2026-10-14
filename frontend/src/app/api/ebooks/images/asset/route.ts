import { NextRequest } from "next/server";
import { authorizedForms, errorsAsResponse, FormServiceError } from "@/lib/forms/server";

export const runtime="nodejs";
export const maxDuration=30;

/**
 * Trusted Commons media proxy: validates a real, licensed result delivered by
 * /api/ebooks/images/search and allows a same-origin canvas to create a compact
 * self-contained copy in the user's ebook. No arbitrary URL fetching.
 */
export async function GET(req:NextRequest){
  try{
    await authorizedForms();
    const input=req.nextUrl.searchParams.get("url")||"";
    let parsed:URL;
    try{parsed=new URL(input);}catch{throw new FormServiceError("Endereço de foto inválido.",400);}
    if(parsed.protocol!=="https:"||parsed.hostname!=="upload.wikimedia.org"||
       !parsed.pathname.startsWith("/wikipedia/commons/")||
       !/\.(?:png|jpe?g|webp)(?:\/[^/]+)?$/i.test(parsed.pathname)||
       parsed.username||parsed.password){
      throw new FormServiceError("Apenas fotos do Wikimedia Commons são permitidas.",400);
    }
    const upstream=await fetch(parsed.toString(),{
      headers:{"Accept":"image/avif,image/webp,image/jpeg,image/png,*/*;q=0.5",
        "User-Agent":"PageNovaAI-EbookStudio/1.1"},
      redirect:"error",cache:"force-cache",signal:AbortSignal.timeout(15000),
    });
    if(!upstream.ok)throw new FormServiceError("A foto encontrada não está mais disponível.",502);
    const type=(upstream.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
    if(!["image/jpeg","image/png","image/webp"].includes(type))
      throw new FormServiceError("A foto não está em um formato compatível.",415);
    const size=Number(upstream.headers.get("content-length")||0);
    if(size>4*1024*1024)throw new FormServiceError("Imagem muito grande.",413);
    const chunks:Uint8Array[]=[];
    let bytes=0;
    if(!upstream.body)throw new FormServiceError("A imagem veio vazia.",502);
    for await(const chunk of upstream.body){
      bytes+=chunk.length;
      if(bytes>4*1024*1024){
        await upstream.body.cancel().catch(()=>undefined);
        throw new FormServiceError("Foto muito grande para um ebook.",413);
      }
      chunks.push(chunk);
    }
    if(bytes<100)throw new FormServiceError("A foto não pôde ser lida.",502);
    const data=new Uint8Array(bytes);
    let off=0;
    for(const chunk of chunks){data.set(chunk,off);off+=chunk.length;}
    return new Response(data,{
      headers:{"Content-Type":type,"Cache-Control":"private,max-age=3600",
        "X-Content-Type-Options":"nosniff"},
    });
  }catch(error){return errorsAsResponse(error);}
}
