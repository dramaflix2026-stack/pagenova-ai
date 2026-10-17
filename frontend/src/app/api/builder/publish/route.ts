import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { renderSitePreview, SITE_PAGES, type SiteProject } from "@/lib/site-builder";
import {appendExtraSections} from "@/lib/site-builder-extra-sections";
import { authorizedForms, errorsAsResponse } from "@/lib/forms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "pagenova-published-sites";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54) || "site";
}

async function ensureBucket(admin: Awaited<ReturnType<typeof authorizedForms>>["admin"]) {
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

  // Publishing is a paid PageNova capability, not an operation available to
  // any signed-up Supabase user. Reuse the central entitlement check.
  let access: Awaited<ReturnType<typeof authorizedForms>>;
  try { access = await authorizedForms(); }
  catch (error) { return errorsAsResponse(error); }
  const { admin, userId } = access;

  let body: { project?: SiteProject };
  try { body = await request.json() as { project?: SiteProject }; }
  catch { return NextResponse.json({ error: "Projeto inválido." }, { status: 400 }); }
  const project = body.project;
  if (!project || project.kind !== "institutional-site" ||
      typeof project.id !== "string" || project.id.length < 8 || project.id.length > 128 ||
      typeof project.name !== "string" || project.name.length > 160 ||
      !project.pages || typeof project.pages !== "object") {
    return NextResponse.json({ error: "Projeto invalido." }, { status: 400 });
  }

  const pages = Object.fromEntries(
    SITE_PAGES
      .filter(({ key }) => Boolean(project.pages[key]))
      .map(({ key }) => [key, appendExtraSections(renderSitePreview(project, key),project.extraSections?.[key])]),
  );
  if (!pages.home) {
    return NextResponse.json({ error: "A pagina inicial precisa estar pronta antes de publicar." }, { status: 409 });
  }

  const stableSuffix = project.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toLowerCase();
  await ensureBucket(admin);
  const storage = admin.storage.from(BUCKET);
  const baseSlug = `${slugify(project.name)}-${stableSuffix}`;
  const ownerSuffix = createHash("sha256").update(userId + ":" + project.id).digest("hex").slice(0, 12);

  // Preserve existing legacy URLs for their real owner. If the public slug
  // belongs to someone else, use an owner-scoped address instead of replacing
  // another customer's publication.
  let slug = baseSlug;
  let upsert = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: existing, error: readError } = await storage.download(`${slug}.json`);
    if (existing) {
      let existingOwner = "";
      let existingProjectId = "";
      try {
        const stored = JSON.parse(await existing.text()) as { ownerId?: unknown; projectId?: unknown };
        if (typeof stored.ownerId === "string") existingOwner = stored.ownerId;
        if (typeof stored.projectId === "string") existingProjectId = stored.projectId;
      } catch { /* Malformed publication is never safe to overwrite. */ }
      // Same account is not enough: two different projects must not replace
      // one another when their first eight ID characters happen to match.
      if (existingOwner === userId && existingProjectId === project.id) {
        upsert = true;
        break;
      }
      if (attempt === 0) {
        slug = `${baseSlug}-${ownerSuffix}`;
        continue;
      }
      return NextResponse.json({ error: "Conflito de endereço de publicação." }, { status: 409 });
    }
    if (readError && !/not found|object not found|404/i.test(readError.message)) {
      return NextResponse.json({ error: "Não foi possível validar o endereço público." }, { status: 503 });
    }
    break;
  }
  const payload = JSON.stringify({
    version: 1,
    slug,
    projectId: project.id,
    ownerId: userId,
    name: project.name,
    pages,
    publishedAt: new Date().toISOString(),
  });
  const { error } = await storage
    .upload(`${slug}.json`, new Blob([payload], { type: "application/json" }), {
      contentType: "application/json",
      // New slugs are create-only, avoiding a race that overwrites someone
      // else's publication. Existing owner-scoped slugs remain editable.
      upsert,
      cacheControl: "0",
    });
  if (error) {
    return NextResponse.json({ error: "Nao foi possivel publicar o site." }, { status: 500 });
  }

  const url = `${request.nextUrl.origin}/p/${slug}`;
  return NextResponse.json({ slug, url, publishedAt: new Date().toISOString() });
}
