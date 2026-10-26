import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";
export const maxDuration=45;
const BUCKET="site-images";
const MAX_FILE_BYTES=4_000_000;
const VALID_ID=/^[a-zA-Z0-9_-]{8,128}$/;
function imageType(bytes:Uint8Array):"image/jpeg"|"image/png"|"image/webp"|null{
  if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return "image/jpeg";
  if(bytes.length>=8&&bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes[4]===0x0d&&bytes[5]===0x0a&&bytes[6]===0x1a&&bytes[7]===0x0a)return "image/png";
  if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP")return "image/webp";
  return null;
}
export async function POST(req:NextRequest){
  const origin=req.headers.get("origin");
  if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"Origem não autorizada."},{status:403});
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Faça login para enviar fotos."},{status:401});
  let body:FormData;
  try{body=await req.formData();}catch{return NextResponse.json({error:"Arquivo inválido."},{status:400});}
  const projectId=body.get("projectId"),propertyId=body.get("propertyId"),file=body.get("file");
  if(typeof projectId!=="string"||!VALID_ID.test(projectId)||typeof propertyId!=="string"||!VALID_ID.test(propertyId)){
    return NextResponse.json({error:"Projeto ou imóvel inválido."},{status:422});
  }
  if(!(file instanceof File)||file.size<100||file.size>MAX_FILE_BYTES){
    return NextResponse.json({error:"Envie uma imagem de até 4 MB."},{status:413});
  }
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){
    return NextResponse.json({error:"Formato não suportado. Use JPG, PNG ou WebP."},{status:415});
  }
  const bytes=new Uint8Array(await file.arrayBuffer());
  const detected=imageType(bytes);
  if(detected!==file.type)return NextResponse.json({error:"O conteúdo do arquivo não corresponde ao formato declarado."},{status:415});
  const ext=detected==="image/jpeg"?"jpg":detected==="image/png"?"png":"webp";
  const objectPath=user.id+"/builder-v2/real-estate/"+projectId+"/"+propertyId+"/"+crypto.randomUUID()+"."+ext;
  const {error}=await supabase.storage.from(BUCKET).upload(objectPath,bytes,{contentType:detected,cacheControl:"31536000",upsert:false});
  if(error){
    console.error("[property-photo-upload]",error.message);
    return NextResponse.json({error:"Falha ao armazenar a foto. Nenhuma imagem foi associada ao imóvel."},{status:502});
  }
  const src=supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
  return NextResponse.json({src});
}
