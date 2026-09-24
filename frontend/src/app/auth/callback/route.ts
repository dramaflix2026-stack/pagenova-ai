import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeNext(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/app";
  }

  if (
    value === "/app" ||
    value.startsWith("/app/") ||
    value === "/reset-password"
  ) {
    return value;
  }

  return "/app";
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const tokenHash =
    url.searchParams.get("token_hash");

  const type =
    url.searchParams.get("type");

  const requestedNext =
    url.searchParams.get("next");

  const next =
    getSafeNext(requestedNext);

  const supabase =
    await createClient();

  if (code) {
    const { error } =
      await supabase.auth.exchangeCodeForSession(
        code
      );

    if (error) {
      return NextResponse.redirect(
        new URL(
          "/login?error=invalid_auth_link",
          url.origin
        )
      );
    }

    return NextResponse.redirect(
      new URL(next, url.origin)
    );
  }

  if (tokenHash && type) {
    const { error } =
      await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as
          | "invite"
          | "recovery"
          | "email"
          | "email_change"
          | "signup",
      });

    if (error) {
      return NextResponse.redirect(
        new URL(
          "/login?error=invalid_auth_link",
          url.origin
        )
      );
    }

    return NextResponse.redirect(
      new URL(next, url.origin)
    );
  }

  return NextResponse.redirect(
    new URL(
      "/login?error=invalid_auth_link",
      url.origin
    )
  );
}
