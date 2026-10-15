import {NextRequest} from "next/server";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
  await authorizedForms();
  return Response.json({error:"Imagens por IA estão desativadas neste módulo. Envie sua própria imagem ou use a busca de fotos licenciadas.",code:"STUDIO_PAID_API_DISABLED"},{status:409,headers:{"Cache-Control":"no-store"}});
 }catch(error){return errorsAsResponse(error);}
}