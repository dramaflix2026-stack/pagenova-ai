import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { isFormId, normalizeForm, type PageNovaForm, type PublicForm } from "./schema";

const BUCKET = "pagenova-forms-private";
let bucketReady = false;

export class FormServiceError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}
function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new FormServiceError("Armazenamento da PageNova não configurado.", 503);
  return createAdminClient(url, key, {auth: {persistSession:false, autoRefreshToken:false}});
}
export async function authorizedForms(): Promise<{admin: SupabaseClient; userId: string}> {
  const session = await createSessionClient();
  const {data:{user}} = await session.auth.getUser();
  if (!user?.email) throw new FormServiceError("Faça login para criar formulários.", 401);
  const admin=adminClient();
  const {data:entitlement,error} = await admin.from("entitlements").select("id")
    .eq("product","pagenova-ai").eq("status","active").ilike("email",user.email.trim())
    .limit(1).maybeSingle();
  if (error || !entitlement) throw new FormServiceError("Acesso PageNova necessário.",403);
  return {admin,userId:user.id};
}
export function errorsAsResponse(error: unknown): Response {
  const status=error instanceof FormServiceError ? error.status : 500;
  return Response.json({error:error instanceof Error?error.message:"Erro inesperado."},{status});
}
async function ensureBucket(admin:SupabaseClient):Promise<void> {
  if (bucketReady) return;
  const {data,error}=await admin.storage.getBucket(BUCKET);
  if (data && !error) {bucketReady=true;return;}
  const created=await admin.storage.createBucket(BUCKET,{
    public:false,fileSizeLimit:"100KB",allowedMimeTypes:["application/json"],
  });
  if (created.error) {
    const retry=await admin.storage.getBucket(BUCKET);
    if (retry.error || !retry.data) throw new FormServiceError("Não foi possível preparar o armazenamento de formulários.",503);
  }
  bucketReady=true;
}
async function downloadJson<T>(admin:SupabaseClient,path:string):Promise<T|null> {
  const {data,error}=await admin.storage.from(BUCKET).download(path);
  if(error || !data) return null;
  try{return JSON.parse(await data.text()) as T;}catch{return null;}
}
async function uploadJson(admin:SupabaseClient,path:string,value:unknown):Promise<void> {
  await ensureBucket(admin);
  const body=JSON.stringify(value);
  if(body.length>90000)throw new FormServiceError("O formulário excedeu o tamanho permitido.");
  const {error}=await admin.storage.from(BUCKET).upload(path,
    new Blob([body],{type:"application/json"}),{upsert:true,contentType:"application/json",cacheControl:"0"});
  if(error) throw new FormServiceError("Não foi possível salvar o formulário. "+error.message,503);
}
function ownedPath(userId:string,id:string){return "drafts/"+userId+"/"+id+".json";}
function publishedPath(id:string){return "published/"+id+".json";}
export async function listOwnedForms(admin:SupabaseClient,userId:string):Promise<PageNovaForm[]> {
  await ensureBucket(admin);
  const {data,error}=await admin.storage.from(BUCKET).list("drafts/"+userId,{
    limit:100,sortBy:{column:"updated_at",order:"desc"},
  });
  if(error)throw new FormServiceError("Não foi possível listar seus formulários.",503);
  const files=(data||[]).filter(item=>item.name.endsWith(".json")).slice(0,50);
  const forms=await Promise.all(files.map(item=>downloadJson<PageNovaForm>(admin,"drafts/"+userId+"/"+item.name)));
  return forms.filter((item):item is PageNovaForm=>Boolean(item && isFormId(item.id)))
    .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
export async function getOwnedForm(admin:SupabaseClient,userId:string,id:string):Promise<PageNovaForm> {
  if(!isFormId(id))throw new FormServiceError("Identificador de formulário inválido.");
  await ensureBucket(admin);
  const form=await downloadJson<PageNovaForm>(admin,ownedPath(userId,id));
  if(!form||form.id!==id)throw new FormServiceError("Formulário não encontrado.",404);
  return form;
}
export async function saveOwnedForm(admin:SupabaseClient,userId:string,input:unknown,id?:string):Promise<PageNovaForm> {
  const parsed=normalizeForm(input);
  let existing:PageNovaForm|null=null;
  if(id)existing=await getOwnedForm(admin,userId,id);
  const form:PageNovaForm={...parsed,id:existing?.id||crypto.randomUUID(),
    updatedAt:new Date().toISOString(),publishedAt:existing?.publishedAt||null};
  await uploadJson(admin,ownedPath(userId,form.id),form);
  return form;
}
export async function publishOwnedForm(admin:SupabaseClient,userId:string,id:string):Promise<PageNovaForm> {
  const form=await getOwnedForm(admin,userId,id);
  const parsed=normalizeForm(form);
  if(!/^\d{10,15}$/.test(parsed.whatsapp)) {
    throw new FormServiceError("Antes de publicar, informe um WhatsApp com DDI para receber as respostas.");
  }
  const publishedAt=new Date().toISOString();
  const result:PageNovaForm={...form,...parsed,publishedAt,updatedAt:publishedAt};
  const publicVersion:PublicForm={id:result.id,title:result.title,description:result.description,
    kind:result.kind,whatsapp:result.whatsapp,fields:result.fields,publishedAt};
  // Public snapshot stays fixed until the owner chooses to publish again.
  await uploadJson(admin,publishedPath(id),publicVersion);
  await uploadJson(admin,ownedPath(userId,id),result);
  return result;
}
export async function getPublishedForm(id:string):Promise<PublicForm|null> {
  if(!isFormId(id))return null;
  const admin=adminClient();
  await ensureBucket(admin);
  const result=await downloadJson<PublicForm>(admin,publishedPath(id));
  if(!result||result.id!==id||!result.publishedAt)return null;
  return result;
}
