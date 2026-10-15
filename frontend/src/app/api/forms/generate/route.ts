import { NextRequest } from "next/server";
import { authorizedForms, errorsAsResponse, FormServiceError } from "@/lib/forms/server";
import { normalizeForm, type FormKind } from "@/lib/forms/schema";

export const runtime="nodejs";
export const maxDuration=60;
const SCHEMA={
  type:"object",additionalProperties:false,
  properties:{
    title:{type:"string"},description:{type:"string"},
    kind:{type:"string",enum:["leads","quiz","application","survey"]},
    fields:{type:"array",items:{
      type:"object",additionalProperties:false,
      properties:{
        label:{type:"string"},
        type:{type:"string",enum:["text","email","tel","textarea","select"]},
        required:{type:"boolean"},
        options:{type:"array",items:{type:"string"}},
      },
      required:["label","type","required","options"],
    }},
  },
  required:["title","description","kind","fields"],
} as const;
function outputText(value:unknown):string {
  const payload=value as {output_text?:string;output?:Array<{content?:Array<{text?:string;type?:string}>}>};
  if(typeof payload?.output_text==="string")return payload.output_text;
  return (payload?.output||[]).flatMap(item=>item.content||[])
    .filter(part=>part.type==="output_text"||part.type==="text")
    .map(part=>part.text||"").join("");
}
export async function POST(request:NextRequest) {
  try {
    await authorizedForms();
    const origin=request.headers.get("origin");
    if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    const body=await request.json().catch(()=>({})) as {prompt?:unknown};
    const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
    if(prompt.length<20||prompt.length>50000)throw new FormServiceError("Descreva seu formulário em pelo menos 20 caracteres (máximo técnico de 50 mil para processamento).");
    const apiKey=process.env.OPENAI_API_KEY;
    if(!apiKey)throw new FormServiceError("A geração por IA ainda não está configurada.",503);
    const model=process.env.PAGENOVA_FORMS_MODEL?.trim() || "gpt-4.1-mini";
    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({
        model,
        instructions:[
          "Você é um especialista em pesquisa e formulários de conversão em português brasileiro.",
          "Gere um formulário REALMENTE ADAPTADO ao pedido do usuário, com 4 a 8 perguntas objetivas e relevantes.",
          "Não acrescente perguntas de telefone, e-mail ou nome automaticamente a menos que o pedido peça cadastro, contato, aplicação ou captação de leads.",
          "Escolha tipos de respostas adequados. Em questões de select, 2 a 6 opções reais; nos demais tipos, options deve ser [].",
          "Não faça perguntas de senha, cartão, dados sensíveis de saúde, religião, etnia ou outros dados especiais.",
          "Títulos e descrições curtos, claros e voltados ao propósito solicitado; sem marketing enganoso.",
          "Não inclua código HTML nem instruções fora do JSON.",
        ].join("\n"),
        input:prompt,
        text:{format:{type:"json_schema",name:"pagenova_form",strict:true,schema:SCHEMA}},
        max_output_tokens:1700,
        store:false,
      }),
      signal:AbortSignal.timeout(48000),
    });
    const json=await response.json().catch(()=>({})) as {error?:{message?:string};usage?:{input_tokens?:number;output_tokens?:number}};
    if(!response.ok)throw new FormServiceError(
      "Não foi possível gerar as perguntas. "+(json.error?.message||"Tente novamente."),502);
    let parsed:unknown;
    try{parsed=JSON.parse(outputText(json));}
    catch{throw new FormServiceError("A IA não retornou perguntas válidas. Tente novamente.",502);}
    const raw=parsed as {title?:string;description?:string;kind?:FormKind;fields?:Array<Record<string,unknown>>};
    if(!Array.isArray(raw.fields))throw new FormServiceError("A IA não retornou perguntas.",502);
    const fields=raw.fields.slice(0,12).map((field,i)=>({...field,id:"q-"+(i+1)}));
    const form=normalizeForm({title:raw.title,description:raw.description,kind:raw.kind,
      fields,intent:prompt,whatsapp:""});
    return Response.json({form,usage:json.usage||null},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorsAsResponse(error);}
}
