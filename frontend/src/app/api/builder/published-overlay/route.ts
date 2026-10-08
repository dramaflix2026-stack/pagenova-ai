import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SiteProject } from "@/lib/site-builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "pagenova-published-sites";
const slugPattern = /^[a-z0-9-]{3,80}$/;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origem não autorizada." }, { status: 403 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Acesso necessário." }, { status: 401 });
  let body: { project?: SiteProject; url?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  const project = body.project;
  if (!project || project.kind !== "institutional-site" || !project.id ||
      typeof body.url !== "string") {
    return NextResponse.json({ error: "Projeto inválido." }, { status: 400 });
  }
  let url: URL;
  try { url = new URL(body.url); }
  catch { return NextResponse.json({ error: "Endereço inválido." }, { status: 400 }); }
  if (url.origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Domínio de publicação inválido." }, { status: 400 });
  }
  const match = /^\/p\/([a-z0-9-]{3,80})\/?$/.exec(url.pathname);
  if (!match || !slugPattern.test(match[1])) {
    return NextResponse.json({ error: "Endereço de publicação inválido." }, { status: 400 });
  }
  const images = {
    portrait: project.institutional?.portrait || "",
    businessPhoto: project.institutional?.businessPhoto || project.institutional?.workPhoto || "",
  };
  if (Object.values(images).some((image) =>
    image && (!/^data:image\/(png|jpeg|webp);base64,/.test(image) || image.length > 7_500_000))) {
    return NextResponse.json({ error: "Formato ou tamanho de imagem inválido." }, { status: 400 });
  }
  const payload = JSON.stringify({
    version: 1,
    projectId: project.id,
    ownerId: user.id,
    pages: project.liveEdits || {},
    images,
    updatedAt: new Date().toISOString(),
  });
  if (Buffer.byteLength(payload) > 17 * 1024 * 1024) {
    return NextResponse.json({ error: "Edições e imagens excedem o limite de publicação." }, { status: 413 });
  }
  const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!endpoint || !key) return NextResponse.json({ error: "Armazenamento indisponível." }, { status: 503 });
  const admin = createAdminClient(endpoint, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: bucket } = await admin.storage.getBucket(BUCKET);
  if (!bucket) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: false, fileSizeLimit: 20 * 1024 * 1024,
      allowedMimeTypes: ["application/json"],
    });
    if (error && !/already exists/i.test(error.message)) {
      return NextResponse.json({ error: "Falha ao preparar armazenamento." }, { status: 500 });
    }
  }
  const { error } = await admin.storage.from(BUCKET).upload(
    `overlays/${match[1]}.json`,
    new Blob([payload], { type: "application/json" }),
    { contentType: "application/json", upsert: true, cacheControl: "0" },
  );
  if (error) return NextResponse.json({ error: "Falha ao salvar edições para publicação." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
