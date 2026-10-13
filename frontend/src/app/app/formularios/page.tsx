"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AppHeader } from "@/components/app-header";
import { ArrowDownToLine, ArrowLeft, ArrowRight, ClipboardList, Plus, Trash2 } from "lucide-react";

type Kind = "leads" | "quiz" | "application" | "survey";
type FieldKind = "text" | "email" | "tel" | "textarea" | "select";
type Field = { id:string; label:string; type:FieldKind; required:boolean; options:string[] };
type Draft = { title:string; description:string; whatsapp:string; kind:Kind; fields:Field[] };
const STORAGE = "pagenova-formulario-draft-1";
const styles = "w-full rounded-xl border border-white/15 bg-[#080a12] px-3 py-3 text-sm text-white outline-none focus:border-emerald-400";
const types: {id:Kind;title:string;hint:string}[] = [
  {id:"leads",title:"Captura de leads",hint:"Dados de contato e interesse"},
  {id:"quiz",title:"Quiz",hint:"Qualificação em etapas"},
  {id:"application",title:"Aplicação",hint:"Seleção e diagnóstico"},
  {id:"survey",title:"Pesquisa",hint:"Opiniões e sugestões"},
];
const fieldTypes: {id:FieldKind;title:string}[] = [
  {id:"text",title:"Texto curto"},{id:"email",title:"E-mail"},
  {id:"tel",title:"Telefone"},{id:"textarea",title:"Texto longo"},{id:"select",title:"Escolha"},
];
function fieldsFor(kind:Kind,description:string):Field[] {
  const f=(id:string,label:string,type:FieldKind,options:string[]=[])=>({id,label,type,required:true,options});
  if(kind==="survey") return [f("a","Qual é seu nome?","text"),f("b","Como avalia sua experiência?","select",["Ótima","Boa","Regular","Ruim"]),f("c","O que podemos melhorar?","textarea")];
  const base=[f("a","Qual é seu nome?","text"),f("b","Qual é seu WhatsApp?","tel"),f("c","Qual é seu e-mail?","email")];
  if(kind==="quiz") return [...base,f("d","Qual é seu principal objetivo?","select",["Conhecer opções","Receber proposta","Contratar"]),f("e","Conte o que você precisa","textarea")];
  if(kind==="application")return [...base,f("d","Descreva seu projeto ou objetivo","textarea"),f("e","Quando deseja começar?","select",["Agora","Em até 30 dias","Estou pesquisando"])];
  return [...base,f("d",/im[oó]ve|imobili/i.test(description)?"Você quer comprar ou alugar um imóvel?":"Qual serviço ou solução você procura?","text")];
}
function initial():Draft {return {title:"Formulário de contato",description:"",whatsapp:"",kind:"leads",fields:fieldsFor("leads","")};}
function escapeHtml(input:string):string {
  return input.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function makeHtml(d:Draft):string {
  const qs=d.fields.map((q,i)=>{
    const key="q"+i,required=q.required?" required":"";
    const label='<label for="'+key+'">'+escapeHtml(q.label)+(q.required?" *":"")+"</label>";
    let input='<input id="'+key+'" name="'+escapeHtml(q.label)+'" type="'+(q.type==="email"?"email":q.type==="tel"?"tel":"text")+'"'+required+"/>";
    if(q.type==="textarea") input='<textarea id="'+key+'" rows="4" name="'+escapeHtml(q.label)+'"'+required+'></textarea>';
    if(q.type==="select")input='<select id="'+key+'" name="'+escapeHtml(q.label)+'"'+required+'><option value="">Selecione</option>'+
      q.options.filter(Boolean).map(x=>'<option value="'+escapeHtml(x)+'">'+escapeHtml(x)+'</option>').join("")+'</select>';
    return '<div class="field">'+label+input+'</div>';
  }).join("");
  const phone=d.whatsapp.replace(/\D/g,"");
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+escapeHtml(d.title)+'</title><style>*{box-sizing:border-box}body{margin:0;background:#eff5f2;color:#14362d;font:16px/1.5 system-ui,sans-serif}main{max-width:640px;margin:50px auto;padding:30px;background:white;border-radius:20px;box-shadow:0 15px 50px #1423}.field{display:grid;gap:8px;margin:20px 0}label{font-weight:600}input,select,textarea{width:100%;padding:13px;border:1px solid #bfd1ca;border-radius:10px;font:inherit}button{width:100%;padding:14px;border:0;border-radius:10px;background:#06c995;font-weight:700;cursor:pointer}small{color:#68756e;display:block;margin-top:20px}@media(max-width:680px){main{margin:14px;padding:22px}}</style></head><body><main><h1>'+
    escapeHtml(d.title)+'</h1><p>'+escapeHtml(d.description || "Responda às perguntas abaixo.")+'</p><form id="form">'+qs+
    '<button type="submit">Enviar respostas pelo WhatsApp</button></form><small>Respostas enviadas diretamente pelo WhatsApp, sem armazenamento automático no CRM.</small></main>'+
    '<script>document.getElementById("form").addEventListener("submit",function(e){e.preventDefault();var number='+JSON.stringify(phone)+
    ';var data=new FormData(e.currentTarget);var lines=['+JSON.stringify(d.title)+'];data.forEach(function(v,k){lines.push(k+": "+String(v));});window.open("https://wa.me/"+number+"?text="+encodeURIComponent(lines.join("\\n")),"_blank","noopener,noreferrer");});</script></body></html>';
}
export default function FormulariosPage() {
  const [draft,setDraft]=useState<Draft>(initial);
  const [ready,setReady]=useState(false);
  const [prompt,setPrompt]=useState("");
  const [screen,setScreen]=useState<"edit"|"preview">("edit");
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [step,setStep]=useState(0);
  const [notice,setNotice]=useState("");
  useEffect(()=>{
    try{
      const raw=localStorage.getItem(STORAGE);
      if(raw){const d=JSON.parse(raw) as Draft;if(typeof d.title==="string"&&Array.isArray(d.fields)&&d.fields.every(f=>typeof f.id==="string"&&Array.isArray(f.options)))setDraft(d);}
    }catch{ /* Invalid local data is ignored. */ }
    setReady(true);
  },[]);
  useEffect(()=>{if(ready)try{localStorage.setItem(STORAGE,JSON.stringify(draft));}catch{}},[ready,draft]);
  const patch=(part:Partial<Draft>)=>{setDraft(old=>({...old,...part}));setNotice("");};
  const updateField=(id:string,part:Partial<Field>)=>patch({fields:draft.fields.map(q=>q.id===id?{...q,...part}:q)});
  function suggest(){
    if(!window.confirm("Substituir as perguntas atuais pelo modelo sugerido?"))return;
    const kind:Kind=/quiz|perfil|teste/i.test(prompt)?"quiz":/pesquisa|avalia|feedback/i.test(prompt)?"survey":/sele[cç][aã]o|aplica[cç][aã]o|qualific/i.test(prompt)?"application":draft.kind;
    patch({kind,title:prompt.trim().slice(0,80)||draft.title,fields:fieldsFor(kind,prompt)});
    setStep(0);setAnswers({});setNotice("Perguntas sugeridas. Revise antes de exportar.");
  }
  function download(){
    if(!/^\d{10,15}$/.test(draft.whatsapp.replace(/\D/g,""))){setNotice("Informe o WhatsApp de destino com DDI antes de exportar.");return;}
    if(!draft.fields.length){setNotice("Adicione uma pergunta antes de exportar.");return;}
    const u=URL.createObjectURL(new Blob([makeHtml(draft)],{type:"text/html;charset=utf-8"}));
    const a=document.createElement("a");a.href=u;a.download="formulario-pagenova.html";document.body.appendChild(a);a.click();a.remove();
    window.setTimeout(()=>URL.revokeObjectURL(u),1000);
    setNotice("HTML exportado. Hospede o arquivo para disponibilizar o formulário por link.");
  }
  function submitPreview(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const tel=draft.whatsapp.replace(/\D/g,"");
    if(!/^\d{10,15}$/.test(tel)){setNotice("Informe o WhatsApp de destino com DDI.");return;}
    const lines=[draft.title,...draft.fields.map(q=>q.label+": "+(answers[q.id]||""))];
    window.open("https://wa.me/"+tel+"?text="+encodeURIComponent(lines.join("\n")),"_blank","noopener,noreferrer");
  }
  const current=draft.fields[Math.min(step,draft.fields.length-1)];
  const shell="rounded-2xl border border-white/10 bg-[#11131b] p-4 sm:p-6";
  return <>
    <AppHeader title="Gerar Formulário" description="Monte quizzes, aplicações, pesquisas e formulários de contato."/>
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 text-white">
      <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[.06] p-4 text-sm leading-6 text-white/75">
        <strong className="flex items-center gap-2 text-emerald-300"><ClipboardList className="h-4 w-4"/> Formulários PageNova</strong>
        Crie e exporte um formulário HTML funcional. As respostas podem ser enviadas pelo WhatsApp; publicação por URL PageNova e sincronização automática ao CRM ainda não estão disponíveis.
      </div>
      <div className="flex gap-2 lg:hidden">
        <button type="button" onClick={()=>setScreen("edit")} aria-pressed={screen==="edit"} className={"flex-1 rounded-lg border px-4 py-2 "+(screen==="edit"?"border-emerald-400":"border-white/20")}>Editar</button>
        <button type="button" onClick={()=>setScreen("preview")} aria-pressed={screen==="preview"} className={"flex-1 rounded-lg border px-4 py-2 "+(screen==="preview"?"border-emerald-400":"border-white/20")}>Prévia</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(330px,0.8fr)]">
        <section className={shell+(screen==="preview"?" hidden lg:block":"")}>
          <h2 className="text-xl font-bold">Configure seu formulário</h2>
          <label className="mt-5 block text-sm font-semibold">O que você quer criar?
            <textarea rows={3} value={prompt} onChange={e=>setPrompt(e.target.value)} className={styles+" mt-2"} placeholder="Ex.: Quero um quiz para qualificar clientes de uma imobiliária."/>
          </label>
          <button type="button" onClick={suggest} className="mt-3 rounded-lg border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-300">Sugerir perguntas</button>
          <p className="mt-2 text-xs text-white/45">Sugestões por modelos predefinidos, sem chamada paga de IA.</p>
          <fieldset className="mt-5"><legend className="mb-2 text-sm font-semibold">Tipo</legend>
            <div className="grid grid-cols-2 gap-2">
              {types.map(t=><button key={t.id} type="button" onClick={()=>patch({kind:t.id})} aria-pressed={draft.kind===t.id}
                className={"rounded-xl border p-3 text-left text-sm "+(draft.kind===t.id?"border-emerald-400 bg-emerald-400/10":"border-white/15")}>
                <strong className="block">{t.title}</strong><span className="mt-1 block text-xs text-white/50">{t.hint}</span>
              </button>)}
            </div>
          </fieldset>
          <label className="mt-5 block text-sm font-semibold">Título<input className={styles+" mt-2"} value={draft.title} maxLength={100} onChange={e=>patch({title:e.target.value})}/></label>
          <label className="mt-4 block text-sm font-semibold">Descrição<textarea className={styles+" mt-2"} rows={2} value={draft.description} maxLength={360} onChange={e=>patch({description:e.target.value})}/></label>
          <label className="mt-4 block text-sm font-semibold">WhatsApp para receber respostas (com DDI)<input className={styles+" mt-2"} inputMode="tel" value={draft.whatsapp} onChange={e=>patch({whatsapp:e.target.value})} placeholder="5511999999999"/></label>
          <h3 className="mt-6 text-lg font-bold">Perguntas ({draft.fields.length})</h3>
          <div className="mt-3 space-y-3">
            {draft.fields.map((q,i)=><div key={q.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-emerald-300">Pergunta {i+1}</span>
                <button type="button" aria-label={"Remover pergunta "+(i+1)} onClick={()=>{patch({fields:draft.fields.filter(x=>x.id!==q.id)});setStep(0);}} className="rounded p-2 text-white/60 hover:text-red-300"><Trash2 className="h-4 w-4"/></button>
              </div>
              <input className={styles+" mt-2"} value={q.label} maxLength={200} onChange={e=>updateField(q.id,{label:e.target.value})} aria-label={"Texto da pergunta "+(i+1)}/>
              <div className="mt-2 flex items-center gap-3">
                <select className={styles+" max-w-[70%]"} value={q.type} onChange={e=>updateField(q.id,{type:e.target.value as FieldKind})} aria-label={"Tipo da pergunta "+(i+1)}>
                  {fieldTypes.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-white/65"><input type="checkbox" checked={q.required} onChange={e=>updateField(q.id,{required:e.target.checked})}/> Obrigatória</label>
              </div>
              {q.type==="select"&&<label className="mt-3 block text-xs text-white/60">Opções (uma por linha)<textarea rows={3} className={styles+" mt-2"} value={q.options.join("\n")} onChange={e=>updateField(q.id,{options:e.target.value.split("\n").slice(0,15)})}/></label>}
            </div>)}
          </div>
          <button type="button" onClick={()=>patch({fields:[...draft.fields,{id:crypto.randomUUID(),label:"Nova pergunta",type:"text",required:true,options:[]}]})}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-400/40 p-3 text-sm font-semibold text-emerald-300"><Plus className="h-4 w-4"/> Adicionar pergunta</button>
          <button type="button" onClick={download} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-[#062117] hover:bg-emerald-300"><ArrowDownToLine className="h-4 w-4"/> Exportar formulário HTML</button>
          <p className="mt-2 text-xs text-white/40">Rascunho salvo apenas neste navegador. Exporte para hospedar o formulário em qualquer site.</p>
        </section>
        <section className={shell+(screen==="edit"?" hidden lg:block":"")}>
          <h2 className="mb-4 text-sm font-bold text-emerald-300">Prévia interativa</h2>
          <form onSubmit={submitPreview} className="rounded-xl bg-[#f8faf9] p-5 text-[#18342e]">
            <h3 className="break-words text-xl font-extrabold">{draft.title||"Sem título"}</h3>
            <p className="mt-2 break-words text-sm text-[#5c6f66]">{draft.description||"Responda às perguntas abaixo."}</p>
            {current?<div className="mt-6" key={current.id}>
              <p className="mb-2 text-xs font-semibold text-[#6e8078]">Pergunta {Math.min(step+1,draft.fields.length)} de {draft.fields.length}</p>
              <label htmlFor="preview-answer" className="block text-sm font-bold">{current.label}{current.required?" *":""}</label>
              {current.type==="textarea"?
                <textarea id="preview-answer" rows={4} required={current.required} className="mt-2 w-full rounded-lg border border-[#c5d4cf] bg-white p-3" value={answers[current.id]||""} onChange={e=>setAnswers(v=>({...v,[current.id]:e.target.value}))}/>:
                current.type==="select"?
                  <select id="preview-answer" required={current.required} className="mt-2 w-full rounded-lg border border-[#c5d4cf] bg-white p-3" value={answers[current.id]||""} onChange={e=>setAnswers(v=>({...v,[current.id]:e.target.value}))}><option value="">Selecione</option>{current.options.filter(Boolean).map((opt,i)=><option key={i}>{opt}</option>)}</select>:
                  <input id="preview-answer" type={current.type==="email"?"email":current.type==="tel"?"tel":"text"} required={current.required} className="mt-2 w-full rounded-lg border border-[#c5d4cf] bg-white p-3" value={answers[current.id]||""} onChange={e=>setAnswers(v=>({...v,[current.id]:e.target.value}))}/>}
              <div className="mt-4 flex gap-2">
                <button type="button" disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))} className="rounded-lg border border-[#bfd1c9] p-2.5 disabled:opacity-30" aria-label="Voltar uma pergunta"><ArrowLeft className="h-4 w-4"/></button>
                {step<draft.fields.length-1?
                  <button type="button" onClick={()=>{if(current.required&&!answers[current.id]?.trim()){setNotice("Responda à pergunta antes de continuar.");return;}setStep(x=>x+1);}} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-400 py-3 text-sm font-bold">Próxima <ArrowRight className="h-4 w-4"/></button>:
                  <button type="submit" className="flex-1 rounded-lg bg-emerald-400 py-3 text-sm font-bold">Enviar ao WhatsApp</button>}
              </div>
            </div>:<p className="mt-6 text-sm">Adicione uma pergunta para começar.</p>}
            <p className="mt-4 text-xs text-[#73847c]">Respostas não são armazenadas no CRM nesta versão.</p>
          </form>
        </section>
      </div>
      {notice&&<p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</p>}
    </main>
  </>;
}
