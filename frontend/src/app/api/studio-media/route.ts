import { NextRequest } from "next/server";
import { authorizedForms, errorsAsResponse, FormServiceError } from "@/lib/forms/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const BUCKET="pagenova-studio-media";
const TYPES:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"};
export async function POST(request:NextRequest){
 try{
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
  const {admin,userId}=await authorizedForms();
  const raw=await request.json() as {type?:string,size?:number};
  const ext=TYPES[raw.type||""];
  if(!ext||!Number.isSafeInteger(raw.size)||typeof raw.size!=="number"||raw.size<=0||raw.size>5*1024*1024)
    throw new FormServiceError("Use uma imagem JPG, PNG, WebP ou GIF com até 5 MB.");
  const existing=await admin.storage.getBucket(BUCKET);
  if(!existing.data){
   const created=await admin.storage.createBucket(BUCKET,{public:true,fileSizeLimit:5*1024*1024,allowedMimeTypes:Object.keys(TYPES)});
   if(created.error){const retry=await admin.storage.getBucket(BUCKET);if(!retry.data)throw new FormServiceError("Armazenamento de imagens indisponível.",503);}
  }
  const path=userId+"/"+crypto.randomUUID()+"."+ext;
  const {data,error}=await admin.storage.from(BUCKET).createSignedUploadUrl(path);
  if(error||!data)throw new FormServiceError("Não foi possível preparar o upload da imagem.",503);
  return Response.json({bucket:BUCKET,path,token:data.token},{headers:{"Cache-Control":"no-store"}});
 }catch(err){return errorsAsResponse(err);}
}
