"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardList, Copy,
  Eye, FilePenLine, Globe2, LoaderCircle, Plus, Save, Sparkles, Trash2,
} from "lucide-react";
import { type FormInput, type FormQuestion, type PageNovaForm, normalizeForm } from "@/lib/forms/schema";

type Screen = "start" | "review";
type Tab = "questions" | "preview";
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

  async function loadSaved() {
    try{
      const res=await fetch("/api/forms",{cache:"no-store"});
      const data=await res.json().catch(()=>({})) as {forms?:PageNovaForm[];error?:string};
      if(!res.ok)throw new Error(data.error||"Não foi possível carregar os formulários.");
      setSaved(Array.isArray(data.forms)?data.forms:[]);
    }catch(cause){setError(feedbackText(cause));}
    finally{setIsLoadingList(false);}
  }
  useEffect(()=>{void loadSaved();},[]);
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
    setTab("questions");setPreviewIndex(0);setScreen("review");
    setError("");setNotice("");setCopied(false);
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
      const result=await jsonRequest<{form:FormInput}>("/api/forms/generate",{prompt:request});
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
    if(!/^\d{10,15}$/.test(form.whatsapp.replace(/\D/g,""))){
      setTab("questions");setError("Para publicar, informe um WhatsApp com DDI nas opções de publicação.");
      window.setTimeout(()=>{const input=document.getElementById("form-publication-phone");input?.closest("details")?.setAttribute("open","");input?.focus();},0);
      return;
    }
    if(!window.confirm("Publicar este formulário para que outras pessoas possam responder pelo link? As respostas serão enviadas pelo WhatsApp configurado."))return;
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
      <div className="mx-auto flex min-h-[calc(100svh-225px)] max-w-4xl flex-col items-center justify-center">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[.06] px-4 py-2 text-xs font-bold uppercase tracking-[.17em] text-emerald-300">
            <Sparkles className="h-4 w-4"/> PageNova AI
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">Que formulário vamos criar?</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
            Conte sua ideia com suas palavras. A IA cria as perguntas, organiza a sequência e prepara o formulário para você revisar.
          </p>
        </div>
        <form onSubmit={generate} className="mt-9 w-full max-w-2xl rounded-3xl border border-white/[.09] bg-[#12151e] p-5 shadow-[0_28px_75px_rgba(0,0,0,.26)] sm:p-8">
          <label htmlFor="form-idea" className="mb-3 block text-center text-sm font-semibold text-white/80">
            Converse com a IA
          </label>
          <textarea id="form-idea" value={prompt} maxLength={1500} rows={5}
            disabled={isGenerating} onChange={e=>setPrompt(e.target.value)}
            placeholder="Ex.: Quero um formulário para uma imobiliária descobrir se o cliente deseja comprar ou alugar, a região, o orçamento e como prefere ser atendido."
            className={fieldClass+" min-h-[156px] resize-y text-base leading-7 placeholder:text-white/30"}/>
          <button disabled={isGenerating||prompt.trim().length<20} type="submit"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#10d6a1] px-5 py-4 text-base font-bold text-[#07271e] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-45">
            {isGenerating?<><LoaderCircle className="h-5 w-5 animate-spin"/> Criando perguntas com IA...</>:<>
              <Sparkles className="h-5 w-5"/> Gerar meu formulário <ArrowRight className="h-4 w-4"/></>}
          </button>
          <p className="mt-4 text-center text-xs leading-5 text-white/40">
            A geração usa OpenAI e pode ter custo por utilização. Nenhum formulário será publicado automaticamente.
          </p>
          {error&&<p role="alert" className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-center text-sm text-red-200">{error}</p>}
        </form>
        <div className="mt-10 w-full max-w-2xl">
          <h2 className="text-center text-sm font-semibold text-white/60">Seus formulários salvos</h2>
          {isLoadingList?<p className="mt-3 text-center text-xs text-white/40">Carregando seus rascunhos...</p>
          :saved.length===0?<p className="mt-3 text-center text-xs text-white/40">Ainda não há formulários salvos.</p>
          :<div className="mt-4 grid gap-3 sm:grid-cols-2">
            {saved.map(item=><button key={item.id} type="button" onClick={()=>openDraft(item)}
              className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[.025] p-4 text-left transition hover:border-emerald-400/40 hover:bg-emerald-400/[.05]">
              <span className="line-clamp-2 font-semibold text-white">{item.title}</span>
              <span className="text-xs text-white/45">{KINDS[item.kind]||"Formulário"} · {formatDate(item.updatedAt)}</span>
              <span className={item.publishedAt?"text-xs text-emerald-300":"text-xs text-white/40"}>
                {item.publishedAt?"Publicado · continuar editando":"Rascunho · continuar editando"} →
              </span>
            </button>)}
          </div>}
        </div>
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
            <a href={publishedLink} target="_blank" rel="noopener noreferrer" className="max-w-full break-all text-sm text-white underline underline-offset-4">{publishedLink}</a>
            <button type="button" onClick={()=>void copyLink()} className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
              {copied?<Check className="h-3.5 w-3.5"/>:<Copy className="h-3.5 w-3.5"/>} {copied?"Copiado":"Copiar link"}
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
            <details className="rounded-2xl border border-white/10 bg-[#12151c] p-5 sm:p-6">
              <summary className="cursor-pointer text-center text-sm font-semibold text-white/75">Configurações de publicação</summary>
              <div className="mt-5">
                <label htmlFor="form-publication-phone" className="block text-sm font-medium text-white/70">
                  WhatsApp para receber respostas (com DDI)
                </label>
                <input id="form-publication-phone" inputMode="tel" maxLength={22}
                  placeholder="5511999999999" value={form.whatsapp}
                  onChange={e=>edit({whatsapp:e.target.value})} className={fieldClass+" mt-2"}/>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  Este número só é necessário na hora de publicar. O visitante enviará as respostas pelo WhatsApp; elas não são armazenadas no CRM.
                </p>
              </div>
            </details>
          </section>
          :<section className="rounded-3xl border border-white/10 bg-[#12151c] p-5 sm:p-7">
            <div className="mx-auto max-w-lg rounded-2xl bg-[#f7faf9] p-6 text-[#102c25] sm:p-8">
              <div className="mb-5 text-center">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><ClipboardList className="h-6 w-6"/></span>
                <h2 className="mt-3 break-words text-xl font-bold">{form.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{form.description}</p>
              </div>
              {form.fields.length>0?(()=>{
                const current=form.fields[Math.min(previewIndex,form.fields.length-1)];
                return <div>
                  <p className="mb-3 text-xs font-semibold text-slate-500">Pergunta {Math.min(previewIndex+1,form.fields.length)} de {form.fields.length}</p>
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
