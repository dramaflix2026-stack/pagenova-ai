"use client";

import {useEffect,useState,type FormEvent} from "react";
import {
  ArrowLeft,ArrowRight,BarChart3,BookOpen,Check,CheckCircle2,ChevronDown,
  ClipboardCopy,ExternalLink,Eye,FileQuestion,Globe2,LoaderCircle,
  MessageSquareText,Plus,Save,Send,Sparkles,Trash2,WandSparkles,
} from "lucide-react";
import {
  normalizeQuiz,publicQuiz,type QuizInput,type QuizOutcome,type QuizProject,
  type QuizQuestion,type QuizEntry,type QuizTheme,
} from "@/lib/quizzes/schema";
import {PublicQuizPlayer} from "@/components/quizzes/PublicQuizPlayer";
import {MediaImageField} from "@/components/studio/MediaImageField";
import {VoiceButton} from "@/components/studio/VoiceButton";
import {downloadStudioCsv} from "@/lib/studio-response-export";

type QuizSummary={id:string;title:string;updatedAt:string;publishedAt:string|null;questions:number};
type Screen="start"|"editor";
type Tab="preview"|"questions"|"settings"|"outcomes"|"responses";
type Message={role:"assistant"|"user";text:string};
const themes:{id:QuizTheme;name:string;swatch:string}[]=[
  {id:"emerald",name:"Verde PageNova",swatch:"bg-[#8fec78]"},
  {id:"midnight",name:"Azul profundo",swatch:"bg-[#828dff]"},
  {id:"cream",name:"Editorial claro",swatch:"bg-[#e9dcc4]"},
];
const ideas=[
  "Crie um quiz para descobrir qual produto de skincare combina com cada pessoa.",
  "Faça um quiz de perfil para recomendar o melhor imóvel ao cliente.",
  "Quero um quiz interativo de 7 perguntas para captar leads de marketing.",
  "Monte um quiz divertido sobre estilo pessoal com três resultados diferentes.",
];
const input="w-full rounded-xl border border-white/[.14] bg-[#0b100d] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10";
const errText=(e:unknown)=>e instanceof Error?e.message:"Ocorreu um erro inesperado.";
const prettyDate=(v:string)=>{try{return new Date(v).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});}catch{return "";}}
async function post<T>(url:string,payload:unknown):Promise<T>{
  const response=await fetch(url,{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),
  });
  const body=await response.json().catch(()=>({})) as T&{error?:string};
  if(!response.ok)throw new Error(body.error||"Não foi possível concluir a solicitação.");
  return body;
}
const greeting:Message={role:"assistant",text:"Olá! Monte seu quiz sem gastar API. Informe tema e objetivo; usaremos perguntas e perfis de modelos locais, que você poderá editar antes de publicar."};

export default function QuizStudioPage(){
  const [screen,setScreen]=useState<Screen>("start");
  const [quiz,setQuiz]=useState<QuizProject|null>(null);
  const [saved,setSaved]=useState<QuizSummary[]>([]);
  const [listLoading,setListLoading]=useState(true);
  const [conversation,setConversation]=useState<Message[]>([greeting]);
  const [prompt,setPrompt]=useState("");
  const [busy,setBusy]=useState(false);
  const [saving,setSaving]=useState(false);
  const [publishing,setPublishing]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [tab,setTab]=useState<Tab>("preview");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [responses,setResponses]=useState<QuizEntry[]>([]);
  const [loadingResponses,setLoadingResponses]=useState(false);
  const [chatExpanded,setChatExpanded]=useState(false);
  const [moreOpen,setMoreOpen]=useState(false);
  const [previewRevision,setPreviewRevision]=useState(0);
  const [origin,setOrigin]=useState("");
  useEffect(()=>{setOrigin(window.location.origin);void refreshSaved();},[]);

  async function refreshSaved(){
    try{
      const response=await fetch("/api/quizzes",{cache:"no-store",credentials:"same-origin"});
      const body=await response.json().catch(()=>({})) as {quizzes?:QuizSummary[];error?:string};
      if(!response.ok)throw new Error(body.error||"Não foi possível carregar seus quizzes.");
      setSaved(Array.isArray(body.quizzes)?body.quizzes:[]);
    }catch(e){setError(errText(e));}
    finally{setListLoading(false);}
  }
  function change(patch:Partial<QuizInput>){
    setQuiz(current=>current?{...current,...patch}:null);
    setDirty(true);setNotice("");
  }
  function changeQuestion(id:string,patch:Partial<QuizQuestion>){
    if(!quiz)return;
    change({questions:quiz.questions.map(q=>q.id===id?{...q,...patch}:q)});
  }
  function changeOutcome(id:string,patch:Partial<QuizOutcome>){
    if(!quiz)return;
    change({outcomes:quiz.outcomes.map(o=>o.id===id?{...o,...patch}:o)});
  }
  function openQuiz(existing:QuizProject){
    setQuiz(existing);setScreen("editor");setDirty(false);setTab("preview");setMoreOpen(false);setChatExpanded(false);setPreviewRevision(n=>n+1);
    setConversation([greeting,{role:"assistant",text:"Seu quiz está carregado! Pode editar os campos ao lado ou me pedir mudanças no chat."}]);
    setPrompt("");setError("");setNotice("");setResponses([]);
  }
  async function openSaved(id:string,viewResults=false){
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/quizzes/"+encodeURIComponent(id),{cache:"no-store"});
      const body=await response.json().catch(()=>({})) as {quiz?:QuizProject;error?:string};
      if(!response.ok||!body.quiz)throw new Error(body.error||"O projeto não foi encontrado.");
      openQuiz(body.quiz);
      if(viewResults){
        setTab("responses");setLoadingResponses(true);
        try{
          const response=await fetch("/api/quizzes/"+encodeURIComponent(id)+"/responses",{cache:"no-store"});
          const data=await response.json().catch(()=>({})) as {responses?:QuizEntry[];error?:string};
          if(!response.ok)throw new Error(data.error||"Falha ao carregar participações.");
          setResponses(data.responses||[]);
        }finally{setLoadingResponses(false);}
      }
    }catch(e){setError(errText(e));}
    finally{setBusy(false);}
  }
  function back(){
    if(dirty&&!window.confirm("Você tem alterações não salvas. Voltar mesmo assim?"))return;
    setScreen("start");setQuiz(null);setConversation([greeting]);setPrompt("");setTab("preview");setMoreOpen(false);setChatExpanded(false);
    setDirty(false);setError("");setNotice("");
  }
  async function askAI(e?:FormEvent){
    e?.preventDefault();
    if(busy)return;
    const instruction=prompt.trim();
    if(instruction.length<12){setError("Descreva o quiz ou a alteração com pelo menos 12 caracteres.");return;}
    setConversation(items=>[...items,{role:"user",text:instruction}]);
    setPrompt("");setError("");setNotice("");setBusy(true);
    try{
      const generated=await post<{quiz:QuizInput}>("/api/quizzes/generate",{
        prompt:instruction,existing:quiz?normalizeQuiz(quiz):undefined,
      });
      const result=normalizeQuiz(generated.quiz);
      // Keep manually selected imagery when AI rewrites copy or questions.
      if(quiz){
        result.coverImageUrl=result.coverImageUrl||quiz.coverImageUrl;
        result.motion=quiz.motion;
        result.questions=result.questions.map((q,i)=>({
          ...q,imageUrl:q.imageUrl||quiz.questions.find(old=>old.id===q.id)?.imageUrl||quiz.questions[i]?.imageUrl,
          options:q.options.map((o,j)=>({...o,imageUrl:o.imageUrl||
            quiz.questions.find(old=>old.id===q.id)?.options.find(old=>old.id===o.id)?.imageUrl||
            quiz.questions[i]?.options[j]?.imageUrl})),
        }));
        result.outcomes=result.outcomes.map((o,i)=>({...o,imageUrl:o.imageUrl||quiz.outcomes.find(old=>old.id===o.id)?.imageUrl||quiz.outcomes[i]?.imageUrl}));
      }
      const project:QuizProject={
        ...result,id:quiz?.id||"",updatedAt:quiz?.updatedAt||"",publishedAt:quiz?.publishedAt||null,
      };
      setQuiz(project);setScreen("editor");setDirty(true);setTab("preview");setMoreOpen(false);setChatExpanded(false);setPreviewRevision(n=>n+1);
      setConversation(items=>[...items,{role:"assistant",text:quiz
        ?"Pronto! A alteração suportada pelo modelo local foi aplicada. Revise antes de publicar."
        :"Seu quiz foi montado com modelos locais e três perfis. Personalize perguntas, lógica e imagens antes de publicar."}]);
    }catch(e){
      setError(errText(e));
      setConversation(items=>[...items,{role:"assistant",text:"Não consegui finalizar esta alteração. Seu trabalho anterior foi preservado. Revise a mensagem de erro e tente novamente."}]);
    }finally{setBusy(false);}
  }
  async function saveProject(current:QuizProject):Promise<QuizProject>{
    const data=await post<{quiz:QuizProject}>("/api/quizzes",{
      id:current.id||undefined,quiz:normalizeQuiz(current),
    });
    setQuiz(data.quiz);setDirty(false);
    await refreshSaved();
    return data.quiz;
  }
  async function save(){
    if(!quiz||saving||publishing||busy)return;
    setSaving(true);setError("");setNotice("");
    try{await saveProject(quiz);setNotice("Rascunho salvo na sua conta.");}
    catch(e){setError(errText(e));}
    finally{setSaving(false);}
  }
  async function publish(){
    if(!quiz||publishing||saving||busy)return;
    setPublishing(true);setError("");setNotice("");
    try{
      const current=dirty||!quiz.id?await saveProject(quiz):quiz;
      const data=await post<{quiz:QuizProject;url:string}>(
        "/api/quizzes/"+encodeURIComponent(current.id)+"/publish",{});
      setQuiz(data.quiz);setDirty(false);
      setNotice("Quiz publicado! O link já pode ser compartilhado.");
      await refreshSaved();
    }catch(e){setError(errText(e));}
    finally{setPublishing(false);}
  }
  async function copyLink(){
    if(!quiz?.id||!quiz.publishedAt)return;
    try{await navigator.clipboard.writeText(window.location.origin+"/q/"+quiz.id);
      setNotice("Link do quiz copiado.");}
    catch{setError("Abra o quiz publicado e copie o endereço da barra do navegador.");}
  }
  async function showResponses(){
    setTab("responses");setError("");
    if(!quiz?.id)return;
    setLoadingResponses(true);
    try{
      const response=await fetch("/api/quizzes/"+encodeURIComponent(quiz.id)+"/responses",{cache:"no-store"});
      const data=await response.json().catch(()=>({})) as {responses?:QuizEntry[];error?:string};
      if(!response.ok)throw new Error(data.error||"Falha ao carregar participações.");
      setResponses(data.responses||[]);
    }catch(e){setError(errText(e));}
    finally{setLoadingResponses(false);}
  }
  function appendQuestion(){
    if(!quiz||quiz.questions.length>=15)return;
    const id="q-"+crypto.randomUUID().slice(0,8),outcomeId=quiz.outcomes[0].id;
    change({questions:[...quiz.questions,{id,title:"Nova pergunta",options:[
      {id:"o1",label:"Primeira resposta",outcomeId},
      {id:"o2",label:"Segunda resposta",outcomeId},
    ]}]});
  }
  function removeQuestion(id:string){
    if(!quiz||quiz.questions.length<=3)return;
    change({questions:quiz.questions.filter(q=>q.id!==id)});
  }
  function appendOutcome(){
    if(!quiz||quiz.outcomes.length>=5)return;
    change({outcomes:[...quiz.outcomes,{id:"perfil-"+crypto.randomUUID().slice(0,8),
      title:"Novo perfil",description:"Descrição deste resultado.",ctaLabel:"Saiba mais",ctaUrl:""}]});
  }
  function removeOutcome(id:string){
    if(!quiz||quiz.outcomes.length<=2)return;
    const rest=quiz.outcomes.filter(o=>o.id!==id);
    change({outcomes:rest,questions:quiz.questions.map(q=>({...q,options:q.options.map(o=>(
      o.outcomeId===id?{...o,outcomeId:rest[0].id}:o
    ))}))});
  }
  function settingsEditor(){
    if(!quiz)return null;
    return <div className="space-y-5">
      <section className="rounded-[22px] border border-white/10 bg-[#142019] p-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.13em] text-[#74e5b2]">
          <FileQuestion className="h-4 w-4"/> Identidade do quiz
        </div>
        <label className="mt-5 block text-xs font-semibold text-white/70">Título
          <input className={input+" mt-2"} value={quiz.title}
            onChange={e=>change({title:e.target.value})} maxLength={130}/>
        </label>
        <label className="mt-4 block text-xs font-semibold text-white/70">Subtítulo
          <textarea className={input+" mt-2 min-h-20 resize-y"} value={quiz.subtitle}
            onChange={e=>change({subtitle:e.target.value})} maxLength={350}/>
        </label>
        <MediaImageField label="Imagem de capa" hint="A imagem aparece no topo do quiz publicado." value={quiz.coverImageUrl} onChange={url=>change({coverImageUrl:url})}/>
        <p className="mt-4 text-xs font-semibold text-white/65">Estilo visual</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {themes.map(theme=><button key={theme.id} type="button"
            onClick={()=>change({theme:theme.id})} aria-pressed={quiz.theme===theme.id}
            className={"flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition "+
              (quiz.theme===theme.id?"border-emerald-400/70 bg-emerald-400/10":"border-white/10 bg-white/[.03]")}>
            <span className={"h-3.5 w-3.5 rounded-full "+theme.swatch}/>{theme.name}
          </button>)}
        </div>
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-black/15 p-4 text-sm leading-6"><input type="checkbox" className="mt-1 accent-emerald-400" checked={quiz.motion!==false} onChange={e=>change({motion:e.target.checked})}/><span><strong className="block text-sm">Animações suaves</strong><span className="block text-xs text-white/55">Transições entre perguntas, respeitando movimento reduzido.</span></span></label>
        <label className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-black/15 p-4 text-sm leading-6">
          <input type="checkbox" className="mt-1 accent-emerald-400" checked={quiz.collectLeads}
            onChange={e=>change({collectLeads:e.target.checked})}/>
          <span><strong className="block text-sm">Capturar leads antes do resultado</strong>
            <span className="block text-xs text-white/55">Solicita nome, e-mail e consentimento explícito. Os contatos ficam apenas na sua área privada.</span>
          </span>
        </label>
      </section>
    </div>;
  }
  function editor(){
    if(!quiz)return null;
    return <div className="space-y-4">
      <div className="space-y-4">
        {quiz.questions.map((question,index)=><section key={question.id}
          className="rounded-[22px] border border-white/10 bg-[#142019] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
              PERGUNTA {String(index+1).padStart(2,"0")}
            </span>
            <button type="button" onClick={()=>removeQuestion(question.id)}
              disabled={quiz.questions.length<=3} title="Excluir pergunta"
              className="rounded-lg border border-white/10 p-2 text-white/45 hover:text-red-300 disabled:opacity-30">
              <Trash2 className="h-4 w-4"/>
            </button>
          </div>
          <textarea className={input+" min-h-20 resize-y text-base font-semibold"} value={question.title}
            maxLength={260} onChange={e=>changeQuestion(question.id,{title:e.target.value})}/>
          <div className="mt-4 space-y-2">
            {question.options.map((opt,i)=><div key={opt.id} className="grid grid-cols-[22px_minmax(0,1fr)_36px] items-center gap-2">
              <span className="text-xs font-semibold text-white/50">{String.fromCharCode(65+i)}</span>
              <input className={input} aria-label={"Texto da resposta "+(i+1)} maxLength={160}
                value={opt.label} onChange={e=>changeQuestion(question.id,{
                  options:question.options.map(o=>o.id===opt.id?{...o,label:e.target.value}:o),
                })}/>
              <button type="button" disabled={question.options.length<=2} title="Remover opção" aria-label={"Excluir resposta "+(i+1)}
                className="rounded-lg p-2 text-white/40 hover:text-red-300 disabled:opacity-25"
                onClick={()=>changeQuestion(question.id,{options:question.options.filter(o=>o.id!==opt.id)})}>
                <Trash2 className="h-4 w-4"/>
              </button>
            </div>)}
          </div>
          <details className="mt-4 rounded-xl border border-white/10 bg-black/10 px-3 py-3">
            <summary className="cursor-pointer text-xs font-semibold text-white/65">Imagens, emojis e lógica de resultados (opcional)</summary>
            <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
              <div className="flex flex-wrap gap-1.5">{["✨","❤️","🔥","🎯","🍽️","🏡","🚀","💡"].map(emoji=><button key={emoji} type="button"
                title={"Adicionar "+emoji+" à pergunta"} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-base"
                onClick={()=>changeQuestion(question.id,{title:question.title+" "+emoji})}>{emoji}</button>)}</div>
              <MediaImageField label={"Imagem da pergunta "+(index+1)} value={question.imageUrl}
                onChange={imageUrl=>changeQuestion(question.id,{imageUrl})}/>
              {question.options.map((opt,i)=><div key={opt.id} className="space-y-2 border-t border-white/10 pt-3">
                <p className="text-xs font-semibold text-white/65">Resposta {String.fromCharCode(65+i)}</p>
                <MediaImageField label={"Imagem da opção "+String.fromCharCode(65+i)} value={opt.imageUrl}
                  onChange={imageUrl=>changeQuestion(question.id,{options:question.options.map(o=>o.id===opt.id?{...o,imageUrl}:o)})}/>
                <label className="block text-xs text-white/55">Perfil associado
                  <select className={input+" mt-1"} value={opt.outcomeId}
                    onChange={e=>changeQuestion(question.id,{options:question.options.map(o=>o.id===opt.id?{...o,outcomeId:e.target.value}:o)})}>
                    {quiz.outcomes.map(o=><option key={o.id} value={o.id}>{o.title}</option>)}
                  </select>
                </label>
              </div>)}
            </div>
          </details>
          {question.options.length<6&&<button type="button" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300"
            onClick={()=>changeQuestion(question.id,{options:[...question.options,{
              id:"o-"+crypto.randomUUID().slice(0,7),label:"Nova resposta",outcomeId:quiz.outcomes[0].id,
            }]})}><Plus className="h-4 w-4"/> Adicionar opção</button>}
        </section>)}
        <button type="button" disabled={quiz.questions.length>=15} onClick={appendQuestion}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-400/35 bg-emerald-400/[.04] px-5 py-4 text-sm font-semibold text-emerald-200 disabled:opacity-35">
          <Plus className="h-4 w-4"/> Adicionar pergunta
        </button>
      </div>
    </div>;
  }
  function resultsEditor(){
    if(!quiz)return null;
    return <div className="space-y-4">
      <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[.045] p-4 text-xs leading-6 text-white/65">
        Cada resposta aponta para um perfil. O resultado que receber mais pontos aparece ao final do quiz.
        Você pode editar os perfis e mudar a associação das respostas na aba Perguntas.
      </div>
      {quiz.outcomes.map((o,i)=><section key={o.id} className="rounded-[22px] border border-white/10 bg-[#142019] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-emerald-300">Resultado {i+1}</h3>
          <button disabled={quiz.outcomes.length<=2} onClick={()=>removeOutcome(o.id)}
            title="Excluir resultado" className="rounded-lg p-2 text-white/45 hover:text-red-300 disabled:opacity-25"><Trash2 className="h-4 w-4"/></button>
        </div>
        <MediaImageField label="Imagem do resultado" value={o.imageUrl} onChange={imageUrl=>changeOutcome(o.id,{imageUrl})}/>
        <label className="mt-4 block text-xs font-semibold text-white/65">Nome do perfil
          <input className={input+" mt-2"} value={o.title} maxLength={110}
            onChange={e=>changeOutcome(o.id,{title:e.target.value})}/>
        </label>
        <label className="mt-4 block text-xs font-semibold text-white/65">Mensagem do resultado
          <textarea className={input+" mt-2 min-h-32 resize-y"} value={o.description}
            maxLength={1600} onChange={e=>changeOutcome(o.id,{description:e.target.value})}/>
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-white/65">Texto do botão
            <input className={input+" mt-2"} value={o.ctaLabel} maxLength={65}
              onChange={e=>changeOutcome(o.id,{ctaLabel:e.target.value})}/>
          </label>
          <label className="block text-xs font-semibold text-white/65">Link do botão (opcional)
            <input className={input+" mt-2"} type="url" placeholder="https://..."
              value={o.ctaUrl} maxLength={500}
              onChange={e=>changeOutcome(o.id,{ctaUrl:e.target.value})}/>
          </label>
        </div>
      </section>)}
      <button type="button" disabled={quiz.outcomes.length>=5} onClick={appendOutcome}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-400/35 px-4 py-4 text-sm font-semibold text-emerald-300 disabled:opacity-30">
        <Plus className="h-4 w-4"/> Adicionar resultado
      </button>
    </div>;
  }
  function responseList(){
    if(!quiz)return null;
    const counts=quiz.outcomes.map(o=>({id:o.id,name:o.title,count:responses.filter(r=>r.outcomeId===o.id).length}));
    return <div className="space-y-4">
      {!quiz.id?<p className="rounded-xl border border-white/10 p-6 text-sm text-white/55">Salve e publique o quiz para receber participações.</p>:
        loadingResponses?<p className="text-sm text-white/60">Carregando participações...</p>:
        <><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-white/50">Resultados finais das participações recentes</span><button type="button" onClick={()=>downloadStudioCsv("respostas-quiz-"+quiz.id+".csv",["Data","Resultado","Nome","Email",...quiz.questions.map(q=>q.title)],responses.map(entry=>[
          entry.submittedAt,quiz.outcomes.find(o=>o.id===entry.outcomeId)?.title||"Resultado",entry.lead?.name||"",entry.lead?.email||"",
          ...quiz.questions.map(question=>question.options.find(option=>option.id===entry.answers.find(answer=>answer.questionId===question.id)?.optionId)?.label||"")
        ]))} disabled={responses.length===0} className="rounded-xl border border-emerald-400/30 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-40">Exportar CSV</button></div><div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#142019] p-5">
            <p className="text-xs text-white/50">Participações recentes</p>
            <p className="mt-2 text-3xl font-bold">{responses.length}</p>
          </div>
          {counts.map(o=><div key={o.id} className="rounded-xl border border-white/10 bg-[#142019] p-5">
            <p className="truncate text-xs text-white/55" title={o.name}>{o.name}</p>
            <p className="mt-2 text-3xl font-bold">{o.count}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{width:(responses.length?Math.round(o.count/responses.length*100):0)+"%"}}/></div>
          </div>)}
        </div>
        {responses.length===0?<p className="rounded-xl border border-white/10 p-7 text-center text-sm text-white/55">Ainda não há respostas. Compartilhe o link publicado para receber participações.</p>:
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {responses.map(entry=><article key={entry.id} className="min-w-0 rounded-2xl border border-white/10 bg-[#142019] p-5 transition hover:border-emerald-400/30">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-base font-bold text-emerald-200">{(entry.lead?.name?.trim()?.[0]||"P").toLocaleUpperCase("pt-BR")}</span>
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-base font-bold text-white">{entry.lead?.name?.trim()||"Participante sem nome"}</h3>
                <p className="mt-1 text-xs text-white/45">{prettyDate(entry.submittedAt)}</p>
              </div>
            </div>
            {entry.lead?.email&&<p className="mt-3 break-all text-xs text-emerald-200">{entry.lead.email}</p>}
            <div className="mt-4 rounded-xl border border-white/10 bg-black/15 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Resultado do quiz</p>
              <p className="mt-1 break-words text-sm font-semibold text-white/90">{quiz.outcomes.find(o=>o.id===entry.outcomeId)?.title||"Resultado"}</p>
            </div>
            <details className="mt-4 rounded-xl border border-white/10 bg-black/15 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-emerald-200">Ver respostas ({entry.answers.length})</summary>
              <div className="mt-4 space-y-3">{quiz.questions.map((question,i)=><div key={question.id}>
                <p className="text-xs font-semibold leading-5 text-white/65">{i+1}. {question.title}</p>
                <p className="mt-1 text-xs leading-5 text-white/90">{question.options.find(option=>option.id===entry.answers.find(a=>a.questionId===question.id)?.optionId)?.label||"Não informado"}</p>
              </div>)}</div>
            </details>
          </article>)}
        </div>
        </>}
      <p className="text-xs leading-6 text-white/40">Exibindo até 100 participações recentes. Os dados são privados e acessíveis apenas ao responsável pelo projeto.</p>
    </div>;
  }
  function chatPanel(compact=false){
    return <div className={"flex flex-col rounded-[22px] border border-emerald-400/20 bg-[#142019] "+
      (compact?"p-4":"min-h-[540px] p-5")}>
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300"><WandSparkles className="h-5 w-5"/></span>
        <div><p className="text-sm font-bold">Assistente PageNova AI</p>
          <p className="text-xs text-white/45">Crie, refine e publique seu quiz</p></div>
      </div>
      <div className="flex max-h-[330px] min-h-[140px] flex-1 flex-col gap-3 overflow-y-auto py-5">
        {conversation.map((message,i)=><div key={i} className={"max-w-[95%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 "+
          (message.role==="assistant"?"self-start border border-white/10 bg-white/[.055] text-white/80":"self-end bg-emerald-400/15 text-emerald-100")}>
          {message.text}
        </div>)}
        {busy&&<div role="status" className="flex items-center gap-2 text-xs text-emerald-300"><LoaderCircle className="h-4 w-4 animate-spin"/> Montando o quiz com modelos locais...</div>}
      </div>
      <form onSubmit={askAI} className="relative">
        <label htmlFor={compact?"quiz-prompt-mobile":"quiz-prompt"} className="sr-only">Mensagem para a IA</label>
        <textarea id={compact?"quiz-prompt-mobile":"quiz-prompt"} value={prompt}
          onChange={e=>setPrompt(e.target.value)}
          placeholder={quiz?"Peça uma mudança: mais divertido, menos perguntas, novo público...":"Descreva o quiz que deseja criar..."}
          className="block min-h-28 w-full resize-y rounded-2xl border border-white/15 bg-[#0b100d] px-4 pb-14 pt-3 text-sm leading-6 text-white outline-none placeholder:text-white/35 focus:border-emerald-400/50"
          onKeyDown={e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();void askAI();}}}/>
        <div className="absolute bottom-3 left-3"><VoiceButton disabled={busy} onText={text=>setPrompt(current=>(current?current+" ":"")+text)}/></div>
        <button type="submit" disabled={busy||prompt.trim().length<12}
          className="absolute bottom-3 right-3 inline-flex h-10 items-center gap-2 rounded-xl bg-[#8fec78] px-4 text-xs font-bold text-[#14220f] transition hover:bg-[#a8f494] disabled:opacity-40">
          {busy?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}
          {quiz?"Aplicar comando":"Gerar Quiz"}
        </button>
      </form>
      <p className="mt-3 text-[11px] leading-5 text-white/40">Ctrl + Enter para enviar. Revisões não publicam automaticamente.</p>
    </div>;
  }
  return <main className="min-h-screen bg-[#0b100d] px-4 pb-16 pt-7 font-sans text-white sm:px-7 lg:px-10">
    {screen==="start"?<div className="mx-auto max-w-[1160px]">
      <div className="mx-auto max-w-2xl pt-4 text-center sm:pt-8">
        <span className="text-xs font-bold uppercase tracking-[.16em] text-emerald-300">PageNova AI · Criador de quiz</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Qual quiz vamos criar?</h1>
        <p className="mt-2 text-sm text-white/55">Descreva sua ideia. Geramos e mostramos a prévia para você.</p>
      </div>
      <form onSubmit={askAI} className="mx-auto mt-7 max-w-[780px] rounded-[22px] border border-emerald-400/20 bg-[#142019] p-4 sm:p-5">
        <label htmlFor="quiz-create-prompt" className="mb-2 block text-xs font-semibold text-emerald-200">O que você quer criar?</label>
        <textarea id="quiz-create-prompt" value={prompt} onChange={e=>setPrompt(e.target.value)}
          placeholder="Ex.: Crie um quiz com 5 perguntas para recomendar o imóvel ideal e captar contatos."
          rows={4} className="w-full resize-y rounded-xl border border-white/15 bg-[#0b100d] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/35 focus:border-emerald-400/60"
          onKeyDown={e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();void askAI();}}}/>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <VoiceButton disabled={busy} onText={text=>setPrompt(current=>(current?current+" ":"")+text)}/>
          <button type="submit" disabled={busy||prompt.trim().length<12}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#8fec78] px-6 py-3 text-sm font-bold text-[#14220f] disabled:opacity-40">
            {busy?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Sparkles className="h-4 w-4"/>} {busy?"Gerando quiz...":"Gerar e visualizar"}
          </button>
        </div>
        <details className="mt-4 border-t border-white/10 pt-3 text-left text-xs text-white/60">
          <summary className="cursor-pointer font-semibold text-emerald-200">Ver ideias de quiz</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {ideas.map((idea,i)=><button key={i} type="button" onClick={()=>setPrompt(idea)}
              className="rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-white/70 hover:border-emerald-300/40">
              {idea}
            </button>)}
          </div>
        </details>
      </form>
      {error&&<p role="alert" className="mx-auto mt-4 max-w-[780px] rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      <div className="mt-10 border-t border-white/10 pt-7">
        <div className="flex items-end justify-between gap-4">
          <div><h2 className="text-xl font-bold">Seus quizzes</h2>
            <p className="mt-1 text-xs text-white/50">Clique em um quiz para editar e consultar suas respostas individualmente.</p></div>
          <span className="text-xs text-white/40">{saved.length} projetos</span>
        </div>
        {listLoading?<p className="mt-6 text-sm text-white/50">Carregando projetos...</p>:
          saved.length===0?<div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[.025] px-6 py-9 text-center text-sm text-white/50">
            Seus quizzes aparecerão aqui depois de salvar o primeiro.
          </div>:
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {saved.map(item=><div key={item.id} className="relative"><button key={item.id} type="button" onClick={()=>void openSaved(item.id)} disabled={busy}
              className="group rounded-2xl border border-white/10 bg-[#142019] p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-400/35 disabled:opacity-50">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><FileQuestion className="h-5 w-5"/></span>
              <h3 className="mt-4 line-clamp-2 text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-xs text-white/45">{item.questions} perguntas · {prettyDate(item.updatedAt)}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className={"text-xs font-semibold "+(item.publishedAt?"text-emerald-300":"text-white/50")}>
                  {item.publishedAt?"Publicado":"Rascunho"}
                </span>
                <ArrowRight className="h-4 w-4 text-white/50 group-hover:text-emerald-300"/>
              </div>
            </button>
            
            </div>)}
          </div>}
      </div>
    </div>:quiz?<div className="mx-auto max-w-[1500px]">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button type="button" onClick={back} aria-label="Voltar aos quizzes" title="Voltar aos quizzes"
            className="shrink-0 rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4"/>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold sm:text-lg">{quiz.title}</h1>
            <p className="text-[11px] text-white/45">{dirty?"Alterações não salvas":quiz.publishedAt?"Publicado · edição disponível":"Rascunho"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={()=>void publish()} disabled={publishing||saving||busy}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-400 px-3.5 py-2 text-xs font-bold text-[#14220f] disabled:opacity-40">
            {publishing?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Globe2 className="h-4 w-4"/>}
            {quiz.publishedAt?"Atualizar":"Publicar"}
          </button>
          <div className="relative">
            <button type="button" onClick={()=>setMoreOpen(v=>!v)} aria-expanded={moreOpen} aria-controls="quiz-more-menu"
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10">
              Mais <ChevronDown className={"h-4 w-4 transition "+(moreOpen?"rotate-180":"")}/>
            </button>
            {moreOpen&&<div id="quiz-more-menu" className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-white/15 bg-[#12271d] p-1.5 shadow-2xl">
              <button type="button" onClick={()=>{setMoreOpen(false);void save();}} disabled={saving||publishing||busy}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs hover:bg-white/10 disabled:opacity-40">
                <Save className="h-4 w-4"/> Salvar rascunho
              </button>
              <button type="button" onClick={()=>{setMoreOpen(false);setTab("outcomes");}}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs hover:bg-white/10">
                <BookOpen className="h-4 w-4"/> Editar resultados
              </button>
              <button type="button" onClick={()=>{setMoreOpen(false);void showResponses();}}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs hover:bg-white/10">
                <BarChart3 className="h-4 w-4"/> Participações e leads
              </button>
              {quiz.id&&quiz.publishedAt&&<>
                <button type="button" onClick={()=>{setMoreOpen(false);void copyLink();}}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs hover:bg-white/10">
                  <ClipboardCopy className="h-4 w-4"/> Copiar link público
                </button>
                <a href={"/q/"+quiz.id} target="_blank" rel="noreferrer" onClick={()=>setMoreOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs hover:bg-white/10">
                  <ExternalLink className="h-4 w-4"/> Abrir quiz publicado
                </a>
              </>}
            </div>}
          </div>
        </div>
      </header>
      {(error||notice)&&<div className="mb-3 space-y-2">
        {error&&<p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {notice&&<p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</p>}
      </div>}
      <nav className="mb-3 flex items-center gap-1 rounded-xl border border-white/10 bg-[#0b100d] p-1" aria-label="Ferramentas do quiz">
        {([
          ["preview","Prévia",Eye],
          ["questions","Perguntas",FileQuestion],
          ["settings","Ajustes",WandSparkles],
          ["responses","Respostas",BarChart3],
        ] as const).map(([key,label,Icon])=><button type="button" key={key}
          onClick={()=>{setMoreOpen(false);if(key==="responses"){void showResponses();}else{setTab(key);}}}
          aria-current={tab===key?"page":undefined}
          className={"inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm "+
            (tab===key?"bg-[#356b2f] text-white":"text-white/60 hover:bg-white/5 hover:text-white")}>
          <Icon className="h-4 w-4 shrink-0"/><span className="truncate">{label}</span>
        </button>)}
      </nav>
      {tab==="preview"&&<details open={chatExpanded} onToggle={e=>setChatExpanded(e.currentTarget.open)}
        className="mb-3 rounded-xl border border-white/10 bg-[#142019]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-xs font-semibold text-emerald-200">
          <span className="flex items-center gap-2"><MessageSquareText className="h-4 w-4"/> Alterar quiz com IA</span>
          <ChevronDown className={"h-4 w-4 transition "+(chatExpanded?"rotate-180":"")}/>
        </summary>
        <div className="border-t border-white/10 p-2 sm:p-3">{chatPanel(true)}</div>
      </details>}
      <div className="mx-auto w-full max-w-[1100px]">
        {tab==="preview"?<div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#142019]">
          <PublicQuizPlayer key={quiz.id+quiz.updatedAt+String(quiz.questions.length)+"-"+previewRevision} quiz={publicQuiz(quiz)} preview={quiz}/>
        </div>:tab==="questions"?editor():tab==="settings"?settingsEditor():
          tab==="outcomes"?<div className="space-y-3">
            <button type="button" onClick={()=>setTab("preview")} className="inline-flex items-center gap-2 text-xs text-emerald-200"><ArrowLeft className="h-4 w-4"/> Voltar à prévia</button>
            {resultsEditor()}
          </div>:<div className="space-y-3">
            <button type="button" onClick={()=>setTab("preview")} className="inline-flex items-center gap-2 text-xs text-emerald-200"><ArrowLeft className="h-4 w-4"/> Voltar à prévia</button>
            {responseList()}
          </div>}
      </div>
    </div>:null}
  </main>;
}
