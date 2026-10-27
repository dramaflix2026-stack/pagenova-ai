"use client";
import {useEffect,useMemo,useState,type ChangeEvent} from "react";
import catalog from "@/lib/niche-photo-catalog.json";
import {createClient} from "@/lib/supabase/client";
const IMAGE_BASE="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/";
type Device="desktop"|"mobile";
type Catalog=Record<string,{desktop:string[];mobile:string[]}>;
const photos=catalog as Catalog;
const niches=Object.keys(photos).sort((a,b)=>a.localeCompare(b,"pt-BR"));
const nicheKey=(name:string)=>name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
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
 const [showImageImport,setShowImageImport]=useState(false);
 const [imagePassword,setImagePassword]=useState("");
 const [imageNiche,setImageNiche]=useState("Padaria e Confeitaria");
 const [imageDevice,setImageDevice]=useState<Device>("desktop");
 const [importedImages,setImportedImages]=useState<{url:string;device:Device}[]>([]);
 const [uploadStatus,setUploadStatus]=useState("");
 const [videoPassword,setVideoPassword]=useState("");
 const [videoStatus,setVideoStatus]=useState("");
 useEffect(()=>{if(tab!=="videos")return;let active=true;fetch("/api/builder-v2/videos?all=1",{cache:"no-store"}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||"Falha ao consultar vídeos");return data}).then(data=>{if(!active)return;setVideos(Array.isArray(data.items)?data.items:[]) }).catch(()=>{if(active)setError("Não foi possível consultar a biblioteca compartilhada.")});return()=>{active=false}},[tab]);
 const images=useMemo(()=>Object.entries(photos).filter(([name])=>niche==="Todos"||name===niche).flatMap(([name,entry])=>(["desktop","mobile"] as const).flatMap(d=>device!=="all"&&device!==d?[]:entry[d].map((id,index)=>({name,device:d,index:index+1,url:IMAGE_BASE+id+".png"})))),[niche,device]);
 const visibleVideos=videos.filter(v=>(niche==="Todos"||v.niche===nicheKey(niche)||(nicheKey(niche)==="padaria-e-confeitaria"&&v.niche==="padaria"))&&(device==="all"||v.device===device));
 async function importImage(event:ChangeEvent<HTMLInputElement>){
 const files=Array.from(event.target.files||[]);if(!files.length)return;
 setBusy("image");setError("");setUploadStatus("");
 let done=0;const errors:string[]=[];
 for(const file of files){
  setUploadStatus("Enviando "+(done+errors.length+1)+" de "+files.length);
  try{
   const form=new FormData();form.set("password",imagePassword);form.set("niche",imageNiche);form.set("device",imageDevice);form.set("file",file);
   const response=await fetch("/api/builder-v2/immersive-images",{method:"POST",body:form});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Falha no envio");
   setImportedImages(prev=>[{url:data.url,device:imageDevice},...prev]);done++;
  }catch(e){errors.push(file.name+": "+(e instanceof Error?e.message:"Erro"))}
 }
 setUploadStatus(done+" de "+files.length+" imagens enviadas com sucesso.");
 if(errors.length)setError(errors.join("; "));
 setBusy(null);event.target.value="";
 }
 function navigate(next:"home"|"images"|"videos"){setTab(next);setNiche("Todos");setDevice("all");setError("")}
 async function upload(uploadDevice:Device,event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];if(!file)return;setBusy(uploadDevice);setError("");setVideoStatus("");
  try{
   if(file.type!=="video/mp4"||file.size>45_000_000)throw new Error("Envie um MP4 de até 45 MB.");
   const response=await fetch("/api/builder-v2/videos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({device:uploadDevice,niche:uploadNiche,password:videoPassword,size:file.size,type:file.type})});
   const raw=await response.text();let data:{error?:string;path?:string;token?:string;url?:string}={};
   try{data=JSON.parse(raw)}catch{throw new Error("Falha ao iniciar envio (HTTP "+response.status+"). Tente novamente.")}
   if(!response.ok||!data.path||!data.token||!data.url)throw new Error(data.error||"Falha ao autorizar envio");
   setVideoStatus("Enviando vídeo diretamente ao armazenamento...");
   const storage=createClient();
   const uploaded=await storage.storage.from("site-images").uploadToSignedUrl(data.path,data.token,file,{contentType:"video/mp4",cacheControl:"31536000"});
   if(uploaded.error)throw new Error("Falha no armazenamento: "+uploaded.error.message);
   setVideos(prev=>[{niche:nicheKey(uploadNiche),device:uploadDevice,url:data.url},...prev]);
   setVideoStatus("Vídeo "+(uploadDevice==="desktop"?"desktop":"mobile")+" enviado com sucesso!");
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
   <label className="text-sm text-white/75">Nicho <select aria-label="Filtrar por nicho" value={niche} onChange={e=>setNiche(e.target.value)} className="ml-2 rounded-lg border border-white/25 bg-[#18221b] px-3 py-2 text-white"><option>Todos</option>{niches.map(n=><option key={n}>{n}</option>)}</select></label>
   <label className="text-sm text-white/75">Formato <select aria-label="Filtrar por formato" value={device} onChange={e=>setDevice(e.target.value as typeof device)} className="ml-2 rounded-lg border border-white/25 bg-[#18221b] px-3 py-2 text-white"><option value="all">Todos</option><option value="desktop">Desktop</option><option value="mobile">Mobile</option></select></label>
  </div>
  {tab==="images"&&<><section className="mt-5 rounded-2xl border border-lime-300/30 bg-white/5 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Enviar mídias · Imagens</h2><p className="text-sm text-white/60">Importe novas imagens para o banco da PageNova AI.</p></div><button type="button" onClick={()=>{setShowImageImport(v=>!v);setImagePassword("");setError("")}} className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-[#142017]">+ Adicionar mídia</button></div>
    {showImageImport&&<div className="mt-4 grid gap-3 rounded-xl border border-white/20 p-4"><label className="text-sm">Senha de autorização<input type="password" autoComplete="off" value={imagePassword} onChange={e=>setImagePassword(e.target.value)} placeholder="Digite a senha" className="mt-1 block w-full rounded-lg border border-white/25 bg-[#18221b] p-3 text-white"/></label><label className="text-sm">Nicho<input value={imageNiche} onChange={e=>setImageNiche(e.target.value)} className="mt-1 block w-full rounded-lg border border-white/25 bg-[#18221b] p-3 text-white"/></label><label className="text-sm">Formato<select value={imageDevice} onChange={e=>setImageDevice(e.target.value as Device)} className="mt-1 block w-full rounded-lg border border-white/25 bg-[#18221b] p-3 text-white"><option value="desktop">Desktop 16:9</option><option value="mobile">Mobile 9:16</option></select></label><label className={"cursor-pointer rounded-xl px-4 py-3 text-center font-bold "+(imagePassword&&busy===null?"bg-lime-300 text-[#142017]":"bg-white/20 text-white/50")}>{busy==="image"?"Enviando imagem...":"Selecionar várias imagens e importar"}<input type="file" multiple accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={!imagePassword||busy!==null} onChange={e=>void importImage(e)}/></label>{uploadStatus&&<p role="status" className="rounded-lg bg-lime-300/15 p-3 font-bold text-lime-300">{uploadStatus}</p>}{error&&<p role="alert" className="rounded-lg bg-red-500/15 p-3 text-red-300">{error}</p>}<p className="text-xs text-white/50">Seleção múltipla · PNG, JPG ou WebP, até 8 MB por arquivo. A senha é verificada no servidor antes do upload.</p>{importedImages.map(x=><div key={x.url} className="flex items-center gap-3"><img src={x.url} alt="Imagem importada" className="h-16 w-20 rounded-lg object-cover"/><span className="text-sm">{x.device}</span><button type="button" onClick={()=>void navigator.clipboard.writeText(x.url)} className="text-sm text-lime-300">Copiar link</button></div>)}</div>}
   </section><p className="mt-5 text-sm text-white/60">{images.length.toLocaleString("pt-BR")} imagens encontradas</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{images.map(photo=><article key={photo.url} className="overflow-hidden rounded-xl border border-white/20 bg-white/5"><img loading="lazy" src={photo.url} alt={photo.name+" "+photo.device+" "+photo.index} className="aspect-[4/3] w-full object-cover"/><div className="p-3"><p className="truncate text-sm font-bold">{photo.name}</p><p className="text-xs text-white/50">{photo.device==="desktop"?"Desktop":"Mobile"} · {photo.index}</p><button className="mt-2 text-xs font-bold text-lime-300" onClick={()=>void navigator.clipboard.writeText(photo.url)}>Copiar link</button></div></article>)}</div></>}
  {tab==="videos"&&<><p className="mt-5 text-sm text-white/60">{visibleVideos.length} vídeos na biblioteca compartilhada</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{visibleVideos.map(v=><article key={v.url} className="rounded-xl border border-lime-300/35 bg-white/5 p-4"><h2 className="mb-3 font-bold">{v.niche} · {v.device==="desktop"?"Desktop 16:9":"Mobile 9:16"}</h2><video src={v.url} controls muted playsInline className="max-h-80 w-full rounded-lg bg-black"/><button className="mt-3 rounded-lg border border-white/25 px-3 py-2 text-sm" onClick={()=>void navigator.clipboard.writeText(v.url)}>Copiar link público</button></article>)}</div>
   <section className="mt-8 rounded-2xl border border-white/25 bg-white/5 p-5"><h2 className="text-xl font-bold">Adicionar vídeos</h2><p className="mt-2 text-sm text-white/60">Importação exclusiva com senha. MP4 até 45 MB por arquivo.</p><label className="mt-4 block text-sm text-white/80">Senha de autorização<input type="password" autoComplete="off" value={videoPassword} onChange={e=>setVideoPassword(e.target.value)} placeholder="Digite a senha para importar" className="mt-2 block w-full max-w-sm rounded-lg border border-white/25 bg-[#18221b] p-3 text-white"/></label><label className="mt-4 block text-sm text-white/80">Nicho do vídeo <select value={uploadNiche} onChange={e=>setUploadNiche(e.target.value)} className="ml-2 max-w-full rounded-lg border border-white/25 bg-[#18221b] px-3 py-2 text-white">{niches.map(n=><option key={n} value={nicheKey(n)}>{n}</option>)}</select></label><div className="mt-4 flex flex-wrap gap-3">{(["desktop","mobile"] as const).map(d=><label key={d} className="cursor-pointer rounded-xl bg-lime-300 px-4 py-3 font-bold text-[#142017]">{busy===d?"Enviando...":"Enviar "+(d==="desktop"?"Desktop 16:9":"Mobile 9:16")}<input className="sr-only" type="file" accept="video/mp4,.mp4" disabled={busy!==null||!videoPassword} onChange={e=>void upload(d,e)}/></label>)}</div>{videoStatus&&<p role="status" className="mt-4 text-lime-300">{videoStatus}</p>}{error&&<p role="alert" className="mt-4 text-red-300">{error}</p>}</section>
  </>}</>}
 </div></main>;
}
