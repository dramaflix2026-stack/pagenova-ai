import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PhotoBankClient from "./photo-bank-client";
export const dynamic="force-dynamic";
export default async function PhotoBankPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const allowed=["giovanevfs@outlook.com"];
 if(user.app_metadata?.role!=="admin" && !allowed.includes((user.email||"").toLowerCase()))redirect("/app/builder-v2");
 return <PhotoBankClient/>;
}
