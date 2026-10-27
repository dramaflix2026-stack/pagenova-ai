"use client";
import {useEffect,useMemo,useState,type ChangeEvent} from "react";
import catalog from "@/lib/niche-photo-catalog.json";
const IMAGE_BASE="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/";
type Device="desktop"|"mobile";
type Catalog=Record<string,{desktop:string[];mobile:string[]}>;
const photos=catalog as Catalog;
const niches=Object.keys(photos).sort((a,b)=>a.localeCompare(b,"pt-BR"));
const imageCount=Object.values(photos).reduce((sum,item)=>sum+item.desktop.length+item.mobile.length,0);
type VideoItem={niche:string;device:Device;url:string};

export default function BancoMidias(){
 const [tab,setTab]=useState<"home"|"images"|"videos">("home");
 const [niche,setNiche]=useState("Todos");
 const [device,setDevice]=useState<"all"|Device>("all");
 const [uploadNiche,setUploadNiche]=useState("hamburgueria");
 const [busy,setBusy]=useState<string|null>(null);
 const [error,setError]=useState("");
 const [videos,setVideos]=useState<VideoItem[]>([]);
 useEffect(()=>{if(tab!=="videos")return;let active=true;fetch("/api/builder-v2/videos?all=1",{cache:"no-store"}).then(r=>r.json()).then(data=>{if(!active)return;setVideos(Array.isArray(data.items)?data.items:[]) }).catch(()=>{if(active)setError("Não foi possível consultar a biblioteca compartilhada.")});return()=>{active=false}},[tab]);
 const images=useMemo(()=>Object.entries(photos).filter(([name])=>niche==="Todos"||name===niche).flatMap(([name,entry])=>(["desktop","mobile"] as const).flatMap(d=>device!=="all"&&device!==d?[]:entry[d].map((id,index)=>({name,device:d,index:index+1,url:IMAGE_BASE+id+".png"})))),[niche,device]);
 const visibleVideos=videos.filter(v=>(niche==="Todos"||v.niche===niche)&&(device==="all"||v.device===device));
 function navigate(next:"home"|"images"|"videos"){setTab(next);setNiche("Todos");setDevice("all");setError("")}
 async function upload(uploadDevice:Device,event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];if(!file)return;setBusy(uploadDevice);setError("");
  try{const form=new FormData();form.set("niche",uploadNiche);form.set("device",uploadDevice);form.set("file",file);
   const response=await fetch("/api/builder-v2/videos",{method:"POST",body:form});const data=await response.json();
   if(!response.ok||!data.url)throw new Error(data.error||"Erro ao enviar vídeo.");
   const next=[...videos.filter(v=>!(v.niche===uploadNiche&&v.device===uploadDevice)),{niche:uploadNiche,device:uploadDevice,url:data.url}];
   setVideos(next);
  }catch(e){setError(e instanceof Error?e.message:"Falha no upload")}finally{setBusy(null);event.target.value=""}
 }
 return <main className="min-h-screen bg-[#090e0b] p-5 text-white sm:p-10"><div className="mx-auto max-w-6xl">
  <p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">PageNova AI / Início</p>
  <div className="mt-3 flex flex-wrap items-center gap-4"><h1 className="text-3xl font-extrabold sm:text-4xl">Banco de Mídias</h1>{tab!=="home"&&<button onClick={()=>navigate("home")} className="rounded-xl border border-lime-300/50 px-4 py-2 text-sm font-bold text-lime-300">← Voltar aos bancos</button>}</div>
  <p className="mt-3 text-sm text-white/65">Biblioteca visual organizada por nicho e formato.</p>
  {tab==="home"&&<div className="mt-8 grid gap-5 sm:grid-cols-2">
   <button onClick={()=>navigate("images")} className="rounded-3xl border-2 border-lime-300/45 bg-[#172019] p-7 text-left transition hover:border-lime-300"><div className="text-4xl">🖼️</div><h2 className="mt-5 text-2xl font-bold">Banco de Imagens</h2><p className="mt-2 text-white/65">{imageCount.toLocaleString("pt-BR")} imagens cadastradas · {niches.length} nichos · desktop e mobile</p><span className="mt-5 inline-block font-bold text-lime-300">Explorar imagens →</span></button>
   <button onClick={()=>navigate("videos")} className="rounded-3xl border-2 border-lime-300/45 bg-[#172019] p-7 text-left transition hover:border-lime-300"><div className="text-4xl">🎬</div><h2 className="mt-5 text-2xl font-bold">Banco de Vídeos</h2><p className="mt-2 text-white/65">Vídeos cinematográficos por nicho, com versões desktop e mobile</p><span className="mt-5 inline-block font-bold text-lime-300">Explorar vídeos →</span></button>
  </div>}
  {tab!=="home"&&<><div className="mt-7 flex flex-wrap gap-3">
   <label className="text-sm text-white/75">Nicho <select aria-label="Filtrar por nicho" value={niche} onChange={e=>setNiche(e.target.value)} className="ml-2 rounded-lg border border-white/25 bg-[#18221b] px-3 py-2 text-white"><option>Todos</option>{(tab==="images"?niches:niches).map(n=><option key={n}>{n}</option>)}</select></label>
   <label className="text-sm text-white/75">Formato <select aria-label="Filtrar por formato" value={device} onChange={e=>setDevice(e.target.value as typeof device)} className="ml-2 rounded-lg border border-white/25 bg-[#18221b] px-3 py-2 text-white"><option value="all">Todos</option><option value="desktop">Desktop</option><option value="mobile">Mobile</option></select></label>
  </div>
  {tab==="images"&&<><p className="mt-5 text-sm text-white/60">{images.length.toLocaleString("pt-BR")} imagens encontradas</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{images.map(photo=><article key={photo.url} className="overflow-hidden rounded-xl border border-white/20 bg-white/5"><img loading="lazy" src={photo.url} alt={photo.name+" "+photo.device+" "+photo.index} className="aspect-[4/3] w-full object-cover"/><div className="p-3"><p className="truncate text-sm font-bold">{photo.name}</p><p className="text-xs text-white/50">{photo.device==="desktop"?"Desktop":"Mobile"} · {photo.index}</p><button className="mt-2 text-xs font-bold text-lime-300" onClick={()=>void navigator.clipboard.writeText(photo.url)}>Copiar link</button></div></article>)}</div></>}
  {tab==="videos"&&<><p className="mt-5 text-sm text-white/60">{visibleVideos.length} vídeos na biblioteca compartilhada</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{visibleVideos.map(v=><article key={v.url} className="rounded-xl border border-lime-300/35 bg-white/5 p-4"><h2 className="mb-3 font-bold">{v.niche} · {v.device==="desktop"?"Desktop 16:9":"Mobile 9:16"}</h2><video src={v.url} controls muted playsInline className="max-h-80 w-full rounded-lg bg-black"/><button className="mt-3 rounded-lg border border-white/25 px-3 py-2 text-sm" onClick={()=>void navigator.clipboard.writeText(v.url)}>Copiar link público</button></article>)}</div>
   <section className="mt-8 rounded-2xl border border-white/25 bg-white/5 p-5"><h2 className="text-xl font-bold">Adicionar vídeos</h2><p className="mt-2 text-sm text-white/60">Selecione o nicho e envie as versões desktop e mobile. Até 45 MB por arquivo.</p><label className="mt-4 block text-sm text-white/80">Nicho do vídeo <select value={uploadNiche} onChange={e=>setUploadNiche(e.target.value)} className="ml-2 max-w-full rounded-lg border border-white/25 bg-[#18221b] px-3 py-2 text-white">{niches.map(n=><option key={n} value={n.toLowerCase()}>{n}</option>)}</select></label><div className="mt-4 flex flex-wrap gap-3">{(["desktop","mobile"] as const).map(d=><label key={d} className="cursor-pointer rounded-xl bg-lime-300 px-4 py-3 font-bold text-[#142017]">{busy===d?"Enviando...":"Enviar "+(d==="desktop"?"Desktop 16:9":"Mobile 9:16")}<input className="sr-only" type="file" accept="video/mp4,.mp4" disabled={busy!==null} onChange={e=>void upload(d,e)}/></label>)}</div>{error&&<p role="alert" className="mt-4 text-red-300">{error}</p>}</section>
  </>}</>}
 </div></main>;
}
