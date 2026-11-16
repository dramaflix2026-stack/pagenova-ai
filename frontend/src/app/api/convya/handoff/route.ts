import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authorizedForms, errorsAsResponse } from "@/lib/forms/server";

// This is a deliberately opt-in, single-site handoff. It never contacts a lead
// and never triggers generation, publishing, WhatsApp sends or mass outreach.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HandoffRequest = { projectId?: string };
const PUBLIC_ORIGIN = "https://www.pagenovaai.com.br";
const CONVYA_ORIGIN = "https://convya-ai-production.up.railway.app";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const host = (request.headers.get("host") || "").toLowerCase();
    return originHost === host || originHost === request.nextUrl.host.toLowerCase();
  } catch { return false; }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json({error:"Origem não autorizada."},{status:403});
  const secret = process.env.PAGENOVA_CONVYA_HANDOFF_SECRET;
  if (!secret || secret.length < 32)
    return NextResponse.json({error:"O Vendedor IA ainda não foi habilitado pela PageNova."},{status:503});
  let access: Awaited<ReturnType<typeof authorizedForms>>;
  try { access = await authorizedForms(); }
  catch (e) { return errorsAsResponse(e); }

  let body: HandoffRequest;
  try { body = await request.json() as HandoffRequest; }
  catch { return NextResponse.json({error:"Pedido inválido."},{status:400}); }
  const id = typeof body.projectId === "string" ? body.projectId.trim() : "";
  if (!/^[\w-]{8,128}$/.test(id))
    return NextResponse.json({error:"Identificador do site inválido."},{status:422});

  // Cross-check ownership AND an actual published site server-side; do not
  // trust a publishedUrl, site name or recipient supplied by the browser.
  const {data,error} = await access.admin.from("pagenova_site_publications")
    .select("project_id,slug,title,published_at")
    .eq("owner_id",access.userId).eq("project_id",id).maybeSingle();
  if(error)
    return NextResponse.json({error:"Não foi possível conferir a publicação."},{status:503});
  if(!data || typeof data.slug !== "string" || !/^[a-z0-9-]{4,128}$/.test(data.slug))
    return NextResponse.json({error:"Publique o site antes de ativar o vendedor IA."},{status:409});

  const issuedAt = Math.floor(Date.now()/1000);
  const payload = {
    v:1, kind:"approved-test-site", projectId:id,
    businessName:String(data.title||"Site PageNova").slice(0,140),
    siteUrl:PUBLIC_ORIGIN+"/p/"+data.slug,
    approvedAt:new Date().toISOString(), iat:issuedAt, exp:issuedAt+600,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256",secret).update(encoded).digest("base64url");
  const target = new URL("/whatsapp.html",CONVYA_ORIGIN);
  target.searchParams.set("handoff",encoded+"."+signature);
  return NextResponse.json({
    ok:true, launchUrl:target.toString(),
    siteUrl:payload.siteUrl,
    notice:"Aprovação registrada para este teste. Nenhuma mensagem foi enviada.",
    expiresInSeconds:600,
  },{headers:{"Cache-Control":"private, no-store","Pragma":"no-cache"}});
}
