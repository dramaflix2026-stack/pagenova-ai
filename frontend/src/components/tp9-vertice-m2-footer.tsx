"use client";

import {ArrowUp,ArrowUpRight,Mail,MapPin,MessageCircle} from "lucide-react";

type Props={brand:string;address?:string;email?:string;whatsapp?:string};
const nav=[
 ["Início","#tp9m2-home"],
 ["Nossa Essência","#tp9-sobre"],
 ["Nossos Serviços","#tp9-servicos"],
 ["Diferenciais","#tp9-diferenciais"],
 ["Como Funciona","#tp9-como-funciona"],
 ["Galeria Automotiva","#tp9-galeria"],
 ["Perguntas Frequentes","#tp9-faq"],
 ["Entre em Contato","#tp9-contato"]
] as const;
const services=["Revisão preventiva","Troca de óleo e filtros","Freios e suspensão","Diagnóstico eletrônico","Ar-condicionado automotivo","Alinhamento e balanceamento"];

export function TP9VerticeM2Footer({brand,address,email,whatsapp}:Props){
 const phone=(whatsapp||"").replace(/\D/g,"");
 const safePhone=phone.length>=10&&phone.length<=15?phone:undefined;
 const mail=(email||"").trim();
 const safeEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)?mail:undefined;
 const addr=(address||"").trim();
 return <footer className="tp9m2v-footer" id="tp9-rodape" aria-label={"Rodapé de "+brand}>
  <style>{`
  .tp9m2v-footer{--gold:#c9a36b;position:relative;background:radial-gradient(ellipse at 100% 0%,#32302342,transparent 45%),#080b09;color:#f3f5ee;padding:0 clamp(22px,7vw,118px);max-width:100%;width:100%;overflow:hidden;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #c9a36b5c}
  .tp9m2v-footer *{box-sizing:border-box}
  .tp9m2v-footer:before{position:absolute;content:"";height:4px;top:0;left:0;width:26%;background:var(--gold)}
  .tp9m2v-footer .vft-shell{max-width:1430px;margin:0 auto}
  .tp9m2v-footer .vft-top{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;border-bottom:1px solid #ffffff25;padding:clamp(40px,5vw,72px) 0 38px}
  .tp9m2v-footer .vft-top-message{display:flex;flex-direction:column;gap:9px}
  .tp9m2v-footer .vft-eyebrow{color:var(--gold);font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase}
  .tp9m2v-footer .vft-top-heading{margin:0;color:#fff;font:900 clamp(23px,3.3vw,44px)/1.13 Arial,Helvetica,sans-serif;letter-spacing:-.035em}
  .tp9m2v-footer .vft-cta{display:inline-flex;align-items:center;justify-content:center;gap:12px;min-height:53px;padding:15px 21px;color:#111714;background:var(--gold);border:1px solid var(--gold);border-radius:5px;text-decoration:none;text-transform:uppercase;font-size:12px;font-weight:900;letter-spacing:.055em;transition:transform .2s,background .2s}
  .tp9m2v-footer .vft-cta:hover{transform:translateY(-3px);background:#f0cd99}
  .tp9m2v-footer .vft-columns{display:grid;grid-template-columns:minmax(0,1.2fr) repeat(2,minmax(0,.85fr)) minmax(0,1fr);gap:clamp(24px,4vw,60px);padding:clamp(48px,5.5vw,83px) 0 clamp(54px,6vw,93px)}
  .tp9m2v-footer .vft-brand{min-width:0}
  .tp9m2v-footer .vft-brand-title{margin:0 0 22px;font:950 clamp(27px,3.3vw,45px)/1.05 Arial,Helvetica,sans-serif;letter-spacing:-.065em;color:#fff}
  .tp9m2v-footer .vft-brand-title em{font-style:normal;color:var(--gold)}
  .tp9m2v-footer .vft-description{color:#b9c4b9;font-size:14px;line-height:1.8;margin:0;max-width:335px}
  .tp9m2v-footer .vft-mini-label{margin:25px 0 0;color:var(--gold);font-size:10px;font-weight:850;letter-spacing:.14em;text-transform:uppercase}
  .tp9m2v-footer .vft-heading{color:var(--gold);font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:900;margin:4px 0 25px}
  .tp9m2v-footer .vft-list{display:grid;gap:14px;list-style:none;margin:0;padding:0}
  .tp9m2v-footer .vft-list li{margin:0}
  .tp9m2v-footer .vft-list a{display:inline-flex;align-items:center;gap:8px;color:#d7e0d4;font-size:13px;line-height:1.5;text-decoration:none;transition:color .2s,transform .2s}
  .tp9m2v-footer .vft-list a:hover{color:var(--gold);transform:translateX(4px)}
  .tp9m2v-footer .vft-services{display:grid;gap:14px;list-style:none;padding:0;margin:0}
  .tp9m2v-footer .vft-services li{font-size:13px;line-height:1.55;color:#cbd7c9;display:flex;gap:10px}
  .tp9m2v-footer .vft-services li:before{content:"";width:5px;height:5px;border-radius:50%;background:var(--gold);margin-top:7px;flex:none}
  .tp9m2v-footer .vft-contact{display:grid;gap:16px}
  .tp9m2v-footer .vft-contact-line{display:flex;align-items:start;gap:12px;min-width:0;font-size:13px;line-height:1.7;color:#d1dacd}
  .tp9m2v-footer .vft-contact-line svg{flex:none;color:var(--gold);margin-top:2px}
  .tp9m2v-footer .vft-contact-line a{color:inherit;text-decoration:none;overflow-wrap:anywhere;min-width:0}
  .tp9m2v-footer .vft-contact-line a:hover{color:var(--gold)}
  .tp9m2v-footer .vft-no-contact{color:#c1c9be;font-size:13px;line-height:1.7;margin:0}
  .tp9m2v-footer .vft-address-heading{color:var(--gold);font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:.09em;margin:7px 0 -5px}
  .tp9m2v-footer .vft-signature-row{border-top:1px solid #ffffff27;border-bottom:1px solid #ffffff27;display:flex;align-items:end;justify-content:space-between;gap:20px;padding:clamp(22px,3vw,42px) 0}
  .tp9m2v-footer .vft-signature{font:950 clamp(57px,11vw,158px)/.94 Arial,Helvetica,sans-serif;letter-spacing:-.09em;white-space:nowrap;margin:0;color:#f4f5f0}
  .tp9m2v-footer .vft-signature span{color:var(--gold)}
  .tp9m2v-footer .vft-top-link{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:12px;min-height:49px;padding:12px 16px;border:1px solid #c9a36b85;background:#c9a36b13;color:#f7f5e9;text-decoration:none;border-radius:6px;font-size:12px;font-weight:900}
  .tp9m2v-footer .vft-top-link svg{color:var(--gold)}
  .tp9m2v-footer .vft-top-link:hover{background:#c9a36b35}
  .tp9m2v-footer .vft-bottom{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px 22px;padding:26px 0 34px;color:#a7b4a6;font-size:12px;line-height:1.6}
  .tp9m2v-footer .vft-bottom p{margin:0}
  .tp9m2v-footer :is(a,button):focus-visible{outline:3px solid #f0c98d;outline-offset:4px}
  @media(max-width:1120px){.tp9m2v-footer .vft-columns{grid-template-columns:repeat(3,minmax(0,1fr))}.tp9m2v-footer .vft-brand{grid-column:1/-1}.tp9m2v-footer .vft-description{max-width:650px}.tp9m2v-footer .vft-signature{font-size:clamp(48px,10.5vw,120px)}}
  @media(max-width:720px){.tp9m2v-footer .vft-columns{grid-template-columns:repeat(2,minmax(0,1fr));gap:33px 22px}.tp9m2v-footer .vft-contact-column{grid-column:1/-1}.tp9m2v-footer .vft-signature-row{align-items:stretch;flex-direction:column}.tp9m2v-footer .vft-signature{font-size:clamp(50px,12vw,88px)}.tp9m2v-footer .vft-top-link{align-self:flex-end}}
  @media(max-width:460px){.tp9m2v-footer{padding:0 20px}.tp9m2v-footer .vft-columns{grid-template-columns:1fr}.tp9m2v-footer .vft-brand,.tp9m2v-footer .vft-contact-column{grid-column:auto}.tp9m2v-footer .vft-signature{font-size:clamp(46px,12.5vw,65px)}.tp9m2v-footer .vft-cta{width:100%}.tp9m2v-footer .vft-bottom{flex-direction:column;align-items:flex-start}}
  @media(prefers-reduced-motion:reduce){.tp9m2v-footer a{transition:none}}
  `}</style>
  <div className="vft-shell">
   <div className="vft-top"><div className="vft-top-message"><span className="vft-eyebrow">Sua próxima conversa começa aqui</span><h2 className="vft-top-heading">Seu veículo merece atenção.</h2></div><a href="#tp9-contato" className="vft-cta">Solicitar atendimento <ArrowUpRight size={19} aria-hidden="true"/></a></div>
   <div className="vft-columns">
    <div className="vft-brand"><p className="vft-brand-title">VÉRTICE <em>AUTO CENTER.</em></p><p className="vft-description">Uma apresentação dos serviços e cuidados automotivos. Consulte diretamente a equipe para confirmar disponibilidade, prazos e condições.</p><p className="vft-mini-label">Cuidado • Clareza • Confiança</p></div>
    <nav aria-label="Navegação do rodapé"><h3 className="vft-heading">Navegação</h3><ul className="vft-list">{nav.map(([label,href])=><li key={href}><a href={href}>{label}</a></li>)}</ul></nav>
    <div><h3 className="vft-heading">Serviços</h3><ul className="vft-services">{services.map(x=><li key={x}>{x}</li>)}</ul></div>
    <div className="vft-contact-column"><h3 className="vft-heading">Contato e localização</h3><div className="vft-contact">
     {safePhone&&<div className="vft-contact-line"><MessageCircle size={18} aria-hidden="true"/><a href={"https://wa.me/"+safePhone} target="_blank" rel="noopener noreferrer">Conversar pelo WhatsApp</a></div>}
     {safeEmail&&<div className="vft-contact-line"><Mail size={18} aria-hidden="true"/><a href={"mailto:"+safeEmail}>{safeEmail}</a></div>}
     {!safePhone&&!safeEmail&&<p className="vft-no-contact">Os canais oficiais ainda não foram cadastrados.</p>}
     {addr&&<><p className="vft-address-heading">Endereço informado</p><div className="vft-contact-line"><MapPin size={18} aria-hidden="true"/><span>{addr}</span></div></>}
    </div></div>
   </div>
   <div className="vft-signature-row"><p className="vft-signature" aria-label="Vértice Auto Center">VÉRTIC<span>E</span></p><a href="#tp9m2-home" className="vft-top-link">Voltar ao topo <ArrowUp size={19} aria-hidden="true"/></a></div>
   <div className="vft-bottom"><p>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</p><p>Manutenção automotiva · Informações sujeitas a confirmação</p></div>
  </div>
 </footer>;
}
