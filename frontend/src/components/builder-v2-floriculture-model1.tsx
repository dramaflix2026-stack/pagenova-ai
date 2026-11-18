"use client";
import React,{useEffect,useState} from "react";
import type {TP6RetailVisualEdits} from "@/lib/builder-v2-tp6-edit-bridge";
import {TP6RetailCustomSections,type TP6RetailReview} from "./builder-v2-tp6-premium-shared";
import "./builder-v2-floriculture-model1.css";

/** User-approved editorial rebuild, exclusively TP6 Floricultura Model 01. */
type Props={brand:string;headline?:string;description?:string;images:string[];edits?:TP6RetailVisualEdits;reviews?:TP6RetailReview[];whatsapp?:string;email?:string;address?:string;heroImage?:string;headlineBlockId?:string;sectionBackgroundOverride?:string;heroPhotoOverride?:string};
const photosFallback=[
 "https://images.unsplash.com/photo-1561848355-890d054dc55a?auto=format&fit=crop&w=1600&q=85",
 "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?auto=format&fit=crop&w=1600&q=85",
 "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1600&q=85"
];
const portraits=[
 "1544005313-94ddf0286df2","1534528741775-53994a69daeb","1500648767791-00dcc994a43e",
 "1548142813-c348350df52b","1506794778202-cad84cf45f1d","1524504388940-b1c1722653e1"
].map(id=>"https://images.unsplash.com/photo-"+id+"?auto=format&fit=crop&w=160&h=160&q=80");
const examples=[
 ["Mariana Oliveira","Buquê de aniversário","As flores combinaram com a delicadeza que imaginei para um presente especial. A composição ficou linda."],
 ["Carolina Mendes","Arranjo personalizado","Combinar cores e texturas trouxe um encanto especial para a celebração."],
 ["Rafael Almeida","Flores para celebrações","Um arranjo pensado para a ocasião deixou o ambiente acolhedor e memorável."],
 ["Fernanda Costa","Decoração floral","A paleta suave e os detalhes artesanais deram personalidade à decoração."],
 ["Lucas Ferreira","Presente romântico","Um buquê feito com atenção a cada detalhe torna o gesto ainda mais especial."],
 ["Juliana Santos","Flores por assinatura","Um pequeno ritual com flores frescas pode transformar a atmosfera de casa."]
] as const;
const collections=[
 ["Buquês autorais","Criações delicadas para presentear e celebrar."],
 ["Arranjos exclusivos","Composições com cores, volumes e personalidade."],
 ["Flores por assinatura","Um ritual de beleza para seus espaços."]
] as const;
const steps=[
 ["Escolha suas flores","Explore as coleções e encontre o estilo ideal para sua ocasião."],
 ["Personalize o arranjo","Conte suas preferências de cores, flores e mensagem."],
 ["Preparamos com cuidado","Composições montadas artesanalmente, com atenção aos detalhes."],
 ["Combine a entrega","Consulte disponibilidade e opções com a equipe do atelier."]
] as const;
const faqs=[
 ["Como encomendar um buquê personalizado?","Descreva a ocasião e suas preferências no formulário. Um canal real de atendimento precisa estar cadastrado."],
 ["Vocês atendem casamentos e eventos?","Solicite informações sobre eventos e casamentos, conforme a agenda e a disponibilidade."],
 ["Quais flores estão disponíveis?","A seleção varia conforme a estação e os fornecedores. Consulte a disponibilidade antes da encomenda."],
 ["Como funciona a entrega de flores?","Regiões, prazos e valores de entrega são confirmados pelos canais oficiais."],
 ["Posso incluir um cartão com mensagem?","Informe sua mensagem e consulte as opções de personalização do atelier."],
 ["Como cuidar das flores depois de recebê-las?","Evite sol direto e calor excessivo, renove a água e cuide das hastes conforme a orientação da equipe."]
] as const;
const galleryNames=["Detalhes que encantam","Flores de estação","Composições autorais","Texturas naturais","Celebrações especiais","Beleza no cotidiano"];
const safePhoto=(src:unknown)=>typeof src==="string"&&/^https:\/\/(?:images\.unsplash\.com|[\w.-]+\.supabase\.co|[\w.-]+\.cloudinary\.com)\//i.test(src);
const validEmail=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v.length<=254;

export function TP6FloricultureModel1({brand,headline,description,images,edits,reviews=[],whatsapp,email,address,heroImage,headlineBlockId,sectionBackgroundOverride,heroPhotoOverride}:Props){
 const [menuOpen,setMenuOpen]=useState(false);
 const [faqOpen,setFaqOpen]=useState<number|null>(0);
 const [lightbox,setLightbox]=useState<number|null>(null);
 const [name,setName]=useState(""),[telephone,setTelephone]=useState(""),[occasion,setOccasion]=useState(""),[message,setMessage]=useState("");
 const bank=images.filter(safePhoto);
 const photo=(i:number)=>bank.length?bank[i%bank.length]:photosFallback[i%photosFallback.length];
 const brandName=brand.trim()||"Jardim de Âmbar — Atelier Floral";
 const brandShort=brandName.split(/\s+[—–-]\s+/)[0];
 const heroTitle=headline?.trim()||"Flores que transformam momentos em memórias";
 const heroCopy=description?.trim()||"Buquês autorais, arranjos personalizados e experiências florais criadas com afeto.";
 const mainPhoto=safePhoto(heroPhotoOverride)?heroPhotoOverride!:safePhoto(heroImage)?heroImage!:photo(2);
 const whats=(whatsapp||"").replace(/\D/g,""),hasWhats=whats.length>=10&&whats.length<=15;
 const mail=email?.trim()||"",hasMail=validEmail(mail),canContact=hasWhats||hasMail;
 const color=sectionBackgroundOverride&&/^#[a-f\d]{6}$/i.test(sectionBackgroundOverride)?sectionBackgroundOverride:edits?.collectionBackground&&/^#[a-f\d]{6}$/i.test(edits.collectionBackground)?edits.collectionBackground:undefined;
 const titleColor=edits?.collectionHeadingColor&&/^#[a-f\d]{6}$/i.test(edits.collectionHeadingColor)?edits.collectionHeadingColor:undefined;
 const collectionCards=collections.map(([title,copy],i)=>({
  title:i===0&&edits?.firstCollectionCard?.title?edits.firstCollectionCard.title:title,
  copy:i===0&&edits?.firstCollectionCard?.description?edits.firstCollectionCard.description:copy,
  image:photo(i+1)
 }));
 const gallery=Array.from({length:6},(_,i)=>photo(i+2));
 const reviewCards=Array.from({length:6},(_,i)=>{
  const real=reviews.filter(r=>r.name?.trim()&&r.quote?.trim())[i];
  return real?{name:real.name,role:real.role||"Avaliação cadastrada",quote:real.quote,
   image:safePhoto(real.photo)?real.photo!:portraits[i],demo:false}
   :{name:examples[i][0],role:examples[i][1],quote:examples[i][2],image:portraits[i],demo:true};
 });
 const addressRegistered=!!address?.trim();
 const displayAddress=address?.trim()||"Rua das Flores Imaginárias, 100 — Pinheiros, São Paulo/SP";
 const mapSrc=addressRegistered
  ?"https://maps.google.com/maps?q="+encodeURIComponent(displayAddress)+"&z=15&output=embed"
  :"https://www.openstreetmap.org/export/embed.html?bbox=-46.7080%2C-23.5750%2C-46.6760%2C-23.5530&layer=mapnik&marker=-23.5640%2C-46.6900";
 useEffect(()=>{
  if(lightbox===null)return;
  const key=(event:KeyboardEvent)=>{
   if(event.key==="Escape")setLightbox(null);
   if(event.key==="ArrowRight")setLightbox(i=>i===null?null:(i+1)%6);
   if(event.key==="ArrowLeft")setLightbox(i=>i===null?null:(i+5)%6);
  };
  document.addEventListener("keydown",key);
  return()=>document.removeEventListener("keydown",key);
 },[lightbox]);
 const send=(event:React.FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(!canContact||!name.trim()||!telephone.trim()||!occasion||!message.trim())return;
  const body=["Olá! Gostaria de fazer uma encomenda floral.","Nome: "+name.trim(),"Telefone: "+telephone.trim(),"Ocasião: "+occasion,"Mensagem: "+message.trim()].join("\n");
  if(hasWhats)window.open("https://wa.me/"+whats+"?text="+encodeURIComponent(body),"_blank","noopener,noreferrer");
  else if(hasMail)window.location.href="mailto:"+mail+"?subject="+encodeURIComponent("Encomenda floral — "+brandName)+"&body="+encodeURIComponent(body);
 };
 const nav=[["Coleções","#produtos"],["Atelier","#sobre"],["Galeria","#galeria"],["Depoimentos","#depoimentos"],["Contato","#contato"]] as const;
 return <main className="pn-floral1 pn-t6-layout" data-tp6-family="retail" data-tp6-variant="01" data-tp6-floral="true" aria-label={"Floricultura "+brandName}>
  <header className="pn-floral1-head" id="inicio">
   <a className="pn-floral1-brand" href="#inicio" aria-label={brandName+" — início"}><span aria-hidden="true">✳</span><strong>{brandShort}<small>ATELIER FLORAL</small></strong></a>
   <button className="pn-floral1-menu" type="button" aria-expanded={menuOpen} aria-controls="pn-floral1-nav" aria-label={menuOpen?"Fechar menu":"Abrir menu"} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?"✕":"☰"}</button>
   <nav id="pn-floral1-nav" className={"pn-floral1-nav"+(menuOpen?" is-open":"")} aria-label="Navegação do atelier">{nav.map(([t,href])=><a key={href} href={href} onClick={()=>setMenuOpen(false)}>{t}</a>)}</nav>
   <a className="pn-floral1-head-cta" href="#contato">Encomendar flores ↗</a>
  </header>

  <section className="pn-floral1-hero"><div className="pn-floral1-hero-copy"><span className="pn-floral1-kicker">CURADORIA FLORAL · FEITA COM AFETO</span><h1 data-block-id={headlineBlockId}>{heroTitle}</h1><p>{heroCopy}</p><div className="pn-floral1-hero-actions"><a className="pn-floral1-btn" href="#produtos">Conheça as coleções ↗</a><a href="#sobre" className="pn-floral1-text-link">Nossa história ↗</a></div><span className="pn-floral1-hero-index">01 / UM ATELIER DE EXPERIÊNCIAS FLORAIS</span></div><div className="pn-floral1-hero-visual"><img data-universal-hero-photo={safePhoto(heroPhotoOverride)?"true":undefined} src={mainPhoto} alt="Flores e arranjos em fotografia editorial" loading="eager" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=photo(0);}}/><span>Flores para sentir, guardar e celebrar.</span></div></section>

  <section className="pn-floral1-collections" id="produtos" style={color?{backgroundColor:color}:undefined}><div className="pn-floral1-top"><div><span className="pn-floral1-kicker">01 / COLEÇÕES FLORAIS</span><h2 style={titleColor?{color:titleColor}:undefined}>Escolhas que florescem.</h2></div><p>Três formas de tornar cada gesto especial, do presente inesperado ao ritual de ter flores em casa.</p></div><div className="pn-floral1-collection-grid" id="colecao">{collectionCards.map((card,i)=><a href="#contato" key={i} className="pn-floral1-collection-card"><div className="pn-floral1-collection-photo"><img src={card.image} alt={"Arranjo ilustrativo da coleção "+card.title} loading="lazy"/><span>0{i+1}</span></div><div className="pn-floral1-collection-name"><div><h3>{card.title}</h3><p>{card.copy}</p></div><strong aria-hidden="true">↗</strong></div></a>)}</div></section>

  <section className="pn-floral1-about" id="sobre"><div className="pn-floral1-about-photos"><img className="pn-floral1-about-large" src={photo(4)} alt="Flores naturais selecionadas para o atelier" loading="lazy"/><img className="pn-floral1-about-small" src={photo(1)} alt="Detalhe de composição floral artesanal" loading="lazy"/></div><div className="pn-floral1-about-copy"><span className="pn-floral1-kicker">02 / NOSSA ESSÊNCIA</span><h2>{edits?.historyTitle||"Há beleza nas histórias que florescem."}</h2><p>O Jardim de Âmbar nasce do encontro entre sensibilidade e natureza. Nosso atelier imagina composições autorais, escolhendo flores, texturas e tonalidades para dar significado a cada momento.</p><p>Do buquê delicado às flores de uma grande celebração, cada detalhe é pensado para emocionar com simplicidade e elegância.</p><div className="pn-floral1-sign">{brandShort} <small>— Atelier Floral</small></div></div></section>

  <section className="pn-floral1-benefits" id="diferenciais"><div><span className="pn-floral1-kicker">03 / NOSSO CUIDADO</span><h2>O detalhe faz a diferença.</h2><ol>{[["Atendimento personalizado","Uma escuta cuidadosa para cada ocasião."],["Flores selecionadas","Composições que respeitam a beleza da estação."],["Criação artesanal","Mãos, técnica e sensibilidade em cada arranjo."],["Entrega cuidadosa","Condições combinadas diretamente com a equipe."]].map(([t,d],i)=><li key={t}><span>0{i+1}</span><div><strong>{t}</strong><p>{d}</p></div><span aria-hidden="true">↗</span></li>)}</ol></div><img className="pn-floral1-benefits-photo" src={photo(3)} alt="Flores em composição editorial" loading="lazy"/></section>

  <section className="pn-floral1-gallery" id="galeria"><div className="pn-floral1-top"><div><span className="pn-floral1-kicker">04 / NOSSO UNIVERSO</span><h2>Flores, formas e sentimentos.</h2></div><p>Uma galeria de composições, cores e texturas que inspiram o nosso atelier.</p></div><div className="pn-floral1-mosaic">{gallery.map((src,i)=><button type="button" key={i} className={"pn-floral1-mosaic-item pn-floral1-mosaic-"+(i+1)} onClick={()=>setLightbox(i)} aria-label={"Ampliar "+galleryNames[i]}><img src={src} alt={galleryNames[i]} loading="lazy"/><span>{galleryNames[i]} ↗</span></button>)}</div></section>

  <section className="pn-floral1-reviews" id="depoimentos"><div className="pn-floral1-top"><div><span className="pn-floral1-kicker">05 / PALAVRAS QUE FLORESCEM</span><h2>Histórias em cada flor.</h2></div><p>Depoimentos demonstrativos identificados como fictícios. Não representam avaliações verificadas de clientes.</p></div><div className="pn-floral1-reviews-grid">{reviewCards.map((r,i)=><article className="pn-floral1-review-card" key={i}><b className="pn-floral1-quote" aria-hidden="true">“</b><p>“{r.quote}”</p><div className="pn-floral1-review-person"><img src={r.image} alt={r.demo?"Retrato ilustrativo, não representa um cliente real":"Fotografia cadastrada do cliente"} loading="lazy"/><div><strong>{r.name}</strong><small>{r.role}</small></div></div><span className="pn-floral1-review-disclosure">{r.demo?"EXEMPLO FICTÍCIO · NÃO É CLIENTE REAL":"RELATO CADASTRADO"}</span></article>)}</div></section>

  <section className="pn-floral1-process" id="como-comprar"><span className="pn-floral1-kicker">06 / DA IDEIA AO ENCANTO</span><div className="pn-floral1-top"><h2>Um processo tão especial quanto as flores.</h2><p>Uma jornada acolhedora, em quatro etapas simples para sua encomenda.</p></div><div className="pn-floral1-steps">{steps.map(([t,d],i)=><article key={t}><span>0{i+1}</span><h3>{t}</h3><p>{d}</p></article>)}</div></section>

  <TP6RetailCustomSections sections={edits?.addedSections?.filter(section=>section.placement!=="before-footer")}/>

  <section className="pn-floral1-faq" id="perguntas-frequentes"><div><span className="pn-floral1-kicker">07 / PERGUNTAS FREQUENTES</span><h2>Cada detalhe importa.</h2><p>Respostas às dúvidas mais comuns para escolher suas flores com tranquilidade.</p><a className="pn-floral1-text-link" href="#contato">Outra dúvida? Fale conosco ↗</a></div><div className="pn-floral1-faq-items">{faqs.map(([q,a],i)=><div className="pn-floral1-faq-item" key={q}><button type="button" onClick={()=>setFaqOpen(faqOpen===i?null:i)} aria-expanded={faqOpen===i} aria-controls={"pn-floral1-faq-"+i}><span>{q}</span><b aria-hidden="true">{faqOpen===i?"−":"+"}</b></button>{faqOpen===i&&<p id={"pn-floral1-faq-"+i}>{a}</p>}</div>)}</div></section>

  <section className="pn-floral1-cta" aria-label="Convite para encomendar flores"><img src={photo(5)} alt="Flores em composição editorial para momentos especiais" loading="lazy"/><div><span className="pn-floral1-kicker">UM GESTO INESQUECÍVEL</span><h2>Todo sentimento merece flores.</h2><p>Vamos criar algo especial para o seu próximo momento?</p><a className="pn-floral1-btn pn-floral1-btn-light" href="#contato">Planejar minha encomenda ↗</a></div></section>

  <section className="pn-floral1-contact" id="contato"><div className="pn-floral1-contact-intro"><span className="pn-floral1-kicker">08 / CONTATO E ENCOMENDAS</span><h2>Vamos dar vida à sua ideia?</h2><p>Conte a ocasião, as preferências e o que deseja transmitir com as flores. Organizaremos sua mensagem para um canal oficial cadastrado.</p><img src={photo(6)} alt="Arranjo floral decorativo" loading="lazy"/></div><form className="pn-floral1-form" onSubmit={send}><h3>Sua encomenda começa aqui.</h3><label htmlFor="pn-floral1-name">Nome completo</label><input id="pn-floral1-name" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required placeholder="Como podemos chamar você?"/><label htmlFor="pn-floral1-phone">Telefone</label><input id="pn-floral1-phone" type="tel" autoComplete="tel" value={telephone} onChange={e=>setTelephone(e.target.value)} required placeholder="Seu telefone com DDD"/><label htmlFor="pn-floral1-occasion">Ocasião</label><select id="pn-floral1-occasion" value={occasion} onChange={e=>setOccasion(e.target.value)} required><option value="">Selecione uma ocasião</option>{["Presente especial","Aniversário","Casamento ou evento","Flores por assinatura","Outra ocasião"].map(v=><option key={v} value={v}>{v}</option>)}</select><label htmlFor="pn-floral1-message">Conte-nos sua ideia</label><textarea id="pn-floral1-message" rows={5} maxLength={2000} value={message} onChange={e=>setMessage(e.target.value)} required placeholder="Cores, flores, data e preferências"/><button type="submit" disabled={!canContact}>{canContact?"Preparar pedido no "+(hasWhats?"WhatsApp":"e-mail")+" ↗":"Cadastre um canal de atendimento"}</button><p role="status">{canContact?"O pedido será enviado somente após confirmar no canal oficial aberto.":"Nenhum telefone WhatsApp ou e-mail válido cadastrado. O formulário não envia dados para destinos fictícios."}</p></form></section>

  <section className="pn-floral1-location" id="localizacao"><div className="pn-floral1-top"><div><span className="pn-floral1-kicker">09 / COMO NOS ENCONTRAR</span><h2>Flores que se aproximam.</h2></div><p>Mapa interativo de referência. A localização demonstrativa não representa uma loja física confirmada.</p></div><div className="pn-floral1-location-grid"><iframe title={addressRegistered?"Mapa do endereço informado":"Mapa demonstrativo de Pinheiros, São Paulo"} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><div className="pn-floral1-location-card"><span>LOCALIZAÇÃO E ATENDIMENTO</span><h3>Um lugar para florescer.</h3><p>{displayAddress}</p><small>{addressRegistered?"Endereço cadastrado — confira antes de publicar.":"ENDEREÇO FICTÍCIO · DEMONSTRAÇÃO · NÃO É UMA LOJA REAL"}</small>{hasWhats?<a className="pn-floral1-btn" href={"https://wa.me/"+whats} target="_blank" rel="noopener noreferrer">Conversar pelo WhatsApp ↗</a>:<span className="pn-floral1-no-whatsapp">WhatsApp indisponível · cadastre um número válido</span>}{hasMail&&<a href={"mailto:"+mail} className="pn-floral1-email">{mail}</a>}</div></div></section>

  <TP6RetailCustomSections sections={edits?.addedSections?.filter(section=>section.placement==="before-footer")}/>

  <footer className="pn-floral1-footer" id="rodape"><div className="pn-floral1-footer-top"><div><span className="pn-floral1-kicker">JARDIM DE ÂMBAR</span><p>Flores para traduzir sentimentos e transformar instantes em memórias.</p></div><nav aria-label="Explorar"><h3>Explore</h3><a href="#produtos">Coleções</a><a href="#sobre">O atelier</a><a href="#galeria">Galeria</a><a href="#depoimentos">Depoimentos</a></nav><nav aria-label="Informações"><h3>Informações</h3><a href="#como-comprar">Como funciona</a><a href="#perguntas-frequentes">Perguntas frequentes</a><a href="#contato">Encomendas</a><a href="#localizacao">Localização</a></nav><div><h3>Vamos conversar?</h3><a href="#contato">Preparar encomenda ↗</a>{hasMail&&<a href={"mailto:"+mail}>{mail}</a>}</div></div><div className="pn-floral1-wordmark">{brandShort}</div><div className="pn-floral1-footer-base"><span>© 2026 {brandName}. Site demonstrativo — verifique os dados antes de publicar.</span><a href="#inicio">Voltar ao topo ↑</a></div></footer>

  {lightbox!==null&&<div className="pn-floral1-lightbox" role="dialog" aria-modal="true" aria-label={"Fotografia ampliada: "+galleryNames[lightbox]} onClick={()=>setLightbox(null)}><button type="button" className="pn-floral1-lightbox-close" aria-label="Fechar galeria" onClick={()=>setLightbox(null)}>✕</button><button type="button" aria-label="Imagem anterior" onClick={e=>{e.stopPropagation();setLightbox((lightbox+5)%6)}}>‹</button><figure onClick={e=>e.stopPropagation()}><img src={gallery[lightbox]} alt={galleryNames[lightbox]}/><figcaption>{galleryNames[lightbox]} · {lightbox+1} / 6</figcaption></figure><button type="button" aria-label="Próxima imagem" onClick={e=>{e.stopPropagation();setLightbox((lightbox+1)%6)}}>›</button></div>}
 </main>;
}
