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

  // Invitation and recovery links must open the password setup screen, even
  // if the email template did not include an explicit next parameter.
  const next = requestedNext
    ? getSafeNext(requestedNext)
    : type === "invite" || type === "recovery"
      ? "/reset-password"
      : "/app";

  if (url.searchParams.get("error")) {
    return NextResponse.redirect(new URL("/login?error=invalid_auth_link", url.origin));
  }

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
    const allowedTypes = ["invite", "recovery", "email", "email_change", "signup"] as const;
    if (!allowedTypes.some((value) => value === type)) {
      return NextResponse.redirect(new URL("/login?error=invalid_auth_link", url.origin));
    }
    const { error } =
      await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as (typeof allowedTypes)[number],
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
