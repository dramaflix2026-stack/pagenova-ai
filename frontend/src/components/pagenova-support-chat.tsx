"use client";

import {useEffect,useRef,useState, type FormEvent, type KeyboardEvent} from "react";
import {Bot,MessageCircle,Send,X,LoaderCircle,Minimize2,Sparkles} from "lucide-react";
import {usePathname} from "next/navigation";

type Message={role:"user"|"assistant";content:string};
const questions=[
 "Como criar um site com IA?",
 "Como clonar e editar um site?",
 "Como publicar minha landing page?",
 "Como funcionam meus créditos?",
];
export function PageNovaSupportChat(){
 const [open,setOpen]=useState(false);
 const [input,setInput]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [messages,setMessages]=useState<Message[]>([{
  role:"assistant",content:"Oi! 👋 Sou a PageNova IA. Posso te ajudar com sites, Landing Pages, clonagem, eBooks, CRM, créditos e qualquer funcionalidade da plataforma. O que você quer fazer?"
 }]);
 const path=usePathname()||"/app";
 const abort=useRef<AbortController|null>(null);
 const end=useRef<HTMLDivElement|null>(null);
 const inputRef=useRef<HTMLTextAreaElement|null>(null);
 useEffect(()=>{if(open)end.current?.scrollIntoView({behavior:"smooth",block:"end"});},[messages,open,busy]);
 useEffect(()=>{if(open)inputRef.current?.focus();},[open]);
 useEffect(()=>()=>abort.current?.abort(),[]);
 async function send(question?:string){
  const content=(question??input).trim();
  if(!content||busy)return;
  setError("");setInput("");
  const next:Message[]=[...messages,{role:"user",content}];
  setMessages([...next,{role:"assistant",content:""}]);setBusy(true);
  const controller=new AbortController();abort.current=controller;
  try{
   const res=await fetch("/api/support/chat",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({messages:next.slice(1),path}),signal:controller.signal,cache:"no-store",
   });
   if(!res.ok||!res.body){
    const body=await res.json().catch(()=>({})) as {error?:string};
    throw Error(body.error||"Não foi possível responder agora.");
   }
   const reader=res.body.getReader(),decoder=new TextDecoder();
   let pending="",assembled="";
   while(true){
    const {value,done}=await reader.read();
    if(done)break;
    pending+=decoder.decode(value,{stream:true}).replace(/\r\n/g,"\n");
    const frames=pending.split("\n\n");pending=frames.pop()||"";
    for(const frame of frames){
     for(const line of frame.split("\n")){
      if(!line.startsWith("data: "))continue;
      const data=line.slice(6);
      if(data==="[DONE]")continue;
      try{
       const item=JSON.parse(data) as {choices?:{delta?:{content?:string}}[]};
       const delta=item.choices?.[0]?.delta?.content;
       if(!delta)continue;
       assembled+=delta;
       const text=assembled;
       setMessages(prev=>prev.map((m,i)=>i===prev.length-1?{...m,content:text}:m));
      }catch{/* Ignore upstream heartbeat and non-content frames. */}
     }
    }
   }
   if(!assembled)throw Error("A resposta não chegou. Por favor, tente novamente.");
  }catch(e){
   if(controller.signal.aborted)return;
   const message=e instanceof Error?e.message:"Falha ao falar com o assistente.";
   setError(message);
   setMessages(prev=>prev.at(-1)?.role==="assistant"&&!prev.at(-1)?.content?prev.slice(0,-1):prev);
  }finally{setBusy(false);abort.current=null;}
 }
 function submit(e:FormEvent){e.preventDefault();void send();}
 function onKey(e:KeyboardEvent<HTMLTextAreaElement>){
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}
 }
 return <div className="pointer-events-none fixed inset-0 z-[150]">
  {open&&<div className="pointer-events-auto fixed bottom-[82px] right-3 flex h-[min(580px,calc(100dvh-100px))] w-[min(420px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#0c1716] text-white shadow-[0_20px_90px_rgba(0,0,0,.6)] sm:bottom-[92px] sm:right-6" role="dialog" aria-modal="false" aria-label="Conversa com a PageNova IA">
    <header className="flex items-center gap-3 border-b border-white/10 bg-[#102821] p-4">
     <div className="grid size-10 place-items-center rounded-xl bg-emerald-300 text-[#09251a]"><Bot className="size-6"/></div>
     <div className="min-w-0 flex-1">
      <p className="text-sm font-extrabold">PageNova IA <Sparkles className="ml-1 inline size-3.5 text-emerald-300"/></p>
      <p className="mt-0.5 text-[11px] text-white/60">Sua especialista nas ferramentas PageNova</p>
     </div>
     <button type="button" aria-label="Fechar chat" onClick={()=>setOpen(false)} className="rounded-lg p-2 text-white/70 hover:bg-white/10"><Minimize2 className="size-5"/></button>
    </header>
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
     {messages.map((m,i)=><div key={i} className={"flex "+(m.role==="user"?"justify-end":"justify-start")}>
       <div className={"max-w-[91%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 "+
        (m.role==="user"?"bg-emerald-300 text-[#09251a]":"border border-white/10 bg-[#192b2a] text-white/90")}>
        {m.content||<span className="flex items-center gap-2 text-white/50"><LoaderCircle className="size-4 animate-spin"/> Preparando resposta...</span>}
       </div>
      </div>)}
      <div ref={end}/>
    </div>
    <div className="border-t border-white/10 bg-[#10201f] px-4 py-3">
     {messages.length===1&&<div className="mb-3 flex gap-2 overflow-x-auto pb-1">
      {questions.map(q=><button key={q} type="button" onClick={()=>void send(q)} className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-[11px] text-emerald-100 hover:bg-emerald-400/10">{q}</button>)}
     </div>}
     {error&&<p role="alert" className="mb-2 text-xs leading-5 text-rose-300">{error}</p>}
     <form onSubmit={submit} className="flex items-end gap-2 rounded-xl border border-white/20 bg-[#071413] p-2 focus-within:border-emerald-400/50">
      <textarea ref={inputRef} rows={1} maxLength={1600} placeholder="Pergunte sobre qualquer ferramenta..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-white/40" aria-label="Mensagem para a PageNova IA"/>
      <button disabled={!input.trim()||busy} type="submit" aria-label="Enviar mensagem" className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-300 text-[#09251a] transition hover:bg-emerald-200 disabled:opacity-40">
       {busy?<LoaderCircle className="size-5 animate-spin"/>:<Send className="size-5"/>}
      </button>
     </form>
     <p className="mt-2 text-center text-[10px] text-white/40">A IA pode cometer erros. Não compartilhe senhas ou chaves de acesso.</p>
    </div>
   </div>}
   <button type="button" aria-label={open?"Fechar PageNova IA":"Conversar com a PageNova IA"} aria-expanded={open} onClick={()=>setOpen(v=>!v)}
    className="pointer-events-auto fixed bottom-4 right-4 flex size-14 items-center justify-center rounded-full border border-white/15 bg-emerald-300 text-[#05251b] shadow-[0_7px_35px_rgba(16,185,129,.35)] transition hover:scale-[1.05] hover:bg-emerald-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white sm:bottom-6 sm:right-6">
    {open?<X className="size-7"/>:<MessageCircle className="size-7"/>}
   </button>
  </div>;
}
