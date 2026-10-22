import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PhotoBankClient from "./photo-bank-client";
export const dynamic="force-dynamic";
export default async function PhotoBankPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const allowed=(process.env.PAGENOVA_PHOTO_ADMIN_EMAILS||"").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
 if(user.app_metadata?.role!=="admin" && !allowed.includes((user.email||"").toLowerCase()))redirect("/app/builder-v2");
 return <PhotoBankClient/>;
}
