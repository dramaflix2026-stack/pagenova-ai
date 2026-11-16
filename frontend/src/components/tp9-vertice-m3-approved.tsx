"use client";

import {useEffect,useRef,useState,type FormEvent,type ReactNode,type SyntheticEvent} from "react";
import {ArrowLeft,ArrowRight,ArrowUpRight,Check,ChevronDown,ChevronLeft,ChevronRight,MapPin,Menu,MessageCircle,ShieldCheck, X} from "lucide-react";
import "./tp9-vertice-m3-approved.css";

type Review={name:string;role:string;quote:string};
type FAQ={question:string;answer:string};
type Photo={src:string;caption?:string};
type Props={brand:string;niche:string;email?:string;whatsapp?:string;address?:string;gallery?:Photo[];reviews?:Review[];faqs?:FAQ[];customSections?:ReactNode;reviewsSection?:ReactNode;locationSection?:ReactNode};

const photo=(id:string,width=1400)=>"https://unsplash.com/photos/"+id+"/download?force=true&w="+width;
const photoFallback="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1500&q=85";
const onPhotoError=(event:SyntheticEvent<HTMLImageElement>)=>{
 const image=event.currentTarget;
 if(image.dataset.fallbackApplied!=="yes"){image.dataset.fallbackApplied="yes";image.src=photoFallback;}
};
const source={
 hero:"VdXnpwrp1qc",
 team:["8t6tk7LYLrE","KhF58h0hTbc"],
 differences:"WbKt-WmdMf8",
 process:["EJr3XkHdBm0","s4d_ESS0ylA","NjnftJ6_QCo"],
 contact:"wacb2ChxA4k",
 gallery:["erWc6mrOq_I","-ApM9rASMbA","XP8o9_Arwqg","0OPC0-DfEbM","8IOn8x1zrGE","ZFIgxM5BP5g"]
};
const services=[
 {title:"Revisão preventiva",description:"Inspeção periódica e orientações para cuidar do veículo.",photo:"rU_bvNfr8pQ"},
 {title:"Diagnóstico eletrônico",description:"Verificação dos sintomas e sistemas para orientar a avaliação.",photo:"KhF58h0hTbc"},
 {title:"Troca de óleo e filtros",description:"Cuidados ligados à lubrificação e à manutenção periódica.",photo:"gW34cv-Ojjs"},
 {title:"Freios e suspensão",description:"Avaliação dos componentes ligados ao controle e à segurança.",photo:"wacb2ChxA4k"},
 {title:"Ar-condicionado automotivo",description:"Orientação sobre inspeção e manutenção de climatização.",photo:"wtXnp09Q86w"},
 {title:"Alinhamento e balanceamento",description:"Consulta sobre inspeção e ajustes de rodas.",photo:"8IOn8x1zrGE"}
];
const stages=[
 {title:"Primeiro contato",description:"Conte qual é o seu veículo e descreva o serviço ou sintoma que precisa avaliar.",photo:source.process[0]},
 {title:"Avaliação do veículo",description:"A equipe orienta as verificações e informa quando será necessária uma inspeção técnica.",photo:source.process[1]},
 {title:"Definição do atendimento",description:"Confirme os serviços indicados, as condições, os valores e a disponibilidade antes de autorizar.",photo:source.process[2]}
];
const advantages=[
 {title:"Atenção à necessidade",description:"Entender o que você procura antes de recomendar os próximos passos."},
 {title:"Cuidado técnico",description:"Orientações ligadas à avaliação e à manutenção do veículo."},
 {title:"Comunicação transparente",description:"Prazos, valores e disponibilidade confirmados diretamente com a equipe."},
 {title:"Cada etapa importa",description:"Um atendimento organizado, do primeiro contato às orientações finais."}
];
const fallbackFAQ:FAQ[]=[
 {question:"Quais serviços posso consultar?",answer:"Consulte revisão preventiva, diagnóstico eletrônico, troca de óleo e filtros, freios e suspensão, ar-condicionado, alinhamento e balanceamento. Confirme a disponibilidade diretamente com a equipe."},
 {question:"Como solicito uma avaliação?",answer:"Informe o veículo, o serviço desejado e os sintomas observados pelo formulário. Quando houver canal oficial cadastrado, a mensagem será preparada para você confirmar o envio."},
 {question:"Como funciona a avaliação do veículo?",answer:"A empresa poderá orientar as verificações necessárias com base nas informações apresentadas. A realização e as condições de uma inspeção técnica devem ser confirmadas com a equipe."},
 {question:"Posso saber o valor antes de autorizar?",answer:"Solicite as informações sobre o serviço desejado. Valores e itens incluídos dependem da avaliação e precisam ser confirmados diretamente com a empresa."},
 {question:"Como consulto prazos e disponibilidade?",answer:"Prazos e horários variam conforme o tipo de serviço e a agenda. A confirmação é feita pelos canais oficiais cadastrados."},
 {question:"Preciso agendar o atendimento?",answer:"Consulte a equipe para confirmar se é necessário agendamento. Este site não confirma reservas ou horários automaticamente."}
];
const placeholderReviews:Review[]=[
 {name:"Cliente demonstrativo 01",role:"Exemplo de apresentação",quote:"Espaço reservado para uma avaliação real sobre a experiência de atendimento."},
 {name:"Cliente demonstrativo 02",role:"Exemplo de apresentação",quote:"Espaço reservado para o relato real de uma pessoa atendida pela equipe."},
 {name:"Cliente demonstrativo 03",role:"Exemplo de apresentação",quote:"Exemplo de card que poderá mostrar um comentário autorizado pelo cliente."},
 {name:"Cliente demonstrativo 04",role:"Exemplo de apresentação",quote:"Esta área será substituída por uma avaliação verdadeira quando cadastrada."},
 {name:"Cliente demonstrativo 05",role:"Exemplo de apresentação",quote:"O depoimento definitivo deverá ter nome e texto fornecidos pela empresa."},
 {name:"Cliente demonstrativo 06",role:"Exemplo de apresentação",quote:"Modelo visual da seção, sem representar uma avaliação ou nota real."}
];
const validEmail=(raw?:string)=>{const v=(raw||"").trim();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)?v:undefined;};
const validPhone=(raw?:string)=>{const digits=(raw||"").replace(/\D/g,"");const normalized=digits.length===10||digits.length===11?"55"+digits:digits;return /^55\d{10,11}$/.test(normalized)?normalized:undefined;};

export function TP9VerticeModel3Approved({brand,email,whatsapp,address,gallery=[],reviews=[],faqs=[],customSections,locationSection}:Props){
 const [menuOpen,setMenuOpen]=useState(false);
 const [openedFAQ,setOpenedFAQ]=useState<number|null>(0);
 const [selectedPhoto,setSelectedPhoto]=useState<number|null>(null);
 const [contactStatus,setContactStatus]=useState("");
 const [contactLink,setContactLink]=useState("");
 const photoButtons=useRef<(HTMLButtonElement|null)[]>([]);
 const returnFocus=useRef<HTMLButtonElement|null>(null);
 const safePhone=validPhone(whatsapp);
 const safeEmail=validEmail(email);
 const hasContact=Boolean(safePhone||safeEmail);
 const directContact=safePhone?"https://wa.me/"+safePhone:safeEmail?"mailto:"+safeEmail:"#tp9v3-contact";
 const providedGallery=gallery.filter(item=>/^https?:\/\//i.test(item.src)).slice(0,6);
 const photoCaptions=["Mecânico realizando inspeção do motor","Equipamentos de pneus e balanceamento","Profissional trabalhando no motor de um veículo","Veículo elevado para manutenção","Balanceamento de roda em oficina","Inspeção técnica com lanterna no compartimento do motor"];
 const photos=[...providedGallery,...source.gallery.slice(0,6-providedGallery.length).map((id,index)=>({src:photo(id),caption:photoCaptions[providedGallery.length+index]}))].slice(0,6);
 const validReviews=reviews.filter(item=>item.name?.trim()&&item.quote?.trim()).slice(0,6);
 const reviewCards=[...validReviews.map(item=>({...item,demonstrative:false})),...placeholderReviews.slice(0,6-validReviews.length).map(item=>({...item,demonstrative:true}))];
 const customFAQs=faqs.filter(item=>item.question?.trim()&&item.answer?.trim()).slice(0,6);
 const faqCards=[...customFAQs,...fallbackFAQ.filter(item=>!customFAQs.some(other=>other.question.toLocaleLowerCase("pt-BR")===item.question.toLocaleLowerCase("pt-BR")))].slice(0,6);
 const hasAddress=Boolean(address?.trim());
 const fictionalAddress=/fict[ií]ci|ilustrativ|exemplo/i.test(address||"");
 const contactImage=photo(source.contact);

 const closePhoto=()=>setSelectedPhoto(null);
 useEffect(()=>{
  if(selectedPhoto===null){returnFocus.current?.focus();returnFocus.current=null;return;}
  const previous=document.body.style.overflow;
  document.body.style.overflow="hidden";
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==="Escape")setSelectedPhoto(null);
   if(e.key==="ArrowRight")setSelectedPhoto(current=>current===null?null:(current+1)%photos.length);
   if(e.key==="ArrowLeft")setSelectedPhoto(current=>current===null?null:(current+photos.length-1)%photos.length);
  };
  document.addEventListener("keydown",onKey);
  return ()=>{document.removeEventListener("keydown",onKey);document.body.style.overflow=previous;};
 },[selectedPhoto,photos.length]);
 function submitContact(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  setContactLink("");
  if(!hasContact){setContactStatus("Não há WhatsApp ou e-mail oficial cadastrado. A solicitação não foi enviada.");return;}
  const data=new FormData(e.currentTarget);
  const name=String(data.get("name")||"").trim();
  const sender=String(data.get("sender")||"").trim();
  const vehicle=String(data.get("vehicle")||"").trim();
  const message=String(data.get("message")||"").trim();
  if(!name||!sender||!vehicle||!message){setContactStatus("Preencha os campos obrigatórios para preparar sua mensagem.");return;}
  const body=["Olá! Gostaria de consultar um atendimento no "+brand+".","","Nome: "+name,"Contato para retorno: "+sender,"Veículo: "+vehicle,"Descrição: "+message].join("\n");
  if(safePhone){
   const link="https://wa.me/"+safePhone+"?text="+encodeURIComponent(body);
   setContactLink(link);window.open(link,"_blank","noopener,noreferrer");
   setContactStatus("Mensagem preparada para o WhatsApp. Confirme o envio no aplicativo. Este formulário não envia automaticamente.");
  }else if(safeEmail){
   const link="mailto:"+safeEmail+"?subject="+encodeURIComponent("Consulta automotiva — "+brand)+"&body="+encodeURIComponent(body);
   setContactLink(link);window.location.href=link;
   setContactStatus("Mensagem preparada no seu aplicativo de e-mail. Confirme o envio por lá.");
  }
 }
 return <main className="tp9v3" id="tp9v3-top">
  <section className="tp9v3-hero" aria-label="Apresentação do Vértice Auto Center">
   <img className="tp9v3-cover" src={photo(source.hero,1900)} onError={onPhotoError} alt="Fotografia de veículos em uma oficina de manutenção" />
   <header className="tp9v3-header">
    <a className="tp9v3-logo" href="#tp9v3-top" aria-label={brand+" — início"}><span className="tp9v3-mark">V.</span><span>{brand}</span></a>
    <button type="button" className="tp9v3-menuBtn" aria-label={menuOpen?"Fechar menu":"Abrir menu"} aria-controls="tp9v3-navigation" aria-expanded={menuOpen} onClick={()=>setMenuOpen(x=>!x)}>{menuOpen?<X size={23}/>:<Menu size={23}/>}</button>
    <nav id="tp9v3-navigation" className={"tp9v3-nav"+(menuOpen?" open":"")} aria-label="Navegação principal">
     <a href="#tp9v3-about" onClick={()=>setMenuOpen(false)}>Sobre</a><a href="#tp9v3-services" onClick={()=>setMenuOpen(false)}>Serviços</a><a href="#tp9v3-gallery" onClick={()=>setMenuOpen(false)}>Galeria</a><a href="#tp9v3-reviews" onClick={()=>setMenuOpen(false)}>Depoimentos</a><a href="#tp9v3-contact" onClick={()=>setMenuOpen(false)}>Contato</a>
    </nav>
    <a className="tp9v3-headerCTA" href="#tp9v3-contact">Solicitar atendimento <ArrowUpRight size={16}/></a>
   </header>
   <div className="tp9v3-heroBody tp9v3-wrap">
    <p className="tp9v3-kicker"><span className="tp9v3-line"/> CUIDADO AUTOMOTIVO · UMA NOVA PERSPECTIVA</p>
    <h1>Precisão em <span>cada detalhe.</span></h1>
    <p className="tp9v3-lead">Seu veículo merece atenção em cada etapa. Descubra soluções de manutenção, revisão e diagnóstico e converse diretamente com a equipe.</p>
    <div className="tp9v3-actions"><a className="tp9v3-button primary" href="#tp9v3-services">Explorar serviços <ArrowUpRight size={17}/></a><a className="tp9v3-button" href="#tp9v3-contact">Fale conosco <ArrowUpRight size={17}/></a></div>
   </div>
   <div className="tp9v3-heroBottom tp9v3-wrap"><span>01 / VÉRTICE AUTO CENTER</span><span>ESTÉTICA EDITORIAL · SERVIÇOS AUTOMOTIVOS</span><a href="#tp9v3-about" aria-label="Ir para a próxima seção">DESCUBRA ↓</a></div>
  </section>

  <section className="tp9v3-section tp9v3-about tp9v3-wrap" id="tp9v3-about">
   <div className="tp9v3-teamPhotos"><div className="tp9v3-teamBig"><img src={photo(source.team[0])} onError={onPhotoError} loading="lazy" alt="Profissionais trabalhando em uma oficina automotiva"/><span>ATENDIMENTO COM FOCO NO SEU VEÍCULO</span></div><div className="tp9v3-teamSmall"><img src={photo(source.team[1])} onError={onPhotoError} loading="lazy" alt="Mecânico em atividade de manutenção"/></div></div>
   <div className="tp9v3-aboutCopy"><span className="tp9v3-kicker">01 / NOSSA ESSÊNCIA</span><h2>Conheça quem <em>cuida da sua jornada.</em></h2><p>{brand} reúne soluções de atendimento automotivo e orientação para revisão, manutenção e diagnóstico. Cada solicitação começa pela compreensão das necessidades do veículo.</p><p>As fotografias são ilustrativas. Fale diretamente com a equipe para conhecer as condições dos serviços disponíveis.</p><div className="tp9v3-hairline"/><a className="tp9v3-textLink" href="#tp9v3-contact">Conhecer o atendimento <ArrowUpRight size={18}/></a></div>
  </section>

  <section className="tp9v3-section tp9v3-services" id="tp9v3-services"><div className="tp9v3-wrap">
   <div className="tp9v3-sectionHead"><div><span className="tp9v3-kicker">02 / NOSSAS SOLUÇÕES</span><h2>Serviços que <em>fazem a diferença.</em></h2></div><p>Encontre o cuidado de que seu veículo precisa. A disponibilidade dos serviços deve ser confirmada com a equipe.</p></div>
   <div className="tp9v3-serviceGrid">{services.map((item,i)=><a className="tp9v3-serviceTile" href="#tp9v3-contact" key={item.title}><img loading="lazy" onError={onPhotoError} src={photo(item.photo)} alt={"Imagem ilustrativa de contexto de oficina: "+item.title}/><div className="tp9v3-photoShade"/><div className="tp9v3-serviceContent"><span>0{i+1} / SERVIÇO AUTOMOTIVO</span><h3>{item.title}</h3><p>{item.description}</p><span className="tp9v3-circleArrow"><ArrowUpRight size={18}/></span></div></a>)}</div>
  </div></section>

  <section className="tp9v3-difference" id="tp9v3-difference"><div className="tp9v3-differencePhoto"><img loading="lazy" src={photo(source.differences)} onError={onPhotoError} alt="Profissional trabalhando em manutenção automotiva"/><span>04 PILARES DE ATENDIMENTO</span></div><div className="tp9v3-differenceCopy"><span className="tp9v3-kicker">03 / O QUE NOS MOVE</span><h2>Cada detalhe <em>importa.</em></h2><p>Uma experiência organizada, com informações claras e atenção ao que cada veículo necessita.</p><div className="tp9v3-advantages">{advantages.map((a,i)=><div className="tp9v3-advantage" key={a.title}><span>0{i+1}</span><div><h3>{a.title}</h3><p>{a.description}</p></div><ArrowUpRight size={18}/></div>)}</div></div></section>

  <section className="tp9v3-section tp9v3-process tp9v3-wrap" id="tp9v3-process">
   <div className="tp9v3-sectionHead"><div><span className="tp9v3-kicker">04 / SUA JORNADA</span><h2>Simples. <em>Do começo ao fim.</em></h2></div><p>Três etapas para facilitar seu contato. Cada atendimento depende de confirmação da equipe.</p></div>
   <div className="tp9v3-processGrid">{stages.map((step,i)=><article className="tp9v3-processTile" key={step.title}><div className="tp9v3-processPhoto"><img loading="lazy" src={photo(step.photo)} onError={onPhotoError} alt={"Imagem ilustrativa da etapa: "+step.title}/><span>0{i+1}</span></div><div className="tp9v3-processCopy"><span>ETAPA 0{i+1}</span><h3>{step.title}</h3><p>{step.description}</p></div></article>)}</div>
  </section>

  <section className="tp9v3-section tp9v3-gallery" id="tp9v3-gallery"><div className="tp9v3-wrap"><span className="tp9v3-kicker">05 / UNIVERSO AUTOMOTIVO</span><div className="tp9v3-sectionHead"><h2>Perspectivas <em>em movimento.</em></h2><p>{providedGallery.length?"Fotografias cadastradas pela empresa e imagens ilustrativas complementares.":"Imagens ilustrativas de oficinas e serviços automotivos. Não representam trabalhos realizados pela empresa."}</p></div>
   <div className="tp9v3-mosaic">{photos.map((item,i)=><figure key={item.src+i}><button ref={node=>{photoButtons.current[i]=node;}} type="button" onClick={()=>{returnFocus.current=photoButtons.current[i];setSelectedPhoto(i);}} aria-label={"Ampliar foto "+(i+1)+" da galeria"}><img loading="lazy" onError={onPhotoError} src={item.src} alt={item.caption||"Imagem ilustrativa de manutenção automotiva "+(i+1)}/><span>0{i+1} <ArrowUpRight size={18}/></span></button></figure>)}</div>
   <p className="tp9v3-galleryNote">Selecione uma imagem para ampliar · 06 FOTOGRAFIAS</p>
  </div></section>

  <section className="tp9v3-section tp9v3-reviews" id="tp9v3-reviews"><div className="tp9v3-wrap">
   <div className="tp9v3-sectionHead"><div><span className="tp9v3-kicker">06 / VOZES DOS CLIENTES</span><h2>Experiências que <em>contam histórias.</em></h2></div><p>{validReviews.length?"Depoimentos cadastrados pela empresa. Cards de demonstração estão identificados.":"Visual demonstrativo: substitua os seis cards por avaliações reais e autorizadas antes de usar como prova social."}</p></div>
   <div className="tp9v3-reviewGrid">{reviewCards.map((item,i)=><article className="tp9v3-review" key={item.name+i}><div className="tp9v3-reviewTop"><span>RELATO / 0{i+1}</span><span className="tp9v3-goldDecor" aria-hidden="true">✦ ✦ ✦</span></div><blockquote>“{item.quote}”</blockquote><div className="tp9v3-reviewBottom"><span className="tp9v3-avatar">{item.name.trim().charAt(0).toUpperCase()}</span><div><strong>{item.name}</strong><span>{item.demonstrative?"DEMONSTRATIVO — NÃO É AVALIAÇÃO REAL":item.role||"Depoimento cadastrado"}</span></div></div></article>)}</div>
  </div></section>

  <section className="tp9v3-section tp9v3-faq tp9v3-wrap" id="tp9v3-faq"><div className="tp9v3-faqGrid"><div><span className="tp9v3-kicker">07 / PERGUNTAS FREQUENTES</span><h2>Suas dúvidas, <em>respondidas.</em></h2><p>Informações gerais para ajudar você a planejar o atendimento. Sempre confirme os detalhes com a equipe.</p><a href="#tp9v3-contact" className="tp9v3-textLink">Ainda tem dúvidas? Fale conosco <ArrowUpRight size={18}/></a></div><div className="tp9v3-faqList">{faqCards.map((faq,i)=><div className="tp9v3-faqItem" key={faq.question}><button type="button" aria-expanded={openedFAQ===i} aria-controls={"tp9v3-answer-"+i} onClick={()=>setOpenedFAQ(openedFAQ===i?null:i)}><span>{String(i+1).padStart(2,"0")}</span><strong>{faq.question}</strong><ChevronDown className={openedFAQ===i?"rotated":""} size={21}/></button><div className={openedFAQ===i?"tp9v3-faqAnswer open":"tp9v3-faqAnswer"} id={"tp9v3-answer-"+i} hidden={openedFAQ!==i}><p>{faq.answer}</p></div></div>)}</div></div></section>

  {customSections}
  <section className="tp9v3-section tp9v3-contact" id="tp9v3-contact"><div className="tp9v3-wrap tp9v3-contactGrid">
   <div className="tp9v3-contactVisual"><img src={contactImage} loading="lazy" onError={onPhotoError} alt="Automóvel em ambiente de manutenção automotiva"/><div className="tp9v3-contactOverlay"><span className="tp9v3-kicker">08 / VAMOS CONVERSAR</span><h2>Seu próximo <em>passo.</em></h2><p>Descreva o que seu veículo precisa. Nossa ferramenta prepara uma mensagem para o canal oficial cadastrado.</p><div className="tp9v3-contactChannels">{safePhone&&<a href={"https://wa.me/"+safePhone} target="_blank" rel="noopener noreferrer"><MessageCircle size={17}/> WhatsApp oficial <ArrowUpRight size={16}/></a>}{safeEmail&&<a href={"mailto:"+safeEmail}>E-mail cadastrado <ArrowUpRight size={16}/></a>}</div></div></div>
   <div className="tp9v3-formPanel"><span className="tp9v3-kicker">FALE COM A EQUIPE</span><h3>Como podemos ajudar?</h3><p>Preencha seus dados para preparar o contato. Nenhuma solicitação será enviada automaticamente.</p><form onSubmit={submitContact}><label>Seu nome<input name="name" type="text" required autoComplete="name" placeholder="Como podemos chamar você?"/></label><label>Contato para retorno<input name="sender" type="text" required placeholder="E-mail ou telefone"/></label><label>Modelo e ano do veículo<input name="vehicle" type="text" required placeholder="Ex.: hatch 2022"/></label><label>O que você precisa?<textarea name="message" rows={4} required placeholder="Conte brevemente o serviço desejado"/></label><button type="submit" disabled={!hasContact}>Preparar mensagem <ArrowUpRight size={18}/></button>{!hasContact&&<p className="tp9v3-formAlert" role="status">Ainda não há um canal oficial de atendimento cadastrado. Formulário disponível somente para demonstração.</p>}{contactStatus&&<p role="status" className="tp9v3-formStatus">{contactStatus}</p>}{contactLink&&<a className="tp9v3-manualLink" target="_blank" rel="noopener noreferrer" href={contactLink}>Abrir mensagem preparada <ArrowUpRight size={15}/></a>}</form></div>
  </div>
  {hasAddress&&<div className="tp9v3-wrap tp9v3-location"><div><MapPin size={20}/><span>{fictionalAddress?"Endereço fictício — demonstração":"Endereço informado no briefing"}: {address}</span></div><p>{fictionalAddress?"A posição do mapa é apenas ilustrativa e não indica um estabelecimento real.":"Confirme o endereço e as instruções de chegada com a equipe."}</p><iframe title={"Mapa "+(fictionalAddress?"demonstrativo":"de localização informada")+" — "+brand} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={"https://www.google.com/maps?q="+encodeURIComponent(address||"")+"&output=embed"}/></div>}
  </section>
  {locationSection}

  <footer className="tp9v3-footer"><div className="tp9v3-wrap"><div className="tp9v3-footerCTA"><span className="tp9v3-kicker">09 / O PRÓXIMO CAPÍTULO</span><h2>Vamos cuidar <em>do seu próximo caminho.</em></h2><p>Uma conversa clara é o primeiro passo. Conheça nossos serviços e consulte os canais de atendimento disponíveis.</p><a className="tp9v3-button primary" href={hasContact?directContact:"#tp9v3-contact"} target={hasContact&&Boolean(safePhone)?"_blank":undefined} rel={hasContact&&Boolean(safePhone)?"noopener noreferrer":undefined}>{hasContact?"Iniciar conversa":"Consultar contato"} <ArrowUpRight size={18}/></a></div><div className="tp9v3-footerLinks"><div><a href="#tp9v3-top" className="tp9v3-footerBrand">{brand}</a><p>Precisão em cada detalhe.</p></div><nav aria-label="Navegação do rodapé"><a href="#tp9v3-about">Sobre</a><a href="#tp9v3-services">Serviços</a><a href="#tp9v3-gallery">Galeria</a><a href="#tp9v3-reviews">Depoimentos</a><a href="#tp9v3-faq">Dúvidas</a><a href="#tp9v3-contact">Contato</a></nav><div>{safePhone&&<a href={"https://wa.me/"+safePhone} target="_blank" rel="noopener noreferrer">WhatsApp oficial ↗</a>}{safeEmail&&<a href={"mailto:"+safeEmail}>{safeEmail}</a>}</div></div><div className="tp9v3-footerBottom"><span>© {new Date().getFullYear()} {brand} · Fotografias ilustrativas, salvo indicação contrária.</span><a href="#tp9v3-top">Voltar ao topo ↑</a></div></div></footer>

  {selectedPhoto!==null&&<div className="tp9v3-lightbox" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)closePhoto();}}><div className="tp9v3-lightboxDialog" role="dialog" aria-modal="true" aria-label={"Foto "+(selectedPhoto+1)+" de 6 da galeria"}><button type="button" className="tp9v3-closeLightbox" onClick={closePhoto} aria-label="Fechar fotografia ampliada"><X size={23}/></button><img onError={onPhotoError} src={photos[selectedPhoto].src} alt={photos[selectedPhoto].caption||"Fotografia automotiva ilustrativa ampliada"}/><div className="tp9v3-lightboxControls"><button type="button" aria-label="Foto anterior" onClick={()=>setSelectedPhoto((selectedPhoto+photos.length-1)%photos.length)}><ArrowLeft size={22}/></button><span>{String(selectedPhoto+1).padStart(2,"0")} / 06</span><button type="button" aria-label="Próxima foto" onClick={()=>setSelectedPhoto((selectedPhoto+1)%photos.length)}><ArrowRight size={22}/></button></div></div></div>}
 </main>;
}
