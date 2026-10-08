import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "pagenova-published-sites";
const PAGE_KEYS = new Set(["home", "sobre", "servicos", "contato"]);

function crmUpstream() {
  return process.env.PAGENOVA_CRM_UPSTREAM?.trim().replace(/\/+$/, "") || "";
}

async function publishedOverlay(slug: string, page: string) {
  try {
    const admin = adminClient();
    const { data, error } = await admin.storage.from(BUCKET).download(`overlays/${slug}.json`);
    if (error || !data) return "";
    const raw = await data.text();
    if (raw.length > 18 * 1024 * 1024) return "";
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.version !== 1) return "";
    const config = JSON.stringify({ ...parsed, page }).replace(/</g, "\\u003c");
    return `<script>window.__PAGENOVA_PUBLISHED_OVERLAY__=${config};</script><script src="/pagenova-published-overlay.js" defer></script>`;
  } catch { return ""; }
}

async function railwayPublishedSite(slug: string, path: string[] | undefined) {
  const upstream = crmUpstream();
  if (!upstream) return null;

  const suffix = [slug, ...(path || [])].map(encodeURIComponent).join("/");
  const target = new URL(`${upstream}/p/${suffix}`);

  try {
    const response = await fetch(target, {
      method: "GET",
      cache: "no-store",
      redirect: "manual",
      headers: { accept: "*/*" },
    });

    // 404 means this slug is not a Railway publication. Keep the old
    // Supabase publication path as a compatibility fallback for legacy sites.
    if (response.status === 404) return null;

    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    const cacheControl = response.headers.get("cache-control");
    const robots = response.headers.get("x-robots-tag");
    if (contentType) headers.set("content-type", contentType);
    headers.set("cache-control", cacheControl || "public, max-age=0, must-revalidate");
    headers.set("x-robots-tag", robots || "noindex, nofollow, noarchive");

    if (response.ok && (contentType || "").includes("text/html")) {
      const overlay = await publishedOverlay(slug, path?.[0] || "home");
      if (overlay) {
        const html = await response.text();
        const output = /<\\/body>/i.test(html)
          ? html.replace(/<\\/body>/i, overlay + "</body>")
          : html + overlay;
        headers.delete("content-length");
        return new NextResponse(output, { status: response.status, headers });
      }
    }
    return new NextResponse(response.body, { status: response.status, headers });
  } catch {
    // Railway temporarily unavailable: legacy sites must keep working.
    return null;
  }
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase admin configuration is missing.");
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function publicHtml(html: string, slug: string) {
  const base = "/p/" + encodeURIComponent(slug);
  const navigation =
    "<script>document.addEventListener('click',function(event){" +
    "var link=event.target&&event.target.closest?event.target.closest('[data-page]'):null;" +
    "if(!link)return;var key=link.getAttribute('data-page');if(!key)return;" +
    "event.preventDefault();event.stopImmediatePropagation();" +
    "window.location.href=key==='home'?" + JSON.stringify(base) + ":" + JSON.stringify(base + "/") + "+encodeURIComponent(key);" +
    "},true);<\/script>";
  return html.replace(/<\/body>/i, navigation + "</body>");
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string; path?: string[] }> },
) {
  const { slug, path } = await context.params;
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) {
    return new NextResponse("Pagina nao encontrada.", { status: 404 });
  }

  // New Sites com IA are published and stored by Railway. Proxy the public
  // artifact through the PageNova domain so preview and publication use the
  // exact same renderer/config. This also proxies nested image assets.
  const railway = await railwayPublishedSite(slug, path);
  if (railway) return railway;

  // Compatibility only: publications created by the old builder still live
  // in Supabase and use the historical multi-page keys below.
  const pageKey = path?.[0] || "home";
  if ((path?.length ?? 0) > 1 || !PAGE_KEYS.has(pageKey)) {
    return new NextResponse("Pagina nao encontrada.", { status: 404 });
  }

  const admin = adminClient();
  const { data, error } = await admin.storage.from(BUCKET).download(slug + ".json");
  if (error || !data) return new NextResponse("Pagina nao encontrada.", { status: 404 });

  let payload: { pages?: Record<string, string> };
  try {
    payload = JSON.parse(await data.text()) as { pages?: Record<string, string> };
  } catch {
    return new NextResponse("Pagina indisponivel.", { status: 500 });
  }

  const html = payload.pages?.[pageKey];
  if (!html) return new NextResponse("Pagina nao encontrada.", { status: 404 });

  return new NextResponse(publicHtml(html, slug), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "content-security-policy":
        "default-src 'self' data: blob: https:; img-src 'self' data: blob: https:; " +
        "style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:; " +
        "script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'",
    },
  });
}
