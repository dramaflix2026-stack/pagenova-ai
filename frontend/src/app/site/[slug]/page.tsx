import { notFound } from "next/navigation";
import {headers} from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { BuilderV2Site, type BuilderV2SiteData } from "@/components/builder-v2-site";
import {RealEstateTemplate} from "@/components/builder-v2-real-estate";
import {PizzeriaTemplate,RestaurantSegmentTemplate} from "@/components/builder-v2-restaurant-templates";
export const dynamic="force-dynamic";
// Public /site/<slug> and /p/<slug> previews are deliberately non-indexable.
// Only a verified customer-owned custom hostname is allowed to be indexed.
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const host=((await headers()).get("host")||"").toLowerCase().split(":")[0];
  if(!host||host==="pagenovaai.com.br"||host==="www.pagenovaai.com.br"||
     host.endsWith(".vercel.app")||host==="localhost")
    return {robots:{index:false,follow:false}};
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)return {robots:{index:false,follow:false}};
  const admin=createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data}=await admin.from("pagenova_custom_domains")
    .select("slug").eq("domain",host).eq("slug",slug).eq("state","active").maybeSingle();
  if(!data)return {robots:{index:false,follow:false}};
  const {data:publication}=await admin.from("pagenova_site_publications")
    .select("title").eq("slug",slug).maybeSingle();
  return {title:publication?.title||"Site profissional",robots:{index:true,follow:true},
    alternates:{canonical:"https://"+host+"/"}};
}
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
  // Legacy AI/marketing briefings may have been published without templateId.
  // Recover TP5 only for unmistakable AI/technology niches, leaving every
  // explicitly selected template and all other published sites untouched.
  const tp5LegacyNiche=/(?:intelig[eê]ncia artificial|automa[cç][aã]o|marketing digital|ag[eê]ncia de marketing|neg[oó]cios digitais|agentes? de ia|desenvolvimento de software|empresa de tecnologia|saas|startup)/i.test(niche);
  // Targeted recovery for the confirmed legacy Nexora TP5 publication.
  // Its saved templateId can incorrectly be "institutional-complete".
  // Do not override any other published project's explicit template selection.
  const isNexoraTp5Publication=slug==="v2-nexora-intelligence-cbbcc0ec1c";
  const publishedTemplateId=isNexoraTp5Publication?"prompt-adaptive":
    payload.site.briefingLayoutVariant?"prompt-adaptive":
    payload.site.templateId||(tp5LegacyNiche?"prompt-adaptive":"institutional-complete");
  const publishedSite=isNexoraTp5Publication?{
    ...payload.site,
    templateId:"prompt-adaptive" as const,
    niche:"Inteligência artificial",
  }:payload.site;
  return <main className="min-h-screen overflow-x-hidden bg-white">{payload.site.kind==="real-estate"?<RealEstateTemplate properties={payload.site.properties||[]} whatsapp={payload.site.realEstateWhatsapp||""} footer={payload.site.footer}/>:restaurant?(pizza?<PizzeriaTemplate site={restaurantSite} segment={niche||"Pizzaria"}/>:<RestaurantSegmentTemplate site={restaurantSite} segment={niche||"Restaurante"}/>):<BuilderV2Site site={publishedSite} templateId={publishedTemplateId} selectedNiche={niche} publishedMode />}</main>;
}
