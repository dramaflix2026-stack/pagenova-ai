import { NextRequest,NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const BUCKET="pagenova-published-sites";
const pattern=/^lp-[a-f0-9]{32}$/;
const text=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max):"";
function admin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw Error("configuration");
 return createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function ownerFor(storage:ReturnType<ReturnType<typeof admin>["storage"]["from"]>,slug:string){
 const {data,error}=await storage.download("landings/"+slug+".json");
 if(error||!data)return null;
 const parsed=JSON.parse(await data.text()) as {ownerId?:string;project?:{publishedSlug?:string}};
 return parsed.project?.publishedSlug===slug?parsed.ownerId:null;
}
export async function POST(req:NextRequest){
 try{
  const origin=req.headers.get("origin");
  if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"Origem inválida."},{status:403});
  if(Number(req.headers.get("content-length")||"0")>5000)return NextResponse.json({error:"Solicitação muito grande."},{status:413});
  const raw=await req.text();if(raw.length>5000)return NextResponse.json({error:"Mensagem muito grande."},{status:413});
  const b=JSON.parse(raw) as Record<string,unknown>;
  const slug=text(b.slug,40),name=text(b.name,100),email=text(b.email,160),message=text(b.message,1000);
  if(b.website)return NextResponse.json({ok:true});
  if(!pattern.test(slug)||name.length<2||!/^.+@.+\..+$/.test(email))return NextResponse.json({error:"Preencha nome e e-mail corretamente."},{status:400});
  const storage=admin().storage.from(BUCKET);
  if(!await ownerFor(storage,slug))return NextResponse.json({error:"Página indisponível."},{status:404});
  const record={name,email,message,slug,submittedAt:new Date().toISOString()};
  const key="landing-leads/"+slug+"/"+new Date().toISOString().slice(0,10)+"-"+crypto.randomUUID()+".json";
  const {error}=await storage.upload(key,new Blob([JSON.stringify(record)],{type:"application/json"}),{contentType:"application/json",upsert:false});
  if(error)throw error;
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Não foi possível enviar a mensagem."},{status:503});}
}
export async function GET(req:NextRequest){
 try{
  const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser();
  if(!user?.id)return NextResponse.json({error:"Faça login."},{status:401});
  const slug=req.nextUrl.searchParams.get("slug")||"";
  if(!pattern.test(slug))return NextResponse.json({error:"Página inválida."},{status:400});
  const storage=admin().storage.from(BUCKET);
  if(await ownerFor(storage,slug)!==user.id)return NextResponse.json({error:"Sem acesso."},{status:403});
  const {data,error}=await storage.list("landing-leads/"+slug,{limit:100,sortBy:{column:"created_at",order:"desc"}});
  if(error)throw error;
  const results=await Promise.all((data||[]).filter(x=>x.name.endsWith(".json")).slice(0,60).map(async item=>{
   const {data:file}=await storage.download("landing-leads/"+slug+"/"+item.name);
   try{return file?JSON.parse(await file.text()):null;}catch{return null;}
  }));
  return NextResponse.json({leads:results.filter(Boolean)},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Não foi possível listar contatos."},{status:503});}
}
