import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "pagenova-published-sites";
const PAGE_KEYS = new Set(["home", "sobre", "servicos", "contato"]);

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
