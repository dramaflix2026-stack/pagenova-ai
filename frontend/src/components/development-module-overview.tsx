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
 // App Studio is intentionally preview/result first. Technical information is opt-in.
 // Systems retain their existing workspace until their dedicated UX pass.
 if(isApp)return <main className="min-h-screen bg-[#0b100d] px-3 py-4 text-white sm:px-8 sm:py-7">
  <div className="mx-auto max-w-3xl space-y-4">
   <header className="flex items-center justify-between gap-2">
    <Link href="/app/builder" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white"><ArrowLeft className="size-4"/> Voltar</Link>
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300"><Smartphone className="size-3.5"/> App Studio</span>
   </header>
   <section className="rounded-2xl border border-emerald-400/20 bg-[#142019] p-4 sm:p-6" aria-label="Descrever aplicativo">
    <div className="mb-4 flex items-center gap-2">
     <Sparkles className="size-5 text-emerald-300"/>
     <h1 className="text-lg font-extrabold tracking-tight sm:text-2xl">{project?"O que você quer ajustar?":"Qual aplicativo você quer criar?"}</h1>
    </div>
    <form onSubmit={generate}>
     <label htmlFor="app-idea" className="sr-only">Descreva a ideia do aplicativo</label>
     <textarea id="app-idea" rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)} disabled={busy}
      placeholder={project?"Descreva o que quer ajustar no modelo inicial...":"Ex.: Quero um aplicativo para agendar serviços, cadastrar clientes e ver minha agenda."}
      className="min-h-32 w-full resize-y rounded-xl border border-white/15 bg-[#07160e] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/40 focus:border-emerald-400/60"/>
     {attachments.length>0&&<div className="mt-3 flex flex-wrap gap-2">{attachments.map((f,i)=><span key={i} className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-white/70">
      <Paperclip className="size-3.5 shrink-0"/><span className="max-w-36 truncate">{f.name}</span>
      <button type="button" aria-label={"Remover "+f.name} onClick={()=>setAttachments(a=>a.filter((_,j)=>j!==i))}><X className="size-3.5"/></button>
     </span>)}</div>}
     <div className="mt-3 flex flex-wrap items-center gap-2">
      <label className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xl border border-white/15 text-emerald-200" title="Anexar arquivos">
       <Plus className="size-5"/><input type="file" className="sr-only" multiple accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,video/mp4,video/webm"
        onChange={e=>{setAttachments(current=>[...current,...Array.from(e.target.files||[])].slice(0,3));e.target.value="";}}/>
      </label>
      <VoiceButton disabled={busy} onText={text=>setPrompt(v=>(v?v+" ":"")+text)}/>
      <button type="submit" disabled={busy||prompt.trim().length<12}
       className="ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#14220f] disabled:opacity-40">
       {busy?<LoaderCircle className="size-4 animate-spin"/>:<Sparkles className="size-4"/>}
       {busy?"Preparando...":project?"Enviar ideia":"Criar aplicativo"}
      </button>
     </div>
    </form>
    {error&&<p role="alert" className="mt-3 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}
    {!project&&<details className="mt-5 border-t border-white/10 pt-3">
     <summary className="cursor-pointer text-xs font-semibold text-emerald-200">Precisa de inspiração? Ver exemplos</summary>
     <div className="mt-3 flex flex-wrap gap-2">{examples.apps.map(example=><button key={example} type="button" onClick={()=>setPrompt(example)}
      className="rounded-lg border border-white/10 bg-white/[.035] px-3 py-2 text-left text-xs leading-5 text-white/70 hover:border-emerald-400/40">{example}</button>)}</div>
    </details>}
   </section>
   {project&&<section className="rounded-2xl border border-emerald-400/20 bg-[#142019] p-4 sm:p-5" aria-label="Resultado do aplicativo">
    <div className="flex items-start gap-3">
     <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><Smartphone className="size-5"/></div>
     <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold text-emerald-300"><Check className="mr-1 inline size-3.5"/> Projeto inicial disponível</p>
      <h2 className="mt-1 break-words text-lg font-bold sm:text-xl">{project.name}</h2>
     </div>
     <button type="button" onClick={clear} aria-label="Excluir rascunho do aplicativo" className="shrink-0 rounded-lg border border-white/10 p-2 text-white/45 hover:text-red-300"><Trash2 className="size-4"/></button>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
     <button type="button" onClick={download} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-[#14220f] hover:bg-emerald-300 sm:flex-none">
      <Download className="size-4"/> Exportar ZIP
     </button>
    </div>
    <div className="mt-3 space-y-2">
     <details className="group rounded-xl border border-white/10 bg-black/10">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-3 text-xs font-semibold text-white/80 [&::-webkit-details-marker]:hidden">
       <span>Sobre este projeto</span><span className="text-white/45 group-open:hidden">Ver +</span><span className="hidden text-white/45 group-open:inline">Fechar −</span>
      </summary>
      <div className="space-y-2 border-t border-white/10 px-3 py-3">
       <p className="text-xs leading-5 text-white/65">{project.summary}</p>
       <p className="text-[11px] text-white/45">{project.files.length} arquivos · Salvo neste navegador · Código-fonte inicial, não APK</p>
      </div>
     </details>
     <details className="group overflow-hidden rounded-xl border border-white/10 bg-black/10">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-white/85 [&::-webkit-details-marker]:hidden">
       <span className="flex items-center gap-2"><Code2 className="size-4 text-emerald-300"/> Ver código e arquivos</span>
       <span className="text-xs font-normal text-white/40 group-open:hidden">Opcional +</span>
       <span className="hidden text-xs font-normal text-white/40 group-open:block">Fechar −</span>
      </summary>
      <div className="grid gap-3 border-t border-white/10 p-3 sm:grid-cols-[160px_minmax(0,1fr)]">
       <div className="flex max-h-48 gap-1 overflow-x-auto sm:max-h-[360px] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden">
        {project.files.map(item=><button key={item.path} type="button" onClick={()=>setSelected(item.path)}
          title={item.path} className={"flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-[11px] sm:w-full sm:shrink sm:min-w-0 "+(file?.path===item.path?"bg-emerald-400/15 text-emerald-100":"bg-white/[.035] text-white/60 hover:bg-white/10")}>
          <FileText className="size-3.5 shrink-0"/><span className="max-w-36 truncate">{item.path}</span>
         </button>)}
       </div>
       <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#06120d]">
        <div className="truncate border-b border-white/10 px-3 py-2 text-[11px] font-semibold text-emerald-200/80">{file?.path||"Arquivo"}</div>
        <pre className="max-h-[330px] overflow-auto p-3 text-[11px] leading-5 text-emerald-100/75"><code>{file?.content||""}</code></pre>
       </div>
      </div>
     </details>
     <details className="group rounded-xl border border-white/10 bg-black/10">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-white/85 [&::-webkit-details-marker]:hidden">
       <span className="flex items-center gap-2"><FileText className="size-4 text-emerald-300"/> Como testar e publicar</span>
       <span className="text-xs font-normal text-white/45 group-open:hidden">Ver +</span>
       <span className="hidden text-xs font-normal text-white/45 group-open:block">Fechar −</span>
      </summary>
      <div className="space-y-2 border-t border-white/10 px-4 py-4 text-xs leading-6 text-white/65">
       <ol className="list-inside list-decimal space-y-1">
        {project.nextSteps.map((step,i)=><li key={i}>{step.replace(/^\s*\d+[\).]\s*/,"")}</li>)}
       </ol>
       <p className="pt-2 text-white/50">Antes de publicar na Play Store ou App Store, ainda são necessários testes, compilação, assinatura e contas de desenvolvedor. Backend, autenticação e notificações precisam ser implementados quando exigidos pelo aplicativo.</p>
      </div>
     </details>
     {!!project.conversation.length&&<details className="group rounded-xl border border-white/10 bg-black/10">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-white/75 [&::-webkit-details-marker]:hidden">
       Histórico da ideia <span className="text-xs text-white/40 group-open:hidden">Ver +</span>
       <span className="hidden text-xs text-white/40 group-open:block">Fechar −</span>
      </summary>
      <div className="max-h-64 space-y-2 overflow-y-auto border-t border-white/10 p-3">
       {project.conversation.slice(-8).map((message,i)=><p key={i} className={"rounded-lg px-3 py-2 text-xs leading-5 "+(message.role==="user"?"bg-emerald-400/10 text-emerald-100":"bg-white/5 text-white/65")}>{message.text}</p>)}
      </div>
     </details>}
    </div>
   </section>}
   <details className="rounded-xl border border-white/10 px-3 py-3 text-xs leading-5 text-white/50">
    <summary className="cursor-pointer font-semibold text-white/60">Sobre a geração gratuita</summary>
    <p className="mt-2">O gerador usa modelos de código locais, sem API paga. Ele entrega um projeto inicial Expo/React Native, não um aplicativo completo pronto para a loja. Anexos não são interpretados visualmente por IA e o código não é compilado aqui.</p>
   </details>
  </div>
 </main>;
 return <main className="min-h-screen bg-[#0b100d] px-4 py-8 text-white sm:px-8">
  <div className="mx-auto max-w-6xl space-y-7">
   <header className="flex flex-wrap items-center justify-between gap-4">
    <div><Link href="/app/builder" className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white"><ArrowLeft className="h-4 w-4"/> Voltar ao Studio</Link>
     <div className="mt-5 flex items-center gap-3 text-emerald-300">{isApp?<Smartphone className="h-8 w-8"/>:<Blocks className="h-8 w-8"/>}<p className="text-xs font-bold uppercase tracking-[.16em]">PageNova · Desenvolvimento</p></div>
     <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Protótipos de {name}</h1>
     <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">Descreva sua ideia e gere um modelo de projeto {isApp?"Expo / React Native":"Next.js / React"} com arquivos reais. Sem API paga: o criador oferece estruturas funcionais pré-definidas, não código novo para qualquer instrução.</p>
    </div>
    {project&&<button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#14220f]"><Download className="h-4 w-4"/> Exportar projeto ZIP</button>}
   </header>
   <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(330px,0.9fr)]">
    <section className="flex min-h-[550px] flex-col rounded-3xl border border-emerald-400/20 bg-[#142019] p-5">
     <div className="flex items-center gap-3 border-b border-white/10 pb-4"><div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300"><Sparkles className="h-5 w-5"/></div><div><h2 className="font-bold">Construtor de modelos iniciais</h2><p className="text-xs text-white/50">Templates locais, sem APIs pagas</p></div></div>
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
       <button type="submit" disabled={busy||prompt.trim().length<12} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-[#14220f] disabled:opacity-40">{busy?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}{project?"Preservar projeto":"Criar projeto"}</button>
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
       <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#0b100d]"><p className="truncate border-b border-white/10 px-3 py-2 text-xs font-bold text-white/65">{file?.path||"Selecione um arquivo"}</p><pre className="max-h-[370px] overflow-auto p-3 text-[11px] leading-5 text-emerald-100/70"><code>{file?.content||""}</code></pre></div>
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
