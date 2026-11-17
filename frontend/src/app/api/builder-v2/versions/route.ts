import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export const runtime="nodejs";
const TABLE="pagenova_builder_versions";
const valid=(v:unknown):v is string=>typeof v==="string"&&/^[a-zA-Z0-9_-]{12,80}$/.test(v);
type VersionInput={projectId?:unknown;label?:unknown;site?:unknown};
export async function GET(request:NextRequest){
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"Faça login."},{status:401});
 const projectId=request.nextUrl.searchParams.get("projectId");
 if(!valid(projectId))return NextResponse.json({error:"Projeto inválido."},{status:400});
 // Keep the original 1,298+ legacy versions untouched. A JSON-scoped lookup
 // exposes only historical versions of this same project, never other sites.
 const [newVersions,oldVersions]=await Promise.all([
  supabase.from(TABLE).select("id,label,site,created_at").eq("user_id",user.id)
    .eq("project_id",projectId).order("created_at",{ascending:false}).limit(25),
  supabase.from(TABLE).select("id,label,site,created_at").eq("user_id",user.id)
    .eq("project_id","builder-v2-default").eq("site->>id",projectId)
    .order("created_at",{ascending:false}).limit(25)
 ]);
 if(newVersions.error||oldVersions.error)return NextResponse.json({error:"Não foi possível carregar o histórico na nuvem."},{status:503});
 const all=[...(newVersions.data||[]),...(oldVersions.data||[])]
  .filter(x=>x.site&&typeof x.site==="object"&&(x.site as {id?:string}).id===projectId)
  .sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)).slice(0,25);
 return NextResponse.json({versions:all.map(v=>({id:v.id,label:v.label,site:v.site,at:v.created_at}))},
   {headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:NextRequest){
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"Faça login."},{status:401});
 let body:VersionInput;
 try{body=await request.json();}catch{return NextResponse.json({error:"Dados inválidos."},{status:400});}
 const site=body.site as {id?:unknown;blocks?:unknown}|null;
 if(!valid(body.projectId)||!site||typeof site!=="object"||Array.isArray(site)||
    site.id!==body.projectId||!Array.isArray(site.blocks)||site.blocks.length<1||
    site.blocks.length>200||typeof body.label!=="string"||body.label.length>120)
   return NextResponse.json({error:"Versão inválida."},{status:400});
 const {data,error}=await supabase.from(TABLE).insert({
   user_id:user.id,project_id:body.projectId,label:body.label.trim()||"Versão salva",site
 }).select("id,label,site,created_at").single();
 if(error)return NextResponse.json({error:"Não foi possível salvar na nuvem."},{status:503});
 return NextResponse.json({version:{id:data.id,label:data.label,site:data.site,at:data.created_at}},{status:201});
}
