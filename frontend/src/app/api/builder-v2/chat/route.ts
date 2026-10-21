import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(req: NextRequest) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({error:"Faça login."},{status:401});
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({error:"IA não configurada."},{status:503});
  let body: Record<string,unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({error:"Pedido inválido."},{status:400}); }
  if (typeof body.instruction !== "string" || body.instruction.length > 5000) return NextResponse.json({error:"Pedido inválido."},{status:400});
  const prompt = `Você é o motor de edição PageNova Builder 2.0. A instrução do usuário prevalece sobre o template. Retorne APENAS JSON válido {"site":{...},"summary":"..."}.
Esquema site: {"title":string,"background":cor CSS,"blocks":[{"id":string,"type":"heading"|"paragraph"|"button"|"image","text":string,"color":cor CSS,"align":"left"|"center"|"right","src"?:string,"section"?:string,"fontSize"?:number,"radius"?:number,"spacing"?:number}]}.
Cada bloco tem ID permanente; preserve IDs existentes. Em edição, modifique SOMENTE os elementos solicitados e mantenha rigorosamente todos os outros blocos, sua ordem e propriedades. Se o usuário pedir para trocar texto, substitua o texto exato do bloco correspondente. Se pedir cor, fonte/tamanho, espaçamento, alinhamento, botão, imagem ou reorganizar/adicionar/remover seção, execute nos blocos relevantes. Para mover uma seção, mova seus blocos em conjunto. Não se limite a modelos fixos. Cada seção pode ter layout hero, grid, split, banner, faq, gallery ou standard no primeiro bloco, além de background próprio. Escolha o layout pelo nicho e permita ao usuário alterá-lo pelo chat. Ao criar novo site, produza 10 a 14 seções relevantes, cada uma com um identificador section próprio, composição editorial de títulos curtos, descrições objetivas e CTAs adequados. Evite parágrafos enormes e repetitivos. Nunca invente endereço, telefone, e-mail, anos de experiência, depoimentos, profissionais, certificações ou URLs de imagens; deixe informações não fornecidas como texto editável indicando "A definir". Para imagens não disponíveis, use bloco image com src ausente e legenda explicativa, sem URL fictícia. Quando houver imagem de referência, analise-a para aplicar as alterações visuais ou textuais solicitadas; não alegue que substituiu uma imagem se não recebeu uma URL ou arquivo utilizável. O campo summary deve explicar brevemente a ação executada em português.`;
  const input = JSON.stringify({instruction:body.instruction,site:body.site});
  if (input.length > 140000) return NextResponse.json({error:"Projeto grande demais."},{status:413});
  const imageInput: string = typeof body.image === "string" ? body.image : "";
  const image = ["data:image/png;base64,","data:image/jpeg;base64,","data:image/webp;base64,"].some(prefix => imageInput.startsWith(prefix)) && imageInput.length < 3000000 ? imageInput : null;
  const userContent = image ? [{type:"text",text:input},{type:"image_url",image_url:{url:image,detail:"low"}}] : input;
  let response: Response;
  try { response = await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
    body:JSON.stringify({model:"gpt-4.1-mini",response_format:{type:"json_object"},messages:[{role:"system",content:prompt},{role:"user",content:userContent}]}),
    signal:AbortSignal.timeout(75000)
  }); } catch { return NextResponse.json({error:"Tempo esgotado. O projeto foi preservado."},{status:504}); }
  if (!response.ok) return NextResponse.json({error:"A IA falhou. Nenhuma alteração foi aplicada."},{status:502});
  const data = await response.json();
  try {
    const output = JSON.parse(data.choices[0].message.content);
    if (!output.site || !Array.isArray(output.site.blocks) || output.site.blocks.length > 120 ||
      output.site.blocks.some((b:{id?:string;type?:string;text?:string;align?:string})=>!b.id || !["heading","paragraph","button","image"].includes(b.type||"") || typeof b.text !== "string" || !["left","center","right"].includes(b.align||""))) throw Error("invalid");
    const incoming = output.site as {title?:string;background?:string;blocks:Array<{id:string;type:string;text:string;color?:string;align:string;src?:string;fontSize?:number;radius?:number;spacing?:number}>};
    if (typeof incoming.title !== "string" || typeof incoming.background !== "string" || new Set(incoming.blocks.map(b=>b.id)).size !== incoming.blocks.length || incoming.blocks.some(b=>typeof b.color !== "string" || (b.fontSize !== undefined && (typeof b.fontSize !== "number" || b.fontSize < 8 || b.fontSize > 120)) || (b.spacing !== undefined && (typeof b.spacing !== "number" || b.spacing < 0 || b.spacing > 120)))) throw Error("invalid");
    return NextResponse.json(output);
  } catch { return NextResponse.json({error:"Resposta inválida da IA; projeto preservado."},{status:502}); }
}
