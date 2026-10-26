import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";
export const maxDuration=60;
const MAX_BYTES=45_000_000;
const VALID_NICHES=new Set(["hamburgueria"]);
export async function POST(req:NextRequest){
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"Origem não autorizada."},{status:403});
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"Faça login para enviar vídeos."},{status:401});
 let form:FormData;
 try{form=await req.formData()}catch{return NextResponse.json({error:"Arquivo inválido."},{status:400})}
 const niche=form.get("niche"),device=form.get("device"),file=form.get("file");
 if(typeof niche!=="string"||!VALID_NICHES.has(niche)||!["desktop","mobile"].includes(String(device)))return NextResponse.json({error:"Nicho ou versão inválidos."},{status:422});
 if(!(file instanceof File)||file.size<1024||file.size>MAX_BYTES)return NextResponse.json({error:"Vídeo deve ter até 45 MB."},{status:413});
 if(file.type!=="video/mp4")return NextResponse.json({error:"Envie um vídeo MP4."},{status:415});
 const bytes=new Uint8Array(await file.arrayBuffer());
 const ascii=(start:number,length:number)=>String.fromCharCode(...bytes.slice(start,start+length));
 if(bytes.length<12||ascii(4,4)!=="ftyp")return NextResponse.json({error:"O arquivo não é um MP4 válido."},{status:415});
 const path=user.id+"/cinematic/"+niche+"/"+device+"-"+crypto.randomUUID()+".mp4";
 const {error}=await supabase.storage.from("site-images").upload(path,bytes,{contentType:"video/mp4",cacheControl:"31536000",upsert:false});
 if(error){console.error("[cinematic-upload]",error.message);return NextResponse.json({error:"Não foi possível enviar o vídeo. Confira as permissões e o limite do Storage."},{status:502})}
 const url=supabase.storage.from("site-images").getPublicUrl(path).data.publicUrl;
 return NextResponse.json({url,niche,device,path});
}

export async function GET(req:NextRequest){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Não autenticado"},{status:401});
 const niche=(req.nextUrl.searchParams.get("niche")||"hamburgueria").toLowerCase();
 if(!VALID_NICHES.has(niche))return NextResponse.json({videos:[]});
 const videos:Record<string,string>={};
 for(const device of ["desktop","mobile"]){
  const {data,error}=await supabase.storage.from("site-images").list(user.id+"/cinematic/"+niche,{limit:100,sortBy:{column:"created_at",order:"desc"}});
  if(error)continue;
  const item=data?.find(file=>file.name.startsWith(device+"-")&&file.name.endsWith(".mp4"));
  if(item)videos[device]=supabase.storage.from("site-images").getPublicUrl(user.id+"/cinematic/"+niche+"/"+item.name).data.publicUrl;
 }
 return NextResponse.json({videos,niche});
}
