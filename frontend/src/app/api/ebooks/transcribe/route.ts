import {NextRequest} from "next/server";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
  await authorizedForms();
  return Response.json({error:"Transcrição automática por API está desativada. Utilize ditado de voz do navegador ou informe o texto.",code:"STUDIO_PAID_API_DISABLED"},{status:409,headers:{"Cache-Control":"no-store"}});
 }catch(error){return errorsAsResponse(error);}
}