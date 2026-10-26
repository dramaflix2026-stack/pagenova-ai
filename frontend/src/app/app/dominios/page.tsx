"use client";

import Link from "next/link";
import {useCallback,useEffect,useMemo,useState} from "react";
import {
  ArrowLeft,ArrowRight,BookOpen,Check,CheckCircle2,ChevronDown,Copy,
  ExternalLink,Globe,HelpCircle,Info,Loader2,Search,ShieldCheck,
  Sparkles,TriangleAlert,Wifi
} from "lucide-react";
import {normalizeCustomerDomain} from "@/lib/pagenova-custom-domains";

type PublishedSite={id:string;slug:string;title:string;publishedAt:string;url:string};
type Verification={type:string;domain:string;value:string;reason?:string};
type DnsRecord={name:string;value:string};
type DomainBinding={
  domain:string;projectId:string;slug:string;
  state:"pending"|"needs_configuration"|"active"|"error";
  verification?:Verification[];dnsInstructions?:{a?:DnsRecord;cname?:DnsRecord};
  updatedAt?:string;
};
type DomainsResponse={
  connectionAvailable:boolean;sites:PublishedSite[];domains:DomainBinding[];
  error?:string;
};
function siteTitle(site:PublishedSite){
 const trimmed=site.title.trim();
 // Historical AI drafts sometimes persisted a full sentence or prompt
 // in title instead of the business name. Never render it as a site label.
 const looksLikeBrief=trimmed.length>76||trimmed.split(/\s+/).length>11||
   /\b(?:atende clientes|transformar casas|descreva o site|quero criar um site)\b/i.test(trimmed);
 if(trimmed&&!looksLikeBrief&&
   !["sua marca","novo projeto","meu site","site sem nome definido"].includes(trimmed.toLowerCase()))
   return trimmed.slice(0,76);
 return "Site publicado · "+new Date(site.publishedAt).toLocaleDateString("pt-BR")+" · "+site.slug.slice(-6);
}
function Copyable({label,value}:{label:string;value:string}){
 const [copied,setCopied]=useState(false);
 return <div className="min-w-0 rounded-xl border border-white/10 bg-[#0b1510] p-3">
  <span className="block text-[11px] font-medium text-white/55">{label}</span>
  <div className="mt-1 flex items-center gap-2"><code className="min-w-0 flex-1 break-all text-xs text-lime-200">{value}</code>
  <button type="button" title={"Copiar "+label} aria-label={"Copiar "+label}
    onClick={async()=>{try{await navigator.clipboard.writeText(value);setCopied(true);}catch{setCopied(false);}}}
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[.05] text-white/80 hover:border-lime-300/40">
    {copied?<Check size={16} className="text-lime-300"/>:<Copy size={16}/>}
  </button></div>
 </div>;
}
export default function DominiosPage(){
 const [data,setData]=useState<DomainsResponse>({connectionAvailable:false,sites:[],domains:[]});
 const [loading,setLoading]=useState(true);
 const [loadingAction,setLoadingAction]=useState(false);
 const [siteId,setSiteId]=useState("");
 const [pickerOpen,setPickerOpen]=useState(false);
 const [search,setSearch]=useState("");
 const [domain,setDomain]=useState("");
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [lastResult,setLastResult]=useState<DomainBinding|null>(null);
 const load=useCallback(async()=>{
  try{
   const response=await fetch("/api/domains",{cache:"no-store",credentials:"same-origin"});
   const body=await response.json() as DomainsResponse;
   if(!response.ok)throw new Error(body.error||"Não foi possível carregar seus sites publicados.");
   setData(body);
   const requested=new URLSearchParams(window.location.search).get("project");
   setSiteId(current=>current&&body.sites.some(x=>x.id===current)?current:
    requested&&body.sites.some(x=>x.id===requested)?requested:body.sites[0]?.id||"");
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível carregar os sites.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{
   // Restore previously published local Studio/CRM projects into the new
   // server-side ownership registry. Every import is verified against the
   // original private Supabase publication by the authenticated API.
   const prefix="pagenova-builder-v2-private-v1";
   const entries:Array<{projectId:string;slug:string}>=[];
   try{
     for(let i=0;i<window.localStorage.length&&entries.length<12;i++){
       const key=window.localStorage.key(i);
       if(key!==prefix&&!key?.startsWith(prefix+":crm:"))continue;
       const raw=window.localStorage.getItem(key||"");
       if(!raw)continue;
       const saved=JSON.parse(raw) as {id?:unknown;publishedUrl?:unknown};
       const id=typeof saved.id==="string"?saved.id:"";
       const link=typeof saved.publishedUrl==="string"?saved.publishedUrl:"";
       const match=link.match(/\/p\/(v2-[a-z0-9-]{5,80})(?:[?#]|$)/i);
       if(/^[a-zA-Z0-9_-]{8,128}$/.test(id)&&match){
         entries.push({projectId:id,slug:match[1].toLowerCase()});
       }
     }
   }catch{/* Legacy storage may contain invalid JSON: keep working without it. */}
   if(!entries.length)return;
   let cancelled=false;
   void Promise.all(entries.map(entry=>fetch("/api/domains/import",{
     method:"POST",headers:{"Content-Type":"application/json"},
     credentials:"same-origin",body:JSON.stringify(entry)
   }).catch(()=>null))).then(()=>{if(!cancelled)void load();});
   return ()=>{cancelled=true;};
 },[load]);
 const selected=useMemo(()=>data.sites.find(item=>item.id===siteId),[data.sites,siteId]);
 const selectedBindings=useMemo(()=>data.domains.filter(item=>item.projectId===siteId),[data.domains,siteId]);
 const currentBinding=lastResult?.projectId===siteId?lastResult:selectedBindings[0]||null;
 const validDomain=normalizeCustomerDomain(domain);
 const filtered=useMemo(()=>{
  const q=search.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  return data.sites.filter(site=>!q||
   (siteTitle(site)+" "+site.slug).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(q)).slice(0,35);
 },[data.sites,search]);
 async function execute(action:"connect"|"verify"){
  if(!selected||loadingAction)return;
  if(action==="connect"&&!validDomain){setError("Informe um domínio válido, sem www obrigatório, caminhos ou protocolo.");return;}
  setError("");setNotice("");setLoadingAction(true);
  try{
   const response=await fetch("/api/domains",{
    method:action==="connect"?"POST":"PATCH",
    headers:{"Content-Type":"application/json"},
    credentials:"same-origin",
    body:JSON.stringify(action==="connect"?{projectId:selected.id,domain:validDomain}:{domain:currentBinding?.domain})
   });
   const body=await response.json() as DomainBinding&{error?:string};
   if(!response.ok)throw new Error(body.error||"Não foi possível verificar o domínio.");
   setLastResult(body);
   setNotice(body.state==="active"?"Domínio verificado e conectado ao seu site!":
    "Domínio associado ao projeto. Confira abaixo as instruções de verificação antes de alterar o DNS.");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Erro na conexão.");}
  finally{setLoadingAction(false);}
 }
 return <main className="min-h-screen bg-[#090f0b] px-4 pb-40 pt-6 text-white sm:px-7 sm:pt-10">
  <div className="mx-auto max-w-5xl">
   <Link href="/app" className="inline-flex items-center gap-2 text-xs font-semibold text-white/55 hover:text-lime-300"><ArrowLeft size={15}/> Voltar ao Início</Link>
   <header className="relative mt-6 overflow-hidden rounded-[24px] border border-lime-300/15 bg-[radial-gradient(circle_at_top_right,rgba(136,214,90,.13),transparent_49%),#122016] px-5 py-6 sm:p-9">
    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-lime-300"><Globe size={16}/> PageNova · Domínios</div>
    <h1 className="mt-3 text-[clamp(1.8rem,5vw,2.8rem)] font-extrabold leading-tight tracking-[-.05em]">Seu endereço. <span className="text-lime-300">Sua marca.</span></h1>
    <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">Escolha um site publicado e configure seu domínio profissional, independentemente de onde ele foi comprado.</p>
    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/60">
     <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-lime-300"/> Associação por proprietário</span>
     <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-lime-300"/> Sites publicados</span>
    </div>
   </header>

   <section aria-labelledby="domain-connect-title" className="mt-5 rounded-[24px] border border-white/10 bg-[#101a13] p-5 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <div><span className="text-[10px] font-bold uppercase tracking-[.17em] text-lime-300">Conexão por site</span>
      <h2 id="domain-connect-title" className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Conectar meu domínio</h2></div>
     <span className={"rounded-full border px-3 py-1.5 text-[11px] font-bold "+(data.connectionAvailable?
       "border-lime-300/30 bg-lime-300/10 text-lime-200":
       "border-amber-300/25 bg-amber-300/[.07] text-amber-200")}>
       {data.connectionAvailable?"Conexão disponível":"Integração em preparação"}</span>
    </div>
    <div className="mt-6 grid gap-6">
     <div>
      <label className="mb-2 block text-sm font-semibold text-white/90" htmlFor="pn-site-search">1. Escolha um site publicado</label>
      {loading?<div role="status" className="flex min-h-20 items-center gap-3 rounded-xl border border-white/10 bg-[#0b130e] p-4 text-sm text-white/55"><Loader2 size={18} className="animate-spin"/> Buscando publicações da sua conta...</div>
       :!data.sites.length?<div className="rounded-xl border border-dashed border-white/15 bg-[#0b130e] p-5">
          <p className="text-sm font-semibold text-white/85">Nenhum site publicado encontrado</p>
          <p className="mt-2 text-xs leading-6 text-white/55">Publique o projeto no PageNova Studio para que ele apareça aqui. Sites antigos podem precisar ser publicados novamente no Builder 2.0.</p>
          <div className="mt-4 flex flex-wrap gap-2">
           <Link href="/app/builder-v2" className="rounded-lg bg-lime-300 px-4 py-2.5 text-xs font-bold text-[#152014]">Abrir Studio</Link>
           <Link href="/app/paginas" className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-bold text-white/80">Meus sites</Link>
          </div>
        </div>:<div className="relative">
         <button type="button" onClick={()=>setPickerOpen(open=>!open)} aria-expanded={pickerOpen} aria-controls="pn-domain-sites"
          className="flex min-h-[70px] w-full items-center gap-3 rounded-xl border border-white/20 bg-[#09130d] px-4 py-3 text-left transition hover:border-lime-300/40">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300"><Globe size={20}/></span>
          <span className="min-w-0 flex-1">
           <span className="block truncate text-sm font-semibold text-white">{selected?siteTitle(selected):"Selecione um site"}</span>
           <span className="mt-1 block truncate text-[11px] text-white/45">{selected?.url||"Escolha um projeto publicado"}</span>
          </span><ChevronDown size={18} className={"shrink-0 text-white/60 transition "+(pickerOpen?"rotate-180":"")}/>
         </button>
         {pickerOpen&&<div id="pn-domain-sites" className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-white/20 bg-[#16251b] p-3 shadow-[0_18px_45px_rgba(0,0,0,.55)]">
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#0a130d] px-3">
           <Search size={17} className="shrink-0 text-white/45"/>
           <input id="pn-site-search" autoFocus value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar site pelo nome..." className="min-h-11 w-full bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/40"/>
          </div>
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto overscroll-contain">
           {filtered.map(site=><button type="button" key={site.id} onClick={()=>{
              setSiteId(site.id);setPickerOpen(false);setSearch("");setLastResult(null);setNotice("");setError("");
            }} className={"flex w-full items-start gap-2 rounded-xl px-3 py-3 text-left hover:bg-lime-300/10 "+(site.id===siteId?"bg-lime-300/10":"")}>
             <Globe size={15} className="mt-0.5 shrink-0 text-lime-300/70"/>
             <span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium">{siteTitle(site)}</span>
              <span className="mt-1 block truncate text-[11px] text-white/50">{site.url} · {new Date(site.publishedAt).toLocaleDateString("pt-BR")}</span></span>
             {site.id===siteId&&<Check size={16} className="shrink-0 text-lime-300"/>}
            </button>)}
           {!filtered.length&&<p className="p-3 text-xs text-white/55">Nenhum site correspondente.</p>}
          </div>
         </div>}
        </div>}
     </div>
     <div>
      <label htmlFor="pn-domain-input" className="mb-2 block text-sm font-semibold text-white/90">2. Informe seu domínio</label>
      <div className="flex min-h-14 items-center gap-3 rounded-xl border border-white/20 bg-[#09130d] px-4 focus-within:border-lime-300/55">
       <Globe size={19} className="shrink-0 text-white/45"/>
       <input id="pn-domain-input" value={domain} onChange={e=>{setDomain(e.target.value.toLowerCase().replace(/\s+/g,""));setError("");}}
        inputMode="url" autoComplete="off" spellCheck={false} placeholder="minhaempresa.com.br"
        className="w-full min-w-0 bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-white/40"/>
      </div>
      <p className="mt-2 text-xs leading-5 text-white/45">Informe apenas o domínio, sem https:// ou caminhos. Você continua proprietário dele.</p>
      {domain.trim()&&!validDomain&&<p role="status" className="mt-2 text-xs text-amber-200">Confira o formato do domínio informado.</p>}
     </div>
     <div>
      <p className="mb-3 text-sm font-semibold text-white/90">3. Associação e verificação</p>
      {data.connectionAvailable?
       <button type="button" disabled={loadingAction||!selected||!validDomain} onClick={()=>void execute("connect")}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-bold text-[#10200f] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">
        {loadingAction?<Loader2 className="animate-spin" size={17}/>:<ShieldCheck size={18}/>} Associar ao meu site <ArrowRight size={15}/>
       </button>:
       <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[.055] p-4">
        <Info size={19} className="mt-0.5 shrink-0 text-amber-200"/>
        <div><p className="text-sm font-semibold text-amber-100">Conexão automática em preparação</p>
         <p className="mt-2 text-xs leading-6 text-white/65">A publicação de sites já funciona. A ativação de domínios personalizados ainda depende da integração segura com o provedor de hospedagem. Não altere o DNS antes de receber os registros específicos deste projeto.</p>
        </div></div>}
      {error&&<p role="alert" className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
      {notice&&<p role="status" className="mt-3 rounded-xl border border-lime-300/20 bg-lime-300/10 p-3 text-xs text-lime-200">{notice}</p>}
     </div>
    </div>
   </section>

   {currentBinding&&<section aria-labelledby="pn-current-domain" className="mt-5 rounded-[24px] border border-white/10 bg-[#101a13] p-5 sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="pn-current-domain" className="text-lg font-bold">Domínio deste projeto</h2>
      <p className="mt-1 break-all text-sm text-white/60">{currentBinding.domain}</p></div>
      <span className={"rounded-full border px-3 py-1 text-xs font-semibold "+(currentBinding.state==="active"?"border-lime-300/30 text-lime-300":"border-amber-300/25 text-amber-200")}>
       {currentBinding.state==="active"?"Conectado":"Verificação pendente"}</span>
    </div>
    {currentBinding.state==="active"?<a href={"https://"+currentBinding.domain} target="_blank" rel="noopener noreferrer"
      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-[#10200f]">Abrir meu domínio <ExternalLink size={16}/></a>:
      <div className="mt-4 space-y-3">
       <p className="text-xs leading-6 text-white/60">Use apenas os registros abaixo, retornados para este domínio pelo provedor. A ausência deles significa que a configuração ainda precisa ser consultada.</p>
       {(currentBinding.verification||[]).map(record=><Copyable key={record.domain+record.value} label={record.type+" · "+record.domain} value={record.value}/>)}
       {currentBinding.dnsInstructions?.a&&<Copyable label={"Registro A · "+currentBinding.dnsInstructions.a.name} value={currentBinding.dnsInstructions.a.value}/>}
       {currentBinding.dnsInstructions?.cname&&<Copyable label={"Registro CNAME · "+currentBinding.dnsInstructions.cname.name} value={currentBinding.dnsInstructions.cname.value}/>}
       <button type="button" disabled={loadingAction||!data.connectionAvailable} onClick={()=>void execute("verify")}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-lime-300/30 px-4 py-2.5 text-xs font-semibold text-lime-300 disabled:opacity-50">
        {loadingAction?<Loader2 size={16} className="animate-spin"/>:<Wifi size={16}/>} Verificar novamente
       </button>
      </div>}
   </section>}

   <section aria-labelledby="pn-domain-help" className="mt-8">
    <div className="flex items-center gap-2"><BookOpen size={19} className="text-lime-300"/><h2 id="pn-domain-help" className="text-lg font-bold">Precisa de orientação?</h2></div>
    <p className="mt-2 text-sm text-white/50">Um passo a passo curto, sem configurações desnecessárias.</p>
    <div className="mt-4 space-y-2">
      {[
       ["Publique seu site no Studio","Escolha Publicar no editor e confira o endereço público. Só sites realmente publicados aparecem na seleção."],
       ["Use um domínio que seja seu","Registre um domínio com o provedor de sua preferência ou utilize um que já possua."],
       ["Configure o DNS após a confirmação","Quando o serviço de conexão estiver liberado, siga exclusivamente os registros específicos mostrados para o seu projeto e verifique o HTTPS."]
      ].map(([title,body],i)=><details key={title} className="group rounded-xl border border-white/10 bg-[#111b15] p-4">
        <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-semibold text-white/85">
         <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-300/10 text-xs text-lime-300">{i+1}</span>
         <span className="min-w-0 flex-1">{title}</span><ChevronDown size={16} className="shrink-0 text-white/45 transition group-open:rotate-180"/>
        </summary><p className="pl-11 pt-3 text-xs leading-6 text-white/55">{body}</p>
       </details>)}
    </div>
   </section>

   <section className="mt-8 rounded-[22px] border border-white/10 bg-[#14221a] p-5 sm:p-7">
    <div className="flex flex-wrap items-start gap-3 sm:items-center">
     <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[.055] text-lime-300"><Globe size={20}/></span>
     <div className="min-w-0 flex-1"><h2 className="text-base font-bold">Ainda não tem domínio?</h2>
       <p className="mt-1 text-xs leading-6 text-white/55">Você pode comprar onde preferir. A Hostinger é uma opção, não uma exigência.</p></div>
    </div>
    <div className="mt-4 flex flex-wrap gap-3">
      <a href="https://www.hostinger.com/br?REFERRALCODE=VMPGIOVANPYD" target="_blank" rel="noopener noreferrer sponsored"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-semibold text-white/85 transition hover:border-lime-300/35">
        Comprar na Hostinger <ExternalLink size={14}/></a>
      <a href="https://hpanel.hostinger.com/" target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-semibold text-white/65 transition hover:border-lime-300/35">
        Meu painel DNS <ExternalLink size={14}/></a>
    </div>
    <p className="mt-3 text-[11px] leading-5 text-white/40">O link da Hostinger é de indicação comercial. A escolha do provedor é sua.</p>
   </section>
   <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-lime-300/10 p-4 pr-16 text-xs text-white/50 sm:pr-4">
    <ShieldCheck size={18} className="shrink-0 text-lime-300/80"/>
    <span className="min-w-0 flex-1">A PageNova nunca vincula o domínio de outro cliente ao seu projeto.</span>
    <Link href="/app/paginas" className="font-semibold text-lime-300 hover:text-lime-200">Meus sites →</Link>
   </div>
  </div>
 </main>;
}
