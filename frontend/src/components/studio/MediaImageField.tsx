"use client";
import {useState,type ChangeEvent} from "react";
import {ImagePlus,LoaderCircle,Trash2} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
type Props={label:string;value?:string;onChange:(url:string)=>void;hint?:string};
export function MediaImageField({label,value,onChange,hint}:Props){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function upload(event:ChangeEvent<HTMLInputElement>){
  const file=event.currentTarget.files?.[0];
  event.currentTarget.value="";
  if(!file)return;
  setBusy(true);setError("");
  try{
   if(!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type)||file.size>5*1024*1024)
     throw new Error("Selecione uma imagem JPG, PNG, WebP ou GIF de até 5 MB.");
   const response=await fetch("/api/studio-media",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({type:file.type,size:file.size})});
   const data=await response.json() as {bucket?:string;path?:string;token?:string;error?:string};
   if(!response.ok||!data.bucket||!data.path||!data.token)throw new Error(data.error||"Falha ao preparar upload.");
   const storage=createClient().storage.from(data.bucket);
   const done=await storage.uploadToSignedUrl(data.path,data.token,file,{contentType:file.type});
   if(done.error)throw new Error(done.error.message);
   const uri=storage.getPublicUrl(data.path).data.publicUrl;
   onChange(uri);
  }catch(e){setError(e instanceof Error?e.message:"Falha no upload.");}
  finally{setBusy(false);}
 }
 return <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><p className="text-xs font-semibold text-white/75">{label}</p>{hint&&<p className="mt-1 text-[11px] text-white/45">{hint}</p>}</div>
   <div className="flex gap-2">
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-400/25 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/10">
     {busy?<LoaderCircle className="h-4 w-4 animate-spin"/>:<ImagePlus className="h-4 w-4"/>}{busy?"Enviando...":"Adicionar imagem"}
     <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} className="sr-only" onChange={upload}/>
    </label>
    {value&&<button type="button" onClick={()=>onChange("")} className="rounded-lg border border-white/10 p-2 text-white/55 hover:text-red-300" aria-label={"Remover "+label}><Trash2 className="h-4 w-4"/></button>}
   </div>
  </div>
  {value&&<img src={value} alt={"Prévia: "+label} loading="lazy" className="mt-3 h-32 w-full rounded-lg object-cover"/>}
  {error&&<p className="mt-2 text-xs text-red-300" role="alert">{error}</p>}
 </div>;
}
