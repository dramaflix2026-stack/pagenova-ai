import { createHmac, randomUUID } from "node:crypto";
import { creditGateEnabled, creditErrorResponse, reserveCredit, settleCredit, settleJobCredit, type CreditAccount } from "@/lib/credits/server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function configuration() {
  const upstream = process.env.PAGENOVA_CRM_UPSTREAM?.trim().replace(/\/+$/, "");
  const secret = process.env.PAGENOVA_SSO_SECRET?.trim();
  if (!upstream || !secret || secret.length < 32) {
    throw new Error("PageNova CRM integration is not configured.");
  }
  return { upstream, secret };
}

async function identity() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.trim().toLowerCase();
  if (!user || !email) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase admin configuration is missing.");

  const admin = createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: entitlement, error } = await admin
    .from("entitlements")
    .select("id")
    .eq("product", "pagenova-ai")
    .eq("status", "active")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (error || !entitlement) return null;
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const displayName =
    (typeof metadata?.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata?.name === "string" && metadata.name.trim()) ||
    email.split("@")[0] ||
    email;

  return { externalUserId: user.id, email, name: displayName, admin };
}

function signedHeaders(secret: string, who: NonNullable<Awaited<ReturnType<typeof identity>>>) {
  const timestamp = String(Date.now());
  const payload = [who.externalUserId, who.email, who.name, timestamp].join("\n");
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return {
    "x-pagenova-user-id": who.externalUserId,
    "x-pagenova-user-email": who.email,
    "x-pagenova-user-name": who.name,
    "x-pagenova-timestamp": timestamp,
    "x-pagenova-signature": signature,
  };
}

async function proxy(request: NextRequest, context: RouteContext) {
  const method = request.method.toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Origem da requisicao nao autorizada." } },
        { status: 403 },
      );
    }
  }

  const who = await identity();
  if (!who) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Acesso PageNova necessario." } }, { status: 401 });

  const { upstream, secret } = configuration();
  const { path } = await context.params;
  const suffix = (path || []).map(encodeURIComponent).join("/");
  const target = new URL(`${upstream}/api/${suffix}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  const csrf = request.headers.get("x-csrf-token");
  if (contentType) headers.set("content-type", contentType);
  if (accept) headers.set("accept", accept);
  if (csrf) headers.set("x-csrf-token", csrf);
  Object.entries(signedHeaders(secret, who)).forEach(([key, value]) => headers.set(key, value));

  let body: ArrayBuffer | undefined=["GET","HEAD"].includes(method)
    ? undefined : await request.arrayBuffer();
  const metered=creditGateEnabled();
  const account:CreditAccount={userId:who.externalUserId,email:who.email};
  const siteMatch=method==="POST"&&suffix.match(/^site-projects\/([^/]+)\/generate$/);
  const googlePage=method==="POST"&&suffix==="google/search";
  const jobMatch=method==="GET"&&suffix.match(/^site-jobs\/([^/]+)(?:\/events)?$/);

  let creditId:string|null=null;
  if(metered&&(siteMatch||googlePage)){
    try{
      let key:string;
      if(siteMatch){
        let payload:Record<string,unknown>;
        try{payload=JSON.parse(Buffer.from(body||new ArrayBuffer(0)).toString("utf8")) as Record<string,unknown>;}
        catch{return NextResponse.json({error:{code:"INVALID_REQUEST",message:"Pedido de geração inválido."}},{status:400});}
        // CRM and Studio share the same idempotent reservation. Older CRM
        // clients may not send a key: give the upstream the SAME generated key.
        const incoming=typeof payload.idempotencyKey==="string"?payload.idempotencyKey.trim():"";
        const idempotencyKey=incoming||"pagenova_"+randomUUID();
        payload.idempotencyKey=idempotencyKey;
        body=Buffer.from(JSON.stringify(payload));
        headers.set("content-type","application/json");
        key="site:"+siteMatch[1]+":"+idempotencyKey;
      }else{
        // New user-requested Google result pages consume exactly one credit.
        // History, lead viewing and cached search metadata are never metered.
        const supplied=request.headers.get("x-pagenova-credit-request")?.trim();
        key="google:"+(supplied&&/^[a-zA-Z0-9_-]{12,100}$/.test(supplied)?supplied:randomUUID());
      }
      const booked=await reserveCredit(who.admin,account,siteMatch?"site_generation":"google_page",key);
      if(!booked.created){
        // Never forward a duplicate chargeable request; a site with a known
        // job can safely return that same ID without another paid operation.
        if(siteMatch&&booked.jobId&&booked.state!=="refunded"){
          return NextResponse.json({jobId:booked.jobId,created:false},{status:200});
        }
        return NextResponse.json({error:{code:"DUPLICATE_CREDIT_OPERATION",
          message:"Esta operação já foi solicitada. Consulte a geração ou tente novamente."}},{status:409});
      }
      creditId=booked.operationId!;
    }catch(err){return creditErrorResponse(err);}
  }

  let response:Response;
  try{
    response=await fetch(target,{method,headers,body,cache:"no-store",redirect:"manual"});
  }catch(error){
    if(creditId){
      try{await settleCredit(who.admin,account,creditId,false);}
      catch(err){console.error("[PageNova Credits] Refund failed after proxy error",err instanceof Error?err.name:"unknown");}
    }
    return NextResponse.json({error:{code:"UPSTREAM_UNAVAILABLE",message:"O servidor não respondeu. Nenhum crédito deve ser cobrado por esta falha."}},{status:502});
  }

  const outHeaders=new Headers();
  const responseType=response.headers.get("content-type");
  const disposition=response.headers.get("content-disposition");
  if(responseType)outHeaders.set("content-type",responseType);
  if(disposition)outHeaders.set("content-disposition",disposition);
  outHeaders.set("cache-control","no-store");

  if(creditId){
    // Only successful upstream operations consume the reservation. Site
    // generation counts only if a NEW job was actually accepted.
    const raw=await response.arrayBuffer();
    let parsed:{jobId?:string;created?:boolean}={};
    try{parsed=JSON.parse(Buffer.from(raw).toString("utf8")) as typeof parsed;}catch{}
    const accepted=response.ok&&(!siteMatch||(parsed.created===true&&!!parsed.jobId));
    try{
      await settleCredit(who.admin,account,creditId,accepted,
        siteMatch&&accepted?parsed.jobId:undefined);
    }catch(error){
      // Fail closed on settlements: a reserved debit remains held in the ledger,
      // but prevent the user from believing the balance has been reconciled.
      console.error("[PageNova Credits] Failed to settle",error instanceof Error?error.name:"unknown");
      return NextResponse.json({error:{code:"CREDITS_SETTLEMENT_UNCERTAIN",
        message:"A operação foi enviada, mas o saldo ainda está em conciliação. Verifique seu histórico antes de tentar novamente."}},{status:503});
    }
    return new NextResponse(raw,{status:response.status,headers:outHeaders});
  }

  if(metered&&jobMatch&&response.ok){
    // Polling events already happens during generation. Use the upstream's
    // authoritative terminal status to refund failed/cancelled jobs once.
    const raw=await response.arrayBuffer();
    try{
      const parsed=JSON.parse(Buffer.from(raw).toString("utf8")) as {job?:{id?:string;status?:string}};
      const status=parsed.job?.status;
      if(status==="SUCCEEDED"||status==="FAILED"||status==="CANCELLED"){
        await settleJobCredit(who.admin,account,parsed.job?.id||jobMatch[1],status==="SUCCEEDED");
      }
    }catch(error){
      console.warn("[PageNova Credits] Job reconciliation deferred",error instanceof Error?error.name:"unknown");
    }
    return new NextResponse(raw,{status:response.status,headers:outHeaders});
  }

  return new NextResponse(response.body,{status:response.status,headers:outHeaders});
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
