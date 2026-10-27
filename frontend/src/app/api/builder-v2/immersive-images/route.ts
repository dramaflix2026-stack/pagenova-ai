import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {timingSafeEqual} from "node:crypto";
export const runtime="nodejs";
const normalize=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const compare=(value:string)=>{const a=Buffer.from(value),b=Buffer.from("12345678");return a.length===b.length&&timingSafeEqual(a,b)};
export async function POST(req:NextRequest){
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"Origem não autorizada."},{status:403});
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Faça login."},{status:401});
 let form:FormData;try{form=await req.formData()}catch{return NextResponse.json({error:"Dados inválidos."},{status:400})}
 const password=form.get("password"),niche=form.get("niche"),device=form.get("device"),file=form.get("file");
 if(typeof password!=="string"||!compare(password))return NextResponse.json({error:"Senha incorreta."},{status:403});
 if(typeof niche!=="string"||!normalize(niche)||normalize(niche).length>80||!["desktop","mobile"].includes(String(device)))return NextResponse.json({error:"Nicho ou formato inválido."},{status:422});
 if(!(file instanceof File)||file.size<100||file.size>8_000_000)return NextResponse.json({error:"Imagem deve ter até 8 MB."},{status:413});
 const bytes=new Uint8Array(await file.arrayBuffer());
 const isPng=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
 const isJpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const isWebp=String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
 if(!isPng&&!isJpeg&&!isWebp)return NextResponse.json({error:"Use PNG, JPG ou WebP válidos."},{status:415});
 const ext=isWebp?"webp":isPng?"png":"jpg",type=isWebp?"image/webp":isPng?"image/png":"image/jpeg";
 const path=user.id+"/builder-v2/immersive-3d/"+normalize(niche)+"/"+device+"-"+crypto.randomUUID()+"."+ext;
 const {error}=await supabase.storage.from("site-images").upload(path,bytes,{contentType:type,upsert:false,cacheControl:"31536000"});
 if(error)return NextResponse.json({error:"Falha no Storage: "+error.message},{status:502});
 return NextResponse.json({url:supabase.storage.from("site-images").getPublicUrl(path).data.publicUrl,path});
}
export async function GET(req:NextRequest){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Faça login."},{status:401});
 const niche=normalize(req.nextUrl.searchParams.get("niche")||"padaria-e-confeitaria");
 const {data,error}=await supabase.storage.from("site-images").list(user.id+"/builder-v2/immersive-3d/"+niche,{limit:100,sortBy:{column:"created_at",order:"desc"}});
 if(error)return NextResponse.json({error:error.message},{status:502});
 const items=(data||[]).filter(x=>/^(desktop|mobile)-.*\.(webp|png|jpg)$/.test(x.name)).map(x=>({device:x.name.startsWith("desktop-")?"desktop":"mobile",url:supabase.storage.from("site-images").getPublicUrl(user.id+"/builder-v2/immersive-3d/"+niche+"/"+x.name).data.publicUrl}));
 return NextResponse.json({items});
}