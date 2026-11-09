"use client";
import {useEffect,useRef,useState} from "react";
import type {BuilderV2SiteData} from "./builder-v2-site";
import {isJapaneseCuisineSiteIdentity,japaneseModel1Brand} from "@/lib/tp3-japanese-model1";

/**
 * Real internet food photography explicitly curated for Japanese cuisine.
 * The old TP3 fallbacks used bread, pancakes and burgers across niches.
 * This index intentionally contains no generic-food URLs and has enough
 * distinct pictures for all gallery / menu / editorial positions per site.
 * Customer-uploaded and CRM-imported pictures remain higher priority.
 */
export const JAPANESE_TP3_PHOTO_IDS=[
 "photo-1579871494447-9811cf80d66c",
 "photo-1553621042-f6e147245754",
 "photo-1579584425555-c3ce17fd4351",
 "photo-1611143669185-af224c5e3252",
 "photo-1563612116625-3012372fccce",
 "photo-1583623025817-d180a2221d0a",
 "photo-1617196034796-73dfa7b1fd56",
 "photo-1615361200141-f45040f367be",
 "photo-1559410545-0bdcd187e0a6",
 "photo-1558985250-27a406d64cb3",
 "photo-1519984388953-d2406bc725e1",
 "photo-1582450871972-ab5ca641643d",
 "photo-1579584425555-c3ce17fd4351",
 "photo-1611143669185-af224c5e3252",
 "photo-1558985212-92c2ff0b56e7",
 "photo-1591814468924-caf88d1232e1",
 "photo-1553621042-f6e147245754",
 "photo-1579871494447-9811cf80d66c",
 "photo-1516684732162-798a0062be99",
 "photo-1583623025817-d180a2221d0a",
 "photo-1563612116625-3012372fccce",
 "photo-1617196034796-73dfa7b1fd56",
 "photo-1559410545-0bdcd187e0a6",
 "photo-1615361200141-f45040f367be",
] as const;

/* Each model uses its own starting position, never the same hero image.
 * We skip repeated IDs within the same page by selecting from this
 * deduplicated catalog, not the generic wrapping array above. */
// Free licensed Pexels images with specifically verified sushi/sashimi
// descriptions. These extend the pool to keep photos unique within a page.
// https://www.pexels.com/photo/a-chef-making-sushi-8951107/
// https://www.pexels.com/photo/exquisite-sushi-platter-with-assorted-sashimi-and-rolls-31393446/
export const JAPANESE_TP3_PEXELS_IDS=[
 8951107,8951105,8951172,28992215,31225297,31282322,1893573,
 15476834,10692490,12437584,31393446,24604647,
] as const;
const UNIQUE_JAPANESE_PHOTOS=[
 ...new Set(JAPANESE_TP3_PHOTO_IDS.map(id=>"https://images.unsplash.com/"+id)),
 ...JAPANESE_TP3_PEXELS_IDS.map(id=>"https://images.pexels.com/photos/"+id+"/pexels-photo-"+id+".jpeg"),
];
export function japaneseTP3Photo(slot:number,model:2|3,width=1400):string{
 const offset=model===2?0:11;
 const base=UNIQUE_JAPANESE_PHOTOS[(Math.max(0,Math.trunc(slot))+offset)%UNIQUE_JAPANESE_PHOTOS.length];
 return base.includes("pexels.com")
  ?base+"?auto=compress&cs=tinysrgb&w="+width
  :base+"?auto=format&fit=crop&w="+width+"&q=85";
}
export function japaneseTP3OwnerImage(site:BuilderV2SiteData,section:RegExp,index=0):string|undefined{
 const chosen=site.blocks.filter(block=>block.type==="image" && section.test(block.section||"") &&
   typeof block.src==="string" && block.src.trim() &&
   (block.userUploaded===true || site.crmImported===true));
 return chosen[index]?.src||undefined;
}
export function isJapaneseTP3Site(site:BuilderV2SiteData,selectedNiche?:string):boolean{
 return isJapaneseCuisineSiteIdentity({
  selectedNiche,niche:site.niche,title:site.title,brand:site.header?.brand,
  heroHeadings:site.blocks.filter(b=>b.type==="heading").slice(0,2).map(b=>b.text),
 });
}
export function japaneseTP3Brand(site:BuilderV2SiteData,publishedMode:boolean):string{
 return japaneseModel1Brand(site.title||"",site.header?.brand,publishedMode).brand;
}

const exampleReviews=[
 {name:"Mariana Costa",quote:"Os sabores e a apresentação dos pratos criam uma experiência que vale a pena compartilhar.",avatar:"photo-1534528741775-53994a69daeb"},
 {name:"Rafael Almeida",quote:"Gostei do cuidado com os detalhes e da proposta de uma experiência japonesa acolhedora.",avatar:"photo-1500648767791-00dcc994a43e"},
 {name:"Camila Ferreira",quote:"O ambiente e os combinados deixaram nosso encontro ainda mais especial.",avatar:"photo-1524504388940-b1c1722653e1"},
 {name:"Lucas Martins",quote:"Uma boa seleção de sabores para quem aprecia culinária japonesa.",avatar:"photo-1506794778202-cad84cf45f1d"},
] as const;
export function JapaneseTP3Testimonials({site,publishedMode=false,variant}:{site:BuilderV2SiteData;publishedMode?:boolean;variant:2|3}){
 const raw=site.blocks.filter(b=>b.type==="paragraph"&&/depoiment|avalia[cç]|testimonial/i.test(b.section||""))
   .map(b=>(b.text||"").split("|").map(v=>v.trim()))
   .filter(parts=>parts.length>=3&&parts[0]&&parts[2]);
 const testimonials=raw.slice(0,4).map((parts,i)=>({
  name:parts[0],quote:parts.slice(2).join(" "),role:parts[1],avatar:exampleReviews[i].avatar,demo:false,
 }));
 if(!publishedMode){
  for(let i=testimonials.length;i<4;i++)testimonials.push({...exampleReviews[i],role:"Exemplo fictício",demo:true});
 }
 const dark=variant===3;
 return <div data-japanese-reviews={variant} className="mt-9">
  {testimonials.some(item=>item.demo)&&<p className={"mb-7 max-w-3xl text-sm leading-7 "+(dark?"text-[#d5c7b6]":"text-[#534a3d]")}>
   <strong>Depoimentos demonstrativos:</strong> nomes, retratos e relatos fictícios para visualização. Substitua por avaliações reais autorizadas antes de publicar.
  </p>}
  {testimonials.length?<div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
   {testimonials.map((item,i)=><blockquote key={item.name+"-"+i}
     className={"min-w-0 overflow-hidden rounded-xl border p-5 shadow-sm "+(dark?"border-[#514233] bg-[#29251e] text-[#f5eee5]":"border-[#dacabb] bg-[#fffaf4] text-[#29251f]")}>
     <div className="flex min-w-0 items-center gap-3">
      <img src={"https://images.unsplash.com/"+item.avatar+"?auto=format&fit=crop&w=160&h=160&q=80"} loading="lazy"
        alt="Retrato ilustrativo — não identifica o autor da avaliação" className="h-12 w-12 shrink-0 rounded-full object-cover" style={{width:48,height:48,minWidth:48,minHeight:48,flexShrink:0,borderRadius:"50%",objectFit:"cover"}}/>
      <div className="min-w-0"><strong className="block break-words text-sm font-semibold">{item.name}</strong>
       <span className={"text-xs "+(dark?"text-[#d0ba9d]":"text-[#8a7260]")}>{item.demo?"Exemplo fictício":"Foto ilustrativa"}</span>
      </div>
     </div>
     <p className={"mt-5 break-words text-sm leading-7 "+(dark?"text-[#e0d2c3]":"text-[#5b5149]")}>“{item.quote}”</p>
     {item.demo&&<span className={"mt-5 block text-[10px] font-bold uppercase tracking-[.13em] "+(dark?"text-[#dfb780]":"text-[#9a6f53]")}>Avaliação de demonstração</span>}
    </blockquote>)}
   </div>:<p className={"text-sm leading-7 "+(dark?"text-[#dbccbd]":"text-[#5b5149]")}>Depoimentos reais aparecerão quando forem cadastrados e autorizados pela empresa.</p>}
 </div>;
}

type Metric={value:number;label:string;suffix:string};
export function japaneseTP3Metrics(raw:readonly (string|undefined)[],faqCount:number):{metrics:Metric[];example:boolean}{
 const parsed=raw.flatMap(item=>{
  const value=(item||"").trim();
  const match=value.match(/^(\d+(?:[.,]\d+)?)\s*(\+|%|mil|k)?\s*(?:[|:—-]\s*|\s+)(.{3,90})$/i);
  if(!match)return [];
  const number=Number(match[1].replace(",","."));
  if(!Number.isFinite(number)||number<0||number>999999)return [];
  return [{value:number,suffix:match[2]||"",label:match[3].trim()}];
 }).slice(0,4);
 if(parsed.length)return {metrics:parsed,example:false};
 // Counts are factual properties of the page, not fabricated business KPIs.
 return {metrics:[
  {value:4,suffix:"",label:"Categorias de especialidades"},
  {value:3,suffix:"",label:"Etapas para conhecer a experiência"},
  {value:faqCount,suffix:"",label:"Perguntas respondidas"},
 ],example:true};
}
export function JapaneseTP3AnimatedNumbers({raw,faqCount=5,variant}:{raw:readonly (string|undefined)[];faqCount?:number;variant:2|3}){
 const wrapRef=useRef<HTMLDivElement>(null);
 const [progress,setProgress]=useState(0);
 const {metrics,example}=japaneseTP3Metrics(raw,faqCount);
 const key=metrics.map(m=>m.value+"-"+m.suffix+"-"+m.label).join("|");
 useEffect(()=>{
  const el=wrapRef.current;
  if(!el)return;
  if(typeof window==="undefined")return;
  if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches||!("IntersectionObserver" in window)){
   setProgress(1);return;
  }
  let frame=0;
  let triggered=false;
  const observer=new IntersectionObserver(entries=>{
   if(!entries.some(entry=>entry.isIntersecting)||triggered)return;
   triggered=true;observer.disconnect();
   const start=performance.now(),duration=1250;
   const animate=(now:number)=>{
    const t=Math.min(1,(now-start)/duration);
    setProgress(1-Math.pow(1-t,3));
    if(t<1)frame=requestAnimationFrame(animate);
   };
   frame=requestAnimationFrame(animate);
  },{threshold:0.15,rootMargin:"0px 0px -10px 0px"});
  observer.observe(el);
  return ()=>{observer.disconnect();cancelAnimationFrame(frame);};
 },[key]);
 const dark=variant===2;
 return <div ref={wrapRef} data-japanese-animated-numbers={variant} className="mt-9">
  {example&&<p className={"mb-6 max-w-2xl text-sm leading-7 "+(dark?"text-white/85":"text-[#342c1e]")}>
    Estes números representam o conteúdo apresentado nesta página, não estatísticas de vendas, clientes ou tempo de mercado.
  </p>}
  <div className="grid min-w-0 gap-4 sm:grid-cols-3">
   {metrics.map((metric,i)=><article key={i+"-"+metric.label}
    className={"min-w-0 border-t-2 pt-5 "+(dark?"border-white/60":"border-[#62472b]")}>
    <strong aria-label={String(metric.value)+metric.suffix} className="block break-words text-[clamp(2.6rem,5vw,5rem)] font-bold leading-none tabular-nums">
     {Math.round(progress*metric.value).toLocaleString("pt-BR")}{metric.suffix}
    </strong>
    <span className="mt-4 block max-w-[16rem] text-sm font-medium leading-6">{metric.label}</span>
   </article>)}
  </div>
 </div>;
}

export function JapaneseTP3Footer({site,publishedMode=false,variant}:{site:BuilderV2SiteData;publishedMode?:boolean;variant:2|3}){
 const brand=japaneseTP3Brand(site,publishedMode);
 const address=site.extras?.address?.trim()||site.footer?.address?.trim()||"";
 const phone=(site.restaurant?.whatsapp||site.footer?.whatsapp||"").replace(/\D/g,"");
 const whatsapp=phone.length>=10&&phone.length<=13?"https://wa.me/"+(phone.startsWith("55")?phone:"55"+phone):"";
 const links=[["Início","#inicio"],["Especialidades",variant===2?"#sabores":"#especialidades"],["Sobre","#sobre"],["Galeria","#galeria"],["Depoimentos","#depoimentos"],["FAQ","#faq"],["Contato","#contato"]] as const;
 return <footer data-universal-section="rodape" data-japanese-tp3-footer={variant} id="rodape"
  className={"px-6 pb-7 pt-16 text-[#f8f1e7] md:px-10 md:pt-20 "+(variant===2?"bg-[#16211d]":"bg-[#121712]")}>
  <div className="mx-auto max-w-7xl">
   <div className="grid min-w-0 gap-10 border-b border-white/20 pb-14 md:grid-cols-[minmax(0,1.35fr)_minmax(0,.8fr)_minmax(0,1fr)] md:gap-10 xl:gap-16">
    <div className="min-w-0"><span className="text-xs font-bold uppercase tracking-[.2em] text-[#d5ad76]">Tradição · sabor · encontro</span>
     <h2 className="mt-5 max-w-lg break-words font-serif text-[clamp(2rem,4vw,3.7rem)] leading-[1.1] tracking-[-.03em]">{brand}</h2>
     <p className="mt-5 max-w-sm text-sm leading-7 text-[#c8c5b9]">Uma apresentação da culinária japonesa que valoriza pratos, detalhes e experiências.</p>
    </div>
    <div className="min-w-0"><h3 className="text-sm font-bold uppercase tracking-[.16em] text-[#d5ad76]">Navegação</h3>
     <nav aria-label="Navegação do rodapé" className="mt-6 flex flex-col items-start gap-3 text-sm">
      {links.map(([text,href])=><a key={href} href={href} className="text-[#f3ebe0] transition-colors hover:text-[#d5ad76]">{text}</a>)}
     </nav>
    </div>
    <div className="min-w-0"><h3 className="text-sm font-bold uppercase tracking-[.16em] text-[#d5ad76]">Contato</h3>
     {address?<address className="mt-6 break-words text-sm not-italic leading-7">{address}</address>
     :!publishedMode?<p className="mt-6 text-sm leading-7 text-[#c8c5b9]"><strong className="block text-xs uppercase tracking-[.1em] text-[#d5ad76]">Endereço fictício — prévia</strong>Rua das Cerejeiras, 120 — São Paulo/SP</p>
     :<p className="mt-6 text-sm leading-7 text-[#c8c5b9]">Endereço disponível após cadastro da localização oficial.</p>}
     {whatsapp?<a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#d5ad76] px-6 py-4 text-center text-sm font-bold text-[#131a16] sm:w-auto">Falar no WhatsApp ↗</a>
     :!publishedMode?<p className="mt-6 text-xs leading-6 text-[#c8c5b9]">Cadastre um WhatsApp oficial para ativar o botão de contato.</p>:null}
    </div>
   </div>
   <div className="flex flex-col gap-2 pt-7 text-xs leading-6 text-[#c8c5b9] md:flex-row md:items-center md:justify-between">
    <p>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</p>
    <a href="#inicio" className="text-[#d5ad76] hover:underline">Voltar ao início ↑</a>
   </div>
  </div>
 </footer>;
}
