import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

// This is a private, server-only allowlist. Never trust a client-provided email,
// role or user_metadata value to enable the internal learning dashboard.
const INTERNAL_LEARNING_OWNER_ID="01cadff1-1bff-4075-8354-a61b51ecd0eb";
const INTERNAL_LEARNING_OWNER_EMAIL="giovanesornoqui@hotmail.com";
const privateHeaders={"Cache-Control":"private, no-store, max-age=0"};

export async function GET(){
  const supabase=await createClient();
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user){
    return NextResponse.json({enabled:false},{status:401,headers:privateHeaders});
  }
  const enabled=user.id===INTERNAL_LEARNING_OWNER_ID&&
    user.email?.trim().toLowerCase()===INTERNAL_LEARNING_OWNER_EMAIL&&
    !!user.email_confirmed_at;
  return NextResponse.json({enabled},{headers:privateHeaders});
}
