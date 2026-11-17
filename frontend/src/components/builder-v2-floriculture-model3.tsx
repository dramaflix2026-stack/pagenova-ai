"use client";

import React,{useEffect,useState} from "react";
import type {TP6RetailVisualEdits} from "@/lib/builder-v2-tp6-edit-bridge";
import {TP6RetailCustomSections,type TP6RetailReview} from "./builder-v2-tp6-premium-shared";
import "./builder-v2-floriculture-model3.css";

/** Exclusive TP6 Floricultura Model 03. All other retail models keep their existing renderers. */
type Props={
 brand:string;headline?:string;description?:string;photos:string[];edits?:TP6RetailVisualEdits;
 reviews?:TP6RetailReview[];email?:string;whatsapp?:string;address?:string;cnpj?:string;
 newsletterEndpoint?:string;
};
const fallback=[
 "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1600&q=85",
 "https://images.unsplash.com/photo-1561848355-890d054dc55a?auto=format&fit=crop&w=1600&q=85",
 "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?auto=format&fit=crop&w=1600&q=85",
];
const testimonials=[
 ["Mariana Oliveira","Buquê para presentear","Uma combinação delicada de flores transforma um gesto simples em uma lembrança especial.","1544005313-94ddf0286df2"],
 ["Carolina Mendes","Arranjos autorais","Cores, formas e texturas que ajudam a contar histórias de um jeito único.","1534528741775-53994a69daeb"],
 ["Rafael Almeida","Flores para celebrar","Um arranjo pensado para a ocasião pode dar ainda mais significado à comemoração.","1500648767791-00dcc994a43e"],
 ["Fernanda Costa","Decoração floral","A beleza das flores naturais cria uma atmosfera acolhedora nos momentos importantes.","1548142813-c348350df52b"],
 ["Lucas Ferreira","Presente afetivo","Pequenos detalhes tornam uma composição floral uma homenagem inesquecível.","1506794778202-cad84cf45f1d"],
 ["Juliana Santos","Flores de estação","A escolha cuidadosa de cada espécie faz a diferença no resultado final.","1524504388940-b1c1722653e1"]
] as const;
const faqs=[
 ["Como escolher um buquê para presentear?","Conte a ocasião, as cores preferidas e o estilo de quem vai receber. A loja pode orientar sobre as opções disponíveis."],
 ["Posso personalizar as cores e as flores?","Você pode solicitar combinações e espécies específicas. A confirmação depende da disponibilidade da estação."],
 ["Vocês criam arranjos para casamentos e eventos?","Você pode solicitar uma proposta floral para a ocasião, sujeita à agenda, orçamento e confirmação da loja."],
 ["Como funcionam a entrega e a retirada?","Regiões atendidas, horários, taxas e modalidades devem ser confirmados diretamente com a loja."],
 ["Posso incluir uma mensagem no presente?","Inclua sua mensagem na solicitação e confirme com a equipe as opções de cartão disponíveis."],
 ["Como cuidar melhor das flores?","Mantenha os arranjos em local fresco, longe de sol direto e calor. Siga os cuidados específicos de cada espécie."]
] as const;
const collections=[
 ["Buquês autorais","Afeto em cada detalhe"],
 ["Arranjos especiais","Flores que decoram histórias"],
 ["Flores da estação","Beleza em movimento"],
 ["Celebrações","Composições para encontros"],
 ["Presentes florais","Gestos que permanecem"],
 ["Nosso atelier","Texturas, cores e poesia"]
] as const;
const values=[
 ["✳","Curadoria floral","Composições com flores e cores escolhidas para valorizar cada ocasião."],
 ["❀","Criação artesanal","Buquês e arranjos com sensibilidade, textura e identidade."],
 ["✦","Escuta e cuidado","Um atendimento que começa entendendo o gesto e a intenção do pedido."],
 ["↗","Detalhes combinados","Condições e possibilidades esclarecidas antes de concluir a encomenda."]
] as const;
const journey=[
 ["01","Escolha seu estilo","Explore coleções, referências e flores da estação."],
 ["02","Conte a sua ideia","Informe cores, ocasião, preferências e a mensagem desejada."],
 ["03","Combine os detalhes","Confirme disponibilidade e as opções de retirada ou entrega."]
] as const;
const goodPhoto=(src:unknown)=>typeof src==="string"&&/^https:\/\/(?:images\.unsplash\.com|[\w.-]+\.supabase\.co|[\w.-]+\.cloudinary\.com)\//i.test(src);
const goodEmail=(src:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(src)&&src.length<=254;

export function TP6FloricultureModel3({brand,headline,description,photos,edits,reviews=[],email,whatsapp,address,cnpj,newsletterEndpoint}:Props){
 const [menu,setMenu]=useState(false);
 const [lightbox,setLightbox]=useState<number|null>(null);
 const [fullName,setFullName]=useState(""),[phone,setPhone]=useState(""),[occasion,setOccasion]=useState(""),[message,setMessage]=useState("");
 const [subscriber,setSubscriber]=useState(""),[subscription,setSubscription]=useState<"idle"|"sending"|"success"|"error">("idle");
 const business=brand?.trim()||"Jardim de Âmbar — Atelier Floral";
 const shortBrand=business.split(/\s+[—–-]\s+/)[0];
 const subtitle=description?.trim()||"Composições florais para expressar sentimentos, criar encontros e celebrar os detalhes.";
 const photoBank=photos.filter(goodPhoto);
 const image=(i:number)=>photoBank.length?photoBank[i%photoBank.length]:fallback[i%fallback.length];
 const mail=(email||"").trim(),canMail=goodEmail(mail);
 const digits=(whatsapp||"").replace(/\D/g,""),canWhats=digits.length>=10&&digits.length<=15;
 const canContact=canWhats||canMail;
 const providedAddress=!!address?.trim();
 const displayedAddress=providedAddress?address!.trim():"Avenida Paulista, 1000 — Bela Vista, São Paulo / SP";
 const mapSrc=providedAddress?"https://maps.google.com/maps?q="+encodeURIComponent(displayedAddress)+"&z=15&output=embed":
  "https://www.openstreetmap.org/export/embed.html?bbox=-46.6550%2C-23.5680%2C-46.6400%2C-23.5560&layer=mapnik&marker=-23.5614%2C-46.6476";
 const newsletterActive=!!newsletterEndpoint&&/^https:\/\/[^/?#]+\/.+/.test(newsletterEndpoint);
 const rows=Array.from({length:6},(_,i)=>{
  const actual=reviews.filter(r=>r.name?.trim()&&r.quote?.trim())[i];
  if(actual)return {...actual,demo:false};
  const sample=testimonials[i];
  return {name:sample[0],role:sample[1],quote:sample[2],photo:"https://images.unsplash.com/photo-"+sample[3]+"?auto=format&fit=crop&w=160&h=160&q=80",demo:true};
 });
 const gallery=Array.from({length:6},(_,i)=>({title:i===0&&edits?.firstCollectionCard?.title?edits.firstCollectionCard.title:collections[i][0],subtitle:i===0&&edits?.firstCollectionCard?.description?edits.firstCollectionCard.description:collections[i][1],photo:image(i+1)}));
 const goContact=(event:React.FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(!canContact||!fullName.trim()||!phone.trim()||!occasion||!message.trim())return;
  const body=["Olá! Quero solicitar uma encomenda floral.","Nome: "+fullName.trim(),"Telefone: "+phone.trim(),"Ocasião: "+occasion,"Mensagem: "+message.trim()].join("\n");
  if(canWhats)window.open("https://wa.me/"+digits+"?text="+encodeURIComponent(body),"_blank","noopener,noreferrer");
  else window.location.href="mailto:"+mail+"?subject="+encodeURIComponent("Encomenda floral — "+business)+"&body="+encodeURIComponent(body);
 };
 const sendNewsletter=async(event:React.FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(!newsletterActive||!goodEmail(subscriber)||subscription==="sending")return;
  setSubscription("sending");
  try{
   const response=await fetch(newsletterEndpoint!,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:subscriber,source:"tp6-floriculture-model3"})});
   if(!response.ok)throw new Error("subscription not confirmed");
   setSubscription("success");
  }catch{setSubscription("error");}
 };
 useEffect(()=>{
  if(lightbox===null)return;
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape")setLightbox(null);
   if(event.key==="ArrowRight")setLightbox(index=>index===null?null:(index+1)%gallery.length);
   if(event.key==="ArrowLeft")setLightbox(index=>index===null?null:(index+gallery.length-1)%gallery.length);
  };
  document.addEventListener("keydown",onKey);
  return()=>document.removeEventListener("keydown",onKey);
 },[lightbox,gallery.length]);
 return <main className="pn-floral3" data-tp6-family="retail" data-tp6-variant="03" data-tp6-floral="true" data-floriculture-redesign="2026-11-17">
  <header className="pn-floral3-header">
   <a className="pn-floral3-brand" href="#inicio">{shortBrand}<small>ATELIER FLORAL</small></a>
   <nav className={menu?"pn-floral3-nav open":"pn-floral3-nav"} aria-label="Navegação principal">
    <a href="#sobre" onClick={()=>setMenu(false)}>O atelier</a><a href="#produtos" onClick={()=>setMenu(false)}>Coleções</a><a href="#depoimentos" onClick={()=>setMenu(false)}>Experiências</a><a href="#localizacao" onClick={()=>setMenu(false)}>Localização</a>
    <a className="pn-floral3-nav-mobile-contact" href="#contato" onClick={()=>setMenu(false)}>Fazer encomenda ↗</a>
   </nav>
   <a className="pn-floral3-header-cta" href="#contato">ENCOMENDE FLORES <span aria-hidden="true">↗</span></a>
   <button className="pn-floral3-hamburger" type="button" aria-label={menu?"Fechar menu":"Abrir menu"} aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?"✕":"☰"}</button>
  </header>
  <section id="inicio" className="pn-floral3-hero" aria-labelledby="pn-floral3-hero-title">
   <img className="pn-floral3-hero-image" src={image(0)} alt="Fotografia floral editorial com flores naturais" fetchPriority="high"/>
   <div className="pn-floral3-hero-overlay"/>
   <div className="pn-floral3-hero-content"><span className="pn-floral3-eyebrow light">01 / BELEZA QUE FLORESCE</span>
    <h1 id="pn-floral3-hero-title">{headline?.trim()||"O extraordinário mora nos detalhes."}</h1>
    <p>{subtitle}</p><a className="pn-floral3-button light-button" href="#produtos">DESCUBRA NOSSAS FLORES <span aria-hidden="true">↗</span></a>
   </div>
   <div className="pn-floral3-hero-caption"><span>JARDIM DE ÂMBAR / ESTÚDIO FLORAL</span><span>UM GESTO. INFINITAS EMOÇÕES.</span></div>
  </section>

  <section id="sobre" className="pn-floral3-about pn-floral3-section" aria-labelledby="pn-floral3-about-title">
   <div className="pn-floral3-section-top"><span>02 / NOSSA HISTÓRIA</span><span>A ARTE DE FLORESCER</span></div>
   <div className="pn-floral3-about-grid">
    <figure className="pn-floral3-about-photo one"><img src={image(2)} alt="Flores delicadas fotografadas em luz natural" loading="lazy"/><figcaption>TEXTURAS E MOVIMENTO</figcaption></figure>
    <div className="pn-floral3-about-copy"><span className="pn-floral3-eyebrow">A ESSÊNCIA DO ATELIER</span><h2 id="pn-floral3-about-title">{edits?.historyTitle||"Cada flor tem algo a dizer."}</h2><p>Na {shortBrand}, acreditamos que flores são uma linguagem de afeto. Composições, cores e texturas dão forma a encontros, memórias e celebrações.</p><p>Nosso olhar acompanha a beleza de cada estação e a particularidade de cada ocasião, do buquê mais singelo ao gesto mais marcante.</p><a className="pn-floral3-textlink" href="#produtos">CONHECER NOSSA CURADORIA ↗</a></div>
    <figure className="pn-floral3-about-photo two"><img src={image(3)} alt="Arranjo floral com composição artística" loading="lazy"/><figcaption>FLORES COM PROPÓSITO</figcaption></figure>
   </div>
  </section>

  <section id="diferenciais" className="pn-floral3-values pn-floral3-section" aria-labelledby="pn-floral3-values-title">
   <div className="pn-floral3-section-top"><span>03 / O NOSSO JEITO</span><span>O QUE TORNA CADA GESTO ESPECIAL</span></div>
   <div className="pn-floral3-values-head"><span className="pn-floral3-eyebrow">FEITO COM ATENÇÃO</span><h2 id="pn-floral3-values-title">Mais do que flores.<br/><em>Significados.</em></h2><p>Quatro pilares para inspirar escolhas delicadas e uma experiência de encomenda acolhedora.</p></div>
   <div className="pn-floral3-values-grid">{values.map(([icon,label,desc])=><article className="pn-floral3-value-card" key={label}><span className="pn-floral3-value-icon" aria-hidden="true">{icon}</span><h3>{label}</h3><p>{desc}</p></article>)}</div>
  </section>

  <section id="produtos" className="pn-floral3-collections pn-floral3-section" aria-labelledby="pn-floral3-collections-title" style={edits?.collectionBackground&&/^#[0-9a-f]{6}$/i.test(edits.collectionBackground)?{backgroundColor:edits.collectionBackground}:undefined}>
   <div className="pn-floral3-section-top"><span>04 / NOSSA SELEÇÃO</span><span>UMA GALERIA DE POSSIBILIDADES</span></div>
   <div className="pn-floral3-heading-pair"><div><span className="pn-floral3-eyebrow">CURADORIA FLORAL</span><h2 id="pn-floral3-collections-title" style={edits?.collectionHeadingColor&&/^#[0-9a-f]{6}$/i.test(edits.collectionHeadingColor)?{color:edits.collectionHeadingColor}:undefined}>Flores para cada<br/><em>história.</em></h2></div><p>Seis olhares sobre o nosso universo floral. Toque em uma fotografia para ampliar seus detalhes.</p></div>
   <div className="pn-floral3-gallery">{gallery.map((item,i)=><button key={item.title+i} className={"pn-floral3-gallery-item item-"+i} type="button" aria-label={"Ampliar fotografia: "+item.title} onClick={()=>setLightbox(i)}><img src={item.photo} alt={item.title+" — fotografia floral ilustrativa"} loading="lazy"/><span className="pn-floral3-gallery-overlay"/><span className="pn-floral3-gallery-number">{String(i+1).padStart(2,"0")} / 06</span><span className="pn-floral3-gallery-caption"><strong>{item.title}</strong><small>{item.subtitle} <span aria-hidden="true">↗</span></small></span></button>)}</div>
   <a className="pn-floral3-textlink" href="#contato">QUERO ENCOMENDAR FLORES ↗</a>
  </section>

  <section id="como-comprar" className="pn-floral3-journey pn-floral3-section" aria-labelledby="pn-floral3-journey-title">
   <div className="pn-floral3-section-top"><span>05 / COMO FUNCIONA</span><span>TRÊS PASSOS, UM GESTO ESPECIAL</span></div>
   <div className="pn-floral3-heading-pair"><div><span className="pn-floral3-eyebrow">SIMPLIFICAMOS SUA ESCOLHA</span><h2 id="pn-floral3-journey-title">Do primeiro olhar<br/><em>ao encanto.</em></h2></div><p>Escolha sua inspiração e converse com o atelier para confirmar a encomenda.</p></div>
   <div className="pn-floral3-journey-grid">{journey.map(([n,label,desc],i)=><article className="pn-floral3-journey-card" key={n}><div className="pn-floral3-journey-photo"><img src={image(i+4)} alt={"Fotografia de flores — "+label} loading="lazy"/><span>{n}</span></div><h3>{label}</h3><p>{desc}</p></article>)}</div>
  </section>

  <section id="depoimentos" className="pn-floral3-testimonials pn-floral3-section" aria-labelledby="pn-floral3-testimonials-title">
   <div className="pn-floral3-section-top"><span>06 / EXPERIÊNCIAS</span><span>VOZES E HISTÓRIAS</span></div>
   <div className="pn-floral3-heading-pair"><div><span className="pn-floral3-eyebrow">PALAVRAS QUE FLORESCEM</span><h2 id="pn-floral3-testimonials-title">Gestos que deixam<br/><em>memórias.</em></h2></div><p>Relatos cadastrados pela loja e textos demonstrativos identificados com transparência.</p></div>
   <p className="pn-floral3-disclosure">Os exemplos marcados como fictícios ilustram o design e não representam avaliações reais.</p>
   <div className="pn-floral3-testimonial-grid">{rows.map((r,i)=><article className="pn-floral3-testimonial-card" key={i}><div className="pn-floral3-testimonial-person">{r.photo?<img src={goodPhoto(r.photo)?r.photo:""} loading="lazy" alt={r.demo?"Retrato ilustrativo, não representa um cliente real":"Foto de depoimento cadastrado"}/>:<span aria-hidden="true">{r.name.split(" ").map(s=>s[0]).slice(0,2).join("")}</span>}<div><strong>{r.name}</strong><small>{r.role}</small></div></div><div className="pn-floral3-stars" aria-hidden="true">✳ ✳ ✳</div><blockquote>“{r.quote}”</blockquote><small className="pn-floral3-testimonial-tag">{r.demo?"EXEMPLO FICTÍCIO · NÃO É CLIENTE REAL":"DEPOIMENTO CADASTRADO"}</small></article>)}</div>
  </section>

  <TP6RetailCustomSections sections={edits?.addedSections}/>

  <section id="faq" className="pn-floral3-faq pn-floral3-section" aria-labelledby="pn-floral3-faq-title">
   <div className="pn-floral3-section-top"><span>07 / PERGUNTAS FREQUENTES</span><span>ESTAMOS AQUI PARA AJUDAR</span></div>
   <div className="pn-floral3-faq-grid"><div className="pn-floral3-faq-left"><span className="pn-floral3-eyebrow">DÚVIDAS? CONVERSE COM A GENTE</span><h2 id="pn-floral3-faq-title">Tudo começa<br/><em>com uma pergunta.</em></h2><p>Encontre respostas para as dúvidas mais comuns antes de fazer sua encomenda.</p><img src={image(6)} alt="Flores em composição editorial junto às perguntas frequentes" loading="lazy"/></div><div className="pn-floral3-faq-list">{faqs.map(([q,a],i)=><details key={q} className="pn-floral3-faq-item"><summary><span>{String(i+1).padStart(2,"0")}</span><strong>{q}</strong><span aria-hidden="true" className="pn-floral3-faq-plus">+</span></summary><p>{a}</p></details>)}</div></div>
  </section>

  <section id="contato" className="pn-floral3-contact pn-floral3-section" aria-labelledby="pn-floral3-contact-title">
   <div className="pn-floral3-section-top"><span>08 / CONTATO E ENCOMENDAS</span><span>UM GESTO COMEÇA COM UMA CONVERSA</span></div>
   <div className="pn-floral3-contact-grid"><div className="pn-floral3-contact-intro"><span className="pn-floral3-eyebrow">SUA IDEIA, NOSSA INSPIRAÇÃO</span><h2 id="pn-floral3-contact-title">Vamos criar algo<br/><em>especial?</em></h2><p>Conte um pouco da ocasião e do que você imagina. A equipe poderá confirmar as possibilidades e os detalhes pelo canal de atendimento cadastrado.</p><img src={image(5)} alt="Detalhe floral delicado para inspirar encomendas" loading="lazy"/></div>
    <form className="pn-floral3-contact-form" onSubmit={goContact}><span className="pn-floral3-eyebrow">PREPARE SUA ENCOMENDA</span><h3>Conte a sua ideia.</h3>
     <label htmlFor="pn-floral3-name">Nome completo</label><input id="pn-floral3-name" required maxLength={120} autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Como podemos chamar você?"/>
     <label htmlFor="pn-floral3-phone">Telefone</label><input id="pn-floral3-phone" type="tel" required maxLength={30} autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="DDD + número"/>
     <label htmlFor="pn-floral3-occasion">Ocasião</label><select id="pn-floral3-occasion" required value={occasion} onChange={e=>setOccasion(e.target.value)}><option value="">Selecione uma ocasião</option>{["Aniversário","Presente especial","Casamento ou evento","Flores para casa","Outra ocasião"].map(o=><option key={o} value={o}>{o}</option>)}</select>
     <label htmlFor="pn-floral3-message">Sua mensagem</label><textarea id="pn-floral3-message" required rows={4} maxLength={2000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Conte cores, flores, data e preferências"/>
     <button className="pn-floral3-button" disabled={!canContact} type="submit">{canContact?"PREPARAR ENCOMENDA ↗":"CADASTRE UM CANAL DE CONTATO"}</button>
     <p role="status">{canContact?"Sua mensagem será aberta no WhatsApp ou e-mail da loja para você confirmar o envio.":"Sem WhatsApp ou e-mail reais cadastrados, o envio está desativado."}</p>
    </form></div>
  </section>

  <section id="newsletter" className="pn-floral3-newsletter pn-floral3-section" aria-labelledby="pn-floral3-news-title">
   <div className="pn-floral3-section-top"><span>09 / NOVIDADES</span><span>UM CONVITE PARA FLORESCER</span></div>
   <div className="pn-floral3-news-grid"><div><span className="pn-floral3-eyebrow">FIQUE PERTO DA NATUREZA</span><h2 id="pn-floral3-news-title">Flores novas.<br/><em>Boas histórias.</em></h2><p>Novas coleções, inspirações e pequenos encantos para acompanhar.</p></div>
    <form onSubmit={sendNewsletter}><label htmlFor="pn-floral3-news-email">Seu melhor e-mail</label><div className="pn-floral3-news-field"><input id="pn-floral3-news-email" type="email" required maxLength={254} value={subscriber} disabled={!newsletterActive||subscription==="sending"} onChange={e=>{setSubscriber(e.target.value);setSubscription("idle")}} placeholder="voce@exemplo.com"/><button type="submit" disabled={!newsletterActive||subscription==="sending"} aria-label="Solicitar inscrição">↗</button></div><p role="status">{!newsletterActive?"A inscrição será habilitada após configurar uma integração real de newsletter.":subscription==="success"?"Inscrição confirmada pela integração cadastrada.":subscription==="error"?"Não foi possível confirmar a inscrição. Tente novamente.":"Seu cadastro será enviado à integração configurada."}</p></form>
   </div>
  </section>

  <section id="localizacao" className="pn-floral3-location pn-floral3-section" aria-labelledby="pn-floral3-location-title">
   <div className="pn-floral3-section-top"><span>10 / LOCALIZAÇÃO</span><span>ONDE NOS ENCONTRAR</span></div>
   <div className="pn-floral3-heading-pair"><div><span className="pn-floral3-eyebrow">VENHA FLORESCER COM A GENTE</span><h2 id="pn-floral3-location-title">Nosso lugar<br/><em>no mundo.</em></h2></div><p>Um mapa verdadeiro com localização demonstrativa quando o endereço da loja ainda não estiver cadastrado.</p></div>
   <div className="pn-floral3-map-wrap"><iframe title={providedAddress?"Mapa do endereço cadastrado":"Mapa demonstrativo da Avenida Paulista em São Paulo"} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><div className="pn-floral3-map-card"><span className="pn-floral3-eyebrow">NOSSO ENDEREÇO</span><h3>{shortBrand}</h3><p>{displayedAddress}</p><small>{providedAddress?"Endereço informado no cadastro — confirme sua exatidão.":"ENDEREÇO FICTÍCIO · LOCALIZAÇÃO ILUSTRATIVA · NÃO É UMA LOJA REAL"}</small>{canWhats?<a className="pn-floral3-button" href={"https://wa.me/"+digits} target="_blank" rel="noopener noreferrer">FALAR NO WHATSAPP ↗</a>:<span className="pn-floral3-inactive">WhatsApp indisponível — cadastre um número válido.</span>}</div></div>
  </section>

  <section id="informacoes-loja" className="pn-floral3-store pn-floral3-section" aria-labelledby="pn-floral3-store-title">
   <div className="pn-floral3-section-top"><span>11 / NOSSO ATELIER</span><span>INFORMAÇÕES ESSENCIAIS</span></div>
   <div className="pn-floral3-store-grid"><div className="pn-floral3-store-photo"><img src={image(7)} alt="Fotografia de flores e composições do universo floral" loading="lazy"/></div><div className="pn-floral3-store-copy"><span className="pn-floral3-eyebrow">DETALHES QUE IMPORTAM</span><h2 id="pn-floral3-store-title">O cuidado mora<br/><em>nas escolhas.</em></h2><p>Conheça o universo do atelier e encontre as informações de contato fornecidas pela loja.</p><dl><div><dt>Especialidades</dt><dd>Buquês, arranjos florais e criações para ocasiões especiais.</dd></div>{canMail&&<div><dt>E-mail cadastrado</dt><dd><a href={"mailto:"+mail}>{mail}</a></dd></div>}{canWhats&&<div><dt>Atendimento</dt><dd><a target="_blank" rel="noopener noreferrer" href={"https://wa.me/"+digits}>Conversar pelo WhatsApp ↗</a></dd></div>}{cnpj?.trim()&&<div><dt>CNPJ informado</dt><dd>{cnpj.trim()}</dd></div>}{!canMail&&!canWhats&&<div><dt>Canais de contato</dt><dd>Ainda não cadastrados pela loja.</dd></div>}</dl></div></div>
  </section>

  <footer id="rodape" className="pn-floral3-footer"><div className="pn-floral3-footer-top"><div className="pn-floral3-footer-about"><a href="#inicio" className="pn-floral3-footer-brand">{shortBrand}</a><p>Flores que dão forma aos gestos mais bonitos da vida.</p><a className="pn-floral3-footer-cta" href="#contato">VAMOS CRIAR ALGO ESPECIAL ↗</a></div><nav aria-label="Explore o site"><h3>Explore</h3><a href="#inicio">Início</a><a href="#sobre">O atelier</a><a href="#produtos">Coleções florais</a><a href="#depoimentos">Depoimentos</a></nav><nav aria-label="Informações"><h3>Informações</h3><a href="#como-comprar">Como encomendar</a><a href="#faq">Perguntas frequentes</a><a href="#localizacao">Localização</a><a href="#informacoes-loja">Dados da loja</a></nav><div className="pn-floral3-footer-contact"><h3>Contato</h3>{canMail&&<a href={"mailto:"+mail}>{mail}</a>}{canWhats&&<a target="_blank" rel="noopener noreferrer" href={"https://wa.me/"+digits}>WhatsApp ↗</a>}{!canMail&&!canWhats&&<a href="#contato">Ver canais de atendimento</a>}</div></div><div className="pn-floral3-footer-bottom"><span>© {new Date().getFullYear()} {business}. Todos os direitos reservados.</span><span>FEITO PARA FLORESCER</span><a href="#inicio">VOLTAR AO TOPO ↑</a></div></footer>

  {lightbox!==null&&<div className="pn-floral3-lightbox" role="dialog" aria-modal="true" aria-label={"Fotografia ampliada de "+gallery[lightbox].title} onClick={()=>setLightbox(null)}><button type="button" className="pn-floral3-close" aria-label="Fechar galeria" onClick={()=>setLightbox(null)}>✕</button><button type="button" className="pn-floral3-gallery-nav" aria-label="Fotografia anterior" onClick={e=>{e.stopPropagation();setLightbox((lightbox+gallery.length-1)%gallery.length)}}>‹</button><figure onClick={e=>e.stopPropagation()}><img src={gallery[lightbox].photo} alt={gallery[lightbox].title}/><figcaption>{gallery[lightbox].title} · {lightbox+1}/6</figcaption></figure><button type="button" className="pn-floral3-gallery-nav" aria-label="Próxima fotografia" onClick={e=>{e.stopPropagation();setLightbox((lightbox+1)%gallery.length)}}>›</button></div>}
 </main>;
}
