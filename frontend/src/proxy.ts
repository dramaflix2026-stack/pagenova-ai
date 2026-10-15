import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // The invited user's PKCE code must be exchanged on the SAME hostname
  // where the subsequent password update and login run. Otherwise browser
  // auth cookies can be bound to www while the app runs on the apex domain.
  // Keep the full path and verification query intact.
  if (request.nextUrl.hostname.toLowerCase() === "www.pagenovaai.com.br") {
    const canonical = request.nextUrl.clone();
    canonical.hostname = "pagenovaai.com.br";
    return NextResponse.redirect(canonical, 307);
  }
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
    "/app/:path*",
    "/login",
    "/cadastro",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
  ],
};
