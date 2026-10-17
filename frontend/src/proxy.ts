import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
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
  ],
};
