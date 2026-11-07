"use client";
import {useEffect,useRef,useState} from "react";
import type {BuilderV2SiteData} from "./builder-v2-site";

/** This editorial override is scoped to the Food Truck niche, never other TP3 categories. */
export const isFoodTruck=(site:BuilderV2SiteData)=>/food[\s-]*truck|foodtruck/i.test(
  [site.niche,site.title,site.header?.brand].filter(Boolean).join(" ")
);
const us=(id:string)=>"https://images.unsplash.com/"+id+"?auto=format&fit=crop&w=1400&q=85";
const px=(id:number)=>"https://images.pexels.com/photos/"+id+"/pexels-photo-"+id+".jpeg?auto=compress&cs=tinysrgb&w=1400";
/** Unique per-slot photos from Unsplash and Pexels (different food/context, no looping within a model). */
const truckPhotos=[
 px(5920742), // real street-food truck vendor serving a burger
 px(5920632), // food truck opening for customers
 us("photo-1568901346375-23c9450c58cd"), // craft burger
 us("photo-1550547660-d9450f859349"), // gourmet burger
 us("photo-1573080496219-bb080dd4f877"), // fries
 us("photo-1513558161293-cdaf765edfd4"), // beverage
 us("photo-1571091718767-18b5b1457add"), // burger
 us("photo-1586190848861-99aa4a171e90"), // burger
 us("photo-1594212699903-ec8a3eca50f5"), // burger close-up
 us("photo-1561758033-d89a9ad46330"), // street food burger
 us("photo-1520072959219-c595dc870360"), // burger & street food
 us("photo-1551782450-a2132b4ba21d"), // burger
 px(31131430), // street-food vendor preparing burgers
 px(34766308), // customers paying at food truck
 px(5920741), // food truck handing a burger to customer
 px(32358127), // food truck at night
 us("photo-1572802419224-296b0aeee0d9"), // food closeup
 us("photo-1550317138-10000687a72b"), // burger
 px(17655293), // cook giving burger to customer
 us("photo-1555939594-58d7cb561ad1"), // grilled food
 us("photo-1547592180-85f173990554"), // prepared meal
 us("photo-1561758033-7e924f619b47"), // craft burger
 us("photo-1544025162-d76694265947"), // grill
 us("photo-1561758033-d89a9ad46330"), // fallback (slot outside used ranges)
];
export const truckPhoto=(slot:number)=>truckPhotos[Math.max(0,Math.min(slot,truckPhotos.length-1))];

/** Niche-specific, licensed Pexels photos verified by subject and place; M1 retains its existing photos. */
const brazilianTruckPhotos:Record<number,string>={
 2:px(40646659), // Brazilian food photographer: cheeseburger
 3:px(40646653), // Brazilian hamburger on cutting board
 5:px(6763221), // refreshing juice in a glass (not a hamburger)
 6:px(40646662), // Brazilian triple burger
 7:px(40646657), // Brazilian cheeseburger
 8:px(37245457), // patties on grill, Recife food photographer
 9:px(30461216), // São Paulo street-food snack
 10:px(40646780), // burger ingredients, Brazilian food photographer
 11:px(36554034), // cheeseburger and beverage, Recife photographer
 12:px(9897458), // Brazilian food truck in Porto de Galinhas
 13:px(30461216), // street food in São Paulo
 14:px(5920741), // handing a burger at food truck
 15:px(15211938), // Brazilian hamburger food stand
 16:px(40646657), // burger from a Brazilian photographer
 17:px(6763221), // fruit juice instead of an unrelated meal
 18:px(17655293), // food truck service
 19:px(37245457), // burger grill
 20:px(9897458), // Brazil food truck evening atmosphere
 21:px(36392071), // food truck in Rio de Janeiro
 22:px(40646662), // hamburger from a Brazilian photographer
 23:px(5920744), // friends eating at the food truck
};
export const truckPhotoBrazil=(slot:number)=>brazilianTruckPhotos[slot]||truckPhoto(slot);
export const truckBeverageFallback=()=>px(6414118); // distinct second verified juice photo
export const truckLabels=["Hambúrgueres artesanais","Combos e lanches","Porções e acompanhamentos","Bebidas e refrescos"];
export const truckFaq=[
 ["Como faço um pedido?","Confira as opções apresentadas e entre em contato pelo canal oficial da empresa. Valores, cardápio e disponibilidade devem ser confirmados antes de finalizar."],
 ["Onde o Food Truck fica estacionado?","A localização pode variar conforme eventos e datas. Consulte o endereço e confirme a localização atual antes de sair."],
 ["Quais são os horários de atendimento?","Os horários devem ser informados pela empresa. Verifique a programação e a disponibilidade antes de se deslocar."],
 ["Há opções para restrições alimentares?","Entre em contato com a equipe para consultar ingredientes, alergênicos e possíveis adaptações; não presuma ausência de contaminação cruzada."],
 ["O Food Truck atende eventos?","Consulte diretamente a empresa sobre eventos, condições, quantidade de pessoas, deslocamento e disponibilidade."],
 ["Quais são as formas de pagamento?","Consulte os meios de pagamento aceitos no dia e as condições de entrega ou retirada."]
] as const;
export const truckDemoReviews=[
 ["Fernanda Lima","Cliente ilustrativa","O hambúrguer chegou quentinho e o atendimento no balcão deixou a experiência ainda melhor.","photo-1534528741775-53994a69daeb"],
 ["Rafael Costa","Cliente ilustrativo","Gostei de poder escolher meu lanche e acompanhar o preparo. A proposta de comida de rua é muito convidativa.","photo-1500648767791-00dcc994a43e"],
 ["Camila Duarte","Cliente ilustrativa","As porções e os lanches combinam muito bem com um encontro informal com os amigos.","photo-1524504388940-b1c1722653e1"],
 ["Bruno Martins","Cliente ilustrativo","Um cardápio objetivo e um atendimento prático fazem diferença na hora de pedir.","photo-1506794778202-cad84cf45f1d"],
 ["Larissa Almeida","Cliente ilustrativa","O clima do food truck e a variedade de sabores tornam a parada especial.","photo-1544005313-94ddf0286df2"],
] as const;

export function FoodTruckFaq(){const [open,setOpen]=useState<number|null>(0);
 return <section data-universal-section="faq" id="faq" className="bg-[#f8f3ea] px-6 py-16 text-[#2c2118] md:px-[7%] md:py-24">
  <div className="mx-auto max-w-6xl"><p className="text-xs font-extrabold uppercase tracking-[.24em] text-[#a36c40]">Perguntas frequentes</p><h2 className="mt-4 font-serif text-[clamp(37px,5vw,64px)] leading-tight">Tudo sobre sua próxima <em>parada.</em></h2>
   <div className="mt-9 overflow-hidden rounded-2xl border border-[#ddcbb8] bg-[#fffbf4]">{truckFaq.map(([q,a],i)=><div key={q} className="border-b border-[#e8dbcd] last:border-0"><button type="button" aria-expanded={i===open} onClick={()=>setOpen(open===i?null:i)} className="flex w-full items-start gap-4 px-5 py-5 text-left text-[15px] font-semibold md:px-9 md:py-7 md:text-lg"><span className="pt-1 text-xs text-[#a36c40]">0{i+1}</span><span className="min-w-0 flex-1">{q}</span><span aria-hidden="true" className="text-xl">{i===open?"−":"+"}</span></button>{open===i&&<p className="px-5 pb-7 pl-12 text-sm leading-7 text-[#665c52] md:px-9 md:pl-16">{a}</p>}</div>)}</div>
  </div></section>;
}

function Count({value,label,suffix="",dark=false}:{value:number;label:string;suffix?:string;dark?:boolean}){
 const ref=useRef<HTMLDivElement>(null);
 const [shown,setShown]=useState(0);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if(reduced||typeof IntersectionObserver==="undefined"){setShown(value);return;}
  let raf=0,started=false;
  const io=new IntersectionObserver(([entry])=>{
   if(!entry.isIntersecting||started)return;
   started=true;const begin=performance.now();
   const draw=(now:number)=>{const p=Math.min((now-begin)/1350,1);setShown(Math.round(value*(1-Math.pow(1-p,3))));if(p<1)raf=requestAnimationFrame(draw);};
   raf=requestAnimationFrame(draw);io.disconnect();
  },{threshold:0.1});
  io.observe(el);
  return()=>{io.disconnect();cancelAnimationFrame(raf);};
 },[value]);
 return <div ref={ref} className="min-w-0 rounded-2xl border border-current/20 bg-white/10 px-5 py-8 text-center" style={{color:dark?"#fff9ef":"#211b15"}}>
  <strong className="block text-[clamp(42px,7vw,72px)] font-extrabold leading-none tabular-nums" style={{color:"inherit",fontSize:"clamp(42px,7vw,72px)"}}>{shown.toLocaleString("pt-BR")}{suffix}</strong>
  <span className="mt-4 block text-sm font-semibold leading-6" style={{color:"inherit"}}>{label}</span>
 </div>;
}
/** Published pages never show sample KPI values as business performance. */
export function FoodTruckNumbers({data=[],publishedMode=false,dark=false}:{data?:Array<string|undefined>;publishedMode?:boolean;dark?:boolean}){
 const parsed=data.flatMap(raw=>{
  const match=String(raw||"").match(/^\s*(\d[\d.,]*)\s*(\+|%)?\s*(?:[-–—|:]\s*|\s+)(.{3,})$/);
  if(!match)return [];
  const value=Number(match[1].replace(/\./g,"").replace(",","."));
  return Number.isFinite(value)&&value>=0&&value<=10000000?[{value:Math.round(value),suffix:match[2]||"",label:match[3].trim()}]:[];
 }).slice(0,3);
 const preview=!parsed.length&&!publishedMode;
 const examples=[{value:1200,suffix:"+",label:"Pedidos servidos"},{value:48,suffix:"+",label:"Eventos atendidos"},{value:98,suffix:"%",label:"Avaliação positiva"}];
 const items=parsed.length?parsed:preview?examples:[];
 const color=dark?"#fff8eb":"#2b2018";
 return <div className="mt-10 min-w-0" style={{color}}>
  {preview?<p className="mb-7 max-w-2xl text-sm leading-7" style={{color,opacity:.91}}><strong>Indicadores ilustrativos da prévia.</strong> Os valores abaixo são fictícios e servem apenas para demonstrar o formato dos contadores animados. Não representam resultados da empresa e não serão publicados sem dados reais.</p>:parsed.length?<p className="mb-7 max-w-2xl text-sm leading-7" style={{color,opacity:.87}}>Indicadores informados no editor, com animação ao rolar a página.</p>:<p className="mb-7 max-w-2xl text-sm leading-7" style={{color,opacity:.87}}>Indicadores de pedidos, eventos e satisfação serão apresentados aqui quando a empresa informar dados verificáveis.</p>}
  {items.length?<div className="grid min-w-0 gap-4 sm:grid-cols-3">{items.map((item,i)=><Count key={i+"-"+item.label} value={item.value} label={item.label} suffix={item.suffix} dark={dark}/>)}</div>:<div className="grid min-w-0 gap-4 sm:grid-cols-3">{["Pedidos atendidos","Eventos realizados","Satisfação dos clientes"].map(t=><div key={t} className="rounded-2xl border border-current/20 bg-white/10 px-5 py-8 text-center"><strong className="block text-5xl" style={{color}}>—</strong><span className="mt-4 block text-sm font-semibold" style={{color}}>{t}</span><span className="mt-2 block text-xs" style={{color,opacity:.7}}>Dado ainda não informado</span></div>)}</div>}
 </div>;
}
export function FoodTruckTestimonials({reviews=[],dark=false}:{reviews?:string[][];dark?:boolean}){
 const actual=reviews.filter(t=>t.length>=3&&t[0]?.trim()&&t[2]?.trim()).slice(0,5);
 const samples=actual.length>=5?[]:truckDemoReviews.slice(0,5-actual.length);
 const items=[
  ...actual.map((t,i)=>({name:t[0],role:t[1]||"Cliente",quote:t.slice(2).join(" "),photo:truckDemoReviews[i%5][3],demo:false})),
  ...samples.map(t=>({name:t[0],role:t[1],quote:t[2],photo:t[3],demo:true}))
 ];
 return <div className={"foodtruck-reviews min-w-0 "+(dark?"text-[#f9eee0]":"text-[#33271f]")}>
  {samples.length>0&&<p className="mb-7 max-w-3xl text-sm leading-7 opacity-80"><strong>Depoimentos demonstrativos:</strong> os nomes, fotos e relatos fictícios abaixo não representam clientes reais. Substitua-os por avaliações autorizadas.</p>}
  <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
   {items.map((t,i)=><blockquote key={i+"-"+t.name} className={"min-w-0 rounded-2xl border p-5 sm:p-6 "+(dark?"border-white/20 bg-white/5":"border-[#d9c8b4] bg-white/75")} style={{minWidth:0,maxWidth:"100%",overflow:"hidden",boxSizing:"border-box"}}>
    <div className="flex min-w-0 items-center gap-4" style={{display:"flex",alignItems:"center",minWidth:0,gap:14}}>
     <img src={us(t.photo)} alt={"Retrato ilustrativo de "+t.name} loading="lazy" className="rounded-full object-cover" style={{display:"block",width:56,height:56,minWidth:56,maxWidth:56,maxHeight:56,objectFit:"cover",aspectRatio:"1 / 1",flex:"0 0 56px",borderRadius:"50%"}}/>
     <div className="min-w-0 flex-1" style={{minWidth:0,flex:"1 1 auto",maxWidth:"calc(100% - 70px)"}}>
      <strong className="block text-base leading-6" style={{display:"block",fontSize:16,lineHeight:"24px",wordBreak:"normal",overflowWrap:"break-word",whiteSpace:"normal"}}>{t.name}</strong>
      <span className="mt-1 block text-xs leading-5 opacity-70" style={{display:"block",overflowWrap:"break-word",whiteSpace:"normal"}}>{t.demo?"Personagem fictício · foto ilustrativa":t.role+" · foto ilustrativa"}</span>
     </div>
    </div>
    <p className="mt-5 text-sm leading-7 opacity-90" style={{maxWidth:"100%",overflowWrap:"break-word",whiteSpace:"normal"}}>“{t.quote}”</p>
    {t.demo&&<span className="mt-5 inline-block text-[10px] font-bold uppercase tracking-[.14em] opacity-70">Exemplo fictício</span>}
   </blockquote>)}
  </div>
 </div>;
}
export function FoodTruckLocation({site,publishedMode=false}:{site:BuilderV2SiteData;publishedMode?:boolean}){
 const real=site.extras?.address?.trim()||site.footer?.address?.trim()||"";
 const shown=real||(!publishedMode?"Avenida Paulista, 1000 — Bela Vista, São Paulo/SP":"");
 const raw=(site.restaurant?.whatsapp||site.footer?.whatsapp||"").replace(/\D/g,"");
 const whatsapp=raw.length>=10?"https://wa.me/"+(raw.startsWith("55")?raw:"55"+raw):"";
 return <section id="localizacao" data-universal-section="localizacao" className="bg-[#f3e8d8] px-6 py-16 text-[#30251c] md:px-[7%] md:py-24"><div className="mx-auto max-w-6xl"><p className="text-xs font-extrabold uppercase tracking-[.23em] text-[#98683c]">Encontre nosso Food Truck</p><h2 className="mt-4 max-w-4xl font-serif text-[clamp(36px,6vw,72px)] leading-[1.06]">O próximo sabor está <em>no caminho.</em></h2><p className="mt-5 max-w-3xl text-sm leading-8 text-[#675748]">Confira a localização e confirme o endereço atual antes de visitar: food trucks podem mudar de ponto conforme a programação.</p>
 <div className="mt-9 rounded-2xl border border-[#d6bea0] bg-white p-5 shadow-sm md:p-8">{shown?<><iframe title={real?"Mapa do endereço informado pela empresa":"Mapa ilustrativo de localização fictícia"} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-64 w-full rounded-xl border-0 md:h-96" src={"https://www.google.com/maps?q="+encodeURIComponent(shown)+"&output=embed"}/><div className="mt-5">{!real&&<span className="text-xs font-bold uppercase tracking-[.14em] text-[#a5622b]">Endereço fictício · apenas prévia demonstrativa</span>}<address className="mt-2 text-base font-semibold not-italic leading-7">{shown}</address>{!real&&<p className="mt-1 text-xs text-[#786b5c]">Não é o endereço do Food Truck. Cadastre o endereço oficial antes de publicar.</p>}</div></>:<div className="rounded-xl bg-[#f5eee5] p-7 text-sm">Endereço ainda não cadastrado pela empresa. Inclua a localização real no editor para mostrar o mapa.</div>}
 <div className="mt-7">{whatsapp?<a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-[#25d366] px-8 py-4 text-center font-bold text-[#10291a] sm:w-auto">Falar no WhatsApp ↗</a>:<><span className="inline-flex min-h-14 w-full cursor-not-allowed items-center justify-center rounded-xl bg-[#dce5dc] px-8 py-4 text-center font-bold text-[#315544] sm:w-auto" aria-disabled="true">Falar no WhatsApp</span><p className="mt-3 text-xs text-[#7c6551]">Botão disponível quando um número de WhatsApp válido for cadastrado no editor.</p></>}</div></div></div></section>;
}
export function FoodTruckPremiumFooter({brand,variant=1,channel}:{brand:string;variant?:1|2|3;channel?:string}){
 return <footer data-universal-section="rodape" className={variant===2?"bg-[#101914] text-[#fff8e9]":variant===3?"bg-[#10130f] text-[#fff8e9]":"bg-[#241911] text-[#fff6ea]"}><div className="mx-auto max-w-7xl px-6 pb-8 pt-16 md:px-[7%] md:pt-24"><div className="grid gap-10 border-b border-white/20 pb-14 md:grid-cols-[1.2fr_.8fr]"><div><span className="text-xs font-bold uppercase tracking-[.24em] text-[#e0ad6f]">Food Truck · sabor de rua</span><h2 className="mt-6 max-w-3xl font-serif text-[clamp(39px,6.6vw,86px)] leading-[1.03] tracking-[-.04em]">Seu próximo favorito <em className="text-[#e0ad6f]">está a caminho.</em></h2><p className="mt-7 max-w-lg text-sm leading-7 text-white/70">Sabores, encontros e experiências sobre rodas. Consulte o cardápio, a localização e as condições de atendimento pelos canais oficiais.</p>{channel&&<a href={channel} target={channel.startsWith("http")?"_blank":undefined} rel="noopener noreferrer" className="mt-7 inline-flex rounded-full border border-[#e0ad6f] px-6 py-4 text-sm font-bold text-[#e0ad6f]">Entre em contato ↗</a>}</div><div className="grid content-start gap-4"><strong className="text-xs tracking-[.2em] text-[#e0ad6f]">EXPLORE</strong>{[["Início","#inicio"],["Especialidades","#especialidades"],["Galeria","#galeria"],["Depoimentos","#depoimentos"],["Perguntas frequentes","#faq"],["Localização","#localizacao"]].map(([t,h])=><a key={h} href={h} className="text-sm text-white/75 hover:text-white">{t} ↗</a>)}</div></div><a href="#inicio" className="mt-7 inline-block text-xs font-bold uppercase tracking-[.15em] text-[#e0ad6f]">Voltar ao topo ↑</a><strong className="mt-10 block max-w-full break-words font-serif text-[clamp(29px,6vw,76px)] font-bold leading-tight">{brand}</strong><div className="mt-8 flex flex-wrap justify-between gap-4 border-t border-white/20 pt-5 text-xs text-white/60"><span>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</span><span>Food Truck Gourmet · experiências ilustrativas</span></div></div></footer>;
}
export function FoodTruckExtraModel1(){return <><section data-universal-section="processo" className="bg-[#2c2119] px-6 py-16 text-[#fff6ea] md:px-[7%] md:py-24"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#e0ad6f]">Da escolha ao primeiro pedaço</p><h2 className="mt-5 font-serif text-[clamp(35px,5vw,64px)]">O caminho até seu <em>pedido.</em></h2><div className="mt-10 grid gap-5 md:grid-cols-3">{[["01","Explore os sabores","Veja as especialidades disponíveis e consulte o cardápio atualizado."],["02","Escolha seu favorito","Confirme opções, ingredientes, preços e disponibilidade com a equipe."],["03","Combine a retirada","Verifique localização, horário de atendimento e condições do pedido."]].map(([n,t,d])=><article key={n} className="rounded-xl border border-[#d5b48c]/30 p-6"><span className="text-xs text-[#e0ad6f]">{n}</span><h3 className="mt-5 text-xl font-semibold">{t}</h3><p className="mt-4 text-sm leading-7 text-white/70">{d}</p></article>)}</div></div></section></>;}
