"use client";

import {useState,type FormEvent} from "react";
import {ArrowUpRight,CheckCircle2,ClipboardList,Mail,MessageCircle,ShieldCheck} from "lucide-react";

type Props={brand:string;email?:string;whatsapp?:string};
const options=["Revisão preventiva","Troca de óleo e filtros","Freios e suspensão","Diagnóstico eletrônico","Ar-condicionado automotivo","Alinhamento e balanceamento","Outro serviço / orientação"];

export function TP9VerticeM2Contact({brand,email,whatsapp}:Props){
 const phone=(whatsapp||"").replace(/\D/g,"");
 const safePhone=phone.length>=10&&phone.length<=15?phone:undefined;
 const trimmed=(email||"").trim();
 const safeEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)?trimmed:undefined;
 const hasContact=Boolean(safePhone||safeEmail);
 const [channel,setChannel]=useState<"whatsapp"|"email">(safePhone?"whatsapp":"email");
 const [name,setName]=useState("");
 const [returnContact,setReturnContact]=useState("");
 const [vehicle,setVehicle]=useState("");
 const [service,setService]=useState("");
 const [details,setDetails]=useState("");
 const [status,setStatus]=useState("");
 const [manualUrl,setManualUrl]=useState("");
 const chosen=channel==="whatsapp"&&safePhone?"whatsapp":safeEmail?"email":"whatsapp";
 function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  setManualUrl("");
  if(!hasContact){setStatus("Nenhum canal oficial de atendimento está cadastrado. Sua solicitação não foi enviada.");return;}
  if(!name.trim()||!returnContact.trim()||!vehicle.trim()||!service||!details.trim()){setStatus("Preencha os campos obrigatórios para preparar sua solicitação.");return;}
  const body=["Olá! Gostaria de consultar um atendimento com "+brand+".","",
   "Nome: "+name.trim(),"Contato para retorno: "+returnContact.trim(),
   "Veículo (modelo e ano): "+vehicle.trim(),"Serviço de interesse: "+service,
   "Detalhes: "+details.trim()].join("\n");
  if(chosen==="whatsapp"&&safePhone){
   const url="https://wa.me/"+safePhone+"?text="+encodeURIComponent(body);
   setManualUrl(url);
   window.open(url,"_blank","noopener,noreferrer");
   setStatus("A mensagem foi preparada para o WhatsApp. Confirme o envio no aplicativo; este formulário não envia automaticamente.");
  }else if(safeEmail){
   const url="mailto:"+safeEmail+"?subject="+encodeURIComponent("Consulta de atendimento — "+brand)+"&body="+encodeURIComponent(body);
   setManualUrl(url);
   window.location.href=url;
   setStatus("A mensagem foi preparada no seu aplicativo de e-mail. Revise e confirme o envio; este site não enviou a mensagem.");
  }else setStatus("O canal selecionado não está disponível. Sua solicitação não foi enviada.");
 }
 return <section className="tp9m2vc" id="tp9-contato" aria-labelledby="tp9m2vc-heading">
  <style>{`
  .tp9m2vc{--gold:#c9a36b;background:#171d19;color:#f5f8f4;width:100%;max-width:100%;overflow-x:clip;padding:clamp(75px,9vw,133px) clamp(22px,7vw,118px);font-family:Arial,Helvetica,sans-serif}
  .tp9m2vc *{box-sizing:border-box}
  .tp9m2vc .vc-layout{max-width:1430px;margin:0 auto;display:grid;grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr);align-items:start;gap:clamp(32px,5vw,84px)}
  .tp9m2vc .vc-copy{min-width:0}
  .tp9m2vc .vc-eyebrow{display:flex;align-items:center;gap:12px;color:var(--gold);font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;margin:0 0 24px}
  .tp9m2vc .vc-eyebrow:before{content:"";height:2px;width:31px;background:var(--gold)}
  .tp9m2vc h2.vc-title{font:900 clamp(42px,5.4vw,77px)/1.07 Arial,Helvetica,sans-serif;letter-spacing:-.055em;text-transform:uppercase;color:white;margin:0 0 26px;text-wrap:balance;max-width:730px}
  .tp9m2vc h2.vc-title em{font-style:normal;color:var(--gold)}
  .tp9m2vc .vc-description{font-size:clamp(15px,1.35vw,19px);line-height:1.8;color:#c1cec4;max-width:585px;margin:0 0 35px}
  .tp9m2vc .vc-benefits{display:grid;gap:20px;list-style:none;margin:0;padding:0}
  .tp9m2vc .vc-benefits li{display:flex;align-items:flex-start;gap:15px;font-size:14px;line-height:1.65;color:#dbe4db}
  .tp9m2vc .vc-benefits svg{flex:none;color:var(--gold);margin-top:2px}
  .tp9m2vc .vc-channels{border-top:1px solid #ffffff29;padding-top:29px;margin-top:38px;max-width:500px}
  .tp9m2vc .vc-channel-title{margin:0 0 17px;color:var(--gold);font-size:11px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}
  .tp9m2vc .vc-channel-list{display:flex;flex-wrap:wrap;gap:10px}
  .tp9m2vc .vc-channel{display:inline-flex;align-items:center;gap:9px;padding:13px 14px;min-height:45px;border:1px solid #d0aa7070;border-radius:8px;color:#ece2ce;background:#222b24;text-decoration:none;font-size:13px;font-weight:750;overflow-wrap:anywhere;max-width:100%}
  .tp9m2vc .vc-channel svg{flex:none;color:var(--gold)}
  .tp9m2vc .vc-channel-empty{margin:0;color:#e2c59e;font-size:13px;line-height:1.7}
  .tp9m2vc .vc-panel{min-width:0;background:#0c1110;border:1px solid #c9a36b59;border-radius:17px;overflow:hidden;box-shadow:0 30px 65px #0005}
  .tp9m2vc .vc-panel-head{padding:clamp(24px,3.1vw,41px);border-bottom:1px solid #ffffff23;background:linear-gradient(125deg,#202722,#111815)}
  .tp9m2vc .vc-panel-head h3{margin:0 0 11px;color:white;font:900 clamp(23px,2.65vw,36px)/1.2 Arial,Helvetica,sans-serif;letter-spacing:-.035em}
  .tp9m2vc .vc-panel-head p{color:#b5c2b8;font-size:14px;line-height:1.7;margin:0}
  .tp9m2vc .vc-form{padding:clamp(23px,3.1vw,41px);display:grid;gap:19px}
  .tp9m2vc .vc-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:19px}
  .tp9m2vc .vc-field{display:grid;min-width:0;gap:9px}
  .tp9m2vc .vc-field.full{grid-column:1/-1}
  .tp9m2vc .vc-field label{font-size:12px;line-height:1.5;color:#e7e9e1;font-weight:800}
  .tp9m2vc .vc-field label span{color:var(--gold)}
  .tp9m2vc :is(input,select,textarea){width:100%;min-width:0;min-height:52px;background:#19221d;border:1px solid #68776c;border-radius:7px;color:white;font:500 14px/1.5 Arial,Helvetica,sans-serif;padding:13px 15px;outline:none}
  .tp9m2vc :is(input,textarea)::placeholder{color:#b1beb2}
  .tp9m2vc :is(input,select,textarea):focus-visible{border-color:var(--gold);outline:3px solid #c9a36b45;outline-offset:1px}
  .tp9m2vc select option{background:#19221d;color:white}
  .tp9m2vc textarea{resize:vertical;min-height:125px}
  .tp9m2vc .vc-note{border-left:3px solid var(--gold);padding:13px 16px;background:#c9a36b12;color:#d1d8cd;font-size:12px;line-height:1.7;margin:0}
  .tp9m2vc .vc-send{width:100%;min-height:56px;display:inline-flex;align-items:center;justify-content:center;gap:13px;padding:15px 22px;border:1px solid var(--gold);background:var(--gold);color:#141817;font:900 13px Arial,Helvetica,sans-serif;letter-spacing:.055em;text-transform:uppercase;border-radius:6px;cursor:pointer;transition:background .2s,transform .2s}
  .tp9m2vc .vc-send:hover:not(:disabled){background:#efcc95;transform:translateY(-2px)}
  .tp9m2vc .vc-send:disabled{cursor:not-allowed;background:#65726a;color:#e4e8e1;border-color:#65726a}
  .tp9m2vc .vc-status{margin:0;border:1px solid #c9a36b6e;background:#c9a36b16;border-radius:8px;padding:13px 16px;font-size:13px;line-height:1.7;color:#f1dcc0;overflow-wrap:anywhere}
  .tp9m2vc .vc-manual{color:#f0cd97;font-size:13px;line-height:1.6;font-weight:800;text-decoration:underline;text-underline-offset:4px;overflow-wrap:anywhere}
  .tp9m2vc .vc-privacy{font-size:12px;line-height:1.6;color:#a8b7ab;margin:0}
  .tp9m2vc :is(a,button):focus-visible{outline:3px solid #ebc78d;outline-offset:4px}
  @media(max-width:1040px){.tp9m2vc .vc-layout{grid-template-columns:1fr;gap:35px}.tp9m2vc .vc-copy{max-width:800px}}
  @media(max-width:620px){.tp9m2vc{padding:65px 20px}.tp9m2vc h2.vc-title{font-size:clamp(36px,10vw,55px)}.tp9m2vc .vc-fields{grid-template-columns:1fr}.tp9m2vc .vc-field.full{grid-column:auto}.tp9m2vc .vc-form,.tp9m2vc .vc-panel-head{padding:22px}}
  @media(prefers-reduced-motion:reduce){.tp9m2vc .vc-send{transition:none}}
  `}</style>
  <div className="vc-layout">
   <div className="vc-copy"><p className="vc-eyebrow">08 / Entre em contato</p><h2 className="vc-title" id="tp9m2vc-heading">Vamos conversar sobre <em>seu veículo.</em></h2>
    <p className="vc-description">Descreva o que precisa e prepare uma solicitação para o canal oficial de atendimento cadastrado. Nenhum orçamento ou agendamento é confirmado automaticamente.</p>
    <ul className="vc-benefits">
     <li><CheckCircle2 size={22} aria-hidden="true"/>Informe seu veículo e sua necessidade com clareza.</li>
     <li><ClipboardList size={22} aria-hidden="true"/>Consulte serviços, disponibilidade e orientações da equipe.</li>
     <li><ShieldCheck size={22} aria-hidden="true"/>Confirme diretamente preços, condições e prazos antes de autorizar o serviço.</li>
    </ul>
    <div className="vc-channels"><p className="vc-channel-title">Canais oficiais cadastrados</p>
     <div className="vc-channel-list">{safePhone&&<a className="vc-channel" href={"https://wa.me/"+safePhone} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true"/>WhatsApp</a>}
      {safeEmail&&<a className="vc-channel" href={"mailto:"+safeEmail}><Mail size={18} aria-hidden="true"/>{safeEmail}</a>}
      {!hasContact&&<p className="vc-channel-empty">Nenhum WhatsApp ou e-mail foi cadastrado para atendimento.</p>}
     </div>
    </div>
   </div>
   <div className="vc-panel"><div className="vc-panel-head"><h3>Solicite uma avaliação</h3><p>Preencha os campos abaixo para preparar sua mensagem. Você confirma o envio no aplicativo escolhido.</p></div>
    <form className="vc-form" onSubmit={submit}>
     <div className="vc-fields">
      <div className="vc-field"><label htmlFor="tp9m2vc-name">Nome completo <span>*</span></label><input id="tp9m2vc-name" name="name" required autoComplete="name" maxLength={120} placeholder="Seu nome" value={name} onChange={e=>setName(e.target.value)}/></div>
      <div className="vc-field"><label htmlFor="tp9m2vc-return">E-mail ou telefone para retorno <span>*</span></label><input id="tp9m2vc-return" name="return" required maxLength={150} placeholder="Seu contato" value={returnContact} onChange={e=>setReturnContact(e.target.value)}/></div>
      <div className="vc-field"><label htmlFor="tp9m2vc-vehicle">Veículo / modelo e ano <span>*</span></label><input id="tp9m2vc-vehicle" name="vehicle" required maxLength={150} placeholder="Ex.: Sedan, 2022" value={vehicle} onChange={e=>setVehicle(e.target.value)}/></div>
      <div className="vc-field"><label htmlFor="tp9m2vc-service">Serviço desejado <span>*</span></label><select id="tp9m2vc-service" name="service" required value={service} onChange={e=>setService(e.target.value)}><option value="">Escolha o serviço</option>{options.map(item=><option key={item} value={item}>{item}</option>)}</select></div>
      <div className="vc-field full"><label htmlFor="tp9m2vc-details">Descreva sua necessidade <span>*</span></label><textarea id="tp9m2vc-details" name="details" rows={4} required maxLength={2500} placeholder="O que está acontecendo com o seu veículo?" value={details} onChange={e=>setDetails(e.target.value)}/></div>
     </div>
     {safePhone&&safeEmail&&<div className="vc-field"><label htmlFor="tp9m2vc-channel">Canal para preparar a mensagem</label><select id="tp9m2vc-channel" value={channel} onChange={e=>setChannel(e.target.value==="email"?"email":"whatsapp")}><option value="whatsapp">WhatsApp cadastrado</option><option value="email">E-mail cadastrado</option></select></div>}
     <p className="vc-note">{hasContact?"O formulário apenas prepara a solicitação. Revise e confirme o envio no aplicativo de WhatsApp ou e-mail.":"O formulário ficará disponível quando a empresa cadastrar um WhatsApp ou e-mail oficial."}</p>
     <button type="submit" className="vc-send" disabled={!hasContact}>{hasContact?"Preparar solicitação":"Canal não configurado"} <ArrowUpRight size={19} aria-hidden="true"/></button>
     {status&&<p role="status" className="vc-status">{status}</p>}
     {manualUrl&&<a className="vc-manual" href={manualUrl} target={chosen==="whatsapp"?"_blank":undefined} rel={chosen==="whatsapp"?"noopener noreferrer":undefined}>Abrir mensagem preparada manualmente</a>}
     <p className="vc-privacy">Os dados não são enviados pelo site. Eles compõem a mensagem no seu navegador para o aplicativo de contato.</p>
    </form>
   </div>
  </div>
 </section>;
}
