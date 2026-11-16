"use client";

import {useState,type FormEvent} from "react";
import {ArrowUpRight,CheckCircle2,ClipboardList,Mail,MessageCircle,ShieldCheck} from "lucide-react";

type Props={brand:string;whatsapp?:string;email?:string};
const SERVICES=["Revisão preventiva","Troca de óleo e filtros","Freios e suspensão","Diagnóstico eletrônico","Ar-condicionado automotivo","Alinhamento e balanceamento","Outro serviço / preciso de orientação"];

export function TP9VerticeQuote({brand,whatsapp,email}:Props){
 const phone=(whatsapp||"").replace(/\D/g,"");
 const validPhone=phone.length>=10&&phone.length<=15?phone:null;
 const validMail=email?.trim()&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())?email.trim():null;
 const hasContact=Boolean(validPhone||validMail);
 const [channel,setChannel]=useState<"whatsapp"|"email">(validPhone?"whatsapp":"email");
 const [name,setName]=useState("");
 const [reply,setReply]=useState("");
 const [vehicle,setVehicle]=useState("");
 const [service,setService]=useState("");
 const [message,setMessage]=useState("");
 const [notice,setNotice]=useState("");
 const [preparedLink,setPreparedLink]=useState("");
 const sendByWhatsapp=Boolean(validPhone&&(channel==="whatsapp"||!validMail));
 const activeChannel=sendByWhatsapp?"whatsapp":"email";
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  setPreparedLink("");
  if(!hasContact){setNotice("Nenhum canal de atendimento real foi cadastrado. Sua solicitação não foi enviada.");return;}
  if(!name.trim()||!reply.trim()||!vehicle.trim()||!service){setNotice("Preencha todos os campos obrigatórios.");return;}
  const body=["Olá! Gostaria de solicitar um orçamento com "+brand+".","",
   "Nome: "+name.trim(),"E-mail de retorno: "+reply.trim(),"Veículo (modelo/ano): "+vehicle.trim(),
   "Serviço desejado: "+service,"Detalhes: "+(message.trim()||"Não informado")].join("\n");
  if(activeChannel==="whatsapp"&&validPhone){
   const url="https://wa.me/"+validPhone+"?text="+encodeURIComponent(body);
   setPreparedLink(url);
   window.open(url,"_blank","noopener,noreferrer");
   setNotice("A mensagem foi preparada para o WhatsApp. Confirme o envio no aplicativo; o formulário não envia automaticamente.");
  }else if(validMail){
   const url="mailto:"+validMail+"?subject="+encodeURIComponent("Solicitação de orçamento — "+brand)+"&body="+encodeURIComponent(body);
   setPreparedLink(url);
   window.location.href=url;
   setNotice("O e-mail foi preparado no seu aplicativo. Revise e confirme o envio; não houve envio automático.");
  }else{
   setNotice("O canal escolhido não está disponível. Sua solicitação não foi enviada.");
  }
 }
 return <section className="pn-vq" id="tp9-orcamento" aria-labelledby="pn-vq-heading">
  <span id="tp9-contato" className="pn-vq-contact-anchor" aria-hidden="true"/>
  <style>{`
  .pn-t9c .pn-vq{--vq-orange:#fa7135;--vq-ink:#f5f8f5;--vq-muted:#b4c2bc;background:#101719;color:var(--vq-ink);font-family:Inter,Arial,sans-serif;max-width:100%;width:100%;overflow-x:clip;padding:clamp(78px,8vw,128px) clamp(22px,6vw,96px)}
  .pn-t9c .pn-vq *{box-sizing:border-box}
  .pn-t9c .pn-vq-contact-anchor{display:block;position:relative;top:-85px;height:0}
  .pn-t9c .pn-vq-shell{max-width:1420px;margin:0 auto;display:grid;grid-template-columns:minmax(0,.84fr) minmax(0,1.16fr);gap:clamp(36px,5.5vw,90px);align-items:center}
  .pn-t9c .pn-vq-copy{min-width:0;display:flex;flex-direction:column;align-items:flex-start}
  .pn-t9c .pn-vq-kicker{margin:0 0 25px;color:var(--vq-orange);font-size:11px;font-weight:900;letter-spacing:.19em;text-transform:uppercase;line-height:1.5;display:flex;align-items:center;gap:12px}
  .pn-t9c .pn-vq-kicker:before{content:"";width:29px;height:2px;background:var(--vq-orange);flex:none}
  .pn-t9c .pn-vq h2.pn-vq-title{font:900 clamp(40px,5vw,73px)/1.075 Inter,Arial,sans-serif;letter-spacing:-.055em;color:#fff;margin:0 0 25px;text-wrap:balance;max-width:660px;overflow-wrap:break-word}
  .pn-t9c .pn-vq h2.pn-vq-title em{font-style:normal;color:var(--vq-orange)}
  .pn-t9c .pn-vq p.pn-vq-intro{font-size:clamp(15px,1.3vw,18px);line-height:1.78;color:var(--vq-muted);max-width:590px;margin:0 0 34px}
  .pn-t9c .pn-vq-benefits{display:flex;flex-direction:column;gap:20px;margin:0 0 34px;padding:0;list-style:none}
  .pn-t9c .pn-vq-benefits li{display:flex;align-items:flex-start;gap:13px;font-size:14px;line-height:1.55;color:#dbe4df}
  .pn-t9c .pn-vq-benefits svg{flex:none;color:var(--vq-orange);margin-top:1px}
  .pn-t9c .pn-vq-contact{padding-top:27px;border-top:1px solid #ffffff25;width:100%;max-width:490px}
  .pn-t9c .pn-vq-contact-title{margin:0 0 15px;color:#8fa39a;font-size:11px;font-weight:850;letter-spacing:.15em;text-transform:uppercase}
  .pn-t9c .pn-vq-channel-list{display:flex;flex-wrap:wrap;gap:10px}
  .pn-t9c .pn-vq-channel{display:inline-flex;align-items:center;gap:9px;border-radius:9px;border:1px solid #ffffff35;background:#1b2628;color:#e7eee9;padding:12px 14px;text-decoration:none;font-size:13px;font-weight:750;max-width:100%;overflow-wrap:anywhere}
  .pn-t9c .pn-vq-channel svg{flex:none;color:var(--vq-orange)}
  .pn-t9c .pn-vq-empty{margin:0;color:#d6b28b;font-size:13px;line-height:1.6}
  .pn-t9c .pn-vq-card{min-width:0;border:1px solid #ffffff24;border-radius:18px;background:#1c2528;box-shadow:0 25px 65px #0006;overflow:hidden}
  .pn-t9c .pn-vq-card-top{padding:clamp(24px,3vw,39px) clamp(23px,3.3vw,44px) 25px;border-bottom:1px solid #ffffff1d;background:linear-gradient(130deg,#243034,#1c2528)}
  .pn-t9c .pn-vq-card-heading{font:850 clamp(23px,2.6vw,34px)/1.18 Inter,Arial,sans-serif;letter-spacing:-.035em;color:#fff;margin:0 0 12px}
  .pn-t9c .pn-vq-card-top p{margin:0;color:#aabdb2;font-size:13px;line-height:1.7}
  .pn-t9c .pn-vq-form{padding:clamp(23px,3.3vw,44px);display:grid;gap:22px}
  .pn-t9c .pn-vq-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
  .pn-t9c .pn-vq-field{display:flex;flex-direction:column;gap:10px;min-width:0}
  .pn-t9c .pn-vq-field.vq-full{grid-column:1/-1}
  .pn-t9c .pn-vq-field label{color:#e3eae6;font-size:12px;font-weight:800;letter-spacing:.025em;text-transform:none}
  .pn-t9c .pn-vq-field label span{color:var(--vq-orange)}
  .pn-t9c .pn-vq :is(input,select,textarea){width:100%;min-width:0;min-height:52px;background:#10191b;color:#fff;border:1px solid #4b5d59;border-radius:9px;padding:14px 15px;font:500 14px/1.4 Inter,Arial,sans-serif;outline:none;transition:border-color .2s,box-shadow .2s}
  .pn-t9c .pn-vq :is(input,select,textarea)::placeholder{color:#91a099}
  .pn-t9c .pn-vq :is(input,select,textarea):focus-visible{border-color:var(--vq-orange);box-shadow:0 0 0 3px #fa713528}
  .pn-t9c .pn-vq textarea{resize:vertical;min-height:115px}
  .pn-t9c .pn-vq-select-channel{display:grid;grid-template-columns:1fr;gap:9px}
  .pn-t9c .pn-vq-select-channel>label{font-size:12px;font-weight:800;color:#e3eae6}
  .pn-t9c .pn-vq-note{border-left:3px solid var(--vq-orange);background:#fa71350d;padding:12px 15px;color:#c5d3c9;font-size:12px;line-height:1.6;margin:0}
  .pn-t9c .pn-vq-submit{display:inline-flex;align-items:center;justify-content:center;gap:14px;min-height:57px;padding:15px 24px;width:100%;border:1px solid var(--vq-orange);border-radius:9px;background:var(--vq-orange);color:#131819;font:900 14px Inter,Arial,sans-serif;cursor:pointer;transition:transform .2s,background .2s}
  .pn-t9c .pn-vq-submit:hover:not(:disabled){transform:translateY(-2px);background:#ff9960}
  .pn-t9c .pn-vq-submit:disabled{background:#5b6560;color:#d5d9d6;cursor:not-allowed;border-color:#65726c}
  .pn-t9c .pn-vq :is(a,button):focus-visible{outline:3px solid #ffd1b0;outline-offset:4px}
  .pn-t9c .pn-vq-status{border-radius:10px;border:1px solid #fa713557;background:#fa713513;color:#f7dbcb;padding:14px;font-size:13px;line-height:1.6;margin:0;overflow-wrap:anywhere}
  .pn-t9c .pn-vq-manual{display:inline-block;color:#ffab78;font-size:13px;font-weight:800;text-decoration:underline;text-underline-offset:4px;overflow-wrap:anywhere}
  .pn-t9c .pn-vq-privacy{margin:0;color:#91a19b;font-size:12px;line-height:1.55}
  @media(max-width:1040px){.pn-t9c .pn-vq-shell{grid-template-columns:1fr;gap:32px}.pn-t9c .pn-vq-copy{max-width:830px}.pn-t9c .pn-vq h2.pn-vq-title{max-width:800px}}
  @media(max-width:650px){.pn-t9c .pn-vq{padding:65px 20px}.pn-t9c .pn-vq h2.pn-vq-title{font-size:clamp(36px,10vw,55px)}.pn-t9c .pn-vq-fields{grid-template-columns:1fr}.pn-t9c .pn-vq-card-top{padding:24px 22px}.pn-t9c .pn-vq-form{padding:22px}.pn-t9c .pn-vq-field.vq-full{grid-column:auto}}
  @media(prefers-reduced-motion:reduce){.pn-t9c .pn-vq :is(input,select,textarea),.pn-t9c .pn-vq-submit{transition:none}}
 `}</style>
  <div className="pn-vq-shell">
   <div className="pn-vq-copy">
    <p className="pn-vq-kicker">09 / Solicite um orçamento</p>
    <h2 className="pn-vq-title" id="pn-vq-heading">Vamos cuidar do <em>seu veículo?</em></h2>
    <p className="pn-vq-intro">Conte o que seu carro precisa. Organizamos as informações para você encaminhar uma solicitação ao contato oficial da Vértice Auto Center.</p>
    <ul className="pn-vq-benefits">
     <li><CheckCircle2 size={21} aria-hidden="true"/>Informe seu veículo e o serviço desejado.</li>
     <li><ClipboardList size={21} aria-hidden="true"/>Descreva os detalhes que podem ajudar na avaliação.</li>
     <li><ShieldCheck size={21} aria-hidden="true"/>Confirme diretamente valores, condições e prazos antes de autorizar qualquer serviço.</li>
    </ul>
    <div className="pn-vq-contact"><p className="pn-vq-contact-title">Canais cadastrados</p>
     <div className="pn-vq-channel-list">{validPhone&&<a className="pn-vq-channel" href={"https://wa.me/"+validPhone} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true"/> WhatsApp</a>}
      {validMail&&<a className="pn-vq-channel" href={"mailto:"+validMail}><Mail size={18} aria-hidden="true"/>{validMail}</a>}
      {!hasContact&&<p className="pn-vq-empty">Ainda não foi cadastrado WhatsApp ou e-mail para atendimento.</p>}
     </div>
    </div>
   </div>
   <div className="pn-vq-card">
    <div className="pn-vq-card-top"><h3 className="pn-vq-card-heading">Peça seu orçamento</h3><p>Preencha os dados para preparar sua mensagem. O envio será confirmado no aplicativo de contato.</p></div>
    <form className="pn-vq-form" onSubmit={submit}>
     <div className="pn-vq-fields">
      <div className="pn-vq-field"><label htmlFor="pn-vq-name">Nome completo <span>*</span></label><input id="pn-vq-name" name="name" autoComplete="name" required placeholder="Como podemos chamar você?" maxLength={120} value={name} onChange={event=>setName(event.target.value)}/></div>
      <div className="pn-vq-field"><label htmlFor="pn-vq-reply">E-mail para retorno <span>*</span></label><input id="pn-vq-reply" name="email" type="email" autoComplete="email" required placeholder="seuemail@exemplo.com" maxLength={200} value={reply} onChange={event=>setReply(event.target.value)}/></div>
      <div className="pn-vq-field"><label htmlFor="pn-vq-vehicle">Veículo (modelo e ano) <span>*</span></label><input id="pn-vq-vehicle" name="vehicle" required placeholder="Ex.: Hatch, 2021" maxLength={160} value={vehicle} onChange={event=>setVehicle(event.target.value)}/></div>
      <div className="pn-vq-field"><label htmlFor="pn-vq-service">Serviço desejado <span>*</span></label><select id="pn-vq-service" name="service" required value={service} onChange={event=>setService(event.target.value)}><option value="">Selecione o serviço</option>{SERVICES.map(item=><option key={item} value={item}>{item}</option>)}</select></div>
      <div className="pn-vq-field vq-full"><label htmlFor="pn-vq-details">Descreva sua necessidade</label><textarea id="pn-vq-details" name="details" rows={4} maxLength={2000} placeholder="Conte mais sobre o problema, sintomas ou serviço procurado." value={message} onChange={event=>setMessage(event.target.value)}/></div>
     </div>
     {validPhone&&validMail&&<div className="pn-vq-select-channel"><label htmlFor="pn-vq-channel">Canal para preparar a solicitação</label><select id="pn-vq-channel" value={channel} onChange={event=>setChannel(event.target.value==="email"?"email":"whatsapp")}><option value="whatsapp">WhatsApp cadastrado</option><option value="email">E-mail cadastrado</option></select></div>}
     <p className="pn-vq-note">{hasContact?"O formulário não envia mensagens sozinho. Revise e confirme o envio no WhatsApp ou no aplicativo de e-mail.":"Envio indisponível porque a empresa ainda não cadastrou um canal oficial de atendimento."}</p>
     <button type="submit" className="pn-vq-submit" disabled={!hasContact}>{hasContact?"Preparar solicitação":"Contato não disponível"} <ArrowUpRight size={19} aria-hidden="true"/></button>
     {notice&&<p className="pn-vq-status" role="status">{notice}</p>}
     {preparedLink&&<a className="pn-vq-manual" href={preparedLink} target={activeChannel==="whatsapp"?"_blank":undefined} rel={activeChannel==="whatsapp"?"noopener noreferrer":undefined}>Abrir mensagem preparada manualmente ↗</a>}
     <p className="pn-vq-privacy">Os dados preenchidos são usados apenas para compor a mensagem neste navegador; este formulário não confirma orçamento, agendamento ou prestação de serviço.</p>
    </form>
   </div>
  </div>
 </section>;
}
