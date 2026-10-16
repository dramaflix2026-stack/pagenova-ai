import {createClient as createAdminClient,type SupabaseClient} from "@supabase/supabase-js";
import {createClient} from "@/lib/supabase/server";
import {getPageNovaAccess} from "@/lib/trial/server";

export type ChatLine={role:"assistant"|"user";content:string};
export type ChatThread={id:string;owner_id:string;title:string;messages:ChatLine[];updated_at:string};
export type ChatIdentity={admin:SupabaseClient;userId:string;accessKind:"trial"|"paid"};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validThreadId(value:unknown):value is string{return typeof value==="string"&&UUID.test(value);}
export function validLine(value:unknown):value is ChatLine{
 if(!value||typeof value!=="object")return false;
 const m=value as Partial<ChatLine>;
 return (m.role==="user"||m.role==="assistant")&&typeof m.content==="string"&&m.content.length<=12000;
}
export function cleanLines(value:unknown):ChatLine[]{
 return Array.isArray(value)?value.filter(validLine).slice(-60):[];
}
export async function authorizedChat():Promise<ChatIdentity|null>{
 const session=await createClient();
 const {data:{user}}=await session.auth.getUser();
 if(!user?.id||!user.email)return null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,secret=process.env.SUPABASE_SECRET_KEY;
 if(!url||!secret)throw Error("Configuração do banco indisponível");
 const admin=createAdminClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const access=await getPageNovaAccess(admin,user,false);
 if(access.kind==="none")return null;
 return {admin,userId:user.id,accessKind:access.kind==="trial"?"trial":"paid"};
}
export async function fetchChatThread(admin:SupabaseClient,userId:string,id:string):Promise<ChatThread|null>{
 const {data,error}=await admin.from("pagenova_ai_threads").select("id,owner_id,title,messages,updated_at")
  .eq("owner_id",userId).eq("id",id).maybeSingle();
 if(error)throw error;
 return data?{...data,messages:cleanLines(data.messages)} as ChatThread:null;
}
export async function recentChatNotes(admin:SupabaseClient,userId:string):Promise<string[]>{
 const {data,error}=await admin.from("pagenova_ai_notes").select("note").eq("owner_id",userId).order("created_at",{ascending:false}).limit(12);
 if(error)throw error;
 return (data||[]).map(row=>String(row.note).slice(0,350));
}
export function explicitMemoryRequest(message:string):string|null{
 const match=message.trim().match(/^(?:por favor[, ]*)?(?:lembre(?:-se)?(?: de)? que|guarde(?: na mem[oó]ria)? que|memorize que)[:\s]+(.{3,350})$/iu);
 if(!match)return null;
 const content=match[1].trim().replace(/[\u0000-\u001f]/g,"");
 if(!content||/\b(?:senha|password|token|chave secreta|api key|cart[aã]o de cr[eé]dito)\b/i.test(content))return null;
 return content.slice(0,350);
}
export function conversationTitle(text:string):string{
 return text.trim().replace(/\s+/g," ").replace(/[<>]/g,"").slice(0,68)||"Nova conversa";
}
