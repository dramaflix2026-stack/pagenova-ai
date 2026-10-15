import {NextRequest} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{slug:string}>};
export async function GET(_req:NextRequest,context:Context){
 const {slug}=await context.params;
 if(!/^c-[a-f0-9]{32}$/.test(slug))
   return new Response("Página não encontrada.",{status:404});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,secret=process.env.SUPABASE_SECRET_KEY;
 if(!url||!secret)return new Response("Publicação indisponível.",{status:503});
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await admin.storage.from("pagenova-published-sites")
   .download("published-clones/"+slug+".json");
 if(error||!data)return new Response("Página não encontrada.",{status:404});
 let html="";
 try{
   const parsed=JSON.parse(await data.text()) as {content?:unknown;publishedAt?:unknown};
   html=typeof parsed.content==="string"?parsed.content:"";
 }catch{return new Response("Publicação inválida.",{status:502});}
 if(!html)return new Response("Publicação indisponível.",{status:503});
 return new Response(html,{status:200,headers:{
   "Content-Type":"text/html; charset=utf-8",
   "Cache-Control":"public, max-age=60, stale-while-revalidate=180",
   "X-Content-Type-Options":"nosniff",
   "Referrer-Policy":"no-referrer",
   "X-Frame-Options":"DENY",
   "X-Robots-Tag":"noindex, nofollow",
   "Content-Security-Policy":"sandbox allow-top-navigation-by-user-activation; default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src https: data:; script-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'"
 }});
}