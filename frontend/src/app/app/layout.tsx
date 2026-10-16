import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";
import { getPageNovaAccess } from "@/lib/trial/server";
import Link from "next/link";

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

  let access:Awaited<ReturnType<typeof getPageNovaAccess>>;
  try { access=await getPageNovaAccess(admin,user,true); }
  catch { redirect("/access-required?error=entitlement_lookup"); }
  if(access.kind==="none"){
    redirect(access.reason==="expired"?"/trial-expired":"/access-required");
  }
  const trial=access.kind==="trial"?access.trial:undefined;
  const expires=trial?.expiresAt?new Date(trial.expiresAt):null;
  const daysLeft=expires?Math.max(0,Math.ceil((expires.getTime()-Date.now())/86400000)):0;

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <Sidebar />

      <div className="min-h-screen lg:pl-64">
        {trial&&<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-emerald-400/20 bg-[#123126] px-4 py-3 text-center text-xs text-white/85">
          <strong className="text-emerald-200">Teste grátis de 5 dias · {daysLeft} {daysLeft===1?"dia restante":"dias restantes"}</strong>
          <span>{trial.sitesRemaining??0}/2 sites · {trial.googleRemaining??0}/5 pesquisas Google disponíveis</span>
          <Link href="/app/creditos" className="font-bold text-emerald-200 underline underline-offset-2">Ver meu teste</Link>
          <a href="https://pay.kiwify.com.br/a13pNpS" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#36d9a1] px-3 py-2 font-extrabold text-[#062018]">Assinar R$ 147/mês</a>
        </div>}
        {children}
      </div>
    </div>
  );
}
