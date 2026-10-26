"use client";
import {useState,type ChangeEvent} from "react";
export default function BancoMidias(){
 const [urls,setUrls]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState<string|null>(null);
 const [error,setError]=useState("");
 async function upload(device:"desktop"|"mobile",event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];if(!file)return;
  setBusy(device);setError("");
  try{
   const form=new FormData();form.set("niche","hamburgueria");form.set("device",device);form.set("file",file);
   const response=await fetch("/api/builder-v2/videos",{method:"POST",body:form});
   const data=await response.json();
   if(!response.ok||!data.url)throw new Error(data.error||"Erro ao enviar vídeo.");
   setUrls(prev=>({...prev,[device]:data.url}));
  }catch(e){setError(e instanceof Error?e.message:"Falha no upload");}finally{setBusy(null);event.target.value=""}
 }
 return <main className="min-h-screen bg-[#090e0b] p-5 text-white sm:p-10">
  <div className="mx-auto max-w-5xl">
   <p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">PageNova AI / Início</p>
   <h1 className="mt-3 text-3xl font-extrabold">Banco de Mídias</h1>
   <p className="mt-2 text-white/65">Biblioteca de imagens e vídeos por nicho. Primeiro nicho cinematográfico: hamburgueria.</p>
   <div className="mt-8 grid gap-5 md:grid-cols-2">{(["desktop","mobile"] as const).map(device=><section key={device} className="rounded-2xl border border-white/15 bg-white/5 p-5">
    <h2 className="text-lg font-bold">{device==="desktop"?"Hamburgueria — Desktop 16:9":"Hamburgueria — Mobile 9:16"}</h2>
    <p className="mt-1 text-sm text-white/55">Envie o MP4 criado no Google Flow (até 45 MB).</p>
    <label className="mt-5 inline-flex cursor-pointer rounded-xl bg-lime-300 px-5 py-3 font-bold text-[#142017]">
     {busy===device?"Enviando...":"Selecionar vídeo MP4"}
     <input className="sr-only" type="file" accept="video/mp4,.mp4" disabled={busy!==null} onChange={e=>void upload(device,e)}/>
    </label>
    {urls[device]&&<div className="mt-5 space-y-3"><video controls muted loop playsInline className="max-h-72 w-full rounded-xl bg-black" src={urls[device]}/><p className="break-all text-xs text-lime-300">{urls[device]}</p><button className="rounded-lg border border-white/20 px-3 py-2 text-sm" onClick={()=>void navigator.clipboard.writeText(urls[device])}>Copiar link público</button></div>}
   </section>)}</div>
   {error&&<p role="alert" className="mt-5 rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-red-200">{error}</p>}
   <p className="mt-6 text-sm text-white/50">Os arquivos ficam no Supabase Storage. Esta página não gera vídeos; apenas recebe arquivos prontos.</p>
  </div>
 </main>
}
