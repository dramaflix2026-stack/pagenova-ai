import { authorizedForms, errorsAsResponse } from "@/lib/forms/server";
import { GET as crmGet } from "@/app/api/crm/[...path]/route";
import { NextRequest, NextResponse } from "next/server";
import type { SiteProject } from "@/lib/site-builder";
import {validExtraSections} from "@/lib/site-builder-extra-sections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "pagenova-published-sites";
const slugPattern = /^[a-z0-9-]{3,80}$/;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origem não autorizada." }, { status: 403 });
  }
  // Only paying customers may persist public-site overlays.
  let access: Awaited<ReturnType<typeof authorizedForms>>;
  try { access = await authorizedForms(); }
  catch (error) { return errorsAsResponse(error); }
  const { admin, userId } = access;
  let body: { project?: SiteProject; url?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  const project = body.project;
  if (!project || project.kind !== "institutional-site" ||
      typeof project.id !== "string" || !/^[a-zA-Z0-9]{26}$/.test(project.id) ||
      typeof body.url !== "string") {
    return NextResponse.json({ error: "Projeto inválido." }, { status: 400 });
  }
  let url: URL;
  try { url = new URL(body.url); }
  catch { return NextResponse.json({ error: "Endereço inválido." }, { status: 400 }); }
  // Railway may return its own host; the public site is proxied on PageNova.
  const upstream = process.env.PAGENOVA_CRM_UPSTREAM?.trim().replace(/\/+$/, "");
  let upstreamOrigin = "";
  try { if (upstream) upstreamOrigin = new URL(upstream).origin; } catch { /* configuration */ }
  // The browser must not choose an arbitrary trusted host via forwarded headers.
  const publicOrigin = request.nextUrl.origin;
  const trustedOrigins = new Set([publicOrigin, upstreamOrigin].filter(Boolean));
  if (url.protocol !== "https:" || !trustedOrigins.has(url.origin)) {
    return NextResponse.json({ error: "Domínio de publicação inválido. Confira PAGENOVA_CRM_UPSTREAM." }, { status: 400 });
  }
  const match = /^\/p\/([a-z0-9-]{3,80})\/?$/.exec(url.pathname);
  if (!match || !slugPattern.test(match[1])) {
    return NextResponse.json({ error: "Endereço de publicação inválido." }, { status: 400 });
  }
  // Ask the authenticated CRM proxy for BOTH the owned workspace project and
  // its active publication. A signed-in user may not change a foreign slug
  // merely by submitting its public URL and a fabricated project ID.
  const crmRead = (path: string[]) => {
    const url = new URL("/api/crm/" + path.map(encodeURIComponent).join("/"), request.url);
    const cookie = request.headers.get("cookie");
    const headers = new Headers(cookie ? { cookie } : undefined);
    return crmGet(new NextRequest(url, { method: "GET", headers }), {
      params: Promise.resolve({ path }),
    });
  };
  try {
    const owned = await crmRead(["site-projects", project.id]);
    if (!owned.ok) return NextResponse.json({ error: "Projeto não encontrado neste workspace." }, { status: 403 });
    const details = await owned.json() as { project?: { id?: string } };
    if (details.project?.id !== project.id)
      return NextResponse.json({ error: "Projeto não pertence à sessão." }, { status: 403 });
    const found = await crmRead(["site-projects", project.id, "publications"]);
    if (!found.ok) return NextResponse.json({ error: "Não foi possível validar a publicação." }, { status: 503 });
    const listing = await found.json() as { publications?: Array<{slug?: string; status?: string; projectId?: string}> };
    const isOwnedPublication = Array.isArray(listing.publications) && listing.publications.some(
      publication => publication.slug === match[1] && publication.status === "ACTIVE" &&
        publication.projectId === project.id,
    );
    if (!isOwnedPublication) return NextResponse.json({
      error: "Este endereço não corresponde à publicação ativa deste projeto.",
    }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "A validação de propriedade do site está indisponível." }, { status: 503 });
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
    ownerId: userId,
    pages: project.liveEdits || {},
    extraSections: Object.fromEntries((["home","sobre","servicos","contato"] as const).map(key=>[key,validExtraSections(project.extraSections?.[key])])),
    images,
    updatedAt: new Date().toISOString(),
  });
  if (Buffer.byteLength(payload) > 17 * 1024 * 1024) {
    return NextResponse.json({ error: "Edições e imagens excedem o limite de publicação." }, { status: 413 });
  }
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
  return NextResponse.json({ ok: true, url: `${publicOrigin}/p/${match[1]}` });
}
