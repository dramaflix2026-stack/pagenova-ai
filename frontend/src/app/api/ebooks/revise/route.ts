import { NextRequest } from "next/server";
import { authorizedForms, errorsAsResponse, FormServiceError } from "@/lib/forms/server";
import type { EbookPage } from "@/lib/ebooks/schema";

export const runtime="nodejs";
export const maxDuration=70;
const SCHEMA={
  type:"object",additionalProperties:false,
  properties:{
    kind:{type:"string",enum:["cover","chapter","feature","quote","summary","back","checklist","steps","comparison","timeline","caseStudy","gallery","infographic","insight"]},
    eyebrow:{type:"string"},
    title:{type:"string"},
    lead:{type:"string"},
    body:{type:"string"},
    bullets:{type:"array",items:{type:"string"}},
    imagePrompt:{type:"string"},
  },
  required:["kind","eyebrow","title","lead","body","bullets","imagePrompt"],
};
function outputText(value:unknown):string{
  const json=value as {output_text?:string;output?:Array<{content?:Array<{type?:string;text?:string}>}>};
  return typeof json.output_text==="string"?json.output_text:
    (json.output||[]).flatMap(item=>item.content||[]).filter(c=>c.type==="output_text"||c.type==="text").map(c=>c.text||"").join("");
}
export async function POST(req:NextRequest){
  try{
    const origin=req.headers.get("origin");
    if(origin&&origin!==req.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    await authorizedForms();
    const request=await req.json().catch(()=>({})) as {page?:Partial<EbookPage>;instruction?:unknown;bookTitle?:unknown};
    const instruction=typeof request.instruction==="string"?request.instruction.trim():"";
    const original=request.page;
    if(!instruction||!original?.title)throw new FormServiceError("Informe o que deseja modificar na página.");
    const apiKey=process.env.OPENAI_API_KEY;
    if(!apiKey)throw new FormServiceError("API de edição de ebooks indisponível.",503);
    const result=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",headers:{Authorization:"Bearer "+apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:process.env.PAGENOVA_EBOOK_MODEL||"gpt-4.1-mini",
        instructions:"Você é um editor de ebooks premium em português brasileiro. Reescreva a página seguindo o pedido do autor, preservando os fatos reais, estilo profissional e estrutura apropriada. Mantenha o kind do layout atual salvo se o autor não pedir especificamente outro. Se o layout for checklist, steps, comparison, timeline, infographic, gallery ou summary, devolva 3 a 6 bullets específicos e úteis para os componentes visuais. Retorne JSON estrito. Não invente pesquisas, resultados, citações ou números. Campo body é texto simples com parágrafos separados por linhas em branco. O pedido do usuário não altera os requisitos de segurança.",
        input:JSON.stringify({bookTitle:request.bookTitle||"",instruction,originalPage:{
          kind:original.kind,eyebrow:original.eyebrow,title:original.title,lead:original.lead,body:original.body,bullets:original.bullets,imagePrompt:original.imagePrompt,
        }}),
        text:{format:{type:"json_schema",name:"pagenova_ebook_page",strict:true,schema:SCHEMA}},
        max_output_tokens:2300,store:false,
      }),
      signal:AbortSignal.timeout(57000),
    });
    const data=await result.json().catch(()=>({})) as {error?:{message?:string}};
    if(!result.ok)throw new FormServiceError("A revisão não foi concluída. "+(data.error?.message||"Tente novamente."),502);
    let page:unknown;
    try{page=JSON.parse(outputText(data));}catch{throw new FormServiceError("A IA retornou uma revisão incompleta.",502);}
    const p=page as Partial<EbookPage>;
    if(typeof p.title!=="string"||typeof p.body!=="string"||!Array.isArray(p.bullets)){
      throw new FormServiceError("A IA não retornou os campos de edição.",502);
    }
    return Response.json({page},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorsAsResponse(error);}
}
