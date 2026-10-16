import {NextRequest} from "next/server";
import {authorizedChat,fetchChatThread,validThreadId} from "@/lib/support/chat-server";

export const runtime="nodejs";export const dynamic="force-dynamic";
const noStore={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
export async function GET(request:NextRequest){
 try{
  const auth=await authorizedChat();
  if(!auth)return Response.json({error:"Faça login para acessar suas conversas."},{status:401,headers:noStore});
  const {admin,userId}=auth;
  const threadId=request.nextUrl.searchParams.get("threadId");
  if(threadId){
   if(!validThreadId(threadId))return Response.json({error:"Conversa inválida."},{status:400,headers:noStore});
   const thread=await fetchChatThread(admin,userId,threadId);
   if(!thread)return Response.json({error:"Conversa não encontrada."},{status:404,headers:noStore});
   return Response.json({thread:{id:thread.id,title:thread.title,messages:thread.messages,updatedAt:thread.updated_at}},{headers:noStore});
  }
  const [{data,error},{data:notes,noteError}]=await Promise.all([
   admin.from("pagenova_ai_threads").select("id,title,updated_at").eq("owner_id",userId).order("updated_at",{ascending:false}).limit(25),
   admin.from("pagenova_ai_notes").select("id,note").eq("owner_id",userId).order("created_at",{ascending:false}).limit(12)
     .then(response=>({data:response.data,noteError:response.error}))
  ]);
  if(error||noteError)throw error||noteError;
  return Response.json({threads:(data||[]).map(t=>({id:t.id,title:t.title,updatedAt:t.updated_at})),notes:notes||[]},{headers:noStore});
 }catch(error){
  console.error("[PageNova IA history] Failed",error instanceof Error?error.message:"unavailable");
  return Response.json({error:"Não foi possível consultar o histórico agora."},{status:503,headers:noStore});
 }
}
export async function DELETE(request:NextRequest){
 try{
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)return Response.json({error:"Origem não autorizada."},{status:403,headers:noStore});
  const auth=await authorizedChat();
  if(!auth)return Response.json({error:"Entre na sua conta."},{status:401,headers:noStore});
  const {admin,userId}=auth;
  const threadId=request.nextUrl.searchParams.get("threadId");
  if(threadId){
   if(!validThreadId(threadId))return Response.json({error:"Conversa inválida."},{status:400,headers:noStore});
   const {error}=await admin.from("pagenova_ai_threads").delete().eq("owner_id",userId).eq("id",threadId);
   if(error)throw error;
  }else{
   const {error}=await admin.from("pagenova_ai_threads").delete().eq("owner_id",userId);
   if(error)throw error;
   const {error:notesError}=await admin.from("pagenova_ai_notes").delete().eq("owner_id",userId);
   if(notesError)throw notesError;
  }
  return Response.json({ok:true},{headers:noStore});
 }catch{
  return Response.json({error:"Não foi possível apagar as conversas."},{status:503,headers:noStore});
 }
}
