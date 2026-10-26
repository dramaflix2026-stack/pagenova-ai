import {NextRequest,NextResponse} from "next/server";
import {authorizedForms,errorsAsResponse} from "@/lib/forms/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const BUCKET="pagenova-published-sites";
/** Recover older published Builder V2 sites without trusting local browser titles or owner IDs. */
export async function POST(request:NextRequest){
 const origin=request.headers.get("origin");
 if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:"Origem não autorizada."},{status:403});
 try{
  const {admin,userId}=await authorizedForms();
  const payload=await request.json() as {projectId?:unknown;slug?:unknown};
  const id=typeof payload.projectId==="string"?payload.projectId:"";
  const slug=typeof payload.slug==="string"?payload.slug:"";
  if(!/^[a-zA-Z0-9_-]{8,128}$/.test(id)||!/^v2-[a-z0-9-]{5,80}$/.test(slug))
   return NextResponse.json({error:"Identificador inválido."},{status:422});
  const {data,error}=await admin.storage.from(BUCKET).download(slug+".json");
  if(error||!data)return NextResponse.json({error:"Site não publicado."},{status:404});
  const site=JSON.parse(await data.text()) as {
    version?:number;ownerId?:string;projectId?:string;name?:string;publishedAt?:string;
  };
  if(site.version!==2||site.ownerId!==userId||site.projectId!==id){
   return NextResponse.json({error:"Este site não pertence à conta autenticada."},{status:403});
  }
  const title=typeof site.name==="string"&&site.name.trim()?site.name.trim().slice(0,160):"Site publicado";
  const publishedAt=typeof site.publishedAt==="string"&&!Number.isNaN(Date.parse(site.publishedAt))
    ?site.publishedAt:new Date().toISOString();
  const {error:upsertError}=await admin.from("pagenova_site_publications").upsert({
   owner_id:userId,project_id:id,slug,title,published_at:publishedAt
  },{onConflict:"owner_id,project_id"});
  if(upsertError)throw upsertError;
  return NextResponse.json({ok:true,id,slug});
 }catch(error){
  if(error instanceof SyntaxError)return NextResponse.json({error:"Publicação inválida."},{status:422});
  return errorsAsResponse(error)??NextResponse.json({error:"Não foi possível importar a publicação."},{status:503});
 }
}
