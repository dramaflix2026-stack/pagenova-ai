import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createClient as createAdminClient} from "@supabase/supabase-js";
import {timingSafeEqual} from "node:crypto";
export const runtime="nodejs";
export const maxDuration=60;
const MAX_BYTES=45_000_000;
const authorized=(v:string)=>{const a=Buffer.from(v),b=Buffer.from("12345678");return a.length===b.length&&timingSafeEqual(a,b)};
const getStorage=async()=>{const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;const url=process.env.NEXT_PUBLIC_SUPABASE_URL;return key&&url?createAdminClient(url,key,{auth:{persistSession:false}}):await createClient()};
import catalog from "@/lib/niche-photo-catalog.json";
const normalizeNiche=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const VALID_NICHES=new Set(Object.keys(catalog).map(normalizeNiche));
export async function POST(req:NextRequest){
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"Origem não autorizada."},{status:403});
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"Faça login para enviar vídeos."},{status:401});
 let form:FormData;
 try{form=await req.formData()}catch{return NextResponse.json({error:"Arquivo inválido."},{status:400})}
 const niche=form.get("niche"),device=form.get("device"),file=form.get("file"),password=form.get("password");
 if(typeof password!=="string"||!authorized(password))return NextResponse.json({error:"Senha incorreta."},{status:403});
 if(typeof niche!=="string"||!VALID_NICHES.has(normalizeNiche(niche))||!["desktop","mobile"].includes(String(device)))return NextResponse.json({error:"Nicho ou versão inválidos."},{status:422});
 if(!(file instanceof File)||file.size<1024||file.size>MAX_BYTES)return NextResponse.json({error:"Vídeo deve ter até 45 MB."},{status:413});
 if(file.type!=="video/mp4")return NextResponse.json({error:"Envie um vídeo MP4."},{status:415});
 const bytes=new Uint8Array(await file.arrayBuffer());
 const ascii=(start:number,length:number)=>String.fromCharCode(...bytes.slice(start,start+length));
 if(bytes.length<12||ascii(4,4)!=="ftyp")return NextResponse.json({error:"O arquivo não é um MP4 válido."},{status:415});
 const path="cinematic-library/"+normalizeNiche(niche)+"/"+device+"-"+crypto.randomUUID()+".mp4";
 const storage=await getStorage();
 const {error}=await storage.storage.from("site-images").upload(path,bytes,{contentType:"video/mp4",cacheControl:"31536000",upsert:false});
 if(error){console.error("[cinematic-upload]",error.message);return NextResponse.json({error:"Não foi possível enviar o vídeo. Confira as permissões e o limite do Storage."},{status:502})}
 const url=storage.storage.from("site-images").getPublicUrl(path).data.publicUrl;
 return NextResponse.json({url,niche,device,path});
}

export async function GET(req:NextRequest){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Não autenticado"},{status:401});
 const storage=await getStorage();
 const all=req.nextUrl.searchParams.get("all")==="1";
 const niche=normalizeNiche(req.nextUrl.searchParams.get("niche")||"hamburgueria");
 let names:string[];
 if(all){
  const root=await storage.storage.from("site-images").list("cinematic-library",{limit:1000});
  if(root.error)return NextResponse.json({error:"Falha ao consultar vídeos: "+root.error.message},{status:502});
  const folderNames=(root.data||[]).filter(f=>!f.id).map(f=>f.name);
  names=Array.from(new Set(folderNames));
 }else names=[niche];
 const results=await Promise.all(names.map(async name=>{
  const {data,error}=await storage.storage.from("site-images").list("cinematic-library/"+name,{limit:1000,sortBy:{column:"created_at",order:"desc"}});
  if(error)return [];
  return (data||[]).filter(f=>/^(desktop|mobile)-.*\.(mp4|webm)$/i.test(f.name)).map(f=>({niche:name,device:f.name.startsWith("desktop-")?"desktop":"mobile",url:storage.storage.from("site-images").getPublicUrl("cinematic-library/"+name+"/"+f.name).data.publicUrl}));
 }));
 const items=results.flat();
 if(all)return NextResponse.json({items});
 const matching=items.filter(i=>i.niche===niche);
 const videos:Record<string,string>={};
 for(const v of matching)if(!videos[v.device])videos[v.device]=v.url;
 return NextResponse.json({videos,niche});
}
