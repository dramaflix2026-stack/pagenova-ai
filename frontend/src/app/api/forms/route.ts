import { NextRequest } from "next/server";
import { authorizedForms, errorsAsResponse, FormServiceError, listOwnedForms, saveOwnedForm } from "@/lib/forms/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET() {
  try {
    const {admin,userId}=await authorizedForms();
    return Response.json({forms:await listOwnedForms(admin,userId)},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorsAsResponse(error);}
}
export async function POST(request:NextRequest) {
  try {
    const origin=request.headers.get("origin");
    if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    const {admin,userId}=await authorizedForms();
    const raw=await request.text();
    if(raw.length>80000)throw new FormServiceError("Formulário grande demais.",413);
    const body=JSON.parse(raw) as {id?:string;form?:unknown};
    if(!body||typeof body!=="object")throw new FormServiceError("Dados inválidos.");
    const form=await saveOwnedForm(admin,userId,body.form,body.id);
    return Response.json({form},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorsAsResponse(error);}
}
