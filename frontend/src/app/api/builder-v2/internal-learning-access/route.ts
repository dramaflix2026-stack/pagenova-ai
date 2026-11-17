import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {isVerifiedInternalLearningAccount} from "@/lib/builder-v2-internal-learning-access.server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const privateHeaders={"Cache-Control":"private, no-store, max-age=0"};

export async function GET(){
  const supabase=await createClient();
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user){
    return NextResponse.json({enabled:false},{status:401,headers:privateHeaders});
  }
  const enabled=isVerifiedInternalLearningAccount(user);
  return NextResponse.json({enabled},{headers:privateHeaders});
}
