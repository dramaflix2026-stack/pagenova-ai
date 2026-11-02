"use client";
import {useState} from "react";
import "./builder-v2-tp8-model2-faq-contact.css";
type Props={brand:string;niche:string;email?:string;whatsapp?:string};
const groups:[RegExp,string,[string,string][]][]=[
[/resort|praia|litoral|hotel|hosped|pousada|hostel|chal[eé]|cabana|boutique/i,"hospedagem",[
["Como consultar acomodações e disponibilidade?","Consulte apenas acomodações e datas efetivamente publicadas. Para confirmar disponibilidade, utilize os canais oficiais cadastrados."],
["As fotografias representam quartos disponíveis?","Fotografias identificadas como ilustrativas são referências visuais e não representam acomodações disponíveis."],
["Onde encontro tarifas e condições?","Tarifas, políticas e condições só devem ser consideradas quando cadastradas e confirmadas pela empresa."],
["Como esclarecer dúvidas antes de uma reserva?","Utilize os canais oficiais informados na página. Nenhuma reserva é realizada automaticamente por esta seção."]]],
[/ecotur|natureza|aventura|trilha|camping|glamping/i,"natureza e aventura",[
["Como consultar experiências disponíveis?","Verifique as experiências efetivamente cadastradas e confirme os detalhes diretamente com a empresa."],
["As imagens mostram atividades oferecidas?","Imagens ilustrativas não comprovam a oferta de passeios ou atividades."],
["Como verificar requisitos de participação?","Confirme requisitos, equipamentos e condições com a equipe pelos canais oficiais cadastrados."],
["Como consultar datas e valores?","Datas e valores precisam ser informados e confirmados pela empresa."]]],
[/viage|ag[eê]ncia|turismo|destino|passeio|roteiro|excurs[aã]o/i,"viagens e destinos",[
["Como conhecer os roteiros disponíveis?","Consulte roteiros e informações publicados pela empresa. Referências visuais não constituem ofertas."],
["As fotografias representam destinos oferecidos?","Somente informações cadastradas podem identificar destinos ou passeios efetivamente ofertados."],
["Como verificar datas, condições e valores?","Confirme os detalhes pelos canais oficiais; esta página não pressupõe disponibilidade."],
["Como solicitar informações sobre uma viagem?","Use o formulário de contato para preparar uma mensagem no canal cadastrado."]]],
[/spa|retiro|wellness|bem-estar/i,"bem-estar",[
["Como consultar experiências disponíveis?","Consulte as informações cadastradas pela empresa e confirme a oferta pelos canais oficiais."],
["As imagens representam os espaços reais?","Fotografias ilustrativas não comprovam instalações ou serviços."],
["Como confirmar horários e condições?","Consulte os dados oficiais cadastrados ou entre em contato com a equipe."],
["Como solicitar informações?","Prepare uma mensagem pelo formulário e conclua o envio no canal de atendimento."]]],
[/evento|experi[eê]ncia|gastronom/i,"eventos e experiências",[
["Como conhecer as experiências oferecidas?","Consulte as experiências cadastradas e confirme os detalhes com a equipe."],
["As fotografias mostram eventos realizados?","Imagens ilustrativas são referências e não comprovam eventos ou serviços."],
["Como verificar datas e condições?","Confirme datas, capacidade e condições pelos canais oficiais cadastrados."],
["Como entrar em contato?","Utilize o formulário para preparar uma mensagem no WhatsApp ou e-mail cadastrado."]]],
[/./i,"turismo e experiências",[
["Como conhecer as experiências disponíveis?","Consulte as informações publicadas e confirme a oferta diretamente com a empresa."],
["As fotografias são de serviços reais?","Imagens identificadas como ilustrativas são referências visuais."],
["Como consultar disponibilidade e valores?","Somente dados cadastrados e confirmados pela empresa devem ser considerados."],
["Como solicitar informações?","Utilize os canais oficiais disponibilizados na página."]]]];
export function BuilderV2TP8Model2FaqContact({brand,niche,email,whatsapp}:Props){
 const [active,setActive]=useState<number|null>(0);
 const [name,setName]=useState("");const [sender,setSender]=useState("");const [message,setMessage]=useState("");const [status,setStatus]=useState("");
 const group=groups.find(([re])=>re.test(niche))||groups[groups.length-1];
 const digits=(whatsapp||"").replace(/\D/g,"");
 const wa=digits.length>=10&&digits.length<=15?"https://wa.me/"+digits:null;
 const mail=email?.trim()&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())?email.trim():null;
 const submit=(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();setStatus("");if(!wa&&!mail){setStatus("Nenhum canal de contato está cadastrado. A mensagem não foi enviada.");return;}const body=["Olá! Gostaria de obter informações sobre "+niche+".","Nome: "+name.trim(),"E-mail: "+sender.trim(),"Mensagem: "+message.trim()].join("\n");if(wa){const url=wa+"?text="+encodeURIComponent(body);const win=window.open(url,"_blank","noopener,noreferrer");setStatus(win?"Revise e envie a mensagem no WhatsApp. O envio não foi confirmado.":"Se o WhatsApp não abriu, verifique o bloqueio de pop-ups. A mensagem não foi enviada.");}else if(mail){window.location.href="mailto:"+mail+"?subject="+encodeURIComponent("Contato — "+brand)+"&body="+encodeURIComponent(body);setStatus("Revise e envie no aplicativo de e-mail. O envio não foi confirmado.");}};
 return <div className="tp8m2-fc"><section id="faq-tp8" className="tp8m2-faq" aria-labelledby="tp8m2-faq-heading"><div className="tp8m2-fc-meta"><span>07 / PERGUNTAS FREQUENTES</span><span>INFORMAÇÕES ESSENCIAIS</span></div><div className="tp8m2-faq-layout"><div className="tp8m2-faq-intro"><span>SUAS DÚVIDAS, NOSSAS RESPOSTAS</span><h2 id="tp8m2-faq-heading">Tudo começa com uma boa <i>pergunta.</i></h2><p>Informações gerais sobre {group[1]}. Consulte a empresa para confirmar detalhes específicos.</p></div><div className="tp8m2-faq-items">{group[2].map(([q,a],i)=><div className="tp8m2-faq-item" key={q}><button type="button" aria-expanded={active===i} aria-controls={"tp8m2-faq-answer-"+i} onClick={()=>setActive(v=>v===i?null:i)}><span>{String(i+1).padStart(2,"0")}</span><strong>{q}</strong><span aria-hidden="true">{active===i?"−":"+"}</span></button><div id={"tp8m2-faq-answer-"+i} hidden={active!==i}><p>{a}</p></div></div>)}</div></div></section><section id="contato-tp8" className="tp8m2-contact" aria-labelledby="tp8m2-contact-heading"><div className="tp8m2-fc-meta"><span>08 / ENTRE EM CONTATO</span><span>{niche.toLocaleUpperCase("pt-BR")}</span></div><div className="tp8m2-contact-layout"><div className="tp8m2-contact-intro"><span>VAMOS CONVERSAR</span><h2 id="tp8m2-contact-heading">Sua próxima história começa com uma <i>conversa.</i></h2><p>Conte o que procura. Sua mensagem será preparada no canal oficial cadastrado e precisará ser enviada por você.</p><div className="tp8m2-contact-links">{mail&&<a href={"mailto:"+mail}>{mail} ↗</a>}{wa&&<a href={wa} target="_blank" rel="noopener noreferrer">WHATSAPP ↗</a>}{!mail&&!wa&&<p>Canais de contato ainda não cadastrados.</p>}</div></div><form className="tp8m2-contact-form" onSubmit={submit}><label htmlFor="tp8m2-name">SEU NOME</label><input id="tp8m2-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Como podemos chamar você?" maxLength={120} required/><label htmlFor="tp8m2-email">SEU E-MAIL</label><input id="tp8m2-email" type="email" value={sender} onChange={e=>setSender(e.target.value)} placeholder="seu@email.com" maxLength={254} required/><label htmlFor="tp8m2-message">SUA MENSAGEM</label><textarea id="tp8m2-message" value={message} onChange={e=>setMessage(e.target.value)} placeholder="Conte o que você procura..." minLength={5} maxLength={4000} rows={5} required/><button type="submit" disabled={!wa&&!mail}>PREPARAR MENSAGEM <span aria-hidden="true">↗</span></button><p className="tp8m2-contact-status" role="status">{status||(!wa&&!mail?"Cadastre um e-mail ou WhatsApp para habilitar o contato.":"A mensagem só será enviada após sua confirmação no WhatsApp ou aplicativo de e-mail.")}</p></form></div></section></div>;
}
