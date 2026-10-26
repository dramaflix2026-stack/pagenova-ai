import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export const runtime="nodejs";
export const maxDuration=45;
const MAX_BYTES=8_000_000;
const VALID_ID=/^[a-zA-Z0-9_-]{8,128}$/;
const MIME_TYPES=["image/jpeg","image/png","image/webp"] as const;
function sniff(bytes:Uint8Array){
  if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return "image/jpeg";
  if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return "image/png";
  if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP")return "image/webp";
  return null;
}
export async function POST(req:NextRequest){
  const origin=req.headers.get("origin");
  if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"Origem não autorizada."},{status:403});
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Faça login para enviar fotografias."},{status:401});
  let form:FormData;
  try{form=await req.formData();}catch{return NextResponse.json({error:"Anexo inválido."},{status:400});}
  const projectId=form.get("projectId"),file=form.get("file");
  if(typeof projectId!=="string"||!VALID_ID.test(projectId))
    return NextResponse.json({error:"Projeto inválido."},{status:422});
  if(!(file instanceof File)||file.size<100||file.size>MAX_BYTES)
    return NextResponse.json({error:"Envie uma fotografia JPG, PNG ou WebP de até 8 MB."},{status:413});
  if(!MIME_TYPES.includes(file.type as typeof MIME_TYPES[number]))
    return NextResponse.json({error:"Formato não permitido."},{status:415});
  const bytes=new Uint8Array(await file.arrayBuffer());
  const detected=sniff(bytes);
  if(!detected||detected!==file.type)return NextResponse.json({error:"O conteúdo do arquivo não corresponde ao tipo declarado."},{status:415});
  const ext=detected==="image/jpeg"?"jpg":detected==="image/png"?"png":"webp";
  const path=user.id+"/builder-v2/institutional/"+projectId+"/"+crypto.randomUUID()+"."+ext;
  const {error}=await supabase.storage.from("site-images").upload(path,bytes,{
    contentType:detected,cacheControl:"31536000",upsert:false
  });
  if(error){
    console.error("[builder-v2-assets]",error.message);
    return NextResponse.json({error:"Não foi possível salvar a imagem. O site foi preservado."},{status:502});
  }
  const src=supabase.storage.from("site-images").getPublicUrl(path).data.publicUrl;
  return NextResponse.json({src});
}
