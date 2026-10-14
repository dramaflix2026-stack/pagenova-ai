"use client";
import {useState} from "react";
import {ArrowLeft,ArrowRight,Check,LoaderCircle,RefreshCw,Sparkles} from "lucide-react";
import {evaluateQuiz,type PublicQuiz,type QuizOutcome,type QuizProject} from "@/lib/quizzes/schema";

const themes={
  emerald:{page:"bg-[#061910]",card:"bg-[#0e2c20] border-[#2e7759]/35",text:"text-white",
    faded:"text-white/60",button:"bg-[#48dfa9] text-[#092a20] hover:bg-[#75edbe]",
    option:"border-white/15 bg-white/[.04] hover:border-[#48dfa9]/60",
    chosen:"border-[#48dfa9] bg-[#48dfa9]/15"},
  midnight:{page:"bg-[#080d20]",card:"bg-[#141d37] border-blue-300/15",text:"text-white",
    faded:"text-white/60",button:"bg-[#a4a8ff] text-[#12183e] hover:bg-[#bdc0ff]",
    option:"border-white/15 bg-white/[.05] hover:border-indigo-300/60",
    chosen:"border-indigo-300 bg-indigo-300/20"},
  cream:{page:"bg-[#efece4]",card:"bg-[#fffdf8] border-[#d8cfbd]",text:"text-[#283f33]",
    faded:"text-[#6c756d]",button:"bg-[#1f7454] text-white hover:bg-[#2b8b68]",
    option:"border-[#d5d4cc] bg-[#f8f7f1] hover:border-[#1f7454]/60",
    chosen:"border-[#1f7454] bg-[#e7f6ec]"},
};
type Props={quiz:PublicQuiz;preview?:QuizProject};
export function PublicQuizPlayer({quiz,preview}:Props){
  const palette=themes[quiz.theme]||themes.emerald;
  const [index,setIndex]=useState(0);
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [result,setResult]=useState<QuizOutcome|null>(null);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [consent,setConsent]=useState(false);
  const [honeypot,setHoneypot]=useState("");
  const [error,setError]=useState("");
  const [working,setWorking]=useState(false);
  const question=quiz.questions[index];
  const isLeadStep=index===quiz.questions.length && quiz.collectLeads;
  const progress=result?100:Math.round(index/quiz.questions.length*100);
  function reset(){
    setIndex(0);setAnswers({});setResult(null);setName("");setEmail("");setConsent(false);setError("");
  }
  async function finish(next:Record<string,string>){
    if(working)return;
    setError("");setWorking(true);
    try{
      if(preview){
        setResult(evaluateQuiz(preview,next));
      }else{
        const response=await fetch("/api/quizzes/"+encodeURIComponent(quiz.id)+"/submit",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({answers:next,companyWebsite:honeypot,
            ...(quiz.collectLeads?{name,email,consent}:{} )}),
          cache:"no-store",
        });
        const data=await response.json().catch(()=>({})) as {outcome?:QuizOutcome;error?:string};
        if(!response.ok||!data.outcome)throw new Error(data.error||"Não foi possível concluir seu quiz.");
        setResult(data.outcome);
      }
    }catch(e){setError(e instanceof Error?e.message:"Erro ao enviar respostas.");}
    finally{setWorking(false);}
  }
  function next(){
    if(!question)return;
    if(!answers[question.id]){setError("Escolha uma resposta para continuar.");return;}
    setError("");
    if(index<quiz.questions.length-1)setIndex(i=>i+1);
    else if(quiz.collectLeads)setIndex(quiz.questions.length);
    else void finish(answers);
  }
  const labelClasses="rounded-2xl border px-4 py-4 text-left text-sm font-medium leading-6 transition-all";
  return <main className={"flex min-h-[100svh] items-center justify-center px-4 py-10 font-sans sm:py-14 "+palette.page+" "+palette.text}>
    <div className="w-full max-w-[670px]">
      {preview&&<div className="mb-4 rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-center text-xs font-semibold text-amber-200">
        Prévia interativa · suas respostas não serão registradas
      </div>}
      <article className={"overflow-hidden rounded-[30px] border p-5 shadow-[0_28px_90px_rgba(0,0,0,.19)] sm:p-10 "+palette.card}>
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/15"><Sparkles className="h-4 w-4"/></span>
            <span>Quiz interativo</span>
          </div>
          <span className={"text-xs "+palette.faded}>{result?"Finalizado":isLeadStep?"Seu resultado":(index+1)+" / "+quiz.questions.length}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-current/10" role="progressbar"
          aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso">
          <div className="h-full rounded-full bg-[#48dfa9] transition-all duration-300" style={{width:progress+"%"}}/>
        </div>
        {result? <div className="py-9 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#48dfa9]/15 text-[#57e9b1]">
            <Check className="h-8 w-8"/>
          </span>
          <p className={"mt-6 text-xs font-bold uppercase tracking-[.18em] "+palette.faded}>Seu resultado é</p>
          <h1 className="mx-auto mt-3 max-w-lg text-[clamp(1.8rem,5vw,2.8rem)] font-extrabold leading-tight tracking-[-.05em]">{result.title}</h1>
          <p className={"mx-auto mt-5 max-w-lg whitespace-pre-line text-sm leading-7 sm:text-base "+palette.faded}>{result.description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {result.ctaUrl&&<a href={result.ctaUrl} target="_blank" rel="noopener noreferrer"
              className={"inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold "+palette.button}>
              {result.ctaLabel||"Saiba mais"} <ArrowRight className="h-4 w-4"/>
            </a>}
            <button type="button" onClick={reset} className={"inline-flex min-h-12 items-center gap-2 rounded-xl border border-current/20 px-5 py-3 text-sm font-semibold "+palette.faded}>
              <RefreshCw className="h-4 w-4"/> Refazer
            </button>
          </div>
        </div> : isLeadStep? <form onSubmit={e=>{e.preventDefault();void finish(answers);}} className="pt-8">
          <h1 className="text-[clamp(1.6rem,5vw,2.25rem)] font-bold tracking-tight">Seu resultado está pronto!</h1>
          <p className={"mt-3 text-sm leading-6 "+palette.faded}>Informe seus dados e autorize o contato para visualizar o resultado.</p>
          <label className="mt-7 block text-sm font-semibold">Nome
            <input value={name} onChange={e=>setName(e.target.value)} maxLength={120} required
              placeholder="Seu nome" className="mt-2 block w-full rounded-xl border border-current/20 bg-transparent px-4 py-3 text-base outline-none focus:border-emerald-400"/>
          </label>
          <label className="mt-4 block text-sm font-semibold">E-mail
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} required
              placeholder="voce@email.com" className="mt-2 block w-full rounded-xl border border-current/20 bg-transparent px-4 py-3 text-base outline-none focus:border-emerald-400"/>
          </label>
          <label className={"mt-5 flex items-start gap-3 text-xs leading-5 "+palette.faded}>
            <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required className="mt-1 accent-emerald-500"/>
            Aceito compartilhar meu nome e e-mail com o responsável por este quiz para receber o resultado e ser contatado. Os dados serão armazenados na PageNova.
          </label>
          <div className="sr-only" aria-hidden="true"><label htmlFor="quiz-hp">Site</label>
            <input id="quiz-hp" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e=>setHoneypot(e.target.value)}/></div>
          {error&&<p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
          <div className="mt-8 flex gap-3">
            <button type="button" onClick={()=>setIndex(quiz.questions.length-1)} className="rounded-xl border border-current/20 px-4 py-3 text-sm">Voltar</button>
            <button disabled={working||!consent} type="submit" className={"flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold disabled:opacity-50 "+palette.button}>
              {working?<LoaderCircle className="h-4 w-4 animate-spin"/>:"Ver meu resultado →"}
            </button>
          </div>
        </form> : question? <div className="pt-8">
          {index===0&&<div className="mb-7">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{quiz.title}</h1>
            <p className={"mt-2 text-sm leading-6 "+palette.faded}>{quiz.subtitle}</p>
          </div>}
          <h2 className="text-[clamp(1.35rem,4vw,1.9rem)] font-bold leading-snug tracking-[-.035em]">{question.title}</h2>
          <div className="mt-7 space-y-3" role="radiogroup" aria-label={question.title}>
            {question.options.map((option,i)=>{
              const chosen=answers[question.id]===option.id;
              return <button key={option.id} type="button" role="radio" aria-checked={chosen}
                onClick={()=>{setAnswers(a=>({...a,[question.id]:option.id}));setError("");}}
                className={"flex w-full items-center gap-4 "+labelClasses+" "+(chosen?palette.chosen:palette.option)}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-current/20 text-xs font-bold">
                  {chosen?<Check className="h-4 w-4"/>:String.fromCharCode(65+i)}
                </span>
                <span>{option.label}</span>
              </button>;
            })}
          </div>
          {error&&<p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
          <div className="mt-9 flex gap-3">
            {index>0&&<button type="button" onClick={()=>{setError("");setIndex(i=>i-1);}}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-current/20 px-4 py-3 text-sm font-semibold">
              <ArrowLeft className="h-4 w-4"/> Voltar
            </button>}
            <button type="button" disabled={working||!answers[question.id]} onClick={next}
              className={"inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 "+palette.button}>
              {working?<LoaderCircle className="h-4 w-4 animate-spin"/>:index===quiz.questions.length-1?"Ver resultado":"Continuar"}
              {!working&&<ArrowRight className="h-4 w-4"/>}
            </button>
          </div>
        </div>:null}
      </article>
      <p className={"mt-5 text-center text-[11px] "+palette.faded}>
        Criado com PageNova AI · {quiz.questions.length} perguntas
      </p>
    </div>
  </main>;
}
