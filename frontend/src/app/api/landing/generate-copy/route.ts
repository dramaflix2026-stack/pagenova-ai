import {NextRequest,NextResponse} from "next/server";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=40;
const prompt=[
 "Você é o redator da PageNova AI, especializado em páginas de venda de infoprodutos brasileiros.",
 "Receba somente nome do produto, descrição curta e preço; devolva um JSON com headline (máx. 100), subtitle (máx. 220), eyebrow (máx. 80), offer (máx. 120), benefits (3 a 5 textos curtos), before (3 contextos sem o produto), after (3 características/possibilidades reais com o material), faqs (3 perguntas com answers), steps (3 textos curtos).",
 "Produza textos específicos ao nicho, sem prometer resultados financeiros, médicos, cura, aprendizado garantido ou faturamento. Não invente características, entregáveis, bônus, depoimentos, alunos, reviews, prazos, escassez, desconto, garantia ou condições de pagamento que não estejam na descrição. Não suponha que um pacote digital inclui vídeos, comunidade ou suporte.",
 "Se houver pouca informação, seja persuasivo mas neutro, dando foco ao conteúdo realmente descrito. Não inclua preço diferente do informado.",
 "Retorne somente JSON válido, sem markdown. Os campos devem usar linguagem clara em português brasileiro."
].join("\n");
function tidy(v:unknown,limit=220){return typeof v==="string"?v.trim().slice(0,limit):"";}
function strList(v:unknown,count:number){return Array.isArray(v)?v.map(x=>tidy(x,170)).filter(Boolean).slice(0,count):[];}
export async function POST(request:NextRequest){
 try{
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
  const {admin,userId,kind}=await authorizedForms();
  const body=await request.json().catch(()=>null);
  const name=tidy(body?.name,100),description=tidy(body?.description,1200),price=tidy(body?.price,40);
  if(name.length<2||description.length<12||!/^(?:R\$\s*)?\d{1,6}(?:[.,]\d{2})?$/.test(price))
    throw new FormServiceError("Informe nome, descrição (12+ caracteres) e preço válido.",400);
  const key=process.env.OPENAI_API_KEY;
  if(!key)return NextResponse.json({configured:false,message:"Geração contextual pela API não está configurada.",copy:null});
  // Calls consume actual provider resources; fail closed if the private
  // atomic quota is unavailable. Trial users have a tighter limit.
  const {data:allowed,error:quotaError}=await admin.rpc("pagenova_paid_ai_reserve",{
    p_owner_id:userId,p_action:"universal_template_copy",p_limit:kind==="trial"?4:40
  });
  if(quotaError||allowed!==true)throw new FormServiceError(
    quotaError?"A proteção de custos da IA está indisponível.":"Limite diário de geração de textos atingido.",quotaError?503:429);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),27000);
  let response:Response;
  try{
   response=await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
    cache:"no-store",signal:controller.signal,
    body:JSON.stringify({
      model:process.env.PAGENOVA_LANDING_COPY_MODEL||"gpt-4.1-mini",
      temperature:0.6,max_tokens:1100,response_format:{type:"json_object"},
      messages:[
        {role:"system",content:prompt},
        {role:"user",content:JSON.stringify({produto:name,descricao:description,preco:price})}
      ]
    })
   });
  }finally{clearTimeout(timer);}
  if(!response.ok){
   console.error("[Landing AI] Generation failed",{status:response.status});
   throw new FormServiceError("A inteligência não respondeu. Você pode tentar novamente.",502);
  }
  const json=await response.json();
  let data:Record<string,unknown>;
  try{data=JSON.parse(json.choices?.[0]?.message?.content||"{}");}
  catch{throw new FormServiceError("Resposta inválida da IA.",502);}
  const faqs=Array.isArray(data.faqs)?data.faqs.slice(0,4).map((x:unknown)=>({
   question:tidy((x as {question?:unknown})?.question,150),
   answer:tidy((x as {answer?:unknown})?.answer,300)
  })).filter((x:{question:string;answer:string})=>x.question&&x.answer):[];
  return NextResponse.json({configured:true,copy:{
   eyebrow:tidy(data.eyebrow,80),headline:tidy(data.headline,160),
   subtitle:tidy(data.subtitle,350),offer:tidy(data.offer,150),
   benefits:strList(data.benefits,5),before:strList(data.before,5),
   after:strList(data.after,5),steps:strList(data.steps,5),faqs,
  }},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return errorsAsResponse(error);}
}
