"use client";
import {useEffect,useId,useRef,useState} from "react";
import type {BuilderV2SiteData} from "./builder-v2-site";
import {universalBlockProps,universalFaqItems,UniversalTypographyRules} from "./builder-v2-universal-bindings";
import {UniversalTemplateSections} from "./builder-v2-universal-sections";
import {japaneseModel1Brand,japaneseModel1Photo} from "@/lib/tp3-japanese-model1";

const specialties = [
  {name:"Sushi e nigiri",detail:"Combinações clássicas com apresentação delicada."},
  {name:"Sashimi",detail:"Cortes e sabores para apreciar em cada detalhe."},
  {name:"Combinados",detail:"Seleções para diferentes momentos à mesa."},
  {name:"Pratos quentes",detail:"Outras expressões da culinária japonesa."},
] as const;

const fallbackFaq = [
  ["Como posso consultar o cardápio?","As opções apresentadas são exemplos do segmento. Entre em contato para consultar o cardápio atualizado da empresa."],
  ["Há opções vegetarianas?","A disponibilidade e os ingredientes precisam ser confirmados diretamente com a equipe."],
  ["É possível fazer pedidos para retirada ou entrega?","Consulte diretamente o estabelecimento sobre atendimento, retirada e entrega."],
  ["Como posso fazer uma reserva?","Entre em contato com a equipe para verificar se há reservas e a disponibilidade desejada."],
  ["Quais são os horários de funcionamento?","Os horários oficiais devem ser informados pelo estabelecimento. Confirme antes de visitar."],
  ["Como informar restrições alimentares?","Avise a equipe antes de pedir e confirme ingredientes, alergênicos e possíveis riscos de contato cruzado."],
] as const;

const examples = [
  {name:"Mariana Costa",quote:"Os sabores e a apresentação dos pratos criam uma experiência que vale a pena compartilhar.",avatar:"photo-1534528741775-53994a69daeb"},
  {name:"Rafael Almeida",quote:"Gostei do cuidado com os detalhes e da proposta de uma experiência japonesa acolhedora.",avatar:"photo-1500648767791-00dcc994a43e"},
  {name:"Camila Ferreira",quote:"O ambiente e os combinados deixaram nosso encontro ainda mais especial.",avatar:"photo-1524504388940-b1c1722653e1"},
  {name:"Lucas Martins",quote:"Uma boa seleção de sabores para quem aprecia culinária japonesa.",avatar:"photo-1506794778202-cad84cf45f1d"},
] as const;

const normalize = (text:string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const isGeneric = (text:string) => /delicias da comida japonesa|gastronomia|autenticidade e sabor|experiencias para saborear/i.test(normalize(text));
const getBlocks = (site:BuilderV2SiteData, pattern:RegExp) => site.blocks.filter(b=>pattern.test(b.section||""));
const getCopy = (site:BuilderV2SiteData,pattern:RegExp,type:"heading"|"paragraph",fallback:string) =>
  getBlocks(site,pattern).find(b=>b.type===type&&b.text?.trim())?.text?.trim()||fallback;
const getPhoto = (site:BuilderV2SiteData, pattern:RegExp,slot:number,customIndex=0) => {
  // Owner media / imported CRM photos always outrank curated examples, without
  // repeating the first custom image across every specialty card.
  const owned=getBlocks(site,pattern).filter(b=>b.type==="image"&&b.src?.trim()&&(b.userUploaded===true||site.crmImported===true));
  return owned[customIndex]?.src||japaneseModel1Photo(slot);
};
function JapaneseImage({src,alt,backup,style=""}:{src:string;alt:string;backup:string;style?:string}){
  return <img src={src} alt={alt} loading="lazy" className={"block h-full w-full object-cover "+style}
    onError={e=>{const el=e.currentTarget;if(el.src!==backup){el.src=backup;}else{el.onerror=null;}}}/>;
}
export function BuilderV2TP3JapaneseModel1({site,publishedMode=false}:{site:BuilderV2SiteData;publishedMode?:boolean}){
  const brandData=japaneseModel1Brand(site.title||"",site.header?.brand,publishedMode);
  const brand=brandData.brand;
  const hero=getBlocks(site,/^(?:inicio|hero|home|principal|capa)$/i);
  const heroTitleBlock=hero.find(b=>b.type==="heading");
  const heroDescriptionBlock=hero.find(b=>b.type==="paragraph");
  const heroButton=hero.find(b=>b.type==="button");
  const originalHero=heroTitleBlock?.text?.trim()||"";
  const heroTitle=!originalHero||isGeneric(originalHero)?"A arte do Japão em cada sabor.":originalHero;
  const heroSubtitle=heroDescriptionBlock?.text?.trim()||"Descubra uma seleção de preparos, aromas e detalhes da culinária japonesa.";
  const rawPhone=site.restaurant?.whatsapp?.trim()||site.footer?.whatsapp?.trim()||"";
  const phone=rawPhone.replace(/\D/g,"");
  const whatsapp=phone.length>=10&&phone.length<=13?"https://wa.me/"+(phone.startsWith("55")?phone:"55"+phone):"";
  const address=site.extras?.address?.trim()||site.footer?.address?.trim()||"";
  const displayAddress=address||(!publishedMode?"Rua das Cerejeiras, 120 — Bairro Sakura, São Paulo/SP":"");
  const [openFaq,setOpenFaq]=useState<number|null>(0);
  const [menuOpen,setMenuOpen]=useState(false);
  const menuId=useId();
  const menuRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!menuOpen)return;
    const closeOutside=(event:PointerEvent)=>{
      if(menuRef.current&&!menuRef.current.contains(event.target as Node))setMenuOpen(false);
    };
    const closeEscape=(event:KeyboardEvent)=>{
      if(event.key==="Escape")setMenuOpen(false);
    };
    document.addEventListener("pointerdown",closeOutside);
    document.addEventListener("keydown",closeEscape);
    return ()=>{
      document.removeEventListener("pointerdown",closeOutside);
      document.removeEventListener("keydown",closeEscape);
    };
  },[menuOpen]);
  const menuLinks=[
    {label:"Início",href:"#inicio"},
    {label:"Especialidades",href:"#especialidades"},
    {label:"Nossa essência",href:"#sobre"},
    {label:"Depoimentos",href:"#depoimentos"},
    {label:"Perguntas frequentes",href:"#faq"},
    {label:"Localização",href:"#localizacao"},
  ];
  const originalReviews=getBlocks(site,/depoiment|testimonial|avalia[cç]/i)
    .filter(b=>b.type==="paragraph"&&b.text?.trim())
    .map(b=>(b.text||"").split("|").map(s=>s.trim()))
    .filter(parts=>parts.length>=3&&parts[0]&&parts.slice(2).some(Boolean))
    .slice(0,4);
  const reviews=originalReviews.map((r,i)=>({
    name:r[0],quote:r.slice(2).join(" "),avatar:examples[i%4].avatar,demo:false,
  }));
  if(!publishedMode){
    for(let i=reviews.length;i<4;i++)reviews.push({
      name:examples[i].name,quote:examples[i].quote,avatar:examples[i].avatar,demo:true,
    });
  }
  const faq=universalFaqItems(site.blocks,fallbackFaq);
  const galleryCustom=getBlocks(site,/galeria|fotos|momentos/i)
    .filter(b=>b.type==="image"&&b.src&&(b.userUploaded===true||site.crmImported===true))
    .map(b=>b.src!).slice(0,4);

  return <main data-tp3-model="01" data-tp3-japanese="true" className="w-full overflow-hidden bg-[#f8f4ec] text-[#23241f]">
    <UniversalTypographyRules/>
    <UniversalTemplateSections site={site}>
    <header data-japanese-header="compact" className="sticky top-0 z-30 border-b border-[#d4cbbd] bg-[#f8f4ec]/95 backdrop-blur">
      <div ref={menuRef} className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-10 md:py-5">
        <a href="#inicio" onClick={()=>setMenuOpen(false)} className="flex min-w-0 flex-1 items-center gap-3 font-serif text-[clamp(1.2rem,3vw,1.85rem)] font-semibold leading-tight tracking-[-.025em] text-[#28251f]">
          <span className="shrink-0 text-[#a14b3e]" aria-hidden="true">◈</span>
          <span className="min-w-0 break-words">{brand}</span>
        </a>
        <button type="button" aria-label={menuOpen?"Fechar menu de navegação":"Abrir menu de navegação"}
          aria-controls={menuId} aria-expanded={menuOpen} onClick={()=>setMenuOpen(open=>!open)}
          className="inline-flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-[5px] rounded-xl border border-[#a99b89] bg-[#fffaf2] text-[#292821] shadow-sm transition-colors hover:bg-[#eadfcd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a14b3e]">
          <span aria-hidden="true" className={`block h-[2px] w-5 rounded-full bg-current transition-transform ${menuOpen?"translate-y-[7px] rotate-45":""}`}/>
          <span aria-hidden="true" className={`block h-[2px] w-5 rounded-full bg-current transition-opacity ${menuOpen?"opacity-0":""}`}/>
          <span aria-hidden="true" className={`block h-[2px] w-5 rounded-full bg-current transition-transform ${menuOpen?"-translate-y-[7px] -rotate-45":""}`}/>
        </button>
        {menuOpen&&<nav id={menuId} aria-label="Menu principal do restaurante"
          className="absolute right-5 top-[calc(100%+1px)] z-50 w-[min(21rem,calc(100vw-2rem))] max-w-full rounded-b-2xl border border-t-0 border-[#d4cbbd] bg-[#fffaf2] p-3 shadow-[0_24px_45px_rgba(28,34,29,0.18)] md:right-10">
          <div className="flex flex-col gap-1">
            {menuLinks.map(link=><a key={link.href} href={link.href} onClick={()=>setMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-semibold text-[#292821] transition-colors hover:bg-[#ecdfcd] focus-visible:bg-[#ecdfcd]">{link.label}</a>)}
          </div>
          {whatsapp&&<a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={()=>setMenuOpen(false)}
            className="mt-3 flex items-center justify-center rounded-full bg-[#245137] px-5 py-3 text-sm font-bold text-white">Falar no WhatsApp ↗</a>}
        </nav>}
      </div>
    </header>

    <section id="inicio" data-universal-section="inicio" className="grid min-h-[590px] bg-[#20251f] text-[#fffaf0] md:grid-cols-[1fr_1.05fr]">
      <div className="order-2 flex flex-col justify-center px-6 py-16 md:order-1 md:px-[12%] md:py-20">
        <span className="text-xs font-bold uppercase tracking-[.23em] text-[#e0b993]">Tradição japonesa · gastronomia contemporânea</span>
        <h1 {...universalBlockProps(heroTitleBlock)} className="mt-7 max-w-2xl font-serif text-[clamp(2.8rem,7.5vw,6.2rem)] leading-[1.06] tracking-[-.04em]">{heroTitle}</h1>
        <p {...universalBlockProps(heroDescriptionBlock)} className="mt-7 max-w-lg text-base leading-8 text-[#e7dfcf]">{heroSubtitle}</p>
        <a href={heroButton?.href||"#especialidades"} {...universalBlockProps(heroButton,true)} className="mt-9 inline-flex w-fit max-w-full rounded-full bg-[#eac69e] px-7 py-4 text-center text-sm font-bold text-[#26241f]">{heroButton?.text||"Conheça nossas especialidades"} ↗</a>
        {brandData.demo&&<p className="mt-5 text-xs text-[#dfd0bd]">Marca ilustrativa de demonstração. Personalize no editor antes de publicar.</p>}
      </div>
      <div className="order-1 h-[360px] min-w-0 md:order-2 md:h-full md:min-h-[590px]">
        <JapaneseImage src={getPhoto(site,/^(?:inicio|hero|home|principal|capa)$/i,0)} alt="Seleção de sushi da culinária japonesa" backup={japaneseModel1Photo(1)}/>
      </div>
    </section>

    <section id="especialidades" data-universal-section="especialidades" className="mx-auto max-w-7xl px-6 py-16 md:px-[7%] md:py-24">
      <span className="text-xs font-bold uppercase tracking-[.2em] text-[#946747]">A essência de cada preparo</span>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-5"><h2 className="max-w-2xl font-serif text-[clamp(2.3rem,5vw,4.5rem)] leading-tight">{getCopy(site,/especialidad|cardapio|cardápio|produtos|menu/i,"heading","Sabores que contam histórias.")}</h2>
        <p className="max-w-sm text-sm leading-7 text-[#655d53]">Uma viagem visual por ingredientes e preparos japoneses. Consulte o cardápio real com a equipe.</p></div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {specialties.map((item,i)=><article key={item.name} className="min-w-0"><div className="aspect-[4/5] overflow-hidden rounded-lg bg-[#e8dfd5]">
          <JapaneseImage src={getPhoto(site,/especialidad|cardapio|cardápio|produtos|menu/i,i+1,i)} alt={item.name+" — referência de comida japonesa"} backup={japaneseModel1Photo(i+6)}/>
        </div><h3 className="mt-5 font-serif text-2xl">{item.name}</h3><p className="mt-2 text-sm leading-7 text-[#6b645a]">{item.detail}</p></article>)}
      </div>
    </section>

    <section id="diferenciais" data-universal-section="diferenciais" className="bg-[#eae0d1] px-6 py-16 md:px-[7%] md:py-20">
      <div className="mx-auto max-w-7xl"><span className="text-xs font-bold uppercase tracking-[.2em] text-[#91664b]">Um convite a descobrir</span>
        <h2 className="mt-5 max-w-3xl font-serif text-[clamp(2.2rem,4.5vw,4.3rem)] leading-tight">Detalhes que valorizam o momento.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">{[
          ["01","Cuidado no preparo","Cada etapa valoriza apresentação, equilíbrio e atenção aos detalhes."],
          ["02","Sabores para explorar","Sushi, sashimi e outros preparos como inspiração para o cardápio."],
          ["03","A experiência à mesa","Uma proposta de encontro em torno da culinária japonesa."],
        ].map(([n,title,body])=><article key={n} className="border-t border-[#9f8972] py-6"><span className="text-xs text-[#98613f]">{n}</span><h3 className="mt-4 font-serif text-2xl">{title}</h3><p className="mt-3 text-sm leading-7 text-[#655a4e]">{body}</p></article>)}</div>
      </div>
    </section>

    <section id="sobre" data-universal-section="sobre" className="grid bg-[#f4eee4] md:grid-cols-2">
      <div className="h-[330px] md:h-[560px]"><JapaneseImage src={getPhoto(site,/hist[oó]ria|ess[eê]ncia|sobre/i,5)} alt="Preparo e apresentação da culinária japonesa" backup={japaneseModel1Photo(7)}/></div>
      <div className="flex flex-col justify-center px-6 py-14 md:px-[12%]"><span className="text-xs font-bold uppercase tracking-[.23em] text-[#a06346]">Nossa essência</span>
        <h2 className="mt-5 font-serif text-[clamp(2.3rem,5vw,4.5rem)] leading-tight">{getCopy(site,/hist[oó]ria|ess[eê]ncia|sobre/i,"heading","O respeito por cada detalhe.")}</h2>
        <p className="mt-6 max-w-xl text-base leading-8 text-[#5c554c]">{getCopy(site,/hist[oó]ria|ess[eê]ncia|sobre/i,"paragraph","Mais do que um prato, a culinária japonesa reúne técnica, apresentação e momentos de descoberta. Conheça nossas inspirações e consulte as opções disponíveis.")}</p>
      </div>
    </section>

    <section id="galeria" data-universal-section="galeria" className="mx-auto max-w-7xl px-6 py-16 md:px-[7%] md:py-24">
      <span className="text-xs font-bold uppercase tracking-[.2em] text-[#9d6748]">Galeria de sabores</span>
      <h2 className="mt-4 font-serif text-[clamp(2.2rem,5vw,4.5rem)] leading-tight">A beleza está nos detalhes.</h2>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {[7,8,9,10].map((n,i)=><figure key={n} className="aspect-[3/4] overflow-hidden rounded-lg bg-[#eee7dc]">
          <JapaneseImage src={galleryCustom[i]||japaneseModel1Photo(n)} alt={"Galeria ilustrativa de culinária japonesa "+(i+1)} backup={japaneseModel1Photo(i+2)}/>
        </figure>)}
      </div>
    </section>

    <section id="processo" data-universal-section="processo" className="bg-[#242a23] px-6 py-16 text-[#fdf7ee] md:px-[7%] md:py-24">
      <div className="mx-auto max-w-7xl"><span className="text-xs font-bold uppercase tracking-[.23em] text-[#e0b993]">Da escolha à experiência</span>
        <h2 className="mt-5 font-serif text-[clamp(2.3rem,5vw,4.5rem)]">Seu próximo momento começa aqui.</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">{[
          ["01","Descubra","Explore as opções e conheça a proposta do restaurante."],
          ["02","Escolha","Consulte ingredientes, combinações e disponibilidade."],
          ["03","Entre em contato","Confirme pedidos, reservas e horários com a equipe."],
        ].map(([n,title,body])=><article key={n} className="border-t border-[#d7bb92]/40 pt-6"><span className="text-xs font-bold text-[#e0b993]">{n}</span>
          <h3 className="mt-5 font-serif text-2xl">{title}</h3><p className="mt-3 text-sm leading-7 text-[#d9d1c4]">{body}</p></article>)}</div>
      </div>
    </section>

    <section id="depoimentos" data-universal-section="depoimentos" className="bg-[#f1e6d7] px-6 py-16 md:px-[7%] md:py-24">
      <div className="mx-auto max-w-7xl"><span className="text-xs font-bold uppercase tracking-[.2em] text-[#8f634a]">Vozes à mesa</span>
        <h2 className="mt-5 font-serif text-[clamp(2.3rem,5vw,4.5rem)]">Experiências compartilhadas.</h2>
        {reviews.some(r=>r.demo)&&<p className="mt-5 max-w-3xl text-sm leading-7 text-[#64564a]"><strong>Depoimentos demonstrativos:</strong> os nomes, retratos e relatos são fictícios. Substitua por avaliações reais autorizadas antes da publicação.</p>}
        {reviews.length?<div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{reviews.map((review,i)=><blockquote key={i+"-"+review.name} className="min-w-0 rounded-xl border border-[#dbccb9] bg-[#fffaf4] p-5">
          <div className="flex items-center gap-3"><img src={"https://images.unsplash.com/"+review.avatar+"?auto=format&fit=crop&w=160&h=160&q=80"} alt="Retrato ilustrativo; não identifica o autor da avaliação" loading="lazy" className="h-12 w-12 shrink-0 rounded-full object-cover"/>
            <div className="min-w-0"><strong className="block break-words text-sm">{review.name}</strong><span className="text-xs text-[#897466]">{review.demo?"Exemplo fictício":"Foto ilustrativa"}</span></div>
          </div><p className="mt-5 break-words text-sm leading-7 text-[#5b5149]">“{review.quote}”</p>
          {review.demo&&<span className="mt-5 block text-[10px] font-bold uppercase tracking-[.13em] text-[#9a6f53]">Avaliação de demonstração</span>}
        </blockquote>)}</div>:<p className="mt-7 text-sm leading-7 text-[#64564a]">Depoimentos reais serão apresentados quando cadastrados e autorizados pela empresa.</p>}
      </div>
    </section>

    <section id="faq" data-universal-section="faq" className="bg-[#fcf9f3] px-6 py-16 md:px-[7%] md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[.8fr_1.2fr] md:gap-16"><div><span className="text-xs font-bold uppercase tracking-[.2em] text-[#9b684a]">Antes de vir</span>
        <h2 className="mt-5 font-serif text-[clamp(2.3rem,5vw,4.5rem)] leading-tight">Perguntas frequentes.</h2>
        <p className="mt-5 text-sm leading-7 text-[#675d51]">Informações práticas para conhecer melhor a experiência. Consulte sempre os dados oficiais do estabelecimento.</p></div>
        <div className="divide-y divide-[#d8c9b7]">{faq.map(([question,answer],i)=><div key={i} className="py-5">
          <button type="button" aria-expanded={openFaq===i} onClick={()=>setOpenFaq(openFaq===i?null:i)} className="flex w-full items-start justify-between gap-4 text-left text-base font-semibold"><span>{question}</span><span aria-hidden="true">{openFaq===i?"−":"+"}</span></button>
          {openFaq===i&&<p className="mt-4 max-w-xl text-sm leading-7 text-[#665b4e]">{answer}</p>}
        </div>)}</div>
      </div>
    </section>

    <section id="localizacao" data-universal-section="localizacao" className="bg-[#e8d9c6] px-6 py-16 md:px-[7%] md:py-24">
      <div className="mx-auto max-w-7xl"><span className="text-xs font-bold uppercase tracking-[.2em] text-[#8d6448]">Onde estamos</span>
        <h2 className="mt-5 font-serif text-[clamp(2.3rem,5vw,4.5rem)]">Seu encontro com o Japão.</h2>
        <div className="mt-9 overflow-hidden rounded-xl bg-[#fcfaf5] p-4 md:p-7">
          {displayAddress?<><iframe title={address?"Mapa do endereço informado pelo estabelecimento":"Mapa ilustrativo de São Paulo; não representa localização da empresa"} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-64 w-full rounded-lg border-0 md:h-80" src={"https://www.google.com/maps?q="+encodeURIComponent(address||"São Paulo, SP, Brasil")+"&output=embed"}/>
            <div className="mt-6">{!address&&<p className="text-xs font-bold uppercase tracking-[.12em] text-[#9c664c]">Endereço fictício — prévia demonstrativa. O mapa mostra apenas a cidade.</p>}
              <address className="mt-3 text-base font-semibold not-italic leading-7 text-[#2d281f]">{displayAddress}</address>
              {!address&&<p className="mt-2 text-xs text-[#75665b]">Cadastre um endereço real antes de publicar; nenhum endereço inventado será exibido no site publicado.</p>}</div>
          </>:<p className="rounded-lg bg-[#f4eade] px-6 py-10 text-sm text-[#64584d]">Endereço ainda não cadastrado. Adicione a localização verdadeira no editor para ativar o mapa.</p>}
          <div className="mt-7">{whatsapp?<a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-13 w-full items-center justify-center rounded-full bg-[#214f36] px-7 py-4 text-center text-sm font-bold text-white sm:w-auto">Falar no WhatsApp ↗</a>:<><span className="inline-flex min-h-13 w-full cursor-not-allowed items-center justify-center rounded-full bg-[#ccc6ba] px-7 py-4 text-center text-sm font-bold text-[#5d564b] sm:w-auto" aria-disabled="true">Falar no WhatsApp</span><p className="mt-2 text-xs text-[#6d6154]">Cadastre o número oficial para ativar o botão.</p></>}</div>
        </div>
      </div>
    </section>

    <footer id="rodape" data-universal-section="rodape" data-japanese-footer="premium"
      className="pn-japanese-footer bg-[#19241e] px-6 pb-8 pt-16 text-[#f8eee0] md:px-10 md:pt-20 lg:pt-24">
      <div className="pn-japanese-footer-shell mx-auto max-w-7xl">
        <div className="pn-japanese-footer-grid grid min-w-0 gap-12 border-b border-[#f8eee0]/20 pb-14 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,1fr)] md:gap-8 lg:gap-16 lg:pb-20">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-[.22em] text-[#d9b18a]">A experiência japonesa</span>
            <h2 className="mt-5 max-w-lg break-words font-serif text-[clamp(2rem,4vw,3.8rem)] leading-[1.12] tracking-[-.035em]">{brand}</h2>
            <p className="mt-5 max-w-md text-sm leading-8 text-[#d2c9bb]">Uma experiência inspirada na culinária japonesa, feita para valorizar os sabores, os detalhes e os encontros.</p>
            <a href="#inicio" className="mt-8 inline-flex items-center gap-2 border-b border-[#d7b693]/70 pb-1 text-sm font-semibold text-[#eac69e]">Voltar ao início <span aria-hidden="true">↗</span></a>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-[.16em] text-[#eac69e]">Explore</h3>
            <nav aria-label="Navegação do rodapé" className="mt-7 flex flex-col items-start gap-4 text-sm text-[#e9e0d2]">
              {menuLinks.map(link=><a key={link.href} href={link.href} className="transition-colors hover:text-[#eac69e]">{link.label}</a>)}
            </nav>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-[.16em] text-[#eac69e]">Contato e localização</h3>
            <p className="mt-7 text-sm leading-7 text-[#e9e0d2]">Conheça as opções de atendimento e entre em contato com a equipe.</p>
            {address?<address className="mt-5 break-words text-sm not-italic leading-7 text-[#f8eee0]">{address}</address>
              :!publishedMode?<div className="mt-5">
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#eac69e]">Endereço fictício — demonstração</span>
                <address className="mt-2 break-words text-sm not-italic leading-7 text-[#e9e0d2]">{displayAddress}</address>
              </div>:<p className="mt-5 text-sm leading-7 text-[#d2c9bb]">Localização disponível após cadastro do endereço oficial.</p>}
            {whatsapp?<a href={whatsapp} target="_blank" rel="noopener noreferrer"
              className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#eac69e] px-6 py-4 text-center text-sm font-bold text-[#20241e] transition-colors hover:bg-[#f5d9b9] sm:w-auto">Falar no WhatsApp ↗</a>
              :!publishedMode?<div className="mt-7"><span aria-disabled="true"
                className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full border border-white/25 px-6 py-4 text-center text-sm font-semibold text-[#d2c9bb] sm:w-auto">Falar no WhatsApp</span>
                <p className="mt-3 text-xs leading-6 text-[#c8b9a7]">Cadastre o número oficial para ativar o contato.</p>
              </div>:null}
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-7 text-xs leading-6 text-[#b9b6ac] md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</p>
          {brandData.demo&&<p>Marca ilustrativa de demonstração.</p>}
          <a href="#inicio" className="w-fit text-[#eac69e] hover:underline">Voltar ao topo ↑</a>
        </div>
      </div>
    </footer>
    </UniversalTemplateSections>
  </main>;
}
