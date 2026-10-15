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

type QuizSummary={id:string;title:string;updatedAt:string;publishedAt:string|null;questions:number};
type Screen="start"|"editor";
type Tab="questions"|"outcomes"|"preview"|"responses";
type Message={role:"assistant"|"user";text:string};
const themes:{id:QuizTheme;name:string;swatch:string}[]=[
  {id:"emerald",name:"Verde PageNova",swatch:"bg-[#36d9a1]"},
  {id:"midnight",name:"Azul profundo",swatch:"bg-[#828dff]"},
  {id:"cream",name:"Editorial claro",swatch:"bg-[#e9dcc4]"},
];
const ideas=[
  "Crie um quiz para descobrir qual produto de skincare combina com cada pessoa.",
  "Faça um quiz de perfil para recomendar o melhor imóvel ao cliente.",
  "Quero um quiz interativo de 7 perguntas para captar leads de marketing.",
  "Monte um quiz divertido sobre estilo pessoal com três resultados diferentes.",
];
const input="w-full rounded-xl border border-white/[.14] bg-[#0a1b15] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10";
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
const greeting:Message={role:"assistant",text:"Olá! Sou a IA da PageNova. Conte o tema, o público e o objetivo do seu quiz. Vou criar as perguntas, os perfis de resultado e um visual pronto para publicar."};

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
  const [tab,setTab]=useState<Tab>("questions");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [responses,setResponses]=useState<QuizEntry[]>([]);
  const [loadingResponses,setLoadingResponses]=useState(false);
  const [chatExpanded,setChatExpanded]=useState(false);
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
    setQuiz(existing);setScreen("editor");setDirty(false);setTab("questions");
    setConversation([greeting,{role:"assistant",text:"Seu quiz está carregado! Pode editar os campos ao lado ou me pedir mudanças no chat."}]);
    setPrompt("");setError("");setNotice("");setResponses([]);
  }
  async function openSaved(id:string){
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/quizzes/"+encodeURIComponent(id),{cache:"no-store"});
      const body=await response.json().catch(()=>({})) as {quiz?:QuizProject;error?:string};
      if(!response.ok||!body.quiz)throw new Error(body.error||"O projeto não foi encontrado.");
      openQuiz(body.quiz);
    }catch(e){setError(errText(e));}
    finally{setBusy(false);}
  }
  function back(){
    if(dirty&&!window.confirm("Você tem alterações não salvas. Voltar mesmo assim?"))return;
    setScreen("start");setQuiz(null);setConversation([greeting]);setPrompt("");setTab("questions");
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
      const project:QuizProject={
        ...result,id:quiz?.id||"",updatedAt:quiz?.updatedAt||"",publishedAt:quiz?.publishedAt||null,
      };
      setQuiz(project);setScreen("editor");setDirty(true);setTab("questions");
      setConversation(items=>[...items,{role:"assistant",text:quiz
        ?"Pronto! Apliquei sua solicitação. Confira as perguntas e resultados, depois salve e publique a nova versão."
        :"Pronto! Criei seu quiz com perguntas, três perfis de resultado e um design responsivo. Você pode editar tudo antes de publicar."}]);
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
  function editor(){
    if(!quiz)return null;
    return <div className="space-y-5">
      <section className="rounded-[22px] border border-white/10 bg-[#10211a] p-5">
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
      <div className="space-y-4">
        {quiz.questions.map((question,index)=><section key={question.id}
          className="rounded-[22px] border border-white/10 bg-[#10211a] p-4 sm:p-5">
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
          <div className="mt-2 flex flex-wrap gap-1.5">{["✨","❤️","🔥","🎯","🍽️","🏡","🚀","💡"].map(emoji=><button key={emoji} type="button" title={"Adicionar "+emoji+" à pergunta"} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-base" onClick={()=>changeQuestion(question.id,{title:question.title+" "+emoji})}>{emoji}</button>)}</div>
          <MediaImageField label={"Imagem da pergunta "+(index+1)} value={question.imageUrl} onChange={imageUrl=>changeQuestion(question.id,{imageUrl})}/>
          <div className="mt-4 space-y-3">
            {question.options.map((opt,i)=><div key={opt.id} className="grid grid-cols-[22px_1fr] gap-2 sm:grid-cols-[22px_1fr_160px_32px] sm:items-center">
              <span className="pt-3 text-xs text-white/50">{String.fromCharCode(65+i)}</span>
              <input className={input} aria-label={"Texto da resposta "+(i+1)} maxLength={160}
                value={opt.label} onChange={e=>changeQuestion(question.id,{
                  options:question.options.map(o=>o.id===opt.id?{...o,label:e.target.value}:o),
                })}/>
              <div className="col-start-2 sm:col-span-3"><MediaImageField label={"Imagem da opção "+String.fromCharCode(65+i)} value={opt.imageUrl} onChange={imageUrl=>changeQuestion(question.id,{options:question.options.map(o=>o.id===opt.id?{...o,imageUrl}:o)})}/></div>
              <select className={input+" col-start-2 sm:col-auto"} aria-label={"Perfil associado à resposta "+(i+1)}
                value={opt.outcomeId} onChange={e=>changeQuestion(question.id,{
                  options:question.options.map(o=>o.id===opt.id?{...o,outcomeId:e.target.value}:o),
                })}>
                {quiz.outcomes.map(o=><option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
              <button type="button" disabled={question.options.length<=2}
                className="col-start-2 ml-auto rounded-lg p-2 text-white/40 hover:text-red-300 disabled:opacity-25 sm:col-auto sm:ml-0"
                title="Remover opção"
                onClick={()=>changeQuestion(question.id,{options:question.options.filter(o=>o.id!==opt.id)})}>
                <Trash2 className="h-4 w-4"/>
              </button>
            </div>)}
          </div>
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
      {quiz.outcomes.map((o,i)=><section key={o.id} className="rounded-[22px] border border-white/10 bg-[#10211a] p-5">
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
        <><div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#10211a] p-5">
            <p className="text-xs text-white/50">Participações recentes</p>
            <p className="mt-2 text-3xl font-bold">{responses.length}</p>
          </div>
          {counts.slice(0,2).map(o=><div key={o.id} className="rounded-xl border border-white/10 bg-[#10211a] p-5">
            <p className="truncate text-xs text-white/55" title={o.name}>{o.name}</p>
            <p className="mt-2 text-3xl font-bold">{o.count}</p>
          </div>)}
        </div>
        {responses.length===0?<p className="rounded-xl border border-white/10 p-7 text-center text-sm text-white/55">Ainda não há respostas. Compartilhe o link publicado para receber participações.</p>:
        responses.map(entry=><div key={entry.id} className="rounded-xl border border-white/10 bg-[#10211a] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-sm">{quiz.outcomes.find(o=>o.id===entry.outcomeId)?.title||"Resultado"}</strong>
            <span className="text-xs text-white/45">{prettyDate(entry.submittedAt)}</span>
          </div>
          {entry.lead&&<p className="mt-2 break-words text-xs text-emerald-200">{entry.lead.name} · {entry.lead.email}</p>}
          <p className="mt-1 text-xs text-white/40">{entry.answers.length} respostas</p>
        </div>)}
        </>}
      <p className="text-xs leading-6 text-white/40">Exibindo até 100 participações recentes. Os dados são privados e acessíveis apenas ao responsável pelo projeto.</p>
    </div>;
  }
  function chatPanel(compact=false){
    return <div className={"flex flex-col rounded-[22px] border border-emerald-400/20 bg-[#0a2118] "+
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
        {busy&&<div role="status" className="flex items-center gap-2 text-xs text-emerald-300"><LoaderCircle className="h-4 w-4 animate-spin"/> A IA está criando o conteúdo...</div>}
      </div>
      <form onSubmit={askAI} className="relative">
        <label htmlFor={compact?"quiz-prompt-mobile":"quiz-prompt"} className="sr-only">Mensagem para a IA</label>
        <textarea id={compact?"quiz-prompt-mobile":"quiz-prompt"} value={prompt}
          onChange={e=>setPrompt(e.target.value)}
          placeholder={quiz?"Peça uma mudança: mais divertido, menos perguntas, novo público...":"Descreva o quiz que deseja criar..."}
          className="block min-h-28 w-full resize-y rounded-2xl border border-white/15 bg-[#061810] px-4 pb-14 pt-3 text-sm leading-6 text-white outline-none placeholder:text-white/35 focus:border-emerald-400/50"
          onKeyDown={e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();void askAI();}}}/>
        <div className="absolute bottom-3 left-3"><VoiceButton disabled={busy} onText={text=>setPrompt(current=>(current?current+" ":"")+text)}/></div>
        <button type="submit" disabled={busy||prompt.trim().length<12}
          className="absolute bottom-3 right-3 inline-flex h-10 items-center gap-2 rounded-xl bg-[#38dba3] px-4 text-xs font-bold text-[#062b20] transition hover:bg-[#65ebba] disabled:opacity-40">
          {busy?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}
          {quiz?"Alterar com IA":"Gerar Quiz"}
        </button>
      </form>
      <p className="mt-3 text-[11px] leading-5 text-white/40">Ctrl + Enter para enviar. Revisões não publicam automaticamente.</p>
    </div>;
  }
  return <main className="min-h-screen bg-[#07130e] px-4 pb-16 pt-7 font-sans text-white sm:px-7 lg:px-10">
    {screen==="start"?<div className="mx-auto max-w-[1160px]">
      <div className="mx-auto max-w-3xl pt-5 text-center sm:pt-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[.065] px-4 py-2 text-[11px] font-bold uppercase tracking-[.15em] text-emerald-300">
          <Sparkles className="h-4 w-4"/> PageNova AI · Quiz Studio
        </span>
        <h1 className="mt-6 text-[clamp(2rem,5.8vw,3.8rem)] font-bold leading-[1.08] tracking-[-.055em]">
          Qual quiz vamos <span className="text-[#5ce7b1]">criar hoje?</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/60 sm:text-base">
          Descreva sua ideia em linguagem natural. A IA cria perguntas, perfis de resultado e a experiência completa para você editar e publicar.
        </p>
      </div>
      <div className="mx-auto mt-9 max-w-[850px]">
        {chatPanel()}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {ideas.map((idea,i)=><button type="button" key={i} onClick={()=>setPrompt(idea)}
            className="max-w-full rounded-full border border-white/10 bg-white/[.035] px-4 py-2.5 text-left text-xs text-white/65 transition hover:border-emerald-300/40 hover:text-white">
            {idea.length>74?idea.slice(0,74)+"…":idea}
          </button>)}
        </div>
      </div>
      <div className="mt-16 border-t border-white/10 pt-9">
        <div className="flex items-end justify-between gap-4">
          <div><h2 className="text-xl font-bold">Seus quizzes</h2>
            <p className="mt-1 text-xs text-white/50">Continue um rascunho ou edite um quiz publicado.</p></div>
          <span className="text-xs text-white/40">{saved.length} projetos</span>
        </div>
        {listLoading?<p className="mt-6 text-sm text-white/50">Carregando projetos...</p>:
          saved.length===0?<div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[.025] px-6 py-9 text-center text-sm text-white/50">
            Seus quizzes aparecerão aqui depois de salvar o primeiro.
          </div>:
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {saved.map(item=><button key={item.id} type="button" onClick={()=>void openSaved(item.id)} disabled={busy}
              className="group rounded-2xl border border-white/10 bg-[#10211a] p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-400/35 disabled:opacity-50">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><FileQuestion className="h-5 w-5"/></span>
              <h3 className="mt-4 line-clamp-2 text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-xs text-white/45">{item.questions} perguntas · {prettyDate(item.updatedAt)}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className={"text-xs font-semibold "+(item.publishedAt?"text-emerald-300":"text-white/50")}>
                  {item.publishedAt?"Publicado":"Rascunho"}
                </span>
                <ArrowRight className="h-4 w-4 text-white/50 group-hover:text-emerald-300"/>
              </div>
            </button>)}
          </div>}
      </div>
    </div>:quiz?<div className="mx-auto max-w-[1500px]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={back} className="rounded-xl border border-white/10 p-2.5 text-white/70 hover:bg-white/10" title="Voltar aos quizzes">
            <ArrowLeft className="h-5 w-5"/>
          </button>
          <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[.15em] text-emerald-300">Gerar Quiz</p>
            <h1 className="truncate text-lg font-bold sm:text-2xl">{quiz.title}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={()=>void save()} disabled={saving||publishing||busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-3.5 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-40">
            {saving?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>} Salvar
          </button>
          <button type="button" onClick={()=>void publish()} disabled={publishing||saving||busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#38dba3] px-4 py-2 text-xs font-bold text-[#062b20] hover:bg-[#63e9b6] disabled:opacity-40">
            {publishing?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Globe2 className="h-4 w-4"/>} {quiz.publishedAt?"Atualizar publicação":"Publicar quiz"}
          </button>
        </div>
      </header>
      {(error||notice||dirty||quiz.publishedAt)&&<div className="mb-5 space-y-2">
        {error&&<p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {notice&&<p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</p>}
        {dirty&&<p className="text-xs text-amber-300">Há alterações não salvas. Publique novamente para atualizar o link público.</p>}
        {quiz.id&&quiz.publishedAt&&<div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-4 py-3 text-xs">
          <span className="font-semibold text-emerald-300">Publicado:</span>
          <a href={"/q/"+quiz.id} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-white/65 hover:text-white">
            {origin+"/q/"+quiz.id}
          </a>
          <button onClick={()=>void copyLink()} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-2 font-semibold hover:bg-white/10"><ClipboardCopy className="h-3.5 w-3.5"/> Copiar</button>
          <a href={"/q/"+quiz.id} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-white/70 hover:bg-white/10" aria-label="Abrir quiz publicado"><ExternalLink className="h-4 w-4"/></a>
        </div>}
      </div>}
      <button type="button" className="mb-4 flex w-full items-center justify-between rounded-xl border border-emerald-400/20 bg-[#0a2118] p-4 text-left text-sm font-semibold lg:hidden"
        onClick={()=>setChatExpanded(v=>!v)}>
        <span className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-emerald-300"/> Conversar com a IA</span>
        <ChevronDown className={"h-4 w-4 transition "+(chatExpanded?"rotate-180":"")}/>
      </button>
      {chatExpanded&&<div className="mb-5 lg:hidden">{chatPanel(true)}</div>}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <nav className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-[#0b1c14] p-1.5" aria-label="Editor do quiz">
            {([
              ["questions","Perguntas",FileQuestion],
              ["outcomes","Resultados",BookOpen],
              ["preview","Prévia",Eye],
              ["responses","Participações",BarChart3],
            ] as const).map(([key,label,Icon])=><button key={key} type="button"
              onClick={()=>{if(key==="responses")void showResponses();else setTab(key);}}
              aria-current={tab===key?"page":undefined}
              className={"inline-flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-3 text-xs font-semibold transition sm:text-sm "+
                (tab===key?"bg-[#1f694e] text-white":"text-white/55 hover:bg-white/[.06] hover:text-white")}>
              <Icon className="h-4 w-4"/>{label}
            </button>)}
          </nav>
          {tab==="questions"?editor():tab==="outcomes"?resultsEditor():
            tab==="preview"?<div className="overflow-hidden rounded-[24px] border border-white/10">
              <PublicQuizPlayer key={quiz.id+quiz.updatedAt+String(quiz.questions.length)} quiz={publicQuiz(quiz)} preview={quiz}/>
            </div>:responseList()}
        </div>
        <aside className="hidden lg:block"><div className="sticky top-6">{chatPanel()}</div></aside>
      </div>
    </div>:null}
    {screen==="start"&&error&&<p role="alert" className="mx-auto mt-5 max-w-3xl rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
  </main>;
}
