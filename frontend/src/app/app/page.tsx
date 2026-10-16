import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getPageNovaAccess } from "@/lib/trial/server";

export const dynamic="force-dynamic";
export default async function AppPage(){
  const session=await createClient();
  const {data:{user}}=await session.auth.getUser();
  if(!user?.email)redirect("/login");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)redirect("/access-required");
  const admin=createAdminClient(url!,key!,{auth:{persistSession:false,autoRefreshToken:false}});
  // Start only after verified Supabase email. Repeated visits never restart.
  const access=await getPageNovaAccess(admin,user,true);
  if(access.kind==="trial")redirect("/app/crm?view=sites-ia");
  if(access.kind==="none")redirect(access.reason==="expired"?"/trial-expired":"/access-required");
  redirect("/app/builder");
}
