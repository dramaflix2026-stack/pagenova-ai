import { NextRequest } from "next/server";
import { authorizedForms, errorsAsResponse, FormServiceError } from "@/lib/forms/server";
import { listCloudEbooks, saveCloudEbook } from "@/lib/ebooks/cloud";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
  try{
    const {admin,userId}=await authorizedForms();
    return Response.json({ebooks:await listCloudEbooks(admin,userId)},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorsAsResponse(error);}
}
export async function POST(req:NextRequest){
  try{
    const origin=req.headers.get("origin");
    if(origin&&origin!==req.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    const {admin,userId}=await authorizedForms();
    const raw=await req.text();
    if(raw.length>10_500_000)throw new FormServiceError("O ebook está grande demais para salvar na nuvem.",413);
    const data=JSON.parse(raw) as {ebook?:unknown};
    const ebook=await saveCloudEbook(admin,userId,data.ebook);
    return Response.json({ebook},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorsAsResponse(error);}
}
