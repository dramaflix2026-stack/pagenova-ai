"use client";
import {useEffect,useRef,useState} from "react";
import type {BuilderV2SiteData} from "./builder-v2-site";
import {universalFaqItems} from "./builder-v2-universal-bindings";

/**
 * TP3 FAMILY CONTRACT — the same resolver, curated photo policy,
 * completeness sections, public-data rules, and responsive footer for M1/M2/M3.
 * Food Truck's intentionally separate creative template and the approved
 * Japanese Model 1 are not routed through these general components.
 */
export type TP3FoodCategory="Pizzaria"|"Hamburgueria"|"Cafeteria"|"Padaria"|"Confeitaria"|"Marmitaria"|"Sorveteria"|"Churrascaria"|"Buffet"|"Comida japonesa"|"Açaí"|"Doceria"|"Food truck"|"Restaurante";
const categories:[RegExp,TP3FoodCategory][]=[
 [/pizzaria|pizza|forno\s*\d+.*artesanal/i,"Pizzaria"],
 [/hamb[uú]rg|burger/i,"Hamburgueria"],
 [/cafeteria|coffee|caf[eé]\b/i,"Cafeteria"],
 [/padaria|panific|p[aã]es\b/i,"Padaria"],
 [/confeitaria/i,"Confeitaria"],
 [/marmitaria|marmita/i,"Marmitaria"],
 [/sorveteria|sorvete/i,"Sorveteria"],
 [/churrascaria|churrasco/i,"Churrascaria"],
 [/buffet/i,"Buffet"],
 [/japonesa|sushi|temaki|sashimi/i,"Comida japonesa"],
 [/a[cç]a[ií]/i,"Açaí"],
 [/doceria|brigadeiro/i,"Doceria"],
 [/food\s*truck/i,"Food truck"],
 [/restaurante/i,"Restaurante"],
];
export function resolveTP3FoodCategory(site:BuilderV2SiteData,selectedNiche?:string):TP3FoodCategory{
 // Explicit current brand outranks a stale family label from a prior draft.
 // Strong current business identity wins over stale category/header from a previous site.
 const bakeryIdentity=/maison\s+du\s+pain|boulangerie|padaria|panifica[cç][aã]o|p[aã]es\s+artesanais/i;
 const firstHeading=site.blocks.filter(b=>b.type==="heading").slice(0,5).map(b=>b.text||"").join(" ");
 const title=site.title||"";
 if(bakeryIdentity.test(title))return "Padaria";
 const titleMatch=categories.find(([test])=>test.test(title));
 if(titleMatch)return titleMatch[1];
 if(bakeryIdentity.test(firstHeading))return "Padaria";
 const brand=site.header?.brand||"";
 if(bakeryIdentity.test(brand))return "Padaria";
 const byBrand=categories.find(([test])=>test.test(brand));
 if(byBrand)return byBrand[1];
 const niche=selectedNiche||site.niche||"";
 const byNiche=categories.find(([test])=>test.test(niche));
 if(byNiche)return byNiche[1];
 const briefing=site.blocks.filter(b=>b.type==="heading"||b.type==="paragraph").slice(0,12).map(b=>b.text||"").join(" ");
 if(bakeryIdentity.test(briefing))return "Padaria";
 return categories.find(([test])=>test.test(briefing))?.[1]||"Restaurante";
}

/** Curated, external, category-specific food photos. No legacy bread fallback. */
const unsplashCatalog:Partial<Record<TP3FoodCategory,string[]>>={
 Pizzaria:[
 "photo-1595854341625-f33ee10dbf94","photo-1520201163981-8cc95007dd2a",
 "photo-1594007654729-407eedc4be65","photo-1604382355076-af4b0eb60143",
 "photo-1534308983496-4fabb1a015ee","photo-1571407970349-bc81e7e96d47",
 "photo-1604068549290-dea0e4a305ca","photo-1628840042765-356cda07504e",
 "photo-1574071318508-1cdbab80d002","photo-1513104890138-7c749659a591",
 "photo-1565299624946-b28f40a0ae38","photo-1579751626657-72bc17010498",
 "photo-1593560708920-61dd98c46a4e","photo-1548365328-9f547fb0953b",
 ],
 Hamburgueria:["photo-1568901346375-23c9450c58cd","photo-1550547660-d9450f859349","photo-1571091718767-18b5b1457add","photo-1586190848861-99aa4a171e90","photo-1553979459-d2229ba7433a","photo-1594212699903-ec8a3eca50f5"],
 Cafeteria:["photo-1442512595331-e89e73853f31","photo-1509042239860-f550ce710b93","photo-1495474472287-4d71bcdd2085","photo-1511920170033-f8396924c348","photo-1461023058943-07fcbe16d735","photo-1459755486867-b55449bb39ff"],
 Padaria:["photo-1509440159596-0249088772ff","photo-1598373182133-52452f7691ef","photo-1585478259715-876acc5be8eb","photo-1549931319-a545dcf3bc73","photo-1555507036-ab1f4038808a","photo-1484723091739-30a097e8f929"],
 Confeitaria:["photo-1488477181946-6428a0291777","photo-1578985545062-69928b1d9587","photo-1464305795204-6f5bbfc7fb81","photo-1563729784474-d77dbb933a9e","photo-1551024506-0bccd828d307","photo-1509365465985-25d11c17e812"],
 Marmitaria:["photo-1547592180-85f173990554","photo-1543353071-873f17a7a088","photo-1512621776951-a57141f2eefd","photo-1504674900247-0877df9cc836","photo-1511690743698-d9d85f2fbf38"],
 Sorveteria:["photo-1501446529957-6226bd447c46","photo-1563805042-7684c019e1cb","photo-1493857671505-72967e2e2760","photo-1570197788417-0e82375c9371","photo-1557142046-c704a3adf364"],
 Churrascaria:["photo-1544025162-d76694265947","photo-1558030006-450675393462","photo-1529694157872-4e0c0f3b238b","photo-1504674900247-0877df9cc836","photo-1607623814075-e51df1bdc82f"],
 Buffet:["photo-1511795409834-ef04bbd61622","photo-1555244162-803834f70033","photo-1507504031003-b417219a0fde","photo-1414235077428-338989a2e8c0","photo-1517248135467-4c7edcad34c4"],
 "Comida japonesa":["photo-1579871494447-9811cf80d66c","photo-1553621042-f6e147245754","photo-1579584425555-c3ce17fd4351","photo-1611143669185-af224c5e3252","photo-1583623025817-d180a2221d0a"],
 Açaí:["photo-1590301157890-4810ed352733","photo-1490323914169-5d4e38e6f1a5","photo-1505252585461-04db1eb84625","photo-1519996529931-28324d5a630e","photo-1571771894821-ce9b6c11b08e"],
 Doceria:["photo-1499636136210-6f4ee915583e","photo-1571506165871-ee72a35bc9d4","photo-1587668178277-295251f900ce","photo-1488477181946-6428a0291777","photo-1551024506-0bccd828d307"],
 Restaurante:["photo-1517248135467-4c7edcad34c4","photo-1414235077428-338989a2e8c0","photo-1550966871-3ed3cdb5ed0c","photo-1512621776951-a57141f2eefd","photo-1504674900247-0877df9cc836"],
};
// Verified 2026-11-09 against the original Pexels photo pages:
// pizza plates/toppings, pizzaiolo preparing dough, and pizza in oven.
const pizzaPexelsIds=[
 825661,8444552,2180874,4833638,7780260,3343626,5419283,
 35760002,28857295,6223171,10779683,19786200,34413618,
 11330959,35283221,32293373,35760011,11181966,6223172,
 35759998,27819656,31587822,5953574,9685257,30512710,9419407,
] as const;
const pizzaImages=[
 ...unsplashCatalog.Pizzaria!.map(id=>"https://images.unsplash.com/"+id),
 ...pizzaPexelsIds.map(id=>"https://images.pexels.com/photos/"+id+"/pexels-photo-"+id+".jpeg"),
];
export const TP3_PIZZA_DISTINCT_SOURCE_COUNT=pizzaImages.length;
// Bakery-exclusive 45 real editorial Pexels sources (bread, croissant, baguette, brioche, bakers and ovens).
// Original Pexels photo pages checked 2026-11-09. Ordered slots prevent within-model duplicates.
const bakeryPexelsIds=[
 29307618,36445326,37778434,36445141,12035578,30667028,24838082,8508106,33608752,36445222,
 30509573,15318355,33593117,30826792,7140434,33541425,27969786,7966376,36445104,30275065,
 11397854,30826793,33988126,27969779,30694851,36930940,31249261,10720142,29388479,30446295,
 36096927,33593100,9833051,36325441,14067473,30926962,24252052,34517072,19803482,30887263,
 5907566,6996211,14981376,8093320,40574434,
] as const;
const bakeryImages=bakeryPexelsIds.map(id=>"https://images.pexels.com/photos/"+id+"/pexels-photo-"+id+".jpeg");
export const TP3_BAKERY_DISTINCT_SOURCE_COUNT=bakeryImages.length;
export function tp3FamilyBrand(site:BuilderV2SiteData,category:TP3FoodCategory):string{
 const title=site.title?.trim()||"";
 const header=site.header?.brand?.trim()||"";
 if(category==="Padaria"&&/maison\s+du\s+pain|boulangerie|padaria/i.test(title))return title;
 return header||title||"Gastronomia";
}

export function tp3FamilyInternetPhoto(category:TP3FoodCategory,model:1|2|3,slot:number,width=1400):string{
 const pool=category==="Pizzaria"?pizzaImages:category==="Padaria"?bakeryImages:(unsplashCatalog[category]||unsplashCatalog.Restaurante!).map(id=>"https://images.unsplash.com/"+id);
 const offset=category==="Padaria"?(model===3?11:0):(model===1?0:model===2?3:10);
 const safeSlot=Math.max(0,Math.trunc(slot));
 const base=pool[(safeSlot+offset)%pool.length];
 return base.includes("pexels.com")?base+"?auto=compress&cs=tinysrgb&w="+width:base+"?auto=format&fit=crop&w="+width+"&q=85";
}
/**
 * Generated template images can carry the wrong niche. Only intentional edits,
 * customer uploads, or verified CRM photos may replace the family catalog.
 */
export function tp3TrustedBlockImage(site:BuilderV2SiteData,block:{src?:string;section?:string;userUploaded?:boolean}):boolean{
 return !!block.src?.trim() && (
  block.userUploaded===true ||
  site.crmImported===true ||
  site.sectionMediaManaged?.includes(block.section||"")===true
 );
}
export function tp3TrustedSectionImages(site:BuilderV2SiteData,section:RegExp):string[]{
 return site.blocks.filter(b=>b.type==="image"&&section.test(b.section||"")&&tp3TrustedBlockImage(site,b)).map(b=>b.src!);
}

const exampleReviews=[
 {name:"Mariana Costa",quote:"Uma experiência acolhedora, com sabores que tornam o encontro ainda mais especial.",avatar:"photo-1534528741775-53994a69daeb"},
 {name:"Rafael Almeida",quote:"Gostei da proposta e do cuidado com cada detalhe da apresentação.",avatar:"photo-1500648767791-00dcc994a43e"},
 {name:"Camila Ferreira",quote:"Um lugar que inspira bons momentos e vontade de voltar.",avatar:"photo-1524504388940-b1c1722653e1"},
 {name:"Lucas Martins",quote:"Uma seleção de especialidades que despertou minha curiosidade.",avatar:"photo-1506794778202-cad84cf45f1d"},
] as const;
export function TP3FamilyTestimonials({site,publishedMode=false,dark=false}:{site:BuilderV2SiteData;publishedMode?:boolean;dark?:boolean}){
 const real=site.blocks.filter(b=>b.type==="paragraph"&&/depoiment|testimonial|avalia[cç]/i.test(b.section||""))
  .map(b=>(b.text||"").split("|").map(x=>x.trim())).filter(parts=>parts.length>=3&&parts[0]&&parts[2])
  .slice(0,4).map((parts,i)=>({name:parts[0],quote:parts.slice(2).join(" "),avatar:exampleReviews[i].avatar,demo:false}));
 const entries=[...real];
 if(!publishedMode)for(let i=entries.length;i<4;i++)entries.push({...exampleReviews[i],demo:true});
 return <div data-tp3-family-reviews className="mt-9">
  {entries.some(e=>e.demo)&&<p className={"mb-6 max-w-4xl text-sm font-semibold leading-7 "+(dark?"text-[#f2d2ae]":"text-[#664632]")}>Depoimentos de demonstração: personagens e relatos fictícios, substituíveis por avaliações verdadeiras autorizadas antes da publicação.</p>}
  {entries.length?<div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
   {entries.map((entry,i)=><blockquote key={i+"-"+entry.name} className={"min-w-0 rounded-xl border p-5 "+(dark?"border-[#5f503f] bg-[#2b2a24] text-[#fcf5e8]":"border-[#dfcbb8] bg-[#fff9ee] text-[#30251b]")}>
    <div className="flex min-w-0 items-center gap-3">
     <img src={"https://images.unsplash.com/"+entry.avatar+"?auto=format&fit=crop&w=120&h=120&q=80"} loading="lazy" alt="Retrato ilustrativo, não é a pessoa que escreveu a avaliação" style={{width:48,height:48,minWidth:48,maxWidth:48,objectFit:"cover",borderRadius:"50%",flexShrink:0}}/>
     <div className="min-w-0"><strong className="block break-words text-sm">{entry.name}</strong><span className="block text-xs opacity-80">{entry.demo?"Exemplo fictício":"Foto ilustrativa"}</span></div>
    </div><p className="mt-5 break-words text-sm leading-7">“{entry.quote}”</p>
    {entry.demo&&<small className="mt-4 block text-xs font-semibold uppercase tracking-wide">Avaliação demonstrativa</small>}
   </blockquote>)}
  </div>:<p className="text-sm leading-7">Depoimentos reais aparecerão quando a empresa cadastrar avaliações autorizadas.</p>}
 </div>;
}
type Metric={value:number;label:string;suffix:string};
export function parseTP3FamilyMetrics(raw:readonly (string|undefined)[],publishedMode=false):{items:Metric[];demo:boolean}{
 const items=raw.flatMap(item=>{
  if(/valor\s+ilustrativo|exemplo|demonstrativ|fict[ií]ci|simulad/i.test(item||""))return [];
  const m=(item||"").trim().match(/^(\d+(?:[.,]\d+)?)\s*(\+|%|mil|k)?\s*(?:[|:—-]\s*|\s+)(.{3,90})$/i);
  if(!m)return [];
  const value=Number(m[1].replace(",","."));
  if(!Number.isFinite(value)||value<0||value>999999)return [];
  if(/categorias|etapas|perguntas|faq|conteúdo apresentado/i.test(m[3]))return [];
  return [{value,suffix:m[2]||"",label:m[3]}];
 }).slice(0,4);
 if(items.length)return {items,demo:false};
 if(publishedMode)return {items:[],demo:false};
 return {items:[
  {value:1200,suffix:"+",label:"Pedidos realizados · exemplo"},
  {value:98,suffix:"%",label:"Clientes satisfeitos · exemplo"},
  {value:15,suffix:"+",label:"Anos de tradição · exemplo"},
 ],demo:true};
}
export function TP3FamilyAnimatedNumbers({raw,publishedMode=false,dark=false}:{raw:readonly (string|undefined)[];publishedMode?:boolean;dark?:boolean}){
 const ref=useRef<HTMLDivElement>(null);
 const [progress,setProgress]=useState(0);
 const {items,demo}=parseTP3FamilyMetrics(raw,publishedMode);
 const key=items.map(v=>v.value+v.label).join("|");
 useEffect(()=>{
  const el=ref.current;
  if(!el)return;
  if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches||!("IntersectionObserver" in window)){setProgress(1);return;}
  let raf=0,started=false;
  const observer=new IntersectionObserver(entries=>{
   if(started||!entries.some(e=>e.isIntersecting))return;
   started=true;observer.disconnect();const start=performance.now();
   const step=(now:number)=>{
    const t=Math.min(1,(now-start)/1300);
    setProgress(1-Math.pow(1-t,3));
    if(t<1)raf=requestAnimationFrame(step);
   };
   raf=requestAnimationFrame(step);
  },{threshold:.1});
  observer.observe(el);
  return ()=>{observer.disconnect();cancelAnimationFrame(raf);};
 },[key]);
 return <div ref={ref} data-tp3-family-numbers className="mt-9">
  {demo&&<p className={"mb-6 max-w-4xl text-sm font-semibold leading-7 "+(dark?"text-[#fff4e4]":"text-[#2d2115]")}>Prévia demonstrativa: números fictícios usados somente para mostrar a animação. Substitua por indicadores reais antes de publicar.</p>}
  {items.length?<div className="grid gap-5 sm:grid-cols-3">{items.map((it,i)=><div key={i} className={"min-w-0 border-t-2 pt-5 "+(dark?"border-[#f2d2aa]":"border-[#62472b]")}>
   <strong className="block text-[clamp(2.6rem,5vw,5rem)] font-bold leading-none tabular-nums" aria-label={it.value+it.suffix}>{Math.round(progress*it.value).toLocaleString("pt-BR")}{it.suffix}</strong>
   <span className="mt-4 block text-sm font-semibold leading-6">{it.label}</span>
  </div>)}</div>:<p className="rounded-lg border border-current/30 p-6 text-sm leading-7">Cadastre indicadores reais para exibir números animados no site publicado.</p>}
 </div>;
}
export function TP3FamilyBakeryNumbers({raw,publishedMode=false,dark=false}:{raw:readonly (string|undefined)[];publishedMode?:boolean;dark?:boolean}){
 const valid=raw.filter(v=>!/valor\s+ilustrativo|exemplo|demonstrativ|fict[ií]ci|simulad/i.test(v||""));
 const {items}=parseTP3FamilyMetrics(valid,true);
 if(items.length)return <TP3FamilyAnimatedNumbers raw={valid} publishedMode={publishedMode} dark={dark}/>;
 const fields=[["Pães por dia","Produção a confirmar"],["Anos de história","Dados da empresa"],["Clientes atendidos","Informação verificada"]];
 return <div data-tp3-bakery-metrics="pending" className="mt-8">
  <p className={"mb-6 max-w-2xl text-sm leading-6 "+(dark?"text-[#f6ead6]":"text-[#493825]")}>{publishedMode?"Indicadores comerciais ainda não cadastrados.":"Prévia da seção: cadastre os números reais da padaria para ativar os contadores animados."}</p>
  <div className="grid gap-3 sm:grid-cols-3">{fields.map(([label,detail])=><div key={label} className="min-w-0 rounded-xl border border-current/25 bg-black/[.035] p-5 sm:p-6">
   <strong className="block text-[clamp(2.1rem,5vw,3.4rem)] leading-none">—</strong>
   <span className="mt-4 block text-sm font-bold leading-6">{label}</span>
   <small className="mt-1 block text-xs opacity-75">{detail}</small>
  </div>)}</div>
 </div>;
}
const faqDefaults:[string,string][]=[
 ["Como conhecer o cardápio?","Veja as especialidades desta página. Produtos e preços devem ser confirmados com o estabelecimento."],
 ["É possível fazer pedidos ou reservas?","Consulte os canais oficiais da empresa para confirmar disponibilidade e condições."],
 ["Existem opções vegetarianas?","Pergunte à equipe quais opções estão disponíveis no cardápio atualizado."],
 ["Como funcionam retirada e entrega?","As modalidades disponíveis devem ser confirmadas diretamente com a empresa."],
 ["Como informar alergias e restrições alimentares?","Informe suas necessidades à equipe antes de escolher os produtos."],
 ["Quais são os horários de funcionamento?","Os horários oficiais serão informados após o cadastro pelo estabelecimento."],
];
export function TP3FamilyFAQ({site,dark=false}:{site:BuilderV2SiteData;dark?:boolean}){
 const items=universalFaqItems(site.blocks,faqDefaults);
 return <section data-universal-section="faq" id="faq" data-tp3-family-faq className={"px-6 py-16 md:px-[7%] md:py-24 "+(dark?"bg-[#1b221d] text-[#fff4e9]":"bg-[#faf5ec] text-[#30261c]")}>
  <div className="mx-auto max-w-6xl"><span className="text-xs font-bold uppercase tracking-[.18em] text-[#b88b55]">Perguntas frequentes</span><h2 className="mt-5 font-serif text-[clamp(2.2rem,5vw,4rem)] leading-tight">Antes de fazer seu pedido.</h2>
   <div className="mt-10 grid gap-3">{items.map(([q,a],i)=><details key={i} className={"group rounded-lg border p-5 "+(dark?"border-[#495048]":"border-[#dfd1bf]")}>
    <summary className="cursor-pointer text-base font-semibold leading-7">{q}</summary><p className={"mt-3 text-sm leading-7 "+(dark?"text-[#e1d8ca]":"text-[#665446]")}>{a}</p>
   </details>)}</div>
  </div>
 </section>;
}
export function TP3FamilyLocation({site,publishedMode=false,dark=false}:{site:BuilderV2SiteData;publishedMode?:boolean;dark?:boolean}){
 const address=site.extras?.address?.trim()||site.footer?.address?.trim()||"";
 const number=(site.restaurant?.whatsapp||site.footer?.whatsapp||"").replace(/\D/g,"");
 const whatsapp=number.length>=10&&number.length<=13?"https://wa.me/"+(number.startsWith("55")?number:"55"+number):"";
 return <section data-universal-section="localizacao" id="localizacao" data-tp3-family-location className={"px-6 py-16 md:px-[7%] md:py-24 "+(dark?"bg-[#1b211c] text-[#fff7e9]":"bg-[#f3e7d7] text-[#31271f]")}>
  <div className="mx-auto max-w-7xl"><span className="text-xs font-bold uppercase tracking-[.18em] text-[#b98f62]">Localização e contato</span><h2 className="mt-5 font-serif text-[clamp(2.2rem,5vw,4rem)] leading-tight">Venha viver esta experiência.</h2>
   <div className={"mt-8 grid gap-6 rounded-xl p-4 md:grid-cols-[1.4fr_.8fr] md:p-6 "+(dark?"bg-[#30342d]":"bg-[#fff9f0]")}>
    <div className="min-w-0 overflow-hidden rounded-lg">{address||!publishedMode?<iframe title={address?"Mapa do endereço oficial cadastrado":"Mapa demonstrativo de São Paulo"} src={"https://www.google.com/maps?q="+encodeURIComponent(address||"São Paulo, SP, Brasil")+"&output=embed"} loading="lazy" className="h-64 w-full border-0 md:h-80"/>:<div className="flex h-64 items-center justify-center p-7 text-center">Cadastre o endereço oficial para ativar o mapa.</div>}</div>
    <div className="flex min-w-0 flex-col justify-center gap-4">
     {!address&&!publishedMode&&<strong className="text-xs uppercase tracking-[.13em] text-[#b88c5d]">Endereço fictício — prévia demonstrativa</strong>}
     <address className="break-words text-sm not-italic font-semibold leading-7">{address||(!publishedMode?"Rua das Oliveiras, 120 — São Paulo/SP":"Endereço oficial ainda não cadastrado.")}</address>
     {whatsapp?<a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex justify-center rounded-full bg-[#bc5636] px-6 py-4 text-center text-sm font-semibold text-white">Falar no WhatsApp ↗</a>:!publishedMode?<><span aria-disabled="true" className="inline-flex justify-center rounded-full bg-[#cbc3b5] px-6 py-4 text-sm font-semibold text-[#665b50]">Falar no WhatsApp</span><small>Cadastre o número oficial para ativar o botão.</small></>:null}
    </div>
   </div>
  </div>
 </section>;
}
export function TP3FamilyFooter({site,publishedMode=false,variant=2}:{site:BuilderV2SiteData;publishedMode?:boolean;variant?:1|2|3}){
 const brand=site.header?.brand?.trim()||site.title||"Gastronomia";
 const phone=(site.restaurant?.whatsapp||site.footer?.whatsapp||"").replace(/\D/g,"");
 const whatsapp=phone.length>=10&&phone.length<=13?"https://wa.me/"+(phone.startsWith("55")?phone:"55"+phone):"";
 const links=[["Início","#inicio"],["Especialidades",variant===2?"#sabores":"#especialidades"],["Sobre","#historia"],["Galeria","#galeria"],["Depoimentos","#depoimentos"],["FAQ","#faq"],["Localização","#localizacao"]];
 return <footer data-universal-section="rodape" data-tp3-family-footer={variant} className="pn-tp3-footer bg-[#142019] px-6 pb-8 pt-16 text-[#fff9ed] md:px-[7%] md:pt-20">
  <div className="pn-tp3-footer-shell mx-auto max-w-7xl">
   <div className="pn-tp3-footer-grid grid min-w-0 gap-10 border-b border-white/20 pb-14 md:grid-cols-[minmax(0,1.4fr)_minmax(0,.7fr)_minmax(0,.9fr)]">
    <div className="min-w-0"><span className="text-xs font-bold uppercase tracking-[.15em] text-[#d7a875]">Feito com cuidado</span><h2 className="mt-5 max-w-lg font-serif text-[clamp(2rem,4vw,3.5rem)] leading-[1.1]">{brand}</h2><p className="mt-5 max-w-sm text-sm leading-7 text-[#d7d0c4]">Sabores, encontros e momentos especiais. Conheça nossas especialidades.</p></div>
    <div className="min-w-0"><h3 className="text-sm font-bold uppercase tracking-[.1em] text-[#e6ba89]">Navegação</h3><nav aria-label="Navegação do rodapé" className="mt-6 flex flex-col items-start gap-3 text-sm">{links.map(([label,href])=><a href={href} key={href} className="text-[#f8eee2] hover:underline">{label}</a>)}</nav></div>
    <div className="min-w-0"><h3 className="text-sm font-bold uppercase tracking-[.1em] text-[#e6ba89]">Contato</h3><p className="mt-6 break-words text-sm leading-7 text-[#e1d7ca]">{site.extras?.address||site.footer?.address||(!publishedMode?"Endereço fictício na prévia. Cadastre a localização oficial.":"Endereço ainda não informado.")}</p>{whatsapp?<a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-full bg-[#cf9f68] px-5 py-3 text-sm font-bold text-[#161e17]">Falar no WhatsApp ↗</a>:!publishedMode?<p className="mt-5 text-xs leading-6 text-[#d7d0c4]">Cadastre o WhatsApp oficial para ativar o contato.</p>:null}</div>
   </div>
   <div className="flex flex-col gap-2 pt-7 text-xs text-[#d7d0c4] md:flex-row md:justify-between"><span>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</span><a href="#inicio" className="text-[#e6ba89]">Voltar ao início ↑</a></div>
  </div>
 </footer>;
}
export function TP3FamilyModel1Extras({site,publishedMode=false,category}:{site:BuilderV2SiteData;publishedMode?:boolean;category:TP3FoodCategory}){
 const metrics=site.blocks.filter(b=>b.type==="paragraph"&&/n[uú]meros|indicadores|resultados/i.test(b.section||"")).map(b=>b.text);
 const diff=category==="Pizzaria"?["Massa preparada com atenção","Ingredientes selecionados","Preparo em forno a lenha","Receitas com personalidade"]:category==="Padaria"?["Fermentação natural","Pães e folhados artesanais","Ingredientes selecionados","Forno e preparo cuidadoso"]:["Seleção cuidadosa","Atenção aos detalhes","Sabores para descobrir","Experiência acolhedora"];
 const steps=category==="Pizzaria"?[["01","Preparação","Conheça a proposta de massas artesanais."],["02","Fermentação","Descubra o tempo e o cuidado do processo."],["03","Forno","A etapa em que a pizza ganha seu sabor."]]:category==="Padaria"?[["01","A massa","Escolha de ingredientes e preparo artesanal."],["02","O tempo","Fermentação natural para desenvolver sabor e textura."],["03","O forno","Crosta dourada e folhados assados com cuidado."]]:[["01","Descubra","Explore as especialidades."],["02","Escolha","Veja as opções apresentadas."],["03","Entre em contato","Confirme disponibilidade com a equipe."]];
 return <>
 <section data-universal-section="diferenciais" className="bg-[#f6eee3] px-6 py-16 text-[#30251e] md:px-[7%] md:py-24"><div className="mx-auto max-w-7xl"><span className="text-xs font-bold uppercase tracking-[.18em] text-[#ac7947]">Nossos diferenciais</span><h2 className="mt-5 font-serif text-[clamp(2.3rem,5vw,4.5rem)]">O cuidado faz parte do sabor.</h2><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{diff.map((d,i)=><div key={d} className="rounded-lg border border-[#d4bfaa] p-6"><span className="text-xs text-[#aa7651]">0{i+1}</span><h3 className="mt-5 text-lg font-semibold">{d}</h3></div>)}</div></div></section>
 <section data-universal-section="processo" className="bg-[#211d19] px-6 py-16 text-[#fdf4e9] md:px-[7%] md:py-24"><div className="mx-auto max-w-7xl"><span className="text-xs font-bold uppercase tracking-[.18em] text-[#e3ad78]">Nosso processo</span><h2 className="mt-5 font-serif text-[clamp(2.3rem,5vw,4.5rem)]">Da escolha ao primeiro pedaço.</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{steps.map(([number,title,desc],i)=><article key={number} className="min-w-0"><img src={category==="Pizzaria"&&i===1?"https://images.pexels.com/photos/35760003/pexels-photo-35760003.jpeg?auto=compress&cs=tinysrgb&w=1200":tp3FamilyInternetPhoto(category,1,12+i)} className="aspect-[5/4] w-full rounded-lg object-cover" alt={"Fotografia de "+title.toLowerCase()} loading="lazy" onError={e=>{const img=e.currentTarget;const attempts=Number(img.dataset.tp3FallbackAttempt||0);if(attempts===0){img.dataset.tp3FallbackAttempt="1";img.src=category==="Pizzaria"&&i===1?"https://images.pexels.com/photos/33593107/pexels-photo-33593107.jpeg?auto=compress&cs=tinysrgb&w=1200":tp3FamilyInternetPhoto(category,1,0);}else if(attempts===1){img.dataset.tp3FallbackAttempt="2";img.src=tp3FamilyInternetPhoto(category,1,12);}else{img.style.visibility="hidden";}}}/><span className="mt-5 block text-xs text-[#e8b882]">{number}</span><h3 className="mt-2 font-serif text-2xl">{title}</h3><p className="mt-2 text-sm leading-7 text-[#e1d3c2]">{desc}</p></article>)}</div></div></section>
 <section data-universal-section="numeros" className="bg-[#d4aa72] px-6 py-16 text-[#261d15] md:px-[7%] md:py-24"><div className="mx-auto max-w-7xl"><span className="text-xs font-bold uppercase tracking-[.18em]">Nossos números</span><h2 className="mt-5 font-serif text-[clamp(2.3rem,5vw,4.5rem)]">Resultados em destaque.</h2>{category==="Padaria"?<TP3FamilyBakeryNumbers raw={metrics} publishedMode={publishedMode}/>:<TP3FamilyAnimatedNumbers raw={metrics} publishedMode={publishedMode}/>} </div></section>
 <section id="depoimentos" data-universal-section="depoimentos" className="bg-[#f6eee3] px-6 py-16 text-[#30251e] md:px-[7%] md:py-24"><div className="mx-auto max-w-7xl"><span className="text-xs font-bold uppercase tracking-[.18em] text-[#ac7947]">Depoimentos</span><h2 className="mt-5 font-serif text-[clamp(2.3rem,5vw,4.5rem)]">Experiências compartilhadas.</h2><TP3FamilyTestimonials site={site} publishedMode={publishedMode}/></div></section>
 <TP3FamilyFAQ site={site}/>
 <TP3FamilyLocation site={site} publishedMode={publishedMode}/>
 <TP3FamilyFooter site={site} publishedMode={publishedMode} variant={1}/>
 </>;
}
