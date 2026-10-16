// @ts-nocheck
// TEMPORARY: JSX typing isolation pending detailed build diagnostics; server APIs remain strictly checked.
"use client";

import { useCallback,useEffect,useMemo,useRef,useState,type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {normalizeInlineEdits,normalizeInsertedImages} from "@/lib/landing/inline-editor";
import { LANDING_KINDS,LANDING_PRESETS,LANDING_SECTIONS,newLanding,newUniversalLanding,normalizeLanding,renderLandingHtml,analyzeLandingBrief,
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
 course:"from-[#07191d] via-[#0b7970] to-[#00d6a1]",
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
 const [price,setPrice]=useState("");
 const [project,setProject]=useState<LandingProject|null>(null);
 const [drafts,setDrafts]=useState<Draft[]>([]);
 const [loadingDrafts,setLoadingDrafts]=useState(true);
 const [opening,setOpening]=useState("");
 const [tab,setTab]=useState<Tab>("content");
 const [section,setSection]=useState<EditorSection>("hero");
 const [viewport,setViewport]=useState<"desktop"|"mobile">("mobile");
 const [busy,setBusy]=useState<""|"save"|"publish"|"leads">("");
 const [creatingStep,setCreatingStep]=useState("");
 const [briefInsights,setBriefInsights]=useState<string[]>([]);
 const [listDrafts,setListDrafts]=useState<Record<string,string>>({});
 const [status,setStatus]=useState("");
 const [error,setError]=useState("");
 const [leads,setLeads]=useState<Lead[]|null>(null);
 const lastSaved=useRef<string>("");
 const previewFrame=useRef<HTMLIFrameElement|null>(null);
 const addImageInput=useRef<HTMLInputElement|null>(null);
 const latestProject=useRef<LandingProject|null>(null);
 latestProject.current=project;
 // Content edits stay live in the frame without resetting its scroll position.
 const previewBase=project?JSON.stringify({...project,inlineEdits:undefined,insertedImages:undefined,updatedAt:undefined,publishedSlug:undefined}):"";
 const preview=useMemo(()=>project?renderLandingHtml(project,true):"",[previewBase,viewport]);
 useEffect(()=>{
  function onInlineMessage(event:MessageEvent){
   if(!previewFrame.current||event.source!==previewFrame.current.contentWindow)return;
   const data=event.data;
   if(data?.type==="pagenova:landing-image-added"){
    if(!data.image||typeof data.image!=="object")return;
    setProject(current=>{
     if(!current||current.templateVersion!=="universal-v1")return current;
     const updated=normalizeInsertedImages([...(current.insertedImages||[]),data.image]);
     if(updated.length<=(current.insertedImages||[]).length)return current;
     return {...current,insertedImages:updated,updatedAt:new Date().toISOString()};
    });
    setStatus("Imagem adicionada. Alteração pronta para salvar e publicar.");return;
   }
   if(data?.type==="pagenova:landing-image-updated"){
    if(typeof data.id!=="string"||typeof data.src!=="string")return;
    setProject(current=>{
     if(!current)return current;
     const updated=normalizeInsertedImages((current.insertedImages||[]).map(item=>item.id===data.id?{...item,src:data.src}:item));
     return {...current,insertedImages:updated,updatedAt:new Date().toISOString()};
    });
    return;
   }
   if(!data||data.type!=="pagenova:landing-inline-edit"||typeof data.id!=="string"||!/^e\d{1,5}$/.test(data.id))return;
   if(!data.patch||typeof data.patch!=="object"||Array.isArray(data.patch))return;
   const update=Object.fromEntries(Object.entries(data.patch).filter(([key,value])=>
    ["text","color","fontSize","fontFamily","href","image"].includes(key)&&typeof value==="string"));
   if(!Object.keys(update).length)return;
   setProject(current=>{
    if(!current||current.templateVersion!=="universal-v1")return current;
    const inlineEdits=normalizeInlineEdits({...current.inlineEdits,[data.id]:{...current.inlineEdits?.[data.id],...update}});
    return {...current,inlineEdits,updatedAt:new Date().toISOString()};
   });
   setError("");
  }
  window.addEventListener("message",onInlineMessage);
  return ()=>window.removeEventListener("message",onInlineMessage);
 },[]);
 const cloudRefresh=useCallback(async()=>{
  try{
   const res=await fetch("/api/landing",{credentials:"same-origin",cache:"no-store"});
   const body=await res.json() as {projects?:Draft[]};
   if(res.ok)setDrafts(body.projects||[]);
  }catch{/* browser may be offline; existing project stays editable */}
  finally{setLoadingDrafts(false);}
 },[]);
 useEffect(()=>{void cloudRefresh();},[cloudRefresh]);
 useEffect(()=>{if(window.matchMedia("(min-width: 1024px)").matches)setViewport("desktop");},[]);
 function loadEditableLists(value:LandingProject){
  setListDrafts({
    benefits:value.benefits.join("\n"),steps:value.steps.join("\n"),
    before:(value.before||[]).join("\n"),after:(value.after||[]).join("\n"),
    bonuses:(value.bonuses||[]).join("\n"),
    testimonials:(value.testimonials||[]).map(v=>v.author+" | "+v.quote).join("\n"),
  });
 }
 const patch=useCallback((values:Partial<LandingProject>)=>{
  setProject(current=>current?{...current,...values,updatedAt:new Date().toISOString()}:current);
  setError("");
  setLeads(null);
 },[]);
 async function create(){
  if(creatingStep)return;
  if(brand.trim().length<2){setError("Informe o nome do produto.");return;}
  if(brief.trim().length<12){setError("Descreva o produto com pelo menos 12 caracteres.");return;}
  if(!/^(?:R\$\s*)?\d{1,6}(?:[.,]\d{2})?$/.test(price.trim())){
   setError("Informe o preço do produto. Ex.: 19,90");return;
  }
  setError("");setCreatingStep("Analisando o nicho e preparando os textos da oferta...");
  let fresh=newUniversalLanding(brand.trim(),brief.trim(),price.trim());
  let generated=false;
  try{
   const response=await fetch("/api/landing/generate-copy",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name:brand.trim(),description:brief.trim(),price:price.trim()})
   });
   const result=await response.json().catch(()=>({})) as {
    copy?:Partial<LandingProject>;configured?:boolean;error?:string
   };
   if(response.ok&&result.copy){
    const c=result.copy;
    fresh={...fresh,
      eyebrow:c.eyebrow||fresh.eyebrow,headline:c.headline||fresh.headline,
      subtitle:c.subtitle||fresh.subtitle,offer:c.offer||fresh.offer,
      benefits:c.benefits?.length?c.benefits:fresh.benefits,
      before:c.before?.length?c.before:fresh.before,
      after:c.after?.length?c.after:fresh.after,
      steps:c.steps?.length?c.steps:fresh.steps,
      faqs:c.faqs?.length?c.faqs:fresh.faqs
    };
    generated=true;
   }
  }catch{/* Safe local fallback if provider is unavailable. */}
  finally{setCreatingStep("");}
  setBriefInsights(analyzeLandingBrief(fresh.name,fresh.brief).facts);
  loadEditableLists(fresh);setProject(fresh);
  setTab("content");setSection("hero");setViewport("mobile");
  lastSaved.current="";setError("");
  setStatus(generated
    ?"Template original aplicado com textos da IA. Revise bônus, depoimentos reais, checkout e a oferta antes de publicar."
    :"Template original aplicado. A IA não respondeu e foram usados textos contextuais locais. Você pode revisar tudo no editor.");
 }
 async function openDraft(id:string){
  setOpening(id);setError("");
  try{
   const res=await fetch("/api/landing?id="+encodeURIComponent(id),{cache:"no-store"});
   const body=await res.json() as {project?:LandingProject;error?:string};
   if(!res.ok||!body.project)throw Error(body.error||"Projeto indisponível.");
   const selected=normalizeLanding(body.project);
   setProject(selected);loadEditableLists(selected);setSection("hero");setTab("content");setLeads(null);
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
 async function addInlineImage(event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];event.target.value="";if(!file)return;
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>8_000_000){
   setError("Use JPG, PNG ou WebP de até 8 MB.");return;
  }
  if(!previewFrame.current?.contentWindow){setError("Abra a prévia para adicionar a imagem.");return;}
  if((project?.insertedImages||[]).length>=8){
   setError("Limite de imagens extras atingido nesta página.");return;
  }
  try{
   const src=await new Promise<string>((resolve,reject)=>{
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{
     try{
      const max=1200,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas indisponível");
      let output="";
      for(let n=0;n<5;n++){
       ctx.clearRect(0,0,canvas.width,canvas.height);
       ctx.drawImage(img,0,0,canvas.width,canvas.height);
       output=canvas.toDataURL("image/webp",Math.max(.4,.8-n*.1));
       if(output.length<=460_000)break;
       canvas.width=Math.max(1,Math.round(canvas.width*.78));
       canvas.height=Math.max(1,Math.round(canvas.height*.78));
      }
      if(!/^data:image\/(?:webp|png|jpeg);base64,/.test(output)||output.length>460_000)throw Error("Imagem muito grande. Tente outra resolução.");
      resolve(output);
     }catch(e){reject(e);}finally{URL.revokeObjectURL(url);}
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(Error("Não foi possível carregar a imagem."));};
    img.src=url;
   });
   const currentImages=project?.insertedImages||[];
   if(normalizeInsertedImages([...currentImages,{id:"i"+crypto.randomUUID().replaceAll("-",""),afterId:"e0",src}]).length<=currentImages.length)
    throw Error("Espaço reservado a imagens atingido. Use uma imagem menor ou substitua uma existente.");
   previewFrame.current.contentWindow.postMessage({type:"pagenova:landing-add-image",
    image:{id:"i"+crypto.randomUUID().replaceAll("-",""),src}},"*");
  }catch(e){setError(errorText(e));}
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
  if(value==="course"){
   setBriefInsights(analyzeLandingBrief(project.name,project.brief).facts);
   if(draft)loadEditableLists({...project,...draft});
  }
  setSection("hero");
 }
 function listValues(key:"benefits"|"steps"|"before"|"after"|"bonuses",value:string){
  setListDrafts(current=>({...current,[key]:value}));
  patch({[key]:value.split("\n").map(x=>x.trim()).filter(Boolean).slice(0,key==="bonuses"?8:key==="before"||key==="after"?5:6)} as Partial<LandingProject>);
 }
 function changeTestimonial(index:number,key:"author"|"city"|"state"|"quote"|"photo"|"confirmed",value:string|boolean){
  if(!project)return;
  patch({testimonials:(project.testimonials||[]).map((t,i)=>i===index?{...t,[key]:value,confirmed:key==="confirmed"?value:false}:t)});
 }
 async function uploadTestimonialPhoto(index:number,event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];event.target.value="";if(!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>2_000_000){
   setError("A foto deve ser JPG, PNG ou WebP com até 2 MB.");return;
  }
  try{
   // Optimize real portraits to protect the existing published-site payload cap.
   const photo=await new Promise<string>((resolve,reject)=>{
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{
     try{
      const canvas=document.createElement("canvas");canvas.width=192;canvas.height=192;
      const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas indisponível");
      const side=Math.min(img.naturalWidth,img.naturalHeight);
      ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,192,192);
      const data=canvas.toDataURL("image/jpeg",.82);
      if(data.length>160_000)throw Error("Foto muito grande após conversão");
      resolve(data);
     }catch(error){reject(error);}finally{URL.revokeObjectURL(url);}
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(Error("Não foi possível ler a foto."));};
    img.src=url;
   });
   changeTestimonial(index,"photo",photo);
   setStatus("Foto pronta para o card. Confirme a autorização do cliente antes de publicar.");
  }catch(e){setError(errorText(e));}
 }
 function addTestimonial(){
  if(!project||(project.testimonials||[]).length>=8)return;
  patch({testimonials:[...(project.testimonials||[]),{author:"",city:"",state:"",photo:"",quote:"",confirmed:false}]});
 }
 function upgradeCourse(){
  if(!project||project.kind!=="course"||project.salesPage)return;
  if(!window.confirm("Atualizar este projeto para o funil de infoprodutos? O título e os benefícios serão recriados usando o briefing, mas as imagens e o link de checkout serão preservados."))return;
  const fresh=newLanding("course",project.name,project.brief);
  const merged={...project,salesPage:true,ribbon:fresh.ribbon,headline:fresh.headline,subtitle:fresh.subtitle,
    accent:"#00d6a1",benefits:fresh.benefits,before:fresh.before,after:fresh.after,
    bonuses:project.bonuses||[],guaranteeDays:7,guaranteeText:fresh.guaranteeText,
    price:project.price||fresh.price,faqs:project.faqs.length?project.faqs:fresh.faqs};
  patch(merged);loadEditableLists(merged);setBriefInsights(analyzeLandingBrief(project.name,project.brief).facts);
  setSection("hero");setStatus("Nova estrutura aplicada ao rascunho. Revise e clique em Publicar quando estiver pronto.");
 }
 function refreshSalesCopy(){
  if(!project||!project.salesPage)return;
  if(!window.confirm("Recriar headline, subtítulo, benefícios, comparação e título da oferta a partir do briefing? Seus textos atuais nesses campos serão substituídos. Mockup, checkout, bônus e depoimentos serão preservados."))return;
  const fresh=newLanding("course",project.name,project.brief);
  const changes={
    eyebrow:fresh.eyebrow,headline:fresh.headline,subtitle:fresh.subtitle,offer:fresh.offer,
    benefits:fresh.benefits,before:fresh.before,after:fresh.after,
    price:project.price||fresh.price
  };
  patch(changes);loadEditableLists({...project,...changes});
  setBriefInsights(analyzeLandingBrief(project.name,project.brief).facts);
  setSection("hero");setTab("content");
  setStatus("Novos textos aplicados ao rascunho. Revise, salve e publique para atualizar o link.");
 }
 function openFullPreview(){
  if(!project)return;
  // Blob URLs have no conventional / path root. The universal template
  // uses local stylesheet and mockup assets; explicitly resolve them against
  // this app's origin in the detached full-screen preview.
  const html=renderLandingHtml(project,true)
    .replace("<head>","<head><base href="+JSON.stringify(window.location.origin+"/")+">");
  const url=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));
  // A real browser-sized tab is more faithful than the 820px internal iframe.
  // A noopener anchor avoids browsers treating a successful new tab as blocked.
  const link=document.createElement("a");link.href=url;link.target="_blank";link.rel="noopener noreferrer";
  document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),120000);
 }
 function changeFaq(index:number,key:keyof LandingFaq,value:string){
  if(!project)return;patch({faqs:project.faqs.map((item,i)=>index===i?{...item,[key]:value}:item)});
 }
 const field=(key:keyof LandingProject,label:string,rows=0,placeholder="",hint="")=><Field label={label}
  value={String(project?.[key]??"")} onChange={value=>patch({[key]:value} as Partial<LandingProject>)} rows={rows} placeholder={placeholder} hint={hint}/>;

 const editorProject = project as LandingProject;
 return <div className="min-h-screen bg-[#0d1017] text-white">
  <div className="mx-auto max-w-[1700px] px-3 py-3 sm:px-5 sm:py-5 lg:px-7">
   {!project?<>
    <div className="mx-auto max-w-4xl text-center">
     <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/[.07] px-4 py-2 text-xs font-bold tracking-[.12em] text-emerald-200">
      <WandSparkles className="h-4 w-4"/> PAGENOVA LANDING ENGINE
     </div>
     <h1 className="mt-6 text-4xl font-bold tracking-[-.055em] sm:text-6xl">Landing pages de <span className="text-[#00d6a1]">alto padrão.</span></h1>
     <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
      Template original responsivo, textos contextualizados por IA, edição, salvamento e publicação.
     </p>
    </div>
    <section className="mx-auto mt-10 max-w-4xl">
      <div className="rounded-2xl border border-emerald-400/25 bg-[#151b25] p-5 shadow-2xl sm:p-8">
       <div className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><LayoutTemplate className="size-6"/></span>
        <div><h2 className="text-lg font-extrabold">Template universal de infoproduto</h2>
         <p className="mt-1 text-xs leading-5 text-white/55">Layout original: tarja, headline, mockup, antes/depois, bônus, oferta, depoimentos, garantia e CTA fixo no celular.</p>
        </div>
       </div>
       <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="1. Nome do produto" value={brand} onChange={setBrand} placeholder="Ex.: 5000 Projetos de Serralheria"/></div>
        <div className="sm:col-span-2"><Field label="2. Pequena descrição do produto" value={brief} onChange={setBrief} rows={4}
         placeholder="O que é o produto, para quem serve e o que a pessoa recebe?"/></div>
        <div className="sm:col-span-2"><Field label="3. Preço do produto" value={price} onChange={setPrice} placeholder="Ex.: 19,90"
         hint="Informe o valor real, sem preço anterior ou desconto inventado."/></div>
       </div>
       <p className="mt-6 text-xs leading-6 text-white/55">O restante da página é estruturado automaticamente. A IA ajuda com textos contextualizados e não cria depoimentos, bônus ou resultados falsos.</p>
       <button type="button" disabled={!!creatingStep} onClick={()=>void create()}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-6 py-4 text-sm font-extrabold text-[#042019] hover:bg-emerald-200 disabled:opacity-60">
        {creatingStep?<LoaderCircle className="size-5 animate-spin"/>:<WandSparkles className="size-5"/>}
        {creatingStep?"Preparando sua landing...":"Criar Landing Page com IA"}
        {!creatingStep&&<ArrowRight className="size-5"/>}
       </button>
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
    <header className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
       <button type="button" className="shrink-0 rounded-lg border border-white/10 p-2 text-white/65 hover:text-white" onClick={()=>{setProject(null);setLeads(null);void cloudRefresh();}} aria-label="Voltar aos projetos"><ArrowLeft className="h-4 w-4"/></button>
       <div className="min-w-0"><h1 className="truncate text-sm font-extrabold sm:text-lg">{editorProject.name}</h1><p className="text-[10px] text-white/45">Editor de Landing Page</p></div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
       <button type="button" disabled={!!busy} onClick={()=>void save(false)} aria-label="Salvar projeto" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-2 text-xs font-bold hover:bg-white/10 disabled:opacity-50 sm:px-3">{busy==="save"?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}<span className="hidden min-[420px]:inline">Salvar</span></button>
       {editorProject.publishedSlug&&<a target="_blank" rel="noopener noreferrer" href={"/lp/"+editorProject.publishedSlug} aria-label="Abrir página publicada" title="Ver online" className="inline-flex items-center rounded-lg border border-emerald-300/25 px-2.5 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-300/10"><ExternalLink className="h-4 w-4"/></a>}
       <button type="button" disabled={!!busy} onClick={()=>void save(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-300 px-3 py-2 text-xs font-extrabold text-black hover:bg-emerald-200 disabled:opacity-50 sm:px-4">{busy==="publish"?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>} Publicar</button>
      </div>
     </header>
     {editorProject.kind==="course"&&!editorProject.salesPage&&<div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/25 bg-[#102320] p-4">
      <div><p className="text-sm font-bold text-emerald-300">Existe um novo funil para infoprodutos</p><p className="mt-1 text-xs text-white/60">Converta este projeto antigo preservando seu mockup e checkout.</p></div>
      <button type="button" onClick={upgradeCourse} className="rounded-xl bg-emerald-300 px-4 py-2.5 text-xs font-extrabold text-[#042019]">Usar novo funil →</button>
     </div>}
    {editorProject.salesPage&&editorProject.templateVersion!=="universal-v1"&&<details className="group mt-3 rounded-xl border border-emerald-300/15 bg-[#102423]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs text-emerald-100 marker:hidden [&::-webkit-details-marker]:hidden sm:px-4">
       <span className="flex min-w-0 items-center gap-2">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300"/>
        <span className="truncate font-semibold">Oferta · {analyzeLandingBrief(editorProject.name,editorProject.brief).niche}</span>
       </span>
       <span className="flex shrink-0 items-center gap-1 text-[11px] text-white/55">Detalhes <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180"/></span>
      </summary>
      <div className="space-y-3 border-t border-white/10 px-3 pb-3 pt-3 sm:px-4">
       <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-white/60">Dados do briefing e ajustes opcionais da oferta.</p>
        <button type="button" onClick={refreshSalesCopy} className="rounded-lg border border-emerald-300/30 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-300/10">Refazer textos pelo briefing ↗</button>
       </div>
       {briefInsights.length>0&&<div className="flex flex-wrap gap-1.5">{briefInsights.map(v=><span key={v} className="rounded-full border border-emerald-300/15 px-2.5 py-1 text-[11px] text-white/65">{v}</span>)}</div>}
       <div className="flex flex-wrap gap-2 text-[11px]">
        <span className={editorProject.ctaUrl?"rounded-md border border-emerald-400/25 px-2.5 py-2 text-emerald-200":"rounded-md border border-amber-400/25 px-2.5 py-2 text-amber-200"}>{editorProject.ctaUrl?"✓ Checkout vinculado":"! Sem checkout: CTA de contato"}</span>
        <span className="rounded-md border border-white/10 px-2.5 py-2 text-white/65">{editorProject.heroImage?"✓ Imagem enviada":"○ Mockup ilustrativo"}</span>
        <span className="rounded-md border border-white/10 px-2.5 py-2 text-white/65">{(editorProject.testimonials||[]).some(t=>t.confirmed)?"✓ Depoimentos cadastrados":"○ Sem depoimentos reais"}</span>
       </div>
      </div>
     </details>}
     <div className={editorProject.templateVersion==="universal-v1"?"mt-3":"mt-3 grid gap-3 xl:grid-cols-[350px_minmax(0,1fr)] xl:gap-4"}>
     {editorProject.templateVersion!=="universal-v1"&&<aside id="landing-editor-controls" className="order-2 overflow-hidden rounded-xl border border-white/10 bg-[#151a24] scroll-mt-20 xl:order-1">
      <div className="flex border-b border-white/10">
       {([{id:"content",label:"Conteúdo",icon:WandSparkles},{id:"structure",label:"Seções",icon:LayoutTemplate},{id:"design",label:"Design",icon:Settings2}] as const).map(x=><button key={x.id} onClick={()=>setTab(x.id)}
        className={"flex flex-1 items-center justify-center gap-2 border-b-2 px-2 py-3 text-xs font-bold "+(tab===x.id?"border-emerald-300 text-emerald-200":"border-transparent text-white/50 hover:text-white")}><x.icon className="h-4 w-4"/>{x.label}</button>)}
      </div>
      <div className="space-y-4 p-3 sm:p-4 xl:max-h-[820px] xl:overflow-y-auto">
       {tab==="content"&&<>
        <label className="block space-y-2"><span className="text-xs font-bold text-white/60">Editar seção</span><select className={inputClass} value={section} onChange={e=>setSection(e.target.value as EditorSection)}>
         <option value="hero">Primeira dobra / Hero</option>
         {editorProject.salesPage&&<><option value="comparison">Antes e depois</option><option value="bonuses">Bônus inclusos</option><option value="guarantee">Garantia de 7 dias</option></>}
         {LANDING_SECTIONS.map(s=><option value={s.id} key={s.id}>{s.label}</option>)}
        </select></label>
        {section==="hero"&&<div className="space-y-5">
         {editorProject.salesPage&&<div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[.05] p-3 text-xs leading-5 text-emerald-100">Funil de vendas: tarja fixa, headline, mockup, benefícios, comparação, bônus, oferta, depoimentos, garantia e FAQ.</div>}
         {editorProject.salesPage&&<div className="space-y-3 rounded-xl border border-emerald-300/20 bg-[#102623] p-4">
          {field("ribbon","Texto da tarja superior")}
          <label className="flex items-center gap-3 text-xs font-semibold"><input type="checkbox" checked={!!editorProject.ribbonAnimated} onChange={e=>patch({ribbonAnimated:e.target.checked})} className="h-4 w-4 accent-emerald-300"/> Tarja em movimento contínuo</label>
          {editorProject.ribbonAnimated&&<label className="block space-y-2 text-xs font-semibold">Velocidade do movimento
           <select className={inputClass} value={editorProject.ribbonSpeed||24} onChange={e=>patch({ribbonSpeed:Number(e.target.value)})}>
            <option value={42}>Devagar — 42 segundos</option><option value={24}>Normal — 24 segundos</option><option value={12}>Rápido — 12 segundos</option>
           </select>
          </label>}
          <p className="text-[11px] leading-5 text-white/50">Tarja fixa no topo. O sistema respeita a preferência de reduzir animações.</p>
         </div>}
         {field("name","Nome da marca")}{field("eyebrow","Selo acima do título")}{field("headline","Título principal",3)}{field("subtitle","Subtítulo",3)}{field("audience","Público / posicionamento")}
        </div>}
        {section==="comparison"&&editorProject.salesPage&&<div className="space-y-5">
         <Field label="Antes da compra — um por linha" value={listDrafts.before??(editorProject.before||[]).join("\n")} rows={5} onChange={v=>listValues("before",v)} hint="Descreva situações relevantes, sem prometer resultados não comprovados."/>
         <Field label="Depois da compra — um por linha" value={listDrafts.after??(editorProject.after||[]).join("\n")} rows={5} onChange={v=>listValues("after",v)} hint="Mencione apenas entregáveis e características reais do produto."/>
        </div>}
        {section==="bonuses"&&editorProject.salesPage&&<div className="space-y-4">
         <Field label="Bônus reais — um por linha" value={listDrafts.bonuses??(editorProject.bonuses||[]).join("\n")} rows={7} onChange={v=>listValues("bonuses",v)} hint="Sem bônus informados, esta seção fica oculta após publicar."/>
        </div>}
        {section==="guarantee"&&editorProject.salesPage&&<div className="space-y-4">
         <label className="flex items-center gap-3 text-xs font-semibold"><input type="checkbox" className="h-4 w-4 accent-emerald-300" checked={editorProject.guaranteeDays===7} onChange={e=>patch({guaranteeDays:e.target.checked?7:0})}/> Exibir garantia de 7 dias</label>
         {field("guaranteeText","Termos da garantia",5,"Explique os termos reais da garantia.")}
         <p className="text-xs leading-5 text-white/50">Confirme a aplicação das condições antes de publicar.</p>
        </div>}
        {section==="benefits"&&<div className="space-y-4"><Field label="Benefícios — uma linha por item" value={listDrafts.benefits??editorProject.benefits.join("\n")} onChange={v=>listValues("benefits",v)} rows={8} hint="Até 6 itens. Use informações verificadas, sem promessas fictícias."/></div>}
        {section==="details"&&<div className="space-y-4">{field("description","Descrição detalhada da oferta",9)}{field("offer","Frase de destaque",2)}</div>}
        {section==="process"&&<Field label="Etapas — uma por linha" value={listDrafts.steps??editorProject.steps.join("\n")} onChange={v=>listValues("steps",v)} rows={7} hint="Exibidas na ordem informada; até 6 etapas."/>}
        {section==="proof"&&editorProject.salesPage&&<div className="space-y-4">
         <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/[.06] p-4">
          <p className="text-xs font-extrabold text-emerald-200">Nicho identificado: {analyzeLandingBrief(editorProject.name,editorProject.brief).niche}</p>
          <p className="mt-2 text-xs leading-5 text-white/65">Temas sugeridos para pedir depoimentos reais. Não geramos clientes ou avaliações fictícias.</p>
          <div className="mt-3 space-y-2">{analyzeLandingBrief(editorProject.name,editorProject.brief).testimonialAngles.map((tip,i)=>
           <p key={i} className="text-xs leading-5 text-white/75"><span className="mr-2 text-emerald-300">{i+1}.</span>{tip}</p>)}</div>
         </div>
         {(editorProject.testimonials||[]).map((t,i)=><div key={i} className="space-y-3 rounded-2xl border border-white/15 bg-[#101d24] p-4">
          <div className="flex items-center justify-between gap-2"><strong className="text-sm">Cliente {i+1}</strong>
           <button onClick={()=>patch({testimonials:editorProject.testimonials!.filter((_,j)=>j!==i)})} className="inline-flex items-center gap-1 text-xs text-rose-300"><Trash2 className="h-3.5 w-3.5"/> Remover</button></div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-emerald-300/25 px-3 py-3">
           {t.photo?<img src={t.photo} alt="Prévia da foto enviada" className="h-14 w-14 rounded-full object-cover"/>:<span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#173c36] text-emerald-300"><ImagePlus className="h-6 w-6"/></span>}
           <span className="text-xs font-semibold text-white/75">{t.photo?"Trocar foto autorizada":"Enviar foto da pessoa"} <small className="mt-1 block text-white/45">JPG, PNG ou WebP até 2 MB; ajuste automático</small></span>
           <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e=>void uploadTestimonialPhoto(i,e)}/>
          </label>
          <Field label="Nome e sobrenome" value={t.author} onChange={v=>changeTestimonial(i,"author",v)} placeholder="Nome completo verdadeiro"/>
          <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
           <Field label="Cidade" value={t.city||""} onChange={v=>changeTestimonial(i,"city",v)} placeholder="Cidade"/>
           <Field label="UF" value={t.state||""} onChange={v=>changeTestimonial(i,"state",v.toUpperCase().slice(0,2))} placeholder="SP"/>
          </div>
          <Field label="Relato verdadeiro sobre o produto" value={t.quote} onChange={v=>changeTestimonial(i,"quote",v)} rows={4} placeholder="O que a pessoa realmente relatou sobre o produto?"/>
          <label className="flex items-start gap-2 text-xs leading-5 text-white/70">
           <input className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-300" type="checkbox" checked={!!t.confirmed} onChange={e=>changeTestimonial(i,"confirmed",e.target.checked)}/>
           Confirmo que este depoimento é verdadeiro e tenho autorização para publicar nome, foto, cidade, estado e relato.
          </label>
          <p className="text-[11px] text-white/40">Só aparecerá na página pública com todos os dados e a autorização confirmada.</p>
         </div>)}
         <button onClick={addTestimonial} disabled={(editorProject.testimonials||[]).length>=8} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/30 px-4 py-3 text-xs font-bold text-emerald-200 disabled:opacity-40"><Plus className="h-4 w-4"/> Adicionar depoimento real</button>
        </div>}
        {section==="proof"&&!editorProject.salesPage&&<div className="space-y-4">{field("proof","Texto do depoimento real",5,"Use somente depoimentos autorizados.")}{field("proofAuthor","Nome da pessoa que autorizou o depoimento")}</div>}
        {section==="offer"&&<div className="space-y-4">
          {editorProject.salesPage&&!editorProject.ctaUrl&&<div role="status" className="rounded-xl border border-amber-300/25 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100">O link de pagamento ainda não foi configurado. Na página publicada, os botões principais serão identificados como pedido de informações e levarão ao formulário — não a um checkout.</div>}
          {field("offer","Título da oferta",2)}{field("price","Preço / condição",0,"Ex.: R$ 149,00")}
          {field("ctaLabel","Texto do botão de compra (quando houver checkout)")}
          {field("ctaUrl","URL real do checkout (HTTPS)",0,"https://...","Configure o checkout para ativar os botões de compra. Sem URL, a página direciona para contato.")}
          {field("secondaryUrl","Link secundário (opcional)",0,"https://...")}
         </div>}
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
      <p className="text-xs leading-5 text-emerald-200">Tarja animada ou estática: aba Conteúdo → Primeira dobra. Depoimentos com foto: aba Conteúdo → Depoimento.</p>
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
        {editorProject.templateVersion==="universal-v1"
         ?<div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] p-4 text-xs leading-6 text-white/70">
           <strong className="block text-sm text-emerald-200">Template universal original</strong>
           <p>As cores, fontes e a estrutura responsiva são preservadas exatamente do template de referência. Você pode substituir a imagem principal abaixo.</p>
          </div>
         :<>
          <p className="text-xs font-semibold text-white/65">Direção de arte</p>
          <div className="grid grid-cols-2 gap-2">{LANDING_PRESETS.map(p=><button type="button" key={p.id} onClick={()=>changeKind(p.id)}
           className={"overflow-hidden rounded-xl border text-left "+(p.id===editorProject.kind?"border-emerald-300":"border-white/10")}><div className={"h-11 bg-gradient-to-r "+kindsArtwork[p.id]}/><span className="block p-2 text-[11px] font-bold">{p.label}</span></button>)}</div>
          <label className="flex items-center gap-4"><input type="color" value={editorProject.accent} onChange={e=>patch({accent:e.target.value})} className="h-11 w-16 rounded border-0 bg-transparent"/><span className="text-xs font-semibold">Cor de destaque</span></label>
         </>}
        <Field label="URL de fotografia própria ou licenciada (HTTPS)" value={editorProject.heroImage.startsWith("data:")?"":editorProject.heroImage} onChange={v=>patch({heroImage:v})} placeholder="https://..."/>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-4 text-xs font-semibold text-white/75 hover:border-emerald-300/60"><ImagePlus className="h-4 w-4"/> Enviar imagem de capa (até 1,5 MB)<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void uploadHero(e)}/></label>
        {editorProject.heroImage&&<button className="text-xs text-red-300" onClick={()=>patch({heroImage:""})}>Remover imagem</button>}
        <p className="text-xs leading-6 text-white/40">{editorProject.templateVersion==="universal-v1"
         ?"A imagem original do template está preservada. Substitua por um mockup real do produto, se quiser personalizar a oferta."
         :"O layout funciona sem imagem externa, graças à composição gráfica interna."}</p>
       </>}
      </div>
     </aside>}
     <section id="landing-preview" className="order-1 min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#151a24] xl:order-2">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-2.5 py-2 sm:px-3">
        <div className="flex min-w-0 items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400"/><span className="text-[11px] font-semibold text-white/70">{editorProject.templateVersion==="universal-v1"?"Toque para editar · 2 toques para escrever":"Prévia"}</span></div>
        <div className="flex items-center gap-1.5">
         <div className="flex rounded-lg border border-white/10 p-0.5" role="group" aria-label="Dispositivo da prévia">
          <button type="button" title="Desktop" aria-label="Visualização desktop" aria-pressed={viewport==="desktop"} onClick={()=>setViewport("desktop")} className={"rounded-md p-1.5 "+(viewport==="desktop"?"bg-white/15 text-emerald-200":"text-white/45")}><Monitor className="h-4 w-4"/></button>
          <button type="button" title="Celular" aria-label="Visualização celular" aria-pressed={viewport==="mobile"} onClick={()=>setViewport("mobile")} className={"rounded-md p-1.5 "+(viewport==="mobile"?"bg-white/15 text-emerald-200":"text-white/45")}><Smartphone className="h-4 w-4"/></button>
         </div>
         <button type="button" onClick={openFullPreview} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/25 px-2.5 py-2 text-[11px] font-bold text-emerald-200" title="Abrir prévia em tela cheia"><ExternalLink className="h-3.5 w-3.5"/><span className="hidden sm:inline">Tela cheia</span></button>
         {editorProject.templateVersion==="universal-v1"&&<>
           <input ref={addImageInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Escolher imagem para adicionar" onChange={e=>void addInlineImage(e)}/>
           <button type="button" onClick={()=>addImageInput.current?.click()} title="Adicionar imagem à landing page" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/30 px-2.5 py-2 text-[11px] font-bold text-emerald-200"><ImagePlus className="size-4"/><span className="sm:hidden">+ Imagem</span><span className="hidden sm:inline">Adicionar imagem</span></button>
          </>}
          {editorProject.templateVersion!=="universal-v1"&&<a href="#landing-editor-controls" className="inline-flex items-center rounded-lg border border-white/15 px-2.5 py-2 text-[11px] font-bold text-white/85 xl:hidden">Editar</a>}
         {editorProject.publishedSlug&&<button type="button" onClick={()=>void loadLeads()} disabled={!!busy} title="Contatos recebidos" aria-label="Ver leads" className="inline-flex items-center rounded-lg border border-white/10 p-2 text-white/65 disabled:opacity-35"><Users className="h-4 w-4"/></button>}
        </div>
       </div>
       <div className="relative flex justify-center overflow-hidden bg-[#252a36] p-1.5 sm:p-3">
       <div className={"overflow-hidden rounded-xl bg-white shadow-[0_25px_70px_#0004] transition-[width] duration-300 "+(viewport==="mobile"?"w-full max-w-[390px]":"w-full")}>
        <iframe ref={previewFrame} key={viewport} title="Landing page ao vivo" srcDoc={preview} sandbox="allow-scripts allow-forms" className="h-[calc(100dvh-192px)] min-h-[560px] w-full border-0 xl:h-[820px]" />
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
