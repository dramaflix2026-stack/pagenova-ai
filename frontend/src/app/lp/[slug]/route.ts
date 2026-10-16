import { NextRequest,NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderLandingHtml, type LandingProject } from "@/lib/landing/engine";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(_request:NextRequest,context:{params:Promise<{slug:string}>}){
 const {slug}=await context.params;
 if(!/^lp-[a-f0-9]{32}$/.test(slug))return new NextResponse("Página não encontrada.",{status:404});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)return new NextResponse("Publicação indisponível.",{status:503});
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await admin.storage.from("pagenova-published-sites").download("landings/"+slug+".json");
 if(error||!data)return new NextResponse("Página não encontrada.",{status:404});
 try{
  const entry=JSON.parse(await data.text()) as {version?:number;html?:string;project?:LandingProject};
  if(entry.version!==1||entry.project?.publishedSlug!==slug||typeof entry.html!=="string"||entry.html.length>3_500_000)throw Error("invalid");
  // Legacy published snapshots may contain a contact form without explicit
  // consent. Re-render only those snapshots with the fixed consent-aware
  // renderer; retain existing HTML byte-for-byte for current publications.
  const html=entry.html.includes('name="consent"')
    ?entry.html:renderLandingHtml(entry.project);
  return new NextResponse(html,{status:200,headers:{
    "content-type":"text/html; charset=utf-8","cache-control":"public,max-age=0,must-revalidate",
    "x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin",
    "content-security-policy":"default-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  }});
 }catch{return new NextResponse("Publicação inválida.",{status:500});}
}
