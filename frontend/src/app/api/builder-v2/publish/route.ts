import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authorizedForms, errorsAsResponse } from "@/lib/forms/server";
import type { BuilderV2SiteData } from "@/components/builder-v2-site";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const BUCKET="pagenova-published-sites";

function slugify(value:string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,44)||"site";
}
async function ensureBucket(admin:Awaited<ReturnType<typeof authorizedForms>>["admin"]) {
  const {data}=await admin.storage.getBucket(BUCKET);
  if(data)return;
  const {error}=await admin.storage.createBucket(BUCKET,{
    public:false,fileSizeLimit:20*1024*1024,allowedMimeTypes:["application/json"]
  });
  if(error&&!/already exists/i.test(error.message))throw error;
}
type PublishInput={site?:BuilderV2SiteData};
export async function POST(request:NextRequest) {
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)
    return NextResponse.json({error:"Origem não autorizada."},{status:403});
  let access:Awaited<ReturnType<typeof authorizedForms>>;
  try{access=await authorizedForms();}
  catch(error){return errorsAsResponse(error);}
  const {admin,userId}=access;
  let body:PublishInput;
  try{body=await request.json() as PublishInput;}
  catch{return NextResponse.json({error:"Projeto inválido."},{status:400});}
  const site=body.site;
  if(!site||typeof site!=="object"||!Array.isArray(site.blocks)||
      typeof site.id!=="string"||site.id.length<8||site.id.length>128||
      typeof site.title!=="string"||!site.title.trim()||site.title.length>160||
      typeof site.background!=="string"||site.blocks.length<4||site.blocks.length>160||
      !site.blocks.some(b=>b.type==="heading")){
    return NextResponse.json({error:"Gere um site completo antes de publicar."},{status:422});
  }
  const ids=new Set<string>();
  for(const block of site.blocks){
    if(!block||typeof block.id!=="string"||!block.id||ids.has(block.id)||
        !["heading","paragraph","button","image"].includes(block.type)||
        typeof block.text!=="string"||block.text.length>12000||
        (block.section!==undefined&&typeof block.section!=="string")){
      return NextResponse.json({error:"O site contém um bloco inválido. A publicação foi cancelada."},{status:422});
    }
    ids.add(block.id);
  }
  const snapshot:BuilderV2SiteData=JSON.parse(JSON.stringify(site));
  delete snapshot.publishedUrl;
  const raw=JSON.stringify(snapshot);
  if(raw.length>1_800_000)return NextResponse.json({error:"O projeto excede o tamanho permitido."},{status:413});
  const suffix=site.id.replace(/[^a-zA-Z0-9]/g,"").slice(0,10).toLowerCase();
  const baseSlug=`v2-${slugify(site.title)}-${suffix}`;
  const scoped=createHash("sha256").update(userId+":"+site.id).digest("hex").slice(0,12);
  await ensureBucket(admin);
  const storage=admin.storage.from(BUCKET);
  let slug=baseSlug,upsert=false;
  for(let attempt=0;attempt<2;attempt++){
    const {data:existing,error:readError}=await storage.download(slug+".json");
    if(existing){
      let owned=false;
      try{
        const stored=JSON.parse(await existing.text()) as {ownerId?:string;projectId?:string;version?:number};
        owned=stored.version===2&&stored.ownerId===userId&&stored.projectId===site.id;
      }catch{}
      if(owned){upsert=true;break;}
      if(attempt===0){slug=baseSlug+"-"+scoped;continue;}
      return NextResponse.json({error:"Endereço público em uso. Não foi possível publicar."},{status:409});
    }
    if(readError&&!/not found|object not found|404/i.test(readError.message))
      return NextResponse.json({error:"Não foi possível verificar o endereço público."},{status:503});
    break;
  }
  const publishedAt=new Date().toISOString();
  const payload=JSON.stringify({version:2,ownerId:userId,projectId:site.id,name:site.title,site:snapshot,publishedAt});
  const {error}=await storage.upload(slug+".json",new Blob([payload],{type:"application/json"}),{
    contentType:"application/json",upsert,cacheControl:"0"
  });
  if(error)return NextResponse.json({error:"Falha ao publicar. Seu rascunho foi preservado."},{status:503});
  return NextResponse.json({slug,url:`${request.nextUrl.origin}/p/${slug}`,publishedAt});
}
