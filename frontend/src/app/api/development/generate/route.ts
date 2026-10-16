import {NextRequest} from "next/server";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";
import {localDevelopment,type DevFile} from "@/lib/studio/local-development";
import {LOCAL_ENGINE_MODE} from "@/lib/studio/local-engine";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 try{
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
  await authorizedForms();
  const text=await request.text();
  if(text.length>360000)throw new FormServiceError("O projeto enviado é muito grande para revisão.",413);
  const raw=JSON.parse(text) as {kind?:unknown;prompt?:unknown;existing?:DevFile[]};
  const kind=raw.kind==="apps"?"apps":raw.kind==="systems"?"systems":null;
  const prompt=typeof raw.prompt==="string"?raw.prompt.trim():"";
  if(!kind||prompt.length<12||prompt.length>50000)throw new FormServiceError("Selecione o tipo e descreva o projeto.");
  const valid=(f:DevFile)=>typeof f?.path==="string"&&typeof f.content==="string"&&
   f.path.length<150&&!f.path.startsWith("/")&&!f.path.includes("\\")&&
   !/^[a-zA-Z]:/.test(f.path)&&
   f.path.split("/").every(part=>!!part&&part!=="."&&part!==".."&&/^[a-zA-Z0-9._@+ -]+$/.test(part))&&
   f.content.length<50000;
  // Never silently discard malformed files from an existing project.
  // The local generation mode promises to preserve the customer's source.
  const supplied=raw.existing;
  if(supplied!==undefined&&(!Array.isArray(supplied)||supplied.length>20||
     supplied.some(file=>!valid(file as DevFile))))
    throw new FormServiceError("Os arquivos existentes contêm caminhos ou conteúdo inválidos. O projeto não foi alterado.",422);
  const existing=(supplied||[]) as DevFile[];
  const project=localDevelopment(kind,prompt,existing);
  return Response.json({...project,engine:LOCAL_ENGINE_MODE,usage:null,paidApiCalls:0},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return errorsAsResponse(e);}
}