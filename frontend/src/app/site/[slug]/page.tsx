import { notFound } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { BuilderV2Site, type BuilderV2SiteData } from "@/components/builder-v2-site";
import {PizzeriaTemplate,RestaurantSegmentTemplate} from "@/components/builder-v2-restaurant-templates";
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
  if(payload.version!==2||!payload.site||!Array.isArray(payload.site.blocks)||(payload.site.kind!=="restaurant"&&payload.site.blocks.length<4))notFound();
  const restaurant=payload.site.kind==="restaurant";
  const niche=payload.site.niche||"";
  const restaurantSite=payload.site as unknown as Parameters<typeof PizzeriaTemplate>[0]["site"];
  const menu=Array.isArray((restaurantSite.restaurant||{}).menu)?restaurantSite.restaurant!.menu:[];
  const pizza=/pizza|pizzaria/i.test(niche)||menu.filter(item=>/pizza|mussarela|calabresa|portuguesa|pepperoni|catupiry|marguerita|quatro queijos/i.test(item.name+" "+item.category)).length>=Math.max(2,Math.ceil(menu.length/2));
  return <main className="min-h-screen overflow-x-hidden bg-white">{restaurant?(pizza?<PizzeriaTemplate site={restaurantSite} segment={niche||"Pizzaria"}/>:<RestaurantSegmentTemplate site={restaurantSite} segment={niche||"Restaurante"}/>):<BuilderV2Site site={payload.site} templateId={payload.site.templateId||"institutional-complete"} selectedNiche={niche} publishedMode />}</main>;
}
