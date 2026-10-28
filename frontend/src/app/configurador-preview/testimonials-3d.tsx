"use client";
import { useEffect, useRef, useState } from "react";

const TOTAL = 12;
const STORAGE_API = "/api/configurador-preview/testimonials";
const DB_NAME = "pagenova-preview-testimonials-v1";
const STORE = "images";
const REQUEST_TIMEOUT_MS = 20000;
const numbers = Array.from({length:TOTAL},(_,i)=>i+1);
function openDatabase():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
}
async function readSavedImages():Promise<Map<number,Blob>>{
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{
  const transaction=db.transaction(STORE,"readonly");const store=transaction.objectStore(STORE);
  const result=new Map<number,Blob>();
  let pending=TOTAL;
  numbers.forEach(number=>{const req=store.get(number);req.onsuccess=()=>{if(req.result instanceof Blob)result.set(number,req.result);if(--pending===0)resolve(result);};req.onerror=()=>reject(req.error);});
  transaction.oncomplete=()=>db.close();transaction.onerror=()=>reject(transaction.error);
 });
}
async function saveImage(number:number,file:Blob){
 const db=await openDatabase();
 return new Promise<void>((resolve,reject)=>{
  const transaction=db.transaction(STORE,"readwrite");transaction.objectStore(STORE).put(file,number);
  transaction.oncomplete=()=>{db.close();resolve();};
  transaction.onerror=()=>{db.close();reject(transaction.error);};
 });
}
function ImageSlot({number,src,onUpload,disabled}:{number:number;src?:string;onUpload:(number:number,file:File)=>Promise<void>;disabled:boolean}){
 const input=useRef<HTMLInputElement>(null);
 const [error,setError]=useState("");
 const select=async(event:React.ChangeEvent<HTMLInputElement>)=>{
  const file=event.target.files?.[0];event.target.value="";if(!file)return;
  if(!file.type.startsWith("image/")){setError("Selecione uma imagem.");return;}
  if(file.size>12*1024*1024){setError("Imagem muito grande (máximo 12 MB).");return;}
  setError("");try{await onUpload(number,file);}catch(err){setError(err instanceof Error?(err.name==="TimeoutError"?"O envio demorou demais. Tente novamente.":err.message):"Falha ao salvar imagem.");}
 };
 return <article className="relative aspect-[9/16] w-[225px] shrink-0 overflow-hidden rounded-[18px] border border-white/15 bg-[#111c14] shadow-[0_12px_36px_rgba(0,0,0,.4)] sm:w-[265px] lg:w-[300px]">
  {src?<img src={src} alt={`Conversa demonstrativa ${number}`} className="h-full w-full object-contain" decoding="async"/>:<div className="flex h-full flex-col items-center justify-center gap-5 px-5 text-center"><span className="text-5xl font-black text-[#b9f77a]">{String(number).padStart(2,"0")}</span><p className="text-sm text-white/70">Adicione a conversa {number} em formato 9:16</p><button type="button" disabled={disabled} onClick={()=>input.current?.click()} className="rounded-xl bg-[#b9f77a] px-5 py-3 text-sm font-extrabold text-[#10200c] hover:bg-[#d5ffad] disabled:opacity-50">{disabled?"Salvando...":"↑ Upload da imagem"}</button><input id={`pn-upload-${number}`} ref={input} type="file" accept="image/*" className="hidden" onChange={select} aria-label={`Enviar imagem da conversa ${number}`}/>{error&&<p role="alert" className="text-xs text-red-300">{error}</p>}</div>}
 </article>;
}
export default function Testimonials3D(){
 const [images,setImages]=useState<Record<number,string>>({});
 const [busy,setBusy]=useState<number|null>(null);
 const [loaded,setLoaded]=useState(false);
 const [uploadNotice,setUploadNotice]=useState("");
 const [adminEmail,setAdminEmail]=useState("");
 const [adminPassword,setAdminPassword]=useState("");
 const [adminToken,setAdminToken]=useState("");
 const [loginBusy,setLoginBusy]=useState(false);
 const [loginError,setLoginError]=useState("");
 const urls=useRef<string[]>([]);
 useEffect(()=>{let cancelled=false;(async()=>{const result:Record<number,string>={};try{const saved=await readSavedImages();saved.forEach((blob,number)=>{const url=URL.createObjectURL(blob);urls.current.push(url);result[number]=url;});}catch{}try{const response=await fetch(STORAGE_API,{cache:"no-store",signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS)});if(response.ok){const remote=await response.json() as {images:Record<number,string>};Object.assign(result,remote.images||{});}}catch{}if(!cancelled){setImages(result);setLoaded(true);}})();return()=>{cancelled=true;urls.current.forEach(url=>URL.revokeObjectURL(url));urls.current=[];};},[]);
 const loginAdmin=async(event:React.FormEvent)=>{event.preventDefault();setLoginBusy(true);setLoginError("");try{const response=await fetch("https://kgbgwbodosglmonvrhyi.supabase.co/auth/v1/token?grant_type=password",{method:"POST",headers:{"Content-Type":"application/json",apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||""},body:JSON.stringify({email:adminEmail,password:adminPassword}),signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS)});const data=await response.json();if(!response.ok||!data.access_token)throw new Error("Email ou senha inválidos.");setAdminToken(data.access_token);setAdminPassword("");setUploadNotice("Login efetuado. Envie a imagem desejada.");}catch(err){setLoginError(err instanceof Error?err.message:"Falha no login.");}finally{setLoginBusy(false);}};
 const onUpload=async(number:number,file:File)=>{setBusy(number);setUploadNotice("");try{const form=new FormData();form.set("number",String(number));form.set("file",file);const token=adminToken;const response=await fetch(STORAGE_API,{method:"POST",headers:token?{Authorization:`Bearer ${token}`}:{},body:form,signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS)});if(!response.ok){const details=await response.json().catch(()=>({error:"Falha no servidor"})) as {error?:string};const message=response.status===401?"É necessário entrar com uma conta de administrador para salvar imagens permanentemente.":response.status===403?"Sua conta não tem permissão de administrador para editar depoimentos.":details.error||"Falha no servidor";setUploadNotice(message);throw new Error(message);}const data=await response.json() as {url:string};await saveImage(number,file).catch(()=>{});setImages(prev=>({...prev,[number]:data.url}));setUploadNotice(`Conversa ${number} salva permanentemente no servidor.`);}catch(err){if(!(err instanceof Error)||!uploadNotice)setUploadNotice(err instanceof Error?err.message:"Falha no envio da imagem.");throw err;}finally{setBusy(null);}};
 const complete=numbers.every(number=>Boolean(images[number]));
 return <section id="depoimentos" aria-labelledby="testimonials-title" className="pn-section-divider relative mt-20 scroll-mt-24 overflow-hidden py-16 sm:py-20">
  <div className="mx-auto mb-10 grid max-w-[1180px] gap-6 px-5 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-14"><div className="pt-2 text-xs font-extrabold uppercase tracking-[.2em] text-[#b9f77a]">04 <span className="mx-3 text-white/35">—</span> Experiências</div><div><h2 id="testimonials-title" className="max-w-[850px] text-4xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl">Veja como a <span className="text-[#b9f77a]">PageNova funciona na prática.</span></h2><div className="mt-5 flex flex-wrap gap-2" aria-label="Escolha qual conversa enviar">{numbers.filter(number=>!images[number]).map(number=><button key={number} type="button" disabled={!loaded||busy===number} onClick={()=>document.getElementById(`pn-upload-${number}`)?.click()} className="rounded-lg border border-[#b9f77a]/50 bg-[#b9f77a]/10 px-3 py-2 text-xs font-bold text-[#b9f77a] hover:bg-[#b9f77a]/20 disabled:opacity-40">+ Conversa {number}</button>)}</div></div></div>
  <div className="mx-auto mb-5 max-w-[1100px] px-5"><details className="rounded-xl border border-white/15 bg-[#111c14] p-4"><summary className="cursor-pointer text-sm font-bold text-[#b9f77a]">{adminToken?"Admin conectado — gerenciar acesso":"Administrador — entrar para enviar imagens"}</summary>{adminToken?<button type="button" className="mt-3 rounded-lg border border-white/25 px-4 py-2 text-sm text-white" onClick={()=>{setAdminToken("");setUploadNotice("Sessão administrativa encerrada.");}}>Sair do modo administrador</button>:<form onSubmit={loginAdmin} className="mt-4 flex flex-wrap items-end gap-3"><label className="text-xs text-white/75">Email de administrador<input type="email" required autoComplete="username" value={adminEmail} onChange={event=>setAdminEmail(event.target.value)} className="mt-1 block rounded-lg border border-white/30 bg-black/40 p-2 text-white"/></label><label className="text-xs text-white/75">Senha<input type="password" required autoComplete="current-password" value={adminPassword} onChange={event=>setAdminPassword(event.target.value)} className="mt-1 block rounded-lg border border-white/30 bg-black/40 p-2 text-white"/></label><button type="submit" disabled={loginBusy} className="rounded-lg bg-[#b9f77a] px-4 py-2 font-bold text-black">{loginBusy?"Entrando...":"Entrar"}</button>{loginError&&<span role="alert" className="text-sm text-red-300">{loginError}</span>}</form>}</details></div>
  {uploadNotice&&<div role="status" aria-live="assertive" className="sticky top-24 z-50 mx-auto mb-5 max-w-[1100px] rounded-xl border border-[#b9f77a]/50 bg-[#142318] px-5 py-4 text-sm font-semibold text-white shadow-xl">{uploadNotice} <button type="button" onClick={()=>setUploadNotice("")} className="ml-4 rounded border border-white/30 px-3 py-1">Fechar</button></div>}
  <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-white/10 py-6" aria-label="Galeria de 12 conversas ilustrativas"><div className="pn-testimonials-track pn-testimonials-ready flex w-max gap-4 px-4">{numbers.map(number=><ImageSlot key={number} number={number} src={images[number]} onUpload={onUpload} disabled={!loaded||busy===number}/>) }{numbers.map(number=><div key={`copy-${number}`} aria-hidden="true" className="pointer-events-none aspect-[9/16] w-[225px] shrink-0 overflow-hidden rounded-[18px] border border-white/15 bg-[#111c14] sm:w-[265px] lg:w-[300px]">{images[number]?<img src={images[number]} alt="" className="h-full w-full object-contain"/>:<div className="grid h-full place-items-center text-4xl font-black text-[#b9f77a]/40">{String(number).padStart(2,"0")}</div>}</div>)}</div></div>
  <style>{`@keyframes pnTestimonialScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}.pn-testimonials-ready{animation:pnTestimonialScroll 80s linear infinite}.pn-testimonials-ready:hover,.pn-testimonials-ready:focus-within{animation-play-state:paused}@media(prefers-reduced-motion:reduce){.pn-testimonials-ready{animation:none;max-width:100vw;overflow-x:auto}}`}</style>
 </section>;
}
