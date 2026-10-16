"use client";

import {useEffect,useRef,useState,type FormEvent,type KeyboardEvent} from "react";
import {Bot,MessageCircle,Send,X,LoaderCircle,Minimize2,Sparkles,Plus,History,Trash2,Brain,ChevronDown} from "lucide-react";
import {usePathname} from "next/navigation";

type Message={role:"user"|"assistant";content:string};
type Thread={id:string;title:string;updatedAt:string};
const WELCOME:Message={role:"assistant",content:"Oi! 💚 Sou a PageNova IA. Podemos conversar sobre negócios, ideias, marketing, tecnologia ou qualquer assunto. Me conte o que está pensando."};
const SUGGESTIONS=[
 "Me ajude a avaliar uma ideia de negócio.",
 "Quero pensar em uma estratégia de vendas.",
 "Vamos criar algo diferente juntos?",
];
const dateLabel=(value:string)=>{try{return new Date(value).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});}catch{return "";}};

export function PageNovaSupportChat(){
 const path=usePathname()||"/app";
 const landingPreview=path.startsWith("/app/landing");
 const [open,setOpen]=useState(false);
 const [input,setInput]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [deep,setDeep]=useState(false);
 const [messages,setMessages]=useState<Message[]>([WELCOME]);
 const [threadId,setThreadId]=useState<string|null>(null);
 const [threads,setThreads]=useState<Thread[]>([]);
 const [historyOpen,setHistoryOpen]=useState(false);
 const [loadingHistory,setLoadingHistory]=useState(true);
 const abort=useRef<AbortController|null>(null);
 const end=useRef<HTMLDivElement|null>(null);
 const inputRef=useRef<HTMLTextAreaElement|null>(null);
 const initialized=useRef(false);
 const threadRef=useRef<string|null>(null);
 threadRef.current=threadId;
 useEffect(()=>{if(open)end.current?.scrollIntoView({behavior:"smooth",block:"end"});},[messages,open,busy]);
 useEffect(()=>{if(open&&!historyOpen)inputRef.current?.focus();},[open,historyOpen]);
 useEffect(()=>()=>abort.current?.abort(),[]);
 useEffect(()=>{
  if(initialized.current)return;
  initialized.current=true;
  let canceled=false;
  async function loadHistory(){
   try{
    const response=await fetch("/api/support/history",{cache:"no-store",credentials:"same-origin"});
    if(!response.ok)throw Error("Histórico indisponível.");
    const data=await response.json() as {threads?:Thread[]};
    if(canceled)return;
    const list=Array.isArray(data.threads)?data.threads:[];
    setThreads(list);
    if(list[0]){
     const opened=await fetch("/api/support/history?threadId="+encodeURIComponent(list[0].id),{cache:"no-store"});
     if(opened.ok){
      const body=await opened.json() as {thread?:{messages?:Message[]}};
      if(!canceled&&Array.isArray(body.thread?.messages)){
       setMessages(body.thread!.messages!.length?body.thread!.messages!:[WELCOME]);
       setThreadId(list[0].id);
      }
     }
    }
   }catch{/* The assistant still works without history. */}
   finally{if(!canceled)setLoadingHistory(false);}
  }
  void loadHistory();
  return ()=>{canceled=true;};
 },[]);
 async function openThread(id:string){
  if(busy)return;
  setError("");setNotice("");setLoadingHistory(true);
  try{
   const response=await fetch("/api/support/history?threadId="+encodeURIComponent(id),{cache:"no-store"});
   const data=await response.json() as {thread?:{messages:Message[]};error?:string};
   if(!response.ok||!data.thread)throw Error(data.error||"Não foi possível abrir esta conversa.");
   setThreadId(id);setMessages(data.thread.messages.length?data.thread.messages:[WELCOME]);
   setHistoryOpen(false);setInput("");
  }catch(e){setError(e instanceof Error?e.message:"Falha ao abrir conversa.");}
  finally{setLoadingHistory(false);}
 }
 function newChat(){
  if(busy)return;
  setThreadId(null);setMessages([WELCOME]);setInput("");setError("");setNotice("");
  setHistoryOpen(false);
 }
 async function deleteThread(id:string){
  if(busy||!window.confirm("Excluir esta conversa permanentemente?"))return;
  try{
   const res=await fetch("/api/support/history?threadId="+encodeURIComponent(id),{method:"DELETE"});
   if(!res.ok)throw Error("Não foi possível excluir.");
   setThreads(current=>current.filter(t=>t.id!==id));
   if(threadRef.current===id)newChat();
  }catch{setError("Não foi possível excluir esta conversa.");}
 }
 async function deleteAll(){
  if(busy||!window.confirm("Apagar todas as conversas e as informações que você pediu para lembrar? Essa ação não pode ser desfeita."))return;
  try{
   const res=await fetch("/api/support/history",{method:"DELETE"});
   if(!res.ok)throw Error("Não foi possível apagar.");
   setThreads([]);newChat();setNotice("Histórico e memórias apagados.");
  }catch{setError("Não foi possível limpar o histórico.");}
 }
 async function send(question?:string){
  const content=(question??input).trim();
  if(!content||busy||loadingHistory)return;
  setError("");setNotice("");setInput("");
  const next:Message[]=[...messages.filter(m=>m!==WELCOME),{role:"user",content}];
  setMessages([...next,{role:"assistant",content:""}]);setBusy(true);
  const controller=new AbortController();abort.current=controller;
  let selected=threadRef.current;
  let assembled="",memorySaved=false;
  try{
   const res=await fetch("/api/support/chat",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({text:content,threadId:selected,deep,path}),
    signal:controller.signal,cache:"no-store"
   });
   if(!res.ok||!res.body){
    const json=await res.json().catch(()=>({})) as {error?:string};
    throw Error(json.error||"Não foi possível responder agora.");
   }
   const reader=res.body.getReader(),decoder=new TextDecoder();
   let buffer="";
   while(true){
    const {value,done}=await reader.read();
    if(done)break;
    buffer+=decoder.decode(value,{stream:true}).replace(/\r\n/g,"\n");
    const frames=buffer.split("\n\n");buffer=frames.pop()||"";
    for(const frame of frames){
     const kind=frame.split("\n").find(line=>line.startsWith("event: "))?.slice(7).trim();
     const parts=frame.split("\n").filter(line=>line.startsWith("data: ")).map(line=>line.slice(6));
     for(const part of parts){
      if(part==="[DONE]")continue;
      try{
       const data=JSON.parse(part) as {threadId?:string;mode?:string;error?:string;choices?:{delta?:{content?:string}}[]};
       if(kind==="pagenova-meta"&&data.threadId){
        selected=data.threadId;setThreadId(data.threadId);
        if(data.mode==="aprofundado")setNotice("Pensando com mais profundidade…");
        continue;
       }
       if(kind==="pagenova-memory-saved"){memorySaved=true;continue;}
       if(kind==="pagenova-error")throw Error(data.error||"A resposta foi interrompida.");
       const delta=data.choices?.[0]?.delta?.content;
       if(!delta)continue;
       assembled+=delta;
       const value=assembled;
       setMessages(current=>current.map((m,i)=>i===current.length-1?{...m,content:value}:m));
      }catch(e){if(kind==="pagenova-error")throw e;}
     }
    }
   }
   if(!assembled.trim())throw Error("A resposta não chegou. Tente novamente.");
   setNotice(memorySaved?"Informação guardada na sua memória privada.":"");
   if(selected){
    const id=selected;
    setThreads(current=>{
     const previous=current.find(t=>t.id===id);
     return [{id,title:previous?.title||content.slice(0,68),updatedAt:new Date().toISOString()},...current.filter(t=>t.id!==id)].slice(0,25);
    });
   }
  }catch(e){
   if(controller.signal.aborted)return;
   const message=e instanceof Error?e.message:"Falha ao falar com a IA.";
   setError(message);
   setMessages(current=>current.at(-1)?.role==="assistant"&&!current.at(-1)?.content?current.slice(0,-1):current);
  }finally{setBusy(false);abort.current=null;}
 }
 function submit(e:FormEvent){e.preventDefault();void send();}
 function onKey(e:KeyboardEvent<HTMLTextAreaElement>){
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}
 }
 return <div className="pointer-events-none fixed inset-0 z-[150]">
  {open&&<div className={"pointer-events-auto fixed right-3 flex w-[min(440px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#0c1716] text-white shadow-[0_20px_90px_rgba(0,0,0,.6)] sm:right-6 "+(landingPreview?"bottom-[184px] h-[min(600px,calc(100dvh-205px))]":"bottom-[82px] h-[min(640px,calc(100dvh-100px))] sm:bottom-[92px]")} role="dialog" aria-modal="false" aria-label="Conversa com a PageNova IA">
    <header className="flex items-center gap-2 border-b border-white/10 bg-[#102821] p-3">
     <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-300 text-[#09251a]"><Bot className="size-6"/></div>
     <div className="min-w-0 flex-1">
      <p className="text-sm font-extrabold">PageNova IA <Sparkles className="ml-1 inline size-3.5 text-emerald-300"/></p>
      <p className="mt-0.5 text-[11px] text-white/60">Para trocar ideias e pensar junto</p>
     </div>
     <button type="button" title="Nova conversa" aria-label="Nova conversa" onClick={newChat} disabled={busy} className="rounded-lg p-2 text-white/75 hover:bg-white/10 disabled:opacity-40"><Plus className="size-5"/></button>
     <button type="button" title="Histórico" aria-label="Histórico de conversas" aria-expanded={historyOpen} onClick={()=>setHistoryOpen(v=>!v)} disabled={busy} className="rounded-lg p-2 text-white/75 hover:bg-white/10 disabled:opacity-40"><History className="size-5"/></button>
     <button type="button" title="Fechar" aria-label="Fechar chat" onClick={()=>setOpen(false)} className="rounded-lg p-2 text-white/75 hover:bg-white/10"><Minimize2 className="size-5"/></button>
    </header>
    {historyOpen?<div className="flex min-h-0 flex-1 flex-col px-3 py-4">
      <div className="flex items-center justify-between gap-2 px-2">
       <strong className="text-sm">Suas conversas</strong>
       <button type="button" onClick={()=>void deleteAll()} disabled={!threads.length} className="flex items-center gap-1 text-[11px] text-rose-200 disabled:opacity-40"><Trash2 className="size-3.5"/> Limpar tudo</button>
      </div>
      <p className="mb-3 px-2 pt-2 text-[11px] leading-5 text-white/45">Histórico privado da sua conta. Você pode apagar suas conversas e as memórias solicitadas.</p>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
       {loadingHistory?<p className="p-3 text-xs text-white/50">Carregando conversas...</p>:threads.length===0?<p className="p-3 text-xs text-white/55">Nenhuma conversa salva ainda.</p>:threads.map(thread=>
        <div key={thread.id} className="flex items-center gap-1 rounded-lg border border-white/5 hover:bg-white/5">
         <button type="button" onClick={()=>void openThread(thread.id)} className="min-w-0 flex-1 px-3 py-3 text-left">
          <span className="block truncate text-xs font-semibold text-white/90">{thread.title}</span>
          <span className="text-[10px] text-white/40">{dateLabel(thread.updatedAt)}</span>
         </button>
         <button type="button" aria-label={"Excluir conversa "+thread.title} onClick={()=>void deleteThread(thread.id)} className="shrink-0 rounded-lg p-3 text-white/45 hover:text-rose-200"><Trash2 className="size-4"/></button>
        </div>)}
      </div>
      <button type="button" onClick={newChat} className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-xs font-bold text-[#09251a]"><Plus className="size-4"/> Nova conversa</button>
    </div>:<>
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
     {messages.map((m,i)=><div key={i} className={"flex "+(m.role==="user"?"justify-end":"justify-start")}>
       <div className={"max-w-[94%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 "+
        (m.role==="user"?"bg-emerald-300 text-[#09251a]":"border border-white/10 bg-[#192b2a] text-white/90")}>
        {m.content||<span className="flex items-center gap-2 text-white/50"><LoaderCircle className="size-4 animate-spin"/> Pensando...</span>}
       </div>
      </div>)}
      <div ref={end}/>
    </div>
    <div className="border-t border-white/10 bg-[#10201f] px-3 py-3">
     {messages.length===1&&<div className="mb-3 flex gap-2 overflow-x-auto pb-1">
      {SUGGESTIONS.map(q=><button key={q} type="button" onClick={()=>void send(q)} disabled={busy||loadingHistory} className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-[11px] text-emerald-100 disabled:opacity-50">{q}</button>)}
     </div>}
     {error&&<p role="alert" className="mb-2 text-xs leading-5 text-rose-300">{error}</p>}
     {notice&&<p role="status" className="mb-2 text-[11px] text-emerald-200/75">{notice}</p>}
     <form onSubmit={submit} className="flex items-end gap-2 rounded-xl border border-white/20 bg-[#071413] p-2 focus-within:border-emerald-400/50">
      <textarea ref={inputRef} rows={1} maxLength={2600} placeholder="O que vamos pensar juntos?" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-white/40" aria-label="Mensagem para a PageNova IA"/>
      <button disabled={!input.trim()||busy||loadingHistory} type="submit" aria-label="Enviar mensagem" className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-300 text-[#09251a] hover:bg-emerald-200 disabled:opacity-40">
       {busy?<LoaderCircle className="size-5 animate-spin"/>:<Send className="size-5"/>}
      </button>
     </form>
     <div className="mt-2 flex items-center justify-between gap-2">
      <button type="button" onClick={()=>setDeep(v=>!v)} aria-pressed={deep} disabled={busy}
        className={"inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition "+(deep?"bg-emerald-300/15 text-emerald-200":"text-white/55 hover:text-white")}>
        <Brain className="size-3.5"/> Pensar melhor {deep?<span>✓</span>:<ChevronDown className="size-3.5"/>}
      </button>
      <span className="text-[10px] text-white/40">Grátis · Uso justo · Chat privado</span>
     </div>
    </div>
    </>}
   </div>}
   <button type="button" aria-label={open?"Fechar PageNova IA":"Conversar com a PageNova IA"} aria-expanded={open} onClick={()=>setOpen(v=>!v)}
    className={"pointer-events-auto fixed right-3 flex items-center justify-center rounded-full border border-white/15 bg-emerald-300 text-[#05251b] shadow-[0_7px_35px_rgba(16,185,129,.35)] transition hover:scale-[1.05] hover:bg-emerald-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white "+(landingPreview?"bottom-[116px] size-12 sm:right-6":"bottom-4 right-4 size-14 sm:bottom-6 sm:right-6")}>
    {open?<X className="size-7"/>:<MessageCircle className="size-7"/>}
   </button>
  </div>;
}
