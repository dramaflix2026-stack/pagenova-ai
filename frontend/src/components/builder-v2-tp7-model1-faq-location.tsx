"use client";
import {useState} from "react";
import "./builder-v2-tp7-model1-faq-location.css";
type Props={brand:string;niche:string;address?:string;email?:string;whatsapp?:string};
const questions=[
 ["Como posso conhecer os imóveis ou projetos?","Explore as informações e imagens disponíveis no site. Para saber mais sobre uma opção específica, utilize o canal de contato cadastrado pela empresa."],
 ["Como consultar disponibilidade e valores?","A disponibilidade e os valores dependem de cada imóvel ou projeto. Consulte as informações cadastradas e confirme os detalhes diretamente com a empresa."],
 ["É possível solicitar uma visita?","Entre em contato para consultar a possibilidade de visita e os horários disponíveis. O agendamento depende de confirmação da empresa."],
 ["Quais informações preciso para comprar ou alugar?","Os requisitos variam conforme o tipo de imóvel e a operação. Solicite as orientações aplicáveis ao seu caso pelo canal de atendimento."],
 ["Como encontro mais detalhes sobre uma propriedade?","Consulte a descrição do imóvel ou projeto. Se precisar de informações adicionais, encaminhe sua dúvida à equipe."]
];
export function BuilderV2TP7Model1FaqLocation({brand,niche,address,email,whatsapp}:Props){
 const [expanded,setExpanded]=useState<number|null>(0);
 const hasAddress=Boolean(address?.trim());const digits=(whatsapp||"").replace(/\D/g,"");
 const wa=digits.length>=10&&digits.length<=15?"https://wa.me/"+digits:null;
 const mail=email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null;
 const maps=hasAddress?"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(address!.trim()):null;
 return <div className="tp7m1-final-sections">
 <section id="faq-tp7" className="tp7m1-faq" aria-labelledby="tp7m1-faq-title"><div className="tp7m1-faq-meta"><span>07 / PERGUNTAS FREQUENTES</span><span>INFORMAÇÕES ESSENCIAIS</span></div><div className="tp7m1-faq-layout"><div className="tp7m1-faq-intro"><span>ANTES DO PRÓXIMO PASSO</span><h2 id="tp7m1-faq-title">Suas dúvidas, <i>nossas respostas.</i></h2><p>Informações para explorar {niche.toLocaleLowerCase("pt-BR")} com mais clareza. Para detalhes de imóveis específicos, consulte a empresa.</p></div><div className="tp7m1-faq-list">{questions.map(([q,a],i)=><div className="tp7m1-faq-item" key={q}><h3><button type="button" aria-expanded={expanded===i} aria-controls={"tp7m1-answer-"+i} onClick={()=>setExpanded(expanded===i?null:i)}><span className="tp7m1-faq-number">{String(i+1).padStart(2,"0")}</span><span>{q}</span><span className="tp7m1-faq-symbol" aria-hidden="true">{expanded===i?"−":"+"}</span></button></h3>{expanded===i&&<p id={"tp7m1-answer-"+i}>{a}</p>}</div>)}</div></div></section>
 <section id="localizacao-tp7" className="tp7m1-location" aria-labelledby="tp7m1-location-title"><div className="tp7m1-location-photo"><img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1500&q=85" alt="Fotografia arquitetônica ilustrativa de ambiente contemporâneo" loading="lazy"/><span>08 / ARQUITETURA & ESPAÇOS</span></div><div className="tp7m1-location-info"><span className="tp7m1-location-kicker">CONTATO & LOCALIZAÇÃO</span><h2 id="tp7m1-location-title">Vamos nos <i>encontrar.</i></h2><p>Descubra como entrar em contato com {brand} e consulte as informações de localização disponibilizadas pela empresa.</p><div className="tp7m1-location-details">{hasAddress?<div><span>ENDEREÇO CADASTRADO</span><p>{address}</p>{maps&&<a href={maps} target="_blank" rel="noopener noreferrer">VER NO GOOGLE MAPS ↗</a>}</div>:<div><span>LOCALIZAÇÃO</span><p>O endereço será exibido quando cadastrado pela empresa.</p></div>}{mail&&<div><span>E-MAIL</span><a href={"mailto:"+mail}>{mail}</a></div>}{wa&&<div><span>WHATSAPP</span><a href={wa} target="_blank" rel="noopener noreferrer">INICIAR CONVERSA ↗</a></div>}</div><a className="tp7m1-location-action" href="#contato-tp7">ENVIAR UMA MENSAGEM <span aria-hidden="true">↗</span></a></div></section></div>;
}
