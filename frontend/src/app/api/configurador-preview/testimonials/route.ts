import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const BUCKET = "site-images";
const PREFIX = "configurador-preview/depoimentos";
const TOTAL = 12;
function config() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.SUPABASE_SECRET_KEY;
 if (!url || !key) throw new Error("Storage não configurado");
 return {url:url.replace(/\/$/,""),key};
}
function headers(key:string){return {apikey:key,Authorization:`Bearer ${key}`};}
export async function GET() {
 try {
  const {url,key}=config();
  const response=await fetch(`${url}/storage/v1/object/list/${BUCKET}`,{method:"POST",headers:{...headers(key),"Content-Type":"application/json"},body:JSON.stringify({prefix:PREFIX,limit:100}),cache:"no-store"});
  if(!response.ok) return NextResponse.json({error:"Falha ao listar depoimentos"},{status:502});
  const files=await response.json() as Array<{name:string}>;
  const images:Record<number,string>={};
  for(const item of files){const match=/^conversa-(\d{2})\.(webp|png|jpg|jpeg)$/.exec(item.name);if(!match)continue;const number=Number(match[1]);if(number<1||number>TOTAL)continue;images[number]=`${url}/storage/v1/object/public/${BUCKET}/${PREFIX}/${item.name}`;}
  return NextResponse.json({images},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Storage indisponível"},{status:503});}
}
export async function POST(request:NextRequest) {
 try {
  const {url,key}=config();
  const authorization=request.headers.get("authorization")||"";
  if(!authorization.startsWith("Bearer "))return NextResponse.json({error:"Autenticação necessária"},{status:401});
  const session=await fetch(`${url}/auth/v1/user`,{headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"",Authorization:authorization},cache:"no-store"});
  if(!session.ok)return NextResponse.json({error:"Sessão inválida"},{status:401});
  const user=await session.json();
  if(user?.app_metadata?.role!=="admin" && user?.app_metadata?.is_admin!==true)return NextResponse.json({error:"Somente administradores podem alterar depoimentos"},{status:403});
  const form=await request.formData();
  const number=Number(form.get("number"));const file=form.get("file");
  if(!Number.isInteger(number)||number<1||number>TOTAL||!(file instanceof File)||!file.type.startsWith("image/")||file.size>12*1024*1024)return NextResponse.json({error:"Arquivo inválido"},{status:400});
  const extension=file.type==="image/webp"?"webp":file.type==="image/png"?"png":file.type==="image/jpeg"?"jpg":null;
  if(!extension)return NextResponse.json({error:"Formato não permitido"},{status:400});
  const path=`${PREFIX}/conversa-${String(number).padStart(2,"0")}.${extension}`;
  const saved=await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`,{method:"POST",headers:{...headers(key),"Content-Type":file.type,"x-upsert":"true"},body:await file.arrayBuffer()});
  if(!saved.ok)return NextResponse.json({error:"Não foi possível salvar no servidor"},{status:502});
  return NextResponse.json({url:`${url}/storage/v1/object/public/${BUCKET}/${path}?v=${Date.now()}`});
 }catch{return NextResponse.json({error:"Erro ao salvar"},{status:503});}
}
