import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProductLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const email = user.email?.trim().toLowerCase();

  if (!email) {
    redirect("/access-required");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecret) {
    throw new Error("Supabase admin configuration is missing.");
  }

  const admin = createAdminClient(
    supabaseUrl,
    supabaseSecret,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  const { data: entitlement, error } = await admin
    .from("entitlements")
    .select("id")
    .eq("product", "pagenova-ai")
    .eq("status", "active")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[ACCESS] Entitlement lookup failed.", {
      code: error.code,
    });

    redirect("/access-required?error=entitlement_lookup");
  }

  if (!entitlement) {
    redirect("/access-required");
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <Sidebar />

      <div className="min-h-screen lg:pl-64">
        {children}
      </div>
    </div>
  );
}
