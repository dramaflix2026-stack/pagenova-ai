import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const TABLE="pagenova_builder_drafts";
const isProjectId=(value:unknown):value is string=>
  typeof value==="string"&&/^[a-zA-Z0-9_-]{12,80}$/.test(value);
async function userClient(){
  const client=await createClient();
  const {data:{user},error}=await client.auth.getUser();
  return {client,user:error?null:user};
}
function jsonError(message:string,status:number){
  return NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
}
export async function GET(request:NextRequest){
  const {client,user}=await userClient();
  if(!user)return jsonError("Faça login.",401);
  const projectId=request.nextUrl.searchParams.get("projectId");
  if(projectId===null){
    const {data,error}=await client.from(TABLE).select("project_id,title,updated_at")
      .eq("user_id",user.id).order("updated_at",{ascending:false}).limit(100);
    if(error){console.error("[builder-v2/drafts] list",error.code);return jsonError("Não foi possível consultar seus projetos.",503);}
    return NextResponse.json({projects:(data||[]).map(x=>({id:x.project_id,title:x.title,updatedAt:x.updated_at}))},{headers:{"Cache-Control":"no-store"}});
  }
  if(!isProjectId(projectId))return jsonError("Identificador inválido.",400);
  const {data,error}=await client.from(TABLE).select("site,revision,updated_at")
    .eq("user_id",user.id).eq("project_id",projectId).maybeSingle();
  if(error){console.error("[builder-v2/drafts] get",error.code);return jsonError("Nuvem indisponível para este projeto.",503);}
  if(!data)return jsonError("Rascunho não encontrado.",404);
  return NextResponse.json({site:data.site,revision:Number(data.revision),updatedAt:data.updated_at},
    {headers:{"Cache-Control":"no-store"}});
}
export async function PUT(request:NextRequest){
  const origin=request.headers.get("origin");
  if(origin){
    let originHost="";
    try{originHost=new URL(origin).host.toLowerCase();}catch{}
    const host=(request.headers.get("host")||"").toLowerCase();
    if(!originHost||originHost!==host)return jsonError("Origem não autorizada.",403);
  }
  const {client,user}=await userClient();
  if(!user)return jsonError("Faça login.",401);
  const raw=await request.text();
  if(raw.length>1_850_000)return jsonError("Rascunho excede o tamanho permitido.",413);
  let input:{site?:unknown;baseRevision?:unknown};
  try{input=JSON.parse(raw);}catch{return jsonError("Rascunho inválido.",400);}
  const site=input?.site as {id?:unknown;title?:unknown;blocks?:unknown}|undefined;
  const version=input?.baseRevision;
  if(!site||typeof site!=="object"||Array.isArray(site)||
     !isProjectId(site.id)||typeof site.title!=="string"||
     !site.title.trim()||site.title.length>160||
     !Array.isArray(site.blocks)||site.blocks.length<1||site.blocks.length>160||
     !Number.isSafeInteger(version)||typeof version!=="number"||version<0){
    return jsonError("Dados de rascunho inválidos.",422);
  }
  const projectId=site.id;
  const now=new Date().toISOString();
  if(version===0){
    const {data,error}=await client.from(TABLE).insert({
      user_id:user.id,project_id:projectId,title:site.title,site,revision:1,updated_at:now
    }).select("revision,updated_at").single();
    if(error?.code==="23505")return jsonError("Rascunho alterado em outra sessão. Seu conteúdo local foi preservado.",409);
    if(error){console.error("[builder-v2/drafts] insert",error.code);return jsonError("Falha ao salvar na nuvem; rascunho local preservado.",503);}
    return NextResponse.json({revision:Number(data.revision),updatedAt:data.updated_at});
  }
  const {data,error}=await client.from(TABLE).update({
    title:site.title,site,revision:version+1,updated_at:now
  }).eq("user_id",user.id).eq("project_id",projectId).eq("revision",version)
    .select("revision,updated_at").maybeSingle();
  if(error){console.error("[builder-v2/drafts] update",error.code);return jsonError("Falha ao salvar na nuvem; rascunho local preservado.",503);}
  if(!data)return jsonError("Rascunho alterado em outra sessão. Seu conteúdo local foi preservado.",409);
  return NextResponse.json({revision:Number(data.revision),updatedAt:data.updated_at});
}
