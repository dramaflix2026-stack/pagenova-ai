import { NextRequest } from "next/server";
import { authorizedForms, errorsAsResponse, FormServiceError } from "@/lib/forms/server";
import { deleteCloudEbook, getCloudEbook } from "@/lib/ebooks/cloud";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{id:string}>};
export async function GET(_request:NextRequest,context:Context){
  try{
    const {admin,userId}=await authorizedForms();
    const {id}=await context.params;
    return Response.json({ebook:await getCloudEbook(admin,userId,id)},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorsAsResponse(error);}
}
export async function DELETE(request:NextRequest,context:Context){
  try{
    const origin=request.headers.get("origin");
    if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    const {admin,userId}=await authorizedForms();
    const {id}=await context.params;
    await deleteCloudEbook(admin,userId,id);
    return Response.json({ok:true},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorsAsResponse(error);}
}
