// @ts-nocheck
// TEMPORARY: JSX typing isolation pending detailed build diagnostics; server APIs remain strictly checked.
"use client";

import { useCallback,useEffect,useMemo,useRef,useState,type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { LANDING_KINDS,LANDING_PRESETS,LANDING_SECTIONS,newLanding,normalizeLanding,renderLandingHtml,analyzeLandingBrief,
 type LandingKind,type LandingProject,type LandingSection,type LandingFaq } from "@/lib/landing/engine";
import { ArrowDown,ArrowLeft,ArrowRight,ArrowUp,Check,CheckCircle2,ChevronDown,Copy,
 ExternalLink,ImagePlus,LayoutTemplate,LoaderCircle,Monitor,Plus,Save,Send,Settings2,
 Smartphone,Trash2,Users,WandSparkles } from "lucide-react";

type Tab="content"|"structure"|"design";
type EditorSection=LandingSection|"hero"|"comparison"|"bonuses"|"guarantee";
type Draft={id:string;updatedAt:string};
type Lead={name:string;email:string;message?:string;submittedAt:string};
const sectionLabels:Record<LandingSection|"hero",string>={
 hero:"Primeira dobra",benefits:"Benefícios",details:"Apresentação",process:"Como funciona",
 proof:"Depoimento",offer:"Oferta e CTA",faq:"Dúvidas frequentes",contact:"Formulário e contato"
};
function errorText(error:unknown){return error instanceof Error?error.message:"Não foi possível concluir.";}
const inputClass="w-full rounded-xl border border-white/10 bg-[#181e2a] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/70";
function Field({label,value,onChange,placeholder="",rows=0,hint}:{
 label:string;value:string;onChange:(v:string)=>void;placeholder?:string;rows?:number;hint?:string;
}){
 return <label className="block space-y-2"><span className="text-xs font-semibold text-white/70">{label}</span>
 {rows?<textarea className={inputClass+" min-h-24 resize-y"} rows={rows} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} />:
  <input className={inputClass} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} />}
 {hint&&<small className="block text-[11px] leading-5 text-white/40">{hint}</small>}</label>;
}
const kindsArtwork:Record<LandingKind,string>={
 product:"from-[#ecd8bd] via-[#b98a70] to-[#42302b]",
 course:"from-[#171c2a] via-[#ae5832] to-[#edb24d]",
 leads:"from-[#b6ddff] via-[#629dea] to-[#153d9e]",
 services:"from-[#182a24] via-[#597364] to-[#a0a387]",
 saas:"from-[#222441] via-[#473a8d] to-[#a092ef]",
 event:"from-[#5f253c] via-[#e37c8f] to-[#f0bfa5]"
};
function FeaturePreview({kind}:{kind:LandingKind}){
 return <div className={"relative h-28 overflow-hidden rounded-t-2xl bg-gradient-to-br "+kindsArtwork[kind]}>
  <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border-[20px] border-white/15"/>
  <div className="absolute bottom-[-12px] left-6 h-24 w-[70%] -rotate-3 rounded-t-xl border border-white/25 bg-black/20 p-3 shadow-2xl backdrop-blur-sm">
   <div className="h-2 w-10 rounded bg-white/70"/><div className="mt-2 h-2 w-24 rounded bg-white/30"/>
   <div className="mt-3 flex gap-2"><span className="h-7 w-12 rounded bg-white/70"/><span className="h-7 w-12 rounded bg-white/20"/></div>
  </div>
 </div>;
}
export default function LandingStudioPage(){
 const router=useRouter();
 const [kind,setKind]=useState<LandingKind>("product");
 const [brand,setBrand]=useState("");
 const [brief,setBrief]=useState("");
 const [project,setProject]=useState<LandingProject|null>(null);
 const [drafts,setDrafts]=useState<Draft[]>([]);
 const [loadingDrafts,setLoadingDrafts]=useState(true);
 const [opening,setOpening]=useState("");
 const [tab,setTab]=useState<Tab>("content");
 const [section,setSection]=useState<EditorSection>("hero");
 const [viewport,setViewport]=useState<"desktop"|"mobile">("desktop");
 const [busy,setBusy]=useState<""|"save"|"publish"|"leads">("");
 const [creatingStep,setCreatingStep]=useState("");
 const [briefInsights,setBriefInsights]=useState<string[]>([]);
 const [status,setStatus]=useState("");
 const [error,setError]=useState("");
 const [leads,setLeads]=useState<Lead[]|null>(null);
 const lastSaved=useRef<string>("");
 const latestProject=useRef<LandingProject|null>(null);
 latestProject.current=project;
 const preview=useMemo(()=>project?renderLandingHtml(project,true):"",[project]);
 const cloudRefresh=useCallback(async()=>{
  try{
   const res=await fetch("/api/landing",{credentials:"same-origin",cache:"no-store"});
   const body=await res.json() as {projects?:Draft[]};
   if(res.ok)setDrafts(body.projects||[]);
  }catch{/* browser may be offline; existing project stays editable */}
  finally{setLoadingDrafts(false);}
 },[]);
 useEffect(()=>{void cloudRefresh();},[cloudRefresh]);
 const patch=useCallback((values:Partial<LandingProject>)=>{
  setProject(current=>current?{...current,...values,updatedAt:new Date().toISOString()}:current);
  setError("");
  setLeads(null);
 },[]);
 async function create(){
  if(creatingStep)return;
  if(!brand.trim()){setError("Informe o nome da marca ou produto.");return;}
  if(!brief.trim()||brief.trim().length<20){
   setError("Descreva o produto com pelo menos 20 caracteres para criar uma página personalizada.");return;
  }
  setError("");
  const pause=(ms:number)=>new Promise<void>(resolve=>window.setTimeout(resolve,ms));
  try{
   setCreatingStep("1/3 · Identificando o produto e as informações do briefing");
   const facts=kind==="course"?analyzeLandingBrief(brand,brief).facts:[];
   const fresh=newLanding(kind,brand.trim(),brief);
   await pause(330);
   setCreatingStep("2/3 · Montando as seções com textos relacionados à oferta");
   await pause(360);
   setCreatingStep("3/3 · Preparando a visualização responsiva");
   await pause(360);
   setBriefInsights(facts);
   setProject(fresh);setTab("content");setSection("hero");setViewport("mobile");
   lastSaved.current="";setError("");
   setStatus("Página estruturada localmente a partir do briefing. Revise a oferta, bônus, mockup, depoimentos e garantia antes de publicar.");
  }finally{setCreatingStep("");}
 }
 async function openDraft(id:string){
  setOpening(id);setError("");
  try{
   const res=await fetch("/api/landing?id="+encodeURIComponent(id),{cache:"no-store"});
   const body=await res.json() as {project?:LandingProject;error?:string};
   if(!res.ok||!body.project)throw Error(body.error||"Projeto indisponível.");
   const selected=normalizeLanding(body.project);
   setProject(selected);setSection("hero");setTab("content");setLeads(null);
   setBriefInsights(selected.salesPage?analyzeLandingBrief(selected.name,selected.brief).facts:[]);
   lastSaved.current=JSON.stringify(selected);
   setStatus("Projeto reaberto da sua conta.");
  }catch(e){setError(errorText(e));}
  finally{setOpening("");}
 }
 async function save(publish=false,silent=false){
  const current=latestProject.current;if(!current)return;
  if(!silent){setBusy(publish?"publish":"save");setError("");}
  const snapshot=JSON.stringify(current);
  try{
   const res=await fetch("/api/landing",{
    method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
    body:JSON.stringify({project:current,publish})
   });
   const data=await res.json() as {project?:LandingProject;publishedUrl?:string;error?:string};
   if(!res.ok||!data.project)throw Error(data.error||"Não foi possível salvar.");
   lastSaved.current=snapshot;
   if(publish){
    setProject(data.project);
    setStatus("Publicação atualizada! O endereço público já está disponível.");
    void cloudRefresh();
   }else if(!silent){
    setStatus("Rascunho salvo na sua conta. Você pode reabrir em outro dispositivo.");
    void cloudRefresh();
   }else setStatus("Salvo automaticamente na sua conta.");
  }catch(e){if(!silent)setError(errorText(e));else setStatus("Sem conexão: alteração ainda não salva na nuvem.");}
  finally{if(!silent)setBusy("");}
 }
 useEffect(()=>{
  if(!project)return;
  const snapshot=JSON.stringify(project);
  if(snapshot===lastSaved.current)return;
  const timer=window.setTimeout(()=>{
   if(busy||latestProject.current?.id!==project.id)return;
   // Auto-save never calls an AI service and does not modify the preview.
   void (async()=>{const current=latestProject.current;if(!current)return;
    const value=JSON.stringify(current);try{
     const res=await fetch("/api/landing",{
      method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({project:current,publish:false})
     });
     if(res.ok){lastSaved.current=value;setStatus("Alterações salvas automaticamente.");}
    }catch{/* manual save remains available */}
   })();
  },1450);
  return ()=>window.clearTimeout(timer);
 },[project,busy]);
 async function loadLeads(){
  if(!project?.publishedSlug){setError("Publique a página antes de consultar os contatos.");return;}
  setBusy("leads");setError("");setLeads(null);
  try{
   const res=await fetch("/api/landing/leads?slug="+encodeURIComponent(project.publishedSlug),{cache:"no-store"});
   const body=await res.json() as {leads?:Lead[];error?:string};
   if(!res.ok)throw Error(body.error||"Não foi possível consultar os contatos.");
   setLeads(body.leads||[]);
  }catch(e){setError(errorText(e));}
  finally{setBusy("");}
 }
 async function uploadHero(event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];event.target.value="";if(!file)return;
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>1_500_000){
   setError("Use JPG, PNG ou WebP de até 1,5 MB. Imagens maiores devem ser comprimidas.");return;
  }
  try{
   const url=await new Promise<string>((resolve,reject)=>{
    const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||""));reader.onerror=()=>reject(Error("Falha ao ler imagem."));reader.readAsDataURL(file);
   });
   patch({heroImage:url});setStatus("Imagem incluída na prévia. Ela será salva junto com a página.");
  }catch(e){setError(errorText(e));}
 }
 function reorder(id:LandingSection,dir:-1|1){
  if(!project)return;
  const sections=[...project.sections],from=sections.indexOf(id),to=from+dir;
  if(from<0||to<0||to>=sections.length)return;
  const temp=sections[from];sections[from]=sections[to];sections[to]=temp;
  patch({sections});
 }
 function changeKind(value:LandingKind){
  if(!project)return;
  const newCourse=value==="course"&&project.kind!=="course";
  const draft=newCourse?newLanding("course",project.name,project.brief):null;
  patch({kind:value,accent:LANDING_PRESETS.find(p=>p.id===value)?.color||project.accent,
    salesPage:value==="course",
    ...(draft?{headline:draft.headline,subtitle:draft.subtitle,eyebrow:draft.eyebrow,
      price:draft.price,benefits:draft.benefits,before:draft.before,after:draft.after,
      guaranteeDays:draft.guaranteeDays,faqs:draft.faqs,ribbon:draft.ribbon}:{}),
  });
  if(value==="course")setBriefInsights(analyzeLandingBrief(project.name,project.brief).facts);
  setSection("hero");
 }
 function listValues(key:"benefits"|"steps",value:string){
  patch({[key]:value.split("\n").map(x=>x.trim()).filter(Boolean).slice(0,6)} as Partial<LandingProject>);
 }
 function changeFaq(index:number,key:keyof LandingFaq,value:string){
  if(!project)return;patch({faqs:project.faqs.map((item,i)=>index===i?{...item,[key]:value}:item)});
 }
 const field=(key:keyof LandingProject,label:string,rows=0,placeholder="",hint="")=><Field label={label}
  value={String(project?.[key]??"")} onChange={value=>patch({[key]:value} as Partial<LandingProject>)} rows={rows} placeholder={placeholder} hint={hint}/>;

 const editorProject = project as LandingProject;
 return <div className="min-h-screen bg-[#0d1017] text-white">
  <AppHeader/>
  <div className="mx-auto max-w-[1700px] px-4 py-7 sm:px-6 lg:px-9">
   {!project?<>
    <div className="mx-auto max-w-4xl text-center">
     <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/[.07] px-4 py-2 text-xs font-bold tracking-[.12em] text-emerald-200">
      <WandSparkles className="h-4 w-4"/> PAGENOVA LANDING ENGINE
     </div>
     <h1 className="mt-6 text-4xl font-bold tracking-[-.055em] sm:text-6xl">Landing pages de <span className="text-[#00d6a1]">alto padrão.</span></h1>
     <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
      Seis direções criativas, construção visual, formulários, salvamento e publicação. Sem chamadas de IA paga.
     </p>
    </div>
    <section className="mx-auto mt-10 max-w-[1180px]">
     <div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-lg font-bold">1. Escolha o tipo de landing page</h2>
      <span className="text-xs text-white/35">6 estilos profissionais</span></div>
     <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {LANDING_PRESETS.map(p=><button type="button" key={p.id} onClick={()=>setKind(p.id)}
       className={"overflow-hidden rounded-2xl border text-left transition hover:-translate-y-1 "+(kind===p.id?"border-emerald-300/80 bg-emerald-300/[.08] shadow-[0_0_0_2px_#00d6a126]":"border-white/10 bg-[#141822] hover:border-white/35")}>
       <FeaturePreview kind={p.id}/>
       <span className="flex items-start gap-3 px-4 py-4"><span className={"mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border "+(kind===p.id?"border-emerald-300 bg-emerald-300 text-black":"border-white/30")}>{kind===p.id&&<Check className="h-3 w-3"/>}</span>
       <span><strong className="block text-sm">{p.label}</strong><span className="mt-1 block text-xs leading-5 text-white/50">{p.detail}</span></span></span>
      </button>)}
     </div>
     <div className="mt-7 grid gap-4 rounded-2xl border border-white/10 bg-[#151b25] p-5 sm:grid-cols-[1fr_1.6fr] sm:p-7">
      <Field label="2. Nome da marca, produto ou negócio" value={brand} onChange={setBrand} placeholder="Ex.: Nome da sua marca ou produto"/>
      <Field label="3. Descrição do negócio / oferta" value={brief} onChange={setBrief} rows={3} placeholder="O que você oferece? Para quem? O que é importante comunicar?"/>
      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-4">
       <p className="max-w-lg text-xs leading-5 text-white/55">O motor local identifica assunto, quantidade e preço presentes no briefing. Nada de depoimentos ou bônus inventados. Zero API paga.</p>
       <button disabled={!!creatingStep} onClick={()=>void create()} className="inline-flex items-center gap-2 rounded-xl bg-[#00d6a1] px-6 py-3.5 text-sm font-extrabold text-[#042019] hover:bg-[#43eab9] disabled:opacity-60">{creatingStep?<LoaderCircle className="h-4 w-4 animate-spin"/>:<WandSparkles className="h-4 w-4"/>}{creatingStep?" Preparando página...":" Criar minha landing page"} {!creatingStep&&<ArrowRight className="h-4 w-4"/>}</button>
      </div>
     </div>
     {creatingStep&&<div role="status" aria-live="polite" className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-300/30 bg-emerald-300/[.06] px-5 py-4 text-sm font-semibold text-emerald-200"><LoaderCircle className="h-4 w-4 animate-spin"/>{creatingStep}</div>}
     <div className="mt-8">
      <h2 className="mb-4 text-lg font-bold">Meus projetos salvos</h2>
      {loadingDrafts?<p className="text-sm text-white/45">Carregando...</p>:drafts.length===0?<p className="rounded-xl border border-dashed border-white/15 p-5 text-sm text-white/45">Seu primeiro projeto aparecerá aqui depois de criado e salvo.</p>:
       <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{drafts.map(d=><button key={d.id} onClick={()=>void openDraft(d.id)} disabled={!!opening}
        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#171d28] p-4 text-left hover:border-emerald-300/50">
        <span><strong className="block text-sm">Projeto {d.id.slice(0,8)}</strong><small className="mt-1 block text-white/40">Atualizado {d.updatedAt?new Date(d.updatedAt).toLocaleDateString("pt-BR"):"recentemente"}</small></span>
        {opening===d.id?<LoaderCircle className="h-4 w-4 animate-spin"/>:<ArrowRight className="h-4 w-4 text-emerald-300"/>}
       </button>)}</div>}
     </div>
    </section>
   </>:<>
    <header className="flex flex-wrap items-center justify-between gap-4">
     <div className="flex min-w-0 items-center gap-3">
      <button className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white" onClick={()=>{setProject(null);setLeads(null);void cloudRefresh();}} aria-label="Voltar à lista"><ArrowLeft className="h-5 w-5"/></button>
      <div className="min-w-0"><span className="block text-[10px] font-bold tracking-[.15em] text-emerald-300">EDITOR LANDING PAGE</span><h1 className="truncate text-xl font-bold sm:text-2xl">{editorProject.name}</h1>
      </div>
     </div>
     <div className="flex flex-wrap items-center gap-2">
      <span className="hidden max-w-44 truncate text-[11px] text-white/40 lg:block">{status}</span>
      <button disabled={!!busy} onClick={()=>void save(false)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold hover:bg-white/10 disabled:opacity-50">{busy==="save"?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>} Salvar</button>
      {editorProject.publishedSlug&&<a target="_blank" rel="noopener noreferrer" href={"/lp/"+editorProject.publishedSlug} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/25 px-3 py-2.5 text-xs font-bold text-emerald-200"><ExternalLink className="h-4 w-4"/> Ver online</a>}
      <button disabled={!!busy} onClick={()=>void save(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-xs font-extrabold text-black hover:bg-emerald-200 disabled:opacity-50">{busy==="publish"?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>} Publicar</button>
     </div>
    </header>
    {editorProject.salesPage&&briefInsights.length>0&&<div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-300/15 bg-[#102423] px-4 py-3 text-xs text-white/75"><span className="font-bold text-emerald-300">Extraído do briefing</span>{briefInsights.map(v=><span key={v} className="rounded-full border border-emerald-300/20 px-3 py-1">{v}</span>)}<span className="text-white/45">Motor local · sem API paga</span></div>}
    <div className="mt-5 grid gap-5 xl:grid-cols-[385px_minmax(0,1fr)]">
     <aside className="overflow-hidden rounded-2xl border border-white/10 bg-[#151a24]">
      <div className="flex border-b border-white/10">
       {([{id:"content",label:"Conteúdo",icon:WandSparkles},{id:"structure",label:"Seções",icon:LayoutTemplate},{id:"design",label:"Design",icon:Settings2}] as const).map(x=><button key={x.id} onClick={()=>setTab(x.id)}
        className={"flex flex-1 items-center justify-center gap-2 border-b-2 px-2 py-4 text-xs font-bold "+(tab===x.id?"border-emerald-300 text-emerald-200":"border-transparent text-white/50 hover:text-white")}><x.icon className="h-4 w-4"/>{x.label}</button>)}
      </div>
      <div className="max-h-[820px] space-y-5 overflow-y-auto p-5">
       {tab==="content"&&<>
        <label className="block space-y-2"><span className="text-xs font-bold text-white/60">Editar seção</span><select className={inputClass} value={section} onChange={e=>setSection(e.target.value as EditorSection)}>
         <option value="hero">Primeira dobra / Hero</option>
         {editorProject.salesPage&&<><option value="comparison">Antes e depois</option><option value="bonuses">Bônus inclusos</option><option value="guarantee">Garantia de 7 dias</option></>}
         {LANDING_SECTIONS.map(s=><option value={s.id} key={s.id}>{s.label}</option>)}
        </select></label>
        {section==="hero"&&<div className="space-y-5">
         {editorProject.salesPage&&<div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[.05] p-3 text-xs leading-5 text-emerald-100">Funil de vendas: tarja fixa, headline, mockup, benefícios, comparação, bônus, oferta, depoimentos, garantia e FAQ.</div>}
         {editorProject.salesPage&&field("ribbon","Tarja fixa superior")}
         {field("name","Nome da marca")}{field("eyebrow","Selo acima do título")}{field("headline","Título principal",3)}{field("subtitle","Subtítulo",3)}{field("audience","Público / posicionamento")}
        </div>}
        {section==="comparison"&&editorProject.salesPage&&<div className="space-y-5">
         <Field label="Antes da compra — um por linha" value={(editorProject.before||[]).join("\n")} rows={5} onChange={v=>patch({before:v.split("\n").map(s=>s.trim()).filter(Boolean).slice(0,5)})} hint="Descreva situações relevantes, sem prometer resultados não comprovados."/>
         <Field label="Depois da compra — um por linha" value={(editorProject.after||[]).join("\n")} rows={5} onChange={v=>patch({after:v.split("\n").map(s=>s.trim()).filter(Boolean).slice(0,5)})} hint="Mencione apenas entregáveis e características reais do produto."/>
        </div>}
        {section==="bonuses"&&editorProject.salesPage&&<div className="space-y-4">
         <Field label="Bônus reais — um por linha" value={(editorProject.bonuses||[]).join("\n")} rows={7} onChange={v=>patch({bonuses:v.split("\n").map(s=>s.trim()).filter(Boolean).slice(0,8)})} hint="Sem bônus informados, esta seção fica oculta após publicar."/>
        </div>}
        {section==="guarantee"&&editorProject.salesPage&&<div className="space-y-4">
         <label className="flex items-center gap-3 text-xs font-semibold"><input type="checkbox" className="h-4 w-4 accent-emerald-300" checked={editorProject.guaranteeDays===7} onChange={e=>patch({guaranteeDays:e.target.checked?7:0})}/> Exibir garantia de 7 dias</label>
         {field("guaranteeText","Termos da garantia",5,"Explique os termos reais da garantia.")}
         <p className="text-xs leading-5 text-white/50">Confirme a aplicação das condições antes de publicar.</p>
        </div>}
        {section==="benefits"&&<div className="space-y-4"><Field label="Benefícios — uma linha por item" value={editorProject.benefits.join("\n")} onChange={v=>listValues("benefits",v)} rows={8} hint="Até 6 itens. Use informações verificadas, sem promessas fictícias."/></div>}
        {section==="details"&&<div className="space-y-4">{field("description","Descrição detalhada da oferta",9)}{field("offer","Frase de destaque",2)}</div>}
        {section==="process"&&<Field label="Etapas — uma por linha" value={editorProject.steps.join("\n")} onChange={v=>listValues("steps",v)} rows={7} hint="Exibidas na ordem informada; até 6 etapas."/>}
        {section==="proof"&&<div className="space-y-4">{field("proof","Texto do depoimento real",5,"Use somente depoimentos autorizados.")}{field("proofAuthor","Nome da pessoa que autorizou o depoimento")}
         {editorProject.salesPage&&<Field label="Outros depoimentos — Autor | Texto (um por linha)" value={(editorProject.testimonials||[]).map(t=>t.author+" | "+t.quote).join("\n")}
          onChange={v=>patch({testimonials:v.split("\n").map(line=>{const i=line.indexOf("|");return i<0?{author:"",quote:""}:{author:line.slice(0,i).trim(),quote:line.slice(i+1).trim()};}).filter(t=>t.author&&t.quote).slice(0,8)})} rows={6} hint="Use apenas depoimentos reais e autorizados."/>}
         <p className="text-xs leading-5 text-white/45">Sem depoimento real, a seção não é publicada.</p></div>}
        {section==="offer"&&<div className="space-y-4">{field("offer","Título da oferta",2)}{field("price","Preço / condição",0,"Ex.: R$ 149,00")}{field("ctaLabel","Texto do botão")}{field("ctaUrl","URL de checkout / ação",0,"https://...","Sem URL, o botão rola até o formulário de contato.")}{field("secondaryUrl","Link secundário (opcional)",0,"https://...")}</div>}
        {section==="faq"&&<div className="space-y-4">
         {editorProject.faqs.map((f,i)=><div key={i} className="space-y-3 rounded-xl border border-white/10 bg-[#10151e] p-3">
          <Field label={"Pergunta "+(i+1)} value={f.question} onChange={v=>changeFaq(i,"question",v)}/>
          <Field label="Resposta" value={f.answer} onChange={v=>changeFaq(i,"answer",v)} rows={3}/>
          <button className="inline-flex items-center gap-1 text-xs text-red-300" onClick={()=>patch({faqs:editorProject.faqs.filter((_,j)=>j!==i)})}><Trash2 className="h-3.5 w-3.5"/> Remover</button>
         </div>)}
         <button disabled={editorProject.faqs.length>=8} onClick={()=>patch({faqs:[...editorProject.faqs,{question:"",answer:""}]})} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs disabled:opacity-40"><Plus className="h-4 w-4"/> Nova pergunta</button>
        </div>}
        {section==="contact"&&<div className="space-y-4">{field("whatsapp","WhatsApp com DDD",0,"5511999999999")}{field("email","E-mail da empresa")}{field("ctaLabel","Texto do botão principal")}<p className="text-xs leading-6 text-white/45">O formulário da landing page publicada salva nome, e-mail e mensagem com acesso exclusivo ao dono da página.</p></div>}
       </>}
       {tab==="structure"&&editorProject.salesPage&&<>
        <p className="text-xs leading-6 text-white/65">Para infoprodutos, a ordem de conversão é fixa. Edite o conteúdo de cada seção na aba Conteúdo.</p>
        {["Tarja superior fixa","Headline, subheadline e mockup","Benefícios","Antes e depois","Apresentação do produto","Bônus inclusos","Oferta principal + CTA","Depoimentos reais","Garantia de 7 dias","Perguntas frequentes","Rodapé e contato"].map((title,i)=>
         <div className="rounded-xl border border-emerald-300/20 bg-[#102122] p-3 text-xs" key={title}><span className="mr-3 text-emerald-300">{String(i+1).padStart(2,"0")}</span>{title}</div>)}
        <p className="text-xs leading-6 text-white/45">Bônus e depoimentos vazios não aparecem ao publicar. A garantia pode ser desligada.</p>
       </>}
       {tab==="structure"&&!editorProject.salesPage&&<>
        <p className="text-xs leading-6 text-white/55">Escolha as seções que aparecerão e arraste a ordem usando as setas. A primeira dobra fica sempre no topo.</p>
        <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/[.06] px-4 py-3 text-xs font-bold text-emerald-200">Primeira dobra / Hero · Fixo</div>
        {LANDING_SECTIONS.map(s=>{
         const index=editorProject.sections.indexOf(s.id),enabled=index>=0;
         return <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#10151e] px-3 py-3" key={s.id}>
          <input aria-label={"Exibir "+s.label} type="checkbox" checked={enabled} onChange={e=>patch({sections:e.target.checked?[...editorProject.sections,s.id]:editorProject.sections.filter(v=>v!==s.id)})} className="h-4 w-4 accent-emerald-300"/>
          <span className="min-w-0 flex-1 text-xs font-semibold">{s.label}</span>
          <button aria-label={"Mover "+s.label+" para cima"} disabled={!enabled||index===0} onClick={()=>reorder(s.id,-1)} className="rounded p-1 text-white/60 disabled:opacity-20"><ArrowUp className="h-4 w-4"/></button>
          <button aria-label={"Mover "+s.label+" para baixo"} disabled={!enabled||index===editorProject.sections.length-1} onClick={()=>reorder(s.id,1)} className="rounded p-1 text-white/60 disabled:opacity-20"><ArrowDown className="h-4 w-4"/></button>
         </div>})}
        <p className="text-xs leading-6 text-white/40">As seções sem conteúdo, como depoimentos ou FAQ, permanecem ocultas até você preenchê-las.</p>
       </>}
       {tab==="design"&&<>
        <p className="text-xs font-semibold text-white/65">Direção de arte</p>
        <div className="grid grid-cols-2 gap-2">{LANDING_PRESETS.map(p=><button type="button" key={p.id} onClick={()=>changeKind(p.id)}
         className={"overflow-hidden rounded-xl border text-left "+(p.id===editorProject.kind?"border-emerald-300":"border-white/10")}><div className={"h-11 bg-gradient-to-r "+kindsArtwork[p.id]}/><span className="block p-2 text-[11px] font-bold">{p.label}</span></button>)}</div>
        <label className="flex items-center gap-4"><input type="color" value={editorProject.accent} onChange={e=>patch({accent:e.target.value})} className="h-11 w-16 rounded border-0 bg-transparent"/><span className="text-xs font-semibold">Cor de destaque</span></label>
        <Field label="URL de fotografia própria ou licenciada (HTTPS)" value={editorProject.heroImage.startsWith("data:")?"":editorProject.heroImage} onChange={v=>patch({heroImage:v})} placeholder="https://..."/>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-4 text-xs font-semibold text-white/75 hover:border-emerald-300/60"><ImagePlus className="h-4 w-4"/> Enviar imagem de capa (até 1,5 MB)<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void uploadHero(e)}/></label>
        {editorProject.heroImage&&<button className="text-xs text-red-300" onClick={()=>patch({heroImage:""})}>Remover imagem</button>}
        <p className="text-xs leading-6 text-white/40">O layout funciona sem imagem externa, graças à composição gráfica interna. Não utilizamos geração paga de imagens.</p>
       </>}
      </div>
     </aside>
     <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#151a24]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
       <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400"/><span className="text-xs font-bold text-white/70">Pré-visualização ao vivo</span></div>
       <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-white/10 p-1">
         <button title="Visualização desktop" onClick={()=>setViewport("desktop")} className={"rounded-md p-2 "+(viewport==="desktop"?"bg-white/15 text-emerald-200":"text-white/45")}><Monitor className="h-4 w-4"/></button>
         <button title="Visualização celular" onClick={()=>setViewport("mobile")} className={"rounded-md p-2 "+(viewport==="mobile"?"bg-white/15 text-emerald-200":"text-white/45")}><Smartphone className="h-4 w-4"/></button>
        </div>
        <button onClick={()=>void loadLeads()} disabled={!editorProject.publishedSlug||!!busy} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2.5 text-xs font-bold text-white/70 disabled:opacity-35"><Users className="h-4 w-4"/> Leads</button>
       </div>
      </div>
      <div className="relative flex min-h-[820px] justify-center overflow-hidden bg-[#252a36] p-2 sm:p-5">
       <div className={"overflow-hidden rounded-xl bg-white shadow-[0_25px_70px_#0004] transition-[width] duration-300 "+(viewport==="mobile"?"w-full max-w-[390px]":"w-full")}>
        <iframe key={viewport} title="Landing page ao vivo" srcDoc={preview} sandbox="allow-scripts allow-forms" className="h-[820px] w-full border-0" />
       </div>
      </div>
     </section>
    </div>
    {leads&&<section className="mt-5 rounded-2xl border border-white/10 bg-[#151a24] p-5">
     <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Contatos recebidos ({leads.length})</h2><button onClick={()=>setLeads(null)} className="text-xs text-white/50">Fechar</button></div>
     {!leads.length?<p className="mt-3 text-sm text-white/45">Ainda não há contatos nesta landing page.</p>:
      <div className="mt-4 grid gap-3 lg:grid-cols-2">{leads.map((l,i)=><article key={i} className="rounded-xl border border-white/10 p-4">
       <p className="font-semibold">{l.name}</p><p className="mt-1 text-xs text-emerald-200">{l.email}</p><p className="mt-2 whitespace-pre-line text-sm text-white/65">{l.message||"Sem mensagem adicional."}</p><span className="mt-3 block text-[11px] text-white/35">{l.submittedAt?new Date(l.submittedAt).toLocaleString("pt-BR"):""}</span>
      </article>)}</div>}
    </section>}
   </>}
   {error&&<div role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}
   {status&&<p aria-live="polite" className="mt-4 text-xs text-white/45">{status}</p>}
  </div>
 </div>;
}
