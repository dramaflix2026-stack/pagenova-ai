import {NextRequest} from "next/server";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";
import {normalizeQuiz} from "@/lib/quizzes/schema";
import {LOCAL_ENGINE_MODE} from "@/lib/studio/local-engine";
import {generatePremiumQuiz} from "@/lib/quizzes/premium-generator";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{
  const origin=request.headers.get("origin");
  if(origin){
   let parsedOrigin:URL;
   try{parsedOrigin=new URL(origin)}catch{throw new FormServiceError("Origem não autorizada.",403)}
   const host=request.headers.get("host")?.toLowerCase()||"";
   const forwardedHost=request.headers.get("x-forwarded-host")?.split(",")[0]?.trim().toLowerCase()||"";
   const allowedHosts=[host,forwardedHost,request.nextUrl.host.toLowerCase()].filter(Boolean);
   if(parsedOrigin.protocol!=="https:"||!allowedHosts.includes(parsedOrigin.host.toLowerCase()))
    throw new FormServiceError("Origem não autorizada.",403);
  }
  await authorizedForms();
  const raw=await request.text();
  if(raw.length>220000)throw new FormServiceError("O pedido é muito grande.",413);
  const body=JSON.parse(raw) as {prompt?:unknown;existing?:unknown};
  const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
  if(prompt.length<8||prompt.length>50000)throw new FormServiceError("Descreva seu quiz em pelo menos 8 caracteres.");
  const existing=body.existing?normalizeQuiz(body.existing):null;
  if(existing&&!/\b(?:adicion[ae]|inclu[ai]|acrescent[ae])\s+(?:uma?\s+)?pergunta|\b(?:trocar|mudar|alterar)\s+(?:o\s+)?t[ií]tulo\s+(?:para|por|:)/i.test(prompt))
    throw new FormServiceError("No modo local, use adicionar pergunta sobre ... ou alterar título para ...; para alterações complexas, edite o quiz visualmente. Nenhuma API foi cobrada.",422);
  const quiz=generatePremiumQuiz(prompt,existing);
  return Response.json({quiz,usage:null,engine:LOCAL_ENGINE_MODE,paidApiCalls:0},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return errorsAsResponse(error);}
}