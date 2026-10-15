"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardList, Copy,
  Eye, FilePenLine, Globe2, LoaderCircle, Plus, Save, Sparkles, Trash2, Paperclip, Video, X, BarChart3,
} from "lucide-react";
import { type FormInput, type FormQuestion, type PageNovaForm, type FormSubmission, normalizeForm } from "@/lib/forms/schema";
import {MediaImageField} from "@/components/studio/MediaImageField";
import {VoiceButton} from "@/components/studio/VoiceButton";
import {downloadStudioCsv} from "@/lib/studio-response-export";

type Screen = "start" | "review";
type Tab = "questions" | "preview" | "responses";
const KINDS: Record<string,string> = {
  leads:"Captura de leads",quiz:"Quiz interativo",application:"Formulário de aplicação",survey:"Pesquisa",
};
const TYPES: {value:FormQuestion["type"];label:string}[] = [
  {value:"text",label:"Texto curto"},{value:"email",label:"E-mail"},
  {value:"tel",label:"Telefone"},{value:"textarea",label:"Texto longo"},
  {value:"select",label:"Múltipla escolha"},
];
const fieldClass="w-full rounded-xl border border-white/[.13] bg-[#090d13] px-4 py-3 text-sm text-white outline-none transition focus:border-[#36dfae] focus:ring-2 focus:ring-[#36dfae]/10";
function formatDate(value:string){try{return new Date(value).toLocaleDateString("pt-BR");}catch{return "";}}
function feedbackText(err:unknown):string{return err instanceof Error?err.message:"Não foi possível concluir a operação.";}
async function jsonRequest<T>(url:string,body:unknown):Promise<T>{
  const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"});
  const data=await res.json().catch(()=>({})) as {error?:string}&T;
  if(!res.ok)throw new Error(data.error||"O servidor não concluiu a solicitação.");
  return data;
}

export default function FormulariosPage(){
  const [screen,setScreen]=useState<Screen>("start");
  const [prompt,setPrompt]=useState("");
  const [form,setForm]=useState<PageNovaForm|null>(null);
  const [saved,setSaved]=useState<PageNovaForm[]>([]);
  const [isLoadingList,setIsLoadingList]=useState(true);
  const [isGenerating,setIsGenerating]=useState(false);
  const [isSaving,setIsSaving]=useState(false);
  const [isPublishing,setIsPublishing]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [tab,setTab]=useState<Tab>("questions");
  const [previewIndex,setPreviewIndex]=useState(0);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [copied,setCopied]=useState(false);
  const [baseUrl,setBaseUrl]=useState("");
  const [responses,setResponses]=useState<FormSubmission[]>([]);
  const [loadingResponses,setLoadingResponses]=useState(false);
  const [attachments,setAttachments]=useState<File[]>([]);

  async function loadSaved() {
    try{
      const res=await fetch("/api/forms",{cache:"no-store"});
      const data=await res.json().catch(()=>({})) as {forms?:PageNovaForm[];error?:string};
      if(!res.ok)throw new Error(data.error||"Não foi possível carregar os formulários.");
      setSaved(Array.isArray(data.forms)?data.forms:[]);
    }catch(cause){setError(feedbackText(cause));}
    finally{setIsLoadingList(false);}
  }
  useEffect(()=>{void loadSaved();setBaseUrl(window.location.origin);},[]);
  const edit=(patch:Partial<PageNovaForm>)=>{
    setForm(current=>current?{...current,...patch}:current);
    setDirty(true);setNotice("");setError("");
  };
  const editQuestion=(id:string,patch:Partial<FormQuestion>)=>{
    if(!form)return;
    edit({fields:form.fields.map(q=>q.id===id?{...q,...patch}:q)});
  };
  function openDraft(draft:PageNovaForm) {
    setForm(draft);setPrompt(draft.intent||"");setDirty(false);
    setTab("questions");setPreviewIndex(0);setScreen("review");setResponses([]);
    setError("");setNotice("");setCopied(false);
  }
  async function openPublishedResponses(draft:PageNovaForm){
    openDraft(draft);
    setTab("responses");setLoadingResponses(true);
    try{
      const response=await fetch("/api/forms/"+encodeURIComponent(draft.id)+"/responses",{cache:"no-store"});
      const body=await response.json().catch(()=>({})) as {responses?:FormSubmission[];error?:string};
      if(!response.ok)throw new Error(body.error||"Não foi possível carregar as respostas.");
      setResponses(body.responses||[]);
    }catch(err){setError(feedbackText(err));}
    finally{setLoadingResponses(false);}
  }
  function reset(){
    if(dirty&&!window.confirm("Existem alterações não salvas. Deseja voltar mesmo assim?"))return;
    setScreen("start");setForm(null);setError("");setNotice("");setCopied(false);
  }
  async function generate(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(isGenerating)return;
    const request=prompt.trim();
    if(request.length<20){setError("Conte um pouco mais sobre a ideia do formulário (pelo menos 20 caracteres).");return;}
    setError("");setNotice("");setIsGenerating(true);
    try{
      let enriched=request;
      if(attachments.length){
        const payload=new FormData();
        const prepared=await Promise.all(attachments.map(async file=>{
          if(!file.type.startsWith("video/"))return file;
          return await new Promise<File>((resolve,reject)=>{
            const element=document.createElement("video");
            const uri=URL.createObjectURL(file);
            element.preload="auto";element.muted=true;
            const fail=()=>{URL.revokeObjectURL(uri);reject(new Error("Não foi possível extrair um quadro deste vídeo."));};
            element.onerror=fail;
            element.onloadeddata=()=>{
              const canvas=document.createElement("canvas");
              const ratio=Math.min(1,1024/Math.max(element.videoWidth,element.videoHeight));
              canvas.width=Math.max(1,Math.round(element.videoWidth*ratio));
              canvas.height=Math.max(1,Math.round(element.videoHeight*ratio));
              canvas.getContext("2d")?.drawImage(element,0,0,canvas.width,canvas.height);
              canvas.toBlob(blob=>{URL.revokeObjectURL(uri);if(blob)resolve(new File([blob],file.name+".jpg",{type:"image/jpeg"}));else fail();},"image/jpeg",.78);
            };
            element.src=uri;
          });
        }));
        prepared.forEach(file=>payload.append("files",file));
        const response=await fetch("/api/builder/analyze-attachments",{method:"POST",body:payload,credentials:"same-origin"});
        const data=await response.json().catch(()=>({})) as {summary?:string;error?:string};
        if(!response.ok||!data.summary)throw new Error(data.error||"Não foi possível analisar os anexos.");
        enriched+="\n\nREFERÊNCIAS ENVIADAS (visuais ou documentos):\n"+data.summary;
      }
      const result=await jsonRequest<{form:FormInput}>("/api/forms/generate",{prompt:enriched});
      // Validate the model output again at the UI boundary.
      const data=normalizeForm(result.form);
      setForm({...data,id:"",updatedAt:"",publishedAt:null});
      setDirty(true);setScreen("review");setTab("questions");setPreviewIndex(0);
      setNotice("A IA montou as perguntas. Você pode alterar tudo antes de salvar.");
    }catch(cause){setError(feedbackText(cause));}
    finally{setIsGenerating(false);}
  }
  async function saveForm(current:PageNovaForm):Promise<PageNovaForm>{
    const payload=normalizeForm(current);
    const result=await jsonRequest<{form:PageNovaForm}>("/api/forms",{
      id:current.id||undefined,form:payload,
    });
    setForm(result.form);setDirty(false);
    await loadSaved();
    return result.form;
  }
  async function save() {
    if(!form||isSaving||isPublishing)return;
    setIsSaving(true);setError("");setNotice("");
    try{await saveForm(form);setNotice("Rascunho salvo na sua conta. Você pode continuar depois.");}
    catch(cause){setError(feedbackText(cause));}
    finally{setIsSaving(false);}
  }
  async function publish(){
    if(!form||isSaving||isPublishing)return;
    setIsPublishing(true);setNotice("");setError("");
    try{
      const savedForm=dirty||!form.id?await saveForm(form):form;
      const published=await jsonRequest<{form:PageNovaForm;url:string}>(
        "/api/forms/"+encodeURIComponent(savedForm.id)+"/publish",{});
      setForm(published.form);setDirty(false);
      await loadSaved();
      setNotice("Formulário publicado! Compartilhe o link abaixo.");
    }catch(cause){setError(feedbackText(cause));}
    finally{setIsPublishing(false);}
  }
  async function loadResponses(){
    if(!form?.id)return;
    setTab("responses");setError("");setLoadingResponses(true);
    try {
      const response=await fetch("/api/forms/"+encodeURIComponent(form.id)+"/responses",{cache:"no-store"});
      const body=await response.json().catch(()=>({})) as {error?:string;responses?:FormSubmission[]};
      if(!response.ok)throw new Error(body.error||"Não foi possível carregar as respostas.");
      setResponses(Array.isArray(body.responses)?body.responses:[]);
    }catch(cause){setError(feedbackText(cause));}
    finally{setLoadingResponses(false);}
  }
  async function copyLink() {
    if(!form?.id)return;
    try{
      await navigator.clipboard.writeText(window.location.origin+"/f/"+form.id);
      setCopied(true);setNotice("Link copiado.");
    }catch{setError("Não foi possível copiar automaticamente. Abra o link e copie o endereço.");}
  }
  function addQuestion(){
    if(!form||form.fields.length>=20)return;
    const item:FormQuestion={id:crypto.randomUUID(),label:"Nova pergunta",type:"text",required:true,options:[]};
    edit({fields:[...form.fields,item]});
  }
  const publishBusy=isPublishing||isSaving;
  const published=Boolean(form?.id&&form.publishedAt);
  const publishedLink=form?.id?"/f/"+form.id:"";
  return <main className="min-h-[calc(100svh-120px)] bg-[#090c11] px-4 py-8 text-white sm:px-6 sm:py-12">
    {screen==="start"?
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center pt-3 pb-12 sm:pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[.06] px-4 py-2 text-xs font-bold uppercase tracking-[.17em] text-emerald-300">
            <Sparkles className="h-4 w-4"/> PageNova AI
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">Que formulário vamos criar?</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
            Conte sua ideia com suas palavras. A IA cria as perguntas, organiza a sequência e prepara o formulário para você revisar.
          </p>
        </div>
        <form onSubmit={generate} className="mt-8 w-full max-w-2xl rounded-[24px] border border-emerald-400/[.16] bg-gradient-to-b from-[#121b1b] to-[#11151b] p-4 shadow-[0_22px_60px_rgba(0,0,0,.2)] sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/[.1] text-emerald-300" aria-hidden="true">
              <Sparkles className="h-5 w-5"/>
            </span>
            <div className="min-w-0 flex-1">
              <label htmlFor="form-idea" className="block text-sm font-bold text-white/90">
                Converse com a IA
              </label>
              <p className="mt-0.5 text-xs text-white/45">Descreva sua ideia para começar</p>
            </div>
            <span className="rounded-full border border-emerald-400/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300/80">IA</span>
          </div>
          <textarea id="form-idea" value={prompt} rows={5}
            disabled={isGenerating} onChange={e=>setPrompt(e.target.value)}
            placeholder="Ex.: Quero um formulário para uma imobiliária descobrir se o cliente deseja comprar ou alugar, a região, o orçamento e como prefere ser atendido."
            className={fieldClass+" min-h-[132px] resize-y rounded-[18px] border-white/10 bg-[#090e12] text-base leading-7 placeholder:text-white/30"}/>
          {attachments.length>0&&<div className="mt-3 flex flex-wrap gap-2">{attachments.map((file,i)=><span key={i} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65"><Paperclip className="h-3.5 w-3.5"/><span className="max-w-40 truncate">{file.name}</span><button type="button" aria-label={"Remover "+file.name} onClick={()=>setAttachments(a=>a.filter((_,index)=>index!==i))}><X className="h-3.5 w-3.5"/></button></span>)}</div>}
          <div className="mt-3 flex items-center gap-2">
            <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-emerald-200" title="Adicionar imagens, PDF, TXT ou vídeo"><Plus className="h-5 w-5"/><input type="file" className="sr-only" multiple accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,video/mp4,video/webm" onChange={e=>{setAttachments(current=>[...current,...Array.from(e.target.files||[])].slice(0,3));e.target.value="";}}/></label>
            <VoiceButton disabled={isGenerating} onText={text=>setPrompt(current=>(current?current+" ":"")+text)}/>
            <span className="text-xs text-white/45">+ anexos e vídeo · microfone para ditar</span>
          </div>
          <button disabled={isGenerating||prompt.trim().length<20} type="submit"
            className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#10d6a1] px-5 py-3.5 text-sm font-bold text-[#07271e] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-45 sm:text-base">
            {isGenerating?<><LoaderCircle className="h-5 w-5 animate-spin"/> Criando perguntas com IA...</>:<>
              <Sparkles className="h-5 w-5"/> Gerar meu formulário <ArrowRight className="h-4 w-4"/></>}
          </button>
          <p className="mt-3 text-center text-[11px] leading-5 text-white/45">
            A IA gera um rascunho para revisão. Nada é publicado automaticamente.
          </p>
          {error&&<p role="alert" className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-center text-sm text-red-200">{error}</p>}
        </form>
        <section aria-labelledby="saved-forms-title" className="mt-12 w-full max-w-3xl border-t border-white/[.08] pt-8 sm:mt-14">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-1">
            <div>
              <h2 id="saved-forms-title" className="text-lg font-bold tracking-tight text-white sm:text-xl">Seus formulários</h2>
              <p className="mt-1 text-xs text-white/45">Acesse seus rascunhos e formulários publicados.</p>
            </div>
            {!isLoadingList&&<span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5 text-xs font-medium text-white/55">
              {saved.length} {saved.length===1?"formulário":"formulários"}
            </span>}
          </div>
          {isLoadingList?<div role="status" className="rounded-2xl border border-white/10 bg-white/[.025] px-5 py-8 text-center text-sm text-white/45">Carregando seus formulários...</div>
          :saved.length===0?<div className="rounded-2xl border border-dashed border-white/10 bg-white/[.025] px-5 py-9 text-center">
            <ClipboardList className="mx-auto h-7 w-7 text-emerald-300/60" aria-hidden="true"/>
            <p className="mt-3 text-sm font-semibold text-white/75">Seu primeiro formulário começa aqui</p>
            <p className="mt-1 text-xs text-white/45">Gere um formulário com a IA e salve para continuar depois.</p>
          </div>
          :<div className="grid gap-3 sm:grid-cols-2">
            {saved.map(item=><div key={item.id} className="min-w-0"><button type="button" onClick={()=>openDraft(item)}
              aria-label={`Editar formulário: ${item.title}`}
              className="group relative flex min-h-[178px] w-full flex-col overflow-hidden rounded-[20px] border border-white/[.1] bg-gradient-to-br from-[#14231f] via-[#101b1a] to-[#0d1417] p-4 text-left shadow-[0_12px_34px_rgba(0,0,0,.13)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-400/40 hover:shadow-[0_16px_38px_rgba(0,0,0,.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:min-h-[188px] sm:p-5">
              <span className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-400/[.045] blur-2xl" aria-hidden="true"/>
              <span className="relative flex w-full items-start justify-between gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/[.09] text-emerald-300">
                  <ClipboardList className="h-5 w-5" aria-hidden="true"/>
                </span>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.06em] ${item.publishedAt
                  ?"border-emerald-400/25 bg-emerald-400/[.1] text-emerald-300"
                  :"border-white/10 bg-white/[.045] text-white/55"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${item.publishedAt?"bg-emerald-400":"bg-white/35"}`} aria-hidden="true"/>
                  {item.publishedAt?"Publicado":"Rascunho"}
                </span>
              </span>
              <span className="relative mt-3 block w-full">
                <span className="line-clamp-2 break-words text-[15px] font-bold leading-[1.45] text-white/95 sm:text-base">{item.title}</span>
                <span className="mt-1.5 block text-xs text-white/45">{KINDS[item.kind]||"Formulário"} · {formatDate(item.updatedAt)}</span>
              </span>
              <span className="relative mt-auto flex w-full items-center justify-between gap-2 border-t border-white/[.09] pt-3.5 text-xs">
                <span className="text-white/45">{item.fields.length} {item.fields.length===1?"pergunta":"perguntas"}</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300 transition group-hover:text-emerald-200">
                  Continuar edição <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true"/>
                </span>
              </span>
            </button>
            {item.publishedAt&&<button type="button" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 px-4 py-3 text-xs font-bold text-emerald-200 hover:bg-emerald-400/10" onClick={()=>void openPublishedResponses(item)}><BarChart3 className="h-4 w-4"/> Ver respostas</button>}
            </div>)}
          </div>}
        </section>
      </div>
      :form&&<div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-5 text-center">
          <button type="button" onClick={reset} className="mx-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white">
            <ArrowLeft className="h-4 w-4"/> Meus formulários
          </button>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[.06] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300">
            <CheckCircle2 className="h-4 w-4"/> Formulário criado
          </span>
          <h1 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">
            Revise e personalize
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-6 text-white/50">
            Todas as perguntas podem ser alteradas. Salve o rascunho quando quiser e publique somente quando estiver pronto.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" disabled={publishBusy} onClick={()=>void save()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/[.06] disabled:opacity-40">
              {isSaving?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>} Salvar rascunho
            </button>
            <button type="button" disabled={publishBusy} onClick={()=>void publish()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#10d6a1] px-5 py-3 text-sm font-bold text-[#042b1e] hover:bg-emerald-300 disabled:opacity-40">
              {isPublishing?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Globe2 className="h-4 w-4"/>}
              {published?"Atualizar publicação":"Publicar formulário"}
            </button>
          </div>
          <p className="text-xs text-white/35">{dirty?"Alterações ainda não salvas":published?"Publicação disponível":"Rascunho salvo"}{form.updatedAt?" · "+formatDate(form.updatedAt):""}</p>
        </header>
        {error&&<p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/[.07] px-4 py-3 text-center text-sm text-red-200">{error}</p>}
        {notice&&<p role="status" className="rounded-xl border border-emerald-400/25 bg-emerald-400/[.07] px-4 py-3 text-center text-sm text-emerald-200">{notice}</p>}
        {published&&<div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[.05] p-4 text-center">
          <p className="text-sm font-semibold text-emerald-300">Seu formulário está publicado</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <a href={publishedLink} target="_blank" rel="noopener noreferrer" className="max-w-full break-all text-sm text-white underline underline-offset-4">{baseUrl?baseUrl+publishedLink:publishedLink}</a>
            <button type="button" onClick={()=>void copyLink()} className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
              {copied?<Check className="h-3.5 w-3.5"/>:<Copy className="h-3.5 w-3.5"/>} {copied?"Copiado":"Copiar link"}
            </button>
            <button type="button" onClick={()=>void loadResponses()} className="rounded-lg border border-emerald-400/30 px-3 py-2 text-xs font-semibold text-emerald-200">
              Ver respostas
            </button>
          </div>
          {dirty&&<p className="mt-2 text-xs text-white/50">Para atualizar o link público com suas alterações, clique em Atualizar publicação.</p>}
        </div>}
        <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.025] p-1.5">
          <button type="button" onClick={()=>setTab("questions")} aria-pressed={tab==="questions"}
            className={"flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold "+(tab==="questions"?"bg-emerald-400/15 text-emerald-300":"text-white/50")}>
            <FilePenLine className="h-4 w-4"/> Editar perguntas
          </button>
          <button type="button" onClick={()=>{setTab("preview");setPreviewIndex(0);}} aria-pressed={tab==="preview"}
            className={"flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold "+(tab==="preview"?"bg-emerald-400/15 text-emerald-300":"text-white/50")}>
            <Eye className="h-4 w-4"/> Visualizar
          </button>
          {published&&<button type="button" onClick={()=>void loadResponses()} aria-pressed={tab==="responses"}
            className={"flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-3 text-sm font-semibold "+(tab==="responses"?"bg-emerald-400/15 text-emerald-300":"text-white/50")}>
            <ClipboardList className="h-4 w-4"/> Respostas
          </button>}
        </div>
        {tab==="questions"?
          <section className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-[#12151c] p-5 sm:p-7">
              <h2 className="mb-5 text-center text-base font-semibold text-emerald-300">Apresentação do formulário</h2>
              <label htmlFor="form-title" className="block text-sm font-medium text-white/70">Título</label>
              <input id="form-title" maxLength={100} className={fieldClass+" mt-2"} value={form.title}
                onChange={e=>edit({title:e.target.value})}/>
              <label htmlFor="form-description" className="mt-5 block text-sm font-medium text-white/70">Descrição</label>
              <textarea id="form-description" rows={3} maxLength={350} className={fieldClass+" mt-2"}
                value={form.description} onChange={e=>edit({description:e.target.value})}/>
              <MediaImageField label="Imagem da capa" value={form.coverImageUrl} onChange={coverImageUrl=>edit({coverImageUrl})}/>
              <MediaImageField label="Imagem de fundo" value={form.backgroundImageUrl} onChange={backgroundImageUrl=>edit({backgroundImageUrl})}/>
              <p className="mt-5 text-xs font-semibold text-white/65">Tema visual</p><div className="mt-2 flex flex-wrap gap-2">{(["emerald","rose","midnight"] as const).map((theme,i)=><button key={theme} type="button" aria-pressed={(form.visualTheme||"emerald")===theme} onClick={()=>edit({visualTheme:theme})} className={"rounded-lg border px-4 py-2 text-xs font-bold "+((form.visualTheme||"emerald")===theme?"border-emerald-400 bg-emerald-400/10":"border-white/10")}>{["Verde","Rosé","Noturno"][i]}</button>)}</div>
              <label className="mt-5 flex items-center gap-3 text-xs text-white/65"><input type="checkbox" checked={form.motion!==false} onChange={e=>edit({motion:e.target.checked})} className="accent-emerald-400"/> Animações suaves entre perguntas</label>
            </div>
            <h2 className="text-center text-lg font-bold">Perguntas ({form.fields.length})</h2>
            {form.fields.map((q,i)=><article key={q.id} className="rounded-2xl border border-white/10 bg-[#12151c] p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Pergunta {i+1}</span>
                <button type="button" aria-label={"Excluir pergunta "+(i+1)}
                  onClick={()=>{edit({fields:form.fields.filter(item=>item.id!==q.id)});setPreviewIndex(0);}}
                  className="rounded-lg p-2 text-white/45 hover:bg-red-500/10 hover:text-red-300">
                  <Trash2 className="h-4 w-4"/>
                </button>
              </div>
              <label htmlFor={"question-"+q.id} className="sr-only">Texto da pergunta {i+1}</label>
              <textarea rows={2} id={"question-"+q.id} maxLength={180} className={fieldClass+" resize-y"} value={q.label}
                onChange={e=>editQuestion(q.id,{label:e.target.value})}/>
              <div className="mt-2 flex flex-wrap gap-2">{["✨","❤️","🔥","🎯","🍽️","🏡","🚀"].map(emoji=><button type="button" key={emoji} onClick={()=>editQuestion(q.id,{label:q.label+" "+emoji})} className="rounded-lg border border-white/10 px-2 py-1 text-base">{emoji}</button>)}</div>
              <MediaImageField label={"Imagem da pergunta "+(i+1)} value={q.imageUrl} onChange={imageUrl=>editQuestion(q.id,{imageUrl})}/>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex-1 text-xs text-white/50">Resposta
                  <select className={fieldClass+" mt-1"} value={q.type}
                    onChange={e=>editQuestion(q.id,{type:e.target.value as FormQuestion["type"],
                      options:e.target.value==="select"?(q.options.length>=2?q.options:["Opção 1","Opção 2"]):[]})}>
                    {TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 pt-5 text-xs text-white/60">
                  <input type="checkbox" checked={q.required} onChange={e=>editQuestion(q.id,{required:e.target.checked})}
                    className="h-4 w-4 accent-emerald-400"/> Obrigatória
                </label>
              </div>
              {q.type==="select"&&<label className="mt-3 block text-xs text-white/60">Opções (uma por linha)
                <textarea className={fieldClass+" mt-2"} rows={3} value={q.options.join("\n")}
                  onChange={e=>editQuestion(q.id,{options:e.target.value.split("\n").slice(0,12)})}/>
              </label>}
            </article>)}
            <button type="button" onClick={addQuestion} disabled={form.fields.length>=20}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-400/35 p-4 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/[.05] disabled:opacity-40">
              <Plus className="h-4 w-4"/> Adicionar pergunta
            </button>
          </section>
          :tab==="responses"?
            <section className="space-y-4 rounded-2xl border border-white/10 bg-[#12151c] p-5 sm:p-7">
              <div className="text-center">
                <h2 className="text-xl font-bold">Respostas recebidas</h2>
                <p className="mt-2 text-3xl font-bold text-emerald-300">{responses.length}</p>
                <p className="mt-2 text-sm text-white/50">Somente você, dentro da sua conta PageNova, pode consultar estas respostas.</p>
                <button type="button" onClick={()=>void loadResponses()} className="mt-4 rounded-lg border border-white/15 px-4 py-2 text-sm text-white/75">
                  Atualizar respostas
                </button>
                <button type="button" disabled={!responses.length} onClick={()=>downloadStudioCsv("respostas-formulario-"+form.id+".csv",["Data",...form.fields.map(field=>field.label)],responses.map(entry=>[entry.submittedAt,...form.fields.map(field=>entry.answers.find(answer=>answer.questionId===field.id)?.value||"")]))} className="ml-2 mt-4 rounded-lg border border-emerald-400/35 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-30">Exportar CSV</button>
              </div>
              {loadingResponses?<p className="py-8 text-center text-sm text-white/50">Carregando respostas...</p>
                :responses.length===0?<p className="py-8 text-center text-sm text-white/50">Este formulário ainda não recebeu respostas.</p>
                :responses.map((response,index)=><article key={response.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-4 text-sm font-semibold text-emerald-300">Resposta {index+1} · {new Date(response.submittedAt).toLocaleString("pt-BR")}</p>
                  <div className="space-y-3">{response.answers.map(item=><div key={item.questionId}>
                    <p className="text-xs text-white/45">{item.label}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-white/90">{item.value||"Não informado"}</p>
                  </div>)}</div>
                </article>)}
              {responses.length===100&&<p className="text-center text-xs text-white/50">Exibindo as 100 respostas mais recentes.</p>}
            </section>
          :<section className="rounded-3xl border border-white/10 bg-[#12151c] p-5 sm:p-7">
            <div className="mx-auto max-w-lg overflow-hidden rounded-2xl bg-[#f7faf9] p-6 text-[#102c25] sm:p-8">
              {form.coverImageUrl&&<img src={form.coverImageUrl} alt="" className="mb-5 h-40 w-full rounded-xl object-cover"/>}
              <div className="mb-5 text-center">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><ClipboardList className="h-6 w-6"/></span>
                <h2 className="mt-3 break-words text-xl font-bold">{form.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{form.description}</p>
              </div>
              {form.fields.length>0?(()=>{
                const current=form.fields[Math.min(previewIndex,form.fields.length-1)];
                return <div>
                  <p className="mb-3 text-xs font-semibold text-slate-500">Pergunta {Math.min(previewIndex+1,form.fields.length)} de {form.fields.length}</p>
                  {current.imageUrl&&<img src={current.imageUrl} alt="" className="mb-4 h-40 w-full rounded-xl object-cover"/>}
                  <p className="text-base font-semibold">{current.label}{current.required?" *":""}</p>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
                    {current.type==="select"?(current.options.join(" · ")||"Selecione uma opção"):current.type==="textarea"?"Sua resposta em detalhes...":"Sua resposta..."}
                  </div>
                  <div className="mt-5 flex gap-2">
                    {previewIndex>0&&<button type="button" onClick={()=>setPreviewIndex(n=>n-1)}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm">Voltar</button>}
                    <button type="button" onClick={()=>setPreviewIndex(n=>Math.min(form.fields.length-1,n+1))}
                      className="flex-1 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold">
                      {previewIndex===form.fields.length-1?"Fim da prévia":"Próxima pergunta →"}
                    </button>
                  </div>
                </div>;
              })():<p className="text-center text-sm text-slate-500">Adicione perguntas para visualizar.</p>}
            </div>
            <p className="mt-4 text-center text-xs text-white/45">Esta prévia não envia respostas. A versão publicada funcionará pelo link compartilhável.</p>
          </section>}
        <footer className="flex flex-wrap items-center justify-center gap-2 pb-10 pt-4">
          <button type="button" onClick={()=>void save()} disabled={publishBusy}
            className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
            Salvar rascunho
          </button>
          <button type="button" onClick={()=>void publish()} disabled={publishBusy}
            className="rounded-xl bg-[#10d6a1] px-6 py-3 text-sm font-bold text-[#042b1e] disabled:opacity-50">
            {published?"Atualizar publicação":"Publicar"}
          </button>
        </footer>
      </div>}
  </main>;
}
