import type {SupabaseClient} from "@supabase/supabase-js";
import {FormServiceError} from "@/lib/forms/server";
import {evaluateQuiz,normalizeQuiz,publicQuiz,validQuizId,
  type QuizProject,type PublicQuiz,type QuizEntry,type QuizOutcome} from "./schema";

import {createClient as createAdminClient} from "@supabase/supabase-js";

export function quizAdmin():SupabaseClient{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)throw new FormServiceError("Armazenamento de quizzes indisponível.",503);
  return createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

const BUCKET="pagenova-quizzes-private";
let ready=false;
export type QuizSummary={id:string;title:string;updatedAt:string;publishedAt:string|null;questions:number;responses?:number};
const draft=(userId:string,id:string)=>"drafts/"+userId+"/"+id+".json";
const meta=(userId:string,id:string)=>"meta/"+userId+"/"+id+".json";
const published=(id:string)=>"published/"+id+".json";
async function ensure(admin:SupabaseClient){
  if(ready)return;
  const {data}=await admin.storage.getBucket(BUCKET);
  if(!data){
    const attempt=await admin.storage.createBucket(BUCKET,{
      public:false,fileSizeLimit:200*1024,allowedMimeTypes:["application/json"]});
    if(attempt.error){
      const check=await admin.storage.getBucket(BUCKET);
      if(!check.data)throw new FormServiceError("Não foi possível preparar o armazenamento dos quizzes.",503);
    }
  }
  ready=true;
}
async function read<T>(admin:SupabaseClient,path:string):Promise<T|null>{
  await ensure(admin);
  const {data,error}=await admin.storage.from(BUCKET).download(path);
  if(error||!data)return null;
  try{return JSON.parse(await data.text()) as T;}catch{return null;}
}
async function upload(admin:SupabaseClient,path:string,value:unknown,upsert=true){
  await ensure(admin);
  const body=JSON.stringify(value);
  if(body.length>160000)throw new FormServiceError("Quiz grande demais para salvar.",413);
  const {error}=await admin.storage.from(BUCKET).upload(path,
    new Blob([body],{type:"application/json"}),
    {upsert,contentType:"application/json",cacheControl:"0"});
  if(error)throw new FormServiceError("Falha ao salvar quiz: "+error.message,503);
}
export async function listOwnedQuizzes(admin:SupabaseClient,userId:string):Promise<QuizSummary[]>{
  await ensure(admin);
  const {data,error}=await admin.storage.from(BUCKET).list("meta/"+userId,{
    limit:100,sortBy:{column:"updated_at",order:"desc"}});
  if(error)throw new FormServiceError("Falha ao listar quizzes.",503);
  const entries=(data||[]).filter(f=>f.name.endsWith(".json")).slice(0,80);
  const summaries=await Promise.all(entries.map(f=>read<QuizSummary>(admin,"meta/"+userId+"/"+f.name)));
  return summaries.filter((v):v is QuizSummary=>Boolean(v&&validQuizId(v.id)))
    .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
export async function getOwnedQuiz(admin:SupabaseClient,userId:string,id:string):Promise<QuizProject>{
  if(!validQuizId(id))throw new FormServiceError("Identificador de quiz inválido.");
  const found=await read<QuizProject>(admin,draft(userId,id));
  if(!found||found.id!==id)throw new FormServiceError("Quiz não encontrado.",404);
  return {...normalizeQuiz(found),id,updatedAt:found.updatedAt,publishedAt:found.publishedAt||null};
}
export async function saveOwnedQuiz(admin:SupabaseClient,userId:string,input:unknown,id?:string):Promise<QuizProject>{
  let existing:QuizProject|null=null;
  if(id)existing=await getOwnedQuiz(admin,userId,id);
  let parsed;
  try{parsed=normalizeQuiz(input);}
  catch(err){throw new FormServiceError(err instanceof Error?err.message:"Quiz inválido.");}
  const result:QuizProject={...parsed,id:existing?.id||crypto.randomUUID(),
    updatedAt:new Date().toISOString(),publishedAt:existing?.publishedAt||null};
  await upload(admin,draft(userId,result.id),result);
  await upload(admin,meta(userId,result.id),{
    id:result.id,title:result.title,updatedAt:result.updatedAt,
    publishedAt:result.publishedAt,questions:result.questions.length,
  } satisfies QuizSummary);
  return result;
}
export async function publishOwnedQuiz(admin:SupabaseClient,userId:string,id:string):Promise<QuizProject>{
  const existing=await getOwnedQuiz(admin,userId,id);
  const latest=await saveOwnedQuiz(admin,userId,existing,id);
  const time=new Date().toISOString();
  const publishedQuiz={...latest,publishedAt:time,updatedAt:time};
  // Only the server can read snapshots. Answer-to-outcome mapping is withheld
  // from /q/[id] and only used for authoritative scoring at submission time.
  await upload(admin,published(id),publishedQuiz);
  await upload(admin,draft(userId,id),publishedQuiz);
  await upload(admin,meta(userId,id),{
    id,title:latest.title,publishedAt:time,updatedAt:time,questions:latest.questions.length,
  } satisfies QuizSummary);
  return publishedQuiz;
}
export async function getPublishedQuiz(admin:SupabaseClient,id:string):Promise<QuizProject|null>{
  if(!validQuizId(id))return null;
  const found=await read<QuizProject>(admin,published(id));
  if(!found||found.id!==id||!found.publishedAt)return null;
  return found;
}
export async function getPublicQuiz(admin:SupabaseClient,id:string):Promise<PublicQuiz|null>{
  const found=await getPublishedQuiz(admin,id);
  return found?publicQuiz(found):null;
}
export async function submitPublicQuiz(admin:SupabaseClient,id:string,raw:unknown):
  Promise<{outcome:QuizOutcome;submissionId:string}>{
  const quiz=await getPublishedQuiz(admin,id);
  if(!quiz)throw new FormServiceError("Este quiz ainda não foi publicado.",404);
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new FormServiceError("Respostas inválidas.");
  const data=raw as Record<string,unknown>;
  // Honeypot field. Do not write private submissions from trivial spambots.
  if(data.companyWebsite)throw new FormServiceError("Não foi possível enviar as respostas.",400);
  if(!data.answers||typeof data.answers!=="object"||Array.isArray(data.answers))
    throw new FormServiceError("Responda todas as perguntas.");
  const map=data.answers as Record<string,unknown>;
  if(Object.values(map).some(v=>typeof v!=="string"))throw new FormServiceError("Opção inválida.");
  let outcome:QuizOutcome;
  try{outcome=evaluateQuiz(quiz,map as Record<string,string>);}
  catch(e){throw new FormServiceError(e instanceof Error?e.message:"Respostas inválidas.");}
  let lead:QuizEntry["lead"]|undefined;
  if(quiz.collectLeads){
    const name=typeof data.name==="string"?data.name.trim().slice(0,120):"";
    const email=typeof data.email==="string"?data.email.trim().toLowerCase().slice(0,254):"";
    if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||data.consent!==true)
      throw new FormServiceError("Informe nome, e-mail e aceite o consentimento para receber o resultado.");
    lead={name,email,consent:true};
  }
  const entry:QuizEntry={id:crypto.randomUUID(),quizId:id,submittedAt:new Date().toISOString(),
    outcomeId:outcome.id,answers:quiz.questions.map(q=>({questionId:q.id,optionId:map[q.id] as string})),
    ...(lead?{lead}:{})};
  await upload(admin,"responses/"+id+"/"+entry.id+".json",entry,false);
  return {outcome,submissionId:entry.id};
}
export async function listQuizResponses(admin:SupabaseClient,userId:string,id:string):Promise<QuizEntry[]>{
  await getOwnedQuiz(admin,userId,id);
  await ensure(admin);
  const {data,error}=await admin.storage.from(BUCKET).list("responses/"+id,{
    limit:100,sortBy:{column:"created_at",order:"desc"}});
  if(error)throw new FormServiceError("Não foi possível consultar as participações.",503);
  const entries=(data||[]).filter(f=>f.name.endsWith(".json")).slice(0,100);
  const responses=await Promise.all(entries.map(f=>read<QuizEntry>(admin,"responses/"+id+"/"+f.name)));
  return responses.filter((x):x is QuizEntry=>Boolean(x&&x.quizId===id))
    .sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt));
}
