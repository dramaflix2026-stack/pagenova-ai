import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { creditGateEnabled } from "@/lib/credits/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

// Server-to-server job settlement from the Railway CRM worker.
// Authentication is an HMAC over job ID, terminal state and timestamp.
// No browser may settle another subscriber's credit.
export async function POST(request:NextRequest){
  if(!creditGateEnabled())return NextResponse.json({ok:true,ignored:"meter_inactive"});
  const secret=process.env.PAGENOVA_SSO_SECRET?.trim();
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SECRET_KEY;
  if(!secret||secret.length<32||!url||!key)
    return NextResponse.json({error:"server_configuration_missing"},{status:503});
  const supplied=request.headers.get("x-pagenova-credit-signature")||"";
  const raw=await request.text();
  if(raw.length>1024)return NextResponse.json({error:"payload_too_large"},{status:413});
  let payload:{jobId?:string;status?:string;timestamp?:number};
  try{payload=JSON.parse(raw);}catch{return NextResponse.json({error:"invalid_json"},{status:400});}
  const jobId=typeof payload.jobId==="string"?payload.jobId:"";
  const status=payload.status;
  const timestamp=Number(payload.timestamp);
  if(!/^[a-zA-Z0-9_-]{8,100}$/.test(jobId)||!["SUCCEEDED","FAILED","CANCELED"].includes(status||"")
    ||!Number.isSafeInteger(timestamp)||Math.abs(Date.now()-timestamp)>300_000){
    return NextResponse.json({error:"invalid_event"},{status:400});
  }
  const expected=createHmac("sha256",secret)
    .update([jobId,status,timestamp].join("\n")).digest("hex");
  const provided=Buffer.from(supplied,"utf8");
  const valid=Buffer.from(expected,"utf8");
  if(provided.length!==valid.length||!timingSafeEqual(provided,valid)){
    return NextResponse.json({error:"unauthorized"},{status:401});
  }
  const admin=createClient(url,key,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  });
  const {data,error}=await admin.rpc("pagenova_credits_settle_job_callback",{
    p_job_id:jobId,p_success:status==="SUCCEEDED",
  });
  if(error){
    console.error("[PageNova Credits] worker settlement RPC failed",{code:error.code});
    return NextResponse.json({error:"settlement_failed"},{status:503});
  }
  const result=data as {found?:boolean};
  if(result?.found===false){
    // The worker may finish before the initial enqueue proxy attaches the
    // job ID to the reservation. Railway retries this signed notification.
    return NextResponse.json({error:"reservation_not_attached_yet"},{status:503});
  }
  return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
