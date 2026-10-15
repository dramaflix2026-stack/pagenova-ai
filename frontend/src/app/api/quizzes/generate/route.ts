import {NextRequest} from "next/server";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";
import {normalizeQuiz} from "@/lib/quizzes/schema";
import {localQuiz,LOCAL_ENGINE_MODE} from "@/lib/studio/local-engine";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
  await authorizedForms();
  const raw=await request.text();
  if(raw.length>220000)throw new FormServiceError("O pedido é muito grande.",413);
  const body=JSON.parse(raw) as {prompt?:unknown;existing?:unknown};
  const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
  if(prompt.length<8||prompt.length>50000)throw new FormServiceError("Descreva seu quiz em pelo menos 8 caracteres.");
  const existing=body.existing?normalizeQuiz(body.existing):null;
  const quiz=localQuiz(prompt,existing);
  return Response.json({quiz,usage:null,engine:LOCAL_ENGINE_MODE,paidApiCalls:0},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return errorsAsResponse(error);}
}