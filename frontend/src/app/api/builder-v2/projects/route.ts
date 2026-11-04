import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validBackupPayload } from "@/lib/project-sync-contract";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, {status, headers:{"Cache-Control":"private, no-store"}});
export async function GET(request: NextRequest) {
  const db = await createClient();
  const {data:{user},error:authError} = await db.auth.getUser();
  if (authError || !user) return json({error:"Faça login."},401);
  const project = request.nextUrl.searchParams.get("project");
  const revision = request.nextUrl.searchParams.get("revision");
  if (revision && !uuid.test(revision)) return json({error:"Revisão inválida."},400);
  if (revision) {
    const {data,error} = await db.from("pagenova_project_revisions").select("*")
      .eq("user_id",user.id).eq("revision",revision).maybeSingle();
    return error ? json({error:"Backup indisponível."},503) : json({userId:user.id,backup:data});
  }
  const cursor = request.nextUrl.searchParams.get("before");
  let query = db.from("pagenova_project_revisions")
    .select("project_id,revision,kind,title,created_at,conflict")
    .eq("user_id",user.id).order("created_at",{ascending:false}).order("revision",{ascending:false}).limit(100);
  if(project) query=query.eq("project_id",project);
  // Stable keyset pagination; UUID tie-breaker avoids omitting simultaneous revisions.
  if(cursor) {
    const [date,id]=cursor.split("|");
    if(!date || !Number.isFinite(Date.parse(date)) || !uuid.test(id ?? "")) return json({error:"Cursor inválido."},400);
    query=query.or(`created_at.lt.${date},and(created_at.eq.${date},revision.lt.${id})`);
  }
  const {data,error}=await query;
  if(error) return json({error:"Backup indisponível."},503);
  const rows=data ?? [];
  const last=rows.at(-1) as unknown as {created_at:string;revision:string}|undefined;
  return json({userId:user.id,projects:rows,nextCursor:rows.length===100&&last?`${last.created_at}|${last.revision}`:null});
}
export async function POST(request: NextRequest) {
  // Cookie-authenticated writes must originate from this app.
  if(request.headers.get("origin") && request.headers.get("origin")!==request.nextUrl.origin)
    return json({error:"Origem inválida."},403);
  const db=await createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user) return json({error:"Faça login."},401);
  if(Number(request.headers.get("content-length"))>20_000_000) return json({error:"Backup muito grande."},413);
  let raw:string;
  let body;
  try{raw=await request.text();if(new TextEncoder().encode(raw).length>20_000_000)return json({error:"Backup muito grande."},413);body=JSON.parse(raw);}
  catch{return json({error:"Backup inválido."},400);}
  // userId binds durable queues to the authenticated identity, including after account switching.
  if(body.userId!==user.id) return json({error:"A conta mudou. Cópia local preservada."},409);
  if(typeof body.projectId!=="string"||body.projectId.length<1||body.projectId.length>240||
    !uuid.test(body.operationId)||body.baseRevision!==null&&!uuid.test(body.baseRevision)||
    !["studio","indexeddb"].includes(body.kind)||!validBackupPayload(body.payload,body.kind))
    return json({error:"Estado vazio ou inválido; backup anterior preservado."},422);
  const {data,error}=await db.rpc("pagenova_save_project",{
    p_project:body.projectId,p_operation:body.operationId,p_base:body.baseRevision,
    p_kind:body.kind,p_payload:body.payload,p_archive:body.archive===true,p_title:String(body.payload.title||body.payload.name||"Projeto").slice(0,240)
  });
  if(error)return json({error:"Não foi possível sincronizar. Cópia local preservada."},503);
  return json({userId:user.id,...data});
}
