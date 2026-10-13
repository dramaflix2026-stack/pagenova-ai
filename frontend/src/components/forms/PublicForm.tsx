"use client";

import { useState, type FormEvent } from "react";
import type { PublicForm as FormDataType } from "@/lib/forms/schema";

export default function PublicForm({form}:{form:FormDataType}) {
  const [values,setValues]=useState<Record<string,string>>({});
  const [step,setStep]=useState(0);
  const [error,setError]=useState("");
  const [sending,setSending]=useState(false);
  const [success,setSuccess]=useState(false);
  const [website,setWebsite]=useState("");
  const fields=form.fields;
  const field=fields[step];
  async function submitAnswers() {
    setSending(true);
    try {
      const response=await fetch("/api/forms/"+encodeURIComponent(form.id)+"/submit",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({answers:values,companyWebsite:website}),
      });
      const data=await response.json().catch(()=>({})) as {error?:string};
      if(!response.ok)throw new Error(data.error||"Não foi possível enviar as respostas.");
      setSuccess(true);
    }catch(cause) {
      setError(cause instanceof Error?cause.message:"Não foi possível enviar as respostas.");
    }finally{setSending(false);}
  }
  function next(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setError("");
    if(field?.required && !values[field.id]?.trim()) {
      setError("Responda esta pergunta antes de continuar.");return;
    }
    if(step<fields.length-1)setStep(x=>x+1);
    else void submitAnswers();
  }
  const inputClass="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10";
  return <main className="flex min-h-screen items-center justify-center bg-[#eef6f2] px-4 py-10 text-[#102c25]">
    <article className="w-full max-w-xl rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-[0_18px_70px_rgba(13,56,39,.09)] sm:p-10">
      <div className="mx-auto mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-emerald-800" aria-hidden="true">✦</div>
      <h1 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">{form.title}</h1>
      {form.description && <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-slate-600">{form.description}</p>}
      {success ? <div role="status" className="mt-9 rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center">
        <div className="text-3xl" aria-hidden="true">✓</div>
        <h2 className="mt-3 text-xl font-bold">Respostas enviadas!</h2>
        <p className="mt-2 text-sm text-slate-600">Obrigado por participar. Você já pode fechar esta página.</p>
      </div> : field && <form onSubmit={next} className="mt-8">
        <div className="mb-4 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Pergunta {step+1} de {fields.length}</span><span>{Math.round(((step+1)/fields.length)*100)}%</span>
        </div>
        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{width:((step+1)/fields.length)*100+"%"}} /></div>
        <label htmlFor="response-field" className="block text-base font-semibold leading-6">
          {field.label} {field.required && <span className="text-emerald-600">*</span>}
        </label>
        {field.type==="select"?
          <select id="response-field" key={field.id} value={values[field.id]||""}
            required={field.required} onChange={e=>setValues(v=>({...v,[field.id]:e.target.value}))} className={inputClass}>
            <option value="">Selecione uma opção</option>{field.options.map((opt,i)=><option key={i} value={opt}>{opt}</option>)}
          </select>
          :field.type==="textarea"?
          <textarea id="response-field" key={field.id} rows={4} required={field.required}
            maxLength={2000} value={values[field.id]||""}
            onChange={e=>setValues(v=>({...v,[field.id]:e.target.value}))} className={inputClass} />
          : <input id="response-field" key={field.id} type={field.type==="email"?"email":field.type==="tel"?"tel":"text"}
            maxLength={300} required={field.required} value={values[field.id]||""}
            onChange={e=>setValues(v=>({...v,[field.id]:e.target.value}))} className={inputClass}/>}
        {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0" style={{left:"-9999px"}}>
          <label htmlFor="company-website">Site da empresa</label>
          <input id="company-website" type="text" autoComplete="off" tabIndex={-1} value={website}
            onChange={e=>setWebsite(e.target.value)}/>
        </div>
        <div className="mt-7 flex gap-3">
          {step>0&&<button type="button" onClick={()=>{setError("");setStep(x=>x-1);}}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold">Voltar</button>}
          <button type="submit" disabled={sending} className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-[#03251a] hover:bg-emerald-400 disabled:opacity-50">
            {sending?"Enviando...":step===fields.length-1?"Enviar respostas →":"Continuar →"}
          </button>
        </div>
      </form>}
      <p className="mt-7 text-center text-xs leading-5 text-slate-500">
        Suas respostas serão salvas com segurança na PageNova e estarão disponíveis somente para o responsável pelo formulário.
      </p>
      <p className="mt-3 text-center text-xs text-slate-400">Criado com PageNova AI</p>
    </article>
  </main>;
}
