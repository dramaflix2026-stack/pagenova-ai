import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { renderSitePreview, SITE_PAGES, type SiteProject } from "@/lib/site-builder";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "pagenova-published-sites";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase admin configuration is missing.");
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54) || "site";
}

async function ensureBucket(admin: ReturnType<typeof adminClient>) {
  const { data } = await admin.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: ["application/json"],
  });
  if (error && !/already exists/i.test(error.message)) throw error;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origem nao autorizada." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Acesso PageNova necessario." }, { status: 401 });

  const body = await request.json() as { project?: SiteProject };
  const project = body.project;
  if (!project || project.kind !== "institutional-site" || !project.id || !project.name) {
    return NextResponse.json({ error: "Projeto invalido." }, { status: 400 });
  }

  const pages = Object.fromEntries(
    SITE_PAGES
      .filter(({ key }) => Boolean(project.pages[key]))
      .map(({ key }) => [key, renderSitePreview(project, key)]),
  );
  if (!pages.home) {
    return NextResponse.json({ error: "A pagina inicial precisa estar pronta antes de publicar." }, { status: 409 });
  }

  const stableSuffix = project.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toLowerCase();
  const slug = `${slugify(project.name)}-${stableSuffix}`;
  const payload = JSON.stringify({
    version: 1,
    slug,
    projectId: project.id,
    ownerId: user.id,
    name: project.name,
    pages,
    publishedAt: new Date().toISOString(),
  });

  const admin = adminClient();
  await ensureBucket(admin);
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(`${slug}.json`, new Blob([payload], { type: "application/json" }), {
      contentType: "application/json",
      upsert: true,
      cacheControl: "0",
    });
  if (error) {
    return NextResponse.json({ error: "Nao foi possivel publicar o site." }, { status: 500 });
  }

  const url = `${request.nextUrl.origin}/p/${slug}`;
  return NextResponse.json({ slug, url, publishedAt: new Date().toISOString() });
}
