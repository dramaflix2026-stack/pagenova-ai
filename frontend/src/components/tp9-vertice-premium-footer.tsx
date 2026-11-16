"use client";

import {ArrowRight,ArrowUp,Mail,MapPin,MessageCircle,Wrench} from "lucide-react";

type Props={brand:string;niche:string;email?:string;whatsapp?:string;address?:string};

const navigation=[
 {label:"Início",href:"#tp9-inicio"},
 {label:"Nossos serviços",href:"#tp9-servicos"},
 {label:"Sobre nós",href:"#tp9-sobre"},
 {label:"Nossos diferenciais",href:"#tp9-diferenciais"},
 {label:"Como funciona",href:"#tp9-processo"},
 {label:"Galeria automotiva",href:"#tp9-galeria"},
 {label:"Perguntas frequentes",href:"#tp9-faq"},
 {label:"Solicite um orçamento",href:"#tp9-orcamento"},
];

const services=[
 "Revisão preventiva",
 "Óleo e filtros",
 "Freios e suspensão",
 "Diagnóstico eletrônico",
 "Ar-condicionado",
 "Alinhamento e balanceamento",
];

export function TP9VerticePremiumFooter({brand,niche,email,whatsapp,address}:Props){
 const phone=(whatsapp||"").replace(/\D/g,"");
 const validPhone=phone.length>=10&&phone.length<=15?phone:undefined;
 const validMail=email?.trim()&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())?email.trim():undefined;
 const validAddress=address?.trim()||undefined;
 const mapLink=validAddress?"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(validAddress):undefined;
 const hasContact=Boolean(validPhone||validMail);
 return <footer id="tp9-rodape" className="pn-vfooter" aria-label={"Rodapé de "+brand}>
 <style>{`
 .pn-t9f .pn-vfooter{--vf-orange:#fa7135;--vf-background:#0a1012;--vf-text:#f4f7f4;--vf-muted:#a8b7af;--vf-stroke:#ffffff25;background:radial-gradient(ellipse at 92% 2%,#27303477,transparent 45%),var(--vf-background);color:var(--vf-text);width:100%;max-width:100%;overflow:hidden;position:relative;font-family:Inter,Arial,sans-serif;padding:0 clamp(20px,6vw,96px)}
 .pn-t9f .pn-vfooter *{box-sizing:border-box}
 .pn-t9f .pn-vfooter:before{content:"";position:absolute;top:0;left:0;width:100%;height:3px;background:linear-gradient(90deg,var(--vf-orange) 0%,var(--vf-orange) 24%,#fa713529 60%,transparent)}
 .pn-t9f .pn-vfooter-shell{max-width:1420px;margin:0 auto}
 .pn-t9f .pn-vfooter-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,.83fr) minmax(0,.92fr) minmax(0,1.08fr);gap:clamp(24px,4.2vw,66px);padding:clamp(65px,7vw,105px) 0 clamp(70px,7vw,105px)}
 .pn-t9f .pn-vfooter-brand{min-width:0}
 .pn-t9f .pn-vfooter-logo{display:inline-flex;gap:13px;align-items:center;min-width:0;text-decoration:none;color:#fff;margin:0 0 28px}
 .pn-t9f .pn-vfooter-logo-badge{display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:8px;background:var(--vf-orange);color:#101516;font-size:31px;line-height:1;font-weight:1000;letter-spacing:-.09em;transform:skew(-5deg)}
 .pn-t9f .pn-vfooter-logo-text{display:flex;flex-direction:column;gap:4px;line-height:1}
 .pn-t9f .pn-vfooter-logo-text strong{font-size:clamp(19px,2vw,26px);font-weight:950;letter-spacing:.055em;line-height:1.1;color:#fff}
 .pn-t9f .pn-vfooter-logo-text small{font-size:10px;letter-spacing:.25em;font-weight:850;color:var(--vf-orange)}
 .pn-t9f .pn-vfooter-tagline{max-width:330px;margin:0;color:#b8c8bf;font-size:14px;line-height:1.85}
 .pn-t9f .pn-vfooter-brand-accent{display:flex;align-items:center;gap:12px;margin:28px 0 0;color:var(--vf-orange);font-size:10px;letter-spacing:.16em;font-weight:850;text-transform:uppercase}
 .pn-t9f .pn-vfooter-brand-accent:before{content:"";height:2px;width:28px;background:var(--vf-orange)}
 .pn-t9f .pn-vfooter-heading{margin:0 0 26px;font:900 12px/1.4 Inter,Arial,sans-serif;text-transform:uppercase;letter-spacing:.18em;color:var(--vf-orange)}
 .pn-t9f .pn-vfooter-links{display:flex;flex-direction:column;align-items:flex-start;gap:16px;margin:0;padding:0;list-style:none}
 .pn-t9f .pn-vfooter-links a{display:inline-flex;align-items:center;gap:8px;color:#d5dfd9;text-decoration:none;font-size:14px;line-height:1.5;font-weight:570;transition:color .2s,transform .2s}
 .pn-t9f .pn-vfooter-links a:hover{color:var(--vf-orange);transform:translateX(3px)}
 .pn-t9f .pn-vfooter-service-link{display:flex;align-items:center;gap:9px}
 .pn-t9f .pn-vfooter-service-link:before{content:"";display:block;width:5px;height:5px;border-radius:50%;background:var(--vf-orange);flex:none}
 .pn-t9f .pn-vfooter-contact-list{display:flex;flex-direction:column;gap:16px}
 .pn-t9f .pn-vfooter-contact{display:flex;align-items:flex-start;gap:11px;color:#d5e0d8;line-height:1.65;font-size:14px;min-width:0}
 .pn-t9f .pn-vfooter-contact svg{flex:none;color:var(--vf-orange);margin-top:3px}
 .pn-t9f .pn-vfooter-contact a{color:#d5e0d8;text-decoration:none;min-width:0;overflow-wrap:anywhere}
 .pn-t9f .pn-vfooter-contact a:hover{color:var(--vf-orange)}
 .pn-t9f .pn-vfooter-no-contact{font-size:13px;line-height:1.7;color:#a5b6ac;margin:0}
 .pn-t9f .pn-vfooter-contact-heading{font-size:10px;color:#8fa299;text-transform:uppercase;letter-spacing:.12em;font-weight:850;margin:12px 0 0}
 .pn-t9f .pn-vfooter-address{font-size:13px;line-height:1.65;color:#b4c2b9;margin:0;overflow-wrap:anywhere}
 .pn-t9f .pn-vfooter-name-area{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;border-top:1px solid var(--vf-stroke);border-bottom:1px solid var(--vf-stroke);padding:clamp(21px,3vw,42px) 0;overflow:hidden}
 .pn-t9f .pn-vfooter-signature{font:950 clamp(60px,12.3vw,180px)/.95 Inter,Arial,sans-serif;letter-spacing:-.095em;color:#f6f7f4;max-width:100%;margin:0;white-space:nowrap;transform:translateX(-.015em)}
 .pn-t9f .pn-vfooter-signature-accent{color:var(--vf-orange)}
 .pn-t9f .pn-vfooter-top-link{display:inline-flex;align-items:center;justify-content:center;gap:12px;flex:none;min-height:49px;padding:12px 15px;border:1px solid #fa71358c;border-radius:7px;background:#fa713515;color:#fff;font-size:12px;font-weight:850;text-decoration:none;transition:background .2s,transform .2s}
 .pn-t9f .pn-vfooter-top-link svg{color:var(--vf-orange)}
 .pn-t9f .pn-vfooter-top-link:hover{background:#fa713536;transform:translateY(-3px)}
 .pn-t9f .pn-vfooter-bottom{display:flex;align-items:center;justify-content:space-between;gap:14px 25px;padding:25px 0 34px;color:#92a59b;font-size:12px;line-height:1.6;flex-wrap:wrap}
 .pn-t9f .pn-vfooter-bottom p{margin:0}
 .pn-t9f .pn-vfooter-bottom strong{color:#d5e0d7;font-weight:800}
 .pn-t9f .pn-vfooter :is(a,button):focus-visible{outline:3px solid #ffbe97;outline-offset:4px}
 @media(max-width:1120px){.pn-t9f .pn-vfooter-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.pn-t9f .pn-vfooter-brand{grid-column:1/-1}.pn-t9f .pn-vfooter-tagline{max-width:620px}.pn-t9f .pn-vfooter-signature{font-size:clamp(56px,12vw,125px)}}
 @media(max-width:720px){.pn-t9f .pn-vfooter-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:42px 22px;padding:62px 0 55px}.pn-t9f .pn-vfooter-brand{grid-column:1/-1}.pn-t9f .pn-vfooter-contact-column{grid-column:1/-1}.pn-t9f .pn-vfooter-name-area{flex-direction:column;align-items:stretch;gap:23px}.pn-t9f .pn-vfooter-signature{font-size:clamp(50px,13vw,92px)}.pn-t9f .pn-vfooter-top-link{align-self:flex-end}}
 @media(max-width:430px){.pn-t9f .pn-vfooter-grid{grid-template-columns:1fr;gap:35px}.pn-t9f .pn-vfooter-brand,.pn-t9f .pn-vfooter-contact-column{grid-column:auto}.pn-t9f .pn-vfooter-signature{font-size:clamp(48px,12.4vw,65px)}.pn-t9f .pn-vfooter-bottom{flex-direction:column;align-items:flex-start}.pn-t9f .pn-vfooter-name-area{padding:26px 0}}
 @media(prefers-reduced-motion:reduce){.pn-t9f .pn-vfooter a{transition:none}}
 `}</style>
 <div className="pn-vfooter-shell">
  <div className="pn-vfooter-grid">
   <div className="pn-vfooter-brand">
    <a className="pn-vfooter-logo" href="#tp9-inicio" aria-label={"Voltar ao início de "+brand}>
     <span className="pn-vfooter-logo-badge" aria-hidden="true">V</span>
     <span className="pn-vfooter-logo-text"><strong>VÉRTICE</strong><small>AUTO CENTER</small></span>
    </a>
    <p className="pn-vfooter-tagline">Cuidar de cada detalhe faz parte da nossa proposta. Conheça os serviços e converse sobre as necessidades do seu veículo.</p>
    <p className="pn-vfooter-brand-accent">Cuidado · Atenção · Transparência</p>
   </div>
   <nav aria-label="Navegação do rodapé">
    <h2 className="pn-vfooter-heading">Navegação</h2>
    <ul className="pn-vfooter-links">{navigation.map(item=><li key={item.href}><a href={item.href}>{item.label}</a></li>)}</ul>
   </nav>
   <nav aria-label="Serviços automotivos">
    <h2 className="pn-vfooter-heading">Serviços</h2>
    <ul className="pn-vfooter-links">{services.map(service=><li key={service}><a className="pn-vfooter-service-link" href="#tp9-servicos">{service}</a></li>)}</ul>
   </nav>
   <div className="pn-vfooter-contact-column">
    <h2 className="pn-vfooter-heading">Contato e localização</h2>
    <div className="pn-vfooter-contact-list">
     {validPhone&&<div className="pn-vfooter-contact"><MessageCircle size={18} aria-hidden="true"/><a href={"https://wa.me/"+validPhone} target="_blank" rel="noopener noreferrer">Conversar pelo WhatsApp</a></div>}
     {validMail&&<div className="pn-vfooter-contact"><Mail size={18} aria-hidden="true"/><a href={"mailto:"+validMail}>{validMail}</a></div>}
     {!hasContact&&<p className="pn-vfooter-no-contact">Os canais oficiais de atendimento ainda não foram cadastrados.</p>}
     {validAddress&&<><p className="pn-vfooter-contact-heading">Endereço cadastrado</p><div className="pn-vfooter-contact"><MapPin size={18} aria-hidden="true"/><span className="pn-vfooter-address">{validAddress}</span></div>{mapLink&&<a className="pn-vfooter-contact" href={mapLink} target="_blank" rel="noopener noreferrer"><ArrowRight size={18} aria-hidden="true"/>Ver no mapa</a>}</>}
    </div>
   </div>
  </div>
  <div className="pn-vfooter-name-area">
   <p className="pn-vfooter-signature" aria-label="Vértice Auto Center">VÉRTIC<span className="pn-vfooter-signature-accent">E</span></p>
   <a className="pn-vfooter-top-link" href="#tp9-inicio">Voltar ao topo <ArrowUp size={19} aria-hidden="true"/></a>
  </div>
  <div className="pn-vfooter-bottom"><p><strong>{brand}</strong> · {niche}</p><p>Informações comerciais e disponibilidade sujeitas à confirmação com a empresa.</p></div>
 </div>
 </footer>;
}
