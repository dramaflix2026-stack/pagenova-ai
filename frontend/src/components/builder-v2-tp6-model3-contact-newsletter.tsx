"use client";
import {useState} from "react";
import "./builder-v2-tp6-model3-contact-newsletter.css";
type Props={niche:string;email?:string;whatsapp?:string;address?:string};
export function BuilderV2TP6Model3ContactNewsletter({niche,email,whatsapp,address}:Props){
 const [name,setName]=useState("");const [sender,setSender]=useState("");const [message,setMessage]=useState("");const [subscriber,setSubscriber]=useState("");
 const digits=(whatsapp||"").replace(/\D/g,"");
 const validEmail=!!email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 const hasWhatsapp=digits.length>=10&&digits.length<=15;
 const contactUrl=validEmail?"mailto:"+email+"?subject="+encodeURIComponent("Contato pelo site — "+niche)+"&body="+encodeURIComponent("Nome: "+name+"\nE-mail: "+sender+"\nMensagem: "+message):hasWhatsapp?"https://wa.me/"+digits+"?text="+encodeURIComponent("Olá! Sou "+name+" ("+sender+"). "+message):"";
 const newsletterUrl=validEmail?"mailto:"+email+"?subject="+encodeURIComponent("Solicitação de inscrição — novidades")+"\u0026body="+encodeURIComponent("Gostaria de solicitar inscrição com o e-mail: "+subscriber):"";
 return <div className="tp6m3 tp6m3-contact-news">
 <section id="contato" className="tp6m3-contact" aria-labelledby="tp6m3-contact-title">
 <div className="tp6m3-section-meta"><span>08 / CONTATO</span><span>VAMOS CONVERSAR</span></div>
 <div className="tp6m3-contact-grid"><div className="tp6m3-contact-intro"><span className="tp6m3-contact-kicker">SUA PRÓXIMA CONVERSA COMEÇA AQUI</span><h2 id="tp6m3-contact-title">FALE<br/>COM A<br/>GENTE<span>.</span></h2><p>Tem alguma dúvida sobre {niche.toLocaleLowerCase("pt-BR")}? Fale com a nossa equipe e descubra mais sobre nossas peças.</p><div className="tp6m3-contact-links">{validEmail&&<a href={"mailto:"+email}>{email}</a>}{hasWhatsapp&&<a href={"https://wa.me/"+digits} target="_blank" rel="noopener noreferrer">WHATSAPP ↗</a>}{address&&<span>{address}</span>}</div></div>
 <form className="tp6m3-contact-form" onSubmit={e=>{e.preventDefault();if(contactUrl)window.location.href=contactUrl}}>
 <span className="tp6m3-form-label">ENVIE SUA MENSAGEM / 01</span>
 <label>01 / SEU NOME<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Como podemos chamar você?"/></label>
 <label>02 / SEU E-MAIL<input type="email" required maxLength={254} value={sender} onChange={e=>setSender(e.target.value)} placeholder="Seu endereço de e-mail"/></label>
 <label>03 / SUA MENSAGEM<textarea required rows={4} maxLength={3000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Escreva sua dúvida"/></label>
 <button type="submit" disabled={!contactUrl}>PREPARAR MENSAGEM <span aria-hidden="true">↗</span></button>
 <p className="tp6m3-form-note" role="status">{contactUrl?"Ao continuar, você poderá revisar e enviar sua mensagem no aplicativo de contato.":"O atendimento por mensagem estará disponível em breve."}</p>
 </form></div></section>
 <section id="newsletter" className="tp6m3-newsletter" aria-labelledby="tp6m3-news-title"><div className="tp6m3-section-meta"><span>09 / NEWSLETTER</span><span>CONTINUE POR PERTO</span></div><div className="tp6m3-newsletter-grid"><div><span className="tp6m3-news-kicker">FIQUE POR DENTRO</span><h2 id="tp6m3-news-title">NOVIDADES<br/>À VISTA<span>.</span></h2><p>Quer acompanhar novidades e descobertas? Solicite sua inscrição pelo canal cadastrado pela loja.</p></div><form onSubmit={e=>{e.preventDefault();if(newsletterUrl)window.location.href=newsletterUrl}}><label htmlFor="tp6m3-news-email">SEU MELHOR E-MAIL</label><div className="tp6m3-newsletter-input"><input id="tp6m3-news-email" type="email" required maxLength={254} placeholder="voce@exemplo.com" value={subscriber} onChange={e=>setSubscriber(e.target.value)}/><button type="submit" disabled={!newsletterUrl} aria-label="Solicitar inscrição">↗</button></div><p className="tp6m3-form-note" role="status">{newsletterUrl?"Revise sua solicitação no aplicativo de e-mail antes de enviar.":"Em breve você poderá solicitar novidades por aqui."}</p></form></div></section>
 </div>;
}
