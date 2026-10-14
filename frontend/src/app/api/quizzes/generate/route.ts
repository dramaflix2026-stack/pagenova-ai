import {NextRequest} from "next/server";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";
import {normalizeQuiz} from "@/lib/quizzes/schema";

export const runtime="nodejs";export const maxDuration=80;
const schema={
  type:"object",additionalProperties:false,
  properties:{
    title:{type:"string"},subtitle:{type:"string"},
    theme:{type:"string",enum:["emerald","midnight","cream"]},
    collectLeads:{type:"boolean"},
    outcomes:{type:"array",items:{
      type:"object",additionalProperties:false,
      properties:{id:{type:"string"},title:{type:"string"},description:{type:"string"},
        ctaLabel:{type:"string"},ctaUrl:{type:"string"}},
      required:["id","title","description","ctaLabel","ctaUrl"],
    }},
    questions:{type:"array",items:{
      type:"object",additionalProperties:false,
      properties:{id:{type:"string"},title:{type:"string"},
        options:{type:"array",items:{
          type:"object",additionalProperties:false,
          properties:{id:{type:"string"},label:{type:"string"},outcomeId:{type:"string"}},
          required:["id","label","outcomeId"],
        }}},
      required:["id","title","options"],
    }},
  },
  required:["title","subtitle","theme","collectLeads","outcomes","questions"],
};
function getText(raw:unknown):string{
  const val=raw as {output_text?:string;output?:Array<{content?:Array<{type?:string;text?:string}>}>};
  if(typeof val?.output_text==="string")return val.output_text;
  return (val?.output||[]).flatMap(a=>a.content||[])
    .filter(x=>x.type==="output_text"||x.type==="text").map(x=>x.text||"").join("");
}
export async function POST(req:NextRequest){
  try{
    const origin=req.headers.get("origin");
    if(origin&&origin!==req.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    await authorizedForms();
    const text=await req.text();
    if(text.length>85000)throw new FormServiceError("Pedido de quiz muito extenso.",413);
    const body=JSON.parse(text) as {prompt?:unknown;existing?:unknown};
    const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
    if(prompt.length<12||prompt.length>10000)throw new FormServiceError("Descreva o quiz com pelo menos 12 caracteres.");
    const existing=body.existing?normalizeQuiz(body.existing):null;
    const apiKey=process.env.OPENAI_API_KEY;
    if(!apiKey)throw new FormServiceError("A IA de geração de quizzes ainda não está configurada.",503);
    const model=process.env.PAGENOVA_QUIZ_MODEL?.trim()||"gpt-4.1-mini";
    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",headers:{Authorization:"Bearer "+apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({
        model,store:false,
        instructions:[
          "Você é um designer especialista em QUIZZES INTERATIVOS de alta qualidade e conversão, em português brasileiro.",
          "Crie quizzes completos, específicos ao público e ao pedido. Não entregue um formulário genérico.",
          "Gere entre 5 e 8 perguntas (se o usuário pedir outro número, aceite de 3 a 15), cada uma com 3 ou 4 opções curtas e coerentes.",
          "Crie exatamente 3 perfis/resultados atraentes, com textos específicos e acionáveis, não diagnósticos clínicos.",
          "Os resultados devem ter ids ÚNICOS 'perfil-a', 'perfil-b' e 'perfil-c'.",
          "Distribua outcomeId das opções entre os três perfis de forma equilibrada e relevante, nunca com mapeamento automático por posição.",
          "Os ids das perguntas devem ser 'q1', 'q2' etc; os ids das opções 'o1', 'o2' etc (reiniciam por pergunta).",
          "O quiz deve funcionar: opções associadas a resultados existentes, resultados coerentes com todas as respostas.",
          "Use CTAs claros. Use URL apenas se o usuário informar uma URL HTTPS válida; caso contrário, ctaUrl deve ser ''.",
          "collectLeads é verdadeiro somente se o usuário pedir captura de contatos, nome/e-mail ou leads; caso contrário falso.",
          "Não peça telefone, informações financeiras, dados de saúde sensíveis nem outros dados pessoais de categoria especial nas perguntas.",
          "Não crie promessas de resultados garantidos, alegações médicas ou avaliação psicológica diagnóstica.",
          "Não insira frases em inglês, HTML nem Markdown dentro dos valores.",
          existing
            ?"Há um quiz anterior fornecido. Reformule APENAS o que o último pedido do usuário solicita, preservando os demais detalhes, título e lógica que continuam aplicáveis."
            :"Crie um quiz novo. Não interrompa para fazer perguntas de volta.",
        ].join("\n"),
        input:existing
          ?"QUIZ ATUAL:\n"+JSON.stringify(existing)+"\n\nPEDIDO DE REVISÃO:\n"+prompt
          :"BRIEFING DO USUÁRIO:\n"+prompt,
        text:{format:{type:"json_schema",name:"pagenova_quiz",strict:true,schema}},
        max_output_tokens:6500,
      }),
      signal:AbortSignal.timeout(68000),
    });
    const output=await response.json().catch(()=>({})) as {error?:{message?:string};usage?:unknown};
    if(!response.ok)throw new FormServiceError("A IA não concluiu o quiz. "+(output.error?.message||"Tente novamente."),502);
    let parsed:unknown;
    try{parsed=JSON.parse(getText(output));}
    catch{throw new FormServiceError("A IA não retornou o quiz completo. Tente novamente.",502);}
    let quiz;
    try{quiz=normalizeQuiz({...parsed as object,prompt:existing?.prompt||prompt});}
    catch(e){throw new FormServiceError("O quiz gerado precisa de ajustes: "+(e instanceof Error?e.message:"resposta inválida"),502);}
    return Response.json({quiz,usage:output.usage||null},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorsAsResponse(e);}
}
