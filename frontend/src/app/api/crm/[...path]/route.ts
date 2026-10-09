import { createHmac } from "node:crypto";

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

  return { externalUserId: user.id, email, name: displayName };
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
  const origin = request.headers.get("x-pagenova-generation-origin");
  if (origin === "builder") headers.set("x-pagenova-generation-origin", "builder");
  if (contentType) headers.set("content-type", contentType);
  if (accept) headers.set("accept", accept);
  if (csrf) headers.set("x-csrf-token", csrf);
  Object.entries(signedHeaders(secret, who)).forEach(([key, value]) => headers.set(key, value));

  const body = ["GET", "HEAD"].includes(method) ? undefined : await request.arrayBuffer();
  const response = await fetch(target, { method, headers, body, cache: "no-store", redirect: "manual" });

  const outHeaders = new Headers();
  const responseType = response.headers.get("content-type");
  const disposition = response.headers.get("content-disposition");
  if (responseType) outHeaders.set("content-type", responseType);
  if (disposition) outHeaders.set("content-disposition", disposition);

  return new NextResponse(response.body, { status: response.status, headers: outHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
