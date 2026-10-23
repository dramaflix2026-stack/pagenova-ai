import { notFound } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { BuilderV2Site, type BuilderV2SiteData } from "@/components/builder-v2-site";
export const dynamic="force-dynamic";
export const metadata={robots:{index:false,follow:false}};
const BUCKET="pagenova-published-sites";
export default async function PublishedBuilderV2({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  if(!/^v2-[a-z0-9-]{5,80}$/.test(slug))notFound();
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)notFound();
  const admin=createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {data,error}=await admin.storage.from(BUCKET).download(slug+".json");
  if(error||!data)notFound();
  let payload:{version?:number;site?:BuilderV2SiteData};
  try{payload=JSON.parse(await data.text());}catch{notFound();}
  if(payload.version!==2||!payload.site||!Array.isArray(payload.site.blocks)||payload.site.blocks.length<4)notFound();
  return <main className="min-h-screen overflow-x-hidden bg-white"><BuilderV2Site site={payload.site} selectedNiche={payload.site.niche||""} publishedMode /></main>;
}
