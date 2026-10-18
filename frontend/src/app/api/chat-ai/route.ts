import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as adminClient } from "@supabase/supabase-js";
import { getPageNovaAccess } from "@/lib/trial/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MODEL = "gpt-4.1-mini";
// 750,000 micro-USD = US$0.75; a conservative ceiling below R$5 at USD/BRL up to 6.66.
const MONTHLY_BUDGET_USD_MICROS = 750000;
const month = () => new Date().toISOString().slice(0,7);
const error = (message:string,status=400) => NextResponse.json({error:message},{status});
async function session(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)return null;
 const admin=adminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const access=await getPageNovaAccess(admin,user);
 if(access.kind!=="paid")return null;
 return {user,admin};
}
export async function GET(request:NextRequest){
 const s=await session();if(!s)return error("Assinatura ativa necessária.",401);
 const thread=request.nextUrl.searchParams.get("thread");
 if(thread){
  const {data:owner}=await s.admin.from("pagenova_chat_threads").select("id").eq("id",thread).eq("user_id",s.user.id).maybeSingle();
  if(!owner)return error("Conversa não encontrada.",404);
  const {data,error:e}=await s.admin.from("pagenova_chat_messages").select("id,role,content,created_at").eq("thread_id",thread).eq("user_id",s.user.id).order("created_at");
  return e?error("Histórico indisponível.",503):NextResponse.json({messages:data});
 }
 const [{data:threads,error:e},{data:budget,error:budgetError}]=await Promise.all([
  s.admin.from("pagenova_chat_threads").select("id,title,updated_at").eq("user_id",s.user.id).order("updated_at",{ascending:false}).limit(60),
  s.admin.from("pagenova_chat_budget").select("spent_units,reserved_units").eq("user_id",s.user.id).eq("month",month()).maybeSingle()
 ]);
 if(e||budgetError){console.error("[PageNova Chat] list failed",{threadsCode:e?.code,budgetCode:budgetError?.code});return error("Não foi possível carregar suas conversas. Tente atualizar a página.",503)}
 return NextResponse.json({threads,budgetUsed:(budget?.spent_units||0)+(budget?.reserved_units||0),budgetLimit:MONTHLY_BUDGET_USD_MICROS});
}
export async function POST(request:NextRequest){
 if(request.headers.get("origin")&&request.headers.get("origin")!==request.nextUrl.origin)return error("Origem inválida.",403);
 const s=await session();if(!s)return error("Assinatura ativa necessária.",401);
 const key=process.env.OPENAI_API_KEY;if(!key)return error("Chat AI aguardando configuração da API.",503);
 let input:{threadId?:string;message?:string};try{input=await request.json()}catch{return error("Mensagem inválida.")}
 const message=String(input.message||"").trim();if(!message||message.length>4000)return error("Digite uma mensagem de até 4.000 caracteres.");
 // Reserve more than the worst-case cost for 900 output tokens and the bounded history.
 const reserved=20000;
 const {data:allowed,error:reserveError}=await s.admin.rpc("pagenova_chat_reserve",{p_user:s.user.id,p_month:month(),p_units:reserved});
 if(reserveError){console.error("[PageNova Chat] reserve failed",reserveError.code);return error("Controle de consumo indisponível.",503)}
 if(!allowed)return error("Sua franquia mensal do Chat AI foi atingida.",429);
 let spent=0;
 try{
  let threadId=input.threadId;
  if(threadId){const {data:owner}=await s.admin.from("pagenova_chat_threads").select("id").eq("id",threadId).eq("user_id",s.user.id).maybeSingle();if(!owner)return error("Conversa não encontrada.",404)}
  else {const {data:created,error:e}=await s.admin.from("pagenova_chat_threads").insert({user_id:s.user.id,title:message.slice(0,65)}).select("id").single();if(e||!created)return error("Não foi possível criar conversa.",503);threadId=created.id}
  const {data:history,error:he}=await s.admin.from("pagenova_chat_messages").select("role,content").eq("user_id",s.user.id).eq("thread_id",threadId).order("created_at",{ascending:false}).limit(12);
  if(he)return error("Não foi possível carregar histórico.",503);
  const messages=[{role:"system",content:"Você é o PageNova Chat AI, assistente útil, claro e preciso, em português brasileiro por padrão. Não afirme ter executado ações na plataforma se não as executou."},...(history||[]).reverse().map(m=>({role:m.role,content:m.content})),{role:"user",content:message}];
  const response=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"authorization":`Bearer ${key}`,"content-type":"application/json"},body:JSON.stringify({model:MODEL,messages,max_completion_tokens:900}),signal:AbortSignal.timeout(45000)});
  if(!response.ok)return error("O modelo está temporariamente indisponível.",502);
  const data=await response.json();const answer=String(data.choices?.[0]?.message?.content||"").trim();if(!answer)return error("A IA não retornou uma resposta.",502);
  // Conservative accounting: GPT-4.1 mini $0.40 / 1M input, $1.60 / 1M output.
  spent=Math.ceil(((data.usage?.prompt_tokens||0)*0.4+(data.usage?.completion_tokens||0)*1.6));
  if(spent>reserved){console.error("[PageNova Chat] unexpectedly high token cost");spent=reserved;return error("Resposta excedeu o limite de segurança. Tente novamente.",502)}
  const {error:saveError}=await s.admin.from("pagenova_chat_messages").insert([{user_id:s.user.id,thread_id:threadId,role:"user",content:message},{user_id:s.user.id,thread_id:threadId,role:"assistant",content:answer}]);
  if(saveError)return error("Resposta gerada, mas não foi possível salvar o histórico.",503);
  await s.admin.from("pagenova_chat_threads").update({updated_at:new Date().toISOString()}).eq("id",threadId).eq("user_id",s.user.id);
  return NextResponse.json({threadId,answer});
 }catch(e){console.error("[PageNova Chat] request failed",e instanceof Error?e.name:"unknown");return error("Falha temporária no chat.",502)}finally{
  const {error:e}=await s.admin.rpc("pagenova_chat_settle",{p_user:s.user.id,p_month:month(),p_reserved:reserved,p_actual:spent});
  if(e)console.error("[PageNova Chat] budget settlement failed",e.code);
 }
}
