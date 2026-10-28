"use client";
import { useEffect, useRef, useState } from "react";

const TOTAL = 12;
const DB_NAME = "pagenova-preview-testimonials-v1";
const STORE = "images";
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
  setError("");try{await onUpload(number,file);}catch{setError("Não foi possível salvar. Verifique o armazenamento do navegador.");}
 };
 return <article className="relative aspect-[9/16] w-[225px] shrink-0 overflow-hidden rounded-[18px] border border-white/15 bg-[#111c14] shadow-[0_12px_36px_rgba(0,0,0,.4)] sm:w-[265px] lg:w-[300px]">
  {src?<img src={src} alt={`Conversa demonstrativa ${number}`} className="h-full w-full object-contain" decoding="async"/>:<div className="flex h-full flex-col items-center justify-center gap-5 px-5 text-center"><span className="text-5xl font-black text-[#b9f77a]">{String(number).padStart(2,"0")}</span><p className="text-sm text-white/70">Adicione a conversa {number} em formato 9:16</p><button type="button" disabled={disabled} onClick={()=>input.current?.click()} className="rounded-xl bg-[#b9f77a] px-5 py-3 text-sm font-extrabold text-[#10200c] hover:bg-[#d5ffad] disabled:opacity-50">{disabled?"Salvando...":"↑ Upload da imagem"}</button><input ref={input} type="file" accept="image/*" className="hidden" onChange={select} aria-label={`Enviar imagem da conversa ${number}`}/>{error&&<p role="alert" className="text-xs text-red-300">{error}</p>}</div>}
 </article>;
}
export default function Testimonials3D(){
 const [images,setImages]=useState<Record<number,string>>({});
 const [busy,setBusy]=useState<number|null>(null);
 const [loaded,setLoaded]=useState(false);
 const urls=useRef<string[]>([]);
 useEffect(()=>{let cancelled=false;readSavedImages().then(saved=>{if(cancelled)return;const result:Record<number,string>={};saved.forEach((blob,number)=>{const url=URL.createObjectURL(blob);urls.current.push(url);result[number]=url;});setImages(result);}).catch(()=>{}).finally(()=>{if(!cancelled)setLoaded(true);});return()=>{cancelled=true;urls.current.forEach(url=>URL.revokeObjectURL(url));urls.current=[];};},[]);
 const onUpload=async(number:number,file:File)=>{setBusy(number);try{await saveImage(number,file);const url=URL.createObjectURL(file);urls.current.push(url);setImages(prev=>({...prev,[number]:url}));}finally{setBusy(null);}};
 const complete=numbers.every(number=>Boolean(images[number]));
 return <section id="depoimentos" aria-labelledby="testimonials-title" className="pn-section-divider relative mt-20 scroll-mt-24 overflow-hidden py-16 sm:py-20">
  <div className="mx-auto mb-10 grid max-w-[1180px] gap-6 px-5 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-14"><div className="pt-2 text-xs font-extrabold uppercase tracking-[.2em] text-[#b9f77a]">04 <span className="mx-3 text-white/35">—</span> Experiências</div><div><h2 id="testimonials-title" className="max-w-[850px] text-4xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl">Veja como a <span className="text-[#b9f77a]">PageNova funciona na prática.</span></h2><p className="mt-4 text-sm font-medium text-[#d9ffb8]">Conversas demonstrativas criadas com IA. Não representam clientes nem resultados reais.</p><p className="mt-2 text-xs text-white/50">As imagens enviadas nesta prévia ficam salvas neste navegador, mesmo após atualizar a página. Não são publicadas para outros visitantes.</p></div></div>
  <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-white/10 py-6" aria-label="Galeria de 12 conversas ilustrativas"><div className={`pn-testimonials-track flex w-max gap-4 px-4 ${complete?"pn-testimonials-ready":""}`}>{numbers.map(number=><ImageSlot key={number} number={number} src={images[number]} onUpload={onUpload} disabled={!loaded||busy!==null}/>) }{complete&&numbers.map(number=><div key={`copy-${number}`} aria-hidden="true" className="aspect-[9/16] w-[225px] shrink-0 overflow-hidden rounded-[18px] border border-white/15 bg-[#111c14] sm:w-[265px] lg:w-[300px]"><img src={images[number]} alt="" className="h-full w-full object-contain"/></div>)}</div></div>
  <style>{`@keyframes pnTestimonialScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}.pn-testimonials-ready{animation:pnTestimonialScroll 110s linear infinite}.pn-testimonials-ready:hover{animation-play-state:paused}@media(prefers-reduced-motion:reduce){.pn-testimonials-ready{animation:none;max-width:100vw;overflow-x:auto}}`}</style>
 </section>;
}
