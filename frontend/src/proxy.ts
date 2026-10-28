import { createServerClient } from "@supabase/ssr";
import {createClient as createAdminClient} from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Custom domains are bound only to an authenticated user's real published
  // snapshot. Unverified/unknown hosts never receive another client's site.
  const host=(request.headers.get("host")||"").toLowerCase().split(":")[0];
  const customHost=Boolean(host&&host!=="pagenovaai.com.br"&&host!=="www.pagenovaai.com.br"&&
    host!=="localhost"&&host!=="127.0.0.1"&&!host.endsWith(".vercel.app")&&
    !host.endsWith(".pagenovaai.com.br"));
  if(customHost){
    // Customer domains serve the published homepage only. Never expose the
    // PageNova dashboard, login, API, or another published site on this host.
    if(request.nextUrl.pathname!=="/")return new NextResponse("Página não encontrada.",{status:404});
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key=process.env.SUPABASE_SECRET_KEY;
    if(!url||!key)return new NextResponse("Site indisponível.",{status:503});
    try{
      const admin=createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
      const {data,error}=await admin.from("pagenova_custom_domains")
        .select("slug").eq("domain",host).eq("state","active").maybeSingle();
      if(error)return new NextResponse("Site indisponível.",{status:503});
      if(!data?.slug)return new NextResponse("Domínio ainda não conectado.",{status:404});
      const destination=request.nextUrl.clone();
      destination.pathname="/site/"+encodeURIComponent(data.slug);
      destination.search="";
      return NextResponse.rewrite(destination);
    }catch{return new NextResponse("Falha temporária ao carregar este domínio.",{status:503});}
  }
  // Server-rendered document language for the localized public pages.
  // Existing Supabase route protection below remains unchanged.
  if(request.nextUrl.pathname==="/en"||request.nextUrl.pathname==="/es"){
    const requestHeaders=new Headers(request.headers);
    requestHeaders.set("x-pagenova-html-lang",request.nextUrl.pathname.slice(1));
    return NextResponse.next({request:{headers:requestHeaders}});
  }
  // Landing-only language detection. Preserve existing auth guards below.
  // The rest of the platform remains Portuguese until its own translations ship.
  if(request.nextUrl.pathname==="/"){
    const saved=request.cookies.get("pagenova_site_lang")?.value;
    if(!request.nextUrl.searchParams.has("lang")&&!request.nextUrl.searchParams.has("no_redirect")){
      const first=(request.headers.get("accept-language")||"").split(",")[0].trim().toLowerCase();
      const target=saved==="pt"?"pt":saved==="en"||saved==="es"?saved:first.startsWith("en")?"en":first.startsWith("es")?"es":"pt";
      if(target==="en"||target==="es"){
        const url=request.nextUrl.clone();
        url.pathname="/"+target;
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }
  // Hostname canonicalization belongs in Vercel's domain configuration.
  // Never redirect www to apex here: when Vercel redirects apex to www,
  // an application-level reverse redirect produces ERR_TOO_MANY_REDIRECTS.
  // Keep auth callback parameters and cookies on the hostname selected by Vercel.
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && pathname.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Keep bookmarks for existing Classic Builder projects intact. New Site
  // generation in PageNova Studio goes to the original Builder 2.0 component.
  if (user && pathname === "/app/builder" && !request.nextUrl.searchParams.get("project")) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/builder-v2";
    const redirected = NextResponse.redirect(url, 307);
    // Preserve Supabase session refresh cookies set above.
    response.cookies.getAll().forEach(cookie=>redirected.cookies.set(cookie));
    return redirected;
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/en",
    "/es",
    "/app/:path*",
    "/login",
    "/cadastro",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    // Cover customer-host routes as well as the homepage; Next internals and
    // static assets must bypass the database lookup.
    "/((?!api/|_next/|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
