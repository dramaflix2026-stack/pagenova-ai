import type { SupabaseClient } from "@supabase/supabase-js";
import { FormServiceError } from "@/lib/forms/server";
import { normalizeEbook, type EbookProject, type EbookTheme } from "./schema";

const BUCKET="pagenova-ebooks-private";
let bucketReady=false;
export type EbookSummary={
  id:string;title:string;author:string;theme:EbookTheme;pageCount:number;updatedAt:string;
};
function validId(id:string):boolean{return /^[a-zA-Z0-9-]{12,80}$/.test(id);}
function fullPath(userId:string,id:string){return "books/"+userId+"/"+id+".json";}
function metaPath(userId:string,id:string){return "meta/"+userId+"/"+id+".json";}
async function ensureBucket(admin:SupabaseClient){
  if(bucketReady)return;
  const {data}=await admin.storage.getBucket(BUCKET);
  if(!data){
    const created=await admin.storage.createBucket(BUCKET,{
      public:false,fileSizeLimit:12*1024*1024,allowedMimeTypes:["application/json"],
    });
    if(created.error){
      const again=await admin.storage.getBucket(BUCKET);
      if(!again.data)throw new FormServiceError("O armazenamento privado de ebooks está indisponível.",503);
    }
  }
  bucketReady=true;
}
async function upload(admin:SupabaseClient,path:string,content:unknown){
  const body=JSON.stringify(content);
  if(body.length>10_000_000)throw new FormServiceError("Este ebook está grande demais para a nuvem. Exporte o PDF e reduza as imagens.",413);
  const {error}=await admin.storage.from(BUCKET).upload(path,
    new Blob([body],{type:"application/json"}),{contentType:"application/json",upsert:true,cacheControl:"0"});
  if(error)throw new FormServiceError("Falha ao salvar ebook na sua conta: "+error.message,503);
}
async function read<T>(admin:SupabaseClient,path:string):Promise<T|null>{
  const {data,error}=await admin.storage.from(BUCKET).download(path);
  if(error||!data)return null;
  try{return JSON.parse(await data.text()) as T;}catch{return null;}
}
export async function saveCloudEbook(admin:SupabaseClient,userId:string,input:unknown):Promise<EbookSummary>{
  let book:ReturnType<typeof normalizeEbook>;
  try{book=normalizeEbook(input);}
  catch(error){throw new FormServiceError(error instanceof Error?error.message:"Ebook inválido.",422);}
  if(!validId(book.id))throw new FormServiceError("ID de ebook inválido.");
  await ensureBucket(admin);
  await upload(admin,fullPath(userId,book.id),book);
  const summary:EbookSummary={
    id:book.id,title:book.title,author:book.author,theme:book.theme,
    pageCount:book.pages.length,updatedAt:book.updatedAt,
  };
  await upload(admin,metaPath(userId,book.id),summary);
  return summary;
}
export async function getCloudEbook(admin:SupabaseClient,userId:string,id:string):Promise<EbookProject>{
  if(!validId(id))throw new FormServiceError("ID inválido.");
  await ensureBucket(admin);
  const book=await read<EbookProject>(admin,fullPath(userId,id));
  if(!book||book.id!==id)throw new FormServiceError("Ebook não encontrado na sua conta.",404);
  return normalizeEbook(book);
}
export async function listCloudEbooks(admin:SupabaseClient,userId:string):Promise<EbookSummary[]>{
  await ensureBucket(admin);
  const {data,error}=await admin.storage.from(BUCKET).list("meta/"+userId,{limit:100});
  if(error)throw new FormServiceError("Não foi possível listar os ebooks.",503);
  const entries=(data||[]).filter(p=>p.name.endsWith(".json")).slice(0,80);
  const results=await Promise.all(entries.map(p=>read<EbookSummary>(admin,"meta/"+userId+"/"+p.name)));
  return results.filter((v):v is EbookSummary=>Boolean(v&&validId(v.id)&&v.title))
    .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
export async function deleteCloudEbook(admin:SupabaseClient,userId:string,id:string):Promise<void>{
  if(!validId(id))throw new FormServiceError("ID inválido.");
  await ensureBucket(admin);
  const {error}=await admin.storage.from(BUCKET).remove([fullPath(userId,id),metaPath(userId,id)]);
  if(error)throw new FormServiceError("Não foi possível excluir o ebook da sua conta.",503);
}
