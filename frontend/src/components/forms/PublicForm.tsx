"use client";

import { useState, type FormEvent } from "react";
import type { PublicForm as FormDataType } from "@/lib/forms/schema";

export default function PublicForm({form}:{form:FormDataType}) {
  const [values,setValues]=useState<Record<string,string>>({});
  const [step,setStep]=useState(0);
  const [error,setError]=useState("");
  const fields=form.fields;
  const field=fields[step];
  const submitted=()=> {
    const rows=[form.title,...fields.map(q=>q.label+": "+(values[q.id]||""))];
    const link="https://wa.me/"+form.whatsapp+"?text="+encodeURIComponent(rows.join("\n"));
    window.location.assign(link);
  };
  function next(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setError("");
    if(field?.required && !values[field.id]?.trim()) {
      setError("Responda esta pergunta antes de continuar.");return;
    }
    if(step<fields.length-1)setStep(x=>x+1);
    else submitted();
  }
  const inputClass="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10";
  return <main className="flex min-h-screen items-center justify-center bg-[#eef6f2] px-4 py-10 text-[#102c25]">
    <article className="w-full max-w-xl rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-[0_18px_70px_rgba(13,56,39,.09)] sm:p-10">
      <div className="mx-auto mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-emerald-800" aria-hidden="true">✦</div>
      <h1 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">{form.title}</h1>
      {form.description && <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-slate-600">{form.description}</p>}
      {field && <form onSubmit={next} className="mt-8">
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
        <div className="mt-7 flex gap-3">
          {step>0&&<button type="button" onClick={()=>{setError("");setStep(x=>x-1);}}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold">Voltar</button>}
          <button type="submit" className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-[#03251a] hover:bg-emerald-400">
            {step===fields.length-1?"Enviar pelo WhatsApp →":"Continuar →"}
          </button>
        </div>
      </form>}
      <p className="mt-7 text-center text-xs leading-5 text-slate-500">
        Suas respostas são encaminhadas pelo WhatsApp somente quando você confirmar o envio.
        Não ficam armazenadas automaticamente na PageNova.
      </p>
      <p className="mt-3 text-center text-xs text-slate-400">Criado com PageNova AI</p>
    </article>
  </main>;
}
