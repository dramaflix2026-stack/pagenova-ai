import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { normalizeLanding, renderLandingHtml } from "@/lib/landing/engine";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const BUCKET="pagenova-published-sites";
const idPattern=/^[a-f0-9-]{36}$/i;
function adminClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,secret=process.env.SUPABASE_SECRET_KEY;
 if(!url||!secret)throw Error("Supabase não configurado.");
 return createAdminClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function authorized(){
 const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser();
 if(!user?.email)return null;
 const admin=adminClient();
 const {data,error}=await admin.from("entitlements").select("id").eq("product","pagenova-ai").eq("status","active").ilike("email",user.email.trim()).limit(1).maybeSingle();
 return error||!data?null:{user,admin};
}
async function ensureBucket(admin:ReturnType<typeof adminClient>){
 const {data}=await admin.storage.getBucket(BUCKET);
 if(data)return;
 const {error}=await admin.storage.createBucket(BUCKET,{public:false,fileSizeLimit:20*1024*1024,allowedMimeTypes:["application/json"]});
 if(error&&!/already exists/i.test(error.message))throw error;
}
function draftPath(owner:string,id:string){return "landing-drafts/"+owner+"/"+id+".json";}
export async function GET(request:NextRequest){
 try{
  const ctx=await authorized();if(!ctx)return NextResponse.json({error:"Acesso necessário."},{status:401});
  const storage=ctx.admin.storage.from(BUCKET),id=request.nextUrl.searchParams.get("id");
  if(id){
    if(!idPattern.test(id))return NextResponse.json({error:"Projeto inválido."},{status:400});
    const {data,error}=await storage.download(draftPath(ctx.user.id,id));
    if(error||!data)return NextResponse.json({error:"Projeto não encontrado."},{status:404});
    const saved=JSON.parse(await data.text()) as {ownerId?:string;project?:unknown};
    if(saved.ownerId!==ctx.user.id)return NextResponse.json({error:"Sem acesso."},{status:403});
    return NextResponse.json({project:saved.project},{headers:{"Cache-Control":"no-store"}});
  }
  const {data,error}=await storage.list("landing-drafts/"+ctx.user.id,{limit:100,sortBy:{column:"updated_at",order:"desc"}});
  if(error)throw error;
  const entries=(data||[]).filter(x=>idPattern.test(x.name.replace(/\.json$/,""))).slice(0,40);
  const items=await Promise.all(entries.map(async x=>{
    const id=x.name.replace(/\.json$/,"");
    let name="";let headline="";
    try{
      const {data:file,error:downloadError}=await storage.download(draftPath(ctx.user.id,id));
      if(!downloadError&&file){
        const saved=JSON.parse(await file.text()) as {ownerId?:string;project?:{name?:string;headline?:string}};
        if(saved.ownerId===ctx.user.id){name=String(saved.project?.name||"").trim().slice(0,100);headline=String(saved.project?.headline||"").trim().slice(0,100);}
      }
    }catch{/* Keep the draft accessible even if its title cannot be read. */}
    return {id,name,headline,updatedAt:x.updated_at||x.created_at||""};
  }));
  return NextResponse.json({projects:items},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("[LANDING] list failed",e instanceof Error?e.name:"unknown");return NextResponse.json({error:"Não foi possível consultar seus projetos."},{status:503});}
}
export async function POST(request:NextRequest){
 try{
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:"Origem não autorizada."},{status:403});
  const ctx=await authorized();if(!ctx)return NextResponse.json({error:"Acesso PageNova necessário."},{status:401});
  const raw=await request.text();
  if(raw.length>3_500_000)return NextResponse.json({error:"Projeto muito grande. Reduza o tamanho das imagens."},{status:413});
  let body:{project?:unknown;publish?:boolean};
  try{body=JSON.parse(raw) as {project?:unknown;publish?:boolean};}
  catch{return NextResponse.json({error:"Dados inválidos."},{status:400});}
  if(!body||typeof body!=="object"||Array.isArray(body))
    return NextResponse.json({error:"Projeto inválido."},{status:400});
  if(!body.project)return NextResponse.json({error:"Projeto ausente."},{status:400});
  const submitted=body.project as Record<string,unknown>;
  if(typeof submitted.id!=="string"||!idPattern.test(submitted.id))return NextResponse.json({error:"Identificador inválido."},{status:400});
  const project=normalizeLanding(body.project);
  if(body.publish&&(!project.name||!project.headline||!project.ctaLabel))return NextResponse.json({error:"Nome, título e botão são obrigatórios."},{status:422});
  const storage=ctx.admin.storage.from(BUCKET);
  await ensureBucket(ctx.admin);
  let publishedUrl="";
  if(body.publish){
    const slug="lp-"+project.id.replace(/-/g,"").toLowerCase();
    const {data:prior,error:readError}=await storage.download("landings/"+slug+".json");
    if(!prior&&readError&&!/not found|404/i.test(readError.message))
      return NextResponse.json({error:"Não foi possível verificar o proprietário da publicação."},{status:503});
    if(prior){
      let previousOwner="";
      try{previousOwner=(JSON.parse(await prior.text()) as {ownerId?:string}).ownerId||"";}catch{
        return NextResponse.json({error:"Publicação anterior inválida. Nenhuma alteração aplicada."},{status:409});
      }
      if(previousOwner!==ctx.user.id)return NextResponse.json({error:"Publicação pertence a outra conta."},{status:403});
    }
    project.publishedSlug=slug;
    const payload=JSON.stringify({version:1,ownerId:ctx.user.id,project,publishedAt:new Date().toISOString(),html:renderLandingHtml(project)});
    const {error}=await storage.upload("landings/"+slug+".json",new Blob([payload],{type:"application/json"}),{contentType:"application/json",upsert:Boolean(prior),cacheControl:"0"});
    if(error)throw error;
    publishedUrl=request.nextUrl.origin+"/lp/"+slug;
  }
  const draft=JSON.stringify({version:1,ownerId:ctx.user.id,project});
  const {error}=await storage.upload(draftPath(ctx.user.id,project.id),new Blob([draft],{type:"application/json"}),{contentType:"application/json",upsert:true,cacheControl:"0"});
  if(error)throw error;
  return NextResponse.json({ok:true,project,publishedUrl},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("[LANDING] save failed",e instanceof Error?e.name:"unknown");return NextResponse.json({error:"Não foi possível salvar ou publicar. Confira o projeto e tente novamente."},{status:503});}
}
