"use client";
import {useEffect,useRef,useState} from "react";
import "./builder-v2-tp2-evidence.css";
import type {BuilderV2SiteData} from "./builder-v2-site";
import {universalBlockProps} from "./builder-v2-universal-bindings";
type Footer={address?:string;email?:string;whatsapp?:string};
const sample=[
 ["Mariana Oliveira","Personagem fictícia · Atendimento","A escuta e o cuidado com cada etapa ajudam a transformar ideias em decisões mais claras."],
 ["Ricardo Almeida","Personagem fictício · Planejamento","Um processo organizado ajuda a compreender prioridades e acompanhar as próximas escolhas."],
 ["Patrícia Souza","Personagem fictícia · Projeto","A atenção aos detalhes e às necessidades do espaço é o que valorizo em uma consultoria."],
 ["Carlos Ferreira","Personagem fictício · Consultoria","Conhecer as alternativas e entender o processo faz diferença no planejamento."],
 ["Juliana Martins","Personagem fictícia · Acompanhamento","Uma comunicação objetiva favorece o alinhamento de expectativas durante o projeto."]
] as const;
const faces=[27066067,30004315,33614428,13999482,6413499];
function Count({value}:{value:number}){
 const node=useRef<HTMLSpanElement>(null),[display,setDisplay]=useState(0);
 useEffect(()=>{
  const el=node.current;if(!el)return;
  if(!("IntersectionObserver" in window)||window.matchMedia("(prefers-reduced-motion: reduce)").matches){setDisplay(value);return}
  let frame=0;
  const watcher=new IntersectionObserver(entries=>{
   if(!entries.some(e=>e.isIntersecting))return;
   watcher.disconnect();const started=performance.now();
   const animate=(now:number)=>{const t=Math.min(1,(now-started)/1000);setDisplay(Math.round(value*(1-(1-t)**3)));if(t<1)frame=requestAnimationFrame(animate)};
   frame=requestAnimationFrame(animate);
  },{threshold:.15});
  watcher.observe(el);
  return ()=>{watcher.disconnect();cancelAnimationFrame(frame)};
 },[value]);
 return <span ref={node} aria-label={String(value)}>{display.toLocaleString("pt-BR")}</span>;
}
/** Genuine business metrics are displayed only when the user explicitly supplies numeric evidence. */
export function hasTP2VerifiedMetrics(provided:readonly (string|undefined)[]=[]):boolean{
 return provided.some(entry=>{
  const raw=String(entry||"").trim();
  if(/ilustrativ|fict[ií]ci|demonstra|exemplo|cadastrar|preencher|ser[aã]o apresentad|n[aã]o informado/i.test(raw))return false;
  const match=raw.match(/^(\d{1,6})\s*\+?\s*[-–—:]?\s+(.{4,75})$/);
  return !!match&&Number(match[1])>0;
 });
}
export function TP2EvidenceNumbers({services,steps,faqs,provided=[]}:{services:number;steps:number;faqs:number;provided?:readonly (string|undefined)[]}){
 const actual=provided.flatMap(entry=>{
  const raw=String(entry||"").trim();
  if(/ilustrativ|fict[ií]ci|demonstra|exemplo|cadastrar|preencher|ser[aã]o apresentad|n[aã]o informado/i.test(raw))return [];
  const match=raw.match(/^(\d{1,6})\s*\+?\s*[-–—:]?\s+(.{4,75})$/);
  return match&&Number(match[1])>0?[{value:Number(match[1]),label:match[2]}]:[];
 }).slice(0,4);
 if(!actual.length){
  const pillars=[
   {title:"Escuta e diagnóstico",text:"Compreender o contexto, as necessidades e as prioridades antes de definir o caminho."},
   {title:"Planejamento com propósito",text:"Organizar as etapas e considerar alternativas adequadas a cada projeto."},
   {title:"Clareza no processo",text:"Apresentar as possibilidades com transparência e atenção aos detalhes."}
  ];
  return <div data-tp2-proof="numbers" data-tp2-mode="approach" className="pntp2-approach">
   <p className="pntp2-approach-kicker">O QUE ORIENTA NOSSA ABORDAGEM</p>
   <div className="pntp2-approach-grid">{pillars.map((pillar,i)=><article key={pillar.title}>
    <span className="pntp2-approach-index">0{i+1} / NOSSO COMPROMISSO</span>
    <h3>{pillar.title}</h3><p>{pillar.text}</p>
   </article>)}</div>
   <p className="pntp2-approach-note">Indicadores de projetos realizados, clientes atendidos e experiência serão exibidos somente quando a empresa fornecer dados verificáveis.</p>
  </div>;
 }
 return <div data-tp2-proof="numbers" data-tp2-mode="verified" className="pntp2-evidence">
  <span className="pntp2-approach-kicker">INDICADORES INFORMADOS PELA EMPRESA</span>
  <div className="pntp2-number-grid">{actual.map((item,i)=><article key={i}><strong><Count value={item.value}/></strong><p>{item.label}</p></article>)}</div>
  <p className="pntp2-approach-note">Indicadores declarados pela empresa. Confirme a veracidade antes de publicar.</p>
 </div>;
}
type Story={name:string;role:string;quote:string;portrait:string;demo:boolean};
export function TP2EvidenceTestimonials({provided=[],publishedMode=false}:{provided?:readonly (readonly string[])[];publishedMode?:boolean}){
 const real:Story[]=provided.filter(v=>v.length>=3&&v[0]?.trim()&&v.slice(2).join(" ").trim()).slice(0,5).map(v=>({name:v[0],role:v[1]||"Cliente",quote:v.slice(2).join(" | "),portrait:"",demo:false}));
 const demo:Story[]=publishedMode?[]:sample.slice(0,Math.max(0,5-real.length)).map((v,i)=>({name:v[0],role:v[1],quote:v[2],portrait:"https://images.pexels.com/photos/"+faces[i]+"/pexels-photo-"+faces[i]+".jpeg?auto=compress&cs=tinysrgb&w=380",demo:true}));
 const entries=[...real,...demo];
 return <div data-tp2-proof="testimonials" className="w-full max-w-7xl mt-9">
  <span className="block text-xs font-extrabold uppercase tracking-[.15em] opacity-70 mb-5">{demo.length?"CINCO RELATOS FICTÍCIOS · PRÉVIA DE LAYOUT":"AVALIAÇÕES CADASTRADAS PELA EMPRESA"}</span>
  {entries.length?<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{entries.map((entry,i)=><article key={i} className="flex min-w-0 flex-col gap-5 rounded-xl border border-[#d6cec2] bg-[#f8f4ed] p-6 text-[#292820]">
   <div className="flex items-center gap-3">{entry.portrait?<img src={entry.portrait} alt="Foto de banco de imagens, personagem fictício" loading="lazy" className="!h-14 !w-14 !shrink-0 !rounded-full !object-cover"/>:<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#dfd0bd] text-xl font-bold">{entry.name[0]}</div>}
    <div className="min-w-0"><strong className="block text-base font-bold">{entry.name}</strong><small className="block text-[11px] leading-5 text-[#756b5d]">{entry.role}</small></div></div>
   <blockquote className="grow text-sm leading-7">“{entry.quote}”</blockquote>
   <span className="text-[10px] font-extrabold tracking-[.1em] text-[#967656]">{entry.demo?"RELATO FICTÍCIO · IMAGEM ILUSTRATIVA":"RELATO FORNECIDO PELA EMPRESA"}</span>
  </article>)}</div>:<div className="rounded-xl bg-[#f8f4ed] p-7 text-[#292820]"><h3 className="font-bold">Depoimentos de clientes</h3><p className="mt-3 text-sm leading-7">Cadastre relatos reais e autorizados para preencher esta seção. Nenhuma avaliação foi inventada.</p></div>}
  {demo.length>0&&<p className="mt-6 text-xs leading-6 opacity-70">Estes cinco relatos, nomes e fotos são fictícios e servem apenas à prévia. Não representam clientes nem avaliações verificadas; na publicação, não serão apresentados como reais.</p>}
 </div>;
}
const whatsapp=(footer?:Footer)=>{const d=(footer?.whatsapp||"").replace(/\D/g,"");return d.length>=10&&d.length<=15?"https://wa.me/"+(d.startsWith("55")?d:"55"+d):null};
export function TP2ContactMap({footer,publishedMode=false}:{footer?:Footer;publishedMode?:boolean}){
 const address=footer?.address?.trim()||"",phone=whatsapp(footer),email=footer?.email?.trim()||"";
 return <div data-tp2-proof="location" className="mx-auto mt-8 w-full max-w-6xl overflow-hidden rounded-2xl bg-[#f8f4ed] text-[#2c271f]">
  {address||!publishedMode?<iframe title={address?"Mapa cadastrado da empresa":"Mapa demonstrativo sem endereço comercial cadastrado"} src={"https://www.google.com/maps?q="+encodeURIComponent(address||"São Paulo, Brasil")+"&output=embed"} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-72 w-full border-0 md:h-96"/>:<div className="grid min-h-52 place-items-center bg-[#e4d9cd] p-8 text-center text-sm">Cadastre o endereço para exibir o mapa no site publicado.</div>}
  <div className="flex flex-col items-start gap-4 p-6 md:p-10">
   <span className="text-xs font-extrabold uppercase tracking-[.2em]">ENDEREÇO E CONTATO</span>
   <address className="text-lg font-bold not-italic leading-7 break-words">{address||"São Paulo/SP · localização demonstrativa · endereço comercial não cadastrado"}</address>
   {!address&&<p className="text-xs leading-6 text-[#655d54]">Mapa demonstrativo sem vínculo com a empresa. Cadastre o endereço real antes de publicar.</p>}
   {phone?<a href={phone} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-[#1d9149] px-6 py-4 text-center text-sm font-bold text-white no-underline sm:w-auto">Falar no WhatsApp ↗</a>:email&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)?<a className="inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-[#2a4636] px-6 py-4 text-center text-sm font-bold text-white no-underline sm:w-auto" href={"mailto:"+email}>Enviar e-mail ↗</a>:<a className="inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-[#514438] px-6 py-4 text-center text-sm font-bold text-white no-underline sm:w-auto" href="#contato">WhatsApp não cadastrado · configurar no editor</a>}
  </div>
 </div>;
}
export function TP2PremiumFooterBody({brand,footer,home="#inicio",headlineBlock}:{brand:string;footer?:Footer;home?:string;headlineBlock?:BuilderV2SiteData["blocks"][number]}){
 const phone=whatsapp(footer);
 return <div data-tp2-proof="premium-footer" className="w-full bg-[#15201c] px-6 pb-7 pt-14 text-[#f7f2e9] md:px-14 md:pt-20">
  <div className="pntp2-footer-shell">
   <div className="pntp2-footer-head border-b border-white/20 pb-12"><div><span className="text-xs font-bold tracking-[.2em] text-[#d9bb98]">DESIGN · PROJETO · POSSIBILIDADES</span><h2 className="pntp2-footer-headline" {...universalBlockProps(headlineBlock)}>{headlineBlock?.text||<>Seu próximo projeto começa <em className="font-serif font-normal text-[#d9bb98]">com uma conversa.</em></>}</h2></div><a href={home} className="pntp2-footer-top-link text-xs font-bold text-[#e8dbca]">Voltar ao topo ↑</a></div>
   <div className="pntp2-footer-columns py-12">
    <div><h3 className="pntp2-footer-column-title">EXPLORAR</h3><nav aria-label="Navegação do rodapé" className="flex flex-col gap-3 text-sm"><a href={home}>Início ↗</a><a href="#sobre">Sobre ↗</a><a href="#especialidades">Especialidades ↗</a><a href="#projetos">Projetos ↗</a><a href="#contato">Contato ↗</a></nav></div>
    <div className="min-w-0"><h3 className="pntp2-footer-column-title">FALE CONOSCO</h3><div className="pntp2-footer-contact text-sm">{footer?.email&&<a href={"mailto:"+footer.email}>{footer.email}</a>}{phone&&<a href={phone} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}{!footer?.email&&!phone&&<a href="#contato">Cadastrar canal de contato ↗</a>}</div></div>
    <div><h3 className="pntp2-footer-column-title">LOCALIZAÇÃO</h3><p className="text-sm leading-6 opacity-80">{footer?.address||"Endereço ainda não cadastrado."}</p><a href="#contato" className="mt-3 inline-block text-sm">Contato e localização ↗</a></div>
   </div>
   <strong className="pntp2-footer-brand">{brand}</strong>
   <div className="mt-9 flex flex-wrap justify-between gap-4 border-t border-white/20 pt-6 text-xs text-[#d7cfc3]"><span>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</span><span>Projetos com propósito.</span></div>
  </div>
 </div>;
}
