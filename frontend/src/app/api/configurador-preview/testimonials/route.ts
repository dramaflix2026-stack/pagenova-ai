import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
const ENDPOINT = "https://kgbgwbodosglmonvrhyi.supabase.co/functions/v1/pagenova-preview-testimonials";
async function proxy(request:NextRequest) {
 try {
  const isUpload=request.method==="POST";
  const headers:Record<string,string>={};
  if(isUpload){const authorization=request.headers.get("authorization");if(authorization)headers.Authorization=authorization;headers["Content-Type"]=request.headers.get("content-type")||"multipart/form-data";}
  const response=await fetch(ENDPOINT,{method:request.method,headers,body:isUpload?await request.arrayBuffer():undefined,cache:"no-store"});
  return new NextResponse(await response.text(),{status:response.status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Servidor de imagens indisponível"},{status:503});}
}
export async function GET(request:NextRequest){return proxy(request);}
export async function POST(request:NextRequest){return proxy(request);}
