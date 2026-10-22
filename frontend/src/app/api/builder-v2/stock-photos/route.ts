import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const nicheTerms: Record<string,string> = {
  "Advocacia":"law office interior legal books desk",
  "Barbearia":"barbershop barber haircut interior",
  "Odontologia":"dentist dental clinic interior equipment",
  "Clínica médica":"medical clinic doctor office interior",
  "Psicologia":"psychologist therapy counseling office interior",
  "Fisioterapia":"physiotherapy rehabilitation clinic equipment",
  "Estética":"beauty salon skincare treatment interior",
  "Arquitetura":"architect interior design studio blueprints",
  "Imobiliária":"real estate modern home interior",
  "Restaurante":"restaurant kitchen dining interior food",
  "Cafeteria":"coffee shop barista interior",
  "Academia":"gym fitness equipment training",
  "Veterinária":"veterinary clinic dog veterinarian",
  "Salão de beleza":"hair salon hairstylist interior",
  "Pizzaria":"pizza restaurant oven cooking",
  "Confeitaria":"bakery pastry cakes display",
  "Contabilidade":"accounting office financial documents",
  "Fotografia":"photography studio camera equipment",
  "Oficina mecânica":"car mechanic garage repair",
  "Hotel":"hotel lobby hospitality interior",
};
const safeQuery=(value:string)=>value.replace(/[^\p{L}\p{N}\s-]/gu," ").trim().slice(0,90);
export async function POST(request:Request) {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Não autenticado"},{status:401});
  const key=process.env.PEXELS_API_KEY;
  if(!key)return NextResponse.json({error:"Banco fotográfico ainda não configurado",code:"PHOTOS_NOT_CONFIGURED"},{status:503});
  let body:{niche?:unknown};
  try{body=await request.json();}catch{return NextResponse.json({error:"Solicitação inválida"},{status:400});}
  if(typeof body.niche!=="string"||body.niche.length>90)return NextResponse.json({error:"Nicho inválido"},{status:400});
  const niche=safeQuery(body.niche);
  if(!niche)return NextResponse.json({error:"Nicho inválido"},{status:400});
  const query=nicheTerms[niche]||niche+" business workplace interior";
  try{
    const response=await fetch("https://api.pexels.com/v1/search?"+new URLSearchParams({query,per_page:"30",orientation:"landscape"}),{
      headers:{Authorization:key},cache:"no-store",signal:AbortSignal.timeout(12000)
    });
    if(!response.ok)throw Error("Pexels unavailable");
    const result=await response.json() as {photos?:Array<{id:number;alt?:string;url?:string;photographer?:string;src?:{large2x?:string;large?:string}}>} ;
    const seen=new Set<number>();
    const photos=(result.photos||[]).filter(p=>p.id&&p.src?.large&&!seen.has(p.id)&&!!seen.add(p.id)).slice(0,6).map((p,i)=>({
      role:["hero","services","team","environment","details","institutional"][i],
      src:p.src?.large2x||p.src?.large,
      alt:p.alt||"Fotografia real do setor de "+niche,
      source:p.url,
      credit:p.photographer||"",
      provider:"Pexels"
    }));
    if(photos.length!==6)return NextResponse.json({error:"Ainda não há seis fotografias adequadas para este nicho",code:"INSUFFICIENT_PHOTOS"},{status:422});
    return NextResponse.json({photos,niche});
  }catch{return NextResponse.json({error:"Não foi possível consultar fotografias reais agora"},{status:502});}
}
