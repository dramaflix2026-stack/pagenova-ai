"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,Blocks,Check,Code2,Download,FileText,LoaderCircle,Paperclip,Plus,Send,Smartphone,Sparkles,Trash2,X} from "lucide-react";
import {VoiceButton} from "@/components/studio/VoiceButton";
import {sourceZip} from "@/lib/development/zip";
type Kind="apps"|"systems";
type FileItem={path:string;content:string};
type ChatMessage={role:"user"|"assistant";text:string};
type Project={name:string;summary:string;nextSteps:string[];files:FileItem[];conversation:ChatMessage[]};
const examples:Record<Kind,string[]>={
 apps:["Crie um app para agendar serviços com agenda e cadastro de clientes.","Monte um app de catálogo de produtos com favoritos e carrinho demonstrativo.","Quero um app para profissionais acompanharem tarefas e metas."],
 systems:["Crie um painel para acompanhar vendas, receitas e metas da empresa.","Monte um sistema de ordens de serviço com filtros e histórico local.","Desenvolva um sistema de agendamento com lista de clientes e calendário."]
};
export function DevelopmentModuleOverview({kind}:{kind:Kind}){
 const isApp=kind==="apps",name=isApp?"Aplicativos":"Sistemas",storageKey="pagenova-development-"+kind;
 const [prompt,setPrompt]=useState("");
 const [project,setProject]=useState<Project|null>(null);
 const [attachments,setAttachments]=useState<File[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[selected,setSelected]=useState("");
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{
  try{const raw=window.localStorage.getItem(storageKey);if(raw){const data=JSON.parse(raw) as Project;if(Array.isArray(data.files)&&Array.isArray(data.conversation))setProject(data);}}
  catch{}setLoaded(true);
 },[storageKey]);
 useEffect(()=>{if(!loaded)return;try{if(project)window.localStorage.setItem(storageKey,JSON.stringify(project));else window.localStorage.removeItem(storageKey);}catch{setError("Não foi possível salvar o rascunho neste navegador. Exporte um ZIP para preservar o projeto.");}},[project,loaded,storageKey]);
 async function imageFrame(file:File):Promise<File>{
  if(!file.type.startsWith("video/"))return file;
  return new Promise<File>((resolve,reject)=>{
   const url=URL.createObjectURL(file),video=document.createElement("video");video.preload="auto";video.muted=true;
   video.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Não foi possível analisar o vídeo."));};
   video.onloadeddata=()=>{
    const canvas=document.createElement("canvas"),scale=Math.min(1,1024/Math.max(video.videoWidth,video.videoHeight));
    canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
    canvas.getContext("2d")?.drawImage(video,0,0,canvas.width,canvas.height);
    canvas.toBlob(blob=>{URL.revokeObjectURL(url);if(blob)resolve(new File([blob],file.name+".jpg",{type:"image/jpeg"}));else reject(new Error("Não foi possível obter a imagem do vídeo."));},"image/jpeg",.8);
   };
   video.src=url;
  });
 }
 async function generate(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy||prompt.trim().length<12)return;
  setBusy(true);setError("");const request=prompt.trim();
  try{
   let requestText=request;
   if(attachments.length){
    const prepared=await Promise.all(attachments.map(imageFrame));
    const form=new FormData();form.append("mode","local");prepared.forEach(file=>form.append("files",file));
    const response=await fetch("/api/builder/analyze-attachments",{method:"POST",credentials:"same-origin",body:form});
    const info=await response.json().catch(()=>({})) as {summary?:string;error?:string};
    if(!response.ok||!info.summary)throw new Error(info.error||"Não foi possível interpretar anexos.");
    requestText+="\n\nREFERÊNCIAS ANEXADAS:\n"+info.summary;
   }
   const response=await fetch("/api/development/generate",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({kind,prompt:requestText,existing:project?.files||[]})
   });
   const data=await response.json().catch(()=>({})) as {name?:string;summary?:string;nextSteps?:string[];files?:FileItem[];error?:string};
   if(!response.ok||!data.files?.length)throw new Error(data.error||"Não foi possível montar os arquivos do projeto.");
   setProject({
    name:data.name||project?.name||"Projeto sem nome",summary:data.summary||"",nextSteps:data.nextSteps||[],files:data.files,
    conversation:[...(project?.conversation||[]),{role:"user",text:request},{role:"assistant",text:data.summary||"Arquivos atualizados."}],
   });
   setSelected(data.files[0]?.path||"");setPrompt("");setAttachments([]);
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível gerar o projeto. Seu rascunho foi preservado.");}
  finally{setBusy(false);}
 }
 function download(){
  if(!project?.files.length)return;
  const blob=sourceZip(project.files);
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=(project.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"pagenova-project")+".zip";
  document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 function clear(){
  if(!window.confirm("Apagar o rascunho guardado neste navegador? Exporte o ZIP se quiser preservar o código."))return;
  setProject(null);setPrompt("");setSelected("");setAttachments([]);setError("");
 }
 const file=project?.files.find(f=>f.path===selected)||project?.files[0];
 return <main className="min-h-screen bg-[#08130e] px-4 py-8 text-white sm:px-8">
  <div className="mx-auto max-w-6xl space-y-7">
   <header className="flex flex-wrap items-center justify-between gap-4">
    <div><Link href="/app/builder" className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white"><ArrowLeft className="h-4 w-4"/> Voltar ao Studio</Link>
     <div className="mt-5 flex items-center gap-3 text-emerald-300">{isApp?<Smartphone className="h-8 w-8"/>:<Blocks className="h-8 w-8"/>}<p className="text-xs font-bold uppercase tracking-[.16em]">PageNova · Desenvolvimento</p></div>
     <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Desenvolver {name}</h1>
     <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">Descreva sua ideia e gere um modelo de projeto {isApp?"Expo / React Native":"Next.js / React"} com arquivos reais. Sem API paga: o criador oferece estruturas funcionais pré-definidas, não código novo para qualquer instrução.</p>
    </div>
    {project&&<button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#073023]"><Download className="h-4 w-4"/> Exportar projeto ZIP</button>}
   </header>
   <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(330px,0.9fr)]">
    <section className="flex min-h-[550px] flex-col rounded-3xl border border-emerald-400/20 bg-[#10221a] p-5">
     <div className="flex items-center gap-3 border-b border-white/10 pb-4"><div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300"><Sparkles className="h-5 w-5"/></div><div><h2 className="font-bold">Assistente de desenvolvimento</h2><p className="text-xs text-white/50">Templates locais, sem APIs pagas</p></div></div>
     <div className="my-5 max-h-[500px] min-h-[170px] flex-1 space-y-3 overflow-y-auto">
      {!(project?.conversation.length)&&<p className="rounded-xl border border-white/10 bg-white/[.035] p-4 text-sm leading-7 text-white/65">Escolha seu objetivo (tarefas, agendamentos ou produtos). O modelo local gera um projeto inicial; novas funcionalidades precisam de desenvolvimento no código.</p>}
      {project?.conversation.map((item,i)=><p key={i} className={"max-w-[95%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-7 "+(item.role==="user"?"ml-auto bg-emerald-400/15 text-emerald-100":"mr-auto border border-white/10 bg-white/[.04] text-white/70")}>{item.text}</p>)}
      {busy&&<p role="status" className="flex items-center gap-2 text-xs text-emerald-300"><LoaderCircle className="h-4 w-4 animate-spin"/> Preparando arquivos do projeto...</p>}
     </div>
     <form onSubmit={generate} className="rounded-2xl border border-white/15 bg-[#07160e] p-3">
      <textarea rows={5} value={prompt} onChange={e=>setPrompt(e.target.value)} disabled={busy}
       placeholder={project?"O modo local preserva o código atual. Exporte o ZIP para alterações estruturais.":"Descreva seu aplicativo ou sistema em detalhes..."}
       className="w-full resize-y bg-transparent px-2 py-2 text-sm leading-7 text-white outline-none placeholder:text-white/35"/>
      {attachments.length>0&&<div className="my-2 flex flex-wrap gap-2">{attachments.map((f,i)=><span key={i} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/70"><Paperclip className="h-3.5 w-3.5"/><span className="max-w-32 truncate">{f.name}</span><button type="button" onClick={()=>setAttachments(a=>a.filter((_,j)=>j!==i))}><X className="h-3.5 w-3.5"/></button></span>)}</div>}
      <div className="flex items-center gap-2 border-t border-white/10 pt-3">
       <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-emerald-200" title="Adicionar imagens, PDF, texto ou vídeo"><Plus className="h-5 w-5"/><input type="file" className="sr-only" multiple accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,video/mp4,video/webm" onChange={e=>{setAttachments(current=>[...current,...Array.from(e.target.files||[])].slice(0,3));e.target.value="";}}/></label>
       <VoiceButton disabled={busy} onText={text=>setPrompt(v=>(v?v+" ":"")+text)}/>
       <span className="min-w-0 flex-1 text-xs text-white/35">Anexos e voz</span>
       <button type="submit" disabled={busy||prompt.trim().length<12} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-[#062f20] disabled:opacity-40">{busy?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}{project?"Preservar projeto":"Criar projeto"}</button>
      </div>
     </form>
     {error&&<p role="alert" className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">{error}</p>}
     <p className="mt-3 text-[11px] leading-5 text-white/40">Sem interpretação visual por IA: arquivos são identificados pelo nome; arquivos de texto são lidos. Seu código não é compilado ou executado nesta tela.</p>
    </section>
    <section className="min-w-0 rounded-3xl border border-white/10 bg-[#111b16] p-5">
     {!project?<><div className="flex items-center gap-2 font-bold text-white/85"><Code2 className="h-5 w-5 text-emerald-300"/> Ideias para começar</div><div className="mt-5 space-y-3">{examples[kind].map(example=><button type="button" key={example} onClick={()=>setPrompt(example)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.035] p-4 text-left text-sm leading-6 text-white/65 hover:border-emerald-400/30">{example}<ArrowRight className="h-4 w-4 shrink-0"/></button>)}</div></>:
     <><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="break-words text-lg font-bold">{project.name}</h2><button type="button" onClick={clear} className="rounded-lg p-2 text-white/40 hover:text-red-300" title="Limpar rascunho"><Trash2 className="h-4 w-4"/></button></div>
      <p className="mt-3 text-sm leading-7 text-white/60">{project.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300">{project.files.length} arquivos</span><span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50">Rascunho local no navegador</span></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
       <div className="max-h-[410px] space-y-1 overflow-y-auto">{project.files.map(item=><button key={item.path} type="button" onClick={()=>setSelected(item.path)} title={item.path} className={"flex w-full items-center gap-2 truncate rounded-lg px-2 py-2 text-left text-[11px] "+(file?.path===item.path?"bg-emerald-400/15 text-emerald-200":"text-white/50 hover:bg-white/5")}><FileText className="h-3.5 w-3.5 shrink-0"/><span className="truncate">{item.path}</span></button>)}</div>
       <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#07110c]"><p className="truncate border-b border-white/10 px-3 py-2 text-xs font-bold text-white/65">{file?.path||"Selecione um arquivo"}</p><pre className="max-h-[370px] overflow-auto p-3 text-[11px] leading-5 text-emerald-100/70"><code>{file?.content||""}</code></pre></div>
      </div>
      <h3 className="mt-6 text-sm font-bold">Próximos passos</h3><div className="mt-2 space-y-2">{project.nextSteps.map((step,i)=><p key={i} className="text-xs leading-6 text-white/55">{i+1}. {step}</p>)}</div>
      <button type="button" onClick={download} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-400/35 px-4 py-3 text-xs font-bold text-emerald-200 hover:bg-emerald-400/10"><Download className="h-4 w-4"/> Exportar código (.zip)</button>
     </>}
    </section>
   </div>
   <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[.045] p-5 text-sm leading-7 text-white/65"><strong className="text-amber-200">Publicação e validação.</strong> O código gerado é um ponto de partida real, mas precisa de teste de build, revisão de dependências, integração de backend quando necessária e configuração de deploy. {isApp?"A Google Play Store requer um projeto Android compilado e assinado, conta Google Play Console e aprovação da loja. Para iOS, uma conta Apple Developer e processo próprio. O ZIP não é APK/AAB ou IPA.":"Para disponibilizar o sistema on-line, instale as dependências, teste o build e faça deploy em hospedagem como Vercel. Dados persistentes exigem banco e autenticação configurados."}</div>
  </div>
 </main>;
}
