import {NextRequest} from "next/server";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";
import {normalizeForm} from "@/lib/forms/schema";
import {LOCAL_ENGINE_MODE} from "@/lib/studio/local-engine";
import {generatePageNovaForm} from "@/lib/forms/generator";
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
  if(raw.length>125000)throw new FormServiceError("O pedido é muito grande.",413);
  const body=JSON.parse(raw) as {prompt?:unknown;existing?:unknown};
  const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
  if(prompt.length<8||prompt.length>50000)throw new FormServiceError("Descreva o formulário em pelo menos 8 caracteres.");
  const existing=body.existing?normalizeForm(body.existing):null;
  if(existing&&!/\b(?:adicion[ae]|inclu[ai]|acrescent[ae])\s+(?:uma?\s+)?(?:pergunta|campo)|\b(?:trocar|mudar|alterar|atualizar)\s+(?:o\s+)?t[ií]tulo\s+(?:para|por|:)/i.test(prompt))
    throw new FormServiceError("O modo local aceita os comandos adicionar pergunta ... e alterar título para ...; outros ajustes podem ser feitos diretamente no editor. Nenhuma API foi cobrada.",422);
  const form=generatePageNovaForm(prompt,existing);
  return Response.json({form,usage:null,engine:LOCAL_ENGINE_MODE,paidApiCalls:0},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return errorsAsResponse(error);}
}