"use client";
import {useEffect,useRef,useState,type MouseEvent,type ReactNode} from "react";
import {attachSiteMotion} from "@/lib/site-builder-animation";
import {SiteWhatsAppButton} from "@/components/site-whatsapp-button";
import type {SiteMotion} from "@/lib/site-builder-animation";
type Block = { id: string; type: "heading" | "paragraph" | "button" | "image"; text: string; color: string; align: "left" | "center" | "right"; src?: string; mobileSrc?: string; section?: string; fontSize?: number; radius?: number; spacing?: number; href?: string; layout?: "hero" | "grid" | "split" | "banner" | "faq" | "gallery" | "standard"; background?: string; columns?: number };
type MenuItem = {id:string;name:string;description:string;price:number;category:string;image?:string};
type RestaurantData = {whatsapp:string;menu:MenuItem[]};
type Site = { realEstateWhatsapp?:string; kind?:SiteCategory; restaurant?:RestaurantData; restaurantContent?:{menuTitle?:string;menuSubtitle?:string;footerTitle?:string;footerCentered?:boolean;footerSpacious?:boolean}; templateId?: "institutional-complete" | "minimalist-sophisticated" | "modern-impactful" | "image-text-alternating"; title: string; background: string; blocks: Block[]; id?: string; niche?: string; publishedUrl?: string; heroPresentation?: "immersive" | "split"; processImageCard?: boolean; processImageCardTitle?: string; processImageCardDescription?: string; motion?: SiteMotion; footer?: { cnpj?: string; address?: string; email?: string; instagram?: string; facebook?: string; youtube?: string; whatsapp?: string; showMenu?: boolean } };
type SiteCategory = "institutional" | "restaurant" | "real-estate" | "catalog";

function useRestaurantMotion(motion:SiteMotion|undefined){
  const ref=useRef<HTMLElement>(null);
  useEffect(()=>{
    const root=ref.current;
    if(!root)return;
    const marked:HTMLElement[]=[];
    const selectors="header, footer, [id^='cardapio'], h1, h2, h3, h4, p, img, a, button, article, svg, .grid > div";
    root.querySelectorAll<HTMLElement>(selectors).forEach((element,index)=>{
      if(element.closest("[hidden]")||element.closest("button svg")||element.closest("a svg"))return;
      if(element.matches("svg")&&!element.closest("footer"))return;
      if(element.matches("header,footer")||element.querySelector("h1,h2,h3,h4,article"))return;
      element.setAttribute("data-pn-motion-auto","");
      element.setAttribute("data-block-id","restaurant-motion-"+index);
      marked.push(element);
    });
    const cleanup=attachSiteMotion(root,motion);
    return ()=>{cleanup();marked.forEach(element=>{element.removeAttribute("data-pn-motion-auto");element.removeAttribute("data-block-id");});};
  },[motion]);
  return ref;
}
function RestaurantFooterSocials({footer,whatsapp}:{footer?:Site["footer"];whatsapp?:string}) {
  const icons:Record<string,ReactNode>={
    Instagram:<><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></>,
    Facebook:<path d="M14 21v-8h3l.5-4H14V7c0-1.1.4-2 2-2h2V1.5A23 23 0 0 0 15 1c-3.2 0-5 1.9-5 5.3V9H7v4h3v8z"/>,
    YouTube:<><rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/></>,
    WhatsApp:<><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.5-4.7a8.5 8.5 0 1 1 16-4.1Z"/><path d="M9 8.5c.3-.5.6-.5.9-.1l1 1.5c.2.3.1.6-.2.9l-.5.5c.8 1.4 1.9 2.4 3.3 3l.6-.6c.3-.3.6-.3.9-.1l1.5.9c.4.3.3.7-.1 1.1-.8.8-1.7.8-2.7.4-2.7-1.1-4.9-3.2-6-5.8-.3-.8-.1-1.4.4-1.7Z"/></>
  };
  const profiles=[
    {name:"Instagram",url:footer?.instagram},
    {name:"Facebook",url:footer?.facebook},
    {name:"YouTube",url:footer?.youtube},
    {name:"WhatsApp",url:footer?.whatsapp||whatsapp},
  ];
  const hrefFor=(name:string,value?:string)=>{
    const raw=(value||"").trim();
    if(!raw)return "";
    if(name==="WhatsApp"){const digits=raw.replace(/\D/g,"");return digits.length>=10&&digits.length<=15?"https://wa.me/"+digits:raw.startsWith("https://wa.me/")?raw:"";}
    if(/^https:\/\//i.test(raw))return raw;
    if(name==="Instagram"&&/^@?[a-zA-Z0-9._]+$/.test(raw))return "https://www.instagram.com/"+raw.replace(/^@/,"")+"/";
    if(name==="Facebook"&&/^[a-zA-Z0-9.]+$/.test(raw))return "https://www.facebook.com/"+raw;
    return "";
  };
  return <div className="mt-7 flex flex-wrap items-center justify-center gap-3" aria-label="Redes sociais">{profiles.map(profile=>{
    const href=hrefFor(profile.name,profile.url);
    const cls="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20";
    const icon=<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[profile.name]}</svg>;
    return href?<a key={profile.name} href={href} aria-label={profile.name} target="_blank" rel="noopener noreferrer" className={cls}>{icon}</a>:<span key={profile.name} role="img" aria-label={profile.name+" — não configurado"} title={profile.name+": configure pelo chat"} className={cls+" opacity-45"}>{icon}</span>;
  })}</div>;
}
export function RestaurantSegmentTemplate({site,segment}:{site:Site;segment:string}) {
  const [activeCategory,setActiveCategory]=useState("Todos");
  const normalized=segment.toLocaleLowerCase("pt-BR");
  const config=/hamburg/.test(normalized)?{name:"Hamburgueria",eyebrow:"BURGERS & SABOR",headline:"O hambúrguer que transforma sua fome em vontade de repetir.",description:"Hambúrgueres suculentos, ingredientes frescos e combinações irresistíveis.",photo:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=85",badge:"🍔 Feito na chapa",accent:"#e9b64c",dark:"#19251e"}:/cafeteria|padaria/.test(normalized)?{name:"Cafeteria e Padaria",eyebrow:"CAFÉ & AFETO",headline:"Um momento especial a cada xícara.",description:"Cafés, pães e delícias preparadas para tornar seu dia melhor.",photo:"https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=85",badge:"☕ Pausa deliciosa",accent:"#b88762",dark:"#31241f"}:/aça|a[cç]ai|sorvet/.test(normalized)?{name:"Açaí e Sorveteria",eyebrow:"FRESCOR & SABOR",headline:"Seu momento favorito tem mais sabor.",description:"Açaís, sorvetes e combinações para refrescar o seu dia.",photo:"https://images.unsplash.com/photo-1493857671505-72967e2e2760?auto=format&fit=crop&w=1400&q=85",badge:"🍧 Escolha seu favorito",accent:"#d8a2dc",dark:"#31203b"}:/marmit/.test(normalized)?{name:"Marmitaria",eyebrow:"COMIDA DE VERDADE",headline:"O sabor de casa, onde você estiver.",description:"Refeições frescas, caprichadas e prontas para o seu dia.",photo:"https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=85",badge:"🍱 Feito com carinho",accent:"#d4ac64",dark:"#26342a"}:/restaurante/.test(normalized)?{name:"Restaurante",eyebrow:"COZINHA & EXPERIÊNCIA",headline:"Sabores que merecem ser compartilhados.",description:"Pratos especiais, ingredientes selecionados e uma experiência à mesa.",photo:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85",badge:"🍽️ Uma experiência completa",accent:"#d9b77d",dark:"#24312b"}:{name:segment||"Delivery",eyebrow:"SABOR & PRATICIDADE",headline:"O melhor do seu cardápio, a um clique.",description:"Descubra nossos produtos e faça seu pedido com facilidade.",photo:"https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1400&q=85",badge:"✦ Feito para você",accent:"#c8e69d",dark:"#26332b"};
  const menu=site.restaurant?.menu||[];
  const menuGroup=menuCategory;
  const categories=Array.from(new Set(menu.map(menuGroup)));
  const filtered=activeCategory==="Todos"?menu:menu.filter(item=>menuGroup(item)===activeCategory);
  const whatsapp=(site.restaurant?.whatsapp||"").replace(/\\D/g,"");
  const motionRef=useRestaurantMotion(site.motion);
  return <section ref={motionRef} className="overflow-hidden rounded-[26px] bg-[#f9f7f1] text-[#222a24]" aria-label={`Prévia de ${config.name}`}>
    <header className="flex items-center justify-between gap-4 px-6 py-5 text-white sm:px-10" style={{background:config.dark}}><strong className="text-lg font-black uppercase tracking-wider">{site.title&&site.title!=="Novo projeto"?site.title:config.eyebrow}</strong><a href="#cardapio-segmento-v2" onClick={event=>scrollToSiteSection(event,"cardapio-segmento-v2")} className="rounded-full border border-white/40 px-4 py-2 text-xs font-bold">Ver cardápio ↓</a></header>
    <div className="relative isolate flex min-h-[580px] items-center overflow-hidden px-6 py-16 sm:min-h-[660px] sm:px-10 lg:py-24" style={{background:config.dark,color:"#fff"}}><img src={config.photo} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover" loading="eager"/><div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/70 to-black/40"/><div className="relative z-10 max-w-2xl"><p className="text-xs font-black uppercase tracking-[.24em]" style={{color:config.accent}}>{config.name} · Delivery</p><h2 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">{config.headline}</h2><p className="mt-5 max-w-lg text-base leading-relaxed text-white/75">{config.description}</p><a href="#cardapio-segmento-v2" onClick={event=>scrollToSiteSection(event,"cardapio-segmento-v2")} className="mt-8 inline-flex rounded-full px-7 py-4 text-sm font-black text-[#172018]" style={{background:config.accent}}>Explorar cardápio →</a></div></div>
    <div className="px-6 py-5 text-center text-sm font-bold" style={{background:config.accent}}>{config.badge} · Ingredientes selecionados · Peça pelo WhatsApp</div>
    <div id="cardapio-segmento-v2" className="px-6 py-12 sm:px-10"><p className="text-xs font-black uppercase tracking-[.2em]">Escolha seu favorito</p><h3 className="mt-3 text-4xl font-black">Nosso cardápio</h3><p className="mt-3 text-sm text-[#667067]">Os itens e preços vêm do cadastro de produtos deste projeto.</p><div className="mt-6 flex flex-wrap gap-2">{["Todos",...categories].map(category=><button type="button" key={category} onClick={()=>setActiveCategory(category)} className={`rounded-full px-4 py-2 text-sm font-bold ${activeCategory===category?"bg-[#26382e] text-white":"border border-[#cdd4ca] bg-white"}`}>{category}</button>)}</div>{filtered.length===0?<div className="mt-8 rounded-2xl border border-dashed border-[#cdd4ca] bg-white p-8 text-center"><h4 className="text-xl font-bold">Seu cardápio começa aqui</h4><p className="mt-2 text-sm text-[#667067]">Cadastre seus produtos acima para vê-los automaticamente neste site.</p></div>:<div className="mt-8 grid gap-4 sm:grid-cols-2">{filtered.map(item=><article key={item.id} className="flex flex-col rounded-2xl bg-white p-5 shadow-sm"><span className="text-xs font-bold uppercase text-[#66806c]">{item.category||"Cardápio"}</span><h4 className="mt-3 text-xl font-black">{item.name}</h4>{item.description&&<p className="mt-2 text-sm text-[#667067]">{item.description}</p>}<div className="mt-auto flex items-center justify-between gap-3 pt-5"><strong className="text-xl">{item.price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</strong>{whatsapp&&item.name&&item.price>0&&<a target="_blank" rel="noopener noreferrer" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Olá! Gostaria de pedir "+item.name+".")}`} className="rounded-full bg-[#26382e] px-4 py-3 text-xs font-bold text-white">Pedir agora ↗</a>}</div></article>)}</div>}</div>
    <footer className="px-6 py-10 text-center text-white" style={{background:config.dark}}><h3 className="text-3xl font-black">Bateu a fome?</h3><p className="mt-3 text-white/75">{whatsapp?"Escolha seu favorito e faça o pedido pelo WhatsApp.":"Cadastre seu WhatsApp para habilitar os pedidos."}</p>{whatsapp&&<a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-full px-6 py-3 font-bold text-[#172018]" style={{background:config.accent}}>Pedir pelo WhatsApp ↗</a>}<RestaurantFooterSocials footer={site.footer} whatsapp={whatsapp}/></footer><SiteWhatsAppButton numberOrUrl={whatsapp} preview message="Olá! Vim pelo cardápio e gostaria de fazer um pedido." />
  </section>;
}
const pizzaIngredients:Record<string,string>={
 "mussarela":"Molho de tomate, mussarela, tomate e orégano.",
 "calabresa":"Molho de tomate, mussarela, calabresa fatiada, cebola e orégano.",
 "portuguesa":"Molho de tomate, mussarela, presunto, ovos, cebola, ervilha, azeitonas e orégano.",
 "frango com catupiry":"Molho de tomate, mussarela, frango desfiado, requeijão tipo Catupiry e orégano.",
 "quatro queijos":"Molho de tomate, mussarela, provolone, parmesão e gorgonzola.",
 "marguerita":"Molho de tomate, mussarela, tomate, manjericão e orégano.",
 "pepperoni":"Molho de tomate, mussarela, pepperoni e orégano.",
 "bacon":"Molho de tomate, mussarela, bacon crocante e orégano.",
 "napolitana":"Molho de tomate, mussarela, tomate, parmesão e orégano.",
 "moda da casa":"Molho de tomate, mussarela, presunto, calabresa, bacon, cebola e orégano.",
 "chocolate":"Chocolate ao leite e granulado.",
 "brigadeiro":"Chocolate, brigadeiro cremoso e granulado.",
 "romeu e julieta":"Mussarela e goiabada.",
 "banana com canela":"Banana, açúcar e canela.",
 "carne seca":"Carne seca desfiada, Catupiry, cebola-roxa e mussarela.",
 "vegetariana":"Mussarela, brócolis, palmito, milho, tomate e azeitonas.",
 "atum":"Atum, mussarela, cebola e azeitonas.",
 "brocolis com bacon":"Brócolis, bacon, mussarela e alho.",
 "especial da casa":"Mussarela, pepperoni, bacon, Catupiry e parmesão.",
 "morango com chocolate":"Chocolate ao leite, morangos frescos e leite condensado."};
export function cleanMenuName(name:string){return name.replace(/^\s*\d+[.)]\s*/,"").trim();}
export function menuCategory(item:MenuItem){const category=(item.category||"").trim();if(category&&category.toLocaleLowerCase("pt-BR")!=="cardápio")return category;return /chocolate|brigadeiro|romeu|julieta|banana|doce|nutella|morango|prestígio|beijinho/i.test(item.name)?"Pizzas doces":"Pizzas salgadas";}
function pizzaDescription(name:string){const key=cleanMenuName(name).toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();return pizzaIngredients[key]||"";}
// Navigate within the correct document, including the isolated desktop/mobile preview.
function scrollToSiteSection(event:MouseEvent<HTMLAnchorElement>,sectionId:string){
  const target=event.currentTarget.ownerDocument.getElementById(sectionId);
  if(!target)return;
  event.preventDefault();
  // scrollIntoView alone can move the outer Builder rather than the
  // embedded preview. Scroll the target's own document instead.
  const doc=event.currentTarget.ownerDocument;
  const viewport=doc.scrollingElement||doc.documentElement;
  const offset=target.getBoundingClientRect().top+viewport.scrollTop;
  viewport.scrollTo({top:offset,behavior:"smooth"});
  if(typeof doc.defaultView?.history?.replaceState==="function")doc.defaultView.history.replaceState(null,"","#"+sectionId);
}
export function PizzeriaTemplate({site,segment}:{site:Site;segment:string}) {
  const [activeCategory,setActiveCategory]=useState("Todos");
  const menu=site.restaurant?.menu||[];
  const categories=Array.from(new Set(menu.map(menuCategory)));
  const filtered=activeCategory==="Todos"?menu:menu.filter(item=>menuCategory(item)===activeCategory);
  const whatsapp=(site.restaurant?.whatsapp||"").replace(/\\D/g,"");
  const orderLink=(name:string,price:number)=>`https://wa.me/${whatsapp}?text=${encodeURIComponent("Olá! Gostaria de pedir "+name+" ("+price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+").")}`;
  const motionRef=useRestaurantMotion(site.motion);
  return <section ref={motionRef} className="overflow-hidden rounded-[26px] border border-[#f2d6ad]/20 bg-[#fff8ed] text-[#2a2019] shadow-2xl" aria-label="Prévia do template 01 de pizzaria">
    <header className="flex flex-wrap items-center justify-between gap-3 bg-[#231910] px-5 py-5 text-[#fff8e9] sm:px-9"><div><span className="text-xs font-black tracking-[.25em] text-[#f0a84a]">FORNO & SABOR</span><p className="mt-1 text-lg font-black">{site.title&&site.title!=="Novo projeto"?site.title:<>PIZZARIA <span className="text-[#f4a83b]">ARTESANAL</span></>}</p></div><a href="#cardapio-pizzaria-v2" onClick={event=>scrollToSiteSection(event,"cardapio-pizzaria-v2")} className="rounded-full border border-[#f4a83b]/60 px-5 py-2 text-xs font-bold text-[#ffd69d]">Ver cardápio ↓</a></header>
    <div className="relative isolate flex min-h-[600px] items-center overflow-hidden bg-[#251810] px-6 py-16 text-[#fff9ed] sm:min-h-[690px] sm:px-12 sm:py-24"><img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=85" alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover" loading="eager"/><div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1c1008]/90 via-[#1c1008]/75 to-[#1c1008]/40"/><div className="relative z-10 max-w-2xl"><p className="mb-5 text-xs font-black uppercase tracking-[.28em] text-[#f8b557]">Receitas artesanais · Sabor de verdade</p><h2 className="text-5xl font-black leading-[1.04] tracking-tight sm:text-7xl">O sabor que <span className="text-[#f4a83b]">reúne</span> todo mundo.</h2><p className="mt-6 max-w-lg text-base leading-relaxed text-[#fff0dd]">Massa dourada, ingredientes selecionados e aquele momento especial em cada fatia.</p><a href="#cardapio-pizzaria-v2" onClick={event=>scrollToSiteSection(event,"cardapio-pizzaria-v2")} className="mt-8 inline-flex rounded-full bg-[#f4a83b] px-7 py-4 text-sm font-black text-[#28180c]">Explorar nosso cardápio →</a></div></div>
    <div className="grid grid-cols-3 bg-[#f4a83b] px-3 py-6 text-center font-black uppercase text-[#35200e] sm:px-6"><div className="flex min-w-0 flex-col items-center gap-2 px-1 text-[10px] leading-tight sm:text-sm"><span className="text-xl">🍕</span><span>Sabor artesanal</span></div><div className="flex min-w-0 flex-col items-center gap-2 border-l border-[#35200e]/20 px-1 text-[10px] leading-tight sm:text-sm"><span className="text-xl">✦</span><span>Ingredientes especiais</span></div><div className="flex min-w-0 flex-col items-center gap-2 border-l border-[#35200e]/20 px-1 text-[10px] leading-tight sm:text-sm"><span className="text-xl">♥</span><span>Feito com carinho</span></div></div>
    <div id="cardapio-pizzaria-v2" className="px-5 py-12 sm:px-10 sm:py-16"><p className="text-xs font-black uppercase tracking-[.25em] text-[#ad5726]">Escolha seu favorito</p><h3 className="mt-3 text-4xl font-black sm:text-5xl">{site.restaurantContent?.menuTitle||"Nosso cardápio"}<span className="text-[#c9682b]">.</span></h3><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#766354]">{site.restaurantContent?.menuSubtitle||"Confira os sabores e faça seu pedido. Os itens e preços vêm diretamente do cadastro de produtos."}</p><div className="mt-7 flex flex-wrap gap-2">{["Todos",...categories].map(category=><button type="button" key={category} onClick={()=>setActiveCategory(category)} className={"rounded-full px-4 py-2 text-sm font-bold "+(activeCategory===category?"bg-[#2b1c12] text-white":"border border-[#dbc7ae] bg-white text-[#644932]")}>{category}</button>)}</div>{filtered.length===0?<div className="mt-8 rounded-2xl border border-dashed border-[#d3bca0] bg-white/60 p-8 text-center"><p className="text-xl font-bold">Seu cardápio começa aqui</p><p className="mt-2 text-sm text-[#806c5a]">Adicione produtos na seção de cadastro acima. Eles aparecerão automaticamente neste template.</p></div>:<div className="mt-8 grid gap-4 sm:grid-cols-2">{filtered.map(item=><article key={item.id} className="flex flex-col rounded-2xl border border-[#eadbc6] bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-[#bc6b34]">{menuCategory(item)}</p><h4 className="mt-3 text-xl font-black">{cleanMenuName(item.name)||"Novo item"}</h4>{(item.description||pizzaDescription(item.name))&&<p className="mt-2 text-sm leading-relaxed text-[#756557]">{item.description||pizzaDescription(item.name)}</p>}<div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5"><strong className="text-2xl text-[#a64c1d]">{item.price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</strong>{whatsapp&&item.name&&item.price>0&&<a target="_blank" rel="noopener noreferrer" href={orderLink(item.name,item.price)} className="rounded-full bg-[#2d5d3b] px-4 py-3 text-xs font-black text-white">Pedir agora ↗</a>}</div></article>)}</div>}</div>
    <footer className={"bg-[#231910] px-6 text-[#fff8e9] "+(site.restaurantContent?.footerCentered===false?"text-left":"text-center")+(site.restaurantContent?.footerSpacious?" py-16":" py-10")}><p className="text-xs font-black tracking-[.25em] text-[#f0a84a]">UMA EXPERIÊNCIA EM CADA FATIA</p><h3 className={"text-3xl font-black "+(site.restaurantContent?.footerSpacious?"mt-7":"mt-3")}>{site.restaurantContent?.footerTitle||"Bateu a fome?"}</h3><p className={"text-sm text-[#d9c1a7] "+(site.restaurantContent?.footerSpacious?"mt-6":"mt-2")}>{whatsapp?"Escolha seu sabor e faça seu pedido pelo WhatsApp.":"Cadastre um WhatsApp para habilitar os botões de pedido."}</p>{whatsapp&&<a target="_blank" rel="noopener noreferrer" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Olá! Gostaria de fazer um pedido.")}`} className="mt-6 inline-flex rounded-full bg-[#f4a83b] px-7 py-3 text-sm font-black text-[#28180c]">Pedir pelo WhatsApp ↗</a>}<RestaurantFooterSocials footer={site.footer} whatsapp={whatsapp}/></footer><SiteWhatsAppButton numberOrUrl={whatsapp} preview message="Olá! Gostaria de fazer um pedido de pizza." />
  </section>;
}
