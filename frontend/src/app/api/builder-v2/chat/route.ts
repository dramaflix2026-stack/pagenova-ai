import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(req: NextRequest) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({error:"Faça login."},{status:401});
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({error:"IA não configurada."},{status:503});
  const body = await req.json();
  if (typeof body.instruction !== "string" || body.instruction.length > 5000) return NextResponse.json({error:"Pedido inválido."},{status:400});
  const prompt = "Você é o editor de sites PageNova. O pedido do usuário sempre prevalece sobre o template. Crie um site completo com 10 a 14 seções relevantes quando solicitado. Em edições preserve o restante. Responda somente JSON com site e summary. site tem title, background e blocks; cada block tem id estável, type (heading, paragraph, button, image), text, color, align (left,center,right), src opcional e section opcional. Não invente URLs, avaliações ou depoimentos reais.";
  const input = JSON.stringify({instruction:body.instruction,site:body.site});
  if (input.length > 140000) return NextResponse.json({error:"Projeto grande demais."},{status:413});
  const response = await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
    body:JSON.stringify({model:"gpt-4.1-mini",response_format:{type:"json_object"},messages:[{role:"system",content:prompt},{role:"user",content:input}]}),
    signal:AbortSignal.timeout(75000)
  });
  if (!response.ok) return NextResponse.json({error:"A IA falhou. Nenhuma alteração foi aplicada."},{status:502});
  const data = await response.json();
  try {
    const output = JSON.parse(data.choices[0].message.content);
    if (!output.site || !Array.isArray(output.site.blocks) || output.site.blocks.length > 120 ||
      output.site.blocks.some((b:{id?:string;type?:string;text?:string;align?:string})=>!b.id || !["heading","paragraph","button","image"].includes(b.type||"") || typeof b.text !== "string" || !["left","center","right"].includes(b.align||""))) throw Error("invalid");
    return NextResponse.json(output);
  } catch { return NextResponse.json({error:"Resposta inválida da IA; projeto preservado."},{status:502}); }
}
