import { NextRequest } from "next/server";
import { errorsAsResponse, FormServiceError, recordPublicSubmission } from "@/lib/forms/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Public answers are accepted only for an already published form. */
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}) {
  try {
    const origin=request.headers.get("origin");
    if(origin && origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    if(!request.headers.get("content-type")?.includes("application/json"))
      throw new FormServiceError("Formato de resposta inválido.",415);
    const bodyText=await request.text();
    if(bodyText.length>36000)throw new FormServiceError("Resposta muito grande.",413);
    let body: {answers?:unknown; companyWebsite?:unknown; consent?:unknown};
    try{body=JSON.parse(bodyText);}catch{throw new FormServiceError("Resposta inválida.");}
    if(!body||typeof body!=="object")throw new FormServiceError("Resposta inválida.");
    // Hidden honeypot: avoid saving trivial automated submissions.
    if(body.companyWebsite)return Response.json({success:true},{headers:{"Cache-Control":"no-store"}});
    if(body.consent!==true)throw new FormServiceError("Autorize o armazenamento das respostas para continuar.",422);
    const {id}=await context.params;
    await recordPublicSubmission(id,body.answers);
    return Response.json({success:true},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorsAsResponse(error);}
}
