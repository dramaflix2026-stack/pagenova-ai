import { NextRequest } from "next/server";
import { authorizedForms, errorsAsResponse, FormServiceError, publishOwnedForm } from "@/lib/forms/server";
export const runtime="nodejs";
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}) {
  try {
    const origin=request.headers.get("origin");
    if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    const {id}=await context.params;
    const {admin,userId}=await authorizedForms();
    const form=await publishOwnedForm(admin,userId,id);
    return Response.json({form,url:"/f/"+form.id},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorsAsResponse(error);}
}
