"use client";

import React,{useEffect,useState} from "react";
import type {TP6RetailVisualEdits} from "@/lib/builder-v2-tp6-edit-bridge";
import {TP6RetailCustomSections,type TP6RetailReview} from "./builder-v2-tp6-premium-shared";
import "./builder-v2-floriculture-model2.css";

/** Dedicated editorial storefront: TP6 Floricultura / approved Model 02 only. */
type Props={
 brand:string;headline?:string;description?:string;photos:string[];edits?:TP6RetailVisualEdits;
 reviews?:TP6RetailReview[];email?:string;whatsapp?:string;address?:string;newsletterEndpoint?:string;
};
const fallback=[
 "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1600&q=85",
 "https://images.unsplash.com/photo-1561848355-890d054dc55a?auto=format&fit=crop&w=1600&q=85",
 "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?auto=format&fit=crop&w=1600&q=85"
];
const portraitIds=["1544005313-94ddf0286df2","1534528741775-53994a69daeb","1500648767791-00dcc994a43e","1548142813-c348350df52b","1506794778202-cad84cf45f1d","1524504388940-b1c1722653e1"];
const reviewDemos=[
 ["Mariana Oliveira","Buquê de aniversário","A escolha das flores criou um presente cheio de delicadeza, cuidado e significado."],
 ["Carolina Mendes","Arranjo personalizado","A combinação de cores e texturas deixou a comemoração ainda mais especial."],
 ["Rafael Almeida","Presente especial","Um buquê cuidadosamente elaborado tem o poder de expressar o que as palavras não dizem."],
 ["Fernanda Costa","Decoração de eventos","A mistura de flores delicadas com folhagens trouxe beleza e acolhimento ao ambiente."],
 ["Lucas Ferreira","Flores para celebrar","Uma composição elegante transformou a ocasião em uma lembrança especial."],
 ["Juliana Santos","Flores por assinatura","O encanto das flores no dia a dia muda a atmosfera de qualquer espaço."]
] as const;
const FAQs=[
 ["Como encomendar um buquê personalizado?","Escolha suas referências e descreva as flores, cores, ocasião e data desejadas no formulário. A equipe confirma a disponibilidade pelo canal cadastrado."],
 ["Vocês criam arranjos para casamentos e eventos?","É possível solicitar uma proposta personalizada, sujeita a orçamento, agenda e disponibilidade de flores."],
 ["Quais espécies e arranjos estão disponíveis?","A seleção depende da sazonalidade. Confirme as opções com o atelier antes de realizar a encomenda."],
 ["Como funciona a entrega de flores?","Locais atendidos, prazos, valores e opções de retirada devem ser confirmados diretamente com a loja."],
 ["Posso incluir um cartão com mensagem?","Você pode informar sua mensagem e solicitar orientações sobre os cartões disponíveis."],
 ["Como conservar as flores?","Troque a água quando necessário, mantenha as flores longe de calor e sol intenso e siga as orientações de cada espécie."]
] as const;
const collectionNames=[
 ["Buquês autorais","Um gesto, inúmeras formas de demonstrar afeto."],
 ["Arranjos exclusivos","Composições que dão personalidade aos espaços."],
 ["Flores por assinatura","Um encontro constante com a beleza natural."]
] as const;
const features=[
 ["Flores selecionadas","Curadoria cuidadosa de espécies e tonalidades."],
 ["Criação artesanal","Arranjos com identidade, textura e sensibilidade."],
 ["Atendimento dedicado","Cada proposta começa com uma conversa atenta."],
 ["Entrega planejada","Condições acordadas conforme disponibilidade."]
] as const;
const process=[
 ["Escolha sua composição","Explore as coleções e conte qual estilo você procura."],
 ["Personalize o seu pedido","Escolha cores, ocasião e mensagem para quem receberá."],
 ["Celebre com flores","Combine detalhes de preparo, retirada ou entrega com o atelier."]
] as const;
const photoIsUsable=(s:unknown)=>typeof s==="string"&&/^https:\/\/(?:images\.unsplash\.com|[\w.-]+\.supabase\.co|[\w.-]+\.cloudinary\.com)\//i.test(s);
const validEmail=(s:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)&&s.length<=254;
const textOr=(s?:string,alternative="")=>s?.trim()||alternative;

export function TP6FloricultureModel2({brand,headline,description,photos,edits,reviews=[],email,whatsapp,address,newsletterEndpoint}:Props){
 const [menuOpen,setMenuOpen]=useState(false);
 const [faqOpen,setFaqOpen]=useState<number|null>(null);
 const [lightbox,setLightbox]=useState<number|null>(null);
 const [name,setName]=useState(""),[phone,setPhone]=useState(""),[occasion,setOccasion]=useState(""),[message,setMessage]=useState("");
 const [subscriber,setSubscriber]=useState(""),[newsletterState,setNewsletterState]=useState<"idle"|"saving"|"saved"|"error">("idle");
 const photoBank=photos.filter(photoIsUsable);
 const image=(i:number)=>photoBank.length?photoBank[i%photoBank.length]:fallback[i%fallback.length];
 const business=textOr(brand,"Jardim de Âmbar — Atelier Floral");
 const businessShort=business.split(/\s+[—–-]\s+/)[0];
 const title=textOr(headline,"Flores que transformam momentos em memórias");
 const subheading=textOr(description,"Flores, afeto e composições autorais para tornar cada gesto inesquecível.");
 const mail=textOr(email),canMail=validEmail(mail);
 const digits=textOr(whatsapp).replace(/\D/g,""),canWhats=digits.length>=10&&digits.length<=15;
 const canContact=canWhats||canMail;
 // An endpoint is accepted only when explicitly provisioned on an HTTPS origin.
 // Without a real backend, no subscriber is recorded and the submit remains disabled.
 const newsletterActive=!!newsletterEndpoint&&/^https:\/\/[^/?#]+\/.+/.test(newsletterEndpoint);
 const addressProvided=!!address?.trim();
 const shownAddress=addressProvided?address!.trim():"Rua das Flores Imaginárias, 100 — Pinheiros, São Paulo / SP";
 const mapUrl=addressProvided
  ?"https://maps.google.com/maps?q="+encodeURIComponent(shownAddress)+"&z=15&output=embed"
  :"https://www.openstreetmap.org/export/embed.html?bbox=-46.7080%2C-23.5750%2C-46.6760%2C-23.5530&layer=mapnik&marker=-23.5640%2C-46.6900";
 const heroImage=image(0);
 const collectionColor=edits?.collectionBackground&&/^#[a-f\d]{6}$/i.test(edits.collectionBackground)?edits.collectionBackground:undefined;
 const collectionTextColor=edits?.collectionHeadingColor&&/^#[a-f\d]{6}$/i.test(edits.collectionHeadingColor)?edits.collectionHeadingColor:undefined;
 const cards=collectionNames.map(([baseTitle,baseCopy],i)=>({
  title:i===0&&edits?.firstCollectionCard?.title?edits.firstCollectionCard.title:baseTitle,
  description:i===0&&edits?.firstCollectionCard?.description?edits.firstCollectionCard.description:baseCopy,
  photo:image(i+1)
 }));
 const gallery=Array.from({length:6},(_,i)=>({photo:image((i+3)%8),label:["Flores de estação","Arranjos para celebrar","Detalhes artesanais","Buquês autorais","Tons e texturas","Nossa inspiração floral"][i]}));
 const testimonialRows=Array.from({length:6},(_,i)=>{
  const registered=reviews.filter(r=>r.name?.trim()&&r.quote?.trim())[i];
  return registered?{
   name:registered.name,role:registered.role||"Depoimento cadastrado",quote:registered.quote,
   portrait:photoIsUsable(registered.photo)?registered.photo!:"",demo:false
  }:{
   name:reviewDemos[i][0],role:reviewDemos[i][1],quote:reviewDemos[i][2],
   portrait:"https://images.unsplash.com/photo-"+portraitIds[i]+"?auto=format&fit=crop&w=180&h=180&q=80",demo:true
  };
 });
 useEffect(()=>{
  if(lightbox===null)return;
  const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setLightbox(null);if(e.key==="ArrowRight")setLightbox(i=>i===null?null:(i+1)%6);if(e.key==="ArrowLeft")setLightbox(i=>i===null?null:(i+5)%6);};
  document.addEventListener("keydown",onKey);
  return()=>document.removeEventListener("keydown",onKey);
 },[lightbox]);
 const submitContact=(e:React.FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(!canContact||!name.trim()||!phone.trim()||!occasion||!message.trim())return;
  const body=["Olá! Gostaria de solicitar uma encomenda floral.","Nome: "+name.trim(),"Telefone: "+phone.trim(),"Ocasião: "+occasion,"Mensagem: "+message.trim()].join("\n");
  if(canWhats)window.open("https://wa.me/"+digits+"?text="+encodeURIComponent(body),"_blank","noopener,noreferrer");
  else window.location.href="mailto:"+mail+"?subject="+encodeURIComponent("Encomenda floral — "+business)+"&body="+encodeURIComponent(body);
 };
 const saveNewsletter=async(e:React.FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(!newsletterActive||!validEmail(subscriber)||newsletterState==="saving")return;
  setNewsletterState("saving");
  try{
   const response=await fetch(newsletterEndpoint!,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:subscriber,source:"floricultura-model2"})});
   if(!response.ok)throw new Error("newsletter request rejected");
   setNewsletterState("saved");setSubscriber("");
  }catch{setNewsletterState("error");}
 };
 const nav=[["Coleções","#colecoes"],["Galeria","#galeria"],["Como funciona","#como-comprar"],["Depoimentos","#depoimentos"],["Contato","#contato"]] as const;
 return <main className="pn-floral2" data-tp6-family="retail" data-tp6-variant="02" data-tp6-floral="true" aria-label={"Floricultura "+business}>
  <header className="pn-floral2-header" id="inicio">
   <a className="pn-floral2-brand" href="#inicio">{businessShort}<small>ATELIER FLORAL</small></a>
   <button className="pn-floral2-menu" type="button" aria-label={menuOpen?"Fechar menu":"Abrir menu"} aria-expanded={menuOpen} aria-controls="pn-floral2-nav" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?"✕":"☰"}</button>
   <nav className={"pn-floral2-nav"+(menuOpen?" is-open":"")} aria-label="Navegação principal" id="pn-floral2-nav">{nav.map(([label,href])=><a href={href} key={href} onClick={()=>setMenuOpen(false)}>{label}</a>)}</nav>
   <a className="pn-floral2-header-cta" href="#contato">Encomendar flores ↗</a>
  </header>

  <section className="pn-floral2-hero" aria-labelledby="pn-floral2-hero-title">
   <div className="pn-floral2-hero-content"><span className="pn-floral2-eyebrow">FLORES · DESIGN · EMOÇÃO</span><h1 id="pn-floral2-hero-title">{title}</h1><p>{subheading}</p><div className="pn-floral2-hero-actions"><a href="#colecoes" className="pn-floral2-button">Conheça as coleções ↗</a><a href="#sobre" className="pn-floral2-line-link">Nosso atelier ↗</a></div><div className="pn-floral2-hero-bottom">JARDIM DE ÂMBAR / CURADORIA FLORAL</div></div>
   <figure className="pn-floral2-hero-photo"><img src={heroImage} alt="Fotografia de flores frescas e composição floral de destaque" loading="eager" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=fallback[1];}}/><figcaption>Encontre beleza nos pequenos gestos.</figcaption></figure>
  </section>

  <section className="pn-floral2-collections pn-floral2-section" id="colecoes" style={collectionColor?{backgroundColor:collectionColor}:undefined}>
   <div className="pn-floral2-headline-row"><div><span className="pn-floral2-eyebrow">01 / COLEÇÕES FLORAIS</span><h2 style={collectionTextColor?{color:collectionTextColor}:undefined}>Encontre o seu próximo encanto.</h2></div><p>Peças autorais para presentear, decorar e guardar momentos especiais.</p></div>
   <div className="pn-floral2-collection-grid">{cards.map((c,i)=><a href="#contato" className="pn-floral2-collection" key={i}><div className="pn-floral2-collection-image"><img src={c.photo} loading="lazy" alt={"Coleção floral "+c.title}/><span className="pn-floral2-number">0{i+1}</span></div><div className="pn-floral2-collection-caption"><div><h3>{c.title}</h3><p>{c.description}</p></div><span aria-hidden="true">↗</span></div></a>)}</div>
  </section>

  <section className="pn-floral2-difference pn-floral2-section" id="diferenciais"><div><span className="pn-floral2-eyebrow">02 / POR QUE ESCOLHER</span><h2>Os detalhes fazem a diferença.</h2><p>Em cada flor, um cuidado. Em cada composição, uma forma de tornar o dia especial.</p><div className="pn-floral2-feature-list">{features.map(([feature,copy],i)=><div className="pn-floral2-feature" key={feature}><span>0{i+1}</span><div><h3>{feature}</h3><p>{copy}</p></div><span aria-hidden="true">↗</span></div>)}</div></div><figure><img src={image(4)} loading="lazy" alt="Detalhes de um arranjo floral com flores naturais"/><figcaption>Flores escolhidas com cuidado e sensibilidade.</figcaption></figure></section>

  <section className="pn-floral2-gallery pn-floral2-section" id="galeria"><div className="pn-floral2-headline-row"><div><span className="pn-floral2-eyebrow">03 / NOSSO UNIVERSO</span><h2>Inspirações que florescem.</h2></div><p>Seis olhares sobre as cores, formas e texturas que inspiram o atelier.</p></div><div className="pn-floral2-mosaic">{gallery.map((g,i)=><button type="button" key={i} className={"pn-floral2-mosaic-item pn-floral2-mosaic-"+(i+1)} onClick={()=>setLightbox(i)} aria-label={"Ampliar imagem "+(i+1)+": "+g.label}><img src={g.photo} alt={g.label} loading="lazy"/><span>{String(i+1).padStart(2,"0")} / {g.label} <b aria-hidden="true">↗</b></span></button>)}</div></section>

  <section className="pn-floral2-process pn-floral2-section" id="como-comprar"><span className="pn-floral2-eyebrow">04 / SUA EXPERIÊNCIA</span><div className="pn-floral2-headline-row"><h2>Do primeiro olhar à entrega.</h2><p>Três etapas para transformar uma ideia em flores.</p></div><div className="pn-floral2-process-grid">{process.map(([step,copy],i)=><article key={step}><img src={image(i+3)} alt={"Inspiração floral da etapa "+(i+1)} loading="lazy"/><div><span>0{i+1}</span><h3>{step}</h3><p>{copy}</p></div></article>)}</div></section>

  <TP6RetailCustomSections sections={edits?.addedSections}/>

  <section className="pn-floral2-testimonials pn-floral2-section" id="depoimentos"><div className="pn-floral2-headline-row"><div><span className="pn-floral2-eyebrow">05 / VOZES E EXPERIÊNCIAS</span><h2>Flores que deixam lembranças.</h2></div><p>Depoimentos demonstrativos identificados como fictícios, sem simular avaliações verificadas.</p></div><div className="pn-floral2-testimonial-grid">{testimonialRows.map((t,i)=><article className="pn-floral2-testimonial" key={i}><span className="pn-floral2-quotes" aria-hidden="true">“</span><p>“{t.quote}”</p><div className="pn-floral2-testimonial-user">{t.portrait?<img src={t.portrait} loading="lazy" alt={t.demo?"Retrato editorial de exemplo fictício, não é um cliente real":"Foto de depoimento cadastrado"}/>:<span className="pn-floral2-avatar">{t.name.split(/\s+/).map(v=>v[0]).slice(0,2).join("")}</span>}<div><strong>{t.name}</strong><small>{t.role}</small></div></div><span className="pn-floral2-disclosure">{t.demo?"EXEMPLO FICTÍCIO · NÃO É CLIENTE REAL":"DEPOIMENTO CADASTRADO"}</span></article>)}</div></section>

  <section className="pn-floral2-faq pn-floral2-section" id="perguntas-frequentes"><div><span className="pn-floral2-eyebrow">06 / INFORMAÇÕES</span><h2>Suas dúvidas, nossa atenção.</h2><p>Respostas para ajudar a planejar a sua encomenda com mais tranquilidade.</p><img src={image(6)} alt="Flores em composição artística" loading="lazy"/></div><div className="pn-floral2-faq-list">{FAQs.map(([question,answer],i)=><div className="pn-floral2-faq-item" key={question}><button type="button" onClick={()=>setFaqOpen(faqOpen===i?null:i)} aria-expanded={faqOpen===i} aria-controls={"pn-floral2-faq-"+i}><span>{String(i+1).padStart(2,"0")}</span><strong>{question}</strong><span aria-hidden="true">{faqOpen===i?"−":"+"}</span></button>{faqOpen===i&&<p id={"pn-floral2-faq-"+i}>{answer}</p>}</div>)}</div></section>

  <section className="pn-floral2-contact pn-floral2-section" id="contato"><div className="pn-floral2-contact-cover"><span className="pn-floral2-eyebrow">07 / CONTATO E ENCOMENDAS</span><h2>Vamos criar algo inesquecível?</h2><p>Conte a ocasião e deixe as flores expressarem o que importa.</p><img src={image(5)} alt="Arranjo floral para inspirar encomendas" loading="lazy"/></div><form className="pn-floral2-contact-form" onSubmit={submitContact}><span className="pn-floral2-eyebrow">UM PEDIDO FEITO COM CARINHO</span><h3>Conte sua ideia.</h3><label htmlFor="pn-floral2-name">Nome completo</label><input id="pn-floral2-name" required autoComplete="name" maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome"/><label htmlFor="pn-floral2-phone">Telefone</label><input id="pn-floral2-phone" type="tel" required autoComplete="tel" maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="DDD + número"/><label htmlFor="pn-floral2-occasion">Ocasião</label><select id="pn-floral2-occasion" value={occasion} onChange={e=>setOccasion(e.target.value)} required><option value="">Selecione a ocasião</option>{["Aniversário","Presente especial","Evento ou casamento","Flores por assinatura","Outra ocasião"].map(o=><option key={o} value={o}>{o}</option>)}</select><label htmlFor="pn-floral2-message">Mensagem</label><textarea id="pn-floral2-message" rows={5} maxLength={2000} required value={message} onChange={e=>setMessage(e.target.value)} placeholder="Conte as flores, cores, data e preferências"/><button className="pn-floral2-button" type="submit" disabled={!canContact}>{canContact?"Preparar mensagem ↗":"Cadastre um canal de atendimento"}</button><p role="status">{canContact?"O pedido será aberto no WhatsApp ou e-mail cadastrado. Confirme o envio no aplicativo.":"Sem WhatsApp ou e-mail válidos cadastrados. Nenhuma mensagem será enviada."}</p></form></section>

  <section className="pn-floral2-newsletter pn-floral2-section" id="newsletter"><div className="pn-floral2-newsletter-content"><span className="pn-floral2-eyebrow">08 / NOVIDADES E INSPIRAÇÕES</span><h2>Deixe as flores fazerem parte dos seus dias.</h2><p>Descubra novas coleções, ideias para celebrar e inspirações do universo floral.</p><form onSubmit={saveNewsletter}><label htmlFor="pn-floral2-subscriber">Seu melhor e-mail</label><div><input type="email" id="pn-floral2-subscriber" maxLength={254} required value={subscriber} disabled={!newsletterActive||newsletterState==="saving"} onChange={e=>{setSubscriber(e.target.value);setNewsletterState("idle")}} placeholder="voce@exemplo.com"/><button type="submit" disabled={!newsletterActive||newsletterState==="saving"}>{newsletterState==="saving"?"Enviando...":"Inscrever-se ↗"}</button></div><p role="status">{!newsletterActive?"A inscrição estará disponível somente após configuração de uma integração real de newsletter.":newsletterState==="saved"?"Inscrição recebida pela integração cadastrada.":newsletterState==="error"?"A integração não confirmou o recebimento. Tente novamente.":"O cadastro será confirmado pela plataforma conectada."}</p></form></div><img src={image(7)} loading="lazy" alt="Flores elegantes em fotografia editorial de newsletter"/></section>

  <section className="pn-floral2-location pn-floral2-section" id="localizacao"><div className="pn-floral2-headline-row"><div><span className="pn-floral2-eyebrow">09 / LOCALIZAÇÃO E CONTATO</span><h2>Onde as flores se encontram.</h2></div><p>Mapa real e referência demonstrativa. A localização ilustrativa não representa uma loja física confirmada.</p></div><div className="pn-floral2-location-grid"><iframe title={addressProvided?"Mapa de localização do endereço cadastrado":"Mapa demonstrativo da região de Pinheiros, São Paulo"} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><div className="pn-floral2-location-card"><span className="pn-floral2-eyebrow">VISITE NOSSO UNIVERSO</span><h3>Um carinho em cada detalhe.</h3><p>{shownAddress}</p><small>{addressProvided?"Endereço informado no cadastro — confirme antes de publicar.":"ENDEREÇO FICTÍCIO · DEMONSTRAÇÃO · NÃO É UM ESTABELECIMENTO REAL"}</small>{canWhats?<a className="pn-floral2-button" href={"https://wa.me/"+digits} target="_blank" rel="noopener noreferrer">Conversar pelo WhatsApp ↗</a>:<span className="pn-floral2-no-whatsapp">WhatsApp indisponível · cadastre um número válido</span>}{canMail&&<a className="pn-floral2-location-email" href={"mailto:"+mail}>{mail}</a>}</div></div></section>

  <section className="pn-floral2-about pn-floral2-section" id="sobre"><div className="pn-floral2-about-pictures"><img src={image(2)} alt="Flores escolhidas para a curadoria do atelier" loading="lazy"/><img src={image(1)} alt="Arranjo floral autoral em close" loading="lazy"/></div><div className="pn-floral2-about-copy"><span className="pn-floral2-eyebrow">10 / SOBRE O ATELIER</span><h2>{edits?.historyTitle||"Flores com personalidade e afeto."}</h2><p>No Jardim de Âmbar, cada composição começa com a vontade de criar um momento especial. A delicadeza das flores encontra o design contemporâneo para dar forma a gestos, presentes e celebrações.</p><p>Nosso olhar está nas cores, nas texturas e nos pequenos detalhes — sempre respeitando a beleza de cada estação.</p><div className="pn-floral2-about-details"><div><strong>O que criamos</strong><span>Buquês autorais, arranjos personalizados e flores para eventos.</span></div><div><strong>Como encomendar</strong><span>Envie sua ideia pelo contato e confirme as condições de atendimento.</span></div></div></div></section>

  <footer className="pn-floral2-footer" id="rodape"><div className="pn-floral2-footer-row"><div><a href="#inicio" className="pn-floral2-footer-brand">{businessShort}</a><p>Flores, gestos e composições para fazer cada momento florescer.</p></div><nav aria-label="Explorar o site"><h3>Explore</h3><a href="#colecoes">Coleções</a><a href="#galeria">Galeria</a><a href="#sobre">Nosso atelier</a><a href="#depoimentos">Depoimentos</a></nav><nav aria-label="Informações"><h3>Informações</h3><a href="#como-comprar">Como encomendar</a><a href="#perguntas-frequentes">Perguntas frequentes</a><a href="#contato">Contato</a><a href="#localizacao">Localização</a></nav><div><h3>Vamos conversar?</h3><a href="#contato">Preparar encomenda ↗</a>{canMail&&<a href={"mailto:"+mail}>{mail}</a>}</div></div><div className="pn-floral2-footer-bottom"><span>© 2026 {business}. Site demonstrativo. Confirme os dados antes de publicar.</span><a href="#inicio">Voltar ao topo ↑</a></div></footer>

  {lightbox!==null&&<div className="pn-floral2-lightbox" role="dialog" aria-modal="true" aria-label={"Galeria ampliada: "+gallery[lightbox].label} onClick={()=>setLightbox(null)}><button type="button" className="pn-floral2-close" aria-label="Fechar fotografia" onClick={()=>setLightbox(null)}>✕</button><button type="button" aria-label="Fotografia anterior" onClick={e=>{e.stopPropagation();setLightbox((lightbox+5)%6)}}>‹</button><figure onClick={e=>e.stopPropagation()}><img src={gallery[lightbox].photo} alt={gallery[lightbox].label}/><figcaption>{gallery[lightbox].label} · {lightbox+1}/6</figcaption></figure><button type="button" aria-label="Próxima fotografia" onClick={e=>{e.stopPropagation();setLightbox((lightbox+1)%6)}}>›</button></div>}
 </main>;
}
