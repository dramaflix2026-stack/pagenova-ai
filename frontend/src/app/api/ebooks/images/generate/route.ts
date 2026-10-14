import { NextRequest } from "next/server";
import { authorizedForms, errorsAsResponse, FormServiceError } from "@/lib/forms/server";

export const runtime="nodejs";
export const maxDuration=90;
export async function POST(req:NextRequest) {
  try {
    const origin=req.headers.get("origin");
    if(origin&&origin!==req.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    await authorizedForms();
    const body=await req.json().catch(()=>({})) as {prompt?:unknown};
    const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
    if(prompt.length<10)throw new FormServiceError("Informe como deve ser a imagem.");
    const apiKey=process.env.OPENAI_API_KEY;
    if(!apiKey)throw new FormServiceError("A API de imagens não está configurada.",503);
    const response=await fetch("https://api.openai.com/v1/images/generations",{
      method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:process.env.PAGENOVA_EBOOK_IMAGE_MODEL||"gpt-image-1-mini",
        prompt:"Produce an original, polished, photorealistic editorial photograph or accurate technical visual for a premium nonfiction ebook. Show the SPECIFIC real-world subject, tools, materials and actions described here. Professional lighting, distinct composition, correct object proportions, realistic details and natural environment. Do not make empty abstract art, placeholder graphics, generic geometric blocks, diagrams with fake labels, charts, lettering, logos, watermarks, UI or typography. Subject: "+prompt.slice(0,2400),
        size:"1024x1024",quality:"low",output_format:"webp",n:1,
      }),
      signal:AbortSignal.timeout(80000),
    });
    const data=await response.json().catch(()=>({})) as {data?:Array<{b64_json?:string}>;error?:{message?:string}};
    if(!response.ok)throw new FormServiceError("Não foi possível criar a imagem. "+(data.error?.message||"Tente novamente."),502);
    const base64=data.data?.[0]?.b64_json||"";
    if(!base64)throw new FormServiceError("A API não retornou a imagem.",502);
    return Response.json({image:{url:"data:image/webp;base64,"+base64,credit:"Ilustração gerada por IA"}},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorsAsResponse(error);}
}
